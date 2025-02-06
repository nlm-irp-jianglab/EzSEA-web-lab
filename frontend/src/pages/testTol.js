// React Core
import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// Third Party Libraries
import * as d3 from 'd3';
import { isLeafNode, selectAllDescendants } from 'phylotree/src/nodes';
import { ZstdInit, ZstdDec } from '@oneidentity/zstd-js/decompress';

// Material UI Components
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Slider } from '@mui/material';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// Material UI Icons
import FilterCenterFocusIcon from '@mui/icons-material/FilterCenterFocus';
import LabelIcon from '@mui/icons-material/Label';
import RestoreIcon from '@mui/icons-material/Restore';

// Local Components
import DownloadDialog from '../components/downloadlogo.tsx';
import LogoStack from '../components/logo-stack.js';
import MolstarViewer from "../components/molstar.js";
import { tolContext } from '../components/tolContext.js';
import { readFastaToDict, parseNodeData, calcEntropyFromMSA, mapEntropyToColors, jsonToFasta } from '../components/utils.js';

// Tree3
import { RadialTree } from '../components/tree3/radial.tsx';
import { RectTree } from '../components/tree3/rect.tsx';
import { selectAllLeaves } from '../components/tree3/utils.ts';

// Styles
import "../components/phylotree.css";
import "../components/tol.css";

