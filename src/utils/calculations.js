/**
 * calculations.js
 * Biomechanical algorithms for FootPod telemetry, calories, and dynamic speed recommendation.
 */

/**
 * Calculate calories burned based on speed, distance, duration, weight, and foot angle biomechanics.
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Average speed in km/h
 * @param {number} weightKg - User body weight in kg (default 65)
 * @param {number} avgFootAngle - Foot flexion angle in degrees (default 20)
 * @returns {number} Estimated calories burned (kcal)
 */
export function calculateCalories(distanceKm, speedKmh, weightKg = 65, avgFootAngle = 20) {
  if (!distanceKm || distanceKm <= 0 || !speedKmh || speedKmh <= 0) return 0;

  // Duration in hours
  const durationHours = distanceKm / speedKmh;

  // Estimate MET based on running speed (Compendium of Physical Activities)
  let met = 8.0;
  if (speedKmh < 7) {
    met = 6.0; // Jogging/walking
  } else if (speedKmh < 8.5) {
    met = 8.3; // Light jog
  } else if (speedKmh < 10) {
    met = 9.8; // Moderate run
  } else if (speedKmh < 11.5) {
    met = 11.0; // Fast run
  } else if (speedKmh < 13) {
    met = 12.3;
  } else {
    met = 14.5; // Sprint/high pace
  }

  // Biomechanical adjustment: Extreme heel strike (>28°) or improper angle causes braking forces (+5-8% energy cost)
  let efficiencyMultiplier = 1.0;
  if (avgFootAngle > 28) {
    efficiencyMultiplier = 1.06; // Extra energy expended due to braking shock
  } else if (avgFootAngle >= 15 && avgFootAngle <= 25) {
    efficiencyMultiplier = 0.98; // Optimal midfoot efficiency
  }

  const rawCalories = met * weightKg * durationHours * efficiencyMultiplier;
  return Math.round(rawCalories);
}

/**
 * Format speed in km/h to running pace string (e.g. 5'30" /km)
 * @param {number} speedKmh 
 * @returns {string} Pace format mm'ss" /km
 */
export function speedToPace(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return "--'--\"";
  const paceMinutesDecimal = 60 / speedKmh;
  const minutes = Math.floor(paceMinutesDecimal);
  const seconds = Math.round((paceMinutesDecimal - minutes) * 60);
  const formattedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}'${formattedSec}"`;
}

/**
 * Analyze foot flexion / strike angle and provide injury risk rating and advice.
 * @param {number} angleDegrees 
 * @returns {object} Analysis result
 */
