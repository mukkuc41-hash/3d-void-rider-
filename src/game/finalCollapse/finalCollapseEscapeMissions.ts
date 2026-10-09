import * as THREE from 'three';
import { sound } from '../audio';
import { getMasterEventByNumber } from './finalCollapseMaster100Timeline';

export type EscapeMissionId =
  | 'ROUTE_01_ORBITAL_LAUNCHER'
  | 'ROUTE_02_EMERGENCY_ESCAPE'
  | 'ROUTE_03_GRAVITY_SLINGSHOT';

export interface EscapeStageDefinition {
  stageId: string;
  stageNumber: number; // 1 to 8
  name: string;
  subtitle: string;
  connectedEventNumbers: number[];
  progressThreshold: number; // 0.0 to 1.0 along the physical route spline
  requiredSpeedMps?: number;
  requiredCheckpointIndex?: number;
  objectiveText: string;
  audioCue?: 'advisory' | 'warning' | 'danger' | 'critical' | 'emergency';
}

export interface EscapeMissionDefinition {
  id: EscapeMissionId;
  routeId: string;
  name: string;
  subtitle: string;
  themeColorHex: number;
  themeColorStr: string;
  safeZoneName: string;
  stages: EscapeStageDefinition[];
}

export interface EscapeMissionTelemetry {
  missionId: EscapeMissionId | null;
  routeId: string | null;
  routeName: string;
  currentStageId: string;
  currentStageNumber: number; // 1 to 8
  currentStageName: string;
  stageSubtitle: string;
  stageObjective: string;
  routeProgress: number; // 0.0 to 1.0
  checkpointsValidated: number;
  totalCheckpoints: number;
  safeZoneStatus: 'NOT_ENTERED' | 'ARMED' | 'APPROACHING' | 'VALIDATED' | 'DEADLINE_EXPIRED';
  isMissionCompleted: boolean;
  isMissionFailed: boolean;
  completionTimeRemainingSeconds: number | null;
  safeZoneArrivalTimestamp: number | null;
}

