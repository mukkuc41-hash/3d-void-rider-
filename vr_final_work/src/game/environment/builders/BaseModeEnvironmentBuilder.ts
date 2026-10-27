import * as THREE from 'three';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export interface AnimatedElement {
  mesh: THREE.Object3D;
  update: (dt: number, time: number) => void;
}

export interface ModeInteractable {
  id: string;
  type: 'COLLECTIBLE' | 'HAZARD' | 'TRIGGER' | 'DESTRUCTIBLE' | 'GATE';
  position: THREE.Vector3;
  radius: number;
  mesh: THREE.Object3D;
  collected?: boolean;
  active?: boolean;
  health?: number;
  onInteract?: (playerPos: THREE.Vector3, speed: number) => {
    collected?: boolean;
    damage?: number;
    boost?: number;
    soundKey?: string;
    scoreBonus?: number;
    message?: string;
  };
  update?: (dt: number, totalTime: number) => void;
}

export abstract class BaseModeEnvironmentBuilder {
  public structuresGroup: THREE.Group;
  public sceneryGroup: THREE.Group;
  public propsGroup: THREE.Group;
  public hazardsGroup: THREE.Group;
  public backgroundGroup: THREE.Group;
  public skyGroup: THREE.Group;

  public animators: AnimatedElement[] = [];
  public interactables: ModeInteractable[] = [];

  protected managedMaterials: THREE.Material[] = [];
  protected managedGeometries: THREE.BufferGeometry[] = [];
  protected managedTextures: THREE.Texture[] = [];

  constructor(
    structures: THREE.Group,
    scenery: THREE.Group,
    props: THREE.Group,
    hazards: THREE.Group,
    background: THREE.Group,
    sky: THREE.Group,
    animators: AnimatedElement[],
    interactables: ModeInteractable[]
  ) {
    this.structuresGroup = structures;
    this.sceneryGroup = scenery;
    this.propsGroup = props;
    this.hazardsGroup = hazards;
    this.backgroundGroup = background;
    this.skyGroup = sky;
    this.animators = animators;
    this.interactables = interactables;
  }

  public abstract build(
    curve: THREE.Curve<THREE.Vector3>,
    profile: ModeEnvironmentProfile
  ): void;

  public registerGeo<T extends THREE.BufferGeometry>(geo: T): T {
    this.managedGeometries.push(geo);
    return geo;
  }

  public registerMat<T extends THREE.Material>(mat: T): T {
    this.managedMaterials.push(mat);
    return mat;
  }

  public registerTexture<T extends THREE.Texture>(tex: T): T {
    this.managedTextures.push(tex);
    return tex;
  }

  public dispose(): void {
    this.managedMaterials.forEach(m => m.dispose());
    this.managedMaterials = [];
    this.managedGeometries.forEach(g => g.dispose());
    this.managedGeometries = [];
    this.managedTextures.forEach(t => t.dispose());
    this.managedTextures = [];
    this.interactables = [];
  }

  // --- Helper Utilities for Rich 3D Prop Construction ---

  public createHoloTextTexture(
    text: string,
    subtext: string,
    colorHex: string,
    bgHex: string = '#040914'
  ): THREE.Texture {
    if (typeof document === 'undefined') {
      return this.registerTexture(new THREE.DataTexture(new Uint8Array([0, 240, 255, 255]), 1, 1));
    }
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = colorHex;
    ctx.font = 'bold 36px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Rajdhani", monospace';
    ctx.fillText(subtext, 256, 160);

    const texture = new THREE.CanvasTexture(canvas);
    this.registerTexture(texture);
    return texture;
  }