export function analyzeFootAngle(angleDegrees) {
  const angle = Number(angleDegrees) || 0;

  if (angle <= 0) {
    return {
      type: 'รอข้อมูลจากเซนเซอร์',
      label: 'รอการซิงค์ข้อมูลจาก FootPod',
      status: 'idle',
      color: '#8E8EA0',
      textColor: 'text-slate-500 dark:text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
      safetyZone: 'รอข้อมูลเซนเซอร์',
      description: 'กรุณาเชื่อมต่ออุปกรณ์ FootPod ในหน้าตั้งค่า และกด "ซิงค์ข้อมูลจากอุปกรณ์" เพื่อเริ่มการวิเคราะห์องศาการลงเท้า',
      recommendedAngle: '15° - 25°'
    };
  }

  if (angle < 15) {
    return {
      type: 'Forefoot Strike',
      label: 'ลงปลายเท้า (Forefoot)',
      status: 'warning',
      color: '#F59E0B', // Amber
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      safetyZone: 'ต่ำกว่ามาตรฐานเล็กน้อย',
      description: 'มุมการงอเท้าน้อย เหมาะกับสปรินต์ แต่อาจเพิ่มภาระกล้ามเนื้อน่องและเอ็นร้อยหวายหากวิ่งระยะไกล',
      recommendedAngle: '15° - 25°'
    };
  } else if (angle <= 25) {
    return {
      type: 'Midfoot Strike',
      label: 'ลงกลางเท้า (Midfoot - ปลอดภัยสมดุล)',
      status: 'optimal',
      color: '#10B981', // Green
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      safetyZone: 'โซนปลอดภัยมาตรฐาน (Safe Zone)',
      description: 'องศาการงอเท้าอยู่ในระดับสมบูรณ์แบบ กระจายแรงกระแทกได้ดีที่สุด ลดความเสี่ยงต่อหัวเข่าและข้อเท้า',
      recommendedAngle: '15° - 25°'
    };
  } else if (angle <= 32) {
    return {
      type: 'Moderate Heel Strike',
      label: 'ลงส้นเท้าปานกลาง (Moderate Heel)',
      status: 'caution',
      color: '#FF7A00', // Orange
      textColor: 'text-brand-400',
      bgColor: 'bg-brand-500/10',
      borderColor: 'border-brand-500/30',
      safetyZone: 'ระวังแรงสะท้อน',
      description: 'มุมการงอเท้าเริ่มสูง มีแรงกระแทกส่งตรงถึงหัวเข่าเล็กน้อย แนะนำลดช่วงก้าว (Stride) ให้เท้าลงใต้ลำตัวมากขึ้น',
      recommendedAngle: '15° - 25°'
    };
  } else {
    return {
      type: 'Heavy Heel Strike',
      label: 'ลงส้นเท้ามากเกินไป (Heavy Over-stride)',
      status: 'danger',
      color: '#EF4444', // Red
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      safetyZone: 'เสี่ยงต่ออาการบาดเจ็บ',
      description: 'องศาการงอเท้าสูงเกินไป ทำให้เกิดแรงเบรกกระแทกที่ข้อเท้าและข้อเข่า เสี่ยงต่อโรครองช้ำ (Plantar Fasciitis) และหน้าแข้ง (Shin Splints)',
      recommendedAngle: '15° - 25°'
    };
  }
}

/**
 * Dynamic Speed & Pace Recommendation Algorithm based on Distance and Mode.
 * Mode 1: วิ่งออกกำลังกาย (General Fitness / Jogging)
 * Mode 2: วิ่งมาราธอน (Marathon Training)
 * 
 * @param {number} distanceKm - Target distance in km
 * @param {'fitness' | 'marathon'} mode - Target mode
 * @returns {object} Recommended speed, pace, time, and injury reduction tips
 */
