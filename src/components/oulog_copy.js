import React, { useEffect, useRef, useState } from 'react';
import { EasyScroller } from 'easyscroller';
import SkylignComponent from "../components/skylign-component";

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
        setTimeout(() => { //Hacky fix, better to reference the underlying scroller elem: SklignComp > hmmLogo > scrollme > scroller
            const canvasTop = document.getElementsByClassName('logo_graphic')[0];
            const canvasBot = document.getElementsByClassName('logo_graphic')[1];

            const scrollerTop = new EasyScroller(canvasTop, {
                scrollingX: true,
                scrollingY: false,
                animating: false,
                bouncing: false,
            });

            const scrollerBot = new EasyScroller(canvasBot, {
                scrollingX: false,
                scrollingY: false,
                animating: false,
                bouncing: false,
            });

            const syncScroll = (left, top, zoom) => {
                if (Math.floor(scrollerTop.scroller.__scrollLeft) != Math.floor(scrollerBot.scroller.__scrollLeft)) {
                    console.log("Syncing top to bot");
                    scrollerBot.scroller.__publish(Math.floor(left), 0, 1, true);
                }
            };

            scrollerTop.scroller.__callback = syncScroll;
        }, 1000);
    }, []);

    const handleColumnClickTop = (index, column) => {
        if (onOUColumnClick) {
            onOUColumnClick(index, column);
        }
    };

    const handleColumnClickBot = (index, column) => {
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
