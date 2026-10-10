import * as THREE from 'three';
import { GameMode } from '../types';
import { sound } from './audio';

export type ModeEventSeverity = 'ADVISORY' | 'WARNING' | 'CRITICAL' | 'DANGER';

export interface ModeEventDefinition {
  id: string;
  eventNumber: number;
  title: string;
  subtitle: string;
  startTimeSec: number;
  warningLeadSec: number;
  durationSec: number;
  affectedLocation: string;
  severity: ModeEventSeverity;
  alertMessage: string;
  recommendedAction: string;
  physicalEffects: {
    speedDelta?: number; // m/s change
    steeringResistance?: number; // 0.0 - 1.0
    lateralPush?: number; // lateral offset delta / second
    tractionMultiplier?: number; // 0.5 - 1.5
    cameraShake?: number;
    audioCue?: 'warning' | 'alarm' | 'gravity' | 'warp' | 'emp' | 'shield';
  };
}

export interface ActiveModeEventAlert {
  eventNumber: number;
  title: string;
  subtitle: string;
  alertMessage: string;
  affectedLocation: string;
  severity: ModeEventSeverity;
  recommendedAction: string;
  timeRemainingSec: number;
  isWarningPhase: boolean;
  isActivePhase: boolean;
}

export class ModeEventsSystem {
  private activeMode: GameMode = 'NEON_CIRCUIT';
  private events: ModeEventDefinition[] = [];
  private modeElapsed = 0;
  private currentEventIndex = -1;
  public currentAlert: ActiveModeEventAlert | null = null;
  private lastAlertAudioTime = 0;

  constructor() {
    // Initialized empty, loaded on mode start
  }

  public initForMode(mode: GameMode): void {
    this.activeMode = mode;
    this.modeElapsed = 0;
    this.currentEventIndex = -1;
    this.currentAlert = null;
    this.lastAlertAudioTime = 0;
    this.events = this.buildEventCatalogForMode(mode);
  }

  public update(
    dt: number,
    playerSplineT: number,
    currentSpeed: number,
    applyPhysicsCallback?: (effects: ModeEventDefinition['physicalEffects']) => void
  ): ActiveModeEventAlert | null {
    // Mode 01 and Mode 21 are protected modes! They run their own dedicated timeline engines.
    if (this.activeMode === 'SINGULARITY_RUN' || this.activeMode === 'BLACK_HOLE') {
      this.currentAlert = null;
      return null;
    }

    this.modeElapsed += dt;
    const now = Date.now();

    // Loop through events to find active or upcoming warning event
    let foundAlert: ActiveModeEventAlert | null = null;

    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i];
      const warningStart = evt.startTimeSec - evt.warningLeadSec;
      const activeStart = evt.startTimeSec;
      const activeEnd = evt.startTimeSec + evt.durationSec;

