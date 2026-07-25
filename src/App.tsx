import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
import { HeaderNav } from './components/HeaderNav';
import { Barrier3DCanvas } from './components/Barrier3DCanvas';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryLog } from './components/TelemetryLog';
import { LoopDetectorInfoModal } from './components/LoopDetectorInfoModal';
import { ArduinoCodeModal } from './components/ArduinoCodeModal';

// Sample RFID Cards
const INITIAL_RFID_CARDS: RfidCard[] = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    cardNo: '8829-3011',
    type: 'Member VIP',
    balance: 150000,
    valid: true,
    color: '#1e3a8a'
  },
  {
    id: 'c2',
    name: 'Siti Rahma',
    cardNo: '5512-8801',
    type: 'E-Money',
    balance: 50000,
    valid: true,
    color: '#047857'
  },
  {
    id: 'c3',
    name: 'Joko Widodo',
    cardNo: '1092-3321',
    type: 'Flazz',
    balance: 2000, // Insufficient for Rp 5.000 fee
    valid: false,
    color: '#b91c1c'
  },
  {
    id: 'c4',
    name: 'Pengunjung Bebas',
    cardNo: '9900-0000',
    type: 'Kartu Kadaluarsa',
    balance: 0,
    valid: false,
    color: '#475569'
  }
];

export default function App() {
  // State variables
  const [vehicleZPos, setVehicleZPos] = useState<number>(-16.0);
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
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
    statusText = 'MOTOR: Membuka Palang...';
    statusColor = 'text-amber-400 animate-pulse';
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
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        systemStateLabel={statusText}
        systemStateColor={statusColor}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenArduinoModal={() => setIsArduinoModalOpen(true)}
      />

      {/* Main Grid Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left / Top: 3D Babylon Viewport (8 Columns on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-[400px] lg:min-h-0">
          <div className="flex-1 relative">
            <Barrier3DCanvas
              vehicleZPos={vehicleZPos}
              vehicleType={vehicleType}
              gateState={gateState}
              gateAngle={gateAngle}
              cameraPreset={cameraPreset}
              environmentMode={environmentMode}
              loop1Active={loop1Active}
              loop2Active={loop2Active}
              rfidDisplayText={rfidDisplay}
              isTappingCard={isTappingCard}
              onSceneReady={() => {}}
            />
          </div>

          {/* Bottom Telemetry Log Panel (Height-constrained) */}
          <div className="h-44 shrink-0">
            <TelemetryLog
              events={telemetryEvents}
              onClearLogs={() => setTelemetryEvents([])}
              loop1Active={loop1Active}
              loop2Active={loop2Active}
            />
          </div>
        </div>

        {/* Right: Interactive Control Deck (4 Columns on desktop) */}
        <div className="lg:col-span-4 h-full overflow-hidden">
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

      {/* Educational & Firmware Modals */}
      <LoopDetectorInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <ArduinoCodeModal isOpen={isArduinoModalOpen} onClose={() => setIsArduinoModalOpen(false)} />

      {/* Geometric Balance Footer Bar */}
      <footer className="h-10 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-6 text-[10px] tracking-widest text-slate-500 uppercase font-mono shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Network: Stable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Database: Connected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Sensor Node: 04-A
          </span>
        </div>
        <div>Terminal ID: BJM-S122-PRO</div>
      </footer>
    </div>
  );
}
