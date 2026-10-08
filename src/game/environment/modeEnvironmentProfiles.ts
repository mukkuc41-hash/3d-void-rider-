import { GameMode } from '../../types';

export interface ModeEnvironmentProfile {
  modeId: GameMode;
  modeNumber: number;
  environmentId: string;
  worldType: string;
  displayName: string;
  themeDescription: string;
  trackArchitecture: string;
  structureSet: string[];
  scenerySet: string[];
  propSet: string[];
  hazardSet: string[];
  routeStyle: string;
  backgroundSet: string[];
  atmosphere: {
    fogColor: number;
    fogDensity: number;
    dustColor: number;
    skyboxTheme: string;
  };
  lighting: {
    ambientColor: number;
    ambientIntensity: number;
    sunColor: number;
    sunIntensity: number;
    sunPosition: [number, number, number];
    accentColor: number;
  };
  sky: {
    starCount: number;
    starColor: number;
    nebulaColors: [string, string, string];
    celestialFeature: string;
  };
  environmentalEffects: string[];
  gameplayInteractions: string[];
}

export function resolveCanonicalMode(mode: GameMode | string): GameMode {
  switch (mode) {
    case 'GRAND_PRIX':
    case 'STANDARD':
      return 'NEON_CIRCUIT';
    case 'TIME_TRIAL':
      return 'QUANTUM_TIME_TRIAL';
    case 'SURVIVAL':
      return 'DEBRIS_SURVIVAL';
    case 'ELIMINATION':
    case 'ELIMINATOR':
      return 'SURVIVAL_ELIMINATION';
    case 'DUEL':
      return 'RIVAL_DUEL';
    case 'ENDURANCE':
      return 'SOLAR_STORM';
    case 'CHALLENGE':
      return 'ENERGY_HEIST';
    case 'FREE_RIDE':
      return 'GRAVITY_FREE';
    default:
      return mode as GameMode;
  }
}

