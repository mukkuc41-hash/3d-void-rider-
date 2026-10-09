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

  // 3D In-World Holographic Spatial Circular Clocks
  public gantryMeshGroup: THREE.Group;
  private gantryCanvases: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    group: THREE.Group;
    reticleMesh: THREE.Mesh;
    faceMesh: THREE.Mesh;
  }[] = [];

  constructor(durationSeconds: number = 900, submodeNumber: number = 10) {
    this.initialDurationMs = durationSeconds * 1000;
    this.remainingMs = this.initialDurationMs;
    this.activeSubmodeNumber = submodeNumber;

    this.gantryMeshGroup = new THREE.Group();
    this.gantryMeshGroup.name = 'QuantumCountdown_SpatialCircularClocks';
    this.gantryMeshGroup.visible = submodeNumber === 10;

    // Build the 3D spatial circular holographic countdown clocks in world space
    this.buildSpatialCircularClocks();
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

  public getRemainingSeconds(): number {
    return Math.max(0, this.remainingMs / 1000);
  }

  public getTelemetry(): QuantumCountdownTelemetry {
    return this.update(0);
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

    // Visibility strictly gated to Submode 10: The Final Collapse
    const isSubmode10 = this.activeSubmodeNumber === 10;
    this.gantryMeshGroup.visible = isSubmode10;

    if (isSubmode10) {
      // Rotate inner holographic reticles for spatial sci-fi aesthetic
      for (const g of this.gantryCanvases) {
        g.reticleMesh.rotation.z += dt * 0.35;
      }

      // Refresh 3D spatial circular clock texture every 100ms
      if (Math.floor(this.elapsedMs / 100) !== Math.floor((this.elapsedMs - dt * 1000) / 100)) {
        this.updateGantryDisplays();
      }
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
    if (this.audioMuted || this.activeSubmodeNumber !== 10) return;
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
     3D SPATIAL CIRCULAR HOLOGRAPHIC COUNTDOWN CLOCKS
     Placed directly above major route checkpoints in Submode 10
     ========================================================================= */
  private buildSpatialCircularClocks(): void {
    const portalPositions = [
      new THREE.Vector3(0, 36, -350),      // Near launch gantry
      new THREE.Vector3(-450, 72, -1100),  // Orbital arc apex portal
      new THREE.Vector3(600, 82, -800),    // Outer sweep gateway
      new THREE.Vector3(0, 52, -2100),     // Terminal approach portal
    ];

    for (let i = 0; i < portalPositions.length; i++) {
      const pos = portalPositions[i];
      const clockGroup = new THREE.Group();
      clockGroup.position.copy(pos);
      // Face towards oncoming ships along the race spline
      clockGroup.lookAt(pos.x, pos.y, pos.z + 100);

      // 1. Heavy Industrial Gantry Pylons (Left & Right Anchors)
      const pylonGeo = new THREE.CylinderGeometry(1.2, 1.8, 48, 12);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.85,
        roughness: 0.25,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.15,
      });

      const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
      leftPylon.position.set(-28, 0, 0);
      clockGroup.add(leftPylon);

      const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
      rightPylon.position.set(28, 0, 0);
      clockGroup.add(rightPylon);

      // Support Arch Crossbeam
      const archGeo = new THREE.BoxGeometry(60, 2.2, 3.2);
      const archMesh = new THREE.Mesh(archGeo, pylonMat);
      archMesh.position.set(0, 22, 0);
      clockGroup.add(archMesh);

      // 2. Outer Heavy Torus Ring Frame
      const torusGeo = new THREE.TorusGeometry(19, 0.9, 16, 64);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x0b1329,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      clockGroup.add(torusMesh);

      // 3. Cyan Laser Emitter Accents (4 Cardinal Emitter Nodes)
      const emitterGeo = new THREE.BoxGeometry(2.4, 2.4, 3.5);
      const emitterMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const ang of angles) {
        const em = new THREE.Mesh(emitterGeo, emitterMat);
        em.position.set(Math.cos(ang) * 19, Math.sin(ang) * 19, 0);
        clockGroup.add(em);
      }

      // 4. Rotating Holographic Reticle Ring
      const reticleGeo = new THREE.RingGeometry(15.2, 16.8, 48);
      const reticleMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
      reticleMesh.position.z = 0.1;
      clockGroup.add(reticleMesh);

      // 5. Outer Ambient Holographic Aura Ring
      const auraGeo = new THREE.RingGeometry(18.8, 20.8, 64);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.z = -0.1;
      clockGroup.add(auraMesh);

      // 6. Center Circular Holographic Dial Canvas (512x512)
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const faceGeo = new THREE.CircleGeometry(17.8, 64);
      const faceMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.z = 0.2;
      clockGroup.add(faceMesh);

      this.gantryCanvases.push({
        canvas,
        ctx,
        texture,
        group: clockGroup,
        reticleMesh,
        faceMesh,
      });
      this.gantryMeshGroup.add(clockGroup);
    }

    this.updateGantryDisplays();
  }

  private updateGantryDisplays(): void {
    const totalSeconds = Math.max(0, this.remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((this.remainingMs % 1000) / 10);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    const minSecStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const remainingRatio = Math.max(0, Math.min(1.0, this.remainingMs / Math.max(1, this.initialDurationMs)));
    const isZeroHour = this.hasExpired || this.remainingMs <= 0;
    const isImminent = !isZeroHour && totalSeconds <= 30;
    const isCritical = !isZeroHour && !isImminent && totalSeconds <= 90;

    const primaryColor = isZeroHour ? '#ef4444' : isImminent ? '#f43f5e' : isCritical ? '#f59e0b' : '#00f0ff';
    const glowColor = isZeroHour ? 'rgba(239, 68, 68, 0.8)' : isCritical ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 240, 255, 0.7)';

    for (const g of this.gantryCanvases) {
      const { ctx, canvas, texture } = g;
      const cx = 256;
      const cy = 256;
      const dialRadius = 210;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Circular Dark Cybernetic Backdrop
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, dialRadius, 0, Math.PI * 2);
      ctx.fillStyle = isZeroHour
        ? 'rgba(40, 6, 6, 0.82)'
        : isImminent
        ? 'rgba(35, 8, 18, 0.78)'
        : isCritical
        ? 'rgba(30, 18, 4, 0.75)'
        : 'rgba(2, 8, 26, 0.72)';
      ctx.fill();

      // Outer Glow Border
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // 2. Precision Radial Dial Tick Marks (60 ticks around circumference)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 60; i++) {
        const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 5 === 0;
        const tickLen = isMajor ? 14 : 7;
        const r1 = dialRadius - 6;
        const r2 = dialRadius - 6 - tickLen;

        ctx.strokeStyle = isMajor ? primaryColor : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isMajor ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Circular Countdown Progress Ring (Empties as time runs out)
      const startAngle = -Math.PI / 2; // 12 o'clock top
      const sweepAngle = remainingRatio * Math.PI * 2;
      const endAngle = startAngle + sweepAngle;

      ctx.save();
      // Track background ring
      ctx.beginPath();
      ctx.arc(cx, cy, dialRadius - 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Active Gradient Arc
      if (remainingRatio > 0.005) {
        const gradient = ctx.createLinearGradient(cx - dialRadius, cy, cx + dialRadius, cy);
        gradient.addColorStop(0, '#00f0ff');
        gradient.addColorStop(0.5, '#c084fc');
        gradient.addColorStop(0.8, '#fb923c');
        gradient.addColorStop(1, '#ef4444');

        ctx.beginPath();
        ctx.arc(cx, cy, dialRadius - 22, startAngle, endAngle, false);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Tip Beacon Orb
        const tipX = cx + Math.cos(endAngle) * (dialRadius - 22);
        const tipY = cy + Math.sin(endAngle) * (dialRadius - 22);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fill();
      }
      ctx.restore();

      // 4. Center Holographic Typography Display
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Header Banner
      ctx.font = '900 13px monospace';
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 8;
      ctx.fillText('QUANTUM COLLAPSE // SUBMODE 10', cx, cy - 82);

      // Sub-label
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = isZeroHour ? '#fca5a5' : '#7dd3fc';
      ctx.shadowBlur = 0;
      ctx.fillText(isZeroHour ? 'SINGULARITY COLLAPSE' : 'T-MINUS COUNTDOWN', cx, cy - 60);

      // Large Prominent Time Readout
      ctx.font = '900 58px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 24;
      ctx.fillText(minSecStr, cx, cy - 8);

      // Hundredths decimal
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = primaryColor;
      ctx.shadowBlur = 12;
      ctx.fillText(`.${String(hundredths).padStart(2, '0')}`, cx, cy + 34);

      // Percentage remaining
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = isZeroHour ? '#ef4444' : '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText(`${Math.round(remainingRatio * 100)}% HORIZON REMAINING`, cx, cy + 62);

      // Tactical Status Badge Pill at Bottom
      const badgeY = cy + 96;
      ctx.beginPath();
      ctx.roundRect(cx - 105, badgeY - 12, 210, 24, 12);
      ctx.fillStyle = isZeroHour
        ? 'rgba(239, 68, 68, 0.45)'
        : isImminent
        ? 'rgba(244, 63, 94, 0.4)'
        : isCritical
        ? 'rgba(245, 158, 11, 0.35)'
        : 'rgba(0, 240, 255, 0.25)';
      ctx.fill();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '900 10px monospace';
      ctx.fillStyle = isZeroHour ? '#fee2e2' : isCritical ? '#fef3c7' : '#e0f2fe';
      ctx.fillText(
        isZeroHour
          ? 'ZERO HOUR // SINGULARITY'
          : isImminent
          ? 'CRITICAL // EVACUATE'
          : isCritical
          ? 'HAZARD ELEVATED'
          : 'NOMINAL // 15:00 TIMELINE',
        cx,
        badgeY
      );

      ctx.restore();
      texture.needsUpdate = true;
    }
  }

  public dispose(): void {
    for (const g of this.gantryCanvases) {
      g.faceMesh.geometry.dispose();
      if (g.faceMesh.material instanceof THREE.Material) {
        g.faceMesh.material.dispose();
      }
      g.reticleMesh.geometry.dispose();
      if (g.reticleMesh.material instanceof THREE.Material) {
        g.reticleMesh.material.dispose();
      }
      g.texture.dispose();
    }
    this.gantryCanvases = [];
    this.gantryMeshGroup.clear();
  }
}
