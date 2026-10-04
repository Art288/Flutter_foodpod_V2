import React from 'react';
import { Home, Calendar, Settings } from 'lucide-react';

export const BottomNav = ({ 
  currentView = 'dashboard', 
  onNavigate 
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto pointer-events-auto animate-fade-in">
      <nav 
        aria-label="Bottom Navigation"
        className="bg-white/90 dark:bg-[#14141E]/90 backdrop-blur-xl border border-slate-300 dark:border-[#2B2B3C] rounded-full px-3 py-2 shadow-xl shadow-black/15 dark:shadow-black/60 flex items-center gap-1.5 sm:gap-2 transition-colors duration-200"
      >
        
        {/* 1. หน้าแรก (Home / Dashboard) */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            currentView === 'dashboard'
              ? 'bg-brand text-white shadow-orange-glow'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title="หน้าแรก (แดชบอร์ด)"
        >
          <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>หน้าแรก</span>
        </button>

        {/* 2. ปฏิทิน (Calendar / วันที่และประวัติ) */}
        <button
          onClick={() => onNavigate('calendar')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            currentView === 'calendar'
              ? 'bg-brand text-white shadow-orange-glow'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title="ปฏิทินเลือกวันที่และบันทึกประวัติการวิ่ง"
        >
          <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>ปฏิทิน</span>
        </button>

        {/* 3. ตั้งค่า (Settings & ข้อมูลสุขภาพ) */}
        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            currentView === 'settings'
              ? 'bg-brand text-white shadow-orange-glow'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title="ตั้งค่า (ข้อมูลสุขภาพ, สลับธีม, เชื่อมต่ออุปกรณ์)"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>ตั้งค่า</span>
        </button>

      </nav>
    </div>
  );
};
