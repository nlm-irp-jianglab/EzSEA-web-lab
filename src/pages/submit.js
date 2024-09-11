import React from "react";
import Navbar from "../components/navbar.js";
import "../components/submit.css";

const Home = () => {
    return (
        <div style={{ userSelect: "none" }}>
            <Navbar />
            <br />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: "1 0 auto" }}>
                <div style={{ textAlign: "center", margin: "2em auto 0px", width: "30%", padding: "0.5em", flex: "1 1 0"}}>
                    <img src={process.env.PUBLIC_URL + "/temp_logo.png"} alt="Logo" style={{ width: "60%", marginBottom: "3em" }}></img>
                    <div>
                        <div> {/* This div is for text input and examples */}
                            <textarea placeholder="Sequence in FASTA format" class="data-input" style={{ height: "150px", width: "100%", resize: "vertical" }}></textarea>
                            <div>
                                <div style={{ display: "flex", marginTop: "0.3em", justifyContent: "space-between" }}>
                                    <span class="bp3-tag bp3-intent-primary">
                                        <span class="bp3-text-overflow-ellipsis bp3-fill">Please enter your protein sequence.</span>
                                    </span>
                                    <span class="bp3-popover-wrapper">
                                        <div class="bp3-popover-target">
                                            <button type="button" class="bp3-button bp3-minimal bp3-small">
                                                <span class="bp3-button-text">Examples</span>
                                            </button>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div> {/* End div for text input and examples */}
                        <div style={{ display: "flex", marginTop: "1em", marginBottom: "1em", minHeight: "2pt", placeContent: "center" }}></div>
                        <div style={{ marginTop: "2em" }}>
                            <button type="button" class="bp3-button bp3-minimal">
                                <span icon="caret-right" class="bp3-icon bp3-icon-caret-right">
                                    <svg data-icon="caret-right" width="16" height="16" viewBox="0 0 16 16">
                                        <desc>caret-right</desc>
                                        <path d="M11 8c0-.15-.07-.28-.17-.37l-4-3.5A.495.495 0 006 4.5v7a.495.495 0 00.83.37l4-3.5c.1-.09.17-.22.17-.37z" fill-rule="evenodd"></path>
                                    </svg>
                                </span>
                                <span class="bp3-button-text">Show advanced settings</span>
                            </button>
                        </div>
                        <div style={{ width: "87%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", marginTop: "2em", marginBottom: "2em" }}>
                            <div class="bp3-form-group bp3-inline">
                                <label class="bp3-label" for="jobname-input">Job name <span class="bp3-text-muted">(optional)</span></label>
                                <div class="bp3-form-content">
                                    <div class="bp3-input-group">
                                        <input type="text" id="jobname-input" placeholder="Your job name" class="bp3-input" />
                                    </div>
                                </div>
                            </div>
                            <div class="bp3-form-group bp3-inline">
                                <label class="bp3-label" for="text-input">Your e-mail address <span class="bp3-text-muted">(optional)</span></label>
                                <div class="bp3-form-content">
                                    <div class="bp3-input-group">
                                        <input type="text" id="email-input" placeholder="your@email.com" class="bp3-input" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h1>Home Page</h1>
                </div>
            </div>
        </div>
    );
};

export default Home;