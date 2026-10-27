import * as THREE from 'three';
import {
  FINAL_COLLAPSE_MASTER_100_TIMELINE,
  FinalCollapseMasterEvent,
  getMasterEventByNumber,
} from '../finalCollapse/finalCollapseMaster100Timeline';
import { sound } from '../audio';

export type CinematicPanType =
  | 'ORBIT_SWEEP'
  | 'HIGH_ANGLE_POLAR'
  | 'LOW_ANGLE_SURGE'
  | 'DEBRIS_TRACKING'
  | 'PULSAR_ZOOM_PUNCH'
  | 'KILONOVA_RADIAL'
  | 'PLANETARY_TIDAL'
  | 'TERMINAL_HORIZON'
  | 'LAUNCH_CORRIDOR'
  | 'ABSOLUTE_COLLAPSE';

export interface EventCinematicProfile {
  panType: CinematicPanType;
  camOffset: THREE.Vector3;
  lookOffset: THREE.Vector3;
  dutchRoll: number; // in radians
  fovDelta: number; // in degrees
  chromaticAberration: number;
  colorTint: number; // hex
  colorIntensity: number;
  shakeIntensity: number;
  gravitationalWave: boolean;
  polarJetFlare: boolean;
  accretionFlare: boolean;
  duration: number; // seconds
}

/**
 * Builds the canonical cinematic profile for each of the 100 timeline events.
 */
