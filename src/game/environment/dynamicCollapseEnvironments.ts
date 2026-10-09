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
import {
  SpaghettificationVisuals,
  SpaghettificationTelemetry,
} from './spaghettificationVisuals';
import { FinalCollapseCivilization } from '../finalCollapse/finalCollapseCivilization';
import { FinalCollapseEventManager } from '../finalCollapse/finalCollapseEventManager';
import { CosmicPlanetarySystem } from '../finalCollapse/cosmicPlanetarySystem';
import { NeutronStarSystem } from '../finalCollapse/neutronStarSystem';
import { DynamicRouteGraphSystem } from '../finalCollapse/dynamicRouteGraphSystem';
import { FinalCollapsePhysicalMegaCities } from '../finalCollapse/finalCollapsePhysicalMegaCities';

export type { CosmicPairLiveTelemetry, SpaghettificationTelemetry };

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
 * DYNAMIC COLLAPSE ENVIRONMENTS MANAGER
 * 
 * Cinematic AAA-grade surrounding world for Submode 10: The Final Collapse:
 * - Direct visual alignment with the primary reference image:
 *   * Towering black hole with multi-layered fiery orange/white accretion disk & Einstein lensing
 *   * Dual-palette cosmic nebulae (electric indigo/violet on right/upper, fiery molten orange on left/lower)
 *   * Large modular space station & colossal orbital megastructure arch framing the upper sky
 *   * Controlled instanced asteroid field with glowing molten magma fissures
 *   * Distant sapphire planet and cratered moon in progressive tidal decay
 *   * Three physical escape routes (Orbital Launcher, Emergency Escape, Wormhole Escape)
 *   * Luminous neon track boundaries & circular holographic accelerator rings
 *   * 40-event progression, progressive environmental spaghettification, Event 40 collapse,
 *     aftermath, and 9-step universe reconstruction with majestic camera reveal.
 */
export class DynamicCollapseEnvironmentsManager {
  public root: THREE.Group;
  public scene: THREE.Scene;
  public blackHoleCenter: THREE.Vector3;
  public registry: PersistentDestructionRegistry;
  public eventPairVisualizer: CosmicEventPairVisualizer;
  public latestPairTelemetry: CosmicPairLiveTelemetry | null = null;
  public spaghettificationVisuals: SpaghettificationVisuals;
  public latestSpaghettificationTelemetry: SpaghettificationTelemetry | null = null;
  public detonationProgress = 0;

  // Environment Sub-Groups (1 to 40)
  public envGroups: Map<number, THREE.Group> = new Map();

  // Active Near-Field Collidable Obstacles
  private nearObstacles: PhysicalObstacle[] = [];

  // ================= 1. MOLTEN-VEINED ASTEROIDS (INSTANCED) =================
  public asteroidFieldGroup: THREE.Group;
  private asteroidInstancedMesh!: THREE.InstancedMesh;
  private readonly maxAsteroids = 140;
  private asteroidData: {
    position: THREE.Vector3;
    basePosition: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Euler;
    rotSpeed: THREE.Vector3;
    scale: number;
    filamentStretch: number;
    initialDistance: number;
    isMagma: boolean;
  }[] = [];

  // ================= 2. SPACE STATION & MEGASTRUCTURE ARCH =================
  private spaceStationGroup: THREE.Group | null = null;
  private stationRingMesh: THREE.Mesh | null = null;
  private stationHubMesh: THREE.Mesh | null = null;
  private stationTrussGroup: THREE.Group | null = null;
  private stationWindowsMesh: THREE.Mesh | null = null;
  private megastructureArch: THREE.Mesh | null = null;
  private megastructurePylons: THREE.Group | null = null;
  private stationTearSection: THREE.Mesh | null = null;
  private stationTearVelocity = new THREE.Vector3(12, -8, -18);

  // ================= 3. DISTANT PLANET & MOON =================
  private distantPlanetGroup: THREE.Group | null = null;
  private planetCoreMesh: THREE.Mesh | null = null;
  private planetAtmosphereMesh: THREE.Mesh | null = null;
  private moonMesh: THREE.Mesh | null = null;
  private planetDeformationProgress = 0;
  private planetFragmentationActive = false;
  private magmaStreamsPoints: THREE.Points | null = null;

  // Planetary collection / spaghettification set
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

  // ================= 4. THREE ESCAPE ROUTES VISUAL LANDMARKS =================
  private escapeRoutesVisualsGroup: THREE.Group | null = null;
  private route1LauncherGantry: THREE.Group | null = null;
  private route2EmergencyTower: THREE.Group | null = null;
  private route3WormholeRings: THREE.Group | null = null;

  // ================= 5. DUAL-PALETTE COSMIC NEBULA & WARPED STARFIELD =================
  private cosmicNebulaGroup: THREE.Group | null = null;
  private warpedStarfieldPoints: THREE.Points | null = null;

  // ================= 6. SPIRALING DEBRIS STREAMS =================
  private debrisStreamPoints: THREE.Points | null = null;
  private debrisStreamPositions!: Float32Array;
  private debrisStreamAngles!: Float32Array;
  private debrisStreamRadii!: Float32Array;
  private debrisStreamSpeeds!: Float32Array;
  private readonly debrisStreamCount = 280;

  // ================= 7. TRACK SURROUNDINGS & CIRCLING GANTRIES =================
  private trackFlankingGantriesGroup: THREE.Group | null = null;

  // ================= 8. COLLAPSIBLE ROUTE SEGMENTS =================
  private collapsibleRouteSegments: {
    group: THREE.Group;
    mesh: THREE.Mesh;
    state: 'SAFE' | 'UNSTABLE' | 'COLLAPSING' | 'DESTROYED' | 'CONSUMED';
    collapseTimer: number;
    fallVelocity: THREE.Vector3;
  }[] = [];

  // ================= 9. EVENT 40 CLIMAX & RECONSTRUCTION MESHES =================
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
    | 'BLACK_SCREEN'
    | 'AFTERMATH_PAUSE'
    | 'ROUTE_REBUILD'
    | 'REBUILD_FOUNDATION'
    | 'REBUILD_BOUNDARIES'
    | 'REBUILD_CHECKPOINTS'
    | 'REBUILD_ROUTES'
    | 'REBUILD_STATION'
    | 'REBUILD_MEGASTRUCTURE'
    | 'REBUILD_PARTICLES'
    | 'REBUILD_BLACK_HOLE'
    | 'SINGULARITY_ECHO'
    | 'FINAL_CAMERA_REVEAL'
    | 'RESULTS_READY' = 'IDLE';

