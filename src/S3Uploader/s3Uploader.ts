import { AxiosResponse } from "axios";
import { S3UploaderConfig } from "./Interfaces/s3-uploader-config";
import { S3UploadService } from "./Services/s3-upload-service";
import { CreatePresignedUrlsRequest } from "./Interfaces/create-presigned-urls-requests";
import { CreatePresignedUrlsResponse } from "./Interfaces/create-presigned-urls-response";
import { PutMultiPartFileresponse } from "./Interfaces/put-multipart-file-response";
import { PartETag } from "./Interfaces/complete-multipart-upload-request";

class S3Uploader {
    private readonly s3UploadService: S3UploadService;
    private readonly numberOfRetry: number;
    private uploadId = "";    
    private file: File;

    constructor(file: File, config: S3UploaderConfig){
        this.file = file;
        this.s3UploadService = new S3UploadService(config.urlPaths);
        this.numberOfRetry = config.numberOfRetry;
    }

    public async Upload(bucketName: string, keyPrefix: string) {
        const key = keyPrefix ? `${keyPrefix}/${this.file.name}` : this.file.name;
        const startMultiPartResponse = await this.s3UploadService.StartMultiPartUpload({ bucketName, key });
        this.uploadId = startMultiPartResponse.data.uploadId;        

        const partETags = await this.uploadFileUsingPresignedUrls(key, bucketName);

        await this.s3UploadService.ComplteMultiPartUpload({
            bucketName,
            key,
            partETags,
            uploadId: this.uploadId
        });
    }

    private async uploadFileUsingPresignedUrls(key: string, bucketName: string): Promise<Array<PartETag>> {
        const { fileChunkSize, numberOfChunks } = this.calculateChunks();
        const partETags : Array<PartETag> = [];

        for (const requests of this.createPresignedRequestSets(numberOfChunks, key, bucketName)) {
            const res = await this.s3UploadService.CreatePresignedUrls(requests);
            const presignedUrlsResponses = res.data;

            const muiltiPartUploadRequests = presignedUrlsResponses.map(request => this.uploadWithRetry(request, fileChunkSize, numberOfChunks));
            const mutliPartUploadResponses = await Promise.all(muiltiPartUploadRequests);

            mutliPartUploadResponses.forEach((response, index) => {
                partETags.push({
                    eTag: response.headers.etag,
                    partNumber: requests.partNumbers[index]
                });
            });
        }

        return partETags;
    }

    private calculateChunks() {
        const MAXIMUM_MULTIPART_PARTS_SIZE = 10000; // AWS hard limit
        let fileChunkSize = 5242880; // 5MB as default 
        let numberOfChunks = Math.floor(this.file.size / fileChunkSize) + 1;

        if (numberOfChunks > MAXIMUM_MULTIPART_PARTS_SIZE) {
            fileChunkSize = this.file.size / 10000;
            numberOfChunks = 10000;
        }

        return { fileChunkSize, numberOfChunks };
    }

    private* createPresignedRequestSets(numberOfChunks: number, key: string, bucketName: string) {
        const concurrency = numberOfChunks < 10000 ? 3 : 1;

        let partNumbers: Array<number> = [];
        let tempCounter = 0;
        for (let partNumber = 1; partNumber < numberOfChunks + 1; partNumber++) {
            partNumbers.push(partNumber);
            tempCounter++;

            if (tempCounter === concurrency || partNumber === numberOfChunks) {
                const createPresignedUrlsRequest = {
                    key,
                    bucketName,
                    partNumbers,
                    uploadId: this.uploadId,
                    contentType: this.file.type
                } as CreatePresignedUrlsRequest;
                yield createPresignedUrlsRequest;
                partNumbers = [];
                tempCounter = 0;
            }
        }
    }

    private async uploadWithRetry(request: CreatePresignedUrlsResponse, fileChunkSize: number, numberOfChunks: number, iteration = 0): Promise<AxiosResponse<PutMultiPartFileresponse>> {
        try {
            const blob = this.createBlob(fileChunkSize, request.partNumber, numberOfChunks);
            return await this.s3UploadService.PutMultiPartFile({ 
                presignedUrl: request.presignedUrl.replace("https://localstack", "https://localhost"), 
                blob,
                headers: { 'Content-Type': this.file.type }
            });
        } catch (error) {
            const errorIs400s = error.code && parseInt(error.code) >= 400 && parseInt(error.code) < 500;

            if (iteration === this.numberOfRetry || errorIs400s) {
                throw new Error("Retry Failed");
            }
            return this.uploadWithRetry(request, fileChunkSize, numberOfChunks, iteration++);
        }
    }

    private createBlob(fileChunkSize: number, multiPartNumber: number, numberOfChunks: number): Blob {
        const start = (multiPartNumber - 1) * fileChunkSize;
        const end = multiPartNumber * fileChunkSize;

        return (multiPartNumber < numberOfChunks) ? this.file.slice(start, end) : this.file.slice(start);
    }
}

export { S3Uploader };