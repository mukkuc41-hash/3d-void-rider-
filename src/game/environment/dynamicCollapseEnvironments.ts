import * as THREE from 'three';
import { sound } from '../audio';
import {
  COSMIC_40_EVENTS,
  CosmicEventDefinition,
  PersistentDestructionRegistry,
} from '../catastrophe/cosmicSystems';
import {
  CosmicEventPairVisualizer,
  CosmicPairLiveTelemetry,
} from '../catastrophe/cosmicEventPairVisualizer';

export type { CosmicPairLiveTelemetry };

/**
 * Visual Scale Tiers:
 * NEAR: 0–500 meters (Clear path, sparse telegraphed obstacles)
 * ACTIVE: 500m–3km (Clean background landmarks)
 * FAR: 3km+ (Distant celestial bodies framing the persistent black hole)
 */
export type VisualScaleTier = 'NEAR' | 'ACTIVE' | 'FAR';

/**
 * Physical Near-Field Obstacle for collision tracking
 */
export interface PhysicalObstacle {
  mesh: THREE.Object3D;
  boundingRadius: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  damageValue: number;
  environmentIndex: number;
  name: string;
}

/**
 * Streamlined Dynamic Physical Environment Manager for Final Collapse:
 * Clean, decluttered cosmic aesthetic ensuring maximum track readability,
 * zero track-blocking clutter, and highlighting the persistent, unchanged black hole.
 * Features 2-Element simulation for all 40 events with Keplerian revolution, collision,
 * and tidal spaghettification into particle streams.
 */
export class DynamicCollapseEnvironmentsManager {
  public root: THREE.Group;
  public scene: THREE.Scene;
  public blackHoleCenter: THREE.Vector3;
  public registry: PersistentDestructionRegistry;
  public eventPairVisualizer: CosmicEventPairVisualizer;
  public latestPairTelemetry: CosmicPairLiveTelemetry | null = null;

  // Environment Sub-Groups (1 to 40)
  public envGroups: Map<number, THREE.Group> = new Map();

  // Active Near-Field Collidable Obstacles (sparse and fair)
  private nearObstacles: PhysicalObstacle[] = [];

