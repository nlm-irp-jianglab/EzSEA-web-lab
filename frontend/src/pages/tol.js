import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pt from 'phylotree';
import { isLeafNode } from 'phylotree/src/nodes';
import { addCustomMenu } from 'phylotree/src/render/menus';
import { selectAllDescendants } from 'phylotree/src/nodes';
import Navbar from "../components/navbar";
import "../components/phylotree.css";
import "../components/tol.css";
import MolstarViewer from "../components/molstar";
import LogoStack from '../components/logo-stack';
import { readFastaToDict, parseNodeData } from '../components/utils';

const logoFiles = {};

const Tol = () => {
    const [faData, setFaData] = useState(null);
    const treeRef = useRef(null);
    const pvdiv = useRef(null);
    const [isRadial, setIsRadial] = useState(true);
    const [newickData, setNewickData] = useState(null);
    const [logoContent, setLogoContent] = useState(null);
    const [pipVisible, setPipVisible] = useState(false);
    const [selectedResidue, setSelectedResidue] = useState(null);
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [hoveredResidue, setHoveredResidue] = useState(null);
    const [colorFile, setColorFile] = useState(null);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [nodeData, setnodeData] = useState(null);


    useEffect(() => {
        const fetchDefaultTree = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/bilr_example/bilR_ancestors.nwk`);
                const text = await response.text();
                setNewickData(text);
            } catch (error) {
                console.error("Error fetching the default tree:", error);
            }
        };

        readFastaToDict(`${process.env.PUBLIC_URL}/bilr_example/bilR_ancestors.fa`).then(data => { setFaData(data) });

        fetchDefaultTree();


        fetch(`${process.env.PUBLIC_URL}/bilr_example/nodes.json`)
            .then(response => response.json())
            .then(data => {
                parseNodeData(data)
                    .then((parsedData) => setnodeData(parsedData))
            });
    }, []);

    useEffect(() => {
        if (treeRef.current && newickData) {
            treeRef.current.innerHTML = '';

            const tree = new pt.phylotree(newickData);

            function clearRightPanel() {
                setPipVisible(false);
                setSelectedResidue(null);
                setIsLeftCollapsed(false);
                setIsRightCollapsed(false);
                setColorFile(null);
                setLogoContent(null);
                treeRef.current.style.width = '100%';
            }

            function style_nodes(element, node_data) {
                var node_label = element.select("text");

                if (!isLeafNode(node_data)) { // edits to the internal nodes
                    node_label.text("\u00A0\u00A0\u00A0\u00A0" + node_label.text() + "\u00A0\u00A0\u00A0\u00A0")
                        .style("font-weight", "bold");

                    // Unaligning the internal nodes
                    const currentTransform = node_label.attr("transform");
                    const translateRegex = /translate \(([^)]+)\)/;
                    let newTransform = currentTransform.replace(translateRegex, `translate(0, 0)`);
                    node_label.attr("transform", newTransform);
                    // Deleting the line tracer
                    element.select("line").remove();

                    function compareMenuCondition(node) {
                        if (node['compare-node']) {
                            return "Remove from compare";
                        }
                        return "Select for compare";
                    }

                    function showMenuOpt(node) {
                        return true;
                    }

                    function compare(node, el) {
                        // change color of circle to red
                        if (node['compare-node']) {
                            el.select("circle").style("fill", "");
                        } else {
                            el.select("circle").style("fill", "red");
                        }
                        node['compare-node'] = !node['compare-node'];

                        // Add node to selectedNodes, if already in list, remove it
                        // Check if node is already selected
                        const index = selectedNodes.indexOf(node);
                        if (index > -1) {
                            selectedNodes.splice(index, 1);
                        } else {
                            selectedNodes.push(node);
                        }
                        setSelectedNodes(selectedNodes);
                        // append to logocontent
                        const data = {};
                        selectedNodes.forEach(n => {
                            data[n.data.name] = `>${n.data.name}\n${faData[n.data.name]}`;
                        });
                        treeRef.current.style.width = '50%'; // Need to have all these states as a toggle
                        setLogoContent(data);
                        setPipVisible(true);
                    }

                    // Adding my custom menu
                    addCustomMenu(node_data, compareMenuCondition, function () {
                        compare(node_data, element);
                    }, showMenuOpt);
                } else { // edits to the leaf nodes

                }
            }

            function style_edges(element, edge_data) {
                try {
                    element.on('click', async (event, branch) => {
                        if (branch.selected) {
                            branch.selected = false;
                            event.target.classList.remove('branch-selected');
                            clearRightPanel();
                        } else {
                            branch.selected = true;
                            event.target.classList.add('branch-selected');
    
                            var source = branch.source.data.name;
                            var target = branch.target.data.name;
                            console.log("Selected branch:", source, target);
                            if (!faData[source] || !faData[target]) { // TODO Is this necessary?
                                console.log("Not Found", faData[source], faData[target]);
                                clearRightPanel();
                                return;
                            } else { // Send node data to generate logos and o
                                var descendants = selectAllDescendants(branch.target, true, true);
                                var source_fa = "";
                                for (var node of descendants) {
                                    source_fa += `>${node.data.name}\n${faData[node.data.name]}\n`;
                                }
                                console.log(source_fa);
                                var data = {
                                    [source]: source_fa, // LogoJS parser expects header before sequence
                                    [target]: `>${source}\n${faData[target]}`,
                                }
                                treeRef.current.style.width = '50%'; // Need to have all these states as a toggle
                                setColorFile(`${source}_${target}.color.txt`);
                                setLogoContent(data);
                                setPipVisible(true);
                            }
                        }
    
                    });
                } catch (error) {
                    // Select all descendent branches triggers this error
                    // console.error("Error styling edges:", error);
                }
                
            }

            tree.render({
                'container': "#tree_container",
                'is-radial': true,
                'selectable': true,
                'zoom': true,
                'align-tips': true,
                'internal-names': true,
                width: 1000,
                height: 2000,
                'top-bottom-spacing': 'fixed-step',
                'left-right-spacing': 'fixed-step',
                'brush': false,
                'draw-size-bubbles': false, // Must be false so that nodes are clickable?
                'bubble-styler': d => { return 1.5 },
                'node-styler': style_nodes,
                'edge-styler': style_edges,
                'show-scale': false,
                'font-size': 4,
                'background-color': 'lightblue',
                'collapsible': true,
                'reroot': true,
                'hide': false, // Causes weird rendering in radial
            });

            // console.log(tree.getNodes());

            treeRef.current.appendChild(tree.display.show());

            // console.log(selectAllDescendants(tree.getNodes(), true, false))

        }
    }, [newickData, isLeftCollapsed, isRadial, faData]);

    const setLogoCallback = useCallback((node) => {
        if (node !== null) {
            const handleMouseEnter = () => {
                node.style.height = '602px';
                pvdiv.current.style.height = 'calc(100% - 604px)';
            };

            const handleMouseLeave = () => {
                node.style.height = '300px';
                pvdiv.current.style.height = 'calc(100% - 304px)';
            };

            node.addEventListener('mouseenter', handleMouseEnter);
            node.addEventListener('mouseleave', handleMouseLeave);
        }
    }, []);

    const handleColumnClick = (index) => {
        setSelectedResidue(index + 1);
    };

    const handleColumnHover = (index) => {
        console.log("Column hovered:", index);
        setHoveredResidue(index + 1);
    };

    const handlePrint = () => {
        window.print();
    };

    const toggleLeftCollapse = () => {
        setIsLeftCollapsed(!isLeftCollapsed);
    };

    const toggleRightCollapse = () => {
        setIsRightCollapsed(!isRightCollapsed);
        isRightCollapsed ? setPipVisible(true) : setPipVisible(false);
    };

    const handleDownload = (filename, content) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    const downloadNewickData = () => {
        handleDownload('tree_data.nwk', newickData);
    };

    const downloadLogoFile = (fileName) => {
        const logoFileContent = JSON.stringify(logoFiles[fileName], null, 2); // Formatting as JSON
        handleDownload(`${fileName}.json`, logoFileContent);
    };

    const renderDropdown = () => (
        <div className="dropdown">
            <button className="dropbtn">Download Files</button>
            <div className="dropdown-content">
                <button onClick={downloadNewickData}>Download Newick Data</button>
                {Object.keys(logoFiles).map(fileName => (
                    <button key={fileName} onClick={() => downloadLogoFile(fileName)}>
                        Download {fileName} Logo File
                    </button>
                ))}
            </div>
        </div>
    );

    const downloadTreeAsSVG = () => {
        const svgElement = treeRef.current.querySelector('svg'); // Select the SVG from the tree container
        if (!svgElement) {
            console.error("SVG element not found in treeRef.");
            return;
        }

        // Serialize the SVG content
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // Manually styling the SVG content. TODO: Maybe grab the styles from the CSS file?
        const styleString = `
            <style>
                .branch {
                    fill: none;
                    stroke: #999;
                    stroke-width: 2px;
                }
                .internal-node circle {
                    fill: #CCC;
                    stroke: black;
                    stroke-width: 0.5px;
                }
                .node {
                    font: 10px sans-serif;
                }
            </style>`;

        // Ensure that we are not redefining the xmlns attribute
        if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
            source = source.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg"`);
        }

        // Insert the style string into the SVG just before the closing tag
        source = source.replace('</svg>', `${styleString}</svg>`);

        // Create a Blob and trigger the download
        const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Create a download link and trigger the download
        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "tree_with_styles.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <div>
            <Navbar pageId={"Integrated Tree Viewer"} />
            <div className="btn-toolbar">
                <button
                    className="radial-toggle-button"
                    onClick={() => setIsRadial(prevIsRadial => !prevIsRadial)}
                >
                    Tree Layout: ({isRadial ? 'Radial' : 'Rectangular'})
                </button>
                <button className="download-svg-button" onClick={downloadTreeAsSVG}>
                    Download Tree as SVG
                </button>
                {renderDropdown()}
            </div>
            <div style={{ display: 'flex', height: '90vh', margin: '0 20px' }}>
                {!isLeftCollapsed && (
                    <div
                        id="tree_container"
                        className="tree-div"
                        ref={treeRef}
                        style={{ width: pipVisible ? '50%' : '100%' }}
                    ></div>
                )}

                {pipVisible && (
                    <div className="center-console">
                        {!isRightCollapsed && (
                            <button className="triangle-button" onClick={toggleLeftCollapse}>
                                {isLeftCollapsed ? '▶' : '◀'}
                            </button>
                        )}
                        {!isLeftCollapsed && (
                            <button className="triangle-button" onClick={toggleRightCollapse}>
                                {isRightCollapsed ? '◀' : '▶'}
                            </button>
                        )}
                    </div>
                )}

                {pipVisible && logoContent && !isRightCollapsed && (
                    <div
                        className="right-div"
                        style={{
                            width: isLeftCollapsed ? '100%' : '50%',
                            display: 'flex', // Use flexbox to control layout
                            flexDirection: isLeftCollapsed ? 'row' : 'column', // Side by side if left is collapsed
                        }}
                    >
                        {isLeftCollapsed ? (
                            <div className="logodiv2" style={{ width: '50%' }}>
                                <LogoStack
                                    data={logoContent}
                                    onColumnClick={handleColumnClick}
                                    onColumnHover={handleColumnHover}
                                    importantResiduesList={nodeData}
                                />
                            </div>
                        ) : (
                            <div className="expandedRight">
                                <div className="logodiv" ref={setLogoCallback} style={{ width: isLeftCollapsed ? '50%' : '100%', height: isLeftCollapsed ? '100%' : '300px' }}>
                                    <button
                                        className="logo-close-btn"
                                        onClick={() => {
                                            setPipVisible(false);
                                            setSelectedResidue(null);
                                            setIsLeftCollapsed(false);
                                        }}
                                    >
                                        X
                                    </button>
                                    <LogoStack
                                        data={logoContent}
                                        onColumnClick={handleColumnClick}
                                        onColumnHover={handleColumnHover}
                                        importantResiduesList={nodeData}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pvdiv" ref={pvdiv} style={{ width: isLeftCollapsed ? '50%' : '100%' }}>
                            <MolstarViewer
                                selectedResidue={selectedResidue}
                                colorFile={colorFile}
                                hoveredResidue={hoveredResidue}
                            />
                        </div>
                    </div>
                )}



            </div>
            <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <button onClick={handlePrint}>Print Page to PDF</button>
            </div>
            {/* Adding the dropdown for downloads */}

        </div>
    );
};

export default Tol;
