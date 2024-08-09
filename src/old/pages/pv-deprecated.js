import React, { useEffect, useRef, useState } from 'react';
import pv from 'bio-pv';
import Navbar from "../../components/navbar";

const ProteinViewer = () => {
    const viewerRef = useRef(null);
    const [viewer, setViewer] = useState(null);
    const [file, setFile] = useState(null);
    const [renderStyle, setRenderStyle] = useState('cartoon');
    const [structure, setStructure] = useState(null);

    useEffect(() => {
        if (viewerRef.current && !viewer) {
            const initializedViewer = pv.Viewer(viewerRef.current, {
                width: 'auto',
                height: 'auto',
                antialias: true,
                quality: 'medium',
                background: '#000000',
                outline: true,
            });
            setViewer(initializedViewer);

            // Load an initial protein structure (optional) - Couldn't load from /public, used url intead?
            pv.io.fetchPdb('https://files.rcsb.org/download/1R6A.pdb', (structure) => {
                setStructure(structure);
                console.log('Structure loaded:', structure);
                initializedViewer.cartoon('protein', structure);
                initializedViewer.autoZoom();
            });
        }
    }, [viewer]);

    useEffect(() => {
        if (file && viewer) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const pdbContent = e.target.result;
                const structure = pv.io.pdb(pdbContent);
                setRenderStyle('cartoon');
                setStructure(structure);
                viewer.clear();
                viewer.cartoon('protein', structure);
                viewer.autoZoom();
            };
            reader.readAsText(file);
        }
    }, [file, viewer]);

    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
        }
    };

    const toggleRenderStyle = () => {
        const styles = ['cartoon', 'tube', 'lines'];
        const nextStyle = styles[(styles.indexOf(renderStyle) + 1) % styles.length];
        setRenderStyle(nextStyle);
        console.log('Current render style:', renderStyle);
        console.log('Changing render style to:', nextStyle);

        if (viewer && structure) {
            viewer.clear();

            switch (nextStyle) {
                case 'cartoon':
                    viewer.cartoon('protein', structure);
                    break;
                case 'tube':
                    viewer.tube('protein', structure);
                    break;
                case 'lines':
                    viewer.lines('protein', structure);
                    break;
                default:
                    viewer.cartoon('protein', structure);
                    viewer.autoZoom();
            }
        }
    };

    return (
        <div>
            <Navbar pageId={"Protein Viewer"}/>
            <input type="file" accept=".pdb" onChange={handleFileChange} />
            <button
                onClick={toggleRenderStyle}
                style={{
                    padding: '10px 20px',
                    margin: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                Change Render Style (Current: {renderStyle})
            </button>
            <div
                ref={viewerRef}
                style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid black',
                    marginTop: '10px',
                }}
            ></div>
        </div>
    );
};

export default ProteinViewer;