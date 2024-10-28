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

    const command = `docker run --gpus all \
          --mount type=bind,source=/home/zhaoj16_ncbi_nlm_nih_gov/EzSEA/,target=/data \
          --mount type=bind,source=/home/jiangak_ncbi_nlm_nih_gov/database/,target=/database \
          ezsea ezsea -i "${data.sequence}" --output "/data/EzSEA_${data.job_id}" -d "/database/GTDB" \
          -n ${data.num_seq} -f "${data.folding_program}" --treeprogram "${data.tree_program}" \
          --asrprogram "${data.asr_program}" --alignprogram "${data.align_program}" --threads 4\
          `;
    logger.info("Running: " + command);
    exec(command, (err, stdout, stderr) => {
        if (err) {
            error = "There was a problem initializing your job, please try again later";
            console.error(err); // Pino doesn't give new lines
        } else {
            logger.info("Job COMPLETED:" + data.job_id);
            if (data.email) {
                sendEmail(data.email, data.job_id);
            }
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

    // Run all the promises concurrently and gather the results
    const results = await Promise.allSettled([treePromise, leafPromise, ancestralPromise, nodesPromise, structPromise]);

    // Collect the resolved results into one object
    const response = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
            return { ...acc, ...result.value };
        }
        return acc;
    }, {});

    // Send response with the files that were successfully read and any error messages
    if (response['treeError'] && response['leafError'] && response['ancestralError'] && response['nodesError'] && response['structError']) {
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
            return res.status(500).json({ error: "Error reading log file. Please ensure you job ID is correct." });
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
