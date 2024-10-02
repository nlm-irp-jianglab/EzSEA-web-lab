import React from 'react';

const _path = `M 85 100 L 55 70 L 70 55 L 100 85 L 85 100`;

const _circlePath = `M 50,0
                    A 50,50 0 1,1 50,100
                    A 50,50 0 1,1 50,0 Z
                    M 50,18
                    A 32,32 0 1,0 50,82
                    A 32,32 0 1,0 50,18 Z`;

export const Q = props => (
    <g>
        <path d={_circlePath} fillRule="evenodd" {...props} />
        <path d={_path} {...props} />
    </g>
);
