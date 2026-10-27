import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { Mode02NeonCircuitBuilder } from './Mode02NeonCircuitBuilder';
import { Mode03AsteroidRunBuilder } from './Mode03AsteroidRunBuilder';
import { Mode04WormholeExpressBuilder } from './Mode04WormholeExpressBuilder';
import { Mode05SolarStormBuilder } from './Mode05SolarStormBuilder';
import { Mode06GravityFreeBuilder } from './Mode06GravityFreeBuilder';
import { Mode07PlasmaStormBuilder } from './Mode07PlasmaStormBuilder';
import { Mode08SkylineRushBuilder } from './Mode08SkylineRushBuilder';
import { Mode09DebrisSurvivalBuilder } from './Mode09DebrisSurvivalBuilder';
import { Mode10QuantumTimeTrialBuilder } from './Mode10QuantumTimeTrialBuilder';
import { Mode11EnergyHeistBuilder } from './Mode11EnergyHeistBuilder';
import { Mode12DroneAssaultBuilder } from './Mode12DroneAssaultBuilder';
import { Mode13CollapsingTrackBuilder } from './Mode13CollapsingTrackBuilder';
import { Mode14RingRunnerBuilder } from './Mode14RingRunnerBuilder';
import { Mode15HyperspaceSprintBuilder } from './Mode15HyperspaceSprintBuilder';
import { Mode16RivalDuelBuilder } from './Mode16RivalDuelBuilder';
import { Mode17RelayRaceBuilder } from './Mode17RelayRaceBuilder';
import { Mode18SurvivalEliminationBuilder } from './Mode18SurvivalEliminationBuilder';
import { Mode19CosmicTreasureHuntBuilder } from './Mode19CosmicTreasureHuntBuilder';
import { Mode20VoidChampionshipBuilder } from './Mode20VoidChampionshipBuilder';

export * from './BaseModeEnvironmentBuilder';
export * from './Mode02NeonCircuitBuilder';
export * from './Mode03AsteroidRunBuilder';
export * from './Mode04WormholeExpressBuilder';
export * from './Mode05SolarStormBuilder';
export * from './Mode06GravityFreeBuilder';
export * from './Mode07PlasmaStormBuilder';
export * from './Mode08SkylineRushBuilder';
export * from './Mode09DebrisSurvivalBuilder';
export * from './Mode10QuantumTimeTrialBuilder';
export * from './Mode11EnergyHeistBuilder';
export * from './Mode12DroneAssaultBuilder';
export * from './Mode13CollapsingTrackBuilder';
export * from './Mode14RingRunnerBuilder';
export * from './Mode15HyperspaceSprintBuilder';
export * from './Mode16RivalDuelBuilder';
export * from './Mode17RelayRaceBuilder';
export * from './Mode18SurvivalEliminationBuilder';
export * from './Mode19CosmicTreasureHuntBuilder';
export * from './Mode20VoidChampionshipBuilder';

export type ModeEnvironmentBuilderConstructor = new (
  ...args: ConstructorParameters<typeof BaseModeEnvironmentBuilder>
) => BaseModeEnvironmentBuilder;

export const MODE_BUILDERS: Record<string, ModeEnvironmentBuilderConstructor> = {
  NEON_CIRCUIT: Mode02NeonCircuitBuilder,
  ASTEROID_RUN: Mode03AsteroidRunBuilder,
  WORMHOLE_EXPRESS: Mode04WormholeExpressBuilder,
  SOLAR_STORM: Mode05SolarStormBuilder,
  GRAVITY_FREE: Mode06GravityFreeBuilder,
  PLASMA_STORM: Mode07PlasmaStormBuilder,
  SKYLINE_RUSH: Mode08SkylineRushBuilder,
  DEBRIS_SURVIVAL: Mode09DebrisSurvivalBuilder,
  QUANTUM_TIME_TRIAL: Mode10QuantumTimeTrialBuilder,
  ENERGY_HEIST: Mode11EnergyHeistBuilder,
  DRONE_ASSAULT: Mode12DroneAssaultBuilder,
  COLLAPSING_TRACK: Mode13CollapsingTrackBuilder,
  RING_RUNNER: Mode14RingRunnerBuilder,
  HYPERSPACE_SPRINT: Mode15HyperspaceSprintBuilder,
  RIVAL_DUEL: Mode16RivalDuelBuilder,
  RELAY_RACE: Mode17RelayRaceBuilder,
  SURVIVAL_ELIMINATION: Mode18SurvivalEliminationBuilder,
  COSMIC_TREASURE_HUNT: Mode19CosmicTreasureHuntBuilder,
  VOID_CHAMPIONSHIP: Mode20VoidChampionshipBuilder,
};
