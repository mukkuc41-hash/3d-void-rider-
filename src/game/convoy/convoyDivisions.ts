/**
 * VOID-RIDER 3D — CONVOY GUARDIAN SHIP DIVISIONS & BACKUP SYSTEM
 * 
 * Master Specification:
 * - 5 Divisions: D5 Recruit → D4 Pilot → D3 Vanguard → D2 Elite → D1 Celestial
 * - Backup calling is RESTRICTED: Player can call backup ONLY from Lead Ship (Saviour) and Main Hunter (Hunters)
 * - All backup ships act differently according to division:
 *   - D5 Recruit:   SHIELD — Projects protective escort bubble, absorbs damage & restores player shield
 *   - D4 Pilot:     TEST DANGER — Forward reconnaissance probe, scans hazards, clears radar jamming & marks safe path
 *   - D3 Vanguard:  DESTROY ASTEROID — Heavy strike vessel targeting & shattering physical asteroids & space debris
 *   - D2 Elite:     DESTROY MAJOR HAZARDS — Neutralizes gravity wells, plasma crossbeams, rotating blades & energy gates
 *   - D1 Celestial: DESTROY ENEMY SPACESPACES — Divine celestial ace locking on & eliminating hostile starships
 * 
 * - 4 Cosmetic Rank Tiers:
 *   - R1–R3: Cadet (subtle rank stripes)
 *   - R4–R6: Officer (armor trim & wing chevrons)
 *   - R7–R9: Commander (dorsal fin & distinct engine trail)
 *   - R10:   Grandmaster (pulsing core crest & halo trim)
 */

import * as THREE from 'three';
import { ConvoyVariant } from './convoyTypes';

export type ConvoyDivisionId = 'D5' | 'D4' | 'D3' | 'D2' | 'D1';
export type ConvoyRankTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ConvoyDivisionDef {
  id: ConvoyDivisionId;
  name: string;
  code: string;
  tierNumber: number; // 5 down to 1
  actionRole: 'SHIELD' | 'TEST_DANGER' | 'DESTROY_ASTEROID' | 'DESTROY_MAJOR_HAZARDS' | 'DESTROY_ENEMY_SHIPS';
  actionLabel: string;
  actionSummary: string;
  actionDetails: string;
  cooldownSeconds: number;
  durationSeconds: number;
  primaryColor: string;
  accentColor: string;
  emissiveColor: string;
  badgeHex: string;
  iconSymbol: string;
}

export const CONVOY_DIVISIONS: Record<ConvoyDivisionId, ConvoyDivisionDef> = {
  D5: {
    id: 'D5',
    name: 'Recruit',
    code: 'D5-REC',
    tierNumber: 5,
    actionRole: 'SHIELD',
    actionLabel: 'ESCORT SHIELD MATRIX',
    actionSummary: 'Projects protective spherical deflector bubble & recharges player shields.',
    actionDetails: 'Escorts player closely, projects a 70m kinetic deflector bubble, absorbs incoming laser hits, and restores +300 shields.',
    cooldownSeconds: 24,
    durationSeconds: 16,
    primaryColor: '#94a3b8',
    accentColor: '#38bdf8',
    emissiveColor: '#0284c7',
    badgeHex: '#38bdf8',
    iconSymbol: '🛡️',
  },
  D4: {
    id: 'D4',
    name: 'Pilot',
    code: 'D4-PLT',
    tierNumber: 4,
    actionRole: 'TEST_DANGER',
    actionLabel: 'HAZARD RECON PROBE',
    actionSummary: 'Accelerates 700m ahead to test danger, scan minefields & reveal safe paths.',
    actionDetails: 'Surges forward along the corridor, clears radar jamming, triggers sensor sonar pulses, and marks incoming hazards in real-time.',
    cooldownSeconds: 22,
    durationSeconds: 18,
    primaryColor: '#cbd5e1',
    accentColor: '#22d3ee',
    emissiveColor: '#06b6d4',
    badgeHex: '#06b6d4',
    iconSymbol: '📡',
  },
  D3: {
    id: 'D3',
    name: 'Vanguard',
    code: 'D3-VAN',
    tierNumber: 3,
    actionRole: 'DESTROY_ASTEROID',
    actionLabel: 'ASTEROID DEMOLITION',
    actionSummary: 'Rushes incoming asteroids & debris, shattering them with heavy mining lasers.',
    actionDetails: 'Actively hunts physical asteroids and obstacles, locking on with twin high-powered plasma beams and breaking them into harmless dust.',
    cooldownSeconds: 26,
    durationSeconds: 20,
    primaryColor: '#f1f5f9',
    accentColor: '#f59e0b',
    emissiveColor: '#d97706',
    badgeHex: '#f59e0b',
    iconSymbol: '☄️',
  },
  D2: {
    id: 'D2',
    name: 'Elite',
    code: 'D2-ELT',
    tierNumber: 2,
    actionRole: 'DESTROY_MAJOR_HAZARDS',
    actionLabel: 'MAJOR HAZARD DISRUPTOR',
    actionSummary: 'Targets & neutralizes major route hazards (gravity wells, crossbeams & gates).',
    actionDetails: 'Detects major orbital hazards, gravity wells, rotating blade arrays, and singularity nodes, discharging antimatter torpedos to disable them.',
    cooldownSeconds: 30,
    durationSeconds: 22,
    primaryColor: '#e2e8f0',
    accentColor: '#c084fc',
    emissiveColor: '#9333ea',
    badgeHex: '#a855f7',
    iconSymbol: '⚡',
  },
  D1: {
    id: 'D1',
    name: 'Celestial',
    code: 'D1-CEL',
    tierNumber: 1,
    actionRole: 'DESTROY_ENEMY_SHIPS',
    actionLabel: 'CELESTIAL STRIKE ACE',
    actionSummary: 'Elite divine interceptor pursuing & annihilating hostile starships & drones.',
    actionDetails: 'Warps into sector with crown halo corona, locks on with quad celestial particle beams, and eliminates enemy pirate wings and bosses.',
    cooldownSeconds: 36,
    durationSeconds: 24,
    primaryColor: '#ffffff',
    accentColor: '#facc15',
    emissiveColor: '#38bdf8',
    badgeHex: '#eab308',
    iconSymbol: '⚔️',
  },
};

