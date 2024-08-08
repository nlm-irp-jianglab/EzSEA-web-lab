import React, { useEffect, useRef } from 'react';
import hmmLogo from './skylign.js';
import css from './logo.css';

const SkylignComponent = ({ logoData, name }) => {
  const logoRef = useRef(null);

  useEffect(() => {
    const logoElement = logoRef.current;

    if (logoElement) {
      // Attach CSS styles
      const style = document.createElement('style');
      style.textContent = css;
      logoElement.appendChild(style);

      // Create the logo container
      const logoDiv = document.createElement('div');
      logoElement.appendChild(logoDiv);

      // Render the logo using the provided data
      if (logoData) {
        const logo = new hmmLogo(logoDiv, {
          data: logoData,
          height_toggle: true,
          column_info: false,
          zoom: "1",
          height_toggle: true,
          name: name,
          zoom_buttons: 'disabled', // Disabled zoom buttons, will re-enable when zoom can be applied to both logos
        });

        // Cleanup function
        return () => {
          if (logoDiv) {
            logoDiv.remove();
          }
          // hmmLogo does not have a dispose method
          /* if (logo) {
            logo.dispose(); // Assuming hmmLogo has a dispose or similar method
          } */
        };
      }
    }
  }, [logoData]);

  return <div ref={logoRef}></div>;
};

export default SkylignComponent;
