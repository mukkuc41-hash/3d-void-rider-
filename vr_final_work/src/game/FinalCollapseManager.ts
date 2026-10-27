import * as THREE from 'three';
import { sound } from './audio';
import { PathSegment } from './extendedPath/extendedPathTypes';
import { RAW_COSMIC_100_EVENTS } from './catastrophe/cosmic100EventsCatalog';
import {
  FINAL_COLLAPSE_MASTER_100_TIMELINE,
  FinalCollapseMasterEvent,
  getMasterEventByNumber,
  AlertSeverityType,
} from './finalCollapse/finalCollapseMaster100Timeline';
import { Submode10CinematicEventHandler } from './cinematics/Submode10CinematicEventHandler';
import { EscapeMissionManager, type EscapeMissionTelemetry } from './finalCollapse/finalCollapseEscapeMissions';
import {
  getFinalCollapse100Event,
  FINAL_COLLAPSE_100_EVENTS,
  TOTAL_CINEMATIC_SECONDS,
  EVENT_DURATION_SECONDS,
  TOTAL_EVENTS_COUNT,
  formatCinematicElapsedTimer,
  type FinalCollapse100Event,
} from './finalCollapse100Events';

/**
 * 3. Evacuation State Machine
 * STRICT PHYSICAL PROGRESSION:
 * TOWER_APPROACHING -> TOWER_ENTERED -> BASEMENT_ENTERED -> HANGAR_ENTERED ->
 * PARKING_BAY_ENTERED -> SHIP_ALIGNED -> SHIP_PARKED -> SHIP_SECURED
 */
export type EvacuationState =
  | 'TOWER_APPROACHING'
  | 'TOWER_ENTERED'
  | 'BASEMENT_ENTERED'
  | 'HANGAR_ENTERED'
  | 'PARKING_BAY_ENTERED'
  | 'SHIP_ALIGNED'
  | 'SHIP_PARKED'
  | 'SHIP_SECURED';

/**
 * 55. Authoritative Game State Priority
 * NORMAL_RACE -> EVACUATION -> EVACUATION_SUCCESS or EVACUATION_FAILURE
 */
export type FinalCollapseGameState =
  | 'NORMAL_RACE'
  | 'EVACUATION'
  | 'EVACUATION_SUCCESS'
  | 'EVACUATION_FAILURE';

/**
 * Failure Cause Classification
 */
export type FailureCause =
  | 'DESTRUCTION_FRONT_REACHED_PLAYER'
  | 'EVACUATION_DEADLINE_EXPIRED'
  | 'ROUTE_CONSUMED_BY_SINGULARITY'
  | 'TOWER_ENTRANCE_SEALED'
  | 'BASEMENT_NOT_REACHED'
  | 'PARKING_BAY_NOT_REACHED'
  | 'SHIP_NOT_SECURED'
  | 'PLAYER_CAUGHT_IN_GRAVITATIONAL_EVENT'
  | 'CRITICAL_HULL_BREACH'
  | 'CONSUMED_BY_EVENT_HORIZON';

/**
 * Real Track Segment Collapse State
 */
export type TrackSegmentCollapseState =
  | 'SAFE'
  | 'UNSTABLE'
  | 'COLLAPSING'
  | 'DESTROYED'
  | 'CONSUMED';

/**
 * 5 & 17–31. Catastrophe Event Definition (Authoritative 100-Event Master Timeline)
 */
export interface CatastropheEventDef {
  index: number;
  triggerTime: number; // in seconds from start (0 to 900)
  displayTime: string;
  name: string;
  title: string;
  subtitle: string;
  alertTitle: string;
  alertMessage: string;
  severity: number;
  severityType: AlertSeverityType;
  audioCue: 'advisory' | 'warning' | 'danger' | 'critical' | 'emergency' | 'final_warning' | 'collapse';
  environmentReaction: string;
  affectedObject: string;
  blackHoleInstability: number;
  cameraShake: number;
  phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY';
  phaseTimer: number;
}

/**
 * Ship Impact Forces applied physically to spaceship
 */
export interface ShipImpactForces {
  lateralForce: number;
  steeringResistance: number;
  velocityDisturbance: number;
  pitchDisturbance: number;
  rollDisturbance: number;
  yawDisturbance: number;
  cameraShake: number;
  fovDistortion: number;
  hudInterference: number;
  shieldStress: number;
  navigationInterference: number;
}

/**
 * Final Collapse Statistics (for Results screen & telemetry)
 */
export interface FinalCollapseStats {
  survivalStatus: 'SURVIVED' | 'FAILED';
  safeZoneStatus: 'SECURED' | 'NOT REACHED';
  towerEntryReached: boolean;
  basementEntryReached: boolean;
  hangarEntryReached: boolean;
  parkingBayReached: boolean;
  shipAligned: boolean;
  shipParked: boolean;
  shipSecured: boolean;
  raceTimeFormatted: string;
  raceTimeMs: number;
  evacuationTimeFormatted: string;
  evacuationTimeSeconds: number;
  distanceTraveledM: number;
  checkpointsReached: number;
  boostUsedCount: number;
  shieldsUsedCount: number;
  missilesUsedCount: number;
  failureCause: FailureCause | null;
  safeZone: string;
  shipStatus: string;
  endingClassification?: string;
  lastSurvivalDurationSeconds?: number;
  finalCollapseStageReached?: number;
  eventsSurvivedCount?: number;
  escapeRoutesAttemptedCount?: number;
  distanceFromSafeZoneM?: number;
  damageReceivedTotal?: number;
  structuresEncounteredCount?: number;
}

/**
 * Telemetry snapshot emitted to HUD / UI components
 */
export interface EvacuationTelemetry {
  gameState: FinalCollapseGameState;
  evacuationActive: boolean;
  evacuationSuccess: boolean;
  evacuationFailed: boolean;
  evacuationElapsedTime: number;
  evacuationState: EvacuationState;
  failureCause: FailureCause | null;
  currentEventIndex: number;
  nextEventTime: number;
  activeEventName: string | null;
  activeEventTitle: string | null;
  activeEventSubtitle: string | null;
  activeAlertTitle: string | null;
  activeAlertMessage: string | null;
  activeAudioCue: string | null;
  activeEnvironmentReaction: string | null;
  activeAffectedObject: string | null;
  blackHoleInstability: number;
  cinematicSceneActive: boolean;
  cinematicSceneProgress: number;
  eventPhase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' | null;
  hazardEscalation: number;
  eventHistory: string[];
  safeZoneDistanceM: number;
  safeZoneWarning: string;
  objectiveText: string;
  navArrowAngleDeg: number;
  navArrowVector: { x: number; y: number; z: number };
  routeConsumptionActive: boolean;
  generalFailureActive: boolean;
  cinematicPhase: number;
  cinematicProgress: number;
  blackScreenActive: boolean;
  endingVariant: 'STANDARD' | 'MISSED_ESCAPE_COLLAPSE';
  destructionFrontDistanceM: number;
  playerOnCollapsingSegment: boolean;
  escapeWindowRemainingSeconds: number;
  clampsLocked: { left: boolean; right: boolean; front: boolean; rear: boolean };
  absoluteCollapseActive: boolean;
  hudGlitchIntensity: number;
  escapeMission?: EscapeMissionTelemetry;
  cinematicElapsedSeconds?: number;
  cinematicTotalSeconds?: number;
  currentEventNumber?: number;
  currentEventTitle?: string;
  currentEventPresentation?: string;
  currentEventTimeRange?: string;
}

/* =========================================================================
   SUB-SYSTEM 1: EvacuationManager
   Coordinates evacuation lifecycle, strict state machine, and terminal locks.
   ========================================================================= */
export class EvacuationManager {
  public gameState: FinalCollapseGameState = 'NORMAL_RACE';
  public evacuationState: EvacuationState = 'TOWER_APPROACHING';
  public evacuationActive = false;
  public evacuationSuccess = false;
  public evacuationFailed = false;
  public evacuationElapsedTime = 0;
  public failureCause: FailureCause | null = null;

  // Milestone tracking
  public towerEntryReached = false;
  public basementEntryReached = false;
  public hangarEntryReached = false;
  public parkingBayReached = false;
  public shipAligned = false;
  public shipParked = false;
  public shipSecured = false;

  public startEvacuation(): void {
    if (this.evacuationActive || this.evacuationSuccess || this.evacuationFailed) return;
    this.gameState = 'EVACUATION';
    this.evacuationActive = true;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.evacuationState = 'TOWER_APPROACHING';
    this.failureCause = null;
    this.towerEntryReached = false;
    this.basementEntryReached = false;
    this.hangarEntryReached = false;
    this.parkingBayReached = false;
    this.shipAligned = false;
    this.shipParked = false;
    this.shipSecured = false;
  }

  public update(dt: number): void {
    if (!this.evacuationActive || this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationElapsedTime += Math.max(0, Math.min(dt, 0.25));
  }

  public setEvacuationState(state: EvacuationState): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationState = state;

    if (state === 'TOWER_ENTERED') this.towerEntryReached = true;
    if (state === 'BASEMENT_ENTERED') this.basementEntryReached = true;
    if (state === 'HANGAR_ENTERED') this.hangarEntryReached = true;
    if (state === 'PARKING_BAY_ENTERED') this.parkingBayReached = true;
    if (state === 'SHIP_ALIGNED') this.shipAligned = true;
    if (state === 'SHIP_PARKED') this.shipParked = true;
    if (state === 'SHIP_SECURED') {
      this.shipSecured = true;
      this.markSuccess();
    }
  }

  public markSuccess(): void {
    if (this.evacuationFailed) return;
    this.evacuationSuccess = true;
    this.evacuationActive = false;
    this.gameState = 'EVACUATION_SUCCESS';
  }

  /**
   * 45. FAILURE STATE LOCK
   * When EVACUATION_FAILED === true:
   * Immediately stop scheduling, lock failure state, prevent later events
   * from overwriting failure sequence, preserve failure cause.
   */
  public markFailure(cause: FailureCause): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationFailed = true;
    this.evacuationActive = false;
    this.gameState = 'EVACUATION_FAILURE';
    this.failureCause = cause;
  }

  public reset(): void {
    this.gameState = 'NORMAL_RACE';
    this.evacuationState = 'TOWER_APPROACHING';
    this.evacuationActive = false;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.failureCause = null;
    this.towerEntryReached = false;
    this.basementEntryReached = false;
    this.hangarEntryReached = false;
    this.parkingBayReached = false;
    this.shipAligned = false;
    this.shipParked = false;
    this.shipSecured = false;
  }
}

/* =========================================================================
   SUB-SYSTEM 2: CatastropheEventManager
   5. Exact Catastrophe Clock:
   EVACUATION_ELAPSED_TIME += dt
   Threshold crossing: previousElapsed < eventTime && currentElapsed >= eventTime
   Exactly 40 events across the 08:00 catastrophe window. There is no Event 41.
   ========================================================================= */
export class CatastropheEventManager {
  public currentEventIndex = 0;
  public nextEventTime = 0.1; // 00:00.1 (Event 01)
  public activeEvent: CatastropheEventDef | null = null;
  public eventHistory: string[] = [];
  public previousElapsed = 0;
  public currentElapsed = 0;
  public timelineElapsed = 0;
  public absoluteCollapse = false;

  // Escalation parameters
  public gravityStrength = 0.2;
  public tidalForce = 0.15;
  public debrisVelocity = 30;
  public routeCollapseSpeed = 40;
  public destructionFrontSpeed = 55;
  public environmentalInstability = 0.2;
  public gravitationalLensing = 0.15;
  public cameraShake = 0;
  public audioIntensity = 0.2;
  public infallRate = 0.2;
  public orbitalInstability = 0.2;
  public navigationInterference = 0;
  // Continuous hazard escalation only — no named difficulty tiers.
  public hazardEscalation = 1.0;

  public readonly cinematicHandler = new Submode10CinematicEventHandler();

