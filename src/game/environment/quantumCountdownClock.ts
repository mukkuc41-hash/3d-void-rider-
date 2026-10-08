import * as THREE from 'three';
import { sound } from '../audio';
import { getMasterEventByElapsedSeconds } from '../finalCollapse/finalCollapseMaster100Timeline';

export type CountdownDangerState =
  | 'SAFE'
  | 'ADVISORY'
  | 'CRITICAL'
  | 'IMMINENT'
  | 'ZERO_HOUR';

export interface QuantumCountdownTelemetry {
  remainingMs: number;
  initialDurationMs: number;
  elapsedMs: number;
  formattedTime: string;      // e.g. "15:00.00"
  formattedMinSec: string;    // e.g. "15:00"
  minutes: number;
  seconds: number;
  hundredths: number;
  progressRatio: number;      // 0.0 at start, 1.0 at zero hour
  remainingRatio: number;     // 1.0 at start (15:00), 0.0 at zero hour
  dangerState: CountdownDangerState;
  statusBadge: string;
  statusColor: string;
  isPaused: boolean;
  hasExpired: boolean;
  activeSubmodeNumber: number;
  /** Submode 10: event index derived ONLY from the authoritative countdown timeline. */
  currentEventNumber: number;
  nextEventNumber: number | null;
  secondsIntoCurrentEvent: number;
  secondsUntilNextEvent: number;
}

export class QuantumCountdownClock {
  public initialDurationMs: number;
  public remainingMs: number;
  public elapsedMs: number = 0;
  public isPaused: boolean = true;
  public hasExpired: boolean = false;
  public activeSubmodeNumber: number = 10;

  // Audio tick throttling
  private lastAudibleSecond: number = -1;
  private lastUrgentChimeSecond: number = -1;
  public audioMuted: boolean = false;