export const ESCAPE_MISSIONS_CONFIG: Record<EscapeMissionId, EscapeMissionDefinition> = {
  ROUTE_01_ORBITAL_LAUNCHER: {
    id: 'ROUTE_01_ORBITAL_LAUNCHER',
    routeId: 'bh10_launcher_route',
    name: 'ROUTE 01 // ORBITAL LAUNCHER',
    subtitle: 'Ascent gantry & relativistic acceleration catapult',
    themeColorHex: 0x22d3ee,
    themeColorStr: '#22d3ee',
    safeZoneName: 'ORBITAL SANCTUARY HANGAR',
    stages: [
      {
        stageId: 'OL-01',
        stageNumber: 1,
        name: 'LAUNCHER DISCOVERY',
        subtitle: 'Approach gantry revealed // navigation lock established',
        connectedEventNumbers: [40, 70],
        progressThreshold: 0.02,
        objectiveText: 'COMMIT TO ORBITAL LAUNCHER CORRIDOR [LEFT VECTOR]',
        audioCue: 'advisory',
      },
      {
        stageId: 'OL-02',
        stageNumber: 2,
        name: 'MEGA-CITY APPROACH',
        subtitle: 'Elevated urban highway // bridge stability failing',
        connectedEventNumbers: [24, 46, 68],
        progressThreshold: 0.15,
        requiredCheckpointIndex: 1,
        objectiveText: 'CROSS MEGAPOLIS SPAN // NAVIGATE ELEVATED ROADWAY',
        audioCue: 'warning',
      },
      {
        stageId: 'OL-03',
        stageNumber: 3,
        name: 'POWER RESTORATION',
        subtitle: 'Secondary conduits activated // magnetic coils priming',
        connectedEventNumbers: [19, 83],
        progressThreshold: 0.30,
        objectiveText: 'MAINTAIN FORWARD VECTOR // PASS POWER COUPLING NODES',
        audioCue: 'advisory',
      },
      {
        stageId: 'OL-04',
        stageNumber: 4,
        name: 'LAUNCH PREPARATION',
        subtitle: 'Magnetic accelerator guides active // pressure warning',
        connectedEventNumbers: [70, 85],
        progressThreshold: 0.45,
        objectiveText: 'ENTER LAUNCH RUNWAY // ENGAGE ACCELERATION PREP',
        audioCue: 'warning',
      },
      {
        stageId: 'OL-05',
        stageNumber: 5,
        name: 'PHYSICAL LAUNCH RUN',
        subtitle: 'Catapult acceleration ramp // minimum speed required',
        connectedEventNumbers: [90, 91],
        progressThreshold: 0.60,
        requiredSpeedMps: 22,
        objectiveText: 'FULL THROTTLE // HIT LAUNCH PLATFORM AT > 80 KM/H',
        audioCue: 'danger',
      },
      {
        stageId: 'OL-06',
        stageNumber: 6,
        name: 'ORBITAL TRANSFER',
        subtitle: 'Atmospheric breakout // traversing acceleration gantry',
        connectedEventNumbers: [96],
        progressThreshold: 0.75,
        requiredCheckpointIndex: 2,
        objectiveText: 'NAVIGATE GANTRY RINGS // MAINTAIN ESCAPE VELOCITY',
        audioCue: 'critical',
      },
      {
        stageId: 'OL-07',
        stageNumber: 7,
        name: 'FINAL DOCKING APPROACH',
        subtitle: 'Orbital sanctuary beacon locked // align capture vector',
        connectedEventNumbers: [98],
        progressThreshold: 0.90,
        objectiveText: 'ALIGN WITH ORBITAL DOCKING VECTOR AHEAD',
        audioCue: 'critical',
      },
      {
        stageId: 'OL-08',
        stageNumber: 8,
        name: 'ORBITAL SAFE-ZONE VALIDATION',
        subtitle: 'Entering sealed orbital sanctuary // deadline check',
        connectedEventNumbers: [99, 100],
        progressThreshold: 0.98,
        objectiveText: 'CROSS DOCKING GATE // VERIFY SAFE ZONE ENTRY',
        audioCue: 'emergency',
      },
    ],
  },

  ROUTE_02_EMERGENCY_ESCAPE: {
    id: 'ROUTE_02_EMERGENCY_ESCAPE',
    routeId: 'bh10_escape_route',
    name: 'ROUTE 02 // EMERGENCY ESCAPE CORRIDOR',
    subtitle: 'Reinforced city bypass tunnel & subterranean blast bunker',
    themeColorHex: 0xff2bd6,
    themeColorStr: '#ff2bd6',
    safeZoneName: 'SUBTERRANEAN BLAST BUNKER',
    stages: [
      {
        stageId: 'EC-01',
        stageNumber: 1,
        name: 'EMERGENCY DETECTION',
        subtitle: 'Civilian evacuation route active // sirens howling',
        connectedEventNumbers: [39, 40],
        progressThreshold: 0.02,
        objectiveText: 'DIVERGE RIGHT // ENTER EMERGENCY EVACUATION CORRIDOR',
        audioCue: 'warning',
      },
      {
        stageId: 'EC-02',
        stageNumber: 2,
        name: 'CITY EVACUATION RUN',
        subtitle: 'Burning megacity corridor // civilian shuttles fleeing',
        connectedEventNumbers: [46],
        progressThreshold: 0.15,
        requiredCheckpointIndex: 1,
        objectiveText: 'TRAVERSE EVACUATION THOROUGHFARE // AVOID TRACK DEBRIS',
        audioCue: 'warning',
      },
      {
        stageId: 'EC-03',
        stageNumber: 3,
        name: 'LASER SECURITY SECTION',
        subtitle: 'Automated perimeter grid tripped // pulsing hazard beams',
        connectedEventNumbers: [49],
        progressThreshold: 0.30,
        objectiveText: 'THREAD LASER GATE INTERVALS // DODGE ACTIVE BEAMS',
        audioCue: 'danger',
      },
      {
        stageId: 'EC-04',
        stageNumber: 4,
        name: 'STRUCTURAL FAILURE',
        subtitle: 'Bridge pylons collapsing // falling concrete slabs',
        connectedEventNumbers: [55, 62],
        progressThreshold: 0.45,
        objectiveText: 'EVADE FALLING PYLONS // KEEP SHIP ON ROADWAY DECK',
        audioCue: 'danger',
      },
      {
        stageId: 'EC-05',
        stageNumber: 5,
        name: 'EMERGENCY JUNCTION',
        subtitle: 'Dual survival tunnels split // directional bypass',
        connectedEventNumbers: [79],
        progressThreshold: 0.60,
        requiredCheckpointIndex: 2,
        objectiveText: 'PASS THROUGH JUNCTION ARCHWAY // MAINTAIN MOMENTUM',
        audioCue: 'warning',
      },
      {
        stageId: 'EC-06',
        stageNumber: 6,
        name: 'LOCKDOWN SEQUENCE',
        subtitle: 'Reinforced blast barriers descending // emergency pressure',
        connectedEventNumbers: [85],
        progressThreshold: 0.75,
        requiredSpeedMps: 20,
        objectiveText: 'OUTRUN DESCENDING BLAST DOORS // MAINTAIN VELOCITY',
        audioCue: 'critical',
      },
      {
        stageId: 'EC-07',
        stageNumber: 7,
        name: 'FINAL EVACUATION RUN',
        subtitle: 'Subterranean bunker access ramp // terminal sprint',
        connectedEventNumbers: [91, 96],
        progressThreshold: 0.90,
        objectiveText: 'DESCEND EVACUATION RAMP // BUNKER GATE DIRECTLY AHEAD',
        audioCue: 'critical',
      },
      {
        stageId: 'EC-08',
        stageNumber: 8,
        name: 'EVACUATION SAFE-ZONE VALIDATION',
        subtitle: 'Entering reinforced shelter // verify atmospheric seal',
        connectedEventNumbers: [99, 100],
        progressThreshold: 0.98,
        objectiveText: 'ENTER BLAST BUNKER // SEAL SAFE ZONE BEFORE 00:00',
        audioCue: 'emergency',
      },
    ],
  },

  ROUTE_03_GRAVITY_SLINGSHOT: {
    id: 'ROUTE_03_GRAVITY_SLINGSHOT',
    routeId: 'bh10_wormhole_route',
    name: 'ROUTE 03 // GRAVITY SLINGSHOT ESCAPE',
    subtitle: 'Ergosphere slingshot vector into Einstein-Rosen gateway',
    themeColorHex: 0xa855f7,
    themeColorStr: '#a855f7',
    safeZoneName: 'EINSTEIN-ROSEN GATEWAY THROAT',
    stages: [
      {
        stageId: 'GS-01',
        stageNumber: 1,
        name: 'GRAVITY ROUTE DISCOVERY',
        subtitle: 'Relativistic horizon vector detected // ergosphere rim',
        connectedEventNumbers: [6, 13],
        progressThreshold: 0.02,
        objectiveText: 'LINE UP CENTER CORRIDOR // COMMIT TO GRAVITY SLINGSHOT',
        audioCue: 'advisory',
      },
      {
        stageId: 'GS-02',
        stageNumber: 2,
        name: 'GRAVITY APPROACH',
        subtitle: 'Inward gravitational pull escalating // banking curve',
        connectedEventNumbers: [52],
        progressThreshold: 0.15,
        objectiveText: 'COUNTER GRAVITATIONAL INWARD DRIFT // STAY ON TARMAC',
        audioCue: 'warning',
      },
      {
        stageId: 'GS-03',
        stageNumber: 3,
        name: 'SLINGSHOT ALIGNMENT',
        subtitle: 'Targeting relativistic transfer vector // gyroscope lock',
        connectedEventNumbers: [69],
        progressThreshold: 0.30,
        requiredCheckpointIndex: 1,
        objectiveText: 'FLY THROUGH ALIGNMENT RING // LOCK ESCAPE AZIMUTH',
        audioCue: 'warning',
      },
      {
        stageId: 'GS-04',
        stageNumber: 4,
        name: 'GRAVITY HAZARD SEQUENCE',
        subtitle: 'Relativistic shockwaves // tidal debris shear active',
        connectedEventNumbers: [78, 80],
        progressThreshold: 0.45,
        objectiveText: 'DODGE WARPED ACCRETION DEBRIS // SHOCKWAVES INCOMING',
        audioCue: 'danger',
      },
      {
        stageId: 'GS-05',
        stageNumber: 5,
        name: 'SLINGSHOT LAUNCH',
        subtitle: 'Periapsis slingshot boost // extreme gravitational thrust',
        connectedEventNumbers: [94],
        progressThreshold: 0.60,
        requiredSpeedMps: 26,
        objectiveText: 'ENGAGE MAXIMUM THRUST // RIDE GRAVITY SLINGSHOT SURGE',
        audioCue: 'critical',
      },
      {
        stageId: 'GS-06',
        stageNumber: 6,
        name: 'TRAJECTORY NAVIGATION',
        subtitle: 'Hyperbolic escape arc // relativistic acceleration',
        connectedEventNumbers: [97],
        progressThreshold: 0.75,
        requiredCheckpointIndex: 2,
        objectiveText: 'STEER THROUGH HYPERBOLIC EXIT VECTOR // CP2 VALIDATED',
        audioCue: 'critical',
      },
      {
        stageId: 'GS-07',
        stageNumber: 7,
        name: 'FINAL APPROACH',
        subtitle: 'Wormhole gateway throat visible // throat disk expanding',
        connectedEventNumbers: [98],
        progressThreshold: 0.90,
        objectiveText: 'TARGET WORMHOLE CORE DISC // FINAL APERTURE AHEAD',
        audioCue: 'critical',
      },
      {
        stageId: 'GS-08',
        stageNumber: 8,
        name: 'GRAVITY SAFE-ZONE VALIDATION',
        subtitle: 'Entering stable Einstein-Rosen transit corridor',
        connectedEventNumbers: [99, 100],
        progressThreshold: 0.98,
        objectiveText: 'CROSS GATEWAY APERTURE // REACH SAFE ZONE BEFORE 00:00',
        audioCue: 'emergency',
      },
    ],
  },
};

