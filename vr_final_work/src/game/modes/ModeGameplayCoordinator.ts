import * as THREE from 'three';
import { GameMode } from '../../types';
import { sound } from '../audio';
import { ModeEventManager, ModeEventUpdateResult } from '../events/ModeEventManager';
import { getModeDefinition, ModeDefinition } from './ModeRegistry';

export interface CoordinatorUpdateResult {
  speedMultiplier: number;
  speedDeltaKmH: number;
  damage: number;
  handlingMultiplier: number;
  boostCapacityMultiplier: number;
  solarHeat: number;
  stormWallDistance: number;
  timeBonusMs: number;
  stuntScore: number;
  warningText: string | null;
  warningColor: string;
  objectiveText: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  cameraShake: number;
  isAirborneJump: boolean;
  finalLapEscalated: boolean;
}

export class ModeGameplayCoordinator {
  private scene: THREE.Scene;
  public eventManager: ModeEventManager;
  public activeMode: GameMode = 'NEON_CIRCUIT';
  public activeDef: ModeDefinition | null = null;

  // Mode 02: Neon Circuit
  public finalLapEscalated = false;
  public driftComboScore = 0;

  // Mode 03: Asteroid Run
  public rocksDestroyed = 0;

  // Mode 04: Wormhole Express
  public warpApertureActive = false;

  // Mode 05: Solar Storm
  public solarHeat = 0; // 0 to 100%
  public inProtectiveZone = false;

  // Mode 06: Gravity Free
  public zeroGActive = false;
  public aerialStuntScore = 0;

  // Mode 07: Plasma Storm
  public stormWallDistance = 320; // meters behind

  // Mode 08: Skyline Rush
  public isAirborneJump = false;
  public airtimeTimer = 0;

  // Mode 09: Debris Survival
  public debrisDodged = 0;

