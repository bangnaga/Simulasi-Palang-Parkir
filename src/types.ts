export type GateState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING' | 'MANUAL_HOLD' | 'SAFETY_BLOCK';

export type SimulationMode = 'MANUAL' | 'AUTO_DEMO' | 'STEP_BY_STEP';

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'van' | 'motorbike';

export interface RfidCard {
  id: string;
  name: string;
  cardNo: string;
  type: 'Member VIP' | 'E-Money' | 'Flazz' | 'Brizzi' | 'Kartu Khusus' | 'Kartu Kadaluarsa';
  balance: number;
  valid: boolean;
  color: string;
  avatarIcon?: string;
}

export interface LoopDetectorStatus {
  loop1Presence: boolean; // Loop 1: Pre-barrier vehicle detection
  loop2SafetyPassage: boolean; // Loop 2: Under/post-barrier vehicle passage & safety
  frequencyShift1: number; // Simulated frequency delta (Hz)
  frequencyShift2: number;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  source: 'LOOP_1' | 'LOOP_2' | 'RFID_READER' | 'GATE_MOTOR' | 'SYSTEM' | 'VEHICLE';
  message: string;
  details?: string;
}

export type CameraPreset =
  | 'orbit'
  | 'driver'
  | 'cockpit'
  | 'scanner'
  | 'alpr'
  | 'cctv'
  | 'cinematic'
  | 'wheel'
  | 'top'
  | 'gate';

export type EnvironmentSetting = 'day' | 'sunset' | 'night';

export type RenderQuality = 'high_fps' | 'balanced' | 'ultra';

export interface SystemConfig {
  gateSpeedSec: number; // 0.8s to 3.0s
  autoCloseDelaySec: number; // Delay after loop 2 cleared
  parkingFee: number; // e.g. Rp 5.000
  soundEnabled: boolean;
  safetyAntiCrushEnabled: boolean;
  alprEnabled: boolean; // Automatic License Plate Recognition
}
