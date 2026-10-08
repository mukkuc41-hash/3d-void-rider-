import * as THREE from 'three';

/**
 * PERSISTENT FUTURISTIC ORBITAL CIVILIZATION
 *
 * A single, colossal, persistent orbital civilization surrounding the player
 * with rich multi-layered depth (foreground, mid-distance, distant, orbital),
 * preserving strong negative space around the central Sagittarius A* black hole.
 *
 * Contains:
 * - Orbital skyscraper towers, space towers, energy towers, research towers, comm towers, industrial towers
 * - Floating city platforms, residential districts, suspended platforms, rotating habitats
 * - Spaceports, orbital highways, magnetic transport rails, glowing energy bridges, transparent domes
 * - Massive orbital ring, space elevator, mining platforms, defense platforms, refineries, docking stations
 * - Planetary observation arrays, wormhole infrastructure, gravity stabilizers, solar collectors
 * - Holographic billboards, neon architectural lighting, autonomous civilian traffic
 *
 * Implements persistent physical damage, structural fractures, deformation,
 * and observational reactions for Final Collapse Events 1 through 33.
 */
export class FinalCollapseCivilization {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHolePosition: THREE.Vector3;

  // Layered groups
  public foregroundGroup: THREE.Group;
  public midDistanceGroup: THREE.Group;
  public distantGroup: THREE.Group;
  public orbitalRingGroup: THREE.Group;
  public trafficGroup: THREE.Group;
  public energyBridgesGroup: THREE.Group;
  public observationArraysGroup: THREE.Group;

  // Specific Key Persistent Landmarks (referenced in Events 1–33)
  public spaceElevatorTower: THREE.Group;
  public spaceElevatorCables: THREE.LineSegments;
  public primaryOrbitalRing: THREE.Group;
  public brokenRingSection: THREE.Mesh | null = null;
  public giantEnergyTower: THREE.Group;
  public energyTowerUpperCrown: THREE.Mesh | null = null;
  public energyTowerArcs: THREE.LineSegments | null = null;
  public majorResearchStation: THREE.Group;
  public spaceDockShipyard: THREE.Group;
  public spaceDockTornArm: THREE.Mesh | null = null;
  public cargoContainers: THREE.InstancedMesh | null = null;
  public megastructureBastion: THREE.Group;
  public tiltingTowers: THREE.Group[] = [];
  public floatingPlatforms: THREE.Group[] = [];
  public energyBridges: { mesh: THREE.Mesh; originalGeo: THREE.BufferGeometry; curveP1: THREE.Vector3 }[] = [];
  public observationDishes: THREE.Mesh[] = [];
  public warningBeacons: THREE.Mesh[] = [];
  public holographicBillboards: THREE.Mesh[] = [];
  public civilianTrafficVehicles: { mesh: THREE.Mesh; speed: number; radius: number; angle: number; chaotic: boolean }[] = [];
  public moonMesh: THREE.Mesh;
  public capturedAsteroidGroup: THREE.Group;
  public asteroidMesh: THREE.Mesh;
  public foundationTearTower: THREE.Group;

  // Materials for global reaction states
  private architecturalMat: THREE.MeshStandardMaterial;
  private metalTrimMat: THREE.MeshStandardMaterial;
  private neonCyanMat: THREE.MeshBasicMaterial;
  private neonAmberMat: THREE.MeshBasicMaterial;
  private neonRedAlertMat: THREE.MeshBasicMaterial;
  private energyBridgeMat: THREE.ShaderMaterial;
  private holoBillboardMat: THREE.ShaderMaterial;
  private domeMat: THREE.MeshPhysicalMaterial;

  // State trackers for persistent damage (Part 1 & Part 2)
  public elevatorBentAngle = 0;
  public energyTowerBroken = false;
  public ringSectionDetached = false;
  public dockArmTorn = false;
  public megastructureRotating = false;
  public megastructureRotSpeed = 0;
  public platformSeparated = false;
  public foundationTorn = false;
  public trafficPanic = false;
  public powerSurgeIntensity = 0;
  public starlightLensingGhostActive = false;
  public cityLensingWarp = 0;
  public stationLongitudinalStretch = 1.0;
  public moonOrbitProgress = 0;

  // New Part 2 Persistent Consequences (Events 34–66)
  public commArraysDesynchronized = false;
  public solarCollectorsDetached = false;
  public secondaryEnergyTowerBroken = false;
  public habitatTorusOvalDeformed = false;
  public refineryDetached = false;
  public biodomeRuptured = false;
  public cargoContainersScattered = false;
  public wormholePylonsWobbling = false;
  public secondaryRingSectionDetached = false;
  public globalPenumbraOccultation = false;
  public elevatorMidSectionSnapped = false;
  public observationArraysSheared = false;
  public energySkybridgesDissolved = false;
  public megastructureFoundationFractured = false;
  public flightPlatformPlunged = false;
  public easternQuadrantBlackout = false;
  public fourSegmentRingBreak = false;
  public globalCivilizationCompromised = false;