  // Streamlined Infall Debris Pool (subtle background drift, decluttered from 1600 down to 40)
  public accumulatedDebrisGroup: THREE.Group;
  private debrisInstancedMesh!: THREE.InstancedMesh;
  private debrisData: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Euler;
    rotSpeed: THREE.Vector3;
    scale: number;
    initialDistance: number;
  }[] = [];
  private readonly maxAccumulatedDebris = 40;

  // Distant Celestial Landmarks (cleanly framing the black hole)
  private planetA: THREE.Mesh | null = null;
  private moon1: THREE.Mesh | null = null;

  // Submode 10 planetary collection / spaghettification set. These bodies are
  // pulled toward the singularity and stretched along the local gravity axis.
  private collectedPlanets: {
    group: THREE.Group;
    core: THREE.Mesh;
    atmosphere: THREE.Mesh;
    orbitRadius: number;
    orbitAngle: number;
    baseScale: THREE.Vector3;
    seed: number;
    collected: boolean;
  }[] = [];

  // Single Majestic Background Arch (framing the sky without blocking track)
  private majesticArch: THREE.Mesh | null = null;

  // Distant Space Station Landmark
  private distantStation: THREE.Group | null = null;

  // Subtle Cosmic Dust (decluttered from 2,400 blinding particles down to 40 subtle star particles)
  private ambientSpaceDust: THREE.Points | null = null;

  // Collapsible Routes (Event 12, 32, 38)
  private collapsibleRouteSegments: {
    group: THREE.Group;
    mesh: THREE.Mesh;
    state: 'SAFE' | 'UNSTABLE' | 'COLLAPSING' | 'DESTROYED' | 'CONSUMED';
    collapseTimer: number;
    fallVelocity: THREE.Vector3;
  }[] = [];

  // Event 40: Absolute Cosmic End Climax
  public absoluteCollapseProgress = 0;
  public absoluteCollapsePhase:
    | 'IDLE'
    | 'CONVERGENCE'
    | 'MOTION_SLOW'
    | 'NEAR_SILENCE'
    | 'GRAVITATIONAL_DISTORTION'
    | 'DARK_GRAVITATIONAL_PULSE'
    | 'DARK_IMPLOSION'
    | 'DARK_SHOCKWAVE'
    | 'COSMIC_BOOM'
    | 'ALL_COLLAPSED'
    | 'SUDDEN_SILENCE'
    | 'BLACK_SCREEN' = 'IDLE';
  private climaxTimer = 0;
  private darkWaveMesh!: THREE.Mesh;
  private darkImplosionMesh!: THREE.Mesh;
  private singularityCoreMesh!: THREE.Mesh;
  private singularityExplosionMesh!: THREE.Mesh;
  private singularityShockRing!: THREE.Mesh;
  private singularityFlameRing!: THREE.Mesh;
  private rebuildRouteGlow!: THREE.Group;
  private singularityDebris!: THREE.Points;

  public currentEventIndex = 1;
  private elapsedSeconds = 0;

  constructor(scene: THREE.Scene, blackHolePosition = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePosition.clone();
    this.registry = PersistentDestructionRegistry.getInstance();
    this.root = new THREE.Group();
    this.root.name = 'DynamicCollapseEnvironments_Root';

    this.accumulatedDebrisGroup = new THREE.Group();
    this.accumulatedDebrisGroup.name = 'AccumulatedDebrisGroup';
    this.root.add(this.accumulatedDebrisGroup);

    // Build curated, decluttered world elements
    this.buildStreamlinedDebrisSystem();
    this.buildCleanCelestialLandmarks();
    this.buildPlanetaryCollectionSystem();
    this.buildSingleMajesticArch();
    this.buildDistantOrbitalStation();
    this.buildSubtleSpaceDust();
    this.buildMultiRouteNetwork();
    this.buildEvent40AbsoluteCosmicEndClimaxMeshes();

    // 2-Element Event Visualizer for all 40 events
    this.eventPairVisualizer = new CosmicEventPairVisualizer(this.scene, this.blackHoleCenter);

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. STREAMLINED BACKGROUND DEBRIS (Sparse, subtle depth, zero track clutter)
     ========================================================================= */
  private buildStreamlinedDebrisSystem(): void {
    const geo = new THREE.DodecahedronGeometry(3.0, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x556677,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });

    this.debrisInstancedMesh = new THREE.InstancedMesh(geo, mat, this.maxAccumulatedDebris);
    this.debrisInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.maxAccumulatedDebris; i++) {
      const angle = (i / this.maxAccumulatedDebris) * Math.PI * 2;
      // Keep debris safely away from track center (radius > 250m)
      const radius = 300 + Math.random() * 1400;
      const height = -100 + Math.random() * 500;
      const z = -600 - Math.random() * 2800;

      const pos = new THREE.Vector3(Math.cos(angle) * radius, height, z);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 4
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      );
      const s = 0.5 + Math.random() * 1.5;

      this.debrisData.push({
        position: pos,
        velocity: vel,
        rotation: rot,
        rotSpeed,
        scale: s,
        initialDistance: pos.distanceTo(this.blackHoleCenter),
      });

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.debrisInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.debrisInstancedMesh.instanceMatrix.needsUpdate = true;
    this.accumulatedDebrisGroup.add(this.debrisInstancedMesh);
  }

  /* =========================================================================
     2. CLEAN CELESTIAL LANDMARKS (Distant background framing, no duplicate meshes)
     ========================================================================= */
  private buildCleanCelestialLandmarks(): void {
    const group = new THREE.Group();
    group.name = 'Env_Celestial_Background';

    // Distant Sapphire Gas Giant placed well off to the upper-left
    const planetGeo = new THREE.SphereGeometry(450, 32, 24);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x0f172a,
    });
    this.planetA = new THREE.Mesh(planetGeo, planetMat);
    this.planetA.position.set(-2400, 750, -3200);
    group.add(this.planetA);

    // Single sleek moon
    const moonGeo = new THREE.SphereGeometry(90, 20, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    this.moon1 = new THREE.Mesh(moonGeo, moonMat);
    this.moon1.position.set(-1550, 920, -2800);
    group.add(this.moon1);

    this.envGroups.set(2, group);
    this.root.add(group);
  }

  /* =========================================================================
     2B. PLANETARY COLLECTION + SPAGHETTIFICATION (SUBMODE 10)
     ========================================================================= */
  private buildPlanetaryCollectionSystem(): void {
    const group = new THREE.Group();
    group.name = 'Submode10_PlanetaryCollection';

    const planetSpecs = [
      { radius: 180, distance: 2100, angle: 0.35, color: 0x2dd4bf, seed: 0.7 },
      { radius: 120, distance: 2750, angle: 2.1, color: 0xa78bfa, seed: 1.4 },
      { radius: 150, distance: 3300, angle: 4.0, color: 0xf59e0b, seed: 2.2 },
      { radius: 95, distance: 3900, angle: 5.35, color: 0x38bdf8, seed: 3.1 },
    ];

    for (const spec of planetSpecs) {
      const planetGroup = new THREE.Group();
      planetGroup.name = 'CollectedPlanet';

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius, 24, 18),
        new THREE.MeshStandardMaterial({
          color: spec.color,
          roughness: 0.72,
          metalness: 0.08,
          emissive: spec.color,
          emissiveIntensity: 0.08,
        })
      );

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius * 1.08, 20, 16),
        new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.10,
          side: THREE.BackSide,
        })
      );

      planetGroup.add(core);
      planetGroup.add(atmosphere);

      const offset = new THREE.Vector3(
        Math.cos(spec.angle) * spec.distance,
        220 + Math.sin(spec.angle * 1.7) * 650,
        this.blackHoleCenter.z + Math.sin(spec.angle) * spec.distance
      );
      offset.x += this.blackHoleCenter.x;
      offset.y += this.blackHoleCenter.y;
      planetGroup.position.copy(offset);
      group.add(planetGroup);

      this.collectedPlanets.push({
        group: planetGroup,
        core,
        atmosphere,
        orbitRadius: spec.distance,
        orbitAngle: spec.angle,
        baseScale: new THREE.Vector3(1, 1, 1),
        seed: spec.seed,
        collected: false,
      });
    }

    this.envGroups.set(11, group);
    this.root.add(group);
  }

  /* =========================================================================
     3. SINGLE MAJESTIC ARCH (Elevated high above track, framing the black hole)
     ========================================================================= */
  private buildSingleMajesticArch(): void {
    const group = new THREE.Group();
    group.name = 'Env_Majestic_Arch';

    const archMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });

    // Elevated arch spanning high overhead at y=160 (safe clearance above track)
    const archGeo = new THREE.TorusGeometry(320, 8, 8, 36, Math.PI);
    this.majesticArch = new THREE.Mesh(archGeo, archMat);
    this.majesticArch.position.set(0, 80, -1400);
    this.majesticArch.rotation.z = Math.PI; // Inverted arch over the horizon
    group.add(this.majesticArch);

    this.envGroups.set(3, group);
    this.root.add(group);
  }

  /* =========================================================================
     4. DISTANT ORBITAL STATION (Far background landmark at z=-2200, clean silhouette)
     ========================================================================= */
  private buildDistantOrbitalStation(): void {
    const group = new THREE.Group();
    group.name = 'Env_Distant_Station';
    group.position.set(480, 240, -2200);

    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(180, 8, 8, 32), stationMat);
    ring.rotation.x = Math.PI / 2.5;
    group.add(ring);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, 120, 12), stationMat);
    group.add(hub);

    this.distantStation = group;
    this.envGroups.set(9, group);
    this.root.add(group);
  }

  /* =========================================================================
     5. SUBTLE AMBIENT SPACE DUST (Clean 40 particles, no blinding smoke or veil)
     ========================================================================= */
  private buildSubtleSpaceDust(): void {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 1] = -20 + Math.random() * 180;
      pos[i * 3 + 2] = -400 - Math.random() * 2000;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.ambientSpaceDust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      })
    );
    this.root.add(this.ambientSpaceDust);
  }

  /* =========================================================================
     6. MULTI-ROUTE COLLAPSE NETWORK (Clean side branches)
     ========================================================================= */
  private buildMultiRouteNetwork(): void {
    const group = new THREE.Group();
    group.name = 'Env_12_MultiRouteCollapse';

    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.25,
    });

    for (let s = 0; s < 3; s++) {
      const segGroup = new THREE.Group();
      const zPos = -700 - s * 450;
      const xPos = (s % 2 === 0 ? 1 : -1) * 90;

      segGroup.position.set(xPos, 20, zPos);
      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 140), routeMat);
      segGroup.add(segMesh);

      this.collapsibleRouteSegments.push({
        group: segGroup,
        mesh: segMesh,
        state: 'SAFE',
        collapseTimer: 0,
        fallVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          -35 - Math.random() * 25,
          (Math.random() - 0.5) * 15
        ),
      });

      group.add(segGroup);
    }

    this.envGroups.set(12, group);
    this.root.add(group);
  }

  /* =========================================================================
     7. EVENT 40: ABSOLUTE COSMIC END CLIMAX MESHES
     ========================================================================= */
  private buildEvent40AbsoluteCosmicEndClimaxMeshes(): void {
    const group = new THREE.Group();
    group.name = 'Env_40_AbsoluteCosmicEnd';

    const waveGeo = new THREE.SphereGeometry(160, 32, 24);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.darkWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.darkWaveMesh.position.copy(this.blackHoleCenter);
    group.add(this.darkWaveMesh);

    const implosionGeo = new THREE.SphereGeometry(380, 24, 18);
    const implosionMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0,
    });
    this.darkImplosionMesh = new THREE.Mesh(implosionGeo, implosionMat);
    this.darkImplosionMesh.position.copy(this.blackHoleCenter);
    group.add(this.darkImplosionMesh);

    // Final Collapse missed-route ending: a physical-looking singularity
    // detonation followed by reconstruction of the three escape corridors.
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.singularityCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), coreMat);
    this.singularityCoreMesh.position.copy(this.blackHoleCenter);
    group.add(this.singularityCoreMesh);

    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xff4b22,
      transparent: true,
      opacity: 0,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.singularityExplosionMesh = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 20), blastMat);
    this.singularityExplosionMesh.position.copy(this.blackHoleCenter);
    group.add(this.singularityExplosionMesh);

    const whiteRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.singularityShockRing = new THREE.Mesh(new THREE.TorusGeometry(110, 5, 12, 64), whiteRingMat);
    this.singularityShockRing.position.copy(this.blackHoleCenter);
    this.singularityShockRing.rotation.x = Math.PI / 2;
    group.add(this.singularityShockRing);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff2a12, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.singularityFlameRing = new THREE.Mesh(new THREE.TorusGeometry(165, 18, 10, 64), flameMat);
    this.singularityFlameRing.position.copy(this.blackHoleCenter);
    this.singularityFlameRing.rotation.x = Math.PI / 2;
    group.add(this.singularityFlameRing);

    const debrisCount = 420;
    const debrisPositions = new Float32Array(debrisCount * 3);
    for (let i = 0; i < debrisCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 100 + Math.random() * 900;
      debrisPositions[i * 3] = Math.cos(a) * r;
      debrisPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      debrisPositions[i * 3 + 2] = Math.sin(a) * r;
    }
    const debrisGeo = new THREE.BufferGeometry();
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
    this.singularityDebris = new THREE.Points(debrisGeo, new THREE.PointsMaterial({
      color: 0xffd8c2, size: 3.2, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.singularityDebris.position.copy(this.blackHoleCenter);
    group.add(this.singularityDebris);

    this.rebuildRouteGlow = new THREE.Group();
    this.rebuildRouteGlow.name = 'RebuiltEscapeRoutes';
    const rebuildColors = [0x22d3ee, 0xff3b81, 0xa855f7];
    const rebuildOffsets = [-105, 0, 105];
    for (let r = 0; r < 3; r++) {
      const material = new THREE.MeshBasicMaterial({
        color: rebuildColors[r], transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const corridor = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 620), material);
      corridor.position.set(rebuildOffsets[r], 12 + r * 4, this.blackHoleCenter.z + 500);
      corridor.rotation.y = (r - 1) * 0.16;
      this.rebuildRouteGlow.add(corridor);
    }
    this.rebuildRouteGlow.position.y = 0;
    group.add(this.rebuildRouteGlow);

    this.envGroups.set(40, group);
    this.root.add(group);
  }

  /* =========================================================================
     MASTER PER-FRAME UPDATE LOOP ACROSS 40 EVENTS
     ========================================================================= */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeedMps: number,
    cameraPos: THREE.Vector3,
    activeEventIndex: number,
    eventPhase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' | null,
    isEvacuationActive: boolean
  ): {
    collisionEvent: { hit: boolean; damage: number; impulse: THREE.Vector3; name: string } | null;
    blackScreenActive: boolean;
    cameraShakeIntensity: number;
    pairTelemetry: CosmicPairLiveTelemetry | null;
  } {
    const delta = Math.max(0, Math.min(dt, 0.15));
    this.elapsedSeconds += delta;
    this.currentEventIndex = activeEventIndex;

    // 0. Update 2-Element Cosmic Pair Simulation (Keplerian revolution, collision, spaghettification)
    const pairTelemetry = this.eventPairVisualizer.update(delta, activeEventIndex);
    this.latestPairTelemetry = pairTelemetry;

    let cameraShake = 0;
    let blackScreen = false;

    // 1. Update subtle drifting debris
    this.updateStreamlinedDebris(delta, activeEventIndex);

    // 2. Slow subtle celestial orbital rotation
    if (this.planetA) {
      this.planetA.rotation.y += delta * 0.015;
    }
    if (this.moon1) {
      this.moon1.position.x += Math.cos(this.elapsedSeconds * 0.1) * delta * 15;
      this.moon1.position.z += Math.sin(this.elapsedSeconds * 0.1) * delta * 15;
    }

    // 2B. Planetary collection and progressive tidal spaghettification.
    // Collection begins mid-collapse and intensifies through the final events.
    this.updatePlanetaryCollection(delta, activeEventIndex);

    // 3. Majestic Arch subtle tidal flex
    if (this.majesticArch && activeEventIndex >= 3) {
      const bend = Math.min(0.12, (activeEventIndex - 2) * 0.008);
      this.majesticArch.rotation.z = Math.PI + Math.sin(this.elapsedSeconds * 0.5) * bend;
    }

    // 4. Distant station slow rotation
    if (this.distantStation) {
      this.distantStation.rotation.y += delta * 0.04;
    }

    // 5. Multi-Route Collapses
    if (activeEventIndex >= 12) {
      this.collapsibleRouteSegments.forEach((seg, idx) => {
        if (activeEventIndex >= 12 + idx * 0.6) {
          if (seg.state === 'SAFE') {
            seg.state = 'COLLAPSING';
            sound.playStructureCreak();
          }
        }
        if (seg.state === 'COLLAPSING') {
          seg.group.position.addScaledVector(seg.fallVelocity, delta);
          seg.group.rotation.x += delta * 0.4;
          if (seg.group.position.y < -300) {
            seg.state = 'CONSUMED';
          }
        }
      });
    }

    // 6. Event 40 Climax
    if (activeEventIndex >= 40) {
      const climaxResult = this.updateEvent40AbsoluteCosmicEndClimax(delta);
      cameraShake = Math.max(cameraShake, climaxResult.cameraShake);
      blackScreen = climaxResult.blackScreen;
    }

    // 7. Near-field Physical Collisions (sparse and fair)
    const collisionEvent = this.checkNearFieldCollisions(playerPos, 4.2);

    return {
      collisionEvent,
      blackScreenActive: blackScreen,
      cameraShakeIntensity: cameraShake,
      pairTelemetry,
    };
  }

  /* -------------------------------------------------------------------------
     Subsystem Updaters
     ------------------------------------------------------------------------- */
  private updatePlanetaryCollection(dt: number, activeEvent: number): void {
    if (this.collectedPlanets.length === 0) return;

    // Keep the first events scenic; planetary collection becomes visible as the
    // black hole reaches the planetary-fragment phase (events 22+).
    const collectionProgress = THREE.MathUtils.clamp((activeEvent - 21) / 19, 0, 1);
    const tidalProgress = THREE.MathUtils.clamp((activeEvent - 23) / 17, 0, 1);

    this.collectedPlanets.forEach((planet, index) => {
      const phase = planet.seed + this.elapsedSeconds * (0.035 + index * 0.006);
      const pull = collectionProgress * collectionProgress;
      const orbitRadius = THREE.MathUtils.lerp(planet.orbitRadius, 420 + index * 75, pull);
      const angle = planet.orbitAngle + this.elapsedSeconds * (0.06 + index * 0.012) * (1 + pull * 2.5);

      const target = new THREE.Vector3(
        this.blackHoleCenter.x + Math.cos(angle) * orbitRadius,
        this.blackHoleCenter.y + 180 + Math.sin(angle * 1.4 + phase) * (260 + 420 * (1 - pull)),
        this.blackHoleCenter.z + Math.sin(angle) * orbitRadius
      );

      planet.group.position.lerp(target, Math.min(1, dt * (0.35 + pull * 1.8)));
      planet.group.rotation.y += dt * (0.12 + pull * 0.8);
      planet.group.rotation.z += dt * (0.04 + pull * 0.3);

      // Differential tidal stretch: longitudinal scale grows while the two
      // transverse axes compress, creating a clear non-graphic spaghetti shape.
      const stretch = 1 + tidalProgress * (2.5 + index * 0.35);
      const squeeze = Math.max(0.18, 1 - tidalProgress * 0.62);
      const wobble = 1 + Math.sin(this.elapsedSeconds * 4 + phase) * tidalProgress * 0.08;
      planet.core.scale.set(stretch * wobble, squeeze, squeeze);
      planet.atmosphere.scale.set(stretch * 1.05, squeeze * 1.08, squeeze * 1.08);

      // Spin-up as the body is collected.
      planet.core.rotation.x += dt * (0.18 + pull * 1.8);

      if (collectionProgress > 0.72) {
        planet.collected = true;
        const fade = THREE.MathUtils.clamp((collectionProgress - 0.72) / 0.28, 0, 1);
        const coreMat = planet.core.material as THREE.MeshStandardMaterial;
        const atmosphereMat = planet.atmosphere.material as THREE.MeshBasicMaterial;
        coreMat.emissiveIntensity = 0.08 + fade * 0.35;
        atmosphereMat.opacity = 0.10 + fade * 0.10;
      }

      // Near the singularity, convert the planet into a stretched infall stream
      // and recycle it to the far collection arc rather than deleting it.
      if (planet.group.position.distanceTo(this.blackHoleCenter) < 520) {
        planet.group.position.copy(this.blackHoleCenter).add(new THREE.Vector3(
          Math.cos(angle + Math.PI) * (900 + index * 120),
          240 + index * 80,
          Math.sin(angle + Math.PI) * (900 + index * 120)
        ));
        planet.collected = false;
      }
    });
  }

  private updateStreamlinedDebris(dt: number, activeEvent: number): void {
    if (!this.debrisInstancedMesh) return;
    const dummy = new THREE.Object3D();
    const speedMult = 1.0 + Math.max(0, activeEvent - 1) * 0.12;

    for (let i = 0; i < this.debrisData.length; i++) {
      const d = this.debrisData[i];
      const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, d.position);
      const dist = toBH.length();
      toBH.normalize();

      const gravPull = Math.min(45, (2400 / Math.max(250, dist)) * 10 * (activeEvent >= 10 ? 1.8 : 1.0));
      d.velocity.addScaledVector(toBH, gravPull * dt * 0.3);
      d.position.addScaledVector(d.velocity, dt * speedMult);
      d.rotation.x += d.rotSpeed.x * dt;
      d.rotation.y += d.rotSpeed.y * dt;

      if (dist < 320) {
        d.position.set(
          this.blackHoleCenter.x + (Math.random() - 0.5) * 1200,
          this.blackHoleCenter.y + 150 + Math.random() * 400,
          this.blackHoleCenter.z + 1600 + Math.random() * 1000
        );
        d.velocity.set(0, 0, 0);
      }

      dummy.position.copy(d.position);
      dummy.rotation.copy(d.rotation);
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();
      this.debrisInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.debrisInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  /* =========================================================================
     EVENT 40: ABSOLUTE COSMIC END CLIMAX SEQUENCE
     ========================================================================= */
  private updateEvent40AbsoluteCosmicEndClimax(dt: number): {
    blackScreen: boolean;
    cameraShake: number;
  } {
    this.climaxTimer += dt;
    const t = this.climaxTimer;
    let cameraShake = 0.8;
    const blackScreen = false;

    // 0-4s: the player and the surrounding world fall into a rotating
    // gravitational funnel. The world keeps moving; no terminal black frame.
    if (t < 4.0) {
      this.absoluteCollapsePhase = 'CONVERGENCE';
      cameraShake = 1.2 + t * 0.25;
      this.root.rotation.y += dt * (0.10 + t * 0.05);
      this.root.rotation.z = Math.sin(t * 1.7) * 0.035;
    } else if (t < 7.0) {
      this.absoluteCollapsePhase = 'MOTION_SLOW';
      cameraShake = 1.8;
      this.root.rotation.y += dt * 0.35;
      this.root.rotation.z = Math.sin(t * 2.2) * 0.08;
    } else if (t < 9.0) {
      this.absoluteCollapsePhase = 'NEAR_SILENCE';
      cameraShake = 0.2;
      this.root.rotation.y += dt * 0.55;
    } else if (t < 11.5) {
      this.absoluteCollapsePhase = 'GRAVITATIONAL_DISTORTION';
      cameraShake = 2.8;
      this.root.rotation.y += dt * 0.8;
      this.root.rotation.z = Math.sin(t * 4.0) * 0.16;
    } else if (t < 14.0) {
      if (this.absoluteCollapsePhase !== 'DARK_GRAVITATIONAL_PULSE') sound.playDarkGravitationalShockwave();
      this.absoluteCollapsePhase = 'DARK_GRAVITATIONAL_PULSE';
      cameraShake = 4.0;
      const pulse = 1 + (t - 11.5) * 7.0;
      this.darkWaveMesh.scale.setScalar(pulse);
      (this.darkWaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.7, (t - 11.5) * 0.25);
    } else if (t < 16.0) {
      if (this.absoluteCollapsePhase !== 'DARK_IMPLOSION') sound.playSubBassGravitationalImplosion();
      this.absoluteCollapsePhase = 'DARK_IMPLOSION';
      cameraShake = 5.0;
      const s = Math.max(0.15, 9.0 - (t - 14.0) * 4.2);
      this.darkImplosionMesh.scale.setScalar(s);
      (this.darkImplosionMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.95, (t - 14.0) * 0.5);
    } else if (t < 19.0) {
      if (this.absoluteCollapsePhase !== 'COSMIC_BOOM') sound.playDeepCosmicBoom();
      this.absoluteCollapsePhase = 'COSMIC_BOOM';
      cameraShake = 7.0;

      const blast = THREE.MathUtils.clamp((t - 16.0) / 3.0, 0, 1);
      this.singularityCoreMesh.scale.setScalar(1 + blast * 12);
      this.singularityExplosionMesh.scale.setScalar(0.6 + blast * 12);
      this.singularityShockRing.scale.setScalar(1 + blast * 10);
      this.singularityFlameRing.scale.setScalar(1 + blast * 7);
      (this.singularityCoreMesh.material as THREE.MeshBasicMaterial).opacity = 0.95 - blast * 0.75;
      (this.singularityExplosionMesh.material as THREE.MeshBasicMaterial).opacity = 0.9 - blast * 0.35;
      (this.singularityShockRing.material as THREE.MeshBasicMaterial).opacity = 0.95 - blast * 0.55;
      (this.singularityFlameRing.material as THREE.MeshBasicMaterial).opacity = 0.9 - blast * 0.45;
      (this.singularityDebris.material as THREE.PointsMaterial).opacity = blast * 0.9;
    } else if (t < 22.0) {
      this.absoluteCollapsePhase = 'ALL_COLLAPSED';
      cameraShake = Math.max(0.8, 5.0 - (t - 19.0) * 1.4);
      const fade = THREE.MathUtils.clamp((t - 19.0) / 3.0, 0, 1);
      this.singularityExplosionMesh.scale.multiplyScalar(1 + dt * 1.5);
      (this.singularityExplosionMesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - fade);
      (this.singularityFlameRing.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - fade);
      this.singularityDebris.rotation.y += dt * 0.9;
    } else if (t < 27.0) {
      this.absoluteCollapsePhase = 'ROUTE_REBUILD';
      cameraShake = Math.max(0, 0.8 - (t - 22.0) * 0.16);
      const rebuild = THREE.MathUtils.clamp((t - 22.0) / 5.0, 0, 1);
      this.rebuildRouteGlow.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = rebuild * 0.9;
        const s = THREE.MathUtils.smoothstep(rebuild, 0, 1);
        (child as THREE.Mesh).scale.set(0.2 + s * 0.8, 1, 0.15 + s * 0.85);
        (child as THREE.Mesh).position.y = 12 + index * 4 + Math.sin(rebuild * Math.PI) * 18;
      });
      this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, 0, Math.min(1, dt * 1.2));
      this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, 0, Math.min(1, dt * 1.2));
      (this.singularityDebris.material as THREE.PointsMaterial).opacity = Math.max(0, 0.9 - rebuild);
    } else if (t < 31.0) {
      this.absoluteCollapsePhase = 'SINGULARITY_ECHO';
      cameraShake = 0;
      this.rebuildRouteGlow.children.forEach(child => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.65 + Math.sin(t * 3.0) * 0.15;
      });
    } else {
      this.absoluteCollapsePhase = 'RESULTS_READY';
      cameraShake = 0;
      this.rebuildRouteGlow.children.forEach(child => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.35;
      });
      (this.singularityDebris.material as THREE.PointsMaterial).opacity = 0.12;
    }

    return { blackScreen, cameraShake };
  }

  /* =========================================================================
     NEAR-FIELD PHYSICAL COLLISION TEST:
     Tests player ship bounding sphere against sparse world obstacles.
     ========================================================================= */
  public checkNearFieldCollisions(
    playerPos: THREE.Vector3,
    playerRadius = 4.2
  ): { hit: boolean; damage: number; impulse: THREE.Vector3; name: string } | null {
    for (const obs of this.nearObstacles) {
      if (!obs.mesh.visible) continue;
      const d = playerPos.distanceTo(obs.position);
      if (d < playerRadius + obs.boundingRadius) {
        const normal = new THREE.Vector3().subVectors(playerPos, obs.position).normalize();
        const impulse = normal.multiplyScalar(30.0);

        sound.playCollision();
        sound.playScrapeSparks();

        return {
          hit: true,
          damage: obs.damageValue,
          impulse,
          name: obs.name,
        };
      }
    }
    return null;
  }

  /* =========================================================================
     CLEANUP / DISPOSAL
     ========================================================================= */
  public dispose(): void {
    this.scene.remove(this.root);
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.LineSegments) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    this.envGroups.clear();
    this.nearObstacles = [];
    this.collapsibleRouteSegments = [];
    this.collectedPlanets = [];
    this.eventPairVisualizer.dispose();
  }
}
