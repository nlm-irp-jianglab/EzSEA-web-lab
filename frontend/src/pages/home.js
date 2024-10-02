import { Link } from "react-router-dom";
import React from "react";
import Navbar from "../components/navbar.js";

const Home = () => {
    return (
        <div style={{ userSelect: "none" }}>
            <Navbar />
            <p>Home Page</p>
            <p>Info, Update log, functionality, FAQ, samples</p>
            <Link to="/submit">
                <a>Predict Your Protein</a>
            </Link>
        </div>
    );
};

export default Home;