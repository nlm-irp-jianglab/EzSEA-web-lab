import React, { createContext, useState } from 'react';

export const logoContext = createContext();

export const LogoProvider = ({ children }) => {
    const [activeButton, setActiveButton] = useState(null); 

    return (
        <logoContext.Provider value={{ activeButton, setActiveButton }}>
            {children}
        </logoContext.Provider>
    );
};