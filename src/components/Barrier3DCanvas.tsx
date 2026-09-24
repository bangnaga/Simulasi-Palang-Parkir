import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { Zap, Camera, Eye, Video, Compass, Car, Scan, ShieldCheck, Film, Disc } from 'lucide-react';
import { CameraPreset, EnvironmentSetting, GateState, RenderQuality, VehicleType } from '../types';
import { buildParkingScene, SceneContext } from '../lib/babylon/sceneBuilder';
import { createVehicle, VehicleMeshGroup } from '../lib/babylon/vehicleBuilder';

interface Barrier3DCanvasProps {
  vehicleZPos: number; // -16 to +15
  vehicleType: VehicleType;
  gateState: GateState;
  gateAngle: number; // 0 (closed) to 90 (open)
  cameraPreset: CameraPreset;
  setCameraPreset?: (cam: CameraPreset) => void;
  environmentMode: EnvironmentSetting;
  loop1Active: boolean;
  loop2Active: boolean;
  rfidDisplayText: { text: string; subtext: string; status: 'idle' | 'success' | 'error' };
  isTappingCard: boolean;
  onVehiclePosChange?: (newZ: number) => void;
  onSceneReady?: () => void;
}

export const Barrier3DCanvas: React.FC<Barrier3DCanvasProps> = ({
  vehicleZPos,
  vehicleType,
  gateState,
  gateAngle,
  cameraPreset,
  setCameraPreset,
  environmentMode,
  loop1Active,
  loop2Active,
  rfidDisplayText,
  isTappingCard,
  onSceneReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneCtxRef = useRef<SceneContext | null>(null);
  const vehicleGroupRef = useRef<VehicleMeshGroup | null>(null);

  // Performance telemetry & quality controls
  const [fps, setFps] = useState<number>(60);
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('high_fps');

  // Initialize Babylon Scene on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = buildParkingScene(canvasRef.current);
    sceneCtxRef.current = ctx;

    // Default to high FPS preset
    ctx.setRenderQuality('high_fps');

    // Create initial vehicle
    const vGroup = createVehicle(ctx.scene, ctx.shadowGenerator, vehicleType, '#f4f6f8');
    vGroup.root.position.set(-2.2, 0, vehicleZPos);
    vehicleGroupRef.current = vGroup;

    if (onSceneReady) onSceneReady();

    const handleResize = () => {
      ctx.engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // FPS ticker polling
    const fpsInterval = window.setInterval(() => {
      if (ctx.engine) {
        const currentFps = Math.round(ctx.engine.getFps());
        if (currentFps > 0) {
          setFps(currentFps);
        }
      }
    }, 400);

    return () => {
      window.clearInterval(fpsInterval);
      window.removeEventListener('resize', handleResize);
      ctx.engine.dispose();
    };
  }, []);

  const handleQualityChange = (newQuality: RenderQuality) => {
    setRenderQuality(newQuality);
    if (sceneCtxRef.current) {
      sceneCtxRef.current.setRenderQuality(newQuality);
    }
  };

  // Update Environment (Day / Sunset / Night)
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    sceneCtxRef.current.setEnvironmentMode(environmentMode);

    // Toggle vehicle headlights in night/sunset mode
    if (vehicleGroupRef.current) {
      const intensity = environmentMode === 'night' ? 18 : environmentMode === 'sunset' ? 6 : 0;
      vehicleGroupRef.current.headlights.forEach(spot => (spot.intensity = intensity));
    }
  }, [environmentMode]);

  // Update Vehicle Type if changed
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    const ctx = sceneCtxRef.current;

    // Dispose old vehicle
    if (vehicleGroupRef.current) {
      vehicleGroupRef.current.root.dispose();
    }

    const vGroup = createVehicle(ctx.scene, ctx.shadowGenerator, vehicleType, '#f4f6f8');
    vGroup.root.position.set(-2.2, 0, vehicleZPos);
    vehicleGroupRef.current = vGroup;

    if (environmentMode === 'night') {
      vGroup.headlights.forEach(spot => (spot.intensity = 18));
    }
  }, [vehicleType]);

  // Update Vehicle Z position and wheel rotation
  useEffect(() => {
    if (!vehicleGroupRef.current) return;
    const vGroup = vehicleGroupRef.current;
    
    const prevZ = vGroup.root.position.z;
    const deltaZ = vehicleZPos - prevZ;
    vGroup.root.position.z = vehicleZPos;

    // Rotate wheels proportionally to travel distance
    const wheelRadius = vehicleType === 'suv' ? 0.38 : 0.32;
    const rotationRad = deltaZ / wheelRadius;
    vGroup.wheels.forEach(wheel => {
      wheel.rotation.x += rotationRad;
    });

    // Update dynamic follow cameras when vehicle moves
    if (sceneCtxRef.current) {
      const ctx = sceneCtxRef.current;
      if (cameraPreset === 'driver') {
        ctx.cameras.driver.position.set(-2.2, 2.2, vehicleZPos - 4.2);
        (ctx.cameras.driver as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-2.2, 1.2, vehicleZPos + 8.0));
      } else if (cameraPreset === 'cockpit') {
        ctx.cameras.cockpit.position.set(-2.2 + 0.32, 1.15, vehicleZPos + 0.35);
        (ctx.cameras.cockpit as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-2.2, 1.15, vehicleZPos + 10.0));
      } else if (cameraPreset === 'wheel') {
        ctx.cameras.wheel.position.set(-1.0, 0.42, vehicleZPos + 1.1);
        (ctx.cameras.wheel as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-1.3, 0.36, vehicleZPos + 1.35));
      }
    }
  }, [vehicleZPos, vehicleType, cameraPreset]);

  // Update Camera preset
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    const ctx = sceneCtxRef.current;
    const selectedCam = ctx.cameras[cameraPreset];

    if (selectedCam) {
      ctx.scene.activeCamera = selectedCam;
      if (cameraPreset === 'orbit') {
        selectedCam.attachControl(canvasRef.current, true);
      } else {
        ctx.cameras.orbit.detachControl();
        // Immediately sync target for follow cameras
        if (cameraPreset === 'driver') {
          ctx.cameras.driver.position.set(-2.2, 2.2, vehicleZPos - 4.2);
          (ctx.cameras.driver as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-2.2, 1.2, vehicleZPos + 8.0));
        } else if (cameraPreset === 'cockpit') {
          ctx.cameras.cockpit.position.set(-2.2 + 0.32, 1.15, vehicleZPos + 0.35);
          (ctx.cameras.cockpit as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-2.2, 1.15, vehicleZPos + 10.0));
        } else if (cameraPreset === 'wheel') {
          ctx.cameras.wheel.position.set(-1.0, 0.42, vehicleZPos + 1.1);
          (ctx.cameras.wheel as BABYLON.TargetCamera).setTarget(new BABYLON.Vector3(-1.3, 0.36, vehicleZPos + 1.35));
        }
      }
    }
  }, [cameraPreset, vehicleZPos]);

  // Update Loop Detectors visual glow
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    sceneCtxRef.current.setLoopActive(1, loop1Active);
  }, [loop1Active]);

  useEffect(() => {
    if (!sceneCtxRef.current) return;
    sceneCtxRef.current.setLoopActive(2, loop2Active);
  }, [loop2Active]);

  // Update Gate visual state & arm angle
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    sceneCtxRef.current.setGateVisualState(gateState, gateAngle);
  }, [gateState, gateAngle]);

  // Update RFID LCD screen
  useEffect(() => {
    if (!sceneCtxRef.current) return;
    sceneCtxRef.current.updateRfidDisplay(rfidDisplayText.text, rfidDisplayText.subtext, rfidDisplayText.status);
  }, [rfidDisplayText]);

  // Animate 3D RFID Card tap sequence
  useEffect(() => {
    if (!sceneCtxRef.current || !isTappingCard) return;
    const ctx = sceneCtxRef.current;
    const cardMesh = ctx.rfidCardMesh;

    // Animate card moving toward reader faceplate
    const frameRate = 30;
    const tapAnim = new BABYLON.Animation(
      'cardTapAnim',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: new BABYLON.Vector3(-2.8, 1.35, -2.2) },
      { frame: 12, value: new BABYLON.Vector3(-3.38, 1.38, -2.2) }, // Tapped at scanner
      { frame: 22, value: new BABYLON.Vector3(-3.38, 1.38, -2.2) },
      { frame: 35, value: new BABYLON.Vector3(-2.8, 1.35, -2.2) } // Return
    ];

    tapAnim.setKeys(keys);
    cardMesh.animations = [tapAnim];
    ctx.scene.beginAnimation(cardMesh, 0, 35, false);
  }, [isTappingCard]);

  return (
    <div className="relative w-full h-full overflow-hidden border-0 bg-slate-100">
      <canvas ref={canvasRef} className="w-full h-full outline-none touch-none cursor-grab active:cursor-grabbing" />

      {/* Top Left Badges & Controls */}
      <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-none z-20">
        <div className="hidden sm:flex bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white px-3 py-1.5 rounded-2xl text-[11px] font-black shadow-md shadow-pink-200/60 items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>3D View</span>
        </div>

        {/* FPS Telemetry HUD */}
        <div className="hidden md:flex bg-white/95 backdrop-blur-md border border-purple-200/80 px-2.5 py-1.5 rounded-2xl shadow-sm text-[11px] font-mono items-center gap-1.5 pointer-events-auto">
          <Zap className={`w-3.5 h-3.5 ${fps >= 50 ? 'text-emerald-500' : fps >= 30 ? 'text-amber-500' : 'text-rose-500'} animate-pulse`} />
          <span className={`font-black ${fps >= 50 ? 'text-emerald-600' : fps >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
            {fps} FPS
          </span>
        </div>

        {/* 3D Performance / High FPS Switcher (Desktop only) */}
        <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md border border-pink-200/80 p-0.5 rounded-2xl shadow-sm pointer-events-auto">
          <button
            onClick={() => handleQualityChange('high_fps')}
            className={`px-2.5 py-1 text-[10px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              renderQuality === 'high_fps'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-pink-600'
            }`}
            title="Max FPS (Super smooth animation)"
          >
            <Zap className="w-3 h-3" />
            <span>High FPS</span>
          </button>
          <button
            onClick={() => handleQualityChange('balanced')}
            className={`px-2.5 py-1 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
              renderQuality === 'balanced'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-pink-600'
            }`}
            title="Balanced (Medium Quality)"
          >
            Balanced
          </button>
          <button
            onClick={() => handleQualityChange('ultra')}
            className={`px-2.5 py-1 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
              renderQuality === 'ultra'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-pink-600'
            }`}
            title="Ultra (Highest Quality Shadows & Bloom)"
          >
            Ultra ✨
          </button>
        </div>

        {/* Camera Preset Quick Selector Dock */}
        {setCameraPreset && (
          <div className="flex items-center bg-white/90 backdrop-blur-md border border-indigo-200/80 p-0.5 rounded-xl sm:rounded-2xl shadow-2xs pointer-events-auto overflow-x-auto max-w-[calc(100vw-110px)] sm:max-w-none">
            <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-indigo-700 font-black flex items-center gap-1 border-r border-indigo-100 shrink-0">
              <Camera className="w-3 h-3 text-indigo-500" />
              <span className="hidden xl:inline">Kamera:</span>
            </div>
            {[
              { id: 'orbit', label: 'Orbit', icon: Compass },
              { id: 'driver', label: 'Driver', icon: Car },
              { id: 'cockpit', label: 'Cockpit', icon: Eye },
              { id: 'scanner', label: 'RFID', icon: Scan },
              { id: 'cctv', label: 'CCTV', icon: Video },
              { id: 'cinematic', label: 'Hero', icon: Film }
            ].map(item => {
              const IconComp = item.icon;
              const isActive = cameraPreset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCameraPreset(item.id as CameraPreset)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-purple-600'
                  }`}
                  title={`Sudut: ${item.label}`}
                >
                  <IconComp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Right Inductive Loop Indicators (Compact on mobile) */}
      <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 flex items-center gap-1 sm:gap-2 pointer-events-none z-20">
        {/* Mobile Combined Pill */}
        <div className="sm:hidden flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-pink-200/80 px-2 py-1 rounded-xl text-[10px] font-black shadow-2xs">
          <span className={`w-2 h-2 rounded-full ${loop1Active ? 'bg-sky-500 animate-ping' : 'bg-slate-300'}`} />
          <span className={loop1Active ? 'text-sky-700' : 'text-slate-400'}>L1</span>
          <span className="text-slate-300">·</span>
          <span className={`w-2 h-2 rounded-full ${loop2Active ? 'bg-amber-500 animate-ping' : 'bg-slate-300'}`} />
          <span className={loop2Active ? 'text-amber-700' : 'text-slate-400'}>L2</span>
        </div>

        {/* Desktop Loop 1 */}
        <div
          className={`hidden sm:flex px-3 py-1.5 rounded-2xl text-[11px] font-black border transition-all shadow-sm items-center gap-1.5 ${
            loop1Active
              ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-300/60'
              : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${loop1Active ? 'bg-white animate-ping' : 'bg-slate-300'}`} />
          <span>Loop 1: {loop1Active ? '🚙 MOBIL AKTIF' : 'KOSONG'}</span>
        </div>

        {/* Desktop Loop 2 */}
        <div
          className={`hidden sm:flex px-3 py-1.5 rounded-2xl text-[11px] font-black border transition-all shadow-sm items-center gap-1.5 ${
            loop2Active
              ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-300/60'
              : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${loop2Active ? 'bg-white animate-ping' : 'bg-slate-300'}`} />
          <span>Loop 2: {loop2Active ? '✨ SEDANG LEWAT' : 'KOSONG'}</span>
        </div>
      </div>

      {/* Mobile Subtle Top Status Chip */}
      <div className="sm:hidden absolute top-9 left-2 pointer-events-none z-20">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-700 shadow-2xs flex items-center gap-1.5">
          <span>Sudut: <strong className="text-rose-600">{gateAngle.toFixed(0)}°</strong></span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isRedTopOn ? 'bg-rose-500 shadow-[0_0_4px_#f43f5e]' : isGreenBottomOn ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-slate-400'}`} />
            <span>{isRedTopOn ? 'Merah Atas' : isGreenBottomOn ? 'Hijau Bawah' : 'Off All'}</span>
          </span>
        </div>
      </div>

      {/* Bottom Floating Telemetry Cards - Hidden on mobile to keep 3D scene 100% visible */}
      <div className="hidden sm:grid absolute bottom-5 left-5 right-5 grid-cols-4 gap-3 pointer-events-none z-20">
        {/* Card 1: Gate Angle & Traffic Signal State */}
        <div className="bg-white/95 backdrop-blur-md border-l-4 border-rose-500 border-t border-r border-b border-pink-100 p-3 rounded-2xl shadow-md">
          <div className="text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
            <span>Sudut & Lampu</span>
            {/* Visual Dual Aspect Lamp (Red top, Green bottom) */}
            <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-700">
              <span className={`w-2 h-2 rounded-full transition-all ${isRedTopOn ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-rose-950/60'}`} title="Merah Atas" />
              <span className={`w-2 h-2 rounded-full transition-all ${isGreenBottomOn ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-950/60'}`} title="Hijau Bawah" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-xl font-black text-rose-600">{gateAngle.toFixed(1)}°</span>
            <span className="text-[10px] font-extrabold text-slate-600">
              {isRedTopOn ? '🔴 Merah Atas' : isGreenBottomOn ? '🟢 Hijau Bawah' : '📴 Off All'}
            </span>
          </div>
          <div className="w-full bg-pink-100 h-2 mt-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-150 rounded-full" style={{ width: `${(gateAngle / 90) * 100}%` }} />
          </div>
        </div>

        {/* Card 2: Loop Sensor */}
        <div className="bg-white/95 backdrop-blur-md border-l-4 border-sky-500 border-t border-r border-b border-sky-100 p-3 rounded-2xl shadow-md">
          <div className="text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
            <span>Sensor Induktif 1</span>
            <span>🚙</span>
          </div>
          <div className={`text-base sm:text-lg font-black mt-0.5 ${loop1Active ? 'text-sky-600' : 'text-slate-400'}`}>
            {loop1Active ? 'TERDETEKSI' : 'STANDBY'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
            {loop1Active ? 'Mobil tepat di loop 1' : 'Menunggu kendaraan'}
          </div>
        </div>

        {/* Card 3: Motor Torque */}
        <div className="bg-white/95 backdrop-blur-md border-l-4 border-purple-500 border-t border-r border-b border-purple-100 p-3 rounded-2xl shadow-md">
          <div className="text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
            <span>Torsi Motor Servo</span>
            <span>⚙️</span>
          </div>
          <div className="text-base sm:text-lg font-black text-purple-600 mt-0.5">
            {gateAngle > 0 && gateAngle < 90 ? '4.2 Nm' : '0.0 Nm'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
            {gateAngle > 0 && gateAngle < 90 ? 'Motor sedang berputar' : 'Posisi Terkunci'}
          </div>
        </div>

        {/* Card 4: RFID Reader LCD */}
        <div className="bg-white/95 backdrop-blur-md border-l-4 border-emerald-500 border-t border-r border-b border-emerald-100 p-3 rounded-2xl shadow-md">
          <div className="text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
            <span>Layar RFID</span>
            <span>💳</span>
          </div>
          <div className={`text-xs font-black mt-1 truncate ${
            rfidDisplayText.status === 'success' ? 'text-emerald-600' : rfidDisplayText.status === 'error' ? 'text-rose-600' : 'text-slate-600'
          }`}>
            {rfidDisplayText.text}
          </div>
          <div className="text-[10px] text-slate-400 truncate font-semibold">{rfidDisplayText.subtext}</div>
        </div>
      </div>
    </div>
  );
};
