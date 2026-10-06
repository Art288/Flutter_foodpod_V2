import React, { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Move
} from 'lucide-react';

// Register ChartJS modules including zoom plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

export const RunAnalyticsCharts = ({ telemetry = [] }) => {
  const [activeTab, setActiveTab] = useState('angle'); // 'angle' | 'impact'
  const chartRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Zoom and Pan Handlers (Full 2D: X and Y)
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.3);
      setIsZoomed(true);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.77);
      setIsZoomed(true);
    }
  };

  const handlePanLeft = () => {
    if (chartRef.current) {
      chartRef.current.pan({ x: 60 }, undefined, 'default');
      setIsZoomed(true);
    }
  };

  const handlePanRight = () => {
    if (chartRef.current) {
      chartRef.current.pan({ x: -60 }, undefined, 'default');
      setIsZoomed(true);
    }
  };

  const handlePanUp = () => {
    if (chartRef.current) {
      chartRef.current.pan({ y: 35 }, undefined, 'default');
      setIsZoomed(true);
    }
  };

  const handlePanDown = () => {
    if (chartRef.current) {
      chartRef.current.pan({ y: -35 }, undefined, 'default');
      setIsZoomed(true);
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setIsZoomed(false);
    }
  };

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-6 text-center shadow-sm dark:shadow-card-dark transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 mx-auto flex items-center justify-center text-brand mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          กราฟแสดงแนวโน้มองศาเท้าและแรงกระแทกตามเวลา (Impact Telemetry Series)
        </h3>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-1 max-w-md mx-auto">
          ยังไม่มีข้อมูลกราฟ Real-Time — กรุณาเชื่อมต่อ Bluetooth กับอุปกรณ์ FootPod เพื่อเริ่มสตรีมข้อมูล
        </p>
      </div>
    );
  }

  const labels = telemetry.map(t => t.time || t.timeFormatted || `${t.timeSeconds}s`);
  const angleData = telemetry.map(t => t.footAngle);
  const impactData = telemetry.map(t => t.accelerationZ || t.impactG || 1.2);
  const cadenceData = telemetry.map(t => t.cadence);

  // Common Zoom & Pan Plugin Configuration supporting both X and Y axes
  const commonZoomPluginConfig = {
    pan: {
      enabled: true,
      mode: 'xy', // Allows panning both horizontally and vertically
      modifierKey: null,
      onPanComplete: () => setIsZoomed(true)
    },
    zoom: {
      wheel: {
        enabled: true,
        speed: 0.1
      },
      pinch: {
        enabled: true
      },
      mode: 'xy', // Allows zooming both horizontally and vertically
      onZoomComplete: () => setIsZoomed(true)
    }
  };

  // 1. Foot Flexion Angle Chart Configuration
  const angleChartData = {
    labels,
    datasets: [
      {
        label: 'องศาการงอเท้า (Flexion Angle °)',
        data: angleData,
        borderColor: '#FF6600',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(255, 102, 0, 0.35)');
          gradient.addColorStop(1, 'rgba(255, 102, 0, 0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#FF6600',
        pointBorderColor: '#121218',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35
      }
    ]
  };

  const angleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#171722',
        titleColor: '#FF8833',
        bodyColor: '#FFFFFF',
        borderColor: '#2D2D3E',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            let status = 'โซนปลอดภัย (Safe Zone)';
            if (val < 15) status = 'ปลายเท้า (Forefoot)';
            if (val > 25) status = 'ส้นเท้า (Heel Strike)';
            return `องศา: ${val}° — ${status}`;
          }
        }
      },
      zoom: commonZoomPluginConfig
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#8E8EA0',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      y: {
        // Starts at 0 so lower angles (e.g. 5° - 10°) are clearly visible without being cut off
        min: 0,
        suggestedMax: 40,
        grid: {
          color: 'rgba(255, 255, 255, 0.06)'
        },
        ticks: {
          color: '#8E8EA0',
          font: { size: 11 },
          callback: (value) => `${value}°`
        }
      }
    }
  };

  // 2. Impact Force & Cadence Chart Configuration
  const impactChartData = {
    labels,
    datasets: [
      {
        label: 'แรงกระแทกเท้า (Impact G-Force)',
        data: impactData,
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'รอบขา Cadence (spm)',
        data: cadenceData,
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderWidth: 1.8,
        borderDash: [4, 4],
        pointRadius: 2,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const impactOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#C0C0D0',
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#171722',
        titleColor: '#A855F7',
        bodyColor: '#FFFFFF',
        borderColor: '#2D2D3E',
        borderWidth: 1,
        padding: 10
      },
      zoom: commonZoomPluginConfig
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { 
          color: '#8E8EA0', 
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0.0,
        suggestedMax: 3.5,
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: {
          color: '#A855F7',
          font: { size: 11 },
          callback: (value) => `${value} G`
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        suggestedMax: 220,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#F59E0B',
          font: { size: 11 },
          callback: (value) => `${value} spm`
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-card-dark transition-colors space-y-4">
      
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            <span>กราฟวิเคราะห์ข้อมูลเชิงลึกตลอดช่วงเวลาการวิ่ง (Time-Series Telemetry)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
            ข้อมูลตรวจจับแรงกระแทกจาก ESP32-C3 และการเคลื่อนไหวแบบ Real-time
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#232332] rounded-xl self-start lg:self-auto">
          <button
            onClick={() => {
              setActiveTab('angle');
              handleResetZoom();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'angle'
                ? 'bg-brand text-white shadow-orange-glow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>องศาการงอเท้า (° Flexion)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('impact');
              handleResetZoom();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'impact'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>แรงกระแทก & รอบขา (Impact G / Cadence)</span>
          </button>
        </div>
      </div>

      {/* Interactive Zoom & Pan Toolbar (Supports Pan Up, Down, Left, Right, Zoom In, Zoom Out) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161622] border border-slate-200 dark:border-[#262638]">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Move className="w-3.5 h-3.5 text-brand" />
            <span>ซูม & เลื่อน:</span>
          </span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white dark:bg-[#20202F] border border-slate-200 dark:border-[#2E2E42] text-slate-700 dark:text-slate-200 hover:text-brand hover:border-brand/50 text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
            title="ซูมเข้า (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">ซูมเข้า</span>
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white dark:bg-[#20202F] border border-slate-200 dark:border-[#2E2E42] text-slate-700 dark:text-slate-200 hover:text-brand hover:border-brand/50 text-xs font-semibold transition-all flex items-center gap-1 shadow-xs"
            title="ซูมออก (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">ซูมออก</span>
          </button>

          {/* Vertical Pan Controls (Up / Down) */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-[#2E2E42] bg-white dark:bg-[#20202F] overflow-hidden">
            <button
              onClick={handlePanUp}
              className="p-1.5 sm:px-2 sm:py-1 text-slate-700 dark:text-slate-200 hover:text-brand hover:bg-slate-100 dark:hover:bg-[#2A2A3E] text-xs font-semibold transition-all flex items-center gap-1 border-r border-slate-200 dark:border-[#2E2E42]"
              title="เลื่อนดูกราฟขึ้นด้านบน (Pan Up)"
            >
              <ChevronUp className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">เลื่อนขึ้น</span>
            </button>
            <button
              onClick={handlePanDown}
              className="p-1.5 sm:px-2 sm:py-1 text-slate-700 dark:text-slate-200 hover:text-brand hover:bg-slate-100 dark:hover:bg-[#2A2A3E] text-xs font-semibold transition-all flex items-center gap-1"
              title="เลื่อนดูกราฟลงด้านล่าง (Pan Down)"
            >
              <ChevronDown className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">เลื่อนลง</span>
            </button>
          </div>

          {/* Horizontal Pan Controls (Left / Right) */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-[#2E2E42] bg-white dark:bg-[#20202F] overflow-hidden">
            <button
              onClick={handlePanLeft}
              className="p-1.5 sm:px-2 sm:py-1 text-slate-700 dark:text-slate-200 hover:text-brand hover:bg-slate-100 dark:hover:bg-[#2A2A3E] text-xs font-semibold transition-all flex items-center gap-1 border-r border-slate-200 dark:border-[#2E2E42]"
              title="เลื่อนดูกราฟไปทางซ้าย (Pan Left)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เลื่อนซ้าย</span>
            </button>
            <button
              onClick={handlePanRight}
              className="p-1.5 sm:px-2 sm:py-1 text-slate-700 dark:text-slate-200 hover:text-brand hover:bg-slate-100 dark:hover:bg-[#2A2A3E] text-xs font-semibold transition-all flex items-center gap-1"
              title="เลื่อนดูกราฟไปทางขวา (Pan Right)"
            >
              <span className="hidden sm:inline">เลื่อนขวา</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              isZoomed
                ? 'bg-brand/15 text-brand border border-brand/40 shadow-orange-glow'
                : 'bg-white dark:bg-[#20202F] border border-slate-200 dark:border-[#2E2E42] text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="รีเซ็ตขนาดกราฟกลับค่าเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ต</span>
          </button>
        </div>

        {/* User Guide Pill */}
        <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:flex items-center gap-1">
          <span>💡 ลากเมาส์เลื่อนได้อิสระทั้ง 4 ทิศทาง (ขึ้น-ลง / ซ้าย-ขวา) • เลื่อนล้อเมาส์เพื่อซูม</span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-72 sm:h-80 w-full relative cursor-grab active:cursor-grabbing select-none">
        {activeTab === 'angle' ? (
          <>
            <Line ref={chartRef} data={angleChartData} options={angleOptions} />
            <div className="absolute top-2 right-2 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] text-emerald-300 font-semibold pointer-events-none shadow-sm backdrop-blur-xs">
              Safe Zone แนะนำ: 15° - 25°
            </div>
          </>
        ) : (
          <Line ref={chartRef} data={impactChartData} options={impactOptions} />
        )}
      </div>

      {/* Footer Notes */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1F1F2C] flex items-center justify-between text-xs text-slate-500 dark:text-dark-muted flex-wrap gap-2">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
          <span>นับก้าวและวัดแรงกระแทกด้วยอัลกอริทึม Shock Detection บน ESP32-C3 SuperMini</span>
        </span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          ความถี่การสุ่มตัวอย่าง: 50 Hz (Impact Sampling)
        </span>
      </div>

    </div>
  );
};
