import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pt from 'phylotree';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import "../components/phylotree.css";
import "../components/tol.css";
import MolstarViewer from "../components/molstar";
import OULogoJS from "../components/over-under-logojs";
import { readFastaFromFile } from '../components/utils';

import n18 from '../components/task2/N18.fa'
import n19 from '../components/task2/N19.fa'
import n24 from '../components/task2/N24.fa'
import n25 from '../components/task2/N25.fa'
import n26 from '../components/task2/N26.fa'
import n27 from '../components/task2/N27.fa'
import n28 from '../components/task2/N28.fa'
import n29 from '../components/task2/N29.fa'

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
    const pvdiv = useRef(null);
    const [isRadial, setIsRadial] = useState(true);
    const [newickData, setNewickData] = useState(null);
    const [logoContent, setLogoContent] = useState(null);
    const [pipVisible, setPipVisible] = useState(false);
    const [selectBranch, setSelectBranch] = useState(null);
    const [selectedResidue, setSelectedResidue] = useState(null);
    const [hoveredResidue, setHoveredResidue] = useState(null);
    const [colorFile, setColorFile] = useState(null);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

    useEffect(() => {
        const fetchDefaultTree = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/in_ancestors.nwk`);
                const text = await response.text();
                setNewickData(text);
            } catch (error) {
                console.error("Error fetching the default tree:", error);
            }
        };

        fetchDefaultTree();
    }, []);

    useEffect(() => {
        if (treeRef.current && newickData) {
            treeRef.current.innerHTML = '';

            const tree = new pt.phylotree(newickData);
            tree.render({
                'container': "#tree_container",
                'is-radial': isRadial,
                'selectable': true,
                'zoom': true,
                'align-tips': false,
                'internal-names': true,
                width: 1000,
                height: 2000,
                'top-bottom-spacing': 'fixed-step',
                'left-right-spacing': 'fixed-step',
                'brush': false,
                'draw-size-bubbles': false,
                'bubble-styler': d => {
                    return 1.5;
                },
                'show-scale': false,
                'font-size': 5,
                'background-color': 'lightblue',
            });

            treeRef.current.appendChild(tree.display.show());

            d3.select(treeRef.current)
                .selectAll('.branch')
                .on('click', async (event, branch) => {
                    if (branch.selected) {
                        branch.selected = false;
                        event.target.classList.remove('branch-selected');
                    } else {
                        branch.selected = true;
                        event.target.classList.add('branch-selected');
                    }

                    var source = branch.source.data.name;
                    var target = branch.target.data.name;

                    if (!logoFiles[source] || !logoFiles[target]) {
                        setSelectedResidue(null);
                        setColorFile(null);
                        setLogoContent(null);
                        setPipVisible(false);
                        setSelectBranch(null);
                        treeRef.current.style.width = '100%';
                        return;
                    } else {
                        var data = {
                            sourceName: source,
                            targetName: target,
                            source: await readFastaFromFile(logoFiles[source]),
                            target: await readFastaFromFile(logoFiles[target]),
                        }
                        treeRef.current.style.width = '50%';
                        setColorFile(`${source}_${target}.color.txt`);
                        setLogoContent(data);
                        setSelectBranch(branch);
                        setPipVisible(true);
                    }
                });

            d3.select(treeRef.current)
                .selectAll('.internal-node')
                .filter(d => d.data.name in logoFiles)
                .select('circle')
                .style("fill", "red")
                .attr("r", 3);

        }
    }, [newickData, isLeftCollapsed, isRadial]);

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
        setSelectedResidue(index);
    };

    const handleColumnHover = (index) => {
        setHoveredResidue(index);
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

                {selectBranch && (
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

                {pipVisible && selectBranch && logoContent && !isRightCollapsed && (
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
                                <OULogoJS
                                    data={logoContent}
                                    onOUColumnClick={handleColumnClick}
                                    onOUColumnHover={handleColumnHover}
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
                                            setSelectBranch(null);
                                            setIsLeftCollapsed(false);
                                        }}
                                    >
                                        X
                                    </button>
                                    <OULogoJS
                                        data={logoContent}
                                        onOUColumnClick={handleColumnClick}
                                        onOUColumnHover={handleColumnHover}
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
