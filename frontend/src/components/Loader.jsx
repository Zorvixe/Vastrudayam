import React from "react";
import "./Loader.css";

const Loader = ({ fullPage = true }) => {
  return (
    <div className={fullPage ? "loader-overlay" : "loader-container"}>
      <div className="luxury-spinner">
        <div className="spinner-circle"></div>
        <img src="/vastrudayam_favicon.png" alt="Vastrudayam Logo" className="spinner-logo-img" />
      </div>
    </div>
  );
};

export default Loader;
