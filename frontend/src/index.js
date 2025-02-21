import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import TestApp from "./pages/testApp";
import NotFoundPage from "./pages/notfoundpage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = createRoot(document.getElementById("root"));

const DualPathRoutes = () => (
    <Routes>
        {/* Base paths used in local testing */} 
        <Route path="/*" element={
            <Routes>
                <Route exact path="/" element={<TestApp />} />
                <Route path="/test" element={<TestApp />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        } />
    </Routes>
);

root.render(
    <React.StrictMode>
        <Router basename="/ezsea">
            <DualPathRoutes />
        </Router>
    </React.StrictMode>
);