/**
 * ESCAPE MISSION MANAGER
 *
 * Authoritative controller for Submode 10's three distinct multi-stage escape missions.
 * Enforces:
 * - 8 strictly ordered stages per mission with explicit prerequisites.
 * - Real checkpoint validation and physical trigger checks (no shortcutting).
 * - Exact synchronization with the 15:00 / 08:00 -> 00:00 authoritative countdown.
 * - Single-outcome evaluation at 00:00: Validated arrival before deadline = Survival,
 *   otherwise Ultimate Collapse Failure.
 */
export class EscapeMissionManager {
  private activeMission: EscapeMissionDefinition | null = null;
  private currentStageIndex = 1; // 1 to 8
  private completedStages = new Set<number>();
  private validatedCheckpoints = new Set<number>();

  private routeProgress = 0; // 0.0 to 1.0 along active route
  private safeZoneStatus: 'NOT_ENTERED' | 'ARMED' | 'APPROACHING' | 'VALIDATED' | 'DEADLINE_EXPIRED' = 'NOT_ENTERED';

  private isCompleted = false;
  private isFailed = false;
  private arrivalRemainingSeconds: number | null = null;
  private arrivalTimestamp: number | null = null;

  // Scene physical visualization group
  public visualsGroup: THREE.Group = new THREE.Group();
  private sceneRef: THREE.Scene | null = null;

