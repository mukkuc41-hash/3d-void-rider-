import * as THREE from 'three';
import {
  FinalCollapseCoreEvent,
  FinalCollapseWorldState,
  createInitialWorldState,
  FINAL_COLLAPSE_100_EVENTS,
  applyEventToWorldState,
} from './finalCollapse100EventsCatalog';
import { FinalCollapseCivilization } from './finalCollapseCivilization';
import { CosmicPlanetarySystem } from './cosmicPlanetarySystem';
import { NeutronStarSystem } from './neutronStarSystem';
import { DynamicRouteGraphSystem } from './dynamicRouteGraphSystem';
import { MassiveBlackHoleEnvironment } from '../environment/massiveBlackHoleEnvironment';
import { sound } from '../audio';

export interface ActiveEventEffect {
  event: FinalCollapseCoreEvent;
  startTime: number;
  elapsed: number;
  progress: number; // 0.0 to 1.0
  isComplete: boolean;
}

export interface FinalCollapseEventNotification {
  eventNumber: number;
  title: string;
  countdownDisplay: string;
  areaName: string;
  description: string;
  severity: number;
  secondsUntilNext: number;
  warningMessage: string;
  nextEventTime?: string;
  worldState: FinalCollapseWorldState;
}

export type EventNotificationCallback = (notif: FinalCollapseEventNotification) => void;

/**
 * CENTRALIZED EVENT CONTROLLER FOR SUBMODE 10: THE FINAL COLLAPSE
 *
 * Drives the complete 100-event progression from 15:00 -> 00:00 across one continuous universe.
 * Every event conforms strictly to the unified core data architecture:
 * - Black Hole reaction (instability, lensing, photon ring, turbulence, relativistic jets)
 * - Persistent Civilization reaction (accumulates damage; nothing magically returns)
 * - Environmental & space distortion (7 planets, neutron star, multi-tier routes)
 * - Lightweight alerts formatted for RaceHUD
 * - Player-safe camera & audio effects (never moves or teleports player during gameplay)
 * - Event 100 Final Collapse State transition to existing safe-zone and ending logic
 */
export class FinalCollapseEventManager {
  private events: readonly FinalCollapseCoreEvent[] = FINAL_COLLAPSE_100_EVENTS;
  private triggeredEventNumbers = new Set<number>();
  private activeEffects: ActiveEventEffect[] = [];

  public currentEvent: FinalCollapseCoreEvent | null = null;
  public nextEvent: FinalCollapseCoreEvent | null = null;
  public elapsedSeconds = 0;
  public timeToNextEventSeconds = 9;

  // Centralized Persistent World State
  public worldState: FinalCollapseWorldState = createInitialWorldState();

  private civilization: FinalCollapseCivilization | null = null;
  private planetarySystem: CosmicPlanetarySystem | null = null;
  private neutronStarSystem: NeutronStarSystem | null = null;
  private routeGraph: DynamicRouteGraphSystem | null = null;
  private blackHoleEnvironment: MassiveBlackHoleEnvironment | null = null;
  private notificationCallbacks: EventNotificationCallback[] = [];

  // Active camera reaction requested by current event
  public requestedCameraReaction: string = 'NORMAL_GAMEPLAY';
  public requestedGravityAddition: number = 0;

  constructor(
    civilization?: FinalCollapseCivilization,
    blackHoleEnvironment?: MassiveBlackHoleEnvironment | { environment: MassiveBlackHoleEnvironment },
    planetarySystem?: CosmicPlanetarySystem,
    neutronStarSystem?: NeutronStarSystem,
    routeGraph?: DynamicRouteGraphSystem
  ) {
    if (civilization) this.civilization = civilization;
    if (blackHoleEnvironment) this.bindBlackHoleEnvironment(blackHoleEnvironment);
    if (planetarySystem) this.planetarySystem = planetarySystem;
    if (neutronStarSystem) this.neutronStarSystem = neutronStarSystem;
    if (routeGraph) this.routeGraph = routeGraph;
    this.calculateNextEvent();
  }

  public bindCivilization(civilization: FinalCollapseCivilization): void {
    this.civilization = civilization;
  }

  public bindPlanetarySystem(planets: CosmicPlanetarySystem): void {
    this.planetarySystem = planets;
  }

  public bindNeutronStarSystem(neutron: NeutronStarSystem): void {
    this.neutronStarSystem = neutron;
  }

  public bindRouteGraph(routeGraph: DynamicRouteGraphSystem): void {
    this.routeGraph = routeGraph;
  }

  public bindBlackHoleEnvironment(blackHole: MassiveBlackHoleEnvironment | { environment: MassiveBlackHoleEnvironment }): void {
    if ('environment' in blackHole && blackHole.environment) {
      this.blackHoleEnvironment = blackHole.environment;
    } else {
      this.blackHoleEnvironment = blackHole as MassiveBlackHoleEnvironment;
    }
  }

