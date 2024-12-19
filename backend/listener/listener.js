const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const pino = require('pino');
const emailjs = require('@emailjs/nodejs');
const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

var app = express();
const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            levelFirst: true,

        }
    },
});
let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// Monitor for job completion
function monitorJob(jobId, jobType, recipient) {
    const completionCmd = `kubectl wait --for=condition=complete job/${jobId}`;
    const failureCmd = `kubectl wait --for=condition=failed job/${jobId}`;

    const completionProcess = exec(completionCmd);
    const failureProcess = exec(failureCmd);

    let hasResponded = false;

    completionProcess.on('exit', (code) => {
        if (!hasResponded) {
            if (code === 0) {
                logger.info(`${jobType} job ${jobId} completed successfully, sending push email.`);
                hasResponded = true;
                sendEmail(recipient, jobId);
            }
        }
    });

    failureProcess.on('exit', (code) => {
        if (!hasResponded) {
            if (code === 0) {
                logger.error(`${jobType} job ${jobId} failed.`);
                hasResponded = true;
                // Handle failure case
            }
        }
    });
}

const sendEmail = async (recipient, jobId) => {
    try {
        const response = await emailjs.send("service_key", "template_key", {
            recipient: recipient,
            jobId: jobId,
        },
            {
                publicKey: "PUBLIC_KEY",
                privateKey: "PRIVATE_KEY",
            });
        logger.info('Email sent successfully:', response);
    } catch (error) {
        logger.info("Error sending email:", error);
    }
};

app.post("/submit", (req, res) => {
    // Retrieve JSON from the POST body 
    data = req.body;
    var error = null;
    var job_id = null;
    var input_file = null;
    var database = null;
    var num_seq = null;
    var tree_program = null;
    var asr_program = null;
    var align_program = null;
    var len_weight = null;
    var con_weight = null;
    var email = null;

    try {
        ({ job_id, input_file, database, num_seq, tree_program, asr_program, align_program, len_weight, con_weight, email } = data);
    } catch (err) {
        logger.error("Error parsing JSON:", err);
        return res.status(400).json({ error: "There was an error parsing your request. Please ensure all fields are filled out." });
    }
    logger.info("Received Job: " + job_id);

    // Get file type of input_file (.pdb, .fasta, etc.)
    const fileTypeMatch = input_file.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    if (!fileTypeMatch) {
        return res.status(400).json({ error: "Invalid file type. Only .pdb, .fasta, or .fa files are allowed." });
    }
    const fileType = fileTypeMatch[1];

    // Write the input file to tmp disk
    fs.writeFile(`/outputs/input/${job_id}.${fileType}`, input_file, (err) => {
        if (err) {
            logger.error("Error writing input file:", err);
            return res.status(500).json({ error: "Error writing input file." });
        }
    });

    const run_command = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {
            "name": job_id
        },
        "spec": {
            "backoffLimit": 0,
            "template": {
                "metadata": {
                    "labels": {
                        "id": job_id,
                        "type": "run"
                    }
                },
                "spec": {
                    "containers": [{
                        "name": "ezsea",
                        "image": "us-central1-docker.pkg.dev/ncbi-research-cbb-jiang/ezsea/ezsea-image:latest",
                        "args": [
                            "ezsea", "run",
                            "-i", data.sequence,
                            "--output", `/database/output/EzSEA_${job_id}`,
                            "--db", `/database/database/${database}`,
                            "-n", String(num_seq),
                            "--fold", "none",
                            "--treeprogram", tree_program,
                            "--asrprogram", asr_program,
                            "--alignprogram", align_program,
                            "--threads", "4",
                            "--ec_table", "/database/database/ec_dict.pkl",
                            "--lenweight", String(len_weight),
                            "--conweight", String(con_weight),
                        ],
                        "resources": {
                            "requests": {
                                "cpu": "8",
                                "memory": "16Gi"
                            },
                            "limits": {
                                "cpu": "8",
                                "memory": "32Gi"
                            }
                        },
                        "volumeMounts": [{
                            "mountPath": "/database",
                            "name": "ezsea-database-volume"
                        }]
                    }],
                    "restartPolicy": "Never",
                    "volumes": [{
                        "name": "ezsea-database-volume",
                        "persistentVolumeClaim": {
                            "claimName": "ezsea-filestore-pvc"
                        }
                    }]
                }
            }
        }
    };

    const struct_command = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {
            "name": job_id + "-struct"
        },
        "spec": {
            "backoffLimit": 0,
            "template": {
                "metadata": {
                    "labels": {
                        "id": job_id,
                        "type": "structure"
                    }
                },
                "spec": {
                    "containers": [{
                        "name": "ezsea",
                        "image": "biochunan/esmfold-image:latest",
                        "command": ["/bin/zsh", "-c"],
                        "args": [
                            "mkdir -p /database/output/EzSEA_" + job_id + "/ && echo \"" + data.sequence + "\" > /database/output/EzSEA_" + job_id
                            + "/esm.fasta && ./run-esm-fold.sh -i /database/output/EzSEA_" + job_id
                            + "/esm.fasta --pdb /database/output/EzSEA_" + job_id + "/Visualization/"
                        ],
                        "resources": {
                            "requests": {
                                "nvidia.com/gpu": "1",
                                "cpu": "4",
                                "memory": "32Gi"
                            },
                            "limits": {
                                "nvidia.com/gpu": "1",
                                "cpu": "4",
                                "memory": "32Gi"
                            }
                        },
                        "volumeMounts": [{
                            "mountPath": "/database",
                            "name": "ezsea-databases-volume"
                        }]
                    }],
                    "restartPolicy": "Never",
                    "nodeSelector": {
                        "cloud.google.com/gke-accelerator": "nvidia-tesla-a100",
                        "cloud.google.com/gke-accelerator-count": "1"
                    },
                    "volumes": [{
                        "name": "ezsea-databases-volume",
                        "persistentVolumeClaim": {
                            "claimName": "ezsea-filestore-pvc"
                        }
                    }]
                }
            }
        }
    };

    fs.writeFile('cpu-job-config.json', JSON.stringify(run_command, null, 2), (err) => {
        if (err) {
            console.error('Error writing Kubernetes job config to file', err);
        }
    });

    fs.writeFile('gpu-job-config.json', JSON.stringify(struct_command, null, 2), (err) => {
        if (err) {
            console.error('Error writing Kubernetes job config to file', err);
        }
    });

    logger.info("Queuing job: " + job_id);

    // Forgoing k8sapi.createNamespacedPod, running into issues with proper formatting 

    // exec("kubectl apply -f ./cpu-job-config.json", (err, stdout, stderr) => {
    //     if (err) {
    //         error = "There was a problem initializing your job, please try again later";
    //         console.error(err); // Pino doesn't give new lines
    //     } else {
    //         logger.info("EzSEA run job started:" + job_id);
    //         monitorJob(job_id, "CPU", data.email);
    //     }
    // });

    // exec("kubectl apply -f ./gpu-job-config.json", (err, stdout, stderr) => {
    //     if (err) {
    //         error = "There was a problem initializing your job, please try again later";
    //         console.error(err); // Pino doesn't give new lines
    //     } else {
    //         logger.info("EzSEA structure job started:" + job_id);
    //         //monitorJob(job_id + "-struct", "GPU");
    //     }
    // });

    setTimeout(function () {
        res.status(200).json({ body: "Job submitted successfully", error: error });
    }, 3000);
});

