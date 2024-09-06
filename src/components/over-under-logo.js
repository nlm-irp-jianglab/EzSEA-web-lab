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
            var scrollerTop;
            var scrollerBot;

            try {
                scrollerTop = logoRefTop.current.getHmmLogo().getScroller();
                scrollerBot = logoRefBot.current.getHmmLogo().getScroller();
            } catch (e) {
                console.error("Scroller not found. Retrying in 1s...");
                return;
            }

            const canvasTop = document.getElementsByClassName('logo_graphic')[0];
            const canvasBot = document.getElementsByClassName('logo_graphic')[1];

            const frontScrollerTop = new EasyScroller(canvasTop, {
                scrollingX: true,
                scrollingY: false,
                animating: false,
                bouncing: false,
            });

            const frontScrollerBot = new EasyScroller(canvasBot, {
                scrollingX: true,
                scrollingY: false,
                animating: false,
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
            scrollerBot.scroller.__callback = syncScrollBot;
        }, 1000);
    }, [logoContent]);

    const handleColumnClickTop = (index, column) => {
        logoRefBot.current.scrollToColumn(index); 
        if (onOUColumnClick) {
            onOUColumnClick(index, column);
        }
    };

    const handleColumnClickBot = (index, column) => {
        logoRefTop.current.scrollToColumn(index); 
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
