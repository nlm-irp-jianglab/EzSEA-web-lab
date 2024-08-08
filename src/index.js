import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import Home from "./pages/home";
import App from "./App";
import PV from "./pages/pv";
import Tol from "./pages/tol";
import Molstar from "./pages/molstar";
import Playground from "./pages/playground";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

const root = createRoot(document.getElementById("root"));
root.render(
    <>
        <Router>
            <Routes>
                <Route
                    exact
                    path="/"
                    element={<Home />}
                />
                <Route
                    path="/prlogo"
                    element={<App />}
                />
                <Route
                    path="/pv"
                    element={<PV />}
                />
                <Route
                    path="/tol"
                    element={<Tol />}
                />
                <Route
                    exact path="/molstar"
                    element={<Molstar />}
                />
                <Route
                    exact path="/playground"
                    element={<Playground />}
                />
                <Route
                    path="*"
                    element={<Navigate to="/" />}
                />


            </Routes>
        </Router>
    </>
);