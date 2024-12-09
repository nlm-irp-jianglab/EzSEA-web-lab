import React, { createContext, useState } from 'react';

export const tolContext = createContext();

export const TolProvider = ({ children }) => {
    const [scrollPosition, setScrollPosition] = useState('');

    return (
        <tolContext.Provider value={{ scrollPosition, setScrollPosition }}>
            {children}
        </tolContext.Provider>
    );
};