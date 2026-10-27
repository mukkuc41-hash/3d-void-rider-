import * as THREE from 'three';
import { sound } from '../audio';

export type CosmicBiomeId =
  | 'CRYO_NEBULA'
  | 'SOLAR_INFERNO'
  | 'MAGNETAR_VOID'
  | 'EVENT_HORIZON_REDSHIFT';

export interface CosmicBiomeDefinition {
  id: CosmicBiomeId;
  name: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  accentHex: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  dustColor: number;
  chromaticStrength: number;
  gravitationalLensing: number;
}

export const COSMIC_BIOMES: Record<CosmicBiomeId, CosmicBiomeDefinition> = {
  CRYO_NEBULA: {
    id: 'CRYO_NEBULA',
    name: 'Cryo-Nebula Azure',
    subtitle: 'COLD DEEP SPACE NURSERY',
    description: 'Electric sapphire cosmic mist with crystalline stardust and calm stellar radiation.',
    badgeColor: '#00f0ff',
    accentHex: 0x00f0ff,
    fogColor: 0x020817,
    fogDensity: 0.00032,
    ambientColor: 0x0f172a,
    ambientIntensity: 0.75,
    sunColor: 0x38bdf8,
    sunIntensity: 1.4,
    dustColor: 0x38bdf8,
    chromaticStrength: 0.0,
    gravitationalLensing: 0.15,
  },
  SOLAR_INFERNO: {
    id: 'SOLAR_INFERNO',
    name: 'Accretion Solar Flare Inferno',
    subtitle: 'RELATIVISTIC THERMAL SURGE',
    description: 'Blazing coronal discharge arcs, molten gold radiation, and turbulent solar winds.',
    badgeColor: '#f59e0b',
    accentHex: 0xf59e0b,
    fogColor: 0x1a0703,
    fogDensity: 0.00046,
    ambientColor: 0x331205,
    ambientIntensity: 0.85,
    sunColor: 0xf97316,
    sunIntensity: 2.1,
    dustColor: 0xfbbf24,
    chromaticStrength: 0.25,
    gravitationalLensing: 0.35,
  },
  MAGNETAR_VOID: {
    id: 'MAGNETAR_VOID',
    name: 'Magnetar & Violet Supernova',
    subtitle: 'ELECTROMAGNETIC INSTABILITY',
    description: 'High-energy ultraviolet flux, neon purple lightning bursts, and distorted spacetime fabric.',
    badgeColor: '#c026d3',
    accentHex: 0xc026d3,
    fogColor: 0x120324,
    fogDensity: 0.00042,
    ambientColor: 0x240742,
    ambientIntensity: 0.8,
    sunColor: 0xd946ef,
    sunIntensity: 1.9,
    dustColor: 0xe879f9,
    chromaticStrength: 0.35,
    gravitationalLensing: 0.5,
  },
  EVENT_HORIZON_REDSHIFT: {
    id: 'EVENT_HORIZON_REDSHIFT',
    name: 'Event Horizon Gravitational Redshift',
    subtitle: 'CRITICAL SINGULARITY HORIZON',
    description: 'Relativistic Doppler shift, pitch-black abyss with piercing crimson event-horizon lensing.',
    badgeColor: '#ef4444',
    accentHex: 0xef4444,
    fogColor: 0x0c0104,
    fogDensity: 0.00052,
    ambientColor: 0x1c0408,
    ambientIntensity: 0.65,
    sunColor: 0xdc2626,
    sunIntensity: 2.3,
    dustColor: 0xf87171,
    chromaticStrength: 0.65,
    gravitationalLensing: 0.9,
  },
};

export const BIOME_CYCLE_ORDER: CosmicBiomeId[] = [
  'CRYO_NEBULA',
  'SOLAR_INFERNO',
  'MAGNETAR_VOID',
  'EVENT_HORIZON_REDSHIFT',
];

export class CosmicEnvironmentDirector {
  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  public currentBiomeId: CosmicBiomeId = 'CRYO_NEBULA';
  public targetBiomeId: CosmicBiomeId = 'CRYO_NEBULA';
  private transitionT: number = 1.0;
  private transitionDuration: number = 3.0;

  // Current interpolated values
  private currentFogColor = new THREE.Color(0x020817);
  private currentFogDensity = 0.00032;
  private currentAmbientColor = new THREE.Color(0x0f172a);
  private currentAmbientIntensity = 0.75;
  private currentSunColor = new THREE.Color(0x38bdf8);
  private currentSunIntensity = 1.4;
  private currentDustColor = new THREE.Color(0x38bdf8);

