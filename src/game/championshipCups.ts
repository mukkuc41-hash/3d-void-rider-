/**
 * Galactic Championship Cups Tournament System for Void-Rider 3D
 * Manages tiered cup tournaments, driver standings, AI rivals, points progression, and trophy unlocks.
 */
import {
  ChampionshipCupConfig,
  ChampionshipCupId,
  ChampionshipSaveState,
  ChampionshipStanding,
} from '../types';

export const CHAMPIONSHIP_CUPS: ChampionshipCupConfig[] = [
  {
    id: 'BRONZE_COMET',
    name: 'BRONZE COMET CUP',
    description: 'Entry-tier high-velocity proving grounds through planetary orbital circuits.',
    trophyColor: '#cd7f32',
    requiredLevel: 1,
    rewardCredits: 3500,
    stages: [
      { trackId: 'circuit_alpha', trackName: 'Alpha Speedway', laps: 2, biome: 'Deep Space', hazardLevel: 'LOW' },
      { trackId: 'neon_orbit', trackName: 'Neon Stratosphere', laps: 2, biome: 'Megacity', hazardLevel: 'LOW' },
      { trackId: 'asteroid_run', trackName: 'Belt of Ceres', laps: 3, biome: 'Asteroid Belt', hazardLevel: 'MEDIUM' },
    ],
  },
  {
    id: 'SILVER_NEBULA',
    name: 'SILVER NEBULA CUP',
    description: 'Technical mid-tier gauntlet with high-G corkscrews and ion nebulae.',
    trophyColor: '#94a3b8',
    requiredLevel: 3,
    rewardCredits: 6000,
    stages: [
      { trackId: 'nebula_rift', trackName: 'Orion Rift Corridor', laps: 3, biome: 'Ion Nebula', hazardLevel: 'MEDIUM' },
      { trackId: 'quantum_highway', trackName: 'Quantum Hyper-Spur', laps: 3, biome: 'Quantum Tunnels', hazardLevel: 'MEDIUM' },
      { trackId: 'cosmic_ring', trackName: 'Titan Ring Accelerators', laps: 3, biome: 'Gas Giant Rings', hazardLevel: 'HIGH' },
      { trackId: 'neon_orbit', trackName: 'Neo Tokyo Apex', laps: 3, biome: 'Cyber Megacity', hazardLevel: 'HIGH' },
    ],
  },
  {
    id: 'GOLD_PULSAR',
    name: 'GOLD PULSAR CUP',
    description: 'Hazard-dense expert tournament through radiation storms and dense asteroid belts.',
    trophyColor: '#fbbf24',
    requiredLevel: 5,
    rewardCredits: 12000,
    stages: [
      { trackId: 'asteroid_run', trackName: 'Kuiper Belt Chaos', laps: 3, biome: 'Deep Asteroids', hazardLevel: 'HIGH' },
      { trackId: 'void_rift', trackName: 'Event Perimeter', laps: 3, biome: 'Void Core', hazardLevel: 'HIGH' },
      { trackId: 'quantum_highway', trackName: 'Tachyon Overpass', laps: 3, biome: 'Tachyon Stream', hazardLevel: 'EXTREME' },
      { trackId: 'cosmic_ring', trackName: 'Saturnian Orbital Fall', laps: 4, biome: 'Extreme Gravity', hazardLevel: 'EXTREME' },
    ],
  },
  {
    id: 'VOID_SINGULARITY',
    name: 'VOID SINGULARITY CUP',
    description: 'The pinnacle tournament: 5 grueling stages held under gravitational event horizon collapse.',
    trophyColor: '#a855f7',
    requiredLevel: 8,
    rewardCredits: 25000,
    stages: [
      { trackId: 'circuit_alpha', trackName: 'Proving Ground Singularity', laps: 3, biome: 'Event Horizon', hazardLevel: 'HIGH' },
      { trackId: 'nebula_rift', trackName: 'Nebular Collapse Pass', laps: 3, biome: 'Dark Nebula', hazardLevel: 'EXTREME' },
      { trackId: 'asteroid_run', trackName: 'Spaghettified Asteroids', laps: 4, biome: 'Tidal Shredder', hazardLevel: 'EXTREME' },
      { trackId: 'void_rift', trackName: 'Point of No Return', laps: 4, biome: 'Singularity Edge', hazardLevel: 'EXTREME' },
      { trackId: 'quantum_highway', trackName: 'Final Escape Velocity', laps: 4, biome: 'Void Core', hazardLevel: 'EXTREME' },
    ],
  },
];

