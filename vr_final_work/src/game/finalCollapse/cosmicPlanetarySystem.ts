import * as THREE from 'three';

/**
 * 7 UNIQUE PLANETARY SYSTEMS & PLANETARY COLLAPSE CONTROLLER
 * 
 * Implements the progressive planetary introduction & catastrophic tidal reactions
 * across the 100-event Final Collapse timeline:
 * - Planet A: Ocean World with floating cities & sapphire cloud spirals
 * - Planet B: Volcanic World with procedural lava fissures & basalt crust
 * - Planet C: Frozen World with luminous ice rings
 * - Planet D: Artificial Megacity World with golden/cyan grid arrays & spires
 * - Planet E: Colossal Gas Giant with turbulent storm bands
 * - Planet F: Damaged Planet breaking apart with erupting mantle fragments
 * - Planet G: Megastructure World encased in Dyson-like lattice rings
 *
 * Performance: Shared geometries, pooled debris particles, dynamic LOD.
 */

export interface PlanetaryBody {
  id: string;
  name: string;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  atmosphereMesh?: THREE.Mesh;
  ringMesh?: THREE.Mesh;
  fragmentsGroup?: THREE.Group;
  baseRadius: number;
  basePosition: THREE.Vector3;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  introducedEvent: number;
  collapseStartEvent: number;
  spaghettificationStartEvent: number;
  isCollapsed: boolean;
  isFragmented: boolean;
  tidalStretchFactor: number;
}

export class CosmicPlanetarySystem {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;

  public planets: Map<string, PlanetaryBody> = new Map();
  private sharedSphereGeo: THREE.SphereGeometry;
  private sharedLowSphereGeo: THREE.SphereGeometry;

  // Shared procedural materials
  private oceanMat!: THREE.MeshStandardMaterial;
  private volcanicMat!: THREE.ShaderMaterial;
  private frozenMat!: THREE.MeshStandardMaterial;
  private megacityMat!: THREE.ShaderMaterial;
  private gasGiantMat!: THREE.MeshStandardMaterial;
  private fragmentedCoreMat!: THREE.MeshStandardMaterial;
  private megastructureCageMat!: THREE.MeshStandardMaterial;

  // Planetary Debris Belt
  private planetaryDebrisPoints!: THREE.Points;
  private debrisPositions!: Float32Array;
  private debrisVelocities!: Float32Array;
  private debrisCount = 320;

  constructor(scene: THREE.Scene, blackHolePos = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePos.clone();

    this.root = new THREE.Group();
    this.root.name = 'CosmicPlanetarySystem_Root';

    this.sharedSphereGeo = new THREE.SphereGeometry(1, 32, 24);
    this.sharedLowSphereGeo = new THREE.SphereGeometry(1, 16, 12);

    this.initMaterials();
    this.buildPlanets();
    this.buildPlanetaryDebrisBelt();

    this.scene.add(this.root);
  }

