import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import About from "./pages/about";
import TolApp from "./pages/tolApp";
import Playground from "./pages/playground";
import NotFoundPage from "./pages/notfoundpage";
import Submit from "./pages/submit";
import Status from "./pages/status";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import ResultsApp from "./pages/resultsApp";

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
                        path="/submit"
                        element={<Submit />}
                    />
                    <Route
                        exact
                        path="/reactvis"
                        element={<Submit />}
                    />
                    <Route
                        path="/results/:jobId"
                        element={<ResultsApp />}
                    />
                    <Route
                        path="/status/:jobId"
                        element={<Status />}
                    />
                    <Route
                        path="/tol"
                        element={<TolApp />}
                    />
                    <Route
                        exact path="/playground"
                        element={<Playground />}
                    />
                    <Route
                        exact
                        path="/about"
                        element={<About />}
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
