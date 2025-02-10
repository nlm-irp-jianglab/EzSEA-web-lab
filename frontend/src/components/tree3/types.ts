export interface TreeNode {
  name?: string;
  length?: number;
  branchset: TreeNode[];
  id?: number
  parent?: TreeNode | null
}

export interface D3Node {
  name: string;
  value: number;
  children?: D3Node[];
}

export interface Link<NodeType> {
  source: NodeType;
  target: NodeType;
}

export interface RadialTreeProps {
  data: string;
  width?: number;
  onNodeClick?: (event: MouseEvent, node: RadialNode) => void;
  onNodeMouseOver?: (event: MouseEvent, node: RadialNode) => void;
  onNodeMouseOut?: (event: MouseEvent, node: RadialNode) => void;
  onLeafClick?: (event: MouseEvent, node: RadialNode) => void;
  onLeafMouseOver?: (event: MouseEvent, node: RadialNode) => void;
  onLeafMouseOut?: (event: MouseEvent, node: RadialNode) => void;
  onLinkClick?: (event: MouseEvent, source: RadialNode, target: RadialNode) => void;
  onLinkMouseOver?: (event: MouseEvent, source: RadialNode, target: RadialNode) => void;
  onLinkMouseOut?: (event: MouseEvent, source: RadialNode, target: RadialNode) => void;
  customNodeMenuItems?: [{
    label: (node: RadialNode) => string;
    onClick: (node: RadialNode) => void;
    toShow: (node: RadialNode) => boolean;
  }];
  nodeStyler?: (node: RadialNode) => void;
  linkStyler?: (source: RadialNode, target: RadialNode) => void;
  leafStyler?: (node: RadialNode) => void;
}

// Extend D3's HierarchyNode with radius property
export interface RadialNode extends d3.HierarchyNode<D3Node> {
  radius?: number;
  linkNode?: SVGPathElement;
  linkExtensionNode?: SVGPathElement;
  nodeElement?: SVGGElement;
  color?: string;
  labelElement?: SVGTextElement;
}

export interface RectNode extends d3.HierarchyNode<D3Node> {
  linkNode?: SVGPathElement;
  linkExtensionNode?: SVGPathElement;
  nodeElement?: SVGGElement;
  color?: string;
  labelElement?: SVGTextElement;
}

export interface UnrootedTreeProps {
  data: string;
  width?: number;
  scale?: number;
  onNodeClick?: (event: MouseEvent, node: UnrootedNode) => void;
  onNodeMouseOver?: (event: MouseEvent, node: UnrootedNode) => void;
  onNodeMouseOut?: (event: MouseEvent, node: UnrootedNode) => void;
  onLeafClick?: (event: MouseEvent, node: UnrootedNode) => void;
  onLeafMouseOver?: (event: MouseEvent, node: UnrootedNode) => void;
  onLeafMouseOut?: (event: MouseEvent, node: UnrootedNode) => void;
  onLinkClick?: (event: MouseEvent, source: UnrootedNode, target: UnrootedNode) => void;
  onLinkMouseOver?: (event: MouseEvent, source: UnrootedNode, target: UnrootedNode) => void;
  onLinkMouseOut?: (event: MouseEvent, source: UnrootedNode, target: UnrootedNode) => void;
  customNodeMenuItems?: [{
    label: (node: UnrootedNode) => string;
    onClick: (node: UnrootedNode) => void;
    toShow: (node: UnrootedNode) => boolean;
  }];
  nodeStyler?: (node: UnrootedNode) => void;
  linkStyler?: (source: UnrootedNode, target: UnrootedNode) => void;
  leafStyler?: (node: UnrootedNode) => void;
}

export interface UnrootedNode extends TreeNode {
  angle: number;
  isTip: boolean;
  parentId: number | null;
  parentName: string | null;
  parent: UnrootedNode | null;
  children: UnrootedNode[];
  thisId: number;
  thisName: string;
  x: number;
  y: number;
  linkNode?: SVGPathElement;
  linkExtensionNode?: SVGPathElement;
  nodeElement?: SVGGElement;
  labelElement?: SVGTextElement;
  color?: string;
  forwardLinkNodes?: SVGPathElement[]; // Due how layout is calculated, updating linkNode does not reflect in children under branchset. So here we store the forward links
  data: {
    name: string;
    value: number;
  }
}

export interface EqAngNode extends TreeNode {
  angle: number;
  end: number;
  ntips: number;
  start: number;
  x: number;
  y: number;
  linkNode: SVGPathElement;
}

export interface UnrootedData {
  data: UnrootedNode[];
  edges: Link<UnrootedNode>[];
}