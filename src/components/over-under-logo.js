// over-under-logo.js
import React, { useEffect, useRef, useState } from 'react';
import SkylignComponent from "../components/skylign-component";
import { EasyScroller } from 'easyscroller';

export function OULogo({ data, onOUColumnClick, onOUColumnHover }) {
    const logoRefTop = useRef(null); 
    const logoRefBot = useRef(null);
    const [logoContent, setLogoContent] = useState(null); // Start with null until data is loaded

    useEffect(() => {
        if (data) {
            setLogoContent(data); // Populate data once it's available
        }
    }, [data]); // This effect runs whenever `data` changes

    useEffect(() => {
        setTimeout(() => { // Hacky timeout, TODO: should be replaced with callback when ou is rendered
            const scrollerTop = logoRefTop.current.getHmmLogo().getScroller();
            const scrollerBot = logoRefBot.current.getHmmLogo().getScroller();

            const canvasTop = document.getElementsByClassName('logo_graphic')[0];
            const canvasBot = document.getElementsByClassName('logo_graphic')[1];

            const backendScrollerTop = new EasyScroller(canvasTop, {
                scrollingX: true,
                scrollingY: false,
                animating: false,
                bouncing: false,
            });

            const backendScrollerBot = new EasyScroller(canvasBot, {
                scrollingX: true,
                scrollingY: false,
                animating: false,
                bouncing: false,
            });

            const syncScrollTop = (left, top, zoom) => {
                if (Math.floor(left) != Math.floor(scrollerBot.scroller.__scrollLeft)) {
                    backendScrollerBot.scroller.__scrollLeft = left;
                    scrollerBot.scroller.__publish(Math.floor(left), 0, 1, true);
                }
            };

            const syncScrollBot = (left, top, zoom) => {
                if (Math.floor(left) != Math.floor(scrollerTop.scroller.__scrollLeft)) {
                    backendScrollerTop.scroller.__scrollLeft = left;
                    scrollerTop.scroller.__publish(Math.floor(left), 0, 1, true);
                }
            };

            backendScrollerTop.scroller.__callback = syncScrollTop;
            backendScrollerBot.scroller.__callback = syncScrollBot;
        }, 1000);
    }, [logoContent]);

    const handleColumnClickTop = (index, column) => {
        // logoRefBot.current.scrollToColumn(index); // Removed, prefer to sync scrolling
        if (onOUColumnClick) {
            onOUColumnClick(index, column);
        }
    };

    const handleColumnClickBot = (index, column) => {
        // logoRefTop.current.scrollToColumn(index); // Removed, prefer to sync scrolling
        if (onOUColumnClick) {
            onOUColumnClick(index, column);
        }
    };
    
    const handleColumnHover = (index) => {
        if (onOUColumnHover) {
            onOUColumnHover(index);
        }
    };

    // Render nothing until logoContent is available
    if (!logoContent) {
        return <div>Loading...</div>; // Or any loading indicator you prefer
    }

    return (
        <div>
            <SkylignComponent 
                logoData={logoContent.source} 
                name={logoContent.sourceName} 
                onColumnClick={handleColumnClickTop} 
                onColumnHover={handleColumnHover} 
                ref={logoRefTop} 
            />
            <SkylignComponent 
                logoData={logoContent.target} 
                name={logoContent.targetName} 
                onColumnClick={handleColumnClickBot} 
                onColumnHover={handleColumnHover} 
                ref={logoRefBot} 
            />
        </div>
    );
}

export default OULogo;
