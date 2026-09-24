import React from 'react';
import { Trash2, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { TelemetryEvent } from '../types';

interface TelemetryLogProps {
  events: TelemetryEvent[];
  onClearLogs: () => void;
  loop1Active: boolean;
  loop2Active: boolean;
}

export const TelemetryLog: React.FC<TelemetryLogProps> = ({
  events,
  onClearLogs,
  loop1Active,
  loop2Active
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-pink-150 bg-white/95 backdrop-blur-md">
      {/* Header section with cute colors */}
      <div className="p-3 px-4 flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-sky-50/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 fill-pink-400" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Aktivitas & Log Sensor
            </h2>
            <p className="text-[9px] text-pink-600 font-semibold">Feed Transaksi Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-purple-700 font-black flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100/80 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE FEED
          </span>
          <button
            onClick={onClearLogs}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            title="Bersihkan Log Aktivitas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 p-3 px-4 text-xs overflow-y-auto space-y-1.5 leading-relaxed">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5 text-center">
            <span className="text-2xl">🌸</span>
            <span className="text-xs font-bold text-slate-500">Log Masih Bersih</span>
            <span className="text-[10px] text-slate-400">Tempel kartu RFID atau gerakkan mobil untuk melihat aktivitas sensor</span>
          </div>
        ) : (
          events.map(ev => {
            let textColor = 'text-slate-700';
            let icon = '💡';
            if (ev.level === 'success') {
              textColor = 'text-emerald-700 font-bold';
              icon = '✨';
            } else if (ev.level === 'warning') {
              textColor = 'text-amber-800 font-bold';
              icon = '⚠️';
            } else if (ev.level === 'error') {
              textColor = 'text-rose-600 font-bold';
              icon = '⛔';
            }

            let tagStyle = 'bg-slate-100 text-slate-600 border-slate-200';
            if (ev.source.includes('LOOP_1')) tagStyle = 'bg-sky-100 text-sky-800 border-sky-300';
            else if (ev.source.includes('LOOP_2')) tagStyle = 'bg-amber-100 text-amber-800 border-amber-300';
            else if (ev.source.includes('RFID')) tagStyle = 'bg-purple-100 text-purple-800 border-purple-300';
            else if (ev.source.includes('GATE')) tagStyle = 'bg-pink-100 text-pink-800 border-pink-300';

            return (
              <div
                key={ev.id}
                className="p-2 rounded-xl bg-slate-50/60 border border-slate-150/70 hover:bg-pink-50/40 hover:border-pink-200 transition-all flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-xs shrink-0">{icon}</span>
                  <span className="text-slate-400 font-mono text-[9px] shrink-0">{ev.timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase border shrink-0 ${tagStyle}`}>
                    {ev.source}
                  </span>
                  <span className={`truncate ${textColor}`}>{ev.message}</span>
                </div>
                {ev.details && (
                  <div className="text-[10px] text-slate-500 pl-5 font-medium">{ev.details}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sensor Signal Strength Meter */}
      <div className="p-3 px-4 bg-gradient-to-r from-slate-50 via-pink-50/30 to-purple-50/30 border-t border-slate-100 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-black mb-1 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${loop1Active || loop2Active ? 'bg-pink-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>Konektivitas Loop & Totem</span>
          </span>
          <span className="text-purple-700 font-black">
            {loop1Active ? '98% (LOOP 1 DETECTED)' : loop2Active ? '94% (LOOP 2 DETECTED)' : '100% ONLINE'}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              loop1Active
                ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 w-[98%]'
                : loop2Active
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 w-[94%]'
                : 'bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400 w-full'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

