import React, { useState, useRef, useEffect } from "react";
import "../components/logojs.css";
import OULogoJS from "../components/over-under-logojs";

import n18 from '../components/task2/N18.fa';
import n19 from '../components/task2/N19.fa';

export function Playground() {
  const [fastaContentTop, setFastaContentTop] = useState("");
  const [fastaContentBot, setFastaContentBot] = useState("");
  const [logoData, setLogoData] = useState(null);
  const [scrollIndex, setScrollIndex] = useState("");
  const OULogoRef = useRef(null);

  // Fetching the fasta files
  useEffect(() => {
    fetch(n18)
      .then(response => response.text())
      .then(data => {
        setFastaContentTop(data);
      })
      .catch(error => console.error('Error fetching file:', error));

    fetch(n19)
      .then(response => response.text())
      .then(data => {
        setFastaContentBot(data);
      })
      .catch(error => console.error('Error fetching file:', error));
  }, []);

  // Preparing the logo data
  useEffect(() => {
    if (!fastaContentTop || !fastaContentBot) {
      console.error('No data provided to render Logo');
      return;
    }

    const data = {
      sourceName: "N18",
      targetName: "N19",
      source: fastaContentTop,
      target: fastaContentBot,
    };

    setLogoData(data);
  }, [fastaContentBot, fastaContentTop]);

  const handleColumnClick = (index, s) => {
    console.log(`Column ${index + 1} clicked`);
  };

  const handleColumnHover = (index, s) => {
    console.log(`Column ${index + 1} hovered`);
  };

  const handleScrollTo = (index) => {
    if (OULogoRef.current && index >= 0) {
      OULogoRef.current.scrollTo(index);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    if (!isNaN(value) && value >= 0) {
      setScrollIndex(value);
      handleScrollTo(parseInt(value, 10));
    } else {
      setScrollIndex("");
    }
  };

  return (
    <div>
      {logoData && (
        <OULogoJS
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
          onChange={handleInputChange}
          placeholder="Enter a column number"
          style={{ padding: "5px", width: "200px" }}
        />
      </div>
    </div>
  );
}

export default Playground;