  // Quantum Launch Pro / Submode 10 — authoritative 100-event catastrophe catalog.
  // Directly maps the full master timeline (0s to 900s) with alerts, audio cues, and environment reactions.
  public readonly eventCatalog: Omit<CatastropheEventDef, 'phase' | 'phaseTimer'>[] =
    FINAL_COLLAPSE_MASTER_100_TIMELINE.map((event) => ({
      index: event.eventNumber,
      triggerTime: event.exactTriggerSeconds,
      displayTime: event.displayTime,
      name: event.eventName,
      title: `EVENT ${String(event.eventNumber).padStart(2, '0')} — ${event.displayTime} ${event.eventName}`,
      subtitle: event.alertMessage,
      alertTitle: event.alertTitle,
      alertMessage: event.alertMessage,
      severity: event.severityLevel,
      severityType: event.severity,
      audioCue: event.audioCue,
      environmentReaction: event.environmentReaction,
      affectedObject: event.affectedObject,
      blackHoleInstability: event.blackHoleInstability,
      cameraShake: event.cameraShake,
    }));

  public update(dt: number, evacuation: EvacuationManager, timelineElapsed?: number): void {
    // Quantum Launch Pro's 100-event timeline runs during the visible 15:00
    // countdown (15:00 -> 00:00). All 100 events occur at their exact trigger seconds.
    this.previousElapsed = this.currentElapsed;
    this.currentElapsed = timelineElapsed !== undefined ? timelineElapsed : evacuation.evacuationElapsedTime;
    this.timelineElapsed = this.currentElapsed;

    // Continuous escalation only.
    const progress = THREE.MathUtils.clamp(this.currentElapsed / 900, 0, 1);
    this.hazardEscalation = 1.0 + 1.2 * Math.pow(progress, 1.35);

    // Guarantee Event 1 is triggered immediately on start
    if (this.currentEventIndex === 0 && this.eventCatalog.length > 0) {
      this.triggerEvent(this.eventCatalog[0]);
    }

    // Ensure all 100 events occur in strict sequential order: 1 -> 2 -> ... -> 100
    // Every crossed threshold advances the sequence without skipping any event
    while (this.currentEventIndex < this.eventCatalog.length) {
      const nextDef = this.eventCatalog[this.currentEventIndex];
      if (!nextDef) break;
      if (this.currentElapsed >= nextDef.triggerTime) {
        this.triggerEvent(nextDef);
      } else {
        break;
      }
    }

    // Progress active event lifecycle: WARNING -> BUILDUP -> CINEMATIC -> GAMEPLAY
    if (this.activeEvent) {
      this.activeEvent.phaseTimer += dt;
      const t = this.activeEvent.phaseTimer;

      if (this.activeEvent.phase === 'WARNING' && t >= 2.5) {
        this.activeEvent.phase = 'BUILDUP';
        this.cameraShake = Math.min(2.8, 0.6 + this.activeEvent.severity * 0.22);
      } else if (this.activeEvent.phase === 'BUILDUP' && t >= 5.0) {
        this.activeEvent.phase = 'CINEMATIC';
      } else if (this.activeEvent.phase === 'CINEMATIC' && t >= 7.5) {
        this.activeEvent.phase = 'GAMEPLAY';
        this.cameraShake = Math.max(0, this.cameraShake * 0.4);
      }
    }
  }

  public triggerEvent(def: Omit<CatastropheEventDef, 'phase' | 'phaseTimer'>): void {
    this.currentEventIndex = def.index;
    this.nextEventTime = def.index < this.eventCatalog.length ? this.eventCatalog[def.index].triggerTime : 900;
    this.activeEvent = {
      ...def,
      phase: 'WARNING',
      phaseTimer: 0,
    };
    this.eventHistory.push(`EVENT_${def.index.toString().padStart(2, '0')}`);

    if (def.index === this.eventCatalog.length) {
      this.absoluteCollapse = true;
    }

    // Progressive escalation of physical parameters
    const totalEvents = Math.max(1, this.eventCatalog.length);
    const eventRatio = def.index / totalEvents;
    this.gravityStrength = Math.min(1.0, 0.15 + eventRatio * 0.85);
    this.tidalForce = Math.min(1.0, 0.12 + eventRatio * 0.88);
    this.debrisVelocity = Math.min(140, 25 + eventRatio * 115);
    this.routeCollapseSpeed = Math.min(120, 35 + eventRatio * 85);
    this.destructionFrontSpeed = Math.min(105, 50 + eventRatio * 55);
    this.environmentalInstability = Math.min(1.0, 0.15 + eventRatio * 0.85);
    this.gravitationalLensing = Math.min(1.0, 0.12 + eventRatio * 0.88);
    this.audioIntensity = Math.min(1.0, 0.2 + eventRatio * 0.8);
    this.infallRate = Math.min(1.0, 0.15 + eventRatio * 0.85);
    this.orbitalInstability = Math.min(1.0, 0.15 + eventRatio * 0.85);
    this.navigationInterference = Math.min(1.0, def.index >= 12 ? eventRatio * 0.8 : 0);
    this.gravityStrength = Math.min(1.0, this.gravityStrength * this.hazardEscalation);
    this.tidalForce = Math.min(1.0, this.tidalForce * this.hazardEscalation);
    this.debrisVelocity = Math.min(180, this.debrisVelocity * this.hazardEscalation);
    this.routeCollapseSpeed = Math.min(150, this.routeCollapseSpeed * this.hazardEscalation);
    this.navigationInterference = Math.min(1.0, this.navigationInterference + (this.hazardEscalation - 1) * 0.12);
    this.cameraShake = Math.max(this.cameraShake, def.cameraShake);

    // Individual audio alerts with specific cues
    try {
      sound.playFinalCollapseMasterAlertAudio(def.audioCue, def.severityType);
      sound.playFinalCollapseEventAudio(def.index);
    } catch (_) {}

    // Trigger unique cinematic scene for this event
    const masterEvent = getMasterEventByNumber(def.index);
    this.cinematicHandler.triggerEvent(masterEvent);
  }

  /**
   * Jumps immediately to any of the 100 timeline events, triggering its alert, audio cue, and cinematic scene.
   */
  public jumpToEvent(eventNumber: number): void {
    const clamped = Math.max(1, Math.min(this.eventCatalog.length, Math.round(eventNumber)));
    const targetDef = this.eventCatalog[clamped - 1];
    if (targetDef) {
      this.currentElapsed = targetDef.triggerTime;
      this.timelineElapsed = targetDef.triggerTime;
      this.triggerEvent(targetDef);
    }
  }

  /**
   * 16. Evaluates smoothly blended physical forces for the player spaceship
   */
  public getShipImpactForces(timeSec: number): ShipImpactForces {
    if (!this.activeEvent) {
      return {
        lateralForce: 0,
        steeringResistance: 0,
        velocityDisturbance: 0,
        pitchDisturbance: 0,
        rollDisturbance: 0,
        yawDisturbance: 0,
        cameraShake: 0,
        fovDistortion: 0,
        hudInterference: 0,
        shieldStress: 0,
        navigationInterference: 0,
      };
    }

    const sev = this.activeEvent.severity;
    const wave = Math.sin(timeSec * 3.5) * 0.5 + Math.sin(timeSec * 7.2) * 0.25;

    // Lateral force and steering resistance
    const lateralForce = wave * (sev * 0.35);
    const steeringResistance = Math.min(0.45, (sev / 10) * 0.45);

    // Velocity fluctuation
    const velocityDisturbance = Math.cos(timeSec * 2.0) * (sev * 0.6);

    // Pitch / roll perturbations
    const pitchDisturbance = Math.sin(timeSec * 4.2) * (sev * 0.02);
    const rollDisturbance = Math.cos(timeSec * 3.8) * (sev * 0.035);
    const yawDisturbance = Math.sin(timeSec * 2.5) * (sev * 0.015);

    // Camera shake & FOV
    const isWaveEvent =
      this.activeEvent.index === 3 ||
      this.activeEvent.index === 8 ||
      this.activeEvent.index === 15 ||
      this.activeEvent.index === 18 ||
      this.activeEvent.index === 40;
    const fovDistortion = isWaveEvent ? Math.sin(timeSec * 4.0) * (sev * 1.8) : 0;
    const cameraShake = Math.max(this.cameraShake, (sev / 10) * 0.8 + Math.abs(wave) * 0.4);

    // HUD glitch
    const hudInterference = (sev >= 6 ? (sev - 5) * 0.18 : 0) * (0.8 + Math.random() * 0.4);

    return {
      lateralForce,
      steeringResistance,
      velocityDisturbance,
      pitchDisturbance,
      rollDisturbance,
      yawDisturbance,
      cameraShake,
      fovDistortion,
      hudInterference: Math.min(1.0, hudInterference),
      shieldStress: (sev / 10) * 0.3,
      navigationInterference: this.navigationInterference,
    };
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.nextEventTime = 0.1;
    this.activeEvent = null;
    this.eventHistory = [];
    this.previousElapsed = 0;
    this.currentElapsed = 0;
    this.timelineElapsed = 0;
    this.absoluteCollapse = false;
    this.gravityStrength = 0.2;
    this.tidalForce = 0.15;
    this.debrisVelocity = 30;
    this.routeCollapseSpeed = 40;
    this.destructionFrontSpeed = 55;
    this.environmentalInstability = 0.2;
    this.gravitationalLensing = 0.15;
    this.cameraShake = 0;
    this.audioIntensity = 0.2;
    this.infallRate = 0.2;
    this.orbitalInstability = 0.2;
    this.navigationInterference = 0;
    this.cinematicHandler.resetImmediately();
  }
}

/* =========================================================================
   SUB-SYSTEM 3: EvacuationTowerManager (EvacuationTower)
   Physical 3D world geometry for the safe-zone facility.
   ========================================================================= */
export class EvacuationTowerManager {
  public towerRoot: THREE.Group | null = null;
  public entranceCenter = new THREE.Vector3(0, 0, -900);
  public bay07Center = new THREE.Vector3(0, -14, -1085);
  public isSealed = false;

  public initialize(scene: THREE.Scene, entrancePos: THREE.Vector3, bay07Pos: THREE.Vector3): void {
    this.entranceCenter.copy(entrancePos);
    this.bay07Center.copy(bay07Pos);
    this.isSealed = false;
  }

  public seal(): void {
    this.isSealed = true;
    sound.playBlastDoorClose();
  }

  public reset(): void {
    this.isSealed = false;
  }
}
export type EvacuationTower = EvacuationTowerManager;

/* =========================================================================
   SUB-SYSTEM 4: EvacuationRouteManager
   47. Failure Fairness: Directional safe-zone arrow, real distance meter,
   audio & visual warning triggers.
   ========================================================================= */
export class EvacuationRouteManager {
  public distanceToTowerM = 9999;
  public navArrowVector = new THREE.Vector3(0, 0, -1);
  public navArrowAngleDeg = 0;
  public warningText = '';
  public objectiveText = 'REACH THE SAFE ZONE';

  public update(
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    towerEntranceWorldPosition: THREE.Vector3,
    evacuation: EvacuationManager,
    shelterZ: number
  ): void {
    if (!evacuation.evacuationActive) {
      this.warningText = '';
      this.objectiveText = evacuation.evacuationSuccess ? 'SAFE ZONE SECURED' : 'SURVIVE THE EIGHT-MINUTE QUANTUM COLLAPSE WINDOW';
      return;
    }

    this.distanceToTowerM = Math.round(playerPosition.distanceTo(towerEntranceWorldPosition));

    // Directional Safe-Zone Arrow
    const dirWorld = towerEntranceWorldPosition.clone().sub(playerPosition).normalize();
    const shipFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuaternion);
    const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(playerQuaternion);

    const fwdDot = shipFwd.dot(dirWorld);
    const rightDot = shipRight.dot(dirWorld);
    this.navArrowAngleDeg = Math.round(Math.atan2(rightDot, fwdDot) * (180 / Math.PI));
    this.navArrowVector.copy(dirWorld);

    // 12. Distance Warnings
    if (this.distanceToTowerM > 2000) {
      this.warningText = `SAFE ZONE: ${this.distanceToTowerM}m`;
    } else if (this.distanceToTowerM > 1000) {
      this.warningText = `SAFE ZONE: ${this.distanceToTowerM}m`;
    } else if (this.distanceToTowerM > 500) {
      this.warningText = 'WARNING — ROUTE INSTABILITY';
    } else if (this.distanceToTowerM > 250) {
      this.warningText = 'CRITICAL — REACH THE TOWER';
    } else if (this.distanceToTowerM > 100) {
      this.warningText = 'EMERGENCY — SAFE ZONE CLOSING';
    } else if (this.distanceToTowerM > 40) {
      this.warningText = 'FINAL WARNING';
    } else {
      this.warningText = 'EVACUATION ENTRANCE AHEAD';
    }

