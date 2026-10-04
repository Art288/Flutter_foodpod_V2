import React from 'react';

/**
 * FootPodLogo Component (Static & Clean)
 * Premium, sleek, high-tech IoT FootPod logo with glowing orange telemetry arcs and running foot silhouette.
 * All animations removed as requested.
 */
export const FootPodLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
    xl: 'w-20 h-20'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-flex items-center justify-center ${currentSize} rounded-2xl bg-gradient-to-br from-[#1C1518] via-[#151520] to-[#0D0D14] border border-[#FF6600]/40 shadow-[0_0_20px_rgba(255,102,0,0.25)] p-2.5 ${className}`}>
      
      {/* Background radial glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand/20 to-transparent pointer-events-none opacity-80" />

      {/* High-tech vector SVG logo */}
      <svg 
        className="w-full h-full text-brand drop-shadow-[0_2px_8px_rgba(255,102,0,0.5)] relative z-10" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA24C" />
            <stop offset="50%" stopColor="#FF6600" />
            <stop offset="100%" stopColor="#FF3700" />
          </linearGradient>

          <linearGradient id="neonGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF8833" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* Dynamic Telemetry Angle Arc */}
        <path 
          d="M 38 12 C 43 18, 43 30, 36 38" 
          stroke="url(#brandGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeDasharray="1 3"
          className="opacity-75"
        />

        {/* Speed / Telemetry Waves */}
        <path 
          d="M 42 16 C 46 22, 46 28, 41 34" 
          stroke="#FF8800" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          opacity="0.4"
        />

        {/* Aerodynamic Running Shoe & Footpod Sensor Silhouette */}
        <path 
          d="M 8 32 C 10 32, 14 32, 22 32 C 30 32, 36 30, 40 24 C 41 22, 40 20, 38 19 C 34 17, 28 16, 22 17 C 18 17, 12 21, 9 26 C 7 28, 7 31, 8 32 Z" 
          fill="url(#brandGrad)"
        />

        {/* Outsole Grip Notch */}
        <path 
          d="M 12 34 C 18 34, 26 34, 34 32" 
          stroke="url(#neonGlow)" 
          strokeWidth="2" 
          strokeLinecap="round"
        />

        {/* FootPod Smart Sensor Pod on Shoe */}
        <circle cx="24" cy="21" r="3.5" fill="#FFFFFF" />
        <circle cx="24" cy="21" r="1.8" fill="#FF5500" />

        {/* Sensor Status Indicator Dot (Static) */}
        <circle cx="24" cy="11" r="1.5" fill="#FFAA00" />
      </svg>

    </div>
  );
};
