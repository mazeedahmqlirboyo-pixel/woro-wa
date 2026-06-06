import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiEdit3, FiCheckSquare, FiBookOpen, FiCopy, FiInfo } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const TARGET_PHONE = '628889583421';

// Data Shift Musylail (6 Shift dari 4 Grup yang tidak boleh bentrok)
const SHIFT_MUSYLAIL = [
  ["Bpk. Abdillah Khoironi", "Bpk. Adin Muhamad Mufid"],
  ["Bpk. Mohamad Khasan Bisri", "Bpk. Muhammad Ricky Gunawan Pratama"],
  ["Bpk. M Khoirul Anwar", "Bpk. Muhammad Hadi Mafatih"],
  ["Bpk. Agus Wahyudin", "Bpk. Muchammad Haqqinnazili"],
  ["Bpk. Abdul Wakhid", "Bpk. Ahmad Syarief Qornel"],
  ["Bpk. Muhammad Burhanuddin Ramadhan", "Bpk. Choerul Anam"]
];

const LABEL_MALAM = {
  0: "Malam Senin",
  1: "Malam Selasa",
  2: "Malam Rabu",
  3: "Malam Kamis",
  4: "Malam Jumat", // Tidak terpakai
  5: "Malam Sabtu", // Tidak terpakai
  6: "Malam Minggu"
};

