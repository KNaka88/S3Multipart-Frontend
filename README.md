# S3 Multipart-Frontend
This repo shows an example of using presigned url with multi part upload (Frontend).

### Setup

* `npm start` to start local server with SSL
* Follow [this blog](https://medium.com/@danielgwilson/https-and-create-react-app-3a30ed31c904) how to set up HTTPS locally.

### How to implement backend?
[See S3 Backend](https://github.com/KNaka88/S3Backend)

### TODO
* Add input form to accept bucket name
  * Meanwhile, please manually update [this line](https://github.com/KNaka88/S3Multipart-Frontend/blob/master/src/App.js#L45)

```
  s3Uploader.Upload("YOUR-BUCKET-NAME", "");
```