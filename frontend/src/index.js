import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import TolApp from "./pages/tolApp";
import NotFoundPage from "./pages/notfoundpage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = createRoot(document.getElementById("root"));

const DualPathRoutes = () => (
    <Routes>
        {/* Base paths used in local testing */} 
        <Route path="/*" element={
            <Routes>
                <Route exact path="/" element={<TolApp />} />
                <Route path="/test" element={<TolApp />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        } />
    </Routes>
);

root.render(
    <React.StrictMode>
        <Router basename={"/EzSEA-web-lab"}>
            <DualPathRoutes />
        </Router>
    </React.StrictMode>
);
