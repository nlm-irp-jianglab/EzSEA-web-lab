import React from "react";
// Importing Link from react-router-dom to 
// navigate to different end points.
import Navbar from "../components/navbar.js";

const Home = () => {
    return (
        <div>
            <Navbar />
            <h1>Home Page</h1>
            <br />
            <p>
                This is a simple React application that demonstrates the use of various data visualization tools.
            </p>
        </div>
    );
};

export default Home;