  // Auroral mist / particle group for environmental atmosphere
  public mistGroup: THREE.Group;
  private mistParticles: THREE.Points | null = null;

  constructor(scene: THREE.Scene, dirLight?: THREE.DirectionalLight, ambientLight?: THREE.AmbientLight) {
    this.scene = scene;
    this.dirLight = dirLight || null;
    this.ambientLight = ambientLight || null;
    this.mistGroup = new THREE.Group();
    this.mistGroup.name = 'CosmicEnvironment_AtmosphericMist';
    this.scene.add(this.mistGroup);

    this.buildAtmosphericMist();
    this.applyInstantBiome('CRYO_NEBULA');
  }

  public setLights(dirLight: THREE.DirectionalLight, ambientLight: THREE.AmbientLight): void {
    this.dirLight = dirLight;
    this.ambientLight = ambientLight;
    this.applyInstantBiome(this.currentBiomeId);
  }

  private buildAtmosphericMist(): void {
    const particleCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 250 + Math.random() * 950;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = -40 + Math.random() * 220;
      positions[i * 3 + 2] = -200 - Math.random() * 2600;

      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 16,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mistParticles = new THREE.Points(geo, mat);
    this.mistGroup.add(this.mistParticles);
  }

  public setBiome(biomeId: CosmicBiomeId, transitionSeconds = 2.5): void {
    if (this.targetBiomeId === biomeId) return;
    this.currentBiomeId = this.targetBiomeId;
    this.targetBiomeId = biomeId;
    this.transitionT = 0.0;
    this.transitionDuration = Math.max(0.2, transitionSeconds);
    sound.playEnvironmentShiftWhoosh();
  }

  public cycleNextBiome(): CosmicBiomeId {
    const currentIdx = BIOME_CYCLE_ORDER.indexOf(this.targetBiomeId);
    const nextIdx = (currentIdx + 1) % BIOME_CYCLE_ORDER.length;
    const nextBiome = BIOME_CYCLE_ORDER[nextIdx];
    this.setBiome(nextBiome);
    return nextBiome;
  }

  public applyInstantBiome(biomeId: CosmicBiomeId): void {
    this.currentBiomeId = biomeId;
    this.targetBiomeId = biomeId;
    this.transitionT = 1.0;

    const b = COSMIC_BIOMES[biomeId];
    this.currentFogColor.setHex(b.fogColor);
    this.currentFogDensity = b.fogDensity;
    this.currentAmbientColor.setHex(b.ambientColor);
    this.currentAmbientIntensity = b.ambientIntensity;
    this.currentSunColor.setHex(b.sunColor);
    this.currentSunIntensity = b.sunIntensity;
    this.currentDustColor.setHex(b.dustColor);

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.density = this.currentFogDensity;
    } else {
      this.scene.fog = new THREE.FogExp2(this.currentFogColor, this.currentFogDensity);
    }

    if (this.ambientLight) {
      this.ambientLight.color.copy(this.currentAmbientColor);
      this.ambientLight.intensity = this.currentAmbientIntensity;
    }
    if (this.dirLight) {
      this.dirLight.color.copy(this.currentSunColor);
      this.dirLight.intensity = this.currentSunIntensity;
    }

