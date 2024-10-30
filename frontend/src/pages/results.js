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
import { fastaToDict, parseNodeData, calcEntropyFromMSA, mapEntropyToColors, jsonToFasta } from '../components/utils';
import { useParams } from 'react-router-dom';
import * as d3 from 'd3';
import ErrorPopup from '../components/errorpopup';
import Footer from '../components/footer';

const Results = () => {
    const { jobId } = useParams();
    // State to store the tree data and node data
    const [faData, setFaData] = useState(null); // Fasta data for the internal nodes (ancestral)
    const [leafData, setLeafData] = useState(null); // Fasta data for the leaf nodes
    const [newickData, setNewickData] = useState(null); // Tree
    const [nodeData, setnodeData] = useState(null); // asr stats, important residues
    const [structData, setStructData] = useState(null); // Structure data
    const [topNodes, setTopNodes] = useState({}); // Top 10 nodes for the tree

    // State to store the logo content (formatted for logoJS) and color file
    const [logoContent, setLogoContent] = useState({}); // Dict of Node: sequences used for rendering seqlogo
    const [colorArr, setColorArr] = useState(null);

    // For live updates linking sequence logo and structure viewer
    const [selectedResidue, setSelectedResidue] = useState(null);
    const [hoveredResidue, setHoveredResidue] = useState(null); // Currently not in use

    // States for rendering control
    const [pipVisible, setPipVisible] = useState(false);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

    // References for rendering
    const treeRef = useRef(null);
    const pvdiv = useRef(null);
    const logoStackRef = useRef(null);
    const zoomInputRef = useRef(null);

    // Storing tree reference itself
    const [treeObj, setTreeObj] = useState(null);
    const [isErrorPopupVisible, setErrorPopupVisible] = useState(false);

    // Fetch the tree data and node data on component mount, store data into states
    useEffect(() => {
        try {
            const response = fetch(`/api/results/${jobId}`);
            response.then(res => res.json())
                .then(data => {
                    // Check if error
                    if (data.error) {
                        setErrorPopupVisible(true);
                        console.error("Error reading results:", data.error);
                        return;
                    }
                    // Check if individual read errors are present
                    if (data.treeError) {
                        setErrorPopupVisible(true);
                        console.error("Error fetching tree data:", data.treeError);
                    } else {
                        setNewickData(data.tree);
                    }

                    if (data.leafError) {
                        setErrorPopupVisible(true);
                        console.error("Error fetching leaf data:", data.leafError);
                    } else {
                        fastaToDict(data.leaf).then((fastaDict) => setLeafData(fastaDict));
                    }

                    if (data.ancestralError) {
                        setErrorPopupVisible(true);
                        console.error("Error fetching ancestral data:", data.ancestralError);
                    } else {
                        fastaToDict(data.ancestral).then((fastaDict) => setFaData(fastaDict));
                    }

                    if (data.nodesError) {
                        setErrorPopupVisible(true);
                        console.error("Error fetching nodes data:", data.nodesError);
                    } else {
                        const json = JSON.parse(data.nodes);
                        parseNodeData(json).then((parsedData) => setnodeData(parsedData));
                        parseNodeData(json.slice(0, 10)).then((parsedData) => setTopNodes(parsedData));
                    }

                    if (data.structError) {
                        // setErrorPopupVisible(true);
                        console.error("Error fetching structure data:", data.structError);
                    } else {
                        setStructData(data.struct);
                    }

                });
        } catch (error) {
            setErrorPopupVisible(true);
            console.error("Error fetching results:", error);
        };
    }, []);

    // Deals with tree rendering
    useEffect(() => {
        if (treeRef.current && newickData && nodeData) {
            treeRef.current.innerHTML = '';

            const tree = new pt.phylotree(newickData);

            // Dynamically sizing text and padding of node labels
            // var textsize = 0;
            // var padding = "";

            // if (Object.keys(faData).length > 400) {
            //     textsize = 4;
            //     padding = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
            // } else if (Object.keys(faData).length > 250) {
            //     textsize = 4;
            //     padding = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
            // } else if (Object.keys(faData).length > 100) {
            //     textsize = 6;
            //     padding = "\u00A0\u00A0\u00A0";
            // } else {
            //     textsize = 20;
            //     padding = "\u00A0";
            // }

            function style_nodes(element, node_data) {
                var node_label = element.select("text");

                if (!isLeafNode(node_data)) { // edits to the internal nodes
                    node_label.text("\u00A0" + node_label.text() + "\u00A0")
                        .style("font-weight", "bold");

                    if (topNodes && node_data.data.name in topNodes) { // First condition to ensure topNodes is populated
                        element.select("circle").style("fill", "green");
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

            setTreeObj(tree);


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
                'bubble-styler': d => { return 1.5 },
                'node-styler': style_nodes,
                'edge-styler': style_edges,
                'show-scale': false,
                'font-size': 12,
                'background-color': 'lightblue',
                'collapsible': true,
                'reroot': false,
                'hide': false, // Causes weird rendering in radial
            });

            treeRef.current.appendChild(tree.display.show());
        }
    }, [newickData, faData]);

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


    const pushNodeToLogo = (node, comp_desc = false) => {
        // Add node to logoContent, if already in list, remove it
        setLogoContent(prevLogoContent => {
            const updatedLogoContent = { ...prevLogoContent };

            // Add or do nothing if node is already in logoContent
            if (node.data.name in updatedLogoContent) {
                return updatedLogoContent;
            } else {
                if (comp_desc) {
                    var descendants = selectAllDescendants(node, false, true);
                    var desc_fa = "";
                    for (var desc of descendants) {
                        desc_fa += `>${desc.data.name}\n${faData[desc.data.name]}\n`;
                    }
                    if (desc_fa === "") {
                        console.log("No descendants found for node:", node.data.name);
                        return updatedLogoContent;
                    }

                    node['compare-node'] = true;
                    node['compare-descendants'] = true;

                    updatedLogoContent[node.data.name] = desc_fa;
                    setNodeColor(node.data.name, "yellow");
                } else {
                    node['compare-node'] = true;
                    updatedLogoContent[node.data.name] = `>${node.data.name}\n${faData[node.data.name]}`;
                    setNodeColor(node.data.name, "red");
                }
            }

            return updatedLogoContent;  // Return the new state
        });

    };

    const pushNodeToEntropyLogo = (node) => {
        setLogoContent(prevLogoContent => {
            const updatedLogoContent = { ...prevLogoContent };

            // Add or remove node from logoContent
            var descendants = selectAllDescendants(node, false, true);
            var desc_fa = "";
            for (var desc of descendants) {
                desc_fa += `>${desc.data.name}\n${faData[desc.data.name]}\n`;
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
                            d3.select(this).insert("circle", ":first-child").attr("r", 5).style("fill", color);
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

    const applyStructColor = (nodeId) => {
        console.log("Applying structure color for node:", nodeId);
        // Grabbing node data from tree, note will not work if tree is not rendered
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

    const clearRightPanel = () => {
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
        console.log("Column hovered:", index);
        setHoveredResidue(index + 1);
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
                    pushNodeToLogo(node)
                    pushNodeToLogo(node.parent);
                    pushNodeToEntropyLogo(node);
                }
            });
        console.log("Viewing important node:", nodeId);
    }

    const toggleLeftCollapse = () => {
        setIsLeftCollapsed(!isLeftCollapsed);
    };

    const toggleRightCollapse = () => {
        console.log("Toggling right collapse");
        setIsRightCollapsed(!isRightCollapsed);
        isRightCollapsed ? setPipVisible(true) : setPipVisible(false);
    };

    const handleDownload = (filename, content, fasta = false) => {
        // If content is an object, stringify it; otherwise, use the content as it is
        var fileContent;
        if (fasta) {
            fileContent = jsonToFasta(content);
        } else {
            fileContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
        }

        // Create a Blob and download the file
        const element = document.createElement("a");
        const file = new Blob([fileContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };


    const downloadsDropdown = () => (
        <div className="dropdown">
            <button className="dropbtn-downloads">Download Files</button>
            <div className="dropdown-content" style={{ zIndex: "2" }}>
                <button onClick={() => handleDownload(`${jobId}_asr_nodes.fa`, faData, true)}>Ancestral Sequences</button>
                <button onClick={() => handleDownload(`${jobId}_leaf_nodes.fa`, leafData, true)}>Leaf Sequences</button>
                <button onClick={() => handleDownload(`${jobId}_nodes.json`, nodeData)}>Node Info</button>
                <button onClick={() => handleDownload(`${jobId}_struct.pdb`, structData)}>Structure PDB</button>
                <button onClick={() => handleDownload(`${jobId}_tree_data.nwk`, newickData)}>Tree Newick</button>
                <button onClick={downloadTreeAsSVG}>Tree SVG</button>
            </div>
        </div>
    );

    const importantNodesDropdown = () => (
        <div className="dropdown">
            <button className="dropbtn-nodes">Important Nodes</button>
            <div className="dropdown-content" style={{ zIndex: "2" }}>
                {Object.keys(topNodes).map(key => (
                    <button key={key} onClick={() => setImportantView(key)}>
                        <span style={{ fontWeight: "bold" }}>{key}</span> Score: {topNodes[key]['score'].toFixed(2)}
                    </button>
                ))}
            </div>
        </div>
    );

    const findAndZoom = (query) => {
        const svg = d3.select("svg");
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
            console.log("Failed to find and zoom to node:", query);
        }
    };

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
        downloadLink.download = "tree.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
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
        <div>
            <Navbar pageId={`Results: ${jobId}`} />
            {isErrorPopupVisible && (
                <ErrorPopup errorMessage="Results not available" onClose={() => setErrorPopupVisible(false)} />
            )}
            <div className="btn-toolbar" style={{ display: "flex", justifyContent: "space-between", height: "40px" }}>
                <span>
                    {importantNodesDropdown()}
                    {downloadsDropdown()}
                    <input className="zoomInput" ref={zoomInputRef} placeholder='Find Node'></input>
                    <button onClick={() => findAndZoom(zoomInputRef.current.value)}>Go</button>
                </span>
            </div>
            <div style={{ display: 'flex', height: '90vh', margin: '0 20px' }}>
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
                                    applyStructColor={applyStructColor}
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
                                        X
                                    </button>
                                    <LogoStack
                                        data={logoContent}
                                        onColumnClick={handleColumnClick}
                                        onColumnHover={handleColumnHover}
                                        importantResiduesList={nodeData}
                                        removeNodeHandle={handleNodeRemove}
                                        applyStructColor={applyStructColor}
                                        ref={logoStackRef}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pvdiv" ref={pvdiv} style={{ width: isLeftCollapsed ? '50%' : '100%', height: '100%' }}>
                            <MolstarViewer
                                structData={structData}
                                selectedResidue={selectedResidue}
                                colorFile={colorArr}
                                hoveredResidue={hoveredResidue}
                                scrollLogosTo={(index) => logoStackRef.current.scrollToIndex(index)}
                            />
                        </div>
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
};

export default Results;
