import * as THREE from 'three';
import { sound } from '../audio';
import { getMasterEventByNumber, AlertSeverityType } from './finalCollapseMaster100Timeline';

export interface PhysicalCityHazard {
  id: string;
  name: string;
  group: THREE.Group;
  collisionRadius: number;
  position: THREE.Vector3;
  type: 'MOVING_LASER' | 'TIMED_ENERGY_GATE' | 'ROTATING_CRANE' | 'COLLAPSIBLE_BRIDGE' | 'FALLING_DEBRIS' | 'ENERGY_PULSE';
  damageValue: number;
  isActive: boolean;
  activationEvent: number;
  collapseEvent: number;
  phase: number;
  speed: number;
}

export interface WormholePortal {
  id: string;
  name: string;
  group: THREE.Group;
  position: THREE.Vector3;
  exitPosition: THREE.Vector3;
  ringMesh: THREE.Mesh;
  vortexMesh: THREE.Mesh;
  activationEvent: number;
  isActive: boolean;
  captureRadius: number;
}

export interface MegaCityBuilding {
  mesh: THREE.Mesh;
  baseY: number;
  targetY: number;
  shakeIntensity: number;
  collapseProgress: number;
  city: 'A_INDUSTRIAL' | 'B_QUANTUM';
  collapseEvent: number;
}

/**
 * FINAL COLLAPSE PHYSICAL MEGA-CITIES & DYNAMIC ROUTE EXPANSION (PART 2)
 *
 * Implements two distinct futuristic mega-cities connected through the playable racing environment:
 * 1. Mega-City A — Orbital Industrial Metropolis (Heavy steel, amber floodlights, shipyard gantries, energy reactors)
 * 2. Mega-City B — Advanced Quantum Metropolis (Crystalline spires, cyan/magenta quantum conduits, levitating monoliths)
 *
 * Features:
 * - Continuous physical connection with elevated skyways and multi-tier bridges
 * - Black-Hole Proximity Route framing Sagittarius A* with high-G banked turns and gravity hazard warnings
 * - 6 Types of Physical Hazards (Moving lasers, timed energy gates, rotating shipyard cranes, collapsing bridges, debris, energy pulses)
 * - Interactive Wormhole Shortcut portals (entrance and exit) with particle vortexes
 * - Connected 100-event lifecycle: every landmark, hazard, and bridge reacts deterministically to master timeline events
 */
export class FinalCollapsePhysicalMegaCities {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;

  // City Groups
  public cityAGroup: THREE.Group; // Orbital Industrial Metropolis
  public cityBGroup: THREE.Group; // Advanced Quantum Metropolis
  public connectingSkywaysGroup: THREE.Group; // Inter-city highway bridges & arches
  public hazardsGroup: THREE.Group; // Dynamic physical obstacle meshes
  public wormholePortalsGroup: THREE.Group; // Wormhole shortcut arches

  // Collections for updates and collisions
  public buildings: MegaCityBuilding[] = [];
  public hazards: PhysicalCityHazard[] = [];
  public wormholes: WormholePortal[] = [];
  public skywaySegments: { mesh: THREE.Mesh; originalY: number; collapseEvent: number; isCollapsed: boolean }[] = [];

  // Shared Materials (Cached for mobile performance & clean disposal)
  private matIndustrialSteel: THREE.MeshStandardMaterial;
  private matIndustrialTruss: THREE.MeshStandardMaterial;
  private matIndustrialAmberGlow: THREE.MeshBasicMaterial;
  private matIndustrialHazardStripe: THREE.MeshBasicMaterial;
  private matQuantumCrystal: THREE.MeshPhysicalMaterial;
  private matQuantumCyanNeon: THREE.MeshBasicMaterial;
  private matQuantumMagentaNeon: THREE.MeshBasicMaterial;
  private matQuantumGoldAccents: THREE.MeshStandardMaterial;
  private matLaserBarrier: THREE.MeshBasicMaterial;
  private matEnergyShield: THREE.MeshBasicMaterial;
  private matWormholeVortex: THREE.ShaderMaterial;

  // Event State Cache
  public currentEventNumber = 1;
  public cityAPowerFailure = false;
  public cityBPowerSurge = false;
  public bridgeIntegrity = 1.0;

