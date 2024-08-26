import React, { useState, useRef } from "react";
import SkylignComponent from "../components/skylign-component";
import MolstarViewer from "../components/molstar";

function LogoUpload() {
    const [status, setStatus] = useState("");  // State to track the status of the upload/fetch process
    const [uploadedFiles, setUploadedFiles] = useState([]);  // State to keep track of uploaded files' JSON data
    const [isUploaded, setIsUploaded] = useState(false);  // State to track if files have been uploaded
    const [hoveredResidue, setHoveredResidue] = useState(null);
    const [selectedResidue, setSelectedResidue] = useState(null);
    const logoRefs = useRef([]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 4) {
            setStatus("You can only upload up to 4 files.");
        } else {
            setStatus("Uploading files...");
            files.forEach(file => upload(file)); // Upload each file
            setIsUploaded(true);  // Set the state to hide the input after files are selected
        }
    };

    const upload = (file) => {
        var data = new FormData(); // multipart/form-data object
        data.append('file', file);
        data.append('processing', 'observed');

        setStatus(`Generating logo for ${file.name}...`);  // Update status to indicate the logo is being generated

        fetch('https://skylign.org', {
            method: 'POST',
            headers: {
                "Accept": "application/json"
            },
            body: data
        }).then(
            response => response.json()
        ).then(
            success => {
                setStatus(`Fetching logo for ${file.name}...`);  // Update status to indicate the logo is being fetched
                getLogoJSON(success, file.name);
            }
        ).catch(
            error => {
                console.log(error);
                setStatus(`Error generating logo for ${file.name}.`);  // Handle error
            }
        );
    };

    const getLogoJSON = (success, fileName) => {
        fetch(success.url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => response.json())
            .then(data => {
                setStatus(`Logo fetched successfully for ${fileName}.`);
                setUploadedFiles(prevFiles => [...prevFiles, { fileName, data }]);  // Store the JSON content for each file
            })
            .catch(error => {
                console.error('Error:', error);
                setStatus(`Error fetching logo for ${fileName}.`);  // Handle error
            });
    };

    const handleColumnClick = (index, column) => {
        logoRefs.current.forEach(logoRef => {
            logoRef.scrollToColumn(index);
        });
        setSelectedResidue(index);
    };

    const handleColumnHover = (index) => {
        setHoveredResidue(index);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {!isUploaded && (
                    <div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept=".fa,.fasta"  // Accepting only specific file types, you can adjust as needed
                    />
                    <p>Upload up to 4 fasta files for rendering sequence logos and structure</p>
                    </div>
                )}
                <span><p>{status}</p></span>  {/* Display the current status */}
            </div>
            {uploadedFiles.length > 0 && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                style={{
                                    boxSizing: 'border-box',
                                    minWidth: '300px',
                                }}
                            >
                                <h4>{file.fileName}</h4>
                                {/* Render or use the logo data as needed */}
                                <SkylignComponent
                                    ref={(element) => logoRefs.current[index] = element}
                                    logoData={file.data}
                                    name={file.fileName}
                                    onColumnClick={handleColumnClick}
                                    onColumnHover={handleColumnHover} 
                                />
                            </div>
                        ))}
                    </div>
                    <div className="pvdiv" style={{ alignItems: 'center' }}>
                        <MolstarViewer selectedResidue={selectedResidue} hoveredResidue={hoveredResidue} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogoUpload;
