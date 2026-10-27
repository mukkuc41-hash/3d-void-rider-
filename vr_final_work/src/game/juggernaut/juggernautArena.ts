/**
 * VOID-RIDER 3D — JUGGERNAUT COMBAT ARENA: PHYSICAL CIRCULAR PLATFORM
 * 
 * A massive, physically solid, continuous 3D circular combat platform:
 * - Wide circular floor (radius 1450m) with a clearly visible flat upper surface (deckElevation = 0)
 * - Substantial vertical thickness (65m thick disk from y=0 to y=-65) with visible beveled side walls
 * - Detailed metallic armored surface with concentric floor sections, mechanical panel divisions,
 *   and embedded faction energy strips (Titan Crimson north, Swarm Cyan south)
 * - Distinct reinforced outer armor rim (radius 1380-1485m) with perimeter hazard chevrons and warning lights
 * - Multi-source PBR lighting with dramatic specular glints, shadows, and depth
 * - Real physical collision: ships fly freely in 3D above the deck, but cannot penetrate downwards
 *   through the solid platform; falling past the platform edge triggers edge warnings and recovery
 * - Clean open combat airspace: no scattered random cubes blocking starting positions
 */
import * as THREE from 'three';

export interface ArenaObstacle {
  id: string;
  position: THREE.Vector3;
  radius: number;
  height: number;
  mesh: THREE.Object3D;
  isRotating?: boolean;
  rotationSpeed?: number;
}

export interface PlatformCollisionResult {
  onPlatform: boolean;
  isSurfaceContact: boolean;
  isNearEdge: boolean;
  isFallingOff: boolean;
  distanceToEdge: number;
  altitudeAboveDeck: number;
}

export class JuggernautArena {
  public arenaGroup: THREE.Group;
  
  // Platform Dimensions
  public readonly platformRadius: number = 1450;
  public readonly deckElevation: number = 0;
  public readonly platformThickness: number = 65; // y=0 to y=-65
  public readonly rimRadius: number = 1485;
  
  // Arena Boundaries
  public baseRadius: number = 1500;
  public currentRadius: number = 1500;
  public minRadius: number = 800;
  public maxVerticalLimit: number = 420;
  public minFallLimit: number = -350;

  // Visual Meshes
  private mainPlatformMesh: THREE.Mesh | null = null;
  private boundaryMesh: THREE.Mesh | null = null;
  private boundaryMaterial: THREE.MeshBasicMaterial | null = null;
  private rimGlowRing: THREE.Mesh | null = null;
  private rotatingParts: THREE.Group[] = [];
  public obstacles: ArenaObstacle[] = [];

  // Lighting
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private titanLight: THREE.DirectionalLight | null = null;
  private swarmLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  constructor() {
    this.arenaGroup = new THREE.Group();
    this.arenaGroup.name = 'juggernaut_combat_arena';
  }

  public buildArena(scene: THREE.Scene, mode: 'APEX_PREDATOR' | 'SWARM_HUNT') {
    this.arenaGroup.clear();
    this.rotatingParts = [];
    this.obstacles = [];
    this.currentRadius = this.baseRadius;

    // 1. High-Clarity Multi-Angle PBR Lighting (ensures deck, bevels & side walls are fully visible)
    this.buildLighting();

    // 2. Massive, Physically Solid Circular Combat Platform (thick 3D disk, not a thin line)
    this.buildSolidCircularPlatform();

    // 3. Clear Visible Perimeter Forcefield & Outer Navigation Beacons
    this.buildBoundaryAndBeacons();

    // 4. Distant Spanning Megastructures (outside combat boundary at r=1750m)
    this.buildDistantMegastructures();

    // 5. Deep Space Celestial Horizon & Gas Giant Backdrop
    this.buildCosmicBackdrop();

    scene.add(this.arenaGroup);
  }

  /**
   * 1. Multi-source PBR lighting engineered for tangible physical depth and surface metallics
   */
  private buildLighting() {
    // Ambient fill so shadows maintain visible mechanical detail
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    this.arenaGroup.add(this.ambientLight);

    // Hemisphere light creating crisp sky-reflection vs dark-space contrast
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 1.5);
    this.arenaGroup.add(this.hemiLight);

