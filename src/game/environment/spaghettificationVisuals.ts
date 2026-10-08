import * as THREE from 'three';
import { sound } from '../audio';

/**
 * VOID-RIDER 3D — MASTER SPAGHETTIFICATION & 40-EVENT BLACK HOLE VISUAL DIRECTOR
 *
 * Implements the design and visual language from the master reference poster:
 * "VOID-RIDER 3D | FINAL COLLAPSE — 40 EVENTS
 *  ONE BLACK HOLE • THREE ESCAPE ROUTES • ONE ULTIMATE DESTINY"
 *
 * Covers all 40 Events:
 * 01: BLACK HOLE ACTIVATION (Accretion disk rotation begins, subtle lensing)
 * 02: STELLAR LENSING (Curved star trails bending around singularity)
 * 03: ORBITAL INSTABILITY (Debris drifting inward)
 * 04: ACCRETION DISK FORMATION (Bright orange/red plasma disk feeds)
 * 05: FRAME DRAGGING (Rapid rotational swirl)
 * 06: FIRST GRAVITATIONAL WAVE (Expanding circular concentric gravity-wave ring)
 * 07: TIDAL STRETCHING (Small asteroids elongate with thin glowing trails)
 * 08: ASTEROID FRAGMENTATION (Asteroid breaks apart into scattering shards)
 * 09: DEBRIS INFALL (Inward spiraling debris streamers)
 * 10: TIME DISTORTION (Chromatic warp & wave pulsation)
 * 11: MAJOR TIDAL FORCE (Large tidal wave & heavy camera flex)
 * 12: UNSTABLE ASTEROID (Large asteroid enters unstable decaying orbit)
 * 13: ASTEROID DEFORMATION (Asteroid stretches into molten teardrop)
 * 14: TIDAL DISRUPTION (Asteroid cracks open with incandescent fissures)
 * 15: DEBRIS STREAM (Asteroid dissolves into continuous streaming trail)
 * 16: VIOLENT ACCRETION (Accretion disk flares with accelerated plasma)
 * 17: STATION STRETCHING (Orbital station trusses stretch toward black hole)
 * 18: SPAGHETTIFICATION (Structures become long thin filaments)
 * 19: ROUTE DEFORMATION (Distant neon boundaries bend toward singularity)
 * 20: STRUCTURAL TEAR (Station modules tear apart with plasma discharge)
 * 21: MIDPOINT TIDAL CATASTROPHE (Massive gravitational shockwave ring)
 * 22: PLANETARY FRAGMENT (Large planetary mantle enters scene)
 * 23: PLANETARY DEFORMATION (Planetary body stretches into molten shape)
 * 24: PLANETARY FRAGMENTATION (Planetary body splits into incandescent pieces)
 * 25: DEBRIS WRAP (Debris streams wrap 360° around black hole)
 * 26: EXTREME LENSING (Stars & structures bend dramatically)
 * 27: ROUTE BENDING (Route visibly arches along gravitational gradient)
 * 28: EXPANDING SPAGHETTIFICATION (Filament zone expands to 800m+ streamers)
 * 29: STRUCTURAL FRACTURE (Multiple structures stretch & snap)
 * 30: MASSIVE DEBRIS COLLISION (Two debris clouds collide with fiery shockwave)
 * 31: CRITICAL TIDAL PHASE (Enormous tidal wave ring & roaring accretion)
 * 32: MAXIMUM ACCRETION (Peak relativistic plasma swirl)
 * 33: ROUTE SEGMENTS DISAPPEAR (Distant non-playable corridors get swallowed)
 * 34: PLAYER-SCALE TIDAL DEFORMATION (Ship elongates, energy streamers, camera roll)
 * 35: EVENT HORIZON WARNING (Pulsing crimson/cyan warning ring)
 * 36: FINAL GRAVITATIONAL COLLAPSE (Entire environment converges like a cosmic drain)
 * 37: EXTREME SPAGHETTIFICATION (Signature 3-layer striated filaments + white apex)
 * 38: ACCELERATING INFALL (Everything reaches relativistic inward speed)
 * 39: FINAL TIDAL DISRUPTION (Peak matter elongation before detonation)
 * 40: ABSOLUTE DESTRUCTION (Detonation: White Core -> Orange Ring -> Red Plasma -> Shockwave -> Aftermath -> Rebuild -> Reveal)
 */

export interface SpaghettificationTelemetry {
  intensity: number; // 0 to 1
  stage:
    | 'INACTIVE'
    | 'EARLY_TIDAL'
    | 'EXPANDING'
    | 'PLAYER_DEFORMATION'
    | 'CRITICAL_COLLAPSE'
    | 'EXTREME_FILAMENTATION'
    | 'DETONATION'
    | 'AFTERMATH'
    | 'RECONSTRUCTION';
  apexGlowIntensity: number;
  activeFilamentsCount: number;
  infallVelocity: number;
  gravitationalDistortionFactor: number;
  activeEventName: string;
}

export class SpaghettificationVisuals {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;

  // Active state
  private active = false;
  private intensity = 0;
  private currentEventIndex = 1;
  private elapsedSeconds = 0;

  // 1. White-Hot Tidal Apex (Reference Image 2 & Poster Event 37)
  private tidalApexGroup: THREE.Group;
  private apexCoreMesh: THREE.Mesh;
  private apexGlowMesh: THREE.Mesh;
  private apexTearMesh: THREE.Mesh;
  private apexLight: THREE.PointLight;

  // 2. High-Tensile 3-Layer Luminous Filaments (Poster Events 18, 28, 37, 39)
  // Layer 1: Outer Dark Obsidian strands
  // Layer 2: Middle Cyan & Pure White high-tensile luminous ribbons
  // Layer 3: Inner High-energy fiery Orange/Red accretion tendrils
  private filamentsGroup: THREE.Group;
  private filamentMeshes: {
    mesh: THREE.Line;
    geometry: THREE.BufferGeometry;
    positions: Float32Array;
    layer: 'OUTER_DARK' | 'MIDDLE_WHITE_BLUE' | 'INNER_ORANGE_RED';
    length: number;
    speed: number;
    waveFrequency: number;
    wavePhase: number;
    baseOffset: THREE.Vector3;
    curvatureFactor: number;
    initialRadius: number;
  }[] = [];

  // 3. Stretched Infall Particle Streamers (Poster Events 04, 09, 16, 25, 32, 38)
  private streamerParticles: THREE.Points;
  private streamerPositions: Float32Array;
  private streamerColors: Float32Array;
  private streamerVelocities: THREE.Vector3[] = [];
  private streamerAges: Float32Array;
  private readonly streamerCount = 950;