    // Objective chain
    switch (evacuation.evacuationState) {
      case 'TOWER_APPROACHING':
        this.objectiveText = this.distanceToTowerM <= 160 ? 'REACH THE ORBITAL LAUNCHER' : 'REACH THE QUANTUM LAUNCH ROUTE';
        break;
      case 'TOWER_ENTERED':
        this.objectiveText = shelterZ <= -32 ? 'MAGNETIC LOCK // ACCELERATION RING 1' : 'ORBITAL LAUNCHER ENTERED';
        break;
      case 'BASEMENT_ENTERED':
        this.objectiveText = 'ACCELERATION RING 1 // BUILDING VELOCITY';
        break;
      case 'HANGAR_ENTERED':
        this.objectiveText = 'ACCELERATION RING 2 // RING 3 AHEAD';
        break;
      case 'PARKING_BAY_ENTERED':
        this.objectiveText = 'ACCELERATION RING 3 // FINAL BOOST';
        break;
      case 'SHIP_ALIGNED':
        this.objectiveText = 'ORBITAL GATE // ESCAPE VECTOR CALCULATING';
        break;
      case 'SHIP_PARKED':
        this.objectiveText = 'ESCAPE VECTOR // DOCKING BAY APPROACH';
        break;
      case 'SHIP_SECURED':
        this.objectiveText = 'SHIP SECURED // ORBITAL ESCAPE COMPLETE';
        break;
    }
  }

  public reset(): void {
    this.distanceToTowerM = 9999;
    this.warningText = '';
    this.objectiveText = 'REACH THE SAFE ZONE';
  }
}

/* =========================================================================
   SUB-SYSTEM 5: RouteCollapseManager
   13. REAL ROUTE COLLAPSE: Real PathSegments transition:
   SAFE -> UNSTABLE -> COLLAPSING -> DESTROYED -> CONSUMED.
   Never instantly delete track. Physical disintegration breakdown.
   Escape window: 5.0 seconds. Trapped -> ROUTE_CONSUMED_BY_SINGULARITY.
   ========================================================================= */
export class RouteCollapseManager {
  private segments: PathSegment[] = [];
  private segmentStates: Map<string, {
    state: TrackSegmentCollapseState;
    vibration: number;
    collapseProgress: number;
    timer: number;
  }> = new Map();

  public playerOnCollapsingSegment = false;
  public escapeWindowRemainingSeconds = 5.0;
  private readonly escapeWindowTotal = 5.0;

  public setSegments(segments: PathSegment[]): void {
    this.segments = segments;
    this.segmentStates.clear();
    for (const seg of segments) {
      this.segmentStates.set(seg.id, {
        state: 'SAFE',
        vibration: 0,
        collapseProgress: 0,
        timer: 0,
      });
    }
  }

  public update(
    dt: number,
    catastrophe: CatastropheEventManager,
    playerSplineT: number,
    totalTrackLengthM: number,
    playerInsideShelter: boolean,
    destructionFrontM: number
  ): { routeConsumedTriggered: boolean } {
    let playerSegmentState: TrackSegmentCollapseState = 'SAFE';

    for (const seg of this.segments) {
      const segData = this.segmentStates.get(seg.id);
      if (!segData) continue;

      const segMidM = (seg.startT + seg.endT) * 0.5 * totalTrackLengthM;

      if (playerSplineT >= seg.startT && playerSplineT <= seg.endT) {
        playerSegmentState = segData.state;
      }

      const distFromFront = segMidM - destructionFrontM;

      if (distFromFront <= -150) {
        segData.state = 'CONSUMED';
        segData.collapseProgress = 1.0;
        seg.isCollapsed = true;
      } else if (distFromFront <= 0) {
        segData.state = 'DESTROYED';
        segData.collapseProgress = 1.0;
        seg.isCollapsed = true;
      } else if (distFromFront <= 180) {
        segData.state = 'COLLAPSING';
        segData.timer += dt;
        segData.collapseProgress = Math.min(1.0, segData.timer / 4.0);
        segData.vibration = Math.min(1.5, segData.collapseProgress * 1.5 + Math.random() * 0.4);
        seg.isCollapsing = true;
      } else if (distFromFront <= 420 || catastrophe.currentEventIndex >= 1) {
        segData.state = 'UNSTABLE';
        segData.vibration = Math.min(0.6, catastrophe.environmentalInstability * 0.6 + Math.random() * 0.2);
      } else {
        segData.state = 'SAFE';
        segData.vibration = 0;
      }
    }

    // Escape window check
    if (!playerInsideShelter && playerSegmentState === 'COLLAPSING') {
      this.playerOnCollapsingSegment = true;
      this.escapeWindowRemainingSeconds = Math.max(0, this.escapeWindowRemainingSeconds - dt);
      if (this.escapeWindowRemainingSeconds <= 0) {
        return { routeConsumedTriggered: true };
      }
    } else {
      this.playerOnCollapsingSegment = false;
      this.escapeWindowRemainingSeconds = Math.min(
        this.escapeWindowTotal,
        this.escapeWindowRemainingSeconds + dt * 2.0
      );
    }

    return { routeConsumedTriggered: false };
  }

  public reset(): void {
    this.playerOnCollapsingSegment = false;
    this.escapeWindowRemainingSeconds = 5.0;
    this.segmentStates.forEach(data => {
      data.state = 'SAFE';
      data.vibration = 0;
      data.collapseProgress = 0;
      data.timer = 0;
    });
  }
}

/* =========================================================================
   SUB-SYSTEM 6: DestructionFrontManager (DestructionFront)
   14. Physical moving destruction front advancing along track world coordinates.
   ========================================================================= */
export class DestructionFrontManager {
  public progressM = 0;
  public distanceToPlayerM = 2500;

  public update(
    dt: number,
    catastrophe: CatastropheEventManager,
    playerSplineT: number,
    totalTrackLengthM: number,
    evacuationActive: boolean
  ): boolean {
    if (!evacuationActive) return false;

    const speed = catastrophe.destructionFrontSpeed;
    this.progressM += speed * dt;

    const playerTrackPosM = playerSplineT * totalTrackLengthM;
    this.distanceToPlayerM = Math.max(0, playerTrackPosM - this.progressM);

    return this.distanceToPlayerM <= 0;
  }

  public reset(): void {
    this.progressM = 0;
    this.distanceToPlayerM = 2500;
  }
}
export type DestructionFront = DestructionFrontManager;

/* =========================================================================
   SUB-SYSTEM 7: ParkingManager (ParkingController)
   8. Physical tolerances: position <= 2.2m, rotation <= 15 deg, speed <= 0.8 m/s.
   Automatic parking assist brings velocity to 0 without snapping/teleporting.
   ========================================================================= */
export class ParkingManager {
  public readonly positionToleranceM = 2.2;
  public readonly rotationToleranceDeg = 15;
  public readonly speedThresholdMps = 0.8; // ~2.9 km/h

  public isAligned = false;
  public isParked = false;

  public evaluate(
    shelterX: number,
    shelterZ: number,
    shelterHeading: number,
    playerSpeedMps: number
  ): { isAligned: boolean; isParked: boolean } {
    const bayDist = Math.hypot(shelterX, shelterZ - (-185));
    const rotDeg = Math.abs(shelterHeading) * (180 / Math.PI);

    this.isAligned = bayDist <= this.positionToleranceM && rotDeg <= this.rotationToleranceDeg;
    this.isParked = this.isAligned && (playerSpeedMps <= this.speedThresholdMps || shelterZ <= -184.8);

    return { isAligned: this.isAligned, isParked: this.isParked };
  }

  public reset(): void {
    this.isAligned = false;
    this.isParked = false;
  }
}
export type ParkingController = ParkingManager;

/* =========================================================================
   SUB-SYSTEM 8: ParkingClampController
   Sequential clamping: LEFT -> RIGHT -> FRONT -> REAR
   ========================================================================= */
export class ParkingClampController {
  public clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
  public clampStep = 0;
  public clampTimer = 0;
  public isSecured = false;

  public update(dt: number, shipParked: boolean): boolean {
    if (!shipParked) return false;

    this.clampTimer += dt;
    const t = this.clampTimer;

    const cL = THREE.MathUtils.clamp(t / 0.6, 0, 1);
    if (t >= 0.6 && this.clampStep < 1) {
      this.clampStep = 1;
      sound.playClampLock(0);
    }

    const cR = THREE.MathUtils.clamp((t - 0.7) / 0.6, 0, 1);
    if (t >= 1.3 && this.clampStep < 2) {
      this.clampStep = 2;
      sound.playClampLock(1);
    }

    const cF = THREE.MathUtils.clamp((t - 1.4) / 0.6, 0, 1);
    if (t >= 2.0 && this.clampStep < 3) {
      this.clampStep = 3;
      sound.playClampLock(2);
    }

    const cB = THREE.MathUtils.clamp((t - 2.1) / 0.6, 0, 1);
    if (t >= 2.7 && this.clampStep < 4) {
      this.clampStep = 4;
      sound.playClampLock(3);
    }

    this.clampProgress = { left: cL, right: cR, front: cF, rear: cB };

    if (t >= 2.8 && !this.isSecured) {
      this.isSecured = true;
      sound.playShieldHit();
      return true;
    }

    return this.isSecured;
  }

  public reset(): void {
    this.clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
    this.clampStep = 0;
    this.clampTimer = 0;
    this.isSecured = false;
  }
}

/* =========================================================================
   SUB-SYSTEM 9: SuccessFailureManager
   Authoritative arbiter of terminal failure locks and final outcome generation.
   ========================================================================= */
export class SuccessFailureManager {
  public isLocked = false;
  public survivalConfirmed = false;
  public failureLocked = false;
  public failureCause: FailureCause | null = null;

  public lockFailure(cause: FailureCause): void {
    if (this.survivalConfirmed || this.failureLocked) return;
    this.failureLocked = true;
    this.isLocked = true;
    this.failureCause = cause;
  }

  public lockSuccess(): void {
    if (this.failureLocked) return;
    this.survivalConfirmed = true;
    this.isLocked = true;
  }

  public reset(): void {
    this.isLocked = false;
    this.survivalConfirmed = false;
    this.failureLocked = false;
    this.failureCause = null;
  }
}

/* =========================================================================
   SUB-SYSTEM 10: CollapseCinematicCoordinator
   Presentation-only cinematic coordination:
   - Failure Cinematics: 7-phase Route-Consumption & General Failure
   - Success Cinematics: 15-phase Aftermath
   ========================================================================= */
export class CollapseCinematicCoordinator {
  public isActive = false;
  public elapsed = 0;

  public start(): void {
    this.isActive = true;
    this.elapsed = 0;
  }

  public update(dt: number): void {
    if (!this.isActive) return;
    this.elapsed += dt;
  }

  public reset(): void {
    this.isActive = false;
    this.elapsed = 0;
  }
}
export type EvacuationCinematicController = CollapseCinematicCoordinator;

/* =========================================================================
   SUB-SYSTEM 11: FailureCinematicController
   34. ROUTE-CONSUMPTION FAILURE CINEMATIC (7 DISTINCT PHASES):
   Starts at player's exact physical world position.
   Phase 1: Camera moves behind/above ship; track ahead breaks.
   Phase 2: Track cracks, breaks, detaches, falls inward, consumed.
   Phase 3: Ship loses route support, drifts, controls difficult.
   Phase 4: Track beneath breaks; ship remains at its actual failure location.
   Phase 5: Camera moves behind ship; collapsing environment dominates.
   Phase 6: Environmental shockwaves and route destruction, with the ship intact.
   Phase 7: Camera pulls away to show the collapse; ship is never captured or absorbed.
   ========================================================================= */
export class FailureCinematicController {
  public isActive = false;
  public isRouteConsumption = false;
  public elapsed = 0;
  public currentPhase = 1;
  public totalProgress = 0;
  public blackScreenActive = false;
  public completed = false;
  public endingVariant: 'STANDARD' | 'MISSED_ESCAPE_COLLAPSE' = 'STANDARD';

  public shipInitialPosition = new THREE.Vector3();
  public shipCurrentTrajectory = new THREE.Vector3();
  public shipRotation = new THREE.Euler();

