import React, { useEffect, useRef, useState } from 'react';
import * as pt from 'phylotree';
import * as d3 from 'd3';
import { Rnd } from "react-rnd";
import Navbar from "../components/navbar";
import "../components/phylotree.css";
import SkylignComponent from "../components/skylign-component";
// Importing fasta files because I don't want to set up a server
// In practice, this would either be hosted on a server or maybe stored in a csv?
import n18 from '../components/task2/N18.json'
import n19 from '../components/task2/N19.json'
import n24 from '../components/task2/N24.json'
import n25 from '../components/task2/N25.json'
import n26 from '../components/task2/N26.json'
import n27 from '../components/task2/N27.json'
import n28 from '../components/task2/N28.json'
import n29 from '../components/task2/N29.json'

const logoFiles = {
    'N18': n18,
    'N19': n19,
    'N24': n24,
    'N25': n25,
    'N26': n26,
    'N27': n27,
    'N28': n28,
    'N29': n29,
};

const Tol = () => {
    const treeRef = useRef(null);
    const [newickData, setNewickData] = useState(null); // Initial state is null
    const [logoContent, setLogoContent] = useState(null);
    const [pipVisible, setPipVisible] = useState(false);
    const [selectBranch, setSelectBranch] = useState(null);

    // Load the default Newick tree from the public folder
    useEffect(() => {
        const fetchDefaultTree = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/in_ancestors.nwk`);
                const text = await response.text();
                console.log('Default tree fetched:', text);
                setNewickData(text);
            } catch (error) {
                console.error("Error fetching the default tree:", error);
            }
        };

        fetchDefaultTree();
    }, []);

    useEffect(() => {
        if (treeRef.current && newickData) {
            // Clear previous tree content
            treeRef.current.innerHTML = '';

            // Create a new tree
            const tree = new pt.phylotree(newickData);

            // Render the tree directly into the referenced div
            tree.render({
                'is-radial': false,
                'selectable': true,
                'zoom': true,
                'align-tips': false,
                'internal-names': true,
                width: 2000,
                height: 2000,
                'top-bottom-spacing': 'fixed-step',
                'brush': false,
                'restricted-select': {
                    "all-internal-branches": true,
                    "all-leaf-nodes": true,
                },
                'draw-size-bubbles': true,
                'show-scale': true,
                'bubble-styler': d => { return 6 },
            });

            treeRef.current.appendChild(tree.display.show());

            // Listener for branch click
            d3.select(treeRef.current)
                .selectAll('.branch')
                .on('click', async (event, branch) => {
                    console.log('Branch clicked:', branch);
                    // Set the source file for the selected branch
                    var source = branch.source.data.name;
                    var target = branch.target.data.name;

                    // Read the FASTA file content
                    if (!logoFiles[source] || !logoFiles[target]) {
                        console.error('No logo file found for:', source);
                        setLogoContent(null);
                        setPipVisible(false);
                        return;
                    } else {
                        var data = {
                            sourceName: source,
                            targetName: target,
                            source: logoFiles[source],
                            target: logoFiles[target],
                        }
                        setLogoContent(data);
                        setSelectBranch(branch);
                        setPipVisible(true);
                    }
                });
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

    // Function to get the center position based on the current viewport and scroll position
    const getCenterPosition = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        return {
            x: scrollX + (viewportWidth / 2) - 600, // Subtract half of the Rnd width (1200/2)
            y: scrollY + (viewportHeight / 2) - 400, // Subtract half of the Rnd height (800/2)
        };
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
                style={{ width: '2000px', height: '1000px', marginTop: '10px' }}
            ></div>
            {pipVisible && selectBranch && logoContent && (
                <Rnd
                    default={{
                        ...getCenterPosition(),
                        width: 1200,
                        height: 800,
                    }}
                    enableResizing={{
                        top: false,
                        right: false,
                        bottom: false,
                        left: false,
                        topRight: false,
                        bottomRight: false,
                        bottomLeft: false,
                        topLeft: false
                    }}
                    disableDragging={true} // Scrolling on sequence logo also drags the Rnd, disabling for now
                    bounds="window"
                >
                    <div className="logodiv">
                        <button
                            onClick={() => setPipVisible(false)}
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                backgroundColor: '#ff5c5c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                lineHeight: '20px',
                            }}
                        >X</button>
                        <SkylignComponent logoData={logoContent.source} name={logoContent.sourceName} />
                        <SkylignComponent logoData={logoContent.target} name={logoContent.targetName} />
                    </div>
                </Rnd>
            )}
        </div>
    );
};

export default Tol;