// Fungsi menghitung giliran shift (0 s/d 5) berdasarkan hari efektif berlalu
const getMusylailShiftIndex = (targetDate) => {
  const start = new Date(2024, 0, 1); // Acuan: 1 Jan 2024
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffTime = target - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let activeDays = 0;
  let curr = new Date(start);
  for (let i = 0; i <= diffDays; i++) {
    const day = curr.getDay();
    if (day !== 4 && day !== 5) { // Abaikan Malam Jumat & Malam Sabtu
      activeDays++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  return (activeDays - 1) % 6;
};

// Daftar Semua Bapak untuk Opsi Sorogan
const SEMUA_BAPAK = [
  "Bpk. Adin Muhamad Mufid",
  "Bpk. Mohamad Khasan Bisri",
  "Bpk. Abdillah Khoironi",
  "Bpk. Muhammad Ricky Gunawan Pratama",
  "Bpk. M Khoirul Anwar",
  "Bpk. Muchammad Haqqinnazili",
  "Bpk. Choerul Anam",
  "Bpk. Muhammad Burhanuddin Ramadhan",
  "Bpk. Ahmad Syarief Qornel",
  "Bpk. Muhammad Hadi Mafatih",
  "Bpk. Abdul Wakhid",
  "Bpk. Agus Wahyudin"
];

// Hanya Sapaan yang Berubah
const GREETINGS = [
  "Halo Bapak-bapak:",
  "Assalamu’alaikum Bapak-bapak:",
  "Mohon perhatian Bapak-bapak:",
  "Monggo Bapak-bapak:",
  "Sugeng ndalu Bapak-bapak:"
];

// TIM AL-BAQOROH
const TIM_ALBAQOROH_1 = [
  "Bpk. Abdillah Khoironi",
  "Bpk. Adin Muhamad Mufid",
  "Bpk. Mohamad Khasan Bisri",
  "Bpk. Muhammad Ricky Gunawan Pratama",
  "Bpk. Muhammad Hadi Mafatih",
  "Bpk. Agus Wahyudin"
];

const TIM_ALBAQOROH_2 = [
  "Bpk. M Khoirul Anwar",
  "Bpk. Abdul Wakhid",
  "Bpk. Muhammad Burhanuddin Ramadhan",
  "Bpk. Choerul Anam",
  "Bpk. Muchammad Haqqinnazili",
  "Bpk. Ahmad Syarief Qornel"
];

// Fungsi menghitung tim Al-Baqoroh aktif berdasarkan minggu
const getActiveAlbaqorohTeam = () => {
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

const INDO_DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatDateIndo = (date) => {
  if (!date) return "";
  const dayName = INDO_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDO_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
};

const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const isTomorrow = (date) => {
  if (!date) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear();
};

const getUpcomingMusylailDays = (startDate, count = 7) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dayIndex = d.getDay();
    const isOff = dayIndex === 4 || dayIndex === 5;
    let petugas = [];
    if (!isOff) {
      const shiftIndex = getMusylailShiftIndex(d);
      petugas = SHIFT_MUSYLAIL[shiftIndex];
    }
    days.push({
      date: d,
      dayIndex,
      label: LABEL_MALAM[dayIndex],
      petugas,
      isOff
    });
  }
  return days;
};

const getUpcomingExtraDays = (startDate, jadwalExtra, count = 7) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dayIndex = d.getDay();
    const jadwalPagi = jadwalExtra[dayIndex];
    const isOff = dayIndex === 5; // Jumat Pagi libur
    days.push({
      date: d,
      dayIndex,
      label: jadwalPagi?.label || `${INDO_DAYS[dayIndex]} Pagi`,
      petugas: jadwalPagi?.petugas || [],
      isOff
    });
  }
  return days;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('musylail');

  const [selectedDateMusylail, setSelectedDateMusylail] = useState(() => new Date());
  const [selectedDateExtra, setSelectedDateExtra] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

  // STATE: PWA INSTALL PROMPT
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOSDevice(isIOS);

    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('woroInstallDismissed') === 'true';

    if (!isStandalone && !dismissed) {
      if (isIOS) {
        setShowInstallBanner(true);
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('woroInstallDismissed', 'true');
  };

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  // STATE: MUSYLAIL
  const [malamIni, setMalamIni] = useState('');
  const [petugasMalamIni, setPetugasMalamIni] = useState([]);
  const [selectedPetugas, setSelectedPetugas] = useState([]);
  const [messageMusylail, setMessageMusylail] = useState('');

  // STATE: SOROGAN HMQ
  const [selectedHmq, setSelectedHmq] = useState([]);
  const [messageHmq, setMessageHmq] = useState('');

  // STATE: SOROGAN AL-BAQOROH
  const [timAktifAlbaqorohLabel, setTimAktifAlbaqorohLabel] = useState('');
  const [selectedAlbaqoroh, setSelectedAlbaqoroh] = useState([]);
  const [messageAlbaqoroh, setMessageAlbaqoroh] = useState('');

  const defaultQueue = [
    "Bpk. Muhammad Ricky Gunawan Pratama", "Bpk. Muchammad Haqqinnazili", // Sabtu
    "Bpk. Abdillah Khoironi", "Bpk. M Khoirul Anwar", // Ahad
    "Bpk. Ahmad Syarief Qornel", "Bpk. Mohamad Khasan Bisri", // Senin
    "Bpk. Abdul Wakhid", "Bpk. Muhammad Burhanuddin Ramadhan", // Selasa
    "Bpk. Agus Wahyudin", "Bpk. Muhammad Hadi Mafatih", // Rabu
    "Bpk. Adin Muhamad Mufid", "Bpk. Choerul Anam" // Kamis
  ];

  // STATE: EXTRA PAGI
  const [jadwalExtraFull, setJadwalExtraFull] = useState(() => {
    const saved = localStorage.getItem('jadwalExtraV3');
    if (saved) return JSON.parse(saved);
    return {
      0: { label: "Ahad Pagi", petugas: ["Bpk. Abdillah Khoironi", "Bpk. M Khoirul Anwar"] },
      1: { label: "Senin Pagi", petugas: ["Bpk. Ahmad Syarief Qornel", "Bpk. Mohamad Khasan Bisri"] },
      2: { label: "Selasa Pagi", petugas: ["Bpk. Abdul Wakhid", "Bpk. Muhammad Burhanuddin Ramadhan"] },
      3: { label: "Rabu Pagi", petugas: ["Bpk. Agus Wahyudin", "Bpk. Muhammad Hadi Mafatih"] },
      4: { label: "Kamis Pagi", petugas: ["Bpk. Adin Muhamad Mufid", "Bpk. Choerul Anam"] },
      5: { label: "Jumat Pagi", petugas: [] },
      6: { label: "Sabtu Pagi", petugas: ["Bpk. Muhammad Ricky Gunawan Pratama", "Bpk. Muchammad Haqqinnazili"] }
    };
  });

  const [pagiIni, setPagiIni] = useState('');
  const [petugasPagiIni, setPetugasPagiIni] = useState([]);
  const [selectedPetugasExtra, setSelectedPetugasExtra] = useState([]);
  const [messageExtra, setMessageExtra] = useState('');

  // 4 & 8. Auto Detect Hari -> Konversi "Malam Selanjutnya"
  useEffect(() => {
    const dayIndex = selectedDateMusylail.getDay();
    setMalamIni(LABEL_MALAM[dayIndex]);
    
    // Malam Jumat (4) dan Malam Sabtu (5) tidak ada jadwal
    if (dayIndex === 4 || dayIndex === 5) {
      setPetugasMalamIni([]);
      setSelectedPetugas([]);
    } else {
      const shiftIndex = getMusylailShiftIndex(selectedDateMusylail);
      const petugasHariIni = SHIFT_MUSYLAIL[shiftIndex];
      setPetugasMalamIni(petugasHariIni);
      setSelectedPetugas(petugasHariIni); // Select all by default
    }
    setMessageMusylail('');
  }, [selectedDateMusylail]);

  useEffect(() => {
    const dayIndex = selectedDateExtra.getDay();
    const jadwalPagi = jadwalExtraFull[dayIndex];
    setPagiIni(jadwalPagi.label);
    setPetugasPagiIni(jadwalPagi.petugas);
    setSelectedPetugasExtra(jadwalPagi.petugas);
    setMessageExtra('');
  }, [selectedDateExtra, jadwalExtraFull]);

  useEffect(() => {
    // AL-BAQOROH
    const albaqorohTeam = getActiveAlbaqorohTeam();
    setTimAktifAlbaqorohLabel(albaqorohTeam.label);
    setSelectedAlbaqoroh(albaqorohTeam.anggota);
  }, []);

  const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const pray = String.fromCodePoint(0x1F64F);

  // === HANDLER EXTRA ===
  const handleAcakJadwalExtra = () => {
    if (!window.confirm("Apakah Anda yakin ingin mengacak ulang jadwal Extra Pagi? Jadwal baru akan disimpan.")) return;

    let currentQueue = JSON.parse(localStorage.getItem('antrianExtraV3'));
    if (!currentQueue || currentQueue.length !== 12) {
      currentQueue = [...defaultQueue];
    }

    // Semua 12 bapak diacak untuk 6 hari (Sabtu - Kamis)
    const shuffledQueue = currentQueue.sort(() => Math.random() - 0.5);

    const newJadwal = {
      0: { label: "Ahad Pagi", petugas: [shuffledQueue[2], shuffledQueue[3]] },
      1: { label: "Senin Pagi", petugas: [shuffledQueue[4], shuffledQueue[5]] },
      2: { label: "Selasa Pagi", petugas: [shuffledQueue[6], shuffledQueue[7]] },
      3: { label: "Rabu Pagi", petugas: [shuffledQueue[8], shuffledQueue[9]] },
      4: { label: "Kamis Pagi", petugas: [shuffledQueue[10], shuffledQueue[11]] },
      5: { label: "Jumat Pagi", petugas: [] },
      6: { label: "Sabtu Pagi", petugas: [shuffledQueue[0], shuffledQueue[1]] }
    };

    setJadwalExtraFull(newJadwal);
    localStorage.setItem('jadwalExtraV3', JSON.stringify(newJadwal));
    localStorage.setItem('antrianExtraV3', JSON.stringify(shuffledQueue));
    showToast("Jadwal Extra Pagi berhasil diacak! Semua 12 bapak dibagikan secara merata ke 6 hari.", "success");
  };

  const handleGenerateExtra = () => {
    if (petugasPagiIni.length === 0) {
      setMessageExtra(`Tidak ada jadwal Extra Pagi.`);
      return;
    }
    if (selectedPetugasExtra.length === 0) {
      showToast("Silakan pilih minimal satu petugas.", "error");
      return;
    }

    const selectedPagiLabel = pagiIni; // e.g. "Senin Pagi"
    const selectedDateStr = formatDateIndo(selectedDateExtra);

    let generated = `*INFO EXTRA*\n\n${getRandomGreeting()}\n\n`;
    selectedPetugasExtra.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu untuk kegiatan Extra Pagi (${selectedPagiLabel}, ${selectedDateStr}) jam 07:45 (Mulai Menemani Lalaran) - 09:00 WIS. (Selesai)*\n\nTerima kasih ${pray}`;
    setMessageExtra(generated);
  };

  // === HANDLER MUSYLAIL ===
  const handleGenerateMusylail = () => {
    if (petugasMalamIni.length === 0) {
      setMessageMusylail(`Tidak ada jadwal jaga malam.`);
      return;
    }
    if (selectedPetugas.length === 0) {
      showToast("Silakan pilih minimal satu petugas.", "error");
      return;
    }

    const selectedMalamLabel = malamIni; // e.g. "Malam Senin"
    const selectedDateStr = formatDateIndo(selectedDateMusylail);

    let generated = `*INFO JAGA MUSYLAIL AL-BAQOROH (${selectedMalamLabel} - ${selectedDateStr})*\n\n${getRandomGreeting()}\n\n`;
    selectedPetugas.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu jam 08.15 malam sampai dengan selesai*\n\n*Dan untuk Bapak-bapak yang lain untuk senantiasa Jaga MUSYLAIL di HMQ*\n\nTerima kasih ${pray}`;
    setMessageMusylail(generated);
  };

  // === HANDLER HMQ ===
  const handleGenerateHmq = () => {
    if (selectedHmq.length === 0) {
      showToast("Silakan pilih minimal satu bapak untuk disorogan.", "error");
      return;
    }

    let generated = `*INFO SOROGAN HMQ*\n\n${getRandomGreeting()}\n\n`;
    selectedHmq.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Informasi untuk Bapak-bapak sekalian, hari ini ada kegiatan Sorogan di HMQ. Mohon kehadirannya.*\n\nTerima kasih ${pray}`;
    setMessageHmq(generated);
  };

  // === HANDLER AL-BAQOROH ===
  const handleGenerateAlbaqoroh = () => {
    if (selectedAlbaqoroh.length === 0) {
      showToast("Silakan pilih minimal satu bapak untuk disorogan.", "error");
      return;
    }

    let generated = `*INFO SOROGAN AL-BAQOROH*\n\n${getRandomGreeting()}\n\n`;
    selectedAlbaqoroh.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Informasi untuk Bapak-bapak sekalian, hari ini ada kegiatan Sorogan di AL-BAQOROH yang dimulai pukul 20:15 - 21:45 WIS. Mohon kehadirannya.*\n\n*Dan untuk Bapak-bapak yang lain senantiasa menjaga Musylail Di HMQ.*\n\nTerima kasih ${pray}`;
    setMessageAlbaqoroh(generated);
  };

  const handleCopy = (msg) => {
    if (!msg.trim()) {
      showToast("Pesan kosong. Silakan klik Generate Pesan terlebih dahulu.", "error");
      return;
    }
    navigator.clipboard.writeText(msg).then(() => {
      showToast("Teks pesan berhasil disalin ke clipboard! ✨", "success");
    }).catch(err => {
      console.error('Gagal menyalin:', err);
      showToast("Gagal menyalin pesan.", "error");
    });
  };

  // UI HELPERS
  const renderTabButton = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-2 py-3 font-bold text-[12px] sm:text-[13px] flex-1 whitespace-nowrap transition-all duration-300 rounded-[1rem] ${activeTab === id
        ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]'
        : 'text-gray-500 hover:text-indigo-600 hover:bg-white/50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-100 flex flex-col items-center pb-8 font-sans selection:bg-indigo-200 selection:text-indigo-900">

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-500 text-white shadow-emerald-500/30' : 'bg-red-500/95 border-red-400 text-white shadow-red-500/30'}`}>
          <div className="bg-white/20 p-2 rounded-full">
            {toast.type === 'success' ? <FiCheckSquare className="text-xl" /> : <FiInfo className="text-xl" />}
          </div>
          <span className="font-extrabold text-[15px]">{toast.message}</span>
        </div>
      </div>

      {/* PWA INSTALL BANNER */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[90] animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/95 backdrop-blur-md border border-indigo-100 p-5 rounded-[2rem] shadow-2xl flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              <img src="/logo.png" alt="Logo WORO" className="w-14 h-14 rounded-2xl shadow-md border border-gray-105 object-cover" />
              <div className="flex-1">
                <h3 className="font-extrabold text-[15px] text-gray-950 leading-tight">Pasang Aplikasi WORO MAZEEDA</h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-normal">
                  {isIOSDevice 
                    ? "Pasang aplikasi ini di HP Anda untuk akses lebih cepat dan mudah langsung dari layar utama."
                    : "Tambahkan aplikasi ke layar utama HP Anda untuk kemudahan akses piket sehari-hari."
                  }
                </p>
              </div>
            </div>

            {isIOSDevice ? (
              <div className="bg-indigo-50/50 rounded-2xl p-3.5 border border-indigo-100/50 text-[12px] text-indigo-950 font-medium space-y-2">
                <p className="font-bold text-indigo-900">Instruksi Safari iOS:</p>
                <div className="flex gap-2 items-center">
                  <span className="bg-indigo-600 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Ketuk tombol **Bagikan (Share)** (ikon kotak dengan panah atas [↑] di bar bawah browser Safari).</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="bg-indigo-600 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Pilih **Tambahkan ke Layar Utama (Add to Home Screen)**.</span>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3 mt-1">
              <button 
                onClick={handleDismissBanner}
                className="flex-1 py-3 text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Nanti Saja
              </button>
              {!isIOSDevice && deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="flex-1 py-3 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Pasang Sekarang
                </button>
              )}
              {isIOSDevice && (
                <button 
                  onClick={handleDismissBanner}
                  className="flex-1 py-3 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Mengerti
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl min-h-screen shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative pb-6 sm:my-10 sm:min-h-0 sm:rounded-[2.5rem] border border-white overflow-hidden transition-all duration-500">

        {/* Header - Sticky */}
        <header id="header" className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/50">
          <div className="flex items-center gap-4 px-6 pt-6 pb-5">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <FiCalendar className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800 leading-tight">Pengumuman</h1>
              <p className="text-xs text-indigo-500/80 font-bold tracking-[0.2em] uppercase mt-0.5">PP. ALBAQOROH</p>
            </div>
          </div>

          <div className="px-5 pb-3">
            <div className="flex flex-wrap w-full bg-gray-100/80 p-1.5 rounded-[1.25rem] shadow-inner gap-1">
              {renderTabButton('musylail', 'Musylail')}
              {renderTabButton('extra', 'Extra Pagi')}
              {renderTabButton('hmq', 'Sorogan HMQ')}
              {renderTabButton('albaqoroh', 'S. Al-Baq')}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">

          {/* VIEW: JAGA MUSYLAIL */}
          {activeTab === 'musylail' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-indigo-400 tracking-[0.2em] mb-3 uppercase relative z-10">Piket Malam Musylail</h2>
                
                {/* Navigasi Tanggal */}
                <div className="flex items-center justify-between gap-2 mb-4 bg-indigo-950/5 p-2 rounded-2xl relative z-10">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDateMusylail);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDateMusylail(prev);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                    title="Sebelumnya"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="text-center flex-1">
                    <div className="text-xs font-extrabold text-indigo-500 uppercase tracking-wider">{malamIni || 'Tidak Ada Piket'}</div>
                    <div className="text-[14px] font-black text-indigo-950 mt-0.5">{formatDateIndo(selectedDateMusylail)}</div>
                  </div>

                  <button
                    onClick={() => {
                      const next = new Date(selectedDateMusylail);
                      next.setDate(next.getDate() + 1);
                      setSelectedDateMusylail(next);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                    title="Berikutnya"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {!isToday(selectedDateMusylail) && (
                  <div className="flex justify-center mb-4 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                      onClick={() => setSelectedDateMusylail(new Date())}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <FiRefreshCw className="text-[10px]" /> Kembali ke Hari Ini
                    </button>
                  </div>
                )}

                {petugasMalamIni.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    <label className="flex items-center gap-4 cursor-pointer bg-indigo-600/5 px-5 py-3 rounded-2xl hover:bg-indigo-600/10 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPetugas.length > 0 && selectedPetugas.length === petugasMalamIni.length}
                          onChange={(e) => setSelectedPetugas(e.target.checked ? petugasMalamIni : [])}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-indigo-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-[15px] text-indigo-900">Pilih Semua Bapak</span>
                    </label>
                    {petugasMalamIni.map((petugas, idx) => (
                      <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-indigo-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPetugas.includes(petugas)}
                            onChange={() => {
                              if (selectedPetugas.includes(petugas)) setSelectedPetugas(selectedPetugas.filter(p => p !== petugas));
                              else setSelectedPetugas([...selectedPetugas, petugas]);
                            }}
                            className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer"
                          />
                          <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>
                        <span className="group-hover:text-indigo-900 transition-colors">{petugas}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl font-bold text-indigo-400 border border-indigo-100/50 text-center shadow-sm relative z-10">
                    ✨ Tidak ada jadwal piket malam ini
                  </div>
                )}
              </section>

              <section>
                <button
                  onClick={handleGenerateMusylail}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-indigo-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageMusylail ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Musylail
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-indigo-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
                    placeholder="Pesan akan muncul di sini..."
                    value={messageMusylail}
                    onChange={(e) => setMessageMusylail(e.target.value)}
                  />
                </div>
              </section>

              <section>
                <button
                  onClick={() => handleCopy(messageMusylail)}
                  disabled={!messageMusylail.trim()}
                  className={`w-full py-4 font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${!messageMusylail.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 active:scale-[0.98]'
                    }`}
                >
                  <FiCopy className="text-xl" />
                  Salin Teks Pesan
                </button>
              </section>

              {/* Jadwal Terstruktur */}
              <section className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 animate-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                    <FiCalendar className="text-indigo-600" />
                    Jadwal Terstruktur (7 Hari ke Depan)
                  </h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {getUpcomingMusylailDays(new Date()).map((day, idx) => {
                    const isSelected = selectedDateMusylail.getDate() === day.date.getDate() &&
                                       selectedDateMusylail.getMonth() === day.date.getMonth() &&
                                       selectedDateMusylail.getFullYear() === day.date.getFullYear();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDateMusylail(day.date);
                          document.getElementById('header')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-sm scale-[0.99]'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {formatDateIndo(day.date).split(',')[0]}, {day.date.getDate()} {INDO_MONTHS[day.date.getMonth()]}
                          </span>
                          <span className="text-[14px] font-black text-gray-805">
                            {day.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {day.isOff ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-400 rounded-full uppercase tracking-wider">
                              Libur
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5 items-end">
                              {day.petugas.map((p, pIdx) => (
                                <span key={pIdx} className="text-xs font-bold text-indigo-950">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* VIEW: EXTRA PAGI */}
          {activeTab === 'extra' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="bg-gradient-to-br from-orange-50 to-white border border-orange-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-orange-400 tracking-[0.2em] mb-3 uppercase relative z-10">Piket Extra Pagi</h2>
                
                {/* Navigasi Tanggal */}
                <div className="flex items-center justify-between gap-2 mb-4 bg-orange-950/5 p-2 rounded-2xl relative z-10">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDateExtra);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDateExtra(prev);
                    }}
                    className="p-2 bg-white hover:bg-orange-50 border border-orange-100 text-orange-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                    title="Sebelumnya"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="text-center flex-1">
                    <div className="text-xs font-extrabold text-orange-500 uppercase tracking-wider">{pagiIni || 'Tidak Ada Piket'}</div>
                    <div className="text-[14px] font-black text-orange-950 mt-0.5">{formatDateIndo(selectedDateExtra)}</div>
                  </div>

                  <button
                    onClick={() => {
                      const next = new Date(selectedDateExtra);
                      next.setDate(next.getDate() + 1);
                      setSelectedDateExtra(next);
                    }}
                    className="p-2 bg-white hover:bg-orange-50 border border-orange-100 text-orange-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                    title="Berikutnya"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {!isTomorrow(selectedDateExtra) && (
                  <div className="flex justify-center mb-4 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setSelectedDateExtra(tomorrow);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-md shadow-orange-200 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <FiRefreshCw className="text-[10px]" /> Kembali ke Besok Pagi
                    </button>
                  </div>
                )}

                {petugasPagiIni.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    <label className="flex items-center gap-4 cursor-pointer bg-orange-600/5 px-5 py-3 rounded-2xl hover:bg-orange-600/10 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPetugasExtra.length > 0 && selectedPetugasExtra.length === petugasPagiIni.length}
                          onChange={(e) => setSelectedPetugasExtra(e.target.checked ? petugasPagiIni : [])}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-orange-200 checked:bg-orange-600 checked:border-orange-600 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-[15px] text-orange-900">Pilih Semua Bapak</span>
                    </label>
                    {petugasPagiIni.map((petugas, idx) => (
                      <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-orange-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-orange-200 transition-all">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPetugasExtra.includes(petugas)}
                            onChange={() => {
                              if (selectedPetugasExtra.includes(petugas)) setSelectedPetugasExtra(selectedPetugasExtra.filter(p => p !== petugas));
                              else setSelectedPetugasExtra([...selectedPetugasExtra, petugas]);
                            }}
                            className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-orange-500 checked:border-orange-505 transition-all cursor-pointer"
                          />
                          <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>
                        <span className="group-hover:text-orange-900 transition-colors">{petugas}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl font-bold text-orange-400 border border-orange-100/50 text-center shadow-sm relative z-10">
                    ✨ Tidak ada jadwal Extra Pagi
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-orange-100/50 relative z-10">
                  <button
                    onClick={handleAcakJadwalExtra}
                    className="w-full py-3 bg-white hover:bg-orange-50 border-2 border-dashed border-orange-200 text-orange-600 font-bold text-[14px] rounded-xl transition-all flex justify-center items-center gap-2"
                  >
                    <FiRefreshCw /> Acak Ulang Jadwal
                  </button>
                  <p className="text-[11px] text-center text-orange-400 mt-2">
                    Mengacak ulang akan membagikan 12 bapak ke 6 hari secara acak.
                  </p>
                </div>
              </section>

              <section>
                <button
                  onClick={handleGenerateExtra}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-orange-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageExtra ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Extra
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-orange-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-200 to-red-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-orange-100 focus:border-orange-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
                    placeholder="Pesan Extra otomatis muncul di sini..."
                    value={messageExtra}
                    onChange={(e) => setMessageExtra(e.target.value)}
                  />
                </div>
              </section>

              <section>
                <button
                  onClick={() => handleCopy(messageExtra)}
                  disabled={!messageExtra.trim()}
                  className={`w-full py-4 font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${!messageExtra.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 active:scale-[0.98]'
                    }`}
                >
                  <FiCopy className="text-xl" /> Salin Teks
                </button>
              </section>

              {/* Jadwal Terstruktur */}
              <section className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 animate-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-black text-gray-850 flex items-center gap-2">
                    <FiCalendar className="text-orange-600" />
                    Jadwal Terstruktur (7 Hari ke Depan)
                  </h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {getUpcomingExtraDays(new Date(), jadwalExtraFull).map((day, idx) => {
                    const isSelected = selectedDateExtra.getDate() === day.date.getDate() &&
                                       selectedDateExtra.getMonth() === day.date.getMonth() &&
                                       selectedDateExtra.getFullYear() === day.date.getFullYear();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDateExtra(day.date);
                          document.getElementById('header')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-orange-50/70 border-orange-200 shadow-sm scale-[0.99]'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                            {formatDateIndo(day.date).split(',')[0]}, {day.date.getDate()} {INDO_MONTHS[day.date.getMonth()]}
                          </span>
                          <span className="text-[14px] font-black text-gray-805">
                            {day.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {day.isOff ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-400 rounded-full uppercase tracking-wider">
                              Libur
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5 items-end">
                              {day.petugas.map((p, pIdx) => (
                                <span key={pIdx} className="text-xs font-bold text-orange-950">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* VIEW: SOROGAN HMQ */}
          {activeTab === 'hmq' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-emerald-500 tracking-[0.2em] mb-4 uppercase flex items-center justify-center gap-2 relative z-10">
                  <FiBookOpen className="text-sm" /> Opsi HMQ
                </h2>

                <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  <label className="flex items-center gap-4 cursor-pointer bg-emerald-600/5 px-5 py-3 rounded-2xl hover:bg-emerald-600/10 transition-colors sticky top-0 backdrop-blur-xl z-20">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedHmq.length === SEMUA_BAPAK.length}
                        onChange={(e) => setSelectedHmq(e.target.checked ? SEMUA_BAPAK : [])}
                        className="peer w-6 h-6 appearance-none rounded-lg border-2 border-emerald-200 checked:bg-emerald-600 checked:border-emerald-600 transition-all cursor-pointer"
                      />
                      <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-[15px] text-emerald-900">Pilih Semua Bapak</span>
                  </label>
                  {SEMUA_BAPAK.map((petugas, idx) => (
                    <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-emerald-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedHmq.includes(petugas)}
                          onChange={() => {
                            if (selectedHmq.includes(petugas)) setSelectedHmq(selectedHmq.filter(p => p !== petugas));
                            else setSelectedHmq([...selectedHmq, petugas]);
                          }}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="group-hover:text-emerald-900 transition-colors">{petugas}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <button
                  onClick={handleGenerateHmq}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-emerald-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageHmq ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Sorogan HMQ
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-emerald-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
                    placeholder="Pesan HMQ otomatis muncul di sini..."
                    value={messageHmq}
                    onChange={(e) => setMessageHmq(e.target.value)}
                  />
                </div>
              </section>

              <section>
                <button
                  onClick={() => handleCopy(messageHmq)}
                  disabled={!messageHmq.trim()}
                  className={`w-full py-4 font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${!messageHmq.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 active:scale-[0.98]'
                    }`}
                >
                  <FiCopy className="text-xl" /> Salin Teks
                </button>
              </section>
            </div>
          )}

          {/* VIEW: SOROGAN AL-BAQOROH */}
          {activeTab === 'albaqoroh' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="bg-gradient-to-br from-sky-50 to-white border border-sky-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-sky-500 tracking-[0.2em] mb-4 uppercase flex items-center justify-center gap-2 relative z-10">
                  <FiBookOpen className="text-sm" /> Opsi AL-BAQOROH
                </h2>

                <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  <div className="bg-sky-100/50 p-4 rounded-2xl border border-sky-200 mb-4 text-center">
                    <p className="text-sky-800 font-bold text-sm mb-1">Minggu ini giliran:</p>
                    <p className="text-sky-900 font-black text-2xl">{timAktifAlbaqorohLabel}</p>
                  </div>
                  <label className="flex items-center gap-4 cursor-pointer bg-sky-600/5 px-5 py-3 rounded-2xl hover:bg-sky-600/10 transition-colors sticky top-0 backdrop-blur-xl z-20">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAlbaqoroh.length === getActiveAlbaqorohTeam().anggota.length && getActiveAlbaqorohTeam().anggota.every(a => selectedAlbaqoroh.includes(a))}
                        onChange={(e) => setSelectedAlbaqoroh(e.target.checked ? getActiveAlbaqorohTeam().anggota : [])}
                        className="peer w-6 h-6 appearance-none rounded-lg border-2 border-sky-200 checked:bg-sky-500 checked:border-sky-500 transition-all cursor-pointer"
                      />
                      <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-[15px] text-sky-900">Pilih Anggota {timAktifAlbaqorohLabel} (Otomatis)</span>
                  </label>
                  {SEMUA_BAPAK.map((petugas, idx) => (
                    <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-sky-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-sky-200 transition-all">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAlbaqoroh.includes(petugas)}
                          onChange={() => {
                            if (selectedAlbaqoroh.includes(petugas)) setSelectedAlbaqoroh(selectedAlbaqoroh.filter(p => p !== petugas));
                            else setSelectedAlbaqoroh([...selectedAlbaqoroh, petugas]);
                          }}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-sky-500 checked:border-sky-500 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="group-hover:text-sky-900 transition-colors">{petugas}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <button
                  onClick={handleGenerateAlbaqoroh}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-sky-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageAlbaqoroh ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Sorogan Al-Baqoroh
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-sky-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-200 to-blue-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-sky-100 focus:border-sky-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
                    placeholder="Pesan Al-Baqoroh otomatis muncul di sini..."
                    value={messageAlbaqoroh}
                    onChange={(e) => setMessageAlbaqoroh(e.target.value)}
                  />
                </div>
              </section>

              <section>
                <button
                  onClick={() => handleCopy(messageAlbaqoroh)}
                  disabled={!messageAlbaqoroh.trim()}
                  className={`w-full py-4 font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${!messageAlbaqoroh.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 active:scale-[0.98]'
                    }`}
                >
                  <FiCopy className="text-xl" /> Salin Teks
                </button>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
