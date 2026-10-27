import * as THREE from 'three';
import { GameMode } from '../../types';
import {
  ModeEnvironmentProfile,
  getModeEnvironmentProfile,
  resolveCanonicalMode,
} from './modeEnvironmentProfiles';
import {
  MODE_BUILDERS,
  BaseModeEnvironmentBuilder,
  ModeInteractable,
} from './builders';

interface AnimatedElement {
  mesh: THREE.Object3D;
  update: (dt: number, time: number) => void;
}

export class ModeEnvironmentManager {
  private scene: THREE.Scene;
  public environmentRoot: THREE.Group;
  public activeMode: GameMode | null = null;
  public activeProfile: ModeEnvironmentProfile | null = null;
  public activeBuilder: BaseModeEnvironmentBuilder | null = null;
  public interactables: ModeInteractable[] = [];
  public dynamicColliders: {
    id: string;
    position: THREE.Vector3;
    radius: number;
    active: boolean;
    mesh?: THREE.Object3D;
  }[] = [];

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

    this.buildModeStartFinish(
      activeCurve,
      `${profile.displayName.toUpperCase()} START`,
      `${profile.displayName.toUpperCase()} FINISH`,
      profile.lighting.accentColor,
      profile.atmosphere.dustColor
    );

    const BuilderClass = MODE_BUILDERS[canonicalMode];
    if (BuilderClass) {
      this.activeBuilder = new BuilderClass(
        this.structuresGroup,
        this.sceneryGroup,
        this.propsGroup,
        this.hazardsGroup,
        this.backgroundGroup,
        this.skyGroup,
        this.animators,
        this.interactables
      );
      this.activeBuilder.build(activeCurve, profile);
    } else {
      console.warn(`[MISSING ENVIRONMENT BUILDER] Mode: ${canonicalMode}`);
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

    // Stop all active animators & builders
    this.animators = [];
    if (this.activeBuilder) {
      this.activeBuilder.dispose();
      this.activeBuilder = null;
    }
    this.interactables = [];

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

    this.dynamicColliders = [];
    this.activeMode = null;
    this.activeProfile = null;
    delete this.environmentRoot.userData.modeId;
  }

  public update(dt: number, playerSplineT: number, speed: number): void {
    this.totalTime += dt;
    for (let i = 0; i < this.animators.length; i++) {
      this.animators[i].update(dt, this.totalTime);
    }
    for (let i = 0; i < this.interactables.length; i++) {
      this.interactables[i].update?.(dt, this.totalTime);
    }
  }

  /**
   * Responds to environment and mode event transitions (e.g. WARNING, ACTIVE, RESOLVED).
   */
  public triggerEventReaction(
    eventId: string,
    state: 'WARNING' | 'ACTIVE' | 'RESOLVING' | 'RESOLVED',
    glowColorHex?: string,
    intensity: number = 1.0
  ): void {
    // Traverse scenery & interactables to apply event lighting or structural alterations
    const color = glowColorHex ? new THREE.Color(glowColorHex) : new THREE.Color(0x00f0ff);
    for (const inter of this.interactables) {
      if (inter.mesh && inter.id.includes(eventId)) {
        inter.mesh.traverse(obj => {
          if (obj instanceof THREE.Mesh && obj.material) {
            const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
            if ('color' in mat) {
              (mat as any).color.lerp(color, Math.min(1, intensity * 0.5));
            }
          }
        });
      }
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
  // SHARED START & FINISH ARCHITECTURE
  // =========================================================================
  private buildModeStartFinish(
    curve: THREE.Curve<THREE.Vector3>,
    startName: string,
    finishName: string,
    primaryColor: number,
    accentColor: number
  ): void {
    const archGeo = this.registerGeo(new THREE.BoxGeometry(52, 7, 10));
    const archMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.9 }));
    const pylonGeo = this.registerGeo(new THREE.CylinderGeometry(2.5, 3.8, 42, 12));
    const beaconGeo = this.registerGeo(new THREE.SphereGeometry(3, 12, 12));
    const beaconMat = this.registerMat(new THREE.MeshBasicMaterial({ color: accentColor }));
    const hexCol = '#' + new THREE.Color(primaryColor).getHexString();
    const hexAccent = '#' + new THREE.Color(accentColor).getHexString();

    // 1. START GATE at t = 0.015
    const ptStart = curve.getPointAt(0.015);
    const tanStart = curve.getTangentAt(0.015).normalize();
    const startGroup = new THREE.Group();
    startGroup.position.copy(ptStart).add(new THREE.Vector3(0, 10, 0));
    startGroup.lookAt(ptStart.clone().add(tanStart));

    const sArch = new THREE.Mesh(archGeo, archMat);
    sArch.position.y = 21;
    startGroup.add(sArch);

    const sPylonL = new THREE.Mesh(pylonGeo, archMat);
    sPylonL.position.set(-24, 0, 0);
    const sPylonR = new THREE.Mesh(pylonGeo, archMat);
    sPylonR.position.set(24, 0, 0);
    startGroup.add(sPylonL, sPylonR);

