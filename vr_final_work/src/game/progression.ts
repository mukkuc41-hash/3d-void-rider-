import {
  PlayerProfile,
  Mission,
  AchievementBadge,
  LeaderboardEntry,
  TrackId,
  GameMode,
} from '../types';

const PROFILE_KEY = 'void_pilot_profile_v2';
const LEADERBOARD_KEY = 'void_pilot_leaderboard_v2';

export const INITIAL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'first_race',
    title: 'First Orbit',
    description: 'Complete your first race across the cosmic circuits.',
    unlocked: false,
    icon: 'Flag',
  },
  {
    id: 'mach_speed',
    title: 'Warp Velocity',
    description: 'Reach a blistering speed of 300+ km/h.',
    unlocked: false,
    icon: 'Zap',
  },
  {
    id: 'clean_finish',
    title: 'Untouchable',
    description: 'Finish an entire circuit without sustaining hull damage.',
    unlocked: false,
    icon: 'Shield',
  },
  {
    id: 'boost_master',
    title: 'Overcharged',
    description: 'Ignite nitro boost 15 times in a single event.',
    unlocked: false,
    icon: 'Flame',
  },
  {
    id: 'circuit_champion',
    title: 'Apex Victor',
    description: 'Claim 1st place in a standard championship race.',
    unlocked: false,
    icon: 'Trophy',
  },
  {
    id: 'survival_master',
    title: 'Void Survivor',
    description: 'Survive at least 60 seconds against high-density hazard waves.',
    unlocked: false,
    icon: 'Radio',
  },
  {
    id: 'duel_master',
    title: 'Duelist Prime',
    description: 'Defeat a rival ace pilot in a 1v1 duel.',
    unlocked: false,
    icon: 'Crosshair',
  },
  {
    id: 'ship_collector',
    title: 'Fleet Commander',
    description: 'Unlock and equip 3 distinct spacecraft classes.',
    unlocked: false,
    icon: 'Layers',
  },
];

export const INITIAL_DAILY_MISSIONS: Mission[] = [
  {
    id: 'daily_races',
    title: 'Circuit Regular',
    description: 'Complete 3 races across any cosmic track.',
    category: 'DAILY',
    rewardCredits: 600,
    rewardXP: 450,
    progress: 0,
    target: 3,
    completed: false,
    claimed: false,
    icon: 'Flag',
  },
  {
    id: 'daily_clean',
    title: 'Pristine Vector',
    description: 'Finish a race without crashing into asteroids or barriers.',
    category: 'DAILY',
    rewardCredits: 750,
    rewardXP: 600,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    icon: 'Shield',
  },
  {
    id: 'daily_boost',
    title: 'Hyper Boost Cadence',
    description: 'Use nitro boost 10 times in races.',
    category: 'DAILY',
    rewardCredits: 500,
    rewardXP: 350,
    progress: 0,
    target: 10,
    completed: false,
    claimed: false,
    icon: 'Flame',
  },
  {
    id: 'daily_overtake',
    title: 'Draft & Overtake',
    description: 'Pass 5 opponents during races.',
    category: 'DAILY',
    rewardCredits: 800,
    rewardXP: 700,
    progress: 0,
    target: 5,
    completed: false,
    claimed: false,
    icon: 'Users',
  },
  {
    id: 'daily_neon_orbit',
    title: 'Neon Orbit Mastery',
    description: 'Complete a race on the Neon Orbit hyper-ring.',
    category: 'DAILY',
    rewardCredits: 650,
    rewardXP: 500,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    icon: 'Zap',
  },
  {
    id: 'daily_target_time',
    title: 'Sub-Minute Split',
    description: 'Finish a lap in under 55.000s in Time Trial or Race.',
    category: 'DAILY',
    rewardCredits: 900,
    rewardXP: 800,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    icon: 'Timer',
  },
];

