import React, { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from "../components/navbar";
import { Slider, Tooltip } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Button } from '@mui/material';
import { useNavigate } from "react-router-dom";
import "../components/submit.css";
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import HelpIcon from '@mui/icons-material/Help';
import Switch from '@mui/material/Switch';

const Submit = () => {
    const [inputFile, setInputFile] = useState(null);
    const [canSubmit, setCanSubmit] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(false); // Once button is clicked, submit status set to True, ensure no double submission
    const [textInput, setTextInput] = useState(false);
    const textInputRef = useRef(null);
    const [warnFasta, setWarnFasta] = useState(false);

    const emailInput = useRef(null);
    const fileInput = useRef(null);
    let navigate = useNavigate();

    const [snackbarOpen, setSnackbarOpen] = React.useState(false);

    const [numSeq, setNumSeq] = useState(500);
    const [phylogeneticProgram, setPhylogeneticProgram] = useState("veryfasttree");
    const [ancestralProgram, setAncestralProgram] = useState("iqtree");
    const [alignmentProgram, setAlignmentProgram] = useState("famsa");
    const [database, setDatabase] = useState("uniref90");
    const [minLeaves, setMinLeaves] = useState(10);
    const [conWeight, setConWeight] = useState(.01);
    const [conThreshold, setConThreshold] = useState(.85);
    const [submenu, setSubmenu] = useState(0);

    const handleInputFile = (e) => {
        const file = e.target.files[0];
        setInputFile(file);
        console.log("uploaded")
    }

    const downloadSampleFASTA = (e) => {
        e.preventDefault();
        console.log("Downloading sample FASTA file");
    }

    const downloadSamplePDB = (e) => {
        e.preventDefault();
        console.log("Downloading sample PDB file");
    }

    const verifyInputText = () => {
        const textContent = textInputRef.current.value;
        const lines = textContent.split('\n');

        if (textContent.startsWith('>')) { // Input is FASTA
            if (lines.length > 1 && lines[1].length > 20 && lines[1].length < 1001) {
                setCanSubmit(true);
                setWarnFasta(false);
            } else {
                setWarnFasta(true);
                setCanSubmit(false);
            }
        } else { // Input is PDB
            if (textContent.trim().length > 0) { // Input is PDB
                setCanSubmit(true);
                setWarnFasta(false);
            } else { // Input is empty
                setCanSubmit(false);
                setWarnFasta(false);
            }
        }
    }

    const phylogenyMenu = () => {
        return (
            <div className="submenu">
                <p>Alignment Program</p>
                <span>
                    <button className="bp3-button bp3-minimal" onClick={() => setAlignmentProgram('famsa')} style={{ backgroundColor: alignmentProgram === 'famsa' ? '#007bff' : '#eee', color: alignmentProgram === 'famsa' ? 'white' : 'black' }} >
                        FAMSA
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setAlignmentProgram('muscle')} style={{ backgroundColor: alignmentProgram === 'muscle' ? '#007bff' : '#eee', color: alignmentProgram === 'muscle' ? 'white' : 'black' }} >
                        MUSCLE
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setAlignmentProgram('mafft')} style={{ backgroundColor: alignmentProgram === 'mafft' ? '#007bff' : '#eee', color: alignmentProgram === 'mafft' ? 'white' : 'black' }} >
                        MAFFT
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setAlignmentProgram('clustalo')} style={{ backgroundColor: alignmentProgram === 'clustalo' ? '#007bff' : '#eee', color: alignmentProgram === 'clustalo' ? 'white' : 'black' }} >
                        Clustal Omega
                    </button>
                </span>
                <p>Phylogenetic Tree Program</p>
                <span>
                    <button className="bp3-button bp3-minimal" onClick={() => setPhylogeneticProgram('veryfasttree')} style={{ backgroundColor: phylogeneticProgram === 'veryfasttree' ? '#007bff' : '#eee', color: phylogeneticProgram === 'veryfasttree' ? 'white' : 'black' }} >
                        VeryFastTree
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setPhylogeneticProgram('FastTree')} style={{ backgroundColor: phylogeneticProgram === 'FastTree' ? '#007bff' : '#eee', color: phylogeneticProgram === 'FastTree' ? 'white' : 'black' }} >
                        FastTree
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setPhylogeneticProgram('iqtree')} style={{ backgroundColor: phylogeneticProgram === 'iqtree' ? '#007bff' : '#eee', color: phylogeneticProgram === 'iqtree' ? 'white' : 'black' }} >
                        IQ-TREE
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setPhylogeneticProgram('raxml')} style={{ backgroundColor: phylogeneticProgram === 'raxml' ? '#007bff' : '#eee', color: phylogeneticProgram === 'raxml' ? 'white' : 'black' }} >
                        RAxML
                    </button>
                </span>
                <p>Ancestral State Inference Program</p>
                <span>
                    <button className="bp3-button bp3-minimal" onClick={() => setAncestralProgram('iqtree')} style={{ backgroundColor: ancestralProgram === 'iqtree' ? '#007bff' : '#eee', color: ancestralProgram === 'iqtree' ? 'white' : 'black' }} >
                        IQ-TREE
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setAncestralProgram('GRASP')} style={{ backgroundColor: ancestralProgram === 'GRASP' ? '#007bff' : '#eee', color: ancestralProgram === 'GRASP' ? 'white' : 'black' }} >
                        GRASP
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setAncestralProgram('raxml-ng')} style={{ backgroundColor: ancestralProgram === 'raxml-ng' ? '#007bff' : '#eee', color: ancestralProgram === 'raxml-ng' ? 'white' : 'black' }} >
                        RAxML-NG
                    </button>
                </span>
            </div>
        );
    };

    const homologMenu = () => {
        return (
            <div className="submenu">
                <p>Database</p>
                <span>
                    <button className="bp3-button bp3-minimal" onClick={() => setDatabase('uniref100')} style={{ backgroundColor: database === 'uniref100' ? '#007bff' : '#eee', color: database === 'uniref100' ? 'white' : 'black' }} >
                        uniref100
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setDatabase('uniref90')} style={{ backgroundColor: database === 'uniref90' ? '#007bff' : '#eee', color: database === 'uniref90' ? 'white' : 'black' }} >
                        uniref90
                    </button>
                    <button className="bp3-button bp3-minimal" onClick={() => setDatabase('uniref50')} style={{ backgroundColor: database === 'uniref50' ? '#007bff' : '#eee', color: database === 'uniref50' ? 'white' : 'black' }} >
                        uniref50
                    </button>
                </span>
                <p>Number of Sequences to Retrieve</p>
                <span>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Slider
                            size="medium"
                            defaultValue={500}
                            aria-label="default"
                            valueLabelDisplay="on"
                            min={50}
                            max={2000}
                            step={10}
                            value={numSeq}
                            onChange={(e, value) => setNumSeq(value)}
                            style={{ width: '70%', marginTop: '1em' }}
                            marks={[{ value: 500, label: '500' }, { value: 1000, label: '1000' }, { value: 1500, label: '1500' }, { value: 2000, label: '2000' }]}
                        />
                    </div>
                </span>
            </div>
        );
    }

    const structPredMenu = () => {
        return (
            <div className="submenu">
                <p>Structure Prediction</p>
                <p>More Options to come soon...</p>
            </div>
        )
    }

    const delinationMenu = () => {
        return (
            <div className="submenu">
                <p>Weight of conserved residues in delination step
                    <Tooltip title="Weight of conserved residues when determining the S score of a node, 
                                    the higher weight results in less emphasis placed on the branches length" placement="top" arrow>
                        <HelpIcon sx={{ width: ".95rem" }} />
                    </Tooltip>
                </p>
                <span>
                    <Slider
                        size="medium"
                        defaultValue={.01}
                        aria-label="default"
                        valueLabelDisplay="on"
                        min={0}
                        max={0.04}
                        step={.001}
                        value={conWeight}
                        onChange={(e, value) => setConWeight(value)}
                        style={{ width: '70%', marginTop: '1.5em' }}
                        marks={[{ value: 0, label: '0' }, { value: 0.01, label: '0.01' }, { value: 0.02, label: '0.02' }, { value: 0.03, label: '0.03' }, { value: 0.04, label: '0.04' }]}
                    />
                </span>
                <p>Conservation threshold
                    <Tooltip title='A residue will be considered "conserved" and contribute to the score if its proportion in the alignment column meets or exceeds this threshold. For example, if the threshold is set to 0.85, and 86% of the residues in position X of the alignment are the same amino acid, then that position will be classified as conserved."' placement="top" arrow>
                        <HelpIcon sx={{ width: ".95rem" }} />
                    </Tooltip>
                </p>
                <span>
                    <Slider
                        size="medium"
                        defaultValue={.50}
                        aria-label="default"
                        valueLabelDisplay="on"
                        min={0}
                        max={1}
                        step={.01}
                        value={conThreshold}
                        onChange={(e, value) => setConThreshold(value)}
                        style={{ width: '70%', marginTop: '1.5em' }}
                        marks={[{ value: 0, label: '0' }, { value: 1, label: '1.0' }]}
                    />
                </span>
                <p>Minimum clade size
                    <Tooltip title="Minimum number of leaves for a clade to be considered for the delineation step" placement="top" arrow>
                        <HelpIcon sx={{ width: ".95rem" }} />
                    </Tooltip>
                </p>
                <span>
                    <Slider
                        size="medium"
                        defaultValue={10}
                        aria-label="default"
                        valueLabelDisplay="on"
                        min={1}
                        max={20}
                        step={1}
                        value={minLeaves}
                        onChange={(e, value) => setMinLeaves(value)}
                        style={{ width: '70%', marginTop: '1.5em' }}
                        marks={[{ value: 1, label: '1 leaf' }, { value: 20, label: '20 leaves' }]}
                    />
                </span>
            </div>
        )
    }

    const submenuDiv = () => {
        switch (submenu) {
            case 0:
                return homologMenu();
            case 1:
                return phylogenyMenu();
            case 2:
                return delinationMenu();
            default:
                return homologMenu();
        }
    }

    const submitJob = () => {
        setSubmitStatus(true); // Prevent double submission
        const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        const formData = new FormData();

        let inputFileToUpload = inputFile;
        let inputFileName = inputFile ? inputFile.name : '';

        if (textInput) {
            const textContent = textInputRef.current.value;
            const fileExt = textContent.startsWith('>') ? 'fasta' : 'pdb';
            inputFileName = `input.${fileExt}`;
            const blob = new Blob([textContent], { type: 'text/plain' });
            inputFileToUpload = new File([blob], inputFileName, { type: 'text/plain' });
        }

        const json = {
            "job_id": id,
            "email": emailInput.current.value,
            "input_file": inputFileToUpload,
            "input_file_name": inputFileName,
            "tree_program": phylogeneticProgram,
            "asr_program": ancestralProgram,
            "align_program": alignmentProgram,
            "num_seq": numSeq,
            "database": database,
            "min_leaves": minLeaves,
            "con_weight": conWeight
        }

        Object.keys(json).forEach(key => {
            if (key === 'input_file') {
                formData.append('input_file', inputFileToUpload);
            } else {
                formData.append(key, json[key]);
            }
        });

        // Send JSON to backend
        fetch(`${process.env.PUBLIC_URL}/api/submit`, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.status !== 200) {
                return response.json().then(data => {
                    console.log('Backend error:', data.error);
                    setSnackbarOpen(true);
                });
            } else {
                response.json().then(data => {
                    var currentdate = new Date();
                    var datetime = "" + currentdate.getDate() + "/"
                        + (currentdate.getMonth() + 1) + "/"
                        + currentdate.getFullYear() + " @ "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":"
                        + currentdate.getSeconds();

                    // Redirect to the results page
                    navigate(`/status/${id}`, {
                        state: {
                            jobId: id,
                            email: emailInput.current.value,
                            time: datetime,
                            submitError: data.error || null
                        }
                    });
                });

            }
        }).catch((error) => {
            console.error('Error:', error);
            setSnackbarOpen(true);
            setSubmitStatus(false);
        });
    }

    useEffect(() => {
        if (inputFile && !textInput) {
            setCanSubmit(true);
        } else {
            setCanSubmit(false);
        }
    }, [inputFile]);

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const clearInputs = () => {
        setInputFile(null);
        emailInput.current.value = "";
        fileInput.current.value = '';
        setNumSeq(500);
        setPhylogeneticProgram("veryfasttree");
        setAncestralProgram("iqtree");
        setAlignmentProgram("famsa");
        setDatabase("uniref90");
        setMinLeaves(10);
        setConWeight(.01);
        setConThreshold(.85);
        setSubmenu(0);
        setSubmitStatus(false);
    }

    return (
        <div style={{ flexGrow: 1 }}>
            <Navbar />
            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleSnackbarClose}>
                <Alert
                    onClose={handleSnackbarClose}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    An error occurred while attempting to submit the job. Please try again later.
                </Alert>
            </Snackbar>
            <div className="container">
                <div className="jumbotron">
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <img src={process.env.PUBLIC_URL + "/logotext_top.svg"} alt="Logo" style={{ width: "30%" }}></img>
                        <img src={process.env.PUBLIC_URL + "/tree.svg"} alt="Logo" style={{ width: "12%" }}></img>
                    </span>
                    <h1 className="ibm-plex-sans-medium">Welcome to EzSEA web!</h1>
                    <hr></hr>
                    <p>A tool that combines structure, phylogenetics, and ancestral state reconstruction to delineate an enzyme from its closest relatives and identify evolutionarily important residues.</p>
                    <span className="ibm-plex-sans-semibold">See an example of the webserver's output </span><a href={process.env.PUBLIC_URL + "/tol"}>here</a>
                    <br></br>
                    <br></br>
                    <span className="ibm-plex-sans-semibold">Please cite the following <a href="">paper</a> if you are using EzSEA for your research!</span>
                </div>
                <div className="submit-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Input Data</h2>
                    <span>
                        Upload
                        <Switch size="small" checked={textInput} onChange={() => setTextInput(!textInput)} />
                        Text Input
                    </span>
                </div>
                <div className='input-container'>
                    <div className="form-group">
                        <div>
                            {textInput ? (
                                <>
                                    <p>Please enter a FASTA or PDB sequence. </p>
                                    <Tooltip title="Please enter valid FASTA format" placement="bottom" arrow
                                        open={warnFasta}
                                        onOpen={() => setWarnFasta(true)}
                                        onClose={() => setWarnFasta(false)}
                                        disableHoverListener={true}
                                        disableFocusListener={true}
                                    >
                                        <textarea
                                            placeholder="Input Sequence"
                                            className="data-input"
                                            onChange={verifyInputText}
                                            ref={textInputRef}
                                            style={{ height: "150px", width: "100%", resize: "vertical", minHeight: "100px" }}>
                                        </textarea>
                                    </Tooltip>
                                </>
                            ) : (
                                <>
                                    <p>Please provide a FASTA or PDB file. </p>
                                    <input
                                        accept=".pdb,.fasta,.fa,.fna,.mfa,.fas,.faa,.txt"
                                        className="file-input"
                                        style={{ display: 'none' }}
                                        id="raised-button-file"
                                        type="file"
                                        onChange={handleInputFile}
                                        ref={fileInput}
                                    />
                                    <label htmlFor="raised-button-file">
                                        <Button variant="contained" component="span" className="upload-button">
                                            Upload
                                        </Button>
                                    </label>
                                    {inputFile && <span style={{ marginLeft: '10px' }}>{inputFile.name}</span>}
                                </>
                            )}
                            <p>Download example <a href="" onClick={downloadSampleFASTA}>FASTA file</a> or <a href="" onClick={downloadSamplePDB}>PDB file</a>.</p>
                        </div>
                        <div>
                            <p>Send results to email (Optional):</p>
                            <input className="email-input" type="email" ref={emailInput} />
                        </div>
                    </div>
                </div>
                <br></br>
                <div className="submit-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Job Options</h2>
                </div>
                <div className='input-container'>
                    <Tabs value={submenu} onChange={(e, value) => setSubmenu(value)} aria-label="basic tabs example" style={{ justifyContent: "center" }}
                        variant="scrollable"
                    >
                        <Tab label="Homolog" />
                        <Tab label="Phylogeny" />
                        <Tab label="Delineation" />
                    </Tabs>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {submenuDiv()}
                    </div>

                    <br></br>
                    <br></br>

                    {!canSubmit ? (
                        <Tooltip title="Provide FASTA or PDB file" placement="bottom">
                            <span>
                                <Button variant="contained" onClick={submitJob} disabled>
                                    Submit
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <span>
                            <Button variant="contained" onClick={submitJob} disabled={submitStatus}>
                                {submitStatus ? <CircularProgress size="1.5rem" /> : "Submit"}
                            </Button>
                        </span>
                    )}

                    <Button variant="outlined" onClick={() => clearInputs()} style={{ marginLeft: "1em" }}>
                        Clear All
                    </Button>
                </div>
                <br></br>
                <div className="submit-header">
                    <h2>Webserver Status: Online</h2>
                </div>
                <div>
                    <br></br>
                    <hr></hr>
                </div>
            </div>

        </div>
    );
};

export default Submit;
