import { GameMode } from '../../types';

export interface ModePhysicsProfile {
  topSpeedMultiplier: number;
  accelerationMultiplier: number;
  handlingMultiplier: number;
  driftGrip: number;
  driftBoostBonus: number;
  momentumRetention: number; // 0.0 to 1.0 (Zero-G has high retention)
  passiveDeceleration: number;
  barrierDamageMultiplier: number;
  reverseAllowed: boolean;
}

export interface ModeGameplayRules {
  totalLaps: number;
  goldTargetMs?: number;
  silverTargetMs?: number;
  bronzeTargetMs?: number;
  hasHeatAccumulation?: boolean;
  maxHeat?: number;
  heatDissipationRate?: number;
  hasZeroGMomentum?: boolean;
  hasStormDischarges?: boolean;
  hasDebrisStream?: boolean;
  hasTrafficDrones?: boolean;
  hasPrecisionSplitTiming?: boolean;
  eliminationIntervalSec?: number;
}

export interface ModeShortcutDef {
  id: string;
  name: string;
  subtitle: string;
  entrySplineT: number;
  exitSplineT: number;
  lateralOffset: number; // meters from centerline
  elevationOffset: number; // 3D flyover or dive
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  speedBonusKmH: number;
  boostRefillPercent: number;
  description: string;
}

export interface ModeDefinition {
  modeId: GameMode;
  modeNumber: number;
  displayName: string;
  subtitle: string;
  loreDescription: string;
  objectiveText: string;
  physicsProfile: ModePhysicsProfile;
  rules: ModeGameplayRules;
  shortcuts: ModeShortcutDef[];
}

export const MODE_REGISTRY: Record<string, ModeDefinition> = {
  // =========================================================================
  // MODE 01 — SINGULARITY RUN
  // =========================================================================
  SINGULARITY_RUN: {
    modeId: 'SINGULARITY_RUN',
    modeNumber: 1,
    displayName: '01 — SINGULARITY RUN',
    subtitle: 'EVENT HORIZON ESCAPE',
    loreDescription: 'Escape the gravitational collapse of a supermassive singularity while navigating high-speed cosmic debris and energy ribbons.',
    objectiveText: 'OUTRUN THE EVENT HORIZON & REACH CRITICAL ESCAPE VELOCITY',
    physicsProfile: {
      topSpeedMultiplier: 1.15,
      accelerationMultiplier: 1.2,
      handlingMultiplier: 1.1,
      driftGrip: 1.2,
      driftBoostBonus: 1.3,
      momentumRetention: 0.8,
      passiveDeceleration: 10.0,
      barrierDamageMultiplier: 1.2,
      reverseAllowed: false,
    },
    rules: {
      totalLaps: 1,
      hasZeroGMomentum: true,
    },
    shortcuts: [
      {
        id: 'singularity_gravitational_slingshot',
        name: 'GRAVITATIONAL SLINGSHOT ARC',
        subtitle: 'RELATIVISTIC BYPASS',
        entrySplineT: 0.35,
        exitSplineT: 0.50,
        lateralOffset: -15.0,
        elevationOffset: 10.0,
        riskLevel: 'EXTREME',
        speedBonusKmH: 70,
        boostRefillPercent: 100,
        description: 'Dangerous orbital vector cutting close to the accretion disk yielding colossal kinetic momentum.',
      },
    ],
  },

  // =========================================================================
  // MODE 02 — NEON CIRCUIT
  // =========================================================================
  NEON_CIRCUIT: {
    modeId: 'NEON_CIRCUIT',
    modeNumber: 2,
    displayName: '02 — NEON CIRCUIT',
    subtitle: 'CYBER CITY ORBIT',
    loreDescription: 'High-altitude multi-lane skyways threading megacity skyscrapers with sharp corners and holographic shortcuts.',
    objectiveText: 'OUTMANEUVER RIVALS & SECURE PODIUM FINISH',
    physicsProfile: {
      topSpeedMultiplier: 1.08,
      accelerationMultiplier: 1.12,
      handlingMultiplier: 1.25,
      driftGrip: 1.35,
      driftBoostBonus: 1.4,
      momentumRetention: 0.65,
      passiveDeceleration: 12.0,
      barrierDamageMultiplier: 1.0,
      reverseAllowed: true,
    },
    rules: {
      totalLaps: 2,
      hasTrafficDrones: true,
    },
    shortcuts: [
      {
        id: 'neon_elevated_overpass',
        name: 'HIGH-ALTITUDE NEON OVERPASS',
        subtitle: 'ELEVATED BYPASS // CHICANE SKIP',
        entrySplineT: 0.32,
        exitSplineT: 0.44,
        lateralOffset: -12.0,
        elevationOffset: 8.0,
        riskLevel: 'MEDIUM',
        speedBonusKmH: 40,
        boostRefillPercent: 50,
        description: 'Elevated bypass arch skipping the dangerous tower chicane with direct boost pads.',
      },
      {
        id: 'neon_underpass_slot',
        name: 'SUB-LEVEL BOOST CONDUIT',
        subtitle: 'NARROW UNDERPASS',
        entrySplineT: 0.68,
        exitSplineT: 0.80,
        lateralOffset: 14.0,
        elevationOffset: -6.0,
        riskLevel: 'HIGH',
        speedBonusKmH: 55,
        boostRefillPercent: 75,
        description: 'Low-profile maintenance conduit packed with triple boost pads.',
      },
    ],
  },

  // =========================================================================
  // MODE 03 — ASTEROID RUN
  // =========================================================================
  ASTEROID_RUN: [
    {
      // Defined below
    } as any,
  ] as any,
};

