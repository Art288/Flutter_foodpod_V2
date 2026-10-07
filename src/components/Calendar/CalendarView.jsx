import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Gauge, 
  Navigation, 
  Footprints, 
  Zap, 
  PlusCircle, 
  Check, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  ArrowLeft,
  CalendarDays,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  THAI_MONTHS_FULL, 
  THAI_DAYS_SHORT, 
  toDateKey, 
  getRunDateKey, 
  formatThaiFullDate, 
  formatThaiDate,
  formatRunDateTime,
  getCalendarGrid 
} from '../../utils/dateUtils';
import { speedToPace, analyzeFootAngle } from '../../utils/calculations';

export const CalendarView = ({
  runs = [],
  activeRun,
  onSaveCurrentSession,
  onSelectRun,
  onOpenDetail,
  onOpenEdit,
  onDeleteRun,
  onBackToDashboard
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  // Calendar month/year navigation state
  const [viewMonth, setViewMonth] = useState({
    year: today.getFullYear(),
    monthIndex: today.getMonth()
  });

  // Filter mode: 'selected_day' | 'all_days'
  const [viewMode, setViewMode] = useState('selected_day');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Group runs by dateKey
  const runsByDateKey = useMemo(() => {
    const map = {};
    runs.forEach(run => {
      const key = getRunDateKey(run);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(run);
      }
    });
    return map;
  }, [runs]);

  // Calendar days grid
  const calendarDays = useMemo(() => {
    return getCalendarGrid(viewMonth.year, viewMonth.monthIndex);
  }, [viewMonth.year, viewMonth.monthIndex]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewMonth(prev => {
      if (prev.monthIndex === 0) {
        return { year: prev.year - 1, monthIndex: 11 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewMonth(prev => {
      if (prev.monthIndex === 11) {
        return { year: prev.year + 1, monthIndex: 0 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex + 1 };
    });
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewMonth({ year: now.getFullYear(), monthIndex: now.getMonth() });
    setSelectedDate(now);
    setViewMode('selected_day');
  };

  // ตรวจสอบว่ารอบปัจจุบันบนบอร์ดถูกบันทึกเข้าปฏิทินของวันนี้แล้วหรือไม่
  const isToday = selectedDateKey === todayKey;
  const isAlreadySaved = Boolean(
    activeRun?.isSaved || 
    runs.some(r => r.id === activeRun?.id || (r.dateKey === todayKey && r.steps === activeRun?.steps && r.steps > 0))
  );

  // มีรอบสดที่กำลังทำงานอยู่และยังไม่ได้ถูกบันทึก
  const hasUnsavedLiveRun = isToday && activeRun && activeRun.steps > 0 && !isAlreadySaved;

  // Selected date statistics
  const selectedDayRuns = useMemo(() => {
    return runsByDateKey[selectedDateKey] || [];
  }, [runsByDateKey, selectedDateKey]);

  const displayedRuns = useMemo(() => {
    return viewMode === 'selected_day' ? selectedDayRuns : runs;
  }, [viewMode, selectedDayRuns, runs]);

  const dayStats = useMemo(() => {
    const liveSteps = hasUnsavedLiveRun ? (activeRun?.steps || 0) : 0;
    const liveDist = hasUnsavedLiveRun ? (activeRun?.distanceKm || 0) : 0;
    const liveCal = hasUnsavedLiveRun ? (activeRun?.caloriesBurned || 0) : 0;

    const totalRuns = selectedDayRuns.length + (hasUnsavedLiveRun ? 1 : 0);
    const totalDistKm = selectedDayRuns.reduce((sum, r) => sum + (r.distanceKm || 0), 0) + liveDist;
    const totalSteps = selectedDayRuns.reduce((sum, r) => sum + (r.steps || 0), 0) + liveSteps;
    const totalCal = selectedDayRuns.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0) + liveCal;
    
    const validSpeeds = selectedDayRuns.map(r => r.avgSpeedKmh).filter(s => typeof s === 'number' && s > 0);
    if (hasUnsavedLiveRun && activeRun?.avgSpeedKmh > 0) {
      validSpeeds.push(activeRun.avgSpeedKmh);
    }
    const avgSpeed = validSpeeds.length > 0 
      ? validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length 
      : 0;

    return {
      totalRuns,
      totalDistKm: Number(totalDistKm.toFixed(2)),
      totalSteps,
      totalCal,
      avgSpeed: Number(avgSpeed.toFixed(1)),
      avgPace: speedToPace(avgSpeed),
      hasUnsavedLiveRun
    };
  }, [selectedDayRuns, hasUnsavedLiveRun, activeRun]);

  // Handle saving the current live session into the selected date
  const handleSaveToSelectedDate = () => {
    if (onSaveCurrentSession) {
      onSaveCurrentSession(selectedDate);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-5 shadow-sm dark:shadow-card-dark transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1A1A26] border border-slate-200 dark:border-[#2C2C3E] text-slate-600 dark:text-slate-300 hover:text-brand hover:border-brand/40 transition-colors"
            title="กลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-brand" />
              <span>ปฏิทินบันทึกการวิ่ง (Running Calendar)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
              เลือกวันที่ในปฏิทินเพื่อดูประวัติรอบวิ่ง บันทึกผลการวิ่ง หรือสถิติสะสมในแต่ละวัน
            </p>
          </div>
        </div>

        {/* Quick action: Today button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGoToToday}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-xs font-bold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>วันนี้</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#181824] border border-slate-200 dark:border-[#252535] text-xs font-mono text-slate-600 dark:text-slate-300">
            รวมประวัติ {runs.length} รอบ
          </div>
        </div>
      </div>

      {/* Main Grid: Left Calendar / Right Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Calendar (7 Cols on desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-card-dark transition-colors space-y-5">
          
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20202E] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {THAI_MONTHS_FULL[viewMonth.monthIndex]} {viewMonth.year + 543}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#181824] border border-slate-200 dark:border-[#28283A] text-slate-700 dark:text-slate-300 hover:text-brand hover:border-brand/40 transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#181824] border border-slate-200 dark:border-[#28283A] text-slate-700 dark:text-slate-300 hover:text-brand hover:border-brand/40 transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers (อา. - ส.) */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs">
            {THAI_DAYS_SHORT.map((dayName, idx) => (
              <div 
                key={dayName}
                className={`py-1.5 rounded-lg ${
                  idx === 0 
                    ? 'text-rose-500 font-extrabold' 
                    : idx === 6 
                    ? 'text-blue-500 font-extrabold' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, index) => {
              const runsOnCell = runsByDateKey[cell.dateKey] || [];
              const cellRunCount = runsOnCell.length + (cell.dateKey === todayKey && hasUnsavedLiveRun ? 1 : 0);
              const hasRuns = cellRunCount > 0;
              const isSelected = cell.dateKey === selectedDateKey;
              const isTodayCell = cell.isToday;

              return (
                <button
                  key={`${cell.dateKey}_${index}`}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    setViewMode('selected_day');
                  }}
                  className={`min-h-[64px] sm:min-h-[76px] p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-between text-left transition-all relative group ${
                    isSelected
                      ? 'bg-brand text-white border-brand shadow-orange-glow ring-2 ring-brand/40 z-10'
                      : isTodayCell
                      ? 'bg-orange-50 dark:bg-brand/10 border-brand/50 text-brand dark:text-orange-400 font-bold'
                      : cell.isCurrentMonth
                      ? 'bg-slate-50/70 dark:bg-[#161622] border-slate-200/80 dark:border-[#242435] text-slate-800 dark:text-slate-200 hover:border-brand/40 hover:bg-slate-100 dark:hover:bg-[#1D1D2C]'
                      : 'bg-transparent border-transparent text-slate-300 dark:text-slate-600 hover:text-slate-500'
                  }`}
                >
                  {/* Day Number and Today Badge */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-bold font-mono ${
                      isSelected ? 'text-white' : ''
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {isTodayCell && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    )}
                  </div>

                  {/* Run session badge/indicator */}
                  {hasRuns ? (
                    <div className="w-full mt-auto">
                      <div className={`px-1 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-center leading-tight flex items-center justify-center gap-0.5 ${
                        isSelected 
                          ? 'bg-black/30 text-white' 
                          : 'bg-brand/15 dark:bg-brand/20 text-brand border border-brand/30'
                      }`}>
                        <Footprints className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{cellRunCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#20202E] text-[11px] text-slate-500 dark:text-dark-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-orange-glow" />
                <span>วันที่มีรอบวิ่ง</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400/40 border border-brand" />
                <span>วันนี้</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-[#252535]" />
                <span>วันที่เลือก</span>
              </span>
            </div>
            
            <span className="font-mono text-xs">
              เลือก: {formatThaiDate(selectedDate)}
            </span>
          </div>

        </div>

        {/* Right Column: Selected Date Metrics & Save Action (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Selected Date Summary Banner */}
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-5 shadow-sm dark:shadow-card-dark transition-colors">
            
            <div className="border-b border-slate-100 dark:border-[#20202E] pb-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                  ข้อมูลประจำวัน (Daily Summary)
                </span>
                {selectedDateKey === todayKey && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold">
                    วันนี้ (Today)
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatThaiFullDate(selectedDate)}
              </h3>
            </div>

            {/* 4 Mini Stat Metrics for Selected Date */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-muted mb-1">
                  <Footprints className="w-3.5 h-3.5 text-brand" />
                  <span>รอบวิ่งทั้งหมด</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {dayStats.totalRuns} <span className="text-xs font-normal text-slate-400">รอบ</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {dayStats.totalSteps.toLocaleString()} ก้าว
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-muted mb-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-500" />
                  <span>ระยะทางรวม</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {dayStats.totalDistKm} <span className="text-xs font-normal text-slate-400">กม.</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  อิง 1.25 ม./ก้าว
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-muted mb-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  <span>ความเร็วเฉลี่ย</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {dayStats.avgSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
                </p>
                <p className="text-[10px] text-amber-500 font-mono mt-0.5">
                  เพซ {dayStats.avgPace} /km
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-muted mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>แคลอรี่รวม</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {dayStats.totalCal} <span className="text-xs font-normal text-slate-400">kcal</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  เผาผลาญจริง
                </p>
              </div>

            </div>

            {/* Smart Sync & Save Status Card */}
            {isAlreadySaved ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>ข้อมูลการวิ่งของวันนี้บันทึกเข้าปฏิทินเรียบร้อยแล้ว (อัตโนมัติ)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold">
                    {formatThaiDate(selectedDate)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  ระบบได้รวบรวมข้อมูลการวิ่งทั้งหมด {selectedDayRuns.length} รอบ ({dayStats.totalSteps.toLocaleString()} ก้าว • {dayStats.totalDistKm} กม.) บันทึกและแสดงผลในสรุปสถิติประจำวันให้อัตโนมัติแล้ว
                </p>
              </div>
            ) : hasUnsavedLiveRun ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-brand/5 via-orange-500/10 to-amber-500/5 border border-brand/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                    <span>ดึงข้อมูลรอบสดเข้าสรุปปฏิทินของวันนี้อัตโนมัติ</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/20 text-brand font-semibold">
                    {formatThaiDate(selectedDate)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  ข้อมูลรอบสดจากบอร์ด: <strong className="text-brand font-mono">{activeRun?.steps || 0}</strong> ก้าว • <strong className="text-slate-900 dark:text-white font-mono">{activeRun?.distanceKm || 0}</strong> กม. • ความเร็ว <strong className="text-amber-500 font-mono">{activeRun?.avgSpeedKmh || 0}</strong> km/h (ระบบคำนวณรวมในสรุปด้านบนให้อัตโนมัติแล้ว)
                </p>

                <button
                  onClick={handleSaveToSelectedDate}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกผลการวิ่งลงในวันที่ {formatThaiDate(selectedDate)}</span>
                </button>
              </div>
            ) : isToday ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638] flex items-center justify-between text-xs text-slate-500 dark:text-dark-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ปฏิทินซิงค์ข้อมูลกับแดชบอร์ดอัตโนมัติแล้ว ({selectedDayRuns.length} รอบ)</span>
                </div>
                <span className="font-mono text-[11px] text-brand font-bold">{dayStats.totalSteps.toLocaleString()} ก้าว</span>
              </div>
            ) : null}

          </div>

          {/* Toggle between "Selected Day Runs" and "All Runs" */}
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-200/70 dark:bg-[#161622] border border-slate-200 dark:border-[#262638] text-xs font-bold">
            <button
              onClick={() => setViewMode('selected_day')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                viewMode === 'selected_day'
                  ? 'bg-white dark:bg-[#202030] text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              เฉพาะวันที่เลือก ({selectedDayRuns.length} รอบ)
            </button>
            <button
              onClick={() => setViewMode('all_days')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                viewMode === 'all_days'
                  ? 'bg-white dark:bg-[#202030] text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              ประวัติทั้งหมด ({runs.length} รอบ)
            </button>
          </div>

          {/* Runs List for Selected Date or All Dates */}
          <div className="space-y-3">
            {displayedRuns.length === 0 ? (
              <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-8 text-center space-y-2.5">
                <Footprints className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {viewMode === 'selected_day' 
                    ? `ไม่มีรอบวิ่งในวันที่ ${formatThaiDate(selectedDate)}` 
                    : 'ยังไม่มีประวัติการวิ่งที่บันทึกไว้'}
                </p>
                <p className="text-xs text-slate-500 dark:text-dark-muted max-w-xs mx-auto">
                  ขยับบอร์ด FootPod เพื่อให้นับก้าว จากนั้นกด "บันทึกผลการวิ่งลงในวันที่..." ด้านบนเพื่อบันทึกประวัติ
                </p>
              </div>
            ) : (
              displayedRuns.map((run) => {
                const angleAnalysis = analyzeFootAngle(run.avgFootAngle);
                const isConfirmingDelete = deleteConfirmId === run.id;

                return (
                  <div
                    key={run.id}
                    onClick={() => onSelectRun && onSelectRun(run)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-[#242436] bg-white dark:bg-[#14141E] hover:border-brand/40 transition-all cursor-pointer relative group space-y-3 shadow-sm dark:shadow-card-dark"
                  >
                    {/* Top Row: Title, Date & Speed */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                            {run.title}
                          </h4>
                          {run.isRealHardwareData && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              ESP32 Live
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-dark-muted flex items-center gap-1.5 mt-0.5">
                          <CalendarIcon className="w-3 h-3 text-brand" />
                          <span>{formatRunDateTime(run)}</span>
                        </p>
                      </div>

                      {/* Speed Badge */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-500 font-mono">
                          {run.avgSpeedKmh !== undefined ? run.avgSpeedKmh : (run.avgCadence ? ((run.avgCadence * 1.25 * 60) / 1000).toFixed(1) : 0)} km/h
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          เพซ {run.avgPace || speedToPace(run.avgSpeedKmh || 0)}/km
                        </p>
                      </div>
                    </div>

                    {/* Metrics Badges: Steps, Distance, Calories, Angle, Impact */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1A1A28] border border-slate-100 dark:border-[#2A2A3E]">
                        <span className="text-slate-400 block">ก้าว</span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">
                          {(run.steps || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1A1A28] border border-slate-100 dark:border-[#2A2A3E]">
                        <span className="text-slate-400 block">ระยะทาง</span>
                        <span className="font-bold text-blue-500 font-mono">
                          {run.distanceKm || 0} km
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1A1A28] border border-slate-100 dark:border-[#2A2A3E]">
                        <span className="text-slate-400 block">แคลอรี่</span>
                        <span className="font-bold text-rose-500 font-mono">
                          {run.caloriesBurned || 0} kcal
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1A1A28] border border-slate-100 dark:border-[#2A2A3E]">
                        <span className="text-slate-400 block">แรงกระแทก</span>
                        <span className="font-bold text-purple-500 font-mono">
                          {run.impactG || 1.0} G
                        </span>
                      </div>
                    </div>

                    {/* Actions: View Details, Edit, Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#20202E] text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{run.durationMinutes || 0} นาที</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail && onOpenDetail(run);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1A28] text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-brand/10 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          title="ดูรายละเอียดเชิงลึก"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>รายละเอียด</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEdit && onOpenEdit(run);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1A1A28] text-slate-600 dark:text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="แก้ไขรอบวิ่ง"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRun && onDeleteRun(run.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                            >
                              ลบ
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[10px]"
                            >
                              ไม่
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(run.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1A1A28] text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="ลบรอบวิ่งนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
