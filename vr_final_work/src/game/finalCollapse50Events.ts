/**
 * Final Collapse Timeline Specification
 * Mode 21: Black Hole — Submode 10: Final Collapse
 * Exactly 20 minutes (1,200 seconds) = 100 sequential events of 12 seconds each.
 * Re-exports from finalCollapse100Events for seamless backwards compatibility.
 */

export {
  FINAL_COLLAPSE_100_EVENTS,
  TOTAL_CINEMATIC_SECONDS,
  EVENT_DURATION_SECONDS,
  TOTAL_EVENTS_COUNT,
  getFinalCollapse100Event,
  formatCinematicElapsedTimer,
  type FinalCollapse100Event,
} from './finalCollapse100Events';

import {
  FINAL_COLLAPSE_100_EVENTS,
  getFinalCollapse100Event,
  FinalCollapse100Event,
} from './finalCollapse100Events';

// Backwards-compatibility aliases
export const FINAL_COLLAPSE_50_EVENTS = FINAL_COLLAPSE_100_EVENTS;
export const getFinalCollapse50Event = getFinalCollapse100Event;
export type FinalCollapse50Event = FinalCollapse100Event;
