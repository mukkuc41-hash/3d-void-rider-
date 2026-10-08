import * as THREE from 'three';
import {
  BlackHoleShaderQuality,
  EventHorizonState,
  CentralizedBlackHoleUniforms,
  createCentralizedBlackHoleUniforms,
  createDarkSingularityMaterial,
  createEventHorizonMaterial,
  createGravitationalLensingMaterial,
  createProceduralAccretionDiskMaterial,
  createInnerHotRingMaterial,
  createPlasmaStreamsMaterial,
  createGravitationalRingsMaterial,
  createSpaghettificationFilamentMaterial,
  createCosmicDetonationMaterial,
} from './proceduralBlackHoleShaders';
import { OrbitalDecayDebrisSystem } from './orbitalDecayDebrisSystem';

export type BlackHoleQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'MOBILE';

export interface BlackHoleEnvironmentOptions {
  position?: THREE.Vector3;
  scale?: number;
  quality?: BlackHoleQuality;
  submode10Optimized?: boolean;
}

/**
 * MASSIVE SUPERMASSIVE BLACK HOLE ENVIRONMENT
 * 
 * Cinematic 9-Layer Procedural WebGL/Three.js Shader System:
 * - LAYER 1: Dark Singularity (Absorbs light, pitch-black center, subtle vacuum boundary)
 * - LAYER 2: Event Horizon Dynamic Boundary (Procedural pulsing, ripple frequency, state-driven)
 * - LAYER 3: Gravitational Lensing (Radial distortion, chromatic aberration, Einstein halo)
 * - LAYER 4: Procedural Accretion Disk (Keplerian differential shear, FBM turbulence, 5-band color progression)
 * - LAYER 5: Inner Hot Ring / Photon Sphere (Razor-sharp relativistic photon wrap, 3 Sgr A* emission knots)
 * - LAYER 6: Procedural Plasma Streams (Inward-flowing spiral ribbons feeding the singularity)
 * - LAYER 7: Gravitational Rings & Waves (Multi-radius concentric wave distortion rings)
 * - LAYER 8: Spaghettification Filaments (Longitudinal directional stretching toward singularity)
 * - LAYER 9: Particle / Debris Infall (High-energy orbital sparks & foreground parallax embers)
 * - EVENT 40: Procedural Cosmic Detonation Shockwave (White -> Yellow -> Orange -> Red -> Blast)
 */
export class MassiveBlackHoleEnvironment {
  public root: THREE.Group;
  public eventHorizonMesh: THREE.Mesh;
  public horizonRippleMesh: THREE.Mesh;
  public equatorialDiskMesh: THREE.Mesh;
  public upperLensedArcMesh: THREE.Mesh;
  public lowerLensedArcMesh: THREE.Mesh;
  public photonRingMesh: THREE.Mesh;
  public secondaryPhotonRingMesh!: THREE.Mesh;
  public iscoGlowMesh: THREE.Mesh;
  public gravitationalLensMesh: THREE.Mesh;
  public coronaHazeGroup: THREE.Group;
  public orbitalPlasmaPoints: THREE.Points;
  public foregroundEmbersPoints: THREE.Points;
  public deepSpaceStarsPoints: THREE.Points;
  public distantGalaxiesGroup: THREE.Group;
  public coreLight: THREE.PointLight;
  public rimLight: THREE.DirectionalLight;
  public polarJetsGroup!: THREE.Group;
  public northJetMesh!: THREE.Mesh;
  public southJetMesh!: THREE.Mesh;
  public northJetLight!: THREE.PointLight;
  public southJetLight!: THREE.PointLight;
  public gravitationalWaveGroup!: THREE.Group;
  public singularityImplosionFlashMesh!: THREE.Mesh;

  // Additional 9-layer procedural groups
  public plasmaStreamsGroup!: THREE.Group;
  public proceduralGravitationalRingsGroup!: THREE.Group;
  public proceduralFilamentsGroup!: THREE.Group;
  public cosmicDetonationMesh!: THREE.Mesh;
  public orbitalDecayDebrisSystem!: OrbitalDecayDebrisSystem;

  // Centralized Uniform State
  public centralizedUniforms: CentralizedBlackHoleUniforms;

  private scene: THREE.Scene;
  private quality: BlackHoleQuality;
  private instability = 0.0;
  private isCollapsing = false;
  private collapseProgress = 0.0;
  private baseRotationSpeed = 0.55;
  private timeUniform = { value: 0.0 };

  private diskMaterial!: THREE.ShaderMaterial;
  private lensedArcMaterial!: THREE.ShaderMaterial;
  private photonRingMaterial!: THREE.ShaderMaterial;
  private secondaryPhotonRingMaterial!: THREE.ShaderMaterial;
  private polarJetMaterial!: THREE.ShaderMaterial;
  private singularityFlashMaterial!: THREE.MeshBasicMaterial;
  private iscoMaterial!: THREE.ShaderMaterial;
  private coronaMaterial!: THREE.ShaderMaterial;
  private lensDistortionMaterial!: THREE.ShaderMaterial;
  private plasmaParticlesMaterial!: THREE.PointsMaterial;
  private embersMaterial!: THREE.PointsMaterial;
  private plasmaStreamsMaterial!: THREE.ShaderMaterial;
  private detonationMaterial!: THREE.ShaderMaterial;

  private activeShockwaves: Array<{
    mesh: THREE.Mesh;
    mat: THREE.ShaderMaterial;
    age: number;
    maxAge: number;
    initialRadius: number;
    maxRadius: number;
  }> = [];
  private thermalShift = 0.0;
  private polarJetIntensity = 0.0;
  private jetRingsGroup!: THREE.Group;

  // Particle positions & velocities for animated infalling embers
  private plasmaParticlePositions!: Float32Array;
  private plasmaParticleRadii!: Float32Array;
  private plasmaParticleAngles!: Float32Array;
  private plasmaParticleSpeeds!: Float32Array;
  private plasmaCount = 2000;

  private embersPositions!: Float32Array;
  private embersVelocities!: Float32Array;
  private embersCount = 800;

  constructor(scene: THREE.Scene, options: BlackHoleEnvironmentOptions = {}) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'MassiveBlackHoleEnvironment';