  // 4. Layered Gravitational Rings (Poster Events 01, 06, 21, 26, 31, 35)
  private gravitationalRingsGroup: THREE.Group;
  private innerPhotonRing: THREE.Mesh;
  private midLensingRing: THREE.Mesh;
  private outerRelativisticRing: THREE.Mesh;
  private eventHorizonWarningRing: THREE.Mesh; // Event 35

  // 5. Gravitational Wave Pulses (Events 06, 11, 21, 31)
  private gravityWaveRings: {
    mesh: THREE.Mesh;
    active: boolean;
    timer: number;
    maxRadius: number;
    speed: number;
  }[] = [];

  // 6. Dedicated Morphing Asteroid System (Events 12, 13, 14, 15)
  // 12: Unstable -> 13: Stretches -> 14: Cracks -> 15: Debris Stream
  private morphingAsteroidGroup: THREE.Group;
  private morphingAsteroidCore: THREE.Mesh;
  private morphingAsteroidFissures: THREE.Mesh;
  private morphingAsteroidTail: THREE.Points;
  private morphingAsteroidTailPos: Float32Array;

  // 7. Space Station Trusses (Events 17, 20, 29)
  // 17: Station Stretching -> 20: Structural Tear -> 29: Structural Fracture
  private stationTrussGroup: THREE.Group;
  private stationModules: {
    mesh: THREE.Mesh;
    basePosition: THREE.Vector3;
    offset: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    torn: boolean;
  }[] = [];

  // 8. Large Spaghettified Planetary Body (Events 22, 23, 24 & Poster Image 1)
  // 22: Planetary Fragment -> 23: Planetary Deformation -> 24: Planetary Fragmentation
  private planetaryFragmentGroup: THREE.Group;
  private planetaryCore: THREE.Mesh;
  private planetaryShards: THREE.Mesh[] = [];
  private planetarySpiralArc: THREE.Line;
  private planetarySpiralPositions: Float32Array;

  // 9. Massive Debris Collision (Event 30)
  private collisionGroup: THREE.Group;
  private collisionChunkA: THREE.Mesh;
  private collisionChunkB: THREE.Mesh;
  private collisionFlash: THREE.Mesh;
  private collisionShockwave: THREE.Mesh;
  private collisionTimer = 0;

  // 10. Deformed Stretched Asteroid Shards & Debris (Events 07, 08, 18, 28)
  private stretchedDebrisGroup: THREE.Group;
  private stretchedDebrisMeshes: {
    mesh: THREE.Mesh;
    basePosition: THREE.Vector3;
    fallVelocity: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    stretchFactor: number;
    active: boolean;
  }[] = [];

  // 11. Bending Route Visualizer (Events 19, 27, 33)
  private bendingRouteGroup: THREE.Group;
  private bendingRouteLines: THREE.Line[] = [];

  // 12. Final Cosmic Detonation (Event 40)
  private detonationGroup: THREE.Group;
  private whiteHotCoreMesh: THREE.Mesh;
  private orangeShockRing: THREE.Mesh;
  private redPlasmaSphere: THREE.Mesh;
  private detonationActive = false;
  private detonationTimer = 0;

  // 13. Player Ship Spaghettification Link
  private playerShipTarget: THREE.Group | null = null;
  private playerShipOriginalScale = new THREE.Vector3(1, 1, 1);

