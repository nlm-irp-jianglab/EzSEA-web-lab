import React, { useState, useEffect } from 'react';

const ConsoleLogs = ({jobid}) => {

    const [logs, setLogs] = useState([
        'Starting process...',
        'Loading resources...',
        'Process running successfully.',
        'Fetching data...',
        'Data loaded successfully.',
        'Process completed.'
    ]);

    // Simulating log updates over time
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prevLogs => [...prevLogs, `New log entry at ${new Date().toLocaleTimeString()}`]);
        }, 3000); 

        return () => clearInterval(interval); 
    }, []);

    useEffect(() => {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = globalStyles;
        document.head.appendChild(styleTag);
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.consoleHeader}>Console Output:</div>
            <div style={styles.consoleBody}>
                {logs.map((log, index) => (
                    <div key={index} style={styles.logEntry}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Styling for the console-like output
const styles = {
    container: {
        width: '80%',
        margin: '20px auto',
        backgroundColor: '#2d2d2d',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    },
    consoleHeader: {
        backgroundColor: '#1e1e1e',
        color: '#9cdcfe',
        padding: '10px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        borderBottom: '2px solid #3a3a3a',
    },
    consoleBody: {
        padding: '10px',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        height: '400px',
        overflowY: 'scroll',
        whiteSpace: 'pre-wrap',

        /* Scrollbar styling */
        scrollbarWidth: 'thin', /* Firefox */
        scrollbarColor: '#555 #2d2d2d', /* Firefox */
    },
    logEntry: {
        marginBottom: '5px',
    }
};

// For WebKit browsers like Chrome and Safari
const globalStyles = `
    ::-webkit-scrollbar {
      width: 8px;
    }
  
    ::-webkit-scrollbar-thumb {
      background-color: #555; /* Dark thumb */
      border-radius: 10px;
    }
  
    ::-webkit-scrollbar-track {
      background-color: #2d2d2d; /* Dark background */
    }
  `;

export default ConsoleLogs;
