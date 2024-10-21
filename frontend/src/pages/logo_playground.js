import React, { useState, useRef, useEffect } from "react";
import "../components/logojs.css";
import Loading from "../components/loading";

export function Logo_Playground() {

  const pathToScript = `${process.env.PUBLIC_URL}/example_2/Coevolution/seq.json`;
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${process.env.PUBLIC_URL}/evzoom.js`; // Ensure correct path relative to 'public' folder
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Cleanup when the component is unmounted
    };
  }, []);
  
  return (
    <div>
      <div id="evzoom-viewer" data-couplings={pathToScript}> </div>

    </div>
  );
}

export default Logo_Playground;
