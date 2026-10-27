/**
 * VOID-RIDER 3D — CONVOY GUARDIAN MISSION DIRECTOR
 * 
 * Master implementation of the Convoy Guardian feature:
 * - Saviour (9 Playable Escort Ships) & Hunters (10 Playable Fighters + 1 Boss)
 * - Exact 5 Abilities per Ship with Authoritative Cooldowns & Real Gameplay Effects
 * - 6 AI-Only Defensive Drone Classes with Finite State Machines
 * - 6-Directional Movement (UP, DOWN, LEFT, RIGHT, FORWARD, BACKWARD)
 * - Engine ON/OFF Toggle & Station-Keeping / Velocity Damping
 * - Shared Authoritative Detection Service & Live Tactical Radar (Live vs Last-Known)
 * - 9 Route Hazards with Physical Collision & Cooldowns
 * - Navigable 3D Parking Dome & 15-State Emergency Escape Sequence 1
 * - Responsive HUD Telemetry & Cleanup
 */
import * as THREE from 'three';
import {
  ConvoyMissionEvent,
  ConvoyMissionState,
  ConvoyShipState,
  EnemyDrone,
  ConvoyProjectile,
  ConvoyTelemetry,
  ConvoyMissionResult,
  ConvoyVariant,
  DirectionalThrustState,
  ActiveAbilityState,
  ConvoyFormationPreset,
  ConvoyFleetCommand,
  areHostileFactions,
  SaviourMissionState,
  HuntersMissionState,
} from './convoyTypes';
import {
  SAVIOUR_SHIPS,
  HUNTER_SHIPS,
  AI_DEFENSIVE_DRONES,
  ConvoyPlayableShipDef,
  getConvoyShipDef,
} from './convoyShipDatabase';
import { convoyEnvironment } from './convoyEnvironment';
import { convoyRadarService } from './convoyRadarService';
import { convoyEscapeSequence } from './convoyEscapeSequence';
import { convoyChamberGates } from './convoyChamberGates';
import { convoyAdaptiveRoute } from './convoyAdaptiveRoute';
import { ConvoyPersistenceManager } from './convoyPersistence';
import { CAMPAIGN_REGIONS, getRegionByProgress, getRegionByKm } from './convoyCampaignRegions';
import { convoyBossDirector } from './convoyBossDirector';
import { sound } from '../audio';
import { createProceduralShipMesh } from '../shipMeshGenerator';
import { ConvoyShipFactory, ConvoyShipRole } from './convoyShipFactory';
import {
  ConvoyDivisionId,
  ConvoyRankTier,
  CONVOY_DIVISIONS,
  BackupShipState,
  checkBackupEligibility,
} from './convoyDivisions';

// Convoy Guardian hostile engagement is confined to the 90,000–130,000 km corridor.
// The mission telemetry maps the full 200,000 km route to normalized routeProgress.
const HOSTILE_SECTOR_START_KM = 90000;
const HOSTILE_SECTOR_END_KM = 130000;
const CONVOY_ROUTE_LENGTH_KM = 200000;
const HOSTILE_SECTOR_START_PROGRESS = HOSTILE_SECTOR_START_KM / CONVOY_ROUTE_LENGTH_KM; // 0.45
const HOSTILE_SECTOR_END_PROGRESS = HOSTILE_SECTOR_END_KM / CONVOY_ROUTE_LENGTH_KM;     // 0.65
const COMBAT_MIDPOINT_PROGRESS = 110000 / CONVOY_ROUTE_LENGTH_KM;                       // 0.55

export class ConvoyDirector {
  public isActive: boolean = false;
  public isPaused: boolean = false;
  public isInitialized: boolean = false;
  public missionState: ConvoyMissionState = 'BRIEFING';
  public variant: 'SAVIOUR' | 'HUNTERS' = 'SAVIOUR';
  
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  // Convoy Guardian-only camera perspectives: chase, close, wide, and cockpit.
  public cameraPerspective: 0 | 1 | 2 | 3 = 0;
  // Camera distance zoom is scoped to Convoy Guardian only. 1 = default.
  public cameraZoom: number = 1;
  public combatGroup: THREE.Group;

  // Selected Ship & Role
  public currentShipDef: ConvoyPlayableShipDef = SAVIOUR_SHIPS[0];
  public playerAbilities: ActiveAbilityState[] = [];

  // Convoy Fleet (9 Ships for Saviour)
  public convoyShips: ConvoyShipState[] = [];
  public convoySpeed: number = 70; // Cruising speed m/s
  public routeProgress: number = 0.0; // 0.0 to 1.0 along route
  public activeFormation: ConvoyFormationPreset = 'V_FORMATION';
  public activeFleetCommand: ConvoyFleetCommand = 'FOLLOW';
  public travelDirection: 'OUTBOUND' | 'RETURN' = 'OUTBOUND';
  public roundTripDistanceKm: number = 0;
  public maxProgressKm: number = 0;
  private lastSpawnedBossRegionId: number = -1;
  private isEscortingDome: boolean = false;
  private hostileSectorEntryAnnounced: boolean = false;
  private convoyWeaponsCooldown: number = 0;

  // Hostiles & Entities
  public enemyDrones: EnemyDrone[] = [];
  public projectiles: ConvoyProjectile[] = [];

