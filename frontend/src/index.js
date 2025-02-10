import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import About from "./pages/about";
import TestApp from "./pages/testApp";
import Playground from "./pages/playground";
import NotFoundPage from "./pages/notfoundpage";
import Submit from "./pages/submit";
import Help from "./pages/help";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = createRoot(document.getElementById("root"));

const DualPathRoutes = () => (
    <Routes>
        {/* Base paths used in local testing */} 
        <Route path="/*" element={
            <Routes>
                <Route exact path="/" element={<Submit />} />
                <Route path="/test" element={<TestApp />} />
                <Route exact path="/playground" element={<Playground />} />
                <Route exact path="/about" element={<About />} />
                <Route exact path="/help" element={<Help />} />
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
