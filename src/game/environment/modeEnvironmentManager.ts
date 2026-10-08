import * as THREE from 'three';
import { GameMode } from '../../types';
import {
  ModeEnvironmentProfile,
  getModeEnvironmentProfile,
  resolveCanonicalMode,
} from './modeEnvironmentProfiles';

interface AnimatedElement {
  mesh: THREE.Object3D;
  update: (dt: number, time: number) => void;
}

export class ModeEnvironmentManager {
  private scene: THREE.Scene;
  public environmentRoot: THREE.Group;
  public activeMode: GameMode | null = null;
  public activeProfile: ModeEnvironmentProfile | null = null;

  // Layered Sub-Groups
  public structuresGroup: THREE.Group;
  public sceneryGroup: THREE.Group;
  public propsGroup: THREE.Group;
  public hazardsGroup: THREE.Group;
  public backgroundGroup: THREE.Group;
  public skyGroup: THREE.Group;

  // Active Animators
  private animators: AnimatedElement[] = [];
  private totalTime = 0;

  // Reusable materials & textures per load
  private managedMaterials: THREE.Material[] = [];
  private managedGeometries: THREE.BufferGeometry[] = [];
  private managedTextures: THREE.Texture[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.environmentRoot = new THREE.Group();
    this.environmentRoot.name = 'ModeEnvironment_Root';

    this.structuresGroup = new THREE.Group();
    this.structuresGroup.name = 'env_structures';
    this.sceneryGroup = new THREE.Group();
    this.sceneryGroup.name = 'env_scenery';
    this.propsGroup = new THREE.Group();
    this.propsGroup.name = 'env_props';
    this.hazardsGroup = new THREE.Group();
    this.hazardsGroup.name = 'env_hazards';
    this.backgroundGroup = new THREE.Group();
    this.backgroundGroup.name = 'env_background';
    this.skyGroup = new THREE.Group();
    this.skyGroup.name = 'env_sky';

    this.environmentRoot.add(
      this.skyGroup,
      this.backgroundGroup,
      this.structuresGroup,
      this.sceneryGroup,
      this.propsGroup,
      this.hazardsGroup
    );
  }

  /**
   * Authoritative Environment Loader for Mode
   */
  public loadEnvironment(
    mode: GameMode | string,
    curve: THREE.Curve<THREE.Vector3> | null,
    trackId?: string
  ): ModeEnvironmentProfile {
    const canonicalMode = resolveCanonicalMode(mode);

    // 1. Fully unload previous normal mode environment
    this.unloadEnvironment();

    // 2. PROTECTED MODES CHECK: Mode 01 & Mode 21 are completely isolated!
    if (canonicalMode === 'SINGULARITY_RUN' || canonicalMode === 'BLACK_HOLE') {
      this.activeMode = canonicalMode;
      this.environmentRoot.userData.modeId = canonicalMode;
      this.activeProfile = getModeEnvironmentProfile(canonicalMode);
      // Protected modes manage their own dedicated environments. Do not attach normal structures.
      return this.activeProfile;
    }

    // 3. Normal Modes (02–20): Get profile and load dedicated environment
    const profile = getModeEnvironmentProfile(canonicalMode);
    this.activeMode = canonicalMode;
    this.activeProfile = profile;
    this.environmentRoot.userData.modeId = canonicalMode;

    if (!this.environmentRoot.parent) {
      this.scene.add(this.environmentRoot);
    }

    // Fallback sample curve if none passed
    const activeCurve = curve || this.createFallbackCurve();

    // 4. Build Custom Mode Architecture
    this.buildSkyBackground(profile);

    switch (canonicalMode) {
      case 'NEON_CIRCUIT':
        this.buildMode02NeonCircuit(activeCurve, profile);
        break;
      case 'ASTEROID_RUN':
        this.buildMode03AsteroidRun(activeCurve, profile);
        break;
      case 'WORMHOLE_EXPRESS':
        this.buildMode04WormholeExpress(activeCurve, profile);
        break;
      case 'SOLAR_STORM':
        this.buildMode05SolarStorm(activeCurve, profile);
        break;
      case 'GRAVITY_FREE':
        this.buildMode06GravityFree(activeCurve, profile);
        break;
      case 'PLASMA_STORM':
        this.buildMode07PlasmaStorm(activeCurve, profile);
        break;
      case 'SKYLINE_RUSH':
        this.buildMode08SkylineRush(activeCurve, profile);
        break;
      case 'DEBRIS_SURVIVAL':
        this.buildMode09DebrisSurvival(activeCurve, profile);
        break;
      case 'QUANTUM_TIME_TRIAL':
        this.buildMode10QuantumTimeTrial(activeCurve, profile);
        break;
      case 'ENERGY_HEIST':
        this.buildMode11EnergyHeist(activeCurve, profile);
        break;
      case 'DRONE_ASSAULT':
        this.buildMode12DroneAssault(activeCurve, profile);
        break;
      case 'COLLAPSING_TRACK':
        this.buildMode13CollapsingTrack(activeCurve, profile);
        break;
      case 'RING_RUNNER':
        this.buildMode14RingRunner(activeCurve, profile);
        break;
      case 'HYPERSPACE_SPRINT':
        this.buildMode15HyperspaceSprint(activeCurve, profile);
        break;
      case 'RIVAL_DUEL':
        this.buildMode16RivalDuel(activeCurve, profile);
        break;
      case 'RELAY_RACE':
        this.buildMode17RelayRace(activeCurve, profile);
        break;
      case 'SURVIVAL_ELIMINATION':
        this.buildMode18SurvivalElimination(activeCurve, profile);
        break;
      case 'COSMIC_TREASURE_HUNT':
        this.buildMode19CosmicTreasureHunt(activeCurve, profile);
        break;
      case 'VOID_CHAMPIONSHIP':
        this.buildMode20VoidChampionship(activeCurve, profile);
        break;
      default:
        console.error(`[MISSING ENVIRONMENT BUILDER] Mode: ${canonicalMode}`);
        throw new Error(`[MISSING ENVIRONMENT BUILDER] Mode: ${canonicalMode}`);
    }

    return profile;
  }

