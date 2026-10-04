import React, { useState } from 'react';
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
import { Line } from 'react-chartjs-2';
import { TrendingUp, Activity, Zap, ShieldAlert } from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const RunAnalyticsCharts = ({ telemetry = [] }) => {
  const [activeTab, setActiveTab] = useState('angle'); // 'angle' | 'impact'

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
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#8E8EA0',
          font: { size: 11 }
        }
      },
      y: {
        min: 10,
        max: 35,
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
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#8E8EA0', font: { size: 11 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0.8,
        max: 3.5,
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
        max: 220,
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
    <div className="bg-white dark:bg-[#13131C] border border-slate-200 dark:border-[#232332] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-card-dark transition-colors">
      
      {/* Chart Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            กราฟวิเคราะห์ข้อมูลเชิงลึกตลอดช่วงเวลาการวิ่ง (Time-Series Telemetry)
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
            ข้อมูลตรวจจับแรงกระแทกจาก ESP32-C3 และการเคลื่อนไหวแบบ Real-time
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0E0E14] border border-slate-200 dark:border-[#232332] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('angle')}
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
            onClick={() => setActiveTab('impact')}
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

      {/* Chart Canvas Area */}
      <div className="h-72 sm:h-80 w-full relative">
        {activeTab === 'angle' ? (
          <>
            <Line data={angleChartData} options={angleOptions} />
            <div className="absolute top-2 right-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] text-emerald-300 font-semibold pointer-events-none">
              Safe Zone แนะนำ: 15° - 25°
            </div>
          </>
        ) : (
          <Line data={impactChartData} options={impactOptions} />
        )}
      </div>

      {/* Footer Notes */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1F1F2C] flex items-center justify-between text-xs text-slate-500 dark:text-dark-muted flex-wrap gap-2">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
          นับก้าวและวัดแรงกระแทกด้วยอัลกอริทึม Shock Detection บน ESP32-C3 SuperMini
        </span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          ความถี่การสุ่มตัวอย่าง: 50 Hz (Impact Sampling)
        </span>
      </div>

    </div>
  );
};
