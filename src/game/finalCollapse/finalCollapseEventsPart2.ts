import { FinalCollapseEvent } from './finalCollapseEventsCatalog';

/**
 * FINAL COLLAPSE — EVENTS 34 TO 66 CATALOG (PART 2)
 *
 * Continues strictly from Event 33 (20:24) -> Event 66 (10:30).
 * Part 2 timing interval: ~18 seconds per event.
 *
 * Story Progression:
 * BEGINNING OF COLLAPSE -> ESCALATING STRUCTURAL FAILURE ->
 * ORBITAL NETWORK FAILURE -> CIVILIZATION FRAGMENTATION ->
 * MAJOR MEGASTRUCTURE FAILURE -> CRITICAL COLLAPSE
 *
 * STRICT BOUNDARY: Stops after Event 66. Events 67–100 are NOT implemented.
 */
export const FINAL_COLLAPSE_EVENTS_PART2: readonly FinalCollapseEvent[] = [
  // =========================================================================
  // EVENT 34: 20:06 — COMMUNICATION ARRAY FAILURE
  // =========================================================================
  {
    id: 'fc_34_communication_array_failure',
    eventNumber: 34,
    triggerTime: 594, // 20:06 (1800 - 1206 = 594s elapsed)
    countdownDisplay: '20:06',
    title: 'COMMUNICATION ARRAY FAILURE',
    description: 'Gravitational interference shears long-range comm links. Antenna dishes desynchronize and transmission beams warp into the horizon.',
    duration: 32,
    priority: 6,
    areaName: 'DEEP SPACE TELEMETRY CITADEL',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_INTERFERENCE_EXPANSION',
      description: 'Increased gravitational interference warping high-frequency electromagnetic communication paths.',
      intensity: 0.52,
      lensingBoost: 0.35,
      accretionTurbulence: 0.40,
    },
    environmentEffect: {
      type: 'COMM_SIGNAL_CURVATURE',
      description: 'Visible orbital transmission signals curve along geodesic paths into the accretion disk.',
      stellarDistortion: 0.42,
    },
    civilizationEffect: {
      type: 'COMM_ARRAY_DESYNC_PERSISTENT',
      description: 'Communication towers lose sync; dish arrays rotate erratically; transmission beams flicker and disconnect.',
      sensorAlerts: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 35: 19:48 — SOLAR COLLECTOR ARRAY COLLAPSE
  // =========================================================================
  {
    id: 'fc_35_solar_collector_array_collapse',
    eventNumber: 35,
    triggerTime: 612, // 19:48 (1800 - 1188 = 612s)
    countdownDisplay: '19:48',
    title: 'SOLAR COLLECTOR ARRAY COLLAPSE',
    description: 'Tidal torque buckles solar collector arrays. Photovoltaic sails tear free into tumbling golden debris clouds.',
    duration: 35,
    priority: 7,
    areaName: 'ORBITAL HELIOS ARRAY BETA',
    blackHoleEffect: {
      type: 'TIDAL_TORQUE_GRADIENT',
      description: 'Differential gravitational torque shears planar orbital megastructures.',
      intensity: 0.55,
      tidalPull: 0.54,
    },
    environmentEffect: {
      type: 'PHOTOVOLTAIC_DEBRIS_SWARM',
      description: 'Reflective gold-foil debris reflects warped starlight across the sector.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'SOLAR_ARRAY_TEAR_PERSISTENT',
      description: 'Solar collector trusses twist and snap; disconnected panel arrays drift toward the gravitational well.',
      structuralFractures: true,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 36: 19:30 — MAGNETIC TRANSPORT RAIL FAILURE
  // =========================================================================
  {
    id: 'fc_36_magnetic_transport_rail_failure',
    eventNumber: 36,
    triggerTime: 630, // 19:30
    countdownDisplay: '19:30',
    title: 'MAGNETIC TRANSPORT RAIL FAILURE',
    description: 'Superconducting maglev tracks experience cryogenic quench. High-speed transit rails fracture and spark violently.',
    duration: 30,
    priority: 7,
    areaName: 'INTER-DISTRICT MAGLEV SPAN',
    blackHoleEffect: {
      type: 'MAGNETIC_FIELD_RECONNECTION',
      description: 'Strong ergosphere magnetosphere couples with superconducting urban transit conduits.',
      intensity: 0.58,
      pulseDistortion: 0.48,
    },
    environmentEffect: {
      type: 'ELECTROMAGNETIC_AURORAL_SHOCK',
      description: 'Cyan magnetic arc filaments discharge across the upper transit corridors.',
      waveFrontActive: true,
    },
    civilizationEffect: {
      type: 'MAGLEV_RAIL_RUPTURE_PERSISTENT',
      description: 'Transit rail segments warp out of alignment; emergency brake beacons strobe crimson.',
      trafficChaos: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 37: 19:12 — SECONDARY ENERGY TOWER COLLAPSE
  // =========================================================================
  {
    id: 'fc_37_secondary_energy_tower_collapse',
    eventNumber: 37,
    triggerTime: 648, // 19:12
    countdownDisplay: '19:12',
    title: 'SECONDARY ENERGY TOWER COLLAPSE',
    description: 'Sister spire to the primary energy tower suffers catastrophic structural failure, cascading power failure through sector 4.',
    duration: 38,
    priority: 8,
    areaName: 'SECTOR 4 GRID SUBSTATION',
    blackHoleEffect: {
      type: 'PLASMA_SURGE_SIPHON',
      description: 'Power grid back-EMF creates a glowing plasma feedback discharge into the outer accretion shear.',
      intensity: 0.60,
      accretionTurbulence: 0.62,
    },
    environmentEffect: {
      type: 'GRID_BLACKOUT_HORIZON',
      description: 'A major quadrant of the orbital skyline dims into emergency auxiliary amber.',
      stellarDistortion: 0.45,
    },
    civilizationEffect: {
      type: 'SECONDARY_SPIRE_BREAK_PERSISTENT',
      description: 'Secondary energy tower breaks at mid-span; electrical plasma fire arcs between ruptured conduits.',
      powerSurge: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 38: 18:54 — INDUSTRIAL REFINERY DETACHMENT
  // =========================================================================
  {
    id: 'fc_38_industrial_refinery_detachment',
    eventNumber: 38,
    triggerTime: 666, // 18:54
    countdownDisplay: '18:54',
    title: 'INDUSTRIAL REFINERY DETACHMENT',
    description: 'Heavy plasma refinery module shears mooring pylons. Dense metallurgical tanks spill incandescent fuel streams.',
    duration: 36,
    priority: 8,
    areaName: 'ORBITAL HEAVY REFINERY 09',
    blackHoleEffect: {
      type: 'MASS_CONCENTRATION_GRAVITY_TEAR',
      description: 'High-density refinery mass induces extreme differential acceleration on support trusses.',
      intensity: 0.63,
      tidalPull: 0.65,
    },
    environmentEffect: {
      type: 'REFINERY_EXHAUST_PLUME',
      description: 'Gaseous orange vapor clouds exhaust into the void and spiral along accretion stream lines.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'REFINERY_PULL_AWAY_PERSISTENT',
      description: 'Heavy industrial refinery pulls away from orbital scaffolding; mooring cables snap.',
      platformSeparation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 39: 18:36 — ORBITAL HABITAT RING COMPRESSION
  // =========================================================================
  {
    id: 'fc_39_orbital_habitat_ring_compression',
    eventNumber: 39,
    triggerTime: 684, // 18:36
    countdownDisplay: '18:36',
    title: 'ORBITAL HABITAT RING COMPRESSION',
    description: 'Tidal forces compress circular residential habitat ring into a stressed oval. Internal structural bulkheads groan.',
    duration: 34,
    priority: 7,
    areaName: 'CENTRAL HABITAT TORUS',
    blackHoleEffect: {
      type: 'TIDAL_COMPRESSION_AXIS',
      description: 'Quadrupole gravitational deformation squeezes lateral orbital geometry while stretching radial axis.',
      intensity: 0.65,
      lensingBoost: 0.50,
    },
    environmentEffect: {
      type: 'GRAVITATIONAL_COMPRESSION_LENS',
      description: 'Background starfield behind the habitat ring compresses noticeably along the horizontal meridian.',
      stellarDistortion: 0.52,
    },
    civilizationEffect: {
      type: 'HABITAT_OVAL_DISTORTION_PERSISTENT',
      description: 'Rotating torus habitat warps into an eccentric ellipse; emergency pressure bulkheads seal.',
      structuralFractures: true,
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 40: 18:18 — MINING PLATFORM ROTATIONAL DESTABILIZATION
  // =========================================================================
  {
    id: 'fc_40_mining_platform_destabilization',
    eventNumber: 40,
    triggerTime: 702, // 18:18
    countdownDisplay: '18:18',
    title: 'MINING PLATFORM DESTABILIZATION',
    description: 'Asteroid mining platform loses gyroscopic control. High-inertia slag counterweights spin out of control.',
    duration: 35,
    priority: 7,
    areaName: 'DEEP CORE MINING PLATFORM',
    blackHoleEffect: {
      type: 'FRAME_DRAGGING_TORQUE',
      description: 'Kerr spacetime frame dragging exerts differential precession on heavy gyros.',
      intensity: 0.67,
      accretionTurbulence: 0.68,
    },
    environmentEffect: {
      type: 'EXTRACTED_ORE_DEBRIS_CORONA',
      description: 'Dense nickel-iron asteroid fragments spray in an expanding spiral pattern.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'MINING_RIG_TUMBLE_PERSISTENT',
      description: 'Mining platform tilts at an unstable 35-degree angle; cargo tether ropes sever.',
      megastructureRotation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 41: 18:00 — RESEARCH OUTPOST CRITICAL DESCENT
  // =========================================================================
  {
    id: 'fc_41_research_outpost_critical_descent',
    eventNumber: 41,
    triggerTime: 720, // 18:00
    countdownDisplay: '18:00',
    title: 'RESEARCH OUTPOST CRITICAL DESCENT',
    description: 'Outer astrophysics research outpost suffers thruster depletion. Orbital decay accelerates dangerously close to ISCO.',
    duration: 38,
    priority: 8,
    areaName: 'ASTROPHYSICS RESEARCH POD 03',
    blackHoleEffect: {
      type: 'ORBITAL_ENERGY_EXTRACTION',
      description: 'Station drops below critical orbital energy altitude into the ergosphere gradient.',
      intensity: 0.70,
      tidalPull: 0.72,
      photonRingBoost: 0.45,
    },
    environmentEffect: {
      type: 'IONIZATION_BOW_SHOCK',
      description: 'Atmospheric and plasma bow shock develops on the forward hull of the plunging outpost.',
      nebulaWarp: 0.55,
    },
    civilizationEffect: {
      type: 'OUTPOST_DESCENT_PROGRESSION_PERSISTENT',
      description: 'Research outpost descends another 140 meters toward the black hole; external sensor arrays break off.',
      stationDescent: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 42: 17:42 — ATMOSPHERIC BIODOME RUPTURE
  // =========================================================================
  {
    id: 'fc_42_atmospheric_biodome_rupture',
    eventNumber: 42,
    triggerTime: 738, // 17:42
    countdownDisplay: '17:42',
    title: 'ATMOSPHERIC BIODOME RUPTURE',
    description: 'Structural micro-fractures compromise residential biosphere dome. Massive decompression vents visible oxygen crystals.',
    duration: 36,
    priority: 8,
    areaName: 'ARCADIA RESIDENTIAL BIODOME',
    blackHoleEffect: {
      type: 'DECOMPRESSION_GAS_SIPHON',
      description: 'Escaping atmospheric vapor is ionized and drawn radially toward the photon sphere.',
      intensity: 0.72,
      accretionTurbulence: 0.70,
    },
    environmentEffect: {
      type: 'VAPOR_DECOMPRESSION_GALE',
      description: 'Pale blue crystalline ice fog expands into space, refracting distorted starlight.',
      stellarDistortion: 0.55,
    },
    civilizationEffect: {
      type: 'BIODOME_SHATTER_PERSISTENT',
      description: 'Transparent geodesic biodome fractures; emergency blast shutters close over residential modules.',
      structuralFractures: true,
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 43: 17:24 — CARGO DOCK EXPLOSIVE DECOMPRESSION
  // =========================================================================
  {
    id: 'fc_43_cargo_dock_explosive_decompression',
    eventNumber: 43,
    triggerTime: 756, // 17:24
    countdownDisplay: '17:24',
    title: 'CARGO DOCK DECOMPRESSION',
    description: 'Magnetic clamp failure triggers explosive bay venting. Dozens of standardized freight containers scatter into space.',
    duration: 32,
    priority: 7,
    areaName: 'ORBITAL FREIGHT TERMINAL 12',
    blackHoleEffect: {
      type: 'ORBITAL_SHEAR_SCATTER',
      description: 'Gravitational shear uncouples electromagnetic interlock mechanisms simultaneously.',
      intensity: 0.74,
      pulseDistortion: 0.55,
    },
    environmentEffect: {
      type: 'CONTAINER_CASCADE_FIELD',
      description: 'Tumbling orange and white cargo containers create an obstacle field along orbital highways.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'CARGO_CONTAINER_DISPERSION_PERSISTENT',
      description: 'Space dock container racks rupture; containers drift chaotically across local corridors.',
      spaceDockFailure: true,
      trafficChaos: true,
    },
  },

  // =========================================================================
  // EVENT 44: 17:06 — DEFENSE SATELLITE NETWORK DECAY
  // =========================================================================
  {
    id: 'fc_44_defense_satellite_decay',
    eventNumber: 44,
    triggerTime: 774, // 17:06
    countdownDisplay: '17:06',
    title: 'DEFENSE SATELLITE NETWORK DECAY',
    description: 'Orbital perimeter defense satellites lose attitude control. Automated targeting arrays fire blind calibration pulses.',
    duration: 30,
    priority: 6,
    areaName: 'PERIMETER DEFENSE GRID EPSILON',
    blackHoleEffect: {
      type: 'EM_SPECTRUM_DISTORTION',
      description: 'Gravitational redshift bends laser targeting wavelengths across the perimeter.',
      intensity: 0.76,
      lensingBoost: 0.60,
    },
    environmentEffect: {
      type: 'CALIBRATION_LASER_GRID',
      description: 'Intermittent cyan laser vectors crisscross the background void before curving into the event horizon.',
      stellarDistortion: 0.58,
    },
    civilizationEffect: {
      type: 'DEFENSE_GRID_FAILSAFE_PERSISTENT',
      description: 'Defense platforms switch to offline emergency beacon status; strobe pulse frequency quadruples.',
      towerWarningLights: true,
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 45: 16:48 — WORMHOLE STABILIZER FAILURE
  // =========================================================================
  {
    id: 'fc_45_wormhole_stabilizer_failure',
    eventNumber: 45,
    triggerTime: 792, // 16:48
    countdownDisplay: '16:48',
    title: 'WORMHOLE STABILIZER FAILURE',
    description: 'Exotic matter injectors in the Route 3 wormhole gate destabilize. Gravitational ripples distort local metric tensors.',
    duration: 38,
    priority: 9,
    areaName: 'EINSTEIN-ROSEN GATE ANCHOR',
    blackHoleEffect: {
      type: 'METRIC_TENSOR_INTERFERENCE',
      description: 'Destabilized wormhole field couples resonantly with the black hole ergosphere.',
      intensity: 0.78,
      pulseDistortion: 0.72,
      accretionTurbulence: 0.75,
    },
    environmentEffect: {
      type: 'SPACETIME_METRIC_FLICKER',
      description: 'Violent chromatic chromatic aberration ripples emanate from the wormhole rings.',
      waveFrontActive: true,
    },
    civilizationEffect: {
      type: 'WORMHOLE_PYLON_OSCILLATION_PERSISTENT',
      description: 'Wormhole containment rings wobble with eccentric precession; containment coils emit purple lightning.',
      powerSurge: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 46: 16:30 — SECONDARY ORBITAL RING SECTION FAILURE
  // =========================================================================
  {
    id: 'fc_46_secondary_ring_section_failure',
    eventNumber: 46,
    triggerTime: 810, // 16:30
    countdownDisplay: '16:30',
    title: 'SECONDARY RING FAILURE',
    description: 'A second 500-meter section of the primary orbital ring breaks away opposite the first, forming an asymmetric arc.',
    duration: 40,
    priority: 9,
    areaName: 'ORBITAL RING SECTOR 7 (EAST)',
    blackHoleEffect: {
      type: 'ASYMMETRIC_TIDAL_SHEAR',
      description: 'Rupture of structural hoop stress transforms the continuous ring into an open dynamic ribbon.',
      intensity: 0.80,
      tidalPull: 0.82,
    },
    environmentEffect: {
      type: 'STRUCTURAL_SHADOW_CAST',
      description: 'Massive detached girder shadows swing across the interior planetary reflection.',
      stellarDistortion: 0.62,
    },
    civilizationEffect: {
      type: 'RING_DUAL_BREAK_PERSISTENT',
      description: 'Second orbital ring section separates; high-tension cables recoil violently into space.',
      orbitalRingBreak: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 47: 16:12 — GRAVITATIONAL SHADOW SHIFT
  // =========================================================================
  {
    id: 'fc_47_gravitational_shadow_shift',
    eventNumber: 47,
    triggerTime: 828, // 16:12
    countdownDisplay: '16:12',
    title: 'GRAVITATIONAL SHADOW SHIFT',
    description: 'Relativistic precession rotates the apparent black hole silhouette. City illumination drops as deep penumbra sweeps through.',
    duration: 34,
    priority: 8,
    areaName: 'CENTRAL METROPOLITAN AXIS',
    blackHoleEffect: {
      type: 'RELATIVISTIC_BEAMING_ASYMMETRY',
      description: 'Doppler boosting concentrates accretion disk radiation forward, leaving trailing sectors in cold dark shadow.',
      intensity: 0.82,
      lensingBoost: 0.70,
    },
    environmentEffect: {
      type: 'DEEP_PENUMBRAL_OCCULTATION',
      description: 'Ambient space illumination drops by 60% as the dark silhouette sweeps through the sector.',
      stellarDistortion: 0.65,
    },
    civilizationEffect: {
      type: 'GLOBAL_OCCULTATION_DIMMING_PERSISTENT',
      description: 'City neon systems compensate with emergency ultraviolet high-visibility profiles.',
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 48: 15:54 — SUSPENDED DISTRICT ANCHOR CABLE TEAR
  // =========================================================================
  {
    id: 'fc_48_suspended_district_cable_tear',
    eventNumber: 48,
    triggerTime: 846, // 15:54
    countdownDisplay: '15:54',
    title: 'DISTRICT ANCHOR CABLE TEAR',
    description: 'Tension cables anchoring suspended residential sector 2 snap. The district swings dangerously along a pendulum arc.',
    duration: 36,
    priority: 8,
    areaName: 'SUSPENDED RESIDENTIAL SECTOR 2',
    blackHoleEffect: {
      type: 'PENDULUM_TIDAL_RESONANCE',
      description: 'Harmonic resonance between orbital period and cable tension shears composite diamond filament bundles.',
      intensity: 0.84,
      tidalPull: 0.85,
    },
    environmentEffect: {
      type: 'COMPOSITE_STRAND_SHOCKWAVE',
      description: 'Sonic-speed whip cracks of severed tension cables release visible spark clouds in vacuum.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'DISTRICT_SWING_PERSISTENT',
      description: 'Suspended district platform lists 20 degrees; connecting pedestrian bridges tear free.',
      platformSeparation: true,
      bridgeDeformation: 0.85,
    },
  },

  // =========================================================================
  // EVENT 49: 15:36 — HYDROCARBON REFINERY IGNITION
  // =========================================================================
  {
    id: 'fc_49_refinery_ignition',
    eventNumber: 49,
    triggerTime: 864, // 15:36
    countdownDisplay: '15:36',
    title: 'REFINERY TANK IGNITION',
    description: 'Compressional heating ignites ruptured cryogenic fuel reservoirs. A sustained incandescent jet vents across orbital lanes.',
    duration: 38,
    priority: 8,
    areaName: 'ORBITAL FUEL DEPOT GAMMA',
    blackHoleEffect: {
      type: 'TIDAL_COMPRESSION_HEATING',
      description: 'Gravitational compression forces trigger hypergolic ignition in pressurized propellant manifolds.',
      intensity: 0.86,
      accretionTurbulence: 0.80,
    },
    environmentEffect: {
      type: 'INCANDESCENT_THRUST_PLUME',
      description: 'Brilliant amber-white exhaust ribbon propels burning storage sphere toward the inner system.',
      nebulaWarp: 0.60,
    },
    civilizationEffect: {
      type: 'FUEL_DEPOT_FLARE_PERSISTENT',
      description: 'Refinery fuel depot glows bright thermal orange; neighboring structures reflect firelight.',
      powerSurge: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 50: 15:18 — ORBITAL ELEVATOR MID-SECTION COLLAPSE
  // =========================================================================
  {
    id: 'fc_50_orbital_elevator_mid_section_collapse',
    eventNumber: 50,
    triggerTime: 882, // 15:18
    countdownDisplay: '15:18',
    title: 'ELEVATOR MID-SECTION COLLAPSE',
    description: 'Previously bent space elevator reaches ultimate tensile limit. The 900-meter shaft snaps into two distinct tumbling halves.',
    duration: 42,
    priority: 9,
    areaName: 'MASSIVE SPACE ELEVATOR AXIS',
    blackHoleEffect: {
      type: 'ULTIMATE_TENSILE_RUPTURE',
      description: 'Tidal gradient across 1000m elevator length exceeds carbon nanotube theoretical tensile strength.',
      intensity: 0.88,
      tidalPull: 0.90,
      lensingBoost: 0.75,
    },
    environmentEffect: {
      type: 'ELEVATOR_DEBRIS_FALL',
      description: 'Lower elevator section plunges downward while upper counterweight platform rebounds into high orbit.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'ELEVATOR_SEVER_PERSISTENT',
      description: 'Space elevator shaft snaps at 450m mark; tension cables unwind into curling spirals; docking car falls free.',
      structuralFractures: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 51: 15:00 — OBSERVATION ARRAY STRUCTURAL SHEAR
  // =========================================================================
  {
    id: 'fc_51_observation_array_shear',
    eventNumber: 51,
    triggerTime: 900, // 15:00 (halfway milestone)
    countdownDisplay: '15:00',
    title: 'OBSERVATION ARRAY SHEAR',
    description: 'Primary gravitational telescope array collapses under extreme focus shear. Heavy sensor mirrors shatter.',
    duration: 36,
    priority: 8,
    areaName: 'HIGH APERTURE OBSERVATION CREST',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_CAUSTIC_SURGE',
      description: 'Singularity gravitational lensing caustics pass directly through optical receiver mounts.',
      intensity: 0.90,
      lensingBoost: 0.82,
    },
    environmentEffect: {
      type: 'MIRROR_SPECULAR_FLASHES',
      description: 'Thousands of hexagonal mirror fragments produce specular starlight flashes in deep space.',
      stellarDistortion: 0.70,
    },
    civilizationEffect: {
      type: 'ARRAY_MIRROR_SHATTER_PERSISTENT',
      description: 'Parabolic telescope dishes tilt limp; support pylons twist 40 degrees from vertical.',
      sensorAlerts: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 52: 14:42 — TRAFFIC NETWORK GLOBAL ROUTING SHUTDOWN
  // =========================================================================
  {
    id: 'fc_52_traffic_network_global_shutdown',
    eventNumber: 52,
    triggerTime: 918, // 14:42
    countdownDisplay: '14:42',
    title: 'TRAFFIC NETWORK SHUTDOWN',
    description: 'Orbital air traffic control supercluster experiences terminal desync. Autonomous civilian vehicles drift unguided.',
    duration: 32,
    priority: 7,
    areaName: 'AUTOMATED TRAFFIC CONTROL CITADEL',
    blackHoleEffect: {
      type: 'RELATIVISTIC_CLOCK_DRIFT',
      description: 'Gravitational time dilation differentials between orbital altitudes destroy positioning clock synchronization.',
      intensity: 0.91,
      accretionTurbulence: 0.82,
    },
    environmentEffect: {
      type: 'CHAOTIC_TRANSIT_VECTORS',
      description: 'Headlights and thruster plumes from abandoned transit craft scatter in random ballistic arcs.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'GLOBAL_TRAFFIC_ABANDON_PERSISTENT',
      description: 'Highway neon markers switch to amber warning; vehicle fleets drift away from formal flight lanes.',
      trafficChaos: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 53: 14:24 — CITY ENERGY SKYBRIDGE DISSOLUTION
  // =========================================================================
  {
    id: 'fc_53_energy_skybridge_dissolution',
    eventNumber: 53,
    triggerTime: 936, // 14:24
    countdownDisplay: '14:24',
    title: 'ENERGY SKYBRIDGE DISSOLUTION',
    description: 'Coherent energy conduits connecting central towers collapse. Luminous plasma spans flicker out into the void.',
    duration: 35,
    priority: 8,
    areaName: 'METROPOLIS ENERGY SPAN ALPHA',
    blackHoleEffect: {
      type: 'FIELD_DECOHERENCE_EVENT',
      description: 'Local magnetic containment field dissolved by fluctuating Kerr spacetime geometry.',
      intensity: 0.92,
      pulseDistortion: 0.78,
    },
    environmentEffect: {
      type: 'PLASMA_CONTAINMENT_DISCHARGE',
      description: 'Residual bridge plasma dissolves in sparkling blue-violet electromagnetic dust clouds.',
      nebulaWarp: 0.65,
    },
    civilizationEffect: {
      type: 'SKYBRIDGE_DECOHERENCE_PERSISTENT',
      description: 'Major illuminated energy bridges disappear; only glowing severed terminal pylons remain visible.',
      bridgeDeformation: 1.0,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 54: 14:06 — MEGASTRUCTURE FOUNDATION FRACTURE
  // =========================================================================
  {
    id: 'fc_54_megastructure_foundation_fracture',
    eventNumber: 54,
    triggerTime: 954, // 14:06
    countdownDisplay: '14:06',
    title: 'MEGASTRUCTURE FOUNDATION FRACTURE',
    description: 'Subterranean foundation bastions of the distant arch megastructure crack with seismic acoustic booms.',
    duration: 38,
    priority: 9,
    areaName: 'MEGASTRUCTURE ARCH BASEMENT',
    blackHoleEffect: {
      type: 'SEISMIC_METRIC_TRANSMISSION',
      description: 'Gravitational wave pulses resonate inside planetary core foundations, transmitting stress directly to structures.',
      intensity: 0.93,
      pulseDistortion: 0.85,
    },
    environmentEffect: {
      type: 'FOUNDATION_DEBRIS_BURST',
      description: 'Massive concrete and metallic shards eject from base anchor points into low space.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'MEGASTRUCTURE_FRACTURE_PERSISTENT',
      description: 'Deep zig-zag stress fissures glow along the megastructure arch body; rotational wobble increases.',
      megastructureRotation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 55: 13:48 — ATMOSPHERIC FLIGHT PLATFORM PLUNGE
  // =========================================================================
  {
    id: 'fc_55_flight_platform_plunge',
    eventNumber: 55,
    triggerTime: 972, // 13:48
    countdownDisplay: '13:48',
    title: 'FLIGHT PLATFORM PLUNGE',
    description: 'Suspended flight deck platform 3 loses all repulsor stability. The entire 200m hex-deck slides into the gravity funnel.',
    duration: 38,
    priority: 9,
    areaName: 'SUSPENDED FLIGHT DECK 3',
    blackHoleEffect: {
      type: 'REPULSOR_COIL_OVERLOAD',
      description: 'Anti-gravity repulsor field coils burn out simultaneously against increasing gravitational acceleration.',
      intensity: 0.94,
      tidalPull: 0.93,
    },
    environmentEffect: {
      type: 'DESCENT_VORTEX_STREAM',
      description: 'Plunging platform generates trailing ionization trails as it drops deeper into the accretion plane.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'HEX_PLATFORM_PLUNGE_PERSISTENT',
      description: 'Hexagonal flight platform drops 350 meters below city plane; edge warning lights blink violently.',
      platformSeparation: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 56: 13:30 — RESEARCH STATION SPAGHETTIFICATION INTENSIFICATION
  // =========================================================================
  {
    id: 'fc_56_station_spaghettification_intensification',
    eventNumber: 56,
    triggerTime: 990, // 13:30
    countdownDisplay: '13:30',
    title: 'STATION SPAGHETTIFICATION',
    description: 'Major orbital research station stretches to over three times its original length along the radial gravity vector.',
    duration: 40,
    priority: 9,
    areaName: 'MAJOR ORBITAL RESEARCH STATION',
    blackHoleEffect: {
      type: 'TIDAL_HYPER_ELONGATION',
      description: 'Differential gravitational acceleration between station head and tail exceeds 400g.',
      intensity: 0.95,
      tidalPull: 0.96,
      photonRingBoost: 0.65,
    },
    environmentEffect: {
      type: 'TIDAL_FILAMENT_CORONA',
      description: 'Station material glows dull crimson from internal frictional heating along its elongated needle profile.',
      nebulaWarp: 0.70,
    },
    civilizationEffect: {
      type: 'STATION_EXTREME_STRETCH_PERSISTENT',
      description: 'Research station central cylinder and torus stretch into needle-like profile; bio-domes deform into ellipsoids.',
      stationElongation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 57: 13:12 — GRAVITATIONAL FOCUSING OF STELLAR LIGHT
  // =========================================================================
  {
    id: 'fc_57_gravitational_focusing_starlight',
    eventNumber: 57,
    triggerTime: 1008, // 13:12
    countdownDisplay: '13:12',
    title: 'GRAVITATIONAL FOCUSING',
    description: 'Extreme gravitational lensing folds the background galaxy into multiple concentric Einstein rings around Sagittarius A*.',
    duration: 36,
    priority: 8,
    areaName: 'DEEP SPACE STELLAR CORONA',
    blackHoleEffect: {
      type: 'EINSTEIN_RING_MULTIPLICATION',
      description: 'Photon sphere captures and loops background starlight through multiple orbit revolutions.',
      intensity: 0.96,
      lensingBoost: 0.92,
      photonRingBoost: 0.75,
    },
    environmentEffect: {
      type: 'TRIPLE_EINSTEIN_RING_DISPLAY',
      description: 'Concentric incandescent photon rings shimmer with diamond-like brilliance around the black hole event horizon.',
      stellarDistortion: 0.85,
    },
    civilizationEffect: {
      type: 'STELLAR_CAUSTIC_ILLUMINATION_PERSISTENT',
      description: 'City skyscraper facades are illuminated by brilliant warped caustics of distant stars.',
      skylineLensingDistortion: true,
    },
  },

  // =========================================================================
  // EVENT 58: 12:54 — POWER GRID QUADRANT COLLAPSE
  // =========================================================================
  {
    id: 'fc_58_power_grid_quadrant_collapse',
    eventNumber: 58,
    triggerTime: 1026, // 12:54
    countdownDisplay: '12:54',
    title: 'POWER GRID QUADRANT COLLAPSE',
    description: 'Sub-stations 7 through 12 undergo cascading transformer detonation. Eastern metropolitan sector goes dark.',
    duration: 34,
    priority: 8,
    areaName: 'EASTERN METROPOLITAN SECTOR',
    blackHoleEffect: {
      type: 'SUPERCONDUCTOR_CRITICAL_CURRENT_EXCEEDED',
      description: 'Tidally induced eddy currents quench all regional superconductive distribution loops.',
      intensity: 0.96,
      accretionTurbulence: 0.85,
    },
    environmentEffect: {
      type: 'DARK_SKYLINE_CONTRAST',
      description: 'Sharply delineated boundary between illuminated western sector and pitch-black eastern sector.',
      stellarDistortion: 0.72,
    },
    civilizationEffect: {
      type: 'EASTERN_BLACKOUT_PERSISTENT',
      description: 'Eastern skyscrapers plunge into darkness; only faint red emergency beacon needles remain visible.',
      powerSurge: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 59: 12:36 — INDUSTRIAL FABRICATION PLATFORM TEAR
  // =========================================================================
  {
    id: 'fc_59_industrial_fabrication_platform_tear',
    eventNumber: 59,
    triggerTime: 1044, // 12:36
    countdownDisplay: '12:36',
    title: 'FABRICATION PLATFORM TEAR',
    description: 'Automated shipyard gantry platform breaks in half. Massive robotic construction arms hang lifelessly over the abyss.',
    duration: 36,
    priority: 8,
    areaName: 'ORBITAL SHIPYARD GANTRY 02',
    blackHoleEffect: {
      type: 'DIFFERENTIAL_ACCELERATION_SHEAR',
      description: 'Rigid truss structures unable to follow curved geodesic trajectories split across centerline.',
      intensity: 0.97,
      tidalPull: 0.95,
    },
    environmentEffect: {
      type: 'GANTRY_TRUSS_FRAGMENTATION',
      description: 'Kilometer-long steel girders drift slowly across the void, rotating end-over-end.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'FABRICATION_SPLIT_PERSISTENT',
      description: 'Shipyard gantry split down the middle; welding laser sparkers spark erratically into vacuum.',
      spaceDockFailure: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 60: 12:18 — ORBITAL RING CRITICAL FRAGMENTATION
  // =========================================================================
  {
    id: 'fc_60_orbital_ring_critical_fragmentation',
    eventNumber: 60,
    triggerTime: 1062, // 12:18
    countdownDisplay: '12:18',
    title: 'ORBITAL RING FRAGMENTATION',
    description: 'The mega-ring splits into four separate curved arc segments. Internal maglev rails whip wildly into space.',
    duration: 42,
    priority: 9,
    areaName: 'PRIMARY CIRCUMFERENTIAL ORBITAL RING',
    blackHoleEffect: {
      type: 'RING_STABILITY_CATASTROPHE',
      description: 'Loss of circumferential integrity causes dynamic buckling across all remaining ring sectors.',
      intensity: 0.97,
      tidalPull: 0.98,
      lensingBoost: 0.88,
    },
    environmentEffect: {
      type: 'RING_DEBRIS_ARC_DISPERSION',
      description: 'Multiple kilometer-scale ring sections begin separate eccentric orbits around the black hole.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'RING_FOUR_SEGMENT_BREAK_PERSISTENT',
      description: 'Primary orbital ring visibly severed into four disjointed arcs; transit track power rails dead.',
      orbitalRingBreak: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 61: 12:00 — MID-WAY COLLAPSE CREST (12:00 MILESTONE)
  // =========================================================================
  {
    id: 'fc_61_mid_way_collapse_crest',
    eventNumber: 61,
    triggerTime: 1080, // 12:00 (Exact 1080s milestone)
    countdownDisplay: '12:00',
    title: 'MID-WAY COLLAPSE CREST',
    description: 'Major gravitational wave crest sweeps through the civilization. The photon ring surges to brilliant double intensity.',
    duration: 42,
    priority: 10,
    areaName: 'EVENT HORIZON ERGOSPHERE BOUNDARY',
    blackHoleEffect: {
      type: 'MAJOR_GRAVITATIONAL_WAVE_SURGE',
      description: 'Intense gravitational wave wavefront ripples through the system; photon ring surges to peak brightness.',
      intensity: 0.98,
      pulseDistortion: 0.95,
      photonRingBoost: 0.90,
      lensingBoost: 0.92,
      accretionTurbulence: 0.92,
    },
    environmentEffect: {
      type: 'GRAVITATIONAL_SHOCK_WAVEFRONT',
      description: 'Concentric gravitational ripples distort starfield and nebula clouds with physical shockwave refraction.',
      waveFrontActive: true,
      nebulaWarp: 0.82,
    },
    civilizationEffect: {
      type: 'CIVILIZATION_GLOBAL_SHUDDER_PERSISTENT',
      description: 'All surviving towers and platforms shudder simultaneously; red alert lighting illuminates entire civilization.',
      towerWarningLights: true,
      sensorAlerts: true,
      structuralFractures: true,
      towerTilt: true,
    },
  },

  // =========================================================================
  // EVENT 62: 11:42 — RESIDENTIAL DISTRICT LATERAL DISPLACEMENT
  // =========================================================================
  {
    id: 'fc_62_residential_district_lateral_displacement',
    eventNumber: 62,
    triggerTime: 1098, // 11:42
    countdownDisplay: '11:42',
    title: 'DISTRICT LATERAL DISPLACEMENT',
    description: 'Residential platform cluster 1 breaks lateral docking clamps, shifting 80 meters askew from transit hubs.',
    duration: 36,
    priority: 8,
    areaName: 'RESIDENTIAL CLUSTER ALPHA',
    blackHoleEffect: {
      type: 'FRAME_DRAGGING_DISPLACEMENT',
      description: 'Lense-Thirring frame dragging shifts orbital plane of unanchored habitats.',
      intensity: 0.98,
      tidalPull: 0.96,
    },
    environmentEffect: {
      type: 'HABITAT_DRIFT_VECTOR',
      description: 'Multi-tower residential cluster drifts slowly on an inclined orbital trajectory.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'CLUSTER_LATERAL_OFFSET_PERSISTENT',
      description: 'Residential platform shifts 80m sideways; connecting skywalks sheared off at base.',
      platformSeparation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 63: 11:24 — OBSERVATION TOWER TOP SECTION SHEAR
  // =========================================================================
  {
    id: 'fc_63_observation_tower_top_shear',
    eventNumber: 63,
    triggerTime: 1116, // 11:24
    countdownDisplay: '11:24',
    title: 'OBSERVATION TOWER SHEAR',
    description: 'Upper 120-meter observation pod atop Western Sky Tower shears along mechanical floor 40 and tilts into the void.',
    duration: 38,
    priority: 9,
    areaName: 'WESTERN SKY TOWER APEX',
    blackHoleEffect: {
      type: 'HIGH_ALTITUDE_TIDAL_SHEAR',
      description: 'Extreme lever-arm tidal torque on tall skyscraper spires snaps structural core columns.',
      intensity: 0.98,
      tidalPull: 0.97,
    },
    environmentEffect: {
      type: 'TOWER_DEBRIS_CASCADE',
      description: 'Glass and titanium curtain wall panels cascade downward along the skyscraper flank.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'SKY_TOWER_APEX_TILT_PERSISTENT',
      description: 'Western Sky Tower crown section hangs at a 28-degree angle; structural core glowing red.',
      towerTilt: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 64: 11:06 — ACCRETION DISK RELATIVISTIC JET ERUPTION
  // =========================================================================
  {
    id: 'fc_64_accretion_jet_eruption',
    eventNumber: 64,
    triggerTime: 1134, // 11:06
    countdownDisplay: '11:06',
    title: 'RELATIVISTIC JET ERUPTION',
    description: 'Magnetic choke point triggers relativistic synchrotron plasma jet eruption from the black hole polar axis.',
    duration: 40,
    priority: 9,
    areaName: 'POLAR SYNCHROTRON AXIS',
    blackHoleEffect: {
      type: 'RELATIVISTIC_POLAR_JET_SURGE',
      description: 'Blinding ultraviolet-blue plasma jet shoots perpendicular to accretion disk, illuminating the entire sector.',
      intensity: 0.99,
      accretionTurbulence: 0.98,
      photonRingBoost: 0.88,
    },
    environmentEffect: {
      type: 'SYNCHROTRON_SKY_ILLUMINATION',
      description: 'Space sky lit by intense blue-white jet beam; nebula clouds reflect blinding ionizing radiation.',
      nebulaWarp: 0.88,
    },
    civilizationEffect: {
      type: 'SYNCHROTRON_SHADOW_CAST_PERSISTENT',
      description: 'Long dramatic shadows cast across all civilization structures by the polar plasma column.',
      towerWarningLights: true,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 65: 10:48 — MEGASTRUCTURE INNER RING DEFORMATION
  // =========================================================================
  {
    id: 'fc_65_megastructure_inner_ring_deformation',
    eventNumber: 65,
    triggerTime: 1152, // 10:48
    countdownDisplay: '10:48',
    title: 'MEGASTRUCTURE DEFORMATION',
    description: 'The distant arch megastructure buckles into an S-curve under asymmetric gravitational tension.',
    duration: 38,
    priority: 9,
    areaName: 'MEGASTRUCTURE ARCH CORE',
    blackHoleEffect: {
      type: 'QUADRUPOLE_TENSION_WARP',
      description: 'Spacetime curvature gradient bends kilometer-scale rigid architectures into smooth organic curves.',
      intensity: 0.99,
      lensingBoost: 0.95,
      tidalPull: 0.98,
    },
    environmentEffect: {
      type: 'CURVED_STRUCTURAL_PROFILE',
      description: 'Once-linear architectural lines curve gracefully yet catastrophically across the background.',
      stellarDistortion: 0.88,
    },
    civilizationEffect: {
      type: 'MEGASTRUCTURE_S_CURVE_PERSISTENT',
      description: 'Megastructure arch permanently warped into eccentric S-curve; rotation velocity peaks.',
      megastructureRotation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 66: 10:30 — CRITICAL CIVILIZATION FRAGMENTATION (END OF PART 2)
  // =========================================================================
  {
    id: 'fc_66_critical_civilization_fragmentation',
    eventNumber: 66,
    triggerTime: 1170, // 10:30 (Exact 1170s milestone)
    countdownDisplay: '10:30',
    title: 'CRITICAL FRAGMENTATION',
    description: 'End of Part 2. The unified orbital civilization has fragmented into compromised island districts. Black hole reaches critical turbulence.',
    duration: 44,
    priority: 10,
    areaName: 'ENTIRE CIVILIZATION SECTOR',
    blackHoleEffect: {
      type: 'PART_2_TERMINAL_CRITICAL_TURBULENCE',
      description: 'Significantly more active black hole; stronger gravitational lensing; turbulent accretion disk; distorted photon ring. Marks end of Part 2.',
      intensity: 1.0,
      lensingBoost: 1.0,
      photonRingBoost: 0.95,
      accretionTurbulence: 1.0,
      tidalPull: 1.0,
      pulseDistortion: 0.98,
    },
    environmentEffect: {
      type: 'CIVILIZATION_ISLAND_DISPERSION',
      description: 'Fragmented orbital civilization surrounded by organized debris streams, distorted starfield, and surviving compromised districts.',
      debrisStreamActive: true,
      stellarDistortion: 0.92,
      nebulaWarp: 0.90,
    },
    civilizationEffect: {
      type: 'PART_2_TERMINAL_CONSEQUENCES_PERSISTENT',
      description: 'Communication network shattered; transport infra broken; power grid failing; residential districts displaced; wormhole unstable; ring sections broken; megastructure unstable. Part 2 Complete.',
      structuralFractures: true,
      towerTilt: true,
      platformSeparation: true,
      orbitalRingBreak: true,
      megastructureRotation: true,
      powerSurge: true,
      trafficChaos: true,
      towerWarningLights: true,
      sensorAlerts: true,
    },
  },
];
