import React from 'react';
import Navbar from '../components/navbar';
import { useLocation } from 'react-router-dom';
import '../components/jobqueued.css';
import Loading from '../components/loading';
import { useNavigate } from "react-router-dom";

const JobQueued = () => {
    let navigate = useNavigate();
    const location = useLocation();
    const error = location.state.error;

    console.log(location);

    const toSubmit = () => {
        navigate("/submit");
    };

    const toResults = () => {
        navigate(`/results/${location.state.jobId}`);
    }

    const rootMsg = () => {
        if (error) {
            return (
                <div className="dialog-container">
                    <p>{error}</p>
                    <button type="button" class="jobqueue-button" onClick={() => toSubmit()}><span class="bp3-button-text">Submit another job</span></button>
                </div>
            );
        } else {
            return (
                <div className="dialog-container">
                    <p>Job ID: <span style={{ fontWeight: "bold" }}>{location.state.jobId}</span> queued on: <span style={{ fontWeight: "bold" }}>{location.state.time}</span> </p>
                    <Loading />
                    {location.state.email && <p>Completion notification will be sent via Email to: <span style={{ fontWeight: "bold" }}>{location.state.email}</span></p>}
                    <div className="dialog-buttons">
                        <button type="button" class="jobqueue-button" onClick={() => toSubmit()}><span class="bp3-button-text">Submit another job</span></button>
                        <button type="button" class="results-button" onClick={() => toResults()}><span class="bp3-button-text">Go to results page</span></button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div>
            <Navbar />
            {rootMsg()}
        </div>
    );
};

export default JobQueued;