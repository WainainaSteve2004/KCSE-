import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="w-full h-full flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Graduation Cap */}
          <path d="M50 15 L20 30 L50 45 L80 30 Z" fill="#002147" />
          <path d="M30 35 V45 C30 55 70 55 70 45 V35" fill="#002147" opacity="0.8" />
          
          {/* Circular Shield with AI */}
          <circle cx="50" cy="35" r="14" fill="white" stroke="#28a745" strokeWidth="1" />
          <text x="50" y="39" fontSize="10" fontVariant="small-caps" fontWeight="bold" textAnchor="middle" fill="#0056b3">AI</text>
          
          {/* Circuit Elements */}
          <circle cx="28" cy="32" r="2" fill="#0056b3" />
          <path d="M28 32 L36 32" stroke="#0056b3" strokeWidth="1" />
          <circle cx="72" cy="32" r="2" fill="#28a745" />
          <path d="M72 32 L64 32" stroke="#28a745" strokeWidth="1" />

          {/* Open Book */}
          <path d="M50 50 L20 62 V85 Q50 75 80 85 V62 Z" fill="#0056b3" />
          <path d="M50 50 L80 62 V85 Q50 75 20 85 V62 Z" fill="#28a745" opacity="0.2" />
          <path d="M50 50 V82" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col origin-left">
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white leading-none whitespace-nowrap">EXAMINA AI</span>
          <div className="flex items-center gap-1">
             <div className="h-[1px] w-4 bg-zinc-300" />
             <span className="text-[6px] font-bold text-zinc-500 tracking-[0.1em] whitespace-nowrap">SMART EXAMS. SMARTER FUTURE.</span>
             <div className="h-[1px] w-4 bg-zinc-300" />
          </div>
        </div>
      )}
    </div>
  );
};
