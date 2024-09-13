import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import Logo from '../components/logo/logo.jsx';
import { EasyScroller } from 'easyscroller';
import { ProteinAlphabet } from "../components/logo/proteinlogo";
import { UniqueColors, ShapelyColors } from "../components/logo/alphabets_protein";
import "../components/logojs.css";
import { index } from "d3";

const OULogoJS = React.forwardRef(
    ({ data, onOUColumnClick, onOUColumnHover }, ref) => {
        const [fastaContentTop, setFastaContentTop] = useState("");
        const [fastaContentBot, setFastaContentBot] = useState("");
        const scrollerTopRef = useRef(null);
        const logoRefTop = useRef(null);
        const logoRefBot = useRef(null);

        useEffect(() => {
            if (!data) {
                console.error('No data provided to render Logo');
                return;
            }

            const { sourceName, targetName, source, target } = data;
            setFastaContentTop(source);
            setFastaContentBot(target);
        }, [data]);

        useEffect(() => {
            if (fastaContentTop && fastaContentBot) {
                const scrollerTop = new EasyScroller(logoRefTop.current, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });

                const frontScrollerTop = new EasyScroller(logoRefTop.current, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });

                const frontScrollerBot = new EasyScroller(logoRefBot.current, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });

                const scrollerBot = new EasyScroller(logoRefBot.current, {
                    scrollingX: true,
                    scrollingY: false,
                    animating: false,
                    zooming: 0,
                    minZoom: 1,
                    maxZoom: 1,
                    bouncing: false,
                });

                const syncScrollTop = (left, top, zoom) => {
                    scrollerBot.scroller.__scrollLeft = left;
                    frontScrollerBot.scroller.__publish(Math.floor(left), 0, 1, true);
                };

                const syncScrollBot = (left, top, zoom) => {
                    scrollerTop.scroller.__scrollLeft = left;
                    frontScrollerTop.scroller.__publish(Math.floor(left), 0, 1, true);
                };

                scrollerTop.scroller.__callback = syncScrollTop;
                scrollerTopRef.current = scrollerTop;
                scrollerBot.scroller.__callback = syncScrollBot;
            }
        }, [fastaContentTop, fastaContentBot]);

        

        // Function to download SVG
        const downloadSVG = (svgElement, fileName) => {
            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(svgElement);
            const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = svgUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };

        const handleDownloadTop = () => {
            const svgElement = logoRefTop.current.querySelector('svg');
            if (svgElement) {
                downloadSVG(svgElement, 'protein_logo_top.svg');
            }
        };

        const handleDownloadBot = () => {
            const svgElement = logoRefBot.current.querySelector('svg');
            if (svgElement) {
                downloadSVG(svgElement, 'protein_logo_bot.svg');
            }
        };

        useImperativeHandle(ref, () => ({
            scrollTo: (index) => {
                console.log("Scrolling to index", index);
                scrollerTopRef.current.scroller.__scrollLeft = index * 28.7;
            }
        }));

        return (
            <div>
                <div className="logo_scroller" style={{ overflow: 'hidden' }}>
                    <p>{data.sourceName}</p>
                    <div
                        className="logo_render"
                        style={{ display: 'flex', height: '200px', width: 'max-content', overflowX: 'hidden' }}
                        ref={logoRefTop}
                    >
                        {fastaContentTop && <Logo fasta={fastaContentTop} alphabet={ProteinAlphabet} onSymbolClick={onOUColumnClick} onSymbolMouseOver={onOUColumnHover} />} {/* Pass content to ProteinLogo */}
                    </div>
                    <button onClick={handleDownloadTop}>Download Top SVG</button>
                </div>

                <div className="logo_scroller" style={{ overflow: 'hidden' }}>
                    <p>{data.targetName}</p>
                    <div
                        className="logo_render"
                        style={{ display: 'flex', height: '200px', width: 'max-content', overflowX: 'hidden' }}
                        ref={logoRefBot}
                    >
                        {fastaContentBot && <Logo fasta={fastaContentBot} alphabet={ProteinAlphabet} onSymbolClick={onOUColumnClick} onSymbolMouseOver={onOUColumnHover} />} {/* Pass content to ProteinLogo */}
                    </div>
                    <button onClick={handleDownloadBot}>Download Bottom SVG</button>
                </div>
            </div>
        );
    });

export default OULogoJS;
