class FileService {    
    public calculateChunks(file: File) {
        const MAXIMUM_MULTIPART_PARTS_SIZE = 10000; // AWS hard limit
        let fileChunkSize = 10485760; // 10MB as default 
        let numberOfChunks = Math.floor(file.size / fileChunkSize) + 1;
        let fileSize = file.size;

        if (numberOfChunks > MAXIMUM_MULTIPART_PARTS_SIZE) {
            fileChunkSize = file.size / 10000;
            numberOfChunks = 10000;
        }

        return { fileChunkSize, numberOfChunks, fileSize };
    }

    public createBlob(file: File, fileChunkSize: number, multiPartNumber: number, numberOfChunks: number): Blob {
        const start = (multiPartNumber - 1) * fileChunkSize;
        const end = multiPartNumber * fileChunkSize;

        return (multiPartNumber < numberOfChunks) ? file.slice(start, end) : file.slice(start);
    }
}

export { FileService };