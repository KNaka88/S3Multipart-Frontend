import React, { Component } from 'react';
import { S3Uploader } from './S3Uploader/s3Uploader';

export default class App extends Component {
	constructor(props) {
		super(props)
    this.state = {
      selectedFile: null,
      fileName: '',
    }
  }

  async fileChangedHandler(event) {
    try {
      let selectedFile = event.target.files[0]
      let fileName = selectedFile.name
      this.setState({ selectedFile })
      this.setState({ fileName })
    } catch (err) {
      console.error(err, err.message)
    }
  }

  handleChange(event) {
    this.setState({ bucketName: event.target.value });
  }

  async startUpload(event) {
    event.preventDefault();
    const baseUri = "YOUR_API_GATEWAY_URL";
    const config = {
      urlPaths: {
        startMultiPartUploadUrl: baseUri + "/StartMultipartUpload",
        createPresignedUrl: baseUri + "/CreatePresignedUrl",
        completeMultiPartUploadUrl: baseUri + "/CompleteMultiPartUpload"
      },
      numberOfRetry: 3
    };

    const progressTracker = (fileProgress) => {
      console.log(`File: ${fileProgress.fileName} - Size: ${fileProgress.fileSize},  ${fileProgress.progress}% Complete`);
    };
    const s3Uploader = new S3Uploader(this.state.selectedFile, config, progressTracker);
    s3Uploader.Upload();
  }

    render() {
      return (
        <div>
          <form onSubmit={this.startUpload.bind(this)}>
            <div>
              <p>Upload Dataset:</p>
              <input type='file' id='file' onChange={this.fileChangedHandler.bind(this)} />
              <button type='submit'>
                Upload
              </button>
            </div>
          </form>
        </div>
      )
    }
}