import React, { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from "../components/navbar";
import Loading from "../components/loading";

const Tol = () => {
    return (
        <div>
            <Navbar pageId={"Integrated Tree Viewer"} />
            <Loading />
        </div>
    );
};

export default Tol;
