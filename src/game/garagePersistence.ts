/**
 * VOID-RIDER 3D — GARAGE PERSISTENCE & VOID CREDITS ECONOMY MANAGER
 * Handles Void Credits balance, transaction history, owned fleet, favorites,
 * per-ship customization, component upgrades, and safe legacy save migration.
 */

import { ShipUpgrades, ShipDecalType, ThrusterFlameColor, CockpitSkin, BeamCustomization, BeamUpgrades } from '../types';
import { getShipDefinition } from './shipCatalog';
import { DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from './beamSystem';

export interface CreditTransaction {
  id: string;
  amount: number; // positive = earned, negative = spent
  description: string;
  timestamp: number;
  balanceAfter: number;
}

export interface ShipCustomizationData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  engineColor: string;
  energyColor: string;
  beamColor: string;
  emissiveIntensity: number;
  decal: ShipDecalType;
  cockpitSkin: CockpitSkin;
  thrusterFlameColor: ThrusterFlameColor;
  engineType: string;
  exhaustStyle: string;
  glowIntensity: number;
  trailStyle: string;
  effectsPreset: string;
  underglowColor?: string;
  underglowPattern?: string;
  shieldAura?: string;
  particleAura?: string;
}

export interface ExtendedGarageUpgrades extends ShipUpgrades {
  power?: number;         // 0 - 5
  armorLevel?: number;    // 0 - 5
  shieldLevel?: number;   // 0 - 5
  energyLevel?: number;   // 0 - 5
  rechargeLevel?: number; // 0 - 5
  driftLevel?: number;    // 0 - 5
  coolingLevel?: number;  // 0 - 5
}

export interface GarageSaveData {
  version: number;
  credits: number;
  creditHistory: CreditTransaction[];
  ownedShipIds: string[];
  equippedShipId: string;
  favoriteShipIds: string[];
  shipCustomizations: Record<string, ShipCustomizationData>;
  upgrades: ExtendedGarageUpgrades;
  beamCustomization: BeamCustomization;
  beamUpgrades: BeamUpgrades;
  pilotName: string;
  pilotLevel: number;
}

const STORAGE_KEY = 'void_rider_garage_v3';
const LEGACY_KEY_V1 = 'void_rider_progression_v1';
const LEGACY_PROFILE_KEY = 'void_pilot_profile_v2';

