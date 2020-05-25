import axios from 'axios';
import BACKEND_URL from './ServiceUrl';

export function startMultiPart({ bucketName, key }) {
    return axios.post(`${BACKEND_URL}/Start_MultiPart`, {
        bucketName,
        key
    })
}

export function createPresignedUrl({ key, bucketName, partNumber, uploadId, contentType }) {
    return axios.post(`${BACKEND_URL}/Create_PresignedUrl`, {
        key,
        bucketName,
        partNumber,
        uploadId,
        contentType
    });
}

export function uploadToS3({ presignedUrl, blob, headers }) {
    return axios.put(presignedUrl, blob, { headers });
}