// Properly typed complete definitions for Modes 02 to 10:
MODE_REGISTRY.ASTEROID_RUN = {
  modeId: 'ASTEROID_RUN',
  modeNumber: 3,
  displayName: '03 — ASTEROID RUN',
  subtitle: 'VESTA TRENCH MINING REGION',
  loreDescription: 'Navigable 3D asteroid field filled with tumbling iron megaliths, mining extraction rigs, and narrow corridors.',
  objectiveText: 'SURVIVE ASTEROID GAUNTLET & FIRE DESTRUCTION BEAMS',
  physicsProfile: {
    topSpeedMultiplier: 0.98,
    accelerationMultiplier: 1.05,
    handlingMultiplier: 0.95,
    driftGrip: 0.85,
    driftBoostBonus: 1.1,
    momentumRetention: 0.80,
    passiveDeceleration: 9.0,
    barrierDamageMultiplier: 1.3,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasDebrisStream: true,
  },
  shortcuts: [
    {
      id: 'asteroid_mining_shaft',
      name: 'HOLLOW ASTEROID SHAFT',
      subtitle: 'INTERIOR EXCAVATION TUBE',
      entrySplineT: 0.28,
      exitSplineT: 0.42,
      lateralOffset: 16.0,
      elevationOffset: 4.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 45,
      boostRefillPercent: 60,
      description: 'Excavated core tunnel slicing straight through a 200m hollow iron asteroid.',
    },
    {
      id: 'asteroid_gravity_crevasse',
      name: 'DEEP CREVASSE CUT',
      subtitle: 'SUB-ORE FLYTHROUGH',
      entrySplineT: 0.72,
      exitSplineT: 0.85,
      lateralOffset: -14.0,
      elevationOffset: -8.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 60,
      boostRefillPercent: 80,
      description: 'Narrow canyon floor bypass avoiding tumbling boulders at high collision risk.',
    },
  ],
};

MODE_REGISTRY.WORMHOLE_EXPRESS = {
  modeId: 'WORMHOLE_EXPRESS',
  modeNumber: 4,
  displayName: '04 — WORMHOLE EXPRESS',
  subtitle: 'SUBSPACE CONDUIT ZERO',
  loreDescription: 'Linked Einstein-Rosen spatial apertures creating hyper-speed warp conduits and temporal slipstreams.',
  objectiveText: 'TRAVERSE SUBSPACE PORTALS AT MAXIMUM WARP VELOCITY',
  physicsProfile: {
    topSpeedMultiplier: 1.25,
    accelerationMultiplier: 1.35,
    handlingMultiplier: 1.10,
    driftGrip: 1.20,
    driftBoostBonus: 1.5,
    momentumRetention: 0.75,
    passiveDeceleration: 6.0,
    barrierDamageMultiplier: 1.1,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
  },
  shortcuts: [
    {
      id: 'wormhole_slipstream_fold',
      name: 'TACHYON SLIPSTREAM FOLD',
      subtitle: 'SUBSPACE FOLD // INSTANT TRANSIT',
      entrySplineT: 0.24,
      exitSplineT: 0.38,
      lateralOffset: -10.0,
      elevationOffset: 6.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 65,
      boostRefillPercent: 100,
      description: 'Stabilized secondary warp fold jumping 14% of the track distance.',
    },
    {
      id: 'wormhole_dimension_rift',
      name: 'CHROMATIC RIFT NEXUS',
      subtitle: 'WARP CORE BYPASS',
      entrySplineT: 0.65,
      exitSplineT: 0.80,
      lateralOffset: 15.0,
      elevationOffset: -5.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 75,
      boostRefillPercent: 100,
      description: 'Supercharged chromatic tunnel providing pure continuous acceleration.',
    },
  ],
};

