import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import MolstarViewer from '../components/molstar';
import "../components/molstar.css";

const ProteinViewer = () => {
  const viewerRef = useRef(null);
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [inputResidue, setInputResidue] = useState(""); // Default value for the input field

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

  const handleInputChange = (e) => {
    setInputResidue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const residue = parseInt(inputResidue, 10);
    if (!isNaN(residue)) {
      setSelectedResidue(residue);
    }
  };

  return (
    <div>
      <Navbar pageId="Mol* Viewer" />
      <div style={{ backgroundColor: '#f5f5f5' }}>
        <form onSubmit={handleSubmit}>
          <label>
            Enter Residue Number to Highlight:
            <input
              type="number"
              value={inputResidue}
              onChange={handleInputChange}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
          <button type="submit" style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Highlight Residue
          </button>
        </form>
      </div>
      <div style={{ width: '100vw', height: '90vh', overflow: 'hidden' }}>
        <MolstarViewer selectedResidue={selectedResidue} />
      </div>
    </div>
  );
};

export default ProteinViewer;
