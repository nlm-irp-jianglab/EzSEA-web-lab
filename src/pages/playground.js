import React, { useState, useRef, useEffect } from "react";
import "../components/phylotree.css";
import * as pt from 'phylotree';
import { isLeafNode } from 'phylotree/src/nodes';
import * as d3 from 'd3';
import "../components/tol.css";
import { addCustomMenu } from 'phylotree/src/render/menus';

import n18 from '../components/task2/N18.fa';
import n19 from '../components/task2/N19.fa';

export function Playground() {
    const treeRef = useRef(null);
    const [newickData, setNewickData] = useState(null);

    useEffect(() => {
        const fetchDefaultTree = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/bilr_example/bilR_ancestors.nwk`);
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
                'is-radial': true,
                'selectable': true,
                'zoom': true,
                'align-tips': true,
                'internal-names': true,
                width: 1000,
                height: 2000,
                'top-bottom-spacing': 'fixed-step',
                'left-right-spacing': 'fixed-step',
                'brush': false,
                'draw-size-bubbles': false, // Must be false so that nodes are clickable?
                'bubble-styler': d => { return 1.5 },
                'node-styler': style_nodes,
                'edge-styler': style_edges,
                'show-scale': false,
                'font-size': 4,
                'background-color': 'lightblue',
                'collapsible': true,
                'reroot': true,
                'hide': false, // Causes weird rendering in radial
            });

            function style_edges(element, edge_data) {
                element.on('click', function () {
                    console.log("Edge clicked:", edge_data);
                });
            }

            function style_nodes(element, node_data) {
                var node_label = element.select("text");
                if (!isLeafNode(node_data)) { // edits to the internal nodes
                    node_label.text("\u00A0\u00A0\u00A0\u00A0" + node_label.text() + "\u00A0\u00A0\u00A0\u00A0")
                        .style("font-weight", "bold");

                    // Unaligning the internal nodes
                    const currentTransform = node_label.attr("transform");
                    const translateRegex = /translate \(([^)]+)\)/;
                    let newTransform = currentTransform.replace(translateRegex, `translate(0, 0)`);
                    node_label.attr("transform", newTransform);
                    // Deleting the line tracer
                    element.select("line").remove();

                    function my_menu_title(node) {
                        if (node['compare-node']) {
                            return "Remove from compare";
                        }
                        return "Select for compare";
                    }

                    function condition(node) {
                        return true;
                    }

                    // Adding my custom menu
                    addCustomMenu(node_data, my_menu_title, function () {
                        console.log("Selected for compare:", node_data);
                    }, condition);
                } else { // edits to the leaf nodes
                    const currentTransform = node_label.attr("transform");
                    const translateRegex = /translate\s*\(\s*([-\d.]+,0)/;
                    const currX = currentTransform.match(translateRegex)[1];
                    let adjustX = 0;
                    let shift = 0;
                    if (parseFloat(currX) < 0) {
                        adjustX = -80; // Must account for size of the rect
                        shift = -10;
                    } else {
                        shift = 10;
                        adjustX = 70;
                    }
                    let newTransform = currentTransform.replace(translateRegex, `translate(${parseFloat(currX) + adjustX}, -5`);
                    var annotation = element.append("g").attr("transform", newTransform);
                    annotation.append("rect")
                        .attr("width", 10)
                        .attr("height", 10)
                        .style("fill", "red");
                    annotation.append("rect")
                        .attr("width", 10)
                        .attr("height", 10)
                        .style("fill", "green")
                        .attr("transform", `translate(${shift}, 0)`);
                }
            }

            treeRef.current.appendChild(tree.display.show());

        }
    }, [newickData]);

    return (
        <div>
            <div
                id="tree_container"
                className="tree-div"
                ref={treeRef}
                style={{ width: '100%' }}
            ></div>
        </div>
    );
}

export default Playground;
