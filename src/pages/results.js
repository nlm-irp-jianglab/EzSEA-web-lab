import React from 'react';
import Navbar from '../components/navbar';
import { useParams } from 'react-router-dom';

const Results = () => {
    const { jobId } = useParams();

    return (
        <div>
            <Navbar />
            <p>Job ID: <span style={{fontWeight: "bold"}}>{jobId}</span>. Status: Unknown</p> 
        </div>
    );
};

export default Results;