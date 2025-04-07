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
        onColumnClick (optional): A function to handle click events on the logo
        onColumnHover (optional): A function to handle hover events on the logo
    */
    ({ onColumnClick, onColumnHover, importantResiduesList, removeNodeHandle, applyEntropyStructColor, applyImportantStructColor, findAndZoom }, ref) => {

        const logoRefs = useRef([]);
        const backScrollers = useRef([]);
        const frontScrollers = useRef([]);
        const [logoRefsChanged, setLogoRefsChanged] = useState(false);
        const [renderLogos, setRenderLogos] = useState(false);
        const { scrollPosition, setScrollPosition, seqLength, setSeqLength, logoContent, setLogoContent } = useContext(tolContext);

        // Helper function to add logo refs
        const addLogoRef = (ref) => {
            if (ref && !logoRefs.current.includes(ref)) {
                logoRefs.current.push(ref);
                setLogoRefsChanged(!logoRefsChanged);
            }
        };

        useEffect(() => {
            if (!logoContent) {
                console.error('No logoContent provided to render Logo');
                return;
            }
            // Clear logoRefs
            logoRefs.current = []; // TODO test for bugs on this

            setRenderLogos(true);
        }, [logoContent]);

        // Function to scroll to a specific index in the logo stack
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
            // Cleanup previous scrollers
            [...backScrollers.current, ...frontScrollers.current].forEach(scroller => scroller.destroy());
            backScrollers.current = [];
            frontScrollers.current = [];

            // Initialize new scrollers
            logoRefs.current.forEach((ref) => {
                const scrollerConfig = {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                };

                backScrollers.current.push(new EasyScroller(ref, scrollerConfig));
                frontScrollers.current.push(new EasyScroller(ref, scrollerConfig));
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
                [...backScrollers.current, ...frontScrollers.current].forEach(scroller => scroller.destroy());
                backScrollers.current = [];
                frontScrollers.current = [];
            };
        }, [logoContent, logoRefsChanged]); // Add handleWheel as a dependency

        const removeLogo = (logoHeader) => {
            // Remove the logo from the list
            const newFastaContent = { ...logoContent };
            delete newFastaContent[logoHeader];

            const newLogoRefs = [...logoRefs.current];
            //newLogoRefs.splice(logoHeader, 1);
            logoRefs.current = newLogoRefs;

            setLogoContent(newFastaContent);

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
            scrollToIndex
        }));

        return (
            <div style={{ overflowX: 'hidden' }}>
                <LogoProvider>
                    {renderLogos ? (
                        <DndProvider backend={HTML5Backend}>
                            <DndLogo logoContent={logoContent} applyEntropyStructColor={applyEntropyStructColor}
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

export default LogoStack;
