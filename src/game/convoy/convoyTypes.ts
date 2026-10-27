/**
 * VOID-RIDER 3D — CONVOY GUARDIAN TYPES & INTERFACES
 * 
 * Central specifications for the Convoy Guardian mode:
 * - Saviour (9 Playable Escort Ships) & Hunters (10 Playable Fighters + 1 Boss)
 * - 6 AI-Only Defensive Drone Classes
 * - 6-Directional Control & Engine On/Off Toggle
 * - Shared Live Tactical Detection / Radar System
 * - 9 Route Hazards with real collision
 * - Navigable 3D Parking Dome & 15-State Emergency Escape Sequence 1
 * - Authoritative Real-Time HUD Telemetry & Victory Results
 */
import * as THREE from 'three';

export type ConvoyEventId =
  | 'TITAN_SHIPYARD'
  | 'BROKEN_MEGABRIDGE'
  | 'MAGNETIC_CORRIDOR'
  | 'HABITAT_CITY'
  | 'QUARANTINE_FORTRESS'
  | 'GRAVEYARD_OF_GIANTS'
  | 'INDUSTRIAL_SOLAR_CORE'
  | 'FINAL_APPROACH'
  | 'PARKING_DOME_FINALE'
  | 'RENDEZVOUS'
  | 'DEBRIS_CORRIDOR'
  | 'DRONE_INTERCEPT'
  | 'AMBUSH_CROSSFIRE'
  | 'HULL_BREACH'
  | 'FINAL_DEFENSE';

export type ConvoyVariant = 'SAVIOUR' | 'HUNTERS' | 'HUNTER';

export type ConvoyFormationPreset =
  | 'V_FORMATION'
  | 'LINE_FORMATION'
  | 'DIAMOND_FORMATION'
  | 'DEFENSIVE_FORMATION'
  | 'DISPERSED_FORMATION';

export type ConvoyFleetCommand =
  | 'FOLLOW'
  | 'REGROUP'
  | 'DEFEND'
  | 'SPREAD_OUT'
  | 'HOLD_POSITION'
  | 'FREE_ROAM'
  | 'RETURN_TO_ORIGIN';

export type ConvoyMissionState =
  | 'BRIEFING'
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'EXTRACTION_DOCKING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'DISPOSED';

export type EscapeSequenceStep =
  // Origin Dome sequence
  | 'ORIGIN_DOCKED'
  | 'ORIGIN_PREFLIGHT'
  | 'ORIGIN_GATE_CLEARANCE'
  | 'ORIGIN_DEPARTURE'
  | 'OUTBOUND_CRUISE'
  // Destination Celestial Crown sequence
  | 'CROWN_APPROACH'
  | 'CROWN_GATE_CLEARANCE'
  | 'CROWN_ALIGNMENT'
  | 'CROWN_CLAMPS_ENGAGED'
  | 'CROWN_SECURED'
  | 'CROWN_UNDOCK'
  // Return flight
  | 'RETURN_CLEARANCE'
  | 'RETURN_TRANSIT'
  | 'ORIGIN_RETURN_APPROACH'
  | 'ORIGIN_RETURN_DOCK'
  | 'OPEN_WORLD_FREE_ROAM'
  // Legacy sequence steps
  | 'APPROACH_DOME'
  | 'REQUEST_CLEARANCE'
  | 'ENTER_DOME'
  | 'PROCEED_TO_BAY'
  | 'ALIGN_IN_BAY'
  | 'ENGAGE_LOCKS'
  | 'CONVOY_SECURED'
  | 'CAMPAIGN_COMPLETE'
  | 'ALIGN_WITH_PASSAGE'
  | 'ASSIGN_BAYS'
  | 'VALIDATE_ALIGNMENT'
  | 'ENGAGE_CLAMPS'
  | 'LOCKDOWN'
  | 'RELEASE_CLAMPS'
  | 'AUTHORIZE_GATE'
  | 'OPEN_PASSAGE_GATE'
  | 'WAIT_FOR_SAFE_CLEARANCE'
  | 'DEPARTURE_ORDER'
  | 'EXIT_THROUGH_PASSAGE'
  | 'CLOSE_GATE_AFTER_CLEARANCE'
  | 'COMPLETE'
  | 'EMERGENCY_DECLARED'
  | 'EMERGENCY_LOCKS_RELEASED'
  | 'EMERGENCY_CORRIDOR_TRANSIT'
  | 'EMERGENCY_CHAMBER_PASSED'
  | 'EMERGENCY_EXIT_CLEAR';

