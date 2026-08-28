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

export const getMusylailShiftIndexAuto = (targetDate, globalSettings, anchorDate = new Date(2026, 4, 25)) => {
  const start = new Date(anchorDate);
  start.setHours(0,0,0,0);
  
  const target = new Date(targetDate);
  target.setHours(0,0,0,0);
  
  let activeDaysPassed = 0;
  
  // Default active days: Sun, Mon, Tue, Wed, Sat (0,1,2,3,6)
  let activeDays = [0, 1, 2, 3, 6]; 
  if (globalSettings?.hari_aktif_musylail) {
    activeDays = globalSettings.hari_aktif_musylail;
  } else if (globalSettings?.is_malam_sabtu_active) {
    activeDays = [0, 1, 2, 3, 5, 6];
  }
  
  if (target > start) {
    let curr = new Date(start);
    curr.setDate(curr.getDate() + 1);
    while (curr <= target) {
      if (activeDays.includes(curr.getDay())) {
        activeDaysPassed++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    // Determine modulus based on how many groups there are
    const daftarMustahiq = globalSettings?.daftar_mustahiq || SEMUA_BAPAK;
    const numGroups = Math.ceil(daftarMustahiq.length / 2);
    
    return activeDaysPassed % (numGroups || 1);
  } else {
    return 0;
  }
};

export const getMusylailGroups = (settings, targetDate) => {
  if (settings && settings.is_auto_rotate_partner === false && settings.manual_groups) {
    return settings.manual_groups;
  }

  const anchorDate = new Date(2026, 4, 25);
  anchorDate.setHours(0,0,0,0);
  
  const target = new Date(targetDate || new Date());
  target.setHours(0,0,0,0);
  
  let diffTime = target - anchorDate;
  if (diffTime < 0) diffTime = 0;
  
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const periodsPassed = Math.floor(diffWeeks / 2); // Rotate every 2 weeks
  
  const daftarMustahiq = settings?.daftar_mustahiq || SEMUA_BAPAK;
  const numGroups = Math.ceil(daftarMustahiq.length / 2);
  
  // Split into two columns dynamically
  const columnA = [];
  const columnB = [];
  
  for (let i = 0; i < numGroups; i++) {
    columnA.push(daftarMustahiq[i] || "Kosong");
    columnB.push(daftarMustahiq[i + numGroups] || "Kosong");
  }

  const offset = periodsPassed % (numGroups || 1);

  const dynamicGroups = [];
  for (let i = 0; i < numGroups; i++) {
    const partnerIndex = (i + offset) % numGroups;
    dynamicGroups.push([columnA[i], columnB[partnerIndex]]);
  }
  
  return dynamicGroups;
};


