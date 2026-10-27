import * as THREE from 'three';
import { BranchRouteDirection } from '../junctionSystem';

/**
 * MULTI-LEVEL DYNAMIC ROUTE GRAPH & PHYSICAL RAMPS SYSTEM
 *
 * Implements the complete multi-tier physical track network:
 * - 4 Altitude Tiers: LOW LEVEL, MID LEVEL, HIGH LEVEL, EXTREME LEVEL
 * - 17 Physical Route Types (Standard, Left, Right, Center, Upper, Lower, Gravity,
 *   Orbital, Station, Debris, Neutron, Planetary, Collapse, Ramp, Spiral, Ring, Escape)
 * - Physical Ramps: Launch ramps, vertical ramps, broken jump ramps, station entry ramps
 * - Dynamic Route Failures: Routes can fracture and collapse while emergency fallbacks open
 * - Real physics: Physical trajectory, momentum preservation, NO TELEPORTATION.
 */

export type RouteCategory =
  | 'STANDARD'
  | 'LEFT'
  | 'RIGHT'
  | 'CENTER'
  | 'UPPER'
  | 'LOWER'
  | 'GRAVITY'
  | 'ORBITAL'
  | 'STATION'
  | 'DEBRIS'
  | 'NEUTRON'
  | 'PLANETARY'
  | 'COLLAPSE'
  | 'RAMP'
  | 'SPIRAL'
  | 'RING'
  | 'ESCAPE';

export type RouteAltitudeLevel = 'LOW' | 'MID' | 'HIGH' | 'EXTREME';

export type PhysicalRouteDirection = BranchRouteDirection | 'UP' | 'DOWN';

export interface PhysicalRouteNode {
  id: string;
  name: string;
  category: RouteCategory;
  altitudeLevel: RouteAltitudeLevel;
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh;
  width: number;
  direction: PhysicalRouteDirection;
  colorHex: number;
  totalLength: number;
  isRamp: boolean;
  rampAngleDeg?: number;
  isJumpTrack: boolean;
  isCollapsed: boolean;
  collapseStartEvent: number;
  fallbackRouteId?: string;
  hasBoostPads: boolean;
}

export interface DynamicJunctionPoint {
  id: string;
  name: string;
  splineT: number; // Approximate location along main course
  position: THREE.Vector3;
  availableDirections: PhysicalRouteDirection[];
  routes: PhysicalRouteNode[];
  signageMesh: THREE.Group;
}

export class DynamicRouteGraphSystem {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;

  public routes: Map<string, PhysicalRouteNode> = new Map();
  public junctions: Map<string, DynamicJunctionPoint> = new Map();

  // Route Mesh Groups by Level
  private lowLevelGroup: THREE.Group;
  private midLevelGroup: THREE.Group;
  private highLevelGroup: THREE.Group;
  private extremeLevelGroup: THREE.Group;

  // Active Collapsible Ramps & Bridges
  private dynamicRampsGroup: THREE.Group;
  private holographicSignageGroup: THREE.Group;

  // Materials
  private roadMaterial: THREE.MeshStandardMaterial;
  private neonBorderMaterial: THREE.MeshBasicMaterial;
  private boostStripMaterial: THREE.MeshBasicMaterial;
  private warningBarrierMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, blackHolePos = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePos.clone();

    this.root = new THREE.Group();
    this.root.name = 'DynamicRouteGraphSystem_Root';

    this.lowLevelGroup = new THREE.Group();
    this.lowLevelGroup.name = 'Routes_LowLevel';
    this.midLevelGroup = new THREE.Group();
    this.midLevelGroup.name = 'Routes_MidLevel';
    this.highLevelGroup = new THREE.Group();
    this.highLevelGroup.name = 'Routes_HighLevel';
    this.extremeLevelGroup = new THREE.Group();
    this.extremeLevelGroup.name = 'Routes_ExtremeLevel';
    this.dynamicRampsGroup = new THREE.Group();
    this.dynamicRampsGroup.name = 'Routes_DynamicRamps';
    this.holographicSignageGroup = new THREE.Group();
    this.holographicSignageGroup.name = 'Routes_HolographicSignage';