export interface DirectionalThrustState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
}

export interface ActiveAbilityState {
  id: string;
  name: string;
  description: string;
  cooldownSeconds: number;
  currentCooldown: number;
  durationSeconds?: number;
  activeTimeRemaining: number;
  isActive: boolean;
  isUltimate: boolean;
  keyLabel: string;
}

export interface RadarContact {
  id: string;
  name: string;
  faction: 'SAVIOUR' | 'HUNTERS' | 'NEUTRAL';
  category: 'FRIENDLY' | 'HOSTILE' | 'CARGO' | 'BOSS' | 'DRONE' | 'HAZARD' | 'CHECKPOINT' | 'OBJECTIVE' | 'DOME';
  worldPos: { x: number; y: number; z: number };
  distance: number;
  angleRad: number; // Relative angle to player heading (-PI to PI)
  isLive: boolean;
  lastSeenAgeSec: number;
  symbol: 'TRIANGLE' | 'DIAMOND' | 'SQUARE' | 'STAR' | 'CIRCLE' | 'HEXAGON';
  color: string;
  healthPct?: number;
}

export interface ConvoyShipState {
  id: string;
  name: string;
  shipDefId?: string;
  isLead: boolean;
  isPlayerControlled?: boolean;
  role?: 'LEAD_GUARD' | 'FORWARD_MID_GUARD' | 'CARGO' | 'REAR_MID_GUARD' | 'REAR_GUARD' | 'FRONT_FIGHTER' | 'FORWARD_MID_HUNTER' | 'REAR_MID_HUNTER' | 'REAR_FIGHTER' | 'COMMAND_BOSS';
  faction: 'SAVIOUR' | 'HUNTERS';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  isAlive: boolean;
  isDestroyed: boolean;
  status: 'NOMINAL' | 'DAMAGED' | 'CRITICAL' | 'DESTROYED' | 'DOCKED';
  
  // Transform & Route tracking
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  targetOffset: THREE.Vector3; // Offset in formation relative to route spline
  routeProgress: number; // 0.0 to 1.0 along the corridor
  speed: number;
  
  // Visuals
  mesh?: THREE.Group;
  damageSmokeMesh?: THREE.Points | THREE.Mesh;
  hitFlashTimer: number;

  // Escape sequence assignment
  assignedBayIndex?: number;
  isAlignedWithBay?: boolean;
  isClampedInBay?: boolean;
}

export interface EnemyDrone {
  id: string;
  droneClassId?: 'SCOUT' | 'JAMMER' | 'STRIKER' | 'WARDEN' | 'MENDER' | 'BREAKER' | 'AEGIS_DRONE' | 'HUNTER_DRONE' | 'SCANNER_DRONE' | 'GUARDIAN_DRONE' | 'DISRUPTOR_DRONE' | 'RESERVE_DRONE' | string;
  type: 'SCOUT' | 'FIGHTER' | 'GUNSHIP' | 'BOSS' | 'DEFENSE_DRONE' | 'MAIN_HUNTER' | 'MID_HUNTER';
  role?: 'BOSS' | 'DEFENSE_DRONE' | 'MAIN_HUNTER' | 'MID_HUNTER';
  disabledTimer?: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  parentEntityId?: string;
  aiState?: 'ORBIT' | 'ENGAGE' | 'INTERCEPT' | 'SCAN' | 'BODYBLOCK' | 'DISRUPT' | 'RESERVE' | 'RETURN';
  
  faction: ConvoyVariant; // 'SAVIOUR' | 'HUNTERS'
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  targetId: string; // Target ship ID
  attackCooldown: number;
  fireRate: number;
  speed: number;
  damage: number;
  
  mesh?: THREE.Group;
  hitFlashTimer: number;
}

export interface ConvoyProjectile {
  id: string;
  owner: 'PLAYER' | 'ENEMY' | 'TURRET' | 'ALLY';
  ownerId?: string;
  faction: ConvoyVariant; // 'SAVIOUR' | 'HUNTERS'
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  lifetime: number;
  color: THREE.Color;
  mesh?: THREE.Mesh;
}

