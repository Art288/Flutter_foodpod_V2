import React from 'react';
import { Target, ArrowRight, Flame, Navigation } from 'lucide-react';

export const GoalProgressCard = ({ goal, currentRun, onOpenGoalModal }) => {
  if (!goal) return null;

  const currentDist = currentRun?.distanceKm || 0;
  const targetDist = goal.targetDistanceKm || 5.0;
  const distanceProgressPercent = Math.min(100, Math.round((currentDist / targetDist) * 100));

  const currentCalories = currentRun?.caloriesBurned || 0;
  const targetCalories = goal.targetCalories || 400;
  const calorieProgressPercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  return (
    <div className="bg-white dark:bg-[#13131B] border border-slate-200 dark:border-[#262638] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-colors">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              เป้าหมาย: {goal.modeName}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted">
              เป้าหมาย {goal.targetDistanceKm} km • {targetCalories} kcal
            </p>
          </div>
        </div>

        <button
          onClick={onOpenGoalModal}
          className="text-xs font-semibold text-brand hover:underline flex items-center gap-0.5"
        >
          <span>แก้ไข</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 2 Progress Bars: Distance & Calories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* 1. Distance Progress */}
        <div className="space-y-1 bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-500" />
              ระยะ: <strong className="text-slate-900 dark:text-white">{currentDist.toFixed(2)}</strong> / {targetDist} km
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{distanceProgressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-[#181822] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${distanceProgressPercent}%` }}
            />
          </div>
        </div>

        {/* 2. Calorie Burn Progress */}
        <div className="space-y-1 bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-brand" />
              แคลอรี่: <strong className="text-brand">{currentCalories}</strong> / {targetCalories} kcal
            </span>
            <span className="text-brand font-bold">{calorieProgressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-[#181822] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${calorieProgressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
