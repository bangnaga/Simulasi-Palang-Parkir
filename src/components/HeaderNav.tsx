import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, FileCode, Sparkles, Clock } from 'lucide-react';

interface HeaderNavProps {
  systemStateLabel: string;
  systemStateColor: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenInfoModal: () => void;
  onOpenArduinoModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  systemStateLabel,
  systemStateColor,
  soundEnabled,
  onToggleSound,
  onOpenInfoModal,
  onOpenArduinoModal
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="relative bg-white/95 backdrop-blur-md border-b border-pink-100/90 shadow-2xs shrink-0 z-30">
      {/* Cheerful Rainbow Accent Bar */}
      <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-pink-400 via-rose-400 via-amber-400 via-emerald-400 via-sky-400 to-purple-400 animate-gradient" />

      <div className="h-11 sm:h-15 flex items-center justify-between px-3 sm:px-6">
        {/* Brand & Playful Mascot Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 rounded-lg sm:rounded-2xl flex items-center justify-center text-white text-sm sm:text-xl shadow-xs sm:shadow-md shadow-pink-300/40">
              🚗
            </div>
            <span className="absolute -bottom-1 -right-1 text-[8px] sm:text-xs">✨</span>
          </div>

          <div>
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-xs sm:text-base font-black tracking-tight text-slate-800 flex items-center gap-1 leading-none">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-sky-500 bg-clip-text text-transparent drop-shadow-xs">
                  SmartGate 3D
                </span>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-300" />
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border border-pink-200/80 shadow-2xs">
                🌸 Cute Ceria
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden md:flex items-center gap-1.5">
              <span>Simulasi Parkir Interaktif</span>
              <span className="text-pink-300 font-bold">·</span>
              <span className="text-purple-600 font-semibold">Honda HR-V</span>
              <span className="text-pink-300 font-bold">·</span>
              <span className="text-emerald-600 font-semibold">Dual Loop Sensor</span>
            </p>
          </div>
        </div>

        {/* Center / Right: System Status & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Animated Status Pill */}
          <div className="flex items-center">
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-black text-[10px] sm:text-xs shadow-2xs border transition-all ${
              systemStateLabel.includes('Buka')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : systemStateLabel.includes('Tutup')
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                systemStateLabel.includes('Buka')
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-400 animate-pulse'
                  : systemStateLabel.includes('Tutup')
                  ? 'bg-rose-500 shadow-sm shadow-rose-400'
                  : 'bg-amber-500 shadow-sm shadow-amber-400 animate-spin'
              }`} />
              <span className="whitespace-nowrap">{systemStateLabel}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-pink-100 hidden md:block" />

          {/* Clock & Date (Hidden on mobile) */}
          <div className="text-right text-xs hidden md:flex flex-col items-end">
            <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{dateStr || 'Senin, 24 Okt 2026'}</span>
            </div>
            <div className="text-purple-700 font-black font-mono tracking-tight text-xs">{timeUtc || '15:30:00 WIB'}</div>
          </div>

          <div className="h-6 w-px bg-pink-100 hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onOpenArduinoModal}
              className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl items-center gap-1.5 transition-all shadow-sm shadow-sky-200 active:scale-95 cursor-pointer"
              title="Firmware Arduino .ino"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Firmware .ino</span>
            </button>

            <button
              onClick={onOpenInfoModal}
              className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-xl items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Panduan Loop Sensor"
            >
              <HelpCircle className="w-3.5 h-3.5 text-pink-500" />
              <span>Panduan</span>
            </button>

            <button
              onClick={onToggleSound}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all active:scale-90 cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-100/70 border-amber-300 text-amber-700 hover:bg-amber-200/80 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={soundEnabled ? 'Suara FX Aktif 🔊' : 'Suara FX Mati 🔇'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

