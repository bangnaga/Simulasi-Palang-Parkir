import * as BABYLON from '@babylonjs/core';
import { VehicleType } from '../../types';

export interface VehicleMeshGroup {
  root: BABYLON.TransformNode;
  bodyMesh: BABYLON.Mesh;
  wheels: BABYLON.Mesh[];
  headlights: BABYLON.SpotLight[];
  licensePlateMesh: BABYLON.Mesh;
  type: VehicleType;
  boundingLength: number;
}

export function createVehicle(
  scene: BABYLON.Scene,
  shadowGenerator: BABYLON.ShadowGenerator | null,
  type: VehicleType = 'sedan',
  colorHex: string = '#1e3a8a'
): VehicleMeshGroup {
  const root = new BABYLON.TransformNode(`vehicle_root_${Date.now()}`, scene);
  const wheels: BABYLON.Mesh[] = [];
  const headlights: BABYLON.SpotLight[] = [];

  // Base materials
  const carMat = new BABYLON.StandardMaterial(`carMat_${type}`, scene);
  carMat.diffuseColor = BABYLON.Color3.FromHexString(colorHex);
  carMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
  carMat.specularPower = 32;

  const glassMat = new BABYLON.StandardMaterial(`glassMat_${type}`, scene);
  glassMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.2);
  glassMat.alpha = 0.65;
  glassMat.specularColor = new BABYLON.Color3(1, 1, 1);

  const wheelMat = new BABYLON.StandardMaterial(`wheelMat_${type}`, scene);
  wheelMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.08);

  const chromeMat = new BABYLON.StandardMaterial(`chromeMat_${type}`, scene);
  chromeMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);

  const plateMat = new BABYLON.StandardMaterial(`plateMat_${type}`, scene);
  plateMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.9);

  // Vehicle-specific body dimensions
  let length = 4.2;
  let width = 1.9;
  let height = 1.45;

  if (type === 'suv') {
    length = 4.6;
    width = 2.0;
    height = 1.75;
  } else if (type === 'hatchback') {
    length = 3.8;
    width = 1.8;
    height = 1.4;
  } else if (type === 'van') {
    length = 4.8;
    width = 2.0;
    height = 2.1;
  } else if (type === 'motorbike') {
    length = 2.1;
    width = 0.8;
    height = 1.2;
  }

  // Primary chassis body
  const bodyMesh = BABYLON.MeshBuilder.CreateBox(`carBody_${type}`, {
    width: width,
    height: height * 0.5,
    depth: length
  }, scene);
  bodyMesh.position.y = height * 0.45;
  bodyMesh.material = carMat;
  bodyMesh.parent = root;

  if (shadowGenerator) shadowGenerator.addShadowCaster(bodyMesh);

  // Cabin / Roof
  if (type !== 'motorbike') {
    const cabinLength = length * (type === 'van' ? 0.75 : 0.55);
    const cabinHeight = height * 0.5;
    const cabin = BABYLON.MeshBuilder.CreateBox(`carCabin_${type}`, {
      width: width * 0.9,
      height: cabinHeight,
      depth: cabinLength
    }, scene);
    cabin.position.y = height * 0.85;
    cabin.position.z = type === 'van' ? -length * 0.05 : -length * 0.08;
    cabin.material = carMat;
    cabin.parent = root;
    if (shadowGenerator) shadowGenerator.addShadowCaster(cabin);

    // Windows
    const windshield = BABYLON.MeshBuilder.CreateBox(`windshield_${type}`, {
      width: width * 0.88,
      height: cabinHeight * 0.8,
      depth: cabinLength * 0.9
    }, scene);
    windshield.position.y = height * 0.86;
    windshield.position.z = cabin.position.z;
    windshield.material = glassMat;
    windshield.parent = root;

    // Wheels (4 wheels)
    const wheelRadius = type === 'suv' ? 0.38 : 0.32;
    const wheelThickness = 0.22;
    const wheelPositions = [
      { x: -width * 0.48, y: wheelRadius, z: length * 0.32 },
      { x: width * 0.48, y: wheelRadius, z: length * 0.32 },
      { x: -width * 0.48, y: wheelRadius, z: -length * 0.32 },
      { x: width * 0.48, y: wheelRadius, z: -length * 0.32 }
    ];

    wheelPositions.forEach((pos, idx) => {
      const wheel = BABYLON.MeshBuilder.CreateCylinder(`wheel_${type}_${idx}`, {
        diameter: wheelRadius * 2,
        height: wheelThickness,
        tessellation: 24
      }, scene);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.material = wheelMat;
      wheel.parent = root;

      // Rim
      const rim = BABYLON.MeshBuilder.CreateCylinder(`rim_${type}_${idx}`, {
        diameter: wheelRadius * 1.1,
        height: wheelThickness + 0.02,
        tessellation: 12
      }, scene);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(pos.x, pos.y, pos.z);
      rim.material = chromeMat;
      rim.parent = root;

      wheels.push(wheel);
      if (shadowGenerator) shadowGenerator.addShadowCaster(wheel);
    });
  } else {
    // Motorcycle specific geometry
    const bikeWheelRadius = 0.35;
    const wheelPositions = [
      { x: 0, y: bikeWheelRadius, z: length * 0.35 },
      { x: 0, y: bikeWheelRadius, z: -length * 0.35 }
    ];
    wheelPositions.forEach((pos, idx) => {
      const wheel = BABYLON.MeshBuilder.CreateCylinder(`bikeWheel_${idx}`, {
        diameter: bikeWheelRadius * 2,
        height: 0.12,
        tessellation: 24
      }, scene);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.material = wheelMat;
      wheel.parent = root;
      wheels.push(wheel);
    });

    // Seat & handlebar
    const seat = BABYLON.MeshBuilder.CreateBox('bikeSeat', { width: 0.4, height: 0.15, depth: 0.9 }, scene);
    seat.position.set(0, height * 0.6, -0.1);
    seat.material = wheelMat;
    seat.parent = root;
  }

  // Headlights
  const headlightMat = new BABYLON.StandardMaterial(`headlightMat_${type}`, scene);
  headlightMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.7);
  headlightMat.diffuseColor = new BABYLON.Color3(1, 1, 0.9);

  const leftLamp = BABYLON.MeshBuilder.CreateBox(`lampLeft_${type}`, {
    width: type === 'motorbike' ? 0.25 : 0.3,
    height: 0.18,
    depth: 0.08
  }, scene);
  leftLamp.position.set(type === 'motorbike' ? 0 : -width * 0.35, height * 0.48, length * 0.5);
  leftLamp.material = headlightMat;
  leftLamp.parent = root;

  if (type !== 'motorbike') {
    const rightLamp = BABYLON.MeshBuilder.CreateBox(`lampRight_${type}`, {
      width: 0.3,
      height: 0.18,
      depth: 0.08
    }, scene);
    rightLamp.position.set(width * 0.35, height * 0.48, length * 0.5);
    rightLamp.material = headlightMat;
    rightLamp.parent = root;
  }

  // Spotlights for Night driving beam
  const lightTarget = new BABYLON.Vector3(0, 0, length * 0.5 + 10);
  const leftSpot = new BABYLON.SpotLight(
    `spotLeft_${type}`,
    new BABYLON.Vector3(-width * 0.35, height * 0.5, length * 0.5),
    new BABYLON.Vector3(0, -0.2, 1),
    Math.PI / 3,
    2,
    scene
  );
  leftSpot.intensity = 0; // Starts off unless night
  leftSpot.diffuse = new BABYLON.Color3(1, 0.95, 0.8);

  headlights.push(leftSpot);

  // License Plate
  const licensePlateMesh = BABYLON.MeshBuilder.CreatePlane(`plate_${type}`, {
    width: 0.5,
    height: 0.2
  }, scene);
  licensePlateMesh.position.set(0, height * 0.28, length * 0.505);
  licensePlateMesh.material = plateMat;
  licensePlateMesh.parent = root;

  // Create license plate dynamic texture
  const plateTex = new BABYLON.DynamicTexture(`plateTex_${type}`, { width: 256, height: 128 }, scene);
  plateMat.diffuseTexture = plateTex;
  const ctx = plateTex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B 1988 RFID', 128, 64);
  plateTex.update();

  return {
    root,
    bodyMesh,
    wheels,
    headlights,
    licensePlateMesh,
    type,
    boundingLength: length
  };
}
