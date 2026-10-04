/**
 * dateUtils.js
 * Comprehensive Thai Buddhist calendar and date conversion utilities for FootPod runs.
 */

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
export const THAI_DAYS_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

const THAI_MONTH_INDEX = {
  'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
  'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
};

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Extract YYYY-MM-DD date key from a run record
 */
export function getRunDateKey(run) {
  if (!run) return '';
  if (run.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(run.dateKey)) {
    return run.dateKey;
  }
  if (run.timestamp) {
    const d = new Date(run.timestamp);
    if (!isNaN(d.getTime())) {
      return toDateKey(d);
    }
  }
  if (run.dateFormatted) {
    // E.g. "5 ต.ค. 2569, 00:17 น."
    const clean = run.dateFormatted.replace(',', ' ').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const mStr = parts[1];
      const m = THAI_MONTH_INDEX[mStr];
      let y = parseInt(parts[2], 10);
      if (y > 2400) y -= 543;
      if (!isNaN(day) && m !== undefined && !isNaN(y)) {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return '';
}

/**
 * Format a Date to Thai Full String (e.g. "วันจันทร์ที่ 5 ตุลาคม 2569")
 */
export function formatThaiFullDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const dayName = THAI_DAYS_FULL[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${dayName}ที่ ${day} ${month} ${year}`;
}

/**
 * Format date to Thai short string (e.g. "5 ต.ค. 2569")
 */
export function formatThaiDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

/**
 * Get number of days in a given month (0-indexed month)
 */
export function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Generate calendar grid array for a given year and month (0-indexed month)
 * Includes leading/trailing days from adjacent months to fill 7-day rows.
 */
export function getCalendarGrid(year, monthIndex) {
  const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
  const daysInCurrent = getDaysInMonth(year, monthIndex);
  const daysInPrev = getDaysInMonth(year, monthIndex - 1);
  const todayKey = toDateKey(new Date());

  const days = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrev - i;
    const d = new Date(year, monthIndex - 1, dayNum);
    const key = toDateKey(d);
    days.push({
      date: d,
      dateKey: key,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: key === todayKey
    });
  }

  // Days in current month
  for (let i = 1; i <= daysInCurrent; i++) {
    const d = new Date(year, monthIndex, i);
    const key = toDateKey(d);
    days.push({
      date: d,
      dateKey: key,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: key === todayKey
    });
  }

  // Leading days of next month to complete standard grid (multiple of 7)
  const remainder = days.length % 7;
  if (remainder !== 0) {
    const extraNeeded = 7 - remainder;
    for (let i = 1; i <= extraNeeded; i++) {
      const d = new Date(year, monthIndex + 1, i);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey
      });
    }
  }

  return days;
}
