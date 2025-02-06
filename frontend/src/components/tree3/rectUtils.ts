import { RadialNode, D3Node } from './types';
import * as d3 from 'd3';

function getBoundingBox(node: RadialNode, isVariable: boolean): { minX: number; maxX: number; minY: number } {
  let bbox = {
    minX: node.x ?? 0,
    maxX: node.x ?? 0,
    minY: isVariable ? node.radius ?? 0 : node.y ?? 0,
  };

  if (node.children) {
    node.children.forEach(child => {
      const childBox = getBoundingBox(child as RadialNode, isVariable);
      bbox.minX = Math.min(bbox.minX, childBox.minX);
      bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
      bbox.minY = Math.min(bbox.minY, childBox.minY);
    });
  }

  return bbox;
}

export function highlightDescendantsRect(node: RadialNode, active: boolean, linksVariable: boolean, svg: d3.Selection<SVGGElement, unknown, null, undefined>, innerRadius: number): void {
  const bbox = getBoundingBox(node, linksVariable);

  // Remove existing highlight
  svg.selectAll('.highlight-box').remove();

  if (active) {
    // Create highlight box
    svg.insert('path', ':first-child')
      .attr('class', 'highlight-box')
      .attr('d', `M ${bbox.minY} ${bbox.minX} 
                L ${innerRadius + 170} ${bbox.minX} 
                L ${innerRadius + 170} ${bbox.maxX} 
                L ${bbox.minY} ${bbox.maxX} 
                Z`)
      .style('fill', 'rgba(255, 255, 0, 0.2)')
      .style('stroke', 'rgba(255, 255, 0, 0.8)');
  }
}

export function findAndZoom(name: string, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
  // Find node with name in tree
  const node = svg.select('g.nodes')
    .selectAll<SVGGElement, RadialNode>('g.inner-node')
    .filter(d => d.data.name === name);

  if (!node.empty()) {
    const nodeElement = node.node();
    const nodeData = node.data()[0];
    if (!nodeElement) return;

    console.log("Found rectangular node", nodeData);

    const zoom = d3.zoom().on("zoom", (event) => {
      svg.select("g").attr("transform", event.transform);
    });

    const transform = nodeElement.transform.baseVal.consolidate();
    if (!transform) return;

    const matrix = transform.matrix;
    const x = matrix.e;  // translation X
    const y = matrix.f;  // translation Y

    console.log("Zooming to", x, y);

    const svgNode = svg.node();
    if (!svgNode) return;

    const width = svgNode.getBoundingClientRect().width;
    const height = svgNode.getBoundingClientRect().height;

    svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity
        .translate(width / 2 + x, height / 2 - y)
        );

    const circle = d3.select(nodeElement).select('circle');
    const currRadius = circle.attr("r");
    const currColor = circle.style("fill");
    const newRadius = (parseFloat(currRadius) * 2).toString();


    circle.transition()
      .delay(1000)
      .style("fill", "red")
      .style("r", newRadius)
      .transition()
      .duration(500)
      .style("fill", currColor)
      .style("r", currRadius)
      .transition()
      .duration(500)
      .style("fill", "red")
      .style("r", newRadius)
      .transition()
      .duration(500)
      .style("fill", currColor)
      .style("r", currRadius);

    // Find leaf with name in tree
    const leaf = svg.select('g.leaves')
      .selectAll<SVGGElement, RadialNode>('g.leaf')
      .filter(d => d.data.name === name);

    if (!leaf.empty()) {
      console.log("Found leaf", leaf);
    }
  }
}
