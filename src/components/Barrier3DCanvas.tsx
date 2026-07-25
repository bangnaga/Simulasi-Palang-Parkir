import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { CameraPreset, EnvironmentSetting, GateState, VehicleType } from '../types';
import { buildParkingScene, SceneContext } from '../lib/babylon/sceneBuilder';
import { createVehicle, VehicleMeshGroup } from '../lib/babylon/vehicleBuilder';

interface Barrier3DCanvasProps {
  vehicleZPos: number; // -16 to +15
  vehicleType: VehicleType;
  gateState: GateState;
  gateAngle: number; // 0 (closed) to 90 (open)
  cameraPreset: CameraPreset;
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

  // Initialize Babylon Scene on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = buildParkingScene(canvasRef.current);
    sceneCtxRef.current = ctx;

    // Create initial vehicle
    const vGroup = createVehicle(ctx.scene, ctx.shadowGenerator, vehicleType, '#1e3a8a');
    vGroup.root.position.set(-2.2, 0, vehicleZPos);
    vehicleGroupRef.current = vGroup;

    if (onSceneReady) onSceneReady();

    const handleResize = () => {
      ctx.engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ctx.engine.dispose();
    };
  }, []);

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

    const vGroup = createVehicle(ctx.scene, ctx.shadowGenerator, vehicleType, '#1e3a8a');
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

    // Update driver camera target follow if driver cam active
    if (sceneCtxRef.current && cameraPreset === 'driver') {
      sceneCtxRef.current.cameras.driver.position.set(-2.8, 1.45, vehicleZPos + 0.2);
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
      }
    }
  }, [cameraPreset]);

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
    <div className="relative w-full h-full overflow-hidden border-0 bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full outline-none touch-none cursor-grab active:cursor-grabbing" />

      {/* Top Left Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-sm text-[10px] uppercase font-bold tracking-widest text-cyan-400 font-mono shadow-lg">
          Live Visualization (Babylon.js)
        </div>
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-sm text-[10px] uppercase font-mono text-slate-300 shadow-lg">
          Cam: <span className="text-cyan-400 font-bold">{cameraPreset}</span>
        </div>
      </div>

      {/* Top Right Inductive Loop Indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase border transition-all shadow-lg flex items-center gap-2 ${
            loop1Active
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
              : 'bg-slate-900/80 border-slate-800 text-slate-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${loop1Active ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
          <span>Loop 1: {loop1Active ? 'CAR DETECTED' : 'CLEAR'}</span>
        </div>

        <div
          className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase border transition-all shadow-lg flex items-center gap-2 ${
            loop2Active
              ? 'bg-amber-950/90 border-amber-400 text-amber-200'
              : 'bg-slate-900/80 border-slate-800 text-slate-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${loop2Active ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
          <span>Loop 2: {loop2Active ? 'PASSING' : 'CLEAR'}</span>
        </div>
      </div>

      {/* Bottom Floating Geometric Telemetry Cards */}
      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pointer-events-none">
        {/* Card 1: Gate Angle */}
        <div className="bg-slate-900/90 backdrop-blur border-l-2 border-cyan-500 border-t border-r border-b border-slate-800 p-3 rounded-sm shadow-2xl">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">Gate Angle</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{gateAngle.toFixed(1)}°</div>
          <div className="w-full bg-slate-800 h-1 mt-2 rounded-none overflow-hidden">
            <div className="bg-cyan-400 h-full transition-all duration-150" style={{ width: `${(gateAngle / 90) * 100}%` }} />
          </div>
        </div>

        {/* Card 2: Loop Sensor */}
        <div className="bg-slate-900/90 backdrop-blur border-l-2 border-amber-500 border-t border-r border-b border-slate-800 p-3 rounded-sm shadow-2xl">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">Loop 1 Signal</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
            {loop1Active ? 'ACTIVE' : 'IDLE'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
            {loop1Active ? 'Vehicle in presence zone' : 'Awaiting Vehicle'}
          </div>
        </div>

        {/* Card 3: Motor Torque */}
        <div className="bg-slate-900/90 backdrop-blur border-l-2 border-slate-500 border-t border-r border-b border-slate-800 p-3 rounded-sm shadow-2xl">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">Motor Torque</div>
          <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">
            {gateAngle > 0 && gateAngle < 90 ? '4.2 Nm' : '0.0 Nm'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
            {gateAngle > 0 && gateAngle < 90 ? 'Servo Motor Active' : 'Normal Standby'}
          </div>
        </div>

        {/* Card 4: RFID Reader LCD */}
        <div className="bg-slate-900/90 backdrop-blur border-l-2 border-emerald-500 border-t border-r border-b border-slate-800 p-3 rounded-sm shadow-2xl">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">RFID Reader LCD</div>
          <div className={`text-sm font-bold font-mono mt-1 truncate ${
            rfidDisplayText.status === 'success' ? 'text-emerald-400' : rfidDisplayText.status === 'error' ? 'text-rose-400' : 'text-slate-300'
          }`}>
            {rfidDisplayText.text}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">{rfidDisplayText.subtext}</div>
        </div>
      </div>
    </div>
  );
};