    // Auto-detect mobile environment if not explicitly set
    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.quality = options.quality ?? (isMobileDevice ? 'MOBILE' : 'HIGH');

    // Default position: towering in the deep space forward-upper vista
    const initialPos = options.position ?? new THREE.Vector3(0, 260, -3600);
    this.root.position.copy(initialPos);

    const baseScale = options.scale ?? 1.0;
    this.root.scale.set(baseScale, baseScale, baseScale);

    // Dynamic diagonal cross-section composition
    this.root.rotation.x = 0.32;
    this.root.rotation.z = -0.14;

    const horizonRadius = 310;

    // Initialize Centralized Uniform State
    this.centralizedUniforms = createCentralizedBlackHoleUniforms(initialPos, horizonRadius);
    this.updateQualityUniform();

    // Apply performance profile
    this.configureQualityCounts();

    // 1. Core Environmental Lighting (Plasma Illumination on World — Sagittarius A* Palette)
    this.coreLight = new THREE.PointLight(0xff5500, 5.5, 4800, 1.2);
    this.coreLight.position.set(0, 0, 0);
    this.root.add(this.coreLight);

    this.rimLight = new THREE.DirectionalLight(0xffd53d, 2.5);
    this.rimLight.position.set(-600, 300, 800);
    this.root.add(this.rimLight);

    // =========================================================================
    // LAYER 1: DARK SINGULARITY SHADER
    // =========================================================================
    const horizonGeo = new THREE.SphereGeometry(
      horizonRadius,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 32 : 64,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 24 : 48
    );
    this.eventHorizonMesh = new THREE.Mesh(
      horizonGeo,
      createDarkSingularityMaterial(this.centralizedUniforms)
    );
    this.eventHorizonMesh.renderOrder = 2; // Renders after back disk, before front disk
    this.root.add(this.eventHorizonMesh);

    // =========================================================================
    // LAYER 2: EVENT HORIZON DYNAMIC BOUNDARY SHADER
    // =========================================================================
    const horizonRippleGeo = new THREE.RingGeometry(horizonRadius * 1.002, horizonRadius * 1.075, 96);
    this.horizonRippleMesh = new THREE.Mesh(
      horizonRippleGeo,
      createEventHorizonMaterial(this.centralizedUniforms)
    );
    this.horizonRippleMesh.rotation.x = Math.PI / 2;
    this.horizonRippleMesh.renderOrder = 3;
    this.root.add(this.horizonRippleMesh);

    // ISCO Glow backward compatibility
    this.iscoGlowMesh = this.horizonRippleMesh;

    // =========================================================================
    // LAYER 3: GRAVITATIONAL LENSING SHADER
    // =========================================================================
    const lensShellGeo = new THREE.SphereGeometry(
      horizonRadius * 1.62,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 24 : 48,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 16 : 32
    );
    this.lensDistortionMaterial = createGravitationalLensingMaterial(this.centralizedUniforms);
    this.gravitationalLensMesh = new THREE.Mesh(lensShellGeo, this.lensDistortionMaterial);
    this.root.add(this.gravitationalLensMesh);

    // =========================================================================
    // LAYER 4: PROCEDURAL ACCRETION DISK SHADER
    // =========================================================================
    const innerRadius = horizonRadius * 1.15;
    const outerRadius = horizonRadius * 6.8;
    const diskSegments = this.quality === 'LOW' || this.quality === 'MOBILE' ? 64 : 128;
    const diskRings = this.quality === 'LOW' || this.quality === 'MOBILE' ? 16 : 32;
    const diskGeo = new THREE.RingGeometry(innerRadius, outerRadius, diskSegments, diskRings);

    this.diskMaterial = createProceduralAccretionDiskMaterial(this.centralizedUniforms, false);
    this.equatorialDiskMesh = new THREE.Mesh(diskGeo, this.diskMaterial);
    this.equatorialDiskMesh.rotation.x = Math.PI / 2.45;
    this.equatorialDiskMesh.renderOrder = 4;
    this.root.add(this.equatorialDiskMesh);

    // Upper & Lower Lensed Einstein Arcs
    const arcRadiusInner = horizonRadius * 1.04;
    const arcRadiusOuter = horizonRadius * 2.85;
    const arcGeo = new THREE.RingGeometry(arcRadiusInner, arcRadiusOuter, diskSegments, 16);

    this.lensedArcMaterial = createProceduralAccretionDiskMaterial(this.centralizedUniforms, true);
    this.upperLensedArcMesh = new THREE.Mesh(arcGeo, this.lensedArcMaterial);
    this.upperLensedArcMesh.rotation.x = 0.08;
    this.upperLensedArcMesh.position.z = -12;
    this.upperLensedArcMesh.renderOrder = 1;
    this.root.add(this.upperLensedArcMesh);

    this.lowerLensedArcMesh = new THREE.Mesh(arcGeo.clone(), this.lensedArcMaterial);
    this.lowerLensedArcMesh.rotation.x = -0.15;
    this.lowerLensedArcMesh.rotation.z = Math.PI;
    this.lowerLensedArcMesh.scale.set(0.92, 0.72, 1.0);
    this.lowerLensedArcMesh.position.z = -14;
    this.lowerLensedArcMesh.renderOrder = 1;
    this.root.add(this.lowerLensedArcMesh);

    // =========================================================================
    // LAYER 5: INNER HOT RING / PHOTON SPHERE SHADER
    // =========================================================================
    const photonRingGeo = new THREE.RingGeometry(horizonRadius * 1.02, horizonRadius * 1.14, 96);
    this.photonRingMaterial = createInnerHotRingMaterial(this.centralizedUniforms);
    this.photonRingMesh = new THREE.Mesh(photonRingGeo, this.photonRingMaterial);
    this.photonRingMesh.rotation.x = Math.PI / 2;
    this.photonRingMesh.renderOrder = 5;
    this.root.add(this.photonRingMesh);

