import { TreeNode, D3Node, RadialNode } from './types.ts';
import * as d3 from 'd3';

export const convertToD3Format = (node: TreeNode | null): D3Node | null => {
  if (!node) return null;

  return {
    name: node.name || '',
    value: node.length || 0,
    children: node.branchset
      ? node.branchset.map(child => convertToD3Format(child))
        .filter((node): node is D3Node => node !== null)
      : [],
  };
};

export function readTree(text: string): TreeNode {
  // remove whitespace
  text = text.replace(/\s+$/g, '')  // Remove trailing whitespace
    .replace(/[\r\n]+/g, '') // Remove carriage returns and newlines
    .replace(/\s+/g, '');    // Remove any remaining whitespace

  var tokens = text.split(/(;|\(|\)|,)/),
    root: TreeNode = {
      parent: null,
      branchset: []
    },
    curnode = root,
    nodeId = 0;

  for (const token of tokens) {
    if (token === "" || token === ';') {
      continue
    }
    if (token === '(') {
      // add a child to current node
      let child = {
        parent: curnode,
        branchset: []
      };
      curnode.branchset.push(child);
      curnode = child;  // climb up
    }
    else if (token === ',') {
      // climb down, add another child to parent
      if (curnode.parent) {
        curnode = curnode.parent;
      } else {
        throw new Error("Parent node is undefined");
      }
      let child = {
        'parent': curnode,
        'branchset': []
      }
      curnode.branchset.push(child);
      curnode = child;  // climb up
    }
    else if (token === ')') {
      // climb down twice
      if (curnode.parent) {
        curnode = curnode.parent;
      } else {
        throw new Error("Parent node is undefined");
      }
      if (curnode === null) {
        break;
      }
    }
    else {
      var nodeinfo = token.split(':');

      if (nodeinfo.length === 1) {
        if (token.startsWith(':')) {
          curnode.name = "";
          curnode.length = parseFloat(nodeinfo[0]);
        } else {
          curnode.name = nodeinfo[0];
          curnode.length = undefined;
        }
      }
      else if (nodeinfo.length === 2) {
        curnode.name = nodeinfo[0];
        curnode.length = parseFloat(nodeinfo[1]);
      }
      else {
        // TODO: handle edge cases with >1 ":"
        console.warn(token, "I don't know what to do with two colons!");
      }
      curnode.id = nodeId++;  // assign then increment
    }
  }

  curnode.id = nodeId;

  return (root);
}

export const deepCloneD3Node = (node: TreeNode): TreeNode => {
  return {
    name: node.name,
    length: node.length,
    branchset: node.branchset?.map(child => deepCloneD3Node(child)),
    id: node.id,
    parent: node.parent
  };
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

    console.log("Found node", nodeData);

    const zoom = d3.zoom().on("zoom", (event) => {
      svg.select("g").attr("transform", event.transform);
    });

    const transform = nodeElement.transform.baseVal.consolidate();
    if (!transform) return;

    const matrix = transform.matrix;
    const x = matrix.e;  // translation X
    const y = matrix.f;  // translation Y

    const svgNode = svg.node();
    if (!svgNode) return;

    const width = svgNode.getBoundingClientRect().width;
    const height = svgNode.getBoundingClientRect().height;

    svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity
        .translate(width / 2 - x, height / 2 - y)
        .scale(2));

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

export function selectAllLeaves(node: RadialNode): RadialNode[] {
  const leaves: RadialNode[] = [];
  
  function traverse(currentNode: RadialNode) {
    if (!currentNode.children) {
      leaves.push(currentNode);
    } else {
      const children = currentNode.children || [];
      children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return leaves;
}