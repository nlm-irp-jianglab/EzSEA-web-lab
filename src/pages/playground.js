import React, { useState, useRef, useEffect } from "react";
import "../components/phylotree.css";
import * as pt from 'phylotree';
import * as d3 from 'd3';
import "../components/tol.css";

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
                'align-tips': false,
                'internal-names': true,
                width: 500,
                height: 500,
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

        }
    }, [newickData]);

    return (
        <div>
            <div
                id="tree_container"
                className="tree-div"
                ref={treeRef}
                style={{ width : '100%' }}
            ></div>
        </div>
    );
}

export default Playground;
