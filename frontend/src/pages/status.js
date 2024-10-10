import React, { useEffect, useRef } from 'react';
import Navbar from '../components/navbar';
import { useParams } from 'react-router-dom';
import ConsoleLogs from '../components/consolelog';
import { useNavigate } from "react-router-dom";

const Status = () => {
    const logs = useRef(null);

    let navigate = useNavigate();
    const { jobId } = useParams();
    console.log("Fetching id: ", jobId);
    useEffect(() => {
        // Fetch the job status
        fetch(`/api/status/${jobId}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            });
    }, []);

    const renderButtons = () => {
        if (logs.current != null && logs.current.getStatus() === "Completed") {
            return (
                <div className="dialog-buttons">
                    <button type="button" className="jobqueue-button" onClick={() => navigate(`/submit`)}><span class="bp3-button-text">Submit another job</span></button>
                    <button type="button" className="results-button" onClick={() => navigate(`/results/${location.state.jobId}`)}><span class="bp3-button-text">Go to results</span></button>
                </div>
            );
        } else {
            return (
                <div className="dialog-buttons">
                    <button type="button" className="jobqueue-button" onClick={() => navigate(`/submit`)}><span class="bp3-button-text">Submit another job</span></button>
                </div>
            );
        }
    };

    useEffect(() => {
        console.log("Current status: ", logs.current.getStatus());
    }, [logs]);


    return (
        <div>
            <Navbar />
            <ConsoleLogs jobid={jobId} ref={logs} />
            {renderButtons()}
        </div>
    );
};

export default Status;
