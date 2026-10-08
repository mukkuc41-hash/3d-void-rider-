/**
 * FINAL COLLAPSE: UNIFIED CORE DATA ARCHITECTURE FOR ALL 100 EVENTS
 *
 * Every event conforms strictly to the exact hierarchical structure:
 * EVENT
 * ├── ID
 * ├── Event Number
 * ├── Trigger Time
 * ├── Title
 * ├── Short Description
 * │
 * ├── BLACK HOLE EFFECT
 * │   ├── Singularity reaction
 * │   ├── Photon ring reaction
 * │   ├── Accretion disk reaction
 * │   ├── Gravity/lensing reaction
 * │   └── Plasma/debris reaction
 * │
 * ├── ENVIRONMENT EFFECT
 * │   ├── Space distortion
 * │   ├── Asteroid/debris reaction
 * │   ├── Planet/moon reaction
 * │   └── Lighting reaction
 * │
 * ├── CIVILIZATION EFFECT
 * │   ├── Towers
 * │   ├── Platforms
 * │   ├── Orbital infrastructure
 * │   ├── Energy systems
 * │   └── Transport systems
 * │   └── Megastructures
 * │
 * ├── PHYSICAL CONSEQUENCE
 * │   ├── Damage
 * │   ├── Movement
 * │   ├── Separation
 * │   ├── Collapse
 * │   └── Persistent state
 * │
 * ├── PLAYER EFFECT
 * │   ├── Camera reaction
 * │   ├── Ship reaction
 * │   ├── Gravity reaction
 * │   └── Gameplay visibility
 * │
 * ├── AUDIO
 * │   ├── Warning
 * │   ├── Environmental sound
 * │   └── Event impact
 * │
 * ├── VISUAL EFFECT
 * │   ├── Primary effect
 * │   ├── Secondary effect
 * │   └── Cinematic effect
 * │
 * ├── ALERT
 * │   ├── EVENT NUMBER
 * │   ├── TITLE
 * │   └── WARNING MESSAGE
 * │
 * ├── PERSISTENCE
 * │   ├── What changes permanently
 * │   └── Which existing object is affected
 * │
 * ├── DURATION
 * ├── PRIORITY
 * └── CLEANUP / RECOVERY
 */

export interface BlackHoleEffect {
  singularityReaction: string;
  photonRingReaction: string;
  accretionDiskReaction: string;
  gravityLensingReaction: string;
  plasmaDebrisReaction: string;
  intensity?: number; // 0.0 to 1.0
}

export interface EnvironmentEffect {
  spaceDistortion: string;
  asteroidDebrisReaction: string;
  planetMoonReaction: string;
  lightingReaction: string;
}

export interface CivilizationEffect {
  towers: string;
  platforms: string;
  orbitalInfrastructure: string;
  energySystems: string;
  transportSystems: string;
  megastructures: string;
}

export interface PhysicalConsequence {
  damage: string;
  movement: string;
  separation: string;
  collapse: string;
  persistentState: string;
}

export type EventCameraReaction =
  | 'NORMAL_GAMEPLAY'
  | 'SUBTLE_SHAKE'
  | 'LENSING'
  | 'SLOW_LOOK_AROUND'
  | 'CINEMATIC_FOCUS'
  | 'WIDE_CIVILIZATION'
  | 'BLACK_HOLE_FOCUS'
  | 'CHASE_OBJECT';

export interface PlayerEffect {
  cameraReaction: EventCameraReaction;
  shipReaction: string;
  gravityReaction: number; // 0.0 to 1.0 (additional gravitational pull intensity)
  gameplayVisibility: number; // 0.0 to 1.0 (1.0 = crystal clear, lower = heavy distortion/glare)
}

export interface AudioEffect {
  warning: string;
  environmentalSound: string;
  eventImpact: string;
}

export interface VisualEffect {
  primaryEffect: string;
  secondaryEffect: string;
  cinematicEffect: string;
}

export interface AlertEffect {
  eventNumber: number;
  title: string;
  warningMessage: string;
  nextEventTime?: string;
}

export interface PersistenceEffect {
  whatChangesPermanently: string;
  whichExistingObjectAffected: string;
}

export interface FinalCollapseCoreEvent {
  id: string;
  eventNumber: number;
  triggerTime: number; // in seconds from 30:00 (0 to 1800)
  countdownDisplay: string; // e.g. "30:00", "29:42", ... "00:00"
  title: string;
  shortDescription: string;

  blackHoleEffect: BlackHoleEffect;
  environmentEffect: EnvironmentEffect;
  civilizationEffect: CivilizationEffect;
  physicalConsequence: PhysicalConsequence;
  playerEffect: PlayerEffect;
  audio: AudioEffect;
  visualEffect: VisualEffect;
  alert: AlertEffect;
  persistence: PersistenceEffect;

  duration: number; // duration in seconds of the active reaction wave
  priority: number; // 1 to 10
  cleanupRecovery: string;
}

/**
 * 6 progressive stages of the persistent civilization throughout the 100 events:
 * NORMAL -> DAMAGED -> UNSTABLE -> FRAGMENTED -> CRITICAL -> NEAR_TOTAL_COLLAPSE
 */
export type CivilizationDamageStage =
  | 'NORMAL'
  | 'DAMAGED'
  | 'UNSTABLE'
  | 'FRAGMENTED'
  | 'CRITICAL'
  | 'NEAR_TOTAL_COLLAPSE';

/**
 * Centralized Persistent World State
 * Accumulates damage, fractures, power losses, and debris across all 100 events.
 */
export interface FinalCollapseWorldState {
  damagedStructures: string[];
  destroyedStructures: string[];
  separatedStructures: string[];
  displacedStructures: string[];
  unstableStructures: string[];
  powerFailures: string[];
  brokenConnections: string[];
  activeDebrisFields: string[];
  orbitalChanges: string[];
  civilizationDamageLevel: number; // 0.0 to 1.0
  civilizationStage: CivilizationDamageStage;
  blackHoleInstability: number; // 0.0 to 1.0
  finalCollapseComplete: boolean;
}

/**
 * Helper to generate default initial world state at 30:00 (Event 1)
 */
export function createInitialWorldState(): FinalCollapseWorldState {
  return {
    damagedStructures: [],
    destroyedStructures: [],
    separatedStructures: [],
    displacedStructures: [],
    unstableStructures: [],
    powerFailures: [],
    brokenConnections: [],
    activeDebrisFields: [],
    orbitalChanges: [],
    civilizationDamageLevel: 0.0,
    civilizationStage: 'NORMAL',
    blackHoleInstability: 0.05,
    finalCollapseComplete: false,
  };
}
