# Visualization tools
Phylogenetic Tree: tree3-react
Protein Viewer: Mol*
Sequence Logos: LogoJS

# TODO:
Downloaded node.json is parsed into a dict, not a json object, therefore it cannot be directly used as in the example page. However, EzSEA-web-lab expects the dict format.

Pages:
1. results.js (and it's sister page, tol)
2. submit.js - Sends requests to backend for queuing jobs
3. status.js - Sends timed requests to backend to query status of job. Will automatically redirect to the results page on success of job.
4. about.js
5. help.js

Components:
1. logo-stack.js - generates a group of sequence logo svgs
2. molstar.js - a react component containing the molstar viewer

Note to future maintainers:
Start at index.js. This file contains the react router. 