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

    const toSubmit = () => {
        navigate("/");
    };

    const toStatus = () => {
        navigate(`/status/${location.state.jobId}`);
    }

    const rootMsg = () => {
        if (error) {
            return (
                <div className="dialog-container">
                    <p>{error}</p>
                    <div className="dialog-buttons">
                        <button type="button" class="jobqueue-button" onClick={() => toSubmit()}><span class="bp3-button-text">Submit another job</span></button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="dialog-container">
                    <p>Job ID: <span style={{ fontWeight: "bold" }}>{location.state.jobId}</span> queued on: <span style={{ fontWeight: "bold" }}>{location.state.time}</span> </p>
                    <img src={process.env.PUBLIC_URL + "/ezsea_logo.svg"} alt="Logo" style={{ width: "15%", marginBottom: "1em" }}></img>
                    {location.state.email && <p>Completion notification will be sent via Email to: <span style={{ fontWeight: "bold" }}>{location.state.email}</span></p>}
                    <div className="dialog-buttons">
                        <button type="button" class="jobqueue-button" onClick={() => toSubmit()}><span class="bp3-button-text">Submit another job</span></button>
                        <button type="button" class="results-button" onClick={() => toStatus()}><span class="bp3-button-text">Go to status page</span></button>
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