    // Secondary Photon Sphere Ring
    const secondaryPhotonGeo = new THREE.RingGeometry(horizonRadius * 1.012, horizonRadius * 1.055, 96);
    this.secondaryPhotonRingMaterial = createInnerHotRingMaterial(this.centralizedUniforms);
    this.secondaryPhotonRingMesh = new THREE.Mesh(secondaryPhotonGeo, this.secondaryPhotonRingMaterial);
    this.secondaryPhotonRingMesh.rotation.x = Math.PI / 2;
    this.secondaryPhotonRingMesh.renderOrder = 5;
    this.root.add(this.secondaryPhotonRingMesh);

    // =========================================================================
    // LAYER 6: PROCEDURAL PLASMA STREAMS
    // =========================================================================
    this.plasmaStreamsGroup = this.createProceduralPlasmaStreams(horizonRadius);
    this.root.add(this.plasmaStreamsGroup);

    // =========================================================================
    // LAYER 7: PROCEDURAL GRAVITATIONAL RINGS
    // =========================================================================
    this.proceduralGravitationalRingsGroup = this.createProceduralGravitationalRings(horizonRadius);
    this.root.add(this.proceduralGravitationalRingsGroup);

    // =========================================================================
    // LAYER 8: PROCEDURAL SPAGHETTIFICATION FILAMENTS
    // =========================================================================
    this.proceduralFilamentsGroup = this.createProceduralFilaments(horizonRadius);
    this.root.add(this.proceduralFilamentsGroup);

    // =========================================================================
    // LAYER 9: PARTICLE & DEBRIS INFALL (Sparks, Corona & Embers)
    // =========================================================================
    this.coronaHazeGroup = new THREE.Group();
    this.createVolumetricCorona(horizonRadius);
    this.root.add(this.coronaHazeGroup);

    this.orbitalPlasmaPoints = this.createOrbitalPlasmaParticles(horizonRadius);
    this.root.add(this.orbitalPlasmaPoints);

    this.foregroundEmbersPoints = this.createForegroundEmbers();
    this.root.add(this.foregroundEmbersPoints);

    this.deepSpaceStarsPoints = this.createDeepSpaceStars();
    this.root.add(this.deepSpaceStarsPoints);

    this.distantGalaxiesGroup = new THREE.Group();
    this.createDistantGalaxies();
    this.root.add(this.distantGalaxiesGroup);

    // Polar Relativistic Magnetic Jets
    this.createPolarRelativisticJets(horizonRadius);

    // Dynamic Gravitational Wave Shockwave System
    this.gravitationalWaveGroup = new THREE.Group();
    this.gravitationalWaveGroup.name = 'GravitationalWaveShockwaves';
    this.root.add(this.gravitationalWaveGroup);

    // Singularity Cherenkov Flash Mesh
    const flashGeo = new THREE.SphereGeometry(horizonRadius * 3.6, 32, 16);
    this.singularityFlashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.singularityImplosionFlashMesh = new THREE.Mesh(flashGeo, this.singularityFlashMaterial);
    this.singularityImplosionFlashMesh.visible = false;
    this.root.add(this.singularityImplosionFlashMesh);

    // =========================================================================
    // EVENT 40: PROCEDURAL COSMIC DETONATION SHOCKWAVE SHADER
    // =========================================================================
    const blastGeo = new THREE.RingGeometry(horizonRadius * 0.4, horizonRadius * 8.5, 96);
    this.detonationMaterial = createCosmicDetonationMaterial(this.centralizedUniforms);
    this.cosmicDetonationMesh = new THREE.Mesh(blastGeo, this.detonationMaterial);
    this.cosmicDetonationMesh.rotation.x = Math.PI / 2.45;
    this.cosmicDetonationMesh.visible = false;
    this.root.add(this.cosmicDetonationMesh);

    // Dynamic Meteoroids & Space Debris losing orbits and falling into Sgr A* accretion disk
    this.orbitalDecayDebrisSystem = new OrbitalDecayDebrisSystem(this.scene, this.root.position, horizonRadius);
    this.root.add(this.orbitalDecayDebrisSystem.root);

    // Quality visibility culling according to user infographic
    this.applyQualityVisibility();

