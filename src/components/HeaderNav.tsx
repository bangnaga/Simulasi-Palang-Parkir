import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, FileCode } from 'lucide-react';

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
      setTimeUtc(now.toISOString().substring(11, 19) + ' UTC');
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-md shrink-0">
      {/* Brand & Logo */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center text-slate-950 font-black italic text-sm tracking-tighter shadow-lg shadow-cyan-500/20">
          SG
        </div>
        <div>
          <h1 className="text-lg font-light tracking-widest uppercase text-slate-200 flex items-center gap-2 leading-none">
            SmartGate <span className="text-cyan-400 font-bold">PRO</span>
            <span className="text-slate-500 font-normal text-xs font-mono">v2.4.0</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1 hidden sm:block">
            RFID Parking Barrier & Inductive Loop Sensing
          </p>
        </div>
      </div>

      {/* System Status & Time Readout */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">System Status</span>
          <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${systemStateColor}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {systemStateLabel}
          </span>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden md:block" />

        <div className="text-right font-mono text-xs hidden md:block">
          <div className="text-slate-500 text-[10px] tracking-wider">{dateStr || 'OCT 24, 2026'}</div>
          <div className="text-cyan-400 font-bold">{timeUtc || '14:28:44 UTC'}</div>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block" />

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenArduinoModal}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-all text-[11px] shadow-sm shadow-cyan-500/10"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Arduino .ino</span>
          </button>

          <button
            onClick={onOpenInfoModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-all text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Loop Edu</span>
          </button>

          <button
            onClick={onToggleSound}
            className={`p-2 rounded-sm border transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
