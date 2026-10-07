import React from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Navigation, 
  Gauge, 
  Activity, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Check, 
  Footprints,
  FileText
} from 'lucide-react';
import { analyzeFootAngle } from '../../utils/calculations';
import { formatRunDateTime } from '../../utils/dateUtils';

export const RunDetailModal = ({ 
  isOpen, 
  onClose, 
  run, 
  onEdit, 
  onDelete, 
  onSelectAsActive,
  isActive 
}) => {
  if (!isOpen || !run) return null;

  const angleAnalysis = analyzeFootAngle(run.avgFootAngle);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#242436]">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase flex items-center gap-1">
                <span>🔵</span> ข้อมูลจริงจากบอร์ด ESP32
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 border border-brand/30 text-brand uppercase">
                {run.mode === 'fitness' ? 'โหมดวิ่งออกกำลังกาย' : 'โหมดวิ่งมาราธอน'}
              </span>
              <span className="text-xs text-dark-muted">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand" />
                {run.locationName || 'เส้นทางวิ่ง'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {run.title}
            </h2>
            <p className="text-xs text-dark-muted flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span>วันเวลาที่บันทึก: <strong className="text-slate-300">{formatRunDateTime(run)}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Edit Button */}
            <button
              onClick={() => onEdit(run)}
              className="px-3 py-1.5 rounded-xl bg-[#1B1B26] hover:bg-brand/20 border border-[#2D2D3E] hover:border-brand/40 text-xs font-semibold text-slate-300 hover:text-brand transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(run.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบ</span>
            </button>
          </div>
        </div>

        {/* 5 Core Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          
          <div className="bg-[#101017] border border-[#222232] rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              จำนวนก้าว
            </span>
            <p className="text-2xl font-black text-white font-mono">{(run.steps || 0).toLocaleString()}</p>
            <span className="text-[10px] text-emerald-400 font-semibold">ก้าว (Impact)</span>
          </div>

          <div className="bg-[#101017] border border-[#222232] rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              ความเร็วเฉลี่ย
            </span>
            <p className="text-2xl font-black text-white font-mono">
              {(run.avgSpeedKmh || (run.avgCadence ? (run.avgCadence * 1.25 * 60) / 1000 : 0)).toFixed(1)}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold">
              km/h {run.avgPace && run.avgPace !== "--'--\"" ? `• เพซ ${run.avgPace}` : ''}
            </span>
          </div>

          <div className="bg-[#101017] border border-[#222232] rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              ระยะทางสะสม
            </span>
            <p className="text-2xl font-black text-white font-mono">{(run.distanceKm || ((run.steps || 0) * 1.25 / 1000)).toFixed(2)}</p>
            <span className="text-[10px] text-blue-400 font-semibold">km (1.25 ม./ก้าว)</span>
          </div>

          <div className="bg-[#101017] border border-[#222232] rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-brand" />
              องศาการงอเท้า
            </span>
            <p className="text-2xl font-black text-white font-mono">{run.avgFootAngle}°</p>
            <span className={`text-[10px] font-semibold ${angleAnalysis.textColor}`}>
              {angleAnalysis.safetyZone}
            </span>
          </div>

          <div className="bg-[#101017] border border-[#222232] rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              แรงกระแทกเท้า
            </span>
            <p className="text-2xl font-black text-white font-mono">{(run.impactG || 1.25).toFixed(2)}</p>
            <span className="text-[10px] text-purple-400 font-semibold">G-Force • รอบขา {run.avgCadence || 0} SPM</span>
          </div>

        </div>

        {/* Biomechanical Breakdown */}
        <div className="bg-[#111118] border border-[#232332] rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-brand" />
              สัดส่วนการลงน้ำหนักเท้า (Strike Distribution)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${angleAnalysis.bgColor} ${angleAnalysis.textColor} border ${angleAnalysis.borderColor}`}>
              {angleAnalysis.label}
            </span>
          </div>

          {run.strikeDistribution && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#161622] p-2.5 rounded-lg border border-[#28283A]">
                <p className="text-[10px] text-amber-400">ปลายเท้า (Forefoot)</p>
                <p className="text-base font-bold text-white mt-0.5">{run.strikeDistribution.forefoot}%</p>
              </div>
              <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/30">
                <p className="text-[10px] text-emerald-400 font-semibold">กลางเท้า (Midfoot Safe)</p>
                <p className="text-base font-bold text-emerald-300 mt-0.5">{run.strikeDistribution.midfoot}%</p>
              </div>
              <div className="bg-[#161622] p-2.5 rounded-lg border border-[#28283A]">
                <p className="text-[10px] text-orange-400">ส้นเท้า (Heel)</p>
                <p className="text-base font-bold text-white mt-0.5">{run.strikeDistribution.heel}%</p>
              </div>
            </div>
          )}

          {/* Notes Callout */}
          {run.notes && (
            <div className="p-3 bg-[#161622] rounded-lg border border-[#252535] text-xs text-slate-300 flex items-start gap-2">
              <FileText className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">บันทึกชีวกลศาสตร์:</strong> {run.notes}
              </div>
            </div>
          )}
        </div>

        {/* Action Bottom */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={() => {
              onSelectAsActive(run);
              onClose();
            }}
            disabled={isActive}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              isActive
                ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 cursor-default'
                : 'orange-btn-gradient text-white shadow-orange-glow hover:shadow-orange-glow-lg'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isActive ? 'กำลังแสดงผลบนแดชบอร์ดหลัก' : 'เลือกแสดงผลบนแดชบอร์ด'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
