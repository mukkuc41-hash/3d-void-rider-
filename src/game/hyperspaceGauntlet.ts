/**
 * Endless Hyperspace Gauntlet Mode for Void-Rider 3D
 * Generates an endless, escalating procedural run with daily global seeds and distance milestones.
 */
import { HyperspaceGauntletState } from '../types';

const STORAGE_KEY = 'void_rider_hyperspace_best';

export class HyperspaceGauntletDirector {
  public isActive: boolean = false;
  private currentDistance: number = 0;
  private bestDistance: number = 0;

  constructor() {
    this.loadBest();
  }

  public getDailySeed(): string {
    const today = new Date().toISOString().slice(0, 10);
    return `SEED-${today}`;
  }

  public start() {
    this.isActive = true;
    this.currentDistance = 0;
  }

  public stop(): { finalDistanceMeters: number; isNewRecord: boolean; rewardCredits: number } {
    this.isActive = false;
    const isNewRecord = this.currentDistance > this.bestDistance;
    if (isNewRecord) {
      this.bestDistance = this.currentDistance;
      this.saveBest();
    }
    const rewardCredits = Math.round(this.currentDistance * 0.15);
    return {
      finalDistanceMeters: Math.round(this.currentDistance),
      isNewRecord,
      rewardCredits,
    };
  }

  public update(deltaMeters: number): HyperspaceGauntletState {
    if (this.isActive) {
      this.currentDistance += deltaMeters;
      if (this.currentDistance > this.bestDistance) {
        this.bestDistance = this.currentDistance;
      }
    }

    const speedMultiplier = 1.0 + (this.currentDistance / 10000) * 0.4;
    const hazardMultiplier = 1.0 + (this.currentDistance / 8000) * 0.6;

    const sectors = [
      'SECTOR 01 // NEBULA INGRESS',
      'SECTOR 02 // ASTEROID CRUSHER',
      'SECTOR 03 // TACHYON FREEFALL',
      'SECTOR 04 // EVENT HORIZON APEX',
      'SECTOR 05 // QUANTUM ANOMALY CHASM',
      'SECTOR 06 // OMEGA SINGULARITY DEEP',
    ];

    const sectorIdx = Math.min(
      sectors.length - 1,
      Math.floor(this.currentDistance / 3000)
    );

    return {
      currentDistanceMeters: Math.round(this.currentDistance),
      bestDistanceMeters: Math.round(this.bestDistance),
      speedMultiplier,
      hazardDensityMultiplier: hazardMultiplier,
      currentSectorName: sectors[sectorIdx],
      dailySeed: this.getDailySeed(),
    };
  }

  private saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.bestDistance));
    } catch {}
  }

  private loadBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.bestDistance = Number(raw) || 0;
      }
    } catch {}
  }
}

export const hyperspaceGauntlet = new HyperspaceGauntletDirector();
