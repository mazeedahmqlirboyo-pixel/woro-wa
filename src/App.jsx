import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiEdit3, FiCheckSquare, FiBookOpen } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const TARGET_PHONE = '6285194947325';

// Mapping: new Date().getDay() menghasilkan index 0 (Minggu) sampai 6 (Sabtu)
const JADWAL = {
  0: { label: "Malam Senin", petugas: ["Adin Muhamad Mufid", "Mohamad Khasan Bisri"] },
  1: { label: "Malam Selasa", petugas: ["Abdillah Khoironi", "Muhammad Ricky Gunawan Pratama"] },
  2: { label: "Malam Rabu", petugas: ["Aunurrofiq", "Muhammad Hadi Mafatih"] },
  3: { label: "Malam Kamis", petugas: ["Muchammad Haqqinnazili", "Muhammad Burhanuddin Ramadhan"] },
  4: { label: "Malam Jumat", petugas: [] }, // Tidak ada jadwal
  5: { label: "Malam Sabtu", petugas: ["Ahmad Syarief Qornel", "Choerul Anam"] },
  6: { label: "Malam Minggu", petugas: ["Abdul Wakhid", "Muhammad Hibbatullah Dzul Izzi"] }
};

// Daftar Semua Bapak untuk Opsi Sorogan
const SEMUA_BAPAK = [
  "Adin Muhamad Mufid",
  "Mohamad Khasan Bisri",
  "Abdillah Khoironi",
  "Muhammad Ricky Gunawan Pratama",
  "Aunurrofiq",
  "Muchammad Haqqinnazili",
  "Choerul Anam",
  "Muhammad Burhanuddin Ramadhan",
  "Ahmad Syarief Qornel",
  "Muhammad Hadi Mafatih",
  "Abdul Wakhid",
  "Muhammad Hibbatullah Dzul Izzi"
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
    generated += `\n*Mohon untuk datang tepat waktu jam 07.45 malam sampai dengan selesai*\n\n*Dan untuk Bapak-bapak yang lain untuk senantiasa Jaga MUSYLAIL di HMQ*\n\nTerima kasih ${pray}`;
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

  const handleSend = (msg) => {
    if (!msg.trim()) {
      alert("Pesan kosong. Silakan klik Generate Pesan terlebih dahulu.");
      return;
    }
    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${TARGET_PHONE}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // UI HELPERS
  const renderTabButton = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-3.5 font-bold text-[13px] w-full transition-all ${
        activeTab === id
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-8 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-6 sm:my-8 sm:min-h-0 sm:rounded-[2rem] sm:border border-gray-200 overflow-hidden">
        
        {/* Header - Sticky */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <FiCalendar className="text-2xl text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 leading-tight">Pengumuman</h1>
              <p className="text-[11px] text-gray-500 font-bold tracking-wider">PP. ALBAQOROH</p>
            </div>
          </div>
          
          <div className="flex w-full divide-x divide-gray-100 bg-white border-b border-gray-200 shadow-sm">
            {renderTabButton('musylail', 'Musylail')}
            {renderTabButton('hmq', 'Sorogan HMQ')}
            {renderTabButton('albaqoroh', 'S. Al-Baq')}
          </div>
        </header>

        <div className="p-5 space-y-6">

          {/* VIEW: JAGA MUSYLAIL */}
          {activeTab === 'musylail' && (
            <>
              <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-inner">
                <h2 className="text-[13px] font-bold text-center text-indigo-800 tracking-wider mb-1 uppercase">Piket Hari Ini</h2>
                <div className="text-3xl font-black text-center text-indigo-600 mb-4">{malamIni}</div>

                {petugasMalamIni.length > 0 ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer bg-indigo-100/50 px-4 py-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedPetugas.length > 0 && selectedPetugas.length === petugasMalamIni.length}
                        onChange={(e) => setSelectedPetugas(e.target.checked ? petugasMalamIni : [])}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-50"
                      />
                      <span className="font-bold text-[14px] text-indigo-900">Pilih Semua Bapak</span>
                    </label>
                    {petugasMalamIni.map((petugas, idx) => (
                      <label key={idx} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl font-bold text-gray-800 shadow-sm border border-indigo-100 text-[15px] cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedPetugas.includes(petugas)}
                          onChange={() => {
                            if (selectedPetugas.includes(petugas)) setSelectedPetugas(selectedPetugas.filter(p => p !== petugas));
                            else setSelectedPetugas([...selectedPetugas, petugas]);
                          }}
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        {petugas}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/60 px-4 py-3 rounded-xl font-medium text-gray-500 border border-indigo-50 border-dashed text-sm text-center">
                    ✨ Tidak ada jadwal jaga malam hari ini
                  </div>
                )}
              </section>

              <section>
                <button
                  onClick={handleGenerateMusylail}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-[15px] rounded-xl shadow-sm flex justify-center items-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <FiRefreshCw className={`text-lg ${messageMusylail ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Musylail
                </button>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <FiEdit3 className="text-gray-400" /> Preview & Edit Pesan
                </h2>
                <textarea
                  className="w-full min-h-[220px] bg-gray-50 border border-gray-200 text-gray-800 text-[15px] rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 block p-4 outline-none resize-none leading-relaxed"
                  placeholder="Pesan Jaga Musylail otomatis muncul di sini..."
                  value={messageMusylail}
                  onChange={(e) => setMessageMusylail(e.target.value)}
                />
              </section>

              <section className="pt-2">
                <button
                  onClick={() => handleSend(messageMusylail)}
                  disabled={!messageMusylail.trim()}
                  className={`w-full py-4 text-white font-bold text-[17px] rounded-xl flex items-center justify-center gap-2.5 transition-all ${!messageMusylail.trim()
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md active:scale-[0.98]'
                    }`}
                >
                  <FaWhatsapp className="text-2xl" />
                  Kirim ke WhatsApp
                </button>
              </section>
            </>
          )}

          {/* VIEW: SOROGAN HMQ */}
          {activeTab === 'hmq' && (
            <>
              <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-inner">
                <h2 className="text-[13px] font-bold text-center text-emerald-800 tracking-wider mb-3 uppercase flex items-center justify-center gap-2">
                  <FiBookOpen /> Opsi HMQ
                </h2>
                <div className="space-y-3 h-72 overflow-y-auto pr-1">
                  <label className="flex items-center gap-3 cursor-pointer bg-emerald-100/60 px-4 py-2 rounded-lg sticky top-0 z-10 backdrop-blur-md">
                    <input
                      type="checkbox"
                      checked={selectedHmq.length === SEMUA_BAPAK.length}
                      onChange={(e) => setSelectedHmq(e.target.checked ? SEMUA_BAPAK : [])}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-50"
                    />
                    <span className="font-bold text-[14px] text-emerald-900">Pilih Semua Bapak</span>
                  </label>
                  {SEMUA_BAPAK.map((petugas, idx) => (
                    <label key={idx} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl font-bold text-gray-800 shadow-sm border border-emerald-100 text-[15px] cursor-pointer hover:border-emerald-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedHmq.includes(petugas)}
                        onChange={() => {
                          if (selectedHmq.includes(petugas)) setSelectedHmq(selectedHmq.filter(p => p !== petugas));
                          else setSelectedHmq([...selectedHmq, petugas]);
                        }}
                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      {petugas}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <button
                  onClick={handleGenerateHmq}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[15px] rounded-xl shadow-sm flex justify-center items-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <FiRefreshCw className={`text-lg ${messageHmq ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Sorogan HMQ
                </button>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <FiEdit3 className="text-gray-400" /> Preview & Edit Pesan
                </h2>
                <textarea
                  className="w-full min-h-[220px] bg-gray-50 border border-gray-200 text-gray-800 text-[15px] rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 block p-4 outline-none resize-none leading-relaxed"
                  placeholder="Pesan HMQ otomatis muncul di sini..."
                  value={messageHmq}
                  onChange={(e) => setMessageHmq(e.target.value)}
                />
              </section>

              <section className="pt-2">
                <button
                  onClick={() => handleSend(messageHmq)}
                  disabled={!messageHmq.trim()}
                  className={`w-full py-4 text-white font-bold text-[17px] rounded-xl flex items-center justify-center gap-2.5 transition-all ${!messageHmq.trim()
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md active:scale-[0.98]'
                    }`}
                >
                  <FaWhatsapp className="text-2xl" /> Kirim ke WhatsApp
                </button>
              </section>
            </>
          )}

          {/* VIEW: SOROGAN AL-BAQOROH */}
          {activeTab === 'albaqoroh' && (
            <>
              <section className="bg-sky-50 border border-sky-100 rounded-2xl p-5 shadow-inner">
                <h2 className="text-[13px] font-bold text-center text-sky-800 tracking-wider mb-3 uppercase flex items-center justify-center gap-2">
                  <FiBookOpen /> Opsi AL-BAQOROH
                </h2>
                <div className="space-y-3 h-72 overflow-y-auto pr-1">
                  <label className="flex items-center gap-3 cursor-pointer bg-sky-100/60 px-4 py-2 rounded-lg sticky top-0 z-10 backdrop-blur-md">
                    <input
                      type="checkbox"
                      checked={selectedAlbaqoroh.length === SEMUA_BAPAK.length}
                      onChange={(e) => setSelectedAlbaqoroh(e.target.checked ? SEMUA_BAPAK : [])}
                      className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-50"
                    />
                    <span className="font-bold text-[14px] text-sky-900">Pilih Semua Bapak</span>
                  </label>
                  {SEMUA_BAPAK.map((petugas, idx) => (
                    <label key={idx} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl font-bold text-gray-800 shadow-sm border border-sky-100 text-[15px] cursor-pointer hover:border-sky-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAlbaqoroh.includes(petugas)}
                        onChange={() => {
                          if (selectedAlbaqoroh.includes(petugas)) setSelectedAlbaqoroh(selectedAlbaqoroh.filter(p => p !== petugas));
                          else setSelectedAlbaqoroh([...selectedAlbaqoroh, petugas]);
                        }}
                        className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                      />
                      {petugas}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <button
                  onClick={handleGenerateAlbaqoroh}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-[15px] rounded-xl shadow-sm flex justify-center items-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <FiRefreshCw className={`text-lg ${messageAlbaqoroh ? "" : "animate-spin-slow"}`} />
                  Generate Pesan Sorogan Al-Baqoroh
                </button>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <FiEdit3 className="text-gray-400" /> Preview & Edit Pesan
                </h2>
                <textarea
                  className="w-full min-h-[220px] bg-gray-50 border border-gray-200 text-gray-800 text-[15px] rounded-xl focus:ring-2 focus:ring-sky-100 focus:border-sky-500 block p-4 outline-none resize-none leading-relaxed"
                  placeholder="Pesan Al-Baqoroh otomatis muncul di sini..."
                  value={messageAlbaqoroh}
                  onChange={(e) => setMessageAlbaqoroh(e.target.value)}
                />
              </section>

              <section className="pt-2">
                <button
                  onClick={() => handleSend(messageAlbaqoroh)}
                  disabled={!messageAlbaqoroh.trim()}
                  className={`w-full py-4 text-white font-bold text-[17px] rounded-xl flex items-center justify-center gap-2.5 transition-all ${!messageAlbaqoroh.trim()
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md active:scale-[0.98]'
                    }`}
                >
                  <FaWhatsapp className="text-2xl" /> Kirim ke WhatsApp
                </button>
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}


