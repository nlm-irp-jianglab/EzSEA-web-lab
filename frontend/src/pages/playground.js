import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from "../components/navbar";
import "../components/playground.css";
import Switch from '@mui/material/Switch';
import { Slider, Tooltip } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Button } from '@mui/material';
import { useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Playground = () => {
    const [jobStatus, setJobStatus] = useState('tree');
    const [logs, setLogs] = useState(['']);
    const { jobId } = useParams();
    const statusList = ['done', 'annot', 'delineation', 'tree', 'trim', 'align', 'db', 'container', 'alloc'];
    const statusMsg = ['Clean and finish', 'Retrieving annotations', 'Calculating delineation',
        'Building tree', 'Trimming sequences', 'Performing alignment', 'Querying database',
        'Building compute environment', 'Allocating resources'];

    // Function to fetch logs
    const fetchLogs = async () => {
        try {
            const response = await fetch(`/api/status/${jobId}`);
            const data = await response.json();
            if (response.status == 200) {
                setLogs(data.logs);
                setJobStatus(data.status);
            } else {
                setLogs([`${data.error}`]);
            }

            setTimeout(() => {
            }, 1000);
        } catch (error) {
            setLogs(['Error: Failed to fetch logs for job']);
            setJobStatus('Unknown')
        }
    };

    useEffect(() => {
        fetchLogs();

        // Fetch logs every 20 seconds
        const interval = setInterval(() => {
            fetchLogs();
        }, 20000);

        return () => clearInterval(interval);
    }, [jobId]);

    const renderStatusLoading = () => {
        let foundMatchedStatus = false;
        const spans = statusList.map((status, index) => {
            if (status === 'align') {
                foundMatchedStatus = true;
            }
            return (
                <span key={index} className="processing-list-item">
                    {foundMatchedStatus ? <CheckCircleIcon sx={{color: "green"}}/> : <CircularProgress size="1.5rem"/>}
                    {statusMsg[index]}
                </span>
            );
        });
        return spans.reverse();
    };


    return (
        <div style={{ flexGrow: 1 }}>
            <Navbar pageId={"WIP Status"} />
            <div className="processing-container">
                <div>
                    <h1>Job Processing...</h1>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-evenly" }}>
                    <div className="processing-logo">
                        <img src={process.env.PUBLIC_URL + "/tree.svg"} alt="Logo" style={{ width: "90%" }}></img>
                    </div>
                    <div className="processing-list">
                        {renderStatusLoading()}
                    </div>
                </div>
                <hr></hr>
                <div>
                    <p>Job ID: </p>
                    <p>Notification will be sent to: </p>
                    <p>Results will display on this page when ready, or you can bookmark the link below and close this page:</p>
                    <a href={`/results/${jobId}`}>link</a>
                </div>
            </div>

        </div>
    );
};

export default Playground;
