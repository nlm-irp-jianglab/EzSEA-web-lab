import React, { createContext, useState } from 'react';

export const logoContext = createContext();

export const LogoProvider = ({ children }) => {
    const [activeButton, setActiveButton] = useState(null); // stores which entropy color button is active
    const [compareQueue, setCompareQueue] = useState({}); // stores the rolling set of two logos to compare

    return (
        <logoContext.Provider value={{ activeButton, setActiveButton, compareQueue, setCompareQueue }}>
            {children}
        </logoContext.Provider>
    );
};