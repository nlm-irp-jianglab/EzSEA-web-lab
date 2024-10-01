import { React, useState, useRef, useEffect } from "react";
import Navbar from "../components/navbar.js";
import "../components/submit.css";

const Home = () => {
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [canSubmit, setCanSubmit] = useState(false);
    const [fastaStatus, setFastaStatus] = useState("");
    const jobInput = useRef(null);
    const emailInput = useRef(null);
    const [emailStatus, setEmailStatus] = useState(false);
    const fastaInput = useRef(null);
    const [selectedFoldingProgram, setSelectedFoldingProgram] = useState("colabfold");
    const [selectedPhylogeneticProgram, setSelectedPhylogeneticProgram] = useState("FastTree");
    const [selectedAncestralProgram, setSelectedAncestralProgram] = useState("GRASP");



    const toggleSettingsDropdown = () => {
        setIsSettingsVisible(!isSettingsVisible); // Toggle the state
    };

    const validateInput = () => {
        // TODO implement fasta input validation
        const fasta = fastaInput.current.value.trim();  // Remove any extra whitespace
        const lines = fasta.split('\n');  // Split the input into lines

        // Check if empty input
        if (fasta === "") {
            setFastaStatus("empty");
            return;
        }

        if (!lines[0].startsWith('>')) {
            setFastaStatus("noHeader");
            return;
        }

        // Check if the remaining lines contain only valid characters for the sequence
        const sequenceRegex = /^[ACDEFGHIKLMNPQRSTVWY]+$/i;
        for (let i = 1; i < lines.length; i++) {
            if (!sequenceRegex.test(lines[i])) {
                setFastaStatus("invalid");
                return;
            }
        }

        // If both checks pass, mark as valid
        setFastaStatus("valid");
    };

    const validateEmail = (email) => {
        if (email === "") {
            setEmailStatus(false);
            return;
        } else {
            setEmailStatus(true);
        }
    };

    useEffect(() => {
        if (fastaStatus === "valid" && emailStatus === true) {
            setCanSubmit(true);
        } else {
            setCanSubmit(false);
        }
    }, [fastaStatus, emailStatus]);


    const submitJob = () => {
        var jobName = jobInput.current.value;
        if (!jobName) {
            // Generate a random job name if none is provided
            jobName = "EzSEA_" + Math.random().toString(36).substring(7);
        }

        const json = {
            "job_name": jobName,
            "email": emailInput.current.value,
            "sequence": fastaInput.current.value,
            "folding_program": selectedFoldingProgram,
            "phylogenetic_program": selectedPhylogeneticProgram,
            "ancestral_program": selectedAncestralProgram
        } 

        // Send JSON to backend
        fetch('http://localhost:3001/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

    }

    const statusMsg = () => {
        switch (fastaStatus) {
            case "valid":
                return (
                    <span className="bp3-tag bp3-intent-success">
                        <span icon="tick" className="bp3-icon bp3-icon-tick">
                            <svg data-icon="tick" width="16" height="16" viewBox="0 0 16 16">
                                <desc>tick</desc>
                                <path d="M14 3c-.28 0-.53.11-.71.29L6 10.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42l4 4c.18.18.43.29.71.29s.53-.11.71-.29l8-8A1.003 1.003 0 0014 3z" fillRule="evenodd"></path>
                            </svg>
                        </span>
                        <span className="bp3-text-overflow-ellipsis bp3-fill">Valid sequence</span>
                    </span>
                );
            case "short": {
                return (
                    <span className="bp3-tag bp3-intent-danger">
                        <span icon="cross" className="bp3-icon bp3-icon-cross">
                            <svg data-icon="cross" width="16" height="16" viewBox="0 0 16 16">
                                <desc>cross</desc>
                                <path d="M9.41 8l3.29-3.29c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71L8 6.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42L6.59 8 3.3 11.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71L8 9.41l3.29 3.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71L9.41 8z" fillRule="evenodd"></path>
                            </svg>
                        </span>
                        <span className="bp3-text-overflow-ellipsis bp3-fill">Input sequence is too short (minimum: 30 residues)</span>
                    </span>
                );
            }
            case "noHeader": {
                return (
                    <span className="bp3-tag bp3-intent-danger">
                        <span icon="cross" className="bp3-icon bp3-icon-cross">
                            <svg data-icon="cross" width="16" height="16" viewBox="0 0 16 16">
                                <desc>cross</desc>
                                <path d="M9.41 8l3.29-3.29c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71L8 6.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42L6.59 8 3.3 11.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71L8 9.41l3.29 3.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71L9.41 8z" fillRule="evenodd"></path>
                            </svg>
                        </span>
                        <span className="bp3-text-overflow-ellipsis bp3-fill">Missing header</span>
                    </span>
                );
            }
            case "invalid": {
                return (
                    <span className="bp3-tag bp3-intent-danger">
                        <span icon="cross" className="bp3-icon bp3-icon-cross">
                            <svg data-icon="cross" width="16" height="16" viewBox="0 0 16 16">
                                <desc>cross</desc>
                                <path d="M9.41 8l3.29-3.29c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71L8 6.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42L6.59 8 3.3 11.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71L8 9.41l3.29 3.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71L9.41 8z" fillRule="evenodd"></path>
                            </svg>
                        </span>
                        <span className="bp3-text-overflow-ellipsis bp3-fill">Invalid sequence</span>
                    </span>
                );
            }
            default: {
                return (
                    <span className="bp3-tag bp3-intent-primary">
                        <span className="bp3-text-overflow-ellipsis bp3-fill">Please enter your protein sequence</span>
                    </span>
                );
            }
        }
    };

    return (
        <div style={{ userSelect: "none" }}>
            <Navbar />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: "1 0 auto" }}>
                <div style={{ textAlign: "center", margin: "2em auto 0px", width: "50%", padding: "0.5em", flex: "1 1 0" }}>
                    <img src={process.env.PUBLIC_URL + "/temp_logo.png"} alt="Logo" style={{ width: "60%", marginBottom: "3em" }}></img>
                    <div>
                        <div> {/* This div is for text input and examples */}
                            <textarea placeholder="Sequence in FASTA format" className="data-input" ref={fastaInput} onChange={validateInput} style={{ height: "150px", width: "100%", resize: "vertical" }}></textarea>
                            <div>
                                <div style={{ display: "flex", marginTop: "0.3em", justifyContent: "space-between" }}>
                                    {statusMsg()}
                                    <span className="bp3-popover-wrapper">
                                        <div className="bp3-popover-target">
                                            <button type="button" className="bp3-button bp3-minimal bp3-small">
                                                <span className="bp3-button-text">Examples</span>
                                            </button>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div> {/* End div for text input and examples */}
                        <div style={{ display: "flex", marginTop: "1em", marginBottom: "1em", minHeight: "2pt", placeContent: "center" }}></div>
                        <div style={{ marginTop: "2em" }}>
                            <button type="button" className="bp3-button bp3-minimal" onClick={() => toggleSettingsDropdown()}>
                                {isSettingsVisible ? (
                                    <span icon="caret-down" className="bp3-icon bp3-icon-caret-down">
                                        <svg data-icon="caret-down" width="16" height="16" viewBox="0 0 16 16">
                                            <desc>caret-down</desc>
                                            <path d="M12 6.5c0-.28-.22-.5-.5-.5h-7a.495.495 0 00-.37.83l3.5 4c.09.1.22.17.37.17s.28-.07.37-.17l3.5-4c.08-.09.13-.2.13-.33z" fillRule="evenodd"></path>
                                        </svg>
                                    </span>
                                ) : (
                                    <span icon="caret-right" className="bp3-icon bp3-icon-caret-right">
                                        <svg data-icon="caret-right" width="16" height="16" viewBox="0 0 16 16">
                                            <desc>caret-right</desc>
                                            <path d="M11 8c0-.15-.07-.28-.17-.37l-4-3.5A.495.495 0 006 4.5v7a.495.495 0 00.83.37l4-3.5c.1-.09.17-.22.17-.37z" fillRule="evenodd"></path>
                                        </svg>
                                    </span>
                                )}
                                <span className="bp3-button-text">{isSettingsVisible ? "Hide advanced settings" : "Show advanced settings"}</span>
                            </button>
                            <div className="bp3-collapse">
                                <div className="bp3-collapse-body" style={{ transform: isSettingsVisible ? "translateY(0px)" : "translateY(-557px)" }}>
                                    {isSettingsVisible ? (
                                        <div className="bp3-card bp3-elevation-0">
                                            <div>
                                                <p>Protein Folding Program:</p>
                                                <span>
                                                    <button
                                                        onClick={() => setSelectedFoldingProgram('colabfold')}
                                                        style={{
                                                            backgroundColor: selectedFoldingProgram === 'colabfold' ? '#007bff' : 'transparent',
                                                            color: selectedFoldingProgram === 'colabfold' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        colabfold
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedFoldingProgram('pdb')}
                                                        style={{
                                                            backgroundColor: selectedFoldingProgram === 'pdb' ? '#007bff' : 'transparent',
                                                            color: selectedFoldingProgram === 'pdb' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        pdb
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedFoldingProgram('none')}
                                                        style={{
                                                            backgroundColor: selectedFoldingProgram === 'none' ? '#007bff' : 'transparent',
                                                            color: selectedFoldingProgram === 'none' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        none
                                                    </button>
                                                </span>

                                                <p>Phylogenetic Tree Program:</p>
                                                <span>
                                                    <button
                                                        onClick={() => setSelectedPhylogeneticProgram('FastTree')}
                                                        style={{
                                                            backgroundColor: selectedPhylogeneticProgram === 'FastTree' ? '#007bff' : 'transparent',
                                                            color: selectedPhylogeneticProgram === 'FastTree' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        FastTree
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedPhylogeneticProgram('iqtree')}
                                                        style={{
                                                            backgroundColor: selectedPhylogeneticProgram === 'iqtree' ? '#007bff' : 'transparent',
                                                            color: selectedPhylogeneticProgram === 'iqtree' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        iqtree
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedPhylogeneticProgram('raxml')}
                                                        style={{
                                                            backgroundColor: selectedPhylogeneticProgram === 'raxml' ? '#007bff' : 'transparent',
                                                            color: selectedPhylogeneticProgram === 'raxml' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        raxml
                                                    </button>
                                                </span>

                                                <p>Ancestral State Inference Program:</p>
                                                <span>
                                                    <button
                                                        onClick={() => setSelectedAncestralProgram('GRASP')}
                                                        style={{
                                                            backgroundColor: selectedAncestralProgram === 'GRASP' ? '#007bff' : 'transparent',
                                                            color: selectedAncestralProgram === 'GRASP' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        GRASP
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedAncestralProgram('iqtree')}
                                                        style={{
                                                            backgroundColor: selectedAncestralProgram === 'iqtree' ? '#007bff' : 'transparent',
                                                            color: selectedAncestralProgram === 'iqtree' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        iqtree
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedAncestralProgram('raxml-ng')}
                                                        style={{
                                                            backgroundColor: selectedAncestralProgram === 'raxml-ng' ? '#007bff' : 'transparent',
                                                            color: selectedAncestralProgram === 'raxml-ng' ? 'white' : 'black'
                                                        }}
                                                    >
                                                        raxml-ng
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "2em", marginBottom: "2em" }}>
                            <div className="bp3-form-group bp3-inline">
                                <label className="bp3-label">Job name <span className="bp3-text-muted">(optional)</span></label>
                                <div className="bp3-form-content">
                                    <div className="bp3-input-group">
                                        <input type="text" id="jobname-input" ref={jobInput} placeholder="Your job name" className="bp3-input" />
                                    </div>
                                </div>
                            </div>
                            <div className="bp3-form-group bp3-inline">
                                <label className="bp3-label">Your e-mail address </label>
                                <div className="bp3-form-content">
                                    <div className="bp3-input-group">
                                        <input type="text" id="email-input" ref={emailInput} placeholder="your@email.com" className="bp3-input" onChange={() => validateEmail(emailInput.current.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" disabled={!canSubmit} onClick={submitJob} className="bp3-button bp3-intent-primary">
                            <span className="bp3-button-text" >Submit EzSEA job</span>
                            <span icon="circle-arrow-right" className="bp3-icon bp3-icon-circle-arrow-right">
                                <svg data-icon="circle-arrow-right" width="16" height="16" viewBox="0 0 16 16">
                                    <desc>circle-arrow-right</desc>
                                    <path d="M8.71 4.29a1.003 1.003 0 00-1.42 1.42L8.59 7H5c-.55 0-1 .45-1 1s.45 1 1 1h3.59L7.3 10.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71l3-3c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71l-3-3zM8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fillRule="evenodd"></path>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;