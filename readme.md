# EzSEA Web Visualization Tool
A web-based visualization tool for exploring and analyzing sequence evolution data. This project consists of a React frontend that provides interactive visualizations using Tree3 and MolStar components.

# Project Structure
```
reactvis/
├── frontend/      # React frontend application
├── backend/       # Node.js backend server
└── proxy/         # Nginx proxy configuration
```

## Development Setup
This section will explain how to run the development environment for the frontend. Backend and proxy functionality is not required. 

1. Navigate to the frontend directory:
```
cd reactvis/frontend
```

2. Install dependencies
```
npm i
```

3. Start the development server
```
npm start
```

This will run the app in development mode. Open http://localhost:3000/ezsea to view it in your browser. The page will automatically reload when you make changes.

# Production Deployment
To deploy the full stack application:

1. Build and start all services using Docker Compose:
```
docker-compose up --build
```

This will:

- Build and serve the frontend at port 443 (HTTPS)
- Start the backend server at port 5000
- Configure the proxy server at port 80

# Prerequisites
+ biopython
+ treeswift
+ muscle
+ goalign
+ seqtk
+ diamond
+ cd-hit
+ zstandard

The supported MSA tools are:
+ MAFFT
+ FAMSA
+ MUSCLE

The supported tree inference tools are:
+ Veryfasttree
+ fasttree
+ iqtree
+ raxml-ng

The supported ancestral state reconstruction tools are:
+ raxml-ng
+ iqtree
+ GRASP

Folding tools supported on the web server:
+ ESMfold
+ fpocket
