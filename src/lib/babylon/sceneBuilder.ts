import * as BABYLON from '@babylonjs/core';
import { CameraPreset, EnvironmentSetting, GateState } from '../../types';

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
}

export function buildParkingScene(canvas: HTMLCanvasElement): SceneContext {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0); // Soft sky blue

  // Enable collisions & physics if needed
  scene.collisionsEnabled = true;

  // ----------------------------------------------------
  // LIGHTS & SHADOWS
  // ----------------------------------------------------
  const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.25);

  const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-0.5, -1, -0.6), scene);
  sunLight.position = new BABYLON.Vector3(15, 30, 20);
  sunLight.intensity = 1.2;

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, sunLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  // ----------------------------------------------------
  // CAMERAS
  // ----------------------------------------------------
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

  // Driver View Cam
  const driverCam = new BABYLON.TargetCamera('driverCam', new BABYLON.Vector3(-2.8, 1.45, -8.0), scene);
  driverCam.setTarget(new BABYLON.Vector3(-3.8, 1.3, -2.2));

  // Scanner Close-up Cam
  const scannerCam = new BABYLON.TargetCamera('scannerCam', new BABYLON.Vector3(-3.0, 1.4, -3.8), scene);
  scannerCam.setTarget(new BABYLON.Vector3(-3.8, 1.25, -2.2));

  // Top-down Aerial View Cam
  const topCam = new BABYLON.TargetCamera('topCam', new BABYLON.Vector3(-1.5, 22, -1.0), scene);
  topCam.setTarget(new BABYLON.Vector3(-1.5, 0, -1.0));

  // Gate Zoom Cam
  const gateCam = new BABYLON.TargetCamera('gateCam', new BABYLON.Vector3(-1.0, 1.8, -5.0), scene);
  gateCam.setTarget(new BABYLON.Vector3(-3.8, 1.2, 0));

  const cameras: Record<CameraPreset, BABYLON.Camera> = {
    orbit: orbitCam,
    driver: driverCam,
    scanner: scannerCam,
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

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 60 }, scene);
  ground.position.y = -0.01;
  ground.material = grassMat;
  ground.receiveShadows = true;

  // Main Asphalt Road
  const roadMat = new BABYLON.StandardMaterial('roadMat', scene);
  roadMat.diffuseColor = new BABYLON.Color3(0.15, 0.16, 0.18);
  roadMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const road = BABYLON.MeshBuilder.CreateGround('road', { width: 7.5, height: 50 }, scene);
  road.position.set(-1.8, 0, 0);
  road.material = roadMat;
  road.receiveShadows = true;

  // Curbs / Sidewalk
  const curbMat = new BABYLON.StandardMaterial('curbMat', scene);
  curbMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.72);

  const leftCurb = BABYLON.MeshBuilder.CreateBox('leftCurb', { width: 4.5, height: 0.25, depth: 50 }, scene);
  leftCurb.position.set(-7.5, 0.125, 0);
  leftCurb.material = curbMat;
  leftCurb.receiveShadows = true;

  const rightCurb = BABYLON.MeshBuilder.CreateBox('rightCurb', { width: 4.5, height: 0.25, depth: 50 }, scene);
  rightCurb.position.set(4.2, 0.125, 0);
  rightCurb.material = curbMat;
  rightCurb.receiveShadows = true;

  // Yellow Box Junction Grid at Barrier Zone
  const yellowGridMat = new BABYLON.StandardMaterial('yellowGridMat', scene);
  yellowGridMat.diffuseColor = new BABYLON.Color3(0.9, 0.75, 0.1);

  const stopLine = BABYLON.MeshBuilder.CreateGround('stopLine', { width: 3.2, height: 0.3 }, scene);
  stopLine.position.set(-2.2, 0.005, -3.2);
  stopLine.material = yellowGridMat;

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

  // Loop 1 Decal / Wire Cut (Pre-barrier presence loop)
  const loop1DecalMesh = BABYLON.MeshBuilder.CreateGround('loop1Cut', { width: 2.2, height: 4.8 }, scene);
  loop1DecalMesh.position.set(-2.2, 0.006, -4.0);
  loop1DecalMesh.material = loop1WireMat;

  // Loop 1 Inner Wire border box line
  const loop1Line = BABYLON.MeshBuilder.CreateLines('loop1Line', {
    points: [
      new BABYLON.Vector3(-3.25, 0.01, -6.4),
      new BABYLON.Vector3(-1.15, 0.01, -6.4),
      new BABYLON.Vector3(-1.15, 0.01, -1.6),
      new BABYLON.Vector3(-3.25, 0.01, -1.6),
      new BABYLON.Vector3(-3.25, 0.01, -6.4)
    ]
  }, scene);
  loop1Line.color = new BABYLON.Color3(0.3, 0.8, 1.0);

  // Loop 2 Decal / Wire Cut (Passage & Safety loop under/after boom)
  const loop2DecalMesh = BABYLON.MeshBuilder.CreateGround('loop2Cut', { width: 2.2, height: 3.6 }, scene);
  loop2DecalMesh.position.set(-2.2, 0.006, 2.5);
  loop2DecalMesh.material = loop2WireMat;

  const loop2Line = BABYLON.MeshBuilder.CreateLines('loop2Line', {
    points: [
      new BABYLON.Vector3(-3.25, 0.01, 0.7),
      new BABYLON.Vector3(-1.15, 0.01, 0.7),
      new BABYLON.Vector3(-1.15, 0.01, 4.3),
      new BABYLON.Vector3(-3.25, 0.01, 4.3),
      new BABYLON.Vector3(-3.25, 0.01, 0.7)
    ]
  }, scene);
  loop2Line.color = new BABYLON.Color3(1.0, 0.6, 0.1);

  // Loop 3D Marker Sign Posts next to road
  const createLoopSign = (name: string, pos: BABYLON.Vector3, color: BABYLON.Color3) => {
    const pole = BABYLON.MeshBuilder.CreateCylinder(`pole_${name}`, { diameter: 0.06, height: 1.2 }, scene);
    pole.position.set(pos.x, pos.y + 0.6, pos.z);
    
    const poleMat = new BABYLON.StandardMaterial(`poleMat_${name}`, scene);
    poleMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    pole.material = poleMat;

    const box = BABYLON.MeshBuilder.CreateBox(`box_${name}`, { width: 0.6, height: 0.35, depth: 0.08 }, scene);
    box.position.set(pos.x, pos.y + 1.2, pos.z);
    
    const boxMat = new BABYLON.StandardMaterial(`boxMat_${name}`, scene);
    boxMat.diffuseColor = color;
    box.material = boxMat;
  };

  createLoopSign('L1', new BABYLON.Vector3(-3.8, 0, -6.0), new BABYLON.Color3(0.1, 0.5, 0.8));
  createLoopSign('L2', new BABYLON.Vector3(-3.8, 0, 2.5), new BABYLON.Color3(0.8, 0.4, 0.1));

  // ----------------------------------------------------
  // BARRIER GATE HOUSING & BOOM ARM (MX-50 Gate)
  // ----------------------------------------------------
  const gateHousingMat = new BABYLON.StandardMaterial('gateHousingMat', scene);
  gateHousingMat.diffuseColor = new BABYLON.Color3(0.92, 0.48, 0.08); // Safety Orange/Yellow
  gateHousingMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const gateHousing = BABYLON.MeshBuilder.CreateBox('gateHousing', { width: 0.55, height: 1.25, depth: 0.55 }, scene);
  gateHousing.position.set(-3.8, 0.625, 0);
  gateHousing.material = gateHousingMat;
  shadowGenerator.addShadowCaster(gateHousing);

  // Motor Pivot Node
  const boomPivotNode = new BABYLON.TransformNode('boomPivotNode', scene);
  boomPivotNode.position.set(-3.8, 1.12, 0);

  // Metal Motor Hub
  const hubMat = new BABYLON.StandardMaterial('hubMat', scene);
  hubMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
  hubMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

  const hub = BABYLON.MeshBuilder.CreateCylinder('hub', { diameter: 0.22, height: 0.25 }, scene);
  hub.rotation.z = Math.PI / 2;
  hub.parent = boomPivotNode;
  hub.material = hubMat;

  // Boom Arm Pole (4.2m)
  const boomArmMat = new BABYLON.StandardMaterial('boomArmMat', scene);
  boomArmMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);

  const boomArmMesh = BABYLON.MeshBuilder.CreateBox('boomArm', { width: 4.2, height: 0.12, depth: 0.06 }, scene);
  // Center of arm offset so pivot is at base end
  boomArmMesh.position.set(2.1, 0, 0);
  boomArmMesh.parent = boomPivotNode;
  boomArmMesh.material = boomArmMat;
  shadowGenerator.addShadowCaster(boomArmMesh);

  // Red reflective stripes on boom arm
  const redStripeMat = new BABYLON.StandardMaterial('redStripeMat', scene);
  redStripeMat.diffuseColor = new BABYLON.Color3(0.85, 0.08, 0.08);

  for (let i = 0; i < 5; i++) {
    const stripe = BABYLON.MeshBuilder.CreateBox(`stripe_${i}`, { width: 0.35, height: 0.122, depth: 0.065 }, scene);
    stripe.position.set(0.6 + i * 0.7, 0, 0);
    stripe.parent = boomPivotNode;
    stripe.material = redStripeMat;
  }

  // Top LED Signal Light Dome on Cabinet
  const gateDomeMat = new BABYLON.StandardMaterial('gateDomeMat', scene);
  gateDomeMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
  gateDomeMat.emissiveColor = new BABYLON.Color3(0.8, 0.1, 0.1);

  const gateDomeMesh = BABYLON.MeshBuilder.CreateSphere('gateDome', { diameter: 0.18 }, scene);
  gateDomeMesh.position.set(-3.8, 1.32, 0);
  gateDomeMesh.material = gateDomeMat;

  // ----------------------------------------------------
  // RFID SCANNER PEDESTAL
  // ----------------------------------------------------
  const rfidPostMat = new BABYLON.StandardMaterial('rfidPostMat', scene);
  rfidPostMat.diffuseColor = new BABYLON.Color3(0.2, 0.22, 0.28);

  const rfidPost = BABYLON.MeshBuilder.CreateBox('rfidPost', { width: 0.35, height: 1.35, depth: 0.35 }, scene);
  rfidPost.position.set(-3.8, 0.675, -2.2);
  rfidPost.material = rfidPostMat;
  shadowGenerator.addShadowCaster(rfidPost);

  // Angled Reader Head
  const rfidHead = BABYLON.MeshBuilder.CreateBox('rfidHead', { width: 0.42, height: 0.45, depth: 0.28 }, scene);
  rfidHead.position.set(-3.65, 1.35, -2.2);
  rfidHead.rotation.y = -Math.PI / 10;
  rfidHead.material = rfidPostMat;

  // Reader LCD Display Screen
  const screenMat = new BABYLON.StandardMaterial('rfidScreenMat', scene);
  const rfidReaderScreenTex = new BABYLON.DynamicTexture('rfidScreenTex', { width: 512, height: 256 }, scene);
  screenMat.diffuseTexture = rfidReaderScreenTex;
  screenMat.emissiveTexture = rfidReaderScreenTex;

  const rfidScreen = BABYLON.MeshBuilder.CreatePlane('rfidScreen', { width: 0.36, height: 0.22 }, scene);
  rfidScreen.position.set(-3.43, 1.42, -2.2);
  rfidScreen.rotation.y = Math.PI / 2 - Math.PI / 10;
  rfidScreen.material = screenMat;

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
  };

  updateRfidDisplay('TEMPELKAN KARTU', 'Menunggu RFID...', 'idle');

  // RFID LED Status Ring
  const rfidLedRingMat = new BABYLON.StandardMaterial('rfidLedRingMat', scene);
  rfidLedRingMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
  rfidLedRingMat.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);

  const rfidLed = BABYLON.MeshBuilder.CreateSphere('rfidLed', { diameter: 0.08 }, scene);
  rfidLed.position.set(-3.43, 1.25, -2.2);
  rfidLed.material = rfidLedRingMat;

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

  // Card texture
  const cardTex = new BABYLON.DynamicTexture('cardTex', { width: 256, height: 160 }, scene);
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

  // ----------------------------------------------------
  // GUARD BOOTH / POS PARKIR (BUILDING)
  // ----------------------------------------------------
  const boothBuilding = BABYLON.MeshBuilder.CreateBox('boothBuilding', { width: 2.2, height: 2.5, depth: 2.2 }, scene);
  boothBuilding.position.set(-6.5, 1.25, 0);

  const boothMat = new BABYLON.StandardMaterial('boothMat', scene);
  boothMat.diffuseColor = new BABYLON.Color3(0.88, 0.9, 0.92);
  boothBuilding.material = boothMat;
  shadowGenerator.addShadowCaster(boothBuilding);

  // Booth Window Glass
  const boothGlassMat = new BABYLON.StandardMaterial('boothGlassMat', scene);
  boothGlassMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.6);
  boothGlassMat.alpha = 0.5;

  const boothWindow = BABYLON.MeshBuilder.CreatePlane('boothWindow', { width: 1.6, height: 1.1 }, scene);
  boothWindow.position.set(-5.39, 1.5, 0);
  boothWindow.rotation.y = Math.PI / 2;
  boothWindow.material = boothGlassMat;

  // Roof Sign
  const signBoard = BABYLON.MeshBuilder.CreateBox('signBoard', { width: 2.4, height: 0.4, depth: 0.1 }, scene);
  signBoard.position.set(-6.5, 2.7, 0);
  const signMat = new BABYLON.StandardMaterial('signMat', scene);
  signMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.7);
  signBoard.material = signMat;

  // ----------------------------------------------------
  // STREET LIGHTS & ENVIRONMENT
  // ----------------------------------------------------
  const streetLights: BABYLON.SpotLight[] = [];
  const createStreetLamp = (pos: BABYLON.Vector3) => {
    const pole = BABYLON.MeshBuilder.CreateCylinder('lampPole', { diameter: 0.12, height: 5.5 }, scene);
    pole.position.set(pos.x, pos.y + 2.75, pos.z);
    pole.material = rfidPostMat;

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

    // Dome Light Color
    if (state === 'OPEN') {
      gateDomeMat.emissiveColor = new BABYLON.Color3(0.1, 0.9, 0.2);
      gateDomeMat.diffuseColor = new BABYLON.Color3(0.1, 0.9, 0.2);
    } else if (state === 'OPENING' || state === 'CLOSING') {
      gateDomeMat.emissiveColor = new BABYLON.Color3(0.9, 0.8, 0.1);
      gateDomeMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.1);
    } else if (state === 'SAFETY_BLOCK') {
      gateDomeMat.emissiveColor = new BABYLON.Color3(1.0, 0.1, 0.1);
      gateDomeMat.diffuseColor = new BABYLON.Color3(1.0, 0.1, 0.1);
    } else {
      gateDomeMat.emissiveColor = new BABYLON.Color3(0.8, 0.1, 0.1);
      gateDomeMat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
    }
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
    setGateVisualState
  };
}
