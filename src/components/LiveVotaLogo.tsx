import React from 'react';

interface LiveVotaLogoProps {
  /** Size in pixels (applies to width & height) */
  size?: number;
  /** Display variant */
  variant?: 'icon' | 'glyph' | 'full' | 'wordmark';
  /** Optional custom CSS classes */
  className?: string;
  /** Whether to show active pulse ring indicator */
  withPulse?: boolean;
}

export const LiveVotaLogo: React.FC<LiveVotaLogoProps> = ({
  size = 32,
  variant = 'icon',
  className = '',
  withPulse = false,
}) => {
  if (variant === 'wordmark') {
    return (
      <span className={`inline-flex items-center font-bold tracking-tight font-sans ${className}`}>
        <span>LIVEV</span>
        <span className="text-[#FBB03B]">O</span>
        <span>TA</span>
      </span>
    );
  }

  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 128 128"
        width={size}
        height={size}
        className={`shrink-0 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Golden Amber Head */}
        <circle cx="64" cy="38" r="11" fill="#FBB03B" />
        {/* Left White Arm */}
        <line x1="38" y1="44" x2="63" y2="82" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" />
        {/* Right Azure Arm */}
        <line x1="63" y1="82" x2="90" y2="38" stroke="#38B6FF" strokeWidth="16" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`relative inline-flex flex-col items-center shrink-0 ${className}`}>
        <img
          src="/logo.svg"
          alt="LiveVota Logo"
          width={size}
          height={size}
          className="rounded-2xl shadow-lg"
        />
      </div>
    );
  }

  // Default 'icon' squircle variant matching the uploaded logo
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 128 128"
        width={size}
        height={size}
        className="w-full h-full shadow-md rounded-[22%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Royal Blue Squircle Background */}
        <rect width="128" height="128" rx="28" ry="28" fill="#1555EC" />

        {/* Golden Amber Head */}
        <circle cx="64" cy="38" r="11" fill="#FBB03B" />

        {/* Left White Arm */}
        <line x1="38" y1="44" x2="63" y2="82" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" />

        {/* Right Azure Arm */}
        <line x1="63" y1="82" x2="90" y2="38" stroke="#38B6FF" strokeWidth="16" strokeLinecap="round" />

        {/* Subtle Accent Dot */}
        <circle cx="64" cy="104" r="3.5" fill="#FBB03B" />
      </svg>

      {/* Optional Realtime Pulse Indicator */}
      {withPulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#0B0F17]" />
        </span>
      )}
    </div>
  );
};
