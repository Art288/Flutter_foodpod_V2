import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  BluetoothOff, 
  RefreshCw, 
  CheckCircle2, 
  Radio, 
  Settings, 
  Zap, 
  HardDrive, 
  Unplug,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { bleService } from '../../services/bleService';

export const DeviceSyncBar = ({ 
  connectedDevice, 
  deviceConnected = false,
  onNavigateToSettings,
  onOpenConnectModal,
  onConnectDevice,
  onDisconnect,
  onBleTelemetry,
  onSyncSDCardData,
  onSaveCurrentSession,
  onResetFootAngle,
  isLiveStreamActive = false,
  isSyncing, 
  lastSyncTime,
  batteryLevel = 95 
}) => {
  const [showNotice, setShowNotice] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticeType, setNoticeType] = useState('success'); // 'success' | 'error'
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync onBleTelemetry callback reference whenever App updates
  useEffect(() => {
    if (onBleTelemetry) {
      bleService.onDataCallback = onBleTelemetry;
    }
  }, [onBleTelemetry]);

  // Connect directly via Web Bluetooth API (No mockup!)
  const handleConnectBluetooth = async () => {
    setIsConnecting(true);
    setNoticeType('success');
    setNoticeMsg('กำลังเปิดหน้าต่างค้นหาอุปกรณ์ Bluetooth 2.4GHz...');
    setShowNotice(true);

    try {
      const device = await bleService.connect(
        (realData) => {
          if (onBleTelemetry) {
            onBleTelemetry(realData);
          }
        },
        () => {
          if (onDisconnect) {
            onDisconnect();
          }
          setNoticeType('error');
          setNoticeMsg('การเชื่อมต่อ Bluetooth ถูกตัดการเชื่อมต่อ');
          setShowNotice(true);
          setTimeout(() => setShowNotice(false), 4000);
        }
      );

      setIsConnecting(false);
      if (onConnectDevice) {
        onConnectDevice(device);
      }
      setNoticeType('success');
      setNoticeMsg(`เชื่อมต่อ Bluetooth กับ "${device.name}" สำเร็จ! กำลังรับข้อมูล BNO055 แบบเรียลไทม์`);
      setTimeout(() => setShowNotice(false), 4000);
    } catch (err) {
      setIsConnecting(false);
      console.warn('Bluetooth connection error:', err);
      if (err.name === 'NotFoundError') {
        setNoticeType('error');
        setNoticeMsg('ยกเลิกการเลือกอุปกรณ์ Bluetooth');
      } else {
        setNoticeType('error');
        setNoticeMsg(err.message || 'ไม่สามารถเชื่อมต่อ Bluetooth ได้ กรุณาเปิด Bluetooth บนเครื่องและใช้ Chrome/Edge');
      }
      setTimeout(() => setShowNotice(false), 5000);
    }
  };

  const [isSyncingSD, setIsSyncingSD] = useState(false);

  const handleSDCardSyncClick = async () => {
    if (!deviceConnected || isSyncingSD) return;

    if (!bleService.isConnected) {
      setNoticeType('error');
      setNoticeMsg('กรุณากด "เชื่อมต่อ Bluetooth" กับอุปกรณ์ FootPod จริงก่อนดึงข้อมูลจาก SD Card');
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 4500);
      return;
    }

    setIsSyncingSD(true);
    setNoticeType('success');
    setNoticeMsg('กำลังส่งคำสั่งดึงข้อมูลการวิ่งจริงจาก MicroSD Card บน FootPod...');
    setShowNotice(true);

    try {
      const sent = await bleService.requestSdCardSync();
      if (!sent) {
        setIsSyncingSD(false);
        setNoticeType('error');
        setNoticeMsg('ไม่สามารถส่งคำสั่งดึงข้อมูลไปยังบอร์ดได้ กรุณาตรวจสอบการเชื่อมต่อ BLE');
        setShowNotice(true);
        setTimeout(() => setShowNotice(false), 4500);
        return;
      }

      setTimeout(() => {
        setIsSyncingSD(false);
        setNoticeType('success');
        setNoticeMsg('ส่งคำสั่งดึงข้อมูลจาก SD Card แล้ว (ระบบจะนำเข้าประวัติเฉพาะเมื่อมีข้อมูลจริงใน SD Card)');
        setShowNotice(true);
        setTimeout(() => setShowNotice(false), 4000);
      }, 1200);
    } catch (err) {
      setIsSyncingSD(false);
      setNoticeType('error');
      setNoticeMsg('เกิดข้อผิดพลาดในการดึงข้อมูลจาก SD Card');
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 4000);
    }
  };

  const handleDisconnectClick = () => {
    bleService.disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
    setNoticeType('success');
    setNoticeMsg('ตัดการเชื่อมต่อ Bluetooth เรียบร้อยแล้ว');
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3000);
  };

  const isBle = connectedDevice?.connectionType === 'ble' || deviceConnected;
  const deviceName = connectedDevice?.name || 'foot pod (BLE)';

  return (
    <div className="w-full bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232332] rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-card-dark transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Device Status */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border relative transition-colors ${
            deviceConnected 
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-500 dark:text-blue-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
          }`}>
            {deviceConnected ? (
              <Bluetooth className={`w-5 h-5 text-blue-500 ${isLiveStreamActive ? 'animate-pulse' : ''}`} />
            ) : (
              <BluetoothOff className="w-5 h-5 text-amber-600" />
            )}
            {isLiveStreamActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#12121A] animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {deviceConnected ? deviceName : 'ยังไม่ได้เชื่อมต่อ FootPod'}
              </h3>
              {deviceConnected ? (
                <>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 flex items-center gap-1">
                    <Bluetooth className="w-3 h-3" />
                    BLE เชื่อมต่อแล้ว • {batteryLevel}%
                  </span>
                  {isLiveStreamActive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-blue-600 shadow-md shadow-blue-500/30 animate-pulse flex items-center gap-1">
                      <Zap className="w-3 h-3 text-white fill-current" />
                      REALTIME BLE (BNO055 จริง)
                    </span>
                  )}
                </>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  ออฟไลน์ (รอเชื่อมต่อ Bluetooth)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-dark-muted mt-0.5">
              {deviceConnected 
                ? '🟢 รับข้อมูลเรียลไทม์สดจาก BNO055 (เมื่อออฟไลน์อุปกรณ์จะเก็บลง SD Card อัตโนมัติ)'
                : 'กดปุ่มด้านขวาเพื่อเชื่อมต่อ Bluetooth กับอุปกรณ์ foot pod (ไม่มีการจำลอง Mock Up)'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="self-end sm:self-auto flex items-center gap-2 flex-wrap">
          {!deviceConnected ? (
            <>
              {/* Primary: Real Web Bluetooth Connect Button */}
              <button
                type="button"
                onClick={handleConnectBluetooth}
                disabled={isConnecting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 transition-all cursor-pointer"
                title="กดเพื่อสแกนและเชื่อมต่อสัญญาณ Bluetooth Low Energy กับ FootPod"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Bluetooth className="w-4 h-4 text-white animate-bounce" />
                )}
                <span>{isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Bluetooth'}</span>
              </button>

              {onOpenConnectModal && (
                <button
                  type="button"
                  onClick={onOpenConnectModal}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#171724] border border-slate-200 dark:border-[#2A2A3C] text-slate-700 dark:text-slate-300 hover:text-blue-500 font-medium text-xs transition-colors cursor-pointer"
                  title="เปิดหน้าต่างค้นหาอุปกรณ์"
                >
                  ค้นหาอุปกรณ์
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateToSettings}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#171724] border border-slate-200 dark:border-[#2A2A3C] text-slate-600 dark:text-slate-300 hover:text-brand transition-colors text-xs cursor-pointer"
                title="ไปยังหน้าตั้งค่า"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Save Real Live Session Button */}
              {onSaveCurrentSession && (
                <button
                  type="button"
                  onClick={() => onSaveCurrentSession && onSaveCurrentSession()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="บันทึกข้อมูลก้าวและระยะทางจริงจากเซนเซอร์ในรอบวิ่งปัจจุบันลงในประวัติ"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกรอบนี้</span>
                </button>
              )}

              {/* Reset Foot Angle (Tare 0°) Button */}
              {onResetFootAngle && (
                <button
                  type="button"
                  onClick={async () => {
                    await onResetFootAngle();
                    setNoticeType('success');
                    setNoticeMsg('🎯 รีเซ็ตองศาเท้าเป็นศูนย์ (0.0°) สำเร็จ! เมื่อเริ่มขยับระบบจะนับองศาทันที');
                    setShowNotice(true);
                    setTimeout(() => setShowNotice(false), 4000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
                  title="กดเพื่อเซ็ตระนาบเท้าปัจจุบันให้เป็น 0 องศา (Tare Angle) เมื่อขยับจะวัดองศาทันที"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white group-hover:-rotate-90 transition-transform duration-300" />
                  <span>รีเซ็ตองศา (0°)</span>
                </button>
              )}

              {/* SD Card Sync Button */}
              <button
                type="button"
                onClick={handleSDCardSyncClick}
                disabled={isSyncingSD}
                className="px-3.5 py-2 rounded-xl orange-btn-gradient text-white font-bold text-xs flex items-center gap-1.5 shadow-orange-glow hover:shadow-orange-glow-lg disabled:opacity-50 transition-all cursor-pointer"
                title="ดึงข้อมูลการวิ่งที่บันทึกไว้ใน MicroSD Card บนอุปกรณ์ FootPod (ตอนวิ่งออฟไลน์หรือห่างจากคอมพิวเตอร์)"
              >
                <HardDrive className={`w-3.5 h-3.5 text-white ${isSyncingSD ? 'animate-spin' : ''}`} />
                <span>{isSyncingSD ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก SD Card'}</span>
              </button>

              {/* Disconnect Button */}
              <button
                type="button"
                onClick={handleDisconnectClick}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="ตัดการเชื่อมต่อ Bluetooth"
              >
                <Unplug className="w-3.5 h-3.5" />
                <span>ตัดการเชื่อมต่อ</span>
              </button>
            </>
          )}
        </div>

      </div>

      {showNotice && (
        <div className={`mt-2.5 p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
          noticeType === 'success' 
            ? 'bg-blue-500/15 border-blue-500/30 text-blue-800 dark:text-blue-300' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}>
          {noticeType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{noticeMsg}</span>
        </div>
      )}
    </div>
  );
};
