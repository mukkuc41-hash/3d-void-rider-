/**
 * VOID-RIDER 3D — JUGGERNAUT SPACE COMBAT TYPES & CONSTANTS
 * Centralized specifications for Apex Predator and Swarm Hunt modes.
 */
import * as THREE from 'three';

export type JuggernautCombatMode = 'APEX_PREDATOR' | 'SWARM_HUNT';
export type JuggernautRole = 'JUGGERNAUT' | 'HUNTER' | 'BOSS' | 'SURVIVOR';
export type JuggernautFaction = 'TITAN' | 'SWARM' | 'BOSS' | 'SURVIVORS';

export interface CombatAbility {
  id: string;
  name: string;
  description: string;
  cooldownSeconds: number;
  currentCooldown: number;
  durationSeconds?: number;
  activeTimeRemaining?: number;
  keyLabel: string;
}

export interface CombatShipState {
  id: string;
  name: string;
  role: JuggernautRole;
  faction: JuggernautFaction;
  isPlayer: boolean;
  shipDefId: string;
  
  // Transform
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  forward: THREE.Vector3;
  targetPosition?: THREE.Vector3;
  targetShipId?: string;

  // Stats
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number; // HP/sec
  
  // State flags
  isAlive: boolean;
  isDisabled: boolean; // For Survivor revive mechanics
  reviveProgress: number; // 0 to 3.0s
  revivingShipId?: string;
  
  // Flight dynamics
  maxSpeed: number;
  turnSpeed: number;
  acceleration: number;
  boostMultiplier: number;
  isBoosting: boolean;
  boostCharge: number; // 0 - 100
  
  // Combat stats
  primaryDamage: number;
  primaryFireRate: number; // shots / sec
  fireCooldown: number;
  attackRange: number;

  // Abilities
  abilities: Record<string, CombatAbility>;

  // Visuals
  mesh?: THREE.Group;
  trailMesh?: THREE.Line;
  shieldMesh?: THREE.Mesh;
  reviveBeamMesh?: THREE.Line;
  hitFlashTimer: number;

  // Match telemetry
  kills: number;
  damageDealt: number;
  damageTaken: number;
  revivesDone: number;
}

export interface CombatProjectile {
  id: string;
  ownerId: string;
  ownerRole: JuggernautRole;
  faction: JuggernautFaction;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  lifetime: number;
  color: THREE.Color;
  mesh?: THREE.Mesh;
  isHeavy?: boolean;
}

export interface DefensiveTrap {
  id: string;
  ownerId: string;
  position: THREE.Vector3;
  radius: number;
  damage: number;
  slowFactor: number;
  duration: number;
  lifetime: number;
  detonated: boolean;
  mesh?: THREE.Group;
}

export interface ShockwaveEffect {
  id: string;
  position: THREE.Vector3;
  currentRadius: number;
  maxRadius: number;
  expansionSpeed: number;
  damage: number;
  force: number;
  faction: JuggernautFaction;
  mesh?: THREE.Mesh;
}

export interface CombatNotification {
  id: string;
  text: string;
  type: 'KILL' | 'REVIVE' | 'ABILITY' | 'WARNING' | 'ALERT';
  timestamp: number;
  colorClass: string;
}

export interface JuggernautMatchConfig {
  mode: JuggernautCombatMode;
  playerRole: JuggernautRole;
  playerShipId: string;
  difficulty: 'STANDARD' | 'VETERAN' | 'ELITE';
  matchDurationSeconds: number; // 180s
  shrinkingBoundary?: boolean;
}

export interface JuggernautMatchStats {
  mode: JuggernautCombatMode;
  playerRole: JuggernautRole;
  winningFaction: JuggernautFaction;
  victory: boolean;
  reason: string;
  matchTimeSeconds: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  shipsEliminated: number;
  shipsRemaining: number;
  revivesCompleted: number;
  accuracyPercent: number;
  creditsEarned: number;
  xpEarned: number;
}

export interface JuggernautCombatTelemetry {
  isActive: boolean;
  isPaused: boolean;
  mode: JuggernautCombatMode;
  playerRole: JuggernautRole;
  playerFaction: JuggernautFaction;
  timeRemainingSeconds: number;
  totalMatchSeconds: number;
  
  // Player state
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  playerMaxShield: number;
  playerSpeedKmh: number;
  playerIsAlive: boolean;
  playerIsDisabled: boolean;
  playerReviveProgress: number;
  playerBoostCharge: number;
  playerAbilities: Record<string, CombatAbility>;
  
  // Boss / Titan Master bar
  bossOrTitanShip?: {
    id: string;
    name: string;
    role: JuggernautRole;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    isEnraged?: boolean;
    isChargingAreaAttack?: boolean;
    areaAttackChargePercent?: number;
  };

  // Fleet state
  allShips: Array<{
    id: string;
    name: string;
    role: JuggernautRole;
    faction: JuggernautFaction;
    isPlayer: boolean;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    isAlive: boolean;
    isDisabled: boolean;
    distanceToPlayer: number;
  }>;

  // Targeting
  lockedTarget?: {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    distance: number;
  };

  // Arena & Boundary & Platform Deck
  arenaRadius: number;
  platformRadius: number;
  deckElevation: number;
  playerAltitude: number;
  distanceFromCenter: number;
  distanceToPlatformEdge: number;
  isNearBoundary: boolean;
  isNearPlatformEdge: boolean;
  isFallingOffPlatform: boolean;
  isOutOfBounds: boolean;

  // Feed & Events
  notifications: CombatNotification[];
  playerDamageFlash: boolean;
  
  // Match Finished
  isMatchOver: boolean;
  finalStats: JuggernautMatchStats | null;
}
