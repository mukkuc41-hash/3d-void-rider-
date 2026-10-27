/**
 * Custom Synthwave Synthesizer & 16-Step Audio Sequencer Engine for Void-Rider 3D
 * Generates algorithmic 80s synthwave loops, sub-basslines, neon leads, and percussion
 * using the Web Audio API with custom in-game BGM routing.
 */
import { SynthScaleType, SynthStudioState } from '../types';

const SCALE_FREQUENCIES: Record<SynthScaleType, { bass: number[]; lead: number[]; chord: number[] }> = {
  CYBER_DORIAN: {
    bass: [55, 61.74, 65.41, 73.42, 82.41, 92.5, 98], // D1, E1, F1, G1, A1, B1, C2
    lead: [220, 246.94, 261.63, 293.66, 329.63, 369.99, 392], // D3, E3, F3, G3, A3, B3, C4
    chord: [110, 130.81, 164.81, 196],
  },
  NEON_MINOR: {
    bass: [43.65, 49, 55, 58.27, 65.41, 73.42, 82.41], // F1, G1, A1, Bb1, C2, D2, E2
    lead: [174.61, 196, 220, 233.08, 261.63, 293.66, 329.63],
    chord: [87.31, 110, 130.81, 174.61],
  },
  SYNTH_MAJOR: {
    bass: [65.41, 73.42, 82.41, 87.31, 98, 110, 123.47], // C2, D2, E2, F2, G2, A2, B2
    lead: [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88],
    chord: [130.81, 164.81, 196, 261.63],
  },
  VOID_PHRYGIAN: {
    bass: [41.2, 43.65, 49, 55, 61.74, 65.41, 73.42], // E1, F1, G1, A1, B1, C2, D2
    lead: [164.81, 174.61, 196, 220, 246.94, 261.63, 293.66],
    chord: [82.41, 110, 123.47, 164.81],
  },
};

export class SynthStudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private timerId: any = null;
  public currentStep: number = 0;

  public state: SynthStudioState = {
    bpm: 128,
    scale: 'CYBER_DORIAN',
    bassSteps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false],
    leadSteps: [false, false, true, false, false, false, true, true, false, true, false, false, true, false, false, true],
    percSteps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    chordSteps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    isPlaying: false,
    isCustomBgmActive: false,
  };

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    this.initCtx();
    if (this.isRunning) return;
    this.isRunning = true;
    this.state.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep();
  }

  public stop() {
    this.isRunning = false;
    this.state.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public togglePlay() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  private scheduleNextStep() {
    if (!this.isRunning) return;
    this.triggerStepAudio(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 16;

    // 16th note timing: (60 / bpm) / 4 in milliseconds
    const stepDurationMs = ((60 / this.state.bpm) / 4) * 1000;
    this.timerId = setTimeout(() => this.scheduleNextStep(), stepDurationMs);
  }

  private triggerStepAudio(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = SCALE_FREQUENCIES[this.state.scale];

    // 1. Bass Track (Sawtooth sub)
    if (this.state.bassSteps[step]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const f = freqs.bass[step % freqs.bass.length];
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    // 2. Lead Track (Square Wave Lead)
    if (this.state.leadSteps[step]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const f = freqs.lead[(step * 2) % freqs.lead.length];
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    // 3. Percussion Track (Punchy kick & snare noise)
    if (this.state.percSteps[step]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    // 4. Chord Track (Warm detuned pad)
    if (this.state.chordSteps[step]) {
      [0, 2].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const f = freqs.chord[(step + offset) % freqs.chord.length];
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    }
  }

  public setPreset(name: 'CYBER_DRIVE' | 'NEON_SUNSET' | 'MIDNIGHT_RUN' | 'SINGULARITY') {
    switch (name) {
      case 'CYBER_DRIVE':
        this.state.bpm = 132;
        this.state.scale = 'CYBER_DORIAN';
        this.state.bassSteps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false];
        this.state.leadSteps = [false, false, true, false, false, false, true, true, false, true, false, false, true, false, false, true];
        this.state.percSteps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
        break;
      case 'NEON_SUNSET':
        this.state.bpm = 116;
        this.state.scale = 'NEON_MINOR';
        this.state.bassSteps = [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false];
        this.state.leadSteps = [true, false, false, true, false, false, true, false, false, true, false, false, true, true, false, false];
        this.state.percSteps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
        break;
      case 'MIDNIGHT_RUN':
        this.state.bpm = 144;
        this.state.scale = 'SYNTH_MAJOR';
        this.state.bassSteps = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
        this.state.leadSteps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true];
        this.state.percSteps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
        break;
      case 'SINGULARITY':
        this.state.bpm = 150;
        this.state.scale = 'VOID_PHRYGIAN';
        this.state.bassSteps = [true, false, true, false, true, false, true, false, true, false, true, false, true, true, true, false];
        this.state.leadSteps = [false, true, false, true, false, true, false, true, false, true, false, true, false, true, true, true];
        this.state.percSteps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
        break;
    }
  }

  public toggleCustomBgm() {
    this.state.isCustomBgmActive = !this.state.isCustomBgmActive;
    if (this.state.isCustomBgmActive && !this.isRunning) {
      this.start();
    }
    return this.state.isCustomBgmActive;
  }
}

export const synthStudioEngine = new SynthStudioEngine();
