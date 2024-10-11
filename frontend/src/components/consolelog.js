import React, { useState, useEffect, useRef } from 'react';

const ConsoleLogs = React.forwardRef(({ jobid, updateStatusCallback }, ref) => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState(['']);
    const [jobStatus, setJobStatus] = useState('Unknown');
    const logsEndRef = useRef(null); // Reference to the end of the logs

    // Function to fetch logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/status/${jobid}`);
            const data = await response.json();
            if (response.status == 200) {
                setLogs(data.logs);
                setJobStatus(data.status);
                updateStatusCallback(data.status);
            } else {
                setLogs([`${data.error}`]);
            }

            setTimeout(() => {
                setLoading(false);
            }, 1000);
        } catch (error) {
            setLogs(['Error: Failed to fetch logs for job']);
            setJobStatus('Unknown')
            updateStatusCallback('Unknown');
            setLoading(false);
        }
    };

    // Scroll to the bottom when new logs are added
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]); // This effect runs whenever the logs array changes

    // Fetch logs on initial render and on interval
    useEffect(() => {
        fetchLogs();

        // Fetch logs every 20 seconds
        const interval = setInterval(() => {
            fetchLogs();
        }, 20000);

        return () => clearInterval(interval);
    }, [jobid]);

    const getStatusStyle = () => {
        switch (jobStatus) {
            case 'Running':
                return styles.runningStatus;
            case 'Error':
                return styles.errorStatus;
            case 'Completed':
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
                    Job: {jobid} |
                    Status: <span style={getStatusStyle()}>{jobStatus}</span>
                </div>
                <button onClick={fetchLogs} className="refresh-button" style={styles.refreshButton} disabled={loading}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        width="24"
                        height="24"
                        style={loading ? { animation: "spin 1s linear infinite" } : {}}
                    >
                        <path d="M3.13644 9.54175C3.02923 9.94185 3.26667 10.3531 3.66676 10.4603C4.06687 10.5675 4.47812 10.3301 4.58533 9.92998C5.04109 8.22904 6.04538 6.72602 7.44243 5.65403C8.83948 4.58203 10.5512 4.00098 12.3122 4.00098C14.0731 4.00098 15.7848 4.58203 17.1819 5.65403C18.3999 6.58866 19.3194 7.85095 19.8371 9.28639L18.162 8.34314C17.801 8.1399 17.3437 8.26774 17.1405 8.62867C16.9372 8.98959 17.0651 9.44694 17.426 9.65017L20.5067 11.3849C20.68 11.4825 20.885 11.5072 21.0766 11.4537C21.2682 11.4001 21.4306 11.2727 21.5282 11.0993L23.2629 8.01828C23.4661 7.65734 23.3382 7.2 22.9773 6.99679C22.6163 6.79358 22.159 6.92145 21.9558 7.28239L21.195 8.63372C20.5715 6.98861 19.5007 5.54258 18.095 4.464C16.436 3.19099 14.4033 2.50098 12.3122 2.50098C10.221 2.50098 8.1883 3.19099 6.52928 4.464C4.87027 5.737 3.67766 7.52186 3.13644 9.54175Z" />
                        <path d="M21.4906 14.4582C21.5978 14.0581 21.3604 13.6469 20.9603 13.5397C20.5602 13.4325 20.1489 13.6699 20.0417 14.07C19.5859 15.7709 18.5816 17.274 17.1846 18.346C15.7875 19.418 14.0758 19.999 12.3149 19.999C10.5539 19.999 8.84219 19.418 7.44514 18.346C6.2292 17.4129 5.31079 16.1534 4.79261 14.721L6.45529 15.6573C6.81622 15.8605 7.27356 15.7327 7.47679 15.3718C7.68003 15.0108 7.55219 14.5535 7.19127 14.3502L4.11056 12.6155C3.93723 12.5179 3.73222 12.4932 3.54065 12.5467C3.34907 12.6003 3.18662 12.7278 3.08903 12.9011L1.3544 15.9821C1.15119 16.3431 1.27906 16.8004 1.64 17.0036C2.00094 17.2068 2.45828 17.079 2.66149 16.718L3.42822 15.3562C4.05115 17.0054 5.12348 18.4552 6.532 19.536C8.19102 20.809 10.2237 21.499 12.3149 21.499C14.406 21.499 16.4387 20.809 18.0977 19.536C19.7568 18.263 20.9494 16.4781 21.4906 14.4582Z" />
                    </svg>
                </button>
            </div>
            <div style={styles.consoleBody}>
                {logs && logs.length > 0 && logs.map((log, index) => (
                    <div key={index} style={styles.logEntry}>
                        {log}
                    </div>
                ))}
                {/* The div used to scroll to the bottom */}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
});

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
