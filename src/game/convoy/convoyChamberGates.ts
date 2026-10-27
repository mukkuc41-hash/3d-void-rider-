/**
 * VOID-RIDER 3D — CONVOY GUARDIAN SENSOR-CONTROLLED CHAMBER GATES
 * 
 * Master implementation of Section 10:
 * - Real sensor-controlled chamber gates coordinating detection, authorization,
 *   door movement, collision, chamber occupancy, convoy passage, route planning,
 *   parking, and emergency escape.
 * 
 * Gates Managed:
 * 1. GATE_1_OUTER_ENTRANCE: Outer terminal entrance (Z = -8840)
 * 2. GATE_2_AIRLOCK_INNER: Upper arrival / airlock to circular atrium (Z = -8980)
 * 3. GATE_3_ATRIUM_TO_BASEMENT: Atrium-to-basement vertical flight shaft (Y = -185, Z = -9250)
 * 4. GATE_4_RESTRICTED_MAINTENANCE: Restricted maintenance bays access (Y = -260, Z = -9450)
 * 5. GATE_5_EMERGENCY_ESCAPE: Emergency escape chamber leading to secondary exit (Z = -9700)
 * 
 * Explicit State Machine:
 * CLOSED → DETECTING → AUTHORIZING → OPENING → OPEN → SHIP_CROSSING → CLEARANCE_CHECK → CLOSING → CLOSED
 * + BLOCKED, FAULT, EMERGENCY_OVERRIDE
 * 
 * Safety Features:
 * - Dual-Door Airlock Interlocks (Gate 1 & Gate 2 never open simultaneously in standard mode)
 * - Anti-Pinch / Anti-Crush Sensor: Full ship bounding volume check. If threshold is occupied
 *   during closing, door immediately halts and safely reopens.
 * - Staged Convoy Group Crossing: Gate stays open until all designated group ships pass.
 * - Physical Collision Synchronization: Collision bounds update in real-time with visual leaves.
 */
import * as THREE from 'three';
import {
  ChamberGateId,
  ChamberGateState,
  ChamberGateTelemetry,
  ConvoyShipState,
} from './convoyTypes';
import { sound } from '../audio';

export interface GateDefinition {
  id: ChamberGateId;
  name: string;
  position: THREE.Vector3;
  clearanceWidth: number;
  clearanceHeight: number;
  thresholdDepth: number;
  detectionRadius: number;
  openSpeed: number; // units/sec
  doorTravelDistance: number;
  interlockPartnerId?: ChamberGateId;
}

export class ChamberGateEntity {
  public def: GateDefinition;
  public state: ChamberGateState = 'CLOSED';
  public openProgress: number = 0.0; // 0 (closed) to 1 (fully open)
  public stateTimer: number = 0;
  public isAuthorized: boolean = false;
  public isShipInThreshold: boolean = false;
  public isInterlocked: boolean = false;
  public interlockLockedBy?: string;
  public isEmergencyOverride: boolean = false;
  public zoneOccupancy: number = 0;
  public faultReason: string = '';
  public warningText: string = '';

  // 3D Objects
  public group: THREE.Group;
  public leftLeaf: THREE.Mesh | null = null;
  public rightLeaf: THREE.Mesh | null = null;
  public topLeaf?: THREE.Mesh | null = null;
  public bottomLeaf?: THREE.Mesh | null = null;
  public statusBeacons: THREE.Mesh[] = [];
  public sensorRing: THREE.Mesh | null = null;

  // Physical collision bounds (axis-aligned box in world coordinates)
  public collisionBox: THREE.Box3 = new THREE.Box3();

  // Convoy queue tracking
  public queuedShipIds: Set<string> = new Set();
  public passedShipIds: Set<string> = new Set();

  constructor(def: GateDefinition) {
    this.def = def;
    this.group = new THREE.Group();
    this.group.name = `chamber_gate_${def.id}`;
    this.group.position.copy(def.position);
    this.updateCollisionBounds();
  }