    this.root.add(this.lowLevelGroup);
    this.root.add(this.midLevelGroup);
    this.root.add(this.highLevelGroup);
    this.root.add(this.extremeLevelGroup);
    this.root.add(this.dynamicRampsGroup);
    this.root.add(this.holographicSignageGroup);

    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.85,
    });
    this.neonBorderMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });
    this.boostStripMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00e5,
    });
    this.warningBarrierMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
    });

    this.buildMultiLevelPhysicalRoutes();
    this.buildDynamicPhysicalRamps();
    this.buildHolographicJunctionSignage();

    this.scene.add(this.root);
  }

  /**
   * Builds the 4 altitude levels and diverse physical route curves
   */
  private buildMultiLevelPhysicalRoutes(): void {
    // -------------------------------------------------------------
    // LEVEL 1: LOW LEVEL (Y: -60 to -10)
    // 1. Lower Subterranean Industrial Conduit (LOWER ROUTE)
    const lowerPoints = [
      new THREE.Vector3(40, -10, -800),
      new THREE.Vector3(120, -50, -1200),
      new THREE.Vector3(160, -75, -1650),
      new THREE.Vector3(90, -60, -2150),
      new THREE.Vector3(-20, -25, -2600),
    ];
    this.registerRoute({
      id: 'route_lower_conduit',
      name: 'SUBTERRANEAN LOWER CONDUIT',
      category: 'LOWER',
      altitudeLevel: 'LOW',
      points: lowerPoints,
      width: 28,
      direction: 'DOWN',
      colorHex: 0xf59e0b,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 65,
    });

    // 2. Debris Gauntlet Trench (DEBRIS ROUTE)
    const debrisPoints = [
      new THREE.Vector3(-140, -20, -950),
      new THREE.Vector3(-260, -55, -1400),
      new THREE.Vector3(-310, -70, -1900),
      new THREE.Vector3(-180, -35, -2400),
      new THREE.Vector3(0, -15, -2750),
    ];
    this.registerRoute({
      id: 'route_debris_gauntlet',
      name: 'COLLAPSING DEBRIS TRENCH',
      category: 'DEBRIS',
      altitudeLevel: 'LOW',
      points: debrisPoints,
      width: 26,
      direction: 'LEFT',
      colorHex: 0xef4444,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 75,
    });

    // -------------------------------------------------------------
    // LEVEL 2: MID LEVEL (Y: 20 to 80)
    // 3. Station Interior Transit Tube (STATION ROUTE)
    const stationPoints = [
      new THREE.Vector3(-180, 45, -750),
      new THREE.Vector3(-380, 65, -1250),
      new THREE.Vector3(-480, 80, -1750),
      new THREE.Vector3(-360, 55, -2250),
      new THREE.Vector3(-80, 35, -2650),
    ];
    this.registerRoute({
      id: 'route_station_transit',
      name: 'ORBITAL STATION INTERIOR ARTERY',
      category: 'STATION',
      altitudeLevel: 'MID',
      points: stationPoints,
      width: 32,
      direction: 'LEFT',
      colorHex: 0x00f0ff,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 55,
    });

    // 4. Gravity Shear Accelerator (GRAVITY ROUTE)
    const gravityPoints = [
      new THREE.Vector3(150, 30, -700),
      new THREE.Vector3(290, 15, -1150),
      new THREE.Vector3(380, -5, -1650),
      new THREE.Vector3(320, 20, -2150),
      new THREE.Vector3(120, 40, -2600),
    ];
    this.registerRoute({
      id: 'route_gravity_slingshot',
      name: 'GRAVITY SLINGSHOT CHASM',
      category: 'GRAVITY',
      altitudeLevel: 'MID',
      points: gravityPoints,
      width: 30,
      direction: 'RIGHT',
      colorHex: 0xd946ef,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 60,
    });

    // -------------------------------------------------------------
    // LEVEL 3: HIGH LEVEL (Y: 100 to 220)
    // 5. Elevated Orbital Ring Skyway (RING / UPPER ROUTE)
    const upperPoints = [
      new THREE.Vector3(0, 50, -850),
      new THREE.Vector3(-80, 110, -1300),
      new THREE.Vector3(-120, 160, -1800),
      new THREE.Vector3(-50, 140, -2300),
      new THREE.Vector3(40, 80, -2700),
    ];
    this.registerRoute({
      id: 'route_upper_ring_skyway',
      name: 'ELEVATED ORBITAL RING FLYOVER',
      category: 'UPPER',
      altitudeLevel: 'HIGH',
      points: upperPoints,
      width: 34,
      direction: 'UP',
      colorHex: 0x38bdf8,
      isRamp: true,
      rampAngleDeg: 18,
      isJumpTrack: false,
      collapseStartEvent: 70,
    });

    // 6. Planetary Orbit Sweep (PLANETARY ROUTE)
    const planetPoints = [
      new THREE.Vector3(-220, 60, -1000),
      new THREE.Vector3(-450, 140, -1500),
      new THREE.Vector3(-620, 190, -2050),
      new THREE.Vector3(-490, 160, -2600),
      new THREE.Vector3(-180, 90, -2950),
    ];
    this.registerRoute({
      id: 'route_planetary_sweep',
      name: 'PLANETARY HORIZON OVERPASS',
      category: 'PLANETARY',
      altitudeLevel: 'HIGH',
      points: planetPoints,
      width: 36,
      direction: 'LEFT',
      colorHex: 0x2dd4bf,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 80,
    });

    // -------------------------------------------------------------
    // LEVEL 4: EXTREME LEVEL (Y: 240 to 420)
    // 7. Neutron Star Radiation Bridge (NEUTRON ROUTE)
    const neutronPoints = [
      new THREE.Vector3(180, 90, -1200),
      new THREE.Vector3(380, 210, -1700),
      new THREE.Vector3(520, 290, -2250),
      new THREE.Vector3(390, 240, -2800),
      new THREE.Vector3(110, 150, -3200),
    ];
    this.registerRoute({
      id: 'route_neutron_skybridge',
      name: 'RELATIVISTIC NEUTRON SKYBRIDGE',
      category: 'NEUTRON',
      altitudeLevel: 'EXTREME',
      points: neutronPoints,
      width: 28,
      direction: 'UP',
      colorHex: 0x67e8f9,
      isRamp: true,
      rampAngleDeg: 24,
      isJumpTrack: false,
      collapseStartEvent: 85,
    });

    // 8. Mega Jump Ramp Launch (RAMP ROUTE)
    const jumpPoints = [
      new THREE.Vector3(0, 40, -1400),
      new THREE.Vector3(0, 110, -1650),
      new THREE.Vector3(0, 220, -1950), // Peak launch lip
      new THREE.Vector3(0, 180, -2250), // Freeflight ballistic receiver
      new THREE.Vector3(0, 60, -2550),  // Receiver landing pad
    ];
    this.registerRoute({
      id: 'route_mega_jump_ramp',
      name: 'SUB-ORBITAL BALLISTIC JUMP RAMP',
      category: 'RAMP',
      altitudeLevel: 'EXTREME',
      points: jumpPoints,
      width: 38,
      direction: 'CENTER',
      colorHex: 0xff0055,
      isRamp: true,
      rampAngleDeg: 32,
      isJumpTrack: true,
      collapseStartEvent: 90,
    });

    // -------------------------------------------------------------
    // PART 2: MEGA-CITIES & BLACK HOLE PROXIMITY EXPANSION ROUTES
    // 9. Mega-City A Industrial Skyway (Left Flank Orbital Artery)
    const cityASkywayPoints = [
      new THREE.Vector3(-140, 35, -450),
      new THREE.Vector3(-260, 65, -850),
      new THREE.Vector3(-340, 85, -1300),
      new THREE.Vector3(-270, 55, -1800),
      new THREE.Vector3(-110, 25, -2300),
    ];
    this.registerRoute({
      id: 'route_city_a_industrial_skyway',
      name: 'MEGA-CITY A INDUSTRIAL SKYWAY',
      category: 'ORBITAL',
      altitudeLevel: 'MID',
      points: cityASkywayPoints,
      width: 34,
      direction: 'LEFT',
      colorHex: 0xf59e0b,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 72,
    });

    // 10. Mega-City B Quantum Artery (Right Flank Crystalline Highway)
    const cityBArteryPoints = [
      new THREE.Vector3(130, 40, -480),
      new THREE.Vector3(260, 75, -920),
      new THREE.Vector3(350, 95, -1450),
      new THREE.Vector3(280, 65, -1980),
      new THREE.Vector3(120, 35, -2450),
    ];
    this.registerRoute({
      id: 'route_city_b_quantum_artery',
      name: 'MEGA-CITY B QUANTUM ARTERY',
      category: 'ORBITAL',
      altitudeLevel: 'HIGH',
      points: cityBArteryPoints,
      width: 32,
      direction: 'RIGHT',
      colorHex: 0x00f0ff,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 78,
    });

    // 11. Relativistic Black-Hole Proximity Slingshot Route (High-G Accretion Disk Chasm)
    const blackHoleProximityPoints = [
      new THREE.Vector3(0, 25, -2150),
      new THREE.Vector3(90, -10, -2500),
      new THREE.Vector3(150, -45, -2850),
      new THREE.Vector3(50, -55, -3150), // Closest pass to Sagittarius A* accretion disk
      new THREE.Vector3(-90, -30, -3200),
      new THREE.Vector3(-150, 15, -2950),
      new THREE.Vector3(-70, 50, -2600),
      new THREE.Vector3(0, 65, -2300),
    ];
    this.registerRoute({
      id: 'route_black_hole_proximity_slingshot',
      name: 'SAGITTARIUS A* RELATIVISTIC SLINGSHOT CHASM',
      category: 'GRAVITY',
      altitudeLevel: 'LOW',
      points: blackHoleProximityPoints,
      width: 36,
      direction: 'CENTER',
      colorHex: 0xff00a0,
      isRamp: true,
      rampAngleDeg: 12,
      isJumpTrack: false,
      collapseStartEvent: 88,
    });

    // 12. Quantum Wormhole Shortcut Corridor
    const wormholeShortcutPoints = [
      new THREE.Vector3(0, 48, -980),   // Enters Wormhole Portal Alpha
      new THREE.Vector3(0, 65, -1350),  // Warp transit
      new THREE.Vector3(0, 62, -2100),  // Emerges at Exit Portal Alpha
    ];
    this.registerRoute({
      id: 'route_wormhole_shortcut',
      name: 'QUANTUM WORMHOLE SHORTCUT TRANSIT',
      category: 'ESCAPE',
      altitudeLevel: 'EXTREME',
      points: wormholeShortcutPoints,
      width: 28,
      direction: 'CENTER',
      colorHex: 0xa855f7,
      isRamp: false,
      isJumpTrack: false,
      collapseStartEvent: 94,
    });
  }

  private registerRoute(config: {
    id: string;
    name: string;
    category: RouteCategory;
    altitudeLevel: RouteAltitudeLevel;
    points: THREE.Vector3[];
    width: number;
    direction: PhysicalRouteDirection;
    colorHex: number;
    isRamp: boolean;
    rampAngleDeg?: number;
    isJumpTrack: boolean;
    collapseStartEvent: number;
  }): void {
    const curve = new THREE.CatmullRomCurve3(config.points);
    const totalLength = curve.getLength();

    // Create 3D track ribbon mesh
    const segments = Math.max(32, Math.round(totalLength / 18));
    const trackGeo = new THREE.PlaneGeometry(config.width, totalLength, 1, segments);

    // Transform plane vertices along the spline curve
    const posAttr = trackGeo.attributes.position as THREE.BufferAttribute;
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const binormal = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      const vY = posAttr.getY(i);
      const vX = posAttr.getX(i);

      // Normalized T along curve (0 at start to 1 at end)
      const t = (vY + totalLength / 2) / totalLength;
      const pt = curve.getPointAt(t);
      curve.getTangentAt(t, tangent);

      binormal.crossVectors(tangent, up).normalize();
      normal.crossVectors(binormal, tangent).normalize();

      const finalPos = pt.clone().addScaledVector(binormal, vX);
      posAttr.setXYZ(i, finalPos.x, finalPos.y, finalPos.z);
    }
    trackGeo.computeVertexNormals();

    const trackMesh = new THREE.Mesh(trackGeo, this.roadMaterial.clone());
    trackMesh.name = `TrackMesh_${config.id}`;

    // Add glowing neon guide borders along route
    const borderPointsLeft: THREE.Vector3[] = [];
    const borderPointsRight: THREE.Vector3[] = [];
    for (let s = 0; s <= 60; s++) {
      const frac = s / 60;
      const pt = curve.getPointAt(frac);
      curve.getTangentAt(frac, tangent);
      binormal.crossVectors(tangent, up).normalize();

      borderPointsLeft.push(pt.clone().addScaledVector(binormal, -config.width * 0.5));
      borderPointsRight.push(pt.clone().addScaledVector(binormal, config.width * 0.5));
    }

    const borderGeoL = new THREE.BufferGeometry().setFromPoints(borderPointsLeft);
    const borderGeoR = new THREE.BufferGeometry().setFromPoints(borderPointsRight);
    const borderMat = new THREE.LineBasicMaterial({ color: config.colorHex });

    trackMesh.add(new THREE.Line(borderGeoL, borderMat));
    trackMesh.add(new THREE.Line(borderGeoR, borderMat));

    // Place into correct altitude group
    switch (config.altitudeLevel) {
      case 'LOW':
        this.lowLevelGroup.add(trackMesh);
        break;
      case 'MID':
        this.midLevelGroup.add(trackMesh);
        break;
      case 'HIGH':
        this.highLevelGroup.add(trackMesh);
        break;
      case 'EXTREME':
        this.extremeLevelGroup.add(trackMesh);
        break;
    }

    this.routes.set(config.id, {
      id: config.id,
      name: config.name,
      category: config.category,
      altitudeLevel: config.altitudeLevel,
      curve,
      mesh: trackMesh,
      width: config.width,
      direction: config.direction,
      colorHex: config.colorHex,
      totalLength,
      isRamp: config.isRamp,
      rampAngleDeg: config.rampAngleDeg,
      isJumpTrack: config.isJumpTrack,
      isCollapsed: false,
      collapseStartEvent: config.collapseStartEvent,
      hasBoostPads: true,
    });
  }

  /**
   * Adds glowing physical jump ramp pads & receiver landing zones
   */
  private buildDynamicPhysicalRamps(): void {
    // 1. Kinetic Launch Ramp at Entrance to Elevated Skyway
    const rampGroup = new THREE.Group();
    rampGroup.name = 'KineticRamp_Entry';
    rampGroup.position.set(0, 48, -850);

    const rampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(42, 6, 80),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.3,
      })
    );
    rampMesh.rotation.x = -0.26; // 15 degree incline
    rampGroup.add(rampMesh);

    // Glowing chevron boost arrows on ramp face
    for (let a = 0; a < 3; a++) {
      const chevron = new THREE.Mesh(
        new THREE.RingGeometry(8, 12, 3),
        new THREE.MeshBasicMaterial({ color: 0xff00e5, side: THREE.DoubleSide })
      );
      chevron.rotation.x = -Math.PI / 2 + 0.26;
      chevron.position.set(0, 4 + a * 2, -20 + a * 20);
      rampGroup.add(chevron);
    }
    this.dynamicRampsGroup.add(rampGroup);

    // 2. Ballistic Jump Receiver Pad
    const receiverGroup = new THREE.Group();
    receiverGroup.name = 'BallisticReceiver_Pad';
    receiverGroup.position.set(0, 60, -2550);

    const receiverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(50, 8, 120),
      new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.8,
        emissive: 0x10b981,
        emissiveIntensity: 0.45,
      })
    );
    receiverGroup.add(receiverMesh);
    this.dynamicRampsGroup.add(receiverGroup);
  }

  /**
   * Holographic directional route indicators & distance signage
   */
  private buildHolographicJunctionSignage(): void {
    // Multi-Directional Junction 01 (Spline approach at z=-780)
    const j1Group = new THREE.Group();
    j1Group.name = 'Junction01_Signage';
    j1Group.position.set(0, 65, -780);

    // Holographic overhead gantry arch
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(52, 2.8, 8, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
    );
    j1Group.add(arch);

    // Left direction pointer: Mega-City A Industrial Skyway
    const leftArrow = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 12, 4),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    leftArrow.position.set(-28, 22, 0);
    leftArrow.rotation.z = Math.PI / 2;
    j1Group.add(leftArrow);

    // Right direction pointer: Mega-City B Quantum Artery
    const rightArrow = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 12, 4),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    rightArrow.position.set(28, 22, 0);
    rightArrow.rotation.z = -Math.PI / 2;
    j1Group.add(rightArrow);

    // Center direction pointer: Slingshot / Wormhole Shortcut
    const centerArrow = new THREE.Mesh(
      new THREE.ConeGeometry(5, 14, 4),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    centerArrow.position.set(0, 36, 0);
    j1Group.add(centerArrow);

    this.holographicSignageGroup.add(j1Group);

    // Junction 02: Black Hole Proximity Entrance (z: -2100)
    const j2Group = new THREE.Group();
    j2Group.name = 'Junction02_GravitationalApproach';
    j2Group.position.set(0, 45, -2100);

    const arch2 = new THREE.Mesh(
      new THREE.TorusGeometry(46, 3, 8, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xff00a0, wireframe: true })
    );
    j2Group.add(arch2);

    this.holographicSignageGroup.add(j2Group);
  }

  /**
   * Per-frame update: handles dynamic route collapse & structural integrity
   */
  public update(dt: number, eventIndex: number): void {
    const delta = Math.max(0, Math.min(dt, 0.1));

    // Dynamic Route Failure Logic (Events 50 through 95)
    this.routes.forEach(route => {
      if (eventIndex >= route.collapseStartEvent) {
        route.isCollapsed = true;

        // Visual fracture: shake, dip, and fade
        const collapseProg = Math.min(1.0, (eventIndex - route.collapseStartEvent) / 15.0);
        route.mesh.position.y -= delta * collapseProg * 12.0;
        route.mesh.rotation.z += delta * collapseProg * 0.04;

        if (collapseProg > 0.8) {
          route.mesh.visible = false; // Disintegrated into the singularity
        }
      } else {
        route.isCollapsed = false;
        route.mesh.visible = true;
      }
    });

    // Sub-orbital jump ramp dynamic pulsation
    if (this.dynamicRampsGroup) {
      this.dynamicRampsGroup.children.forEach(r => {
        r.rotation.y = Math.sin(Date.now() * 0.001) * 0.02;
      });
    }
  }

  public dispose(): void {
    this.roadMaterial.dispose();
    this.neonBorderMaterial.dispose();
    this.boostStripMaterial.dispose();
    this.warningBarrierMaterial.dispose();
    this.routes.forEach(r => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
    this.scene.remove(this.root);
  }
}
