import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Terminal, FileCode, Layers, ShieldCheck, Zap } from 'lucide-react';

interface ArduinoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArduinoCodeModal: React.FC<ArduinoCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'wiring' | 'flow'>('code');

  if (!isOpen) return null;

  const arduinoCode = `/*
 * ==============================================================================
 * SMARTGATE PRO v2.4.0 - FIRMWARE AUTOMATION BARRIER GATE PARKIR RFID
 * ==============================================================================
 * Komponen Hardware & Pinout Setup:
 * ------------------------------------------------------------------------------
 * 1. Mikrokontroler   : Arduino Uno / Nano / ESP32 (Default Pinout: Arduino Uno)
 * 2. RFID Reader      : MFRC522 (13.56 MHz SPI)
 *    - SDA (SS)       : Pin D10
 *    - SCK            : Pin D13
 *    - MOSI           : Pin D11
 *    - MISO           : Pin D12
 *    - RST            : Pin D9
 *    - VCC            : 3.3V (JANGAN DIBERI 5V!)
 * 3. Inductive Loop 1  : Pin A0 (Digital Input - Active LOW dari Relai Modul Loop 1 / Presence)
 * 4. Inductive Loop 2  : Pin A1 (Digital Input - Active LOW dari Relai Modul Loop 2 / Safety Passage)
 * 5. Servo / Gate Motor: Pin D6 (PWM Pulse 50Hz) atau Relai Buka/Tutup Palang (D7 & D8)
 * 6. LCD Display      : LCD 16x2 I2C (SDA -> A4, SCL -> A5, Alamat I2C: 0x27 / 0x3F)
 * 7. Buzzer & LED     : Buzzer -> Pin D5, LED Hijau -> Pin D2, LED Merah -> Pin D3
 * 8. Emergency Btn    : Pin D4 (Pull-Up Internal Override Penjaga)
 * ==============================================================================
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

// ------------------------------------------------------------------------------
// HARDWARE PIN DEFINITIONS
// ------------------------------------------------------------------------------
#define RFID_SS_PIN        10
#define RFID_RST_PIN       9
#define LOOP1_PRESENCE_PIN A0   // Sensor Deteksi Keberadaan Mobil (Sebelum Palang)
#define LOOP2_SAFETY_PIN   A1   // Sensor Deteksi Safety & Menutup Otomatis (Dibawah Palang)
#define SERVO_GATE_PIN     6    // Pin PWM Kontrol Servo Palang (0 deg = Tutup, 90 deg = Buka)
#define BUZZER_PIN         5    // Indicator Audio Beep
#define LED_GREEN_PIN      2    // Akses Diterima
#define LED_RED_PIN        3    // Akses Ditolak / Standby
#define EMERGENCY_BTN_PIN  4    // Tombol Override Darurat Pos Penjaga

// ------------------------------------------------------------------------------
// INSTANCE & OBJECT INITIALIZATION
// ------------------------------------------------------------------------------
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // Alamat I2C umum: 0x27. Jika tidak tampil, coba 0x3F
Servo gateServo;

// ------------------------------------------------------------------------------
// SYSTEM CONSTANTS & STATE MACHINE DEFINITIONS
// ------------------------------------------------------------------------------
enum GateState {
  STATE_STANDBY,          // Tidak ada mobil di Loop 1
  STATE_VEHICLE_WAITING,  // Mobil ada di Loop 1, Menunggu Tap RFID
  STATE_VERIFYING_CARD,   // Membaca UID Kartu
  STATE_GATE_OPEN,        // Palang terbuka, Mobil bersiap lewat
  STATE_VEHICLE_PASSING,  // Mobil sedang di Loop 2 (Safety Lock Active!)
  STATE_GATE_CLOSING,     // Mobil telah lewat, Palang menutup otomatis
  STATE_EMERGENCY_MODE    // Override Manual oleh Penjaga
};

GateState currentState = STATE_STANDBY;

// Daftar RFID UID Terdaftar (Whitelist Member)
const String AUTHORIZED_UIDS[] = {
  "A1 B2 C3 D4",
  "F8 E7 D6 C5",
  "12 34 56 78"
};
const int NUM_AUTHORIZED_CARDS = sizeof(AUTHORIZED_UIDS) / sizeof(AUTHORIZED_UIDS[0]);

// Timer Non-blocking (millis)
unsigned long lastStateChangeMs = 0;
unsigned long gateOpenTimeoutMs = 12000; // Auto-close timeout 12 detik jika mobil batal lewat

// ------------------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------------------
void playBeep(int frequency, int durationMs) {
  tone(BUZZER_PIN, frequency, durationMs);
}

void playSuccessSound() {
  tone(BUZZER_PIN, 1500, 100);
  delay(120);
  tone(BUZZER_PIN, 2200, 200);
}

void playErrorSound() {
  tone(BUZZER_PIN, 400, 400);
}

void updateLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

bool checkRfidAuthorized(String uidStr) {
  for (int i = 0; i < NUM_AUTHORIZED_CARDS; i++) {
    if (uidStr.equalsIgnoreCase(AUTHORIZED_UIDS[i])) {
      return true;
    }
  }
  return false;
}

String getCardUIDString() {
  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.byte[i] < 0x10) uidStr += "0";
    uidStr += String(rfid.uid.byte[i], HEX);
    if (i < rfid.uid.size - 1) uidStr += " ";
  }
  uidStr.toUpperCase();
  return uidStr;
}

// ------------------------------------------------------------------------------
// SETUP FUNCTION
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  Serial.println(F("[SMARTGATE PRO] Booting System Firmware v2.4.0..."));

  // Pin Modes
  pinMode(LOOP1_PRESENCE_PIN, INPUT_PULLUP);
  pinMode(LOOP2_SAFETY_PIN, INPUT_PULLUP);
  pinMode(EMERGENCY_BTN_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);

  digitalWrite(LED_RED_PIN, HIGH);
  digitalWrite(LED_GREEN_PIN, LOW);

  // Initialize Servo Motor
  gateServo.attach(SERVO_GATE_PIN);
  gateServo.write(0); // Posisi tertutup awal (0 derajat)

  // Initialize SPI & MFRC522 RFID
  SPI.begin();
  rfid.PCD_Init();

  // Initialize LCD I2C
  lcd.init();
  lcd.backlight();
  updateLCD(" SMARTGATE PRO ", "   READY v2.4   ");
  playBeep(2000, 150);
  delay(1500);

  updateLCD("SISTEM STANDBY", "DEPAN GATE SEPI");
  Serial.println(F("[SYSTEM] Initialization Complete. Ready for vehicles."));
}

// ------------------------------------------------------------------------------
// MAIN LOOP FUNCTION
// ------------------------------------------------------------------------------
void loop() {
  // Read Digital Sensor Inputs (Active LOW jika terhubung relay loop detector)
  bool loop1VehicleDetected = (digitalRead(LOOP1_PRESENCE_PIN) == LOW);
  bool loop2VehicleDetected = (digitalRead(LOOP2_SAFETY_PIN) == LOW);
  bool emergencyButtonPressed = (digitalRead(EMERGENCY_BTN_PIN) == LOW);

  // 1. EMERGENCY OVERRIDE CHECK
  if (emergencyButtonPressed) {
    currentState = STATE_EMERGENCY_MODE;
  }

  // 2. STATE MACHINE EXECUTION
  switch (currentState) {

    // --------------------------------------------------------------------------
    // STATE 1: STANDBY - Menunggu mobil tiba di Loop 1
    // --------------------------------------------------------------------------
    case STATE_STANDBY:
      digitalWrite(LED_RED_PIN, HIGH);
      digitalWrite(LED_GREEN_PIN, LOW);
      gateServo.write(0); // Kunci palang tertutup

      if (loop1VehicleDetected) {
        currentState = STATE_VEHICLE_WAITING;
        updateLCD("MOBIL TERDETEKSI", "SILAKAN TAP RFID");
        playBeep(1800, 100);
        Serial.println(F("[LOOP 1] Vehicle arrived at presence sensor. Awaiting RFID..."));
      }
      break;

    // --------------------------------------------------------------------------
    // STATE 2: VEHICLE WAITING - Mobil di Loop 1, Siap Membaca Kartu RFID
    // --------------------------------------------------------------------------
    case STATE_VEHICLE_WAITING:
      // Mencegah Pejalan Kaki: Jika mobil meninggalkan Loop 1 tanpa tap RFID
      if (!loop1VehicleDetected) {
        currentState = STATE_STANDBY;
        updateLCD("SISTEM STANDBY", "DEPAN GATE SEPI");
        Serial.println(F("[LOOP 1] Vehicle left without scanning. Returning to standby."));
        break;
      }

      // Periksa keberadaan Kartu RFID di dekat Reader RC522
      if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
        currentState = STATE_VERIFYING_CARD;
      }
      break;

    // --------------------------------------------------------------------------
    // STATE 3: VERIFYING CARD - Memvalidasi ID Kartu Member
    // --------------------------------------------------------------------------
    case STATE_VERIFYING_CARD: {
      String cardUid = getCardUIDString();
      Serial.print(F("[RFID SCAN] Card UID Detected: "));
      Serial.println(cardUid);

      if (checkRfidAuthorized(cardUid)) {
        // Kartu Diterima!
        playSuccessSound();
        digitalWrite(LED_RED_PIN, LOW);
        digitalWrite(LED_GREEN_PIN, HIGH);
        updateLCD("AKSES DITERIMA!", "MEMBER VALID");

        // Buka Palang Barrier Gate (90 derajat)
        gateServo.write(90);
        lastStateChangeMs = millis();
        currentState = STATE_GATE_OPEN;
        Serial.println(F("[GATE] Barrier Gate Opening to 90 degrees."));
      } else {
        // Kartu Ditolak!
        playErrorSound();
        updateLCD("AKSES DITOLAK!", "KARTU TAK RESMI");
        delay(2000);
        updateLCD("MOBIL TERDETEKSI", "SILAKAN TAP RFID");
        currentState = STATE_VEHICLE_WAITING;
        Serial.println(F("[RFID SCAN] Access Denied: Unauthorized Card."));
      }

      // Hentikan enkripsi MFRC522 untuk pembacaan berikutnya
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      break;
    }

    // --------------------------------------------------------------------------
    // STATE 4: GATE OPEN - Palang Terbuka, Mobil Bergerak Maju ke Loop 2
    // --------------------------------------------------------------------------
    case STATE_GATE_OPEN:
      // Jika mobil mulai menggilas Loop 2 (Pas Bawah Palang)
      if (loop2VehicleDetected) {
        currentState = STATE_VEHICLE_PASSING;
        updateLCD("MOBIL MELINTAS", "SAFETY LOCK ON");
        Serial.println(F("[LOOP 2] Vehicle entered passage safety zone under barrier."));
      }
      // Timeout Safety: Jika mobil tidak jalan-jalan lebih dari 12 detik, tutup palang
      else if (millis() - lastStateChangeMs > gateOpenTimeoutMs) {
        currentState = STATE_GATE_CLOSING;
        Serial.println(F("[TIMEOUT] Vehicle did not pass. Auto-closing gate."));
      }
      break;

    // --------------------------------------------------------------------------
    // STATE 5: VEHICLE PASSING - SAFETY ANTI-CRUSH ACTIVE!
    // --------------------------------------------------------------------------
    case STATE_VEHICLE_PASSING:
      // PALANG WAJIB TETAP TERBUKA (90 derajat) SELAMA MOBIL DI LOOP 2!
      gateServo.write(90);

      // Ketika mobil telah SELESAI melintas (Loop 2 lepas / kembali HIGH)
      if (!loop2VehicleDetected && !loop1VehicleDetected) {
        delay(500); // Buffer jeda aman ekor mobil
        currentState = STATE_GATE_CLOSING;
        Serial.println(F("[LOOP 2] Vehicle cleared passage zone completely. Initiating auto-close."));
      }
      break;

    // --------------------------------------------------------------------------
    // STATE 6: GATE CLOSING - Tutup Palang Otomatis
    // --------------------------------------------------------------------------
    case STATE_GATE_CLOSING:
      updateLCD("PALANG MENUTUP", "HATI-HATI!");
      digitalWrite(LED_GREEN_PIN, LOW);
      digitalWrite(LED_RED_PIN, HIGH);

      // Gerakan perlahan servo menutup dari 90 ke 0 derajat
      for (int angle = 90; angle >= 0; angle -= 3) {
        // Safety Interrupt: Jika tiba-tiba ada mobil baru / halangan di Loop 2, BUKA LAGI!
        if (digitalRead(LOOP2_SAFETY_PIN) == LOW) {
          gateServo.write(90);
          currentState = STATE_VEHICLE_PASSING;
          updateLCD("SAFETY WARNING!", "MOBIL TERDAPAT!");
          playBeep(3000, 200);
          Serial.println(F("[SAFETY INTERRUPT] Obstacle detected on Loop 2 while closing! Re-opening!"));
          return;
        }
        gateServo.write(angle);
        delay(30);
      }

      gateServo.write(0); // Pastikan terkunci di 0 derajat
      playBeep(1000, 100);
      updateLCD("SISTEM STANDBY", "DEPAN GATE SEPI");
      currentState = STATE_STANDBY;
      Serial.println(F("[GATE] Barrier Gate closed completely. Standby."));
      break;

    // --------------------------------------------------------------------------
    // STATE 7: EMERGENCY MODE - Buka Palang Paksa Penjaga
    // --------------------------------------------------------------------------
    case STATE_EMERGENCY_MODE:
      gateServo.write(90);
      digitalWrite(LED_GREEN_PIN, HIGH);
      digitalWrite(LED_RED_PIN, HIGH);
      updateLCD("MODE DARURAT!", "OVERRIDE PENJAGA");

      // Bunyi buzzer peringatan mode darurat
      playBeep(2500, 50);
      delay(200);

      // Lepas mode darurat jika tombol dilepas/ditekan kembali
      if (digitalRead(EMERGENCY_BTN_PIN) == HIGH) {
        delay(1000);
        currentState = STATE_GATE_CLOSING;
        Serial.println(F("[EMERGENCY] Emergency mode disengaged. Resuming normal operation."));
      }
      break;
  }

  delay(20); // Small loop cycle stability delay
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Kode Firmware Arduino C++ (C++ Sketch .ino)</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                  v2.4.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Kode program lengkap siap di-upload ke Arduino Uno / Nano / ESP32 untuk mengontrol Barrier Gate, RFID, & Dual Loop Detector.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode .ino'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'code'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Arduino .ino Source Code</span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`py-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'wiring'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Skema Pinout & Wiring Hardware</span>
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`py-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'flow'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Logika Safety Anti-Crush</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
          {activeTab === 'code' && (
            <div className="relative">
              <pre className="font-mono text-[11px] leading-relaxed text-cyan-200 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto selection:bg-cyan-800 selection:text-white">
                <code>{arduinoCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="font-bold text-cyan-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Daftar Sambungan Pin Hardware Arduino Uno</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] text-slate-300">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-amber-400 font-bold mb-1">1. RFID MFRC522 (13.56MHz)</div>
                    <div>• SDA (SS) -&gt; Pin D10</div>
                    <div>• SCK -&gt; Pin D13</div>
                    <div>• MOSI -&gt; Pin D11</div>
                    <div>• MISO -&gt; Pin D12</div>
                    <div>• RST -&gt; Pin D9</div>
                    <div>• VCC -&gt; 3.3V (PERHATIAN: Max 3.3V)</div>
                    <div>• GND -&gt; GND</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-cyan-400 font-bold mb-1">2. Modul Inductive Loop Detector</div>
                    <div>• Loop 1 Relay Out (Presence) -&gt; Pin A0 (NO to GND)</div>
                    <div>• Loop 2 Relay Out (Safety/Passage) -&gt; Pin A1 (NO to GND)</div>
                    <div>• Modul Power VCC -&gt; 12V / 24V DC External Power</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-emerald-400 font-bold mb-1">3. Servo Motor / Relay Barrier Gate</div>
                    <div>• PWM Signal Control -&gt; Pin D6</div>
                    <div>• Servo VCC -&gt; 5V External Adapter (Min 2A)</div>
                    <div>• GND -&gt; Shared Common GND Arduino</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-purple-400 font-bold mb-1">4. Display LCD 16x2 I2C & Indicator</div>
                    <div>• LCD SDA -&gt; Pin A4</div>
                    <div>• LCD SCL -&gt; Pin A5</div>
                    <div>• Buzzer Positive -&gt; Pin D5</div>
                    <div>• LED Hijau -&gt; Pin D2 (+ Resistor 220Ω)</div>
                    <div>• LED Merah -&gt; Pin D3 (+ Resistor 220Ω)</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200">
                ⚠️ <strong>Catatan Penting Pemasangan:</strong> Pastikan seluruh Ground (GND) dari Arduino, Power Supply Servo, dan Modul Loop Detector terhubung bersama (Common Ground) untuk menghindari noise sinyal listrik.
              </div>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Prinsip Keamanan Sistem Barrier Gate Otomatis</span>
                </h4>
                <p>
                  Sistem ini menggunakan algoritma state-machine dengan proteksi ganda (Double Inductive Loop Security) untuk mencegah mobil tertimpa palang pintu parkir (Anti-Crush Protection):
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-300">
                  <li>
                    <strong className="text-cyan-400">Anti-Tap Tanpa Mobil:</strong> Kartu RFID tidak akan diproses oleh reader jika Loop Detector 1 (Presence) tidak mendeteksi massa logam mobil asli. Ini mencegah pejalan kaki asal tap kartu.
                  </li>
                  <li>
                    <strong className="text-amber-400">Safety Lock Under Gate:</strong> Saat mobil berada di bawah palang (Loop Detector 2 aktif), sistem memblokir perintah tutup palang dan mengunci posisi servo tetap 90 derajat.
                  </li>
                  <li>
                    <strong className="text-emerald-400">Interrupt Auto-Reopen:</strong> Jika palang sedang proses bergerak turun dan tiba-tiba Loop Detector 2 mendeteksi halangan/ekor kendaraan, palang langsung BUKA KEMBALI seketika.
                  </li>
                  <li>
                    <strong className="text-purple-400">Auto Close Setelah Lolos:</strong> Palang pintu hanya akan menutup otomatis 500ms setelah sensor Loop Detector 2 lepas/clear total.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Target Platform: Arduino IDE 2.x (Compatible with ESP32 / Arduino Uno / STM32)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
