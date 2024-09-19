# Playing around with visualization tools
Phylogenetic Tree: PhyloTree.js
Protein Viewer: Molstar
Sequence Logos: Skylign

# TODO:
~Implement context menu on node click
  - Rerooting/hiding tree rerenders the tree, removing click listeners and breaking page functionality

Re-implement collapse clade function

!Adding and removing nodes results in nonscrollable logo

!Add summarize feature which exports outputs
  - Output data and svg of figures

Inherent issue with Skylign: fasta must be converted into a json object thru API.
Phylotree doesn't give enough options for rendering. Play with manual tree implementation.
Clicking on node names does not allow collapsing of clades.

~Shrink logos, maybe 200px tall?
  Worked on in test branch, buggy scaling of letters.