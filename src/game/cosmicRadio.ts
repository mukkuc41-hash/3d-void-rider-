/**
 * Procedural Cosmic Synth Radio for Void-Rider 3D
 * Generates dynamic, algorithmic sci-fi music streams entirely in Web Audio API.
 * Includes real-time frequency spectrum analysis for in-cockpit HUD visualizers.
 */
import { RadioChannelId, RadioStation, RadioTelemetry } from '../types';

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'CYBERWAVE',
    name: '104.7 FM NEON HORIZON',
    genre: 'Synthwave / Outrun',
    frequency: '104.7 MHz',
    bpm: 126,
    description: 'High-octane analog arpeggios and neon-drenched retro-futuristic synth bass.',
    color: '#00f0ff',
  },
  {
    id: 'VOID_AMBIENT',
    name: '89.3 FM CELESTIAL DEEP',
    genre: 'Deep Space Ambient',
    frequency: '89.3 MHz',
    bpm: 68,
    description: 'Slow-evolving gravitational sub-drones, shimmering crystal pads, and ethereal void echoes.',
    color: '#a855f7',
  },
  {
    id: 'STELLAR_CORE',
    name: '108.2 FM SINGULARITY BASS',
    genre: 'Dark Industrial Techno',
    frequency: '108.2 MHz',
    bpm: 138,
    description: 'Crushing industrial beats, dark acid resonance, and event-horizon tension.',
    color: '#f97316',
  },
  {
    id: 'WARP_DNB',
    name: '115.9 FM HYPER-VELOCITY',
    genre: 'Cosmic Drum & Bass',
    frequency: '115.9 MHz',
    bpm: 174,
    description: 'Ultra-fast syncopated breakbeats, sub-frequency reese growls, and warp-speed drive.',
    color: '#10b981',
  },
];

