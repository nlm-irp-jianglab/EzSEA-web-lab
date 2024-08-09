import React, { useEffect, useRef, useState } from 'react';
import * as pt from 'phylotree';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import "../components/phylotree.css";
import SkylignComponent from "../components/skylign-component";
import MolstarViewer from "../components/molstar";
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
    const logoPvRef = useRef(null);
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
                //console.log('Default tree fetched:', text);
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
                'container': treeRef.current,
                'is-radial': false,
                'selectable': true,
                'zoom': true,
                'align-tips': false,
                'internal-names': true,
                width: 1000,
                height: 2000,
                'top-bottom-spacing': 'fixed-step',
                'left-right-spacing': 'fixed-step',
                'brush': false,
                'restricted-select': {
                    "all-internal-branches": true,
                    "all-leaf-nodes": true,
                },
                'draw-size-bubbles': true,
                'show-scale': true,
                'bubble-styler': d => {
                    // This allows each bubble to be sized individually 
                    //console.log(d);
                    if (d.data.name in logoFiles) {
                        return 12;
                    }
                    return 6;
                },
                // Set background to light blue
                'background-color': 'lightblue',
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
                        treeRef.current.style.width = '100%';
                        return;
                    } else {
                        var data = {
                            sourceName: source,
                            targetName: target,
                            source: logoFiles[source],
                            target: logoFiles[target],
                        }
                        treeRef.current.style.width = '50%';
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

    const getRightPosition = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const padding = 20; // Optional padding from the right edge

        return {
            x: scrollX + viewportWidth - 1200 - padding, // Position Rnd component on the right side
            y: scrollY + (viewportHeight / 2) - 450, // Center vertically
        };
    };

    /*
    TODO: 
        Refactor phylotree to it's own component

    */

    return (
        <div>
            <Navbar pageId={"Phylogenetic Tree Viewer"} />
            <input type="file" accept=".nwk,.newick" onChange={handleFileChange} />
            <div style={{ display: 'flex' }}>
                <div // Tree goes here
                    id="tree"
                    className="tree-div"
                    ref={treeRef}
                    style={{ marginTop: '10px', marginLeft: '2px', width: '100%', height: '90vh', background: 'lightblue' }}
                ></div>


                {pipVisible && selectBranch && logoContent && (
                    <div className="right-div">
                        <div style={{ display: 'flex', 'flex-direction': 'column' }}>
                            <div style={{ height: '50%', background: 'green' }}>
                                <div className="logodiv">
                                    <button
                                        onClick={() => {
                                            setPipVisible(false)
                                            treeRef.current.style.width = '100%'; // Need to refactor this into it's own listener, this change occurs in two places. Ctrl+F "treeRef.current.style.width" to find the other place
                                        }}
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
                            </div>
                            <div style={{
                                width: '100%', // Set width to 100% of its parent
                                height: '100%', // Set height to 100% of its parent
                                position: 'relative', // Ensure the viewer is positioned relative to its container
                                overflow: 'hidden', // Hide overflow to prevent scrolling
                            }}>
                                <MolstarViewer />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Tol;
