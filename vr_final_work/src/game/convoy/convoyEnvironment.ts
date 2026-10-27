/**
 * VOID-RIDER 3D — CONVOY ENVIRONMENT & ROUTE GENERATOR
 * 
 * Constructs a cinematic 6,000-meter deep space corridor:
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

export class ConvoyEnvironment {
  public group: THREE.Group;
  public routeCurve: THREE.CatmullRomCurve3;
  /** Physical spline length in world units; gameplay telemetry maps it to a 15,000 km mission corridor. */
  public totalRouteLength: number = 6000;
  public readonly routeLengthKm: number = 15000;
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
    
    // Create an expansive, sweeping 3D space route with natural curves and elevation changes
    const waypoints = [
      new THREE.Vector3(0, 0, 0),             // 0. Departure Station
      new THREE.Vector3(200, 40, -800),       // 1. Departure lane
      new THREE.Vector3(500, -20, -1600),     // 2. Asteroid Belt Entry
      new THREE.Vector3(150, -80, -2500),     // 3. Drone Intercept Sector
      new THREE.Vector3(-350, 60, -3400),     // 4. Ambush Nebula
      new THREE.Vector3(-600, -30, -4200),    // 5. Damaged Station / Repair zone
      new THREE.Vector3(-300, 80, -5100),     // 6. Extraction Approach Gantry
      new THREE.Vector3(0, 0, -6900),         // 7. Spherical cargo parking dome approach
    ];
    
    this.routeCurve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.25);
    this.totalRouteLength = this.routeCurve.getLength();
  }

  public build(scene: THREE.Scene) {
    this.cleanUp();

    // 1. Cinematic Lighting tailored for convoy escort readability
    this.buildLighting();

    // 2. Departure Station (Start outpost)
    this.buildDepartureStation();

    // 3. Extraction Citadel & Quantum Gate (Destination)
    this.buildExtractionGate();
    this.buildCargoParkingDome();
    this.buildEmergencyExitGate();

    // 4. Intermediate Space Structures (Bridges, Pylons, Relays)
    this.buildSpaceStructures();

    // 5. Continuous luminous fixed-route guide and waypoint rings
    this.buildFixedRouteGuide();
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
   */
  public getRoutePoint(t: number): THREE.Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));
    return this.routeCurve.getPointAt(clampedT);
  }

  /**
   * Sample forward tangent along the route at progress t
   */
  public getRouteTangent(t: number): THREE.Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));
    return this.routeCurve.getTangentAt(clampedT).normalize();
  }


  /** Large spherical destination hangar with sensor gates and four sequential parking bays. */
  private buildCargoParkingDome() {
    const dome = new THREE.Group();
    dome.name = 'spherical_cargo_parking_dome';
    dome.position.set(0, 0, -7350);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(470, 48, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x15344b, metalness: 0.42, roughness: 0.22, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
    );
    dome.add(shell);
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(476, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.12 })
    );
    dome.add(wire);

    // Curved metallic ribs and concentric support rings make the destination read as the
    // same spherical orbital Parking Dome from the supplied reference, not a generic hangar.
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x7896aa, metalness: 0.88, roughness: 0.24, emissive: 0x092b42, emissiveIntensity: 0.7 });
    for (let i = 0; i < 16; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(462, 3.4, 8, 96), ribMat);
      rib.rotation.set(Math.PI / 2, (Math.PI * i) / 16, 0);
      rib.scale.set(1, 0.99, 1);
      dome.add(rib);
    }
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x3b718b, metalness: 0.82, roughness: 0.2, emissive: 0x075985, emissiveIntensity: 1.3 });
    [150, 290, 430].forEach((radius, idx) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, idx === 2 ? 7 : 4, 10, 96), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = idx === 0 ? 115 : idx === 1 ? 15 : -70;
      dome.add(ring);
    });

    // Circular deck, outer armored rim, and the central PARKING DOME control tower.
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(430, 448, 20, 96), new THREE.MeshStandardMaterial({ color: 0x263d4d, metalness: 0.84, roughness: 0.28, emissive: 0x061c2a, emissiveIntensity: 0.5 }));
    deck.position.set(0, -170, 0);
    dome.add(deck);
    const deckRing = new THREE.Mesh(new THREE.TorusGeometry(438, 9, 12, 96), ringMat);
    deckRing.rotation.x = Math.PI / 2;
    deckRing.position.y = -158;
    dome.add(deckRing);
    const hub = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(62, 82, 230, 32), new THREE.MeshStandardMaterial({ color: 0x102331, metalness: 0.86, roughness: 0.27, emissive: 0x062b3a, emissiveIntensity: 0.8 }));
    tower.position.set(0, -38, -20);
    hub.add(tower);
    const towerCrown = new THREE.Mesh(new THREE.CylinderGeometry(88, 76, 18, 40), ringMat);
    towerCrown.position.set(0, 82, -20);
    hub.add(towerCrown);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(92, 40, 4), new THREE.MeshBasicMaterial({ color: 0x06283a }));
    sign.position.set(0, -24, 61);
    hub.add(sign);
    const signGlow = new THREE.Mesh(new THREE.BoxGeometry(96, 44, 2), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 }));
    signGlow.position.set(0, -24, 59);
    hub.add(signGlow);
    dome.add(hub);

    // Nine individually marked parking bays, matching the nine-ship SAVIOUR roster.
    // All bays have visible approach gates, sensor rings, clamp hardware and bay placards.
    const bayXs = [-240, -180, -120, -60, 0, 60, 120, 180, 240];
    bayXs.forEach((x, i) => {
      const bay = new THREE.Group();
      bay.position.set(x, -158, -160);
      const bayMat = new THREE.MeshStandardMaterial({ color: 0x1b3444, metalness: 0.78, roughness: 0.28, emissive: 0x062a35, emissiveIntensity: 0.55 });
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 5, 32), bayMat);
      pad.position.set(0, 0, 0);
      bay.add(pad);
      const padRing = new THREE.Mesh(new THREE.TorusGeometry(29, 1.7, 8, 40), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xfbbf24 : 0x22d3ee }));
      padRing.rotation.x = Math.PI / 2;
      padRing.position.y = 3;
      bay.add(padRing);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 70), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xfbbf24 : 0x22d3ee }));
      stripe.position.set(0, 3, 0);
      bay.add(stripe);

      const gate = new THREE.Group();
      gate.position.set(0, 30, 32);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x31536a, metalness: 0.72, roughness: 0.22, emissive: 0x0c4a6e, emissiveIntensity: 1.0 });
      [-1, 1].forEach((side) => {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(5, 48, 8), gateMat);
        leaf.position.x = side * 26;
        gate.add(leaf);
      });
      bay.add(gate);
      this.parkingGates.push(gate);

      const sensor = new THREE.Mesh(new THREE.TorusGeometry(34, 1.8, 8, 40), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 }));
      sensor.position.set(0, 33, 32);
      bay.add(sensor);
      this.sensorRings.push(sensor);

      const locks = new THREE.Group();
      [-1, 1].forEach((side) => {
        const clamp = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 14), new THREE.MeshStandardMaterial({ color: 0x9aaebe, metalness: 0.9, roughness: 0.2, emissive: 0x082f49, emissiveIntensity: 0.7 }));
        clamp.position.set(side * 21, 7, -5);
        locks.add(clamp);
      });
      bay.add(locks);
      this.parkingLocks.push(locks);

      const placard = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 9), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xf59e0b : 0x06b6d4 }));
      placard.position.set(0, 5, 43);
      bay.add(placard);
      // Legible in-world BAY 01–09 signage, not just a HUD label.
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 256;
      labelCanvas.height = 64;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        ctx.fillStyle = '#061521';
        ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
        ctx.strokeStyle = i === 0 ? '#fbbf24' : '#22d3ee';
        ctx.lineWidth = 5;
        ctx.strokeRect(3, 3, labelCanvas.width - 6, labelCanvas.height - 6);
        ctx.fillStyle = i === 0 ? '#fde68a' : '#cffafe';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`BAY ${String(i + 1).padStart(2, '0')}`, labelCanvas.width / 2, labelCanvas.height / 2);
      }
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 8.5), new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide }));
      labelMesh.position.set(0, 13, 44);
      bay.add(labelMesh);
      bay.userData.bayNumber = i + 1;
      dome.add(bay);
    });

    // Underground basement structure: heavy support columns, ceiling girders, warning lamps and floor guide strips.
    const structureMat = new THREE.MeshStandardMaterial({ color: 0x253746, metalness: 0.82, roughness: 0.34, emissive: 0x071722, emissiveIntensity: 0.35 });
    [-390, -260, 260, 390].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(24, 260, 28), structureMat);
      pillar.position.set(x, -35, -15);
      dome.add(pillar);
      const warning = new THREE.Mesh(new THREE.BoxGeometry(27, 5, 31), new THREE.MeshBasicMaterial({ color: 0xff4d4d }));
      warning.position.set(x, 88, -15);
      dome.add(warning);
    });
    const ceilingBeam = new THREE.Mesh(new THREE.BoxGeometry(820, 18, 34), structureMat);
    ceilingBeam.position.set(0, 105, -30);
    dome.add(ceilingBeam);
    [-330, 330].forEach((x) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(70, 4, 18), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      lamp.position.set(x, 94, 30);
      dome.add(lamp);
    });

    // Arrival airlock: twin sensor hoops mark the chamber threshold.
    [-120, 120].forEach((x) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(125, 5, 12, 64), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.62 }));
      hoop.position.set(x, -15, 360);
      dome.add(hoop);
      this.rotatingParts.push(hoop);
    });
    dome.traverse((obj) => { if ((obj as THREE.Mesh).isMesh) obj.frustumCulled = false; });
    this.group.add(dome);
  }

  /** Heavy blast gate at the basement emergency exit. Opening is a visible mechanical action. */
  private buildEmergencyExitGate() {
    const gate = new THREE.Group();
    gate.name = 'convoy_emergency_basement_exit';
    gate.position.set(0, 0, -7880);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(118, 8, 12, 64), new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.7, roughness: 0.25, emissive: 0x7f1d1d, emissiveIntensity: 1.1 }));
    gate.add(ring);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.28, emissive: 0x3f1010, emissiveIntensity: 0.45 });
    const leaves: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(46, 118, 12), leafMat);
      leaf.position.set((i - 1.5) * 25, 0, 0);
      leaf.userData.closedX = leaf.position.x;
      leaves.push(leaf);
      gate.add(leaf);
    }
    gate.userData.leaves = leaves;
    const sensor = new THREE.Mesh(new THREE.TorusGeometry(132, 2.5, 8, 64), new THREE.MeshBasicMaterial({ color: 0xff4545, transparent: true, opacity: 0.9 }));
    gate.add(sensor);
    this.emergencyExitGate = gate;
    this.group.add(gate);
  }

  public setEmergencyExitOpen(open: boolean) {
    if (!this.emergencyExitGate) return;
    const leaves = this.emergencyExitGate.userData.leaves as THREE.Mesh[] | undefined;
    leaves?.forEach((leaf, i) => {
      const baseX = Number(leaf.userData.closedX ?? (i - 1.5) * 25);
      leaf.position.x = open ? baseX + (i < 2 ? -95 : 95) : baseX;
    });
    const ring = this.emergencyExitGate.children[0] as THREE.Mesh;
    (ring.material as THREE.MeshStandardMaterial).emissive.set(open ? 0x14532d : 0x7f1d1d);
    (ring.material as THREE.MeshStandardMaterial).color.set(open ? 0x22c55e : 0x7f1d1d);
  }

  public getEmergencyExitPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -8000);
  }

  /** World-space parking target, one slot per surviving convoy vessel (up to 9 ships). */
  public getParkingPosition(index: number): THREE.Vector3 {
    const xPositions = [-240, -180, -120, -60, 0, 60, 120, 180, 240];
    const x = xPositions[Math.max(0, Math.min(xPositions.length - 1, index))];
    return new THREE.Vector3(x, -158, -7510);
  }

  /** Gate opens only for the active arrival; after lock engagement it seals the bay. */
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

  private buildDepartureStation() {
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
    gateGroup.position.set(0, 0, -6000);

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
    // Strategic megastructures along the flight corridor for depth and scale
    const structures = [
      { t: 0.15, posOffset: new THREE.Vector3(180, -40, 0), label: 'SOLAR REFINERY' },
      { t: 0.38, posOffset: new THREE.Vector3(-220, 60, 0), label: 'RELAY PLATFORM' },
      { t: 0.62, posOffset: new THREE.Vector3(260, -50, 0), label: 'DERELICT FREIGHTER' },
      { t: 0.82, posOffset: new THREE.Vector3(-200, 80, 0), label: 'DEFENSE MATRIX GANTRY' },
    ];

    structures.forEach((st) => {
      const center = this.getRoutePoint(st.t).add(st.posOffset);
      const structGroup = new THREE.Group();
      structGroup.position.copy(center);

      // Main structural block
      const bGeo = new THREE.BoxGeometry(70, 90, 140);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.85,
        roughness: 0.35,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      structGroup.add(bMesh);

      // Rotating Comms Antenna
      const antGeo = new THREE.TorusGeometry(32, 3, 8, 24);
      const antMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(0, 70, 0);
      structGroup.add(ant);
      this.rotatingParts.push(ant);

      this.group.add(structGroup);
    });
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

    // Distance markers make the full 15,000 km mission legible in-world. Labels are
    // sprites rather than DOM overlays, so they stay anchored to the physical route.
    for (let km = 0; km <= this.routeLengthKm; km += 1500) {
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
        ctx.fillText(km === 0 ? 'DEPARTURE' : km === this.routeLengthKm ? 'PARKING DOME' : `${km.toLocaleString()} KM`, 128, 48);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, sizeAttenuation: true }));
        label.name = `route_distance_label_${km}_km`;
        label.position.copy(point).addScaledVector(lateral, 72).add(new THREE.Vector3(0, 38, 0));
        label.scale.set(km === this.routeLengthKm ? 100 : 72, km === this.routeLengthKm ? 38 : 27, 1);
        guide.add(label);
      }
    }

    // Small directional chevrons are repeated along the entire spline so the route direction
    // remains readable through bends, the debris field, and the final docking approach.
    const arrowGeometry = new THREE.ConeGeometry(8, 22, 3);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.92, depthWrite: false });
    const sampleCount = Math.max(48, Math.min(120, Math.floor(this.routeLengthKm / 150)));
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

  private buildCheckpointRings() {
    // Twelve numbered checkpoint gates distributed across the 15,000 km route.
    // They are visual route landmarks; gameplay checkpoint state remains owned by the director.
    const checkpointFractions = Array.from({ length: 12 }, (_, idx) => (idx + 1) / 12);

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


  /** A long-haul 15,000 km corridor with distinct hazard families and readable warning silhouettes. */
  private buildVariedRouteHazards() {
    this.routeHazards = [];
    const definitions = [
      { kind: 'ROTATING BLADES', t: 0.12, color: 0xfb7185, radius: 62, damage: 14 },
      { kind: 'GRAVITY MINE', t: 0.20, color: 0xa78bfa, radius: 58, damage: 18 },
      { kind: 'PLASMA LATTICE', t: 0.29, color: 0x22d3ee, radius: 68, damage: 16 },
      { kind: 'DEBRIS WALL', t: 0.39, color: 0xf59e0b, radius: 74, damage: 20 },
      { kind: 'PULSE TURRET', t: 0.51, color: 0xef4444, radius: 58, damage: 17 },
      { kind: 'GRAVITY WELL', t: 0.62, color: 0x8b5cf6, radius: 80, damage: 19 },
      { kind: 'ORBITAL SHARDS', t: 0.74, color: 0x10b981, radius: 64, damage: 15 },
      { kind: 'PHASE GATE', t: 0.85, color: 0xf472b6, radius: 70, damage: 18 },
      { kind: 'SINGULARITY SURGE', t: 0.94, color: 0xf97316, radius: 84, damage: 22 },
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
  }
}

export const convoyEnvironment = new ConvoyEnvironment();
