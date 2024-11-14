const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const pino = require('pino');
const emailjs = require('@emailjs/nodejs');

var app = express();
const logger = pino();
let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

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
        console.log('Email sent successfully:', response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

app.post("/submit", (req, res) => {
    // Retrieve JSON from the POST body 
    data = req.body;
    var error = null;
    logger.info("Received Job: " + data.job_id);

    const run_command = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {
            "name": data.job_id
        },
        "spec": {
            "backoffLimit": 0,
            "template": {
                "spec": {
                    "containers": [{
                        "name": "ezsea",
                        "image": "gcr.io/ncbi-research-cbb-jiang/ezsea-image:latest",
                        "args": [
                            "ezsea", "run",
                            "-i", data.sequence,
                            "--output", `/database/output/EzSEA_${data.job_id}`,
                            "--db", `/database/database/${data.database}`,
                            "-n", String(data.num_seq),
                            "--fold", "none",
                            "--treeprogram", data.tree_program,
                            "--asrprogram", data.asr_program,
                            "--alignprogram", data.align_program,
                            "--threads", "4",
                            "--ec_table", "/database/database/ec_dict.pkl",
                            "--lenweight", data.len_weight,
                            "--conweight", data.con_weight,
                        ],
                        "resources": {
                            "requests": {
                                "cpu": "8",
                                "memory": "16Gi"
                            },
                            "limits": {
                                "cpu": "8",
                                "memory": "16Gi"
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
            "name": data.job_id + "-struct"
        },
        "spec": {
            "backoffLimit": 0,
            "template": {
                "spec": {
                    "containers": [{
                        "name": "ezsea",
                        "image": "gcr.io/ncbi-research-cbb-jiang/ezsea-image:latest",
                        "args": [
                            "ezsea", "structure",
                            "-i", data.sequence,
                            "--output", `/database/output/EzSEA_${data.job_id}`,
                            "--fold", "colabfold",
                        ],
                        "resources": {
                            "requests": {
                                "nvidia.com/gpu": "1",
                                "cpu": "4",
                                "memory": "8Gi"
                            },
                            "limits": {
                                "nvidia.com/gpu": "1",
                                "cpu": "4",
                                "memory": "8Gi"
                            }
                        },
                        "volumeMounts": [{
                            "mountPath": "/database",
                            "name": "ezsea-database-volume"
                        }]
                    }],
                    "restartPolicy": "Never",
                    "nodeSelector": {
                        "cloud.google.com/gke-accelerator": "nvidia-tesla-a100",
                        "cloud.google.com/gke-accelerator-count": "1",
                    },
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

    fs.writeFile('cpu-job-config.json', JSON.stringify(run_command, null, 2), (err) => {
        if (err) {
            console.error('Error writing Kubernetes job config to file', err);
        } else {
            console.log('Kubernetes cpu job configuration saved to cpu-job-config.json');
        }
    });

    fs.writeFile('gpu-job-config.json', JSON.stringify(struct_command, null, 2), (err) => {
        if (err) {
            console.error('Error writing Kubernetes job config to file', err);
        } else {
            console.log('Kubernetes gpu job configuration saved to gpu-job-config.json');
        }
    });

    logger.info("Queuing job: " + data.job_id);

    exec("kubectl apply -f ./cpu-job-config.json", (err, stdout, stderr) => {
        if (err) {
            error = "There was a problem initializing your job, please try again later";
            console.error(err); // Pino doesn't give new lines
        } else {
            logger.info("EzSEA run job started:" + data.job_id);
        }
    });

    exec("kubectl apply -f ./gpu-job-config.json", (err, stdout, stderr) => {
        if (err) {
            error = "There was a problem initializing your job, please try again later";
            console.error(err); // Pino doesn't give new lines
        } else {
            logger.info("EzSEA structure job started:" + data.job_id);
        }
    });
    setTimeout(function () {
        res.status(200).json({ body: "Job submitted successfully", error: error });
    }, 7000);
});

app.get("/results/:id", async (req, res) => {
    const id = req.params.id;
    const folderPath = `/outputs/EzSEA_${id}/Visualization`;
    const treePath = path.join(folderPath, 'asr.tree');
    const leafPath = path.join(folderPath, 'seq_trimmed.afa');
    const ancestralPath = path.join(folderPath, 'asr.fa');
    const nodesPath = path.join(folderPath, 'nodes.json');
    const structPath = path.join(folderPath, 'seq.pdb');
    const inputPath = `/outputs/EzSEA_${id}/input.fasta`;
    const ecPath = path.join(folderPath, 'ec.json');
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
            return { ecError: "Error reading input file." };
        });

    // Run all the promises concurrently and gather the results
    const results = await Promise.allSettled([treePromise, leafPromise, ancestralPromise, nodesPromise, structPromise, inputPromise, ecPromise]);

    // Collect the resolved results into one object
    const response = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
            return { ...acc, ...result.value };
        }
        return acc;
    }, {});

    // Send response with the files that were successfully read and any error messages
    if (response['treeError'] && response['leafError'] && response['ancestralError']
        && response['nodesError'] && response['structError'] && response['inputError'] && response['ecError']) {
        return res.status(500).json({ error: "Failed to read all files." });
    } else {
        return res.status(200).json(response);
    }
});

app.get("/status/:id", (req, res) => {
    const id = req.params.id;
    const filePath = `/outputs/EzSEA_${id}/EzSEA.log`;
    logger.info("Serving status for job: " + id);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            logger.error("Error reading file:", err);
            return res.status(500).json({ error: "Error reading log file. Log generation may take a while." });
        }
        const logsArray = data.split('\n');
        var status = "Running";
        if (logsArray[logsArray.length - 2].includes("Done. Goodbye!")) {
            status = "Completed";
        } else if (logsArray[logsArray.length - 2].includes("Stopping with exit code 1.")) {
            status = "Error";
        }
        return res.status(200).json({ logs: logsArray, status: status });
    });
});

// Server listening on PORT 5000
app.listen(5000, () => {
    logger.info('Backend is listening on port 5000');
});
