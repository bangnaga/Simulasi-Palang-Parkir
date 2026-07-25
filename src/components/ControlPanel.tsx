import React from 'react';
import {
  Play,
  RotateCcw,
  CreditCard,
  Car,
  Camera,
  Sun,
  Moon,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Power,
  FileCode
} from 'lucide-react';
import { CameraPreset, EnvironmentSetting, GateState, RfidCard, SystemConfig, VehicleType } from '../types';

interface ControlPanelProps {
  vehicleZPos: number;
  setVehicleZPos: (z: number) => void;
  vehicleType: VehicleType;
  setVehicleType: (v: VehicleType) => void;
  selectedCard: RfidCard;
  setSelectedCard: (card: RfidCard) => void;
  rfidCards: RfidCard[];
  gateState: GateState;
  gateAngle: number;
  cameraPreset: CameraPreset;
  setCameraPreset: (cam: CameraPreset) => void;
  environmentMode: EnvironmentSetting;
  setEnvironmentMode: (env: EnvironmentSetting) => void;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  isSimulating: boolean;
  onStartAutoSimulation: () => void;
  onResetSimulation: () => void;
  onTapRfidCard: () => void;
  onEmergencyToggleGate: () => void;
  onOpenLoopInfoModal: () => void;
  onOpenArduinoModal?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  vehicleZPos,
  setVehicleZPos,
  vehicleType,
  setVehicleType,
  selectedCard,
  setSelectedCard,
  rfidCards,
  gateState,
  gateAngle,
  cameraPreset,
  setCameraPreset,
  environmentMode,
  setEnvironmentMode,
  config,
  setConfig,
  isSimulating,
  onStartAutoSimulation,
  onResetSimulation,
  onTapRfidCard,
  onEmergencyToggleGate,
  onOpenLoopInfoModal,
  onOpenArduinoModal
}) => {
  return (
    <div className="p-5 flex flex-col gap-6 overflow-y-auto">
      {/* 1. SIMULATION CONTROL (Geometric Balance Theme) */}
      <div className="border border-slate-800 bg-slate-950 p-4 rounded-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
          <span>Simulation Control</span>
          <span className="text-[10px] text-cyan-400 font-mono">v2.4.0</span>
        </h2>

        <div className="flex flex-col gap-2.5">
          {/* Main Action 1: SIMULATE RFID SCAN */}
          <button
            onClick={onTapRfidCard}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3 rounded-sm transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4" />
            <span>Simulate RFID Scan (Tap)</span>
          </button>

          {/* Main Action 2: AUTO END-TO-END DEMO */}
          <button
            onClick={onStartAutoSimulation}
            disabled={isSimulating}
            className={`w-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-sm transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${
              isSimulating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-slate-200" />
            <span>{isSimulating ? 'Simulating Drive...' : 'Auto Drive Demo'}</span>
          </button>

          {/* Secondary Action Row */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={onEmergencyToggleGate}
              className="flex-1 bg-red-900/30 border border-red-500/50 hover:bg-red-900/50 text-red-400 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{gateAngle > 0 ? 'Force Close' : 'Emergency Stop'}</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Env</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RFID MEMBER CARD SELECTION */}
      <div className="border border-slate-800 bg-slate-950 p-4 rounded-sm flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
          <span>Active RFID Card</span>
          <span className="text-[10px] text-emerald-400 font-mono">13.56 MHz</span>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {rfidCards.map(card => (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className={`p-2.5 rounded-sm border text-left flex flex-col gap-1 transition-all ${
                selectedCard.id === card.id
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider truncate">{card.type}</span>
                {card.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
              </div>
              <div className="text-[10px] font-mono opacity-80">{card.cardNo}</div>
              <div className="text-[10px] font-mono font-bold text-emerald-400">
                {card.valid ? `Rp ${card.balance.toLocaleString('id-ID')}` : 'Kadaluarsa'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. VEHICLE & POSITIONING */}
      <div className="border border-slate-800 bg-slate-950 p-4 rounded-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Vehicle Position</h2>
          <span className="font-mono text-cyan-400 font-bold text-xs">{vehicleZPos.toFixed(1)}m</span>
        </div>

        {/* Position Slider */}
        <input
          type="range"
          min={-16}
          max={15}
          step={0.2}
          value={vehicleZPos}
          onChange={e => setVehicleZPos(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-none appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
          <span>-16m Start</span>
          <span className="text-cyan-400">-2.5m Loop1</span>
          <span className="text-amber-400">0m Gate</span>
          <span className="text-orange-400">+2.5m Loop2</span>
          <span>+15m Exit</span>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => setVehicleZPos(Math.max(-16, vehicleZPos - 1.5))}
            className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider rounded-sm border border-slate-800 font-bold"
          >
            ◀ Backward 1.5m
          </button>
          <button
            onClick={() => setVehicleZPos(Math.min(15, vehicleZPos + 1.5))}
            className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider rounded-sm border border-slate-800 font-bold"
          >
            Forward 1.5m ▶
          </button>
        </div>

        {/* Vehicle Selection */}
        <div className="mt-2 pt-2 border-t border-slate-900">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1.5">
            Vehicle Model:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['sedan', 'suv', 'hatchback', 'van', 'motorbike'] as VehicleType[]).map(v => (
              <button
                key={v}
                onClick={() => setVehicleType(v)}
                className={`py-1 text-[10px] font-bold uppercase tracking-wider border text-center transition-all ${
                  vehicleType === v
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CAMERA PRESET & ENVIRONMENT */}
      <div className="border border-slate-800 bg-slate-950 p-4 rounded-sm flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Camera & Lighting</h2>

        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: 'orbit', label: 'Orbit 3D' },
              { id: 'driver', label: 'Driver' },
              { id: 'scanner', label: 'RFID Lens' },
              { id: 'top', label: 'Top View' },
              { id: 'gate', label: 'Gate Motor' }
            ] as { id: CameraPreset; label: string }[]
          ).map(cam => (
            <button
              key={cam.id}
              onClick={() => setCameraPreset(cam.id)}
              className={`py-1.5 text-[10px] font-bold uppercase tracking-wider border text-center transition-all ${
                cameraPreset === cam.id
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1 mt-1">
          {(
            [
              { id: 'day', label: 'Day' },
              { id: 'sunset', label: 'Sunset' },
              { id: 'night', label: 'Night' }
            ] as { id: EnvironmentSetting; label: string }[]
          ).map(env => (
            <button
              key={env.id}
              onClick={() => setEnvironmentMode(env.id)}
              className={`py-1.5 text-[10px] font-bold uppercase tracking-wider border text-center transition-all ${
                environmentMode === env.id
                  ? 'bg-amber-950 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {env.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. CONFIGURATION */}
      <div className="border border-slate-800 bg-slate-950 p-4 rounded-sm flex flex-col gap-2 font-mono text-xs">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans mb-1">
          System Config
        </h2>

        <div className="flex items-center justify-between text-slate-400">
          <span>Gate Motor Speed:</span>
          <select
            value={config.gateSpeedSec}
            onChange={e => setConfig(prev => ({ ...prev, gateSpeedSec: parseFloat(e.target.value) }))}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] px-2 py-0.5 rounded-sm outline-none"
          >
            <option value={0.8}>0.8s (High Speed)</option>
            <option value={1.5}>1.5s (Standard)</option>
            <option value={3.0}>3.0s (Heavy)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Safety Anti-Crush:</span>
          <button
            onClick={() => setConfig(prev => ({ ...prev, safetyAntiCrushEnabled: !prev.safetyAntiCrushEnabled }))}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-sm ${
              config.safetyAntiCrushEnabled
                ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                : 'bg-rose-950 border-rose-500 text-rose-400'
            }`}
          >
            {config.safetyAntiCrushEnabled ? 'ENABLE' : 'DISABLE'}
          </button>
        </div>

        {onOpenArduinoModal && (
          <button
            onClick={onOpenArduinoModal}
            className="mt-2 w-full py-2 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-600/80 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Lihat Firmware Arduino C++</span>
          </button>
        )}
      </div>
    </div>
  );
};
