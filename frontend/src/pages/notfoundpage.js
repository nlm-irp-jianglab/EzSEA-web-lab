import React from 'react';
import Navbar from '../components/navbar';

const NotFoundPage = () => {
    return (
        <div style={{flexGrow: 1}}>
            <Navbar />
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
        </div>
    );
};

export default NotFoundPage;