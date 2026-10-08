/**
 * Procedural Web Audio API sound generator for Void-Rider 3D.
 * Clean, lightweight, reliable, zero external assets required.
 */
class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: any = null;
  private cinematicMusicBuffer: AudioBuffer | null = null;
  private spaceAmbienceBuffer: AudioBuffer | null = null;
  private launchBuffer: AudioBuffer | null = null;
  private cinematicMusicSource: AudioBufferSourceNode | null = null;
  private spaceAmbienceSource: AudioBufferSourceNode | null = null;
  private cinematicMusicGain: GainNode | null = null;
  private spaceAmbienceGain: GainNode | null = null;
  private cinematicMasterGain: GainNode | null = null;
  private cinematicMusicAudio: HTMLAudioElement | null = null;
  private spaceAmbienceAudio: HTMLAudioElement | null = null;
  private isCinematicAudioActive: boolean = false;
  private isLoadingCinematicBuffers: boolean = false;
  private finalCollapseFiredEvents = new Set<number>();

  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = true;
  public volume: number = 0.7;
  public sfxVolume: number = 0.7;
  public musicVolume: number = 0.5;
  public isMuted: boolean = false;

  public setSFXVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.volume = this.sfxVolume;
    if (this.spaceAmbienceGain && this.ctx) {
      this.spaceAmbienceGain.gain.setValueAtTime(this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0, this.ctx.currentTime);
    }
    if (this.spaceAmbienceAudio) {
      this.spaceAmbienceAudio.volume = this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0;
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.12 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMusicGain && this.ctx) {
      this.cinematicMusicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMusicAudio) {
      this.cinematicMusicAudio.volume = this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0;
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    this.sfxEnabled = !muted;
    this.musicEnabled = !muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.12 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMasterGain && this.ctx) {
      this.cinematicMasterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (this.cinematicMusicAudio) {
      this.cinematicMusicAudio.muted = muted;
    }
    if (this.spaceAmbienceAudio) {
      this.spaceAmbienceAudio.muted = muted;
    }
  }

  public playCountdownTick() {
    this.playCountdown(false);
  }

  public playCountdownGo() {
    this.playCountdown(true);
  }

  public playUpgradePurchase() {
    this.playUpgradeUnlock();
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || this.engineOsc) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.sfxEnabled ? 0.08 * this.volume : 0, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();

      // Boost noise/hum
      this.boostOsc = this.ctx.createOscillator();
      this.boostOsc.type = 'sine';
      this.boostOsc.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.boostGain = this.ctx.createGain();
      this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.boostOsc.connect(this.boostGain);
      this.boostGain.connect(this.ctx.destination);

      this.boostOsc.start();
    } catch (e) {
      console.warn('Audio start engine err:', e);
    }
  }

  public updateEngine(speedNorm: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter || !this.engineGain) return;
    try {
      const now = this.ctx.currentTime;
      const isReverse = speedNorm < 0;
      const absNorm = isNaN(speedNorm) || !isFinite(speedNorm) ? 0 : Math.max(0, Math.min(3, Math.abs(speedNorm)));
      const safeNorm = isReverse ? absNorm * 0.65 : absNorm;
      
      // Pitch scales with normalized speed; reverse uses a lower, deeper tactical resonance
      const targetFreq = isReverse
        ? (55 + safeNorm * 75)
        : (70 + safeNorm * 180 + (isBoosting ? 90 : 0));
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);

      const filterFreq = isReverse
        ? (240 + safeNorm * 300)
        : (300 + safeNorm * 800 + (isBoosting ? 600 : 0));
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

      const targetGain = this.sfxEnabled ? (0.05 + safeNorm * 0.12) * this.volume : 0;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

      if (this.boostGain && this.boostOsc) {
        const boostTarget = (this.sfxEnabled && isBoosting && !isReverse) ? 0.18 * this.volume : 0;
        this.boostGain.gain.setTargetAtTime(boostTarget, now, 0.05);
        if (isBoosting && !isReverse) {
          this.boostOsc.frequency.setTargetAtTime(360 + Math.sin(now * 25) * 40, now, 0.03);
        }
      }
    } catch (_) {}
  }

  public stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch (_) {}
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.boostOsc) {
      try { this.boostOsc.stop(); } catch (_) {}
      this.boostOsc.disconnect();
      this.boostOsc = null;
    }
  }

  public playCountdown(isGo: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    const freq = isGo ? 880 : 440; // A5 for GO, A4 for 3,2,1
    osc.frequency.setValueAtTime(freq, now);

    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
    }

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.65 : 0.3));
  }

  public playCountdownBeep(isFinal: boolean = false) {
    this.playCountdown(isFinal);
  }

  public playMenuClick() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // fallback
    }
  }

  public playRouteSelected() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Futuristic resonant tri-tone ascending sweep (F5 -> A5 -> C6)
      const freqs = [698.46, 880.0, 1046.5];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + idx * 0.035 + 0.12);

        gain.gain.setValueAtTime(0.14 * this.volume, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  public playCheckpoint() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Harmonious dual chime (E5 + B5)
    [659.25, 987.77].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.4);
    });
  }

  public playBoostPad() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playCollision() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playHeavyImpact() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Dual oscillator: low sub-bass thump + metallic crunch
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(25, now + 0.3);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    gain.gain.setValueAtTime(0.42 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  public playShieldImpact() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Resonant futuristic shield chime / deflection buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);

    gain.gain.setValueAtTime(0.32 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playScrapeSparks() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAsteroidHit() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Heavy low punch and resonant metallic ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAlarmAlert() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.setValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playGravityShift(isLowG: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (isLowG) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.4);
    } else {
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.4);
    }

    gain.gain.setValueAtTime(0.24 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playWormholeWarp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Ascending hyperspace resonance chord
    [320, 480, 640, 960, 1280].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + i * 0.05 + 0.4);

      gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.48);
    });
  }

  public playUpgradeUnlock() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  public playFinish() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.85);
    });
  }

  public playWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCreditPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Two-tone high crystal chime
    [1046.5, 1567.98].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.28);
    });
  }

  public playShieldActivate() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.05 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playShieldDeflect() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.2);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playShieldHit() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playMissileLaunch() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Rocket booster ignition whoosh with rising high-pitch hiss
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.55);

    gain.gain.setValueAtTime(0.38 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.48 * this.volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  public playTargetLock() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // High tech double pulse lock-on confirmation
    [0, 0.09].forEach(delay => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, now + delay);
      osc.frequency.setValueAtTime(1480, now + delay + 0.04);

      gain.gain.setValueAtTime(0.22 * this.volume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.075);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    });
  }

  public playMissileExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Concussive impact blast with low sub-bass boom
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(190, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(18, now + 0.6);

    gain.gain.setValueAtTime(0.55 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  }

  public playMissileReloadReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playShieldRechargeReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.22 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playMagnetPulse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.12);
    osc.frequency.linearRampToValueAtTime(440, now + 0.24);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playHyperBoost() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    [150, 300, 600].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 3.5, now + 0.4);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  public playNitroBoost() {
    this.playHyperBoost();
  }

  public playRepairCore() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.38);
    });
  }

  public playEMPPulse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);
    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playTimeWarp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    [300, 200, 150].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + idx * 0.1 + 0.4);
      gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.52);
    });
  }

  public playGravityBurst() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(350, now + 0.2);
    osc.frequency.linearRampToValueAtTime(120, now + 0.4);
    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playDecoySpawn() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  public playExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // 1. Low frequency thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
    oscGain.gain.setValueAtTime(0.45 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.72);

    // 2. Filtered noise burst for explosion shockwave
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.7);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  public playRespawn() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Ascending cyber warp chime
    [261.63, 392.0, 523.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  }

  public playWrongWayAlert() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.setValueAtTime(440, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playDriftMiniTurbo() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.25);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }


  /**
   * Real audio player for the cinematic intro:
   * Plays /audio/cinematic-music.wav and /audio/space-ambience.wav simultaneously.
   * Smoothly fades in on cinematic start, and smoothly fades out on race launch.
   */
  public async preloadCinematicAudio() {
    if (this.isLoadingCinematicBuffers) return;
    this.isLoadingCinematicBuffers = true;

    const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const ab = await resp.arrayBuffer();
        this.initContext();
        if (!this.ctx) return null;
        return await this.ctx.decodeAudioData(ab);
      } catch (err) {
        console.warn(`[Audio] Failed loading ${url}:`, err);
        return null;
      }
    };

    try {
      const [musicBuf, ambBuf, launchBuf] = await Promise.all([
        loadBuffer('/audio/cinematic-music.wav'),
        loadBuffer('/audio/space-ambience.wav'),
        loadBuffer('/audio/launch.wav'),
      ]);
      if (musicBuf) this.cinematicMusicBuffer = musicBuf;
      if (ambBuf) this.spaceAmbienceBuffer = ambBuf;
      if (launchBuf) this.launchBuffer = launchBuf;

      if (this.isCinematicAudioActive) {
        this.playActiveCinematicTracks();
      }
    } catch (_) {
    } finally {
      this.isLoadingCinematicBuffers = false;
    }
  }

  public startCinematicAudio() {
    this.initContext();
    this.isCinematicAudioActive = true;
    if (this.isMuted) return;

    if (!this.cinematicMusicBuffer || !this.spaceAmbienceBuffer || !this.launchBuffer) {
      this.preloadCinematicAudio();
    }

    this.playActiveCinematicTracks();
  }

  private playActiveCinematicTracks() {
    if (!this.isCinematicAudioActive || this.isMuted) return;
    this.initContext();

    try {
      if (this.ctx) {
        const now = this.ctx.currentTime;
        if (!this.cinematicMasterGain) {
          this.cinematicMasterGain = this.ctx.createGain();
          this.cinematicMasterGain.connect(this.ctx.destination);
        }
        this.cinematicMasterGain.gain.cancelScheduledValues(now);
        this.cinematicMasterGain.gain.setValueAtTime(0.001, now);
        this.cinematicMasterGain.gain.linearRampToValueAtTime(1.0, now + 1.2);

        // 1. Real Cinematic Music (/audio/cinematic-music.wav)
        if (this.cinematicMusicBuffer && !this.cinematicMusicSource) {
          this.cinematicMusicSource = this.ctx.createBufferSource();
          this.cinematicMusicSource.buffer = this.cinematicMusicBuffer;
          this.cinematicMusicSource.loop = true;

          this.cinematicMusicGain = this.ctx.createGain();
          const targetMusicVol = this.musicEnabled ? 0.75 * this.musicVolume : 0;
          this.cinematicMusicGain.gain.setValueAtTime(targetMusicVol, now);

          this.cinematicMusicSource.connect(this.cinematicMusicGain);
          this.cinematicMusicGain.connect(this.cinematicMasterGain);
          this.cinematicMusicSource.start(now);
        }

        // 2. Real Space Ambience (/audio/space-ambience.wav)
        if (this.spaceAmbienceBuffer && !this.spaceAmbienceSource) {
          this.spaceAmbienceSource = this.ctx.createBufferSource();
          this.spaceAmbienceSource.buffer = this.spaceAmbienceBuffer;
          this.spaceAmbienceSource.loop = true;

          this.spaceAmbienceGain = this.ctx.createGain();
          const targetAmbVol = this.sfxEnabled ? 0.45 * this.sfxVolume : 0;
          this.spaceAmbienceGain.gain.setValueAtTime(targetAmbVol, now);

          this.spaceAmbienceSource.connect(this.spaceAmbienceGain);
          this.spaceAmbienceGain.connect(this.cinematicMasterGain);
          this.spaceAmbienceSource.start(now);
        }
      }

      // Audio element fallback in case buffer decode is still resolving or context suspended
      if (!this.cinematicMusicBuffer && !this.cinematicMusicAudio) {
        try {
          this.cinematicMusicAudio = new Audio('/audio/cinematic-music.wav');
          this.cinematicMusicAudio.loop = true;
          this.cinematicMusicAudio.volume = this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0;
          this.cinematicMusicAudio.play().catch(() => {});
        } catch (_) {}
      }
      if (!this.spaceAmbienceBuffer && !this.spaceAmbienceAudio) {
        try {
          this.spaceAmbienceAudio = new Audio('/audio/space-ambience.wav');
          this.spaceAmbienceAudio.loop = true;
          this.spaceAmbienceAudio.volume = this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0;
          this.spaceAmbienceAudio.play().catch(() => {});
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[Audio] startCinematicAudio error:', e);
    }
  }

  public stopCinematicAudio(fadeSeconds: number = 0.8) {
    this.isCinematicAudioActive = false;

    // Fade HTML5 audio fallbacks if active
    if (this.cinematicMusicAudio) {
      const el = this.cinematicMusicAudio;
      this.cinematicMusicAudio = null;
      let vol = el.volume;
      const interval = setInterval(() => {
        vol = Math.max(0, vol - 0.1);
        el.volume = vol;
        if (vol <= 0) {
          clearInterval(interval);
          el.pause();
          el.currentTime = 0;
        }
      }, 50);
    }
    if (this.spaceAmbienceAudio) {
      const el = this.spaceAmbienceAudio;
      this.spaceAmbienceAudio = null;
      let vol = el.volume;
      const interval = setInterval(() => {
        vol = Math.max(0, vol - 0.1);
        el.volume = vol;
        if (vol <= 0) {
          clearInterval(interval);
          el.pause();
          el.currentTime = 0;
        }
      }, 50);
    }

    if (!this.ctx || !this.cinematicMasterGain) {
      this.cleanupCinematicAudio();
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const duration = Math.max(0.05, fadeSeconds);
      this.cinematicMasterGain.gain.cancelScheduledValues(now);
      this.cinematicMasterGain.gain.setValueAtTime(Math.max(0.001, this.cinematicMasterGain.gain.value), now);
      this.cinematicMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const mSrc = this.cinematicMusicSource;
      const aSrc = this.spaceAmbienceSource;
      const master = this.cinematicMasterGain;
      this.cinematicMusicSource = null;
      this.spaceAmbienceSource = null;
      this.cinematicMasterGain = null;

      window.setTimeout(() => {
        try { mSrc?.stop(); } catch (_) {}
        try { aSrc?.stop(); } catch (_) {}
        try { master?.disconnect(); } catch (_) {}
      }, duration * 1000 + 80);
    } catch (_) {
      this.cleanupCinematicAudio();
    }
  }

  private cleanupCinematicAudio() {
    try { this.cinematicMusicSource?.stop(); } catch (_) {}
    try { this.spaceAmbienceSource?.stop(); } catch (_) {}
    try { this.cinematicMasterGain?.disconnect(); } catch (_) {}
    this.cinematicMusicSource = null;
    this.spaceAmbienceSource = null;
    this.cinematicMasterGain = null;
  }

  public playLaunchSound() {
    this.initContext();
    if (!this.sfxEnabled || this.isMuted) return;

    if (this.ctx && this.launchBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.launchBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9 * this.sfxVolume, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
        return;
      } catch (_) {}
    }

    try {
      const audio = new Audio('/audio/launch.wav');
      audio.volume = Math.max(0, Math.min(1, 0.9 * this.sfxVolume));
      audio.play().catch(() => {});
    } catch (_) {
      this.playThrusterIgnition();
    }
  }

  public playLaunch() {
    this.playLaunchSound();
  }

  public startCosmicMusic() {
    this.initContext();
    if (!this.ctx || this.musicInterval) return;

    try {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.12 * this.volume : 0, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      // Space Synth Chord sequence (Cm, Ab, Eb, Bb)
      const scale = [
        [130.81, 196.00, 311.13, 392.00], // C3, G3, Eb4, G4
        [103.83, 207.65, 261.63, 329.63], // Ab2, Ab3, C4, E4
        [155.56, 233.08, 311.13, 466.16], // Eb3, Bb3, Eb4, Bb4
        [116.54, 233.08, 293.66, 349.23], // Bb2, Bb3, D4, F4
      ];
      let step = 0;

      this.musicInterval = setInterval(() => {
        if (!this.ctx || !this.musicEnabled || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const chord = scale[Math.floor(step / 4) % scale.length];
        const note = chord[step % chord.length];

        // Bass/lead arp note
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = step % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(note, now);
        
        noteGain.gain.setValueAtTime(0.06 * this.volume, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(noteGain);
        noteGain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.3);

        step++;
      }, 160);
    } catch (e) {
      console.warn('Music error:', e);
    }
  }

  public stopCosmicMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // ================= ASTEROID DESTRUCTION BEAM AUDIO =================
  private beamHumOsc: OscillatorNode | null = null;
  private beamHumGain: GainNode | null = null;
  private beamHumFilter: BiquadFilterNode | null = null;

  public playBeamCharge() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playBeamFire(type: string = 'STANDARD', soundPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (soundPreset === 'HEAVY_PLASMA' || type === 'PLASMA') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.28);
      gain.gain.setValueAtTime(0.26 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    } else if (soundPreset === 'RESONANT_LASER' || type === 'LASER') {
      osc.type = 'triangle';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.22);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (soundPreset === 'VOID_SURGE' || type === 'VOID') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    } else if (soundPreset === 'ARC_DISCHARGE' || type === 'ARC') {
      osc.type = 'square';
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);
      gain.gain.setValueAtTime(0.24 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      // High energy pulse / standard / quantum
      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.24);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public startBeamHum(soundPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    if (this.beamHumOsc) return;

    try {
      this.beamHumOsc = this.ctx.createOscillator();
      this.beamHumFilter = this.ctx.createBiquadFilter();
      this.beamHumGain = this.ctx.createGain();

      this.beamHumOsc.type = soundPreset === 'HEAVY_PLASMA' ? 'sawtooth' : 'triangle';
      const baseFreq = soundPreset === 'RESONANT_LASER' ? 520 : soundPreset === 'VOID_SURGE' ? 110 : 280;
      this.beamHumOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.beamHumFilter.type = 'bandpass';
      this.beamHumFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.beamHumFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.beamHumGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);

      this.beamHumOsc.connect(this.beamHumFilter);
      this.beamHumFilter.connect(this.beamHumGain);
      this.beamHumGain.connect(this.ctx.destination);

      this.beamHumOsc.start();
    } catch (e) {
      // Ignore audio start errors
    }
  }

  public stopBeamHum() {
    if (this.beamHumOsc && this.ctx) {
      try {
        this.beamHumGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.beamHumOsc?.stop();
          this.beamHumOsc?.disconnect();
          this.beamHumOsc = null;
          this.beamHumGain = null;
          this.beamHumFilter = null;
        }, 60);
      } catch (e) {
        this.beamHumOsc = null;
      }
    }
  }

  public playBeamImpact(impactPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (impactPreset === 'CRYSTAL_SHATTER' || impactPreset === 'QUANTUM_FRACTURE') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.18 * this.volume, now);
    } else if (impactPreset === 'PLASMA_EXPLOSION' || impactPreset === 'FIREBALL') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
      gain.gain.setValueAtTime(0.19 * this.volume, now);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playAsteroidHitCrack() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.16 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAsteroidDestroy(size: string = 'MEDIUM') {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Dual layered explosion: Low sub-bass thud + high resonance shatter
    const oscSub = this.ctx.createOscillator();
    const gainSub = this.ctx.createGain();
    oscSub.type = 'sawtooth';

    const baseF = size === 'LARGE' ? 95 : size === 'ARMORED' ? 120 : size === 'ENERGY' ? 240 : 150;
    oscSub.frequency.setValueAtTime(baseF, now);
    oscSub.frequency.exponentialRampToValueAtTime(25, now + 0.45);

    gainSub.gain.setValueAtTime(0.35 * this.volume, now);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    oscSub.connect(gainSub);
    gainSub.connect(this.ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.52);

    // High crystalline/debris crackle
    const oscHigh = this.ctx.createOscillator();
    const gainHigh = this.ctx.createGain();
    oscHigh.type = size === 'ENERGY' ? 'sine' : 'square';
    oscHigh.frequency.setValueAtTime(size === 'ENERGY' ? 980 : 620, now + 0.04);
    oscHigh.frequency.exponentialRampToValueAtTime(80, now + 0.32);

    gainHigh.gain.setValueAtTime(0.24 * this.volume, now + 0.04);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscHigh.connect(gainHigh);
    gainHigh.connect(this.ctx.destination);
    oscHigh.start(now + 0.04);
    oscHigh.stop(now + 0.36);
  }

  public playBeamOverheat() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Sizzling warning alarm tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.setValueAtTime(680, now + 0.1);
    osc.frequency.setValueAtTime(920, now + 0.2);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBeamCooldownReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // High pitch chime indicating recharge ready
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playTargetLocked() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now); // C6
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.14 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playHazardWarning() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playTransmissionBeep() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.setValueAtTime(1960, now + 0.05);

      gain.gain.setValueAtTime(0.09 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (_) {}
  }

  public playCinematicSwoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (_) {}
  }

  public playThrusterIgnition() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (_) {}
  }

  public playGatePowerUp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);

        gain.gain.setValueAtTime(0.08 * this.volume, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.28);
      });
    } catch (_) {}
  }

  // ==========================================
  // MODE 21 — THE FINAL COLLAPSE SOUND FX
  // 40 DISTINCT ESCALATING EVENT AUDIO ALERTS
  // ==========================================

  public resetFinalCollapseAudio(): void {
    this.finalCollapseFiredEvents.clear();
  }

  /**
   * Dedicated audio cue for the Submode 10 Master 100-Event Alert System.
   * Plays unique sound design matching the event's audioCue:
   * 'advisory' | 'warning' | 'danger' | 'critical' | 'emergency' | 'final_warning' | 'collapse'
   */
  public playFinalCollapseMasterAlertAudio(
    cue: 'advisory' | 'warning' | 'danger' | 'critical' | 'emergency' | 'final_warning' | 'collapse' | string,
    _severity?: string
  ): void {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const vol = this.volume;

    try {
      switch (cue) {
        case 'advisory': {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(880, now);
          osc2.frequency.setValueAtTime(1174.66, now + 0.08);
          gain.gain.setValueAtTime(0.18 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.08);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.35);
          break;
        }
        case 'warning': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(680, now);
          osc.frequency.setValueAtTime(860, now + 0.09);
          gain.gain.setValueAtTime(0.22 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'danger': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.linearRampToValueAtTime(780, now + 0.12);
          osc.frequency.linearRampToValueAtTime(520, now + 0.24);
          gain.gain.setValueAtTime(0.28 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.42);
          break;
        }
        case 'critical': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.setValueAtTime(620, now + 0.07);
          osc.frequency.setValueAtTime(1100, now + 0.14);
          gain.gain.setValueAtTime(0.32 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.48);
          break;
        }
        case 'emergency': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, now);
          osc.frequency.setValueAtTime(830.6, now + 0.06);
          osc.frequency.setValueAtTime(1244.5, now + 0.12);
          gain.gain.setValueAtTime(0.26 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }
        case 'final_warning': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.linearRampToValueAtTime(1600, now + 0.15);
          gain.gain.setValueAtTime(0.35 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.52);
          break;
        }
        case 'collapse': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(25, now + 2.5);
          gain.gain.setValueAtTime(0.55 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 3.1);
          break;
        }
        default:
          this.playAlarmAlert();
          break;
      }
    } catch (_) {}
  }

  /**
   * Dedicated, individual audio alert for every one of the 40 Final Collapse events.
   * Escalating audio intensity:
   * Events 01–10: low / ominous
   * Events 11–20: strong gravitational effects
   * Events 21–30: catastrophic
   * Events 31–39: extreme emergency
   * Event 40: near silence -> deep gravitational pulse -> energy buildup -> COSMIC BOOM -> sudden silence
   * Guaranteed to fire exactly once per event.
   */
  public playFinalCollapseEventAudio(eventIndex: number): void {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled || this.isMuted) return;
    if (this.finalCollapseFiredEvents.has(eventIndex)) return;
    this.finalCollapseFiredEvents.add(eventIndex);

    const now = this.ctx.currentTime;
    const vol = this.volume;

    try {
      // ----------------------------------------------------
      // EVENTS 01–10: LOW / OMINOUS
      // ----------------------------------------------------
      if (eventIndex >= 1 && eventIndex <= 10) {
        switch (eventIndex) {
          case 1: { // 01: BLACK HOLE ACTIVATION — Deep ominous activation hum + sub-bass pulse
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(54, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 3.0);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(120, now);
            filter.frequency.exponentialRampToValueAtTime(45, now + 3.0);
            filter.Q.setValueAtTime(5, now);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.42 * vol, now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.3);
            break;
          }
          case 2: { // 02: STELLAR LENSING — Eerie optical shimmering pitch bend into dark low-end
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(340, now);
            osc1.frequency.exponentialRampToValueAtTime(65, now + 2.5);
            osc2.frequency.setValueAtTime(510, now);
            osc2.frequency.exponentialRampToValueAtTime(45, now + 2.5);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.32 * vol, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 2.7);
            osc2.stop(now + 2.7);
            break;
          }
          case 3: { // 03: ORBITAL INSTABILITY — Unstable binaural acoustic beat / oscillating low drone
            const oscA = this.ctx.createOscillator();
            const oscB = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            oscA.type = 'sine';
            oscB.type = 'sine';
            oscA.frequency.setValueAtTime(48, now);
            oscB.frequency.setValueAtTime(52.5, now); // ~4.5 Hz throbbing beat
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.38 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            oscA.connect(gain);
            oscB.connect(gain);
            gain.connect(this.ctx.destination);
            oscA.start(now);
            oscB.start(now);
            oscA.stop(now + 2.9);
            oscB.stop(now + 2.9);
            break;
          }
          case 4: { // 04: ACCRETION DISK FORMATION — Swirling vortex swoosh + luminous undertone
            const bufferSize = Math.floor(this.ctx.sampleRate * 2.2);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.9));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(220, now);
            filter.frequency.exponentialRampToValueAtTime(680, now + 1.2);
            filter.frequency.exponentialRampToValueAtTime(140, now + 2.2);
            filter.Q.setValueAtTime(3.5, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.34 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
            break;
          }
          case 5: { // 05: FRAME DRAGGING — Relativistic drag groaning shear with pitch decline
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(72, now);
            osc.frequency.linearRampToValueAtTime(38, now + 2.6);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, now);
            filter.frequency.linearRampToValueAtTime(90, now + 2.6);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.38 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.9);
            break;
          }
          case 6: { // 06: FIRST GRAVITATIONAL WAVE — Sweeping spatial wave pulse (85Hz down to 22Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(85, now);
            osc.frequency.exponentialRampToValueAtTime(22, now + 2.4);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.44 * vol, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.7);
            break;
          }
          case 7: { // 07: TIDAL STRETCHING — Elastic divergent sine glides (95Hz->50Hz and 180Hz->270Hz)
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            o1.type = 'sine';
            o2.type = 'triangle';
            o1.frequency.setValueAtTime(95, now);
            o1.frequency.exponentialRampToValueAtTime(50, now + 2.5);
            o2.frequency.setValueAtTime(180, now);
            o2.frequency.exponentialRampToValueAtTime(270, now + 2.5);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.38 * vol, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);
            o1.start(now);
            o2.start(now);
            o1.stop(now + 2.8);
            o2.stop(now + 2.8);
            break;
          }
          case 8: { // 08: ASTEROID FRAGMENTATION — Low muffled fracturing crackle + sub-bass body
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(62, now);
            osc.frequency.exponentialRampToValueAtTime(26, now + 1.8);
            gain.gain.setValueAtTime(0.48 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.1);
            break;
          }
          case 9: { // 09: DEBRIS INFALL — 4 descending sub-bass pings accelerating inward
            [0, 0.28, 0.52, 0.72].forEach((offset, idx) => {
              const o = this.ctx!.createOscillator();
              const g = this.ctx!.createGain();
              o.type = 'sine';
              o.frequency.setValueAtTime(92 - idx * 16, now + offset);
              o.frequency.exponentialRampToValueAtTime(32, now + offset + 0.25);
              g.gain.setValueAtTime((0.28 + idx * 0.05) * vol, now + offset);
              g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);
              o.connect(g);
              g.connect(this.ctx!.destination);
              o.start(now + offset);
              o.stop(now + offset + 0.3);
            });
            break;
          }
          case 10: { // 10: TIME DISTORTION — Phased temporal chorus with notch filter sweep over 38Hz
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(38, now);
            filter.type = 'notch';
            filter.frequency.setValueAtTime(140, now);
            filter.frequency.linearRampToValueAtTime(750, now + 1.5);
            filter.frequency.linearRampToValueAtTime(80, now + 3.0);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.42 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.1);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.2);
            break;
          }
        }
        return;
      }

      // ----------------------------------------------------
      // EVENTS 11–20: STRONG GRAVITATIONAL EFFECTS
      // ----------------------------------------------------
      if (eventIndex >= 11 && eventIndex <= 20) {
        switch (eventIndex) {
          case 11: { // 11: MAJOR TIDAL FORCE — Heavy resonant gravitational strike with high Q filter
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(88, now);
            osc.frequency.exponentialRampToValueAtTime(24, now + 2.5);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(240, now);
            filter.frequency.exponentialRampToValueAtTime(45, now + 2.5);
            filter.Q.setValueAtTime(7, now);
            gain.gain.setValueAtTime(0.58 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.8);
            break;
          }
          case 12: { // 12: UNSTABLE ASTEROID — Tumbling hollow metallic/stone reverberant warble
            const osc = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(78, now);
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(5, now);
            lfoGain.gain.setValueAtTime(18, now);
            lfo.connect(osc.frequency);
            gain.gain.setValueAtTime(0.52 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            lfo.start(now);
            osc.start(now);
            lfo.stop(now + 2.6);
            osc.stop(now + 2.6);
            break;
          }
          case 13: { // 13: ASTEROID DEFORMATION — Crushing stress timbre with rising friction saw
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.linearRampToValueAtTime(42, now + 2.2);
            gain.gain.setValueAtTime(0.54 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.5);
            break;
          }
          case 14: { // 14: TIDAL DISRUPTION — Sharp resonant fracture crack into sub-bass vacuum drop
            const oscSnap = this.ctx.createOscillator();
            const gainSnap = this.ctx.createGain();
            oscSnap.type = 'triangle';
            oscSnap.frequency.setValueAtTime(360, now);
            oscSnap.frequency.exponentialRampToValueAtTime(40, now + 0.18);
            gainSnap.gain.setValueAtTime(0.68 * vol, now);
            gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            oscSnap.connect(gainSnap);
            gainSnap.connect(this.ctx.destination);
            oscSnap.start(now);
            oscSnap.stop(now + 0.24);

            const oscDrop = this.ctx.createOscillator();
            const gainDrop = this.ctx.createGain();
            oscDrop.type = 'sine';
            oscDrop.frequency.setValueAtTime(80, now + 0.1);
            oscDrop.frequency.exponentialRampToValueAtTime(18, now + 2.2);
            gainDrop.gain.setValueAtTime(0.58 * vol, now + 0.1);
            gainDrop.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
            oscDrop.connect(gainDrop);
            gainDrop.connect(this.ctx.destination);
            oscDrop.start(now + 0.1);
            oscDrop.stop(now + 2.5);
            break;
          }
          case 15: { // 15: DEBRIS STREAM — Whistling relativistic particle stream + low churning core
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(45, now);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(950, now);
            filter.frequency.linearRampToValueAtTime(1600, now + 1.2);
            filter.frequency.exponentialRampToValueAtTime(250, now + 2.6);
            filter.Q.setValueAtTime(4, now);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.52 * vol, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.8);
            break;
          }
          case 16: { // 16: VIOLENT ACCRETION — Violent plasma flare rising from 90Hz to 380Hz with roar
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(320, now + 1.2);
            osc.frequency.exponentialRampToValueAtTime(60, now + 2.8);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(480, now);
            filter.frequency.linearRampToValueAtTime(1100, now + 1.2);
            filter.frequency.exponentialRampToValueAtTime(120, now + 2.8);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.60 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.1);
            break;
          }
          case 17: { // 17: STATION STRETCHING — High-tension metal ping (540Hz) into groaning 48Hz beam
            const oscPing = this.ctx.createOscillator();
            const gainPing = this.ctx.createGain();
            oscPing.type = 'triangle';
            oscPing.frequency.setValueAtTime(540, now);
            oscPing.frequency.exponentialRampToValueAtTime(180, now + 0.4);
            gainPing.gain.setValueAtTime(0.52 * vol, now);
            gainPing.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            oscPing.connect(gainPing);
            gainPing.connect(this.ctx.destination);
            oscPing.start(now);
            oscPing.stop(now + 0.55);

            const oscGroan = this.ctx.createOscillator();
            const gainGroan = this.ctx.createGain();
            oscGroan.type = 'sawtooth';
            oscGroan.frequency.setValueAtTime(52, now + 0.1);
            oscGroan.frequency.linearRampToValueAtTime(36, now + 2.6);
            gainGroan.gain.setValueAtTime(0.54 * vol, now + 0.1);
            gainGroan.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
            oscGroan.connect(gainGroan);
            gainGroan.connect(this.ctx.destination);
            oscGroan.start(now + 0.1);
            oscGroan.stop(now + 2.8);
            break;
          }
          case 18: { // 18: SPAGHETTIFICATION — Deep spatial shearing phase-sweep with twin square waves
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            o1.type = 'square';
            o2.type = 'square';
            o1.frequency.setValueAtTime(55, now);
            o1.frequency.exponentialRampToValueAtTime(22, now + 2.8);
            o2.frequency.setValueAtTime(58.5, now);
            o2.frequency.exponentialRampToValueAtTime(23, now + 2.8);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.55 * vol, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);
            o1.start(now);
            o2.start(now);
            o1.stop(now + 3.1);
            o2.stop(now + 3.1);
            break;
          }
          case 19: { // 19: ROUTE DEFORMATION — Tectonic rail stress with 18Hz mechanical tremolo
            const osc = this.ctx.createOscillator();
            const tremolo = this.ctx.createOscillator();
            const tremoloGain = this.ctx.createGain();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(68, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 2.5);
            tremolo.type = 'sine';
            tremolo.frequency.setValueAtTime(18, now);
            tremoloGain.gain.setValueAtTime(0.45, now);
            tremolo.connect(gain.gain);
            gain.gain.setValueAtTime(0.52 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            tremolo.start(now);
            osc.start(now);
            tremolo.stop(now + 2.7);
            osc.stop(now + 2.7);
            break;
          }
          case 20: { // 20: STRUCTURAL TEAR — Catastrophic metallic snap with heavy bass dispersion decay
            const oscSnap = this.ctx.createOscillator();
            const gainSnap = this.ctx.createGain();
            oscSnap.type = 'square';
            oscSnap.frequency.setValueAtTime(420, now);
            oscSnap.frequency.exponentialRampToValueAtTime(50, now + 0.25);
            gainSnap.gain.setValueAtTime(0.72 * vol, now);
            gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            oscSnap.connect(gainSnap);
            gainSnap.connect(this.ctx.destination);
            oscSnap.start(now);
            oscSnap.stop(now + 0.32);

            const oscRumble = this.ctx.createOscillator();
            const gainRumble = this.ctx.createGain();
            oscRumble.type = 'sine';
            oscRumble.frequency.setValueAtTime(65, now + 0.05);
            oscRumble.frequency.exponentialRampToValueAtTime(19, now + 2.6);
            gainRumble.gain.setValueAtTime(0.62 * vol, now + 0.05);
            gainRumble.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            oscRumble.connect(gainRumble);
            gainRumble.connect(this.ctx.destination);
            oscRumble.start(now + 0.05);
            oscRumble.stop(now + 2.9);
            break;
          }
        }
        return;
      }

      // ----------------------------------------------------
      // EVENTS 21–30: CATASTROPHIC
      // ----------------------------------------------------
      if (eventIndex >= 21 && eventIndex <= 30) {
        switch (eventIndex) {
          case 21: { // 21: MIDPOINT CATASTROPHE — Massive tidal shockwave: dual sub-bass blast (30Hz/60Hz) + white noise rush
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            o1.type = 'sawtooth';
            o2.type = 'sine';
            o1.frequency.setValueAtTime(60, now);
            o1.frequency.exponentialRampToValueAtTime(20, now + 3.0);
            o2.frequency.setValueAtTime(30, now);
            o2.frequency.exponentialRampToValueAtTime(14, now + 3.0);
            gain.gain.setValueAtTime(0.82 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);
            o1.start(now);
            o2.start(now);
            o1.stop(now + 3.3);
            o2.stop(now + 3.3);
            break;
          }
          case 22: { // 22: PLANETARY FRAGMENT — Encroaching rolling seismic thunder with sub-bass impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(70, now);
            osc.frequency.exponentialRampToValueAtTime(18, now + 3.2);
            gain.gain.setValueAtTime(0.78 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.5);
            break;
          }
          case 23: { // 23: PLANETARY DEFORMATION — Grinding tectonic shearing over 36Hz core
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(42, now);
            osc.frequency.linearRampToValueAtTime(24, now + 2.8);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(180, now);
            filter.frequency.linearRampToValueAtTime(420, now + 1.2);
            filter.frequency.exponentialRampToValueAtTime(80, now + 2.8);
            filter.Q.setValueAtTime(5, now);
            gain.gain.setValueAtTime(0.74 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.1);
            break;
          }
          case 24: { // 24: PLANETARY FRAGMENTATION — Colossal celestial breakup detonation
            this.playPlanetaryCollision();
            break;
          }
          case 25: { // 25: DEBRIS WRAP — High-velocity Doppler scream (920Hz down to 95Hz)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(920, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 1.2);
            gain.gain.setValueAtTime(0.70 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.7);
            break;
          }
          case 26: { // 26: EXTREME LENSING — Piercing 1600Hz overtone sucked violently down to 32Hz
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1600, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 2.4);
            gain.gain.setValueAtTime(0.72 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.7);
            break;
          }
          case 27: { // 27: ROUTE BENDING — Twisting steel harmonics bending violently downward
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            o1.type = 'sawtooth';
            o2.type = 'sawtooth';
            o1.frequency.setValueAtTime(460, now);
            o1.frequency.exponentialRampToValueAtTime(75, now + 2.2);
            o2.frequency.setValueAtTime(230, now);
            o2.frequency.exponentialRampToValueAtTime(38, now + 2.2);
            gain.gain.setValueAtTime(0.74 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);
            o1.start(now);
            o2.start(now);
            o1.stop(now + 2.6);
            o2.stop(now + 2.6);
            break;
          }
          case 28: { // 28: EXPANDING SPAGHETTIFICATION — Widening vortex vacuum roar
            this.playDarkGravitationalShockwave();
            break;
          }
          case 29: { // 29: STRUCTURAL FRACTURE — Triple fracture snaps into deep catastrophic groan
            [0, 0.12, 0.26].forEach((offset) => {
              const o = this.ctx!.createOscillator();
              const g = this.ctx!.createGain();
              o.type = 'square';
              o.frequency.setValueAtTime(320, now + offset);
              o.frequency.exponentialRampToValueAtTime(45, now + offset + 0.18);
              g.gain.setValueAtTime(0.68 * vol, now + offset);
              g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
              o.connect(g);
              g.connect(this.ctx!.destination);
              o.start(now + offset);
              o.stop(now + offset + 0.24);
            });
            this.playStructureCreak();
            break;
          }
          case 30: { // 30: MASSIVE DEBRIS COLLISION — Hyper-velocity explosive slam
            this.playPlanetaryCollision();
            break;
          }
        }
        return;
      }

      // ----------------------------------------------------
      // EVENTS 31–39: EXTREME EMERGENCY
      // ----------------------------------------------------
      if (eventIndex >= 31 && eventIndex <= 39) {
        switch (eventIndex) {
          case 31: { // 31: CRITICAL TIDAL PHASE — Urgent alternating emergency klaxon over deep rumble
            this.playEmergencyAlarm();
            this.playGravitationalRumble(2.5);
            break;
          }
          case 32: { // 32: MAXIMUM ACCRETION — Furious screaming accretion roar with high-frequency radiation
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.linearRampToValueAtTime(840, now + 1.0);
            osc.frequency.exponentialRampToValueAtTime(80, now + 2.8);
            gain.gain.setValueAtTime(0.78 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 3.1);
            this.playGravitationalRumble(3.0);
            break;
          }
          case 33: { // 33: ROUTE SEGMENTS DISAPPEAR — Rapid reverse vacuum gulp into abyssal echo
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);
            gain.gain.setValueAtTime(0.82 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.6);
            break;
          }
          case 34: { // 34: PLAYER-SCALE TIDAL DEFORMATION — Intense cockpit gravitational shudder & hull stress
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            o1.type = 'sawtooth';
            o2.type = 'triangle';
            o1.frequency.setValueAtTime(95, now);
            o1.frequency.exponentialRampToValueAtTime(28, now + 2.5);
            o2.frequency.setValueAtTime(102, now);
            o2.frequency.exponentialRampToValueAtTime(29, now + 2.5);
            gain.gain.setValueAtTime(0.85 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);
            o1.start(now);
            o2.start(now);
            o1.stop(now + 2.9);
            o2.stop(now + 2.9);
            break;
          }
          case 35: { // 35: EVENT HORIZON WARNING — Piercing 3-tone tactical proximity warning + sirens
            [0, 0.12, 0.24].forEach((offset) => {
              const o = this.ctx!.createOscillator();
              const g = this.ctx!.createGain();
              o.type = 'triangle';
              o.frequency.setValueAtTime(1260, now + offset);
              g.gain.setValueAtTime(0.82 * vol, now + offset);
              g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
              o.connect(g);
              g.connect(this.ctx!.destination);
              o.start(now + offset);
              o.stop(now + offset + 0.1);
            });
            this.playEmergencyAlarm();
            break;
          }
          case 36: { // 36: FINAL GRAVITATIONAL COLLAPSE — Accelerated collapse sirens & heavy shockwave
            this.playEmergencyAlarm();
            this.playDarkGravitationalShockwave();
            break;
          }
          case 37: { // 37: EXTREME SPAGHETTIFICATION — Violent spacetime tear sweep
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(24, now + 2.6);
            gain.gain.setValueAtTime(0.86 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.9);
            break;
          }
          case 38: { // 38: ACCELERATING INFALL — Relativistic Doppler cascade inward
            [0, 0.15, 0.3, 0.45].forEach((offset, idx) => {
              const o = this.ctx!.createOscillator();
              const g = this.ctx!.createGain();
              o.type = 'triangle';
              o.frequency.setValueAtTime(600 - idx * 90, now + offset);
              o.frequency.exponentialRampToValueAtTime(35, now + offset + 0.4);
              g.gain.setValueAtTime(0.78 * vol, now + offset);
              g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.45);
              o.connect(g);
              g.connect(this.ctx!.destination);
              o.start(now + offset);
              o.stop(now + offset + 0.5);
            });
            break;
          }
          case 39: { // 39: FINAL TIDAL DISRUPTION — Full emergency alarm cluster
            this.playEmergencyAlarm();
            this.playDeepCosmicBoom();
            break;
          }
          case 40: { // 40: DEEP HORIZON CONVERGENCE
            this.playDarkGravitationalShockwave();
            this.playGravitationalWavePulse();
            break;
          }
        }
        return;
      }

      // ----------------------------------------------------
      // EVENTS 41–99: NEW EXPANDED COSMIC CATASTROPHE EVENTS
      // ----------------------------------------------------
      if (eventIndex >= 41 && eventIndex < 100) {
        if (eventIndex >= 41 && eventIndex <= 44) {
          // Neutron star / Pulsar / Magnetar flare
          this.playGravitationalWavePulse();
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(850, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 1.2);
          gain.gain.setValueAtTime(0.6 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.35);
        } else if (eventIndex >= 45 && eventIndex <= 50) {
          // Kilonova merger collision & relativistic GRB jet
          this.playFlashbangBoom();
          this.playDeepCosmicBoom();
        } else if (eventIndex >= 51 && eventIndex <= 65) {
          // Planetary collisions, gas giant stripping, fractured mantle
          this.playCollision();
          this.playStructureCreak();
          this.playDarkGravitationalShockwave();
        } else if (eventIndex >= 66 && eventIndex <= 80) {
          // Supernovae, relativistic plasma jets, Dyson collapse, cosmic string
          this.playDeepCosmicBoom();
          this.playGravitationalWavePulse();
        } else if (eventIndex >= 81 && eventIndex <= 90) {
          // Spaghettified moon swarm, ergosphere shear, Hawking radiation
          this.playDarkGravitationalShockwave();
          this.playEmergencyAlarm();
        } else {
          // 91–99: Final rapid convergence sirens & deep pulses
          this.playEmergencyAlarm();
          this.playDeepCosmicBoom();
          this.playDarkGravitationalShockwave();
        }
        return;
      }

      // ----------------------------------------------------
      // EVENT 100: ABSOLUTE DESTRUCTION / FINAL COLLAPSE
      // near silence
      // → deep gravitational pulse
      // → energy buildup
      // → COSMIC BOOM
      // → sudden silence
      // ----------------------------------------------------
      if (eventIndex >= 100) {
        this.playEvent40CosmicClimax();
      }
    } catch (_) {}
  }

  /**
   * Event 40 canonical audio sequence:
   * near silence
   * → deep gravitational pulse
   * → energy buildup
   * → COSMIC BOOM
   * → sudden silence
   */
  public playEvent40CosmicClimax(): void {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const vol = this.volume;

      // 1. NEAR SILENCE (0.0s – 0.9s):
      // Duck all background audio or prior reverberation to near zero.
      if (this.cinematicMasterGain) {
        this.cinematicMasterGain.gain.setValueAtTime(0.05 * vol, now);
        this.cinematicMasterGain.gain.setValueAtTime(1.0 * vol, now + 6.8);
      }
      if (this.spaceAmbienceGain) {
        this.spaceAmbienceGain.gain.setValueAtTime(0.02 * vol, now);
        this.spaceAmbienceGain.gain.setValueAtTime(0.45 * vol, now + 6.8);
      }

      // 2. DEEP GRAVITATIONAL PULSE (0.9s – 2.4s):
      // Sub-bass 18Hz pulse slowly swelling from the void
      const oscPulse = this.ctx.createOscillator();
      const gainPulse = this.ctx.createGain();
      oscPulse.type = 'sine';
      oscPulse.frequency.setValueAtTime(18, now + 0.9);
      oscPulse.frequency.linearRampToValueAtTime(26, now + 2.4);

      gainPulse.gain.setValueAtTime(0.001, now + 0.9);
      gainPulse.gain.linearRampToValueAtTime(0.75 * vol, now + 2.1);
      gainPulse.gain.setValueAtTime(0.001, now + 2.4);

      oscPulse.connect(gainPulse);
      gainPulse.connect(this.ctx.destination);
      oscPulse.start(now + 0.9);
      oscPulse.stop(now + 2.45);

      // 3. ENERGY BUILDUP (2.4s – 4.5s):
      // Harmonic pitch & rising noise filter: white -> orange -> red buildup
      const oscBuildup = this.ctx.createOscillator();
      const gainBuildup = this.ctx.createGain();
      const filterBuildup = this.ctx.createBiquadFilter();

      oscBuildup.type = 'sawtooth';
      oscBuildup.frequency.setValueAtTime(55, now + 2.4);
      oscBuildup.frequency.exponentialRampToValueAtTime(1400, now + 4.5);

      filterBuildup.type = 'lowpass';
      filterBuildup.frequency.setValueAtTime(120, now + 2.4);
      filterBuildup.frequency.exponentialRampToValueAtTime(3200, now + 4.5);
      filterBuildup.Q.setValueAtTime(8, now + 2.4);

      gainBuildup.gain.setValueAtTime(0.01, now + 2.4);
      gainBuildup.gain.exponentialRampToValueAtTime(0.85 * vol, now + 4.4);
      gainBuildup.gain.setValueAtTime(0.001, now + 4.5); // cut before boom

      oscBuildup.connect(filterBuildup);
      filterBuildup.connect(gainBuildup);
      gainBuildup.connect(this.ctx.destination);
      oscBuildup.start(now + 2.4);
      oscBuildup.stop(now + 4.52);

      // 4. COSMIC BOOM (4.5s – 6.6s):
      // Tremendous sub-bass detonation (35Hz downward) + white noise plasma blast
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(45, now + 4.5);
      oscBoom.frequency.exponentialRampToValueAtTime(12, now + 6.5);

      gainBoom.gain.setValueAtTime(1.0 * vol, now + 4.5);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 6.6);

      oscBoom.connect(gainBoom);
      gainBoom.connect(this.ctx.destination);
      oscBoom.start(now + 4.5);
      oscBoom.stop(now + 6.65);

      // White noise explosion blast
      const bufferSize = Math.floor(this.ctx.sampleRate * 2.1);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85 * vol, now + 4.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 6.5);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now + 4.5);

      // 5. SUDDEN SILENCE (at 6.6s):
      // Instant clamp to zero
      const silenceClamp = this.ctx.createGain();
      silenceClamp.gain.setValueAtTime(0.0, now + 6.65);
    } catch (_) {}
  }

  /** Deep gravitational rumbling representing the singularity destabilization */
  public playGravitationalRumble(duration = 3.5) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Sub-bass oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(42, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.linearRampToValueAtTime(140, now + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(50, now + duration);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45 * this.volume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (_) {}
  }

  /** Shrill pulsing emergency evacuation klaxon siren */
  public playEmergencyAlarm() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Dual-tone alternating siren
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(960, now + 0.12);
      osc.frequency.setValueAtTime(720, now + 0.13);
      osc.frequency.setValueAtTime(720, now + 0.25);
      osc.frequency.setValueAtTime(960, now + 0.26);
      osc.frequency.setValueAtTime(960, now + 0.38);
      osc.frequency.setValueAtTime(720, now + 0.39);
      osc.frequency.setValueAtTime(720, now + 0.5);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.58);
    } catch (_) {}
  }

  /** Thunderous cosmic explosion of two distant planets colliding */
  public playPlanetaryCollision() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy sub-bass detonation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 2.8);

      gain.gain.setValueAtTime(0.6 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.1);

      // Noise shockwave burst
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(320, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(60, now + 1.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  /** Heavy hydraulic servo release when evacuation blast doors open */
  public playBlastDoorOpen() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical hydraulic hiss & tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch (_) {}
  }

  /** Massive metallic slam and hydraulic lock when blast doors seal */
  public playBlastDoorClose() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy metal clank
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      gain1.gain.setValueAtTime(0.55 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.42);

      // Deep locking bolt thud
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(65, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(20, now + 0.55);

      gain2.gain.setValueAtTime(0.5 * this.volume, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.62);
    } catch (_) {}
  }

  /** Tremendous crescendo implosion and cosmic shockwave */
  public playFinalCosmicCollapse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      // Inward pitch drop, then high energy release
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      osc.frequency.linearRampToValueAtTime(240, now + 1.5);
      osc.frequency.exponentialRampToValueAtTime(20, now + 4.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(1200, now + 1.5);
      filter.frequency.exponentialRampToValueAtTime(60, now + 4.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.6 * this.volume, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    } catch (_) {}
  }

  /**
   * Resonant gravitational wave pulse:
   * Low-frequency sweeping pressure wave with cosmic phase whoosh.
   */
  public playGravitationalWavePulse(intensity = 1.0) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const p = Math.max(0.2, Math.min(2.0, intensity));

      // Sub-bass sweep
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(58, now);
      oscSub.frequency.exponentialRampToValueAtTime(24, now + 2.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(45, now + 2.2);

      gainSub.gain.setValueAtTime(0.01, now);
      gainSub.gain.linearRampToValueAtTime(0.45 * this.volume * p, now + 0.3);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      oscSub.connect(filter);
      filter.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + 2.5);

      // Atmospheric spatial phase dispersion noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(280, now);
      bandpass.frequency.exponentialRampToValueAtTime(75, now + 1.8);
      bandpass.Q.setValueAtTime(3.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.3 * this.volume * p, now + 0.25);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  /**
   * Deep infrasound event-horizon hum:
   * Dynamic sub-bass modulation reflecting proximity to the Schwarzschild boundary.
   */
  public playInfrasoundHorizonHum(intensity: number, distanceRatio: number) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const distWeight = Math.max(0, Math.min(1, 1.0 - (distanceRatio - 1.0) / 2.5));
      const totalWeight = Math.min(1.0, (intensity * 0.5 + distWeight * 0.7));
      if (totalWeight < 0.1) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Deep infrasound frequency: 22Hz to 36Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(26 + Math.sin(now * 1.8) * 6, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(65 + totalWeight * 45, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28 * this.volume * totalWeight, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.7);
    } catch (_) {}
  }

  /**
   * Relativistic time-dilation acoustic warp:
   * Downward gravitational frequency shift with time-space dragging effect.
   */
  public playRelativisticTimeDilationWarp(duration = 2.5) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + duration);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (_) {}
  }

  /** White flashbang explosion with massive boom and high-frequency ringing */
  public playFlashbangBoom() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Massive low-end boom detonation
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(110, now);
      oscBoom.frequency.exponentialRampToValueAtTime(18, now + 1.8);

      gainBoom.gain.setValueAtTime(0.85 * this.volume, now);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      oscBoom.connect(gainBoom);
      gainBoom.connect(this.ctx.destination);
      oscBoom.start(now);
      oscBoom.stop(now + 2.3);

      // 2. White noise blast
      const bufferSize = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Tinnitus / ringing after-effect
      const oscRing = this.ctx.createOscillator();
      const gainRing = this.ctx.createGain();
      oscRing.type = 'sine';
      oscRing.frequency.setValueAtTime(3200, now + 0.05);

      gainRing.gain.setValueAtTime(0.18 * this.volume, now + 0.05);
      gainRing.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      oscRing.connect(gainRing);
      gainRing.connect(this.ctx.destination);
      oscRing.start(now + 0.05);
      oscRing.stop(now + 2.6);
    } catch (_) {}
  }

  /** Mechanical clamp lock sound with heavy metallic latch and hydraulic pressure release */
  public playClampLock(clampIndex: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy metallic clank
      const oscClank = this.ctx.createOscillator();
      const gainClank = this.ctx.createGain();
      oscClank.type = 'triangle';
      const baseFreq = 160 + clampIndex * 24;
      oscClank.frequency.setValueAtTime(baseFreq, now);
      oscClank.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gainClank.gain.setValueAtTime(0.75 * this.volume, now);
      gainClank.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      oscClank.connect(gainClank);
      gainClank.connect(this.ctx.destination);
      oscClank.start(now);
      oscClank.stop(now + 0.24);

      // Hydraulic hiss
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  /** Tech parking bay lock confirmation chime */
  public playParkingConfirmed() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.35 * this.volume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.48);
      });
    } catch (_) {}
  }

  /** Secondary pressure door sealing sound */
  public playHydraulicPressureDoor() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(42, now + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.5 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (_) {}
  }

  /** Power connection and charging cable latch */
  public playChargingConnect() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.35);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (_) {}
  }

  /** Section 40: Sub-bass gravitational implosion: vacuum-like inward pitch and pressure drop */
  public playSubBassGravitationalImplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      // Inward pitch suck down into deep subsonic range
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(14, now + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(35, now + 1.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.9 * this.volume, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.75);
    } catch (_) {}
  }

  /** Section 35 & 40: Massive deep-space cosmic BOOM with sub-bass detonation (NO high-frequency white blast) */
  public playDeepCosmicBoom() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Colossal low-end sub-bass impact (35Hz downward to 12Hz)
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(42, now);
      oscSub.frequency.exponentialRampToValueAtTime(12, now + 2.5);

      gainSub.gain.setValueAtTime(1.0 * this.volume, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + 3.3);

      // Deep rumble body
      const oscBody = this.ctx.createOscillator();
      const gainBody = this.ctx.createGain();
      const filterBody = this.ctx.createBiquadFilter();

      oscBody.type = 'triangle';
      oscBody.frequency.setValueAtTime(65, now);
      oscBody.frequency.exponentialRampToValueAtTime(18, now + 2.0);

      filterBody.type = 'lowpass';
      filterBody.frequency.setValueAtTime(140, now);
      filterBody.frequency.exponentialRampToValueAtTime(30, now + 2.0);

      gainBody.gain.setValueAtTime(0.8 * this.volume, now);
      gainBody.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      oscBody.connect(filterBody);
      filterBody.connect(gainBody);
      gainBody.connect(this.ctx.destination);
      oscBody.start(now);
      oscBody.stop(now + 2.9);
    } catch (_) {}
  }

  /** Section 35 & 40: Dark gravitational shockwave: deep phase-shifted bass sweeping across space */
  public playDarkGravitationalShockwave() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(32, now);
      osc1.frequency.linearRampToValueAtTime(18, now + 3.5);
      osc2.frequency.setValueAtTime(33.5, now); // Detuned for pulsing phase-beat
      osc2.frequency.linearRampToValueAtTime(17.5, now + 3.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.linearRampToValueAtTime(160, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(25, now + 3.8);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.7 * this.volume, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 4.1);
      osc2.stop(now + 4.1);
    } catch (_) {}
  }

  /** Section 40: Stabilized interior hum and calm life support hiss */
  public playShelterInteriorHum() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 6.0);
    } catch (_) {}
  }

  /** Deep metal structure groaning and creaking sound for collapsing megastructures */
  public playStructureCreak() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.linearRampToValueAtTime(480, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.3);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    } catch (_) {}
  }

  /** Quantum Countdown Clock Tick */
  public playQuantumCountdownTick(isCritical: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'triangle';
      const freq = isCritical ? 987.77 : 587.33; // B5 for critical, D5 for normal
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.04);

      gain.gain.setValueAtTime((isCritical ? 0.22 : 0.08) * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isCritical ? 0.09 : 0.045));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  }

  /** Quantum Countdown Emergency Urgent Alarm (Pulsing double chime) */
  public playCountdownUrgentAlarm() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      [0, 0.12].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 0 ? 880 : 1174.66, now + offset); // A5 -> D6
        gain.gain.setValueAtTime(0.18 * this.volume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch (_) {}
  }

  /** Quantum Acceleration Boost Gate Transit */
  public playQuantumGateBoost() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

      gain.gain.setValueAtTime(0.24 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (_) {}
  }

  /** Quantum Relic Core Collected */
  public playQuantumRelicCollected() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      [0, 0.08, 0.16, 0.24].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

        osc.type = 'sine';
        osc.frequency.setValueAtTime(tones[idx], now + offset);
        gain.gain.setValueAtTime(0.2 * this.volume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch (_) {}
  }

  /** Environment Biome Shift Ambient Whoosh */
  public playEnvironmentShiftWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.8);
      filter.Q.setValueAtTime(4.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.82);
    } catch (_) {}
  }

  /** Orbital Launcher Magnetic Lock Clamping Sound */
  public playMagneticLock() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy sub-bass lock impulse
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(140, now);
      oscSub.frequency.exponentialRampToValueAtTime(35, now + 0.28);
      gainSub.gain.setValueAtTime(0.35 * this.volume, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + 0.35);

      // Resonant electromagnetic clamping hiss
      const oscHum = this.ctx.createOscillator();
      const gainHum = this.ctx.createGain();
      oscHum.type = 'sawtooth';
      oscHum.frequency.setValueAtTime(420, now + 0.05);
      oscHum.frequency.exponentialRampToValueAtTime(210, now + 0.4);
      gainHum.gain.setValueAtTime(0.18 * this.volume, now + 0.05);
      gainHum.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      oscHum.connect(gainHum);
      gainHum.connect(this.ctx.destination);
      oscHum.start(now + 0.05);
      oscHum.stop(now + 0.48);
    } catch (_) {}
  }

  /** Orbital Launcher Kinetic Acceleration Ring Pass (rings 1, 2, 3) */
  public playAccelerationRingPass(ringIndex: number = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 300 + ringIndex * 180; // 480Hz, 660Hz, 840Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.22);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (_) {}
  }

  /** Escape Gate Reached trigger sound */
  public playEscapeGateReached() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // High-resonance energy ping
      const oscHigh = this.ctx.createOscillator();
      const gainHigh = this.ctx.createGain();
      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(880, now);
      oscHigh.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gainHigh.gain.setValueAtTime(0.35 * this.volume, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      oscHigh.connect(gainHigh);
      gainHigh.connect(this.ctx.destination);
      oscHigh.start(now);
      oscHigh.stop(now + 0.48);

      // Deep portal expansion boom
      const oscLow = this.ctx.createOscillator();
      const gainLow = this.ctx.createGain();
      oscLow.type = 'triangle';
      oscLow.frequency.setValueAtTime(160, now);
      oscLow.frequency.exponentialRampToValueAtTime(45, now + 0.5);
      gainLow.gain.setValueAtTime(0.4 * this.volume, now);
      gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      oscLow.connect(gainLow);
      gainLow.connect(this.ctx.destination);
      oscLow.start(now);
      oscLow.stop(now + 0.65);
    } catch (_) {}
  }

  /** Route 02: Emergency Corridor Structural Collapse Rumble */
  public playStructuralCollapseRumble() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.linearRampToValueAtTime(32, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 0.6);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (_) {}
  }

  /** Route 02: Gravity Shear Alert Tone */
  public playGravityShearAlert() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.12);
      osc.frequency.linearRampToValueAtTime(420, now + 0.25);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch (_) {}
  }

  /** Route 03: Wormhole Energy Ring Pulse */
  public playWormholeRingPulse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);
      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (_) {}
  }

  /** Route 03: Wormhole Gate Stabilization */
  public playWormholeGateStabilization() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 660].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.8);
        gain.gain.setValueAtTime(0.01, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + idx * 0.08 + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + 0.95);
      });
    } catch (_) {}
  }

  /** Route 03: Wormhole Transit Whoosh */
  public playWormholeTransitWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.7);
      osc.frequency.exponentialRampToValueAtTime(80, now + 1.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.7);
      filter.frequency.exponentialRampToValueAtTime(150, now + 1.6);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.75);
    } catch (_) {}
  }

  /** Route 01: Orbital Launch Countdown Beep */
  public playOrbitalLaunchCountdown(count: number) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = count === 0 ? 1200 : 700;
      osc.type = count === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (count === 0) {
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
      }
      gain.gain.setValueAtTime((count === 0 ? 0.35 : 0.25) * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (count === 0 ? 0.5 : 0.18));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (count === 0 ? 0.55 : 0.2));
    } catch (_) {}
  }

  /** Route 01: Station Sanctuary Ship Secured Chime */
  public playStationSecureChime() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.85);
      });
    } catch (_) {}
  }
}

export const sound = new SoundSystem();
export const soundSystem = sound;
if (typeof window !== 'undefined') {
  sound.preloadCinematicAudio().catch(() => {});
}
