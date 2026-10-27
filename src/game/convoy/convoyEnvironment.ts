/**
 * VOID-RIDER 3D — CONVOY ENVIRONMENT & ROUTE GENERATOR
 * 
 * Constructs a cinematic extended deep-space corridor:
 * - 3D CatmullRomCurve3 route spanning from the Departure Gantry to the Extraction Gate
 * - Departure Outpost: Industrial mining gantry with docking clamps and cargo crane arms
 * - Intermediate Orbital Megastructures: Space bridges, orbital fuel pylons, comm relays
 * - High-density Asteroid Field: 24 breakable physical asteroids in Event 2
 * - Checkpoint Gates: Luminous energy rings marking event transit points
 * - Extraction Gate: Massive circular quantum warp gate with pulsing event horizon
 * - High-contrast lighting with celestial starfield and gas giant backdrop
 */
import * as THREE from 'three';
import { HazardDebris, RepairPickup } from './convoyTypes';
import { CAMPAIGN_REGIONS } from './convoyCampaignRegions';
import { convoyChamberGates } from './convoyChamberGates';
import { convoyAdaptiveRoute } from './convoyAdaptiveRoute';

export class ConvoyEnvironment {
  public group: THREE.Group;
  public routeCurve: THREE.CatmullRomCurve3;
  /** Physical spline length in world units; gameplay telemetry maps it to a 200,000 km open-world campaign. */
  public totalRouteLength: number = 38800;
  public readonly routeLengthKm: number = 200000;
  public routeHazards: Array<{ id: string; kind: string; mesh: THREE.Group; position: THREE.Vector3; radius: number; damage: number; phase: number; active: boolean }> = [];
  
  // Interactive entities
  public asteroids: HazardDebris[] = [];
  public repairPickups: RepairPickup[] = [];
  public checkpointMeshes: THREE.Mesh[] = [];
  public barrierHazards: Array<{ mesh: THREE.Mesh; position: THREE.Vector3; radius: number; phase: number }> = [];
  private barrierClock = 0;
  private parkingGates: THREE.Group[] = [];
  private parkingLocks: THREE.Group[] = [];
  private sensorRings: THREE.Mesh[] = [];
  private emergencyExitGate: THREE.Group | null = null;
  private entranceBlastGate: THREE.Group | null = null;
  private entranceGateLeaves: THREE.Mesh[] = [];
  private entranceGateRing: THREE.Mesh | null = null;
  private entranceGateOpen: boolean = false;
  private playerClampArms: THREE.Group[] = [];
  private playerPadMesh: THREE.Mesh | null = null;
  private playerHoloBeacon: THREE.Mesh | null = null;
  private playerLocked: boolean = false;
  
  // Animated meshes
  private rotatingParts: THREE.Object3D[] = [];
  private extractionGateRing: THREE.Mesh | null = null;
  private extractionHorizon: THREE.Mesh | null = null;
  
  // Lighting
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private convoyTealLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'convoy_environment_group';
    
