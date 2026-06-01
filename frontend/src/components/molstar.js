/**
 * molstar.js
 * This file contains the protein viewer component
 */
import React, { useEffect, useState, useRef } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { StructureSelection, Structure, StructureProperties } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { setStructureOverpaint, clearStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';
import { Color } from 'molstar/lib/mol-util/color';
import "./molstar/skin/light.scss";

export function MolStarWrapper({ structData, pocketData, selectedResidue, hoveredResidue, colorFile, scrollLogosToRef }) {
  const parent = useRef(null);
  const pluginRef = useRef(null);
  const [isStructureLoaded, setIsStructureLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      // Initialize the Mol* plugin
      pluginRef.current = await createPluginUI({
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

      // Only try to render if structData is provided
      if (structData) {
        // Rendering main structure
        const mainData = await pluginRef.current.builders.data.rawData({
          data: structData
        }, { state: { isGhost: true } });

        const trajectory = await pluginRef.current.builders.structure.parseTrajectory(mainData, "pdb");
        try {
          const structure = await pluginRef.current.builders.structure.hierarchy.applyPreset(
            trajectory,
            "default"
          );

          // Scrolls seqlogos to selection position
          pluginRef.current.behaviors.interaction.click.subscribe(
            (event) => {
              const selections = Array.from(
                pluginRef.current.managers.structure.selection.entries.values()
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
                pluginRef.current.selectionMode = !pluginRef.current.selectionMode;
                pluginRef.current.selectionMode = !pluginRef.current.selectionMode;
              }
            });
            
          setIsStructureLoaded(true);
        } catch (error) {
          console.warn('Failed to load structure:', error);
          setIsStructureLoaded(false);
          return;
        }
      } else {
        // If no structData, just show empty viewer
        setIsStructureLoaded(false);
      }
    }

    init();

    // Cleanup function
    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose();
      }
    };
  }, [structData]); // Add structData as dependency

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

    if (!pluginRef.current || !pluginRef.current.managers.structure.hierarchy.current.structures.length) {
      console.error("Mol* plugin or structure data is not initialized.");
      return;
    }

    const structure = pluginRef.current.managers.structure.hierarchy.current.structures[0]?.cell?.obj?.data;
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
      pluginRef.current.managers.interactivity.lociHighlights.highlightOnly({ loci }); // Highlight the residue
      return;
    }
    // Clear previous selections
    pluginRef.current.managers.interactivity.lociSelects.deselectAll();

    pluginRef.current.managers.interactivity.lociSelects.select({ loci }); // Select the residue
    pluginRef.current.managers.camera.focusLoci(loci); // Focus on the residue
  }

  async function applyColorFile(colorFile) {
    const plugin = pluginRef.current;
    if (!plugin?.managers?.structure?.hierarchy?.current?.structures?.length) return;
    if (!colorFile) {
      clearStructureOverpaint(plugin, plugin.managers.structure.hierarchy.current.structures[0].components);
      return;
    }
    const components = plugin.managers.structure.hierarchy.current.structures[0].components;
    await plugin.dataTransaction(async () => {
      for (let i = 0; i < colorFile.length; i++) {
        await setStructureOverpaint(plugin, components, Color(colorFile[i]), (s) => {
          const sel = Script.getStructureSelection(Q =>
            Q.struct.generator.atomGroups({
              'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_seq_id(), i + 1]),
              'group-by': Q.struct.atomProperty.macromolecular.residueKey(),
            }), s
          );
          return StructureSelection.toLociWithSourceUnits(sel);
        });
      }
    });
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