  private climaxTimer = 0;
  private darkWaveMesh!: THREE.Mesh;
  private darkImplosionMesh!: THREE.Mesh;
  private singularityCoreMesh!: THREE.Mesh;
  private singularityExplosionMesh!: THREE.Mesh;
  private singularityShockRing!: THREE.Mesh;
  private singularityFlameRing!: THREE.Mesh;
  private rebuildRouteGlow!: THREE.Group;
  private rebuildHologramGroup!: THREE.Group;
  private singularityDebris!: THREE.Points;

  public currentEventIndex = 1;
  private elapsedSeconds = 0;

  // Persistent Futuristic Orbital Civilization & Unified 100 Events Controller
  public civilization: FinalCollapseCivilization;
  public planetarySystem: CosmicPlanetarySystem;
  public neutronStarSystem: NeutronStarSystem;
  public dynamicRouteGraph: DynamicRouteGraphSystem;
  public physicalMegaCities: FinalCollapsePhysicalMegaCities;
  public part1EventManager: FinalCollapseEventManager;
  public eventManager: FinalCollapseEventManager;

  constructor(scene: THREE.Scene, blackHolePosition = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePosition.clone();
    this.registry = PersistentDestructionRegistry.getInstance();
    this.root = new THREE.Group();
    this.root.name = 'DynamicCollapseEnvironments_Root';

    this.asteroidFieldGroup = new THREE.Group();
    this.asteroidFieldGroup.name = 'AsteroidFieldGroup';
    this.root.add(this.asteroidFieldGroup);

    // Persistent Futuristic Orbital Civilization
    this.civilization = new FinalCollapseCivilization(this.scene, this.blackHoleCenter);
    this.root.add(this.civilization.root);

    // Two Distinct Futuristic Mega-Cities & Physical Route Expansion (Part 2)
    this.physicalMegaCities = new FinalCollapsePhysicalMegaCities(this.scene, this.blackHoleCenter);
    this.root.add(this.physicalMegaCities.root);

    // Register active city hazards for near-field collision detection
    this.physicalMegaCities.hazards.forEach(h => {
      this.nearObstacles.push({
        mesh: h.group,
        boundingRadius: h.collisionRadius,
        position: h.position,
        velocity: new THREE.Vector3(),
        rotationSpeed: new THREE.Vector3(),
        damageValue: h.damageValue,
        environmentIndex: h.activationEvent,
        name: h.name,
      });
    });

    // 7-Planet Planetary Collapse System
    this.planetarySystem = new CosmicPlanetarySystem(this.scene, this.blackHoleCenter);
    this.root.add(this.planetarySystem.root);

    // Relativistic Neutron Star & Pulsar Phenomena
    this.neutronStarSystem = new NeutronStarSystem(this.scene, new THREE.Vector3(1450, 480, -2100));
    this.root.add(this.neutronStarSystem.root);

    // Dynamic Multi-Tier Physical Route Network & Jump Ramps
    this.dynamicRouteGraph = new DynamicRouteGraphSystem(this.scene, this.blackHoleCenter);
    this.root.add(this.dynamicRouteGraph.root);

    this.part1EventManager = new FinalCollapseEventManager(
      this.civilization,
      undefined,
      this.planetarySystem,
      this.neutronStarSystem,
      this.dynamicRouteGraph
    );
    this.eventManager = this.part1EventManager;

    // Build the rich, immersive environment
    this.buildMoltenAsteroidField();
    this.buildSpaceStationAndMegastructure();
    this.buildDistantPlanetAndMoon();
    this.buildPlanetaryCollectionSystem();
    this.buildThreeEscapeRouteVisuals();
    this.buildCosmicNebulaAndStars();
    this.buildSpiralingDebrisStreams();
    this.buildTrackFlankingGantries();
    this.buildMultiRouteNetwork();
    this.buildEvent40AbsoluteCosmicEndClimaxMeshes();

    // 2-Element Cosmic Pair Simulation (Keplerian physics & tidal deformation)
    this.eventPairVisualizer = new CosmicEventPairVisualizer(this.scene, this.blackHoleCenter);

    // Spaghettification visual ribbons & accretion streamers
    this.spaghettificationVisuals = new SpaghettificationVisuals(this.scene, this.blackHoleCenter);

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. MOLTEN-VEINED ASTEROIDS FIELD (InstancedMesh with Glowing Magma Fissures)
     ========================================================================= */
  private buildMoltenAsteroidField(): void {
    const geo = new THREE.DodecahedronGeometry(5.0, 1);
    // Deform vertices slightly to give natural craggy irregular asteroid profiles
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const noise = 1.0 + (Math.sin(vertex.x * 2.1) + Math.cos(vertex.y * 2.8) + Math.sin(vertex.z * 1.9)) * 0.16;
      vertex.multiplyScalar(noise);
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();

    // Shader material: dark craggy basalt rock with glowing orange magma fissures
    const asteroidMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMagmaGlow: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uMagmaGlow;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 rockColor = vec3(0.08, 0.09, 0.12);
          vec3 magmaCore = vec3(1.0, 0.72, 0.18);
          vec3 magmaOrange = vec3(1.0, 0.28, 0.0);
          vec3 magmaCrimson = vec3(0.55, 0.05, 0.0);

          // Procedural magma fissures
          float crackNoise = sin(vWorldPosition.x * 0.08 + sin(vWorldPosition.y * 0.06)) *
                             cos(vWorldPosition.z * 0.08 + cos(vWorldPosition.x * 0.05));
          float crackMask = smoothstep(0.68, 0.94, abs(crackNoise));

          // Directional light from black hole accretion glow
          vec3 lightDir = normalize(vec3(0.0, 180.0, -3500.0) - vWorldPosition);
          float diff = max(0.12, dot(vNormal, lightDir));

          vec3 finalColor = rockColor * (0.35 + diff * 0.75);
          if (crackMask > 0.01) {
            float pulse = 0.8 + 0.2 * sin(uTime * 3.0 + vWorldPosition.y * 0.1);
            vec3 glow = mix(magmaOrange, magmaCore, crackMask) * crackMask * 2.8 * pulse * uMagmaGlow;
            finalColor += glow;
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      roughness: 0.85,
    } as any);

    this.asteroidInstancedMesh = new THREE.InstancedMesh(geo, asteroidMat, this.maxAsteroids);
    this.asteroidInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.maxAsteroids; i++) {
      const angle = (i / this.maxAsteroids) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      // Controlled spatial distribution around track and black hole horizon
      const radius = 220 + Math.random() * 1800;
      const height = -120 + Math.random() * 680;
      const z = -450 - Math.random() * 3200;

      const pos = new THREE.Vector3(Math.cos(angle) * radius, height, z);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 3.0
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );
      const s = 0.6 + Math.random() * 2.8;