  // Mode 10: Quantum Time Trial
  public timeBonusTotalMs = 0;
  public split1TimeMs = 0;
  public split2TimeMs = 0;
  public personalBestLapMs = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.eventManager = new ModeEventManager(scene);
  }

  public initMode(mode: GameMode, curve: THREE.Curve<THREE.Vector3> | null): void {
    this.activeMode = mode;
    this.activeDef = getModeDefinition(mode);

    // Reset mode variables
    this.finalLapEscalated = false;
    this.driftComboScore = 0;
    this.rocksDestroyed = 0;
    this.warpApertureActive = false;
    this.solarHeat = 0;
    this.inProtectiveZone = false;
    this.zeroGActive = mode === 'GRAVITY_FREE';
    this.aerialStuntScore = 0;
    this.stormWallDistance = 320;
    this.isAirborneJump = false;
    this.airtimeTimer = 0;
    this.debrisDodged = 0;
    this.timeBonusTotalMs = 0;
    this.split1TimeMs = 0;
    this.split2TimeMs = 0;

    this.eventManager.initMode(mode, curve);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeedKmH: number,
    splineT: number,
    lateralOffset: number,
    currentLap: number,
    isBoosting: boolean,
    isDrifting: boolean
  ): CoordinatorUpdateResult {
    // 1. Advance data-driven events
    const evResult: ModeEventUpdateResult = this.eventManager.update(
      dt,
      playerPos,
      playerSpeedKmH,
      splineT,
      lateralOffset,
      currentLap,
      isBoosting,
      isDrifting
    );

    // 2. Mode-Specific Physics and Rules
    const def = this.activeDef;
    let speedMult = def ? def.physicsProfile.topSpeedMultiplier : 1.0;
    let handlingMult = def ? def.physicsProfile.handlingMultiplier : 1.0;
    let boostCapMult = 1.0;
    let customSpeedDelta = evResult.speedDeltaKmH;
    let customDamage = evResult.damageDelta;
    let totalCameraShake = evResult.cameraShake;

    // Default metric values
    let primaryLabel = 'VELOCITY';
    let primaryVal = `${Math.floor(playerSpeedKmH)} KM/H`;
    let secondaryLabel = 'SECTOR';
    let secondaryVal = `${Math.floor(splineT * 100)}%`;
    let objective = def ? def.objectiveText : 'COMPLETE THE RACE';

    switch (this.activeMode) {
      // ---------------------------------------------------------------------
      // MODE 02 — NEON CIRCUIT
      // ---------------------------------------------------------------------
      case 'NEON_CIRCUIT': {
        if (isDrifting) {
          this.driftComboScore += Math.floor(dt * 150);
          speedMult *= 1.06; // Drifting rewards apex acceleration
        }
        if (currentLap >= 2 && !this.finalLapEscalated) {
          this.finalLapEscalated = true;
          sound.playAlarmAlert();
        }
        if (this.finalLapEscalated) {
          speedMult *= 1.08;
        }
        primaryLabel = 'VELOCITY';
        primaryVal = `${Math.floor(playerSpeedKmH)} KM/H`;
        secondaryLabel = 'DRIFT COMBO';
        secondaryVal = `${this.driftComboScore} PTS`;
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 03 — ASTEROID RUN
      // ---------------------------------------------------------------------
      case 'ASTEROID_RUN': {
        primaryLabel = 'OBSTACLES';
        primaryVal = `${this.rocksDestroyed} CLEARED`;
        secondaryLabel = 'DENSITY';
        secondaryVal = splineT > 0.4 && splineT < 0.7 ? 'CRITICAL' : 'MODERATE';
        objective = 'NAVIGATE IRON ASTEROID FIELD // FIRE BEAMS TO CLEAR APEX';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 04 — WORMHOLE EXPRESS
      // ---------------------------------------------------------------------
      case 'WORMHOLE_EXPRESS': {
        this.warpApertureActive = splineT >= 0.15 && splineT <= 0.85;
        if (this.warpApertureActive) {
          speedMult *= 1.25;
          handlingMult *= 1.15;
          boostCapMult = 1.4;
        }
        primaryLabel = 'WARP SPEED';
        primaryVal = `${Math.floor(playerSpeedKmH * 1.25)} KM/H`;
        secondaryLabel = 'SUBSPACE';
        secondaryVal = this.warpApertureActive ? 'SLIPSTREAM LOCK' : 'TRANSIT';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 05 — SOLAR STORM
      // ---------------------------------------------------------------------
      case 'SOLAR_STORM': {
        this.inProtectiveZone = splineT >= 0.65 && splineT <= 0.82;
        if (this.inProtectiveZone) {
          this.solarHeat = Math.max(0, this.solarHeat - 15 * dt);
        } else {
          // Heat accumulates outside shelter
          const heatGain = (1.5 + (isBoosting ? 1.0 : 0)) * dt;
          this.solarHeat = Math.min(100, this.solarHeat + heatGain + (evResult.heatDelta > 0 ? evResult.heatDelta * 0.1 : 0));
        }

        // High heat consequences
        if (this.solarHeat > 80) {
          speedMult *= 0.82; // Thermal throttle
          customDamage += 2.5 * dt;
          totalCameraShake += 0.2;
        } else if (this.solarHeat > 50) {
          speedMult *= 0.94;
        }

        primaryLabel = 'CORE HEAT';
        primaryVal = `${Math.floor(this.solarHeat)}%`;
        secondaryLabel = 'SHIELDING';
        secondaryVal = this.inProtectiveZone ? 'ACTIVE [COOLING]' : 'EXPOSED';
        objective = this.solarHeat > 75 ? 'WARNING: CORE OVERHEAT // SEEK SHELTER' : 'MANAGE HEAT & REACH SAFE ZONES';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 06 — GRAVITY FREE
      // ---------------------------------------------------------------------
      case 'GRAVITY_FREE': {
        this.zeroGActive = true;
        if (isDrifting || Math.abs(lateralOffset) > 5) {
          this.aerialStuntScore += Math.floor(dt * 200);
        }
        speedMult *= 1.12;
        handlingMult *= 1.30;
        primaryLabel = 'STUNT COMBO';
        primaryVal = `${this.aerialStuntScore} PTS`;
        secondaryLabel = 'MICROGRAVITY';
        secondaryVal = '0.00 G [FREE FLIGHT]';
        objective = 'PRESERVE MOMENTUM // THREAD 3D CENTRIFUGE RINGS';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 07 — PLASMA STORM
      // ---------------------------------------------------------------------
      case 'PLASMA_STORM': {
        // Storm wall advances if speed drops
        const catchupSpeed = Math.max(0, 180 - playerSpeedKmH * 0.35);
        this.stormWallDistance = Math.max(20, Math.min(600, this.stormWallDistance - (catchupSpeed - 80) * dt * 0.1));

        if (this.stormWallDistance < 60) {
          customDamage += 5.0 * dt;
          totalCameraShake += 0.45;
          sound.playCrash();
        }

        primaryLabel = 'STORM WALL';
        primaryVal = `${Math.floor(this.stormWallDistance)}m BEHIND`;
        secondaryLabel = 'LIGHTNING';
        secondaryVal = this.stormWallDistance < 100 ? 'CRITICAL DISCHARGE' : 'STATIC WARNING';
        objective = this.stormWallDistance < 80 ? 'DANGER: OUTRUN STORM WALL NOW!' : 'AVOID LIGHTNING ARCS & RIDE SAFE LANES';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 08 — SKYLINE RUSH
      // ---------------------------------------------------------------------
      case 'SKYLINE_RUSH': {
        // High-altitude jumps across rooftop chasms at t in [0.52, 0.62]
        this.isAirborneJump = splineT >= 0.52 && splineT <= 0.62;
        if (this.isAirborneJump) {
          this.airtimeTimer += dt;
          speedMult *= 1.25;
        } else {
          this.airtimeTimer = 0;
        }
        primaryLabel = 'ROOFTOP DROP';
        primaryVal = this.isAirborneJump ? 'AIRBORNE CHASM LEAP' : `${Math.floor(playerSpeedKmH)} KM/H`;
        secondaryLabel = 'ELEVATION';
        secondaryVal = this.isAirborneJump ? '+85m OVER METRO' : 'TIER 3 HIGHWAY';
        objective = 'STICK ROOFTOP LEAPS & OUTRACE URBAN AIR TRAFFIC';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 09 — DEBRIS SURVIVAL
      // ---------------------------------------------------------------------
      case 'DEBRIS_SURVIVAL': {
        this.debrisDodged += Math.floor(dt * 3);
        primaryLabel = 'DEBRIS CLEARED';
        primaryVal = `${this.debrisDodged} OBJECTS`;
        secondaryLabel = 'HULL INTEGRITY';
        secondaryVal = 'OPTIMAL';
        objective = 'SURVIVE EXPANDING WRECKAGE & AVOID COLLAPSED BEAMS';
        break;
      }

      // ---------------------------------------------------------------------
      // MODE 10 — QUANTUM TIME TRIAL
      // ---------------------------------------------------------------------
      case 'QUANTUM_TIME_TRIAL': {
        this.timeBonusTotalMs += evResult.timeBonusMs;

        // Split evaluations
        const targetMs = def?.rules.goldTargetMs || 45000;
        const currentLapEstimatedMs = splineT * targetMs;
        const deltaMs = Math.round(currentLapEstimatedMs - targetMs * splineT + this.timeBonusTotalMs);

        primaryLabel = 'TARGET GOLD';
        primaryVal = `<${(targetMs / 1000).toFixed(1)}s`;
        secondaryLabel = 'DELTA';
        secondaryVal = deltaMs <= 0 ? `-${(Math.abs(deltaMs) / 1000).toFixed(3)}s [GREEN]` : `+${(deltaMs / 1000).toFixed(3)}s [RED]`;
        objective = 'BEAT GOLD TARGET 45.000s // THREAD PRECISION GATES';
        break;
      }
    }

    return {
      speedMultiplier: speedMult,
      speedDeltaKmH: customSpeedDelta,
      damage: customDamage,
      handlingMultiplier: handlingMult,
      boostCapacityMultiplier: boostCapMult,
      solarHeat: this.solarHeat,
      stormWallDistance: this.stormWallDistance,
      timeBonusMs: this.timeBonusTotalMs,
      stuntScore: this.driftComboScore + this.aerialStuntScore,
      warningText: evResult.activeWarningText,
      warningColor: evResult.activeWarningColor,
      objectiveText: objective,
      primaryMetricLabel: primaryLabel,
      primaryMetricValue: primaryVal,
      secondaryMetricLabel: secondaryLabel,
      secondaryMetricValue: secondaryVal,
      cameraShake: totalCameraShake,
      isAirborneJump: this.isAirborneJump,
      finalLapEscalated: this.finalLapEscalated,
    };
  }

  public registerRockDestroyed(): void {
    this.rocksDestroyed++;
    sound.playCrash();
  }

  public cleanup(): void {
    this.eventManager.cleanup();
  }

  public dispose(): void {
    this.eventManager.dispose();
  }
}