  // 3D In-World Holographic Gantry Billboards
  public gantryMeshGroup: THREE.Group;
  private gantryCanvases: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    mesh: THREE.Mesh;
  }[] = [];

  constructor(durationSeconds: number = 900, submodeNumber: number = 10) {
    this.initialDurationMs = durationSeconds * 1000;
    this.remainingMs = this.initialDurationMs;
    this.activeSubmodeNumber = submodeNumber;

    this.gantryMeshGroup = new THREE.Group();
    this.gantryMeshGroup.name = 'QuantumCountdown_HolographicGantries';
    // Removed overhead clock billboard meshes to avoid cluttering view;
    // countdown now appears cleanly within the Quantum Launch Pro message banner.
  }

  public setDuration(seconds: number): void {
    this.initialDurationMs = seconds * 1000;
    this.remainingMs = this.initialDurationMs;
    this.elapsedMs = 0;
    this.hasExpired = false;
    this.lastAudibleSecond = -1;
    this.lastUrgentChimeSecond = -1;
    this.updateGantryDisplays();
  }

  public reset(): void {
    this.remainingMs = this.initialDurationMs;
    this.elapsedMs = 0;
    this.hasExpired = false;
    this.lastAudibleSecond = -1;
    this.lastUrgentChimeSecond = -1;
    this.updateGantryDisplays();
  }

  public skipToZero(): void {
    this.remainingMs = 0;
    this.elapsedMs = this.initialDurationMs;
    this.hasExpired = true;
    this.updateGantryDisplays();
  }

  public setRemainingSeconds(seconds: number): void {
    const safeRemainingMs = Math.max(0, Math.min(this.initialDurationMs, seconds * 1000));
    this.remainingMs = safeRemainingMs;
    this.elapsedMs = this.initialDurationMs - safeRemainingMs;
    this.hasExpired = this.remainingMs <= 0;
    this.updateGantryDisplays();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public update(dt: number): QuantumCountdownTelemetry {
    if (!this.isPaused) {
      const dtMs = dt * 1000;
      this.elapsedMs += dtMs;

      if (!this.hasExpired) {
        this.remainingMs = Math.max(0, this.initialDurationMs - this.elapsedMs);

        if (this.remainingMs <= 0) {
          this.remainingMs = 0;
          this.hasExpired = true;
          if (!this.audioMuted) {
            sound.playCountdown(true);
            sound.playFinalCosmicCollapse();
          }
        } else {
          this.checkAudioAlerts();
        }
      }
    }

    const totalSeconds = Math.max(0, this.remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((this.remainingMs % 1000) / 10);
    const progressRatio = Math.min(1.0, Math.max(0, this.elapsedMs / this.initialDurationMs));

    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    const formattedMinSec = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const remainingRatio = Math.max(0, Math.min(1.0, this.remainingMs / this.initialDurationMs));

    // FINAL COLLAPSE / SUBMODE 10 uses the canonical 100-event schedule.
    // 15-minute countdown (900 seconds) across 100 events:
    // Exactly matches the circular countdown clock as it counts down from 15:00 to 00:00.
    const timelineSeconds = Math.min(
      900,
      Math.max(
        0,
        this.initialDurationMs === 900000
          ? (this.initialDurationMs - this.remainingMs) / 1000
          : (this.elapsedMs / Math.max(1, this.initialDurationMs)) * 900
      )
    );

    const masterInfo = getMasterEventByElapsedSeconds(timelineSeconds);
    const currentEventNumber = masterInfo.currentEvent.eventNumber;
    const nextEventNumber = masterInfo.nextEvent ? masterInfo.nextEvent.eventNumber : null;
    const secondsUntilNextEvent = masterInfo.secondsUntilNext;
    const secondsIntoCurrentEvent = Math.max(0, timelineSeconds - masterInfo.currentEvent.exactTriggerSeconds);

    let dangerState: CountdownDangerState = 'SAFE';
    let statusBadge = 'STABLE // NOMINAL';
    let statusColor = '#00f0ff';

    if (this.hasExpired) {
      dangerState = 'ZERO_HOUR';
      statusBadge = 'ZERO HOUR // SINGULARITY COLLAPSE';
      statusColor = '#dc2626';
    } else if (totalSeconds <= 15 || progressRatio >= 0.9) {
      dangerState = 'IMMINENT';
      statusBadge = 'IMMINENT COLLAPSE // EVACUATE NOW';
      statusColor = '#ef4444';
    } else if (totalSeconds <= 45 || progressRatio >= 0.75) {
      dangerState = 'CRITICAL';
      statusBadge = 'CRITICAL HAZARD // ESCAPE ACTIVE';
      statusColor = '#f59e0b';
    } else if (progressRatio >= 0.45) {
      dangerState = 'ADVISORY';
      statusBadge = 'ELEVATED GRAVITY // PROCEED';
      statusColor = '#38bdf8';
    }

    // Refresh 3D gantry texture every 150ms
    if (Math.floor(this.elapsedMs / 150) !== Math.floor((this.elapsedMs - dt * 1000) / 150)) {
      this.updateGantryDisplays();
    }

    return {
      remainingMs: this.remainingMs,
      initialDurationMs: this.initialDurationMs,
      elapsedMs: this.elapsedMs,
      formattedTime,
      formattedMinSec,
      minutes,
      seconds,
      hundredths,
      progressRatio,
      remainingRatio,
      dangerState,
      statusBadge,
      statusColor,
      isPaused: this.isPaused,
      hasExpired: this.hasExpired,
      activeSubmodeNumber: this.activeSubmodeNumber,
      currentEventNumber,
      nextEventNumber,
      secondsIntoCurrentEvent,
      secondsUntilNextEvent,
    };
  }

  private checkAudioAlerts(): void {
    if (this.audioMuted) return;
    const currentSec = Math.floor(this.remainingMs / 1000);

    if (currentSec !== this.lastAudibleSecond) {
      this.lastAudibleSecond = currentSec;

      // Under 10 seconds: rapid intense ticks
      if (currentSec <= 10 && currentSec > 0) {
        sound.playQuantumCountdownTick(true);
      }
      // Under 30 seconds: urgent double chime every 5s
      else if (currentSec <= 30 && currentSec % 5 === 0 && currentSec !== this.lastUrgentChimeSecond) {
        this.lastUrgentChimeSecond = currentSec;
        sound.playCountdownUrgentAlarm();
      }
      // Under 60 seconds: subtle tick every 2 seconds
      else if (currentSec <= 60 && currentSec % 2 === 0) {
        sound.playQuantumCountdownTick(false);
      }
      // Regular phase: subtle heartbeat tick every 15s
      else if (currentSec % 15 === 0) {
        sound.playQuantumCountdownTick(false);
      }
    }
  }

  /* =========================================================================
     3D IN-WORLD HOLOGRAPHIC GANTRY CLOCKS
     Placed directly above major route checkpoints
     ========================================================================= */
  private buildHolographicGantries(): void {
    const gantryPositions = [
      new THREE.Vector3(0, 32, -350),      // Near launch gantry
      new THREE.Vector3(-450, 65, -1100),  // Orbital arc gantry
      new THREE.Vector3(600, 75, -800),    // Outer sweep gantry
      new THREE.Vector3(0, 45, -2100),     // Terminal approach gantry
    ];

    for (let i = 0; i < gantryPositions.length; i++) {
      const pos = gantryPositions[i];
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 9), mat);
      mesh.position.copy(pos);
      // Face towards oncoming ships
      mesh.lookAt(pos.x, pos.y, pos.z + 100);

      // Support arch structure
      const frameGeo = new THREE.BoxGeometry(40, 1.2, 2.5);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(0, 5.2, 0);
      mesh.add(frame);

      this.gantryCanvases.push({ canvas, ctx, texture, mesh });
      this.gantryMeshGroup.add(mesh);
    }

    this.updateGantryDisplays();
  }

  private updateGantryDisplays(): void {
    const totalSeconds = Math.max(0, this.remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const timeStr = `T - ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const isCritical = totalSeconds <= 60;
    const isImminent = totalSeconds <= 30;

    for (const g of this.gantryCanvases) {
      const { ctx, canvas, texture } = g;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyberpunk semi-transparent glowing backing
      ctx.fillStyle = isImminent ? 'rgba(220, 38, 38, 0.4)' : isCritical ? 'rgba(245, 158, 11, 0.35)' : 'rgba(2, 6, 23, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border glow
      ctx.strokeStyle = isImminent ? '#ef4444' : isCritical ? '#f59e0b' : '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Sub-heading
      ctx.fillStyle = isImminent ? '#fca5a5' : isCritical ? '#fde68a' : '#7dd3fc';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`QUANTUM COLLAPSE // PROTOCOL 21`, canvas.width / 2, 34);

      // Primary Countdown Digits
      ctx.fillStyle = isImminent ? '#ffffff' : isCritical ? '#fffbeb' : '#ffffff';
      ctx.font = '900 56px monospace';
      ctx.fillText(timeStr, canvas.width / 2, 92);

      // Corner accent marks
      ctx.fillStyle = isImminent ? '#ef4444' : '#00f0ff';
      ctx.fillRect(8, 8, 12, 12);
      ctx.fillRect(canvas.width - 20, 8, 12, 12);
      ctx.fillRect(8, canvas.height - 20, 12, 12);
      ctx.fillRect(canvas.width - 20, canvas.height - 20, 12, 12);

      texture.needsUpdate = true;
    }
  }

  public dispose(): void {
    for (const g of this.gantryCanvases) {
      g.mesh.geometry.dispose();
      if (g.mesh.material instanceof THREE.Material) {
        g.mesh.material.dispose();
      }
      g.texture.dispose();
    }
    this.gantryCanvases = [];
    this.gantryMeshGroup.clear();
  }
}
