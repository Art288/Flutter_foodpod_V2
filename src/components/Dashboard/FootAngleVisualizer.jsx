import React from 'react';
import { analyzeFootAngle } from '../../utils/calculations';
import { Footprints, ChevronRight } from 'lucide-react';

export const FootAngleVisualizer = ({ 
  currentAngle = 0.0, 
  strikeDistribution = { forefoot: 0, midfoot: 0, heel: 0 },
  maxAngle = 0.0,
  minAngle = 0.0,
  onOpenHealthData
}) => {
  const isZero = currentAngle === 0;
  const analysis = isZero
    ? {
        label: 'รอข้อมูลเซนเซอร์',
        safetyZone: 'รอการซิงค์',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-500 dark:text-slate-400',
        borderColor: 'border-slate-500/30'
      }
    : analyzeFootAngle(currentAngle);

  // Calculate shoe rotation angle for the SVG graphic (visual pitch)
  const visualRotation = isZero ? 0 : -Math.min(45, Math.max(0, currentAngle - 5));

  return (
    <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-[#20202E]">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Footprints className="w-4 h-4 text-brand" />
          <span>องศาการงอเท้า & การลงน้ำหนัก (Foot Flexion)</span>
        </h3>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${analysis.bgColor} ${analysis.textColor} ${analysis.borderColor}`}>
            {analysis.label}
          </span>
          {onOpenHealthData && (
            <button
              onClick={onOpenHealthData}
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-0.5 ml-1"
            >
              <span>ข้อมูลสุขภาพ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Visual 2D Shoe Graphic */}
        <div className="lg:col-span-6 bg-slate-900 dark:bg-[#0E0E14] border border-slate-800 dark:border-[#1E1E2A] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Ground Line */}
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#4B5563] to-transparent absolute bottom-8" />

          {/* Animated Shoe SVG */}
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div 
              className="transition-transform duration-700 ease-out origin-bottom-right"
              style={{ transform: `rotate(${visualRotation}deg)` }}
            >
              <svg className="w-48 h-28 sm:w-56 h-32 drop-shadow-2xl" viewBox="0 0 240 120" fill="none">
                <path 
                  d="M20 95 C40 95, 70 95, 110 95 C150 95, 190 92, 220 80 C226 78, 228 72, 220 68 C200 60, 160 55, 130 55 C100 55, 60 62, 30 75 C20 79, 15 88, 20 95 Z" 
                  fill="#1C1C26" 
                  stroke="#FF6600" 
                  strokeWidth="2.5"
                />
                <path 
                  d="M22 93 C60 93, 110 93, 150 92 C185 90, 208 82, 218 78 C210 74, 180 70, 140 70 C100 70, 50 78, 25 86 Z" 
                  fill="#FF6600" 
                  opacity="0.3"
                />
                <path 
                  d="M35 73 C45 50, 70 30, 95 28 C105 28, 115 35, 120 48 C135 48, 170 52, 195 62 C205 66, 210 70, 210 74 C185 68, 140 64, 105 64 C70 64, 45 68, 35 73 Z" 
                  fill="#2A2A3A" 
                  stroke="#404058" 
                  strokeWidth="1.5"
                />
                <rect x="105" y="40" width="24" height="14" rx="4" fill="#FF6600" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="117" cy="47" r="2.5" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Protractor Angle Badge */}
            <div className="absolute top-1 right-1 bg-[#171722] border border-[#28283A] px-2.5 py-1 rounded-xl text-center">
              <span className="text-lg font-black text-white font-mono">{currentAngle.toFixed(1)}°</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
            <span>ต่ำสุด: <strong className="text-white">{minAngle}°</strong></span>
            <span>สูงสุด: <strong className="text-white">{maxAngle}°</strong></span>
          </div>
        </div>

        {/* Right Column: Angle Scale Bar & Clean Distribution */}
        <div className="lg:col-span-6 space-y-3.5">
          
          {/* Angle Scale Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">ระดับองศาการงอเท้า</span>
              <span className="text-xs text-brand font-bold">{currentAngle.toFixed(1)}°</span>
            </div>

            <div className="h-3 w-full bg-slate-200 dark:bg-[#181822] rounded-full overflow-hidden p-0.5 flex gap-0.5 border border-slate-300 dark:border-[#2B2B38]">
              <div className="h-full bg-amber-500 rounded-l-full" style={{ width: '25%' }} title="0°-14° ปลายเท้า" />
              <div className="h-full bg-emerald-500 rounded-sm" style={{ width: '35%' }} title="15°-25° Safe Zone กลางเท้า" />
              <div className="h-full bg-orange-500 rounded-sm" style={{ width: '20%' }} title="26°-32° ส้นเท้า" />
              <div className="h-full bg-rose-500 rounded-r-full" style={{ width: '20%' }} title=">35° Overstride" />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 dark:text-dark-muted font-mono pt-0.5">
              <span>0° ปลายเท้า</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">15°-25° (Safe Zone)</span>
              <span>&gt;32° ส้นเท้า</span>
            </div>
          </div>

          {/* Clean Strike Pattern Distribution (3 simple pills) */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50 dark:bg-[#151520] p-2 rounded-xl border border-slate-200 dark:border-[#252535]">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">ปลายเท้า</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{strikeDistribution.forefoot}%</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-300 dark:border-emerald-500/30">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">กลางเท้า (แนะนำ)</p>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{strikeDistribution.midfoot}%</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#151520] p-2 rounded-xl border border-slate-200 dark:border-[#252535]">
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">ส้นเท้า</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{strikeDistribution.heel}%</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