    // Add root to scene
    scene.add(this.root);
  }

  /**
   * Helper: Layer 6 Procedural Plasma Streams
   */
  private createProceduralPlasmaStreams(horizonRadius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ProceduralPlasmaStreams';
    this.plasmaStreamsMaterial = createPlasmaStreamsMaterial(this.centralizedUniforms);

    const streamCount = this.quality === 'LOW' || this.quality === 'MOBILE' ? 4 : 8;
    const minR = horizonRadius * 1.14;
    const maxR = horizonRadius * 5.2;

    for (let s = 0; s < streamCount; s++) {
      const segs = 20;
      const geo = new THREE.PlaneGeometry(1.0, 32, segs, 1);
      const posAttr = geo.attributes.position;
      const uvAttr = geo.attributes.uv;

      const baseAngle = (s / streamCount) * Math.PI * 2;
      const speed = 0.8 + Math.random() * 0.5;
      const offset = s / streamCount;

      const aOffsets = new Float32Array(posAttr.count);
      const aSpeeds = new Float32Array(posAttr.count);

      // Curve vertices along logarithmic spiral
      for (let i = 0; i < posAttr.count; i++) {
        const u = uvAttr.getX(i); // 0 (outer) to 1 (inner)
        const v = uvAttr.getY(i) - 0.5; // -0.5 to 0.5

        const r = THREE.MathUtils.lerp(maxR, minR, u);
        const theta = baseAngle + Math.log(r / minR) * 2.2;
        const width = THREE.MathUtils.lerp(38.0, 14.0, u);

        const nx = -Math.sin(theta);
        const nz = Math.cos(theta);

        const x = Math.cos(theta) * r + nx * (v * width);
        const y = (Math.sin(u * Math.PI * 3.0) * 8.0) * (1.0 - u);
        const z = Math.sin(theta) * r + nz * (v * width);

        posAttr.setXYZ(i, x, y, z);
        aOffsets[i] = offset;
        aSpeeds[i] = speed;
      }

      geo.setAttribute('aStreamOffset', new THREE.BufferAttribute(aOffsets, 1));
      geo.setAttribute('aStreamSpeed', new THREE.BufferAttribute(aSpeeds, 1));
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, this.plasmaStreamsMaterial);
      mesh.rotation.x = Math.PI / 2.45;
      group.add(mesh);
    }

    return group;
  }

  /**
   * Helper: Layer 7 Procedural Gravitational Rings
   */
  private createProceduralGravitationalRings(horizonRadius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ProceduralGravitationalRings';

    const radiiMultipliers = [1.32, 1.82, 2.45, 3.35];
    radiiMultipliers.forEach((mult, idx) => {
      const ringRadius = horizonRadius * mult;
      const tube = 4.0 + idx * 1.5;
      const geo = new THREE.TorusGeometry(ringRadius, tube, 12, 72);
      const mat = createGravitationalRingsMaterial(this.centralizedUniforms, idx);
      const mesh = new THREE.Mesh(geo, mat);

      mesh.rotation.x = Math.PI / 2.3 + (idx % 2 === 0 ? 0.08 : -0.06);
      mesh.rotation.y = (idx * 0.22);
      group.add(mesh);
    });

    return group;
  }

  /**
   * Helper: Layer 8 Procedural Spaghettification Filaments
   */
  private createProceduralFilaments(horizonRadius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ProceduralSpaghettificationFilaments';
    const filamentMat = createSpaghettificationFilamentMaterial(this.centralizedUniforms);

    const count = this.quality === 'ULTRA' ? 24 : this.quality === 'HIGH' ? 16 : 8;
    for (let f = 0; f < count; f++) {
      const length = 450 + Math.random() * 650;
      const geo = new THREE.PlaneGeometry(16, length, 1, 24);
      const mesh = new THREE.Mesh(geo, filamentMat);

      const angle = (f / count) * Math.PI * 2 + Math.random() * 0.2;
      const r = horizonRadius * 1.6 + Math.random() * (horizonRadius * 3.5);

      mesh.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 160,
        Math.sin(angle) * r
      );

      // Orient mesh pointing radially inward toward singularity center
      mesh.lookAt(0, 0, 0);
      mesh.rotation.x += Math.PI / 2;
      group.add(mesh);
    }

    return group;
  }

  /**
   * Updates quality numeric uniform
   */
  private updateQualityUniform(): void {
    let qVal = 2; // HIGH
    if (this.quality === 'LOW' || this.quality === 'MOBILE') qVal = 0;
    else if (this.quality === 'MEDIUM') qVal = 1;
    else if (this.quality === 'HIGH') qVal = 2;
    else if (this.quality === 'ULTRA') qVal = 3;
    this.centralizedUniforms.uQualityLevel.value = qVal;
  }

  /**
   * Applies visibility toggling based on Quality tier as defined in reference image
   */
  private applyQualityVisibility(): void {
    const q = this.centralizedUniforms.uQualityLevel.value;
    if (this.plasmaStreamsGroup) {
      this.plasmaStreamsGroup.visible = q >= 1; // Medium, High, Ultra
    }
    if (this.proceduralGravitationalRingsGroup) {
      this.proceduralGravitationalRingsGroup.visible = q >= 2; // High, Ultra
    }
    if (this.proceduralFilamentsGroup) {
      this.proceduralFilamentsGroup.visible = q >= 2; // High, Ultra
    }
  }

  private configureQualityCounts(): void {
    switch (this.quality) {
      case 'MOBILE':
        this.plasmaCount = 450;
        this.embersCount = 180;
        break;
      case 'LOW':
        this.plasmaCount = 650;
        this.embersCount = 280;
        break;
      case 'MEDIUM':
        this.plasmaCount = 1200;
        this.embersCount = 500;
        break;
      case 'ULTRA':
        this.plasmaCount = 3500;
        this.embersCount = 1400;
        break;
      case 'HIGH':
      default:
        this.plasmaCount = 2000;
        this.embersCount = 800;
        break;
    }
  }

  /**
   * Connects shader intensity to the existing 40-event Final Collapse system:
   * EVENT 01-10: low lensing, subtle disk
   * EVENT 11-20: stronger disk, tidal distortion
   * EVENT 21-30: strong lensing, plasma streams, debris infall
   * EVENT 31-35: extreme distortion, strong accretion
   * EVENT 36: FINAL GRAVITATIONAL COLLAPSE
   * EVENT 37: EXTREME SPAGHETTIFICATION (Shader peak)
   * EVENT 38: ACCELERATING INFALL
   * EVENT 39: FINAL TIDAL DISRUPTION
   * EVENT 40: ABSOLUTE DESTRUCTION (Singularity charge -> Cosmic Detonation)
   */
  public setEventProgress(eventIndex: number): void {
    const evtIdx = Math.max(1, Math.min(40, eventIndex));
    const progress = (evtIdx - 1) / 39.0;
    this.centralizedUniforms.uEventProgress.value = progress;

    if (evtIdx <= 10) {
      this.centralizedUniforms.uHorizonState.value = 0; // NORMAL
      this.centralizedUniforms.uLensingStrength.value = 0.10 + progress * 0.15;
      this.centralizedUniforms.uAccretionSpeed.value = 1.0;
      this.centralizedUniforms.uAccretionIntensity.value = 1.0;
      this.centralizedUniforms.uPlasmaIntensity.value = 0.20;
      this.centralizedUniforms.uTidalStrength.value = 0.05;
      this.centralizedUniforms.uSpaghettification.value = 0.0;
    } else if (evtIdx <= 20) {
      this.centralizedUniforms.uHorizonState.value = 1; // ACTIVE
      this.centralizedUniforms.uLensingStrength.value = 0.25 + ((evtIdx - 10) / 10) * 0.20;
      this.centralizedUniforms.uAccretionSpeed.value = 1.2;
      this.centralizedUniforms.uAccretionIntensity.value = 1.25;
      this.centralizedUniforms.uPlasmaIntensity.value = 0.45;
      this.centralizedUniforms.uTidalStrength.value = 0.25;
      this.centralizedUniforms.uSpaghettification.value = 0.25; // Event 18 spaghettification begins
    } else if (evtIdx <= 30) {
      this.centralizedUniforms.uHorizonState.value = 2; // UNSTABLE
      this.centralizedUniforms.uLensingStrength.value = 0.45 + ((evtIdx - 20) / 10) * 0.25;
      this.centralizedUniforms.uAccretionSpeed.value = 1.55;
      this.centralizedUniforms.uAccretionIntensity.value = 1.45;
      this.centralizedUniforms.uPlasmaIntensity.value = 0.75;
      this.centralizedUniforms.uTidalStrength.value = 0.55;
      this.centralizedUniforms.uSpaghettification.value = 0.55; // Event 28 expanding spaghettification
    } else if (evtIdx <= 35) {
      this.centralizedUniforms.uHorizonState.value = 3; // CRITICAL
      this.centralizedUniforms.uLensingStrength.value = 0.75 + ((evtIdx - 30) / 5) * 0.25;
      this.centralizedUniforms.uAccretionSpeed.value = 1.95;
      this.centralizedUniforms.uAccretionIntensity.value = 1.70;
      this.centralizedUniforms.uPlasmaIntensity.value = 0.90;
      this.centralizedUniforms.uTidalStrength.value = 0.85;
      this.centralizedUniforms.uSpaghettification.value = 0.80; // Event 34 player scale deformation
    } else {
      // Events 36-40: FINAL COLLAPSE & EXTREME SPAGHETTIFICATION
      this.centralizedUniforms.uHorizonState.value = 4; // COLLAPSING
      this.centralizedUniforms.uLensingStrength.value = 1.05 + ((evtIdx - 36) / 4) * 0.35;
      this.centralizedUniforms.uAccretionSpeed.value = 2.4;
      this.centralizedUniforms.uAccretionIntensity.value = 1.95;
      this.centralizedUniforms.uPlasmaIntensity.value = 1.0;
      this.centralizedUniforms.uTidalStrength.value = 1.0;

      // Event 37: Shader peak
      this.centralizedUniforms.uSpaghettification.value = evtIdx >= 37 ? 1.0 : 0.88;

      if (evtIdx === 40) {
        this.centralizedUniforms.uCollapseProgress.value = 1.0;
      }
    }

    this.setInstability(progress);
    this.orbitalDecayDebrisSystem?.setEventProgress(evtIdx);
  }

  /**
   * Sets dynamic catastrophe instability (0.0 to 1.0)
   */
  public setInstability(level: number): void {
    this.instability = THREE.MathUtils.clamp(level, 0.0, 1.0);
    this.centralizedUniforms.uGravityStrength.value = this.instability;
    this.centralizedUniforms.uTidalStrength.value = Math.max(
      this.centralizedUniforms.uTidalStrength.value,
      this.instability
    );

    this.baseRotationSpeed = 0.55 + this.instability * 2.8;

    // Flare environmental lighting
    this.coreLight.intensity = 5.5 + this.instability * 7.0;
    this.rimLight.intensity = 2.5 + this.instability * 4.0;
  }

  /**
   * Sets progressive thermal shift across collapse events
   */
  public setThermalShift(level: number): void {
    this.thermalShift = THREE.MathUtils.clamp(level, 0.0, 1.0);
  }

  /**
   * Sets the intensity of the relativistic polar magnetic jets
   */
  public setPolarJetIntensity(level: number): void {
    this.polarJetIntensity = THREE.MathUtils.clamp(level, 0.0, 1.5);
    if (this.polarJetMaterial?.uniforms?.uIntensity) {
      this.polarJetMaterial.uniforms.uIntensity.value = this.polarJetIntensity;
    }
    if (this.northJetLight) {
      this.northJetLight.intensity = this.polarJetIntensity * 5.0;
    }
    if (this.southJetLight) {
      this.southJetLight.intensity = this.polarJetIntensity * 5.0;
    }
  }

  /**
   * Triggers an expanding relativistic gravitational wave shockwave
   */
  public triggerGravitationalWave(power = 1.0, color = 0xffb703): void {
    if (!this.gravitationalWaveGroup) return;

    const waveGeo = new THREE.RingGeometry(80, 160, 64);
    const waveMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uAlpha: { value: Math.min(1.0, 0.85 * power) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        varying vec2 vUv;
        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float ring = smoothstep(0.05, 0.45, dist) * smoothstep(1.0, 0.55, dist);
          gl_FragColor = vec4(uColor, ring * uAlpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.x = Math.PI / 2.45;
    this.gravitationalWaveGroup.add(waveMesh);

    this.activeShockwaves.push({
      mesh: waveMesh,
      mat: waveMat,
      age: 0,
      maxAge: 3.2,
      initialRadius: 1.0,
      maxRadius: 36.0 * Math.max(0.5, power),
    });
  }

  /**
   * Triggers terminal cosmological collapse animation
   */
  public triggerCollapse(): void {
    this.isCollapsing = true;
    this.collapseProgress = 0.0;
    this.centralizedUniforms.uCollapseProgress.value = 1.0;
    if (this.singularityImplosionFlashMesh) {
      this.singularityImplosionFlashMesh.visible = true;
    }
    this.triggerGravitationalWave(2.5, 0xffd700);
  }

  /**
   * Updates Cosmic Detonation expansion progress (Event 40)
   */
  public setDetonationProgress(progress: number): void {
    const p = Math.max(0, Math.min(1, progress));
    this.centralizedUniforms.uDetonationProgress.value = p;
    if (this.cosmicDetonationMesh) {
      this.cosmicDetonationMesh.visible = p > 0.01 && p < 1.0;
      const s = 1.0 + p * 6.5;
      this.cosmicDetonationMesh.scale.set(s, s, s);
    }
  }

  /**
   * Sets graphic quality tier at runtime (LOW, MEDIUM, HIGH, ULTRA)
   */
  public setQuality(quality: BlackHoleQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    this.updateQualityUniform();
    this.configureQualityCounts();
    this.applyQualityVisibility();
  }

  /**
   * Volumetric coronal haze wrapping around the black hole equator
   */
  private createVolumetricCorona(horizonRadius: number): void {
    const coronaCount = this.quality === 'LOW' || this.quality === 'MOBILE' ? 6 : 14;
    const hazeGeo = new THREE.PlaneGeometry(horizonRadius * 7.5, horizonRadius * 7.5);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
      grad.addColorStop(0.0, 'rgba(255, 235, 50, 0.7)');   // Sgr A* Golden-yellow core
      grad.addColorStop(0.22, 'rgba(255, 135, 12, 0.48)'); // Fiery warm orange
      grad.addColorStop(0.58, 'rgba(215, 30, 5, 0.24)');  // Deep ruby red
      grad.addColorStop(0.85, 'rgba(120, 10, 2, 0.08)');  // Smoky crimson
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const hazeTexture = new THREE.CanvasTexture(canvas);

    this.coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: hazeTexture },
        uTime: this.timeUniform,
        uInstability: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uInstability;
        varying vec2 vUv;

        void main() {
          vec4 tex = texture2D(uTexture, vUv);
          float pulse = 0.85 + 0.15 * sin(uTime * 1.8);
          gl_FragColor = vec4(tex.rgb * (1.0 + uInstability * 0.8), tex.a * pulse * 0.75);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    for (let i = 0; i < coronaCount; i++) {
      const mesh = new THREE.Mesh(hazeGeo, this.coronaMaterial);
      mesh.rotation.z = (i / coronaCount) * Math.PI * 2;
      mesh.rotation.x = Math.PI / 2.3 + (Math.random() - 0.5) * 0.25;
      mesh.scale.setScalar(0.85 + Math.random() * 0.45);
      this.coronaHazeGroup.add(mesh);
    }
  }

  /**
   * Infalling high-energy orbital plasma sparks spiraling into the vortex
   */
  private createOrbitalPlasmaParticles(horizonRadius: number): THREE.Points {
    const geo = new THREE.BufferGeometry();
    this.plasmaParticlePositions = new Float32Array(this.plasmaCount * 3);
    this.plasmaParticleRadii = new Float32Array(this.plasmaCount);
    this.plasmaParticleAngles = new Float32Array(this.plasmaCount);
    this.plasmaParticleSpeeds = new Float32Array(this.plasmaCount);
    const colors = new Float32Array(this.plasmaCount * 3);

    const minR = horizonRadius * 1.1;
    const maxR = horizonRadius * 6.5;

    for (let i = 0; i < this.plasmaCount; i++) {
      const radius = minR + Math.pow(Math.random(), 1.6) * (maxR - minR);
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.8 + Math.random() * 0.6) * Math.pow(horizonRadius / radius, 1.4);

      this.plasmaParticleRadii[i] = radius;
      this.plasmaParticleAngles[i] = angle;
      this.plasmaParticleSpeeds[i] = speed;

      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * (radius * 0.08);
      const z = Math.sin(angle) * radius;

      this.plasmaParticlePositions[i * 3] = x;
      this.plasmaParticlePositions[i * 3 + 1] = y;
      this.plasmaParticlePositions[i * 3 + 2] = z;

      const normDist = (radius - minR) / (maxR - minR);
      if (normDist < 0.28) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.90;
        colors[i * 3 + 2] = 0.30;
      } else if (normDist < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.48;
        colors[i * 3 + 2] = 0.05;
      } else {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.12;
        colors[i * 3 + 2] = 0.02;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.plasmaParticlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.plasmaParticlesMaterial = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 8 : 12,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const points = new THREE.Points(geo, this.plasmaParticlesMaterial);
    points.rotation.x = Math.PI / 2.45;
    return points;
  }

  /**
   * Foreground and midground floating embers & space dust
   */
  private createForegroundEmbers(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    this.embersPositions = new Float32Array(this.embersCount * 3);
    this.embersVelocities = new Float32Array(this.embersCount * 3);
    const colors = new Float32Array(this.embersCount * 3);

    for (let i = 0; i < this.embersCount; i++) {
      this.embersPositions[i * 3] = (Math.random() - 0.5) * 4000;
      this.embersPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      this.embersPositions[i * 3 + 2] = 200 + Math.random() * 2800;

      this.embersVelocities[i * 3] = (Math.random() - 0.5) * 8;
      this.embersVelocities[i * 3 + 1] = (Math.random() - 0.5) * 6;
      this.embersVelocities[i * 3 + 2] = -12 - Math.random() * 25;

      const colRand = Math.random();
      if (colRand < 0.5) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.20;
      } else if (colRand < 0.85) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.38;
        colors[i * 3 + 2] = 0.05;
      } else {
        colors[i * 3] = 0.92;
        colors[i * 3 + 1] = 0.12;
        colors[i * 3 + 2] = 0.02;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.embersPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.embersMaterial = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 5 : 7,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    return new THREE.Points(geo, this.embersMaterial);
  }

  /**
   * Deep space starfield
   */
  private createDeepSpaceStars(): THREE.Points {
    const starCount = this.quality === 'MOBILE' ? 1200 : this.quality === 'LOW' ? 2200 : 5000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 5500 + Math.random() * 2500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const spec = Math.random();
      if (spec < 0.25) {
        colors[i * 3] = 0.75;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.0;
      } else if (spec < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (spec < 0.85) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.55;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.45;
        colors[i * 3 + 2] = 0.35;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 2.5 : 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    return new THREE.Points(geo, starMat);
  }

  /**
   * Distant galaxies
   */
  private createDistantGalaxies(): void {
    if (this.quality === 'MOBILE') return;

    const galaxyCount = 5;
    for (let i = 0; i < galaxyCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
        grad.addColorStop(0.0, 'rgba(255, 230, 200, 0.45)');
        grad.addColorStop(0.4, 'rgba(120, 160, 255, 0.18)');
        grad.addColorStop(0.8, 'rgba(180, 80, 220, 0.06)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat);
      const angle = (i / galaxyCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 6000 + Math.random() * 1000;
      plane.position.set(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 3000,
        Math.sin(angle) * dist
      );
      plane.lookAt(0, 0, 0);
      this.distantGalaxiesGroup.add(plane);
    }
  }

  /**
   * Builds Relativistic Polar Magnetic Jets
   */
  private createPolarRelativisticJets(horizonRadius: number): void {
    this.polarJetsGroup = new THREE.Group();
    this.polarJetsGroup.name = 'PolarRelativisticJets';
    this.polarJetsGroup.rotation.x = Math.PI / 2.45 - Math.PI / 2;

    const jetHeight = 4600;
    const isMobile = this.quality === 'MOBILE' || this.quality === 'LOW';
    const radialSegs = isMobile ? 16 : 32;

    this.polarJetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uIntensity: { value: 0.0 },
        uInstability: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uInstability;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float along = vUv.y;
          float theta = atan(vNormal.z, vNormal.x);

          float stream = sin(along * 32.0 - uTime * 16.0 + sin(theta * 4.0));
          float shockNodes = pow(abs(sin(along * 12.0 * 3.14159)), 3.5);

          vec3 viewDir = normalize(vViewPosition);
          float fresnel = 1.0 - abs(dot(vNormal, viewDir));
          fresnel = pow(fresnel, 1.5);

          vec3 colCore = vec3(1.0, 0.98, 0.92);
          vec3 colYellow = vec3(1.0, 0.88, 0.22);
          vec3 colRed = vec3(0.92, 0.22, 0.04);

          vec3 col = mix(colYellow, colCore, fresnel * 0.7 + shockNodes * 0.3);
          col = mix(col, colRed, along * 0.68);

          float fade = smoothstep(0.01, 0.09, along) * smoothstep(1.0, 0.78, along);
          float alpha = (fresnel * 0.7 + 0.3 * shockNodes + 0.2 * stream) * fade * uIntensity;

          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const northGeo = new THREE.CylinderGeometry(280, 48, jetHeight, radialSegs, 16, true);
    this.northJetMesh = new THREE.Mesh(northGeo, this.polarJetMaterial);
    this.northJetMesh.position.y = jetHeight / 2 + horizonRadius * 0.85;
    this.polarJetsGroup.add(this.northJetMesh);

    const southGeo = new THREE.CylinderGeometry(48, 280, jetHeight, radialSegs, 16, true);
    this.southJetMesh = new THREE.Mesh(southGeo, this.polarJetMaterial);
    this.southJetMesh.position.y = -(jetHeight / 2 + horizonRadius * 0.85);
    this.polarJetsGroup.add(this.southJetMesh);

    this.jetRingsGroup = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const ringDistances = [650, 1200, 1950, 2900];
    ringDistances.forEach((yDist, idx) => {
      const radius = 68 + idx * 46;
      const ringGeo = new THREE.TorusGeometry(radius, 6, 12, 36);

      const northRing = new THREE.Mesh(ringGeo, ringMat);
      northRing.position.y = yDist;
      northRing.rotation.x = Math.PI / 2;
      this.jetRingsGroup.add(northRing);

      const southRing = new THREE.Mesh(ringGeo, ringMat);
      southRing.position.y = -yDist;
      southRing.rotation.x = Math.PI / 2;
      this.jetRingsGroup.add(southRing);
    });
    this.polarJetsGroup.add(this.jetRingsGroup);

    this.northJetLight = new THREE.PointLight(0xffb703, 0.0, 3500, 1.4);
    this.northJetLight.position.set(0, 500, 0);
    this.polarJetsGroup.add(this.northJetLight);

    this.southJetLight = new THREE.PointLight(0xff4500, 0.0, 3500, 1.4);
    this.southJetLight.position.set(0, -500, 0);
    this.polarJetsGroup.add(this.southJetLight);

    this.root.add(this.polarJetsGroup);
  }

  /**
   * Per-frame update loop
   */
  public update(dt: number, cameraPosition?: THREE.Vector3): void {
    const delta = Math.max(0, Math.min(dt, 0.25));
    const speed = this.centralizedUniforms.uAccretionSpeed.value;
    this.timeUniform.value += delta * this.baseRotationSpeed;
    this.centralizedUniforms.uTime.value += delta * speed;

    if (cameraPosition) {
      this.centralizedUniforms.uCameraDistance.value = cameraPosition.distanceTo(this.root.position);
    }

    // Update dynamic decaying meteoroids and space debris spiraling into accretion disk
    this.orbitalDecayDebrisSystem?.update(delta);

    // Rotational dynamics across procedural layers
    this.equatorialDiskMesh.rotation.z += delta * 0.12 * this.baseRotationSpeed;
    this.upperLensedArcMesh.rotation.z += delta * 0.08 * this.baseRotationSpeed;
    this.lowerLensedArcMesh.rotation.z -= delta * 0.08 * this.baseRotationSpeed;
    if (this.secondaryPhotonRingMesh) {
      this.secondaryPhotonRingMesh.rotation.z += delta * 0.25 * this.baseRotationSpeed;
    }
    if (this.plasmaStreamsGroup) {
      this.plasmaStreamsGroup.rotation.z += delta * 0.18 * speed;
    }
    if (this.proceduralGravitationalRingsGroup) {
      this.proceduralGravitationalRingsGroup.rotation.z -= delta * 0.05;
    }
    if (this.proceduralFilamentsGroup) {
      this.proceduralFilamentsGroup.rotation.z += delta * 0.03;
    }

    // Animate magnetic confinement coils along polar jets
    if (this.jetRingsGroup) {
      this.jetRingsGroup.rotation.y += delta * 0.85;
    }

    // Update active gravitational wave shockwaves
    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaves[i];
      sw.age += delta;
      const progress = sw.age / sw.maxAge;

      if (progress >= 1.0) {
        this.gravitationalWaveGroup.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mat.dispose();
        this.activeShockwaves.splice(i, 1);
      } else {
        const scale = THREE.MathUtils.lerp(sw.initialRadius, sw.maxRadius, Math.sqrt(progress));
        sw.mesh.scale.set(scale, scale, scale);
        sw.mat.uniforms.uAlpha.value = (1.0 - progress * progress) * 0.85;
      }
    }

    // Infalling plasma particles animation
    if (this.orbitalPlasmaPoints && this.plasmaParticlePositions) {
      const posAttr = this.orbitalPlasmaPoints.geometry.attributes.position as THREE.BufferAttribute;
      const count = this.plasmaCount;
      const minR = 310 * 1.1;
      const maxR = 310 * 6.5;

      for (let i = 0; i < count; i++) {
        this.plasmaParticleAngles[i] += delta * this.plasmaParticleSpeeds[i] * (1.0 + this.instability * 2.0);
        this.plasmaParticleRadii[i] -= delta * (12.0 + this.instability * 30.0);

        if (this.plasmaParticleRadii[i] <= minR) {
          this.plasmaParticleRadii[i] = maxR * (0.85 + Math.random() * 0.15);
          this.plasmaParticleAngles[i] = Math.random() * Math.PI * 2;
        }

        const r = this.plasmaParticleRadii[i];
        const a = this.plasmaParticleAngles[i];
        this.plasmaParticlePositions[i * 3] = Math.cos(a) * r;
        this.plasmaParticlePositions[i * 3 + 2] = Math.sin(a) * r;
      }
      posAttr.needsUpdate = true;
    }

    // Foreground floating embers parallax motion
    if (this.foregroundEmbersPoints && this.embersPositions) {
      const emberAttr = this.foregroundEmbersPoints.geometry.attributes.position as THREE.BufferAttribute;
      const eCount = this.embersCount;

      for (let i = 0; i < eCount; i++) {
        this.embersPositions[i * 3] += this.embersVelocities[i * 3] * delta;
        this.embersPositions[i * 3 + 1] += this.embersVelocities[i * 3 + 1] * delta;
        this.embersPositions[i * 3 + 2] += this.embersVelocities[i * 3 + 2] * delta;

        if (this.embersPositions[i * 3 + 2] <= -300) {
          this.embersPositions[i * 3] = (Math.random() - 0.5) * 4000;
          this.embersPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
          this.embersPositions[i * 3 + 2] = 2500 + Math.random() * 800;
        }
      }
      emberAttr.needsUpdate = true;
    }

    // Dynamic light pulsing
    this.coreLight.intensity = (5.5 + Math.sin(this.timeUniform.value * 2.4) * 0.8) * (1.0 + this.instability * 1.5);

    // Terminal Collapse 4-Stage Implosion & Aftermath
    if (this.isCollapsing) {
      this.collapseProgress += delta * 0.28;
      this.centralizedUniforms.uCollapseProgress.value = Math.min(1.0, this.collapseProgress);

      if (this.collapseProgress < 1.0) {
        // Stage 1: Violent Gravitational Contraction
        const s = Math.max(0.04, 1.0 - this.collapseProgress * 0.94);
        this.equatorialDiskMesh.scale.set(s, s, s);
        this.upperLensedArcMesh.scale.set(s, s, s);
        this.lowerLensedArcMesh.scale.set(s, s, s);
        this.eventHorizonMesh.scale.set(s, s, s);
        this.horizonRippleMesh.scale.set(s, s, s);
        this.photonRingMesh.scale.set(s * 1.35, s * 1.35, s * 1.35);
        if (this.secondaryPhotonRingMesh) {
          this.secondaryPhotonRingMesh.scale.set(s * 1.45, s * 1.45, s * 1.45);
        }
        this.orbitalPlasmaPoints.scale.set(s, s, s);
        if (this.polarJetsGroup) {
          this.polarJetsGroup.scale.set(s, s * 1.8, s);
        }
        if (this.plasmaStreamsGroup) {
          this.plasmaStreamsGroup.scale.set(s, s, s);
        }
        if (this.proceduralGravitationalRingsGroup) {
          this.proceduralGravitationalRingsGroup.scale.set(s, s, s);
        }
        if (this.proceduralFilamentsGroup) {
          this.proceduralFilamentsGroup.scale.set(s, s, s);
        }
      } else if (this.collapseProgress < 1.6) {
        // Stage 2: Super-Radiance Hawking Pulse
        const pFlash = (this.collapseProgress - 1.0) / 0.6;
        if (this.singularityFlashMaterial) {
          this.singularityFlashMaterial.opacity = Math.sin(pFlash * Math.PI) * 0.95;
        }
        if (this.coreLight) {
          this.coreLight.intensity = 15.0 * (1.0 - pFlash);
        }
        if (this.polarJetsGroup) {
          this.polarJetsGroup.scale.set(0.02, 0.02, 0.02);
        }
      } else {
        // Stage 3 & 4: Quantum Core Remnant
        if (this.singularityFlashMaterial) {
          this.singularityFlashMaterial.opacity = 0.0;
        }
        const remScale = 0.12;
        this.eventHorizonMesh.scale.set(remScale, remScale, remScale);
        this.horizonRippleMesh.scale.set(remScale, remScale, remScale);
        this.photonRingMesh.scale.set(remScale * 1.25, remScale * 1.25, remScale * 1.25);
        if (this.secondaryPhotonRingMesh) {
          this.secondaryPhotonRingMesh.scale.set(remScale * 1.5, remScale * 1.5, remScale * 1.5);
        }
        this.equatorialDiskMesh.scale.set(0.01, 0.01, 0.01);
        this.upperLensedArcMesh.scale.set(0.01, 0.01, 0.01);
        this.lowerLensedArcMesh.scale.set(0.01, 0.01, 0.01);
        if (this.coreLight) {
          this.coreLight.intensity = 1.2;
        }
      }
    }
  }

  /**
   * Clean memory disposal
   */
  public dispose(): void {
    this.scene.remove(this.root);
    this.eventHorizonMesh?.geometry?.dispose();
    this.horizonRippleMesh?.geometry?.dispose();
    this.equatorialDiskMesh?.geometry?.dispose();
    this.upperLensedArcMesh?.geometry?.dispose();
    this.lowerLensedArcMesh?.geometry?.dispose();
    this.photonRingMesh?.geometry?.dispose();
    this.secondaryPhotonRingMesh?.geometry?.dispose();
    this.gravitationalLensMesh?.geometry?.dispose();
    this.orbitalPlasmaPoints?.geometry?.dispose();
    this.foregroundEmbersPoints?.geometry?.dispose();
    this.deepSpaceStarsPoints?.geometry?.dispose();
    this.cosmicDetonationMesh?.geometry?.dispose();

    this.diskMaterial?.dispose();
    this.lensedArcMaterial?.dispose();
    this.photonRingMaterial?.dispose();
    this.secondaryPhotonRingMaterial?.dispose();
    this.lensDistortionMaterial?.dispose();
    this.plasmaStreamsMaterial?.dispose();
    this.detonationMaterial?.dispose();
    this.orbitalDecayDebrisSystem?.dispose();
  }
}
