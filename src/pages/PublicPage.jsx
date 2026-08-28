import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiEdit3, FiCheckSquare, FiBookOpen, FiCopy, FiInfo } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { 
  TARGET_PHONE, SHIFT_MUSYLAIL, LABEL_MALAM, SEMUA_BAPAK, GREETINGS, 
  TIM_ALBAQOROH_1, TIM_ALBAQOROH_2, INDO_DAYS, INDO_MONTHS 
} from '../utils/constants';
import { 
  formatDateIndo, isToday, getMusylailShiftIndexAuto, getActiveAlbaqorohTeam 
} from '../utils/helpers';

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState('musylail');

  const [selectedDateMusylail, setSelectedDateMusylail] = useState(() => new Date());
  const [selectedDateExtra, setSelectedDateExtra] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

  // Settings & Data from Supabase
  const [isMalamSabtuActive, setIsMalamSabtuActive] = useState(false);
  const [jadwalMusylailManual, setJadwalMusylailManual] = useState({});
  const [jadwalExtra, setJadwalExtra] = useState([]);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: settings } = await supabase.from('settings').select('*').eq('id', 'global').single();
      if (settings) {
        setIsMalamSabtuActive(settings.is_malam_sabtu_active);
      }

      const { data: manualSchedules } = await supabase.from('jadwal_musylail').select('*');
      if (manualSchedules) {
        const manualMap = {};
        manualSchedules.forEach(s => {
          manualMap[s.tanggal] = s;
        });
        setJadwalMusylailManual(manualMap);
      }

      const { data: extraSchedules } = await supabase.from('jadwal_extra').select('*');
      if (extraSchedules) {
        setJadwalExtra(extraSchedules);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // PWA INSTALL PROMPT
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

  // STATE: EXTRA PAGI
  const [pagiIni, setPagiIni] = useState('');
  const [petugasPagiIni, setPetugasPagiIni] = useState([]);
  const [selectedPetugasExtra, setSelectedPetugasExtra] = useState([]);
  const [messageExtra, setMessageExtra] = useState('');

  useEffect(() => {
    const dayIndex = selectedDateMusylail.getDay();
    const dateStr = selectedDateMusylail.toISOString().split('T')[0];
    const isJumat = dayIndex === 4;
    const isSabtu = dayIndex === 5;
    
    setMalamIni(LABEL_MALAM[dayIndex]);

    if (jadwalMusylailManual[dateStr]) {
      const manual = jadwalMusylailManual[dateStr];
      if (manual.is_libur) {
        setPetugasMalamIni([]);
        setSelectedPetugas([]);
      } else {
        setPetugasMalamIni(manual.petugas || []);
        setSelectedPetugas(manual.petugas || []);
      }
    } else {
      if (isJumat || (isSabtu && !isMalamSabtuActive)) {
        setPetugasMalamIni([]);
        setSelectedPetugas([]);
      } else {
        const shiftIndex = getMusylailShiftIndexAuto(selectedDateMusylail, isMalamSabtuActive);
        const petugasHariIni = SHIFT_MUSYLAIL[shiftIndex];
        setPetugasMalamIni(petugasHariIni);
        setSelectedPetugas(petugasHariIni);
      }
    }
    setMessageMusylail('');
  }, [selectedDateMusylail, isMalamSabtuActive, jadwalMusylailManual]);

  useEffect(() => {
    const dayIndex = selectedDateExtra.getDay();
    const jadwal = jadwalExtra.find(j => j.day_index === dayIndex);
    
    if (jadwal) {
      setPagiIni(jadwal.label);
      setPetugasPagiIni(jadwal.petugas || []);
      setSelectedPetugasExtra(jadwal.petugas || []);
    } else {
      setPagiIni(`${INDO_DAYS[dayIndex]} Pagi`);
      setPetugasPagiIni([]);
      setSelectedPetugasExtra([]);
    }
    setMessageExtra('');
  }, [selectedDateExtra, jadwalExtra]);

  useEffect(() => {
    const albaqorohTeam = getActiveAlbaqorohTeam();
    setTimAktifAlbaqorohLabel(albaqorohTeam.label);
    setSelectedAlbaqoroh(albaqorohTeam.anggota);
  }, []);

  const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const pray = String.fromCodePoint(0x1F64F);

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

    const selectedMalamLabel = malamIni;
    const selectedDateStr = formatDateIndo(selectedDateMusylail);

    let generated = `*INFO JAGA MUSYLAIL AL-BAQOROH (${selectedMalamLabel} - ${selectedDateStr})*\n\n${getRandomGreeting()}\n\n`;
    selectedPetugas.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu jam 08.15 malam sampai dengan selesai*\n\n*Dan untuk Bapak-bapak yang lain untuk senantiasa Jaga MUSYLAIL di HMQ*\n\nTerima kasih ${pray}`;
    setMessageMusylail(generated);
  };

  // === HANDLER EXTRA ===
  const handleGenerateExtra = () => {
    if (petugasPagiIni.length === 0) {
      setMessageExtra(`Tidak ada jadwal Extra Pagi.`);
      return;
    }
    if (selectedPetugasExtra.length === 0) {
      showToast("Silakan pilih minimal satu petugas.", "error");
      return;
    }

    const selectedPagiLabel = pagiIni;
    const selectedDateStr = formatDateIndo(selectedDateExtra);

    let generated = `*INFO EXTRA*\n\n${getRandomGreeting()}\n\n`;
    selectedPetugasExtra.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu untuk kegiatan Extra Pagi (${selectedPagiLabel}, ${selectedDateStr}) jam 07:45 (Mulai Menemani Lalaran) - 09:00 WIS. (Selesai)*\n\nTerima kasih ${pray}`;
    setMessageExtra(generated);
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

  const renderTabButton = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-2 py-3 font-bold text-[12px] sm:text-[13px] flex-1 whitespace-nowrap transition-all duration-300 rounded-[1rem] ${activeTab === id
        ? 'bg-white text-blue-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]'
        : 'text-gray-500 hover:text-blue-600 hover:bg-white/50'
        }`}
    >
      {label}
    </button>
  );

  const getUpcomingMusylailDays = (startDate, isMalamSabtuActive, count = 7) => {
    const days = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayIndex = d.getDay();
      const isJumat = dayIndex === 4;
      const isSabtu = dayIndex === 5;
      const dateStr = d.toISOString().split('T')[0];
      
      let isOff = false;
      let petugas = [];

      if (jadwalMusylailManual[dateStr]) {
        const manual = jadwalMusylailManual[dateStr];
        isOff = manual.is_libur;
        petugas = manual.petugas || [];
      } else {
        isOff = isJumat || (isSabtu && !isMalamSabtuActive);
        if (!isOff) {
          const shiftIndex = getMusylailShiftIndexAuto(d, isMalamSabtuActive);
          petugas = SHIFT_MUSYLAIL[shiftIndex];
        }
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-white to-sky-100 flex flex-col items-center pb-8 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* Admin Link at the very top */}
      <div className="w-full max-w-md flex justify-end px-4 py-2 relative z-[60]">
        <a href="/admin" className="text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 px-3 py-1.5 rounded-full font-bold transition backdrop-blur-md border border-blue-200">
          ⚙️ Panel Admin
        </a>
      </div>

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
          <div className="bg-white/95 backdrop-blur-md border border-blue-100 p-5 rounded-[2rem] shadow-2xl flex flex-col gap-4">
            <div className="flex gap-4 items-start">
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
              <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100/50 text-[12px] text-blue-950 font-medium space-y-2">
                <p className="font-bold text-blue-900">Instruksi Safari iOS:</p>
                <div className="flex gap-2 items-center">
                  <span className="bg-blue-600 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Ketuk tombol Bagikan (Share) (ikon kotak dengan panah atas di bar bawah browser Safari).</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="bg-blue-600 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Pilih Tambahkan ke Layar Utama (Add to Home Screen).</span>
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
                  className="flex-1 py-3 text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  Pasang Sekarang
                </button>
              )}
              {isIOSDevice && (
                <button 
                  onClick={handleDismissBanner}
                  className="flex-1 py-3 text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
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
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <FiCalendar className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-sky-800 leading-tight">Pengumuman</h1>
              <p className="text-xs text-blue-500/80 font-bold tracking-[0.2em] uppercase mt-0.5">PP. ALBAQOROH</p>
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
              <section className="bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-blue-400 tracking-[0.2em] mb-3 uppercase relative z-10">Piket Malam Musylail</h2>
                
                {/* Navigasi Tanggal */}
                <div className="flex items-center justify-between gap-2 mb-4 bg-blue-950/5 p-2 rounded-2xl relative z-10">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDateMusylail);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDateMusylail(prev);
                    }}
                    className="p-2 bg-white hover:bg-blue-50 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="text-center flex-1">
                    <div className="text-xs font-extrabold text-blue-500 uppercase tracking-wider">{malamIni || 'Tidak Ada Piket'}</div>
                    <div className="text-[14px] font-black text-blue-950 mt-0.5">{formatDateIndo(selectedDateMusylail)}</div>
                  </div>

                  <button
                    onClick={() => {
                      const next = new Date(selectedDateMusylail);
                      next.setDate(next.getDate() + 1);
                      setSelectedDateMusylail(next);
                    }}
                    className="p-2 bg-white hover:bg-blue-50 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {!isToday(selectedDateMusylail) && (
                  <div className="flex justify-center mb-4 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                      onClick={() => setSelectedDateMusylail(new Date())}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <FiRefreshCw className="text-[10px]" /> Kembali ke Hari Ini
                    </button>
                  </div>
                )}

                {petugasMalamIni.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    <label className="flex items-center gap-4 cursor-pointer bg-blue-600/5 px-5 py-3 rounded-2xl hover:bg-blue-600/10 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPetugas.length > 0 && selectedPetugas.length === petugasMalamIni.length}
                          onChange={(e) => setSelectedPetugas(e.target.checked ? petugasMalamIni : [])}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-blue-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-[15px] text-blue-900">Pilih Semua Bapak</span>
                    </label>
                    {petugasMalamIni.map((petugas, idx) => (
                      <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-blue-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPetugas.includes(petugas)}
                            onChange={() => {
                              if (selectedPetugas.includes(petugas)) setSelectedPetugas(selectedPetugas.filter(p => p !== petugas));
                              else setSelectedPetugas([...selectedPetugas, petugas]);
                            }}
                            className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer"
                          />
                          <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>
                        <span className="group-hover:text-blue-900 transition-colors">{petugas}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl font-bold text-blue-400 border border-blue-100/50 text-center shadow-sm relative z-10">
                    ✨ Tidak ada jadwal piket malam ini
                  </div>
                )}
              </section>

              <section>
                <button
                  onClick={handleGenerateMusylail}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-blue-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageMusylail ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Musylail
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-blue-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-sky-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
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
                    <FiCalendar className="text-blue-600" />
                    Jadwal Terstruktur
                  </h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {getUpcomingMusylailDays(new Date(), isMalamSabtuActive).map((day, idx) => {
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
                            ? 'bg-blue-50/70 border-blue-200 shadow-sm scale-[0.99]'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
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
                                <span key={pIdx} className="text-xs font-bold text-blue-950">
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
              <section className="bg-gradient-to-br from-amber-50 to-white border border-amber-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-amber-500 tracking-[0.2em] mb-3 uppercase relative z-10">Piket Extra Pagi</h2>
                
                {/* Navigasi Tanggal */}
                <div className="flex items-center justify-between gap-2 mb-4 bg-amber-950/5 p-2 rounded-2xl relative z-10">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDateExtra);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDateExtra(prev);
                    }}
                    className="p-2 bg-white hover:bg-amber-50 border border-amber-100 text-amber-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="text-center flex-1">
                    <div className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">{pagiIni}</div>
                    <div className="text-[14px] font-black text-amber-950 mt-0.5">{formatDateIndo(selectedDateExtra)}</div>
                  </div>

                  <button
                    onClick={() => {
                      const next = new Date(selectedDateExtra);
                      next.setDate(next.getDate() + 1);
                      setSelectedDateExtra(next);
                    }}
                    className="p-2 bg-white hover:bg-amber-50 border border-amber-100 text-amber-600 rounded-xl transition-all shadow-sm active:scale-95 animate-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {petugasPagiIni.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    <label className="flex items-center gap-4 cursor-pointer bg-amber-600/5 px-5 py-3 rounded-2xl hover:bg-amber-600/10 transition-colors">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPetugasExtra.length > 0 && selectedPetugasExtra.length === petugasPagiIni.length}
                          onChange={(e) => setSelectedPetugasExtra(e.target.checked ? petugasPagiIni : [])}
                          className="peer w-6 h-6 appearance-none rounded-lg border-2 border-amber-200 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-[15px] text-amber-900">Pilih Semua Bapak</span>
                    </label>
                    {petugasPagiIni.map((petugas, idx) => (
                      <label key={idx} className="group flex items-center gap-4 bg-white px-5 py-4 rounded-2xl font-bold text-gray-700 shadow-sm border border-amber-50/50 text-[15px] cursor-pointer hover:shadow-md hover:border-amber-200 transition-all">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPetugasExtra.includes(petugas)}
                            onChange={() => {
                              if (selectedPetugasExtra.includes(petugas)) setSelectedPetugasExtra(selectedPetugasExtra.filter(p => p !== petugas));
                              else setSelectedPetugasExtra([...selectedPetugasExtra, petugas]);
                            }}
                            className="peer w-6 h-6 appearance-none rounded-lg border-2 border-gray-200 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
                          />
                          <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>
                        <span className="group-hover:text-amber-900 transition-colors">{petugas}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl font-bold text-amber-400 border border-amber-100/50 text-center shadow-sm relative z-10">
                    ✨ Tidak ada jadwal piket pagi ini
                  </div>
                )}
              </section>

              <section>
                <button
                  onClick={handleGenerateExtra}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white font-extrabold text-[16px] rounded-2xl shadow-lg shadow-amber-200 flex justify-center items-center gap-3 transition-all"
                >
                  <FiRefreshCw className={`text-xl ${messageExtra ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Extra Pagi
                </button>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold text-amber-900/60 flex items-center gap-2 uppercase tracking-wider pl-1">
                  <FiEdit3 className="text-lg" /> Preview & Edit
                </h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200 to-orange-200 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <textarea
                    className="relative w-full min-h-[220px] bg-white border border-gray-100 text-gray-700 text-[15px] font-medium rounded-3xl focus:ring-4 focus:ring-amber-100 focus:border-amber-300 block p-5 outline-none resize-none leading-relaxed shadow-sm transition-all"
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
            </div>
          )}

          {/* VIEW: SOROGAN HMQ */}
          {activeTab === 'hmq' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <section className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h2 className="text-xs font-black text-center text-emerald-500 tracking-[0.2em] mb-4 uppercase flex items-center justify-center gap-2 relative z-10">
                  <FiBookOpen className="text-sm" /> Sorogan HMQ
                </h2>

                <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  <label className="flex items-center gap-4 cursor-pointer bg-emerald-600/5 px-5 py-3 rounded-2xl hover:bg-emerald-600/10 transition-colors sticky top-0 backdrop-blur-xl z-20">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedHmq.length === SEMUA_BAPAK.length}
                        onChange={(e) => setSelectedHmq(e.target.checked ? SEMUA_BAPAK : [])}
                        className="peer w-6 h-6 appearance-none rounded-lg border-2 border-emerald-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
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