  // Physical trigger landmarks
  private stageObjects: THREE.Object3D[] = [];

  constructor() {
    this.visualsGroup.name = 'EscapeMission_VisualLandmarks';
  }

  public initialize(scene: THREE.Scene): void {
    this.sceneRef = scene;
    scene.add(this.visualsGroup);
  }

  public reset(): void {
    this.activeMission = null;
    this.currentStageIndex = 1;
    this.completedStages.clear();
    this.validatedCheckpoints.clear();
    this.routeProgress = 0;
    this.safeZoneStatus = 'NOT_ENTERED';
    this.isCompleted = false;
    this.isFailed = false;
    this.arrivalRemainingSeconds = null;
    this.arrivalTimestamp = null;
    this.clearVisuals();
  }

  public dispose(): void {
    this.reset();
    if (this.sceneRef) {
      this.sceneRef.remove(this.visualsGroup);
    }
  }

  /**
   * Called when player enters or commits to one of the 3 branch routes.
   */
  public selectRoute(routeId: string): boolean {
    let missionId: EscapeMissionId | null = null;
    if (routeId === 'bh10_launcher_route') {
      missionId = 'ROUTE_01_ORBITAL_LAUNCHER';
    } else if (routeId === 'bh10_escape_route') {
      missionId = 'ROUTE_02_EMERGENCY_ESCAPE';
    } else if (routeId === 'bh10_wormhole_route' || routeId === 'bh10_slingshot_route') {
      missionId = 'ROUTE_03_GRAVITY_SLINGSHOT';
    }

    if (!missionId) return false;

    // If already locked onto this mission, keep state
    if (this.activeMission?.id === missionId) return true;

    this.activeMission = ESCAPE_MISSIONS_CONFIG[missionId];
    this.currentStageIndex = 1;
    this.completedStages.clear();
    this.validatedCheckpoints.clear();
    this.routeProgress = 0;
    this.safeZoneStatus = 'ARMED';
    this.isCompleted = false;
    this.isFailed = false;

    // Complete Stage 1 (Discovery) upon genuine physical route commitment
    this.advanceStage(1);

    // Build physical stage landmarks in the 3D scene
    this.buildMissionPhysicalLandmarks();

    return true;
  }

