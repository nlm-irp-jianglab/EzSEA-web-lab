import React from 'react';
import './errorpopup.css'; // CSS for styling the popup and background

const ErrorPopup = ({ errorMessage, onClose }) => {
  return (
    <div className="popup-background">
      <div className="popup">
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ErrorPopup;
