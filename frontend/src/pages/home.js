import { Link } from "react-router-dom";
import React from "react";
import Loading from '../components/loading';
import '../components/home.css';

const Home = () => {
    return (
        <div style={{ userSelect: "none" }}>
            <div className="main-title" style={{alignItems:"center", textAlign:"center", backgroundColor:"#333", paddingTop:"60px", paddingBottom:"60px"}}>
                <Loading />
                <h1 style={{fill:"white"}}>EzSEA</h1>
            </div>
            <p>Info, Update log, functionality, FAQ, samples</p>
            <Link to="/submit">
                <a>Predict Your Protein</a>
            </Link>
        </div>
    );
};

export default Home;