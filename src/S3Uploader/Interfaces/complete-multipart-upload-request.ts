export interface CompleteMultiPartUploadRequest {
    bucketName: string,
    key: string,
    partETags: Array<PartETag>,
    uploadId: string
}

export interface PartETag {
    eTag: string;
    partNumber: number;
}