  /**
   * Updates physical mission progression frame by frame.
   * Checks current route progress, checkpoints, speed, and triggers stage completions.
   */
  public updateProgress(
    progress: number,
    currentSpeedMps: number,
    countdownRemainingSeconds: number,
    playerPos?: THREE.Vector3
  ): {
    stageAdvanced: boolean;
    currentStage: EscapeStageDefinition | null;
    safeZoneValidated: boolean;
  } {
    if (!this.activeMission) {
      return { stageAdvanced: false, currentStage: null, safeZoneValidated: false };
    }

    this.routeProgress = THREE.MathUtils.clamp(progress, 0, 1);
    let stageAdvanced = false;

    const currentStageDef = this.activeMission.stages[this.currentStageIndex - 1];
    if (!currentStageDef) {
      return { stageAdvanced: false, currentStage: null, safeZoneValidated: this.isCompleted };
    }

    // Check prerequisites for current stage
    const meetsProgress = this.routeProgress >= currentStageDef.progressThreshold;
    const meetsSpeed = !currentStageDef.requiredSpeedMps || currentSpeedMps >= currentStageDef.requiredSpeedMps;
    const meetsCheckpoint =
      !currentStageDef.requiredCheckpointIndex ||
      this.validatedCheckpoints.has(currentStageDef.requiredCheckpointIndex);

    // Update safe-zone approach status
    if (this.currentStageIndex >= 7) {
      if (this.safeZoneStatus !== 'VALIDATED' && this.safeZoneStatus !== 'DEADLINE_EXPIRED') {
        this.safeZoneStatus = 'APPROACHING';
      }
    }

    // Sequentially advance stages 1 through 7 as prerequisites and thresholds are met
    while (this.currentStageIndex <= 7) {
      const stageDef = this.activeMission.stages[this.currentStageIndex - 1];
      if (!stageDef) break;
      const meetsProgress = this.routeProgress >= stageDef.progressThreshold;
      const meetsSpeed = !stageDef.requiredSpeedMps || currentSpeedMps >= stageDef.requiredSpeedMps;
      const meetsCheckpoint =
        !stageDef.requiredCheckpointIndex ||
        this.validatedCheckpoints.has(stageDef.requiredCheckpointIndex);

      if (meetsProgress && meetsSpeed && meetsCheckpoint && !this.completedStages.has(this.currentStageIndex)) {
        this.advanceStage(this.currentStageIndex, countdownRemainingSeconds);
        stageAdvanced = true;
      } else {
        break;
      }
    }

    // Dynamic animation on active 3D stage objects
    this.updateVisualObjects(this.routeProgress);

    return {
      stageAdvanced,
      currentStage: this.activeMission.stages[this.currentStageIndex - 1] || null,
      safeZoneValidated: this.isCompleted,
    };
  }

