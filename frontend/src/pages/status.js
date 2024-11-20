import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import { useParams } from 'react-router-dom';
import ConsoleLogs from '../components/consolelog';
import { useNavigate } from "react-router-dom";

const Status = () => {
    const [jobStatus, setJobStatus] = useState('Unknown');
    const logs = useRef(null);

    let navigate = useNavigate();
    const { jobId } = useParams();

    const updateStatus = (status) => {
        setJobStatus(status);
    }

    const renderButtons = () => {
        return (
            <div className="dialog-buttons" style={styles.dialogContainer}>
                <span>
                    <button type="button" className="jobqueue-button" onClick={() => navigate(`/submit`)}><span className="bp3-button-text">Submit another job</span></button>
                    <button type="button" className="results-button" disabled={!(jobStatus == "Succeeded" && jobStatus == "Completed")} onClick={() => navigate(`/results/${jobId}`)}><span className="bp3-button-text">Go to results</span></button>
                </span>
            </div>
        );
    };

    return (
        <div>
            <Navbar />
            <ConsoleLogs jobid={jobId} ref={logs} updateStatusCallback={updateStatus} />
            {renderButtons()}
        </div>
    );
};

const styles = {
    dialogContainer: {
        opacity: '1',
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100%',
        flexDirection: 'column',
        userSelect: 'none',
        width: '100%'

    }
};

export default Status;
