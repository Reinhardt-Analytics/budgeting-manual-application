import React from 'react';

export const EyeIcon = ({ visible, onClick, size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      className="eye-icon"
    >
      {visible ? (
        // Eye open icon
        <>
          <path
            d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle
            cx="12"
            cy="12.5"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </>
      ) : (
        // Eye closed icon with line through it
        <>
          <path
            d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.4"
          />
          <circle
            cx="12"
            cy="12.5"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          <line
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
};
