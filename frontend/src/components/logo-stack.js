import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import Logo from './logo/logo.jsx';
import { EasyScroller } from 'easyscroller';
import { ProteinAlphabet } from "./logo/proteinlogo.jsx";
import "./logojs.css";

const LogoStack = React.forwardRef(
    /*
        data: A json object containing entries {nodeName: fasta_data}
        onColumnClick (optional): A function to handle click events on the logo
        onColumnHover (optional): A function to handle hover events on the logo
    */
    ({ data, onColumnClick, onColumnHover, importantResiduesList, removeNodeHandle, applyEntropyStructColor, applyImportantStructColor }, ref) => {
        const [fastaContent, setFastaContent] = useState({});
        const [refsUpdated, setRefsUpdated] = useState(0);
        const logoRefs = useRef([]);
        const backScrollers = useRef([]);
        const frontScrollers = useRef([]);
        const [renderLogos, setRenderLogos] = useState(false);

        const fetchFastaFiles = async (data) => {
            let fastaData = {};

            const fetchPromises = Object.keys(data).map(async (key) => {
                try {
                    const response = await fetch(data[key]);
                    const content = await response.text();
                    fastaData[key] = content;
                } catch (error) {
                    console.error(`Error fetching file for ${key}:`, error);
                }
            });

            await Promise.all(fetchPromises);
            return fastaData;
        };

        // Helper function to add logo refs
        const addLogoRef = (ref) => {
            if (ref && !logoRefs.current.includes(ref)) {
                logoRefs.current.push(ref);
                setRefsUpdated((prev) => prev + 1);
            }
        };

        useEffect(() => { // First call should use this function
            if (!data) {
                console.error('No data provided to render Logo');
                return;
            }

            setFastaContent(data);
        }, [data]);

        useEffect(() => {
            setRenderLogos(true);
        }, [fastaContent]);

        // Handling Sync Scrolling
        useEffect(() => {
            // Destroy existing scrollers - This is done to prevent overlapping scrollers
            backScrollers.current.forEach((scroller) => {
                scroller.destroy();
            });
            frontScrollers.current.forEach((scroller) => {
                scroller.destroy();
            });
            // init two layers of scrollers for each logo
            logoRefs.current.forEach((ref, index) => {
                const frontScroller = new EasyScroller(ref, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });

                const backScroller = new EasyScroller(ref, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });
                backScrollers.current.push(backScroller);
                frontScrollers.current.push(frontScroller);
            });

            // Connect back and front layer of scrollers
            backScrollers.current.forEach((curr, index) => {
                curr.scroller.__callback = (left, top, zoom) => {
                    backScrollers.current.forEach((otherRef, otherIndex) => { // Set location of back scrollers
                        if (index !== otherIndex) {
                            otherRef.scroller.__scrollLeft = left;
                        }
                    });

                    frontScrollers.current.forEach((frontScroller, frontIndex) => { // Update and render front scrollers
                        if (index !== frontIndex) {
                            frontScroller.scroller.__publish(left, 0, 1, true);
                        }
                    });
                }
            });

        }, [refsUpdated, fastaContent]);

        // Function to download SVG
        const downloadLogoSVG = (logoIndex, fileName) => {
            if (!logoRefs.current[logoIndex]) {
                console.error('Logo not found');
                return;
            }
            const svgElement = logoRefs.current[logoIndex].querySelector('svg');
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgElement);
            const styleString = `
                <style>
                    .glyphrect {
                        fill-opacity: 0.0;
                    }
                </style>`;
            source = source.replace('</svg>', `${styleString}</svg>`);
            const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = svgUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };

        const removeLogo = (logoIndex) => {
            // Remove the logo from the list
            const newFastaContent = { ...fastaContent };
            delete newFastaContent[Object.keys(fastaContent)[logoIndex]];
            // Remove logoRef from list
            logoRefs.current.splice(logoIndex, 1);
            setFastaContent(newFastaContent);
            setRefsUpdated(refsUpdated - 1);

            removeNodeHandle(logoIndex); // Call the parent function to remove the node from list in Results.js
        };

        useImperativeHandle(ref, () => ({
            scrollToIndex: (index) => {
                var firstFa = fastaContent[Object.keys(fastaContent)[0]];
                // Remove first line of fasta string
                firstFa = firstFa.substring(firstFa.indexOf('\n') + 1);

                var rectSize = firstFa.length > 999 ? 20 : 21.5;

                // Pulse the residue number we scrolled to
                logoRefs.current.forEach((ref, refIndex) => {
                    try {
                        const target = ref.firstChild.children[2].children[index - 1].lastChild;
                        //const originalFill = target.getAttribute("fill");
                        // TODO for important residues, background is blue, change to red temporarily for highlighting?

                        target.style.transition = "fill-opacity 0.3s ease";
                        let pulseCount = 0;
                        const pulseInterval = setInterval(() => {
                            if (target.style.fillOpacity === "0.3") {
                                target.style.fillOpacity = "0";
                            } else {
                                target.style.fillOpacity = "0.3";
                            }

                            pulseCount++;
                            if (pulseCount >= 6) {
                                clearInterval(pulseInterval);
                                target.style.fillOpacity = "0";
                            }
                        }, 300);
                    } catch (e) {
                        throw (e);
                    }
                })

                
                backScrollers.current.forEach((scroller) => {
                    scroller.scroller.__publish(index * rectSize, 1, 1, true);
                });
            },
            appendLogo: (key, path) => {
                // Fetch the fasta file and append to the list
                fetchFastaFiles({ [key]: path })
                    .then(fetchedContent => {
                        setFastaContent({ ...fastaContent, ...fetchedContent });
                        setRefsUpdated(refsUpdated + 1);
                    })
                    .catch(error => console.error('Error fetching data:', error));
            }
        }));

        return (
            <div style={{ overflowX: 'hidden' }}>
                {renderLogos ? (
                    Object.keys(fastaContent).map((key, index) => {
                        return (
                            <div className={"logo_" + index} key={key}>
                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "30px", margin: "3px", justifyContent: "space-between" }}>
                                    <p style={{ paddingLeft: "30px" }}><b>{key}</b></p>
                                    <span style={{ paddingRight: "30px" }}>
                                        {fastaContent[key].substring(1).indexOf('>') > 0 && // If provided seq has more than one seq, must be comparing descendants. Shows color button
                                            (<button className="logo-color-btn logo-btn" style={styles.colorBtn} onClick={() => applyEntropyStructColor(key.substring(15))}>
                                                <svg fill="#000000" width="23px" height="25px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                                                    <title>Color Entropy</title>
                                                    <path d="M392.26 1042.5c137.747-57.67 292.85-15.269 425.873 116.217l4.394 4.833c116.656 146.425 149.5 279.119 97.873 394.237-128.85 287.138-740.692 328.77-810.005 332.504L0 1896.442l61.953-91.83c.989-1.539 105.013-158.728 105.013-427.192 0-141.811 92.6-279.558 225.294-334.92ZM1728.701 23.052c54.923-1.099 99.96 15.268 135.111 49.43 40.643 40.644 58.109 87.877 56.021 140.603C1908.85 474.52 1423.33 953.447 1053.15 1280.79c-24.276-64.81-63.711-136.21-125.335-213.102l-8.787-9.886c-80.078-80.187-169.163-135.11-262.423-161.473C955.276 558.002 1460.677 33.927 1728.701 23.052Z" fillRule="evenodd" />
                                                </svg>
                                            </button>)
                                        }
                                        {importantResiduesList[key] && importantResiduesList[key].differing_residues.length > 0 && // If important residues are provided, show color button
                                            <button className="logo-color-btn logo-btn" style={styles.colorBtn} onClick={() => applyImportantStructColor(importantResiduesList[key].differing_residues, fastaContent[key])}>
                                                <svg width="22px" height="25px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <title>Color Important Residues</title>
                                                    <path d="M6.5 4l5.5 6 5.5-6zm2.273 1h6.454L12 8.52zM23 20v-8H1v8zM2 19v-6h20v6z" />
                                                    <path opacity=".5" d="M8 13h8v6H8z" /><path opacity=".25" d="M8 19H2v-6h6z" />
                                                    <path opacity=".75" d="M22 19h-6v-6h6z" />
                                                    <path fill="none" d="M0 0h24v24H0z" />
                                                </svg>
                                            </button>
                                        }
                                        <button className="logo-download-btn logo-btn" style={styles.downloadBtn} onClick={() => downloadLogoSVG(index, 'seqlogo_' + key + '.svg')}>
                                            <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <title>Download Individual</title>
                                                <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V12.1893L14.4697 10.4697C14.7626 10.1768 15.2374 10.1768 15.5303 10.4697C15.8232 10.7626 15.8232 11.2374 15.5303 11.5303L12.5303 14.5303C12.3897 14.671 12.1989 14.75 12 14.75C11.8011 14.75 11.6103 14.671 11.4697 14.5303L8.46967 11.5303C8.17678 11.2374 8.17678 10.7626 8.46967 10.4697C8.76256 10.1768 9.23744 10.1768 9.53033 10.4697L11.25 12.1893V7C11.25 6.58579 11.5858 6.25 12 6.25ZM8 16.25C7.58579 16.25 7.25 16.5858 7.25 17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H8Z" fill="#1C274C" />
                                            </svg>
                                        </button>
                                        <button className="logo-remove-btn logo-btn" style={styles.removeBtn} onClick={() => removeLogo(index)}>
                                            <svg width="25px" height="25px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                                <title>Remove from Comparison</title>
                                                <path fill="#000000" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zM288 512a38.4 38.4 0 0 0 38.4 38.4h371.2a38.4 38.4 0 0 0 0-76.8H326.4A38.4 38.4 0 0 0 288 512z" />
                                            </svg>
                                        </button>
                                    </span>
                                </div>
                                <div
                                    id="logo-stack"
                                    className="logo_render"
                                    style={{ display: 'flex', height: '150px', width: 'max-content', overflowX: 'hidden' }}
                                    ref={(el) => addLogoRef(el)}
                                >
                                    <Logo
                                        fasta={fastaContent[key]}
                                        alphabet={ProteinAlphabet}
                                        onSymbolClick={onColumnClick}
                                        importantResidues={importantResiduesList[key] || {
                                            differing_residues: [], // If no important residues are provided, default to empty list
                                        }}
                                        mode="INFORMATION_CONTENT"
                                    //onSymbolMouseOver={onColumnHover} // Disabled due to performance issues: Hovering over column is choppy. Highlighting on structure is ok
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        );
    }
);

const styles = {
    downloadBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "center",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#def2b3",
        alignItems: "center",
    },
    removeBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "left",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#f2b4b3",
    },
    colorBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "center",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#95bee8",
        alignItems: "center",
    },
}

export default LogoStack;
