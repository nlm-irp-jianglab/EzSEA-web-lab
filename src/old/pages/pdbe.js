import React, { useEffect, useRef } from 'react';

const MolstarViewer = () => {
  const viewerRef = useRef(null);

  useEffect(() => {
    // Load the external stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://cdn.jsdelivr.net/npm/pdbe-molstar@3.2.0/build/pdbe-molstar.css';
    document.head.appendChild(link);

    // Load the external script and initialize the viewer
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdbe-molstar@3.2.0/build/pdbe-molstar-plugin.js';
    script.onload = () => {
      const viewerInstance = new window.PDBeMolstarPlugin();

      const options = {
        moleculeId: '1cbs',
        // Optional: Other options to customize the viewer's behavior
      };

      if (viewerRef.current) {
        viewerInstance.render(viewerRef.current, options);
      }
    };
    document.body.appendChild(script);

    // Cleanup script and stylesheet on component unmount
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
      <div style={{ width: '100%', height: '400px' }}>
        <div
          id="myViewer"
          ref={viewerRef}
          style={{
            width: '100%', // Set width to 100% of its parent
            height: '100%', // Set height to 100% of its parent
            position: 'relative', // Ensure the viewer is positioned relative to its container
            overflow: 'hidden', // Hide overflow to prevent scrolling
          }}
        ></div>
      </div>
  );
};

export default MolstarViewer;
