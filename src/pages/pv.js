import React, { useEffect, useRef } from 'react';
import Navbar from '../components/navbar';
import MolstarViewer from '../components/molstar';
import "../components/molstar.css";

const ProteinViewer = () => {
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
    <div>
      <Navbar pageId="Mol* Viewer" />
      <div style={{ width: '99vw', height: '90vh', overflow: 'hidden' }}>
        <MolstarViewer selectedResidue={296}/>
      </div>
    </div>
  );
};

export default ProteinViewer;