  // Section 35: 11 Distinct Phases for Full Cosmic Collapse Ending (total 21.5s)
  // Phase 1 (0-2.5s): Camera moves behind/above ship; track ahead breaks.
  // Phase 2 (2.5-5.0s): Track cracks, breaks, detaches, falls inward.
  // Phase 3 (5.0-7.5s): Ship loses route support, drifts, controls difficult.
  // Phase 4 (7.5-10.0s): Track beneath breaks; ship remains at its actual location.
  // Phase 5 (10.0-12.5s): Camera behind ship; collapsing environment dominates.
  // Phase 6 (12.5-14.5s): Environmental shockwaves; ship remains intact.
  // Phase 7 (14.5-15.5s): Wide environmental collapse shot; ship remains visible.
  // Phase 8 (15.5-16.5s): Complete silence + darkness (0.5–1s).
  // Section 35: Standard failure durations
  private readonly rcPhaseDurations = [2.5, 2.5, 2.5, 2.5, 2.5, 2.0, 1.0, 1.0, 1.7, 2.0, 1.3];
  private readonly gfPhaseDurations = [2.5, 2.5, 2.5, 2.5, 1.0, 1.0, 1.7, 2.0, 1.3];

  // SUBMODE 10: 100 SEQUENTIAL EVENTS ACROSS EXACTLY 20 MINUTES (1,200 SECONDS)
  // Each event is exactly 12.0 seconds (100 × 12 = 1,200 seconds = 20:00)
  private readonly missedEscapePhaseDurations = new Array(100).fill(12.0);
  private phaseTriggered: Set<number> = new Set();

  // Procedural 3D Visual Groups for 20-Minute 100-Event Cosmic Collapse Climax
  private sceneRef: THREE.Scene | null = null;
  private ringGroup: THREE.Group | null = null;
  private detonationSphere: THREE.Mesh | null = null;
  private shockwaveRings: THREE.Mesh[] = [];
  private spectacleGroup: THREE.Group | null = null;
  private rebuildTracksGroup: THREE.Group | null = null;

  // Mode 21 Submode 10 Specification 3D Elements:
  private planetsGroup: THREE.Group | null = null;
  private planetAMesh: THREE.Mesh | null = null;
  private planetBMesh: THREE.Mesh | null = null;
  private impactFlashMesh: THREE.Mesh | null = null;
  private collisionDebrisGroup: THREE.Group | null = null;

  private fracturedRouteGroup: THREE.Group | null = null;
  private routeSlabs: THREE.Mesh[] = [];

  // Exactly 10 Distinct Wave Releases above and below the main plane (Events 22 to 31)
  private gravWaveUpperMeshes: THREE.Mesh[] = [];
  private gravWaveLowerMeshes: THREE.Mesh[] = [];

  // Separate Upper & Lower Debris Rings (Events 32 to 42, 88 to 91)
  private upperDebrisRing: THREE.Group | null = null;
  private lowerDebrisRing: THREE.Group | null = null;

  // Climax White Flash & Universe Regeneration
  private flashOverlayMesh: THREE.Mesh | null = null;
  private regenerationGroup: THREE.Group | null = null;
  private restoredStarfield: THREE.Points | null = null;
  private restoredPlanetsGroup: THREE.Group | null = null;
  private navigationBeaconsGroup: THREE.Group | null = null;

  public start(
    isRouteConsumption: boolean,
    startPosition?: THREE.Vector3,
    endingVariant: 'STANDARD' | 'MISSED_ESCAPE_COLLAPSE' = 'STANDARD',
    scene?: THREE.Scene,
    blackHoleCenter?: THREE.Vector3
  ): void {
    this.isActive = true;
    this.isRouteConsumption = isRouteConsumption;
    this.endingVariant = endingVariant;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
    this.phaseTriggered.clear();

    if (startPosition) {
      this.shipInitialPosition.copy(startPosition);
      this.shipCurrentTrajectory.copy(startPosition);
    }

    if (endingVariant === 'MISSED_ESCAPE_COLLAPSE' && scene && blackHoleCenter) {
      this.initVisuals(scene, blackHoleCenter);
    }

    sound.playEmergencyAlarm();
    sound.playGravitationalRumble(4.0);
  }