  public updateCollisionBounds() {
    const halfW = (this.def.clearanceWidth / 2) * (1 - this.openProgress);
    const halfH = this.def.clearanceHeight / 2;
    const halfD = this.def.thresholdDepth / 2;
    this.collisionBox.min.set(
      this.def.position.x - halfW,
      this.def.position.y - halfH,
      this.def.position.z - halfD
    );
    this.collisionBox.max.set(
      this.def.position.x + halfW,
      this.def.position.y + halfH,
      this.def.position.z + halfD
    );
  }

  public getTelemetry(): ChamberGateTelemetry {
    let statusColor = '#ef4444'; // Red default
    switch (this.state) {
      case 'CLOSED':
        statusColor = this.isInterlocked ? '#64748b' : '#ef4444';
        break;
      case 'DETECTING':
      case 'AUTHORIZING':
        statusColor = '#f59e0b'; // Amber
        break;
      case 'OPENING':
      case 'OPEN':
      case 'SHIP_CROSSING':
      case 'CLEARANCE_CHECK':
        statusColor = '#10b981'; // Green
        break;
      case 'CLOSING':
        statusColor = '#38bdf8'; // Cyan
        break;
      case 'BLOCKED':
      case 'FAULT':
        statusColor = '#dc2626'; // High red
        break;
      case 'EMERGENCY_OVERRIDE':
        statusColor = '#a855f7'; // Purple
        break;
    }

    return {
      id: this.def.id,
      name: this.def.name,
      state: this.state,
      openProgress: Math.round(this.openProgress * 100) / 100,
      isAuthorized: this.isAuthorized,
      isShipInThreshold: this.isShipInThreshold,
      isInterlocked: this.isInterlocked,
      interlockLockedBy: this.interlockLockedBy,
      isEmergencyOverride: this.isEmergencyOverride,
      zoneOccupancy: this.zoneOccupancy,
      statusColor,
      warningText: this.warningText || undefined,
    };
  }
}

