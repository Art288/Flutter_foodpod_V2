import React from 'react';
import { Activity, Footprints, Navigation, Zap, ShieldAlert, Gauge } from 'lucide-react';
import { analyzeFootAngle, speedToPace } from '../../utils/calculations';

export const StatCardGrid = ({ 
  steps = 0,
  distanceKm = 0.0,
  speed = 0.0,
  speedKmh = 0.0,
  avgFootAngle = 0.0, 
  cadence = 0,
  impactG = 1.0,
  caloriesBurned = 0,
  durationMinutes = 0
}) => {
  const currentSpeed = speed || speedKmh || (cadence > 0 ? (cadence * 1.25 * 60) / 1000 : 0.0);
  const isZero = avgFootAngle === 0 && steps === 0 && cadence === 0 && currentSpeed === 0;
  const angleAnalysis = isZero 
    ? {
        type: 'รอข้อมูล',
        safetyZone: avgFootAngle === 0 ? 'ระนาบ 0°' : 'รอซิงค์',
        color: '#8E8EA0',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-500 dark:text-slate-400',
        borderColor: 'border-slate-500/30'
      }
    : analyzeFootAngle(avgFootAngle);

  // Impact severity rating
  const getImpactRating = (g) => {
    if (g <= 1.05) return { label: 'ปกติ', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    if (g <= 1.6) return { label: 'กระแทกเบา (Safe)', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (g <= 2.4) return { label: 'กระแทกปานกลาง', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'กระแทกสูง (High)', color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const impactRating = getImpactRating(impactG);
  const distanceMeters = Math.round(distanceKm * 1000);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      {/* 1. Foot Flexion Angle Card */}
      <div className="bg-white dark:bg-[#13131B] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 dark:text-dark-muted flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-brand" />
            องศาการงอเท้า
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${angleAnalysis.bgColor} ${angleAnalysis.textColor} ${angleAnalysis.borderColor}`}>
            {angleAnalysis.safetyZone}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
            {avgFootAngle.toFixed(1)}°
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[#20202E] flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
          <span className="truncate">{angleAnalysis.type}</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">15°-25°</span>
        </div>
      </div>

      {/* 2. Movement Speed Card (ความเร็วที่ใช้ในการเคลื่อนที่) */}
      <div className="bg-white dark:bg-[#13131B] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 dark:text-dark-muted flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-500" />
            ความเร็วที่ใช้ในการเคลื่อนที่
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
            currentSpeed > 0 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }`}>
            {currentSpeed > 0 ? (currentSpeed >= 7.5 ? 'วิ่ง (Running)' : 'เดิน/จ๊อกกิ้ง') : 'หยุดนิ่ง'}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {currentSpeed.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">km/h</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[#20202E] flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
          <span>เพซ: <strong className="text-slate-800 dark:text-slate-200 font-mono">{currentSpeed > 0 ? speedToPace(currentSpeed) : "--'--\""} /km</strong></span>
          <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">{cadence} SPM</span>
        </div>
      </div>

      {/* 3. Running Distance Card (1.25m per step from device) */}
      <div className="bg-white dark:bg-[#13131B] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 dark:text-dark-muted flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-500" />
            ระยะทางสะสม
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            1 ก้าว = 1.25 ม.
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {distanceKm.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">km</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[#20202E] flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
          <span>ระยะทางเมตร</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{distanceMeters.toLocaleString()} เมตร</span>
        </div>
      </div>

      {/* 4. Impact Force & Cadence Card */}
      <div className="bg-white dark:bg-[#13131B] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 dark:text-dark-muted flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-purple-500" />
            แรงกระแทกเท้า
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${impactRating.bg} ${impactRating.color}`}>
            {impactRating.label}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-3xl sm:text-4xl font-black text-purple-500 tracking-tight font-mono">
            {impactG.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-purple-500">G</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[#20202E] flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
          <span>แคลอรี่สะสม</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono">{caloriesBurned} kcal</span>
        </div>
      </div>

    </div>
  );
};
