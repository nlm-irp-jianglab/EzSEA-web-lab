import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import Home from "./pages/home";
import PV from "./pages/pv";
import Tol from "./pages/tol";
import Playground from "./pages/playground";
import Logo_Playground from "./pages/logo_playground";
import NotFoundPage from "./pages/notfoundpage";
import Submit from "./pages/submit";
import JobQueued from "./pages/jobqueued";
import Results from "./pages/results";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";

const root = createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <>
            <Router>
                <Routes>
                    <Route
                        exact
                        path="/"
                        element={<Submit />}
                    />
                    <Route
                        exact
                        path="/reactvis"
                        element={<Submit />}
                    />
                    <Route
                        path="/pv"
                        element={<PV />}
                    />
                    <Route
                        path="/results/:jobId"
                        element={<Results />}
                    />
                    <Route
                        path="/job-queued"
                        element={<JobQueued />}
                    />
                    <Route
                        path="/tol"
                        element={<Tol />}
                    />
                    <Route
                        exact path="/playground"
                        element={<Playground />}
                    />
                    <Route
                        exact path="/logo_playground"
                        element={<Logo_Playground />}
                    />
                    <Route
                        path="*"
                        element={<NotFoundPage />}
                    />
                </Routes>
            </Router>
        </>
    </React.StrictMode>
);
