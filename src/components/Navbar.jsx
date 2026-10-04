import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';
import { FootPodLogo } from './Common/FootPodLogo';

export const Navbar = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0E0E14]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#22222E] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand: foot pod (Clean & Minimalist) */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => onNavigate('dashboard')}
          >
            <FootPodLogo size="sm" />
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans lowercase">
              foot <span className="text-brand">pod</span>
            </span>
          </div>

          {/* Right Action: Clean Profile Avatar Only */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-[#171722] border border-slate-200 dark:border-[#2A2A3A] hover:border-brand/40 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-bold text-xs">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {currentUser?.name || 'ผู้ใช้งาน'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#14141E] border border-slate-200 dark:border-[#2C2C3E] rounded-2xl p-2.5 shadow-2xl z-50 animate-fade-in"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="pb-2.5 border-b border-slate-100 dark:border-[#242434] px-2 pt-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
