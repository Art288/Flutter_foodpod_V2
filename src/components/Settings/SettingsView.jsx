import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  User, 
  Settings, 
  HeartPulse,
  Scale, 
  Ruler, 
  Calendar, 
  Users, 
  Mail, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Footprints, 
  Radio, 
  ArrowLeft,
  Target,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  BatteryMedium,
  HardDrive,
  Sun,
  Moon,
  Smartphone,
  Check,
  RefreshCw
} from 'lucide-react';
import { ThemeToggleSwitch } from '../Common/ThemeToggleSwitch';

export const SettingsView = ({ 
  onBack, 
  onOpenGoals,
  deviceConnected,
  setDeviceConnected,
  connectedDevice,
  setConnectedDevice
}) => {
  const { currentUser, updateProfile } = useAuth();
  const { isDark } = useTheme();

  const [availableDevices, setAvailableDevices] = useState([
    {
      id: 'fp_esp32c3',
      name: 'ESP32-C3 0.42" OLED FootPod',
      type: 'footpod',
      battery: 96,
      signal: '-42 dBm (ใกล้สุด • BLE 5.0)',
      distance: '~0.2m',
      mac: '7C:DF:A1:04:42:C3'
    },
    {
      id: 'fp_01',
      name: 'FootPod Sensor #FP-8820',
      type: 'footpod',
      battery: 88,
      signal: '-52 dBm (แรงมาก)',
      distance: '~0.4m',
      mac: 'E4:5F:01:88:20:C1'
    },
    {
      id: 'fp_02',
      name: 'FootPod BLE Clip #2',
      type: 'footpod',
      battery: 64,
      signal: '-68 dBm (ปานกลาง)',
      distance: '~1.2m',
      mac: 'E4:5F:01:64:12:F4'
    },
    {
      id: 'phone_01',
      name: 'SmartPhone BLE Bridge',
      type: 'phone',
      battery: 92,
      signal: '-45 dBm (ใกล้สุด)',
      distance: '~0.2m',
      mac: '3C:22:FB:99:A0:11'
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [connectingDeviceId, setConnectingDeviceId] = useState(null);
  const [connectNotice, setConnectNotice] = useState('');

  const [formData, setFormData] = useState(() => {
    const userKey = currentUser?.id || currentUser?.email || 'user';
    const draft = localStorage.getItem('footpod_health_draft_' + userKey);
    let draftData = null;
    if (draft) {
      try { draftData = JSON.parse(draft); } catch (e) {}
    }

    return {
      name: draftData?.name || currentUser?.name || '',
      email: currentUser?.email || '',
      age: (draftData?.age !== undefined && draftData?.age !== '') 
        ? draftData.age 
        : (currentUser?.age !== undefined && currentUser?.age !== null ? currentUser.age : ''),
      gender: draftData?.gender || currentUser?.gender || 'ชาย (Male)',
      weightKg: (draftData?.weightKg !== undefined && draftData?.weightKg !== '') 
        ? draftData.weightKg 
        : (currentUser?.weightKg !== undefined && currentUser?.weightKg !== null ? currentUser.weightKg : ''),
      heightCm: (draftData?.heightCm !== undefined && draftData?.heightCm !== '') 
        ? draftData.heightCm 
        : (currentUser?.heightCm !== undefined && currentUser?.heightCm !== null ? currentUser.heightCm : ''),
      footSide: draftData?.footSide || currentUser?.footSide || 'ขวา (Right Foot)'
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userKey = currentUser.id || currentUser.email || 'user';
      const draft = localStorage.getItem('footpod_health_draft_' + userKey);
      let draftData = null;
      if (draft) {
        try { draftData = JSON.parse(draft); } catch (e) {}
      }

      setFormData({
        name: draftData?.name || currentUser.name || '',
        email: currentUser.email || '',
        age: (draftData?.age !== undefined && draftData?.age !== '') 
          ? draftData.age 
          : (currentUser.age !== undefined && currentUser.age !== null ? currentUser.age : ''),
        gender: draftData?.gender || currentUser.gender || 'ชาย (Male)',
        weightKg: (draftData?.weightKg !== undefined && draftData?.weightKg !== '') 
          ? draftData.weightKg 
          : (currentUser.weightKg !== undefined && currentUser.weightKg !== null ? currentUser.weightKg : ''),
        heightCm: (draftData?.heightCm !== undefined && draftData?.heightCm !== '') 
          ? draftData.heightCm 
          : (currentUser.heightCm !== undefined && currentUser.heightCm !== null ? currentUser.heightCm : ''),
        footSide: draftData?.footSide || currentUser.footSide || 'ขวา (Right Foot)'
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      // Keep auto-saved draft for the active user session
      if (currentUser) {
        const userKey = currentUser.id || currentUser.email || 'user';
        localStorage.setItem('footpod_health_draft_' + userKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: formData.name.trim(),
      age: formData.age !== '' ? Number(formData.age) : '',
      gender: formData.gender,
      weightKg: formData.weightKg !== '' ? Number(formData.weightKg) : '',
      heightCm: formData.heightCm !== '' ? Number(formData.heightCm) : '',
      footSide: formData.footSide
    });

    if (currentUser) {
      const userKey = currentUser.id || currentUser.email || 'user';
      localStorage.removeItem('footpod_health_draft_' + userKey);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleConnect = (device) => {
    setConnectingDeviceId(device.id);
    setScanStatusText(`กำลังส่ง Handshake จับคู่กับ "${device.name}"...`);

    setTimeout(() => {
      setConnectedDevice(device);
      setDeviceConnected(true);
      setConnectingDeviceId(null);
      setScanStatusText('');
      setConnectNotice(`เชื่อมต่อสัญญาณ Bluetooth กับ "${device.name}" แล้ว!`);
      setTimeout(() => setConnectNotice(''), 3500);
    }, 1000);
  };

  const handleDisconnect = () => {
    setDeviceConnected(false);
    setConnectedDevice(null);
    setConnectNotice('ตัดการเชื่อมต่อสัญญาณ Bluetooth เรียบร้อย');
    setTimeout(() => setConnectNotice(''), 2500);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanStatusText('กำลังปล่อยสัญญาณสแกน Bluetooth 2.4GHz ค้นหาอุปกรณ์ใกล้เคียง...');

    // Attempt Web Bluetooth API if available
    if (navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function') {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });
        if (device) {
          const newBle = {
            id: device.id || 'ble_' + Date.now(),
            name: device.name || `BLE Device (${device.id.slice(0, 5)})`,
            type: 'footpod',
            battery: 95,
            signal: '-40 dBm (Web BLE Direct)',
            distance: '~0.1m',
            mac: 'Bluetooth Web API'
          };
          setAvailableDevices(prev => [newBle, ...prev.filter(d => d.id !== newBle.id)]);
          handleConnect(newBle);
          setIsScanning(false);
          return;
        }
      } catch (e) {
        console.log('Web Bluetooth fallback:', e);
      }
    }

    setTimeout(() => {
      setScanStatusText('กำลังตรวจสอบสัญญาณ RSSI สแกนพบ FootPod และ BLE Bridge...');
    }, 900);

    setTimeout(() => {
      setIsScanning(false);
      setScanStatusText('สแกนสำเร็จ พบ 3 อุปกรณ์ที่เปิดบลูทูธอยู่ใกล้เคียง');
      setTimeout(() => setScanStatusText(''), 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#09090D] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 pb-28">
      
      {/* Settings Header */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#171722] hover:bg-slate-200 dark:hover:bg-[#20202E] border border-slate-200 dark:border-[#2B2B3C] text-slate-800 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับ</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand" />
              <span>การตั้งค่า & ข้อมูลสุขภาพ</span>
            </h1>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {currentUser?.email}
          </span>
        </div>

        {/* Connect Notice Alert */}
        {connectNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{connectNotice}</span>
          </div>
        )}

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>บันทึกข้อมูลสุขภาพสำเร็จ!</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: FOOTPOD DEVICE CONNECTION                                      */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20202E] pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand" />
              <span>การเชื่อมต่อ FootPod Sensor</span>
            </h2>

            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl orange-btn-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-orange-glow transition-all disabled:opacity-50"
              title="กดเพื่อสแกนสัญญาณ Bluetooth ที่เปิดอยู่ใกล้เคียง"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'กำลังสแกน...' : 'สแกน'}</span>
            </button>
          </div>

          {/* Radar Scanning Status Banner */}
          {isScanning && (
            <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 flex items-center gap-3 animate-fade-in">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute w-8 h-8 rounded-full bg-brand/30 animate-ping" />
                <Radio className="w-4 h-4 text-brand relative z-10 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand">{scanStatusText}</p>
                <p className="text-[11px] text-slate-400">กำลังสแกนหาอุปกรณ์ Bluetooth 2.4GHz ที่เปิดการทำงานอยู่</p>
              </div>
            </div>
          )}

          {scanStatusText && !isScanning && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#181824] border border-slate-200 dark:border-[#2B2B3C] text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 animate-fade-in">
              <Radio className="w-3.5 h-3.5 text-brand animate-pulse" />
              <span>{scanStatusText}</span>
            </div>
          )}

          {/* Current Connection Status Box */}
          {deviceConnected && connectedDevice ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500 text-white">
                  <BluetoothConnected className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {connectedDevice.name}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    เชื่อมต่อแล้ว • แบตเตอรี่ {connectedDevice.battery || 88}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors"
              >
                ตัดการเชื่อมต่อ
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
              <BluetoothOff className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ยังไม่ได้เชื่อมต่อ FootPod — กดปุ่ม "สแกน" ด้านบน หรือเลือกอุปกรณ์ด้านล่างเพื่อเชื่อมต่อ
              </p>
            </div>
          )}

          {/* Discoverable Devices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {availableDevices.map((device) => {
              const isCurrent = deviceConnected && connectedDevice?.id === device.id;
              const isConnecting = connectingDeviceId === device.id;

              return (
                <div
                  key={device.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#171722] border-slate-200 dark:border-[#2B2B3C] hover:border-brand/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {device.name}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {device.battery}%
                    </span>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="w-full py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>เชื่อมต่ออยู่</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(device)}
                        disabled={isConnecting}
                        className="w-full py-1.5 rounded-lg orange-btn-gradient text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-orange-glow disabled:opacity-50"
                      >
                        <Bluetooth className="w-3.5 h-3.5" />
                        <span>{isConnecting ? 'กำลังเชื่อม...' : 'เชื่อมต่อ'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: THEME SWITCH & GOALS SHORTCUT                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Theme Switcher */}
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {isDark ? <Moon className="w-4 h-4 text-brand" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            </span>
            <ThemeToggleSwitch showLabel={false} />
          </div>

          {/* Goals Shortcut */}
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              <span>เป้าหมายการวิ่ง</span>
            </span>
            <button
              type="button"
              onClick={onOpenGoals}
              className="px-3 py-1 rounded-lg orange-btn-gradient text-white font-bold text-xs shadow-sm"
            >
              แก้ไขเป้าหมาย
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: HEALTH DATA FORM                                              */}
        {/* ========================================================================= */}
        <form onSubmit={handleSave} className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20202E] pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-brand" />
              <span>ข้อมูลสุขภาพผู้ใช้งาน</span>
            </h2>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              บันทึกในเครื่อง
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:border-brand focus:outline-none"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                อายุ (ปี)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="ระบุอายุ (ปี)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-semibold focus:border-brand focus:outline-none"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เพศ
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs focus:border-brand focus:outline-none font-medium"
              >
                <option value="ชาย (Male)">ชาย (Male)</option>
                <option value="หญิง (Female)">หญิง (Female)</option>
                <option value="ไม่ระบุ (Other)">ไม่ระบุ</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                น้ำหนัก (กก.)
              </label>
              <input
                type="number"
                min="1"
                max="250"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="ระบุน้ำหนัก (กก.)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-semibold focus:border-brand focus:outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ส่วนสูง (ซม.)
              </label>
              <input
                type="number"
                min="1"
                max="250"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="ระบุส่วนสูง (ซม.)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-semibold focus:border-brand focus:outline-none"
              />
            </div>

            {/* Foot Sensor Placement */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ข้างที่ติดตั้ง
              </label>
              <select
                name="footSide"
                value={formData.footSide}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#171722] border border-slate-300 dark:border-[#2B2B3C] rounded-xl text-slate-900 dark:text-white text-xs focus:border-brand focus:outline-none font-medium"
              >
                <option value="ขวา (Right Foot)">เท้าขวา</option>
                <option value="ซ้าย (Left Foot)">เท้าซ้าย</option>
              </select>
            </div>

          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>บันทึกข้อมูลสุขภาพสำเร็จ! ระบบจะจดจำค่าที่คุณกรอกไว้ตลอดแม้จะออกจากระบบ</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl orange-btn-gradient text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกข้อมูลสุขภาพ</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
