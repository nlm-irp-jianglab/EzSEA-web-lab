/**
 * consolelog.js
 * Shows a console-like output of logs and status messages. Used in status page.
 */

import React, { useEffect, useRef } from 'react';

const ConsoleLogs = React.forwardRef(({ logs = [''], status = 'Unknown' }, ref) => {
    const logsEndRef = useRef(null);

    // Scroll to the bottom when new logs are added
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const getStatusStyle = () => {
        switch (status) {
            case 'Running':
                return styles.runningStatus;
            case 'Error':
            case 'Failed':
                return styles.errorStatus;
            case 'Completed':
            case 'Succeeded':
                return styles.completedStatus;
            default:
                return styles.unknownStatus;
        }
    };

    // Append custom scroll style to the document head
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
            <div style={styles.consoleHeader}>
                <div>
                    Status: <span style={getStatusStyle()}>{status}</span>
                </div>
            </div>
            <div style={styles.consoleBody}>
                {logs && logs.length > 0 && logs.map((log, index) => (
                    <div key={index} style={styles.logEntry}>
                        {log}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
});

// Styling for the console-like output
const styles = {
    container: {
        width: '70vw',
        margin: '20px auto',
        backgroundColor: '#2d2d2d',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    },
    consoleHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        color: '#9cdcfe',
        padding: '10px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        borderBottom: '2px solid #3a3a3a',
    },
    refreshButton: {
        backgroundColor: '#3a3a3a',
        color: '#9cdcfe',
        border: 'none',
        borderRadius: '3px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        transition: 'box-shadow 0.3s ease-in-out',
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
    },

    // Status Text Styling
    runningStatus: {
        color: '#00aaff',
        animation: 'pulse 1.5s infinite',
    },
    errorStatus: {
        color: '#ff4d4f',
    },
    completedStatus: {
        color: '#00ff00',
    },
    unknownStatus: {
        color: '#d4d4d4',
    },
};

// Add a glow effect when hovering over the button
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

    .refresh-button:hover {
        box-shadow: 0 0 10px rgba(0, 122, 255, 0.8); /* Blue glow */
    }

    .bp3-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
`;

export default ConsoleLogs;
