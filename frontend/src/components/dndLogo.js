import update from 'immutability-helper'
import { useCallback, useEffect, useState, useContext } from 'react'
import { LogoCard } from './logoCard.js'
import { logoContext } from './logoContext';
import { tolContext } from './tolContext';

const style = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  overflowX: "hidden",
}

export const DndLogo = ({ fastaContent, applyEntropyStructColor, applyImportantStructColor,
  removeLogo, onSymbolClick, onSymbolHover, importantResiduesList, findAndZoom, addLogoRef }) => {
  {
    const [cards, setCards] = useState([]);
    const { logoContent, setLogoContent } = useContext(tolContext); // TODO implement fasta passing using context instead of props
    const { compareQueue, setCompareDiff } = useContext(logoContext);
    console.log("DndLogo.js: logoContent", logoContent)

    useEffect(() => { // Assigns each fasta sequence to a card
      setCards(Object.keys(logoContent).map((key, index) => {
        return {
          id: index,
          text: key
        }
      }))
    }, [logoContent])

    useEffect(() => { // Updates the compareDiff state when two cards are in the compareQueue
      if (compareQueue && Object.keys(compareQueue).length == 2) {
        if (compareQueue && Object.keys(compareQueue).length === 2) {
          const [item1, item2] = Object.values(compareQueue);
          const [node1, node2] = Object.keys(compareQueue);
          const differences = [];

          // Compare each position
          for (let pos = 0; pos < item1.length; pos++) {
            // Get max amino acid index for each item at this position
            const maxIndex1 = item1[pos].indexOf(Math.max(...item1[pos]));
            const maxIndex2 = item2[pos].indexOf(Math.max(...item2[pos]));

            // If different max amino acids, record position
            if (maxIndex1 !== maxIndex2) {
              differences.push(pos);
            }
          }
          const diff_dict = {
            [node1]: {
              "differing_residues": differences 
            },
            [node2]: {
              "differing_residues": differences 
            },
          }

          setCompareDiff(diff_dict);
        }
      } else {
        setCompareDiff(null)
      }
    }, [compareQueue])

    // Drag and drop functionality
    const moveCard = useCallback((dragIndex, hoverIndex) => {
      setCards((prevCards) =>
        update(prevCards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevCards[dragIndex]],
          ],
        }),
      )
    }, [cards])

    const renderCard = useCallback((card, index) => {
      return (
        <LogoCard
          key={card.id}
          index={index}
          id={card.id}
          header={card.text}
          moveCard={moveCard}
          {...(card.text.includes("ASR") ? { ppm: logoContent[card.text] } : { fasta: logoContent[card.text] })}
          applyEntropyStructColor={applyEntropyStructColor}
          applyImportantStructColor={applyImportantStructColor}
          removeLogo={removeLogo}
          onSymbolClick={onSymbolClick}
          onSymbolHover={onSymbolHover}
          importantResiduesList={importantResiduesList}
          findAndZoom={findAndZoom}
          addLogoRef={addLogoRef}
        />
      )
    }, [cards])

    return (
      <> 
        <div style={style}>{cards.map((card, i) => renderCard(card, i))}</div> 
      </>
    )
  }
}
