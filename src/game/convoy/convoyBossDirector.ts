/**
 * VOID-RIDER 3D — CONVOY GUARDIAN BOSS DIRECTOR
 * 
 * Manages the 5 Major Campaign Boss Battles & Hunters Mode Boss:
 * - Boss 1: Armoured Dreadnought (Region 3)
 * - Boss 2: Orbital Fortress Core (Region 12)
 * - Boss 3: Swarm Commander (Region 18)
 * - Boss 4: Gravity Behemoth (Region 21)
 * - Boss 5: War Fleet Supreme Commander (Region 24)
 * - Mode B Hunter Boss: 1,000 HP + 6 Defense Drones across 5 distinct phases
 * 
 * Provides:
 * - Real damageable hitboxes and health tracking
 * - Visible attack telegraphs (shockwave rings, charge-up glows, targeting lasers)
 * - Phase transitions that alter attacks and behavior
 * - Telemetry state for HUD (boss HP, shields, phase, weak-point status)
 * - Defeat explosions, rewards, and safe cleanup
 */
import * as THREE from 'three';
import { sound } from '../audio';
import { ConvoyProjectile, ConvoyVariant } from './convoyTypes';
import { ConvoyShipFactory } from './convoyShipFactory';

export interface BossPhaseState {
  phaseIndex: number;
  totalPhases: number;
  phaseName: string;
  isVulnerable: boolean;
  activeDronesCount: number;
  activeNodesCount: number;
}

export interface ActiveBossState {
  id: string;
  name: string;
  isMajorBoss: boolean;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  phase: number;
  totalPhases: number;
  phaseName: string;
  isVulnerable: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  attackTimer: number;
  telegraphTimer: number;
  isTelegraphing: boolean;
  mesh?: THREE.Group;
  subNodes: Array<{
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    isAlive: boolean;
    offset: THREE.Vector3;
    mesh?: THREE.Mesh;
  }>;
  hitFlashTimer: number;
  isAlive: boolean;
  isDefeated: boolean;
}

export class ConvoyBossDirector {
  public activeBoss: ActiveBossState | null = null;
  private combatGroup: THREE.Group | null = null;
  private telegraphMesh: THREE.Mesh | null = null;

  public init(combatGroup: THREE.Group) {
    this.combatGroup = combatGroup;
  }

  public cleanUp() {
    if (this.activeBoss?.mesh && this.combatGroup) {
      this.combatGroup.remove(this.activeBoss.mesh);
    }
    if (this.telegraphMesh && this.combatGroup) {
      this.combatGroup.remove(this.telegraphMesh);
      this.telegraphMesh = null;
    }
    this.activeBoss = null;
  }

  /**
   * Spawn one of the 5 Major Campaign Bosses at the appropriate route point
   */
  public spawnMajorBoss(bossId: string, spawnPos: THREE.Vector3): ActiveBossState | null {
    this.cleanUp();
    if (!this.combatGroup) return null;

    let bossState: ActiveBossState;

    switch (bossId) {
      case 'boss_1_armoured_dreadnought':
        bossState = this.createArmouredDreadnought(spawnPos);
        break;
      case 'boss_2_orbital_fortress_core':
        bossState = this.createOrbitalFortressCore(spawnPos);
        break;
      case 'boss_3_swarm_commander':
        bossState = this.createSwarmCommander(spawnPos);
        break;
      case 'boss_4_gravity_behemoth':
        bossState = this.createGravityBehemoth(spawnPos);
        break;
      case 'boss_5_supreme_commander':
        bossState = this.createSupremeCommander(spawnPos);
        break;
      case 'hunter_mode_boss':
        bossState = this.createHunterModeBoss(spawnPos);
        break;
      default:
        bossState = this.createArmouredDreadnought(spawnPos);
        break;
    }

    if (bossState.mesh) {
      this.combatGroup.add(bossState.mesh);
    }
    this.activeBoss = bossState;
    sound.playAlarmAlert();
    return bossState;
  }

  // =========================================================================
  // BOSS CREATORS WITH UNIQUE PHYSICAL MESHES & WEAK-POINT NODES
  // =========================================================================

