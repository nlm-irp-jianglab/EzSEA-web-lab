import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import hmmLogo from './skylign.js';
import css from './logo.css';

const SkylignComponent = forwardRef(({ logoData, name, onColumnClick }, ref) => {
  const logoRef = useRef(null);
  const logoInstanceRef = useRef(null); // Ref to store the hmmLogo instance

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
        const logo = new hmmLogo(
          logoDiv,
          {
            data: logoData,
            column_info: true,
            zoom: "1",
            name: name,
            zoom_buttons: 'disabled',
            height: 300,
          },
          (col, columnData) => {
            // Call the provided onColumnClick function
            if (onColumnClick) {
              onColumnClick(col, columnData);
            } else {
              console.error("onColumnClick not provided");
            }
          }
        );

        logoInstanceRef.current = logo; // Store the hmmLogo instance

        // Cleanup function
        return () => {
          if (logoDiv) {
            logoDiv.remove();
          }
        };
      }
    }
  }, [logoData]);

  // Expose the scrollToColumn method to the parent component via the ref
  useImperativeHandle(ref, () => ({
    scrollToColumn: (column) => {
      if (logoInstanceRef.current) {
        logoInstanceRef.current.scrollToColumn(column);
      }
    }
  }));

  return <div ref={logoRef}></div>;
});

export default SkylignComponent;
