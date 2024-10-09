const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');

var app = express();

let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

app.post("/submit", (req, res) => {
    // Retrieve JSON from the POST body 
    data = req.body;
    var error = null;
    console.log(data);
    exec(`docker run --gpus all \
          --mount type=bind,source=/home/zhaoj16_ncbi_nlm_nih_gov/EzSEA/,target=/data \
          --mount type=bind,source=/home/jiangak_ncbi_nlm_nih_gov/database/,target=/database \
          ezsea -i "${data.sequence}" --output "/data/${data.job_name}" -d "/database/GTDB" -n 1000 -f "${data.folding_program}" --treeprogram "${data.tree_program}" --asrprogram "${data.asr_program}"
        `,    
    (err, stdout, stderr) => {
            if (err) {
		error = "There was a problem initializing your job, please try again later";
                console.error(err);
            } else {
                console.log("Job COMPLETED:", stdout);
            }
    });
    setTimeout(function () {
	res.status(200).json({ body: "Job submitted successfully", error: error });
    }, 7000);
});

app.get("/results/:id/:", (req, res) => {
    const id = req.params.id;
    /* 
        Returns data of query:
        - Aligned FA of leaves
        - Aligned FA of internal nodes
        - Newick tree
        - Node.json info
        - Structure PDB
    */
    res.status(200).json(data);
});

app.get("/status/:id", (req, res) => {
    const id = req.params.id;
    /* 
        Returns status of query:
        - Running
        - Completed
        - Error
    */
    res.status(200).json({ status: "Unknown" });
});

// Server listening on PORT 5000
app.listen(5000, () => {
    console.log('Backend is listening on port 5000');
});
