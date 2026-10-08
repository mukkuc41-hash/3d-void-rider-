import type {
  FinalCollapseCoreEvent,
  FinalCollapseWorldState,
  CivilizationDamageStage,
} from './finalCollapseEventTypes';
import { EVENTS_PART_1 } from './eventsPart1';
import { EVENTS_PART_2 } from './eventsPart2';
import { EVENTS_PART_3 } from './eventsPart3';

export * from './finalCollapseEventTypes';

/**
 * MASTER 100-EVENT CATALOG FOR FINAL COLLAPSE (SUBMODE 10)
 *
 * Spans 15:00 -> 00:00 at exact 9-second cadence across 900 seconds total.
 * Part 1 (Events 1–33): Awakening & Initial Collapse (15:00 -> 10:12)
 * Part 2 (Events 34–66): Civilization Breakdown (10:03 -> 05:15)
 * Part 3 (Events 67–100): Final Collapse (05:06 -> 00:00)
 */
const RAW_EVENTS_COLLECTION: readonly FinalCollapseCoreEvent[] = [
  ...EVENTS_PART_1,
  ...EVENTS_PART_2,
  ...EVENTS_PART_3,
];

import { getMasterEventByNumber, getMasterEventByElapsedSeconds } from './finalCollapseMaster100Timeline';

export const FINAL_COLLAPSE_100_EVENTS: readonly FinalCollapseCoreEvent[] = RAW_EVENTS_COLLECTION.map((evt) => {
  const master = getMasterEventByNumber(evt.eventNumber);
  const nextMaster = evt.eventNumber < 100 ? getMasterEventByNumber(evt.eventNumber + 1) : null;
  const duration = nextMaster
    ? Math.max(1, nextMaster.exactTriggerSeconds - master.exactTriggerSeconds)
    : 10;

  return {
    ...evt,
    title: master.eventName,
    shortDescription: master.alertMessage,
    triggerTime: master.exactTriggerSeconds,
    countdownDisplay: master.displayTime,
    duration,
    alert: {
      eventNumber: master.eventNumber,
      title: master.alertTitle,
      warningMessage: master.alertMessage,
      nextEventTime: nextMaster ? nextMaster.displayTime : '00:00',
    },
  };
});

/**
 * Fast O(1) indexed lookup by event number (1 to 100)
 */
const EVENT_MAP = new Map<number, FinalCollapseCoreEvent>();
for (const evt of FINAL_COLLAPSE_100_EVENTS) {
  EVENT_MAP.set(evt.eventNumber, evt);
}

export function getFinalCollapseEventByNumber(eventNumber: number): FinalCollapseCoreEvent {
  const clamped = Math.max(1, Math.min(100, Math.round(eventNumber)));
  return EVENT_MAP.get(clamped) || FINAL_COLLAPSE_100_EVENTS[0];
}

/**
 * Returns the currently active event given elapsed seconds from 15:00 (0 to 900s)
 */
export function getActiveFinalCollapseEvent(elapsedSeconds: number): {
  currentEvent: FinalCollapseCoreEvent;
  nextEvent: FinalCollapseCoreEvent | null;
  currentIndex: number;
  secondsUntilNext: number;
  stage: CivilizationDamageStage;
} {
  const safeElapsed = Math.max(0, Math.min(900, elapsedSeconds));
  const masterInfo = getMasterEventByElapsedSeconds(safeElapsed);
  const currentIndex = masterInfo.currentEvent.eventNumber;
  const currentEvent = getFinalCollapseEventByNumber(currentIndex);

  const nextEvent = masterInfo.nextEvent ? getFinalCollapseEventByNumber(masterInfo.nextEvent.eventNumber) : null;
  const secondsUntilNext = masterInfo.secondsUntilNext;

  // Civilization damage stage calculation based on user progression:
  // NORMAL (1-10) -> DAMAGED (11-33) -> UNSTABLE (34-50) -> FRAGMENTED (51-66) -> CRITICAL (67-91) -> NEAR_TOTAL_COLLAPSE (92-100)
  let stage: CivilizationDamageStage = 'NORMAL';
  if (currentIndex >= 92) {
    stage = 'NEAR_TOTAL_COLLAPSE';
  } else if (currentIndex >= 67) {
    stage = 'CRITICAL';
  } else if (currentIndex >= 51) {
    stage = 'FRAGMENTED';
  } else if (currentIndex >= 34) {
    stage = 'UNSTABLE';
  } else if (currentIndex >= 11) {
    stage = 'DAMAGED';
  }

  return {
    currentEvent,
    nextEvent,
    currentIndex,
    secondsUntilNext,
    stage,
  };
}