      if (this.modeElapsed >= warningStart && this.modeElapsed < activeEnd) {
        const isWarning = this.modeElapsed < activeStart;
        const timeRemaining = isWarning
          ? Math.max(0.1, activeStart - this.modeElapsed)
          : Math.max(0.1, activeEnd - this.modeElapsed);

        foundAlert = {
          eventNumber: evt.eventNumber,
          title: evt.title,
          subtitle: evt.subtitle,
          alertMessage: evt.alertMessage,
          affectedLocation: evt.affectedLocation,
          severity: evt.severity,
          recommendedAction: evt.recommendedAction,
          timeRemainingSec: parseFloat(timeRemaining.toFixed(1)),
          isWarningPhase: isWarning,
          isActivePhase: !isWarning,
        };

        // Sound alert during warning onset
        if (now - this.lastAlertAudioTime > 2500) {
          this.lastAlertAudioTime = now;
          if (evt.physicalEffects.audioCue === 'alarm' || evt.severity === 'CRITICAL' || evt.severity === 'DANGER') {
            sound.playAlarmAlert();
          } else {
            sound.playHazardWarning();
          }
        }

        // Apply physical gameplay consequences during active phase
        if (!isWarning && applyPhysicsCallback) {
          applyPhysicsCallback(evt.physicalEffects);
        }

        break;
      }
    }

    this.currentAlert = foundAlert;
    return foundAlert;
  }

  private buildEventCatalogForMode(mode: GameMode): ModeEventDefinition[] {
    switch (mode) {
      case 'NEON_CIRCUIT':
        return [
          {
            id: 'nc_01',
            eventNumber: 1,
            title: 'GRID OVERLOAD',
            subtitle: 'HIGH-VOLTAGE ENERGY SPIKE',
            startTimeSec: 10,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'SECTOR 02 // ELEVATED HIGHWAY',
            severity: 'WARNING',
            alertMessage: 'CENTRAL TRACK ELECTRIFIED // WEAVE TO ADJACENT LANE',
            recommendedAction: 'STEER LEFT OR RIGHT TO AVOID DRAG',
            physicalEffects: {
              tractionMultiplier: 0.75,
              cameraShake: 0.35,
              audioCue: 'warning',
            },
          },
          {
            id: 'nc_02',
            eventNumber: 2,
            title: 'LASER SWEEP',
            subtitle: 'OSCILLATING RED DEFENSE MATRIX',
            startTimeSec: 24,
            warningLeadSec: 6,
            durationSec: 9,
            affectedLocation: 'SECTOR 03 // SKYWAY TRANSIT',
            severity: 'CRITICAL',
            alertMessage: 'DEFENSE LASER OSCILLATING // TIME OPENING GAP',
            recommendedAction: 'ALIGN WITH CENTRAL TIMING WINDOW',
            physicalEffects: {
              speedDelta: -2.0,
              cameraShake: 0.45,
              audioCue: 'alarm',
            },
          },
          {
            id: 'nc_03',
            eventNumber: 3,
            title: 'BRIDGE RECONFIGURATION',
            subtitle: 'CANTILEVER OVERPASS SLIDE',
            startTimeSec: 40,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'SECTOR 01 // OVERPASS APEX',
            severity: 'ADVISORY',
            alertMessage: 'CANTILEVER BRIDGE REALIGNING // JUMP RAMP ARMED',
            recommendedAction: 'HOLD CENTER FOR CATAPULT BOOST',
            physicalEffects: {
              speedDelta: 5.0,
              cameraShake: 0.25,
            },
          },
          {
            id: 'nc_04',
            eventNumber: 4,
            title: 'CITY BLACKOUT',
            subtitle: 'POWER GRID TRANSIENT FAILURE',
            startTimeSec: 54,
            warningLeadSec: 5,
            durationSec: 7,
            affectedLocation: 'SECTOR 04 // LOWER DOWNTOWN',
            severity: 'WARNING',
            alertMessage: 'MAIN POWER OFFLINE // EMERGENCY BEACONS ACTIVE',
            recommendedAction: 'FOLLOW AMBER TRACKSIDE GUIDES',
            physicalEffects: {
              tractionMultiplier: 0.9,
              cameraShake: 0.3,
            },
          },
          {
            id: 'nc_05',
            eventNumber: 5,
            title: 'SKYWAY TRAFFIC SURGE',
            subtitle: 'AUTOMATED CARGO POD CONVOY',
            startTimeSec: 68,
            warningLeadSec: 6,
            durationSec: 10,
            affectedLocation: 'SECTOR 02 // LOGISTICS INTERSECTION',
            severity: 'DANGER',
            alertMessage: 'CARGO PODS CROSSING INTERSECTION // SLIPSTREAM SURGE',
            recommendedAction: 'WEAVE BETWEEN MOVING HAULERS',
            physicalEffects: {
              steeringResistance: 0.2,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
        ];

      case 'ASTEROID_RUN':
        return [
          {
            id: 'ar_01',
            eventNumber: 1,
            title: 'ASTEROID FRACTURE',
            subtitle: 'TECTONIC ROCK BREAKUP',
            startTimeSec: 8,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'VESTA TRENCH // SECTOR 01',
            severity: 'WARNING',
            alertMessage: 'COLOSSAL BOULDER DETONATING // DODGE FALLING CHUNKS',
            recommendedAction: 'FIRE BEAM OR DIVE TO LOWER APEX',
            physicalEffects: {
              speedDelta: -2.5,
              cameraShake: 0.5,
              audioCue: 'warning',
            },
          },
          {
            id: 'ar_02',
            eventNumber: 2,
            title: 'MINING DRILL BLAST',
            subtitle: 'HIGH-ENERGY EXCAVATION PULSE',
            startTimeSec: 22,
            warningLeadSec: 5,
            durationSec: 7,
            affectedLocation: 'ORE DEPOT // ROTARY RIGS',
            severity: 'CRITICAL',
            alertMessage: 'INDUSTRIAL DRILL RIG FIRING // EVADE CORE RAY',
            recommendedAction: 'DRIFT TO OUTER FLANK',
            physicalEffects: {
              lateralPush: 3.5,
              cameraShake: 0.6,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ar_03',
            eventNumber: 3,
            title: 'GRAVITATIONAL DEBRIS WAVE',
            subtitle: 'MICRO-METEORITE SHOWER',
            startTimeSec: 36,
            warningLeadSec: 6,
            durationSec: 9,
            affectedLocation: 'DEEP TRENCH // SHADOW SECTOR',
            severity: 'WARNING',
            alertMessage: 'DEBRIS CLOUD INCOMING // PREPARE FOR SURFACE SCRAPES',
            recommendedAction: 'ENGAGE PHASE SHIELD OR BRAKE SLIGHTLY',
            physicalEffects: {
              tractionMultiplier: 0.8,
              cameraShake: 0.45,
            },
          },
          {
            id: 'ar_04',
            eventNumber: 4,
            title: 'CRANE SWING HAZARD',
            subtitle: 'UNCONTROLLED SHIPYARD GANTRY',
            startTimeSec: 50,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'EXTRACTION CHUTE // SECTOR 03',
            severity: 'DANGER',
            alertMessage: 'HEAVY GANTRY ARM SWINGING OVER TRACK // STAY LOW',
            recommendedAction: 'DIVE BENEATH GANTRY CLEARANCE',
            physicalEffects: {
              steeringResistance: 0.25,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ar_05',
            eventNumber: 5,
            title: 'ORE STAMPER POUNDING',
            subtitle: 'HYDRAULIC COMPACTION SURGE',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 9,
            affectedLocation: 'SMELTER GATEWAY // SECTOR 04',
            severity: 'CRITICAL',
            alertMessage: 'HYDRAULIC PISTONS POUNDING ROAD // TIME RHYTHMIC PASS',
            recommendedAction: 'PASS BETWEEN COMPRESSION CYCLES',
            physicalEffects: {
              cameraShake: 0.7,
              speedDelta: -3.0,
            },
          },
        ];

      case 'WORMHOLE_EXPRESS':
        return [
          {
            id: 'we_01',
            eventNumber: 1,
            title: 'PORTAL DESTABILIZATION',
            subtitle: 'WARP FLUX HARMONIC',
            startTimeSec: 10,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'GATE 01 // EVENT HORIZON',
            severity: 'WARNING',
            alertMessage: 'WARP INLET DESTABILIZING // HOLD DEAD CENTER',
            recommendedAction: 'STABILIZE VECTOR FOR SMOOTH JUMP',
            physicalEffects: {
              lateralPush: 2.0,
              cameraShake: 0.4,
              audioCue: 'warp',
            },
          },
          {
            id: 'we_02',
            eventNumber: 2,
            title: 'GATE ALIGNMENT PULSE',
            subtitle: 'COUNTER-ROTATING ACCELERATION',
            startTimeSec: 24,
            warningLeadSec: 5,
            durationSec: 7,
            affectedLocation: 'GATE 02 // SUB-SPACE NEXUS',
            severity: 'ADVISORY',
            alertMessage: 'ACCELERATION TORUS ALIGNED // MAXIMUM WARP THRESHOLD',
            recommendedAction: 'PUNCH THROTTLE FOR +60 KM/H SURGE',
            physicalEffects: {
              speedDelta: 8.0,
              cameraShake: 0.35,
            },
          },
          {
            id: 'we_03',
            eventNumber: 3,
            title: 'REALITY-SHIFT CONDUIT',
            subtitle: 'TELESCOPING TUNNEL EXPANSION',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'TRANSIT CHASM // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'SUB-SPACE CONDUIT PULSING // WATCH NARROW GAPS',
            recommendedAction: 'AVOID PERIMETER WIREFRAME RINGS',
            physicalEffects: {
              tractionMultiplier: 0.85,
              cameraShake: 0.45,
            },
          },
          {
            id: 'we_04',
            eventNumber: 4,
            title: 'ACCRETION SWIRL SURGE',
            subtitle: 'DISTANT SINGULARITY GRAVITATIONAL DRAG',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'CORE SECTOR // ACCRETION RIM',
            severity: 'CRITICAL',
            alertMessage: 'CORE GRAVITATIONAL TIDE DETECTED // VECTOR DRIFT',
            recommendedAction: 'COUNTER-STEER AGAINST INWARD PULL',
            physicalEffects: {
              lateralPush: -4.0,
              steeringResistance: 0.3,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'we_05',
            eventNumber: 5,
            title: 'SUBSPACE DRIFT VORTEX',
            subtitle: 'RAPID WARP SEQUENCE COMPLETE',
            startTimeSec: 66,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'SUBSPACE EXIT // FINAL RUN',
            severity: 'ADVISORY',
            alertMessage: 'WARP CONVERGENCE ACHIEVED // EXIT PORTAL IN SIGHT',
            recommendedAction: 'FULL BOOST ACROSS FINAL TERMINUS',
            physicalEffects: {
              speedDelta: 6.0,
              cameraShake: 0.3,
            },
          },
        ];

      case 'SOLAR_STORM':
        return [
          {
            id: 'ss_01',
            eventNumber: 1,
            title: 'CORONAL MASS EJECTION',
            subtitle: 'SOLAR FLARE IMPACT WAVE',
            startTimeSec: 9,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'HELIOS CORRIDOR // UNPROTECTED SPAN',
            severity: 'DANGER',
            alertMessage: 'SOLAR FLARE ERUPTING // DIVE UNDER TRACK SHADOW',
            recommendedAction: 'SEEK SHIELDED PASSAGE / DROP ALTITUDE',
            physicalEffects: {
              speedDelta: -3.0,
              cameraShake: 0.6,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ss_02',
            eventNumber: 2,
            title: 'THERMAL SHIELD OVERLOAD',
            subtitle: 'HEAT RADIATOR VENTING',
            startTimeSec: 24,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'STATION BAFFLES // SECTOR 02',
            severity: 'WARNING',
            alertMessage: 'HEAT BAFFLES VENTING MOLTEN STEAM // DISENGAGE BOOST',
            recommendedAction: 'COAST THROUGH HIGH-HEAT ZONE',
            physicalEffects: {
              tractionMultiplier: 0.8,
              cameraShake: 0.4,
            },
          },
          {
            id: 'ss_03',
            eventNumber: 3,
            title: 'HELIOSTAT MIRROR SWEEP',
            subtitle: 'SOLAR COLLECTOR GLARE REFLECTION',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'PERIHELION FLANK // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'COLLECTOR MIRRORS TRACKING SUN // THERMAL SPIKE',
            recommendedAction: 'DRIFT PAST CONCENTRATED FOCAL BEAMS',
            physicalEffects: {
              steeringResistance: 0.2,
              cameraShake: 0.35,
            },
          },
          {
            id: 'ss_04',
            eventNumber: 4,
            title: 'MAGNETIC FLUX ARCH PULSE',
            subtitle: 'CORONAL ACCELERATION LOOP',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 7,
            affectedLocation: 'MAGNETIC ARCH // SECTOR 04',
            severity: 'ADVISORY',
            alertMessage: 'CORONAL FLUX ARCH CHARGED // THERMAL BOOST READY',
            recommendedAction: 'PASS DIRECTLY THROUGH ARCH APEX',
            physicalEffects: {
              speedDelta: 7.5,
              cameraShake: 0.45,
            },
          },
          {
            id: 'ss_05',
            eventNumber: 5,
            title: 'SOLAR TSUNAMI FRONT',
            subtitle: 'MEGA-FLARE SHOCKWAVE',
            startTimeSec: 66,
            warningLeadSec: 6,
            durationSec: 10,
            affectedLocation: 'EXTRACTION PORT // ESCAPE VECTOR',
            severity: 'CRITICAL',
            alertMessage: 'SOLAR WAVE SURGING FROM BEHIND // SPRINT TO REFUGE',
            recommendedAction: 'FULL VELOCITY TO PERIHELION GATE',
            physicalEffects: {
              lateralPush: 3.0,
              cameraShake: 0.7,
              audioCue: 'alarm',
            },
          },
        ];

      case 'GRAVITY_FREE':
        return [
          {
            id: 'gf_01',
            eventNumber: 1,
            title: 'GRAV-GENERATOR INVERSION',
            subtitle: 'ZERO-G DRIFT SURGE',
            startTimeSec: 10,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'TEST BAY // GYROSCOPE SPAN',
            severity: 'WARNING',
            alertMessage: 'GRAVITY INVERSION ACTIVE // CRAFT BECOMES WEIGHTLESS',
            recommendedAction: 'EXECUTE BARREL ROLLS & COMBO STUNTS',
            physicalEffects: {
              tractionMultiplier: 0.65,
              speedDelta: 4.0,
              cameraShake: 0.25,
              audioCue: 'gravity',
            },
          },
          {
            id: 'gf_02',
            eventNumber: 2,
            title: 'MAGNETIC RAIL POLARITY SHIFT',
            subtitle: 'LEVITATION FLUX CYCLING',
            startTimeSec: 24,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'MAGLEV HIGHWAY // SECTOR 02',
            severity: 'WARNING',
            alertMessage: 'RAIL POLARITY REVERSING // COUNTER-STEER LATERAL DRIFT',
            recommendedAction: 'STABILIZE SHIP ALONG ROAD CENTERLINE',
            physicalEffects: {
              lateralPush: 3.8,
              steeringResistance: 0.25,
              cameraShake: 0.4,
            },
          },
          {
            id: 'gf_03',
            eventNumber: 3,
            title: 'BUOYANCY WAVE PULSE',
            subtitle: 'MAGLEV PLATFORM UNDULATION',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 9,
            affectedLocation: 'CENTRAL FLOATING DOCKS',
            severity: 'ADVISORY',
            alertMessage: 'OCEANIC ZERO-G SWELL // CATCH PLATFORM CREST FOR JUMP',
            recommendedAction: 'LAUNCH FROM ELEVATED WAVE APEX',
            physicalEffects: {
              speedDelta: 5.5,
              cameraShake: 0.35,
            },
          },
          {
            id: 'gf_04',
            eventNumber: 4,
            title: 'ARTIFICIAL GRAVITY RESTORED',
            subtitle: 'HIGH-G COMPRESSION SPIKE',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 7,
            affectedLocation: 'HABITAT RING // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'FULL TRACTION RESTORED // PREPARE FOR GROUND CONTACT',
            recommendedAction: 'LEVELED LANDING // HARD BRAKE ON APEX',
            physicalEffects: {
              tractionMultiplier: 1.4,
              cameraShake: 0.5,
            },
          },
          {
            id: 'gf_05',
            eventNumber: 5,
            title: 'CENTRIFUGE HABITAT APEX',
            subtitle: 'CENTRIFUGAL SPEED RUN',
            startTimeSec: 66,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'ORBITAL RING // RECOVERY DOCK',
            severity: 'ADVISORY',
            alertMessage: 'CENTRIFUGAL FORCE ASSIST // TOP SPEED SURGE',
            recommendedAction: 'HOLD APEX LINE TO FINISH GATE',
            physicalEffects: {
              speedDelta: 6.0,
              cameraShake: 0.3,
            },
          },
        ];

      case 'PLASMA_STORM':
        return [
          {
            id: 'ps_01',
            eventNumber: 1,
            title: 'TOKAMAK CORE OVERLOAD',
            subtitle: 'FUSION REACTOR ARC VENTING',
            startTimeSec: 9,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'REFINERY 01 // TOKAMAK COMPLEX',
            severity: 'CRITICAL',
            alertMessage: 'CONTAINMENT ARCS DISCHARGING // DODGE GREEN GLOW',
            recommendedAction: 'WEAVE AROUND VENTING RING COILS',
            physicalEffects: {
              speedDelta: -2.5,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ps_02',
            eventNumber: 2,
            title: 'PLASMA WALL COMPRESSION',
            subtitle: 'CHASING SURGE ACCELERATION',
            startTimeSec: 23,
            warningLeadSec: 5,
            durationSec: 9,
            affectedLocation: 'MAIN CONDUIT // BEHIND PLAYER',
            severity: 'DANGER',
            alertMessage: 'STORM WALL CLOSING RAPIDLY // COLLECT SHIELD ORB',
            recommendedAction: 'GRAB CYAN SHIELD TO KNOCK WALL BACK',
            physicalEffects: {
              speedDelta: -1.5,
              cameraShake: 0.6,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ps_03',
            eventNumber: 3,
            title: 'HIGH-VOLTAGE DISCHARGE',
            subtitle: 'MAGNETIC ARC PIPE BLOWOUT',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'SECTOR 02 // ARC BRIDGES',
            severity: 'WARNING',
            alertMessage: 'CONDUIT DISCHARGING ACROSS ROAD // WEAVE OPPOSITE LANE',
            recommendedAction: 'HOLD FLANK OPPOSITE ROTOR SPARKS',
            physicalEffects: {
              tractionMultiplier: 0.8,
              cameraShake: 0.45,
            },
          },
          {
            id: 'ps_04',
            eventNumber: 4,
            title: 'EXHAUST PISTON SURGE',
            subtitle: 'PNEUMATIC SHOCKWAVE CYCLING',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'PRESSURE CHAMBER // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'EXHAUST PISTONS POUNDING ROAD // RHYTHMIC BLAST',
            recommendedAction: 'BOOST THROUGH COMPRESSION DOWNTIME',
            physicalEffects: {
              lateralPush: 3.2,
              cameraShake: 0.5,
            },
          },
          {
            id: 'ps_05',
            eventNumber: 5,
            title: 'FUSION EXTRACTION APEX',
            subtitle: 'FINAL REFINERY EXIT CLEARANCE',
            startTimeSec: 66,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'MAGNETAR GANTRY // FINISH SPRINT',
            severity: 'ADVISORY',
            alertMessage: 'MAGNETIC CONTAINMENT CLEARED // EXTRACTION UNLOCKED',
            recommendedAction: 'MAXIMUM VELOCITY ACROSS REFINERY EXIT',
            physicalEffects: {
              speedDelta: 7.0,
              cameraShake: 0.4,
            },
          },
        ];

      case 'SKYLINE_RUSH':
        return [
          {
            id: 'sr_01',
            eventNumber: 1,
            title: 'CANYON CROSSWIND GUSTS',
            subtitle: '120 KM/H SKYSCRAPER SHEAR',
            startTimeSec: 10,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'NEO-CORUSCANT // HIGH CANYON',
            severity: 'WARNING',
            alertMessage: 'SEVERE THERMAL DOWNDRAFTS // COUNTER-STEER TO STAY ON ROAD',
            recommendedAction: 'STEER HARD TOWARDS APEX GUARDRAIL',
            physicalEffects: {
              lateralPush: -4.5,
              steeringResistance: 0.35,
              cameraShake: 0.5,
              audioCue: 'warning',
            },
          },
          {
            id: 'sr_02',
            eventNumber: 2,
            title: 'SKYBRIDGE EXTENSION',
            subtitle: 'RETRACTABLE TRANSIT OVERPASS',
            startTimeSec: 24,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'TOWER 04-05 // CANYON BRIDGE',
            severity: 'ADVISORY',
            alertMessage: 'CANTILEVER SKYBRIDGE CONNECTING // HIGH-SPEED JUMP OPEN',
            recommendedAction: 'ALIGN CENTERLINE FOR LONG ROOFTOP LEAP',
            physicalEffects: {
              speedDelta: 5.5,
              cameraShake: 0.3,
            },
          },
          {
            id: 'sr_03',
            eventNumber: 3,
            title: 'ROOFTOP TURBINE DOWNDRAFT',
            subtitle: 'AERODYNAMIC ROTOR COMPRESSION',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'SUMMIT APEX // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'TURBINE BLADES SPINNING AT EXTREME RPM // DOWNDRAFT FORCE',
            recommendedAction: 'USE GROUND-EFFECT TRACTION TO DIVE AROUND',
            physicalEffects: {
              tractionMultiplier: 1.3,
              speedDelta: -2.0,
              cameraShake: 0.45,
            },
          },
          {
            id: 'sr_04',
            eventNumber: 4,
            title: 'SKY-ELEVATOR CROSSING',
            subtitle: 'EXTERIOR CABIN INTERCEPT',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'FACADE VERTICAL TRANSIT',
            severity: 'DANGER',
            alertMessage: 'GLASS SKY-ELEVATOR CROSSING LANE // SWERVE TO PASS',
            recommendedAction: 'STEER TO OUTER FLANK TO CLEAR CAB',
            physicalEffects: {
              steeringResistance: 0.25,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
          {
            id: 'sr_05',
            eventNumber: 5,
            title: 'SUMMIT TERMINUS SPRINT',
            subtitle: 'CORUSCANT PEAK CLEARANCE',
            startTimeSec: 66,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'SUMMIT SKYWAY // FINISH ARCH',
            severity: 'ADVISORY',
            alertMessage: 'ROOFTOP HIGHWAY CLEARED // FULL BOOST TO TERMINUS',
            recommendedAction: 'FULL HYPER-BOOST SPRINT TO VICTORY',
            physicalEffects: {
              speedDelta: 6.5,
              cameraShake: 0.35,
            },
          },
        ];

      case 'DEBRIS_SURVIVAL':
        return [
          {
            id: 'ds_01',
            eventNumber: 1,
            title: 'STATION MODULE BREAKUP',
            subtitle: 'DERELICT HULL DETONATION',
            startTimeSec: 9,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'GRAVEYARD ORBIT // SECTOR 01',
            severity: 'WARNING',
            alertMessage: 'STARSHIP HULL TUMBLING INTO FLIGHT PATH // EVADE OR DESTROY',
            recommendedAction: 'FIRE FRONT BEAM OR DIVE TO LOWER RAILS',
            physicalEffects: {
              speedDelta: -2.5,
              cameraShake: 0.5,
              audioCue: 'warning',
            },
          },
          {
            id: 'ds_02',
            eventNumber: 2,
            title: 'SALVAGE CRANE SWING',
            subtitle: 'AUTONOMOUS MECHANICAL SWEEP',
            startTimeSec: 23,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'SALVAGE YARD // ARM GANTRY',
            severity: 'CRITICAL',
            alertMessage: 'UNCONTROLLED CARGO ARM SWINGING OVER TRACK // STAY LOW',
            recommendedAction: 'DUCK BENEATH CRANE BOOM',
            physicalEffects: {
              lateralPush: 3.5,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ds_03',
            eventNumber: 3,
            title: 'DENSE SCRAP HAIL',
            subtitle: 'TUMBLING GIRDER SHOWER',
            startTimeSec: 37,
            warningLeadSec: 6,
            durationSec: 9,
            affectedLocation: 'DEBRIS DENSE CLUSTER',
            severity: 'WARNING',
            alertMessage: 'METAL GIRDERS DRIFTING RAPIDLY // NEAR-MISS REWARDS ARMED',
            recommendedAction: 'THREAD CLOSE GAPS FOR BOOST RECHARGES',
            physicalEffects: {
              tractionMultiplier: 0.85,
              cameraShake: 0.4,
            },
          },
          {
            id: 'ds_04',
            eventNumber: 4,
            title: 'EMERGENCY BEACON LOCK',
            subtitle: 'CLEARANCE LANE ILLUMINATION',
            startTimeSec: 51,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'BEACON BUOY // SECTOR 03',
            severity: 'ADVISORY',
            alertMessage: 'DISTRESS BUOY ACTIVATING SAFE CORRIDOR // SLIPSTREAM ACTIVE',
            recommendedAction: 'FOLLOW RED BEACON VECTOR FOR FREE SPEED',
            physicalEffects: {
              speedDelta: 5.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'ds_05',
            eventNumber: 5,
            title: 'CATASTROPHIC SHIPYARD COLLAPSE',
            subtitle: 'MEGA-MODULE CONVERGENCE',
            startTimeSec: 65,
            warningLeadSec: 6,
            durationSec: 10,
            affectedLocation: 'GRAVEYARD APEX // EXTRACTION',
            severity: 'DANGER',
            alertMessage: 'ENTIRE STATION SECTOR COLLAPSING // SPRINT FOR CLEARANCE',
            recommendedAction: 'MAXIMUM SPEED ACROSS FINISH CLEARANCE',
            physicalEffects: {
              steeringResistance: 0.2,
              cameraShake: 0.65,
              audioCue: 'alarm',
            },
          },
        ];

      case 'QUANTUM_TIME_TRIAL':
        return [
          {
            id: 'qt_01',
            eventNumber: 1,
            title: 'CALIBRATION WINDOW',
            subtitle: 'TIMED TESTING GATE SYNC',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'QUANTUM FACILITY // CALIBRATION TOWER 01',
            severity: 'ADVISORY',
            alertMessage: 'CALIBRATION WINDOW ACTIVE // DISPLAYING OPTIMAL TIME THRESHOLD',
            recommendedAction: 'HOLD EXACT RACING LINE THROUGH CALIBRATION TORUS',
            physicalEffects: {
              speedDelta: 6.0,
              cameraShake: 0.25,
            },
          },
          {
            id: 'qt_02',
            eventNumber: 2,
            title: 'GATE SYNCHRONIZATION',
            subtitle: 'SCHEDULED APERTURE SEQUENCE',
            startTimeSec: 20,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'GEOMETRIC SECTOR // TIMED GATE MATRIX',
            severity: 'WARNING',
            alertMessage: 'TIMED GATES CYCLING // GATE 03 SYNCHRONIZING OPEN STATE',
            recommendedAction: 'MATCH ENTRY SPEED TO TIMED GATE APERTURE',
            physicalEffects: {
              speedDelta: 4.5,
              steeringResistance: 0.2,
              cameraShake: 0.3,
            },
          },
          {
            id: 'qt_03',
            eventNumber: 3,
            title: 'TRACK ALIGNMENT',
            subtitle: 'SEGMENT ELEVATION & SHIFT',
            startTimeSec: 34,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'CENTRAL LAB // SHIFTING RUNWAY 02',
            severity: 'WARNING',
            alertMessage: 'TRACK SEGMENT REALIGNING // PLATFORM ELEVATION CHANGING',
            recommendedAction: 'OBSERVE GREEN ALIGNMENT RAILS AND ADJUST ENTRY LINE',
            physicalEffects: {
              lateralPush: 2.8,
              cameraShake: 0.4,
            },
          },
          {
            id: 'qt_04',
            eventNumber: 4,
            title: 'SHORTCUT AVAILABLE',
            subtitle: 'ENERGY RAIL EXTENSION',
            startTimeSec: 48,
            warningLeadSec: 4,
            durationSec: 7,
            affectedLocation: 'ENERGY CONDUIT // TEMPORARY BYPASS',
            severity: 'ADVISORY',
            alertMessage: 'ENERGY RAIL EXTENDED // PRECISION SHORTCUT OPEN (6.5s LIMIT)',
            recommendedAction: 'VEER RIGHT ONTO EXTENDED ENERGY RAIL FOR -2.4s DELTA',
            physicalEffects: {
              speedDelta: 7.5,
              cameraShake: 0.35,
            },
          },
          {
            id: 'qt_05',
            eventNumber: 5,
            title: 'CHECKPOINT MISSED',
            subtitle: 'SECTOR BENCHMARK VERIFICATION',
            startTimeSec: 62,
            warningLeadSec: 4,
            durationSec: 10,
            affectedLocation: 'BENCHMARK GATE // FINAL APEX',
            severity: 'CRITICAL',
            alertMessage: 'HOLOGRAPHIC CHECKPOINT CONFIRMED // TIME SPLIT RECORDED',
            recommendedAction: 'CLEAN SPRINT TO PODIUM GATE // MAINTAIN TIME-TRIAL PACE',
            physicalEffects: {
              speedDelta: 8.0,
              cameraShake: 0.4,
              audioCue: 'warning',
            },
          },
        ];

      case 'ENERGY_HEIST':
        return [
          {
            id: 'eh_01',
            eventNumber: 1,
            title: 'SECURITY LOCKDOWN',
            subtitle: 'ARMORED DOOR CONTAINMENT',
            startTimeSec: 9,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'ORBITAL VAULT // SECTOR 01 CORRIDOR',
            severity: 'WARNING',
            alertMessage: 'SECURITY LOCKDOWN IMMINENT // PRIMARY CORRIDOR CLOSING',
            recommendedAction: 'DEFLECT TOWARD SIDE EXTRACTION CONDUIT BEFORE SEAL',
            physicalEffects: {
              cameraShake: 0.4,
              audioCue: 'warning',
            },
          },
          {
            id: 'eh_02',
            eventNumber: 2,
            title: 'VAULT ACCESS GRANTED',
            subtitle: 'BLAST DOOR ROTATION',
            startTimeSec: 24,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'REACTOR CHAMBER // MAIN VAULT GATE',
            severity: 'ADVISORY',
            alertMessage: 'SECURITY OVERRIDE SUCCESSFUL // VAULT PASSAGE OPEN',
            recommendedAction: 'ENTER ROTATING VAULT DOOR FOR REACTOR ACCESS',
            physicalEffects: {
              speedDelta: 5.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'eh_03',
            eventNumber: 3,
            title: 'ENERGY SURGE',
            subtitle: 'HIGH-VOLTAGE CONDUIT DISCHARGE',
            startTimeSec: 38,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'STORAGE TOWERS // FLUX CORRIDOR',
            severity: 'DANGER',
            alertMessage: 'REACTOR OVERCHARGE SURGE // DANGER ZONE ON TRACK FLANKS',
            recommendedAction: 'HOLD EXACT CENTERLINE TO AVOID CONDUIT ARCS',
            physicalEffects: {
              lateralPush: 3.5,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'eh_04',
            eventNumber: 4,
            title: 'CARGO READY',
            subtitle: 'ORBITAL CONTAINER ELEVATION',
            startTimeSec: 52,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'CARGO LIFTS // STORAGE BAY 03',
            severity: 'ADVISORY',
            alertMessage: 'CARGO LIFTS DEPLOYED // HIGH-DENSITY ENERGY CELLS EXPOSED',
            recommendedAction: 'INTERCEPT GLOWING CELLS ON ALTERNATE BYPASS',
            physicalEffects: {
              speedDelta: 4.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'eh_05',
            eventNumber: 5,
            title: 'EXTRACTION WINDOW',
            subtitle: 'ORBITAL RETRIEVAL TIMEOUT',
            startTimeSec: 66,
            warningLeadSec: 6,
            durationSec: 12,
            affectedLocation: 'EXTRACTION AIRLOCK // APEX PLATFORM',
            severity: 'CRITICAL',
            alertMessage: 'EXTRACTION WINDOW OPEN // LOCKDOWN ESCAPE TIME TICKING',
            recommendedAction: 'FULL BOOST SPRINT TO FINAL EXTRACTION APEX',
            physicalEffects: {
              speedDelta: 7.0,
              cameraShake: 0.45,
              audioCue: 'alarm',
            },
          },
        ];

      case 'DRONE_ASSAULT':
        return [
          {
            id: 'da_01',
            eventNumber: 1,
            title: 'DRONE DEPLOYMENT',
            subtitle: 'PATROL SQUADRON AIRSPACE INTRUSION',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'TESTING RANGE // LAUNCH TOWER 01',
            severity: 'WARNING',
            alertMessage: 'PATROL DRONES DEPLOYING ALONG TRACK // INCOMING AIRBORNE THREAT',
            recommendedAction: 'ENGAGE DESTRUCTION BEAM OR SLALOM AROUND DRONE CHASSIS',
            physicalEffects: {
              cameraShake: 0.35,
              audioCue: 'warning',
            },
          },
          {
            id: 'da_02',
            eventNumber: 2,
            title: 'RADAR LOCK',
            subtitle: 'DEFENSE ARRAY ACTIVE TRACKING',
            startTimeSec: 22,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'RADAR ARRAY CITADEL // SECTOR 02',
            severity: 'CRITICAL',
            alertMessage: 'RADAR ARRAYS ROTATING // TARGETING LOCK ON PLAYER HEADING',
            recommendedAction: 'DRIFT HARD S-CURVES TO BREAK SCANNING CONE LOCK',
            physicalEffects: {
              steeringResistance: 0.3,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
          {
            id: 'da_03',
            eventNumber: 3,
            title: 'DEFENSE REPOSITIONING',
            subtitle: 'AERIAL PLATFORM DISPLACEMENT',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'DEFENSIVE CORRIDOR // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'DEFENSIVE PLATFORMS SHIFTING LANES // TEMPORARY CORRIDOR NARROWING',
            recommendedAction: 'NAVIGATE THROUGH OPEN TRAINING FLANK BEFORE CLOSURE',
            physicalEffects: {
              lateralPush: 3.2,
              cameraShake: 0.4,
            },
          },
          {
            id: 'da_04',
            eventNumber: 4,
            title: 'INTERCEPTION WARNING',
            subtitle: 'FORMATION CROSSING TRAJECTORY',
            startTimeSec: 50,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'INTERCEPTION SECTOR // APEX RAMP',
            severity: 'CRITICAL',
            alertMessage: 'DRONE FORMATION CROSSING COURSE // RAPID INTERCEPTION PATH',
            recommendedAction: 'HOLD SIGHT-LINE AND THREAD FORMATION GAP AT SPEED',
            physicalEffects: {
              speedDelta: -2.5,
              cameraShake: 0.45,
              audioCue: 'alarm',
            },
          },
          {
            id: 'da_05',
            eventNumber: 5,
            title: 'HANGAR RELEASE',
            subtitle: 'FINAL AIRBORNE SORTIE',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'HANGAR BAY 04 // FINISH CORRIDOR',
            severity: 'WARNING',
            alertMessage: 'DRONE HANGAR DOORS EXPANDING // NEW DRONE WAVE EXITING BAYS',
            recommendedAction: 'HYPER-BOOST SPRINT PAST HANGAR THRESHOLD TO FINISH',
            physicalEffects: {
              speedDelta: 6.5,
              cameraShake: 0.35,
            },
          },
        ];

      case 'COLLAPSING_TRACK':
        return [
          {
            id: 'ct_01',
            eventNumber: 1,
            title: 'STRUCTURAL WARNING',
            subtitle: 'CANTILEVER FRACTURE TREMORS',
            startTimeSec: 9,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'FRACTURE MEGASTRUCTURE // SECTOR 01',
            severity: 'WARNING',
            alertMessage: 'STRUCTURAL WARNING // TRACK PLATES TILTING AND FAILING',
            recommendedAction: 'STAY OFF FAILING ROAD EDGES // DRIVE CENTRAL KEEL',
            physicalEffects: {
              lateralPush: 3.2,
              cameraShake: 0.5,
              audioCue: 'warning',
            },
          },
          {
            id: 'ct_02',
            eventNumber: 2,
            title: 'SUPPORT FAILURE',
            subtitle: 'TOWER HYDRAULIC COLLAPSE',
            startTimeSec: 23,
            warningLeadSec: 5,
            durationSec: 9,
            affectedLocation: 'SUPPORT TOWER 03 // ELEVATED SPAN',
            severity: 'DANGER',
            alertMessage: 'SUPPORT TOWER LEANING RAPIDLY // SECTION BECOMING UNSAFE',
            recommendedAction: 'PUNCH BOOST TO ESCAPE COLLAPSING SPAN SECTION',
            physicalEffects: {
              cameraShake: 0.6,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ct_03',
            eventNumber: 3,
            title: 'TRACK COLLAPSE',
            subtitle: 'SEGMENT DISINTEGRATION GAP',
            startTimeSec: 38,
            warningLeadSec: 6,
            durationSec: 8,
            affectedLocation: 'CONSTRUCTION CHASM // SECTOR 02',
            severity: 'DANGER',
            alertMessage: 'TRACK COLLAPSE IMMINENT // LEFT PLATES FALLING INTO VOID',
            recommendedAction: 'SWERVE IMMEDIATELY RIGHT TOWARD ESCAPE DIRECTION',
            physicalEffects: {
              lateralPush: 4.0,
              steeringResistance: 0.25,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'ct_04',
            eventNumber: 4,
            title: 'EMERGENCY BRIDGE',
            subtitle: 'HYDRAULIC REINFORCEMENT EXTENSION',
            startTimeSec: 52,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'EMERGENCY SPAN // ALTERNATE TRANSIT',
            severity: 'ADVISORY',
            alertMessage: 'EMERGENCY BRIDGE EXTENDED // USABLE ALTERNATE ROUTE DEPLOYED',
            recommendedAction: 'TAKE EXTENDED EMERGENCY BRIDGE TO BYPASS CHASM',
            physicalEffects: {
              speedDelta: 4.5,
              cameraShake: 0.35,
            },
          },
          {
            id: 'ct_05',
            eventNumber: 5,
            title: 'SECONDARY COLLAPSE',
            subtitle: 'PROGRESSIVE MEGASTRUCTURE TEAR',
            startTimeSec: 66,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'FINAL TRANSIT APEX // REDOUBT',
            severity: 'CRITICAL',
            alertMessage: 'SECONDARY COLLAPSE PROPAGATING // APEX ROADWAY UNSTABLE',
            recommendedAction: 'MAXIMUM SPRINT TO SECURE REINFORCED SHELTER REDOUBT',
            physicalEffects: {
              speedDelta: 7.0,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
        ];

      case 'RING_RUNNER':
        return [
          {
            id: 'rr_01',
            eventNumber: 1,
            title: 'RING ALIGNMENT',
            subtitle: 'CONCENTRIC TRACK TRANSITION',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'ORBITAL RING COMPLEX // SECTOR 01',
            severity: 'ADVISORY',
            alertMessage: 'RING ALIGNMENT CONFIRMED // AVAILABLE CONCENTRIC CONNECTION OPEN',
            recommendedAction: 'ALIGN VECTOR WITH INNER ROTATING RING CHANNEL FOR BOOST',
            physicalEffects: {
              speedDelta: 5.5,
              cameraShake: 0.25,
            },
          },
          {
            id: 'rr_02',
            eventNumber: 2,
            title: 'ROTATION WARNING',
            subtitle: 'ANGULAR VELOCITY SHIFT',
            startTimeSec: 22,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'RING STATION 02 // SECTOR 02',
            severity: 'WARNING',
            alertMessage: 'ROTATION WARNING // CLOCKWISE ROTATION ACCELERATING AT 45 DEG/S',
            recommendedAction: 'COUNTER-LEAN TOWARD TANGENT LINE TO CANCEL CENTRIFUGAL DRIFT',
            physicalEffects: {
              lateralPush: 3.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'rr_03',
            eventNumber: 3,
            title: 'BRIDGE ROTATION',
            subtitle: 'SUSPENDED CONNECTING SPAN',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'TRANSIT GANTRY // RING 03 CONNECTION',
            severity: 'WARNING',
            alertMessage: 'CONNECTING BRIDGE ROTATING INTO LOCK // TIMING WINDOW ARMED',
            recommendedAction: 'CROSS CONNECTING SECTION WHILE COUPLER IS GREEN',
            physicalEffects: {
              steeringResistance: 0.2,
              cameraShake: 0.35,
            },
          },
          {
            id: 'rr_04',
            eventNumber: 4,
            title: 'TRACK GAP',
            subtitle: 'ROTARY SLIT DISJUNCTION',
            startTimeSec: 50,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'HIGH ELEVATION RING // GAP APEX',
            severity: 'CRITICAL',
            alertMessage: 'TRACK GAP APPROACHING // ROTATING APERTURE REQUIRES HIGH VELOCITY',
            recommendedAction: 'MAINTAIN MAXIMUM BOOST SPEED TO JUMP ROTATING OPENING',
            physicalEffects: {
              speedDelta: 4.0,
              cameraShake: 0.45,
              audioCue: 'alarm',
            },
          },
          {
            id: 'rr_05',
            eventNumber: 5,
            title: 'MAGNETIC SURGE',
            subtitle: 'ACCELERATION INDUCTION ZONE',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'OUTER RING TERMINUS // FINISH HUB',
            severity: 'ADVISORY',
            alertMessage: 'MAGNETIC SURGE ENGAGED // +80 KM/H TRACTION ACCELERATION SURGE',
            recommendedAction: 'HOLD RACING LINE THROUGH FINAL MAGNETIC PODIUM GATE',
            physicalEffects: {
              speedDelta: 8.0,
              tractionMultiplier: 1.3,
              cameraShake: 0.4,
            },
          },
        ];

      case 'HYPERSPACE_SPRINT':
        return [
          {
            id: 'hs_01',
            eventNumber: 1,
            title: 'HYPERDRIVE SURGE',
            subtitle: 'SUPERLUMINAL INJECTION WINDOW',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'WARP CORRIDOR // SECTOR 01',
            severity: 'ADVISORY',
            alertMessage: 'HYPERDRIVE SURGE ACTIVE // ACCELERATION WINDOW EXPANDED',
            recommendedAction: 'HOLD FULL ACCELERATION THROUGH LUMINOUS GEOMETRIC GATES',
            physicalEffects: {
              speedDelta: 7.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'hs_02',
            eventNumber: 2,
            title: 'CORRIDOR CONTRACTION',
            subtitle: 'SPATIAL COMPRESSION TUNNEL',
            startTimeSec: 22,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'STATOR TUNNEL // SECTOR 02',
            severity: 'WARNING',
            alertMessage: 'CORRIDOR CONTRACTION // LATERAL DIAMETER REDUCING BY 40%',
            recommendedAction: 'HOLD EXACT CENTER TUNNEL VECTOR // AVOID WALL ARCS',
            physicalEffects: {
              speedDelta: 6.0,
              steeringResistance: 0.25,
              cameraShake: 0.45,
            },
          },
          {
            id: 'hs_03',
            eventNumber: 3,
            title: 'GATE SEQUENCE',
            subtitle: 'ORDINAL OPENING MATRIX',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'PRISM GATES // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'GATE SEQUENCE: CENTER -> LEFT -> CENTER IN RAPID ORDER',
            recommendedAction: 'READ FLASHING CHEVRONS AND SWITCH LANES IN SEQUENCE',
            physicalEffects: {
              tractionMultiplier: 0.85,
              cameraShake: 0.4,
            },
          },
          {
            id: 'hs_04',
            eventNumber: 4,
            title: 'LANE SHIFT',
            subtitle: 'LATERAL ROUTE RECONFIGURATION',
            startTimeSec: 50,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'HIGHWAY CONDUIT // PEAK FLUX',
            severity: 'CRITICAL',
            alertMessage: 'LANE SHIFT IMMINENT // TRACK SURFACE DISPLACING TO RIGHT FLANK',
            recommendedAction: 'SHIFT RIGHT ONTO EXPANDING ENERGY RAIL',
            physicalEffects: {
              lateralPush: 3.8,
              speedDelta: 6.5,
              cameraShake: 0.45,
            },
          },
          {
            id: 'hs_05',
            eventNumber: 5,
            title: 'TURBULENCE WARNING',
            subtitle: 'NORMAL-SPACE BOUNDARY INSTABILITY',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'RE-ENTRY VORTEX // FINISH GATE',
            severity: 'CRITICAL',
            alertMessage: 'SPATIAL TURBULENCE IN EXIT CONDUIT // EXTREME VELOCITY',
            recommendedAction: 'MAINTAIN GYRO-STABILITY THROUGH FINAL FINISH PORTAL',
            physicalEffects: {
              speedDelta: 8.5,
              cameraShake: 0.55,
              audioCue: 'warp',
            },
          },
        ];

      case 'RIVAL_DUEL':
        return [
          {
            id: 'rd_01',
            eventNumber: 1,
            title: 'DUEL PHASE CHANGE',
            subtitle: 'NEXT ARENA CONFIGURATION',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'ARENA COLOSSEUM // SECTOR 01',
            severity: 'WARNING',
            alertMessage: 'DUEL PHASE 2 ENGAGED // ARENA PLATFORMS ROTATING TO SPLIT ELEVATIONS',
            recommendedAction: 'DRAFT DIRECTLY IN RIVAL SLIPSTREAM BEFORE CONFIGURATION SHIFT',
            physicalEffects: {
              speedDelta: 4.5,
              cameraShake: 0.3,
              audioCue: 'warning',
            },
          },
          {
            id: 'rd_02',
            eventNumber: 2,
            title: 'OVERTAKE WINDOW',
            subtitle: 'HIGH-RISK PASSING CORRIDOR',
            startTimeSec: 22,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'ARENA CENTER // OVERTAKE BYPASS',
            severity: 'ADVISORY',
            alertMessage: 'OVERTAKE WINDOW AVAILABLE // LOWER SPEED LANE UNLOCKED',
            recommendedAction: 'TAKE INSIDE OVERTAKE APEX LINE TO PASS RIVAL ON CORNER',
            physicalEffects: {
              speedDelta: 5.5,
              cameraShake: 0.25,
            },
          },
          {
            id: 'rd_03',
            eventNumber: 3,
            title: 'BARRIER SHIFT',
            subtitle: 'TACTICAL LANE ALTERATION',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'TACTICAL CHICANE // SECTOR 02',
            severity: 'CRITICAL',
            alertMessage: 'BARRIER SHIFT // VERTICAL OBSTACLES EXTENDING INTO LEFT LANE',
            recommendedAction: 'VEER RIGHT TO REMAIN IN CLEAR DRIVING CORRIDOR',
            physicalEffects: {
              steeringResistance: 0.3,
              lateralPush: -3.5,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
          {
            id: 'rd_04',
            eventNumber: 4,
            title: 'FINAL LAP',
            subtitle: 'CHAMPIONSHIP DUEL CLIMAX',
            startTimeSec: 50,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'GLADIATOR APEX // SPRINT STRAIGHT',
            severity: 'WARNING',
            alertMessage: 'FINAL LAP CONFIRMED // ALL ARENA HAZARDS AT MAXIMUM BALANCED FLUX',
            recommendedAction: 'MAINTAIN DEFENSIVE RACING LINE ACROSS HIGH-SPEED CHICANE',
            physicalEffects: {
              speedDelta: 6.0,
              tractionMultiplier: 1.1,
              cameraShake: 0.4,
            },
          },
          {
            id: 'rd_05',
            eventNumber: 5,
            title: 'ARENA RECONFIGURATION',
            subtitle: 'FINAL PODIUM CHICANE DEPLOYMENT',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'CHAMPION GATE // PODIUM FINISH',
            severity: 'CRITICAL',
            alertMessage: 'ARENA RECONFIGURATION COMPLETE // STRAIGHTAWAY TO FINISH OPEN',
            recommendedAction: 'FULL HYPER-BOOST SPRINT ACROSS PODIUM FINISH LINE',
            physicalEffects: {
              speedDelta: 7.5,
              cameraShake: 0.45,
            },
          },
        ];

      case 'RELAY_RACE':
        return [
          {
            id: 'rr_01',
            eventNumber: 1,
            title: 'RELAY ACTIVATION',
            subtitle: 'FIRST RUNNER SECTOR DEPLOYMENT',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'RELAY DISTRICT 01 // ORBITAL SPAN',
            severity: 'ADVISORY',
            alertMessage: 'RELAY ACTIVE // SPEED CRAFT ENGAGED ON PRIMARY RUNWAY',
            recommendedAction: 'MAXIMIZE SPEED SPRINT TOWARD UPCOMING HANDOFF DOCK',
            physicalEffects: {
              speedDelta: 5.0,
              cameraShake: 0.25,
            },
          },
          {
            id: 'rr_02',
            eventNumber: 2,
            title: 'HANDOFF READY',
            subtitle: 'VALID VEHICLE EXCHANGE PLATFORM',
            startTimeSec: 22,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'HANDOFF PLATFORM 01 // SECTOR 02 TRANSIT',
            severity: 'WARNING',
            alertMessage: 'HANDOFF READY // MECHANICAL TRANSFER GATE ELEVATING TO ALIGNMENT',
            recommendedAction: 'FLY PRECISELY THROUGH HANDOFF ZONE TO TRIGGER TRANSFER',
            physicalEffects: {
              tractionMultiplier: 1.25,
              steeringResistance: -0.2,
              cameraShake: 0.35,
            },
          },
          {
            id: 'rr_03',
            eventNumber: 3,
            title: 'SECTOR TRANSITION',
            subtitle: 'AGILITY DISTRICT S-CURVES',
            startTimeSec: 36,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'DISTRICT 02 // TECHNICAL SECTOR',
            severity: 'ADVISORY',
            alertMessage: 'SECTOR TRANSITION COMPLETE // HANDLING CRAFT ACTIVE ON TRACK',
            recommendedAction: 'CARVE TECHNICAL CORNERS WITH MAXIMUM DRIFT PRECISION',
            physicalEffects: {
              speedDelta: 4.5,
              cameraShake: 0.2,
            },
          },
          {
            id: 'rr_04',
            eventNumber: 4,
            title: 'CHECKPOINT POWER FAILURE',
            subtitle: 'SECONDARY GRID BROWNOUT',
            startTimeSec: 50,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'CHECKPOINT TOWER 03 // RELAY JUNCTION',
            severity: 'WARNING',
            alertMessage: 'CHECKPOINT POWER FAILURE // EMERGENCY BACKUP BEACON ACTIVE',
            recommendedAction: 'NAVIGATE TOWARD ILLUMINATED EMERGENCY BEACON LINE',
            physicalEffects: {
              tractionMultiplier: 0.9,
              cameraShake: 0.35,
              audioCue: 'warning',
            },
          },
          {
            id: 'rr_05',
            eventNumber: 5,
            title: 'ROUTE CONNECTION READY',
            subtitle: 'DEPLOYED SECTOR BRIDGE',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'FINAL TRANSIT BRIDGE // FINISH ARCH',
            severity: 'CRITICAL',
            alertMessage: 'ROUTE CONNECTION READY // INTER-SECTOR TRANSPORT BRIDGE EXTENDED',
            recommendedAction: 'CROSS EXTENDED BRIDGE AT FULL SPEED TO ANCHOR VICTORY',
            physicalEffects: {
              speedDelta: 8.5,
              cameraShake: 0.45,
            },
          },
        ];

      case 'SURVIVAL_ELIMINATION':
        return [
          {
            id: 'se_01',
            eventNumber: 1,
            title: 'SURVIVAL PHASE',
            subtitle: 'PHASE 01 COMMENCEMENT',
            startTimeSec: 15,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'SURVIVAL ARENA // CENTRAL HUB',
            severity: 'CRITICAL',
            alertMessage: 'SURVIVAL PHASE 01 ACTIVE // ELIMINATION COUNTDOWN ENGAGED',
            recommendedAction: 'OVERTAKE TO ESCAPE LAST PLACE BEFORE TIMER EXPIRES',
            physicalEffects: {
              speedDelta: 3.5,
              cameraShake: 0.4,
              audioCue: 'alarm',
            },
          },
          {
            id: 'se_02',
            eventNumber: 2,
            title: 'OUTER LANE CLOSURE',
            subtitle: 'RETRACTING PERIMETER ROADWAY',
            startTimeSec: 30,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'OUTER RING // RETRACTING SECTOR',
            severity: 'DANGER',
            alertMessage: 'OUTER LANE CLOSURE // PERIMETER ROAD RETRACTING INTO CORE IN 5s',
            recommendedAction: 'CONVERGE TOWARD CENTER TRACK TO AVOID DISINTEGRATION',
            physicalEffects: {
              lateralPush: 3.8,
              cameraShake: 0.5,
              audioCue: 'warning',
            },
          },
          {
            id: 'se_03',
            eventNumber: 3,
            title: 'SAFE ZONE SHIFT',
            subtitle: 'ELEVATED REFUGE DISPLACEMENT',
            startTimeSec: 45,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'ELEVATED SAFE ZONE // ISLAND 02',
            severity: 'CRITICAL',
            alertMessage: 'SAFE ZONE SHIFTING // NEW SAFE CORRIDOR MARKED IN GREEN',
            recommendedAction: 'REDIRECT VEHICLE ONTO ELEVATED SAFE-ZONE BRIDGE',
            physicalEffects: {
              speedDelta: -2.0,
              cameraShake: 0.55,
              audioCue: 'alarm',
            },
          },
          {
            id: 'se_04',
            eventNumber: 4,
            title: 'HAZARD ESCALATION',
            subtitle: 'INCREASED DENSITY MATRIX',
            startTimeSec: 60,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'CENTRAL CHICANE // HAZARD SECTOR',
            severity: 'DANGER',
            alertMessage: 'HAZARD ESCALATION // ROTATING BARRIERS SPEEDING UP BY 50%',
            recommendedAction: 'HOLD SIGHT-LINE AND THREAD TIGHT DEFENSIVE GAPS',
            physicalEffects: {
              steeringResistance: 0.25,
              cameraShake: 0.6,
            },
          },
          {
            id: 'se_05',
            eventNumber: 5,
            title: 'FINAL SURVIVAL',
            subtitle: 'CHAMPIONSHIP KNOCKOUT APEX',
            startTimeSec: 75,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'FINAL SURVIVOR APEX // SURVIVAL GATE',
            severity: 'CRITICAL',
            alertMessage: 'FINAL SURVIVAL REACHED // ONLY LAST STANDING CRAFT PREVAILS',
            recommendedAction: 'MAXIMUM SPRINT TO FINAL SURVIVOR SAFE PORTAL',
            physicalEffects: {
              speedDelta: 7.5,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
        ];

      case 'COSMIC_TREASURE_HUNT':
        return [
          {
            id: 'th_01',
            eventNumber: 1,
            title: 'ARTIFACT DETECTED',
            subtitle: 'PRECURSOR HARMONIC RADAR PING',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'PRECURSOR RUINS // SECTOR 01',
            severity: 'ADVISORY',
            alertMessage: 'ARTIFACT DETECTED // GLOWING RELIC DETECTED 35M ON FLANK',
            recommendedAction: 'DIVERGE SLIGHTLY TOWARD GLYPH BEACON TO RETRIEVE ARTIFACT',
            physicalEffects: {
              tractionMultiplier: 1.15,
              cameraShake: 0.25,
            },
          },
          {
            id: 'th_02',
            eventNumber: 2,
            title: 'VAULT ACTIVATION',
            subtitle: 'UNLOCKING MECHANISM ENGAGED',
            startTimeSec: 22,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'PUZZLE SANCTUM // SECTOR 02',
            severity: 'ADVISORY',
            alertMessage: 'VAULT ACTIVATION // ROTATING CELESTIAL RINGS POWERING RUNWAY',
            recommendedAction: 'THREAD INNER SANCTUM ARCH TO TRIGGER MECHANISM KEY',
            physicalEffects: {
              speedDelta: 5.0,
              cameraShake: 0.3,
            },
          },
          {
            id: 'th_03',
            eventNumber: 3,
            title: 'BRIDGE ALIGNMENT',
            subtitle: 'CRYSTAL SPAN MATERIALIZATION',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'ANCIENT CHASM // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'BRIDGE ALIGNMENT // FLOATING CRYSTAL PLATFORMS FORMING NEW PASSAGE',
            recommendedAction: 'CROSS CRYSTAL RUNWAY BEFORE PLATFORM POLARITY REVERSES',
            physicalEffects: {
              speedDelta: 4.5,
              cameraShake: 0.35,
            },
          },
          {
            id: 'th_04',
            eventNumber: 4,
            title: 'DEFENSE ACTIVATION',
            subtitle: 'PRECURSOR SENTINEL SYSTEM ARMED',
            startTimeSec: 50,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'TEMPLE PERIMETER // DEFENSE APEX',
            severity: 'CRITICAL',
            alertMessage: 'DEFENSE ACTIVATION // ANCIENT DEFENSE SYSTEM EMITTING CONE WAVES',
            recommendedAction: 'WEAVE BETWEEN OBELISK TOWERS TO AVOID DEFENSE FIELDS',
            physicalEffects: {
              lateralPush: 3.2,
              steeringResistance: 0.25,
              cameraShake: 0.5,
              audioCue: 'alarm',
            },
          },
          {
            id: 'th_05',
            eventNumber: 5,
            title: 'TREASURE CHAMBER OPEN',
            subtitle: 'NEWLY ACCESSIBLE VAULT TERMINUS',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 10,
            affectedLocation: 'CENTRAL VAULT // FINISH GATEWAY',
            severity: 'CRITICAL',
            alertMessage: 'TREASURE CHAMBER OPEN // FINAL EXTRACTION STARGATE ILLUMINATED',
            recommendedAction: 'SPRINT THROUGH REVEALED CHAMBER PORTAL WITH RELICS INTACT',
            physicalEffects: {
              speedDelta: 7.5,
              cameraShake: 0.45,
            },
          },
        ];

      case 'VOID_CHAMPIONSHIP':
        return [
          {
            id: 'vc_01',
            eventNumber: 1,
            title: 'SECTOR TRANSITION',
            subtitle: 'APPROACHING TECHNICAL SECTOR 02',
            startTimeSec: 8,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'GRAND PRIX ARENA // SECTOR 01 TO 02',
            severity: 'ADVISORY',
            alertMessage: 'SECTOR TRANSITION // ENTERING TECHNICAL ELEVATION HAIRPINS',
            recommendedAction: 'PREPARE DRIFT INITIATION ON GOLDEN ELEVATION CREST',
            physicalEffects: {
              speedDelta: 5.5,
              cameraShake: 0.25,
            },
          },
          {
            id: 'vc_02',
            eventNumber: 2,
            title: 'CHAMPIONSHIP PHASE',
            subtitle: 'CURRENT RACE PROGRESSION MATRIX',
            startTimeSec: 22,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'STADIUM CORE // GRANDSTAND ARCS',
            severity: 'ADVISORY',
            alertMessage: 'CHAMPIONSHIP PHASE 2 // SPEED REQUIREMENTS ESCALATING (+20 PTS)',
            recommendedAction: 'HOLD INSIDE APEX LINE TO MAINTAIN CHAMPIONSHIP LEAD',
            physicalEffects: {
              speedDelta: 4.5,
              cameraShake: 0.2,
            },
          },
          {
            id: 'vc_03',
            eventNumber: 3,
            title: 'BRIDGE DEPLOYMENT',
            subtitle: 'HIGH-SPEED OVERPASS EXTENSION',
            startTimeSec: 36,
            warningLeadSec: 5,
            durationSec: 8,
            affectedLocation: 'OVERPASS SPAN // SECTOR 03',
            severity: 'WARNING',
            alertMessage: 'BRIDGE DEPLOYMENT // NEW OVERTAKE BRIDGE EXTENDED OVER STADIUM',
            recommendedAction: 'LAUNCH ACROSS EXTENDED OVERPASS FOR PRECISION SHORTCUT',
            physicalEffects: {
              speedDelta: 6.5,
              tractionMultiplier: 1.15,
              cameraShake: 0.35,
            },
          },
          {
            id: 'vc_04',
            eventNumber: 4,
            title: 'FINAL LAP',
            subtitle: 'FINAL CHAMPIONSHIP DECIDER',
            startTimeSec: 50,
            warningLeadSec: 4,
            durationSec: 8,
            affectedLocation: 'CHAMPIONSHIP SPIRES // SECTOR 04',
            severity: 'CRITICAL',
            alertMessage: 'FINAL LAP // ALL STADIUM LIGHTS SYNCHRONIZED TO LEADING CRAFT',
            recommendedAction: 'DEFEND APEX POSITION VIGOROUSLY ACROSS HIGH-SPEED STRAIGHT',
            physicalEffects: {
              speedDelta: 6.0,
              cameraShake: 0.4,
              audioCue: 'warning',
            },
          },
          {
            id: 'vc_05',
            eventNumber: 5,
            title: 'FINISH SEQUENCE',
            subtitle: 'GRAND PRIX PODIUM SPRINT',
            startTimeSec: 64,
            warningLeadSec: 5,
            durationSec: 12,
            affectedLocation: 'PODIUM ARENA // APEX FINISH',
            severity: 'CRITICAL',
            alertMessage: 'FINISH SEQUENCE ENGAGED // FINAL SPRINT TO GOLD PODIUM LINE',
            recommendedAction: 'FULL THROTTLE SPRINT ACROSS CHAMPIONSHIP FINISH LINE',
            physicalEffects: {
              speedDelta: 8.5,
              cameraShake: 0.45,
            },
          },
        ];

      default:
        return [];
    }
  }
}
