import React from "react";
import Navbar from "../components/navbar";
import "../components/help.css";
import "../components/submit.css";

const Help = () => {
    return (
        <div style={{ flexGrow: 1 }}>
            <Navbar />
            <div className="container">
                <div className="jumbotron">
                    <h1 className="ibm-plex-sans-medium">EzSEA Documentation</h1>
                    <hr />
                    <p>
                        Welcome to the <b>EzSEA Documentation</b>. This page provides guidance on how to use the EzSEA web server and explains the parameters.
                    </p>
                </div>
                <div className="submit-header">
                    <h2>Workflow</h2>
                </div>
                <div className="help-content">
                <img src={process.env.PUBLIC_URL + "/workflow.png"} alt="delineation" style={{ width: "100%" }}></img>
                </div>

                <div className="submit-header">
                    <h2>Getting Started</h2>
                </div>
                <div className="help-content">
                <img src={process.env.PUBLIC_URL + "/help_input.png"} alt="delineation" style={{ width: "40%" }}></img>
                    <p>
                        EzSEA accepts <b>FASTA</b> or <b>PDB</b> files. The FASTA file should have a single valid header and amino acid sequence. If only a FASTA is provided, EzSEA will predict the 3D structure using ESMfold. You can download example files for a test run.
                    </p>
                    <p>Example FASTA file:</p>
                    <pre>
                        <code>
                            {`>BilR
MRLLEPIKVGKIELKNRVMFPPMTTGYEGRDGTIVEQSFNFYKRLAEGGVSYIVLGDVAP
VNTISPTPKLFHDGQIEAFRKLADAVHEFDCKLGIQIFHPEYDVEALAELFRKGDMEGGR
AKMRHDMVHFIQEVTEEQLNSILDKIGECVKRAQSAGVDIIEVHGDRLIGSFCSTLINRR
TDSYGGSFENRIRFALRVVDKIREVAPDICIDYKLPVVTENPLRGKGGLMINEAVEFAKI
LERSGVDMIHVGQANHTGNMNDTIPAMGTQPYCFMSKYTKQIKEAVSIPVSSVGRIVTPE
NAEALIENGVCDIVGLGRSLLADPDYVKKLEAGEGRRIRHCMMCNKGCTDAIQNRKFLSC
VLNAENGYEYERTITPSDEKKKVVVIGGGVAGMEAARVASVKGHEVVLFEKETTLGGQLN
IASVPPRKSEMNRALRYLTNEMKELHVDLRLGRTADAEMILAENPDNVIVAAGAHNVIPP
IEGSKMPHVFDAWKVLNHEELPSGRVVVIGGGLVGAETAELLAEMGCQVSVVEMMEEIAK
EESKTVRPVLFESFEKYQVQLLTGTKVTAITANSVEAENAEGKVSLPCDYVVLAVGARPN
LFDVQALEDKGVQVSFVGDCNERAADINRAVEEGYLAANVL`}
                        </code>
                    </pre>
                    <p>We recommend that the header should not contain special characters (i.e. white space, punctuation marks, or special symbols like `@`, `#`, `$`), and ensure that the sequence does not contain gaps or other invalid amino acid characters.</p>
                    <ol>
                        <li>Click <b>Upload</b> to provide the required input file.</li>
                        <li>Optionally, enter your email to receive the results automatically when they are done.</li>
                        <li>Customize the job parameters using the available options (see below).</li>
                        <li>Click <b>Submit</b> to start the job.</li>
                    </ol>
                </div>
                <br />

                <div className="submit-header">
                    <h2>Job Parameters</h2>
                </div>
                <div className="help-content">
                <img src={process.env.PUBLIC_URL + "/help_homology.png"} alt="delineation" style={{ width: "60%" }}></img>
                    <p>The parameters in the <strong>Homolog</strong> tab allow you to customize the database used and the number of homologs retrieved.</p>
                    <table className="table">
                        <thead className="thead-dark">
                        <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr id="db">
                            <td>Database</td>
                            <td>EzSEA has UniRef100, UniRef90 (default), and UniRef50 available for homology searches. UniRef90 and 50 are a reduction of the UniRef100 database size.</td>
                        </tr>
                        <tr id="homologs">
                            <td>Number of Sequences to Retrieve</td>
                            <td>How many homologous sequences should EzSEA retrieve from the chosen UniRef database. These will be the top homologs found in the database. The final number of leaves in the tree may not be exactly this number due to quality control.</td>
                        </tr>
                        </tbody>
                        </table>
                    <img src={process.env.PUBLIC_URL + "/help_phylogeny.png"} alt="delineation" style={{ width: "60%" }}></img>
                    <p>The parameters in the <strong>Phylogeny</strong> tab allow the user to customize the phylogenetic tree built.</p>
                    <table className="table">
                        <thead className="thead-dark">
                        <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr id="alignprogram">
                            <td>Alignment Program</td>
                            <td>Which alignment program to use. Default is FAMSA.</td>
                        </tr>
                        <tr id="treeprogram">
                            <td>Phylogenetic Tree Program</td>
                            <td>Which program to use to build a phylogenetic tree. Note that IQ-TREE and RAxML are much slower, but more accurate options than the default. Expect to see runtime of at least a few hours if IQ-TREE/RAxML are chosen.</td>
                        </tr>
                        <tr id="asrprogram">
                            <td>Ancestral State Inference Program</td>
                            <td>Which ancestral state inference program to use. Note that for GRASP, the ancestral probabilities are not available, only the most probable ancestor.</td>
                        </tr>
                        </tbody>
                        </table>
                    <img src={process.env.PUBLIC_URL + "/help_delineation.png"} alt="delineation" style={{ width: "60%" }}></img>
                    <p>The parameters in the <strong>Delineation</strong> tab change the way the nodes are scored when delineating the enzyme.</p>
                    <table className="table">
                        <thead className="thead-dark">
                        <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr id="lenweight">
                            <td>Weight of branch length in delination step</td>
                            <td>How much the EzSEA delineation algorithm should take branch length into account when scoring nodes. The score is in part calculated through <code>branch_length × weight</code>. Default is 50.</td>
                        </tr>
                        <tr id="conweight">
                            <td>Weight of conserved residues in delination step</td>
                            <td>The weight assigned to each residue that meets the conservation threshold parameter (detailed below) for delineation scoring. To prioritize nodes with more conserved mutations and assign them a higher score, increase this parameter. The default value is 0.5, with a maximum allowable value of 1.0.</td>
                        </tr>
                        <tr id="conthreshold">
                            <td>Conservation threshold</td>
                            <td>A residue will be considered "conserved" and contribute to the score if its proportion in the alignment column meets or exceeds this threshold. For example, if the threshold is set to 0.85, and 86% of the residues in position X of the alignment are the same amino acid, then that position will be classified as conserved.</td>
                        </tr>
                        </tbody>
                        </table>
                </div>
                <br />

                <div className="submit-header">
                    <h2>Job Status Page</h2>
                </div>
                <div className="help-content">
                <img src={process.env.PUBLIC_URL + "/status.png"} alt="delineation" style={{ width: "60%" }}></img>
                <p>After clicking submit, you will be taken to a page to view the status of your job. Do not close the window unless you saved link provided on the status page, or provided an email on job submission.</p>
                <p>If the job errors out, it will be reflected on the status page. Please double check the file formats you uploaded. If further issues occur, contact us through the email below.</p>
                </div>
                <br />
                <div className="submit-header">
                    <h2>Results Page</h2>
                </div>
                <div className="help-content">
                    <p>Once in the results page, you will see the generated phylogenetic tree and a list of Key Nodes, ranked by score. Click on a node to get started. Note that you can search for any node.</p>
                    <img src={process.env.PUBLIC_URL + "/results_1.png"} alt="results1" style={{ width: "80%" }}></img>
                    <p>You will then see three sequence logos, along with the predicted 3D structure of your input sequence.</p>
                    <img src={process.env.PUBLIC_URL + "/results_2.png"} alt="results2" style={{ width: "80%" }}></img>
                    <ol>
                        <li>Key Nodes, ordered by score. Only the top 10 nodes are shown, but you can search for any node to see its result.</li>
                        <li>View generated phylogenetic tree</li>
                        <li>Download the relevant files, including the phylogenetic tree, ASR results, 3D structure, MSA.</li>
                        <li>Click on a node to view its ancestral probability logo on the right. You can compare multiple nodes by clicking different nodes.</li>
                        <li>Collapse the phylogenetic tree (top) or logo and structure (bottom)</li>
                        <li>Logos for the node of interest (top), the ancestral node (middle), and the information logo (bottom). The information logo displays the conservedness of the residue in the node of interest.</li>
                        <li>Download all of the sequence logos as a combined SVG. You can also download individual logos by clicking on the corresponding button for each logo. You will be given the option to choose a positions range for the sequence logo.</li>
                        <li>ESMfold-predicted structure, or the user-provided PDB</li>

                    </ol>
                </div>
                <br />

                <div className="submit-header">
                    <h2>FAQs</h2>
                </div>
                <div className="help-content">
                    <h4>1. What input file formats are supported?</h4>
                    <p>EzSEA supports <b>.FASTA</b> and <b>.PDB</b> file formats.</p>

                    <h4>2. Can I run example data?</h4>
                    <p>
                        Yes! Example input files are provided within the application. You can use them to familiarize yourself with EzSEA.
                    </p>

                    <h4>3. Can I close the job status page?</h4>
                    <p>
                        If you enter a valid email address before submitting the job, results will be sent once the job completes. Alternatively, you will be provided a link that you can save before closing the tab.
                    </p>
                </div>
                <br />

                <div className="submit-header">
                    <h2>Contact and Support</h2>
                </div>
                <div className="help-content">
                    <p>
                        If you encounter issues or have questions, please contact the development team at <a href="mailto:jiangak@nih.gov">jiangak (at) nih (dot) gov</a>.
                    </p>
                </div>

                <br />
                <div className="submit-header">
                    <h2>Version Information</h2>
                </div>
                <div className="help-content">
                    <p>EzSEA Web Server v1.0. Last updated: 12/16/2024</p>
                </div>

                <br />
                <div className="footer">
                    <hr />
                    <p>
                        Please cite the following paper if you use EzSEA in your research:{" "}
                        <a href="https://doi.org/example" target="_blank" rel="noopener noreferrer">
                            EzSEA Citation
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Help;
