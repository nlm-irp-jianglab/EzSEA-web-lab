import React, { useState, useRef, useEffect } from "react";
import "../components/logojs.css";
import LogoStack from "../components/logo-stack";

import n24 from '../components/task2/N24.fa';
import n25 from '../components/task2/N25.fa';
import single from '../components/task2/single.fa';
import { readFastaToDict } from '../components/utils';

export function Logo_Playground() {
  const [logoData, setLogoData] = useState(null);
  const [faData, setFaData] = useState(null);
  const [scrollIndex, setScrollIndex] = useState("");
  const OULogoRef = useRef(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [nodeData, setnodeData] = useState(null);

  // Fetching the fasta files
  useEffect(() => {
    readFastaToDict(`${process.env.PUBLIC_URL}/bilr_example/bilR_ancestors.fa`).then(data => { setFaData(data) });
    
    // Read node json file
    fetch(`${process.env.PUBLIC_URL}/bilr_example/nodes.json`).then(response => response.json()).then(data => { setnodeData(data) });


  }, []);

  useEffect(() => {
    if (faData) {
      var data = {
        "N18": `>N18\n${faData["N18"]}`,
        "N19": `>N19\n${faData["N19"]}`,
      };
      setLogoData(data);

    }
  }, [faData]);

  const handleColumnClick = (index, data) => {
    console.log("Position", data);

    // Set position and show the context menu
    setSelectedColumn(index);
    setContextMenuVisible(true);
  };

  const handleClickOutside = () => {
    setContextMenuVisible(false);
  };

  useEffect(() => {
    // Add event listener to close context menu when clicking outside
    if (contextMenuVisible) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenuVisible]);

  const handleColumnHover = (index, s) => {
    console.log(`Column ${index + 1} hovered`);
  };

  const handleScrollTo = (index) => {
    if (OULogoRef.current && index >= 0) {
      OULogoRef.current.scrollTo(index);
    }
  };

  const handleGoClick = () => {
    if (!isNaN(scrollIndex) && scrollIndex >= 0) {
      handleScrollTo(parseInt(scrollIndex, 10));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleGoClick();
    }
  };

  const handleInputValueChange = (event) => {
    setScrollIndex(event.target.value);
  };

  return (
    <div>
      {logoData && (
        <LogoStack
          data={logoData}
          onOUColumnClick={handleColumnClick}
          onOUColumnHover={handleColumnHover}
          ref={OULogoRef}
        />
      )}
      <div style={{ marginTop: "20px" }}>
        <label htmlFor="scrollInput">Scroll to column: </label>
        <input
          id="scrollInput"
          type="number"
          min="0"
          value={scrollIndex}
          onChange={handleInputValueChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter a column number"
          style={{ padding: "5px", width: "200px" }}
        />
        <button onClick={handleGoClick} style={{ marginLeft: "10px", padding: "5px 10px" }}>
          Go
        </button>
        <button onClick={() => OULogoRef.current.appendLogo("N24", n24)} style={{ marginLeft: "10px", padding: "5px 10px" }}>Add N24</button>
        <button onClick={() => OULogoRef.current.appendLogo("N25", n25)} style={{ marginLeft: "10px", padding: "5px 10px" }}>Add N25</button>
      </div>
    </div>
  );
}

export default Logo_Playground;
