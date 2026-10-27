/**
 * TITAN BOSS — REBUILT ARENA ENCOUNTER
 * Compatibility export kept as `bossDreadnought` because GameEngine and HUD
 * already depend on that public API. This file owns only the Titan encounter.
 */
import * as THREE from 'three';
import { BossDreadnoughtTelemetry, BossWeakPoint } from '../types';
import { sound } from './audio';

type BossPhase = 1 | 2 | 3;

const MAX_HEALTH = 1600;
const ARENA_RADIUS = 1450;
const ARENA_RIM_RADIUS = 1485;
const ARENA_THICKNESS = 65;

export class BossDreadnoughtDirector {
  private scene: THREE.Scene | null = null;
  public bossGroup: THREE.Group | null = null;
  private arenaGroup: THREE.Group | null = null;
  public isActive = false;
  public phase: BossPhase = 1;
  public totalHealth = MAX_HEALTH;
  public maxTotalHealth = MAX_HEALTH;
  public shieldPercent = 100;
  public isEnraged = false;
  public incomingBarrageWarning = false;

  private elapsed = 0;
  private attackTimer = 5;
  private warningTimer = 0;
  private attackCycle = 0;
  private coreGlowMesh: THREE.Mesh | null = null;
  private weakPointMeshes: Record<string, THREE.Mesh> = {};
  private telegraphs: THREE.Object3D[] = [];
  private arenaRings: THREE.Mesh[] = [];

  public weakPoints: BossWeakPoint[] = [
    { id: 'wp_port', name: 'PORT SHIELD MATRIX', health: 300, maxHealth: 300, destroyed: false, type: 'PORT_SHIELD' },
    { id: 'wp_starboard', name: 'STARBOARD SHIELD MATRIX', health: 300, maxHealth: 300, destroyed: false, type: 'STARBOARD_SHIELD' },
    { id: 'wp_emp', name: 'DORSAL EMP BATTERY', health: 300, maxHealth: 300, destroyed: false, type: 'EMP_TURRET' },
    { id: 'wp_core', name: 'EXPOSED TITAN CORE', health: 700, maxHealth: 700, destroyed: false, type: 'CORE_REACTOR' },
  ];

  public init(scene: THREE.Scene) {
    this.scene = scene;
    this.disposeGroups();
    this.arenaGroup = new THREE.Group();
    this.arenaGroup.name = 'titan-boss-circular-arena';
    this.buildArena();
    scene.add(this.arenaGroup);
    this.arenaGroup.visible = false;

    this.bossGroup = new THREE.Group();
    this.bossGroup.name = 'titan-boss-colossus-prime';
    this.buildTitan();
    scene.add(this.bossGroup);
    this.bossGroup.visible = false;
  }

