import React, { Component} from 'react';
import './App.css';
import { S3Uploader } from './S3Uploader/s3Uploader';

export default class App extends Component {
	constructor(props) {
		super(props)
    this.state = {
      selectedFile: null,
      uploadId: '',
      fileName: '',
      bucketName: '',
      backendUrl: 'https://localhost:44362/api/s3'
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
    const baseUri = "https://localhost:44362/api/s3/";
    const config = {
      urlPaths: {
        startMultiPartUploadUrl: baseUri + "Start_MultiPart",
        createPresignedUrl: baseUri + "Create_PresignedUrl",
        completeMultiPartUploadUrl: baseUri + "Complete_MultiPartUpload"
      },
      numberOfRetry: 3
    };

    const s3Uploader = new S3Uploader(this.state.selectedFile, config);
    s3Uploader.Upload("", "");
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