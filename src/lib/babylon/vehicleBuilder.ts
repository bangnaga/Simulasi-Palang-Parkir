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

/**
 * Creates a beautifully proportioned, realistic vehicle with:
 * - Sculpted aerodynamic automotive body shell
 * - Highly realistic automotive glass (windshield with ceramic frit border,
 *   wipers, sleek side windows with pillars & trim, sloped rear hatch with defroster)
 * - Detailed dark cabin interior (dashboard, steering wheel, seats & headrests) visible through tinted glass
 * - Multi-element jewel LED headlights with eyebrow DRL and dynamic night beams
 * - Continuous ruby LED rear taillight bar
 * - Precision alloy wheels with disc brakes and sport calipers
 */
export function createVehicle(
  scene: BABYLON.Scene,
  shadowGenerator: BABYLON.ShadowGenerator | null,
  type: VehicleType = 'suv',
  colorHex: string = '#f4f6f8'
): VehicleMeshGroup {
  const root = new BABYLON.TransformNode(`vehicle_root_${Date.now()}`, scene);
  const wheels: BABYLON.Mesh[] = [];
  const headlights: BABYLON.SpotLight[] = [];

  const optimizeVehiclePart = (mesh: BABYLON.AbstractMesh) => {
    mesh.isPickable = false;
    mesh.doNotSyncBoundingInfo = true;
    mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
  };

  // --------------------------------------------------------------------------
  // PROPORTIONS & DIMENSIONS BY VEHICLE TYPE
  // --------------------------------------------------------------------------
  let length = 4.45;
  let width = 1.88;
  let totalHeight = 1.60;
  let wheelRadius = 0.36;
  let wheelThickness = 0.23;
  let wheelBaseFrontZ = 1.35;
  let wheelBaseRearZ = -1.25;

  if (type === 'sedan') {
    length = 4.65;
    width = 1.84;
    totalHeight = 1.44;
    wheelRadius = 0.33;
    wheelThickness = 0.22;
    wheelBaseFrontZ = 1.42;
    wheelBaseRearZ = -1.35;
  } else if (type === 'hatchback') {
    length = 4.10;
    width = 1.80;
    totalHeight = 1.48;
    wheelRadius = 0.32;
    wheelThickness = 0.21;
    wheelBaseFrontZ = 1.25;
    wheelBaseRearZ = -1.15;
  } else if (type === 'van') {
    length = 4.80;
    width = 1.92;
    totalHeight = 1.88;
    wheelRadius = 0.35;
    wheelThickness = 0.23;
    wheelBaseFrontZ = 1.45;
    wheelBaseRearZ = -1.40;
  }

  // --------------------------------------------------------------------------
  // PREMIUM AUTOMOTIVE MATERIALS
  // --------------------------------------------------------------------------
  const effectiveColor = colorHex === '#1e3a8a' ? '#f4f6f8' : colorHex;

  // 1. High-Gloss Automotive Paint (Rich specular clearcoat)
  const carPaintMat = new BABYLON.StandardMaterial(`carPaintMat_${type}`, scene);
  carPaintMat.diffuseColor = BABYLON.Color3.FromHexString(effectiveColor);
  carPaintMat.specularColor = new BABYLON.Color3(0.85, 0.88, 0.94);
  carPaintMat.specularPower = 72;
  carPaintMat.freeze();

  // 2. High-Gloss Piano Black (Pillars, window sashes, roof rails, spoiler)
  const pianoBlackMat = new BABYLON.StandardMaterial(`pianoBlack_${type}`, scene);
  pianoBlackMat.diffuseColor = new BABYLON.Color3(0.03, 0.03, 0.04);
  pianoBlackMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.95);
  pianoBlackMat.specularPower = 90;
  pianoBlackMat.freeze();

  // 3. Matte Charcoal Protective Cladding (Wheel arches, rocker panels, lower bumper)
  const claddingMat = new BABYLON.StandardMaterial(`cladding_${type}`, scene);
  claddingMat.diffuseColor = new BABYLON.Color3(0.12, 0.13, 0.15);
  claddingMat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.09);
  claddingMat.specularPower = 14;
  claddingMat.freeze();

  // 4. Satin Silver / Machined Chrome Trim (Window trim, grille bar, chin lip)
  const satinChromeMat = new BABYLON.StandardMaterial(`satinChrome_${type}`, scene);
  satinChromeMat.diffuseColor = new BABYLON.Color3(0.88, 0.90, 0.95);
  satinChromeMat.specularColor = new BABYLON.Color3(0.95, 0.95, 0.98);
  satinChromeMat.specularPower = 64;
  satinChromeMat.freeze();

  // 5. Ceramic Frit Black Masking (Around glass edges)
  const glassFritMat = new BABYLON.StandardMaterial(`glassFrit_${type}`, scene);
  glassFritMat.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.03);
  glassFritMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.45);
  glassFritMat.specularPower = 40;
  glassFritMat.freeze();

  // 6. Automotive Safety Windshield Glass (Clear-tinted with vivid sky reflection)
  const windshieldGlassMat = new BABYLON.StandardMaterial(`windshieldGlass_${type}`, scene);
  windshieldGlassMat.diffuseColor = new BABYLON.Color3(0.06, 0.10, 0.14);
  windshieldGlassMat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
  windshieldGlassMat.specularPower = 160;
  windshieldGlassMat.alpha = 0.68;
  windshieldGlassMat.backFaceCulling = false;
  windshieldGlassMat.freeze();

  // 7. Dark Privacy Side & Rear Glass
  const privacyGlassMat = new BABYLON.StandardMaterial(`privacyGlass_${type}`, scene);
  privacyGlassMat.diffuseColor = new BABYLON.Color3(0.03, 0.04, 0.06);
  privacyGlassMat.specularColor = new BABYLON.Color3(0.95, 0.98, 1.0);
  privacyGlassMat.specularPower = 140;
  privacyGlassMat.alpha = 0.82;
  privacyGlassMat.backFaceCulling = false;
  privacyGlassMat.freeze();

  // 8. Interior Dark Matte (Dashboard, cabin cavity, seats)
  const interiorDarkMat = new BABYLON.StandardMaterial(`interiorDark_${type}`, scene);
  interiorDarkMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.10);
  interiorDarkMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  interiorDarkMat.specularPower = 8;
  interiorDarkMat.freeze();

  // 9. Tire Rubber
  const tireMat = new BABYLON.StandardMaterial(`tireMat_${type}`, scene);
  tireMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.09);
  tireMat.specularColor = new BABYLON.Color3(0.12, 0.12, 0.12);
  tireMat.specularPower = 16;
  tireMat.freeze();

  // 10. Wheel Rim Dark Gunmetal & Silver
  const rimBaseMat = new BABYLON.StandardMaterial(`rimBase_${type}`, scene);
  rimBaseMat.diffuseColor = new BABYLON.Color3(0.15, 0.16, 0.20);
  rimBaseMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.65);
  rimBaseMat.specularPower = 32;
  rimBaseMat.freeze();

  // 11. Brake Disc & Red Caliper
  const brakeDiscMat = new BABYLON.StandardMaterial(`brakeDisc_${type}`, scene);
  brakeDiscMat.diffuseColor = new BABYLON.Color3(0.65, 0.67, 0.70);
  brakeDiscMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.85);
  brakeDiscMat.specularPower = 30;
  brakeDiscMat.freeze();

  const caliperMat = new BABYLON.StandardMaterial(`caliper_${type}`, scene);
  caliperMat.diffuseColor = new BABYLON.Color3(0.92, 0.06, 0.06);
  caliperMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
  caliperMat.specularPower = 32;
  caliperMat.freeze();

  // 12. Jewel-Eye LED Headlights & DRL (Emissive cool white)
  const ledHeadlightMat = new BABYLON.StandardMaterial(`ledHead_${type}`, scene);
  ledHeadlightMat.diffuseColor = new BABYLON.Color3(0.96, 0.98, 1.0);
  ledHeadlightMat.emissiveColor = new BABYLON.Color3(0.95, 0.98, 1.0);
  ledHeadlightMat.freeze();

  // 13. Ruby Red Continuous LED Taillight (Emissive red)
  const ledTaillightMat = new BABYLON.StandardMaterial(`ledTail_${type}`, scene);
  ledTaillightMat.diffuseColor = new BABYLON.Color3(1.0, 0.03, 0.03);
  ledTaillightMat.emissiveColor = new BABYLON.Color3(1.0, 0.06, 0.06);
  ledTaillightMat.freeze();

  // 14. Emblem Badge
  const emblemMat = new BABYLON.StandardMaterial(`emblem_${type}`, scene);
  emblemMat.diffuseColor = new BABYLON.Color3(0.12, 0.42, 0.9);
  emblemMat.emissiveColor = new BABYLON.Color3(0.08, 0.28, 0.65);
  emblemMat.freeze();

  // --------------------------------------------------------------------------
  // 1. SCULPTED MAIN BODY (AERODYNAMIC LOWER HULL & FENDERS)
  // --------------------------------------------------------------------------
  // Lower Body Section (Waistline below window sill)
  const bodyHeight = 0.50;
  const bodyCenterY = 0.48;

  const bodyMesh = BABYLON.MeshBuilder.CreateBox(`carBody_${type}`, {
    width: width * 0.98,
    height: bodyHeight,
    depth: length * 0.92
  }, scene);
  bodyMesh.position.set(0, bodyCenterY, 0.05);
  bodyMesh.material = carPaintMat;
  bodyMesh.parent = root;
  optimizeVehiclePart(bodyMesh);
  if (shadowGenerator) shadowGenerator.addShadowCaster(bodyMesh);

  // Sculpted Side Door Shoulder Panels (Tumblehome bulge with subtle waist scallop)
  [-1, 1].forEach(side => {
    const doorBulge = BABYLON.MeshBuilder.CreateBox(`doorBulge_${side}`, {
      width: 0.04,
      height: bodyHeight * 0.72,
      depth: length * 0.54
    }, scene);
    doorBulge.position.set(side * (width * 0.49), bodyCenterY + 0.05, 0.05);
    doorBulge.material = carPaintMat;
    doorBulge.parent = root;
    optimizeVehiclePart(doorBulge);
  });

  // Aerodynamic Hood / Bonnet (Smooth downward slope from cowl to grille)
  const hoodLength = 1.35;
  const hoodWidth = width * 0.90;
  const hood = BABYLON.MeshBuilder.CreateBox(`carHood_${type}`, {
    width: hoodWidth,
    height: 0.16,
    depth: hoodLength
  }, scene);
  hood.rotation.x = -0.07; // Natural aerodynamic rake
  hood.position.set(0, 0.72, 1.25);
  hood.material = carPaintMat;
  hood.parent = root;
  optimizeVehiclePart(hood);
  if (shadowGenerator) shadowGenerator.addShadowCaster(hood);

  // Twin Hood Character Creases
  [-0.48, 0.48].forEach((hx, i) => {
    const crease = BABYLON.MeshBuilder.CreateCapsule(`hoodCrease_${i}`, {
      radius: 0.015,
      height: 1.20,
      tessellation: 12
    }, scene);
    crease.rotation.x = Math.PI / 2 - 0.07;
    crease.position.set(hx, 0.81, 1.25);
    crease.material = carPaintMat;
    crease.parent = root;
    optimizeVehiclePart(crease);
  });

  // Sculpted Front Nose & Grille Bezel
  const frontNose = BABYLON.MeshBuilder.CreateBox(`frontNose_${type}`, {
    width: width * 0.86,
    height: 0.36,
    depth: 0.38
  }, scene);
  frontNose.position.set(0, 0.52, 1.98);
  frontNose.material = carPaintMat;
  frontNose.parent = root;
  optimizeVehiclePart(frontNose);

  // Aerodynamic Chamfered Front Bumper Corners
  [-1, 1].forEach(side => {
    const corner = BABYLON.MeshBuilder.CreateCylinder(`bumperCorner_${side}`, {
      diameter: 0.32,
      height: 0.42,
      tessellation: 16
    }, scene);
    corner.position.set(side * (width * 0.42), 0.48, 2.05);
    corner.material = carPaintMat;
    corner.parent = root;
    optimizeVehiclePart(corner);
  });

  // Lower Protective Cladding & Rocker Skirts (Matte Charcoal)
  const lowerRocker = BABYLON.MeshBuilder.CreateBox(`lowerRocker_${type}`, {
    width: width * 1.01,
    height: 0.16,
    depth: length * 0.96
  }, scene);
  lowerRocker.position.set(0, 0.24, 0.05);
  lowerRocker.material = claddingMat;
  lowerRocker.parent = root;
  optimizeVehiclePart(lowerRocker);

  // Satin Silver Side Skirt Inlay Accent Strip
  const sideRockerSilver = BABYLON.MeshBuilder.CreateBox(`sideRockerSilver_${type}`, {
    width: width * 1.025,
    height: 0.03,
    depth: 2.30
  }, scene);
  sideRockerSilver.position.set(0, 0.23, 0.05);
  sideRockerSilver.material = satinChromeMat;
  sideRockerSilver.parent = root;
  optimizeVehiclePart(sideRockerSilver);

  // 4 Sculpted Wheel Arch Overfenders
  const wheelArchPositions = [
    { x: -width * 0.495, z: wheelBaseFrontZ },
    { x:  width * 0.495, z: wheelBaseFrontZ },
    { x: -width * 0.495, z: wheelBaseRearZ },
    { x:  width * 0.495, z: wheelBaseRearZ }
  ];

  wheelArchPositions.forEach((pos, idx) => {
    const arch = BABYLON.MeshBuilder.CreateTorus(`arch_${idx}`, {
      diameter: wheelRadius * 2.32,
      thickness: 0.05,
      tessellation: 24
    }, scene);
    arch.rotation.y = Math.PI / 2;
    arch.position.set(pos.x, wheelRadius + 0.04, pos.z);
    arch.material = claddingMat;
    arch.parent = root;
    optimizeVehiclePart(arch);
  });

  // --------------------------------------------------------------------------
  // 2. REALISTIC AUTOMOTIVE GREENHOUSE & GLASS STRUCTURE
  // --------------------------------------------------------------------------
  // The greenhouse is carefully engineered with:
  // - Dark interior cabin cavity (NO solid painted body block blocking the windows)
  // - Raked A-pillars, sleek B-pillars, and coupe C-pillars
  // - High-sheen automotive windshield with black ceramic frit border
  // - Sleek side windows with chrome beltline trim
  // - Slanted rear hatch window with defroster lines and roof spoiler
  const greenhouseWidth = width * 0.82; // Tapered tumblehome
  const roofWidth = width * 0.74;
  const roofHeight = 1.34;
  const beltlineY = 0.73;

  // Dark Interior Cavity (Absorptive cabin floor, dash, and ceiling)
  const interiorTub = BABYLON.MeshBuilder.CreateBox(`interiorTub_${type}`, {
    width: greenhouseWidth * 0.94,
    height: 0.54,
    depth: 2.30
  }, scene);
  interiorTub.position.set(0, 0.94, -0.12);
  interiorTub.material = interiorDarkMat;
  interiorTub.parent = root;
  optimizeVehiclePart(interiorTub);

  // Sculpted Dashboard under Windshield
  const dashboard = BABYLON.MeshBuilder.CreateBox(`dash_${type}`, {
    width: greenhouseWidth * 0.90,
    height: 0.22,
    depth: 0.46
  }, scene);
  dashboard.position.set(0, 0.88, 0.58);
  dashboard.material = interiorDarkMat;
  dashboard.parent = root;
  optimizeVehiclePart(dashboard);

  // Instrument Binnacle Cowl
  const binnacle = BABYLON.MeshBuilder.CreateBox(`binnacle_${type}`, {
    width: 0.28,
    height: 0.08,
    depth: 0.20
  }, scene);
  binnacle.position.set(0.32, 1.01, 0.54); // Driver right-side position (RHD Indonesia/UK standard)
  binnacle.material = interiorDarkMat;
  binnacle.parent = root;
  optimizeVehiclePart(binnacle);

  // Sport 3-Spoke Steering Wheel
  const steeringWheel = BABYLON.MeshBuilder.CreateTorus(`steerWheel_${type}`, {
    diameter: 0.22,
    thickness: 0.024,
    tessellation: 20
  }, scene);
  steeringWheel.rotation.x = -Math.PI / 3.4;
  steeringWheel.position.set(0.32, 0.96, 0.40);
  steeringWheel.material = interiorDarkMat;
  steeringWheel.parent = root;
  optimizeVehiclePart(steeringWheel);

  // Front Bucket Seats Headrests (Visible clearly through windshield and side glass)
  [-0.32, 0.32].forEach((hx, i) => {
    // Seat Back
    const seatBack = BABYLON.MeshBuilder.CreateBox(`seatBack_${i}`, {
      width: 0.34,
      height: 0.42,
      depth: 0.22
    }, scene);
    seatBack.rotation.x = -0.18;
    seatBack.position.set(hx, 0.94, 0.05);
    seatBack.material = interiorDarkMat;
    seatBack.parent = root;
    optimizeVehiclePart(seatBack);

    // Contoured Headrest
    const headrest = BABYLON.MeshBuilder.CreateBox(`headrest_${i}`, {
      width: 0.22,
      height: 0.15,
      depth: 0.12
    }, scene);
    headrest.position.set(hx, 1.18, -0.01);
    headrest.material = interiorDarkMat;
    headrest.parent = root;
    optimizeVehiclePart(headrest);
  });

  // Rear Bench Headrests (Visible through rear hatch glass)
  [-0.36, 0.36].forEach((hx, i) => {
    const rearHeadrest = BABYLON.MeshBuilder.CreateBox(`rearHeadrest_${i}`, {
      width: 0.22,
      height: 0.14,
      depth: 0.12
    }, scene);
    rearHeadrest.position.set(hx, 1.14, -0.78);
    rearHeadrest.material = interiorDarkMat;
    rearHeadrest.parent = root;
    optimizeVehiclePart(rearHeadrest);
  });

  // Interior Rearview Mirror
  const rearViewMirror = BABYLON.MeshBuilder.CreateBox(`rearViewMirror_${type}`, {
    width: 0.18,
    height: 0.05,
    depth: 0.04
  }, scene);
  rearViewMirror.position.set(0, 1.25, 0.54);
  rearViewMirror.material = interiorDarkMat;
  rearViewMirror.parent = root;
  optimizeVehiclePart(rearViewMirror);

  // --------------------------------------------------------------------------
  // ROOF & PILLARS (A-PILLARS, ROOF ARCH, B-PILLAR, C-PILLAR)
  // HONDA HR-V COUPE-CROSSOVER SIGNATURE ROOFLINE
  // --------------------------------------------------------------------------
  // The Honda HR-V has a sleek coupe-crossover roofline that curves from the raked
  // windshield brow, crowns subtly around the B-pillar (Y: 1.34), and tapers down
  // towards the rear hatch (Y: 1.27), crowned laterally with arched cant rails.

  // 1. Front Roof Section (Windshield brow to B-pillar crown)
  const frontRoofLength = 0.90;
  const frontRoof = BABYLON.MeshBuilder.CreateBox(`frontRoof_${type}`, {
    width: roofWidth,
    height: 0.045,
    depth: frontRoofLength
  }, scene);
  frontRoof.rotation.x = -0.04; // Gentle upward slope towards B-pillar
  frontRoof.position.set(0, 1.31, 0.02);
  frontRoof.material = carPaintMat;
  frontRoof.parent = root;
  optimizeVehiclePart(frontRoof);
  if (shadowGenerator) shadowGenerator.addShadowCaster(frontRoof);

  // 2. Rear Fastback Roof Section (B-pillar to rear hatch header)
  const rearRoofLength = 0.95;
  const rearRoof = BABYLON.MeshBuilder.CreateBox(`rearRoof_${type}`, {
    width: roofWidth * 0.96,
    height: 0.045,
    depth: rearRoofLength
  }, scene);
  rearRoof.rotation.x = 0.07; // Fastback downward coupe taper towards rear hatch
  rearRoof.position.set(0, 1.305, -0.68);
  rearRoof.material = carPaintMat;
  rearRoof.parent = root;
  optimizeVehiclePart(rearRoof);
  if (shadowGenerator) shadowGenerator.addShadowCaster(rearRoof);

  // 3. Curved Lateral Cant Rails (Rounded roof shoulder arches on left and right)
  [-1, 1].forEach(side => {
    // Front Arched Cant Rail
    const fCantRail = BABYLON.MeshBuilder.CreateCapsule(`fCantRail_${side}`, {
      radius: 0.038,
      height: frontRoofLength * 0.96,
      tessellation: 16
    }, scene);
    fCantRail.rotation.x = Math.PI / 2 - 0.04;
    fCantRail.position.set(side * (roofWidth * 0.47), 1.31, 0.02);
    fCantRail.material = carPaintMat;
    fCantRail.parent = root;
    optimizeVehiclePart(fCantRail);

    // Rear Arched Cant Rail (Tapers inward and downward)
    const rCantRail = BABYLON.MeshBuilder.CreateCapsule(`rCantRail_${side}`, {
      radius: 0.036,
      height: rearRoofLength * 0.96,
      tessellation: 16
    }, scene);
    rCantRail.rotation.x = Math.PI / 2 + 0.07;
    rCantRail.position.set(side * (roofWidth * 0.45), 1.305, -0.68);
    rCantRail.material = carPaintMat;
    rCantRail.parent = root;
    optimizeVehiclePart(rCantRail);

    // Integrated Low-Profile Flush Aerodynamic Roof Channel / Rail
    const flushRail = BABYLON.MeshBuilder.CreateBox(`flushRail_${side}`, {
      width: 0.028,
      height: 0.025,
      depth: 1.70
    }, scene);
    flushRail.position.set(side * (roofWidth * 0.42), 1.335, -0.32);
    flushRail.material = pianoBlackMat;
    flushRail.parent = root;
    optimizeVehiclePart(flushRail);
  });

  // 4. Honda HR-V Signature Dual Panoramic Glass Roof System
  // Ceramic Frit Base Frame
  const glassRoofFrame = BABYLON.MeshBuilder.CreateBox(`glassRoofFrame_${type}`, {
    width: roofWidth * 0.80,
    height: 0.02,
    depth: 1.54
  }, scene);
  glassRoofFrame.position.set(0, 1.33, -0.32);
  glassRoofFrame.material = glassFritMat;
  glassRoofFrame.parent = root;
  optimizeVehiclePart(glassRoofFrame);

  // Front Panoramic Glass Roof Panel (UV/IR-cut solar tint)
  const frontGlassRoof = BABYLON.MeshBuilder.CreateBox(`frontGlassRoof_${type}`, {
    width: roofWidth * 0.74,
    height: 0.02,
    depth: 0.65
  }, scene);
  frontGlassRoof.rotation.x = -0.04;
  frontGlassRoof.position.set(0, 1.335, 0.02);
  frontGlassRoof.material = privacyGlassMat;
  frontGlassRoof.parent = root;
  optimizeVehiclePart(frontGlassRoof);

  // Center Structural Cross-Member Bridge (B-Pillar Bridge)
  const centerRoofCrossMember = BABYLON.MeshBuilder.CreateBox(`centerRoofCross_${type}`, {
    width: roofWidth * 0.76,
    height: 0.025,
    depth: 0.12
  }, scene);
  centerRoofCrossMember.position.set(0, 1.336, -0.34);
  centerRoofCrossMember.material = pianoBlackMat;
  centerRoofCrossMember.parent = root;
  optimizeVehiclePart(centerRoofCrossMember);

  // Rear Panoramic Glass Roof Panel (Low-E coated dark privacy tint)
  const rearGlassRoof = BABYLON.MeshBuilder.CreateBox(`rearGlassRoof_${type}`, {
    width: roofWidth * 0.72,
    height: 0.02,
    depth: 0.65
  }, scene);
  rearGlassRoof.rotation.x = 0.07;
  rearGlassRoof.position.set(0, 1.33, -0.70);
  rearGlassRoof.material = privacyGlassMat;
  rearGlassRoof.parent = root;
  optimizeVehiclePart(rearGlassRoof);

  // A-Pillars (Sloping from cowl up to roof brow)
  [-1, 1].forEach(side => {
    const aPillar = BABYLON.MeshBuilder.CreateBox(`aPillar_${side}`, {
      width: 0.065,
      height: 0.62,
      depth: 0.065
    }, scene);
    aPillar.rotation.x = -Math.PI / 4.4; // Raked front windshield angle
    aPillar.position.set(side * (roofWidth * 0.49), 1.05, 0.48);
    aPillar.material = carPaintMat;
    aPillar.parent = root;
    optimizeVehiclePart(aPillar);
  });

  // B-Pillars (Sleek Piano Gloss Black divider)
  [-1, 1].forEach(side => {
    const bPillar = BABYLON.MeshBuilder.CreateBox(`bPillar_${side}`, {
      width: 0.04,
      height: 0.45,
      depth: 0.12
    }, scene);
    bPillar.position.set(side * (greenhouseWidth * 0.495), 1.06, -0.10);
    bPillar.material = pianoBlackMat;
    bPillar.parent = root;
    optimizeVehiclePart(bPillar);
  });

  // C-Pillars (Fastback Coupe Quarter Pillar sloping smoothly to tailgate)
  [-1, 1].forEach(side => {
    const cPillar = BABYLON.MeshBuilder.CreateBox(`cPillar_${side}`, {
      width: 0.08,
      height: 0.66,
      depth: 0.18
    }, scene);
    cPillar.rotation.x = Math.PI / 4.6;
    cPillar.position.set(side * (roofWidth * 0.47), 1.03, -0.94);
    cPillar.material = carPaintMat;
    cPillar.parent = root;
    optimizeVehiclePart(cPillar);
  });

  // --------------------------------------------------------------------------
  // 3. PRECISION GLASS PANELS (WINDSHIELD, SIDE WINDOWS, REAR HATCH)
  // --------------------------------------------------------------------------
  // A. Front Windshield (Angled smoothly with Ceramic Frit Border)
  const windshieldWidth = roofWidth * 0.94;
  const windshieldHeight = 0.64;
  const windshieldAngle = -Math.PI / 4.4; // Matches A-pillar rake

  // Windshield Ceramic Frit Frame (Black border around glass perimeter)
  const windshieldFrit = BABYLON.MeshBuilder.CreatePlane(`wsFrit_${type}`, {
    width: windshieldWidth + 0.04,
    height: windshieldHeight + 0.02
  }, scene);
  windshieldFrit.rotation.x = windshieldAngle;
  windshieldFrit.position.set(0, 1.048, 0.478);
  windshieldFrit.material = glassFritMat;
  windshieldFrit.parent = root;
  optimizeVehiclePart(windshieldFrit);

  // Main High-Gloss Windshield Glass
  const windshield = BABYLON.MeshBuilder.CreatePlane(`windshield_${type}`, {
    width: windshieldWidth,
    height: windshieldHeight
  }, scene);
  windshield.rotation.x = windshieldAngle;
  windshield.position.set(0, 1.05, 0.48);
  windshield.material = windshieldGlassMat;
  windshield.parent = root;
  optimizeVehiclePart(windshield);

  // Twin Front Windshield Wipers
  [-0.22, 0.22].forEach((wx, i) => {
    const wiper = BABYLON.MeshBuilder.CreateCapsule(`wiper_${i}`, {
      radius: 0.008,
      height: 0.42,
      tessellation: 8
    }, scene);
    wiper.rotation.z = Math.PI / 2.3;
    wiper.rotation.x = windshieldAngle;
    wiper.position.set(wx, 0.81, 0.74);
    wiper.material = pianoBlackMat;
    wiper.parent = root;
    optimizeVehiclePart(wiper);
  });

  // B. Side Windows (Left & Right with Sleek Beltline and Quarter Glass)
  [-1, 1].forEach(side => {
    const sideX = side * (greenhouseWidth * 0.495);

    // Front Side Window (Driver / Front Passenger)
    const frontSideGlass = BABYLON.MeshBuilder.CreatePlane(`frontSideGlass_${side}`, {
      width: 0.68,
      height: 0.38
    }, scene);
    frontSideGlass.rotation.y = side * (Math.PI / 2);
    frontSideGlass.position.set(sideX, 1.06, 0.24);
    frontSideGlass.material = privacyGlassMat;
    frontSideGlass.parent = root;
    optimizeVehiclePart(frontSideGlass);

    // Rear Side Window
    const rearSideGlass = BABYLON.MeshBuilder.CreatePlane(`rearSideGlass_${side}`, {
      width: 0.58,
      height: 0.38
    }, scene);
    rearSideGlass.rotation.y = side * (Math.PI / 2);
    rearSideGlass.position.set(sideX, 1.06, -0.42);
    rearSideGlass.material = privacyGlassMat;
    rearSideGlass.parent = root;
    optimizeVehiclePart(rearSideGlass);

    // Quarter Window (Triangular C-pillar window with kick-up)
    const quarterGlass = BABYLON.MeshBuilder.CreatePlane(`quarterGlass_${side}`, {
      width: 0.30,
      height: 0.34
    }, scene);
    quarterGlass.rotation.y = side * (Math.PI / 2);
    quarterGlass.position.set(sideX * 0.98, 1.08, -0.84);
    quarterGlass.material = privacyGlassMat;
    quarterGlass.parent = root;
    optimizeVehiclePart(quarterGlass);

    // Satin Chrome Window Beltline Trim Strip (Lower sill)
    const beltlineChrome = BABYLON.MeshBuilder.CreateBox(`beltChrome_${side}`, {
      width: 0.02,
      height: 0.025,
      depth: 1.68
    }, scene);
    beltlineChrome.position.set(side * (greenhouseWidth * 0.505), beltlineY + 0.12, -0.25);
    beltlineChrome.material = satinChromeMat;
    beltlineChrome.parent = root;
    optimizeVehiclePart(beltlineChrome);

    // Upper Roof Arch Chrome Line
    const upperChrome = BABYLON.MeshBuilder.CreateBox(`upperChrome_${side}`, {
      width: 0.02,
      height: 0.02,
      depth: 1.62
    }, scene);
    upperChrome.position.set(side * (roofWidth * 0.51), roofHeight - 0.02, -0.22);
    upperChrome.material = satinChromeMat;
    upperChrome.parent = root;
    optimizeVehiclePart(upperChrome);

    // C-Pillar Hidden Door Handle (Signature HR-V / Coupe SUV aesthetic)
    const handleRecess = BABYLON.MeshBuilder.CreateBox(`handleRecess_${side}`, {
      width: 0.03,
      height: 0.09,
      depth: 0.16
    }, scene);
    handleRecess.position.set(side * (greenhouseWidth * 0.51), 1.06, -0.72);
    handleRecess.material = pianoBlackMat;
    handleRecess.parent = root;
    optimizeVehiclePart(handleRecess);

    // Front Door Handle (Sleek grab handle)
    const frontHandle = BABYLON.MeshBuilder.CreateCapsule(`fHandle_${side}`, {
      radius: 0.014,
      height: 0.16,
      tessellation: 10
    }, scene);
    frontHandle.rotation.x = Math.PI / 2;
    frontHandle.position.set(side * (width * 0.495), 0.75, 0.38);
    frontHandle.material = carPaintMat;
    frontHandle.parent = root;
    optimizeVehiclePart(frontHandle);
  });

  // C. Slanted Rear Hatch Window (Tailgate Glass with Ceramic Frit & Defroster)
  const rearGlassWidth = roofWidth * 0.92;
  const rearGlassHeight = 0.70;
  const rearGlassAngle = Math.PI / 4.2;

  // Rear Glass Black Ceramic Frit Border
  const rearFrit = BABYLON.MeshBuilder.CreatePlane(`rearFrit_${type}`, {
    width: rearGlassWidth + 0.04,
    height: rearGlassHeight + 0.02
  }, scene);
  rearFrit.rotation.x = rearGlassAngle;
  rearFrit.position.set(0, 1.058, -1.218);
  rearFrit.material = glassFritMat;
  rearFrit.parent = root;
  optimizeVehiclePart(rearFrit);

  // Main Rear Privacy Glass
  const rearGlass = BABYLON.MeshBuilder.CreatePlane(`rearGlass_${type}`, {
    width: rearGlassWidth,
    height: rearGlassHeight
  }, scene);
  rearGlass.rotation.x = rearGlassAngle;
  rearGlass.position.set(0, 1.06, -1.22);
  rearGlass.material = privacyGlassMat;
  rearGlass.parent = root;
  optimizeVehiclePart(rearGlass);

  // Horizontal Defroster Lines
  for (let d = 0; d < 4; d++) {
    const defLine = BABYLON.MeshBuilder.CreateBox(`defLine_${d}`, {
      width: rearGlassWidth * 0.82,
      height: 0.006,
      depth: 0.008
    }, scene);
    defLine.rotation.x = rearGlassAngle;
    defLine.position.set(0, 0.96 + d * 0.065, -1.33 + d * 0.065);
    defLine.material = glassFritMat;
    defLine.parent = root;
    optimizeVehiclePart(defLine);
  }

  // --------------------------------------------------------------------------
  // HONDA HR-V FLOATING REAR ROOF SPOILER & SIDE AERO FINS
  // --------------------------------------------------------------------------
  const spoilerY = 1.30;
  const spoilerZ = -1.22;

  // Main Aerodynamic Spoiler Blade
  const roofSpoiler = BABYLON.MeshBuilder.CreateBox(`roofSpoiler_${type}`, {
    width: roofWidth * 0.98,
    height: 0.05,
    depth: 0.38
  }, scene);
  roofSpoiler.rotation.x = 0.04;
  roofSpoiler.position.set(0, spoilerY, spoilerZ);
  roofSpoiler.material = pianoBlackMat;
  roofSpoiler.parent = root;
  optimizeVehiclePart(roofSpoiler);

  // Aerodynamic Trailing Gurney Flap / Lip
  const spoilerLip = BABYLON.MeshBuilder.CreateBox(`spoilerLip_${type}`, {
    width: roofWidth * 0.94,
    height: 0.018,
    depth: 0.06
  }, scene);
  spoilerLip.position.set(0, spoilerY + 0.018, spoilerZ - 0.18);
  spoilerLip.material = pianoBlackMat;
  spoilerLip.parent = root;
  optimizeVehiclePart(spoilerLip);

  // Left & Right Vertical Side Aero Fins (HR-V Signature Trailing Strakes)
  [-1, 1].forEach(side => {
    const sideFin = BABYLON.MeshBuilder.CreateBox(`sideAeroFin_${side}`, {
      width: 0.025,
      height: 0.16,
      depth: 0.34
    }, scene);
    sideFin.rotation.x = rearGlassAngle * 0.65;
    sideFin.position.set(side * (roofWidth * 0.465), spoilerY - 0.05, spoilerZ - 0.04);
    sideFin.material = pianoBlackMat;
    sideFin.parent = root;
    optimizeVehiclePart(sideFin);
  });

  // Third High-Mounted LED Brake Light (Integrated flush in spoiler center)
  const thirdBrake = BABYLON.MeshBuilder.CreateBox(`thirdBrake_${type}`, {
    width: 0.38,
    height: 0.022,
    depth: 0.03
  }, scene);
  thirdBrake.position.set(0, spoilerY - 0.012, spoilerZ - 0.19);
  thirdBrake.material = ledTaillightMat;
  thirdBrake.parent = root;
  optimizeVehiclePart(thirdBrake);

  // Rear Tailgate Wiper
  const rearWiper = BABYLON.MeshBuilder.CreateCapsule(`rearWiper_${type}`, {
    radius: 0.009,
    height: 0.28,
    tessellation: 8
  }, scene);
  rearWiper.rotation.z = Math.PI / 4.8;
  rearWiper.rotation.x = rearGlassAngle;
  rearWiper.position.set(0, 0.92, -1.48);
  rearWiper.material = pianoBlackMat;
  rearWiper.parent = root;
  optimizeVehiclePart(rearWiper);

  // Aerodynamic Shark-Fin Antenna (Properly positioned on rear roof crown before spoiler)
  const sharkFinBase = BABYLON.MeshBuilder.CreateBox(`finBase_${type}`, {
    width: 0.05,
    height: 0.016,
    depth: 0.22
  }, scene);
  sharkFinBase.position.set(0, 1.32, -1.02);
  sharkFinBase.material = pianoBlackMat;
  sharkFinBase.parent = root;
  optimizeVehiclePart(sharkFinBase);

  const sharkFin = BABYLON.MeshBuilder.CreateCylinder(`fin_${type}`, {
    diameterTop: 0.01,
    diameterBottom: 0.05,
    height: 0.11,
    tessellation: 12
  }, scene);
  sharkFin.rotation.x = -Math.PI / 4.2; // Swept-back aerodynamic rake
  sharkFin.position.set(0, 1.37, -1.02);
  sharkFin.material = carPaintMat;
  sharkFin.parent = root;
  optimizeVehiclePart(sharkFin);

  // Aerodynamic Two-Tone Side Mirrors
  [-1, 1].forEach(side => {
    // Mounting stalk
    const stalk = BABYLON.MeshBuilder.CreateBox(`mStalk_${side}`, {
      width: 0.08,
      height: 0.03,
      depth: 0.06
    }, scene);
    stalk.position.set(side * (width * 0.46), 0.85, 0.50);
    stalk.material = pianoBlackMat;
    stalk.parent = root;
    optimizeVehiclePart(stalk);

    // Aerodynamic mirror shell
    const cap = BABYLON.MeshBuilder.CreateSphere(`mCap_${side}`, {
      diameterX: 0.13,
      diameterY: 0.09,
      diameterZ: 0.19,
      segments: 12
    }, scene);
    cap.position.set(side * (width * 0.53), 0.87, 0.50);
    cap.material = carPaintMat;
    cap.parent = root;
    optimizeVehiclePart(cap);

    // Mirror reflective glass
    const glass = BABYLON.MeshBuilder.CreatePlane(`mGlass_${side}`, {
      width: 0.12,
      height: 0.075
    }, scene);
    glass.rotation.y = Math.PI;
    glass.position.set(side * (width * 0.53), 0.87, 0.402);
    glass.material = satinChromeMat;
    glass.parent = root;
    optimizeVehiclePart(glass);
  });

  // --------------------------------------------------------------------------
  // 4. FRONT FASCIA (HORIZONTAL MULTI-SLAT GRILLE & JEWEL LED HEADLIGHTS)
  // --------------------------------------------------------------------------
  const grilleWidth = width * 0.58;
  const numSlats = 6;
  const slatSpacing = 0.042;
  const grilleCenterY = 0.55;

  // Dark Recessed Grille Cavity
  const grilleBackdrop = BABYLON.MeshBuilder.CreateBox(`grilleBackdrop_${type}`, {
    width: grilleWidth,
    height: numSlats * slatSpacing + 0.02,
    depth: 0.05
  }, scene);
  grilleBackdrop.position.set(0, grilleCenterY, 2.14);
  grilleBackdrop.material = pianoBlackMat;
  grilleBackdrop.parent = root;
  optimizeVehiclePart(grilleBackdrop);

  // Seamless Horizontal Slats (Body Colored - Signature HR-V Style)
  for (let i = 0; i < numSlats; i++) {
    const y = grilleCenterY - ((numSlats - 1) / 2) * slatSpacing + i * slatSpacing;
    const slatW = grilleWidth * (1.0 - Math.abs(i - 2.5) * 0.04);
    const slat = BABYLON.MeshBuilder.CreateCapsule(`grilleSlat_${i}`, {
      radius: 0.013,
      height: slatW,
      tessellation: 10
    }, scene);
    slat.rotation.z = Math.PI / 2;
    slat.position.set(0, y, 2.165);
    slat.material = carPaintMat;
    slat.parent = root;
    optimizeVehiclePart(slat);
  }

  // Central Emblem Badge [H] with Hybrid Blue Accent
  const emblemOuter = BABYLON.MeshBuilder.CreateBox(`emblemOuter_${type}`, {
    width: 0.13,
    height: 0.10,
    depth: 0.03
  }, scene);
  emblemOuter.position.set(0, grilleCenterY + 0.04, 2.175);
  emblemOuter.material = emblemMat;
  emblemOuter.parent = root;
  optimizeVehiclePart(emblemOuter);

  const emblemInnerH = BABYLON.MeshBuilder.CreateBox(`emblemH_${type}`, {
    width: 0.09,
    height: 0.07,
    depth: 0.035
  }, scene);
  emblemInnerH.position.set(0, grilleCenterY + 0.04, 2.18);
  emblemInnerH.material = satinChromeMat;
  emblemInnerH.parent = root;
  optimizeVehiclePart(emblemInnerH);

  // Jewel-Eye LED Headlights & Eyebrow DRLs
  [-1, 1].forEach(side => {
    const lampX = side * (width * 0.38);
    const lampY = 0.65;
    const lampZ = 2.08;

    // Main multi-projector housing
    const lamp = BABYLON.MeshBuilder.CreateBox(`headlight_${side}`, {
      width: 0.32,
      height: 0.08,
      depth: 0.08
    }, scene);
    lamp.rotation.y = side * 0.18; // Follows nose curvature
    lamp.position.set(lampX, lampY, lampZ);
    lamp.material = ledHeadlightMat;
    lamp.parent = root;
    optimizeVehiclePart(lamp);

    // Top Eyebrow DRL Strip
    const eyebrow = BABYLON.MeshBuilder.CreateBox(`eyebrow_${side}`, {
      width: 0.34,
      height: 0.02,
      depth: 0.09
    }, scene);
    eyebrow.rotation.y = side * 0.18;
    eyebrow.position.set(lampX, lampY + 0.045, lampZ + 0.005);
    eyebrow.material = ledHeadlightMat;
    eyebrow.parent = root;
    optimizeVehiclePart(eyebrow);

    // Night beam spotlight
    const spot = new BABYLON.SpotLight(
      `spot_${side}_${Date.now()}`,
      new BABYLON.Vector3(lampX, lampY, 2.14),
      new BABYLON.Vector3(0, -0.15, 1),
      Math.PI / 3.2,
      2,
      scene
    );
    spot.intensity = 0; // Activated dynamically in night/sunset mode
    spot.diffuse = new BABYLON.Color3(0.96, 0.98, 1.0);
    headlights.push(spot);
  });

  // Lower Front Air Dam Intake
  const lowerIntake = BABYLON.MeshBuilder.CreateBox(`lowerIntake_${type}`, {
    width: width * 0.68,
    height: 0.15,
    depth: 0.08
  }, scene);
  lowerIntake.position.set(0, 0.34, 2.14);
  lowerIntake.material = claddingMat;
  lowerIntake.parent = root;
  optimizeVehiclePart(lowerIntake);

  // Satin Silver Front Chin Skid Lip
  const frontChinLip = BABYLON.MeshBuilder.CreateBox(`frontChinLip_${type}`, {
    width: width * 0.52,
    height: 0.04,
    depth: 0.10
  }, scene);
  frontChinLip.position.set(0, 0.24, 2.17);
  frontChinLip.material = satinChromeMat;
  frontChinLip.parent = root;
  optimizeVehiclePart(frontChinLip);

  // Horizontal LED Fog / Accent Strips
  [-1, 1].forEach(side => {
    const fog = BABYLON.MeshBuilder.CreateBox(`fog_${side}`, {
      width: 0.12,
      height: 0.02,
      depth: 0.04
    }, scene);
    fog.position.set(side * (width * 0.35), 0.33, 2.16);
    fog.material = ledHeadlightMat;
    fog.parent = root;
    optimizeVehiclePart(fog);
  });

  // --------------------------------------------------------------------------
  // 5. REAR FASCIA (FULL-WIDTH CONTINUOUS LED LIGHT BAR & DIFFUSER)
  // --------------------------------------------------------------------------
  const rearY = 0.74;
  const rearZ = -2.08;

  // Continuous Full-Width Ruby Red LED Light Bar
  const rearLightBar = BABYLON.MeshBuilder.CreateBox(`rearLightBar_${type}`, {
    width: width * 0.92,
    height: 0.06,
    depth: 0.06
  }, scene);
  rearLightBar.position.set(0, rearY, rearZ);
  rearLightBar.material = ledTaillightMat;
  rearLightBar.parent = root;
  optimizeVehiclePart(rearLightBar);

  // Outer Taillight Clusters
  [-1, 1].forEach(side => {
    const tailCluster = BABYLON.MeshBuilder.CreateBox(`tailCluster_${side}`, {
      width: 0.20,
      height: 0.10,
      depth: 0.07
    }, scene);
    tailCluster.position.set(side * (width * 0.41), rearY, rearZ);
    tailCluster.material = ledTaillightMat;
    tailCluster.parent = root;
    optimizeVehiclePart(tailCluster);
  });

  // Center Rear Emblem
  const rearEmblem = BABYLON.MeshBuilder.CreateBox(`rearEmblem_${type}`, {
    width: 0.11,
    height: 0.08,
    depth: 0.035
  }, scene);
  rearEmblem.position.set(0, rearY, rearZ - 0.015);
  rearEmblem.material = emblemMat;
  rearEmblem.parent = root;
  optimizeVehiclePart(rearEmblem);

  // Rear Lower Cladding Bumper
  const rearBumper = BABYLON.MeshBuilder.CreateBox(`rearBumper_${type}`, {
    width: width * 0.92,
    height: 0.25,
    depth: 0.14
  }, scene);
  rearBumper.position.set(0, 0.36, rearZ + 0.04);
  rearBumper.material = claddingMat;
  rearBumper.parent = root;
  optimizeVehiclePart(rearBumper);

  // Rear Satin Silver Diffuser Skid Plate
  const rearSilverDiffuser = BABYLON.MeshBuilder.CreateBox(`rearDiffuser_${type}`, {
    width: width * 0.58,
    height: 0.05,
    depth: 0.15
  }, scene);
  rearSilverDiffuser.position.set(0, 0.25, rearZ + 0.02);
  rearSilverDiffuser.material = satinChromeMat;
  rearSilverDiffuser.parent = root;
  optimizeVehiclePart(rearSilverDiffuser);

  // Rear Slim Red Reflectors
  [-1, 1].forEach(side => {
    const ref = BABYLON.MeshBuilder.CreateBox(`ref_${side}`, {
      width: 0.16,
      height: 0.024,
      depth: 0.04
    }, scene);
    ref.position.set(side * (width * 0.32), 0.42, rearZ - 0.01);
    ref.material = ledTaillightMat;
    ref.parent = root;
    optimizeVehiclePart(ref);
  });

  // --------------------------------------------------------------------------
  // 6. LICENSE PLATES ("SLOWPOLY.COM" / ALPR READY)
  // --------------------------------------------------------------------------
  const plateMat = new BABYLON.StandardMaterial(`plateMat_${type}`, scene);
  const plateTex = new BABYLON.DynamicTexture(`plateTex_${type}`, { width: 512, height: 128 }, scene);
  plateTex.hasAlpha = false;
  plateMat.diffuseTexture = plateTex;

  const ctxP = plateTex.getContext() as unknown as CanvasRenderingContext2D;
  ctxP.fillStyle = '#ffffff';
  ctxP.fillRect(0, 0, 512, 128);

  ctxP.strokeStyle = '#1e293b';
  ctxP.lineWidth = 6;
  ctxP.strokeRect(4, 4, 504, 120);

  // Blue country identifier band
  ctxP.fillStyle = '#1d4ed8';
  ctxP.fillRect(4, 4, 72, 120);

  ctxP.fillStyle = '#facc15';
  ctxP.font = 'bold 22px sans-serif';
  ctxP.textAlign = 'center';
  ctxP.fillText('★', 40, 45);
  ctxP.fillStyle = '#ffffff';
  ctxP.font = 'bold 26px sans-serif';
  ctxP.fillText('ID', 40, 92);

  // Plate text: "SLOWPOLY.COM"
  ctxP.fillStyle = '#0f172a';
  ctxP.font = '900 48px monospace';
  ctxP.textAlign = 'center';
  ctxP.textBaseline = 'middle';
  ctxP.fillText('SLOWPOLY.COM', 296, 64);
  plateTex.update();
  plateMat.freeze();

  // Front License Plate
  const frontPlate = BABYLON.MeshBuilder.CreatePlane(`frontPlate_${type}`, { width: 0.50, height: 0.15 }, scene);
  frontPlate.position.set(0, 0.40, 2.19);
  frontPlate.material = plateMat;
  frontPlate.parent = root;
  optimizeVehiclePart(frontPlate);

  // Rear License Plate
  const rearPlate = BABYLON.MeshBuilder.CreatePlane(`rearPlate_${type}`, { width: 0.50, height: 0.15 }, scene);
  rearPlate.position.set(0, 0.56, rearZ - 0.015);
  rearPlate.rotation.y = Math.PI;
  rearPlate.material = plateMat;
  rearPlate.parent = root;
  optimizeVehiclePart(rearPlate);

  // --------------------------------------------------------------------------
  // 7. REALISTIC TWO-TONE WHEELS & BRAKE ASSEMBLIES
  // --------------------------------------------------------------------------
  const wheelTrackWidth = width * 0.48;

  const wheelPositions = [
    { x: -wheelTrackWidth, y: wheelRadius, z: wheelBaseFrontZ },
    { x:  wheelTrackWidth, y: wheelRadius, z: wheelBaseFrontZ },
    { x: -wheelTrackWidth, y: wheelRadius, z: wheelBaseRearZ },
    { x:  wheelTrackWidth, y: wheelRadius, z: wheelBaseRearZ }
  ];

  wheelPositions.forEach((pos, idx) => {
    const isRight = pos.x > 0;
    const outwardSign = isRight ? 1 : -1;

    // Main Rotating Wheel Mesh (Rotates around X axis during vehicle movement)
    const wheel = BABYLON.MeshBuilder.CreateCylinder(`wheel_${type}_${idx}`, {
      diameter: wheelRadius * 2,
      height: wheelThickness,
      tessellation: 32
    }, scene);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.material = tireMat;
    wheel.parent = root;
    optimizeVehiclePart(wheel);

    // Dark Gunmetal Inner Rim Barrel
    const rimBase = BABYLON.MeshBuilder.CreateCylinder(`rimBase_${type}_${idx}`, {
      diameter: wheelRadius * 1.54,
      height: wheelThickness + 0.015,
      tessellation: 24
    }, scene);
    rimBase.parent = wheel;
    rimBase.material = rimBaseMat;
    optimizeVehiclePart(rimBase);

    // Two-Tone 5-Split-Spoke Machined Silver Face
    for (let s = 0; s < 5; s++) {
      const angle = (s * 2 * Math.PI) / 5;
      [-0.12, 0.12].forEach((offsetAngle, vIdx) => {
        const spoke = BABYLON.MeshBuilder.CreateCapsule(`spoke_${idx}_${s}_${vIdx}`, {
          radius: 0.012,
          height: wheelRadius * 0.70,
          tessellation: 10
        }, scene);
        spoke.rotation.x = angle + offsetAngle;
        spoke.position.y = (wheelThickness + 0.02) / 2;
        spoke.position.z = Math.sin(angle + offsetAngle) * (wheelRadius * 0.32);
        spoke.position.x = Math.cos(angle + offsetAngle) * (wheelRadius * 0.32);
        spoke.parent = wheel;
        spoke.material = satinChromeMat;
        optimizeVehiclePart(spoke);
      });
    }

    // Polished Center Hub Cap
    const hubCap = BABYLON.MeshBuilder.CreateCylinder(`hubCap_${idx}`, {
      diameter: 0.12,
      height: wheelThickness + 0.03,
      tessellation: 16
    }, scene);
    hubCap.parent = wheel;
    hubCap.material = satinChromeMat;
    optimizeVehiclePart(hubCap);

    // Steel Brake Disc Rotor
    const brakeDisc = BABYLON.MeshBuilder.CreateCylinder(`brakeDisc_${idx}`, {
      diameter: wheelRadius * 1.30,
      height: 0.02,
      tessellation: 24
    }, scene);
    brakeDisc.position.y = -wheelThickness * 0.15;
    brakeDisc.parent = wheel;
    brakeDisc.material = brakeDiscMat;
    optimizeVehiclePart(brakeDisc);

    // Stationary Sport Red Brake Caliper
    const caliper = BABYLON.MeshBuilder.CreateBox(`caliper_${idx}`, {
      width: 0.065,
      height: 0.09,
      depth: 0.14
    }, scene);
    caliper.position.set(pos.x - outwardSign * 0.04, pos.y + wheelRadius * 0.38, pos.z + 0.08);
    caliper.material = caliperMat;
    caliper.parent = root;
    optimizeVehiclePart(caliper);

    wheels.push(wheel);
  });

  return {
    root,
    bodyMesh,
    wheels,
    headlights,
    licensePlateMesh: frontPlate,
    type,
    boundingLength: length
  };
}