  public initVisuals(scene: THREE.Scene, bhCenter: THREE.Vector3): void {
    this.disposeVisuals();
    this.sceneRef = scene;

    // 1. Moving & Colliding Planets (Events 2 to 5, 10, 38, 93)
    this.planetsGroup = new THREE.Group();
    this.planetsGroup.name = 'FinalCollapse_Planets';
    this.planetsGroup.position.copy(bhCenter);

    const planetAGeo = new THREE.SphereGeometry(130, 24, 24);
    const planetAMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4,
    });
    this.planetAMesh = new THREE.Mesh(planetAGeo, planetAMat);
    this.planetAMesh.position.set(1650, 350, -1150);
    this.planetsGroup.add(this.planetAMesh);

    const planetBGeo = new THREE.SphereGeometry(100, 24, 24);
    const planetBMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0xc2410c,
      emissiveIntensity: 0.5,
    });
    this.planetBMesh = new THREE.Mesh(planetBGeo, planetBMat);
    this.planetBMesh.position.set(750, 150, -450);
    this.planetsGroup.add(this.planetBMesh);

    // Dramatic non-graphic cosmic flash at collision point (1200, 250, -800)
    const flashGeo = new THREE.SphereGeometry(160, 24, 24);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.impactFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.impactFlashMesh.position.set(1200, 250, -800);
    this.planetsGroup.add(this.impactFlashMesh);

    // Collision debris cloud (36 fragments)
    this.collisionDebrisGroup = new THREE.Group();
    this.collisionDebrisGroup.position.set(1200, 250, -800);
    const rockGeo = new THREE.BoxGeometry(16, 16, 20);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
      emissive: 0xff5500,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 36; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const theta = (i / 36) * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const r = 25 + Math.random() * 40;
      rock.position.set(
        Math.cos(theta) * Math.cos(phi) * r,
        Math.sin(phi) * r,
        Math.sin(theta) * Math.cos(phi) * r
      );
      rock.userData = {
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 45,
          (Math.random() - 0.5) * 60
        ),
      };
      this.collisionDebrisGroup.add(rock);
    }
    this.planetsGroup.add(this.collisionDebrisGroup);
    scene.add(this.planetsGroup);

    // 2. Physical Route Sections Splitting and Separating (Events 6 to 9, 13, 35, 39)
    this.fracturedRouteGroup = new THREE.Group();
    this.fracturedRouteGroup.name = 'FinalCollapse_FracturedRoute';
    this.fracturedRouteGroup.position.copy(bhCenter);
    this.routeSlabs = [];

    const slabGeo = new THREE.BoxGeometry(34, 4, 75);
    for (let s = 0; s < 14; s++) {
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.3,
        emissive: s % 2 === 0 ? 0x00f0ff : 0x06b6d4,
        emissiveIntensity: 1.2,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      const baseZ = -450 + s * 70;
      const baseX = Math.sin(s * 0.3) * 60;
      const baseY = -20 + Math.cos(s * 0.25) * 15;
      slab.position.set(baseX, baseY, baseZ);
      slab.userData = {
        basePos: new THREE.Vector3(baseX, baseY, baseZ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 0.8
        ),
        driftDir: new THREE.Vector3(
          (Math.random() - 0.5) * 350,
          (Math.random() - 0.5) * 180,
          (Math.random() - 0.5) * 350
        ),
      };
      this.routeSlabs.push(slab);
      this.fracturedRouteGroup.add(slab);
    }
    scene.add(this.fracturedRouteGroup);

    // 3. Initial Debris Ring & Accretion Flare (Events 15, 16, 19, 20)
    this.ringGroup = new THREE.Group();
    this.ringGroup.name = 'FinalCollapse_DebrisRing';
    this.ringGroup.position.copy(bhCenter);
    this.ringGroup.visible = false;
    const ringGeo = new THREE.BoxGeometry(16, 4, 32);
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const radius = 620 + Math.random() * 320;
      const mat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x00f0ff : (i % 3 === 1 ? 0xffaa00 : 0xa855f7),
        emissive: i % 2 === 0 ? 0x00f0ff : 0xff5500,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 60,
        Math.sin(angle) * radius
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.ringGroup.add(mesh);
    }
    scene.add(this.ringGroup);

    // 4. Exactly 10 Distinct Gravitational Waves above and below the main plane (Events 22 to 31)
    this.gravWaveUpperMeshes = [];
    this.gravWaveLowerMeshes = [];
    const waveColors = [
      0x00f0ff, 0x38bdf8, 0x818cf8, 0xa855f7, 0xc084fc,
      0xf472b6, 0xfb923c, 0xfacc15, 0x4ade80, 0xffffff,
    ];

    for (let w = 0; w < 10; w++) {
      // Upper Wavefront (expanding upwards +Y and radially)
      const upperGeo = new THREE.RingGeometry(85, 115, 64);
      const upperMat = new THREE.MeshBasicMaterial({
        color: waveColors[w],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const upperMesh = new THREE.Mesh(upperGeo, upperMat);
      upperMesh.position.copy(bhCenter);
      upperMesh.position.y += 35;
      upperMesh.rotation.x = Math.PI / 2;
      upperMesh.visible = false;
      this.gravWaveUpperMeshes.push(upperMesh);
      scene.add(upperMesh);

      // Lower Wavefront (expanding downwards -Y and radially)
      const lowerGeo = new THREE.RingGeometry(85, 115, 64);
      const lowerMat = new THREE.MeshBasicMaterial({
        color: waveColors[w],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const lowerMesh = new THREE.Mesh(lowerGeo, lowerMat);
      lowerMesh.position.copy(bhCenter);
      lowerMesh.position.y -= 35;
      lowerMesh.rotation.x = Math.PI / 2;
      lowerMesh.visible = false;
      this.gravWaveLowerMeshes.push(lowerMesh);
      scene.add(lowerMesh);
    }

    // 5. Separate Upper & Lower Debris Rings (Events 32 to 42, 88 to 91)
    this.upperDebrisRing = new THREE.Group();
    this.upperDebrisRing.name = 'FinalCollapse_UpperDebrisRing';
    this.upperDebrisRing.position.copy(bhCenter);
    this.upperDebrisRing.position.y += 95;
    this.upperDebrisRing.visible = false;

    this.lowerDebrisRing = new THREE.Group();
    this.lowerDebrisRing.name = 'FinalCollapse_LowerDebrisRing';
    this.lowerDebrisRing.position.copy(bhCenter);
    this.lowerDebrisRing.position.y -= 95;
    this.lowerDebrisRing.visible = false;

    const ringBitGeo = new THREE.BoxGeometry(18, 5, 24);
    for (let i = 0; i < 64; i++) {
      const uAngle = (i / 64) * Math.PI * 2;
      const uRad = 580 + Math.random() * 260;
      const uMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.9,
      });
      const uMesh = new THREE.Mesh(ringBitGeo, uMat);
      uMesh.position.set(Math.cos(uAngle) * uRad, (Math.random() - 0.5) * 30, Math.sin(uAngle) * uRad);
      uMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.upperDebrisRing.add(uMesh);

      const lAngle = (i / 64) * Math.PI * 2 + 0.3;
      const lRad = 560 + Math.random() * 260;
      const lMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x9333ea,
        emissiveIntensity: 1.9,
      });
      const lMesh = new THREE.Mesh(ringBitGeo, lMat);
      lMesh.position.set(Math.cos(lAngle) * lRad, (Math.random() - 0.5) * 30, Math.sin(lAngle) * lRad);
      lMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.lowerDebrisRing.add(lMesh);
    }
    scene.add(this.upperDebrisRing);
    scene.add(this.lowerDebrisRing);

    // 6. Singularity Detonation Core & Shockwaves
    const ruptureGeo = new THREE.SphereGeometry(50, 32, 32);
    const ruptureMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.detonationSphere = new THREE.Mesh(ruptureGeo, ruptureMat);
    this.detonationSphere.position.copy(bhCenter);
    this.detonationSphere.visible = false;
    scene.add(this.detonationSphere);

    this.shockwaveRings = [];
    const ringColors = [0x00f0ff, 0xa855f7, 0xf59e0b, 0xef4444, 0xffffff];
    for (let i = 0; i < 5; i++) {
      const ringGeom = new THREE.RingGeometry(80 + i * 50, 105 + i * 50, 48);
      const ringM = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const rMesh = new THREE.Mesh(ringGeom, ringM);
      rMesh.position.copy(bhCenter);
      rMesh.rotation.x = Math.PI / 2;
      rMesh.visible = false;
      this.shockwaveRings.push(rMesh);
      scene.add(rMesh);
    }

    // 7. Prismatic Cosmic Nebula Spectacle
    this.spectacleGroup = new THREE.Group();
    this.spectacleGroup.name = 'FinalCollapse_Spectacle';
    this.spectacleGroup.position.copy(bhCenter);
    this.spectacleGroup.visible = false;
    const cloudColors = [0x0284c7, 0x06b6d4, 0x7c3aed, 0xc026d3, 0xf59e0b, 0xffffff];
    for (let i = 0; i < 30; i++) {
      const planeGeo = new THREE.PlaneGeometry(850 + (i % 5) * 300, 700 + (i % 4) * 250);
      const col = cloudColors[i % cloudColors.length];
      const planeMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      const ang = (i / 30) * Math.PI * 2;
      const dist = 450 + Math.random() * 1100;
      plane.position.set(Math.cos(ang) * dist, (Math.random() - 0.5) * 500, Math.sin(ang) * dist);
      plane.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.spectacleGroup.add(plane);
    }
    scene.add(this.spectacleGroup);

    // 8. Brilliant White Flash Mesh (Event 50)
    const flashScreenGeo = new THREE.SphereGeometry(4500, 16, 16);
    const flashScreenMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.flashOverlayMesh = new THREE.Mesh(flashScreenGeo, flashScreenMat);
    this.flashOverlayMesh.position.copy(bhCenter);
    this.flashOverlayMesh.visible = false;
    scene.add(this.flashOverlayMesh);

    // 9. Universe Regeneration Group (Events 51 to 77, 99 to 100)
    this.regenerationGroup = new THREE.Group();
    this.regenerationGroup.name = 'FinalCollapse_Regeneration';
    this.regenerationGroup.position.copy(bhCenter);
    this.regenerationGroup.visible = false;

    // Restored Starfield
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 3200 + Math.random() * 2400;
      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = dist * Math.cos(phi);

      const isCyan = Math.random() > 0.4;
      starColors[i * 3] = isCyan ? 0.3 : 1.0;
      starColors[i * 3 + 1] = isCyan ? 0.8 : 0.9;
      starColors[i * 3 + 2] = 1.0;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.restoredStarfield = new THREE.Points(starGeo, starMat);
    this.regenerationGroup.add(this.restoredStarfield);

    // Restored Planetary Orbits (Events 54 to 55)
    this.restoredPlanetsGroup = new THREE.Group();
    const rPlanA = new THREE.Mesh(
      new THREE.SphereGeometry(110, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.5,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      })
    );
    rPlanA.position.set(2200, 200, -1800);
    this.restoredPlanetsGroup.add(rPlanA);

    const rPlanB = new THREE.Mesh(
      new THREE.SphereGeometry(85, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfb923c,
        roughness: 0.6,
        emissive: 0xea580c,
        emissiveIntensity: 0.5,
      })
    );
    rPlanB.position.set(-1900, -150, 1600);
    this.restoredPlanetsGroup.add(rPlanB);
    this.regenerationGroup.add(this.restoredPlanetsGroup);

    // Navigation Beacons (Event 65)
    this.navigationBeaconsGroup = new THREE.Group();
    const beaconGeo = new THREE.CylinderGeometry(3, 3, 20, 8);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
    });
    for (let b = 0; b < 10; b++) {
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(-40 + (b % 2) * 80, 10, -400 + b * 90);
      this.navigationBeaconsGroup.add(beacon);
    }
    this.regenerationGroup.add(this.navigationBeaconsGroup);

    // Holographic Reconstructed Route Tracks (Events 56 to 58)
    this.rebuildTracksGroup = new THREE.Group();
    this.rebuildTracksGroup.name = 'FinalCollapse_RebuildRoutes';
    this.rebuildTracksGroup.position.copy(bhCenter);
    this.rebuildTracksGroup.visible = false;
    const trackColors = [0x00f0ff, 0x38bdf8, 0x34d399, 0xf59e0b];
    for (let r = 0; r < 6; r++) {
      const curvePts: THREE.Vector3[] = [];
      const rot = (r / 6) * Math.PI * 2;
      for (let s = 0; s <= 20; s++) {
        const u = s / 20;
        const rad = 250 + u * 1600;
        const theta = rot + u * 1.5;
        curvePts.push(
          new THREE.Vector3(
            Math.cos(theta) * rad,
            15 + Math.sin(u * Math.PI) * 40,
            Math.sin(theta) * rad
          )
        );
      }
      const tubeGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(curvePts),
        32,
        2.8,
        8,
        false
      );
      const tubeMat = new THREE.MeshBasicMaterial({
        color: trackColors[r % trackColors.length],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.rebuildTracksGroup.add(tubeMesh);
    }
    scene.add(this.rebuildTracksGroup);
    scene.add(this.regenerationGroup);
  }

  public disposeVisuals(): void {
    if (this.sceneRef) {
      if (this.planetsGroup) {
        this.sceneRef.remove(this.planetsGroup);
        this.planetsGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.planetsGroup = null;
        this.planetAMesh = null;
        this.planetBMesh = null;
        this.impactFlashMesh = null;
        this.collisionDebrisGroup = null;
      }
      if (this.fracturedRouteGroup) {
        this.sceneRef.remove(this.fracturedRouteGroup);
        this.fracturedRouteGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.fracturedRouteGroup = null;
        this.routeSlabs = [];
      }
      if (this.ringGroup) {
        this.sceneRef.remove(this.ringGroup);
        this.ringGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.ringGroup = null;
      }
      this.gravWaveUpperMeshes.forEach(m => {
        this.sceneRef?.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      this.gravWaveUpperMeshes = [];

      this.gravWaveLowerMeshes.forEach(m => {
        this.sceneRef?.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      this.gravWaveLowerMeshes = [];

      if (this.upperDebrisRing) {
        this.sceneRef.remove(this.upperDebrisRing);
        this.upperDebrisRing.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.upperDebrisRing = null;
      }
      if (this.lowerDebrisRing) {
        this.sceneRef.remove(this.lowerDebrisRing);
        this.lowerDebrisRing.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.lowerDebrisRing = null;
      }
      if (this.detonationSphere) {
        this.sceneRef.remove(this.detonationSphere);
        this.detonationSphere.geometry.dispose();
        (this.detonationSphere.material as THREE.Material).dispose();
        this.detonationSphere = null;
      }
      this.shockwaveRings.forEach(r => {
        this.sceneRef?.remove(r);
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      this.shockwaveRings = [];
      if (this.spectacleGroup) {
        this.sceneRef.remove(this.spectacleGroup);
        this.spectacleGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.spectacleGroup = null;
      }
      if (this.flashOverlayMesh) {
        this.sceneRef.remove(this.flashOverlayMesh);
        this.flashOverlayMesh.geometry.dispose();
        (this.flashOverlayMesh.material as THREE.Material).dispose();
        this.flashOverlayMesh = null;
      }
      if (this.rebuildTracksGroup) {
        this.sceneRef.remove(this.rebuildTracksGroup);
        this.rebuildTracksGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.rebuildTracksGroup = null;
      }
      if (this.regenerationGroup) {
        this.sceneRef.remove(this.regenerationGroup);
        this.regenerationGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.regenerationGroup = null;
        this.restoredStarfield = null;
        this.restoredPlanetsGroup = null;
        this.navigationBeaconsGroup = null;
      }
      this.sceneRef = null;
    }
  }

  public update(dt: number, blackHoleCenter: THREE.Vector3, scene?: THREE.Scene): void {
    if (!this.isActive || this.completed) return;

    this.elapsed += dt;
    const durations =
      this.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
        ? this.missedEscapePhaseDurations
        : (this.isRouteConsumption ? this.rcPhaseDurations : this.gfPhaseDurations);
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    this.totalProgress = Math.min(1.0, this.elapsed / totalDuration);

    let accum = 0;
    let phase = durations.length;
    for (let i = 0; i < durations.length; i++) {
      accum += durations[i];
      if (this.elapsed < accum) {
        phase = i + 1;
        break;
      }
    }
    this.currentPhase = phase;

    // Lazily initialize 3D visuals if scene is provided
    if (this.endingVariant === 'MISSED_ESCAPE_COLLAPSE' && scene && !this.sceneRef) {
      this.initVisuals(scene, blackHoleCenter);
    }

    // Physical continuous gravitational trajectory & orchestration for 20-Minute 100-Event Specification
    if (this.endingVariant === 'MISSED_ESCAPE_COLLAPSE') {
      const eventInfo = getFinalCollapse100Event(this.elapsed);
      this.currentPhase = eventInfo.eventNumber;
      this.totalProgress = eventInfo.totalProgress;
      const evNum = eventInfo.eventNumber;
      const progWithin = eventInfo.progressWithinEvent;

      // SUBMODE 10 ONLY: missed-safe-zone failure is environmental destruction,
      // NOT ship absorption, gravitational capture, spaghettification, or event-horizon crossing.
      // Keep the player's vessel fixed at its last real position while the
      // surrounding route and environment collapse. No capture trajectory or
      // forced ship rotation is applied.
      this.shipCurrentTrajectory.copy(this.shipInitialPosition);
      this.shipRotation.set(0, 0, 0);

      // 2. Audio Triggers for each of the 100 events
      if (!this.phaseTriggered.has(evNum)) {
        this.phaseTriggered.add(evNum);
        switch (evNum) {
          case 1:
            sound.playEmergencyAlarm();
            break;
          case 2:
            sound.playGravitationalRumble(3.0);
            break;
          case 3:
            sound.playStructureCreak();
            break;
          case 4:
            // First Planetary Collision (00:36-00:48)
            sound.playFlashbangBoom();
            sound.playDeepCosmicBoom();
            break;
          case 5:
            sound.playGravitationalWavePulse(1.5);
            break;
          case 6:
          case 7:
            sound.playStructureCreak();
            break;
          case 8:
            // Route Tears Apart (01:24-01:36)
            sound.playGravitationalWavePulse(2.0);
            sound.playStructureCreak();
            break;
          case 11:
            sound.playGravitationalRumble(4.0);
            break;
          case 15:
            // Initial Debris Ring forms
            sound.playShieldActivate();
            break;
          case 16:
            // Accretion Ring Ignition
            sound.playGravitationalWavePulse(2.2);
            break;
          case 19:
          case 20:
            // Criticality Pulses
            sound.playSubBassGravitationalImplosion();
            break;

          // Events 22 to 31: Exactly 10 Distinct Gravitational Waves
          case 22:
          case 23:
          case 24:
          case 25:
          case 26:
          case 27:
          case 28:
          case 29:
          case 30:
            sound.playGravitationalWavePulse(1.6 + (evNum - 22) * 0.2);
            break;
          case 31:
            // Wave 10 of 10: Climax wave release
            sound.playGravitationalWavePulse(3.5);
            sound.playDarkGravitationalShockwave();
            break;

          case 32:
          case 33:
            sound.playShieldDeflect();
            break;
          case 36:
            sound.playSubBassGravitationalImplosion();
            break;
          case 40:
          case 41:
            sound.playGravitationalRumble(3.5);
            break;
          case 46:
          case 47:
            sound.playDarkGravitationalShockwave();
            break;
          case 49:
            sound.playSubBassGravitationalImplosion();
            break;
          case 50:
            // Brilliant White Flash (09:48-10:00)
            sound.playFlashbangBoom();
            sound.playDeepCosmicBoom();
            break;
          case 51:
            sound.stopCosmicMusic();
            break;
          case 56:
            sound.playCheckpoint();
            break;
          case 65:
            sound.playCheckpoint();
            break;
          case 76:
            sound.playShieldActivate();
            break;
          case 88:
            sound.playGravitationalWavePulse(2.0);
            break;
          case 95:
            sound.playDarkGravitationalShockwave();
            break;
          case 100:
            sound.playCheckpoint();
            break;
        }
      }

      // 3. Moving & Colliding Planets (Events 1 to 5, 10, 38, 93)
      if (this.planetsGroup && this.planetAMesh && this.planetBMesh) {
        if (evNum <= 4) {
          // Drifting along crossing trajectories toward collision point (1200, 250, -800)
          const colProgress = THREE.MathUtils.clamp(this.elapsed / 48.0, 0, 1);
          this.planetAMesh.position.lerpVectors(
            new THREE.Vector3(1650, 350, -1150),
            new THREE.Vector3(1200, 250, -800),
            colProgress
          );
          this.planetBMesh.position.lerpVectors(
            new THREE.Vector3(750, 150, -450),
            new THREE.Vector3(1200, 250, -800),
            colProgress
          );
        } else if (evNum >= 5 && evNum <= 10) {
          // Collision debris expanding, planets disintegrating
          this.planetAMesh.visible = false;
          this.planetBMesh.visible = false;
        } else if (evNum >= 54) {
          // Restored planets in regeneration group take over
          this.planetAMesh.visible = false;
          this.planetBMesh.visible = false;
        }

        // Impact flash at Event 4
        if (this.impactFlashMesh) {
          if (evNum === 4) {
            this.impactFlashMesh.visible = true;
            const flashFade = Math.sin(progWithin * Math.PI);
            (this.impactFlashMesh.material as THREE.MeshBasicMaterial).opacity = flashFade * 0.95;
            this.impactFlashMesh.scale.setScalar(1.0 + progWithin * 8.0);
          } else {
            this.impactFlashMesh.visible = false;
          }
        }

        // Collision debris expansion
        if (this.collisionDebrisGroup) {
          if (evNum >= 4 && evNum <= 10) {
            this.collisionDebrisGroup.visible = true;
            this.collisionDebrisGroup.children.forEach(c => {
              const rock = c as THREE.Mesh;
              if (rock.userData.vel) {
                rock.position.addScaledVector(rock.userData.vel, dt * 0.4);
                rock.rotation.x += dt * 2.0;
                rock.rotation.y += dt * 1.5;
              }
            });
          } else {
            this.collisionDebrisGroup.visible = false;
          }
        }
      }

      // 4. Physical Route Sections Splitting and Separating (Events 6 to 9, 13, 35, 39)
      if (this.fracturedRouteGroup) {
        if (evNum >= 6 && evNum <= 39) {
          this.fracturedRouteGroup.visible = true;
          this.routeSlabs.forEach((slab, sIdx) => {
            if (evNum === 6 || evNum === 7) {
              // Seams opening: slight vibration & fissure glow
              slab.position.copy(slab.userData.basePos);
              slab.position.x += (Math.random() - 0.5) * 2.5;
              slab.position.y += (Math.random() - 0.5) * 1.5;
            } else if (evNum >= 8) {
              // Physically split apart, tumbling inward toward black hole
              const breakFrac = THREE.MathUtils.clamp((this.elapsed - 84.0) / 180.0, 0, 1);
              slab.position.lerp(
                new THREE.Vector3(0, 0, 0),
                Math.min(1, dt * (0.08 + sIdx * 0.01) * breakFrac)
              );
              slab.rotation.x += slab.userData.rotVel.x * dt;
              slab.rotation.y += slab.userData.rotVel.y * dt;
              slab.rotation.z += slab.userData.rotVel.z * dt;
            }
          });
        } else {
          this.fracturedRouteGroup.visible = false;
        }
      }

      // 5. Initial Debris Ring & Accretion Flare (Events 15, 16, 19, 20)
      if (this.ringGroup) {
        if (evNum >= 15 && evNum <= 50) {
          this.ringGroup.visible = true;
          this.ringGroup.rotation.y += dt * (1.2 + (evNum >= 16 ? 1.0 : 0));
          this.ringGroup.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.material && (m.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
              (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
                1.8 + Math.sin(this.elapsed * 4.0) * 1.0;
            }
          });
        } else {
          this.ringGroup.visible = false;
        }
      }

      // 6. Exactly 10 Distinct Gravitational Waves (Events 22 to 31)
      for (let w = 0; w < 10; w++) {
        const waveEvent = 22 + w;
        const upperM = this.gravWaveUpperMeshes[w];
        const lowerM = this.gravWaveLowerMeshes[w];

        if (evNum === waveEvent) {
          const wFrac = THREE.MathUtils.clamp(progWithin, 0, 1);
          if (upperM) {
            upperM.visible = true;
            upperM.scale.setScalar(1.0 + wFrac * 26.0);
            upperM.position.copy(blackHoleCenter);
            upperM.position.y += 35 + wFrac * 420; // Identifiable upper wavefront
            (upperM.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - wFrac) * 0.9);
          }
          if (lowerM) {
            lowerM.visible = true;
            lowerM.scale.setScalar(1.0 + wFrac * 26.0);
            lowerM.position.copy(blackHoleCenter);
            lowerM.position.y -= 35 + wFrac * 420; // Identifiable lower wavefront
            (lowerM.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - wFrac) * 0.9);
          }
        } else {
          if (upperM) upperM.visible = false;
          if (lowerM) lowerM.visible = false;
        }
      }

      // 7. Separate Upper & Lower Debris Rings (Events 32 to 42, 88 to 91)
      if (this.upperDebrisRing && this.lowerDebrisRing) {
        if (evNum >= 32 && evNum <= 50) {
          this.upperDebrisRing.visible = true;
          this.lowerDebrisRing.visible = (evNum >= 33);

          // Twin-Ring independent rotation
          this.upperDebrisRing.rotation.y += dt * 1.5;
          this.lowerDebrisRing.rotation.y -= dt * 1.2;

          // Resonance pulse at Event 36
          const pulse = evNum === 36 ? Math.sin(this.elapsed * 8.0) * 0.4 : 0;
          this.upperDebrisRing.position.y = blackHoleCenter.y + 95 + pulse * 20;
          this.lowerDebrisRing.position.y = blackHoleCenter.y - 95 - pulse * 20;

          // Inward spiral contraction (Events 37 to 42)
          if (evNum >= 37 && evNum <= 42) {
            const spiralFrac = THREE.MathUtils.clamp((this.elapsed - 432.0) / 72.0, 0, 1);
            const scale = 1.0 - spiralFrac * 0.65;
            this.upperDebrisRing.scale.set(scale, 1, scale);
            this.lowerDebrisRing.scale.set(scale, 1, scale);
          }
        } else {
          this.upperDebrisRing.visible = false;
          this.lowerDebrisRing.visible = false;
        }
      }

      // 8. Singularity Criticality Core & Shockwaves (Events 18 to 21, 46 to 48)
      if (evNum === 20 || evNum === 47) {
        const pulseElapsed = evNum === 20 ? (this.elapsed - 228.0) : (this.elapsed - 552.0);
        const pulseFrac = THREE.MathUtils.clamp(pulseElapsed / 12.0, 0, 1);
        if (this.detonationSphere) {
          this.detonationSphere.visible = true;
          this.detonationSphere.scale.setScalar(1.0 + pulseFrac * 36.0);
          (this.detonationSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            (1.0 - pulseFrac) * 0.9
          );
        }
        this.shockwaveRings.forEach((ring, idx) => {
          ring.visible = true;
          const rFrac = Math.max(0, pulseFrac - idx * 0.12);
          ring.scale.setScalar(1.0 + rFrac * 26.0);
          (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - rFrac) * 0.8);
        });
      } else {
        if (this.detonationSphere) this.detonationSphere.visible = false;
        this.shockwaveRings.forEach(r => (r.visible = false));
      }

      // 9. Brilliant White Flash (Events 49 to 51)
      if (this.flashOverlayMesh) {
        if (evNum === 49) {
          // White Flash Build-Up (no harsh strobe)
          this.flashOverlayMesh.visible = true;
          (this.flashOverlayMesh.material as THREE.MeshBasicMaterial).opacity = progWithin * 0.5;
        } else if (evNum === 50) {
          // Brilliant White Flash fills the view, then smoothly fades
          this.flashOverlayMesh.visible = true;
          (this.flashOverlayMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0.15,
            1.0 - progWithin * 0.6
          );
        } else if (evNum === 51) {
          // Fade smoothly into Universe Regeneration
          this.flashOverlayMesh.visible = true;
          (this.flashOverlayMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            0.4 * (1.0 - progWithin)
          );
        } else {
          this.flashOverlayMesh.visible = false;
        }
      }

      // 10. Universe Regeneration (Events 51 to 77, 99 to 100)
      if (this.regenerationGroup) {
        if (evNum >= 51) {
          this.regenerationGroup.visible = true;
          const regenFrac = THREE.MathUtils.clamp((this.elapsed - 600.0) / 180.0, 0, 1);

          // Starfield reformation (Event 52)
          if (this.restoredStarfield) {
            (this.restoredStarfield.material as THREE.PointsMaterial).opacity = Math.min(
              0.95,
              regenFrac * 0.95
            );
            this.restoredStarfield.rotation.y += dt * 0.008;
          }

          // Restored planetary orbits (Events 54 to 55)
          if (this.restoredPlanetsGroup) {
            this.restoredPlanetsGroup.visible = evNum >= 54;
            this.restoredPlanetsGroup.rotation.y += dt * 0.05;
          }

          // Navigation beacons return (Event 65)
          if (this.navigationBeaconsGroup) {
            this.navigationBeaconsGroup.visible = evNum >= 65;
            this.navigationBeaconsGroup.children.forEach(b => {
              const m = b as THREE.Mesh;
              (m.material as THREE.MeshBasicMaterial).opacity =
                0.6 + Math.sin(this.elapsed * 4.0) * 0.3;
            });
          }
        } else {
          this.regenerationGroup.visible = false;
        }
      }

      // Holographic Reconstructed Route Tracks (Events 56 to 73)
      if (this.rebuildTracksGroup) {
        if (evNum >= 56) {
          this.rebuildTracksGroup.visible = true;
          const rebFrac = THREE.MathUtils.clamp((this.elapsed - 660.0) / 48.0, 0, 1);
          this.rebuildTracksGroup.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.material && (m.material as THREE.MeshBasicMaterial).opacity !== undefined) {
              (m.material as THREE.MeshBasicMaterial).opacity =
                rebFrac * (0.65 + Math.sin(this.elapsed * 3.0) * 0.2);
            }
          });
        } else {
          this.rebuildTracksGroup.visible = false;
        }
      }

      this.blackScreenActive = false;
    } else if (this.isRouteConsumption) {
      // Environmental destruction only: never pull or rotate the ship toward
      // the singularity. Keep it anchored at its actual failure position.
      this.shipCurrentTrajectory.copy(this.shipInitialPosition);
      this.shipRotation.set(0, 0, 0);
      if (this.currentPhase === 8 && !this.phaseTriggered.has(8)) {
        this.phaseTriggered.add(8);
      } else if (this.currentPhase === 9 && !this.phaseTriggered.has(9)) {
        this.phaseTriggered.add(9);
        sound.playSubBassGravitationalImplosion();
      } else if (this.currentPhase === 10 && !this.phaseTriggered.has(10)) {
        this.phaseTriggered.add(10);
        sound.playDeepCosmicBoom();
        sound.playDarkGravitationalShockwave();
      } else if (this.currentPhase === 11) {
        this.blackScreenActive = true;
      }
    } else {
      const gImplosionPhase = durations.length - 2;
      const gBoomPhase = durations.length - 1;
      if (this.currentPhase === gImplosionPhase && !this.phaseTriggered.has(gImplosionPhase)) {
        this.phaseTriggered.add(gImplosionPhase);
        sound.playSubBassGravitationalImplosion();
      } else if (this.currentPhase === gBoomPhase && !this.phaseTriggered.has(gBoomPhase)) {
        this.phaseTriggered.add(gBoomPhase);
        sound.playDeepCosmicBoom();
        sound.playDarkGravitationalShockwave();
      } else if (this.currentPhase === durations.length) {
        this.blackScreenActive = true;
      }
    }

    // Results only appear after Event 100 finishes at exactly 20:00 (1,200 seconds)
    if (this.elapsed >= totalDuration) {
      this.completed = true;
      this.totalProgress = 1.0;
      this.blackScreenActive = this.endingVariant !== 'MISSED_ESCAPE_COLLAPSE';
    }
  }

  public reset(): void {
    this.isActive = false;
    this.isRouteConsumption = false;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
    this.endingVariant = 'STANDARD';
    this.phaseTriggered.clear();
    this.disposeVisuals();
  }
}
export type FailureCinematicDirector = FailureCinematicController;

