/**
 * 3D Binaural Spatial Audio Engine with HRTF and Doppler Shift for Void-Rider 3D
 * Positions rival ships, laser beams, missile flybys, and boost gates in true 3D spatial sound.
 */
import * as THREE from 'three';
import { SpatialAudioConfig } from '../types';

export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  public config: SpatialAudioConfig = {
    enabled: true,
    hrtfQuality: 'HIGH',
    dopplerIntensity: 1.0,
    reverbDecay: 1.5,
  };

  private listenerPos = new THREE.Vector3();
  private listenerFwd = new THREE.Vector3();
  private listenerUp = new THREE.Vector3();

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public updateListener(camera: THREE.Camera) {
    if (!this.config.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.ctx.listener) return;

    camera.getWorldPosition(this.listenerPos);
    camera.getWorldDirection(this.listenerFwd);
    this.listenerUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(this.listenerPos.x, this.ctx.currentTime);
      listener.positionY.setValueAtTime(this.listenerPos.y, this.ctx.currentTime);
      listener.positionZ.setValueAtTime(this.listenerPos.z, this.ctx.currentTime);
      listener.forwardX.setValueAtTime(this.listenerFwd.x, this.ctx.currentTime);
      listener.forwardY.setValueAtTime(this.listenerFwd.y, this.ctx.currentTime);
      listener.forwardZ.setValueAtTime(this.listenerFwd.z, this.ctx.currentTime);
      listener.upX.setValueAtTime(this.listenerUp.x, this.ctx.currentTime);
      listener.upY.setValueAtTime(this.listenerUp.y, this.ctx.currentTime);
      listener.upZ.setValueAtTime(this.listenerUp.z, this.ctx.currentTime);
    } else if ((listener as any).setPosition) {
      // Legacy fallback
      (listener as any).setPosition(this.listenerPos.x, this.listenerPos.y, this.listenerPos.z);
      (listener as any).setOrientation(
        this.listenerFwd.x,
        this.listenerFwd.y,
        this.listenerFwd.z,
        this.listenerUp.x,
        this.listenerUp.y,
        this.listenerUp.z
      );
    }
  }

  public playSpatialFlyby(emitterPos: THREE.Vector3, relativeSpeed: number) {
    if (!this.config.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const panner = this.ctx.createPanner();
      panner.panningModel = this.config.hrtfQuality === 'HIGH' ? 'HRTF' : 'equalpower';
      panner.distanceModel = 'exponential';
      panner.refDistance = 15;
      panner.maxDistance = 300;
      panner.rolloffFactor = 1.2;

      panner.positionX.setValueAtTime(emitterPos.x, now);
      panner.positionY.setValueAtTime(emitterPos.y, now);
      panner.positionZ.setValueAtTime(emitterPos.z, now);

      // Doppler oscillator whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const baseFreq = 160 + Math.min(200, relativeSpeed * 0.4);
      // Pitch drop Doppler curve
      osc.frequency.setValueAtTime(baseFreq * 1.35, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch (_) {}
  }
}

export const spatialAudio = new SpatialAudioEngine();
