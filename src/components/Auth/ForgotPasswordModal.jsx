import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, X, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = '' }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email || !email.includes('@')) {
      setStatus({ type: 'error', message: 'กรุณากรอกอีเมลที่ถูกต้อง' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email, newPassword);
      setIsLoading(false);

      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (err) {
      setIsLoading(false);
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#14141C] border border-[#2B2B38] rounded-2xl p-6 shadow-2xl">
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
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ลืมรหัสผ่าน (Reset Password)</h3>
            <p className="text-xs text-dark-muted">ตั้งรหัสผ่านใหม่สำหรับบัญชี FootPod ของคุณ</p>
          </div>
        </div>

        {/* Status Messages */}
        {status.type === 'error' && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}
        {status.type === 'success' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-3.5">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              อีเมลที่ใช้สมัคร
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@example.com"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-[#181822] border border-[#2B2B38] rounded-xl text-white text-xs sm:text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl orange-btn-gradient text-white text-xs font-semibold shadow-orange-glow transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'บันทึกรหัสผ่านใหม่'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
