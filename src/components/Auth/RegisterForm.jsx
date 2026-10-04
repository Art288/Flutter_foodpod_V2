import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Scale, Ruler, UserPlus, AlertCircle, CheckCircle2, ArrowLeft, Calendar, Users } from 'lucide-react';
import { FootPodLogo } from '../Common/FootPodLogo';

export const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const { register } = useAuth();

  // Set default values for age, weight, and height to 0 as requested by user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'ชาย (Male)',
    weightKg: '',
    heightCm: '',
    footSide: 'ขวา (Right Foot)'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!formData.name.trim()) {
      setErrorMessage('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (Number(formData.age) <= 0 || Number(formData.age) > 120) {
      setErrorMessage('กรุณากรอกอายุให้ถูกต้อง (มากกว่า 0 ปี)');
      return;
    }
    if (Number(formData.weightKg) <= 0) {
      setErrorMessage('กรุณากรอกน้ำหนักตัวให้ถูกต้อง (มากกว่า 0 กก.) เพื่อใช้คำนวณแคลอรี่');
      return;
    }
    if (Number(formData.heightCm) <= 0) {
      setErrorMessage('กรุณากรอกส่วนสูงให้ถูกต้อง (มากกว่า 0 ซม.)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        setSuccessMessage(result.message);
        setTimeout(() => {
          onRegisterSuccess(formData.email);
        }, 1200);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with FootPod Logo */}
      <div className="text-center mb-5">
        <div className="mb-3 flex justify-center">
          <FootPodLogo size="md" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white dark:text-white text-slate-900 tracking-tight lowercase">
          สมัครสมาชิก foot <span className="text-brand">pod</span>
        </h2>
        <p className="text-dark-muted dark:text-dark-muted text-slate-500 text-xs mt-1">
          สร้างบัญชีเพื่อบันทึกและวิเคราะห์ข้อมูลการงอเท้าของคุณ
        </p>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">ไม่สามารถสมัครสมาชิกได้</p>
            <p className="mt-0.5 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 animate-pulse-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">สมัครสมาชิกสำเร็จ!</p>
            <p className="text-xs text-emerald-300/90 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
            ชื่อ-นามสกุล
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="สมชาย ใจดี"
              required
              className="w-full pl-10 pr-4 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
            อีเมล (Email)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="runner@example.com"
              required
              className="w-full pl-10 pr-4 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="อย่างน้อย 6 ตัว"
                required
                className="w-full pl-8 pr-7 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="พิมพ์อีกครั้ง"
                required
                className="w-full pl-8 pr-3 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-xs"
              />
            </div>
          </div>
        </div>

        {/* Age & Gender Fields (Age defaulted to 0) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
              อายุ (ปี)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="เช่น 28"
                className="w-full pl-8 pr-3 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1">
              เพศ (Gender)
            </label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#15151D] dark:bg-[#15151D] bg-slate-50 border border-[#2B2B38] dark:border-[#2B2B38] border-slate-300 rounded-xl text-white dark:text-white text-slate-900 text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="ชาย (Male)">ชาย (Male)</option>
                <option value="หญิง (Female)">หญิง (Female)</option>
                <option value="ไม่ระบุ (Other)">ไม่ระบุ (Other)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Biometrics for Calorie Calculation */}
        <div className="p-3 bg-[#171722] dark:bg-[#171722] bg-slate-100 rounded-xl border border-[#262635] dark:border-[#262635] border-slate-200 space-y-2.5">
          <p className="text-xs font-semibold text-brand flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            ข้อมูลกายภาพ (สำหรับคำนวณแคลอรี่และชีวกลศาสตร์)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-300 dark:text-slate-300 text-slate-600 mb-1">
                น้ำหนัก (กก.)
              </label>
              <input
                type="number"
                name="weightKg"
                min="1"
                max="250"
                value={formData.weightKg}
                onChange={handleChange}
                required
                placeholder="เช่น 65"
                className="w-full px-2.5 py-1.5 bg-[#121218] dark:bg-[#121218] bg-white border border-[#2D2D3E] dark:border-[#2D2D3E] border-slate-300 rounded-lg text-white dark:text-white text-slate-900 text-xs focus:border-brand focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-300 dark:text-slate-300 text-slate-600 mb-1">
                ส่วนสูง (ซม.)
              </label>
              <input
                type="number"
                name="heightCm"
                min="1"
                max="250"
                value={formData.heightCm}
                onChange={handleChange}
                required
                placeholder="เช่น 170"
                className="w-full px-2.5 py-1.5 bg-[#121218] dark:bg-[#121218] bg-white border border-[#2D2D3E] dark:border-[#2D2D3E] border-slate-300 rounded-lg text-white dark:text-white text-slate-900 text-xs focus:border-brand focus:outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-300 dark:text-slate-300 text-slate-600 mb-1">
              ตำแหน่งติดตั้งเซนเซอร์ FootPod
            </label>
            <select
              name="footSide"
              value={formData.footSide}
              onChange={handleChange}
              className="w-full px-2.5 py-1.5 bg-[#121218] dark:bg-[#121218] bg-white border border-[#2D2D3E] dark:border-[#2D2D3E] border-slate-300 rounded-lg text-white dark:text-white text-slate-900 text-xs focus:border-brand focus:outline-none"
            >
              <option value="ขวา (Right Foot)">รองเท้าข้างขวา (Right Foot - ค่ามาตรฐาน)</option>
              <option value="ซ้าย (Left Foot)">รองเท้าข้างซ้าย (Left Foot)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs sm:text-sm orange-btn-gradient shadow-orange-glow hover:shadow-orange-glow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>ยืนยันการสมัครสมาชิก</span>
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-400 text-slate-500">
        มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-brand hover:text-brand-300 font-semibold underline underline-offset-4 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
};
