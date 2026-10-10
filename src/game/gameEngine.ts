import * as THREE from 'three';
import { CosmicTrack, defaultTrack, EnergyBarrier } from './trackData';
import {
  createShipMesh,
  getShipConfig,
  getEffectiveShipStats,
  THRUSTER_FLAME_CONFIGS,
  COCKPIT_SKIN_CONFIGS,
} from './ships';
import { sound } from './audio';
import { networkClient } from '../network/client';
import {
  ActivePowerUp,
  DynamicTrackEvent,
  PlayerInfo,
  PlayerInput,
  PlayerRaceState,
  PowerUpType,
  RunStats,
  ShipDecalType,
  ShipUpgrades,
  ThrusterFlameColor,
  CockpitSkin,
  TrackId,
  AIDifficulty,
  AIPersonality,
  CameraMode,
  GraphicsQuality,
  AIRaceConfig,
  ShipDamageZones,
  DamageMode,
  BeamCustomization,
  BeamUpgrades,
  BeamTelemetry,
  GameMode,
} from '../types';
import { BeamSystem, DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from './beamSystem';
import {
  BlackHoleManager,
  SingularityTelemetry,
  SupermassiveBlackHoleVisuals,
  PlanetaryCollisionVisuals,
  TrackDestructionVisuals,
  HolographicWarningSystem,
} from './blackHoleSystem';
import {
  FinalCollapseManager,
  EvacuationTelemetry,
  ShipImpactForces,
} from './FinalCollapseManager';
import { DynamicCollapseEnvironmentsManager } from './environment/dynamicCollapseEnvironments';
import type { CosmicPairLiveTelemetry } from './catastrophe/cosmicEventPairVisualizer';
import { CosmicEnvironmentDirector, CosmicBiomeDefinition, CosmicBiomeId } from './environment/cosmicEnvironmentDirector';
import { QuantumCountdownClock, QuantumCountdownTelemetry } from './environment/quantumCountdownClock';
import { QuantumRouteSystem } from './environment/quantumRouteSystem';
import { FuturisticSpaceUniverse } from './environment/futuristicSpaceUniverse';
import { ModeEnvironmentManager } from './environment/modeEnvironmentManager';
import { ModeManager, ModeHUDTelemetry } from './modeManager';
import { ModeEntitySystem } from './modeEntitySystem';
import { Obstacle, SamplePoint } from './trackData';
import {
  JunctionManager,
  ActiveJunctionTelemetry,
  BranchRouteConfig,
  BranchRouteDirection,
  PlayerRouteProgress,
} from './junctionSystem';
import {
  PlayerCollisionSystem,
  PLAYER_COLLISION_CONFIG,
  PlayerCollisionConfig,
  CollisionParticipant,
  CollisionEventFeedback,
} from './collisionSystem';
import { MissileManager, MissileTargetCandidate } from './missileSystem';
import { ActiveShieldManager } from './shieldSystem';
import { MinimapManager } from './minimapSystem';
import { HazardManager } from './hazardManager';
import { GameDifficulty, getDifficultyProfile } from './modeConfigs';
import { ExtendedPathManager } from './extendedPath/extendedPathManager';
import { ActiveCinematicState, ExtendedPathTelemetry } from './extendedPath/extendedPathTypes';
import { championshipManager } from './championshipManager';
import {
  AIRacingIntelligenceSystem,
  AIRacerTacticalState,
  AIRacerCombatState,
  normalizeAIDifficulty,
  normalizeAIPersonality,
} from './aiRacingSystem';
import {
  MissileTelemetry,
  ActiveShieldTelemetry,
  MinimapTelemetry,
  MinimapBranchPoint,
  MinimapMarker,
  AIDebugTelemetry,
} from '../types';
import { RaceIntroManager } from './cinematicIntro/raceIntroManager';
import { IntroHUDTelemetry } from './cinematicIntro/cinematicTypes';
import { FinishCinematicManager, FinishCinematicTelemetry } from './fullRouteCinematic/finishCinematicManager';
import { BlackHoleCinematicManager, BlackHoleCinematicTelemetry, FinalCollapseAuthoritativeState } from './blackHoleCinematicManager';
import { BlackHoleEventCinematicDirector } from './blackHoleEventCinematicDirector';
import { BLACK_HOLE_SUBMODES } from './blackHoleSubmodes';
import { getFinalCollapseEventByNumber } from './finalCollapse/finalCollapse100EventsCatalog';
import { getMasterEventByNumber } from './finalCollapse/finalCollapseMaster100Timeline';

export interface LocalAIRacer {
  id: string;
  name: string;
  shipId: string;
  color: string;
  secondaryColor: string;
  group: THREE.Group;
  nameplateSprite: THREE.Sprite;
  thrusters: THREE.Mesh[];
  progressDistance: number;
  currentLap: number;
  t: number;
  speed: number;
  targetSpeed: number;
  currentLateral: number;
  targetLateral: number;
  lateralSpeed: number;
  isBoosting: boolean;
  boostCooldown: number;
  boostDuration: number;
  difficulty: AIDifficulty;
  personality: AIPersonality;
  rank: number;
  isDestroyed?: boolean;
  respawnTimer?: number;
  activeRouteId?: string | null;
  activeJunctionId?: string | null;
  branchProgress?: number;
  shield?: number;
  hull?: number;
  mass?: number;
  radius?: number;
  collisionCooldown?: number;
  recoveryTimer?: number;
  angularVelocity?: number;
  angularDisplacement?: number;
  invulnerableTimer?: number;
  tactical?: AIRacerTacticalState;
  combat?: AIRacerCombatState;
}

export interface GameEngineCallbacks {
  onSpeedUpdate: (speedKmH: number) => void;
  onBoostUpdate: (boostPercent: number) => void;
  onLapUpdate: (currentLap: number, totalLaps: number) => void;
  onCheckpointUpdate: (current: number, total: number) => void;
  onRankUpdate: (rank: number, totalPlayers: number) => void;
  onRaceFinish: (finalTime: number) => void;
  onTrackEventUpdate?: (event: DynamicTrackEvent | null) => void;
  onHazardHit?: (hazardName: string) => void;
  onShortcutUsed?: (shortcutName: string) => void;
  onPowerUpCollected?: (type: PowerUpType) => void;
  onPowerUpsUpdate?: (powerups: ActivePowerUp[]) => void;
  onCreditCollected?: (totalSessionCredits: number, added: number) => void;
  onHullUpdate?: (hullPercent: number) => void;
  onDistanceUpdate?: (distanceMeters: number) => void;
  onMilestoneReached?: (milestone: string) => void;
  onGameOver?: (stats: RunStats) => void;
  onWrongWayUpdate?: (isWrongWay: boolean) => void;
  onShipDestroyed?: (reason: string, respawnSec: number) => void;
  onShipRespawned?: () => void;
  onLapTimesUpdate?: (currentLapMs: number, bestLapMs: number) => void;
  onCameraModeChange?: (mode: CameraMode) => void;
  onDamageZonesUpdate?: (zones: ShipDamageZones) => void;
  onSpectatorTargetChange?: (pilotName: string) => void;
  onBeamTelemetry?: (telemetry: BeamTelemetry) => void;
  onAsteroidDestroyed?: (obstacle: Obstacle, points: number, credits: number) => void;
  onJunctionTelemetry?: (telemetry: ActiveJunctionTelemetry | null) => void;
  onRouteSelected?: (routeName: string, direction: BranchRouteDirection) => void;
  onCollisionFeedback?: (feedback: CollisionEventFeedback) => void;
  onModeTelemetry?: (telemetry: ModeHUDTelemetry) => void;
  onSingularityTelemetry?: (telemetry: SingularityTelemetry) => void;
  onMissileTelemetry?: (telemetry: MissileTelemetry) => void;
  onActiveShieldTelemetry?: (telemetry: ActiveShieldTelemetry) => void;
  onMinimapTelemetry?: (telemetry: MinimapTelemetry) => void;
  onAIDebugTelemetry?: (telemetry: AIDebugTelemetry) => void;
  onIntroTelemetry?: (telemetry: IntroHUDTelemetry | null) => void;
  onCinematicStateUpdate?: (state: ActiveCinematicState) => void;
  onPathTelemetryUpdate?: (telemetry: ExtendedPathTelemetry) => void;
  onCountdownTick?: (count: number) => void;
  onEngineReady?: () => void;
  onFinishCinematicTelemetry?: (telemetry: FinishCinematicTelemetry | null) => void;
  onBlackHoleCinematicTelemetry?: (telemetry: BlackHoleCinematicTelemetry | null) => void;
  onCosmicPairTelemetry?: (telemetry: CosmicPairLiveTelemetry | null) => void;
  onQuantumCountdownUpdate?: (telemetry: QuantumCountdownTelemetry | null) => void;
  onCosmicBiomeUpdate?: (biome: CosmicBiomeDefinition) => void;
  onActiveRouteBranchUpdate?: (routeName: string) => void;
  onCoreTemperatureUpdate?: (tempCelsius: number) => void;
}

// Preallocated math objects for zero-allocation GC-free render loop
const _shipRotMatrix = new THREE.Matrix4();
const _shipNegTangent = new THREE.Vector3();
const _shipPos = new THREE.Vector3();
const _shipOffsetBinormal = new THREE.Vector3();
const _shipOffsetNormal = new THREE.Vector3();
const _botRotMatrix = new THREE.Matrix4();
const _botNegTangent = new THREE.Vector3();
const _botPos = new THREE.Vector3();
const _botOffsetBinormal = new THREE.Vector3();
const _botOffsetNormal = new THREE.Vector3();
const _aiVel = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number = 0;
  private isContextLost: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  // Dedicated Player-to-Player & AI Spacecraft Collision System
  public collisionSystem: PlayerCollisionSystem;
  private collisionFovPunch: number = 0;
  private playerCollisionAngularVelocity: number = 0;
  private playerCollisionAngularDisplacement: number = 0;
  private playerCollisionRecoveryTimer: number = 0;

  // Branching Path & Junction Switching System
  public junctionManager: JunctionManager;

  // Combat & Navigation Subsystems
  public missileManager: MissileManager;
  public activeShieldManager: ActiveShieldManager;
  public minimapManager: MinimapManager;
  public hazardManager: HazardManager;
  public activeDifficulty: GameDifficulty = 'NORMAL';

  // Asteroid Destruction Beam System
  public beamSystem: BeamSystem;
  public localBeamCustomization: BeamCustomization = { ...DEFAULT_BEAM_CUSTOMIZATION };
  public localBeamUpgrades: BeamUpgrades = { ...DEFAULT_BEAM_UPGRADES };

  public trackId: TrackId = 'circuit_alpha';
  public track: CosmicTrack = new CosmicTrack('circuit_alpha');

  // Visual Assets
  private trackMeshGroup: THREE.Group = new THREE.Group();
  private checkpointMeshes: THREE.Group[] = [];
  private boostPadMeshes: THREE.Mesh[] = [];

  // Instanced Obstacle Pooling
  private asteroidInstancedMesh: THREE.InstancedMesh | null = null;
  private asteroidPoolSize: number = 64;
  private dummyObj: THREE.Object3D = new THREE.Object3D();

  private shortcutPortalGroup: THREE.Group | null = null;
  private starParticles: THREE.Points | null = null;
  private speedParticles: THREE.Points | null = null;

  // Celestial Deep-Space Environment
  private giantPlanetMesh: THREE.Mesh | null = null;
  private planetRingsMesh: THREE.Mesh | null = null;
  private wormholeAccretionGroup: THREE.Group | null = null;
  private spaceStationGroup: THREE.Group | null = null;
  private energyBarrierMeshes: THREE.Group[] = [];

  // Local AI Competitor Grid
  public localAIRacers: LocalAIRacer[] = [];
  public isAIRaceActive: boolean = false;
  public aiDifficulty: AIDifficulty = 'NORMAL';
  public aiRacingSystem: AIRacingIntelligenceSystem;
  public raceIntroManager: RaceIntroManager;
  public finishCinematicManager: FinishCinematicManager;

  // Collectibles & Power-Ups
  private creditsInstancedMesh: THREE.InstancedMesh | null = null;
  private creditsDummy: THREE.Object3D = new THREE.Object3D();
  private powerUpPodGroups: THREE.Group[] = [];
  private shieldMeshGroup: THREE.Group | null = null;

  // Dual Thruster Particle Trails
  private thrusterTrailsPoints: THREE.Points | null = null;
  private thrusterParticles: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private thrusterPositionsArray: Float32Array | null = null;
  private thrusterColorsArray: Float32Array | null = null;

  // Collision Shatter / Explosion Sparks
  private collisionSparksPoints: THREE.Points | null = null;
  private collisionSparks: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; color: THREE.Color }[] = [];
  private sparkPositionsArray: Float32Array | null = null;
  private sparkColorsArray: Float32Array | null = null;

  // Local Player Customization & Upgrades
  public localShipId: string = 'apex_phantom';
  public localColor: string = '#00f0ff';
  public localSecondaryColor: string = '#ff00e5';
  public localDecal: ShipDecalType = 'none';
  public localThrusterColor: ThrusterFlameColor = 'neon_cyan';
  public localCockpitSkin: CockpitSkin = 'cyber_stealth';
  public localUpgrades: ShipUpgrades = {
    engine: 0,
    handling: 0,
    boost: 0,
    chassis: 0,
    shieldDuration: 0,
    magnetRange: 0,
    hyperBoostSpeed: 0,
  };
  private playerShipGroup: THREE.Group | null = null;
  private playerThrusters: THREE.Mesh[] = [];

  // Local Physics & Movement
  public input: PlayerInput = { throttle: 0, steer: 0, boost: false, drift: false, recover: false };
  private splineT: number = 0;
  private prevSplineT: number = 0;
  private lateralOffset: number = 0;
  private currentSpeed: number = 0;
  private boostEnergy: number = 100;
  private isBoosting: boolean = false;
  private isDrifting: boolean = false;
  private shipRoll: number = 0;
  private cameraRoll: number = 0;

  // 20 Unique Game Modes & Black Hole System
  public activeGameMode: GameMode = 'NEON_CIRCUIT';
  public modeManager: ModeManager = new ModeManager('NEON_CIRCUIT');
  public blackHoleManager: BlackHoleManager | null = null;
  public blackHoleCinematicManager: BlackHoleCinematicManager | null = null;
  public blackHoleEventCinematicDirector = new BlackHoleEventCinematicDirector();
  // Physical/state controller for Mode 21 / Submode 10. It is driven by the
  // cinematic event sequence below; it does not replace the existing 20 modes.
  public finalCollapseManager: FinalCollapseManager;
  // Mode 21 / Submode 10 catastrophe state. Kept local to GameEngine so the
  // 00:00 event can activate the physical evacuation junction without
  // changing the other Black Hole submodes.
  private finalCollapseCatastropheActive = false;
  private finalCollapseShelterEntered = false;
  private finalCollapseEscapeRouteEntered = false;
  private finalCollapseWormholeRouteEntered = false;
  /** Terminal branch lock: keeps Route 02/03 physically at their real endpoint instead of falling back to the main spline. */
  private finalCollapseTerminalRouteId: string | null = null;
  private finalCollapseTerminalPoint: THREE.Vector3 | null = null;
  private finalCollapseTerminalTangent: THREE.Vector3 | null = null;
  private finalCollapseTerminalSequenceElapsed = 0;
  private finalCollapseTerminalSequenceComplete = false;
  private finalCollapseEscapeSequenceGroup: THREE.Group | null = null;
  private finalCollapseEscapeSequenceRoute: string | null = null;
  private finalCollapseRaceFinishSent = false;
  public finalCollapseAuthoritativeState: FinalCollapseAuthoritativeState = 'NORMAL_GAMEPLAY';
  public finalCollapse00Triggered = false;
  public finalCollapseEndingStarted = false;
  public finalCollapseResultsShown = false;
  public finalCollapsePlayerEscaped = false;
  public finalCollapseEscapedRouteId: string | null = null;
  public finalCollapseControlsLocked = false;
  public finalCollapsePreviousCountdown = 900;
  public finalCollapseEscapeEndingActive = false;
  public finalCollapseEscapeEndingElapsed = 0;

  public setFinalCollapseAuthoritativeState(state: FinalCollapseAuthoritativeState): void {
    this.finalCollapseAuthoritativeState = state;
    this.blackHoleCinematicManager?.setAuthoritativeState(state);
  }
  private finalCollapseLastEvent = 'NONE';
  private finalCollapseEntryReady = false;
  private finalCollapseDescending = false;
  private finalCollapseRing2Passed = false;
  private finalCollapseRing3Passed = false;
  private finalCollapseHangarEntered = false;
  private finalCollapseParkingAligned = false;
  private finalCollapseShipParked = false;
  private finalCollapseShipSecured = false;
  private finalCollapseHangarSealed = false;
  private finalCollapseAftermathStarted = false;
  private finalCollapseClampStep = 0;
  private lastSubmode10EventIndex = 0;
  private shelterNavigationActive = false;
  private shelterX = 0;
  private shelterZ = 15;
  private shelterY = 0;
  private shelterHeading = 0;
  private shelterClampTimer = 0;
  private finalCollapseMissilesUsed = 0;
  private finalCollapseShieldsUsed = 0;
  private finalCollapseDistanceTraveledM = 0;
  private finalCollapseCheckpointsReached = 0;
  public supermassiveBlackHole: SupermassiveBlackHoleVisuals | null = null;
  public planetaryCollision: PlanetaryCollisionVisuals | null = null;
  public trackDestruction: TrackDestructionVisuals | null = null;
  public holographicWarnings: HolographicWarningSystem | null = null;
  public collapseEnvironments: DynamicCollapseEnvironmentsManager | null = null;
  public environmentDirector: CosmicEnvironmentDirector | null = null;
  public quantumCountdownClock: QuantumCountdownClock | null = null;
  public quantumRouteSystem: QuantumRouteSystem | null = null;
  public futuristicSpaceUniverse: FuturisticSpaceUniverse | null = null;
  public modeEnvironmentManager!: ModeEnvironmentManager;
  public mainDirLight: THREE.DirectionalLight | null = null;
  public mainAmbientLight: THREE.AmbientLight | null = null;
  public lastActiveRouteName: string = 'MAIN HIGHWAY';
  private finalCollapseDoorAudioPlayed = false;
  private finalCollapseDoorSealedAudioPlayed = false;
  private finalCollapseCollisionAudioPlayed = false;
  private finalCollapseInitialSignsSpawned = false;
  private destructionFrontDistanceAccumulator = 2500;
  public modeEntitySystem: ModeEntitySystem | null = null;
  public extendedPathManager!: ExtendedPathManager;

  private currentLap: number = 1;
  private totalLaps: number = 2;
  private nextCheckpointIdx: number = 0;
  private hasFinished: boolean = false;
  public finishLineCooldownTimer: number = 0;
  public wormholeCooldownTimer: number = 0;
  public raceStartTime: number = 0;
  public totalDistanceTraveled: number = 0;
  public checkpointsPassed: number = 0;
  public boostCount: number = 0;
  public shieldHits: number = 0;
  public isRacing: boolean = false;
  public isPaused: boolean = false;
  public totalTimeElapsed: number = 0;

  // Destruction & Respawn System
  public isDestroyed: boolean = false;
  private respawnTimer: number = 0;
  private invulnerableTimer: number = 0;
  private latestValidCheckpoint: { idx: number; t: number; pos: THREE.Vector3 } = { idx: 0, t: 0, pos: new THREE.Vector3() };
  private checkpointsPassedThisLap: Set<number> = new Set();

  // Wrong-Way Navigation Detection
  public isWrongWay: boolean = false;
  private wrongWayTimer: number = 0;

  // Drift Charge & Mini-Turbo Mechanics
  private driftChargeTime: number = 0;

  // Camera System Modes & Settings
  public cameraMode: CameraMode = 'CHASE_NEAR';
  public cameraShakeEnabled: boolean = true;

  // Lap Timing Telemetry
  private lapStartTime: number = 0;
  private currentLapTime: number = 0;
  private bestLapTime: number = 0;

  // Run Progression, Economy & Health
  public sessionCredits: number = 0;
  public hullHealth: number = 100;
  public shipCoreTemperature: number = 320; // Nominal core operating temp in Celsius
  private hitCount: number = 0;
  private maxSpeedReached: number = 0;
  private reachedMilestones: Set<number> = new Set();

  // Active Power-Ups State
  private phaseShieldTimer: number = 0;
  private phaseShieldTotal: number = 6.0;
  private creditMagnetTimer: number = 0;
  private creditMagnetTotal: number = 8.0;
  private hyperBoostTimer: number = 0;
  private hyperBoostTotal: number = 4.5;
  private nitroBoostTimer: number = 0;
  private nitroBoostTotal: number = 3.5;
  private empPulseTimer: number = 0;
  private timeWarpTimer: number = 0;
  private gravityBurstTimer: number = 0;
  private decoyTimer: number = 0;
  private speedSurgeTimer: number = 0;
  private activePowerUpsList: ActivePowerUp[] = [];

  // Advanced Damage System
  public damageZones: ShipDamageZones = {
    frontHull: 0,
    rearEngine: 0,
    leftWing: 0,
    rightWing: 0,
    shieldCore: 100,
  };
  public damageMode: DamageMode = 'CASUAL';
  public collisionsEnabled: boolean = true;
  public powerUpsEnabled: boolean = true;
  public isSpectator: boolean = false;
  public spectatorTargetIndex: number = 0;
  public spectatorTargetName: string = '';

  // Decoy & EMP Visual Objects
  private decoyGroup: THREE.Group | null = null;
  private empWaveMesh: THREE.Mesh | null = null;

  // Dynamic Events tracking
  private lastActiveEventId: string | null = null;
  private collisionCooldown: number = 0;

  // Remote players meshes
  private remoteShips: Map<
    string,
    { group: THREE.Group; targetPos: THREE.Vector3; targetQuat: THREE.Quaternion; thrusters: THREE.Mesh[] }
  > = new Map();

  // Camera Shake & FX
  private cameraShake: number = 0;
  private targetFov: number = 65;

  // Callbacks
  private callbacks: GameEngineCallbacks;
  private clock: THREE.Clock;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Safe initial dimensions
    const initialWidth = Math.max(1, this.container.clientWidth || window.innerWidth || 1280);
    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight || 720);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.0012);
    this.camera = new THREE.PerspectiveCamera(
      65,
      initialWidth / initialHeight,
      0.5,
      4000
    );
    this.camera.position.set(0, 15, 30);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(initialWidth, initialHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // Fluid canvas styling ensuring full viewport coverage
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.container.appendChild(this.renderer.domElement);

    // WebGL Context Safety Handlers
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isContextLost = true;
      console.warn('[VOID-RIDER Engine] WebGL Context Lost. Pausing render loop safely.');
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false;
      console.log('[VOID-RIDER Engine] WebGL Context Restored. Resuming render loop.');
    }, false);

    // Build World
    this.initLighting();
    this.initSkyboxAndStars();
    this.modeEnvironmentManager = new ModeEnvironmentManager(this.scene);
    this.modeEnvironmentManager.loadEnvironment(this.activeGameMode, this.track?.curve || null, this.trackId);
    this.initSpeedParticles();
    this.initThrusterParticles();
    this.initCollisionSparkParticles();
    this.buildTrackGeometry();
    this.buildCheckpoints();
    this.buildBoostPads();
    this.buildEnergyBarriers();
    this.buildAsteroidField();
    this.buildShortcutPortal();
    this.buildCreditsField();
    this.buildPowerUpPods();

    // Initialize Branching Path & Junction Switching System
    this.junctionManager = new JunctionManager(this.trackId, this.track);
    this.scene.add(this.junctionManager.junctionMeshGroup);

    // Initialize Asteroid Destruction Beam System
    this.beamSystem = new BeamSystem(
      this.localBeamCustomization,
      this.localBeamUpgrades,
      'STANDARD'
    );
    this.scene.add(this.beamSystem.containerGroup);

    // Initialize Dedicated Player-to-Player & AI Spacecraft Collision System
    this.collisionSystem = new PlayerCollisionSystem(this.scene);
    this.collisionSystem.onCollisionFeedback = feedback => {
      this.callbacks.onCollisionFeedback?.(feedback);
    };
    this.collisionSystem.onCameraShakeRequest = intensity => {
      if (this.cameraShakeEnabled) {
        this.cameraShake = Math.max(this.cameraShake, intensity);
      }
    };
    this.collisionSystem.onCameraFovPunch = degrees => {
      this.collisionFovPunch = Math.max(this.collisionFovPunch, degrees);
    };
    this.collisionSystem.onSoundTrigger = sndType => {
      if (sndType === 'HEAVY_IMPACT') {
        sound.playHeavyImpact();
      } else if (sndType === 'SHIELD_IMPACT') {
        sound.playShieldImpact();
      } else if (sndType === 'SCRAPE') {
        sound.playScrapeSparks();
      } else {
        sound.playCollision();
      }
    };

    // Initialize Missile Weapon System (all 20 modes)
    this.missileManager = new MissileManager(this.scene, this.camera, {
      onCameraShake: (intensity) => {
        if (this.cameraShakeEnabled) {
          this.cameraShake = Math.max(this.cameraShake, intensity);
        }
      },
      onFovPulse: (degrees) => {
        this.collisionFovPunch = Math.max(this.collisionFovPunch, degrees);
      },
      onImpactFeedback: (title, detail) => {
        this.callbacks.onCollisionFeedback?.({
          id: `missile_${Date.now()}`,
          type: 'IMPACT',
          title,
          detail,
          impactForce: 65,
          timestamp: Date.now(),
        });
      },
    });

    // Initialize Active Shield System (60s cooldown)
    this.activeShieldManager = new ActiveShieldManager();

    // Initialize Interactive Real-Time Track Minimap System
    this.minimapManager = new MinimapManager();
    if (this.track) {
      this.minimapManager.initTrack(this.track.curve, this.track.checkpoints, this.track.id || 'SECTOR ALPHA');
    }

    // Initialize reusable Black Hole cinematic/event manager
    this.blackHoleCinematicManager = new BlackHoleCinematicManager({
      scene: this.scene,
      blackHoleCenter: new THREE.Vector3(0, -40, 0),
      finalCountdownSeconds: 900,
    });

    // Mode 21 / Submode 10 physical catastrophe controller.
    // The cinematic manager remains the event/timing authority; this manager
    // supplies the physical catastrophe phase and shelter state.
    this.finalCollapseManager = new FinalCollapseManager();
    this.finalCollapseManager.start();
    this.finalCollapseManager.escapeMissions.initialize(this.scene);

    // Initialize Extended Procedural Path & Streaming Manager
    this.extendedPathManager = new ExtendedPathManager(this.scene);
    this.extendedPathManager.setMode(this.activeGameMode);

    // Initialize Dynamic Hazard & Difficulty System
    this.hazardManager = new HazardManager(this.scene);
    if (this.track) {
      this.hazardManager.initForMode(this.activeGameMode, this.activeDifficulty, this.track.curve);
    }

    // Initialize Advanced AI Racing Intelligence System
    this.aiRacingSystem = new AIRacingIntelligenceSystem(this.track, this.scene);

    // Initialize Cinematic Introduction System for All 20 Modes
    this.raceIntroManager = new RaceIntroManager(
      this.activeGameMode,
      this.track,
      this.camera,
      this.scene,
      {
        onCountdownTick: count => {
          this.callbacks.onCountdownTick?.(count);
        },
        onRaceStart: () => {
          this.startRace();
          this.currentSpeed = 100;
          this.input.throttle = 1;
          this.prevSplineT = this.splineT;
          this.updateShipTransform(0);
          sound.startEngine();
          sound.startCosmicMusic();
        },
        onTelemetryUpdate: telem => {
          this.callbacks.onIntroTelemetry?.(telem);
        },
        onIntroComplete: () => {
          this.raceIntroManager.cleanup();
          this.callbacks.onIntroTelemetry?.(null);
          if (!this.isRacing) {
            this.startRace();
          }
        },
      }
    );

    // Initialize 20-Mode Unique Real-Time Finish Cinematic System
    this.finishCinematicManager = new FinishCinematicManager(this.camera, this.scene, {
      onTelemetryUpdate: telem => {
        this.callbacks.onFinishCinematicTelemetry?.(telem);
      },
      onComplete: () => {
        const now = Date.now();
        const finalTime = Math.max(1000, now - this.raceStartTime);
        this.callbacks.onRaceFinish(finalTime);
      },
    });
    this.finishCinematicManager.setMode(this.activeGameMode);

    // Prewarm Shaders & Compile Scene Ahead of Time for Stutter-Free Start
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch (_) {}

    // Resize Handlers (Window & ResizeObserver)
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Start Render Loop
    this.clock = new THREE.Clock();
    this.loop();

    // Notify ready
    requestAnimationFrame(() => {
      this.callbacks.onEngineReady?.();
    });
  }

  private initLighting() {
    this.mainAmbientLight = new THREE.AmbientLight(0x1a1a3a, 1.2);
    this.scene.add(this.mainAmbientLight);

    this.mainDirLight = new THREE.DirectionalLight(0x88bbff, 2.0);
    this.mainDirLight.position.set(100, 300, 200);
    this.scene.add(this.mainDirLight);

    const purpleLight = new THREE.DirectionalLight(0xcc22ff, 1.5);
    purpleLight.position.set(-200, -100, -300);
    this.scene.add(purpleLight);

    // Initialize Dynamic Cosmic Environment Director
    this.environmentDirector = new CosmicEnvironmentDirector(
      this.scene,
      this.mainDirLight,
      this.mainAmbientLight
    );

    // Initialize Quantum Countdown Clock & In-World 3D Holographic Spatial Circular Clocks
    this.quantumCountdownClock = new QuantumCountdownClock(900, 0);
    this.quantumCountdownClock.setPaused(true);
    this.quantumCountdownClock.gantryMeshGroup.visible = false;
    this.scene.add(this.quantumCountdownClock.gantryMeshGroup);
  }

  private initSkyboxAndStars() {
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#00f0ff'),
      new THREE.Color('#d000ff'),
      new THREE.Color('#ffaa00'),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 1200 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    this.starParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starParticles);
  }

  private initCelestialBodies() {
    const planetGeo = new THREE.SphereGeometry(340, 48, 48);
    const planetCanvas = document.createElement('canvas');
    planetCanvas.width = 512;
    planetCanvas.height = 256;
    const pCtx = planetCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, '#041026');
      grad.addColorStop(0.15, '#0b284c');
      grad.addColorStop(0.3, '#00d0ff');
      grad.addColorStop(0.45, '#1e0c4a');
      grad.addColorStop(0.65, '#c026d3');
      grad.addColorStop(0.82, '#181438');
      grad.addColorStop(1.0, '#070a16');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 512, 256);

      pCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      pCtx.fillRect(0, 50, 512, 16);
      pCtx.fillRect(0, 115, 512, 26);
      pCtx.fillRect(0, 175, 512, 12);
      pCtx.fillStyle = 'rgba(0, 240, 255, 0.22)';
      pCtx.fillRect(0, 135, 512, 10);
    }
    const planetTex = new THREE.CanvasTexture(planetCanvas);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x002244,
      emissiveIntensity: 0.4,
    });
    this.giantPlanetMesh = new THREE.Mesh(planetGeo, planetMat);
    this.giantPlanetMesh.position.set(140, 360, -1700);
    this.scene.add(this.giantPlanetMesh);

    const ringGeo = new THREE.RingGeometry(400, 720, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.planetRingsMesh = new THREE.Mesh(ringGeo, ringMat);
    this.planetRingsMesh.position.copy(this.giantPlanetMesh.position);
    this.planetRingsMesh.rotation.x = Math.PI / 2 + 0.38;
    this.planetRingsMesh.rotation.y = 0.22;
    this.scene.add(this.planetRingsMesh);

    this.wormholeAccretionGroup = new THREE.Group();
    const torusOuter = new THREE.Mesh(
      new THREE.TorusGeometry(85, 4.0, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xcc00ff, wireframe: true, transparent: true, opacity: 0.9 })
    );
    const torusInner = new THREE.Mesh(
      new THREE.TorusGeometry(120, 2.5, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.8 })
    );
    const accretionDiskGeo = new THREE.RingGeometry(35, 105, 48);
    const accretionDiskMat = new THREE.MeshBasicMaterial({
      color: 0xbf00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const accretionDisk = new THREE.Mesh(accretionDiskGeo, accretionDiskMat);
    accretionDisk.name = 'accretion_disk';
    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(38, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x01010a })
    );
    this.wormholeAccretionGroup.add(torusOuter, torusInner, accretionDisk, coreSphere);
    this.wormholeAccretionGroup.position.set(520, 320, -1200);
    this.scene.add(this.wormholeAccretionGroup);

    this.spaceStationGroup = new THREE.Group();
    const spireGeo = new THREE.CylinderGeometry(6, 12, 220, 24);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    this.spaceStationGroup.add(spire);

    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2;
      const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 210, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 3.0,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(Math.cos(angle) * 7.5, 0, Math.sin(angle) * 7.5);
      this.spaceStationGroup.add(col);
    }

    const ringRadii = [28, 42, 22];
    const ringHeights = [-40, 15, 65];
    ringRadii.forEach((r, idx) => {
      const deckGeo = new THREE.TorusGeometry(r, 2.5, 12, 36);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00b4d8,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.rotation.x = Math.PI / 2;
      deck.position.y = ringHeights[idx];
      this.spaceStationGroup?.add(deck);

      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2;
        const spokeGeo = new THREE.CylinderGeometry(0.8, 0.8, r, 8);
        const spokeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.y = a;
        spoke.position.set((Math.cos(a) * r) / 2, ringHeights[idx], (Math.sin(a) * r) / 2);
        this.spaceStationGroup?.add(spoke);
      }
    });

    const beaconGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 4.0,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 115;
    this.spaceStationGroup.add(beacon);

    this.spaceStationGroup.position.set(220, 110, -640);
    this.spaceStationGroup.scale.set(1.4, 1.4, 1.4);
    this.scene.add(this.spaceStationGroup);
  }

  private updateCelestialBodies(dt: number) {
    if (this.giantPlanetMesh) {
      this.giantPlanetMesh.rotation.y += 0.0004;
    }
    if (this.planetRingsMesh) {
      this.planetRingsMesh.rotation.z += 0.0006;
    }
    if (this.wormholeAccretionGroup) {
      this.wormholeAccretionGroup.children[0].rotation.z += 0.015;
      this.wormholeAccretionGroup.children[1].rotation.z -= 0.009;
      if (this.wormholeAccretionGroup.children[2]) {
        this.wormholeAccretionGroup.children[2].rotation.z += 0.02;
      }
      const s = 1.0 + Math.sin(Date.now() * 0.002) * 0.05;
      this.wormholeAccretionGroup.children[3]?.scale.set(s, s, s);
    }
    if (this.spaceStationGroup) {
      this.spaceStationGroup.rotation.y += 0.0018;
    }
  }

  private initSpeedParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 60;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 1.2,
      transparent: true,
      opacity: 0.5,
    });
    this.speedParticles = new THREE.Points(geo, mat);
    this.scene.add(this.speedParticles);
  }

  private initThrusterParticles() {
    const maxParticles = 120;
    this.thrusterParticles = [];
    this.thrusterPositionsArray = new Float32Array(maxParticles * 3);
    this.thrusterColorsArray = new Float32Array(maxParticles * 3);

    for (let i = 0; i < maxParticles; i++) {
      this.thrusterParticles.push({
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.45,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.thrusterPositionsArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.thrusterColorsArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.thrusterTrailsPoints = new THREE.Points(geo, mat);
    this.scene.add(this.thrusterTrailsPoints);
  }

  private initCollisionSparkParticles() {
    const maxSparks = 100;
    this.collisionSparks = [];
    this.sparkPositionsArray = new Float32Array(maxSparks * 3);
    this.sparkColorsArray = new Float32Array(maxSparks * 3);

    for (let i = 0; i < maxSparks; i++) {
      this.collisionSparks.push({
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.8,
        color: new THREE.Color(0xff0055),
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositionsArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.sparkColorsArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.collisionSparksPoints = new THREE.Points(geo, mat);
    this.scene.add(this.collisionSparksPoints);
  }

  public triggerCollisionBurst(pos: THREE.Vector3, colorHex: number | string = 0xff0055, count: number = 32) {
    if (!this.sparkPositionsArray) return;
    const burstColor = new THREE.Color(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.collisionSparks.length && spawned < count; i++) {
      const spark = this.collisionSparks[i];
      if (spark.life <= 0) {
        spark.pos.copy(pos);
        spark.color.copy(burstColor);
        spark.maxLife = 0.4 + Math.random() * 0.45;
        spark.life = spark.maxLife;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 14 + Math.random() * 22;
        spark.vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        spawned++;
      }
    }
  }

  private buildTrackGeometry() {
    const allSamples = this.track.samples;
    // Submode 10 is a single-start fork, not a loop with a hidden third
    // continuation.  Stop rendering the shared track exactly at the fork so
    // only Route 01 and Route 02 continue beyond it.  Other modes retain the
    // original closed-track rendering.
    const isFinalCollapse =
      this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
    const forkT = 0.80;
    const cutoffIndex = isFinalCollapse
      ? Math.max(2, Math.floor((allSamples.length - 1) * forkT))
      : allSamples.length - 1;
    const samples = isFinalCollapse ? allSamples.slice(0, cutoffIndex + 1) : allSamples;
    const count = samples.length;
    const halfW = this.track.width / 2;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      const left = s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW));
      const right = s.point.clone().add(s.binormal.clone().multiplyScalar(halfW));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const v = (i / (count - 1)) * 40;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < count - 1) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row2, row1 + 1);
        indices.push(row1 + 1, row2, row2 + 1);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: this.trackId === 'nebula_rift' ? 0x080c1e : 0x0a0c16,
      roughness: 0.25,
      metalness: 0.8,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.trackMeshGroup.add(roadMesh);

    const leftRailPoints: THREE.Vector3[] = [];
    const rightRailPoints: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      leftRailPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW)).add(new THREE.Vector3(0, 0.4, 0))
      );
      rightRailPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(halfW)).add(new THREE.Vector3(0, 0.4, 0))
      );
    }

    const leftRailCurve = new THREE.CatmullRomCurve3(leftRailPoints, !isFinalCollapse);
    const rightRailCurve = new THREE.CatmullRomCurve3(rightRailPoints, !isFinalCollapse);

    const railGeoLeft = new THREE.TubeGeometry(leftRailCurve, 320, 0.35, 8, true);
    const railGeoRight = new THREE.TubeGeometry(rightRailCurve, 320, 0.35, 8, true);

    const leftRailMat = isFinalCollapse
      ? new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: 3.5,
          roughness: 0.1,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 2.8,
          roughness: 0.1,
        });

    const rightRailMat = isFinalCollapse
      ? new THREE.MeshStandardMaterial({
          color: 0xff5500,
          emissive: 0xff3300,
          emissiveIntensity: 3.5,
          roughness: 0.1,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 2.8,
          roughness: 0.1,
        });

    const railLeftMesh = new THREE.Mesh(railGeoLeft, leftRailMat);
    const railRightMesh = new THREE.Mesh(railGeoRight, rightRailMat);
    this.trackMeshGroup.add(railLeftMesh, railRightMesh);

    const leftLanePoints: THREE.Vector3[] = [];
    const rightLanePoints: THREE.Vector3[] = [];
    const centerPoints: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      centerPoints.push(s.point.clone().add(new THREE.Vector3(0, 0.08, 0)));
      leftLanePoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(-4.6)).add(new THREE.Vector3(0, 0.08, 0))
      );
      rightLanePoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(4.6)).add(new THREE.Vector3(0, 0.08, 0))
      );
    }

    const centerCurve = new THREE.CatmullRomCurve3(centerPoints, !isFinalCollapse);
    const centerRail = new THREE.Mesh(
      new THREE.TubeGeometry(centerCurve, 260, 0.18, 6, true),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );

    const leftLaneCurve = new THREE.CatmullRomCurve3(leftLanePoints, !isFinalCollapse);
    const rightLaneCurve = new THREE.CatmullRomCurve3(rightLanePoints, !isFinalCollapse);

    const laneMarkerMat = new THREE.MeshStandardMaterial({
      color: 0xff00aa,
      emissive: 0xff00aa,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    const leftLaneRail = new THREE.Mesh(
      new THREE.TubeGeometry(leftLaneCurve, 260, 0.14, 6, true),
      laneMarkerMat
    );
    const rightLaneRail = new THREE.Mesh(
      new THREE.TubeGeometry(rightLaneCurve, 260, 0.14, 6, true),
      laneMarkerMat
    );

    this.trackMeshGroup.add(centerRail, leftLaneRail, rightLaneRail);

    // Glowing cyan chevron directional arrows on road surface (as in reference image)
    if (isFinalCollapse) {
      const chevronGroup = new THREE.Group();
      chevronGroup.name = 'Submode10_GlowingChevrons';
      const chevronCanvas = document.createElement('canvas');
      chevronCanvas.width = 128;
      chevronCanvas.height = 128;
      const cCtx = chevronCanvas.getContext('2d');
      if (cCtx) {
        cCtx.clearRect(0, 0, 128, 128);
        cCtx.strokeStyle = '#00f0ff';
        cCtx.lineWidth = 14;
        cCtx.lineCap = 'round';
        cCtx.lineJoin = 'round';
        cCtx.shadowColor = '#00f0ff';
        cCtx.shadowBlur = 18;
        for (let c = 0; c < 2; c++) {
          const offsetX = c * 38;
          cCtx.beginPath();
          cCtx.moveTo(28 + offsetX, 20);
          cCtx.lineTo(66 + offsetX, 64);
          cCtx.lineTo(28 + offsetX, 108);
          cCtx.stroke();
        }
      }
      const chevronTex = new THREE.CanvasTexture(chevronCanvas);
      const chevronMat = new THREE.MeshBasicMaterial({
        map: chevronTex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      for (let i = 0; i < count; i += 12) {
        const s = samples[i];
        const chevronMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), chevronMat);
        chevronMesh.position.copy(s.point).add(new THREE.Vector3(0, 0.12, 0));
        chevronMesh.quaternion.setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(s.binormal, s.normal, s.tangent)
        );
        chevronMesh.rotateX(-Math.PI / 2);
        chevronMesh.rotateZ(-Math.PI / 2);
        chevronGroup.add(chevronMesh);
      }
      this.trackMeshGroup.add(chevronGroup);
    }

    if (isFinalCollapse) {
      const forkSample = allSamples[cutoffIndex];
      const forkBlocker = new THREE.Group();
      forkBlocker.name = 'Submode10_No_Through_Route_Barrier';
      forkBlocker.position.copy(forkSample.point);
      const blockerRot = new THREE.Matrix4();
      blockerRot.makeBasis(forkSample.binormal, forkSample.normal, forkSample.tangent.clone().negate());
      forkBlocker.quaternion.setFromRotationMatrix(blockerRot);

      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(this.track.width + 10, 8, 3),
        new THREE.MeshStandardMaterial({
          color: 0x180612,
          emissive: 0xff2bd6,
          emissiveIntensity: 1.6,
          metalness: 0.75,
          roughness: 0.2,
        })
      );
      barrier.position.y = 4;
      forkBlocker.add(barrier);

      for (let i = -4; i <= 4; i++) {
        const warningLight = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 8, 8),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xff2bd6 : 0xff5b35 })
        );
        warningLight.position.set(i * 3.5, 6.5, 0);
        forkBlocker.add(warningLight);
      }

      this.trackMeshGroup.add(forkBlocker);
    }

    this.scene.add(this.trackMeshGroup);
  }

  private buildCheckpoints() {
    this.checkpointMeshes = [];
    const gates = this.track.checkpoints;

    gates.forEach((gate, idx) => {
      // Do not render the logical Gate 0 as a finish line in Final Collapse.
      // Its physical completion point is the dedicated tower basement route.
      const isFinalCollapse =
        this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
      if (isFinalCollapse && idx === 0) return;

      const group = new THREE.Group();
      group.position.copy(gate.position);
      group.lookAt(gate.position.clone().add(gate.tangent));

      const archRadius = gate.width / 2 + 1;
      const isFinish = idx === 0;

      // When in Submode 10, render complete 360-degree circular holographic accelerator rings!
      const archGeo = isFinalCollapse
        ? new THREE.TorusGeometry(archRadius + 2.2, 0.85, 16, 40, Math.PI * 2)
        : new THREE.TorusGeometry(archRadius, 0.6, 12, 28, Math.PI);

      const archMat = new THREE.MeshStandardMaterial({
        color: isFinish ? 0xffea00 : isFinalCollapse ? 0x00f0ff : 0x00f0ff,
        emissive: isFinish ? 0xffea00 : isFinalCollapse ? 0x00f0ff : 0x00f0ff,
        emissiveIntensity: isFinalCollapse ? 3.6 : 2.4,
        roughness: 0.15,
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      if (!isFinalCollapse) {
        arch.rotation.z = Math.PI;
      }
      group.add(arch);

      if (isFinalCollapse) {
        // Add 4 glowing power node crystals around accelerator ring circumference
        for (let n = 0; n < 4; n++) {
          const nodeAngle = (n / 4) * Math.PI * 2;
          const node = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 2.4, 3.4),
            new THREE.MeshStandardMaterial({
              color: 0x00f0ff,
              emissive: 0x00f0ff,
              emissiveIntensity: 3.8,
            })
          );
          node.position.set(
            Math.cos(nodeAngle) * (archRadius + 2.2),
            Math.sin(nodeAngle) * (archRadius + 2.2),
            0
          );
          group.add(node);
        }
      }

      const curtainGeo = new THREE.PlaneGeometry(gate.width, archRadius);
      const curtainMat = new THREE.MeshBasicMaterial({
        color: isFinish ? 0xffea00 : 0x00a8ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const curtain = new THREE.Mesh(curtainGeo, curtainMat);
      curtain.position.y = archRadius / 2;
      group.add(curtain);

      const textCanvas = document.createElement('canvas');
      textCanvas.width = 384;
      textCanvas.height = 96;
      const tCtx = textCanvas.getContext('2d');
      if (tCtx) {
        tCtx.clearRect(0, 0, 384, 96);
        tCtx.fillStyle = isFinish ? '#ffea00' : '#00f0ff';
        tCtx.shadowColor = isFinish ? '#ffea00' : '#00f0ff';
        tCtx.shadowBlur = 18;
        tCtx.font = '900 44px "Orbitron", sans-serif';
        tCtx.textAlign = 'center';
        tCtx.fillText(isFinish ? 'FINISH' : 'CHECKPOINT', 192, 60);
      }
      const textTex = new THREE.CanvasTexture(textCanvas);
      textTex.minFilter = THREE.LinearFilter;
      const textMat = new THREE.SpriteMaterial({
        map: textTex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
      const textSprite = new THREE.Sprite(textMat);
      textSprite.scale.set(11, 2.75, 1);
      textSprite.position.set(gate.width / 2 + 5.5, archRadius * 0.85, 0);
      group.add(textSprite);

      this.scene.add(group);
      this.checkpointMeshes.push(group);
    });
  }

  private buildBoostPads() {
    this.boostPadMeshes = [];
    const pads = this.track.boostPads;
    pads.forEach(pad => {
      const padGroup = new THREE.Group();
      padGroup.position.copy(pad.position);
      padGroup.lookAt(pad.position.clone().add(pad.direction));

      const padGeo = new THREE.PlaneGeometry(12, 8);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0xff5500,
        emissiveIntensity: 2.5,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(padGeo, padMat);
      padGroup.add(mesh);
      this.scene.add(padGroup);
      this.boostPadMeshes.push(mesh);
    });
  }

  private buildEnergyBarriers() {
    this.energyBarrierMeshes.forEach(g => this.scene.remove(g));
    this.energyBarrierMeshes = [];

    const barriers = this.track.energyBarriers || [];
    for (const b of barriers) {
      const group = new THREE.Group();
      group.position.copy(b.position);

      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeBasis(b.binormal, b.normal, b.tangent.clone().negate());
      group.quaternion.setFromRotationMatrix(rotMatrix);

      const pylonGeo = new THREE.CylinderGeometry(0.7, 1.1, 10, 8);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: 0x1e1e2f,
        metalness: 0.9,
        roughness: 0.2,
      });
      const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
      leftPylon.position.set(-b.width / 2, 5, 0);
      const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
      rightPylon.position.set(b.width / 2, 5, 0);

      const ringGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 20);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.8,
      });
      const leftRing = new THREE.Mesh(ringGeo, ringMat);
      leftRing.rotation.x = Math.PI / 2;
      leftRing.position.set(-b.width / 2, 7, 0);
      const rightRing = leftRing.clone();
      rightRing.position.set(b.width / 2, 7, 0);
      group.add(leftPylon, rightPylon, leftRing, rightRing);

      const beamGeo = new THREE.BoxGeometry(6.2, 5.5, 0.2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });

      if (b.gapLane !== 'left') {
        const leftBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        leftBeam.name = 'barrier_laser';
        leftBeam.position.set(-6.5, 3.2, 0);
        group.add(leftBeam);
      }
      if (b.gapLane !== 'center') {
        const centerBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        centerBeam.name = 'barrier_laser';
        centerBeam.position.set(0, 3.2, 0);
        group.add(centerBeam);
      }
      if (b.gapLane !== 'right') {
        const rightBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        rightBeam.name = 'barrier_laser';
        rightBeam.position.set(6.5, 3.2, 0);
        group.add(rightBeam);
      }

      const gapX = b.gapLane === 'left' ? -6.5 : b.gapLane === 'right' ? 6.5 : 0;
      const arrowGeo = new THREE.ConeGeometry(1.2, 2.2, 4);
      const arrowMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        wireframe: true,
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.name = 'safe_lane_arrow';
      arrow.rotation.x = Math.PI;
      arrow.position.set(gapX, 7.5, 0);
      group.add(arrow);

      this.scene.add(group);
      this.energyBarrierMeshes.push(group);
    }
  }

  private updateEnergyBarriers(dt: number) {
    const time = Date.now() * 0.005;
    this.energyBarrierMeshes.forEach(group => {
      const arrow = group.getObjectByName('safe_lane_arrow');
      if (arrow) {
        arrow.rotation.y += 0.04;
        arrow.position.y = 7.5 + Math.sin(time) * 0.4;
      }
      group.children.forEach(child => {
        if (child.name === 'barrier_laser' && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.55 + Math.sin(time * 2 + child.position.x) * 0.15;
        }
      });
    });
  }

  private buildAsteroidField() {
    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      if (Array.isArray(this.asteroidInstancedMesh.material)) {
        this.asteroidInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.asteroidInstancedMesh.material.dispose();
      }
      this.asteroidInstancedMesh = null;
    }

    const asteroids = this.track.obstacles;
    this.asteroidPoolSize = Math.max(asteroids.length + 16, 64);

    const baseGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const posAttr = baseGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const factor = 1 + (Math.sin(vx * 2) + Math.cos(vy * 2)) * 0.14;
      posAttr.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
    baseGeo.computeVertexNormals();

    const instancedMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.2,
    });

    this.asteroidInstancedMesh = new THREE.InstancedMesh(
      baseGeo,
      instancedMat,
      this.asteroidPoolSize
    );
    this.asteroidInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const normalColor = new THREE.Color(0x606578);
    const dynamicSwarmColor = new THREE.Color(0xff0055);
    const goldOreColor = new THREE.Color(0xd49b42);

    for (let i = 0; i < this.asteroidPoolSize; i++) {
      if (i < asteroids.length) {
        const ast = asteroids[i];
        ast.currentRotation = ast.currentRotation || new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        this.dummyObj.position.copy(ast.position);
        this.dummyObj.rotation.set(
          ast.currentRotation.x,
          ast.currentRotation.y,
          ast.currentRotation.z
        );
        this.dummyObj.scale.setScalar(ast.radius);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);

        if (ast.isDynamicSwarm) {
          this.asteroidInstancedMesh.setColorAt(i, dynamicSwarmColor);
        } else if (i % 3 === 0) {
          this.asteroidInstancedMesh.setColorAt(i, goldOreColor);
        } else {
          this.asteroidInstancedMesh.setColorAt(i, normalColor);
        }
      } else {
        this.dummyObj.position.set(0, -9999, 0);
        this.dummyObj.scale.set(0, 0, 0);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      }
    }

    this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.asteroidInstancedMesh.instanceColor) {
      this.asteroidInstancedMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.asteroidInstancedMesh);
  }

  private buildShortcutPortal() {
    if (this.shortcutPortalGroup) {
      this.scene.remove(this.shortcutPortalGroup);
      this.shortcutPortalGroup = null;
    }

    const shortcutEvent = this.track.dynamicEvents.find(e => e.type === 'TEMPORARY_SHORTCUT');
    if (!shortcutEvent) return;

    const sample = this.track.getSampleAt(shortcutEvent.sectorStartT);
    const group = new THREE.Group();
    group.position.copy(sample.point).add(sample.normal.clone().multiplyScalar(4));
    group.lookAt(sample.point.clone().add(sample.tangent));

    const ringGeo = new THREE.TorusGeometry(12, 1.2, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'portal_ring';
    group.add(ring);

    const discGeo = new THREE.CircleGeometry(11, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xd000ff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.name = 'portal_disc';
    group.add(disc);

    this.shortcutPortalGroup = group;
    this.scene.add(this.shortcutPortalGroup);
  }

  private buildCreditsField() {
    if (this.creditsInstancedMesh) {
      this.scene.remove(this.creditsInstancedMesh);
      this.creditsInstancedMesh.geometry.dispose();
      if (Array.isArray(this.creditsInstancedMesh.material)) {
        this.creditsInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.creditsInstancedMesh.material.dispose();
      }
      this.creditsInstancedMesh = null;
    }

    const credits = this.track.credits;
    if (!credits || credits.length === 0) return;

    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.85,
    });

    this.creditsInstancedMesh = new THREE.InstancedMesh(
      crystalGeo,
      crystalMat,
      credits.length
    );
    this.creditsInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < credits.length; i++) {
      const c = credits[i];
      c.collected = false;
      c.position.copy(c.basePosition);
      this.creditsDummy.position.copy(c.position);
      this.creditsDummy.rotation.set(0, (i * 0.4) % (Math.PI * 2), 0);
      this.creditsDummy.scale.setScalar(1.0);
      this.creditsDummy.updateMatrix();
      this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
    }
    this.creditsInstancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.creditsInstancedMesh);
  }

  private buildPowerUpPods() {
    this.powerUpPodGroups.forEach(g => this.scene.remove(g));
    this.powerUpPodGroups = [];

    const pods = this.track.powerUpPods;
    if (!pods || pods.length === 0) return;

    const getPowerUpPodStyle = (type: PowerUpType): { colorHex: number; coreGeo: THREE.BufferGeometry } => {
      switch (type) {
        case 'NITRO_BOOST':
          return { colorHex: 0xff5500, coreGeo: new THREE.ConeGeometry(0.7, 1.4, 4) };
        case 'ENERGY_SHIELD':
        case 'PHASE_SHIELD':
          return { colorHex: 0x00f0ff, coreGeo: new THREE.IcosahedronGeometry(0.85, 1) };
        case 'REPAIR_CORE':
          return { colorHex: 0x39ff14, coreGeo: new THREE.OctahedronGeometry(0.8, 0) };
        case 'MAGNET_BOOST':
        case 'CREDIT_MAGNET':
          return { colorHex: 0xd000ff, coreGeo: new THREE.TorusGeometry(0.75, 0.3, 12, 24) };
        case 'EMP_PULSE':
          return { colorHex: 0x00e5ff, coreGeo: new THREE.CylinderGeometry(0.8, 0.8, 0.25, 8) };
        case 'TIME_WARP':
          return { colorHex: 0x9d4edd, coreGeo: new THREE.DodecahedronGeometry(0.8, 0) };
        case 'GRAVITY_BURST':
          return { colorHex: 0xffcc00, coreGeo: new THREE.BoxGeometry(0.9, 0.9, 0.9) };
        case 'DECOY_SHIP':
          return { colorHex: 0xff007f, coreGeo: new THREE.TetrahedronGeometry(0.9, 0) };
        case 'TEMPORARY_SPEED_SURGE':
        case 'HYPER_BOOST':
        default:
          return { colorHex: 0xff0055, coreGeo: new THREE.ConeGeometry(0.75, 1.4, 4) };
      }
    };

    pods.forEach(pod => {
      const podGroup = new THREE.Group();
      podGroup.position.copy(pod.position);

      const { colorHex, coreGeo } = getPowerUpPodStyle(pod.type);

      const ringGeo = new THREE.TorusGeometry(1.6, 0.12, 12, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 2.8,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'halo_ring';
      podGroup.add(ring);

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorHex,
        emissiveIntensity: 3.2,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.name = 'core_icon';
      podGroup.add(core);

      const capsuleGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.2, 16);
      const capsuleMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.25,
        wireframe: true,
      });
      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsule.name = 'capsule_shield';
      podGroup.add(capsule);

      this.scene.add(podGroup);
      this.powerUpPodGroups.push(podGroup);
    });
  }

  private buildShieldMesh() {
    if (!this.playerShipGroup) return;
    if (this.shieldMeshGroup) {
      this.playerShipGroup.remove(this.shieldMeshGroup);
      this.shieldMeshGroup = null;
    }

    const group = new THREE.Group();
    group.name = 'phase_shield_group';

    const outerGeo = new THREE.IcosahedronGeometry(3.6, 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.6,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    const innerGeo = new THREE.IcosahedronGeometry(3.45, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x00a8ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    group.visible = false;
    this.shieldMeshGroup = group;
    this.playerShipGroup.add(group);
  }

  public setTrack(trackId: TrackId, customPoints?: [number, number, number][]) {
    const modePoints = customPoints || (this.extendedPathManager ? this.extendedPathManager.activeConfig.controlPoints : undefined);
    if (this.trackId === trackId && this.track && !customPoints) return;
    this.trackId = trackId;

    this.scene.remove(this.trackMeshGroup);
    this.trackMeshGroup = new THREE.Group();

    this.checkpointMeshes.forEach(m => this.scene.remove(m));
    this.checkpointMeshes = [];

    this.boostPadMeshes.forEach(m => {
      if (m.parent) this.scene.remove(m.parent);
      else this.scene.remove(m);
    });
    this.boostPadMeshes = [];

    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      if (Array.isArray(this.asteroidInstancedMesh.material)) {
        this.asteroidInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.asteroidInstancedMesh.material.dispose();
      }
      this.asteroidInstancedMesh = null;
    }

    if (this.shortcutPortalGroup) {
      this.scene.remove(this.shortcutPortalGroup);
      this.shortcutPortalGroup = null;
    }

    if (this.creditsInstancedMesh) {
      this.scene.remove(this.creditsInstancedMesh);
      this.creditsInstancedMesh.geometry.dispose();
      this.creditsInstancedMesh = null;
    }

    this.powerUpPodGroups.forEach(g => this.scene.remove(g));
    this.powerUpPodGroups = [];

    this.track = new CosmicTrack(trackId, modePoints);
    this.buildTrackGeometry();
    this.buildCheckpoints();
    this.buildBoostPads();
    this.buildEnergyBarriers();
    this.buildAsteroidField();
    this.buildShortcutPortal();
    this.buildCreditsField();
    this.buildPowerUpPods();
    if (this.junctionManager) {
      this.junctionManager.mainTrack = this.track;
      this.junctionManager.initJunctions(trackId);

      // Mode 21 / Submode 10: enable the real evacuation tower + basement
      // junction only for THE FINAL COLLAPSE. All other modes keep the
      // existing junction configuration unchanged.
      // Submode 10 always exposes its physical fork and both terminal routes.
      // The countdown controls hazards/collapse, not whether the routes exist.
      const isFinalCollapse =
        this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
      this.junctionManager.setFinalCollapseMode(isFinalCollapse);
    }
    if (this.minimapManager) {
      this.minimapManager.initTrack(this.track.curve, this.track.checkpoints, this.track.id || 'SECTOR ALPHA');
    }
    if (this.hazardManager) {
      this.hazardManager.initForMode(this.activeGameMode, this.activeDifficulty, this.track.curve);
    }
    if (this.aiRacingSystem) {
      this.aiRacingSystem.setTrack(this.track);
    }
    if (this.raceIntroManager) {
      this.raceIntroManager.setMode(this.activeGameMode, this.track);
    }
    this.resetToStart();
  }

  public setPlayerShip(
    shipId: string,
    colorHex: string,
    secondaryColorHex?: string,
    decal: ShipDecalType = 'none',
    upgrades?: ShipUpgrades,
    thrusterColor?: ThrusterFlameColor,
    cockpitSkin?: CockpitSkin
  ) {
    this.localShipId = shipId;
    this.localColor = colorHex;
    this.localSecondaryColor = secondaryColorHex || '#ff00e5';
    this.localDecal = decal;
    if (upgrades) this.localUpgrades = upgrades;
    if (thrusterColor) this.localThrusterColor = thrusterColor;
    if (cockpitSkin) this.localCockpitSkin = cockpitSkin;

    if (this.playerShipGroup) {
      this.scene.remove(this.playerShipGroup);
      this.playerShipGroup = null;
    }

    const flameCfg = THRUSTER_FLAME_CONFIGS.find(t => t.id === this.localThrusterColor);
    const thrusterHex = flameCfg ? flameCfg.hex : this.localColor;

    this.playerShipGroup = createShipMesh(
      shipId,
      this.localColor,
      this.localSecondaryColor,
      this.localDecal,
      thrusterHex,
      this.localCockpitSkin
    );

    this.buildShieldMesh();
    this.scene.add(this.playerShipGroup);

    this.playerThrusters = [];
    this.playerShipGroup.traverse(child => {
      if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
        this.playerThrusters.push(child);
      }
    });

    this.resetToStart();
  }

  public resetToStart() {
    this.splineT = 0;
    this.lateralOffset = 0;
    this.currentSpeed = 0;
    this.boostEnergy = 100;
    this.currentLap = 1;
    this.nextCheckpointIdx = 1;
    this.hasFinished = false;
    this.totalDistanceTraveled = 0;
    this.totalTimeElapsed = 0;
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.checkpointsPassedThisLap.clear();
    this.junctionManager.clearLapJunctions();
    this.latestValidCheckpoint = {
      idx: 0,
      t: 0,
      pos: this.track.checkpoints[0]?.position.clone() || new THREE.Vector3(),
    };
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.driftChargeTime = 0;
    this.lapStartTime = Date.now();
    this.currentLapTime = 0;
    this.bestLapTime = 0;

    // Reset missile weapon and active shield cooldowns
    this.missileManager?.reset();
    this.activeShieldManager?.reset();
    this.finishCinematicManager?.stop();

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }
    this.updateShipTransform(0);
    this.snapCameraToShip();
  }

  public snapCameraToShip() {
    if (!this.playerShipGroup || !this.track) return;
    const sample = this.track.getSampleAt(this.splineT);
    const behindDistance = 14;
    const heightOffset = 5.2;
    const targetCamPos = this.playerShipGroup.position
      .clone()
      .add(sample.tangent.clone().multiplyScalar(-behindDistance))
      .add(sample.normal.clone().multiplyScalar(heightOffset));
    const lookTarget = this.playerShipGroup.position
      .clone()
      .add(sample.tangent.clone().multiplyScalar(25));
    this.camera.position.copy(targetCamPos);
    this.camera.lookAt(lookTarget);
  }

  public startRace() {
    // The panoramic whole-black-hole view is a pre-game presentation only.
    // As soon as gameplay begins, return to the normal chase camera.
    if (this.cameraMode === 'WHOLE_BLACK_HOLE') {
      this.cameraMode = 'CHASE_NEAR';
      this.callbacks.onCameraModeChange?.(this.cameraMode);
    }

    this.isRacing = true;
    this.isPaused = false;

    if (this.activeGameMode === 'BLACK_HOLE') {
      const isSubmode10 = this.modeManager.blackHoleSubmode === 10;
      this.blackHoleCinematicManager?.setSubmode10Presentation(isSubmode10);

      if (isSubmode10) {
        this.finalCollapseManager?.start();
        this.blackHoleCinematicManager?.startFinalFiveMinuteCountdown();
        this.blackHoleCinematicManager?.pauseCountdown(false);
        if (this.quantumCountdownClock) {
          // SINGLE AUTHORITATIVE TIMER: Submode 10 always starts at exactly 15:00.
          this.quantumCountdownClock.activeSubmodeNumber = 10;
          this.quantumCountdownClock.setDuration(900);
          this.quantumCountdownClock.reset();
          this.quantumCountdownClock.setPaused(false);
          this.quantumCountdownClock.gantryMeshGroup.visible = true;
          this.blackHoleCinematicManager.finalCountdownSeconds = 900;
          this.lastSubmode10EventIndex = -1;
          sound.resetFinalCollapseAudio();
        }
        // Submode 10: Route 01/Route 02 unlock only after one complete lap.
        this.junctionManager?.setFinalCollapseRoutesUnlocked(false);

        if (this.blackHoleCinematicManager) {
          this.callbacks.onBlackHoleCinematicTelemetry?.(
            this.blackHoleCinematicManager.getTelemetry()
          );
        }
        if (this.quantumCountdownClock) {
          this.callbacks.onQuantumCountdownUpdate?.(
            this.quantumCountdownClock.update(0)
          );
        }
      } else {
        // Black Hole Submodes 1-9: No countdown clock, no final collapse alerts
        if (this.quantumCountdownClock) {
          this.quantumCountdownClock.activeSubmodeNumber = this.modeManager.blackHoleSubmode;
          this.quantumCountdownClock.setPaused(true);
          this.quantumCountdownClock.gantryMeshGroup.visible = false;
        }
        this.callbacks.onQuantumCountdownUpdate?.(null);
        if (this.blackHoleCinematicManager) {
          this.callbacks.onBlackHoleCinematicTelemetry?.(
            this.blackHoleCinematicManager.getTelemetry()
          );
        }
      }
    } else {
      // All other 20 game modes: completely clear countdown clock and black hole cinematic telemetry
      if (this.quantumCountdownClock) {
        this.quantumCountdownClock.activeSubmodeNumber = 0;
        this.quantumCountdownClock.setPaused(true);
        this.quantumCountdownClock.gantryMeshGroup.visible = false;
      }
      this.callbacks.onQuantumCountdownUpdate?.(null);
      this.callbacks.onBlackHoleCinematicTelemetry?.(null);
    }
    this.hasFinished = false;
    this.raceStartTime = Date.now();
    this.lapStartTime = Date.now();
    this.currentLap = 1;
    this.nextCheckpointIdx = 1;
    this.boostEnergy = 100;
    this.totalTimeElapsed = 0;
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.checkpointsPassedThisLap.clear();
    this.junctionManager?.clearLapJunctions();
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.driftChargeTime = 0;

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }

    sound.startEngine();
    sound.startCosmicMusic();
  }

  public resetRaceState() {
    this.isRacing = false;
    this.isPaused = false;

    if (this.quantumCountdownClock) {
      const isSub10 = this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
      this.quantumCountdownClock.activeSubmodeNumber = isSub10 ? 10 : 0;
      this.quantumCountdownClock.setDuration(900);
      this.quantumCountdownClock.reset();
      this.quantumCountdownClock.setPaused(true);
      this.quantumCountdownClock.gantryMeshGroup.visible = isSub10;
      if (isSub10) {
        this.callbacks.onQuantumCountdownUpdate?.(this.quantumCountdownClock.update(0));
      } else {
        this.callbacks.onQuantumCountdownUpdate?.(null);
      }
    }
    this.lastSubmode10EventIndex = -1;
    sound.resetFinalCollapseAudio();
    if (this.blackHoleCinematicManager) {
      this.blackHoleCinematicManager.pauseCountdown(true);
      this.blackHoleCinematicManager.finalCountdownSeconds = 900;
      this.blackHoleCinematicManager.postZeroElapsedSeconds = 0;
    }
    this.collapseEnvironments?.part1EventManager.reset();

    // Reset the physical Final Collapse state without creating any shelter
    // geometry. The shelter is created only when Submode 10 reaches 00:00.
    this.finalCollapseManager?.start();
    this.hasFinished = false;
    this.finishLineCooldownTimer = 0;
    this.wormholeCooldownTimer = 0;
    this.raceStartTime = 0;
    this.lapStartTime = Date.now();
    this.totalTimeElapsed = 0;
    this.totalDistanceTraveled = 0;
    this.currentLap = 1;
    this.nextCheckpointIdx = 1;
    this.checkpointsPassedThisLap.clear();
    this.junctionManager?.clearLapJunctions();
    if (this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10) {
      this.junctionManager?.setFinalCollapseRoutesUnlocked(false);
    } else {
      this.junctionManager?.setFinalCollapseLauncherPreview(false);
    }
    this.currentLapTime = 0;
    this.bestLapTime = 0;
    this.splineT = 0;
    this.prevSplineT = 0;
    this.lateralOffset = 0;
    this.currentSpeed = 0;
    this.boostEnergy = 100;
    this.isBoosting = false;
    this.isDrifting = false;
    this.shipRoll = 0;
    this.cameraRoll = 0;
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.driftChargeTime = 0;
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.hullHealth = 100;
    this.sessionCredits = 0;
    this.hitCount = 0;
    this.maxSpeedReached = 0;
    this.reachedMilestones.clear();
    this.damageZones = { frontHull: 0, rearEngine: 0, leftWing: 0, rightWing: 0, shieldCore: 100 };
    this.phaseShieldTimer = 0;
    this.creditMagnetTimer = 0;
    this.hyperBoostTimer = 0;
    this.nitroBoostTimer = 0;
    this.activePowerUpsList = [];
    this.missileManager?.reset();
    this.activeShieldManager?.reset();
    this.raceIntroManager?.cleanup();
    this.finishCinematicManager?.stop();
    this.input = { throttle: 0, steer: 0, boost: false, drift: false, recover: false };
    this.cameraShake = 0;
    this.collisionFovPunch = 0;
    this.camera.fov = 65;
    this.camera.far = 4000;
    this.camera.updateProjectionMatrix();

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }
    if (this.trackMeshGroup) {
      this.trackMeshGroup.visible = true;
    }
    this.localAIRacers.forEach(ai => {
      if (ai.group) ai.group.visible = true;
    });
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.0012;
    }

    this.finalCollapseCatastropheActive = false;
    this.finalCollapseShelterEntered = false;
    this.finalCollapseEscapeRouteEntered = false;
    this.finalCollapseWormholeRouteEntered = false;
    this.finalCollapseAuthoritativeState = 'NORMAL_GAMEPLAY';
    this.finalCollapse00Triggered = false;
    this.finalCollapseEndingStarted = false;
    this.finalCollapseResultsShown = false;
    this.finalCollapsePlayerEscaped = false;
    this.finalCollapseEscapedRouteId = null;
    this.finalCollapseControlsLocked = false;
    this.finalCollapsePreviousCountdown = 900;
    this.finalCollapseEscapeEndingActive = false;
    this.finalCollapseEscapeEndingElapsed = 0;
    this.finalCollapseTerminalRouteId = null;
    this.finalCollapseTerminalPoint = null;
    if (this.finalCollapseEscapeSequenceGroup) {
      this.scene.remove(this.finalCollapseEscapeSequenceGroup);
      this.finalCollapseEscapeSequenceGroup.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach(m => m.dispose());
        else material?.dispose();
      });
      this.finalCollapseEscapeSequenceGroup = null;
    }
    this.finalCollapseEscapeSequenceRoute = null;
    this.finalCollapseTerminalTangent = null;
    this.finalCollapseTerminalSequenceElapsed = 0;
    this.finalCollapseTerminalSequenceComplete = false;
    this.finalCollapseDescending = false;
    this.finalCollapseHangarEntered = false;
    this.finalCollapseParkingAligned = false;
    this.finalCollapseShipParked = false;
    this.finalCollapseShipSecured = false;
    this.finalCollapseHangarSealed = false;
    this.finalCollapseAftermathStarted = false;
    this.finalCollapseRaceFinishSent = false;
    this.shelterNavigationActive = false;
    this.shelterClampTimer = 0;
    this.finalCollapseManager?.escapeMissions.reset();

    this.callbacks.onSpeedUpdate?.(0);
    this.callbacks.onBoostUpdate?.(100);
    this.callbacks.onLapUpdate?.(1, this.totalLaps);
    this.callbacks.onCheckpointUpdate?.(0, this.track?.checkpoints?.length || 16);
    this.callbacks.onHullUpdate?.(100);
    this.callbacks.onPowerUpsUpdate?.([]);
    this.callbacks.onDistanceUpdate?.(0);
    this.callbacks.onWrongWayUpdate?.(false);
    this.callbacks.onLapTimesUpdate?.(0, 0);
    this.callbacks.onDamageZonesUpdate?.(this.damageZones);
    this.callbacks.onIntroTelemetry?.(null);
  }

  /**
   * Jumps immediately to any of the 100 timeline events, triggering its alert, audio cue, and cinematic scene.
   */
  public jumpToFinalCollapseEvent(eventNumber: number): void {
    if (this.activeGameMode !== 'BLACK_HOLE' || this.modeManager.blackHoleSubmode !== 10) {
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.round(eventNumber)));
    const masterEvent = getMasterEventByNumber(clamped);

    this.lastSubmode10EventIndex = clamped;
    if (this.finalCollapseManager) {
      this.finalCollapseManager.jumpToEvent(clamped);
    }
    if (this.quantumCountdownClock) {
      this.quantumCountdownClock.setRemainingSeconds(Math.max(0, 900 - masterEvent.exactTriggerSeconds));
    }
    if (this.blackHoleCinematicManager) {
      this.blackHoleCinematicManager.finalCountdownSeconds = Math.max(0, 900 - masterEvent.exactTriggerSeconds);
      this.blackHoleCinematicManager.setQuantumEventTelemetry({
        index: masterEvent.eventNumber,
        title: masterEvent.eventName,
        subtitle: masterEvent.alertMessage,
        phase: masterEvent.severity,
        severity: masterEvent.severityLevel,
      });
      const nextMaster = clamped < 100 ? getMasterEventByNumber(clamped + 1) : null;
      this.blackHoleCinematicManager.setStage93Telemetry({
        index: masterEvent.eventNumber,
        title: masterEvent.eventName,
        areaName: masterEvent.affectedObject,
        hazardDescription: masterEvent.alertMessage,
        nextTitle: nextMaster?.eventName ?? null,
        nextSecondsUntil: 9,
        severity: masterEvent.severityLevel,
      });
      this.callbacks.onBlackHoleCinematicTelemetry?.(this.blackHoleCinematicManager.getTelemetry());
    }
    this.cameraShake = Math.max(this.cameraShake, masterEvent.cameraShake);
  }

  public stopRace() {
    this.isRacing = false;
    this.isAIRaceActive = false;
    this.isPaused = false;
    this.raceIntroManager?.cleanup();
    this.finishCinematicManager?.stop();
    this.clearAIRacers();
    this.isWrongWay = false;
    this.callbacks.onIntroTelemetry?.(null);
    this.callbacks.onCountdownTick?.(0);
    sound.stopEngine();
    sound.stopCosmicMusic();
  }

  private updatePhysics(dt: number) {
    if (!this.playerShipGroup) return;

    if (this.raceIntroManager && this.raceIntroManager.isControlsLocked && !this.isRacing) {
      const slot = this.raceIntroManager.getGridSlot('player');
      if (slot && slot.worldPos.lengthSq() > 0) {
        const gridSample = this.track.getSampleAt(slot.splineT);
        // GridSlot.worldPos already includes the canonical 1.6m hover height.
        // Do not add the normal offset a second time, or the ship floats above
        // the route during the cinematic intro.
        this.playerShipGroup.position.copy(slot.worldPos);
        _shipNegTangent.copy(gridSample.tangent).negate();
        _shipRotMatrix.makeBasis(gridSample.binormal, gridSample.normal, _shipNegTangent);
        this.playerShipGroup.quaternion.setFromRotationMatrix(_shipRotMatrix);
        this.splineT = slot.splineT;
        this.lateralOffset = slot.lateralOffset;
        this.currentSpeed = 0;
      }
      return;
    }

    if (this.isDestroyed) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawnPlayerShip();
      }
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      if (this.playerShipGroup) {
        this.playerShipGroup.visible = Math.floor(Date.now() / 80) % 2 === 0;
      }
    } else if (this.playerShipGroup && !this.playerShipGroup.visible) {
      this.playerShipGroup.visible = true;
    }

    if (this.isRacing && !this.hasFinished) {
      this.currentLapTime = Date.now() - this.lapStartTime;
      this.callbacks.onLapTimesUpdate?.(this.currentLapTime, this.bestLapTime);
    }

    this.totalTimeElapsed += dt;
    if (this.collisionCooldown > 0) {
      this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    }
    if (this.finishLineCooldownTimer > 0) {
      this.finishLineCooldownTimer = Math.max(0, this.finishLineCooldownTimer - dt);
    }

    this.track.updateDynamicEvents(dt, this.totalTimeElapsed);
    const activeEvent = this.track.getActiveEventAt(this.splineT);

    if (activeEvent?.id !== this.lastActiveEventId) {
      this.lastActiveEventId = activeEvent?.id || null;
      this.callbacks.onTrackEventUpdate?.(activeEvent);
      if (activeEvent) {
        if (activeEvent.type === 'ASTEROID_SWARM') {
          sound.playAlarmAlert();
        } else if (activeEvent.type === 'GRAVITY_SHIFT') {
          sound.playGravityShift(activeEvent.gravityMode === 'LOW_G');
        } else if (activeEvent.type === 'TEMPORARY_SHORTCUT') {
          sound.playAlarmAlert();
        }
      }
    }

    const baseConfig = getShipConfig(this.localShipId);
    const shipConfig = getEffectiveShipStats(baseConfig, this.localUpgrades);

    if (this.finalCollapseControlsLocked) {
      this.input.throttle = 0;
      this.input.steer = 0;
      this.input.boost = false;
      this.input.drift = false;
      this.isBoosting = false;
      this.isDrifting = false;
    }

    let gravitySpeedBonus = 0;
    let gravityDriftFactor = 1.0;
    if (activeEvent?.type === 'GRAVITY_SHIFT') {
      if (activeEvent.gravityMode === 'LOW_G') {
        gravitySpeedBonus = 25;
        gravityDriftFactor = 1.7;
      } else if (activeEvent.gravityMode === 'HIGH_G') {
        gravityDriftFactor = 0.5;
      }
    }

    const maxNormalSpeed = (shipConfig.topSpeed + gravitySpeedBonus) / 3.6;
    const hyperBoostSurge =
      this.hyperBoostTimer > 0
        ? 35 + (this.localUpgrades.hyperBoostSpeed || 0) * 8
        : 0;
    const maxBoostSpeed =
      (maxNormalSpeed + hyperBoostSurge) * (1.35 + shipConfig.boostPower / 250);

    const accelRate = (shipConfig.acceleration / 100) * 48;
    const brakeRate = 50;
    const dragRate = activeEvent?.gravityMode === 'LOW_G' ? 6 : 12;

    if (
      (this.input.boost || this.hyperBoostTimer > 0) &&
      (this.boostEnergy > 2 || this.hyperBoostTimer > 0) &&
      this.isRacing
    ) {
      this.isBoosting = true;
      if (this.hyperBoostTimer <= 0) {
        const drainRate = 32 * (100 / shipConfig.boostCapacity);
        this.boostEnergy = Math.max(0, this.boostEnergy - drainRate * dt);
      }
    } else {
      this.isBoosting = false;
      const rechargeRate = 13 * (shipConfig.boostCapacity / 100);
      this.boostEnergy = Math.min(100, this.boostEnergy + rechargeRate * dt);
    }
    this.callbacks.onBoostUpdate(this.boostEnergy);

    const targetMaxSpeed = this.isBoosting ? maxBoostSpeed : maxNormalSpeed;

    if (this.isRacing) {
      if (this.input.throttle > 0 || this.hyperBoostTimer > 0) {
        const throttleMult = this.hyperBoostTimer > 0 ? 2.2 : this.isBoosting ? 1.8 : 1.0;
        const forwardInput = Math.max(0.35, Math.min(1.0, this.input.throttle || 1.0));
        this.currentSpeed = Math.min(
          targetMaxSpeed,
          this.currentSpeed + accelRate * dt * throttleMult * forwardInput
        );
      } else if (this.input.throttle < 0) {
        const revFactor = Math.abs(this.input.throttle);
        const maxReverseSpeed = -10.0; // -36 km/h max reverse speed
        if (this.currentSpeed > 0) {
          // Brake hard from forward movement
          this.currentSpeed -= brakeRate * dt * revFactor;
        } else {
          // Accelerate in reverse along track / space
          const revAccel = accelRate * 0.85 * revFactor;
          this.currentSpeed = Math.max(maxReverseSpeed, this.currentSpeed - revAccel * dt);
        }
      } else {
        if (this.currentSpeed > 0) {
          this.currentSpeed = Math.max(0, this.currentSpeed - dragRate * dt);
        } else if (this.currentSpeed < 0) {
          // Smooth drag returns reverse speed back to neutral 0
          this.currentSpeed = Math.min(0, this.currentSpeed + dragRate * 1.8 * dt);
        }
      }
    } else {
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - dragRate * 2 * dt);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + dragRate * 2 * dt);
      }
    }

    const isInverted = activeEvent?.type === 'INVERSION_ZONE';
    const effectiveSteer = isInverted ? -this.input.steer : this.input.steer;
    const wasDrifting = this.isDrifting;
    this.isDrifting =
      (this.input.drift || activeEvent?.gravityMode === 'LOW_G') && this.currentSpeed > 18;

    if (this.isDrifting && Math.abs(effectiveSteer) > 0.12) {
      this.driftChargeTime += dt;
      if (Math.random() < 0.35) {
        const sparkColor =
          this.driftChargeTime >= 1.5 ? 0xff00e5 : this.driftChargeTime >= 0.7 ? 0x00f0ff : 0x0088ff;
        this.triggerCollisionBurst(this.playerShipGroup.position, sparkColor, 2);
      }
    } else {
      if (wasDrifting && !this.input.drift && this.driftChargeTime > 0.6) {
        if (this.driftChargeTime >= 1.5) {
          this.currentSpeed = Math.min(targetMaxSpeed * 1.35, this.currentSpeed + 28);
          this.boostEnergy = Math.min(100, this.boostEnergy + 25);
          sound.playDriftMiniTurbo();
          if (this.cameraShakeEnabled) this.cameraShake = 0.45;
          this.callbacks.onHazardHit?.('SUPER MINI-TURBO RELEASED!');
        } else {
          this.currentSpeed = Math.min(targetMaxSpeed * 1.18, this.currentSpeed + 16);
          this.boostEnergy = Math.min(100, this.boostEnergy + 12);
          sound.playDriftMiniTurbo();
          this.callbacks.onHazardHit?.('MINI-TURBO RELEASED!');
        }
      }
      this.driftChargeTime = 0;
    }

    const handlingFactor =
      (shipConfig.handling / 100) * (this.isDrifting ? 1.6 * gravityDriftFactor : 1.0);
    const steerResistance = (this.activeGameMode === 'BLACK_HOLE' && this.finalCollapseManager?.evacuation.evacuationActive)
      ? this.finalCollapseManager.catastrophe.getShipImpactForces(this.finalCollapseManager.elapsed).steeringResistance
      : 0;
    const steerSpeed = 24 * handlingFactor * (1.0 - steerResistance);
    if (effectiveSteer !== 0 && (Math.abs(this.currentSpeed) > 1 || this.input.throttle !== 0)) {
      const velocityRatio = this.currentSpeed >= 0
        ? Math.max(0.2, this.currentSpeed / maxNormalSpeed)
        : -0.55; // Natural steering response when moving in reverse
      this.lateralOffset += effectiveSteer * steerSpeed * dt * velocityRatio;
    }

    if (this.hyperBoostTimer > 0) {
      this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, 0, 4.0 * dt);
    }

    // Lane Guidance: smoothly bias ship lateral position toward chosen route as junction approaches
    const juncTelem = this.junctionManager.activeJunctionTelemetry;
    if (
      juncTelem &&
      juncTelem.isApproaching &&
      juncTelem.selectedRouteDirection &&
      !this.junctionManager.playerRouteProgress.isInBranch
    ) {
      let targetLane = 0;
      if (juncTelem.selectedRouteDirection === 'LEFT') {
        targetLane = -this.track.width * 0.28;
      } else if (
        juncTelem.selectedRouteDirection === 'RIGHT' ||
        juncTelem.selectedRouteDirection === 'SHORTCUT'
      ) {
        targetLane = this.track.width * 0.28;
      }
      // If player is not actively steering hard in opposite direction, smoothly assist lane placement
      if (Math.abs(effectiveSteer) < 0.3) {
        this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, targetLane, dt * 2.2);
      }
    }

    // Mode 21 Submode 10: Playable Shelter & Parking Navigation (Supports forward & reverse)
    if (this.shelterNavigationActive) {
      if (!this.finalCollapseShipParked) {
        const steerSpeed = 16.0;
        this.shelterX += this.input.steer * steerSpeed * dt;
        this.shelterX = THREE.MathUtils.clamp(this.shelterX, -11.0, 11.0);
        this.shelterHeading = THREE.MathUtils.lerp(this.shelterHeading, this.input.steer * 0.22, 0.12);

        const maxTunnelSpeed = (this.shelterZ > -32) ? 30 : (this.shelterZ > -130) ? 20 : 12;
        const maxTunnelReverse = -12;
        if (this.input.throttle > 0) {
          this.currentSpeed = Math.min(maxTunnelSpeed, this.currentSpeed + 18 * dt * Math.max(0.4, this.input.throttle));
        } else if (this.input.throttle < 0) {
          const revFactor = Math.abs(this.input.throttle);
          if (this.currentSpeed > 0) {
            this.currentSpeed -= 28 * dt * revFactor;
          } else {
            this.currentSpeed = Math.max(maxTunnelReverse, this.currentSpeed - 16 * dt * revFactor);
          }
        } else {
          if (this.currentSpeed > 0) this.currentSpeed = Math.max(0, this.currentSpeed - 10 * dt);
          else if (this.currentSpeed < 0) this.currentSpeed = Math.min(0, this.currentSpeed + 15 * dt);
        }

        this.shelterZ -= this.currentSpeed * dt;
        this.shelterZ = THREE.MathUtils.clamp(this.shelterZ, -210, 5);
      } else {
        this.currentSpeed = Math.max(0, this.currentSpeed - 18 * dt);
        this.shelterX = THREE.MathUtils.lerp(this.shelterX, 0, 0.08);
        this.shelterZ = THREE.MathUtils.lerp(this.shelterZ, -185, 0.08);
        this.shelterHeading = THREE.MathUtils.lerp(this.shelterHeading, 0, 0.08);
      }
    }

    const prpState = this.junctionManager.playerRouteProgress;
    const currentTrackWidth =
      prpState.isInBranch && prpState.branchRouteInstance
        ? prpState.branchRouteInstance.config.width
        : this.track.width;
    const maxHalfW = currentTrackWidth / 2 - 1.8;

    if (Math.abs(this.lateralOffset) > maxHalfW) {
      this.lateralOffset = Math.sign(this.lateralOffset) * maxHalfW;
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(10, this.currentSpeed * 0.75);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(-2, this.currentSpeed * 0.75);
      }
      if (this.cameraShakeEnabled) this.cameraShake = 0.5;
      sound.playCollision();
    }

    // Branch Obstacle Collision Check
    if (this.collisionCooldown <= 0 && this.isRacing && prpState.isInBranch && prpState.branchRouteInstance) {
      const shipPos = this.playerShipGroup.position;
      for (const obsPos of prpState.branchRouteInstance.obstaclePositions) {
        if (shipPos.distanceTo(obsPos) < 4.2) {
          if (this.phaseShieldTimer > 0) {
            sound.playShieldDeflect();
            if (this.cameraShakeEnabled) this.cameraShake = 0.35;
            this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
            this.collisionCooldown = 0.5;
            this.callbacks.onHazardHit?.('PHASE SHIELD DEFLECTED ASTEROID!');
          } else {
            sound.playAsteroidHit();
            if (this.cameraShakeEnabled) this.cameraShake = 0.85;
            this.currentSpeed = Math.max(12, this.currentSpeed * 0.5);
            this.lateralOffset += this.lateralOffset >= 0 ? 3 : -3;
            this.collisionCooldown = 1.2;
            this.hullHealth = Math.max(0, this.hullHealth - 20);
            this.hitCount++;
            this.triggerCollisionBurst(shipPos, 0xff0055, 32);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            this.callbacks.onHazardHit?.('BRANCH ASTEROID IMPACT');
            if (this.hullHealth <= 0) {
              this.destroyPlayerShip('HULL CRITICALLY BREACHED');
              return;
            }
          }
          break;
        }
      }
    }

    if (this.collisionCooldown <= 0 && this.isRacing) {
      const shipPos = this.playerShipGroup.position;
      for (const obs of this.track.obstacles) {
        if (obs.isDestroyed || obs.health <= 0) continue;
        if (shipPos.distanceTo(obs.position) < obs.radius + 1.8) {
          if (this.phaseShieldTimer > 0) {
            sound.playShieldDeflect();
            if (this.cameraShakeEnabled) this.cameraShake = 0.35;
            this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
            this.collisionCooldown = 0.5;
            this.callbacks.onHazardHit?.('PHASE SHIELD DEFLECTED ASTEROID!');
          } else {
            sound.playAsteroidHit();
            if (this.cameraShakeEnabled) this.cameraShake = 0.85;
            this.currentSpeed = Math.max(12, this.currentSpeed * 0.45);
            this.lateralOffset += this.lateralOffset >= 0 ? 5 : -5;
            this.collisionCooldown = 1.2;
            this.hullHealth = Math.max(0, this.hullHealth - 25);
            this.hitCount++;
            this.triggerCollisionBurst(shipPos, 0xff0055, 36);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            this.callbacks.onHazardHit?.('ASTEROID SWARM IMPACT');
            if (this.hullHealth <= 0) {
              this.destroyPlayerShip('HULL CRITICALLY BREACHED');
              return;
            }
          }
          break;
        }
      }
    }

    if (this.collisionCooldown <= 0 && this.isRacing && this.track.energyBarriers) {
      const shipPos = this.playerShipGroup.position;
      for (const barrier of this.track.energyBarriers) {
        if (!barrier.active) continue;
        const dist = shipPos.distanceTo(barrier.position);
        if (dist < 6.5) {
          const playerLane = this.lateralOffset < -2.2 ? 'left' : this.lateralOffset > 2.2 ? 'right' : 'center';
          if (playerLane !== barrier.gapLane) {
            if (this.phaseShieldTimer > 0) {
              sound.playShieldDeflect();
              if (this.cameraShakeEnabled) this.cameraShake = 0.4;
              this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
              this.collisionCooldown = 0.6;
              this.callbacks.onHazardHit?.('PHASE SHIELD ABSORBED LASER BARRIER');
            } else {
              sound.playCollision();
              if (this.cameraShakeEnabled) this.cameraShake = 0.85;
              this.currentSpeed = Math.max(12, this.currentSpeed * 0.45);
              this.collisionCooldown = 1.2;
              this.hullHealth = Math.max(0, this.hullHealth - 20);
              this.hitCount++;
              this.triggerCollisionBurst(shipPos, 0x00f0ff, 36);
              this.callbacks.onHullUpdate?.(this.hullHealth);
              this.callbacks.onHazardHit?.('ENERGY BARRIER BREACHED');
              if (this.hullHealth <= 0) {
                this.destroyPlayerShip('HULL OVERCHARGED & CRITICALLY BREACHED');
                return;
              }
            }
            break;
          }
        }
      }
    }

    // Dedicated Player-to-Player & AI Spacecraft Collision System
    if (this.collisionsEnabled && this.playerShipGroup && !this.isSpectator) {
      const pSample = this.track.getSampleAt(this.splineT);
      const forwardDir = pSample.tangent.clone().negate();
      const pSpeedMps = this.currentSpeed;
      const pVel = forwardDir.clone().multiplyScalar(pSpeedMps);

      const pCfg = getShipConfig(this.localShipId);
      const pMass =
        pCfg.id === 'vortex_nemesis'
          ? 1.45
          : pCfg.id === 'apex_phantom'
          ? 0.95
          : pCfg.id === 'solaris_stinger'
          ? 0.85
          : 1.15;

      const playerParticipant: CollisionParticipant = {
        id: 'player',
        category: 'PLAYER',
        name: 'Player',
        position: this.playerShipGroup.position,
        velocity: pVel,
        speed: pSpeedMps,
        direction: forwardDir,
        radius: 2.6,
        mass: pMass,
        shield: this.phaseShieldTimer > 0 ? 100 : this.damageZones.shieldCore,
        hull: this.hullHealth,
        isBoosting: this.isBoosting,
        collisionCooldown: this.collisionCooldown,
        recoveryTimer: this.playerCollisionRecoveryTimer,
        angularVelocity: this.playerCollisionAngularVelocity,
        angularDisplacement: this.playerCollisionAngularDisplacement,
        lateralOffset: this.lateralOffset,
        splineT: this.splineT,
        invulnerableTimer: this.invulnerableTimer,
        isDestroyed: this.isDestroyed,
        meshGroup: this.playerShipGroup,
        applyDamage: (shieldLoss, hullLoss, impactForce) => {
          if (shieldLoss > 0) {
            this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - shieldLoss);
          }
          if (hullLoss > 0) {
            this.hullHealth = Math.max(0, this.hullHealth - hullLoss);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            const zone = Math.random() > 0.5 ? 'leftWing' : 'rightWing';
            this.applyZoneDamage(zone, hullLoss);
          }
          this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
        },
        onCrash: reason => {
          this.destroyPlayerShip(reason);
        },
      };

      this.collisionSystem.registerParticipant(playerParticipant);

      // Register / update AI Participants
      for (const ai of this.localAIRacers) {
        if (!ai.group) continue;
        const aiSample = this.track.getSampleAt(ai.t);
        const aiDir = aiSample.tangent.clone().negate();
        const aiVel = aiDir.clone().multiplyScalar(ai.speed);
        const aiMass =
          ai.shipId === 'vortex_nemesis'
            ? 1.4
            : ai.shipId === 'apex_phantom'
            ? 0.95
            : ai.shipId === 'solaris_stinger'
            ? 0.85
            : 1.1;

        const aiParticipant: CollisionParticipant = {
          id: ai.id,
          category: 'AI_PLAYER',
          name: ai.name,
          position: ai.group.position,
          velocity: aiVel,
          speed: ai.speed,
          direction: aiDir,
          radius: 2.5,
          mass: aiMass,
          shield: ai.shield ?? 100,
          hull: ai.hull ?? 100,
          isBoosting: ai.isBoosting,
          collisionCooldown: ai.collisionCooldown ?? 0,
          recoveryTimer: ai.recoveryTimer ?? 0,
          angularVelocity: ai.angularVelocity ?? 0,
          angularDisplacement: ai.angularDisplacement ?? 0,
          lateralOffset: ai.currentLateral,
          splineT: ai.t,
          invulnerableTimer: ai.invulnerableTimer ?? 0,
          isDestroyed: !!ai.isDestroyed,
          meshGroup: ai.group,
          applyDamage: (shieldLoss, hullLoss) => {
            ai.shield = Math.max(0, (ai.shield ?? 100) - shieldLoss);
            ai.hull = Math.max(0, (ai.hull ?? 100) - hullLoss);
          },
          onCrash: () => {
            ai.isDestroyed = true;
            ai.respawnTimer = 2.0;
            ai.group.visible = false;
            this.triggerCollisionBurst(ai.group.position, 0xff0055, 40);
          },
        };

        this.collisionSystem.registerParticipant(aiParticipant);
      }

      // Register / update Remote Multiplayer Ships
      for (const [pid, remote] of this.remoteShips.entries()) {
        if (!remote.group) continue;
        const remotePos = remote.group.position;
        const remoteDir = new THREE.Vector3(0, 0, -1).applyQuaternion(remote.group.quaternion);
        this.collisionSystem.registerParticipant({
          id: pid,
          category: 'REMOTE_PLAYER',
          name: `Racer_${pid.slice(0, 4)}`,
          position: remotePos,
          velocity: remoteDir.clone().multiplyScalar(40),
          speed: 40,
          direction: remoteDir,
          radius: 2.5,
          mass: 1.1,
          shield: 100,
          hull: 100,
          isBoosting: false,
          collisionCooldown: 0,
          recoveryTimer: 0,
          angularVelocity: 0,
          angularDisplacement: 0,
          lateralOffset: 0,
          splineT: this.splineT,
          invulnerableTimer: 0,
          isDestroyed: false,
          meshGroup: remote.group,
        });
      }

      // Run dedicated collision evaluation & resolution
      this.collisionSystem.update(dt);

      // Read back state from player participant
      const updatedPlayer = this.collisionSystem.getParticipant('player');
      if (updatedPlayer) {
        this.lateralOffset = updatedPlayer.lateralOffset;
        // Do not let a transient collision-state zero overwrite active race speed.
        if (!(this.isRacing && !this.hasFinished && this.currentSpeed > 0 && updatedPlayer.speed <= 0)) {
          this.currentSpeed = updatedPlayer.speed;
        }
        this.collisionCooldown = updatedPlayer.collisionCooldown;
        this.playerCollisionAngularVelocity = updatedPlayer.angularVelocity;
        this.playerCollisionAngularDisplacement = updatedPlayer.angularDisplacement;
        this.playerCollisionRecoveryTimer = updatedPlayer.recoveryTimer;
      }

      // Read back state to AI participants
      for (const ai of this.localAIRacers) {
        const updatedAI = this.collisionSystem.getParticipant(ai.id);
        if (updatedAI) {
          ai.currentLateral = updatedAI.lateralOffset;
          ai.speed = updatedAI.speed;
          ai.collisionCooldown = updatedAI.collisionCooldown;
          ai.angularVelocity = updatedAI.angularVelocity;
          ai.angularDisplacement = updatedAI.angularDisplacement;
          ai.recoveryTimer = updatedAI.recoveryTimer;
          ai.shield = updatedAI.shield;
          ai.hull = updatedAI.hull;
        }
      }
    }

    if (activeEvent?.type === 'TEMPORARY_SHORTCUT' && activeEvent.shortcutTargetT && this.isRacing) {
      const shortcutGateSample = this.track.getSampleAt(activeEvent.sectorStartT);
      const shipPos = this.playerShipGroup.position;
      if (shipPos.distanceTo(shortcutGateSample.point) < 11.0) {
        sound.playWormholeWarp();
        this.splineT = activeEvent.shortcutTargetT;
        this.currentSpeed = Math.min(130, this.currentSpeed + 35);
        this.cameraShake = 0.6;
        this.callbacks.onShortcutUsed?.(activeEvent.title);
      }
    }

    // Submode 10 Physical Wormhole Shortcut Portal Trigger
    if (this.wormholeCooldownTimer > 0) {
      this.wormholeCooldownTimer = Math.max(0, this.wormholeCooldownTimer - dt);
    }
    if (
      this.collapseEnvironments?.physicalMegaCities &&
      this.isRacing &&
      this.modeManager.blackHoleSubmode === 10 &&
      this.wormholeCooldownTimer <= 0
    ) {
      const wPortal = this.collapseEnvironments.physicalMegaCities.wormholes[0];
      if (wPortal && wPortal.isActive) {
        const shipPos = this.playerShipGroup.position;
        if (shipPos.distanceTo(wPortal.position) < wPortal.captureRadius) {
          sound.playWormholeWarp();
          this.wormholeCooldownTimer = 5.0;
          this.currentSpeed = Math.min(145, this.currentSpeed + 40);
          this.cameraShake = Math.max(this.cameraShake, 0.85);
          this.triggerCollisionBurst(shipPos, 0xa855f7, 36);
          this.callbacks.onShortcutUsed?.('QUANTUM WORMHOLE SHORTCUT // SUB-SPACE SURGE');
        }
      }
    }

    if (this.input.selectRouteDirection) {
      const success = this.junctionManager.selectRouteByDirection(this.input.selectRouteDirection);
      if (success) {
        sound.playRouteSelected();
        const selRoute = this.junctionManager.activeJunctionTelemetry?.availableRoutes.find(
          r => r.id === this.junctionManager.playerRouteProgress.activeRouteId
        );
        if (selRoute) {
          this.callbacks.onRouteSelected?.(selRoute.name, selRoute.direction);
        }
      }
      this.input.selectRouteDirection = undefined;
    }

    if (this.input.recover) {
      this.lateralOffset = 0;
      this.currentSpeed = 20;
      this.input.recover = false;
    }

    // Final Collapse has one physical start/fork and three terminal ends.
    // Stop the ship at the fork until the player chooses a route; this
    // prevents the old main-track loop from carrying the player past the fork.
    const isQLPSubmode10Fork =
      this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
    const forkT = 0.18;
    const forkWindow = 0.012;
    if (isQLPSubmode10Fork &&
        !this.junctionManager.playerRouteProgress.isInBranch &&
        !this.junctionManager.playerRouteProgress.activeRouteId &&
        this.splineT >= forkT - forkWindow && this.splineT < forkT) {
      this.currentSpeed = Math.max(0, Math.min(this.currentSpeed, 6));
      this.isWrongWay = false;
    }

    if (this.junctionManager.playerRouteProgress.isInBranch) {
      const activeBranchRouteId = this.junctionManager.playerRouteProgress.activeRouteId;
      const isQLPSubmode10 = this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;

      // Route 01: Orbital Launcher
      if (isQLPSubmode10 && activeBranchRouteId === 'bh10_launcher_route' && !this.finalCollapseShelterEntered) {
        this.finalCollapseEscapedRouteId = 'bh10_launcher_route';
        this.finalCollapseManager?.escapeMissions.selectRoute('bh10_launcher_route');
        if (
          this.finalCollapseAuthoritativeState === 'NORMAL_GAMEPLAY' ||
          this.finalCollapseAuthoritativeState === 'FINAL_COLLAPSE_ACTIVE'
        ) {
          this.setFinalCollapseAuthoritativeState('ROUTE_01_INITIATED');
          this.blackHoleCinematicManager?.setObjective('ROUTE 01 // ORBITAL LAUNCH CORRIDOR ENGAGED');
        }
      }

      // Route 02: Emergency Escape Corridor
      if (isQLPSubmode10 && activeBranchRouteId === 'bh10_escape_route' && !this.finalCollapseEscapeRouteEntered) {
        this.finalCollapseEscapeRouteEntered = true;
        this.finalCollapseEscapedRouteId = 'bh10_escape_route';
        this.finalCollapseManager?.escapeMissions.selectRoute('bh10_escape_route');
        this.setFinalCollapseAuthoritativeState('ROUTE_02_INITIATED');
        this.finalCollapseCatastropheActive = true;
        this.finalCollapseManager?.beginTrackCollapse();
        this.blackHoleCinematicManager?.start('ESCAPE_SEQUENCE');
        this.blackHoleCinematicManager?.setObjective('ROUTE 02 // EMERGENCY ESCAPE CORRIDOR ENGAGED');
        this.blackHoleCinematicManager!.cameraOverride = false;
        this.blackHoleCinematicManager!.gameplayLocked = false;
        this.callbacks.onShortcutUsed?.('ROUTE 02 // EMERGENCY ESCAPE CORRIDOR ENGAGED');
      }

      // Route 03: Gravity Slingshot Escape
      if (isQLPSubmode10 && activeBranchRouteId === 'bh10_wormhole_route' && !this.finalCollapseWormholeRouteEntered) {
        this.finalCollapseWormholeRouteEntered = true;
        this.finalCollapseEscapedRouteId = 'bh10_wormhole_route';
        this.finalCollapseManager?.escapeMissions.selectRoute('bh10_wormhole_route');
        this.setFinalCollapseAuthoritativeState('ROUTE_03_INITIATED');
        this.finalCollapseCatastropheActive = true;
        this.finalCollapseManager?.beginTrackCollapse();
        this.blackHoleCinematicManager?.start('ESCAPE_SEQUENCE');
        this.blackHoleCinematicManager?.setObjective('ROUTE 03 // GRAVITY SLINGSHOT VECTOR ENGAGED');
        this.blackHoleCinematicManager!.cameraOverride = false;
        this.blackHoleCinematicManager!.gameplayLocked = false;
        this.callbacks.onShortcutUsed?.('ROUTE 03 // GRAVITY SLINGSHOT VECTOR ENGAGED');
      }

      // Route 01 remains the physical launcher route.
      if (
        isQLPSubmode10 &&
        this.finalCollapseCatastropheActive &&
        activeBranchRouteId === 'bh10_launcher_route' &&
        this.blackHoleCinematicManager?.event === 'EVACUATION'
      ) {
        this.blackHoleCinematicManager.start('TOWER_ENTRY');
        this.blackHoleCinematicManager.cameraOverride = false;
        this.blackHoleCinematicManager.gameplayLocked = false;
      }

      const branchUpdate = this.junctionManager.updateRouteProgress(dt, this.currentSpeed, (cpIndices) => {
        cpIndices.forEach(cpIdx => {
          this.checkpointsPassedThisLap.add(cpIdx);
          this.finalCollapseManager?.escapeMissions.validateCheckpoint(cpIdx);
          if (this.nextCheckpointIdx === cpIdx) {
            this.nextCheckpointIdx = (this.nextCheckpointIdx + 1) % this.track.checkpoints.length;
            this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, this.track.checkpoints.length);
            sound.playCheckpoint();
          }
        });
      });

      // Update multi-stage escape mission progression during branch traversal
      if (isQLPSubmode10 && this.finalCollapseManager) {
        const remainingSec = this.quantumCountdownClock?.getRemainingSeconds() ?? (this.blackHoleCinematicManager?.finalCountdownSeconds ?? 900);
        const missionUpdate = this.finalCollapseManager.escapeMissions.updateProgress(
          this.junctionManager.playerRouteProgress.progress,
          this.currentSpeed,
          remainingSec,
          this.playerShipGroup?.position
        );
        if (missionUpdate.stageAdvanced && missionUpdate.currentStage) {
          this.blackHoleCinematicManager?.setObjective(`${missionUpdate.currentStage.stageId} // ${missionUpdate.currentStage.objectiveText}`);
          this.callbacks.onShortcutUsed?.(`${missionUpdate.currentStage.stageId}: ${missionUpdate.currentStage.name}`);
        }
        if (this.blackHoleCinematicManager) {
          this.blackHoleCinematicManager.setEscapeMissionTelemetry(this.finalCollapseManager.escapeMissions.getTelemetry());
        }
      }

      if (branchUpdate.finishedBranch) {
        const completedRouteId = branchUpdate.completedRouteId || null;
        const terminalRoute = branchUpdate.terminalRoute === true;

        // Submode 10 terminal routes do NOT rejoin the main track. Route 01
        // ends at the launcher/shelter; Route 02 ends at its own escape gate.
        if (isQLPSubmode10 && terminalRoute && branchUpdate.terminalPoint) {
          // The ship is already physically at the branch endpoint because the
          // branch sample is applied every frame. Never snap/copy the player
          // to a terminal point here; doing so caused the launcher to appear
          // as a teleport into the parking bay.
          this.currentSpeed = Math.max(0, Math.min(this.currentSpeed, 110));
          this.lateralOffset = 0;
          this.isWrongWay = false;
          this.wrongWayTimer = 0;

          if (completedRouteId === 'bh10_launcher_route') {
            this.finalCollapseShelterEntered = true;
            this.finalCollapseEscapedRouteId = 'bh10_launcher_route';
            this.setFinalCollapseAuthoritativeState('ROUTE_01_SEQUENCE');
            this.shelterNavigationActive = true;
            this.shelterZ = 0;
            this.shelterX = THREE.MathUtils.clamp(this.lateralOffset, -8, 8);
            this.currentSpeed = Math.min(this.currentSpeed, 32);
            this.finalCollapseManager?.beginTowerEntry();
            this.blackHoleCinematicManager?.start('BASEMENT_ENTRY');
            this.blackHoleCinematicManager?.setObjective('ORBITAL LAUNCHER // APPROACH DOCKING BAY');
            sound.playMagneticLock();
            sound.playBlastDoorOpen();
            this.cameraShake = Math.max(this.cameraShake, 0.45);
          } else if (completedRouteId === 'bh10_escape_route' || completedRouteId === 'bh10_wormhole_route') {
            this.finalCollapseTerminalRouteId = completedRouteId;
            this.finalCollapseTerminalPoint = branchUpdate.terminalPoint.clone();
            this.finalCollapseTerminalTangent = branchUpdate.terminalTangent?.clone() || new THREE.Vector3(0, 0, -1);
            this.finalCollapseTerminalSequenceElapsed = 0;
            this.finalCollapseTerminalSequenceComplete = false;
            this.finalCollapseCatastropheActive = true;
            this.finalCollapseEscapedRouteId = completedRouteId;
            this.buildFinalCollapseEscapeSequence(completedRouteId as 'bh10_escape_route' | 'bh10_wormhole_route');
            if (completedRouteId === 'bh10_escape_route') {
              this.finalCollapseEscapeRouteEntered = true;
              this.setFinalCollapseAuthoritativeState('ROUTE_02_SEQUENCE');
              this.blackHoleCinematicManager?.start('ESCAPE_SEQUENCE');
              this.blackHoleCinematicManager?.setObjective('ROUTE 02 // SUBTERRANEAN BUNKER APPROACH');
              this.callbacks.onShortcutUsed?.('ROUTE 02 // SUBTERRANEAN BUNKER APPROACH');
            } else {
              this.finalCollapseWormholeRouteEntered = true;
              this.setFinalCollapseAuthoritativeState('ROUTE_03_SEQUENCE');
              this.blackHoleCinematicManager?.start('ESCAPE_SEQUENCE');
              this.blackHoleCinematicManager?.setObjective('ROUTE 03 // EINSTEIN-ROSEN GATEWAY APPROACH');
              this.callbacks.onShortcutUsed?.('ROUTE 03 // EINSTEIN-ROSEN GATEWAY APPROACH');
            }
          }

          this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, this.track.checkpoints.length);
        } else {

        // Rejoin main track smoothly at or past the junction exit
        const progressAdvance = (this.currentSpeed * dt) / this.track.totalLength;
        this.splineT = ((branchUpdate.rejoinSplineT + progressAdvance) % 1.0 + 1.0) % 1.0;
        this.lateralOffset = 0;
        this.isWrongWay = false;
        this.wrongWayTimer = 0;
        this.currentSpeed = Math.max(this.currentSpeed, 140);

        // Instantly align ship world position and orientation with main track centerline
        const rejoinSample = this.track.getSampleAt(this.splineT);
        this.updateShipTransform(0);

        // Sync checkpoints so any gates within or before the rejoined route are marked as passed
        const totalCps = this.track.checkpoints.length;
        for (let i = 0; i < totalCps; i++) {
          if (this.track.checkpoints[i].t <= this.splineT) {
            this.checkpointsPassedThisLap.add(i);
          }
        }

        // Advance nextCheckpointIdx to the nearest upcoming gate ahead of splineT
        let upcomingIdx = 0;
        let foundAhead = false;
        for (let i = 0; i < totalCps; i++) {
          if (this.track.checkpoints[i].t > this.splineT) {
            upcomingIdx = i;
            foundAhead = true;
            break;
          }
        }
        this.nextCheckpointIdx = foundAhead ? upcomingIdx : 0;
        this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, totalCps);

        // Update latestValidCheckpoint to the rejoin point so recovery/respawn never sends the player backwards
        this.latestValidCheckpoint = {
          idx: (this.nextCheckpointIdx - 1 + totalCps) % totalCps,
          t: this.splineT,
          pos: rejoinSample.point.clone(),
        };

        // Reset branch route progress state
        this.junctionManager.playerRouteProgress.activeJunctionId = null;
        this.junctionManager.playerRouteProgress.activeRouteId = null;
        this.junctionManager.playerRouteProgress.branchRouteInstance = null;
        this.junctionManager.playerRouteProgress.isInBranch = false;
        this.junctionManager.playerRouteProgress.progress = 0;
        this.junctionManager.isSelectionLocked = false;
        this.junctionManager.activeJunctionTelemetry = null;

        this.callbacks.onShortcutUsed?.(this.junctionManager.feedbackMessage || 'ROUTE COMPLETED // MERGED TO MAIN LANE');
        sound.playCheckpoint();
        }
      } else {
        const junc = this.junctionManager.junctions.get(this.junctionManager.playerRouteProgress.activeJunctionId || '');
        if (junc) {
          const startT = junc.config.junctionStartT;
          const endT = junc.config.junctionEndT;
          const effEndT = endT < startT ? endT + 1.0 : endT;
          const interpT = startT + this.junctionManager.playerRouteProgress.progress * (effEndT - startT);
          this.splineT = ((interpT % 1.0) + 1.0) % 1.0;
        }
      }
    } else {
      this.prevSplineT = this.splineT;
      const progressAdvance = (this.currentSpeed * dt) / this.track.totalLength;
      this.splineT = ((this.splineT + progressAdvance) % 1.0 + 1.0) % 1.0;
    }

    this.totalDistanceTraveled += this.currentSpeed * dt;

    const distM = Math.floor(this.totalDistanceTraveled);
    this.callbacks.onDistanceUpdate?.(distM);

    const milestones = [
      { dist: 250, label: '250m - Sublight Barrier Broken!' },
      { dist: 500, label: '500m - Warp Threshold Passed!' },
      { dist: 1000, label: '1000m - Cosmic Frontier Reached!' },
      { dist: 2000, label: '2000m - Deep Void Master!' },
      { dist: 3500, label: '3500m - Tactical Warp Master!' },
      { dist: 5000, label: '5000m - Void Legend!' },
    ];
    for (const m of milestones) {
      if (distM >= m.dist && !this.reachedMilestones.has(m.dist)) {
        this.reachedMilestones.add(m.dist);
        this.sessionCredits += 100;
        this.callbacks.onCreditCollected?.(this.sessionCredits, 100);
        this.callbacks.onMilestoneReached?.(m.label);
        sound.playFinish();
        break;
      }
    }

    this.updateShipTransform(dt);

    const sampleAfter = this.track.getSampleAt(this.splineT);
    const shipHeading = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);
    const forwardAlignment = shipHeading.dot(sampleAfter.tangent);
    // Wrong way is only triggered if facing backwards AND accelerating forward in reverse direction
    if (forwardAlignment < -0.35 && this.currentSpeed > 5) {
      this.wrongWayTimer += dt;
      if (this.wrongWayTimer > 0.4 && !this.isWrongWay) {
        this.isWrongWay = true;
        sound.playWrongWayAlert();
        this.callbacks.onWrongWayUpdate?.(true);
      }
    } else {
      this.wrongWayTimer = 0;
      if (this.isWrongWay) {
        this.isWrongWay = false;
        this.callbacks.onWrongWayUpdate?.(false);
      }
    }

    this.checkTrackTriggers();

    const speedNorm = this.currentSpeed / maxNormalSpeed;
    sound.updateEngine(speedNorm, this.isBoosting);

    const speedKmH = Math.round(this.currentSpeed * 3.6);
    if (speedKmH > this.maxSpeedReached) {
      this.maxSpeedReached = speedKmH;
    }
    this.callbacks.onSpeedUpdate(speedKmH);

    // Update Active Game Mode Telemetry
    const modeTelemetry = this.modeManager.update(dt, speedKmH, this.isBoosting, this.isDrifting);
    this.callbacks.onModeTelemetry?.(modeTelemetry);

    // Simulate Ship Core Thermodynamics (°C)
    // Base nominal: 320°C.
    // Speed friction adds up to 180°C.
    // Boost adds +380°C with thermal ramp.
    // Drifting adds +70°C friction.
    // Beam laser heat adds up to +320°C.
    // Black hole tidal radiation / proximity adds up to +520°C in Mode 21.
    const beamHeat = this.beamSystem ? this.beamSystem.getTelemetry().heat : 0;
    const catastropheIdx = this.finalCollapseManager?.catastrophe.currentEventIndex || 1;
    const targetTemp = 320 
      + (speedKmH / 1000) * 170
      + (this.isBoosting ? 380 : 0)
      + (this.isDrifting ? 75 : 0)
      + beamHeat * 3.2
      + (this.activeGameMode === 'BLACK_HOLE' ? Math.min(520, catastropheIdx * 12.5) : 0);
    
    // Smooth thermodynamic dissipation / absorption rate
    const tempRate = targetTemp > this.shipCoreTemperature ? 3.6 : 1.8;
    this.shipCoreTemperature += (targetTemp - this.shipCoreTemperature) * Math.min(1.0, dt * tempRate);
    this.callbacks.onCoreTemperatureUpdate?.(Math.round(this.shipCoreTemperature));

    // Mode 21 — Black Hole cinematic/event layer.
    //
    // The BlackHoleCinematicManager owns the timed presentation sequence.
    // FinalCollapseManager owns the physical catastrophe phase/state.
    // JunctionManager owns the actual playable evacuation route/tower.
    //
    // Keeping these three responsibilities separate prevents the 00:00 event
    // from becoming a HUD-only transition and preserves Modes 01–20.
    if (this.activeGameMode === 'BLACK_HOLE' && this.blackHoleCinematicManager) {
      const isIntroActive = this.raceIntroManager ? this.raceIntroManager.isIntroActive : false;
      const isClockRunning = this.isRacing && !this.isPaused && !isIntroActive;
      this.blackHoleCinematicManager.pauseCountdown(!isClockRunning);
      const blackHoleCinematic = this.blackHoleCinematicManager.update(dt);
      const isFinalCollapse = this.modeManager.blackHoleSubmode === 10;

      // Event 40 is authoritative at the visible 00:00 boundary even if the
      // player has already secured the ship. This allows the protected station
      // aftermath to show the same black hole consuming the outside world.
      if (isFinalCollapse && blackHoleCinematic.finalCountdown === 0 && !this.finalCollapse00Triggered) {
        this.finalCollapse00Triggered = true;
        // 00:00 is the hard escape deadline for Quantum Launch Pro / Final Collapse.
        // A valid safe-zone arrival must have been achieved and validated before 00:00.
        // If not, trigger the authoritative deadline failure.
        const routeProgress = this.junctionManager.playerRouteProgress;
        const hasValidSafeZoneArrival =
          this.finalCollapsePlayerEscaped &&
          (this.finalCollapseManager?.escapeMissions.isMissionCompleted() || this.finalCollapseShipSecured);

        if (!hasValidSafeZoneArrival) {
          this.finalCollapseCatastropheActive = true;
          this.finalCollapsePlayerEscaped = false;
          this.setFinalCollapseAuthoritativeState('FINAL_00_WARNING');
          this.finalCollapseManager.triggerFailure(
            'EVACUATION_DEADLINE_EXPIRED',
            false,
            this.playerShipGroup?.position.clone()
          );
          this.blackHoleCinematicManager.setObjective('00:00 // SAFE ZONE NOT SECURED BEFORE DEADLINE');
          this.blackHoleCinematicManager.start('ESCAPE_SEQUENCE');
        } else {
          // Valid safe-zone arrival was validated prior to 00:00 deadline!
          this.finalCollapsePlayerEscaped = true;
          this.finalCollapseManager?.markSurvived();
          if (this.finalCollapseAuthoritativeState === 'NORMAL_GAMEPLAY') {
            const activeId = routeProgress.activeRouteId;
            if (activeId === 'bh10_escape_route' || this.finalCollapseEscapeRouteEntered) {
              this.setFinalCollapseAuthoritativeState('ROUTE_02_SUCCESS');
            } else if (activeId === 'bh10_wormhole_route' || this.finalCollapseWormholeRouteEntered) {
              this.setFinalCollapseAuthoritativeState('ROUTE_03_SUCCESS');
            } else {
              this.setFinalCollapseAuthoritativeState('ROUTE_01_SUCCESS');
            }
          }
          if (routeProgress.activeRouteId === 'bh10_launcher_route' || this.finalCollapseShelterEntered) {
            this.finalCollapseManager?.onZeroCountdown();
          }
        }
      }

      if (isFinalCollapse && blackHoleCinematic.finalCountdown === 0 && this.finalCollapseManager.catastrophe.currentEventIndex < 100) {
        const finalEvent = this.finalCollapseManager.catastrophe.eventCatalog[99] || this.finalCollapseManager.catastrophe.eventCatalog[this.finalCollapseManager.catastrophe.eventCatalog.length - 1];
        if (finalEvent) this.finalCollapseManager.catastrophe.triggerEvent(finalEvent);
      }

      // Update cosmic visual systems
      if (this.supermassiveBlackHole) {
        if (isFinalCollapse && this.finalCollapseManager) {
          const evtIdx = this.finalCollapseManager.catastrophe.currentEventIndex || 1;
          const inst = Math.min(1.0, (evtIdx - 1) / 99);
          this.supermassiveBlackHole.setEventProgress(evtIdx);
          this.supermassiveBlackHole.setInstability(inst);
          this.supermassiveBlackHole.setThermalShift(inst);
          if (this.collapseEnvironments) {
            this.supermassiveBlackHole.setDetonationProgress(this.collapseEnvironments.detonationProgress);
          }

          // Polar Jet flares during energetic events and scales with collapse progression
          const jetScale = Math.max(0.1, Math.min(1.3, inst * 1.1 + (evtIdx >= 20 ? 0.35 : 0.0)));
          this.supermassiveBlackHole.setPolarJetIntensity(jetScale);

          // Event transition triggers
          if (evtIdx !== this.lastSubmode10EventIndex) {
            this.lastSubmode10EventIndex = evtIdx;

            // Trigger gravitational wave shockwave on wave/collision/collapse milestones
            const isWaveMilestone = [6, 12, 16, 21, 26, 30, 35, 38, 40].includes(evtIdx);
            if (isWaveMilestone) {
              const wavePower = 0.8 + (evtIdx / 40) * 1.4;
              const waveCol = evtIdx >= 30 ? 0xa855f7 : evtIdx >= 20 ? 0x67e8f9 : 0x38bdf8;
              this.supermassiveBlackHole.triggerGravitationalWave(wavePower, waveCol);
              sound.playGravitationalWavePulse(wavePower);
              this.cameraShake = Math.max(this.cameraShake, 1.2 * wavePower);
            }

            // Relativistic time dilation warp on critical late-stage milestones
            if (evtIdx >= 35) {
              sound.playRelativisticTimeDilationWarp(2.2);
            }
          }

          // Dynamic event-horizon infrasound hum
          if (this.playerShipGroup) {
            const bhPos = this.supermassiveBlackHole.root.position;
            const dist = this.playerShipGroup.position.distanceTo(bhPos);
            const distRatio = dist / 310;
            sound.playInfrasoundHorizonHum(inst, distRatio);
          }
        }
        this.supermassiveBlackHole.update(dt, this.camera?.position);
      }
      if (this.planetaryCollision) {
        this.planetaryCollision.update(dt);
      }

      // UPDATE THE SINGLE AUTHORITATIVE SUBMODE-10 CLOCK.
      // All 100 events are derived from this same elapsed time:
      // 15:00 -> Event 01, every 9s -> next event, 00:00 -> Event 100.
      if (this.quantumCountdownClock) {
        const isIntroActive = this.raceIntroManager ? this.raceIntroManager.isIntroActive : false;
        const isClockRunning = this.isRacing && !this.isPaused && !isIntroActive;
        const clockDt = isClockRunning ? dt : 0;
        const clockTelem = this.quantumCountdownClock.update(clockDt);

        const isSubmode10 = this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
        if (isSubmode10) {
          // Keep the legacy cinematic telemetry mirror synchronized, but it is
          // no longer allowed to become an independent 5-minute timer.
          this.blackHoleCinematicManager.finalCountdownSeconds = clockTelem.remainingMs / 1000;
          // Resolve the real catalog entry from the same clock-derived event index.
          // This keeps the number, title, warning text and next-event timing together.
          const masterEvent = getMasterEventByNumber(clockTelem.currentEventNumber);
          const masterNextEvent = clockTelem.nextEventNumber
            ? getMasterEventByNumber(clockTelem.nextEventNumber)
            : null;
          // Detect event transition strictly from the circular countdown clock
          if (clockTelem.currentEventNumber !== this.lastSubmode10EventIndex) {
            this.lastSubmode10EventIndex = clockTelem.currentEventNumber;
            if (this.finalCollapseManager) {
              this.finalCollapseManager.jumpToEvent(clockTelem.currentEventNumber);
            }
            sound.playFinalCollapseMasterAlertAudio(masterEvent.audioCue, masterEvent.severity);
            sound.playFinalCollapseEventAudio(clockTelem.currentEventNumber);
            this.cameraShake = Math.max(this.cameraShake, masterEvent.cameraShake);
          }

          this.blackHoleCinematicManager.setQuantumEventTelemetry({
            index: masterEvent.eventNumber,
            title: masterEvent.eventName,
            subtitle: masterEvent.alertMessage,
            phase: masterEvent.severity,
            severity: masterEvent.severityLevel,
          });
          this.blackHoleCinematicManager.setStage93Telemetry({
            index: masterEvent.eventNumber,
            title: masterEvent.eventName,
            areaName: masterEvent.affectedObject,
            hazardDescription: masterEvent.alertMessage,
            nextTitle: masterNextEvent?.eventName ?? null,
            nextSecondsUntil: clockTelem.secondsUntilNextEvent,
            severity: masterEvent.severityLevel,
          });
          if (this.finalCollapseManager) {
            this.finalCollapseManager.catastrophe.currentEventIndex = masterEvent.eventNumber;
          }

          this.callbacks.onQuantumCountdownUpdate?.(clockTelem);
          // Progressive multi-environment shift as countdown advances in Submode 10
          if (this.environmentDirector) {
            this.environmentDirector.updateBySubmode(10, clockTelem.progressRatio);
          }
        } else {
          // Crucial: for all other 20 game modes and Black Hole submodes 1-9,
          // do NOT emit countdown telemetry so countdown clocks & alerts stay strictly hidden.
          this.callbacks.onQuantumCountdownUpdate?.(null);
        }
      }

      // Update Dynamic Cosmic Environment Director (Atmosphere, Fog, Light, Particles)
      if (this.environmentDirector) {
        const envResult = this.environmentDirector.update(dt);
        this.callbacks.onCosmicBiomeUpdate?.(envResult.biome);
      }

      // Update Expanded Multi-Route Network & Interactive Elements (Boost Gates, Relic Cores, Plasma Vents)
      if (this.quantumRouteSystem) {
        const playerPos = this.playerShipGroup ? this.playerShipGroup.position : new THREE.Vector3();
        const routeInteract = this.quantumRouteSystem.update(dt, playerPos);

        if (routeInteract.boostImpulse > 0) {
          this.currentSpeed = Math.min(380, this.currentSpeed + routeInteract.boostImpulse);
          this.isBoosting = true;
          this.hyperBoostTimer = Math.max(this.hyperBoostTimer, 1.4);
        }
        if (routeInteract.relicsCollected > 0) {
          this.sessionCredits += 100 * routeInteract.relicsCollected;
          this.callbacks.onCreditCollected?.(this.sessionCredits, 100);
        }
        if (routeInteract.damageTaken > 0) {
          this.hullHealth = Math.max(0, this.hullHealth - routeInteract.damageTaken);
          if (this.hullHealth <= 0 && !this.isDestroyed) {
            this.destroyPlayerShip('PLASMA CORONA OVERHEAT');
          }
        }
        if (routeInteract.feedbackMessage) {
          this.callbacks.onHazardHit?.(routeInteract.feedbackMessage);
        }
        if (routeInteract.activeBranchName !== this.lastActiveRouteName) {
          this.lastActiveRouteName = routeInteract.activeBranchName;
          this.callbacks.onActiveRouteBranchUpdate?.(routeInteract.activeBranchName);
        }
      }

      // Update Mode-Specific Environment Manager
      if (this.modeEnvironmentManager) {
        this.modeEnvironmentManager.update(dt, this.splineT, this.currentSpeed);

        // Process Mode-Specific Environmental Hazards & Collectibles
        if (this.modeEnvironmentManager.interactables.length > 0 && this.isRacing && !this.hasFinished && this.playerShipGroup) {
          const pPos = this.playerShipGroup.position;
          for (const item of this.modeEnvironmentManager.interactables) {
            if (item.collected || item.active === false) continue;
            const dist = pPos.distanceTo(item.position);
            if (dist <= item.radius + 2.5) {
              const res = item.onInteract?.(pPos, this.currentSpeed);
              if (res) {
                if (res.collected) {
                  item.collected = true;
                  item.mesh.visible = false;
                  if (res.scoreBonus) this.sessionCredits += res.scoreBonus;
                  if (res.boost) this.boostEnergy = Math.min(100, this.boostEnergy + res.boost);
                  if (res.message) this.callbacks.onHazardHit?.(res.message);
                  sound.playCheckpoint();
                } else if (res.damage && this.collisionCooldown <= 0) {
                  if (this.phaseShieldTimer > 0) {
                    sound.playShieldDeflect();
                    if (this.cameraShakeEnabled) this.cameraShake = 0.35;
                    this.triggerCollisionBurst(pPos, 0x00f0ff, 28);
                    this.collisionCooldown = 0.6;
                    this.callbacks.onHazardHit?.('PHASE SHIELD ABSORBED HAZARD');
                  } else {
                    sound.playCollision();
                    if (this.cameraShakeEnabled) this.cameraShake = 0.75;
                    this.currentSpeed = Math.max(12, this.currentSpeed * 0.55);
                    this.collisionCooldown = 1.0;
                    this.hullHealth = Math.max(0, this.hullHealth - res.damage);
                    this.hitCount++;
                    this.triggerCollisionBurst(pPos, 0xff0055, 30);
                    this.callbacks.onHullUpdate?.(this.hullHealth);
                    if (res.message) this.callbacks.onHazardHit?.(res.message);
                    if (this.hullHealth <= 0) {
                      this.destroyPlayerShip(res.message || 'HULL CRITICALLY BREACHED');
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Update the 15 Dynamic Physical Environments
      if (this.collapseEnvironments) {
        const isSubmode10 = this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
        const currentEvtIdx = isSubmode10 && this.lastSubmode10EventIndex > 0
          ? this.lastSubmode10EventIndex
          : (this.finalCollapseManager?.catastrophe.currentEventIndex || 1);
        const currentEvtPhase = this.finalCollapseManager?.catastrophe.activeEvent?.phase || 'GAMEPLAY';
        const isEvacActive = this.finalCollapseManager?.evacuation.evacuationActive || false;
        const playerPos = this.playerShipGroup ? this.playerShipGroup.position : new THREE.Vector3();
        const camPos = this.camera ? this.camera.position : new THREE.Vector3();

        if (this.playerShipGroup && this.collapseEnvironments.spaghettificationVisuals) {
          this.collapseEnvironments.spaghettificationVisuals.bindPlayerShip(this.playerShipGroup);
        }

        const isMissedEscape =
          (this.finalCollapseManager?.failureCinematic.isActive &&
            this.finalCollapseManager.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE') ||
          false;
        const missedPhase = isMissedEscape ? this.finalCollapseManager!.failureCinematic.currentPhase : 0;
        const authoritativeElapsed =
          this.blackHoleCinematicManager?.finalCountdownSeconds !== null &&
          this.blackHoleCinematicManager?.finalCountdownSeconds !== undefined
            ? (this.blackHoleCinematicManager.finalCountdownSeconds > 0
                ? Math.max(0, 900 - this.blackHoleCinematicManager.finalCountdownSeconds)
                : 900 + (this.blackHoleCinematicManager.postZeroElapsedSeconds || 0))
            : this.finalCollapseManager?.elapsed ?? 0;

        const envUpdate = this.collapseEnvironments.update(
          dt,
          playerPos,
          this.currentSpeed,
          camPos,
          currentEvtIdx,
          currentEvtPhase,
          isEvacActive,
          isMissedEscape,
          missedPhase,
          authoritativeElapsed
        );

        if (envUpdate.pairTelemetry) {
          this.callbacks.onCosmicPairTelemetry?.(envUpdate.pairTelemetry);
        }

        if (envUpdate.cameraShakeIntensity > 0) {
          this.cameraShake = Math.max(this.cameraShake, envUpdate.cameraShakeIntensity);
        }

        // Apply physical gameplay & camera responses from authoritative 100 events
        if (this.collapseEnvironments.part1EventManager) {
          const reqCam = this.collapseEnvironments.part1EventManager.requestedCameraReaction;
          if (reqCam === 'SUBTLE_SHAKE') {
            this.cameraShake = Math.max(this.cameraShake, 0.5);
          } else if (reqCam === 'CINEMATIC_FOCUS' || reqCam === 'BLACK_HOLE_FOCUS') {
            this.cameraShake = Math.max(this.cameraShake, 0.9);
          }

          const reqGrav = this.collapseEnvironments.part1EventManager.requestedGravityAddition;
          if (reqGrav > 0) {
            // Smooth gravitational turbulence without teleportation
            this.lateralOffset += (Math.random() - 0.5) * reqGrav * dt * 3.5;
          }
        }

        if (envUpdate.collisionEvent && !this.shelterNavigationActive) {
          this.hullHealth = Math.max(0, this.hullHealth - envUpdate.collisionEvent.damage);
          this.lateralOffset += envUpdate.collisionEvent.impulse.x * dt * 0.2;
          this.cameraShake = Math.max(this.cameraShake, 1.8);
          this.callbacks.onHazardHit?.(`COLLISION: ${envUpdate.collisionEvent.name}`);
          if (this.hullHealth <= 0 && !this.isDestroyed) {
            this.destroyPlayerShip('COLLISION WITH DEBRIS');
          }
        }

        if (envUpdate.blackScreenActive && this.finalCollapseManager) {
          this.finalCollapseManager.failureCinematic.blackScreenActive = true;
        }
      }

      if (isFinalCollapse) {
        const event = blackHoleCinematic.event as string;

        // Quantum Launch Pro escape window: Event 99 begins the final physical escape
        // sequence before Event 100 Absolute Destruction. The player still has to physically enter
        // the existing Submode-10 evacuation branch; SHIP_SECURED remains the
        // only success condition.
        const qlpEventIndex = this.finalCollapseManager?.catastrophe.currentEventIndex || 0;
        if ((qlpEventIndex >= 99 || blackHoleCinematic.finalCountdown === 0) && this.finalCollapseManager && !this.finalCollapseManager.evacuation.evacuationSuccess && !this.finalCollapseManager.evacuation.evacuationFailed) {
          if (blackHoleCinematic.event !== 'ESCAPE_SEQUENCE') {
            this.blackHoleCinematicManager.start('ESCAPE_SEQUENCE');
          }
          // The actual physical collapse-front/escape route becomes active
          // exactly at 00:10, matching Horizon Break. Earlier events remain
          // environmental/cosmic changes without prematurely consuming the
          // playable route.
          if (!this.finalCollapseCatastropheActive) {
            this.finalCollapseCatastropheActive = true;
            this.finalCollapseManager.beginTrackCollapse();
            this.supermassiveBlackHole?.setInstability(0.92);
            this.cameraShake = Math.max(this.cameraShake, 1.4);
          }
          this.blackHoleCinematicManager.setObjective('HORIZON BREAK // REACH ORBITAL LAUNCHER');
        }

        // Dynamic fog & far clip adjustment: clear fog during cosmic aftermath scenes
        if (this.scene.fog instanceof THREE.FogExp2) {
          const isCosmicView =
            event === 'TOWER_REVEAL' ||
            event === 'WORLD_COLLAPSE' ||
            event === 'PLANETARY_COLLISION' ||
            event === 'FINAL_SINGULARITY' ||
            event === 'COSMIC_LIGHT_EVENT' ||
            event === 'FLASHBANG' ||
            event === 'SILENCE' ||
            event === 'TOWER_REVEAL_RETURN';
          const targetDensity = isCosmicView ? 0.00003 : 0.0012;
          this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetDensity, dt * 2.5);
          this.camera.far = isCosmicView ? 15000 : 4000;
          this.camera.updateProjectionMatrix();
        }

        // Keep physical FinalCollapseManager in sync with authoritative player state
        if (this.finalCollapseManager) {
          const playerPos = this.playerShipGroup ? this.playerShipGroup.position : new THREE.Vector3();
          const playerQuat = this.playerShipGroup ? this.playerShipGroup.quaternion : new THREE.Quaternion();
          const entranceWorld = this.junctionManager.towerEntranceWorldPosition ?? new THREE.Vector3(0, 0, -900);
          const bay07World = this.junctionManager.bay07WorldPosition ?? new THREE.Vector3(0, -14, -1085);
          const bhCenter = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);

          let countdownTimelineSec: number | undefined = undefined;
          if (this.quantumCountdownClock) {
            const initialDurSec = Math.max(30, this.quantumCountdownClock.initialDurationMs / 1000);
            countdownTimelineSec = (this.quantumCountdownClock.elapsedMs / 1000) * (900 / initialDurSec);
          }

          const collapseUpdate = this.finalCollapseManager.update(
            dt,
            {
              position: playerPos,
              quaternion: playerQuat,
              speedMps: this.currentSpeed,
              splineT: this.splineT,
              totalTrackLengthM: this.track ? this.track.totalLength : 2500,
              towerEntrancePos: entranceWorld,
              bay07Pos: bay07World,
              shelterNavigationActive: this.shelterNavigationActive,
              shelterX: this.shelterX,
              shelterZ: this.shelterZ,
              shelterHeading: this.shelterHeading,
              blackHoleCenter: bhCenter,
            },
            countdownTimelineSec
          );

          // Forward authoritative telemetry to cinematic manager for unified HUD
          this.blackHoleCinematicManager.setEvacuationTelemetry(collapseUpdate.telemetry);

          // Synchronize authoritative state for Missed Escape sequence (11 distinct phases)
          if (this.finalCollapseManager.failureCinematic.isActive) {
            const fc = this.finalCollapseManager.failureCinematic;
            if (fc.endingVariant === 'MISSED_ESCAPE_COLLAPSE') {
              if (fc.completed) {
                this.setFinalCollapseAuthoritativeState('FINAL_RESULTS');
              } else {
                switch (fc.currentPhase) {
                  case 1:
                    this.setFinalCollapseAuthoritativeState('FINAL_00_WARNING');
                    break;
                  case 2:
                    this.setFinalCollapseAuthoritativeState('FINAL_PLAYER_FALL');
                    break;
                  case 3:
                    this.setFinalCollapseAuthoritativeState('FINAL_ROTATION');
                    break;
                  case 4:
                  case 5:
                  case 6:
                    this.setFinalCollapseAuthoritativeState('FINAL_SINGULARITY_CHARGE');
                    break;
                  case 7:
                    this.setFinalCollapseAuthoritativeState('FINAL_COSMIC_DETONATION');
                    break;
                  case 8:
                    this.setFinalCollapseAuthoritativeState('FINAL_COMPLETE_DESTRUCTION');
                    break;
                  case 9:
                    this.setFinalCollapseAuthoritativeState('FINAL_AFTERMATH');
                    break;
                  case 10:
                    this.setFinalCollapseAuthoritativeState('FINAL_RECONSTRUCTION');
                    break;
                  case 11:
                    this.setFinalCollapseAuthoritativeState('FINAL_CAMERA_REVEAL');
                    break;
                }
              }
            }
          }

          // Missed-all-routes ending finishes with the cosmic rebuild, then
          // hands off to the existing Final Collapse results screen.
          if (
            this.finalCollapseManager.failureCinematic.completed &&
            this.finalCollapseManager.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE' &&
            !this.finalCollapseRaceFinishSent
          ) {
            this.finalCollapseRaceFinishSent = true;
            this.setFinalCollapseAuthoritativeState('FINAL_RESULTS');
            this.hasFinished = true;
            this.currentLap = this.totalLaps;
            const finalTime = Date.now() - this.raceStartTime;
            this.callbacks.onRaceFinish(finalTime);
          }

          // Synchronize authoritative state for Escaped sequence (Event 40 cosmic climax outside)
          if (isFinalCollapse && this.finalCollapsePlayerEscaped) {
            const envPhase = this.collapseEnvironments?.absoluteCollapsePhase;
            const currentAuthState = this.finalCollapseAuthoritativeState;
            const canAdvanceToCosmicEnding =
              currentAuthState === 'FINAL_COLLAPSE_ACTIVE' ||
              [
                'FINAL_SINGULARITY_CHARGE',
                'FINAL_COSMIC_DETONATION',
                'FINAL_COMPLETE_DESTRUCTION',
                'FINAL_AFTERMATH',
                'FINAL_RECONSTRUCTION',
                'FINAL_CAMERA_REVEAL',
              ].includes(currentAuthState);

            if (canAdvanceToCosmicEnding && envPhase && envPhase !== 'IDLE') {
              if (envPhase === 'COSMIC_BOOM') {
                this.setFinalCollapseAuthoritativeState('FINAL_COSMIC_DETONATION');
              } else if (envPhase === 'ALL_COLLAPSED') {
                this.setFinalCollapseAuthoritativeState('FINAL_COMPLETE_DESTRUCTION');
              } else if (envPhase === 'SUDDEN_SILENCE' || envPhase === 'BLACK_SCREEN') {
                this.setFinalCollapseAuthoritativeState('FINAL_AFTERMATH');
              } else if (envPhase === 'ROUTE_REBUILD') {
                this.setFinalCollapseAuthoritativeState('FINAL_RECONSTRUCTION');
              } else if (envPhase === 'SINGULARITY_ECHO') {
                this.setFinalCollapseAuthoritativeState('FINAL_CAMERA_REVEAL');
              } else if (envPhase === 'RESULTS_READY') {
                this.setFinalCollapseAuthoritativeState('FINAL_RESULTS');
              } else {
                this.setFinalCollapseAuthoritativeState('FINAL_SINGULARITY_CHARGE');
              }
            }

            // RESULTS ONLY AFTER FINAL DESTRUCTION + RECONSTRUCTION + FINAL CAMERA REVEAL
            if (
              (this.finalCollapseAuthoritativeState === 'FINAL_RESULTS' || envPhase === 'RESULTS_READY') &&
              !this.finalCollapseRaceFinishSent
            ) {
              this.finalCollapseRaceFinishSent = true;
              this.finalCollapseManager?.markSurvived();
              this.hasFinished = true;
              this.currentLap = this.totalLaps;
              const finalTime = Date.now() - this.raceStartTime;
              sound.playFinish();
              this.callbacks.onRaceFinish(finalTime);
            }
          }

          if (this.modeManager.blackHoleSubmode !== 10) {
            const qlpEvent = this.finalCollapseManager.catastrophe.activeEvent;
            this.blackHoleCinematicManager.setQuantumEventTelemetry({
              index: this.finalCollapseManager.catastrophe.currentEventIndex || 0,
              title: qlpEvent?.title ?? null,
              subtitle: qlpEvent?.subtitle ?? null,
              phase: qlpEvent?.phase ?? null,
              severity: qlpEvent?.severity ?? 0,
            });
          }

          // Apply physical impact forces from the active catastrophe event
          if (collapseUpdate.impactForces && !this.shelterNavigationActive) {
            const f = collapseUpdate.impactForces;
            if (Math.abs(f.lateralForce) > 0.001) {
              this.lateralOffset += f.lateralForce * dt * 4.0;
            }
            if (f.cameraShake > 0) {
              this.cameraShake = Math.max(this.cameraShake, f.cameraShake);
            }
            if (f.fovDistortion > 0) {
              this.collisionFovPunch = Math.max(this.collisionFovPunch, f.fovDistortion);
            }
            if (this.playerShipGroup && Math.abs(f.rollDisturbance) > 0.001) {
              this.shipRoll += f.rollDisturbance * 0.15;
            }
          }

          // Update AI evacuation controllers
          if (this.finalCollapseManager.evacuation.evacuationActive) {
            this.finalCollapseManager.aiEvacuation.update(
              dt,
              this.localAIRacers.map(ai => ({
                id: ai.id,
                position: ai.group.position,
                speed: ai.speed,
              }))
            );
          }
        }

        // Update dynamic track debris
        if (this.trackDestruction) {
          const sharedCollapseIndex = this.finalCollapseManager?.catastrophe.currentEventIndex || 0;
          const isSpaghetti =
            sharedCollapseIndex >= 8 ||
            event === 'SPAGHETTIFICATION' ||
            event === 'PLANETARY_COLLISION' ||
            event === 'DESTRUCTION_FRONT' ||
            event === 'WORLD_COLLAPSE' ||
            event === 'FINAL_SINGULARITY' ||
            event === 'AFTERMATH_START' ||
            event === 'TOWER_REVEAL';
          this.trackDestruction.update(dt, isSpaghetti);
          if (isSpaghetti && Math.random() < 0.45) {
            const bhPos = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);
            const refPos = this.playerShipGroup ? this.playerShipGroup.position : new THREE.Vector3(0, 0, -900);
            this.trackDestruction.spawnCollapseBehind(refPos, bhPos, 2);
          }
        }

        // Detect event transitions
        if (event !== this.finalCollapseLastEvent) {
          switch (event) {
            case 'FINAL_SINGULARITY_WARNING':
              if (this.finalCollapsePlayerEscaped) {
                this.finalCollapseManager?.onZeroCountdown();
              }
              this.finalCollapseManager?.beginTrackCollapse();
              this.supermassiveBlackHole?.setInstability(0.85);
              sound.playGravitationalRumble(4.0);
              sound.playEmergencyAlarm();
              this.cameraShake = Math.max(this.cameraShake, 1.2);

              // Spawn physical holographic warning billboards along track
              if (!this.finalCollapseInitialSignsSpawned && this.holographicWarnings && this.track) {
                this.finalCollapseInitialSignsSpawned = true;
                const sample1 = this.track.getSampleAt((this.splineT + 0.05) % 1.0);
                const sample2 = this.track.getSampleAt((this.splineT + 0.12) % 1.0);
                const sample3 = this.track.getSampleAt((this.splineT + 0.20) % 1.0);
                const sample4 = this.track.getSampleAt((this.splineT + 0.28) % 1.0);
                const sample5 = this.track.getSampleAt((this.splineT + 0.36) % 1.0);

                this.holographicWarnings.spawnSign(
                  sample1.point.clone().add(sample1.normal.clone().multiplyScalar(15)),
                  'WARNING: SINGULARITY COLLAPSE',
                  'ALL RACERS — EVACUATE NOW'
                );
                this.holographicWarnings.spawnSign(
                  sample2.point.clone().add(sample2.normal.clone().multiplyScalar(15)),
                  'WARNING: TRACK INSTABILITY',
                  'ROUTE DESTRUCTION DETECTED'
                );
                this.holographicWarnings.spawnSign(
                  sample3.point.clone().add(sample3.normal.clone().multiplyScalar(15)),
                  'GRAVITATIONAL TIDAL FORCES',
                  'SPAGHETTIFICATION INCOMING'
                );
                this.holographicWarnings.spawnSign(
                  sample4.point.clone().add(sample4.normal.clone().multiplyScalar(15)),
                  'ROUTE COLLAPSE // EMERGENCY',
                  'HEAD FOR EVACUATION TOWER'
                );
                this.holographicWarnings.spawnSign(
                  sample5.point.clone().add(sample5.normal.clone().multiplyScalar(15)),
                  'SAFE ZONE DETECTED',
                  'ENTER TOWER BASEMENT'
                );
              }
              break;

            case 'SPAGHETTIFICATION':
            case 'SPAGHETTIFICATION WAVE':
              this.finalCollapseManager?.beginSpaghettification();
              this.cameraShake = Math.max(this.cameraShake, 0.95);
              sound.playEmergencyAlarm();
              break;

            case 'PLANETARY_COLLISION':
            case 'PLANETARY COLLISION':
              this.finalCollapseManager?.beginPlanetaryCollision();
              this.planetaryCollision?.triggerCollision();
              sound.playPlanetaryCollision();
              sound.playHeavyImpact();
              sound.playGravitationalRumble(4.0);
              this.cameraShake = Math.max(this.cameraShake, 2.8);
              break;

            case 'DESTRUCTION_FRONT':
            case 'DESTRUCTION FRONT':
              this.finalCollapseManager?.beginDestructionFront(
                blackHoleCinematic.destructionFrontDistance ?? 2500
              );
              this.cameraShake = Math.max(this.cameraShake, 1.1);
              break;

            case 'EVACUATION':
            case 'EVACUATION CORRIDOR COLLAPSE':
              this.finalCollapseManager?.beginEmergencyRoute();
              // Submode 10 exposes its two physical terminal routes as soon as
              // the emergency/escape phase begins.
              this.junctionManager.setFinalCollapseMode(true);
              if (!this.finalCollapseCatastropheActive) {
                this.finalCollapseCatastropheActive = true;
                this.junctionManager.setFinalCollapseMode(true);

                if (this.playerShipGroup) {
                  this.latestValidCheckpoint = {
                    idx: Math.max(0, this.nextCheckpointIdx - 1),
                    t: this.splineT,
                    pos: this.playerShipGroup.position.clone(),
                  };
                }
              }

              this.blackHoleCinematicManager.activateEscapeRoute();
              this.cameraShake = Math.max(this.cameraShake, 1.0);
              break;

            case 'TOWER_ENTRY':
              this.finalCollapseManager?.beginTowerEntry();
              this.cameraShake = Math.max(this.cameraShake, 0.6);
              break;

            case 'TOWER_SEALING':
              if (this.finalCollapseShelterEntered) {
                this.finalCollapseManager?.sealTower();
                this.blackHoleCinematicManager.setObjective('SHELTER SEALED');
              }
              break;

            case 'PARKING_CLAMPS':
              break;

            case 'SHELTER_SEALING':
              this.junctionManager.setHangarShieldActive(true);
              this.junctionManager.setFinalCollapseDoorOpen(0.0);
              this.junctionManager.setFinalCollapsePressureDoorOpen(0.0);
              sound.playBlastDoorClose();
              break;

            case 'SHELTER_SECURED':
            case 'SHELTER_SEALED':
              this.finalCollapseManager?.sealTower();
              this.hullHealth = 100;
              break;

            case 'WORLD_COLLAPSE':
            case 'COSMIC COLLAPSE':
              this.supermassiveBlackHole?.setInstability(0.95);
              sound.playGravitationalRumble(4.0);
              this.cameraShake = Math.max(this.cameraShake, 1.8);
              break;

            case 'FINAL_SINGULARITY':
            case 'FINAL_SINGULARITY_SURGE':
            case 'FINAL_SINGULARITY_COLLAPSE':
            case 'FINAL_COLLAPSE':
            case 'ABSOLUTE COSMIC END':
              this.finalCollapseManager?.beginFinalCollapse();
              this.supermassiveBlackHole?.setInstability(1.0);
              this.supermassiveBlackHole?.setThermalShift(1.0);
              this.supermassiveBlackHole?.setPolarJetIntensity(1.5);
              this.supermassiveBlackHole?.triggerCollapse();
              sound.playFinalCosmicCollapse();
              sound.playGravitationalRumble(5.0);
              this.cameraShake = Math.max(this.cameraShake, 2.8);
              break;

            case 'COSMIC_LIGHT_EVENT':
            case 'FLASHBANG':
              if (!isFinalCollapse) {
                this.supermassiveBlackHole?.triggerCollapse();
                sound.playFlashbangBoom();
                this.cameraShake = Math.max(this.cameraShake, 3.5);
              }
              break;

            case 'REBUILDING_MAP':
              sound.playGravitationalRumble(1.0);
              break;

            case 'SILENCE':
              sound.playGravitationalRumble(0.2);
              this.trackMeshGroup.visible = false;
              this.localAIRacers.forEach(ai => {
                if (ai.group) ai.group.visible = false;
              });
              this.cameraShake = 0;
              break;

            case 'SURVIVAL_RESULTS':
              this.finalCollapseManager?.markSurvived();
              sound.playFinish();
              break;

            case 'RESULTS_INTRO':
            case 'RESULTS_STATS':
            case 'RESULTS_COMPLETE':
            case 'RESULTS':
              if (!isFinalCollapse) {
                this.finalCollapseManager?.markSurvived();
                if (!this.finalCollapseRaceFinishSent) {
                  this.finalCollapseRaceFinishSent = true;
                  this.hasFinished = true;
                  this.currentLap = this.totalLaps;
                  const finalTime = Date.now() - this.raceStartTime;
                  sound.playFinish();
                  this.callbacks.onRaceFinish(finalTime);
                }
              }
              break;
          }

          this.finalCollapseLastEvent = event;
        }

        // Destruction front distance calculation
        if (this.finalCollapseManager?.catastrophe.currentEventIndex >= 6 || event === 'DESTRUCTION_FRONT' || event === 'EVACUATION' || event === 'SPAGHETTIFICATION') {
          const playerMps = this.currentSpeed;
          const frontMps = 61.5; // ~221 km/h wave
          const diff = playerMps - frontMps;
          this.destructionFrontDistanceAccumulator = Math.max(
            45,
            this.destructionFrontDistanceAccumulator + diff * dt
          );
          this.blackHoleCinematicManager.setDestructionFrontDistance(
            Math.round(this.destructionFrontDistanceAccumulator)
          );
          this.finalCollapseManager?.updateDestructionFront(
            Math.round(this.destructionFrontDistanceAccumulator)
          );
        }

        // Evacuation Tower Approach & Physical Basement Entry
        const entranceWorld = this.junctionManager.towerEntranceWorldPosition ?? new THREE.Vector3(0, 0, -900);
        const bay07World = this.junctionManager.bay07WorldPosition ?? new THREE.Vector3(0, -14, -1085);
        let distToEntrance = 9999;
        if (this.playerShipGroup) {
          distToEntrance = Math.round(this.playerShipGroup.position.distanceTo(entranceWorld));
        }

        // Section 1: Safe-Zone Tower Approach
        if (this.finalCollapseCatastropheActive && (event === 'EVACUATION' || event === 'TOWER_APPROACH' || event === 'TOWER_ENTRY' || event === 'ESCAPE_SEQUENCE')) {
          if (distToEntrance < 350) {
            if (event === 'EVACUATION') {
              this.blackHoleCinematicManager.start('TOWER_APPROACH');
            }
            this.blackHoleCinematicManager.setObjective(`EVACUATION TOWER AHEAD // ${distToEntrance}m`);
          }

          // Gentle speed guidance on final approach zone so player can clearly see entrance
          if (distToEntrance < 140 && this.currentSpeed > 32) {
            this.currentSpeed = Math.max(28, this.currentSpeed - 12 * dt);
          }

          // Section 2: Basement Entry Detection trigger volume
          if (distToEntrance < 45 && this.currentSpeed <= 38) {
            this.finalCollapseEntryReady = true;
            this.blackHoleCinematicManager.setObjective('EVACUATION BAY DETECTED — ENTER BASEMENT');
          }

          // Door opens as player approaches
          if (distToEntrance < 160 && !this.finalCollapseShelterEntered) {
            if (!this.finalCollapseDoorAudioPlayed) {
              this.finalCollapseDoorAudioPlayed = true;
              sound.playBlastDoorOpen();
            }
            const openFrac = THREE.MathUtils.clamp((160 - distToEntrance) / 70, 0, 1);
            this.junctionManager.setFinalCollapseDoorOpen(openFrac);
          }

          // No automatic route selection here. Submode 10 remains explicitly
          // controlled by the player's LEFT/RIGHT arrow choice.

          // Transition player to physical shelter navigation when crossing into entrance
          // Only Route 01's actual terminal can enter the launcher/shelter.
          // Do not switch to the shelter's local coordinate system while the
          // player is still travelling down the branch; that caused a visible
          // snap/teleport into the parking bay.
          const prp = this.junctionManager.playerRouteProgress;
          const launcherTerminalReached =
            (!prp.isInBranch || prp.activeRouteId === 'bh10_launcher_route') &&
            distToEntrance < 60;
          if (launcherTerminalReached && !this.shelterNavigationActive) {
            this.shelterNavigationActive = true;
            this.finalCollapseShelterEntered = true;
            this.shelterZ = 0;
            this.shelterX = THREE.MathUtils.clamp(this.lateralOffset, -8, 8);
            this.currentSpeed = Math.min(this.currentSpeed, 32);
            this.finalCollapseManager?.beginTowerEntry();
            this.blackHoleCinematicManager?.start('BASEMENT_ENTRY');
            this.blackHoleCinematicManager?.setObjective('ORBITAL LAUNCHER // MAGNETIC LOCK ENGAGED');
            sound.playMagneticLock();
            sound.playBlastDoorOpen();
            this.cameraShake = Math.max(this.cameraShake, 0.45);
          }
        }

        // Section 3-8: Physical Basement Navigation & Parking Loop
        if (this.shelterNavigationActive) {
          // Section 3: Tower Door Opening & Threshold Entry
          if (this.shelterZ <= 0 && !this.finalCollapseShelterEntered) {
            this.finalCollapseShelterEntered = true;
            this.blackHoleCinematicManager.start('BASEMENT_ENTRY');
            this.blackHoleCinematicManager.setObjective('ORBITAL LAUNCHER // MAGNETIC LOCK ENGAGED');
            this.junctionManager.setFinalCollapseDoorOpen(1.0);
            sound.playMagneticLock();
            this.cameraShake = Math.max(this.cameraShake, 0.4);
          }

          // Section 4: Acceleration Ring 1
          if (this.shelterZ <= -35 && !this.finalCollapseDescending) {
            this.finalCollapseDescending = true;
            this.blackHoleCinematicManager.start('BASEMENT_DESCENT');
            this.blackHoleCinematicManager.setObjective('ACCELERATION RING 1/3 // KINETIC BOOST');
            sound.playAccelerationRingPass(1);
            this.cameraShake = Math.max(this.cameraShake, 0.6);
          }

          // Section 4B: Acceleration Ring 2
          if (this.shelterZ <= -75 && !this.finalCollapseRing2Passed) {
            this.finalCollapseRing2Passed = true;
            this.blackHoleCinematicManager.setObjective('ACCELERATION RING 2/3 // VELOCITY SURGE');
            sound.playAccelerationRingPass(2);
            this.cameraShake = Math.max(this.cameraShake, 0.75);
          }

          // Section 4C: Acceleration Ring 3
          if (this.shelterZ <= -110 && !this.finalCollapseRing3Passed) {
            this.finalCollapseRing3Passed = true;
            this.blackHoleCinematicManager.setObjective('ACCELERATION RING 3/3 // ORBITAL GATE AHEAD');
            sound.playAccelerationRingPass(3);
            this.cameraShake = Math.max(this.cameraShake, 0.9);
          }

          // Pressure door opening ahead
          if (this.shelterZ <= -110 && this.shelterZ >= -145) {
            const pOpen = THREE.MathUtils.clamp((-110 - this.shelterZ) / 20, 0, 1);
            this.junctionManager.setFinalCollapsePressureDoorOpen(pOpen);
          }

          // Phase 1: Evacuation Hangar B3 Entry & Approach
          if (this.shelterZ <= -140 && !this.finalCollapseHangarEntered) {
            this.finalCollapseHangarEntered = true;
            this.junctionManager.setFinalCollapsePressureDoorOpen(0.0);
            this.junctionManager.setFinalCollapseDoorOpen(0.0);
            this.blackHoleCinematicManager.start('PARKING_APPROACH');
            this.blackHoleCinematicManager.setObjective('EVACUATION BAY 07 // ALIGN SHIP WITH PARKING MARKER');
          }

          // Phase 1-2: Spaceship Parking Logic & Alignment Zone
          const bayDist = Math.hypot(this.shelterX, this.shelterZ - (-185));
          const rotDeg = Math.abs(this.shelterHeading) * (180 / Math.PI);
          const speedKmh = Math.round(this.currentSpeed * 3.6);

          if (this.finalCollapseHangarEntered && !this.finalCollapseShipParked) {
            if (bayDist < 4.5 && speedKmh < 35 && !this.finalCollapseParkingAligned) {
              this.finalCollapseParkingAligned = true;
              this.blackHoleCinematicManager.start('PARKING_ALIGNMENT');
              this.blackHoleCinematicManager.setObjective('ALIGNMENT CONFIRMED — REDUCE SPEED');
            }

            // Phase 2: Automatic Parking Assist trigger
            if (bayDist <= 2.2 && rotDeg <= 18 && (speedKmh <= 15 || this.input.throttle < 0 || this.shelterZ <= -184)) {
              this.finalCollapseShipParked = true;
              sound.playParkingConfirmed();
              this.blackHoleCinematicManager.start('SHIP_PARKING');
              this.blackHoleCinematicManager.setObjective('SHIP PARKED');
            }
          }

          // Phase 3 to 20: Continuous progression
          if (this.finalCollapseShipParked) {
            this.shelterClampTimer += dt;
            const t = this.shelterClampTimer;

            // Phase 3: Sequential Clamps
            const cL = THREE.MathUtils.clamp(t / 0.6, 0, 1);
            if (t >= 0.6 && this.finalCollapseClampStep < 1) {
              this.finalCollapseClampStep = 1;
              sound.playClampLock(0);
            }
            const cR = THREE.MathUtils.clamp((t - 0.7) / 0.6, 0, 1);
            if (t >= 1.3 && this.finalCollapseClampStep < 2) {
              this.finalCollapseClampStep = 2;
              sound.playClampLock(1);
            }
            const cF = THREE.MathUtils.clamp((t - 1.4) / 0.6, 0, 1);
            if (t >= 2.0 && this.finalCollapseClampStep < 3) {
              this.finalCollapseClampStep = 3;
              sound.playClampLock(2);
            }
            const cB = THREE.MathUtils.clamp((t - 2.1) / 0.6, 0, 1);
            if (t >= 2.7 && this.finalCollapseClampStep < 4) {
              this.finalCollapseClampStep = 4;
              sound.playClampLock(3);
            }

            this.junctionManager.setClampsProgress(cL, cR, cF, cB);

            // Phase 4: Pilot safe confirmation
            if (t >= 2.8 && !this.finalCollapseShipSecured) {
              this.finalCollapseShipSecured = true;
              const remainingSec = this.quantumCountdownClock?.getRemainingSeconds() ?? (this.blackHoleCinematicManager?.finalCountdownSeconds ?? 900);
              const validated = this.finalCollapseManager?.escapeMissions.validateSafeZoneEntry(remainingSec);
              if (validated) {
                this.finalCollapsePlayerEscaped = true;
                this.finalCollapseEscapedRouteId = 'bh10_launcher_route';
                this.finalCollapseManager?.markSurvived();
                this.setFinalCollapseAuthoritativeState('ROUTE_01_SUCCESS');
                this.blackHoleCinematicManager.start('SHIP_SECURED');
                this.blackHoleCinematicManager.setObjective('ROUTE 01 // ORBITAL SANCTUARY SECURED');
                this.callbacks.onShortcutUsed?.('ROUTE 01 // ORBITAL SANCTUARY SECURED');
              } else {
                this.finalCollapsePlayerEscaped = false;
                this.blackHoleCinematicManager.setObjective('ROUTE 01 // DEADLINE EXPIRED — SANCTUARY BREACHED');
              }
            }

            // Phase 5: Hangar Sealing
            if (t >= 4.5 && !this.finalCollapseHangarSealed) {
              this.finalCollapseHangarSealed = true;
              this.junctionManager.setHangarShieldActive(true);
              this.junctionManager.setFinalCollapseDoorOpen(0.0);
              this.junctionManager.setFinalCollapsePressureDoorOpen(0.0);
              if (!this.finalCollapseDoorSealedAudioPlayed) {
                this.finalCollapseDoorSealedAudioPlayed = true;
                sound.playBlastDoorClose();
              }
              this.finalCollapseManager?.sealTower();
              this.blackHoleCinematicManager.start('SHELTER_SEALED');
              this.blackHoleCinematicManager.setObjective('ROUTE 01 // ESCAPE SUCCESSFUL');
              this.hullHealth = 100;
            }

            // Phase 6: Camera leaves the spaceship -> Aftermath Start
            if (t >= 7.0 && !this.finalCollapseAftermathStarted) {
              this.finalCollapseAftermathStarted = true;
              this.setFinalCollapseAuthoritativeState('FINAL_COLLAPSE_ACTIVE');
              this.blackHoleCinematicManager.start('AFTERMATH_START');
              this.blackHoleCinematicManager.setObjective('SAFE ZONE SECURED // EXTERNAL COLLAPSE ACTIVE');
            }
          }

          // Feed telemetry to UI
          this.blackHoleCinematicManager.setParkingTelemetry({
            bayId: 'BAY 07',
            distanceToBay: Math.round(bayDist * 10) / 10,
            isAligned: this.finalCollapseParkingAligned,
            alignmentScore: Math.max(0, Math.min(100, Math.round((1 - bayDist / 6) * 100))),
            positionErrorM: Math.round(bayDist * 10) / 10,
            rotationErrorDeg: Math.round(rotDeg),
            currentSpeedKmh: speedKmh,
            targetSpeedKmh: 15,
            clampsLocked: {
              left: this.finalCollapseClampStep >= 1,
              right: this.finalCollapseClampStep >= 2,
              front: this.finalCollapseClampStep >= 3,
              rear: this.finalCollapseClampStep >= 4,
            },
            isParked: this.finalCollapseShipParked,
            isSecured: this.finalCollapseShipSecured,
            isHangarSealed: this.finalCollapseHangarSealed,
          });

          this.blackHoleCinematicManager.setTowerApproachTelemetry({
            distanceToEntrance: Math.round(distToEntrance),
            entryReady: this.finalCollapseEntryReady,
            level: this.shelterZ <= -128 ? 'B3' : this.shelterZ <= -32 ? 'RAMP' : 'SURFACE',
          });
        }

        // Finish race upon RESULTS
        if (
          !isFinalCollapse &&
          (event === 'RESULTS' || event === 'RESULTS_COMPLETE') &&
          !this.finalCollapseRaceFinishSent
        ) {
          this.finalCollapseRaceFinishSent = true;
          this.finalCollapseManager?.markSurvived();
          this.hasFinished = true;
          this.currentLap = this.totalLaps;
          const finalTime = Date.now() - this.raceStartTime;
          sound.playFinish();
          this.callbacks.onRaceFinish(finalTime);
        }
      }

      this.callbacks.onBlackHoleCinematicTelemetry?.(this.blackHoleCinematicManager.getTelemetry());
    }

    // Mode 01: Singularity Run (Black Hole System)
    if (this.activeGameMode === 'SINGULARITY_RUN' && this.blackHoleManager) {
      const bhUpdate = this.blackHoleManager.update(dt, this.playerShipGroup.position, this.currentSpeed);
      this.callbacks.onSingularityTelemetry?.(bhUpdate.telemetry);

      if (bhUpdate.slingshotMult > 1.0) {
        this.currentSpeed = Math.min(this.currentSpeed * bhUpdate.slingshotMult, 440 / 3.6);
      }

      if (bhUpdate.isConsumed && !this.isDestroyed) {
        this.destroyPlayerShip('CONSUMED BY EVENT HORIZON');
      }

      if (bhUpdate.escaped && !this.hasFinished) {
        this.hasFinished = true;
        this.currentLap = this.totalLaps;
        const finalTime = Date.now() - this.raceStartTime;
        sound.playFinish();
        this.callbacks.onRaceFinish(finalTime);
      }
    }

    // 19 Non-Black-Hole Unique Modes Entity & Systems Update
    if (this.activeGameMode !== 'SINGULARITY_RUN' && this.modeEntitySystem) {
      this.modeEntitySystem.update(
        dt,
        this.playerShipGroup.position,
        speedKmH,
        this.splineT,
        speedDelta => {
          this.currentSpeed = Math.max(20 / 3.6, Math.min(540 / 3.6, this.currentSpeed + speedDelta / 3.6));
        },
        newT => {
          this.splineT = newT;
          if (this.track && this.track.curve) {
            this.playerShipGroup.position.copy(this.track.curve.getPointAt(newT));
          }
        },
        specialty => {
          if (specialty === 'HANDLING') {
            this.boostEnergy = Math.min(100, this.boostEnergy + 50);
          } else if (specialty === 'BOOST') {
            this.boostEnergy = 100;
            this.phaseShieldTimer = 6;
            this.damageZones.shieldCore = 100;
          }
        }
      );

      // Mode 07: Plasma Storm Loss Condition
      if (this.activeGameMode === 'PLASMA_STORM' && this.modeManager.stormWallDistance <= 0 && !this.isDestroyed) {
        this.destroyPlayerShip('VAPORIZED BY PLASMA STORM WALL');
      }

      // Mode 11: Energy Heist Loss Condition
      if (
        this.activeGameMode === 'ENERGY_HEIST' &&
        this.modeManager.heistTimer <= 0 &&
        !this.isDestroyed &&
        !this.hasFinished
      ) {
        this.destroyPlayerShip('HEIST EXTRACTION TIMED OUT');
      }

      // Mode 13: Collapsing Track Loss Condition
      if (this.activeGameMode === 'COLLAPSING_TRACK' && this.modeManager.collapseGap <= 0 && !this.isDestroyed) {
        this.destroyPlayerShip('CONSUMED BY DISINTEGRATING TRACK VOID');
      }

      // Mode 16: Rival Duel Gap to Zer0
      if (this.activeGameMode === 'RIVAL_DUEL' && this.localAIRacers.length > 0) {
        const rival = this.localAIRacers[0];
        const gap = this.playerShipGroup.position.distanceTo(rival.group.position);
        this.modeManager.rivalGapMeters = this.totalDistanceTraveled >= rival.progressDistance ? gap : -gap;
      }

      // Mode 18: Survival Elimination Knockout Logic
      if (this.activeGameMode === 'SURVIVAL_ELIMINATION' && this.isRacing && !this.hasFinished) {
        if (this.modeManager.eliminationTimer <= 0.05) {
          const playerRank = this.getPlayerRank();
          const totalRacers = 1 + this.localAIRacers.length;
          if (playerRank >= totalRacers && !this.isDestroyed) {
            this.destroyPlayerShip('ELIMINATED BY ORBITAL DEFENSE CANNON');
          } else if (this.localAIRacers.length > 0) {
            const slowest = this.localAIRacers.reduce((prev, curr) =>
              curr.progressDistance < prev.progressDistance ? curr : prev
            );
            sound.playExplosion();
            this.scene.remove(slowest.group);
            this.localAIRacers = this.localAIRacers.filter(r => r.id !== slowest.id);
          }
        }
      }
    }

    if (this.isRacing) {
      const pos = this.playerShipGroup.position;
      const quat = this.playerShipGroup.quaternion;
      const raceState: PlayerRaceState = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        qx: quat.x,
        qy: quat.y,
        qz: quat.z,
        qw: quat.w,
        speed: speedKmH,
        boost: Math.round(this.boostEnergy),
        isBoosting: this.isBoosting,
        isDrifting: this.isDrifting,
        lap: this.currentLap,
        currentCheckpoint: this.nextCheckpointIdx,
        progressDistance: this.totalDistanceTraveled,
        currentRouteId: this.junctionManager.playerRouteProgress.activeRouteId,
        junctionId: this.junctionManager.playerRouteProgress.activeJunctionId,
      };
      networkClient.sendPlayerUpdate(raceState);
    }
  }

  private buildFinalCollapseEscapeSequence(routeId: 'bh10_escape_route' | 'bh10_wormhole_route') {
    if (!this.finalCollapseTerminalPoint || !this.finalCollapseTerminalTangent) return;
    if (this.finalCollapseEscapeSequenceGroup) this.scene.remove(this.finalCollapseEscapeSequenceGroup);

    const g = new THREE.Group();
    const tangent = this.finalCollapseTerminalTangent.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
    if (side.lengthSq() < 0.01) side.set(1, 0, 0);
    const local = (x:number,y:number,z:number) => this.finalCollapseTerminalPoint!.clone().add(side.clone().multiplyScalar(x)).add(up.clone().multiplyScalar(y)).add(tangent.clone().multiplyScalar(z));

    const accent = routeId === 'bh10_escape_route' ? 0xff5a36 : 0xa855f7;
    const glow = routeId === 'bh10_escape_route' ? 0xffc266 : 0x7dd3fc;
    const mat = (color:number, emissive=color, opacity=1) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 2.5, transparent: opacity < 1, opacity, metalness: 0.2, roughness: 0.25 });

    // Route-specific corridor hardware: physical-looking gates, beacons and energy structures.
    for (let i=0;i<5;i++) {
      const z = -18 - i*22;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(routeId === 'bh10_escape_route' ? 12 : 14, 0.55, 12, 48), mat(accent));
      ring.position.copy(local(0, 3.5, z));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), tangent);
      g.add(ring);
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,5,12), mat(glow));
      beacon.position.copy(local(10, 2, z));
      beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), up);
      g.add(beacon);
      const beacon2 = beacon.clone(); beacon2.position.copy(local(-10,2,z)); g.add(beacon2);
    }

    if (routeId === 'bh10_escape_route') {
      for (let i=0;i<9;i++) {
        const debris = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + (i%3)*0.45, 1), mat(0x5a6475, accent));
        debris.position.copy(local((i%2?1:-1)*(7+i%4*1.7), 2 + (i%3)*2, -8-i*14));
        g.add(debris);
      }
      const barrier = new THREE.Mesh(new THREE.TorusGeometry(17, 0.9, 12, 64), mat(accent, glow, 0.65));
      barrier.position.copy(local(0, 4, -125));
      barrier.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), tangent);
      g.add(barrier);
    } else {
      for (let i=0;i<6;i++) {
        const worm = new THREE.Mesh(new THREE.TorusGeometry(7+i*1.2, 0.32, 10, 48), mat(glow, accent, 0.72));
        worm.position.copy(local(0, 4, -12-i*19));
        worm.rotation.x = Math.PI/2;
        g.add(worm);
      }
      const portal = new THREE.Mesh(new THREE.TorusGeometry(12, 1.15, 16, 64), mat(accent, glow, 0.85));
      portal.position.copy(local(0, 4, -132));
      portal.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), tangent);
      g.add(portal);
      const core = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 24), mat(0x090014, accent, 0.82));
      core.position.copy(local(0, 4, -132));
      g.add(core);
    }

    this.scene.add(g);
    this.finalCollapseEscapeSequenceGroup = g;
    this.finalCollapseEscapeSequenceRoute = routeId === 'bh10_escape_route' ? 'ROUTE_02' : 'ROUTE_03';
  }

  private updateFinalCollapseEscapeSequenceVisuals(dt:number, t:number, routeId:string|null) {
    if (routeId !== 'bh10_escape_route' && routeId !== 'bh10_wormhole_route') return;
    if (!this.finalCollapseEscapeSequenceGroup || this.finalCollapseEscapeSequenceRoute !== (routeId === 'bh10_escape_route' ? 'ROUTE_02' : 'ROUTE_03')) {
      this.buildFinalCollapseEscapeSequence(routeId as 'bh10_escape_route' | 'bh10_wormhole_route');
    }
    const g = this.finalCollapseEscapeSequenceGroup;
    if (!g) return;
    const pulse = 1 + Math.sin(t * 5.5) * 0.08;
    g.children.forEach((obj, i) => {
      obj.rotation.y += dt * (0.35 + (i % 4) * 0.08);
      obj.rotation.z += dt * (0.12 + (i % 3) * 0.05);
      const s = (i % 5 === 0) ? pulse : 1;
      obj.scale.setScalar(s);
    });
    const intensity = Math.min(3.5, 1.5 + t * 0.35);
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m:any) => { if (m && 'emissiveIntensity' in m) m.emissiveIntensity = intensity; });
    });
  }

  private updateShipTransform(dt: number) {
    if (!this.playerShipGroup) return;

    // Mode 21 — Physical Gravitational Capture Trajectory during Failure Cinematic (Phase 2+ for missed escape, 4+ for others)
    const minCapturePhase = this.finalCollapseManager?.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE' ? 2 : 4;
    if (
      this.finalCollapseManager?.failureCinematic.isActive &&
      this.finalCollapseManager.failureCinematic.currentPhase >= minCapturePhase
    ) {
      this.playerShipGroup.position.copy(this.finalCollapseManager.failureCinematic.shipCurrentTrajectory);
      this.playerShipGroup.rotation.copy(this.finalCollapseManager.failureCinematic.shipRotation);
      return;
    }

    // Mode 21 Submode 10: Routes 02/03 have real terminal endpoints. Once
    // the endpoint is reached, keep the ship physically there and run a short
    // route-specific escape sequence. Never fall back to the main spline.
    if (this.finalCollapseTerminalRouteId && this.finalCollapseTerminalPoint && this.finalCollapseTerminalTangent) {
      this.finalCollapseTerminalSequenceElapsed += dt;
      const t = this.finalCollapseTerminalSequenceElapsed;
      this.currentSpeed = Math.max(0, this.currentSpeed - 70 * dt);
      this.updateFinalCollapseEscapeSequenceVisuals(dt, t, this.finalCollapseTerminalRouteId);
      this.playerShipGroup.position.copy(this.finalCollapseTerminalPoint);
      const tangent = this.finalCollapseTerminalTangent.clone().normalize();
      const look = this.playerShipGroup.position.clone().add(tangent);
      this.playerShipGroup.lookAt(look);
      this.playerShipGroup.position.y += 1.6;

      if (this.finalCollapseTerminalRouteId === 'bh10_escape_route') {
        if (t >= 0.8 && t < 2.0) {
          this.setFinalCollapseAuthoritativeState('ROUTE_02_SEQUENCE');
          this.blackHoleCinematicManager?.setObjective('ROUTE 02 // ESCAPE VECTOR LOCKED');
        }
        if (t >= 2.0 && t < 3.5) this.blackHoleCinematicManager?.setObjective('ROUTE 02 // EMERGENCY GATE OPENING');
        if (t >= 3.5 && t < 5.0) this.blackHoleCinematicManager?.setObjective('ROUTE 02 // ESCAPE THRUST ARMED');
        if (t >= 5.0 && !this.finalCollapseTerminalSequenceComplete) {
          this.finalCollapseTerminalSequenceComplete = true;
          const remainingSec = this.quantumCountdownClock?.getRemainingSeconds() ?? (this.blackHoleCinematicManager?.finalCountdownSeconds ?? 900);
          const validated = this.finalCollapseManager?.escapeMissions.validateSafeZoneEntry(remainingSec);
          if (validated) {
            this.finalCollapsePlayerEscaped = true;
            this.finalCollapseEscapedRouteId = 'bh10_escape_route';
            this.finalCollapseManager?.markSurvived();
            this.setFinalCollapseAuthoritativeState('ROUTE_02_SUCCESS');
            this.blackHoleCinematicManager?.setObjective('ROUTE 02 // SUBTERRANEAN BUNKER SECURED');
            this.callbacks.onShortcutUsed?.('ROUTE 02 // SUBTERRANEAN BUNKER SECURED');
          } else {
            this.finalCollapsePlayerEscaped = false;
            this.blackHoleCinematicManager?.setObjective('ROUTE 02 // DEADLINE EXPIRED — BUNKER COLLAPSED');
          }
        }
        if (t >= 7.5 && this.finalCollapseAuthoritativeState === 'ROUTE_02_SUCCESS') {
          this.setFinalCollapseAuthoritativeState('FINAL_COLLAPSE_ACTIVE');
          this.blackHoleCinematicManager?.setObjective('SAFE ZONE SECURED // EXTERNAL COLLAPSE ACTIVE');
        }
      } else {
        if (t >= 0.8 && t < 2.0) {
          this.setFinalCollapseAuthoritativeState('ROUTE_03_SEQUENCE');
          this.blackHoleCinematicManager?.setObjective('ROUTE 03 // WORMHOLE STABILIZING');
        }
        if (t >= 2.0 && t < 3.5) this.blackHoleCinematicManager?.setObjective('ROUTE 03 // WORMHOLE GATE OPEN');
        if (t >= 3.5 && t < 5.0) this.blackHoleCinematicManager?.setObjective('ROUTE 03 // TRANSIT VECTOR ARMED');
        if (t >= 5.0 && !this.finalCollapseTerminalSequenceComplete) {
          this.finalCollapseTerminalSequenceComplete = true;
          const remainingSec = this.quantumCountdownClock?.getRemainingSeconds() ?? (this.blackHoleCinematicManager?.finalCountdownSeconds ?? 900);
          const validated = this.finalCollapseManager?.escapeMissions.validateSafeZoneEntry(remainingSec);
          if (validated) {
            this.finalCollapsePlayerEscaped = true;
            this.finalCollapseEscapedRouteId = 'bh10_wormhole_route';
            this.finalCollapseManager?.markSurvived();
            this.setFinalCollapseAuthoritativeState('ROUTE_03_SUCCESS');
            this.blackHoleCinematicManager?.setObjective('ROUTE 03 // EINSTEIN-ROSEN GATEWAY SECURED');
            this.callbacks.onShortcutUsed?.('ROUTE 03 // EINSTEIN-ROSEN GATEWAY SECURED');
          } else {
            this.finalCollapsePlayerEscaped = false;
            this.blackHoleCinematicManager?.setObjective('ROUTE 03 // DEADLINE EXPIRED — GATEWAY COLLAPSED');
          }
        }
        if (t >= 7.5 && this.finalCollapseAuthoritativeState === 'ROUTE_03_SUCCESS') {
          this.setFinalCollapseAuthoritativeState('FINAL_COLLAPSE_ACTIVE');
          this.blackHoleCinematicManager?.setObjective('SAFE ZONE SECURED // EXTERNAL COLLAPSE ACTIVE');
        }
      }

      const flameScale = 0.8 + this.currentSpeed / 40;
      this.playerThrusters.forEach(flame => flame.scale.set(1, flameScale, 1));
      return;
    }

    // Mode 21 Submode 10: Physical driving inside the Evacuation Shelter & Hangar
    if (this.shelterNavigationActive && this.junctionManager.finalCollapseShelter) {
      const shelter = this.junctionManager.finalCollapseShelter;
      shelter.updateMatrixWorld(true);

      // Local Y based on ramp slope (ramp starts at z = -32, ends at z = -128, lowering to y = -14)
      if (this.shelterZ > -32) {
        this.shelterY = 0;
      } else if (this.shelterZ >= -128) {
        const rampFrac = (-this.shelterZ - 32) / 96;
        this.shelterY = THREE.MathUtils.lerp(0, -14, rampFrac);
      } else {
        this.shelterY = -14;
      }

      // Smooth hover height: lowers slightly onto platform when parked
      const hoverHeight = 1.6 + Math.sin(Date.now() * 0.006) * 0.15;
      const currentHover = this.finalCollapseShipParked ? 0.35 : hoverHeight;
      const localPos = new THREE.Vector3(this.shelterX, this.shelterY + currentHover, this.shelterZ);
      this.playerShipGroup.position.copy(localPos.applyMatrix4(shelter.matrixWorld));

      // Slope pitch + steering heading and roll
      const rampSlope = (this.shelterZ <= -32 && this.shelterZ >= -128) ? Math.atan2(14, 96) : 0;
      const targetRoll = -this.input.steer * 0.35;
      this.shipRoll = THREE.MathUtils.lerp(this.shipRoll, targetRoll, 0.1);
      const euler = new THREE.Euler(rampSlope, this.shelterHeading, this.shipRoll, 'YXZ');
      const rot = new THREE.Quaternion().setFromEuler(euler);
      this.playerShipGroup.quaternion.copy(shelter.quaternion).multiply(rot);

      const flameScale = 0.8 + this.currentSpeed / 40;
      this.playerThrusters.forEach(flame => {
        flame.scale.set(1, flameScale, 1);
      });
      return;
    }

    let sample: SamplePoint;
    const hoverHeight = 1.6 + Math.sin(Date.now() * 0.006) * 0.15;
    const prp = this.junctionManager.playerRouteProgress;

    if (prp.isInBranch && prp.branchRouteInstance) {
      const branchSample = prp.branchRouteInstance.getSampleAt(prp.progress);
      if (prp.transitionBlend < 1.0) {
        const mainSample = this.track.getSampleAt(this.splineT);
        const tBlend = prp.transitionBlend;
        const blendedPoint = mainSample.point.clone().lerp(branchSample.point, tBlend);
        const blendedTangent = mainSample.tangent.clone().lerp(branchSample.tangent, tBlend).normalize();
        const blendedNormal = mainSample.normal.clone().lerp(branchSample.normal, tBlend).normalize();
        const blendedBinormal = mainSample.binormal.clone().lerp(branchSample.binormal, tBlend).normalize();
        sample = { t: prp.progress, point: blendedPoint, tangent: blendedTangent, normal: blendedNormal, binormal: blendedBinormal };
      } else {
        sample = branchSample;
      }
    } else {
      sample = this.track.getSampleAt(this.splineT);
    }

    _shipOffsetBinormal.copy(sample.binormal).multiplyScalar(this.lateralOffset);
    _shipOffsetNormal.copy(sample.normal).multiplyScalar(hoverHeight);
    _shipPos.copy(sample.point).add(_shipOffsetBinormal).add(_shipOffsetNormal);

    if (isFinite(_shipPos.x) && isFinite(_shipPos.y) && isFinite(_shipPos.z)) {
      this.playerShipGroup.position.copy(_shipPos);
    }

    const targetRoll = -this.input.steer * (this.isDrifting ? 0.75 : 0.45);
    this.shipRoll = THREE.MathUtils.lerp(this.shipRoll, targetRoll, 0.12);

    _shipNegTangent.copy(sample.tangent).negate();
    if (sample.binormal.lengthSq() > 0.001 && sample.normal.lengthSq() > 0.001 && _shipNegTangent.lengthSq() > 0.001) {
      _shipRotMatrix.makeBasis(sample.binormal, sample.normal, _shipNegTangent);
      this.playerShipGroup.quaternion.setFromRotationMatrix(_shipRotMatrix);
    }

    this.playerShipGroup.rotateZ(this.shipRoll);
    if (Math.abs(this.playerCollisionAngularDisplacement) > 0.001) {
      this.playerShipGroup.rotateY(this.playerCollisionAngularDisplacement);
    }

    const flameScale = this.currentSpeed < 0
      ? 0.45 + Math.abs(this.currentSpeed) / 40
      : 0.8 + this.currentSpeed / 40 + (this.isBoosting ? 1.6 : 0);
    this.playerThrusters.forEach(flame => {
      flame.scale.set(1 + (this.isBoosting ? 0.6 : 0), flameScale, 1 + (this.isBoosting ? 0.6 : 0));
    });
  }

  private checkTrackTriggers() {
    if (!this.playerShipGroup || !this.isRacing || this.hasFinished) return;
    const shipPos = this.playerShipGroup.position;

    // Check main track boost pads
    for (const pad of this.track.boostPads) {
      if (shipPos.distanceTo(pad.position) < 8.0) {
        const shipConfig = getEffectiveShipStats(
          getShipConfig(this.localShipId),
          this.localUpgrades
        );
        this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.55, this.currentSpeed + 25);
        this.boostEnergy = Math.min(100, this.boostEnergy + 20);
        this.cameraShake = 0.4;
        sound.playBoostPad();
        break;
      }
    }

    // Check branch route boost pads
    const prp = this.junctionManager.playerRouteProgress;
    if (prp.isInBranch && prp.branchRouteInstance) {
      for (const padPos of prp.branchRouteInstance.boostPadPositions) {
        if (shipPos.distanceTo(padPos) < 7.5) {
          const shipConfig = getEffectiveShipStats(
            getShipConfig(this.localShipId),
            this.localUpgrades
          );
          this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.6, this.currentSpeed + 28);
          this.boostEnergy = Math.min(100, this.boostEnergy + 25);
          this.cameraShake = 0.45;
          sound.playBoostPad();
          break;
        }
      }
    }

    const totalCps = this.track.checkpoints.length;
    if (totalCps === 0) return;

    // 1. Check all intermediate checkpoints
    for (let i = 1; i < totalCps; i++) {
      const gate = this.track.checkpoints[i];
      if (!this.checkpointsPassedThisLap.has(i)) {
        const dist = shipPos.distanceTo(gate.position);
        const physicallyNear = dist < Math.max(gate.width * 1.6, 26.0);
        const splinePassed = (this.splineT >= gate.t && this.splineT < gate.t + 0.12 && this.prevSplineT < gate.t);

        if (physicallyNear || splinePassed) {
          this.checkpointsPassedThisLap.add(i);
          this.latestValidCheckpoint = {
            idx: i,
            t: gate.t,
            pos: gate.position.clone(),
          };
          sound.playCheckpoint();
          this.nextCheckpointIdx = (i + 1) % totalCps;
          this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, totalCps);
          this.modeManager.recordRingPassed();
        }
      }
    }

    // Mode 21 / Submode 10 — THE FINAL COLLAPSE has no finish line.
    // The physical TOWER BASEMENT ACCESS branch is the only completion point.
    const isFinalCollapse =
      this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10;
    if (isFinalCollapse && this.currentLap >= 2) {
      // After the first normal lap, Submode 10 no longer uses the main-track
      // finish line. Route 01/Route 02 are now the only terminal choices.
      return;
    }

    // 2. Check Finish Line / Lap Completion (Gate 0 or Spline Loop Wrap)
    const gate0 = this.track.checkpoints[0];
    const distToFinish = gate0 ? shipPos.distanceTo(gate0.position) : 999;
    const isPhysicallyAtFinish = distToFinish < Math.max((gate0?.width || 20) * 1.6, 28.0);
    const isSplineLoopWrapped = (this.prevSplineT > 0.82 && this.splineT < 0.18);

    if ((isPhysicallyAtFinish || isSplineLoopWrapped) && this.finishLineCooldownTimer <= 0 && !this.isWrongWay) {
      const now = Date.now();
      // A finish-line crossing is only a valid lap completion after every
      // intermediate checkpoint on the current lap has been completed.
      // This prevents spawning/restarting at the finish line from instantly
      // advancing or finishing the race.
      const requiredCheckpointCount = Math.max(0, totalCps - 1);
      const completedCheckpointCount = Array.from(this.checkpointsPassedThisLap)
        .filter((idx) => idx > 0 && idx < totalCps).length;
      const completedCurrentLap = completedCheckpointCount >= requiredCheckpointCount;

      // Ensure player has been racing on this lap for at least 2.5 seconds
      if (completedCurrentLap && now - this.lapStartTime > 2500) {
        sound.playCheckpoint();
        this.finishLineCooldownTimer = 3.5; // 3.5s cooldown debounce
        this.latestValidCheckpoint = {
          idx: 0,
          t: gate0 ? gate0.t : 0,
          pos: gate0 ? gate0.position.clone() : shipPos.clone(),
        };
        this.checkpointsPassedThisLap.add(0);

        if (this.lapStartTime > 0) {
          const lapDuration = now - this.lapStartTime;
          if (this.bestLapTime === 0 || lapDuration < this.bestLapTime) {
            this.bestLapTime = lapDuration;
          }
        }
        this.lapStartTime = now;
        this.checkpointsPassedThisLap.clear();
        this.junctionManager.clearLapJunctions();
        this.nextCheckpointIdx = 1;
        this.callbacks.onCheckpointUpdate(1, totalCps);

        if (this.currentLap >= this.totalLaps) {
          this.hasFinished = true;
          this.currentLap = this.totalLaps;
          sound.playFinish();
          if (this.activeGameMode === 'VOID_CHAMPIONSHIP') {
            const playerRank = this.getPlayerRank();
            championshipManager.recordStageFinish(playerRank);
          }
          if (this.playerShipGroup && this.finishCinematicManager) {
            this.finishCinematicManager.start(this.playerShipGroup.position, this.playerShipGroup.quaternion);
          } else {
            const finalTime = now - this.raceStartTime;
            this.callbacks.onRaceFinish(finalTime);
          }
        } else {
          this.currentLap++;
          this.callbacks.onLapUpdate(this.currentLap, this.totalLaps);
          if (isFinalCollapse && this.currentLap >= 2) {
            // The first normal lap is the gate. Open both physical terminal
            // routes and expose their LEFT/RIGHT arrow controls now.
            this.junctionManager.setFinalCollapseRoutesUnlocked(true);
            this.junctionManager.feedbackMessage = 'ROUTE 01 / ROUTE 02 UNLOCKED — SELECT WITH LEFT / RIGHT ARROW';
            this.junctionManager.feedbackTimer = 5.0;
          }
        }
      }
    }
  }

  public syncRemotePlayers(players: Record<string, PlayerInfo>, localId: string) {
    const activeRemoteIds = new Set<string>();

    for (const [pid, player] of Object.entries(players)) {
      if (pid === localId) {
        if (player.raceState?.rank) {
          this.callbacks.onRankUpdate(player.raceState.rank, Object.keys(players).length);
        }
        continue;
      }

      activeRemoteIds.add(pid);
      let remote = this.remoteShips.get(pid);

      if (!remote) {
        const shipGroup = createShipMesh(
          player.shipId || 'apex_phantom',
          player.color || '#ff0055',
          player.secondaryColor || '#00f0ff',
          player.decal || 'none'
        );
        this.scene.add(shipGroup);

        const thrusters: THREE.Mesh[] = [];
        shipGroup.traverse(child => {
          if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
            thrusters.push(child);
          }
        });

        remote = {
          group: shipGroup,
          targetPos: new THREE.Vector3(0, 0, 0),
          targetQuat: new THREE.Quaternion(),
          thrusters,
        };
        this.remoteShips.set(pid, remote);
      }

      if (player.raceState) {
        const isFirstPlacement = remote.targetPos.lengthSq() === 0;
        if (player.isBot) {
          let sample: SamplePoint;
          if (player.raceState.currentRouteId && player.raceState.junctionId) {
            const junc = this.junctionManager.junctions.get(player.raceState.junctionId);
            const routeInst = junc?.routeInstances.get(player.raceState.currentRouteId);
            if (routeInst) {
              const bProg = Math.min(1.0, (player.raceState.progressDistance % routeInst.totalLength) / routeInst.totalLength);
              sample = routeInst.getSampleAt(bProg);
            } else {
              const trackLen = this.track.totalLength || 4600;
              const botT = ((player.raceState.progressDistance % trackLen) / trackLen);
              sample = this.track.getSampleAt(botT);
            }
          } else {
            const trackLen = this.track.totalLength || 4600;
            const botT = ((player.raceState.progressDistance % trackLen) / trackLen);
            sample = this.track.getSampleAt(botT);
          }

          let hash = 0;
          for (let i = 0; i < pid.length; i++) hash = (hash << 5) - hash + pid.charCodeAt(i);
          const lateral = ((Math.abs(hash) % 7) - 3) * 2.4;

          const botPos = sample.point
            .clone()
            .add(sample.binormal.clone().multiplyScalar(lateral))
            .add(sample.normal.clone().multiplyScalar(1.6));

          remote.targetPos.copy(botPos);
          const rotMatrix = new THREE.Matrix4();
          rotMatrix.makeBasis(sample.binormal, sample.normal, sample.tangent);
          remote.targetQuat.setFromRotationMatrix(rotMatrix);
        } else {
          remote.targetPos.set(player.raceState.x, player.raceState.y, player.raceState.z);
          remote.targetQuat.set(
            player.raceState.qx || 0,
            player.raceState.qy || 0,
            player.raceState.qz || 0,
            player.raceState.qw || 1
          );
        }

        if (isFirstPlacement) {
          remote.group.position.copy(remote.targetPos);
          remote.group.quaternion.copy(remote.targetQuat);
        }

        const isBoosting = !!player.raceState.isBoosting;
        const flameScale = 0.8 + (player.raceState.speed || 0) / 120 + (isBoosting ? 1.4 : 0);
        remote.thrusters.forEach(fl => fl.scale.set(1, flameScale, 1));
      }
    }

    for (const [id, remote] of this.remoteShips.entries()) {
      if (!activeRemoteIds.has(id)) {
        this.scene.remove(remote.group);
        this.remoteShips.delete(id);
      }
    }
  }

  private updateRemotePlayersInterpolation(dt: number) {
    const lerpRate = Math.min(1.0, 15 * dt);
    for (const remote of this.remoteShips.values()) {
      remote.group.position.lerp(remote.targetPos, lerpRate);
      remote.group.quaternion.slerp(remote.targetQuat, lerpRate);
    }
  }

  private updateCamera(dt: number) {
    if (this.isSpectator) {
      if (this.playerShipGroup) {
        this.playerShipGroup.visible = false;
      }

      // Collect all active observed racers (remote ships + AI bots)
      const targets: { name: string; position: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];
      for (const [rId, remote] of this.remoteShips.entries()) {
        if (remote.group) {
          targets.push({
            name: `PILOT ${rId.substring(0, 4).toUpperCase()}`,
            position: remote.group.position,
            quaternion: remote.group.quaternion,
          });
        }
      }
      for (const ai of this.localAIRacers) {
        if (ai.group && !ai.isDestroyed) {
          targets.push({
            name: ai.name,
            position: ai.group.position,
            quaternion: ai.group.quaternion,
          });
        }
      }

      if (targets.length > 0) {
        const target = targets[this.spectatorTargetIndex % targets.length];
        if (this.spectatorTargetName !== target.name) {
          this.spectatorTargetName = target.name;
          this.callbacks.onSpectatorTargetChange?.(target.name);
        }

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(target.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(target.quaternion);
        const targetCamPos = target.position
          .clone()
          .add(forward.clone().multiplyScalar(-18))
          .add(up.clone().multiplyScalar(6.5));
        const lookTarget = target.position.clone().add(forward.clone().multiplyScalar(20));

        this.camera.position.lerp(targetCamPos, 0.2);
        this.camera.lookAt(lookTarget);
      } else {
        const sample = this.track.getSampleAt((Date.now() * 0.00005) % 1.0);
        this.camera.position.lerp(sample.point.clone().add(new THREE.Vector3(0, 30, 40)), 0.05);
        this.camera.lookAt(sample.point);
      }
      return;
    }

    if (!this.playerShipGroup) return;

    // 20-Mode Unique Real-Time Finish Cinematic Authority
    if (this.finishCinematicManager && this.finishCinematicManager.isActive()) {
      const active = this.finishCinematicManager.update(
        dt,
        this.playerShipGroup.position,
        this.playerShipGroup.quaternion
      );
      if (active) return;
    }

    const sample = this.track.getSampleAt(this.splineT);

    // Mode-Specific 9-Phase Cinematic Introduction Camera Authority
    if (this.raceIntroManager && this.raceIntroManager.isIntroActive) {
      return; // Cinematic camera has authority
    }

    // Mode 21 — Black Hole / The Final Collapse camera overrides
    if (this.activeGameMode === 'BLACK_HOLE' && this.blackHoleCinematicManager) {
      const bhEvent = this.blackHoleCinematicManager.event;
      const bhPos = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);

      // Submode 10 uses the whole-black-hole panoramic camera only before
      // player control begins. Once the race starts, camera authority stays
      // with the normal gameplay camera; catastrophe events never take over
      // the camera with a panoramic shot.

      // Section 34 & 49: Failure Cinematic Camera Authority (7-Phase Route Consumption & General Failure)
      if (this.finalCollapseManager?.failureCinematic.isActive) {
        const fc = this.finalCollapseManager.failureCinematic;

        // Move player ship along physical continuous gravitational trajectory
        const minCamCapturePhase = fc.endingVariant === 'MISSED_ESCAPE_COLLAPSE' ? 2 : 4;
        if (fc.currentPhase >= minCamCapturePhase) {
          this.playerShipGroup.position.copy(fc.shipCurrentTrajectory);
          this.playerShipGroup.rotation.copy(fc.shipRotation);
        }

        // Reference-Style Cinematic Camera Choreography (Prompt Section 15):
        // WIDE -> MEDIUM -> CLOSE -> EXTREME CLOSE -> FINAL RAPID REVEAL
        if (fc.endingVariant === 'MISSED_ESCAPE_COLLAPSE') {
          const phase = fc.currentPhase;
          const progress = fc.totalProgress;

          if (phase === 1) {
            // WIDE: show black hole + environment + lost ship
            const toBH = bhPos.clone().sub(this.playerShipGroup.position).normalize();
            const camPos = this.playerShipGroup.position.clone()
              .sub(toBH.clone().multiplyScalar(95))
              .add(new THREE.Vector3(30, 45, 20));
            this.camera.position.lerp(camPos, 0.06);
            this.camera.lookAt(this.playerShipGroup.position.clone().lerp(bhPos, 0.35));
          } else if (phase === 2) {
            // MEDIUM: show falling player and rotating gravitational environment
            const orbitAngle = fc.elapsed * 0.85;
            const camPos = this.playerShipGroup.position.clone().add(
              new THREE.Vector3(Math.cos(orbitAngle) * 48, 16 + Math.sin(fc.elapsed * 1.2) * 8, Math.sin(orbitAngle) * 48)
            );
            this.camera.position.lerp(camPos, 0.08);
            this.camera.lookAt(this.playerShipGroup.position);
          } else if (phase === 3) {
            // CLOSE: show player ship being longitudinally spaghettified with energy trails
            const orbitAngle = fc.elapsed * 1.1;
            const camPos = this.playerShipGroup.position.clone().add(
              new THREE.Vector3(Math.cos(orbitAngle) * 24, 8 + Math.sin(fc.elapsed * 2.0) * 4, Math.sin(orbitAngle) * 24)
            );
            this.camera.position.lerp(camPos, 0.1);
            this.camera.lookAt(this.playerShipGroup.position);
          } else if (phase === 4 || phase === 5) {
            // EXTREME CLOSE: show striated luminous filaments and white-hot apex streaming into singularity
            const toBH = bhPos.clone().sub(this.playerShipGroup.position).normalize();
            const camPos = this.playerShipGroup.position.clone()
              .sub(toBH.clone().multiplyScalar(14))
              .add(new THREE.Vector3(Math.sin(fc.elapsed * 3.0) * 4, 5, Math.cos(fc.elapsed * 3.0) * 4));
            this.camera.position.lerp(camPos, 0.12);
            this.camera.lookAt(this.playerShipGroup.position);
          } else if (phase === 6) {
            // EXTREME CLOSE: luminous filaments entering singularity (brief cinematic pause beat)
            const camPos = bhPos.clone().add(new THREE.Vector3(25, 35, 120));
            this.camera.position.lerp(camPos, 0.08);
            this.camera.lookAt(bhPos);
          } else if (phase === 7 || phase === 8) {
            // DETONATION & COMPLETE DESTRUCTION: massive cosmic blast & shockwave
            const camPos = bhPos.clone().add(new THREE.Vector3(0, 90, 320));
            this.camera.position.lerp(camPos, 0.06);
            this.camera.lookAt(bhPos);
          } else if (phase === 9) {
            // AFTERMATH: slow camera drift in silent cosmic void with fading filaments
            const camPos = bhPos.clone().add(new THREE.Vector3(
              Math.sin(fc.elapsed * 0.15) * 60,
              110,
              280
            ));
            this.camera.position.lerp(camPos, 0.04);
            this.camera.lookAt(bhPos.clone().add(new THREE.Vector3(0, -20, 200)));
          } else if (phase === 10) {
            // ROUTE RECONSTRUCTION: camera rises, panning over holographic rebuilt routes
            const rebuildT = THREE.MathUtils.clamp((fc.elapsed - 17.5) / 5.0, 0, 1);
            const camPos = bhPos.clone().add(new THREE.Vector3(
              (1 - rebuildT) * -80,
              140 + rebuildT * 80,
              420 - rebuildT * 60
            ));
            this.camera.position.lerp(camPos, 0.05);
            this.camera.lookAt(bhPos.clone().add(new THREE.Vector3(0, 10, 480)));
          } else {
            // FINAL REVEAL (Phase 11): high celestial vantage point revealing the entire rebuilt world
            const camPos = bhPos.clone().add(new THREE.Vector3(0, 260, 520));
            this.camera.position.lerp(camPos, 0.06);
            this.camera.lookAt(bhPos.clone().add(new THREE.Vector3(0, 20, 420)));
          }
        } else if (fc.isRouteConsumption) {
          if (fc.currentPhase <= 3) {
            // Camera smoothly moves behind/slightly above ship looking ahead along breaking track
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);
            const camPos = this.playerShipGroup.position.clone().add(fwd.clone().multiplyScalar(-14)).add(new THREE.Vector3(0, 6, 0));
            this.camera.position.lerp(camPos, 0.1);
            this.camera.lookAt(this.playerShipGroup.position.clone().add(fwd.clone().multiplyScalar(20)));
          } else if (fc.currentPhase <= 6) {
            // Camera moves behind ship showing black hole dominating
            const toBH = bhPos.clone().sub(this.playerShipGroup.position).normalize();
            const camPos = this.playerShipGroup.position.clone().sub(toBH.clone().multiplyScalar(24)).add(new THREE.Vector3(0, 9, 0));
            this.camera.position.lerp(camPos, 0.08);
            this.camera.lookAt(this.playerShipGroup.position);
          } else {
            // Phase 7: Camera pulls farther away, ship absorbed into event horizon
            const toBH = bhPos.clone().sub(this.playerShipGroup.position).normalize();
            const camPos = this.playerShipGroup.position.clone().sub(toBH.clone().multiplyScalar(75)).add(new THREE.Vector3(0, 30, 0));
            this.camera.position.lerp(camPos, 0.05);
            this.camera.lookAt(this.playerShipGroup.position);
          }
        } else {
          // General failure camera
          const camPos = this.playerShipGroup.position.clone().add(new THREE.Vector3(-14, 16, 20));
          this.camera.position.lerp(camPos, 0.08);
          this.camera.lookAt(this.playerShipGroup.position);
        }

        if (this.cameraShake > 0) {
          this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 2.5;
          this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 2.5;
        }

        if (fc.completed && !this.finalCollapseRaceFinishSent) {
          this.finalCollapseRaceFinishSent = true;
          this.setFinalCollapseAuthoritativeState('FINAL_RESULTS');
          this.hasFinished = true;
          const finalTime = Date.now() - this.raceStartTime;
          this.callbacks.onRaceFinish(finalTime);
        }
        return;
      }

      // Submode 10 — Route 02/03 terminal camera authority. The ship stays
      // physically at the gate while the camera frames the actual terminal,
      // so the player can see the escape structure instead of being left with
      // a distant/default gameplay view.
      if (
        this.finalCollapseTerminalRouteId &&
        this.finalCollapseTerminalPoint &&
        this.finalCollapseTerminalTangent
      ) {
        if (this.finalCollapseAuthoritativeState === 'FINAL_CAMERA_REVEAL') {
          const camPos = this.finalCollapseTerminalPoint.clone().add(new THREE.Vector3(0, 36, 85));
          this.camera.position.lerp(camPos, 0.05);
          this.camera.lookAt(this.finalCollapseTerminalPoint);
          return;
        }
        if (
          bhEvent === 'ESCAPE_SEQUENCE' ||
          this.finalCollapseAuthoritativeState === 'ROUTE_02_SEQUENCE' ||
          this.finalCollapseAuthoritativeState === 'ROUTE_02_SUCCESS' ||
          this.finalCollapseAuthoritativeState === 'ROUTE_03_SEQUENCE' ||
          this.finalCollapseAuthoritativeState === 'ROUTE_03_SUCCESS' ||
          this.finalCollapseAuthoritativeState === 'FINAL_COLLAPSE_ACTIVE' ||
          this.finalCollapseAuthoritativeState === 'FINAL_SINGULARITY_CHARGE' ||
          this.finalCollapseAuthoritativeState === 'FINAL_COSMIC_DETONATION' ||
          this.finalCollapseAuthoritativeState === 'FINAL_COMPLETE_DESTRUCTION' ||
          this.finalCollapseAuthoritativeState === 'FINAL_RECONSTRUCTION'
        ) {
          const tangent = this.finalCollapseTerminalTangent.clone().normalize();
          const camPos = this.finalCollapseTerminalPoint
            .clone()
            .sub(tangent.clone().multiplyScalar(28))
            .add(new THREE.Vector3(0, 10, 0));
          const lookTarget = this.finalCollapseTerminalPoint
            .clone()
            .add(tangent.clone().multiplyScalar(12))
            .add(new THREE.Vector3(0, 18, 0));
          this.camera.position.lerp(camPos, 0.12);
          this.camera.lookAt(lookTarget);
          return;
        }
      }

      // Section 9: Player Ship Parking Camera & In-Shelter Follow Camera
      if (this.shelterNavigationActive) {
        if (!this.finalCollapseShipParked) {
          // Parking Follow Camera: behind ship following tunnel trajectory
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.playerShipGroup.quaternion);
          const targetCamPos = this.playerShipGroup.position.clone().add(fwd.clone().multiplyScalar(-11.5)).add(up.clone().multiplyScalar(4.0));
          const lookTarget = this.playerShipGroup.position.clone().add(fwd.clone().multiplyScalar(16.0));
          this.camera.position.lerp(targetCamPos, 0.15);
          this.camera.lookAt(lookTarget);
          return;
        } else if (
          bhEvent === 'SHIP_PARKING' ||
          bhEvent === 'PARKING_CLAMPS' ||
          bhEvent === 'SHIP_SECURED' ||
          bhEvent === 'SHELTER_SEALING' ||
          bhEvent === 'SHELTER_SECURED' ||
          bhEvent === 'SHELTER_SEALED'
        ) {
          // Side Camera -> Wide Hangar Camera showing ship clamped in Bay 07
          const bay07 = this.junctionManager.bay07WorldPosition;
          const isWide = this.finalCollapseHangarSealed;
          const camOffset = isWide ? new THREE.Vector3(-12.0, 7.5, 9.5) : new THREE.Vector3(-6.8, 3.8, 5.2);
          const targetCamPos = bay07.clone().add(camOffset);
          this.camera.position.lerp(targetCamPos, 0.08);
          this.camera.lookAt(this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 0.9, 0)));
          return;
        }
      }

      // Section 9 & 12-14: Continuous Aftermath Cinematic Camera Path
      if (
        bhEvent === 'AFTERMATH_START' ||
        bhEvent === 'TOWER_REVEAL' ||
        bhEvent === 'WORLD_COLLAPSE' ||
        bhEvent === 'PLANETARY_COLLISION' ||
        bhEvent === 'FINAL_SINGULARITY' ||
        bhEvent === 'COSMIC_LIGHT_EVENT' ||
        bhEvent === 'FLASHBANG' ||
        bhEvent === 'SILENCE' ||
        bhEvent === 'AFTERMATH_REVEAL' ||
        bhEvent === 'TOWER_REVEAL_RETURN' ||
        bhEvent === 'SHIP_FINAL_SHOT' ||
        bhEvent === 'CINEMATIC_END' ||
        bhEvent === 'AFTERMATH_CINEMATIC' ||
        bhEvent === 'REBUILDING_MAP' ||
        bhEvent === 'SURVIVAL_RESULTS' ||
        bhEvent === 'RESULTS' ||
        bhEvent === 'RESULTS_COMPLETE'
      ) {
        const elapsed = this.blackHoleCinematicManager.eventElapsed;
        const bay07 = this.junctionManager.bay07WorldPosition;
        const entrance = this.junctionManager.towerEntranceWorldPosition;

        if (bhEvent === 'AFTERMATH_START') {
          // Phase 6: Hold on Parked Spaceship in Bay 07 with locked clamps & glowing cables
          const cam = bay07.clone().add(new THREE.Vector3(-6.5, 3.8, 7.2));
          this.camera.position.lerp(cam, 0.1);
          this.camera.lookAt(this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
          return;
        }

        if (bhEvent === 'TOWER_REVEAL') {
          // Phase 6: Smooth continuous path: Parked ship -> Hangar B3 -> Ramp tunnel -> Tower interior -> Tower exterior platform
          const tH = Math.min(1, elapsed / 5.0);
          let camTarget: THREE.Vector3;
          let lookTarget: THREE.Vector3;

          if (tH < 0.25) {
            // Gliding backward out of Bay 07 into Evacuation Hangar B3
            const p = tH / 0.25;
            const startPos = bay07.clone().add(new THREE.Vector3(-6.5, 3.8, 7.2));
            const hangarPos = bay07.clone().add(new THREE.Vector3(0, 7.0, 32.0));
            camTarget = startPos.lerp(hangarPos, p);
            lookTarget = bay07.clone().add(new THREE.Vector3(0, 1.0, 0));
          } else if (tH < 0.65) {
            // Ascending up the subterranean access ramp (from y=-14 to y=0)
            const p = (tH - 0.25) / 0.40;
            const rampStart = bay07.clone().add(new THREE.Vector3(0, 7.0, 32.0));
            const rampTop = entrance.clone().add(new THREE.Vector3(0, 5.0, -15.0));
            camTarget = rampStart.lerp(rampTop, p);
            lookTarget = entrance.clone().add(new THREE.Vector3(0, 4.0, 20.0));
          } else {
            // Exiting through tower interior gate and rising into orbit outside
            const p = (tH - 0.65) / 0.35;
            const gatePos = entrance.clone().add(new THREE.Vector3(0, 5.0, -15.0));
            const exteriorOrbit = entrance.clone().add(new THREE.Vector3(-180.0, 280.0, 380.0));
            camTarget = gatePos.lerp(exteriorOrbit, p);
            lookTarget = entrance.clone().lerp(bhPos, p);
          }

          this.camera.position.lerp(camTarget, 0.12);
          this.camera.lookAt(lookTarget);
          return;
        }

        if (bhEvent === 'WORLD_COLLAPSE') {
          // Phase 7: Outside Destruction Reveal: race track being torn apart, chunks falling into void
          const camOrbit = entrance.clone().add(new THREE.Vector3(-260, 440, 520));
          this.camera.position.lerp(camOrbit, 0.08);
          this.camera.lookAt(bhPos);
          if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 2.2;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 2.2;
          }
          return;
        }

        if (bhEvent === 'PLANETARY_COLLISION') {
          // Phase 8: Catastrophic Planetary Collision
          // Camera directly frames Planet A and Planet B colliding near the black hole
          const camCol = new THREE.Vector3(-850, 680, -1850);
          this.camera.position.lerp(camCol, 0.08);
          const impactCenter = new THREE.Vector3(-1440, 500, -3240);
          this.camera.lookAt(impactCenter);
          if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 3.5;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 3.5;
          }
          return;
        }

        if (bhEvent === 'FINAL_SINGULARITY') {
          // Phase 9: Final Singularity (epic celestial view, relativistic spin, accretion disk expansion)
          const camCosmic = new THREE.Vector3(-450, 750, -1800);
          this.camera.position.lerp(camCosmic, 0.08);
          this.camera.lookAt(bhPos);
          if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 3.5;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 3.5;
          }
          return;
        }

        if (bhEvent === 'COSMIC_LIGHT_EVENT' || bhEvent === 'FLASHBANG') {
          // Phase 10: Cosmic Light Event & Detonation
          const camFlash = new THREE.Vector3(-380, 650, -1600);
          this.camera.position.lerp(camFlash, 0.08);
          this.camera.lookAt(bhPos);
          if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 4.5;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 4.5;
          }
          return;
        }

        if (bhEvent === 'SILENCE' || bhEvent === 'AFTERMATH_REVEAL' || bhEvent === 'REBUILDING_MAP') {
          // Phase 11: Total Silence
          // The world is gone, track is gone. Only the lone evacuation tower remains in empty space.
          const camSilence = entrance.clone().add(new THREE.Vector3(-240, 280, 520));
          this.camera.position.lerp(camSilence, 0.06);
          this.camera.lookAt(entrance.clone().add(new THREE.Vector3(0, 30, 0)));
          return;
        }

        if (bhEvent === 'TOWER_REVEAL_RETURN') {
          // Phase 12: Return to the Evacuation Tower
          // Camera glides smoothly from deep space back toward the lone glowing evacuation tower
          const tR = Math.min(1, elapsed / 4.5);
          const startCam = entrance.clone().add(new THREE.Vector3(-240, 280, 520));
          const endCam = entrance.clone().add(new THREE.Vector3(-35, 25, 45));
          const cam = startCam.lerp(endCam, tR);
          this.camera.position.lerp(cam, 0.08);
          this.camera.lookAt(entrance.clone().add(new THREE.Vector3(0, 10, 0)));
          return;
        }

        if (bhEvent === 'SHIP_FINAL_SHOT' || bhEvent === 'CINEMATIC_END') {
          // Phase 13: Return to the Spaceship
          // Camera moves back inside: Exterior -> Interior -> Ramp -> Hangar B3 -> Bay 07 -> Player Ship
          const tS = Math.min(1, elapsed / 4.5);
          let camTarget: THREE.Vector3;
          let lookTarget: THREE.Vector3;

          if (tS < 0.35) {
            // Passing through tower exterior entrance into interior gate
            const p = tS / 0.35;
            const startPos = entrance.clone().add(new THREE.Vector3(-35, 25, 45));
            const gatePos = entrance.clone().add(new THREE.Vector3(0, 5.0, -15.0));
            camTarget = startPos.lerp(gatePos, p);
            lookTarget = entrance.clone().add(new THREE.Vector3(0, 4.0, -35.0));
          } else if (tS < 0.70) {
            // Descending the access ramp toward Hangar B3
            const p = (tS - 0.35) / 0.35;
            const gatePos = entrance.clone().add(new THREE.Vector3(0, 5.0, -15.0));
            const hangarStart = bay07.clone().add(new THREE.Vector3(0, 7.0, 32.0));
            camTarget = gatePos.lerp(hangarStart, p);
            lookTarget = bay07.clone().add(new THREE.Vector3(0, 2.0, 0));
          } else {
            // Entering Bay 07 and framing the safely clamped player spaceship
            const p = (tS - 0.70) / 0.30;
            const hangarStart = bay07.clone().add(new THREE.Vector3(0, 7.0, 32.0));
            const shipCam = bay07.clone().add(new THREE.Vector3(-5.5, 3.2, 5.8));
            camTarget = hangarStart.lerp(shipCam, p);
            lookTarget = this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0));
          }

          this.camera.position.lerp(camTarget, 0.1);
          this.camera.lookAt(lookTarget);
          return;
        }

        if (bhEvent === 'SURVIVAL_RESULTS') {
          // Phase 14: Survival Confirmed
          // Camera holds on the clamped spaceship in Bay 07 with glowing clamps
          const camShip = bay07.clone().add(new THREE.Vector3(-5.2, 3.0, 5.5));
          this.camera.position.lerp(camShip, 0.08);
          this.camera.lookAt(this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
          return;
        }

        if (bhEvent === 'RESULTS' || bhEvent === 'RESULTS_COMPLETE') {
          // Phase 15: Results Transition
          const camResults = bay07.clone().add(new THREE.Vector3(-7.0, 4.5, 8.5));
          this.camera.position.lerp(camResults, 0.05);
          this.camera.lookAt(this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
          return;
        }
      }

      if (bhEvent === 'FINAL_SINGULARITY_WARNING') {
        const camPos = this.playerShipGroup.position.clone().add(new THREE.Vector3(0, 32, 65));
        this.camera.position.lerp(camPos, 0.16);
        this.camera.lookAt(bhPos);
        if (this.cameraShake > 0) {
          this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 2.2;
          this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 2.2;
        }
        return;
      } else if (bhEvent === 'FINAL_COLLAPSE' || bhEvent === 'FINAL_FLASH' || bhEvent === 'AFTERMATH' || bhEvent === 'FINAL_SINGULARITY_COLLAPSE') {
        const camPos = new THREE.Vector3(-450, 750, -1800);
        this.camera.position.lerp(camPos, 0.08);
        this.camera.lookAt(bhPos);
        if (this.cameraShake > 0) {
          this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 3.5;
          this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 3.5;
        }
        return;
      }
    }

    let targetCamPos: THREE.Vector3;
    let lookTarget: THREE.Vector3;

    if (this.cameraMode === 'COCKPIT') {
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(2.0))
        .add(sample.normal.clone().multiplyScalar(1.2));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(40));
    } else if (this.cameraMode === 'CHASE_FAR') {
      const behindDistance = 20 + (this.isBoosting ? 5 : 0);
      const heightOffset = 6.8;
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(-behindDistance))
        .add(sample.normal.clone().multiplyScalar(heightOffset));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(28));
    } else if (this.cameraMode === 'WHOLE_BLACK_HOLE') {
      const bhPos = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);
      // Elevated, wide panoramic vantage showing the ship along with the entire black hole system
      const behindDist = 38 + (this.isBoosting ? 8 : 0);
      const heightOffset = 22.0;
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(-behindDist))
        .add(sample.normal.clone().multiplyScalar(heightOffset));

      // Vector toward the black hole center
      const toBH = bhPos.clone().sub(this.playerShipGroup.position).normalize();

      // Look point: frames both the track forward trajectory and the massive black hole on the horizon
      const forwardLook = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(35));
      const bhLook = this.playerShipGroup.position
        .clone()
        .add(toBH.clone().multiplyScalar(220))
        .add(new THREE.Vector3(0, 35, 0));

      lookTarget = forwardLook.lerp(bhLook, 0.48);
    } else {
      const behindDistance = 14 + (this.isBoosting ? 4 : 0);
      const heightOffset = 5.2;
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(-behindDistance))
        .add(sample.normal.clone().multiplyScalar(heightOffset));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(25));
    }

    if (this.extendedPathManager && this.playerShipGroup) {
      const shipQuat = this.playerShipGroup.quaternion;
      const aiTs = this.localAIRacers.map(a => a.t);
      const isCinActive = this.extendedPathManager.update(
        dt,
        this.splineT,
        aiTs,
        this.playerShipGroup.position,
        shipQuat,
        this.currentSpeed,
        targetCamPos,
        lookTarget,
        this.camera,
        this.isRacing
      );

      if (this.callbacks.onCinematicStateUpdate) {
        this.callbacks.onCinematicStateUpdate(this.extendedPathManager.cinematicSystem.getActiveState());
      }
      if (this.callbacks.onPathTelemetryUpdate) {
        this.callbacks.onPathTelemetryUpdate(this.extendedPathManager.getTelemetry(this.splineT, this.totalDistanceTraveled));
      }

      if (isCinActive) {
        return; // In-race cinematic camera has temporary authority
      }
    }

    if (this.cameraShakeEnabled && this.cameraShake > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.cameraShake * 1.5;
      targetCamPos.y += (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }

    const lerpRate = this.cameraMode === 'COCKPIT' ? 0.35 : 0.15;
    this.camera.position.lerp(targetCamPos, lerpRate);
    this.camera.lookAt(lookTarget);

    const targetCamRoll = -this.input.steer * (this.isDrifting ? 0.22 : 0.14);
    this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, targetCamRoll, 0.12);
    this.camera.rotateZ(this.cameraRoll);

    let desiredFov = (this.isBoosting ? 82 : this.cameraMode === 'COCKPIT' ? 74 : this.cameraMode === 'WHOLE_BLACK_HOLE' ? 84 : 65) + this.collisionFovPunch;
    if (this.cameraMode === 'WHOLE_BLACK_HOLE' && this.camera.far < 15000) {
      this.camera.far = 15000;
      this.camera.updateProjectionMatrix();
    }
    if (this.activeGameMode === 'BLACK_HOLE' && this.blackHoleCinematicManager?.event === 'SPAGHETTIFICATION') {
      desiredFov = 94; // Tidal force gravitational distortion FOV
    }
    this.collisionFovPunch = Math.max(0, this.collisionFovPunch - dt * 22);
    this.targetFov = THREE.MathUtils.lerp(this.targetFov, desiredFov, 0.16);
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = this.targetFov;
      this.camera.updateProjectionMatrix();
    }

    // Submode 10 Cinematic Event Scene Camera Pan & Distortion (100 events)
    if (this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10) {
      const cinematicHandler = this.finalCollapseManager?.catastrophe.cinematicHandler;
      if (cinematicHandler && cinematicHandler.isActive()) {
        cinematicHandler.setBaseFov(this.targetFov);
        const cinResult = cinematicHandler.update(
          dt,
          this.camera,
          this.playerShipGroup,
          this.supermassiveBlackHole,
          this.scene
        );
        if (cinResult.shake > 0) {
          this.cameraShake = Math.max(this.cameraShake, cinResult.shake);
        }
      }
    }
  }

  /** Fast-forwards the countdown immediately to 00:00 Final Collapse */
  public triggerFinalCollapseImmediately(): void {
    if (this.activeGameMode === 'BLACK_HOLE') {
      if (this.blackHoleCinematicManager) {
        this.blackHoleCinematicManager.skipToZeroCountdown();
      }
      this.quantumCountdownClock?.skipToZero();
      if (this.finalCollapseManager) {
        this.finalCollapseManager.onZeroCountdown();
        this.finalCollapseManager.beginTrackCollapse();
        const finalEvent = this.finalCollapseManager.catastrophe.eventCatalog[99] || this.finalCollapseManager.catastrophe.eventCatalog[this.finalCollapseManager.catastrophe.eventCatalog.length - 1];
        if (finalEvent) {
          this.finalCollapseManager.catastrophe.triggerEvent(finalEvent);
        }
      }
      if (this.supermassiveBlackHole) {
        this.supermassiveBlackHole.setInstability(1.0);
        this.supermassiveBlackHole.triggerGravitationalWave(1.0, 0xffd700);
      }
      sound.playGravitationalRumble(4.0);
      sound.playEmergencyAlarm();
      this.cameraShake = Math.max(this.cameraShake, 1.8);
    }
  }

  private updateSpeedParticles() {
    if (!this.speedParticles || !this.playerShipGroup) return;
    this.speedParticles.position.copy(this.playerShipGroup.position);
    this.speedParticles.visible = this.currentSpeed > 30;
  }

  private updateAsteroids(dt: number) {
    if (this.asteroidInstancedMesh) {
      const obstacles = this.track.obstacles;
      const count = Math.min(obstacles.length, this.asteroidPoolSize);
      const shipPos = this.playerShipGroup ? this.playerShipGroup.position : null;

      for (let i = 0; i < count; i++) {
        const ast = obstacles[i];
        if (!ast) continue;

        // Destroyed Asteroids: hidden from rendering & collisions
        if (ast.isDestroyed || ast.health <= 0) {
          if (ast.respawnTimer !== undefined && ast.respawnTimer > 0) {
            ast.respawnTimer -= dt;
            if (ast.respawnTimer <= 0 && (!shipPos || shipPos.distanceTo(ast.position) > 40)) {
              ast.isDestroyed = false;
              ast.health = ast.maxHealth;
            }
          }
          this.dummyObj.position.set(0, -9999, 0);
          this.dummyObj.scale.set(0, 0, 0);
          this.dummyObj.updateMatrix();
          this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
          continue;
        }

        if (!ast.currentRotation) ast.currentRotation = new THREE.Vector3();
        ast.currentRotation.x += ast.rotationSpeed.x;
        ast.currentRotation.y += ast.rotationSpeed.y;
        ast.currentRotation.z += ast.rotationSpeed.z;

        if (ast.isDynamicSwarm && ast.basePosition && ast.driftVelocity) {
          const time = this.totalTimeElapsed * 1.4 + i;
          ast.position.x = ast.basePosition.x + Math.sin(time) * ast.driftVelocity.x;
          ast.position.y = ast.basePosition.y + Math.cos(time * 0.8) * ast.driftVelocity.y;
          ast.position.z = ast.basePosition.z + Math.sin(time * 1.1) * ast.driftVelocity.z;
        }

        // Damage crack or flash feedback
        let displayRadius = ast.radius;
        if (ast.hitFlashTimer && ast.hitFlashTimer > 0) {
          ast.hitFlashTimer = Math.max(0, ast.hitFlashTimer - dt);
          displayRadius *= 1.08 + Math.sin(this.totalTimeElapsed * 40) * 0.05;
        }

        this.dummyObj.position.copy(ast.position);
        this.dummyObj.rotation.set(
          ast.currentRotation.x,
          ast.currentRotation.y,
          ast.currentRotation.z
        );
        this.dummyObj.scale.setScalar(displayRadius);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      }
      this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.shortcutPortalGroup) {
      const shortcutEv = this.track.dynamicEvents.find(e => e.type === 'TEMPORARY_SHORTCUT');
      if (shortcutEv) {
        this.shortcutPortalGroup.visible = shortcutEv.active;
        if (shortcutEv.active) {
          const ring = this.shortcutPortalGroup.getObjectByName('portal_ring');
          const disc = this.shortcutPortalGroup.getObjectByName('portal_disc');
          if (ring) ring.rotation.z += 0.04;
          if (disc) {
            disc.rotation.z -= 0.02;
            const pulse = 0.85 + Math.sin(this.totalTimeElapsed * 6) * 0.15;
            disc.scale.set(pulse, pulse, pulse);
          }
        }
      }
    }
  }

  private updatePowerUps(dt: number) {
    if (!this.isRacing) return;
    let updated = false;

    if (this.phaseShieldTimer > 0) {
      this.phaseShieldTimer = Math.max(0, this.phaseShieldTimer - dt);
      updated = true;
    }
    if (this.shieldMeshGroup) {
      this.shieldMeshGroup.visible = this.phaseShieldTimer > 0;
      if (this.shieldMeshGroup.visible) {
        this.shieldMeshGroup.rotation.y += 0.03;
        this.shieldMeshGroup.rotation.x += 0.015;
      }
    }

    if (this.creditMagnetTimer > 0) {
      this.creditMagnetTimer = Math.max(0, this.creditMagnetTimer - dt);
      updated = true;
    }

    if (this.hyperBoostTimer > 0) {
      this.hyperBoostTimer = Math.max(0, this.hyperBoostTimer - dt);
      updated = true;
    }

    if (this.nitroBoostTimer > 0) {
      this.nitroBoostTimer = Math.max(0, this.nitroBoostTimer - dt);
      updated = true;
    }

    if (this.empPulseTimer > 0) {
      this.empPulseTimer = Math.max(0, this.empPulseTimer - dt);
      updated = true;
    }

    if (this.timeWarpTimer > 0) {
      this.timeWarpTimer = Math.max(0, this.timeWarpTimer - dt);
      updated = true;
    }

    if (this.gravityBurstTimer > 0) {
      this.gravityBurstTimer = Math.max(0, this.gravityBurstTimer - dt);
      updated = true;
    }

    if (this.decoyTimer > 0) {
      this.decoyTimer = Math.max(0, this.decoyTimer - dt);
      updated = true;
    }

    if (this.speedSurgeTimer > 0) {
      this.speedSurgeTimer = Math.max(0, this.speedSurgeTimer - dt);
      updated = true;
    }

    const list: ActivePowerUp[] = [];
    if (this.phaseShieldTimer > 0) {
      list.push({
        type: 'ENERGY_SHIELD',
        remainingTime: Math.round(this.phaseShieldTimer * 10) / 10,
        totalDuration: this.phaseShieldTotal,
      });
    }
    if (this.creditMagnetTimer > 0) {
      list.push({
        type: 'MAGNET_BOOST',
        remainingTime: Math.round(this.creditMagnetTimer * 10) / 10,
        totalDuration: this.creditMagnetTotal,
      });
    }
    if (this.nitroBoostTimer > 0) {
      list.push({
        type: 'NITRO_BOOST',
        remainingTime: Math.round(this.nitroBoostTimer * 10) / 10,
        totalDuration: this.nitroBoostTotal,
      });
    }
    if (this.empPulseTimer > 0) {
      list.push({
        type: 'EMP_PULSE',
        remainingTime: Math.round(this.empPulseTimer * 10) / 10,
        totalDuration: 4.0,
      });
    }
    if (this.timeWarpTimer > 0) {
      list.push({
        type: 'TIME_WARP',
        remainingTime: Math.round(this.timeWarpTimer * 10) / 10,
        totalDuration: 4.5,
      });
    }
    if (this.gravityBurstTimer > 0) {
      list.push({
        type: 'GRAVITY_BURST',
        remainingTime: Math.round(this.gravityBurstTimer * 10) / 10,
        totalDuration: 6.0,
      });
    }
    if (this.decoyTimer > 0) {
      list.push({
        type: 'DECOY_SHIP',
        remainingTime: Math.round(this.decoyTimer * 10) / 10,
        totalDuration: 6.0,
      });
    }
    if (this.speedSurgeTimer > 0 || this.hyperBoostTimer > 0) {
      list.push({
        type: 'TEMPORARY_SPEED_SURGE',
        remainingTime: Math.round(Math.max(this.speedSurgeTimer, this.hyperBoostTimer) * 10) / 10,
        totalDuration: 5.0,
      });
    }

    if (updated || list.length !== this.activePowerUpsList.length) {
      this.activePowerUpsList = list;
      this.callbacks.onPowerUpsUpdate?.(list);
    }
  }

  private updateCredits(dt: number) {
    if (!this.creditsInstancedMesh || !this.playerShipGroup) return;
    const credits = this.track.credits;
    if (!credits || credits.length === 0) return;

    const shipPos = this.playerShipGroup.position;
    const magnetActive = this.creditMagnetTimer > 0;
    const magnetRadius = magnetActive
      ? 28 + (this.localUpgrades.magnetRange || 0) * 8
      : 3.2;

    let needsUpdate = false;
    for (let i = 0; i < credits.length; i++) {
      const c = credits[i];
      if (c.collected) continue;

      c.rotation = (c.rotation || 0) + dt * 2.5;
      const dist = shipPos.distanceTo(c.position);

      if (magnetActive && dist < magnetRadius && dist > 1.0) {
        const pullDir = shipPos.clone().sub(c.position).normalize();
        const pullSpeed = (1 - dist / magnetRadius) * 45 + 15;
        c.position.add(pullDir.multiplyScalar(pullSpeed * dt));
        needsUpdate = true;
      }

      if (dist < 3.2) {
        c.collected = true;
        this.sessionCredits += c.value;
        sound.playCreditPickup();
        this.triggerCollisionBurst(c.position, 0xffea00, 16);
        this.callbacks.onCreditCollected?.(this.sessionCredits, c.value);

        this.creditsDummy.position.set(0, -9999, 0);
        this.creditsDummy.scale.set(0, 0, 0);
        this.creditsDummy.updateMatrix();
        this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
        needsUpdate = true;
        continue;
      }

      this.creditsDummy.position.copy(c.position);
      this.creditsDummy.rotation.set(0.4, c.rotation, 0);
      this.creditsDummy.scale.setScalar(1.0);
      this.creditsDummy.updateMatrix();
      this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.creditsInstancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private updatePowerUpPods(dt: number) {
    if (!this.playerShipGroup || this.powerUpPodGroups.length === 0) return;
    if (!this.powerUpsEnabled) {
      this.powerUpPodGroups.forEach(g => {
        if (g) g.visible = false;
      });
      return;
    }
    const pods = this.track.powerUpPods;
    const shipPos = this.playerShipGroup.position;

    pods.forEach((pod, idx) => {
      const group = this.powerUpPodGroups[idx];
      if (!group) return;

      group.visible = !pod.collected;
      if (!pod.collected) {
        const halo = group.getObjectByName('halo_ring');
        const core = group.getObjectByName('core_icon');
        const capsule = group.getObjectByName('capsule_shield');

        if (halo) halo.rotation.y += 0.04;
        if (core) {
          core.rotation.y += 0.05;
          core.rotation.x += 0.02;
        }
        if (capsule) capsule.rotation.z += 0.02;

        group.position.y = pod.position.y + Math.sin(this.totalTimeElapsed * 4 + idx) * 0.4;

        if (this.isRacing && shipPos.distanceTo(group.position) < 4.5) {
          pod.collected = true;
          this.activatePowerUp(pod.type);
          this.callbacks.onPowerUpCollected?.(pod.type);
          const burstColor =
            pod.type === 'NITRO_BOOST'
              ? 0xff5500
              : pod.type === 'ENERGY_SHIELD' || pod.type === 'PHASE_SHIELD'
              ? 0x00f0ff
              : pod.type === 'REPAIR_CORE'
              ? 0x39ff14
              : pod.type === 'MAGNET_BOOST' || pod.type === 'CREDIT_MAGNET'
              ? 0xd000ff
              : pod.type === 'EMP_PULSE'
              ? 0x00e5ff
              : pod.type === 'TIME_WARP'
              ? 0x9d4edd
              : pod.type === 'GRAVITY_BURST'
              ? 0xffcc00
              : pod.type === 'DECOY_SHIP'
              ? 0xff007f
              : 0xff0055;
          this.triggerCollisionBurst(group.position, burstColor, 28);
        }
      }
    });
  }

  public activatePowerUp(type: PowerUpType) {
    if (type === 'NITRO_BOOST') {
      this.nitroBoostTotal = 3.5;
      this.nitroBoostTimer = this.nitroBoostTotal;
      const shipConfig = getEffectiveShipStats(getShipConfig(this.localShipId), this.localUpgrades);
      this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.5, this.currentSpeed + 28);
      this.boostEnergy = Math.min(100, this.boostEnergy + 35);
      if (this.cameraShakeEnabled) this.cameraShake = 0.55;
      sound.playNitroBoost();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff5500, 32);
      }
    } else if (type === 'ENERGY_SHIELD' || type === 'PHASE_SHIELD') {
      this.phaseShieldTotal = 7.0 + (this.localUpgrades.shieldDuration || 0) * 1.5;
      this.phaseShieldTimer = this.phaseShieldTotal;
      this.damageZones.shieldCore = 100;
      this.callbacks.onDamageZonesUpdate?.(this.damageZones);
      sound.playShieldActivate();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x00f0ff, 28);
      }
    } else if (type === 'REPAIR_CORE') {
      this.hullHealth = Math.min(100, this.hullHealth + 50);
      this.damageZones = {
        frontHull: Math.max(0, this.damageZones.frontHull - 60),
        rearEngine: Math.max(0, this.damageZones.rearEngine - 60),
        leftWing: Math.max(0, this.damageZones.leftWing - 60),
        rightWing: Math.max(0, this.damageZones.rightWing - 60),
        shieldCore: 100,
      };
      this.callbacks.onHullUpdate?.(this.hullHealth);
      this.callbacks.onDamageZonesUpdate?.(this.damageZones);
      sound.playRepairCore();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x39ff14, 30);
      }
    } else if (type === 'MAGNET_BOOST' || type === 'CREDIT_MAGNET') {
      this.creditMagnetTotal = 9.0 + (this.localUpgrades.magnetRange || 0) * 1.5;
      this.creditMagnetTimer = this.creditMagnetTotal;
      sound.playMagnetPulse();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xd000ff, 26);
      }
    } else if (type === 'EMP_PULSE') {
      this.empPulseTimer = 4.0;
      sound.playEMPPulse();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x00e5ff, 48);
        const myPos = this.playerShipGroup.position;
        for (const ai of this.localAIRacers) {
          if (ai.group.position.distanceTo(myPos) < 38) {
            ai.speed = Math.max(15, ai.speed * 0.55);
            this.triggerCollisionBurst(ai.group.position, 0x00e5ff, 20);
          }
        }
      }
    } else if (type === 'TIME_WARP') {
      this.timeWarpTimer = 4.5;
      sound.playTimeWarp();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x9d4edd, 36);
      }
    } else if (type === 'GRAVITY_BURST') {
      this.gravityBurstTimer = 6.0;
      sound.playGravityBurst();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xffcc00, 32);
      }
    } else if (type === 'DECOY_SHIP') {
      this.decoyTimer = 6.0;
      sound.playDecoySpawn();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff007f, 36);
      }
    } else if (type === 'TEMPORARY_SPEED_SURGE' || type === 'HYPER_BOOST') {
      this.speedSurgeTimer = 5.0;
      this.hyperBoostTotal = 5.0;
      this.hyperBoostTimer = this.hyperBoostTotal;
      this.currentSpeed = Math.min(138, this.currentSpeed + 38);
      if (this.cameraShakeEnabled) this.cameraShake = 0.6;
      sound.playHyperBoost();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff0055, 36);
      }
    }
  }

  public applyZoneDamage(zone: keyof ShipDamageZones, amount: number) {
    if (this.invulnerableTimer > 0 || this.isDestroyed || this.isSpectator) return;

    if (this.phaseShieldTimer > 0) {
      sound.playShieldDeflect();
      return;
    }

    let remaining = amount;
    if (this.damageZones.shieldCore > 0) {
      const absorbed = Math.min(this.damageZones.shieldCore, remaining);
      this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - absorbed);
      remaining -= absorbed;
      sound.playShieldHit();
    }

    if (remaining > 0) {
      if (zone === 'shieldCore') {
        this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - remaining);
      } else {
        this.damageZones[zone] = Math.min(100, this.damageZones[zone] + remaining);
      }

      const avgDamage = (
        this.damageZones.frontHull * 0.35 +
        this.damageZones.rearEngine * 0.25 +
        this.damageZones.leftWing * 0.20 +
        this.damageZones.rightWing * 0.20
      );
      this.hullHealth = Math.max(0, Math.round(100 - avgDamage));
      this.callbacks.onHullUpdate?.(this.hullHealth);

      if (this.damageZones.frontHull >= 100 || this.hullHealth <= 0) {
        this.destroyPlayerShip('CRITICAL COMPONENT DAMAGE BREACH');
        return;
      }
    }

    this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
  }

  public cycleSpectatorTarget() {
    this.spectatorTargetIndex++;
  }

  private updateThrusterParticles(dt: number) {
    if (
      !this.thrusterPositionsArray ||
      !this.thrusterColorsArray ||
      !this.thrusterTrailsPoints ||
      !this.playerShipGroup
    )
      return;

    const sample = this.track.getSampleAt(this.splineT);
    const flameCfg = THRUSTER_FLAME_CONFIGS.find(t => t.id === this.localThrusterColor);
    const flameColor = new THREE.Color(flameCfg ? flameCfg.hex : 0x00f0ff);

    if (this.currentSpeed > 5 && this.isRacing) {
      const leftNozzle = this.playerShipGroup.position
        .clone()
        .add(sample.binormal.clone().multiplyScalar(-1.2))
        .add(sample.tangent.clone().multiplyScalar(-2.8));
      const rightNozzle = this.playerShipGroup.position
        .clone()
        .add(sample.binormal.clone().multiplyScalar(1.2))
        .add(sample.tangent.clone().multiplyScalar(-2.8));

      const nozzles = [leftNozzle, rightNozzle];
      for (let n = 0; n < nozzles.length; n++) {
        for (let i = 0; i < this.thrusterParticles.length; i++) {
          const p = this.thrusterParticles[i];
          if (p.life <= 0) {
            p.pos.copy(nozzles[n]);
            p.maxLife = 0.3 + (this.isBoosting ? 0.25 : 0.15);
            p.life = p.maxLife;

            const backward = sample.tangent.clone().negate().multiplyScalar(this.currentSpeed * 0.4 + 10);
            backward.add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
              )
            );
            p.vel.copy(backward);
            break;
          }
        }
      }
    }

    for (let i = 0; i < this.thrusterParticles.length; i++) {
      const p = this.thrusterParticles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.add(p.vel.clone().multiplyScalar(dt));
        const alpha = Math.max(0, p.life / p.maxLife);
        this.thrusterPositionsArray[i * 3] = p.pos.x;
        this.thrusterPositionsArray[i * 3 + 1] = p.pos.y;
        this.thrusterPositionsArray[i * 3 + 2] = p.pos.z;
        this.thrusterColorsArray[i * 3] = flameColor.r * alpha;
        this.thrusterColorsArray[i * 3 + 1] = flameColor.g * alpha;
        this.thrusterColorsArray[i * 3 + 2] = flameColor.b * alpha;
      } else {
        this.thrusterPositionsArray[i * 3 + 1] = -9999;
      }
    }
    this.thrusterTrailsPoints.geometry.attributes.position.needsUpdate = true;
    this.thrusterTrailsPoints.geometry.attributes.color.needsUpdate = true;
  }

  private updateCollisionSparks(dt: number) {
    if (
      !this.sparkPositionsArray ||
      !this.sparkColorsArray ||
      !this.collisionSparksPoints
    )
      return;

    for (let i = 0; i < this.collisionSparks.length; i++) {
      const s = this.collisionSparks[i];
      if (s.life > 0) {
        s.life -= dt;
        s.pos.add(s.vel.clone().multiplyScalar(dt));
        s.vel.y -= 9.8 * dt * 0.6;
        const alpha = Math.max(0, s.life / s.maxLife);
        this.sparkPositionsArray[i * 3] = s.pos.x;
        this.sparkPositionsArray[i * 3 + 1] = s.pos.y;
        this.sparkPositionsArray[i * 3 + 2] = s.pos.z;
        this.sparkColorsArray[i * 3] = s.color.r * alpha;
        this.sparkColorsArray[i * 3 + 1] = s.color.g * alpha;
        this.sparkColorsArray[i * 3 + 2] = s.color.b * alpha;
      } else {
        this.sparkPositionsArray[i * 3 + 1] = -9999;
      }
    }
    this.collisionSparksPoints.geometry.attributes.position.needsUpdate = true;
    this.collisionSparksPoints.geometry.attributes.color.needsUpdate = true;
  }

  public destroyPlayerShip(reason: string = 'HULL BREACHED') {
    if (this.invulnerableTimer > 0 || this.isDestroyed) return;
    this.isDestroyed = true;

    // In Final Collapse mode during active evacuation, ship destruction triggers terminal evacuation failure
    if (this.activeGameMode === 'BLACK_HOLE' && this.finalCollapseManager?.evacuation.evacuationActive) {
      if (!this.finalCollapseManager.evacuation.evacuationSuccess && !this.finalCollapseManager.evacuation.evacuationFailed) {
        this.finalCollapseManager.triggerFailure('CRITICAL_HULL_BREACH', false, this.playerShipGroup?.position);
      }
    }
    this.respawnTimer = 1.8;
    this.currentSpeed = 0;
    this.isBoosting = false;
    this.isDrifting = false;
    this.driftChargeTime = 0;
    this.playerCollisionAngularVelocity = 0;
    this.playerCollisionAngularDisplacement = 0;
    this.playerCollisionRecoveryTimer = 0;
    sound.playExplosion();

    const shipPos = this.playerShipGroup?.position || new THREE.Vector3();
    this.triggerCollisionBurst(shipPos, 0xff0055, 60);
    this.triggerCollisionBurst(shipPos, 0x00f0ff, 30);

    if (this.cameraShakeEnabled) {
      this.cameraShake = 1.3;
    }
    if (this.playerShipGroup) {
      this.playerShipGroup.visible = false;
    }

    this.callbacks.onShipDestroyed?.(reason, 1.8);
    this.callbacks.onSpeedUpdate(0);
  }

  public respawnPlayerShip() {
    this.isDestroyed = false;
    this.respawnTimer = 0;

    const currentRoute = this.junctionManager?.playerRouteProgress?.activeRouteId || 'main_route';
    const recovery = this.track.trackManager?.respawnManager?.getSafeRecoveryPoint(this.splineT, currentRoute);
    if (recovery) {
      this.splineT = recovery.splineT;
      if (recovery.routeId === 'main_route' && this.junctionManager) {
        this.junctionManager.playerRouteProgress.isInBranch = false;
        this.junctionManager.playerRouteProgress.activeJunctionId = null;
        this.junctionManager.playerRouteProgress.activeRouteId = null;
        this.junctionManager.playerRouteProgress.branchRouteInstance = null;
        this.junctionManager.playerRouteProgress.progress = 0;
      }
      this.currentSpeed = Math.max(20, recovery.safeSpeed);
    } else if (this.extendedPathManager) {
      const safeNode = this.extendedPathManager.getSafeRespawn(this.splineT);
      this.splineT = safeNode.t;
      this.lateralOffset = safeNode.safeLateral;
      this.currentSpeed = 20;
    } else {
      this.splineT = this.latestValidCheckpoint.t;
      this.currentSpeed = 20;
    }

    this.lateralOffset = 0;
    this.hullHealth = 100;
    this.invulnerableTimer = 2.5;
    this.shipRoll = 0;
    this.playerCollisionAngularVelocity = 0;
    this.playerCollisionAngularDisplacement = 0;
    this.playerCollisionRecoveryTimer = 0;
    this.collisionCooldown = 1.5;
    this.cameraShake = 0;
    this.collisionFovPunch = 0;

    const sample = this.track.getSampleAt(this.splineT);
    if (this.playerShipGroup) {
      const rotMatrix = new THREE.Matrix4().makeBasis(sample.binormal, sample.normal, sample.tangent);
      this.playerShipGroup.rotation.setFromRotationMatrix(rotMatrix);
      const safePos = sample.point.clone().add(sample.normal.clone().multiplyScalar(2.0));
      this.playerShipGroup.position.copy(safePos);
      this.playerShipGroup.visible = true;
    }
    sound.playRespawn();

    const safePos = this.playerShipGroup?.position || new THREE.Vector3();
    this.triggerCollisionBurst(safePos, 0x00f0ff, 40);

    this.callbacks.onShipRespawned?.();
    this.callbacks.onHullUpdate?.(100);
    this.damageZones.shieldCore = 100;
    this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
    this.callbacks.onWrongWayUpdate?.(false);
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
  }

  public toggleCameraMode(): CameraMode {
    if (this.cameraMode === 'CHASE_NEAR') {
      this.cameraMode = 'CHASE_FAR';
    } else if (this.cameraMode === 'CHASE_FAR') {
      this.cameraMode = 'COCKPIT';
    } else if (this.cameraMode === 'COCKPIT') {
      if (this.activeGameMode === 'BLACK_HOLE') {
        this.cameraMode = 'WHOLE_BLACK_HOLE';
      } else {
        this.cameraMode = 'CHASE_NEAR';
      }
    } else {
      this.cameraMode = 'CHASE_NEAR';
    }
    this.callbacks.onCameraModeChange?.(this.cameraMode);
    return this.cameraMode;
  }

  public toggleWholeBlackHoleCamera(): CameraMode {
    // Whole-black-hole view is intentionally available only before gameplay.
    if (this.isRacing) {
      return this.cameraMode;
    }
    if (this.cameraMode === 'WHOLE_BLACK_HOLE') {
      this.cameraMode = 'CHASE_NEAR';
    } else {
      this.cameraMode = 'WHOLE_BLACK_HOLE';
    }
    this.callbacks.onCameraModeChange?.(this.cameraMode);
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    this.callbacks.onCameraModeChange?.(this.cameraMode);
  }

  public setCameraShakeEnabled(enabled: boolean) {
    this.cameraShakeEnabled = enabled;
  }

  public graphicsQuality: GraphicsQuality = 'HIGH';
  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    const pixelRatio =
      quality === 'LOW'
        ? 1.0
        : quality === 'MEDIUM'
        ? Math.min(window.devicePixelRatio, 1.25)
        : Math.min(window.devicePixelRatio, 2.0);
    this.renderer.setPixelRatio(pixelRatio);
    if (this.container) {
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    if (this.supermassiveBlackHole) {
      this.supermassiveBlackHole.setQuality(quality === 'LOW' ? 'LOW' : quality === 'MEDIUM' ? 'MEDIUM' : 'HIGH');
    }
  }

  public getGraphicsQuality(): GraphicsQuality {
    return this.graphicsQuality;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public triggerGameOver(reason: string = 'HULL BREACHED') {
    this.isRacing = false;
    sound.stopEngine();
    sound.playGameOver();

    const stats: RunStats = {
      distance: Math.floor(this.totalDistanceTraveled),
      creditsCollected: this.sessionCredits,
      topSpeed: this.maxSpeedReached,
      survivalTime: Math.floor((Date.now() - this.raceStartTime) / 1000),
      obstaclesAvoided: Math.max(0, Math.floor(this.totalDistanceTraveled / 40) - this.hitCount),
      reason,
    };
    this.callbacks.onGameOver?.(stats);
  }

  public restartGame() {
    this.sessionCredits = 0;
    this.hullHealth = 100;
    this.hitCount = 0;
    this.maxSpeedReached = 0;
    this.reachedMilestones.clear();
    this.phaseShieldTimer = 0;
    this.creditMagnetTimer = 0;
    this.hyperBoostTimer = 0;
    this.activePowerUpsList = [];

    this.callbacks.onHullUpdate?.(100);
    this.callbacks.onPowerUpsUpdate?.([]);
    this.callbacks.onDistanceUpdate?.(0);

    this.buildCreditsField();
    this.buildPowerUpPods();
    this.resetToStart();
    if (this.quantumCountdownClock) {
      this.quantumCountdownClock.reset();
    }
    this.startRace();
  }

  public pauseGame() {
    this.isPaused = true;
    if (this.quantumCountdownClock) {
      this.quantumCountdownClock.setPaused(true);
    }
    sound.stopEngine();
  }

  public resumeGame() {
    this.isPaused = false;
    if (this.quantumCountdownClock) {
      this.quantumCountdownClock.setPaused(false);
    }
    if (this.isRacing) {
      sound.startEngine();
    }
  }

  public cycleCosmicBiome(): CosmicBiomeId {
    if (this.environmentDirector) {
      const nextBiome = this.environmentDirector.cycleNextBiome();
      return nextBiome;
    }
    return 'CRYO_NEBULA';
  }

  public setCosmicBiome(biomeId: CosmicBiomeId) {
    if (this.environmentDirector) {
      this.environmentDirector.setBiome(biomeId);
    }
  }

  public setQuantumCountdownDuration(seconds: number) {
    if (!this.quantumCountdownClock) return;

    // Quantum Launch Pro / Submode 10 is a fixed 15:00 / 100-event timeline.
    // Never allow the generic 05:00/03:00 presets to replace its authoritative clock.
    if (this.activeGameMode === 'BLACK_HOLE' && this.modeManager.blackHoleSubmode === 10) {
      this.quantumCountdownClock.setDuration(900);
      return;
    }

    this.quantumCountdownClock.setDuration(Math.max(1, Math.floor(seconds)));
  }

  public toggleQuantumCountdownMute(): boolean {
    if (this.quantumCountdownClock) {
      this.quantumCountdownClock.audioMuted = !this.quantumCountdownClock.audioMuted;
      return this.quantumCountdownClock.audioMuted;
    }
    return false;
  }

  public setGameMode(mode: GameMode, difficulty: GameDifficulty = 'NORMAL') {
    this.activeGameMode = mode;
    this.activeDifficulty = difficulty;
    this.modeManager.setMode(mode);

    // 1. Authoritative Mode-Specific Environment Management
    if (this.modeEnvironmentManager) {
      const envProfile = this.modeEnvironmentManager.loadEnvironment(mode, this.track?.curve || null, this.trackId);
      if (mode !== 'BLACK_HOLE' && mode !== 'SINGULARITY_RUN' && envProfile) {
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.setHex(envProfile.atmosphere.fogColor);
          this.scene.fog.density = envProfile.atmosphere.fogDensity;
        }
        if (this.mainAmbientLight) {
          this.mainAmbientLight.color.setHex(envProfile.lighting.ambientColor);
          this.mainAmbientLight.intensity = envProfile.lighting.ambientIntensity;
        }
        if (this.mainDirLight) {
          this.mainDirLight.color.setHex(envProfile.lighting.sunColor);
          this.mainDirLight.intensity = envProfile.lighting.sunIntensity;
          this.mainDirLight.position.set(...envProfile.lighting.sunPosition);
        }
      }
    }

    if (this.blackHoleCinematicManager) {
      if (mode === 'BLACK_HOLE') {
        this.blackHoleCinematicManager.start('INTRO');
        if (this.modeManager.blackHoleSubmode === 10) {
          this.blackHoleCinematicManager.stop();
        }
        if (!this.supermassiveBlackHole) {
          this.supermassiveBlackHole = new SupermassiveBlackHoleVisuals(this.scene);
          this.supermassiveBlackHole.setQuality(this.graphicsQuality === 'LOW' ? 'LOW' : this.graphicsQuality === 'MEDIUM' ? 'MEDIUM' : 'HIGH');
        }
        if (!this.planetaryCollision) {
          this.planetaryCollision = new PlanetaryCollisionVisuals(this.scene);
        }
        if (!this.trackDestruction) {
          this.trackDestruction = new TrackDestructionVisuals(this.scene);
        }
        if (!this.holographicWarnings) {
          this.holographicWarnings = new HolographicWarningSystem(this.scene);
        }
        // The Final Collapse physical environment is exclusive to Quantum Launch Pro Submode 10.
        if (this.modeManager.blackHoleSubmode === 10 && !this.collapseEnvironments) {
          const bhPos = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);
          this.collapseEnvironments = new DynamicCollapseEnvironmentsManager(this.scene, bhPos);

          if (this.supermassiveBlackHole) {
            this.collapseEnvironments.part1EventManager.bindBlackHoleEnvironment(this.supermassiveBlackHole);
          }

          this.collapseEnvironments.part1EventManager.onEventNotification(notif => {
            if (this.blackHoleCinematicManager) {
              this.blackHoleCinematicManager.setQuantumEventTelemetry({
                index: notif.eventNumber,
                title: notif.title,
                subtitle: notif.description,
                phase: 'GAMEPLAY',
                severity: notif.severity,
              });
              const nextEvt = this.collapseEnvironments?.part1EventManager.nextEvent;
              this.blackHoleCinematicManager.setStage93Telemetry({
                index: notif.eventNumber,
                title: notif.title,
                areaName: notif.areaName,
                hazardDescription: notif.description,
                nextTitle: nextEvt?.title ?? null,
                nextSecondsUntil: notif.secondsUntilNext,
                severity: notif.severity,
              });
            }
          });
        }

        // Initialize Expanded Quantum Route System for Mode 21 Black Hole submodes
        if (!this.quantumRouteSystem) {
          this.quantumRouteSystem = new QuantumRouteSystem(this.scene);
        }

        // Enable physical Orbital Launcher and terminal routes (locked until 1st lap completed)
        this.junctionManager.setFinalCollapseMode(true);
        this.junctionManager.setFinalCollapseRoutesUnlocked(false);

        // Configure Quantum Countdown Clock
        if (this.quantumCountdownClock) {
          const isSub10 = this.modeManager.blackHoleSubmode === 10;
          this.quantumCountdownClock.activeSubmodeNumber = this.modeManager.blackHoleSubmode;
          if (isSub10) {
            this.quantumCountdownClock.setDuration(900);
            this.quantumCountdownClock.gantryMeshGroup.visible = true;
          } else {
            this.quantumCountdownClock.setPaused(true);
            this.quantumCountdownClock.gantryMeshGroup.visible = false;
            this.callbacks.onQuantumCountdownUpdate?.(null);
          }
        }

        // Set signature cosmic biome for this submode
        if (this.environmentDirector) {
          this.environmentDirector.updateBySubmode(this.modeManager.blackHoleSubmode, 0);
        }
      } else {
        this.blackHoleCinematicManager.stop();
        if (this.quantumCountdownClock) {
          this.quantumCountdownClock.activeSubmodeNumber = 0;
          this.quantumCountdownClock.setPaused(true);
          this.quantumCountdownClock.gantryMeshGroup.visible = false;
        }
        this.callbacks.onQuantumCountdownUpdate?.(null);
        this.callbacks.onBlackHoleCinematicTelemetry?.(null);
        if (this.quantumRouteSystem) {
          this.quantumRouteSystem.dispose();
          this.quantumRouteSystem = null;
        }
        this.junctionManager.setFinalCollapseMode(false);
        if (this.collapseEnvironments) {
          this.collapseEnvironments.dispose();
          this.collapseEnvironments = null;
        }
        if (this.supermassiveBlackHole) {
          this.supermassiveBlackHole.dispose();
          this.supermassiveBlackHole = null;
        }
        if (this.planetaryCollision) {
          this.planetaryCollision.dispose();
          this.planetaryCollision = null;
        }
        if (this.trackDestruction) {
          this.trackDestruction.dispose();
          this.trackDestruction = null;
        }
        if (this.holographicWarnings) {
          this.holographicWarnings.dispose();
          this.holographicWarnings = null;
        }
      }
    }

    if (this.extendedPathManager) {
      this.extendedPathManager.setMode(mode);
      this.setTrack(this.trackId, this.extendedPathManager.activeConfig.controlPoints);
    }

    const diffProfile = getDifficultyProfile(mode, difficulty);

    if (this.hazardManager) {
      this.hazardManager.initForMode(mode, difficulty, this.track?.curve || null);
    }

    if (this.finishCinematicManager) {
      this.finishCinematicManager.setMode(mode);
    }

    if (mode === 'SINGULARITY_RUN') {
      if (!this.blackHoleManager) {
        this.blackHoleManager = new BlackHoleManager(this.scene);
      }
      if (this.modeEntitySystem) {
        this.modeEntitySystem.clear();
      }
    } else {
      if (this.blackHoleManager) {
        this.blackHoleManager.dispose();
        this.blackHoleManager = null;
      }
      if (!this.modeEntitySystem) {
        this.modeEntitySystem = new ModeEntitySystem(this.scene, this.modeManager);
      }
      this.modeEntitySystem.initModeEntities(mode, this.track?.curve || null, diffProfile.hazardDensity);
    }
  }

  public getPlayerRank(): number {
    const playerScore = (this.currentLap - 1) * 100000 + this.splineT * 10000;
    let rank = 1;
    for (const ai of this.localAIRacers) {
      const aiScore = (ai.currentLap - 1) * 100000 + ai.t * 10000;
      if (aiScore > playerScore) rank++;
    }
    return rank;
  }

  private isInitializingRace: boolean = false;

  public validateRaceStartState(expectedBotCount: number): { isValid: boolean; message: string } {
    if (!this.track || !this.track.curve || this.track.totalLength <= 0) {
      this.setTrack(this.trackId || 'circuit_alpha');
    }

    if (!this.playerShipGroup) {
      this.setPlayerShip(
        this.localShipId,
        this.localColor,
        this.localSecondaryColor,
        this.localDecal,
        this.localUpgrades,
        this.localThrusterColor,
        this.localCockpitSkin
      );
    }
    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }

    if (this.localAIRacers.length !== expectedBotCount) {
      this.initAIRacers({
        mode: this.activeGameMode,
        trackId: this.trackId,
        difficulty: this.aiDifficulty,
        botCount: expectedBotCount,
        laps: this.totalLaps,
      });
    }

    // Verify all racers have valid positions
    if (this.playerShipGroup && isNaN(this.playerShipGroup.position.x)) {
      this.resetToStart();
    }
    for (const ai of this.localAIRacers) {
      if (isNaN(ai.group.position.x) || isNaN(ai.t)) {
        const sample = this.track.getSampleAt(0);
        ai.group.position.copy(sample.point);
        ai.t = 0;
      }
    }

    this.snapCameraToShip();
    return { isValid: true, message: 'Race state verified successfully.' };
  }

  public startAIRace(config: AIRaceConfig) {
    if (this.isInitializingRace) return;
    this.isInitializingRace = true;

    try {
      // 1. Completely reset previous race state
      this.resetRaceState();
      this.finalCollapseCatastropheActive = false;
      this.finalCollapseShelterEntered = false;
      this.finalCollapseEscapeRouteEntered = false;
    this.finalCollapseWormholeRouteEntered = false;
      this.finalCollapseRaceFinishSent = false;
      this.finalCollapseLastEvent = 'NONE';
      this.finalCollapseEntryReady = false;
      this.finalCollapseDescending = false;
      this.finalCollapseHangarEntered = false;
      this.finalCollapseParkingAligned = false;
      this.finalCollapseShipParked = false;
      this.finalCollapseShipSecured = false;
      this.finalCollapseHangarSealed = false;
      this.finalCollapseAftermathStarted = false;
      this.finalCollapseClampStep = 0;
      this.shelterNavigationActive = false;
      this.shelterX = 0;
      this.shelterZ = 15;
      this.shelterY = 0;
      this.shelterHeading = 0;
      this.shelterClampTimer = 0;
      this.finalCollapseDoorAudioPlayed = false;
      this.finalCollapseDoorSealedAudioPlayed = false;
      this.finalCollapseManager?.start();

      // 2. Resolve Track, Laps & Difficulty
      if (config.mode === 'VOID_CHAMPIONSHIP') {
        const stage = championshipManager.getCurrentStage();
        this.activeDifficulty = stage.difficulty;
        this.totalLaps = stage.laps;
        this.setGameMode('VOID_CHAMPIONSHIP', stage.difficulty);
        this.setTrack(stage.trackId);
      } else {
        this.totalLaps = config.laps || 2;
        if (config.mode) {
          if (config.mode === 'BLACK_HOLE') {
            const submodeId = config.blackHoleSubmode || 'FINAL_COLLAPSE';
            const selectedSubmode = BLACK_HOLE_SUBMODES.find(
              submode => submode.id === submodeId
            );
            if (selectedSubmode) {
              this.modeManager.setBlackHoleSubmode(selectedSubmode.number);
            }
          }

          this.setGameMode(config.mode, this.activeDifficulty);

          if (config.mode === 'BLACK_HOLE') {
            const submodeId = config.blackHoleSubmode || 'FINAL_COLLAPSE';
            const selectedSubmode = BLACK_HOLE_SUBMODES.find(
              submode => submode.id === submodeId
            );

            if (selectedSubmode) {
              this.modeManager.setBlackHoleSubmode(selectedSubmode.number);
              this.blackHoleCinematicManager?.setSubmode10Presentation(selectedSubmode.number === 10);
              if (selectedSubmode.number === 10) {
                this.finalCollapseManager?.start();
                this.blackHoleCinematicManager?.stop();
              }
              this.junctionManager.setFinalCollapseMode(true);
              this.junctionManager.setFinalCollapseRoutesUnlocked(false);

              if (this.quantumCountdownClock) {
                const isSub10 = selectedSubmode.number === 10;
                this.quantumCountdownClock.activeSubmodeNumber = selectedSubmode.number;
                if (isSub10) {
                  this.quantumCountdownClock.setDuration(900);
                  this.quantumCountdownClock.gantryMeshGroup.visible = true;
                } else {
                  this.quantumCountdownClock.setPaused(true);
                  this.quantumCountdownClock.gantryMeshGroup.visible = false;
                  this.callbacks.onQuantumCountdownUpdate?.(null);
                }
              }
            }
          }
        }
        this.setTrack(config.trackId || 'circuit_alpha');
      }

      // 3. Determine Mode-Specific Bot Count
      // Default standard racing modes have 5 total racers: 1 player + 4 AI racers
      const getModeDefaultBotCount = (mode?: GameMode): number => {
        switch (mode) {
          case 'QUANTUM_TIME_TRIAL': return 0; // Pure solo time attack (1 racer)
          case 'RIVAL_DUEL': return 1;          // 1v1 duel against Zer0 (2 racers)
          case 'GRAVITY_FREE': return 2;        // Freestyle stunt (3 racers)
          case 'COSMIC_TREASURE_HUNT': return 2;// Radar search (3 racers)
          case 'DEBRIS_SURVIVAL': return 3;     // Endless debris (4 racers)
          case 'ENERGY_HEIST': return 3;        // Energy core collection (4 racers)
          case 'RING_RUNNER': return 3;         // Rotating ring precision (4 racers)
          case 'RELAY_RACE': return 3;          // Squad relay (4 racers)
          default: return 4;                    // Standard 5 total racers (1 player + 4 AI)
        }
      };

      const targetBotCount =
        config.botCount !== undefined ? config.botCount : getModeDefaultBotCount(config.mode || this.activeGameMode);

      const adjustedConfig: AIRaceConfig = {
        ...config,
        botCount: targetBotCount,
      };

      if (config.mode === 'QUANTUM_TIME_TRIAL') {
        adjustedConfig.botCount = 0;
      } else if (config.mode === 'RIVAL_DUEL') {
        adjustedConfig.botCount = 1;
        adjustedConfig.difficulty = 'ELITE';
      }

      // 4. Spawn Player and AI Racers
      this.initAIRacers(adjustedConfig);
      this.resetToStart();
      this.isAIRaceActive = true;
      this.isRacing = false;
      this.isPaused = false;

      // 5. Notify HUD & Ranking of Initial Racer Count
      const totalRacers = 1 + this.localAIRacers.length;
      this.callbacks.onRankUpdate?.(1, totalRacers);
      this.callbacks.onLapUpdate?.(1, this.totalLaps);
      this.callbacks.onCountdownTick?.(3);

      // 6. Re-init mode entities with active track spline
      if (this.activeGameMode !== 'SINGULARITY_RUN') {
        const diffProfile = getDifficultyProfile(this.activeGameMode, this.activeDifficulty);
        if (!this.modeEntitySystem) {
          this.modeEntitySystem = new ModeEntitySystem(this.scene, this.modeManager);
        }
        this.modeEntitySystem.initModeEntities(this.activeGameMode, this.track?.curve || null, diffProfile.hazardDensity);
      }

      // 7. Validate Race Start State
      this.validateRaceStartState(adjustedConfig.botCount);

      // 8. Launch Mode-Specific Cinematic Introduction & Starting Sequence
      const rival = this.localAIRacers.length > 0 ? {
        name: this.localAIRacers[0].name,
        shipId: this.localAIRacers[0].shipId,
        personality: this.localAIRacers[0].personality || 'AGGRESSIVE',
      } : undefined;

      try {
        if (this.activeGameMode === 'BLACK_HOLE' && this.blackHoleCinematicManager) {
          this.blackHoleCinematicManager.start('PRE_RACE');
        }
        this.raceIntroManager.setMode(this.activeGameMode, this.track);
        this.raceIntroManager.startIntro(
          this.playerShipGroup,
          this.localAIRacers,
          0,
          rival
        );
      } catch (introErr) {
        // Never bypass the race-start countdown. If a non-critical intro visual
        // component fails, recover directly into the existing 3-2-1-GO phase.
        // The Quantum Launch 08:00 collapse clock starts only after GO.
        console.warn('[VOID-RIDER Engine] Non-critical intro visual error, recovering into 3-2-1-GO countdown:', introErr);
        this.raceIntroManager?.forceCountdown();
      }
    } finally {
      this.isInitializingRace = false;
    }
  }

  public skipIntro() {
    this.raceIntroManager?.skip();
  }

  public skipFinishCinematic() {
    this.finishCinematicManager?.skip();
  }

  public clearAIRacers() {
    this.localAIRacers.forEach(ai => {
      if (this.collisionSystem) {
        this.collisionSystem.unregisterParticipant(ai.id);
      }
      this.scene.remove(ai.group);
      ai.group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        } else if (child instanceof THREE.Sprite) {
          child.geometry?.dispose();
          if (child.material) {
            child.material.map?.dispose();
            child.material.dispose();
          }
        }
      });
    });
    this.localAIRacers = [];
    this.isAIRaceActive = false;
  }

  public initAIRacers(config: AIRaceConfig) {
    this.clearAIRacers();
    this.isAIRaceActive = true;
    this.aiDifficulty = config.difficulty;

    const botRoster: {
      name: string;
      shipId: string;
      color: string;
      secondary: string;
      baseSpeed: number;
      personality: AIPersonality;
    }[] = [
      { name: 'Zer0', shipId: 'apex_phantom', color: '#00f0ff', secondary: '#ff0055', baseSpeed: 295, personality: 'AGGRESSOR' },
      { name: 'Nova', shipId: 'vortex_nemesis', color: '#ff00aa', secondary: '#00f0ff', baseSpeed: 288, personality: 'SPEEDSTER' },
      { name: 'Viper', shipId: 'solaris_stinger', color: '#ffaa00', secondary: '#ffff00', baseSpeed: 280, personality: 'TACTICIAN' },
      { name: 'Aegis', shipId: 'void_valkyrie', color: '#9900ff', secondary: '#00ffea', baseSpeed: 275, personality: 'DEFENDER' },
      { name: 'Titan-X', shipId: 'apex_phantom', color: '#39ff14', secondary: '#ffffff', baseSpeed: 270, personality: 'BALANCED' },
    ];

    const count = Math.min(config.botCount !== undefined ? config.botCount : 4, botRoster.length);
    const normDiff = normalizeAIDifficulty(config.difficulty);

    for (let i = 0; i < count; i++) {
      const p = botRoster[i];
      const shipGroup = createShipMesh(p.shipId, p.color, p.secondary);
      this.scene.add(shipGroup);

      const thrusters: THREE.Mesh[] = [];
      shipGroup.traverse(child => {
        if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
          thrusters.push(child);
        }
      });

      const startGridT = (1.0 - 0.007 * (i + 1) + 1.0) % 1.0;
      const initialLaneX = ((i % 3) - 1) * 5.5;
      const rankNum = i + 2;
      const rankStr = rankNum === 1 ? '1ST' : rankNum === 2 ? '2ND' : rankNum === 3 ? '3RD' : `${rankNum}TH`;
      const nameplate = this.createNameplateSprite(p.name, rankStr, p.color, p.personality);
      shipGroup.add(nameplate);

      // Immediately set physical position and rotation on track
      const sample = this.track.getSampleAt(startGridT);
      shipGroup.position
        .copy(sample.point)
        .addScaledVector(sample.binormal, initialLaneX)
        .addScaledVector(sample.normal, 1.0);
      _botRotMatrix.makeBasis(sample.binormal, sample.normal, _botNegTangent.copy(sample.tangent).negate());
      shipGroup.quaternion.setFromRotationMatrix(_botRotMatrix);

      const aiMass =
        p.shipId === 'vortex_nemesis'
          ? 1.4
          : p.shipId === 'apex_phantom'
          ? 0.95
          : p.shipId === 'solaris_stinger'
          ? 0.85
          : 1.1;

      // Instantiate AI Tactical & Combat subsystems
      const canonicalPersonality = normalizeAIPersonality(p.personality);
      const tactical = this.aiRacingSystem.createTacticalState(
        normDiff,
        canonicalPersonality,
        initialLaneX
      );
      const combat = this.aiRacingSystem.createCombatState(shipGroup, p.color);

      this.localAIRacers.push({
        id: `local_ai_${i}`,
        name: p.name,
        shipId: p.shipId,
        color: p.color,
        secondaryColor: p.secondary,
        group: shipGroup,
        nameplateSprite: nameplate,
        thrusters,
        progressDistance: startGridT * this.track.totalLength,
        currentLap: 1,
        t: startGridT,
        speed: p.baseSpeed * tactical.params.speedMultiplier * (0.8 + Math.random() * 0.25),
        targetSpeed: p.baseSpeed * tactical.params.speedMultiplier,
        currentLateral: initialLaneX,
        targetLateral: initialLaneX,
        lateralSpeed: tactical.params.lateralSpeedMultiplier,
        isBoosting: false,
        boostCooldown: 3 + Math.random() * 6,
        boostDuration: 0,
        difficulty: config.difficulty,
        personality: canonicalPersonality,
        isDestroyed: false,
        respawnTimer: 0,
        rank: rankNum,
        shield: 100,
        hull: 100,
        mass: aiMass,
        radius: 2.5,
        invulnerableTimer: 0,
        collisionCooldown: 0,
        recoveryTimer: 0,
        angularVelocity: 0,
        angularDisplacement: 0,
        tactical,
        combat,
      });
    }

    const totalRacers = 1 + this.localAIRacers.length;
    this.callbacks.onRankUpdate?.(1, totalRacers);
  }

  private createNameplateSprite(
    name: string,
    rankStr: string,
    colorHex: string,
    personality?: AIPersonality
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.drawNameplateCanvas(ctx, name, rankStr, colorHex, personality);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 2.08, 1);
    sprite.position.set(0, 3.5, 0);
    sprite.userData = { canvas, ctx, texture, name, rankStr, colorHex, personality };
    return sprite;
  }

  private drawNameplateCanvas(
    ctx: CanvasRenderingContext2D,
    name: string,
    rankStr: string,
    colorHex: string,
    personality?: AIPersonality
  ) {
    ctx.clearRect(0, 0, 200, 130);

    ctx.fillStyle = 'rgba(10, 15, 30, 0.90)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 184, 114, 16);
    ctx.fill();
    ctx.stroke();

    const pillW = 90;
    const pillH = 30;
    const pillX = (200 - pillW) / 2;
    const pillY = 16;
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 15);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankStr, 100, pillY + pillH / 2);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 22px "Orbitron", sans-serif';
    ctx.fillText(name, 100, 76);

    if (personality) {
      ctx.fillStyle = colorHex;
      ctx.font = '700 11px "Rajdhani", sans-serif';
      ctx.fillText(`[ ${personality} ]`, 100, 102);
    }
  }

  private updateNameplateRank(sprite: THREE.Sprite, newRankStr: string) {
    const data = sprite.userData;
    if (!data || data.rankStr === newRankStr) return;
    data.rankStr = newRankStr;
    if (data.ctx) {
      this.drawNameplateCanvas(data.ctx, data.name, newRankStr, data.colorHex, data.personality);
      data.texture.needsUpdate = true;
    }
  }

  private updateAIRacers(dt: number) {
    if (!this.isAIRaceActive || this.localAIRacers.length === 0) return;

    // While cinematic intro is running and controls are locked, pin AI ships to starting grid slots
    if (this.raceIntroManager && this.raceIntroManager.isControlsLocked) {
      for (const ai of this.localAIRacers) {
        const slot = this.raceIntroManager.getGridSlot(ai.id);
        if (slot && slot.worldPos.lengthSq() > 0) {
          // Grid slots are authored on/near the route surface. Keep cinematic ships
          // at the same hover height used by the normal ship transform so they do
          // not appear buried below the route during the intro.
          const gridSample = this.track.getSampleAt(slot.splineT);
          // GridSlot.worldPos already includes the canonical 1.6m hover height.
          ai.group.position.copy(slot.worldPos);
          ai.t = slot.splineT;
          ai.currentLateral = slot.lateralOffset;
          ai.speed = 0;
          const sample = gridSample;
          _botRotMatrix.makeBasis(sample.binormal, sample.normal, _botNegTangent.copy(sample.tangent).negate());
          ai.group.quaternion.setFromRotationMatrix(_botRotMatrix);
        }
      }
      return;
    }

    const trackLen = this.track.totalLength || 4600;
    const time = Date.now() * 0.003;

    // Snapshot player and AI states for tactical decision making
    const playerInfo = {
      t: this.splineT,
      speed: this.currentSpeed,
      lateral: this.lateralOffset,
      position: this.playerShipGroup?.position || new THREE.Vector3(),
      isDestroyed: this.isDestroyed,
      shield: this.damageZones.shieldCore,
      hull: this.hullHealth,
    };

    const otherAIs = this.localAIRacers.map(r => ({
      id: r.id,
      name: r.name,
      t: r.t,
      speed: r.speed,
      lateral: r.currentLateral,
      position: r.group.position,
      isDestroyed: r.isDestroyed,
      shield: r.shield,
      hull: r.hull,
      group: r.group,
    }));

    for (let i = 0; i < this.localAIRacers.length; i++) {
      const ai = this.localAIRacers[i];

      if (ai.isDestroyed) {
        ai.respawnTimer = (ai.respawnTimer || 0) - dt;
        if (ai.respawnTimer <= 0) {
          ai.isDestroyed = false;
          ai.group.visible = true;
          ai.targetLateral = 0;
          ai.currentLateral = 0;
          ai.shield = 100;
          ai.hull = 100;
          ai.invulnerableTimer = 2.5;
          ai.speed = 20;
          ai.angularVelocity = 0;
          ai.angularDisplacement = 0;
          this.triggerCollisionBurst(ai.group.position, 0x00f0ff, 25);
        }
        continue;
      }

      if (ai.invulnerableTimer && ai.invulnerableTimer > 0) {
        ai.invulnerableTimer = Math.max(0, ai.invulnerableTimer - dt);
        ai.group.visible = Math.floor(Date.now() / 80) % 2 === 0;
      } else if (!ai.group.visible) {
        ai.group.visible = true;
      }

      // Advanced AI Racing Intelligence Cycle (Tactical Line, Curvature Braking, Drift, Overtaking, Blocking, Missiles & Shields)
      if (ai.tactical && ai.combat) {
        this.aiRacingSystem.updateAIRacerTactics(
          ai,
          ai.tactical,
          ai.combat,
          playerInfo,
          otherAIs,
          this.missileManager,
          dt,
          this.isRacing
        );
      } else {
        // Fallback smooth lateral step
        ai.currentLateral = THREE.MathUtils.lerp(ai.currentLateral, ai.targetLateral, ai.lateralSpeed * dt);
      }

      // Obstacle impacts & damage
      for (const obs of this.track.obstacles) {
        if (ai.group.position.distanceTo(obs.position) < obs.radius + 1.2) {
          if (ai.combat?.isShieldActive) {
            // Shield absorbs kinetic impact!
            this.triggerCollisionBurst(ai.group.position, 0x00f0ff, 15);
            ai.speed = Math.max(25, ai.speed * 0.7);
          } else {
            ai.isDestroyed = true;
            ai.respawnTimer = 2.0;
            ai.group.visible = false;
            this.triggerCollisionBurst(ai.group.position, 0xff0055, 30);
            break;
          }
        }
      }

      if (ai.isDestroyed) continue;

      // AI Junction Evaluation & Branch Progression
      const nearbyJunc = this.junctionManager.detectNearbyJunction(ai.t);
      if (nearbyJunc && !ai.activeRouteId) {
        ai.activeJunctionId = nearbyJunc.junction.config.id;
        ai.activeRouteId = this.junctionManager.getAIRouteChoice(
          nearbyJunc.junction,
          ai.personality,
          ai.difficulty,
          ai.speed * 3.6,
          100
        );
        ai.branchProgress = 0;
      }

      let sample: SamplePoint;
      if (ai.activeRouteId && ai.activeJunctionId) {
        const junc = this.junctionManager.junctions.get(ai.activeJunctionId);
        const routeInst = junc?.routeInstances.get(ai.activeRouteId);
        if (routeInst && junc) {
          ai.branchProgress = (ai.branchProgress || 0) + (ai.speed * dt) / routeInst.totalLength;
          if (ai.branchProgress >= 1.0) {
            ai.t = junc.config.junctionEndT;
            ai.activeRouteId = null;
            ai.activeJunctionId = null;
            ai.branchProgress = 0;
            sample = this.track.getSampleAt(ai.t);
          } else {
            sample = routeInst.getSampleAt(ai.branchProgress);
            const startT = junc.config.junctionStartT;
            const endT = junc.config.junctionEndT;
            const effEndT = endT < startT ? endT + 1.0 : endT;
            const interpT = startT + ai.branchProgress * (effEndT - startT);
            ai.t = ((interpT % 1.0) + 1.0) % 1.0;
          }
        } else {
          sample = this.track.getSampleAt(ai.t);
        }
      } else {
        const advanceMeters = ai.speed * dt;
        ai.progressDistance += advanceMeters;
        const prevT = ai.t;
        ai.t = (ai.progressDistance % trackLen) / trackLen;
        if (prevT > 0.85 && ai.t < 0.15) {
          ai.currentLap++;
        }
        sample = this.track.getSampleAt(ai.t);
      }

      const hoverH = 1.5 + Math.sin(time + i) * 0.12;
      _botOffsetBinormal.copy(sample.binormal).multiplyScalar(ai.currentLateral);
      _botOffsetNormal.copy(sample.normal).multiplyScalar(hoverH);
      _botPos.copy(sample.point).add(_botOffsetBinormal).add(_botOffsetNormal);

      if (isFinite(_botPos.x) && isFinite(_botPos.y) && isFinite(_botPos.z)) {
        ai.group.position.copy(_botPos);
      }

      _botNegTangent.copy(sample.tangent).negate();
      if (sample.binormal.lengthSq() > 0.001 && sample.normal.lengthSq() > 0.001 && _botNegTangent.lengthSq() > 0.001) {
        _botRotMatrix.makeBasis(sample.binormal, sample.normal, _botNegTangent);
        ai.group.quaternion.setFromRotationMatrix(_botRotMatrix);
      }

      // Banking and drifting visual cues
      const lateralVel = (ai.targetLateral - ai.currentLateral);
      const isDrifting = ai.tactical?.isDrifting || false;
      const bankRoll = -Math.sign(lateralVel) * Math.min(isDrifting ? 0.65 : 0.45, Math.abs(lateralVel) * (isDrifting ? 0.18 : 0.1));
      ai.group.rotateZ(bankRoll);
      if (ai.angularDisplacement && Math.abs(ai.angularDisplacement) > 0.001) {
        ai.group.rotateY(ai.angularDisplacement);
      }

      const flameScale = 0.8 + (ai.speed * 3.6) / 120 + (ai.isBoosting ? 1.5 : 0);
      ai.thrusters.forEach(fl => fl.scale.set(1 + (ai.isBoosting ? 0.5 : 0), flameScale, 1 + (ai.isBoosting ? 0.5 : 0)));

      // Synchronize with PlayerCollisionSystem (Kinematics, Ramming, Knockback & Physical Resolution)
      if (this.collisionSystem && !ai.isDestroyed) {
        _aiVel.copy(sample.tangent).multiplyScalar(ai.speed);
        this.collisionSystem.registerParticipant({
          id: ai.id,
          category: 'AI_RACER',
          name: ai.name,
          position: ai.group.position,
          velocity: _aiVel,
          speed: ai.speed,
          direction: sample.tangent,
          radius: ai.radius || 2.5,
          mass: ai.mass || 1.0,
          shield: ai.combat?.isShieldActive ? 100 : (ai.shield ?? 100),
          hull: ai.hull ?? 100,
          isBoosting: ai.isBoosting,
          collisionCooldown: ai.collisionCooldown || 0,
          recoveryTimer: ai.recoveryTimer || 0,
          angularVelocity: ai.angularVelocity || 0,
          angularDisplacement: ai.angularDisplacement || 0,
          lateralOffset: ai.currentLateral,
          splineT: ai.t,
          invulnerableTimer: ai.invulnerableTimer || 0,
          isDestroyed: !!ai.isDestroyed,
          meshGroup: ai.group,
          applyDamage: (shieldLoss, hullLoss, impactForce) => {
            if (ai.combat?.isShieldActive) {
              shieldLoss *= 0.05;
              hullLoss *= 0.05;
            }
            ai.shield = Math.max(0, (ai.shield ?? 100) - shieldLoss);
            ai.hull = Math.max(0, (ai.hull ?? 100) - hullLoss);
            if (ai.hull <= 0 && !ai.isDestroyed) {
              ai.isDestroyed = true;
              ai.respawnTimer = 2.0;
              ai.group.visible = false;
              this.triggerCollisionBurst(ai.group.position, 0xff0055, 35);
            }
          },
          onCrash: (reason) => {
            ai.isDestroyed = true;
            ai.respawnTimer = 2.0;
            ai.group.visible = false;
            this.triggerCollisionBurst(ai.group.position, 0xff0055, 35);
          },
        });
      }
    }

    const allRacers = [
      {
        id: 'player',
        name: 'Player',
        score: (this.currentLap - 1) * 100000 + this.splineT * 10000,
        isPlayer: true,
        ai: null as LocalAIRacer | null,
      },
      ...this.localAIRacers.map(ai => ({
        id: ai.id,
        name: ai.name,
        score: (ai.currentLap - 1) * 100000 + ai.t * 10000,
        isPlayer: false,
        ai,
      })),
    ];

    allRacers.sort((a, b) => b.score - a.score);
    for (let r = 0; r < allRacers.length; r++) {
      const racer = allRacers[r];
      const rankNum = r + 1;
      const rankStr = rankNum === 1 ? '1ST' : rankNum === 2 ? '2ND' : rankNum === 3 ? '3RD' : `${rankNum}TH`;
      if (racer.isPlayer) {
        this.callbacks.onRankUpdate(rankNum, allRacers.length);
      } else if (racer.ai) {
        racer.ai.rank = rankNum;
        this.updateNameplateRank(racer.ai.nameplateSprite, rankStr);
      }
    }

    // Emit live AI debug telemetry if enabled
    if (this.callbacks.onAIDebugTelemetry) {
      const telemetry = this.aiRacingSystem.generateDebugTelemetry(
        this.localAIRacers.filter(r => r.tactical && r.combat) as any
      );
      this.callbacks.onAIDebugTelemetry(telemetry);
    }
  }

  public toggleAIDebug(enable?: boolean): boolean {
    return this.aiRacingSystem.isDebugActive =
      enable !== undefined ? enable : !this.aiRacingSystem.isDebugActive;
  }

  public isAIDebugEnabled(): boolean {
    return this.aiRacingSystem ? this.aiRacingSystem.isDebugActive : false;
  }

  public togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);
    if (this.isContextLost) return;

    try {
      const rawDt = this.clock.getDelta();
      const dt = isNaN(rawDt) || !isFinite(rawDt) ? 0.016 : Math.min(Math.max(0, rawDt), 0.1);

      if (!this.isPaused) {
        this.updateIntroCinematic(dt);
        this.updatePhysics(dt);
        this.updateAIRacers(dt);
        this.updatePowerUps(dt);
        this.updateCredits(dt);
        this.updatePowerUpPods(dt);
        this.updateEnergyBarriers(dt);
        this.updateCelestialBodies(dt);
        this.updateThrusterParticles(dt);
        this.updateCollisionSparks(dt);
        this.updateRemotePlayersInterpolation(dt);
        this.updateCamera(dt);
        this.updateSpeedParticles();
        this.updateAsteroids(dt);
        this.updateBeamSystem(dt);
        this.updateMissileSystem(dt);
        this.updateActiveShieldSystem(dt);
        this.updateHazardSystem(dt);
        this.updateMinimapSystem(dt);
        this.updateJunctions(dt);
      } else {
        // Paused loop: keep telemetry synced with zero dt
        this.updateMissileSystem(0);
        this.updateActiveShieldSystem(0);
        this.updateHazardSystem(0);
        this.updateMinimapSystem(0);
      }

      if (this.container) {
        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;
        if (cw > 0 && ch > 0) {
          const currentAspect = cw / ch;
          if (!isFinite(this.camera.aspect) || this.camera.aspect <= 0 || Math.abs(this.camera.aspect - currentAspect) > 0.005) {
            this.camera.aspect = currentAspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(cw, ch, false);
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    } catch (frameErr) {
      console.warn('[VOID-RIDER Engine] Transient frame anomaly caught and safely recovered:', frameErr);
    }
  };

  private updateIntroCinematic(dt: number) {
    if (!this.raceIntroManager) return;
    if (this.raceIntroManager.isIntroActive) {
      const behindDist = 14;
      const heightOff = 5.2;
      const shipPos = this.playerShipGroup?.position || new THREE.Vector3();
      const sample = this.track ? this.track.getSampleAt(this.splineT) : null;
      const defaultCamPos = shipPos.clone();
      const defaultLook = shipPos.clone();
      if (sample) {
        defaultCamPos
          .add(sample.tangent.clone().multiplyScalar(-behindDist))
          .add(sample.normal.clone().multiplyScalar(heightOff));
        defaultLook.add(sample.tangent.clone().multiplyScalar(25));
      }

      // Let the existing cinematic systems keep camera authority when they have
      // already updated the camera (full-route preview, hero shots, countdown, etc.).
      // We only use the route-framing block below as a fallback when the intro
      // manager did not move the camera this frame. This prevents two camera
      // controllers from fighting and producing the visible glitching/snapping.
      const cameraPosBeforeIntro = this.camera.position.clone();
      const cameraQuatBeforeIntro = this.camera.quaternion.clone();
      const introRes = this.raceIntroManager.update(dt, defaultCamPos, defaultLook, 65);
      const introCameraOwnsView =
        cameraPosBeforeIntro.distanceToSquared(this.camera.position) > 0.000001 ||
        1 - Math.abs(cameraQuatBeforeIntro.dot(this.camera.quaternion)) > 0.000001;

      // Use the exact gameplay route data for cinematic framing. The main spline
      // and any generated junction route instances are sampled directly; no fake
      // cinematic path is created.
      if (introRes.isIntroActive && this.track && !introCameraOwnsView) {
        const routePoints: THREE.Vector3[] = [];
        const routeSamples = 512;
        const addPoint = (p: THREE.Vector3 | undefined) => {
          if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)) {
            routePoints.push(p.clone());
          }
        };

        for (let i = 0; i < routeSamples; i++) {
          addPoint(this.track.getSampleAt(i / (routeSamples - 1)).point);
        }

        // Include every available generated branch/shortcut route so the camera
        // framing contains the complete playable route network.
        const junctions: any = this.junctionManager?.junctions;
        if (junctions && typeof junctions.forEach === 'function') {
          junctions.forEach((junction: any) => {
            const routeInstances = junction?.routeInstances;
            if (!routeInstances || typeof routeInstances.forEach !== 'function') return;
            routeInstances.forEach((route: any) => {
              if (!route?.getSampleAt) return;
              for (let i = 0; i < 96; i++) {
                const routeSample = route.getSampleAt(i / 95);
                addPoint(routeSample?.point);
              }
            });
          });
        }

        if (routePoints.length > 1) {
          const routeBox = new THREE.Box3().setFromPoints(routePoints);
          const routeCenter = routeBox.getCenter(new THREE.Vector3());
          const routeSphere = routeBox.getBoundingSphere(new THREE.Sphere());

          // Bounding-sphere fitting is important for long diagonal/curved routes:
          // using only max X/Y/Z can still crop the route at the corners.
          const routeRadius = Math.max(routeSphere.radius * 1.22, 160);
          const aspect = Math.max(this.camera.aspect || 1, 0.5);
          const verticalFov = THREE.MathUtils.degToRad(72);
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * aspect);
          const limitingFov = Math.min(verticalFov, horizontalFov);
          const fitDistance = (routeRadius / Math.sin(Math.max(limitingFov * 0.5, 0.2))) * 1.12;
          const phaseText = String(introRes.phase || '').toUpperCase();

          let direction: THREE.Vector3;
          if (phaseText.includes('SIDE') || phaseText.includes('ORBIT')) {
            direction = new THREE.Vector3(1, 0.42, 0.35);
          } else if (phaseText.includes('GRID') || phaseText.includes('OVERVIEW') || phaseText.includes('WIDE')) {
            direction = new THREE.Vector3(0.15, 1, 0.85);
          } else {
            direction = new THREE.Vector3(-0.68, 0.55, 0.72);
          }
          direction.normalize();

          // Keep the complete route visible while still allowing different
          // cinematic camera styles during the existing intro phases.
          const camPos = routeCenter.clone().add(direction.multiplyScalar(fitDistance));
          this.camera.position.lerp(camPos, Math.min(1, dt * 2.4));
          this.camera.lookAt(routeCenter);
          this.camera.fov = 72;
          this.camera.far = Math.max(this.camera.far, fitDistance * 3.5 + routeRadius * 2);
          this.camera.updateProjectionMatrix();
        }
      }

      if (!introRes.isIntroActive || introRes.phase === 'COMPLETE') {
        if (!this.isRacing) {
          this.startRace();
        }
      }
    }
  }

  private updateJunctions(dt: number) {
    if (!this.junctionManager) return;
    const telemetry = this.junctionManager.update(
      dt,
      this.totalTimeElapsed,
      this.splineT,
      this.currentSpeed
    );
    this.callbacks.onJunctionTelemetry?.(telemetry);
  }

  private updateBeamSystem(dt: number) {
    if (!this.beamSystem || !this.playerShipGroup) return;

    // Weapon emitter world position
    const emitter = this.playerShipGroup.getObjectByName('weapon_emitter');
    const emitterPos = new THREE.Vector3();
    if (emitter) {
      emitter.getWorldPosition(emitterPos);
    } else {
      emitterPos.copy(this.playerShipGroup.position);
    }

    // Ship forward vector (pointing along -Z in ship local space)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);

    // Update target locking cone detection
    this.beamSystem.updateTargeting(emitterPos, forward, this.track.obstacles);

    // Check if beam is firing (Desktop E / RMB or Mobile ⚡ button)
    if (this.input.fireBeam && this.isRacing && !this.isDestroyed) {
      this.beamSystem.fireBeam(
        emitterPos,
        forward,
        dt,
        (obstacle, points, credits) => {
          this.sessionCredits += credits;
          this.callbacks.onCreditCollected?.(this.sessionCredits, credits);
          this.callbacks.onHazardHit?.(
            `ASTEROID DESTROYED +${credits} VC // +${points} PTS`
          );
          this.callbacks.onAsteroidDestroyed?.(obstacle, points, credits);
        }
      );

      // Visual emitter pulse and ship physical recoil
      if (emitter) {
        const aperture = emitter.getObjectByName('emitter_aperture');
        if (aperture) aperture.scale.set(1.35, 1.35, 1.35);
      }
      if (this.beamSystem.recoilOffset.lengthSq() > 0.0001) {
        this.playerShipGroup.position.add(
          forward.clone().multiplyScalar(-this.beamSystem.recoilOffset.z * 0.3)
        );
      }
    } else {
      this.beamSystem.ceaseFire();
      if (emitter) {
        const aperture = emitter.getObjectByName('emitter_aperture');
        if (aperture) aperture.scale.set(1.0, 1.0, 1.0);
      }
    }

    // Update beam internal physics, cooling, fragments, shockwaves
    this.beamSystem.update(dt);

    // Dynamic recoil impulse and screen shake
    if (this.beamSystem.screenShakeIntensity > 0 && this.cameraShakeEnabled) {
      this.cameraShake = Math.max(this.cameraShake, this.beamSystem.screenShakeIntensity);
    }

    // Push beam telemetry to HUD
    this.callbacks.onBeamTelemetry?.(this.beamSystem.getTelemetry());
  }

  public setBeamCustomization(customization: BeamCustomization) {
    this.localBeamCustomization = { ...customization };
    this.beamSystem?.updateCustomization(customization);
  }

  public setBeamUpgrades(upgrades: BeamUpgrades) {
    this.localBeamUpgrades = { ...upgrades };
    this.beamSystem?.updateUpgrades(upgrades);
  }

  public setBeamInput(firing: boolean) {
    this.input.fireBeam = firing;
  }

  // ==========================================
  // MISSILE WEAPON SUBSYSTEM (ALL 20 MODES)
  // ==========================================
  public firePlayerMissile(): { success: boolean; reason?: string } {
    if (!this.isRacing || this.isDestroyed || !this.missileManager) {
      return { success: false, reason: 'NOT_RACING' };
    }

    const candidates: MissileTargetCandidate[] = [];

    // Local AI racers
    for (const ai of this.localAIRacers) {
      candidates.push({
        id: ai.id,
        name: ai.name,
        isAI: true,
        isTeammate: false,
        isDestroyed: !!ai.isDestroyed,
        position: ai.group.position,
        meshGroup: ai.group,
        shield: ai.shield ?? 100,
        hull: ai.hull ?? 100,
        applyDamage: (shieldDmg, hullDmg, impactForce) => {
          ai.shield = Math.max(0, (ai.shield ?? 100) - shieldDmg);
          ai.hull = Math.max(0, (ai.hull ?? 100) - hullDmg);
          ai.angularVelocity += (Math.random() - 0.5) * 8.0;
          ai.angularDisplacement += 0.8;
          ai.collisionCooldown = 0.5;
        },
        triggerCrash: (reason) => {
          ai.isDestroyed = true;
          ai.respawnTimer = 3.5;
          ai.group.visible = false;
          this.callbacks.onHazardHit?.(`${ai.name.toUpperCase()} CRASHED: ${reason}`);
          this.callbacks.onCollisionFeedback?.({
            id: `rival_destroyed_${Date.now()}`,
            type: 'RIVAL_CRASHED',
            title: `RIVAL NEUTRALIZED`,
            detail: `${ai.name.toUpperCase()} ELIMINATED BY MISSILE`,
            impactForce: 80,
            timestamp: Date.now(),
          });
        },
      });
    }

    // Remote multiplayer racers
    this.remoteShips.forEach((remote, id) => {
      candidates.push({
        id,
        name: `Rival ${id.slice(0, 4)}`,
        isAI: false,
        isTeammate: false,
        isDestroyed: false,
        position: remote.group.position,
        meshGroup: remote.group,
        shield: 100,
        hull: 100,
        applyDamage: (shieldDmg, hullDmg) => {
          networkClient.send({
            type: 'DAMAGE_EVENT',
            targetId: id,
            shieldDmg,
            hullDmg,
            damageAmount: shieldDmg + hullDmg,
          });
        },
      });
    });

    return this.missileManager.fireMissile(
      'player',
      this.playerShipGroup.position,
      this.playerShipGroup.quaternion,
      candidates
    );
  }

  public setMissileInput(firing: boolean) {
    this.input.fireMissile = firing;
  }

  private updateMissileSystem(dt: number) {
    if (!this.missileManager || !this.playerShipGroup) return;

    if (this.input.fireMissile && !this.isPaused) {
      this.firePlayerMissile();
      this.input.fireMissile = false;
    }

    const candidates: MissileTargetCandidate[] = [];
    for (const ai of this.localAIRacers) {
      candidates.push({
        id: ai.id,
        name: ai.name,
        isAI: true,
        isTeammate: false,
        isDestroyed: !!ai.isDestroyed,
        position: ai.group.position,
        meshGroup: ai.group,
        shield: ai.shield ?? 100,
        hull: ai.hull ?? 100,
        applyDamage: (shieldDmg, hullDmg) => {
          ai.shield = Math.max(0, (ai.shield ?? 100) - shieldDmg);
          ai.hull = Math.max(0, (ai.hull ?? 100) - hullDmg);
          ai.angularVelocity += (Math.random() - 0.5) * 8.0;
          ai.angularDisplacement += 0.8;
          ai.collisionCooldown = 0.5;
        },
        triggerCrash: (reason) => {
          ai.isDestroyed = true;
          ai.respawnTimer = 3.5;
          ai.group.visible = false;
          this.callbacks.onHazardHit?.(`${ai.name.toUpperCase()} CRASHED: ${reason}`);
          this.callbacks.onCollisionFeedback?.({
            id: `rival_destroyed_${Date.now()}`,
            type: 'RIVAL_CRASHED',
            title: `RIVAL NEUTRALIZED`,
            detail: `${ai.name.toUpperCase()} ELIMINATED BY MISSILE`,
            impactForce: 80,
            timestamp: Date.now(),
          });
        },
      });
    }

    this.remoteShips.forEach((remote, id) => {
      candidates.push({
        id,
        name: `Rival ${id.slice(0, 4)}`,
        isAI: false,
        isTeammate: false,
        isDestroyed: false,
        position: remote.group.position,
        meshGroup: remote.group,
        shield: 100,
        hull: 100,
        applyDamage: (shieldDmg, hullDmg) => {
          networkClient.send({
            type: 'DAMAGE_EVENT',
            targetId: id,
            shieldDmg,
            hullDmg,
            damageAmount: shieldDmg + hullDmg,
          });
        },
      });
    });

    this.missileManager.scanForTargets(
      this.playerShipGroup.position,
      this.playerShipGroup.quaternion,
      candidates
    );

    this.missileManager.update(dt, this.isPaused);
    const tel = this.missileManager.getTelemetry(this.playerShipGroup.position);
    this.callbacks.onMissileTelemetry?.(tel);
  }

  // ==========================================
  // ACTIVE SHIELD SUBSYSTEM (60S COOLDOWN)
  // ==========================================
  public activatePlayerShield(): boolean {
    if (!this.isRacing || this.isDestroyed || !this.activeShieldManager) {
      return false;
    }
    const activated = this.activeShieldManager.activate();
    if (activated) {
      this.phaseShieldTimer = 6.0;
      if (this.shieldMeshGroup) {
        this.shieldMeshGroup.visible = true;
      }
      this.callbacks.onHazardHit?.('ACTIVE SHIELD DEPLOYED // DAMAGE MITIGATION 95%');
    }
    return activated;
  }

  public setShieldInput(activating: boolean) {
    this.input.activateShield = activating;
  }

  private updateActiveShieldSystem(dt: number) {
    if (!this.activeShieldManager) return;

    if (this.input.activateShield && !this.isPaused) {
      this.activatePlayerShield();
      this.input.activateShield = false;
    }

    this.activeShieldManager.update(dt, this.isPaused);

    const isShieldActive =
      this.activeShieldManager.status === 'ACTIVE' || this.phaseShieldTimer > 0;
    if (this.shieldMeshGroup) {
      this.shieldMeshGroup.visible = isShieldActive;
      if (isShieldActive && dt > 0) {
        this.shieldMeshGroup.rotateY(dt * 2.5);
      }
    }

    const tel = this.activeShieldManager.getTelemetry(this.damageZones.shieldCore);
    this.callbacks.onActiveShieldTelemetry?.(tel);
  }

  // ==========================================
  // DYNAMIC HAZARD & DIFFICULTY SUBSYSTEM
  // ==========================================
  private updateHazardSystem(dt: number) {
    if (!this.hazardManager || !this.isRacing || this.isDestroyed || this.isPaused || !this.playerShipGroup) return;

    const warning = this.hazardManager.update(
      dt,
      this.playerShipGroup.position,
      this.splineT,
      this.currentSpeed * 3.6,
      (dmg, hazardName) => {
        if (this.activeShieldManager && this.activeShieldManager.isActive()) {
          this.activeShieldManager.absorbDamage(dmg);
          sound.playShieldHit();
          this.callbacks.onHazardHit?.(`SHIELD DEFLECTED: ${hazardName.toUpperCase()}`);
          return;
        }

        let remaining = dmg;
        if (this.damageZones.shieldCore > 0) {
          const absorbed = Math.min(this.damageZones.shieldCore, remaining);
          this.damageZones.shieldCore -= absorbed;
          remaining -= absorbed;
        }
        if (remaining > 0) {
          this.hullHealth = Math.max(0, this.hullHealth - remaining);
          this.callbacks.onHullUpdate?.(this.hullHealth);
          const zone = Math.random() > 0.5 ? 'leftWing' : 'rightWing';
          this.applyZoneDamage(zone, remaining);
          if (this.hullHealth <= 0) {
            this.destroyPlayerShip(`DESTROYED BY ${hazardName.toUpperCase()}`);
          }
        }
        this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
        this.callbacks.onHazardHit?.(`IMPACT: ${hazardName.toUpperCase()} (-${dmg}% HULL)`);
        this.cameraShake = Math.max(this.cameraShake, 0.45);
      }
    );

    if (warning && this.modeManager && this.modeManager.currentTelemetry) {
      this.modeManager.currentTelemetry.warningAlert = `${warning.hazardName.toUpperCase()} INCOMING [${warning.distanceMeters}M] // ${warning.avoidanceAdvice.toUpperCase()}`;
    }
  }

  // ==========================================
  // INTERACTIVE MINIMAP SUBSYSTEM
  // ==========================================
  public toggleMinimapMode() {
    return this.minimapManager?.toggleMode();
  }

  public zoomInMinimap() {
    this.minimapManager?.zoomIn();
  }

  public zoomOutMinimap() {
    this.minimapManager?.zoomOut();
  }

  public resetMinimapZoom() {
    this.minimapManager?.resetZoom();
  }

  public toggleMinimapExpand() {
    return this.minimapManager?.toggleExpanded();
  }

  private updateMinimapSystem(dt: number) {
    if (!this.minimapManager || !this.playerShipGroup) return;

    // Synchronize route branches from junctionManager
    if (this.junctionManager) {
      const branches: MinimapBranchPoint[] = [];
      const actTel = this.junctionManager.activeJunctionTelemetry;
      const junction = actTel?.junctionId ? this.junctionManager.junctions.get(actTel.junctionId) : null;
      if (actTel && actTel.availableRoutes) {
        actTel.availableRoutes.forEach(route => {
          const inst = junction?.routeInstances.get(route.id);
          const branchPoints: { x: number; z: number }[] = [];
          if (inst && inst.curve) {
            for (let i = 0; i <= 20; i++) {
              const pt = inst.curve.getPointAt(i / 20);
              branchPoints.push({ x: pt.x, z: pt.z });
            }
          }
          branches.push({
            id: route.id,
            name: route.name,
            direction: route.direction,
            isSelected: actTel.selectedRouteId === route.id,
            points: branchPoints,
          });
        });
      }
      this.minimapManager.updateBranches(branches);
    }

    // Synchronize AI opponents
    const aiList = this.localAIRacers.map(ai => ({
      id: ai.id,
      name: ai.name,
      position: ai.group.position,
      quaternion: ai.group.quaternion,
      color: ai.color,
      rank: ai.rank,
      isDestroyed: !!ai.isDestroyed,
      isTeammate: false,
    }));

    const targetId = this.missileManager?.currentTarget?.id || null;
    const actJunction = this.junctionManager?.activeJunctionTelemetry?.junctionName;
    const actRoute = this.junctionManager?.playerRouteProgress?.branchRouteInstance?.config.direction ||
      this.junctionManager?.activeJunctionTelemetry?.selectedRouteDirection;

    const hazardMarkers: MinimapMarker[] = (this.hazardManager?.hazards || []).map(h => ({
      id: h.id,
      type: 'HAZARD' as const,
      x: h.position.x,
      z: h.position.z,
      label: h.name,
      color: h.color,
    }));

    if (this.finalCollapseManager?.evacuation.evacuationActive) {
      const towerPos = this.junctionManager.towerEntranceWorldPosition;
      hazardMarkers.push({
        id: 'evac_tower',
        type: 'CHECKPOINT' as any,
        x: towerPos.x,
        z: towerPos.z,
        label: 'SAFE ZONE TOWER',
        color: '#00f0ff',
      });

      const bhPos = this.supermassiveBlackHole?.root.position ?? new THREE.Vector3(0, 180, -3500);
      hazardMarkers.push({
        id: 'singularity_core',
        type: 'HAZARD' as any,
        x: bhPos.x,
        z: bhPos.z,
        label: 'SINGULARITY',
        color: '#ff0033',
      });

      if (this.track && this.finalCollapseManager.destructionFrontDistance < 3000) {
        const frontM = this.finalCollapseManager.destructionFront.progressM;
        const totalM = this.track.totalLength || 2500;
        const frontT = (((frontM % totalM) + totalM) % totalM) / totalM;
        const frontPt = this.track.getSampleAt(frontT).point;
        hazardMarkers.push({
          id: 'destruction_front',
          type: 'HAZARD' as any,
          x: frontPt.x,
          z: frontPt.z,
          label: 'DESTRUCTION FRONT',
          color: '#ff4400',
        });
      }
    }

    const tel = this.minimapManager.getTelemetry(
      this.playerShipGroup.position,
      this.playerShipGroup.quaternion,
      aiList,
      targetId,
      actJunction,
      actRoute,
      hazardMarkers
    );

    this.callbacks.onMinimapTelemetry?.(tel);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth || 1280;
    const h = this.container.clientHeight || window.innerHeight || 720;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.stopRace();
    if (this.beamSystem) {
      this.beamSystem.dispose();
      this.scene.remove(this.beamSystem.containerGroup);
    }
    if (this.collisionSystem) {
      this.collisionSystem.dispose();
    }
    if (this.extendedPathManager) {
      this.extendedPathManager.dispose();
    }
    if (this.modeEnvironmentManager) {
      this.modeEnvironmentManager.dispose();
    }
    if (this.blackHoleCinematicManager) {
      this.blackHoleCinematicManager.dispose();
      this.blackHoleCinematicManager = null;
    }
    if (this.collapseEnvironments) {
      this.collapseEnvironments.dispose();
      this.collapseEnvironments = null;
    }
    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      this.asteroidInstancedMesh = null;
    }
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  public setCollisionConfig(config: Partial<PlayerCollisionConfig>) {
    if (this.collisionSystem) {
      this.collisionSystem.config = { ...this.collisionSystem.config, ...config };
    }
  }

  public getCollisionConfig(): PlayerCollisionConfig {
    return this.collisionSystem ? { ...this.collisionSystem.config } : { ...PLAYER_COLLISION_CONFIG };
  }
}
