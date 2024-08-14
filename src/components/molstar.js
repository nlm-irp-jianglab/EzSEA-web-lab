import React, { useEffect, createRef } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { ColorNames } from "molstar/lib/mol-util/color/names";
import { Script } from 'molstar/lib/mol-script/script';
import "molstar/lib/mol-plugin-ui/skin/dark.scss";

export function MolStarWrapper({ selectedResidue }) {
  const parent = createRef();

  useEffect(() => {
    async function init() {
      // Initialize the Mol* plugin
      window.molstar = await createPluginUI({
        target: parent.current,
        render: renderReact18,
        spec: {
          ...DefaultPluginUISpec(),
          layout: {
            initial: {
              isExpanded: false,
              showControls: true,
            }
          },
        },
      });

      // Set the background color of the viewer to gray
      const renderer = window.molstar.canvas3d.props.renderer;
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

      // Loading the default pdb file
      const string = await fetch(`${process.env.PUBLIC_URL}/GCA_900167205.pdb`).then((response) => response.text());

      const myData = await window.molstar.builders.data.rawData({
        data: string, /* string or number[] */
        label: void 0 /* optional label */
      });

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

  // Highlight the selected residue
  async function highlightResidue(residueNumber) {
    if (!window.molstar || !window.molstar.managers.structure.hierarchy.current.structures.length) {
      console.error("Mol* plugin or structure data is not initialized.");
      return;
    }

    const structure = window.molstar.managers.structure.hierarchy.current.structures[0]?.cell?.obj?.data;
    if (!structure) {
      console.error("Structure data is not available.");
      return;
    }

    // Highlight the residue
    const seq_id = residueNumber;
    const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({ // I have no idea what this call is
      'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), seq_id]),
      'group-by': Q.struct.atomProperty.macromolecular.residueKey()
    }), structure);
    const loci = StructureSelection.toLociWithSourceUnits(sel);
    //window.molstar.managers.interactivity.lociHighlights.highlightOnly({ loci }); // Highlights
    window.molstar.managers.interactivity.lociSelects.select({ loci });


    console.log("Selected residue", residueNumber);
  }


  useEffect(() => {
    highlightResidue(selectedResidue);
  }, [selectedResidue]);

  return (
    <div
      ref={parent}
      style={{
        width: '100%',
        height: '100%', // Ensure it fills the parent div's height
        position: 'relative',
      }}
    />
  );
}

export default MolStarWrapper;
