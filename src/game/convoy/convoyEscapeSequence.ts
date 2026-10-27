/**
 * VOID-RIDER 3D — CONVOY GUARDIAN
 * FINAL SEQUENCE: GUARDIAN TERMINAL ARRIVAL, MANUAL PARKING & EMERGENCY ESCAPE SEQUENCER
 * 
 * Strict deterministic finite-state machine governing the campaign finale:
 * 1. APPROACH_DOME       — Convoy arrives at 50,000 km approach perimeter (Z ~ -8840).
 * 2. REQUEST_CLEARANCE   — Outer Gate 1 sensor authorization & opening (interlocked with Gate 2).
 * 3. ENTER_DOME          — Fleet traverses airlock chamber; Gate 1 seals, Gate 2 opens to circular atrium.
 * 4. ASSIGN_BAYS         — Assigns Bay 01 (Command Flagship Pad) to Player; Bays 02–09 to convoy vessels.
 * 5. PROCEED_TO_BAY      — Manual flight into designated Bay 01 (assisted parking optional toggle).
 * 6. ALIGN_IN_BAY        — Validates position tolerance (< 32m) and approach speed (< 25m/s).
 *                          HUD prompts: [ENGAGE PARKING LOCKS] or Key 'L'.
 * 7. ENGAGE_LOCKS        — Player engages hydraulic clamps. Motorized arms close, engine shuts down, pad turns green.
 * 8. CONVOY_SECURED      — Surviving transports docked, fleet clamps engaged, facility secured.
 * 9. CAMPAIGN_COMPLETE   — 50,000 km mission completed! Victory results & epilogue screen.
 * 
 * Optional Emergency Escape Flow:
 * 10. EMERGENCY_DECLARED          — Warning alarms sound, backup red lighting, primary exits sealed.
 * 11. EMERGENCY_LOCKS_RELEASED    — Hydraulic clamps released, engines reignited, full controls restored.
 * 12. EMERGENCY_CORRIDOR_TRANSIT  — Navigating through Gate 3 into basement hangar corridor.
 * 13. EMERGENCY_CHAMBER_PASSED    — Gate 5 sensor opens blast doors for emergency egress.
 * 14. EMERGENCY_EXIT_CLEAR        — Full vessel clears secondary exit threshold at Z <= -9850.
 */
import * as THREE from 'three';
import { EscapeSequenceStep, ConvoyShipState } from './convoyTypes';
import { convoyEnvironment } from './convoyEnvironment';
import { convoyChamberGates } from './convoyChamberGates';
import { convoyAdaptiveRoute } from './convoyAdaptiveRoute';
import { sound } from '../audio';

export interface EscapeSequenceStateData {
  step: EscapeSequenceStep;
  stepIndex: number;
  totalSteps: number;
  message: string;
  isComplete: boolean;
  isEmergencyActive: boolean;
  passageGateOpen: boolean;
  dockingBaysOccupied: number;
  totalBays: number;
  playerBayIndex: number;
  distanceToBay: number;
  playerSpeed: number;
  isAligned: boolean;
  canEngageLock: boolean;
  locksEngaged: boolean;
  assistedParking: boolean;
}

export class ConvoyEscapeSequence {
  public currentStep: EscapeSequenceStep = 'APPROACH_DOME';
  public stepElapsed: number = 0;
  public totalSequenceElapsed: number = 0;
  public isComplete: boolean = false;
  public isEmergencyActive: boolean = false;
  public passageGateOpen: boolean = false;
  public clampsEngaged: boolean = false;
  public gateAuthorized: boolean = false;

  // Real-time parking telemetry
  public assistedParking: boolean = false;
  public playerBayIndex: number = 0; // Bay 01 (index 0)
  public distanceToBay: number = 999;
  public playerSpeed: number = 0;
  public isAligned: boolean = false;
  public canEngageLock: boolean = false;
  public locksEngaged: boolean = false;

  private readonly normalStepsOrder: EscapeSequenceStep[] = [
    'APPROACH_DOME',
    'REQUEST_CLEARANCE',
    'ENTER_DOME',
    'ASSIGN_BAYS',
    'PROCEED_TO_BAY',
    'ALIGN_IN_BAY',
    'ENGAGE_LOCKS',
    'CONVOY_SECURED',
    'CAMPAIGN_COMPLETE',
    'CROWN_UNDOCK',
    'RETURN_CLEARANCE',
    'RETURN_TRANSIT',
    'ORIGIN_RETURN_APPROACH',
    'ORIGIN_RETURN_DOCK',
    'OPEN_WORLD_FREE_ROAM',
  ];

