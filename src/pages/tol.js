import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pt from 'phylotree';
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import "../components/phylotree.css";
import MolstarViewer from "../components/molstar";
import OULogo from "../components/over-under-logo";
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
    const pvdiv = useRef(null);
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
                'draw-size-bubbles': true,
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

            d3.select(treeRef.current)
                .selectAll('.internal-node')
                .filter(d => d.data.name in logoFiles)
                .select('circle')
                .style("fill", "red")
                .attr("r", 3);

        }
    }, [newickData, isLeftCollapsed]);

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

    const handleColumnClick = (index, column) => {
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

    return (
        <div>
            <Navbar pageId={"Integrated Tree Viewer"} />
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
                            <div className="logodiv2" style={{ width: '50%', height: '100%' }}>
                                <OULogo
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
                                    <OULogo
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
        </div>
    );
};

export default Tol;
