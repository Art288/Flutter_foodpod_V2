import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Scale, Ruler, X, Check, Save, Calendar, Users } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    age: currentUser?.age || 28,
    gender: currentUser?.gender || 'ชาย (Male)',
    weightKg: currentUser?.weightKg || 65,
    heightCm: currentUser?.heightCm || 170,
    footSide: currentUser?.footSide || 'ขวา (Right Foot)'
  });

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      weightKg: Number(formData.weightKg),
      heightCm: Number(formData.heightCm),
      footSide: formData.footSide
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#14141E] border border-[#2B2B38] rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ข้อมูลส่วนตัว & กายภาพ</h3>
            <p className="text-xs text-dark-muted">ใช้สำหรับคำนวณแคลอรี่และวิเคราะห์แรงกระแทก</p>
          </div>
        </div>

        {isSaved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>บันทึกข้อมูลส่วนตัวสำเร็จ ระบบจะคำนวณแคลอรี่ใหม่อัตโนมัติ</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                อายุ (ปี)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                เพศ (Gender)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs focus:border-brand focus:outline-none"
              >
                <option value="ชาย (Male)">ชาย (Male)</option>
                <option value="หญิง (Female)">หญิง (Female)</option>
                <option value="ไม่ระบุ (Other)">ไม่ระบุ (Other)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                น้ำหนักตัว (กก.)
              </label>
              <input
                type="number"
                min="30"
                max="200"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ส่วนสูง (ซม.)
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ตำแหน่งติดตั้งเซนเซอร์ FootPod
            </label>
            <select
              value={formData.footSide}
              onChange={(e) => setFormData({ ...formData, footSide: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
            >
              <option value="ขวา (Right Foot)">รองเท้าข้างขวา (Right Foot)</option>
              <option value="ซ้าย (Left Foot)">รองเท้าข้างซ้าย (Left Foot)</option>
            </select>
          </div>

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
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