MODE_REGISTRY.SOLAR_STORM = {
  modeId: 'SOLAR_STORM',
  modeNumber: 5,
  displayName: '05 — SOLAR STORM',
  subtitle: 'HELIOS CORONA PERIHELION',
  loreDescription: 'Near-star orbital facility subjected to intense coronal mass ejections, requiring active thermal management.',
  objectiveText: 'MANAGE HEAT ACCUMULATION & SURF CORONAL ERUPTIONS',
  physicsProfile: {
    topSpeedMultiplier: 1.05,
    accelerationMultiplier: 1.10,
    handlingMultiplier: 1.00,
    driftGrip: 0.95,
    driftBoostBonus: 1.2,
    momentumRetention: 0.70,
    passiveDeceleration: 11.0,
    barrierDamageMultiplier: 1.2,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasHeatAccumulation: true,
    maxHeat: 100,
    heatDissipationRate: 8.0,
  },
  shortcuts: [
    {
      id: 'solar_coronal_surf',
      name: 'UNSHIELDED CORONAL ARC',
      subtitle: 'HIGH-RISK THERMAL SURF',
      entrySplineT: 0.35,
      exitSplineT: 0.48,
      lateralOffset: 18.0,
      elevationOffset: 10.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 70,
      boostRefillPercent: 100,
      description: 'Unprotected perimeter loop with maximum boost but rapid heat buildup.',
    },
    {
      id: 'solar_coolant_trench',
      name: 'SUBTERRANEAN COOLANT TRENCH',
      subtitle: 'THERMAL SHIELDED CORRIDOR',
      entrySplineT: 0.64,
      exitSplineT: 0.78,
      lateralOffset: -16.0,
      elevationOffset: -8.0,
      riskLevel: 'LOW',
      speedBonusKmH: 25,
      boostRefillPercent: 40,
      description: 'Deep refrigerated bunker trench providing total immunity from solar flares.',
    },
  ],
};

MODE_REGISTRY.GRAVITY_FREE = {
  modeId: 'GRAVITY_FREE',
  modeNumber: 6,
  displayName: '06 — GRAVITY FREE',
  subtitle: 'CENTRIFUGE ZERO-G TESTING BAY',
  loreDescription: 'Zero-gravity orbital testing environment featuring momentum-based flight, inverted loops, and floating platforms.',
  objectiveText: 'EXECUTE 3D AEROBATICS & PRESERVE INERTIAL MOMENTUM',
  physicsProfile: {
    topSpeedMultiplier: 1.15,
    accelerationMultiplier: 1.18,
    handlingMultiplier: 1.35,
    driftGrip: 0.60, // Smooth slide
    driftBoostBonus: 1.6,
    momentumRetention: 0.96, // Maximum momentum retention
    passiveDeceleration: 3.5, // Floats effortlessly
    barrierDamageMultiplier: 0.85,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasZeroGMomentum: true,
  },
  shortcuts: [
    {
      id: 'zero_g_floating_ring_arc',
      name: 'SUSPENDED RING APEX',
      subtitle: 'AERIAL ACROBATIC CUT',
      entrySplineT: 0.28,
      exitSplineT: 0.42,
      lateralOffset: 0.0,
      elevationOffset: 24.0, // High vertical loop
      riskLevel: 'HIGH',
      speedBonusKmH: 50,
      boostRefillPercent: 80,
      description: 'High vertical loop threading floating gyroscope rings above the track plane.',
    },
    {
      id: 'zero_g_core_void',
      name: 'STATION CORE TRANSIT',
      subtitle: 'CENTRIFUGE AXIS SHORTCUT',
      entrySplineT: 0.68,
      exitSplineT: 0.82,
      lateralOffset: -15.0,
      elevationOffset: 6.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 55,
      boostRefillPercent: 75,
      description: 'Direct trajectory along the central zero-gravity rotational axis.',
    },
  ],
};