export const CONVOY_DIVISIONS_LIST: ConvoyDivisionDef[] = [
  CONVOY_DIVISIONS.D5,
  CONVOY_DIVISIONS.D4,
  CONVOY_DIVISIONS.D3,
  CONVOY_DIVISIONS.D2,
  CONVOY_DIVISIONS.D1,
];

export interface BackupShipState {
  id: string;
  name: string;
  division: ConvoyDivisionId;
  faction: ConvoyVariant;
  actionRole: 'SHIELD' | 'TEST_DANGER' | 'DESTROY_ASTEROID' | 'DESTROY_MAJOR_HAZARDS' | 'DESTROY_ENEMY_SHIPS';
  statusText: string;
  timeRemaining: number;
  totalDuration: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh?: THREE.Group;
  shieldMesh?: THREE.Mesh;
  reconPulseTimer?: number;
  targetId?: string;
  targetName?: string;
  targetPos?: THREE.Vector3;
  laserCooldown: number;
  isAlive: boolean;
}

export interface BackupCallTelemetry {
  isEligibleLeader: boolean; // Only true if player is Lead Ship Saviour or Hunter Main Hunter
  eligibleReason?: string;
  leaderTitle: string;
  activeBackup: {
    active: boolean;
    division: ConvoyDivisionId;
    divisionName: string;
    actionLabel: string;
    statusText: string;
    timeRemaining: number;
    totalDuration: number;
    progressPercent: number;
    targetName?: string;
  } | null;
  divisionCooldowns: Record<ConvoyDivisionId, number>;
  selectedDivision: ConvoyDivisionId;
}

/**
 * Checks whether the player's selected vessel has authority to call backup.
 * STRICT RULE: Only Lead Ship (Saviour) and Main Hunter (Hunters) have command clearance.
 */
export function checkBackupEligibility(
  faction: ConvoyVariant,
  shipId: string,
  role?: string,
  isLead?: boolean
): { eligible: boolean; leaderTitle: string; reason: string } {
  const normFaction = faction === 'HUNTERS' || faction === 'HUNTER' ? 'HUNTERS' : 'SAVIOUR';

  if (normFaction === 'SAVIOUR') {
    const isSaviourLead =
      isLead === true ||
      shipId === 'saviour_aegis' ||
      role === 'LEAD_GUARD' ||
      role === 'LEAD';

    if (isSaviourLead) {
      return {
        eligible: true,
        leaderTitle: 'SAVIOUR CONVOY FLAGSHIP (LEAD SHIP)',
        reason: 'Command clearance granted: Fleet Flagship authority active.',
      };
    }

    return {
      eligible: false,
      leaderTitle: 'ESCORT / SUPPORT VESSEL',
      reason: 'Backup authorization restricted to Saviour Lead Ship (AEGIS). Escort and cargo vessels cannot summon backup.',
    };
  }

  // HUNTERS FACTION
  const isMainHunter = shipId === 'hunter_fang' || role === 'MAIN_HUNTER';

  if (isMainHunter) {
    return {
      eligible: true,
      leaderTitle: 'HUNTER PACK ALPHA (MAIN HUNTER)',
      reason: 'Command clearance granted: Main Hunter strike leader authority active.',
    };
  }

  return {
    eligible: false,
    leaderTitle: 'SECONDARY HUNTER / FLANKER',
    reason: 'Backup authorization restricted to Main Hunter (FANG). Mid Hunters and support craft cannot summon backup.',
  };
}

/**
 * Cosmetic Rank details
 */
export function getRankCosmeticTier(rank: number = 1): {
  tierName: 'Cadet' | 'Officer' | 'Commander' | 'Grandmaster';
  rankNumber: number;
  badgeLabel: string;
  accentColor: string;
} {
  const clamped = Math.max(1, Math.min(10, Math.round(rank)));
  if (clamped <= 3) {
    return { tierName: 'Cadet', rankNumber: clamped, badgeLabel: `R${clamped} CADET`, accentColor: '#38bdf8' };
  } else if (clamped <= 6) {
    return { tierName: 'Officer', rankNumber: clamped, badgeLabel: `R${clamped} OFFICER`, accentColor: '#22d3ee' };
  } else if (clamped <= 9) {
    return { tierName: 'Commander', rankNumber: clamped, badgeLabel: `R${clamped} COMMANDER`, accentColor: '#a855f7' };
  } else {
    return { tierName: 'Grandmaster', rankNumber: 10, badgeLabel: 'R10 GRANDMASTER', accentColor: '#f59e0b' };
  }
}
