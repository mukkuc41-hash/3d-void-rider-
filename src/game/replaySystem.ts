/**
 * Race Replay Theater & TV Broadcast Director System for Void-Rider 3D
 * Records multi-craft race keyframes and plays back with automated broadcast TV angles,
 * slow-motion playback, and telemetry overlays.
 */
import * as THREE from 'three';
import { ReplayCameraMode, ReplayData, ReplayKeyframe, ReplayRacerFrame, TrackId } from '../types';

export class ReplaySystem {
  public isRecording: boolean = false;
  public isPlaying: boolean = false;

  private currentReplay: ReplayData | null = null;
  private recordingKeyframes: ReplayKeyframe[] = [];
  private raceStartTime: number = 0;

  // Playback state
  public playbackTimeMs: number = 0;
  public playbackSpeed: number = 1.0; // 0.25, 0.5, 1.0, 2.0
  public cameraMode: ReplayCameraMode = 'BROADCAST_TV';

  constructor() {
    this.loadLastReplay();
  }

  public startRecording(trackId: TrackId) {
    this.isRecording = true;
    this.recordingKeyframes = [];
    this.raceStartTime = performance.now();
    this.currentReplay = {
      id: 'rep_' + Date.now().toString(36),
      trackId,
      totalTimeMs: 0,
      keyframes: [],
      winnerName: 'Player',
      recordedAt: Date.now(),
    };
  }

  public recordFrame(racers: { id: string; pos: THREE.Vector3; rot: THREE.Euler; speed: number; boosting: boolean }[]) {
    if (!this.isRecording || !this.currentReplay) return;
    const now = performance.now();
    const timestampMs = Math.round(now - this.raceStartTime);

    // Record every ~60ms to keep memory tight
    const lastKf = this.recordingKeyframes[this.recordingKeyframes.length - 1];
    if (lastKf && timestampMs - lastKf.timestampMs < 55) return;

    const frames: ReplayRacerFrame[] = racers.map((r) => {
      const q = new THREE.Quaternion().setFromEuler(r.rot);
      return {
        id: r.id,
        pos: [r.pos.x, r.pos.y, r.pos.z],
        rot: [q.x, q.y, q.z, q.w],
        speed: r.speed,
        boosting: r.boosting,
      };
    });

    this.recordingKeyframes.push({
      timestampMs,
      racers: frames,
    });
  }

  public finishRecording(winnerName: string = 'Player') {
    if (!this.isRecording || !this.currentReplay) return;
    this.isRecording = false;
    this.currentReplay.keyframes = [...this.recordingKeyframes];
    this.currentReplay.totalTimeMs = this.recordingKeyframes.length > 0
      ? this.recordingKeyframes[this.recordingKeyframes.length - 1].timestampMs
      : 0;
    this.currentReplay.winnerName = winnerName;
    this.saveReplay();
  }

  public getReplayData(): ReplayData | null {
    return this.currentReplay;
  }

  public startPlayback() {
    if (!this.currentReplay || this.currentReplay.keyframes.length === 0) return;
    this.isPlaying = true;
    this.playbackTimeMs = 0;
  }

  public pausePlayback() {
    this.isPlaying = false;
  }

  public resumePlayback() {
    this.isPlaying = true;
  }

  public seek(timeMs: number) {
    if (!this.currentReplay) return;
    this.playbackTimeMs = Math.max(0, Math.min(this.currentReplay.totalTimeMs, timeMs));
  }

  public update(deltaSeconds: number): {
    currentMs: number;
    totalMs: number;
    cameraMode: ReplayCameraMode;
    racers: ReplayRacerFrame[];
  } {
    if (this.isPlaying && this.currentReplay) {
      this.playbackTimeMs += deltaSeconds * 1000 * this.playbackSpeed;
      if (this.playbackTimeMs >= this.currentReplay.totalTimeMs) {
        this.playbackTimeMs = 0; // Loop playback
      }
    }

    const racers = this.interpolateRacers(this.playbackTimeMs);
    const totalMs = this.currentReplay?.totalTimeMs || 1;

    return {
      currentMs: this.playbackTimeMs,
      totalMs,
      cameraMode: this.cameraMode,
      racers,
    };
  }

  private interpolateRacers(timeMs: number): ReplayRacerFrame[] {
    if (!this.currentReplay || this.currentReplay.keyframes.length === 0) return [];
    const kfs = this.currentReplay.keyframes;

    // Find bounding keyframes
    let kf0 = kfs[0];
    let kf1 = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (kfs[i].timestampMs <= timeMs && kfs[i + 1].timestampMs >= timeMs) {
        kf0 = kfs[i];
        kf1 = kfs[i + 1];
        break;
      }
    }

    const denom = kf1.timestampMs - kf0.timestampMs;
    const factor = denom > 0 ? (timeMs - kf0.timestampMs) / denom : 0;

    return kf0.racers.map((r0) => {
      const r1 = kf1.racers.find((r) => r.id === r0.id) || r0;
      return {
        id: r0.id,
        pos: [
          r0.pos[0] + (r1.pos[0] - r0.pos[0]) * factor,
          r0.pos[1] + (r1.pos[1] - r0.pos[1]) * factor,
          r0.pos[2] + (r1.pos[2] - r0.pos[2]) * factor,
        ],
        rot: r0.rot,
        speed: r0.speed + (r1.speed - r0.speed) * factor,
        boosting: r0.boosting,
      };
    });
  }

  private saveReplay() {
    try {
      if (this.currentReplay) {
        // Limit keyframes to latest 500 for storage quota
        const trimmed = {
          ...this.currentReplay,
          keyframes: this.currentReplay.keyframes.slice(0, 500),
        };
        localStorage.setItem('void_rider_last_replay', JSON.stringify(trimmed));
      }
    } catch {}
  }

  private loadLastReplay() {
    try {
      const raw = localStorage.getItem('void_rider_last_replay');
      if (raw) {
        this.currentReplay = JSON.parse(raw);
      }
    } catch {}
  }
}

export const replaySystem = new ReplaySystem();
