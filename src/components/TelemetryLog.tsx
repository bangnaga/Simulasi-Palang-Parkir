import React from 'react';
import { Trash2, Terminal } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 bg-slate-900">
      {/* Header section */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">System Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            STREAMING
          </span>
          <button
            onClick={onClearLogs}
            className="text-slate-600 hover:text-slate-400 p-1"
            title="Clear Logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal log feed */}
      <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-2 text-slate-400 leading-relaxed">
        {events.length === 0 ? (
          <div className="text-slate-600 italic">[SYSTEM IDLE] Listening for sensor & RFID events...</div>
        ) : (
          events.map(ev => {
            let textColor = 'text-slate-300';
            if (ev.level === 'success') textColor = 'text-emerald-400 font-semibold';
            if (ev.level === 'warning') textColor = 'text-amber-400';
            if (ev.level === 'error') textColor = 'text-rose-400 font-semibold';

            return (
              <div key={ev.id} className="border-b border-slate-800/40 pb-1 flex flex-col">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500">[{ev.timestamp}]</span>
                  <span className="text-cyan-500 font-bold">[{ev.source}]</span>
                  <span className={textColor}>{ev.message}</span>
                </div>
                {ev.details && <div className="text-[10px] text-slate-500 pl-4">{ev.details}</div>}
              </div>
            );
          })
        )}
      </div>

      {/* Sensor Signal Strength Meter */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-mono mb-2 uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${loop1Active || loop2Active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            RFID & Inductive Signal
          </span>
          <span className="text-emerald-400 font-bold">{loop1Active ? '98% (L1 ACTIVE)' : loop2Active ? '92% (L2 ACTIVE)' : '100% NOMINAL'}</span>
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-none overflow-hidden">
          <div
            className={`h-full rounded-none transition-all duration-300 ${
              loop1Active ? 'bg-cyan-400 w-[98%]' : loop2Active ? 'bg-amber-400 w-[92%]' : 'bg-emerald-500 w-full'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
