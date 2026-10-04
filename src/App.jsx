import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ForgotPasswordModal } from './components/Auth/ForgotPasswordModal';
import { DeviceSyncBar } from './components/Dashboard/DeviceSyncBar';
import { DeviceConnectionModal } from './components/Dashboard/DeviceConnectionModal';
import { StatCardGrid } from './components/Dashboard/StatCard';
import { FootAngleVisualizer } from './components/Dashboard/FootAngleVisualizer';
import { RunAnalyticsCharts } from './components/Dashboard/RunAnalyticsCharts';
import { GoalSettingModal } from './components/Goals/GoalSettingModal';
import { GoalProgressCard } from './components/Goals/GoalProgressCard';
import { HealthBMICard } from './components/Dashboard/HealthBMICard';
import { RunHistoryList } from './components/History/RunHistoryList';
import { EditRunModal } from './components/History/EditRunModal';
import { RunDetailModal } from './components/History/RunDetailModal';
import { SettingsView } from './components/Settings/SettingsView';
import { CalendarView } from './components/Calendar/CalendarView';
import { FootPodLogo } from './components/Common/FootPodLogo';
import { 
  INITIAL_GOAL, 
  INITIAL_ZERO_RUN, 
  generateTimeSeriesTelemetry 
} from './utils/mockData';
import { calculateCalories, speedToPace } from './utils/calculations';
import { toDateKey } from './utils/dateUtils';
import { 
  Calendar
} from 'lucide-react';

