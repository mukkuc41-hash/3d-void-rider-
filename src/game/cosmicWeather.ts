/**
 * Dynamic Cosmic Weather & Hazard Anomalies System for Void-Rider 3D
 * Generates evolving space environmental conditions (Solar Superflare, Supernova Wave,
 * Chrono Distortion, Ion Lightning) with particle effects, physics modifiers, and HUD telemetry.
 */
import * as THREE from 'three';
import { CosmicWeatherTelemetry, CosmicWeatherType } from '../types';
import { sound } from './audio';

export class CosmicWeatherDirector {
  private scene: THREE.Scene | null = null;
  private weatherGroup: THREE.Group | null = null;

  public currentWeather: CosmicWeatherType = 'CLEAR_COSMIC';
  private weatherDuration: number = 30.0;
  private weatherTimer: number = 25.0;

  // Visual meshes
  private solarFlareMesh: THREE.Mesh | null = null;
  private shockwaveMesh: THREE.Mesh | null = null;
  private lightningLines: THREE.Line[] = [];
  private ionParticles: THREE.Points | null = null;

  constructor() {}

  public init(scene: THREE.Scene) {
    this.scene = scene;
    this.weatherGroup = new THREE.Group();
    this.scene.add(this.weatherGroup);
    this.createWeatherVisuals();
  }

  private createWeatherVisuals() {
    if (!this.weatherGroup) return;

    // Solar Superflare blinding plane
    const flareGeo = new THREE.PlaneGeometry(1200, 1200);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.solarFlareMesh = new THREE.Mesh(flareGeo, flareMat);
    this.solarFlareMesh.visible = false;
    this.weatherGroup.add(this.solarFlareMesh);

    // Supernova Wave ring
    const waveGeo = new THREE.RingGeometry(10, 400, 48);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.shockwaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.shockwaveMesh.rotation.x = Math.PI / 2;
    this.shockwaveMesh.visible = false;
    this.weatherGroup.add(this.shockwaveMesh);

    // Ion Lightning particles
    const ionGeo = new THREE.BufferGeometry();
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 1] = Math.random() * 200 - 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }
    ionGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ionMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 3.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.ionParticles = new THREE.Points(ionGeo, ionMat);
    this.ionParticles.visible = false;
    this.weatherGroup.add(this.ionParticles);
  }

  public update(delta: number, playerPos: THREE.Vector3): CosmicWeatherTelemetry {
    this.weatherTimer -= delta;

    if (this.weatherTimer <= 0) {
      this.cycleNextWeather();
    }

    // Animate active weather visuals
    if (this.currentWeather === 'SOLAR_SUPERFLARE') {
      if (this.solarFlareMesh && this.weatherGroup) {
        this.solarFlareMesh.visible = true;
        this.solarFlareMesh.position.copy(playerPos);
        this.solarFlareMesh.position.z -= 150;
        const pulse = 0.15 + Math.sin(Date.now() * 0.005) * 0.08;
        (this.solarFlareMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      }
    } else if (this.currentWeather === 'SUPERNOVA_WAVE') {
      if (this.shockwaveMesh) {
        this.shockwaveMesh.visible = true;
        this.shockwaveMesh.position.copy(playerPos);
        const progress = 1 - this.weatherTimer / this.weatherDuration;
        const scale = 1 + progress * 2.5;
        this.shockwaveMesh.scale.set(scale, scale, 1);
        (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.4 * (1 - progress));
      }
    } else if (this.currentWeather === 'ION_LIGHTNING_STORM') {
      if (this.ionParticles) {
        this.ionParticles.visible = true;
        (this.ionParticles.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
      }
    } else {
      if (this.solarFlareMesh) this.solarFlareMesh.visible = false;
      if (this.shockwaveMesh) this.shockwaveMesh.visible = false;
      if (this.ionParticles) this.ionParticles.visible = false;
    }

    return this.getTelemetry();
  }

  private cycleNextWeather() {
    const sequence: CosmicWeatherType[] = [
      'CLEAR_COSMIC',
      'SOLAR_SUPERFLARE',
      'CLEAR_COSMIC',
      'SUPERNOVA_WAVE',
      'CHRONO_DISTORTION',
      'ION_LIGHTNING_STORM',
    ];
    const nextIdx = (sequence.indexOf(this.currentWeather) + 1) % sequence.length;
    this.currentWeather = sequence[nextIdx];
    this.weatherDuration = this.currentWeather === 'CLEAR_COSMIC' ? 35.0 : 22.0;
    this.weatherTimer = this.weatherDuration;

    if (this.currentWeather !== 'CLEAR_COSMIC') {
      sound.playAlarmAlert();
    }
  }

  public getTelemetry(): CosmicWeatherTelemetry {
    switch (this.currentWeather) {
      case 'SOLAR_SUPERFLARE':
        return {
          currentWeather: 'SOLAR_SUPERFLARE',
          title: 'SOLAR SUPERFLARE SURGE',
          description: 'Intense coronal mass ejection: +35% core heat, radar scrambled.',
          timeRemainingSeconds: Math.max(0, this.weatherTimer),
          severity: 'HAZARD',
          speedModifier: 0.92,
          engineHeatDelta: 120,
          color: '#f59e0b',
        };
      case 'SUPERNOVA_WAVE':
        return {
          currentWeather: 'SUPERNOVA_WAVE',
          title: 'SUPERNOVA PLASMA WAVE',
          description: 'Relativistic tailwind: +140 KM/H top velocity boost aligned.',
          timeRemainingSeconds: Math.max(0, this.weatherTimer),
          severity: 'ALERT',
          speedModifier: 1.25,
          engineHeatDelta: 40,
          color: '#ec4899',
        };
      case 'CHRONO_DISTORTION':
        return {
          currentWeather: 'CHRONO_DISTORTION',
          title: 'CHRONO DILATION ANOMALY',
          description: 'Spacetime curvature dilation: 0.75x bullet-time cornering.',
          timeRemainingSeconds: Math.max(0, this.weatherTimer),
          severity: 'CAUTION',
          speedModifier: 0.85,
          engineHeatDelta: 0,
          color: '#a855f7',
        };
      case 'ION_LIGHTNING_STORM':
        return {
          currentWeather: 'ION_LIGHTNING_STORM',
          title: 'IONIC THUNDERSTORM',
          description: 'Atmospheric plasma arcs: Skim arcs to instantly recharge active shields.',
          timeRemainingSeconds: Math.max(0, this.weatherTimer),
          severity: 'ALERT',
          speedModifier: 1.05,
          engineHeatDelta: 20,
          color: '#00f0ff',
        };
      default:
        return {
          currentWeather: 'CLEAR_COSMIC',
          title: 'CLEAR ORBITAL SPACE',
          description: 'Normal vacuum parameters.',
          timeRemainingSeconds: Math.max(0, this.weatherTimer),
          severity: 'CAUTION',
          speedModifier: 1.0,
          engineHeatDelta: 0,
          color: '#10b981',
        };
    }
  }

  public dispose() {
    if (this.scene && this.weatherGroup) {
      this.scene.remove(this.weatherGroup);
      this.weatherGroup = null;
    }
  }
}

export const cosmicWeatherDirector = new CosmicWeatherDirector();
