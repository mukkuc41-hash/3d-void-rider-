/**
 * Holographic Ghost Lap & Live Delta Split System for Void-Rider 3D
 * Records player's fastest lap, saves personal best to local storage,
 * renders a glowing translucent ghost racer, and provides live split comparisons.
 */
import * as THREE from 'three';
import { GhostFrame, GhostTelemetry, TrackId } from '../types';
import { createShipMesh } from './ships';

const STORAGE_PREFIX = 'void_rider_ghost_';

export class GhostSystem {
  private scene: THREE.Scene | null = null;
  private ghostGroup: THREE.Group | null = null;

  // Recording
  private isRecording: boolean = false;
  private currentLapFrames: GhostFrame[] = [];
  private currentLapStartTime: number = 0;

  // Playback
  private bestGhostFrames: GhostFrame[] = [];
  private bestGhostLapTime: number | null = null;
  private playbackTime: number = 0;
  private currentTrackId: TrackId = 'circuit_alpha';

  // Checkpoint splits
  private ghostCheckpointTimes: Map<number, number> = new Map();
  private playerCheckpointTimes: Map<number, number> = new Map();
  private lastDelta: number = 0;

  constructor() {}

  public init(scene: THREE.Scene, trackId: TrackId, shipId: string = 'vortex_nemesis') {
    this.scene = scene;
    this.currentTrackId = trackId;
    this.loadBestGhost(trackId);
    this.createGhostMesh(shipId);
  }

  private createGhostMesh(shipId: string) {
    if (!this.scene) return;
    if (this.ghostGroup) {
      this.scene.remove(this.ghostGroup);
      this.ghostGroup = null;
    }

    this.ghostGroup = new THREE.Group();

    // Generate base ship mesh geometry
    const baseShip = createShipMesh(shipId, '#00f0ff', '#0284c7', 'none', '#00f0ff', 'cyber_stealth');

    // Convert materials to holographic cyan
    baseShip.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
        });
      }
    });

    this.ghostGroup.add(baseShip);

    // Add glowing outer holographic aura
    const auraGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.ghostGroup.add(auraMesh);

    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
  }

  public startLap(lapNumber: number) {
    this.isRecording = true;
    this.currentLapStartTime = performance.now();
    this.currentLapFrames = [];
    this.playerCheckpointTimes.clear();
    this.playbackTime = 0;
  }

  public recordFrame(
    pos: THREE.Vector3,
    rot: THREE.Euler,
    speed: number,
    boosting: boolean
  ) {
    if (!this.isRecording) return;
    const t = (performance.now() - this.currentLapStartTime) / 1000;
    const q = new THREE.Quaternion().setFromEuler(rot);
    this.currentLapFrames.push({
      t,
      pos: [pos.x, pos.y, pos.z],
      rot: [q.x, q.y, q.z, q.w],
      speed,
      boosting,
    });
  }

  public recordCheckpoint(checkpointId: number) {
    const t = (performance.now() - this.currentLapStartTime) / 1000;
    this.playerCheckpointTimes.set(checkpointId, t);

    // Calculate delta against ghost at this checkpoint
    const ghostTime = this.ghostCheckpointTimes.get(checkpointId);
    if (ghostTime !== undefined) {
      this.lastDelta = t - ghostTime;
    }
  }

  public completeLap(lapTimeSeconds: number): boolean {
    this.isRecording = false;

    // Check if new personal best
    if (this.bestGhostLapTime === null || lapTimeSeconds < this.bestGhostLapTime) {
      this.bestGhostLapTime = lapTimeSeconds;
      this.bestGhostFrames = [...this.currentLapFrames];
      this.ghostCheckpointTimes = new Map(this.playerCheckpointTimes);
      this.saveBestGhost();
      return true; // New record!
    }
    return false;
  }

  public update(delta: number, playerPos: THREE.Vector3): GhostTelemetry {
    this.playbackTime += delta;

    let hasGhost = this.bestGhostFrames.length > 0;
    let ghostDistance = 999;

    if (hasGhost && this.ghostGroup) {
      this.ghostGroup.visible = true;

      // Find frame
      const frame = this.interpolateFrame(this.playbackTime);
      if (frame) {
        this.ghostGroup.position.set(frame.pos[0], frame.pos[1], frame.pos[2]);
        this.ghostGroup.quaternion.set(frame.rot[0], frame.rot[1], frame.rot[2], frame.rot[3]);
        ghostDistance = playerPos.distanceTo(this.ghostGroup.position);
      } else {
        this.ghostGroup.visible = false;
      }
    } else if (this.ghostGroup) {
      this.ghostGroup.visible = false;
    }

    const currentLapTime = this.isRecording
      ? (performance.now() - this.currentLapStartTime) / 1000
      : 0;

    return {
      hasGhost,
      ghostLapTime: this.bestGhostLapTime,
      currentLapTime,
      deltaSeconds: this.lastDelta,
      isAhead: this.lastDelta <= 0,
      ghostDistance,
    };
  }

  private interpolateFrame(t: number): GhostFrame | null {
    const frames = this.bestGhostFrames;
    if (frames.length === 0) return null;
    if (t <= frames[0].t) return frames[0];
    if (t >= frames[frames.length - 1].t) return null; // Ghost finished lap

    // Binary search for nearest frame
    let low = 0;
    let high = frames.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (frames[mid].t < t) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i0 = Math.max(0, low - 1);
    const i1 = Math.min(frames.length - 1, low);
    const f0 = frames[i0];
    const f1 = frames[i1];

    if (f0 === f1) return f0;

    const factor = Math.max(0, Math.min(1, (t - f0.t) / (f1.t - f0.t)));
    return {
      t,
      pos: [
        f0.pos[0] + (f1.pos[0] - f0.pos[0]) * factor,
        f0.pos[1] + (f1.pos[1] - f0.pos[1]) * factor,
        f0.pos[2] + (f1.pos[2] - f0.pos[2]) * factor,
      ],
      rot: f0.rot,
      speed: f0.speed + (f1.speed - f0.speed) * factor,
      boosting: f0.boosting,
    };
  }

  private saveBestGhost() {
    try {
      const payload = {
        trackId: this.currentTrackId,
        lapTime: this.bestGhostLapTime,
        frames: this.bestGhostFrames,
        checkpoints: Array.from(this.ghostCheckpointTimes.entries()),
      };
      localStorage.setItem(STORAGE_PREFIX + this.currentTrackId, JSON.stringify(payload));
    } catch {
      // LocalStorage quota safety
    }
  }

  private loadBestGhost(trackId: TrackId) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + trackId);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.bestGhostLapTime = parsed.lapTime || null;
        this.bestGhostFrames = parsed.frames || [];
        this.ghostCheckpointTimes = new Map(parsed.checkpoints || []);
      } else {
        this.bestGhostLapTime = null;
        this.bestGhostFrames = [];
        this.ghostCheckpointTimes.clear();
      }
    } catch {
      this.bestGhostLapTime = null;
      this.bestGhostFrames = [];
    }
  }

  public dispose() {
    if (this.scene && this.ghostGroup) {
      this.scene.remove(this.ghostGroup);
      this.ghostGroup = null;
    }
  }
}
