// React Core
import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';

// Third Party Libraries
import * as d3 from 'd3';
import { ZstdInit } from '@oneidentity/zstd-js/decompress';
import JSZip from 'jszip';

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
import DifferenceIcon from '@mui/icons-material/Difference';

// Local Components
import DownloadDialog from '../components/downloadlogo.tsx';
import CompareMenu from '../components/compareMenu.tsx';
import LogoStack from '../components/logo-stack.js';
import MolstarViewer from "../components/molstar.js";
import { tolContext } from '../components/tolContext.js';
import {
  calcEntropyFromMSA, mapEntropyToColors, fastaToDict
} from '../components/utils.js';

// Tree3
import { selectAllLeaves } from 'tree3-react';
import { RadialTree, RectTree, UnrootedTree } from 'tree3-react';

// Styles
import "../components/tol.css";

const Tol = () => {
  // State to store the tree data and node data  
  const [fileData, setFileData] = useState({
    newickData: null,
    asrData: null,
    leafData: null,
    faData: null,
    nodeData: null,
    topNodes: null,
    ecData: null,
    structData: null,
    seqLength: 0
  });

  const [inputSequence, setInputSequence] = useState(null); // Input sequence for the structure

  // State to store the logo content (formatted for logoJS) and color file
  const [colorArr, setColorArr] = useState(null);

  // Context states
  const { scrollPosition, setScrollPosition, seqLength, setSeqLength,
    logoContent, setLogoContent, logoAlphabet, setLogoAlphabet } = useContext(tolContext);

  // For live updates linking sequence logo and structure viewer
  const [selectedResidue, setSelectedResidue] = useState(null);
  const [hoveredResidue, setHoveredResidue] = useState(null); // Currently not in use
  const scrollLogosToRef = useRef(null);

  // States for rendering control
  const [treeLayout, setTreeLayout] = useState('radial');
  const layouts = ['radial', 'rectangular', 'unrooted'];

  /** 
   * pipVisible is the state for the right panel visibility 
   * (pip = picture in picture, outdated name as I originally 
   * intended to have a small window)
   * 
   * */
  const [pipVisible, setPipVisible] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notification, setNotification] = useState('');
  const [labelMenuAnchor, setLabelMenuAnchor] = useState(null);
  const labelMenuOpen = Boolean(labelMenuAnchor);
  const [searchOptions, setSearchOptions] = useState([]);

  // References for rendering
  const treeRef = useRef(null);
  const treediv = useRef(null);
  const pvdiv = useRef(null);
  const logoStackRef = useRef(null);
  const scrollInputRef = useRef(null);
  const gapScrollInputRef = useRef(null);
  const [importantResidues, setImportantResidues] = useState([]);

  // Add state for tree key
  const [treeKey, setTreeKey] = useState(0);

  const cycleLayout = () => {
    const currentIndex = layouts.indexOf(treeLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setTreeLayout(layouts[nextIndex]);
  };

  // ASR data
  const uint8ArrayToString = (uint8Array) => {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  };

  function style_nodes(node) { // nodes are all internal
    if (fileData.topNodes && node.data.name in fileData.topNodes) { // First condition to ensure nodeData is populated
      const element = d3.select(node.nodeElement);
      element.select("circle").style("fill", "green");
      element.select("circle").attr("r", 5);
    }
  }

  const style_leaves = useMemo(() => (node) => {
    if (!node) return;
    if (node.data.name === "bilR") {
      d3.select(node.labelElement).style("fill", "red").style("font-size", () => {
        const currentSize = d3.select(node.labelElement).style("font-size");
        const sizeNum = parseFloat(currentSize);
        return (sizeNum + 2) + "px";
      });
    }

    if (fileData.ecData && fileData.ecData[node.data.name]) {
      const ec = fileData.ecData[node.data.name];
      if (ec.ec_number) {
        // First create a group element to hold the label
        // Get parent of labelElement
        const parentElement = d3.select(node.labelElement.parentNode);

        // Create sibling group next to labelElement
        const labelGroup = parentElement
          .append("g")
          .attr("class", "label-group")
        const originalTransform = d3.select(node.labelElement).attr("transform");
        const fontSize = d3.select(node.labelElement).style("font-size");

        const ec_label = labelGroup
          .append("text")
          .text(ec.ec_number ? `EC ${ec.ec_number}` : "not found")
          .attr("transform", originalTransform) // Apply same transform
          .style("font-size", fontSize)
          .attr("dy", ".31em")
          .attr("x", () => {
            const hasRotate180 = originalTransform?.endsWith("rotate(180)");
            return hasRotate180 ? "-20em" : "20em";
          })
          .attr("class", "ec-label");
      }
    }
  }, [fileData.ecData]);

  const style_leaves_unrooted = useMemo(() => (node) => {
    if (!node) return;
    if (node.data.name === "bilR") {
      d3.select(node.labelElement).style("fill", "red").style("font-size", () => {
        const currentSize = d3.select(node.labelElement).style("font-size");
        const sizeNum = parseFloat(currentSize);
        return (sizeNum + 2) + "px";
      });
    }
  }, []);

  function style_edges(source, target) {
    if (fileData.asrData && target.children) { // Targets only node to node links as leaf nodes have no children property
      const element = d3.select(target.linkNode);
      element.on('click', async (event, branch) => {
        if (branch.selected) {
          branch.selected = false;

          event.target.classList.remove('link--highlight');
          removeNodeFromLogo(source); // Remove the node from logoContent if already present
          removeNodeFromLogo(target);
        } else {
          branch.selected = true;
          event.target.classList.add('link--highlight');

          pushNodeToLogo(source);
          pushNodeToLogo(target);
        }
      });
    }
  }

  const onNodeClick = (event, node) => {
    // console.log("Node clicked:", node.data.name);
    return
  };

  const linkMenu = [
    {
      label: function (source, target) {
        if (source['compare-node'] || target['compare-node']) {
          return "Remove comparisons";
        } else {
          return "Compare pair";
        }
      },
      onClick: function (source, target) {
        if (source['compare-node'] || target['compare-node']) {
          removeNodeFromLogo(source); // Remove the node from logoContent if already present
          removeNodeFromLogo(target);
          source['compare-node'] = false;
          target['compare-node'] = false;
        } else {
          pushNodeToLogo(source);
          pushNodeToLogo(target);
          source['compare-node'] = true;
          target['compare-node'] = true;
        }
      },
      toShow: function (source, target) {
        return true;
      }
    }
  ];

  // Custom menu items for nodes
  const nodeMenu = useMemo(() => [
    { // Compare Descendants Option
      label: function (node) {
        return node['compare-descendants'] ? "Remove descendants" : "Compare descendants";
      },
      onClick: function (node) {
        if (node['compare-descendants']) {
          removeNodeFromLogo(node, true);
          setNodeColor(node, null);
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
          setNodeColor(node, null);
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
  ], [fileData.asrData, fileData.leafData]);

  const leafMenu = [
    {
      label: function (node) {
        return "Uniref Website"
      },
      onClick: function (node) {
        const url = `https://rest.uniprot.org/uniref/search?query=${node.data.name}&fields=id`;

        fetch(url)
          .then(response => {
            if (!response.ok) {
              alert('UniProt database error.');
            } else {
              return response.json();
            }
          })
          .then(data => {
            if (data && data.results) {
              const uniref100 = data.results.find(result => result.id.startsWith('UniRef100'));
              if (uniref100) {
                const unirefUrl = `https://www.uniprot.org/uniref/${uniref100.id}`;
                window.open(unirefUrl, '_blank');
              } else {
                alert('No UniRef100 ID found.');
              }
            }
          })
          .catch(error => {
            console.error('Error checking URL:', error);
            alert('There was an error checking the URL. Please check your network connection and try again.');
          });
      },
      toShow: async function (node) {
        try {
          const url = `https://rest.uniprot.org/uniref/search?query=${node.data.name}&fields=id`;
          const response = await fetch(url);

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          if (data && data.results) {
            const uniref100 = data.results.find(result => result.id.startsWith('UniRef100'));
            return !!uniref100;
          }

          return false;
        } catch (error) {
          console.error('Error checking URL:', error);
          return false;
        }
      }
    },
    {
      label: function (node) {
        return "Set Structure Sequence"
      },
      onClick: function (node) {
        try {
          const fa = fileData.leafData[node.data.name];
          setInputSequence(fa);
        } catch (e) {
          console.error("Error setting structure sequence:", e);
        }
      },
      toShow: function (node) {
        return true;
      }
    }
  ]

  const toolTip = useMemo(() => (node) => {
    if (fileData.nodeData && fileData.nodeData[node.data.name]) {
      return `Score: ${fileData.nodeData[node.data.name].score.toFixed(2)}`;
    }
    return '';
  }, [fileData.nodeData]);

  // Deals with tree rendering
  useEffect(() => {
    setTreeKey(prev => prev + 1);
    setSearchOptions( // Used for the search by name menu, fill with whatever info we have
      (fileData.asrData && fileData.leafData) ? Object.keys(fileData.asrData).concat(Object.keys(fileData.leafData)) :
        (fileData.leafData) ? Object.keys(fileData.leafData) :
          (fileData.asrData) ? Object.keys(fileData.asrData) : []
    )
  }, [fileData.newickData, fileData.asrData, fileData.faData, fileData.leafData]);

  useEffect(() => {
    if (fileData.newickData || fileData.asrData || fileData.leafData) {
      setTreeKey(prev => prev + 1);
      setSearchOptions(
        (fileData.asrData && fileData.leafData)
          ? [...Object.keys(fileData.asrData), ...Object.keys(fileData.leafData)]
          : fileData.leafData
            ? Object.keys(fileData.leafData)
            : fileData.asrData
              ? Object.keys(fileData.asrData)
              : []
      );
    }
  }, [fileData]);

  const renderTree = () => {
    if (fileData.newickData) {
      if (treeLayout === 'radial') {
        return <RadialTree
          key={treeKey}
          ref={treeRef}
          data={fileData.newickData}
          nodeStyler={style_nodes}
          customNodeMenuItems={nodeMenu}
          customLeafMenuItems={leafMenu}
          customTooltip={toolTip}
          leafStyler={style_leaves}
          width={1500}
          linkStyler={style_edges}
          onNodeClick={onNodeClick}
          state={treeRef.current && treeRef.current.getState()}
        />;
      } else if (treeLayout === 'rectangular') {
        return <RectTree
          key={treeKey}
          ref={treeRef}
          data={fileData.newickData}
          nodeStyler={style_nodes}
          customNodeMenuItems={nodeMenu}
          customLeafMenuItems={leafMenu}
          customTooltip={toolTip}
          leafStyler={style_leaves}
          width={1500}
          linkStyler={style_edges}
          onNodeClick={onNodeClick}
          state={treeRef.current && treeRef.current.getState()}
        />;
      } else {
        return <UnrootedTree
          key={treeKey}
          ref={treeRef}
          data={fileData.newickData}
          nodeStyler={style_nodes}
          customNodeMenuItems={nodeMenu}
          customLeafMenuItems={leafMenu}
          customLinkMenuItems={linkMenu}
          customTooltip={toolTip}
          leafStyler={style_leaves_unrooted}
          width={1500}
          onNodeClick={onNodeClick}
          state={treeRef.current && treeRef.current.getState()}
        />;
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
      setNodeColor(node, null);

      return updatedLogoContent;  // Return the new state
    });
  };

  const pushNodeToLogo = (node) => {
    if (!fileData.asrData) {
      console.warn("ASR data not loaded yet");
      return;
    }

    setImportantResidues([]); // Clear important residues (may cause unnecessary re-renders)
    setLogoContent(prevLogoContent => {
      const updatedLogoContent = { ...prevLogoContent };
      // Add or do nothing if node is already in logoContent
      node['compare-node'] = true;
      updatedLogoContent["ASR Probability Logo for " + node.data.name] = fileData.asrData[`${node.data.name}`];
      setNodeColor(node, "red");

      return updatedLogoContent;  // Return the new state
    });
    setPipVisible(true);
    setIsRightCollapsed(false);
  };

  const pushNodeToEntropyLogo = useCallback((node) => {
    if (!fileData.leafData || Object.keys(fileData.leafData).length === 0) {
      console.warn("Leaf data not loaded yet");
      return;
    }

    setImportantResidues([]); // Clear important residues (may cause unnecessary re-renders)
    setLogoContent(prevLogoContent => {
      const updatedLogoContent = { ...prevLogoContent };

      const missingSequences = [];
      var descendants = selectAllLeaves(node);
      if (descendants.length === 0) {
        console.warn("No descendants found for node:", node.data.name);
        return;
      }

      var desc_fa = "";
      for (var desc of descendants) {
        if (!fileData.leafData[desc.data.name]) {
          missingSequences.push(desc.data.name);
        } else {
          desc_fa += `>${desc.data.name}\n${fileData.leafData[desc.data.name]}\n`;
        }
      }

      if (missingSequences.length > 0) {
        console.warn("Missing sequences for nodes:", missingSequences.join(", "));
        return updatedLogoContent;
      }

      node['compare-descendants'] = true;

      updatedLogoContent["Information Logo of Clade " + node.data.name] = desc_fa;
      setNodeColor(node, "green");

      return updatedLogoContent;
    });
    setPipVisible(true);
    setIsRightCollapsed(false);
  }, [fileData.leafData]);

  /*
  *   Sets the color of a node to the given color
  *   If color is null, removes the color
  */
  const setNodeColor = (node, color = null) => {
    const nodeSelection = d3.select(node.nodeElement);
    const circles = nodeSelection.selectAll('circle');

    if (color === null) {
      if (circles.size() === 2) {
        circles.filter((d, i) => i === 0).remove();
      }
      return;
    }

    if (circles.size() === 1) {
      const currRadius = parseInt(nodeSelection.select("circle").attr("r"));
      nodeSelection
        .insert("circle", ":first-child")
        .attr("r", currRadius + 2)
        .style("fill", color);
    }
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

  const handleColumnClick = useMemo(() => (index) => {
    console.log("Input sequence:", inputSequence);
    if (inputSequence) {
      // Count gaps between position 0 and index in the input sequence
      let gapCount = 0;
      for (let i = 0; i < index; i++) {
        if (inputSequence[i] === '-') {
          gapCount++;
        }
      }

      // Adjust index by subtracting the number of gaps encountered
      const adjustedIndex = index - gapCount;
      console.log("Scrolling to adjusted index:", adjustedIndex + 1);
      setSelectedResidue(adjustedIndex + 1);
    } else {
      setSelectedResidue(index + 1);
    }
  }, [inputSequence]);

  const applyEntropyStructColor = (nodeId, clear = false) => {
    if (clear) {
      setColorArr(null);
      return;
    }

    d3.selectAll('.inner-node')
      .each(function () {
        var node = d3.select(this).data()[0];
        if (node.data.name === nodeId) {
          var descendants = selectAllLeaves(node, true, false); // Get all terminal descendants
          var desc_fa = "";
          for (var desc of descendants) {
            desc_fa += `>${desc.data.name}\n${fileData.leafData[desc.data.name]}\n`;
          }
          calcEntropyFromMSA(desc_fa).then((entropy) => mapEntropyToColors(entropy)).then((colors) => { setColorArr(colors) });
        }
      });
  }

  const applyImportantStructColor = (nodeId, residueList) => {
    if (!fileData.faData) {
      console.warn("FA data not loaded yet");
      return;
    }
    var fa = fileData.faData[nodeId];
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
    var desc = d3.selectAll(".inner-node").data();
    // Map set node-compare to false over desc
    desc.forEach(node => {
      node['compare-node'] = false;
      node['compare-descendants'] = false;
      setNodeColor(node, null);
    });
    d3.selectAll('.link--highlight').classed('.link--highlight', false);
  }

  const handleColumnHover = useMemo(() => (index) => {
    if (inputSequence) {
      // Count gaps between position 0 and index in the input sequence
      let gapCount = 0;
      for (let i = 0; i < index; i++) {
        if (inputSequence[i] === '-') {
          gapCount++;
        }
      }

      // Adjust index by subtracting the number of gaps encountered
      const adjustedIndex = index - gapCount;
      setHoveredResidue(adjustedIndex + 1);
    } else {
      setHoveredResidue(index + 1);
    }
  }, [inputSequence]);

  const handleSlider = (e, value) => {
    logoStackRef.current.scrollToIndex(value);
    setScrollPosition(value);
  };

  const handleGapScroll = (e) => {
    if (e.key === 'Enter') {
      try {
        const [gene, position] = gapScrollInputRef.current.value.split(':');
        if (!gene || !position || !fileData.leafData[gene]) {
          throw new Error('Invalid input format or gene not found');
        }

        const sequence = fileData.leafData[gene];
        const targetPos = parseInt(position);

        // Find the position of the nth non-gap character
        let nonGapCount = 0;
        let actualPosition = 0;

        for (let i = 0; i < sequence.length; i++) {
          if (sequence[i] !== '-') {
            nonGapCount++;
            if (nonGapCount === targetPos) {
              actualPosition = i;
              break;
            }
          }
        }

        if (nonGapCount < targetPos) {
          throw new Error('Position exceeds number of non-gap characters');
        }

        logoStackRef.current.scrollToHighlightIndex(actualPosition + 1); // +1 for 1-based index

      } catch (e) {
        setNotification('Invalid input or position not found');
        setTimeout(() => {
          setNotification('');
        }, 2000);
      }

      gapScrollInputRef.current.value = '';
    }
  }

  const handleNodeRemove = (header) => {
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

  const readZip = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(content);

      // Create an object to store all file data
      const newFileData = { ...fileData };

      // Process all files in parallel
      await Promise.all(Object.entries(zipContent.files).map(async ([_, zipEntry]) => {
        const fileName = zipEntry.name;

        if (fileName === 'asr.tree') {
          newFileData.newickData = await zipEntry.async('string');
        }
        else if (fileName === 'seq.state.zst') {
          const content = await zipEntry.async('arraybuffer');
          const { ZstdStream } = await ZstdInit();
          const decompressedData = ZstdStream.decompress(new Uint8Array(content));
          const asrDict = JSON.parse(uint8ArrayToString(decompressedData));
          newFileData.asrData = asrDict;
          newFileData.seqLength = asrDict[Object.keys(asrDict)[0]].length;
        }
        else if (fileName === 'seq_trimmed.afa') {
          const content = await zipEntry.async('string');
          const data = await fastaToDict(content);
          newFileData.leafData = data;
          const trimmedSeqLength = Object.values(data)[0].length;
          newFileData.seqLength = trimmedSeqLength;
          setSeqLength(trimmedSeqLength);
        }
        else if (fileName === 'asr.fa') {
          const content = await zipEntry.async('string');
          newFileData.faData = await fastaToDict(content);
        }
        else if (fileName === 'nodes.json') {
          const content = await zipEntry.async('string');
          const json = JSON.parse(content);
          const first10Objects = Object.fromEntries(
            Object.entries(json).slice(0, 10)
          );
          newFileData.nodeData = json;
          newFileData.topNodes = first10Objects;
        }
        else if (fileName === 'ec.json') {
          const content = await zipEntry.async('string');
          newFileData.ecData = JSON.parse(content);
        }
        else if (fileName === 'seq.pdb') {
          newFileData.structData = await zipEntry.async('string');
        }
      }));

      // Update all state at once
      setFileData(newFileData);
    };
    reader.readAsArrayBuffer(file);
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

  const uploadsDropdown = () => {
    const handleSidebarUploadsClick = () => {
      const dropdownContent = document.querySelector('.nodes-dropdown-content');
      const btn = document.querySelector('.dropbtn-nodes');

      // Highlight the button when selected
      btn.classList.contains('selected') ? btn.classList.remove('selected') : btn.classList.add('selected');

      if (dropdownContent.classList.contains('visible')) {
        dropdownContent.classList.remove('visible');
        setSidebarExpanded(false);
      } else {
        dropdownContent.classList.add('visible');
        setSidebarExpanded(true);
      }
    };

    return (
      <div className="dropdown" onClick={handleSidebarUploadsClick}>
        <button className="dropbtn-nodes dropbtn">
          <svg fill="none" width="25px" height="25px" xmlns="http://www.w3.org/2000/svg">
            <title>Upload files for visualization</title>
            <path d="M17 17H17.01M15.6 14H18C18.9319 14 19.3978 14 19.7654 14.1522C20.2554 14.3552 20.6448 14.7446 20.8478 15.2346C21 15.6022 21 16.0681 21 17C21 17.9319 21 18.3978 20.8478 18.7654C20.6448 19.2554 20.2554 19.6448 19.7654 19.8478C19.3978 20 18.9319 20 18 20H6C5.06812 20 4.60218 20 4.23463 19.8478C3.74458 19.6448 3.35523 19.2554 3.15224 18.7654C3 18.3978 3 17.9319 3 17C3 16.0681 3 15.6022 3.15224 15.2346C3.35523 14.7446 3.74458 14.3552 4.23463 14.1522C4.60218 14 5.06812 14 6 14H8.4M12 15V4M12 4L15 7M12 4L9 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {sidebarExpanded && <span className="sidebar-label">Upload</span>}
      </div>
    );
  };

  const zoomToElem = () => {
    const handleSidebarSearchClick = () => {
      if (document.querySelector('.nodes-dropdown-content').classList.contains('visible')) {
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

  const scrollLogosTo = useCallback((index) => {
    if (inputSequence) {
      // Count non-gap characters until we reach the target index
      let nonGapCount = 0;
      let gappedIndex = 0;

      // Iterate through sequence until we find the index'th non-gap character
      for (let i = 0; i < inputSequence.length; i++) {
        if (inputSequence[i] !== '-') {
          nonGapCount++;
          if (nonGapCount === index) {
            gappedIndex = i;
            break;
          }
        }
      }

      // Scroll to the position in the gapped sequence
      logoStackRef.current.scrollToHighlightIndex(gappedIndex + 1);
    } else {
      // If no input sequence, scroll to raw index
      logoStackRef.current.scrollToHighlightIndex(index);
    }
  }, [inputSequence]);

  // Update the ref when scrollLogosTo changes
  useEffect(() => {
    scrollLogosToRef.current = scrollLogosTo;
  }, [scrollLogosTo]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '100vw', flexGrow: '1' }}>
      <div style={{ display: 'flex', flexGrow: '1' }}>
        <div className="sidebar" style={{
          width: (sidebarExpanded ? "220px" : "50px"),
          flexGrow: '0',
        }}>
          {/* Search tab */}
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
                options={searchOptions}
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
                onChange={(event, value) => treeRef.current.findAndZoom(value, treediv)}
              />}
            {notification && (
              <div className="notification">
                {notification}
              </div>
            )}
          </div>
          {/* Uploads tab */}
          <div className="sidebar-item nodes-label">
            {uploadsDropdown()}
          </div>
          <div className="nodes-dropdown-content dropdown-content transition-element">
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Tree</span>
              <input
                type="file"
                accept=".nwk,.newick,.tree"
                onChange={(event) => {
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result;
                    setFileData(prev => ({ ...prev, newickData: content }));
                    setTreeKey(prev => prev + 1);
                  };
                  reader.readAsText(file);
                }}
              />
            </button>
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>ASR</span>
              <input
                type="file"
                accept=".zst"
                onChange={(event) => {
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result;
                    ZstdInit().then(({ ZstdSimple, ZstdStream }) => {
                      const decompressedStreamData = ZstdStream.decompress(new Uint8Array(content));
                      const asrDict = JSON.parse(uint8ArrayToString(decompressedStreamData))
                      setFileData(prev => ({ ...prev, asrData: asrDict, seqLength: asrDict[Object.keys(asrDict)[0]].length }));
                    });
                  };
                  reader.readAsArrayBuffer(file);
                }}
              />
            </button>
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Sequences</span>
              <input
                type="file"
                accept=".fa,.fasta,.afa,.fna,.mfa,.fas,.faa,.txt"
                onChange={(event) => {
                  if (event.target.files.length === 0) return;
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result;
                    fastaToDict(content).then(data => {
                      const length = Object.values(data)[0].length;
                      setFileData(prev => ({ ...prev, leafData: data }));
                      setSeqLength(length);
                    });
                    setTreeKey(prev => prev + 1);
                  };
                  reader.readAsText(file);
                }}
              />
            </button>
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Node Info (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={(event) => {
                  if (event.target.files.length === 0) return;
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result;
                    const json = JSON.parse(content);
                    const entries = Object.entries(json);
                    const first10Entries = entries.slice(0, 10);
                    // Convert back to object
                    const first10Objects = Object.fromEntries(first10Entries);

                    setFileData(prev => ({ ...prev, nodeData: json, topNodes: first10Objects }));
                  };
                  reader.readAsText(file);
                }}
              />
            </button>
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Structure</span>
              <input
                type="file"
                accept=".pdb"
                onChange={(event) => {
                  if (event.target.files.length === 0) return;
                  const file = event.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result;
                    setFileData(prev => ({ ...prev, structData: content }));
                  };
                  reader.readAsText(file);
                }}
              />
            </button>
            <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Zip</span>
              <input
                type="file"
                accept=".zip"
                onChange={(event) => readZip(event)}
              />

            </button>
          </div>
        </div>
        {/* Main view, everything but the sidebar */}
        <div className="view">
          <div className="tree-div" ref={treediv} style={{ width: isLeftCollapsed ? '2%' : (pipVisible ? '50%' : '100%'), textAlign: "center" }}>
            {/* Top button bar */}
            <ButtonGroup variant="contained" aria-label="Basic button group">
              <Tooltip title="Recenter" placement="top">
                <Button onClick={() => {
                  treeRef.current && treeRef.current.findAndZoom("Node1", treediv);
                }}><FilterCenterFocusIcon /></Button>
              </Tooltip>
              <Tooltip title="Labels" placement="top">
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
                  {(treeLayout !== "unrooted") && (
                    <div>
                      <MenuItem onClick={() => treeRef.current && treeRef.current.setVariableLinks(prev => !prev)}>Variable Links</MenuItem>
                      <MenuItem onClick={() => treeRef.current && treeRef.current.setTipAlign(prev => !prev)}>Align Tips</MenuItem>
                    </div>
                  )}
                  <MenuItem onClick={() => treeRef.current && treeRef.current.setDisplayLeaves(prev => !prev)}>Toggle Labels</MenuItem>
                  <MenuItem onClick={() => treeRef.current && treeRef.current.setDisplayNodes(prev => !prev)}>Toggle Nodes</MenuItem>
                </Menu>
              </Tooltip>
              <Tooltip title="Reset tree" placement="top">
                <Button onClick={() => treeRef.current && treeRef.current.refresh()}><RestoreIcon /></Button>
              </Tooltip>
              <Tooltip title="Cycle layouts" placement="top">
                <Button
                  aria-controls={labelMenuOpen ? 'basic-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={labelMenuOpen ? 'true' : undefined}
                  onClick={cycleLayout}
                >{treeLayout}</Button>
              </Tooltip>
            </ButtonGroup>
            {renderTree()}
          </div>

          {/* The two arrow buttons in the middle */}
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
              {/* Sequence logos */}
              <div className="expandedRight" style={{ width: isLeftCollapsed ? '50%' : '100%', display: 'flex', flexDirection: 'column', overflow: 'scroll' }}>
                <div style={{ display: "flex", overflowY: "show", alignItems: "center", justifyContent: "space-between" }}>
                  <input
                    className="gapScrollInput zoomInput"
                    ref={gapScrollInputRef}
                    placeholder='gene:position'
                    onKeyDown={(e) => { handleGapScroll(e) }}
                    style={{ width: "120px" }}
                  />
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
                    marks={[
                      { value: 0, label: '1' },
                      { value: seqLength - 1, label: `${seqLength}` }
                    ]}
                  />

                  <Tooltip title="Compare Menu" placement="bottom">
                    <button id="compare-menu-btn" className="compare-menu-btn" style={{ borderRadius: "3px", backgroundColor: "rgb(99, 159, 199)", border: "none", cursor: "pointer" }}>
                      <DifferenceIcon />
                    </button>
                  </Tooltip>

                  <Tooltip title="Download Stack" placement="bottom">
                    <button id="download-stack-btn" className="download-stack-btn" style={{ borderRadius: "3px", backgroundColor: "#def2b3", border: "none", cursor: "pointer" }}>
                      <svg width="25px" height="25px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                        <path d="m3.25 7.25-1.5.75 6.25 3.25 6.25-3.25-1.5-.75m-11 3.75 6.25 3.25 6.25-3.25" />
                        <path d="m8 8.25v-6.5m-2.25 4.5 2.25 2 2.25-2" />
                      </svg>
                    </button>
                  </Tooltip>
                  <CompareMenu logoContent={logoContent} />
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
                <div className="logodiv" style={{ flexGrow: '1', width: '100%', height: '100%' }}>
                  <Tooltip title="Clear All" placement="top">
                    <button
                      className="logo-close-btn"
                      onClick={() => {
                        clearRightPanel();
                      }}
                    >
                      X
                    </button>
                  </Tooltip>
                  <LogoStack
                    key={inputSequence || 'default'} // Force re-render when inputSequence changes
                    onColumnClick={handleColumnClick}
                    onColumnHover={handleColumnHover}
                    importantResiduesList={importantResidues}
                    removeNodeHandle={handleNodeRemove}
                    applyEntropyStructColor={applyEntropyStructColor}
                    applyImportantStructColor={applyImportantStructColor}
                    findAndZoom={function (name) { treeRef.current.findAndZoom(name, treediv) }}
                    ref={logoStackRef}
                  />
                </div>
              </div>

              {/* Structure viewer */}
              {isLeftCollapsed && (
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                  {/* Button bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '8px',
                    gap: '8px',
                    borderBottom: '1px solid #ccc'
                  }}>
                    <ButtonGroup variant="contained" size="small">
                      <Tooltip title="Reset View" placement="top">
                        <Button>
                          <RestoreIcon />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Set Reference Sequence" placement="top">
                        <Autocomplete
                          size="small"
                          options={Object.keys(fileData.leafData)}
                          style={{ width: 200 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Set reference sequence"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          onChange={(event, newValue) => {
                            if (newValue && fileData.leafData[newValue]) {
                              setInputSequence(fileData.leafData[newValue]);
                            } else {
                              setNotification('Reference sequence not found');
                            }
                          }}
                        />
                      </Tooltip>
                    </ButtonGroup>
                  </div>
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
                  <div style={{ display: "flex", height: "100%", flexGrow: "1", flexDirection: "column" }}>
                    <div className="pvdiv" ref={pvdiv} style={{ height: '100%', flexGrow: "1" }}>
                      <MolstarViewer
                        key={fileData.structData || 'empty'}
                        structData={fileData.structData || null}
                        selectedResidue={selectedResidue}
                        colorFile={colorArr}
                        hoveredResidue={hoveredResidue}
                        scrollLogosToRef={scrollLogosToRef}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Tol;