    this.updateMistColors(this.currentDustColor);
  }

  /**
   * Set biome according to Black Hole Submode (1 to 10) or countdown progress
   */
  public updateBySubmode(submodeNumber: number, countdownProgressRatio = 0): void {
    if (submodeNumber === 10) {
      // 4 distinct evolutionary environmental phases as countdown ticks down!
      // ratio: 0.0 (start 08:00) -> 1.0 (end 00:00)
      if (countdownProgressRatio < 0.28) {
        if (this.targetBiomeId !== 'CRYO_NEBULA') this.setBiome('CRYO_NEBULA', 4.0);
      } else if (countdownProgressRatio < 0.6) {
        if (this.targetBiomeId !== 'SOLAR_INFERNO') this.setBiome('SOLAR_INFERNO', 4.0);
      } else if (countdownProgressRatio < 0.85) {
        if (this.targetBiomeId !== 'MAGNETAR_VOID') this.setBiome('MAGNETAR_VOID', 3.5);
      } else {
        if (this.targetBiomeId !== 'EVENT_HORIZON_REDSHIFT') this.setBiome('EVENT_HORIZON_REDSHIFT', 3.0);
      }
      return;
    }

    // Default per-submode biome profiles
    const submodeBiomeMap: Record<number, CosmicBiomeId> = {
      1: 'CRYO_NEBULA',            // Singularity Descent
      2: 'SOLAR_INFERNO',          // Gravity Slingshot (high heat pass)
      3: 'SOLAR_INFERNO',          // Black-Hole Storm
      4: 'MAGNETAR_VOID',          // Collapsing Orbit
      5: 'CRYO_NEBULA',            // Treasure Hunt
      6: 'MAGNETAR_VOID',          // Warzone
      7: 'EVENT_HORIZON_REDSHIFT', // Event Horizon Run
      8: 'CRYO_NEBULA',            // Black-Hole Maze
      9: 'EVENT_HORIZON_REDSHIFT', // Singularity Rival
    };

    const target = submodeBiomeMap[submodeNumber] || 'CRYO_NEBULA';
    if (this.targetBiomeId !== target) {
      this.setBiome(target, 2.5);
    }
  }

  public update(dt: number): {
    biome: CosmicBiomeDefinition;
    accentHex: number;
    badgeColor: string;
  } {
    if (this.transitionT < 1.0) {
      this.transitionT = Math.min(1.0, this.transitionT + dt / this.transitionDuration);
      const ease = THREE.MathUtils.smoothstep(this.transitionT, 0, 1);

      const fromBiome = COSMIC_BIOMES[this.currentBiomeId];
      const toBiome = COSMIC_BIOMES[this.targetBiomeId];

      const fromFog = new THREE.Color(fromBiome.fogColor);
      const toFog = new THREE.Color(toBiome.fogColor);
      this.currentFogColor.lerpColors(fromFog, toFog, ease);
      this.currentFogDensity = THREE.MathUtils.lerp(fromBiome.fogDensity, toBiome.fogDensity, ease);

      const fromAmb = new THREE.Color(fromBiome.ambientColor);
      const toAmb = new THREE.Color(toBiome.ambientColor);
      this.currentAmbientColor.lerpColors(fromAmb, toAmb, ease);
      this.currentAmbientIntensity = THREE.MathUtils.lerp(fromBiome.ambientIntensity, toBiome.ambientIntensity, ease);

      const fromSun = new THREE.Color(fromBiome.sunColor);
      const toSun = new THREE.Color(toBiome.sunColor);
      this.currentSunColor.lerpColors(fromSun, toSun, ease);
      this.currentSunIntensity = THREE.MathUtils.lerp(fromBiome.sunIntensity, toBiome.sunIntensity, ease);

      const fromDust = new THREE.Color(fromBiome.dustColor);
      const toDust = new THREE.Color(toBiome.dustColor);
      this.currentDustColor.lerpColors(fromDust, toDust, ease);

      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(this.currentFogColor);
        this.scene.fog.density = this.currentFogDensity;
      }
      if (this.ambientLight) {
        this.ambientLight.color.copy(this.currentAmbientColor);
        this.ambientLight.intensity = this.currentAmbientIntensity;
      }
      if (this.dirLight) {
        this.dirLight.color.copy(this.currentSunColor);
        this.dirLight.intensity = this.currentSunIntensity;
      }

      this.updateMistColors(this.currentDustColor);

      if (this.transitionT >= 1.0) {
        this.currentBiomeId = this.targetBiomeId;
      }
    }

    // Subtle idle drift of atmospheric mist particles
    if (this.mistParticles) {
      this.mistParticles.rotation.y += dt * 0.008;
      this.mistParticles.rotation.z += dt * 0.004;
    }

    const activeBiome = COSMIC_BIOMES[this.targetBiomeId];
    return {
      biome: activeBiome,
      accentHex: activeBiome.accentHex,
      badgeColor: activeBiome.badgeColor,
    };
  }

  private updateMistColors(col: THREE.Color): void {
    if (!this.mistParticles) return;
    const colorsAttr = this.mistParticles.geometry.attributes.color;
    if (!colorsAttr) return;

    const arr = colorsAttr.array as Float32Array;
    const count = arr.length / 3;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = col.r * (0.8 + (i % 5) * 0.05);
      arr[i * 3 + 1] = col.g * (0.8 + (i % 5) * 0.05);
      arr[i * 3 + 2] = col.b * (0.8 + (i % 5) * 0.05);
    }
    colorsAttr.needsUpdate = true;
  }

  public dispose(): void {
    if (this.mistParticles) {
      this.mistParticles.geometry.dispose();
      if (this.mistParticles.material instanceof THREE.Material) {
        this.mistParticles.material.dispose();
      }
      this.mistGroup.remove(this.mistParticles);
      this.mistParticles = null;
    }
    this.scene.remove(this.mistGroup);
  }
}
