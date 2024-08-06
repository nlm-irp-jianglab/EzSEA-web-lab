import React from "react";
import PrUpload from "./pages/prlogo";
import DNAUpload from "./pages/dnalogo";
import Navbar from "./components/navbar";

function App() {
    return (
        <div>
            <Navbar />
            <h1>Protein Logo</h1>
            <br />
            <PrUpload />
            <br />
            <br />
            <h1>DNA Logo</h1>
            <DNAUpload />
        </div>
    );
}

export default App;