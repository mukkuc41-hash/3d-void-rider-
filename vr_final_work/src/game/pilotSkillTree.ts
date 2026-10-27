/**
 * Pilot Skill Tree & Cybernetic Implant Specializations for Void-Rider 3D
 * Provides 3 distinct specialization paths (Vector, Combat, Graviton) with
 * persistent upgrades and active racing modifiers.
 */
import { PilotSkillsState, SkillBranchId, SkillNode } from '../types';

export const SKILL_TREE_NODES: SkillNode[] = [
  // VECTOR SPECIALIST BRANCH
  {
    id: 'vec_slipstream',
    branch: 'VECTOR',
    name: 'Slipstream Vacuum',
    description: 'Increases boost regeneration by +25% when drafting directly behind rival exhaust plumes.',
    icon: '💨',
    cost: 1,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    modifier: { draftMultiplier: 1.25 },
  },
  {
    id: 'vec_tachyon',
    branch: 'VECTOR',
    name: 'Tachyon Overdrive',
    description: 'Raises the maximum ship velocity limit by +60 KM/H across all game modes.',
    icon: '⚡',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    modifier: { topSpeedBonus: 60 },
  },
  {
    id: 'vec_inertial',
    branch: 'VECTOR',
    name: 'Inertial Balancer',
    description: 'Reduces lateral kinetic drift drag by 35% on high-G hairpin corners.',
    icon: '🎯',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 2,
    modifier: { driftDragReduction: 0.35 },
  },

  // COMBAT VANGUARD BRANCH
  {
    id: 'com_emp_resonance',
    branch: 'COMBAT',
    name: 'EMP Resonance Wave',
    description: 'Expands the EMP Surge blast radius from 75m to 110m and drains 50% more enemy boost.',
    icon: '⚡',
    cost: 1,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    modifier: { empRadiusBonus: 35 },
  },
  {
    id: 'com_kinetic_deflect',
    branch: 'COMBAT',
    name: 'Kinetic Shield Deflector',
    description: 'Scraping track walls or bouncing off obstacles restores 15% shield integrity instead of damaging hull.',
    icon: '🛡️',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 2,
    modifier: { wallDeflectShieldRecharge: 15 },
  },
  {
    id: 'com_missile_reload',
    branch: 'COMBAT',
    name: 'Auto-Loader Capacitor',
    description: 'Reduces missile weapon reload cooldown by 3.5 seconds.',
    icon: '🚀',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    modifier: { missileCooldownReduction: 3.5 },
  },

  // GRAVITON ARCHITECT BRANCH
  {
    id: 'grav_slingshot',
    branch: 'GRAVITON',
    name: 'Singularity Slingshot',
    description: 'Doubles the gravitational slingshot velocity boost when navigating black hole horizons.',
    icon: '🕳️',
    cost: 1,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    modifier: { slingshotMultiplier: 2.0 },
  },
  {
    id: 'grav_phase_mastery',
    branch: 'GRAVITON',
    name: 'Quantum Phase Mastery',
    description: 'Reduces the Quantum Phase Warp cooldown by 4.0 seconds for frequent obstacle phasing.',
    icon: '🌀',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 2,
    modifier: { phaseCooldownReduction: 4.0 },
  },
  {
    id: 'grav_anchor_grip',
    branch: 'GRAVITON',
    name: 'Graviton Spatial Grip',
    description: 'Increases Graviton Drift Anchor duration to 6.0 seconds with zero lateral slide.',
    icon: '⚓',
    cost: 2,
    unlocked: false,
    level: 0,
    maxLevel: 2,
    modifier: { anchorDurationBonus: 2.0 },
  },
];

const STORAGE_KEY = 'void_rider_pilot_skills';

export class PilotSkillManager {
  private state: PilotSkillsState = {
    availableSkillPoints: 3,
    totalEarnedPoints: 3,
    unlockedSkills: {},
  };

  constructor() {
    this.load();
  }

  public getState(): PilotSkillsState {
    return this.state;
  }

  public addPointsForLevel(level: number) {
    const targetPoints = Math.max(0, level * 1);
    if (targetPoints > this.state.totalEarnedPoints) {
      const diff = targetPoints - this.state.totalEarnedPoints;
      this.state.availableSkillPoints += diff;
      this.state.totalEarnedPoints = targetPoints;
      this.save();
    }
  }

  public upgradeSkill(skillId: string): boolean {
    const node = SKILL_TREE_NODES.find((n) => n.id === skillId);
    if (!node) return false;

    const currentLvl = this.state.unlockedSkills[skillId] || 0;
    if (currentLvl >= node.maxLevel) return false;
    if (this.state.availableSkillPoints < node.cost) return false;

    this.state.availableSkillPoints -= node.cost;
    this.state.unlockedSkills[skillId] = currentLvl + 1;
    this.save();
    return true;
  }

  public respecSkills() {
    this.state.availableSkillPoints = this.state.totalEarnedPoints;
    this.state.unlockedSkills = {};
    this.save();
  }

  public getSkillLevel(skillId: string): number {
    return this.state.unlockedSkills[skillId] || 0;
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch {}
  }
}

export const pilotSkillManager = new PilotSkillManager();