  constructor(scene: THREE.Scene, blackHoleCenter = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHoleCenter.clone();
    this.root = new THREE.Group();
    this.root.name = 'SpaghettificationDestructionDirector';

    // Sub-groups
    this.tidalApexGroup = new THREE.Group();
    this.filamentsGroup = new THREE.Group();
    this.gravitationalRingsGroup = new THREE.Group();
    this.morphingAsteroidGroup = new THREE.Group();
    this.stationTrussGroup = new THREE.Group();
    this.planetaryFragmentGroup = new THREE.Group();
    this.collisionGroup = new THREE.Group();
    this.stretchedDebrisGroup = new THREE.Group();
    this.bendingRouteGroup = new THREE.Group();
    this.detonationGroup = new THREE.Group();

    // 1. Build White-Hot Tidal Apex (Reference Image 2)
    const apexCoreGeo = new THREE.SphereGeometry(16, 24, 24);
    const apexCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.apexCoreMesh = new THREE.Mesh(apexCoreGeo, apexCoreMat);

    const apexGlowGeo = new THREE.SphereGeometry(36, 24, 24);
    const apexGlowMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.apexGlowMesh = new THREE.Mesh(apexGlowGeo, apexGlowMat);

    const tearGeo = new THREE.ConeGeometry(22, 140, 24).rotateX(-Math.PI / 2);
    const tearMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.apexTearMesh = new THREE.Mesh(tearGeo, tearMat);

    this.apexLight = new THREE.PointLight(0xffffff, 0, 2200, 1.2);
    this.tidalApexGroup.add(this.apexCoreMesh);
    this.tidalApexGroup.add(this.apexGlowMesh);
    this.tidalApexGroup.add(this.apexTearMesh);
    this.tidalApexGroup.add(this.apexLight);
    this.tidalApexGroup.position.set(240, 280, -2200);

    // 2. Build 3-Layer Luminous Filaments (54 striated ribbons)
    this.buildLuminousFilaments();

    // 3. Build Streamer Particles
    const streamerGeo = new THREE.BufferGeometry();
    this.streamerPositions = new Float32Array(this.streamerCount * 3);
    this.streamerColors = new Float32Array(this.streamerCount * 3);
    this.streamerAges = new Float32Array(this.streamerCount);

    for (let i = 0; i < this.streamerCount; i++) {
      this.streamerPositions[i * 3] = (Math.random() - 0.5) * 450;
      this.streamerPositions[i * 3 + 1] = (Math.random() - 0.5) * 450;
      this.streamerPositions[i * 3 + 2] = -1100 - Math.random() * 2200;
      this.streamerVelocities.push(new THREE.Vector3());
      this.streamerAges[i] = Math.random() * 5.0;

      const r = Math.random();
      if (r < 0.35) {
        // White-hot
        this.streamerColors[i * 3] = 1.0;
        this.streamerColors[i * 3 + 1] = 1.0;
        this.streamerColors[i * 3 + 2] = 1.0;
      } else if (r < 0.72) {
        // Cyan / Blue
        this.streamerColors[i * 3] = 0.22;
        this.streamerColors[i * 3 + 1] = 0.88;
        this.streamerColors[i * 3 + 2] = 1.0;
      } else {
        // Fiery Orange / Red
        this.streamerColors[i * 3] = 1.0;
        this.streamerColors[i * 3 + 1] = 0.32;
        this.streamerColors[i * 3 + 2] = 0.05;
      }
    }

    streamerGeo.setAttribute('position', new THREE.BufferAttribute(this.streamerPositions, 3));
    streamerGeo.setAttribute('color', new THREE.BufferAttribute(this.streamerColors, 3));
    const streamerMat = new THREE.PointsMaterial({
      size: 7.0,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.streamerParticles = new THREE.Points(streamerGeo, streamerMat);

    // 4. Build Layered Gravitational Rings + Event 35 Warning Ring (Sagittarius A* Red & Yellow Palette)
    const ringGeoInner = new THREE.TorusGeometry(195, 4.5, 16, 96);
    const ringMatInner = new THREE.MeshBasicMaterial({
      color: 0xfff3c4, // Sgr A* Radiant Golden-White
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.innerPhotonRing = new THREE.Mesh(ringGeoInner, ringMatInner);
    this.innerPhotonRing.rotation.x = Math.PI * 0.42;

    const ringGeoMid = new THREE.TorusGeometry(360, 6.2, 16, 96);
    const ringMatMid = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // Sgr A* Radiant Golden-Yellow Lensing
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.midLensingRing = new THREE.Mesh(ringGeoMid, ringMatMid);
    this.midLensingRing.rotation.x = Math.PI * 0.38;
    this.midLensingRing.rotation.y = 0.24;

    const ringGeoOuter = new THREE.TorusGeometry(610, 8.0, 16, 96);
    const ringMatOuter = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Sgr A* Fiery Crimson Accretion Boundary
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.outerRelativisticRing = new THREE.Mesh(ringGeoOuter, ringMatOuter);
    this.outerRelativisticRing.rotation.x = Math.PI * 0.46;
    this.outerRelativisticRing.rotation.z = -0.16;

    // Event 35: Event Horizon Warning Ring
    const warnRingGeo = new THREE.RingGeometry(240, 265, 64);
    const warnRingMat = new THREE.MeshBasicMaterial({
      color: 0xff1e00, // Incandescent Singularity Red
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.eventHorizonWarningRing = new THREE.Mesh(warnRingGeo, warnRingMat);
    this.eventHorizonWarningRing.rotation.x = Math.PI * 0.42;

    this.gravitationalRingsGroup.add(this.innerPhotonRing);
    this.gravitationalRingsGroup.add(this.midLensingRing);
    this.gravitationalRingsGroup.add(this.outerRelativisticRing);
    this.gravitationalRingsGroup.add(this.eventHorizonWarningRing);
    this.gravitationalRingsGroup.position.copy(this.blackHoleCenter);

    // 5. Build Gravitational Wave Rings (Events 06, 11, 21, 31) — Sgr A* Gold & Fiery Red
    for (let w = 0; w < 4; w++) {
      const gWaveGeo = new THREE.RingGeometry(40, 52, 64);
      const gWaveMat = new THREE.MeshBasicMaterial({
        color: w % 2 === 0 ? 0xffd700 : 0xf97316, // Golden-Yellow & Fiery Red-Orange
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const gWaveMesh = new THREE.Mesh(gWaveGeo, gWaveMat);
      gWaveMesh.rotation.x = Math.PI / 2;
      gWaveMesh.position.copy(this.blackHoleCenter);
      this.root.add(gWaveMesh);
      this.gravityWaveRings.push({
        mesh: gWaveMesh,
        active: false,
        timer: 0,
        maxRadius: 1800 + w * 400,
        speed: 280 + w * 60,
      });
    }

    // 6. Build Morphing Asteroid System (Events 12, 13, 14, 15)
    this.buildMorphingAsteroid();

    // 7. Build Space Station Trusses (Events 17, 20, 29)
    this.buildSpaceStationTrusses();

    // 8. Build Planetary Fragment System (Events 22, 23, 24)
    this.buildPlanetaryFragmentSystem();

    // 9. Build Massive Debris Collision (Event 30)
    this.buildDebrisCollision();

    // 10. Build Stretched Debris Instances (Events 07, 08, 18, 28)
    this.buildStretchedDebris();

    // 11. Build Bending Route Visualizer (Events 19, 27, 33)
    this.buildBendingRouteVisualizer();

    // 12. Build Detonation Meshes (Event 40)
    this.buildDetonationMeshes();

    // Assemble root
    this.root.add(this.tidalApexGroup);
    this.root.add(this.filamentsGroup);
    this.root.add(this.streamerParticles);
    this.root.add(this.gravitationalRingsGroup);
    this.root.add(this.morphingAsteroidGroup);
    this.root.add(this.stationTrussGroup);
    this.root.add(this.planetaryFragmentGroup);
    this.root.add(this.collisionGroup);
    this.root.add(this.stretchedDebrisGroup);
    this.root.add(this.bendingRouteGroup);
    this.root.add(this.detonationGroup);

    this.scene.add(this.root);
  }

  /**
   * 2. Builds 54 Striated 3D Filaments matching Image 2 & Poster Event 37
   */
  private buildLuminousFilaments(): void {
    const total = 54;
    const segments = 36;

    for (let i = 0; i < total; i++) {
      const ratio = i / total;
      let layer: 'OUTER_DARK' | 'MIDDLE_WHITE_BLUE' | 'INNER_ORANGE_RED' = 'MIDDLE_WHITE_BLUE';
      let col = 0xffffff;

      if (ratio < 0.24) {
        layer = 'OUTER_DARK';
        col = 0x2d1818;
      } else if (ratio < 0.72) {
        layer = 'MIDDLE_WHITE_BLUE';
        // Sagittarius A* incandescence: pure white & brilliant golden-yellow
        col = i % 2 === 0 ? 0xffffff : 0xfde047;
      } else {
        layer = 'INNER_ORANGE_RED';
        col = i % 2 === 0 ? 0xff5a1f : 0xffaa00;
      }

      const positions = new Float32Array(segments * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0,
        blending: layer === 'OUTER_DARK' ? THREE.NormalBlending : THREE.AdditiveBlending,
        linewidth: layer === 'MIDDLE_WHITE_BLUE' ? 2 : 1,
      });

      const line = new THREE.Line(geo, mat);
      this.filamentsGroup.add(line);

      const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const initialRadius = 26 + Math.random() * 85;
      const length = 480 + Math.random() * 1050;
      const baseOffset = new THREE.Vector3(
        Math.cos(angle) * initialRadius,
        Math.sin(angle) * initialRadius,
        0
      );

      this.filamentMeshes.push({
        mesh: line,
        geometry: geo,
        positions,
        layer,
        length,
        speed: 190 + Math.random() * 280,
        waveFrequency: 2.4 + Math.random() * 4.8,
        wavePhase: Math.random() * Math.PI * 2,
        baseOffset,
        curvatureFactor: 0.16 + Math.random() * 0.46,
        initialRadius,
      });
    }
  }

  /**
   * 6. Dedicated Morphing Asteroid (Events 12, 13, 14, 15)
   */
  private buildMorphingAsteroid(): void {
    const coreGeo = new THREE.DodecahedronGeometry(22, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.3,
    });
    this.morphingAsteroidCore = new THREE.Mesh(coreGeo, coreMat);
    this.morphingAsteroidCore.position.set(-360, 160, -1800);

    const fissureGeo = new THREE.DodecahedronGeometry(22.2, 1);
    const fissureMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.morphingAsteroidFissures = new THREE.Mesh(fissureGeo, fissureMat);
    this.morphingAsteroidCore.add(this.morphingAsteroidFissures);

    const tailCount = 180;
    const tailGeo = new THREE.BufferGeometry();
    this.morphingAsteroidTailPos = new Float32Array(tailCount * 3);
    tailGeo.setAttribute('position', new THREE.BufferAttribute(this.morphingAsteroidTailPos, 3));
    const tailMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 5.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.morphingAsteroidTail = new THREE.Points(tailGeo, tailMat);

    this.morphingAsteroidGroup.add(this.morphingAsteroidCore);
    this.morphingAsteroidGroup.add(this.morphingAsteroidTail);
  }

  /**
   * 7. Space Station Trusses (Events 17, 20, 29)
   */
  private buildSpaceStationTrusses(): void {
    const trussGeo = new THREE.CylinderGeometry(2.5, 2.5, 75, 8);
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });

    const positions = [
      new THREE.Vector3(450, 240, -1900),
      new THREE.Vector3(490, 260, -1920),
      new THREE.Vector3(420, 210, -1880),
      new THREE.Vector3(530, 280, -1950),
    ];

    positions.forEach((pos, i) => {
      const mesh = new THREE.Mesh(trussGeo.clone(), trussMat.clone());
      mesh.position.copy(pos);
      mesh.rotation.z = Math.PI / 4 + i * 0.2;
      this.stationTrussGroup.add(mesh);
      this.stationModules.push({
        mesh,
        basePosition: pos.clone(),
        offset: new THREE.Vector3(),
        rotSpeed: new THREE.Vector3(0.1 + i * 0.05, 0.2, 0.1),
        torn: false,
      });
    });
  }

  /**
   * 8. Large Planetary Fragment System (Events 22, 23, 24)
   */
  private buildPlanetaryFragmentSystem(): void {
    const coreGeo = new THREE.SphereGeometry(62, 32, 32).scale(0.75, 0.75, 2.4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf97316,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    this.planetaryCore = new THREE.Mesh(coreGeo, coreMat);
    this.planetaryCore.position.set(920, 410, -2500);

    const arcCount = 120;
    const arcGeo = new THREE.BufferGeometry();
    this.planetarySpiralPositions = new Float32Array(arcCount * 3);
    arcGeo.setAttribute('position', new THREE.BufferAttribute(this.planetarySpiralPositions, 3));
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 3,
    });
    this.planetarySpiralArc = new THREE.Line(arcGeo, arcMat);

    // Event 24 Fragmentation shards
    const shardGeo = new THREE.DodecahedronGeometry(18, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xff3b30,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    });
    for (let s = 0; s < 6; s++) {
      const shard = new THREE.Mesh(shardGeo.clone(), shardMat.clone());
      shard.visible = false;
      this.planetaryFragmentGroup.add(shard);
      this.planetaryShards.push(shard);
    }

    this.planetaryFragmentGroup.add(this.planetaryCore);
    this.planetaryFragmentGroup.add(this.planetarySpiralArc);
  }

  /**
   * 9. Massive Debris Collision (Event 30)
   */
  private buildDebrisCollision(): void {
    const chunkGeo = new THREE.DodecahedronGeometry(28, 1);
    const chunkMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      emissive: 0xef4444,
      emissiveIntensity: 0.5,
      roughness: 0.6,
    });
    this.collisionChunkA = new THREE.Mesh(chunkGeo, chunkMat);
    this.collisionChunkB = new THREE.Mesh(chunkGeo.clone(), chunkMat.clone());

    const flashGeo = new THREE.SphereGeometry(65, 24, 24);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.collisionFlash = new THREE.Mesh(flashGeo, flashMat);

    const shockGeo = new THREE.RingGeometry(35, 60, 48);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.collisionShockwave = new THREE.Mesh(shockGeo, shockMat);
    this.collisionShockwave.rotation.x = Math.PI / 2;

    this.collisionGroup.position.set(-220, 290, -1700);
    this.collisionGroup.add(this.collisionChunkA);
    this.collisionGroup.add(this.collisionChunkB);
    this.collisionGroup.add(this.collisionFlash);
    this.collisionGroup.add(this.collisionShockwave);
    this.collisionGroup.visible = false;
  }

