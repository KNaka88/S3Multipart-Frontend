import { UrlPath } from "./url-path";

export interface S3UploaderConfig {
    urlPaths: UrlPath;
    numberOfRetry: number;
}