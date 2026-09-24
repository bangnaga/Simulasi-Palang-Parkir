import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { X, SlidersHorizontal, Play, RotateCcw } from 'lucide-react';
import {
  CameraPreset,
  EnvironmentSetting,
  GateState,
  RfidCard,
  SystemConfig,
  TelemetryEvent,
  VehicleType
} from './types';
import { soundManager } from './lib/audio';
// App.tsx
import { HeaderNav } from './components/HeaderNav';
import { Barrier3DCanvas } from './components/Barrier3DCanvas';
import { ControlPanel } from './components/ControlPanel';
import { LoopDetectorInfoModal } from './components/LoopDetectorInfoModal';
import { ArduinoCodeModal } from './components/ArduinoCodeModal';

// Sample Cheerful RFID Cards
const INITIAL_RFID_CARDS: RfidCard[] = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    cardNo: '8829-3011',
    type: 'Member VIP',
    balance: 150000,
    valid: true,
    color: '#8b5cf6',
    avatarIcon: '👑'
  },
  {
    id: 'c2',
    name: 'Siti Rahma',
    cardNo: '5512-8801',
    type: 'E-Money',
    balance: 75000,
    valid: true,
    color: '#06b6d4',
    avatarIcon: '🌱'
  },
  {
    id: 'c3',
    name: 'Citra Kirana',
    cardNo: '1092-3321',
    type: 'Flazz',
    balance: 50000,
    valid: true,
    color: '#ec4899',
    avatarIcon: '🌸'
  },
  {
    id: 'c4',
    name: 'Doni Pratama',
    cardNo: '4421-9988',
    type: 'Brizzi',
    balance: 25000,
    valid: true,
    color: '#f59e0b',
    avatarIcon: '☀️'
  },
  {
    id: 'c5',
    name: 'Tamu Tanpa Izin',
    cardNo: '9900-0000',
    type: 'Kartu Kadaluarsa',
    balance: 1500,
    valid: false,
    color: '#f43f5e',
    avatarIcon: '⛔'
  }
];

