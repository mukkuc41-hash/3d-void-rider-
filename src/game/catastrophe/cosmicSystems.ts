import * as THREE from 'three';
import { sound } from '../audio';
import type {
  CosmicEventElement,
  CosmicElementType,
} from './cosmicEventElementsCatalog';
import { COSMIC_40_EVENT_PAIRS } from './cosmicEventElementsCatalog';

export type { CosmicEventElement, CosmicElementType };
export { COSMIC_40_EVENT_PAIRS };

/**
 * 40-Event Cosmic Catastrophe Definition
 * Every event has:
 * CAUSE -> PHYSICAL EFFECT -> ENVIRONMENTAL RESPONSE -> PLAYER RESPONSE -> PERSISTENT AFTERMATH
 * Includes 2 real celestial elements with real appearance, revolution, collision, spaghettification, and completion strategy.
 */
export type QuantumCinematicBeat =
  | 'ESTABLISHING' | 'PLAYER_POV' | 'CHASE_OBJECT' | 'BLACK_HOLE_CLOSEUP'
  | 'ROUTE_DESTRUCTION' | 'OBJECT_TRACKING' | 'GRAVITY_LENS'
  | 'SLOW_MOTION_IMPACT' | 'SHOCKWAVE_SHAKE' | 'GAMEPLAY_RETURN'
  | 'REAR_ESCAPE' | 'ORBITAL_LAUNCHER' | 'MAGNETIC_LOCK'
  | 'ACCELERATION_RING_1' | 'ACCELERATION_RING_2' | 'ACCELERATION_RING_3'
  | 'ORBITAL_GATE_REVEAL' | 'ESCAPE_VECTOR' | 'STATION_ARRIVAL'
  | 'SHIP_SECURED' | 'OBSERVATION_WINDOW' | 'FINAL_COLLAPSE';

export interface QuantumCinematicBeatDef { beat: QuantumCinematicBeat; duration: number; }

export interface CosmicEventDefinition {
  index: number;
  id: string;
  name: string;
  title: string;
  subtitle: string;
  countdownTime?: string;
  cause: string;
  physicalEffect: string;
  environmentalResponse: string;
  playerResponse: string;
  triggerTime: number; // in seconds from evacuation start
  severity: number; // 1 to 10 scale
  gravityParams: {
    gravityInfluenceRadius: number;
    gravityAsymmetry: number;
    lensingStrength: number;
    tidalStrength: number;
    infallRate: number;
    accretionActivity: number;
    matterStreamIntensity: number;
    gravitationalWaveStrength: number;
    spacetimeDistortion: number;
    environmentCompression: number;
    asymmetricExpansion: number;
    collapseIntensity: number;
  };
  element1: CosmicEventElement;
  element2: CosmicEventElement;
  eventOccurrenceNarrative: string;
  completionStrategy: string;
  cinematicBeats: QuantumCinematicBeatDef[];
}

import { RAW_COSMIC_100_EVENTS } from './cosmic100EventsCatalog';
export const RAW_COSMIC_40_EVENTS = RAW_COSMIC_100_EVENTS;
export const RAW_COSMIC_100_EVENTS_LIST = RAW_COSMIC_100_EVENTS;