const AI_RIVALS: { pilotId: string; name: string; shipName: string; shipId: string }[] = [
  { pilotId: 'rival_nyx', name: 'Nyx Shadow', shipName: 'Black Phoenix', shipId: 'black_phoenix' },
  { pilotId: 'rival_lyra', name: 'Lyra Vance', shipName: 'Nebula Dart', shipId: 'nebula_dart' },
  { pilotId: 'rival_orion', name: 'Orion Drake', shipName: 'Solar Wing', shipId: 'solar_wing' },
  { pilotId: 'rival_kaelen', name: 'Kaelen Voss', shipName: 'Aegis Cruiser', shipId: 'aegis_cruiser' },
  { pilotId: 'rival_marcus', name: 'Marcus Vega', shipName: 'Cyber Phantom', shipId: 'cyber_phantom' },
  { pilotId: 'rival_rex', name: 'Rex Thorne', shipName: 'Void Stalker', shipId: 'void_stalker' },
];

const POINTS_LADDER = [25, 18, 15, 12, 10, 8, 6, 4];
const STORAGE_KEY = 'void_rider_championship_state';

export class ChampionshipCupsManager {
  private currentState: ChampionshipSaveState | null = null;

  constructor() {
    this.loadState();
  }

  public getActiveCup(): ChampionshipCupConfig | null {
    if (!this.currentState) return null;
    return CHAMPIONSHIP_CUPS.find((c) => c.id === this.currentState!.cupId) || null;
  }

  public getState(): ChampionshipSaveState | null {
    return this.currentState;
  }

  public startCup(cupId: ChampionshipCupId, playerName: string, playerShipId: string, playerShipName: string) {
    const cup = CHAMPIONSHIP_CUPS.find((c) => c.id === cupId);
    if (!cup) return;

    const standings: ChampionshipStanding[] = [
      {
        pilotId: 'player',
        name: playerName,
        shipName: playerShipName,
        shipId: playerShipId,
        points: 0,
        isPlayer: true,
        wins: 0,
        podiums: 0,
      },
      ...AI_RIVALS.map((r) => ({
        pilotId: r.pilotId,
        name: r.name,
        shipName: r.shipName,
        shipId: r.shipId,
        points: 0,
        isPlayer: false,
        wins: 0,
        podiums: 0,
      })),
    ];

    this.currentState = {
      cupId,
      currentStageIndex: 0,
      standings,
      isCompleted: false,
      playerRank: 1,
    };
    this.saveState();
  }

  public recordStageFinish(playerFinishPosition: number): {
    stageFinished: number;
    totalStages: number;
    isCupComplete: boolean;
    creditsEarned: number;
  } {
    if (!this.currentState) {
      return { stageFinished: 0, totalStages: 0, isCupComplete: false, creditsEarned: 0 };
    }

    const cup = this.getActiveCup();
    if (!cup) {
      return { stageFinished: 0, totalStages: 0, isCupComplete: false, creditsEarned: 0 };
    }

    // Award player points
    const pPoints = POINTS_LADDER[Math.min(playerFinishPosition - 1, POINTS_LADDER.length - 1)] || 4;
    const playerStanding = this.currentState.standings.find((s) => s.isPlayer);
    if (playerStanding) {
      playerStanding.points += pPoints;
      if (playerFinishPosition === 1) playerStanding.wins++;
      if (playerFinishPosition <= 3) playerStanding.podiums++;
    }

    // Simulate AI rival points with realistic dispersion
    const aiStandings = this.currentState.standings.filter((s) => !s.isPlayer);
    // Shuffle finishes around player position
    const availablePositions = [1, 2, 3, 4, 5, 6, 7].filter((pos) => pos !== playerFinishPosition);
    aiStandings.forEach((ai, idx) => {
      const pos = availablePositions[idx] || (idx + 2);
      const pts = POINTS_LADDER[Math.min(pos - 1, POINTS_LADDER.length - 1)] || 4;
      ai.points += pts;
      if (pos === 1) ai.wins++;
      if (pos <= 3) ai.podiums++;
    });

    // Re-sort standings by points descending
    this.currentState.standings.sort((a, b) => b.points - a.points);
    const pRank = this.currentState.standings.findIndex((s) => s.isPlayer) + 1;
    this.currentState.playerRank = pRank;

    const currentStage = this.currentState.currentStageIndex;
    const isCupComplete = currentStage + 1 >= cup.stages.length;

    let creditsEarned = Math.round(pPoints * 60);

    if (isCupComplete) {
      this.currentState.isCompleted = true;
      if (pRank === 1) creditsEarned += cup.rewardCredits;
      else if (pRank === 2) creditsEarned += Math.round(cup.rewardCredits * 0.6);
      else if (pRank === 3) creditsEarned += Math.round(cup.rewardCredits * 0.35);
    } else {
      this.currentState.currentStageIndex++;
    }

    this.saveState();

    return {
      stageFinished: currentStage + 1,
      totalStages: cup.stages.length,
      isCupComplete,
      creditsEarned,
    };
  }

  public abandonCup() {
    this.currentState = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  private saveState() {
    try {
      if (this.currentState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentState));
      }
    } catch {}
  }

  private loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.currentState = JSON.parse(raw);
      }
    } catch {
      this.currentState = null;
    }
  }
}

export const championshipCups = new ChampionshipCupsManager();
