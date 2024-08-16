import React, { useEffect, useRef, useState } from 'react';
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
