import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./navbar.css"; // Make sure to create this file for styling

const Navbar = (options) => {
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="navbar">
      {options.pageId ? (
        <div className="nav-links">
          <Link to="/">
            <h1 className="logo">{options.pageId}</h1>
          </Link>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/">
            <h1 className="logo">EzSEA</h1>
          </Link>
        </div>
      )
      }
      <ul
        className={isMobile ? "nav-links-mobile" : "nav-links"}
        onClick={() => setIsMobile(false)}
      >
        <Link to="/" className="home">
          <li>Home</li>
        </Link>
        <Link to="/tol" className="tol">
          <li>Tree of Life</li>
        </Link>
      </ul>
    </div>
  );
};

export default Navbar;