/* =========================================================================
   SUB-SYSTEM 12: SuccessCinematicController
   ========================================================================= */
export class SuccessCinematicController {
  public isActive = false;
  public elapsed = 0;

  public start(): void {
    this.isActive = true;
    this.elapsed = 0;
  }

  public update(dt: number): void {
    if (!this.isActive) return;
    this.elapsed += dt;
  }

  public reset(): void {
    this.isActive = false;
    this.elapsed = 0;
  }
}

/* =========================================================================
   SUB-SYSTEM 13: AIEvacuationController
   48. AI EVACUATION: AI racers use the same physical evacuation system.
   Detects unstable routes, navigates branches, enters tower basement,
   docks in assigned bays (Bays 01-06) without teleportation.
   ========================================================================= */
export interface AIEvacuationState {
  id: string;
  state: EvacuationState;
  assignedBayId: string;
  assignedBayPosition: THREE.Vector3;
  isParked: boolean;
  isSecured: boolean;
  clampProgress: number;
}

export class AIEvacuationController {
  public aiStates: Map<string, AIEvacuationState> = new Map();

  public registerAIRacer(id: string, index: number, bayBasePosition: THREE.Vector3): void {
    const bayIndex = (index % 6) + 1;
    const xOffset = (bayIndex % 2 === 1 ? -1 : 1) * (12 + Math.floor(bayIndex / 2) * 8);
    const zOffset = -185 + (Math.floor(bayIndex / 2) * 10);
    const bayPos = bayBasePosition.clone().add(new THREE.Vector3(xOffset, 0, zOffset - (-185)));

    this.aiStates.set(id, {
      id,
      state: 'TOWER_APPROACHING',
      assignedBayId: `BAY 0${bayIndex}`,
      assignedBayPosition: bayPos,
      isParked: false,
      isSecured: false,
      clampProgress: 0,
    });
  }