  public createWarningBeacon(colorHex: number, height: number = 24): THREE.Group {
    const group = new THREE.Group();
    const poleGeo = this.registerGeo(new THREE.CylinderGeometry(0.8, 1.2, height, 8));
    const poleMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 }));
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = height / 2;
    group.add(pole);

    const lightGeo = this.registerGeo(new THREE.SphereGeometry(1.8, 12, 12));
    const lightMat = this.registerMat(new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 2.5,
    }));
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = height + 1;
    group.add(light);

    this.animators.push({
      mesh: light,
      update: (_dt, time) => {
        const pulse = Math.sin(time * 6) * 0.5 + 0.5;
        lightMat.emissiveIntensity = 1.0 + pulse * 2.5;
      },
    });

    return group;
  }

  public createLaserGate(width: number, height: number, colorHex: number): THREE.Group {
    const group = new THREE.Group();
    const postGeo = this.registerGeo(new THREE.BoxGeometry(2, height, 2));
    const postMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 }));

    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-width / 2, height / 2, 0);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(width / 2, height / 2, 0);
    group.add(leftPost, rightPost);

    const beamGeo = this.registerGeo(new THREE.CylinderGeometry(0.35, 0.35, width, 8));
    beamGeo.rotateZ(Math.PI / 2);
    const beamMat = this.registerMat(new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
    }));
    const beam1 = new THREE.Mesh(beamGeo, beamMat);
    beam1.position.y = height * 0.4;
    const beam2 = new THREE.Mesh(beamGeo, beamMat);
    beam2.position.y = height * 0.8;
    group.add(beam1, beam2);

    this.animators.push({
      mesh: group,
      update: (_dt, time) => {
        const flash = Math.sin(time * 8) * 0.3 + 0.7;
        beamMat.opacity = flash;
      },
    });

    return group;
  }

  public createFloatingPlatform(width: number, length: number, colorHex: number, glowHex: number): THREE.Group {
    const group = new THREE.Group();
    const slabGeo = this.registerGeo(new THREE.BoxGeometry(width, 4, length));
    const slabMat = this.registerMat(new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.85, roughness: 0.3 }));
    const slab = new THREE.Mesh(slabGeo, slabMat);
    group.add(slab);

    // Glowing edge rails
    const railGeo = this.registerGeo(new THREE.BoxGeometry(1.2, 1.2, length));
    const railMat = this.registerMat(new THREE.MeshBasicMaterial({ color: glowHex }));
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-width / 2, 2.5, 0);
    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(width / 2, 2.5, 0);
    group.add(leftRail, rightRail);

    return group;
  }

  // --- Advanced Architectural Skyscraper Generator ---
  public createSkyscraper(
    width: number,
    height: number,
    depth: number,
    style: 'STEPPED' | 'NEEDLE' | 'SPLIT' | 'CURVED' | 'CORPORATE',
    bodyColor: number,
    glowColor: number
  ): THREE.Group {
    const tower = new THREE.Group();
    const bodyMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.85, roughness: 0.25 })
    );
    const glowMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: glowColor })
    );

    if (style === 'STEPPED') {
      const tiers = 3;
      for (let t = 0; t < tiers; t++) {
        const tierH = height / tiers;
        const scale = 1.0 - t * 0.25;
        const geo = this.registerGeo(new THREE.BoxGeometry(width * scale, tierH, depth * scale));
        const mesh = new THREE.Mesh(geo, bodyMat);
        mesh.position.y = t * tierH + tierH / 2;
        tower.add(mesh);

        // Edge trim
        const trimGeo = this.registerGeo(new THREE.BoxGeometry(width * scale + 1, 2, depth * scale + 1));
        const trimMesh = new THREE.Mesh(trimGeo, glowMat);
        trimMesh.position.y = t * tierH + tierH;
        tower.add(trimMesh);
      }
      // Spire
      const spireGeo = this.registerGeo(new THREE.CylinderGeometry(0.6, 2.5, 45, 8));
      const spire = new THREE.Mesh(spireGeo, glowMat);
      spire.position.y = height + 22.5;
      tower.add(spire);
    } else if (style === 'NEEDLE') {
      const geo = this.registerGeo(new THREE.CylinderGeometry(width * 0.25, width * 0.6, height, 8));
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.y = height / 2;
      tower.add(mesh);

      const needleGeo = this.registerGeo(new THREE.ConeGeometry(width * 0.35, 75, 8));
      const needle = new THREE.Mesh(needleGeo, glowMat);
      needle.position.y = height + 37.5;
      tower.add(needle);
    } else if (style === 'SPLIT') {
      const halfW = width * 0.42;
      const leftGeo = this.registerGeo(new THREE.BoxGeometry(halfW, height, depth));
      const rightGeo = this.registerGeo(new THREE.BoxGeometry(halfW, height, depth));
      const leftMesh = new THREE.Mesh(leftGeo, bodyMat);
      leftMesh.position.set(-width * 0.28, height / 2, 0);
      const rightMesh = new THREE.Mesh(rightGeo, bodyMat);
      rightMesh.position.set(width * 0.28, height / 2, 0);
      tower.add(leftMesh, rightMesh);

      // Connecting skybridges between halves
      const bridgeCount = 4;
      for (let b = 0; b < bridgeCount; b++) {
        const bY = (height / (bridgeCount + 1)) * (b + 1);
        const bGeo = this.registerGeo(new THREE.BoxGeometry(width * 0.6, 6, depth * 0.7));
        const bMesh = new THREE.Mesh(bGeo, glowMat);
        bMesh.position.set(0, bY, 0);
        tower.add(bMesh);
      }
    } else if (style === 'CURVED') {
      const geo = this.registerGeo(new THREE.CylinderGeometry(width * 0.4, width * 0.65, height, 16));
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.y = height / 2;
      tower.add(mesh);

      const crownGeo = this.registerGeo(new THREE.TorusGeometry(width * 0.55, 2.5, 8, 24));
      crownGeo.rotateX(Math.PI / 2);
      const crown = new THREE.Mesh(crownGeo, glowMat);
      crown.position.y = height;
      tower.add(crown);
    } else {
      // CORPORATE block
      const geo = this.registerGeo(new THREE.BoxGeometry(width, height, depth));
      const mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.y = height / 2;
      tower.add(mesh);

      // Helipad on top
      const padGeo = this.registerGeo(new THREE.CylinderGeometry(width * 0.38, width * 0.38, 2, 16));
      const pad = new THREE.Mesh(padGeo, glowMat);
      pad.position.y = height + 1;
      tower.add(pad);
    }

    return tower;
  }

  // --- Track Structural Supports (Pillars & Arches) ---
  public createTrackSupports(
    curve: THREE.Curve<THREE.Vector3>,
    count: number,
    dropDepth: number,
    pillarColor: number,
    accentColor: number = 0x38bdf8
  ): void {
    const pylonMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: pillarColor, metalness: 0.8, roughness: 0.4 })
    );
    const accentMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: accentColor })
    );

    const pillarGeo = this.registerGeo(new THREE.CylinderGeometry(3.5, 6.0, dropDepth, 8));
    const crossGeo = this.registerGeo(new THREE.BoxGeometry(32, 4, 8));

    for (let i = 0; i < count; i++) {
      const t = (i / count) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const support = new THREE.Group();
      support.position.copy(pt);
      support.lookAt(pt.clone().add(tan));

      // Crosshead cradle
      const cross = new THREE.Mesh(crossGeo, pylonMat);
      cross.position.y = -2.5;
      support.add(cross);

      // Dual pillars down
      const leftPillar = new THREE.Mesh(pillarGeo, pylonMat);
      leftPillar.position.set(-10, -dropDepth / 2 - 4, 0);
      const rightPillar = new THREE.Mesh(pillarGeo, pylonMat);
      rightPillar.position.set(10, -dropDepth / 2 - 4, 0);
      support.add(leftPillar, rightPillar);

      // Glowing bracket rings
      const ringGeo = this.registerGeo(new THREE.BoxGeometry(7.5, 1.5, 7.5));
      const leftRing = new THREE.Mesh(ringGeo, accentMat);
      leftRing.position.set(-10, -8, 0);
      const rightRing = new THREE.Mesh(ringGeo, accentMat);
      rightRing.position.set(10, -8, 0);
      support.add(leftRing, rightRing);

      this.structuresGroup.add(support);
    }
  }

  // --- Trackside Light Barrier Strips ---
  public createTracksideBarriers(
    curve: THREE.Curve<THREE.Vector3>,
    count: number,
    trackWidth: number,
    barrierColor: number,
    stripColor: number
  ): void {
    const postGeo = this.registerGeo(new THREE.BoxGeometry(1.2, 3.5, 1.2));
    const railGeo = this.registerGeo(new THREE.BoxGeometry(0.8, 0.8, 14));
    const postMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: barrierColor, metalness: 0.85, roughness: 0.3 })
    );
    const railMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: stripColor })
    );

    const halfW = trackWidth / 2 + 1.2;

    for (let i = 0; i < count; i++) {
      const t = (i / count) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      // Left post and rail
      const lPost = new THREE.Mesh(postGeo, postMat);
      lPost.position.copy(pt).addScaledVector(bin, -halfW).add(new THREE.Vector3(0, 1.7, 0));
      const lRail = new THREE.Mesh(railGeo, railMat);
      lRail.position.copy(lPost.position).add(new THREE.Vector3(0, 0.8, 0));
      lRail.lookAt(lRail.position.clone().add(tan));

      // Right post and rail
      const rPost = new THREE.Mesh(postGeo, postMat);
      rPost.position.copy(pt).addScaledVector(bin, halfW).add(new THREE.Vector3(0, 1.7, 0));
      const rRail = new THREE.Mesh(railGeo, railMat);
      rRail.position.copy(rPost.position).add(new THREE.Vector3(0, 0.8, 0));
      rRail.lookAt(rRail.position.clone().add(tan));

      this.sceneryGroup.add(lPost, lRail, rPost, rRail);
    }
  }

  // --- Distant 360-Degree Skyline Silhouette Layer ---
  public createDistantCitySkyline(
    radius: number,
    towerCount: number,
    heightMin: number,
    heightMax: number,
    color: number,
    glowColor: number
  ): void {
    const towerGeo = this.registerGeo(new THREE.BoxGeometry(40, 1, 40));
    const mat = this.registerMat(
      new THREE.MeshBasicMaterial({ color, wireframe: false, transparent: true, opacity: 0.85 })
    );
    const glowMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: glowColor, wireframe: true, transparent: true, opacity: 0.6 })
    );

    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2;
      const h = heightMin + Math.random() * (heightMax - heightMin);
      const w = 45 + Math.random() * 55;
      const d = 45 + Math.random() * 55;

      const x = Math.cos(angle) * (radius + (Math.random() - 0.5) * 200);
      const z = Math.sin(angle) * (radius + (Math.random() - 0.5) * 200);

      const block = new THREE.Mesh(towerGeo, i % 3 === 0 ? glowMat : mat);
      block.scale.set(w / 40, h, d / 40);
      block.position.set(x, h / 2 - 200, z);

      this.backgroundGroup.add(block);
    }
  }

  // --- Skybridge Connecting Landmarks ---
  public createSkybridge(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    width: number,
    height: number,
    color: number,
    glowColor: number
  ): THREE.Group {
    const group = new THREE.Group();
    const dist = startPos.distanceTo(endPos);
    const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

    const spanGeo = this.registerGeo(new THREE.BoxGeometry(width, height, dist));
    const spanMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.3 })
    );
    const span = new THREE.Mesh(spanGeo, spanMat);
    group.add(span);

    // Glowing under-rails
    const railGeo = this.registerGeo(new THREE.BoxGeometry(0.8, 0.8, dist));
    const railMat = this.registerMat(new THREE.MeshBasicMaterial({ color: glowColor }));
    const lRail = new THREE.Mesh(railGeo, railMat);
    lRail.position.set(-width / 2, -height / 2, 0);
    const rRail = new THREE.Mesh(railGeo, railMat);
    rRail.position.set(width / 2, -height / 2, 0);
    group.add(lRail, rRail);

    group.position.copy(mid);
    group.lookAt(endPos);
    return group;
  }

  // --- Holographic Billboard Mesh ---
  public createHoloBillboardMesh(
    position: THREE.Vector3,
    lookTarget: THREE.Vector3,
    width: number,
    height: number,
    header: string,
    sub: string,
    colorHex: string
  ): THREE.Mesh {
    const tex = this.createHoloTextTexture(header, sub, colorHex);
    const mat = this.registerMat(
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    const geo = this.registerGeo(new THREE.PlaneGeometry(width, height));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.lookAt(lookTarget);
    return mesh;
  }
}
