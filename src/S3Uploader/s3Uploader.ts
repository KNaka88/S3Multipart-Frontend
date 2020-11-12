import { AxiosResponse } from "axios";
import { S3UploaderConfig } from "./Interfaces/s3-uploader-config";
import { S3UploadService } from "./Services/s3-upload-service";
import { CreatePresignedUrlsRequest } from "./Interfaces/create-presigned-urls-requests";
import { CreatePresignedUrlsResponse } from "./Interfaces/create-presigned-urls-response";
import { PutMultiPartFileresponse } from "./Interfaces/put-multipart-file-response";
import { PartETag } from "./Interfaces/complete-multipart-upload-request";
import { FileService } from "./Services/file-service";
import { RetryService } from "./Services/retry-service";

class S3Uploader {
    private readonly s3UploadService: S3UploadService;
    private readonly fileService: FileService;
    private readonly numberOfRetry: number;
    private readonly retryService: RetryService;
    private uploadId = "";    
    private file: File;

    constructor(file: File, config: S3UploaderConfig){
        this.file = file;
        this.s3UploadService = new S3UploadService(config.urlPaths);
        this.fileService = new FileService();
        this.numberOfRetry = config.numberOfRetry;
        this.retryService = new RetryService();
    }

    public async Upload(folderName: string = "") {
        const fileName = this.file.name;
        const startMultiPartResponse = await this.retryService.withRetry(this.numberOfRetry, () => {
            return this.s3UploadService.StartMultiPartUpload({ fileName, folderName });
        });
        this.uploadId = startMultiPartResponse.data;       

        const partETags = await this.uploadFileUsingPresignedUrls(fileName, folderName);

        await this.retryService.withRetry(this.numberOfRetry, () => {
            return this.s3UploadService.ComplteMultiPartUpload({
                folderName,
                fileName,
                partETags,
                uploadId: this.uploadId
            });
        });
    }

    private async uploadFileUsingPresignedUrls(fileName: string, folderName: string): Promise<Array<PartETag>> {
        const { fileChunkSize, numberOfChunks } = this.fileService.calculateChunks(this.file);
        const partETags : Array<PartETag> = [];

        for (const requests of this.createPresignedRequestSets(numberOfChunks, fileName, folderName)) {
            const res = await this.retryService.withRetry(this.numberOfRetry, async () => {
                return await this.s3UploadService.CreatePresignedUrls(requests);
            });
            const presignedUrlsResponses = res.data;

            const muiltiPartUploadRequests = presignedUrlsResponses.map(request => this.upload(request, fileChunkSize, numberOfChunks));
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

    private* createPresignedRequestSets(numberOfChunks: number, fileName: string, folderName: string) {
        const concurrency = numberOfChunks < 10000 ? 3 : 1;

        let partNumbers: Array<number> = [];
        let tempCounter = 0;
        for (let partNumber = 1; partNumber < numberOfChunks + 1; partNumber++) {
            partNumbers.push(partNumber);
            tempCounter++;

            if (tempCounter === concurrency || partNumber === numberOfChunks) {
                const createPresignedUrlsRequest = {
                    partNumbers,
                    fileName,
                    folderName,
                    uploadId: this.uploadId,
                    contentType: this.file.type
                } as CreatePresignedUrlsRequest;
                yield createPresignedUrlsRequest;
                partNumbers = [];
                tempCounter = 0;
            }
        }
    }
    
    private async upload(
        request: CreatePresignedUrlsResponse, fileChunkSize: number, numberOfChunks: number)
        : Promise<AxiosResponse<PutMultiPartFileresponse>> {
            const blob = this.fileService.createBlob(this.file, fileChunkSize, request.partNumber, numberOfChunks);

            return this.retryService.withRetry(this.numberOfRetry, () => {
                return this.s3UploadService.PutMultiPartFile({ 
                    presignedUrl: request.presignedUrl, 
                    blob,
                    headers: { 'Content-Type': this.file.type }
                })
            });
        }
    }

export { S3Uploader };