import type { CosmicEventDefinition } from "./cosmicSystems";
import { FINAL_COLLAPSE_100_EVENTS } from "../finalCollapse/finalCollapse100EventsCatalog";

/**
 * 100 CANONICAL EVENTS CATALOG FOR SUBMODE 10: THE FINAL COLLAPSE
 *
 * Mapped directly from the unified core architecture FINAL_COLLAPSE_100_EVENTS.
 * Guarantees 100% exact alignment between the event manager, 3D visualization,
 * HUD components, and Submode10StagesModal.
 */
export const RAW_COSMIC_100_EVENTS: Omit<
  CosmicEventDefinition,
  "element1" | "element2" | "eventOccurrenceNarrative" | "completionStrategy" | "cinematicBeats"
>[] = FINAL_COLLAPSE_100_EVENTS.map(evt => {
  const norm = (evt.eventNumber - 1) / 99;
  return {
    index: evt.eventNumber,
    id: evt.id,
    name: evt.title,
    title: `EVENT ${String(evt.eventNumber).padStart(2, '0')} — ${evt.countdownDisplay} ${evt.title.toUpperCase()}`,
    countdownTime: evt.countdownDisplay,
    subtitle: evt.shortDescription,
    cause: evt.blackHoleEffect.singularityReaction,
    physicalEffect: `${evt.physicalConsequence.damage} ${evt.physicalConsequence.movement}`,
    environmentalResponse: evt.environmentEffect.spaceDistortion,
    playerResponse: evt.playerEffect.shipReaction,
    triggerTime: evt.triggerTime,
    severity: Math.round((1.0 + norm * 9.0) * 10) / 10,
    gravityParams: {
      gravityInfluenceRadius: 0.15 + norm * 0.85,
      gravityAsymmetry: 0.05 + norm * 0.45,
      lensingStrength: 0.10 + norm * 0.90,
      tidalStrength: 0.12 + norm * 0.88,
      infallRate: 0.10 + norm * 0.90,
      accretionActivity: 0.15 + norm * 0.85,
      matterStreamIntensity: 0.10 + norm * 0.90,
      gravitationalWaveStrength: 0.05 + norm * 0.55,
      spacetimeDistortion: 0.08 + norm * 0.92,
      environmentCompression: 0.05 + norm * 0.55,
      asymmetricExpansion: 0.05 + norm * 0.55,
      collapseIntensity: 0.05 + norm * 0.95,
    },
  };
});