  /**
   * Unloads and disposes all environment objects, textures, materials, and geometries
   */
  public unloadEnvironment(): void {
    if (this.environmentRoot.parent) {
      this.environmentRoot.removeFromParent();
    }

    // Stop all active animators
    this.animators = [];

    // Dispose managed groups
    const clearGroup = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        obj.traverse(child => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };

    clearGroup(this.structuresGroup);
    clearGroup(this.sceneryGroup);
    clearGroup(this.propsGroup);
    clearGroup(this.hazardsGroup);
    clearGroup(this.backgroundGroup);
    clearGroup(this.skyGroup);

    // Dispose tracked assets
    this.managedMaterials.forEach(m => m.dispose());
    this.managedMaterials = [];

    this.managedGeometries.forEach(g => g.dispose());
    this.managedGeometries = [];

    this.managedTextures.forEach(t => t.dispose());
    this.managedTextures = [];

    this.activeMode = null;
    this.activeProfile = null;
    delete this.environmentRoot.userData.modeId;
  }

  public update(dt: number, playerSplineT: number, speed: number): void {
    this.totalTime += dt;
    for (let i = 0; i < this.animators.length; i++) {
      this.animators[i].update(dt, this.totalTime);
    }
  }

  public dispose(): void {
    this.unloadEnvironment();
  }

  // =========================================================================
  // SHARED HELPERS & TEXTURE GENERATORS
  // =========================================================================

  private registerGeo<T extends THREE.BufferGeometry>(geo: T): T {
    this.managedGeometries.push(geo);
    return geo;
  }

  private registerMat<T extends THREE.Material>(mat: T): T {
    this.managedMaterials.push(mat);
    return mat;
  }

  private registerTex<T extends THREE.Texture>(tex: T): T {
    this.managedTextures.push(tex);
    return tex;
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private createHoloTextTexture(text: string, subtext: string, colorHex: string, bgHex: string = '#040914'): THREE.Texture {
    const canvas = this.createCanvas(512, 256);
    if (!canvas) {
      return this.registerTex(new THREE.DataTexture(new Uint8Array([0, 240, 255, 255]), 1, 1));
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, 512, 256);

      // Border frame
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 496, 240);

      // Main Header
      ctx.fillStyle = colorHex;
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 20;
      ctx.font = '900 48px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 110);

      // Subtitle
      ctx.font = '700 24px "Orbitron", sans-serif';
      ctx.fillText(subtext, 256, 175);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return this.registerTex(tex);
  }