MODE_REGISTRY.PLASMA_STORM = {
  modeId: 'PLASMA_STORM',
  modeNumber: 7,
  displayName: '07 — PLASMA STORM',
  subtitle: 'MAGNETAR INDUSTRIAL REFINERY',
  loreDescription: 'Volatile electromagnetic refinery subject to advancing plasma storm walls, electric arcs, and conductive track grids.',
  objectiveText: 'OUTRUN ADVANCING STORM WALL & EVADE LIGHTNING ARCS',
  physicsProfile: {
    topSpeedMultiplier: 1.08,
    accelerationMultiplier: 1.15,
    handlingMultiplier: 1.10,
    driftGrip: 1.05,
    driftBoostBonus: 1.3,
    momentumRetention: 0.70,
    passiveDeceleration: 10.0,
    barrierDamageMultiplier: 1.25,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasStormDischarges: true,
  },
  shortcuts: [
    {
      id: 'plasma_generator_vent',
      name: 'CORE GENERATOR EXHAUST',
      subtitle: 'SUPERCHARGED CONDUIT',
      entrySplineT: 0.38,
      exitSplineT: 0.52,
      lateralOffset: 15.0,
      elevationOffset: 5.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 65,
      boostRefillPercent: 90,
      description: 'Direct vent through the magnetic pinch reactor with continuous electrical turbo.',
    },
    {
      id: 'plasma_insulated_pipe',
      name: 'CERAMIC GROUNDING PIPE',
      subtitle: 'INSULATED BYPASS',
      entrySplineT: 0.74,
      exitSplineT: 0.86,
      lateralOffset: -12.0,
      elevationOffset: -4.0,
      riskLevel: 'LOW',
      speedBonusKmH: 30,
      boostRefillPercent: 40,
      description: 'Thick ceramic pipe completely shielded from plasma lightning strikes.',
    },
  ],
};

MODE_REGISTRY.SKYLINE_RUSH = {
  modeId: 'SKYLINE_RUSH',
  modeNumber: 8,
  displayName: '08 — SKYLINE RUSH',
  subtitle: 'NEO-CORUSCANT METROPOLIS',
  loreDescription: 'Multi-tiered megacity rooftop circuit featuring vertical skyscraper canyons, glass skybridges, and daring 200m chasm leaps.',
  objectiveText: 'STICK ROOFTOP LEAPS & OUTRACE URBAN AIR TRAFFIC',
  physicsProfile: {
    topSpeedMultiplier: 1.12,
    accelerationMultiplier: 1.20,
    handlingMultiplier: 1.30,
    driftGrip: 1.40,
    driftBoostBonus: 1.5,
    momentumRetention: 0.75,
    passiveDeceleration: 11.5,
    barrierDamageMultiplier: 1.15,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasTrafficDrones: true,
  },
  shortcuts: [
    {
      id: 'skyline_heli_jump',
      name: 'HELIPAD ROOFTOP JUMP',
      subtitle: 'TOWER ROOF LEAP',
      entrySplineT: 0.24,
      exitSplineT: 0.38,
      lateralOffset: -14.0,
      elevationOffset: 12.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 60,
      boostRefillPercent: 80,
      description: 'High-speed rooftop jump skipping lower highway congestion entirely.',
    },
    {
      id: 'skyline_spire_express',
      name: 'SUSPENDED GLASS SKYBRIDGE',
      subtitle: 'HIGH-ALTITUDE EXPRESSWAY',
      entrySplineT: 0.62,
      exitSplineT: 0.76,
      lateralOffset: 12.0,
      elevationOffset: 8.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 45,
      boostRefillPercent: 60,
      description: 'Transparent skybridge suspended between twin corporate spires.',
    },
  ],
};

MODE_REGISTRY.DEBRIS_SURVIVAL = {
  modeId: 'DEBRIS_SURVIVAL',
  modeNumber: 9,
  displayName: '09 — DEBRIS SURVIVAL',
  subtitle: 'ORBITAL FLEET GRAVEYARD',
  loreDescription: 'Damaged orbital wreckage field containing shattered capital ship hulls, explosive tanks, and tumbling station trusses.',
  objectiveText: 'SURVIVE EXPANDING DEBRIS WAVES & CLEAR WRECKAGE GAPS',
  physicsProfile: {
    topSpeedMultiplier: 0.95,
    accelerationMultiplier: 1.05,
    handlingMultiplier: 1.05,
    driftGrip: 1.00,
    driftBoostBonus: 1.2,
    momentumRetention: 0.85,
    passiveDeceleration: 8.5,
    barrierDamageMultiplier: 1.4,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasDebrisStream: true,
  },
  shortcuts: [
    {
      id: 'debris_carrier_hangar',
      name: 'DERELICT CARRIER FLIGHT DECK',
      subtitle: 'HOLLOW SHIP FLYTHROUGH',
      entrySplineT: 0.32,
      exitSplineT: 0.46,
      lateralOffset: -15.0,
      elevationOffset: 2.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 50,
      boostRefillPercent: 70,
      description: 'Fly directly through the hollow launch tube of a shattered dreadnought.',
    },
    {
      id: 'debris_salvage_gap',
      name: 'SALVAGE CORRIDOR BREACH',
      subtitle: 'NARROW TITANIUM GAP',
      entrySplineT: 0.70,
      exitSplineT: 0.84,
      lateralOffset: 14.0,
      elevationOffset: -6.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 65,
      boostRefillPercent: 90,
      description: 'Supersonic gap between two colliding hull fragments.',
    },
  ],
};

