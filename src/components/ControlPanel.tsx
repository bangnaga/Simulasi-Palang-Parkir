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
  FileCode,
  Sparkles,
  Heart,
  Sunset,
  Zap,
  ShieldCheck,
  Compass,
  ArrowRight,
  ArrowLeft
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
    <div className="p-3.5 sm:p-4 flex flex-col gap-3.5 overflow-y-auto h-full text-slate-700">
      {/* 1. KONTROL UTAMA SIMULASI (Vibrant & Cute) */}
      <div className="border border-pink-150 bg-white/95 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white text-base shadow-xs">
              🎮
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Aksi Cepat Gerbang
              </h2>
              <p className="text-[10px] text-pink-600 font-semibold">Simulasi Sensor & RFID</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border border-pink-200">
            ✨ Interactive
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Main Action 1: SIMULATE RFID SCAN */}
          <button
            onClick={onTapRfidCard}
            className="w-full relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:via-rose-600 hover:to-purple-700 text-white font-extrabold py-3.5 px-4 rounded-2xl transition-all text-xs tracking-wide flex items-center justify-center gap-2.5 shadow-md shadow-pink-300/50 hover:shadow-lg hover:shadow-pink-300/60 active:scale-97 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="drop-shadow-xs text-[13px]">Tempel Kartu RFID (Tap Scanner)</span>
            <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200 animate-pulse" />
          </button>

          {/* Main Action 2: AUTO DRIVE SIMULATION */}
          <button
            onClick={onStartAutoSimulation}
            disabled={isSimulating}
            className={`w-full relative overflow-hidden bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-600 text-white font-extrabold py-3 px-4 rounded-2xl transition-all text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm shadow-teal-200/80 active:scale-97 cursor-pointer ${
              isSimulating ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-white/25 flex items-center justify-center text-white">
              <Play className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="text-[12px]">
              {isSimulating ? '🚗 Mobil Sedang Melintas Otomatis...' : '✨ Jalankan Simulasi Lengkap (Auto)'}
            </span>
          </button>

          {/* Quick Support Actions */}
          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              onClick={onEmergencyToggleGate}
              className={`py-2 px-3 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border shadow-2xs ${
                gateAngle > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{gateAngle > 0 ? 'Tutup Palang' : 'Darurat Stop'}</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="py-2 px-3 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Posisi Mobil</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KOLEKSI KARTU RFID BERWARNA (Cute Mini Cards) */}
      <div className="border border-purple-100/90 bg-white/95 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-400 to-indigo-400 flex items-center justify-center text-white text-base shadow-xs">
              💳
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pilih Kartu RFID
              </h2>
              <p className="text-[10px] text-purple-600 font-semibold">Tersedia 5 Varian Kartu</p>
            </div>
          </div>
          <span className="text-[10px] text-purple-700 font-black bg-purple-100/70 px-2.5 py-0.5 rounded-full border border-purple-200">
            NFC 13.56 MHz
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rfidCards.map(card => {
            const isSelected = selectedCard.id === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 shadow-sm ring-2 ring-purple-300/50'
                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-pink-50/40 hover:border-pink-200 text-slate-600'
                }`}
              >
                {/* Decorative background circle */}
                <div
                  className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-15 pointer-events-none"
                  style={{ backgroundColor: card.color }}
                />

                <div className="flex items-start justify-between gap-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm">{card.avatarIcon || '💳'}</span>
                    <span className="text-[11px] font-black text-slate-800 truncate">
                      {card.name}
                    </span>
                  </div>
                  {card.valid ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1 relative z-10">
                  <span>{card.cardNo}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-white/80 border border-slate-200 text-slate-600">
                    {card.type}
                  </span>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between relative z-10">
                  <span className="text-[9px] text-slate-400 font-semibold">Saldo:</span>
                  <span
                    className={`text-[11px] font-black ${
                      card.valid ? 'text-emerald-600' : 'text-rose-500 line-through'
                    }`}
                  >
                    {card.valid ? `Rp ${card.balance.toLocaleString('id-ID')}` : 'Rp 0'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. POSISI & PILIHAN KENDARAAN (HR-V, Sedan, etc.) */}
      <div className="border border-sky-100/90 bg-white/95 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-400 flex items-center justify-center text-white text-base shadow-xs">
              🚙
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Posisi & Model Mobil
              </h2>
              <p className="text-[10px] text-sky-600 font-semibold">Kontrol Gerak Maju/Mundur</p>
            </div>
          </div>
          <span className="font-mono text-sky-700 font-black text-xs bg-sky-100/70 px-2.5 py-0.5 rounded-full border border-sky-200">
            {vehicleZPos.toFixed(1)} m
          </span>
        </div>

        {/* Range Slider dengan Desain Imut */}
        <div className="flex flex-col gap-1.5">
          <input
            type="range"
            min={-16}
            max={15}
            step={0.2}
            value={vehicleZPos}
            onChange={e => setVehicleZPos(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-gradient-to-r from-sky-100 via-pink-100 to-emerald-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />

          <div className="flex justify-between text-[9px] font-extrabold text-slate-400">
            <span className="text-slate-500">🏁 Masuk (-16m)</span>
            <span className="text-sky-600">📍 Loop 1 (-2.5m)</span>
            <span className="text-rose-500">🚧 Palang (0m)</span>
            <span className="text-emerald-600">🛡️ Loop 2 (+2.5m)</span>
            <span className="text-slate-500">Keluar (+15m)</span>
          </div>
        </div>

        {/* Step Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-0.5">
          <button
            onClick={() => setVehicleZPos(Math.max(-16, vehicleZPos - 1.5))}
            className="py-1.5 px-3 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-700 text-[11px] rounded-xl border border-pink-200 font-extrabold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Mundur 1.5m</span>
          </button>
          <button
            onClick={() => setVehicleZPos(Math.min(15, vehicleZPos + 1.5))}
            className="py-1.5 px-3 bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-sky-700 text-[11px] rounded-xl border border-sky-200 font-extrabold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
          >
            <span>Maju 1.5m</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Model Kendaraan Selector */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">
            Pilihan Model Kendaraan:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'suv', label: 'HR-V (SUV)', icon: '🚙', color: 'from-pink-500 to-rose-500' },
              { id: 'sedan', label: 'Sedan', icon: '🚗', color: 'from-sky-500 to-blue-500' },
              { id: 'hatchback', label: 'Hatchback', icon: '🏎️', color: 'from-emerald-400 to-teal-500' },
              { id: 'van', label: 'Minivan', icon: '🚐', color: 'from-amber-400 to-orange-500' },
              { id: 'motorbike', label: 'Motor', icon: '🛵', color: 'from-purple-400 to-indigo-500' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setVehicleType(v.id as VehicleType)}
                className={`py-2 px-2 text-[10px] font-black rounded-xl border text-center transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  vehicleType === v.id
                    ? `bg-gradient-to-r ${v.color} text-white border-transparent shadow-xs font-black`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-pink-50/50 hover:border-pink-200'
                }`}
              >
                <span>{v.icon}</span>
                <span className="truncate">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 10 SUDUT KAMERA 3D WARNA-WARNI (Colorful Camera Dock) */}
      <div className="border border-indigo-100/90 bg-white/95 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white text-base shadow-xs">
              🎥
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                10 Sudut Kamera 3D
              </h2>
              <p className="text-[10px] text-indigo-600 font-semibold">Perspektif Sinematik</p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-700 font-black bg-indigo-100/70 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Full 3D
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'orbit', label: 'Orbit 3D', desc: 'Bebas 360°', icon: '🔄', badge: 'bg-sky-100 text-sky-700' },
            { id: 'driver', label: 'Driver Chase', desc: 'Belakang Mobil', icon: '🚘', badge: 'bg-pink-100 text-pink-700' },
            { id: 'cockpit', label: 'Cockpit POV', desc: 'Kabin HR-V', icon: '👀', badge: 'bg-purple-100 text-purple-700' },
            { id: 'scanner', label: 'RFID Lens', desc: 'Totem Reader', icon: '💳', badge: 'bg-amber-100 text-amber-800' },
            { id: 'alpr', label: 'ALPR Plat', desc: 'Sensor Kamera', icon: '📸', badge: 'bg-emerald-100 text-emerald-700' },
            { id: 'cctv', label: 'CCTV Pos', desc: 'Surveillance', icon: '📹', badge: 'bg-rose-100 text-rose-700' },
            { id: 'cinematic', label: 'Cinematic', desc: 'Hero Angle', icon: '🎬', badge: 'bg-violet-100 text-violet-700' },
            { id: 'wheel', label: 'Velg & Ban', desc: 'Roda & Suspensi', icon: '🔘', badge: 'bg-teal-100 text-teal-700' },
            { id: 'top', label: 'Top View', desc: 'Tampak Atas 90°', icon: '🗺️', badge: 'bg-blue-100 text-blue-700' },
            { id: 'gate', label: 'Motor Palang', desc: 'Mesin MX-50', icon: '⚡', badge: 'bg-orange-100 text-orange-800' }
          ].map(cam => {
            const isActive = cameraPreset === cam.id;
            return (
              <button
                key={cam.id}
                onClick={() => setCameraPreset(cam.id as CameraPreset)}
                className={`py-2 px-2.5 text-left border rounded-2xl transition-all flex flex-col gap-0.5 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border-pink-400 text-pink-950 shadow-xs ring-2 ring-pink-200'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-pink-50/50 hover:border-pink-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black flex items-center gap-1.5 truncate">
                    <span>{cam.icon}</span>
                    <span className="truncate">{cam.label}</span>
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />}
                </div>
                <span className="text-[9px] text-slate-400 truncate pl-5 font-semibold">
                  {cam.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Suasana Hari (Siang, Senja, Malam) */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">
            Suasana Pencahayaan:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'day', label: 'Siang Cerah', icon: Sun, color: 'text-amber-500', activeBg: 'from-amber-400 to-orange-400' },
              { id: 'sunset', label: 'Senja Manis', icon: Sunset, color: 'text-rose-500', activeBg: 'from-rose-400 to-purple-500' },
              { id: 'night', label: 'Malam Cozy', icon: Moon, color: 'text-indigo-400', activeBg: 'from-indigo-500 to-purple-700' }
            ].map(env => {
              const Icon = env.icon;
              const isActive = environmentMode === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => setEnvironmentMode(env.id as EnvironmentSetting)}
                  className={`py-2 text-[11px] font-extrabold rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    isActive
                      ? `bg-gradient-to-r ${env.activeBg} text-white border-transparent shadow-xs font-black`
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50/60 hover:border-amber-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : env.color}`} />
                  <span className="text-[10px]">{env.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. KONFIGURASI SISTEM & SAFETY (Cute Settings) */}
      <div className="border border-slate-200/90 bg-white/95 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 text-xs">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-white text-base shadow-xs">
            ⚙️
          </span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Konfigurasi Sistem
            </h2>
            <p className="text-[10px] text-emerald-600 font-semibold">Motor & Safety Lock</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-600 py-1">
          <span className="font-bold text-[11px]">Kecepatan Palang:</span>
          <select
            value={config.gateSpeedSec}
            onChange={e => setConfig(prev => ({ ...prev, gateSpeedSec: parseFloat(e.target.value) }))}
            className="bg-purple-50/70 border border-purple-200 text-purple-900 text-[11px] font-extrabold px-3 py-1 rounded-xl outline-none hover:border-pink-400 cursor-pointer shadow-2xs"
          >
            <option value={0.8}>⚡ 0.8s (Cepat Banget)</option>
            <option value={1.5}>🚗 1.5s (Standar Nyaman)</option>
            <option value={3.0}>🍃 3.0s (Santai / Halus)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-slate-600 py-1 border-t border-slate-100">
          <span className="font-bold text-[11px]">Safety Anti-Crush:</span>
          <button
            onClick={() => setConfig(prev => ({ ...prev, safetyAntiCrushEnabled: !prev.safetyAntiCrushEnabled }))}
            className={`px-3.5 py-1 text-[11px] font-black rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              config.safetyAntiCrushEnabled
                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {config.safetyAntiCrushEnabled ? 'AKTIF 🛡️ (Aman)' : 'NONAKTIF ⚠️'}
          </button>
        </div>

        {onOpenArduinoModal && (
          <button
            onClick={onOpenArduinoModal}
            className="mt-1 w-full py-2.5 bg-gradient-to-r from-sky-50 via-purple-50 to-pink-50 hover:from-sky-100 hover:to-pink-100 border border-purple-200 text-purple-800 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-97"
          >
            <FileCode className="w-4 h-4 text-purple-600" />
            <span>Lihat Firmware Arduino C++ (.ino)</span>
          </button>
        )}
      </div>
    </div>
  );
};

