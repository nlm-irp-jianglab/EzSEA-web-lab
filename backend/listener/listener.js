const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const allowOrigins = ['http://localhost:3000']


var app = express();

let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

app.post("/submit", (req, res) => {
    // Retrieve JSON from the POST body 
    data = req.body;
    console.log(data);
    // exec(`EzSEA -i ${data.sequence} 
    //             -o ${data.job_name}
    //             -d /users/jiangak_ncbi_nlm_nih_gov/database/GTDB
    //             -n 2000
    //             -f ${data.folding_program}
    //             -treeprogram ${data.tree_program}
    //             -asrprogram ${data.asr_program}
    //     `,
    exec(`docker run reactvis-ezsea-tool ezsea
        `,
        (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                res.status(503).json({ error: "Error in running EzSEA command." });
                return;
            } else {
                res.status(200).json({ body: "Job submitted successfully" });
            }
            console.log(stdout);
        });
});

// app.get("/hello", (req, res) => {
//     console.log("Recevied GET");
//     res.send({ body: "Hello World!" });
// });

// Server listening on PORT 5000
app.listen(5000, () => {
    console.log('Server is listening on port 5000');
});