      this.asteroidData.push({
        position: pos.clone(),
        basePosition: pos.clone(),
        velocity: vel,
        rotation: rot,
        rotSpeed,
        scale: s,
        filamentStretch: 1.0,
        initialDistance: pos.distanceTo(this.blackHoleCenter),
        isMagma: Math.random() > 0.35,
      });

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.asteroidInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    this.asteroidFieldGroup.add(this.asteroidInstancedMesh);
  }

  /* =========================================================================
     2. SPACE STATION & MEGASTRUCTURE ARCH (Framing the upper-left horizon)
     ========================================================================= */
  private buildSpaceStationAndMegastructure(): void {
    const group = new THREE.Group();
    group.name = 'Env_SpaceStation_Megastructure';

    // A. Futuristic Space Station (positioned at upper-left: x=-850, y=420, z=-1900)
    this.spaceStationGroup = new THREE.Group();
    this.spaceStationGroup.name = 'Orbital_Space_Station';
    this.spaceStationGroup.position.set(-850, 420, -1900);

    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x222e42,
      metalness: 0.88,
      roughness: 0.28,
      emissive: 0x075985,
      emissiveIntensity: 0.45,
    });

    // Primary Torus Ring (diameter 260m)
    const ringGeo = new THREE.TorusGeometry(130, 9, 16, 48);
    this.stationRingMesh = new THREE.Mesh(ringGeo, stationMat);
    this.stationRingMesh.rotation.x = Math.PI / 2.3;
    this.spaceStationGroup.add(this.stationRingMesh);

    // Inner Observation Windows (Golden illuminated ports matching reference image)
    const winGeo = new THREE.TorusGeometry(129, 3, 8, 48);
    const winMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.9,
    });
    this.stationWindowsMesh = new THREE.Mesh(winGeo, winMat);
    this.stationWindowsMesh.rotation.x = Math.PI / 2.3;
    this.spaceStationGroup.add(this.stationWindowsMesh);

    // Central Spindle & Docking Hub
    const hubGeo = new THREE.CylinderGeometry(16, 22, 180, 16);
    this.stationHubMesh = new THREE.Mesh(hubGeo, stationMat);
    this.stationHubMesh.rotation.z = Math.PI / 6;
    this.spaceStationGroup.add(this.stationHubMesh);

    // Radial Structural Spokes
    this.stationTrussGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(6, 6, 128);
      const spoke = new THREE.Mesh(spokeGeo, stationMat);
      spoke.rotation.y = angle;
      this.stationTrussGroup.add(spoke);
    }
    this.spaceStationGroup.add(this.stationTrussGroup);

    // Breakaway section for Event 20 (Structural Tear)
    const tearGeo = new THREE.TorusGeometry(130, 9, 16, 12, Math.PI / 3);
    this.stationTearSection = new THREE.Mesh(tearGeo, stationMat);
    this.stationTearSection.position.set(0, 0, 0);
    this.stationTearSection.visible = false;
    this.spaceStationGroup.add(this.stationTearSection);

    group.add(this.spaceStationGroup);

    // B. Colossal Megastructure Arch (Spans across the upper sky at y=280, z=-2400)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.22,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const archGeo = new THREE.TorusGeometry(540, 14, 12, 64, Math.PI * 0.92);
    this.megastructureArch = new THREE.Mesh(archGeo, archMat);
    this.megastructureArch.position.set(-280, 160, -2400);
    this.megastructureArch.rotation.z = Math.PI * 0.98;
    this.megastructureArch.rotation.y = 0.25;
    group.add(this.megastructureArch);

    // Energy conduits along arch
    this.megastructurePylons = new THREE.Group();
    const neonRailGeo = new THREE.TorusGeometry(536, 2.5, 6, 64, Math.PI * 0.92);
    const neonRailMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonRail = new THREE.Mesh(neonRailGeo, neonRailMat);
    neonRail.position.copy(this.megastructureArch.position);
    neonRail.rotation.copy(this.megastructureArch.rotation);
    this.megastructurePylons.add(neonRail);
    group.add(this.megastructurePylons);

    this.envGroups.set(9, group);
    this.root.add(group);
  }

  /* =========================================================================
     3. DISTANT PLANET & MOON (Serene celestial bodies with atmospheric rim)
     ========================================================================= */
  private buildDistantPlanetAndMoon(): void {
    const group = new THREE.Group();
    group.name = 'Env_Distant_Planet_Moon';
    group.position.set(-1800, 680, -3200);

    // Sapphire Terrestrial Giant (radius 360m)
    const planetGeo = new THREE.SphereGeometry(360, 36, 28);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e40af,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x0c2563,
      emissiveIntensity: 0.25,
    });
    this.planetCoreMesh = new THREE.Mesh(planetGeo, planetMat);
    group.add(this.planetCoreMesh);

    // Soft Atmospheric Rim Glow
    const atmoGeo = new THREE.SphereGeometry(385, 32, 24);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    this.planetAtmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    group.add(this.planetAtmosphereMesh);

    // Moon (radius 85m, orbiting at offset)
    const moonGeo = new THREE.SphereGeometry(85, 24, 18);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.88,
      metalness: 0.08,
      emissive: 0x1e293b,
      emissiveIntensity: 0.15,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(780, 240, 420);
    group.add(this.moonMesh);

    // Magma stream particle points for Event 24 (Planetary Fragmentation)
    const magmaCount = 160;
    const magmaGeo = new THREE.BufferGeometry();
    const magmaPos = new Float32Array(magmaCount * 3);
    for (let i = 0; i < magmaCount; i++) {
      magmaPos[i * 3] = (Math.random() - 0.5) * 200;
      magmaPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      magmaPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    magmaGeo.setAttribute('position', new THREE.BufferAttribute(magmaPos, 3));
    const magmaMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 14,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.magmaStreamsPoints = new THREE.Points(magmaGeo, magmaMat);
    this.magmaStreamsPoints.position.set(0, 0, 0);
    group.add(this.magmaStreamsPoints);

    this.distantPlanetGroup = group;
    this.envGroups.set(2, group);
    this.root.add(group);
  }

  /* =========================================================================
     3B. PLANETARY COLLECTION & TIDAL DEFORMATION SYSTEM
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
     4. THREE PHYSICAL ESCAPE ROUTES VISUAL LANDMARKS
     ========================================================================= */
  private buildThreeEscapeRouteVisuals(): void {
    this.escapeRoutesVisualsGroup = new THREE.Group();
    this.escapeRoutesVisualsGroup.name = 'Env_ThreeEscapeRoutes';

    // Route 01: Orbital Launcher Tower & Platform (Right corridor, z=-3100)
    this.route1LauncherGantry = new THREE.Group();
    this.route1LauncherGantry.name = 'Route01_LauncherGantry';
    this.route1LauncherGantry.position.set(450, 120, -3100);

    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    // Tower vertical spine
    const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 280, 24), gantryMat);
    this.route1LauncherGantry.add(towerMesh);

    // 3 Acceleration Rings along launch vector
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(32, 3, 12, 32),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      ring.position.set(0, 40 + r * 60, -r * 80);
      this.route1LauncherGantry.add(ring);
    }
    this.escapeRoutesVisualsGroup.add(this.route1LauncherGantry);

    // Route 02: Emergency Escape Corridor (Central lower, z=-2800)
    this.route2EmergencyTower = new THREE.Group();
    this.route2EmergencyTower.name = 'Route02_EmergencyTower';
    this.route2EmergencyTower.position.set(0, -60, -2800);

    const emerMat = new THREE.MeshStandardMaterial({
      color: 0x1f1610,
      metalness: 0.85,
      roughness: 0.35,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
    });
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(70, 40, 120), emerMat);
    this.route2EmergencyTower.add(bunker);

    // Flashing hazard beacons
    const beaconGeo = new THREE.SphereGeometry(4, 12, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const beacon1 = new THREE.Mesh(beaconGeo, beaconMat);
    beacon1.position.set(-32, 22, 50);
    const beacon2 = new THREE.Mesh(beaconGeo, beaconMat);
    beacon2.position.set(32, 22, 50);
    this.route2EmergencyTower.add(beacon1, beacon2);
    this.escapeRoutesVisualsGroup.add(this.route2EmergencyTower);

    // Route 03: Wormhole Escape Gateway (Left corridor, z=-3300)
    this.route3WormholeRings = new THREE.Group();
    this.route3WormholeRings.name = 'Route03_WormholeGateway';
    this.route3WormholeRings.position.set(-520, 150, -3300);

    // Concentric rotating rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(54, 4, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xc084fc })
    );
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(38, 3, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    this.route3WormholeRings.add(ring1, ring2);

    // Glowing Einstein-Rosen throat disc
    const throatMesh = new THREE.Mesh(
      new THREE.CircleGeometry(32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    this.route3WormholeRings.add(throatMesh);
    this.escapeRoutesVisualsGroup.add(this.route3WormholeRings);

    this.envGroups.set(15, this.escapeRoutesVisualsGroup);
    this.root.add(this.escapeRoutesVisualsGroup);
  }

  /* =========================================================================
     5. DUAL-PALETTE COSMIC NEBULA & WARPED STARFIELD
     ========================================================================= */
  private buildCosmicNebulaAndStars(): void {
    this.cosmicNebulaGroup = new THREE.Group();
    this.cosmicNebulaGroup.name = 'Env_CosmicNebula_Stars';

    // A. Dual-Palette Nebula Gas Billows (Rich Indigo/Violet right & Molten Orange left)
    const nebulaCount = 18;
    for (let i = 0; i < nebulaCount; i++) {
      const isViolet = i % 2 === 0;
      const geo = new THREE.PlaneGeometry(1600 + Math.random() * 800, 1400 + Math.random() * 600);
      const mat = new THREE.MeshBasicMaterial({
        color: isViolet ? 0x4f46e5 : 0xea580c,
        transparent: true,
        opacity: 0.05 + Math.random() * 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const cloud = new THREE.Mesh(geo, mat);
      const sideSign = isViolet ? 1 : -1;
      cloud.position.set(
        sideSign * (800 + Math.random() * 1400),
        200 + Math.random() * 800,
        -2800 - Math.random() * 1800
      );
      cloud.rotation.z = Math.random() * Math.PI;
      this.cosmicNebulaGroup.add(cloud);
    }

    // B. Warped Gravitational Starfield (800 particles with relativistic deflection)
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;
      const dist = 3800 + Math.random() * 1600;

      const x = Math.cos(phi) * Math.cos(theta) * dist;
      const y = Math.sin(phi) * dist;
      const z = Math.cos(phi) * Math.sin(theta) * dist;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color variation: blue-white, golden, deep indigo
      const rand = Math.random();
      if (rand < 0.5) {
        starColors[i * 3] = 0.85;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      } else if (rand < 0.8) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.82;
        starColors[i * 3 + 2] = 0.45;
      } else {
        starColors[i * 3] = 0.72;
        starColors[i * 3 + 1] = 0.55;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.warpedStarfieldPoints = new THREE.Points(starGeo, starMat);
    this.cosmicNebulaGroup.add(this.warpedStarfieldPoints);

    this.root.add(this.cosmicNebulaGroup);
  }

  /* =========================================================================
     6. SPIRALING DEBRIS STREAMS (Infalling particles accelerating into the void)
     ========================================================================= */
  private buildSpiralingDebrisStreams(): void {
    const geo = new THREE.BufferGeometry();
    this.debrisStreamPositions = new Float32Array(this.debrisStreamCount * 3);
    this.debrisStreamAngles = new Float32Array(this.debrisStreamCount);
    this.debrisStreamRadii = new Float32Array(this.debrisStreamCount);
    this.debrisStreamSpeeds = new Float32Array(this.debrisStreamCount);

    for (let i = 0; i < this.debrisStreamCount; i++) {
      this.debrisStreamAngles[i] = Math.random() * Math.PI * 2;
      this.debrisStreamRadii[i] = 400 + Math.random() * 2600;
      this.debrisStreamSpeeds[i] = 0.2 + Math.random() * 0.6;

      const angle = this.debrisStreamAngles[i];
      const r = this.debrisStreamRadii[i];
      this.debrisStreamPositions[i * 3] = this.blackHoleCenter.x + Math.cos(angle) * r;
      this.debrisStreamPositions[i * 3 + 1] = this.blackHoleCenter.y + (Math.random() - 0.5) * 350;
      this.debrisStreamPositions[i * 3 + 2] = this.blackHoleCenter.z + Math.sin(angle) * r;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.debrisStreamPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 9,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.debrisStreamPoints = new THREE.Points(geo, mat);
    this.root.add(this.debrisStreamPoints);
  }

  /* =========================================================================
     7. TRACK FLANKING GANTRIES & ROUTE PLATFORMS
     ========================================================================= */
  private buildTrackFlankingGantries(): void {
    this.trackFlankingGantriesGroup = new THREE.Group();
    this.trackFlankingGantriesGroup.name = 'Env_TrackFlankingGantries';

    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.88,
      roughness: 0.32,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
    });

    // Flank the track at intervals with architectural pylons & broken spans
    for (let i = 0; i < 8; i++) {
      const z = -350 - i * 380;
      const xLeft = -120 - Math.sin(i * 0.8) * 40;
      const xRight = 120 + Math.sin(i * 0.8) * 40;

      // Left architectural pylon
      const leftPylon = new THREE.Mesh(new THREE.BoxGeometry(12, 90, 18), pylonMat);
      leftPylon.position.set(xLeft, 25, z);
      this.trackFlankingGantriesGroup.add(leftPylon);

      // Right architectural pylon
      const rightPylon = new THREE.Mesh(new THREE.BoxGeometry(12, 90, 18), pylonMat);
      rightPylon.position.set(xRight, 25, z);
      this.trackFlankingGantriesGroup.add(rightPylon);
    }

    this.root.add(this.trackFlankingGantriesGroup);
  }

  /* =========================================================================
     8. MULTI-ROUTE COLLAPSE NETWORK (Side branches)
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
     9. EVENT 40: ABSOLUTE COSMIC END CLIMAX & RECONSTRUCTION MESHES
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
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.singularityExplosionMesh = new THREE.Mesh(new THREE.SphereGeometry(65, 32, 24), blastMat);
    this.singularityExplosionMesh.position.copy(this.blackHoleCenter);
    group.add(this.singularityExplosionMesh);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd480,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.singularityShockRing = new THREE.Mesh(new THREE.RingGeometry(25, 48, 64), ringMat);
    this.singularityShockRing.position.copy(this.blackHoleCenter);
    this.singularityShockRing.rotation.x = Math.PI / 2.3;
    group.add(this.singularityShockRing);

    const flameRingMat = new THREE.MeshBasicMaterial({
      color: 0xff2e12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.singularityFlameRing = new THREE.Mesh(new THREE.RingGeometry(18, 85, 64), flameRingMat);
    this.singularityFlameRing.position.copy(this.blackHoleCenter);
    this.singularityFlameRing.rotation.x = Math.PI / 2.45;
    group.add(this.singularityFlameRing);

    // Singularity aftermath debris
    const debrisGeo = new THREE.BufferGeometry();
    const debrisPos = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      debrisPos[i * 3] = (Math.random() - 0.5) * 800;
      debrisPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
      debrisPos[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
    this.singularityDebris = new THREE.Points(
      debrisGeo,
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 7,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    this.singularityDebris.position.copy(this.blackHoleCenter);
    group.add(this.singularityDebris);

    // 9-Step World Reconstruction Hologram Group
    this.rebuildHologramGroup = new THREE.Group();
    this.rebuildHologramGroup.name = 'WorldReconstructionHolograms';

    this.rebuildRouteGlow = new THREE.Group();
    const glowColors = [0x00f0ff, 0xa855f7, 0xf59e0b];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Mesh(
        new THREE.CylinderGeometry(18, 24, 750, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: glowColors[i],
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      g.position.set((i - 1) * 160, 20, -1800 - i * 350);
      g.rotation.x = Math.PI / 2;
      this.rebuildRouteGlow.add(g);
    }
    this.rebuildHologramGroup.add(this.rebuildRouteGlow);
    group.add(this.rebuildHologramGroup);

    this.envGroups.set(40, group);
    this.root.add(group);
  }

  /* =========================================================================
     UPDATE METHOD
     ========================================================================= */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeedMps: number,
    cameraPos: THREE.Vector3,
    activeEventIndex: number,
    eventPhase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' | null,
    isEvacuationActive: boolean,
    isMissedEscapeSequence = false,
    missedEscapePhase = 0,
    authoritativeElapsed?: number
  ): {
    collisionEvent: { hit: boolean; damage: number; impulse: THREE.Vector3; name: string } | null;
    blackScreenActive: boolean;
    cameraShakeIntensity: number;
    pairTelemetry: CosmicPairLiveTelemetry | null;
    spaghettificationTelemetry: SpaghettificationTelemetry | null;
  } {
    const delta = Math.max(0, Math.min(dt, 0.15));
    this.elapsedSeconds += delta;
    this.currentEventIndex = activeEventIndex;

    // 0A. Update Part 1 (Events 1–33) Event Manager & Persistent Orbital Civilization
    const elapsedToUse = authoritativeElapsed !== undefined ? authoritativeElapsed : this.elapsedSeconds;
    this.part1EventManager.update(delta, elapsedToUse);

    // 0B. Update 7-Planet Planetary Collapse System across 100 Events
    this.planetarySystem.update(delta, activeEventIndex, elapsedToUse);

    // 0C. Update Relativistic Neutron Star & Pulsar Phenomena
    this.neutronStarSystem.update(delta, activeEventIndex, playerPos);

    // 0D. Update Dynamic Multi-Tier Physical Route Network & Jump Ramps
    this.dynamicRouteGraph.update(delta, activeEventIndex);

    // 0E. Update Part 2 Physical Mega-Cities, Hazards & Wormhole Shortcuts
    const cityResult = this.physicalMegaCities.update(delta, activeEventIndex, playerPos);

    // 0. Update 2-Element Cosmic Pair Simulation (Keplerian physics & tidal deformation)
    const pairTelemetry = this.eventPairVisualizer.update(delta, activeEventIndex);
    this.latestPairTelemetry = pairTelemetry;

    // 0B. Update Spaghettification Visuals
    const spaghettificationTelemetry = this.spaghettificationVisuals.update(
      delta,
      activeEventIndex,
      playerPos,
      isMissedEscapeSequence,
      missedEscapePhase
    );
    this.latestSpaghettificationTelemetry = spaghettificationTelemetry;

    let cameraShake = 0;
    let blackScreen = false;

    // 1. Update Molten Asteroid Field
    this.updateAsteroidField(delta, activeEventIndex);

    // 2. Update Space Station & Megastructure (Rotations, stretching, tearing)
    this.updateSpaceStationAndMegastructure(delta, activeEventIndex);

    // 3. Update Distant Planet & Moon (Tidal deformation & fragmentation)
    this.updateDistantPlanetAndMoon(delta, activeEventIndex);

    // 4. Update Planetary Collection System
    this.updatePlanetaryCollection(delta, activeEventIndex);

    // 5. Update Escape Routes Visuals (Wormhole spin, beacon blink)
    this.updateEscapeRoutesVisuals(delta, activeEventIndex);

    // 6. Update Spiraling Debris Streams
    this.updateSpiralingDebrisStreams(delta, activeEventIndex);

    // 7. Update Collapsible Route Segments (Events 12, 32, 38)
    this.updateCollapsibleRoutes(delta, activeEventIndex);

    // 8. Event 100: Absolute Cosmic End Climax & Reconstruction
    if (activeEventIndex >= 100) {
      const climaxResult = this.updateEvent40AbsoluteCosmicEndClimax(delta);
      cameraShake = Math.max(cameraShake, climaxResult.cameraShake);
      blackScreen = climaxResult.blackScreen;
    }

    // 9. Check near-field collisions
    const collisionEvent = this.checkNearFieldCollisions(playerPos);

    return {
      collisionEvent,
      blackScreenActive: blackScreen,
      cameraShakeIntensity: cameraShake,
      pairTelemetry,
      spaghettificationTelemetry,
    };
  }

  /* =========================================================================
     ASTEROID FIELD UPDATE (Motion, rotation, progressive tidal stretching)
     ========================================================================= */
  private updateAsteroidField(dt: number, activeEvent: number): void {
    if (!this.asteroidInstancedMesh) return;
    const dummy = new THREE.Object3D();
    const speedMult = 1.0 + Math.max(0, activeEvent - 1) * 0.05;
    const eventInfallFactor = 1.0 + Math.pow(Math.min(100, activeEvent) / 100, 1.3) * 3.5;

    for (let i = 0; i < this.asteroidData.length; i++) {
      const d = this.asteroidData[i];
      const relPos = new THREE.Vector3().subVectors(d.position, this.blackHoleCenter);
      const horizontalDist = Math.sqrt(relPos.x * relPos.x + relPos.z * relPos.z);
      const totalDist = relPos.length();

      // Tangential Keplerian orbital velocity around black hole center Y-axis
      const currentAngle = Math.atan2(relPos.z, relPos.x);
      const orbitalSpeed = Math.min(240, (1400 / Math.max(450, horizontalDist)) * 45 * speedMult);
      const newAngle = currentAngle + (orbitalSpeed / Math.max(300, horizontalDist)) * dt;

      // Radial orbital decay: losing altitude and spiraling into accretion disk
      const decaySpeed = (35 + (2200 / Math.max(350, horizontalDist)) * 28) * eventInfallFactor;
      const newHorizontalDist = Math.max(180, horizontalDist - decaySpeed * dt);

      // Gas drag in accretion disk dampens vertical oscillation toward accretion plane
      const targetY = THREE.MathUtils.lerp(d.position.y, this.blackHoleCenter.y, dt * (horizontalDist < 1200 ? 1.4 : 0.25));

      d.position.set(
        this.blackHoleCenter.x + Math.cos(newAngle) * newHorizontalDist,
        targetY,
        this.blackHoleCenter.z + Math.sin(newAngle) * newHorizontalDist
      );

      d.rotation.x += d.rotSpeed.x * dt * speedMult;
      d.rotation.y += d.rotSpeed.y * dt * speedMult;
      d.rotation.z += d.rotSpeed.z * dt * speedMult;

      // Extreme tidal elongation inside accretion disk boundary (r < 1100)
      if (horizontalDist < 1100) {
        const tidalRatio = (1100 - horizontalDist) / 800;
        d.filamentStretch = Math.min(5.2, 1.0 + tidalRatio * 3.8 * (activeEvent >= 15 ? 1.5 : 1.0));
      } else {
        d.filamentStretch = 1.0;
      }

      // Terminal ISCO disruption: plunge into event horizon & respawn at outer orbit
      if (totalDist < 340) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnRadius = 2400 + Math.random() * 1200;
        d.position.set(
          this.blackHoleCenter.x + Math.cos(spawnAngle) * spawnRadius,
          this.blackHoleCenter.y + (Math.random() - 0.5) * 600,
          this.blackHoleCenter.z + Math.sin(spawnAngle) * spawnRadius
        );
        d.velocity.set(0, 0, 0);
        d.filamentStretch = 1.0;
      }

      dummy.position.copy(d.position);
      dummy.rotation.copy(d.rotation);
      dummy.scale.set(
        d.scale / Math.sqrt(d.filamentStretch),
        d.scale / Math.sqrt(d.filamentStretch),
        d.scale * d.filamentStretch
      );
      dummy.updateMatrix();
      this.asteroidInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  /* =========================================================================
     SPACE STATION & MEGASTRUCTURE UPDATE
     ========================================================================= */
  private updateSpaceStationAndMegastructure(dt: number, activeEvent: number): void {
    if (!this.spaceStationGroup) return;

    // Normal slow rotation
    if (this.stationRingMesh) {
      this.stationRingMesh.rotation.z += dt * 0.25;
    }
    if (this.stationWindowsMesh) {
      this.stationWindowsMesh.rotation.z += dt * 0.25;
    }

    // Event 17: Station begins stretching along tidal axis
    if (activeEvent >= 17) {
      const stretch = Math.min(2.8, 1.0 + (activeEvent - 16) * 0.12);
      this.spaceStationGroup.scale.set(1.0 / Math.sqrt(stretch), 1.0 / Math.sqrt(stretch), stretch);
    }

    // Event 20: Structural Tear (Breakaway section tumbles into space)
    if (activeEvent >= 20 && this.stationTearSection) {
      this.stationTearSection.visible = true;
      this.stationTearSection.position.addScaledVector(this.stationTearVelocity, dt);
      this.stationTearSection.rotation.x += dt * 0.8;
      this.stationTearSection.rotation.y += dt * 0.6;
    }

    // Megastructure Arch subtle vibration & bending
    if (this.megastructureArch && activeEvent >= 26) {
      this.megastructureArch.position.y = 160 + Math.sin(this.elapsedSeconds * 2.5) * 6;
      this.megastructureArch.rotation.x = Math.sin(this.elapsedSeconds * 1.8) * 0.04;
    }
  }

  /* =========================================================================
     DISTANT PLANET & MOON UPDATE
     ========================================================================= */
  private updateDistantPlanetAndMoon(dt: number, activeEvent: number): void {
    if (!this.distantPlanetGroup) return;

    // Slow rotation
    if (this.planetCoreMesh) {
      this.planetCoreMesh.rotation.y += dt * 0.02;
    }

    // Moon orbit
    if (this.moonMesh) {
      const mAngle = this.elapsedSeconds * 0.08;
      this.moonMesh.position.x = Math.cos(mAngle) * 780;
      this.moonMesh.position.z = Math.sin(mAngle) * 780;
      this.moonMesh.rotation.y += dt * 0.04;
    }

    // Event 23: Planet deforms into prolate tidal ellipsoid
    if (activeEvent >= 23 && this.planetCoreMesh) {
      this.planetDeformationProgress = Math.min(2.4, 1.0 + (activeEvent - 22) * 0.18);
      this.planetCoreMesh.scale.set(
        1.0 / Math.sqrt(this.planetDeformationProgress),
        1.0 / Math.sqrt(this.planetDeformationProgress),
        this.planetDeformationProgress
      );
    }

    // Event 24: Planetary Fragmentation (Magma streams erupt into space)
    if (activeEvent >= 24 && this.magmaStreamsPoints) {
      const mat = this.magmaStreamsPoints.material as THREE.PointsMaterial;
      mat.opacity = Math.min(0.85, (activeEvent - 23) * 0.2);
      this.magmaStreamsPoints.rotation.y += dt * 0.45;
    }
  }

  /* =========================================================================
     PLANETARY COLLECTION UPDATE
     ========================================================================= */
  private updatePlanetaryCollection(dt: number, activeEvent: number): void {
    this.collectedPlanets.forEach((planet, index) => {
      planet.orbitAngle += dt * (0.015 + index * 0.005);
      planet.core.rotation.y += dt * 0.02;

      // In later events, pull toward black hole
      if (activeEvent >= 22) {
        const pullFactor = Math.min(0.6, (activeEvent - 21) * 0.035);
        planet.group.position.lerp(this.blackHoleCenter, dt * pullFactor);
      }
    });
  }

  /* =========================================================================
     ESCAPE ROUTES VISUALS UPDATE
     ========================================================================= */
  private updateEscapeRoutesVisuals(dt: number, activeEvent: number): void {
    // Wormhole Gateway rotation
    if (this.route3WormholeRings) {
      this.route3WormholeRings.children.forEach((child, idx) => {
        child.rotation.z += dt * (idx === 0 ? 0.8 : -1.2);
      });
    }

    // Flashing hazard beacons for emergency tower
    if (this.route2EmergencyTower) {
      const blink = Math.sin(this.elapsedSeconds * 6.0) > 0 ? 1.0 : 0.2;
      this.route2EmergencyTower.children.forEach(c => {
        if ((c as THREE.Mesh).material && ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color) {
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = blink;
        }
      });
    }
  }

  /* =========================================================================
     SPIRALING DEBRIS STREAMS UPDATE
     ========================================================================= */
  private updateSpiralingDebrisStreams(dt: number, activeEvent: number): void {
    if (!this.debrisStreamPoints) return;
    const speedMult = 1.0 + Math.max(0, activeEvent - 1) * 0.15;

    for (let i = 0; i < this.debrisStreamCount; i++) {
      this.debrisStreamAngles[i] += dt * this.debrisStreamSpeeds[i] * speedMult;
      // Gently contract inward toward singularity
      this.debrisStreamRadii[i] -= dt * (25 + activeEvent * 4);

      if (this.debrisStreamRadii[i] < 240) {
        this.debrisStreamRadii[i] = 1800 + Math.random() * 1200;
      }

      const angle = this.debrisStreamAngles[i];
      const r = this.debrisStreamRadii[i];
      this.debrisStreamPositions[i * 3] = this.blackHoleCenter.x + Math.cos(angle) * r;
      this.debrisStreamPositions[i * 3 + 2] = this.blackHoleCenter.z + Math.sin(angle) * r;
    }

    const posAttr = this.debrisStreamPoints.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
  }

  /* =========================================================================
     COLLAPSIBLE ROUTES UPDATE (Events 12, 32, 38)
     ========================================================================= */
  private updateCollapsibleRoutes(dt: number, activeEvent: number): void {
    this.collapsibleRouteSegments.forEach((seg, index) => {
      if (activeEvent >= 12 && seg.state === 'SAFE') {
        seg.state = 'UNSTABLE';
      }
      if (activeEvent >= 32 && seg.state === 'UNSTABLE') {
        seg.state = 'COLLAPSING';
      }

      if (seg.state === 'COLLAPSING') {
        seg.collapseTimer += dt;
        seg.group.position.addScaledVector(seg.fallVelocity, dt);
        seg.group.rotation.x += dt * 0.4;
        seg.group.rotation.z += dt * 0.3;

        if (seg.collapseTimer > 3.5) {
          seg.state = 'DESTROYED';
          seg.group.visible = false;
        }
      }
    });
  }

  /* =========================================================================
     EVENT 40: ABSOLUTE COSMIC END CLIMAX & 9-STEP RECONSTRUCTION
     ========================================================================= */
  private updateEvent40AbsoluteCosmicEndClimax(dt: number): {
    blackScreen: boolean;
    cameraShake: number;
  } {
    this.climaxTimer += dt;
    const t = this.climaxTimer;
    let cameraShake = 0.8;
    const blackScreen = false;

    // 0-4s: Convergence (Environment starts contracting inward)
    if (t < 4.0) {
      this.absoluteCollapsePhase = 'CONVERGENCE';
      cameraShake = 1.2 + t * 0.25;
      this.root.rotation.y += dt * (0.10 + t * 0.05);
      this.root.rotation.z = Math.sin(t * 1.7) * 0.035;
    }
    // 4-7s: Motion Slow (Time dilation drag)
    else if (t < 7.0) {
      this.absoluteCollapsePhase = 'MOTION_SLOW';
      cameraShake = 1.8;
      this.root.rotation.y += dt * 0.35;
      this.root.rotation.z = Math.sin(t * 2.2) * 0.08;
    }
    // 7-9s: Near Silence
    else if (t < 9.0) {
      this.absoluteCollapsePhase = 'NEAR_SILENCE';
      cameraShake = 0.2;
      this.root.rotation.y += dt * 0.55;
    }
    // 9-11.5s: Gravitational Distortion
    else if (t < 11.5) {
      this.absoluteCollapsePhase = 'GRAVITATIONAL_DISTORTION';
      cameraShake = 2.8;
      this.root.rotation.y += dt * 0.8;
      this.root.rotation.z = Math.sin(t * 4.0) * 0.16;
    }
    // 11.5-14s: Dark Gravitational Pulse
    else if (t < 14.0) {
      if (this.absoluteCollapsePhase !== 'DARK_GRAVITATIONAL_PULSE') sound.playDarkGravitationalShockwave();
      this.absoluteCollapsePhase = 'DARK_GRAVITATIONAL_PULSE';
      cameraShake = 4.0;
      const pulse = 1 + (t - 11.5) * 7.0;
      this.darkWaveMesh.scale.setScalar(pulse);
      (this.darkWaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.7, (t - 11.5) * 0.25);
    }
    // 14-16s: Dark Implosion
    else if (t < 16.0) {
      if (this.absoluteCollapsePhase !== 'DARK_IMPLOSION') sound.playSubBassGravitationalImplosion();
      this.absoluteCollapsePhase = 'DARK_IMPLOSION';
      cameraShake = 5.0;
      const s = Math.max(0.15, 9.0 - (t - 14.0) * 4.2);
      this.darkImplosionMesh.scale.setScalar(s);
      (this.darkImplosionMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.95, (t - 14.0) * 0.5);
    }
    // 16-19s: Singularity Charge: WHITE -> ORANGE -> RED -> WHITE-HOT -> COSMIC BOOM!
    else if (t < 19.0) {
      if (this.absoluteCollapsePhase !== 'COSMIC_BOOM') sound.playDeepCosmicBoom();
      this.absoluteCollapsePhase = 'COSMIC_BOOM';
      cameraShake = 7.0;

      const blast = THREE.MathUtils.clamp((t - 16.0) / 3.0, 0, 1);
      this.detonationProgress = blast;
      this.singularityCoreMesh.scale.setScalar(1 + blast * 14);
      this.singularityExplosionMesh.scale.setScalar(0.6 + blast * 14);
      this.singularityShockRing.scale.setScalar(1 + blast * 12);
      this.singularityFlameRing.scale.setScalar(1 + blast * 9);
      (this.singularityCoreMesh.material as THREE.MeshBasicMaterial).opacity = 0.95 - blast * 0.75;
      (this.singularityExplosionMesh.material as THREE.MeshBasicMaterial).opacity = 0.9 - blast * 0.35;
      (this.singularityShockRing.material as THREE.MeshBasicMaterial).opacity = 0.95 - blast * 0.55;
      (this.singularityFlameRing.material as THREE.MeshBasicMaterial).opacity = 0.9 - blast * 0.45;
      (this.singularityDebris.material as THREE.PointsMaterial).opacity = blast * 0.9;
    }
    // 19-22s: All Collapsed & Aftermath Pause
    else if (t < 22.0) {
      this.absoluteCollapsePhase = 'ALL_COLLAPSED';
      cameraShake = Math.max(0.6, 4.0 - (t - 19.0) * 1.2);
      const fade = THREE.MathUtils.clamp((t - 19.0) / 3.0, 0, 1);
      this.detonationProgress = Math.max(0, 1.0 - fade);
      this.singularityExplosionMesh.scale.multiplyScalar(1 + dt * 1.5);
      (this.singularityExplosionMesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - fade);
      (this.singularityFlameRing.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - fade);
      this.singularityDebris.rotation.y += dt * 0.6;
    }
    // 22-29s: Progressive 9-Step World Reconstruction
    else if (t < 29.0) {
      this.detonationProgress = 0;
      this.absoluteCollapsePhase = 'REBUILD_FOUNDATION';
      cameraShake = Math.max(0, 0.6 - (t - 22.0) * 0.1);
      const rebuild = THREE.MathUtils.clamp((t - 22.0) / 7.0, 0, 1);

      this.rebuildRouteGlow.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = rebuild * 0.9;
        const s = THREE.MathUtils.smoothstep(rebuild, 0, 1);
        (child as THREE.Mesh).scale.set(0.2 + s * 0.8, 1, 0.15 + s * 0.85);
        (child as THREE.Mesh).position.y = 12 + index * 4 + Math.sin(rebuild * Math.PI) * 16;
      });

      this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, 0, Math.min(1, dt * 1.5));
      this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, 0, Math.min(1, dt * 1.5));
      (this.singularityDebris.material as THREE.PointsMaterial).opacity = Math.max(0, 0.9 - rebuild);
    }
    // 29-33s: Final Camera Reveal
    else if (t < 33.0) {
      this.absoluteCollapsePhase = 'FINAL_CAMERA_REVEAL';
      cameraShake = 0;
      this.rebuildRouteGlow.children.forEach(child => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.65 + Math.sin(t * 3.0) * 0.15;
      });
    }
    // 33s+: Results Ready
    else {
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
     NEAR-FIELD PHYSICAL COLLISION TEST
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
    this.spaghettificationVisuals.dispose();
    this.civilization?.dispose();
    this.planetarySystem?.dispose();
    this.neutronStarSystem?.dispose();
    this.dynamicRouteGraph?.dispose();
    this.physicalMegaCities?.dispose();
    this.part1EventManager?.dispose();
  }
}
