import React, { useState, useEffect } from 'react';
import { FiHome, FiSettings, FiCalendar, FiCheckSquare, FiInfo, FiTrash2, FiSave, FiUsers, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { SEMUA_BAPAK, LABEL_MALAM, SHIFT_MUSYLAIL } from '../utils/constants';
import { formatDateIndo, getMusylailGroups } from '../utils/helpers';
import logoWoro from '../assets/512.png.png';

export default function AdminPage() {
  const [globalSettings, setGlobalSettings] = useState(null);
  const [isMalamSabtuActive, setIsMalamSabtuActive] = useState(false);
  const [isAutoRotatePartner, setIsAutoRotatePartner] = useState(true);
  
  // For manual group override
  const [manualGroups, setManualGroups] = useState(SHIFT_MUSYLAIL);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  
  // State manual override for the selected date
  const [manualPetugas, setManualPetugas] = useState([]);
  const [isLibur, setIsLibur] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    fetchDailyOverride();
  }, [selectedDate]);

  const fetchGlobalSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setGlobalSettings(data);
      setIsMalamSabtuActive(data.is_malam_sabtu_active ?? false);
      setIsAutoRotatePartner(data.is_auto_rotate_partner ?? true);
      if (data.manual_groups) {
        setManualGroups(data.manual_groups);
      }
    }
  };

  const fetchDailyOverride = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase.from('jadwal_musylail').select('*').eq('tanggal', dateStr).single();
    
    if (data) {
      setManualPetugas(data.petugas || []);
      setIsLibur(data.is_libur);
    } else {
      setManualPetugas([]);
      setIsLibur(false);
    }
  };

  const saveGlobalSettings = async (field, value) => {
    // Optimistic UI update
    if (field === 'is_malam_sabtu_active') setIsMalamSabtuActive(value);
    if (field === 'is_auto_rotate_partner') setIsAutoRotatePartner(value);

    const { error } = await supabase.from('settings').upsert({ id: 'global', [field]: value });
    if (!error) {
      showToast('Pengaturan global berhasil disimpan');
      fetchGlobalSettings();
    }
    else showToast('Gagal menyimpan pengaturan', 'error');
  };

  const saveManualGroups = async () => {
    const { error } = await supabase.from('settings').upsert({ id: 'global', manual_groups: manualGroups });
    if (!error) showToast('Susunan pasangan berhasil disimpan');
    else showToast('Gagal menyimpan pasangan', 'error');
  };

  const saveDailyOverride = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const labelMalam = LABEL_MALAM[selectedDate.getDay()];
    
    const { error } = await supabase.from('jadwal_musylail').upsert({
      tanggal: dateStr,
      label_malam: labelMalam,
      petugas: manualPetugas,
      is_libur: isLibur
    }, { onConflict: 'tanggal' });

    if (!error) showToast('Jadwal hari ini berhasil disimpan');
    else showToast('Gagal menyimpan jadwal', 'error');
  };

  const deleteDailyOverride = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { error } = await supabase.from('jadwal_musylail').delete().eq('tanggal', dateStr);
    
    if (!error) {
      showToast('Override jadwal dihapus (kembali ke otomatis)');
      setManualPetugas([]);
      setIsLibur(false);
    } else {
      showToast('Gagal menghapus jadwal', 'error');
    }
  };

  const togglePetugas = (bapak) => {
    if (manualPetugas.includes(bapak)) {
      setManualPetugas(manualPetugas.filter(p => p !== bapak));
    } else {
      setManualPetugas([...manualPetugas, bapak]);
    }
  };

  const handleGroupChange = (groupIndex, personIndex, value) => {
    const newGroups = [...manualGroups];
    newGroups[groupIndex] = [...newGroups[groupIndex]];
    newGroups[groupIndex][personIndex] = value;
    setManualGroups(newGroups);
  };

  // Get current active groups (for display in auto mode)
  const currentActiveGroups = getMusylailGroups(globalSettings, new Date());

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center pb-8 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-blue-600/95 border-blue-500 text-white shadow-blue-500/30' : 'bg-red-500/95 border-red-400 text-white shadow-red-500/30'}`}>
          <div className="bg-white/20 p-2 rounded-full">
            {toast.type === 'success' ? <FiCheckSquare className="text-xl" /> : <FiInfo className="text-xl" />}
          </div>
          <span className="font-extrabold text-[15px]">{toast.message}</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl min-h-screen shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative pb-6 sm:my-10 sm:min-h-0 sm:rounded-[2.5rem] border border-white overflow-hidden transition-all duration-500">
        
        {/* Header - Sticky */}
        <header id="header" className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/50">
          <div className="flex items-center justify-between px-6 pt-6 pb-5">
            <div className="flex items-center gap-4">
              <img src={logoWoro} alt="Logo Mazeeda" className="w-14 h-14 rounded-2xl shadow-lg shadow-blue-200 object-cover border border-blue-50" />
              <div>
                <h1 className="text-xl font-black text-blue-800 leading-tight">PANEL ADMIN</h1>
                <p className="text-[10px] text-blue-500/80 font-bold tracking-[0.2em] uppercase mt-0.5">MAZEEDA WORO-WORO</p>
              </div>
            </div>
            
            <a href="/" className="p-2 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors" title="Kembali ke Beranda">
              <FiHome className="w-5 h-5" />
            </a>
          </div>
        </header>

        <div className="p-6 space-y-8">
          
          {/* Global Settings */}
          <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h2 className="text-xs font-black text-blue-600 tracking-[0.2em] mb-4 uppercase flex items-center gap-2 relative z-10">
              <FiSettings className="text-lg" /> PENGATURAN GLOBAL
            </h2>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed relative z-10 font-medium">
              Jika diaktifkan, piket Malam Sabtu akan masuk ke dalam putaran shift otomatis mingguan. Jika dimatikan, Malam Sabtu dianggap hari libur.
            </p>
            
            <label className="flex items-center justify-between cursor-pointer bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative z-10 hover:bg-blue-50 transition-colors">
              <span className="text-[15px] font-extrabold text-blue-900">Aktifkan Malam Sabtu</span>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={isMalamSabtuActive}
                  onChange={(e) => saveGlobalSettings('is_malam_sabtu_active', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </section>

          {/* Partner Override Section */}
          <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-xs font-black text-blue-600 tracking-[0.2em] mb-4 uppercase flex items-center gap-2 relative z-10">
              <FiUsers className="text-lg" /> KELOMPOK MUSYLAIL
            </h2>
            
            <label className="flex items-center justify-between cursor-pointer bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 relative z-10 hover:bg-emerald-50 transition-colors mb-4">
              <div>
                <span className="block text-[14px] font-extrabold text-emerald-900">Rotasi Otomatis</span>
                <span className="block text-[10px] text-emerald-700 mt-1">Mengacak pasangan tiap 2 minggu</span>
              </div>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={isAutoRotatePartner}
                  onChange={(e) => saveGlobalSettings('is_auto_rotate_partner', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            {isAutoRotatePartner ? (
              <div className="relative z-10 bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-2">
                  <FiRefreshCw className="text-blue-500 animate-spin-slow" /> Sedang mode otomatis. Ini pasangan minggu ini:
                </p>
                <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar pr-2">
                  {currentActiveGroups.map((g, idx) => (
                    <div key={idx} className="text-[11px] font-bold text-gray-700 bg-white p-2 rounded-lg border border-gray-100">
                      Kelompok {idx + 1}: {g[0]} &amp; {g[1]}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-xs text-red-500 mb-3 font-bold">
                  Mode manual aktif. Abang bebas meracik pasangan kelompok di bawah ini:
                </p>
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2 mb-4">
                  {manualGroups.map((group, gIdx) => (
                    <div key={gIdx} className="bg-blue-50/30 p-3 rounded-xl border border-blue-100">
                      <div className="text-[10px] font-black text-blue-700 uppercase mb-2">Kelompok {gIdx + 1}</div>
                      <div className="space-y-2">
                        <div className="relative">
                          <select 
                            className="appearance-none w-full bg-white border border-blue-200 text-xs px-4 py-3 rounded-xl font-extrabold text-blue-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer pr-10 hover:border-blue-300"
                            value={group[0]}
                            onChange={(e) => handleGroupChange(gIdx, 0, e.target.value)}
                          >
                            {SEMUA_BAPAK.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none w-4 h-4" />
                        </div>
                        <div className="relative mt-2">
                          <select 
                            className="appearance-none w-full bg-white border border-blue-200 text-xs px-4 py-3 rounded-xl font-extrabold text-blue-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer pr-10 hover:border-blue-300"
                            value={group[1]}
                            onChange={(e) => handleGroupChange(gIdx, 1, e.target.value)}
                          >
                            {SEMUA_BAPAK.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={saveManualGroups}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-extrabold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <FiSave /> Simpan Formasi Kelompok
                </button>
              </div>
            )}
          </section>

          {/* Daily Override */}
          <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-xs font-black text-blue-600 tracking-[0.2em] mb-4 uppercase flex items-center gap-2 relative z-10">
              <FiCalendar className="text-lg" /> JADWAL MANUAL PER HARI
            </h2>
            
            <p className="text-xs text-gray-500 mb-5 leading-relaxed relative z-10 font-medium">
              Gunakan fitur ini untuk merubah jadwal di hari tertentu (misal: tukar piket / meliburkan). Perubahan di sini <strong>tidak akan merusak</strong> jadwal otomatis di hari-hari lainnya.
            </p>

            {/* Navigasi Tanggal */}
            <div className="flex items-center justify-between gap-2 mb-5 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 relative z-10">
              <button
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                }}
                className="p-2.5 bg-white hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div className="text-center flex-1">
                <div className="text-[11px] font-extrabold text-blue-500 uppercase tracking-wider">{LABEL_MALAM[selectedDate.getDay()]}</div>
                <div className="text-[15px] font-black text-blue-950 mt-0.5">{formatDateIndo(selectedDate)}</div>
              </div>

              <button
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }}
                className="p-2.5 bg-white hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              <label className="flex items-center gap-4 cursor-pointer bg-red-50/50 px-5 py-4 rounded-2xl hover:bg-red-50 transition-colors border border-red-100">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isLibur}
                    onChange={(e) => setIsLibur(e.target.checked)}
                    className="peer w-6 h-6 appearance-none rounded-lg border-2 border-red-200 checked:bg-red-500 checked:border-red-500 transition-all cursor-pointer"
                  />
                  <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                </div>
                <span className="font-extrabold text-[15px] text-red-700">Jadikan Hari Ini Libur</span>
              </label>

              {!isLibur && (
                <div className="space-y-2 h-64 overflow-y-auto pr-2 custom-scrollbar bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                  {SEMUA_BAPAK.map(bapak => (
                    <label key={bapak} className="group flex items-center gap-4 bg-white px-4 py-3.5 rounded-xl font-bold text-gray-700 shadow-sm border border-blue-50/50 text-[14px] cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={manualPetugas.includes(bapak)}
                          onChange={() => togglePetugas(bapak)}
                          className="peer w-5 h-5 appearance-none rounded-lg border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-3 h-3" />
                      </div>
                      <span className="group-hover:text-blue-900 transition-colors">{bapak}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={deleteDailyOverride}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[14px] font-extrabold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiTrash2 /> Reset (Auto)
                </button>
                <button 
                  onClick={saveDailyOverride}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-extrabold rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiSave /> Simpan
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