  private readonly emergencyStepsOrder: EscapeSequenceStep[] = [
    'EMERGENCY_DECLARED',
    'EMERGENCY_LOCKS_RELEASED',
    'EMERGENCY_CORRIDOR_TRANSIT',
    'EMERGENCY_CHAMBER_PASSED',
    'EMERGENCY_EXIT_CLEAR',
  ];

  public reset() {
    this.currentStep = 'APPROACH_DOME';
    this.stepElapsed = 0;
    this.totalSequenceElapsed = 0;
    this.isComplete = false;
    this.isEmergencyActive = false;
    this.passageGateOpen = false;
    this.clampsEngaged = false;
    this.gateAuthorized = false;
    this.assistedParking = false;
    this.distanceToBay = 999;
    this.playerSpeed = 0;
    this.isAligned = false;
    this.canEngageLock = false;
    this.locksEngaged = false;
    convoyEnvironment.openEntranceGate(false);
    convoyEnvironment.setPlayerLockEngaged(false);
    convoyChamberGates.reset();
    convoyAdaptiveRoute.updateEmergencyRoute(false);
  }

  public toggleAssistedParking(): boolean {
    this.assistedParking = !this.assistedParking;
    return this.assistedParking;
  }

  public canEngagePlayerLock(playerPos: THREE.Vector3, playerVel: THREE.Vector3): boolean {
    const crownTarget = convoyEnvironment.getPlayerParkingTarget();
    const originTarget = convoyEnvironment.getOriginParkingTarget();
    const distCrown = playerPos.distanceTo(crownTarget);
    const distOrigin = playerPos.distanceTo(originTarget);
    const speed = playerVel.length();
    return (distCrown <= 32 || distOrigin <= 32) && speed <= 25;
  }

  public engagePlayerLock(): boolean {
    this.locksEngaged = true;
    this.clampsEngaged = true;
    this.canEngageLock = true;
    this.currentStep = 'ENGAGE_LOCKS';
    this.stepElapsed = 0;
    convoyEnvironment.setPlayerLockEngaged(true);
    sound.playTerminalClampLock?.();
    sound.playClampLock?.(0);
    sound.playParkingConfirmed?.();
    sound.playHavenATCVoice?.('SECURED');
    return true;
  }

  public releasePlayerLocks() {
    this.locksEngaged = false;
    this.clampsEngaged = false;
    convoyEnvironment.setPlayerLockEngaged(false);
    sound.playHydraulicPressureDoor?.();
  }

  public undockPlayer(addNotification?: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void): boolean {
    this.releasePlayerLocks();
    this.currentStep = 'CROWN_UNDOCK';
    this.stepElapsed = 0;
    this.isComplete = false;
    convoyEnvironment.openEntranceGate(true);
    convoyChamberGates.openGateManual('CROWN_OUTER_GATE');
    convoyChamberGates.openGateManual('CROWN_AIRLOCK_GATE');
    convoyChamberGates.openGateManual('ORIGIN_INNER_GATE');
    convoyChamberGates.openGateManual('ORIGIN_OUTER_GATE');
    convoyChamberGates.openGateManual('GATE_1_OUTER_ENTRANCE');
    convoyChamberGates.openGateManual('GATE_2_AIRLOCK_INNER');
    if (addNotification) {
      addNotification('TERMINAL CLAMPS RELEASED — RETURN TRANSIT TO ORIGIN DOME AUTHORIZED', 'SUCCESS');
    }
    sound.playHydraulicPressureDoor?.();
    return true;
  }

  public undockFleet(addNotification?: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void): boolean {
    return this.undockPlayer(addNotification);
  }

  public triggerEmergencyEscape(reason: string = 'TERMINAL_STRUCTURE_BREACH') {
    this.isEmergencyActive = true;
    this.currentStep = 'EMERGENCY_DECLARED';
    this.stepElapsed = 0;
    this.releasePlayerLocks();
    convoyAdaptiveRoute.updateEmergencyRoute(true);
    convoyChamberGates.triggerEmergencyOverride(reason);
    sound.playAlarmAlert?.();
    sound.playTerminalEvacSiren?.();
    sound.playHavenATCVoice?.('EVACUATION_ALARM');
  }

