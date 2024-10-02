import React, { useState } from 'react';

const Dropdown = () => {
    const [selectedItem, setSelectedItem] = useState('Select an item'); // Default text for dropdown
    const [isOpen, setIsOpen] = useState(false); // State to control if the dropdown is open or not

    const handleSelect = (item) => {
        setSelectedItem(item); // Update selected item when user clicks
        setIsOpen(false); // Close the dropdown after selecting an item
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen); // Toggle the dropdown's open state
    };

    const dropdownItems = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

    return (
        <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
            <button 
                onClick={toggleDropdown} 
                className="dropdown-toggle" 
                style={{ padding: '10px', borderRadius: '5px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none' }}
            >
                {selectedItem} {/* Displays the selected item */}
            </button>
            {isOpen && ( // Only show dropdown menu when isOpen is true
                <div 
                    className="dropdown-menu" 
                    style={{ 
                        border: '1px solid #ccc', 
                        borderRadius: '5px', 
                        marginTop: '5px', 
                        width: '150px', 
                        backgroundColor: '#f9f9f9', 
                        position: 'absolute',
                        zIndex: '1' 
                    }}
                >
                    {dropdownItems.map((item, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleSelect(item)} // Updates selection on click
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e2e2'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
