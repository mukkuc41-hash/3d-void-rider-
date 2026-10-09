import * as THREE from 'three';
import { GameMode } from '../../types';
import { sound } from '../audio';
import {
  ModeEventDefinition,
  LiveModeEventState,
} from './ModeEventTypes';
import { MODE_EVENT_CATALOG } from './ModeEventCatalog';

export interface ModeEventUpdateResult {
  speedDeltaKmH: number;
  damageDelta: number;
  heatDelta: number;
  timeBonusMs: number;
  activeWarningText: string | null;
  activeWarningColor: string;
  activeEventTitle: string | null;
  activeEventSubtitle: string | null;
  cameraShake: number;
  currentEventProgress: number; // 0 to 1
}

export class ModeEventManager {
  private scene: THREE.Scene;
  public eventGroup: THREE.Group;
  public activeMode: GameMode | null = null;
  public liveEvents: LiveModeEventState[] = [];
  private trackCurve: THREE.Curve<THREE.Vector3> | null = null;
  private totalElapsedSec = 0;

  // Active HUD Telemetry
  public currentAlertText: string | null = null;
  public currentAlertColor: string = '#00f0ff';
  public currentAlertTitle: string | null = null;
  public currentAlertSubtitle: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.eventGroup = new THREE.Group();
    this.eventGroup.name = 'mode_event_objects_group';
    this.scene.add(this.eventGroup);
  }

  public initMode(mode: GameMode, curve: THREE.Curve<THREE.Vector3> | null): void {
    this.cleanup();
    this.activeMode = mode;
    this.trackCurve = curve;
    this.totalElapsedSec = 0;

    // Mode 01 and Mode 21 are protected modes with their own standalone catastrophe systems
    if (mode === 'SINGULARITY_RUN' || mode === 'BLACK_HOLE') {
      return;
    }

    const defs = MODE_EVENT_CATALOG[mode] || [];
    this.liveEvents = defs.map(def => ({
      definition: def,
      state: 'INACTIVE',
      elapsedInState: 0,
      triggered: false,
      consequenceApplied: false,
    }));

    if (curve && this.liveEvents.length > 0) {
      this.buildEventWorldVisuals(curve);
    }
  }

  /**
   * Builds distinct 3D visual anchors for each mode event
   */
  private buildEventWorldVisuals(curve: THREE.Curve<THREE.Vector3>): void {
    for (const live of this.liveEvents) {
      const def = live.definition;
      if (!def.trigger.splineWindow) continue;

      const midT = (def.trigger.splineWindow[0] + def.trigger.splineWindow[1]) * 0.5;
      const pt = curve.getPointAt(midT);
      const tan = curve.getTangentAt(midT).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const group = new THREE.Group();
      group.name = `event_obj_${def.id}`;
      group.position.copy(pt);
      group.lookAt(pt.clone().add(tan));

      const col = new THREE.Color(def.themeColor);

      // Custom 3D structure per consequence type
      switch (def.consequenceType) {
        case 'SPEED_BOOST': {
          // Dual emerald/cyan acceleration chevron pylons
          const pylonGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
          const pylonMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: col,
            emissiveIntensity: 1.5,
          });
          const leftP = new THREE.Mesh(pylonGeo, pylonMat);
          leftP.position.set(-10, 6, 0);
          const rightP = new THREE.Mesh(pylonGeo, pylonMat);
          rightP.position.set(10, 6, 0);

          const chevronGeo = new THREE.TorusGeometry(8, 0.35, 8, 16, Math.PI);
          const chevron = new THREE.Mesh(chevronGeo, pylonMat);
          chevron.position.set(0, 7, 0);
          chevron.rotation.x = Math.PI / 2;

          group.add(leftP, rightP, chevron);
          break;
        }

        case 'LANE_CLOSURE': {
          // Hazard barrier across left lane
          const barrierGeo = new THREE.BoxGeometry(10, 3, 0.8);
          const barrierMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            emissive: col,
            emissiveIntensity: 2.0,
          });
          const barrier = new THREE.Mesh(barrierGeo, barrierMat);
          barrier.position.set(-6, 2.5, 0);
          group.add(barrier);
          break;
        }

        case 'DRONE_INTERCEPT': {
          // Floating traffic drone
          const droneGeo = new THREE.OctahedronGeometry(2.5, 0);
          const droneMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: col,
            emissiveIntensity: 2.2,
          });
          const drone = new THREE.Mesh(droneGeo, droneMat);
          drone.position.set(0, 4.5, 0);
          group.add(drone);
          break;
        }

        case 'ELECTRICAL_DISCHARGE': {
          // High-voltage lightning conductor pylons
          const coilGeo = new THREE.CylinderGeometry(0.6, 1.2, 14, 8);
          const coilMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: col,
            emissiveIntensity: 2.0,
          });
          const coilL = new THREE.Mesh(coilGeo, coilMat);
          coilL.position.set(-11, 7, 0);
          const coilR = new THREE.Mesh(coilGeo, coilMat);
          coilR.position.set(11, 7, 0);
          group.add(coilL, coilR);
          break;
        }

        case 'HEAT_INCREASE':
        case 'HEAT_DISSIPATE': {
          // Coronal flare deflector arch
          const archGeo = new THREE.TorusGeometry(12, 0.6, 8, 24, Math.PI);
          const archMat = new THREE.MeshStandardMaterial({
            color: 0x1e1b4b,
            emissive: col,
            emissiveIntensity: 1.8,
          });
          const arch = new THREE.Mesh(archGeo, archMat);
          arch.position.set(0, 6, 0);
          arch.rotation.z = Math.PI;
          group.add(arch);
          break;
        }

        case 'TIME_BONUS':
        case 'TIME_SPLIT_EVALUATION': {
          // Holographic chrono ring
          const ringGeo = new THREE.TorusGeometry(7, 0.35, 12, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.85,
            wireframe: true,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.set(0, 4.5, 0);
          group.add(ring);
          break;
        }

        default: {
          // General floating beacon
          const beaconGeo = new THREE.DodecahedronGeometry(2.0);
          const beaconMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: col,
            emissiveIntensity: 1.5,
          });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(0, 5, 0);
          group.add(beacon);
          break;
        }
      }

      this.eventGroup.add(group);
      live.meshGroup = group;
    }
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeedKmH: number,
    splineT: number,
    lateralOffset: number,
    currentLap: number,
    isBoosting: boolean,
    isDrifting: boolean
  ): ModeEventUpdateResult {
    this.totalElapsedSec += dt;

    let totalSpeedDelta = 0;
    let totalDamage = 0;
    let totalHeat = 0;
    let totalTimeBonus = 0;
    let cameraShake = 0;

    let topAlertText: string | null = null;
    let topAlertColor: string = '#00f0ff';
    let topAlertTitle: string | null = null;
    let topAlertSubtitle: string | null = null;
    let topProgress = 0;

    for (const live of this.liveEvents) {
      const def = live.definition;
      live.elapsedInState += dt;

      // Animate mesh if present
      if (live.meshGroup) {
        live.meshGroup.rotation.y += dt * 0.5;
        // Pulse scale when active
        if (live.state === 'ACTIVE' || live.state === 'WARNING') {
          const s = 1.0 + Math.sin(this.totalElapsedSec * 8) * 0.08;
          live.meshGroup.scale.set(s, s, s);
        } else {
          live.meshGroup.scale.set(1, 1, 1);
        }
      }

      // STATE MACHINE: INACTIVE -> WARNING -> ACTIVE -> CONSEQUENCE -> RESOLUTION -> CLEANUP
      switch (live.state) {
        case 'INACTIVE': {
          const triggered = this.checkTrigger(
            def.trigger,
            this.totalElapsedSec,
            splineT,
            currentLap,
            playerSpeedKmH,
            lateralOffset
          );

          if (triggered) {
            live.triggered = true;
            live.elapsedInState = 0;
            live.consequenceApplied = false;

            if (def.warningDurationSec > 0) {
              live.state = 'WARNING';
              this.playAudio(def.warningAudioKey);
            } else {
              live.state = 'ACTIVE';
              this.playAudio(def.activeAudioKey);
            }
          }
          break;
        }

        case 'WARNING': {
          topAlertText = def.warningText;
          topAlertColor = '#f59e0b';
          topAlertTitle = def.name;
          topAlertSubtitle = def.subtitle;
          topProgress = Math.min(1.0, live.elapsedInState / def.warningDurationSec);

          if (live.elapsedInState >= def.warningDurationSec) {
            live.state = 'ACTIVE';
            live.elapsedInState = 0;
            this.playAudio(def.activeAudioKey);
          }
          break;
        }

        case 'ACTIVE': {
          topAlertText = def.activeText;
          topAlertColor = def.themeColor;
          topAlertTitle = def.name;
          topAlertSubtitle = def.subtitle;
          topProgress = Math.min(1.0, live.elapsedInState / def.activeDurationSec);

          // Apply physical consequence during active window
          if (!live.consequenceApplied) {
            live.consequenceApplied = true;
            live.state = 'CONSEQUENCE';
            live.elapsedInState = 0;

            const cons = this.applyConsequence(
              def,
              lateralOffset,
              isBoosting,
              isDrifting,
              playerSpeedKmH
            );
            totalSpeedDelta += cons.speedDelta;
            totalDamage += cons.damage;
            totalHeat += cons.heat;
            totalTimeBonus += cons.timeBonus;
            cameraShake += cons.shake;
          }

          if (live.elapsedInState >= def.activeDurationSec) {
            live.state = 'RESOLUTION';
            live.elapsedInState = 0;
          }
          break;
        }

        case 'CONSEQUENCE': {
          topAlertText = def.consequenceText || def.activeText;
          topAlertColor = def.themeColor;
          topAlertTitle = def.name;
          topAlertSubtitle = def.subtitle;

          if (live.elapsedInState >= def.consequenceDurationSec) {
            live.state = 'RESOLUTION';
            live.elapsedInState = 0;
          }
          break;
        }

        case 'RESOLUTION': {
          if (live.elapsedInState >= 1.5) {
            live.state = def.isRepeatable ? 'INACTIVE' : 'CLEANUP';
            live.elapsedInState = 0;
            live.triggered = false;
            live.consequenceApplied = false;
          }
          break;
        }

        case 'CLEANUP': {
          // Event fully spent for this race
          break;
        }
      }
    }

    this.currentAlertText = topAlertText;
    this.currentAlertColor = topAlertColor;
    this.currentAlertTitle = topAlertTitle;
    this.currentAlertSubtitle = topAlertSubtitle;

    return {
      speedDeltaKmH: totalSpeedDelta,
      damageDelta: totalDamage,
      heatDelta: totalHeat,
      timeBonusMs: totalTimeBonus,
      activeWarningText: topAlertText,
      activeWarningColor: topAlertColor,
      activeEventTitle: topAlertTitle,
      activeEventSubtitle: topAlertSubtitle,
      cameraShake,
      currentEventProgress: topProgress,
    };
  }

  private checkTrigger(
    trigger: ModeEventDefinition['trigger'],
    elapsedSec: number,
    splineT: number,
    lap: number,
    speedKmH: number,
    lateralOffset: number
  ): boolean {
    switch (trigger.type) {
      case 'SPLINE_PROGRESS': {
        if (!trigger.splineWindow) return false;
        const [minT, maxT] = trigger.splineWindow;
        return splineT >= minT && splineT <= maxT;
      }

      case 'ELAPSED_TIME': {
        return trigger.timeSec !== undefined && elapsedSec >= trigger.timeSec;
      }

      case 'LAP_REACHED': {
        return trigger.lap !== undefined && lap >= trigger.lap;
      }

      case 'SPEED_THRESHOLD': {
        if (trigger.speedKmH === undefined) return false;
        return trigger.speedComparison === 'BELOW'
          ? speedKmH < trigger.speedKmH
          : speedKmH >= trigger.speedKmH;
      }

      default:
        return false;
    }
  }

  private applyConsequence(
    def: ModeEventDefinition,
    lateralOffset: number,
    isBoosting: boolean,
    isDrifting: boolean,
    speedKmH: number
  ): { speedDelta: number; damage: number; heat: number; timeBonus: number; shake: number } {
    let speedDelta = 0;
    let damage = 0;
    let heat = 0;
    let timeBonus = 0;
    let shake = 0;

    const inLeft = lateralOffset < -3.5;
    const inRight = lateralOffset > 3.5;
    const inCenter = !inLeft && !inRight;

    switch (def.consequenceType) {
      case 'SPEED_BOOST': {
        speedDelta = def.consequenceValue;
        shake = 0.25;
        break;
      }

      case 'SPEED_PENALTY': {
        speedDelta = -def.consequenceValue;
        damage = 10;
        shake = 0.45;
        break;
      }

      case 'LANE_CLOSURE': {
        // Penalty if player is in closed lane
        if ((def.safeLane === 'RIGHT' && inLeft) || (def.safeLane === 'LEFT' && inRight)) {
          speedDelta = -def.consequenceValue;
          damage = 15;
          shake = 0.5;
          sound.playCollision();
        } else {
          // Clean avoidance reward
          speedDelta = 15;
        }
        break;
      }

      case 'HEAT_INCREASE': {
        heat = def.consequenceValue;
        damage = 5;
        shake = 0.2;
        break;
      }

      case 'HEAT_DISSIPATE': {
        heat = -def.consequenceValue;
        speedDelta = 20;
        break;
      }

      case 'ELECTRICAL_DISCHARGE': {
        if (!inCenter) {
          speedDelta = -def.consequenceValue;
          damage = 20;
          shake = 0.6;
          sound.playCollision();
        } else {
          speedDelta = 25;
        }
        break;
      }

      case 'DEBRIS_SWARM': {
        if (isDrifting || isBoosting) {
          speedDelta = 15; // Clean evasion
        } else {
          speedDelta = -def.consequenceValue;
          damage = 15;
          shake = 0.4;
        }
        break;
      }

      case 'PORTAL_TRANSITION': {
        speedDelta = def.consequenceValue;
        shake = 0.35;
        break;
      }

      case 'ZERO_G_FLUX': {
        speedDelta = def.consequenceValue;
        break;
      }

      case 'TIME_BONUS': {
        timeBonus = def.consequenceValue; // negative ms
        speedDelta = 20;
        break;
      }

      case 'TIME_SPLIT_EVALUATION': {
        timeBonus = def.consequenceValue;
        break;
      }

      case 'DRONE_INTERCEPT': {
        if (inCenter) {
          speedDelta = 20;
        } else {
          speedDelta = -def.consequenceValue;
          damage = 12;
          shake = 0.35;
        }
        break;
      }

      case 'LIGHTING_ESCALATION': {
        speedDelta = def.consequenceValue;
        break;
      }
    }

    return { speedDelta, damage, heat, timeBonus, shake };
  }

  private playAudio(key?: string): void {
    if (!key) return;
    switch (key) {
      case 'WARNING':
      case 'ALARM':
        sound.playAlarmAlert();
        break;
      case 'ENERGY_CHARGE':
      case 'BOOST':
        sound.playBoostPad();
        break;
      case 'IMPACT':
      case 'EXPLOSION':
        sound.playCrash();
        break;
      case 'SUCCESS':
      case 'CHECKPOINT':
        sound.playCheckpoint();
        break;
    }
  }

  public cleanup(): void {
    while (this.eventGroup.children.length > 0) {
      const child = this.eventGroup.children[0];
      this.eventGroup.remove(child);
      child.traverse(c => {
        if (c instanceof THREE.Mesh) {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
            else c.material.dispose();
          }
        }
      });
    }
    this.liveEvents = [];
    this.currentAlertText = null;
    this.currentAlertTitle = null;
    this.currentAlertSubtitle = null;
    this.totalElapsedSec = 0;
  }

  public dispose(): void {
    this.cleanup();
    if (this.eventGroup.parent) {
      this.eventGroup.removeFromParent();
    }
  }
}