function buildEventProfile(event: FinalCollapseMasterEvent): EventCinematicProfile {
  const i = event.eventNumber;
  const sevRatio = (i - 1) / 99; // 0.0 to 1.0
  const sevLevel = event.severityLevel;

  // Categorize based on canonical cosmic phases and event theme:
  let panType: CinematicPanType = 'ORBIT_SWEEP';
  let camOffset = new THREE.Vector3(0, 4.5, -14);
  let lookOffset = new THREE.Vector3(0, 0, 30);
  let dutchRoll = (Math.sin(i * 1.7) * 0.06);
  let fovDelta = 4.0 + sevRatio * 6.0;
  let colorTint = 0x00f0ff;
  let colorIntensity = 0.35 + sevRatio * 0.45;
  let gravitationalWave = false;
  let polarJetFlare = false;
  let accretionFlare = false;

  if (i === 100) {
    // Event 100: Absolute Singularity Implosion & Rebirth
    panType = 'ABSOLUTE_COLLAPSE';
    camOffset = new THREE.Vector3(0, 18, -35);
    lookOffset = new THREE.Vector3(0, 25, 120);
    dutchRoll = 0.14;
    fovDelta = -12; // deep vacuum zoom
    colorTint = 0xa855f7;
    colorIntensity = 1.0;
    gravitationalWave = true;
    polarJetFlare = true;
    accretionFlare = true;
  } else if (i >= 82 && i <= 88) {
    // Terminal Launch & Sanctuary Docking Corridor
    panType = 'LAUNCH_CORRIDOR';
    camOffset = new THREE.Vector3(0, 2.5, -9);
    lookOffset = new THREE.Vector3(0, 1.2, 55);
    dutchRoll = Math.sin(i) * 0.03;
    fovDelta = 10.0;
    colorTint = 0x10b981; // Sanctuary emerald / cyan
    colorIntensity = 0.6;
    accretionFlare = true;
  } else if (i >= 70 && i <= 81) {
    // Terminal Ascent Ramp, Accelerator Rings & Horizon Encroachment
    panType = 'TERMINAL_HORIZON';
    camOffset = new THREE.Vector3(0, 6.0, -18);
    lookOffset = new THREE.Vector3(0, 8.0, 60);
    dutchRoll = -0.08;
    fovDelta = 8.5;
    colorTint = 0x8b5cf6; // Violet Cherenkov
    colorIntensity = 0.75;
    gravitationalWave = i % 2 === 0;
    polarJetFlare = true;
  } else if (i === 16 || i === 17 || i === 46 || i === 66 || i === 78) {
    // Relativistic Jets & Gamma-Ray Beams
    panType = 'HIGH_ANGLE_POLAR';
    camOffset = new THREE.Vector3(0, -2.5, -12);
    lookOffset = new THREE.Vector3(0, 28, 45);
    dutchRoll = 0.09;
    fovDelta = 12.0;
    colorTint = 0xc084fc; // Intense violet
    colorIntensity = 0.85;
    polarJetFlare = true;
    gravitationalWave = true;
  } else if (i === 31 || i === 32 || i === 33 || i === 45) {
    // Neutron Star Companion & Pulsar Lighthouse Beams
    panType = 'PULSAR_ZOOM_PUNCH';
    camOffset = new THREE.Vector3(Math.sin(i) * 6, 4.0, -11);
    lookOffset = new THREE.Vector3(0, 2.0, 35);
    dutchRoll = 0.11;
    fovDelta = -8.0; // Rapid push-in punch
    colorTint = 0x38bdf8; // Electric pulsar cyan
    colorIntensity = 0.8;
    gravitationalWave = true;
  } else if (i === 34 || i === 35 || i === 36 || i === 57) {
    // Kilonova Detonation & Exotic Antimatter Flash
    panType = 'KILONOVA_RADIAL';
    camOffset = new THREE.Vector3(7, 5.5, -16);
    lookOffset = new THREE.Vector3(-10, 4, 40);
    dutchRoll = -0.10;
    fovDelta = 9.0;
    colorTint = 0xf59e0b; // Gold kilonova
    colorIntensity = 0.9;
    accretionFlare = true;
    gravitationalWave = true;
  } else if (i === 43 || i === 44 || i === 51 || i === 52) {
    // Doomed Planet Cracking & Spindle Formation
    panType = 'PLANETARY_TIDAL';
    camOffset = new THREE.Vector3(-9, 7.0, -20);
    lookOffset = new THREE.Vector3(12, -4, 50);
    dutchRoll = 0.12;
    fovDelta = 7.0;
    colorTint = 0xf97316; // Fiery molten orange
    colorIntensity = 0.8;
    gravitationalWave = true;
  } else if (i === 7 || i === 8 || i === 12 || i === 18 || i === 27 || i === 41) {
    // Asteroid Reef & High-Velocity Debris Curtain
    panType = 'DEBRIS_TRACKING';
    camOffset = new THREE.Vector3(Math.cos(i) * 11, 3.5, -15);
    lookOffset = new THREE.Vector3(-Math.cos(i) * 12, 1.0, 25);
    dutchRoll = Math.sin(i) * 0.08;
    fovDelta = 5.0;
    colorTint = 0xf43f5e; // Razor red
    colorIntensity = 0.65;
  } else if (i === 19 || i === 47 || i === 59 || i === 64) {
    // Structural Faults, Ski Jump Ramps & Maglev Inversion
    panType = 'LOW_ANGLE_SURGE';
    camOffset = new THREE.Vector3(0, 1.2, -10);
    lookOffset = new THREE.Vector3(0, 3.5, 45);
    dutchRoll = Math.sin(i * 2.3) * 0.07;
    fovDelta = 6.0;
    colorTint = 0x06b6d4; // Cyan ionization
    colorIntensity = 0.7;
    accretionFlare = true;
  } else {
    // Singularity Awakening, Metric Perturbations, Kerr Swirl
    panType = 'ORBIT_SWEEP';
    const angle = i * 0.28;
    camOffset = new THREE.Vector3(Math.sin(angle) * 8.5, 4.0 + Math.sin(angle * 2) * 1.5, -14);
    lookOffset = new THREE.Vector3(0, 1.5, 30);
    dutchRoll = Math.sin(angle) * 0.06;
    fovDelta = 4.5 + sevRatio * 5.0;
    colorTint = i >= 60 ? 0xec4899 : i >= 30 ? 0xa855f7 : 0x00f0ff;
    colorIntensity = 0.4 + sevRatio * 0.5;
    gravitationalWave = i % 5 === 0;
    accretionFlare = i % 3 === 0;
    polarJetFlare = i % 7 === 0;
  }

  const shakeIntensity = Math.max(event.cameraShake, 0.2 + sevRatio * 1.8);
  const duration = i === 100 ? 4.5 : i >= 90 ? 3.4 : 3.0;

  return {
    panType,
    camOffset,
    lookOffset,
    dutchRoll,
    fovDelta,
    chromaticAberration: Math.min(1.0, 0.25 + sevRatio * 0.75),
    colorTint,
    colorIntensity,
    shakeIntensity,
    gravitationalWave,
    polarJetFlare,
    accretionFlare,
    duration,
  };
}