  /**
   * 10. Stretched Debris Instances (Events 07, 08, 18, 28)
   */
  private buildStretchedDebris(): void {
    const shardGeo = new THREE.BoxGeometry(6, 4, 40);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (let i = 0; i < 32; i++) {
      const mesh = new THREE.Mesh(shardGeo.clone(), shardMat.clone());
      mesh.visible = false;
      this.stretchedDebrisGroup.add(mesh);

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 620,
        -40 + (Math.random() - 0.5) * 200,
        -700 - Math.random() * 2200
      );

      this.stretchedDebrisMeshes.push({
        mesh,
        basePosition: basePos,
        fallVelocity: new THREE.Vector3(0, -18, -50),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 2.8,
          (Math.random() - 0.5) * 1.8
        ),
        stretchFactor: 1.0,
        active: false,
      });
    }
  }

  /**
   * 11. Bending Route Visualizer (Events 19, 27, 33)
   */
  private buildBendingRouteVisualizer(): void {
    const colors = [0x00f0ff, 0xff0055, 0xa855f7];
    for (let b = 0; b < 3; b++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(40 * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({
        color: colors[b],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        linewidth: 2,
      });
      const line = new THREE.Line(geo, mat);
      this.bendingRouteLines.push(line);
      this.bendingRouteGroup.add(line);
    }
  }

  /**
   * 12. Final Cosmic Detonation Meshes (Event 40)
   */
  private buildDetonationMeshes(): void {
    const detWhiteGeo = new THREE.SphereGeometry(85, 32, 32);
    const detWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.whiteHotCoreMesh = new THREE.Mesh(detWhiteGeo, detWhiteMat);

    const detRingGeo = new THREE.RingGeometry(130, 240, 64);
    const detRingMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.orangeShockRing = new THREE.Mesh(detRingGeo, detRingMat);
    this.orangeShockRing.rotation.x = Math.PI / 2;

    const detPlasmaGeo = new THREE.SphereGeometry(190, 32, 32);
    const detPlasmaMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.redPlasmaSphere = new THREE.Mesh(detPlasmaGeo, detPlasmaMat);

    this.detonationGroup.add(this.whiteHotCoreMesh);
    this.detonationGroup.add(this.orangeShockRing);
    this.detonationGroup.add(this.redPlasmaSphere);
    this.detonationGroup.position.copy(this.blackHoleCenter);
  }

  public bindPlayerShip(shipGroup: THREE.Group): void {
    this.playerShipTarget = shipGroup;
    this.playerShipOriginalScale.copy(shipGroup.scale);
  }

  /**
   * Master Update Loop driven by Event Index (01–40) and Failure Status
   */
  public update(
    dt: number,
    eventIndex: number,
    playerPos: THREE.Vector3,
    isMissedEscapeSequence = false,
    missedEscapePhase = 0
  ): SpaghettificationTelemetry {
    this.elapsedSeconds += dt;
    this.currentEventIndex = eventIndex;

    let targetIntensity = 0;
    let stage: SpaghettificationTelemetry['stage'] = 'INACTIVE';

    if (isMissedEscapeSequence) {
      if (missedEscapePhase <= 1) {
        targetIntensity = 0.72;
        stage = 'PLAYER_DEFORMATION';
      } else if (missedEscapePhase <= 3) {
        targetIntensity = 0.88;
        stage = 'CRITICAL_COLLAPSE';
      } else if (missedEscapePhase <= 6) {
        targetIntensity = 1.0;
        stage = 'EXTREME_FILAMENTATION';
      } else if (missedEscapePhase === 7) {
        targetIntensity = 1.0;
        stage = 'DETONATION';
        this.triggerDetonation();
      } else if (missedEscapePhase <= 9) {
        targetIntensity = 0.25;
        stage = 'AFTERMATH';
      } else {
        targetIntensity = 0.1;
        stage = 'RECONSTRUCTION';
      }
    } else {
      if (eventIndex >= 37) {
        targetIntensity = 1.0; // Event 37: EXTREME SPAGHETTIFICATION
        stage = 'EXTREME_FILAMENTATION';
      } else if (eventIndex >= 36) {
        targetIntensity = 0.85; // Event 36: FINAL GRAVITATIONAL COLLAPSE
        stage = 'CRITICAL_COLLAPSE';
      } else if (eventIndex >= 34) {
        targetIntensity = 0.65; // Event 34: PLAYER-SCALE TIDAL DEFORMATION
        stage = 'PLAYER_DEFORMATION';
      } else if (eventIndex >= 28) {
        targetIntensity = 0.45; // Event 28: EXPANDING SPAGHETTIFICATION
        stage = 'EXPANDING';
      } else if (eventIndex >= 18) {
        targetIntensity = 0.26; // Event 18: SPAGHETTIFICATION
        stage = 'EARLY_TIDAL';
      } else if (eventIndex >= 6) {
        targetIntensity = 0.12;
      }
    }

    this.intensity = THREE.MathUtils.lerp(this.intensity, targetIntensity, Math.min(1, dt * 2.2));
    this.active = this.intensity > 0.02 || eventIndex > 1;

    if (!this.active) {
      this.root.visible = false;
      this.restorePlayerShip();
      return {
        intensity: 0,
        stage: 'INACTIVE',
        apexGlowIntensity: 0,
        activeFilamentsCount: 0,
        infallVelocity: 0,
        gravitationalDistortionFactor: 0,
        activeEventName: 'STANDBY',
      };
    }

    this.root.visible = true;

    // 1. Update White-Hot Tidal Apex (Image 2)
    const apexOpacity = Math.min(1.0, this.intensity * 1.4);
    (this.apexCoreMesh.material as THREE.MeshBasicMaterial).opacity = apexOpacity;
    (this.apexGlowMesh.material as THREE.MeshBasicMaterial).opacity = apexOpacity * 0.85;
    (this.apexTearMesh.material as THREE.MeshBasicMaterial).opacity = apexOpacity * 0.95;
    this.apexLight.intensity = this.intensity * 9.0;
    this.apexTearMesh.lookAt(this.blackHoleCenter);
    const apexPulse = 1.0 + Math.sin(this.elapsedSeconds * 6.0) * 0.08 * this.intensity;
    this.tidalApexGroup.scale.setScalar(apexPulse);

    // 2. Update Luminous Filaments (Striated ribbons)
    this.updateFilaments(dt);

    // 3. Update Streamer Particles
    this.updateStreamerParticles(dt);

    // 4. Update Gravitational Rings & Event 35 Warning Ring
    this.updateGravitationalRings(dt);

    // 5. Update Gravitational Waves (Events 06, 11, 21, 31)
    this.updateGravityWaves(dt);

    // 6. Update Morphing Asteroid (Events 12, 13, 14, 15)
    this.updateMorphingAsteroid(dt);

    // 7. Update Space Station Trusses (Events 17, 20, 29)
    this.updateSpaceStationTrusses(dt);

    // 8. Update Planetary Fragment (Events 22, 23, 24)
    this.updatePlanetaryFragment(dt);

    // 9. Update Massive Debris Collision (Event 30)
    this.updateDebrisCollision(dt);

    // 10. Update Stretched Debris (Events 07, 08, 18, 28)
    this.updateStretchedDebris(dt);

    // 11. Update Bending Route Lines (Events 19, 27, 33)
    this.updateBendingRouteLines(dt);

    // 12. Update Player Ship Spaghettification (Events 34, 37, 39, 40)
    this.updatePlayerShipDeformation(dt, isMissedEscapeSequence, missedEscapePhase);

    // 13. Update Detonation
    if (this.detonationActive) {
      this.updateDetonation(dt);
    }

    return {
      intensity: this.intensity,
      stage,
      apexGlowIntensity: apexOpacity * 4.8,
      activeFilamentsCount: Math.round(this.filamentMeshes.length * this.intensity),
      infallVelocity: 260 + this.intensity * 820,
      gravitationalDistortionFactor: this.intensity * 3.0,
      activeEventName: `EVENT ${String(eventIndex).padStart(2, '0')}`,
    };
  }

  /**
   * Updates the 54 striated filaments (Image 2)
   */
  private updateFilaments(dt: number): void {
    const apexPos = this.tidalApexGroup.position;
    const bhPos = this.blackHoleCenter;
    const toBh = new THREE.Vector3().subVectors(bhPos, apexPos);
    const totalDist = toBh.length();
    const dir = toBh.clone().normalize();

    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();
    const orthoUp = new THREE.Vector3().crossVectors(right, dir).normalize();

    this.filamentMeshes.forEach(item => {
      const line = item.mesh;
      const mat = line.material as THREE.LineBasicMaterial;

      let targetOpacity = this.intensity;
      if (item.layer === 'OUTER_DARK') targetOpacity = this.intensity * 0.85;
      else if (item.layer === 'MIDDLE_WHITE_BLUE') targetOpacity = Math.min(1.0, this.intensity * 1.3);
      else targetOpacity = this.intensity * 0.95;

      mat.opacity = targetOpacity;
      if (targetOpacity <= 0.01) {
        line.visible = false;
        return;
      }
      line.visible = true;

      const segments = item.positions.length / 3;
      const waveFreq = item.waveFrequency;
      const wavePhase = item.wavePhase + this.elapsedSeconds * (item.speed * 0.016);

      for (let s = 0; s < segments; s++) {
        const u = s / (segments - 1);
        const currentDist = u * totalDist;
        const centerLine = apexPos.clone().addScaledVector(dir, currentDist);

        const wave1 = Math.sin(u * waveFreq * Math.PI + wavePhase) * (15 + u * 50);
        const wave2 = Math.cos(u * (waveFreq * 1.3) * Math.PI + wavePhase * 0.8) * (11 + u * 38);

        const spreadFactor = Math.sin(u * Math.PI) * item.curvatureFactor;
        const offset = right.clone().multiplyScalar(item.baseOffset.x * spreadFactor + wave1)
          .add(orthoUp.clone().multiplyScalar(item.baseOffset.y * spreadFactor + wave2));

        const pt = centerLine.add(offset);
        item.positions[s * 3] = pt.x;
        item.positions[s * 3 + 1] = pt.y;
        item.positions[s * 3 + 2] = pt.z;
      }
      item.geometry.attributes.position.needsUpdate = true;
    });
  }

  /**
   * Updates streamer particles (Events 04, 09, 16, 25, 32, 38)
   */
  private updateStreamerParticles(dt: number): void {
    const mat = this.streamerParticles.material as THREE.PointsMaterial;
    mat.opacity = Math.min(0.95, this.intensity * 1.15);
    if (mat.opacity <= 0.01) {
      this.streamerParticles.visible = false;
      return;
    }
    this.streamerParticles.visible = true;

    const apexPos = this.tidalApexGroup.position;
    const bhPos = this.blackHoleCenter;
    const speedBase = (360 + this.intensity * 980) * dt;

    for (let i = 0; i < this.streamerCount; i++) {
      this.streamerAges[i] += dt;
      const x = this.streamerPositions[i * 3];
      const y = this.streamerPositions[i * 3 + 1];
      const z = this.streamerPositions[i * 3 + 2];

      const current = new THREE.Vector3(x, y, z);
      const toCenter = bhPos.clone().sub(current);
      const dist = toCenter.length();

      if (dist < 80 || this.streamerAges[i] > 4.5) {
        this.streamerPositions[i * 3] = apexPos.x + (Math.random() - 0.5) * 85;
        this.streamerPositions[i * 3 + 1] = apexPos.y + (Math.random() - 0.5) * 85;
        this.streamerPositions[i * 3 + 2] = apexPos.z + (Math.random() - 0.5) * 65;
        this.streamerAges[i] = 0;
      } else {
        const pull = toCenter.normalize().multiplyScalar(speedBase);
        const swirl = new THREE.Vector3(-pull.z, pull.y * 0.2, pull.x).multiplyScalar(0.28);
        current.add(pull).add(swirl);

        this.streamerPositions[i * 3] = current.x;
        this.streamerPositions[i * 3 + 1] = current.y;
        this.streamerPositions[i * 3 + 2] = current.z;
      }
    }
    this.streamerParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Updates layered rings + Event 35 warning ring
   */
  private updateGravitationalRings(dt: number): void {
    const t = this.elapsedSeconds;
    const pulseFactor = 1.0 + Math.sin(t * 3.6) * 0.06 * this.intensity;

    this.innerPhotonRing.rotation.z += dt * (0.85 + this.intensity * 2.4);
    this.innerPhotonRing.scale.setScalar(pulseFactor);
    (this.innerPhotonRing.material as THREE.MeshBasicMaterial).opacity = 0.25 + this.intensity * 0.72;

    this.midLensingRing.rotation.z -= dt * (0.45 + this.intensity * 1.6);
    this.midLensingRing.scale.setScalar(pulseFactor * (1.0 + Math.cos(t * 2.8) * 0.06));
    (this.midLensingRing.material as THREE.MeshBasicMaterial).opacity = 0.18 + this.intensity * 0.62;

    this.outerRelativisticRing.rotation.z += dt * (0.28 + this.intensity * 1.2);
    this.outerRelativisticRing.scale.setScalar(pulseFactor * (1.0 + Math.sin(t * 1.9) * 0.08));
    (this.outerRelativisticRing.material as THREE.MeshBasicMaterial).opacity = 0.12 + this.intensity * 0.58;

    // Event 35 Warning Ring
    if (this.currentEventIndex >= 35) {
      const warnPulse = 0.5 + 0.5 * Math.sin(t * 8.0);
      (this.eventHorizonWarningRing.material as THREE.MeshBasicMaterial).opacity = warnPulse * 0.85;
      this.eventHorizonWarningRing.rotation.z += dt * 1.5;
    } else {
      (this.eventHorizonWarningRing.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }

  /**
   * Updates Gravitational Wave Pulses (Events 06, 11, 21, 31)
   */
  private updateGravityWaves(dt: number): void {
    const isWaveEvent = [6, 11, 21, 31].includes(this.currentEventIndex);
    this.gravityWaveRings.forEach((wave, i) => {
      if (isWaveEvent && !wave.active && Math.random() < 0.03) {
        wave.active = true;
        wave.timer = 0;
      }
      if (wave.active) {
        wave.timer += dt;
        const radius = wave.timer * wave.speed;
        const progress = radius / wave.maxRadius;
        wave.mesh.scale.setScalar(1 + progress * 25);
        (wave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - progress) * 0.45);
        if (progress >= 1.0) {
          wave.active = false;
          (wave.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    });
  }

  /**
   * 6. Morphing Asteroid (Events 12, 13, 14, 15)
   */
  private updateMorphingAsteroid(dt: number): void {
    const ev = this.currentEventIndex;
    if (ev < 12) {
      this.morphingAsteroidGroup.visible = false;
      return;
    }
    this.morphingAsteroidGroup.visible = true;

    // 12: Unstable orbit -> 13: Stretch -> 14: Cracks -> 15: Stream
    const t = this.elapsedSeconds;
    this.morphingAsteroidCore.rotation.x += dt * 0.4;
    this.morphingAsteroidCore.rotation.y += dt * 0.7;

    // Pull toward black hole
    const toCenter = this.blackHoleCenter.clone().sub(this.morphingAsteroidCore.position).normalize();
    this.morphingAsteroidCore.position.addScaledVector(toCenter, dt * (30 + (ev - 12) * 25));

    if (ev >= 13) {
      // 13: Visible stretch
      const stretch = 1.0 + (ev - 12) * 1.2;
      const squeeze = 1.0 / Math.sqrt(stretch);
      this.morphingAsteroidCore.scale.set(squeeze, squeeze, stretch);
    }
    if (ev >= 14) {
      // 14: Fissures ignite
      (this.morphingAsteroidFissures.material as THREE.MeshBasicMaterial).opacity = 0.85;
    }
    if (ev >= 15) {
      // 15: Debris stream tail
      const tailMat = this.morphingAsteroidTail.material as THREE.PointsMaterial;
      tailMat.opacity = 0.9;
      const corePos = this.morphingAsteroidCore.position;
      const count = this.morphingAsteroidTailPos.length / 3;
      for (let p = 0; p < count; p++) {
        const u = p / count;
        this.morphingAsteroidTailPos[p * 3] = corePos.x + Math.sin(t * 4 + p) * 12 + toCenter.x * u * 240;
        this.morphingAsteroidTailPos[p * 3 + 1] = corePos.y + Math.cos(t * 4 + p) * 12 + toCenter.y * u * 240;
        this.morphingAsteroidTailPos[p * 3 + 2] = corePos.z + toCenter.z * u * 240;
      }
      this.morphingAsteroidTail.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * 7. Space Station Trusses (Events 17, 20, 29)
   */
  private updateSpaceStationTrusses(dt: number): void {
    const ev = this.currentEventIndex;
    if (ev < 17) {
      this.stationTrussGroup.visible = false;
      return;
    }
    this.stationTrussGroup.visible = true;

    this.stationModules.forEach((mod, i) => {
      // 17: Stretch towards singularity
      const toCenter = this.blackHoleCenter.clone().sub(mod.mesh.position).normalize();
      if (ev >= 17) {
        const stretch = 1.0 + (ev - 16) * 0.4;
        mod.mesh.scale.set(1.0, 1.0, stretch);
      }
      // 20 & 29: Tear apart & tumble
      if (ev >= 20) {
        mod.offset.addScaledVector(toCenter, dt * (40 + i * 20));
        mod.mesh.position.copy(mod.basePosition).add(mod.offset);
        mod.mesh.rotation.x += dt * mod.rotSpeed.x * 3.0;
        mod.mesh.rotation.y += dt * mod.rotSpeed.y * 3.0;
      }
    });
  }

  /**
   * 8. Planetary Fragment System (Events 22, 23, 24)
   */
  private updatePlanetaryFragment(dt: number): void {
    const ev = this.currentEventIndex;
    if (ev < 22) {
      this.planetaryFragmentGroup.visible = false;
      return;
    }
    this.planetaryFragmentGroup.visible = true;
    const t = this.elapsedSeconds;

    // 22: Planetary Fragment enters scene
    this.planetaryCore.rotation.y += dt * 0.25;

    // 23: Planetary Deformation
    const stretch = ev >= 23 ? 1.0 + (ev - 22) * 1.5 : 1.0;
    const squeeze = Math.max(0.2, 1.0 / Math.sqrt(stretch));
    this.planetaryCore.scale.set(squeeze, squeeze, stretch);

    // Spiral tail streamer
    const arcMat = this.planetarySpiralArc.material as THREE.LineBasicMaterial;
    arcMat.opacity = Math.min(1.0, 0.4 + this.intensity * 0.6);
    const startPos = this.planetaryCore.position;
    const endPos = this.blackHoleCenter;
    const count = this.planetarySpiralPositions.length / 3;

    for (let p = 0; p < count; p++) {
      const u = p / (count - 1);
      const angle = u * Math.PI * 1.9 + t * 0.25;
      const radius = THREE.MathUtils.lerp(190, 820, 1 - u);
      const z = THREE.MathUtils.lerp(startPos.z, endPos.z, u);
      this.planetarySpiralPositions[p * 3] = endPos.x + Math.cos(angle) * radius;
      this.planetarySpiralPositions[p * 3 + 1] = endPos.y + Math.sin(angle * 1.2) * (radius * 0.35);
      this.planetarySpiralPositions[p * 3 + 2] = z;
    }
    this.planetarySpiralArc.geometry.attributes.position.needsUpdate = true;

    // 24: Fragmentation Shards
    if (ev >= 24) {
      this.planetaryShards.forEach((shard, idx) => {
        shard.visible = true;
        const angle = (idx / 6) * Math.PI * 2 + t * 0.8;
        const dist = 60 + (ev - 23) * 25;
        shard.position.set(
          this.planetaryCore.position.x + Math.cos(angle) * dist,
          this.planetaryCore.position.y + Math.sin(angle) * dist,
          this.planetaryCore.position.z + Math.sin(angle * 1.5) * 40
        );
        shard.rotation.x += dt * 2.0;
        shard.rotation.y += dt * 3.0;
      });
    }
  }

  /**
   * 9. Massive Debris Collision (Event 30)
   */
  private updateDebrisCollision(dt: number): void {
    if (this.currentEventIndex === 30) {
      this.collisionGroup.visible = true;
      this.collisionTimer += dt;
      const t = this.collisionTimer;

      // Convergence
      const d = Math.max(0, 140 - t * 75);
      this.collisionChunkA.position.set(-d, 0, 0);
      this.collisionChunkB.position.set(d, 0, 0);

      if (d <= 5) {
        // Impact! Flash & Shockwave
        const flashFrac = Math.min(1.0, (t - 1.8) / 1.5);
        (this.collisionFlash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - flashFrac * 1.4);
        (this.collisionShockwave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - flashFrac);
        this.collisionShockwave.scale.setScalar(1 + flashFrac * 14.0);
      }
    } else {
      this.collisionGroup.visible = false;
      this.collisionTimer = 0;
    }
  }

  /**
   * 10. Stretched Debris Instances (Events 07, 08, 18, 28)
   */
  private updateStretchedDebris(dt: number): void {
    const shouldSpawn = this.intensity > 0.2;
    if (!shouldSpawn) {
      this.stretchedDebrisGroup.visible = false;
      return;
    }
    this.stretchedDebrisGroup.visible = true;

    this.stretchedDebrisMeshes.forEach(item => {
      if (!item.active && Math.random() < 0.06 * this.intensity) {
        item.active = true;
        item.mesh.visible = true;
        item.mesh.position.copy(item.basePosition);
        item.stretchFactor = 1.0;
      }
      if (item.active) {
        const toCenter = this.blackHoleCenter.clone().sub(item.mesh.position).normalize();
        item.fallVelocity.addScaledVector(toCenter, dt * 145 * this.intensity);
        item.mesh.position.addScaledVector(item.fallVelocity, dt);

        item.stretchFactor = Math.min(18.0, item.stretchFactor + dt * 4.8 * this.intensity);
        const squeeze = Math.max(0.12, 1.0 / Math.sqrt(item.stretchFactor));
        item.mesh.scale.set(squeeze, squeeze, item.stretchFactor);
        item.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), toCenter);

        if (item.mesh.position.distanceTo(this.blackHoleCenter) < 140) {
          item.active = false;
          item.mesh.visible = false;
        }
      }
    });
  }

  /**
   * 11. Bending Route Lines (Events 19, 27, 33)
   */
  private updateBendingRouteLines(dt: number): void {
    const ev = this.currentEventIndex;
    if (ev < 19) {
      this.bendingRouteGroup.visible = false;
      return;
    }
    this.bendingRouteGroup.visible = true;

    const bendStrength = (ev - 18) * 8.5;
    this.bendingRouteLines.forEach((line, idx) => {
      (line.material as THREE.LineBasicMaterial).opacity = Math.min(0.85, 0.25 + (ev - 18) * 0.04);
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      const count = pos.count;
      const zStart = -600;
      const zEnd = -2400;
      const xBase = (idx - 1) * 80;

      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const z = THREE.MathUtils.lerp(zStart, zEnd, u);
        const pull = Math.pow(u, 2.2) * bendStrength;
        pos.setXYZ(i, xBase - pull, 20 + Math.sin(u * Math.PI) * 35, z);
      }
      pos.needsUpdate = true;
    });
  }

  /**
   * 12. Player Ship Spaghettification (Events 34, 37, 39, 40)
   */
  private updatePlayerShipDeformation(
    dt: number,
    isMissedEscape: boolean,
    missedPhase: number
  ): void {
    if (!this.playerShipTarget) return;

    if (!isMissedEscape) {
      if (this.currentEventIndex >= 34) {
        const stretch = 1.0 + (this.currentEventIndex - 33) * 0.08;
        const squeeze = 1.0 / Math.sqrt(stretch);
        this.playerShipTarget.scale.set(
          this.playerShipOriginalScale.x * squeeze,
          this.playerShipOriginalScale.y * squeeze,
          this.playerShipOriginalScale.z * stretch
        );
      } else {
        this.restorePlayerShip();
      }
      return;
    }

    // Missed Escape Sequence: 11 Distinct Phases
    let stretchZ = 1.0;
    let squeezeXY = 1.0;

    switch (missedPhase) {
      case 1:
        stretchZ = 1.05;
        squeezeXY = 0.98;
        break;
      case 2:
        stretchZ = 1.45;
        squeezeXY = 0.82;
        break;
      case 3:
        stretchZ = 2.1;
        squeezeXY = 0.68;
        break;
      case 4:
        stretchZ = 3.4;
        squeezeXY = 0.52;
        break;
      case 5:
        stretchZ = 5.5;
        squeezeXY = 0.38;
        break;
      case 6:
        stretchZ = 8.8;
        squeezeXY = 0.22;
        break;
      case 7:
      case 8:
        stretchZ = 14.0;
        squeezeXY = 0.08;
        break;
      default:
        stretchZ = 1.0;
        squeezeXY = 1.0;
        break;
    }

    this.playerShipTarget.scale.set(
      this.playerShipOriginalScale.x * squeezeXY,
      this.playerShipOriginalScale.y * squeezeXY,
      this.playerShipOriginalScale.z * stretchZ
    );
  }

  private restorePlayerShip(): void {
    if (this.playerShipTarget) {
      this.playerShipTarget.scale.copy(this.playerShipOriginalScale);
    }
  }

  public triggerDetonation(): void {
    if (this.detonationActive) return;
    this.detonationActive = true;
    this.detonationTimer = 0;
    sound.playDeepCosmicBoom();
    sound.playDarkGravitationalShockwave();
  }

  private updateDetonation(dt: number): void {
    this.detonationTimer += dt;
    const t = this.detonationTimer;

    if (t < 0.4) {
      (this.whiteHotCoreMesh.material as THREE.MeshBasicMaterial).opacity = (t / 0.4) * 0.95;
      return;
    }

    const blastT = t - 0.4;
    const blastFrac = Math.min(1.0, blastT / 3.5);

    const coreScale = 1.0 + blastFrac * 14.0;
    this.whiteHotCoreMesh.scale.setScalar(coreScale);
    (this.whiteHotCoreMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - blastFrac * 0.9);

    const ringScale = 1.0 + blastFrac * 11.0;
    this.orangeShockRing.scale.setScalar(ringScale);
    (this.orangeShockRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - blastFrac * 0.85);

    const plasmaScale = 1.0 + blastFrac * 9.0;
    this.redPlasmaSphere.scale.setScalar(plasmaScale);
    (this.redPlasmaSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 - blastFrac * 0.8);

    if (blastFrac >= 1.0) {
      this.detonationActive = false;
    }
  }

  public dispose(): void {
    this.scene.remove(this.root);
    this.restorePlayerShip();
    this.root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}
