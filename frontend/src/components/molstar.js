import React, { useEffect, useState, createRef } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { ColorNames } from "molstar/lib/mol-util/color/names";
import { Script } from 'molstar/lib/mol-script/script';
import { setStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';
import { Color } from 'molstar/lib/mol-util/color';
import { ViewportControls } from 'molstar/lib/mol-plugin-ui/viewport';
import "molstar/lib/mol-plugin-ui/skin/dark.scss";

const colorArr = [ // Color gradient for adding color to residues
  0x5A72DB,
  0x6B6AC6,
  0x7B61B0,
  0x8C599B,
  0x9D5185,
  0xAD4870,
  0xBE405A,
  0xCE3745,
  0xDF2F2F,
]

export function MolStarWrapper({ structData, selectedResidue, hoveredResidue, colorFile }) {
  const parent = createRef();
  const [isStructureLoaded, setIsStructureLoaded] = useState(false);

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
      // TODO: Load PDB files dynamically

      if (structData == null) {
        console.error("No structure data provided.");
        return;
      }

      const myData = await window.molstar.builders.data.rawData({
        data: structData, /* string or number[] */
        label: void 0 /* optional label */
      });

      const trajectory = await window.molstar.builders.structure.parseTrajectory(myData, "pdb");
      await window.molstar.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
      );

      // Set the structure as loaded
      setIsStructureLoaded(true);
    }

    init();

    return () => {
      // Clean up on unmount
      window.molstar?.dispose();
      window.molstar = undefined;
    };
  }, []);

  useEffect(() => {
    if (isStructureLoaded) {
      applyColorFile(colorFile);
    }
  }, [isStructureLoaded, colorFile]);

  useEffect(() => {
    if (isStructureLoaded) {
      selectResidue(selectedResidue);
    }
  }, [isStructureLoaded, selectedResidue]);

  useEffect(() => {
    if (isStructureLoaded) {
      selectResidue(hoveredResidue, true);
    }
  }, [isStructureLoaded, hoveredResidue]);

  async function selectResidue(residueNumber, hovered = false) {
    if (residueNumber == null) return;
    const seq_id = residueNumber;

    console.log("selecting residue", seq_id);

    if (!window.molstar || !window.molstar.managers.structure.hierarchy.current.structures.length) {
      console.error("Mol* plugin or structure data is not initialized.");
      return;
    }

    const structure = window.molstar.managers.structure.hierarchy.current.structures[0]?.cell?.obj?.data;
    if (!structure) {
      console.error("Structure data is not available.");
      return;
    }

    const sel = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({ // Call to query the structure using residue number to get a Loci
      'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), seq_id]),
      'group-by': Q.struct.atomProperty.macromolecular.residueKey()
    }), structure);
    const loci = StructureSelection.toLociWithSourceUnits(sel);

    if (hovered) {
      window.molstar.managers.interactivity.lociHighlights.highlightOnly({ loci }); // Highlight the residue
      return;
    }
    // Clear previous selections
    window.molstar.managers.interactivity.lociSelects.deselectAll();
    window.molstar.managers.interactivity.lociSelects.select({ loci }); // Select the residue

    // console.log("Selected residue", residueNumber);
  }

  async function applyColorFile(colorFile) {
    if (!colorFile) return;

    if (!window.molstar || !window.molstar.managers.structure.hierarchy.current.structures.length) {
      console.error("Mol* plugin or structure data is not initialized.");
      return;
    }

    for (let i = 0; i < colorFile.length; i++) { // Default for loop, because forEach is async and setStructureOverpaint doesn't like that
      const color = colorFile[i];

      await setStructureOverpaint(
        window.molstar,
        window.molstar.managers.structure.hierarchy.current.structures[0].components,
        Color(color),
        (s) => {
          const sel = Script.getStructureSelection(Q =>
            Q.struct.generator.atomGroups({
              'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), i + 1]), // Adjusted to match sequence number
              'group-by': Q.struct.atomProperty.macromolecular.residueKey(),
            }), s
          );
          return StructureSelection.toLociWithSourceUnits(sel);
        }
      );
    }

  }

  return (
    <div
      ref={parent}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1, // Matches z value of navbar
      }}
    />
  );
}

export default MolStarWrapper;
