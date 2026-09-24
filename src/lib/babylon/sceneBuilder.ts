import * as BABYLON from '@babylonjs/core';
import { CameraPreset, EnvironmentSetting, GateState, RenderQuality } from '../../types';

export interface SceneContext {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  cameras: Record<CameraPreset, BABYLON.Camera>;
  activeCameraPreset: CameraPreset;
  shadowGenerator: BABYLON.ShadowGenerator;
  
  // Gate Mesh Components
  boomArmMesh: BABYLON.Mesh;
  boomPivotNode: BABYLON.TransformNode;
  gateDomeLightMat: BABYLON.StandardMaterial;
  gateDomeMesh: BABYLON.Mesh;

  // Inductive Loop Components
  loop1WireMat: BABYLON.StandardMaterial;
  loop2WireMat: BABYLON.StandardMaterial;
  loop1DecalMesh: BABYLON.Mesh;
  loop2DecalMesh: BABYLON.Mesh;

  // RFID Reader Components
  rfidReaderScreenTex: BABYLON.DynamicTexture;
  rfidLedRingMat: BABYLON.StandardMaterial;
  rfidCardMesh: BABYLON.Mesh;

  // Environmental Lights
  sunLight: BABYLON.DirectionalLight;
  hemiLight: BABYLON.HemisphericLight;
  streetLights: BABYLON.SpotLight[];

  // Method refs
  setEnvironmentMode: (env: EnvironmentSetting) => void;
  updateRfidDisplay: (text: string, subtext: string, status: 'idle' | 'success' | 'error') => void;
  setLoopActive: (loopIndex: 1 | 2, active: boolean) => void;
  setGateVisualState: (state: GateState, angleDegrees: number) => void;
  setRenderQuality: (quality: RenderQuality) => void;
}