/**
 * Applies an event's persistent consequences to the centralized world state.
 * Accumulates damage, fractures, power losses, and debris without resetting.
 */
export function applyEventToWorldState(
  state: FinalCollapseWorldState,
  event: FinalCollapseCoreEvent
): FinalCollapseWorldState {
  const updated: FinalCollapseWorldState = {
    ...state,
    damagedStructures: [...state.damagedStructures],
    destroyedStructures: [...state.destroyedStructures],
    separatedStructures: [...state.separatedStructures],
    displacedStructures: [...state.displacedStructures],
    unstableStructures: [...state.unstableStructures],
    powerFailures: [...state.powerFailures],
    brokenConnections: [...state.brokenConnections],
    activeDebrisFields: [...state.activeDebrisFields],
    orbitalChanges: [...state.orbitalChanges],
  };

  // Record affected object
  const target = event.persistence.whichExistingObjectAffected;
  if (!updated.damagedStructures.includes(target)) {
    updated.damagedStructures.push(target);
  }

  // Record specific physical consequences
  const phys = event.physicalConsequence;
  if (phys.separation !== 'None.' && !updated.separatedStructures.includes(target)) {
    updated.separatedStructures.push(target);
  }
  if (phys.collapse.toLowerCase().includes('collapse') || phys.damage.toLowerCase().includes('destroyed')) {
    if (!updated.destroyedStructures.includes(target)) {
      updated.destroyedStructures.push(target);
    }
  }
  if (phys.movement !== 'None.' && !updated.displacedStructures.includes(target)) {
    updated.displacedStructures.push(target);
  }

  // Record power and connection failures
  if (event.civilizationEffect.energySystems.toLowerCase().includes('trip') ||
      event.civilizationEffect.energySystems.toLowerCase().includes('loss') ||
      event.civilizationEffect.energySystems.toLowerCase().includes('blackout') ||
      event.civilizationEffect.energySystems.toLowerCase().includes('dead')) {
    if (!updated.powerFailures.includes(target)) {
      updated.powerFailures.push(target);
    }
  }

  // Update damage level percentage (0 to 1)
  updated.civilizationDamageLevel = Math.min(1.0, event.eventNumber / 100);
  updated.blackHoleInstability = Math.min(1.0, 0.05 + (event.eventNumber / 100) * 0.95);

  // Update civilization damage stage
  if (event.eventNumber >= 92) {
    updated.civilizationStage = 'NEAR_TOTAL_COLLAPSE';
  } else if (event.eventNumber >= 67) {
    updated.civilizationStage = 'CRITICAL';
  } else if (event.eventNumber >= 51) {
    updated.civilizationStage = 'FRAGMENTED';
  } else if (event.eventNumber >= 34) {
    updated.civilizationStage = 'UNSTABLE';
  } else if (event.eventNumber >= 11) {
    updated.civilizationStage = 'DAMAGED';
  } else {
    updated.civilizationStage = 'NORMAL';
  }

  // Event 100 marks final collapse state completion
  if (event.eventNumber >= 100) {
    updated.finalCollapseComplete = true;
  }

  return updated;
}
