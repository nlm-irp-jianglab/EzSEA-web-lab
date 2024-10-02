import React from 'react';

const _path = `M92 26 A43 18.5 0 1 0 43 46 A42 22.5 0 1 1 9 68`;

export const S = ({ fill, fillOpacity }) => (
    <path fill="#ffffff" stroke={fill} strokeOpacity={fillOpacity} fillOpacity="0" strokeWidth="18" d={_path}/>
);
