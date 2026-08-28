import { INDO_DAYS, INDO_MONTHS, TIM_ALBAQOROH_1, TIM_ALBAQOROH_2, SHIFT_MUSYLAIL, SEMUA_BAPAK } from './constants';

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

  // Anchor date diubah ke HARI INI (29 Agustus 2026) agar acakan pertama dimulai sekarang.
  const anchorDate = new Date(2026, 7, 29);
  anchorDate.setHours(0,0,0,0);
  
  const target = new Date(targetDate || new Date());
  target.setHours(0,0,0,0);
  
  let diffTime = target - anchorDate;
  if (diffTime < 0) diffTime = 0;
  
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const periodsPassed = Math.floor(diffWeeks / 2); // Acak setiap 2 minggu
  
  const daftarMustahiq = settings?.daftar_mustahiq || SEMUA_BAPAK;
  
  // Fungsi Seeded Random (Biar hasil acakan tetap sama selama periode 2 minggu tersebut)
  const mulberry32 = (a) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };

  const seededShuffle = (array, seed) => {
    const prng = mulberry32(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Acak daftar nama menggunakan periodsPassed sebagai seed
  // Tambahkan angka acak (misal 54321) agar urutannya sangat berbeda dari urutan asli
  const shuffledList = seededShuffle(daftarMustahiq, periodsPassed + 54321);

  const dynamicGroups = [];
  for (let i = 0; i < shuffledList.length; i += 2) {
    const p1 = shuffledList[i];
    const p2 = i + 1 < shuffledList.length ? shuffledList[i + 1] : "Kosong";
    dynamicGroups.push([p1, p2]);
  }
  
  return dynamicGroups;
};