  public repositionPlayerToBay(playerPos: THREE.Vector3, playerVel: THREE.Vector3) {
    const bayTarget = convoyEnvironment.getPlayerParkingTarget();
    playerPos.set(bayTarget.x, bayTarget.y + 35, bayTarget.z + 55);
    playerVel.set(0, 0, 0);
  }

  public update(
    dt: number,
    convoyShips: ConvoyShipState[],
    playerPos: THREE.Vector3,
    playerVel: THREE.Vector3,
    addNotification?: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ): boolean {
    if (this.isComplete) return true;

    this.stepElapsed += dt;
    this.totalSequenceElapsed += dt;
    const survivingShips = convoyShips.filter(s => s.isAlive);
    const bayTarget = convoyEnvironment.getPlayerParkingTarget();
    this.distanceToBay = playerPos.distanceTo(bayTarget);
    this.playerSpeed = playerVel.length();

    switch (this.currentStep) {
      // -----------------------------------------------------------------------
      // 1. APPROACH_DOME (200,000 km threshold)
      // -----------------------------------------------------------------------
      case 'APPROACH_DOME': {
        const distToEntrance = Math.min(Math.abs(playerPos.z - (-37850)), Math.abs(playerPos.z - (-8840)));
        // Decelerate convoy for terminal entry
        survivingShips.forEach(ship => {
          if (!ship.isPlayerControlled) {
            ship.speed = Math.max(30, ship.speed * 0.96);
          }
        });

        if (distToEntrance < 380 || playerPos.z <= -37700 || playerPos.z <= -8700 || this.stepElapsed >= 3.0) {
          this.advanceStep(
            'REQUEST_CLEARANCE',
            addNotification,
            '200,000 KM REACHED — CELESTIAL CROWN TERMINAL PERIMETER · REQUESTING ARRIVAL CLEARANCE'
          );
          sound.playHavenATCVoice?.('APPROACH');
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 2. REQUEST_CLEARANCE: Outer Gate 1 sensor authorization & opening
      // -----------------------------------------------------------------------
      case 'REQUEST_CLEARANCE': {
        if (!this.passageGateOpen) {
          this.passageGateOpen = true;
          this.gateAuthorized = true;
          convoyChamberGates.openGateManual('CROWN_OUTER_GATE');
          convoyChamberGates.openGateManual('GATE_1_OUTER_ENTRANCE');
          sound.playBlastDoorOpen?.();
          sound.playHydraulicPressureDoor?.();
          sound.playCheckpoint?.();
        }

        const gate1Telem = convoyChamberGates.getGateTelemetry('CROWN_OUTER_GATE') || convoyChamberGates.getGateTelemetry('GATE_1_OUTER_ENTRANCE');
        if (gate1Telem?.state === 'OPEN' || this.stepElapsed >= 2.0) {
          this.advanceStep(
            'ENTER_DOME',
            addNotification,
            'CLEARANCE GRANTED — GATE 01 OPEN · AIRLOCK CHAMBER ACTIVE · PROCEED TO ATRIUM'
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 3. ENTER_DOME: Airlock transition to central circular atrium
      // -----------------------------------------------------------------------
      case 'ENTER_DOME': {
        // Convoy vessels move smoothly through the entry threshold
        survivingShips.forEach((ship, idx) => {
          if (!ship.isPlayerControlled) {
            const laneX = ((idx % 3) - 1) * 35;
            const targetPos = new THREE.Vector3(laneX, -140, -38050 - idx * 25);
            ship.position.lerp(targetPos, dt * 1.8);
            if (ship.mesh) ship.mesh.position.copy(ship.position);
          }
        });

        // When ship passes through airlock, open Gate 2 into the central atrium
        if ((playerPos.z <= -37950 || playerPos.z <= -8900) && !convoyChamberGates.getGateTelemetry('CROWN_AIRLOCK_GATE')?.state.includes('OPEN')) {
          convoyChamberGates.openGateManual('CROWN_AIRLOCK_GATE');
          convoyChamberGates.openGateManual('GATE_2_AIRLOCK_INNER');
        }

        const crossedGate = playerPos.z <= -38050 || playerPos.z <= -9050 || this.stepElapsed >= 4.0;
        if (crossedGate) {
          this.advanceStep(
            'ASSIGN_BAYS',
            addNotification,
            'ATRIUM AIRSPACE SECURED · ASSIGNING DESIGNATED MULTI-LEVEL DOCKING BAYS'
          );
          sound.playHavenATCVoice?.('DOME_ENTERED');
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 4. ASSIGN_BAYS: Assign bays
      // -----------------------------------------------------------------------
      case 'ASSIGN_BAYS': {
        this.playerBayIndex = 0; // Bay 01 Command Deck

        survivingShips.forEach((ship, idx) => {
          if (!ship.isPlayerControlled) {
            ship.assignedBayIndex = idx + 1; // Bay 02-09
            convoyEnvironment.setParkingBayState(idx, true, false);
          }
        });

        if (this.stepElapsed >= 1.8) {
          this.advanceStep(
            'PROCEED_TO_BAY',
            addNotification,
            'BAYS DESIGNATED · PLAYER: BAY 01 COMMAND DECK · MANEUVER TO PAD'
          );
          sound.playHavenATCVoice?.('BAY_ALIGNMENT');
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 5. PROCEED_TO_BAY: Manual steering to Bay 01
      // -----------------------------------------------------------------------
      case 'PROCEED_TO_BAY': {
        // AI Transports move towards their assigned bays smoothly
        survivingShips.forEach((ship, idx) => {
          if (!ship.isPlayerControlled) {
            const bayPos = convoyEnvironment.getParkingPosition(idx);
            ship.position.lerp(bayPos, dt * 1.5);
            if (ship.mesh) ship.mesh.position.copy(ship.position);
            const d = ship.position.distanceTo(bayPos);
            ship.isAlignedWithBay = d <= 25;
          }
        });

        // Assisted docking steering vector if user enabled it
        if (this.assistedParking) {
          const steerDir = bayTarget.clone().sub(playerPos);
          if (steerDir.length() > 5) {
            steerDir.normalize().multiplyScalar(Math.min(18, steerDir.length()));
            playerVel.lerp(steerDir, dt * 2.0);
          }
        }

        // In proximity of Bay 01 (< 42m)
        if (this.distanceToBay <= 42) {
          this.advanceStep(
            'ALIGN_IN_BAY',
            addNotification,
            'BAY 01 PROXIMITY REACHED · REDUCE SPEED (<25 m/s) & HOLD OVER PAD (<32m)'
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 6. ALIGN_IN_BAY: Precision alignment & lock readiness
      // -----------------------------------------------------------------------
      case 'ALIGN_IN_BAY': {
        survivingShips.forEach((ship, idx) => {
          if (!ship.isPlayerControlled) {
            const bayPos = convoyEnvironment.getParkingPosition(idx);
            ship.position.lerp(bayPos, dt * 2.2);
            if (ship.mesh) ship.mesh.position.copy(ship.position);
            ship.isAlignedWithBay = ship.position.distanceTo(bayPos) <= 15;
          }
        });

        if (this.assistedParking) {
          const steerDir = bayTarget.clone().sub(playerPos);
          playerVel.lerp(steerDir.multiplyScalar(0.8), dt * 3.0);
        }

        // Precision criteria: distance <= 32m, speed <= 25m/s
        this.isAligned = this.distanceToBay <= 32;
        const speedOk = this.playerSpeed <= 25;
        this.canEngageLock = this.isAligned && speedOk;

        // Auto-lock fallback after 5 seconds of good alignment for accessibility
        if (this.canEngageLock && this.stepElapsed >= 5.0) {
          this.engagePlayerLock();
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 7. ENGAGE_LOCKS: Hydraulic clamp arms close onto player hull
      // -----------------------------------------------------------------------
      case 'ENGAGE_LOCKS': {
        this.locksEngaged = true;
        convoyEnvironment.setPlayerLockEngaged(true);

        // Lock player ship in bay pad position & halt velocity
        playerPos.lerp(bayTarget, dt * 4.0);
        playerVel.set(0, 0, 0);

        if (this.stepElapsed >= 2.2) {
          this.advanceStep(
            'CONVOY_SECURED',
            addNotification,
            'PLAYER BAY 01 LOCKED · SECURING SURVIVING CONVOY TRANSPORTS'
          );
          sound.playHavenATCVoice?.('SECURED');
          sound.playStationSecureChime?.();
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 8. CONVOY_SECURED: Fleet clamps engage, facility lockdown
      // -----------------------------------------------------------------------
      case 'CONVOY_SECURED': {
        this.clampsEngaged = true;
        convoyEnvironment.setPlayerLockEngaged(true);
        playerVel.set(0, 0, 0);

        survivingShips.forEach((ship, idx) => {
          if (!ship.isPlayerControlled) {
            const bayPos = convoyEnvironment.getParkingPosition(idx);
            ship.position.copy(bayPos);
            if (ship.mesh) ship.mesh.position.copy(bayPos);
            ship.isClampedInBay = true;
            ship.status = 'DOCKED';
            convoyEnvironment.setParkingBayState(idx, false, true);
          }
        });

        if (this.stepElapsed >= 3.0) {
          this.advanceStep(
            'CAMPAIGN_COMPLETE',
            addNotification,
            '50,000 KM ROUTE COMPLETE — CONVOY FLEET SAFELY SECURED IN GUARDIAN TERMINAL'
          );
          sound.playFinish?.();
          sound.playParkingConfirmed?.();
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 9. CAMPAIGN_COMPLETE: Final results & epilogue
      // -----------------------------------------------------------------------
      case 'CAMPAIGN_COMPLETE': {
        this.isComplete = true;
        return true;
      }

      // -----------------------------------------------------------------------
      // 10. EMERGENCY_DECLARED: Structure breach alarm & locks release warning
      // -----------------------------------------------------------------------
      case 'EMERGENCY_DECLARED': {
        if (this.stepElapsed >= 2.0) {
          this.advanceStep(
            'EMERGENCY_LOCKS_RELEASED',
            addNotification,
            'EMERGENCY CLAMPS RELEASED · ENGINES ONLINE · ESCAPE ROUTE HIGHLIGHTED'
          );
          this.releasePlayerLocks();
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 11. EMERGENCY_LOCKS_RELEASED: Player maneuvers towards Gate 3
      // -----------------------------------------------------------------------
      case 'EMERGENCY_LOCKS_RELEASED': {
        convoyChamberGates.openGateManual('GATE_3_ATRIUM_TO_BASEMENT');
        if (playerPos.y <= -190 || playerPos.z <= -9350 || this.stepElapsed >= 4.0) {
          this.advanceStep(
            'EMERGENCY_CORRIDOR_TRANSIT',
            addNotification,
            'BASEMENT SHAFT TRANSIT ACTIVE · PROCEED TOWARDS EMERGENCY CHAMBER GATE 05'
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 12. EMERGENCY_CORRIDOR_TRANSIT: Flying through basement to Gate 5
      // -----------------------------------------------------------------------
      case 'EMERGENCY_CORRIDOR_TRANSIT': {
        const distToGate5 = playerPos.distanceTo(new THREE.Vector3(0, -250, -9700));
        if (distToGate5 < 180) {
          convoyChamberGates.openGateManual('GATE_5_EMERGENCY_ESCAPE');
        }
        if (distToGate5 < 60 || playerPos.z <= -9720) {
          this.advanceStep(
            'EMERGENCY_CHAMBER_PASSED',
            addNotification,
            'GATE 05 PASSED · SECONDARY EMERGENCY BLAST EXIT STRAIGHT AHEAD'
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 13. EMERGENCY_CHAMBER_PASSED: Secondary exit clearance
      // -----------------------------------------------------------------------
      case 'EMERGENCY_CHAMBER_PASSED': {
        if (playerPos.z <= -9840 || this.stepElapsed >= 3.0) {
          this.advanceStep(
            'EMERGENCY_EXIT_CLEAR',
            addNotification,
            'SECONDARY BLAST EXIT CLEARED — EMERGENCY ESCAPE DRILL SUCCESSFUL!'
          );
          sound.playFinish?.();
        }
        break;
      }

      // -----------------------------------------------------------------------
      // 14. EMERGENCY_EXIT_CLEAR: Complete escape drill
      // -----------------------------------------------------------------------
      case 'EMERGENCY_EXIT_CLEAR': {
        this.isComplete = true;
        return true;
      }
    }

    return false;
  }

  private advanceStep(
    nextStep: EscapeSequenceStep,
    addNotification: ((text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void) | undefined,
    message: string
  ) {
    this.currentStep = nextStep;
    this.stepElapsed = 0;
    if (nextStep === 'CAMPAIGN_COMPLETE' || nextStep === 'EMERGENCY_EXIT_CLEAR') {
      this.isComplete = true;
    }
    if (addNotification) {
      addNotification(
        message,
        nextStep === 'CAMPAIGN_COMPLETE' || nextStep === 'EMERGENCY_EXIT_CLEAR'
          ? 'SUCCESS'
          : nextStep === 'EMERGENCY_DECLARED'
          ? 'ALERT'
          : 'EVENT'
      );
    }
  }

  public getStateData(): EscapeSequenceStateData {
    const isEmerg = this.emergencyStepsOrder.includes(this.currentStep);
    const activeOrder = isEmerg ? this.emergencyStepsOrder : this.normalStepsOrder;
    const stepIndex = activeOrder.indexOf(this.currentStep) + 1;

    return {
      step: this.currentStep,
      stepIndex: stepIndex > 0 ? stepIndex : 1,
      totalSteps: activeOrder.length,
      message: this.getStepMessage(),
      isComplete: this.isComplete,
      isEmergencyActive: this.isEmergencyActive,
      passageGateOpen: this.passageGateOpen,
      dockingBaysOccupied: this.clampsEngaged ? 9 : 0,
      totalBays: 9,
      playerBayIndex: this.playerBayIndex,
      distanceToBay: Math.round(this.distanceToBay * 10) / 10,
      playerSpeed: Math.round(this.playerSpeed * 10) / 10,
      isAligned: this.isAligned,
      canEngageLock: this.canEngageLock,
      locksEngaged: this.locksEngaged,
      assistedParking: this.assistedParking,
    };
  }

  private getStepMessage(): string {
    switch (this.currentStep) {
      case 'APPROACH_DOME':
        return 'Approaching Guardian Space Terminal at 50,000 km — decelerating convoy';
      case 'REQUEST_CLEARANCE':
        return 'Requesting arrival clearance — Gate 01 airlock blast doors opening';
      case 'ENTER_DOME':
        return 'Navigating through airlock chamber into circular parking atrium';
      case 'ASSIGN_BAYS':
        return 'Traffic Control: Bay 01 assigned to Command Flagship, Bays 02-09 to Convoy';
      case 'PROCEED_TO_BAY':
        return 'Maneuver ship into designated Bay 01 pad';
      case 'ALIGN_IN_BAY':
        return this.canEngageLock
          ? 'ALIGNED OVER PAD — ENGAGE PARKING LOCKS [L] NOW!'
          : this.playerSpeed > 25
          ? 'REDUCE APPROACH SPEED (< 25 m/s)'
          : 'Center ship over Bay 01 pad (< 32m)';
      case 'ENGAGE_LOCKS':
        return 'Hydraulic parking clamp arms engaging onto ship hull';
      case 'CONVOY_SECURED':
        return 'Convoy fleet docked & locked in Guardian Space Terminal';
      case 'CAMPAIGN_COMPLETE':
        return '50,000 km Convoy Guardian Campaign Complete — Fleet Secured!';
      case 'EMERGENCY_DECLARED':
        return 'CRITICAL ALARM: Terminal Breach Detected — Stand by for emergency release!';
      case 'EMERGENCY_LOCKS_RELEASED':
        return 'Clamps Released — Steer towards Basement Gate 03!';
      case 'EMERGENCY_CORRIDOR_TRANSIT':
        return 'Navigate basement corridor towards Emergency Chamber Gate 05!';
      case 'EMERGENCY_CHAMBER_PASSED':
        return 'Gate 05 cleared — Accelerate through Secondary Blast Exit!';
      case 'EMERGENCY_EXIT_CLEAR':
        return 'Secondary Exit Cleared — Emergency Escape Successful!';
      default:
        return 'Terminal operations active';
    }
  }
}

export const convoyEscapeSequence = new ConvoyEscapeSequence();