export class GaragePersistenceManager {
  private data: GarageSaveData;
  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.loadOrMigrate();
  }

  private loadOrMigrate(): GarageSaveData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.validateAndSanitize(parsed);
      }
    } catch (e) {
      console.warn('Error reading garage save:', e);
    }

    // Attempt migration from legacy keys
    return this.migrateFromLegacy();
  }

  private migrateFromLegacy(): GarageSaveData {
    let credits = 3500;
    let equippedShipId = 'VR-0002'; // Vortex Nemesis
    const ownedShipIds = ['VR-0001', 'VR-0002', 'VR-0003'];
    let pilotName = 'Aditya';
    let pilotLevel = 1;
    let upgrades: ExtendedGarageUpgrades = {
      engine: 0,
      handling: 0,
      boost: 0,
      chassis: 0,
      shieldDuration: 0,
      magnetRange: 0,
      hyperBoostSpeed: 0,
      power: 0,
      armorLevel: 0,
      shieldLevel: 0,
      energyLevel: 0,
      rechargeLevel: 0,
      driftLevel: 0,
      coolingLevel: 0,
    };
    let beamCustomization: BeamCustomization = { ...DEFAULT_BEAM_CUSTOMIZATION };
    let beamUpgrades: BeamUpgrades = { ...DEFAULT_BEAM_UPGRADES };

    // Check v1 progression
    try {
      const legV1 = localStorage.getItem(LEGACY_KEY_V1);
      if (legV1) {
        const p = JSON.parse(legV1);
        if (typeof p.credits === 'number' && p.credits >= 0) {
          credits = Math.max(credits, p.credits);
        }
        if (p.playerName) pilotName = p.playerName;
        if (p.level) pilotLevel = Math.max(1, p.level);
        if (p.selectedShipId) {
          equippedShipId = this.mapLegacyId(p.selectedShipId);
        }
        if (Array.isArray(p.unlockedShipIds)) {
          p.unlockedShipIds.forEach((id: string) => {
            const mapped = this.mapLegacyId(id);
            if (!ownedShipIds.includes(mapped)) ownedShipIds.push(mapped);
          });
        }
        if (p.upgrades) upgrades = { ...upgrades, ...p.upgrades };
        if (p.beamCustomization) beamCustomization = { ...beamCustomization, ...p.beamCustomization };
        if (p.beamUpgrades) beamUpgrades = { ...beamUpgrades, ...p.beamUpgrades };
      }
    } catch {}

    // Check profile key
    try {
      const prof = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (prof) {
        const pr = JSON.parse(prof);
        if (typeof pr.credits === 'number' && pr.credits > credits) {
          credits = pr.credits;
        }
        if (pr.callsign) pilotName = pr.callsign;
      }
    } catch {}

    const initialHistory: CreditTransaction[] = [
      {
        id: `tx_${Date.now()}_init`,
        amount: credits,
        description: 'PILOT COMMISSION & RACE STIPEND',
        timestamp: Date.now(),
        balanceAfter: credits,
      },
    ];

    const initial: GarageSaveData = {
      version: 3,
      credits,
      creditHistory: initialHistory,
      ownedShipIds,
      equippedShipId,
      favoriteShipIds: ['VR-0001', 'VR-0002'],
      shipCustomizations: {},
      upgrades,
      beamCustomization,
      beamUpgrades,
      pilotName,
      pilotLevel,
    };

    this.saveDataDirect(initial);
    return initial;
  }

  private mapLegacyId(id: string): string {
    if (!id) return 'VR-0001';
    if (id === 'apex_phantom') return 'VR-0001';
    if (id === 'vortex_nemesis') return 'VR-0002';
    if (id === 'solaris_stinger') return 'VR-0003';
    if (id === 'void_valkyrie') return 'VR-0004';
    if (id === 'titan_dreadnought') return 'VR-0005';
    if (id.startsWith('VR-')) return id;
    return 'VR-0001';
  }

  private validateAndSanitize(data: any): GarageSaveData {
    const owned = Array.isArray(data.ownedShipIds) ? [...data.ownedShipIds] : ['VR-0001', 'VR-0002'];
    if (!owned.includes('VR-0001')) owned.push('VR-0001');
    if (!owned.includes('VR-0002')) owned.push('VR-0002');

    return {
      version: 3,
      credits: Math.max(0, typeof data.credits === 'number' ? data.credits : 3500),
      creditHistory: Array.isArray(data.creditHistory) ? data.creditHistory.slice(-50) : [],
      ownedShipIds: owned,
      equippedShipId: data.equippedShipId || 'VR-0002',
      favoriteShipIds: Array.isArray(data.favoriteShipIds) ? data.favoriteShipIds : ['VR-0001'],
      shipCustomizations: data.shipCustomizations || {},
      upgrades: {
        engine: 0,
        handling: 0,
        boost: 0,
        chassis: 0,
        shieldDuration: 0,
        magnetRange: 0,
        hyperBoostSpeed: 0,
        power: 0,
        armorLevel: 0,
        shieldLevel: 0,
        energyLevel: 0,
        rechargeLevel: 0,
        driftLevel: 0,
        coolingLevel: 0,
        ...(data.upgrades || {}),
      },
      beamCustomization: data.beamCustomization || { ...DEFAULT_BEAM_CUSTOMIZATION },
      beamUpgrades: data.beamUpgrades || { ...DEFAULT_BEAM_UPGRADES },
      pilotName: data.pilotName || 'Aditya',
      pilotLevel: Math.max(1, data.pilotLevel || 1),
    };
  }

  public getData(): GarageSaveData {
    return this.data;
  }

  public save() {
    this.saveDataDirect(this.data);
    this.syncToLegacy();
    this.notify();
  }

  private saveDataDirect(data: GarageSaveData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem('void_pilot_credits', String(data.credits));
    } catch (e) {
      console.warn('Failed to write garage storage:', e);
    }
  }

  /**
   * Keep void_rider_progression_v1 synchronized so race gameplay and menus stay completely in sync!
   */
  private syncToLegacy() {
    try {
      const leg = localStorage.getItem(LEGACY_KEY_V1);
      const parsed = leg ? JSON.parse(leg) : {};
      parsed.credits = this.data.credits;
      parsed.selectedShipId = this.data.equippedShipId;
      parsed.unlockedShipIds = this.data.ownedShipIds;
      parsed.upgrades = this.data.upgrades;
      parsed.beamCustomization = this.data.beamCustomization;
      parsed.beamUpgrades = this.data.beamUpgrades;
      localStorage.setItem(LEGACY_KEY_V1, JSON.stringify(parsed));
    } catch {}
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  // VOID CREDITS ECONOMY OPERATIONS
  public getCredits(): number {
    return this.data.credits;
  }

  public addCredits(amount: number, description: string): boolean {
    if (amount <= 0) return false;
    this.data.credits += amount;
    this.recordTransaction(amount, description);
    this.save();
    return true;
  }

  public deductCredits(amount: number, description: string): boolean {
    if (amount <= 0) return false;
    if (this.data.credits < amount) return false;

    this.data.credits -= amount;
    this.recordTransaction(-amount, description);
    this.save();
    return true;
  }

  private recordTransaction(amount: number, description: string) {
    const tx: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount,
      description,
      timestamp: Date.now(),
      balanceAfter: this.data.credits,
    };
    this.data.creditHistory.unshift(tx);
    if (this.data.creditHistory.length > 60) {
      this.data.creditHistory = this.data.creditHistory.slice(0, 60);
    }
  }

  public getTransactionHistory(): CreditTransaction[] {
    return this.data.creditHistory;
  }

  // FLEET OPERATIONS
  public isOwned(shipId: string): boolean {
    return this.data.ownedShipIds.includes(shipId);
  }

  public isEquipped(shipId: string): boolean {
    return this.data.equippedShipId === shipId;
  }

  public isFavorite(shipId: string): boolean {
    return this.data.favoriteShipIds.includes(shipId);
  }

  public toggleFavorite(shipId: string) {
    if (this.data.favoriteShipIds.includes(shipId)) {
      this.data.favoriteShipIds = this.data.favoriteShipIds.filter(id => id !== shipId);
    } else {
      this.data.favoriteShipIds.push(shipId);
    }
    this.save();
  }

  public equipShip(shipId: string): boolean {
    if (!this.isOwned(shipId)) return false;
    this.data.equippedShipId = shipId;
    this.save();
    return true;
  }

  public purchaseShip(shipId: string): { success: boolean; message: string } {
    if (this.isOwned(shipId)) {
      return { success: false, message: 'SPACECRAFT ALREADY OWNED' };
    }

    const def = getShipDefinition(shipId);
    if (this.data.pilotLevel < def.unlockLevel) {
      return { success: false, message: `PILOT LEVEL ${def.unlockLevel} REQUIRED` };
    }

    if (this.data.credits < def.purchaseCost) {
      return { success: false, message: 'NOT ENOUGH CREDITS' };
    }

    const deducted = this.deductCredits(def.purchaseCost, `SHIP PURCHASE: ${def.name} (${def.id})`);
    if (!deducted) {
      return { success: false, message: 'TRANSACTION FAILED' };
    }

    this.data.ownedShipIds.push(shipId);
    this.data.equippedShipId = shipId;
    this.save();
    return { success: true, message: `PURCHASE COMPLETE: ${def.name}` };
  }

  // CUSTOMIZATION OPERATIONS
  public getShipCustomization(shipId: string): ShipCustomizationData {
    const existing = this.data.shipCustomizations[shipId];
    if (existing) return existing;

    const def = getShipDefinition(shipId);
    return {
      primaryColor: def.primaryColor,
      secondaryColor: def.secondaryColor,
      accentColor: def.accentColor,
      engineColor: def.engineColor,
      energyColor: def.energyColor,
      beamColor: def.beamColor,
      emissiveIntensity: def.emissiveIntensity,
      decal: 'none',
      cockpitSkin: 'cyber_stealth',
      thrusterFlameColor: 'solar_gold',
      engineType: 'ion_pulse',
      exhaustStyle: 'single_jet',
      glowIntensity: 1.0,
      trailStyle: 'solid_neon',
      effectsPreset: 'standard',
      underglowColor: def.secondaryColor,
      underglowPattern: 'steady',
      shieldAura: 'cyan_bubble',
      particleAura: 'none',
    };
  }

  public updateShipCustomization(shipId: string, partial: Partial<ShipCustomizationData>) {
    const current = this.getShipCustomization(shipId);
    this.data.shipCustomizations[shipId] = {
      ...current,
      ...partial,
    };
    this.save();
  }

  // UPGRADES OPERATIONS
  public getUpgrades(): ExtendedGarageUpgrades {
    return this.data.upgrades;
  }

  public purchaseUpgrade(upgradeKey: keyof ExtendedGarageUpgrades, cost: number, name: string): { success: boolean; message: string } {
    const currentLvl = (this.data.upgrades[upgradeKey] || 0);
    if (currentLvl >= 5) {
      return { success: false, message: 'MAXIMUM UPGRADE LEVEL REACHED' };
    }

    if (this.data.credits < cost) {
      return { success: false, message: 'NOT ENOUGH CREDITS' };
    }

    const deducted = this.deductCredits(cost, `UPGRADE: ${name} (TIER ${currentLvl + 1})`);
    if (!deducted) {
      return { success: false, message: 'NOT ENOUGH CREDITS' };
    }

    this.data.upgrades[upgradeKey] = currentLvl + 1;
    this.save();
    return { success: true, message: `UPGRADE INSTALLED: ${name} LVL ${currentLvl + 1}` };
  }

  // BEAM SYSTEM INTEGRATION
  public getBeamCustomization(): BeamCustomization {
    return this.data.beamCustomization;
  }

  public updateBeamCustomization(customization: BeamCustomization) {
    this.data.beamCustomization = { ...customization };
    this.save();
  }

  public getBeamUpgrades(): BeamUpgrades {
    return this.data.beamUpgrades;
  }

  public purchaseBeamUpgrade(upgradeKey: keyof BeamUpgrades, cost: number, name: string): { success: boolean; message: string } {
    const currentLvl = (this.data.beamUpgrades[upgradeKey] || 0);
    if (currentLvl >= 5) {
      return { success: false, message: 'BEAM COMPONENT ALREADY MAX LEVEL' };
    }

    if (this.data.credits < cost) {
      return { success: false, message: 'NOT ENOUGH CREDITS' };
    }

    const deducted = this.deductCredits(cost, `BEAM UPGRADE: ${name} (TIER ${currentLvl + 1})`);
    if (!deducted) {
      return { success: false, message: 'NOT ENOUGH CREDITS' };
    }

    this.data.beamUpgrades[upgradeKey] = currentLvl + 1;
    this.save();
    return { success: true, message: `BEAM UPGRADE COMPLETE: ${name} LVL ${currentLvl + 1}` };
  }
}

export const garagePersistence = new GaragePersistenceManager();