export const MODE_ENVIRONMENT_PROFILES: Record<string, ModeEnvironmentProfile> = {
  // MODE 01 — PROTECTED: SINGULARITY RUN
  SINGULARITY_RUN: {
    modeId: 'SINGULARITY_RUN',
    modeNumber: 1,
    environmentId: 'ENV_01_SINGULARITY_CORE',
    worldType: 'SUPERMASSIVE_BLACK_HOLE_EVENT_HORIZON',
    displayName: 'Singularity Run // Kerr Black Hole',
    themeDescription: 'The original protected Singularity Run environment with Sgr A* accretion disk and gravity well.',
    trackArchitecture: 'Curved Relativistic Slingshot Ribbons',
    structureSet: ['Accretion Rim Girders', 'Event Horizon Spires', 'Slingshot Gates'],
    scenerySet: ['Swirling Kerr Accretion Disk', 'Photon Sphere Slingshot', 'Dark Matter Jets'],
    propSet: ['Hawking Radiation Beacons', 'Slingshot Sensors'],
    hazardSet: ['Tidal Gravitational Shear', 'Event Horizon Pull', 'Relativistic Compression'],
    routeStyle: 'Deep Space Gravitational Slingshot Arc',
    backgroundSet: ['Singularity Abyss', 'Gravitational Lens Distortions'],
    atmosphere: {
      fogColor: 0x050014,
      fogDensity: 0.0004,
      dustColor: 0xa855f7,
      skyboxTheme: 'SINGULARITY',
    },
    lighting: {
      ambientColor: 0x241144,
      ambientIntensity: 0.8,
      sunColor: 0xffd700,
      sunIntensity: 2.2,
      sunPosition: [0, 500, -2500],
      accentColor: 0xc91200,
    },
    sky: {
      starCount: 1200,
      starColor: 0xffffff,
      nebulaColors: ['rgba(168,85,247,0.8)', 'rgba(239,68,68,0.6)', 'rgba(30,10,60,0.9)'],
      celestialFeature: 'Kerr Singularity with Golden Accretion Disk',
    },
    environmentalEffects: ['Gravitational Lensing', 'Time Dilation Warp'],
    gameplayInteractions: ['Slingshot Acceleration', 'Horizon Tidal Gravity'],
  },

  // MODE 02 — NEON CIRCUIT
  NEON_CIRCUIT: {
    modeId: 'NEON_CIRCUIT',
    modeNumber: 2,
    environmentId: 'ENV_02_NEON_CIRCUIT',
    worldType: 'FUTURISTIC_NEON_RACING_CITY',
    displayName: 'Neon Circuit // Cyber City Orbit',
    themeDescription: 'Multilayer highways, holographic advertising monoliths, neon skyscraper spires, and traffic light arches.',
    trackArchitecture: 'Elevated 3-Lane Maglev Highways with Glowing Guardrails',
    structureSet: [
      'Neon Skyscraper Spires',
      'Multilayer Elevated Road Overpasses',
      'Holographic Ad Billboards',
      'Traffic-Light Gantry Arches',
      'City Transit Bridges',
    ],
    scenerySet: [
      'Dense Cyberpunk City Skyline',
      'Floating Holographic Signs',
      'Overhead Maglev Sky-Tracks',
      'High-Altitude Commuter Tubes',
    ],
    propSet: [
      'Neon Directional Chevron Gantries',
      'Holo-Projector Pylons',
      'Race Sponsor Billboards',
      'Streetlight Arrays',
    ],
    hazardSet: ['Traffic Barriers', 'High-Speed Corners', 'Split Interchanges'],
    routeStyle: 'Sharp 90-degree corners, elevated straightaways, and urban shortcuts',
    backgroundSet: ['Illuminated Cyber Megacity', 'Flying Air-Traffic Streams'],
    atmosphere: {
      fogColor: 0x030716,
      fogDensity: 0.00045,
      dustColor: 0x00f0ff,
      skyboxTheme: 'NEON_CITY',
    },
    lighting: {
      ambientColor: 0x0c1b33,
      ambientIntensity: 0.9,
      sunColor: 0x00f0ff,
      sunIntensity: 2.4,
      sunPosition: [300, 600, -400],
      accentColor: 0xff007f,
    },
    sky: {
      starCount: 800,
      starColor: 0x67e8f9,
      nebulaColors: ['rgba(6,182,212,0.6)', 'rgba(236,72,153,0.5)', 'rgba(15,23,42,0.9)'],
      celestialFeature: 'Cyber Metropolis Horizon with Tower Beacon Rays',
    },
    environmentalEffects: ['Pulsing Neon Billboards', 'Reflective Wet-Road Shimmer', 'Laser Beacons'],
    gameplayInteractions: ['Speed Boost Pads', 'Overhead Shortcut Ramps', 'Drafting Lanes'],
  },

  // MODE 03 — ASTEROID RUN
  ASTEROID_RUN: {
    modeId: 'ASTEROID_RUN',
    modeNumber: 3,
    environmentId: 'ENV_03_ASTEROID_MINING_ZONE',
    worldType: 'ASTEROID_MINING_EXCAVATION_SECTOR',
    displayName: 'Asteroid Run // Vesta Trench',
    themeDescription: 'Deep asteroid mining region with massive craggy mined asteroids, heavy industrial drill rigs, and conveyor structures.',
    trackArchitecture: 'Industrial Steel Trench Paved Through Craggy Rock Cavities',
    structureSet: [
      'Industrial Mining Stations',
      'Heavy Rotary Drill Rigs',
      'Ore Processing Platforms',
      'Conveyor Truss Bridges',
      'Extraction Crane Gantries',
    ],
    scenerySet: [
      'Gigantic Excavated Asteroids',
      'Ore Storage Silos',
      'Floating Boulder Belts',
      'Hollow Asteroid Tunnels',
    ],
    propSet: [
      'Industrial Amber Warning Beacons',
      'Mining Laser Pylons',
      'Blast Warning Light Poles',
      'Rock Anchor Struts',
    ],
    hazardSet: ['Rotating Boulder Obstacles', 'Crushed Ore Belts', 'Narrow Trench Slaloms'],
    routeStyle: 'Weaving through hollowed asteroid caverns and industrial mining gantries',
    backgroundSet: ['Dense Planetary Asteroid Ring Field', 'Industrial Smelting Facility'],
    atmosphere: {
      fogColor: 0x0a0a10,
      fogDensity: 0.00048,
      dustColor: 0xf59e0b,
      skyboxTheme: 'ASTEROID_FIELD',
    },
    lighting: {
      ambientColor: 0x1f1f2e,
      ambientIntensity: 0.7,
      sunColor: 0xfbbf24,
      sunIntensity: 2.0,
      sunPosition: [500, 300, -800],
      accentColor: 0xd97706,
    },
    sky: {
      starCount: 1500,
      starColor: 0xffedd5,
      nebulaColors: ['rgba(245,158,11,0.5)', 'rgba(120,53,15,0.4)', 'rgba(10,10,15,0.95)'],
      celestialFeature: 'Deep Belt Planetary Ring & Fractured Moons',
    },
    environmentalEffects: ['Rock Debris Particles', 'Mining Laser Sparks', 'Industrial Beacon Flashes'],
    gameplayInteractions: ['Destructible Asteroids', 'Mining Tunnel Accelerators', 'Ore Collection'],
  },

  // MODE 04 — WORMHOLE EXPRESS
  WORMHOLE_EXPRESS: {
    modeId: 'WORMHOLE_EXPRESS',
    modeNumber: 4,
    environmentId: 'ENV_04_WORMHOLE_CORRIDOR',
    worldType: 'SUBSPACE_WARP_CONDUIT',
    displayName: 'Wormhole Express // Subspace Rift',
    themeDescription: 'Enormous wormhole corridor, double-helix warp rings, dimensional portals, and distorted spatial ribbons.',
    trackArchitecture: 'Floating Spacetime Distortion Ribbons with Energy Edge-Beams',
    structureSet: [
      'Dimensional Warp Gate Portals',
      'Double-Helix Conduit Rings',
      'Subspace Field Stabilizers',
      'Curved Spacetime Pylons',
      'Gravity Compression Hoops',
    ],
    scenerySet: [
      'Swirling Purple/Cyan Accretion Vortex',
      'Distorted Cosmic Nebulae',
      'Tachyon Field Curtains',
      'Warp Singularity Rifts',
    ],
    propSet: [
      'Pulsing Spatial Distortion Rings',
      'Chrono-Displacement Beacons',
      'Tachyon Wave Emitters',
    ],
    hazardSet: ['Gravitational Fluctuations', 'Dimensional Rifts', 'Spatial Compression Waves'],
    routeStyle: 'High-speed corkscrews, warped straights, and portal transit loops',
    backgroundSet: ['Subspace Vortices', 'Multidimensional Light Gradients'],
    atmosphere: {
      fogColor: 0x100424,
      fogDensity: 0.00042,
      dustColor: 0xd946ef,
      skyboxTheme: 'WORMHOLE_RIFT',
    },
    lighting: {
      ambientColor: 0x230c3d,
      ambientIntensity: 0.85,
      sunColor: 0xc026d3,
      sunIntensity: 2.2,
      sunPosition: [0, 400, -1200],
      accentColor: 0x00f0ff,
    },
    sky: {
      starCount: 900,
      starColor: 0xe879f9,
      nebulaColors: ['rgba(192,38,211,0.7)', 'rgba(6,182,212,0.6)', 'rgba(15,2,30,0.9)'],
      celestialFeature: 'Pulsating Subspace Wormhole Core with Double Event Horizon',
    },
    environmentalEffects: ['Rotating Helix Torus Rings', 'Warp Rift Particle Swirls', 'Chromatic Pulse Rays'],
    gameplayInteractions: ['Warp Portal Jumps', 'Tachyon Speed Surges', 'Space Compression Slingshots'],
  },

  // MODE 05 — SOLAR STORM
  SOLAR_STORM: {
    modeId: 'SOLAR_STORM',
    modeNumber: 5,
    environmentId: 'ENV_05_SOLAR_CORONA',
    worldType: 'NEAR_STAR_CORONAL_FACILITY',
    displayName: 'Solar Storm // Helios Perihelion',
    themeDescription: 'Scorching near-star environment with blazing solar corona, thermal heat shields, and coronal flare arches.',
    trackArchitecture: 'Heat-Deflecting Ceramic Mag-Tracks with Thermal Heat Sink Finning',
    structureSet: [
      'Thermal Heat Shield Deflector Walls',
      'Parabolic Solar Energy Collectors',
      'Coronal Plasma Absorption Towers',
      'Radiation Baffle Stations',
      'Magnetic Flux Conduits',
    ],
    scenerySet: [
      'Colossal Blazing Solar Corona Sphere',
      'Solar Prominence Arches',
      'Molten Radiation Wind Plumes',
      'Coronal Mass Ejection Filaments',
    ],
    propSet: [
      'Radiator Cooling Fin Arrays',
      'Heat Dispersion Vent Turbines',
      'Overheat Sensor Towers',
    ],
    hazardSet: ['Solar Flare Arches', 'Extreme Heat Zones', 'Radiative Plasma Plumes'],
    routeStyle: 'Sweeping perihelion flybys with shadow-seeking defensive lines',
    backgroundSet: ['Helios Star Surface Boiling Convection Cells', 'Magnetic Solar Loops'],
    atmosphere: {
      fogColor: 0x1c0800,
      fogDensity: 0.00044,
      dustColor: 0xf97316,
      skyboxTheme: 'SOLAR_INFERNO',
    },
    lighting: {
      ambientColor: 0x3d1400,
      ambientIntensity: 0.95,
      sunColor: 0xff5500,
      sunIntensity: 3.2,
      sunPosition: [800, 450, -1600],
      accentColor: 0xffea00,
    },
    sky: {
      starCount: 600,
      starColor: 0xfef08a,
      nebulaColors: ['rgba(239,68,68,0.75)', 'rgba(245,158,11,0.7)', 'rgba(30,10,0,0.95)'],
      celestialFeature: 'Colossal Super-Star Core with Pulsing Coronal Prominences',
    },
    environmentalEffects: ['Solar Flare Arcs', 'Molten Convective Radiation Waves', 'Heat Shimmer'],
    gameplayInteractions: ['Heat Shield Shadow Recovery', 'Coronal Energy Surges', 'Thermal Vent Coolers'],
  },

  // MODE 06 — GRAVITY FREE
  GRAVITY_FREE: {
    modeId: 'GRAVITY_FREE',
    modeNumber: 6,
    environmentId: 'ENV_06_ZERO_G_FACILITY',
    worldType: 'ZERO_GRAVITY_ORBITAL_FACILITY',
    displayName: 'Gravity Free // Orbital Zero-G Testing Bay',
    themeDescription: 'Weightless testing range with floating anti-gravity platforms, disconnected tracks, rotating gyroscopes, and mooring buoys.',
    trackArchitecture: 'Segmented Anti-Gravity Float Pads with Blue Levitation Conduits',
    structureSet: [
      'Floating Anti-Grav Testing Platforms',
      'Concentric Rotating Gyroscope Rings',
      'Disconnected Levitation Track Modules',
      'Orbital Centrifuge Station Wheels',
      'Zero-G Mooring Buoys',
    ],
    scenerySet: [
      'Suspended Multi-Axis Gyroscopes',
      'Floating Modular Hangars',
      'Free-Floating Checkpoint Arcs',
      'Orbital Telemetry Satellites',
    ],
    propSet: [
      'Levitation Field Emitters',
      'Attitude Thruster Pylons',
      'Weightless Mooring Clamps',
    ],
    hazardSet: ['Full 3D Inversions', 'Disconnected Track Gaps', 'Vertical Drop Drops'],
    routeStyle: '3D multi-planar stunt corkscrews, loops, and free-flight aerial leaps',
    backgroundSet: ['Curving Planetary Horizon', 'Distant Orbital Space Fleet'],
    atmosphere: {
      fogColor: 0x021520,
      fogDensity: 0.00036,
      dustColor: 0x38bdf8,
      skyboxTheme: 'ZERO_G_ORBIT',
    },
    lighting: {
      ambientColor: 0x0e2a3b,
      ambientIntensity: 0.85,
      sunColor: 0x00f0ff,
      sunIntensity: 2.2,
      sunPosition: [-400, 700, -900],
      accentColor: 0x38bdf8,
    },
    sky: {
      starCount: 1400,
      starColor: 0xe0f2fe,
      nebulaColors: ['rgba(56,189,248,0.5)', 'rgba(14,165,233,0.4)', 'rgba(3,15,30,0.9)'],
      celestialFeature: 'Deep Blue Gas Giant with Intricate Orbital Ring Shadow',
    },
    environmentalEffects: ['Rotating Orbital Gyro-Rings', 'Anti-Grav Field Glows', 'Microgravity Floating Mist'],
    gameplayInteractions: ['Stunt Roll Combos', 'Vertical Momentum Slingshots', 'Levitation Jump Pads'],
  },

  // MODE 07 — PLASMA STORM
  PLASMA_STORM: {
    modeId: 'PLASMA_STORM',
    modeNumber: 7,
    environmentId: 'ENV_07_PLASMA_REFINERY',
    worldType: 'INDUSTRIAL_PLASMA_REFINERY',
    displayName: 'Plasma Storm // Magnetar Refinery',
    themeDescription: 'Heavy industrial plasma refinery with tokamak fusion reactors, magnetic energy conduits, and toxic plasma venting towers.',
    trackArchitecture: 'Reinforced Steel Catwalk Highway with Magnetized Containment Rails',
    structureSet: [
      'Tokamak Fusion Reactors',
      'High-Voltage Magnetic Energy Conduits',
      'Plasma Arc Containment Chambers',
      'Industrial Catwalk Suspension Trusses',
      'Venting Cooling Chimneys',
    ],
    scenerySet: [
      'Crackling Emerald Plasma Cores',
      'High-Energy Magnetic Storage Tanks',
      'Arc Discharge Transformer Coils',
      'Heavy Industrial Pipelines',
    ],
    propSet: [
      'Plasma Valve Pressure Gantries',
      'Electric Arc Warning Lights',
      'Magnetic Field Induction Pylons',
    ],
    hazardSet: ['Sweeping Plasma Storm Wall', 'High-Voltage Arc Leaps', 'Reactor Vent Bursts'],
    routeStyle: 'Urgent forward sprint to outrun the advancing industrial storm wall',
    backgroundSet: ['Storming Electromagnetic Nebulae', 'Industrial Smelter Complex'],
    atmosphere: {
      fogColor: 0x04180d,
      fogDensity: 0.00046,
      dustColor: 0x10b981,
      skyboxTheme: 'PLASMA_STORM',
    },
    lighting: {
      ambientColor: 0x0b2917,
      ambientIntensity: 0.8,
      sunColor: 0x10b981,
      sunIntensity: 2.5,
      sunPosition: [300, 500, -700],
      accentColor: 0x34d399,
    },
    sky: {
      starCount: 1000,
      starColor: 0xa7f3d0,
      nebulaColors: ['rgba(16,185,129,0.7)', 'rgba(5,150,105,0.6)', 'rgba(2,20,10,0.92)'],
      celestialFeature: 'Electromagnetic Magnetar Pulse Core with Emerald Aurora',
    },
    environmentalEffects: ['Pulsing Magnetic Coils', 'Green Plasma Arc Discharges', 'Steam Vent Plumes'],
    gameplayInteractions: ['Storm Wall Distance Shielding', 'Plasma Overcharge Batteries', 'Conduit Speed Boosts'],
  },

  // MODE 08 — SKYLINE RUSH
  SKYLINE_RUSH: {
    modeId: 'SKYLINE_RUSH',
    modeNumber: 8,
    environmentId: 'ENV_08_SKYLINE_MEGACITY',
    worldType: 'VERTICAL_MEGACITY_CANYON',
    displayName: 'Skyline Rush // Neo-Coruscant Apex',
    themeDescription: 'Colossal vertical futuristic megacity with 900m-tall skyscrapers, high-altitude aerial sky-bridges, and rooftop tracks.',
    trackArchitecture: 'High-Altitude Skyway Suspended in a Deep Skyscraper Chasm',
    structureSet: [
      'Super-Tall Megacity Skyscraper Towers',
      'Aerial Sky-Bridges Linking Towers',
      'Rooftop Maglev Landing Pads',
      'Construction Sky-Cranes with Warning Lights',
      'Express Elevator Core Shafts',
    ],
    scenerySet: [
      'Deep Urban Building Canyon Flanks',
      'Illuminated Skyscraper Office Windows',
      'Vertical Highway Overpasses',
      'High-Altitude Cloud Layer Below',
    ],
    propSet: [
      'Aircraft Warning Strobe Beacons',
      'Holographic Penthouse Ads',
      'Skyline Bridge Expansion Joints',
    ],
    hazardSet: ['Sheer Canyon Drops', 'Skyscraper Pillar Chicanes', 'Crosswinds at High Altitude'],
    routeStyle: 'Plunging vertical drops between skyscrapers, rooftop hairpins, and bridge crossings',
    backgroundSet: ['Sprawling Megacity Ocean Below', 'Upper Stratosphere City Spire Crowns'],
    atmosphere: {
      fogColor: 0x050c1e,
      fogDensity: 0.00042,
      dustColor: 0x38bdf8,
      skyboxTheme: 'SKYLINE_CITY',
    },
    lighting: {
      ambientColor: 0x111c38,
      ambientIntensity: 0.85,
      sunColor: 0x38bdf8,
      sunIntensity: 2.3,
      sunPosition: [-200, 800, -500],
      accentColor: 0xfbbf24,
    },
    sky: {
      starCount: 750,
      starColor: 0xbae6fd,
      nebulaColors: ['rgba(56,189,248,0.5)', 'rgba(99,102,241,0.5)', 'rgba(5,10,30,0.92)'],
      celestialFeature: 'Twin Crescent Moons Over Megacity Cloud Inversion Layer',
    },
    environmentalEffects: ['Illuminated Skyscraper Windows', 'Sky-Crane Strobe Beacons', 'Aerodynamic City Drafts'],
    gameplayInteractions: ['Rooftop Dive Boosts', 'Sky-Bridge Shortcuts', 'Speed Slalom Corridors'],
  },

  // MODE 09 — DEBRIS SURVIVAL
  DEBRIS_SURVIVAL: {
    modeId: 'DEBRIS_SURVIVAL',
    modeNumber: 9,
    environmentId: 'ENV_09_DEBRIS_GRAVEYARD',
    worldType: 'DESTROYED_ORBITAL_WRECKAGE_ZONE',
    displayName: 'Debris Survival // Orbital Graveyard',
    themeDescription: 'Shattered space station ruins, torn starship bulkheads, tumbling metal wreckage, and red emergency distress buoys.',
    trackArchitecture: 'Improvised Survival Runway Over Fractured Station Sections',
    structureSet: [
      'Torn Space Station Half-Modules',
      'Twisted Structural Steel Girders',
      'Shattered Solar Array Panels',
      'Derelict Starship Hull Fragments',
      'Damaged Survival Shelters',
    ],
    scenerySet: [
      'Tumbling Space Wreckage Belt',
      'Exposed Station Bulkheads & Ribs',
      'Floating Scrap Cargo Containers',
      'Ruptured Fuel Tanks Spilling Mist',
    ],
    propSet: [
      'Flickering Red Distress Beacons',
      'Emergency Hazard Flashers',
      'Damaged Hull Warning Flags',
    ],
    hazardSet: ['Tumbling Metal Scrap', 'Sharp Girder Hazards', 'Drifting Ship Piles'],
    routeStyle: 'Dynamic irregular survival navigation with sudden evasive turns',
    backgroundSet: ['Dark Menacing Graveyard Orbit', 'Broken Satellite Belt'],
    atmosphere: {
      fogColor: 0x06080d,
      fogDensity: 0.00048,
      dustColor: 0xef4444,
      skyboxTheme: 'DEBRIS_ZONE',
    },
    lighting: {
      ambientColor: 0x141820,
      ambientIntensity: 0.65,
      sunColor: 0x64748b,
      sunIntensity: 1.8,
      sunPosition: [400, 250, -900],
      accentColor: 0xef4444,
    },
    sky: {
      starCount: 1100,
      starColor: 0x94a3b8,
      nebulaColors: ['rgba(239,68,68,0.3)', 'rgba(71,85,105,0.4)', 'rgba(5,7,12,0.96)'],
      celestialFeature: 'Shattered Moon with Visible Impact Fracture Trench',
    },
    environmentalEffects: ['Tumbling Metal Scrap', 'Flickering Distress Lights', 'Hull Impact Spark Flashes'],
    gameplayInteractions: ['Near-Miss Evasion Combos', 'Missile Debris Clearing', 'Shield Reinforcement Core'],
  },

  // MODE 10 — QUANTUM TIME TRIAL
  QUANTUM_TIME_TRIAL: {
    modeId: 'QUANTUM_TIME_TRIAL',
    modeNumber: 10,
    environmentId: 'ENV_10_QUANTUM_LAB',
    worldType: 'QUANTUM_RESEARCH_INSTITUTE',
    displayName: 'Quantum Time Trial // Chrono Institute',
    themeDescription: 'Pristine quantum research facility with particle accelerator rings, temporal chronometer gantries, and precision towers.',
    trackArchitecture: 'Pristine White/Cyan Superconducting Quantum Waveguide Track',
    structureSet: [
      'Particle Accelerator Loop Rings',
      'Holographic Chronometer Time Gates',
      'Laser Telemetry Measurement Gantries',
      'Quantum Flux Containment Chambers',
      'Precision Research Towers',
    ],
    scenerySet: [
      'Clean-Room Laboratory Architecture',
      'Glowing Superconducting Coils',
      'Optical Laser Interferometer Arrays',
      'Sub-Atomic Particle Streams',
    ],
    propSet: [
      'Sector Split Timing Sensors',
      'Delta Chrono Pylons',
      'Pristine Chrome Gantry Arches',
    ],
    hazardSet: ['Tight Precision Chicanes', 'Temporal Boundary Traps', 'High-Speed Hairpins'],
    routeStyle: 'Surgical apex precision, optimal racing lines, and speed split gates',
    backgroundSet: ['Gigantic Supercollider Core', 'Pristine Orbital Research Station'],
    atmosphere: {
      fogColor: 0x020f26,
      fogDensity: 0.00038,
      dustColor: 0x00f0ff,
      skyboxTheme: 'QUANTUM_LAB',
    },
    lighting: {
      ambientColor: 0x0a1e3f,
      ambientIntensity: 0.9,
      sunColor: 0x00f0ff,
      sunIntensity: 2.5,
      sunPosition: [0, 600, -700],
      accentColor: 0x38bdf8,
    },
    sky: {
      starCount: 1300,
      starColor: 0xbae6fd,
      nebulaColors: ['rgba(6,182,212,0.6)', 'rgba(59,130,246,0.5)', 'rgba(2,10,25,0.92)'],
      celestialFeature: 'Deep Space Pulsar with Rotating Relativistic Blue Beams',
    },
    environmentalEffects: ['Chronometer HUD Holograms', 'Superconducting Pulse Waves', 'Laser Timing Curtains'],
    gameplayInteractions: ['Ghost Racer Comparison', 'Split-Time Acceleration Gates', 'Precision Line Multipliers'],
  },

  // MODE 11 — ENERGY HEIST
  ENERGY_HEIST: {
    modeId: 'ENERGY_HEIST',
    modeNumber: 11,
    environmentId: 'ENV_11_ENERGY_DEPOT',
    worldType: 'SECURE_ENERGY_FACILITY',
    displayName: 'Energy Heist // Prometheus Depot',
    themeDescription: 'Heavily fortified energy storage depot with radioactive reactor vaults, security laser tripwires, and armored blast gates.',
    trackArchitecture: 'Reinforced Military Access Runway with Armored Curbs and Blast Trench',
    structureSet: [
      'Armored High-Security Vault Silos',
      'Glowing Power Core Reactors',
      'Security Laser Tripwire Barriers',
      'Heavy Armored Blast Gates',
      'Overhead Fuel Energy Pipelines',
    ],
    scenerySet: [
      'Armored Guard Watchtowers with Red Spotlights',
      'Radioactive Energy Storage Cisterns',
      'Perimeter Electric Security Fences',
      'Heavy Industrial Transfer Cranes',
    ],
    propSet: [
      'Heist Extraction Terminal Consoles',
      'Red Security Alarm Beacons',
      'Hazard Striped Perimeter Barriers',
    ],
    hazardSet: ['Laser Tripwire Alarms', 'Reinforced Security Bulkheads', 'Overheating Energy Cores'],
    routeStyle: 'Infiltration straights, tactical bypass tunnels, and core extraction bays',
    backgroundSet: ['Fortified Military Orbital Base', 'Defense Missile Silo Batteries'],
    atmosphere: {
      fogColor: 0x080812,
      fogDensity: 0.00045,
      dustColor: 0xff5500,
      skyboxTheme: 'ENERGY_DEPOT',
    },
    lighting: {
      ambientColor: 0x161426,
      ambientIntensity: 0.75,
      sunColor: 0xff3300,
      sunIntensity: 2.2,
      sunPosition: [350, 450, -850],
      accentColor: 0xf59e0b,
    },
    sky: {
      starCount: 850,
      starColor: 0xfecaca,
      nebulaColors: ['rgba(239,68,68,0.5)', 'rgba(245,158,11,0.4)', 'rgba(10,8,18,0.94)'],
      celestialFeature: 'Red Giant Star with Heavy Solar Defense Array',
    },
    environmentalEffects: ['Sweeping Red Security Searchlights', 'Reactor Core Glow Pulsing', 'Alarm Strobe Flashes'],
    gameplayInteractions: ['Energy Core Extraction Pickups', 'Mass Penalty Weight Handling', 'Escape Hatch Gates'],
  },

  // MODE 12 — DRONE ASSAULT
  DRONE_ASSAULT: {
    modeId: 'DRONE_ASSAULT',
    modeNumber: 12,
    environmentId: 'ENV_12_DEFENSE_CITADEL',
    worldType: 'MILITARY_DEFENSE_CITADEL',
    displayName: 'Drone Assault // Aegis Garrison',
    themeDescription: 'Futuristic military installation with automated drone launch silos, radar radomes, defense turrets, and runway strobes.',
    trackArchitecture: 'Tactical Combat Carrier Runway with Directional Strobe Arrays',
    structureSet: [
      'Automated Drone Launch Silo Platforms',
      'Twin Radar Radome Defense Towers',
      'Armored Military Command Bunkers',
      'Orbital Interceptor Hangars',
      'Heavy Weapon Defense Turrets',
    ],
    scenerySet: [
      'Hovering Military Combat Drones',
      'Anti-Air Missile Pod Batteries',
      'Tactical Surface Runway Guidance Lights',
      'Fortified Perimeter Gun Emplacements',
    ],
    propSet: [
      'Tactical Yellow Approach Strobes',
      'Target Acquisition Radar Dishes',
      'Combat Perimeter Pylons',
    ],
    hazardSet: ['Hostile Drone Swarms', 'Surface Defense Flak', 'Crossfire Patrol Corridors'],
    routeStyle: 'Aggressive dogfight straights, combat chicanes, and launch pad leaps',
    backgroundSet: ['Orbital Fleet Defense Line', 'Garrison Shield Generator Array'],
    atmosphere: {
      fogColor: 0x0d0e12,
      fogDensity: 0.00044,
      dustColor: 0xeab308,
      skyboxTheme: 'MILITARY_CITADEL',
    },
    lighting: {
      ambientColor: 0x1a1c22,
      ambientIntensity: 0.8,
      sunColor: 0xeab308,
      sunIntensity: 2.4,
      sunPosition: [-400, 500, -750],
      accentColor: 0xeab308,
    },
    sky: {
      starCount: 1100,
      starColor: 0xfef08a,
      nebulaColors: ['rgba(234,179,8,0.45)', 'rgba(100,116,139,0.5)', 'rgba(10,12,18,0.93)'],
      celestialFeature: 'Deep Void Combat Carrier Fleet Formations',
    },
    environmentalEffects: ['Sweeping Radar Dish Rotation', 'Drone Launch Flame Exhausts', 'Tactical Runway Strobes'],
    gameplayInteractions: ['Combat Drone Target Lock', 'Missile Salvo Strikes', 'Shield Defense Recharge'],
  },

  // MODE 13 — COLLAPSING TRACK
  COLLAPSING_TRACK: {
    modeId: 'COLLAPSING_TRACK',
    modeNumber: 13,
    environmentId: 'ENV_13_FRACTURING_STRUCTURE',
    worldType: 'FRACTURING_UNSTABLE_MEGASTRUCTURE',
    displayName: 'Collapsing Track // Fracture Sector',
    themeDescription: 'Structurally failing megastructure with cracked cantilever bridges, buckling arches, dangling rebar, and hazard pillars.',
    trackArchitecture: 'Fractured Roadbed with Active Stress Fractures and Emergency By-Pass Trusses',
    structureSet: [
      'Collapsing Cantilever Highway Bridges',
      'Buckling Steel Support Arches',
      'Tilt-Shifted Broken Observation Platforms',
      'Dangling Steel Rebar & Cable Bundles',
      'Emergency Seismic Warning Pillars',
    ],
    scenerySet: [
      'Falling Roadway Structural Chunks',
      'Ruptured Hydraulic Dampers Spewing Steam',
      'Tilted Megastructure Spires',
      'Deep Abyssal Structural Voids',
    ],
    propSet: [
      'Hazard Striped Warning Stanchions',
      'Seismic Stress Gauges',
      'Emergency Bypass Direction Beacons',
    ],
    hazardSet: ['Disintegrating Track Sections', 'Falling Overpasses', 'Structural Void Chasms'],
    routeStyle: 'High-urgency sprint across breaking bridges with alternate emergency tracks',
    backgroundSet: ['Collapsing Orbital Megastructure Frame', 'Tectonic Debris Cloud'],
    atmosphere: {
      fogColor: 0x140a08,
      fogDensity: 0.00048,
      dustColor: 0xf97316,
      skyboxTheme: 'COLLAPSING_WORLD',
    },
    lighting: {
      ambientColor: 0x26120e,
      ambientIntensity: 0.75,
      sunColor: 0xf97316,
      sunIntensity: 2.2,
      sunPosition: [250, 400, -800],
      accentColor: 0xef4444,
    },
    sky: {
      starCount: 700,
      starColor: 0xfed7aa,
      nebulaColors: ['rgba(249,115,22,0.6)', 'rgba(239,68,68,0.5)', 'rgba(15,8,6,0.95)'],
      celestialFeature: 'Deep Void Fractured Asteroid Core in Active Disintegration',
    },
    environmentalEffects: ['Falling Concrete & Steel Chunks', 'Structural Stress Sparks', 'Warning Siren Flashes'],
    gameplayInteractions: ['Disintegrating Road Chase', 'Emergency Bypass Jumps', 'Speed Survival Milestones'],
  },

  // MODE 14 — RING RUNNER
  RING_RUNNER: {
    modeId: 'RING_RUNNER',
    modeNumber: 14,
    environmentId: 'ENV_14_ORBITAL_RING',
    worldType: 'STANFORD_TORUS_ORBITAL_RING',
    displayName: 'Ring Runner // Torus Habitat Orbit',
    themeDescription: 'Gigantic orbital ring megastructure arching overhead, rotating habitat wheel sections, and curved banked ring highways.',
    trackArchitecture: 'High-Banked Maglev Ring Highway Encircling the Orbital Torus Rim',
    structureSet: [
      'Gigantic Overhead Stanford Torus Ring',
      'Concentric Rotating Habitat Wheels',
      'Massive Ring Hub Spoke Columns',
      'Ring Docking Bay Platforms',
      'Orbital Communication Dishes',
    ],
    scenerySet: [
      'Terraced Interior Ring Habitats',
      'Sweeping Centrifugal Gravity Rails',
      'High-Speed Ring Acceleration Loops',
      'Orbital Solar Arrays Framing Ring Rim',
    ],
    propSet: [
      'Ring Alignment Guide Arches',
      'Centrifugal Speed Gates',
      'High-Bank Neon Pylon Guides',
    ],
    hazardSet: ['Extreme Centrifugal Turns', 'High-Speed Banking Flips', 'Ring Ring Intersections'],
    routeStyle: 'Continuous high-speed curved loops, interior/exterior ring transitions',
    backgroundSet: ['Vast Curved Ring Arching Across the Sky', 'Planetary Blue Crescent Below'],
    atmosphere: {
      fogColor: 0x03081e,
      fogDensity: 0.00038,
      dustColor: 0x38bdf8,
      skyboxTheme: 'ORBITAL_RING',
    },
    lighting: {
      ambientColor: 0x0d1a38,
      ambientIntensity: 0.85,
      sunColor: 0x38bdf8,
      sunIntensity: 2.4,
      sunPosition: [500, 650, -600],
      accentColor: 0x00f0ff,
    },
    sky: {
      starCount: 1600,
      starColor: 0xe0f2fe,
      nebulaColors: ['rgba(56,189,248,0.55)', 'rgba(30,58,138,0.6)', 'rgba(3,8,25,0.9)'],
      celestialFeature: 'Continuous 360-degree Orbital Torus Halo with Habitat Lights',
    },
    environmentalEffects: ['Rotating Torus Spoke Motion', 'Centrifugal Ring Particle Trails', 'Habitat City Glow'],
    gameplayInteractions: ['Ring Ring Gate Combos', 'Centrifugal Drift Bonuses', 'Supersonic Ring Straights'],
  },

  // MODE 15 — HYPERSPACE SPRINT
  HYPERSPACE_SPRINT: {
    modeId: 'HYPERSPACE_SPRINT',
    modeNumber: 15,
    environmentId: 'ENV_15_HYPERSPACE_WARP',
    worldType: 'RELATIVISTIC_HYPERSPACE_TUNNEL',
    displayName: 'Hyperspace Sprint // Tachyon Slipstream',
    themeDescription: 'Cylindrical relativistic warp tunnel with streaking light corridors, expanding velocity rings, and tachyon conduits.',
    trackArchitecture: 'Pure Luminescent Energy Conduit Enclosed in a Cylindrical Warp Tube',
    structureSet: [
      'High-Frequency Energy Lattice Rings',
      'Relativistic Velocity Expansion Hoops',
      'Tachyon Field Accelerator Gates',
      'Chromatic Dispersion Prism Portals',
      'Sub-Ether Slipstream Ribs',
    ],
    scenerySet: [
      'Streaking Relativistic Star-Lines',
      'Pulsating Rainbow Tachyon Walls',
      'Superluminal Tunnel Shimmer',
      'Dimensional Velocity Horizons',
    ],
    propSet: [
      'Warp Speed Indicator Arches',
      'Tachyon Resonance Nodes',
      'Chromatic Boundary Pylons',
    ],
    hazardSet: ['Extreme Velocity Reactions', 'Tachyon Shear Waves', 'Blind Warp Corners'],
    routeStyle: 'Maximum velocity tunnel straights and rapid geometric tunnel shifts',
    backgroundSet: ['Infinite Hyperspace Tunnel Horizon', 'Chromatically Shifted Starfield'],
    atmosphere: {
      fogColor: 0x0a0224,
      fogDensity: 0.00035,
      dustColor: 0xe879f9,
      skyboxTheme: 'HYPERSPACE',
    },
    lighting: {
      ambientColor: 0x220847,
      ambientIntensity: 0.95,
      sunColor: 0xa855f7,
      sunIntensity: 2.8,
      sunPosition: [0, 300, -1000],
      accentColor: 0xec4899,
    },
    sky: {
      starCount: 2200,
      starColor: 0xfdf4ff,
      nebulaColors: ['rgba(168,85,247,0.8)', 'rgba(236,72,153,0.7)', 'rgba(10,2,35,0.92)'],
      celestialFeature: 'Relativistic Warp Focal Point with Chromatic Star Streaks',
    },
    environmentalEffects: ['Expanding Velocity Rings', 'Chromatic Prismatic Trails', 'Relativistic Star Streaks'],
    gameplayInteractions: ['Warp Speed Overdrive', 'Tachyon Slipstream Slingshot', 'Maximum Velocity Clocking'],
  },

  // MODE 16 — RIVAL DUEL
  RIVAL_DUEL: {
    modeId: 'RIVAL_DUEL',
    modeNumber: 16,
    environmentId: 'ENV_16_RIVAL_ARENA',
    worldType: 'GLADIATORIAL_RACING_COLOSSEUM',
    displayName: 'Rival Duel // Colosseum Apex',
    themeDescription: 'Dedicated futuristic racing colosseum with multi-tier spectator stadium bowls, floodlight towers, and duel scoreboards.',
    trackArchitecture: 'Dual-Lane Combat Arena Track with Segmented Chicane Barriers',
    structureSet: [
      'Multi-Tier Spectator Stadium Bowls',
      'Stadium Floodlight Lighting Gantries',
      'Giant Holographic Matchup Scoreboards',
      'Chicane Duel Divider Barriers',
      'Podium Victor Archway Gates',
    ],
    scenerySet: [
      'Crowded Spectator Sky-Boxes',
      'Flame Exhaust Jet Pylons',
      'Tactical Combat Telemetry Screens',
      'High-Impact Enclosed Arena Walls',
    ],
    propSet: [
      'Duel Sector Lead/Lag Indicators',
      'Arena Perimeter Floodlights',
      'Finish Line Victor Pedestals',
    ],
    hazardSet: ['Aggressive AI Ramming', 'Chicane Barrier Choke-Points', 'Narrow Duel Lanes'],
    routeStyle: 'Competitive 1v1 tactical layout with aggressive overtaking opportunities',
    backgroundSet: ['Massive Orbital Colosseum Dome', 'High-Energy Spectator Lights'],
    atmosphere: {
      fogColor: 0x060b18,
      fogDensity: 0.00042,
      dustColor: 0x38bdf8,
      skyboxTheme: 'DUEL_ARENA',
    },
    lighting: {
      ambientColor: 0x111c33,
      ambientIntensity: 0.95,
      sunColor: 0x60a5fa,
      sunIntensity: 2.6,
      sunPosition: [200, 700, -500],
      accentColor: 0xef4444,
    },
    sky: {
      starCount: 950,
      starColor: 0xdbeafe,
      nebulaColors: ['rgba(59,130,246,0.5)', 'rgba(239,68,68,0.4)', 'rgba(5,10,25,0.92)'],
      celestialFeature: 'Colosseum Floodlight Halos and Holographic Arena Displays',
    },
    environmentalEffects: ['Stadium Floodlight Cones', 'Flame Jet Pylon Bursts', 'Crowd Flash Strobes'],
    gameplayInteractions: ['1v1 Tactical Overtakes', 'Dogfight Ram Mechanics', 'Leader Gap HUD Alerts'],
  },

  // MODE 17 — RELAY RACE
  RELAY_RACE: {
    modeId: 'RELAY_RACE',
    modeNumber: 17,
    environmentId: 'ENV_17_RELAY_SECTORS',
    worldType: 'MULTI_SECTOR_PLANETARY_HIGHWAY',
    displayName: 'Relay Race // Planetary Transition Highway',
    themeDescription: 'Three distinct architectural sectors: Industrial Spaceport, Canyon Viaduct, and Orbital Causeway with Relay Pit Gates.',
    trackArchitecture: 'Sector-Morphing Interplanetary Trans-Way with Dedicated Relay Pits',
    structureSet: [
      'Relay Pit Baton-Transfer Gates',
      'Sector 1: Spaceport Gantry Towers & Fuel Tanks',
      'Sector 2: Canyon Viaduct Suspension Bridges',
      'Sector 3: Orbital Causeway Glass Rails',
      'Sector Transition Holographic Arches',
    ],
    scenerySet: [
      'Industrial Launch Port (Sector 1)',
      'High-Altitude Rock Canyon (Sector 2)',
      'Open Void Skyway with Solar Sails (Sector 3)',
    ],
    propSet: [
      'Relay Leg Transfer Beacons',
      'Team Pit-Stop Gantries',
      'Sector Boundary Color Indicators',
    ],
    hazardSet: ['Sector Boundary Transfers', 'Vehicle Switch Dynamics', 'Changing Road Adhesion'],
    routeStyle: 'Three connected sectors with distinct track widths, elevations, and curves',
    backgroundSet: ['Dynamic Terrain: Industrial Port -> Canyons -> Orbital Space'],
    atmosphere: {
      fogColor: 0x090f1d,
      fogDensity: 0.00041,
      dustColor: 0x38bdf8,
      skyboxTheme: 'RELAY_HIGHWAY',
    },
    lighting: {
      ambientColor: 0x14203d,
      ambientIntensity: 0.85,
      sunColor: 0x38bdf8,
      sunIntensity: 2.3,
      sunPosition: [-300, 550, -700],
      accentColor: 0xa855f7,
    },
    sky: {
      starCount: 1200,
      starColor: 0xe0e7ff,
      nebulaColors: ['rgba(99,102,241,0.5)', 'rgba(236,72,153,0.4)', 'rgba(8,12,25,0.92)'],
      celestialFeature: 'Three Aligning Moons Representing the 3 Relay Legs',
    },
    environmentalEffects: ['Relay Pit Transfer Holograms', 'Sector Transition Color Shifts', 'Rocket Gantry Steam'],
    gameplayInteractions: ['Ship Specialty Leg Swaps', 'Pit-Stop Fast Transfers', 'Team Multiplier Zones'],
  },

  // MODE 18 — SURVIVAL ELIMINATION
  SURVIVAL_ELIMINATION: {
    modeId: 'SURVIVAL_ELIMINATION',
    modeNumber: 18,
    environmentId: 'ENV_18_SURVIVAL_DOME',
    worldType: 'DYNAMIC_SURVIVAL_ARENA',
    displayName: 'Survival Elimination // Knockout Dome',
    themeDescription: 'Geodesic laser survival dome with elimination scanner pylons, rotating hazard sweeps, and knockout energy barriers.',
    trackArchitecture: 'Circular Branching Survival Track with Elimination Hazard Zones',
    structureSet: [
      'Geodesic Laser Dome Frame',
      'Elimination Scanner Pylons',
      'Rotating Overhead Hazard Sweep Arms',
      'Floating Knockout Containment Cages',
      'Perimeter Voltage Containment Walls',
    ],
    scenerySet: [
      'Central Holographic Countdown Sphere',
      'Elimination Warning Gate Beacons',
      'Sparks and Shockwave Arc Pylons',
      'Knockout Platform Drop-Zones',
    ],
    propSet: [
      'Knockout Countdown Display Boards',
      'Perimeter Laser Tripwires',
      'Survivor Rank Telemetry Pylons',
    ],
    hazardSet: ['Periodic Countdown Knockout', 'Rotating Sweep Arms', 'Perimeter Voltage Walls'],
    routeStyle: 'Wide multi-line circular arena with inside/outside tactical choices',
    backgroundSet: ['Enclosed Geodesic Battle Dome', 'Dark Outer Space Beyond Dome'],
    atmosphere: {
      fogColor: 0x15030f,
      fogDensity: 0.00045,
      dustColor: 0xf43f5e,
      skyboxTheme: 'SURVIVAL_DOME',
    },
    lighting: {
      ambientColor: 0x2b081e,
      ambientIntensity: 0.85,
      sunColor: 0xf43f5e,
      sunIntensity: 2.4,
      sunPosition: [0, 600, -600],
      accentColor: 0xff0055,
    },
    sky: {
      starCount: 800,
      starColor: 0xfecdd3,
      nebulaColors: ['rgba(244,63,94,0.65)', 'rgba(159,18,57,0.5)', 'rgba(15,2,10,0.95)'],
      celestialFeature: 'Pulsing Crimson Elimination Warning Hologram Dome',
    },
    environmentalEffects: ['Elimination Scanner Sweeps', 'Dome Laser Grid Pulsing', 'Knockout Shockwave Rings'],
    gameplayInteractions: ['Last-Place Countdown Survival', 'Defensive Shield Overdrive', 'Aggressive Overtake Points'],
  },

  // MODE 19 — COSMIC TREASURE HUNT
  COSMIC_TREASURE_HUNT: {
    modeId: 'COSMIC_TREASURE_HUNT',
    modeNumber: 19,
    environmentId: 'ENV_19_ALIEN_RUINS',
    worldType: 'ANCIENT_ALIEN_RUINS_SECTOR',
    displayName: 'Cosmic Treasure Hunt // Precursor Crypt',
    themeDescription: 'Ancient alien ruins with floating black obsidian obelisks, glowing alien glyphs, rotating crystal pyramids, and stone viaducts.',
    trackArchitecture: 'Carved Obsidian Stone Viaduct with Luminescent Ancient Cosmic Inlays',
    structureSet: [
      'Floating Obsidian Obelisks with Alien Glyphs',
      'Hovering Rotating Crystal Pyramids',
      'Ancient Stone Viaduct Archways',
      'Cosmic Relic Pedestals & Artifact Shrines',
      'Precursor Temple Ruin Pillars',
    ],
    scenerySet: [
      'Ancient Floating Planetary Fragments',
      'Mysterious Glowing Ethereal Nebulae',
      'Overgrown Luminescent Alien Flora',
      'Sacred Geometrical Precursor Rings',
    ],
    propSet: [
      'Radar Ping Resonance Beacons',
      'Ancient Relic Glow Spheres',
      'Glyph-Carved Marker Stones',
    ],
    hazardSet: ['Ancient Forcefield Traps', 'Unstable Ruin Pillars', 'Hidden Spatial Pits'],
    routeStyle: 'Exploration branches, secret ruin shortcuts, and relic discovery plazas',
    backgroundSet: ['Alien Temple World Halo', 'Ethereal Cosmic Stardust Shimmer'],
    atmosphere: {
      fogColor: 0x051410,
      fogDensity: 0.00042,
      dustColor: 0x34d399,
      skyboxTheme: 'ALIEN_RUINS',
    },
    lighting: {
      ambientColor: 0x0c2920,
      ambientIntensity: 0.85,
      sunColor: 0x34d399,
      sunIntensity: 2.2,
      sunPosition: [-350, 450, -800],
      accentColor: 0xfbbf24,
    },
    sky: {
      starCount: 1400,
      starColor: 0xa7f3d0,
      nebulaColors: ['rgba(52,211,153,0.6)', 'rgba(16,185,129,0.5)', 'rgba(3,18,12,0.92)'],
      celestialFeature: 'Ancient Shattered Ringed Alien Throne World with Emerald Aura',
    },
    environmentalEffects: ['Pulsing Alien Glyphs', 'Hovering Crystal Pyramid Rotation', 'Relic Radar Ping Waves'],
    gameplayInteractions: ['Relic Radar Proximity Scanner', 'Ancient Relic Extractions', 'Secret Ruin Shortcuts'],
  },

  // MODE 20 — VOID CHAMPIONSHIP
  VOID_CHAMPIONSHIP: {
    modeId: 'VOID_CHAMPIONSHIP',
    modeNumber: 20,
    environmentId: 'ENV_20_CHAMPIONSHIP_APEX',
    worldType: 'PREMIER_CHAMPIONSHIP_APEX_ARENA',
    displayName: 'Void Championship // Apex Premier Arena',
    themeDescription: 'Luxurious gold and cobalt championship architecture with massive victory arches, golden laurel emblem, and winner dais (NOT city, NOT black hole, NOT singularity).',
    trackArchitecture: 'Premier Gold-Accented Carbon-Weave Championship Grand Prix Circuit',
    structureSet: [
      'Massive Championship Grand Arch with Gold Laurel Emblem',
      'Sweeping Championship Victory Ribbon Bridges',
      'Elite Apex Towers with Gold Pinstripes',
      'Grand Prix Winner Podium Dais Stadium Structure',
      'Orbital Spectator Sky-Decks with Golden Beacons',
    ],
    scenerySet: [
      'Championship Trophy Monoliths',
      'Regal Cobalt & Gold Arching Struts',
      'Royal Blue Floating Viewing Lounges',
      'VIP Grandstand Sky-Domes',
    ],
    propSet: [
      'Championship Gold Star Pylons',
      'Apex Cup Sector Markers',
      'Celebratory Laser Fireworks Launchers',
    ],
    hazardSet: ['Elite Champion Competitor Pace', 'Technical Multi-Apex S-Bends', 'Apex Deceleration Chicanes'],
    routeStyle: 'Masterwork Grand Prix layout with sweeping elevation changes, long drafting straights, and podium final sprint',
    backgroundSet: ['Royal Galactic Core Arena', 'Starlit Apex Championship Sky'],
    atmosphere: {
      fogColor: 0x0c0d1a,
      fogDensity: 0.00038,
      dustColor: 0xfbbf24,
      skyboxTheme: 'CHAMPIONSHIP_APEX',
    },
    lighting: {
      ambientColor: 0x1e274a,
      ambientIntensity: 0.95,
      sunColor: 0xfbbf24,
      sunIntensity: 2.6,
      sunPosition: [100, 650, -650],
      accentColor: 0x38bdf8,
    },
    sky: {
      starCount: 1600,
      starColor: 0xfef08a,
      nebulaColors: ['rgba(251,191,36,0.5)', 'rgba(30,58,138,0.7)', 'rgba(10,12,24,0.92)'],
      celestialFeature: 'Radiant Golden Core Nebula Framing the Championship Apex Cup',
    },
    environmentalEffects: ['Celebratory Laser Pyrotechnics', 'Gold Beacon Sweeps', 'Shimmering Championship Banners'],
    gameplayInteractions: ['Championship Points Multipliers', 'Podium Sector Climax', 'Apex Trophy Accolades'],
  },

  // MODE 21 — PROTECTED: BLACK HOLE / QUANTUM LAUNCH PRO
  BLACK_HOLE: {
    modeId: 'BLACK_HOLE',
    modeNumber: 21,
    environmentId: 'ENV_21_QUANTUM_LAUNCH_BLACK_HOLE',
    worldType: 'SUPERMASSIVE_BLACK_HOLE_COLLAPSE_UNIVERSE',
    displayName: 'Black Hole // Quantum Launch Pro (Protected)',
    themeDescription: 'The original protected Mode 21 Black Hole with Supermassive Black Hole visuals, 100-event catastrophe engine, and escape routes.',
    trackArchitecture: 'Orbital Highway Overlooking Supermassive Singularity with 3 Terminal Routes',
    structureSet: ['Orbital Launcher', 'Shelter Tower Complex', 'Terminal Escape Ramps'],
    scenerySet: ['Supermassive Black Hole Accretion Disk', 'Planetary Collisions', 'Relativistic Jets'],
    propSet: ['Holographic Quantum Countdown Clock', 'Warning Beacons'],
    hazardSet: ['100 Sequential Cosmic Catastrophe Events', 'Singularity Gravity Pull', 'Structural Track Collapse'],
    routeStyle: 'Full 15:00 collapse course with Route 01, Route 02, and Route 03 terminal escape paths',
    backgroundSet: ['Gargantua-Class Supermassive Black Hole', 'Dynamic Catastrophe Biomes'],
    atmosphere: {
      fogColor: 0x020817,
      fogDensity: 0.00035,
      dustColor: 0x00f0ff,
      skyboxTheme: 'CRYO_NEBULA',
    },
    lighting: {
      ambientColor: 0x0f172a,
      ambientIntensity: 0.8,
      sunColor: 0x38bdf8,
      sunIntensity: 1.8,
      sunPosition: [0, 180, -3500],
      accentColor: 0x00f0ff,
    },
    sky: {
      starCount: 1800,
      starColor: 0xffffff,
      nebulaColors: ['rgba(6,182,212,0.7)', 'rgba(147,51,234,0.5)', 'rgba(15,23,42,0.9)'],
      celestialFeature: 'Supermassive Black Hole with Gravitational Lensing & Relativistic Doppler Beaming',
    },
    environmentalEffects: ['Spaghettification Visuals', 'Gravitational Redshift Lensing', 'Accretion Disk Swirl'],
    gameplayInteractions: ['100-Event Catastrophe Alerts', 'Terminal Escape Route Docking', 'Shelter Evacuation'],
  },
};

export function getModeEnvironmentProfile(mode: GameMode | string): ModeEnvironmentProfile {
  const canonical = resolveCanonicalMode(mode);
  const profile = MODE_ENVIRONMENT_PROFILES[canonical];
  if (!profile) {
    console.error(`[MISSING ENVIRONMENT] Mode: ${mode} (canonical: ${canonical})`);
    throw new Error(`[MISSING ENVIRONMENT] Mode: ${mode} (canonical: ${canonical}) - No environment profile registered!`);
  }
  return profile;
}
