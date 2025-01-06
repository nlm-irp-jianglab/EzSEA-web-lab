import update from 'immutability-helper'
import { useCallback, useEffect, useState, useContext } from 'react'
import { LogoCard } from './logoCard.js'
import { tolContext } from './tolContext';
import { LogoProvider } from './logoContext.js';

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
        const { logoContent, setLogoContent } = useContext(tolContext);

        useEffect(() => {
            setCards(Object.keys(fastaContent).map((key, index) => {
                return {
                    id: index,
                    text: key
                }
            }))
        }, [fastaContent])
        
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
                    {...(card.text.includes("ASR") ? { ppm: fastaContent[card.text] } : { fasta: fastaContent[card.text] })}
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
            <LogoProvider>
                <div style={style}>{cards.map((card, i) => renderCard(card, i))}</div>
            </LogoProvider>
        )
    }
}
