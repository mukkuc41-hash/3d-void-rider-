/**
 * Active Tactical Combat Modules System for Void-Rider 3D
 * Provides player-activated abilities (EMP Surge, Phase Warp, Graviton Anchor)
 * with 3D Three.js visual FX, cooldowns, and tactical race impact.
 */
import * as THREE from 'three';
import {
  TacticalModuleType,
  TacticalModuleInfo,
  TacticalModuleTelemetry,
} from '../types';
import { sound } from './audio';

export const TACTICAL_MODULES: Record<TacticalModuleType, TacticalModuleInfo> = {
  EMP_SURGE: {
    type: 'EMP_SURGE',
    name: 'EMP SURGE',
    hotkey: 'E',
    description: 'Discharges an electromagnetic sphere that stuns nearby rival ships and neutralizes shields for 3.0s.',
    icon: '⚡',
    cooldownSeconds: 14.0,
    activeDurationSeconds: 3.0,
    color: '#00f0ff',
  },
  PHASE_WARP: {
    type: 'PHASE_WARP',
    name: 'PHASE WARP',
    hotkey: 'Q',
    description: 'Instant forward quantum warp dash that phases invulnerably through asteroids and hazards.',
    icon: '🌀',
    cooldownSeconds: 12.0,
    activeDurationSeconds: 2.5,
    color: '#a855f7',
  },
  GRAVITON_ANCHOR: {
    type: 'GRAVITON_ANCHOR',
    name: 'GRAV-ANCHOR',
    hotkey: 'F',
    description: 'Grips the spacetime fabric to eliminate drift and take hair-pin corners at maximum velocity.',
    icon: '⚓',
    cooldownSeconds: 10.0,
    activeDurationSeconds: 4.0,
    color: '#fbbf24',
  },
};

export class TacticalModuleSystem {
  private equipped: TacticalModuleType = 'EMP_SURGE';
  private cooldownTimer: number = 0;
  private activeTimer: number = 0;
  private scene: THREE.Scene | null = null;

  // Visual FX meshes
  private empMesh: THREE.Mesh | null = null;
  private warpStreakGroup: THREE.Group | null = null;
  private gravParticles: THREE.Points | null = null;
  private feedbackText: string = '';
  private feedbackTimer: number = 0;

  constructor() {}

  public init(scene: THREE.Scene) {
    this.scene = scene;
    this.createFXMeshes();
  }

