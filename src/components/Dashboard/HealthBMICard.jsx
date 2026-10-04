import React from 'react';
import { 
  HeartPulse, 
  Footprints, 
  Flame, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight, 
  ShieldAlert,
  Activity
} from 'lucide-react';
import { calculateBMI } from '../../utils/calculations';

export const HealthBMICard = ({
  currentUser,
  todaySteps = 0,
  todayDistanceKm = 0,
  todayCalories = 0,
  impactG = 1.0,
  onNavigateToSettings
}) => {
  const weight = currentUser?.weightKg || 65;
  const height = currentUser?.heightCm || 170;

  // Calculate BMI and recommended targets
  const bmiData = calculateBMI(weight, height);

  const stepTarget = 10000;
  const stepProgressPercent = Math.min(100, Math.round((todaySteps / stepTarget) * 100));

  // Calories needed for 1 kg fat loss ~ 7,700 kcal
  const caloriesPerKgFat = 7700;
  const caloriesToBurnTotal = Math.round(Math.abs(bmiData.weightDiffKg) * caloriesPerKgFat);
  const runsNeededToTarget = (todayCalories > 0 && bmiData.weightDiffKg > 0)
    ? Math.ceil(caloriesToBurnTotal / (todayCalories || 350))
    : null;

  return (
    <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-colors space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20202E]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              การวิเคราะห์สุขภาพ BMI & สรุปกิจกรรมวันนี้
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted">
              น้ำหนัก {weight} กก. • ส่วนสูง {height} ซม.
            </p>
          </div>
        </div>

        {onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className="text-xs font-semibold text-brand hover:underline flex items-center gap-0.5"
          >
            <span>แก้ไขข้อมูลสุขภาพ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row 1: Today's Core Highlights (Steps & Calories) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* 1. Today's Step Count */}
        <div className="bg-slate-50 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#222230] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-emerald-500" />
              จำนวนก้าววันนี้ (ESP32-C3 Impact)
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
              เป้าหมาย 10,000 ก้าว
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {todaySteps.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">ก้าว</span>
          </div>

          {/* Step Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-200 dark:bg-[#181822] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${stepProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-dark-muted font-mono">
              <span>{stepProgressPercent}% ของเป้าหมาย</span>
              <span className="text-blue-500 font-semibold">{todayDistanceKm.toFixed(2)} km ({Math.round(todayDistanceKm * 1000)} ม.)</span>
            </div>
          </div>
        </div>

        {/* 2. Today's Calorie Burn */}
        <div className="bg-slate-50 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#222230] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              แคลอรี่ที่เผาผลาญในวันนี้
            </span>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 font-mono">
              คำนวณจากก้าวเดิน
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-orange-500 font-mono tracking-tight">
              {todayCalories.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-orange-500">kcal</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {todayCalories > 0 
              ? `คำนวณจากน้ำหนัก ${weight} กก. และจำนวน ${todaySteps.toLocaleString()} ก้าวที่กระแทกพื้น`
              : 'รอการซิงค์ข้อมูลรอบวิ่งจากเซนเซอร์ FootPod'}
          </p>
        </div>

      </div>

      {/* Row 2: Smart BMI Target & Weight Recommendation */}
      <div className="bg-slate-50 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#222230] rounded-xl p-3.5 space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              ดัชนีมวลกายปัจจุบัน (BMI)
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${bmiData.bgColor} ${bmiData.textColor} ${bmiData.borderColor}`}>
              {bmiData.category}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400">
              BMI ปัจจุบัน: <strong className="text-slate-900 dark:text-white text-sm">{bmiData.bmi}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              เป้าหมายแนะนำ: {bmiData.targetBMI}
            </span>
          </div>
        </div>

        {/* BMI Health Advice Message */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-[#161622] border border-slate-200 dark:border-[#2B2B3C] flex items-start gap-2 text-xs">
          {bmiData.direction === 'lose' ? (
            <TrendingDown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          ) : bmiData.direction === 'gain' ? (
            <TrendingUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          )}

          <div className="space-y-0.5">
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {bmiData.advice}
            </p>
            {bmiData.direction === 'lose' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 การลดน้ำหนัก {bmiData.weightDiffKg} กก. จะช่วยลดแรงกระแทกที่ข้อเข่าและข้อเท้าลงได้ถึง {(bmiData.weightDiffKg * 4).toFixed(0)} กก. ในทุกๆ ก้าววิ่ง!
                {runsNeededToTarget && ` (ประมาณการสะสมอีก ~${runsNeededToTarget} ครั้ง)`}
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
