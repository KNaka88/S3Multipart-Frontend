export interface CompleteMultiPartUploadRequest {
    fileName: string,
    folderName: string,
    partETags: Array<PartETag>,
    uploadId: string
}

export interface PartETag {
    eTag: string;
    partNumber: number;
}