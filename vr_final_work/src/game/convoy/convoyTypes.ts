/**
 * VOID-RIDER 3D — CONVOY GUARDIAN TYPES & INTERFACES
 * 
 * Central specifications for the Convoy Guardian escort mode:
 * - 7 Sequential Mission Events
 * - Convoy Transports & Formation State
 * - Hostile Enemy Drones & Threat Waves
 * - Asteroid & Physical Debris Hazards
 * - Repair Pickups & Nanite Restoration
 * - Authoritative Real-Time HUD Telemetry & Victory Results
 */
import * as THREE from 'three';

export type ConvoyEventId =
  | 'RENDEZVOUS'
  | 'DEBRIS_CORRIDOR'
  | 'DRONE_INTERCEPT'
  | 'AMBUSH_CROSSFIRE'
  | 'HULL_BREACH'
  | 'FINAL_APPROACH'
  | 'FINAL_DEFENSE';

export type ConvoyVariant = 'SAVIOUR' | 'HUNTERS';

export type ConvoyMissionState =
  | 'BRIEFING'
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'EXTRACTION_DOCKING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'DISPOSED';

export interface ConvoyShipState {
  id: string;
  name: string;
  isLead: boolean;
  role?: 'LEAD_GUARD' | 'FORWARD_MID_GUARD' | 'CARGO' | 'REAR_MID_GUARD' | 'REAR_GUARD';
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
  routeProgress: number; // 0.0 to 1.0 along the ~6,000m corridor
  speed: number;
  
  // Visuals
  mesh?: THREE.Group;
  damageSmokeMesh?: THREE.Points | THREE.Mesh;
  hitFlashTimer: number;
}

export interface EnemyDrone {
  id: string;
  type: 'SCOUT' | 'FIGHTER' | 'GUNSHIP' | 'BOSS' | 'DEFENSE_DRONE' | 'MAIN_HUNTER' | 'MID_HUNTER';
  role?: 'BOSS' | 'DEFENSE_DRONE' | 'MAIN_HUNTER' | 'MID_HUNTER';
  disabledTimer?: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  targetId: string; // Target ship ID (convoy transport or player)
  attackCooldown: number;
  fireRate: number;
  speed: number;
  damage: number;
  
  mesh?: THREE.Group;
  hitFlashTimer: number;
}

export interface ConvoyProjectile {
  id: string;
  owner: 'PLAYER' | 'ENEMY' | 'TURRET';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  lifetime: number;
  color: THREE.Color;
  mesh?: THREE.Mesh;
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

export interface ConvoyTelemetry {
  variant: ConvoyVariant;
  bossHealth: number;
  bossMaxHealth: number;
  defensiveDronesAlive: number;
  hunterEnemiesAlive: number;
  isActive: boolean;
  isPaused: boolean;
  missionState: ConvoyMissionState;
  
  // Progress
  currentEventIndex: number;
  totalEvents: number;
  currentEvent: ConvoyMissionEvent;
  routeProgressPercent: number;
  distanceToDestinationMeters: number;
  timeElapsedSeconds: number;
  
  // Convoy Fleet
  convoyIntegrityPercent: number;
  leadTransportHealthPercent: number;
  transportsAliveCount: number;
  transportsTotalCount: number;
  transports: Array<{
    id: string;
    name: string;
    isLead: boolean;
    role?: 'LEAD_GUARD' | 'FORWARD_MID_GUARD' | 'CARGO' | 'REAR_MID_GUARD' | 'REAR_GUARD';
    health: number;
    maxHealth: number;
    healthPercent: number;
    status: 'NOMINAL' | 'DAMAGED' | 'CRITICAL' | 'DESTROYED' | 'DOCKED';
    distanceToPlayer: number;
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
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  playerMaxShield: number;
  playerBoost: number;
  playerSpeedKmh: number;
  isFiring: boolean;
  
  // Notifications
  notifications: Array<{
    id: string;
    text: string;
    type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS';
    timestamp: number;
  }>;
  
  // Final Results
  finalStats: ConvoyMissionResult | null;
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