/**
 * Authoritative faction comparison: returns true only if the two entities are hostile to each other.
 * Same-team entities or allies return false (friendly fire blocked).
 */
export function areHostileFactions(
  factionA?: ConvoyVariant | string | null,
  factionB?: ConvoyVariant | string | null
): boolean {
  if (!factionA || !factionB) return false;
  const strA = String(factionA).toUpperCase();
  const strB = String(factionB).toUpperCase();
  const normA = strA.startsWith('HUNTER') ? 'HUNTERS' : strA.startsWith('SAVIOUR') ? 'SAVIOUR' : strA;
  const normB = strB.startsWith('HUNTER') ? 'HUNTERS' : strB.startsWith('SAVIOUR') ? 'SAVIOUR' : strB;
  return normA !== normB;
}

// =========================================================================
// ADAPTIVE ROUTE & STRUCTURE-AWARE NAVIGATION
// =========================================================================
export type StructureShape =
  | 'OCTAGONAL'
  | 'CIRCULAR'
  | 'DOME'
  | 'TUNNEL'
  | 'BRIDGE'
  | 'INDUSTRIAL'
  | 'ORBITAL_CITY'
  | 'MEGASTRUCTURE';

export interface RouteDefiningStructure {
  id: string;
  name: string;
  shape: StructureShape;
  position: THREE.Vector3;
  dimensions: THREE.Vector3;
  rotation: THREE.Euler;
  entrances: THREE.Vector3[];
  exits: THREE.Vector3[];
  navigableCorridors: Array<{ start: THREE.Vector3; end: THREE.Vector3; radius: number }>;
  collisionBounds: Array<{ min: THREE.Vector3; max: THREE.Vector3; solid: boolean }>;
  isAccessible: boolean;
  blockedGates: string[];
}

export interface AdaptiveRouteSegment {
  regionIndex: number;
  curve: THREE.CatmullRomCurve3;
  lengthMeters: number;
  isModified: boolean;
  associatedStructureId?: string;
  clearanceWidth: number;
  isPassable: boolean;
}

// =========================================================================
// SENSOR-CONTROLLED CHAMBER GATES & AIRLOCK INTERLOCKS
// =========================================================================
export type ChamberGateState =
  | 'CLOSED'
  | 'DETECTING'
  | 'AUTHORIZING'
  | 'OPENING'
  | 'OPEN'
  | 'SHIP_CROSSING'
  | 'CLEARANCE_CHECK'
  | 'CLOSING'
  | 'BLOCKED'
  | 'FAULT'
  | 'EMERGENCY_OVERRIDE';

export type ChamberGateId =
  | 'GATE_1_OUTER_ENTRANCE'
  | 'GATE_2_AIRLOCK_INNER'
  | 'GATE_3_ATRIUM_TO_BASEMENT'
  | 'GATE_4_RESTRICTED_MAINTENANCE'
  | 'GATE_5_EMERGENCY_ESCAPE'
  | 'ORIGIN_INNER_GATE'
  | 'ORIGIN_OUTER_GATE'
  | 'CROWN_OUTER_GATE'
  | 'CROWN_AIRLOCK_GATE';

export interface ChamberGateTelemetry {
  id: ChamberGateId;
  name: string;
  state: ChamberGateState;
  openProgress: number; // 0.0 (closed) to 1.0 (open)
  isAuthorized: boolean;
  isShipInThreshold: boolean;
  isInterlocked: boolean;
  interlockLockedBy?: string;
  isEmergencyOverride: boolean;
  zoneOccupancy: number;
  statusColor: string; // hex for HUD
  warningText?: string;
}

export type TerminalZone =
  | 'APPROACH'
  | 'ZONE_A_UPPER_ARRIVAL'
  | 'ZONE_B_CENTRAL_ATRIUM'
  | 'ZONE_C_BASEMENT_HANGAR'
  | 'ESCAPE_CORRIDOR';

