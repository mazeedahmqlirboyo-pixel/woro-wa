import { INDO_DAYS, INDO_MONTHS, TIM_ALBAQOROH_1, TIM_ALBAQOROH_2, SHIFT_MUSYLAIL } from './constants';

export const formatDateIndo = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const dayName = INDO_DAYS[d.getDay()];
  const day = d.getDate();
  const monthName = INDO_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
};

export const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const getActiveAlbaqorohTeam = () => {
  const start = new Date(2026, 4, 25); // 25 Mei 2026 (Senin)
  start.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = today - start;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  if (diffWeeks < 0) return { label: "TIM 1", anggota: TIM_ALBAQOROH_1 };
  
  return diffWeeks % 2 === 0 
    ? { label: "TIM 1", anggota: TIM_ALBAQOROH_1 }
    : { label: "TIM 2", anggota: TIM_ALBAQOROH_2 };
};

// Fallback logic for auto-calculating Musylail shift when no database entry is found
export const getMusylailShiftIndexAuto = (targetDate, isMalamSabtuActive, anchorDate = new Date(2026, 4, 25)) => {
  const start = new Date(anchorDate);
  start.setHours(0,0,0,0);
  
  const target = new Date(targetDate);
  target.setHours(0,0,0,0);
  
  let activeDaysPassed = 0;
  
  if (target > start) {
    let curr = new Date(start);
    curr.setDate(curr.getDate() + 1);
    while (curr <= target) {
      const d = curr.getDay();
      const isJumat = d === 4;
      const isSabtu = d === 5;
      if (!isJumat && (!isSabtu || isMalamSabtuActive)) {
        activeDaysPassed++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return activeDaysPassed % 6;
  } else {
    return 0;
  }
};
