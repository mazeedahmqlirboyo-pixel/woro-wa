import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiEdit3, FiCheckSquare, FiBookOpen, FiCopy } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const TARGET_PHONE = '628889583421';

// Mapping: new Date().getDay() menghasilkan index 0 (Minggu) sampai 6 (Sabtu)
const JADWAL = {
  0: { label: "Malam Senin", petugas: ["Bpk. Choerul Anam", "Bpk. Abdul Wakhid"] },
  1: { label: "Malam Selasa", petugas: ["Bpk. Muhammad Hadi Mafatih", "Bpk. Mohamad Khasan Bisri"] },
  2: { label: "Malam Rabu", petugas: ["Bpk. Muchammad Haqqinnazili", "Bpk. Abdillah Khoironi"] },
  3: { label: "Malam Kamis", petugas: ["Bpk. Muhammad Ricky Gunawan Pratama", "Bpk. Ahmad Syarief Qornel"] },
  4: { label: "Malam Jumat", petugas: [] }, // Tidak ada jadwal
  5: { label: "Malam Sabtu", petugas: ["Bpk. Adin Muhamad Mufid", "Bpk. Agus Wahyudin"] },
  6: { label: "Malam Minggu", petugas: ["Bpk. M Khoirul Anwar", "Bpk. Muhammad Burhanuddin Ramadhan"] }
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

export default function App() {
  const [activeTab, setActiveTab] = useState('musylail');

  // STATE: MUSYLAIL
  const [malamIni, setMalamIni] = useState('');
  const [petugasMalamIni, setPetugasMalamIni] = useState([]);
  const [selectedPetugas, setSelectedPetugas] = useState([]);
  const [messageMusylail, setMessageMusylail] = useState('');

  // STATE: SOROGAN HMQ
  const [selectedHmq, setSelectedHmq] = useState([]);
  const [messageHmq, setMessageHmq] = useState('');

  // STATE: SOROGAN AL-BAQOROH
  const [selectedAlbaqoroh, setSelectedAlbaqoroh] = useState([]);
  const [messageAlbaqoroh, setMessageAlbaqoroh] = useState('');

  // 4 & 8. Auto Detect Hari -> Konversi "Malam Selanjutnya"
  useEffect(() => {
    const today = new Date();
    const dayIndex = today.getDay(); // 0 is Sunday, ..., 6 is Saturday

    const jadwalMalam = JADWAL[dayIndex];
    setMalamIni(jadwalMalam.label);
    setPetugasMalamIni(jadwalMalam.petugas);
    setSelectedPetugas(jadwalMalam.petugas); // Select all by default
  }, []);

  const getRandomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const pray = String.fromCodePoint(0x1F64F);

  // === HANDLER MUSYLAIL ===
  const handleGenerateMusylail = () => {
    if (petugasMalamIni.length === 0) {
      setMessageMusylail(`Tidak ada jadwal jaga malam hari ini.`);
      return;
    }
    if (selectedPetugas.length === 0) {
      alert("Silakan pilih minimal satu petugas.");
      return;
    }

    let generated = `*INFO JAGA MUSYLAIL AL-BAQOROH*\n\n${getRandomGreeting()}\n\n`;
    selectedPetugas.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Mohon untuk datang tepat waktu jam 08.15 malam sampai dengan selesai*\n\n*Dan untuk Bapak-bapak yang lain untuk senantiasa Jaga MUSYLAIL di HMQ*\n\nTerima kasih ${pray}`;
    setMessageMusylail(generated);
  };

  // === HANDLER HMQ ===
  const handleGenerateHmq = () => {
    if (selectedHmq.length === 0) {
      alert("Silakan pilih minimal satu bapak untuk disorogan.");
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
      alert("Silakan pilih minimal satu bapak untuk disorogan.");
      return;
    }

    let generated = `*INFO SOROGAN AL-BAQOROH*\n\n${getRandomGreeting()}\n\n`;
    selectedAlbaqoroh.forEach(name => {
      generated += `@${name}\n`;
    });
    generated += `\n*Informasi untuk Bapak-bapak sekalian, hari ini ada kegiatan Sorogan di AL-BAQOROH. Mohon kehadirannya.*\n\nTerima kasih ${pray}`;
    setMessageAlbaqoroh(generated);
  };

  const handleCopy = (msg) => {
    if (!msg.trim()) {
      alert("Pesan kosong. Silakan klik Generate Pesan terlebih dahulu.");
      return;
    }
    navigator.clipboard.writeText(msg).then(() => {
      alert("Pesan berhasil disalin!");
    }).catch(err => {
      console.error('Gagal menyalin:', err);
      alert("Gagal menyalin pesan.");
    });
  };

  // UI HELPERS
  const renderTabButton = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-3 font-bold text-[13px] w-full transition-all duration-300 rounded-[1rem] ${activeTab === id
          ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]'
          : 'text-gray-500 hover:text-indigo-600 hover:bg-white/50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-100 flex flex-col items-center pb-8 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl min-h-screen shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative pb-6 sm:my-10 sm:min-h-0 sm:rounded-[2.5rem] border border-white overflow-hidden transition-all duration-500">

        {/* Header - Sticky */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/50">
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
            <div className="flex w-full bg-gray-100/80 p-1.5 rounded-[1.25rem] shadow-inner">
              {renderTabButton('musylail', 'Musylail')}
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
                <h2 className="text-xs font-black text-center text-indigo-400 tracking-[0.2em] mb-2 uppercase relative z-10">Piket Hari Ini</h2>
                <div className="text-4xl font-black text-center text-indigo-900 mb-6 tracking-tight relative z-10">{malamIni}</div>

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
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-5 rounded-2xl font-bold text-indigo-400 border border-indigo-100/50 text-center shadow-sm">
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
                  <label className="flex items-center gap-4 cursor-pointer bg-sky-600/5 px-5 py-3 rounded-2xl hover:bg-sky-600/10 transition-colors sticky top-0 backdrop-blur-xl z-20">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAlbaqoroh.length === SEMUA_BAPAK.length}
                        onChange={(e) => setSelectedAlbaqoroh(e.target.checked ? SEMUA_BAPAK : [])}
                        className="peer w-6 h-6 appearance-none rounded-lg border-2 border-sky-200 checked:bg-sky-500 checked:border-sky-500 transition-all cursor-pointer"
                      />
                      <FiCheckSquare className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-[15px] text-sky-900">Pilih Semua Bapak</span>
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


