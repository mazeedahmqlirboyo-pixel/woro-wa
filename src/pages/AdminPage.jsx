import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { SEMUA_BAPAK, LABEL_MALAM } from '../utils/constants';
import { formatDateIndo } from '../utils/helpers';

export default function AdminPage() {
  const [isMalamSabtuActive, setIsMalamSabtuActive] = useState(false);
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
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      setIsMalamSabtuActive(data.is_malam_sabtu_active);
    }
  };

  const fetchDailyOverride = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data, error } = await supabase.from('jadwal_musylail').select('*').eq('tanggal', dateStr).single();
    
    if (data) {
      setManualPetugas(data.petugas || []);
      setIsLibur(data.is_libur);
    } else {
      setManualPetugas([]);
      setIsLibur(false);
    }
  };

  const saveGlobalSettings = async (checked) => {
    setIsMalamSabtuActive(checked);
    const { error } = await supabase.from('settings').upsert({ id: 'global', is_malam_sabtu_active: checked });
    if (!error) showToast('Pengaturan global berhasil disimpan');
    else showToast('Gagal menyimpan pengaturan', 'error');
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
      showToast('Override jadwal dihapus (kembali ke jadwal otomatis)');
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-8">
      {/* Toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-[#0066AE] border-blue-700 text-white' : 'bg-red-600 border-red-700 text-white'}`}>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#0066AE] text-white shadow-md">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Admin Panel</h1>
          <a href="/" className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md font-medium transition">Ke Beranda</a>
        </div>
      </header>

      <main className="max-w-md mx-auto p-5 space-y-6">
        
        {/* Global Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b pb-2">Pengaturan Global</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Aktifkan Malam Sabtu</span>
            <input 
              type="checkbox" 
              checked={isMalamSabtuActive}
              onChange={(e) => saveGlobalSettings(e.target.checked)}
              className="w-5 h-5 text-[#0066AE] rounded focus:ring-[#0066AE]"
            />
          </label>
        </section>

        {/* Daily Schedule Override */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b pb-2">Atur Jadwal Manual Per Hari</h2>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev);
              }}
              className="p-2 bg-gray-50 text-[#0066AE] rounded-lg"
            >
              &larr;
            </button>
            <div className="text-center">
              <div className="text-xs text-gray-500">{LABEL_MALAM[selectedDate.getDay()]}</div>
              <div className="text-sm font-bold text-[#0066AE]">{formatDateIndo(selectedDate)}</div>
            </div>
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next);
              }}
              className="p-2 bg-gray-50 text-[#0066AE] rounded-lg"
            >
              &rarr;
            </button>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={isLibur}
                onChange={(e) => setIsLibur(e.target.checked)}
                className="w-4 h-4 text-[#0066AE]"
              />
              <span className="text-sm font-medium text-red-600">Jadikan Hari Ini Libur</span>
            </label>

            {!isLibur && (
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                {SEMUA_BAPAK.map(bapak => (
                  <label key={bapak} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={manualPetugas.includes(bapak)}
                      onChange={() => togglePetugas(bapak)}
                      className="w-4 h-4 text-[#0066AE]"
                    />
                    <span className="text-sm text-gray-700">{bapak}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button 
                onClick={saveDailyOverride}
                className="flex-1 py-2 bg-[#0066AE] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Simpan
              </button>
              <button 
                onClick={deleteDailyOverride}
                className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reset ke Auto
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
