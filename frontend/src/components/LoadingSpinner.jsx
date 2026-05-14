// components/LoadingSpinner.jsx
import React from "react";
import "./Loader.css";

const LoadingSpinner = ({ fullPage = true }) => {
  return (
   <div className={fullPage ? "loader-overlay" : "loader-container"}>
      <div className="luxury-spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-logo">V</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;