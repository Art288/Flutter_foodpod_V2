import React, { useState, useEffect } from 'react';
import { Edit3, X, Save, Navigation, Gauge, Activity, Flame, Clock, FileText, Check, Calendar } from 'lucide-react';
import { calculateCalories, speedToPace, analyzeFootAngle } from '../../utils/calculations';
import { getRunDateKey, toDateKey } from '../../utils/dateUtils';

export const EditRunModal = ({ isOpen, onClose, run, onSave, userWeight = 65 }) => {
  const [formData, setFormData] = useState({
    title: '',
    locationName: '',
    runDate: '',
    distanceKm: 5.0,
    durationMinutes: 30,
    avgSpeedKmh: 8.5,
    avgFootAngle: 21.0,
    notes: ''
  });

  useEffect(() => {
    if (run) {
      setFormData({
        title: run.title || '',
        locationName: run.locationName || '',
        runDate: getRunDateKey(run) || toDateKey(new Date()),
        distanceKm: run.distanceKm || 5.0,
        durationMinutes: run.durationMinutes || 30,
        avgSpeedKmh: run.avgSpeedKmh || 8.5,
        avgFootAngle: run.avgFootAngle || 21.0,
        notes: run.notes || ''
      });
    }
  }, [run, isOpen]);

  if (!isOpen || !run) return null;

  // Compute preview calories & pace
  const previewCalories = calculateCalories(
    Number(formData.distanceKm),
    Number(formData.avgSpeedKmh),
    userWeight,
    Number(formData.avgFootAngle)
  );
  const previewPace = speedToPace(Number(formData.avgSpeedKmh));
  const angleAnalysis = analyzeFootAngle(Number(formData.avgFootAngle));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpeedChange = (e) => {
    const spd = parseFloat(e.target.value) || 0;
    const dist = parseFloat(formData.distanceKm) || 0;
    const dur = spd > 0 && dist > 0 ? Math.round((dist / spd) * 60) : formData.durationMinutes;
    setFormData(prev => ({
      ...prev,
      avgSpeedKmh: spd,
      durationMinutes: dur
    }));
  };

  const handleDistanceChange = (e) => {
    const dist = parseFloat(e.target.value) || 0;
    const spd = parseFloat(formData.avgSpeedKmh) || 1;
    const dur = spd > 0 && dist > 0 ? Math.round((dist / spd) * 60) : formData.durationMinutes;
    setFormData(prev => ({
      ...prev,
      distanceKm: dist,
      durationMinutes: dur
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let dateFormatted = run.dateFormatted;
    let dateKey = run.dateKey || formData.runDate;
    let timestamp = run.timestamp || Date.now();

    if (formData.runDate && formData.runDate !== getRunDateKey(run)) {
      const parts = formData.runDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const targetD = new Date(y, m, d);
        dateKey = formData.runDate;
        timestamp = targetD.getTime();
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const timeMatch = run.dateFormatted ? run.dateFormatted.match(/\d{2}:\d{2}\s*น\./) : null;
        const timeStr = timeMatch ? timeMatch[0] : '12:00 น.';
        dateFormatted = `${d} ${thaiMonths[m]} ${y + 543}, ${timeStr}`;
      }
    }

    const updatedRun = {
      ...run,
      title: formData.title.trim() || run.title,
      locationName: formData.locationName.trim() || 'เส้นทางวิ่ง',
      dateKey: dateKey,
      timestamp: timestamp,
      dateFormatted: dateFormatted,
      distanceKm: Number(formData.distanceKm),
      durationMinutes: Number(formData.durationMinutes),
      avgSpeedKmh: Number(formData.avgSpeedKmh),
      avgPace: previewPace,
      avgFootAngle: Number(formData.avgFootAngle),
      caloriesBurned: previewCalories,
      notes: formData.notes.trim()
    };

    onSave(updatedRun);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#14141E] border border-[#2A2A3A] rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">แก้ไขข้อมูลรอบวิ่ง (Edit Run Session)</h3>
            <p className="text-xs text-dark-muted">บันทึกเมื่อ: {run.dateFormatted}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              ชื่อรอบวิ่ง / กิจกรรม
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="เช่น การวิ่งตอนเช้า - สวนลุมพินี"
              required
              className="w-full px-3.5 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              สถานที่ / เส้นทางวิ่ง
            </label>
            <input
              type="text"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="เช่น สวนจตุจักร กรุงเทพฯ"
              className="w-full px-3.5 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {/* Activity Date Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              วันที่ทำกิจกรรม (Date)
            </label>
            <input
              type="date"
              name="runDate"
              value={formData.runDate}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm font-mono focus:border-brand focus:outline-none"
            />
          </div>

          {/* Distance & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                ระยะทาง (กม.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="200"
                name="distanceKm"
                value={formData.distanceKm}
                onChange={handleDistanceChange}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                เวลาที่ใช้ (นาที)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Speed & Foot Angle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                ความเร็วเฉลี่ย (km/h)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="35"
                name="avgSpeedKmh"
                value={formData.avgSpeedKmh}
                onChange={handleSpeedChange}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm font-mono focus:border-brand focus:outline-none"
              />
              <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                Pace คำนวณ: {previewPace} /km
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-brand" />
                องศาการงอเท้าเฉลี่ย (°)
              </label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="45"
                name="avgFootAngle"
                value={formData.avgFootAngle}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm font-mono focus:border-brand focus:outline-none"
              />
              <span className={`text-[10px] font-semibold mt-0.5 block ${angleAnalysis.textColor}`}>
                {angleAnalysis.safetyZone}
              </span>
            </div>
          </div>

          {/* Dynamic Calories Preview */}
          <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Flame className="w-4 h-4 text-brand" />
              แคลอรี่ที่คำนวณใหม่อัตโนมัติ (Dynamic MET):
            </span>
            <span className="text-sm font-bold text-brand font-mono">
              {previewCalories} kcal
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              บันทึกข้อความ / ความรู้สึกหลังวิ่ง
            </label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              placeholder="บันทึกความรู้สึก อาการล้า หรือสภาพอากาศ..."
              className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs focus:border-brand focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl orange-btn-gradient text-white text-xs font-semibold shadow-orange-glow flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขรอบวิ่ง</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
