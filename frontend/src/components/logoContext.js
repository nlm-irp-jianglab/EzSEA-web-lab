import React, { createContext, useState } from 'react';

export const logoContext = createContext();

export const LogoProvider = ({ children }) => {
    const [activeButton, setActiveButton] = useState(null); // stores which entropy color button is active
    const [compareQueue, setCompareQueue] = useState({}); // stores the rolling set of two logos to compare
    const [compareDiff, setCompareDiff] = useState(null); // stores the differences between the two logos

    return (
        <logoContext.Provider value={{ activeButton, setActiveButton, compareQueue, setCompareQueue, compareDiff, setCompareDiff }}>
            {children}
        </logoContext.Provider>
    );
};