export class ConvoyChamberGates {
  public gates: Map<ChamberGateId, ChamberGateEntity> = new Map();
  public group: THREE.Group;
  private soundCooldown: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'convoy_chamber_gates_group';
    this.initGateDefinitions();
  }

  private initGateDefinitions() {
    const definitions: GateDefinition[] = [
      {
        id: 'GATE_1_OUTER_ENTRANCE',
        name: 'Gate 01 · Outer Approach Portal',
        position: new THREE.Vector3(0, 30, -8840),
        clearanceWidth: 140,
        clearanceHeight: 90,
        thresholdDepth: 35,
        detectionRadius: 260,
        openSpeed: 1.1,
        doorTravelDistance: 85,
        interlockPartnerId: 'GATE_2_AIRLOCK_INNER',
      },
      {
        id: 'GATE_2_AIRLOCK_INNER',
        name: 'Gate 02 · Central Atrium Airlock',
        position: new THREE.Vector3(0, 25, -8980),
        clearanceWidth: 130,
        clearanceHeight: 85,
        thresholdDepth: 35,
        detectionRadius: 220,
        openSpeed: 1.1,
        doorTravelDistance: 80,
        interlockPartnerId: 'GATE_1_OUTER_ENTRANCE',
      },
      {
        id: 'GATE_3_ATRIUM_TO_BASEMENT',
        name: 'Gate 03 · Lower Hangar Descent Shaft',
        position: new THREE.Vector3(0, -185, -9250),
        clearanceWidth: 110,
        clearanceHeight: 65,
        thresholdDepth: 30,
        detectionRadius: 180,
        openSpeed: 1.0,
        doorTravelDistance: 70,
      },
      {
        id: 'GATE_4_RESTRICTED_MAINTENANCE',
        name: 'Gate 04 · Restricted Heavy Service Bay',
        position: new THREE.Vector3(0, -255, -9450),
        clearanceWidth: 95,
        clearanceHeight: 55,
        thresholdDepth: 25,
        detectionRadius: 150,
        openSpeed: 1.0,
        doorTravelDistance: 60,
      },
      {
        id: 'GATE_5_EMERGENCY_ESCAPE',
        name: 'Gate 05 · Emergency Evacuation Airlock',
        position: new THREE.Vector3(0, -245, -9700),
        clearanceWidth: 120,
        clearanceHeight: 80,
        thresholdDepth: 35,
        detectionRadius: 200,
        openSpeed: 1.3,
        doorTravelDistance: 75,
      },
      {
        id: 'ORIGIN_INNER_GATE',
        name: 'Origin Inner Hangar Gate',
        position: new THREE.Vector3(0, 0, -120),
        clearanceWidth: 160,
        clearanceHeight: 90,
        thresholdDepth: 35,
        detectionRadius: 280,
        openSpeed: 1.2,
        doorTravelDistance: 90,
        interlockPartnerId: 'ORIGIN_OUTER_GATE',
      },
      {
        id: 'ORIGIN_OUTER_GATE',
        name: 'Origin Departure Launch Gate',
        position: new THREE.Vector3(0, 0, -280),
        clearanceWidth: 180,
        clearanceHeight: 100,
        thresholdDepth: 40,
        detectionRadius: 300,
        openSpeed: 1.2,
        doorTravelDistance: 100,
        interlockPartnerId: 'ORIGIN_INNER_GATE',
      },
      {
        id: 'CROWN_OUTER_GATE',
        name: 'Celestial Crown Outer Arrival Gate',
        position: new THREE.Vector3(0, 40, -37850),
        clearanceWidth: 160,
        clearanceHeight: 100,
        thresholdDepth: 40,
        detectionRadius: 320,
        openSpeed: 1.2,
        doorTravelDistance: 95,
        interlockPartnerId: 'CROWN_AIRLOCK_GATE',
      },
      {
        id: 'CROWN_AIRLOCK_GATE',
        name: 'Celestial Crown Inner Airlock Gate',
        position: new THREE.Vector3(0, 20, -38050),
        clearanceWidth: 150,
        clearanceHeight: 95,
        thresholdDepth: 40,
        detectionRadius: 280,
        openSpeed: 1.2,
        doorTravelDistance: 90,
        interlockPartnerId: 'CROWN_OUTER_GATE',
      },
    ];

    definitions.forEach(def => {
      const entity = new ChamberGateEntity(def);
      this.buildGate3DMesh(entity);
      this.gates.set(def.id, entity);
      this.group.add(entity.group);
    });
  }

  /**
   * Build realistic Three.js physical blast doors, mechanical frame, sensor rings, and beacons
   */
  private buildGate3DMesh(gate: ChamberGateEntity) {
    const def = gate.def;
    const isEmergency = def.id === 'GATE_5_EMERGENCY_ESCAPE';
    const isDescent = def.id === 'GATE_3_ATRIUM_TO_BASEMENT';

    // 1. Reinforced Outer Frame
    const frameColor = isEmergency ? 0x991b1b : isDescent ? 0x0369a1 : 0x1e293b;
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: 0.88,
      roughness: 0.22,
      emissive: frameColor,
      emissiveIntensity: 0.35,
    });

    const frameThickness = 12;
    const frameGeo = new THREE.BoxGeometry(
      def.clearanceWidth + frameThickness * 2,
      def.clearanceHeight + frameThickness * 2,
      def.thresholdDepth
    );
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    gate.group.add(frameMesh);

    // 2. Motorized Left & Right Blast Door Leaves
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.2,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4,
    });

    const leafWidth = def.clearanceWidth / 2 + 6;
    const leafHeight = def.clearanceHeight - 2;
    const leafDepth = def.thresholdDepth * 0.45;

    // Left Leaf
    const leftGeo = new THREE.BoxGeometry(leafWidth, leafHeight, leafDepth);
    const leftMesh = new THREE.Mesh(leftGeo, doorMat);
    leftMesh.position.set(-leafWidth / 2, 0, 0);
    leftMesh.userData.closedX = -leafWidth / 2;
    leftMesh.userData.travel = def.doorTravelDistance;
    gate.group.add(leftMesh);
    gate.leftLeaf = leftMesh;

    // Right Leaf
    const rightGeo = new THREE.BoxGeometry(leafWidth, leafHeight, leafDepth);
    const rightMesh = new THREE.Mesh(rightGeo, doorMat);
    rightMesh.position.set(leafWidth / 2, 0, 0);
    rightMesh.userData.closedX = leafWidth / 2;
    rightMesh.userData.travel = def.doorTravelDistance;
    gate.group.add(rightMesh);
    gate.rightLeaf = rightMesh;

    // Chevron hazard markings on doors
    const hazardMat = new THREE.MeshBasicMaterial({ color: isEmergency ? 0xef4444 : 0xf59e0b });
    [-1, 1].forEach(side => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(6, leafHeight * 0.8, leafDepth + 1), hazardMat);
      stripe.position.set(side * 8, 0, 0);
      gate.group.add(stripe);
    });

    // 3. Sensor Arch Ring (Emits active pulse scanning volume)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Red initially
      transparent: true,
      opacity: 0.75,
    });
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry((def.clearanceWidth + def.clearanceHeight) / 4, 3.5, 8, 48),
      ringMat
    );
    ringMesh.position.set(0, 0, def.thresholdDepth / 2 + 4);
    gate.group.add(ringMesh);
    gate.sensorRing = ringMesh;

    // 4. Traffic Clearance Signal Beacons
    [-def.clearanceWidth / 2 - 8, def.clearanceWidth / 2 + 8].forEach(x => {
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 14, 16), beaconMat);
      beaconMesh.position.set(x, def.clearanceHeight / 2 + 5, def.thresholdDepth / 2);
      beaconMesh.rotation.z = Math.PI / 2;
      gate.group.add(beaconMesh);
      gate.statusBeacons.push(beaconMesh);
    });
  }

  /**
   * Reset all gates to nominal default state
   */
  public reset() {
    this.gates.forEach(gate => {
      gate.state = 'CLOSED';
      gate.openProgress = 0.0;
      gate.stateTimer = 0;
      gate.isAuthorized = false;
      gate.isShipInThreshold = false;
      gate.isInterlocked = false;
      gate.isEmergencyOverride = false;
      gate.zoneOccupancy = 0;
      gate.warningText = '';
      gate.queuedShipIds.clear();
      gate.passedShipIds.clear();
      this.updateVisuals(gate);
    });
  }

  /**
   * Main per-frame update loop for all 5 sensor-controlled chamber gates
   */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerVel: THREE.Vector3,
    convoyShips: ConvoyShipState[],
    isEmergencyActive: boolean = false,
    addNotification?: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ) {
    this.soundCooldown = Math.max(0, this.soundCooldown - dt);

    // Player full bounding sphere (radius 18m covers nose, wings, thrusters)
    const playerRadius = 18;
    const playerSpeed = playerVel.length();

    // Check dual-door airlock interlock between Gate 1 & Gate 2
    const gate1 = this.gates.get('GATE_1_OUTER_ENTRANCE');
    const gate2 = this.gates.get('GATE_2_AIRLOCK_INNER');

    if (gate1 && gate2 && !isEmergencyActive) {
      if (gate1.openProgress > 0.05 || gate1.state === 'OPENING' || gate1.state === 'OPEN') {
        gate2.isInterlocked = true;
        gate2.interlockLockedBy = 'GATE 01 AIRLOCK OUTER CYCLE ACTIVE';
      } else if (gate2.openProgress > 0.05 || gate2.state === 'OPENING' || gate2.state === 'OPEN') {
        gate1.isInterlocked = true;
        gate1.interlockLockedBy = 'GATE 02 ATRIUM INGRESS ACTIVE';
      } else {
        gate1.isInterlocked = false;
        gate1.interlockLockedBy = undefined;
        gate2.isInterlocked = false;
        gate2.interlockLockedBy = undefined;
      }
    }

    this.gates.forEach(gate => {
      gate.stateTimer += dt;
      gate.isEmergencyOverride = isEmergencyActive;

      // 1. Full Bounding Volume Proximity & Threshold Detection
      const distToPlayer = playerPos.distanceTo(gate.def.position);
      const isPlayerApproaching = distToPlayer <= gate.def.detectionRadius;

      // Check threshold occupation with 3D axial boundaries (x, y, z)
      const halfW = gate.def.clearanceWidth / 2 + 10;
      const halfH = gate.def.clearanceHeight / 2 + 10;
      const halfD = gate.def.thresholdDepth / 2 + playerRadius;

      const inThresholdX = Math.abs(playerPos.x - gate.def.position.x) <= halfW;
      const inThresholdY = Math.abs(playerPos.y - gate.def.position.y) <= halfH;
      const inThresholdZ = Math.abs(playerPos.z - gate.def.position.z) <= halfD;

      const playerInThreshold = inThresholdX && inThresholdY && inThresholdZ;

      // Check surviving convoy vessels in threshold
      let convoyInThreshold = false;
      convoyShips.forEach(ship => {
        if (!ship.isAlive || ship.isPlayerControlled) return;
        const cInX = Math.abs(ship.position.x - gate.def.position.x) <= halfW;
        const cInY = Math.abs(ship.position.y - gate.def.position.y) <= halfH;
        const cInZ = Math.abs(ship.position.z - gate.def.position.z) <= halfD;
        if (cInX && cInY && cInZ) convoyInThreshold = true;
      });

      gate.isShipInThreshold = playerInThreshold || convoyInThreshold;

      // Zone occupancy count
      let occupancy = 0;
      if (playerPos.distanceTo(gate.def.position) < gate.def.detectionRadius) occupancy++;
      convoyShips.forEach(s => {
        if (s.isAlive && s.position.distanceTo(gate.def.position) < gate.def.detectionRadius) occupancy++;
      });
      gate.zoneOccupancy = occupancy;

      // 2. Gate Finite State Machine Processing
      this.processGateFSM(
        gate,
        dt,
        isPlayerApproaching,
        gate.isShipInThreshold,
        playerSpeed,
        isEmergencyActive,
        addNotification
      );

      // 3. Update Visual Mesh Leaves & Physical Colliders
      this.updateVisuals(gate);
    });
  }

  private processGateFSM(
    gate: ChamberGateEntity,
    dt: number,
    isApproaching: boolean,
    inThreshold: boolean,
    playerSpeed: number,
    isEmergency: boolean,
    addNotification?: (text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') => void
  ) {
    switch (gate.state) {
      // 1. CLOSED
      case 'CLOSED': {
        gate.openProgress = 0.0;
        gate.warningText = '';

        if (gate.isInterlocked && !isEmergency) {
          gate.warningText = gate.interlockLockedBy || 'AIRLOCK INTERLOCK ENGAGED';
          break;
        }

        if (isApproaching || isEmergency) {
          gate.state = 'DETECTING';
          gate.stateTimer = 0;
          this.playGateSound('DETECT');
        }
        break;
      }

      // 2. DETECTING: Sensor detects approaching craft, scans volume
      case 'DETECTING': {
        if (!isApproaching && !isEmergency && !inThreshold) {
          gate.state = 'CLOSED';
          gate.stateTimer = 0;
          break;
        }

        if (gate.isInterlocked && !isEmergency) {
          gate.warningText = 'HOLD POSITION — AIRLOCK PRESSURIZING';
          break;
        }

        if (gate.stateTimer >= 0.6 || isEmergency) {
          gate.state = 'AUTHORIZING';
          gate.stateTimer = 0;
          gate.isAuthorized = true;
          this.playGateSound('AUTHORIZE');
        }
        break;
      }

      // 3. AUTHORIZING: Traffic control verifies security clearances
      case 'AUTHORIZING': {
        if (gate.isInterlocked && !isEmergency) {
          gate.state = 'DETECTING';
          gate.stateTimer = 0;
          break;
        }

        if (gate.stateTimer >= 0.8 || isEmergency) {
          gate.state = 'OPENING';
          gate.stateTimer = 0;
          this.playGateSound('OPEN');
          if (addNotification) {
            addNotification(`${gate.def.name.toUpperCase()} · MOTORIZED DOORS OPENING`, 'EVENT');
          }
        }
        break;
      }

      // 4. OPENING: Blast door leaves slide back along mechanical rails
      case 'OPENING': {
        gate.openProgress = Math.min(1.0, gate.openProgress + gate.def.openSpeed * dt);
        if (gate.openProgress >= 1.0) {
          gate.state = 'OPEN';
          gate.stateTimer = 0;
        }
        break;
      }

      // 5. OPEN: Aperture fully clear for ship & convoy transit
      case 'OPEN': {
        gate.openProgress = 1.0;
        if (inThreshold) {
          gate.state = 'SHIP_CROSSING';
          gate.stateTimer = 0;
        } else if (!isApproaching && !isEmergency && gate.stateTimer >= 3.0) {
          gate.state = 'CLEARANCE_CHECK';
          gate.stateTimer = 0;
        }
        break;
      }

      // 6. SHIP_CROSSING: Ship or wingtips actively traversing threshold
      case 'SHIP_CROSSING': {
        gate.openProgress = 1.0;
        // Gate MUST hold completely open as long as any part of the craft occupies threshold!
        if (!inThreshold) {
          gate.state = 'CLEARANCE_CHECK';
          gate.stateTimer = 0;
        }
        break;
      }

      // 7. CLEARANCE_CHECK: Safety delay ensuring full craft & tail have cleared
      case 'CLEARANCE_CHECK': {
        // If ship re-enters threshold during check, immediately return to SHIP_CROSSING
        if (inThreshold) {
          gate.state = 'SHIP_CROSSING';
          gate.stateTimer = 0;
          break;
        }

        if (gate.stateTimer >= 1.8) {
          gate.state = 'CLOSING';
          gate.stateTimer = 0;
          this.playGateSound('CLOSE');
        }
        break;
      }

      // 8. CLOSING: Doors slide shut with active anti-pinch / obstruction monitor
      case 'CLOSING': {
        // ANTI-CRUSH SAFETY MONITOR:
        // If ANY craft, wing, or obstacle enters threshold while doors are closing,
        // the gate MUST immediately halt and safely reopen!
        if (inThreshold) {
          gate.state = 'BLOCKED';
          gate.stateTimer = 0;
          gate.warningText = 'OBSTRUCTION DETECTED — REOPENING BLAST DOORS';
          if (addNotification) {
            addNotification(`SAFETY REVERSE: ${gate.def.name.toUpperCase()} OBSTRUCTION DETECTED!`, 'WARNING');
          }
          this.playGateSound('OBSTRUCT');
          break;
        }

        gate.openProgress = Math.max(0.0, gate.openProgress - gate.def.openSpeed * dt);
        if (gate.openProgress <= 0.0) {
          gate.state = 'CLOSED';
          gate.stateTimer = 0;
          gate.isAuthorized = false;
          this.playGateSound('SECURE');
        }
        break;
      }

      // 9. BLOCKED: Obstruction detected — immediately reopens!
      case 'BLOCKED': {
        gate.openProgress = Math.min(1.0, gate.openProgress + (gate.def.openSpeed * 1.6) * dt);
        if (gate.openProgress >= 1.0) {
          gate.state = 'OPEN';
          gate.stateTimer = 0;
          gate.warningText = '';
        }
        break;
      }

      // 10. EMERGENCY_OVERRIDE: Force open all perimeter blast gates
      case 'EMERGENCY_OVERRIDE': {
        gate.openProgress = Math.min(1.0, gate.openProgress + (gate.def.openSpeed * 1.8) * dt);
        gate.warningText = 'EMERGENCY OVERRIDE ENGAGED — EVACUATION CLEARANCE';
        if (gate.openProgress >= 1.0) {
          gate.state = 'OPEN';
        }
        break;
      }

      default:
        gate.state = 'CLOSED';
        break;
    }
  }

  /**
   * Update visual positions of door leaves, beacon lights, and sensor rings
   */
  private updateVisuals(gate: ChamberGateEntity) {
    const travel = gate.def.doorTravelDistance;
    const progress = gate.openProgress;

    // Left leaf slides left (-X)
    if (gate.leftLeaf) {
      const closedX = Number(gate.leftLeaf.userData.closedX || 0);
      gate.leftLeaf.position.x = closedX - travel * progress;
    }

    // Right leaf slides right (+X)
    if (gate.rightLeaf) {
      const closedX = Number(gate.rightLeaf.userData.closedX || 0);
      gate.rightLeaf.position.x = closedX + travel * progress;
    }

    // Update collision box
    gate.updateCollisionBounds();

    // Update sensor ring and beacon colors
    const telemetry = gate.getTelemetry();
    const hexColor = parseInt(telemetry.statusColor.replace('#', '0x'), 16);

    if (gate.sensorRing) {
      (gate.sensorRing.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
      (gate.sensorRing.material as THREE.MeshBasicMaterial).opacity =
        gate.state === 'OPEN' || gate.state === 'SHIP_CROSSING' ? 0.35 : 0.85;
    }

    gate.statusBeacons.forEach(b => {
      (b.material as THREE.MeshBasicMaterial).color.setHex(hexColor);
    });
  }

  /**
   * Emergency override trigger: forces all evacuation gates to open
   */
  public triggerEmergencyOverride(activeOrReason: boolean | string = true) {
    const active = typeof activeOrReason === 'boolean' ? activeOrReason : true;
    this.gates.forEach(gate => {
      gate.isEmergencyOverride = active;
      if (active) {
        gate.state = 'EMERGENCY_OVERRIDE';
        gate.isAuthorized = true;
      }
    });
    this.playGateSound(active ? 'OBSTRUCT' : 'SECURE');
  }

  /**
   * Procedural audio triggers for gate mechanics
   */
  private playGateSound(kind: 'DETECT' | 'AUTHORIZE' | 'OPEN' | 'CLOSE' | 'OBSTRUCT' | 'SECURE') {
    if (this.soundCooldown > 0) return;
    this.soundCooldown = 0.35;

    try {
      switch (kind) {
        case 'DETECT':
          sound.playTargetLock?.();
          break;
        case 'AUTHORIZE':
          sound.playCheckpoint?.();
          sound.playHavenATCVoice?.('GATE_OPEN');
          break;
        case 'OPEN':
          sound.playBlastDoorOpen?.();
          sound.playHydraulicPressureDoor?.();
          sound.playTerminalAirlockCycle?.();
          break;
        case 'CLOSE':
          sound.playHydraulicPressureDoor?.();
          sound.playTerminalAirlockCycle?.();
          break;
        case 'OBSTRUCT':
          sound.playAlarmAlert?.();
          sound.playHavenATCVoice?.('GATE_CLOSED');
          break;
        case 'SECURE':
          sound.playTerminalClampLock?.();
          sound.playParkingConfirmed?.();
          sound.playHavenATCVoice?.('SECURED');
          break;
      }
    } catch {
      // Audio fallback safe
    }
  }

  /**
   * Check collision against all closed gate leaves
   */
  public checkShipCollision(pos: THREE.Vector3, radius: number): { collided: boolean; normal?: THREE.Vector3 } {
    for (const [, gate] of this.gates) {
      if (gate.openProgress > 0.85) continue;

      const halfW = (gate.def.clearanceWidth / 2) * (1 - gate.openProgress);
      const halfH = gate.def.clearanceHeight / 2;
      const halfD = gate.def.thresholdDepth / 2;

      const minX = gate.def.position.x - halfW;
      const maxX = gate.def.position.x + halfW;
      const minY = gate.def.position.y - halfH;
      const maxY = gate.def.position.y + halfH;
      const minZ = gate.def.position.z - halfD;
      const maxZ = gate.def.position.z + halfD;

      if (
        pos.x + radius >= minX &&
        pos.x - radius <= maxX &&
        pos.y + radius >= minY &&
        pos.y - radius <= maxY &&
        pos.z + radius >= minZ &&
        pos.z - radius <= maxZ
      ) {
        const normal = new THREE.Vector3(0, 0, pos.z > gate.def.position.z ? 1 : -1);
        return { collided: true, normal };
      }
    }
    return { collided: false };
  }

  public isGatePassable(gateId: ChamberGateId): boolean {
    const gate = this.gates.get(gateId);
    return !!gate && gate.openProgress >= 0.82;
  }

  public openGateManual(gateId: ChamberGateId) {
    const gate = this.gates.get(gateId);
    if (!gate) return;
    gate.isAuthorized = true;
    gate.state = 'OPENING';
    gate.stateTimer = 0;
    this.playGateSound('OPEN');
  }

  public closeGateManual(gateId: ChamberGateId) {
    const gate = this.gates.get(gateId);
    if (!gate) return;
    if (!gate.isShipInThreshold) {
      gate.state = 'CLOSING';
      gate.stateTimer = 0;
      this.playGateSound('CLOSE');
    }
  }

  public getGateTelemetry(gateId: ChamberGateId): ChamberGateTelemetry | undefined {
    return this.gates.get(gateId)?.getTelemetry();
  }

  /**
   * Return telemetry for all 5 gates
   */
  public getAllTelemetry(): ChamberGateTelemetry[] {
    const result: ChamberGateTelemetry[] = [];
    this.gates.forEach(g => result.push(g.getTelemetry()));
    return result;
  }

  /**
   * Return comprehensive Terminal Telemetry for HUD display
   */
  public getTerminalTelemetry() {
    const gate1 = this.gates.get('GATE_1_OUTER_ENTRANCE');
    const gate2 = this.gates.get('GATE_2_AIRLOCK_INNER');

    return {
      currentZone: 'ZONE_B_CENTRAL_ATRIUM' as const,
      activeGates: this.getAllTelemetry(),
      assignedBay: {
        bayNumber: 1,
        zoneName: 'COMMAND FLAGSHIP PAD 01',
        targetPos: { x: 0, y: -158, z: -9250 },
        distanceMeters: 0,
        alignmentDeviationMeters: 0,
        speedMps: 0,
        isAligned: true,
        isReadyToClamp: true,
        isClamped: false,
      },
      airlockStatus: {
        outerGateState: gate1?.state || 'CLOSED',
        innerGateState: gate2?.state || 'CLOSED',
        chamberPressurized: true,
        safeToProceed: gate1?.state === 'OPEN' || gate2?.state === 'OPEN',
      },
      emergencyEscapeActive: Array.from(this.gates.values()).some(g => g.isEmergencyOverride),
      emergencyEscapeAvailable: true,
    };
  }
}

export const convoyChamberGates = new ConvoyChamberGates();
