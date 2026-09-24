import React from 'react';
import { X, Cpu, Radio, Zap, Layers, Sparkles } from 'lucide-react';

interface LoopDetectorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoopDetectorInfoModal: React.FC<LoopDetectorInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-pink-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
            <Radio className="w-5 h-5 text-pink-500" />
            <span>Cara Kerja Inductive Loop Detector pada Pintu Parkir</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 border border-slate-200 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-slate-600 text-xs leading-relaxed">
          {/* Summary Banner */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-pink-900">Apa itu Vehicle Loop Detector?</p>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Loop Detector adalah sensor induksi elektromagnetik yang ditanam di bawah permukaan aspal jalan. Sensor ini mendeteksi keberadaan massa logam mobil tanpa menggunakan kamera atau sensor optik yang rentan terhadap cuaca dan debu.
              </p>
            </div>
          </div>

          {/* Principle of Operation Grid */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-purple-500" />
              <span>Prinsip Kerja Induktor & Arus Pusar (Eddy Current)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-sky-700">Langkah 1: Medan Magnetik</span>
                <p className="text-[11px] text-slate-600">
                  Modul memasok frekuensi AC (20 kHz–100 kHz) ke loop kabel tembaga, menciptakan medan elektromagnetik di permukaan jalan.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-amber-800">Langkah 2: Induksi Logam</span>
                <p className="text-[11px] text-slate-600">
                  Ketika bodi logam mobil berada di atas loop, arus pusar (eddy current) terinduksi dan menurunkan nilai induktansi (L).
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-emerald-700">Langkah 3: Deteksi Sinyal</span>
                <p className="text-[11px] text-slate-600">
                  Perubahan frekuensi oscillator (delta f) dideteksi mikrokontroler untuk mengaktifkan kontak relay tanda kehadiran kendaraan.
                </p>
              </div>
            </div>
          </div>

          {/* Loop 1 vs Loop 2 Functions */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Perbedaan Peran Loop 1 vs Loop 2</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Loop 1 */}
              <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-800 text-xs">LOOP 1: Presence Detector</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200/80 text-sky-800">Sebelum Palang</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  • Dipasang sebelum palang pintu (di depan tiang RFID).
                  <br />
                  • <strong>Fungsi Utama</strong>: Memastikan pembacaan kartu RFID hanya dapat diproses saat <strong>ada mobil asli</strong>. Mencegah orang asal tap kartu tanpa mobil.
                </p>
              </div>

              {/* Loop 2 */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs">LOOP 2: Passage & Safety</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">Di Bawah Palang</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  • Dipasang di zona bawah dan setelah palang pintu.
                  <br />
                  • <strong>Anti-Crush</strong>: Mengunci palang agar <strong>dilarang menutup</strong> selama mobil melintas.
                  <br />
                  • <strong>Auto-Close</strong>: Memicu palang menutup otomatis segera setelah mobil lewat sepenuhnya.
                </p>
              </div>
            </div>
          </div>

          {/* Formula Callout */}
          <div className="p-3 px-4 bg-purple-50/70 border border-purple-100 rounded-2xl text-[11px] text-purple-900 flex items-center justify-between font-mono">
            <span>Rumus Resonansi LC Loop:</span>
            <span className="text-purple-700 font-extrabold">f = 1 / (2π √(L × C))</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-pink-100 bg-pink-50/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-200 active:scale-95"
          >
            Mengerti, Tutup Modal ✨
          </button>
        </div>
      </div>
    </div>
  );
};