  private createFXMeshes() {
    if (!this.scene) return;

    // EMP Shockwave Ring
    const empGeo = new THREE.RingGeometry(0.5, 3.0, 32);
    const empMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.empMesh = new THREE.Mesh(empGeo, empMat);
    this.empMesh.rotation.x = Math.PI / 2;
    this.empMesh.visible = false;
    this.scene.add(this.empMesh);

    // Warp Streaks Group
    this.warpStreakGroup = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -(15 + Math.random() * 20)),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.7,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10
      );
      this.warpStreakGroup.add(line);
    }
    this.warpStreakGroup.visible = false;
    this.scene.add(this.warpStreakGroup);

    // Graviton Anchor Particles
    const gravGeo = new THREE.BufferGeometry();
    const count = 60;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 3.5 + (Math.random() - 0.5) * 1.5;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    gravGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const gravMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.gravParticles = new THREE.Points(gravGeo, gravMat);
    this.gravParticles.visible = false;
    this.scene.add(this.gravParticles);
  }

  public setEquipped(moduleType: TacticalModuleType) {
    this.equipped = moduleType;
    this.cooldownTimer = 0;
    this.activeTimer = 0;
  }

  public getEquipped(): TacticalModuleType {
    return this.equipped;
  }

  public activate(
    shipPosition: THREE.Vector3,
    shipRotation: THREE.Euler,
    forwardVector: THREE.Vector3,
    onEMPTriggered?: (radius: number) => void
  ): { success: boolean; effect: string } {
    if (this.cooldownTimer > 0) {
      return { success: false, effect: 'RECHARGING' };
    }

    const config = TACTICAL_MODULES[this.equipped];
    this.cooldownTimer = config.cooldownSeconds;
    this.activeTimer = config.activeDurationSeconds;

    sound.playGatePowerUp();

    if (this.equipped === 'EMP_SURGE') {
      this.feedbackText = '⚡ EMP SHOCKWAVE DISCHARGED';
      this.feedbackTimer = 2.0;

      if (this.empMesh) {
        this.empMesh.position.copy(shipPosition);
        this.empMesh.scale.set(1, 1, 1);
        this.empMesh.visible = true;
        (this.empMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
      }
      if (onEMPTriggered) {
        onEMPTriggered(75); // 75m stun radius
      }
      return { success: true, effect: 'EMP' };
    } else if (this.equipped === 'PHASE_WARP') {
      this.feedbackText = '🌀 QUANTUM PHASE WARP ACTIVE';
      this.feedbackTimer = 2.0;

      if (this.warpStreakGroup) {
        this.warpStreakGroup.position.copy(shipPosition);
        this.warpStreakGroup.rotation.copy(shipRotation);
        this.warpStreakGroup.visible = true;
      }
      return { success: true, effect: 'WARP' };
    } else if (this.equipped === 'GRAVITON_ANCHOR') {
      this.feedbackText = '⚓ GRAVITON DRIFT ANCHOR ENGAGED';
      this.feedbackTimer = 2.0;

      if (this.gravParticles) {
        this.gravParticles.position.copy(shipPosition);
        this.gravParticles.visible = true;
        (this.gravParticles.material as THREE.PointsMaterial).opacity = 0.85;
      }
      return { success: true, effect: 'GRAVITON' };
    }

    return { success: true, effect: 'OK' };
  }

  public update(delta: number, shipPosition: THREE.Vector3, shipRotation: THREE.Euler) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }

    if (this.feedbackTimer > 0) {
      this.feedbackTimer = Math.max(0, this.feedbackTimer - delta);
      if (this.feedbackTimer <= 0) {
        this.feedbackText = '';
      }
    }

    if (this.activeTimer > 0) {
      this.activeTimer = Math.max(0, this.activeTimer - delta);

      // Animate EMP visual
      if (this.equipped === 'EMP_SURGE' && this.empMesh && this.empMesh.visible) {
        const progress = 1 - (this.activeTimer / TACTICAL_MODULES.EMP_SURGE.activeDurationSeconds);
        const scale = 1 + progress * 50; // Expands to 50x
        this.empMesh.scale.set(scale, scale, 1);
        (this.empMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - progress));
        if (progress >= 1) {
          this.empMesh.visible = false;
        }
      }

      // Animate Warp streaks
      if (this.equipped === 'PHASE_WARP' && this.warpStreakGroup && this.warpStreakGroup.visible) {
        this.warpStreakGroup.position.copy(shipPosition);
        this.warpStreakGroup.rotation.copy(shipRotation);
        if (this.activeTimer <= 0) {
          this.warpStreakGroup.visible = false;
        }
      }

      // Animate Graviton particles
      if (this.equipped === 'GRAVITON_ANCHOR' && this.gravParticles && this.gravParticles.visible) {
        this.gravParticles.position.copy(shipPosition);
        this.gravParticles.rotation.y += delta * 6.0;
        if (this.activeTimer <= 0) {
          this.gravParticles.visible = false;
        }
      }
    } else {
      if (this.empMesh) this.empMesh.visible = false;
      if (this.warpStreakGroup) this.warpStreakGroup.visible = false;
      if (this.gravParticles) this.gravParticles.visible = false;
    }
  }

  public isInvulnerable(): boolean {
    return this.equipped === 'PHASE_WARP' && this.activeTimer > 0;
  }

  public isGravitonAnchored(): boolean {
    return this.equipped === 'GRAVITON_ANCHOR' && this.activeTimer > 0;
  }

  public getTelemetry(): TacticalModuleTelemetry {
    const config = TACTICAL_MODULES[this.equipped];
    return {
      equippedModule: this.equipped,
      cooldownRemaining: this.cooldownTimer,
      totalCooldown: config.cooldownSeconds,
      isActive: this.activeTimer > 0,
      activeRemaining: this.activeTimer,
      ready: this.cooldownTimer <= 0,
      feedbackText: this.feedbackText,
    };
  }

  public dispose() {
    if (this.scene) {
      if (this.empMesh) this.scene.remove(this.empMesh);
      if (this.warpStreakGroup) this.scene.remove(this.warpStreakGroup);
      if (this.gravParticles) this.scene.remove(this.gravParticles);
    }
  }
}
