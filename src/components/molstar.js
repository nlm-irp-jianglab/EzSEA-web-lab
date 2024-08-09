import React, { useEffect, createRef } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { ColorNames } from "molstar/lib/mol-util/color/names";
import "molstar/lib/mol-plugin-ui/skin/dark.scss";
import GCA9 from "../components/task2/GCA_900167205.1_00854_ATOMS_section_With_ConSurf.pdb";

export function MolStarWrapper() {
  const parent = createRef();

  useEffect(() => {
    async function init() {
      // Initialize the Mol* plugin
      window.molstar = await createPluginUI({
        target: parent.current,
        render: renderReact18,
        darkTheme: true,
      });

      // Set the background color of the viewer to red
      const renderer = window.molstar.canvas3d?.props.renderer;
      if (renderer) {
        PluginCommands.Canvas3D.SetSettings(window.molstar, {
          settings: {
            renderer: {
              ...renderer,
              backgroundColor: ColorNames.gray,
            },
          },
        });
      }

      // Load and display the structure
      const data = await window.molstar.builders.data.download(
        { url: "https://files.rcsb.org/download/3PTB.pdb" }, // Replace with your URL
        { state: { isGhost: true } }
      );

      var string = await fetch(GCA9).then((response) => response.text());

      const myData = await window.molstar.builders.data.rawData({
        data: string /* string or number[] */,
        label: void 0 /* optional label */
      });

      console.log(myData)

      const trajectory = await window.molstar.builders.structure.parseTrajectory(myData, "pdb");
      await window.molstar.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
      );
    }

    init();

    return () => {
      // Clean up on unmount
      window.molstar?.dispose();
      window.molstar = undefined;
    };
  }, []);

  return (
      <div ref={parent} style={{ width: '100%', height: '430.75px' }} />
  );
}

export default MolStarWrapper;