export function calculateDynamicRecommendation(distanceKm, mode = 'fitness') {
  const dist = Math.max(0.5, Number(distanceKm) || 1);

  if (mode === 'fitness') {
    // General Fitness / Jogging: Designed for sustainable aerobic fat burning and low joint impact
    let recSpeed = 8.5;
    let tip = '';
    let targetAngle = '18° - 24°';
    let targetCadence = '160 - 170 spm';

    if (dist <= 3) {
      recSpeed = 9.2;
      tip = 'ระยะทางสั้น 1-3 กม.: เหมาะสำหรับการเบิร์นไขมันและกระตุ้นการเต้นของหัวใจ ใช้ความเร็วระดับปานกลางได้อย่างปลอดภัย';
    } else if (dist <= 5) {
      recSpeed = 8.4;
      tip = 'ระยะทางมาตรฐาน 4-5 กม.: รักษาระดับความเร็วที่ควบคุมลมหายใจได้ (Zone 2) เพื่อลดความเหนื่อยสะสมและถนอมข้อเข่า';
    } else if (dist <= 8) {
      recSpeed = 7.8;
      tip = 'ระยะทาง 6-8 กม.: ระบบปรับลดความเร็วลงเพื่อป้องกันอาการปวดล้ากล้ามเนื้อน่องและลดแรงกระแทกซ้ำซ้อน';
    } else {
      recSpeed = 7.2;
      tip = 'ระยะทางมากกว่า 8 กม.: แนะนำวิ่งจ็อกกิ้งความเร็วสบายๆ โฟกัสการลงน้ำหนักกลางเท้า เพื่อไม่ให้หัวใจทำงานหนักเกินไป';
    }

    const estimatedMinutes = Math.round((dist / recSpeed) * 60);

    return {
      mode: 'fitness',
      modeName: 'วิ่งออกกำลังกาย (General Fitness)',
      distanceKm: dist,
      recommendedSpeedMin: Number((recSpeed - 0.4).toFixed(1)),
      recommendedSpeedMax: Number((recSpeed + 0.4).toFixed(1)),
      recommendedSpeedAvg: Number(recSpeed.toFixed(1)),
      recommendedPace: speedToPace(recSpeed),
      estimatedTimeMinutes: estimatedMinutes,
      recommendedFootAngle: targetAngle,
      recommendedCadence: targetCadence,
      injuryPreventionTip: tip,
      benefits: [
        'ลดแรงกระแทกข้อเข่าและข้อเท้า',
        'กระตุ้นการเผาผลาญไขมันในโซนแอโรบิก',
        'ไม่ทำให้เหนื่อยหอบหรือหัวใจเต้นเร็วเกินเกณฑ์'
      ]
    };
  } else {
    // Marathon Training: Based on long-distance endurance pacing models (e.g. Pete Riegel base endurance)
    let recSpeed = 9.5;
    let tip = '';
    let targetAngle = '16° - 22°';
    let targetCadence = '175 - 185 spm';

    if (dist <= 10.5) {
      // Mini Marathon
      recSpeed = 10.2;
      tip = 'ระยะมินิมาราธอน (10.5 กม.): รักษาความเร็วสม่ำเสมอ แนะนำใช้รอบขา (Cadence) ถี่ขึ้น เพื่อลดระยะก้าวและลดแรงกระแทกข้อเท้า';
    } else if (dist <= 21.1) {
      // Half Marathon
      recSpeed = 9.4;
      tip = 'ระยะฮาล์ฟมาราธอน (21.1 กม.): ปรับความเร็วคงที่เพื่อประหยัดไกลโคเจน การงอเท้า 16°-20° ช่วยลดความเสี่ยงเอ็นร้อยหวายอักเสบ';
    } else if (dist <= 35) {
      // Long Run Training
      recSpeed = 8.8;
      tip = 'ระยะซ้อมมาราธอนระยะยาว (25-35 กม.): ความเร็วถูกคำนวณให้เหมาะกับ Aerobic Base ไม่ควรเร่งแซงช่วงแรกเพื่อเลี่ยงอาการชนกำแพง (The Wall)';
    } else {
      // Full Marathon (42.195 km)
      recSpeed = 8.5;
      tip = 'ระยะฟูลมาราธอน (42.195 กม.): ความเร็วมาตรฐานสำหรับการจบอย่างปลอดภัย โฟกัสการลงเท้าแบบ Midfoot และดื่มเกลือแร่สม่ำเสมอ';
    }

    const estimatedMinutes = Math.round((dist / recSpeed) * 60);
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    const timeFormatted = hours > 0 ? `${hours} ชม. ${mins} นาที` : `${mins} นาที`;

    return {
      mode: 'marathon',
      modeName: 'วิ่งมาราธอน (Marathon Training)',
      distanceKm: dist,
      recommendedSpeedMin: Number((recSpeed - 0.5).toFixed(1)),
      recommendedSpeedMax: Number((recSpeed + 0.5).toFixed(1)),
      recommendedSpeedAvg: Number(recSpeed.toFixed(1)),
      recommendedPace: speedToPace(recSpeed),
      estimatedTimeMinutes: estimatedMinutes,
      estimatedTimeString: timeFormatted,
      recommendedFootAngle: targetAngle,
      recommendedCadence: targetCadence,
      injuryPreventionTip: tip,
      benefits: [
        'จัดสรรพลังงานคงที่ตลอดระยะทางไกล',
        'ลดความเสี่ยงโรครองช้ำและเอ็นร้อยหวายอักเสบ',
        'ควบคุม Pace ให้สอดคล้องกับความทนทานของกล้ามเนื้อ'
      ]
    };
  }
}

/**
 * Calculate BMI, Asian standard health category, and recommended weight adjustment target.
 * @param {number} weightKg - Body weight in kg
 * @param {number} heightCm - Height in cm
 * @returns {object} BMI calculations and recommendation
 */
