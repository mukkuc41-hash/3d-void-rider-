/**
 * VOID-RIDER 3D — CONVOY GUARDIAN CAMPAIGN PERSISTENCE
 * 
 * Manages reliable persistence of 50,000 km campaign progress,
 * checkpoints, surviving transports, and the final parked dome state.
 * Prevents duplicate rewards and protects against malformed local storage.
 */
import { ConvoyVariant, ConvoyMissionResult, EscapeSequenceStep } from './convoyTypes';

const STORAGE_KEY = 'void_rider_convoy_campaign_v2';

export interface SavedTransportState {
  id: string;
  name: string;
  isAlive: boolean;
  health: number;
  maxHealth: number;
  shield: number;
  assignedBayIndex?: number;
  isClampedInBay?: boolean;
}

export interface ConvoyCampaignSave {
  version: 2;
  variant: ConvoyVariant;
  selectedShipId: string;
  routeProgress: number; // 0.0 to 1.0
  routeKm: number; // 0 to 50,000
  currentEventIndex: number;
  completedEventIds: string[];
  dronesDestroyedCount: number;
  debrisClearedCount: number;
  repairsCollectedCount: number;
  timeElapsed: number;
  transports: SavedTransportState[];
  isParkedInDome: boolean;
  parkingStep?: EscapeSequenceStep;
  rewardsClaimed: boolean;
  savedTimestamp: number;
  finalStats: ConvoyMissionResult | null;
}

export class ConvoyPersistenceManager {
  public static saveCampaign(save: ConvoyCampaignSave): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const serialized = JSON.stringify(save);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.warn('[ConvoyPersistence] Failed to save campaign:', err);
      return false;
    }
  }

  public static loadCampaign(filterVariant?: ConvoyVariant): ConvoyCampaignSave | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as ConvoyCampaignSave;
      if (!parsed || parsed.version !== 2) return null;

      if (filterVariant && parsed.variant !== filterVariant) {
        return null;
      }

      return parsed;
    } catch (err) {
      console.warn('[ConvoyPersistence] Failed to parse saved campaign:', err);
      return null;
    }
  }

  public static clearCampaign(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[ConvoyPersistence] Failed to clear campaign:', err);
    }
  }

  public static hasParkedCompletion(): boolean {
    const save = this.loadCampaign();
    return !!(save && save.isParkedInDome && save.finalStats?.victory);
  }
}