    // Primary Solar Key Light from high azimuth: creates sharp glints on metallic floor panels
    this.keyLight = new THREE.DirectionalLight(0xf8fafc, 2.5);
    this.keyLight.position.set(700, 1500, 500);
    this.arenaGroup.add(this.keyLight);

    // Cool secondary fill light from opposite angle to reveal side wall thickness
    this.fillLight = new THREE.DirectionalLight(0x1d4ed8, 1.4);
    this.fillLight.position.set(-800, 400, -800);
    this.arenaGroup.add(this.fillLight);

    // Titan Faction Key Light (Intense Crimson/Amber from North Sector)
    this.titanLight = new THREE.DirectionalLight(0xff2a4d, 2.2);
    this.titanLight.position.set(0, 350, -1300);
    this.arenaGroup.add(this.titanLight);

    // Swarm Faction Key Light (Electric Cyan from South Sector)
    this.swarmLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
    this.swarmLight.position.set(0, 350, 1300);
    this.arenaGroup.add(this.swarmLight);
  }

  /**
   * 2. Build the physical solid 3D circular platform:
   * - Continuous 3D solid cylinder (radius 1450m, thickness 65m)
   * - Flat top surface at y = 0
   * - Beveled outward side walls extending down to y = -65
   * - Concentric floor plates, radial panel seams, embedded energy trenches
   * - Reinforced heavy armor outer rim with hazard chevrons and glowing neon edge
   * - Under-chassis structural I-beams and anti-gravity repulsor nacelles
   */
  private buildSolidCircularPlatform() {
    const platformGroup = new THREE.Group();
    platformGroup.name = 'solid_circular_platform';

    // ----------------------------------------------------
    // A. Main Solid Cylinder Body: radius 1450 top, 1480 bottom, height 65
    // Centered at y = -32.5 so the top surface sits exactly at y = 0!
    // ----------------------------------------------------
    const mainBodyGeo = new THREE.CylinderGeometry(
      this.platformRadius,
      this.rimRadius - 5,
      this.platformThickness,
      96,
      4,
      false
    );
    const mainBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.88,
      roughness: 0.32,
      flatShading: false,
    });
    this.mainPlatformMesh = new THREE.Mesh(mainBodyGeo, mainBodyMat);
    this.mainPlatformMesh.position.set(0, -this.platformThickness / 2, 0);
    platformGroup.add(this.mainPlatformMesh);

    // ----------------------------------------------------
    // B. Detailed Concentric Floor Sections on the Upper Deck (y = 0.2 to 1.5)
    // ----------------------------------------------------

    // 1. Central Reactor Core Hub (r = 0 to 280)
    const centerHubGeo = new THREE.CylinderGeometry(280, 290, 2.0, 64);
    const centerHubMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.25,
    });
    const centerHub = new THREE.Mesh(centerHubGeo, centerHubMat);
    centerHub.position.set(0, 1.0, 0);
    platformGroup.add(centerHub);

    // Central Core Aperture Generator Ring
    const apertureRingGeo = new THREE.TorusGeometry(120, 12, 16, 64);
    const apertureRingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const apertureRing = new THREE.Mesh(apertureRingGeo, apertureRingMat);
    apertureRing.rotation.x = Math.PI / 2;
    apertureRing.position.set(0, 2.2, 0);
    platformGroup.add(apertureRing);

    // Central Pulsing Energy Core Disk
    const coreDiskGeo = new THREE.CircleGeometry(110, 48);
    const coreDiskMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const coreDisk = new THREE.Mesh(coreDiskGeo, coreDiskMat);
    coreDisk.rotation.x = Math.PI / 2;
    coreDisk.position.set(0, 2.3, 0);
    platformGroup.add(coreDisk);

    // 2. Concentric Armor Floor Plates (r = 300 to 1350)
    const plateBands = [
      { rInner: 300, rOuter: 550, color: 0x111827, height: 0.4 },
      { rInner: 570, rOuter: 880, color: 0x0f172a, height: 0.3 },
      { rInner: 900, rOuter: 1180, color: 0x131d33, height: 0.3 },
      { rInner: 1200, rOuter: 1380, color: 0x0e1626, height: 0.4 },
    ];

    plateBands.forEach((band) => {
      const ringGeo = new THREE.RingGeometry(band.rInner, band.rOuter, 80, 2);
      const ringMat = new THREE.MeshStandardMaterial({
        color: band.color,
        metalness: 0.85,
        roughness: 0.35,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, band.height, 0);
      platformGroup.add(ring);
    });

    // 3. Embedded Glowing Energy Trenches (Concentric glowing rings)
    const energyRings = [
      { radius: 295, color: 0x38bdf8, width: 4 },
      { radius: 560, color: 0x00e5ff, width: 5 },
      { radius: 890, color: 0xf59e0b, width: 5 },
      { radius: 1190, color: 0xef4444, width: 6 },
    ];

    energyRings.forEach((er) => {
      const gGeo = new THREE.RingGeometry(er.radius - er.width / 2, er.radius + er.width / 2, 72);
      const gMat = new THREE.MeshBasicMaterial({
        color: er.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const gMesh = new THREE.Mesh(gGeo, gMat);
      gMesh.rotation.x = Math.PI / 2;
      gMesh.position.set(0, 0.5, 0);
      platformGroup.add(gMesh);
    });

    // 4. Radial Mechanical Panel Divisions & Runway Seams (32 radial dividing strips)
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const isNorthTitan = Math.sin(angle) < 0; // Negative Z is North / Titan citadel
      const seamGeo = new THREE.PlaneGeometry(3.5, 1080);
      const seamMat = new THREE.MeshBasicMaterial({
        color: isNorthTitan ? 0xff2244 : 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      });
      const seam = new THREE.Mesh(seamGeo, seamMat);
      seam.rotation.x = Math.PI / 2;
      seam.rotation.z = angle;
      const midR = 840;
      seam.position.set(Math.cos(angle) * midR, 0.6, Math.sin(angle) * midR);
      platformGroup.add(seam);
    }

    // ----------------------------------------------------
    // C. Reinforced Outer Armor Rim & Bullwark Collar (r = 1380 to 1485)
    // ----------------------------------------------------

    // Heavy Beveled Outer Collar Ring
    const collarGeo = new THREE.CylinderGeometry(1485, 1495, 20, 96, 1, false);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.2,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, -10, 0);
    platformGroup.add(collarMesh);

    // Platform Outer Edge Caution Warning Strip (Bright neon amber/red border ring)
    const edgeWarnGeo = new THREE.RingGeometry(this.platformRadius - 12, this.platformRadius, 96);
    const edgeWarnMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.rimGlowRing = new THREE.Mesh(edgeWarnGeo, edgeWarnMat);
    this.rimGlowRing.rotation.x = Math.PI / 2;
    this.rimGlowRing.position.set(0, 0.7, 0);
    platformGroup.add(this.rimGlowRing);

    // 24 Heavy Structural Clamps / Armored Buttresses around the rim perimeter
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const clampGroup = new THREE.Group();
      const clampX = Math.cos(angle) * (this.platformRadius + 8);
      const clampZ = Math.sin(angle) * (this.platformRadius + 8);

      clampGroup.position.set(clampX, -15, clampZ);
      clampGroup.rotation.y = -angle;

      // Heavy radial rib arm spanning down the vertical cliff
      const ribGeo = new THREE.CylinderGeometry(12, 18, 55, 8);
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0x0a0f1d,
        metalness: 0.9,
        roughness: 0.3,
      });
      const rib = new THREE.Mesh(ribGeo, ribMat);
      clampGroup.add(rib);

      // Warning Strobe Beacon on each outer rim buttress
      const strobeGeo = new THREE.SphereGeometry(4, 8, 8);
      const isTitanSector = clampZ < 0;
      const strobeMat = new THREE.MeshBasicMaterial({
        color: isTitanSector ? 0xff0044 : 0x00e5ff,
      });
      const strobe = new THREE.Mesh(strobeGeo, strobeMat);
      strobe.position.set(0, 24, 0);
      clampGroup.add(strobe);

      platformGroup.add(clampGroup);
    }

    // ----------------------------------------------------
    // D. Under-Chassis Structural Keels & Anti-Grav Thruster Nacelles
    // Visible when looking down off the edge or flying low
    // ----------------------------------------------------
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const keelGroup = new THREE.Group();
      keelGroup.rotation.y = angle;

      // Massive I-Beam truss beneath the platform deck
      const trussGeo = new THREE.CylinderGeometry(8, 12, 600, 8);
      const trussMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.9,
        roughness: 0.4,
      });
      const truss = new THREE.Mesh(trussGeo, trussMat);
      truss.rotation.z = Math.PI / 2;
      truss.position.set(800, -85, 0);
      keelGroup.add(truss);

      // Anti-Gravity Ion Repulsor Nacelle
      const thrusterGeo = new THREE.CylinderGeometry(25, 35, 30, 16);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
      });
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      thruster.position.set(1100, -90, 0);
      keelGroup.add(thruster);

      platformGroup.add(keelGroup);
    }

    this.arenaGroup.add(platformGroup);
  }

  /**
   * 3. Clear Visible Perimeter Forcefield & Outer Boundary Navigation Buoys
   */
  private buildBoundaryAndBeacons() {
    // Clear forcefield boundary cylinder (radius 1500, height 840)
    const boundGeo = new THREE.CylinderGeometry(
      this.currentRadius,
      this.currentRadius,
      this.maxVerticalLimit * 2,
      48,
      2,
      true
    );
    this.boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.20,
      side: THREE.DoubleSide,
    });
    this.boundaryMesh = new THREE.Mesh(boundGeo, this.boundaryMaterial);
    this.boundaryMesh.position.set(0, 0, 0);
    this.arenaGroup.add(this.boundaryMesh);

    // 24 Glowing Vertical Neon Pillars along the perimeter boundary
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x = Math.cos(angle) * this.currentRadius;
      const z = Math.sin(angle) * this.currentRadius;
      const isTitanSector = z < 0;

      const colGeo = new THREE.CylinderGeometry(2.5, 2.5, this.maxVerticalLimit * 2, 8);
      const colMat = new THREE.MeshBasicMaterial({
        color: isTitanSector ? 0xff2244 : 0x00f0ff,
        transparent: true,
        opacity: 0.85,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 0, z);
      this.arenaGroup.add(col);
    }
  }

  /**
   * 4. Distant Anchor Megastructures (OUTSIDE the flight zone at radius 1750m)
   */
  private buildDistantMegastructures() {
    const gantryPositions = [
      { x: 0, z: -1750, rotY: 0, color: 0xff1744, label: 'TITAN CITADEL DOCK' },
      { x: 1750, z: 0, rotY: Math.PI / 2, color: 0x38bdf8, label: 'EAST STATION ALPHA' },
      { x: 0, z: 1750, rotY: Math.PI, color: 0x00e5ff, label: 'SWARM COMM RELAY' },
      { x: -1750, z: 0, rotY: -Math.PI / 2, color: 0xa855f7, label: 'WEST REFUEL PLATFORM' },
    ];

    gantryPositions.forEach((gp) => {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(gp.x, 0, gp.z);
      gantryGroup.rotation.y = gp.rotY;

      // Primary Spine Spire (480m tall)
      const towerGeo = new THREE.CylinderGeometry(28, 45, 520, 16);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.25,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      gantryGroup.add(tower);

      // Docking Ring on tower
      const armGeo = new THREE.TorusGeometry(55, 8, 12, 32);
      const armMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.3,
        emissive: gp.color,
        emissiveIntensity: 0.45,
      });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0, 140, 0);
      gantryGroup.add(arm);

      this.rotatingParts.push(arm as any);
      this.arenaGroup.add(gantryGroup);
    });
  }

  /**
   * 5. Dense Celestial Starfield & Distant Gas Giant Planet
   */
  private buildCosmicBackdrop() {
    const starCount = 3200;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3500 + Math.random() * 4000;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const starType = Math.random();
      if (starType > 0.7) {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0; // Cyan
      } else if (starType > 0.4) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.8; // Gold
      } else if (starType > 0.2) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.3; // Titan Red
      } else {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.45; colors[i * 3 + 2] = 1.0; // Violet
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const starField = new THREE.Points(starGeo, starMat);
    this.arenaGroup.add(starField);

    // Distant Gas Giant Planet
    const planetGeo = new THREE.SphereGeometry(650, 32, 32);
    const planetMat = new THREE.MeshBasicMaterial({
      color: 0x1e1b4b,
      wireframe: true,
      transparent: true,
      opacity: 0.30,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(3000, -500, -3400);
    this.arenaGroup.add(planet);

    // Planetary Ring
    const pRingGeo = new THREE.RingGeometry(900, 1500, 64);
    const pRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const pRing = new THREE.Mesh(pRingGeo, pRingMat);
    pRing.rotation.x = Math.PI / 2.6;
    pRing.position.copy(planet.position);
    this.arenaGroup.add(pRing);
  }

  /**
   * Dynamic frame updates: boundary pulse & slow orbital rotation
   */
  public update(deltaSeconds: number, shrinkProgress: number = 0) {
    this.rotatingParts.forEach((part, idx) => {
      part.rotation.z += deltaSeconds * (0.25 * (idx % 2 === 0 ? 1 : -1));
    });

    // Subtle edge warning pulse
    if (this.rimGlowRing && this.rimGlowRing.material) {
      const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
      (this.rimGlowRing.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    if (this.boundaryMaterial) {
      this.boundaryMaterial.opacity = 0.20 + 0.08 * Math.sin(Date.now() * 0.003);
    }
  }

  /**
   * REAL PHYSICAL PLATFORM COLLISION ENGINE
   * 
   * 1. While within platform horizontal footprint (r <= platformRadius):
   *    - The deck is a solid, impenetrable surface at deckElevation (y = 0).
   *    - Ships cannot penetrate below deckElevation + shipRadius.
   *    - Downward velocity is absorbed with a stable, kinetic bounce.
   * 
   * 2. When flying beyond the platform edge (r > platformRadius):
   *    - There is no floor beneath the ship; they can fall or fly off the edge!
   *    - If colliding with the vertical side wall cliff (-65 <= y <= 0), push out.
   *    - If falling below the platform (y < -50), trigger edge altitude loss telemetry.
   *    - Deep fall recovery repulsors engage below y = -180.
   */
  public checkPlatformCollision(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    shipRadius: number = 10,
    dt: number = 0.016
  ): PlatformCollisionResult {
    const horizDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const distToEdge = this.platformRadius - horizDist;
    const isNearEdge = distToEdge >= 0 && distToEdge <= 160;
    const isOverPlatform = horizDist <= this.platformRadius;
    const altitudeAboveDeck = pos.y - this.deckElevation;

    let onPlatform = false;
    let isSurfaceContact = false;
    let isFallingOff = false;

    if (isOverPlatform) {
      // ----------------------------------------------------
      // CASE A: ABOVE THE SOLID PLATFORM
      // ----------------------------------------------------
      const minSafeY = this.deckElevation + shipRadius;

      if (pos.y < minSafeY) {
        // Physical surface collision: prevent ship from passing through the solid deck
        pos.y = minSafeY;
        isSurfaceContact = true;
        onPlatform = true;

        if (vel.y < 0) {
          // Stable kinetic rebound: damp vertical speed and apply surface friction
          vel.y = Math.min(22, -vel.y * 0.25);
          vel.x *= 0.96;
          vel.z *= 0.96;
        }
      } else {
        onPlatform = true;
      }
    } else {
      // ----------------------------------------------------
      // CASE B: BEYOND THE PLATFORM EDGE (OFF-DECK AIRSPACE)
      // ----------------------------------------------------
      const sideWallTop = this.deckElevation;
      const sideWallBottom = this.deckElevation - this.platformThickness;

      // 1. Check side wall collision if trying to re-enter through the vertical cliff
      if (pos.y <= sideWallTop && pos.y >= sideWallBottom) {
        if (horizDist < this.platformRadius + shipRadius) {
          // Push ship out radially past the side wall
          const angle = Math.atan2(pos.z, pos.x);
          const pushR = this.platformRadius + shipRadius;
          pos.x = Math.cos(angle) * pushR;
          pos.z = Math.sin(angle) * pushR;

          // Push outward velocity
          const normalX = Math.cos(angle);
          const normalZ = Math.sin(angle);
          const dot = vel.x * normalX + vel.z * normalZ;
          if (dot < 0) {
            vel.x -= dot * 1.3 * normalX;
            vel.z -= dot * 1.3 * normalZ;
          }
        }
      }

      // 2. Check if ship has fallen below the platform deck
      if (pos.y < this.deckElevation - 30) {
        isFallingOff = true;

        // Emergency recovery repulsors activate if falling into deep void
        if (pos.y < -160) {
          vel.y += 180 * dt;
          if (horizDist > 0.001) {
            vel.x += (-pos.x / horizDist) * 110 * dt;
            vel.z += (-pos.z / horizDist) * 110 * dt;
          }
        }

        // Critical safety warp back to deck perimeter if fallen below limit
        if (pos.y < this.minFallLimit) {
          const recoveryAngle = Math.atan2(pos.z, pos.x);
          const recoverR = this.platformRadius * 0.85;
          pos.set(
            Math.cos(recoveryAngle) * recoverR,
            35,
            Math.sin(recoveryAngle) * recoverR
          );
          vel.set(0, 15, 0);
        }
      }
    }

    return {
      onPlatform,
      isSurfaceContact,
      isNearEdge,
      isFallingOff,
      distanceToEdge: Math.round(distToEdge),
      altitudeAboveDeck: Math.round(altitudeAboveDeck),
    };
  }

  /**
   * Boundary checks with forcefield repulsion
   */
  public checkBoundary(
    pos: THREE.Vector3,
    repelVelocity?: THREE.Vector3
  ): {
    distanceFromCenter: number;
    isNearBoundary: boolean;
    isOutOfBounds: boolean;
    repulseVector: THREE.Vector3;
  } {
    const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const vertDist = Math.abs(pos.y);

    const isNearBoundary =
      horizontalDist >= this.platformRadius - 120 ||
      pos.y >= this.maxVerticalLimit - 60 ||
      pos.y <= -60;

    const isOutOfBounds =
      horizontalDist >= this.currentRadius ||
      pos.y >= this.maxVerticalLimit ||
      pos.y <= -140;

    const repulse = new THREE.Vector3(0, 0, 0);

    if (isOutOfBounds) {
      if (horizontalDist > 0.001) {
        repulse.x = -pos.x / horizontalDist;
        repulse.z = -pos.z / horizontalDist;
      }
      if (pos.y > this.maxVerticalLimit) {
        repulse.y = -1;
      } else if (pos.y < -140) {
        repulse.y = 1;
      }
      repulse.normalize();

      // Clamp so ships don't escape
      if (horizontalDist > this.currentRadius + 30) {
        const factor = (this.currentRadius + 30) / horizontalDist;
        pos.x *= factor;
        pos.z *= factor;
      }
      if (pos.y > this.maxVerticalLimit + 30) {
        pos.y = this.maxVerticalLimit + 30;
      }

      if (repelVelocity) {
        repelVelocity.addScaledVector(repulse, 110);
      }
    }

    return {
      distanceFromCenter: Math.round(horizontalDist),
      isNearBoundary,
      isOutOfBounds,
      repulseVector: repulse,
    };
  }

  public checkObstacleCollision(shipPos: THREE.Vector3, shipRadius: number = 8) {
    // Airspace is kept clean without intrusive obstacle blocks
    return { collided: false };
  }

  public dispose() {
    this.arenaGroup.clear();
    this.obstacles = [];
    this.rotatingParts = [];
  }
}

export const juggernautArena = new JuggernautArena();