  private initMaterials(): void {
    // Planet A: Ocean World
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.28,
      metalness: 0.12,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
    });

    // Planet B: Volcanic World with animated lava cracks
    this.volcanicMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCrustRupture: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uCrustRupture;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vec3 rockColor = vec3(0.12, 0.08, 0.07);
          vec3 lavaColor = vec3(1.0, 0.35, 0.05);
          vec3 coreWhite = vec3(1.0, 0.9, 0.6);

          float crack = sin(vUv.x * 32.0 + sin(vUv.y * 24.0)) * cos(vUv.y * 32.0 + uTime * 0.4);
          float crackMask = smoothstep(0.72 - uCrustRupture * 0.3, 0.96, abs(crack));

          vec3 col = mix(rockColor, lavaColor, crackMask);
          if (crackMask > 0.4) {
            col = mix(col, coreWhite, (crackMask - 0.4) * 1.4);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    // Planet C: Frozen Ice World
    this.frozenMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      roughness: 0.18,
      metalness: 0.45,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
    });

    // Planet D: Artificial Megacity World with cyber grid
    this.megacityMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBlackout: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBlackout;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vec3 hullDark = vec3(0.06, 0.09, 0.14);
          vec3 neonCyan = vec3(0.0, 0.94, 1.0);
          vec3 neonGold = vec3(1.0, 0.8, 0.2);

          float gridX = step(0.92, fract(vUv.x * 64.0));
          float gridY = step(0.92, fract(vUv.y * 48.0));
          float grid = max(gridX, gridY);

          vec3 lightCol = mix(neonCyan, neonGold, sin(vUv.x * 12.0) * 0.5 + 0.5);
          float pulse = 0.85 + 0.15 * sin(uTime * 4.0 + vUv.x * 30.0);
          vec3 col = mix(hullDark, lightCol * pulse, grid * (1.0 - uBlackout * 0.9));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    // Planet E: Gas Giant
    this.gasGiantMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0xa16207,
      emissiveIntensity: 0.3,
    });

    // Planet F: Fragmented Planet
    this.fragmentedCoreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xdc2626,
      emissiveIntensity: 0.85,
    });

    // Planet G: Megastructure Cage
    this.megastructureCageMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.95,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.5,
      wireframe: true,
    });
  }

  private buildPlanets(): void {
    // 1. Planet A: Ocean World (Introduced: Event 1)
    this.createPlanet({
      id: 'planet_a_ocean',
      name: 'OCEAN WORLD // THALASSA PRIME',
      radius: 320,
      material: this.oceanMat,
      pos: new THREE.Vector3(-1900, 520, -3100),
      orbitRadius: 2400,
      orbitSpeed: 0.008,
      introducedEvent: 1,
      collapseStartEvent: 45,
      spaghettificationStartEvent: 82,
      hasAtmosphere: true,
      atmosphereColor: 0x38bdf8,
      hasFloatingCities: true,
    });

    // 2. Planet D: Artificial Megacity Planet (Introduced: Event 5)
    this.createPlanet({
      id: 'planet_d_megacity',
      name: 'CYBER MEGAPLEX // NEO-SYNDICATE',
      radius: 280,
      material: this.megacityMat,
      pos: new THREE.Vector3(1750, 420, -2900),
      orbitRadius: 2200,
      orbitSpeed: -0.012,
      introducedEvent: 5,
      collapseStartEvent: 48,
      spaghettificationStartEvent: 84,
      hasAtmosphere: false,
      hasFloatingCities: false,
    });

    // 3. Planet C: Frozen World with Ice Rings (Introduced: Event 18)
    this.createPlanet({
      id: 'planet_c_frozen',
      name: 'FROZEN SPHERE // GLACIES VII',
      radius: 240,
      material: this.frozenMat,
      pos: new THREE.Vector3(-1400, -260, -2600),
      orbitRadius: 1850,
      orbitSpeed: 0.015,
      introducedEvent: 18,
      collapseStartEvent: 52,
      spaghettificationStartEvent: 86,
      hasAtmosphere: true,
      atmosphereColor: 0x7dd3fc,
      hasRing: true,
      ringInner: 310,
      ringOuter: 480,
      ringColor: 0x38bdf8,
    });

    // 4. Planet B: Volcanic Lava World (Introduced: Event 24)
    this.createPlanet({
      id: 'planet_b_volcanic',
      name: 'VOLCANIC PYRE // PYROCLAST',
      radius: 260,
      material: this.volcanicMat,
      pos: new THREE.Vector3(1250, -320, -2400),
      orbitRadius: 1650,
      orbitSpeed: 0.018,
      introducedEvent: 24,
      collapseStartEvent: 56,
      spaghettificationStartEvent: 88,
      hasAtmosphere: true,
      atmosphereColor: 0xf97316,
    });

    // 5. Planet E: Gas Giant with Giant Storms (Introduced: Event 32)
    this.createPlanet({
      id: 'planet_e_gasgiant',
      name: 'GAS COLOSSUS // TYPHOON IX',
      radius: 440,
      material: this.gasGiantMat,
      pos: new THREE.Vector3(-2400, 850, -3800),
      orbitRadius: 3200,
      orbitSpeed: 0.005,
      introducedEvent: 32,
      collapseStartEvent: 62,
      spaghettificationStartEvent: 90,
      hasAtmosphere: true,
      atmosphereColor: 0xfacc15,
      hasRing: true,
      ringInner: 520,
      ringOuter: 850,
      ringColor: 0xeab308,
    });

    // 6. Planet F: Damaged Planet Breaking Apart (Introduced: Event 40)
    this.createPlanet({
      id: 'planet_f_fragmented',
      name: 'RUPTURED MANTLE // OBLIVION CHASM',
      radius: 210,
      material: this.fragmentedCoreMat,
      pos: new THREE.Vector3(850, 680, -2200),
      orbitRadius: 1450,
      orbitSpeed: -0.024,
      introducedEvent: 40,
      collapseStartEvent: 68,
      spaghettificationStartEvent: 92,
      hasFragments: true,
    });

    // 7. Planet G: Megastructure Cage Planet (Introduced: Event 50)
    this.createPlanet({
      id: 'planet_g_dyson',
      name: 'DYSON CRADLE // AETHEL-CORE',
      radius: 300,
      material: this.oceanMat,
      pos: new THREE.Vector3(0, 780, -3300),
      orbitRadius: 2100,
      orbitSpeed: 0.01,
      introducedEvent: 50,
      collapseStartEvent: 74,
      spaghettificationStartEvent: 95,
      hasDysonCage: true,
    });
  }

  private createPlanet(config: {
    id: string;
    name: string;
    radius: number;
    material: THREE.Material;
    pos: THREE.Vector3;
    orbitRadius: number;
    orbitSpeed: number;
    introducedEvent: number;
    collapseStartEvent: number;
    spaghettificationStartEvent: number;
    hasAtmosphere?: boolean;
    atmosphereColor?: number;
    hasRing?: boolean;
    ringInner?: number;
    ringOuter?: number;
    ringColor?: number;
    hasFloatingCities?: boolean;
    hasFragments?: boolean;
    hasDysonCage?: boolean;
  }): void {
    const group = new THREE.Group();
    group.name = config.id;
    group.position.copy(config.pos);

    // Planet Core
    const core = new THREE.Mesh(this.sharedSphereGeo, config.material);
    core.scale.setScalar(config.radius);
    group.add(core);

    let atmosphereMesh: THREE.Mesh | undefined;
    if (config.hasAtmosphere && config.atmosphereColor) {
      atmosphereMesh = new THREE.Mesh(
        this.sharedSphereGeo,
        new THREE.MeshBasicMaterial({
          color: config.atmosphereColor,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
        })
      );
      atmosphereMesh.scale.setScalar(config.radius * 1.07);
      group.add(atmosphereMesh);
    }

    let ringMesh: THREE.Mesh | undefined;
    if (config.hasRing && config.ringInner && config.ringOuter) {
      const ringGeo = new THREE.RingGeometry(config.ringInner, config.ringOuter, 64);
      ringMesh = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: config.ringColor || 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })
      );
      ringMesh.rotation.x = Math.PI / 2.4;
      group.add(ringMesh);
    }

    // Floating Cities along Planet A equator
    if (config.hasFloatingCities) {
      const cityGroup = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        const dome = new THREE.Mesh(
          this.sharedLowSphereGeo,
          new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
        );
        dome.scale.set(18, 12, 18);
        dome.position.set(
          Math.cos(theta) * config.radius * 0.99,
          Math.sin(theta * 2.0) * 20,
          Math.sin(theta) * config.radius * 0.99
        );
        cityGroup.add(dome);
      }
      group.add(cityGroup);
    }

    // Floating Mantle Fragments for Planet F
    let fragmentsGroup: THREE.Group | undefined;
    if (config.hasFragments) {
      fragmentsGroup = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const frag = new THREE.Mesh(
          new THREE.DodecahedronGeometry(18 + Math.random() * 22, 0),
          new THREE.MeshStandardMaterial({
            color: 0x262626,
            roughness: 0.8,
            emissive: 0xef4444,
            emissiveIntensity: 0.6,
          })
        );
        const phi = Math.random() * Math.PI * 2;
        const dist = config.radius * (1.15 + Math.random() * 0.45);
        frag.position.set(
          Math.cos(phi) * dist,
          (Math.random() - 0.5) * 80,
          Math.sin(phi) * dist
        );
        fragmentsGroup.add(frag);
      }
      group.add(fragmentsGroup);
    }

    // Dyson-like framework for Planet G
    if (config.hasDysonCage) {
      const cage = new THREE.Mesh(this.sharedSphereGeo, this.megastructureCageMat);
      cage.scale.setScalar(config.radius * 1.35);
      group.add(cage);
    }

    // Start with visibility managed by progressive introduction
    group.visible = config.introducedEvent <= 1;

    this.root.add(group);

    this.planets.set(config.id, {
      id: config.id,
      name: config.name,
      group,
      coreMesh: core,
      atmosphereMesh,
      ringMesh,
      fragmentsGroup,
      baseRadius: config.radius,
      basePosition: config.pos.clone(),
      orbitRadius: config.orbitRadius,
      orbitSpeed: config.orbitSpeed,
      orbitAngle: Math.atan2(config.pos.x, config.pos.z),
      rotationAxis: new THREE.Vector3(0, 1, 0),
      rotationSpeed: 0.02 + Math.random() * 0.03,
      introducedEvent: config.introducedEvent,
      collapseStartEvent: config.collapseStartEvent,
      spaghettificationStartEvent: config.spaghettificationStartEvent,
      isCollapsed: false,
      isFragmented: false,
      tidalStretchFactor: 1.0,
    });
  }

  private buildPlanetaryDebrisBelt(): void {
    const geo = new THREE.BufferGeometry();
    this.debrisPositions = new Float32Array(this.debrisCount * 3);
    this.debrisVelocities = new Float32Array(this.debrisCount * 3);

    for (let i = 0; i < this.debrisCount; i++) {
      const angle = (i / this.debrisCount) * Math.PI * 2;
      const r = 1800 + Math.random() * 1200;
      const y = (Math.random() - 0.5) * 400;

      this.debrisPositions[i * 3] = Math.cos(angle) * r;
      this.debrisPositions[i * 3 + 1] = y;
      this.debrisPositions[i * 3 + 2] = this.blackHoleCenter.z + Math.sin(angle) * r;

      this.debrisVelocities[i * 3] = -Math.sin(angle) * 12.0;
      this.debrisVelocities[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      this.debrisVelocities[i * 3 + 2] = Math.cos(angle) * 12.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.debrisPositions, 3));
    this.planetaryDebrisPoints = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xf97316,
        size: 8,
        transparent: true,
        opacity: 0.0, // Fades in as planetary collapse begins
        blending: THREE.AdditiveBlending,
      })
    );
    this.root.add(this.planetaryDebrisPoints);
  }

  /**
   * Updates all planetary systems, progressive introductions, and 100-event tidal collapses
   */
  public update(dt: number, eventIndex: number, elapsedSeconds: number = 0): void {
    const delta = Math.max(0, Math.min(dt, 0.1));

    // Update shaders
    if (this.volcanicMat) {
      this.volcanicMat.uniforms.uTime.value += delta;
      if (eventIndex >= 56) {
        this.volcanicMat.uniforms.uCrustRupture.value = Math.min(1.0, (eventIndex - 56) / 20);
      }
    }
    if (this.megacityMat) {
      this.megacityMat.uniforms.uTime.value += delta;
      if (eventIndex >= 60) {
        this.megacityMat.uniforms.uBlackout.value = Math.min(1.0, (eventIndex - 60) / 25);
      }
    }

    // Process each planetary body
    this.planets.forEach(p => {
      // 1. Progressive Introduction
      if (eventIndex >= p.introducedEvent) {
        p.group.visible = true;
      } else {
        p.group.visible = false;
        return;
      }

      // 2. Normal Keplerian Orbit
      p.orbitAngle += p.orbitSpeed * delta;
      p.coreMesh.rotation.y += p.rotationSpeed * delta;

      // 3. Late-Stage Catastrophic Tidal Collapse (Events 45–100)
      if (eventIndex >= p.collapseStartEvent) {
        p.isCollapsed = true;
        // Accelerate rotation and wobble
        p.coreMesh.rotation.y += p.rotationSpeed * delta * 4.0;
        p.coreMesh.rotation.x += delta * 0.05;

        // Gravitational pull inward toward the central black hole
        const pullProgress = Math.min(1.0, (eventIndex - p.collapseStartEvent) / (100 - p.collapseStartEvent));
        const pullVector = new THREE.Vector3().subVectors(this.blackHoleCenter, p.basePosition);
        p.group.position.copy(p.basePosition).addScaledVector(pullVector, pullProgress * 0.45);

        // Ring destruction / dispersal
        if (p.ringMesh) {
          p.ringMesh.rotation.z += delta * 0.3;
          (p.ringMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.45 - pullProgress * 0.4);
        }

        // Atmosphere stripped away
        if (p.atmosphereMesh) {
          (p.atmosphereMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.02, 0.16 - pullProgress * 0.14);
        }
      }

      // 4. Extreme Spaghettification & Infall (Events 80–100)
      if (eventIndex >= p.spaghettificationStartEvent) {
        const spaghProgress = Math.min(1.0, (eventIndex - p.spaghettificationStartEvent) / (100 - p.spaghettificationStartEvent));
        p.tidalStretchFactor = 1.0 + spaghProgress * 4.2;

        // Relativistic longitudinal elongation pointing toward singularity
        const dirToBh = new THREE.Vector3().subVectors(this.blackHoleCenter, p.group.position).normalize();
        p.coreMesh.scale.set(
          p.baseRadius / Math.sqrt(p.tidalStretchFactor),
          p.baseRadius / Math.sqrt(p.tidalStretchFactor),
          p.baseRadius * p.tidalStretchFactor
        );
        p.coreMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirToBh);

        // Erupting fragments scatter inward
        if (p.fragmentsGroup) {
          p.fragmentsGroup.children.forEach((f, idx) => {
            f.position.addScaledVector(dirToBh, delta * (80 + idx * 10));
            f.rotation.x += delta * 2.0;
          });
        }
      }
    });

    // 5. Update Planetary Debris Belt
    if (this.planetaryDebrisPoints && eventIndex >= 45) {
      const opacity = Math.min(0.85, (eventIndex - 45) / 35);
      (this.planetaryDebrisPoints.material as THREE.PointsMaterial).opacity = opacity;

      const posAttr = this.planetaryDebrisPoints.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.debrisCount; i++) {
        this.debrisPositions[i * 3] += this.debrisVelocities[i * 3] * delta;
        this.debrisPositions[i * 3 + 1] += this.debrisVelocities[i * 3 + 1] * delta;
        this.debrisPositions[i * 3 + 2] += this.debrisVelocities[i * 3 + 2] * delta;

        // Spiral gravitational pull inward
        const curX = this.debrisPositions[i * 3];
        const curZ = this.debrisPositions[i * 3 + 2] - this.blackHoleCenter.z;
        const dist = Math.sqrt(curX * curX + curZ * curZ);

        if (dist < 400 || dist > 4500) {
          // Recycle to outer rim
          const angle = Math.random() * Math.PI * 2;
          const r = 3200 + Math.random() * 800;
          this.debrisPositions[i * 3] = Math.cos(angle) * r;
          this.debrisPositions[i * 3 + 1] = (Math.random() - 0.5) * 350;
          this.debrisPositions[i * 3 + 2] = this.blackHoleCenter.z + Math.sin(angle) * r;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.sharedSphereGeo.dispose();
    this.sharedLowSphereGeo.dispose();
    this.oceanMat.dispose();
    this.volcanicMat.dispose();
    this.frozenMat.dispose();
    this.megacityMat.dispose();
    this.gasGiantMat.dispose();
    this.fragmentedCoreMat.dispose();
    this.megastructureCageMat.dispose();
    if (this.planetaryDebrisPoints) {
      this.planetaryDebrisPoints.geometry.dispose();
      (this.planetaryDebrisPoints.material as THREE.Material).dispose();
    }
    this.scene.remove(this.root);
  }
}
