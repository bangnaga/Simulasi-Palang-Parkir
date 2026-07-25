import React from 'react';
import { X, Cpu, Radio, ShieldAlert, Zap, Layers } from 'lucide-react';

interface LoopDetectorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoopDetectorInfoModal: React.FC<LoopDetectorInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Radio className="w-5 h-5" />
            <span>Cara Kerja Inductive Loop Detector pada Pintu Parkir</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 text-slate-300 text-xs leading-relaxed">
          {/* Summary Banner */}
          <div className="p-3.5 bg-cyan-950/50 border border-cyan-800/80 rounded-xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-200">Apa itu Vehicle Loop Detector?</p>
              <p className="text-slate-300 mt-1">
                Loop Detector adalah sensor induksi elektromagnetik yang ditanam di bawah permukaan aspal jalan. Sensor ini mendeteksi keberadaan massa logam kendaraan tanpa menggunakan kamera atau sensor optik yang rentan terhadap cuaca dan kotoran.
              </p>
            </div>
          </div>

          {/* Principle of Operation Grid */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Prinsip Kerja Induktor & Arus Pusar (Eddy Current)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-850 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Langkah 1: Medan Magnetik</span>
                <p className="text-[11px] text-slate-300">
                  Modul memasok frekuensi AC (20 kHz–100 kHz) ke loop kabel tembaga, menciptakan medan elektromagnetik di atas permukaan jalan.
                </p>
              </div>

              <div className="p-3 bg-slate-850 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold">Langkah 2: Induksi Logam</span>
                <p className="text-[11px] text-slate-300">
                  Ketika sasis/bodi besi mobil berada di atas loop, arus pusar (eddy current) terinduksi pada bodi mobil dan mengurangi nilai induktansi (L).
                </p>
              </div>

              <div className="p-3 bg-slate-850 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Langkah 3: Pergeseran Frekuensi</span>
                <p className="text-[11px] text-slate-300">
                  Perubahan frekuensi oscillator (delta f) dideteksi mikrokontroler untuk mengaktifkan kontak relay sinyal keberadaan mobil.
                </p>
              </div>
            </div>
          </div>

          {/* Loop 1 vs Loop 2 Functions */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Perbedaan Peran Loop 1 vs Loop 2</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Loop 1 */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/60 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs">LOOP 1: Presence Detector (Presensi)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-900 text-cyan-200">Sebelum Palang</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  • Dipasang sebelum barrier gate (di depan mesin kassa / RFID reader).
                  <br />
                  • **Fungsi Utama**: Memastikan pembacaan kartu RFID hanya dapat diproses saat **ada mobil asli** di lokasi. Mencegah orang pejalan kaki menempelkan kartu tanpa membawa kendaraan.
                </p>
              </div>

              {/* Loop 2 */}
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs">LOOP 2: Passage & Safety (Anti-Crush)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-900 text-amber-200">Di Bawah Palang</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  • Dipasang di zona bawah dan setelah lengan palang pintu.
                  <br />
                  • **Fungsi Safety**: Mengunci palang agar **dilarang menutup** selama mobil masih di bawah palang.
                  <br />
                  • **Fungsi Auto-Close**: Memicu palang **menutup otomatis** segera setelah mobil selesai melintas total.
                </p>
              </div>
            </div>
          </div>

          {/* Formula Callout */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rumus Resonansi LC Loop Detector:</span>
            <span className="text-emerald-400 font-bold">f = 1 / (2π √(L × C))</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/20"
          >
            Mengerti, Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
};
