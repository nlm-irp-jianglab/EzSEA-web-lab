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
import { readFastaToDict, parseNodeData, calcEntropyFromMSA, mapEntropyToColors, jsonToFasta } from '../components/utils';
import { useParams } from 'react-router-dom';
import * as d3 from 'd3';
import ErrorPopup from '../components/errorpopup';
import JSZip from "jszip";

const logoFiles = {};

const Tol = () => {
    const { jobId } = useParams();
    // State to store the tree data and node data
    const [faData, setFaData] = useState(null);
    const [newickData, setNewickData] = useState(null);
    const [structData, setStructData] = useState(null); // Structure data
    const [nodeData, setnodeData] = useState(null);
    const [topNodes, setTopNodes] = useState({}); // Top 10 nodes for the tree
    const [leafData, setLeafData] = useState({});

    // State to store the logo content (formatted for logoJS) and color file
    const [logoContent, setLogoContent] = useState({});
    const [colorArr, setColorArr] = useState(null);

    // Toggle between radial and linear layout
    const [isRadial, setIsRadial] = useState(true);

    // For live updates linking sequence logo and structure viewer
    const [selectedResidue, setSelectedResidue] = useState(null);
    const [hoveredResidue, setHoveredResidue] = useState(null); // Currently not in use

    // States for rendering control
    const [pipVisible, setPipVisible] = useState(false);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [notification, setNotification] = useState('');

    // References for rendering
    const treeRef = useRef(null);
    const pvdiv = useRef(null);
    const logoStackRef = useRef(null);
    const zoomInputRef = useRef(null);

    // Storing tree reference itself
    const [treeObj, setTreeObj] = useState(null);
    const [isErrorPopupVisible, setErrorPopupVisible] = useState(false);

    const showErrorPopup = () => {
        setErrorPopupVisible(true);
    };

    const closeErrorPopup = () => {
        setErrorPopupVisible(false);
    };

    // Fetch the tree data and node data on component mount, store data into states
    // TODO: Fetch dynamically from the backend
    useEffect(() => {
        const fetchDefaultTree = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/example_2/Visualization/asr.tree`);
                const text = await response.text();
                setNewickData(text);
            } catch (error) {
                console.error("Error fetching the default tree:", error);
            }
        };

        fetchDefaultTree();

        readFastaToDict(`${process.env.PUBLIC_URL}/example_2/Visualization/asr.fa`).then(data => { setFaData(data) });


        fetch(`${process.env.PUBLIC_URL}/example_2/Visualization/nodes.json`)
            .then(response => response.json())
            .then((json) => {
                parseNodeData(json.slice(0, 10)).then((parsedData) => setTopNodes(parsedData));
                parseNodeData(json).then((parsedData) => setnodeData(parsedData));
            });

        readFastaToDict(`${process.env.PUBLIC_URL}/example_2/Visualization/seq_trimmed.afa`).then(data => { setLeafData(data) });

        // fetch(`${process.env.PUBLIC_URL}/example_2/Visualization/seq.pdb`)
        //     .then(response => response.text())
        //     .then((text) => {
        //         setStructData(text);
        //     });
    }, []);

    // Deals with tree rendering
    useEffect(() => {
        if (treeRef.current && newickData && nodeData) {
            treeRef.current.innerHTML = '';

            const tree = new pt.phylotree(newickData);
            setTreeObj(tree);

            function style_nodes(element, node_data) {
                var node_label = element.select("text");

                if (!isLeafNode(node_data)) { // edits to the internal nodes
                    node_label.text("\u00A0" + node_label.text() + "\u00A0")
                        .style("font-weight", "bold");

                    if (topNodes && node_data.data.name in topNodes) { // First condition to ensure nodeData is populated
                        element.select("circle").style("fill", "green").attr("r", 5);
                    }

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
                        return "Compare ancestral state";
                    }

                    function showMenuOpt(node) {
                        return true;
                    }

                    function compare(node, el) {
                        if (node['compare-node']) {
                            setNodeColor(node.data.name, null);
                            removeNodeFromLogo(node);
                        } else {
                            pushNodeToLogo(node);
                        }
                    }

                    function compareDescMenuCondition(node) {
                        if (node['compare-descendants']) {
                            return "Remove descendants";
                        } else {
                            return "Compare descendants";
                        }
                    }

                    function compareDescendants(node, el) {
                        // change color of circle to yellow
                        if (node['compare-descendants']) {
                            removeNodeFromLogo(node);
                            setNodeColor(node.data.name, null);
                        } else {
                            pushNodeToEntropyLogo(node, true);
                        }
                    }

                    function showDescMenuOpt(node) {
                        if (node['compare-descendants'] || node['compare-node']) {
                            return false;
                        }
                        return true;
                    }

                    // Toggling selection options causes this code to run in duplicate. Patchy fix

                    if (!node_data['menu_items'] || node_data['menu_items'].length != 2) {
                        // Adding my custom menu
                        addCustomMenu(node_data, compareMenuCondition, function () {
                            compare(node_data, element);
                        }, showMenuOpt);

                        addCustomMenu(node_data, compareDescMenuCondition, function () {
                            compareDescendants(node_data, element);
                        }, showDescMenuOpt);
                    }
                } else { // edits to the leaf nodes

                }
            }

            function style_edges(element, edge_data) {
                try {
                    element.on('click', async (event, branch) => {
                        if (branch.selected) {
                            branch.selected = false;
                            event.target.classList.remove('branch-selected');
                            removeNodeFromLogo(branch.source); // Remove the node from logoContent if already present
                            removeNodeFromLogo(branch.target);
                        } else {
                            branch.selected = true;
                            event.target.classList.add('branch-selected');

                            var source = branch.source.data.name;
                            var target = branch.target.data.name;
                            console.log("Selected branch:", source, target);
                            if (!faData[source] || !faData[target]) {
                                console.log("Missing node data for branch.", faData[source], faData[target]);
                                clearRightPanel();
                                return;
                            } else {
                                pushNodeToLogo(branch.source);
                                pushNodeToLogo(branch.target);
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
                'is-radial': false,
                'selectable': true,
                'zoom': true,
                'align-tips': true,
                'internal-names': true,
                width: 2000,
                height: 4000,
                'top-bottom-spacing': 'fixed-step',
                'left-right-spacing': 'fit-to-size',
                'brush': false,
                'draw-size-bubbles': false, // Must be false so that nodes are clickable?
                'bubble-styler': d => { return 5 },
                'node-styler': style_nodes,
                'edge-styler': style_edges,
                'show-scale': false,
                'font-size': 12,
                'background-color': 'lightblue',
                'collapsible': true,
                'reroot': true,
                'hide': false, // Causes weird rendering in radial
            });

            treeRef.current.appendChild(tree.display.show());

            // Pan to input query
            findAndZoom("PA14_rph");
        }
    }, [newickData, isRadial, faData]);

    const removeNodeFromLogo = (node) => {
        // Remove node from logoContent
        setLogoContent(prevLogoContent => {
            const updatedLogoContent = { ...prevLogoContent };

            // Add or remove node from logoContent
            if (node.data.name in updatedLogoContent) {
                node['compare-node'] = false;
                node['compare-descendants'] = false;

                delete updatedLogoContent[node.data.name];  // Remove the node
                setNodeColor(node.data.name, null);
            }

            return updatedLogoContent;  // Return the new state
        });
    };


    const pushNodeToLogo = (node) => {
        setLogoContent(prevLogoContent => {
            const updatedLogoContent = { ...prevLogoContent };
            // Add or do nothing if node is already in logoContent
            if (node.data.name in updatedLogoContent) {
                return updatedLogoContent;
            } else {
                node['compare-node'] = true;
                updatedLogoContent[node.data.name] = `>${node.data.name}\n${faData[node.data.name]}`;
                setNodeColor(node.data.name, "red");

            }

            return updatedLogoContent;  // Return the new state
        });

    };

    const pushNodeToEntropyLogo = (node) => {
        setLogoContent(prevLogoContent => {
            const updatedLogoContent = { ...prevLogoContent };

            var descendants = selectAllDescendants(node, true, false);
            var desc_fa = "";
            for (var desc of descendants) {
                desc_fa += `>${desc.data.name}\n${leafData[desc.data.name]}\n`;
            }
            if (desc_fa === "") {
                console.log("No descendants found for node:", node.data.name);
                return updatedLogoContent;
            }

            node['compare-node'] = true;
            node['compare-descendants'] = true;
            // Calculates entropies, maps to colors and sets the colorArr state
            calcEntropyFromMSA(desc_fa).then((entropy) => mapEntropyToColors(entropy)).then((colors) => { setColorArr(colors) });

            updatedLogoContent["Descendants of " + node.data.name] = desc_fa;
            setNodeColor(node.data.name, "yellow");

            return updatedLogoContent;  // Return the new state
        });
    };

    const setNodeColor = (nodeId, color = null) => {
        d3.selectAll('.internal-node')
            .each(function () {
                var node = d3.select(this).data()[0];
                if (node.data.name === nodeId) {
                    if (color == null) {
                        const circles = d3.select(this).selectAll('circle');
                        if (circles.size() === 2) {
                            circles.filter(function (d, i) {
                                return i === 0; // Remove the first circle when there are two
                            }).remove();
                        }
                    } else {
                        // Calling push node, results in calling setNodeColor twice (possibly due to react state updates), this check prevents adding a circle twice
                        const circles = d3.select(this).selectAll('circle');
                        if (circles.size() === 2) {
                            console.log("Attempted to add circle to node with existing circle");
                        } else {
                            const currRadius = parseInt(d3.select(this).select("circle").attr("r"));
                            d3.select(this).insert("circle", ":first-child").attr("r", currRadius + 2).style("fill", color);
                        }
                    }
                }
            });
    };

    useEffect(() => {
        if (Object.keys(logoContent).length == 0) {
            setIsLeftCollapsed(false);
            setPipVisible(false);
        } else {
            setPipVisible(true);
            setColorArr(null);
        }
    }, [logoContent]);

    const handleColumnClick = (index) => {
        setSelectedResidue(index + 1);
    };

    const applyEntropyStructColor = (nodeId) => {
        d3.selectAll('.internal-node')
            .each(function () {
                var node = d3.select(this).data()[0];
                if (node.data.name === nodeId) {
                    var descendants = selectAllDescendants(node, false, true);
                    var desc_fa = "";
                    for (var desc of descendants) {
                        desc_fa += `>${desc.data.name}\n${faData[desc.data.name]}\n`;
                    }
                    // Calculates entropies, maps to colors and sets the colorArr state
                    calcEntropyFromMSA(desc_fa).then((entropy) => mapEntropyToColors(entropy)).then((colors) => { setColorArr(colors) });
                }
            });
    }

    const applyImportantStructColor = (residueList, nodeFasta) => {
        var fa = nodeFasta.split('\n').slice(1).join('\n');
        var importantColors = Array(fa.length).fill(0x00FF00);

        for (var res of residueList) {
            importantColors[res] = 0xFF0000;
        }

        setColorArr(importantColors);
    }

    function clearRightPanel() {
        setPipVisible(false);
        setSelectedResidue(null);
        setIsLeftCollapsed(false);
        setIsRightCollapsed(false);
        setColorArr(null);
        setLogoContent({});
        var desc = selectAllDescendants(treeObj.getNodes(), false, true);
        // Map set node-compare to false over desc
        desc.forEach(node => {
            node['compare-node'] = false;
            node['compare-descendants'] = false;
            setNodeColor(node.data.name, null);
        });
        d3.selectAll('.branch-selected').classed('branch-selected', false);
        treeRef.current.style.width = '100%';
    }

    const handleColumnHover = (index) => {
        logoStackRef.current.scrollToIndex(index);
    };

    const handleNodeRemove = (index) => {
        // Remove node from logoContent
        const newLogoContent = { ...logoContent };
        const keys = Object.keys(newLogoContent);
        delete newLogoContent[keys[index]];
        setLogoContent(newLogoContent);

        // Below syncs highlights on TOL with remove action in logo stack
        d3.selectAll('.internal-node')
            .each(function () {
                var node = d3.select(this).data()[0];
                if (node.data.name === keys[index].replace("Descendants of ", "")) {
                    node['compare-node'] = false;
                    node['compare-descendants'] = false;
                    const circles = d3.select(this).selectAll('circle');
                    if (circles.size() === 2) {
                        circles.filter(function (d, i) {
                            return i === 0; // Target the first circle when there are two
                        }).remove();
                    }
                }
            });
    }

    const selectNode = (nodeId) => {
        if (nodeId in logoContent) { // If already selected, do nothing
            return;
        }
        d3.selectAll('.internal-node')
            .each(function () {
                var node = d3.select(this).data()[0];
                if (node.data.name === nodeId) {
                    node['compare-node'] = true;
                    pushNodeToLogo(node);
                }
            });
    }

    const setImportantView = (nodeId) => {
        d3.selectAll('.internal-node')
            .each(function () {
                var node = d3.select(this).data()[0];
                if (node.data.name === nodeId) {
                    setLogoContent({});
                    var desc = selectAllDescendants(treeObj.getNodes(), false, true);
                    // Map set node-compare to false over desc
                    desc.forEach(node => {
                        node['compare-node'] = false;
                        node['compare-descendants'] = false;
                        setNodeColor(node.data.name, null);
                    });
                    pushNodeToLogo(node)
                    pushNodeToLogo(node.parent);
                    pushNodeToEntropyLogo(node);
                }
            });

        findAndZoom(nodeId);
    }

    const toggleLeftCollapse = () => {
        setIsLeftCollapsed(!isLeftCollapsed);
    };

    const toggleRightCollapse = () => {
        console.log("Toggling right collapse");
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

    const downloadZip = () => {
        const element = document.createElement("a");
        var zip = new JSZip();

        zip.file("tree.nwk", newickData).file("asr.fa", jsonToFasta(faData)).file("seq.pdb", structData);

        zip.generateAsync({ type: "blob" }).then(function (blob) {
            element.href = URL.createObjectURL(blob);
            element.download = "files.zip";
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            document.body.removeChild(element);
        });
    }

    const downloadNewickData = () => {
        handleDownload('tree_data.nwk', newickData);
    };

    const downloadLogoFile = (fileName) => {
        const logoFileContent = JSON.stringify(logoFiles[fileName], null, 2); // Formatting as JSON
        handleDownload(`${fileName}.json`, logoFileContent);
    };

    const downloadsDropdown = () => {
        const handleSidebarDownloadsClick = () => {
            const dropdownContent = document.querySelector('.downloads-dropdown-content');
            const btn = document.querySelector('.dropbtn-downloads');

            btn.classList.contains('selected') ? btn.classList.remove('selected') : btn.classList.add('selected');

            if (dropdownContent.classList.contains('visible')) {
                dropdownContent.classList.remove('visible');
                if (!document.querySelector('.nodes-dropdown-content').classList.contains('visible')) {
                    setSidebarExpanded(false);
                }
            } else {
                dropdownContent.classList.add('visible');
                setSidebarExpanded(true);
            }
        };

        return (
            <div className="dropdown" onClick={handleSidebarDownloadsClick}>
                <button className="dropbtn-downloads dropbtn" >
                    <svg width="25px" height="25px" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Downloads</title>
                        <path d="M13.5 3H12H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H7.5M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V9.75V12V19C19 20.1046 18.1046 21 17 21H16.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 12V20M12 20L9.5 17.5M12 20L14.5 17.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button onClick={downloadZip}>
                    zip
                </button>
                {sidebarExpanded && <span className="sidebar-label">Downloads</span>}
            </div>
        );
    };

    const importantNodesDropdown = () => {
        const handleSidebarNodesClick = () => {
            const dropdownContent = document.querySelector('.nodes-dropdown-content');
            const btn = document.querySelector('.dropbtn-nodes');

            // Highlight the button when selected
            btn.classList.contains('selected') ? btn.classList.remove('selected') : btn.classList.add('selected');

            if (dropdownContent.classList.contains('visible')) {
                dropdownContent.classList.remove('visible');
                if (!document.querySelector('.downloads-dropdown-content').classList.contains('visible')) {
                    setSidebarExpanded(false);
                }
            } else {
                dropdownContent.classList.add('visible');
                setSidebarExpanded(true);
            }
        };

        return (
            <div className="dropdown" onClick={handleSidebarNodesClick}>
                <button className="dropbtn-nodes dropbtn">
                    <svg fill="#FFFFFF" width="25px" height="25px" xmlns="http://www.w3.org/2000/svg">
                        <title>Candidates for clade delineation</title>
                        <path d="M20,9H16a1,1,0,0,0-1,1v1H7V7H8A1,1,0,0,0,9,6V2A1,1,0,0,0,8,1H4A1,1,0,0,0,3,2V6A1,1,0,0,0,4,7H5V20a1,1,0,0,0,1,1h9v1a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V18a1,1,0,0,0-1-1H16a1,1,0,0,0-1,1v1H7V13h8v1a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V10A1,1,0,0,0,20,9ZM5,3H7V5H5ZM17,19h2v2H17Zm2-6H17V11h2Z" />
                    </svg>
                </button>
                {sidebarExpanded && <span className="sidebar-label">Key Nodes</span>}
            </div>
        );
    };

    const zoomToElem = () => {
        const handleSidebarSearchClick = () => {
            if (document.querySelector('.downloads-dropdown-content').classList.contains('visible')
                || document.querySelector('.nodes-dropdown-content').classList.contains('visible')) {
                setSidebarExpanded(true);
            } else {
                setSidebarExpanded(!sidebarExpanded);
            }
        };

        return (
            <div>
                <button className="dropbtn-search dropbtn" onClick={handleSidebarSearchClick}>
                    <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Search for node</title>
                        <path d="M11 6C13.7614 6 16 8.23858 16 11M16.6588 16.6549L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        );
    };

    const findAndZoom = (query) => {
        const svg = d3.select("#tree_container").select("svg");
        const zoom = d3.zoom().on("zoom", (event) => {
            svg.select("g").attr("transform", event.transform);
        });
        svg.call(zoom);

        var targetNode;
        d3.selectAll('.node')
            .each(function () {
                const node = d3.select(this).data()[0];
                const elem = d3.select(this);
                if (node.data.name === query) {
                    targetNode = node;
                    const targetX = node.x;
                    const targetY = node.y;

                    const line = elem.select("line");

                    line.transition()
                        .delay(1000)
                        .duration(500)
                        .style("stroke", "red")
                        .style("stroke-width", 5)
                        .style("stroke-dasharray", "10,4")
                        .transition()
                        .duration(500)
                        .style("stroke-width", 1)
                        .style("stroke", null)
                        .style("stroke-dasharray", "3,4")
                        .transition()
                        .duration(500)
                        .style("stroke-width", 5)
                        .style("stroke", "red")
                        .style("stroke-dasharray", "10,4")
                        .transition()
                        .duration(500)
                        .style("stroke-width", 1)
                        .style("stroke", null)
                        .style("stroke-dasharray", "3,4");

                    svg.transition()
                        .duration(750)
                        .call(zoom.transform, d3.zoomIdentity.scale(1).translate(-targetY + 109, -targetX + 426)); // Adjust the scale and translation as needed
                }
            });

        d3.selectAll('.internal-node')
            .each(function () {
                const node = d3.select(this).data()[0];
                if (node.data.name === query) {
                    targetNode = node;
                    const targetX = node.x;
                    const targetY = node.y;

                    const circle = d3.select(this).select("circle");
                    const currRadius = circle.attr("r");
                    const currColor = circle.style("fill");
                    const newRadius = (currRadius * 2).toString();


                    circle.transition()
                        .delay(1000)
                        .style("fill", "red")
                        .style("r", newRadius)
                        .transition()
                        .duration(500)
                        .style("fill", currColor)
                        .style("r", currRadius)
                        .transition()
                        .duration(500)
                        .style("fill", "red")
                        .style("r", newRadius)
                        .transition()
                        .duration(500)
                        .style("fill", currColor)
                        .style("r", currRadius);

                    svg.transition()
                        .duration(750)
                        .call(zoom.transform, d3.zoomIdentity.scale(1).translate(-targetY + 672, -targetX + 376)); // Adjust the scale and translation as needed
                }
            });

        if (!targetNode) {
            setNotification('Node not found');
            setTimeout(() => {
                setNotification('');
            }, 2000);
        }
    };


    function downloadCombinedSVG() {
        // Select all svg elements within a specific div (e.g., with id "svgContainer")
        const svgElements = document.querySelectorAll('#logo-stack svg');

        if (svgElements.length === 0) {
            console.error("No SVG elements found!");
            return;
        }

        // Create a new SVG element that will contain all the others
        const combinedSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        combinedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // Positioning variables
        let yOffset = 0;

        svgElements.forEach((svg, index) => {
            const height = 60; // Default height if not provided

            // Create a group element to contain the svg
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Adjust the position of the SVG using a transform
            g.setAttribute("transform", `translate(0, ${yOffset})`);

            // Add the current SVG into the group element
            const clonedSVG = svg.cloneNode(true);
            g.appendChild(clonedSVG);

            // Append the group element into the combined SVG
            combinedSVG.appendChild(g);

            // Update yOffset for the next svg to be placed below the current one
            yOffset += parseFloat(height);
        });

        // Set the combined SVG size (width as the largest width, height as the total yOffset)
        combinedSVG.setAttribute("width", "100%");
        combinedSVG.setAttribute("height", "100%");

        // Serialize the combined SVG to a string
        const serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(combinedSVG);


        const styleString = `
        <style>
            .glyphrect {
                fill-opacity: 0.0;
            }
        </style>`;
        svgString = svgString.replace('</svg>', `${styleString}</svg>`);

        // Create a blob for the SVG data
        const blob = new Blob([svgString], { type: 'image/svg+xml' });

        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `combined.svg`; // Name of the downloaded file

        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink); // Clean up
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Navbar pageId={"Results: ru5hnx3m2np8010"} />
            {isErrorPopupVisible && (
                <ErrorPopup errorMessage="An error occurred!" onClose={closeErrorPopup} />
            )}
            <div style={{ display: 'flex', flexGrow: '1' }}>
                <div className="sidebar" style={{
                    width: (sidebarExpanded ? "250px" : "50px")
                }}>
                    <div className="sidebar-item nodes-label">
                        {zoomToElem()}
                        {sidebarExpanded && <input
                            className="zoomInput"
                            ref={zoomInputRef}
                            placeholder="Find Node"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    findAndZoom(zoomInputRef.current.value);
                                }
                            }}
                        />}
                        {notification && (
                            <div className="notification">
                                {notification}
                            </div>
                        )}
                    </div>
                    <div className="sidebar-item nodes-label">
                        {importantNodesDropdown()}
                    </div>
                    <div className="nodes-dropdown-content dropdown-content transition-element">
                        {Object.keys(topNodes).map(key => (
                            <button key={key} onClick={() => setImportantView(key)}>
                                <span style={{ fontWeight: "bold" }}>{key}</span> Score: {topNodes[key]['score'].toFixed(2)}
                            </button>
                        ))}
                    </div>
                    <div className="sidebar-item downloads-label">
                        {downloadsDropdown()}
                    </div>
                    <div className="downloads-dropdown-content dropdown-content transition-element">
                        <button onClick={downloadNewickData}>Newick Data</button>
                        {Object.keys(logoFiles).map(fileName => (
                            <button key={fileName} onClick={() => downloadLogoFile(fileName)}>
                                Download {fileName} Logo File
                            </button>
                        ))}
                    </div>
                </div>
                <div className="view">
                    <div
                        id="tree_container"
                        className="tree-div"
                        ref={treeRef}
                        style={{ width: isLeftCollapsed ? '2%' : (pipVisible ? '50%' : '100%') }}
                    ></div>

                    {Object.keys(logoContent).length > 0 && (
                        <div className="center-console">
                            {!isRightCollapsed && (
                                <button className="triangle-button" onClick={toggleLeftCollapse}>
                                    {isLeftCollapsed ? <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <title>Expand Left</title>
                                        <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg> :
                                        <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform='rotate(180)'>
                                            <title>Collapse Left</title>
                                            <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>}
                                </button>
                            )}
                            {!isLeftCollapsed && (
                                <button className="triangle-button" onClick={toggleRightCollapse}>
                                    {isRightCollapsed ? <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform='rotate(180)'>
                                        <title>Expand Right</title>
                                        <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg> :
                                        <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <title>Collapse Right</title>
                                            <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>}
                                </button>
                            )}
                        </div>
                    )}

                    {pipVisible && logoContent && (
                        <div
                            className="right-div"
                            style={{
                                width: isRightCollapsed ? '2%' : (isLeftCollapsed ? '100%' : '50%'),
                                display: 'flex', // Use flexbox to control layout
                                flexDirection: isLeftCollapsed ? 'row' : 'column', // Side by side if left is collapsed
                            }}
                        >
                            {isLeftCollapsed ? (
                                <div className="logodiv2" style={{ width: '50%' }}>
                                    <div className="btnbar" style={{ textAlign: "center", height: "32px" }}>
                                        <button className="download-stack-btn" onClick={downloadCombinedSVG} style={{ borderRadius: "3px", backgroundColor: "#def2b3", border: "none", cursor: "pointer" }}>
                                            <svg width="25px" height="25px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                                <title>Download Stack</title>
                                                <path d="m3.25 7.25-1.5.75 6.25 3.25 6.25-3.25-1.5-.75m-11 3.75 6.25 3.25 6.25-3.25" />
                                                <path d="m8 8.25v-6.5m-2.25 4.5 2.25 2 2.25-2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <LogoStack
                                        data={logoContent}
                                        onColumnClick={handleColumnClick}
                                        onColumnHover={handleColumnHover}
                                        importantResiduesList={nodeData}
                                        removeNodeHandle={handleNodeRemove}
                                        applyEntropyStructColor={applyEntropyStructColor}
                                        applyImportantStructColor={applyImportantStructColor}
                                        ref={logoStackRef}
                                    />
                                </div>
                            ) : (
                                <div className="expandedRight">
                                    <div className="logodiv" style={{ width: '100%', height: Object.keys(logoContent).length > 2 ? '570px' : (Object.keys(logoContent).length > 1 ? '380px' : '190px') }}>
                                        <button
                                            className="logo-close-btn"
                                            onClick={() => {
                                                clearRightPanel();
                                            }}
                                        >
                                            <svg fill="#000000" width="25px" height="25px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                                <title>Clear All</title>
                                                <path d="M16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM21.961 12.209c0.244-0.244 0.244-0.641 0-0.885l-1.328-1.327c-0.244-0.244-0.641-0.244-0.885 0l-3.761 3.761-3.761-3.761c-0.244-0.244-0.641-0.244-0.885 0l-1.328 1.327c-0.244 0.244-0.244 0.641 0 0.885l3.762 3.762-3.762 3.76c-0.244 0.244-0.244 0.641 0 0.885l1.328 1.328c0.244 0.244 0.641 0.244 0.885 0l3.761-3.762 3.761 3.762c0.244 0.244 0.641 0.244 0.885 0l1.328-1.328c0.244-0.244 0.244-0.641 0-0.885l-3.762-3.76 3.762-3.762z"></path>
                                            </svg>
                                        </button>
                                        <LogoStack
                                            data={logoContent}
                                            onColumnClick={handleColumnClick}
                                            onColumnHover={handleColumnHover}
                                            importantResiduesList={nodeData}
                                            removeNodeHandle={handleNodeRemove}
                                            applyEntropyStructColor={applyEntropyStructColor}
                                            applyImportantStructColor={applyImportantStructColor}
                                            ref={logoStackRef}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", height: "100%", flexGrow: "1", flexDirection: isLeftCollapsed ? "column" : "row" }}>
                                <div style={{ display: "flex", flexDirection: isLeftCollapsed ? "row" : "column", justifyContent: "space-between", alignItems: "center" }}>
                                    {isLeftCollapsed ? (
                                        <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                            <title>Entropy Scale</title>
                                            <rect width="20" height="20" fill="#0000ff" x="0" />
                                            <rect width="20" height="20" fill="#0056a9" x="20" />
                                            <rect width="20" height="20" fill="#00ac53" x="40" />
                                            <rect width="20" height="20" fill="#02ff00" x="60" />
                                            <rect width="20" height="20" fill="#58ff00" x="80" />
                                            <rect width="20" height="20" fill="#aeff00" x="100" />
                                            <rect width="20" height="20" fill="#fffa00" x="120" />
                                            <rect width="20" height="20" fill="#ffa700" x="140" />
                                            <rect width="20" height="20" fill="#ff5400" x="160" />
                                            <rect width="20" height="20" fill="#ff0000" x="180" />
                                            <line x1="0" y1="10" x2="190" y2="10" stroke="black" stroke-width="2" marker-end="url(#arrowhead)" />

                                            <defs>
                                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                                                    <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                                                </marker>
                                            </defs>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="100%" preserveAspectRatio='none' viewBox="0 0 20 200" xmlns="http://www.w3.org/2000/svg">
                                            <title>Entropy Scale</title>
                                            <rect width="20" height="20" fill="#0000ff" y="180" />
                                            <rect width="20" height="20" fill="#0056a9" y="160" />
                                            <rect width="20" height="20" fill="#00ac53" y="140" />
                                            <rect width="20" height="20" fill="#02ff00" y="120" />
                                            <rect width="20" height="20" fill="#58ff00" y="100" />
                                            <rect width="20" height="20" fill="#aeff00" y="80" />
                                            <rect width="20" height="20" fill="#fffa00" y="60" />
                                            <rect width="20" height="20" fill="#ffa700" y="40" />
                                            <rect width="20" height="20" fill="#ff5400" y="20" />
                                            <rect width="20" height="20" fill="#ff0000" y="0" />
                                            <line x1="10" y1="200" x2="10" y2="10" stroke="black" stroke-width="2" marker-end="url(#arrowhead)" />

                                            <defs>
                                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                                                    <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                                                </marker>
                                            </defs>
                                        </svg>
                                    )}

                                </div>

                                <div className="pvdiv" ref={pvdiv} style={{ height: '100%', flexGrow: "1" }}>
                                    <MolstarViewer
                                        structData={structData}
                                        selectedResidue={selectedResidue}
                                        colorFile={colorArr}
                                        hoveredResidue={hoveredResidue}
                                        scrollLogosTo={(index) => logoStackRef.current.scrollToIndex(index)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tol;
