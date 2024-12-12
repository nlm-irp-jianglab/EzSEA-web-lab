import React, { createContext, useState } from 'react';

export const tolContext = createContext();

export const TolProvider = ({ children }) => {
    const [scrollPosition, setScrollPosition] = useState('');
    const [seqLength, setSeqLength] = useState(0);
    const [logoContent, setLogoContent] = useState({});
    const [logoAlphabet, setLogoAlphabet] = useState(0);

    return (
        <tolContext.Provider value={{
            scrollPosition, setScrollPosition, seqLength, setSeqLength,
            logoContent, setLogoContent, logoAlphabet, setLogoAlphabet
        }}>
            {children}
        </tolContext.Provider>
    );
};