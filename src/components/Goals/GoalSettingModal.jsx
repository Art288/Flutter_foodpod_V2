import React, { useState, useEffect } from 'react';
import { Target, Zap, Shield, Sparkles, X, Check, Heart, Trophy, Info, ChevronRight, Flame } from 'lucide-react';
import { calculateDynamicRecommendation, calculateCalories } from '../../utils/calculations';
import confetti from 'canvas-confetti';

export const GoalSettingModal = ({ isOpen, onClose, currentGoal, onSaveGoal, userWeight = 65 }) => {
  const [mode, setMode] = useState('fitness'); // 'fitness' | 'marathon'
  const [distanceKm, setDistanceKm] = useState(5.0);
  const [customDistanceInput, setCustomDistanceInput] = useState('5.0');
  const [targetCalories, setTargetCalories] = useState(400);
  const [recommendation, setRecommendation] = useState(null);

  // Initialize from existing goal if available
  useEffect(() => {
    if (currentGoal) {
      setMode(currentGoal.mode || 'fitness');
      setDistanceKm(currentGoal.targetDistanceKm || 5.0);
      setCustomDistanceInput(String(currentGoal.targetDistanceKm || 5.0));
      setTargetCalories(currentGoal.targetCalories || 400);
    }
  }, [currentGoal, isOpen]);

  // Recalculate dynamic recommendation whenever mode or distance changes
  useEffect(() => {
    const numDist = parseFloat(customDistanceInput) || 1;
    const rec = calculateDynamicRecommendation(numDist, mode);
    setRecommendation(rec);

    // Estimate realistic calorie burn for this distance as default
    const estCal = calculateCalories(numDist, rec.recommendedSpeedAvg, userWeight, 21.0);
    if (!currentGoal || !currentGoal.targetCalories) {
      setTargetCalories(estCal);
    }
  }, [customDistanceInput, mode, userWeight]);

  if (!isOpen) return null;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'fitness') {
      setDistanceKm(5.0);
      setCustomDistanceInput('5.0');
    } else {
      setDistanceKm(10.5);
      setCustomDistanceInput('10.5');
    }
  };

  const handleDistanceInputChange = (e) => {
    const val = e.target.value;
    setCustomDistanceInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setDistanceKm(parsed);
    }
  };

  const handleQuickDistanceSelect = (dist) => {
    setDistanceKm(dist);
    setCustomDistanceInput(String(dist));
  };

  const handleSave = () => {
    const parsedDist = parseFloat(customDistanceInput) || 5.0;
    const finalRec = calculateDynamicRecommendation(parsedDist, mode);

    const newGoal = {
      mode: mode,
      modeName: mode === 'fitness' ? 'วิ่งออกกำลังกาย (General Fitness)' : 'วิ่งมาราธอน (Marathon Training)',
      targetDistanceKm: parsedDist,
      targetCalories: Number(targetCalories) || 400,
      recommendedSpeedAvg: finalRec.recommendedSpeedAvg,
      recommendedSpeedRange: `${finalRec.recommendedSpeedMin} - ${finalRec.recommendedSpeedMax} km/h`,
      recommendedPace: finalRec.recommendedPace,
      estimatedTimeMinutes: finalRec.estimatedTimeMinutes,
      estimatedTimeString: finalRec.estimatedTimeString,
      targetFootAngle: finalRec.recommendedFootAngle,
      targetCadence: finalRec.recommendedCadence,
      injuryPreventionTip: finalRec.injuryPreventionTip,
      updatedAt: new Date().toISOString()
    };

    onSaveGoal(newGoal);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6600', '#FF9933', '#FFAA00', '#FFFFFF']
      });
    } catch (e) {
      console.log('Confetti effect triggered');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#14141E] border border-[#2B2B3C] rounded-2xl p-6 sm:p-7 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-orange-glow">
            <Target className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ตั้งเป้าหมายการวิ่ง & เผาผลาญแคลอรี่
            </h2>
            <p className="text-xs sm:text-sm text-dark-muted">
              กำหนดระยะทาง เป้าหมายแคลอรี่ และคำนวณความเร็วที่เหมาะสมอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          
          {/* Mode 1: วิ่งออกกำลังกาย */}
          <button
            type="button"
            onClick={() => handleModeChange('fitness')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              mode === 'fitness'
                ? 'bg-gradient-to-br from-brand/20 to-[#1A1A26] border-brand shadow-orange-glow'
                : 'bg-[#181822] border-[#2B2B3A] hover:border-slate-600 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                mode === 'fitness' ? 'bg-brand text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <Heart className="w-4 h-4" />
              </span>
              {mode === 'fitness' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                  กำลังเลือก
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white">1. วิ่งออกกำลังกาย</h3>
            <p className="text-[11px] text-dark-muted mt-1 leading-relaxed">
              สำหรับวิ่งจ็อกกิ้งเพื่อสุขภาพ เผาผลาญไขมัน Zone 2 พร้อมค่าแนะนำ
            </p>
          </button>

          {/* Mode 2: วิ่งมาราธอน */}
          <button
            type="button"
            onClick={() => handleModeChange('marathon')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              mode === 'marathon'
                ? 'bg-gradient-to-br from-brand/20 to-[#1A1A26] border-brand shadow-orange-glow'
                : 'bg-[#181822] border-[#2B2B3A] hover:border-slate-600 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                mode === 'marathon' ? 'bg-brand text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <Trophy className="w-4 h-4" />
              </span>
              {mode === 'marathon' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                  กำลังเลือก
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-white">2. วิ่งมาราธอน</h3>
            <p className="text-[11px] text-dark-muted mt-1 leading-relaxed">
              สำหรับซ้อมระยะไกล Mini / Half / Full Marathon ควบคุม Pace
            </p>
          </button>

        </div>

        {/* Configuration Section (Distance + Calorie Target) */}
        <div className="bg-[#111118] border border-[#232332] rounded-2xl p-4 sm:p-5 mb-5 space-y-4">
          
          {/* 1. Distance Setting */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                กำหนดระยะทางเป้าหมาย (Target Distance)
              </label>
              <span className="text-xs text-brand font-semibold">
                {mode === 'fitness' ? 'โหมดออกกำลังกาย' : 'โหมดมาราธอน'}
              </span>
            </div>

            {/* Quick Distance Presets - Replaced "5กม. (สแตนดาร์ด)" with "5กม. (แนะนำ)" */}
            <div className="flex flex-wrap gap-2 mb-3">
              {mode === 'fitness' ? (
                <>
                  {[
                    { val: 3.0, label: '3 กม.' },
                    { val: 5.0, label: '5 กม. (แนะนำ)' },
                    { val: 7.0, label: '7 กม.' },
                    { val: 10.0, label: '10 กม.' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleQuickDistanceSelect(item.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        parseFloat(customDistanceInput) === item.val
                          ? 'bg-brand border-brand text-white shadow-orange-glow'
                          : 'bg-[#181822] border-[#2C2C3E] text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: 'มินิมาราธอน (10.5 km)', val: 10.5 },
                    { label: 'ฮาล์ฟมาราธอน (21.1 km)', val: 21.1 },
                    { label: 'ฟูลมาราธอน (42.2 km)', val: 42.2 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleQuickDistanceSelect(preset.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        parseFloat(customDistanceInput) === preset.val
                          ? 'bg-brand border-brand text-white shadow-orange-glow'
                          : 'bg-[#181822] border-[#2C2C3E] text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Manual Distance Input Field */}
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="100"
                value={customDistanceInput}
                onChange={handleDistanceInputChange}
                className="w-full pl-4 pr-16 py-2.5 bg-[#181822] border border-[#2D2D3E] focus:border-brand rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="กรอกตัวเลขระยะทาง (กม.)"
              />
              <span className="absolute right-4 top-3 text-xs font-semibold text-brand">
                กิโลเมตร
              </span>
            </div>
          </div>

          {/* 2. Target Calorie Burn Goal (NEW Requirement) */}
          <div className="pt-3 border-t border-[#20202E]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-brand" />
                เป้าหมายเผาผลาญแคลอรี่ (Target Calorie Burn)
              </label>
              <span className="text-[11px] text-slate-400">
                ประเมินจากน้ำหนัก {userWeight} กก.
              </span>
            </div>

            {/* Quick Calorie Presets */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {[300, 450, 600, 800, 1000].map((cal) => (
                <button
                  key={cal}
                  type="button"
                  onClick={() => setTargetCalories(cal)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    Number(targetCalories) === cal
                      ? 'bg-brand/20 border-brand text-brand shadow-sm'
                      : 'bg-[#181822] border-[#2C2C3E] text-slate-400 hover:text-white'
                  }`}
                >
                  {cal} kcal
                </button>
              ))}
            </div>

            {/* Manual Calorie Input */}
            <div className="relative">
              <input
                type="number"
                step="10"
                min="50"
                max="5000"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full pl-4 pr-16 py-2.5 bg-[#181822] border border-[#2D2D3E] focus:border-brand rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="เช่น 400"
              />
              <span className="absolute right-4 top-3 text-xs font-semibold text-brand">
                kcal
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic Speed Recommendation Display */}
        {recommendation && (
          <div className="bg-gradient-to-br from-brand/10 via-[#161622] to-[#121218] border border-brand/40 rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-brand/20 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand" />
                ค่าความไวที่แนะนำอัตโนมัติ (Dynamic Recommended Speed)
              </span>
              <span className="text-[11px] font-mono text-brand font-bold">
                ระยะเป้าหมาย: {recommendation.distanceKm} km • เป้าหมาย {targetCalories} kcal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#12121A] p-3 rounded-xl border border-[#252535]">
                <p className="text-[11px] text-slate-400">ความเร็วแนะนำเฉลี่ย</p>
                <p className="text-xl font-black text-white mt-0.5 font-mono">
                  {recommendation.recommendedSpeedAvg}{' '}
                  <span className="text-xs font-medium text-brand">km/h</span>
                </p>
                <p className="text-[10px] text-dark-muted font-mono mt-0.5">
                  ช่วงปลอดภัย: {recommendation.recommendedSpeedMin} - {recommendation.recommendedSpeedMax} km/h
                </p>
              </div>

              <div className="bg-[#12121A] p-3 rounded-xl border border-[#252535]">
                <p className="text-[11px] text-slate-400">Pace ที่แนะนำต่อ กม.</p>
                <p className="text-xl font-black text-amber-400 mt-0.5 font-mono">
                  {recommendation.recommendedPace}{' '}
                  <span className="text-xs font-medium text-slate-400">/km</span>
                </p>
                <p className="text-[10px] text-dark-muted mt-0.5">
                  เวลาคาดการณ์: ~{recommendation.estimatedTimeMinutes} นาที
                </p>
              </div>

              <div className="bg-[#12121A] p-3 rounded-xl border border-[#252535]">
                <p className="text-[11px] text-slate-400">องศาการงอเท้าเป้าหมาย</p>
                <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">
                  {recommendation.recommendedFootAngle}
                </p>
                <p className="text-[10px] text-dark-muted mt-0.5">
                  รอบขาที่เหมาะสม: {recommendation.recommendedCadence}
                </p>
              </div>
            </div>

            {/* Injury Reduction Advice */}
            <div className="p-3 bg-brand/10 border border-brand/30 rounded-xl text-xs text-slate-200 flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand text-xs">
                  คำแนะนำเพื่อลดอาการบาดเจ็บและเหนื่อยง่าย:
                </p>
                <p className="mt-1 leading-relaxed text-slate-300">
                  {recommendation.injuryPreventionTip}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            ยกเลิก
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-3 px-6 rounded-xl orange-btn-gradient text-white text-sm font-bold shadow-orange-glow hover:shadow-orange-glow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกเป้าหมายนี้</span>
          </button>
        </div>

      </div>
    </div>
  );
};
