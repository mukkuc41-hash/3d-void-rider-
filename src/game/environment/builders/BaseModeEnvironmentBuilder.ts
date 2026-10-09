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
  }

  // --- Helper Utilities for Rich 3D Prop Construction ---

  public createHoloTextTexture(
    text: string,
    subtext: string,
    colorHex: string,
    bgHex: string = '#040914'
  ): THREE.Texture {
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
}
