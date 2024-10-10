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
    
    useEffect(() => {
        // Fetch the job status
        fetch(`/api/status/${jobId}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            }).catch(error => {
                console.error('Error fetching logs for id:', jobId, '\nError: ', error);
            });
    }, []);

    const updateStatus = (status) => {
        setJobStatus(status);
    }

    const renderButtons = () => {
        return (
            <div className="dialog-buttons">
                <button type="button" className="jobqueue-button" onClick={() => navigate(`/submit`)}><span className="bp3-button-text">Submit another job</span></button>
                <button type="button" className="results-button" disabled={!(jobStatus == "Completed")} onClick={() => navigate(`/results/${location.state.jobId}`)}><span className="bp3-button-text">Go to results</span></button>
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

export default Status;