/**
 * SUBMODE 10 CINEMATIC EVENT HANDLER
 *
 * Orchestrates brief camera pans, visual distortion effects, and entity transitions
 * for all 100 timeline events.
 *
 * Guarantees:
 * - Every event has an authored cinematic beat.
 * - Smooth ease-in, peak, and ease-out envelope.
 * - 100% immediate clearance when the alert concludes (zero lingering offsets).
 */
export class Submode10CinematicEventHandler {
  private activeEvent: FinalCollapseMasterEvent | null = null;
  private currentProfile: EventCinematicProfile | null = null;
  private elapsedSeconds = 0;
  private isActiveFlag = false;

  // Smooth lerp state
  private smoothCamOffset = new THREE.Vector3();
  private smoothLookOffset = new THREE.Vector3();
  private smoothDutchRoll = 0;
  private smoothFovDelta = 0;
  private smoothColorIntensity = 0;

  // Base camera state storage
  private originalFov = 70;

  // Cached profiles for fast O(1) performance across all 100 events
  private readonly profileCache = new Map<number, EventCinematicProfile>();

  constructor() {
    for (const evt of FINAL_COLLAPSE_MASTER_100_TIMELINE) {
      this.profileCache.set(evt.eventNumber, buildEventProfile(evt));
    }
  }

  /**
   * Triggers the cinematic scene for a specific event (1 to 100)
   */
  public triggerEvent(eventInput: number | FinalCollapseMasterEvent): void {
    const event =
      typeof eventInput === 'number'
        ? getMasterEventByNumber(eventInput)
        : eventInput;

    this.activeEvent = event;
    this.currentProfile =
      this.profileCache.get(event.eventNumber) || buildEventProfile(event);
    this.elapsedSeconds = 0;
    this.isActiveFlag = true;

    // Optional audio reinforcement on event start
    try {
      if (this.currentProfile.gravitationalWave) {
        sound.playGravitationalWavePulse(0.8 + (event.severityLevel / 10) * 1.2);
      }
    } catch (_) {}
  }