app.get("/results/:id", async (req, res) => {
    const id = req.params.id;
    const folderPath = `/outputs/EzSEA_${id}/Visualization`;
    const treePath = path.join(folderPath, 'asr.tree');
    const leafPath = path.join(folderPath, 'seq_trimmed.afa');
    const ancestralPath = path.join(folderPath, 'asr.fa');
    const nodesPath = path.join(folderPath, 'nodes.json');
    try {
        var pdbFiles = fs.readdirSync(folderPath).filter(fn => fn.endsWith('.pdb')); // Returns an array of pdb files
    } catch (e) {
        logger.error("Error reading pdb files: " + e);
        return res.status(500).json({ structError: "Attempted to find pdb files. Does Visualization/ exist?" });
    }

    const structPath = path.join(folderPath, pdbFiles[0]);
    const inputPath = `/outputs/EzSEA_${id}/input.fasta`;
    const ecPath = path.join(folderPath, 'ec.json');
    const asrPath = path.join(folderPath, 'seq.state.zst');

    logger.info("Serving results for job: " + id);

    // Read the files
    const treePromise = fs.promises.readFile(treePath, 'utf8')
        .then(data => ({ tree: data }))
        .catch(err => {
            logger.error("Error reading tree file: " + err);
            return { treeError: "Error reading tree file." };
        });

    const leafPromise = fs.promises.readFile(leafPath, 'utf8')
        .then(data => ({ leaf: data }))
        .catch(err => {
            logger.error("Error reading leaf file: " + err);
            return { leafError: "Error reading leaf file." };
        });

    const ancestralPromise = fs.promises.readFile(ancestralPath, 'utf8')
        .then(data => ({ ancestral: data }))
        .catch(err => {
            logger.error("Error reading ancestral file: " + err);
            return { ancestralError: "Error reading ancestral file." };
        });

    const nodesPromise = fs.promises.readFile(nodesPath, 'utf8')
        .then(data => ({ nodes: data }))
        .catch(err => {
            logger.error("Error reading nodes file: " + err);
            return { nodesError: "Error reading nodes file." };
        });

    const structPromise = fs.promises.readFile(structPath, 'utf8')
        .then(data => ({ struct: data }))
        .catch(err => {
            logger.error("Error reading struct file: " + err);
            return { structError: "Error reading struct file." };
        });

    const inputPromise = fs.promises.readFile(inputPath, 'utf8')
        .then(data => ({ input: data }))
        .catch(err => {
            logger.error("Error reading input file: " + err);
            return { inputError: "Error reading input file." };
        });

    const ecPromise = fs.promises.readFile(ecPath, 'utf8')
        .then(data => ({ ec: data }))
        .catch(err => {
            logger.error("Error reading ec file: " + err);
            return { ecError: "Error reading ec file." };
        });

    const asrPromise = fs.promises.readFile(asrPath)
        .then(data => ({ asr: data }))
        .catch(err => {
            logger.error("Error reading asr probability file: " + err);
            return { asrError: "Error reading asr probability file." };
        });

    // Run all the promises concurrently and gather the results
    const results = await Promise.allSettled([treePromise, leafPromise, ancestralPromise, nodesPromise, structPromise, inputPromise, ecPromise, asrPromise]);

    // Collect the resolved results into one object
    const response = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
            return { ...acc, ...result.value };
        }
        return acc;
    }, {});

    // Send response with the files that were successfully read and any error messages
    if (response['treeError'] && response['leafError'] && response['ancestralError']
        && response['nodesError'] && response['structError'] && response['inputError']
        && response['ecError'] && response['asrError']) {
        return res.status(500).json({ error: "Failed to read all files." });
    } else {
        return res.status(200).json(response);
    }
});

