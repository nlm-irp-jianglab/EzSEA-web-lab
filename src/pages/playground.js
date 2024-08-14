// Playground.js
import React from 'react';

const Playground = () => {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <iframe
                src="/basic-wrapper.html"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Playground"
            />
        </div>
    );
};

export default Playground;