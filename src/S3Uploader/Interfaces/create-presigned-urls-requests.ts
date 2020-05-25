export interface CreatePresignedUrlsRequest {
    key: string;
    bucketName: string;
    partNumbers: Array<number>;
    uploadId: string;
    contentType: string;
}