MODE_REGISTRY.QUANTUM_TIME_TRIAL = {
  modeId: 'QUANTUM_TIME_TRIAL',
  modeNumber: 10,
  displayName: '10 — QUANTUM TIME TRIAL',
  subtitle: 'CHRONO RESEARCH INSTITUTE',
  loreDescription: 'Dedicated solo precision time-attack facility with holographic timing gates, live delta telemetry, and clean-line bonuses.',
  objectiveText: 'BEAT GOLD TARGET <45.000s & THREAD PRECISION CHRONO GATES',
  physicsProfile: {
    topSpeedMultiplier: 1.15,
    accelerationMultiplier: 1.22,
    handlingMultiplier: 1.35,
    driftGrip: 1.40,
    driftBoostBonus: 1.5,
    momentumRetention: 0.70,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.5, // Strict penalty for collisions
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
    goldTargetMs: 45000,
    silverTargetMs: 52000,
    bronzeTargetMs: 60000,
    hasPrecisionSplitTiming: true,
  },
  shortcuts: [
    {
      id: 'chrono_precision_slit',
      name: 'QUANTUM BONUS SLIT',
      subtitle: 'TIME DEDUCTION APEX (-2.5s)',
      entrySplineT: 0.30,
      exitSplineT: 0.42,
      lateralOffset: -8.0,
      elevationOffset: 4.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 35,
      boostRefillPercent: 100,
      description: 'Extremely narrow precision gate that deducts -2.5 seconds from final race time.',
    },
    {
      id: 'chrono_superluminal_cut',
      name: 'CHRONO APEX LINE',
      subtitle: 'PERFECT RACING LINE',
      entrySplineT: 0.65,
      exitSplineT: 0.78,
      lateralOffset: 10.0,
      elevationOffset: -3.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 50,
      boostRefillPercent: 80,
      description: 'Ideal aerodynamic curvature providing maximum exit speed.',
    },
  ],
};

// =========================================================================
// MODE 11 — ENERGY HEIST
// =========================================================================
MODE_REGISTRY.ENERGY_HEIST = {
  modeId: 'ENERGY_HEIST',
  modeNumber: 11,
  displayName: '11 — ENERGY HEIST',
  subtitle: 'ORBITAL VAULT PENETRATION',
  loreDescription: 'Armored orbital energy vault facility with heavy laser grids, surveillance radars, and high-value radioactive core canisters.',
  objectiveText: 'EXTRACT 10 ENERGY CORES & REACH VAULT EVACUATION INLET',
  physicsProfile: {
    topSpeedMultiplier: 1.05,
    accelerationMultiplier: 1.10,
    handlingMultiplier: 1.15,
    driftGrip: 1.30,
    driftBoostBonus: 1.35,
    momentumRetention: 0.60,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.2,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
    hasTrafficDrones: true,
  },
  shortcuts: [
    {
      id: 'vault_vent_bypass',
      name: 'VENTILATION CONDUIT BYPASS',
      subtitle: 'SUB-LEVEL VAULT ACCESS',
      entrySplineT: 0.28,
      exitSplineT: 0.42,
      lateralOffset: -10.0,
      elevationOffset: -5.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 45,
      boostRefillPercent: 80,
      description: 'Narrow maintenance conduit cutting through vault security bulkheads.',
    },
  ],
};

