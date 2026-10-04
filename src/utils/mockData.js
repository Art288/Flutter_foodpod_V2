/**
 * mockData.js
 * Default user datasets, telemetry points, and simulated FootPod device sync data + GPS coordinates.
 */

export const INITIAL_USER = {
  id: 'user_001',
  name: 'สมชาย นักวิ่งสายสุขภาพ',
  email: 'runner@footpod.io',
  password: 'password123',
  age: 28,
  gender: 'ชาย (Male)',
  weightKg: 68,
  heightCm: 175,
  footSide: 'ขวา (Right Foot)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const INITIAL_GOAL = {
  mode: 'fitness', // 'fitness' | 'marathon'
  modeName: 'วิ่งออกกำลังกาย (General Fitness)',
  targetDistanceKm: 5.0,
  recommendedSpeedAvg: 8.4,
  recommendedSpeedRange: '8.0 - 8.8 km/h',
  recommendedPace: '7\'08"',
  targetFootAngle: '18° - 24°',
  targetCadence: '160 - 170 spm',
  injuryPreventionTip: 'ระยะทางมาตรฐาน 4-5 กม.: รักษาระดับความเร็วที่ควบคุมลมหายใจได้ (Zone 2) เพื่อลดความเหนื่อยสะสมและถนอมข้อเข่า',
  createdAt: '2026-08-28T09:00:00.000Z'
};

// Zero State initial run (All metrics set to 0 by default until synced)
export const INITIAL_ZERO_RUN = {
  id: 'zero_state_idle',
  dateFormatted: 'ยังไม่มีข้อมูล (รอการซิงค์จาก FootPod)',
  timestamp: null,
  title: 'รอการซิงค์ข้อมูลจากเซนเซอร์ FootPod',
  locationName: '-',
  mode: 'fitness',
  steps: 0,
  impactG: 1.0,
  distanceKm: 0.0,
  durationMinutes: 0,
  avgSpeedKmh: 0.0,
  maxSpeedKmh: 0.0,
  avgPace: '-:--',
  avgFootAngle: 0.0,
  maxFootAngle: 0.0,
  minFootAngle: 0.0,
  avgCadence: 0,
  caloriesBurned: 0,
  strikeDistribution: {
    forefoot: 0,
    midfoot: 0,
    heel: 0
  },
  batteryLevel: 0,
  deviceConnected: false,
  routeCoordinates: [],
  telemetry: [],
  notes: 'กรุณาเชื่อมต่ออุปกรณ์ FootPod ในหน้าตั้งค่า และกดปุ่ม "ซิงค์ข้อมูลจากอุปกรณ์" เพื่อดึงข้อมูลการวิ่ง'
};

// Generate realistic time-series points for foot angle & speed charts
export const generateTimeSeriesTelemetry = (pointCount = 18, baseAngle = 21.4, baseSpeed = 8.8) => {
  const points = [];
  for (let i = 1; i <= pointCount; i++) {
    const minute = i * 2;
    const angleNoise = (Math.sin(i * 0.7) * 2.2) + ((Math.random() - 0.5) * 1.5);
    const speedNoise = (Math.cos(i * 0.5) * 0.4) + ((Math.random() - 0.5) * 0.3);
    const cadenceNoise = Math.round(168 + (Math.sin(i * 0.8) * 5) + ((Math.random() - 0.5) * 4));

    const angle = Number((baseAngle + angleNoise).toFixed(1));
    const speed = Number(Math.max(4, (baseSpeed + speedNoise)).toFixed(1));

    points.push({
      time: `${minute} นาที`,
      minute: minute,
      footAngle: angle,
      speed: speed,
      cadence: cadenceNoise,
      safetyThresholdMin: 15,
      safetyThresholdMax: 25
    });
  }
  return points;
};

// Sample realistic GPS Coordinates (Chatuchak Park Loop, Bangkok)
export const SAMPLE_GPS_ROUTES = {
  chatuchak: [
    [13.8118, 100.5552],
    [13.8130, 100.5560],
    [13.8145, 100.5575],
    [13.8162, 100.5590],
    [13.8180, 100.5598],
    [13.8195, 100.5585],
    [13.8205, 100.5562],
    [13.8198, 100.5535],
    [13.8182, 100.5515],
    [13.8160, 100.5502],
    [13.8140, 100.5512],
    [13.8125, 100.5530],
    [13.8118, 100.5552]
  ],
  lumphini: [
    [13.7315, 100.5415],
    [13.7330, 100.5430],
    [13.7350, 100.5448],
    [13.7365, 100.5435],
    [13.7370, 100.5405],
    [13.7355, 100.5385],
    [13.7335, 100.5375],
    [13.7315, 100.5390],
    [13.7315, 100.5415]
  ]
};

// Default runs starts EMPTY so all app metrics start at 0
export const SAMPLE_RUNS = [];

// Session data stored in FootPod hardware memory (BNO055 9-DOF) ready to sync
export const MOCK_NEW_DEVICE_SESSION = {
  id: 'run_synced_' + Date.now(),
  dateFormatted: 'วันนี้ (ซิงค์ล่าสุดจาก BNO055)',
  timestamp: new Date().toISOString(),
  title: 'การวิ่งตรวจวัดจากเซนเซอร์ FootPod (BNO055)',
  locationName: 'สวนจตุจักร กรุงเทพฯ',
  mode: 'fitness',
  distanceKm: 5.25,
  durationMinutes: 36,
  avgSpeedKmh: 8.75,
  maxSpeedKmh: 10.2,
  avgPace: '6\'51"',
  avgFootAngle: 21.4, // Optimal midfoot flexion
  maxFootAngle: 26.8,
  minFootAngle: 16.2,
  avgCadence: 168,
  caloriesBurned: 385,
  strikeDistribution: {
    forefoot: 18,
    midfoot: 72,
    heel: 10
  },
  batteryLevel: 88,
  deviceConnected: true,
  routeCoordinates: SAMPLE_GPS_ROUTES.chatuchak,
  telemetry: generateTimeSeriesTelemetry(18, 21.4, 8.75),
  notes: 'ดึงข้อมูลสำเร็จจาก FootPod Hardware Memory: การลงเท้าอยู่ใน Safe Zone 72%'
};