export function buildParkingScene(canvas: HTMLCanvasElement): SceneContext {
  // Ultra-optimized Babylon.js Engine configuration for maximum FPS
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false, // Disabling preserveDrawingBuffer drastically improves GPU swapchain throughput
    stencil: false,               // Disable stencil buffer overhead
    powerPreference: 'high-performance',
    antialias: true,
    audioEngine: false,
    doNotHandleContextLost: true
  });
  engine.enableOfflineSupport = false;
  // Clamping hardware scaling prevents 3x/4x retina display GPU choke while maintaining crisp resolution
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.25));

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0); // Soft sky blue

  // Performance scene flags
  scene.collisionsEnabled = false; // Collision checks handled logically in App state
  scene.skipPointerMovePicking = true;
  scene.pointerMovePredicate = () => false;
  scene.particlesEnabled = false;
  scene.lensFlaresEnabled = false;
  scene.audioEnabled = false;
  scene.blockMaterialDirtyMechanism = true;
  scene.autoClearDepthAndStencil = false;

  // Helper to freeze static geometry world matrices and disable picking
  const optimizeStaticMesh = (mesh: BABYLON.AbstractMesh) => {
    mesh.freezeWorldMatrix();
    mesh.isPickable = false;
    mesh.doNotSyncBoundingInfo = true;
    mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
  };

  // ----------------------------------------------------
  // LIGHTS & SHADOWS
  // ----------------------------------------------------
  const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.25);

  const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-0.5, -1, -0.6), scene);
  sunLight.position = new BABYLON.Vector3(15, 30, 20);
  sunLight.intensity = 1.25;

  // Single-pass PCF shadow generator for high FPS
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, sunLight);
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
  shadowGenerator.transparencyShadow = false;

  // Realistic Emissive GlowLayer for neon LEDs, lights and loops (fast 0.25 downsampling)
  const glowLayer = new BABYLON.GlowLayer('glowLayer', scene, {
    mainTextureRatio: 0.25,
    blurKernelSize: 16
  });
  glowLayer.intensity = 0.75;

  const setRenderQuality = (quality: RenderQuality) => {
    if (quality === 'high_fps') {
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.25));
      shadowGenerator.usePercentageCloserFiltering = true;
      shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
      shadowGenerator.useBlurExponentialShadowMap = false;
      glowLayer.intensity = 0.65;
    } else if (quality === 'balanced') {
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
      shadowGenerator.usePercentageCloserFiltering = true;
      shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
      shadowGenerator.useBlurExponentialShadowMap = false;
      glowLayer.intensity = 0.75;
    } else if (quality === 'ultra') {
      engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
      shadowGenerator.usePercentageCloserFiltering = false;
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = 16;
      glowLayer.intensity = 0.95;
    }
  };

  // ----------------------------------------------------
  // CAMERAS
  // ----------------------------------------------------
  // 1. Orbit Cam (Interactive Free Rotate)
  const orbitCam = new BABYLON.ArcRotateCamera(
    'orbitCam',
    -Math.PI / 3,
    Math.PI / 3.2,
    14,
    new BABYLON.Vector3(-1.5, 1.2, -1.0),
    scene
  );
  orbitCam.attachControl(canvas, true);
  orbitCam.lowerRadiusLimit = 3;
  orbitCam.upperRadiusLimit = 35;
  orbitCam.lowerBetaLimit = 0.1;
  orbitCam.upperBetaLimit = Math.PI / 2 - 0.05;
  orbitCam.panningSensibility = 0;
  orbitCam.wheelPrecision = 40;

  // 2. Driver Chase Cam (Behind & above vehicle)
  const driverCam = new BABYLON.TargetCamera('driverCam', new BABYLON.Vector3(-2.2, 2.2, -18.0), scene);
  driverCam.setTarget(new BABYLON.Vector3(-2.2, 1.2, 0.0));

  // 3. Cockpit / Interior POV Cam (Inside HR-V behind steering wheel)
  const cockpitCam = new BABYLON.TargetCamera('cockpitCam', new BABYLON.Vector3(-1.9, 1.14, -15.65), scene);
  cockpitCam.setTarget(new BABYLON.Vector3(-2.2, 1.14, 0.0));
  cockpitCam.fov = 1.05; // Slightly wider human eye view

  // 4. Scanner Close-up Cam (RFID Tap Totem & LCD Screen)
  const scannerCam = new BABYLON.TargetCamera('scannerCam', new BABYLON.Vector3(-2.7, 1.45, -3.2), scene);
  scannerCam.setTarget(new BABYLON.Vector3(-3.45, 1.35, -2.2));

  // 5. ALPR / Plat Nomor Camera (Optical License Plate Recognition Scanner)
  const alprCam = new BABYLON.TargetCamera('alprCam', new BABYLON.Vector3(-2.2, 1.05, -0.6), scene);
  alprCam.setTarget(new BABYLON.Vector3(-2.2, 0.45, -2.8));

  // 6. Security CCTV Surveillance Cam (Overhead Wide-Angle Security Post)
  const cctvCam = new BABYLON.TargetCamera('cctvCam', new BABYLON.Vector3(-5.2, 4.4, -6.2), scene);
  cctvCam.setTarget(new BABYLON.Vector3(-2.2, 0.8, -1.0));
  cctvCam.fov = 1.02;

  // 7. Cinematic Hero Cam (Low-angle dramatic curb angle looking up at car & barrier)
  const cinematicCam = new BABYLON.TargetCamera('cinematicCam', new BABYLON.Vector3(-4.6, 0.45, -3.2), scene);
  cinematicCam.setTarget(new BABYLON.Vector3(-2.2, 1.15, 0.2));

  // 8. Wheel & Suspension Cam (Two-tone alloy wheel & speed bump traversal)
  const wheelCam = new BABYLON.TargetCamera('wheelCam', new BABYLON.Vector3(-1.0, 0.42, -14.8), scene);
  wheelCam.setTarget(new BABYLON.Vector3(-1.3, 0.36, -14.65));

  // 9. Top-down Aerial View Cam (90° bird's eye map)
  const topCam = new BABYLON.TargetCamera('topCam', new BABYLON.Vector3(-1.5, 22, -1.0), scene);
  topCam.setTarget(new BABYLON.Vector3(-1.5, 0, -1.0));

  // 10. Gate Mechanism Zoom Cam (MX-50 Cabinet & Arm Pivot)
  const gateCam = new BABYLON.TargetCamera('gateCam', new BABYLON.Vector3(-1.0, 1.8, -5.0), scene);
  gateCam.setTarget(new BABYLON.Vector3(-3.8, 1.2, 0));

  const cameras: Record<CameraPreset, BABYLON.Camera> = {
    orbit: orbitCam,
    driver: driverCam,
    cockpit: cockpitCam,
    scanner: scannerCam,
    alpr: alprCam,
    cctv: cctvCam,
    cinematic: cinematicCam,
    wheel: wheelCam,
    top: topCam,
    gate: gateCam
  };

  scene.activeCamera = orbitCam;

  // ----------------------------------------------------
  // GROUND, ROAD & PAVEMENT
  // ----------------------------------------------------
  // Grass ground
  const grassMat = new BABYLON.StandardMaterial('grassMat', scene);
  grassMat.diffuseColor = new BABYLON.Color3(0.25, 0.45, 0.2);
  grassMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  grassMat.freeze();

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 60 }, scene);
  ground.position.y = -0.01;
  ground.material = grassMat;
  ground.receiveShadows = true;
  optimizeStaticMesh(ground);

  // Main Asphalt Road
  const roadMat = new BABYLON.StandardMaterial('roadMat', scene);
  roadMat.diffuseColor = new BABYLON.Color3(0.12, 0.13, 0.15);
  roadMat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
  roadMat.freeze();

  const road = BABYLON.MeshBuilder.CreateGround('road', { width: 7.5, height: 50 }, scene);
  road.position.set(-1.8, 0, 0);
  road.material = roadMat;
  road.receiveShadows = true;
  optimizeStaticMesh(road);

  // White road boundary edge lines
  const whitePaintMat = new BABYLON.StandardMaterial('whitePaintMat', scene);
  whitePaintMat.diffuseColor = new BABYLON.Color3(0.92, 0.92, 0.95);
  whitePaintMat.freeze();

  const leftEdgeLine = BABYLON.MeshBuilder.CreateGround('leftEdgeLine', { width: 0.15, height: 48 }, scene);
  leftEdgeLine.position.set(-5.35, 0.003, 0);
  leftEdgeLine.material = whitePaintMat;
  optimizeStaticMesh(leftEdgeLine);

  const rightEdgeLine = BABYLON.MeshBuilder.CreateGround('rightEdgeLine', { width: 0.15, height: 48 }, scene);
  rightEdgeLine.position.set(1.75, 0.003, 0);
  rightEdgeLine.material = whitePaintMat;
  optimizeStaticMesh(rightEdgeLine);

  // White dashed lane markings
  for (let z = -20; z <= 20; z += 5) {
    if (Math.abs(z) > 4) { // Don't draw over the barrier junction
      const dash = BABYLON.MeshBuilder.CreateGround(`dash_${z}`, { width: 0.15, height: 2.5 }, scene);
      dash.position.set(1.75, 0.003, z);
      dash.material = whitePaintMat;
      optimizeStaticMesh(dash);
    }
  }

  // Directional Forward Arrow decal before gate
  const arrowStem = BABYLON.MeshBuilder.CreateGround('arrowStem', { width: 0.35, height: 2.2 }, scene);
  arrowStem.position.set(-2.2, 0.004, -10.5);
  arrowStem.material = whitePaintMat;
  optimizeStaticMesh(arrowStem);

  const arrowHead = BABYLON.MeshBuilder.CreateGround('arrowHead', { width: 1.1, height: 1.1 }, scene);
  arrowHead.position.set(-2.2, 0.004, -9.0);
  arrowHead.rotation.y = Math.PI / 4;
  arrowHead.material = whitePaintMat;
  optimizeStaticMesh(arrowHead);

  // Smooth-Shaded Rounded Speed Bump (Polisi Tidur) with soft bevels
  const bumpMatYellow = new BABYLON.StandardMaterial('bumpMatYellow', scene);
  bumpMatYellow.diffuseColor = new BABYLON.Color3(0.95, 0.78, 0.08);
  bumpMatYellow.freeze();

  const bumpMatBlack = new BABYLON.StandardMaterial('bumpMatBlack', scene);
  bumpMatBlack.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.14);
  bumpMatBlack.freeze();

  const speedBumpSegs = 7;
  const segWidth = 3.6 / speedBumpSegs;
  for (let i = 0; i < speedBumpSegs; i++) {
    const bumpSeg = BABYLON.MeshBuilder.CreateCapsule(`bumpSeg_${i}`, {
      radius: 0.045,
      height: segWidth * 0.96,
      tessellation: 16
    }, scene);
    bumpSeg.rotation.z = Math.PI / 2;
    bumpSeg.position.set(-3.8 + i * segWidth + segWidth / 2, 0.025, -7.5);
    bumpSeg.material = i % 2 === 0 ? bumpMatYellow : bumpMatBlack;
    bumpSeg.receiveShadows = true;
    optimizeStaticMesh(bumpSeg);
  }

  // Curbs / Sidewalk
  const curbMat = new BABYLON.StandardMaterial('curbMat', scene);
  curbMat.diffuseColor = new BABYLON.Color3(0.72, 0.74, 0.78);
  curbMat.freeze();

  const leftCurb = BABYLON.MeshBuilder.CreateBox('leftCurb', { width: 4.5, height: 0.25, depth: 50 }, scene);
  leftCurb.position.set(-7.5, 0.125, 0);
  leftCurb.material = curbMat;
  leftCurb.receiveShadows = true;
  optimizeStaticMesh(leftCurb);

  const rightCurb = BABYLON.MeshBuilder.CreateBox('rightCurb', { width: 4.5, height: 0.25, depth: 50 }, scene);
  rightCurb.position.set(4.2, 0.125, 0);
  rightCurb.material = curbMat;
  rightCurb.receiveShadows = true;
  optimizeStaticMesh(rightCurb);

  // Black and Yellow Curb Safety Stripes
  const curbStripeMat = new BABYLON.StandardMaterial('curbStripeMat', scene);
  curbStripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.75, 0.1);
  curbStripeMat.freeze();

  for (let z = -5; z <= 5; z += 1.2) {
    const curbStripe = BABYLON.MeshBuilder.CreateBox(`cStripe_${z}`, { width: 0.12, height: 0.26, depth: 0.6 }, scene);
    curbStripe.position.set(-5.3, 0.13, z);
    curbStripe.material = curbStripeMat;
    optimizeStaticMesh(curbStripe);
  }

  // ----------------------------------------------------
  // CONCRETE MEDIAN SAFETY ISLAND (PULAU PARKIR)
  // Protects the Barrier Gate and RFID Pedestal
  // ----------------------------------------------------
  const islandMat = new BABYLON.StandardMaterial('islandMat', scene);
  islandMat.diffuseColor = new BABYLON.Color3(0.80, 0.82, 0.86);
  islandMat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  islandMat.freeze();

  const islandLength = 8.2;
  const islandWidth = 1.0;
  const islandHeight = 0.15;
  const islandX = -4.0;
  const islandZ = -0.5;

  const islandMesh = BABYLON.MeshBuilder.CreateBox('islandMesh', {
    width: islandWidth,
    height: islandHeight,
    depth: islandLength
  }, scene);
  islandMesh.position.set(islandX, islandHeight / 2, islandZ);
  islandMesh.material = islandMat;
  islandMesh.receiveShadows = true;
  shadowGenerator.addShadowCaster(islandMesh);
  optimizeStaticMesh(islandMesh);

  // Rounded bullnose ends for safety island
  const bullnoseFront = BABYLON.MeshBuilder.CreateCylinder('bullnoseFront', {
    diameter: islandWidth,
    height: islandHeight,
    tessellation: 20
  }, scene);
  bullnoseFront.position.set(islandX, islandHeight / 2, islandZ - islandLength / 2);
  bullnoseFront.material = islandMat;
  bullnoseFront.receiveShadows = true;
  optimizeStaticMesh(bullnoseFront);

  const bullnoseRear = BABYLON.MeshBuilder.CreateCylinder('bullnoseRear', {
    diameter: islandWidth,
    height: islandHeight,
    tessellation: 20
  }, scene);
  bullnoseRear.position.set(islandX, islandHeight / 2, islandZ + islandLength / 2);
  bullnoseRear.material = islandMat;
  bullnoseRear.receiveShadows = true;
  optimizeStaticMesh(bullnoseRear);

  // Alternating black & yellow safety hazard stripes along island curbs
  for (let z = islandZ - islandLength / 2 + 0.3; z <= islandZ + islandLength / 2 - 0.3; z += 0.8) {
    const isYel = Math.round((z + 10) / 0.8) % 2 === 0;
    const islStripe = BABYLON.MeshBuilder.CreateBox(`islStripe_${z.toFixed(1)}`, {
      width: 0.06,
      height: islandHeight + 0.01,
      depth: 0.4
    }, scene);
    islStripe.position.set(islandX + islandWidth / 2 + 0.02, islandHeight / 2, z);
    islStripe.material = isYel ? bumpMatYellow : bumpMatBlack;
    optimizeStaticMesh(islStripe);
  }

  // Safety Bollards - Smooth-shaded capsules with soft rounded dome tops
  const bollardMat = new BABYLON.StandardMaterial('bollardMat', scene);
  bollardMat.diffuseColor = new BABYLON.Color3(0.95, 0.4, 0.05); // High-vis orange
  bollardMat.freeze();

  const bollardStripeMat = new BABYLON.StandardMaterial('bollardStripeMat', scene);
  bollardStripeMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
  bollardStripeMat.freeze();

  const createSafetyBollard = (pos: BABYLON.Vector3, name: string) => {
    const post = BABYLON.MeshBuilder.CreateCapsule(`bollard_${name}`, {
      radius: 0.075,
      height: 0.85,
      tessellation: 20
    }, scene);
    post.position.set(pos.x, pos.y + 0.425, pos.z);
    post.material = bollardMat;
    optimizeStaticMesh(post);

    const stripe1 = BABYLON.MeshBuilder.CreateCylinder(`bStripe_${name}`, {
      diameter: 0.158,
      height: 0.12,
      tessellation: 20
    }, scene);
    stripe1.position.set(pos.x, pos.y + 0.55, pos.z);
    stripe1.material = bollardStripeMat;
    optimizeStaticMesh(stripe1);
  };

  createSafetyBollard(new BABYLON.Vector3(-4.9, 0.25, -4.5), 'b1');
  createSafetyBollard(new BABYLON.Vector3(-4.9, 0.25, -1.0), 'b2');
  createSafetyBollard(new BABYLON.Vector3(-4.9, 0.25, 2.0), 'b3');
  createSafetyBollard(new BABYLON.Vector3(-4.9, 0.25, 4.5), 'b4');

  // Yellow Box Junction Grid at Barrier Zone
  const yellowGridMat = new BABYLON.StandardMaterial('yellowGridMat', scene);
  yellowGridMat.diffuseColor = new BABYLON.Color3(0.92, 0.78, 0.08);
  yellowGridMat.freeze();

  const stopLine = BABYLON.MeshBuilder.CreateGround('stopLine', { width: 3.4, height: 0.4 }, scene);
  stopLine.position.set(-2.2, 0.005, -3.2);
  stopLine.material = yellowGridMat;
  optimizeStaticMesh(stopLine);

  // ----------------------------------------------------
  // INDUCTIVE LOOP DETECTORS (Loop 1 & Loop 2 Wire Cuts)
  // ----------------------------------------------------
  // Materials for Inductive Loops
  const loop1WireMat = new BABYLON.StandardMaterial('loop1WireMat', scene);
  loop1WireMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  loop1WireMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const loop2WireMat = new BABYLON.StandardMaterial('loop2WireMat', scene);
  loop2WireMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  loop2WireMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  // Loop 1 Decal / Wire Cut (Pre-barrier presence loop) - Reduced 50%
  const loop1DecalMesh = BABYLON.MeshBuilder.CreateGround('loop1Cut', { width: 1.1, height: 2.4 }, scene);
  loop1DecalMesh.position.set(-2.2, 0.006, -4.0);
  loop1DecalMesh.material = loop1WireMat;
  optimizeStaticMesh(loop1DecalMesh);

  // Loop 1 Inner Wire border box line
  const loop1Line = BABYLON.MeshBuilder.CreateLines('loop1Line', {
    points: [
      new BABYLON.Vector3(-2.75, 0.01, -5.2),
      new BABYLON.Vector3(-1.65, 0.01, -5.2),
      new BABYLON.Vector3(-1.65, 0.01, -2.8),
      new BABYLON.Vector3(-2.75, 0.01, -2.8),
      new BABYLON.Vector3(-2.75, 0.01, -5.2)
    ]
  }, scene);
  loop1Line.color = new BABYLON.Color3(0.3, 0.8, 1.0);
  optimizeStaticMesh(loop1Line);

  // Loop 2 Decal / Wire Cut (Passage & Safety loop under/after boom) - Reduced 50%
  const loop2DecalMesh = BABYLON.MeshBuilder.CreateGround('loop2Cut', { width: 1.1, height: 1.8 }, scene);
  loop2DecalMesh.position.set(-2.2, 0.006, 2.5);
  loop2DecalMesh.material = loop2WireMat;
  optimizeStaticMesh(loop2DecalMesh);

  const loop2Line = BABYLON.MeshBuilder.CreateLines('loop2Line', {
    points: [
      new BABYLON.Vector3(-2.75, 0.01, 1.6),
      new BABYLON.Vector3(-1.65, 0.01, 1.6),
      new BABYLON.Vector3(-1.65, 0.01, 3.4),
      new BABYLON.Vector3(-2.75, 0.01, 3.4),
      new BABYLON.Vector3(-2.75, 0.01, 1.6)
    ]
  }, scene);
  loop2Line.color = new BABYLON.Color3(1.0, 0.6, 0.1);
  optimizeStaticMesh(loop2Line);

  // Loop 3D Marker Sign Posts next to road
  const createLoopSign = (name: string, pos: BABYLON.Vector3, color: BABYLON.Color3) => {
    const pole = BABYLON.MeshBuilder.CreateCylinder(`pole_${name}`, { diameter: 0.06, height: 1.2 }, scene);
    pole.position.set(pos.x, pos.y + 0.6, pos.z);
    
    const poleMat = new BABYLON.StandardMaterial(`poleMat_${name}`, scene);
    poleMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    poleMat.freeze();
    pole.material = poleMat;
    optimizeStaticMesh(pole);

    const box = BABYLON.MeshBuilder.CreateBox(`box_${name}`, { width: 0.6, height: 0.35, depth: 0.08 }, scene);
    box.position.set(pos.x, pos.y + 1.2, pos.z);
    
    const boxMat = new BABYLON.StandardMaterial(`boxMat_${name}`, scene);
    boxMat.diffuseColor = color;
    boxMat.freeze();
    box.material = boxMat;
    optimizeStaticMesh(box);
  };

  createLoopSign('L1', new BABYLON.Vector3(-3.8, 0, -6.0), new BABYLON.Color3(0.1, 0.5, 0.8));
  createLoopSign('L2', new BABYLON.Vector3(-3.8, 0, 2.5), new BABYLON.Color3(0.8, 0.4, 0.1));

  // ----------------------------------------------------
  // BARRIER GATE HOUSING & BOOM ARM (MX-50 Gate)
  // ----------------------------------------------------
  const gateHousingMat = new BABYLON.StandardMaterial('gateHousingMat', scene);
  gateHousingMat.diffuseColor = new BABYLON.Color3(0.92, 0.44, 0.06); // Industrial Safety Orange
  gateHousingMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  gateHousingMat.freeze();

  // Heavy Duty Cast Metal Mounting Baseplate
  const hubMat = new BABYLON.StandardMaterial('hubMat', scene);
  hubMat.diffuseColor = new BABYLON.Color3(0.18, 0.20, 0.24);
  hubMat.specularColor = new BABYLON.Color3(0.7, 0.7, 0.75);
  hubMat.freeze();

  const gateBasePlate = BABYLON.MeshBuilder.CreateBox('gateBasePlate', { width: 0.65, height: 0.05, depth: 0.65 }, scene);
  gateBasePlate.position.set(-3.8, 0.175, 0);
  gateBasePlate.material = hubMat;
  optimizeStaticMesh(gateBasePlate);

  // 4 Corner Anchor Hex Bolts
  [-0.26, 0.26].forEach(bx => {
    [-0.26, 0.26].forEach(bz => {
      const bolt = BABYLON.MeshBuilder.CreateCylinder(`gBolt_${bx}_${bz}`, { diameter: 0.04, height: 0.06, tessellation: 6 }, scene);
      bolt.position.set(-3.8 + bx, 0.21, bz);
      bolt.material = hubMat;
      optimizeStaticMesh(bolt);
    });
  });

  const gateHousing = BABYLON.MeshBuilder.CreateBox('gateHousing', { width: 0.55, height: 1.25, depth: 0.55 }, scene);
  gateHousing.position.set(-3.8, 0.625, 0);
  gateHousing.material = gateHousingMat;
  shadowGenerator.addShadowCaster(gateHousing);
  optimizeStaticMesh(gateHousing);

  // Access Door Seam Panel on Rear Face
  const gateDoor = BABYLON.MeshBuilder.CreateBox('gateDoor', { width: 0.02, height: 0.85, depth: 0.44 }, scene);
  gateDoor.position.set(-4.08, 0.60, 0);
  gateDoor.material = hubMat;
  optimizeStaticMesh(gateDoor);

  // Keyhole Lock Cylinder
  const keyHole = BABYLON.MeshBuilder.CreateCylinder('keyHole', { diameter: 0.03, height: 0.03 }, scene);
  keyHole.rotation.z = Math.PI / 2;
  keyHole.position.set(-4.09, 0.75, 0.14);
  keyHole.material = hubMat;
  optimizeStaticMesh(keyHole);

  // Side Ventilation Louvers (Cooling for servo motor)
  for (let l = 0; l < 4; l++) {
    const louver = BABYLON.MeshBuilder.CreateBox(`louver_${l}`, { width: 0.36, height: 0.015, depth: 0.02 }, scene);
    louver.position.set(-3.8, 0.88 + l * 0.04, 0.28);
    louver.material = hubMat;
    optimizeStaticMesh(louver);
  }

  // Emergency Stop Switch
  const eStopMat = new BABYLON.StandardMaterial('eStopMat', scene);
  eStopMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
  eStopMat.freeze();

  const eStop = BABYLON.MeshBuilder.CreateCylinder('eStop', { diameter: 0.05, height: 0.03 }, scene);
  eStop.rotation.x = Math.PI / 2;
  eStop.position.set(-3.8, 1.08, 0.28);
  eStop.material = eStopMat;
  optimizeStaticMesh(eStop);

  // Soft rounded dome cap on gate cabinet (smooth-shaded)
  const gateHousingCap = BABYLON.MeshBuilder.CreateSphere('gateHousingCap', {
    diameterX: 0.54,
    diameterY: 0.18,
    diameterZ: 0.54,
    segments: 16
  }, scene);
  gateHousingCap.position.set(-3.8, 1.25, 0);
  gateHousingCap.material = gateHousingMat;
  optimizeStaticMesh(gateHousingCap);

  // Motor Pivot Node
  const boomPivotNode = new BABYLON.TransformNode('boomPivotNode', scene);
  boomPivotNode.position.set(-3.8, 1.12, 0);

  // Metal Motor Hub with Mounting Flange & Chrome Hex Clamping Bolts
  const hub = BABYLON.MeshBuilder.CreateCylinder('hub', { diameter: 0.24, height: 0.25, tessellation: 20 }, scene);
  hub.rotation.z = Math.PI / 2;
  hub.parent = boomPivotNode;
  hub.material = hubMat;
  hub.isPickable = false;

  const hubFlange = BABYLON.MeshBuilder.CreateCylinder('hubFlange', { diameter: 0.30, height: 0.04, tessellation: 20 }, scene);
  hubFlange.rotation.z = Math.PI / 2;
  hubFlange.position.x = 0.10;
  hubFlange.parent = boomPivotNode;
  hubFlange.material = hubMat;
  hubFlange.isPickable = false;

  // Boom Arm Pole (4.2m)
  const boomArmMat = new BABYLON.StandardMaterial('boomArmMat', scene);
  boomArmMat.diffuseColor = new BABYLON.Color3(0.96, 0.96, 0.98);
  boomArmMat.freeze();

  const boomArmMesh = BABYLON.MeshBuilder.CreateBox('boomArm', { width: 4.2, height: 0.12, depth: 0.06 }, scene);
  boomArmMesh.position.set(2.1, 0, 0);
  boomArmMesh.parent = boomPivotNode;
  boomArmMesh.material = boomArmMat;
  boomArmMesh.isPickable = false;
  boomArmMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
  shadowGenerator.addShadowCaster(boomArmMesh);

  // Red reflective stripes on boom arm
  const redStripeMat = new BABYLON.StandardMaterial('redStripeMat', scene);
  redStripeMat.diffuseColor = new BABYLON.Color3(0.85, 0.08, 0.08);
  redStripeMat.freeze();

  for (let i = 0; i < 5; i++) {
    const stripe = BABYLON.MeshBuilder.CreateBox(`stripe_${i}`, { width: 0.35, height: 0.122, depth: 0.065 }, scene);
    stripe.position.set(0.6 + i * 0.7, 0, 0);
    stripe.parent = boomPivotNode;
    stripe.material = redStripeMat;
    stripe.isPickable = false;
  }

  // Soft Rubber Safety Edge Buffer along bottom of the boom arm
  const boomRubberMat = new BABYLON.StandardMaterial('boomRubberMat', scene);
  boomRubberMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);
  boomRubberMat.freeze();

  const boomRubber = BABYLON.MeshBuilder.CreateBox('boomRubber', { width: 4.18, height: 0.02, depth: 0.062 }, scene);
  boomRubber.position.set(2.1, -0.07, 0);
  boomRubber.parent = boomPivotNode;
  boomRubber.material = boomRubberMat;
  boomRubber.isPickable = false;

  // Rubber End Cap
  const boomCap = BABYLON.MeshBuilder.CreateBox('boomCap', { width: 0.04, height: 0.13, depth: 0.07 }, scene);
  boomCap.position.set(4.2, 0, 0);
  boomCap.parent = boomPivotNode;
  boomCap.material = boomRubberMat;
  boomCap.isPickable = false;

  // Continuous Low-Poly LED Light Strip along the underside of the boom arm
  const boomLedMat = new BABYLON.StandardMaterial('boomLedMat', scene);
  boomLedMat.diffuseColor = new BABYLON.Color3(0.95, 0.1, 0.1);
  boomLedMat.emissiveColor = new BABYLON.Color3(1.0, 0.1, 0.1);

  const boomLedStrip = BABYLON.MeshBuilder.CreateBox('boomLedStrip', { width: 4.15, height: 0.025, depth: 0.07 }, scene);
  boomLedStrip.position.set(2.1, -0.065, 0);
  boomLedStrip.parent = boomPivotNode;
  boomLedStrip.material = boomLedMat;
  boomLedStrip.isPickable = false;

  // Top LED Signal Light Dome on Cabinet
  const gateDomeMat = new BABYLON.StandardMaterial('gateDomeMat', scene);
  gateDomeMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
  gateDomeMat.emissiveColor = new BABYLON.Color3(0.8, 0.1, 0.1);

  const gateDomeMesh = BABYLON.MeshBuilder.CreateSphere('gateDome', { diameter: 0.18 }, scene);
  gateDomeMesh.position.set(-3.8, 1.32, 0);
  gateDomeMesh.material = gateDomeMat;
  gateDomeMesh.isPickable = false;

  // ----------------------------------------------------
  // RFID SCANNER PEDESTAL
  // ----------------------------------------------------
  const rfidPostMat = new BABYLON.StandardMaterial('rfidPostMat', scene);
  rfidPostMat.diffuseColor = new BABYLON.Color3(0.18, 0.20, 0.26);
  rfidPostMat.freeze();

  const rfidPost = BABYLON.MeshBuilder.CreateBox('rfidPost', { width: 0.35, height: 1.35, depth: 0.35 }, scene);
  rfidPost.position.set(-3.8, 0.675, -2.2);
  rfidPost.material = rfidPostMat;
  shadowGenerator.addShadowCaster(rfidPost);
  optimizeStaticMesh(rfidPost);

  // Angled Reader Head
  const rfidHead = BABYLON.MeshBuilder.CreateBox('rfidHead', { width: 0.42, height: 0.45, depth: 0.28 }, scene);
  rfidHead.position.set(-3.65, 1.35, -2.2);
  rfidHead.rotation.y = -Math.PI / 10;
  rfidHead.material = rfidPostMat;
  optimizeStaticMesh(rfidHead);

  // Anti-Glare Protective Visor Hood
  const visor = BABYLON.MeshBuilder.CreateBox('rfidVisor', { width: 0.44, height: 0.04, depth: 0.16 }, scene);
  visor.position.set(-3.56, 1.57, -2.2);
  visor.rotation.y = -Math.PI / 10;
  visor.rotation.z = -0.15;
  visor.material = rfidPostMat;
  optimizeStaticMesh(visor);

  // Speaker Grille Slits
  for (let s = 0; s < 3; s++) {
    const spk = BABYLON.MeshBuilder.CreateBox(`spk_${s}`, { width: 0.16, height: 0.012, depth: 0.01 }, scene);
    spk.position.set(-3.45, 1.08 - s * 0.03, -2.2);
    spk.rotation.y = Math.PI / 2 - Math.PI / 10;
    spk.material = hubMat;
    optimizeStaticMesh(spk);
  }

  // Reader LCD Display Screen
  const screenMat = new BABYLON.StandardMaterial('rfidScreenMat', scene);
  const rfidReaderScreenTex = new BABYLON.DynamicTexture('rfidScreenTex', { width: 512, height: 256 }, scene);
  rfidReaderScreenTex.hasAlpha = false;
  screenMat.diffuseTexture = rfidReaderScreenTex;
  screenMat.emissiveTexture = rfidReaderScreenTex;

  const rfidScreen = BABYLON.MeshBuilder.CreatePlane('rfidScreen', { width: 0.36, height: 0.22 }, scene);
  rfidScreen.position.set(-3.43, 1.42, -2.2);
  rfidScreen.rotation.y = Math.PI / 2 - Math.PI / 10;
  rfidScreen.material = screenMat;
  optimizeStaticMesh(rfidScreen);

  // RFID LED Status Ring
  const rfidLedRingMat = new BABYLON.StandardMaterial('rfidLedRingMat', scene);
  rfidLedRingMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  rfidLedRingMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);

  const rfidLed = BABYLON.MeshBuilder.CreateSphere('rfidLed', { diameter: 0.08 }, scene);
  rfidLed.position.set(-3.43, 1.25, -2.2);
  rfidLed.material = rfidLedRingMat;
  rfidLed.isPickable = false;

  // Dynamic Texture drawing helper
  const updateRfidDisplay = (text: string, subtext: string, status: 'idle' | 'success' | 'error') => {
    const ctx = rfidReaderScreenTex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = '#0f172a'; // dark navy background
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 12;
    ctx.strokeRect(8, 8, 496, 240);

    // Header bar
    ctx.fillStyle = status === 'success' ? '#15803d' : status === 'error' ? '#b91c1c' : '#1e40af';
    ctx.fillRect(16, 16, 480, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POS PARKIR RFID 01', 256, 50);

    // Main text
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = status === 'success' ? '#4ade80' : status === 'error' ? '#fca5a5' : '#93c5fd';
    ctx.fillText(text, 256, 128);

    // Subtext / Balance
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtext, 256, 185);

    rfidReaderScreenTex.update();

    // Sync LED indicator ring on scanner
    if (status === 'success') {
      rfidLedRingMat.diffuseColor = new BABYLON.Color3(0.05, 1.0, 0.25);
      rfidLedRingMat.emissiveColor = new BABYLON.Color3(0.05, 1.0, 0.25);
    } else if (status === 'error') {
      rfidLedRingMat.diffuseColor = new BABYLON.Color3(1.0, 0.08, 0.08);
      rfidLedRingMat.emissiveColor = new BABYLON.Color3(1.0, 0.08, 0.08);
    } else {
      rfidLedRingMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
      rfidLedRingMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);
    }
  };

  updateRfidDisplay('TEMPELKAN KARTU', 'Menunggu RFID...', 'idle');

  // ----------------------------------------------------
  // 3D FLOATING RFID CARD MESH (Interactive)
  // ----------------------------------------------------
  const cardMat = new BABYLON.StandardMaterial('rfidCardMat', scene);
  cardMat.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.9);
  cardMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

  const rfidCardMesh = BABYLON.MeshBuilder.CreateBox('rfidCard3D', { width: 0.28, height: 0.18, depth: 0.01 }, scene);
  rfidCardMesh.position.set(-2.8, 1.35, -2.2);
  rfidCardMesh.rotation.y = Math.PI / 2;
  rfidCardMesh.material = cardMat;
  rfidCardMesh.isPickable = false;

  // Card texture
  const cardTex = new BABYLON.DynamicTexture('cardTex', { width: 256, height: 160 }, scene);
  cardTex.hasAlpha = false;
  cardMat.diffuseTexture = cardTex;
  const cctx = cardTex.getContext();
  cctx.fillStyle = '#1e3a8a';
  cctx.fillRect(0, 0, 256, 160);
  cctx.fillStyle = '#3b82f6';
  cctx.fillRect(0, 100, 256, 60);
  cctx.fillStyle = '#ffffff';
  cctx.font = 'bold 22px sans-serif';
  cctx.fillText('RFID ACCESS', 15, 35);
  cctx.font = '16px monospace';
  cctx.fillText('ID: 8829-3011', 15, 75);
  cardTex.update();
  cardMat.freeze();

  // ----------------------------------------------------
  // GUARD BOOTH & ARCHITECTURAL CANOPY (POS PARKIR MODERN)
  // ----------------------------------------------------
  // Main booth building structure
  const boothBuilding = BABYLON.MeshBuilder.CreateBox('boothBuilding', { width: 2.2, height: 2.6, depth: 2.4 }, scene);
  boothBuilding.position.set(-6.5, 1.3, 0);

  const boothMat = new BABYLON.StandardMaterial('boothMat', scene);
  boothMat.diffuseColor = new BABYLON.Color3(0.18, 0.22, 0.28); // Slate navy architecture
  boothMat.freeze();
  boothBuilding.material = boothMat;
  shadowGenerator.addShadowCaster(boothBuilding);
  optimizeStaticMesh(boothBuilding);

  // Booth Base Foundation plinth
  const boothBaseMat = new BABYLON.StandardMaterial('boothBaseMat', scene);
  boothBaseMat.diffuseColor = new BABYLON.Color3(0.1, 0.12, 0.15);
  boothBaseMat.freeze();
  const boothBase = BABYLON.MeshBuilder.CreateBox('boothBase', { width: 2.3, height: 0.3, depth: 2.5 }, scene);
  boothBase.position.set(-6.5, 0.15, 0);
  boothBase.material = boothBaseMat;
  optimizeStaticMesh(boothBase);

  // Booth Window Glass & Doors
  const boothGlassMat = new BABYLON.StandardMaterial('boothGlassMat', scene);
  boothGlassMat.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.55);
  boothGlassMat.alpha = 0.5;
  boothGlassMat.freeze();

  // Front Window (Facing lane)
  const boothWindowFront = BABYLON.MeshBuilder.CreatePlane('boothWindowFront', { width: 1.8, height: 1.3 }, scene);
  boothWindowFront.position.set(-5.39, 1.55, 0);
  boothWindowFront.rotation.y = Math.PI / 2;
  boothWindowFront.material = boothGlassMat;
  optimizeStaticMesh(boothWindowFront);

  // Side Window (Left)
  const boothWindowLeft = BABYLON.MeshBuilder.CreatePlane('boothWindowLeft', { width: 1.6, height: 1.3 }, scene);
  boothWindowLeft.position.set(-6.5, 1.55, -1.21);
  boothWindowLeft.material = boothGlassMat;
  optimizeStaticMesh(boothWindowLeft);

  // Side Window (Right)
  const boothWindowRight = BABYLON.MeshBuilder.CreatePlane('boothWindowRight', { width: 1.6, height: 1.3 }, scene);
  boothWindowRight.position.set(-6.5, 1.55, 1.21);
  boothWindowRight.rotation.y = Math.PI;
  boothWindowRight.material = boothGlassMat;
  optimizeStaticMesh(boothWindowRight);

  // Guard Door (Pintu Pos Petugas) on the rear side
  const doorMat = new BABYLON.StandardMaterial('doorMat', scene);
  doorMat.diffuseColor = new BABYLON.Color3(0.24, 0.28, 0.35);
  doorMat.freeze();

  const guardDoor = BABYLON.MeshBuilder.CreateBox('guardDoor', { width: 0.08, height: 2.1, depth: 0.9 }, scene);
  guardDoor.position.set(-7.56, 1.15, 0);
  guardDoor.material = doorMat;
  optimizeStaticMesh(guardDoor);

  // Door Frame Trim
  const shelfMat = new BABYLON.StandardMaterial('shelfMat', scene);
  shelfMat.diffuseColor = new BABYLON.Color3(0.8, 0.82, 0.85);
  shelfMat.freeze();

  const doorFrame = BABYLON.MeshBuilder.CreateBox('doorFrame', { width: 0.1, height: 2.15, depth: 0.98 }, scene);
  doorFrame.position.set(-7.55, 1.15, 0);
  doorFrame.material = shelfMat;
  optimizeStaticMesh(doorFrame);

  // Door Handle
  const handleMat = new BABYLON.StandardMaterial('handleMat', scene);
  handleMat.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.9);
  handleMat.specularColor = new BABYLON.Color3(1, 1, 1);
  handleMat.freeze();

  const doorHandle = BABYLON.MeshBuilder.CreateCylinder('doorHandle', { diameter: 0.03, height: 0.15 }, scene);
  doorHandle.rotation.x = Math.PI / 2;
  doorHandle.position.set(-7.50, 1.15, 0.35);
  doorHandle.material = handleMat;
  optimizeStaticMesh(doorHandle);

  // Interior Cashier Desk visible through glass
  const desk = BABYLON.MeshBuilder.CreateBox('guardDesk', { width: 1.2, height: 0.8, depth: 0.6 }, scene);
  desk.position.set(-6.0, 0.5, 0.5);
  desk.material = shelfMat;
  optimizeStaticMesh(desk);

  // Cashier Shelf / Counter Ledge
  const counterShelf = BABYLON.MeshBuilder.CreateBox('counterShelf', { width: 0.35, height: 0.06, depth: 1.8 }, scene);
  counterShelf.position.set(-5.3, 0.95, 0);
  counterShelf.material = shelfMat;
  optimizeStaticMesh(counterShelf);

  // Modern Overhead Cantilever Canopy (Roof extending over the barrier lane)
  const canopyMat = new BABYLON.StandardMaterial('canopyMat', scene);
  canopyMat.diffuseColor = new BABYLON.Color3(0.14, 0.18, 0.24);
  canopyMat.freeze();

  const canopyRoof = BABYLON.MeshBuilder.CreateBox('canopyRoof', { width: 6.8, height: 0.28, depth: 6.2 }, scene);
  canopyRoof.position.set(-4.2, 4.15, 0);
  canopyRoof.material = canopyMat;
  shadowGenerator.addShadowCaster(canopyRoof);
  optimizeStaticMesh(canopyRoof);

  // Steel Canopy Support Pillars
  const steelColumnMat = new BABYLON.StandardMaterial('steelColumnMat', scene);
  steelColumnMat.diffuseColor = new BABYLON.Color3(0.25, 0.28, 0.32);
  steelColumnMat.freeze();

  const createSteelColumn = (name: string, pos: BABYLON.Vector3) => {
    const col = BABYLON.MeshBuilder.CreateBox(`col_${name}`, { width: 0.22, height: 4.0, depth: 0.22 }, scene);
    col.position.set(pos.x, 2.0, pos.z);
    col.material = steelColumnMat;
    optimizeStaticMesh(col);
  };
  createSteelColumn('c1', new BABYLON.Vector3(-5.3, 0, -2.6));
  createSteelColumn('c2', new BABYLON.Vector3(-5.3, 0, 2.6));

  // Canopy Underside Downlight (illuminating vehicle area)
  const canopyLight = new BABYLON.SpotLight(
    'canopyDownLight',
    new BABYLON.Vector3(-2.5, 4.0, 0),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI / 2.2,
    2,
    scene
  );
  canopyLight.intensity = 4;
  canopyLight.diffuse = new BABYLON.Color3(0.98, 0.96, 0.88);

  // Overhead Illuminated Electronic Lane Signage
  const overheadSignMat = new BABYLON.StandardMaterial('overheadSignMat', scene);
  const overheadSignTex = new BABYLON.DynamicTexture('overheadSignTex', { width: 512, height: 128 }, scene);
  overheadSignTex.hasAlpha = false;
  overheadSignMat.diffuseTexture = overheadSignTex;
  overheadSignMat.emissiveTexture = overheadSignTex;

  const ctxSign = overheadSignTex.getContext() as unknown as CanvasRenderingContext2D;
  ctxSign.fillStyle = '#090d16';
  ctxSign.fillRect(0, 0, 512, 128);
  ctxSign.strokeStyle = '#06b6d4';
  ctxSign.lineWidth = 6;
  ctxSign.strokeRect(4, 4, 504, 120);

  ctxSign.fillStyle = '#22c55e';
  ctxSign.font = 'bold 38px sans-serif';
  ctxSign.textAlign = 'center';
  ctxSign.fillText('▼  LANE 01 : MEMBER / RFID  ▼', 256, 52);

  ctxSign.fillStyle = '#38bdf8';
  ctxSign.font = 'bold 26px monospace';
  ctxSign.fillText('AUTOMATIC BARRIER GATE', 256, 95);
  overheadSignTex.update();
  overheadSignMat.freeze();

  const overheadSignBoard = BABYLON.MeshBuilder.CreateBox('overheadSignBoard', { width: 4.8, height: 0.85, depth: 0.12 }, scene);
  overheadSignBoard.position.set(-2.5, 4.5, -3.1);
  overheadSignBoard.material = overheadSignMat;
  optimizeStaticMesh(overheadSignBoard);

  // Low-Poly CCTV Security Surveillance Camera
  const cctvBody = BABYLON.MeshBuilder.CreateCylinder('cctvBody', { diameter: 0.14, height: 0.38, tessellation: 10 }, scene);
  cctvBody.rotation.x = Math.PI / 2 - 0.45; // Angled down toward vehicle stop line
  cctvBody.position.set(-5.15, 3.7, -2.5);
  cctvBody.material = steelColumnMat;
  optimizeStaticMesh(cctvBody);

  const cctvLedMat = new BABYLON.StandardMaterial('cctvLedMat', scene);
  cctvLedMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
  cctvLedMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
  cctvLedMat.freeze();

  const cctvLed = BABYLON.MeshBuilder.CreateSphere('cctvLed', { diameter: 0.04 }, scene);
  cctvLed.position.set(-5.15, 3.65, -2.3);
  cctvLed.material = cctvLedMat;
  optimizeStaticMesh(cctvLed);

  // ----------------------------------------------------
  // ORGANIC LOW-POLY ENVIRONMENT & FOLIAGE (Smooth-Shaded Rounded Volumes, No Flat Facets)
  // ----------------------------------------------------
  const woodMat = new BABYLON.StandardMaterial('woodMat', scene);
  woodMat.diffuseColor = new BABYLON.Color3(0.35, 0.22, 0.12);
  woodMat.freeze();

  const foliageMat1 = new BABYLON.StandardMaterial('foliageMat1', scene);
  foliageMat1.diffuseColor = new BABYLON.Color3(0.18, 0.46, 0.22);
  foliageMat1.specularPower = 16;
  foliageMat1.freeze();

  const foliageMat2 = new BABYLON.StandardMaterial('foliageMat2', scene);
  foliageMat2.diffuseColor = new BABYLON.Color3(0.24, 0.55, 0.28);
  foliageMat2.specularPower = 16;
  foliageMat2.freeze();

  const createOrganicTree = (name: string, pos: BABYLON.Vector3, scale = 1.0) => {
    // Smooth cylinder trunk
    const trunk = BABYLON.MeshBuilder.CreateCylinder(`trunk_${name}`, {
      diameterTop: 0.22 * scale,
      diameterBottom: 0.35 * scale,
      height: 2.2 * scale,
      tessellation: 16
    }, scene);
    trunk.position.set(pos.x, (2.2 * scale) / 2, pos.z);
    trunk.material = woodMat;
    optimizeStaticMesh(trunk);

    // Multi-lobed organic rounded cloud canopy with smooth normals (no flat facets)
    const lobes = [
      { x: 0, y: 2.2 * scale, z: 0, radius: 1.25 * scale, mat: foliageMat1 },
      { x: 0.35 * scale, y: 2.8 * scale, z: 0.2 * scale, radius: 1.05 * scale, mat: foliageMat2 },
      { x: -0.3 * scale, y: 2.7 * scale, z: -0.25 * scale, radius: 1.0 * scale, mat: foliageMat1 },
      { x: 0, y: 3.5 * scale, z: 0, radius: 0.85 * scale, mat: foliageMat2 }
    ];

    lobes.forEach((l, idx) => {
      const lobe = BABYLON.MeshBuilder.CreateSphere(`lobe_${name}_${idx}`, {
        diameter: l.radius * 2,
        segments: 16
      }, scene);
      lobe.position.set(pos.x + l.x, l.y, pos.z + l.z);
      lobe.material = l.mat;
      shadowGenerator.addShadowCaster(lobe);
      optimizeStaticMesh(lobe);
    });
  };

  createOrganicTree('t1', new BABYLON.Vector3(-12, 0, -14), 1.2);
  createOrganicTree('t2', new BABYLON.Vector3(-13, 0, -6), 1.0);
  createOrganicTree('t3', new BABYLON.Vector3(-12.5, 0, 7), 1.15);
  createOrganicTree('t4', new BABYLON.Vector3(8.5, 0, -12), 1.1);
  createOrganicTree('t5', new BABYLON.Vector3(9.2, 0, 10), 1.25);

  // Organic Low-Poly Bushes - Smooth-shaded rounded volumes
  const bushMat = new BABYLON.StandardMaterial('bushMat', scene);
  bushMat.diffuseColor = new BABYLON.Color3(0.22, 0.54, 0.26);
  bushMat.specularPower = 16;
  bushMat.freeze();

  const createOrganicBush = (name: string, pos: BABYLON.Vector3, radius = 0.65) => {
    const bush = BABYLON.MeshBuilder.CreateSphere(`bush_${name}`, {
      diameter: radius * 2,
      segments: 16
    }, scene);
    bush.scaling.y = 0.75;
    bush.position.set(pos.x, radius * 0.65, pos.z);
    bush.material = bushMat;
    optimizeStaticMesh(bush);
  };

  createOrganicBush('b1', new BABYLON.Vector3(-9.8, 0, -4.5), 0.75);
  createOrganicBush('b2', new BABYLON.Vector3(-9.5, 0, 3.2), 0.6);
  createOrganicBush('b3', new BABYLON.Vector3(6.5, 0, -6), 0.8);
  createOrganicBush('b4', new BABYLON.Vector3(6.8, 0, 4), 0.7);

  // ----------------------------------------------------
  // STREET LIGHTS & ENVIRONMENT
  // ----------------------------------------------------
  const streetLights: BABYLON.SpotLight[] = [];
  const createStreetLamp = (pos: BABYLON.Vector3) => {
    const pole = BABYLON.MeshBuilder.CreateCylinder('lampPole', { diameter: 0.12, height: 5.5 }, scene);
    pole.position.set(pos.x, pos.y + 2.75, pos.z);
    pole.material = rfidPostMat;
    optimizeStaticMesh(pole);

    const spot = new BABYLON.SpotLight(
      `lampSpot_${pos.z}`,
      new BABYLON.Vector3(pos.x, pos.y + 5.2, pos.z),
      new BABYLON.Vector3(0.3, -1, 0),
      Math.PI / 2.5,
      2,
      scene
    );
    spot.intensity = 0; // Starts off unless night
    spot.diffuse = new BABYLON.Color3(1, 0.92, 0.75);
    streetLights.push(spot);
  };

  createStreetLamp(new BABYLON.Vector3(-4.8, 0, -10));
  createStreetLamp(new BABYLON.Vector3(-4.8, 0, 10));

  // ----------------------------------------------------
  // SYSTEM STATE UPDATERS
  // ----------------------------------------------------
  const setEnvironmentMode = (mode: EnvironmentSetting) => {
    if (mode === 'day') {
      scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);
      hemiLight.intensity = 0.85;
      sunLight.intensity = 1.3;
      streetLights.forEach(l => (l.intensity = 0));
    } else if (mode === 'sunset') {
      scene.clearColor = new BABYLON.Color4(0.85, 0.45, 0.25, 1.0);
      hemiLight.intensity = 0.5;
      sunLight.intensity = 0.7;
      streetLights.forEach(l => (l.intensity = 8));
    } else if (mode === 'night') {
      scene.clearColor = new BABYLON.Color4(0.04, 0.06, 0.12, 1.0);
      hemiLight.intensity = 0.15;
      sunLight.intensity = 0.05;
      streetLights.forEach(l => (l.intensity = 25));
    }
  };

  const setLoopActive = (loopIndex: 1 | 2, active: boolean) => {
    if (loopIndex === 1) {
      loop1WireMat.emissiveColor = active ? new BABYLON.Color3(0, 0.8, 1) : new BABYLON.Color3(0.1, 0.1, 0.1);
      loop1WireMat.diffuseColor = active ? new BABYLON.Color3(0, 0.6, 0.9) : new BABYLON.Color3(0.2, 0.2, 0.2);
    } else {
      loop2WireMat.emissiveColor = active ? new BABYLON.Color3(1, 0.5, 0) : new BABYLON.Color3(0.1, 0.1, 0.1);
      loop2WireMat.diffuseColor = active ? new BABYLON.Color3(0.9, 0.4, 0) : new BABYLON.Color3(0.2, 0.2, 0.2);
    }
  };

  const setGateVisualState = (state: GateState, angleDegrees: number) => {
    // Rotation around Z axis in radians
    const angleRad = (angleDegrees * Math.PI) / 180;
    boomPivotNode.rotation.z = angleRad;
  };

  engine.runRenderLoop(() => {
    scene.render();
  });

  return {
    engine,
    scene,
    cameras,
    activeCameraPreset: 'orbit',
    shadowGenerator,
    boomArmMesh,
    boomPivotNode,
    gateDomeLightMat: gateDomeMat,
    gateDomeMesh,
    loop1WireMat,
    loop2WireMat,
    loop1DecalMesh,
    loop2DecalMesh,
    rfidReaderScreenTex,
    rfidLedRingMat,
    rfidCardMesh,
    sunLight,
    hemiLight,
    streetLights,
    setEnvironmentMode,
    updateRfidDisplay,
    setLoopActive,
    setGateVisualState,
    setRenderQuality
  };
}
