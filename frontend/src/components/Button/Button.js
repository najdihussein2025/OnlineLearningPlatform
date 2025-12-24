import React from 'react';
import './Button.css';

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, ...props }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

