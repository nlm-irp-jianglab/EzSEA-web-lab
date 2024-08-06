import React, { useEffect, useRef, useState } from 'react';
import { phylotree } from 'phylotree';
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import "../components/phylotree.css";

const Tol = () => {
    const treeRef = useRef(null);
    const [newickData, setNewickData] = useState(null);

    useEffect(() => {
        if (treeRef.current && newickData) {
            // Clear previous tree content
            treeRef.current.innerHTML = '';

            // Create a new tree
            const tree = new phylotree(newickData);

            // Render the tree directly into the referenced div
            tree.render({ // Use the actual DOM element
                'is-radial': true,
                'selectable': true,
                'zoom': true,
                'align-tips': true,
                'left-right-spacing': 'fit-to-size',
                'top-bottom-spacing': 'fit-to-size',
                height: 2000,
                width: 1000,
            });

            treeRef.current.appendChild(tree.display.show())
        }
    }, [newickData]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewickData(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <Navbar />
            <h1>Phylogenetic Tree Viewer (unstable)</h1>
            <br />
            <input type="file" accept=".nwk,.newick" onChange={handleFileChange} />
            <div
                id="tree"
                ref={treeRef}
                style={{ width: '2000px', height: '1000px', marginTop: '10px', border: '1px solid black' }}
            ></div>
        </div>
    );
};

export default Tol;