app.get("/status/:id", (req, res) => {
    const id = req.params.id;
    const filePath = `/outputs/EzSEA_${id}/EzSEA.log`;
    logger.info("Serving status for job: " + id);
    try {
        k8sApi.listNamespacedPod('default', undefined, undefined, undefined, undefined, `id=${id},type=run`).then((podsRes) => {
            if (podsRes.body.items.length < 1) { // Kubectl no longer tracking job or job not present
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        logger.error(`Error reading log file for job ${id}, does it exist?`);
                        return res.status(500).json({ error: "There was an error reading the log file. Please ensure your job ID is correct." });
                    }
                    const logsArray = data.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
                    let status = "Unknown"; // Default status

                    // Dynamically check for status based on the last line of logs
                    if (logsArray.length > 0) {
                        const lastLine = logsArray[logsArray.length - 1];
                        if (/Error|failed|Stopping/i.test(lastLine)) {
                            status = "Error"; // Check for error keywords
                        } else if (/completed|success|Done/i.test(lastLine)) {
                            status = "Completed"; // Check for successful completion
                        } else {
                            status = "Unknown"; // If none of the above conditions match
                        }
                    } else {
                        status = "Empty"; // No logs in the file
                    }

                    return res.status(200).json({ logs: logsArray, status: status }); // Possibly missing cases here
                });
                return;
            } else { // Job is still running / being tracked by kubectl
                const pod = podsRes.body.items[0];
                const status = pod.status.phase.trim();

                // Check container statuses for more detailed information
                if (status === "Pending" && pod.status.containerStatuses) {
                    const containerStatus = pod.status.containerStatuses[0];
                    if (containerStatus.state.waiting && containerStatus.state.waiting.reason === "ContainerCreating") {
                        status = "ContainersCreating";
                    }
                }

                if (status === "Pending") {
                    if (pod.status.containerStatuses) {
                        return res.status(200).json({ logs: ["Resources allocated, building compute environment"], status: pod.status.containerStatuses });
                    } else {
                        return res.status(200).json({ logs: ["Allocating resources for job, this may take a few minutes."], status: status });
                    }
                } else { // status is Running, Succeeded, Failed, or Unknown
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
                            if (status === "Running") {
                                return res.status(200).json({ logs: ['Generating logs...'], status: status })
                            } else {
                                logger.error("Error reading file:", err);
                                return res.status(500).json({ error: "No log file was found for this job." });
                            }
                        }
                        const logsArray = data.split('\n');
                        return res.status(200).json({ logs: logsArray, status: status });
                    });
                }
            }


        });
    } catch (err) {
        logger.error("Error getting GKE logs:", err);
        return res.status(500).json({ error: "There was a backend error. Please try again later." });
    }

    // Query kubectl pods for job status 
    // `kubectl get pods -l id=${id},type=run --no-headers -o custom-columns=":status.phase"`
});

// Server listening on PORT 5000
app.listen(5000, () => {
    logger.info('Backend is listening on port 5000');
});
