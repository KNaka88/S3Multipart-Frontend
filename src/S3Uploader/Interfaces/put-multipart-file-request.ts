export interface PutMultiPartFileRequest {
    presignedUrl: string;
    blob: Blob;
    headers : Object;
}