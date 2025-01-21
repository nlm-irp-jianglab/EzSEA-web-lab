import { useRef, useCallback, useEffect, useState, useContext } from 'react'
import Logo from './logo/logo.jsx';
import { useDrag, useDrop } from 'react-dnd'
import { ItemTypes } from './itemTypes.js'
import { allColors } from './logo/alphabets_protein.jsx';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { tolContext } from './tolContext';
import { logoContext } from './logoContext';
import Tooltip from '@mui/material/Tooltip';
import { getEmptyImage } from "react-dnd-html5-backend";

const dragHandleStyle = {
    width: '24px',
    height: 'auto',
    display: 'flex',
    cursor: 'move',
    alignItems: 'center',
    backgroundColor: 'whitesmoke',
    zIndex: 1,
    margin: '.5rem 0rem',
    borderRadius: '.5rem',
}
export const LogoCard = ({ id, index, header, moveCard, ppm = null, fasta = null, applyEntropyStructColor, applyImportantStructColor,
    removeLogo, onSymbolClick, onSymbolHover, importantResiduesList, findAndZoom, addLogoRef }) => {
    const dragRef = useRef(null);
    const { activeButton, setActiveButton } = useContext(logoContext);
    const { logoContent, setLogoContent, logoAlphabet, setLogoAlphabet } = useContext(tolContext);
    const logoRef = useRef(null);
    var nodeId = "";

    if (header.includes("ASR")) {
        nodeId = header.replace("ASR Probability Logo for ", "");
    } else {
        nodeId = header.replace("Information Logo of Clade ", "");
    }

    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            }
        },
        hover(item, monitor) {
            if (!dragRef.current) {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return
            }
            // Determine rectangle on screen
            const hoverBoundingRect = dragRef.current?.getBoundingClientRect()
            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            // Determine mouse position
            const clientOffset = monitor.getClientOffset()
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }
            // Time to actually perform the action
            moveCard(dragIndex, hoverIndex)
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex
        },
    })
    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return { id, index }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })
    const opacity = isDragging ? 0.6 : 1;
    drag(dragRef);

    useEffect(() => {
        preview(getEmptyImage());
    });

    // Function to download SVG
    const downloadLogoSVG = (logoIndex, fileName) => {
        if (!logoRef.current) {
            console.error('Logo not found');
            return;
        }
        const svgElement = logoRef.current.querySelector('svg');
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);
        const styleString = `
            <style>
                .glyphrect {
                    fill-opacity: 0.0;
                }
            </style>`;
        source = source.replace('</svg>', `${styleString}</svg>`);
        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <div ref={drop} className="dnd-container" style={{ display: "flex", padding: "0.5rem 0rem" }}>
            <div ref={dragRef}
                style={{ ...dragHandleStyle, opacity, backgroundColor: "whitesmoke" }} data-handler-id={handlerId}>
                <DragIndicatorIcon />
            </div>
            <div className="logo-scrollable-box" style={{ width: "95%" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        height: "30px",
                        padding: "3px",
                        justifyContent: "space-between",
                    }}
                >
                    <p style={{ paddingLeft: "30px" }}>
                        <button
                            className="logo-btn"
                            style={{
                                outline: "none",
                                cursor: "pointer",
                                borderRadius: "5px",
                                border: "black solid 1px"
                            }}
                            onClick={() => { findAndZoom(nodeId) }}>
                            <b>{header}</b>
                        </button>
                    </p>
                    <span style={{ paddingRight: "30px" }}>
                        {fasta && (
                            <Tooltip title="Color Conservation" placement="top">
                                <button
                                    className={`logo-color-btn logo-btn ${activeButton === `entropy-${index}` ? "active" : ""
                                        }`}
                                    style={{
                                        ...styles.colorBtn,
                                        backgroundColor: activeButton === `entropy-${index}` ? "#639fc7" : "#95bee8", // Depressed style
                                        boxShadow: activeButton === `entropy-${index}` ? "inset 0px 4px 6px rgba(0, 0, 0, 0.4)" : "none", // Inset shadow
                                        transform: activeButton === `entropy-${index}` ? "translateY(2px)" : "none", // Lowered position
                                        border: activeButton === `entropy-${index}` ? "2px solid #4a7fa5" : "1px solid #95bee8", // Emphasized border
                                    }}
                                    onClick={() => {
                                        if (activeButton === `entropy-${index}`) {
                                            setActiveButton(null);
                                            applyEntropyStructColor(null, true); // Assuming you have a function to clear the color
                                        } else {
                                            setActiveButton(`entropy-${index}`);
                                            applyEntropyStructColor(nodeId);
                                        }
                                    }}
                                >
                                    <svg
                                        fill="#000000"
                                        width="23px"
                                        height="25px"
                                        viewBox="0 0 1920 1920"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M392.26 1042.5c137.747-57.67 292.85-15.269 425.873 116.217l4.394 4.833c116.656 146.425 149.5 279.119 97.873 394.237-128.85 287.138-740.692 328.77-810.005 332.504L0 1896.442l61.953-91.83c.989-1.539 105.013-158.728 105.013-427.192 0-141.811 92.6-279.558 225.294-334.92ZM1728.701 23.052c54.923-1.099 99.96 15.268 135.111 49.43 40.643 40.644 58.109 87.877 56.021 140.603C1908.85 474.52 1423.33 953.447 1053.15 1280.79c-24.276-64.81-63.711-136.21-125.335-213.102l-8.787-9.886c-80.078-80.187-169.163-135.11-262.423-161.473C955.276 558.002 1460.677 33.927 1728.701 23.052Z" />
                                    </svg>
                                </button>
                            </Tooltip>
                        )}
                        <Tooltip title="Download Individual" placement="top">
                            <button
                                className="logo-download-btn logo-btn"
                                style={styles.downloadBtn}
                                onClick={() => downloadLogoSVG(index, "seqlogo_" + header + ".svg")}
                            >
                                <svg
                                    width="25px"
                                    height="25px"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V12.1893L14.4697 10.4697C14.7626 10.1768 15.2374 10.1768 15.5303 10.4697C15.8232 10.7626 15.8232 11.2374 15.5303 11.5303L12.5303 14.5303C12.3897 14.671 12.1989 14.75 12 14.75C11.8011 14.75 11.6103 14.671 11.4697 14.5303L8.46967 11.5303C8.17678 11.2374 8.17678 10.7626 8.46967 10.4697C8.76256 10.1768 9.23744 10.1768 9.53033 10.4697L11.25 12.1893V7C11.25 6.58579 11.5858 6.25 12 6.25ZM8 16.25C7.58579 16.25 7.25 16.5858 7.25 17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H8Z"
                                        fill="#1C274C"
                                    />
                                </svg>
                            </button>
                        </Tooltip>
                        <Tooltip title="Download Individual" placement="top">
                            <button
                                className="logo-remove-btn logo-btn"
                                style={styles.removeBtn}
                                onClick={() => removeLogo(header)}
                            >
                                <svg
                                    width="25px"
                                    height="25px"
                                    viewBox="0 0 1024 1024"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fill="#000000"
                                        d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zM288 512a38.4 38.4 0 0 0 38.4 38.4h371.2a38.4 38.4 0 0 0 0-76.8H326.4A38.4 38.4 0 0 0 288 512z"
                                    />
                                </svg>
                            </button>
                        </Tooltip>
                    </span>
                </div>
                <div
                    id="logo-stack"
                    className="logo_render"
                    style={{
                        display: "flex",
                        height: "150px",
                        width: "max-content",
                        overflowX: "hidden",
                    }}
                    ref={(el) => { addLogoRef(el); logoRef.current = el; }}
                >
                    <Logo
                        fasta={fasta}
                        ppm={ppm}
                        header={header}
                        alphabet={allColors[logoAlphabet]}
                        onSymbolClick={onSymbolClick}
                        onSymbolMouseOver={onSymbolHover}
                        importantResidues={
                            importantResiduesList[nodeId] || {
                                differing_residues: [], // Default to empty list if no important residues are provided
                            }
                        }
                        mode={ppm ? "FREQUENCY" : "INFORMATION_CONTENT"}
                        height={150}
                        countUnaligned={true}
                    />
                </div>
            </div>
        </div>
    );
}

const styles = {
    downloadBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "center",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#def2b3",
        alignItems: "center",
    },
    removeBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "left",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#f2b4b3",
    },
    colorBtn: {
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        border: "none",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "14px",
        justifyContent: "center",
        padding: "5px 10px",
        textAlign: "center",
        verticalAlign: "middle",
        height: "30px",
        padding: "5px",
        backgroundColor: "#95bee8",
        alignItems: "center",
    },
}