export interface TerminalTelemetry {
  currentZone: TerminalZone;
  activeGates: ChamberGateTelemetry[];
  assignedBay: {
    bayNumber: number;
    zoneName: string;
    targetPos: { x: number; y: number; z: number };
    distanceMeters: number;
    alignmentDeviationMeters: number;
    speedMps: number;
    isAligned: boolean;
    isReadyToClamp: boolean;
    isClamped: boolean;
  };
  airlockStatus: {
    outerGateState: ChamberGateState;
    innerGateState: ChamberGateState;
    chamberPressurized: boolean;
    safeToProceed: boolean;
  };
  emergencyEscapeActive: boolean;
  emergencyEscapeAvailable: boolean;
}

export interface HazardDebris {
  id: string;
  position: THREE.Vector3;
  radius: number;
  health: number;
  maxHealth: number;
  rotationSpeed: THREE.Vector3;
  mesh?: THREE.Mesh;
}

export interface RepairPickup {
  id: string;
  position: THREE.Vector3;
  healAmount: number;
  collected: boolean;
  mesh?: THREE.Group;
}

export interface ConvoyMissionEvent {
  id: ConvoyEventId;
  eventNumber: number;
  name: string;
  subtitle: string;
  objectiveDescription: string;
  minRouteProgress: number; // Route progress trigger (0.0 to 1.0)
  targetKills?: number;
  currentKills?: number;
  targetProgress?: number;
  isCompleted: boolean;
}

export const CONVOY_CAMPAIGN_TOTAL_KM = 200000;
export const CONVOY_TOTAL_LOCATIONS = 100;
export const CONVOY_KM_PER_LOCATION = 2000;

export interface ConvoyTelemetry {
  variant: ConvoyVariant;
  bossHealth: number;
  bossMaxHealth: number;
  defensiveDronesAlive: number;
  hunterEnemiesAlive: number;
  isActive: boolean;
  isPaused: boolean;
  missionState: ConvoyMissionState;
  
  // Progress & Open-World 200,000 km Campaign (100 Locations)
  currentEventIndex: number;
  totalEvents: number;
  currentEvent: ConvoyMissionEvent;
  routeProgressPercent: number;
  distanceToDestinationMeters: number;
  timeElapsedSeconds: number;
  sectorName?: string;
  sectorNumber?: number;
  totalSectors?: number;
  currentRouteKm?: number;
  totalRouteKm?: number;
  maxRouteKmReached?: number;
  maxCampaignKm?: number;
  cumulativeTravelKm?: number;
  roundTripKm?: number;
  travelDirection?: 'OUTBOUND' | 'RETURN';
  locationIndex?: number;
  locationName?: string;
  returnClearance?: boolean;
  oneWayCampaignComplete?: boolean;
  isAtOriginDome?: boolean;
  isAtCelestialCrown?: boolean;
  
  // Boundary Containment Flight Envelope
  boundaryWarning?: {
    active: boolean;
    distanceToEdge: number;
    lateralOffset: number;
    warningText?: string;
  };

  // 100-Region / Open-World Telemetry
  regionName: string;
  regionNumber: number;
  totalRegions: number;
  regionLocalKm: number;
  activeFormation: ConvoyFormationPreset;
  activeFleetCommand: ConvoyFleetCommand;

  // Boss Battle Telemetry
  bossTelemetry?: {
    hasActiveBoss: boolean;
    name: string;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    phase: number;
    totalPhases: number;
    phaseName: string;
    isVulnerable: boolean;
  } | null;

  // Dedicated Parking Dome Finale Telemetry
  dockingStatus?: {
    isInsideDome: boolean;
    assignedBay: number;
    distanceToBay: number;
    speedMps: number;
    isAligned: boolean;
    isReadyToLock: boolean;
    isLocked: boolean;
    canEngageLocks: boolean;
    assistedParkingActive: boolean;
    locksEngagedCount: number;
    totalConvoyBays: number;
  };
  
  // Convoy Fleet
  convoyIntegrityPercent: number;
  leadTransportHealthPercent: number;
  transportsAliveCount: number;
  transportsTotalCount: number;
  transports: Array<{
    id: string;
    name: string;
    isLead: boolean;
    role?: string;
    health: number;
    maxHealth: number;
    healthPercent: number;
    status: 'NOMINAL' | 'DAMAGED' | 'CRITICAL' | 'DESTROYED' | 'DOCKED';
    distanceToPlayer: number;
    isPlayerControlled?: boolean;
  }>;
  
