Backend

A listener handles post and get requests from the frontend. 
The routes are:
1. submit - returns 200 if job is submitted successfully
2. results - returns the result folder, Visualization/, for a given jobID
3. status - returns the current status of a job by querying kubectl

An important function implemented here is email push notifications on job completion/failure. This is done using the emailJS service. 