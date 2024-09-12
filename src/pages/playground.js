import React, { useState, useRef, useEffect } from "react";
import Logo from '../components/logo/logo.jsx';
import { EasyScroller } from 'easyscroller';
import * as d3 from 'd3';
import MolstarViewer from "../components/molstar";
import Alphabet_nofill from "../components/logo/alphabet_nofill";


import n18 from '../components/task2/N18.fa';
import n19 from '../components/task2/N19.fa';

function Playground() {
  const [fastaContentTop, setFastaContentTop] = useState("");
  const [fastaContentBot, setFastaContentBot] = useState("");
  const logoRefTop = useRef(null);
  const logoRefBot = useRef(null);
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [hoveredResidue, setHoveredResidue] = useState(null);

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

  useEffect(() => {
    if (fastaContentTop && fastaContentBot) {
      const scrollerTop = new EasyScroller(logoRefTop.current, {
        scrollingX: true,
        scrollingY: false,
        animating: false,
        zooming: 0,
        minZoom: 1,
        maxZoom: 1,
        bouncing: false,
      });

      const frontScrollerTop = new EasyScroller(logoRefTop.current, {
        scrollingX: true,
        scrollingY: false,
        animating: false,
        zooming: 0,
        minZoom: 1,
        maxZoom: 1,
        bouncing: false,
      });

      const frontScrollerBot = new EasyScroller(logoRefBot.current, {
        scrollingX: true,
        scrollingY: false,
        animating: false,
        zooming: 0,
        minZoom: 1,
        maxZoom: 1,
        bouncing: false,
      });

      const scrollerBot = new EasyScroller(logoRefBot.current, {
        scrollingX: true,
        scrollingY: false,
        animating: false,
        zooming: 0,
        minZoom: 1,
        maxZoom: 1,
        bouncing: false,
      });

      const syncScrollTop = (left, top, zoom) => {
        scrollerBot.scroller.__scrollLeft = left;
        frontScrollerBot.scroller.__publish(Math.floor(left), 0, 1, true);
      };

      const syncScrollBot = (left, top, zoom) => {
        scrollerTop.scroller.__scrollLeft = left;
        frontScrollerTop.scroller.__publish(Math.floor(left), 0, 1, true);
      };

      scrollerTop.scroller.__callback = syncScrollTop;
      scrollerBot.scroller.__callback = syncScrollBot;

      // Add listeners 
      var sel = d3.select(logoRefTop.current);
      var node = sel.node();

      var childNodes = node.childNodes[0].childNodes[2].childNodes;
      childNodes.forEach((childNode, index) => {
        childNode.addEventListener("click", (event) => {
          setSelectedResidue(index + 1);
        });

        d3.select(childNode).insert("rect", ":first-child")
          .attr("class", "background")
          .attr("x", 0) // Adjust as necessary for your SVG structure
          .attr("y", 0)
          .attr("width", '73px') // Adjust width and height as needed
          .attr("height", '445px')
          .attr("fill", "lightblue");

        // Add mouseenter event listener to add background
        childNode.addEventListener("mouseenter", (event) => {
          let existingBackground = d3.select(childNode).select("rect.background");
          setHoveredResidue(index + 1);

          // If no background exists, create one
          if (existingBackground.empty()) {
            d3.select(childNode).insert("rect", ":first-child")
              .attr("class", "background")
              .attr("x", 0) // Adjust as necessary for your SVG structure
              .attr("y", 0)
              .attr("width", '73px') // Adjust width and height as needed
              .attr("height", '445px')
              .attr("fill", "lightblue");
          }
        });

        // Add mouseleave event listener to remove background
        // childNode.addEventListener("mouseleave", (event) => {
        //   d3.select(childNode).select("rect.background").remove();
        // });
      });

      sel = d3.select(logoRefBot.current);
      node = sel.node();
      childNodes = node.childNodes[0].childNodes[2].childNodes;
      childNodes.forEach((childNode, index) => {
        childNode.addEventListener("click", (event) => {
          setSelectedResidue(index + 1);
        });

        d3.select(childNode).insert("rect", ":first-child")
          .attr("class", "background")
          .attr("x", 0) // Adjust as necessary for your SVG structure
          .attr("y", 0)
          .attr("width", '73px') // Adjust width and height as needed
          .attr("height", '445px')
          .attr("fill", "lightblue");

        // Add mouseenter event listener to add background
        childNode.addEventListener("mouseenter", (event) => {
          let existingBackground = d3.select(childNode).select("rect.background");
          setHoveredResidue(index + 1);

          // If no background exists, create one
          if (existingBackground.empty()) {
            d3.select(childNode).insert("rect", ":first-child")
              .attr("class", "background")
              .attr("x", 0) // Adjust as necessary for your SVG structure
              .attr("y", 0)
              .attr("width", '73px') // Adjust width and height as needed
              .attr("height", '445px')
              .attr("fill", "lightblue");
          }
        });

        // // Add mouseleave event listener to remove background
        // childNode.addEventListener("mouseleave", (event) => {
        //   d3.select(childNode).select("rect.background").remove();
        // });
      });
    }
  }, [fastaContentTop, fastaContentBot]);

  // Function to download SVG
  const downloadSVG = (svgElement, fileName) => {
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadTop = () => {
    const svgElement = logoRefTop.current.querySelector('svg');
    if (svgElement) {
      downloadSVG(svgElement, 'protein_logo_top.svg');
    }
  };

  const handleDownloadBot = () => {
    const svgElement = logoRefBot.current.querySelector('svg');
    if (svgElement) {
      downloadSVG(svgElement, 'protein_logo_bot.svg');
    }
  };

  return (
    <div>
      <div className="logo_scroller" style={{ overflow: 'hidden' }}>
        <div
          className="logo_render"
          style={{ display: 'flex', height: '200px', width: 'max-content', overflowX: 'hidden' }}
          ref={logoRefTop}
        >
          {fastaContentTop && <Logo fasta={fastaContentTop} alphabet={Alphabet_nofill} />} {/* Pass content to ProteinLogo */}
        </div>
        <button onClick={handleDownloadTop}>Download Top SVG</button>
      </div>

      <div className="logo_scroller" style={{ overflow: 'hidden' }}>
        <div
          className="logo_render"
          style={{ display: 'flex', height: '200px', width: 'max-content', overflowX: 'hidden' }}
          ref={logoRefBot}
        >
          {fastaContentBot && <Logo fasta={fastaContentBot} alphabet={Alphabet_nofill} />} {/* Pass content to ProteinLogo */}
        </div>
        <button onClick={handleDownloadBot}>Download Bottom SVG</button>
      </div>
      <div className="pvdiv" style={{ width: '100%' }}>
        <MolstarViewer
          hoveredResidue={hoveredResidue}
          selectedResidue={selectedResidue} />
      </div>
    </div>
  );
}

export default Playground;
