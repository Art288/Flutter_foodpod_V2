import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggleSwitch = ({ className = '', showLabel = true }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
          {isDark ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง'}
        </span>
      )}
      
      {/* Interactive Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={!isDark}
        onClick={toggleTheme}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0A0A0F] ${
          isDark
            ? 'bg-[#181824] border-[#2E2E42]'
            : 'bg-gradient-to-r from-amber-400 to-orange-400 border-amber-500 shadow-sm'
        }`}
        title={isDark ? 'สลับเป็น Light Mode (โหมดสว่าง)' : 'สลับเป็น Dark Mode (โหมดมืด)'}
      >
        <span className="sr-only">Toggle Dark/Light Mode</span>
        
        {/* Sliding Knob with Icon */}
        <span
          className={`pointer-events-none inline-flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out mt-0.5 ${
            isDark ? 'translate-x-1 text-slate-800' : 'translate-x-7.5 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-slate-800 fill-slate-800" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          )}
        </span>
      </button>
    </div>
  );
};
