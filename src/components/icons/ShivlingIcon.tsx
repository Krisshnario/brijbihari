import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const ShivlingIcon: React.FC<Props> = ({ className = "w-6 h-6", size }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={size ? { width: size, height: size } : undefined}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Base Pedestal (Jaladhari / Yoni Base) */}
        <ellipse cx="32" cy="52" rx="26" ry="8" fill="#332D2B" stroke="#D4AF37" strokeWidth="1.5" />
        <ellipse cx="32" cy="48" rx="22" ry="6" fill="#1C1917" />
        <path d="M 10 52 L 2 56 L 2 60 L 14 56 Z" fill="#D4AF37" />

        {/* Shivling Stone Oval Top */}
        <path d="M 22 48 C 22 24, 42 24, 42 48 Z" fill="#292524" stroke="#D4AF37" strokeWidth="1.5" />
        <ellipse cx="32" cy="30" rx="9" ry="12" fill="#1C1917" />

        {/* Tripundra (Three White Lines on Shivling) */}
        <path d="M 27 28 Q 32 30 37 28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 27 31 Q 32 33 37 31" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 27 34 Q 32 36 37 34" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Bhasma Red Bindu / Tilak in center */}
        <circle cx="32" cy="31" r="1.5" fill="#D84315" />

        {/* Water Drop / Abhishek drop */}
        <path d="M 32 10 Q 30 16 32 20 Q 34 16 32 10 Z" fill="#60A5FA" />
      </svg>
    </div>
  );
};
