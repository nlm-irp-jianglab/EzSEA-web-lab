import React, { createContext, useState } from 'react';

export const tolContext = createContext();

export const TolProvider = ({ children }) => {
    const [scrollPosition, setScrollPosition] = useState('');
    const [seqLength, setSeqLength] = useState(0);
    const [logoContent, setLogoContent] = useState({});
    const [logoAlphabet, setLogoAlphabet] = useState(11);
    const [compareSelections, setCompareSelections] = useState({});
    const [compareDiff, setCompareDiff] = useState(null); // stores the differences between the two logos
    const [inputSequence, setInputSequence] = useState(null); // stores the input sequence for referencing gaps between logos and pdb viewer

    return (
        <tolContext.Provider value={{
            scrollPosition, setScrollPosition, seqLength, setSeqLength,
            logoContent, setLogoContent, logoAlphabet, setLogoAlphabet,
            compareSelections, setCompareSelections, compareDiff, setCompareDiff
        }}>
            {children}
        </tolContext.Provider>
    );
};