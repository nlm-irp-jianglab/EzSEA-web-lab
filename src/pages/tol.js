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
    const logoRefTop = useRef(null); // TODO: This is a clunky way to ensure both logos are in sync. Refactor this into a single, double-SkylignComponent
    const logoRefBot = useRef(null);
    const [newickData, setNewickData] = useState(null); // State var for tree data. Can allow user to upload a new tree
    const [logoContent, setLogoContent] = useState(null); // Logo data
    const [pipVisible, setPipVisible] = useState(false); // Toggle for logo popup
    const [selectBranch, setSelectBranch] = useState(null); // State var for branch selection listener
    const [selectedResidue, setSelectedResidue] = useState(null); // State var for selected residue in Molstar viewer
    const [colorFile, setColorFile] = useState(null); // State var for color file

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
                'is-radial': true,
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
                    return 2;
                },
                'font-size': 5,
                // Set background to light blue
                'background-color': 'lightblue',
            });

            treeRef.current.appendChild(tree.display.show());

            // Listener for branch click
            d3.select(treeRef.current)
                .selectAll('.branch')
                .on('click', async (event, branch) => {
                    console.log('Branch clicked:', branch);
                    // Highlight the selected branch

                    // Set the source file for the selected branch
                    var source = branch.source.data.name;
                    var target = branch.target.data.name;

                    // Read the FASTA file content
                    if (!logoFiles[source] || !logoFiles[target]) {
                        console.error('No logo file found for:', source, 'or', target);
                        setSelectedResidue(null);
                        setColorFile(null);
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
                        setColorFile(`${source}_${target}.color.txt`);
                        setLogoContent(data);
                        setSelectBranch(branch);
                        setPipVisible(true);
                    }
                });

            // Use d3 to recolor selectable nodes
            d3.select(treeRef.current)
                .selectAll('.internal-node')
                .filter(d => d.data.name in logoFiles)
                .select('circle')
                .style("fill", "red")
                .attr("r", 3);

        }
    }, [newickData]);

    const handleColumnClickTop = (index, column) => {
        console.log(`Column ${index} clicked`);
        setSelectedResidue(index);
        logoRefBot.current.scrollToColumn(index);
    };

    const handleColumnClickBot = (index, column) => {
        console.log(`Column ${index} clicked`);
        setSelectedResidue(index);
        logoRefTop.current.scrollToColumn(index);
    };

    /*
    TODO: 
        Add more intuitive resizability to LogoDiv: try Interact.js 
        Combine the two SkylignComponents into a single component
        Inherent issue with Skylign: fasta must be converted into a json object thru website. Cannot generate logos on the fly
    */

    return (
        <div>
            <Navbar pageId={"Phylogenetic Tree Viewer"} />
            <div style={{ display: 'flex', height: '100vh' }}>
                <div // Tree goes here
                    className="tree-div"
                    ref={treeRef}
                ></div>

                {/* Right side content */}
                {pipVisible && selectBranch && logoContent && (
                    <div className="right-div">
                        <div className="logodiv">
                            <button className="logo-close-btn"
                                onClick={() => {
                                    setPipVisible(false);
                                    setSelectedResidue(null);
                                    treeRef.current.style.width = '100%'; // Need to refactor this into it's own listener, this change occurs in two places. Ctrl+F "treeRef.current.style.width" to find the other place
                                }}
                            >X</button>
                            <SkylignComponent logoData={logoContent.source} name={logoContent.sourceName} onColumnClick={handleColumnClickTop} ref={logoRefTop} />
                            <SkylignComponent logoData={logoContent.target} name={logoContent.targetName} onColumnClick={handleColumnClickBot} ref={logoRefBot} />
                        </div>
                        <div className="pvdiv">
                            <MolstarViewer selectedResidue={selectedResidue} colorFile={colorFile} />
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Tol;
