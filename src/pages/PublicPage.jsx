import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiCheckSquare, FiInfo, FiCopy } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { LABEL_MALAM, SHIFT_MUSYLAIL, GREETINGS, INDO_DAYS } from '../utils/constants';
import { formatDateIndo, isToday, getMusylailShiftIndexAuto } from '../utils/helpers';

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState('musylail');
  const [selectedDateMusylail, setSelectedDateMusylail] = useState(() => new Date());
  
  // Settings & Data from Supabase
  const [isMalamSabtuActive, setIsMalamSabtuActive] = useState(false);
  const [jadwalMusylailManual, setJadwalMusylailManual] = useState({});
  const [jadwalExtra, setJadwalExtra] = useState([]);
  
  // Local State Musylail
  const [petugasMalamIni, setPetugasMalamIni] = useState([]);
  const [selectedPetugas, setSelectedPetugas] = useState([]);
  const [messageMusylail, setMessageMusylail] = useState('');
  
  // Local State Extra
  const [selectedDateExtra, setSelectedDateExtra] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw;
  });
  const [petugasExtraIni, setPetugasExtraIni] = useState([]);
  const [selectedPetugasExtra, setSelectedPetugasExtra] = useState([]);
  const [messageExtra, setMessageExtra] = useState('');

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
      // Fetch Settings
      const { data: settings } = await supabase.from('settings').select('*').eq('id', 'global').single();
      if (settings) {
        setIsMalamSabtuActive(settings.is_malam_sabtu_active);
      }

      // Fetch Manual Schedule
      const { data: manualSchedules } = await supabase.from('jadwal_musylail').select('*');
      if (manualSchedules) {
        const manualMap = {};
        manualSchedules.forEach(s => {
          manualMap[s.tanggal] = s;
        });
        setJadwalMusylailManual(manualMap);
      }

      // Fetch Extra Pagi
      const { data: extraSchedules } = await supabase.from('jadwal_extra').select('*');
      if (extraSchedules) {
        setJadwalExtra(extraSchedules);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    const dayIndex = selectedDateMusylail.getDay();
    const dateStr = selectedDateMusylail.toISOString().split('T')[0];
    const isJumat = dayIndex === 4;
    const isSabtu = dayIndex === 5;
    
    // Cek manual
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
      // Auto calculation
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
      setPetugasExtraIni(jadwal.petugas || []);
      setSelectedPetugasExtra(jadwal.petugas || []);
    } else {
      setPetugasExtraIni([]);
      setSelectedPetugasExtra([]);
    }
    setMessageExtra('');
  }, [selectedDateExtra, jadwalExtra]);

  const handleGenerateMusylail = () => {
    if (petugasMalamIni.length === 0) {
      showToast('Tidak ada jadwal jaga malam.', 'error');
      return;
    }
    if (selectedPetugas.length === 0) {
      showToast("Silakan pilih minimal satu petugas.", "error");
      return;
    }

    const dayIndex = selectedDateMusylail.getDay();
    const dateStrIndo = formatDateIndo(selectedDateMusylail);
    const labelMalam = LABEL_MALAM[dayIndex];
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const pray = String.fromCodePoint(0x1F64F);

    let generated = `*INFO JAGA MUSYLAIL AL-BAQOROH (${labelMalam} - ${dateStrIndo})*\n\n${greeting}\n\n`;
    selectedPetugas.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu jam 08.15 malam sampai dengan selesai*\n\n*Dan untuk Bapak-bapak yang lain untuk senantiasa Jaga MUSYLAIL di HMQ*\n\nTerima kasih ${pray}`;
    setMessageMusylail(generated);
  };

  const handleGenerateExtra = () => {
    if (petugasExtraIni.length === 0) {
      showToast('Tidak ada jadwal Extra Pagi.', 'error');
      return;
    }
    if (selectedPetugasExtra.length === 0) {
      showToast("Silakan pilih minimal satu petugas.", "error");
      return;
    }

    const dateStrIndo = formatDateIndo(selectedDateExtra);
    const labelPagi = `${INDO_DAYS[selectedDateExtra.getDay()]} Pagi`;
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const pray = String.fromCodePoint(0x1F64F);

    let generated = `*INFO EXTRA*\n\n${greeting}\n\n`;
    selectedPetugasExtra.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu untuk kegiatan Extra Pagi (${labelPagi}, ${dateStrIndo}) jam 07:45 (Mulai Menemani Lalaran) - 09:00 WIS. (Selesai)*\n\nTerima kasih ${pray}`;
    setMessageExtra(generated);
  };

  const handleCopy = (msg) => {
    if (!msg.trim()) return;
    navigator.clipboard.writeText(msg).then(() => {
      showToast("Teks pesan berhasil disalin! ✨", "success");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-8 selection:bg-blue-200">
      
      {/* Toast Notification */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-[#0066AE] border-blue-700 text-white' : 'bg-red-600 border-red-700 text-white'}`}>
          {toast.type === 'success' ? <FiCheckSquare className="text-xl" /> : <FiInfo className="text-xl" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* Header ala BCA */}
      <header className="bg-[#0066AE] text-white shadow-md sticky top-0 z-20">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FiCalendar className="text-xl" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">WORO MAZEEDA</h1>
              <p className="text-[10px] text-blue-200 tracking-widest uppercase">PP. Albaqoroh</p>
            </div>
          </div>
          <a href="/admin" className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md font-medium transition">Admin</a>
        </div>
        
        {/* Tabs */}
        <div className="max-w-md mx-auto px-5 pt-2 pb-0 flex overflow-x-auto no-scrollbar">
          {['musylail', 'extra'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-4 transition-all whitespace-nowrap ${activeTab === tab ? 'border-orange-400 text-white' : 'border-transparent text-blue-200 hover:text-white'}`}
            >
              {tab === 'musylail' ? 'Musylail' : 'Extra Pagi'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-md mx-auto p-5 space-y-6 mt-2">
        {activeTab === 'musylail' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-5">
            
            {/* Navigasi Tanggal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDateMusylail);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDateMusylail(prev);
                  }}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 text-[#0066AE] rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div className="text-center">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{LABEL_MALAM[selectedDateMusylail.getDay()]}</div>
                  <div className="text-[15px] font-bold text-[#0066AE] mt-0.5">{formatDateIndo(selectedDateMusylail)}</div>
                </div>

                <button
                  onClick={() => {
                    const next = new Date(selectedDateMusylail);
                    next.setDate(next.getDate() + 1);
                    setSelectedDateMusylail(next);
                  }}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 text-[#0066AE] rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              
              {!isToday(selectedDateMusylail) && (
                <button
                  onClick={() => setSelectedDateMusylail(new Date())}
                  className="mt-4 w-full py-2 text-xs font-semibold bg-blue-50 text-[#0066AE] rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <FiRefreshCw /> Hari Ini
                </button>
              )}
            </div>

            {/* List Petugas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Petugas Shift</h3>
              
              {petugasMalamIni.length > 0 ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPetugas.length === petugasMalamIni.length}
                      onChange={(e) => setSelectedPetugas(e.target.checked ? petugasMalamIni : [])}
                      className="w-5 h-5 rounded text-[#0066AE] border-gray-300 focus:ring-[#0066AE]"
                    />
                    <span className="font-semibold text-sm text-gray-800">Pilih Semua</span>
                  </label>
                  {petugasMalamIni.map((petugas, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-200 transition-all">
                      <input
                        type="checkbox"
                        checked={selectedPetugas.includes(petugas)}
                        onChange={() => {
                          if (selectedPetugas.includes(petugas)) setSelectedPetugas(selectedPetugas.filter(p => p !== petugas));
                          else setSelectedPetugas([...selectedPetugas, petugas]);
                        }}
                        className="w-5 h-5 rounded text-[#0066AE] border-gray-300 focus:ring-[#0066AE]"
                      />
                      <span className="font-medium text-sm text-gray-700">{petugas}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-400 font-medium bg-gray-50 rounded-xl">
                  Tidak ada jadwal piket malam ini.
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateMusylail}
              className="w-full py-3.5 bg-[#0066AE] hover:bg-[#00528c] text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
            >
              <FiRefreshCw /> Buat Pesan
            </button>

            {messageMusylail && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4 animate-in fade-in">
                <textarea
                  className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0066AE]"
                  value={messageMusylail}
                  onChange={(e) => setMessageMusylail(e.target.value)}
                />
                <button
                  onClick={() => handleCopy(messageMusylail)}
                  className="w-full py-3 bg-[#f37021] hover:bg-[#d9611a] text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <FiCopy /> Salin Pesan
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extra' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-5">
            {/* Navigasi Tanggal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDateExtra);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDateExtra(prev);
                  }}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 text-[#0066AE] rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div className="text-center">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{INDO_DAYS[selectedDateExtra.getDay()]} Pagi</div>
                  <div className="text-[15px] font-bold text-[#0066AE] mt-0.5">{formatDateIndo(selectedDateExtra)}</div>
                </div>

                <button
                  onClick={() => {
                    const next = new Date(selectedDateExtra);
                    next.setDate(next.getDate() + 1);
                    setSelectedDateExtra(next);
                  }}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 text-[#0066AE] rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            {/* List Petugas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Petugas Shift</h3>
              
              {petugasExtraIni.length > 0 ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPetugasExtra.length === petugasExtraIni.length}
                      onChange={(e) => setSelectedPetugasExtra(e.target.checked ? petugasExtraIni : [])}
                      className="w-5 h-5 rounded text-[#0066AE] border-gray-300 focus:ring-[#0066AE]"
                    />
                    <span className="font-semibold text-sm text-gray-800">Pilih Semua</span>
                  </label>
                  {petugasExtraIni.map((petugas, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-200 transition-all">
                      <input
                        type="checkbox"
                        checked={selectedPetugasExtra.includes(petugas)}
                        onChange={() => {
                          if (selectedPetugasExtra.includes(petugas)) setSelectedPetugasExtra(selectedPetugasExtra.filter(p => p !== petugas));
                          else setSelectedPetugasExtra([...selectedPetugasExtra, petugas]);
                        }}
                        className="w-5 h-5 rounded text-[#0066AE] border-gray-300 focus:ring-[#0066AE]"
                      />
                      <span className="font-medium text-sm text-gray-700">{petugas}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-400 font-medium bg-gray-50 rounded-xl">
                  Tidak ada jadwal piket Extra pagi ini.
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateExtra}
              className="w-full py-3.5 bg-[#0066AE] hover:bg-[#00528c] text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
            >
              <FiRefreshCw /> Buat Pesan
            </button>

            {messageExtra && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4 animate-in fade-in">
                <textarea
                  className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0066AE]"
                  value={messageExtra}
                  onChange={(e) => setMessageExtra(e.target.value)}
                />
                <button
                  onClick={() => handleCopy(messageExtra)}
                  className="w-full py-3 bg-[#f37021] hover:bg-[#d9611a] text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <FiCopy /> Salin Pesan
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
