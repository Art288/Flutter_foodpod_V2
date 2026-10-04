import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { FootPodLogo } from '../Common/FootPodLogo';

export const LoginForm = ({ onSwitchToRegister, onOpenForgotPassword, initialEmail = '' }) => {
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim() || !password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        setLoginSuccess(true);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      setIsGoogleLoading(false);
      if (result && result.success) {
        setLoginSuccess(true);
      } else if (result && result.message) {
        setErrorMessage(result.message);
      }
    } catch (err) {
      setIsGoogleLoading(false);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    }
  };

  const handleFillDemo = () => {
    setEmail('runner@footpod.io');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with beautiful FootPod Logo */}
      <div className="text-center mb-7">
        <div className="mb-4 flex justify-center">
          <FootPodLogo size="md" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight lowercase">
          เข้าสู่ระบบ foot <span className="text-brand">pod</span>
        </h2>
        <p className="text-dark-muted text-xs sm:text-sm mt-1.5">
          เชื่อมต่อข้อมูลการวิ่ง วิเคราะห์องศาการงอเท้าและแคลอรี่
        </p>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">การเข้าสู่ระบบไม่สำเร็จ</p>
            <p className="mt-0.5 text-xs sm:text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {loginSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>เข้าสู่ระบบสำเร็จ กำลังเข้าสู่แดชบอร์ด...</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            อีเมล (Email)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="example@email.com"
              required
              className="w-full pl-11 pr-4 py-3 bg-[#15151D] border border-[#2B2B38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              รหัสผ่าน (Password)
            </label>
            <button
              type="button"
              onClick={onOpenForgotPassword}
              className="text-xs text-brand hover:text-brand-300 font-medium transition-colors"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="••••••••"
              required
              className="w-full pl-11 pr-11 py-3 bg-[#15151D] border border-[#2B2B38] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember me & Demo button */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand focus:ring-brand focus:ring-offset-0"
            />
            <span>จดจำการเข้าสู่ระบบ</span>
          </label>

          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs text-slate-400 hover:text-brand flex items-center gap-1 transition-colors"
            title="ทดสอบด้วยบัญชีตัวอย่าง"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>กรอกบัญชีทดสอบ</span>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm orange-btn-gradient shadow-orange-glow hover:shadow-orange-glow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <LogIn className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#262635]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#13131A] px-3 text-slate-400 font-medium">หรือเข้าสู่ระบบด้วย</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#181822] hover:bg-[#20202D] border border-[#2D2D3E] text-slate-200 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <RefreshCw className="w-5 h-5 text-brand animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isGoogleLoading ? 'กำลังเข้าสู่ระบบด้วย Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 text-center text-sm text-slate-400">
        ยังไม่มีบัญชีผู้ใช้งาน?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-brand hover:text-brand-300 font-semibold underline underline-offset-4 transition-colors"
        >
          สมัครสมาชิกที่นี่
        </button>
      </div>
    </div>
  );
};
