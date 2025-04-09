/**
 * molstar.js
 * This file contains the protein viewer component
 */
import React, { useEffect, useState, createRef } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { StructureSelection, Structure, StructureProperties } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { setStructureOverpaint, clearStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';
import { Color } from 'molstar/lib/mol-util/color';
import "./molstar/skin/light.scss";

export function MolStarWrapper({ structData, pocketData, selectedResidue, hoveredResidue, colorFile, scrollLogosToRef }) {
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

      // Rendering main structure
      const mainData = await window.molstar.builders.data.rawData({
        data: structData
      }, { state: { isGhost: true } });

      const trajectory = await window.molstar.builders.structure.parseTrajectory(mainData, "pdb");
      let structure;
      try { // Using try here to silence errors when loading example structures
        structure = await window.molstar.builders.structure.hierarchy.applyPreset(
          trajectory,
          "default"
        );
      } catch (error) {
        console.warn('Failed to load structure:', error);
        return;
      }

      const cartoon = structure.representation.representations.polymer.data.repr;

      cartoon.setTheme({
        "color": {
          "granularity": "uniform",
          "props": {
            "value": 13421772,
            "saturation": 0,
            "lightness": 0
          },
          "description": "Gives everything the same, uniform color.",
          "legend": {
            "kind": "table-legend",
            "table": [
              [
                "uniform",
                13421772
              ]
            ]
          }
        },
        "size": {
          "granularity": "uniform",
          "props": {
            "value": 1
          },
          "description": "Gives everything the same, uniform size."
        }
      });

      // Scrolls seqlogos to selection position
      window.molstar.behaviors.interaction.click.subscribe(
        (event) => {
          const selections = Array.from(
            window.molstar.managers.structure.selection.entries.values()
          );
          
          // selections is auto-sorted, lowest residue id first. Therefore, when multiple residues are selected, 
          // the logo will only scroll to the residue with the lowest id.
          var localSelected = [];
          localSelected.length = 0;

          for (const { structure } of selections) {
            if (!structure) continue;
            Structure.eachAtomicHierarchyElement(structure, {
              residue: (loc) => {
                const position = StructureProperties.residue.label_seq_id(loc);
                localSelected.push({ position });
              },
            });
          }
          if (localSelected[0]) {
            scrollLogosToRef.current(localSelected[0].position);
            window.molstar.selectionMode = !window.molstar.selectionMode;
            window.molstar.selectionMode = !window.molstar.selectionMode;
          }
        });

      // Set the structure as loaded
      setIsStructureLoaded(true);
    }

    init();
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
    window.molstar.managers.camera.focusLoci(loci); // Focus on the residue
  }

  async function applyColorFile(colorFile) {
    if (!colorFile) {
      clearStructureOverpaint(window.molstar, window.molstar.managers.structure.hierarchy.current.structures[0].components);
      return;
    };

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
