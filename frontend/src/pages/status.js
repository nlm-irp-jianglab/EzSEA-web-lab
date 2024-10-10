import React, { useEffect } from 'react';
import Navbar from '../components/navbar';
import { useParams } from 'react-router-dom';
import ConsoleLogs from '../components/consolelog';

const Status = () => {
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

    return (
        <div>
            <Navbar />
            <ConsoleLogs jobid={jobId} />
        </div>
    );
};

export default Status;