// =========================================================================
// MODE 12 — DRONE ASSAULT
// =========================================================================
MODE_REGISTRY.DRONE_ASSAULT = {
  modeId: 'DRONE_ASSAULT',
  modeNumber: 12,
  displayName: '12 — DRONE ASSAULT',
  subtitle: 'AUTONOMOUS COMBAT TEST RANGE',
  loreDescription: 'Heavily fortified drone proving ground with automated launch hangars, interceptor swarms, and active scanning radars.',
  objectiveText: 'SURVIVE COMBAT DRONE WAVES & OUTRUN AIR DEFENSE MATRIX',
  physicsProfile: {
    topSpeedMultiplier: 1.10,
    accelerationMultiplier: 1.18,
    handlingMultiplier: 1.25,
    driftGrip: 1.35,
    driftBoostBonus: 1.40,
    momentumRetention: 0.65,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.1,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
    hasTrafficDrones: true,
  },
  shortcuts: [
    {
      id: 'hangar_service_trench',
      name: 'LAUNCH HANGAR TRENCH',
      subtitle: 'RADAR-EVADING SERVICE BAY',
      entrySplineT: 0.35,
      exitSplineT: 0.48,
      lateralOffset: 12.0,
      elevationOffset: -4.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 50,
      boostRefillPercent: 85,
      description: 'Low-altitude trench evading combat radar detection sweeps.',
    },
  ],
};

// =========================================================================
// MODE 13 — COLLAPSING TRACK
// =========================================================================
MODE_REGISTRY.COLLAPSING_TRACK = {
  modeId: 'COLLAPSING_TRACK',
  modeNumber: 13,
  displayName: '13 — COLLAPSING TRACK',
  subtitle: 'TECTONIC INDUSTRIAL FAILURE',
  loreDescription: 'Catastrophic structural failure across a fractured industrial complex with tilting road plates and falling debris.',
  objectiveText: 'OUTRUN DISINTEGRATING ROAD PLATES BEFORE TOTAL COLLAPSE',
  physicsProfile: {
    topSpeedMultiplier: 1.12,
    accelerationMultiplier: 1.20,
    handlingMultiplier: 1.30,
    driftGrip: 1.40,
    driftBoostBonus: 1.50,
    momentumRetention: 0.70,
    passiveDeceleration: 10.0,
    barrierDamageMultiplier: 1.3,
    reverseAllowed: false,
  },
  rules: {
    totalLaps: 2,
    hasDebrisStream: true,
  },
  shortcuts: [
    {
      id: 'emergency_rebar_span',
      name: 'EMERGENCY REINFORCEMENT SPAN',
      subtitle: 'NARROW CABLE RUN',
      entrySplineT: 0.40,
      exitSplineT: 0.54,
      lateralOffset: -14.0,
      elevationOffset: 6.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 60,
      boostRefillPercent: 100,
      description: 'Dangerous temporary cable span bypassing the collapsed main highway.',
    },
  ],
};

// =========================================================================
// MODE 14 — RING RUNNER
// =========================================================================
MODE_REGISTRY.RING_RUNNER = {
  modeId: 'RING_RUNNER',
  modeNumber: 14,
  displayName: '14 — RING RUNNER',
  subtitle: 'CONCENTRIC ORBITAL COMPLEX',
  loreDescription: 'Colossal concentric orbital ring installation hovering over planetary cloud layers with high-speed pass-through hoops.',
  objectiveText: 'THREAD ALL ORBITAL HOOPS & MAINTAIN APEX CENTRIFUGAL SPEED',
  physicsProfile: {
    topSpeedMultiplier: 1.15,
    accelerationMultiplier: 1.15,
    handlingMultiplier: 1.30,
    driftGrip: 1.45,
    driftBoostBonus: 1.45,
    momentumRetention: 0.75,
    passiveDeceleration: 11.0,
    barrierDamageMultiplier: 1.0,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
  },
  shortcuts: [
    {
      id: 'inner_ring_conduit',
      name: 'INNER RING ACCELERATOR',
      subtitle: 'CENTRIFUGAL SHORTCUT',
      entrySplineT: 0.30,
      exitSplineT: 0.45,
      lateralOffset: -10.0,
      elevationOffset: 8.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 45,
      boostRefillPercent: 75,
      description: 'Inner radius transit loop providing higher centrifugal acceleration.',
    },
  ],
};