  /**
   * Validates a required checkpoint along the escape route.
   */
  public validateCheckpoint(checkpointIndex: number): void {
    this.validatedCheckpoints.add(checkpointIndex);
    // If current stage required this checkpoint, try advancing
    if (this.activeMission) {
      const currentStage = this.activeMission.stages[this.currentStageIndex - 1];
      if (currentStage?.requiredCheckpointIndex === checkpointIndex) {
        if (this.routeProgress >= currentStage.progressThreshold) {
          this.advanceStage(this.currentStageIndex);
        }
      }
    }
  }

  /**
   * Advances through an ordered stage (1 through 8).
   */
  private advanceStage(stageNum: number, countdownRemainingSeconds = 900): void {
    if (!this.activeMission) return;
    if (stageNum !== this.currentStageIndex) return;

    // Verify all previous stages (1 .. stageNum - 1) are complete
    for (let prev = 1; prev < stageNum; prev++) {
      if (!this.completedStages.has(prev)) return;
    }

    this.completedStages.add(stageNum);
    const stageDef = this.activeMission.stages[stageNum - 1];

    // Trigger audio feedback for stage transition
    if (stageDef?.audioCue) {
      try {
        sound.playFinalCollapseMasterAlertAudio(stageDef.audioCue, 'CRITICAL');
      } catch (_) {}
    }

    // If this is stage 8 (Safe-Zone Validation)
    if (stageNum === 8) {
      if (countdownRemainingSeconds > 0) {
        this.safeZoneStatus = 'VALIDATED';
        this.isCompleted = true;
        this.isFailed = false;
        this.arrivalRemainingSeconds = countdownRemainingSeconds;
        this.arrivalTimestamp = Date.now();
      } else {
        this.safeZoneStatus = 'DEADLINE_EXPIRED';
        this.isCompleted = false;
        this.isFailed = true;
      }
    } else {
      // Advance to next stage in sequence
      this.currentStageIndex = stageNum + 1;
    }
  }

  /**
   * Direct safe-zone volume entry validation.
   * Validates that all stages 1 through 7 have been completed AND arrival is before 00:00.
   */
  public validateSafeZoneEntry(countdownRemainingSeconds: number): boolean {
    if (!this.activeMission) return false;

    // Prerequisite: Stages 1 through 7 MUST all be completed!
    for (let s = 1; s <= 7; s++) {
      if (!this.completedStages.has(s)) {
        console.warn(`[EscapeMissionManager] Safe zone entry rejected: Stage ${s} incomplete.`);
        return false;
      }
    }

    // Prerequisite: Arrival must be BEFORE countdown reaches 00:00!
    if (countdownRemainingSeconds <= 0) {
      this.safeZoneStatus = 'DEADLINE_EXPIRED';
      this.isCompleted = false;
      this.isFailed = true;
      return false;
    }

    // Successfully complete Stage 8!
    this.advanceStage(8, countdownRemainingSeconds);
    return true;
  }

  /**
   * Evaluates the authoritative outcome at the 00:00 deadline.
   * If player verified safe-zone arrival before deadline -> SURVIVED.
   * Otherwise -> FAILED (Collapse consumes sector).
   */
  public evaluateAuthoritativeOutcome(countdownRemainingSeconds: number): {
    outcome: 'SURVIVED' | 'FAILED';
    safeZoneLabel: string;
    stageReached: string;
    completedInTime: boolean;
  } {
    const survived = this.isCompleted && this.safeZoneStatus === 'VALIDATED';

    let safeZoneLabel = 'NOT REACHED';
    let stageReached = 'NONE';

    if (this.activeMission) {
      const stage = this.activeMission.stages[this.currentStageIndex - 1];
      stageReached = stage ? `${stage.stageId}: ${stage.name}` : 'COMPLETED';
      safeZoneLabel = survived
        ? `${this.activeMission.name} [SECURED]`
        : `${this.activeMission.name} [MISSED DEADLINE]`;
    }

    return {
      outcome: survived ? 'SURVIVED' : 'FAILED',
      safeZoneLabel,
      stageReached,
      completedInTime: survived,
    };
  }

