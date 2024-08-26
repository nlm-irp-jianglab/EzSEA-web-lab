// Playground.js
import React, { useEffect, useRef, useState } from 'react';
import SkylignComponent from "../components/skylign-component";
import OULogo from "../components/oulog_copy";

import n18 from '../components/task2/N18.json'
import n19 from '../components/task2/N19.json'

const Playground = () => {
  const logoRefTop = useRef(null);
  const logoRefBot = useRef(null);
  const parent = useRef(null);
  const [scrollerTop, setScrollerTop] = useState(null);
  const [scrollerBot, setScrollerBot] = useState(null);
  const [logoContent, setLogoContent] = useState(null); // Logo data

  useEffect(() => {
    const data = {
      sourceName: "n18",
      targetName: "n19",
      source: n18,
      target: n19,
    };

    setLogoContent(data);

  }, [logoRefBot, logoRefTop]);

  const handleColumnClickTop = (index, column) => {
    logoRefBot.current.scrollToColumn(index);
  };

  const handleColumnClickBot = (index, column) => {
    logoRefTop.current.scrollToColumn(index);
  };

  const handleColumnClick = (index, column) => {
    console.log(`Column ${index} clicked`);
  };

  const handleColumnHover = (index) => {
    console.log(`Column ${index} hovered`);
  };

  return (
    <div style={{ width: '100%', height: '100%' }} ref={parent}>
      <p>Playground</p>
      <OULogo data={logoContent} onOUColumnClick={handleColumnClick} onOUColumnHover={handleColumnHover} />
    </div>
  );
};

export default Playground;