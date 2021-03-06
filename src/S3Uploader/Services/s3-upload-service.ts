import { UrlPath } from "../Interfaces/url-path";
import axios, { AxiosPromise } from "axios";
import { CreatePresignedUrlsRequest } from "../Interfaces/create-presigned-urls-requests";
import { CompleteMultiPartUploadRequest } from "../Interfaces/complete-multipart-upload-request";
import { CreatePresignedUrlsResponse } from "../Interfaces/create-presigned-urls-response";
import { StartMultiPartUploadRequest } from "../Interfaces/start-multi-part-upload-request";
import { PutMultiPartFileRequest } from "../Interfaces/put-multipart-file-request";
import { PutMultiPartFileresponse } from "../Interfaces/put-multipart-file-response";

class S3UploadService {
    private readonly startMultipartUploadUrl: string;
    private readonly createPresignedUrl: string;
    private readonly completeMultiPartUploadUrl: string;

    constructor(urlPaths: UrlPath){
        this.startMultipartUploadUrl = urlPaths.startMultiPartUploadUrl;
        this.createPresignedUrl = urlPaths.createPresignedUrl;
        this.completeMultiPartUploadUrl = urlPaths.completeMultiPartUploadUrl;
    };

    public StartMultiPartUpload({ fileName, folderName = "" }: StartMultiPartUploadRequest): AxiosPromise {
        return axios.post(this.startMultipartUploadUrl, {
            fileName,
            folderName
        });
    }

    public CreatePresignedUrls({ fileName, folderName, uploadId, partNumbers, contentType }: CreatePresignedUrlsRequest): AxiosPromise<Array<CreatePresignedUrlsResponse>> {
        return axios.post<Array<CreatePresignedUrlsResponse>>(this.createPresignedUrl, {
            uploadId,
            fileName,
            folderName,
            contentType,
            partNumbers
        });
    }

    public PutMultiPartFile({ presignedUrl, blob, headers} : PutMultiPartFileRequest) {
        return axios.put<PutMultiPartFileresponse>(presignedUrl, blob, {
            headers
        });
    }

    public ComplteMultiPartUpload({ fileName, folderName, partETags, uploadId } : CompleteMultiPartUploadRequest): AxiosPromise<void> {
        return axios.post<void>(this.completeMultiPartUploadUrl, {
            fileName,
            folderName,
            partETags,
            uploadId
        });
    }
}

export { S3UploadService };