  /**
   * Telemetry feed for RaceHUD and external systems.
   */
  public getTelemetry(): EscapeMissionTelemetry {
    if (!this.activeMission) {
      return {
        missionId: null,
        routeId: null,
        routeName: 'STANDARD ACCRETION ORBIT',
        currentStageId: 'STANDARD',
        currentStageNumber: 0,
        currentStageName: 'STANDARD COURSE',
        stageSubtitle: 'Main racetrack active // select terminal route on Lap 2',
        stageObjective: 'SURVIVE UNTIL SUBMODE 10 TERMINAL FORK',
        routeProgress: 0,
        checkpointsValidated: 0,
        totalCheckpoints: 2,
        safeZoneStatus: 'NOT_ENTERED',
        isMissionCompleted: false,
        isMissionFailed: false,
        completionTimeRemainingSeconds: null,
        safeZoneArrivalTimestamp: null,
      };
    }

    const currentStage = this.activeMission.stages[this.currentStageIndex - 1] ||
      this.activeMission.stages[this.activeMission.stages.length - 1];

    return {
      missionId: this.activeMission.id,
      routeId: this.activeMission.routeId,
      routeName: this.activeMission.name,
      currentStageId: currentStage.stageId,
      currentStageNumber: this.currentStageIndex,
      currentStageName: currentStage.name,
      stageSubtitle: currentStage.subtitle,
      stageObjective: currentStage.objectiveText,
      routeProgress: this.routeProgress,
      checkpointsValidated: this.validatedCheckpoints.size,
      totalCheckpoints: 2,
      safeZoneStatus: this.safeZoneStatus,
      isMissionCompleted: this.isCompleted,
      isMissionFailed: this.isFailed,
      completionTimeRemainingSeconds: this.arrivalRemainingSeconds,
      safeZoneArrivalTimestamp: this.arrivalTimestamp,
    };
  }

  public getActiveMissionId(): EscapeMissionId | null {
    return this.activeMission?.id || null;
  }

  public isMissionActive(): boolean {
    return this.activeMission !== null;
  }

  public isMissionCompleted(): boolean {
    return this.isCompleted && this.safeZoneStatus === 'VALIDATED';
  }

  public getSafeZoneName(): string {
    return this.activeMission?.safeZoneName || 'NOT REACHED';
  }