  private buildArena() {
    if (!this.arenaGroup) return;
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RIM_RADIUS, ARENA_THICKNESS, 128, 4, false),
      new THREE.MeshStandardMaterial({ color: 0x182536, metalness: 0.82, roughness: 0.48, emissive: 0x07111f, emissiveIntensity: 0.5 })
    );
    floor.name = 'solid-circular-arena-floor';
    floor.position.y = -ARENA_THICKNESS / 2;
    floor.receiveShadow = true;
    this.arenaGroup.add(floor);

    // Broad armored deck panels and radial seams make the arena read as a solid
    // Juggernaut-style combat platform rather than a thin ring or floating track.
    const deckPanels = [
      { radius: 320, color: 0x243449, opacity: 0.82 },
      { radius: 620, color: 0x1d2b3d, opacity: 0.72 },
      { radius: 930, color: 0x26364a, opacity: 0.72 },
      { radius: 1210, color: 0x182638, opacity: 0.78 },
    ];
    for (const panel of deckPanels) {
      const plate = new THREE.Mesh(
        new THREE.RingGeometry(panel.radius - 95, panel.radius, 128),
        new THREE.MeshStandardMaterial({ color: panel.color, metalness: 0.86, roughness: 0.42, side: THREE.DoubleSide })
      );
      plate.name = `titan-deck-armor-band-${panel.radius}`;
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = 0.65;
      this.arenaGroup.add(plate);
    }
    const radialMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, ARENA_RADIUS * 1.82), radialMat);
      seam.name = `titan-deck-radial-seam-${i}`;
      seam.position.y = 0.45;
      seam.rotation.y = angle;
      this.arenaGroup.add(seam);
    }
    const innerCore = new THREE.Mesh(
      new THREE.CircleGeometry(180, 64),
      new THREE.MeshBasicMaterial({ color: 0x082f49, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    innerCore.name = 'titan-platform-reactor-inlay';
    innerCore.rotation.x = -Math.PI / 2;
    innerCore.position.y = 0.8;
    this.arenaGroup.add(innerCore);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(ARENA_RIM_RADIUS - 2, 18, 12, 160),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, metalness: 0.7, roughness: 0.3, emissive: 0xea580c, emissiveIntensity: 0.65 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -ARENA_THICKNESS + 8;
    this.arenaGroup.add(rim);

    [52, 96, 142, 176].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 3 ? 1.4 : 0.65, 6, 96),
        new THREE.MeshBasicMaterial({ color: index % 2 ? 0x06b6d4 : 0xf97316, transparent: true, opacity: index === 3 ? 0.8 : 0.45 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.1 + index * 0.12;
      this.arenaGroup.add(ring);
      this.arenaRings.push(ring);
    });

    // Eight visible player/spawn stations around the circular deck.
    const stationGeo = new THREE.CylinderGeometry(5, 7, 2.5, 8);
    const stationMat = new THREE.MeshStandardMaterial({ color: 0x24364b, metalness: 0.7, roughness: 0.35, emissive: 0x0369a1, emissiveIntensity: 0.5 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const station = new THREE.Group();
      station.position.set(Math.cos(angle) * 1180, 1.5, Math.sin(angle) * 1180);
      const pad = new THREE.Mesh(stationGeo, stationMat);
      pad.position.y = 0;
      station.add(pad);
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.4, 10, 8), beaconMat);
      beacon.position.y = 6;
      station.add(beacon);
      station.rotation.y = -angle;
      this.arenaGroup.add(station);
    }

    // Chunky perimeter pylons make the rim readable without cluttering the deck.
    const pylonGeo = new THREE.BoxGeometry(7, 24, 7);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35, emissive: 0x7f1d1d, emissiveIntensity: 0.45 });
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(Math.cos(a) * (ARENA_RIM_RADIUS - 16), 10, Math.sin(a) * (ARENA_RIM_RADIUS - 16));
      pylon.lookAt(0, -2, 0);
      this.arenaGroup.add(pylon);
    }
  }

  private buildTitan() {
    if (!this.bossGroup) return;
    const hull = new THREE.MeshStandardMaterial({ color: 0x303846, metalness: 0.88, roughness: 0.28 });
    const armor = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.78, roughness: 0.36 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.72, roughness: 0.25, emissive: 0x991b1b, emissiveIntensity: 0.6 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.25, roughness: 0.2, emissive: 0x0891b2, emissiveIntensity: 1.5 });

    const addBox = (name: string, size: [number, number, number], pos: [number, number, number], mat: THREE.Material, rot?: [number, number, number]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      mesh.name = name;
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.bossGroup!.add(mesh);
      return mesh;
    };

    // Main silhouette: armored torso, shoulder blocks, twin arms and broad legs.
    addBox('titan-central-torso', [48, 56, 30], [0, 38, -35], hull);
    addBox('titan-chest-armor', [38, 22, 8], [0, 47, -18], armor);
    addBox('titan-head', [20, 18, 18], [0, 76, -31], armor);
    addBox('titan-crest', [8, 14, 7], [0, 91, -33], trim);
    addBox('titan-left-shoulder', [30, 20, 28], [-39, 56, -35], hull, [0, 0, -0.12]);
    addBox('titan-right-shoulder', [30, 20, 28], [39, 56, -35], hull, [0, 0, 0.12]);
    addBox('titan-left-arm', [14, 38, 15], [-43, 29, -27], armor);
    addBox('titan-right-arm', [14, 38, 15], [43, 29, -27], armor);
    addBox('titan-left-leg', [18, 32, 22], [-17, 4, -31], hull);
    addBox('titan-right-leg', [18, 32, 22], [17, 4, -31], hull);
    addBox('titan-back-reactor', [28, 34, 18], [0, 43, -54], armor);
    addBox('titan-left-blade', [5, 40, 8], [-57, 34, -30], trim, [0, 0, 0.22]);
    addBox('titan-right-blade', [5, 40, 8], [57, 34, -30], trim, [0, 0, -0.22]);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(11, 2), new THREE.MeshBasicMaterial({ color: 0xff3b30, wireframe: true, transparent: true, opacity: 0.95 }));
    core.name = 'titan-exposed-core';
    core.position.set(0, 42, -13);
    this.bossGroup.add(core);
    this.coreGlowMesh = core;
    this.weakPointMeshes.wp_core = core;

    const makeWeakPoint = (id: string, name: string, geo: THREE.BufferGeometry, pos: [number, number, number], color: number) => {
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.25, metalness: 0.3, roughness: 0.2, wireframe: true }));
      mesh.name = name;
      mesh.position.set(...pos);
      this.bossGroup!.add(mesh);
      this.weakPointMeshes[id] = mesh;
    };
    makeWeakPoint('wp_port', 'left-shoulder-shield-weakpoint', new THREE.OctahedronGeometry(8, 1), [-39, 58, -17], 0x22d3ee);
    makeWeakPoint('wp_starboard', 'right-shoulder-shield-weakpoint', new THREE.OctahedronGeometry(8, 1), [39, 58, -17], 0x22d3ee);
    makeWeakPoint('wp_emp', 'dorsal-emp-weakpoint', new THREE.DodecahedronGeometry(9, 1), [0, 65, -54], 0xfbbf24);

    // Shoulder-mounted cannon barrels and visible vent lights.
    for (const side of [-1, 1]) {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 28, 12), armor);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(side * 39, 61, -2);
      this.bossGroup.add(cannon);
      for (let j = 0; j < 4; j++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1.5), cyan);
        vent.position.set(side * (14 + j * 7), 20, -18);
        this.bossGroup.add(vent);
      }
    }
  }

  public activateBossEncounter(centerPosition: THREE.Vector3) {
    this.isActive = true;
    this.phase = 1;
    this.totalHealth = MAX_HEALTH;
    this.maxTotalHealth = MAX_HEALTH;
    this.shieldPercent = 100;
    this.isEnraged = false;
    this.incomingBarrageWarning = false;
    this.elapsed = 0;
    this.attackTimer = 5;
    this.warningTimer = 0;
    this.attackCycle = 0;
    this.weakPoints.forEach(wp => { wp.health = wp.maxHealth; wp.destroyed = false; });
    Object.values(this.weakPointMeshes).forEach(mesh => { mesh.visible = true; });
    this.clearTelegraphs();
    if (this.arenaGroup) {
      this.arenaGroup.visible = true;
      this.arenaGroup.position.set(centerPosition.x, centerPosition.y, centerPosition.z);
    }
    if (this.bossGroup) {
      this.bossGroup.visible = true;
      this.bossGroup.position.set(centerPosition.x, centerPosition.y + 8, centerPosition.z - 82);
      this.bossGroup.rotation.set(0, 0, 0);
    }
    sound.playAlarmAlert();
  }

  public deactivateBossEncounter() {
    this.isActive = false;
    this.incomingBarrageWarning = false;
    this.clearTelegraphs();
    if (this.arenaGroup) this.arenaGroup.visible = false;
    if (this.bossGroup) this.bossGroup.visible = false;
  }

  public update(delta: number, playerPos: THREE.Vector3): BossDreadnoughtTelemetry {
    if (!this.isActive || !this.bossGroup) return this.getTelemetry();
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.elapsed += dt;
    this.bossGroup.rotation.y = Math.sin(this.elapsed * 0.45) * 0.12;
    this.bossGroup.position.y += Math.sin(this.elapsed * 1.8) * dt * 1.8;
    if (this.coreGlowMesh) {
      const pulse = 1 + Math.sin(this.elapsed * 7) * 0.18;
      this.coreGlowMesh.scale.setScalar(pulse);
      const material = this.coreGlowMesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(this.phase === 3 ? 0xffa31a : 0xff3b30);
    }
    for (const id of ['wp_port', 'wp_starboard', 'wp_emp']) {
      const mesh = this.weakPointMeshes[id];
      if (mesh?.visible) { mesh.rotation.x += dt * 1.1; mesh.rotation.y += dt * 1.8; }
    }
    this.arenaRings.forEach((ring, i) => { ring.rotation.z += dt * (i % 2 ? -0.12 : 0.12); });
    this.updateTelegraphs(dt);

    this.attackTimer -= dt;
    if (this.attackTimer <= 2.1 && this.attackTimer > 0) {
      this.incomingBarrageWarning = true;
      this.warningTimer = Math.max(0, this.attackTimer);
      this.ensureAttackWarning(playerPos);
    } else if (this.attackTimer <= 0) {
      this.incomingBarrageWarning = false;
      this.fireAttack(playerPos);
      this.attackTimer = this.phase === 3 ? 4.2 : this.phase === 2 ? 6 : 8;
    }
    return this.getTelemetry();
  }

  private ensureAttackWarning(playerPos: THREE.Vector3) {
    if (this.telegraphs.length) return;
    if (!this.arenaGroup) return;
    const local = playerPos.clone().sub(this.arenaGroup.position);
    local.y = 1.8;
    const warning = new THREE.Mesh(
      new THREE.RingGeometry(9, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    warning.name = 'titan-attack-warning-ring';
    warning.rotation.x = -Math.PI / 2;
    warning.position.copy(local);
    this.arenaGroup.add(warning);
    this.telegraphs.push(warning);
  }

  private fireAttack(playerPos: THREE.Vector3) {
    sound.playMissileLaunch();
    this.attackCycle++;
    this.clearTelegraphs();
    if (this.coreGlowMesh) this.coreGlowMesh.scale.setScalar(1.55);
    // Attack types alternate: ring shockwave, targeted strike marker, then a multi-lane volley.
    if (!this.arenaGroup) return;
    const local = playerPos.clone().sub(this.arenaGroup.position);
    local.y = 1.8;
    if (this.attackCycle % 3 === 1) {
      const shock = new THREE.Mesh(new THREE.TorusGeometry(3, 2.2, 8, 72), new THREE.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.9 }));
      shock.rotation.x = Math.PI / 2;
      shock.position.set(0, 1.8, 0);
      shock.userData = { kind: 'shockwave', age: 0, maxRadius: ARENA_RADIUS - 20 };
      this.arenaGroup.add(shock);
      this.telegraphs.push(shock);
    } else if (this.attackCycle % 3 === 2) {
      const strike = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 100, 12), new THREE.MeshBasicMaterial({ color: 0xff7b00, transparent: true, opacity: 0.8 }));
      strike.position.set(local.x, 35, local.z);
      strike.userData = { kind: 'strike', age: 0, maxAge: 1.4 };
      this.arenaGroup.add(strike);
      this.telegraphs.push(strike);
    } else {
      for (let i = -2; i <= 2; i++) {
        const lane = new THREE.Mesh(new THREE.BoxGeometry(28, 1.2, ARENA_RADIUS * 1.9), new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.55 }));
        lane.position.set(i * 210, 1.6, 0);
        lane.userData = { kind: 'lane', age: 0, maxAge: 1.1 };
        this.arenaGroup.add(lane);
        this.telegraphs.push(lane);
      }
    }
  }

  private updateTelegraphs(dt: number) {
    for (const item of [...this.telegraphs]) {
      const data = item.userData as { kind?: string; age?: number; maxAge?: number; maxRadius?: number };
      data.age = (data.age ?? 0) + dt;
      if (data.kind === 'shockwave') {
        const radius = Math.min(data.maxRadius ?? ARENA_RADIUS - 20, 3 + data.age! * 300);
        item.scale.setScalar(radius / 3);
        (item as THREE.Mesh).material && (((item as THREE.Mesh).material as THREE.Material & { opacity?: number }).opacity = Math.max(0.08, 0.9 - data.age! * 0.12));
        if (radius >= (data.maxRadius ?? 150)) { item.parent?.remove(item); this.telegraphs = this.telegraphs.filter(t => t !== item); }
      } else if ((data.maxAge ?? Infinity) <= data.age!) {
        this.arenaGroup?.remove(item);
        this.telegraphs = this.telegraphs.filter(t => t !== item);
      } else if (data.kind === 'strike') {
        item.scale.y = Math.max(0.2, 1 - data.age! * 0.5);
      }
    }
  }

  private clearTelegraphs() {
    this.telegraphs.forEach(item => item.parent?.remove(item));
    this.telegraphs = [];
  }

  public damageWeakPoint(pointId: string, damage: number): { destroyed: boolean; bossDefeated: boolean } {
    const wp = this.weakPoints.find(p => p.id === pointId);
    if (!this.isActive || !wp || wp.destroyed || !Number.isFinite(damage) || damage <= 0) return { destroyed: false, bossDefeated: false };
    const shieldNodesActive = this.weakPoints.some(p => (p.type === 'PORT_SHIELD' || p.type === 'STARBOARD_SHIELD') && !p.destroyed);
    const actualDamage = wp.type === 'CORE_REACTOR' && shieldNodesActive ? damage * 0.2 : damage;
    wp.health = Math.max(0, wp.health - actualDamage);
    this.totalHealth = this.weakPoints.reduce((sum, p) => sum + p.health, 0);
    const shields = this.weakPoints.filter(p => p.type === 'PORT_SHIELD' || p.type === 'STARBOARD_SHIELD');
    this.shieldPercent = Math.round(shields.reduce((sum, p) => sum + p.health, 0) / shields.reduce((sum, p) => sum + p.maxHealth, 0) * 100);
    if (wp.health <= 0 && !wp.destroyed) {
      wp.destroyed = true;
      sound.playExplosion();
      const mesh = this.weakPointMeshes[pointId];
      if (mesh) mesh.visible = false;
    }
    if (this.shieldPercent === 0 && this.phase === 1) { this.phase = 2; sound.playAlarmAlert(); }
    if (this.totalHealth <= 500 && this.phase !== 3) { this.phase = 3; this.isEnraged = true; sound.playAlarmAlert(); }
    const bossDefeated = this.totalHealth <= 0;
    if (bossDefeated) this.defeatBoss();
    return { destroyed: wp.destroyed, bossDefeated };
  }

  public defeatBoss() {
    this.isActive = false;
    this.incomingBarrageWarning = false;
    this.clearTelegraphs();
    sound.playExplosion();
    if (this.bossGroup) this.bossGroup.visible = false;
    if (this.arenaGroup) this.arenaGroup.visible = false;
  }

  public getTelemetry(): BossDreadnoughtTelemetry {
    return {
      bossName: 'GOLIATH-IX ORBITAL DREADNOUGHT',
      totalHealth: Math.round(this.totalHealth),
      maxTotalHealth: this.maxTotalHealth,
      shieldPercent: this.shieldPercent,
      phase: this.phase,
      isEnraged: this.isEnraged,
      isActive: this.isActive,
      weakPoints: this.weakPoints,
      incomingBarrageWarning: this.incomingBarrageWarning,
    };
  }

  private disposeGroups() {
    if (this.scene && this.arenaGroup) this.scene.remove(this.arenaGroup);
    if (this.scene && this.bossGroup) this.scene.remove(this.bossGroup);
    this.arenaGroup = null;
    this.bossGroup = null;
    this.weakPointMeshes = {};
    this.coreGlowMesh = null;
    this.arenaRings = [];
    this.telegraphs = [];
  }

  public dispose() {
    this.isActive = false;
    this.disposeGroups();
  }
}

export const bossDreadnought = new BossDreadnoughtDirector();