export default function App() {
  // State variables
  const [vehicleZPos, setVehicleZPos] = useState<number>(-16.0);
  const [vehicleType, setVehicleType] = useState<VehicleType>('suv');
  const [rfidCards, setRfidCards] = useState<RfidCard[]>(INITIAL_RFID_CARDS);
  const [selectedCard, setSelectedCard] = useState<RfidCard>(INITIAL_RFID_CARDS[0]);

  // Gate & Sensor States
  const [gateState, setGateState] = useState<GateState>('CLOSED');
  const [gateAngle, setGateAngle] = useState<number>(0);
  const gateAngleRef = useRef<number>(0);

  // Sync gateAngleRef
  useEffect(() => {
    gateAngleRef.current = gateAngle;
  }, [gateAngle]); // 0deg (closed) to 90deg (open)
  const [loop1Active, setLoop1Active] = useState<boolean>(false);
  const [loop2Active, setLoop2Active] = useState<boolean>(false);

  // RFID Reader Display state
  const [rfidDisplay, setRfidDisplay] = useState<{
    text: string;
    subtext: string;
    status: 'idle' | 'success' | 'error';
  }>({
    text: 'TEMPELKAN KARTU',
    subtext: 'Menunggu RFID...',
    status: 'idle'
  });

  const [isTappingCard, setIsTappingCard] = useState<boolean>(false);

  // System Settings
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [environmentMode, setEnvironmentMode] = useState<EnvironmentSetting>('day');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isArduinoModalOpen, setIsArduinoModalOpen] = useState<boolean>(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<SystemConfig>({
    gateSpeedSec: 1.5,
    autoCloseDelaySec: 0.8,
    parkingFee: 5000,
    soundEnabled: true,
    safetyAntiCrushEnabled: true,
    alprEnabled: true
  });

  // Telemetry Audit Events
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);

  // Refs for loop detection logic
  const prevLoop1Ref = useRef<boolean>(false);
  const prevLoop2Ref = useRef<boolean>(false);
  const isAccessGrantedRef = useRef<boolean>(false);
  const autoSimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add event helper
  const addTelemetryEvent = useCallback(
    (
      level: 'info' | 'success' | 'warning' | 'error',
      source: 'LOOP_1' | 'LOOP_2' | 'RFID_READER' | 'GATE_MOTOR' | 'SYSTEM' | 'VEHICLE',
      message: string,
      details?: string
    ) => {
      const newEv: TelemetryEvent = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        level,
        source,
        message,
        details
      };
      setTelemetryEvents(prev => [newEv, ...prev].slice(0, 50));
    },
    []
  );

  // Sound sync
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // Sound effect initialization on initial log
  useEffect(() => {
    addTelemetryEvent(
      'info',
      'SYSTEM',
      'Inisialisasi Sistem Barrier Gate Parkir RFID & Loop Detector Induksi berhasil.',
      'Sistem standby menunggu kedatangan kendaraan di Loop 1.'
    );
  }, [addTelemetryEvent]);

  // Vehicle Engine Sound & Entry/Exit Chime Effect on Z Position change
  const prevVehicleZRef = useRef<number>(vehicleZPos);
  const engineStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredEntryChimeRef = useRef<boolean>(false);
  const hasTriggeredExitChimeRef = useRef<boolean>(false);

  useEffect(() => {
    const delta = Math.abs(vehicleZPos - prevVehicleZRef.current);
    if (delta > 0.01) {
      soundManager.startEngineSound();
      soundManager.updateEnginePitch(delta * 15);

      if (engineStopTimerRef.current) clearTimeout(engineStopTimerRef.current);
      engineStopTimerRef.current = setTimeout(() => {
        soundManager.stopEngineSound();
      }, 400);
    }
    prevVehicleZRef.current = vehicleZPos;

    // Entry chime when vehicle enters parking area (crossing gate Z=0 with open gate)
    if (vehicleZPos >= 0.5 && vehicleZPos <= 2.0 && gateAngle > 50 && !hasTriggeredEntryChimeRef.current) {
      hasTriggeredEntryChimeRef.current = true;
      hasTriggeredExitChimeRef.current = false;
      soundManager.playEntryExitChime(true);
      addTelemetryEvent('success', 'VEHICLE', 'Kendaraan berhasil masuk area parkir.');
    }

    // Exit chime when vehicle exits parking area (crossing Z >= 10)
    if (vehicleZPos >= 10.0 && !hasTriggeredExitChimeRef.current) {
      hasTriggeredExitChimeRef.current = true;
      hasTriggeredEntryChimeRef.current = false;
      soundManager.playEntryExitChime(false);
      addTelemetryEvent('success', 'VEHICLE', 'Kendaraan berhasil keluar area parkir.');
    }

    // Reset chimes when reset far back
    if (vehicleZPos <= -10) {
      hasTriggeredEntryChimeRef.current = false;
      hasTriggeredExitChimeRef.current = false;
    }
  }, [vehicleZPos, gateAngle, addTelemetryEvent]);

  // --------------------------------------------------------------------------
  // SENSOR THRESHOLD LOGIC (Position Z listener)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Loop Detector 1 Zone: Z between -6.8m and -1.2m (Covers approach & scanner post)
    const inLoop1 = vehicleZPos >= -6.8 && vehicleZPos <= -1.2;

    // Loop Detector 2 Zone: Z between 0.8m and 4.2m
    const inLoop2 = vehicleZPos >= 0.8 && vehicleZPos <= 4.2;

    // Update Loop 1
    if (inLoop1 !== prevLoop1Ref.current) {
      prevLoop1Ref.current = inLoop1;
      setLoop1Active(inLoop1);

      if (inLoop1) {
        soundManager.playLoopDetectorClick(true);
        addTelemetryEvent(
          'info',
          'LOOP_1',
          'MOBIL TERDETEKSI pada Loop Detector 1 (Presensi)',
          'Perubahan frekuensi induksi: 50.0 kHz → 47.6 kHz (-2.4 kHz)'
        );

        if (!isAccessGrantedRef.current) {
          setRfidDisplay({
            text: 'SIAP - TEMPEL KARTU',
            subtext: 'Silakan Tempel Kartu RFID',
            status: 'idle'
          });
        }
      } else {
        soundManager.playLoopDetectorClick(false);
        addTelemetryEvent('info', 'LOOP_1', 'Kendaraan meninggalkan area Loop Detector 1');
      }
    }

    // Update Loop 2
    if (inLoop2 !== prevLoop2Ref.current) {
      prevLoop2Ref.current = inLoop2;
      setLoop2Active(inLoop2);

      if (inLoop2) {
        soundManager.playLoopDetectorClick(true);
        addTelemetryEvent(
          'warning',
          'LOOP_2',
          'MOBIL MELINTAS pada Loop Detector 2 (Safety/Passage)',
          'Lengan palang terkunci rapat! Mencegah benturan/anti-crush.'
        );

        // Safety anti-crush: If gate was attempting to close while car is under Loop 2
        if (gateState === 'CLOSING' && config.safetyAntiCrushEnabled) {
          soundManager.playWarningAlarm();
          setGateState('SAFETY_BLOCK');
          addTelemetryEvent(
            'error',
            'GATE_MOTOR',
            'PERINGATAN SAFETY LOCK! Kendaraan terdeteksi di bawah palang. Palang BUKA kembali!',
            'Anti-crush safety protection triggered.'
          );
          // Re-open
          setGateState('OPENING');
        }
      } else {
        soundManager.playLoopDetectorClick(false);
        addTelemetryEvent('info', 'LOOP_2', 'Kendaraan telah selesai melintasi Loop Detector 2');

        // Vehicle cleared Loop 2 and is heading past Z > 4.5 -> Auto Close Gate!
        if (vehicleZPos > 4.2 && (gateState === 'OPEN' || gateState === 'OPENING')) {
          addTelemetryEvent(
            'info',
            'SYSTEM',
            'Memulai siklus penutupan otomatis palang gate...',
            `Delay otomatis: ${config.autoCloseDelaySec}s`
          );

          setTimeout(() => {
            soundManager.startMotorSound(config.gateSpeedSec);
            setGateState('CLOSING');
            isAccessGrantedRef.current = false;
          }, config.autoCloseDelaySec * 1000);
        }
      }
    }

    // Strict barrier gate collision check: Car cannot pass Z = -1.2 if barrier gate is not open (gateAngle < 70)
    if (vehicleZPos > -1.2 && vehicleZPos <= 1.5 && gateAngle < 70) {
      setVehicleZPos(-1.2);
      addTelemetryEvent(
        'warning',
        'BARRIER',
        'AKSES TERTAHAN! Mobil tidak dapat melintas karena barrier gate belum terbuka.',
        `Sudut palang saat ini: ${gateAngle.toFixed(0)}°. Silakan tempelkan kartu RFID valid atau buka palang terlebih dahulu.`
      );
    }
  }, [vehicleZPos, gateAngle, gateState, config, addTelemetryEvent]);

  // --------------------------------------------------------------------------
  // GATE MOTOR ANIMATION LOOP (Smooth angle rotation 0 -> 90)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animFrame: number;

    const updateGateAngle = () => {
      const step = 90 / (config.gateSpeedSec * 60);

      if (gateState === 'OPENING') {
        setGateAngle(prev => {
          const next = prev + step;
          if (next >= 90) {
            setGateState('OPEN');
            return 90;
          }
          return next;
        });
      } else if (gateState === 'CLOSING') {
        setGateAngle(prev => {
          const next = prev - step;
          if (next <= 0) {
            setGateState('CLOSED');
            setRfidDisplay({
              text: 'TEMPELKAN KARTU',
              subtext: 'Menunggu RFID...',
              status: 'idle'
            });
            return 0;
          }
          return next;
        });
      }

      animFrame = requestAnimationFrame(updateGateAngle);
    };

    animFrame = requestAnimationFrame(updateGateAngle);
    return () => cancelAnimationFrame(animFrame);
  }, [gateState, config.gateSpeedSec]);

  // --------------------------------------------------------------------------
  // TAP RFID CARD ACTION
  // --------------------------------------------------------------------------
  const handleTapRfidCard = () => {
    setIsTappingCard(true);
    setTimeout(() => setIsTappingCard(false), 1200);

    // If car is far back, auto advance to Loop 1 (-2.5m)
    let isPresent = loop1Active;
    if (vehicleZPos < -6.8) {
      setVehicleZPos(-2.5);
      setLoop1Active(true);
      isPresent = true;
    }

    // Check if vehicle is present at Loop 1
    if (!isPresent && !isSimulating) {
      soundManager.playRfidBeep(false);
      setRfidDisplay({
        text: 'TIDAK ADA MOBIL',
        subtext: 'Posisikan Mobil di Loop 1',
        status: 'error'
      });
      addTelemetryEvent(
        'error',
        'RFID_READER',
        'Penempelan Kartu DITOLAK! Tidak ada kendaraan terdeteksi pada Loop Detector 1.',
        'Sistem keamanan mencegah pemrosesan transaksi tanpa keberadaan fisik mobil.'
      );
      return;
    }

    // Process RFID Card
    if (selectedCard.valid && selectedCard.balance >= config.parkingFee) {
      // Deduct balance
      const newBalance = selectedCard.balance - config.parkingFee;
      setRfidCards(prev =>
        prev.map(c => (c.id === selectedCard.id ? { ...c, balance: newBalance } : c))
      );
      setSelectedCard(prev => ({ ...prev, balance: newBalance }));

      soundManager.playRfidBeep(true);
      setRfidDisplay({
        text: 'AKSES DISETUJUI',
        subtext: `Sisa Saldo: Rp ${newBalance.toLocaleString('id-ID')}`,
        status: 'success'
      });

      isAccessGrantedRef.current = true;
      soundManager.startMotorSound(config.gateSpeedSec);
      setGateState('OPENING');

      addTelemetryEvent(
        'success',
        'RFID_READER',
        `AKSES DITERIMA! Transaksi Berhasil: ${selectedCard.type} (${selectedCard.cardNo})`,
        `Biaya: Rp ${config.parkingFee.toLocaleString('id-ID')} | Sisa Saldo: Rp ${newBalance.toLocaleString('id-ID')}`
      );

      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    } else {
      soundManager.playRfidBeep(false);
      setRfidDisplay({
        text: 'AKSES DITOLAK',
        subtext: selectedCard.balance < config.parkingFee ? 'Saldo Tidak Cukup!' : 'Kartu Kadaluarsa',
        status: 'error'
      });

      addTelemetryEvent(
        'error',
        'RFID_READER',
        `AKSES DITOLAK! ${selectedCard.type} (${selectedCard.cardNo})`,
        selectedCard.balance < config.parkingFee ? 'Saldo kurang dari biaya parkir' : 'Kartu tidak terdaftar'
      );
    }
  };

  // --------------------------------------------------------------------------
  // EMERGENCY MANUAL TOGGLE GATE
  // --------------------------------------------------------------------------
  const handleEmergencyToggleGate = () => {
    if (gateAngle > 0) {
      soundManager.startMotorSound(config.gateSpeedSec);
      setGateState('CLOSING');
      addTelemetryEvent('warning', 'SYSTEM', 'Manual Override: Perintah Penutupan Palang Darurat.');
    } else {
      soundManager.startMotorSound(config.gateSpeedSec);
      setGateState('OPENING');
      addTelemetryEvent('warning', 'SYSTEM', 'Manual Override: Perintah Pembukaan Palang Darurat (Emergency Open).');
    }
  };

  // --------------------------------------------------------------------------
  // ONE-CLICK AUTOMATIC END-TO-END DEMO SIMULATION
  // --------------------------------------------------------------------------
  const startAutoSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    // Reset positions
    setVehicleZPos(-16.0);
    setGateState('CLOSED');
    setGateAngle(0);
    isAccessGrantedRef.current = false;

    addTelemetryEvent(
      'info',
      'SYSTEM',
      '=== MEMULAI DEMO SIMULASI OTOMATIS END-TO-END ===',
      'Langkah 1: Mobil bergerak dari Z = -16m menuju Loop Detector 1'
    );

    let z = -16.0;

    const driveToLoop1 = setInterval(() => {
      z += 0.4;
      setVehicleZPos(z);

      if (z >= -6.0) {
        clearInterval(driveToLoop1);

        // Step 2: Vehicle arrives over Loop 1
        setTimeout(() => {
          setCameraPreset('scanner');
          addTelemetryEvent(
            'info',
            'SYSTEM',
            'Langkah 2: Mobil berhenti tepat di atas Loop 1 (-6m). Kamera beralih ke RFID Reader.'
          );

          // Step 3: Tap RFID Card
          setTimeout(() => {
            handleTapRfidCard();

            // Step 4: Drive past barrier through Loop 2
            setTimeout(() => {
              setCameraPreset('driver');
              addTelemetryEvent(
                'info',
                'SYSTEM',
                'Langkah 3: Palang terbuka total (90°). Mobil mulai maju melintasi Loop 2 (+2.5m).'
              );

              let zPassing = -6.0;
              const driveThrough = setInterval(() => {
                // Safety Barrier Check: If approaching gate position (-1.2m), do NOT cross if gate is not open (gateAngleRef < 70)
                if (zPassing + 0.35 >= -1.2 && zPassing < 0.2) {
                  if (gateAngleRef.current < 70) {
                    zPassing = -1.2;
                    setVehicleZPos(-1.2);
                    return; // Wait at barrier until gate opens!
                  }
                }

                zPassing += 0.35;
                setVehicleZPos(zPassing);

                if (zPassing >= 12.0) {
                  clearInterval(driveThrough);
                  setIsSimulating(false);
                  setCameraPreset('orbit');

                  addTelemetryEvent(
                    'success',
                    'SYSTEM',
                    '=== SIMULASI OTOMATIS SELESAI ===',
                    'Mobil berhasil keluar parkir. Palang pintu telah tertutup dan terkunci kembali.'
                  );
                }
              }, 60);
            }, 2000);
          }, 1500);
        }, 1000);
      }
    }, 50);
  };

  // Reset Simulation
  const handleResetSimulation = () => {
    if (autoSimTimeoutRef.current) clearTimeout(autoSimTimeoutRef.current);
    setIsSimulating(false);
    setVehicleZPos(-16.0);
    setGateState('CLOSED');
    setGateAngle(0);
    setCameraPreset('orbit');
    isAccessGrantedRef.current = false;
    setRfidDisplay({
      text: 'TEMPELKAN KARTU',
      subtext: 'Menunggu RFID...',
      status: 'idle'
    });
    addTelemetryEvent('info', 'SYSTEM', 'Simulasi direset ke kondisi awal.');
  };

  // Status Badge styling helper
  let statusText = 'STANDBY (Jalan Kosong)';
  let statusColor = 'text-slate-400';

  if (loop1Active && gateState === 'CLOSED') {
    statusText = 'PRESENSI: Mobil di Loop 1 (Menunggu RFID)';
    statusColor = 'text-cyan-400';
  } else if (gateState === 'OPENING') {
    statusText = 'MOTOR: Membuka Palang... (Lampu Hijau)';
    statusColor = 'text-emerald-400 animate-pulse font-bold';
  } else if (gateState === 'OPEN' && !loop2Active) {
    statusText = 'AKSES DIBUKA: Silakan Melintas';
    statusColor = 'text-emerald-400 font-bold';
  } else if (loop2Active) {
    statusText = 'SAFETY LOCK: Mobil Melintasi Loop 2';
    statusColor = 'text-amber-400 font-bold animate-pulse';
  } else if (gateState === 'CLOSING') {
    statusText = 'MOTOR: Menutup Palang Otomatis...';
    statusColor = 'text-rose-400 animate-pulse';
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-pink-50/90 via-purple-50/40 via-sky-50/50 to-pink-50/80 text-slate-800 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        systemStateLabel={statusText}
        systemStateColor={statusColor}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenArduinoModal={() => setIsArduinoModalOpen(true)}
      />

      {/* Main Workspace (Edge-to-Edge on mobile, beautiful side-by-side grid on desktop) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-0 lg:p-3.5 gap-0 lg:gap-3.5 overflow-hidden relative">
        {/* Spacious 3D Babylon Viewport - Full bleed on mobile! */}
        <div className="lg:col-span-8 h-full w-full min-h-0 relative rounded-none lg:rounded-3xl overflow-hidden border-0 lg:border border-pink-200/80 bg-white shadow-none lg:shadow-sm flex flex-col">
          <Barrier3DCanvas
            vehicleZPos={vehicleZPos}
            vehicleType={vehicleType}
            gateState={gateState}
            gateAngle={gateAngle}
            cameraPreset={cameraPreset}
            setCameraPreset={setCameraPreset}
            environmentMode={environmentMode}
            loop1Active={loop1Active}
            loop2Active={loop2Active}
            rfidDisplayText={rfidDisplay}
            isTappingCard={isTappingCard}
            onSceneReady={() => {}}
          />

          {/* Minimalist Floating Action Dock for Mobile (< lg) */}
          <div className="lg:hidden absolute bottom-3 left-2.5 right-2.5 flex flex-col gap-1.5 pointer-events-none z-30">
            {/* Quick Vehicle Distance Scrub Bar */}
            <div className="flex items-center justify-between bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-pink-200/80 shadow-md pointer-events-auto">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVehicleZPos(Math.max(-15, Math.round((vehicleZPos - 1.5) * 10) / 10))}
                  className="w-7 h-7 rounded-xl bg-pink-100 hover:bg-pink-200 active:scale-90 text-pink-700 font-black text-xs flex items-center justify-center cursor-pointer transition-all"
                  title="Mundur 1.5m"
                >
                  ◀
                </button>
                <button
                  onClick={() => setVehicleZPos(Math.min(15, Math.round((vehicleZPos + 1.5) * 10) / 10))}
                  className="w-7 h-7 rounded-xl bg-pink-100 hover:bg-pink-200 active:scale-90 text-pink-700 font-black text-xs flex items-center justify-center cursor-pointer transition-all"
                  title="Maju 1.5m"
                >
                  ▶
                </button>
              </div>

              <div className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                <span>Pos:</span>
                <span className="text-purple-700 font-mono">
                  {vehicleZPos >= -0.5 && vehicleZPos <= 0.5 ? 'Di Palang' : `${vehicleZPos.toFixed(1)}m`}
                </span>
                <span className="text-slate-400 text-[10px] font-semibold">
                  ({loop1Active ? 'L1 🚙' : loop2Active ? 'L2 ✨' : 'Jalan'})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetSimulation}
                  className="text-[10px] font-black text-slate-500 hover:text-pink-600 px-2.5 py-1 bg-slate-100/90 rounded-lg cursor-pointer active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Core Action Buttons Dock */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleTapRfidCard}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white text-xs font-black rounded-2xl shadow-lg shadow-pink-300/40 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>💳 Tap {selectedCard.type}</span>
              </button>

              <button
                onClick={startAutoSimulation}
                disabled={isSimulating}
                className={`py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-200/50 active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                  isSimulating ? 'opacity-60' : ''
                }`}
                title="Simulasi Mobil Lewat Otomatis"
              >
                <span>{isSimulating ? 'Melintas...' : '✨ Auto Demo'}</span>
              </button>

              <button
                onClick={() => setIsMobileSheetOpen(true)}
                className="py-2.5 px-3 bg-white/95 backdrop-blur-md border border-purple-200 text-purple-700 text-xs font-black rounded-2xl shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer hover:bg-purple-50"
                title="Buka Pengaturan Lengkap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Opsi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Interactive Control Deck (Desktop only, 4 Columns) */}
        <div className="hidden lg:block lg:col-span-4 h-full overflow-hidden">
          <ControlPanel
            vehicleZPos={vehicleZPos}
            setVehicleZPos={setVehicleZPos}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            rfidCards={rfidCards}
            gateState={gateState}
            gateAngle={gateAngle}
            trafficLightMode={trafficLightMode}
            setTrafficLightMode={setTrafficLightMode}
            cameraPreset={cameraPreset}
            setCameraPreset={setCameraPreset}
            environmentMode={environmentMode}
            setEnvironmentMode={setEnvironmentMode}
            config={config}
            setConfig={setConfig}
            isSimulating={isSimulating}
            onStartAutoSimulation={startAutoSimulation}
            onResetSimulation={handleResetSimulation}
            onTapRfidCard={handleTapRfidCard}
            onEmergencyToggleGate={handleEmergencyToggleGate}
            onOpenLoopInfoModal={() => setIsInfoModalOpen(true)}
            onOpenArduinoModal={() => setIsArduinoModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Slide-Up Bottom Sheet for Detailed Settings, Vehicle & Card Selector */}
      {isMobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs">
          {/* Backdrop Click */}
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileSheetOpen(false)}
          />

          {/* Sheet Modal Container */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden border-t border-pink-200 z-10">
            {/* Sheet Header */}
            <div className="pt-2.5 pb-2 px-4 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/80 to-purple-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs">
                  🎛️
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 leading-tight">Pengaturan & Kartu RFID</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">Pilih kendaraan, ganti kartu, dan opsi palang</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSheetOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold active:scale-90 cursor-pointer"
                title="Tutup Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Control Panel inside Bottom Sheet */}
            <div className="flex-1 overflow-y-auto p-2">
              <ControlPanel
                vehicleZPos={vehicleZPos}
                setVehicleZPos={setVehicleZPos}
                vehicleType={vehicleType}
                setVehicleType={setVehicleType}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                rfidCards={rfidCards}
                gateState={gateState}
                gateAngle={gateAngle}
                trafficLightMode={trafficLightMode}
                setTrafficLightMode={setTrafficLightMode}
                cameraPreset={cameraPreset}
                setCameraPreset={setCameraPreset}
                environmentMode={environmentMode}
                setEnvironmentMode={setEnvironmentMode}
                config={config}
                setConfig={setConfig}
                isSimulating={isSimulating}
                onStartAutoSimulation={() => {
                  startAutoSimulation();
                  setIsMobileSheetOpen(false);
                }}
                onResetSimulation={handleResetSimulation}
                onTapRfidCard={() => {
                  handleTapRfidCard();
                  setIsMobileSheetOpen(false);
                }}
                onEmergencyToggleGate={handleEmergencyToggleGate}
                onOpenLoopInfoModal={() => setIsInfoModalOpen(true)}
                onOpenArduinoModal={() => setIsArduinoModalOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Educational & Firmware Modals */}
      <LoopDetectorInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <ArduinoCodeModal isOpen={isArduinoModalOpen} onClose={() => setIsArduinoModalOpen(false)} />

      {/* Cute Colorful Footer Bar - Hidden on mobile for maximum 3D view */}
      <footer className="hidden lg:flex h-8 sm:h-9 border-t border-pink-150 bg-white/95 backdrop-blur-md items-center justify-between px-3 sm:px-6 text-[10px] sm:text-[11px] font-bold text-slate-600 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-6">
          <span className="flex items-center gap-1 text-pink-600">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            <span>🌸 Siaga</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Dual Loop Ready</span>
          </span>
          <span className="flex items-center gap-1 text-purple-600">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>💳 13.56 MHz RFID</span>
          </span>
          <span className="flex items-center gap-1 text-sky-600">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>🚙 Honda HR-V 3D</span>
          </span>
        </div>
        <div className="text-slate-400 font-bold text-[9px] sm:text-[10px] flex items-center gap-1">
          <span className="text-pink-500">💖</span>
          <span>SmartGate 3D Cute & Ceria</span>
        </div>
      </footer>
    </div>
  );
}