  private buildSkyBackground(profile: ModeEnvironmentProfile): void {
    // 1. Mode-specific starfield with correct star count and color
    const starCount = profile.sky.starCount;
    const starGeo = this.registerGeo(new THREE.BufferGeometry());
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const baseCol = new THREE.Color(profile.sky.starColor);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2400 + Math.random() * 800;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const tint = baseCol.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = this.registerMat(
      new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
      })
    );
    const starField = new THREE.Points(starGeo, starMat);
    this.skyGroup.add(starField);

    // 2. Cosmic Nebula billboarding layers with mode-specific colors
    const [c1, c2, c3] = profile.sky.nebulaColors;
    const canvas = this.createCanvas(512, 512);
    let nebTex: THREE.Texture;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 512);
        const drawCloud = (cx: number, cy: number, r: number, col: string) => {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, col);
          grad.addColorStop(0.5, col.replace(/[\d.]+\)$/, '0.3)'));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };
        drawCloud(256, 256, 240, c1);
        drawCloud(170, 200, 190, c2);
        drawCloud(340, 310, 180, c3);
      }
      nebTex = this.registerTex(new THREE.CanvasTexture(canvas));
    } else {
      nebTex = this.registerTex(new THREE.DataTexture(new Uint8Array([50, 10, 80, 255]), 1, 1));
    }
    const nebMat = this.registerMat(
      new THREE.MeshBasicMaterial({
        map: nebTex,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const nebPlaneGeo = this.registerGeo(new THREE.PlaneGeometry(2200, 2200));

    const neb1 = new THREE.Mesh(nebPlaneGeo, nebMat);
    neb1.position.set(0, 800, -2200);
    const neb2 = new THREE.Mesh(nebPlaneGeo, nebMat);
    neb2.position.set(1200, 600, -1800);
    neb2.rotation.z = 1.2;

    this.skyGroup.add(neb1, neb2);
  }

  private createFallbackCurve(): THREE.CatmullRomCurve3 {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 20, 0),
      new THREE.Vector3(200, 60, -600),
      new THREE.Vector3(600, 120, -1400),
      new THREE.Vector3(200, 80, -2200),
      new THREE.Vector3(-400, 40, -1600),
      new THREE.Vector3(-200, 30, -600),
      new THREE.Vector3(0, 20, 0),
    ]);
  }

  // =========================================================================
  // MODE 02 — NEON CIRCUIT
  // =========================================================================
  private buildMode02NeonCircuit(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const towerGeo = this.registerGeo(new THREE.BoxGeometry(45, 380, 45));
    const towerMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x070c1a, roughness: 0.2, metalness: 0.85 }));
    const spireGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const magentaGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff007f }));

    // Dense illuminated cyber towers lining the circuit
    const towerCount = 18;
    for (let i = 0; i < towerCount; i++) {
      const t = (i / towerCount) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = 75 + (i % 4) * 20;

      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.copy(pt).addScaledVector(bin, side * dist);
      tower.position.y += 120;
      tower.lookAt(pt);

      // Glowing spire tip
      const spire = new THREE.Mesh(this.registerGeo(new THREE.ConeGeometry(3, 40, 4)), i % 2 === 0 ? spireGlowMat : magentaGlowMat);
      spire.position.y = 200;
      tower.add(spire);

      // Holographic billboard on select towers
      if (i % 3 === 0) {
        const holoTex = this.createHoloTextTexture('NEON APEX', 'SECTOR 02 // SPEED SYNDICATE', i % 2 === 0 ? '#00f0ff' : '#ff007f');
        const boardMat = this.registerMat(new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        const board = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(60, 30)), boardMat);
        board.position.set(0, 60, 24);
        tower.add(board);
      }

      this.structuresGroup.add(tower);
    }

    // Elevated highway overpass arches spanning overhead
    const archGeo = this.registerGeo(new THREE.TorusGeometry(32, 2.5, 8, 24, Math.PI));
    const archMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x00f0ff, emissiveIntensity: 1.8, roughness: 0.3 }));

    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      arch.lookAt(pt.clone().add(tan));
      arch.rotation.z = Math.PI;
      this.structuresGroup.add(arch);
    }
  }

  // =========================================================================
  // MODE 03 — ASTEROID RUN
  // =========================================================================
  private buildMode03AsteroidRun(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const astGeo = this.registerGeo(new THREE.DodecahedronGeometry(1.0, 1));
    const pos = astGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const factor = 1 + (Math.sin(vx * 3) + Math.cos(vy * 3)) * 0.2;
      pos.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
    astGeo.computeVertexNormals();

    const rockMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x3d3936, roughness: 0.85, metalness: 0.25 }));
    const oreMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0xf59e0b, emissiveIntensity: 1.5, roughness: 0.5 }));

    // Massive craggy mined asteroid boulders along the trench
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (50 + (i % 3) * 35);

      const ast = new THREE.Mesh(astGeo, i % 4 === 0 ? oreMat : rockMat);
      const scale = 25 + (i % 5) * 12;
      ast.scale.set(scale, scale * 1.3, scale);
      ast.position.copy(pt).addScaledVector(bin, side).add(new THREE.Vector3(0, (i % 3) * 15 - 10, 0));
      ast.rotation.set(Math.random() * 3, Math.random() * 3, 0);

      this.structuresGroup.add(ast);
    }

    // Heavy industrial rotary drill rig structures
    const drillGeo = this.registerGeo(new THREE.CylinderGeometry(4, 8, 45, 8));
    const drillMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4, metalness: 0.85 }));

    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const drillGroup = new THREE.Group();
      drillGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 70, 20, 0));

      const drill = new THREE.Mesh(drillGeo, drillMat);
      drillGroup.add(drill);

      // Amber beacon
      const beacon = new THREE.Mesh(
        this.registerGeo(new THREE.SphereGeometry(2.5, 8, 8)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
      );
      beacon.position.y = 26;
      drillGroup.add(beacon);

      this.animators.push({
        mesh: drill,
        update: (dt) => {
          drill.rotation.y += dt * 3.5;
        },
      });

      this.structuresGroup.add(drillGroup);
    }
  }

  // =========================================================================
  // MODE 04 — WORMHOLE EXPRESS
  // =========================================================================
  private buildMode04WormholeExpress(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const warpRingGeo = this.registerGeo(new THREE.TorusGeometry(38, 2.2, 12, 32));
    const warpMat = this.registerMat(
      new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: 0xc026d3,
        emissiveIntensity: 2.8,
        roughness: 0.1,
      })
    );
    const innerCyanMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));

    // Double-helix rotating dimensional portals spanning the corridor
    for (let i = 0; i < 14; i++) {
      const t = (i / 14) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const ringGroup = new THREE.Group();
      ringGroup.position.copy(pt);
      ringGroup.lookAt(pt.clone().add(tan));

      const ringOuter = new THREE.Mesh(warpRingGeo, warpMat);
      const ringInner = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(28, 1.2, 8, 24)), innerCyanMat);
      ringGroup.add(ringOuter, ringInner);

      this.animators.push({
        mesh: ringOuter,
        update: (dt) => {
          ringOuter.rotation.z += dt * (i % 2 === 0 ? 1.2 : -1.2);
          ringInner.rotation.z -= dt * 1.8;
        },
      });

      this.structuresGroup.add(ringGroup);
    }

    // Colossal distant wormhole accretion core
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 300, -2200);
    const vortexGeo = this.registerGeo(new THREE.RingGeometry(80, 420, 48));
    const vortexMat = this.registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    coreGroup.add(vortex);
    this.animators.push({
      mesh: vortex,
      update: (dt) => {
        vortex.rotation.z += dt * 0.4;
      },
    });
    this.backgroundGroup.add(coreGroup);
  }

  // =========================================================================
  // MODE 05 — SOLAR STORM
  // =========================================================================
  private buildMode05SolarStorm(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Massive blazing solar star sphere in background
    const sunGeo = this.registerGeo(new THREE.SphereGeometry(750, 32, 32));
    const sunMat = this.registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xff4500,
      })
    );
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(800, 350, -2400);
    this.backgroundGroup.add(sunMesh);

    // Thermal heat shield deflection plates guarding segments of the road
    const shieldGeo = this.registerGeo(new THREE.BoxGeometry(3, 35, 70));
    const shieldMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.1 }));
    const heatGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff7700 }));

    for (let i = 0; i < 8; i++) {
      const t = (0.1 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.copy(pt).addScaledVector(bin, 32).add(new THREE.Vector3(0, 12, 0));
      shield.lookAt(pt);

      // Molten heat fin
      const fin = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(2, 30)), heatGlowMat);
      fin.position.set(1.6, 0, 0);
      fin.rotation.y = Math.PI / 2;
      shield.add(fin);

      this.structuresGroup.add(shield);
    }
  }

  // =========================================================================
  // MODE 06 — GRAVITY FREE
  // =========================================================================
  private buildMode06GravityFree(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const gyroRingGeo = this.registerGeo(new THREE.TorusGeometry(45, 2.5, 12, 36));
    const gyroMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    const blueFieldMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 }));

    // Concentric rotating 3-axis gyroscopes floating in the void
    for (let i = 0; i < 5; i++) {
      const t = (0.15 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);

      const gyroGroup = new THREE.Group();
      gyroGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 90, 40, (i - 2) * 50));

      const ringX = new THREE.Mesh(gyroRingGeo, gyroMat);
      const ringY = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(36, 2.0, 12, 32)), gyroMat);
      const ringZ = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(28, 1.6, 12, 28)), blueFieldMat);
      ringY.rotation.x = Math.PI / 2;
      ringZ.rotation.y = Math.PI / 2;

      gyroGroup.add(ringX, ringY, ringZ);

      this.animators.push({
        mesh: gyroGroup,
        update: (dt) => {
          ringX.rotation.x += dt * 0.7;
          ringY.rotation.y += dt * 1.1;
          ringZ.rotation.z += dt * 1.4;
        },
      });

      this.structuresGroup.add(gyroGroup);
    }

    // Floating magnetic anti-gravity stabilizer pads along route
    const padGeo = this.registerGeo(new THREE.CylinderGeometry(8, 8, 2, 6));
    const padMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 2.2 }));
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) % 1.0;
      const pt = curve.getPointAt(t);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.copy(pt).add(new THREE.Vector3(0, -6, 0));
      this.structuresGroup.add(pad);
    }
  }

  // =========================================================================
  // MODE 07 — PLASMA STORM
  // =========================================================================
  private buildMode07PlasmaStorm(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const reactorGeo = this.registerGeo(new THREE.CylinderGeometry(24, 28, 90, 16));
    const reactorMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.3 }));
    const greenGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x10b981 }));

    // Colossal Tokamak fusion reactors lining the industrial refinery
    for (let i = 0; i < 6; i++) {
      const t = (0.1 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 85;

      const reactor = new THREE.Mesh(reactorGeo, reactorMat);
      reactor.position.copy(pt).add(new THREE.Vector3(side, 30, 0));

      // Venting plasma ring
      const ring = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(26, 2.5, 8, 24)), greenGlowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 20;
      reactor.add(ring);

      this.structuresGroup.add(reactor);
    }

    // High-voltage magnetic conduit pipes arching across the track
    const pipeGeo = this.registerGeo(new THREE.TorusGeometry(30, 1.8, 8, 24, Math.PI));
    const pipeMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x064e3b, emissive: 0x10b981, emissiveIntensity: 2.5 }));
    for (let i = 0; i < 8; i++) {
      const t = (0.05 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.copy(pt).add(new THREE.Vector3(0, 6, 0));
      pipe.lookAt(pt.clone().add(tan));
      pipe.rotation.z = Math.PI;
      this.structuresGroup.add(pipe);
    }
  }

  // =========================================================================
  // MODE 08 — SKYLINE RUSH
  // =========================================================================
  private buildMode08SkylineRush(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // 900m-tall vertical super-skyscrapers forming an intense city canyon
    const skyGeo = this.registerGeo(new THREE.BoxGeometry(70, 750, 70));
    const skyMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0b1329, roughness: 0.15, metalness: 0.9 }));
    const beaconMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));

    const towerCount = 16;
    for (let i = 0; i < towerCount; i++) {
      const t = (i / towerCount) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (95 + (i % 3) * 25);

      const tower = new THREE.Mesh(skyGeo, skyMat);
      tower.position.copy(pt).addScaledVector(bin, side);
      tower.position.y += 240;
      tower.lookAt(pt);

      // Warning beacon on roof
      const b = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(3, 8, 8)), beaconMat);
      b.position.y = 380;
      tower.add(b);

      this.structuresGroup.add(tower);
    }

    // High-altitude sky-bridges connecting pairs of towers
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(160, 8, 14));
    const bridgeMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 }));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.copy(pt).add(new THREE.Vector3(0, 110, 0));
      this.structuresGroup.add(bridge);
    }
  }

  // =========================================================================
  // MODE 09 — DEBRIS SURVIVAL
  // =========================================================================
  private buildMode09DebrisSurvival(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Shattered space station half-modules and torn hull plating
    const hullGeo = this.registerGeo(new THREE.CylinderGeometry(20, 24, 60, 12, 1, true));
    const hullMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e2029, roughness: 0.7, metalness: 0.6 }));
    const redDistressMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xef4444 }));

    for (let i = 0; i < 10; i++) {
      const t = (i / 10) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * (55 + (i % 4) * 20);

      const wreck = new THREE.Mesh(hullGeo, hullMat);
      wreck.position.copy(pt).add(new THREE.Vector3(side, (i % 3) * 15 - 5, (i % 2) * 20));
      wreck.rotation.set(0.6 * i, 0.4 * i, 0.9 * i);

      // Red flashing emergency distress buoy
      const buoy = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(2.5, 8, 8)), redDistressMat);
      buoy.position.set(0, 32, 0);
      wreck.add(buoy);

      this.structuresGroup.add(wreck);
    }

    // Drifting metal scrap girder chunks
    const girderGeo = this.registerGeo(new THREE.BoxGeometry(4, 4, 35));
    const girderMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 }));
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) % 1.0;
      const pt = curve.getPointAt(t);
      const girder = new THREE.Mesh(girderGeo, girderMat);
      girder.position.copy(pt).add(new THREE.Vector3((Math.random() - 0.5) * 60, 10 + Math.random() * 20, (Math.random() - 0.5) * 40));
      girder.rotation.set(Math.random() * 3, Math.random() * 3, 0);

      this.animators.push({
        mesh: girder,
        update: (dt) => {
          girder.rotation.x += dt * 0.4;
          girder.rotation.y += dt * 0.2;
        },
      });

      this.structuresGroup.add(girder);
    }
  }

  // =========================================================================
  // MODE 10 — QUANTUM TIME TRIAL
  // =========================================================================
  private buildMode10QuantumTimeTrial(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Particle accelerator loops and holographic chrono gates
    const chronoGateGeo = this.registerGeo(new THREE.TorusGeometry(32, 1.8, 12, 32));
    const chromeMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.95 }));
    const azureLaserMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));

    for (let i = 0; i < 8; i++) {
      const t = (i / 8) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gateGroup = new THREE.Group();
      gateGroup.position.copy(pt);
      gateGroup.lookAt(pt.clone().add(tan));

      const ring = new THREE.Mesh(chronoGateGeo, chromeMat);
      gateGroup.add(ring);

      // Split timer digital display board
      const tex = this.createHoloTextTexture(`SECTOR T-0${i + 1}`, 'SPLIT TIME ACCELERATOR', '#00f0ff', '#020b18');
      const boardMat = this.registerMat(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
      const board = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(36, 12)), boardMat);
      board.position.set(0, 34, 0);
      gateGroup.add(board);

      this.structuresGroup.add(gateGroup);
    }

    // Pristine white clean-room laboratory research towers
    const labTowerGeo = this.registerGeo(new THREE.CylinderGeometry(18, 24, 260, 16));
    for (let i = 0; i < 6; i++) {
      const t = (0.15 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const tower = new THREE.Mesh(labTowerGeo, chromeMat);
      tower.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 90, 80, 0));
      this.structuresGroup.add(tower);
    }
  }

  // =========================================================================
  // MODE 11 — ENERGY HEIST
  // =========================================================================
  private buildMode11EnergyHeist(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Armored energy vault silos with radioactive glowing orange cores
    const siloGeo = this.registerGeo(new THREE.CylinderGeometry(28, 32, 110, 16));
    const armorMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.35, metalness: 0.9 }));
    const orangeCoreMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff5500, emissiveIntensity: 2.8 }));

    for (let i = 0; i < 5; i++) {
      const t = (0.12 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);
      const silo = new THREE.Mesh(siloGeo, armorMat);
      silo.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 80, 45, 0));

      const core = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(14, 16, 16)), orangeCoreMat);
      core.position.y = 20;
      silo.add(core);

      this.structuresGroup.add(silo);
    }

    // Security laser tripwire barrier gantries
    const tripwireGeo = this.registerGeo(new THREE.BoxGeometry(45, 0.4, 0.4));
    const redLaserMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    for (let i = 0; i < 7; i++) {
      const t = (0.06 + i * 0.14) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const beam = new THREE.Mesh(tripwireGeo, redLaserMat);
      beam.position.copy(pt).add(new THREE.Vector3(0, 4 + (i % 3) * 3, 0));
      beam.lookAt(pt.clone().add(tan));
      this.hazardsGroup.add(beam);
    }
  }

  // =========================================================================
  // MODE 12 — DRONE ASSAULT
  // =========================================================================
  private buildMode12DroneAssault(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Military defense citadel radar radomes and defense towers
    const towerGeo = this.registerGeo(new THREE.CylinderGeometry(8, 14, 120, 12));
    const milMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1e24, metalness: 0.85, roughness: 0.3 }));
    const radomeGeo = this.registerGeo(new THREE.SphereGeometry(16, 16, 16));
    const yellowStrobeMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xeab308 }));

    for (let i = 0; i < 6; i++) {
      const t = (0.1 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 75;

      const tower = new THREE.Mesh(towerGeo, milMat);
      tower.position.copy(pt).add(new THREE.Vector3(side, 50, 0));

      const radome = new THREE.Mesh(radomeGeo, milMat);
      radome.position.y = 65;
      tower.add(radome);

      const strobe = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(2, 8, 8)), yellowStrobeMat);
      strobe.position.y = 82;
      tower.add(strobe);

      this.structuresGroup.add(tower);
    }
  }

  // =========================================================================
  // MODE 13 — COLLAPSING TRACK
  // =========================================================================
  private buildMode13CollapsingTrack(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Fractured cantilever highway bridges and buckling steel arches
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(40, 6, 20));
    const brokenMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x221a18, roughness: 0.7, metalness: 0.6 }));
    const hazardStripeMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf97316 }));

    for (let i = 0; i < 8; i++) {
      const t = (0.08 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(bridgeGeo, brokenMat);
      bridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 45, 12, 0));
      bridge.rotation.set(0.15 * (i % 3), 0.2, -0.2 * (i % 2 === 0 ? 1 : -1));

      // Flashing hazard pillar
      const p = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(1.5, 1.5, 18, 8)), hazardStripeMat);
      p.position.set(0, 10, 0);
      bridge.add(p);

      this.structuresGroup.add(bridge);
    }
  }

  // =========================================================================
  // MODE 14 — RING RUNNER
  // =========================================================================
  private buildMode14RingRunner(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Gigantic Stanford Torus orbital ring arching overhead across the sky
    const ringGeo = this.registerGeo(new THREE.TorusGeometry(850, 24, 16, 64));
    const ringMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 }));
    const windowRingMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));

    const grandRing = new THREE.Mesh(ringGeo, ringMat);
    grandRing.position.set(0, 300, -1200);
    grandRing.rotation.x = Math.PI * 0.35;
    this.backgroundGroup.add(grandRing);

    const innerRing = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(820, 4, 8, 48)), windowRingMat);
    innerRing.position.copy(grandRing.position);
    innerRing.rotation.copy(grandRing.rotation);
    this.backgroundGroup.add(innerRing);

    this.animators.push({
      mesh: grandRing,
      update: (dt) => {
        grandRing.rotation.z += dt * 0.05;
        innerRing.rotation.z += dt * 0.05;
      },
    });

    // Ring spoke hub columns
    const spokeGeo = this.registerGeo(new THREE.CylinderGeometry(8, 8, 850, 12));
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(spokeGeo, ringMat);
      spoke.position.copy(grandRing.position);
      spoke.rotation.x = grandRing.rotation.x;
      spoke.rotation.z = (s * Math.PI) / 4;
      this.backgroundGroup.add(spoke);
    }
  }

  // =========================================================================
  // MODE 15 — HYPERSPACE SPRINT
  // =========================================================================
  private buildMode15HyperspaceSprint(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // High-frequency energy lattice rings forming a continuous warp tunnel
    const tunnelRingGeo = this.registerGeo(new THREE.TorusGeometry(32, 1.2, 8, 24));
    const tunnelMat = this.registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xec4899,
        transparent: true,
        opacity: 0.75,
      })
    );
    const cyanWireMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));

    for (let i = 0; i < 20; i++) {
      const t = (i / 20) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const hoop = new THREE.Mesh(tunnelRingGeo, i % 2 === 0 ? tunnelMat : cyanWireMat);
      hoop.position.copy(pt);
      hoop.lookAt(pt.clone().add(tan));

      this.structuresGroup.add(hoop);
    }
  }

  // =========================================================================
  // MODE 16 — RIVAL DUEL
  // =========================================================================
  private buildMode16RivalDuel(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Gladiator stadium colosseum walls and spectator sky-decks
    const standGeo = this.registerGeo(new THREE.BoxGeometry(60, 45, 120));
    const stadiumMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 }));
    const screenMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x60a5fa }));

    for (let i = 0; i < 6; i++) {
      const t = (0.1 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 80;

      const stand = new THREE.Mesh(standGeo, stadiumMat);
      stand.position.copy(pt).add(new THREE.Vector3(side, 20, 0));
      stand.lookAt(pt);

      // Duel scoreboard screen
      const screen = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(50, 25)), screenMat);
      screen.position.set(0, 10, 61);
      stand.add(screen);

      this.structuresGroup.add(stand);
    }
  }

  // =========================================================================
  // MODE 17 — RELAY RACE
  // =========================================================================
  private buildMode17RelayRace(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // 3 distinct architectural sectors with giant Relay Pit Transfer Gates
    const gateGeo = this.registerGeo(new THREE.BoxGeometry(45, 25, 6));
    const gateMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0xa855f7, emissiveIntensity: 2.2 }));

    const legColors = [0x38bdf8, 0xf59e0b, 0xa855f7];
    for (let leg = 0; leg < 3; leg++) {
      const t = (leg / 3);
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      gate.lookAt(pt.clone().add(tan));

      const label = this.createHoloTextTexture(`LEG 0${leg + 1} RELAY PIT`, 'VEHICLE TRANSFER ACTIVE', leg === 0 ? '#38bdf8' : leg === 1 ? '#f59e0b' : '#a855f7');
      const board = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(40, 15)), this.registerMat(new THREE.MeshBasicMaterial({ map: label, side: THREE.DoubleSide })));
      board.position.set(0, 18, 0);
      gate.add(board);

      this.structuresGroup.add(gate);
    }
  }

  // =========================================================================
  // MODE 18 — SURVIVAL ELIMINATION
  // =========================================================================
  private buildMode18SurvivalElimination(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Geodesic survival dome with elimination scanner pylons
    const domeGeo = this.registerGeo(new THREE.IcosahedronGeometry(700, 2));
    const domeMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.15 }));
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.set(0, 100, -1000);
    this.backgroundGroup.add(domeMesh);

    // Elimination scanner pylons sweeping laser grids
    const pylonGeo = this.registerGeo(new THREE.CylinderGeometry(1.5, 2.5, 30, 8));
    const pylonMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1917, emissive: 0xf43f5e, emissiveIntensity: 2.5 }));
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) % 1.0;
      const pt = curve.getPointAt(t);
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 35, 14, 0));
      this.structuresGroup.add(pylon);
    }
  }

  // =========================================================================
  // MODE 19 — COSMIC TREASURE HUNT
  // =========================================================================
  private buildMode19CosmicTreasureHunt(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Floating black obsidian obelisks and rotating crystal pyramids
    const obeliskGeo = this.registerGeo(new THREE.BoxGeometry(10, 80, 10));
    const obeliskMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.95 }));
    const glyphMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x34d399 }));

    for (let i = 0; i < 10; i++) {
      const t = (i / 10) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 70;

      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      obelisk.position.copy(pt).add(new THREE.Vector3(side, 35, 0));

      // Glowing glyph band
      const glyph = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(10.5, 8, 10.5)), glyphMat);
      glyph.position.y = 15;
      obelisk.add(glyph);

      this.structuresGroup.add(obelisk);
    }

    // Hovering crystal pyramids
    const pyrGeo = this.registerGeo(new THREE.ConeGeometry(16, 26, 4));
    const pyrMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x34d399, emissiveIntensity: 2.0, roughness: 0.1 }));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const pyr = new THREE.Mesh(pyrGeo, pyrMat);
      pyr.position.copy(pt).add(new THREE.Vector3(0, 45, 0));

      this.animators.push({
        mesh: pyr,
        update: (dt) => {
          pyr.rotation.y += dt * 0.8;
          pyr.rotation.x += dt * 0.3;
        },
      });

      this.structuresGroup.add(pyr);
    }
  }

  // =========================================================================
  // MODE 20 — VOID CHAMPIONSHIP
  // =========================================================================
  private buildMode20VoidChampionship(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    // Grand Premier Championship Apex Arena with gold and cobalt architecture (NOT City, NOT Black Hole)
    const archGeo = this.registerGeo(new THREE.TorusGeometry(38, 3.5, 12, 36, Math.PI));
    const goldMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xfbbf24, emissiveIntensity: 1.8, roughness: 0.15, metalness: 0.95 }));
    const cobaltMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.85 }));

    for (let i = 0; i < 5; i++) {
      const t = (0.1 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const archGroup = new THREE.Group();
      archGroup.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      archGroup.lookAt(pt.clone().add(tan));
      archGroup.rotation.z = Math.PI;

      const arch = new THREE.Mesh(archGeo, goldMat);
      archGroup.add(arch);

      // Gold trophy emblem star
      const star = new THREE.Mesh(this.registerGeo(new THREE.OctahedronGeometry(4, 0)), goldMat);
      star.position.set(0, 38, 0);
      archGroup.add(star);

      this.structuresGroup.add(archGroup);
    }

    // Apex Winner Dais Towers with royal blue and gold ribbons
    const daisTowerGeo = this.registerGeo(new THREE.BoxGeometry(25, 240, 25));
    for (let i = 0; i < 6; i++) {
      const t = (0.05 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 85;

      const tower = new THREE.Mesh(daisTowerGeo, cobaltMat);
      tower.position.copy(pt).add(new THREE.Vector3(side, 80, 0));

      const crown = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(27, 8, 27)), goldMat);
      crown.position.y = 120;
      tower.add(crown);

      this.structuresGroup.add(tower);
    }
  }
}