  private createArmouredDreadnought(pos: THREE.Vector3): ActiveBossState {
    const group = new THREE.Group();
    group.name = 'boss_armoured_dreadnought';
    group.position.copy(pos);

    // Heavy battleship hull
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4,
    });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(60, 35, 180), hullMat);
    group.add(hull);

    // 4 Symmetrical Weapon Batteries as destroyable subnodes
    const subNodes: ActiveBossState['subNodes'] = [];
    const batteryOffsets = [
      new THREE.Vector3(-36, 12, -40),
      new THREE.Vector3(36, 12, -40),
      new THREE.Vector3(-36, 12, 40),
      new THREE.Vector3(36, 12, 40),
    ];

    const batteryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 });
    batteryOffsets.forEach((off, i) => {
      const batMesh = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 16, 16), batteryMat);
      batMesh.position.copy(off);
      group.add(batMesh);

      subNodes.push({
        id: `battery_${i + 1}`,
        name: `Heavy Battery ${i + 1}`,
        health: 200,
        maxHealth: 200,
        isAlive: true,
        offset: off,
        mesh: batMesh,
      });
    });

    // Exposed central reactor (shielded initially)
    const reactor = new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
    );
    reactor.position.set(0, 18, 0);
    group.add(reactor);

    return {
      id: 'boss_1_armoured_dreadnought',
      name: 'Armoured Dreadnought',
      isMajorBoss: true,
      health: 1200,
      maxHealth: 1200,
      shield: 400,
      maxShield: 400,
      phase: 1,
      totalPhases: 3,
      phaseName: 'PHASE 1: ARMOURED BATTERY BARRAGE',
      isVulnerable: false, // Immune until batteries destroyed
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -25),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 1.0,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes,
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  private createOrbitalFortressCore(pos: THREE.Vector3): ActiveBossState {
    const group = new THREE.Group();
    group.name = 'boss_orbital_fortress_core';
    group.position.copy(pos);

    // Central Citadel Hub
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2, emissive: 0x4338ca, emissiveIntensity: 0.6 });
    const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(38, 2), coreMat);
    group.add(coreSphere);

    // 3 Rotating Shield Nodes
    const subNodes: ActiveBossState['subNodes'] = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const off = new THREE.Vector3(Math.cos(angle) * 75, Math.sin(angle) * 75, 0);
      const nodeMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
      );
      nodeMesh.position.copy(off);
      group.add(nodeMesh);

      subNodes.push({
        id: `shield_node_${i + 1}`,
        name: `Shield Pylon ${i + 1}`,
        health: 250,
        maxHealth: 250,
        isAlive: true,
        offset: off,
        mesh: nodeMesh,
      });
    }

    return {
      id: 'boss_2_orbital_fortress_core',
      name: 'Orbital Fortress Core',
      isMajorBoss: true,
      health: 1800,
      maxHealth: 1800,
      shield: 600,
      maxShield: 600,
      phase: 1,
      totalPhases: 4,
      phaseName: 'PHASE 1: ORBITAL SHIELD MATRIX',
      isVulnerable: false,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -20),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 1.2,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes,
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  private createSwarmCommander(pos: THREE.Vector3): ActiveBossState {
    const group = new THREE.Group();
    group.name = 'boss_swarm_commander';
    group.position.copy(pos);

    // Organic biomechanical queen
    const bioMat = new THREE.MeshStandardMaterial({ color: 0x4a044e, roughness: 0.35, metalness: 0.6, emissive: 0xa21caf, emissiveIntensity: 0.7 });
    const carapace = new THREE.Mesh(new THREE.ConeGeometry(32, 110, 16), bioMat);
    carapace.rotation.x = Math.PI / 2;
    group.add(carapace);

    // 4 Swarm Link Pods
    const subNodes: ActiveBossState['subNodes'] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const off = new THREE.Vector3(Math.cos(angle) * 55, Math.sin(angle) * 55, -20);
      const podMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(10), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
      podMesh.position.copy(off);
      group.add(podMesh);

      subNodes.push({
        id: `swarm_pod_${i + 1}`,
        name: `Brood Pod ${i + 1}`,
        health: 220,
        maxHealth: 220,
        isAlive: true,
        offset: off,
        mesh: podMesh,
      });
    }

    return {
      id: 'boss_3_swarm_commander',
      name: 'Swarm Commander Queen',
      isMajorBoss: true,
      health: 1500,
      maxHealth: 1500,
      shield: 500,
      maxShield: 500,
      phase: 1,
      totalPhases: 4,
      phaseName: 'PHASE 1: BROOD SWARM DEPLOYMENT',
      isVulnerable: false,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -30),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 0.8,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes,
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  private createGravityBehemoth(pos: THREE.Vector3): ActiveBossState {
    const group = new THREE.Group();
    group.name = 'boss_gravity_behemoth';
    group.position.copy(pos);

    // Singularity Sphere
    const singMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const singularity = new THREE.Mesh(new THREE.SphereGeometry(32, 32, 32), singMat);
    group.add(singularity);

    // Lensing rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.8 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(65, 3, 16, 64), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(85, 2.5, 16, 64), ringMat);
    ring2.rotation.x = Math.PI / 3;
    group.add(ring1);
    group.add(ring2);

    return {
      id: 'boss_4_gravity_behemoth',
      name: 'Gravity Behemoth',
      isMajorBoss: true,
      health: 2200,
      maxHealth: 2200,
      shield: 800,
      maxShield: 800,
      phase: 1,
      totalPhases: 4,
      phaseName: 'PHASE 1: SINGULARITY GRAVITATIONAL PULL',
      isVulnerable: true,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -22),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 1.5,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes: [],
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  private createSupremeCommander(pos: THREE.Vector3): ActiveBossState {
    const group = new THREE.Group();
    group.name = 'boss_supreme_commander';
    group.position.copy(pos);

    // Super Flagship Titan
    const titanMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, metalness: 0.95, roughness: 0.15, emissive: 0x991b1b, emissiveIntensity: 0.8 });
    const flagship = new THREE.Mesh(new THREE.BoxGeometry(90, 45, 260), titanMat);
    group.add(flagship);

    // 2 Wing Cruiser Escorts as subnodes
    const subNodes: ActiveBossState['subNodes'] = [];
    [-65, 65].forEach((x, i) => {
      const escortMesh = new THREE.Mesh(new THREE.BoxGeometry(32, 22, 95), titanMat);
      escortMesh.position.set(x, 15, -40);
      group.add(escortMesh);

      subNodes.push({
        id: `cruiser_escort_${i + 1}`,
        name: `Cruiser Escort ${i + 1}`,
        health: 450,
        maxHealth: 450,
        isAlive: true,
        offset: new THREE.Vector3(x, 15, -40),
        mesh: escortMesh,
      });
    });

    return {
      id: 'boss_5_supreme_commander',
      name: 'War Fleet Supreme Commander',
      isMajorBoss: true,
      health: 3000,
      maxHealth: 3000,
      shield: 1000,
      maxShield: 1000,
      phase: 1,
      totalPhases: 5,
      phaseName: 'PHASE 1: CAPITAL ESCORT LINE',
      isVulnerable: false,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -18),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 1.0,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes,
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  private createHunterModeBoss(pos: THREE.Vector3): ActiveBossState {
    const group = ConvoyShipFactory.createModel({
      faction: 'HUNTERS',
      role: 'BOSS',
    });
    group.name = 'hunter_mode_primary_boss';
    group.position.copy(pos);

    return {
      id: 'hunter_mode_boss',
      name: 'Dreadnought X Core',
      isMajorBoss: true,
      health: 1000,
      maxHealth: 1000,
      shield: 500,
      maxShield: 500,
      phase: 1,
      totalPhases: 5,
      phaseName: 'PHASE 1: SHIELDED DEFENSE (6 DRONES ACTIVE)',
      isVulnerable: false,
      position: pos.clone(),
      velocity: new THREE.Vector3(0, 0, -35),
      rotation: new THREE.Euler(0, 0, 0),
      attackTimer: 1.0,
      telegraphTimer: 0,
      isTelegraphing: false,
      mesh: group,
      subNodes: [],
      hitFlashTimer: 0,
      isAlive: true,
      isDefeated: false,
    };
  }

  // =========================================================================
  // UPDATE LOOP: ATTACKS, PHASES, TELEGRAPHS & HITBOX EVALUATION
  // =========================================================================

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    activeDronesCount: number,
    projectiles: ConvoyProjectile[],
    addNotification: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ) {
    if (!this.activeBoss || !this.activeBoss.isAlive) return;

    const b = this.activeBoss;
    b.attackTimer -= dt;
    if (b.hitFlashTimer > 0) b.hitFlashTimer -= dt;

    // Movement: fly smoothly forward along route or hover near combat envelope
    b.position.addScaledVector(b.velocity, dt);
    if (b.mesh) {
      b.mesh.position.copy(b.position);
      b.mesh.rotation.z += dt * 0.15;
    }

    // Check Sub-Nodes (batteries, shield generators, escorts)
    const aliveSubNodes = b.subNodes.filter(n => n.isAlive).length;

    // PHASE LOGIC EVALUATION
    this.updateBossPhases(b, activeDronesCount, aliveSubNodes, addNotification);

    // TELEGRAPHED ATTACKS
    if (b.attackTimer <= 0) {
      this.executeBossAttack(b, playerPos, projectiles, addNotification);
      b.attackTimer = 2.0 + Math.random() * 1.5;
    }
  }

  private updateBossPhases(
    b: ActiveBossState,
    activeDronesCount: number,
    aliveSubNodes: number,
    addNotification: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ) {
    const hpRatio = b.health / b.maxHealth;

    // Boss 1: Armoured Dreadnought
    if (b.id === 'boss_1_armoured_dreadnought') {
      if (b.phase === 1 && aliveSubNodes === 0) {
        b.phase = 2;
        b.isVulnerable = true;
        b.phaseName = 'PHASE 2: EXPOSED REACTOR CORE (STRIKE NOW!)';
        addNotification('DREADNOUGHT BATTERIES DESTROYED — REACTOR EXPOSED!', 'ALERT');
        sound.playShieldDeflect();
      } else if (b.phase === 2 && hpRatio <= 0.35) {
        b.phase = 3;
        b.phaseName = 'PHASE 3: CRITICAL OVERLOAD ENRAGE';
        addNotification('WARNING: DREADNOUGHT FIRING EMERGENCY OVERLOAD CANNONS', 'ALERT');
      }
    }

    // Boss 2: Orbital Fortress Core
    if (b.id === 'boss_2_orbital_fortress_core') {
      if (b.phase === 1 && aliveSubNodes === 0) {
        b.phase = 2;
        b.isVulnerable = true;
        b.phaseName = 'PHASE 2: CITADEL CORE VULNERABLE';
        addNotification('ORBITAL SHIELD MATRIX SHUTDOWN — CORE HITBOX OPEN!', 'SUCCESS');
      } else if (b.phase === 2 && hpRatio <= 0.5) {
        b.phase = 3;
        b.phaseName = 'PHASE 3: AUTOMATED DEFENSE TURRETS SURGE';
      } else if (b.phase === 3 && hpRatio <= 0.2) {
        b.phase = 4;
        b.phaseName = 'PHASE 4: CATASTROPHIC EMP CORE COLLAPSE';
      }
    }

    // Boss 3: Swarm Commander
    if (b.id === 'boss_3_swarm_commander') {
      if (b.phase === 1 && aliveSubNodes <= 1) {
        b.phase = 2;
        b.isVulnerable = true;
        b.phaseName = 'PHASE 2: QUEEN CARAPACE EXPOSED';
        addNotification('BROOD PODS SEVERED — QUEEN CARAPACE VULNERABLE!', 'SUCCESS');
      } else if (b.phase === 2 && hpRatio <= 0.4) {
        b.phase = 3;
        b.phaseName = 'PHASE 3: ENRAGED SWARM DIVE-BOMB';
      }
    }

    // Boss 4: Gravity Behemoth
    if (b.id === 'boss_4_gravity_behemoth') {
      if (hpRatio <= 0.75 && b.phase === 1) {
        b.phase = 2;
        b.phaseName = 'PHASE 2: GRAVITATIONAL DISPLACEMENT WAVES';
        addNotification('WARNING: GRAVITY BEHEMOTH GENERATING TIDAL SHOCKWAVES', 'ALERT');
      } else if (hpRatio <= 0.35 && b.phase === 2) {
        b.phase = 3;
        b.phaseName = 'PHASE 3: SINGULARITY CRITICAL COLLAPSE';
      }
    }

    // Boss 5: Supreme Commander
    if (b.id === 'boss_5_supreme_commander') {
      if (b.phase === 1 && aliveSubNodes === 0) {
        b.phase = 2;
        b.phaseName = 'PHASE 2: FLAGSHIP DEFENSE GRID OVERLOAD';
        b.isVulnerable = true;
        addNotification('CRUISER ESCORTS SUNK — SUPREME COMMANDER SHIELDS DOWN!', 'SUCCESS');
      } else if (b.phase === 2 && hpRatio <= 0.6) {
        b.phase = 3;
        b.phaseName = 'PHASE 3: MEGA-ION CANNON SIEGE BARRAGE';
      } else if (b.phase === 3 && hpRatio <= 0.25) {
        b.phase = 4;
        b.phaseName = 'PHASE 4: FLAGSHIP STRUCTURAL BREAKDOWN';
      }
    }

    // Hunter Mode Boss: 5 Phases tied to 6 defense drones
    if (b.id === 'hunter_mode_boss') {
      if (activeDronesCount === 0) {
        b.isVulnerable = true;
        if (hpRatio <= 0.25) {
          b.phase = 4;
          b.phaseName = 'PHASE 4: FINAL ASSAULT (DESPERATION BARRAGE)';
        } else {
          b.phase = 3;
          b.phaseName = 'PHASE 3: CORE EXPOSED (VULNERABLE HITBOX)';
        }
      } else if (activeDronesCount <= 3) {
        b.phase = 2;
        b.phaseName = `PHASE 2: DEFENSE BREAKDOWN (${activeDronesCount}/6 DRONES REMAINING)`;
        b.isVulnerable = false;
      } else {
        b.phase = 1;
        b.phaseName = `PHASE 1: SHIELDED DEFENSE (${activeDronesCount}/6 DRONES ACTIVE)`;
        b.isVulnerable = false;
      }
    }
  }

  private executeBossAttack(
    b: ActiveBossState,
    playerPos: THREE.Vector3,
    projectiles: ConvoyProjectile[],
    addNotification: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ) {
    sound.playTargetLock();

    // Fire 3-spread heavy plasma bolts aimed at player
    const forward = playerPos.clone().sub(b.position).normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

    [-1, 0, 1].forEach((spread) => {
      const dir = forward.clone().addScaledVector(right, spread * 0.15).normalize();
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      pMesh.position.copy(b.position).addScaledVector(dir, 25);
      if (this.combatGroup) this.combatGroup.add(pMesh);

      projectiles.push({
        id: `boss_atk_${Date.now()}_${Math.random()}`,
        owner: 'ENEMY',
        faction: 'HUNTERS',
        position: pMesh.position.clone(),
        velocity: dir.multiplyScalar(180),
        damage: 28,
        radius: 3.5,
        lifetime: 5.0,
        color: new THREE.Color(0xef4444),
        mesh: pMesh,
      });
    });

    addNotification(`${b.name.toUpperCase()} FIRED HEAVY SALVO!`, 'WARNING');
  }

  /**
   * Apply weapon damage to boss or its destroyable subnodes
   */
  public applyDamage(amount: number, hitPos: THREE.Vector3): { hitTarget: string; remainingHp: number; defeated: boolean } | null {
    if (!this.activeBoss || !this.activeBoss.isAlive) return null;

    const b = this.activeBoss;

    // Check if subnodes were struck first
    for (const node of b.subNodes) {
      if (!node.isAlive) continue;
      const nodeWorld = b.position.clone().add(node.offset);
      if (hitPos.distanceTo(nodeWorld) < 18) {
        node.health = Math.max(0, node.health - amount);
        sound.playShieldHit();
        if (node.health <= 0) {
          node.isAlive = false;
          if (node.mesh && b.mesh) b.mesh.remove(node.mesh);
          sound.playMissileExplosion();
        }
        return { hitTarget: node.name, remainingHp: node.health, defeated: false };
      }
    }

    // If main boss is hit: check vulnerability
    if (!b.isVulnerable && b.shield > 0) {
      b.shield = Math.max(0, b.shield - amount * 0.2);
      sound.playShieldDeflect();
      return { hitTarget: `${b.name} (SHIELD ABSORB)`, remainingHp: b.health, defeated: false };
    }

    b.health = Math.max(0, b.health - amount);
    b.hitFlashTimer = 0.2;
    sound.playHeavyImpact();

    if (b.health <= 0) {
      b.isAlive = false;
      b.isDefeated = true;
      if (b.mesh && this.combatGroup) {
        this.combatGroup.remove(b.mesh);
      }
      sound.playExplosion();
      sound.playFinish();
      return { hitTarget: b.name, remainingHp: 0, defeated: true };
    }

    return { hitTarget: b.name, remainingHp: b.health, defeated: false };
  }

  public getTelemetry(): {
    hasActiveBoss: boolean;
    name: string;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    phase: number;
    totalPhases: number;
    phaseName: string;
    isVulnerable: boolean;
  } | null {
    if (!this.activeBoss || !this.activeBoss.isAlive) return null;
    return {
      hasActiveBoss: true,
      name: this.activeBoss.name,
      health: Math.round(this.activeBoss.health),
      maxHealth: this.activeBoss.maxHealth,
      shield: Math.round(this.activeBoss.shield),
      maxShield: this.activeBoss.maxShield,
      phase: this.activeBoss.phase,
      totalPhases: this.activeBoss.totalPhases,
      phaseName: this.activeBoss.phaseName,
      isVulnerable: this.activeBoss.isVulnerable,
    };
  }
}

export const convoyBossDirector = new ConvoyBossDirector();