export class CosmicRadioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;

  private currentChannel: RadioChannelId = 'CYBERWAVE';
  private isPlaying: boolean = false;
  private volume: number = 0.65;
  private isMuted: boolean = false;

  private stepTimer: any = null;
  private currentStep: number = 0;

  // Scales for algorithmic composition
  private scales = {
    cyberwave: [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25, 587.33], // A minor pentatonic / dorian
    ambient: [130.81, 164.81, 196.00, 246.94, 293.66, 392.00, 493.88], // C maj9 / Lydian
    dark: [110, 116.54, 130.81, 146.83, 164.81, 174.61], // A Phrygian
    dnb: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66], // D minor
  };

  constructor() {}

  public init(audioCtx?: AudioContext) {
    if (this.ctx) return;
    try {
      this.ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!this.ctx) return;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch {
      // AudioContext init deferred
    }
  }

  public setChannel(channelId: RadioChannelId) {
    this.currentChannel = channelId;
    if (channelId === 'OFF') {
      this.stop();
    } else {
      if (!this.isPlaying) {
        this.play();
      } else {
        this.restartLoop();
      }
    }
  }

  public nextChannel() {
    const list: RadioChannelId[] = ['CYBERWAVE', 'VOID_AMBIENT', 'STELLAR_CORE', 'WARP_DNB'];
    const idx = list.indexOf(this.currentChannel);
    const nextIdx = (idx + 1) % list.length;
    this.setChannel(list[nextIdx]);
  }

  public prevChannel() {
    const list: RadioChannelId[] = ['CYBERWAVE', 'VOID_AMBIENT', 'STELLAR_CORE', 'WARP_DNB'];
    const idx = list.indexOf(this.currentChannel);
    const prevIdx = (idx - 1 + list.length) % list.length;
    this.setChannel(list[prevIdx]);
  }

  public play() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isPlaying = true;
    this.restartLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(mute?: boolean) {
    this.isMuted = mute !== undefined ? mute : !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  private restartLoop() {
    if (this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    if (!this.isPlaying || this.currentChannel === 'OFF') return;

    const station = RADIO_STATIONS.find((s) => s.id === this.currentChannel) || RADIO_STATIONS[0];
    const msPerStep = (60000 / station.bpm) / 4; // 16th note steps

    this.currentStep = 0;
    this.stepTimer = setInterval(() => {
      this.tickStep();
    }, msPerStep);
  }

  private tickStep() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % 16;
    this.currentStep++;

    try {
      switch (this.currentChannel) {
        case 'CYBERWAVE':
          this.tickCyberwave(step, now);
          break;
        case 'VOID_AMBIENT':
          this.tickAmbient(step, now);
          break;
        case 'STELLAR_CORE':
          this.tickStellar(step, now);
          break;
        case 'WARP_DNB':
          this.tickDnB(step, now);
          break;
      }
    } catch {
      // Audio tick catch
    }
  }

  // CHANNEL 1: CYBERWAVE
  private tickCyberwave(step: number, now: number) {
    if (!this.ctx || !this.masterGain) return;

    // Kick on 0, 4, 8, 12
    if (step % 4 === 0) {
      this.synthKick(now, 130, 45, 0.22, 0.35);
    }

    // Snare / Clap on 4, 12
    if (step === 4 || step === 12) {
      this.synthSnare(now, 0.15, 0.2);
    }

    // 16th note Bassline
    const bassRoot = step < 8 ? 55 : (step < 12 ? 65.41 : 48.99); // A1, C2, G1
    const bassNote = step % 2 === 0 ? bassRoot : bassRoot * 2;
    this.synthBass(now, bassNote, 'sawtooth', 0.12, 0.25, 800);

    // Arp lead on every 16th note
    const scale = this.scales.cyberwave;
    const leadFreq = scale[(step * 3) % scale.length];
    if (step % 2 === 1) {
      this.synthLead(now, leadFreq, 'square', 0.08, 0.12, 1200);
    }
  }

  // CHANNEL 2: VOID AMBIENT
  private tickAmbient(step: number, now: number) {
    if (!this.ctx || !this.masterGain) return;

    // Long pad every 16 steps
    if (step === 0) {
      const chords = [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [110.00, 146.83, 174.61, 220.00], // Dm7
      ];
      const chord = chords[Math.floor(this.currentStep / 16) % chords.length];
      chord.forEach((freq) => {
        this.synthPad(now, freq, 3.2, 0.08);
      });
    }

    // Gentle sub pulse every 8 steps
    if (step % 8 === 0) {
      this.synthSub(now, 55, 1.8, 0.25);
    }

    // Random crystal spark
    if (step % 4 === 2) {
      const crystalFreqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
      const freq = crystalFreqs[Math.floor(Math.random() * crystalFreqs.length)];
      this.synthCrystal(now, freq, 0.45, 0.07);
    }
  }

  // CHANNEL 3: STELLAR CORE (DARK TECHNO)
  private tickStellar(step: number, now: number) {
    if (!this.ctx || !this.masterGain) return;

    // Relentless punchy kick every beat
    if (step % 4 === 0) {
      this.synthKick(now, 160, 38, 0.28, 0.42);
    }

    // Offbeat open hat on 2, 6, 10, 14
    if (step % 4 === 2) {
      this.synthHat(now, 0.09, 0.18);
    }

    // Heavy Acid resonant bassline
    const acidNotes = [55, 55, 110, 55, 58.27, 55, 82.41, 55];
    const freq = acidNotes[step % acidNotes.length];
    this.synthAcidBass(now, freq, 0.16, 0.32);

    // Dark industrial clank on 12
    if (step === 12) {
      this.synthClank(now, 0.2, 0.15);
    }
  }

  // CHANNEL 4: WARP DNB
  private tickDnB(step: number, now: number) {
    if (!this.ctx || !this.masterGain) return;

    // Fast Drum & Bass pattern: Kick on 0, 10; Snare on 4, 12
    if (step === 0 || step === 10) {
      this.synthKick(now, 180, 50, 0.18, 0.4);
    }
    if (step === 4 || step === 12) {
      this.synthSnare(now, 0.16, 0.35);
    }
    // Ghost snares
    if (step === 7 || step === 15) {
      this.synthSnare(now, 0.08, 0.12);
    }

    // Shuffling hi-hats
    this.synthHat(now, 0.04, step % 2 === 0 ? 0.08 : 0.15);

    // Deep modulating reese sub bass
    if (step % 4 === 0) {
      const reeseFreqs = [73.42, 65.41, 87.31, 58.27];
      const f = reeseFreqs[Math.floor(step / 4) % reeseFreqs.length];
      this.synthReese(now, f, 0.35, 0.3);
    }
  }

  // ----------------- SYNTH INSTRUMENTS -----------------
  private synthKick(t: number, startF: number, endF: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(endF, t + dur);

    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthSnare(t: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  private synthHat(t: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(7500, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthBass(t: number, freq: number, type: OscillatorType, dur: number, gainVol: number, cutoff: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthLead(t: number, freq: number, type: OscillatorType, dur: number, gainVol: number, cutoff: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthPad(t: number, freq: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(gainVol, t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthSub(t: number, freq: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthCrystal(t: number, freq: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthAcidBass(t: number, freq: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(8, t);
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthClank(t: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private synthReese(t: number, freq: number, dur: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq - 1.5, t);
    osc2.frequency.setValueAtTime(freq + 1.5, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
  }

  // ----------------- TELEMETRY & VISUALIZER -----------------
  public getTelemetry(): RadioTelemetry {
    const station = RADIO_STATIONS.find((s) => s.id === this.currentChannel) || RADIO_STATIONS[0];

    let waveFrequencies: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    if (this.analyser && this.frequencyData && this.isPlaying && !this.isMuted) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      const binCount = this.frequencyData.length;
      const step = Math.max(1, Math.floor(binCount / 8));
      waveFrequencies = Array.from({ length: 8 }, (_, i) => {
        const val = this.frequencyData![i * step] || 0;
        return Math.min(100, Math.round((val / 255) * 100));
      });
    }

    return {
      activeChannel: this.currentChannel,
      stationName: this.isPlaying ? station.name : 'RADIO STANDBY',
      genre: station.genre,
      frequency: station.frequency,
      isPlaying: this.isPlaying,
      volume: this.volume,
      waveFrequencies,
      color: station.color,
    };
  }
}

export const cosmicRadio = new CosmicRadioEngine();
