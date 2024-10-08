import React from 'react';
import Navbar from '../components/navbar';
import { useParams } from 'react-router-dom';

const Status = () => {
    const { jobId } = useParams();

    useEffect(() => {
        // Fetch the job status
        fetch(`/api/status/${jobId}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            });
    }, []);

    const loadingOverlay = () => {
        return (
            <div>
                <p>Loading...</p>
            </div>
        );
    };

    return (
        <div>
            <Navbar />
            <p>Job ID: <span style={{fontWeight: "bold"}}>{jobId}</span></p> 
        </div>
    );
};

export default Status;