  // Combat & Hostiles
  activeHostileCount: number;
  lockedTarget?: {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    distance: number;
  };
  
  // Player state
  playerShipId: string;
  playerShipName: string;
  playerRoleTitle: string;
  playerFaction: 'SAVIOUR' | 'HUNTERS';
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  playerMaxShield: number;
  playerBoost: number;
  playerSpeedKmh: number;
  isFiring: boolean;
  isEngineOn: boolean;
  directionalThrust: DirectionalThrustState;
  
  // 5 Real Player Abilities
  playerAbilities: ActiveAbilityState[];

  // Tactical Radar & Detection
  radarContacts: RadarContact[];
  radarZoom: number;
  isRadarExpanded: boolean;
  isJammingActive: boolean;

  // Final Destination Parking Dome & Escape Sequence
  escapeState: {
    step: EscapeSequenceStep;
    stepIndex: number;
    totalSteps: number;
    message: string;
    isComplete: boolean;
    passageGateOpen: boolean;
    dockingBaysOccupied: number;
    totalBays: number;
    playerBayIndex?: number;
    distanceToBay?: number;
    playerSpeed?: number;
    isAligned?: boolean;
    canEngageLock?: boolean;
    locksEngaged?: boolean;
    assistedParking?: boolean;
  };
  
  // Notifications
  notifications: Array<{
    id: string;
    text: string;
    type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS';
    timestamp: number;
  }>;
  
  // Final Results
  finalStats: ConvoyMissionResult | null;
  terminalTelemetry?: TerminalTelemetry;

  // Divisions & Backup Call Telemetry (Lead Ship & Main Hunter Only)
  backupTelemetry?: {
    eligible: boolean;
    leaderTitle: string;
    reason: string;
    selectedDivision: 'D5' | 'D4' | 'D3' | 'D2' | 'D1';
    cooldowns: Record<'D5' | 'D4' | 'D3' | 'D2' | 'D1', number>;
    active: null | { division: 'D5' | 'D4' | 'D3' | 'D2' | 'D1'; name: string; statusText: string; timeRemaining: number; totalDuration: number; targetName?: string };
  };
}

export interface ConvoyMissionResult {
  victory: boolean;
  reason: string;
  transportsSaved: number;
  transportsTotal: number;
  convoyFinalIntegrity: number;
  dronesDestroyed: number;
  debrisCleared: number;
  repairsCollected: number;
  timeElapsedSeconds: number;
  creditsEarned: number;
  xpEarned: number;
}

export interface SaviourMissionState {
  totalDistanceKm: number; // 0 to 50,000 km
  currentRegionIndex: number; // 0 to 24 (25 regions)
  regionDistanceKm: number; // 0 to 2,000 km
  activeFormation: ConvoyFormationPreset;
  activeCommand: ConvoyFleetCommand;
  cargoShipsAlive: number; // exactly 3 cargo ships (Medic, Paladin, Quantum)
  cargoShipsTotal: number; // 3
  transportsAlive: number; // total alive out of 9
  transportsTotal: number; // 9
  checkpointsPassed: number;
  isDockingSequenceActive: boolean;
  dockingClampEngaged: boolean;
  missionCompleted: boolean;
  missionFailed: boolean;
  failureReason?: string;
  timeElapsedSeconds: number;
}

export interface HuntersMissionState {
  bossHp: number; // starts at exactly 1,000
  bossMaxHp: number; // 1,000
  bossShield: number;
  bossMaxShield: number;
  bossPhase: number; // 1 to 5
  bossPhaseName: string;
  isBossVulnerable: boolean;
  hunterShipsAlive: number; // starts at 10
  hunterShipsTotal: number; // 10
  dronesAlive: {
    scout: boolean;
    striker: boolean;
    warden: boolean;
    mender: boolean;
    jammer: boolean;
    breaker: boolean;
  };
  jammerDisruptingRadar: boolean;
  wardenShieldActive: boolean;
  menderHealingActive: boolean;
  killCount: number;
  missionCompleted: boolean;
  missionFailed: boolean;
  failureReason?: string;
  timeElapsedSeconds: number;
}

