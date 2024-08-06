import React, { useState } from "react";
import { ProteinLogo } from 'logojs-react';

function LogoUpload() {
    const [fastaContent, setFastaContent] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFastaContent(e.target.result); // Set the content to state
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            {fastaContent && <Logo fasta={fastaContent} />} {/* Pass content to Dnalogo */}
        </div>
    );
}

// Generating logo throws a warning. Invalid property passed into the svg?
const Logo = ({ fasta }) => {
    return (
        <div> 
            <ProteinLogo fasta={fasta} />
        </div>
    );
};

export default LogoUpload;