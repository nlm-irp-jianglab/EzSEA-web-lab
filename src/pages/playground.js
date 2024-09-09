import React, { useState, useRef, useEffect } from "react";
import { ProteinLogo } from 'logojs-react';
import { EasyScroller } from 'easyscroller';

function Playground() {
  const [fastaContent, setFastaContent] = useState("");
  const logoRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFastaContent(e.target.result); // Set the content to state
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (fastaContent) {
      new EasyScroller(logoRef.current, {
        scrollingX: true,
        scrollingY: false,
        animating: false,
        zooming: 0,
        minZoom: 1,
        maxZoom: 1,
        bouncing: false,
      });
    }


  }, [fastaContent]);

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <div className="logo_scroller" style={{ overflow: 'hidden' }}>
        <div className="logo_render" style={{ display: 'flex', height: '300px', width: 'max-content', overflowX: 'hidden' }} ref={logoRef}>
          {fastaContent && <ProteinLogo fasta={fastaContent}  />} {/* Pass content to Dnalogo */}
        </div>
      </div>
    </div>
  );
}

// Generating logo throws a warning. Invalid property passed into the svg?
/*
const Logo = ({ fasta }) => {
    return (
        <div style={{overflow: "scroll"}}> 
            <ProteinLogo fasta={fasta} glyphWidth={100}/>
        </div>
    );
};*/

export default Playground;
