import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiSettings, FiCalendar, FiCheckSquare, FiInfo, FiTrash2, FiSave, FiUsers, FiRefreshCw, FiChevronDown, FiPlus, FiX, FiLock } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { LABEL_MALAM, SEMUA_BAPAK } from '../utils/constants';
import { formatDateIndo, getMusylailGroups, getDaysUntilNextRotation, getActiveAlbaqorohTeam } from '../utils/helpers';
import logoWoro from '../assets/512.png.png';

const GlassDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-blue-200/60 text-[11px] px-4 py-3 rounded-xl font-extrabold text-blue-900 shadow-sm hover:border-blue-300 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20"
      >
        <span className="truncate pr-2">{value}</span>
        <FiChevronDown className={`w-4 h-4 text-blue-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute z-50 mt-2 w-full bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl py-2 max-h-48 overflow-y-auto custom-scrollbar transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { onChange(opt); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors ${value === opt ? 'bg-blue-50/80 text-blue-700' : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [globalSettings, setGlobalSettings] = useState(null);
  
  const KATEGORI_MUSTAHIQ_LEGACY = {
    "Bpk. Abdillah Khoironi": "A", "Bpk. M Khoirul Anwar": "A", "Bpk. Abdul Wakhid": "A",
    "Bpk. Adin Muhamad Mufid": "B", "Bpk. Agus Wahyudin": "B", "Bpk. Muhammad Burhanuddin Ramadhan": "B",
    "Bpk. Mohamad Khasan Bisri": "C", "Bpk. Muhammad Hadi Mafatih": "C", "Bpk. Choerul Anam": "C", 
    "Bpk. Muhammad Ricky Gunawan Pratama": "D", "Bpk. Muchammad Haqqinnazili": "D", "Bpk. Ahmad Syarief Qornel": "D",
  };

  const migrateDaftar = (raw) => raw.map(item => {
    if (typeof item === 'string') return { nama: item, kategori: KATEGORI_MUSTAHIQ_LEGACY[item] || "Umum" };
    return item;
  });

  // Settings States
  const [isAutoRotatePartner, setIsAutoRotatePartner] = useState(true);
  const [hariAktif, setHariAktif] = useState([0, 1, 2, 3, 6]);
  const [daftarMustahiq, setDaftarMustahiq] = useState(() => migrateDaftar(SEMUA_BAPAK));
  const [manualGroups, setManualGroups] = useState([]);

  // Mustahiq Management States
  const [newMustahiq, setNewMustahiq] = useState('');
  const [newKategori, setNewKategori] = useState('A');

  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setIsLoggedIn(!!data?.session);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    showToast('Sesi admin berhasil dikunci (Logout)!');
  };

  // Daily Schedule States
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  
  // State manual override for the selected date
  const [manualPetugas, setManualPetugas] = useState([]);
  const [isLibur, setIsLibur] = useState(false);
  const [albaqorohAnchorObj, setAlbaqorohAnchorObj] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchAlbaqorohState();
    checkSession();
  }, []);

  useEffect(() => {
    fetchDailyOverride();
  }, [selectedDate]);

  // Adjust manualGroups array size if daftarMustahiq length changes
  useEffect(() => {
    const numGroups = Math.ceil(daftarMustahiq.length / 2);
    if (manualGroups.length !== numGroups) {
      const newGroups = [];
      for(let i=0; i<numGroups; i++) {
        newGroups.push(manualGroups[i] || ["Kosong", "Kosong"]);
      }
      setManualGroups(newGroups);
    }
  }, [daftarMustahiq.length]);

  const fetchGlobalSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setGlobalSettings(data);
      setIsAutoRotatePartner(data.is_auto_rotate_partner ?? true);
      
      if (data.hari_aktif_musylail) {
        setHariAktif(data.hari_aktif_musylail.filter(d => d !== 4));
      } else if (data.is_malam_sabtu_active) {
        setHariAktif([0, 1, 2, 3, 5, 6]);
      }
      
      if (data.daftar_mustahiq) {
        setDaftarMustahiq(migrateDaftar(data.daftar_mustahiq));
      }
      if (data.manual_groups) setManualGroups(data.manual_groups);
    }
  };

  const fetchDailyOverride = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase.from('jadwal_musylail').select('*').eq('tanggal', dateStr).maybeSingle();
    
    if (data) {
      setManualPetugas(data.petugas || []);
      setIsLibur(data.is_libur);
    } else {
      setManualPetugas([]);
      setIsLibur(false);
    }
  };

  const fetchAlbaqorohState = async () => {
    const { data } = await supabase.from('jadwal_musylail').select('*').eq('tanggal', '2099-01-01').maybeSingle();
    setAlbaqorohAnchorObj(data || null);
  };

  const saveAlbaqorohAnchor = async (teamName) => {
    const dateStr = new Date().toISOString();
    const { error } = await supabase.from('jadwal_musylail').upsert({
      tanggal: '2099-01-01',
      label_malam: 'ALBAQOROH_STATE',
      petugas: [dateStr, teamName],
      is_libur: false
    }, { onConflict: 'tanggal' });
    
    if (!error) {
      showToast(`Rotasi Sorogan berhasil dikalibrasi ke ${teamName}!`);
      fetchAlbaqorohState();
    } else {
      showToast('Gagal mengkalibrasi rotasi', 'error');
    }
  };

  const saveSettingsToDB = async (updates) => {
    const { error } = await supabase.from('settings').upsert({ id: 'global', ...updates });
    if (!error) {
      showToast('Pengaturan berhasil disimpan');
      fetchGlobalSettings();
    } else {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
  };

  const [authAction, setAuthAction] = useState(null);

  const requireAuth = async (actionCallback) => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      actionCallback();
    } else {
      setAuthAction(() => actionCallback);
      setShowAuthModal(true);
    }
  };

  const submitAuth = async () => {
    if (!adminPassword) return;
    setIsAuthenticating(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@mazeeda.com',
        password: adminPassword,
      });
      if (error) {
        showToast('Password salah atau gagal login', 'error');
        setIsAuthenticating(false);
        return;
      }
    }
    
    setIsLoggedIn(true);
    setShowAuthModal(false);
    setAdminPassword('');
    setIsAuthenticating(false);
    
    if (authAction) {
      authAction();
      setAuthAction(null);
    }
  };

  const toggleHariAktif = (dayIndex) => {
    const newHari = hariAktif.includes(dayIndex)
      ? hariAktif.filter(d => d !== dayIndex)
      : [...hariAktif, dayIndex].sort();
    
    setHariAktif(newHari);
    saveSettingsToDB({ hari_aktif_musylail: newHari });
  };

  const addMustahiq = () => {
    if (!newMustahiq.trim()) return;
    requireAuth(() => {
      const newList = [...daftarMustahiq, { nama: newMustahiq.trim(), kategori: newKategori }];
      setDaftarMustahiq(newList);
      setNewMustahiq('');
      saveSettingsToDB({ daftar_mustahiq: newList });
    });
  };

  const removeMustahiq = (index) => {
    requireAuth(() => {
      const newList = daftarMustahiq.filter((_, i) => i !== index);
      setDaftarMustahiq(newList);
      saveSettingsToDB({ daftar_mustahiq: newList });
    });
  };

  const saveManualGroups = async () => {
    await saveSettingsToDB({ manual_groups: manualGroups });
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
  
  const HARI_OPTIONS = [
    { label: "M. Ahad", val: 6 },
    { label: "M. Senin", val: 0 },
    { label: "M. Selasa", val: 1 },
    { label: "M. Rabu", val: 2 },
    { label: "M. Kamis", val: 3 },
    { label: "M. Sabtu", val: 5 },
  ];

  const MUSTAHIQ_OPTIONS = ["Kosong", ...daftarMustahiq.map(m => m.nama)];

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center pb-8 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
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
            
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <button onClick={handleLogout} className="p-2 text-white hover:text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm" title="Kunci Kembali (Logout)">
                  <FiLock className="w-5 h-5" />
                </button>
              )}
              <Link to="/" className="p-2 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors" title="Kembali ke Beranda">
                <FiHome className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          
          {/* Global Settings */}
          <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h2 className="text-xs font-black text-blue-600 tracking-[0.2em] mb-4 uppercase flex items-center gap-2 relative z-10">
              <FiSettings className="text-lg" /> PENGATURAN GLOBAL
            </h2>
            
            <div className="relative z-10 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-700 mb-3 text-center">Hari Aktif Piket Musylail:</p>
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                  {HARI_OPTIONS.map(hari => (
                    <button
                      key={hari.val}
                      onClick={() => toggleHariAktif(hari.val)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all border w-full ${hariAktif.includes(hari.val) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50'}`}
                    >
                      {hari.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-blue-50">
                <p className="text-xs font-bold text-gray-700 mb-3">Daftar Mustahiq ({daftarMustahiq.length} Orang):</p>
                <div className="flex gap-2 mb-3">
                  <select 
                    value={newKategori}
                    onChange={e => setNewKategori(e.target.value)}
                    className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 font-black text-blue-800 shadow-sm transition-all hover:border-blue-300 cursor-pointer appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232563EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '1.75rem' }}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  <input 
                    type="text" 
                    value={newMustahiq}
                    onChange={e => setNewMustahiq(e.target.value)}
                    placeholder="Nama bapak baru..."
                    className="flex-1 bg-gray-50 border border-gray-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button onClick={addMustahiq} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors">
                    <FiPlus />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {daftarMustahiq.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-lg text-[11px] font-bold text-gray-700 shadow-sm hover:border-blue-200 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 w-5 h-5 flex items-center justify-center rounded text-[10px] font-black shadow-sm border border-blue-200/50">{m.kategori}</span>
                        <span>{idx + 1}. {m.nama}</span>
                      </span>
                      <button onClick={() => removeMustahiq(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    requireAuth(() => {
                      setIsAutoRotatePartner(checked);
                      saveSettingsToDB({ is_auto_rotate_partner: checked });
                    });
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            {isAutoRotatePartner ? (
              <div className="relative z-10 bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <p className="text-xs text-gray-500 font-medium flex flex-col gap-1">
                    <span className="flex items-center gap-2"><FiRefreshCw className="text-blue-500 animate-spin-slow" /> Sedang mode otomatis. Ini pasangan minggu ini:</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded w-fit border border-gray-200">
                      Sisa <b>{getDaysUntilNextRotation(new Date(), globalSettings)} hari</b> sebelum rotasi berikutnya
                    </span>
                  </p>
                  <button 
                    onClick={() => requireAuth(() => {
                      const nowStr = new Date().toISOString();
                      saveSettingsToDB({ updated_at: nowStr });
                      setGlobalSettings(prev => ({ ...prev, updated_at: nowStr }));
                      showToast('Rotasi berhasil diacak ulang!', 'success');
                    })}
                    className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm w-fit"
                  >
                    <FiRefreshCw /> Acak Ulang Sekarang
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                  {currentActiveGroups.map((g, idx) => (
                    <div key={idx} className="text-[11px] font-bold text-gray-700 bg-white p-2 rounded-lg border border-gray-100 flex flex-col gap-1 shadow-sm">
                      <span className="text-[9px] text-blue-500 font-black">KELOMPOK {idx + 1}</span>
                      <span>{g[0]} &amp; {g[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-xs text-red-500 mb-3 font-bold">
                  Mode manual aktif. Abang bebas meracik pasangan kelompok di bawah ini:
                </p>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2 mb-4 pb-16">
                  {manualGroups.map((group, gIdx) => (
                    <div key={gIdx} className="bg-blue-50/30 p-3 rounded-xl border border-blue-100">
                      <div className="text-[10px] font-black text-blue-700 uppercase mb-2">Kelompok {gIdx + 1}</div>
                      <div className="space-y-2">
                        <GlassDropdown 
                          value={group[0]} 
                          options={MUSTAHIQ_OPTIONS} 
                          onChange={(val) => handleGroupChange(gIdx, 0, val)} 
                        />
                        <GlassDropdown 
                          value={group[1]} 
                          options={MUSTAHIQ_OPTIONS} 
                          onChange={(val) => handleGroupChange(gIdx, 1, val)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full pt-4 bg-gradient-to-t from-white via-white to-transparent">
                  <button 
                    onClick={saveManualGroups}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-extrabold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <FiSave /> Simpan Formasi Kelompok
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Pengaturan Sorogan Al-Baqoroh */}
          <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-xs font-black text-blue-600 tracking-[0.2em] mb-4 uppercase flex items-center gap-2 relative z-10">
              <FiUsers className="text-lg" /> PENGATURAN AL-BAQOROH
            </h2>
            
            <p className="text-xs text-gray-500 mb-5 leading-relaxed relative z-10 font-medium">
              Jika minggu ini jadwal Sorogan Libur, abaikan saja. Ketika mau mulai ngaji lagi minggu depan, tinggal ke sini dan klik <strong>Paksa TIM 1</strong> atau <strong>Paksa TIM 2</strong> sesuai jatah yang tertunda.
            </p>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-4 text-center relative z-10">
              <p className="text-blue-800 font-bold text-xs mb-1">Status Minggu Ini (Otomatis):</p>
              <p className="text-blue-900 font-black text-xl">{getActiveAlbaqorohTeam(albaqorohAnchorObj).label}</p>
            </div>

            <div className="flex gap-3 relative z-10">
              <button 
                onClick={() => saveAlbaqorohAnchor('TIM 1')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold rounded-xl shadow-md transition-all active:scale-95"
              >
                Paksa TIM 1
              </button>
              <button 
                onClick={() => saveAlbaqorohAnchor('TIM 2')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold rounded-xl shadow-md transition-all active:scale-95"
              >
                Paksa TIM 2
              </button>
            </div>
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
                  {daftarMustahiq.map(m => (
                    <label key={m.nama} className="group flex items-center gap-4 bg-white px-4 py-3.5 rounded-xl font-bold text-gray-700 shadow-sm border border-blue-50/50 text-[14px] cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={manualPetugas.includes(m.nama)}
                          onChange={() => togglePetugas(m.nama)}
                          className="peer w-5 h-5 appearance-none rounded-lg border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                        />
                        <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-3 h-3" />
                      </div>
                      <span className="group-hover:text-blue-900 transition-colors flex items-center gap-2">
                        {m.nama} <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">{m.kategori}</span>
                      </span>
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

      {/* Auth Modal untuk Acak Ulang */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-4 text-center">
              <h3 className="text-white font-extrabold text-lg">Verifikasi Keamanan</h3>
              <p className="text-blue-100 text-xs mt-1">Gunakan akun admin@mazeeda.com</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                <input 
                  type="password" 
                  autoFocus
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && adminPassword && !isAuthenticating) {
                      submitAuth();
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Masukkan password admin..."
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => {
                    setShowAuthModal(false);
                    setAdminPassword('');
                    setAuthAction(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={isAuthenticating}
                >
                  Batal
                </button>
                <button 
                  onClick={submitAuth}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isAuthenticating || !adminPassword}
                >
                  {isAuthenticating ? <FiRefreshCw className="animate-spin" /> : 'Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