// =========================================================================
// MODE 15 — HYPERSPACE SPRINT
// =========================================================================
MODE_REGISTRY.HYPERSPACE_SPRINT = {
  modeId: 'HYPERSPACE_SPRINT',
  modeNumber: 15,
  displayName: '15 — HYPERSPACE SPRINT',
  subtitle: 'SUPERLUMINAL TRANSIT CORRIDOR',
  loreDescription: 'Enormous enclosed tunnel raceway lined with repeating hexagonal frames engineered for pure superluminal top speeds.',
  objectiveText: 'MAINTAIN MAXIMUM HYPER-BOOST VELOCITY THROUGH SPEED GATES',
  physicsProfile: {
    topSpeedMultiplier: 1.25,
    accelerationMultiplier: 1.30,
    handlingMultiplier: 1.20,
    driftGrip: 1.35,
    driftBoostBonus: 1.60,
    momentumRetention: 0.80,
    passiveDeceleration: 8.0,
    barrierDamageMultiplier: 1.4,
    reverseAllowed: false,
  },
  rules: {
    totalLaps: 1,
    hasPrecisionSplitTiming: true,
  },
  shortcuts: [
    {
      id: 'warp_compression_tube',
      name: 'WARP COMPRESSION TUBE',
      subtitle: 'SUPERSYMMETRY LANE',
      entrySplineT: 0.45,
      exitSplineT: 0.60,
      lateralOffset: 8.0,
      elevationOffset: 0.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 70,
      boostRefillPercent: 100,
      description: 'Extreme acceleration tube maximizing velocity throughput.',
    },
  ],
};

// =========================================================================
// MODE 16 — RIVAL DUEL
// =========================================================================
MODE_REGISTRY.RIVAL_DUEL = {
  modeId: 'RIVAL_DUEL',
  modeNumber: 16,
  displayName: '16 — RIVAL DUEL',
  subtitle: 'COLISEUM ARENA DOGFIGHT',
  loreDescription: 'High-stakes head-to-head stadium duel against an elite rival pilot across elevated overtaking lanes and tactical ramps.',
  objectiveText: 'DEFEAT RIVAL ACE IN 1v1 HEAD-TO-HEAD SPEED SHOWDOWN',
  physicsProfile: {
    topSpeedMultiplier: 1.10,
    accelerationMultiplier: 1.20,
    handlingMultiplier: 1.35,
    driftGrip: 1.45,
    driftBoostBonus: 1.50,
    momentumRetention: 0.70,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.0,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
  },
  shortcuts: [
    {
      id: 'duel_overtake_ramp',
      name: 'TACTICAL OVERTAKE FLYOVER',
      subtitle: 'HIGH-ALTITUDE OVERPASS',
      entrySplineT: 0.32,
      exitSplineT: 0.44,
      lateralOffset: -12.0,
      elevationOffset: 10.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 40,
      boostRefillPercent: 90,
      description: 'Elevated jump ramp allowing clean air overtaking above the rival ship.',
    },
  ],
};

// =========================================================================
// MODE 17 — RELAY RACE
// =========================================================================
MODE_REGISTRY.RELAY_RACE = {
  modeId: 'RELAY_RACE',
  modeNumber: 17,
  displayName: '17 — RELAY RACE',
  subtitle: 'SECTOR ENERGY TRANSMISSION COMPLEX',
  loreDescription: 'Multi-sector orbital relay facility connecting distinct industrial districts with high-voltage baton exchange gates.',
  objectiveText: 'EXECUTE CLEAN SECTOR BATON HANDOFFS AT TOP SPEED',
  physicsProfile: {
    topSpeedMultiplier: 1.12,
    accelerationMultiplier: 1.15,
    handlingMultiplier: 1.25,
    driftGrip: 1.35,
    driftBoostBonus: 1.40,
    momentumRetention: 0.65,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.1,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
  },
  shortcuts: [
    {
      id: 'relay_express_conduit',
      name: 'INTER-SECTOR EXPRESS TUBE',
      subtitle: 'DIRECT BATON CORRIDOR',
      entrySplineT: 0.50,
      exitSplineT: 0.65,
      lateralOffset: 10.0,
      elevationOffset: -4.0,
      riskLevel: 'MEDIUM',
      speedBonusKmH: 45,
      boostRefillPercent: 80,
      description: 'Dedicated transit conduit cutting between sector transfer towers.',
    },
  ],
};

