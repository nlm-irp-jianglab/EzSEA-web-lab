import React from "react";
import '../components/about.css';
import Navbar from "../components/navbar";

const About = () => {
    return (
        <div>
            <Navbar />
            <div className="citations">
                <strong>Tools Used:</strong><br /><br />

                <div className="citation-entry">
                    Edgar, R. C. (2004). <em>MUSCLE: a multiple sequence alignment method with reduced time and space complexity.</em> BMC Bioinformatics, 5(1), 113. <a href="https://doi.org/10.1186/1471-2105-5-113" target="_blank" rel="noopener noreferrer">https://doi.org/10.1186/1471-2105-5-113</a>
                </div>

                <div className="citation-entry">
                    Foley, G., Mora, A., Ross, C. M., Bottoms, S., Sützl, L., Lamprecht, M. L., Zaugg, J., Essebier, A., Balderson, B., Newell, R., Thomson, R. E. S., Kobe, B., Barnard, R. T., Guddat, L., Schenk, G., Carsten, J., Gumulya, Y., Rost, B., Haltrich, D., … Bodén, M. (2022). <em>Engineering indel and substitution variants of diverse and ancient enzymes using Graphical Representation of Ancestral Sequence Predictions (GRASP).</em> bioRxiv, 2019.12.30.891457. <a href="https://doi.org/10.1101/2019.12.30.891457" target="_blank" rel="noopener noreferrer">https://doi.org/10.1101/2019.12.30.891457</a>
                </div>

                <div className="citation-entry">
                    Katoh, K., Misawa, K., Kuma, K., & Miyata, T. (2002). <em>MAFFT: a novel method for rapid multiple sequence alignment based on fast Fourier transform.</em> Nucleic Acids Research, 30(14), 3059–3066. <a href="https://doi.org/10.1093/nar/gkf436" target="_blank" rel="noopener noreferrer">https://doi.org/10.1093/nar/gkf436</a>
                </div>

                <div className="citation-entry">
                    Kozlov, A. M., Darriba, D., Flouri, T., Morel, B., & Stamatakis, A. (2019). <em>RAxML-NG: a fast, scalable and user-friendly tool for maximum likelihood phylogenetic inference.</em> Bioinformatics, 35(21), 4453–4455. <a href="https://doi.org/10.1093/bioinformatics/btz305" target="_blank">https://doi.org/10.1093/bioinformatics/btz305</a>
                </div>

                <div className="citation-entry">
                    Minh, B. Q., Schmidt, H. A., Chernomor, O., Schrempf, D., Woodhams, M. D., von Haeseler, A., & Lanfear, R. (2020). <em>IQ-TREE 2: New Models and Efficient Methods for Phylogenetic Inference in the Genomic Era.</em> Molecular Biology and Evolution, 37(5), 1530–1534. <a href="https://doi.org/10.1093/molbev/msaa015" target="_blank">https://doi.org/10.1093/molbev/msaa015</a>
                </div>

                <div className="citation-entry">
                    Mirdita, M., Schütze, K., Moriwaki, Y., Heo, L., Ovchinnikov, S., & Steinegger, M. (2022). <em>ColabFold: Making protein folding accessible to all.</em> Nature Methods, 19(6), 679–682. <a href="https://doi.org/10.1038/s41592-022-01488-1" target="_blank">https://doi.org/10.1038/s41592-022-01488-1</a>
                </div> 
                
                <div className="citation-entry">
                    Parks, D. H., Chuvochina, M., Chaumeil, P.-A., Rinke, C., Mussig, A. J., & Hugenholtz, P. (2020). <em>A complete domain-to-species taxonomy for Bacteria and Archaea.</em> Nature Biotechnology, 38(9), 1079–1086. <a href="https://doi.org/10.1038/s41587-020-0501-8" target="_blank">https://doi.org/10.1038/s41587-020-0501-8</a>
                </div>
                
                <div className="citation-entry">
                    Parks, D. H., Chuvochina, M., Rinke, C., Mussig, A. J., Chaumeil, P.-A., & Hugenholtz, P. (2022). <em>GTDB: an ongoing census of bacterial and archaeal diversity through a phylogenetically consistent, rank normalized and complete genome-based taxonomy.</em> Nucleic Acids Research, 50(D1), D785–D794. <a href="https://doi.org/10.1093/nar/gkab776" target="_blank">https://doi.org/10.1093/nar/gkab776</a>
                </div>
                
                <div className="citation-entry">
                    Parks, D. H., Chuvochina, M., Waite, D. W., Rinke, C., Skarshewski, A., Chaumeil, P.-A., & Hugenholtz, P. (2018). <em>A standardized bacterial taxonomy based on genome phylogeny substantially revises the tree of life.</em> Nature Biotechnology, 36(10), 996–1004. <a href="https://doi.org/10.1038/nbt.4229" target="_blank">https://doi.org/10.1038/nbt.4229</a>
                </div>
                
                <div className="citation-entry">
                    Price, M. N., Dehal, P. S., & Arkin, A. P. (2010). <em>FastTree 2 – Approximately Maximum-Likelihood Trees for Large Alignments.</em> PLOS ONE, 5(3), e9490. <a href="https://doi.org/10.1371/journal.pone.0009490" target="_blank">https://doi.org/10.1371/journal.pone.0009490</a>
                </div>
                
                <div className="citation-entry">
                    Rinke, C., Chuvochina, M., Mussig, A. J., Chaumeil, P.-A., Davín, A. A., Waite, D. W., Whitman, W. B., Parks, D. H., & Hugenholtz, P. (2021). <em>A standardized archaeal taxonomy for the Genome Taxonomy Database.</em> Nature Microbiology, 6(7), 946–959. <a href="https://doi.org/10.1038/s41564-021-00918-8" target="_blank">https://doi.org/10.1038/s41564-021-00918-8</a>
                </div>
                
                <div className="citation-entry">
                    Sievers, F., & Higgins, D. G. (2018). <em>Clustal Omega for making accurate alignments of many protein sequences.</em> Protein Science, 27(1), 135–145. <a href="https://doi.org/10.1002/pro.3290" target="_blank">https://doi.org/10.1002/pro.3290</a>
                </div>
                
                <div className="citation-entry">
                    Stamatakis, A. (2014). <em>RAxML version 8: A tool for phylogenetic analysis and post-analysis of large phylogenies.</em> Bioinformatics, 30(9), 1312–1313. <a href="https://doi.org/10.1093/bioinformatics/btu033" target="_blank">https://doi.org/10.1093/bioinformatics/btu033</a>
                </div>
                
                <div className="citation-entry">
                    Suzek, B. E., Huang, H., McGarvey, P., Mazumder, R., & Wu, C. H. (2007). <em>UniRef: Comprehensive and non-redundant UniProt reference clusters.</em> Bioinformatics, 23(10), 1282–1288. <a href="https://doi.org/10.1093/bioinformatics/btm098" target="_blank">https://doi.org/10.1093/bioinformatics/btm098</a>
                </div>
            </div>

        </div>
    );
};

export default About;