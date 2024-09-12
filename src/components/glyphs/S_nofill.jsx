import React from 'react';

const _path = `M92 26 A43 20 0 1 0 43 46 A42 23 0 1 1 9 68`;

console.log("DEFINED S");

export const S = ({ fill, fillOpacity }) => {
    return <path strokeOpacity={fillOpacity} fillOpacity="0" strokeWidth="18" d={_path} />;
};

export default S;