  // Player State & Transform
  public playerShipMesh: THREE.Group | null = null;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 15, 60);
  public playerRot: THREE.Euler = new THREE.Euler(0, 0, 0);
  public playerVel: THREE.Vector3 = new THREE.Vector3();
  public playerHealth: number = 1000;
  /** Short post-spawn grace period prevents unavoidable immediate defeats. */
  private spawnProtectionTimer: number = 0;
  public playerMaxHealth: number = 1000;
  public playerShield: number = 300;
  public playerMaxShield: number = 300;
  public playerBoostCharge: number = 100;
  public isBoosting: boolean = false;
  public isShielding: boolean = false;
  public isTouchShielding: boolean = false;

  // Engine ON/OFF Toggle & Station-Keeping
  public isEngineOn: boolean = false; // Defaults to ENGINE OFF on mission start
  public directionalThrust: DirectionalThrustState = {
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    backward: false,
  };

  // Targeting & Stealth
  public lockedTargetId: string | null = null;
  public stealthEntities: Set<string> = new Set();
  public damageAmpTargets: Map<string, number> = new Map(); // targetId -> multiplier
  public activeBarriers: THREE.Mesh[] = [];

  // Weapons Cooldowns
  public fireCooldown: number = 0;
  public isTouchFiring: boolean = false;
  public isTouchBoosting: boolean = false;
  private barrierHitCooldown: number = 0;
  private routeHazardHitCooldown: number = 0;

  // Tactical Radar Settings
  public radarZoom: number = 1.0;
  public isRadarExpanded: boolean = false;

  // Divisions & Backup Calling System (Command Leaders: Lead Ship Saviour & Hunter Main Hunter Only)
  public activeBackupShip: BackupShipState | null = null;
  public selectedBackupDivision: ConvoyDivisionId = 'D5';
  public divisionCooldowns: Record<ConvoyDivisionId, number> = { D5: 0, D4: 0, D3: 0, D2: 0, D1: 0 };
  private backupShieldTime = 0;
  private backupReconTime = 0;

  // Joystick & Input
  private keysDown: Record<string, boolean> = {};
  private joystickSteerX: number = 0;
  private joystickPitchY: number = 0;

  // Mission Tracking & 7 Events
  public currentEventIndex: number = 0;
  public events: ConvoyMissionEvent[] = [];
  public timeElapsed: number = 0;
  public dronesDestroyedCount: number = 0;
  public debrisClearedCount: number = 0;
  public repairsCollectedCount: number = 0;
  public notifications: ConvoyTelemetry['notifications'] = [];
  public finalStats: ConvoyMissionResult | null = null;

  // Fully isolated lifecycle state objects for Saviour and Hunters modes
  public saviourMissionState: SaviourMissionState;
  public huntersMissionState: HuntersMissionState;

  constructor() {
    this.combatGroup = new THREE.Group();
    this.combatGroup.name = 'convoy_guardian_entities';
    this.initEvents();

    this.saviourMissionState = {
      totalDistanceKm: 0,
      currentRegionIndex: 0,
      regionDistanceKm: 0,
      activeFormation: 'V_FORMATION',
      activeCommand: 'FOLLOW',
      cargoShipsAlive: 3,
      cargoShipsTotal: 3,
      transportsAlive: 9,
      transportsTotal: 9,
      checkpointsPassed: 0,
      isDockingSequenceActive: false,
      dockingClampEngaged: false,
      missionCompleted: false,
      missionFailed: false,
      timeElapsedSeconds: 0,
    };

    this.huntersMissionState = {
      bossHp: 1000,
      bossMaxHp: 1000,
      bossShield: 500,
      bossMaxShield: 500,
      bossPhase: 1,
      bossPhaseName: 'PHASE 1: SHIELDED DEFENSE (6 DRONES ACTIVE)',
      isBossVulnerable: false,
      hunterShipsAlive: 10,
      hunterShipsTotal: 10,
      dronesAlive: {
        scout: true,
        striker: true,
        warden: true,
        mender: true,
        jammer: true,
        breaker: true,
      },
      jammerDisruptingRadar: true,
      wardenShieldActive: true,
      menderHealingActive: true,
      killCount: 0,
      missionCompleted: false,
      missionFailed: false,
      timeElapsedSeconds: 0,
    };
  }

  public init(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;
    if (!scene.getObjectByName('convoy_guardian_entities')) {
      scene.add(this.combatGroup);
    }
    convoyBossDirector.init(this.combatGroup);
  }

  private initEvents() {
    this.events = [
      {
        id: 'RENDEZVOUS',
        eventNumber: 1,
        name: 'RENDEZVOUS',
        subtitle: 'ESCORT FORMATION DEPARTURE',
        objectiveDescription: 'Rendezvous with the Convoy Fleet at Solar Anchor Alpha.',
        minRouteProgress: 0.0,
        isCompleted: false,
      },
      {
        id: 'DEBRIS_CORRIDOR',
        eventNumber: 2,
        name: 'DEBRIS CORRIDOR',
        subtitle: 'DENSE ASTEROID PASSAGE',
        objectiveDescription: 'Clear or navigate dangerous asteroid debris threatening the transports.',
        minRouteProgress: 0.16,
        targetProgress: 0.35,
        isCompleted: false,
      },
      {
        id: 'DRONE_INTERCEPT',
        eventNumber: 3,
        name: 'DRONE INTERCEPT',
        subtitle: 'HOSTILE VANGUARD STRIKE',
        objectiveDescription: 'Intercept and destroy the enemy scout drone strike wave.',
        minRouteProgress: HOSTILE_SECTOR_START_PROGRESS,
        targetProgress: COMBAT_MIDPOINT_PROGRESS, // 30,000 km midpoint of the combat corridor (0.60)
        targetKills: 12,
        currentKills: 0,
        isCompleted: false,
      },
      {
        id: 'AMBUSH_CROSSFIRE',
        eventNumber: 4,
        name: 'AMBUSH CROSSFIRE',
        subtitle: 'MULTI-VECTOR PIRATE FLANK',
        objectiveDescription: 'Defend flanking cargo transports from heavy gunship ambushers.',
        minRouteProgress: COMBAT_MIDPOINT_PROGRESS,
        targetProgress: HOSTILE_SECTOR_END_PROGRESS, // 35,000 km end of combat corridor (0.70)
        targetKills: 16,
        currentKills: 0,
        isCompleted: false,
      },
      {
        id: 'HULL_BREACH',
        eventNumber: 5,
        name: 'HULL BREACH & REPAIR',
        subtitle: 'FIELD NANITE RESTORATION',
        objectiveDescription: 'Retrieve field nanite repair canisters to restore damaged cargo transports.',
        minRouteProgress: HOSTILE_SECTOR_END_PROGRESS,
        targetProgress: 0.80, // 35,000–40,000 km late-route transition
        isCompleted: false,
      },
      {
        id: 'FINAL_APPROACH',
        eventNumber: 6,
        name: 'FINAL APPROACH',
        subtitle: 'CITADEL SECTOR TRANSIT',
        objectiveDescription: 'Escort surviving fleet through the defense matrix corridor.',
        minRouteProgress: 0.80, // 40,000–48,000 km final route section
        targetProgress: 0.95,
        isCompleted: false,
      },
      {
        id: 'FINAL_DEFENSE',
        eventNumber: 7,
        name: 'FINAL DESTINATION: PARKING DOME',
        subtitle: '50,000 KM ARRIVAL & SECURE DOCKING',
        objectiveDescription: 'Enter the Parking Dome, maneuver into Bay 01, engage parking locks, and secure the convoy fleet.',
        minRouteProgress: 0.95, // 47,500–50,000 km final destination
        isCompleted: false,
      },
    ];
  }

  /**
   * Start Mission with selected playable ship and role
   */
  public startMission(
    selectedShipId: string = 'saviour_aegis',
    variant: ConvoyVariant = 'SAVIOUR',
    startRegionIndex: number = 0
  ) {
    this.isInitialized = false;
    this.isActive = false;
    this.isPaused = false;
    this.missionState = 'INITIALIZING';
    this.cleanUp();
    this.variant = variant === 'HUNTER' || variant === 'HUNTERS' ? 'HUNTERS' : 'SAVIOUR';
    this.timeElapsed = 0;
    const clampedRegion = Math.max(0, Math.min(24, startRegionIndex));
    this.routeProgress = clampedRegion > 0 ? Math.min(0.96, clampedRegion / 25) : 0.0;
    this.cameraPerspective = 0;
    this.cameraZoom = 1;
    this.isEscortingDome = clampedRegion >= 24;
    this.hostileSectorEntryAnnounced = false;
    this.barrierHitCooldown = 0;
    this.routeHazardHitCooldown = 0;
    this.currentEventIndex = Math.min(this.events.length - 1, clampedRegion * 2);
    this.dronesDestroyedCount = 0;
    this.debrisClearedCount = 0;
    this.repairsCollectedCount = 0;
    this.finalStats = null;
    this.convoyWeaponsCooldown = 0;
    this.isEngineOn = false; // Start with ENGINE OFF
    this.directionalThrust = {
      up: false,
      down: false,
      left: false,
      right: false,
      forward: false,
      backward: false,
    };
    this.stealthEntities.clear();
    this.damageAmpTargets.clear();
    this.activeBarriers = [];
    this.activeFormation = 'V_FORMATION';
    this.activeFleetCommand = 'FOLLOW';
    this.lastSpawnedBossRegionId = -1;
    this.initEvents();
    convoyEscapeSequence.reset();
    convoyRadarService.clear();
    convoyBossDirector.cleanUp();

    // Look up selected ship definition
    const shipDef = getConvoyShipDef(selectedShipId);
    this.currentShipDef = shipDef;

    // Initialize ship stats and 5 active abilities
    this.playerHealth = shipDef.hp;
    this.playerMaxHealth = shipDef.hp;
    this.spawnProtectionTimer = 3.0; // 3 seconds spawn protection
    this.playerShield = Math.round(shipDef.hp * 0.35);
    this.playerMaxShield = this.playerShield;
    this.playerAbilities = shipDef.abilities.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      cooldownSeconds: a.cooldownSeconds,
      currentCooldown: 0,
      durationSeconds: a.durationSeconds,
      activeTimeRemaining: 0,
      isActive: false,
      isUltimate: a.isUltimate,
      keyLabel: a.keyLabel,
    }));

    if (this.scene) {
      convoyEnvironment.build(this.scene);
    }

    if (this.variant === 'SAVIOUR') {
      const initialDistKm = clampedRegion * 2000;
      this.saviourMissionState = {
        totalDistanceKm: initialDistKm,
        currentRegionIndex: clampedRegion,
        regionDistanceKm: 0,
        activeFormation: this.activeFormation,
        activeCommand: this.activeFleetCommand,
        cargoShipsAlive: 3,
        cargoShipsTotal: 3,
        transportsAlive: 9,
        transportsTotal: 9,
        checkpointsPassed: clampedRegion,
        isDockingSequenceActive: clampedRegion >= 24,
        dockingClampEngaged: false,
        missionCompleted: false,
        missionFailed: false,
        timeElapsedSeconds: 0,
      };
      this.spawnSaviourFleet(shipDef.id);
      const jumpNotice = clampedRegion > 0 ? ` · JUMPED TO REGION ${clampedRegion + 1} (${initialDistKm.toLocaleString()} KM)` : '';
      this.addNotification(`SAVIOUR: ESCORT INITIATED · PILOTING [${shipDef.name}] · FLEET EN ROUTE${jumpNotice}`, 'EVENT');
    } else {
      this.huntersMissionState = {
        bossHp: 1000,
        bossMaxHp: 1000,
        bossShield: 500,
        bossMaxShield: 500,
        bossPhase: 1,
        bossPhaseName: 'PHASE 1: SHIELDED DEFENSE (6 DRONES ACTIVE)',
        isBossVulnerable: false,
        hunterShipsAlive: 10,
        hunterShipsTotal: 10,
        dronesAlive: {
          scout: true,
          striker: true,
          warden: true,
          mender: true,
          jammer: true,
          breaker: true,
        },
        jammerDisruptingRadar: true,
        wardenShieldActive: true,
        menderHealingActive: true,
        killCount: 0,
        missionCompleted: false,
        missionFailed: false,
        timeElapsedSeconds: 0,
      };
      this.spawnHunterBattle(shipDef.id);
      this.addNotification(`HUNTERS: INTERCEPTION STAGED · PILOTING [${shipDef.name}] · FLEET READY`, 'ALERT');
    }

    this.spawnPlayerShipMesh(shipDef);

    // Mark mission fully ready and active only after all ships, meshes, and states are initialized
    this.isInitialized = true;
    this.isActive = true;
    this.missionState = 'ACTIVE';
    this.timeElapsed = 0;
    sound.playWormholeWarp();
  }

  /**
   * Spawn Saviour 9-Ship Fleet
   * The chosen ship is marked as player possessed; the remaining 8 are AI controlled.
   */
  private spawnSaviourFleet(playerShipDefId: string) {
    this.convoyShips = [];

    // Formation slot offsets along route corridor for all 9 Saviour ships
    const defaultOffsets: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, -85),      // Slot 0: Flagship (Aegis)
      new THREE.Vector3(-65, 15, -35),   // Slot 1: Escort Left (Raptor)
      new THREE.Vector3(65, 15, -35),    // Slot 2: Escort Right (Bulwark)
      new THREE.Vector3(-45, -8, 25),    // Slot 3: Frigate Mid-Left (Medic)
      new THREE.Vector3(0, 10, 45),      // Slot 4: Frigate Center (Spectre)
      new THREE.Vector3(45, -8, 25),     // Slot 5: Frigate Mid-Right (Paladin)
      new THREE.Vector3(-55, 12, 100),   // Slot 6: Heavy Escort Left (Vectra)
      new THREE.Vector3(55, 12, 100),    // Slot 7: Heavy Escort Right (Oracle)
      new THREE.Vector3(0, -15, 155),    // Slot 8: Rear Guard (Quantum)
    ];

    const startPt = convoyEnvironment.getRoutePoint(this.routeProgress);
    const tangent = convoyEnvironment.getRouteTangent(this.routeProgress);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    SAVIOUR_SHIPS.forEach((def, index) => {
      const isPlayer = def.id === playerShipDefId || (index === 0 && !SAVIOUR_SHIPS.some(s => s.id === playerShipDefId));
      const offset = defaultOffsets[index] || new THREE.Vector3(0, 0, 0);

      const mesh = this.createShipVisualMesh(def);
      this.combatGroup.add(mesh);

      const initialPos = startPt.clone()
        .addScaledVector(normal, offset.x)
        .addScaledVector(up, offset.y)
        .addScaledVector(tangent, offset.z);

      mesh.position.copy(initialPos);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);

      const shipState: ConvoyShipState = {
        id: `saviour_${def.id}`,
        name: def.name,
        shipDefId: def.id,
        isLead: index === 0,
        isPlayerControlled: isPlayer,
        role: def.formationRole,
        faction: 'SAVIOUR',
        health: def.hp,
        maxHealth: def.hp,
        shield: Math.round(def.hp * 0.35),
        maxShield: Math.round(def.hp * 0.35),
        isAlive: true,
        isDestroyed: false,
        status: 'NOMINAL',
        position: initialPos,
        rotation: new THREE.Euler(0, Math.PI, 0),
        velocity: new THREE.Vector3(),
        targetOffset: offset,
        routeProgress: this.routeProgress,
        speed: this.convoySpeed,
        mesh,
        hitFlashTimer: 0,
      };

      this.convoyShips.push(shipState);

      if (isPlayer) {
        this.playerPos.copy(initialPos);
        this.playerRot.set(0, 0, 0);
        this.playerVel.set(0, 0, 0);
      }
    });

    this.updateFleetPositions(0.001);
  }

  /**
   * Spawn Hunters Battle Formation: 10 Fighters + Dreadnought X + 6 AI Drones
   */
  private spawnHunterBattle(playerShipDefId: string) {
    this.convoyShips = [];
    this.enemyDrones = [];

    // Spawn target civilian convoy ahead (Faction: SAVIOUR)
    const targetConvoy = [
      { id: 'tgt_cargo_1', name: 'TARGET FREIGHTER ALPHA', offset: new THREE.Vector3(0, 0, -450), hp: 1200 },
      { id: 'tgt_cargo_2', name: 'TARGET HAULER BETA', offset: new THREE.Vector3(-60, 20, -550), hp: 1400 },
      { id: 'tgt_cargo_3', name: 'TARGET HAULER GAMMA', offset: new THREE.Vector3(60, -15, -620), hp: 1400 },
    ];
    targetConvoy.forEach((c, idx) => {
      const mesh = ConvoyShipFactory.createModel({
        faction: 'SAVIOUR',
        role: 'CARGO_SHIP',
      });
      this.combatGroup.add(mesh);
      this.convoyShips.push({
        id: c.id,
        name: c.name,
        isLead: idx === 0,
        isPlayerControlled: false,
        role: 'CARGO',
        faction: 'SAVIOUR', // Faction is SAVIOUR
        health: c.hp,
        maxHealth: c.hp,
        shield: 350,
        maxShield: 350,
        isAlive: true,
        isDestroyed: false,
        status: 'NOMINAL',
        position: new THREE.Vector3(c.offset.x, c.offset.y, -1200 + c.offset.z),
        rotation: new THREE.Euler(0, Math.PI, 0),
        velocity: new THREE.Vector3(0, 0, -45),
        targetOffset: c.offset,
        routeProgress: 0.15,
        speed: 45,
        mesh,
        hitFlashTimer: 0,
      });
    });

    // Spawn 1,000 HP Primary Boss (Guardian Siege Titan / Dreadnought X Core)
    const bossSpawnPos = new THREE.Vector3(0, 30, -780);
    convoyBossDirector.spawnMajorBoss('hunter_mode_boss', bossSpawnPos);

    // Spawn 10 Hunter Fighters (Faction: HUNTERS)
    const fighterRoster = HUNTER_SHIPS.filter(h => h.id !== 'hunter_dreadnought_x');
    fighterRoster.forEach((def, idx) => {
      const isPlayer = def.id === playerShipDefId || (idx === 0 && !fighterRoster.some(h => h.id === playerShipDefId));

      // Spread along the attack line
      const xOffset = ((idx % 5) - 2) * 85;
      const yOffset = ((idx % 3) - 1) * 35;
      const zOffset = -550 - Math.floor(idx / 5) * 160;
      const spawnPos = new THREE.Vector3(xOffset, 20 + yOffset, zOffset);

      if (isPlayer) {
        this.playerPos.copy(spawnPos);
        this.playerRot.set(0, 0, 0);
        this.playerVel.set(0, 0, 0);
      } else {
        const mesh = this.createShipVisualMesh(def);
        mesh.position.copy(spawnPos);
        this.combatGroup.add(mesh);

        this.enemyDrones.push({
          id: def.id,
          type: 'MAIN_HUNTER',
          role: 'MAIN_HUNTER',
          faction: 'HUNTERS',
          health: def.hp,
          maxHealth: def.hp,
          isAlive: true,
          position: spawnPos,
          rotation: new THREE.Euler(),
          velocity: new THREE.Vector3(),
          targetId: targetConvoy[0].id,
          attackCooldown: 1.0 + Math.random(),
          fireRate: 0.8,
          speed: def.speedRating,
          damage: 14,
          mesh,
          hitFlashTimer: 0,
        });
      }
    });

    // Spawn the 6 AI-Only Defensive Drones around hunter_mode_boss
    AI_DEFENSIVE_DRONES.forEach((droneClass, dIdx) => {
      const angle = (dIdx / 6) * Math.PI * 2;
      const dronePos = new THREE.Vector3(
        bossSpawnPos.x + Math.cos(angle) * droneClass.orbitRadius,
        bossSpawnPos.y + Math.sin(angle) * 35,
        bossSpawnPos.z + Math.sin(angle) * droneClass.orbitRadius
      );
      const droneMesh = this.createDroneMesh('DEFENSE_DRONE', droneClass.color);
      droneMesh.position.copy(dronePos);
      this.combatGroup.add(droneMesh);

      this.enemyDrones.push({
        id: `ai_drone_${droneClass.typeId.toLowerCase()}`,
        droneClassId: droneClass.typeId,
        type: 'DEFENSE_DRONE',
        role: 'DEFENSE_DRONE',
        faction: 'HUNTERS',
        parentEntityId: 'hunter_mode_boss',
        aiState: 'ORBIT',
        health: droneClass.health,
        maxHealth: droneClass.health,
        isAlive: true,
        position: dronePos,
        rotation: new THREE.Euler(),
        velocity: new THREE.Vector3(),
        targetId: targetConvoy[0].id,
        attackCooldown: 1.0 + Math.random(),
        fireRate: droneClass.fireRate,
        speed: droneClass.speed,
        damage: droneClass.damage,
        mesh: droneMesh,
        hitFlashTimer: 0,
      });
    });
  }

  private spawnPlayerShipMesh(shipDef: ConvoyPlayableShipDef) {
    if (this.playerShipMesh) {
      this.combatGroup.remove(this.playerShipMesh);
    }
    this.playerShipMesh = this.createShipVisualMesh(shipDef);
    this.playerShipMesh.position.copy(this.playerPos);
    this.combatGroup.add(this.playerShipMesh);
  }

  private createShipVisualMesh(def: ConvoyPlayableShipDef): THREE.Group {
    let role: ConvoyShipRole = 'LEAD_SHIP';
    let isMirrored = false;

    if (def.faction === 'SAVIOUR') {
      switch (def.id) {
        case 'saviour_aegis':
          role = 'LEAD_SHIP';
          break;
        case 'saviour_raptor':
          role = 'FORWARD_GUARD';
          isMirrored = false;
          break;
        case 'saviour_bulwark':
          role = 'FORWARD_GUARD';
          isMirrored = true;
          break;
        case 'saviour_medic':
        case 'saviour_spectre':
        case 'saviour_paladin':
          role = 'CARGO_SHIP';
          break;
        case 'saviour_vectra':
          role = 'REAR_GUARD';
          isMirrored = false;
          break;
        case 'saviour_oracle':
          role = 'REAR_GUARD';
          isMirrored = true;
          break;
        case 'saviour_quantum':
          role = 'BACKEND_SHIP';
          break;
        default:
          if (def.formationRole === 'CARGO') role = 'CARGO_SHIP';
          else if (def.formationRole === 'LEAD_GUARD') role = 'LEAD_SHIP';
          else if (def.formationRole === 'REAR_GUARD') role = 'BACKEND_SHIP';
          else role = 'FORWARD_GUARD';
          break;
      }
    } else {
      // HUNTERS (17-unit assault formation)
      switch (def.id) {
        case 'hunter_fang':
        case 'hunter_wraith':
        case 'hunter_reaper':
        case 'hunter_swarmer':
        case 'hunter_bastion':
        case 'hunter_anomaly':
          role = 'MAIN_HUNTER';
          break;
        case 'hunter_scythe':
        case 'hunter_jammer':
        case 'hunter_lancer':
        case 'hunter_mauler':
          role = 'MID_HUNTER';
          break;
        case 'hunter_dreadnought_x':
          role = 'BOSS';
          break;
        default:
          role = def.formationRole === 'COMMAND_BOSS' ? 'BOSS' : 'MAIN_HUNTER';
          break;
      }
    }

    const currentDiv: ConvoyDivisionId = this.selectedBackupDivision || 'D5';
    const currentRank: ConvoyRankTier = 1;

    return ConvoyShipFactory.createModel({
      faction: def.faction,
      role,
      shipDefId: def.id,
      division: currentDiv,
      rank: currentRank,
      isMirrored,
      customPrimaryHex: parseInt(def.primaryColor.replace('#', '0x'), 16),
      customAccentHex: parseInt(def.accentColor.replace('#', '0x'), 16),
    });
  }

  // =========================================================================
  // MAIN GAMEPLAY UPDATE LOOP (DELTA TIME AUTHORITATIVE)
  // =========================================================================
  public update(dt: number) {
    this.spawnProtectionTimer = Math.max(0, this.spawnProtectionTimer - dt);
    if (!this.isActive || !this.isInitialized || this.isPaused || this.missionState !== 'ACTIVE') return;

    // Clamp dt to prevent physics spikes during frame drops or tab suspension
    const clampedDt = Math.min(0.05, Math.max(0.001, dt));
    this.timeElapsed += clampedDt;

    // Division cooldowns and active reinforcement orders.
    (Object.keys(this.divisionCooldowns) as ConvoyDivisionId[]).forEach((id) => {
      this.divisionCooldowns[id] = Math.max(0, this.divisionCooldowns[id] - clampedDt);
    });
    this.backupShieldTime = Math.max(0, this.backupShieldTime - clampedDt);
    this.backupReconTime = Math.max(0, this.backupReconTime - clampedDt);
    this.updateBackupShip(clampedDt);

    // Cooldown timers
    this.barrierHitCooldown = Math.max(0, this.barrierHitCooldown - clampedDt);
    this.routeHazardHitCooldown = Math.max(0, this.routeHazardHitCooldown - clampedDt);

    // Update 5 player ability cooldowns and durations
    this.playerAbilities.forEach(ab => {
      if (ab.currentCooldown > 0) ab.currentCooldown = Math.max(0, ab.currentCooldown - clampedDt);
      if (ab.activeTimeRemaining > 0) {
        ab.activeTimeRemaining = Math.max(0, ab.activeTimeRemaining - clampedDt);
        if (ab.activeTimeRemaining <= 0) {
          ab.isActive = false;
          this.onAbilityExpired(ab.id);
        }
      }
    });

    // 1. Convoy Fleet Progression & Corridor Movement
    this.updateConvoyProgression(clampedDt);

    // 2. Player Flight Physics with 6-Axis Movement & Engine State
    this.updatePlayerFlight(clampedDt);

    // 3. Enemy Drones AI (including 6 AI Drone classes)
    this.updateEnemies(clampedDt);

    // 3b. Convoy Fleet Defensive Fire (Saviour AI escorts / defensive counter-fire)
    this.updateConvoyFleetWeapons(clampedDt);

    // 3c. 25-Region Boss Encounters & Boss Director Update
    const currentRegion = getRegionByProgress(this.routeProgress);
    if (this.variant === 'SAVIOUR' && currentRegion.bossEncounter && this.lastSpawnedBossRegionId !== currentRegion.id) {
      this.lastSpawnedBossRegionId = currentRegion.id;
      const routePt = convoyEnvironment.getRoutePoint(this.routeProgress);
      const tangent = convoyEnvironment.getRouteTangent(this.routeProgress);
      const bossSpawnPos = routePt.clone().addScaledVector(tangent, 380).add(new THREE.Vector3(0, 25, 0));
      convoyBossDirector.spawnMajorBoss(currentRegion.bossEncounter.bossId, bossSpawnPos);
      this.addNotification(`ALERT: ${currentRegion.bossEncounter.bossName.toUpperCase()} ENGAGING CONVOY!`, 'ALERT');
    }
    const activeDronesCount = this.enemyDrones.filter(d => d.isAlive).length;
    convoyBossDirector.update(
      clampedDt,
      this.playerPos,
      activeDronesCount,
      this.projectiles,
      (text, type) => this.addNotification(text, type)
    );

    // 4. Projectiles & Collision Handling
    this.updateProjectiles(clampedDt);

    // 5. 9 Route Hazards Collision Check
    this.updateRouteHazards(clampedDt);

    // 6. Physical Asteroid Debris Collisions
    this.updateAsteroidCollisions(clampedDt);

    // 7. Nanite Repair Pickups
    this.updateRepairPickups();

    // 8. 7 Mission Events State Machine
    if (this.variant === 'SAVIOUR') {
      this.updateMissionEvents(clampedDt);
    }

    // 9. Environment Visual Updates & Chamber Gates Subsystem
    convoyEnvironment.update(clampedDt);
    convoyChamberGates.update(
      clampedDt,
      this.playerPos,
      this.playerVel,
      this.convoyShips,
      convoyEscapeSequence.isEmergencyActive,
      (text, type) => this.addNotification(text, type)
    );

    // 9b. Update Isolated Saviour and Hunters Mission States
    this.updateMissionStates(clampedDt);

    // 10. Check Victory / Defeat Conditions
    this.checkVictoryDefeat();
  }

  /**
   * 6-Direction Movement & Engine ON/OFF Station-Keeping Physics
   */
  private updatePlayerFlight(dt: number) {
    const keys = this.keysDown;
    const speedRating = this.currentShipDef.speedRating || 80;
    const baseAccel = 110 * (speedRating / 80);
    const turn = 2.8 * (speedRating / 80);

    // 1. Angular Steering (Pitch & Yaw via Joystick or WASD/Arrow Keys)
    if (keys['KeyW'] || keys['ArrowUp']) this.playerRot.x -= turn * dt;
    if (keys['KeyS'] || keys['ArrowDown']) this.playerRot.x += turn * dt;
    if (Math.abs(this.joystickPitchY) > 0.04) {
      this.playerRot.x -= this.joystickPitchY * turn * dt;
    }

    if (keys['KeyA'] || keys['ArrowLeft']) this.playerRot.y += turn * dt;
    if (keys['KeyD'] || keys['ArrowRight']) this.playerRot.y -= turn * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      this.playerRot.y -= this.joystickSteerX * turn * dt;
    }

    // Aerodynamic Roll Banking
    if (keys['KeyQ']) this.playerRot.z += turn * 1.5 * dt;
    if (keys['KeyE']) this.playerRot.z -= turn * 1.5 * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      this.playerRot.z = THREE.MathUtils.lerp(this.playerRot.z, -this.joystickSteerX * 0.45, dt * 5);
    } else if (!keys['KeyQ'] && !keys['KeyE']) {
      this.playerRot.z = THREE.MathUtils.lerp(this.playerRot.z, 0, dt * 2.5);
    }

    // Compute Local Direction Vectors
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.playerRot);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(this.playerRot);
    const up = new THREE.Vector3(0, 1, 0).applyEuler(this.playerRot);

    // Boost Handling
    this.isBoosting =
      (this.isTouchBoosting || keys['ShiftLeft'] || keys['ShiftRight']) &&
      this.playerBoostCharge > 0;

    const braking = !!(keys['ControlLeft'] || keys['ControlRight'] || keys['KeyX']);
    const maxSpeed = braking ? 75 : this.isBoosting ? 260 * (speedRating / 80) : 155 * (speedRating / 80);

    if (this.isBoosting) {
      this.playerBoostCharge = Math.max(0, this.playerBoostCharge - 28 * dt);
    } else {
      this.playerBoostCharge = Math.min(100, this.playerBoostCharge + 16 * dt);
    }

    // 2. Six-Directional Movement Handling
    // Determine combined thrust request across all 6 axes
    let thrustX = 0;
    let thrustY = 0;
    let thrustZ = 0;

    if (this.directionalThrust.right) thrustX += 1;
    if (this.directionalThrust.left) thrustX -= 1;
    if (this.directionalThrust.up) thrustY += 1;
    if (this.directionalThrust.down) thrustY -= 1;
    if (this.directionalThrust.forward || keys['KeyW']) thrustZ += 1;
    if (this.directionalThrust.backward || keys['KeyS']) thrustZ -= 1;

    const hasThrustInput = Math.abs(thrustX) > 0 || Math.abs(thrustY) > 0 || Math.abs(thrustZ) > 0 || this.isBoosting;

    if (this.isEngineOn) {
      // ENGINE ON:
      if (hasThrustInput) {
        // Construct composite thrust vector
        const thrustVec = new THREE.Vector3();
        if (thrustZ !== 0) thrustVec.addScaledVector(fwd, thrustZ);
        if (thrustX !== 0) thrustVec.addScaledVector(right, thrustX);
        if (thrustY !== 0) thrustVec.addScaledVector(up, thrustY);

        if (thrustVec.lengthSq() > 0.001) {
          thrustVec.normalize();
          const accelMultiplier = this.isBoosting ? 2.4 : 1.0;
          this.playerVel.addScaledVector(thrustVec, baseAccel * accelMultiplier * dt);
        }
      } else {
        // ENGINE ON with NO directional input held:
        // STATION-KEEPING SYSTEM: smoothly damps velocity to 0 without snapping or teleporting!
        this.playerVel.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, 3.8 * dt));
      }
    } else {
      // ENGINE OFF:
      // Directional thrust is disabled; velocity damps with natural space friction
      this.playerVel.multiplyScalar(Math.pow(0.88, dt * 8));
    }

    // Max Speed Cap & Braking
    if (this.playerVel.length() > maxSpeed) {
      this.playerVel.setLength(maxSpeed);
    }
    if (braking) {
      this.playerVel.multiplyScalar(Math.pow(0.5, dt * 10));
    }

    // Integrate Position
    this.playerPos.addScaledVector(this.playerVel, dt);

    // Continuous Flight Envelope Boundary Containment & Inward Pushback
    const containment = convoyAdaptiveRoute.checkBoundaryContainment(this.playerPos);
    if (containment.pushbackVector.lengthSq() > 0) {
      this.playerPos.addScaledVector(containment.pushbackVector, dt);
      this.playerVel.addScaledVector(containment.pushbackVector, dt * 0.4);
    }

    // Physical Sensor-Controlled Chamber Gate Collisions
    const gateCol = convoyChamberGates.checkShipCollision(this.playerPos, 18);
    if (gateCol.collided && gateCol.normal) {
      this.playerPos.addScaledVector(gateCol.normal, 2.5);
      const dot = this.playerVel.dot(gateCol.normal);
      if (dot < 0) {
        this.playerVel.addScaledVector(gateCol.normal, -dot * 1.5);
      }
    }

    // Shield Regeneration
    if (!this.isShielding && this.playerShield < this.playerMaxShield) {
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 8 * dt);
    }

    // Primary Weapons Fire
    this.fireCooldown -= dt;
    if (this.isTouchFiring || keys['Space'] || keys['KeyF']) {
      if (this.fireCooldown <= 0) {
        this.firePlayerLaser();
        this.fireCooldown = 0.15; // ~6.6 shots/sec
      }
    }

    // Synchronize 3D Mesh & Chase Camera
    if (this.playerShipMesh) {
      this.playerShipMesh.position.copy(this.playerPos);
      this.playerShipMesh.rotation.copy(this.playerRot);
    }

    if (this.camera) {
      const cameraOffsets = [
        new THREE.Vector3(0, 14, 38),   // Standard chase
        new THREE.Vector3(0, 5, 17),    // Close action view
        new THREE.Vector3(0, 30, 68),   // Wide tactical view
        new THREE.Vector3(0, 2.1, -1.8), // Cockpit / pilot-eye view, just ahead of ship center
      ];
      const camOffset = cameraOffsets[this.cameraPerspective].clone();
      if (this.cameraPerspective !== 3) camOffset.multiplyScalar(this.cameraZoom);
      camOffset.applyEuler(this.playerRot);
      const targetCam = this.playerPos.clone().add(camOffset);

      // Terminal Camera Anti-Clipping inside the octagonal dome and atrium:
      if (targetCam.z <= -8800) {
        // Clamp Y to prevent clipping through floor and dome ceiling trusses
        targetCam.y = Math.max(-250, Math.min(100, targetCam.y));
        // Clamp radial distance from dome center (0, Y, -9250) to stay comfortably inside R=480
        const dx = targetCam.x;
        const dz = targetCam.z - (-9250);
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 460) {
          const factor = 460 / dist;
          targetCam.x = dx * factor;
          targetCam.z = -9250 + dz * factor;
        }
      }

      this.camera.position.lerp(targetCam, Math.min(1.0, 8.0 * dt));

      const lookDistance = this.cameraPerspective === 2 ? 100 : 75;
      const lookTarget = this.playerPos.clone().add(fwd.clone().multiplyScalar(lookDistance));
      this.camera.lookAt(lookTarget);
      if (this.cameraPerspective === 3) {
        // Slightly widen the cockpit field of view for peripheral awareness.
        this.camera.fov = Math.max(68, Math.min(88, 78 + (1 - this.cameraZoom) * 24));
        this.camera.updateProjectionMatrix();
      } else if (this.camera.fov !== 60) {
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  private firePlayerLaser() {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.playerRot);
    sound.playMissileLaunch();

    const powerRating = this.currentShipDef.power || 80;
    const damage = Math.round(20 * (powerRating / 80));
    const projColor = this.variant === 'HUNTERS' ? 0xf43f5e : 0x14b8a6;

    // Twin laser cannons
    [-4, 4].forEach((offset) => {
      const side = new THREE.Vector3(offset, -1, -5).applyEuler(this.playerRot);
      const spawnPos = this.playerPos.clone().add(side);

      const geo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
      const mat = new THREE.MeshBasicMaterial({ color: projColor });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fwd);
      mesh.position.copy(spawnPos);
      this.combatGroup.add(mesh);

      this.projectiles.push({
        id: `proj_p_${Date.now()}_${Math.random()}`,
        owner: 'PLAYER',
        ownerId: 'player',
        faction: this.variant, // Authoritative player faction ('SAVIOUR' or 'HUNTERS')
        position: spawnPos,
        velocity: fwd.clone().multiplyScalar(440),
        damage,
        radius: 3,
        lifetime: 2.2,
        color: new THREE.Color(projColor),
        mesh,
      });
    });
  }

  // =========================================================================
  // ENEMY DRONES & 6 AI DEFENSIVE DRONE CLASSES
  // =========================================================================
  private updateEnemies(dt: number) {
    const isHunterMode = this.variant === 'HUNTERS' || (this.variant as string) === 'HUNTER';
    const routeKm = this.routeProgress * CONVOY_ROUTE_LENGTH_KM;
    const inHostileSector = routeKm >= HOSTILE_SECTOR_START_KM && routeKm <= HOSTILE_SECTOR_END_KM;

    if (!isHunterMode && !inHostileSector) {
      // Never let Saviour hostile pirate drones chase outside the designated combat sector
      for (let i = this.enemyDrones.length - 1; i >= 0; i--) {
        const drone = this.enemyDrones[i];
        if (drone.faction === 'HUNTERS') {
          if (drone.mesh) this.combatGroup.remove(drone.mesh);
          drone.isAlive = false;
          this.enemyDrones.splice(i, 1);
        }
      }
      return;
    }

    for (let i = this.enemyDrones.length - 1; i >= 0; i--) {
      const drone = this.enemyDrones[i];
      if (!drone.isAlive) continue;

      // Handle disabled timer from EMP / Jamming
      if (drone.disabledTimer && drone.disabledTimer > 0) {
        drone.disabledTimer -= dt;
        continue;
      }

      // Explicit declaration and scoping for drone role checks
      const isDefenseDrone = drone.role === 'DEFENSE_DRONE' || drone.type === 'DEFENSE_DRONE';

      if (isDefenseDrone) {
        // AI DEFENSIVE DRONE BEHAVIOR:
        // Orbit parent unit (Dreadnought X or designated flagship)
        const parentPos = this.getDroneParentPosition(drone.parentEntityId);
        const orbitAngle = (i / Math.max(1, this.enemyDrones.length)) * Math.PI * 2 + this.timeElapsed * 1.2;
        const orbitRadius = 90;

        const targetOrbitPos = new THREE.Vector3(
          parentPos.x + Math.cos(orbitAngle) * orbitRadius,
          parentPos.y + Math.sin(orbitAngle) * 45,
          parentPos.z + Math.sin(orbitAngle * 2) * 30
        );

        drone.position.lerp(targetOrbitPos, Math.min(1.0, dt * 3.5));
        drone.velocity.set(0, 0, 0);

        if (drone.mesh) {
          drone.mesh.position.copy(drone.position);
        }

        // Defensive Interception: Destroy incoming HOSTILE projectiles within 70m of drone
        for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
          const p = this.projectiles[pIdx];
          // Only intercept hostile projectiles (friendly fire blocked)
          if (areHostileFactions(drone.faction, p.faction) && p.position.distanceTo(drone.position) < 70) {
            if (p.mesh) this.combatGroup.remove(p.mesh);
            this.projectiles.splice(pIdx, 1);
            sound.playShieldDeflect();
            break;
          }
        }
      } else {
        // COMBAT FLIGHT & TARGET ACQUISITION:
        // Rule: A ship or drone MUST target ONLY opposing living faction entities!
        let targetPos: THREE.Vector3 | null = null;

        if (isHunterMode) {
          // In HUNTER mode, this Hunter fighter/drone is an ally to the player!
          // It MUST target the Saviour civilian/escort convoy ships ONLY.
          // NEVER target the player, allied Hunters, or allied drones.
          let targetShip = this.convoyShips.find(s => s.id === drone.targetId && s.isAlive && s.faction === 'SAVIOUR');
          if (!targetShip) {
            const livingSaviours = this.convoyShips.filter(s => s.isAlive && s.faction === 'SAVIOUR');
            if (livingSaviours.length > 0) {
              livingSaviours.sort((a, b) => a.position.distanceTo(drone.position) - b.position.distanceTo(drone.position));
              targetShip = livingSaviours[0];
              drone.targetId = targetShip.id;
            }
          }
          if (targetShip) {
            targetPos = targetShip.position;
          }
        } else {
          // In SAVIOUR mode, this drone is a hostile pirate attacking the Saviour fleet.
          // It can target a living Saviour convoy ship or the Saviour player.
          let targetShip = this.convoyShips.find(s => s.id === drone.targetId && s.isAlive && s.faction === 'SAVIOUR');
          if (!targetShip) {
            const livingSaviours = this.convoyShips.filter(s => s.isAlive && s.faction === 'SAVIOUR');
            if (livingSaviours.length > 0) {
              targetShip = livingSaviours[Math.floor(Math.random() * livingSaviours.length)];
              drone.targetId = targetShip.id;
              targetPos = targetShip.position;
            } else if (this.playerHealth > 0) {
              targetPos = this.playerPos;
            }
          } else {
            targetPos = targetShip.position;
          }
        }

        if (!targetPos) {
          // No valid target available, hold formation cruise
          continue;
        }

        const toTarget = targetPos.clone().sub(drone.position);
        const dist = toTarget.length();
        const dir = toTarget.normalize();

        // Bounded steering & velocity
        drone.velocity.lerp(dir.clone().multiplyScalar(drone.speed), Math.min(1.0, dt * 2.8));
        drone.position.addScaledVector(drone.velocity, dt);

        if (drone.mesh) {
          drone.mesh.position.copy(drone.position);
          drone.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        }

        // Attack firing (re-verify target faction and alive state immediately before firing)
        drone.attackCooldown -= dt;
        if (drone.attackCooldown <= 0 && dist < 450) {
          this.fireEnemyLaser(drone, targetPos);
          drone.attackCooldown = 1 / Math.max(0.2, drone.fireRate);
        }
      }
    }
  }

  private getDroneParentPosition(parentId?: string): THREE.Vector3 {
    if (parentId) {
      const boss = this.enemyDrones.find(e => e.id === parentId);
      if (boss && boss.isAlive) return boss.position;
    }
    const boss = this.enemyDrones.find(e => e.role === 'BOSS' && e.isAlive);
    if (boss) return boss.position;
    return this.playerPos;
  }

  private fireEnemyLaser(drone: EnemyDrone, targetPos: THREE.Vector3) {
    const dir = targetPos.clone().sub(drone.position).normalize();
    const isAlliedToPlayer = !areHostileFactions(drone.faction, this.variant);
    const laserColor = isAlliedToPlayer ? 0x38bdf8 : 0xf43f5e;

    const geo = new THREE.CylinderGeometry(0.5, 0.5, 9, 6);
    const mat = new THREE.MeshBasicMaterial({ color: laserColor });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh.position.copy(drone.position);
    this.combatGroup.add(mesh);

    this.projectiles.push({
      id: `proj_e_${Date.now()}_${Math.random()}`,
      owner: isAlliedToPlayer ? 'ALLY' : 'ENEMY',
      ownerId: drone.id,
      faction: drone.faction, // Authoritative faction of the shooter
      position: drone.position.clone(),
      velocity: dir.multiplyScalar(280),
      damage: drone.damage,
      radius: 3,
      lifetime: 2.5,
      color: new THREE.Color(laserColor),
      mesh,
    });
  }

  /**
   * AI Escort & Transport Defensive Fire
   * Saviour AI ships engage hostile Hunter fighters/drones within range.
   * Target transports in Hunter mode defend themselves against hostile Hunter attackers.
   */
  private updateConvoyFleetWeapons(dt: number) {
    if (!this.isActive || !this.isInitialized || this.missionState !== 'ACTIVE') return;

    this.convoyWeaponsCooldown = Math.max(0, this.convoyWeaponsCooldown - dt);
    if (this.convoyWeaponsCooldown > 0) return;
    this.convoyWeaponsCooldown = 1.2;

    const isHunter = this.variant === 'HUNTERS' || (this.variant as string) === 'HUNTER';

    this.convoyShips.forEach(ship => {
      if (!ship.isAlive || ship.isPlayerControlled) return;

      // Find nearest living enemy entity hostile to this ship's faction
      let targetPos: THREE.Vector3 | null = null;

      if (isHunter) {
        // In Hunter mode, this Saviour cargo transport fires defensive counter-lasers at Hunters
        const distToPlayer = ship.position.distanceTo(this.playerPos);
        if (this.playerHealth > 0 && distToPlayer < 360) {
          targetPos = this.playerPos;
        } else {
          const livingHunterDrones = this.enemyDrones.filter(d => d.isAlive && areHostileFactions(ship.faction, d.faction));
          if (livingHunterDrones.length > 0) {
            const nearest = livingHunterDrones.sort((a, b) => a.position.distanceTo(ship.position) - b.position.distanceTo(ship.position))[0];
            if (nearest && nearest.position.distanceTo(ship.position) < 360) {
              targetPos = nearest.position;
            }
          }
        }
      } else {
        // In Saviour mode, hostile pirate drones are in enemyDrones
        const livingHostiles = this.enemyDrones.filter(d => d.isAlive && areHostileFactions(ship.faction, d.faction));
        if (livingHostiles.length > 0) {
          const nearest = livingHostiles.sort((a, b) => a.position.distanceTo(ship.position) - b.position.distanceTo(ship.position))[0];
          if (nearest && nearest.position.distanceTo(ship.position) < 380) {
            targetPos = nearest.position;
          }
        }
      }

      if (targetPos) {
        this.fireEscortLaser(ship, targetPos);
      }
    });
  }

  private fireEscortLaser(ship: ConvoyShipState, targetPos: THREE.Vector3) {
    const dir = targetPos.clone().sub(ship.position).normalize();
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh.position.copy(ship.position);
    this.combatGroup.add(mesh);

    this.projectiles.push({
      id: `proj_escort_${Date.now()}_${Math.random()}`,
      owner: 'TURRET',
      ownerId: ship.id,
      faction: ship.faction, // 'SAVIOUR'
      position: ship.position.clone(),
      velocity: dir.multiplyScalar(320),
      damage: 10,
      radius: 3,
      lifetime: 2.2,
      color: new THREE.Color(0x34d399),
      mesh,
    });
  }

  // =========================================================================
  // 9 ROUTE HAZARDS COLLISION & REACTION
  // =========================================================================
  private updateRouteHazards(dt: number) {
    if (this.routeHazardHitCooldown > 0) return;

    // Check player collision with hazards
    const hazardHit = convoyEnvironment.getRouteHazardCollision(this.playerPos);
    if (hazardHit) {
      const shieldedDamage = this.isShielding ? Math.ceil(hazardHit.damage * 0.2) : hazardHit.damage;
      this.applyDamageToPlayer(shieldedDamage);
      this.playerVel.multiplyScalar(hazardHit.kind.includes('GRAVITY') || hazardHit.kind.includes('SINGULARITY') ? 0.6 : 0.75);
      this.routeHazardHitCooldown = 1.4;
      this.addNotification(`${hazardHit.kind} COLLISION — ${shieldedDamage} HULL DAMAGE APPLIED`, 'WARNING');
      sound.playCrash();
    }
  }

  private updateAsteroidCollisions(dt: number) {
    convoyEnvironment.asteroids.forEach((ast) => {
      if (ast.health <= 0) return;

      // Check collision with player
      if (this.playerPos.distanceTo(ast.position) < ast.radius + 6) {
        this.applyDamageToPlayer(15);
        this.playerVel.multiplyScalar(-0.4); // Kinetic rebound
      }

      // Check collision with convoy ships
      this.convoyShips.forEach((ship) => {
        if (!ship.isAlive) return;
        if (ship.position.distanceTo(ast.position) < ast.radius + 18) {
          this.applyDamageToConvoyShip(ship, 35);
          ast.health = 0;
          if (ast.mesh) convoyEnvironment.group.remove(ast.mesh);
        }
      });
    });
  }

  private updateRepairPickups() {
    convoyEnvironment.repairPickups.forEach((pickup) => {
      if (pickup.collected) return;
      if (this.playerPos.distanceTo(pickup.position) < 38) {
        pickup.collected = true;
        if (pickup.mesh) convoyEnvironment.group.remove(pickup.mesh);
        this.repairsCollectedCount++;
        sound.playRepairCore();

        // Restore health to player and all damaged convoy ships
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + pickup.healAmount);
        this.playerShield = this.playerMaxShield;

        this.convoyShips.forEach((s) => {
          if (s.isAlive) {
            s.health = Math.min(s.maxHealth, s.health + pickup.healAmount);
            s.shield = s.maxShield;
            const pct = (s.health / s.maxHealth) * 100;
            s.status = pct > 70 ? 'NOMINAL' : 'DAMAGED';
          }
        });

        this.addNotification(`NANITE REPAIR CANISTER COLLECTED — HULL INTEGRITY RESTORED`, 'SUCCESS');
      }
    });
  }

  // =========================================================================
  // 5 REAL ABILITIES EXECUTION
  // =========================================================================
  public triggerAbility(slotIndex: number) {
    if (!this.isActive || slotIndex < 0 || slotIndex >= this.playerAbilities.length) return;
    const ability = this.playerAbilities[slotIndex];
    if (ability.currentCooldown > 0) return;

    ability.currentCooldown = ability.cooldownSeconds;
    ability.isActive = true;
    ability.activeTimeRemaining = ability.durationSeconds || 1;

    this.executeAbilityEffect(ability.id);
  }

  public triggerAbilityById(abilityId: string) {
    const idx = this.playerAbilities.findIndex(a => a.id === abilityId);
    if (idx !== -1) this.triggerAbility(idx);
  }

  private executeAbilityEffect(abilityId: string) {
    sound.playShieldDeflect();

    switch (abilityId) {
      // SAVIOUR ABILITIES:
      case 'aegis_barrier':
      case 'momentum_shield':
      case 'reactor_guard':
        this.isShielding = true;
        this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 120);
        this.addNotification(`${this.currentShipDef.name}: ENERGY BARRIER DEPLOYED`, 'SUCCESS');
        break;

      case 'vector_dash':
      case 'combat_dash':
      case 'finisher_dash': {
        const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.playerRot);
        this.playerVel.addScaledVector(fwd, 160);
        sound.playWormholeWarp();
        this.addNotification(`${this.currentShipDef.name}: VECTOR DASH EXECUTED`, 'SUCCESS');
        break;
      }

      case 'threat_lock':
      case 'tactical_mark':
      case 'execute_lock': {
        const target = this.findNearestEnemyTarget();
        if (target) {
          this.lockedTargetId = target.id;
          this.damageAmpTargets.set(target.id, 1.45);
          this.addNotification(`TARGET LOCKED: ${target.name} [DAMAGE +45%]`, 'ALERT');
          sound.playTargetLock();
        }
        break;
      }

      case 'guardian_link':
      case 'rear_guard_link':
      case 'last_escort': {
        const damagedAlly = this.convoyShips
          .filter(s => s.isAlive && !s.isPlayerControlled)
          .sort((a, b) => a.health - b.health)[0];
        if (damagedAlly) {
          damagedAlly.health = Math.min(damagedAlly.maxHealth, damagedAlly.health + 220);
          damagedAlly.shield = damagedAlly.maxShield;
          damagedAlly.status = 'NOMINAL';
          this.addNotification(`GUARDIAN LINK ENGAGED — ${damagedAlly.name} HULL RESTORED`, 'SUCCESS');
        }
        break;
      }

      case 'fortress_horizon':
      case 'bastion_dome': {
        this.isShielding = true;
        this.playerShield = this.playerMaxShield;
        this.convoyShips.forEach(s => {
          if (s.isAlive) s.shield = s.maxShield;
        });
        sound.playStationSecureChime();
        this.addNotification(`ULTIMATE ACTIVATED: 8s SPHERICAL FORTRESS SHIELD ACTIVE`, 'SUCCESS');
        break;
      }

      case 'phase_veil':
      case 'cloak_dash':
        this.stealthEntities.add('player');
        this.addNotification(`STEALTH SENSORS ACTIVE: RADAR SIGNATURE CLOAKED`, 'SUCCESS');
        break;

      case 'emp_burst':
      case 'signal_scramble':
      case 'blackout_pulse': {
        let count = 0;
        this.enemyDrones.forEach(e => {
          if (e.isAlive && areHostileFactions(this.variant, e.faction) && e.position.distanceTo(this.playerPos) < 400) {
            e.disabledTimer = 4.0;
            count++;
          }
        });
        if (this.variant === 'HUNTERS') {
          this.convoyShips.forEach(s => {
            if (s.isAlive && areHostileFactions(this.variant, s.faction) && s.position.distanceTo(this.playerPos) < 400) {
              s.hitFlashTimer = 3.0;
              count++;
            }
          });
        }
        sound.playCrash();
        this.addNotification(`EMP DISRUPTION WAVE: ${count} HOSTILE TARGETS STUNNED`, 'SUCCESS');
        break;
      }

      case 'pulse_cannons':
      case 'piercing_barrage':
      case 'impact_salvo':
      case 'singularity_barrage': {
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            if (this.isActive) this.firePlayerLaser();
          }, i * 60);
        }
        this.addNotification(`HEAVY ARTILLERY BARRAGE DISCHARGED`, 'SUCCESS');
        break;
      }

      default:
        this.addNotification(`ABILITY ACTIVATED: ${abilityId.toUpperCase().replace(/_/g, ' ')}`, 'EVENT');
        break;
    }
  }

  private onAbilityExpired(abilityId: string) {
    if (abilityId === 'phase_veil' || abilityId === 'cloak_dash') {
      this.stealthEntities.delete('player');
    }
  }

  private findNearestEnemyTarget(): { id: string; name: string } | null {
    let nearest: { id: string; name: string; dist: number } | null = null;
    const isHunter = this.variant === 'HUNTERS' || (this.variant as string) === 'HUNTER';

    if (isHunter) {
      // In Hunter mode, enemies are living Saviour convoy ships
      this.convoyShips.forEach(s => {
        if (!s.isAlive || !areHostileFactions(this.variant, s.faction)) return;
        const dist = this.playerPos.distanceTo(s.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { id: s.id, name: s.name, dist };
        }
      });
    } else {
      // In Saviour mode, enemies are living hostile pirate drones
      this.enemyDrones.forEach(d => {
        if (!d.isAlive || !areHostileFactions(this.variant, d.faction)) return;
        const dist = this.playerPos.distanceTo(d.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { id: d.id, name: d.role === 'BOSS' ? 'DREADNOUGHT X' : 'HOSTILE DRONE', dist };
        }
      });
    }

    return nearest;
  }

  // =========================================================================
  // PROGRESSION, EVENTS & 15-STATE EMERGENCY ESCAPE
  // =========================================================================
  private updateConvoyProgression(dt: number) {
    // Cumulative round-trip odometer
    const playerSpeed = this.playerVel.length();
    this.roundTripDistanceKm += (playerSpeed * dt * 0.05);

    // Project player onto spline to calculate current route progress in real-time
    const closestT = convoyAdaptiveRoute.findClosestT(this.playerPos);
    this.routeProgress = closestT;
    const currentKm = this.routeProgress * CONVOY_ROUTE_LENGTH_KM;
    this.maxProgressKm = Math.max(this.maxProgressKm, currentKm);

    // Dynamic travel direction based on velocity projection along route tangent
    const tangent = convoyAdaptiveRoute.getTangentAt(closestT);
    const forwardDot = this.playerVel.dot(tangent);
    if (this.activeFleetCommand === 'RETURN_TO_ORIGIN' || convoyEscapeSequence.currentStep === 'RETURN_TRANSIT') {
      this.travelDirection = 'RETURN';
    } else if (Math.abs(forwardDot) > 1.5) {
      this.travelDirection = forwardDot >= 0 ? 'OUTBOUND' : 'RETURN';
    }

    if (this.isEscortingDome) {
      const isFinished = convoyEscapeSequence.update(
        dt,
        this.convoyShips,
        this.playerPos,
        this.playerVel,
        (text, type) => this.addNotification(text, type)
      );
      if (isFinished && this.missionState === 'ACTIVE') {
        this.triggerVictory();
      }
      return;
    }

    if (!this.hostileSectorEntryAnnounced && currentKm >= HOSTILE_SECTOR_START_KM && currentKm <= HOSTILE_SECTOR_END_KM) {
      this.hostileSectorEntryAnnounced = true;
      if (this.variant === 'HUNTERS') {
        this.addNotification('MANDATORY ENGAGEMENT SECTOR ENTERED — HUNTER AI AND CONVOY COMBAT ACTIVE', 'ALERT');
        sound.playAlarmAlert();
      } else {
        this.addNotification('HOSTILE SECTOR ENTERED — ENEMY INTERCEPT WAVES ACTIVE', 'ALERT');
      }
    }

    this.updateFleetPositions(dt);
  }

  private updateFleetPositions(dt: number) {
    const centerPoint = convoyEnvironment.getRoutePoint(this.routeProgress);
    const tangent = convoyEnvironment.getRouteTangent(this.routeProgress);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    this.convoyShips.forEach((ship) => {
      if (!ship.isAlive) return;

      if (!ship.isPlayerControlled) {
        // AI navigation follows formation offset along the route
        const targetPos = centerPoint
          .clone()
          .addScaledVector(normal, ship.targetOffset.x)
          .addScaledVector(up, ship.targetOffset.y)
          .addScaledVector(tangent, ship.targetOffset.z);

        ship.position.lerp(targetPos, Math.min(1.0, dt * 2.5));
      } else {
        // Player controlled ship maintains the player's actual position and state
        ship.position.copy(this.playerPos);
        ship.health = this.playerHealth;
        ship.shield = this.playerShield;
        ship.isAlive = this.playerHealth > 0;
        ship.isDestroyed = this.playerHealth <= 0;
      }

      if (ship.mesh) {
        ship.mesh.position.copy(ship.position);
        ship.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);
      }

      if (ship.hitFlashTimer > 0) ship.hitFlashTimer -= dt;
      if (ship.shield < ship.maxShield) {
        ship.shield = Math.min(ship.maxShield, ship.shield + 8 * dt);
      }
    });
  }

  private updateMissionEvents(dt: number) {
    if (this.currentEventIndex >= this.events.length) return;
    const curEvent = this.events[this.currentEventIndex];

    switch (curEvent.id) {
      case 'RENDEZVOUS': {
        const lead = this.convoyShips[0];
        if (lead && this.playerPos.distanceTo(lead.position) < 220) {
          this.completeCurrentEvent('ESCORT FORMATION ESTABLISHED');
        }
        break;
      }
      case 'DEBRIS_CORRIDOR': {
        if (this.routeProgress >= (curEvent.targetProgress || 0.32)) {
          this.completeCurrentEvent('DEBRIS PASSAGE CLEARED');
        }
        break;
      }
      case 'DRONE_INTERCEPT': {
        // Do not start the first combat event or emit repeated alerts before 25,000 km.
        if (this.routeProgress < HOSTILE_SECTOR_START_PROGRESS) break;
        if (this.enemyDrones.length === 0 && (curEvent.currentKills || 0) < (curEvent.targetKills || 12)) {
          this.spawnDroneWave(12, 'SCOUT');
          this.addNotification('HOSTILE DRONE SWARM DETECTED — INTERCEPT!', 'ALERT');
        }
        if ((curEvent.currentKills || 0) >= (curEvent.targetKills || 12) || this.routeProgress >= (curEvent.targetProgress || COMBAT_MIDPOINT_PROGRESS)) {
          this.completeCurrentEvent('SCOUT DRONE WAVE DESTROYED OR SECTOR TRANSIT COMPLETE');
        }
        break;
      }
      case 'AMBUSH_CROSSFIRE': {
        // The second wave begins at 30,000 km, halfway through the combat corridor.
        if (this.routeProgress < COMBAT_MIDPOINT_PROGRESS) break;
        if (this.enemyDrones.length === 0 && (curEvent.currentKills || 0) < (curEvent.targetKills || 16)) {
          this.spawnDroneWave(12, 'FIGHTER');
          this.spawnDroneWave(4, 'GUNSHIP');
          this.addNotification('WARNING: MULTI-VECTOR AMBUSH IN PROGRESS', 'ALERT');
        }
        if ((curEvent.currentKills || 0) >= (curEvent.targetKills || 16) || this.routeProgress >= (curEvent.targetProgress || HOSTILE_SECTOR_END_PROGRESS)) {
          this.completeCurrentEvent('PIRATE AMBUSH REPELLED OR HOSTILE SECTOR EXITED');
        }
        break;
      }
      case 'HULL_BREACH': {
        if (this.repairsCollectedCount >= 1 || this.routeProgress >= 0.80) {
          this.completeCurrentEvent('TRANSPORT INTEGRITY STABILIZED');
        }
        break;
      }
      case 'FINAL_APPROACH': {
        if (this.routeProgress >= (curEvent.targetProgress || 0.95)) {
          this.completeCurrentEvent('CITADEL DOME TRANSIT REACHED');
        }
        break;
      }
      case 'FINAL_DEFENSE': {
        if (this.routeProgress >= 0.98 && !this.isEscortingDome) {
          this.isEscortingDome = true;
          this.completeCurrentEvent('50,000 KM REACHED — PARKING DOME CLEARANCE GRANTED');
          this.addNotification('FINAL DESTINATION REACHED: PARKING DOME · COMMENCING DOCKING PROTOCOL', 'EVENT');
        }
        break;
      }
    }
  }

  private updateMissionStates(dt: number) {
    if (this.variant === 'SAVIOUR') {
      const curRegion = getRegionByProgress(this.routeProgress);
      const cargoAlive = this.convoyShips.filter(s => s.role === 'CARGO' && s.isAlive).length;
      const totalAlive = this.convoyShips.filter(s => s.isAlive).length;
      this.saviourMissionState.totalDistanceKm = Math.min(50000, Math.round(this.routeProgress * CONVOY_ROUTE_LENGTH_KM));
      this.saviourMissionState.currentRegionIndex = Math.max(0, curRegion.id - 1);
      this.saviourMissionState.regionDistanceKm = Math.round((this.routeProgress * CONVOY_ROUTE_LENGTH_KM) % 2000);
      this.saviourMissionState.activeFormation = this.activeFormation;
      this.saviourMissionState.activeCommand = this.activeFleetCommand;
      this.saviourMissionState.cargoShipsAlive = cargoAlive;
      this.saviourMissionState.cargoShipsTotal = 3;
      this.saviourMissionState.transportsAlive = totalAlive;
      this.saviourMissionState.transportsTotal = 9;
      this.saviourMissionState.checkpointsPassed = this.currentEventIndex;
      this.saviourMissionState.isDockingSequenceActive = this.isEscortingDome;
      this.saviourMissionState.dockingClampEngaged = convoyEscapeSequence.locksEngaged;
      this.saviourMissionState.missionCompleted = this.missionState === 'VICTORY';
      this.saviourMissionState.missionFailed = this.missionState === 'DEFEAT';
      this.saviourMissionState.timeElapsedSeconds = Math.round(this.timeElapsed);
    } else {
      const activeBoss = convoyBossDirector.activeBoss;
      const drones = this.enemyDrones.filter(d => d.role === 'DEFENSE_DRONE' || d.type === 'DEFENSE_DRONE');
      const scoutAlive = drones.some(d => d.droneClassId === 'SCOUT' && d.isAlive);
      const strikerAlive = drones.some(d => d.droneClassId === 'STRIKER' && d.isAlive);
      const wardenAlive = drones.some(d => d.droneClassId === 'WARDEN' && d.isAlive);
      const menderAlive = drones.some(d => d.droneClassId === 'MENDER' && d.isAlive);
      const jammerAlive = drones.some(d => d.droneClassId === 'JAMMER' && d.isAlive);
      const breakerAlive = drones.some(d => d.droneClassId === 'BREAKER' && d.isAlive);

      // Drone gameplay mechanics affecting the 1,000 HP boss:
      if (activeBoss && activeBoss.isAlive) {
        // Warden: provides shield regeneration; if destroyed, shields drop to 0!
        if (!wardenAlive && activeBoss.shield > 0) {
          activeBoss.shield = 0;
        }
        // Mender: repairs boss hull (+15 HP/s)
        if (menderAlive && activeBoss.health < activeBoss.maxHealth) {
          activeBoss.health = Math.min(activeBoss.maxHealth, activeBoss.health + 15 * dt);
        }
      }
      // Jammer: disrupts tactical radar
      convoyRadarService.isJammingActive = jammerAlive;

      this.huntersMissionState.bossHp = activeBoss ? Math.max(0, Math.round(activeBoss.health)) : 0;
      this.huntersMissionState.bossMaxHp = activeBoss ? activeBoss.maxHealth : 1000;
      this.huntersMissionState.bossShield = activeBoss ? Math.max(0, Math.round(activeBoss.shield)) : 0;
      this.huntersMissionState.bossMaxShield = activeBoss ? activeBoss.maxShield : 500;
      this.huntersMissionState.bossPhase = activeBoss ? activeBoss.phase : 1;
      this.huntersMissionState.bossPhaseName = activeBoss ? activeBoss.phaseName : 'PHASE 1';
      this.huntersMissionState.isBossVulnerable = activeBoss ? activeBoss.isVulnerable : false;
      this.huntersMissionState.hunterShipsAlive = this.enemyDrones.filter(d => d.role === 'MAIN_HUNTER' && d.isAlive).length;
      this.huntersMissionState.hunterShipsTotal = 10;
      this.huntersMissionState.dronesAlive = {
        scout: scoutAlive,
        striker: strikerAlive,
        warden: wardenAlive,
        mender: menderAlive,
        jammer: jammerAlive,
        breaker: breakerAlive,
      };
      this.huntersMissionState.jammerDisruptingRadar = jammerAlive;
      this.huntersMissionState.wardenShieldActive = wardenAlive;
      this.huntersMissionState.menderHealingActive = menderAlive;
      this.huntersMissionState.killCount = this.dronesDestroyedCount;
      this.huntersMissionState.missionCompleted = this.missionState === 'VICTORY';
      this.huntersMissionState.missionFailed = this.missionState === 'DEFEAT';
      this.huntersMissionState.timeElapsedSeconds = Math.round(this.timeElapsed);
    }
  }

  public saveCurrentCampaignState(isParked: boolean = false, rewardsClaimed: boolean = false) {
    if (!this.currentShipDef) return;
    ConvoyPersistenceManager.saveCampaign({
      version: 2,
      variant: this.variant,
      selectedShipId: this.currentShipDef.id,
      routeProgress: this.routeProgress,
      routeKm: Math.round(this.routeProgress * CONVOY_ROUTE_LENGTH_KM),
      currentEventIndex: this.currentEventIndex,
      completedEventIds: this.events.filter(e => e.isCompleted).map(e => e.id),
      dronesDestroyedCount: this.dronesDestroyedCount,
      debrisClearedCount: this.debrisClearedCount,
      repairsCollectedCount: this.repairsCollectedCount,
      timeElapsed: this.timeElapsed,
      transports: this.convoyShips.map(s => ({
        id: s.id,
        name: s.name,
        isAlive: s.isAlive,
        health: s.health,
        maxHealth: s.maxHealth,
        shield: s.shield,
        assignedBayIndex: s.assignedBayIndex,
        isClampedInBay: s.isClampedInBay,
      })),
      isParkedInDome: isParked || (this.isEscortingDome && convoyEscapeSequence.isComplete),
      parkingStep: convoyEscapeSequence.currentStep,
      rewardsClaimed,
      savedTimestamp: Date.now(),
      finalStats: this.finalStats,
    });
  }

  private completeCurrentEvent(msg: string) {
    const curEvent = this.events[this.currentEventIndex];
    curEvent.isCompleted = true;
    this.addNotification(`EVENT ${curEvent.eventNumber}/7 COMPLETED: ${msg}`, 'SUCCESS');
    sound.playCheckpoint();
    this.currentEventIndex = Math.min(this.events.length - 1, this.currentEventIndex + 1);
    this.saveCurrentCampaignState(false, false);
  }

  private spawnDroneWave(count: number, type: 'SCOUT' | 'FIGHTER' | 'GUNSHIP') {
    const routeKm = this.routeProgress * CONVOY_ROUTE_LENGTH_KM;
    if (this.variant !== 'SAVIOUR' || routeKm < HOSTILE_SECTOR_START_KM || routeKm > HOSTILE_SECTOR_END_KM) {
      return; // no hostile wave may spawn outside the designated 25,000–35,000 km sector
    }
    const routePt = convoyEnvironment.getRoutePoint(this.routeProgress);
    const tangent = convoyEnvironment.getRouteTangent(this.routeProgress);
    sound.playAlarmAlert();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnOffset = new THREE.Vector3(
        Math.cos(angle) * 320,
        ((i % 3) - 1) * 60,
        Math.sin(angle) * 320 - 450
      );
      const spawnPos = routePt.clone().add(spawnOffset);

      const aliveTransports = this.convoyShips.filter((s) => s.isAlive);
      const eligibleTargets = aliveTransports.filter((ship) => !ship.isPlayerControlled);
      const targetId = eligibleTargets.length > 0
        ? eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)].id
        : '';
      if (!targetId) continue; // no valid cargo target means no hostile spawn

      const mesh = this.createDroneMesh(type);
      mesh.position.copy(spawnPos);
      this.combatGroup.add(mesh);

      const health = type === 'GUNSHIP' ? 120 : type === 'FIGHTER' ? 65 : 35;
      const speed = type === 'SCOUT' ? 120 : type === 'FIGHTER' ? 95 : 70;
      const damage = type === 'GUNSHIP' ? 18 : type === 'FIGHTER' ? 10 : 6;

      this.enemyDrones.push({
        id: `drone_${Date.now()}_${Math.random()}`,
        type,
        faction: 'HUNTERS',
        health,
        maxHealth: health,
        isAlive: true,
        position: spawnPos,
        rotation: new THREE.Euler(),
        velocity: tangent.clone().multiplyScalar(speed * 0.5),
        targetId,
        attackCooldown: 1.0 + Math.random() * 1.5,
        fireRate: type === 'GUNSHIP' ? 1.5 : 0.8,
        speed,
        damage,
        mesh,
        hitFlashTimer: 0,
      });
    }
  }

  private createDroneMesh(type: EnemyDrone['type'], hexOverride?: string): THREE.Group {
    if (type === 'BOSS') {
      return ConvoyShipFactory.createModel({
        faction: 'HUNTERS',
        role: 'BOSS',
      });
    }
    const droneHex = hexOverride ? parseInt(hexOverride.replace('#', '0x'), 16) : 0xff0038;
    return ConvoyShipFactory.createModel({
      faction: 'HUNTERS',
      role: 'BOSS_GUARD_DRONE',
      customAccentHex: droneHex,
    });
  }

  private updateProjectiles(dt: number) {
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];
      p.lifetime -= dt;

      if (p.lifetime <= 0) {
        if (p.mesh) this.combatGroup.remove(p.mesh);
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      if (p.mesh) p.mesh.position.copy(p.position);

      let hit = false;

      // 1. Check Collision with Player:
      // Player is ONLY vulnerable to hostile faction projectiles. Friendly fire is strictly blocked.
      if (
        !hit &&
        this.playerHealth > 0 &&
        this.spawnProtectionTimer <= 0 &&
        p.ownerId !== 'player' &&
        areHostileFactions(p.faction, this.variant) &&
        p.position.distanceTo(this.playerPos) < 14
      ) {
        this.applyDamageToPlayer(p.damage);
        hit = true;
      }

      // 2. Check Collision with Convoy Ships:
      // Convoy ships can only be damaged by opposing faction projectiles. Friendly fire is strictly blocked.
      if (!hit) {
        for (const ship of this.convoyShips) {
          if (!ship.isAlive) continue;
          if (p.ownerId === ship.id) continue;
          if (!areHostileFactions(p.faction, ship.faction)) continue; // Friendly fire blocked!

          if (p.position.distanceTo(ship.position) < 22 + p.radius) {
            this.applyDamageToConvoyShip(ship, p.damage);
            hit = true;
            break;
          }
        }
      }

      // 3. Check Collision with Enemy / Allied Drones & Fighters:
      // Drones can only be damaged by opposing faction projectiles.
      if (!hit) {
        for (let dIdx = 0; dIdx < this.enemyDrones.length; dIdx++) {
          const drone = this.enemyDrones[dIdx];
          if (!drone.isAlive) continue;
          if (p.ownerId === drone.id) continue;
          if (!areHostileFactions(p.faction, drone.faction)) continue; // Friendly fire blocked!

          const hitRadius = (drone.role === 'BOSS' ? 28 : drone.role === 'DEFENSE_DRONE' ? 9 : 12) + p.radius;
          if (p.position.distanceTo(drone.position) < hitRadius) {
            const amp = this.damageAmpTargets.get(drone.id) || 1.0;
            const appliedDamage = p.damage * amp;
            drone.health -= appliedDamage;
            sound.playShieldHit();
            hit = true;

            if (drone.health <= 0) {
              drone.isAlive = false;
              if (drone.mesh) this.combatGroup.remove(drone.mesh);
              this.dronesDestroyedCount++;
              sound.playMissileExplosion();

              if (drone.droneClassId) {
                if (drone.droneClassId === 'WARDEN') {
                  this.addNotification('WARDEN DESTROYED — BOSS SHIELD COLLAPSED!', 'SUCCESS');
                  if (convoyBossDirector.activeBoss) convoyBossDirector.activeBoss.shield = 0;
                } else if (drone.droneClassId === 'MENDER') {
                  this.addNotification('MENDER DESTROYED — HULL REPAIR HALTED!', 'SUCCESS');
                } else if (drone.droneClassId === 'JAMMER') {
                  this.addNotification('JAMMER DESTROYED — RADAR INTERFERENCE CLEARED!', 'SUCCESS');
                  convoyRadarService.isJammingActive = false;
                } else if (drone.droneClassId === 'BREAKER') {
                  this.addNotification('BREAKER DESTROYED — BOSS CANNON POWER DAMPENED!', 'SUCCESS');
                } else if (drone.droneClassId === 'STRIKER') {
                  this.addNotification('STRIKER DESTROYED — MISSILE BARRAGE INTERRUPTED!', 'SUCCESS');
                } else if (drone.droneClassId === 'SCOUT') {
                  this.addNotification('SCOUT DESTROYED — BOSS TARGETING DELAYED!', 'SUCCESS');
                }
              }

              const curEvent = this.events[this.currentEventIndex];
              if (curEvent && curEvent.targetKills !== undefined) {
                curEvent.currentKills = (curEvent.currentKills || 0) + 1;
              }
            }
            break;
          }
        }
      }

      // 4. Check Collision with Active Major Boss / Subnodes:
      if (!hit && convoyBossDirector.activeBoss && convoyBossDirector.activeBoss.isAlive) {
        if (areHostileFactions(p.faction, 'HUNTERS')) {
          const bossHit = convoyBossDirector.applyDamage(p.damage, p.position);
          if (bossHit) {
            hit = true;
            if (bossHit.defeated) {
              this.addNotification(`TARGET DESTROYED: ${bossHit.hitTarget.toUpperCase()}`, 'SUCCESS');
              this.dronesDestroyedCount += 8;
            }
          }
        }
      }

      if (hit) {
        if (p.mesh) this.combatGroup.remove(p.mesh);
        this.projectiles.splice(pIdx, 1);
      }
    }
  }

  private applyDamageToConvoyShip(ship: ConvoyShipState, amount: number) {
    if (this.spawnProtectionTimer > 0) return;
    if (ship.isPlayerControlled) {
      this.applyDamageToPlayer(amount);
      return;
    }
    if (ship.hitFlashTimer > 0) return; // Flash cooldown prevents rapid multi-hit frame drain
    ship.hitFlashTimer = 0.25;

    if (ship.shield > 0) {
      if (ship.shield >= amount) {
        ship.shield -= amount;
        amount = 0;
        sound.playShieldDeflect();
      } else {
        amount -= ship.shield;
        ship.shield = 0;
        sound.playShieldDeflect();
      }
    }

    if (amount > 0) {
      ship.health = Math.max(0, ship.health - amount);
      sound.playHeavyImpact();
    }

    const pct = (ship.health / ship.maxHealth) * 100;
    if (ship.health <= 0) {
      ship.isAlive = false;
      ship.isDestroyed = true;
      ship.status = 'DESTROYED';
      this.addNotification(`${ship.name} DESTROYED!`, 'ALERT');
      sound.playCrash();
    } else if (pct < 30) {
      ship.status = 'CRITICAL';
    } else if (pct < 70) {
      ship.status = 'DAMAGED';
    } else {
      ship.status = 'NOMINAL';
    }
  }

  private applyDamageToPlayer(amount: number) {
    if (this.spawnProtectionTimer > 0) return;
    if (this.variant === 'SAVIOUR') amount *= 0.7;
    if (this.backupShieldTime > 0) amount *= 0.5;
    if (this.isShielding) amount *= 0.2;

    if (this.playerShield > 0) {
      if (this.playerShield >= amount) {
        this.playerShield -= amount;
        amount = 0;
        sound.playShieldHit();
      } else {
        amount -= this.playerShield;
        this.playerShield = 0;
        sound.playShieldHit();
      }
    }

    if (amount > 0) {
      this.playerHealth = Math.max(0, this.playerHealth - amount);
      sound.playHeavyImpact();
    }
  }

  private checkVictoryDefeat() {
    // Guard against evaluations while initialization is in progress
    if (!this.isActive || !this.isInitialized || this.missionState !== 'ACTIVE') return;

    if (this.playerHealth <= 0) {
      this.triggerDefeat('PLAYER VESSEL DESTROYED IN COMBAT');
      return;
    }

    const isHunter = this.variant === 'HUNTERS' || (this.variant as string) === 'HUNTER';

    if (isHunter) {
      const activeBoss = convoyBossDirector.activeBoss;
      if (activeBoss && !activeBoss.isAlive) {
        this.triggerVictory();
        return;
      }
      const remainingTargetCargo = this.convoyShips.filter(s => s.isAlive && s.faction === 'SAVIOUR');
      if (this.timeElapsed > 1.5 && remainingTargetCargo.length === 0) {
        this.triggerVictory();
        return;
      }
    } else {
      // SAVIOUR MODE VALIDATION:
      // Never declare defeat if convoy fleet is not fully spawned or empty during setup
      if (this.convoyShips.length < 9) return;

      // Only check fleet destruction once the mission is actively underway (> 1.5s)
      if (this.timeElapsed > 1.5) {
        const lead = this.convoyShips.find(s => s.isLead) || this.convoyShips[0];
        const aliveTransports = this.convoyShips.filter((s) => s.isAlive);

        if (lead && !lead.isAlive) {
          this.triggerDefeat('CONVOY LEAD FLAGSHIP DESTROYED — MISSION COMPROMISED');
          return;
        }

        if (this.convoyShips.length > 0 && aliveTransports.length === 0) {
          this.triggerDefeat('ENTIRE CONVOY FLEET LOST');
          return;
        }
      }
    }
  }

  private triggerVictory() {
    this.missionState = 'VICTORY';
    sound.playFinish();

    const isHunter = this.variant === 'HUNTERS' || (this.variant as string) === 'HUNTER';
    const survivors = this.convoyShips.filter((s) => s.isAlive).length;
    const integrity = this.convoyShips.length > 0 ? Math.round(
      (this.convoyShips.reduce((acc, s) => acc + (s.isAlive ? s.health / s.maxHealth : 0), 0) / this.convoyShips.length) * 100
    ) : 0;

    this.finalStats = {
      victory: true,
      reason: isHunter
        ? 'TARGET CONVOY SUCCESSFULLY INTERCEPTED AND NEUTRALIZED'
        : '50,000 KM CAMPAIGN ACCOMPLISHED — CONVOY SAFELY PARKED IN MULTI-LEVEL DOME',
      transportsSaved: isHunter ? (this.convoyShips.length - survivors) : survivors,
      transportsTotal: this.convoyShips.length,
      convoyFinalIntegrity: isHunter ? 100 : integrity,
      dronesDestroyed: this.dronesDestroyedCount,
      debrisCleared: this.debrisClearedCount,
      repairsCollected: this.repairsCollectedCount,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      creditsEarned: 4500 + (isHunter ? 2500 : survivors * 1200) + this.dronesDestroyedCount * 150,
      xpEarned: 1500 + survivors * 400,
    };

    this.saveCurrentCampaignState(true, true);
  }

  public activateEMP() {
    this.triggerAbilityById('emp_burst');
  }

  private triggerDefeat(reason: string) {
    this.missionState = 'DEFEAT';
    sound.playCrash();

    const survivors = this.convoyShips.filter((s) => s.isAlive).length;
    this.finalStats = {
      victory: false,
      reason,
      transportsSaved: survivors,
      transportsTotal: this.convoyShips.length,
      convoyFinalIntegrity: 0,
      dronesDestroyed: this.dronesDestroyedCount,
      debrisCleared: this.debrisClearedCount,
      repairsCollected: this.repairsCollectedCount,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      creditsEarned: 800 + this.dronesDestroyedCount * 100,
      xpEarned: 400,
    };
  }

  // =========================================================================
  // PUBLIC CONTROLS & HUD TELEMETRY API
  // =========================================================================
  public setJoystickInput(steerX: number, pitchY: number) {
    this.joystickSteerX = Math.max(-1, Math.min(1, steerX));
    this.joystickPitchY = Math.max(-1, Math.min(1, pitchY));
  }

  public setFireState(firing: boolean) {
    this.isTouchFiring = firing;
  }

  public setBoostState(boosting: boolean) {
    this.isTouchBoosting = boosting;
  }

  public setShieldState(shielding: boolean) {
    this.isTouchShielding = shielding;
    this.isShielding = shielding;
  }

  public toggleEngine(): boolean {
    this.isEngineOn = !this.isEngineOn;
    this.addNotification(this.isEngineOn ? 'ENGINE ONLINE [STATION KEEPING ARMED]' : 'ENGINE OFFLINE [THRUSTERS DISENGAGED]', 'EVENT');
    return this.isEngineOn;
  }

  public setEngineEnabled(enabled: boolean) {
    this.isEngineOn = enabled;
  }

  public setDirectionalThrust(input: Partial<DirectionalThrustState>) {
    this.directionalThrust = {
      ...this.directionalThrust,
      ...input,
    };
  }

  public cycleCameraPerspective() {
    this.cameraPerspective = ((this.cameraPerspective + 1) % 4) as 0 | 1 | 2 | 3;
    const labels = ['CHASE', 'CLOSE', 'WIDE', 'COCKPIT'];
    this.notifications.unshift({
      id: `camera-${Date.now()}`,
      text: `CAMERA: ${labels[this.cameraPerspective]} VIEW`,
      type: 'EVENT',
      timestamp: this.timeElapsed,
    });
    this.notifications = this.notifications.slice(0, 5);
  }

  public zoomCameraIn() {
    this.cameraZoom = Math.max(0.55, Math.round((this.cameraZoom - 0.15) * 100) / 100);
    this.addNotification(`CAMERA ZOOM: ${Math.round((1 / this.cameraZoom) * 100)}%`, 'EVENT');
  }

  public zoomCameraOut() {
    this.cameraZoom = Math.min(1.75, Math.round((this.cameraZoom + 0.15) * 100) / 100);
    this.addNotification(`CAMERA ZOOM: ${Math.round((1 / this.cameraZoom) * 100)}%`, 'EVENT');
  }

  public setRadarZoom(zoom: number) {
    this.radarZoom = Math.max(0.5, Math.min(3.0, zoom));
  }

  public toggleRadarExpanded() {
    this.isRadarExpanded = !this.isRadarExpanded;
  }

  public selectTacticalTarget(contactId: string) {
    this.lockedTargetId = contactId;
    sound.playTargetLock();
  }

  public engagePlayerParkingLock(): boolean {
    const success = convoyEscapeSequence.engagePlayerLock();
    if (success) {
      this.addNotification('PARKING LOCKS ENGAGED · HYDRAULIC CLAMPS SECURED', 'SUCCESS');
    } else {
      this.addNotification('PARKING LOCK FAILED: ALIGN WITHIN BAY 01 AND SLOW DOWN (< 25 m/s)', 'WARNING');
    }
    return success;
  }

  public toggleAssistedParking(): boolean {
    const active = convoyEscapeSequence.toggleAssistedParking();
    this.addNotification(active ? 'ASSISTED DOCKING GUIDANCE: [ONLINE]' : 'ASSISTED DOCKING GUIDANCE: [OFF]', 'EVENT');
    return active;
  }

  public repositionPlayerParking(): void {
    convoyEscapeSequence.repositionPlayerToBay(this.playerPos, this.playerVel);
    this.addNotification('SAFETY REPOSITION: SHIP RESET OVER BAY 01 APPROACH', 'WARNING');
  }

  public setConvoyFormation(formation: ConvoyFormationPreset) {
    this.activeFormation = formation;
    this.recalculateFormationOffsets();
    this.addNotification(`FORMATION ENGAGED: ${formation.replace(/_/g, ' ')}`, 'EVENT');
    sound.playCheckpoint();
  }

  public cycleFormation() {
    const formations: ConvoyFormationPreset[] = [
      'V_FORMATION',
      'LINE_FORMATION',
      'DIAMOND_FORMATION',
      'DEFENSIVE_FORMATION',
      'DISPERSED_FORMATION',
    ];
    const currentIndex = formations.indexOf(this.activeFormation);
    const nextFormation = formations[(currentIndex + 1) % formations.length];
    this.setConvoyFormation(nextFormation);
  }

  public issueConvoyCommand(command: ConvoyFleetCommand) {
    this.activeFleetCommand = command;
    this.addNotification(`FLEET ORDER: ${command.replace(/_/g, ' ')}`, 'ALERT');
    sound.playTargetLock();
    if (command === 'SPREAD_OUT') {
      this.setConvoyFormation('DISPERSED_FORMATION');
    } else if (command === 'REGROUP') {
      this.setConvoyFormation('DEFENSIVE_FORMATION');
    } else if (command === 'RETURN_TO_ORIGIN') {
      this.travelDirection = 'RETURN';
      this.isEscortingDome = false;
      this.missionState = 'ACTIVE';
      convoyEscapeSequence.undockFleet((t, ty) => this.addNotification(t, ty));
      this.addNotification('RETURN TRANSIT ORDERED — HEADING TO ORIGIN PARKING DOME (0 KM)', 'SUCCESS');
    } else if (command === 'FREE_ROAM') {
      this.isEscortingDome = false;
      this.missionState = 'ACTIVE';
      convoyEscapeSequence.releasePlayerLocks();
      this.addNotification('FREE ROAM MODE ACTIVE — UNCONSTRAINED 75,000 KM CORRIDOR', 'EVENT');
    }
  }

  public undockFleet() {
    this.travelDirection = 'RETURN';
    this.isEscortingDome = false;
    this.missionState = 'ACTIVE';
    convoyEscapeSequence.undockFleet((text, type) => this.addNotification(text, type));
  }

  public cycleFleetCommand() {
    const commands: ConvoyFleetCommand[] = [
      'FOLLOW',
      'REGROUP',
      'DEFEND',
      'SPREAD_OUT',
      'HOLD_POSITION',
      'FREE_ROAM',
      'RETURN_TO_ORIGIN',
    ];
    const currentIndex = commands.indexOf(this.activeFleetCommand);
    const nextCommand = commands[(currentIndex + 1) % commands.length];
    this.issueConvoyCommand(nextCommand);
  }

  public recalculateFormationOffsets() {
    this.convoyShips.forEach((ship, index) => {
      if (ship.isLead) {
        ship.targetOffset.set(0, 0, -85);
        return;
      }
      const side = index % 2 === 1 ? -1 : 1;
      const rank = Math.ceil(index / 2);

      switch (this.activeFormation) {
        case 'V_FORMATION':
          ship.targetOffset.set(side * rank * 32, (rank % 2 === 0 ? 10 : -8), -85 + rank * 45);
          break;
        case 'LINE_FORMATION':
          ship.targetOffset.set(0, (index % 2 === 0 ? 6 : -6), -85 + index * 42);
          break;
        case 'DIAMOND_FORMATION':
          if (rank === 1) ship.targetOffset.set(side * 36, 12, -45);
          else if (rank === 2) ship.targetOffset.set(side * 22, -10, -5);
          else if (rank === 3) ship.targetOffset.set(side * 44, 8, 40);
          else ship.targetOffset.set(0, 0, 85);
          break;
        case 'DEFENSIVE_FORMATION':
          ship.targetOffset.set(side * 22, (rank % 2 === 0 ? 12 : -12), -85 + rank * 24);
          break;
        case 'DISPERSED_FORMATION':
          ship.targetOffset.set(side * rank * 55, ((index % 3) - 1) * 25, -85 + rank * 38);
          break;
      }
    });
  }

  public handleKeyDown(code: string) {
    this.keysDown[code] = true;
    if (code === 'Digit1') this.triggerAbility(0);
    if (code === 'Digit2') this.triggerAbility(1);
    if (code === 'Digit3') this.triggerAbility(2);
    if (code === 'Digit4') this.triggerAbility(3);
    if (code === 'Digit5') this.triggerAbility(4);
    if (code === 'Digit6') this.cycleFormation();
    if (code === 'Digit7') this.cycleFleetCommand();
    if (code === 'KeyT') this.toggleEngine();
    if (code === 'KeyL' || code === 'KeyP') this.engagePlayerParkingLock();
    if (code === 'KeyH') this.toggleAssistedParking();
    if (code === 'KeyR') this.repositionPlayerParking();
    if (code === 'KeyU' || code === 'KeyX') this.triggerEmergencyEscapeDrill();
  }

  public triggerEmergencyEscapeDrill() {
    convoyEscapeSequence.triggerEmergencyEscape('TERMINAL_EMERGENCY_DRILL');
    this.addNotification('EMERGENCY ESCAPE DRILL ACTIVATED · CLAMPS RELEASED · PROCEED TO GATE 05', 'ALERT');
  }

  public handleKeyUp(code: string) {
    this.keysDown[code] = false;
  }

  public addNotification(text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') {
    this.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
    });
    if (this.notifications.length > 5) this.notifications.pop();
  }

  public getTelemetry(): ConvoyTelemetry {
    const curEvent = this.events[this.currentEventIndex] || this.events[0];
    const aliveCount = this.convoyShips.filter((s) => s.isAlive).length;
    const lead = this.convoyShips[0];

    const integrityPct =
      this.convoyShips.length > 0
        ? Math.round(
            (this.convoyShips.reduce((acc, s) => acc + (s.isAlive ? s.health / s.maxHealth : 0), 0) /
              this.convoyShips.length) *
              100
          )
        : 0;

    const distRemaining = Math.round((1.0 - this.routeProgress) * convoyEnvironment.routeLengthKm * 1000);

    // Compute tactical radar contacts via shared detection service
    const hazardsList = convoyEnvironment.routeHazards.map(h => ({
      id: h.id,
      kind: h.kind,
      position: h.position,
      radius: h.radius,
    }));
    const nextCheckpoint = convoyEnvironment.checkpointMeshes.length > 0
      ? convoyEnvironment.checkpointMeshes[Math.min(convoyEnvironment.checkpointMeshes.length - 1, this.currentEventIndex + 1)].position
      : null;
    const parkingDomePos = convoyEnvironment.getParkingPosition(4);

    const radarContacts = convoyRadarService.updateContacts(
      this.playerPos,
      this.playerRot,
      this.variant,
      this.convoyShips,
      this.enemyDrones,
      hazardsList,
      nextCheckpoint,
      parkingDomePos,
      this.timeElapsed,
      this.stealthEntities
    );

    // Target lock resolution
    let lockedTarget: any = undefined;
    if (this.lockedTargetId) {
      const drone = this.enemyDrones.find(d => d.id === this.lockedTargetId && d.isAlive);
      const ship = this.convoyShips.find(s => s.id === this.lockedTargetId && s.isAlive);
      if (drone) {
        lockedTarget = {
          id: drone.id,
          name: drone.role === 'BOSS' ? 'DREADNOUGHT X (BOSS)' : 'HOSTILE DRONE',
          health: Math.round(drone.health),
          maxHealth: drone.maxHealth,
          distance: Math.round(this.playerPos.distanceTo(drone.position)),
        };
      } else if (ship) {
        lockedTarget = {
          id: ship.id,
          name: ship.name,
          health: Math.round(ship.health),
          maxHealth: ship.maxHealth,
          distance: Math.round(this.playerPos.distanceTo(ship.position)),
        };
      }
    }

    const boss = this.enemyDrones.find((e) => e.role === 'BOSS');
    const currentKm = Math.round(this.routeProgress * CONVOY_ROUTE_LENGTH_KM);
    const currentRegion = getRegionByProgress(this.routeProgress);
    const regionLocalKm = Math.round(currentKm % 1500);

    return {
      variant: this.variant,
      bossHealth: boss && boss.isAlive ? Math.max(0, Math.round(boss.health)) : 0,
      bossMaxHealth: boss?.maxHealth || 1000,
      defensiveDronesAlive: this.enemyDrones.filter((e) => e.role === 'DEFENSE_DRONE' && e.isAlive).length,
      hunterEnemiesAlive: this.enemyDrones.filter((e) => e.isAlive).length,
      isActive: this.isActive,
      isPaused: this.isPaused,
      missionState: this.missionState,
      currentEventIndex: this.currentEventIndex + 1,
      totalEvents: this.events.length,
      currentEvent: curEvent,
      routeProgressPercent: Math.round(this.routeProgress * 100),
      distanceToDestinationMeters: distRemaining,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      currentRouteKm: currentKm,
      totalRouteKm: CONVOY_ROUTE_LENGTH_KM,
      maxCampaignKm: Math.round(this.maxProgressKm),
      roundTripKm: Math.round(this.roundTripDistanceKm * 10) / 10,
      travelDirection: this.travelDirection,
      locationIndex: currentRegion.id,
      locationName: currentRegion.name,
      returnClearance: this.travelDirection === 'RETURN' || convoyEscapeSequence.currentStep === 'RETURN_TRANSIT',
      isAtOriginDome: convoyEnvironment.isPositionInsideDome(this.playerPos) && Math.abs(this.playerPos.z) < 500,
      isAtCelestialCrown: convoyEnvironment.isPositionInsideDome(this.playerPos) && this.playerPos.z <= -37000,
      convoyIntegrityPercent: integrityPct,
      leadTransportHealthPercent: lead ? Math.round((lead.health / lead.maxHealth) * 100) : 0,
      transportsAliveCount: aliveCount,
      transportsTotalCount: this.convoyShips.length,
      transports: this.convoyShips.map((s) => ({
        id: s.id,
        name: s.name,
        isLead: s.isLead,
        role: s.role,
        health: Math.round(s.health),
        maxHealth: s.maxHealth,
        healthPercent: Math.round((s.health / s.maxHealth) * 100),
        status: s.status,
        distanceToPlayer: Math.round(this.playerPos.distanceTo(s.position)),
        isPlayerControlled: s.isPlayerControlled,
      })),
      activeHostileCount: this.enemyDrones.filter((d) => d.isAlive).length,
      lockedTarget,
      playerShipId: this.currentShipDef.id,
      playerShipName: this.currentShipDef.name,
      playerRoleTitle: this.currentShipDef.roleTitle,
      playerFaction: this.variant,
      playerHealth: Math.round(this.playerHealth),
      playerMaxHealth: this.playerMaxHealth,
      playerShield: Math.round(this.playerShield),
      playerMaxShield: this.playerMaxShield,
      playerBoost: Math.round(this.playerBoostCharge),
      playerSpeedKmh: Math.round(this.playerVel.length() * 1.8),
      isFiring: this.isTouchFiring,
      isEngineOn: this.isEngineOn,
      directionalThrust: this.directionalThrust,
      playerAbilities: this.playerAbilities,
      radarContacts,
      radarZoom: this.radarZoom,
      isRadarExpanded: this.isRadarExpanded,
      isJammingActive: convoyRadarService.isJammingActive,
      escapeState: convoyEscapeSequence.getStateData(),
      notifications: this.notifications,
      finalStats: this.finalStats,

      // 100-Region / 200,000 KM Open-World Telemetry
      regionName: currentRegion.name,
      regionNumber: currentRegion.id,
      totalRegions: 100,
      regionLocalKm,
      maxRouteKmReached: Math.round(this.maxProgressKm),
      cumulativeTravelKm: Math.round(this.roundTripDistanceKm * 10) / 10,
      oneWayCampaignComplete: this.maxProgressKm >= 200000,
      boundaryWarning: (() => {
        const c = convoyAdaptiveRoute.checkBoundaryContainment(this.playerPos);
        return {
          active: c.isWarning || c.isViolated,
          distanceToEdge: Math.round(c.distanceToEdge),
          lateralOffset: Math.round(c.lateralOffset),
          warningText: c.warningText,
        };
      })(),
      activeFormation: this.activeFormation,
      activeFleetCommand: this.activeFleetCommand,
      backupTelemetry: this.getBackupTelemetry(),
      bossTelemetry: convoyBossDirector.getTelemetry(),
      terminalTelemetry: convoyChamberGates.getTerminalTelemetry(),
    };
  }

  public selectBackupDivision(division: ConvoyDivisionId) {
    this.selectedBackupDivision = division;
  }

  public getBackupTelemetry() {
    const auth = checkBackupEligibility(this.variant, this.currentShipDef.id, this.currentShipDef.roleTitle, this.currentShipDef.id === 'saviour_aegis');
    const active = this.activeBackupShip;
    return {
      eligible: auth.eligible,
      leaderTitle: auth.leaderTitle,
      reason: auth.reason,
      selectedDivision: this.selectedBackupDivision,
      cooldowns: { ...this.divisionCooldowns },
      active: active ? { division: active.division, name: active.name, statusText: active.statusText, timeRemaining: active.timeRemaining, totalDuration: active.totalDuration, targetName: active.targetName } : null,
    };
  }

  public callBackup(division: ConvoyDivisionId = this.selectedBackupDivision): boolean {
    if (!this.isActive || this.missionState !== 'ACTIVE' || this.activeBackupShip) return false;
    const auth = checkBackupEligibility(this.variant, this.currentShipDef.id, this.currentShipDef.roleTitle, this.currentShipDef.id === 'saviour_aegis');
    if (!auth.eligible) { this.addNotification(auth.reason, 'WARNING'); return false; }
    if (this.divisionCooldowns[division] > 0) { this.addNotification(`${division} BACKUP RECHARGING: ${Math.ceil(this.divisionCooldowns[division])}s`, 'WARNING'); return false; }
    const def = CONVOY_DIVISIONS[division];
    const mesh = createProceduralShipMesh(this.currentShipDef.id, { primaryColorHex: def.primaryColor, accentColorHex: def.accentColor, engineColorHex: def.emissiveColor, glowIntensity: 1.4 });
    mesh.scale.setScalar(0.52);
    mesh.position.copy(this.playerPos).add(new THREE.Vector3(-34, 12, 22));
    this.combatGroup.add(mesh);
    this.activeBackupShip = {
      id: `backup_${division}_${Math.floor(this.timeElapsed * 1000)}`, name: `${division} ${def.name}`, division, faction: this.variant,
      actionRole: def.actionRole, statusText: def.actionLabel, timeRemaining: def.durationSeconds, totalDuration: def.durationSeconds,
      position: mesh.position.clone(), velocity: new THREE.Vector3(), mesh, laserCooldown: 0, isAlive: true,
    };
    this.divisionCooldowns[division] = def.cooldownSeconds;
    this.applyBackupDivisionEffect(division);
    this.addNotification(`${def.code} REINFORCEMENT DEPLOYED — ${def.actionLabel}`, 'SUCCESS');
    return true;
  }

  private applyBackupDivisionEffect(division: ConvoyDivisionId) {
    const def = CONVOY_DIVISIONS[division];
    if (division === 'D5') {
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 300);
      this.backupShieldTime = def.durationSeconds;
      const ring = new THREE.Mesh(new THREE.SphereGeometry(34, 18, 12), new THREE.MeshBasicMaterial({ color: def.accentColor, wireframe: true, transparent: true, opacity: 0.35 }));
      ring.name = 'convoy_backup_shield';
      this.combatGroup.add(ring);
      if (this.activeBackupShip) this.activeBackupShip.shieldMesh = ring;
      this.addNotification('D5 DEFLECTOR ACTIVE — SHIELDS RECHARGED', 'SUCCESS');
    } else if (division === 'D4') {
      convoyRadarService.clear();
      this.backupReconTime = def.durationSeconds;
      this.addNotification('D4 RECON PULSE — ROUTE HAZARDS SCANNED; SAFE APPROACH MARKED', 'SUCCESS');
    } else if (division === 'D3') {
      const candidates = convoyEnvironment.asteroids.filter(a => a.health > 0 && a.position.distanceTo(this.playerPos) < 900).sort((a,b) => a.position.distanceTo(this.playerPos)-b.position.distanceTo(this.playerPos)).slice(0, 6);
      candidates.forEach(a => { a.health = 0; if (a.mesh) convoyEnvironment.group.remove(a.mesh); });
      this.debrisClearedCount += candidates.length;
      this.addNotification(`D3 ASTEROID STRIKE — ${candidates.length} debris targets destroyed`, 'SUCCESS');
    } else if (division === 'D2') {
      const targets = convoyEnvironment.routeHazards.filter(h => h.active && h.position.distanceTo(this.playerPos) < 1200).sort((a,b) => a.position.distanceTo(this.playerPos)-b.position.distanceTo(this.playerPos)).slice(0, 2);
      targets.forEach(h => { h.active = false; h.mesh.visible = false; });
      this.addNotification(`D2 HAZARD DISRUPTOR — ${targets.length} major hazards neutralized`, 'SUCCESS');
    } else {
      const target = this.enemyDrones.filter(e => e.isAlive && areHostileFactions(this.variant, e.faction)).sort((a,b) => a.position.distanceTo(this.playerPos)-b.position.distanceTo(this.playerPos))[0];
      if (target) {
        target.health = Math.max(0, target.health - Math.max(250, target.maxHealth * 0.45));
        if (target.health <= 0) { target.isAlive = false; this.dronesDestroyedCount++; }
        this.activeBackupShip!.targetId = target.id;
        this.activeBackupShip!.targetName = target.role === 'BOSS' ? 'DREADNOUGHT BOSS' : 'HOSTILE SHIP';
        this.addNotification(`D1 CELESTIAL STRIKE — ${this.activeBackupShip!.targetName} locked and hit`, 'SUCCESS');
      } else this.addNotification('D1 CELESTIAL STRIKE — no hostile target in range', 'SUCCESS');
    }
  }

  private updateBackupShip(dt: number) {
    const backup = this.activeBackupShip;
    if (!backup) return;
    backup.timeRemaining = Math.max(0, backup.timeRemaining - dt);
    const targetPos = this.playerPos.clone().add(new THREE.Vector3(-34, 12, 22));
    backup.position.lerp(targetPos, Math.min(1, dt * 2.8));
    if (backup.mesh) backup.mesh.position.copy(backup.position);
    if (backup.shieldMesh) {
      backup.shieldMesh.position.copy(this.playerPos);
      backup.shieldMesh.rotation.y += dt * 0.4;
      (backup.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(this.timeElapsed * 5) * 0.08;
    }
    if (backup.timeRemaining <= 0) {
      if (backup.mesh) this.combatGroup.remove(backup.mesh);
      if (backup.shieldMesh) this.combatGroup.remove(backup.shieldMesh);
      this.addNotification(`${backup.name} reinforcement has returned to formation`, 'SUCCESS');
      this.activeBackupShip = null;
    }
  }

  public cleanUp() {
    this.isActive = false;
    this.isInitialized = false;
    this.isPaused = false;
    this.missionState = 'DISPOSED';
    this.combatGroup.clear();
    this.convoyShips = [];
    this.enemyDrones = [];
    this.projectiles = [];
    this.notifications = [];
    this.finalStats = null;
    this.timeElapsed = 0;
    convoyBossDirector.cleanUp();
    this.lastSpawnedBossRegionId = -1;
    this.routeProgress = 0.0;
    this.playerHealth = 1000;
    this.playerShield = 350;
    this.spawnProtectionTimer = 0;
    this.barrierHitCooldown = 0;
    this.routeHazardHitCooldown = 0;
    this.convoyWeaponsCooldown = 0;
    this.dronesDestroyedCount = 0;
    this.debrisClearedCount = 0;
    this.repairsCollectedCount = 0;
    this.keysDown = {};
    this.isTouchFiring = false;
    this.isTouchBoosting = false;
    this.isTouchShielding = false;
    this.isShielding = false;
    this.isEngineOn = false;
    this.directionalThrust = {
      up: false,
      down: false,
      left: false,
      right: false,
      forward: false,
      backward: false,
    };
    this.stealthEntities.clear();
    this.damageAmpTargets.clear();
    this.activeBarriers = [];
    if (this.activeBackupShip?.mesh) this.combatGroup.remove(this.activeBackupShip.mesh);
    this.activeBackupShip = null;
    this.backupShieldTime = 0;
    this.backupReconTime = 0;
    this.divisionCooldowns = { D5: 0, D4: 0, D3: 0, D2: 0, D1: 0 };
    convoyEnvironment.cleanUp();
    convoyEscapeSequence.reset();
    convoyRadarService.clear();
  }

  // Visual helper meshes
  private createEscortMesh(primaryHex: number, accentHex: number): THREE.Group {
    const group = new THREE.Group();
    const length = 38;
    const width = 18;
    const bodyGeo = new THREE.ConeGeometry(width * 0.6, length, 5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.85,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    for (let side = -1; side <= 1; side += 2) {
      const wingGeo = new THREE.BoxGeometry(width * 0.65, 2, length * 0.5);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.9,
        roughness: 0.25,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * (width * 0.55), 0, length * 0.1);
      group.add(wing);
    }

    const flameGeo = new THREE.ConeGeometry(3, 16, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.85 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(0, 0, length * 0.5 + 8);
    group.add(flame);

    return group;
  }

  private createTransportMesh(isLead: boolean, primaryHex: number, accentHex: number): THREE.Group {
    const group = new THREE.Group();
    const length = isLead ? 68 : 52;
    const width = isLead ? 30 : 24;
    const height = isLead ? 22 : 18;

    const hullGeo = new THREE.BoxGeometry(width, height, length);
    const hullMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.85,
      roughness: 0.35,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    for (let i = 0; i < (isLead ? 4 : 3); i++) {
      const pylonGeo = new THREE.TorusGeometry(width * 0.55, 2.5, 8, 24);
      const pylonMat = new THREE.MeshBasicMaterial({ color: accentHex });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(0, 0, -length * 0.35 + i * (length * 0.24));
      group.add(pylon);
    }

    for (let side = -1; side <= 1; side += 2) {
      const flameGeo = new THREE.ConeGeometry(isLead ? 5 : 4, 24, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.9 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side * (width * 0.35), 0, length * 0.55 + 10);
      group.add(flame);
    }

    return group;
  }
}

export const convoyDirector = new ConvoyDirector();