  public onEventNotification(cb: EventNotificationCallback): void {
    this.notificationCallbacks.push(cb);
  }

  /**
   * Resets event manager to T-15:00 (elapsed = 0)
   */
  public reset(): void {
    this.elapsedSeconds = 0;
    this.triggeredEventNumbers.clear();
    this.activeEffects = [];
    this.currentEvent = null;
    this.worldState = createInitialWorldState();
    this.requestedCameraReaction = 'NORMAL_GAMEPLAY';
    this.requestedGravityAddition = 0;
    this.calculateNextEvent();
  }

  /**
   * Main per-frame update driven by the authoritative Final Collapse countdown
   * @param dt Frame delta time
   * @param authoritativeElapsedSeconds Total elapsed time from 15:00 start (0 to 900s)
   */
  public update(dt: number, authoritativeElapsedSeconds: number): void {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsedSeconds = Math.max(0, authoritativeElapsedSeconds);

    // 1. Check and trigger events whose triggerTime has been reached
    for (let i = 0; i < this.events.length; i++) {
      const def = this.events[i];
      if (this.elapsedSeconds >= def.triggerTime && !this.triggeredEventNumbers.has(def.eventNumber)) {
        this.triggerEvent(def);
      }
    }

    // 2. Update all active overlapping event effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const eff = this.activeEffects[i];
      eff.elapsed += delta;
      eff.progress = Math.min(1.0, eff.elapsed / Math.max(1, eff.event.duration));

      // Apply physical and visual reactions to civilization & black hole
      this.applyActiveEffectReactions(eff);

      // Check for completion of temporary effects
      if (eff.progress >= 1.0) {
        eff.isComplete = true;
        // Clean up completed temporary visual effects while preserving persistent states
        this.activeEffects.splice(i, 1);
      }
    }

    // 3. Update next event and countdown accuracy
    this.calculateNextEvent();

