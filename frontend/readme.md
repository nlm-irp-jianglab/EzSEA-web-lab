# Playing around with visualization tools
Phylogenetic Tree: PhyloTree.js
Protein Viewer: Molstar
Sequence Logos: Skylign

# TODO:
Polish submit page
  - Add transitions
  - Add style

Re-implement collapse clade function

!Add summarize feature which exports outputs
  - Output data and svg of figures

When deploying to gh-pages, add
  "homepage": "https://littlelegz.github.io/reactvis", 
to line 3-4 of package.json

!Dockerize backend!

## Docker Setup
`
docker build -t zhaoj16/reactvis-docker:latest .
docker run -p 3000:443 zhaoj16/rectvis-docker:latest
`