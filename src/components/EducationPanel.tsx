import React, { useState } from 'react';
import { 
  BookOpen, 
  Award, 
  Cpu, 
  Layers, 
  HelpCircle, 
  RefreshCw, 
  Check, 
  X, 
  Copy, 
  Sparkles, 
  Zap, 
  BookOpenCheck,
  RotateCw,
  Activity,
  ArrowRight
} from 'lucide-react';

interface EducationPanelProps {
  onOpenArduinoModal?: () => void;
}

export const EducationPanel: React.FC<EducationPanelProps> = ({ onOpenArduinoModal }) => {
  const [activeSubTab, setActiveSubTab] = useState<'materi' | 'wiring' | 'flashcard' | 'kuis'>('materi');

  // Flashcards State
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Arduino Code Copy State
  const [codeCopied, setCodeCopied] = useState(false);

  const learningObjectives = [
    { icon: '🎯', text: 'Memahami prinsip fisika induksi elektromagnetik pada Loop Detector dalam mendeteksi massa logam kendaraan.' },
    { icon: '💳', text: 'Mempelajari cara kerja modul RFID RC522 (13.56 MHz) untuk autentikasi nirkabel dan pengamanan gerbang.' },
    { icon: '⚙️', text: 'Menganalisis algoritma State Machine (FSM) dalam merancang transisi kondisi palang parkir secara tertib.' },
    { icon: '🛡️', text: 'Memahami implementasi sistem keselamatan aktif Anti-Crush menggunakan sensor interupsi fisik.' }
  ];

  const theoryData = [
    {
      title: '1. Loop Detector 1 (Sensor Presensi)',
      icon: '🚙',
      desc: 'Loop Detector 1 ditempatkan di depan tiang tiket/RFID. Sensor ini berupa lilitan kabel di dalam tanah yang terhubung ke modul induksi. Saat bodi logam kendaraan berada di atas lilitan, induktansi berubah dan frekuensi resonansi bergeser. Sistem menggunakan sensor ini untuk mengaktifkan scanner RFID, memastikan hanya kendaraan nyata (bukan pejalan kaki) yang bisa menempelkan kartu.'
    },
    {
      title: '2. RFID Reader (Modul Autentikasi)',
      icon: '💳',
      desc: 'Modul MFRC522 menggunakan frekuensi radio 13.56 MHz (HF) untuk berkomunikasi dengan tag/kartu RFID. Saat kartu didekatkan, pembaca mengirimkan daya nirkabel ke chip kartu, lalu membaca UID uniknya. Sistem akan mencocokkan UID tersebut dengan database whitelist atau memeriksa sisa saldo sebelum membuka gerbang.'
    },
    {
      title: '3. Loop Detector 2 (Anti-Crush & Auto-Close)',
      icon: '🛡️',
      desc: 'Diletakkan tepat di bawah lintasan palang. Sensor ini bertugas ganda: (1) Selama mobil berada di atas Loop 2, palang dikunci di posisi 90° (Anti-Crush). (2) Saat mobil selesai melintas (Loop 2 mendeteksi kondisi kosong kembali), sistem langsung memicu servo untuk menutup palang secara otomatis (Auto-Close) demi keamanan.'
    }
  ];

  const flashcards = [
    {
      title: 'Inductive Loop Detector',
      icon: '🔄',
      concept: 'Sensor elektromagnetik',
      definition: 'Kumparan kabel yang mendeteksi logam kendaraan berdasarkan pergeseran frekuensi akibat perubahan induktansi tanah.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'RFID (MFRC522)',
      icon: '💳',
      concept: 'Teknologi Frekuensi Radio',
      definition: 'Modul pembaca nirkabel 13.56 MHz yang membaca ID unik kartu (UID) untuk verifikasi akses tanpa sentuh.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Anti-Crush Protection',
      icon: '🛡️',
      concept: 'Sistem Keselamatan Aktif',
      definition: 'Fitur pengaman yang mencegah palang bergerak turun atau segera membalikkan arah jika ada kendaraan di bawahnya.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Finite State Machine',
      icon: '⚙️',
      concept: 'Logika Pemrograman',
      definition: 'Model matematika dari sistem kontrol yang melompat dari satu status (State) ke status lain berdasarkan event input.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Common Grounding',
      icon: '🔌',
      concept: 'Dasar Kelistrikan IoT',
      definition: 'Menghubungkan seluruh terminal negatif (GND) modul dan mikrokontroler agar referensi tegangan stabil & bebas noise.',
      color: 'from-sky-500 to-blue-500'
    },
    {
      title: 'Sinyal PWM (Pulse Width)',
      icon: '〰️',
      concept: 'Sinyal Kontrol Motor',
      definition: 'Sinyal pulsa dengan lebar variabel yang dikirimkan pin digital Arduino untuk mengatur posisi sudut motor servo (0° s.d 90°) pada palang parkir secara presisi.',
      color: 'from-rose-500 to-orange-500'
    },
    {
      title: 'Protokol SPI (RFID)',
      icon: '🔌',
      concept: 'Komunikasi Serial MCU',
      definition: 'Protokol komunikasi berkecepatan tinggi yang digunakan Arduino untuk bertukar data dengan modul pembaca RFID RC522 melalui pin MOSI, MISO, SCK, dan SDA.',
      color: 'from-fuchsia-500 to-pink-500'
    },
    {
      title: 'Sirkuit LC Resonansi',
      icon: '🧲',
      concept: 'Fisika Elektromagnetik',
      definition: 'Kombinasi lilitan kawat tanah (induktor) dan kapasitor yang berosilasi pada frekuensi tertentu. Logam mobil mendistorsi medan ini dan menggeser frekuensinya.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Debounce Algoritma',
      icon: '⏱️',
      concept: 'Optimasi Software',
      definition: 'Metode pemrograman untuk memfilter noise atau fluktuasi transisi sinyal sensor loop detector agar tidak memicu deteksi ganda palsu.',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      title: 'Watchdog Timer (WDT)',
      icon: '🐕',
      concept: 'Keandalan Sistem IoT',
      definition: 'Sistem pewaktu perangkat keras yang secara otomatis mereset mikrokontroler Arduino jika program mengalami hang (stuck) agar gerbang beroperasi mandiri 24/7.',
      color: 'from-red-500 to-rose-600'
    },
    {
      title: 'Protokol MQTT Cloud',
      icon: '☁️',
      concept: 'Telemetri Nirkabel',
      definition: 'Protokol komunikasi ringan berbasis Publish/Subscribe untuk mengirimkan data okupansi slot parkir dan status gerbang ke server cloud secara real-time.',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const quizQuestions = [
    {
      q: 'Apa peran penting dari Loop Detector 1 (Presensi) sebelum pembacaan RFID?',
      options: [
        'Sebagai alarm peringatan suara pintu gerbang.',
        'Mencegah pencurian kartu RFID.',
        'Mengaktifkan pembacaan kartu hanya jika terdapat mobil fisik di tiang tiket.',
        'Membuka palang secara paksa tanpa perlu menempelkan kartu.'
      ],
      correct: 2,
      explanation: 'Loop Detector 1 bertugas mendeteksi massa logam kendaraan. Ini digunakan untuk mengaktifkan RFID reader sehingga pejalan kaki tanpa mobil tidak dapat membuka gerbang secara sembarangan.'
    },
    {
      q: 'Bagaimana palang parkir mendeteksi bodi mobil agar tidak menimpa kap mesin (Anti-Crush)?',
      options: [
        'Menggunakan Loop Detector 2 yang diletakkan tepat di bawah palang.',
        'Menggunakan sensor ultrasonik di tiang samping.',
        'Palang menggunakan timer tertutup acak.',
        'Penjaga menekan tombol stop darurat secara manual setiap saat.'
      ],
      correct: 0,
      explanation: 'Loop Detector 2 diletakkan tepat di bawah palang. Selama sensor ini mendeteksi logam mobil, sistem akan menolak perintah tutup dan mengunci palang tetap terbuka lebar.'
    },
    {
      q: 'Kapan sistem secara otomatis menutup kembali palang pintu parkir?',
      options: [
        'Tepat setelah kartu RFID ditempelkan di scanner.',
        'Sesaat setelah mobil selesai melintasi dan lepas dari Loop Detector 2.',
        'Setiap 3 menit sekali tanpa peduli ada kendaraan atau tidak.',
        'Setelah mobil kembali mundur ke Loop Detector 1.'
      ],
      correct: 1,
      explanation: 'Proses penutupan otomatis (Auto-Close) diaktifkan setelah ekor kendaraan sepenuhnya meninggalkan area deteksi Loop Detector 2 untuk menjamin keamanan.'
    },
    {
      q: 'Pada kode pemrograman Arduino, apa yang terjadi jika sensor mendeteksi mobil di Loop 2 saat palang sedang turun (CLOSING)?',
      options: [
        'Sistem akan mematikan daya servo sepenuhnya.',
        'Palang langsung mengunci posisinya di tempat kejadian.',
        'Sistem membatalkan penutupan dan segera menaikkan palang kembali (Safety Block).',
        'Sistem mengabaikan sensor dan tetap menurunkan palang.'
      ],
      correct: 2,
      explanation: 'Algoritma interupsi keselamatan mendeteksi event ini, lalu merubah status kembali ke STATE_VEHICLE_PASSING dan memutar servo kembali ke 90 derajat untuk menghindari benturan.'
    },
    {
      q: 'Mengapa kabel GND dari Arduino, power supply servo, dan modul sensor wajib dihubungkan bersama (Common Ground)?',
      options: [
        'Agar tegangan listrik bisa naik menjadi dua kali lipat.',
        'Untuk mempermudah proses penyolderan kabel.',
        'Menyamakan referensi potensial agar komunikasi data stabil dan bebas noise kelistrikan.',
        'Agar sensor dapat bekerja tanpa memerlukan listrik sama sekali.'
      ],
      correct: 3, // index 2
      explanation: 'Common ground menyamakan referensi tegangan 0V di seluruh sirkuit sehingga sinyal digital SPI RFID dan sinyal PWM servo tidak terganggu oleh distorsi sinyal (noise).'
    }
  ];

  // Fix correct answer mismatch on index for question 5
  quizQuestions[4].correct = 2; 

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    if (optionIndex === quizQuestions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const arduinoInoCode = `// --- KODE SINGKAT INTEGRASI SMARTGATE ---
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

#define LOOP1_PRESENCE A0  // Sensor Antrian
#define LOOP2_SAFETY   A1  // Sensor Pengaman
#define SERVO_PIN      6   // Motor Palang

Servo palangServo;

void setup() {
  pinMode(LOOP1_PRESENCE, INPUT_PULLUP);
  pinMode(LOOP2_SAFETY, INPUT_PULLUP);
  palangServo.attach(SERVO_PIN);
  palangServo.write(0); // Tutup
}

void loop() {
  bool mobilAntre = (digitalRead(LOOP1_PRESENCE) == LOW);
  bool mobilLewat = (digitalRead(LOOP2_SAFETY) == LOW);
  
  // Logika dasar state machine sistem parkir
  // 1. Jika ada mobil antre & RFID valid -> Buka palang (Servo 90)
  // 2. Selama mobil di atas Loop 2 -> Kunci palang tetap buka (Anti-Crush)
  // 3. Setelah mobil lepas dari Loop 2 -> Tutup otomatis
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoInoCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-700 overflow-hidden">
      {/* Tab Navigasi Edukasi (Elegant Minimalist) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-pink-100/60 mx-4 mt-3 shrink-0">
        {[
          { id: 'materi', label: '📖 Teori', color: 'text-pink-600 border-pink-200' },
          { id: 'wiring', label: '🔌 Wiring & Code', color: 'text-indigo-600 border-indigo-200' },
          { id: 'flashcard', label: '🎴 Flashcard', color: 'text-amber-600 border-amber-200' },
          { id: 'kuis', label: '📝 Kuis', color: 'text-emerald-600 border-emerald-200' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 py-1.5 rounded-xl text-[11px] font-black tracking-tight transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
              activeSubTab === tab.id
                ? 'bg-white shadow-xs text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Area Konten Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pt-3.5 space-y-4">
        
        {/* ----------------- TAB 1: MATERI & TUJUAN ----------------- */}
        {activeSubTab === 'materi' && (
          <div className="space-y-4 animate-fade-in">
            {/* Tujuan Pembelajaran */}
            <div className="border border-pink-100 bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30 p-4 rounded-3xl shadow-xs">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-sm shadow-2xs">
                  🎯
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Tujuan Pembelajaran
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5 text-[11px] font-medium text-slate-600">
                {learningObjectives.map((obj, i) => (
                  <div key={i} className="flex gap-2.5 items-start p-2 rounded-xl hover:bg-white/80 transition-all">
                    <span className="text-sm shrink-0 leading-none">{obj.icon}</span>
                    <p className="leading-relaxed">{obj.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Teori IoT Smart Gate */}
            <div className="border border-purple-100 bg-white p-4 rounded-3xl shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm shadow-2xs">
                    📚
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Konsep & Prinsip Kerja
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                  Dual Loop
                </span>
              </div>

              <div className="space-y-3">
                {theoryData.map((data, i) => (
                  <div key={i} className="p-3 bg-slate-50/70 border border-slate-100 hover:border-purple-200 hover:bg-white transition-all rounded-2xl flex gap-3">
                    <span className="text-lg shrink-0">{data.icon}</span>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 mb-1 leading-tight">{data.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{data.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: WIRING DIAGRAM & CODE ----------------- */}
        {activeSubTab === 'wiring' && (
          <div className="space-y-4 animate-fade-in">
            {/* Interactive Wiring Diagram */}
            <div className="border border-indigo-100 bg-white p-4 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-indigo-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm shadow-2xs">
                    🔌
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Wiring Diagram IoT
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Arduino Uno
                </span>
              </div>

              {/* Visual SVG Circuit Board Schematic */}
              <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
                <div className="w-full max-w-[280px] h-[170px] relative bg-slate-950 rounded-xl p-2 border border-slate-700 overflow-hidden flex flex-col justify-between text-[9px] font-mono text-slate-400">
                  {/* Decorative Circuit Lines */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
                  
                  {/* Arduino Block */}
                  <div className="absolute top-2 left-2 w-20 h-28 bg-emerald-900/40 border border-emerald-500/80 rounded-lg flex flex-col items-center justify-center gap-1">
                    <span className="text-[8px] font-black text-emerald-300">ARDUINO UNO</span>
                    <span className="text-[7px] text-emerald-400/80">MCU Board</span>
                    <div className="flex gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>

                  {/* SPI Connection Lines */}
                  <div className="absolute top-8 left-22 w-12 h-px bg-yellow-500/60" />
                  <div className="absolute top-18 left-22 w-12 h-px bg-cyan-500/60" />
                  <div className="absolute top-26 left-22 w-12 h-px bg-rose-500/60" />

                  {/* Modules Column */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 w-32">
                    {/* RFID Module */}
                    <div className="p-1 bg-yellow-950/40 border border-yellow-500/70 rounded flex items-center justify-between text-[7px]">
                      <span className="font-bold text-yellow-300">💳 RFID RC522</span>
                      <span className="text-slate-400 font-bold">D9-D13</span>
                    </div>
                    {/* Servo Motor */}
                    <div className="p-1 bg-rose-950/40 border border-rose-500/70 rounded flex items-center justify-between text-[7px]">
                      <span className="font-bold text-rose-300">⚡ Servo Gate</span>
                      <span className="text-slate-400 font-bold">Pin D6</span>
                    </div>
                    {/* Loop Detectors */}
                    <div className="p-1 bg-cyan-950/40 border border-cyan-500/70 rounded flex items-center justify-between text-[7px]">
                      <span className="font-bold text-cyan-300">🚙 Loop 1 & 2</span>
                      <span className="text-slate-400 font-bold">A0 & A1</span>
                    </div>
                  </div>

                  {/* Common Ground label */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[7px] text-slate-500 font-bold">
                    <div className="w-1.5 h-1.5 bg-black border border-slate-600 rounded-sm" />
                    <span>COMMON GND ACTIVE</span>
                  </div>
                </div>

                <div className="w-full mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-medium">
                  <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <span className="text-yellow-400 font-bold block mb-0.5">💳 RFID Reader SPI:</span>
                    <span className="text-slate-400 block font-mono text-[9px]">SDA→D10 | SCK→D13 | MOSI→D11 | MISO→D12 | RST→D9</span>
                  </div>
                  <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <span className="text-cyan-400 font-bold block mb-0.5">🚙 Inductive Loops:</span>
                    <span className="text-slate-400 block font-mono text-[9px]">Loop 1 (Presensi) → A0 | Loop 2 (Safety) → A1</span>
                  </div>
                </div>
              </div>

              {/* Wiring Note */}
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/60 rounded-2xl text-[10px] text-amber-850 font-medium leading-relaxed">
                ⚠️ <strong>PENTING:</strong> Hubungkan Pin <strong>VCC RFID</strong> ke jalur <strong>3.3V</strong> Arduino. Jika dihubungkan ke 5V, chip RC522 dapat mengalami panas berlebih dan rusak permanen!
              </div>
            </div>

            {/* Arduino Code Snippet */}
            <div className="border border-slate-200 bg-white p-4 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm shadow-2xs">
                    💻
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Arduino Sketch (.ino)
                  </h3>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-slate-700 font-extrabold flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-900 border border-slate-950 text-[10px] font-mono leading-relaxed text-emerald-400 rounded-2xl overflow-x-auto max-h-[160px]">
                  <code>{arduinoInoCode}</code>
                </pre>
              </div>

              {onOpenArduinoModal && (
                <button
                  onClick={onOpenArduinoModal}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-100 hover:from-sky-100 hover:to-indigo-100 text-indigo-700 text-[11px] font-black rounded-xl text-center cursor-pointer transition-all active:scale-97"
                >
                  🚀 Buka Firmware Lengkap & Flowchart (.ino)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: FLIP FLASH CARD ----------------- */}
        {activeSubTab === 'flashcard' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 p-4 rounded-3xl shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm shadow-2xs">
                  🎴
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Flip Flash Card Istilah IoT
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mb-3">
                Tap kartu di bawah ini untuk membalik dan mempelajari definisi terminologi penting!
              </p>

              {/* Grid of Cards with beautiful 3D/CSS Perspective Flip effects */}
              <div className="grid grid-cols-1 gap-3.5">
                {flashcards.map((card, idx) => {
                  const isFlipped = !!flippedCards[idx];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleCardFlip(idx)}
                      className="h-[100px] w-full [perspective:1000px] cursor-pointer"
                    >
                      <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        
                        {/* CARD FRONT */}
                        <div className={`absolute inset-0 w-full h-full p-4.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between [backface-visibility:hidden] hover:border-amber-400 hover:shadow-xs transition-all`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center text-lg shadow-sm`}>
                              {card.icon}
                            </span>
                            <div className="text-left">
                              <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-md">{card.concept}</span>
                              <h4 className="text-[12px] font-black text-slate-800 mt-1 leading-tight">{card.title}</h4>
                            </div>
                          </div>
                          <button className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-500">
                            <RotateCw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                          </button>
                        </div>

                        {/* CARD BACK */}
                        <div className={`absolute inset-0 w-full h-full p-4.5 rounded-2xl text-white bg-gradient-to-br ${card.color} flex flex-col justify-center text-left [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md`}>
                          <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1.5">
                            <span className="text-[8px] font-mono tracking-widest uppercase text-white/85">Definisi Konsep</span>
                            <span className="text-xs">✨</span>
                          </div>
                          <p className="text-[10px] font-bold text-white/95 leading-relaxed">
                            {card.definition}
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: INTERACTIVE QUIZ ----------------- */}
        {activeSubTab === 'kuis' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-emerald-100 bg-white p-4 rounded-3xl shadow-xs">
              
              {!quizStarted && !quizFinished && (
                <div className="text-center py-6 space-y-3.5">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-3xl mx-auto shadow-sm">
                    📝
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Evaluasi Kuis SmartGate IoT
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold max-w-[250px] mx-auto mt-1 leading-relaxed">
                      Uji pemahaman Anda tentang sensor loop induktansi elektromagnetik, modul RFID, dan logika keselamatan anti-crush!
                    </p>
                  </div>
                  <button
                    onClick={() => setQuizStarted(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:from-emerald-600 active:scale-95 cursor-pointer"
                  >
                    Mulai Kuis Sekarang! 🚀
                  </button>
                </div>
              )}

              {quizStarted && !quizFinished && (
                <div className="space-y-4">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Pertanyaan {currentQuestion + 1} dari {quizQuestions.length}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Skor: {score * 20}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300" 
                      style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <h4 className="text-[11.5px] font-black text-slate-800 leading-relaxed">
                    {quizQuestions[currentQuestion].q}
                  </h4>

                  {/* Options */}
                  <div className="flex flex-col gap-2">
                    {quizQuestions[currentQuestion].options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrectAnswer = optIdx === quizQuestions[currentQuestion].correct;
                      
                      let btnStyle = 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 text-slate-600';
                      if (isAnswered) {
                        if (isCorrectAnswer) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-300/35';
                        } else if (isSelected) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-300/35';
                        } else {
                          btnStyle = 'opacity-50 border-slate-200 bg-slate-50 text-slate-400';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-emerald-400 bg-emerald-50 text-emerald-700';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(optIdx)}
                          disabled={isAnswered}
                          className={`p-3 text-left rounded-xl border text-[10.5px] font-medium leading-relaxed transition-all cursor-pointer flex items-start gap-2.5 active:scale-98 ${btnStyle}`}
                        >
                          <span className="w-4.5 h-4.5 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0 text-[9px] font-black font-mono">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isAnswered && isCorrectAnswer && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isAnswered && isSelected && !isCorrectAnswer && <X className="w-4 h-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {isAnswered && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-150 text-[10px] text-slate-600 leading-relaxed font-medium">
                      <div className="flex items-center gap-1.5 font-black text-slate-800 mb-1 uppercase tracking-wider text-[9px]">
                        <BookOpenCheck className="w-3.5 h-3.5 text-purple-500" />
                        <span>Pembahasan Penjelas:</span>
                      </div>
                      {quizQuestions[currentQuestion].explanation}
                    </div>
                  )}

                  {/* Next Button */}
                  {isAnswered && (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white text-xs font-black rounded-xl active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>
                        {currentQuestion + 1 === quizQuestions.length ? 'Selesaikan Kuis 🏁' : 'Pertanyaan Berikutnya'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {quizFinished && (
                <div className="text-center py-6 space-y-4">
                  <div className="relative inline-block">
                    <span className="text-5xl">🏆</span>
                    <span className="absolute -top-1 -right-1 text-lg">✨</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">
                      Kuis Selesai! Selamat! 🎉
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Anda telah menyelesaikan evaluasi pemahaman IoT SmartGate.
                    </p>
                  </div>

                  {/* Score Indicator */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl max-w-[200px] mx-auto flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Skor Akhir:</span>
                    <span className="text-3xl font-black text-emerald-600">{score * 20} / 100</span>
                    <span className="text-[10.5px] font-black text-slate-700">
                      {score === 5 ? '👑 Master SmartGate IoT!' : score >= 3 ? '🎓 IoT Developer Handal!' : '📚 Mari Belajar Lagi!'}
                    </span>
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    Ulangi Kuis 🔄
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
