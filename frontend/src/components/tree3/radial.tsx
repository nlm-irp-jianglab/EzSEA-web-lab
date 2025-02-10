import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { D3Node, RadialNode, Link, RadialTreeProps } from './types.ts';
import { convertToD3Format, readTree } from './utils.ts';
import {
  highlightDescendantsRadial,
  countLeaves,
  toggleHighlightDescendantLinks,
  toggleHighlightTerminalLinks,
  toggleHighlightLinkToRoot,
  toggleCollapseClade,
  reroot,
  findAndZoom 
} from './radialUtils.ts';
import './tree3.css';
import './menu.css';

export interface RadialTreeRef {
  getLinkExtensions: () => d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown> | null;
  getLinks: () => d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown> | null;
  getInnerNodes: () => d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown> | null;
  getLeaves: () => d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown> | null;
}

export const RadialTree = forwardRef<RadialTreeRef, RadialTreeProps>(({
  data,
  width = 1000,
  onNodeClick,
  onLinkClick,
  onLeafClick,
  onNodeMouseOver,
  onNodeMouseOut,
  onLeafMouseOver,
  onLeafMouseOut,
  onLinkMouseOver,
  onLinkMouseOut,
  customNodeMenuItems,
  nodeStyler,
  linkStyler,
  leafStyler
}, ref) => {
  const [variableLinks, setVariableLinks] = useState(false);
  const [displayLeaves, setDisplayLeaves] = useState(true);
  const [tipAlign, setTipAlign] = useState(true);
  const linkExtensionRef = useRef<d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown>>(null);
  const linkRef = useRef<d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown>>(null);
  const nodesRef = useRef<d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafLabelsRef = useRef<d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown>>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined>>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const variableLinksRef = useRef<boolean>(false); // Using this ref so highlighting descendants updates correctly
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [varData, setVarData] = useState<RadialNode | null>(null);

  const outerRadius = width / 2;
  const innerRadius = outerRadius - 170;

  useEffect(() => {
    if (!data) return;

    const convertedData = convertToD3Format(readTree(data));
    if (!convertedData) return;

    const root = d3.hierarchy<D3Node>(convertedData);
    const tree = d3.tree<D3Node>()

    // Generate tree layout
    const treeData = tree(root);

    setVarData(treeData);
  }, [data, refreshTrigger]);

  const maxLength = (d: RadialNode): number => {
    return (d.data.value || 0) + (d.children ? d3.max(d.children, maxLength) || 0 : 0);
  };

  const setRadius = (d: RadialNode, y0: number, k: number): void => {
    d.radius = (y0 += d.data.value || 0) * k;
    if (d.children) d.children.forEach(d => setRadius(d, y0, k));
  };

  function linkStep(startAngle: number, startRadius: number, endAngle: number, endRadius: number) {
    const c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI);
    const s0 = Math.sin(startAngle);
    const c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI);
    const s1 = Math.sin(endAngle);
    return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
  }

  function linkVariable(d: Link<RadialNode>): string {
    return linkStep(d.source.x ?? 0, d.source.radius ?? 0, d.target.x ?? 0, d.target.radius ?? 0);
  }

  function linkConstant(d: Link<RadialNode>): string {
    return linkStep(d.source.x ?? 0, d.source.y ?? 0, d.target.x ?? 0, d.target.y ?? 0);
  }

  function linkExtensionVariable(d: Link<RadialNode>): string {
    return linkStep(d.target.x ?? 0, d.target.radius ?? 0, d.target.x ?? 0, innerRadius);
  }

  function linkExtensionConstant(d: Link<RadialNode>): string {
    return linkStep(d.target.x ?? 0, d.target.y ?? 0, d.target.x ?? 0, innerRadius);
  }

  function nodeTransformVariable(d: RadialNode): string {
    return `
      rotate(${(d.x ?? 0) - 90}) 
      translate(${d.radius || d.y},0)
      ${(d.x ?? 0) >= 180 ? "rotate(180)" : ""}
    `;
  }

  function nodeTransformConstant(d: RadialNode) {
    return `
      rotate(${(d.x ?? 0) - 90}) 
      translate(${d.y},0)
      ${(d.x ?? 0) >= 180 ? "rotate(180)" : ""}
    `;
  }

  useEffect(() => { // Render tree
    if (!containerRef.current || !varData) return;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5]) // Min/max zoom level
      .on('zoom', (event) => {
        svgMain.select("g").attr('transform', event.transform);
      });

    // Clear existing content
    d3.select(containerRef.current).selectAll("*").remove();

    // Make SVG element
    const svgMain: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(containerRef.current).append("svg")
      .attr("viewBox", [-outerRadius, -outerRadius, width, width])
      .attr("font-family", "sans-serif")
      .attr("font-size", 5)
      .call(zoom);

    const svg = svgMain.append("g").attr("class", "tree");

    // Styles TODO: Move to CSS
    svg.append("style").text(`
      .link--active {
        stroke: #000 !important;
        stroke-width: 2px;
      }

      .link--important {
        stroke: #00F !important;
        stroke-width: 1.5px;
      }

      .link-extension--active {
        stroke-opacity: .6;
      }

      .label--active {
        font-weight: bold;
      }

      .node--active {
        stroke: #003366 !important;
        fill: #0066cc !important;
      }

      .link--highlight {
        stroke: #FF0000 !important;
        stroke-width: 1.5px;
      }

      .link--hidden {
        display: none;
      }

      .node--collapsed {
        r: 4px !important; 
        fill: #0066cc !important;
      }

      .tooltip-node {
        position: absolute;
        background: white;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10;
      }
    `);

    const cluster = d3.cluster<D3Node>()
      .size([355, innerRadius]) // [angle to spread nodes, radius]
      //.nodeSize([.7, 15]) // specifies the size of a leaf node, play around to ensure no label overlap at higher leaf counts
      .separation((a, b) => 1)

    cluster(varData); // Places leaves all on same level
    setRadius(varData, 0, innerRadius / maxLength(varData));

    // Link functions
    function linkhovered(active: boolean): (event: MouseEvent, d: Link<RadialNode>) => void {
      return function (event: MouseEvent, d: Link<RadialNode>): void {
        if (active) {
          onLinkMouseOver?.(event, d.source, d.target);
        } else {
          onLinkMouseOut?.(event, d.source, d.target);
        }
        d3.select(this).classed("link--active", active);
        if (d.target.linkExtensionNode) {
          d3.select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
        }

        highlightDescendantsRadial(d.target, active, variableLinksRef.current, svg, innerRadius);
      };
    }

    function linkClicked(event: MouseEvent, d: Link<RadialNode>): void {
      const linkElement = d3.select(event.target as SVGPathElement);
      const isHighlighted = linkElement.classed('link--highlight');

      linkElement
        .classed('link--highlight', !isHighlighted)
        .raise();
      onLinkClick?.(event, d.source, d.target);
    }

    // Draw links
    const linkExtensions = svg.append("g")
      .attr("class", "link-extensions")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .attr("stroke-dasharray", "4,4")
      .selectAll("path")
      .data(varData.links().filter(d => !d.target.children)) // targets nodes without children
      .join("path")
      .each(function (d: Link<RadialNode>) { d.target.linkExtensionNode = this as SVGPathElement; })
      .attr("d", linkExtensionConstant);

    const links = svg.append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#444")
      .selectAll("path")
      .data(varData.links())
      .join("path")
      .each(function (d: Link<RadialNode>) { d.target.linkNode = this as SVGPathElement; })
      .attr("d", linkConstant)
      .attr("stroke", (d: Link<RadialNode>) => d.target.color || "#000")
      .style("cursor", "pointer")
      .on("mouseover", linkhovered(true))
      .on("mouseout", linkhovered(false))
      .on("click", linkClicked);

    // If given linkStyler, apply it
    if (linkStyler) {
      links.each((d) => linkStyler(d.source, d.target));
    }

    // Leaf functions
    function leafhovered(active: boolean): (event: MouseEvent, d: RadialNode) => void {
      return function (event: MouseEvent, d: RadialNode): void {
        if (active) {
          onLeafMouseOver?.(event, d);
        } else {
          onLeafMouseOut?.(event, d);
        }
        d3.select(this).classed("label--active", active);
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode).classed("link-extension--active", active).raise();
        }
        do {
          if (d.linkNode) {
            d3.select(d.linkNode).classed("link--active", active).raise();
          }
        } while (d.parent && (d = d.parent));
      };
    }

    function leafClicked(event: MouseEvent, d: RadialNode): void {
      onLeafClick?.(event, d);
    }

    // Draw leaf labels
    const leafLabels = svg.append("g")
      .attr("class", "leaves")
      .selectAll("text")
      .data(varData.leaves())
      .join("text")
      .each(function (d: RadialNode) { d.labelElement = this as SVGTextElement; })
      .attr("dy", ".31em")
      .attr("transform", d => `rotate(${(d.x ?? 0) - 90}) translate(${innerRadius + 4},0)${(d.x ?? 0) < 180 ? "" : " rotate(180)"}`)
      .attr("text-anchor", d => (d.x ?? 0) < 180 ? "start" : "end")
      .text(d => d.data.name.replace(/_/g, " "))
      .on("mouseover", leafhovered(true))
      .on("mouseout", leafhovered(false))
      .on("click", leafClicked);

    // If given leafStyler, apply it
    if (leafStyler) {
      leafLabels.each((d) => leafStyler(d));
    }

    // Node functions
    function nodeHovered(active: boolean): (event: MouseEvent, d: RadialNode) => void {
      return function (event, d) {
        if (active) {
          onNodeMouseOver?.(event, d);
        } else {
          onNodeMouseOut?.(event, d);
        }
        d3.select(this).classed("node--active", active);

        // Highlight connected links
        if (d.linkExtensionNode) {
          d3.select(d.linkExtensionNode)
            .classed("link-extension--active", active)
            .raise();
        }

        // Highlight path to root
        let current = d;
        do {
          if (current.linkNode) {
            d3.select(current.linkNode)
              .classed("link--important", active)
              .raise();
          }
        } while (current.parent && (current = current.parent));

        // Highlight descendants
        highlightDescendantsRadial(d, active, variableLinksRef.current, svg, innerRadius);
      };
    }

    function showHoverLabel(event: MouseEvent, d: RadialNode): void {
      // Clear any existing tooltips
      d3.selectAll('.tooltip-node').remove();

      tooltipRef.current = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'tooltip-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 0)
        .html(`${d.data.name}<br/>Leaves: ${countLeaves(d)}`);

      tooltipRef.current
        .transition()
        .duration(200)
        .style('opacity', 1);
    }

    function hideHoverLabel(): void {
      if (tooltipRef.current) {
        tooltipRef.current
          .transition()
          .duration(200)
          .style('opacity', 0)
          .remove();
      }
    }

    function nodeClicked(event: MouseEvent, d: RadialNode): void {
      d3.selectAll('.tooltip-node').remove();

      const menu = d3.select(containerRef.current)
        .append('div')
        .attr('class', 'menu-node')
        .style('position', 'fixed')
        .style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY - 10}px`)
        .style('opacity', 1)
        .node();

      const MenuContent = (
        <>
          <div className="menu-header">{d.data.name}

          </div>
          <div className="menu-buttons">
            <a className="dropdown-item" onClick={() => toggleCollapseClade(d)}>
              Collapse Clade
            </a>
            <div className="dropdown-divider" />
            <div className="dropdown-header">Toggle Selections</div>
            <a className="dropdown-item" onClick={() => toggleHighlightDescendantLinks(d)}>
              Descendant Links
            </a>
            <a className="dropdown-item" onClick={() => toggleHighlightTerminalLinks(d)}>
              Terminal Links
            </a>
            <a className="dropdown-item" onClick={() => toggleHighlightLinkToRoot(d)}>
              Path to Root
            </a>
            <div className="dropdown-divider" />
            <a className="dropdown-item" onClick={() => {
              setVarData(reroot(d, readTree(data))); // NOTE, can only reroot once. Calls will always be calculated from original tree
            }}>
              Reroot Here
            </a>
            <div className="dropdown-divider" />
            {/* Custom menu items */}
            {customNodeMenuItems?.map(item => {
              if (item.toShow(d)) {
                return (
                  <a className="dropdown-item" onClick={() => { item.onClick(d); menu?.remove(); }}>
                    {item.label(d)}
                  </a>
                );
              }
            })}
          </div>
        </>
      );

      if (menu) {
        const root = createRoot(menu);
        root.render(MenuContent);

        setTimeout(() => {
          const handleClickOutside = (e: MouseEvent) => {
            if (menu && !menu.contains(e.target as Node)) {
              try {
                menu.remove();
              } catch (e) { // When rerooting, tree display is refreshed and menu is removed
                console.error(e);
              }
              window.removeEventListener('click', handleClickOutside);
            }
          };
          window.addEventListener('click', handleClickOutside);
        }, 5);
      }

      onNodeClick?.(event, d);
    }

    // Add nodes
    const nodes = svg.append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(varData.descendants().filter(d => d.children))
      .join("g")
      .each(function (d: RadialNode) { d.nodeElement = this as SVGGElement; })
      .attr("class", "inner-node")
      .attr("transform", d => `
        rotate(${(d.x ?? 0) - 90}) 
        translate(${d.y},0)
        ${(d.x ?? 0) >= 180 ? "rotate(180)" : ""}
    `);

    // Add circles for nodes
    nodes.append("circle")
      .attr("r", 3)
      .style("fill", "#fff")
      .style("stroke", "steelblue")
      .style("stroke-width", 1.5)
      .on("click", nodeClicked)
      .on("mouseover", nodeHovered(true))
      .on("mouseout", nodeHovered(false))
      .on('mouseenter', showHoverLabel)
      .on('mouseleave', hideHoverLabel);

    // If given nodeStyler, apply it
    if (nodeStyler) {
      nodes.each((d) => nodeStyler(d));
    }

    linkExtensionRef.current = linkExtensions as unknown as d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown>;
    linkRef.current = links as unknown as d3.Selection<SVGPathElement, Link<RadialNode>, SVGGElement, unknown>;
    nodesRef.current = nodes as unknown as d3.Selection<SVGGElement, RadialNode, SVGGElement, unknown>;
    leafLabelsRef.current = leafLabels as unknown as d3.Selection<SVGTextElement, RadialNode, SVGGElement, unknown>;
    svgRef.current = svgMain.node();

  }, [varData, width]);

  useEffect(() => { // Transition between variable and constant links, and tip alignment
    const t = d3.transition().duration(750);
    if (!tipAlign) {

      linkExtensionRef.current?.transition(t)
        .attr("d", variableLinks ? linkExtensionVariable : linkExtensionConstant)
        .style("display", null);

    } else {
      linkExtensionRef.current?.transition(t).style("display", "none");
    }

    // Transition between variable and constant links
    linkRef.current?.transition(t)
      .attr("d", variableLinks ? linkVariable : linkConstant);

    // Transition nodes to stay in correct position
    nodesRef.current?.transition(t)
      .attr("transform", variableLinks ? nodeTransformVariable : nodeTransformConstant);
    variableLinksRef.current = variableLinks; // This ref update is for highlighting descendants

    // If alignTips is true, set leaf label text transform to be radius value of it's data
    leafLabelsRef.current?.transition(t)
      .attr("transform", d => {
        const angle = (d.x ?? 0) - 90;
        const distance = tipAlign
          ? (variableLinksRef.current ? d.radius : innerRadius + 4)
          : innerRadius + 4;
        const flip = (d.x ?? 0) < 180 ? "" : " rotate(180)";
        return `rotate(${angle}) translate(${distance},0)${flip}`;
      });
  }, [variableLinks, tipAlign]);

  useEffect(() => { // Toggle leaf label visibility
    leafLabelsRef.current?.style("display", displayLeaves ? "block" : "none");
    linkExtensionRef.current?.style("display", displayLeaves ? "block" : "none");
  }, [displayLeaves]);

  const recenterView = () => {
    const svg = d3.select(containerRef.current).select('svg').select('g');

    svg.transition()
      .duration(750)
      .attr('transform', "translate(0,0)");
  };

  useImperativeHandle(ref, () => ({
    getLinkExtensions: () => linkExtensionRef.current,
    getLinks: () => linkRef.current,
    getInnerNodes: () => nodesRef.current,
    getLeaves: () => leafLabelsRef.current,
    setVariableLinks: (value: boolean) => setVariableLinks(value),
    setDisplayLeaves: (value: boolean) => setDisplayLeaves(value),
    setTipAlign: (value: boolean) => setTipAlign(value),
    recenterView: () => recenterView(),
    refresh: () => setRefreshTrigger(prev => prev + 1),
    getRoot: () => varData,
    getContainer: () => containerRef.current,
    findAndZoom: (name: string, container: React.MutableRefObject<HTMLDivElement>) => {
      if (svgRef.current) {
        findAndZoom(name, d3.select(svgRef.current), container, variableLinks);
      }
    },
  }));

  return (
    <div className="radial-tree">
      <div ref={containerRef} style={{
        width: "100%",
        height: "100%",
        overflow: "show",
      }} />
    </div>
  );
});
