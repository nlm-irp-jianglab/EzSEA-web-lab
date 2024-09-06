// Playground.js
import React, { useEffect, useRef, useState } from 'react';
import * as pt from 'phylotree';
import "../components/phylotree.css";
import * as d3 from 'd3';
import Navbar from "../components/navbar";
import n18 from '../components/task2/N18.json'
import n19 from '../components/task2/N19.json'
import n24 from '../components/task2/N24.json'
import n25 from '../components/task2/N25.json'
import n26 from '../components/task2/N26.json'
import n27 from '../components/task2/N27.json'
import n28 from '../components/task2/N28.json'
import n29 from '../components/task2/N29.json'

const logoFiles = {
  'N18': n18,
  'N19': n19,
  'N24': n24,
  'N25': n25,
  'N26': n26,
  'N27': n27,
  'N28': n28,
  'N29': n29,
};

const Playground = () => {
  const treeRef = useRef(null);
  const [newickData, setNewickData] = useState(null);
  const [isRadial, setIsRadial] = useState(true);

  useEffect(() => {
    const fetchDefaultTree = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/in_ancestors.nwk`);
        const text = await response.text();
        setNewickData(text);
      } catch (error) {
        console.error("Error fetching the default tree:", error);
      }
    };

    fetchDefaultTree();
  }, []);

  useEffect(() => {
    if (treeRef.current && newickData) {
      treeRef.current.innerHTML = '';

      const tree = new pt.phylotree(newickData);
      tree.render({
        'container': "#tree_container",
        'is-radial': isRadial,
        'selectable': true,
        'zoom': true,
        'align-tips': false,
        'internal-names': true,
        width: 1000,
        height: 2000,
        'top-bottom-spacing': 'fixed-step',
        'left-right-spacing': 'fixed-step',
        'brush': false,
        'draw-size-bubbles': false,
        'bubble-styler': d => {
          return 1.5;
        },
        'show-scale': false,
        'font-size': 5,
        'background-color': 'lightblue',
      });

      treeRef.current.appendChild(tree.display.show());

      d3.select(treeRef.current)
        .selectAll('.branch')
        .on('click', async (event, branch) => {
          if (branch.selected) {
            branch.selected = false;
            event.target.classList.remove('branch-selected');
          } else {
            branch.selected = true;
            event.target.classList.add('branch-selected');
          }

          var source = branch.source.data.name;
          var target = branch.target.data.name;
          console.log(`Branch selected: ${source} -> ${target}`);
        });

      d3.select(treeRef.current)
        .selectAll('.internal-node')
        .filter(d => d.data.name in logoFiles)
        .select('circle')
        .style("fill", "red")
        .attr("r", 3);

    }
  }, [newickData, isRadial]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Navbar pageId={"Integrated Tree Viewer"} />
      <div
        id="tree_container"
        className="tree-div"
        ref={treeRef}
        style={{ width: '100%' }}
      ></div>
      <button
        className="radial-toggle-button"
        onClick={() => setIsRadial(prevIsRadial => !prevIsRadial)}
      >
        Tree Layout: ({isRadial ? 'Rectangular' : 'Radial'})
      </button>
      <button className="download-svg-button" onClick={datamonkey_save_image("svg", "#tree_container")}>
        Download Tree as SVG
      </button>
    </div>
  );
};

export default Playground;