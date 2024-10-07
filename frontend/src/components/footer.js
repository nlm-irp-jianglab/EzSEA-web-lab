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
                <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        marginTop: "30px",
        backgroundColor: "#d4d0cf",
        color: "#fff",
        textAlign: "center",
        position: "relative",
        width: "100%",
        paddingBottom: "10px",
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
        fontSize: "14px",
    },
};

export default Footer;
