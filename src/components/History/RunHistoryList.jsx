import React, { useState } from 'react';
import { 
  History, 
  Calendar, 
  Flame, 
  Activity, 
  Gauge, 
  Navigation, 
  Check, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertCircle,
  Footprints,
  Zap
} from 'lucide-react';
import { analyzeFootAngle } from '../../utils/calculations';

export const RunHistoryList = ({ 
  runs = [], 
  activeRunId, 
  onSelectRun, 
  onOpenEdit, 
  onOpenDetail, 
  onDeleteRun,
  onClearAllRuns,
  onOpenCalendar
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleDeleteClick = (e, runId) => {
    e.stopPropagation();
    setDeleteConfirmId(runId);
  };

  const handleConfirmDelete = (e, runId) => {
    e.stopPropagation();
    onDeleteRun(runId);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleConfirmClearAll = () => {
    if (onClearAllRuns) {
      onClearAllRuns();
    }
    setIsClearingAll(false);
  };

  return (
    <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-card-dark transition-colors relative">
      
      {/* Clear All Confirmation Modal/Overlay */}
      {isClearingAll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#181824] border border-slate-200 dark:border-[#2A2A3C] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ยืนยันการล้างประวัติทั้งหมด?
              </h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-dark-muted">
              การกระทำนี้จะลบรายการประวัติการวิ่งทั้งหมดที่บันทึกไว้ในเบราว์เซอร์ เพื่อให้คุณเริ่มบันทึกเฉพาะข้อมูลจริงจากบอร์ดใหม่
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearingAll(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors"
              >
                ล้างข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand" />
            ประวัติการบันทึกข้อมูลการวิ่ง (Recorded Sessions)
          </h3>
          <p className="text-xs text-slate-600 dark:text-dark-muted mt-0.5">
            ข้อมูลจริงทั้งหมดที่บันทึกจากอุปกรณ์ ESP32 และ MicroSD Card
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 transition-all flex items-center gap-1.5 shadow-sm"
              title="เปิดปฏิทินเลือกวันที่และดูรอบวิ่ง"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ปฏิทินเลือกวัน</span>
            </button>
          )}

          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1A1A28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2C2C3E]">
            ทั้งหมด {runs.length} รอบ
          </span>

          {runs.length > 0 && onClearAllRuns && (
            <button
              onClick={() => setIsClearingAll(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1"
              title="ล้างประวัติที่บันทึกไว้ทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติ</span>
            </button>
          )}
        </div>
      </div>

      {/* Runs List */}
      {runs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#222230] rounded-xl space-y-3">
          <History className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            ยังไม่มีประวัติการวิ่งที่บันทึกไว้
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto space-y-1.5 text-left bg-white dark:bg-[#13131C] p-3.5 rounded-lg border border-slate-200 dark:border-[#252535]">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-center mb-1">
              ✨ ระบบไม่มีข้อมูล Mockup (จำลอง) ใดๆ ข้อมูลจะมาจากบอร์ดจริงเท่านั้น:
            </p>
            <p>1. เชื่อมต่อบลูทูธกับบอร์ด <strong className="text-brand">"foot pod"</strong></p>
            <p>2. กดปุ่ม <strong className="text-purple-500">"ดึงข้อมูลจาก SD Card"</strong> เพื่อดึงประวัติการก้าวออฟไลน์</p>
            <p>3. หรือกดปุ่ม <strong className="text-brand">"บันทึกรอบนี้"</strong> บนแถบด้านบน เพื่อบันทึกก้าวและระยะทางจริง (1.25 ม./ก้าว) ล่าสุดเข้าประวัติ</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const isSelected = run.id === activeRunId;
            const angleAnalysis = analyzeFootAngle(run.avgFootAngle);
            const isConfirmingDelete = deleteConfirmId === run.id;

            return (
              <div
                key={run.id}
                onClick={() => onSelectRun(run)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand/10 dark:from-brand/15 via-orange-50/50 dark:via-[#181824] to-white dark:to-[#12121A] border-brand shadow-orange-glow'
                    : 'bg-slate-50 dark:bg-[#151520] border-slate-200 dark:border-[#252535] hover:border-brand/40 hover:bg-slate-100 dark:hover:bg-[#1A1A26]'
                }`}
              >
                {/* Delete Confirmation Overlay */}
                {isConfirmingDelete && (
                  <div 
                    className="absolute inset-0 bg-rose-50 dark:bg-[#171012] border border-rose-500/50 z-20 flex items-center justify-between px-4 sm:px-6 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs sm:text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>ยืนยันการลบรอบวิ่งนี้หรือไม่? ข้อมูลจะถูกลบออกจากประวัติ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelDelete}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-300 text-xs font-semibold"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={(e) => handleConfirmDelete(e, run.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
                      >
                        ยืนยันลบ
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Left: Title & Timestamp */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {run.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                        <span>🔵</span> ข้อมูลจริงจากบอร์ด ESP32
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {run.mode === 'fitness' ? 'ออกกำลังกาย' : 'มาราธอน'}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-white flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          กำลังแสดงผลบนแดชบอร์ด
                        </span>
                      )}
                    </div>
                    
                    {/* Recorded Date/Time */}
                    <p className="text-xs text-slate-600 dark:text-dark-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand" />
                      <span>วันเวลาที่บันทึกข้อมูล: <strong className="text-slate-800 dark:text-slate-300 font-medium">{run.dateFormatted}</strong></span>
                    </p>
                  </div>

                  {/* Right: Metrics Pills & Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    
                    {/* Steps */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Footprints className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-slate-500 dark:text-slate-400">ก้าว:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{(run.steps || 0).toLocaleString()}</strong>
                    </div>

                    {/* Speed & Pace */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-slate-500 dark:text-slate-400">ความเร็ว:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {(run.avgSpeedKmh || (run.avgCadence ? (run.avgCadence * 1.25 * 60) / 1000 : 0)).toFixed(1)} km/h
                      </strong>
                    </div>

                    {/* Distance (1.25m/step) */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-slate-500 dark:text-slate-400">ระยะ:</span>
                      <strong className="text-blue-600 dark:text-blue-300 font-mono">{(run.distanceKm || ((run.steps || 0) * 1.25 / 1000)).toFixed(2)} km</strong>
                    </div>

                    {/* Impact G */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-slate-500 dark:text-slate-400">แรงกระแทก:</span>
                      <strong className="text-purple-600 dark:text-purple-300 font-mono">{(run.impactG || 1.25).toFixed(2)} G</strong>
                    </div>

                    {/* Foot Angle */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Activity className="w-3.5 h-3.5 text-brand" />
                      <span className="text-slate-500 dark:text-slate-400">องศา:</span>
                      <strong className={`font-mono ${angleAnalysis.textColor}`}>{run.avgFootAngle}°</strong>
                    </div>

                    {/* Calories */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#101017] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#242434] text-xs">
                      <Flame className="w-3.5 h-3.5 text-brand" />
                      <span className="text-slate-500 dark:text-slate-400">แคลอรี่:</span>
                      <strong className="text-brand font-mono">{run.caloriesBurned} kcal</strong>
                    </div>

                    {/* Action Buttons: View, Edit, Delete */}
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      
                      {/* View Details Button */}
                      <button
                        onClick={() => onOpenDetail(run)}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#191924] hover:bg-brand/10 dark:hover:bg-brand/20 border border-slate-300 dark:border-[#2A2A3A] hover:border-brand text-slate-700 dark:text-slate-300 hover:text-brand transition-colors"
                        title="ดูข้อมูลละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onOpenEdit(run)}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#191924] hover:bg-brand/10 dark:hover:bg-brand/20 border border-slate-300 dark:border-[#2A2A3A] hover:border-brand text-slate-700 dark:text-slate-300 hover:text-brand transition-colors"
                        title="แก้ไขข้อมูลรอบวิ่ง"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, run.id)}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#191924] hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-slate-300 dark:border-[#2A2A3A] hover:border-rose-400 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="ลบรอบวิ่งนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