export function calculateBMI(weightKg, heightCm) {
  const weight = Number(weightKg) || 0;
  const height = Number(heightCm) || 0;

  if (weight <= 0 || height <= 0) {
    return {
      bmi: 0,
      category: 'รอข้อมูลสุขภาพ',
      status: 'idle',
      color: '#8E8EA0',
      textColor: 'text-slate-500 dark:text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
      targetBMI: 21.5,
      idealWeightKg: 0,
      weightDiffKg: 0,
      direction: 'maintain',
      advice: 'กรุณากรอกน้ำหนักและส่วนสูงในหน้าตั้งค่า'
    };
  }

  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));
  const targetBMI = 21.5; // Ideal standard for Asian runners
  const idealWeightKg = Number((targetBMI * (heightM * heightM)).toFixed(1));
  const weightDiffKg = Number((weight - idealWeightKg).toFixed(1));

  let category = 'น้ำหนักสมส่วน (Normal)';
  let status = 'normal';
  let color = '#10B981';
  let textColor = 'text-emerald-600 dark:text-emerald-400';
  let bgColor = 'bg-emerald-500/10';
  let borderColor = 'border-emerald-500/30';
  let direction = 'maintain';
  let advice = '';

  if (bmi < 18.5) {
    category = 'น้ำหนักน้อยกว่าเกณฑ์ (Underweight)';
    status = 'under';
    color = '#3B82F6';
    textColor = 'text-blue-600 dark:text-blue-400';
    bgColor = 'bg-blue-500/10';
    borderColor = 'border-blue-500/30';
    direction = 'gain';
    advice = `ควรเพิ่มมวลกล้ามเนื้ออีก ${Math.abs(weightDiffKg)} กก. เพื่อให้ BMI แตะ 21.5 (น้ำหนักเป้าหมาย ${idealWeightKg} กก.)`;
  } else if (bmi <= 22.9) {
    category = 'สมส่วน สุขภาพดี (Healthy Normal)';
    status = 'normal';
    color = '#10B981';
    textColor = 'text-emerald-600 dark:text-emerald-400';
    bgColor = 'bg-emerald-500/10';
    borderColor = 'border-emerald-500/30';
    direction = 'maintain';
    advice = `ดัชนีมวลกายอยู่ในเกณฑ์สมบูรณ์แบบ (เป้าหมาย 18.5 - 22.9) ช่วยลดแรงกระแทกข้อเข่าขณะวิ่ง`;
  } else if (bmi <= 24.9) {
    category = 'น้ำหนักเกินเกณฑ์เล็กน้อย (Overweight)';
    status = 'over';
    color = '#F59E0B';
    textColor = 'text-amber-600 dark:text-amber-400';
    bgColor = 'bg-amber-500/10';
    borderColor = 'border-amber-500/30';
    direction = 'lose';
    advice = `ควรลดน้ำหนักลงอีก ${weightDiffKg} กก. ให้เหลือ ${idealWeightKg} กก. (BMI 21.5) เพื่อลดภาระแรงกดข้อเท้า`;
  } else {
    category = 'น้ำหนักเกินมาตรฐาน (Obese)';
    status = 'obese';
    color = '#EF4444';
    textColor = 'text-rose-600 dark:text-rose-400';
    bgColor = 'bg-rose-500/10';
    borderColor = 'border-rose-500/30';
    direction = 'lose';
    advice = `ควรลดน้ำหนักลง ${weightDiffKg} กก. ให้เหลือ ${idealWeightKg} กก. (BMI 21.5) แนะนำวิ่ง Zone 2 ควบคู่คุมอาหาร`;
  }

  return {
    bmi,
    category,
    status,
    color,
    textColor,
    bgColor,
    borderColor,
    targetBMI,
    idealWeightKg,
    weightDiffKg,
    direction,
    advice
  };
}

/**
 * Convert running distance in km to estimated steps based on height stride length
 * @param {number} distanceKm - Distance in km
 * @param {number} heightCm - Height in cm (default 170)
 * @returns {number} Estimated steps
 */
export function distanceToSteps(distanceKm, heightCm = 170) {
  const dist = Number(distanceKm) || 0;
  if (dist <= 0) return 0;
  const height = Number(heightCm) || 170;
  const strideLengthMeters = (height * 0.45) / 100 || 0.78;
  return Math.round((dist * 1000) / strideLengthMeters);
}

