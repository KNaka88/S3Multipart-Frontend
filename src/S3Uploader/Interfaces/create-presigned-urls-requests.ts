export interface CreatePresignedUrlsRequest {
    fileName: string;
    folderName: string;
    partNumbers: Array<number>;
    uploadId: string;
    contentType: string;
}