    const sTex = this.createHoloTextTexture(startName, 'LAUNCH VECTOR // GREEN LIGHT', hexCol);
    const sBoardMat = this.registerMat(new THREE.MeshBasicMaterial({ map: sTex, transparent: true, side: THREE.DoubleSide }));
    const sBoard = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(42, 14)), sBoardMat);
    sBoard.position.set(0, 21, 5.2);
    startGroup.add(sBoard);

    const sBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    sBeacon.position.set(0, 28, 0);
    startGroup.add(sBeacon);

    this.animators.push({
      mesh: sBeacon,
      update: (_dt, time) => {
        const pulse = 0.8 + 0.4 * Math.sin(time * 5.5);
        sBeacon.scale.setScalar(pulse);
      },
    });

    this.structuresGroup.add(startGroup);

    // 2. FINISH GATE at t = 0.985
    const ptFinish = curve.getPointAt(0.985);
    const tanFinish = curve.getTangentAt(0.985).normalize();
    const finishGroup = new THREE.Group();
    finishGroup.position.copy(ptFinish).add(new THREE.Vector3(0, 10, 0));
    finishGroup.lookAt(ptFinish.clone().add(tanFinish));

    const fArch = new THREE.Mesh(archGeo, archMat);
    fArch.position.y = 21;
    finishGroup.add(fArch);

    const fPylonL = new THREE.Mesh(pylonGeo, archMat);
    fPylonL.position.set(-24, 0, 0);
    const fPylonR = new THREE.Mesh(pylonGeo, archMat);
    fPylonR.position.set(24, 0, 0);
    finishGroup.add(fPylonL, fPylonR);

    const fTex = this.createHoloTextTexture(finishName, 'CHECKERED FLAG // SECTOR END', hexAccent);
    const fBoardMat = this.registerMat(new THREE.MeshBasicMaterial({ map: fTex, transparent: true, side: THREE.DoubleSide }));
    const fBoard = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(42, 14)), fBoardMat);
    fBoard.position.set(0, 21, 5.2);
    finishGroup.add(fBoard);

    const fBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    fBeacon.position.set(0, 28, 0);
    finishGroup.add(fBeacon);

    this.animators.push({
      mesh: fBeacon,
      update: (_dt, time) => {
        const pulse = 0.8 + 0.4 * Math.cos(time * 5.5);
        fBeacon.scale.setScalar(pulse);
      },
    });

    this.structuresGroup.add(finishGroup);
  }

  // =========================================================================
  // MODE 02 — NEON CIRCUIT (Cyber City Orbit)
  // =========================================================================
  private buildMode02NeonCircuit(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'NEON APEX GATEWAY', 'CIRCUIT FINISH LINE', 0x00f0ff, 0xff007f);

    const towerGeo = this.registerGeo(new THREE.BoxGeometry(45, 420, 45));
    const towerMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x070c1a, roughness: 0.18, metalness: 0.9 }));
    const cyanGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const magentaGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff007f }));

    // 1. Cyber Canyon Foundation Towers
    const towerCount = 18;
    for (let i = 0; i < towerCount; i++) {
      const t = (i / towerCount) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = 75 + (i % 4) * 25;

      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.copy(pt).addScaledVector(bin, side * dist);
      tower.position.y += 140;
      tower.lookAt(pt);

      // Glowing spire tip
      const spire = new THREE.Mesh(this.registerGeo(new THREE.ConeGeometry(3.5, 50, 4)), i % 2 === 0 ? cyanGlowMat : magentaGlowMat);
      spire.position.y = 235;
      tower.add(spire);

      // Billboards on select towers
      if (i % 3 === 0) {
        const holoTex = this.createHoloTextTexture('NEON APEX', 'SECTOR 02 // SPEED SYNDICATE', i % 2 === 0 ? '#00f0ff' : '#ff007f');
        const boardMat = this.registerMat(new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        const board = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(60, 30)), boardMat);
        board.position.set(0, 80, 24);
        tower.add(board);
      }

      this.structuresGroup.add(tower);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Rotating Antenna Spire Arrays with Counter-Rotating Radar Rings
    const ringOuterGeo = this.registerGeo(new THREE.TorusGeometry(18, 1.2, 8, 24));
    const ringInnerGeo = this.registerGeo(new THREE.TorusGeometry(11, 0.9, 8, 20));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const scannerRig = new THREE.Group();
      scannerRig.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 95).add(new THREE.Vector3(0, 260, 0));

      const mast = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(1.5, 2.5, 70, 8)), towerMat);
      scannerRig.add(mast);

      const rOuter = new THREE.Mesh(ringOuterGeo, cyanGlowMat);
      rOuter.position.y = 25;
      scannerRig.add(rOuter);

      const rInner = new THREE.Mesh(ringInnerGeo, magentaGlowMat);
      rInner.position.y = 25;
      scannerRig.add(rInner);

      this.animators.push({
        mesh: scannerRig,
        update: (dt) => {
          rOuter.rotation.y += dt * 1.5;
          rInner.rotation.y -= dt * 2.2;
          rOuter.rotation.x += dt * 0.4;
        },
      });

      this.structuresGroup.add(scannerRig);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Dynamic Cantilever Skybridges extending/retracting across track
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(65, 5, 12));
    const bridgeMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x00f0ff, emissiveIntensity: 0.8, metalness: 0.8 }));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
      const basePos = pt.clone().addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 55).add(new THREE.Vector3(0, 32, 0));
      bridgeMesh.position.copy(basePos);
      bridgeMesh.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: bridgeMesh,
        update: (_dt, time) => {
          const shift = Math.sin(time * 1.5 + i * 2) * 16;
          bridgeMesh.position.copy(basePos).addScaledVector(bin, shift * (i % 2 === 0 ? -1 : 1));
        },
      });

      this.structuresGroup.add(bridgeMesh);
    }

    // 4. LIVE-MOVING STRUCTURE: 2x Colossal Revolving Holographic Cylinder Billboard Drums
    const holoDrumGeo = this.registerGeo(new THREE.CylinderGeometry(40, 40, 30, 24, 1, true));
    for (let i = 0; i < 2; i++) {
      const t = (0.35 + i * 0.45) % 1.0;
      const pt = curve.getPointAt(t);
      const drumGroup = new THREE.Group();
      drumGroup.position.copy(pt).add(new THREE.Vector3((i === 0 ? 1 : -1) * 120, 180, -60));

      const drumTex = this.createHoloTextTexture('QUANTUM HYPER-GRID', 'SECTOR 02 // ZERO EMISSION', i === 0 ? '#00f0ff' : '#ff007f');
      const drumMat = this.registerMat(new THREE.MeshBasicMaterial({ map: drumTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      const drumMesh = new THREE.Mesh(holoDrumGeo, drumMat);
      drumGroup.add(drumMesh);

      this.animators.push({
        mesh: drumGroup,
        update: (dt) => {
          drumMesh.rotation.y += dt * (i === 0 ? 0.75 : -0.75);
        },
      });

      this.structuresGroup.add(drumGroup);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x High-Speed Exterior Sky-Elevators
    const elevatorGeo = this.registerGeo(new THREE.BoxGeometry(6, 10, 6));
    const elevatorMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00f0ff, emissiveIntensity: 2.0 }));
    for (let i = 0; i < 4; i++) {
      const t = (0.08 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const elevator = new THREE.Mesh(elevatorGeo, elevatorMat);
      const anchorPos = pt.clone().addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 60);

      this.animators.push({
        mesh: elevator,
        update: (_dt, time) => {
          const elevY = 60 + Math.sin(time * 2.2 + i * 1.5) * 80;
          elevator.position.set(anchorPos.x, anchorPos.y + elevY, anchorPos.z);
        },
      });

      this.structuresGroup.add(elevator);
    }
  }

  // =========================================================================
  // MODE 03 — ASTEROID RUN (Vesta Trench)
  // =========================================================================
  private buildMode03AsteroidRun(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'VESTA STAGING SECTOR', 'EXTRACTION DEPOT FINISH', 0xf59e0b, 0xd97706);

    const astGeo = this.registerGeo(new THREE.DodecahedronGeometry(1.0, 1));
    const rockMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x38332e, roughness: 0.9, metalness: 0.2 }));
    const oreMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0xf59e0b, emissiveIntensity: 1.8, roughness: 0.6 }));
    const rigMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.35, metalness: 0.9 }));

    // 1. Massive Asteroid Canyon Walls (24 Asteroid Formations)
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (55 + (i % 3) * 32);

      const ast = new THREE.Mesh(astGeo, i % 4 === 0 ? oreMat : rockMat);
      const scale = 28 + (i % 5) * 14;
      ast.scale.set(scale, scale * 1.3, scale);
      ast.position.copy(pt).addScaledVector(bin, side).add(new THREE.Vector3(0, (i % 3) * 15 - 10, 0));
      ast.rotation.set(i * 0.4, i * 0.7, 0);

      this.structuresGroup.add(ast);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Giant Rotary Bucket-Wheel Excavator Mining Rigs
    const wheelGeo = this.registerGeo(new THREE.TorusGeometry(18, 2.5, 8, 16));
    const toothGeo = this.registerGeo(new THREE.ConeGeometry(2, 6, 4));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const rigGroup = new THREE.Group();
      rigGroup.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 75).add(new THREE.Vector3(0, 25, 0));

      const tower = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(10, 50, 10)), rigMat);
      rigGroup.add(tower);

      const wheelHub = new THREE.Group();
      wheelHub.position.set(0, 20, 0);
      const wheel = new THREE.Mesh(wheelGeo, oreMat);
      wheelHub.add(wheel);

      // Cutting teeth around circumference
      for (let tooth = 0; tooth < 8; tooth++) {
        const ang = (tooth / 8) * Math.PI * 2;
        const toothMesh = new THREE.Mesh(toothGeo, rigMat);
        toothMesh.position.set(Math.cos(ang) * 18, Math.sin(ang) * 18, 0);
        toothMesh.rotation.z = ang - Math.PI / 2;
        wheelHub.add(toothMesh);
      }
      rigGroup.add(wheelHub);

      this.animators.push({
        mesh: wheelHub,
        update: (dt) => {
          wheelHub.rotation.z += dt * (i % 2 === 0 ? 1.8 : -1.8);
        },
      });

      this.structuresGroup.add(rigGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Crushing Hydraulic Ore Stampers pounding vertically
    const stamperHeadGeo = this.registerGeo(new THREE.CylinderGeometry(8, 8, 12, 12));
    const pistonShaftGeo = this.registerGeo(new THREE.CylinderGeometry(2.5, 2.5, 40, 8));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const stamperGroup = new THREE.Group();
      const basePos = pt.clone().addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 45).add(new THREE.Vector3(0, 30, 0));
      stamperGroup.position.copy(basePos);

      const gantry = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(20, 6, 20)), rigMat);
      gantry.position.y = 25;
      stamperGroup.add(gantry);

      const piston = new THREE.Group();
      const shaft = new THREE.Mesh(pistonShaftGeo, rigMat);
      const head = new THREE.Mesh(stamperHeadGeo, oreMat);
      head.position.y = -20;
      piston.add(shaft, head);
      stamperGroup.add(piston);

      this.animators.push({
        mesh: piston,
        update: (_dt, time) => {
          // Sharp rhythmic slamming motion
          const cycle = (time * 2.5 + i * 1.5) % Math.PI;
          const drop = Math.pow(Math.sin(cycle), 4) * 18;
          piston.position.y = -drop;
        },
      });

      this.structuresGroup.add(stamperGroup);
    }

    // 4. LIVE-MOVING STRUCTURE: 6x Tumbling Asteroid Megablocks drifting in 3-axis rotation
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const megaAst = new THREE.Mesh(astGeo, oreMat);
      megaAst.scale.set(45, 50, 42);
      megaAst.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 110, 60 + (i % 3) * 20, 0));

      this.animators.push({
        mesh: megaAst,
        update: (dt) => {
          megaAst.rotation.x += dt * 0.35;
          megaAst.rotation.y += dt * 0.5;
          megaAst.rotation.z += dt * 0.2;
        },
      });

      this.structuresGroup.add(megaAst);
    }
  }

  // =========================================================================
  // MODE 04 — WORMHOLE EXPRESS (Subspace Rift)
  // =========================================================================
  private buildMode04WormholeExpress(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'EVENT HORIZON INLET', 'SUBSPACE EXIT SINGULARITY', 0x9333ea, 0x00f0ff);

    const warpRingGeo = this.registerGeo(new THREE.TorusGeometry(38, 2.5, 12, 32));
    const innerRingGeo = this.registerGeo(new THREE.TorusGeometry(26, 1.4, 8, 24));
    const warpMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0xc026d3, emissiveIntensity: 2.6, roughness: 0.1 }));
    const cyanWireMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));

    // 1. LIVE-MOVING STRUCTURE: 12x Interlocking Counter-Rotating Warp Acceleration Torus Portals
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const ringGroup = new THREE.Group();
      ringGroup.position.copy(pt);
      ringGroup.lookAt(pt.clone().add(tan));

      const ringOuter = new THREE.Mesh(warpRingGeo, warpMat);
      const ringInner = new THREE.Mesh(innerRingGeo, cyanWireMat);
      ringGroup.add(ringOuter, ringInner);

      this.animators.push({
        mesh: ringGroup,
        update: (dt) => {
          ringOuter.rotation.z += dt * (i % 2 === 0 ? 1.4 : -1.4);
          ringInner.rotation.z -= dt * 2.4;
        },
      });

      this.structuresGroup.add(ringGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 3x Telescoping Reality-Shift Conduits expanding and contracting
    const conduitSegGeo = this.registerGeo(new THREE.CylinderGeometry(32, 32, 20, 6, 1, true));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const conduitGroup = new THREE.Group();
      conduitGroup.position.copy(pt);
      conduitGroup.lookAt(pt.clone().add(tan));

      const seg1 = new THREE.Mesh(conduitSegGeo, warpMat);
      const seg2 = new THREE.Mesh(conduitSegGeo, cyanWireMat);
      seg2.scale.set(0.9, 1.0, 0.9);
      conduitGroup.add(seg1, seg2);

      this.animators.push({
        mesh: conduitGroup,
        update: (_dt, time) => {
          const pulsate = 1.0 + 0.3 * Math.sin(time * 3.0 + i * 2);
          conduitGroup.scale.set(pulsate, pulsate, 1.0 + 0.5 * Math.cos(time * 2.0));
        },
      });

      this.structuresGroup.add(conduitGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: Colossal Swirling Multi-Layer Wormhole Accretion Core
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 300, -2200);
    const vortexGeo1 = this.registerGeo(new THREE.RingGeometry(90, 480, 48));
    const vortexGeo2 = this.registerGeo(new THREE.RingGeometry(50, 320, 36));
    const vortexMat1 = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    const vortexMat2 = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));

    const v1 = new THREE.Mesh(vortexGeo1, vortexMat1);
    const v2 = new THREE.Mesh(vortexGeo2, vortexMat2);
    coreGroup.add(v1, v2);

    this.animators.push({
      mesh: coreGroup,
      update: (dt) => {
        v1.rotation.z += dt * 0.35;
        v2.rotation.z -= dt * 0.6;
      },
    });

    this.backgroundGroup.add(coreGroup);

    // 4. LIVE-MOVING STRUCTURE: 4x Floating Subspace Resonator Rods precessing in orbit
    const rodGeo = this.registerGeo(new THREE.CylinderGeometry(2, 2, 60, 8));
    for (let i = 0; i < 4; i++) {
      const t = (0.1 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const rod = new THREE.Mesh(rodGeo, warpMat);
      const center = pt.clone().add(new THREE.Vector3(0, 25, 0));

      this.animators.push({
        mesh: rod,
        update: (_dt, time) => {
          const ang = time * 2.0 + i * (Math.PI / 2);
          rod.position.set(center.x + Math.cos(ang) * 45, center.y + Math.sin(ang * 2) * 15, center.z + Math.sin(ang) * 45);
          rod.rotation.set(time * 1.5, time * 2.0, 0);
        },
      });

      this.structuresGroup.add(rod);
    }
  }

  // =========================================================================
  // MODE 05 — SOLAR STORM (Helios Perihelion)
  // =========================================================================
  private buildMode05SolarStorm(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'HELIOS SOLAR LAUNCH', 'PERIHELION ESCAPE GATE', 0xff4500, 0xfbbf24);

    // Distant blazing sun
    const sunGeo = this.registerGeo(new THREE.SphereGeometry(750, 32, 32));
    const sunMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff4500 }));
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(800, 350, -2400);
    this.backgroundGroup.add(sunMesh);

    const shieldMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.95, roughness: 0.15 }));
    const moltenMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff7700 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Massive Articulated Heliostat Solar Mirrors / Sails
    const sailGeo = this.registerGeo(new THREE.BoxGeometry(40, 2, 40));
    const sailMastGeo = this.registerGeo(new THREE.CylinderGeometry(2, 3, 50, 8));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.15) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const heliostatGroup = new THREE.Group();
      heliostatGroup.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 70).add(new THREE.Vector3(0, 25, 0));

      const mast = new THREE.Mesh(sailMastGeo, shieldMat);
      heliostatGroup.add(mast);

      const sailHead = new THREE.Group();
      sailHead.position.y = 25;
      const sail = new THREE.Mesh(sailGeo, moltenMat);
      sailHead.add(sail);
      heliostatGroup.add(sailHead);

      this.animators.push({
        mesh: sailHead,
        update: (_dt, time) => {
          sailHead.rotation.x = Math.sin(time * 0.8 + i) * 0.4;
          sailHead.rotation.y = Math.cos(time * 0.6 + i) * 0.5;
        },
      });

      this.structuresGroup.add(heliostatGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Rotating Molten Heat Radiator Turbines
    const rotorGeo = this.registerGeo(new THREE.CylinderGeometry(8, 8, 30, 8));
    const finGeo = this.registerGeo(new THREE.BoxGeometry(24, 1.5, 6));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const rotorGroup = new THREE.Group();
      rotorGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 60, 20, 0));

      const rotor = new THREE.Mesh(rotorGeo, shieldMat);
      rotorGroup.add(rotor);

      for (let f = 0; f < 4; f++) {
        const fin = new THREE.Mesh(finGeo, moltenMat);
        fin.rotation.y = (f * Math.PI) / 2;
        rotor.add(fin);
      }

      this.animators.push({
        mesh: rotor,
        update: (dt) => {
          rotor.rotation.y += dt * 4.2;
        },
      });

      this.structuresGroup.add(rotorGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Pulsing Coronal Ejection Magnetic Flux Arches
    const archGeo = this.registerGeo(new THREE.TorusGeometry(35, 2.5, 8, 24, Math.PI));
    for (let i = 0; i < 3; i++) {
      const t = (0.3 + i * 0.28) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const archGroup = new THREE.Group();
      archGroup.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      archGroup.lookAt(pt.clone().add(tan));
      archGroup.rotation.z = Math.PI;

      const arch = new THREE.Mesh(archGeo, moltenMat);
      archGroup.add(arch);

      this.animators.push({
        mesh: archGroup,
        update: (_dt, time) => {
          const scale = 1.0 + 0.25 * Math.sin(time * 3.5 + i * 2);
          archGroup.scale.set(scale, scale, 1.0);
        },
      });

      this.structuresGroup.add(archGroup);
    }
  }

  // =========================================================================
  // MODE 06 — GRAVITY FREE (Orbital Zero-G Testing Bay)
  // =========================================================================
  private buildMode06GravityFree(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'ZERO-G VECTOR ENTRY', 'GRAV-FREE RECOVERY DOCK', 0x0284c7, 0x00f0ff);

    const gyroMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    const blueFieldMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.55 }));

    // 1. LIVE-MOVING STRUCTURE: 5x Concentric 3-Axis Gyroscopic Stabilizers
    const gyroRingGeo = this.registerGeo(new THREE.TorusGeometry(45, 2.5, 12, 36));
    for (let i = 0; i < 5; i++) {
      const t = (0.12 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);

      const gyroGroup = new THREE.Group();
      gyroGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 90, 45, (i - 2) * 40));

      const ringX = new THREE.Mesh(gyroRingGeo, gyroMat);
      const ringY = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(36, 2.0, 12, 32)), gyroMat);
      const ringZ = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(28, 1.6, 12, 28)), blueFieldMat);
      ringY.rotation.x = Math.PI / 2;
      ringZ.rotation.y = Math.PI / 2;
      gyroGroup.add(ringX, ringY, ringZ);

      this.animators.push({
        mesh: gyroGroup,
        update: (dt) => {
          ringX.rotation.x += dt * 0.8;
          ringY.rotation.y += dt * 1.2;
          ringZ.rotation.z += dt * 1.6;
        },
      });

      this.structuresGroup.add(gyroGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 6x Floating Anti-Gravity Maglev Platforms undulating with wave buoyancy
    const padGeo = this.registerGeo(new THREE.CylinderGeometry(14, 14, 3, 8));
    const padMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 2.0 }));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const pad = new THREE.Mesh(padGeo, padMat);
      const baseY = pt.y - 12;

      this.animators.push({
        mesh: pad,
        update: (_dt, time) => {
          pad.position.set(pt.x, baseY + Math.sin(time * 1.5 + i * 1.2) * 14, pt.z);
          pad.rotation.y = time * 0.5;
        },
      });

      this.structuresGroup.add(pad);
    }

    // 3. LIVE-MOVING STRUCTURE: 2x Giant Zero-G Centrifuge Habitat Rings
    const habRingGeo = this.registerGeo(new THREE.TorusGeometry(120, 8, 12, 40));
    for (let i = 0; i < 2; i++) {
      const t = (0.3 + i * 0.45) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const habRing = new THREE.Mesh(habRingGeo, gyroMat);
      habRing.position.copy(pt).add(new THREE.Vector3(0, 100, 0));
      habRing.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: habRing,
        update: (dt) => {
          habRing.rotation.z += dt * (i === 0 ? 0.6 : -0.6);
        },
      });

      this.structuresGroup.add(habRing);
    }
  }

  // =========================================================================
  // MODE 07 — PLASMA STORM (Magnetar Refinery)
  // =========================================================================
  private buildMode07PlasmaStorm(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'MAGNETAR INTAKE GANTRY', 'FUSION REFINERY EXIT', 0x10b981, 0x064e3b);

    const reactorMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.25 }));
    const greenGlowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x10b981 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Colossal Tokamak Fusion Core Reactors with Rotating Magnetic Ring Coils
    const reactorGeo = this.registerGeo(new THREE.CylinderGeometry(24, 28, 90, 16));
    const coilGeo = this.registerGeo(new THREE.TorusGeometry(26, 2.8, 8, 24));
    for (let i = 0; i < 6; i++) {
      const t = (0.1 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 85;

      const reactorGroup = new THREE.Group();
      reactorGroup.position.copy(pt).add(new THREE.Vector3(side, 35, 0));

      const reactor = new THREE.Mesh(reactorGeo, reactorMat);
      reactorGroup.add(reactor);

      const coil = new THREE.Mesh(coilGeo, greenGlowMat);
      coil.rotation.x = Math.PI / 2;
      reactorGroup.add(coil);

      this.animators.push({
        mesh: coil,
        update: (dt) => {
          coil.rotation.z += dt * 2.2;
        },
      });

      this.structuresGroup.add(reactorGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x High-Pressure Plasma Exhaust Piston Chambers
    const pistonGeo = this.registerGeo(new THREE.CylinderGeometry(6, 6, 24, 12));
    for (let i = 0; i < 4; i++) {
      const t = (0.18 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const pGroup = new THREE.Group();
      pGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 50, 15, 0));

      const piston = new THREE.Mesh(pistonGeo, greenGlowMat);
      pGroup.add(piston);

      this.animators.push({
        mesh: piston,
        update: (_dt, time) => {
          const pump = Math.abs(Math.sin(time * 3.2 + i * 1.5)) * 18;
          piston.position.y = pump;
        },
      });

      this.structuresGroup.add(pGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 6x Rotating Magnetic Arc Conduits across track
    const pipeGeo = this.registerGeo(new THREE.TorusGeometry(32, 2.0, 8, 24, Math.PI));
    for (let i = 0; i < 6; i++) {
      const t = (0.05 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const conduitGroup = new THREE.Group();
      conduitGroup.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      conduitGroup.lookAt(pt.clone().add(tan));
      conduitGroup.rotation.z = Math.PI;

      const pipe = new THREE.Mesh(pipeGeo, reactorMat);
      const rotor = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(6, 6, 6)), greenGlowMat);
      conduitGroup.add(pipe, rotor);

      this.animators.push({
        mesh: rotor,
        update: (_dt, time) => {
          const angle = (time * 2.5 + i) % Math.PI;
          rotor.position.set(Math.cos(angle) * 32, Math.sin(angle) * 32, 0);
        },
      });

      this.structuresGroup.add(conduitGroup);
    }
  }

  // =========================================================================
  // MODE 08 — SKYLINE RUSH (Neo-Coruscant Apex)
  // =========================================================================
  private buildMode08SkylineRush(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'APEX SKYWAY GANTRY', 'CORUSCANT SUMMIT TERMINUS', 0x38bdf8, 0xfbbf24);

    const skyGeo = this.registerGeo(new THREE.BoxGeometry(70, 780, 70));
    const skyMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0b1329, roughness: 0.15, metalness: 0.9 }));
    const amberMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    const cyanLightMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));

    // 1. Skyscraper Canyon (16 Mega-Skyscrapers)
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

      this.structuresGroup.add(tower);
    }

    // 2. LIVE-MOVING STRUCTURE: 6x High-Speed Exterior Sky Elevators climbing facades
    const cabGeo = this.registerGeo(new THREE.BoxGeometry(8, 14, 8));
    for (let i = 0; i < 6; i++) {
      const t = (0.1 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 80;

      const elevator = new THREE.Mesh(cabGeo, amberMat);
      const baseY = pt.y + 120;

      this.animators.push({
        mesh: elevator,
        update: (_dt, time) => {
          const elevY = baseY + Math.sin(time * 1.8 + i * 1.4) * 140;
          elevator.position.set(pt.x + side, elevY, pt.z);
        },
      });

      this.structuresGroup.add(elevator);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Revolving Penthouse Observation Decks spinning at summits
    const deckGeo = this.registerGeo(new THREE.CylinderGeometry(45, 45, 12, 24));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const deck = new THREE.Mesh(deckGeo, skyMat);
      deck.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 110, 420, 0));

      const halo = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(46, 1.5, 8, 24)), cyanLightMat);
      halo.rotation.x = Math.PI / 2;
      deck.add(halo);

      this.animators.push({
        mesh: deck,
        update: (dt) => {
          deck.rotation.y += dt * 0.45;
        },
      });

      this.structuresGroup.add(deck);
    }

    // 4. LIVE-MOVING STRUCTURE: 8x Rooftop Mega-Turbines spinning in high winds
    const turbineBladeGeo = this.registerGeo(new THREE.BoxGeometry(28, 1.8, 4));
    for (let i = 0; i < 8; i++) {
      const t = (0.05 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const turbineGroup = new THREE.Group();
      turbineGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 90, 280, 0));

      const rotor = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(turbineBladeGeo, cyanLightMat);
        blade.rotation.z = (b * Math.PI * 2) / 3;
        rotor.add(blade);
      }
      turbineGroup.add(rotor);

      this.animators.push({
        mesh: rotor,
        update: (dt) => {
          rotor.rotation.z += dt * 5.0;
        },
      });

      this.structuresGroup.add(turbineGroup);
    }
  }

  // =========================================================================
  // MODE 09 — DEBRIS SURVIVAL (Orbital Graveyard)
  // =========================================================================
  private buildMode09DebrisSurvival(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'SALVAGE SECTOR ENTRY', 'GRAVEYARD CLEARANCE BEACON', 0xef4444, 0xb91c1c);

    const hullGeo = this.registerGeo(new THREE.CylinderGeometry(20, 24, 60, 12, 1, true));
    const hullMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e2029, roughness: 0.7, metalness: 0.7 }));
    const redHazardMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xef4444 }));

    // 1. LIVE-MOVING STRUCTURE: 4x Colossal Shattered Starship Hull Halves slowly tumbling
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const wreck = new THREE.Mesh(hullGeo, hullMat);
      wreck.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 80, 30, (i - 1.5) * 40));

      this.animators.push({
        mesh: wreck,
        update: (dt) => {
          wreck.rotation.x += dt * 0.25;
          wreck.rotation.y += dt * 0.35;
          wreck.rotation.z += dt * 0.15;
        },
      });

      this.structuresGroup.add(wreck);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Autonomous Salvage Crane Arms swinging solar wings
    const craneGeo = this.registerGeo(new THREE.BoxGeometry(4, 4, 55));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const craneGroup = new THREE.Group();
      craneGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 55, 40, 0));

      const arm = new THREE.Mesh(craneGeo, hullMat);
      arm.position.z = 25;
      craneGroup.add(arm);

      this.animators.push({
        mesh: craneGroup,
        update: (_dt, time) => {
          craneGroup.rotation.y = Math.sin(time * 1.2 + i * 1.5) * 0.6;
        },
      });

      this.structuresGroup.add(craneGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 8x Drifting Scrap Girders tumbling in flight corridor
    const girderGeo = this.registerGeo(new THREE.BoxGeometry(3, 3, 30));
    for (let i = 0; i < 8; i++) {
      const t = (0.05 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const girder = new THREE.Mesh(girderGeo, hullMat);
      girder.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 35, 15 + (i % 3) * 8, 0));

      this.animators.push({
        mesh: girder,
        update: (dt) => {
          girder.rotation.x += dt * 0.6;
          girder.rotation.y += dt * 0.4;
        },
      });

      this.structuresGroup.add(girder);
    }
  }

  // =========================================================================
  // MODE 10 — QUANTUM TIME TRIAL (Precision Quantum Testing Facility)
  // =========================================================================
  private buildMode10QuantumTimeTrial(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'QUANTUM CALIBRATION LAUNCH', 'TACHYON BENCHMARK GATE', 0x00f0ff, 0xf8fafc);

    const chromeMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.95 }));
    const cyanLaserMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const neonGreenMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
    const barrierMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x00f0ff, emissiveIntensity: 1.5, roughness: 0.2 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Interlocking Chronometer Gear Dial Assemblies
    const outerGearGeo = this.registerGeo(new THREE.TorusGeometry(34, 1.8, 12, 32));
    const innerGearGeo = this.registerGeo(new THREE.TorusGeometry(20, 1.4, 8, 24));
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const dialGroup = new THREE.Group();
      dialGroup.position.copy(pt);
      dialGroup.lookAt(pt.clone().add(tan));

      const outerGear = new THREE.Mesh(outerGearGeo, chromeMat);
      const innerGear = new THREE.Mesh(innerGearGeo, cyanLaserMat);
      dialGroup.add(outerGear, innerGear);

      this.animators.push({
        mesh: dialGroup,
        update: (dt) => {
          outerGear.rotation.z += dt * 1.0;
          innerGear.rotation.z -= dt * 2.8;
        },
      });

      this.structuresGroup.add(dialGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Timed Gates Opening and Closing According to Timers
    const gateFrameGeo = this.registerGeo(new THREE.BoxGeometry(40, 24, 6));
    const irisRingGeo = this.registerGeo(new THREE.TorusGeometry(22, 2.0, 8, 24));
    const shutterGeo = this.registerGeo(new THREE.BoxGeometry(18, 20, 2));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gateGroup = new THREE.Group();
      gateGroup.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      gateGroup.lookAt(pt.clone().add(tan));

      const irisMesh = new THREE.Mesh(irisRingGeo, chromeMat);
      const shutterLeft = new THREE.Mesh(shutterGeo, cyanLaserMat);
      const shutterRight = new THREE.Mesh(shutterGeo, cyanLaserMat);
      shutterLeft.position.x = -9;
      shutterRight.position.x = 9;

      gateGroup.add(irisMesh, shutterLeft, shutterRight);

      this.animators.push({
        mesh: gateGroup,
        update: (_dt, time) => {
          // Timer cycle: open and close cyclically
          const cycle = Math.sin(time * 2.0 + i * 1.6);
          const aperture = Math.max(0.15, Math.abs(cycle));
          shutterLeft.position.x = -9 - (aperture * 14);
          shutterRight.position.x = 9 + (aperture * 14);
          irisMesh.scale.set(0.8 + aperture * 0.4, 0.8 + aperture * 0.4, 1.0);
        },
      });

      this.structuresGroup.add(gateGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 4x Tall Calibration Towers with Synchronized Sensor Beams
    const towerGeo = this.registerGeo(new THREE.CylinderGeometry(4, 7, 75, 12));
    const sensorRotorGeo = this.registerGeo(new THREE.TorusGeometry(12, 1.2, 8, 24));
    for (let i = 0; i < 4; i++) {
      const t = (0.18 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 55;

      const towerGroup = new THREE.Group();
      towerGroup.position.copy(pt).add(new THREE.Vector3(side, 30, 0));

      const tower = new THREE.Mesh(towerGeo, chromeMat);
      const rotor = new THREE.Mesh(sensorRotorGeo, neonGreenMat);
      rotor.position.y = 32;
      rotor.rotation.x = Math.PI / 2;
      towerGroup.add(tower, rotor);

      this.animators.push({
        mesh: rotor,
        update: (dt) => {
          rotor.rotation.z += dt * 3.5;
        },
      });

      this.structuresGroup.add(towerGroup);
    }

    // 4. LIVE-MOVING STRUCTURE: 4x Rotating Barriers Altering the Racing Line
    const barrierGeo = this.registerGeo(new THREE.BoxGeometry(26, 4, 3));
    for (let i = 0; i < 4; i++) {
      const t = (0.24 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const barrierGroup = new THREE.Group();
      barrierGroup.position.copy(pt).add(new THREE.Vector3(0, 3, 0));
      barrierGroup.lookAt(pt.clone().add(tan));

      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrierGroup.add(barrier);

      this.animators.push({
        mesh: barrier,
        update: (_dt, time) => {
          // Sweeps laterally to force precise apex timing
          barrier.position.x = Math.sin(time * 2.2 + i * 1.5) * 11;
          barrier.rotation.y = Math.cos(time * 1.8 + i) * 0.35;
        },
      });

      this.structuresGroup.add(barrierGroup);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x Height-Changing Elevation Platforms Aligning on Schedule
    const platGeo = this.registerGeo(new THREE.BoxGeometry(32, 3, 24));
    for (let i = 0; i < 4; i++) {
      const t = (0.05 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const plat = new THREE.Mesh(platGeo, chromeMat);
      plat.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 38, 0, 0));

      this.animators.push({
        mesh: plat,
        update: (_dt, time) => {
          // Platform shifts in elevation on a schedule
          plat.position.y = pt.y + Math.sin(time * 1.5 + i * 2) * 12;
        },
      });

      this.structuresGroup.add(plat);
    }

    // 6. LIVE-MOVING STRUCTURE: 4x Extended Energy Rails Providing Temporary Precision Shortcuts
    const railGeo = this.registerGeo(new THREE.BoxGeometry(4, 2, 80));
    for (let i = 0; i < 4; i++) {
      const t = (0.3 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const railMesh = new THREE.Mesh(railGeo, neonGreenMat);
      railMesh.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 22, 2, 0));
      railMesh.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: railMesh,
        update: (_dt, time) => {
          // Rail extends and retracts laterally for temporary shortcut access
          const extension = 0.5 + 0.5 * Math.sin(time * 1.2 + i);
          railMesh.scale.set(1.0, 1.0, 0.7 + extension * 0.6);
        },
      });

      this.structuresGroup.add(railMesh);
    }
  }

  // =========================================================================
  // MODE 11 — ENERGY HEIST (Secure Orbital Energy Vault)
  // =========================================================================
  private buildMode11EnergyHeist(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'ORBITAL VAULT AIRLOCK', 'EXTRACTION DEPOT APEX', 0xff5500, 0xef4444);

    const armorMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.35, metalness: 0.9 }));
    const orangeCoreMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff5500, emissiveIntensity: 2.8 }));
    const laserBarrierMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff1100, wireframe: true }));

    // 1. LIVE-MOVING STRUCTURE: 4x Rotating Heavy Vault Blast Doors with Sliding Locking Bolts
    const doorGeo = this.registerGeo(new THREE.CylinderGeometry(20, 20, 6, 24));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const vaultGroup = new THREE.Group();
      vaultGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 70, 30, 0));

      const door = new THREE.Mesh(doorGeo, armorMat);
      door.rotation.x = Math.PI / 2;
      vaultGroup.add(door);

      this.animators.push({
        mesh: door,
        update: (dt) => {
          door.rotation.z += dt * 0.6;
        },
      });

      this.structuresGroup.add(vaultGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 5x Sweeping Surveillance Radar Searchlights
    const lightHeadGeo = this.registerGeo(new THREE.ConeGeometry(8, 30, 16));
    const lightMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.45 }));
    for (let i = 0; i < 5; i++) {
      const t = (0.08 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);
      const searchGroup = new THREE.Group();
      searchGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 60, 45, 0));

      const beam = new THREE.Mesh(lightHeadGeo, lightMat);
      beam.position.y = -15;
      searchGroup.add(beam);

      this.animators.push({
        mesh: searchGroup,
        update: (_dt, time) => {
          searchGroup.rotation.y = Math.sin(time * 1.8 + i * 1.2) * 0.8;
          searchGroup.rotation.x = 0.3 + Math.cos(time * 1.4) * 0.2;
        },
      });

      this.structuresGroup.add(searchGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 4x Pumping Radioactive Energy Core Pistons
    const pistonHeadGeo = this.registerGeo(new THREE.CylinderGeometry(10, 10, 16, 16));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const piston = new THREE.Mesh(pistonHeadGeo, orangeCoreMat);
      piston.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 50, 20, 0));

      this.animators.push({
        mesh: piston,
        update: (_dt, time) => {
          const pump = Math.abs(Math.sin(time * 2.8 + i * 1.5)) * 18;
          piston.position.y = 20 + pump;
        },
      });

      this.structuresGroup.add(piston);
    }

    // 4. LIVE-MOVING STRUCTURE: 3x Rotating Orbital Reactor Rings Encircling Conduits
    const reactorRingGeo = this.registerGeo(new THREE.TorusGeometry(36, 2.2, 12, 32));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const ringGroup = new THREE.Group();
      ringGroup.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      ringGroup.lookAt(pt.clone().add(tan));

      const ringMesh = new THREE.Mesh(reactorRingGeo, orangeCoreMat);
      ringGroup.add(ringMesh);

      this.animators.push({
        mesh: ringMesh,
        update: (dt) => {
          ringMesh.rotation.z += dt * (i % 2 === 0 ? 2.2 : -2.2);
        },
      });

      this.structuresGroup.add(ringGroup);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x Vertical Cargo Lifts Transporting Glowing Energy Containers
    const containerGeo = this.registerGeo(new THREE.BoxGeometry(10, 8, 14));
    for (let i = 0; i < 4; i++) {
      const t = (0.25 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 36;
      const container = new THREE.Mesh(containerGeo, orangeCoreMat);
      container.position.copy(pt).add(new THREE.Vector3(side, 10, 0));

      this.animators.push({
        mesh: container,
        update: (_dt, time) => {
          container.position.y = pt.y + 10 + Math.sin(time * 1.6 + i) * 15;
        },
      });

      this.structuresGroup.add(container);
    }

    // 6. LIVE-MOVING STRUCTURE: 3x Retracting Extraction Bridges & Moving Defensive Barriers
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(32, 3, 20));
    for (let i = 0; i < 3; i++) {
      const t = (0.35 + i * 0.26) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(bridgeGeo, armorMat);
      bridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 20, 2, 0));

      this.animators.push({
        mesh: bridge,
        update: (_dt, time) => {
          // Slide in and out representing bridge retraction/deployment during lockdown
          bridge.position.x = pt.x + (i % 2 === 0 ? 20 : -20) + Math.sin(time * 1.4 + i) * 12;
        },
      });

      this.structuresGroup.add(bridge);
    }
  }

  // =========================================================================
  // MODE 12 — DRONE ASSAULT (Aegis Garrison)
  // =========================================================================
  private buildMode12DroneAssault(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'AEGIS PERIMETER GARRISON', 'COMBAT EXCLUSION BOUNDARY', 0xeab308, 0xca8a04);

    const milMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1e24, metalness: 0.85, roughness: 0.3 }));
    const tacticalYellowMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xeab308 }));

    // 1. LIVE-MOVING STRUCTURE: 5x Dual-Barrel Anti-Air Defense Turrets tracking headings
    const turretBaseGeo = this.registerGeo(new THREE.CylinderGeometry(8, 10, 12, 12));
    const barrelGeo = this.registerGeo(new THREE.CylinderGeometry(1.2, 1.2, 28, 8));
    for (let i = 0; i < 5; i++) {
      const t = (0.1 + i * 0.18) % 1.0;
      const pt = curve.getPointAt(t);
      const turretGroup = new THREE.Group();
      turretGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 65, 20, 0));

      const base = new THREE.Mesh(turretBaseGeo, milMat);
      turretGroup.add(base);

      const head = new THREE.Group();
      head.position.y = 6;
      const b1 = new THREE.Mesh(barrelGeo, milMat);
      b1.position.set(-3, 0, 14);
      b1.rotation.x = Math.PI / 2;
      const b2 = new THREE.Mesh(barrelGeo, milMat);
      b2.position.set(3, 0, 14);
      b2.rotation.x = Math.PI / 2;
      head.add(b1, b2);
      turretGroup.add(head);

      this.animators.push({
        mesh: head,
        update: (_dt, time) => {
          head.rotation.y = Math.sin(time * 1.5 + i * 1.2) * 1.2;
          head.rotation.x = -0.1 + Math.sin(time * 2.2) * 0.25;
        },
      });

      this.structuresGroup.add(turretGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Rotating Phased-Array Military Radars
    const dishGeo = this.registerGeo(new THREE.CylinderGeometry(14, 2, 8, 16, 1, true));
    for (let i = 0; i < 4; i++) {
      const t = (0.16 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const radar = new THREE.Mesh(dishGeo, milMat);
      radar.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 85, 80, 0));
      radar.rotation.x = 0.5;

      this.animators.push({
        mesh: radar,
        update: (dt) => {
          radar.rotation.y += dt * 3.2;
        },
      });

      this.structuresGroup.add(radar);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Subterranean Drone Launch Elevators
    const platGeo = this.registerGeo(new THREE.BoxGeometry(22, 2, 22));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const plat = new THREE.Mesh(platGeo, tacticalYellowMat);
      const baseY = pt.y - 10;

      this.animators.push({
        mesh: plat,
        update: (_dt, time) => {
          plat.position.set(pt.x + (i % 2 === 0 ? 45 : -45), baseY + Math.abs(Math.sin(time * 1.5 + i)) * 25, pt.z);
        },
      });

      this.structuresGroup.add(plat);
    }

    // 4. LIVE-MOVING STRUCTURE: 3x Drone Launch Arms Deploying Aircraft & Docking
    const armGeo = this.registerGeo(new THREE.BoxGeometry(4, 4, 35));
    for (let i = 0; i < 3; i++) {
      const t = (0.3 + i * 0.28) % 1.0;
      const pt = curve.getPointAt(t);
      const arm = new THREE.Mesh(armGeo, milMat);
      arm.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 35, 24, 0));

      this.animators.push({
        mesh: arm,
        update: (_dt, time) => {
          arm.rotation.y = Math.sin(time * 1.8 + i) * 0.8;
          arm.rotation.z = Math.cos(time * 1.5 + i) * 0.25;
        },
      });

      this.structuresGroup.add(arm);
    }

    // 5. LIVE-MOVING STRUCTURE: 2x Hangar Doors Opening and Closing on Timers
    const hangarDoorGeo = this.registerGeo(new THREE.BoxGeometry(36, 18, 4));
    for (let i = 0; i < 2; i++) {
      const t = (0.45 + i * 0.35) % 1.0;
      const pt = curve.getPointAt(t);
      const doorGroup = new THREE.Group();
      doorGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 60, 15, 0));

      const doorL = new THREE.Mesh(hangarDoorGeo, milMat);
      doorL.position.x = -18;
      const doorR = new THREE.Mesh(hangarDoorGeo, milMat);
      doorR.position.x = 18;
      doorGroup.add(doorL, doorR);

      this.animators.push({
        mesh: doorGroup,
        update: (_dt, time) => {
          const openOffset = Math.max(0, Math.sin(time * 1.2 + i * 2)) * 14;
          doorL.position.x = -18 - openOffset;
          doorR.position.x = 18 + openOffset;
        },
      });

      this.structuresGroup.add(doorGroup);
    }
  }

  // =========================================================================
  // MODE 13 — COLLAPSING TRACK (Fracture Sector)
  // =========================================================================
  private buildMode13CollapsingTrack(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'TECTONIC EVACUATION PORTAL', 'SEISMIC REFUGE REDOUBT', 0xf97316, 0xe11d48);

    const brokenMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x221a18, roughness: 0.8, metalness: 0.5 }));
    const hazardMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf97316 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Seismically Buckling Roadway Cantilevers rocking with tremors
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(45, 6, 22));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.15) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(bridgeGeo, brokenMat);
      bridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 45, 12, 0));

      this.animators.push({
        mesh: bridge,
        update: (_dt, time) => {
          bridge.rotation.x = Math.sin(time * 2.2 + i) * 0.14;
          bridge.rotation.z = Math.cos(time * 1.8 + i) * 0.1;
        },
      });

      this.structuresGroup.add(bridge);
    }

    // 2. LIVE-MOVING STRUCTURE: 3x Collapsing Overhead Construction Cranes swaying over voids
    const craneTowerGeo = this.registerGeo(new THREE.BoxGeometry(4, 70, 4));
    const craneArmGeo = this.registerGeo(new THREE.BoxGeometry(60, 4, 4));
    for (let i = 0; i < 3; i++) {
      const t = (0.2 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const craneGroup = new THREE.Group();
      craneGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 55, 35, 0));

      const tower = new THREE.Mesh(craneTowerGeo, hazardMat);
      const arm = new THREE.Mesh(craneArmGeo, hazardMat);
      arm.position.y = 35;
      craneGroup.add(tower, arm);

      this.animators.push({
        mesh: craneGroup,
        update: (_dt, time) => {
          craneGroup.rotation.z = Math.sin(time * 1.1 + i * 1.5) * 0.16;
        },
      });

      this.structuresGroup.add(craneGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 4x Crushing Hydraulic Demolition Hammers swinging across track
    const hammerGeo = this.registerGeo(new THREE.BoxGeometry(10, 16, 10));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const hammerGroup = new THREE.Group();
      hammerGroup.position.copy(pt).add(new THREE.Vector3(0, 45, 0));

      const hammer = new THREE.Mesh(hammerGeo, brokenMat);
      hammer.position.y = -25;
      hammerGroup.add(hammer);

      this.animators.push({
        mesh: hammerGroup,
        update: (_dt, time) => {
          hammerGroup.rotation.z = Math.sin(time * 2.6 + i * 1.3) * 0.7;
        },
      });

      this.structuresGroup.add(hammerGroup);
    }

    // 4. LIVE-MOVING STRUCTURE: 4x Tilting Road Plates Separating Under Seismic Stress
    const plateGeo = this.registerGeo(new THREE.BoxGeometry(28, 2, 18));
    for (let i = 0; i < 4; i++) {
      const t = (0.28 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const plate = new THREE.Mesh(plateGeo, brokenMat);
      plate.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 22, 1, 0));

      this.animators.push({
        mesh: plate,
        update: (_dt, time) => {
          // Road plates tilt and separate, creating gaps
          plate.rotation.z = Math.sin(time * 1.7 + i * 1.5) * 0.25;
          plate.position.y = pt.y + 1 + Math.sin(time * 2.0 + i) * 3;
        },
      });

      this.structuresGroup.add(plate);
    }

    // 5. LIVE-MOVING STRUCTURE: 3x Deploying Hydraulic Emergency Bridges Extending Alternate Routes
    const emergBridgeGeo = this.registerGeo(new THREE.BoxGeometry(40, 3, 14));
    for (let i = 0; i < 3; i++) {
      const t = (0.35 + i * 0.28) % 1.0;
      const pt = curve.getPointAt(t);
      const emergBridge = new THREE.Mesh(emergBridgeGeo, hazardMat);
      emergBridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 30, 4, 0));

      this.animators.push({
        mesh: emergBridge,
        update: (_dt, time) => {
          // Hydraulic bridge extends across the chasm
          const extend = 0.5 + 0.5 * Math.sin(time * 1.3 + i);
          emergBridge.scale.set(0.6 + extend * 0.6, 1.0, 1.0);
        },
      });

      this.structuresGroup.add(emergBridge);
    }
  }

  // =========================================================================
  // MODE 14 — RING RUNNER (Torus Habitat Orbit)
  // =========================================================================
  private buildMode14RingRunner(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'STANFORD HUB INJECTION GATE', 'TORUS REVOLUTION CHECKPOINT', 0x38bdf8, 0x0284c7);

    const ringMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 }));
    const windowRingMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));

    // 1. LIVE-MOVING STRUCTURE: Distant Stanford Torus Habitat Ring (Radius 850m)
    const grandRing = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(850, 24, 16, 64)), ringMat);
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

    // 2. LIVE-MOVING STRUCTURE: 6x Track-Level Rotary Accelerator Ring Stations with Counter-Spinning Guides
    const localRingGeo = this.registerGeo(new THREE.TorusGeometry(32, 2.2, 12, 32));
    const innerGuideGeo = this.registerGeo(new THREE.TorusGeometry(22, 1.2, 8, 24));
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const stGroup = new THREE.Group();
      stGroup.position.copy(pt);
      stGroup.lookAt(pt.clone().add(tan));

      const rOut = new THREE.Mesh(localRingGeo, ringMat);
      const rIn = new THREE.Mesh(innerGuideGeo, windowRingMat);
      stGroup.add(rOut, rIn);

      this.animators.push({
        mesh: stGroup,
        update: (dt) => {
          rOut.rotation.z += dt * 1.2;
          rIn.rotation.z -= dt * 2.2;
        },
      });

      this.structuresGroup.add(stGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 8x Spinning Magnetic Stabilizer Hoops along the race line
    const hoopGeo = this.registerGeo(new THREE.TorusGeometry(26, 1.0, 8, 24));
    for (let i = 0; i < 8; i++) {
      const t = (0.05 + i * 0.12) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const hoop = new THREE.Mesh(hoopGeo, windowRingMat);
      hoop.position.copy(pt);
      hoop.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: hoop,
        update: (dt) => {
          hoop.rotation.z += dt * 1.8;
        },
      });

      this.structuresGroup.add(hoop);
    }

    // 4. LIVE-MOVING STRUCTURE: 4x Connecting Bridges Rotating into Alignment Across Concentric Rings
    const bridgeGeo = this.registerGeo(new THREE.BoxGeometry(36, 3, 16));
    for (let i = 0; i < 4; i++) {
      const t = (0.18 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.copy(pt).add(new THREE.Vector3(0, 14, 0));

      const bridgeMesh = new THREE.Mesh(bridgeGeo, ringMat);
      bridgeGroup.add(bridgeMesh);

      this.animators.push({
        mesh: bridgeGroup,
        update: (dt) => {
          // Bridges rotate slowly around vertical pivot into timed alignment
          bridgeGroup.rotation.y += dt * 0.45;
        },
      });

      this.structuresGroup.add(bridgeGroup);
    }

    // 5. LIVE-MOVING STRUCTURE: 6x Magnetic Acceleration Panels Shifting Along the Racing Line
    const panelGeo = this.registerGeo(new THREE.BoxGeometry(14, 2, 28));
    for (let i = 0; i < 6; i++) {
      const t = (0.22 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const panel = new THREE.Mesh(panelGeo, windowRingMat);
      panel.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 18, 0.5, 0));

      this.animators.push({
        mesh: panel,
        update: (_dt, time) => {
          // Magnetic panels translate radially to alter inner vs outer lines
          panel.position.x = pt.x + ((i % 2 === 0 ? 1 : -1) * (18 + Math.sin(time * 2.0 + i) * 8));
        },
      });

      this.structuresGroup.add(panel);
    }
  }

  // =========================================================================
  // MODE 15 — HYPERSPACE SPRINT (Tachyon Slipstream)
  // =========================================================================
  private buildMode15HyperspaceSprint(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'WARP INJECTION PORT', 'HYPERSPACE RE-ENTRY CONDUIT', 0xec4899, 0x00f0ff);

    const tunnelMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.75 }));
    const cyanWireMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));

    // 1. LIVE-MOVING STRUCTURE: 14x Pulsating Relativistic Warp Compression Rings
    const tunnelRingGeo = this.registerGeo(new THREE.TorusGeometry(32, 1.4, 8, 24));
    for (let i = 0; i < 14; i++) {
      const t = (i / 14) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const hoop = new THREE.Mesh(tunnelRingGeo, i % 2 === 0 ? tunnelMat : cyanWireMat);
      hoop.position.copy(pt);
      hoop.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: hoop,
        update: (_dt, time) => {
          const pulsate = 1.0 + 0.4 * Math.sin(time * 4.2 - i * 0.5);
          hoop.scale.set(pulsate, pulsate, 1.0);
        },
      });

      this.structuresGroup.add(hoop);
    }

    // 2. LIVE-MOVING STRUCTURE: 6x Hyperdrive Stator Fins rotating at blinding speeds
    const statorGeo = this.registerGeo(new THREE.BoxGeometry(4, 25, 4));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const statorGroup = new THREE.Group();
      statorGroup.position.copy(pt);
      statorGroup.lookAt(pt.clone().add(tan));

      const fin1 = new THREE.Mesh(statorGeo, cyanWireMat);
      fin1.position.y = 28;
      const fin2 = new THREE.Mesh(statorGeo, cyanWireMat);
      fin2.position.y = -28;
      statorGroup.add(fin1, fin2);

      this.animators.push({
        mesh: statorGroup,
        update: (dt) => {
          statorGroup.rotation.z += dt * 8.0;
        },
      });

      this.structuresGroup.add(statorGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 6x Rotating Tachyon Prism Emitters
    const prismGeo = this.registerGeo(new THREE.ConeGeometry(8, 20, 4));
    for (let i = 0; i < 6; i++) {
      const t = (0.12 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const prism = new THREE.Mesh(prismGeo, tunnelMat);
      prism.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 45, 20, 0));

      this.animators.push({
        mesh: prism,
        update: (dt) => {
          prism.rotation.y += dt * 2.5;
          prism.rotation.x += dt * 1.2;
        },
      });

      this.structuresGroup.add(prism);
    }

    // 4. LIVE-MOVING STRUCTURE: 6x Sideways Shifting Track Lanes & Reconfiguring Corridor Segments
    const laneGeo = this.registerGeo(new THREE.BoxGeometry(22, 2, 45));
    for (let i = 0; i < 6; i++) {
      const t = (0.05 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const lane = new THREE.Mesh(laneGeo, cyanWireMat);
      lane.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 16, 1, 0));

      this.animators.push({
        mesh: lane,
        update: (_dt, time) => {
          // Track lanes shift sideways to challenge lane switching
          lane.position.x = pt.x + Math.sin(time * 3.0 + i * 1.4) * 14;
        },
      });

      this.structuresGroup.add(lane);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x Extending and Retracting Hyperspace Energy Rails
    const railGeo = this.registerGeo(new THREE.BoxGeometry(3, 2, 60));
    for (let i = 0; i < 4; i++) {
      const t = (0.22 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const rail = new THREE.Mesh(railGeo, tunnelMat);
      rail.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 20, 2, 0));
      rail.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: rail,
        update: (_dt, time) => {
          const extend = 0.5 + 0.5 * Math.sin(time * 2.5 + i);
          rail.scale.set(1.0, 1.0, 0.5 + extend * 0.8);
        },
      });

      this.structuresGroup.add(rail);
    }
  }

  // =========================================================================
  // MODE 16 — RIVAL DUEL (Colosseum Apex)
  // =========================================================================
  private buildMode16RivalDuel(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'IMPERIAL DUEL ARENA ARCH', "COLOSSEUM CHAMPION'S GATE", 0x1e3a8a, 0x60a5fa);

    const stadiumMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.85 }));
    const blueNeonMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x60a5fa }));

    // 1. LIVE-MOVING STRUCTURE: 4x Revolving Colosseum Spectator Sky-Rings orbiting the arena
    const skyRingGeo = this.registerGeo(new THREE.TorusGeometry(140, 10, 8, 36));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);

      const skyRing = new THREE.Mesh(skyRingGeo, stadiumMat);
      skyRing.position.copy(pt).add(new THREE.Vector3(0, 80, 0));
      skyRing.rotation.x = Math.PI * 0.45;

      this.animators.push({
        mesh: skyRing,
        update: (dt) => {
          skyRing.rotation.z += dt * (i % 2 === 0 ? 0.45 : -0.45);
        },
      });

      this.structuresGroup.add(skyRing);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Hydraulic Spike Hazard Pillars rising and sinking beside duel track
    const spikeGeo = this.registerGeo(new THREE.ConeGeometry(5, 25, 6));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const spike = new THREE.Mesh(spikeGeo, blueNeonMat);
      spike.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 35, 0, 0));

      this.animators.push({
        mesh: spike,
        update: (_dt, time) => {
          const rise = Math.abs(Math.sin(time * 2.6 + i * 1.5)) * 16;
          spike.position.y = rise;
        },
      });

      this.structuresGroup.add(spike);
    }

    // 3. LIVE-MOVING STRUCTURE: 6x Panning Stadium Floodlight Searchlights
    const lightConeGeo = this.registerGeo(new THREE.ConeGeometry(6, 40, 12));
    const spotMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.35 }));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const spotGroup = new THREE.Group();
      spotGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 70, 50, 0));

      const cone = new THREE.Mesh(lightConeGeo, spotMat);
      cone.position.y = -20;
      spotGroup.add(cone);

      this.animators.push({
        mesh: spotGroup,
        update: (_dt, time) => {
          spotGroup.rotation.y = Math.sin(time * 1.6 + i * 1.2) * 0.7;
          spotGroup.rotation.x = 0.4 + Math.cos(time * 1.3) * 0.3;
        },
      });

      this.structuresGroup.add(spotGroup);
    }

    // 4. LIVE-MOVING STRUCTURE: 4x Rotating Split-Level Duel Platforms Shifting Race Line Configurations
    const platGeo = this.registerGeo(new THREE.BoxGeometry(34, 4, 22));
    for (let i = 0; i < 4; i++) {
      const t = (0.28 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const plat = new THREE.Mesh(platGeo, stadiumMat);
      plat.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 28, 6, 0));

      this.animators.push({
        mesh: plat,
        update: (dt) => {
          // Platforms rotate between defined duel angles
          plat.rotation.y += dt * 0.4;
        },
      });

      this.structuresGroup.add(plat);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x Tactical Rising Barriers Shifting Between Lanes
    const barrierGeo = this.registerGeo(new THREE.BoxGeometry(16, 8, 3));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const barrier = new THREE.Mesh(barrierGeo, blueNeonMat);
      barrier.position.copy(pt).add(new THREE.Vector3(0, 0, 0));

      this.animators.push({
        mesh: barrier,
        update: (_dt, time) => {
          // Barriers rise from track and shift across lanes
          barrier.position.y = pt.y + Math.max(0, Math.sin(time * 2.0 + i * 1.5)) * 8;
          barrier.position.x = pt.x + Math.sin(time * 1.4 + i) * 10;
        },
      });

      this.structuresGroup.add(barrier);
    }

    // 6. LIVE-MOVING STRUCTURE: 3x Extending Overtake Side Ramps
    const rampGeo = this.registerGeo(new THREE.BoxGeometry(24, 2, 40));
    for (let i = 0; i < 3; i++) {
      const t = (0.35 + i * 0.26) % 1.0;
      const pt = curve.getPointAt(t);
      const ramp = new THREE.Mesh(rampGeo, stadiumMat);
      ramp.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 25, 3, 0));
      ramp.rotation.x = -0.15;

      this.animators.push({
        mesh: ramp,
        update: (_dt, time) => {
          // Ramps extend and retract for tactical overtake windows
          ramp.position.x = pt.x + (i % 2 === 0 ? 25 : -25) + Math.sin(time * 1.6 + i) * 6;
        },
      });

      this.structuresGroup.add(ramp);
    }
  }

  // =========================================================================
  // MODE 17 — RELAY RACE (Planetary Transition Highway)
  // =========================================================================
  private buildMode17RelayRace(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'OLYMPIC RELAY STAGING ARCH', 'SECTOR FINISH TRANSIT HUB', 0xa855f7, 0x38bdf8);

    const legColors = [0x38bdf8, 0xf59e0b, 0xa855f7];
    const gateGeo = this.registerGeo(new THREE.BoxGeometry(48, 26, 8));
    const gateMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0xa855f7, emissiveIntensity: 2.0 }));

    // 1. LIVE-MOVING STRUCTURE: 3x Giant Baton Transfer Gantry Cranes with Extending Robot Arms
    for (let leg = 0; leg < 3; leg++) {
      const t = leg / 3;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.copy(pt).add(new THREE.Vector3(0, 13, 0));
      gate.lookAt(pt.clone().add(tan));

      // Mechanical transfer arm
      const armGeo = this.registerGeo(new THREE.BoxGeometry(3, 3, 25));
      const arm = new THREE.Mesh(armGeo, this.registerMat(new THREE.MeshBasicMaterial({ color: legColors[leg] })));
      arm.position.set(0, 15, 0);
      gate.add(arm);

      this.animators.push({
        mesh: arm,
        update: (_dt, time) => {
          arm.position.x = Math.sin(time * 1.8 + leg * 2) * 16;
        },
      });

      this.structuresGroup.add(gate);
    }

    // 2. LIVE-MOVING STRUCTURE: 6x Rotating Team Energy Transfer Beacons
    const beaconRotGeo = this.registerGeo(new THREE.BoxGeometry(16, 2, 2));
    for (let i = 0; i < 6; i++) {
      const t = (0.12 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 45, 18, 0));

      const rotor = new THREE.Mesh(beaconRotGeo, this.registerMat(new THREE.MeshBasicMaterial({ color: legColors[i % 3] })));
      beaconGroup.add(rotor);

      this.animators.push({
        mesh: rotor,
        update: (dt) => {
          rotor.rotation.y += dt * 3.2;
        },
      });

      this.structuresGroup.add(beaconGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 3x Handoff Platforms Rising and Descending into Handoff Alignment
    const handoffPlatGeo = this.registerGeo(new THREE.BoxGeometry(32, 3, 24));
    for (let leg = 0; leg < 3; leg++) {
      const t = (0.28 + leg * 0.33) % 1.0;
      const pt = curve.getPointAt(t);
      const plat = new THREE.Mesh(handoffPlatGeo, gateMat);
      plat.position.copy(pt).add(new THREE.Vector3(0, 1, 0));

      this.animators.push({
        mesh: plat,
        update: (_dt, time) => {
          // Platforms raise and lower into synchronization
          plat.position.y = pt.y + 1 + Math.sin(time * 1.5 + leg * 2) * 5;
        },
      });

      this.structuresGroup.add(plat);
    }

    // 4. LIVE-MOVING STRUCTURE: 3x Deploying Inter-Sector Transport Bridges
    const interBridgeGeo = this.registerGeo(new THREE.BoxGeometry(38, 2, 16));
    for (let i = 0; i < 3; i++) {
      const t = (0.18 + i * 0.33) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(interBridgeGeo, gateMat);
      bridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 25, 4, 0));

      this.animators.push({
        mesh: bridge,
        update: (_dt, time) => {
          const deploy = 0.5 + 0.5 * Math.sin(time * 1.4 + i);
          bridge.scale.set(0.6 + deploy * 0.6, 1.0, 1.0);
        },
      });

      this.structuresGroup.add(bridge);
    }
  }

  // =========================================================================
  // MODE 18 — SURVIVAL ELIMINATION (Knockout Dome)
  // =========================================================================
  private buildMode18SurvivalElimination(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'KNOCKOUT PERIMETER GATES', 'LAST SURVIVOR APEX PORTAL', 0xf43f5e, 0xbe123c);

    // Geodesic force dome
    const domeGeo = this.registerGeo(new THREE.IcosahedronGeometry(750, 2));
    const domeMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.18 }));
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.set(0, 100, -1000);
    this.backgroundGroup.add(domeMesh);

    const redLaserMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    const pylonMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1c1917, emissive: 0xf43f5e, emissiveIntensity: 2.2 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Sweeping Death-Zone Scanner Towers with Rotating Laser Cones
    const laserConeGeo = this.registerGeo(new THREE.ConeGeometry(12, 35, 12));
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const scanTower = new THREE.Group();
      scanTower.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 45, 20, 0));

      const cone = new THREE.Mesh(laserConeGeo, redLaserMat);
      cone.position.y = -15;
      scanTower.add(cone);

      this.animators.push({
        mesh: scanTower,
        update: (_dt, time) => {
          scanTower.rotation.y = Math.sin(time * 2.1 + i * 1.3) * 0.9;
        },
      });

      this.structuresGroup.add(scanTower);
    }

    // 2. LIVE-MOVING STRUCTURE: 5x Heavy Rotating Incinerator Security Gates
    const bladeGeo = this.registerGeo(new THREE.BoxGeometry(32, 2.5, 3));
    for (let i = 0; i < 5; i++) {
      const t = (0.15 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gateGroup = new THREE.Group();
      gateGroup.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      gateGroup.lookAt(pt.clone().add(tan));

      const blade = new THREE.Mesh(bladeGeo, redLaserMat);
      gateGroup.add(blade);

      this.animators.push({
        mesh: blade,
        update: (dt) => {
          blade.rotation.z += dt * 2.8;
        },
      });

      this.structuresGroup.add(gateGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 4x Retractable Outer Track Sections Retracting in Stages
    const outerLaneGeo = this.registerGeo(new THREE.BoxGeometry(22, 2, 40));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.22) % 1.0;
      const pt = curve.getPointAt(t);
      const outerLane = new THREE.Mesh(outerLaneGeo, pylonMat);
      outerLane.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 22, 1, 0));

      this.animators.push({
        mesh: outerLane,
        update: (_dt, time) => {
          // Outer lanes retract inward as elimination stages progress
          const retract = Math.max(0, Math.sin(time * 1.5 + i * 1.5));
          outerLane.position.x = pt.x + (i % 2 === 0 ? 22 : -22) - ((i % 2 === 0 ? 1 : -1) * retract * 16);
        },
      });

      this.structuresGroup.add(outerLane);
    }

    // 4. LIVE-MOVING STRUCTURE: 3x Safe-Zone Bridges Extending and Retracting to Elevated Sanctuaries
    const safeBridgeGeo = this.registerGeo(new THREE.BoxGeometry(34, 3, 16));
    for (let i = 0; i < 3; i++) {
      const t = (0.32 + i * 0.28) % 1.0;
      const pt = curve.getPointAt(t);
      const safeBridge = new THREE.Mesh(safeBridgeGeo, redLaserMat);
      safeBridge.position.copy(pt).add(new THREE.Vector3(0, 10, 0));

      this.animators.push({
        mesh: safeBridge,
        update: (_dt, time) => {
          const extend = 0.5 + 0.5 * Math.sin(time * 1.6 + i);
          safeBridge.scale.set(0.6 + extend * 0.6, 1.0, 1.0);
        },
      });

      this.structuresGroup.add(safeBridge);
    }
  }

  // =========================================================================
  // MODE 19 — COSMIC TREASURE HUNT (Precursor Crypt)
  // =========================================================================
  private buildMode19CosmicTreasureHunt(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'PRECURSOR STARGATE ENTRANCE', 'TREASURE SANCTUM THRESHOLD', 0x34d399, 0x059669);

    const obeliskGeo = this.registerGeo(new THREE.BoxGeometry(12, 85, 12));
    const obeliskMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.95 }));
    const emeraldMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x34d399, emissiveIntensity: 2.2, roughness: 0.1 }));

    // 1. LIVE-MOVING STRUCTURE: 6x Levitating Alien Monoliths with Anti-Grav Bobbing & Yaw
    for (let i = 0; i < 6; i++) {
      const t = (0.08 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 75;

      const monolith = new THREE.Mesh(obeliskGeo, obeliskMat);
      const baseY = pt.y + 40;

      this.animators.push({
        mesh: monolith,
        update: (dt, time) => {
          monolith.position.set(pt.x + side, baseY + Math.sin(time * 1.3 + i * 1.2) * 16, pt.z);
          monolith.rotation.y += dt * 0.35;
        },
      });

      this.structuresGroup.add(monolith);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Multi-Tiered Rotating Celestial Puzzle Spheres
    const ring1Geo = this.registerGeo(new THREE.TorusGeometry(25, 1.6, 8, 24));
    const ring2Geo = this.registerGeo(new THREE.TorusGeometry(18, 1.2, 8, 20));
    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const puzzleGroup = new THREE.Group();
      puzzleGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 60, 35, 0));

      const r1 = new THREE.Mesh(ring1Geo, emeraldMat);
      const r2 = new THREE.Mesh(ring2Geo, obeliskMat);
      puzzleGroup.add(r1, r2);

      this.animators.push({
        mesh: puzzleGroup,
        update: (dt) => {
          r1.rotation.x += dt * 0.8;
          r1.rotation.y += dt * 1.1;
          r2.rotation.z += dt * 1.5;
        },
      });

      this.structuresGroup.add(puzzleGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 4x Hovering Emerald Crystal Pyramids
    const pyrGeo = this.registerGeo(new THREE.ConeGeometry(16, 26, 4));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const pyr = new THREE.Mesh(pyrGeo, emeraldMat);
      const baseY = pt.y + 45;

      this.animators.push({
        mesh: pyr,
        update: (dt, time) => {
          pyr.position.set(pt.x, baseY + Math.sin(time * 1.8 + i) * 12, pt.z);
          pyr.rotation.y += dt * 1.2;
          pyr.rotation.x += dt * 0.4;
        },
      });

      this.structuresGroup.add(pyr);
    }

    // 4. LIVE-MOVING STRUCTURE: 3x Ancient Temple Doors Rotating Open
    const doorGeo = this.registerGeo(new THREE.BoxGeometry(28, 36, 4));
    for (let i = 0; i < 3; i++) {
      const t = (0.28 + i * 0.3) % 1.0;
      const pt = curve.getPointAt(t);
      const doorGroup = new THREE.Group();
      doorGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 35, 18, 0));

      const door = new THREE.Mesh(doorGeo, obeliskMat);
      doorGroup.add(door);

      this.animators.push({
        mesh: doorGroup,
        update: (_dt, time) => {
          doorGroup.rotation.y = Math.sin(time * 1.4 + i * 1.8) * 0.9;
        },
      });

      this.structuresGroup.add(doorGroup);
    }

    // 5. LIVE-MOVING STRUCTURE: 4x Floating Crystal Platforms Assembling into Paths
    const crystalPlatGeo = this.registerGeo(new THREE.BoxGeometry(26, 3, 20));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const plat = new THREE.Mesh(crystalPlatGeo, emeraldMat);
      plat.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 25, 2, 0));

      this.animators.push({
        mesh: plat,
        update: (_dt, time) => {
          // Assembling and aligning with path
          const shift = Math.sin(time * 1.7 + i) * 8;
          plat.position.x = pt.x + (i % 2 === 0 ? 25 : -25) + shift;
          plat.position.y = pt.y + 2 + Math.cos(time * 1.5 + i) * 3;
        },
      });

      this.structuresGroup.add(plat);
    }
  }

  // =========================================================================
  // MODE 20 — VOID CHAMPIONSHIP (Apex Premier Arena)
  // =========================================================================
  private buildMode20VoidChampionship(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    this.buildModeStartFinish(curve, 'CHAMPIONSHIP APEX START', 'GRAND PRIX PODIUM FINISH', 0xfbbf24, 0x1e3a8a);

    const goldMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xfbbf24, emissiveIntensity: 2.0, roughness: 0.15, metalness: 0.95 }));
    const cobaltMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.85 }));

    // 1. LIVE-MOVING STRUCTURE: 5x Revolving Golden Triumphal Arches with Counter-Rotating Laurel Rings
    const archGeo = this.registerGeo(new THREE.TorusGeometry(38, 3.5, 12, 36, Math.PI));
    const laurelRingGeo = this.registerGeo(new THREE.TorusGeometry(14, 1.2, 8, 24));
    for (let i = 0; i < 5; i++) {
      const t = (0.1 + i * 0.2) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const archGroup = new THREE.Group();
      archGroup.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      archGroup.lookAt(pt.clone().add(tan));
      archGroup.rotation.z = Math.PI;

      const arch = new THREE.Mesh(archGeo, goldMat);
      archGroup.add(arch);

      const laurel = new THREE.Mesh(laurelRingGeo, goldMat);
      laurel.position.set(0, 38, 0);
      archGroup.add(laurel);

      this.animators.push({
        mesh: laurel,
        update: (dt) => {
          laurel.rotation.z += dt * (i % 2 === 0 ? 1.4 : -1.4);
        },
      });

      this.structuresGroup.add(archGroup);
    }

    // 2. LIVE-MOVING STRUCTURE: 4x Massive Rotating Victory Obelisks with Spiral Gold Bands
    const obeliskGeo = this.registerGeo(new THREE.BoxGeometry(26, 260, 26));
    for (let i = 0; i < 4; i++) {
      const t = (0.12 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const side = (i % 2 === 0 ? 1 : -1) * 90;

      const obeliskGroup = new THREE.Group();
      obeliskGroup.position.copy(pt).add(new THREE.Vector3(side, 90, 0));

      const tower = new THREE.Mesh(obeliskGeo, cobaltMat);
      const crown = new THREE.Mesh(this.registerGeo(new THREE.OctahedronGeometry(12, 0)), goldMat);
      crown.position.y = 140;
      obeliskGroup.add(tower, crown);

      this.animators.push({
        mesh: obeliskGroup,
        update: (dt) => {
          obeliskGroup.rotation.y += dt * 0.6;
        },
      });

      this.structuresGroup.add(obeliskGroup);
    }

    // 3. LIVE-MOVING STRUCTURE: 6x Panning Royal Victory Searchlights
    const searchConeGeo = this.registerGeo(new THREE.ConeGeometry(8, 50, 16));
    const searchLightMat = this.registerMat(new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.4 }));
    for (let i = 0; i < 6; i++) {
      const t = (0.05 + i * 0.16) % 1.0;
      const pt = curve.getPointAt(t);
      const searchGroup = new THREE.Group();
      searchGroup.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 75, 55, 0));

      const cone = new THREE.Mesh(searchConeGeo, searchLightMat);
      cone.position.y = -25;
      searchGroup.add(cone);

      this.animators.push({
        mesh: searchGroup,
        update: (_dt, time) => {
          searchGroup.rotation.y = Math.sin(time * 1.4 + i * 1.1) * 0.9;
          searchGroup.rotation.x = 0.35 + Math.cos(time * 1.2) * 0.25;
        },
      });

      this.structuresGroup.add(searchGroup);
    }

    // 4. LIVE-MOVING STRUCTURE: 4x Deploying Championship Sector Overpass Bridges
    const sectorBridgeGeo = this.registerGeo(new THREE.BoxGeometry(42, 3, 20));
    for (let i = 0; i < 4; i++) {
      const t = (0.2 + i * 0.24) % 1.0;
      const pt = curve.getPointAt(t);
      const bridge = new THREE.Mesh(sectorBridgeGeo, cobaltMat);
      bridge.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 26, 4, 0));

      this.animators.push({
        mesh: bridge,
        update: (_dt, time) => {
          const deploy = 0.5 + 0.5 * Math.sin(time * 1.5 + i);
          bridge.scale.set(0.6 + deploy * 0.6, 1.0, 1.0);
        },
      });

      this.structuresGroup.add(bridge);
    }

    // 5. LIVE-MOVING STRUCTURE: 3x Championship Gates Opening and Closing with Race Progression
    const champGateGeo = this.registerGeo(new THREE.TorusGeometry(26, 2.0, 8, 28));
    for (let i = 0; i < 3; i++) {
      const t = (0.35 + i * 0.28) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gateMesh = new THREE.Mesh(champGateGeo, goldMat);
      gateMesh.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      gateMesh.lookAt(pt.clone().add(tan));

      this.animators.push({
        mesh: gateMesh,
        update: (dt) => {
          gateMesh.rotation.z += dt * 1.8;
        },
      });

      this.structuresGroup.add(gateMesh);
    }
  }
}