    // Connect authoritative 75,000 km 50-location adaptive spline
    this.routeCurve = convoyAdaptiveRoute.activeSpline;
    this.totalRouteLength = this.routeCurve.getLength();
  }

  public build(scene: THREE.Scene) {
    this.cleanUp();

    // 1. Cinematic Lighting tailored for convoy escort readability
    this.buildLighting();

    // 2. Departure Station (Start outpost)
    this.buildDepartureStation();

    // 3. Extraction Citadel & Guardian Space Terminal Complex (Destination)
    this.buildExtractionGate();
    this.buildGuardianSpaceTerminal();

    // Mount physical sensor-controlled chamber gates (5 gates, collision colliders, interlocks)
    this.group.add(convoyChamberGates.group);

    // 4. Intermediate Space Structures (Bridges, Pylons, Relays)
    this.buildSpaceStructures();

    // 5. Continuous luminous route, physical region gates, and checkpoints.
    this.buildFixedRouteGuide();
    this.buildCampaignRegionGates();
    this.buildCheckpointRings();

    // 6. Physical Asteroid Debris Corridor (Event 2)
    this.buildDebrisField();

    // 7. Nanite Field Repair Pickups
    this.buildRepairPickups();

    // 8. Timed energy barriers, connected branch lanes, and broken orbital ring
    this.buildEnergyBarrierCorridor();
    this.buildVariedRouteHazards();
    this.buildRouteBranches();
    this.buildBrokenOrbitalRing();

    // 9. Cosmic Backdrop (Starfield & Distant Planet)
    this.buildCosmicBackdrop();

    scene.add(this.group);
  }

  /**
   * Sample position along the 3D convoy route at normalized progress t (0.0 to 1.0)
   * Connects to structure-aware adaptive route manager.
   */
  public getRoutePoint(t: number): THREE.Vector3 {
    return convoyAdaptiveRoute.getPoint(t);
  }

  /**
   * Sample forward tangent along the route at progress t
   */
  public getRouteTangent(t: number): THREE.Vector3 {
    return convoyAdaptiveRoute.getTangent(t);
  }

  /**
   * GUARDIAN SPACE TERMINAL — COMPLETE ARCHITECTURAL REBUILD (Region 25 Destination)
   * 
   * Architecture Spec:
   * - Broad Octagonal Outer Shell (circumscribed radius ~520m, 8 corner observation towers)
   * - Geodesic Upper Canopy with 16 structural ribs and segmented panels
   * - Zone A: Upper Arrival Ring & Airlock Chamber (Z = -8800 to -9050, Gates 1 & 2)
   * - Zone B: Circular Central Parking Atrium (radius 420m, Y = -158, Bay 01 & Convoy Bays 02-09)
   * - Zone C: Lower Basement Maintenance Hangar (radius 400m, Y = -260, flight ramps, Gate 3, Gate 4)
   * - Emergency Escape Corridor & Gate 5 leading to secondary blast exit at Z = -9850
   */
  private buildGuardianSpaceTerminal() {
    const terminal = new THREE.Group();
    terminal.name = 'guardian_space_terminal_complex';
    terminal.position.set(0, 0, -38350);

    // -------------------------------------------------------------------------
    // 1. ZONE 1: OCTAGONAL OUTER SHELL & OBSERVATION TOWERS
    // -------------------------------------------------------------------------
    const octRadius = 520;
    const octHeight = 340;
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.22,
      emissive: 0x071520,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    });

    // 8-sided perimeter wall
    const octGeo = new THREE.CylinderGeometry(octRadius, octRadius * 1.05, octHeight, 8, 1, true);
    const octShell = new THREE.Mesh(octGeo, octMat);
    octShell.position.set(0, -60, 0);
    terminal.add(octShell);

    // 8 Corner Perimeter Towers with high-intensity warning beacons
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * octRadius;
      const z = Math.sin(angle) * octRadius;

      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(14, 20, octHeight + 60, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.28 })
      );
      tower.position.set(x, -30, z);
      terminal.add(tower);

      // Tower Head & Warning Beacon
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(22, 16, 18, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.15, emissive: 0x0284c7, emissiveIntensity: 0.8 })
      );
      head.position.set(x, octHeight / 2 + 10, z);
      terminal.add(head);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(6, 12, 12),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0x22d3ee })
      );
      beacon.position.set(x, octHeight / 2 + 22, z);
      terminal.add(beacon);
    }

    // Heavy Exterior Trusses & Perimeter Rings
    [-120, 20, 110].forEach((yPos, rIdx) => {
      const perimeterRing = new THREE.Mesh(
        new THREE.CylinderGeometry(octRadius + 8, octRadius + 8, 12, 8, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.85,
          roughness: 0.2,
          emissive: 0x0284c7,
          emissiveIntensity: rIdx === 1 ? 1.4 : 0.8,
        })
      );
      perimeterRing.position.set(0, yPos, 0);
      terminal.add(perimeterRing);
    });

    // Transparent Geodesic Upper Canopy
    const domeShell = new THREE.Mesh(
      new THREE.SphereGeometry(octRadius - 20, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: 0x0c2538,
        metalness: 0.5,
        roughness: 0.15,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    domeShell.position.set(0, 40, 0);
    terminal.add(domeShell);

    // 16 Curved Geodesic Structural Ribs
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.9,
    });
    for (let i = 0; i < 16; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(octRadius - 25, 4.2, 8, 64), ribMat);
      rib.rotation.set(Math.PI / 2, (Math.PI * i) / 16, 0);
      rib.position.set(0, 40, 0);
      terminal.add(rib);
    }

    // -------------------------------------------------------------------------
    // 2. ZONE A: UPPER ARRIVAL RING & AIRLOCK CHAMBER
    // -------------------------------------------------------------------------
    // Arrival approach tube extending towards Region 24
    const arrivalTube = new THREE.Mesh(
      new THREE.CylinderGeometry(145, 155, 320, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.3,
        side: THREE.DoubleSide,
      })
    );
    arrivalTube.rotation.x = Math.PI / 2;
    arrivalTube.position.set(0, 30, 420); // Local: extends Z = 260 to 580 (World: -8990 to -8670)
    terminal.add(arrivalTube);

    // Neon navigation strips inside arrival tube
    [-1, 1].forEach((side) => {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 310),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      strip.position.set(side * 125, 30, 420);
      terminal.add(strip);
    });

    // -------------------------------------------------------------------------
    // 3. ZONE B: MAIN CENTRAL PARKING ATRIUM (Level 1: Y = -158)
    // -------------------------------------------------------------------------
    const atriumRadius = 420;
    const atriumDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(atriumRadius, atriumRadius + 15, 24, 64),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.88,
        roughness: 0.28,
        emissive: 0x061e2e,
        emissiveIntensity: 0.5,
      })
    );
    atriumDeck.position.set(0, -170, 0);
    terminal.add(atriumDeck);

    // Atrium Radial Taxiway Markings
    const taxiwayMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const taxiLine = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 280), taxiwayMat);
      taxiLine.position.set(Math.cos(angle) * 160, -157, Math.sin(angle) * 160);
      taxiLine.rotation.y = -angle + Math.PI / 2;
      terminal.add(taxiLine);
    }

    // Central Citadel Navigation Spire & ATC Hub
    const hub = new THREE.Group();
    hub.position.set(0, -45, 0);

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(35, 65, 260, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.92, roughness: 0.2, emissive: 0x0369a1, emissiveIntensity: 0.7 })
    );
    hub.add(spire);

    const spireCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(85, 55, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 1.2 })
    );
    spireCrown.position.set(0, 115, 0);
    hub.add(spireCrown);

    // Rotating Holographic Radar Antenna
    const antenna = new THREE.Mesh(
      new THREE.TorusGeometry(75, 3, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
    );
    antenna.rotation.x = Math.PI / 2;
    antenna.position.set(0, 138, 0);
    hub.add(antenna);
    this.rotatingParts.push(antenna);

    // Large Terminal Signboard
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(160, 28, 4),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 })
    );
    sign.position.set(0, 35, 55);
    hub.add(sign);
    terminal.add(hub);

    // -------------------------------------------------------------------------
    // 4. DESIGNATED PLAYER COMMAND BAY 01 (Atrium Center Pad: 0, -158, 0 local)
    // -------------------------------------------------------------------------
    const playerBay = new THREE.Group();
    playerBay.name = 'player_command_parking_bay_01';
    playerBay.position.set(0, -158, 0);

    const playerPadMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const playerPad = new THREE.Mesh(new THREE.CylinderGeometry(38, 44, 6, 48), playerPadMat);
    playerBay.add(playerPad);
    this.playerPadMesh = playerPad;

    const playerRing = new THREE.Mesh(
      new THREE.TorusGeometry(40, 2.8, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    playerRing.rotation.x = Math.PI / 2;
    playerRing.position.y = 4;
    playerBay.add(playerRing);

    // Rotating Chevron Beacon
    const holoGeo = new THREE.TorusGeometry(45, 1.5, 8, 32);
    const holoMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, wireframe: true, transparent: true, opacity: 0.7 });
    const holo = new THREE.Mesh(holoGeo, holoMat);
    holo.rotation.x = Math.PI / 2;
    holo.position.y = 9;
    playerBay.add(holo);
    this.playerHoloBeacon = holo;
    this.rotatingParts.push(holo);

    // Dual Motorized Hydraulic Clamp Arms for Player Bay
    this.playerClampArms = [];
    [-1, 1].forEach((side) => {
      const clampGroup = new THREE.Group();
      clampGroup.position.set(side * 46, 6, 0);

      const clampBase = new THREE.Mesh(
        new THREE.BoxGeometry(14, 18, 26),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
      );
      clampGroup.add(clampBase);

      const clampJaw = new THREE.Mesh(
        new THREE.BoxGeometry(18, 9, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15, emissive: 0x082f49, emissiveIntensity: 0.8 })
      );
      clampJaw.position.set(side * -10, 9, 0);
      clampGroup.add(clampJaw);

      this.playerClampArms.push(clampGroup);
      playerBay.add(clampGroup);
    });

    terminal.add(playerBay);

    // -------------------------------------------------------------------------
    // 5. CONVOY ESCORT & TRANSPORT BAYS 02 TO 09 (Concentric Radial Layout)
    // -------------------------------------------------------------------------
    this.parkingGates = [];
    this.parkingLocks = [];
    this.sensorRings = [];

    for (let i = 0; i < 8; i++) {
      const bayIndex = i + 2;
      const angle = (i / 8) * Math.PI * 1.5 + Math.PI * 0.25;
      const bayRadius = 230;
      const bX = Math.cos(angle) * bayRadius;
      const bZ = Math.sin(angle) * bayRadius;

      const bay = new THREE.Group();
      bay.position.set(bX, -158, bZ);

      const padMat = new THREE.MeshStandardMaterial({
        color: 0x1b3444,
        metalness: 0.8,
        roughness: 0.25,
        emissive: 0x0369a1,
        emissiveIntensity: 0.6,
      });
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(28, 32, 5, 32), padMat);
      bay.add(pad);

      const padRing = new THREE.Mesh(
        new THREE.TorusGeometry(28, 2.0, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      padRing.rotation.x = Math.PI / 2;
      padRing.position.y = 3;
      bay.add(padRing);

      const gate = new THREE.Group();
      gate.position.set(0, 24, 28);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
      [-1, 1].forEach((side) => {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(6, 40, 8), gateMat);
        leaf.position.x = side * 22;
        gate.add(leaf);
      });
      bay.add(gate);
      this.parkingGates.push(gate);

      const sensor = new THREE.Mesh(
        new THREE.TorusGeometry(30, 2.0, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
      );
      sensor.position.set(0, 26, 28);
      bay.add(sensor);
      this.sensorRings.push(sensor);

      const locks = new THREE.Group();
      [-1, 1].forEach((side) => {
        const clamp = new THREE.Mesh(
          new THREE.BoxGeometry(8, 8, 14),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        clamp.position.set(side * 22, 6, -4);
        locks.add(clamp);
      });
      bay.add(locks);
      this.parkingLocks.push(locks);

      terminal.add(bay);
    }

    // -------------------------------------------------------------------------
    // 6. ZONE C: LOWER BASEMENT MAINTENANCE HANGAR (Level 2: Y = -260)
    // -------------------------------------------------------------------------
    const basementDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(400, 410, 22, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.35,
        emissive: 0x040d14,
        emissiveIntensity: 0.45,
      })
    );
    basementDeck.position.set(0, -260, 0);
    terminal.add(basementDeck);

    // Twin descent ramps connecting Atrium (Y = -158) to Basement (Y = -260)
    [-180, 180].forEach((rampX) => {
      const rampGeo = new THREE.BoxGeometry(50, 8, 190);
      const rampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const ramp = new THREE.Mesh(rampGeo, rampMat);
      ramp.position.set(rampX, -209, 0);
      ramp.rotation.x = 0.52;
      terminal.add(ramp);

      // Neon guide stripe along ramp
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 185),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      stripe.position.set(rampX, -204, 0);
      stripe.rotation.x = 0.52;
      terminal.add(stripe);

      // Illuminated neon chevron markers pointing down the ramp into the basement maintenance hangar
      for (let c = -4; c <= 4; c++) {
        const chevMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const chev = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 3), chevMat);
        chev.rotation.x = 0.52 + Math.PI / 2;
        chev.position.set(rampX, -204 - c * 8 * Math.sin(0.52), c * 18);
        terminal.add(chev);
      }
    });

    // Heavy basement structural pillars & hazard striping
    const structureMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35,
      emissive: 0x071722,
      emissiveIntensity: 0.35,
    });
    [-280, -140, 140, 280].forEach((x) => {
      [-120, 120].forEach((z) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(28, 110, 28), structureMat);
        pillar.position.set(x, -210, z);
        terminal.add(pillar);

        const hazard = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 30), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        hazard.position.set(x, -195, z);
        terminal.add(hazard);
      });
    });

    // Auxiliary Basement Bays 10 to 18
    [-180, -90, 0, 90, 180].forEach((x) => {
      const auxPad = new THREE.Mesh(
        new THREE.CylinderGeometry(20, 24, 4, 24),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
      );
      auxPad.position.set(x, -252, -140);
      terminal.add(auxPad);

      const auxRing = new THREE.Mesh(
        new THREE.TorusGeometry(20, 1.4, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      auxRing.rotation.x = Math.PI / 2;
      auxRing.position.set(x, -249, -140);
      terminal.add(auxRing);
    });

    // -------------------------------------------------------------------------
    // 7. EMERGENCY ESCAPE CORRIDOR & SECONDARY EXIT TUBE
    // -------------------------------------------------------------------------
    const escapeTube = new THREE.Mesh(
      new THREE.CylinderGeometry(110, 110, 260, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.3,
        side: THREE.DoubleSide,
      })
    );
    escapeTube.rotation.x = Math.PI / 2;
    escapeTube.position.set(0, -200, -480); // Extends towards Z = -9850 world
    terminal.add(escapeTube);

    // Emergency amber beacon strip
    const escStripe = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 250),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    escStripe.position.set(0, -245, -480);
    terminal.add(escStripe);

    terminal.traverse((obj) => { if ((obj as THREE.Mesh).isMesh) obj.frustumCulled = false; });
    this.group.add(terminal);
  }

  public openEntranceGate(open: boolean) {
    this.entranceGateOpen = open;
    if (open) {
      convoyChamberGates.openGateManual('GATE_1_OUTER_ENTRANCE');
    } else {
      convoyChamberGates.closeGateManual('GATE_1_OUTER_ENTRANCE');
    }
  }

  public isEntranceGateOpen(): boolean {
    return convoyChamberGates.getGateTelemetry('GATE_1_OUTER_ENTRANCE')?.state === 'OPEN' || this.entranceGateOpen;
  }

  public setPlayerLockEngaged(locked: boolean) {
    this.playerLocked = locked;
    this.playerClampArms.forEach((clamp, i) => {
      clamp.position.x = (i === 0 ? -1 : 1) * (locked ? 28 : 46);
      clamp.rotation.z = (i === 0 ? 1 : -1) * (locked ? 0.28 : 0);
    });
    if (this.playerPadMesh) {
      (this.playerPadMesh.material as THREE.MeshBasicMaterial).color.set(locked ? 0x10b981 : 0xf59e0b);
    }
    if (this.playerHoloBeacon) {
      (this.playerHoloBeacon.material as THREE.MeshBasicMaterial).color.set(locked ? 0x34d399 : 0xfde68a);
    }
  }

  public isPlayerLockEngaged(): boolean {
    return this.playerLocked;
  }

  public setOriginClampsEngaged(locked: boolean) {
    this.playerLocked = locked;
    this.playerClampArms.forEach((clamp, i) => {
      clamp.position.x = (i === 0 ? -1 : 1) * (locked ? 28 : 46);
      clamp.rotation.z = (i === 0 ? 1 : -1) * (locked ? 0.28 : 0);
    });
  }

  public isOriginClampsEngaged(): boolean {
    return this.playerLocked;
  }

  public hasGuardianTerminal(): boolean {
    return this.group.getObjectByName('guardian_space_terminal_complex') !== null;
  }

  public hasOriginDome(): boolean {
    return this.group.getObjectByName('origin_departure_dome_complex') !== null;
  }

  public getPlayerParkingTarget(): THREE.Vector3 {
    return new THREE.Vector3(0, -158, -38350);
  }

  public getOriginParkingTarget(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 0);
  }

  public getCrownParkingTarget(): THREE.Vector3 {
    return new THREE.Vector3(0, -158, -38350);
  }

  public getConvoyBayTarget(index: number, dome: 'ORIGIN' | 'CROWN' = 'CROWN'): THREE.Vector3 {
    if (dome === 'ORIGIN') {
      const angle = (index / 8) * Math.PI * 2;
      const radius = 110;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    }
    const angle = (index / 8) * Math.PI * 1.5 + Math.PI * 0.25;
    const radius = 230;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      -158,
      -38350 + Math.sin(angle) * radius
    );
  }

  public isPositionInsideDome(pos: THREE.Vector3): boolean {
    const insideCrown = pos.z <= -37750 && pos.z >= -38950 && Math.abs(pos.x) <= 600 && pos.y >= -320 && pos.y <= 300;
    const insideOrigin = Math.abs(pos.z) <= 350 && Math.abs(pos.x) <= 450 && Math.abs(pos.y) <= 200;
    const legacy = pos.z <= -8800 && pos.z >= -9850;
    return insideCrown || insideOrigin || legacy;
  }

  public setEmergencyExitOpen(open: boolean) {
    if (open) {
      convoyChamberGates.openGateManual('GATE_5_EMERGENCY_ESCAPE');
    } else {
      convoyChamberGates.closeGateManual('GATE_5_EMERGENCY_ESCAPE');
    }
  }

  public getEmergencyExitPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, -200, -38850);
  }

  /** World-space parking target, one slot per surviving convoy vessel (up to 9 ships). */
  public getParkingPosition(index: number): THREE.Vector3 {
    return this.getConvoyBayTarget(index, 'CROWN');
  }

  /** Sensor-driven bay gate animation. */
  public setParkingBayState(index: number, gateOpen: boolean, locked: boolean) {
    const gate = this.parkingGates[index];
    if (gate) {
      gate.children.forEach((leaf, i) => {
        const side = i === 0 ? -1 : 1;
        leaf.position.x = side * (gateOpen ? 70 : 44);
      });
    }
    const sensor = this.sensorRings[index];
    if (sensor) (sensor.material as THREE.MeshBasicMaterial).color.set(locked ? 0x22c55e : gateOpen ? 0xfbbf24 : 0x38bdf8);
    const locks = this.parkingLocks[index];
    if (locks) locks.children.forEach((clamp, i) => { clamp.position.x = (i === 0 ? -1 : 1) * (locked ? 25 : 36); });
  }

  private buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0x0f2027, 1.8);
    this.group.add(this.ambientLight);

    const hemi = new THREE.HemisphereLight(0x14b8a6, 0x050c14, 1.4);
    this.group.add(hemi);

    // Primary Solar Key Light
    this.keyLight = new THREE.DirectionalLight(0xf0fdfa, 2.2);
    this.keyLight.position.set(600, 1200, 400);
    this.group.add(this.keyLight);

    // Cool Teal / Cyan Escort Theme Fill Light
    this.fillLight = new THREE.DirectionalLight(0x0d9488, 1.6);
    this.fillLight.position.set(-600, -400, -1200);
    this.group.add(this.fillLight);

    // Threat Vector Backlight (Crimson highlight for incoming hostiles)
    this.convoyTealLight = new THREE.DirectionalLight(0xf43f5e, 0.9);
    this.convoyTealLight.position.set(0, 300, -4000);
    this.group.add(this.convoyTealLight);
  }

  private buildOriginDepartureDome() {
    const originDome = new THREE.Group();
    originDome.name = 'origin_departure_dome_complex';
    originDome.position.set(0, 0, 0);

    const octRadius = 420;
    const octHeight = 180;
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x061e30,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    });

    const octGeo = new THREE.CylinderGeometry(octRadius, octRadius * 1.05, octHeight, 8, 1, true);
    const octShell = new THREE.Mesh(octGeo, octMat);
    octShell.position.set(0, 0, 0);
    originDome.add(octShell);

    // 8 Corner towers
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * octRadius;
      const z = Math.sin(angle) * octRadius;
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(12, 16, octHeight + 40, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 })
      );
      tower.position.set(x, 20, z);
      originDome.add(tower);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(6, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      beacon.position.set(x, octHeight / 2 + 30, z);
      originDome.add(beacon);
    }

    // Central Bay 01 Launch Platform (Player)
    const padGeo = new THREE.CylinderGeometry(40, 44, 6, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0f766e,
      emissiveIntensity: 0.8,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, -5, 0);
    originDome.add(pad);

    // Neon launch guide runway extending to Gate threshold (Z = -280)
    const runway = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 280),
      new THREE.MeshBasicMaterial({ color: 0x14b8a6 })
    );
    runway.position.set(0, -3, -140);
    originDome.add(runway);

    // Auxiliary Launch Bays 02-09 for Convoy
    for (let b = 1; b <= 8; b++) {
      const bAngle = (b / 8) * Math.PI * 2;
      const bx = Math.cos(bAngle) * 120;
      const bz = Math.sin(bAngle) * 120;
      const auxPad = new THREE.Mesh(
        new THREE.CylinderGeometry(20, 24, 4, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
      );
      auxPad.position.set(bx, -5, bz);
      originDome.add(auxPad);
    }

    originDome.traverse((obj) => { if ((obj as THREE.Mesh).isMesh) obj.frustumCulled = false; });
    this.group.add(originDome);
  }

  private buildDepartureStation() {
    this.buildOriginDepartureDome();
    const stationGroup = new THREE.Group();
    stationGroup.position.set(0, 0, 150);

    // Heavy Industrial Outpost Hub
    const hubGeo = new THREE.CylinderGeometry(80, 95, 70, 16);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.3,
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.z = Math.PI / 2;
    stationGroup.add(hub);

    // Gantry Departure Clamps
    for (let i = -1; i <= 1; i += 2) {
      const clampGeo = new THREE.BoxGeometry(20, 240, 30);
      const clampMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        metalness: 0.9,
        roughness: 0.2,
      });
      const clamp = new THREE.Mesh(clampGeo, clampMat);
      clamp.position.set(i * 120, 0, 0);
      stationGroup.add(clamp);
    }

    // Departure Beacon
    const beaconGeo = new THREE.SphereGeometry(14, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 140, 0);
    stationGroup.add(beacon);

    this.group.add(stationGroup);
  }

  private buildExtractionGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -37800);

    // Giant Quantum Warp Torus Gate (Diameter 400m)
    const ringGeo = new THREE.TorusGeometry(180, 18, 20, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x0d9488,
      emissiveIntensity: 0.8,
    });
    this.extractionGateRing = new THREE.Mesh(ringGeo, ringMat);
    gateGroup.add(this.extractionGateRing);

    // Glowing Event Horizon Disk
    const horizonGeo = new THREE.CircleGeometry(170, 48);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    this.extractionHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    gateGroup.add(this.extractionHorizon);

    // 4 Pylon Generators on the Gate
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const pylonGeo = new THREE.CylinderGeometry(10, 16, 80, 8);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(Math.cos(angle) * 210, Math.sin(angle) * 210, 0);
      pylon.rotation.z = angle + Math.PI / 2;
      gateGroup.add(pylon);
    }

    this.rotatingParts.push(this.extractionGateRing);
    this.group.add(gateGroup);
  }

  private buildSpaceStructures() {
    // Strategic distinct sector megastructures along the 50,000 km flight corridor

    // 1. SECTOR A: TITAN SHIPYARD (t = 0.06, ~3,000 km)
    {
      const pt = this.getRoutePoint(0.06);
      const tangent = this.getRouteTangent(0.06);
      const shipyard = new THREE.Group();
      shipyard.position.copy(pt).add(new THREE.Vector3(140, 25, 0));
      shipyard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Orbital drydock scaffolding
      const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const drydockFrame = new THREE.Mesh(new THREE.BoxGeometry(110, 140, 220), new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true }));
      shipyard.add(drydockFrame);

      // Crane arm with suspended cargo pod
      const craneArm = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 160), gantryMat);
      craneArm.position.set(-30, 80, 0);
      shipyard.add(craneArm);

      const cargoPod = new THREE.Mesh(new THREE.BoxGeometry(32, 28, 55), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 }));
      cargoPod.position.set(-30, 45, 20);
      shipyard.add(cargoPod);

      // Amber industrial work beacons
      [-50, 50].forEach((x) => {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        beacon.position.set(x, 70, 60);
        shipyard.add(beacon);
      });

      this.group.add(shipyard);
    }

    // 2. SECTOR B: BROKEN MEGABRIDGE (t = 0.18, ~9,000 km)
    {
      const pt = this.getRoutePoint(0.18);
      const tangent = this.getRouteTangent(0.18);
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.copy(pt).add(new THREE.Vector3(-120, -35, 0));
      bridgeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      // Roadway segments
      [-60, 60].forEach((z, idx) => {
        const span = new THREE.Mesh(new THREE.BoxGeometry(65, 8, 90), bridgeMat);
        span.position.set(0, 0, z + (idx === 1 ? 15 : 0));
        if (idx === 1) span.rotation.x = 0.12; // broken tilt
        bridgeGroup.add(span);
      });

      // Twin suspension support pylons & cables
      [-36, 36].forEach((x) => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 180, 16), bridgeMat);
        pylon.position.set(x, 80, 0);
        bridgeGroup.add(pylon);

        const cable = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 200, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        cable.position.set(x, 60, 0);
        cable.rotation.z = x > 0 ? -0.22 : 0.22;
        bridgeGroup.add(cable);
      });

      this.group.add(bridgeGroup);
    }

    // 3. SECTOR C: MAGNETIC TRANSIT CORRIDOR (t = 0.30, ~15,000 km)
    {
      const pt = this.getRoutePoint(0.30);
      const tangent = this.getRouteTangent(0.30);
      const magCorridor = new THREE.Group();
      magCorridor.position.copy(pt);
      magCorridor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Huge magnetic accelerator rings encircling the flight corridor
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2, emissive: 0x0369a1, emissiveIntensity: 1.2 });
      [-70, 0, 70].forEach((z) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(85, 5, 12, 48), ringMat);
        ring.position.set(0, 0, z);
        magCorridor.add(ring);
      });

      // Stabilizer towers with neon guide beams
      [-95, 95].forEach((x) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(14, 160, 18), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 }));
        tower.position.set(x, 0, 0);
        magCorridor.add(tower);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 180), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        rail.position.set(x * 0.85, 0, 0);
        magCorridor.add(rail);
      });

      this.group.add(magCorridor);
    }

    // 4. SECTOR D: ROTATING HABITAT CITY (t = 0.44, ~22,000 km)
    {
      const pt = this.getRoutePoint(0.44);
      const tangent = this.getRouteTangent(0.44);
      const habitat = new THREE.Group();
      habitat.position.copy(pt).add(new THREE.Vector3(260, 50, 0));
      habitat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Massive rotating habitat ring
      const habWheel = new THREE.Group();
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.75, roughness: 0.3 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(200, 18, 16, 64), ringMat);
      habWheel.add(ring);

      // City blocks & illuminated biodome windows inside the ring
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(16, 32, 22),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x0f766e : 0x1d4ed8, emissive: i % 2 === 0 ? 0x14b8a6 : 0x3b82f6, emissiveIntensity: 0.7 })
        );
        bldg.position.set(Math.cos(angle) * 188, Math.sin(angle) * 188, 0);
        bldg.rotation.z = angle + Math.PI / 2;
        habWheel.add(bldg);
      }

      // Central Axis Hub and spoke struts
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 45, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
      hub.rotation.x = Math.PI / 2;
      habWheel.add(hub);

      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 195, 12), ringMat);
        spoke.rotation.z = (s * Math.PI) / 4;
        habWheel.add(spoke);
      }

      habitat.add(habWheel);
      this.rotatingParts.push(habWheel);
      this.group.add(habitat);
    }

    // 5. SECTOR E: QUARANTINE FORTRESS (t = 0.58, ~29,000 km)
    {
      const pt = this.getRoutePoint(0.58);
      const tangent = this.getRouteTangent(0.58);
      const fortress = new THREE.Group();
      fortress.position.copy(pt).add(new THREE.Vector3(-180, 40, 0));
      fortress.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Armored citadel bulk
      const fortMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.92, roughness: 0.18, emissive: 0x7f1d1d, emissiveIntensity: 0.35 });
      const mainBastion = new THREE.Mesh(new THREE.BoxGeometry(110, 130, 240), fortMat);
      fortress.add(mainBastion);

      // Heavy scanner towers with searchlight indicator lamps
      [-45, 45].forEach((x) => {
        const scanTower = new THREE.Mesh(new THREE.CylinderGeometry(9, 14, 90, 16), fortMat);
        scanTower.position.set(x, 90, 40);
        fortress.add(scanTower);

        const scanHead = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        scanHead.position.set(x, 140, 40);
        fortress.add(scanHead);
      });

      this.group.add(fortress);
    }

    // 6. SECTOR F: GRAVEYARD OF GIANTS (t = 0.72, ~36,000 km)
    {
      const pt = this.getRoutePoint(0.72);
      const tangent = this.getRouteTangent(0.72);
      const derelict = new THREE.Group();
      derelict.position.copy(pt).add(new THREE.Vector3(220, -50, 0));
      derelict.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Massive hollow derelict carrier hull
      const derelictMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.45, emissive: 0x1e293b, emissiveIntensity: 0.2 });
      const carrierHull = new THREE.Mesh(new THREE.BoxGeometry(90, 65, 320), derelictMat);
      carrierHull.rotation.z = 0.35; // tilted listing hull
      derelict.add(carrierHull);

      // Exposed structural rib frames
      for (let r = 0; r < 5; r++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(55, 4.5, 8, 24), new THREE.MeshBasicMaterial({ color: 0x64748b, wireframe: true }));
        rib.position.set(0, 0, -120 + r * 60);
        derelict.add(rib);
      }

      // Massive cylindrical engine bells
      [-25, 25].forEach((x) => {
        const bell = new THREE.Mesh(new THREE.CylinderGeometry(28, 38, 70, 24, 1, true), derelictMat);
        bell.rotation.x = Math.PI / 2;
        bell.position.set(x, 0, 180);
        derelict.add(bell);
      });

      this.group.add(derelict);
    }

    // 7. SECTOR G: SOLAR RELAY GARDEN & REFINERY (t = 0.85, ~42,500 km)
    {
      const pt = this.getRoutePoint(0.85);
      const tangent = this.getRouteTangent(0.85);
      const solarGroup = new THREE.Group();
      solarGroup.position.copy(pt).add(new THREE.Vector3(-190, 75, 0));
      solarGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Giant hexagonal solar mirror collector
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.98, roughness: 0.05, emissive: 0xf59e0b, emissiveIntensity: 0.6 });
      for (let m = 0; m < 6; m++) {
        const mirrorAngle = (m / 6) * Math.PI * 2;
        const panel = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 4, 6), mirrorMat);
        panel.rotation.x = Math.PI / 2;
        panel.position.set(Math.cos(mirrorAngle) * 58, Math.sin(mirrorAngle) * 58, 0);
        solarGroup.add(panel);
      }

      // Central molten heat sink core
      const core = new THREE.Mesh(new THREE.SphereGeometry(26, 24, 24), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      solarGroup.add(core);

      // Coolant pipe framework
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 170, 16), pipeMat);
      pipe.position.set(0, -90, 0);
      solarGroup.add(pipe);

      this.rotatingParts.push(solarGroup);
      this.group.add(solarGroup);
    }

    // 8. SECTOR J: FINAL APPROACH GUIDANCE TOWERS (t = 0.96, ~48,000 km)
    {
      const pt = this.getRoutePoint(0.96);
      const tangent = this.getRouteTangent(0.96);
      const approachGroup = new THREE.Group();
      approachGroup.position.copy(pt);
      approachGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Dual lines of illuminated navigation guidance beacons leading into the Parking Dome
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      [-80, 80].forEach((x) => {
        for (let b = 0; b < 4; b++) {
          const z = -60 + b * 50;
          const pylon = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 45, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          pylon.position.set(x, 22, z);
          approachGroup.add(pylon);

          const light = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 12), beaconMat);
          light.position.set(x, 48, z);
          approachGroup.add(light);
        }
      });

      this.group.add(approachGroup);
    }
  }

  /** Continuous visible guide that marks the one safe, fixed convoy route from launch to the dome. */
  private buildFixedRouteGuide() {
    const guide = new THREE.Group();
    guide.name = 'convoy_fixed_route_guide';

    // Three nested tubes create a clearly visible route at a distance: a soft cyan halo,
    // a bright guide body, and a narrow white-cyan core. All three follow the same spline.
    const routeHalo = new THREE.Mesh(
      new THREE.TubeGeometry(this.routeCurve, 640, 10, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.20, depthWrite: false })
    );
    routeHalo.name = 'continuous_fixed_route_cyan_halo';
    guide.add(routeHalo);

    const routeTube = new THREE.Mesh(
      new THREE.TubeGeometry(this.routeCurve, 640, 4.2, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.95, depthWrite: false })
    );
    routeTube.name = 'continuous_fixed_route_cyan';
    guide.add(routeTube);

    const routeCore = new THREE.Mesh(
      new THREE.TubeGeometry(this.routeCurve, 640, 1.15, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.92, depthWrite: false })
    );
    routeCore.name = 'continuous_fixed_route_highlight_core';
    guide.add(routeCore);

    // Distance markers make the full 50,000 km mission legible in-world. Labels are
    // sprites rather than DOM overlays, so they stay anchored to the physical route.
    for (let km = 0; km <= this.routeLengthKm; km += 2500) {
      const t = km / this.routeLengthKm;
      const point = this.getRoutePoint(t);
      const tangent = this.getRouteTangent(t);
      const lateral = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
      const marker = new THREE.Mesh(
        new THREE.TorusGeometry(km === this.routeLengthKm ? 34 : 18, km === this.routeLengthKm ? 3.5 : 2, 8, 24),
        new THREE.MeshBasicMaterial({ color: km === this.routeLengthKm ? 0x34d399 : 0x67e8f9, transparent: true, opacity: 0.9, depthWrite: false })
      );
      marker.name = `route_distance_marker_${km}_km`;
      marker.position.copy(point).addScaledVector(lateral, 22).add(new THREE.Vector3(0, 12, 0));
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      guide.add(marker);

      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(2, 12, 27, 0.82)';
          ctx.strokeStyle = km === this.routeLengthKm ? '#34d399' : '#22d3ee';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(4, 4, 248, 88, 14);
          ctx.fill();
          ctx.stroke();
          ctx.font = 'bold 32px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ecfeff';
          ctx.fillText(km === 0 ? 'DEPARTURE' : km === this.routeLengthKm ? 'PARKING DOME · 50,000 KM' : `${km.toLocaleString()} KM`, 128, 48);
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, sizeAttenuation: true }));
          label.name = `route_distance_label_${km}_km`;
          label.position.copy(point).addScaledVector(lateral, 72).add(new THREE.Vector3(0, 38, 0));
          label.scale.set(km === this.routeLengthKm ? 110 : 72, km === this.routeLengthKm ? 42 : 27, 1);
          guide.add(label);
        }
      }
    }

    // Small directional chevrons are repeated along the entire spline so the route direction
    // remains readable through bends, the debris field, and the final docking approach.
    const arrowGeometry = new THREE.ConeGeometry(8, 22, 3);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.92, depthWrite: false });
    const sampleCount = Math.max(64, Math.min(180, Math.floor(this.routeLengthKm / 300)));
    for (let i = 1; i < sampleCount; i++) {
      const t = i / sampleCount;
      const point = this.getRoutePoint(t);
      const tangent = this.getRouteTangent(t);
      const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.name = `fixed_route_direction_${i}`;
      arrow.position.copy(point).addScaledVector(side, 18).add(new THREE.Vector3(0, 8, 0));
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      guide.add(arrow);
    }

    this.group.add(guide);
  }

  /**
   * Physical boundaries and landmarks for all 25 campaign regions.
   * These are attached to the route spline (not merely listed in the HUD), so
   * every 2,000 km region has a visible, traversable entrance landmark.
   */
  private buildCampaignRegionGates() {
    const regionsGroup = new THREE.Group();
    regionsGroup.name = 'convoy_100_physical_campaign_regions';
    const legacy50Alias = new THREE.Group();
    legacy50Alias.name = 'convoy_50_physical_campaign_regions';
    const legacy25Alias = new THREE.Group();
    legacy25Alias.name = 'convoy_25_physical_campaign_regions';
    regionsGroup.add(legacy50Alias);
    regionsGroup.add(legacy25Alias);

    CAMPAIGN_REGIONS.forEach((region, index) => {
      const t = region.startKm / this.routeLengthKm;
      const point = this.getRoutePoint(t);
      const tangent = this.getRouteTangent(t);
      const gate = new THREE.Group();
      gate.name = `campaign_region_${String(region.id).padStart(2, '0')}_${region.slug}`;
      gate.position.copy(point);
      gate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      const primary = new THREE.Color(region.palette.primaryHex);
      const accent = new THREE.Color(region.palette.accentHex);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(74, 4.5, 10, 48),
        new THREE.MeshStandardMaterial({ color: primary, emissive: primary, emissiveIntensity: 1.1, metalness: 0.35, roughness: 0.3 })
      );
      ring.name = `region_${region.id}_physical_transition_ring`;
      gate.add(ring);

      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(62, 1.5, 6, 48),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9, depthWrite: false })
      );
      innerRing.position.z = -3;
      gate.add(innerRing);

      // Paired pylons flank the route and make each boundary readable at speed.
      const pylonMaterial = new THREE.MeshStandardMaterial({
        color: region.palette.primaryHex,
        emissive: region.palette.emissiveHex,
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.28,
      });
      for (const side of [-1, 1]) {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 92, 10), pylonMaterial);
        pylon.position.set(side * 88, 0, 0);
        gate.add(pylon);
        const beacon = new THREE.Mesh(
          new THREE.OctahedronGeometry(9, 1),
          new THREE.MeshBasicMaterial({ color: region.palette.hazardHex })
        );
        beacon.position.set(side * 88, 52, 0);
        gate.add(beacon);
      }

      // A region-specific landmark silhouette sits off the main racing line.
      // Use deterministic shapes/materials to keep this performant on mobile.
      const landmarkMat = new THREE.MeshStandardMaterial({
        color: region.palette.accentHex,
        emissive: region.palette.emissiveHex,
        emissiveIntensity: 0.45,
        metalness: 0.48,
        roughness: 0.34,
      });
      const landmark = new THREE.Mesh(
        index % 3 === 0 ? new THREE.OctahedronGeometry(24, 1)
          : index % 3 === 1 ? new THREE.DodecahedronGeometry(22, 0)
          : new THREE.IcosahedronGeometry(23, 0),
        landmarkMat
      );
      landmark.name = `region_${region.id}_landmark_${region.environmentType}`;
      landmark.position.set(index % 2 === 0 ? -132 : 132, 45 + (index % 4) * 7, -18);
      gate.add(landmark);

      // The first and last region gates are deliberately open visual thresholds;
      // the terminal's separate docking sequence still owns mission completion.
      gate.userData.regionId = region.id;
      gate.userData.startKm = region.startKm;
      gate.userData.endKm = region.endKm;
      gate.userData.regionName = region.name;
      regionsGroup.add(gate);
    });

    this.group.add(regionsGroup);
  }

  private buildCheckpointRings() {
    // Sixteen numbered checkpoint gates distributed across the 50,000 km route.
    // They are visual route landmarks; gameplay checkpoint state remains owned by the director.
    const checkpointFractions = Array.from({ length: 16 }, (_, idx) => (idx + 1) / 16);

    checkpointFractions.forEach((frac, idx) => {
      const pos = this.getRoutePoint(frac);
      const tangent = this.getRouteTangent(frac);

      const ringGeo = new THREE.TorusGeometry(90, 4.5, 12, 36);
      const isFinal = idx === checkpointFractions.length - 1;
      const ringMat = new THREE.MeshBasicMaterial({
        color: isFinal ? 0x34d399 : 0x22d3ee,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      this.checkpointMeshes.push(ring);
      this.group.add(ring);
    });
  }

  private buildDebrisField() {
    // 24 Breakable physical asteroids placed along the Event 2 corridor (t ~ 0.18 to 0.32)
    this.asteroids = [];
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true,
    });

    for (let i = 0; i < 24; i++) {
      const t = 0.18 + (i / 24) * 0.14;
      const center = this.getRoutePoint(t);
      const tangent = this.getRouteTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Disperse asteroids across the flight corridor (-110m to +110m)
      const offsetDist = ((i % 5) - 2) * 45;
      const heightOffset = ((i % 3) - 1) * 35;
      const pos = center.clone()
        .addScaledVector(normal, offsetDist)
        .add(new THREE.Vector3(0, heightOffset, 0));

      const radius = 12 + (i % 4) * 6;
      const geo = new THREE.DodecahedronGeometry(radius, 1);
      const mesh = new THREE.Mesh(geo, asteroidMat);
      mesh.position.copy(pos);

      this.group.add(mesh);
      this.asteroids.push({
        id: `debris_ast_${i}`,
        position: pos,
        radius,
        health: 45,
        maxHealth: 45,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
        mesh,
      });
    }
  }

  private buildRepairPickups() {
    // Nanite Repair Canisters in Event 5 area (t ~ 0.65 to 0.75)
    this.repairPickups = [];

    const pickupFractions = [0.66, 0.70, 0.74];
    pickupFractions.forEach((frac, idx) => {
      const pos = this.getRoutePoint(frac).add(new THREE.Vector3((idx - 1) * 60, 20, 0));
      const pGroup = new THREE.Group();
      pGroup.position.copy(pos);

      // Glowing Green Nanite Container
      const coreGeo = new THREE.OctahedronGeometry(10);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      pGroup.add(core);

      // Outer Orbital Ring
      const ringGeo = new THREE.TorusGeometry(18, 1.8, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      pGroup.add(ring);

      this.rotatingParts.push(ring);
      this.group.add(pGroup);

      this.repairPickups.push({
        id: `repair_pickup_${idx}`,
        position: pos,
        healAmount: 180,
        collected: false,
        mesh: pGroup,
      });
    });
  }

  private buildEnergyBarrierCorridor() {
    this.barrierHazards = [];
    this.parkingGates = [];
    this.parkingLocks = [];
    this.sensorRings = [];
    this.emergencyExitGate = null;
    this.barrierClock = 0;
    [0.405, 0.445, 0.485].forEach((t, index) => {
      const position = this.getRoutePoint(t);
      const tangent = this.getRouteTangent(t);
      const geometry = new THREE.BoxGeometry(170, 5, 12);
      const material = new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.8 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      mesh.visible = false;
      this.group.add(mesh);
      this.barrierHazards.push({ mesh, position: position.clone(), radius: 72, phase: index * 1.35 });
      this.rotatingParts.push(mesh);
    });
  }


  /** A long-haul 50,000 km corridor with dense, distinct hazard families and readable warning silhouettes. */
  private buildVariedRouteHazards() {
    this.routeHazards = [];
    const definitions = [
      // Early route: 0–25,000 km (t ~ 0.05–0.48)
      { kind: 'ROTATING BLADES', t: 0.06, color: 0xfb7185, radius: 62, damage: 14 },
      { kind: 'GRAVITY MINE', t: 0.12, color: 0xa78bfa, radius: 58, damage: 18 },
      { kind: 'PLASMA LATTICE', t: 0.18, color: 0x22d3ee, radius: 68, damage: 16 },
      { kind: 'DEBRIS WALL', t: 0.24, color: 0xf59e0b, radius: 74, damage: 20 },
      { kind: 'PULSE TURRET', t: 0.30, color: 0xef4444, radius: 58, damage: 17 },
      { kind: 'ORBITAL SHARDS', t: 0.36, color: 0x10b981, radius: 64, damage: 15 },
      { kind: 'PHASE GATE', t: 0.42, color: 0xf472b6, radius: 70, damage: 18 },
      { kind: 'GRAVITY WELL', t: 0.48, color: 0x8b5cf6, radius: 80, damage: 19 },
      // Main combat corridor: 25,000–35,000 km (route progress 0.50–0.70)
      { kind: 'CROSSFIRE TURRET', t: 0.52, color: 0xef4444, radius: 62, damage: 20 },
      { kind: 'ROTATING MINEFIELD', t: 0.56, color: 0xa78bfa, radius: 66, damage: 22 },
      { kind: 'PLASMA CROSSBEAM', t: 0.60, color: 0x22d3ee, radius: 72, damage: 21 },
      { kind: 'ARMORED DEBRIS SWARM', t: 0.63, color: 0xf59e0b, radius: 76, damage: 23 },
      { kind: 'MISSILE TURRET', t: 0.66, color: 0xfb7185, radius: 62, damage: 24 },
      { kind: 'GRAVITY SNARE', t: 0.69, color: 0x8b5cf6, radius: 82, damage: 24 },
      // Late-route transition: 35,000–40,000 km (route progress 0.70–0.80)
      { kind: 'ENERGY MINE GRID', t: 0.72, color: 0x22d3ee, radius: 70, damage: 22 },
      { kind: 'COLLAPSING DEBRIS WALL', t: 0.76, color: 0xf59e0b, radius: 82, damage: 24 },
      // New final route section: 40,000–50,000 km (route progress 0.80–0.98)
      { kind: 'SWEEPING LASER GATE', t: 0.82, color: 0xf472b6, radius: 78, damage: 25 },
      { kind: 'HEAVY GUNSHIP NEST', t: 0.86, color: 0xef4444, radius: 70, damage: 25 },
      { kind: 'ORBITAL SHARDS', t: 0.90, color: 0x10b981, radius: 64, damage: 18 },
      { kind: 'PHASE GATE', t: 0.94, color: 0xf472b6, radius: 70, damage: 20 },
      { kind: 'SINGULARITY SURGE', t: 0.97, color: 0xf97316, radius: 84, damage: 24 },
    ];
    definitions.forEach((def, index) => {
      const center = this.getRoutePoint(def.t);
      const tangent = this.getRouteTangent(def.t);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const centerOffset = center.clone().addScaledVector(side, index % 2 ? 76 : -76);
      const group = new THREE.Group();
      group.name = `route_hazard_${def.kind.toLowerCase().replace(/\s+/g, '_')}`;
      group.position.copy(centerOffset);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      const coreMat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.1, metalness: 0.55, roughness: 0.28, transparent: true, opacity: 0.86 });
      const glowMat = new THREE.MeshBasicMaterial({ color: def.color, wireframe: true, transparent: true, opacity: 0.7 });
      if (def.kind === 'ROTATING BLADES') {
        for (let b = 0; b < 4; b++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(8, 118, 15), coreMat); blade.rotation.z = b * Math.PI / 4; group.add(blade); }
        group.add(new THREE.Mesh(new THREE.TorusGeometry(78, 3, 8, 36), glowMat));
      } else if (def.kind === 'GRAVITY MINE' || def.kind === 'GRAVITY WELL' || def.kind === 'SINGULARITY SURGE') {
        group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(def.radius * 0.45, 2), coreMat));
        [0, 1, 2].forEach((r) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(def.radius * (0.72 + r * 0.16), 2, 8, 40), glowMat); ring.rotation.set(r * 0.8, r * 0.6, r * 0.45); group.add(ring); });
      } else if (def.kind === 'PLASMA LATTICE' || def.kind === 'PHASE GATE') {
        for (let b = -2; b <= 2; b++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 145, 8), coreMat); beam.position.x = b * 25; group.add(beam); }
        group.add(new THREE.Mesh(new THREE.TorusGeometry(95, 4, 8, 40), glowMat));
      } else if (def.kind === 'DEBRIS WALL' || def.kind === 'ORBITAL SHARDS') {
        for (let b = 0; b < 11; b++) { const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(10 + (b % 4) * 5), coreMat); shard.position.set(((b % 4) - 1.5) * 27, (Math.floor(b / 4) - 1) * 34, (b % 3) * 10); group.add(shard); }
        group.add(new THREE.Mesh(new THREE.BoxGeometry(130, 3, 5), glowMat));
      } else {
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(18, 28, 48, 8), coreMat));
        for (let b = 0; b < 3; b++) { const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 52, 8), glowMat); barrel.rotation.z = Math.PI / 2; barrel.position.set((b - 1) * 22, 0, -22); group.add(barrel); }
      }
      const warning = new THREE.Mesh(new THREE.TorusGeometry(def.radius + 18, 1.5, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.52 }));
      warning.position.z = 8;
      group.add(warning);
      this.group.add(group);
      this.routeHazards.push({ id: `hazard_${index + 1}`, kind: def.kind, mesh: group, position: centerOffset.clone(), radius: def.radius, damage: def.damage, phase: index * 0.73, active: true });
      this.rotatingParts.push(group);
    });
  }

  public getRouteHazardCollision(position: THREE.Vector3): { kind: string; damage: number } | null {
    for (const hazard of this.routeHazards) {
      if (!hazard.active) continue;
      if (position.distanceTo(hazard.position) < hazard.radius) return { kind: hazard.kind, damage: hazard.damage };
    }
    return null;
  }

  /** Two alternate physical lanes split from and reconnect to the primary route. */
  private buildRouteBranches() {
    [1, -1].forEach((side) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 18; i++) {
        const t = 0.34 + (i / 18) * 0.22;
        const center = this.getRoutePoint(t);
        const tangent = this.getRouteTangent(t);
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const envelope = Math.sin((i / 18) * Math.PI) * 165;
        points.push(center.addScaledVector(lateral, side * envelope));
      }
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 90, 4, 8, false),
        new THREE.MeshStandardMaterial({ color: side > 0 ? 0x38bdf8 : 0xa78bfa, emissive: side > 0 ? 0x075985 : 0x5b21b6, emissiveIntensity: 0.8, metalness: 0.65, roughness: 0.3 })
      );
      tube.name = side > 0 ? 'convoy_route_branch_alpha' : 'convoy_route_branch_beta';
      this.group.add(tube);
    });
  }

  private buildBrokenOrbitalRing() {
    const t = 0.72;
    const center = this.getRoutePoint(t);
    const tangent = this.getRouteTangent(t);
    const ringGroup = new THREE.Group();
    ringGroup.position.copy(center);
    ringGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const material = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35, emissive: 0x0e7490, emissiveIntensity: 0.35 });
    for (let i = 0; i < 9; i++) {
      if (i === 2 || i === 6) continue; // two visible structural gaps
      const start = (i / 9) * Math.PI * 2;
      const end = start + (Math.PI * 2 / 9) * 0.78;
      const arc = new THREE.Mesh(new THREE.TorusGeometry(155, 9, 10, 18, end - start), material);
      arc.rotation.z = start;
      ringGroup.add(arc);
    }
    this.group.add(ringGroup);
  }

  public isBarrierCollision(position: THREE.Vector3): boolean {
    return this.barrierHazards.some((barrier) => barrier.mesh.visible && position.distanceTo(barrier.position) < barrier.radius);
  }

  private buildCosmicBackdrop() {
    // 2,500 Star particles for deep space parallax
    const starCount = 2500;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 4000 + Math.random() * 4500;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) - 3000;

      // Teal, Cyan, White, Emerald palette
      const rnd = Math.random();
      if (rnd > 0.6) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.8;
      } else if (rnd > 0.3) {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.6;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 5.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const stars = new THREE.Points(starGeo, starMat);
    this.group.add(stars);

    // Distant Gas Giant in the deep void
    const planetGeo = new THREE.SphereGeometry(700, 32, 32);
    const planetMat = new THREE.MeshBasicMaterial({
      color: 0x042f2e,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(3200, -800, -5000);
    this.group.add(planet);
  }

  public update(dt: number) {
    this.barrierClock += Math.max(0, Math.min(dt, 0.1));
    this.routeHazards.forEach((hazard, index) => {
      const pulse = 0.65 + 0.25 * Math.sin(this.barrierClock * (1.4 + index * 0.07) + hazard.phase);
      hazard.mesh.scale.setScalar(hazard.kind === 'GRAVITY WELL' || hazard.kind === 'SINGULARITY SURGE' ? pulse : 1);
      hazard.mesh.rotation.z += dt * (index % 2 ? -0.22 : 0.3);
      hazard.active = hazard.kind === 'PLASMA LATTICE' || hazard.kind === 'PHASE GATE' ? ((this.barrierClock + hazard.phase) % 5.2) < 3.2 : true;
      hazard.mesh.visible = hazard.active;
    });
    this.barrierHazards.forEach((barrier) => {
      // Each barrier cycles active for 1.8s and inactive for 2.2s; phase offsets create a timing corridor.
      const cycle = (this.barrierClock + barrier.phase) % 4.0;
      barrier.mesh.visible = cycle < 1.8;
      const material = barrier.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = barrier.mesh.visible ? 0.45 + 0.35 * Math.sin(this.barrierClock * 8 + barrier.phase) : 0.05;
    });

    // Rotate animated objects
    this.rotatingParts.forEach((part, idx) => {
      part.rotation.z += dt * (0.35 * (idx % 2 === 0 ? 1 : -1));
    });

    // Rotate physical asteroids
    this.asteroids.forEach((ast) => {
      if (ast.mesh) {
        ast.mesh.rotation.x += ast.rotationSpeed.x * dt;
        ast.mesh.rotation.y += ast.rotationSpeed.y * dt;
        ast.mesh.rotation.z += ast.rotationSpeed.z * dt;
      }
    });

    // Pulse extraction horizon
    if (this.extractionHorizon && this.extractionHorizon.material) {
      const pulse = 0.45 + 0.25 * Math.sin(Date.now() * 0.004);
      (this.extractionHorizon.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  }

  public cleanUp() {
    this.group.clear();
    this.rotatingParts = [];
    this.asteroids = [];
    this.repairPickups = [];
    this.checkpointMeshes = [];
    this.barrierHazards = [];
    this.parkingGates = [];
    this.parkingLocks = [];
    this.sensorRings = [];
    this.emergencyExitGate = null;
    this.barrierClock = 0;
    convoyChamberGates.reset();
  }
}

export const convoyEnvironment = new ConvoyEnvironment();