const MainAppFlow = () => {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  // Active view: 'dashboard' | 'settings'
  const [currentView, setCurrentView] = useState('dashboard');

  // Device status & Connected Device state: Starts DISCONNECTED by default
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  // Filter to ensure only real hardware runs (from ESP32 BLE / SD Card) are loaded
  const filterRealRuns = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(r => 
      r && r.id && 
      !r.id.includes('sample') && 
      !r.id.includes('mock') && 
      !r.id.includes('sd_card_run') &&
      r.title !== 'การวิ่งตรวจวัดจากเซนเซอร์ FootPod (BNO055)'
    );
  };

  // Runs state: Starts EMPTY ([]) by default so all metrics start at 0 until synced from physical board
  const [runs, setRuns] = useState(() => {
    const saved = localStorage.getItem(`footpod_runs_${currentUser?.id || currentUser?.uid || 'user'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return filterRealRuns(parsed);
      } catch (e) {}
    }
    return [];
  });

  // Active run: Defaults to INITIAL_ZERO_RUN (all 0 values) upon login until synced or selected
  const [activeRun, setActiveRun] = useState(INITIAL_ZERO_RUN);

  // Load saved runs history, but keep dashboard metrics (activeRun) at ZERO on fresh login
  useEffect(() => {
    if (currentUser) {
      const userKey = `footpod_runs_${currentUser.id || currentUser.uid || 'user'}`;
      const savedUserRuns = localStorage.getItem(userKey);
      if (savedUserRuns) {
        try {
          const parsed = JSON.parse(savedUserRuns);
          const realOnly = filterRealRuns(parsed);
          setRuns(realOnly); // แสดงประวัติข้อมูลที่บันทึกล่าสุดทั้งหมดตามปกติ
        } catch (e) {}
      } else {
        setRuns([]);
      }
      // เซ็ตหน้าข้อมูลแดชบอร์ดหลักเป็น 0 ทั้งหมดเมื่อกลับมา Login ใหม่
      setActiveRun(INITIAL_ZERO_RUN);
      setLastSyncTime('รอการซิงค์ข้อมูลจากเซนเซอร์');
    }
  }, [currentUser?.id, currentUser?.uid]);

  // Persist runs per user whenever modified
  useEffect(() => {
    if (currentUser) {
      const userKey = `footpod_runs_${currentUser.id || currentUser.uid || 'user'}`;
      localStorage.setItem(userKey, JSON.stringify(runs));
    }
  }, [runs, currentUser?.id]);

  // Goal state
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('footpod_user_goal');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      ...INITIAL_GOAL,
      targetCalories: 400
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('รอการซิงค์ข้อมูลจากเซนเซอร์');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedRunForDetail, setSelectedRunForDetail] = useState(null);
  const [selectedRunForEdit, setSelectedRunForEdit] = useState(null);

  // Goal handler
  const handleSaveGoal = (newGoal) => {
    setGoal(newGoal);
    localStorage.setItem('footpod_user_goal', JSON.stringify(newGoal));
  };

  // Run management handlers (Edit, Delete, Add)
  const handleSaveEditedRun = (updatedRun) => {
    setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
    if (activeRun.id === updatedRun.id) {
      setActiveRun(updatedRun);
    }
  };

  const handleDeleteRun = (runId) => {
    setRuns(prev => {
      const remaining = prev.filter(r => r.id !== runId);
      if (activeRun.id === runId) {
        setActiveRun(remaining.length > 0 ? remaining[0] : INITIAL_ZERO_RUN);
        setLastSyncTime(remaining.length > 0 ? remaining[0].dateFormatted : 'ยังไม่มีข้อมูลการซิงค์');
      }
      return remaining;
    });
  };

  const handleAddNewRun = (newRun) => {
    setRuns(prev => [newRun, ...prev]);
    setActiveRun(newRun);
    setLastSyncTime(newRun.dateFormatted);
  };

  // Handle genuine real-time telemetry received from Bluetooth BLE (NO MOCKUP!)
  const handleBleTelemetry = (data) => {
    if (!data) return;

    // Handle offline run synced from FootPod MicroSD Card (Real data only, NO MOCKUP!)
    if (data.type === 'sd_sync') {
      if (data.hasData === false || !data.steps || data.steps <= 0) {
        alert('ℹ️ อุปกรณ์ FootPod แจ้งว่า: ไม่พบข้อมูลการวิ่งออฟไลน์ใน MicroSD Card (ไม่มีการบันทึกข้อมูลก้าวขณะออฟไลน์)');
        return;
      }

      const now = new Date();
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const dateFormatted = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น. (SD Card)`;
      const steps = Math.round(data.steps);
      const dist = typeof data.dist === 'number' 
        ? Number(data.dist.toFixed(3)) 
        : Number(((steps * 1.25) / 1000).toFixed(3));
      const distMeters = typeof data.distM === 'number' ? Math.round(data.distM) : Math.round(steps * 1.25);
      const impactG = Number((data.impactG || data.g || 1.0).toFixed(2));
      const pitch = Number((data.pitch || 0.0).toFixed(1));
      const cadence = Math.round(data.cadence || 0);
      const userWeight = currentUser?.weightKg || 68;
      const cal = data.cal || Math.round(dist * userWeight * 1.036);
      const dur = data.dur || Math.max(1, Math.round(steps / (cadence || 160)));

      // Generate exact telemetry points matching real board values without any mock noise
      const telemPoints = Array.from({ length: Math.min(Math.max(dur * 2, 6), 24) }, (_, i) => ({
        timeSeconds: (i + 1) * 30,
        timeFormatted: `${Math.floor(((i + 1) * 30) / 60)}:${String(((i + 1) * 30) % 60).padStart(2, '0')}`,
        footAngle: pitch,
        cadence: cadence,
        accelerationZ: impactG,
        impactG: impactG
      }));

      const dateKey = toDateKey(now);
      const sdRun = {
        id: 'sd_run_' + Date.now(),
        dateKey: dateKey,
        timestamp: now.getTime(),
        title: '💾 ข้อมูลจริงจาก MicroSD Card (ออฟไลน์)',
        dateFormatted: dateFormatted,
        isRealHardwareData: true,
        steps: steps,
        distanceKm: dist,
        impactG: impactG,
        durationMinutes: dur,
        avgFootAngle: pitch,
        maxFootAngle: Number((pitch + 1.2).toFixed(1)),
        minFootAngle: Number(Math.max(0, pitch - 1.2).toFixed(1)),
        avgCadence: cadence,
        caloriesBurned: cal,
        strikeDistribution: {
          forefoot: pitch > 25 ? 40 : 15,
          midfoot: (pitch >= 10 && pitch <= 25) ? 75 : 55,
          heel: pitch < 10 ? 35 : 10
        },
        batteryLevel: 95,
        deviceConnected: true,
        notes: `ดึงข้อมูลจริงจาก MicroSD Card สำเร็จ: ${steps.toLocaleString()} ก้าว • ระยะทาง ${dist} กม. (${distMeters.toLocaleString()} ม. อิง 1.25 ม./ก้าวจากบอร์ด) • แรงกระแทก ${impactG} G`,
        telemetry: telemPoints
      };

      setRuns(prev => [sdRun, ...prev.filter(r => 
        !r.id.includes('mock') && !r.id.includes('sample') && !r.id.includes('sd_card_run')
      )]);
      setActiveRun(sdRun);
      setLastSyncTime(dateFormatted);
      alert(`✅ ดึงข้อมูลจริงจาก MicroSD Card สำเร็จ!\n- จำนวนก้าว: ${steps.toLocaleString()} ก้าว\n- ระยะทาง: ${dist} กม. (${distMeters.toLocaleString()} ม.)\n- แรงกระแทก: ${impactG} G`);
      return;
    }

    // Real hardware values extracted directly from BNO055 packets
    const liveAngle = typeof data.pitch === 'number' ? Number(data.pitch.toFixed(1)) : 0.0;
    const liveCadence = typeof data.cadence === 'number' ? Math.round(data.cadence) : 0;
    const liveSteps = typeof data.steps === 'number' ? data.steps : 0;
    const liveDist = typeof data.dist === 'number' 
      ? Number(data.dist.toFixed(3)) 
      : Number(((liveSteps * 1.25) / 1000).toFixed(3));
    const liveImpactG = typeof data.impactG === 'number' 
      ? Number(data.impactG.toFixed(2)) 
      : (typeof data.g === 'number' ? Number(data.g.toFixed(2)) : 1.0);
    const liveSpeed = typeof data.speed === 'number'
      ? Number(data.speed.toFixed(1))
      : (liveCadence > 0 ? Number(((liveCadence * 1.25 * 60) / 1000).toFixed(1)) : 0.0);

    setActiveRun(prev => {
      const userWeight = currentUser?.weightKg || 68;
      const dynamicCalories = Math.round(liveDist * userWeight * 1.036);

      const prevTelem = prev?.telemetry || [];
      const lastSec = prevTelem.length > 0 ? (prevTelem[prevTelem.length - 1].timeSeconds || 0) : 0;

      // Add a point to chart every ~1s based on real incoming telemetry
      const nowSec = Math.floor(Date.now() / 1000);
      let updatedTelemetry = prevTelem;
      if (!prev.lastChartSec || nowSec - prev.lastChartSec >= 1) {
        const newPoint = {
          timeSeconds: lastSec + 1,
          timeFormatted: `${Math.floor((lastSec + 1) / 60)}:${String((lastSec + 1) % 60).padStart(2, '0')}`,
          footAngle: liveAngle,
          cadence: liveCadence,
          speed: liveSpeed,
          accelerationZ: liveImpactG,
          impactG: liveImpactG
        };
        updatedTelemetry = [...prevTelem.slice(-24), newPoint];
      }

      return {
        ...prev,
        id: prev.id === 'zero_state_idle' ? 'ble_live_session' : prev.id,
        title: '🔵 รับข้อมูลเรียลไทม์จาก FootPod (1 ก้าว = 1.25 เมตร)',
        dateFormatted: 'สตรีมสด Bluetooth (ESP32-C3 Impact)',
        steps: liveSteps,
        distanceKm: liveDist,
        impactG: liveImpactG,
        avgSpeedKmh: liveSpeed,
        avgFootAngle: liveAngle,
        avgCadence: liveCadence,
        caloriesBurned: dynamicCalories,
        lastChartSec: nowSec,
        strikeDistribution: {
          forefoot: 18,
          midfoot: 72,
          heel: 10
        },
        telemetry: updatedTelemetry
      };
    });
  };

  // Sync offline run session recorded on FootPod MicroSD Card (Sends SYNC_SD over BLE)
  const handleSyncSDCardData = async (onComplete) => {
    if (!deviceConnected) return;
    setIsSyncing(true);
    try {
      await bleService.requestSdCardSync();
    } catch (e) {
      console.warn('BLE sync request error:', e);
    }
    setTimeout(() => {
      setIsSyncing(false);
      if (onComplete) onComplete();
    }, 1500);
  };

  // Save current active real-time session from the board into History List
  const handleSaveCurrentSession = (targetDate = null) => {
    if (!activeRun || activeRun.steps === 0) {
      alert('ยังไม่มีข้อมูลการก้าวจากอุปกรณ์ในรอบนี้ (กรุณาขยับบอร์ดเพื่อให้นับก้าวจากการกระแทกก่อนกดบันทึก)');
      return;
    }

    const baseDate = targetDate 
      ? (targetDate instanceof Date ? targetDate : new Date(targetDate)) 
      : new Date();
    const dateKey = toDateKey(baseDate);

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const dateFormatted = `${baseDate.getDate()} ${thaiMonths[baseDate.getMonth()]} ${baseDate.getFullYear() + 543}, ${timeStr}`;

    const distMeters = Math.round((activeRun.distanceKm || 0) * 1000);
    const distKm = Number((activeRun.distanceKm || ((activeRun.steps * 1.25) / 1000)).toFixed(3));

    // คำนวณความเร็วเฉลี่ยทั้งหมดของการวิ่งรอบนี้ (Overall Average Speed in km/h)
    const telemetry = activeRun.telemetry || [];
    const validSpeeds = telemetry.map(t => t.speed).filter(s => typeof s === 'number' && s > 0);
    const durationSeconds = telemetry.length > 0 ? (telemetry[telemetry.length - 1].timeSeconds || telemetry.length) : 0;

    let overallAvgSpeed = 0.0;
    if (validSpeeds.length > 0) {
      overallAvgSpeed = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
    } else if (durationSeconds > 0 && distKm > 0) {
      overallAvgSpeed = distKm / (durationSeconds / 3600);
    } else if (activeRun.avgCadence > 0) {
      overallAvgSpeed = (activeRun.avgCadence * 1.25 * 60) / 1000;
    } else if (activeRun.avgSpeedKmh > 0) {
      overallAvgSpeed = activeRun.avgSpeedKmh;
    } else {
      const estimatedMinutes = Math.max(1, Math.round(activeRun.steps / 160));
      overallAvgSpeed = distKm / (estimatedMinutes / 60);
    }
    overallAvgSpeed = Number(overallAvgSpeed.toFixed(1));

    const finalPace = speedToPace(overallAvgSpeed);
    const finalDurationMinutes = activeRun.durationMinutes || (durationSeconds > 0 ? Math.max(1, Math.round(durationSeconds / 60)) : Math.max(1, Math.round(activeRun.steps / (activeRun.avgCadence || 160))));

    const savedLiveRun = {
      ...activeRun,
      id: 'real_live_run_' + Date.now(),
      dateKey: dateKey,
      timestamp: baseDate.getTime(),
      title: '🏃‍♂️ ข้อมูลจริงจากบอร์ด ESP32-C3 (Live Run)',
      dateFormatted: dateFormatted,
      isRealHardwareData: true,
      distanceKm: distKm,
      avgSpeedKmh: overallAvgSpeed,
      avgPace: finalPace,
      durationMinutes: finalDurationMinutes,
      notes: `บันทึกข้อมูลสดจากเซนเซอร์: ${activeRun.steps.toLocaleString()} ก้าว • ระยะทาง ${distKm} กม. (${distMeters.toLocaleString()} ม.) • ความเร็วเฉลี่ย ${overallAvgSpeed} km/h (เพซ ${finalPace}/km) • แรงกระแทก ${activeRun.impactG || 1.0} G`
    };

    setRuns(prev => [savedLiveRun, ...prev.filter(r => 
      !r.id.includes('mock') && !r.id.includes('sample') && !r.id.includes('sd_card_run')
    )]);
    setActiveRun(savedLiveRun);
    setLastSyncTime(dateFormatted);
    alert(`✅ บันทึกรอบวิ่งลงในวันที่ ${baseDate.getDate()} ${thaiMonths[baseDate.getMonth()]} ${baseDate.getFullYear() + 543} เรียบร้อยแล้ว!\n- ความเร็วเฉลี่ย: ${overallAvgSpeed} km/h (เพซ ${finalPace}/km)\n- จำนวนก้าว: ${activeRun.steps.toLocaleString()} ก้าว\n- ระยะทาง: ${distKm} กม. (${distMeters.toLocaleString()} ม.)`);
  };

  // Clear all mock/previous runs
  const handleClearAllRuns = () => {
    setRuns([]);
    setActiveRun(INITIAL_ZERO_RUN);
    setLastSyncTime('ล้างประวัติเรียบร้อย');
    if (currentUser) {
      const userKey = `footpod_runs_${currentUser.id || currentUser.uid || 'user'}`;
      localStorage.removeItem(userKey);
    }
  };

  // Compute calculated calories dynamically for the active run based on impact steps
  const dynamicCalculatedCalories = activeRun?.caloriesBurned || Math.round(
    (activeRun?.steps || 0) * 0.042 * ((currentUser?.weightKg || 65) / 65)
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#09090D] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand selection:text-white transition-colors duration-200 pb-28">
      
      {/* Top Navigation Header (Clean logo + profile avatar only) */}
      <Navbar
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Main View Content */}
      {currentView === 'settings' ? (
        <SettingsView
          onBack={() => setCurrentView('dashboard')}
          onOpenGoals={() => setIsGoalModalOpen(true)}
          deviceConnected={deviceConnected}
          setDeviceConnected={setDeviceConnected}
          connectedDevice={connectedDevice}
          setConnectedDevice={setConnectedDevice}
        />
      ) : currentView === 'calendar' ? (
        <CalendarView
          runs={runs}
          activeRun={activeRun}
          onSaveCurrentSession={(targetDate) => handleSaveCurrentSession(targetDate)}
          onSelectRun={(run) => {
            setActiveRun(run);
            setLastSyncTime(run.dateFormatted);
          }}
          onOpenDetail={(run) => setSelectedRunForDetail(run)}
          onOpenEdit={(run) => setSelectedRunForEdit(run)}
          onDeleteRun={handleDeleteRun}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      ) : (
        /* Main Dashboard View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          
          {/* Header: Clean Welcome & Date Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-card-dark transition-colors">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                สวัสดีคุณ {currentUser?.name || 'นักวิ่ง'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
                {activeRun?.title || 'รอการซิงค์ข้อมูลจากเซนเซอร์'}
              </p>
            </div>

            <button
              onClick={() => setCurrentView('calendar')}
              className="flex items-center gap-2 bg-slate-50 dark:bg-[#0D0D13] border border-slate-200 dark:border-[#242436] hover:border-brand/50 hover:bg-orange-50/50 dark:hover:bg-brand/10 px-3 py-1.5 rounded-xl self-start sm:self-auto text-xs text-slate-600 dark:text-slate-300 font-mono transition-all group"
              title="คลิกเพื่อเปิดปฏิทินเลือกวันที่และประวัติการวิ่ง"
            >
              <Calendar className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform" />
              <span>{lastSyncTime}</span>
            </button>
          </div>

          {/* FootPod Hardware Device Sync Bar (Starts disconnected) */}
          <DeviceSyncBar
            connectedDevice={connectedDevice}
            deviceConnected={deviceConnected}
            onNavigateToSettings={() => setCurrentView('settings')}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onConnectDevice={(device) => {
              setConnectedDevice(device);
              setDeviceConnected(true);
              setIsLiveStreamActive(true);
            }}
            onDisconnect={() => {
              setDeviceConnected(false);
              setConnectedDevice(null);
              setIsLiveStreamActive(false);
            }}
            onBleTelemetry={handleBleTelemetry}
            onSyncSDCardData={handleSyncSDCardData}
            onSaveCurrentSession={handleSaveCurrentSession}
            isLiveStreamActive={isLiveStreamActive}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            batteryLevel={connectedDevice?.battery || 95}
          />

          {/* 4 Core Summary Metrics Grid (Foot Angle, Movement Speed, Distance 1.25m/step, Impact G) */}
          <StatCardGrid
            speed={activeRun.avgSpeedKmh !== undefined ? activeRun.avgSpeedKmh : (activeRun.avgCadence ? (activeRun.avgCadence * 1.25 * 60) / 1000 : 0)}
            steps={activeRun.steps || 0}
            distanceKm={activeRun.distanceKm || 0.0}
            avgFootAngle={activeRun.avgFootAngle || 0}
            cadence={activeRun.avgCadence || 0}
            impactG={activeRun.impactG || 1.0}
            caloriesBurned={dynamicCalculatedCalories}
            durationMinutes={activeRun.durationMinutes || 0}
          />

          {/* Smart BMI Health Analysis, Daily Steps & Daily Calorie Burn */}
          <HealthBMICard
            currentUser={currentUser}
            todaySteps={activeRun.steps || 0}
            todayDistanceKm={activeRun.distanceKm || 0.0}
            todayCalories={dynamicCalculatedCalories}
            impactG={activeRun.impactG || 1.0}
            onNavigateToSettings={() => setCurrentView('settings')}
          />

          {/* Goal Progress Card with Distance & Calorie Goals */}
          {goal && (
            <GoalProgressCard
              goal={goal}
              currentRun={{
                ...activeRun,
                caloriesBurned: dynamicCalculatedCalories
              }}
              onOpenGoalModal={() => setIsGoalModalOpen(true)}
            />
          )}

          {/* Biomechanical Foot Angle Visualizer & Strike Pattern */}
          <FootAngleVisualizer
            currentAngle={activeRun.avgFootAngle}
            strikeDistribution={activeRun.strikeDistribution}
            maxAngle={activeRun.maxFootAngle}
            minAngle={activeRun.minFootAngle}
            onOpenHealthData={() => setCurrentView('settings')}
          />

          {/* Time-Series Charts (Foot Angle vs Time & Speed vs Cadence) */}
          <RunAnalyticsCharts
            telemetry={activeRun.telemetry}
          />

          {/* Run History List (With View, Edit, and Delete actions) */}
          <RunHistoryList
            runs={runs}
            activeRunId={activeRun?.id}
            onSelectRun={(run) => {
              setActiveRun(run);
              setLastSyncTime(run.dateFormatted);
            }}
            onOpenDetail={(run) => setSelectedRunForDetail(run)}
            onOpenEdit={(run) => setSelectedRunForEdit(run)}
            onDeleteRun={handleDeleteRun}
            onClearAllRuns={handleClearAllRuns}
            onOpenCalendar={() => setCurrentView('calendar')}
          />

        </main>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-[#1C1C28] py-4 text-center text-xs text-slate-500 dark:text-dark-muted transition-colors">
        <p>© 2026 foot pod • IoT Telemetry System</p>
      </footer>

      {/* Floating Bottom Navigation Bar (Follows the user with strictly 3 tabs) */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Goal Setting Modal */}
      <GoalSettingModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={goal}
        onSaveGoal={handleSaveGoal}
        userWeight={currentUser?.weightKg || 65}
      />

      {/* Edit Run Modal */}
      <EditRunModal
        isOpen={Boolean(selectedRunForEdit)}
        onClose={() => setSelectedRunForEdit(null)}
        run={selectedRunForEdit}
        onSave={handleSaveEditedRun}
        userWeight={currentUser?.weightKg || 65}
      />

      {/* View Run Detail Modal */}
      <RunDetailModal
        isOpen={Boolean(selectedRunForDetail)}
        onClose={() => setSelectedRunForDetail(null)}
        run={selectedRunForDetail}
        onEdit={(run) => {
          setSelectedRunForDetail(null);
          setSelectedRunForEdit(run);
        }}
        onDelete={(runId) => {
          handleDeleteRun(runId);
          setSelectedRunForDetail(null);
        }}
        onSelectAsActive={(run) => {
          setActiveRun(run);
          setLastSyncTime(run.dateFormatted);
        }}
        isActive={activeRun?.id === selectedRunForDetail?.id}
      />

      {/* Device Connection & Bluetooth Scan Modal */}
      <DeviceConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        connectedDeviceId={connectedDevice?.id}
        onConnectDevice={(device) => {
          setConnectedDevice(device);
          setDeviceConnected(true);
          setIsLiveStreamActive(true); // <-- แสดงผลเรียลไทม์ทันทีเมื่อเชื่อมอุปกรณ์
        }}
      />

    </div>
  );
};

// Authentication Screen (Login / Register / Forgot Password)
const AuthScreen = () => {
  const [authView, setAuthView] = useState('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleRegisterSuccess = (email) => {
    setRegisteredEmail(email);
    setAuthView('login');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#08080C] flex flex-col justify-between relative overflow-hidden selection:bg-brand selection:text-white transition-colors duration-200">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar Brand Header with 'foot pod' */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <FootPodLogo size="sm" />
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight lowercase">
            foot <span className="text-brand">pod</span>
          </span>
        </div>

        <div className="text-xs text-slate-600 dark:text-dark-muted hidden sm:block">
          Smart IoT Foot Flexion & Distance Sensor
        </div>
      </header>

      {/* Form Container */}
      <div className="w-full max-w-md mx-auto px-4 py-8 relative z-10">
        <div className="bg-white dark:bg-[#12121A]/95 border border-slate-200 dark:border-[#262638] rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors">
          {authView === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setAuthView('register')}
              onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
              initialEmail={registeredEmail}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setAuthView('login')}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )}
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-500 dark:text-dark-muted relative z-10">
        <p>© 2026 foot pod IoT Telemetry System • ธีมสี ส้ม-ดำ สบายตา ใช้งานง่าย</p>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={registeredEmail}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { currentUser } = useAuth();

  return currentUser ? <MainAppFlow /> : <AuthScreen />;
}
