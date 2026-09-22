import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const GauMataLogo: React.FC<Props> = ({ className = "w-12 h-12", size }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={size ? { width: size, height: size } : undefined}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Divine Aura / Sun rays halo */}
        <circle cx="50" cy="50" r="46" fill="#FFFBEB" stroke="#D4AF37" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="42" stroke="#E65100" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Tilak / Decorative Arch */}
        <path d="M50 8 C30 8 14 24 14 44 C14 64 30 80 50 80 C70 80 86 64 86 44 C86 24 70 8 50 8 Z" fill="#FFF9F0" />
        
        {/* Gau Mata Horns & Head Silhouette */}
        {/* Horns */}
        <path d="M 32 36 C 26 24, 28 14, 38 18 C 34 24, 34 32, 38 38 Z" fill="#D84315" />
        <path d="M 68 36 C 74 24, 72 14, 62 18 C 66 24, 66 32, 62 38 Z" fill="#D84315" />
        
        {/* Golden Horn Accents */}
        <path d="M 32 36 C 26 24, 28 14, 38 18" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M 68 36 C 74 24, 72 14, 62 18" stroke="#D4AF37" strokeWidth="1.5" />

        {/* Ears */}
        <path d="M 22 42 C 12 44, 14 54, 28 48 C 26 46, 24 44, 22 42 Z" fill="#E65100" />
        <path d="M 78 42 C 88 44, 86 54, 72 48 C 74 46, 76 44, 78 42 Z" fill="#E65100" />

        {/* Head / Muzzle */}
        <ellipse cx="50" cy="46" rx="16" ry="18" fill="#FFFFFF" stroke="#7A1C1C" strokeWidth="1.5" />
        <ellipse cx="50" cy="58" rx="13" ry="11" fill="#FDF2E9" stroke="#7A1C1C" strokeWidth="1" />
        
        {/* Nostrils */}
        <ellipse cx="44" cy="61" rx="2.5" ry="3.5" fill="#7A1C1C" />
        <ellipse cx="56" cy="61" rx="2.5" ry="3.5" fill="#7A1C1C" />

        {/* Divine Eyes */}
        <ellipse cx="41" cy="42" rx="3" ry="2" fill="#1C1917" />
        <ellipse cx="59" cy="42" rx="3" ry="2" fill="#1C1917" />
        
        {/* Red Tilak on Forehead */}
        <path d="M50 28 L53 36 L50 38 L47 36 Z" fill="#B71C1C" />
        <circle cx="50" cy="26" r="2" fill="#D4AF37" />

        {/* Garland / Mala */}
        <path d="M 28 62 Q 50 82 72 62" stroke="#E65100" strokeWidth="3" strokeLinecap="round" />
        <path d="M 32 64 Q 50 80 68 64" stroke="#D4AF37" strokeWidth="2" strokeDasharray="2 3" />
        <circle cx="50" cy="74" r="3.5" fill="#B71C1C" stroke="#D4AF37" strokeWidth="1" />
        
        {/* Outer Golden Ring Border */}
        <circle cx="50" cy="50" r="48" stroke="#D4AF37" strokeWidth="2" />
      </svg>
    </div>
  );
};