const QUANTUM_CINEMATIC_BEATS: QuantumCinematicBeat[][] = [['ESTABLISHING', 'BLACK_HOLE_CLOSEUP', 'GRAVITY_LENS', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'GRAVITY_LENS', 'PLAYER_POV', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'OBJECT_TRACKING', 'GRAVITY_LENS', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'BLACK_HOLE_CLOSEUP', 'CHASE_OBJECT', 'SLOW_MOTION_IMPACT'], ['BLACK_HOLE_CLOSEUP', 'GRAVITY_LENS', 'PLAYER_POV', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'GRAVITY_LENS', 'SHOCKWAVE_SHAKE', 'PLAYER_POV'], ['CHASE_OBJECT', 'OBJECT_TRACKING', 'PLAYER_POV', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'CHASE_OBJECT', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE'], ['OBJECT_TRACKING', 'BLACK_HOLE_CLOSEUP', 'GAMEPLAY_RETURN'], ['PLAYER_POV', 'GRAVITY_LENS', 'BLACK_HOLE_CLOSEUP', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'PLAYER_POV', 'SHOCKWAVE_SHAKE', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'OBJECT_TRACKING', 'GRAVITY_LENS', 'PLAYER_POV'], ['CHASE_OBJECT', 'OBJECT_TRACKING', 'SLOW_MOTION_IMPACT', 'GAMEPLAY_RETURN'], ['CHASE_OBJECT', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE', 'PLAYER_POV'], ['OBJECT_TRACKING', 'BLACK_HOLE_CLOSEUP', 'ROUTE_DESTRUCTION', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'BLACK_HOLE_CLOSEUP', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'CHASE_OBJECT', 'ROUTE_DESTRUCTION', 'PLAYER_POV'], ['OBJECT_TRACKING', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'GRAVITY_LENS', 'ROUTE_DESTRUCTION', 'GAMEPLAY_RETURN'], ['CHASE_OBJECT', 'ROUTE_DESTRUCTION', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'PLAYER_POV', 'SHOCKWAVE_SHAKE', 'ROUTE_DESTRUCTION'], ['ESTABLISHING', 'OBJECT_TRACKING', 'PLAYER_POV', 'GAMEPLAY_RETURN'], ['CHASE_OBJECT', 'OBJECT_TRACKING', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'OBJECT_TRACKING', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP'], ['OBJECT_TRACKING', 'BLACK_HOLE_CLOSEUP', 'GRAVITY_LENS', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'GRAVITY_LENS', 'BLACK_HOLE_CLOSEUP', 'PLAYER_POV'], ['ESTABLISHING', 'ROUTE_DESTRUCTION', 'GRAVITY_LENS', 'PLAYER_POV'], ['ESTABLISHING', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'CHASE_OBJECT', 'ROUTE_DESTRUCTION', 'PLAYER_POV'], ['CHASE_OBJECT', 'SLOW_MOTION_IMPACT', 'SHOCKWAVE_SHAKE', 'ROUTE_DESTRUCTION'], ['ESTABLISHING', 'PLAYER_POV', 'GRAVITY_LENS', 'SHOCKWAVE_SHAKE'], ['BLACK_HOLE_CLOSEUP', 'OBJECT_TRACKING', 'SLOW_MOTION_IMPACT', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'ROUTE_DESTRUCTION', 'OBJECT_TRACKING', 'BLACK_HOLE_CLOSEUP'], ['PLAYER_POV', 'ROUTE_DESTRUCTION', 'SHOCKWAVE_SHAKE', 'GAMEPLAY_RETURN'], ['ESTABLISHING', 'BLACK_HOLE_CLOSEUP', 'PLAYER_POV', 'SHOCKWAVE_SHAKE'], ['ESTABLISHING', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP', 'REAR_ESCAPE'], ['REAR_ESCAPE', 'ROUTE_DESTRUCTION', 'PLAYER_POV', 'SHOCKWAVE_SHAKE'], ['REAR_ESCAPE', 'OBJECT_TRACKING', 'BLACK_HOLE_CLOSEUP', 'GRAVITY_LENS'], ['REAR_ESCAPE', 'ROUTE_DESTRUCTION', 'SHOCKWAVE_SHAKE', 'FINAL_COLLAPSE'], ['REAR_ESCAPE', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP', 'FINAL_COLLAPSE']];

export const COSMIC_40_EVENTS: CosmicEventDefinition[] = RAW_COSMIC_40_EVENTS.map(raw => {
  const pair = COSMIC_40_EVENT_PAIRS[raw.index] ?? COSMIC_40_EVENT_PAIRS[((raw.index - 1) % 40) + 1];
  const defaultBeats: QuantumCinematicBeat[] = raw.index === 100
    ? ['REAR_ESCAPE', 'ROUTE_DESTRUCTION', 'BLACK_HOLE_CLOSEUP', 'FINAL_COLLAPSE']
    : raw.index >= 90
    ? ['REAR_ESCAPE', 'ROUTE_DESTRUCTION', 'PLAYER_POV', 'SHOCKWAVE_SHAKE']
    : ['ESTABLISHING', 'OBJECT_TRACKING', 'GRAVITY_LENS', 'GAMEPLAY_RETURN'];

  const beats = QUANTUM_CINEMATIC_BEATS[raw.index - 1] ?? defaultBeats;

  return {
    ...raw,
    element1: pair.element1,
    element2: pair.element2,
    eventOccurrenceNarrative: pair.eventOccurrenceNarrative,
    completionStrategy: pair.completionStrategy,
    cinematicBeats: beats.map((beat, i, arr) => ({ beat, duration: i === arr.length - 1 ? 0.9 : 1.1 })),
  };
});

export const COSMIC_100_EVENTS = COSMIC_40_EVENTS;
export const TOTAL_COSMIC_EVENTS = 100;

/* =========================================================================
   1. PersistentDestructionRegistry
   Stores the persistent destruction state across the entire continuous universe.
   Destruction accumulates; nothing resets.
   ========================================================================= */
export interface RegisteredDestructionEntity {
  id: string;
  sourceEvent: number;
  type: 'PLANET' | 'MOON' | 'STATION' | 'BRIDGE' | 'TOWER' | 'RING' | 'TRACK' | 'CARGO';
  state: 'STABLE' | 'DAMAGED' | 'UNSTABLE' | 'COLLAPSING' | 'DESTROYED' | 'FRAGMENTED' | 'DEBRIS' | 'DISTANT_DEBRIS' | 'INFALL' | 'CONSUMED';
  initialPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  fragmentCount: number;
  damagePercent: number;
  persistedInWorld: boolean;
}

export class PersistentDestructionRegistry {
  private static instance: PersistentDestructionRegistry;
  public entities: Map<string, RegisteredDestructionEntity> = new Map();
  public accumulatedDebrisCount = 0;
  public totalFracturedStructures = 0;
  public totalCollapsedRouteMeters = 0;

  public static getInstance(): PersistentDestructionRegistry {
    if (!PersistentDestructionRegistry.instance) {
      PersistentDestructionRegistry.instance = new PersistentDestructionRegistry();
    }
    return PersistentDestructionRegistry.instance;
  }

  public register(entity: RegisteredDestructionEntity): void {
    this.entities.set(entity.id, entity);
    if (entity.state === 'DESTROYED' || entity.state === 'FRAGMENTED' || entity.state === 'DEBRIS') {
      this.accumulatedDebrisCount += entity.fragmentCount;
      this.totalFracturedStructures++;
    }
  }

  public updateState(id: string, state: RegisteredDestructionEntity['state'], damagePercent = 100): void {
    const e = this.entities.get(id);
    if (e) {
      e.state = state;
      e.damagePercent = Math.max(e.damagePercent, damagePercent);
    }
  }

  public getEntity(id: string): RegisteredDestructionEntity | undefined {
    return this.entities.get(id);
  }

  public reset(): void {
    this.entities.clear();
    this.accumulatedDebrisCount = 0;
    this.totalFracturedStructures = 0;
    this.totalCollapsedRouteMeters = 0;
  }
}

/* =========================================================================
   2. CosmicEventScheduler
   Schedules and coordinates the 40 events across continuous gameplay.
   ========================================================================= */
export class CosmicEventScheduler {
  public currentEventIndex = 0;
  public activeEvent: CosmicEventDefinition | null = null;
  public nextEventTime = 0.1;
  public phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' = 'GAMEPLAY';
  public phaseTimer = 0;
  public eventHistory: string[] = [];
  public activeCinematicBeatIndex = 0;

  public update(elapsedSeconds: number, dt: number): CosmicEventDefinition | null {
    // Check for next threshold crossing
    for (const def of COSMIC_40_EVENTS) {
      if (def.index === this.currentEventIndex + 1 && elapsedSeconds >= def.triggerTime) {
        this.triggerEvent(def);
        return def;
      }
    }

    // Advance phase timer
    if (this.activeEvent) {
      this.phaseTimer += dt;
      const beats = this.activeEvent.cinematicBeats;
      if (beats.length) {
        const beatT = Math.min(beats.reduce((sum, b) => sum + b.duration, 0) - 1e-4, this.phaseTimer);
        let accum = 0; this.activeCinematicBeatIndex = 0;
        for (let i = 0; i < beats.length; i++) { accum += beats[i].duration; if (beatT < accum) { this.activeCinematicBeatIndex = i; break; } }
      }
      if (this.phase === 'WARNING' && this.phaseTimer >= 3.0) {
        this.phase = 'BUILDUP';
      } else if (this.phase === 'BUILDUP' && this.phaseTimer >= 5.5) {
        this.phase = 'CINEMATIC';
      } else if (this.phase === 'CINEMATIC' && this.phaseTimer >= 8.0) {
        this.phase = 'GAMEPLAY';
      }
    }

    return null;
  }

  public triggerEvent(def: CosmicEventDefinition): void {
    this.currentEventIndex = def.index;
    this.activeEvent = def;
    this.phase = 'WARNING';
    this.phaseTimer = 0;
    this.activeCinematicBeatIndex = 0;
    this.eventHistory.push(def.id);
    this.nextEventTime = def.index < COSMIC_40_EVENTS.length ? COSMIC_40_EVENTS[def.index].triggerTime : 900;
  }

  public jumpToEvent(index: number): CosmicEventDefinition | null {
    const def = COSMIC_40_EVENTS.find(e => e.index === index);
    if (def) {
      this.triggerEvent(def);
      return def;
    }
    return null;
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.activeEvent = null;
    this.nextEventTime = 0.1;
    this.phase = 'GAMEPLAY';
    this.phaseTimer = 0;
    this.eventHistory = [];
    this.activeCinematicBeatIndex = 0;
  }
}

/* =========================================================================
   3. GravityEventSystem
   Manages the 12 controlled black hole environmental parameters.
   DOES NOT REDESIGN THE BLACK HOLE.
   ========================================================================= */
export class GravityEventSystem {
  public gravityInfluenceRadius = 0.15;
  public gravityAsymmetry = 0.05;
  public lensingStrength = 0.1;
  public tidalStrength = 0.12;
  public infallRate = 0.1;
  public accretionActivity = 0.15;
  public matterStreamIntensity = 0.1;
  public gravitationalWaveStrength = 0.05;
  public spacetimeDistortion = 0.08;
  public environmentCompression = 0.05;
  public asymmetricExpansion = 0.05;
  public collapseIntensity = 0.05;

  public blackHoleCenter = new THREE.Vector3(0, 180, -3500);

  public applyEventParameters(event: CosmicEventDefinition): void {
    const p = event.gravityParams;
    this.gravityInfluenceRadius = p.gravityInfluenceRadius;
    this.gravityAsymmetry = p.gravityAsymmetry;
    this.lensingStrength = p.lensingStrength;
    this.tidalStrength = p.tidalStrength;
    this.infallRate = p.infallRate;
    this.accretionActivity = p.accretionActivity;
    this.matterStreamIntensity = p.matterStreamIntensity;
    this.gravitationalWaveStrength = p.gravitationalWaveStrength;
    this.spacetimeDistortion = p.spacetimeDistortion;
    this.environmentCompression = p.environmentCompression;
    this.asymmetricExpansion = p.asymmetricExpansion;
    this.collapseIntensity = p.collapseIntensity;
  }

  public calculateInfallVector(position: THREE.Vector3, mass = 1.0): THREE.Vector3 {
    const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, position);
    const dist = Math.max(150, toBH.length());
    toBH.normalize();

    // Infall magnitude governed by tidal strength & infallRate
    const force = (3500 / dist) * this.tidalStrength * 45 * mass * (1.0 + this.infallRate * 1.5);
    return toBH.multiplyScalar(force);
  }
}

/* =========================================================================
   4. OrbitalDynamicsSystem
   Simulates decaying Keplerian trajectories and orbital resonance loss.
   ========================================================================= */
export class OrbitalDynamicsSystem {
  public updateOrbitalBody(
    position: THREE.Vector3,
    center: THREE.Vector3,
    radius: number,
    angle: number,
    decayRate: number,
    dt: number
  ): { newPosition: THREE.Vector3; newAngle: number; newRadius: number } {
    const newAngle = angle + dt * (0.05 + 0.15 * (1000 / Math.max(200, radius)));
    const newRadius = Math.max(350, radius - dt * decayRate);
    const newPos = new THREE.Vector3(
      center.x + Math.cos(newAngle) * newRadius,
      center.y + Math.sin(newAngle * 0.5) * (newRadius * 0.15),
      center.z + Math.sin(newAngle) * newRadius
    );
    return { newPosition: newPos, newAngle, newRadius };
  }
}

/* =========================================================================
   5. TidalForceSystem
   Applies directional tensile elongation and shear spaghettification.
   ========================================================================= */
export class TidalForceSystem {
  public calculateTidalScale(
    objectPosition: THREE.Vector3,
    singularityCenter: THREE.Vector3,
    baseScale: THREE.Vector3,
    tidalStrength: number
  ): THREE.Vector3 {
    const dist = objectPosition.distanceTo(singularityCenter);
    const factor = Math.min(2.8, 1.0 + (3000 / Math.max(300, dist)) * tidalStrength * 0.8);
    // Elongates along Z (infall vector) and compresses transversely
    return new THREE.Vector3(
      baseScale.x / Math.sqrt(factor),
      baseScale.y / Math.sqrt(factor),
      baseScale.z * factor
    );
  }
}

/* =========================================================================
   6. DebrisEvolutionSystem
   Manages debris lifecycle states across the continuous universe.
   ========================================================================= */
export class DebrisEvolutionSystem {
  public evolve(
    currentState: RegisteredDestructionEntity['state'],
    distanceToSingularity: number
  ): RegisteredDestructionEntity['state'] {
    if (distanceToSingularity < 350) return 'CONSUMED';
    if (distanceToSingularity < 1200) return 'INFALL';
    if (distanceToSingularity < 2200) return 'DISTANT_DEBRIS';
    if (currentState === 'DESTROYED') return 'DEBRIS';
    return currentState;
  }
}

/* =========================================================================
   7. StructuralFailureSystem
   Calculates realistic physical structural failure states:
   VIBRATION -> FATIGUE -> CRACKING -> DEFORMATION -> SEPARATION -> COLLAPSE -> INFALL.
   ========================================================================= */
export class StructuralFailureSystem {
  public calculateFailureStage(stress: number, elapsedSinceTrigger: number): {
    stage: 'VIBRATION' | 'FATIGUE' | 'CRACKING' | 'DEFORMATION' | 'SEPARATION' | 'COLLAPSE' | 'INFALL';
    vibrationIntensity: number;
    fractureAngleDeg: number;
  } {
    if (elapsedSinceTrigger < 2.0) {
      return { stage: 'VIBRATION', vibrationIntensity: stress * 0.4, fractureAngleDeg: 0 };
    } else if (elapsedSinceTrigger < 4.5) {
      return { stage: 'FATIGUE', vibrationIntensity: stress * 0.8, fractureAngleDeg: 1.5 };
    } else if (elapsedSinceTrigger < 7.0) {
      return { stage: 'CRACKING', vibrationIntensity: stress * 1.2, fractureAngleDeg: 4.0 };
    } else if (elapsedSinceTrigger < 10.0) {
      return { stage: 'DEFORMATION', vibrationIntensity: stress * 1.5, fractureAngleDeg: 12.0 };
    } else if (elapsedSinceTrigger < 14.0) {
      return { stage: 'SEPARATION', vibrationIntensity: stress * 0.6, fractureAngleDeg: 25.0 };
    } else if (elapsedSinceTrigger < 20.0) {
      return { stage: 'COLLAPSE', vibrationIntensity: 0.3, fractureAngleDeg: 60.0 };
    } else {
      return { stage: 'INFALL', vibrationIntensity: 0.1, fractureAngleDeg: 90.0 };
    }
  }
}

/* =========================================================================
   8. PlanetaryDynamicsSystem
   Manages twin colliding bodies, lunar fracturing, Roche limit breach,
   and planetary ring particulate dispersion.
   ========================================================================= */
export class PlanetaryDynamicsSystem {
  public planetAPos = new THREE.Vector3(1600, 750, -3200);
  public planetBPos = new THREE.Vector3(2850, 680, -3400);
  public isCollided = false;
  public collisionProgress = 0;

  public updateCollision(dt: number, activeEvent: number): {
    impactOccurred: boolean;
    debrisScatterRadius: number;
  } {
    if (activeEvent < 4) return { impactOccurred: false, debrisScatterRadius: 0 };

    this.collisionProgress += dt * 0.2;
    if (this.planetAPos.distanceTo(this.planetBPos) > 750) {
      this.planetAPos.x += dt * 60;
      this.planetBPos.x -= dt * 70;
      return { impactOccurred: false, debrisScatterRadius: 0 };
    }

    if (!this.isCollided) {
      this.isCollided = true;
      sound.playPlanetaryCollision();
      sound.playHeavyImpact();
      return { impactOccurred: true, debrisScatterRadius: 100 };
    }

    return { impactOccurred: false, debrisScatterRadius: 100 + this.collisionProgress * 250 };
  }
}

/* =========================================================================
   9. EnvironmentalDestructionManager
   Applies destruction, fracturing, and material state changes in Three.js world.
   ========================================================================= */
export class EnvironmentalDestructionManager {
  public applyFractureDisplacement(mesh: THREE.Object3D, angleDeg: number, fallVector: THREE.Vector3, dt: number): void {
    mesh.rotation.z += (angleDeg * (Math.PI / 180)) * dt * 0.1;
    mesh.position.addScaledVector(fallVector, dt);
  }
}

/* =========================================================================
   10. DestructionFrontManager
   Simulates the forward-moving physical destruction front advancing along route.
   ========================================================================= */
export class DestructionFrontManager {
  public progressM = 0;
  public distanceToPlayerM = 2500;
  public baseSpeedMps = 55;

  public update(dt: number, severity: number, playerTrackProgressM: number): boolean {
    const speed = this.baseSpeedMps + severity * 3.5;
    this.progressM += speed * dt;
    this.distanceToPlayerM = Math.max(0, playerTrackProgressM - this.progressM);
    return this.distanceToPlayerM <= 0;
  }
}

/* =========================================================================
   11. CelestialObjectManager
   Coordinates physical 3D planets, moons, satellites, and rings in world.
   ========================================================================= */
export class CelestialObjectManager {
  public moonTectonicChunks: THREE.Mesh[] = [];
  public planetaryRings: THREE.Mesh[] = [];
}

/* =========================================================================
   12. GravitationalWaveSystem
   Propagates relativistic space-time metric compression/expansion pulses.
   ========================================================================= */
export class GravitationalWaveSystem {
  public wavePhase = 0;
  public waveAmplitude = 0;

  public update(dt: number, strength: number): { displacementY: number; metricStrain: number } {
    this.wavePhase += dt * 3.8;
    this.waveAmplitude = strength;
    const displacementY = Math.sin(this.wavePhase) * (strength * 18.0);
    const metricStrain = Math.cos(this.wavePhase) * (strength * 0.08);
    return { displacementY, metricStrain };
  }
}

/* =========================================================================
   13. AtmosphericSpaceManager
   Simulates atmospheric bulges, magnetospheric aurora ribbons, and particle drag.
   ========================================================================= */
export class AtmosphericSpaceManager {
  public auroralIntensity = 0;
  public gasStreamDensity = 0;

  public update(eventIndex: number): void {
    this.auroralIntensity = eventIndex >= 29 ? Math.min(1.0, (eventIndex - 28) * 0.25) : 0;
    this.gasStreamDensity = eventIndex >= 28 ? Math.min(1.0, (eventIndex - 27) * 0.22) : 0;
  }
}

/* =========================================================================
   14. EnvironmentalLightingManager
   Controls accretion plasma illumination, power blackouts, and darkness wave.
   ========================================================================= */
export class EnvironmentalLightingManager {
  public primaryLightColor = new THREE.Color(0xff7722);
  public ambientIntensity = 0.4;
  public flashbangActive = false;
  public darknessWaveActive = false;

  public update(eventIndex: number, dt: number): void {
    if (eventIndex >= 35) {
      // Cosmic dust veil dimming
      this.ambientIntensity = Math.max(0.08, 0.4 - (eventIndex - 34) * 0.06);
    } else {
      this.ambientIntensity = 0.4;
    }
  }
}

/* =========================================================================
   15. EnvironmentalTransitionManager
   Ensures seamless world streaming and continuity between all 40 event phases.
   ========================================================================= */
export class EnvironmentalTransitionManager {
  public activeTransition = false;
  public transitionProgress = 0;

  public startTransition(): void {
    this.activeTransition = true;
    this.transitionProgress = 0;
  }

  public update(dt: number): void {
    if (this.activeTransition) {
      this.transitionProgress += dt * 0.5;
      if (this.transitionProgress >= 1.0) {
        this.activeTransition = false;
      }
    }
  }
}

/* =========================================================================
   16. Master CatastropheEventManager
   Coordinates all 15 sub-systems, evaluates ship forces, and tracks 40 events.
   ========================================================================= */
export class CatastropheEventManager {
  public readonly scheduler: CosmicEventScheduler;
  public readonly gravitySystem: GravityEventSystem;
  public readonly orbitalSystem: OrbitalDynamicsSystem;
  public readonly tidalSystem: TidalForceSystem;
  public readonly debrisSystem: DebrisEvolutionSystem;
  public readonly structuralSystem: StructuralFailureSystem;
  public readonly planetarySystem: PlanetaryDynamicsSystem;
  public readonly destructionManager: EnvironmentalDestructionManager;
  public readonly destructionFront: DestructionFrontManager;
  public readonly celestialManager: CelestialObjectManager;
  public readonly waveSystem: GravitationalWaveSystem;
  public readonly atmosphericManager: AtmosphericSpaceManager;
  public readonly lightingManager: EnvironmentalLightingManager;
  public readonly transitionManager: EnvironmentalTransitionManager;
  public readonly registry: PersistentDestructionRegistry;

  public currentEventIndex = 0;
  public activeEvent: CosmicEventDefinition | null = null;
  public elapsedSeconds = 0;

  constructor() {
    this.scheduler = new CosmicEventScheduler();
    this.gravitySystem = new GravityEventSystem();
    this.orbitalSystem = new OrbitalDynamicsSystem();
    this.tidalSystem = new TidalForceSystem();
    this.debrisSystem = new DebrisEvolutionSystem();
    this.structuralSystem = new StructuralFailureSystem();
    this.planetarySystem = new PlanetaryDynamicsSystem();
    this.destructionManager = new EnvironmentalDestructionManager();
    this.destructionFront = new DestructionFrontManager();
    this.celestialManager = new CelestialObjectManager();
    this.waveSystem = new GravitationalWaveSystem();
    this.atmosphericManager = new AtmosphericSpaceManager();
    this.lightingManager = new EnvironmentalLightingManager();
    this.transitionManager = new EnvironmentalTransitionManager();
    this.registry = PersistentDestructionRegistry.getInstance();
  }

  public update(dt: number, playerTrackProgressM: number): {
    activeEvent: CosmicEventDefinition | null;
    phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY';
    frontCaughtPlayer: boolean;
  } {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsedSeconds += delta;

    // 1. Advance Scheduler across 40 Events
    const newEvent = this.scheduler.update(this.elapsedSeconds, delta);
    if (newEvent) {
      this.currentEventIndex = newEvent.index;
      this.activeEvent = newEvent;
      this.gravitySystem.applyEventParameters(newEvent);
      this.transitionManager.startTransition();

      // Play authentic sound cues
      if (newEvent.index === 1) {
        sound.playEmergencyAlarm();
        sound.playGravitationalRumble(3.0);
      } else if (newEvent.index === 4) {
        sound.playPlanetaryCollision();
        sound.playHeavyImpact();
      } else if (newEvent.index === 18) {
        sound.playDarkGravitationalShockwave();
      } else if (newEvent.index === 26) {
        sound.playStructureCreak();
      } else if (newEvent.index === 40) {
        sound.playFinalCosmicCollapse();
      } else {
        sound.playGravitationalRumble(3.2);
      }
    }

    // 2. Advance Subsystems
    const severity = this.activeEvent?.severity ?? 1.0;
    const frontCaughtPlayer = this.destructionFront.update(delta, severity, playerTrackProgressM);
    this.planetarySystem.updateCollision(delta, this.currentEventIndex);
    this.atmosphericManager.update(this.currentEventIndex);
    this.lightingManager.update(this.currentEventIndex, delta);
    this.transitionManager.update(delta);

    return {
      activeEvent: this.activeEvent,
      phase: this.scheduler.phase,
      frontCaughtPlayer,
    };
  }

  /**
   * Evaluates realistic physical impact forces applied to player ship
   */
  public getShipImpactForces(timeSec: number): {
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
  } {
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
    const wave = Math.sin(timeSec * 3.8) * 0.55 + Math.sin(timeSec * 7.5) * 0.25;

    // Lateral force and steering resistance
    const lateralForce = wave * (sev * 0.38);
    const steeringResistance = Math.min(0.55, (sev / 10) * 0.55);

    // Velocity fluctuation
    const velocityDisturbance = Math.cos(timeSec * 2.2) * (sev * 0.65);

    // Rotational perturbations
    const pitchDisturbance = Math.sin(timeSec * 4.5) * (sev * 0.025);
    const rollDisturbance = Math.cos(timeSec * 3.8) * (sev * 0.038);
    const yawDisturbance = Math.sin(timeSec * 2.8) * (sev * 0.018);

    // Camera & HUD
    const cameraShake = Math.min(2.5, (sev / 10) * 2.2);
    const fovDistortion = Math.min(8.0, (sev / 10) * 7.5);
    const hudInterference = Math.min(1.0, this.activeEvent.index >= 18 ? (this.activeEvent.index - 17) * 0.045 : 0);
    const shieldStress = (sev / 10) * 12.0;
    const navigationInterference = this.activeEvent.index >= 29 ? 0.7 : this.activeEvent.index >= 12 ? 0.3 : 0;

    return {
      lateralForce,
      steeringResistance,
      velocityDisturbance,
      pitchDisturbance,
      rollDisturbance,
      yawDisturbance,
      cameraShake,
      fovDistortion,
      hudInterference,
      shieldStress,
      navigationInterference,
    };
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.activeEvent = null;
    this.elapsedSeconds = 0;
    this.scheduler.reset();
    this.registry.reset();
  }
}