  public update(dt: number, aiList: { id: string; position: THREE.Vector3; speed: number }[]): void {
    for (const ai of aiList) {
      const state = this.aiStates.get(ai.id);
      if (!state || state.isSecured) continue;

      const distToBay = ai.position.distanceTo(state.assignedBayPosition);

      if (distToBay < 35 && state.state === 'TOWER_APPROACHING') {
        state.state = 'HANGAR_ENTERED';
      }

      if (distToBay < 8 && state.state === 'HANGAR_ENTERED') {
        state.state = 'PARKING_BAY_ENTERED';
      }

      if (distToBay <= 2.2 && (ai.speed <= 3.0 || distToBay < 1.0)) {
        state.state = 'SHIP_PARKED';
        state.isParked = true;
      }

      if (state.isParked && !state.isSecured) {
        state.clampProgress += dt * 0.4;
        if (state.clampProgress >= 1.0) {
          state.isSecured = true;
          state.state = 'SHIP_SECURED';
        }
      }
    }
  }

  public reset(): void {
    this.aiStates.clear();
  }
}

/* =========================================================================
   MASTER CLASS: FinalCollapseManager
   Integrates all authoritative subsystems seamlessly:
   - EvacuationManager
   - CatastropheEventManager
   - RouteCollapseManager
   - DestructionFrontManager
   - EvacuationTowerManager
   - ParkingManager
   - SuccessFailureManager
   - CollapseCinematicCoordinator
   ========================================================================= */
export class FinalCollapseManager {
  public readonly evacuation: EvacuationManager;
  public readonly catastrophe: CatastropheEventManager;
  public readonly tower: EvacuationTowerManager;
  public readonly routeManager: EvacuationRouteManager;
  public readonly routeCollapse: RouteCollapseManager;
  public readonly destructionFront: DestructionFrontManager;
  public readonly parking: ParkingManager;
  public readonly clamps: ParkingClampController;
  public readonly successFailure: SuccessFailureManager;
  public readonly cinematicCoordinator: CollapseCinematicCoordinator;
  public readonly evacuationCinematic: EvacuationCinematicController;
  public readonly failureCinematic: FailureCinematicController;
  public readonly successCinematic: SuccessCinematicController;
  public readonly aiEvacuation: AIEvacuationController;

  // Backward compatibility fields with previous system
  public phase = 'FIFTEEN_MINUTE_QUANTUM_LAUNCH';
  public elapsed = 0;
  public readonly raceDuration = 900;
  public collapseProgress = 0;
  public destructionFrontDistance = Number.POSITIVE_INFINITY;
  public safeZoneActive = false;
  public towerEntryActive = false;
  public towerSealed = false;
  public readonly blackHoleCenter = new THREE.Vector3(0, 180, -3500);
  public readonly escapeMissions = new EscapeMissionManager();

  constructor() {
    this.evacuation = new EvacuationManager();
    this.catastrophe = new CatastropheEventManager();
    this.tower = new EvacuationTowerManager();
    this.routeManager = new EvacuationRouteManager();
    this.routeCollapse = new RouteCollapseManager();
    this.destructionFront = new DestructionFrontManager();
    this.parking = new ParkingManager();
    this.clamps = new ParkingClampController();
    this.successFailure = new SuccessFailureManager();
    this.cinematicCoordinator = new CollapseCinematicCoordinator();
    this.evacuationCinematic = this.cinematicCoordinator;
    this.failureCinematic = new FailureCinematicController();
    this.successCinematic = new SuccessCinematicController();
    this.aiEvacuation = new AIEvacuationController();
  }

  public start(): void {
    this.phase = 'EIGHT_MINUTE_QUANTUM_LAUNCH';
    this.elapsed = 0;
    this.collapseProgress = 0;
    this.destructionFrontDistance = 2500;
    this.safeZoneActive = false;
    this.towerEntryActive = false;
    this.towerSealed = false;

    this.evacuation.reset();
    this.catastrophe.reset();
    this.tower.reset();
    this.routeManager.reset();
    this.routeCollapse.reset();
    this.destructionFront.reset();
    this.parking.reset();
    this.clamps.reset();
    this.successFailure.reset();
    this.cinematicCoordinator.reset();
    this.failureCinematic.reset();
    this.successCinematic.reset();
    this.aiEvacuation.reset();
    this.escapeMissions.reset();
  }

  public reset(): void {
    this.start();
  }

  public onZeroCountdown(): void {
    if (this.evacuation.evacuationFailed) return;
    this.phase = 'QUANTUM_LAUNCH_ACTIVE';
    this.safeZoneActive = true;
    this.evacuation.startEvacuation();
  }

  public update(
    dt: number,
    playerContext?: {
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      speedMps: number;
      splineT: number;
      totalTrackLengthM: number;
      towerEntrancePos: THREE.Vector3;
      bay07Pos: THREE.Vector3;
      shelterNavigationActive: boolean;
      shelterX: number;
      shelterZ: number;
      shelterHeading: number;
      blackHoleCenter?: THREE.Vector3;
      /** For Submode 10, physical collapse failure is forbidden until the authoritative clock reaches 00:00. */
      finalCollapseDeadlineReached?: boolean;
    },
    timelineOverrideSeconds?: number,
    scene?: THREE.Scene
  ): {
    telemetry: EvacuationTelemetry;
    impactForces: ShipImpactForces;
    shouldLockControls: boolean;
    failureTriggered: boolean;
    successTriggered: boolean;
  } {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;

    if (this.evacuation.evacuationActive) {
      this.collapseProgress = Math.min(1.0, this.evacuation.evacuationElapsedTime / this.raceDuration);
    }

    if (!playerContext) {
      return {
        telemetry: this.getTelemetry(),
        impactForces: this.catastrophe.getShipImpactForces(this.elapsed),
        shouldLockControls: false,
        failureTriggered: this.evacuation.evacuationFailed,
        successTriggered: this.evacuation.evacuationSuccess,
      };
    }

    // Submode 10's deadline is authoritative: before 00:00, environmental collapse
    // may be visible, but it must not capture the player or force a failure ending.
    // Undefined keeps legacy behavior for other Black Hole submodes.
    const mayTriggerCollapseFailure = playerContext.finalCollapseDeadlineReached !== false;

    // 1. Update Evacuation Lifecycle
    this.evacuation.update(delta);

    // 2. Update Catastrophe Events against the authoritative timeline (continues past 00:00)
    const qlpTimeline = timelineOverrideSeconds ?? this.elapsed;
    this.catastrophe.update(delta, this.evacuation, qlpTimeline);

    // 3. Update Destruction Front
    const frontCaughtPlayer = this.destructionFront.update(
      delta,
      this.catastrophe,
      playerContext.splineT,
      playerContext.totalTrackLengthM,
      this.evacuation.evacuationActive
    );
    this.destructionFrontDistance = this.destructionFront.distanceToPlayerM;

    if (
      mayTriggerCollapseFailure &&
      !playerContext.shelterNavigationActive &&
      frontCaughtPlayer &&
      !this.evacuation.evacuationSuccess &&
      !this.evacuation.evacuationFailed
    ) {
      this.triggerFailure('DESTRUCTION_FRONT_REACHED_PLAYER', false, playerContext.position);
    }

    // 4. Update Dynamic Route Collapse
    const collapseResult = this.routeCollapse.update(
      delta,
      this.catastrophe,
      playerContext.splineT,
      playerContext.totalTrackLengthM,
      playerContext.shelterNavigationActive,
      this.destructionFront.progressM
    );

    if (
      mayTriggerCollapseFailure &&
      collapseResult.routeConsumedTriggered &&
      !this.evacuation.evacuationSuccess &&
      !this.evacuation.evacuationFailed
    ) {
      this.triggerFailure('ROUTE_CONSUMED_BY_SINGULARITY', true, playerContext.position);
    }

    // 4b. Explicit Failure Condition Checks (Section 37)
    if (mayTriggerCollapseFailure && this.evacuation.evacuationActive && !this.evacuation.evacuationSuccess && !this.evacuation.evacuationFailed) {
      if (this.tower.isSealed && !this.evacuation.towerEntryReached) {
        this.triggerFailure('TOWER_ENTRANCE_SEALED', false, playerContext.position);
      } else if (this.evacuation.evacuationElapsedTime >= this.raceDuration) {
        if (!this.evacuation.towerEntryReached) {
          this.triggerFailure('EVACUATION_DEADLINE_EXPIRED', false, playerContext.position);
        } else if (!this.evacuation.basementEntryReached) {
          this.triggerFailure('BASEMENT_NOT_REACHED', false, playerContext.position);
        } else if (!this.evacuation.parkingBayReached) {
          this.triggerFailure('PARKING_BAY_NOT_REACHED', false, playerContext.position);
        } else if (!this.evacuation.shipSecured) {
          this.triggerFailure('SHIP_NOT_SECURED', false, playerContext.position);
        }
      }
    }

    // 5. Update Navigation & Warnings
    this.routeManager.update(
      playerContext.position,
      playerContext.quaternion,
      playerContext.towerEntrancePos,
      this.evacuation,
      playerContext.shelterZ
    );

    // 6. Update Parking & Clamps
    if (playerContext.shelterNavigationActive) {
      // 7 & 8. Authoritative physical progression through shelter zones
      if (playerContext.shelterZ <= 12 && this.evacuation.evacuationState === 'TOWER_APPROACHING') {
        this.evacuation.setEvacuationState('TOWER_ENTERED');
      }
      if (playerContext.shelterZ <= -32 && this.evacuation.evacuationState === 'TOWER_ENTERED') {
        this.evacuation.setEvacuationState('BASEMENT_ENTERED');
      }
      if (playerContext.shelterZ <= -140 && this.evacuation.evacuationState === 'BASEMENT_ENTERED') {
        this.evacuation.setEvacuationState('HANGAR_ENTERED');
      }
      const bayDist = Math.hypot(playerContext.shelterX, playerContext.shelterZ - (-185));
      if (bayDist < 8 && this.evacuation.evacuationState === 'HANGAR_ENTERED') {
        this.evacuation.setEvacuationState('PARKING_BAY_ENTERED');
      }

      const parkEval = this.parking.evaluate(
        playerContext.shelterX,
        playerContext.shelterZ,
        playerContext.shelterHeading,
        playerContext.speedMps
      );

      if (parkEval.isAligned && this.evacuation.evacuationState === 'PARKING_BAY_ENTERED') {
        this.evacuation.setEvacuationState('SHIP_ALIGNED');
      }

      if (
        parkEval.isParked &&
        (this.evacuation.evacuationState === 'SHIP_ALIGNED' ||
          this.evacuation.evacuationState === 'PARKING_BAY_ENTERED')
      ) {
        this.evacuation.setEvacuationState('SHIP_PARKED');
      }

      if (this.evacuation.evacuationState === 'SHIP_PARKED') {
        const secured = this.clamps.update(delta, true);
        if (secured) {
          this.evacuation.setEvacuationState('SHIP_SECURED');
          this.successFailure.lockSuccess();
          this.tower.seal();
          this.towerSealed = true;
        }
      }
    }

    // 7. Update Failure / Success Cinematics
    const bhCenter = playerContext.blackHoleCenter ?? new THREE.Vector3(0, 180, -3500);
    if (this.failureCinematic.isActive) {
      this.failureCinematic.update(delta, bhCenter, scene);
    }
    if (this.cinematicCoordinator.isActive) {
      this.cinematicCoordinator.update(delta);
    }

    const telemetry = this.getTelemetry();
    const impactForces: ShipImpactForces = playerContext.finalCollapseDeadlineReached === false
      ? {
          lateralForce: 0,
          steeringResistance: 0,
          velocityDisturbance: 0,
          pitchDisturbance: 0,
          rollDisturbance: 0,
          yawDisturbance: 0,
          cameraShake: 0,
          fovDistortion: 0,
          hudInterference: 0,
          shieldStress: 0,
          navigationInterference: 0,
        }
      : this.catastrophe.getShipImpactForces(this.elapsed);

    return {
      telemetry,
      impactForces,
      shouldLockControls:
        this.evacuation.evacuationState === 'SHIP_SECURED' ||
        this.failureCinematic.isActive,
      failureTriggered: this.evacuation.evacuationFailed,
      successTriggered: this.evacuation.evacuationSuccess,
    };
  }