// =========================================================================
// MODE 18 — SURVIVAL ELIMINATION
// =========================================================================
MODE_REGISTRY.SURVIVAL_ELIMINATION = {
  modeId: 'SURVIVAL_ELIMINATION',
  modeNumber: 18,
  displayName: '18 — SURVIVAL ELIMINATION',
  subtitle: 'PROGRESSIVE KNOCKOUT ARENA',
  loreDescription: 'Hostile floating arena with timed knockout phases eliminating the last-place craft every 30 seconds until one survivor remains.',
  objectiveText: 'STAY AHEAD OF ELIMINATION TIMER & OUTLAST ALL OPPONENTS',
  physicsProfile: {
    topSpeedMultiplier: 1.12,
    accelerationMultiplier: 1.22,
    handlingMultiplier: 1.30,
    driftGrip: 1.40,
    driftBoostBonus: 1.45,
    momentumRetention: 0.70,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.2,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
    eliminationIntervalSec: 30,
  },
  shortcuts: [
    {
      id: 'survival_apex_chute',
      name: 'KNOCKOUT SURVIVAL CHUTE',
      subtitle: 'HIGH-RISK POSITION SAVER',
      entrySplineT: 0.25,
      exitSplineT: 0.38,
      lateralOffset: -12.0,
      elevationOffset: 6.0,
      riskLevel: 'EXTREME',
      speedBonusKmH: 55,
      boostRefillPercent: 100,
      description: 'Perilous narrow cut preventing last-place elimination.',
    },
  ],
};

// =========================================================================
// MODE 19 — COSMIC TREASURE HUNT
// =========================================================================
MODE_REGISTRY.COSMIC_TREASURE_HUNT = {
  modeId: 'COSMIC_TREASURE_HUNT',
  modeNumber: 19,
  displayName: '19 — COSMIC TREASURE HUNT',
  subtitle: 'PRECURSOR ALIEN RUINS',
  loreDescription: 'Monumental ancient civilization complex with carved megaliths, floating crystal obelisks, and secret relic vaults.',
  objectiveText: 'COLLECT ANCIENT PRECURSOR ARTIFACTS & UNLOCK SANCTUM GATE',
  physicsProfile: {
    topSpeedMultiplier: 1.08,
    accelerationMultiplier: 1.12,
    handlingMultiplier: 1.25,
    driftGrip: 1.35,
    driftBoostBonus: 1.40,
    momentumRetention: 0.65,
    passiveDeceleration: 12.0,
    barrierDamageMultiplier: 1.0,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 2,
  },
  shortcuts: [
    {
      id: 'precursor_crypt_passage',
      name: 'HIDDEN CRYPT PASSAGE',
      subtitle: 'RELIC VAULT CORRIDOR',
      entrySplineT: 0.32,
      exitSplineT: 0.46,
      lateralOffset: 14.0,
      elevationOffset: -6.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 45,
      boostRefillPercent: 90,
      description: 'Hidden stone chamber containing ancient score artifacts.',
    },
  ],
};

// =========================================================================
// MODE 20 — VOID CHAMPIONSHIP
// =========================================================================
MODE_REGISTRY.VOID_CHAMPIONSHIP = {
  modeId: 'VOID_CHAMPIONSHIP',
  modeNumber: 20,
  displayName: '20 — VOID CHAMPIONSHIP',
  subtitle: 'PREMIER GRAND PRIX COLISEUM',
  loreDescription: 'The pinnacle cosmic racing venue featuring monumental triumph arches, grandstand coliseums, and championship-tier course architecture.',
  objectiveText: 'WIN THE PREMIER VOID CHAMPIONSHIP & CLAIM THE GOLDEN LAUREL',
  physicsProfile: {
    topSpeedMultiplier: 1.18,
    accelerationMultiplier: 1.25,
    handlingMultiplier: 1.35,
    driftGrip: 1.45,
    driftBoostBonus: 1.55,
    momentumRetention: 0.75,
    passiveDeceleration: 11.0,
    barrierDamageMultiplier: 1.1,
    reverseAllowed: true,
  },
  rules: {
    totalLaps: 3,
    goldTargetMs: 42000,
    silverTargetMs: 48000,
    bronzeTargetMs: 56000,
    hasPrecisionSplitTiming: true,
  },
  shortcuts: [
    {
      id: 'championship_podium_line',
      name: 'CHAMPIONSHIP APEX LINE',
      subtitle: 'POLE POSITION ARC',
      entrySplineT: 0.35,
      exitSplineT: 0.48,
      lateralOffset: -10.0,
      elevationOffset: 5.0,
      riskLevel: 'HIGH',
      speedBonusKmH: 50,
      boostRefillPercent: 100,
      description: 'Precision racing line threading between stadium support pylons.',
    },
  ],
};

export function getModeDefinition(mode: GameMode | string): ModeDefinition | null {
  return MODE_REGISTRY[mode] || null;
}

