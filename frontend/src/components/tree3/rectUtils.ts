import { RadialNode, D3Node } from './types';
import * as d3 from 'd3';

function getBoundingBox(node: RadialNode, isVariable: boolean): { minX: number; maxX: number; minY: number} {
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