const TestTol = () => {
  // State to store the tree data and node data
  const [faData, setFaData] = useState(null);
  const [leafData, setLeafData] = useState({});
  const [newickData, setNewickData] = useState(null);
  const [nodeData, setNodeData] = useState(null);
  const [structData, setStructData] = useState(null); // Structure data
  const [pocketData, setPocketData] = useState({}); // Pocket data

  const [topNodes, setTopNodes] = useState({}); // Top 10 nodes for the tree
  const [asrData, setAsrData] = useState(null);

  // State to store the logo content (formatted for logoJS) and color file
  const [colorArr, setColorArr] = useState(null);

  // Context states
  const { scrollPosition, setScrollPosition, seqLength, setSeqLength,
    logoContent, setLogoContent, logoAlphabet, setLogoAlphabet } = useContext(tolContext);

  // For live updates linking sequence logo and structure viewer
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [hoveredResidue, setHoveredResidue] = useState(null); // Currently not in use

  // States for rendering control
  const [treeLayout, setTreeLayout] = useState('radial');
  const layouts = ['radial', 'rectangular', 'unrooted'];
  const [pipVisible, setPipVisible] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notification, setNotification] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [labelMenuAnchor, setLabelMenuAnchor] = useState(null);
  const labelMenuOpen = Boolean(labelMenuAnchor);

  // References for rendering
  const treeRef = useRef(null);
  const pvdiv = useRef(null);
  const logoStackRef = useRef(null);
  const scrollInputRef = useRef(null);
  const [importantResidues, setImportantResidues] = useState([]);

  // Add state for tree key
  const [treeKey, setTreeKey] = useState(0);


  const cycleLayout = () => {
    const currentIndex = layouts.indexOf(treeLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setTreeLayout(layouts[nextIndex]);
  };

  // Fetch the tree data and node data on component mount, store data into states
  useEffect(() => {
    const fetchDefaultTree = async () => { // Fetch the default tree data
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/example/asr.tree`);
        const text = await response.text();
        setNewickData(text);
      } catch (error) {
        console.error("Error fetching the default tree:", error);
      }
    };

    fetchDefaultTree();

    readFastaToDict(`${process.env.PUBLIC_URL}/example/asr.fa`).then(data => {
      setFaData(data);
      setSeqLength(data[Object.keys(data)[0]].length);
    });


    fetch(`${process.env.PUBLIC_URL}/example/nodes.json`)
      .then(response => response.json())
      .then((json) => {
        //parseNodeData(json.slice(0, 10)).then((parsedData) => setTopNodes(parsedData));
        parseNodeData(json).then((parsedData) => setNodeData(parsedData));
      });

    readFastaToDict(`${process.env.PUBLIC_URL}/example/seq_trimmed.afa`).then(data => { setLeafData(data) });

    // Fetch pocket data
    Promise.all([1, 2, 3, 4, 5].map(i =>
      fetch(`${process.env.PUBLIC_URL}/example/pockets/pocket${i}_atm.pdb`)
        .then(response => response.text())
        .then(text => ({ [`pocket${i}`]: text }))
    ))
      .then(pocketArray => {
        const pocketData = Object.assign({}, ...pocketArray);
        setPocketData(pocketData);
      })
      .catch(error => console.error('Error loading pocket data:', error));

    const uint8ArrayToString = (uint8Array) => {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(uint8Array);
    };

    ZstdInit().then(({ ZstdSimple, ZstdStream }) => {
      // Load the compressed data
      fetch(`${process.env.PUBLIC_URL}/example/seq.state.zst`).then(response => {
        response.arrayBuffer().then(compressedData => {
          // Decompress the compressed simple data
          const decompressedStreamData = ZstdStream.decompress(new Uint8Array(compressedData));
          const asrDict = JSON.parse(uint8ArrayToString(decompressedStreamData))
          setAsrData(asrDict);
        });
      });

    });
  }, []);

  function style_nodes(node) { // nodes are all internal
    if (topNodes && node.data.name in topNodes) { // First condition to ensure nodeData is populated
      element.select("circle").style("fill", "green").attr("r", 5);
    }
  }

  function style_leaves(node) {
    if (node.data.name === "bilR") {
      d3.select(node.labelElement).style("fill", "red").style("font-size", () => {
        const currentSize = d3.select(node.labelElement).style("font-size");
        const sizeNum = parseFloat(currentSize);
        return (sizeNum + 2) + "px";
      });
    }
  }

  function style_edges(source, target) {
    if (target.children) { // Targets only node to node links as leaf nodes have no children property
      const element = d3.select(target.linkNode);
      element.on('click', async (event, branch) => {
        if (branch.selected) {
          branch.selected = false;

          event.target.classList.remove('link--highlight');
          console.log("removing from compare")
          // TODO Remove from compare
          // removeNodeFromLogo(branch.source); // Remove the node from logoContent if already present
          // removeNodeFromLogo(branch.target);
        } else {
          branch.selected = true;
          console.log("adding to compare")
          event.target.classList.add('link--highlight');

          var source = branch.source.data.name;
          var target = branch.target.data.name;
          console.log("Selected branch:", source, target);
          // TODO ADD TO COMPARE
          // if (!faData[source] || !faData[target]) {
          //     console.log("Missing node data for branch.", faData[source], faData[target]);
          //     clearRightPanel();
          //     return;
          // } else {
          //     pushNodeToLogo(branch.source);
          //     pushNodeToLogo(branch.target);
          // }
        }
      });
    }
  }

  function onNodeClick(event, node) {
    console.log(node);
  }

  // Custom menu items for nodes
  const nodeMenu = useMemo(() => [
    { // Compare Descendants Option
      label: function (node) {
        return node['compare-descendants'] ? "Remove Descendants" : "Compare descendants";
      },
      onClick: function (node) {
        if (node['compare-node']) {
          removeNodeFromLogo(node, false);
          setNodeColor(node.data.name, null);
        } else {
          pushNodeToEntropyLogo(node);
        }
      },
      toShow: function (node) {
        if (node.children.length > 0) {
          return true;
        } else {
          return false;
        }
      }
    }, { // Compare ASR Option
      label: function (node) {
        return node['compare-node'] ? "Remove from compare" : "Compare ancestral state";
      },
      onClick: function (node) {
        if (node['compare-node']) {
          removeNodeFromLogo(node, false);
          setNodeColor(node.data.name, null);
        } else {
          pushNodeToLogo(node);
        }
      },
      toShow: function (node) {
        if (node.children.length > 0) {
          return true;
        } else {
          return false;
        }
      }
    }
  ], [asrData]);

  // Deals with tree rendering
  useEffect(() => {
    setTreeKey(prev => prev + 1);
  }, [newickData, faData, asrData, leafData]);

  const renderTree = () => {
    if (newickData && faData && nodeData) {
      if (treeLayout === 'radial') {
        return <RadialTree
          key={treeKey}
          ref={treeRef}
          data={newickData}
          nodeStyler={style_nodes}
          customNodeMenuItems={nodeMenu}
          leafStyler={style_leaves}
          width={1500}
          linkStyler={style_edges}
          onNodeClick={onNodeClick}
        />;
      } else if (treeLayout === 'rectangular') {
        return <RectTree
          key={treeKey}
          ref={treeRef}
          data={newickData}
          nodeStyler={style_nodes}
          customNodeMenuItems={nodeMenu}
          leafStyler={style_leaves}
          width={1500}
          linkStyler={style_edges}
          onNodeClick={onNodeClick}
        />;
      } else {
        return <text>Unrooted Not Implemented</text>
      }
    }
  };

  const removeNodeFromLogo = (node, clade = false) => {
    // Remove node from logoContent
    setLogoContent(prevLogoContent => {
      const updatedLogoContent = { ...prevLogoContent };

      if (clade) {
        node['compare-descendants'] = false;
        delete updatedLogoContent["Information Logo of Clade " + node.data.name];  // Remove the node
      } else {
        node['compare-node'] = false;
        delete updatedLogoContent["ASR Probability Logo for " + node.data.name];  // Remove the node
      }
      setNodeColor(node.data.name, null);

      return updatedLogoContent;  // Return the new state
    });
  };

  const pushNodeToLogo = (node) => {
    if (!asrData) {
      console.warn("ASR data not loaded yet");
      return;
    }

    setImportantResidues([]); // Clear important residues (may cause unnecessary re-renders)
    setLogoContent(prevLogoContent => {
      const updatedLogoContent = { ...prevLogoContent };
      // Add or do nothing if node is already in logoContent
      node['compare-node'] = true;
      updatedLogoContent["ASR Probability Logo for " + node.data.name] = asrData[`${node.data.name}`];
      setNodeColor(node.data.name, "red");

      return updatedLogoContent;  // Return the new state
    });
    setPipVisible(true);
    setIsRightCollapsed(false);
  };

  const pushNodeToEntropyLogo = (node) => {
    setImportantResidues([]); // Clear important residues (may cause unnecessary re-renders)
    setLogoContent(prevLogoContent => {
      const updatedLogoContent = { ...prevLogoContent };

      var descendants = selectAllLeaves(node);
      var desc_fa = "";
      for (var desc of descendants) {
        desc_fa += `>${desc.data.name}\n${leafData[desc.data.name]}\n`;
      }
      if (desc_fa === "") {
        console.log("No descendants found for node:", node.data.name);
        return updatedLogoContent;
      }

      node['compare-descendants'] = true;

      updatedLogoContent["Information Logo of Clade " + node.data.name] = desc_fa;
      setNodeColor(node.data.name, "green");

      return updatedLogoContent;  // Return the new state
    });
    setPipVisible(true);
    setIsRightCollapsed(false);
  };

  const setNodeColor = (nodeId, color = null) => {
    d3.selectAll('.inner-node')
      .each(function () {
        var node = d3.select(this).data()[0];
        if (node.data.name === nodeId) {
          if (color == null) {
            const circles = d3.select(this).selectAll('circle');
            if (circles.size() === 2) {
              circles.filter(function (d, i) {
                return i === 0; // Remove the first circle when there are two
              }).remove();
            }
          } else {
            // Calling push node, results in calling setNodeColor twice (possibly due to react state updates), this check prevents adding a circle twice
            const circles = d3.select(this).selectAll('circle');
            if (circles.size() === 2) {
              console.log("Attempted to add circle to node with existing circle");
            } else {
              const currRadius = parseInt(d3.select(this).select("circle").attr("r"));
              d3.select(this).insert("circle", ":first-child").attr("r", currRadius + 2).style("fill", color);
            }
          }
        }
      });
  };

  useEffect(() => {
    if (Object.keys(logoContent).length == 0) {
      setIsLeftCollapsed(false);
      setPipVisible(false);
    } else {
      setPipVisible(true);
      setColorArr(null);
    }
  }, [logoContent]);

  const handleColumnClick = (index) => {
    setSelectedResidue(index + 1);
  };

  const applyEntropyStructColor = (nodeId, clear = false) => {
    if (clear) {
      setColorArr(null);
      return;
    }

    d3.selectAll('.internal-node')
      .each(function () {
        var node = d3.select(this).data()[0];
        if (node.data.name === nodeId) {
          var descendants = selectAllDescendants(node, true, false); // Get all terminal descendants
          var desc_fa = "";
          for (var desc of descendants) {
            desc_fa += `>${desc.data.name}\n${leafData[desc.data.name]}\n`;
          }
          calcEntropyFromMSA(desc_fa).then((entropy) => mapEntropyToColors(entropy)).then((colors) => { setColorArr(colors) });
        }
      });
  }

  const applyImportantStructColor = (nodeId, residueList) => {
    var fa = faData[nodeId];
    var importantColors = Array(fa.length).fill(0x00FF00);

    for (var res of residueList) {
      importantColors[res] = 0xFF0000;
    }

    setColorArr(importantColors);
  }

  function clearRightPanel() {
    setPipVisible(false);
    setSelectedResidue(null);
    setIsLeftCollapsed(false);
    setIsRightCollapsed(false);
    setColorArr(null);
    setLogoContent({});
    var desc = selectAllLeaves(treeRef.current.getRoot());
    // Map set node-compare to false over desc
    desc.forEach(node => {
      node['compare-node'] = false;
      node['compare-descendants'] = false;
      setNodeColor(node.data.name, null);
    });
    d3.selectAll('.link--highlight').classed('.link--highlight', false);
    // treeRef.current.getContainer.style.width = '100%';
  }

  const handleColumnHover = (index) => {
    setHoveredResidue(index + 1);
  };

  const handleSlider = (e, value) => {
    setScrollPosition(value + 1);
    logoStackRef.current.scrollToIndex(value);
  };

  const handleNodeRemove = (header) => {
    // Remove node from logoContent
    const newLogoContent = { ...logoContent };
    delete newLogoContent[header];
    setLogoContent(newLogoContent);

    // Below syncs highlights on TOL with remove action in logo stack
    d3.selectAll('.inner-node')
      .each(function () {
        var node = d3.select(this).data()[0];
        if (node.data.name === header.replace("ASR Probability Logo for ", "") ||
          node.data.name === header.replace("Information Logo of Clade ", "")) {
          node['compare-node'] = false;
          node['compare-descendants'] = false;
          const circles = d3.select(this).selectAll('circle');
          if (circles.size() === 2) {
            circles.filter(function (d, i) {
              return i === 0; // Target the first circle when there are two
            }).remove();
          }
        }
      });
  };

  const handleTreeDrop = (event) => { // TODO implement drop to upload tree
    event.preventDefault();
  };

  const setImportantView = (nodeId) => {
    d3.selectAll('.internal-node')
      .each(function () {
        var node = d3.select(this).data()[0];
        if (node.data.name === nodeId) {
          setLogoContent({});
          var desc = selectAllDescendants(treeObj.getNodes(), false, true);
          // Map set node-compare to false over desc
          desc.forEach(node => {
            node['compare-node'] = false;
            node['compare-descendants'] = false;
            setNodeColor(node.data.name, null);
          });
          pushNodeToLogo(node)
          pushNodeToLogo(node.parent);
          pushNodeToEntropyLogo(node);
          setImportantResidues(nodeData);
        }
      });

    setIsRightCollapsed(false);
    setPipVisible(true);
    setTimeout(() => {
      treeRef.current.findAndZoom(nodeId);
    }, 2000);
  };

  const toggleLeafLabels = () => {
    d3.selectAll('.leaf-node-label')
      .each(function () {
        const label = d3.select(this);
        if (label.style("display") === "none") {
          label.style("display", "block");
        } else {
          label.style("display", "none");
        }
      });
  };
  const toggleECLabels = () => {
    d3.selectAll('.leaf-node-ec-label')
      .each(function () {
        const label = d3.select(this);
        if (label.style("display") === "none") {
          label.style("display", "block");
        } else {
          label.style("display", "none");
        }
      });
  };

  const toggleLeftCollapse = () => {
    setIsLeftCollapsed(!isLeftCollapsed);
  };

  const toggleRightCollapse = () => {
    setIsRightCollapsed(!isRightCollapsed);
    isRightCollapsed ? setPipVisible(true) : setPipVisible(false);
  };

  const handleLabelMenuClick = (event) => {
    setLabelMenuAnchor(event.currentTarget);
  };

  const handleLabelMenuClose = () => {
    setLabelMenuAnchor(null);
  };

  const importantNodesDropdown = () => {
    const handleSidebarNodesClick = () => {
      const dropdownContent = document.querySelector('.nodes-dropdown-content');
      const btn = document.querySelector('.dropbtn-nodes');

      // Highlight the button when selected
      btn.classList.contains('selected') ? btn.classList.remove('selected') : btn.classList.add('selected');

      if (dropdownContent.classList.contains('visible')) {
        dropdownContent.classList.remove('visible');
        if (!document.querySelector('.downloads-dropdown-content').classList.contains('visible')) {
          setSidebarExpanded(false);
        }
      } else {
        dropdownContent.classList.add('visible');
        setSidebarExpanded(true);
      }
    };

    return (
      <div className="dropdown" onClick={handleSidebarNodesClick}>
        <button className="dropbtn-nodes dropbtn">
          <svg fill="#FFFFFF" width="25px" height="25px" xmlns="http://www.w3.org/2000/svg">
            <title>Candidates for clade delineation</title>
            <path d="M20,9H16a1,1,0,0,0-1,1v1H7V7H8A1,1,0,0,0,9,6V2A1,1,0,0,0,8,1H4A1,1,0,0,0,3,2V6A1,1,0,0,0,4,7H5V20a1,1,0,0,0,1,1h9v1a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V18a1,1,0,0,0-1-1H16a1,1,0,0,0-1,1v1H7V13h8v1a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V10A1,1,0,0,0,20,9ZM5,3H7V5H5ZM17,19h2v2H17Zm2-6H17V11h2Z" />
          </svg>
        </button>
        {sidebarExpanded && <span className="sidebar-label">Key Nodes</span>}
      </div>
    );
  };

  const zoomToElem = () => {
    const handleSidebarSearchClick = () => {
      if (document.querySelector('.downloads-dropdown-content').classList.contains('visible')
        || document.querySelector('.nodes-dropdown-content').classList.contains('visible')) {
        setSidebarExpanded(true);
      } else {
        setSidebarExpanded(!sidebarExpanded);
      }
    };

    return (
      <div>
        <button className="dropbtn-search dropbtn" onClick={handleSidebarSearchClick}>
          <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Search for node</title>
            <path d="M11 6C13.7614 6 16 8.23858 16 11M16.6588 16.6549L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '100vw', flexGrow: '1' }}>
      <div style={{ display: 'flex', flexGrow: '1' }}>
        <div className="sidebar" style={{
          width: (sidebarExpanded ? "220px" : "50px"),
          flexGrow: '0',
        }}>
          <div className="sidebar-item nodes-label">
            {zoomToElem()}
            {sidebarExpanded &&
              <Autocomplete
                className="zoomInput"
                id="search"
                clearOnBlur
                selectOnFocus
                freeSolo
                size="small"
                options={Object.keys(faData).concat(Object.keys(leafData))}
                getOptionLabel={(option) => option}
                style={{ width: 150 }}
                renderInput={(params) =>
                  <TextField {...params}
                    label="Search for node"
                    variant="filled"
                    style={{
                      backgroundColor: 'white',
                      borderTopLeftRadius: '5px',
                      borderTopRightRadius: '5px',
                      fontSize: '8px',
                    }}
                    slotProps={{
                      inputLabel: { style: { fontSize: '14px' } },
                    }}
                  />}
                onChange={(event, value) => treeRef.current.findAndZoom(value)}
              />}
            {notification && (
              <div className="notification">
                {notification}
              </div>
            )}
          </div>
          <div className="sidebar-item nodes-label">
            {importantNodesDropdown()}
          </div>
          <div className="nodes-dropdown-content dropdown-content transition-element">
            {Object.keys(topNodes).map(key => (
              <button key={key} onClick={() => setImportantView(key)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', minWidth: '60px' }}>{key}</span>
                <span>Score: {topNodes[key]['score'].toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="view">
          <div className="tree-div" onDrop={() => handleTreeDrop()} style={{ width: isLeftCollapsed ? '2%' : (pipVisible ? '50%' : '100%'), textAlign: "center" }}>
            <ButtonGroup variant="contained" aria-label="Basic button group">
              <Tooltip title="Recenter on input" placement="top">
                <Button onClick={() => {
                  treeRef.current.findAndZoom("Node1");
                }}><FilterCenterFocusIcon /></Button>
              </Tooltip>
              <Tooltip title="Label Toggles" placement="top">
                <Button
                  aria-controls={labelMenuOpen ? 'basic-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={labelMenuOpen ? 'true' : undefined}
                  onClick={handleLabelMenuClick}
                ><LabelIcon /></Button>
                <Menu
                  id="basic-menu"
                  anchorEl={labelMenuAnchor}
                  open={labelMenuOpen}
                  onClose={handleLabelMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  <MenuItem onClick={() => toggleLeafLabels()}>Toggle leaf labels</MenuItem>
                  <MenuItem onClick={() => toggleECLabels()}>Toggle EC labels</MenuItem>
                </Menu>
              </Tooltip>
              <Tooltip title="Reset tree" placement="top">
                <Button onClick={() => treeRef.current.refresh()}><RestoreIcon /></Button>
              </Tooltip>
              <Button
                aria-controls={labelMenuOpen ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={labelMenuOpen ? 'true' : undefined}
                onClick={cycleLayout}
              >{treeLayout}</Button>
            </ButtonGroup>
            {renderTree()}
          </div>

          {Object.keys(logoContent).length > 0 && (
            <div className="center-console">
              {!isRightCollapsed && (
                <div>
                  <Tooltip title={isLeftCollapsed ? "Expand Left" : "Collapse Left"} placement="top">
                    <button className="triangle-button" onClick={toggleLeftCollapse}>
                      {isLeftCollapsed ?
                        <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <title>Expand Left</title>
                          <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        :
                        <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform='rotate(180)'>
                          <title>Collapse Left</title>
                          <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    </button>
                  </Tooltip>
                </div>
              )}
              {!isLeftCollapsed && (
                <Tooltip title={isRightCollapsed ? "Expand Right" : "Collapse Right"} placement="bottom">
                  <button className="triangle-button" onClick={toggleRightCollapse}>
                    {isRightCollapsed ?
                      <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform='rotate(180)'>
                        <title>Expand Right</title>
                        <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      :
                      <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Collapse Right</title>
                        <path d="M21 6H13M9 6V18M21 10H13M21 14H13M21 18H13M3 10L5 12L3 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  </button>
                </Tooltip>
              )}
            </div>
          )}

          {pipVisible && logoContent && (
            <div
              className="right-div"
              style={{
                display: 'flex',
                width: isRightCollapsed ? '2%' : (isLeftCollapsed ? '100%' : '50%'),
                userSelect: 'none',
                flexDirection: isLeftCollapsed ? 'row' : 'column', // Side by side if left is collapsed
              }}
            >
              <div className="expandedRight" style={{ width: isLeftCollapsed ? '50%' : '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: "flex", overflowY: "show", alignItems: "center", justifyContent: "space-between" }}>
                  <input
                    className="scrollInput zoomInput"
                    ref={scrollInputRef}
                    placeholder={scrollPosition + 1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        try {
                          logoStackRef.current.scrollToHighlightIndex(scrollInputRef.current.value);
                        } catch (e) {
                          setNotification('Position not found');
                          setTimeout(() => {
                            setNotification('');
                          }, 2000);
                        }

                        scrollInputRef.current.value = '';
                      }
                    }}
                    style={{ width: "40px" }}
                  />
                  <Slider
                    size="small"
                    aria-label="default"
                    valueLabelDisplay="off"
                    min={0}
                    max={seqLength - 1}
                    value={scrollPosition}
                    onChange={handleSlider}
                    track={false}
                    style={{ width: '100%', margin: "0px 2em" }}
                    marks={[{ value: 1, label: '1' }, { value: seqLength - 1, label: `${seqLength}` }]}
                  />

                  <Tooltip title="Download Stack" placement="bottom">
                    <button id="download-stack-btn" className="download-stack-btn" style={{ borderRadius: "3px", backgroundColor: "#def2b3", border: "none", cursor: "pointer" }}>
                      <svg width="25px" height="25px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                        <path d="m3.25 7.25-1.5.75 6.25 3.25 6.25-3.25-1.5-.75m-11 3.75 6.25 3.25 6.25-3.25" />
                        <path d="m8 8.25v-6.5m-2.25 4.5 2.25 2 2.25-2" />
                      </svg>
                    </button>
                  </Tooltip>

                  <DownloadDialog seqLength={seqLength} />
                  <div style={{ width: "400px" }}>
                    <FormControl fullWidth size="small" >
                      <InputLabel>Color Scheme</InputLabel>
                      <Select
                        size='small'
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={logoAlphabet}
                        label="Color Scheme"
                        onChange={(e) => { setLogoAlphabet(e.target.value) }}
                      >
                        <MenuItem value={0}>Acidity</MenuItem>
                        <MenuItem value={1}>Unique</MenuItem>
                        <MenuItem value={2}>Shapely</MenuItem>
                        <MenuItem value={3}>Clustal</MenuItem>
                        <MenuItem value={4}>Clustal2</MenuItem>
                        <MenuItem value={5}>Hydrophobicity</MenuItem>
                        <MenuItem value={6}>Cinema</MenuItem>
                        <MenuItem value={7}>Helix</MenuItem>
                        <MenuItem value={8}>Lesk</MenuItem>
                        <MenuItem value={9}>Mae</MenuItem>
                        <MenuItem value={10}>Strand</MenuItem>
                        <MenuItem value={11}>Taylor</MenuItem>
                        <MenuItem value={12}>Turn</MenuItem>
                        <MenuItem value={13}>Zappo</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
                <div className="logodiv" style={{ flexGrow: '1', width: '100%', height: isLeftCollapsed ? '100%' : (Object.keys(logoContent).length > 2 ? '570px' : (Object.keys(logoContent).length > 1 ? '380px' : '190px')) }}>
                  <Tooltip title="Clear All" placement="top">
                    <button
                      className="logo-close-btn"
                      onClick={() => {
                        clearRightPanel();
                      }}
                    >
                      <svg fill="#000000" width="25px" height="25px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM21.961 12.209c0.244-0.244 0.244-0.641 0-0.885l-1.328-1.327c-0.244-0.244-0.641-0.244-0.885 0l-3.761 3.761-3.761-3.761c-0.244-0.244-0.641-0.244-0.885 0l-1.328 1.327c-0.244 0.244-0.244 0.641 0 0.885l3.762 3.762-3.762 3.76c-0.244 0.244-0.244 0.641 0 0.885l1.328 1.328c0.244 0.244 0.641 0.244 0.885 0l3.761-3.762 3.761 3.762c0.244 0.244 0.641 0.244 0.885 0l1.328-1.328c0.244-0.244 0.244-0.641 0-0.885l-3.762-3.76 3.762-3.762z"></path>
                      </svg>
                    </button>
                  </Tooltip>
                  <LogoStack
                    data={logoContent}
                    onColumnClick={handleColumnClick}
                    onColumnHover={handleColumnHover}
                    importantResiduesList={importantResidues}
                    removeNodeHandle={handleNodeRemove}
                    applyEntropyStructColor={applyEntropyStructColor}
                    applyImportantStructColor={applyImportantStructColor}
                    findAndZoom={treeRef.current.findAndZoom}
                    ref={logoStackRef}
                  />
                </div>
              </div>
              <div
                style={{
                  width: isLeftCollapsed ? '1px' : '100%',
                  height: isLeftCollapsed ? '100%' : '1px',
                  backgroundColor: '#ccc',
                  margin: '3px 3px'
                }}
              ></div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                {colorArr && <img
                  src={process.env.PUBLIC_URL + "/gradient.png"}
                  alt="Gradient Legend"
                  style={{
                    width: '100%',
                    height: '20px',
                    marginTop: '10px',
                    borderRadius: '4px'
                  }}
                />}
                <div style={{ display: "flex", height: "100%", flexGrow: "1", flexDirection: isLeftCollapsed ? "column" : "row" }}>

                  <div className="pvdiv" ref={pvdiv} style={{ height: '100%', flexGrow: "1" }}>
                    <MolstarViewer
                      structData={structData}
                      pocketData={pocketData}
                      selectedResidue={selectedResidue}
                      colorFile={colorArr}
                      hoveredResidue={hoveredResidue}
                      scrollLogosTo={(index) => logoStackRef.current.scrollToHighlightIndex(index)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default TestTol;