  /**
   * Updates cinematic camera pan, visual distortion, and entity transitions.
   */
  public update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    playerShip: THREE.Object3D | null,
    blackHole: any | null,
    scene?: THREE.Scene
  ): {
    isActive: boolean;
    progress: number;
    fovDelta: number;
    colorTint: number;
    colorIntensity: number;
    shake: number;
  } {
    if (!this.isActiveFlag || !this.currentProfile || !this.activeEvent) {
      this.resetImmediately(camera);
      return {
        isActive: false,
        progress: 0,
        fovDelta: 0,
        colorTint: 0x000000,
        colorIntensity: 0,
        shake: 0,
      };
    }

    const duration = this.currentProfile.duration;
    this.elapsedSeconds += Math.max(0, Math.min(dt, 0.15));

    if (this.elapsedSeconds >= duration) {
      // Alert/cinematic duration concluded: CLEAR IMMEDIATELY!
      this.resetImmediately(camera);
      return {
        isActive: false,
        progress: 1.0,
        fovDelta: 0,
        colorTint: 0x000000,
        colorIntensity: 0,
        shake: 0,
      };
    }

    const linearProgress = THREE.MathUtils.clamp(this.elapsedSeconds / duration, 0, 1);
    // Smooth bell curve envelope: 0 at start -> 1 at middle -> 0 at conclusion
    const envelope = Math.sin(linearProgress * Math.PI);

    // 1. Calculate and apply camera pan & target
    if (playerShip) {
      const shipQuat = playerShip.quaternion;
      const shipPos = playerShip.position;

      // Transform local camera offset by ship orientation
      const worldCamOffset = this.currentProfile.camOffset
        .clone()
        .multiplyScalar(envelope)
        .applyQuaternion(shipQuat);

      const worldLookOffset = this.currentProfile.lookOffset
        .clone()
        .multiplyScalar(envelope)
        .applyQuaternion(shipQuat);

      this.smoothCamOffset.lerp(worldCamOffset, 0.18);
      this.smoothLookOffset.lerp(worldLookOffset, 0.18);

      // Apply camera offset without breaking player chase authority
      camera.position.add(this.smoothCamOffset.clone().multiplyScalar(0.42));

      // Dutch roll angle
      const targetRoll = this.currentProfile.dutchRoll * envelope;
      this.smoothDutchRoll = THREE.MathUtils.lerp(this.smoothDutchRoll, targetRoll, 0.2);
      camera.rotation.z += this.smoothDutchRoll;
    }

    // 2. Visual Distortion: Dynamic FOV pulse
    const targetFovDelta = this.currentProfile.fovDelta * envelope;
    this.smoothFovDelta = THREE.MathUtils.lerp(this.smoothFovDelta, targetFovDelta, 0.25);
    camera.fov = THREE.MathUtils.clamp(this.originalFov + this.smoothFovDelta, 45, 115);
    camera.updateProjectionMatrix();

    // 3. Entity Transitions (driven on black hole or surrounding elements)
    if (blackHole) {
      if (this.currentProfile.polarJetFlare && typeof blackHole.setPolarJetIntensity === 'function') {
        blackHole.setPolarJetIntensity(1.0 + envelope * 0.8);
      }
      if (this.currentProfile.accretionFlare && typeof blackHole.setThermalShift === 'function') {
        blackHole.setThermalShift(Math.min(1.0, (this.activeEvent.eventNumber / 99) + envelope * 0.3));
      }
      if (
        this.currentProfile.gravitationalWave &&
        linearProgress < 0.25 &&
        typeof blackHole.triggerGravitationalWave === 'function'
      ) {
        blackHole.triggerGravitationalWave(1.2 + envelope * 0.8, this.currentProfile.colorTint);
      }
    }

    const currentShake = this.currentProfile.shakeIntensity * envelope;
    const currentColorIntensity = this.currentProfile.colorIntensity * envelope;

    return {
      isActive: true,
      progress: linearProgress,
      fovDelta: this.smoothFovDelta,
      colorTint: this.currentProfile.colorTint,
      colorIntensity: currentColorIntensity,
      shake: currentShake,
    };
  }

  /**
   * Immediately clears all camera offsets, FOV distortions, and rolls back to clean normal state.
   */
  public resetImmediately(camera?: THREE.PerspectiveCamera): void {
    this.isActiveFlag = false;
    this.activeEvent = null;
    this.currentProfile = null;
    this.elapsedSeconds = 0;
    this.smoothCamOffset.set(0, 0, 0);
    this.smoothLookOffset.set(0, 0, 0);
    this.smoothDutchRoll = 0;
    this.smoothFovDelta = 0;
    this.smoothColorIntensity = 0;

    if (camera) {
      camera.fov = this.originalFov;
      camera.rotation.z = 0;
      camera.updateProjectionMatrix();
    }
  }

  public setBaseFov(fov: number): void {
    this.originalFov = fov;
  }

  public isActive(): boolean {
    return this.isActiveFlag;
  }

  public getProgress(): number {
    if (!this.isActiveFlag || !this.currentProfile) return 0;
    return THREE.MathUtils.clamp(this.elapsedSeconds / this.currentProfile.duration, 0, 1);
  }

  public getActiveEvent(): FinalCollapseMasterEvent | null {
    return this.activeEvent;
  }

  public getCurrentProfile(): EventCinematicProfile | null {
    return this.currentProfile;
  }
}