export const INITIAL_WEEKLY_MISSIONS: Mission[] = [
  {
    id: 'weekly_podiums',
    title: 'Podium Dominance',
    description: 'Finish in the top 3 across 7 races.',
    category: 'WEEKLY',
    rewardCredits: 2400,
    rewardXP: 2000,
    progress: 0,
    target: 7,
    completed: false,
    claimed: false,
    icon: 'Trophy',
  },
  {
    id: 'weekly_survival',
    title: 'Cosmic Endurance',
    description: 'Accumulate 180 seconds in Survival Mode.',
    category: 'WEEKLY',
    rewardCredits: 2800,
    rewardXP: 2500,
    progress: 0,
    target: 180,
    completed: false,
    claimed: false,
    icon: 'Radio',
  },
  {
    id: 'weekly_credits',
    title: 'Mining Fleet',
    description: 'Earn or collect 3,000 total credits.',
    category: 'WEEKLY',
    rewardCredits: 3500,
    rewardXP: 3000,
    progress: 0,
    target: 3000,
    completed: false,
    claimed: false,
    icon: 'Coins',
  },
];

class ProgressionManager {
  private profile: PlayerProfile;
  private dailyMissions: Mission[] = [];
  private weeklyMissions: Mission[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.profile = this.loadProfile();
    this.initMissions();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private loadProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          callsign: parsed.callsign || localStorage.getItem('void_pilot_callsign') || 'PILOT-01',
          avatarIcon: parsed.avatarIcon || 'Shield',
          level: parsed.level || 1,
          xp: parsed.xp || 0,
          nextLevelXp: parsed.nextLevelXp || 1000,
          credits: typeof parsed.credits === 'number' ? parsed.credits : 1500,
          faction: parsed.faction || 'APEX_SYNDICATE',
          totalRaces: parsed.totalRaces || 0,
          wins: parsed.wins || 0,
          podiums: parsed.podiums || 0,
          cleanRaces: parsed.cleanRaces || 0,
          favoriteTrack: parsed.favoriteTrack || 'neon_orbit',
          bestTimes: parsed.bestTimes || {},
          survivalRecordSec: parsed.survivalRecordSec || 0,
          unlockedShips: parsed.unlockedShips || ['apex_phantom', 'vortex_nemesis', 'solaris_stinger'],
          unlockedSkins: parsed.unlockedSkins || ['cyber_stealth'],
          unlockedDecals: parsed.unlockedDecals || ['none'],
          currentWinStreak: parsed.currentWinStreak || 0,
          highestWinStreak: parsed.highestWinStreak || 0,
          achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
        };
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }

    return {
      callsign: localStorage.getItem('void_pilot_callsign') || 'PILOT-01',
      avatarIcon: 'Shield',
      level: 1,
      xp: 0,
      nextLevelXp: 1000,
      credits: 1500,
      faction: 'APEX_SYNDICATE',
      totalRaces: 0,
      wins: 0,
      podiums: 0,
      cleanRaces: 0,
      favoriteTrack: 'neon_orbit',
      bestTimes: {},
      survivalRecordSec: 0,
      unlockedShips: ['apex_phantom', 'vortex_nemesis', 'solaris_stinger'],
      unlockedSkins: ['cyber_stealth'],
      unlockedDecals: ['none'],
      currentWinStreak: 0,
      highestWinStreak: 0,
      achievements: INITIAL_ACHIEVEMENTS,
    };
  }

  public saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      localStorage.setItem('void_pilot_credits', String(this.profile.credits));
      localStorage.setItem('void_pilot_callsign', this.profile.callsign);
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
    this.notify();
  }

  private initMissions() {
    try {
      const savedDaily = localStorage.getItem('void_pilot_daily_missions');
      if (savedDaily) {
        this.dailyMissions = JSON.parse(savedDaily);
      } else {
        this.dailyMissions = INITIAL_DAILY_MISSIONS;
      }

      const savedWeekly = localStorage.getItem('void_pilot_weekly_missions');
      if (savedWeekly) {
        this.weeklyMissions = JSON.parse(savedWeekly);
      } else {
        this.weeklyMissions = INITIAL_WEEKLY_MISSIONS;
      }
    } catch (e) {
      this.dailyMissions = INITIAL_DAILY_MISSIONS;
      this.weeklyMissions = INITIAL_WEEKLY_MISSIONS;
    }
  }

  private saveMissions() {
    try {
      localStorage.setItem('void_pilot_daily_missions', JSON.stringify(this.dailyMissions));
      localStorage.setItem('void_pilot_weekly_missions', JSON.stringify(this.weeklyMissions));
    } catch (e) {
      console.warn('Failed to save missions:', e);
    }
    this.notify();
  }

  public getProfile(): PlayerProfile {
    return this.profile;
  }

  public getDailyMissions(): Mission[] {
    return this.dailyMissions;
  }

  public getWeeklyMissions(): Mission[] {
    return this.weeklyMissions;
  }

  public setCallsign(name: string) {
    this.profile.callsign = name.trim().slice(0, 16) || 'PILOT-01';
    this.saveProfile();
  }

  public setFaction(faction: PlayerProfile['faction']) {
    this.profile.faction = faction;
    this.saveProfile();
  }

  public setAvatarIcon(icon: string) {
    this.profile.avatarIcon = icon;
    this.saveProfile();
  }

  public addCredits(amount: number) {
    this.profile.credits = Math.max(0, this.profile.credits + amount);
    this.updateMissionProgress('weekly_credits', Math.max(0, amount));
    this.saveProfile();
  }

  public addXP(amount: number): { leveledUp: boolean; newLevel: number } {
    this.profile.xp += amount;
    let leveledUp = false;

    while (this.profile.xp >= this.profile.nextLevelXp) {
      this.profile.xp -= this.profile.nextLevelXp;
      this.profile.level += 1;
      this.profile.nextLevelXp = Math.floor(1000 * Math.pow(1.2, this.profile.level - 1));
      this.profile.credits += 500 * this.profile.level; // Level up bonus!
      leveledUp = true;
    }

    this.saveProfile();
    return { leveledUp, newLevel: this.profile.level };
  }

  public claimMissionReward(missionId: string): { credits: number; xp: number } | null {
    const m = [...this.dailyMissions, ...this.weeklyMissions].find(x => x.id === missionId);
    if (!m || !m.completed || m.claimed) return null;

    m.claimed = true;
    this.addCredits(m.rewardCredits);
    this.addXP(m.rewardXP);
    this.saveMissions();
    return { credits: m.rewardCredits, xp: m.rewardXP };
  }

  public updateMissionProgress(missionId: string, delta: number) {
    const m = [...this.dailyMissions, ...this.weeklyMissions].find(x => x.id === missionId);
    if (!m || m.completed) return;

    m.progress = Math.min(m.target, m.progress + delta);
    if (m.progress >= m.target) {
      m.completed = true;
    }
    this.saveMissions();
  }

  public unlockAchievement(id: string): AchievementBadge | null {
    const a = this.profile.achievements.find(x => x.id === id);
    if (!a || a.unlocked) return null;

    a.unlocked = true;
    a.unlockedAt = Date.now();
    this.addCredits(1000);
    this.addXP(800);
    this.saveProfile();
    return a;
  }

  public recordRaceCompleted(stats: {
    trackId: TrackId;
    mode: GameMode;
    rank: number;
    finishTimeMs: number;
    bestLapMs: number;
    topSpeed: number;
    crashes: number;
    boostsUsed: number;
    passedOpponents: number;
    survivalSec?: number;
  }): { xpEarned: number; creditsEarned: number; newRecord: boolean } {
    this.profile.totalRaces += 1;
    let baseXP = 300;
    let baseCredits = 400;

    // Podium bonuses
    if (stats.rank === 1) {
      this.profile.wins += 1;
      this.profile.podiums += 1;
      this.profile.currentWinStreak += 1;
      if (this.profile.currentWinStreak > this.profile.highestWinStreak) {
        this.profile.highestWinStreak = this.profile.currentWinStreak;
      }
      baseXP += 400;
      baseCredits += 500;
      this.unlockAchievement('circuit_champion');
      if (stats.mode === 'DUEL') {
        this.unlockAchievement('duel_master');
      }
    } else if (stats.rank <= 3) {
      this.profile.podiums += 1;
      this.profile.currentWinStreak = 0;
      baseXP += 200;
      baseCredits += 250;
    } else {
      this.profile.currentWinStreak = 0;
    }

    if (stats.crashes === 0) {
      this.profile.cleanRaces += 1;
      baseXP += 250;
      baseCredits += 300;
      this.unlockAchievement('clean_finish');
      this.updateMissionProgress('daily_clean', 1);
    }

    if (stats.topSpeed >= 300) {
      this.unlockAchievement('mach_speed');
    }

    if (stats.boostsUsed >= 15) {
      this.unlockAchievement('boost_master');
    }

    if (stats.mode === 'SURVIVAL' && (stats.survivalSec || 0) >= 60) {
      this.unlockAchievement('survival_master');
    }

    this.unlockAchievement('first_race');

    // Update Missions
    this.updateMissionProgress('daily_races', 1);
    this.updateMissionProgress('daily_boost', stats.boostsUsed);
    this.updateMissionProgress('daily_overtake', stats.passedOpponents || 0);
    if (stats.trackId === 'neon_orbit') {
      this.updateMissionProgress('daily_neon_orbit', 1);
    }
    if (stats.bestLapMs > 0 && stats.bestLapMs <= 55000) {
      this.updateMissionProgress('daily_target_time', 1);
    }
    if (stats.rank <= 3) {
      this.updateMissionProgress('weekly_podiums', 1);
    }
    if (stats.mode === 'SURVIVAL') {
      this.updateMissionProgress('weekly_survival', Math.floor(stats.survivalSec || 0));
    }

    // Best times check
    let newRecord = false;
    const currentBest = this.profile.bestTimes[stats.trackId];
    if (stats.bestLapMs > 0 && (!currentBest || stats.bestLapMs < currentBest)) {
      this.profile.bestTimes[stats.trackId] = stats.bestLapMs;
      newRecord = true;
    }

    if (stats.mode === 'SURVIVAL' && (stats.survivalSec || 0) > this.profile.survivalRecordSec) {
      this.profile.survivalRecordSec = Math.floor(stats.survivalSec || 0);
      newRecord = true;
    }

    // Save leaderboard entry
    saveLeaderboardEntry({
      rank: 1,
      pilotName: this.profile.callsign,
      shipName: 'Interceptor',
      trackId: stats.trackId,
      mode: stats.mode,
      lapTime: stats.bestLapMs,
      totalTime: stats.finishTimeMs,
      timestamp: Date.now(),
      isPlayer: true,
    });

    this.addCredits(baseCredits);
    this.addXP(baseXP);
    this.saveProfile();

    return { xpEarned: baseXP, creditsEarned: baseCredits, newRecord };
  }
}

