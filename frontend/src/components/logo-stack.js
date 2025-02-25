/**
 * logo-stack.js
 * This file is the component that displays sequence logos
 * Here is the structure of this component:
 *  <LogoStack>
 *     <DndLogo> - This layer ensures that logos are drag and droppable for easy reordering
 *       <Logo> - This layer is responsible for rendering the logos, and contains most of the logic.
 *     </DndLogo>
 *     <DndLogo>... More logos 
 * </LogoStack>   
 */
import React, { useState, useRef, useEffect, useImperativeHandle, useContext } from "react";
import { EasyScroller } from 'easyscroller';
import "./logojs.css";
import { tolContext } from '../components/tolContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndLogo } from './dndLogo.js';
import { LogoProvider } from './logoContext.js';

const LogoStack = React.forwardRef(
    /*
        data: A json object containing entries {nodeName: fasta_data}
        onColumnClick (optional): A function to handle click events on the logo
        onColumnHover (optional): A function to handle hover events on the logo
    */
    ({ data, onColumnClick, onColumnHover, importantResiduesList, removeNodeHandle, applyEntropyStructColor, applyImportantStructColor, findAndZoom }, ref) => {
        const [fastaContent, setFastaContent] = useState({});
        const logoRefs = useRef([]);
        const backScrollers = useRef([]);
        const frontScrollers = useRef([]);
        const [logoRefsChanged, setLogoRefsChanged] = useState(false);
        const [renderLogos, setRenderLogos] = useState(false);
        const { scrollPosition, setScrollPosition, seqLength, setSeqLength, logoContent, setLogoContent } = useContext(tolContext);

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
                setLogoRefsChanged(!logoRefsChanged);
            }
        };

        useEffect(() => {
            if (!data) {
                console.error('No data provided to render Logo');
                return;
            }
            // Clear logoRefs
            logoRefs.current = []; // TODO test for bugs on this

            setFastaContent(data);
        }, [data]);

        useEffect(() => {
            setRenderLogos(true);
        }, [fastaContent]);

        const scrollToIndex = (index) => {
            var rectSize = seqLength > 999 ? 20 : 21.5;

            backScrollers.current.forEach((scroller) => {
                scroller.scroller.__publish(index * rectSize, 1, 1, true);
            });

            // When one scoller is left, must manually update the front scroller
            if (backScrollers.current.length === 1) {
                frontScrollers.current[0].scroller.__publish(index * rectSize, 1, 1, true);
            }
        };

        useEffect(() => {
            backScrollers.current.forEach((scroller) => {
                scroller.destroy(); // Destroy back scrollers
            });
            frontScrollers.current.forEach((scroller) => {
                scroller.destroy(); // Destroy front scrollers
            });

            // Initialize scrollers and add event listeners
            logoRefs.current.forEach((ref) => {
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

            // Connect back and front layers of scrollers
            backScrollers.current.forEach((curr, index) => {
                curr.scroller.__callback = (left) => {
                    backScrollers.current.forEach((otherRef, otherIndex) => {
                        if (index !== otherIndex) {
                            otherRef.scroller.__scrollLeft = left;
                        }
                    });

                    frontScrollers.current.forEach((frontScroller, frontIndex) => {
                        if (index !== frontIndex) {
                            frontScroller.scroller.__publish(left, 0, 1, true);
                        }
                    });

                    const elements = document.getElementsByClassName('yaxis');
                    Array.from(elements).forEach((element) => {
                        const translationValue = left / 4.7603; // Offset the scrolling
                        element.style.transform = `translate(${translationValue}em, 10px)`;
                    });

                    setScrollPosition(Math.floor(left / 21.5));
                };
            });

            // Cleanup function to remove listeners and destroy scrollers
            return () => {
                backScrollers.current.forEach((scroller) => {
                    scroller.destroy();
                });
                frontScrollers.current.forEach((scroller) => {
                    scroller.destroy();
                });

                backScrollers.current = [];
                frontScrollers.current = [];
            };
        }, [fastaContent, logoRefsChanged]); // Add handleWheel as a dependency


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

        const removeLogo = (logoHeader) => {
            // Remove the logo from the list
            const newFastaContent = { ...fastaContent };
            delete newFastaContent[logoHeader];

            const newLogoRefs = [...logoRefs.current];
            //newLogoRefs.splice(logoHeader, 1);
            logoRefs.current = newLogoRefs;

            setFastaContent(newFastaContent);

            removeNodeHandle(logoHeader); // Call the parent function to remove the node from list in Results.js
        };

        useImperativeHandle(ref, () => ({
            scrollToHighlightIndex: (index) => {
                var rectSize = seqLength > 999 ? 20 : 21.5;
                var centerOffset = 0;

                // Pulse the residue number we scrolled to
                logoRefs.current.forEach((ref, refIndex) => {
                    try {
                        centerOffset = ref.parentNode.clientWidth / 2;

                        const target = ref.firstChild.firstChild.children[index - 1].lastChild; // Target by class instead. TODO
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
                    scroller.scroller.__publish(index * rectSize - centerOffset, 1, 1, true);
                });
                // When one scoller is left, must manually update the front scroller
                if (backScrollers.current.length === 1) {
                    frontScrollers.current[0].scroller.__publish(index * rectSize - centerOffset, 1, 1, true);
                }
            },
            scrollToIndex,
            appendLogo: (key, path) => {
                // Fetch the fasta file and append to the list
                fetchFastaFiles({ [key]: path })
                    .then(fetchedContent => {
                        setFastaContent({ ...fastaContent, ...fetchedContent });
                    })
                    .catch(error => console.error('Error fetching data:', error));
            }
        }));

        return (
            <div style={{ overflowX: 'hidden' }}>
                <LogoProvider>
                    {renderLogos ? (
                        <DndProvider backend={HTML5Backend}>
                            <DndLogo fastaContent={fastaContent} applyEntropyStructColor={applyEntropyStructColor}
                                onSymbolClick={onColumnClick} onSymbolHover={onColumnHover} importantResiduesList={importantResiduesList}
                                applyImportantStructColor={applyImportantStructColor} removeLogo={removeLogo} findAndZoom={findAndZoom} addLogoRef={addLogoRef} />
                        </DndProvider>
                    ) : (
                        <p>Loading...</p>
                    )}
                </LogoProvider>
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
