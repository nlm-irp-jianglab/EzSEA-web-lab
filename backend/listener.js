const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const allowOrigins = ['http://localhost:3000']


var app = express();

let data = null;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowOrigins.indexOf(origin) === -1) {
            console.log(origin)
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.post("/submit", (req, res) => {
    // Retrieve JSON from the POST body 
    data = req.body;
    console.log(data);
    exec(`EzSEA -i ${data.sequence} 
                -o ${data.job_name}
                -d /users/jiangak_ncbi_nlm_nih_gov/database/GTDB
                -n 2000
                -f ${data.folding_program}
                -treeprogram ${data.tree_program}
                -asrprogram ${data.asr_program}
        `, 
        (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
        });
});

app.get("/hello", (req, res) => {
    res.send("Hello World!");
});

// Server listening on PORT 5000
app.listen(5000, () => {
    console.log('Server is listening on port 5000');
});