  constructor(scene: THREE.Scene, blackHolePos = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHolePosition = blackHolePos.clone();

    this.root = new THREE.Group();
    this.root.name = 'PersistentOrbitalCivilization_Root';

    this.foregroundGroup = new THREE.Group();
    this.midDistanceGroup = new THREE.Group();
    this.distantGroup = new THREE.Group();
    this.orbitalRingGroup = new THREE.Group();
    this.trafficGroup = new THREE.Group();
    this.energyBridgesGroup = new THREE.Group();
    this.observationArraysGroup = new THREE.Group();

    this.root.add(this.distantGroup);
    this.root.add(this.orbitalRingGroup);
    this.root.add(this.midDistanceGroup);
    this.root.add(this.foregroundGroup);
    this.root.add(this.trafficGroup);
    this.root.add(this.energyBridgesGroup);
    this.root.add(this.observationArraysGroup);

    // Initialize core architectural materials
    this.architecturalMat = new THREE.MeshStandardMaterial({
      color: 0x182438,
      metalness: 0.88,
      roughness: 0.32,
    });
    this.metalTrimMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.25,
    });
    this.neonCyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });
    this.neonAmberMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
    });
    this.neonRedAlertMat = new THREE.MeshBasicMaterial({
      color: 0xff1e00,
    });
    this.domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.85,
      opacity: 0.65,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
    });

    // Custom shader material for glowing pulsating energy skybridges
    this.energyBridgeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSurge: { value: 0 },
        uColorA: { value: new THREE.Color(0x00f0ff) },
        uColorB: { value: new THREE.Color(0xff00a0) },
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
        uniform float uSurge;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        void main() {
          float pulse = sin(vUv.x * 24.0 - uTime * 6.0) * 0.5 + 0.5;
          vec3 col = mix(uColorA, uColorB, pulse);
          col += vec3(uSurge * 0.8);
          float alpha = 0.55 + pulse * 0.35 + uSurge * 0.3;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    // Custom shader for holographic city billboards
    this.holoBillboardMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlicker: { value: 0 },
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
        uniform float uFlicker;
        varying vec2 vUv;
        void main() {
          float scanline = sin(vUv.y * 80.0 + uTime * 12.0) * 0.25 + 0.75;
          float glitch = step(0.92, sin(uTime * 30.0 + vUv.x * 10.0)) * uFlicker;
          vec3 col = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.1, 0.4), glitch);
          float alpha = (0.7 + glitch * 0.3) * scanline * (1.0 - uFlicker * 0.5);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Build the persistent civilization structures
    this.buildPrimaryOrbitalRing();
    this.buildSpaceElevator();
    this.buildGiantEnergyTower();
    this.buildMajorResearchStation();
    this.buildSpaceDockShipyard();
    this.buildMegastructureBastion();
    this.buildFloatingCityPlatforms();
    this.buildSkyscraperDistricts();
    this.buildEnergySkybridges();
    this.buildPlanetaryObservationArrays();
    this.buildAutonomousCivilianTraffic();
    this.buildCelestialContext();

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. CIRCUMFERENTIAL ORBITAL MEGA-RING (Events 11 & 25)
     ========================================================================= */
  private buildPrimaryOrbitalRing(): void {
    this.primaryOrbitalRing = new THREE.Group();
    this.primaryOrbitalRing.name = 'PrimaryOrbitalRing';
    // Positioned overhead in mid/distant space encircling the sector
    this.primaryOrbitalRing.position.set(0, 360, -2600);
    this.primaryOrbitalRing.rotation.x = Math.PI / 5.2;

    const ringRadius = 1600;
    const ringTube = 14;
    // Main ring structure
    const ringGeo = new THREE.TorusGeometry(ringRadius, ringTube, 16, 72);
    const ringMesh = new THREE.Mesh(ringGeo, this.architecturalMat);
    this.primaryOrbitalRing.add(ringMesh);

    // Glowing circumferential transit rail
    const railGeo = new THREE.TorusGeometry(ringRadius + 18, 3, 8, 72);
    const railMesh = new THREE.Mesh(railGeo, this.neonCyanMat);
    this.primaryOrbitalRing.add(railMesh);

    // Detachable Ring Section for Event 25 (400-meter segment)
    const brokenSecGeo = new THREE.TorusGeometry(ringRadius, ringTube * 1.05, 16, 12, Math.PI / 5);
    this.brokenRingSection = new THREE.Mesh(brokenSecGeo, this.architecturalMat);
    this.brokenRingSection.position.set(0, 0, 0);
    this.brokenRingSection.visible = false;
    this.primaryOrbitalRing.add(this.brokenRingSection);

    // Support pylons radiating outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pylonGeo = new THREE.CylinderGeometry(8, 12, 180, 8);
      const pylon = new THREE.Mesh(pylonGeo, this.metalTrimMat);
      pylon.position.set(Math.cos(angle) * (ringRadius + 80), Math.sin(angle) * (ringRadius + 80), 0);
      pylon.rotation.z = angle;
      this.primaryOrbitalRing.add(pylon);
    }

    this.orbitalRingGroup.add(this.primaryOrbitalRing);
  }

  /* =========================================================================
     2. MASSIVE SPACE ELEVATOR (Event 9)
     ========================================================================= */
  private buildSpaceElevator(): void {
    this.spaceElevatorTower = new THREE.Group();
    this.spaceElevatorTower.name = 'MassiveSpaceElevator';
    // Anchored at left mid-distance (x=-950, y=-200, z=-1800)
    this.spaceElevatorTower.position.set(-950, -180, -1800);

    // Central elevator shaft (height 980m)
    const shaftGeo = new THREE.CylinderGeometry(14, 22, 980, 12);
    const shaft = new THREE.Mesh(shaftGeo, this.architecturalMat);
    shaft.position.y = 490;
    this.spaceElevatorTower.add(shaft);

    // Super-tensile carbon cable lines
    const cablePoints: THREE.Vector3[] = [];
    for (let c = 0; c < 4; c++) {
      const cAngle = (c / 4) * Math.PI * 2;
      cablePoints.push(new THREE.Vector3(Math.cos(cAngle) * 32, 0, Math.sin(cAngle) * 32));
      cablePoints.push(new THREE.Vector3(Math.cos(cAngle) * 22, 980, Math.sin(cAngle) * 22));
    }
    const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    const cableMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    this.spaceElevatorCables = new THREE.LineSegments(cableGeo, cableMat);
    this.spaceElevatorTower.add(this.spaceElevatorCables);

    // Mid-way climbing transit car & terminal docking platform
    const platformGeo = new THREE.CylinderGeometry(54, 45, 24, 16);
    const platform = new THREE.Mesh(platformGeo, this.metalTrimMat);
    platform.position.y = 520;
    this.spaceElevatorTower.add(platform);

    this.midDistanceGroup.add(this.spaceElevatorTower);
  }

  /* =========================================================================
     3. GIANT PRIMARY ENERGY TRANSMISSION SPIRE (Event 12 & 23)
     ========================================================================= */
  private buildGiantEnergyTower(): void {
    this.giantEnergyTower = new THREE.Group();
    this.giantEnergyTower.name = 'GiantPrimaryEnergyTower';
    // Positioned right mid-distance (x=820, y=120, z=-1650)
    this.giantEnergyTower.position.set(820, 120, -1650);

    // Lower tower base (height 420m)
    const baseGeo = new THREE.CylinderGeometry(18, 38, 420, 10);
    const baseMesh = new THREE.Mesh(baseGeo, this.architecturalMat);
    baseMesh.position.y = 210;
    this.giantEnergyTower.add(baseMesh);

    // Glowing superconductor conduits running along the tower
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const conduitGeo = new THREE.BoxGeometry(3, 410, 4);
      const conduit = new THREE.Mesh(conduitGeo, this.neonCyanMat);
      conduit.position.set(Math.cos(angle) * 22, 210, Math.sin(angle) * 22);
      this.giantEnergyTower.add(conduit);
    }

    // Breakaway Upper Crown for Event 23 (height 160m)
    const crownGeo = new THREE.ConeGeometry(24, 160, 8);
    crownGeo.rotateX(Math.PI);
    this.energyTowerUpperCrown = new THREE.Mesh(crownGeo, this.metalTrimMat);
    this.energyTowerUpperCrown.position.set(0, 500, 0);
    this.giantEnergyTower.add(this.energyTowerUpperCrown);

    // Ruptured electrical discharge arc lines (dormant until Event 23)
    const arcPts: THREE.Vector3[] = [];
    for (let a = 0; a < 8; a++) {
      arcPts.push(new THREE.Vector3(0, 420, 0));
      arcPts.push(new THREE.Vector3((Math.random() - 0.5) * 60, 420 + Math.random() * 50, (Math.random() - 0.5) * 60));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    const arcMat = new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0 });
    this.energyTowerArcs = new THREE.LineSegments(arcGeo, arcMat);
    this.giantEnergyTower.add(this.energyTowerArcs);

    this.midDistanceGroup.add(this.giantEnergyTower);
  }

  /* =========================================================================
     4. MAJOR ORBITAL RESEARCH STATION & ROTATING HABITATS (Events 14 & 28)
     ========================================================================= */
  private buildMajorResearchStation(): void {
    this.majorResearchStation = new THREE.Group();
    this.majorResearchStation.name = 'MajorOrbitalResearchStation';
    // Positioned left upper distance (x=-780, y=410, z=-2200)
    this.majorResearchStation.position.set(-780, 410, -2200);

    // Central hub
    const hubGeo = new THREE.CylinderGeometry(28, 34, 160, 16);
    const hub = new THREE.Mesh(hubGeo, this.architecturalMat);
    hub.rotation.z = Math.PI / 4;
    this.majorResearchStation.add(hub);

    // Rotating Torus Habitat
    const torusGeo = new THREE.TorusGeometry(120, 10, 16, 48);
    const torus = new THREE.Mesh(torusGeo, this.metalTrimMat);
    torus.rotation.x = Math.PI / 2.3;
    this.majorResearchStation.add(torus);

    // Transparent bio-domes on research station
    for (let d = 0; d < 3; d++) {
      const angle = (d / 3) * Math.PI * 2;
      const domeGeo = new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this.domeMat);
      dome.position.set(Math.cos(angle) * 120, Math.sin(angle) * 120, 0);
      this.majorResearchStation.add(dome);
    }

    this.midDistanceGroup.add(this.majorResearchStation);
  }

  /* =========================================================================
     5. SPACE DOCK SHIPYARD & DETACHABLE DOCKING ARM (Event 22)
     ========================================================================= */
  private buildSpaceDockShipyard(): void {
    this.spaceDockShipyard = new THREE.Group();
    this.spaceDockShipyard.name = 'SpaceDockShipyard';
    // Anchored at right mid-distance (x=980, y=-90, z=-1500)
    this.spaceDockShipyard.position.set(980, -90, -1500);

    // Main station body
    const bodyGeo = new THREE.BoxGeometry(90, 60, 240);
    const body = new THREE.Mesh(bodyGeo, this.architecturalMat);
    this.spaceDockShipyard.add(body);

    // Massive Docking Arm for Event 22 (length 180m)
    const armGeo = new THREE.BoxGeometry(16, 16, 180);
    this.spaceDockTornArm = new THREE.Mesh(armGeo, this.metalTrimMat);
    this.spaceDockTornArm.position.set(-60, 0, 30);
    this.spaceDockShipyard.add(this.spaceDockTornArm);

    // Floating Cargo Containers (InstancedMesh)
    const containerCount = 14;
    const contGeo = new THREE.BoxGeometry(8, 8, 16);
    const contMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.4 });
    this.cargoContainers = new THREE.InstancedMesh(contGeo, contMat, containerCount);
    const dummy = new THREE.Object3D();
    for (let c = 0; c < containerCount; c++) {
      dummy.position.set(
        -80 - Math.random() * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 80
      );
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      this.cargoContainers.setMatrixAt(c, dummy.matrix);
    }
    this.cargoContainers.instanceMatrix.needsUpdate = true;
    this.spaceDockShipyard.add(this.cargoContainers);

    this.midDistanceGroup.add(this.spaceDockShipyard);
  }

  /* =========================================================================
     6. MEGASTRUCTURE BASTION (Event 31)
     ========================================================================= */
  private buildMegastructureBastion(): void {
    this.megastructureBastion = new THREE.Group();
    this.megastructureBastion.name = 'MegastructureBastion';
    // Overhead spanning megastructure arch in distant space
    this.megastructureBastion.position.set(0, 520, -2900);

    // Massive interlocking segmented polygonal ring
    const archGeo = new THREE.TorusGeometry(850, 28, 8, 32, Math.PI * 1.2);
    const arch = new THREE.Mesh(archGeo, this.architecturalMat);
    arch.rotation.x = Math.PI / 2.6;
    this.megastructureBastion.add(arch);

    // Neon diagnostic illumination stripes
    const stripeGeo = new THREE.TorusGeometry(850, 4, 6, 32, Math.PI * 1.2);
    const stripe = new THREE.Mesh(stripeGeo, this.neonCyanMat);
    stripe.rotation.x = Math.PI / 2.6;
    this.megastructureBastion.add(stripe);

    this.distantGroup.add(this.megastructureBastion);
  }

  /* =========================================================================
     7. FLOATING CITY PLATFORMS & RESIDENTIAL DISTRICTS (Events 3, 16, 32)
     ========================================================================= */
  private buildFloatingCityPlatforms(): void {
    // 5 distinct floating platforms with residential towers and transparent domes
    const platformCoords = [
      { x: -550, y: -80, z: -1200 },
      { x: -700, y: 160, z: -1600 },
      { x: 620, y: -60, z: -1300 },
      { x: 500, y: 240, z: -1750 },
      { x: -350, y: 320, z: -2100 },
    ];

    platformCoords.forEach((coord, idx) => {
      const platGroup = new THREE.Group();
      platGroup.name = `FloatingPlatform_${idx + 1}`;
      platGroup.position.set(coord.x, coord.y, coord.z);

      // Hexagonal disc foundation
      const discGeo = new THREE.CylinderGeometry(90, 75, 18, 6);
      const disc = new THREE.Mesh(discGeo, this.architecturalMat);
      platGroup.add(disc);

      // Magnetic stabilizer pylons
      for (let p = 0; p < 3; p++) {
        const pAngle = (p / 3) * Math.PI * 2;
        const pylonGeo = new THREE.CylinderGeometry(5, 7, 50, 6);
        const pylon = new THREE.Mesh(pylonGeo, this.metalTrimMat);
        pylon.position.set(Math.cos(pAngle) * 75, -25, Math.sin(pAngle) * 75);
        platGroup.add(pylon);
      }

      // Residential micro-towers atop platform
      for (let t = 0; t < 4; t++) {
        const tHeight = 40 + Math.random() * 60;
        const towerGeo = new THREE.BoxGeometry(16, tHeight, 16);
        const tower = new THREE.Mesh(towerGeo, this.metalTrimMat);
        tower.position.set((Math.random() - 0.5) * 60, tHeight / 2 + 9, (Math.random() - 0.5) * 60);
        platGroup.add(tower);
      }

      // Transparent biosphere dome covering half the platform
      const domeGeo = new THREE.SphereGeometry(45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this.domeMat);
      dome.position.set(0, 9, 0);
      platGroup.add(dome);

      this.floatingPlatforms.push(platGroup);
      this.midDistanceGroup.add(platGroup);
    });
  }

  /* =========================================================================
     8. SKYSCRAPER TOWERS & TILTING METROPOLIS SPIRES (Events 17 & 33)
     ========================================================================= */
  private buildSkyscraperDistricts(): void {
    // Recognizable high-rise towers flanking the track
    const towerCoords = [
      { x: -380, y: -40, z: -950, h: 380, name: 'WesternSkyTower' },
      { x: -480, y: 80, z: -1350, h: 460, name: 'CitadelTowerAlpha' },
      { x: 420, y: -20, z: -980, h: 410, name: 'EasternSkyTower' },
      { x: 540, y: 120, z: -1400, h: 510, name: 'CitadelTowerBeta' },
    ];

    towerCoords.forEach(tc => {
      const tg = new THREE.Group();
      tg.name = tc.name;
      tg.position.set(tc.x, tc.y, tc.z);

      // Tapered skyscraper body
      const towerGeo = new THREE.BoxGeometry(45, tc.h, 45);
      const towerMesh = new THREE.Mesh(towerGeo, this.architecturalMat);
      towerMesh.position.y = tc.h / 2;
      tg.add(towerMesh);

      // Illuminated window grid & vertical neon trim
      const trimGeo = new THREE.BoxGeometry(47, tc.h * 0.95, 2);
      const trimMesh = new THREE.Mesh(trimGeo, this.neonCyanMat);
      trimMesh.position.y = tc.h / 2;
      tg.add(trimMesh);

      // Holographic billboard on lower face
      const billGeo = new THREE.PlaneGeometry(36, 20);
      const billMesh = new THREE.Mesh(billGeo, this.holoBillboardMat);
      billMesh.position.set(0, tc.h * 0.45, 24);
      tg.add(billMesh);
      this.holographicBillboards.push(billMesh);

      this.tiltingTowers.push(tg);
      this.midDistanceGroup.add(tg);
    });

    // Special Foundation Tear Tower for Event 33
    this.foundationTearTower = new THREE.Group();
    this.foundationTearTower.name = 'FoundationTearCitadel';
    this.foundationTearTower.position.set(-280, 40, -1100);

    const fTowerGeo = new THREE.CylinderGeometry(25, 45, 480, 10);
    const fTowerMesh = new THREE.Mesh(fTowerGeo, this.architecturalMat);
    fTowerMesh.position.y = 240;
    this.foundationTearTower.add(fTowerMesh);

    // Foundation support struts (break during Event 33)
    for (let s = 0; s < 4; s++) {
      const sAngle = (s / 4) * Math.PI * 2;
      const strutGeo = new THREE.BoxGeometry(10, 80, 10);
      const strut = new THREE.Mesh(strutGeo, this.metalTrimMat);
      strut.position.set(Math.cos(sAngle) * 45, 30, Math.sin(sAngle) * 45);
      this.foundationTearTower.add(strut);
    }
    this.midDistanceGroup.add(this.foundationTearTower);
  }

  /* =========================================================================
     9. DEFORMABLE ENERGY SKYBRIDGES (Events 6, 20, 30)
     ========================================================================= */
  private buildEnergySkybridges(): void {
    // 3 luminous bridges connecting tower structures across the sector
    const bridgeConnections = [
      { start: new THREE.Vector3(-380, 180, -950), end: new THREE.Vector3(-550, 120, -1200) },
      { start: new THREE.Vector3(420, 190, -980), end: new THREE.Vector3(620, 140, -1300) },
      { start: new THREE.Vector3(-480, 280, -1350), end: new THREE.Vector3(500, 260, -1750) },
    ];

    bridgeConnections.forEach((conn, idx) => {
      const curve = new THREE.QuadraticBezierCurve3(
        conn.start,
        conn.start.clone().lerp(conn.end, 0.5).add(new THREE.Vector3(0, 15, 0)),
        conn.end
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 5, 8, false);
      const bridgeMesh = new THREE.Mesh(tubeGeo, this.energyBridgeMat);
      bridgeMesh.name = `EnergySkybridge_${idx + 1}`;

      this.energyBridges.push({
        mesh: bridgeMesh,
        originalGeo: tubeGeo.clone(),
        curveP1: conn.start.clone().lerp(conn.end, 0.5),
      });

      this.energyBridgesGroup.add(bridgeMesh);
    });
  }

  /* =========================================================================
     10. PLANETARY OBSERVATION ARRAYS (Events 1, 2, 7, 8, 21)
     ========================================================================= */
  private buildPlanetaryObservationArrays(): void {
    // 6 parabolic tracking dishes mounted on bastions
    const dishCoords = [
      new THREE.Vector3(-620, 180, -1450),
      new THREE.Vector3(-720, 260, -1900),
      new THREE.Vector3(750, 160, -1420),
      new THREE.Vector3(880, 290, -1850),
      new THREE.Vector3(-250, 420, -2250),
      new THREE.Vector3(300, 440, -2300),
    ];

    dishCoords.forEach((coord, idx) => {
      const pylonGeo = new THREE.CylinderGeometry(4, 6, 40, 8);
      const pylon = new THREE.Mesh(pylonGeo, this.metalTrimMat);
      pylon.position.copy(coord);

      const dishGeo = new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3);
      const dishMesh = new THREE.Mesh(dishGeo, this.architecturalMat);
      dishMesh.position.y = 22;
      dishMesh.rotation.x = Math.PI; // initially facing forward
      pylon.add(dishMesh);

      // Warning laser beacon atop dish
      const beaconGeo = new THREE.SphereGeometry(2.5, 8, 8);
      const beacon = new THREE.Mesh(beaconGeo, this.neonAmberMat);
      beacon.position.y = 12;
      dishMesh.add(beacon);
      this.warningBeacons.push(beacon);

      this.observationDishes.push(dishMesh);
      this.observationArraysGroup.add(pylon);
    });
  }

  /* =========================================================================
     11. AUTONOMOUS CIVILIAN TRAFFIC (Event 19)
     ========================================================================= */
  private buildAutonomousCivilianTraffic(): void {
    // Swarm of automated hovercraft and cargo shuttles following orbital highways
    const craftCount = 28;
    const craftGeo = new THREE.ConeGeometry(3, 10, 4);
    craftGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < craftCount; i++) {
      const craftMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xf59e0b,
      });
      const craft = new THREE.Mesh(craftGeo, craftMat);
      const radius = 600 + Math.random() * 800;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.45;

      craft.position.set(
        Math.cos(angle) * radius,
        -50 + Math.random() * 220,
        -1200 + Math.sin(angle) * 350
      );

      this.civilianTrafficVehicles.push({
        mesh: craft,
        speed,
        radius,
        angle,
        chaotic: false,
      });

      this.trafficGroup.add(craft);
    }
  }

  /* =========================================================================
     12. CELESTIAL CONTEXT: MOON & CAPTURED ASTEROID (Events 7, 8, 24)
     ========================================================================= */
  private buildCelestialContext(): void {
    // Celestial Moon for Event 07 (initial position in mid-upper background)
    const moonGeo = new THREE.SphereGeometry(140, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.name = 'CelestialMoon';
    this.moonMesh.position.set(1350, 680, -3800);
    this.distantGroup.add(this.moonMesh);

    // Large Recognizable Asteroid for Events 8 & 24 (diameter 80m)
    this.capturedAsteroidGroup = new THREE.Group();
    this.capturedAsteroidGroup.name = 'CapturedAsteroidGroup';
    this.capturedAsteroidGroup.position.set(1100, 240, -2900);

    const astGeo = new THREE.DodecahedronGeometry(42, 1);
    // Deform vertices for craggy asteroid profile
    const posAttr = astGeo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const deform = 1.0 + (Math.sin(v.x * 0.2) + Math.cos(v.y * 0.25)) * 0.25;
      v.multiplyScalar(deform);
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    astGeo.computeVertexNormals();

    const astMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0xff3b00,
      emissiveIntensity: 0.35,
    });
    this.asteroidMesh = new THREE.Mesh(astGeo, astMat);
    this.capturedAsteroidGroup.add(this.asteroidMesh);
    this.distantGroup.add(this.capturedAsteroidGroup);
  }

  /* =========================================================================
     EVENT REACTION DISPATCHERS (Events 1 to 33)
     ========================================================================= */

  /**
   * Applies active reaction states based on currently executing event
   */
  public applyEventReaction(eventNumber: number, progress: number): void {
    switch (eventNumber) {
      // Event 01: Observation towers detect anomaly; warning patterns
      case 1:
        this.setWarningLightState('AMBER', progress);
        this.rotateTrackingArraysTo(this.blackHolePosition, progress);
        break;

      // Event 02: Tracking arrays lock onto distorted starlight
      case 2:
        this.rotateTrackingArraysTo(this.blackHolePosition, 1.0);
        break;

      // Event 03: Floating platforms slow orbital drift
      case 3:
        this.floatingPlatforms.forEach((p, idx) => {
          p.position.x += Math.sin(progress * Math.PI) * (idx % 2 === 0 ? 0.35 : -0.35);
          p.position.y += Math.cos(progress * Math.PI) * 0.2;
        });
        break;

      // Event 04: Tower windows flicker, electromagnetic sensor intensity
      case 4:
        this.powerSurgeIntensity = Math.sin(progress * 18.0) * 0.5 + 0.5;
        this.setWarningLightState('CYAN_PULSE', progress);
        break;

      // Event 05: Suspended structures shake, energy bridges vibrate
      case 5:
        this.floatingPlatforms.forEach(p => {
          p.position.y += Math.sin(progress * 30.0) * (1.0 - progress) * 2.5;
        });
        break;

      // Event 06: Skybridge physical deformation toward singularity
      case 6:
        this.deformEnergyBridges(progress * 0.85);
        break;

      // Event 07: Moon orbit visibly alters toward collapse region
      case 7:
        this.moonOrbitProgress = Math.min(1.0, this.moonOrbitProgress + 0.08);
        this.moonMesh.position.x = THREE.MathUtils.lerp(1350, 950, this.moonOrbitProgress);
        this.moonMesh.position.z = THREE.MathUtils.lerp(-3800, -3200, this.moonOrbitProgress);
        this.rotateTrackingArraysTo(this.moonMesh.position, progress);
        break;

      // Event 08: Asteroid captured into inward spiral
      case 8:
        this.capturedAsteroidGroup.position.x = 1100 - progress * 280;
        this.capturedAsteroidGroup.position.z = -2900 + progress * 240;
        this.capturedAsteroidGroup.rotation.y += 0.02;
        break;

      // Event 09: Space elevator bends toward singularity (persistent)
      case 9:
        this.elevatorBentAngle = Math.min(0.18, this.elevatorBentAngle + 0.04);
        this.spaceElevatorTower.rotation.z = -this.elevatorBentAngle;
        break;

      // Event 10: Optical ghosting through nebula lensing
      case 10:
        this.starlightLensingGhostActive = true;
        break;

      // Event 11: Orbital ring vibration
      case 11:
        if (this.primaryOrbitalRing) {
          this.primaryOrbitalRing.rotation.z = Math.sin(progress * 24.0) * (1.0 - progress) * 0.04;
        }
        break;

      // Event 12: City power surge across conduits & billboards
      case 12:
        this.powerSurgeIntensity = Math.max(this.powerSurgeIntensity, Math.sin(progress * Math.PI) * 1.5);
        break;

      // Event 13: Power transmission flow reversal
      case 13:
        if (this.energyBridgeMat) {
          this.energyBridgeMat.uniforms.uTime.value -= 0.08; // reversed flow
        }
        break;

      // Event 14: Major research station orbit descent
      case 14:
        if (this.majorResearchStation) {
          this.majorResearchStation.position.y = THREE.MathUtils.lerp(410, 320, progress);
          this.majorResearchStation.position.z = THREE.MathUtils.lerp(-2200, -2500, progress);
          this.setWarningLightState('RED_ALERT', progress);
        }
        break;

      // Event 15: Gravitational shadow passing across civilization
      case 15:
        this.powerSurgeIntensity = -0.7 * (1.0 - Math.abs(progress - 0.5) * 2.0);
        break;

      // Event 16: First visible structural fractures appear on platforms
      case 16:
        this.floatingPlatforms.forEach((p, idx) => {
          if (idx === 0 || idx === 2) {
            p.rotation.z = Math.sin(progress * 8.0) * 0.05;
          }
        });
        break;

      // Event 17: Space skyscraper towers visibly tilt toward singularity
      case 17:
        this.tiltingTowers.forEach((t, idx) => {
          const tiltDir = t.position.x > 0 ? -0.12 : 0.12;
          t.rotation.z = THREE.MathUtils.lerp(t.rotation.z, tiltDir, 0.03);
        });
        break;

      // Event 18: Debris stream formation
      case 18:
        break;

      // Event 19: Orbital traffic navigation chaos
      case 19:
        this.trafficPanic = true;
        this.civilianTrafficVehicles.forEach(v => {
          v.chaotic = true;
        });
        break;

      // Event 20: Gravitational wave front passing through structures
      case 20:
        this.midDistanceGroup.position.y = Math.sin(progress * Math.PI * 4.0) * (1.0 - progress) * 8.0;
        this.deformEnergyBridges(progress);
        break;

      // Event 21: Planetary lensing observation lock
      case 21:
        this.rotateTrackingArraysTo(new THREE.Vector3(1200, -200, -3600), progress);
        break;

      // Event 22: Space dock docking arm tears away
      case 22:
        this.dockArmTorn = true;
        if (this.spaceDockTornArm) {
          this.spaceDockTornArm.position.y -= progress * 40;
          this.spaceDockTornArm.position.z -= progress * 50;
          this.spaceDockTornArm.rotation.x += 0.03;
        }
        break;

      // Event 23: Energy tower upper section breaks away with persistent electrical arcs
      case 23:
        this.energyTowerBroken = true;
        if (this.energyTowerUpperCrown) {
          this.energyTowerUpperCrown.position.y = THREE.MathUtils.lerp(500, 360, progress);
          this.energyTowerUpperCrown.position.x += progress * 1.5;
          this.energyTowerUpperCrown.rotation.z += 0.04;
        }
        if (this.energyTowerArcs) {
          (this.energyTowerArcs.material as THREE.LineBasicMaterial).opacity = Math.random() > 0.3 ? 0.95 : 0.2;
        }
        break;

      // Event 24: Asteroid tidal stretch into spaghettified needle
      case 24:
        if (this.asteroidMesh) {
          const s = 1.0 + progress * 3.2;
          this.asteroidMesh.scale.set(1.0 / Math.sqrt(s), 1.0 / Math.sqrt(s), s);
        }
        break;

      // Event 25: Orbital ring breaks — 400m section detaches inward
      case 25:
        this.ringSectionDetached = true;
        if (this.brokenRingSection) {
          this.brokenRingSection.visible = true;
          this.brokenRingSection.position.y -= progress * 80;
          this.brokenRingSection.position.z -= progress * 120;
          this.brokenRingSection.rotation.z += 0.02;
        }
        break;

      // Event 26: Entire orbital skyline visually curves under global lensing
      case 26:
        this.cityLensingWarp = Math.sin(progress * Math.PI) * 0.35;
        this.midDistanceGroup.rotation.z = this.cityLensingWarp;
        break;

      // Event 27: Space tower optical ghost image reflections
      case 27:
        this.starlightLensingGhostActive = true;
        break;

      // Event 28: Station longitudinal spaghettification
      case 28:
        if (this.majorResearchStation) {
          this.stationLongitudinalStretch = 1.0 + progress * 2.4;
          this.majorResearchStation.scale.set(
            1.0 / Math.sqrt(this.stationLongitudinalStretch),
            1.0 / Math.sqrt(this.stationLongitudinalStretch),
            this.stationLongitudinalStretch
          );
        }
        break;

      // Event 29: Accretion disk plasma storm casting red/orange flares
      case 29:
        this.powerSurgeIntensity = Math.sin(progress * 15.0) * 1.2;
        this.metalTrimMat.emissive.setHex(progress > 0.5 ? 0xff4500 : 0xffaa00);
        break;

      // Event 30: Gravity corridor pulling bridges and traffic
      case 30:
        this.deformEnergyBridges(1.0);
        break;

      // Event 31: Megastructure uncontrolled rotation
      case 31:
        this.megastructureRotating = true;
        this.megastructureRotSpeed = Math.min(0.65, this.megastructureRotSpeed + 0.05);
        break;

      // Event 32: Floating city platforms detach from stabilizers and drift inward
      case 32:
        this.platformSeparated = true;
        this.floatingPlatforms[0].position.z -= progress * 80;
        this.floatingPlatforms[1].position.z -= progress * 60;
        break;

      // Event 33: Space tower foundation tear (End of Part 1 milestone)
      case 33:
        this.foundationTorn = true;
        if (this.foundationTearTower) {
          this.foundationTearTower.position.y += Math.sin(progress * Math.PI) * 20;
          this.foundationTearTower.rotation.z = progress * 0.18;
        }
        this.setWarningLightState('RED_ALERT', 1.0);
        break;

      // =====================================================================
      // PART 2: EVENTS 34 TO 66 (20:06 -> 10:30)
      // =====================================================================

      // Event 34: Communication Array Failure
      case 34:
        this.commArraysDesynchronized = true;
        this.observationDishes.forEach((dish, idx) => {
          dish.rotation.z += Math.sin(progress * 10.0 + idx) * 0.05;
          dish.rotation.x = Math.PI * (0.8 + Math.sin(idx * 2.0) * 0.4);
        });
        this.setWarningLightState('AMBER', progress);
        break;

      // Event 35: Solar Collector Array Collapse
      case 35:
        this.solarCollectorsDetached = true;
        this.powerSurgeIntensity = Math.sin(progress * 12.0) * 0.8;
        break;

      // Event 36: Magnetic Transport Rail Failure
      case 36:
        this.trafficPanic = true;
        this.powerSurgeIntensity = Math.sin(progress * 20.0) * 1.4;
        this.setWarningLightState('RED_ALERT', progress);
        break;

      // Event 37: Secondary Energy Tower Collapse
      case 37:
        this.secondaryEnergyTowerBroken = true;
        if (this.tiltingTowers.length >= 2) {
          this.tiltingTowers[1].rotation.z = THREE.MathUtils.lerp(
            this.tiltingTowers[1].rotation.z,
            -0.22,
            progress
          );
        }
        this.powerSurgeIntensity = 1.6 * (1.0 - progress);
        break;

      // Event 38: Industrial Refinery Detachment
      case 38:
        this.refineryDetached = true;
        if (this.floatingPlatforms.length >= 4) {
          this.floatingPlatforms[3].position.z -= progress * 70;
          this.floatingPlatforms[3].rotation.x += progress * 0.08;
        }
        break;

      // Event 39: Orbital Habitat Ring Compression
      case 39:
        this.habitatTorusOvalDeformed = true;
        if (this.majorResearchStation) {
          const s = 1.0 + progress * 0.45;
          this.majorResearchStation.scale.set(s, 1.0 / s, 1.0);
        }
        break;

      // Event 40: Mining Platform Destabilization
      case 40:
        this.capturedAsteroidGroup.rotation.y += progress * 0.08;
        this.capturedAsteroidGroup.position.z -= progress * 40;
        break;

      // Event 41: Research Outpost Critical Descent
      case 41:
        if (this.majorResearchStation) {
          this.majorResearchStation.position.y -= progress * 90;
          this.majorResearchStation.position.z -= progress * 140;
        }
        this.setWarningLightState('RED_ALERT', progress);
        break;

      // Event 42: Atmospheric Biodome Rupture
      case 42:
        this.biodomeRuptured = true;
        this.domeMat.roughness = THREE.MathUtils.lerp(this.domeMat.roughness, 0.85, progress);
        this.domeMat.opacity = THREE.MathUtils.lerp(0.4, 0.15, progress);
        break;

      // Event 43: Cargo Dock Explosive Decompression
      case 43:
        this.cargoContainersScattered = true;
        if (this.cargoContainers) {
          this.cargoContainers.position.z -= progress * 120;
          this.cargoContainers.rotation.y += progress * 0.25;
        }
        break;

      // Event 44: Defense Satellite Network Decay
      case 44:
        this.warningBeacons.forEach((b, idx) => {
          (b.material as THREE.MeshBasicMaterial).color.setHex(
            idx % 2 === 0 ? 0x00f0ff : 0xff0055
          );
        });
        break;

      // Event 45: Wormhole Stabilizer Failure
      case 45:
        this.wormholePylonsWobbling = true;
        this.powerSurgeIntensity = Math.sin(progress * 25.0) * 1.8;
        break;

      // Event 46: Secondary Orbital Ring Section Failure
      case 46:
        this.secondaryRingSectionDetached = true;
        if (this.primaryOrbitalRing) {
          this.primaryOrbitalRing.rotation.y += progress * 0.04;
          this.primaryOrbitalRing.position.z -= progress * 80;
        }
        break;

      // Event 47: Gravitational Shadow Shift
      case 47:
        this.globalPenumbraOccultation = true;
        this.architecturalMat.roughness = 0.8;
        this.metalTrimMat.emissiveIntensity = 0.08;
        break;

      // Event 48: Suspended District Anchor Cable Tear
      case 48:
        if (this.floatingPlatforms.length >= 2) {
          this.floatingPlatforms[1].rotation.z = Math.sin(progress * Math.PI) * 0.25;
          this.floatingPlatforms[1].position.y -= progress * 45;
        }
        break;

      // Event 49: Hydrocarbon Refinery Ignition
      case 49:
        this.powerSurgeIntensity = 1.4;
        this.metalTrimMat.emissive.setHex(0xff3300);
        this.metalTrimMat.emissiveIntensity = 0.8;
        break;

      // Event 50: Orbital Elevator Mid-Section Collapse
      case 50:
        this.elevatorMidSectionSnapped = true;
        if (this.spaceElevatorTower) {
          this.spaceElevatorTower.rotation.z = -0.35;
          this.spaceElevatorTower.position.y -= progress * 80;
        }
        break;

      // Event 51: Observation Array Structural Shear
      case 51:
        this.observationArraysSheared = true;
        this.observationDishes.forEach(dish => {
          dish.rotation.x = Math.PI * 0.4;
          dish.rotation.z += 0.04;
        });
        break;

      // Event 52: Traffic Network Global Routing Shutdown
      case 52:
        this.trafficPanic = true;
        this.civilianTrafficVehicles.forEach((v, idx) => {
          v.speed *= 0.5;
          v.mesh.position.y += Math.sin(idx + progress * 5.0) * 15;
        });
        break;

      // Event 53: City Energy Skybridge Dissolution
      case 53:
        this.energySkybridgesDissolved = true;
        if (this.energyBridgeMat) {
          this.energyBridgeMat.uniforms.uSurge.value = 0.0;
        }
        this.energyBridges.forEach(b => {
          b.mesh.visible = false;
        });
        break;

      // Event 54: Megastructure Foundation Fracture
      case 54:
        this.megastructureFoundationFractured = true;
        if (this.megastructureBastion) {
          this.megastructureBastion.position.y -= progress * 60;
          this.megastructureBastion.rotation.x += progress * 0.06;
        }
        break;

      // Event 55: Atmospheric Flight Platform Plunge
      case 55:
        this.flightPlatformPlunged = true;
        if (this.floatingPlatforms.length >= 3) {
          this.floatingPlatforms[2].position.y -= progress * 220;
          this.floatingPlatforms[2].position.z -= progress * 160;
        }
        break;

      // Event 56: Research Station Spaghettification Intensification
      case 56:
        if (this.majorResearchStation) {
          this.stationLongitudinalStretch = 3.6;
          this.majorResearchStation.scale.set(
            1.0 / Math.sqrt(this.stationLongitudinalStretch),
            1.0 / Math.sqrt(this.stationLongitudinalStretch),
            this.stationLongitudinalStretch
          );
        }
        break;

      // Event 57: Gravitational Focusing of Stellar Light
      case 57:
        this.starlightLensingGhostActive = true;
        this.cityLensingWarp = 0.65;
        this.midDistanceGroup.rotation.z = this.cityLensingWarp;
        break;

      // Event 58: Power Grid Quadrant Collapse
      case 58:
        this.easternQuadrantBlackout = true;
        if (this.tiltingTowers.length >= 4) {
          // Eastern towers go pitch black
          this.tiltingTowers[2].children.forEach(c => {
            if ((c as THREE.Mesh).material === this.neonCyanMat) {
              (c as THREE.Mesh).visible = false;
            }
          });
          this.tiltingTowers[3].children.forEach(c => {
            if ((c as THREE.Mesh).material === this.neonCyanMat) {
              (c as THREE.Mesh).visible = false;
            }
          });
        }
        break;

      // Event 59: Industrial Fabrication Platform Tear
      case 59:
        if (this.spaceDockShipyard) {
          this.spaceDockShipyard.position.z -= progress * 100;
          this.spaceDockShipyard.rotation.x += progress * 0.12;
        }
        break;

      // Event 60: Orbital Ring Critical Fragmentation
      case 60:
        this.fourSegmentRingBreak = true;
        if (this.primaryOrbitalRing) {
          this.primaryOrbitalRing.position.z -= progress * 150;
          this.primaryOrbitalRing.rotation.z += progress * 0.08;
        }
        break;

      // Event 61: Mid-Way Collapse Crest (12:00 Milestone)
      case 61:
        this.powerSurgeIntensity = 2.0;
        this.setWarningLightState('RED_ALERT', 1.0);
        this.tiltingTowers.forEach(t => {
          t.rotation.z += (Math.random() - 0.5) * 0.08;
        });
        break;

      // Event 62: Residential District Lateral Displacement
      case 62:
        if (this.floatingPlatforms.length >= 1) {
          this.floatingPlatforms[0].position.x += progress * 80;
          this.floatingPlatforms[0].rotation.y += progress * 0.12;
        }
        break;

      // Event 63: Observation Tower Top Section Shear
      case 63:
        if (this.tiltingTowers.length >= 1) {
          this.tiltingTowers[0].rotation.z = -0.28;
          this.tiltingTowers[0].position.y -= progress * 40;
        }
        break;

      // Event 64: Accretion Disk Relativistic Jet Eruption
      case 64:
        this.metalTrimMat.emissive.setHex(0x38bdf8);
        this.metalTrimMat.emissiveIntensity = 1.0;
        this.powerSurgeIntensity = 1.5;
        break;

      // Event 65: Megastructure Inner Ring Deformation
      case 65:
        if (this.megastructureBastion) {
          this.megastructureBastion.scale.set(1.4, 0.7, 1.2);
          this.megastructureBastion.rotation.z += progress * 0.15;
        }
        break;

      // Event 66: Critical Civilization Fragmentation (End of Part 2 Milestone)
      case 66:
        this.globalCivilizationCompromised = true;
        this.setWarningLightState('RED_ALERT', 1.0);
        this.powerSurgeIntensity = 1.8;
        this.tiltingTowers.forEach((t, idx) => {
          t.rotation.z = idx % 2 === 0 ? -0.24 : 0.24;
        });
        break;

      // Event 67: Surviving District Separation
      case 67:
        if (this.floatingPlatforms.length >= 1) {
          this.floatingPlatforms[0].position.z -= progress * 140;
          this.floatingPlatforms[0].position.y -= progress * 70;
        }
        break;

      // Event 68: Orbital Ring Secondary Fracture
      case 68:
        if (this.primaryOrbitalRing) {
          this.primaryOrbitalRing.position.z -= progress * 180;
          this.primaryOrbitalRing.rotation.x += progress * 0.12;
        }
        break;

      // Event 69: Space Elevator Cable Failure
      case 69:
        if (this.spaceElevatorTower) {
          this.spaceElevatorTower.rotation.z = -0.42;
          this.spaceElevatorTower.position.y -= progress * 120;
        }
        break;

      // Event 70: Orbital Highway Breakaway
      case 70:
        this.energyBridges.forEach(b => {
          b.mesh.visible = false;
        });
        break;

      // Event 71: City Core Power Failure
      case 71:
        this.powerSurgeIntensity = -1.0;
        this.architecturalMat.roughness = 0.95;
        this.metalTrimMat.emissiveIntensity = 0.02;
        break;

      // Event 72: Planetary Orbital Distortion
      case 72:
        this.moonMesh.position.x += progress * 120;
        this.moonMesh.scale.multiplyScalar(1.0 + progress * 0.08);
        break;

      // Event 73: Megastructure Tidal Twist
      case 73:
        if (this.megastructureBastion) {
          this.megastructureRotating = false;
          this.megastructureBastion.rotation.z = 0.52;
        }
        break;

      // Event 74: Habitat Cluster Separation
      case 74:
        if (this.floatingPlatforms.length >= 2) {
          this.floatingPlatforms[1].position.x -= progress * 120;
          this.floatingPlatforms[1].position.z -= progress * 140;
        }
        break;

      // Event 75: Gravity Lensing Surge
      case 75:
        this.starlightLensingGhostActive = true;
        this.cityLensingWarp = 1.15;
        this.midDistanceGroup.rotation.z = this.cityLensingWarp;
        break;

      // Event 76: Orbital Docking Collapse
      case 76:
        if (this.spaceDockShipyard) {
          this.spaceDockShipyard.position.y -= progress * 160;
          this.spaceDockShipyard.rotation.z += progress * 0.18;
        }
        break;

      // Event 77: Industrial District Breakup
      case 77:
        if (this.floatingPlatforms.length >= 4) {
          this.floatingPlatforms[3].position.z -= progress * 240;
          this.floatingPlatforms[3].rotation.y += progress * 0.22;
        }
        break;

      // Event 78: Gravity Wave Interference
      case 78:
        this.midDistanceGroup.position.y = Math.sin(progress * Math.PI * 8.0) * (1.0 - progress) * 12.0;
        break;

      // Event 79: Surviving Traffic Evacuation
      case 79:
        this.civilianTrafficVehicles.forEach(v => {
          v.mesh.visible = false;
        });
        break;

      // Event 80: Research Complex Tear
      case 80:
        if (this.majorResearchStation) {
          this.majorResearchStation.position.y -= progress * 180;
          this.majorResearchStation.rotation.x += progress * 0.25;
        }
        break;

      // Event 81: Six-Minute Critical Threshold
      case 81:
        this.setWarningLightState('RED_ALERT', 1.0);
        this.powerSurgeIntensity = 2.2;
        break;

      // Event 82: Orbital Stabilizer Chain Failure
      case 82:
        this.warningBeacons.forEach(b => {
          (b.material as THREE.MeshBasicMaterial).color.setHex(0x330000);
        });
        break;

      // Event 83: Energy Network Collapse
      case 83:
        this.metalTrimMat.emissiveIntensity = 0.0;
        break;

      // Event 84: Orbital Observation Array Disintegration
      case 84:
        this.observationDishes.forEach(d => {
          d.visible = false;
        });
        break;

      // Event 85: City Platform Tidal Stretch
      case 85:
        if (this.floatingPlatforms.length >= 1) {
          this.floatingPlatforms[0].scale.set(0.65, 0.65, 2.8);
        }
        break;

      // Event 86: Megastructure Section Loss
      case 86:
        if (this.megastructureBastion) {
          this.megastructureBastion.scale.set(0.65, 0.65, 0.65);
        }
        break;

      // Event 87: Debris Orbital Cascade
      case 87:
        break;

      // Event 88: Planetary Lensing Break
      case 88:
        this.starlightLensingGhostActive = true;
        break;

      // Event 89: Surviving Spaceport Failure
      case 89:
        if (this.floatingPlatforms.length >= 3) {
          this.floatingPlatforms[2].position.y -= progress * 240;
        }
        break;

      // Event 90: Orbital Civilization Tilt
      case 90:
        this.tiltingTowers.forEach(t => {
          t.rotation.z = -0.44;
        });
        break;

      // Event 91: Three-Minute Critical State
      case 91:
        this.setWarningLightState('RED_ALERT', 1.0);
        break;

      // Event 92: Final Communication Loss
      case 92:
        break;

      // Event 93: Final Orbital Ring Movement
      case 93:
        if (this.primaryOrbitalRing) {
          this.primaryOrbitalRing.position.z -= progress * 350;
        }
        break;

      // Event 94: Final Power District Failure
      case 94:
        this.powerSurgeIntensity = 0.0;
        break;

      // Event 95: Major Structural Separation
      case 95:
        if (this.foundationTearTower) {
          this.foundationTearTower.position.y -= progress * 160;
          this.foundationTearTower.rotation.z = 0.32;
        }
        break;

      // Event 96: Gravitational Dominance
      case 96:
        if (this.majorResearchStation) {
          this.majorResearchStation.scale.set(0.3, 0.3, 4.5);
        }
        break;

      // Event 97: Civilization Breakup
      case 97:
        this.floatingPlatforms.forEach((p, idx) => {
          p.position.y -= progress * (150 + idx * 40);
        });
        break;

      // Event 98: Final Orbital Fall
      case 98:
        this.tiltingTowers.forEach((t, idx) => {
          t.position.y -= progress * (180 + idx * 30);
          t.position.z -= progress * 120;
        });
        break;

      // Event 99: Last Surviving Structures
      case 99:
        // Solitary landmarks remain silhouetted against black hole
        if (this.spaceElevatorTower) this.spaceElevatorTower.position.y = -120;
        break;

      // Event 100: Final Collapse State Transition
      case 100:
        this.globalCivilizationCompromised = true;
        this.setWarningLightState('RED_ALERT', 1.0);
        break;

      default:
        break;
    }
  }

  /**
   * Physically deforms energy skybridge curves toward the central singularity
   */
  private deformEnergyBridges(strength: number): void {
    this.energyBridges.forEach(bridge => {
      const posAttr = bridge.mesh.geometry.attributes.position as THREE.BufferAttribute;
      const origAttr = bridge.originalGeo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();

      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(origAttr, i);
        // Pull downward and inward toward black hole
        v.y -= strength * 35.0 * Math.sin((v.x / 500) * Math.PI);
        v.z -= strength * 60.0;
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      posAttr.needsUpdate = true;
    });
  }

  /**
   * Sets color/intensity of tracking beacons and tower warning lighting
   */
  private setWarningLightState(mode: 'AMBER' | 'RED_ALERT' | 'CYAN_PULSE', t: number): void {
    const isAmber = mode === 'AMBER';
    const isRed = mode === 'RED_ALERT';
    const blink = Math.sin(t * 12.0) > 0;

    this.warningBeacons.forEach(b => {
      (b.material as THREE.MeshBasicMaterial).color.setHex(
        isRed ? (blink ? 0xff0000 : 0x550000) : isAmber ? 0xf59e0b : 0x00f0ff
      );
    });
  }

  /**
   * Points observation dishes toward a designated target vector
   */
  private rotateTrackingArraysTo(targetPos: THREE.Vector3, progress: number): void {
    this.observationDishes.forEach(dish => {
      dish.lookAt(targetPos);
      dish.rotateX(Math.PI / 2); // align parabolic dish face
    });
  }

  /**
   * Per-frame animation update for persistent structures
   */
  public update(dt: number): void {
    const delta = Math.max(0, Math.min(dt, 0.25));

    // Update energy skybridges shader
    if (this.energyBridgeMat) {
      this.energyBridgeMat.uniforms.uTime.value += delta;
      this.energyBridgeMat.uniforms.uSurge.value = THREE.MathUtils.lerp(
        this.energyBridgeMat.uniforms.uSurge.value,
        Math.max(0, this.powerSurgeIntensity),
        0.08
      );
    }

    // Update holographic billboards
    if (this.holoBillboardMat) {
      this.holoBillboardMat.uniforms.uTime.value += delta;
      this.holoBillboardMat.uniforms.uFlicker.value = THREE.MathUtils.lerp(
        this.holoBillboardMat.uniforms.uFlicker.value,
        Math.max(0, this.powerSurgeIntensity),
        0.1
      );
    }

    // Uncontrolled megastructure rotation if triggered in Event 31
    if (this.megastructureRotating && this.megastructureBastion) {
      this.megastructureBastion.rotation.z += delta * this.megastructureRotSpeed;
    }

    // Civilian traffic update
    this.civilianTrafficVehicles.forEach(v => {
      if (v.chaotic) {
        v.angle += delta * v.speed * 2.2;
        v.mesh.position.x = Math.cos(v.angle) * v.radius + Math.sin(v.angle * 3.0) * 40;
        v.mesh.position.y += Math.sin(v.angle * 5.0) * 0.8;
        v.mesh.rotation.z += delta * 2.0;
      } else {
        v.angle += delta * v.speed;
        v.mesh.position.x = Math.cos(v.angle) * v.radius;
        v.mesh.position.z = -1200 + Math.sin(v.angle) * 350;
      }
    });

    // Slow rotation of massive orbital ring
    if (this.primaryOrbitalRing) {
      this.primaryOrbitalRing.rotation.z += delta * 0.015;
    }

    // =========================================================================
    // PERSISTENT ACCUMULATED DAMAGE STATES (Events 9, 22, 23, 25, 28, 31, 32, 33)
    // =========================================================================
    // 1. Persistent Space Elevator Bend (Event 9)
    if (this.elevatorBentAngle > 0 && this.spaceElevatorTower) {
      this.spaceElevatorTower.rotation.z = -this.elevatorBentAngle;
    }

    // 2. Persistent Space Dock Torn Arm (Event 22)
    if (this.dockArmTorn && this.spaceDockTornArm) {
      this.spaceDockTornArm.rotation.x += delta * 0.04;
    }

    // 3. Persistent Broken Energy Spire & Electric Arcs (Event 23)
    if (this.energyTowerBroken && this.energyTowerArcs) {
      (this.energyTowerArcs.material as THREE.LineBasicMaterial).opacity =
        Math.random() > 0.35 ? 0.95 : 0.2;
    }

    // 4. Persistent Broken Orbital Ring Section (Event 25)
    if (this.ringSectionDetached && this.brokenRingSection) {
      this.brokenRingSection.visible = true;
      this.brokenRingSection.rotation.z += delta * 0.02;
    }

    // 5. Persistent Station Longitudinal Spaghettification (Event 28)
    if (this.stationLongitudinalStretch > 1.0 && this.majorResearchStation) {
      this.majorResearchStation.scale.set(
        1.0 / Math.sqrt(this.stationLongitudinalStretch),
        1.0 / Math.sqrt(this.stationLongitudinalStretch),
        this.stationLongitudinalStretch
      );
    }

    // 6. Persistent Uncontrolled Megastructure Bastion Spin (Event 31)
    if (this.megastructureRotating && this.megastructureBastion) {
      this.megastructureBastion.rotation.z += delta * this.megastructureRotSpeed;
    }

    // 7. Persistent Detached Floating City Platforms Inward Drift (Event 32)
    if (this.platformSeparated && this.floatingPlatforms.length >= 2) {
      this.floatingPlatforms[0].position.z -= delta * 6.0;
      this.floatingPlatforms[1].position.z -= delta * 4.0;
    }

    // 8. Persistent Space Tower Foundation Tear (Event 33)
    if (this.foundationTorn && this.foundationTearTower) {
      this.foundationTearTower.rotation.z = 0.18;
    }

    // =========================================================================
    // PART 2 PERSISTENT ACCUMULATED DAMAGE (Events 34–66)
    // =========================================================================

    // 9. Persistent Comm Array Desync (Event 34)
    if (this.commArraysDesynchronized) {
      this.observationDishes.forEach((dish, idx) => {
        dish.rotation.z += delta * (idx % 2 === 0 ? 0.02 : -0.015);
      });
    }

    // 10. Persistent Secondary Energy Tower Lean (Event 37)
    if (this.secondaryEnergyTowerBroken && this.tiltingTowers.length >= 2) {
      this.tiltingTowers[1].rotation.z = -0.22;
    }

    // 11. Persistent Industrial Refinery Drift (Event 38)
    if (this.refineryDetached && this.floatingPlatforms.length >= 4) {
      this.floatingPlatforms[3].position.z -= delta * 3.5;
    }

    // 12. Persistent Habitat Torus Oval Distortion (Event 39)
    if (this.habitatTorusOvalDeformed && this.majorResearchStation) {
      this.majorResearchStation.rotation.y += delta * 0.05;
    }

    // 13. Persistent Shattered Biodome Fog (Event 42)
    if (this.biodomeRuptured) {
      this.domeMat.roughness = 0.85;
      this.domeMat.opacity = 0.2;
    }

    // 14. Persistent Cargo Scatter Drift (Event 43)
    if (this.cargoContainersScattered && this.cargoContainers) {
      this.cargoContainers.position.z -= delta * 4.0;
      this.cargoContainers.rotation.y += delta * 0.02;
    }

    // 15. Persistent Wormhole Gate Wobble (Event 45)
    if (this.wormholePylonsWobbling) {
      this.powerSurgeIntensity = Math.max(0.4, this.powerSurgeIntensity);
    }

    // 16. Persistent Snapped Space Elevator Shaft (Event 50)
    if (this.elevatorMidSectionSnapped && this.spaceElevatorTower) {
      this.spaceElevatorTower.rotation.z = -0.35;
    }

    // 17. Persistent Sheared Observation Disarray (Event 51)
    if (this.observationArraysSheared) {
      this.observationDishes.forEach(dish => {
        dish.rotation.x = Math.PI * 0.4;
      });
    }

    // 18. Persistent Dissolved Skybridges (Event 53)
    if (this.energySkybridgesDissolved) {
      this.energyBridges.forEach(b => {
        b.mesh.visible = false;
      });
    }

    // 19. Persistent Plunged Flight Platform (Event 55)
    if (this.flightPlatformPlunged && this.floatingPlatforms.length >= 3) {
      this.floatingPlatforms[2].position.y -= delta * 2.0;
      this.floatingPlatforms[2].position.z -= delta * 4.0;
    }

    // 20. Persistent Eastern Sector Blackout (Event 58)
    if (this.easternQuadrantBlackout && this.tiltingTowers.length >= 4) {
      this.tiltingTowers[2].children.forEach(c => {
        if ((c as THREE.Mesh).material === this.neonCyanMat) {
          (c as THREE.Mesh).visible = false;
        }
      });
      this.tiltingTowers[3].children.forEach(c => {
        if ((c as THREE.Mesh).material === this.neonCyanMat) {
          (c as THREE.Mesh).visible = false;
        }
      });
    }

    // 21. Persistent Quad-Segment Ring Break (Event 60)
    if (this.fourSegmentRingBreak && this.primaryOrbitalRing) {
      this.primaryOrbitalRing.rotation.z += delta * 0.01;
    }

    // 22. Persistent Critical Civilization Fragmentation (Event 66)
    if (this.globalCivilizationCompromised) {
      this.tiltingTowers.forEach((t, idx) => {
        t.rotation.z = idx % 2 === 0 ? -0.24 : 0.24;
      });
    }
  }

  /**
   * Mobile & Graphics Quality Scaling (LOW, MEDIUM, HIGH, ULTRA)
   */
  public setQuality(quality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'): void {
    const isLow = quality === 'LOW';
    // Reduce traffic vehicle instances on low/mobile
    const activeTraffic = isLow ? 10 : quality === 'MEDIUM' ? 18 : 28;
    this.civilianTrafficVehicles.forEach((v, idx) => {
      v.mesh.visible = idx < activeTraffic;
    });

    if (isLow) {
      this.domeMat.roughness = 0.45;
      this.holographicBillboards.forEach(b => (b.visible = false));
    } else {
      this.domeMat.roughness = 0.1;
      this.holographicBillboards.forEach(b => (b.visible = true));
    }
  }

  /**
   * Clean memory disposal
   */
  public dispose(): void {
    this.architecturalMat.dispose();
    this.metalTrimMat.dispose();
    this.neonCyanMat.dispose();
    this.neonAmberMat.dispose();
    this.neonRedAlertMat.dispose();
    this.energyBridgeMat.dispose();
    this.holoBillboardMat.dispose();
    this.domeMat.dispose();

    this.scene.remove(this.root);
  }
}