export const progressionManager = new ProgressionManager();

// Leaderboard Storage & Global Simulation
const SEED_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, pilotName: 'Viper-X', shipName: 'Apex Phantom', trackId: 'neon_orbit', mode: 'STANDARD', lapTime: 47250, totalTime: 142100, timestamp: Date.now() - 3600000 * 5 },
  { rank: 2, pilotName: 'Kaelen Void', shipName: 'Vortex Nemesis', trackId: 'neon_orbit', mode: 'STANDARD', lapTime: 48100, totalTime: 144500, timestamp: Date.now() - 3600000 * 8 },
  { rank: 3, pilotName: 'Nova-7', shipName: 'Solaris Stinger', trackId: 'neon_orbit', mode: 'STANDARD', lapTime: 49400, totalTime: 148200, timestamp: Date.now() - 3600000 * 12 },
  { rank: 4, pilotName: 'Aero-99', shipName: 'Void Valkyrie', trackId: 'neon_orbit', mode: 'STANDARD', lapTime: 50800, totalTime: 151900, timestamp: Date.now() - 3600000 * 20 },
  { rank: 5, pilotName: 'Titan-V', shipName: 'Titan Dreadnought', trackId: 'neon_orbit', mode: 'STANDARD', lapTime: 52100, totalTime: 156300, timestamp: Date.now() - 3600000 * 24 },

  { rank: 1, pilotName: 'Spectre', shipName: 'Apex Phantom', trackId: 'void_rift', mode: 'STANDARD', lapTime: 53100, totalTime: 159800, timestamp: Date.now() - 3600000 * 4 },
  { rank: 2, pilotName: 'Quantum-X', shipName: 'Solaris Stinger', trackId: 'void_rift', mode: 'STANDARD', lapTime: 54300, totalTime: 163200, timestamp: Date.now() - 3600000 * 9 },
  { rank: 3, pilotName: 'Viper-X', shipName: 'Apex Phantom', trackId: 'void_rift', mode: 'STANDARD', lapTime: 55200, totalTime: 165800, timestamp: Date.now() - 3600000 * 15 },

  { rank: 1, pilotName: 'Kaelen Void', shipName: 'Vortex Nemesis', trackId: 'circuit_alpha', mode: 'STANDARD', lapTime: 46800, totalTime: 140400, timestamp: Date.now() - 3600000 * 2 },
  { rank: 2, pilotName: 'Nova-7', shipName: 'Solaris Stinger', trackId: 'circuit_alpha', mode: 'STANDARD', lapTime: 47900, totalTime: 143700, timestamp: Date.now() - 3600000 * 6 },
];

