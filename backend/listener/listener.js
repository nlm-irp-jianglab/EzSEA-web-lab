const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const pino = require('pino')

var app = express();
const logger = pino();
let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));



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
            logger.info("Job COMPLETED:" + stdout);
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
    const fulfilledResults = results.filter(result => result.status === 'fulfilled');
    const response = fulfilledResults.reduce((acc, result) => {
        return { ...acc, ...result.value };
    }, {});

    // Check if any promises were fulfilled
    if (fulfilledResults.length > 0) {
        return res.status(200).json(response);
    } else {
        // If no promises were fulfilled, return a general error
        return res.status(500).json({ error: "Failed to read all files." });
    }
});

app.get("/status/:id", (req, res) => {
    const id = req.params.id;
    const filePath = `/outputs/EzSEA_${id}/EzSEA.log`;
    logger.info("Serving logs for job: " + id);

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