  public triggerFailure(
    cause: FailureCause,
    isRouteConsumption: boolean,
    startPosition?: THREE.Vector3,
    scene?: THREE.Scene
  ): void {
    if (this.evacuation.evacuationSuccess || this.evacuation.evacuationFailed) return;
    this.evacuation.markFailure(cause);
    this.successFailure.lockFailure(cause);
    const endingVariant = cause === 'EVACUATION_DEADLINE_EXPIRED'
      ? 'MISSED_ESCAPE_COLLAPSE'
      : 'STANDARD';
    this.failureCinematic.start(isRouteConsumption, startPosition, endingVariant, scene, this.blackHoleCenter);
  }

  public sealTower(): void {
    this.tower.seal();
    this.towerSealed = true;
  }

  public markSurvived(): void {
    this.evacuation.markSuccess();
    this.successFailure.lockSuccess();
  }

  public beginTrackCollapse(): void {
    this.phase = 'TRACK_COLLAPSE';
  }

  public beginSpaghettification(): void {
    this.phase = 'SPAGHETTIFICATION';
  }

  public beginPlanetaryCollision(): void {
    this.phase = 'PLANETARY_COLLISION';
  }

  public beginDestructionFront(distance: number): void {
    this.phase = 'DESTRUCTION_FRONT';
    this.destructionFrontDistance = distance;
  }

  public updateDestructionFront(distance: number): void {
    this.destructionFrontDistance = distance;
  }

  public beginEmergencyRoute(): void {
    this.phase = 'EMERGENCY_ROUTE';
    this.safeZoneActive = true;
  }

  public beginTowerEntry(): void {
    this.phase = 'TOWER_ENTRY';
    this.safeZoneActive = true;
    this.towerEntryActive = true;
    this.evacuation.setEvacuationState('TOWER_ENTERED');
  }

  public beginFinalCollapse(): void {
    this.phase = 'FINAL_COLLAPSE';
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.raceDuration - this.elapsed);
  }

  public getObjective(): string {
    return this.routeManager.objectiveText;
  }

  public initializePhysicalShelter(scene: THREE.Scene, safeZoneCenter: THREE.Vector3): void {
    this.tower.initialize(
      scene,
      safeZoneCenter,
      safeZoneCenter.clone().add(new THREE.Vector3(0, -14, -185))
    );
  }

  public disposePhysicalShelter(scene: THREE.Scene): void {
    this.tower.reset();
  }

  public isPlayerInsideSafeZone(playerPosition: THREE.Vector3): boolean {
    return playerPosition.distanceTo(this.tower.bay07Center) <= 25;
  }

  /**
   * 46. Compiles complete failure or success telemetry stats with actual values
   */
  public generateStats(
    raceStartTime: number,
    totalDistanceM: number,
    checkpointsCount: number,
    boostCount: number,
    shieldsCount: number,
    missilesCount: number,
    escapedRouteId?: string | null
  ): FinalCollapseStats {
    const totalMs = Math.max(0, Date.now() - raceStartTime);
    const totalSec = Math.floor(totalMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ms = totalMs % 1000;
    const raceTimeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;

    const evacSec = Math.floor(this.evacuation.evacuationElapsedTime);
    const em = Math.floor(evacSec / 60);
    const es = evacSec % 60;
    const evacuationTimeFormatted = `${em.toString().padStart(2, '0')}:${es.toString().padStart(2, '0')}`;

    const missionCompleted = this.escapeMissions.isMissionCompleted();
    const survived =
      missionCompleted ||
      ((this.evacuation.evacuationSuccess && !this.evacuation.evacuationFailed) && this.evacuation.shipSecured);

    let safeZoneLabel = 'NOT REACHED';
    if (survived) {
      if (missionCompleted) {
        safeZoneLabel = `${this.escapeMissions.getSafeZoneName()} (SECURED)`;
      } else if (escapedRouteId === 'bh10_escape_route') {
        safeZoneLabel = 'ROUTE 02 // SUBTERRANEAN BLAST BUNKER (SECURED)';
      } else if (escapedRouteId === 'bh10_wormhole_route') {
        safeZoneLabel = 'ROUTE 03 // EINSTEIN-ROSEN GATEWAY (SECURED)';
      } else {
        safeZoneLabel = 'ROUTE 01 // ORBITAL SANCTUARY HANGAR (SECURED)';
      }
    } else if (this.evacuation.failureCause === 'EVACUATION_DEADLINE_EXPIRED') {
      safeZoneLabel = 'MISSED // ULTIMATE COLLAPSE & WORLD REBUILT';
    }

    return {
      survivalStatus: survived ? 'SURVIVED' : 'FAILED',
      safeZoneStatus: survived ? 'SECURED' : 'NOT REACHED',
      towerEntryReached: this.evacuation.towerEntryReached || survived,
      basementEntryReached: this.evacuation.basementEntryReached || survived,
      hangarEntryReached: this.evacuation.hangarEntryReached || survived,
      parkingBayReached: this.evacuation.parkingBayReached || survived,
      shipAligned: this.evacuation.shipAligned || survived,
      shipParked: this.evacuation.shipParked || survived,
      shipSecured: survived,
      raceTimeFormatted,
      raceTimeMs: totalMs,
      evacuationTimeFormatted,
      evacuationTimeSeconds: Math.round(this.evacuation.evacuationElapsedTime),
      distanceTraveledM: Math.round(totalDistanceM),
      checkpointsReached: checkpointsCount,
      boostUsedCount: boostCount,
      shieldsUsedCount: shieldsCount,
      missilesUsedCount: missilesCount,
      failureCause: survived ? null : this.evacuation.failureCause,
      safeZone: safeZoneLabel,
      shipStatus: survived
        ? '100% INTACT // SECURED'
        : (this.evacuation.failureCause === 'EVACUATION_DEADLINE_EXPIRED'
            ? 'SINGULARITY CATALYST // INTEGRATED INTO NEW COSMOS'
            : (this.evacuation.failureCause ? String(this.evacuation.failureCause).replace(/_/g, ' ') : 'DESTROYED // COSMIC COLLAPSE')),
    };
  }

  public jumpToEvent(eventNumber: number): void {
    this.catastrophe.jumpToEvent(eventNumber);
  }

  public getTelemetry(): EvacuationTelemetry {
    return {
      gameState: this.evacuation.gameState,
      evacuationActive: this.evacuation.evacuationActive,
      evacuationSuccess: this.evacuation.evacuationSuccess,
      evacuationFailed: this.evacuation.evacuationFailed,
      evacuationElapsedTime: this.evacuation.evacuationElapsedTime,
      evacuationState: this.evacuation.evacuationState,
      failureCause: this.evacuation.failureCause,
      currentEventIndex: this.catastrophe.currentEventIndex,
      nextEventTime: this.catastrophe.nextEventTime,
      activeEventName: this.catastrophe.activeEvent?.name ?? null,
      activeEventTitle: this.catastrophe.activeEvent?.title ?? null,
      activeEventSubtitle: this.catastrophe.activeEvent?.subtitle ?? null,
      activeAlertTitle: this.catastrophe.activeEvent?.alertTitle ?? null,
      activeAlertMessage: this.catastrophe.activeEvent?.alertMessage ?? null,
      activeAudioCue: this.catastrophe.activeEvent?.audioCue ?? null,
      activeEnvironmentReaction: this.catastrophe.activeEvent?.environmentReaction ?? null,
      activeAffectedObject: this.catastrophe.activeEvent?.affectedObject ?? null,
      blackHoleInstability:
        this.catastrophe.activeEvent?.blackHoleInstability ??
        Math.min(1.0, (this.catastrophe.currentEventIndex - 1) / 99),
      cinematicSceneActive: this.catastrophe.cinematicHandler.isActive(),
      cinematicSceneProgress: this.catastrophe.cinematicHandler.getProgress(),
      eventPhase: this.catastrophe.activeEvent?.phase ?? null,
      hazardEscalation: Math.round(this.catastrophe.hazardEscalation * 100) / 100,
      eventHistory: [...this.catastrophe.eventHistory],
      safeZoneDistanceM: this.routeManager.distanceToTowerM,
      safeZoneWarning: this.routeManager.warningText,
      objectiveText: this.routeManager.objectiveText,
      navArrowAngleDeg: this.routeManager.navArrowAngleDeg,
      navArrowVector: {
        x: this.routeManager.navArrowVector.x,
        y: this.routeManager.navArrowVector.y,
        z: this.routeManager.navArrowVector.z,
      },
      routeConsumptionActive:
        this.failureCinematic.isActive && this.failureCinematic.isRouteConsumption,
      generalFailureActive:
        this.failureCinematic.isActive && !this.failureCinematic.isRouteConsumption,
      cinematicPhase: this.failureCinematic.currentPhase,
      cinematicProgress: this.failureCinematic.totalProgress,
      blackScreenActive: this.failureCinematic.blackScreenActive,
      endingVariant: this.failureCinematic.endingVariant,
      destructionFrontDistanceM: Math.round(this.destructionFront.distanceToPlayerM),
      playerOnCollapsingSegment: this.routeCollapse.playerOnCollapsingSegment,
      escapeWindowRemainingSeconds:
        Math.round(this.routeCollapse.escapeWindowRemainingSeconds * 10) / 10,
      clampsLocked: {
        left: this.clamps.clampStep >= 1,
        right: this.clamps.clampStep >= 2,
        front: this.clamps.clampStep >= 3,
        rear: this.clamps.clampStep >= 4,
      },
      absoluteCollapseActive: this.catastrophe.absoluteCollapse,
      hudGlitchIntensity: (this.catastrophe.activeEvent?.severity ?? 0) >= 6 ? 0.35 : 0,
      escapeMission: this.escapeMissions.getTelemetry(),
      cinematicElapsedSeconds:
        this.failureCinematic.isActive && this.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
          ? this.failureCinematic.elapsed
          : 0,
      cinematicTotalSeconds: TOTAL_CINEMATIC_SECONDS,
      currentEventNumber:
        this.failureCinematic.isActive && this.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
          ? getFinalCollapse100Event(this.failureCinematic.elapsed).eventNumber
          : 1,
      currentEventTitle:
        this.failureCinematic.isActive && this.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
          ? getFinalCollapse100Event(this.failureCinematic.elapsed).event.title
          : 'Evacuation Window Expired',
      currentEventPresentation:
        this.failureCinematic.isActive && this.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
          ? getFinalCollapse100Event(this.failureCinematic.elapsed).event.presentation
          : 'Freeze evacuation timer at zero; show SAFE ZONE MISSED.',
      currentEventTimeRange:
        this.failureCinematic.isActive && this.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
          ? getFinalCollapse100Event(this.failureCinematic.elapsed).event.timeRange
          : '00:00–00:12',
    };
  }
}