    // 4. Update persistent civilization animations
    if (this.civilization) {
      this.civilization.update(delta);
    }
  }

  /**
   * Triggers an event exactly once, records persistent world state consequences, and dispatches notifications
   */
  private triggerEvent(def: FinalCollapseCoreEvent): void {
    this.triggeredEventNumbers.add(def.eventNumber);
    this.currentEvent = def;

    // Accumulate into centralized persistent world state
    this.worldState = applyEventToWorldState(this.worldState, def);

    // Track active reaction instance (supports overlapping animations)
    const activeEffect: ActiveEventEffect = {
      event: def,
      startTime: this.elapsedSeconds,
      elapsed: 0,
      progress: 0,
      isComplete: false,
    };
    this.activeEffects.push(activeEffect);

    // Audio cue matching event priority & severity across all 100 events
    sound.playFinalCollapseEventAudio(def.eventNumber);
    if (def.eventNumber === 100) {
      sound.playFinalCosmicCollapse();
    } else if (def.priority >= 9) {
      sound.playEmergencyAlarm();
    } else if (def.priority >= 7) {
      sound.playHazardWarning();
    } else {
      sound.playTransmissionBeep();
    }

    // Set non-intrusive player effects
    this.requestedCameraReaction = def.playerEffect.cameraReaction;
    this.requestedGravityAddition = def.playerEffect.gravityReaction;

    // Compute next event distance
    this.calculateNextEvent();

    // Dispatch lightweight alert card notification conforming to structure:
    // ┌─────────────────────────────┐
    // │ EVENT [number]              │
    // │ [title]                     │
    // │ [warning message]           │
    // │ NEXT EVENT: [time]          │
    // └─────────────────────────────┘
    const notif: FinalCollapseEventNotification = {
      eventNumber: def.eventNumber,
      title: def.title,
      countdownDisplay: def.countdownDisplay,
      areaName: def.persistence.whichExistingObjectAffected,
      description: def.shortDescription,
      severity: def.priority,
      secondsUntilNext: this.timeToNextEventSeconds,
      warningMessage: def.alert.warningMessage,
      nextEventTime: def.alert.nextEventTime,
      worldState: this.worldState,
    };

    for (let i = 0; i < this.notificationCallbacks.length; i++) {
      try {
        this.notificationCallbacks[i](notif);
      } catch (err) {
        console.error('Error in FinalCollapseEvent notification callback:', err);
      }
    }
  }

  /**
   * Calculates the upcoming next event and remaining seconds
   */
  private calculateNextEvent(): void {
    let next: FinalCollapseCoreEvent | null = null;
    let minTime = Infinity;

    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.triggerTime > this.elapsedSeconds) {
        if (e.triggerTime < minTime) {
          minTime = e.triggerTime;
          next = e;
        }
      }
    }

    this.nextEvent = next;
    this.timeToNextEventSeconds = next ? Math.max(0, next.triggerTime - this.elapsedSeconds) : 0;
  }

  /**
   * Applies the specific black hole, environment, and civilization reactions for an active effect
   */
  private applyActiveEffectReactions(eff: ActiveEventEffect): void {
    const { event, progress } = eff;

    // A. Apply Civilization reaction (accumulates damage across one persistent world)
    if (this.civilization) {
      this.civilization.applyEventReaction(event.eventNumber, progress);
    }

    // B. Apply Planetary System reactions (ocean world, volcanic fissures, ice rings, gas giant, fragmentation)
    if (this.planetarySystem) {
      this.planetarySystem.update(0, event.eventNumber);
    }

    // C. Apply Neutron Star relativistic flares & magnetic pulses
    if (this.neutronStarSystem && (event.eventNumber === 22 || event.eventNumber === 28 || event.eventNumber === 42 || event.eventNumber === 62 || event.eventNumber === 76 || event.eventNumber >= 90)) {
      if (progress < 0.25) {
        this.neutronStarSystem.triggerMagneticPulse();
      }
    }

    // D. Apply Dynamic Route Graph structural fractures & jump ramp states
    if (this.routeGraph) {
      this.routeGraph.update(0, event.eventNumber);
    }

    // E. Apply Black Hole reaction (progressively unstable from 1 -> 100)
    if (this.blackHoleEnvironment) {
      const bh = this.blackHoleEnvironment;
      const bhEff = event.blackHoleEffect;

      // Base progression across all 100 events
      const baseProgress = Math.min(1.0, (event.eventNumber - 1) / 99);
      bh.setInstability(0.1 + baseProgress * 0.90);
      bh.setThermalShift(baseProgress * 0.95);

      if (bh.centralizedUniforms) {
        // Gravitational lensing strength increases progressively toward Event 100
        const targetLensing = 0.75 + baseProgress * 1.25 + bhEff.intensity * 0.4;
        bh.centralizedUniforms.uLensingStrength.value = THREE.MathUtils.lerp(
          bh.centralizedUniforms.uLensingStrength.value,
          targetLensing,
          0.05
        );

        // Spaghettification parameter increases
        bh.centralizedUniforms.uSpaghettification.value = THREE.MathUtils.lerp(
          bh.centralizedUniforms.uSpaghettification.value,
          baseProgress * 0.95,
          0.05
        );

        // Accretion intensity and turbulence
        bh.centralizedUniforms.uAccretionIntensity.value = 1.0 + baseProgress * 1.5;
      }

      // Gravitational wave trigger on high-severity events
      if (event.priority >= 8 && progress < 0.25) {
        const pulseColor = event.eventNumber >= 80 ? 0xef4444 : event.eventNumber >= 50 ? 0xa855f7 : 0x00f0ff;
        bh.triggerGravitationalWave(0.5 + baseProgress * 1.2, pulseColor);
      }
    }
  }

  /**
   * Telemetry snapshot for HUD and debugging
   */
  public getTelemetry(): {
    currentEventNumber: number;
    currentEventTitle: string;
    countdownDisplay: string;
    areaName: string;
    description: string;
    warningMessage: string;
    nextEventTime?: string;
    secondsUntilNext: number;
    activeEffectsCount: number;
    part1Completed: boolean;
    part2Completed: boolean;
    finalCollapseComplete: boolean;
    civilizationDamageLevel: number;
    civilizationStage: string;
  } {
    return {
      currentEventNumber: this.currentEvent?.eventNumber ?? 1,
      currentEventTitle: this.currentEvent?.title ?? 'Singularity Activation',
      countdownDisplay: this.currentEvent?.countdownDisplay ?? '15:00',
      areaName: this.currentEvent?.persistence.whichExistingObjectAffected ?? 'CENTRAL ACCRETION SECTOR',
      description: this.currentEvent?.shortDescription ?? '',
      warningMessage: this.currentEvent?.alert.warningMessage ?? 'GRAVITATIONAL ANOMALY DETECTED',
      nextEventTime: this.nextEvent?.countdownDisplay,
      secondsUntilNext: Math.round(this.timeToNextEventSeconds),
      activeEffectsCount: this.activeEffects.length,
      part1Completed: this.triggeredEventNumbers.has(33),
      part2Completed: this.triggeredEventNumbers.has(66),
      finalCollapseComplete: this.worldState.finalCollapseComplete,
      civilizationDamageLevel: Math.round(this.worldState.civilizationDamageLevel * 100),
      civilizationStage: this.worldState.civilizationStage,
    };
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.activeEffects = [];
    this.notificationCallbacks = [];
    if (this.civilization) {
      this.civilization.dispose();
      this.civilization = null;
    }
  }
}