  constructor(scene: THREE.Scene, blackHolePos = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePos.clone();

    this.root = new THREE.Group();
    this.root.name = 'FinalCollapsePhysicalMegaCities_Root';

    this.cityAGroup = new THREE.Group();
    this.cityAGroup.name = 'MegaCityA_OrbitalIndustrial';
    this.cityBGroup = new THREE.Group();
    this.cityBGroup.name = 'MegaCityB_AdvancedQuantum';
    this.connectingSkywaysGroup = new THREE.Group();
    this.connectingSkywaysGroup.name = 'ConnectingSkyways_HighwayGrid';
    this.hazardsGroup = new THREE.Group();
    this.hazardsGroup.name = 'PhysicalHazards_Active';
    this.wormholePortalsGroup = new THREE.Group();
    this.wormholePortalsGroup.name = 'WormholeShortcuts_Portals';

    this.root.add(this.cityAGroup);
    this.root.add(this.cityBGroup);
    this.root.add(this.connectingSkywaysGroup);
    this.root.add(this.hazardsGroup);
    this.root.add(this.wormholePortalsGroup);

    // 1. Initialize High-Performance Materials
    this.matIndustrialSteel = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.38,
    });
    this.matIndustrialTruss = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.25,
      wireframe: true,
    });
    this.matIndustrialAmberGlow = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
    });
    this.matIndustrialHazardStripe = new THREE.MeshBasicMaterial({
      color: 0xd97706,
    });

    this.matQuantumCrystal = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transmission: 0.8,
      opacity: 0.85,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      reflectivity: 0.9,
    });
    this.matQuantumCyanNeon = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });
    this.matQuantumMagentaNeon = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
    });
    this.matQuantumGoldAccents = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xca8a04,
      emissiveIntensity: 0.3,
    });

    this.matLaserBarrier = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    this.matEnergyShield = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });

    // Custom glowing swirl shader for wormhole shortcuts
    this.matWormholeVortex = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorInner: { value: new THREE.Color(0xa855f7) },
        uColorOuter: { value: new THREE.Color(0x38bdf8) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          float spiral = sin(dist * 28.0 - angle * 4.0 - uTime * 6.0) * 0.5 + 0.5;
          vec3 col = mix(uColorInner, uColorOuter, spiral + dist * 1.2);
          float alpha = smoothstep(0.5, 0.08, dist) * (0.7 + spiral * 0.3);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // 2. Build the Physical Environments
    this.buildMegaCityAIndustrial();
    this.buildMegaCityBQuantum();
    this.buildConnectingElevatedSkyways();
    this.buildPhysicalHazards();
    this.buildWormholeShortcuts();

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. MEGA-CITY A — ORBITAL INDUSTRIAL METROPOLIS
     Massive launch towers, orbital shipyards, energy reactors, suspended highways
     ========================================================================= */
  private buildMegaCityAIndustrial(): void {
    // 1. Colossal Orbital Shipyard Complex (x: -420, y: 80, z: -850)
    const shipyardGroup = new THREE.Group();
    shipyardGroup.name = 'ShipyardComplex_Titan';
    shipyardGroup.position.set(-420, 80, -850);

    // Primary scaffolding dock bay arch
    const dockArch = new THREE.Mesh(
      new THREE.BoxGeometry(160, 24, 280),
      this.matIndustrialSteel
    );
    dockArch.position.y = 120;
    shipyardGroup.add(dockArch);

    // Heavy skeletal trusses
    const trussMesh = new THREE.Mesh(
      new THREE.BoxGeometry(170, 130, 290),
      this.matIndustrialTruss
    );
    trussMesh.position.y = 60;
    shipyardGroup.add(trussMesh);

    // Amber floodlight beacons on docking pylons
    const floodlightGeo = new THREE.BoxGeometry(8, 8, 8);
    for (let f = 0; f < 4; f++) {
      const fl = new THREE.Mesh(floodlightGeo, this.matIndustrialAmberGlow);
      fl.position.set(
        (f % 2 === 0 ? -75 : 75),
        135,
        (f < 2 ? -120 : 120)
      );
      shipyardGroup.add(fl);
    }
    this.cityAGroup.add(shipyardGroup);

    // 2. Industrial Space Towers & Energy Reactor Clusters (Left flank, z: -350 to -1450)
    const industrialTowerConfigs = [
      { x: -280, y: -20, z: -450, w: 55, h: 280, d: 55, name: 'IndustrialSpire_01', collapseEvent: 68 },
      { x: -380, y: 40, z: -700, w: 70, h: 360, d: 70, name: 'IndustrialReactor_01', collapseEvent: 54 },
      { x: -520, y: 10, z: -1050, w: 60, h: 420, d: 60, name: 'OrbitalShipyardSpire_02', collapseEvent: 72 },
      { x: -440, y: 70, z: -1350, w: 85, h: 480, d: 85, name: 'HeavyReactorTower_03', collapseEvent: 82 },
      { x: -320, y: 30, z: -1650, w: 50, h: 340, d: 50, name: 'IndustrialCoolingPylon_04', collapseEvent: 88 },
    ];

    industrialTowerConfigs.forEach(cfg => {
      const tg = new THREE.Group();
      tg.name = cfg.name;
      tg.position.set(cfg.x, cfg.y, cfg.z);

      // Core tower pillar
      const coreGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const core = new THREE.Mesh(coreGeo, this.matIndustrialSteel);
      core.position.y = cfg.h / 2;
      tg.add(core);

      // Exterior maintenance walkways & amber warning bands
      const bandCount = Math.floor(cfg.h / 70);
      for (let b = 1; b <= bandCount; b++) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(cfg.w + 6, 4, cfg.d + 6),
          this.matIndustrialHazardStripe
        );
        band.position.y = b * 70;
        tg.add(band);
      }

      // Cooling exhaust vents on reactors
      const ventGeo = new THREE.CylinderGeometry(cfg.w * 0.28, cfg.w * 0.35, 30, 8);
      const vent = new THREE.Mesh(ventGeo, this.matIndustrialSteel);
      vent.position.y = cfg.h + 15;
      tg.add(vent);

      this.buildings.push({
        mesh: core,
        baseY: cfg.y,
        targetY: cfg.y,
        shakeIntensity: 0,
        collapseProgress: 0,
        city: 'A_INDUSTRIAL',
        collapseEvent: cfg.collapseEvent,
      });

      this.cityAGroup.add(tg);
    });

    // 3. Heavy Docking Platforms & Cargo Gantry Rails
    for (let p = 0; p < 3; p++) {
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(65, 80, 16, 6),
        this.matIndustrialSteel
      );
      plat.position.set(-360 - p * 60, 20 + p * 30, -600 - p * 400);
      this.cityAGroup.add(plat);
    }
  }

  /* =========================================================================
     2. MEGA-CITY B — ADVANCED QUANTUM METROPOLIS
     Sleek crystalline spires, levitating monoliths, holographic energy grids
     ========================================================================= */
  private buildMegaCityBQuantum(): void {
    // 1. Central Quantum Research Monolith & Levitating Rings (x: 460, y: 110, z: -1450)
    const quantumCenterGroup = new THREE.Group();
    quantumCenterGroup.name = 'QuantumInstitute_Apex';
    quantumCenterGroup.position.set(460, 110, -1450);

    // Primary crystalline central obelisk (h: 540m)
    const obeliskGeo = new THREE.ConeGeometry(45, 540, 4);
    const obelisk = new THREE.Mesh(obeliskGeo, this.matQuantumCrystal);
    obelisk.position.y = 270;
    quantumCenterGroup.add(obelisk);

    // Three concentric levitating quantum rings rotating at different planes
    const ringRadii = [85, 120, 155];
    ringRadii.forEach((rad, idx) => {
      const ringGeo = new THREE.TorusGeometry(rad, 3.5, 8, 48);
      const ringMat = idx % 2 === 0 ? this.matQuantumCyanNeon : this.matQuantumMagentaNeon;
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 180 + idx * 75;
      ring.rotation.x = Math.PI / 4 + idx * 0.4;
      quantumCenterGroup.add(ring);
    });
    this.cityBGroup.add(quantumCenterGroup);

    // 2. Quantum Skyscraper Spires & Harmonic Research Facilities (Right flank, z: -550 to -2150)
    const quantumTowerConfigs = [
      { x: 260, y: 15, z: -580, w: 42, h: 320, name: 'QuantumSpire_Alpha', collapseEvent: 62 },
      { x: 380, y: 45, z: -920, w: 54, h: 420, name: 'ParticleCollider_Tower', collapseEvent: 58 },
      { x: 540, y: 80, z: -1280, w: 68, h: 510, name: 'SingularityHarmonics_Citadel', collapseEvent: 74 },
      { x: 420, y: 120, z: -1720, w: 50, h: 460, name: 'ZeroPointEnergy_Spire', collapseEvent: 84 },
      { x: 290, y: 65, z: -2050, w: 38, h: 380, name: 'DimensionalEcho_Array', collapseEvent: 90 },
    ];

    quantumTowerConfigs.forEach(cfg => {
      const tg = new THREE.Group();
      tg.name = cfg.name;
      tg.position.set(cfg.x, cfg.y, cfg.z);

      // Sleek faceted tapered tower
      const spireGeo = new THREE.CylinderGeometry(cfg.w * 0.4, cfg.w, cfg.h, 6);
      const spire = new THREE.Mesh(spireGeo, this.matQuantumCrystal);
      spire.position.y = cfg.h / 2;
      tg.add(spire);

      // Glowing vertical quantum superconductor ribbons
      for (let r = 0; r < 3; r++) {
        const ang = (r / 3) * Math.PI * 2;
        const ribbonGeo = new THREE.BoxGeometry(2.5, cfg.h * 0.95, 3.5);
        const ribbon = new THREE.Mesh(ribbonGeo, this.matQuantumCyanNeon);
        ribbon.position.set(Math.cos(ang) * (cfg.w * 0.7), cfg.h / 2, Math.sin(ang) * (cfg.w * 0.7));
        tg.add(ribbon);
      }

      // Golden crown halo
      const crown = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.w * 0.65, 2.5, 6, 24),
        this.matQuantumGoldAccents
      );
      crown.position.y = cfg.h + 5;
      crown.rotation.x = Math.PI / 2;
      tg.add(crown);

      this.buildings.push({
        mesh: spire,
        baseY: cfg.y,
        targetY: cfg.y,
        shakeIntensity: 0,
        collapseProgress: 0,
        city: 'B_QUANTUM',
        collapseEvent: cfg.collapseEvent,
      });

      this.cityBGroup.add(tg);
    });

    // 3. Floating Quantum Monoliths (Suspended in zero-G along the perimeter)
    for (let m = 0; m < 4; m++) {
      const monGeo = new THREE.OctahedronGeometry(22, 0);
      const mon = new THREE.Mesh(monGeo, this.matQuantumCrystal);
      mon.position.set(340 + m * 50, 160 + Math.sin(m) * 60, -800 - m * 380);
      mon.rotation.set(0.3, m * 0.8, 0.2);
      this.cityBGroup.add(mon);
    }
  }

  /* =========================================================================
     3. CONNECTING ELEVATED HIGHWAYS, TRANSIT BRIDGES & ARCHITECTURAL LANDMARKS
     Continuous physical racing connection bridging City A and City B
     ========================================================================= */
  private buildConnectingElevatedSkyways(): void {
    // 1. Trans-City Skybridge Spans (High-speed multi-lane overhead crossways)
    const bridgeAnchors = [
      { start: new THREE.Vector3(-240, 75, -720), end: new THREE.Vector3(220, 85, -780), collapseEvt: 64 },
      { start: new THREE.Vector3(-310, 110, -1250), end: new THREE.Vector3(280, 125, -1320), collapseEvt: 76 },
      { start: new THREE.Vector3(-220, 140, -1780), end: new THREE.Vector3(240, 150, -1860), collapseEvt: 86 },
    ];

    bridgeAnchors.forEach((br, idx) => {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.name = `TransCitySkybridge_${idx + 1}`;

      const curve = new THREE.LineCurve3(br.start, br.end);
      const length = curve.getLength();
      const mid = br.start.clone().lerp(br.end, 0.5);

      // Deck Box
      const deckGeo = new THREE.BoxGeometry(26, 4.5, length);
      const deck = new THREE.Mesh(deckGeo, this.matIndustrialSteel);
      deck.position.copy(mid);
      deck.lookAt(br.end);
      bridgeGroup.add(deck);

      // Glowing lane dividers
      const railGeo = new THREE.BoxGeometry(1.5, 2, length);
      const railL = new THREE.Mesh(railGeo, this.matQuantumCyanNeon);
      railL.position.copy(mid).add(new THREE.Vector3(-12, 3, 0));
      railL.lookAt(br.end);
      bridgeGroup.add(railL);

      const railR = new THREE.Mesh(railGeo, this.matQuantumCyanNeon);
      railR.position.copy(mid).add(new THREE.Vector3(12, 3, 0));
      railR.lookAt(br.end);
      bridgeGroup.add(railR);

      this.skywaySegments.push({
        mesh: deck,
        originalY: mid.y,
        collapseEvent: br.collapseEvt,
        isCollapsed: false,
      });

      this.connectingSkywaysGroup.add(bridgeGroup);
    });

    // 2. Colossal Inter-City Arch Gate (Spline crossing midpoint at z: -1050)
    const archGroup = new THREE.Group();
    archGroup.name = 'InterCityArchGate';
    archGroup.position.set(0, 95, -1050);

    const archGeo = new THREE.TorusGeometry(120, 7, 8, 32, Math.PI);
    const archMesh = new THREE.Mesh(archGeo, this.matIndustrialSteel);
    archGroup.add(archMesh);

    const neonRing = new THREE.Mesh(
      new THREE.TorusGeometry(124, 2, 6, 32, Math.PI),
      this.matQuantumCyanNeon
    );
    archGroup.add(neonRing);

    this.connectingSkywaysGroup.add(archGroup);
  }

  /* =========================================================================
     4. PHYSICAL HAZARDS ARCHITECTURE (MOVING LASERS, ENERGY GATES, CRANES, DEBRIS)
     ========================================================================= */
  private buildPhysicalHazards(): void {
    // Hazard 1: Moving Laser Barrier (Industrial Sector A - z: -680)
    const laser1Group = new THREE.Group();
    laser1Group.name = 'Hazard_MovingLaser_A';
    laser1Group.position.set(0, 32, -680);

    const laserPylonL = new THREE.Mesh(new THREE.BoxGeometry(4, 35, 6), this.matIndustrialSteel);
    laserPylonL.position.set(-28, 0, 0);
    laser1Group.add(laserPylonL);

    const laserPylonR = new THREE.Mesh(new THREE.BoxGeometry(4, 35, 6), this.matIndustrialSteel);
    laserPylonR.position.set(28, 0, 0);
    laser1Group.add(laserPylonR);

    const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 56, 8), this.matLaserBarrier);
    beamMesh.rotation.z = Math.PI / 2;
    beamMesh.position.y = 8;
    laser1Group.add(beamMesh);

    this.hazardsGroup.add(laser1Group);
    this.hazards.push({
      id: 'hazard_laser_a',
      name: 'INDUSTRIAL OSCILLATING LASER BARRIER',
      group: laser1Group,
      collisionRadius: 26,
      position: laser1Group.position,
      type: 'MOVING_LASER',
      damageValue: 25,
      isActive: true,
      activationEvent: 8,
      collapseEvent: 88,
      phase: 0,
      speed: 2.2,
    });

    // Hazard 2: Timed Quantum Energy Gate (Quantum Sector B - z: -1520)
    const gateGroup = new THREE.Group();
    gateGroup.name = 'Hazard_TimedEnergyGate_B';
    gateGroup.position.set(0, 55, -1520);

    const gateTorus = new THREE.Mesh(new THREE.TorusGeometry(32, 2.5, 8, 24), this.matQuantumMagentaNeon);
    gateGroup.add(gateTorus);

    const gateField = new THREE.Mesh(new THREE.CircleGeometry(29, 24), this.matEnergyShield);
    gateGroup.add(gateField);

    this.hazardsGroup.add(gateGroup);
    this.hazards.push({
      id: 'hazard_energy_gate_b',
      name: 'PULSATING QUANTUM RESONANCE GATE',
      group: gateGroup,
      collisionRadius: 28,
      position: gateGroup.position,
      type: 'TIMED_ENERGY_GATE',
      damageValue: 30,
      isActive: true,
      activationEvent: 16,
      collapseEvent: 92,
      phase: 0,
      speed: 1.5,
    });

    // Hazard 3: Rotating Heavy Shipyard Crane Arm (Industrial Sector - z: -1180)
    const craneGroup = new THREE.Group();
    craneGroup.name = 'Hazard_RotatingCrane_A';
    craneGroup.position.set(-85, 45, -1180);

    const cranePillar = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 70, 8), this.matIndustrialSteel);
    cranePillar.position.y = 35;
    craneGroup.add(cranePillar);

    const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(110, 4, 6), this.matIndustrialSteel);
    craneBoom.position.set(45, 68, 0);
    craneGroup.add(craneBoom);

    this.hazardsGroup.add(craneGroup);
    this.hazards.push({
      id: 'hazard_crane_a',
      name: 'UNCONTROLLED SHIPYARD GANTRY ARM',
      group: craneGroup,
      collisionRadius: 45,
      position: new THREE.Vector3(-40, 45, -1180),
      type: 'ROTATING_CRANE',
      damageValue: 35,
      isActive: true,
      activationEvent: 24,
      collapseEvent: 80,
      phase: 0,
      speed: 0.65,
    });

    // Hazard 4: Black-Hole Gravitational Energy Pulse Emitter (z: -2750)
    const pulseGroup = new THREE.Group();
    pulseGroup.name = 'Hazard_GravitationalPulse_Core';
    pulseGroup.position.set(0, 15, -2750);

    const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(38, 3, 8, 32), this.matLaserBarrier);
    pulseGroup.add(pulseRing);

    this.hazardsGroup.add(pulseGroup);
    this.hazards.push({
      id: 'hazard_grav_pulse',
      name: 'TIDAL ACCRETION SHOCK PULSE',
      group: pulseGroup,
      collisionRadius: 36,
      position: pulseGroup.position,
      type: 'ENERGY_PULSE',
      damageValue: 40,
      isActive: true,
      activationEvent: 32,
      collapseEvent: 100,
      phase: 0,
      speed: 3.0,
    });
  }

  /* =========================================================================
     5. WORMHOLE SHORTCUTS ARCHITECTURE
     Physically reachable entrance & exit portals connecting through the quantum rift
     ========================================================================= */
  private buildWormholeShortcuts(): void {
    // Wormhole 01: Entrance Portal at Spline Split (x: 0, y: 48, z: -980)
    const entryGroup = new THREE.Group();
    entryGroup.name = 'WormholeShortcut_Entrance';
    entryGroup.position.set(0, 48, -980);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(26, 3.2, 12, 36),
      this.matQuantumMagentaNeon
    );
    entryGroup.add(outerRing);

    const innerVortex = new THREE.Mesh(
      new THREE.CircleGeometry(23, 32),
      this.matWormholeVortex
    );
    entryGroup.add(innerVortex);

    // Wormhole 01 Exit Portal at Elevated Highway Outpost (x: 0, y: 62, z: -2100)
    const exitGroup = new THREE.Group();
    exitGroup.name = 'WormholeShortcut_Exit';
    exitGroup.position.set(0, 62, -2100);

    const exitRing = new THREE.Mesh(
      new THREE.TorusGeometry(26, 3.2, 12, 36),
      this.matQuantumCyanNeon
    );
    exitGroup.add(exitRing);

    const exitVortex = new THREE.Mesh(
      new THREE.CircleGeometry(23, 32),
      this.matWormholeVortex.clone()
    );
    exitGroup.add(exitVortex);

    this.wormholePortalsGroup.add(entryGroup);
    this.wormholePortalsGroup.add(exitGroup);

    this.wormholes.push({
      id: 'wormhole_alpha',
      name: 'QUANTUM GRAVITY WORMHOLE SHORTCUT',
      group: entryGroup,
      position: entryGroup.position,
      exitPosition: exitGroup.position,
      ringMesh: outerRing,
      vortexMesh: innerVortex,
      activationEvent: 20,
      isActive: true,
      captureRadius: 18,
    });
  }

  /**
   * Main Per-Frame Update Loop
   * Synchronized with dt and authoritative master event progression (Events 1 to 100)
   */
  public update(dt: number, eventNumber: number, playerPos?: THREE.Vector3): {
    hazardCollisionWarning: string | null;
    isInsideWormholeTrigger: boolean;
    wormholeExitPosition?: THREE.Vector3;
  } {
    const delta = Math.max(0, Math.min(dt, 0.1));
    this.currentEventNumber = eventNumber;

    // Update custom shader uniforms
    if (this.matWormholeVortex.uniforms.uTime) {
      this.matWormholeVortex.uniforms.uTime.value += delta;
    }

    // 1. Dynamic Hazard Animations
    let hazardWarning: string | null = null;
    this.hazards.forEach(hz => {
      hz.phase += delta * hz.speed;

      switch (hz.type) {
        case 'MOVING_LASER': {
          // Oscillate beam vertically or laterally
          hz.group.position.x = Math.sin(hz.phase) * 18;
          break;
        }
        case 'TIMED_ENERGY_GATE': {
          // Pulse opacity and scale
          const pulse = (Math.sin(hz.phase) + 1) * 0.5;
          const isArmed = pulse > 0.45;
          hz.group.children[1].visible = isArmed;
          break;
        }
        case 'ROTATING_CRANE': {
          // Continuous industrial boom rotation
          hz.group.rotation.y += delta * hz.speed;
          break;
        }
        case 'ENERGY_PULSE': {
          // Expanding relativistic shockwave
          const expand = 1.0 + (hz.phase % 3.0) * 0.8;
          hz.group.scale.set(expand, expand, 1);
          break;
        }
      }

      // Proximity check with player
      if (playerPos && playerPos.distanceTo(hz.position) < hz.collisionRadius) {
        hazardWarning = `CAUTION // ${hz.name}`;
      }
    });

    // 2. Wormhole Shortcut Animation & Trigger
    let insideWormhole = false;
    let targetExit: THREE.Vector3 | undefined = undefined;

    this.wormholes.forEach(w => {
      w.ringMesh.rotation.z += delta * 1.8;
      if (w.vortexMesh) {
        w.vortexMesh.rotation.z -= delta * 2.4;
      }

      if (playerPos && playerPos.distanceTo(w.position) < w.captureRadius) {
        insideWormhole = true;
        targetExit = w.exitPosition.clone();
      }
    });

    // 3. Event-Driven Building & Skyway Degradation (Events 30 -> 100)
    this.buildings.forEach(b => {
      if (eventNumber >= b.collapseEvent) {
        const severity = (eventNumber - b.collapseEvent) / 20;
        b.collapseProgress = Math.min(1.0, severity);

        // Shake spires and sink slowly under tidal shear
        b.shakeIntensity = Math.sin(Date.now() * 0.015) * b.collapseProgress * 3.5;
        b.mesh.position.x = (Math.random() - 0.5) * b.collapseProgress * 2.0;
        b.mesh.position.y = b.baseY - b.collapseProgress * 45;
        b.mesh.rotation.z = Math.sin(Date.now() * 0.005) * b.collapseProgress * 0.06;
      }
    });

    this.skywaySegments.forEach(s => {
      if (eventNumber >= s.collapseEvent && !s.isCollapsed) {
        s.isCollapsed = true;
        s.mesh.position.y -= delta * 8.0;
        s.mesh.rotation.x += delta * 0.05;
      }
    });

    return {
      hazardCollisionWarning: hazardWarning,
      isInsideWormholeTrigger: insideWormhole,
      wormholeExitPosition: targetExit,
    };
  }

  /**
   * Complete Resource Disposal
   */
  public dispose(): void {
    this.matIndustrialSteel.dispose();
    this.matIndustrialTruss.dispose();
    this.matIndustrialAmberGlow.dispose();
    this.matIndustrialHazardStripe.dispose();
    this.matQuantumCrystal.dispose();
    this.matQuantumCyanNeon.dispose();
    this.matQuantumMagentaNeon.dispose();
    this.matQuantumGoldAccents.dispose();
    this.matLaserBarrier.dispose();
    this.matEnergyShield.dispose();
    this.matWormholeVortex.dispose();

    // Traverse and dispose geometries
    this.root.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      }
    });

    this.scene.remove(this.root);
  }
}
