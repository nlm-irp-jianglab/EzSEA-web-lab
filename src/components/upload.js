// Form for uploading files to backend server
import React, { useState } from "react";
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000/uploadFile';

function Upload() {

    const [file, setFile] = useState();
    const [uploadedFileURL, setUploadedFileURL] = useState(null)

    function handleChange(event) {
        setFile(event.target.files[0])
    }
    function handleSubmit(event) {
        event.preventDefault()
        const url = SERVER_URL;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
            },
        };
        axios.post(url, formData, config).then((response) => {
            setUploadedFileURL(response.data.fileUrl);
        });
    }

    return (
        <div className="Upload">
            <form onSubmit={handleSubmit}>
                <h1>React File Upload</h1>
                <input type="file" onChange={handleChange} />
                <button type="submit">Upload</button>
            </form>
            {uploadedFileURL && <img src={uploadedFileURL} alt="Uploaded content" />}
        </div>
    );
}

export default Upload;