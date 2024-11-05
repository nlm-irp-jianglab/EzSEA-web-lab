import React from "react";

const Footer = () => {
    return (
        <footer style={styles.footer}>
            <div style={styles.linksContainer}>
                <a href="https://www.ncbi.nlm.nih.gov/CBBresearch/jianglab/index.html" target="_blank" rel="noopener noreferrer" style={styles.link}>
                    Jiang Lab
                </a>
                <a href="https://github.com/nlm-irp-jianglab" target="_blank" rel="noopener noreferrer" style={styles.link}>
                    GitHub
                </a>
                <a href="https://github.com/littlelegz/EzSEA-website" target="_blank" rel="noopener noreferrer" style={styles.link}>
                    Website Code
                </a>
            </div>
            <div style={styles.copyright}>
                <span style={{ float: "left", paddingLeft: "10px"}}><a href="mailto:ezsea.notifications@gmail.com" style={styles.link}>Contact us</a></span>
                <img src={process.env.PUBLIC_URL + "/nihlogo.png"} alt="NIHLogo" style={{ width: "5%", paddingRight: "10px" }}></img>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        marginTop: "20px",
        backgroundColor: "#d4d0cf",
        color: "#fff",
        textAlign: "center",
        position: "relative",
        width: "100%",
        paddingBottom: "10px",
        bottom: "0px",
        left: "0px"
    },
    linksContainer: {
        paddingTop: "10px",
        marginBottom: "5px",
    },
    link: {
        color: "#fff",
        textDecoration: "none",
        margin: "0 15px",
    },
    copyright: {
        textAlign: "right",
        fontSize: "14px",
    },
};

export default Footer;
