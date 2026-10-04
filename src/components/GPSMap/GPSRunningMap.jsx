import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Pause, 
  Activity, 
  Gauge, 
  Navigation, 
  Flame, 
  Radio, 
  Layers, 
  Footprints, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  BluetoothOff,
  Bluetooth,
  Compass,
  AlertCircle,
  X,
  Check,
  RotateCcw,
  Settings,
  ArrowRight
} from 'lucide-react';
import { analyzeFootAngle, speedToPace, calculateCalories, distanceToSteps } from '../../utils/calculations';

export const GPSRunningMap = ({ 
  onBack, 
  onNavigateToSettings,
  runs = [], 
  currentUser, 
  deviceConnected = false,
  onAddNewRun 
}) => {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polylineRef = useRef(null);
  const runnerMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const animationTimerRef = useRef(null);

  // Mode: 'outdoor' (วิ่งกลางแจ้ง) | 'treadmill' (วิ่งบนลู่วิ่ง)
  const [runEnvironment, setRunEnvironment] = useState('outdoor');

  // Device Required Modal (Alerts user when attempting to run without FootPod connected)
  const [showDeviceRequiredModal, setShowDeviceRequiredModal] = useState(false);

  // GPS Permission Prompt State (Asks only ONCE per session)
  const [showGPSModal, setShowGPSModal] = useState(() => {
    return sessionStorage.getItem('footpod_gps_asked') !== 'true';
  });
  const [gpsAllowed, setGpsAllowed] = useState(() => {
    const saved = sessionStorage.getItem('footpod_gps_allowed');
    return saved === 'true';
  });

  // User Current Location Coordinates [lat, lng] (Defaults to Bangkok center until GPS fetched)
  const [userLocation, setUserLocation] = useState([13.7563, 100.5018]);
  const [isLocating, setIsLocating] = useState(false);
  const [liveTrailCoords, setLiveTrailCoords] = useState([]);

  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Live Telemetry
  const [liveDistance, setLiveDistance] = useState(0.0);
  const [liveSpeed, setLiveSpeed] = useState(0.0);
  const [liveAngle, setLiveAngle] = useState(0.0);
  const [liveCadence, setLiveCadence] = useState(0);
  const [liveDurationSec, setLiveDurationSec] = useState(0);
  const [savedRunNotice, setSavedRunNotice] = useState(false);

  // All-time Lifetime Running Statistics
  const totalLifetimeDistance = runs.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0);
  const totalLifetimeCalories = runs.reduce((acc, r) => acc + (Number(r.caloriesBurned) || 0), 0);
  const totalLifetimeMinutes = runs.reduce((acc, r) => acc + (Number(r.durationMinutes) || 0), 0);
  const totalLifetimeRuns = runs.length;

  const angleAnalysis = analyzeFootAngle(liveAngle);
  const liveCalories = calculateCalories(liveDistance, liveSpeed, currentUser?.weightKg || 65, liveAngle);
  const liveSteps = distanceToSteps(liveDistance, currentUser?.heightCm || 170);

  // Handler for Start/Pause Run Button: Blocks execution if device is disconnected
  const handleToggleTracking = () => {
    if (!deviceConnected && !isLiveTracking) {
      setShowDeviceRequiredModal(true);
      return;
    }
    setIsLiveTracking(!isLiveTracking);
  };

  // Request User's Real Current GPS Location
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentPos = [lat, lng];
        setUserLocation(currentPos);
        setIsLocating(false);
        setGpsAllowed(true);
        sessionStorage.setItem('footpod_gps_asked', 'true');
        sessionStorage.setItem('footpod_gps_allowed', 'true');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(currentPos, 16);
          updateUserLocationPin(currentPos);
        }
      },
      (error) => {
        console.warn('Geolocation access failed or denied:', error);
        setIsLocating(false);
        setGpsAllowed(true); // Allow simulation mode from default coordinates
        sessionStorage.setItem('footpod_gps_asked', 'true');
        sessionStorage.setItem('footpod_gps_allowed', 'true');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmGPSModal = () => {
    setShowGPSModal(false);
    requestCurrentLocation();
  };

  const handleCancelGPSModal = () => {
    setShowGPSModal(false);
    setGpsAllowed(false);
    sessionStorage.setItem('footpod_gps_asked', 'true');
    sessionStorage.setItem('footpod_gps_allowed', 'false');
  };

  // Helper to place/update User's Current GPS Location Pin
  const updateUserLocationPin = (pos) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocationMarkerRef.current) {
      map.removeLayer(userLocationMarkerRef.current);
    }

    const pinIcon = L.divIcon({
      className: 'custom-user-gps-pin',
      html: `<div style="background:#FF6600; width:18px; height:18px; border-radius:50%; border:3px solid #FFF; box-shadow:0 0 12px rgba(255,102,0,0.8); position:relative;">
               <div style="width:32px; height:32px; border-radius:50%; background:rgba(255,102,0,0.25); position:absolute; top:-10px; left:-10px; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
             </div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const marker = L.marker(pos, { icon: pinIcon }).addTo(map);
    userLocationMarkerRef.current = marker;
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || runEnvironment === 'treadmill') return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;

      if (gpsAllowed) {
        updateUserLocationPin(userLocation);
      }
    }
  }, [runEnvironment]);

  // Handle Dark/Light Tile updates
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [isDark]);

  // Update Route Polyline & Markers dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || runEnvironment === 'treadmill') return;

    // 1. Clear any existing polyline and markers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (runnerMarkerRef.current) {
      map.removeLayer(runnerMarkerRef.current);
      runnerMarkerRef.current = null;
    }
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Determine coordinates to display
    const hasRecorded = runs.length > 0 && runs[0]?.routeCoordinates?.length > 0;
    const coordsToDraw = isLiveTracking 
      ? liveTrailCoords 
      : (hasRecorded ? runs[0].routeCoordinates : []);

    // 2. If no coordinates and not tracking, clear map and center on user's current GPS position
    if (!coordsToDraw || coordsToDraw.length === 0) {
      if (gpsAllowed) {
        map.setView(userLocation, 15);
        updateUserLocationPin(userLocation);
      } else {
        map.setView([13.7563, 100.5018], 12);
      }
      return;
    }

    // 3. Draw route polyline
    const polyline = L.polyline(coordsToDraw, {
      color: '#FF6600',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineRef.current = polyline;

    // 4. Draw Start marker
    const startIcon = L.divIcon({
      className: 'custom-start-pin',
      html: `<div style="background:#10B981; width:14px; height:14px; border-radius:50%; border:2px solid #FFF; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    const startMarker = L.marker(coordsToDraw[0], { icon: startIcon }).addTo(map);
    markersRef.current.push(startMarker);

    // 5. Draw Finish marker (if more than 1 point)
    if (coordsToDraw.length > 1) {
      const finishIcon = L.divIcon({
        className: 'custom-finish-pin',
        html: `<div style="background:#FF6600; width:16px; height:16px; border-radius:50%; border:2px solid #FFF; display:flex; align-items:center; justify-content:center; color:#fff; font-size:9px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏁</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      const finishMarker = L.marker(coordsToDraw[coordsToDraw.length - 1], { icon: finishIcon }).addTo(map);
      markersRef.current.push(finishMarker);
    }

    // 6. Draw Runner position marker if tracking
    if (isLiveTracking && coordsToDraw.length > 0) {
      const runnerIcon = L.divIcon({
        className: 'custom-runner-pin',
        html: `<div style="background:#FF7A00; width:28px; height:28px; border-radius:50%; border:2px solid #FFF; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 4px 8px rgba(0,0,0,0.4);">🏃</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const runnerMarker = L.marker(coordsToDraw[coordsToDraw.length - 1], {
        icon: runnerIcon
      }).addTo(map);

      runnerMarkerRef.current = runnerMarker;
    }

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

  }, [liveTrailCoords.length, isLiveTracking, runs.length, runEnvironment, gpsAllowed]);

  // Live GPS Tracking Loop starting from user's current GPS location
  useEffect(() => {
    if (isLiveTracking) {
      // Start path from user's current GPS location
      if (liveTrailCoords.length === 0) {
        setLiveTrailCoords([userLocation]);
      }

      animationTimerRef.current = setInterval(() => {
        setLiveTrailCoords(prev => {
          const lastPoint = prev[prev.length - 1] || userLocation;
          // Step incremental distance ~20 meters with slight curve
          const latOffset = 0.00015 + (Math.sin(prev.length * 0.4) * 0.00008);
          const lngOffset = 0.00018 + (Math.cos(prev.length * 0.3) * 0.00009);
          const newPoint = [lastPoint[0] + latOffset, lastPoint[1] + lngOffset];
          return [...prev, newPoint];
        });

        setLiveDistance(d => Number((d + 0.02).toFixed(2)));
        setLiveSpeed(s => Number((8.6 + (Math.random() - 0.4) * 1.2).toFixed(1)));
        setLiveAngle(a => Number((21.2 + (Math.random() - 0.5) * 2.2).toFixed(1)));
        setLiveCadence(c => Math.round(168 + (Math.random() - 0.5) * 6));
        setLiveDurationSec(sec => sec + 2);
      }, 1400);
    } else {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isLiveTracking, userLocation]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveAndFinish = () => {
    setIsLiveTracking(false);

    const now = new Date();
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const dateFormatted = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

    const isTreadmill = runEnvironment === 'treadmill';

    const newRun = {
      id: 'run_gps_' + Date.now(),
      dateFormatted: dateFormatted,
      timestamp: now.toISOString(),
      title: isTreadmill ? 'วิ่งบนลู่วิ่ง (Treadmill Run)' : 'วิ่งกลางแจ้ง (Outdoor GPS Run)',
      locationName: isTreadmill ? 'ลู่วิ่งในร่ม (Treadmill)' : 'ตำแหน่งพิกัด GPS สด',
      mode: 'fitness',
      environment: runEnvironment,
      distanceKm: liveDistance > 0 ? liveDistance : (isTreadmill ? 3.00 : 3.20),
      durationMinutes: Math.max(1, Math.round(liveDurationSec / 60)),
      avgSpeedKmh: liveSpeed > 0 ? liveSpeed : 8.6,
      maxSpeedKmh: Number(((liveSpeed > 0 ? liveSpeed : 8.6) + 1.2).toFixed(1)),
      avgPace: speedToPace(liveSpeed > 0 ? liveSpeed : 8.6),
      avgFootAngle: liveAngle > 0 ? liveAngle : 21.0,
      maxFootAngle: Number(((liveAngle > 0 ? liveAngle : 21.0) + 3.5).toFixed(1)),
      minFootAngle: Number(((liveAngle > 0 ? liveAngle : 21.0) - 2.8).toFixed(1)),
      avgCadence: liveCadence > 0 ? liveCadence : 168,
      caloriesBurned: liveCalories > 0 ? liveCalories : 240,
      strikeDistribution: { forefoot: 15, midfoot: 75, heel: 10 },
      batteryLevel: 85,
      deviceConnected: deviceConnected,
      routeCoordinates: isTreadmill ? [] : liveTrailCoords,
      notes: isTreadmill ? 'บันทึกจากการวิ่งบนลู่วิ่ง (FootPod Sensor Telemetry)' : 'บันทึกผ่าน GPS Map Telemetry จากตำแหน่งปัจจุบัน'
    };

    onAddNewRun(newRun);
    setSavedRunNotice(true);
    setTimeout(() => {
      setSavedRunNotice(false);
      onBack();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#09090D] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 pb-28">
      
      {/* ========================================================================= */}
      {/* 1. DEVICE NOT CONNECTED ALERT MODAL                                       */}
      {/* ========================================================================= */}
      {showDeviceRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151522] border border-amber-500/40 dark:border-amber-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-500">
              <BluetoothOff className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ไม่พบอุปกรณ์ FootPod
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ไม่สามารถเริ่มวิ่งได้ เนื่องจากจำเป็นต้องดึงข้อมูลองศาการงอเท้า, ความเร็ว และรอบขาจากเซนเซอร์ FootPod เข้ามาก่อน กรุณาเชื่อมต่ออุปกรณ์ในหน้าตั้งค่า
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeviceRequiredModal(false);
                  onNavigateToSettings();
                }}
                className="w-full py-2.5 rounded-xl orange-btn-gradient text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>ไปที่หน้าตั้งค่าเพื่อเชื่อมต่ออุปกรณ์</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowDeviceRequiredModal(false)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#1E1E2C] hover:bg-slate-200 dark:hover:bg-[#28283A] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GPS PERMISSION MODAL (SHOWS ONLY ONCE PER SESSION)                     */}
      {/* ========================================================================= */}
      {showGPSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151522] border border-slate-200 dark:border-[#2C2C3E] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-brand/15 border border-brand/40 mx-auto flex items-center justify-center text-brand">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                เปิดใช้งานตำแหน่ง GPS หรือไม่?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ระบบจะใช้พิกัดตำแหน่งปัจจุบันของคุณเป็นจุดเริ่มต้นการวิ่งกลางแจ้ง และบันทึกเส้นทางแบบเรียลไทม์
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCancelGPSModal}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E1E2C] hover:bg-slate-200 dark:hover:bg-[#28283A] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmGPSModal}
                className="py-2.5 rounded-xl orange-btn-gradient text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ตกลง (เปิด GPS)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top GPS Header with Running Environment Selector */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E0E14]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#22222E] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#171722] hover:bg-slate-200 dark:hover:bg-[#20202E] border border-slate-200 dark:border-[#2B2B3C] text-slate-800 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับ</span>
              </button>

              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand" />
                <span>การวิ่ง & Telemetry</span>
              </h1>
            </div>

            {/* Online Status */}
            <div>
              {deviceConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  FootPod พร้อม
                </span>
              ) : (
                <button
                  onClick={onNavigateToSettings}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:underline flex items-center gap-1"
                >
                  <BluetoothOff className="w-3 h-3 text-amber-600" />
                  <span>ยังไม่เชื่อมต่อ</span>
                </button>
              )}
            </div>
          </div>

          {/* Running Environment Mode Selector (วิ่งกลางแจ้ง / วิ่งบนลู่วิ่ง) */}
          <div className="flex items-center bg-slate-100 dark:bg-[#151522] p-1 rounded-xl border border-slate-200 dark:border-[#262638] text-xs font-bold self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setRunEnvironment('outdoor')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                runEnvironment === 'outdoor'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>วิ่งกลางแจ้ง (Outdoor GPS)</span>
            </button>

            <button
              onClick={() => setRunEnvironment('treadmill')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                runEnvironment === 'treadmill'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>วิ่งบนลู่วิ่ง (Treadmill)</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        
        {/* Lifetime Stats (Clean 4 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">ระยะทางรวม</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalLifetimeDistance.toFixed(2)} km</p>
          </div>

          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">แคลอรี่รวม</span>
            <p className="text-xl font-black text-brand font-mono mt-0.5">{totalLifetimeCalories} kcal</p>
          </div>

          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">เวลาวิ่งรวม</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalLifetimeMinutes} นาที</p>
          </div>

          <div className="bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">รอบวิ่งทั้งหมด</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalLifetimeRuns} รอบ</p>
          </div>
        </div>

        {/* Map / Treadmill View + Live Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Main Visual Display (Outdoor Map or Treadmill Indoor HUD) */}
          <div className="lg:col-span-8 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-3.5 shadow-sm space-y-2.5">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {runEnvironment === 'outdoor' ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span>แผนที่ GPS กลางแจ้ง (ยึดตำแหน่งปัจจุบัน)</span>
                  </>
                ) : (
                  <>
                    <Gauge className="w-3.5 h-3.5 text-brand" />
                    <span>การวิ่งบนลู่วิ่งในร่ม (FootPod Sensor HUD)</span>
                  </>
                )}
              </span>

              {runEnvironment === 'outdoor' && (
                <button
                  type="button"
                  onClick={requestCurrentLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1A26] border border-slate-200 dark:border-[#2B2B3C] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-brand flex items-center gap-1 transition-colors"
                >
                  <Compass className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'ค้นหา...' : 'ระบุตำแหน่งฉัน'}</span>
                </button>
              )}
            </div>

            {/* OUTDOOR GPS MAP VIEW */}
            {runEnvironment === 'outdoor' ? (
              <div className="relative w-full h-80 sm:h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-[#20202E]">
                
                {/* Leaflet Map */}
                <div ref={mapContainerRef} className="w-full h-full z-10" />

                {/* If GPS is disabled by user */}
                {!gpsAllowed && (
                  <div className="absolute inset-0 z-20 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">ปิดการใช้งาน GPS อยู่</p>
                      <p className="text-xs text-slate-300 max-w-xs">
                        คุณสามารถเปิดใช้งาน GPS เพื่อจับพิกัดปัจจุบัน หรือสลับไปที่โหมด <strong>"วิ่งบนลู่วิ่ง"</strong> ได้
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={requestCurrentLocation}
                        className="px-4 py-2 rounded-xl orange-btn-gradient text-white text-xs font-bold shadow-md"
                      >
                        เปิดใช้งาน GPS
                      </button>
                      <button
                        onClick={() => setRunEnvironment('treadmill')}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
                      >
                        ไปโหมดลู่วิ่ง
                      </button>
                    </div>
                  </div>
                )}

                {/* Disconnected FootPod Floating Banner */}
                {!deviceConnected && (
                  <div className="absolute top-3 left-3 right-3 z-20 bg-amber-500/90 dark:bg-amber-950/90 backdrop-blur-md border border-amber-400/40 px-3 py-2 rounded-xl shadow-lg flex items-center justify-between gap-2 text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <BluetoothOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
                      <span>ยังไม่เชื่อมต่อ FootPod — ต้องเชื่อมต่ออุปกรณ์ก่อนเริ่มวิ่ง</span>
                    </div>
                    <button
                      onClick={onNavigateToSettings}
                      className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-[11px] hover:bg-slate-100 shrink-0"
                    >
                      เชื่อมต่อ
                    </button>
                  </div>
                )}

                {/* Floating Live Controls */}
                {gpsAllowed && (
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                    <div className="bg-white/95 dark:bg-[#0E0E14]/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white font-bold shadow-md">
                      {formatTimer(liveDurationSec)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleToggleTracking}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                          isLiveTracking ? 'bg-amber-500 text-black' : 'orange-btn-gradient text-white'
                        }`}
                      >
                        {isLiveTracking ? 'หยุดชั่วคราว' : 'เริ่มจำลองวิ่ง'}
                      </button>

                      {isLiveTracking && (
                        <button
                          onClick={handleSaveAndFinish}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                        >
                          บันทึกรอบนี้
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* TREADMILL INDOOR HUD VIEW */
              <div className="relative w-full h-80 sm:h-[400px] rounded-xl overflow-hidden bg-slate-900 dark:bg-[#0A0A10] border border-slate-800 dark:border-[#1E1E2E] flex flex-col justify-between p-5 text-white">
                
                {/* Treadmill Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Treadmill Active • คำนวณจาก FootPod Sensor
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    รอบขา: <strong className="text-white">{liveCadence} SPM</strong>
                  </span>
                </div>

                {/* Disconnected Notice on Treadmill */}
                {!deviceConnected && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300">
                      <BluetoothOff className="w-4 h-4 shrink-0" />
                      <span>ยังไม่เชื่อมต่ออุปกรณ์ — กรุณาเชื่อมต่อ FootPod ก่อนเริ่มวิ่ง</span>
                    </div>
                    <button
                      onClick={onNavigateToSettings}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] shrink-0"
                    >
                      ไปเชื่อมต่อ
                    </button>
                  </div>
                )}

                {/* Center Visual Treadmill Graphic */}
                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                  <div className="text-center">
                    <p className="text-5xl font-black font-mono text-brand tracking-tight">
                      {liveSpeed > 0 ? liveSpeed.toFixed(1) : '8.5'}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                      km/h (ความเร็วสายพาน)
                    </p>
                  </div>

                  {/* Animated Treadmill Belt */}
                  <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                    <div 
                      className={`h-full bg-gradient-to-r from-transparent via-brand to-transparent w-32 ${isLiveTracking ? 'animate-pulse' : ''}`}
                    />
                  </div>
                </div>

                {/* Bottom Treadmill Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono text-slate-300 font-bold">
                    เวลา: {formatTimer(liveDurationSec)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleTracking}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                        isLiveTracking ? 'bg-amber-500 text-black' : 'orange-btn-gradient text-white'
                      }`}
                    >
                      {isLiveTracking ? 'หยุดวิ่ง' : 'เริ่มวิ่งบนลู่วิ่ง'}
                    </button>

                    {isLiveTracking && (
                      <button
                        onClick={handleSaveAndFinish}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                      >
                        บันทึก
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {savedRunNotice && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>บันทึกรอบวิ่งสำเร็จ!</span>
              </div>
            )}
          </div>

          {/* Telemetry HUD (Minimal 4 Numbers) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#232334] rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block pb-2 border-b border-slate-100 dark:border-[#20202E]">
              เซนเซอร์ Telemetry สด ({runEnvironment === 'outdoor' ? 'กลางแจ้ง' : 'ลู่วิ่ง'})
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">องศาข้อเท้า</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{liveAngle}°</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{angleAnalysis.safetyZone}</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">ความเร็ว</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{liveSpeed}</p>
                <span className="text-[10px] text-slate-500 font-mono">Pace {speedToPace(liveSpeed)}</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">ระยะทางสด</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">{liveDistance.toFixed(2)}</p>
                <span className="text-[10px] text-slate-500">กิโลเมตร</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0D0D13] p-3 rounded-xl border border-slate-200 dark:border-[#222230]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">แคลอรี่สด</span>
                <p className="text-2xl font-black text-brand font-mono mt-0.5">{liveCalories}</p>
                <span className="text-[10px] text-slate-500">kcal ({liveSteps} ก้าว)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
