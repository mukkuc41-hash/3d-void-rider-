import * as THREE from 'three';
import { GameMode } from '../../types';

export type ModeEventLifecycleState =
  | 'INACTIVE'
  | 'WARNING'
  | 'ACTIVE'
  | 'CONSEQUENCE'
  | 'RESOLUTION'
  | 'CLEANUP';

export type ModeEventTriggerType =
  | 'ELAPSED_TIME'
  | 'SPLINE_PROGRESS'
  | 'LAP_REACHED'
  | 'COLLISION'
  | 'SPEED_THRESHOLD'
  | 'CHECKPOINT_GATE'
  | 'SHORTCUT_ENTERED';

export type ModeEventConsequenceType =
  | 'SPEED_BOOST'
  | 'SPEED_PENALTY'
  | 'LANE_CLOSURE'
  | 'HEAT_INCREASE'
  | 'HEAT_DISSIPATE'
  | 'ELECTRICAL_DISCHARGE'
  | 'DEBRIS_SWARM'
  | 'PORTAL_TRANSITION'
  | 'ZERO_G_FLUX'
  | 'TIME_SPLIT_EVALUATION'
  | 'TIME_BONUS'
  | 'DRONE_INTERCEPT'
  | 'LIGHTING_ESCALATION';

export interface ModeEventTriggerCondition {
  type: ModeEventTriggerType;
  /** Start time in seconds since race start */
  timeSec?: number;
  /** Spline progress window [minT, maxT] */
  splineWindow?: [number, number];
  /** Specific lap index */
  lap?: number;
  /** Speed threshold in km/h */
  speedKmH?: number;
  speedComparison?: 'ABOVE' | 'BELOW';
  /** Checkpoint index */
  checkpointIndex?: number;
  /** Requires player within lateral lane */
  lane?: 'LEFT' | 'CENTER' | 'RIGHT';
}

export interface ModeEventDefinition {
  id: string;
  modeId: GameMode;
  name: string;
  subtitle: string;
  description: string;
  
  trigger: ModeEventTriggerCondition;
  warningDurationSec: number;
  activeDurationSec: number;
  consequenceDurationSec: number;
  
  consequenceType: ModeEventConsequenceType;
  consequenceValue: number; // e.g. damage, speed delta km/h, heat %, time bonus ms
  
  warningText: string;
  activeText: string;
  consequenceText?: string;
  
  warningAudioKey?: 'WARNING' | 'ALARM' | 'CHECKPOINT' | 'ENERGY_CHARGE' | 'EXPLOSION';
  activeAudioKey?: 'BOOST' | 'LIGHTNING' | 'IMPACT' | 'PORTAL' | 'SUCCESS' | 'EXPLOSION';
  
  themeColor: string;
  safeLane?: 'LEFT' | 'CENTER' | 'RIGHT' | 'ELEVATED' | 'SHELTER';
  hazardLocation?: [number, number, number]; // World/relative position
  isRepeatable?: boolean;
}

export interface LiveModeEventState {
  definition: ModeEventDefinition;
  state: ModeEventLifecycleState;
  elapsedInState: number;
  triggered: boolean;
  consequenceApplied: boolean;
  meshGroup?: THREE.Group;
}