  /* =========================================================================
     3D PHYSICAL STAGE LANDMARKS & VISUALS
     ========================================================================= */
  private clearVisuals(): void {
    while (this.visualsGroup.children.length > 0) {
      const obj = this.visualsGroup.children[0];
      this.visualsGroup.remove(obj);
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });
    }
    this.stageObjects = [];
  }

  private buildMissionPhysicalLandmarks(): void {
    this.clearVisuals();
    if (!this.activeMission) return;

    const accent = this.activeMission.themeColorHex;
    const mat = (col: number, emis = col, op = 1) =>
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: emis,
        emissiveIntensity: 2.2,
        transparent: op < 1,
        opacity: op,
        roughness: 0.25,
        metalness: 0.85,
      });

    if (this.activeMission.id === 'ROUTE_01_ORBITAL_LAUNCHER') {
      // 1. OL-03: Power conduit nodes along track
      for (let i = 0; i < 4; i++) {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 22, 8), mat(0x0f172a, 0x0284c7));
        pylon.position.set(-180 + i * 20, 20, -1400 - i * 160);
        this.visualsGroup.add(pylon);
        this.stageObjects.push(pylon);
      }

      // 2. OL-05: Acceleration launch catapult rings
      for (let r = 0; r < 5; r++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(18, 0.7, 12, 36), mat(accent, accent));
        ring.position.set(-150, 28 + r * 8, -2100 - r * 110);
        ring.rotation.x = 0.12;
        this.visualsGroup.add(ring);
        this.stageObjects.push(ring);
      }

      // 3. OL-08: Orbital Sanctuary Safe-Zone Gate & Docking Bay
      const sanctuaryGate = new THREE.Mesh(new THREE.TorusGeometry(26, 1.6, 16, 48), mat(0x10b981, 0x10b981));
      sanctuaryGate.position.set(-150, 68, -2850);
      this.visualsGroup.add(sanctuaryGate);
      this.stageObjects.push(sanctuaryGate);

    } else if (this.activeMission.id === 'ROUTE_02_EMERGENCY_ESCAPE') {
      // 1. EC-03: Laser security gate posts
      for (let g = 0; g < 3; g++) {
        const laserPostLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 2), mat(0xef4444, 0xef4444));
        laserPostLeft.position.set(160, 10, -1500 - g * 180);
        const laserPostRight = laserPostLeft.clone();
        laserPostRight.position.set(200, 10, -1500 - g * 180);
        // Laser beam between posts
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 40, 8), mat(0xff0055, 0xff0055, 0.85));
        beam.rotation.z = Math.PI / 2;
        beam.position.set(180, 12, -1500 - g * 180);
        this.visualsGroup.add(laserPostLeft, laserPostRight, beam);
        this.stageObjects.push(beam);
      }

      // 2. EC-04: Collapsed structural bridge trusses
      for (let b = 0; b < 4; b++) {
        const truss = new THREE.Mesh(new THREE.BoxGeometry(28, 3, 4), mat(0x334155, accent));
        truss.position.set(180 + (b % 2 ? 6 : -6), 18, -2100 - b * 140);
        truss.rotation.z = (b % 2 ? 0.18 : -0.18);
        this.visualsGroup.add(truss);
        this.stageObjects.push(truss);
      }

      // 3. EC-08: Subterranean bunker blast door safe zone
      const bunkerGate = new THREE.Mesh(new THREE.BoxGeometry(45, 25, 8), mat(0xd97706, 0xd97706));
      bunkerGate.position.set(180, 6, -2950);
      this.visualsGroup.add(bunkerGate);
      this.stageObjects.push(bunkerGate);

    } else if (this.activeMission.id === 'ROUTE_03_GRAVITY_SLINGSHOT') {
      // 1. GS-03: Slingshot alignment gyro ring
      const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(24, 0.8, 16, 48), mat(accent, accent));
      gyroRing.position.set(0, 35, -1600);
      this.visualsGroup.add(gyroRing);
      this.stageObjects.push(gyroRing);

      // 2. GS-05: Relativistic slingshot booster rings
      for (let s = 0; s < 5; s++) {
        const boostRing = new THREE.Mesh(new THREE.TorusGeometry(16 + s * 1.5, 0.6, 12, 36), mat(0x38bdf8, 0x38bdf8));
        boostRing.position.set(0, 40 + s * 3, -2200 - s * 130);
        this.visualsGroup.add(boostRing);
        this.stageObjects.push(boostRing);
      }

      // 3. GS-08: Einstein-Rosen throat safe-zone disc
      const wormholeThroat = new THREE.Mesh(
        new THREE.CircleGeometry(28, 48),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      wormholeThroat.position.set(0, 52, -3150);
      this.visualsGroup.add(wormholeThroat);
      this.stageObjects.push(wormholeThroat);
    }
  }

  private updateVisualObjects(progress: number): void {
    const t = Date.now() * 0.003;
    this.stageObjects.forEach((obj, idx) => {
      if (obj.type === 'Mesh') {
        obj.rotation.y += 0.015 * ((idx % 3) + 1);
        if (idx % 2 === 0) {
          obj.scale.setScalar(1.0 + Math.sin(t + idx) * 0.04);
        }
      }
    });
  }
}