export function getLeaderboard(trackId: TrackId, mode: GameMode = 'STANDARD'): LeaderboardEntry[] {
  let records: LeaderboardEntry[] = [];
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      records = JSON.parse(saved);
    } else {
      records = SEED_GLOBAL_LEADERBOARD;
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(records));
    }
  } catch (e) {
    records = SEED_GLOBAL_LEADERBOARD;
  }

  // Filter by track and sort by fastest lap time
  const filtered = records
    .filter(r => r.trackId === trackId)
    .sort((a, b) => a.lapTime - b.lapTime);

  // Recalculate ranks
  return filtered.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export function saveLeaderboardEntry(entry: LeaderboardEntry) {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    const records: LeaderboardEntry[] = saved ? JSON.parse(saved) : [...SEED_GLOBAL_LEADERBOARD];
    
    // Add new record and save top 30
    records.push(entry);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(records.slice(-40)));
  } catch (e) {
    console.warn('Failed to save leaderboard entry:', e);
  }
}

import { PlayerProgression, MissionItem, AchievementItem } from '../types';
import { DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from './beamSystem';

export function generateDailyMissions(): MissionItem[] {
  return [
    {
      id: 'dm_1',
      title: 'ORBITAL PATROL',
      description: 'Complete 3 championship race laps on any cosmic sector.',
      rewardCredits: 350,
      progress: 0,
      target: 3,
      claimed: false,
    },
    {
      id: 'dm_2',
      title: 'SONIC DRIFT MASTER',
      description: 'Maintain high-speed lateral slipstream drift for 25 seconds.',
      rewardCredits: 500,
      progress: 0,
      target: 25,
      claimed: false,
    },
    {
      id: 'dm_3',
      title: 'ASTEROID HARVEST',
      description: 'Demolish 8 kinetic asteroids using front-mounted energy beam.',
      rewardCredits: 650,
      progress: 0,
      target: 8,
      claimed: false,
    },
  ];
}

export const INITIAL_ACHIEVEMENTS_ITEMS: AchievementItem[] = [
  {
    id: 'ach_first_win',
    title: 'PODIUM CHAMPION',
    description: 'Claim 1st place in a Grand Prix or Solo AI circuit battle.',
    rewardCredits: 800,
    progress: 0,
    target: 1,
    unlocked: false,
  },
  {
    id: 'ach_warp_velocity',
    title: 'HYPER-WARP CRACK',
    description: 'Break 320 KM/H top velocity using nitro boost.',
    rewardCredits: 1000,
    progress: 0,
    target: 1,
    unlocked: false,
  },
  {
    id: 'ach_asteroid_destroyer',
    title: 'ASTEROID ANNIHILATOR',
    description: 'Demolish 20 asteroids with your front-mounted destruction beam.',
    rewardCredits: 1200,
    progress: 0,
    target: 20,
    unlocked: false,
  },
  {
    id: 'ach_combo_supernova',
    title: 'COMBO SUPERNOVA',
    description: 'Trigger a 4x or higher Asteroid Shatter combo chain.',
    rewardCredits: 1500,
    progress: 0,
    target: 1,
    unlocked: false,
  },
  {
    id: 'ach_fleet_admiral',
    title: 'FLEET EXPANSION',
    description: 'Unlock and tune 3 distinctive cosmic racing vessels.',
    rewardCredits: 1500,
    progress: 1,
    target: 3,
    unlocked: false,
  },
];

export const progressionStorage = {
  load(): PlayerProgression {
    try {
      const data = localStorage.getItem('void_rider_progression_v1');
      if (data) {
        const parsed = JSON.parse(data);
        // If it had a random generated name, adapt to Aditya if pilot placeholder
        if (parsed.playerName && parsed.playerName.startsWith('PILOT_')) {
          parsed.playerName = 'Aditya';
        }
        if (!parsed.selectedShipId || parsed.selectedShipId === 'apex_phantom') {
          parsed.selectedShipId = 'vortex_nemesis';
        }
        if (parsed.unlockedShipIds && !parsed.unlockedShipIds.includes('vortex_nemesis')) {
          parsed.unlockedShipIds.push('vortex_nemesis');
        }
        if (!parsed.thrusterColor || parsed.thrusterColor === 'neon_cyan') {
          parsed.thrusterColor = 'solar_gold';
        }
        parsed.beamCustomization = parsed.beamCustomization || { ...DEFAULT_BEAM_CUSTOMIZATION };
        parsed.beamUpgrades = parsed.beamUpgrades || { ...DEFAULT_BEAM_UPGRADES };
        parsed.stats = {
          ...parsed.stats,
          asteroidsDestroyed: parsed.stats?.asteroidsDestroyed || 0,
          beamShotsFired: parsed.stats?.beamShotsFired || 0,
          maxAsteroidCombo: parsed.stats?.maxAsteroidCombo || 0,
        };
        return parsed;
      }
    } catch {}

    return {
      playerName: 'Aditya',
      credits: 2400,
      level: 1,
      xp: 150,
      selectedShipId: 'vortex_nemesis',
      primaryColor: '#00f0ff',
      secondaryColor: '#d000ff',
      decal: 'none',
      thrusterColor: 'solar_gold',
      cockpitSkin: 'cyber_stealth',
      beamCustomization: { ...DEFAULT_BEAM_CUSTOMIZATION },
      beamUpgrades: { ...DEFAULT_BEAM_UPGRADES },
      upgrades: {
        engine: 0,
        handling: 0,
        boost: 0,
        chassis: 0,
      },
      unlockedShipIds: ['apex_phantom', 'vortex_nemesis'],
      dailyMissions: generateDailyMissions(),
      achievements: INITIAL_ACHIEVEMENTS_ITEMS,
      leaderboards: SEED_GLOBAL_LEADERBOARD,
      stats: {
        racesCompleted: 0,
        racesWon: 0,
        topSpeedReached: 0,
        totalDriftSeconds: 0,
        asteroidsAvoided: 0,
        asteroidsDestroyed: 0,
        beamShotsFired: 0,
        maxAsteroidCombo: 0,
      },
    };
  },
  save(prog: PlayerProgression) {
    try {
      localStorage.setItem('void_rider_progression_v1', JSON.stringify(prog));
    } catch {}
  },
};
