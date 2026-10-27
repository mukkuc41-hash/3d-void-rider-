/**
 * FINAL COLLAPSE — EVENTS 1 TO 33 CATALOG (PART 1)
 *
 * 100 genuinely different events across a 30-minute total countdown (1800s).
 * Part 1 covers Events 1 through 33 (30:00 -> ~20:24) at 18-second intervals.
 *
 * Each event defines:
 * - Specific physical phenomenon
 * - Black-hole visual reaction
 * - Environmental reaction
 * - Futuristic orbital-civilization reaction
 * - Persistence & duration
 */

export interface FinalCollapseEvent {
  id: string;
  eventNumber: number;
  triggerTime: number; // in seconds from 30:00 start (0 to 1800)
  countdownDisplay: string; // e.g. "30:00", "29:42"
  title: string;
  description: string;
  duration: number; // visual animation lifecycle duration in seconds
  priority: number; // 1 to 10 scale
  areaName: string;
  blackHoleEffect: {
    type: string;
    description: string;
    intensity: number;
    lensingBoost?: number;
    photonRingBoost?: number;
    accretionTurbulence?: number;
    pulseDistortion?: number;
    plasmaReversal?: boolean;
    tidalPull?: number;
  };
  environmentEffect: {
    type: string;
    description: string;
    stellarDistortion?: number;
    orbitalDrift?: number;
    moonDisplacement?: number;
    asteroidCapture?: boolean;
    nebulaWarp?: number;
    debrisStreamActive?: boolean;
    waveFrontActive?: boolean;
  };
  civilizationEffect: {
    type: string;
    description: string;
    sensorAlerts?: boolean;
    towerWarningLights?: boolean;
    arrayTrackingTarget?: 'BLACK_HOLE' | 'MOON' | 'PLANET' | 'ASTEROID';
    bridgeDeformation?: number;
    powerSurge?: boolean;
    stationDescent?: boolean;
    structuralFractures?: boolean;
    towerTilt?: boolean;
    trafficChaos?: boolean;
    spaceDockFailure?: boolean;
    energyTowerCollapse?: boolean;
    orbitalRingBreak?: boolean;
    skylineLensingDistortion?: boolean;
    stationElongation?: boolean;
    megastructureRotation?: boolean;
    platformSeparation?: boolean;
    foundationTear?: boolean;
  };
}

export const FINAL_COLLAPSE_EVENTS_PART1: readonly FinalCollapseEvent[] = [
  // =========================================================================
  // EVENT 01: 30:00 — SINGULARITY ACTIVATION
  // =========================================================================
  {
    id: 'fc_01_singularity_activation',
    eventNumber: 1,
    triggerTime: 0,
    countdownDisplay: '30:00',
    title: 'SINGULARITY ACTIVATION',
    description: 'The black hole awakens. Subtle gravitational pulse ripples through space as the photon ring begins forming.',
    duration: 26,
    priority: 3,
    areaName: 'ORBITAL OBSERVATORY PERIMETER',
    blackHoleEffect: {
      type: 'SINGULARITY_AWAKENING',
      description: 'Subtle gravitational pulse, photon ring begins forming, accretion disk slowly activates, distant lensing begins.',
      intensity: 0.15,
      lensingBoost: 0.08,
      photonRingBoost: 0.20,
      accretionTurbulence: 0.10,
      pulseDistortion: 0.12,
    },
    environmentEffect: {
      type: 'STAR_SHIFT',
      description: 'Nearby stars shift slightly as spacetime curvature awakens.',
      stellarDistortion: 0.10,
    },
    civilizationEffect: {
      type: 'OBSERVATORY_ALERT',
      description: 'Observation towers detect the anomaly, sensors activate, lights change into warning patterns, communication arrays rotate toward singularity.',
      sensorAlerts: true,
      towerWarningLights: true,
      arrayTrackingTarget: 'BLACK_HOLE',
    },
  },

  // =========================================================================
  // EVENT 02: 29:42 — STARLIGHT BENDING
  // =========================================================================
  {
    id: 'fc_02_starlight_bending',
    eventNumber: 2,
    triggerTime: 18,
    countdownDisplay: '29:42',
    title: 'STARLIGHT BENDING',
    description: 'Gravitational lensing intensifies. Distant stars visibly curve around the black-hole shadow.',
    duration: 24,
    priority: 3,
    areaName: 'ASTROMETRICS SKYLINE',
    blackHoleEffect: {
      type: 'LENSING_ESCALATION',
      description: 'Gravitational lensing increases; distant stars curve around the black hole shadow.',
      intensity: 0.25,
      lensingBoost: 0.22,
    },
    environmentEffect: {
      type: 'STARFIELD_CURVATURE',
      description: 'Starfield trajectories appear bent along Schwarzschild geodesics.',
      stellarDistortion: 0.28,
    },
    civilizationEffect: {
      type: 'TRACKING_ARRAY_LOCK',
      description: 'Observation towers automatically rotate toward black hole; tracking arrays follow distorted starlight.',
      arrayTrackingTarget: 'BLACK_HOLE',
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 03: 29:24 — ORBITAL DRIFT
  // =========================================================================
  {
    id: 'fc_03_orbital_drift',
    eventNumber: 3,
    triggerTime: 36,
    countdownDisplay: '29:24',
    title: 'ORBITAL DRIFT',
    description: 'Gravity-field influence expands slightly. Floating residential platforms slowly deviate from their normal orbital paths.',
    duration: 26,
    priority: 4,
    areaName: 'RESIDENTIAL HABITAT FLOTILLA',
    blackHoleEffect: {
      type: 'GRAVITY_FIELD_GROWTH',
      description: 'Gravity-field influence increases slightly with gradual tidal drag.',
      intensity: 0.30,
      tidalPull: 0.20,
    },
    environmentEffect: {
      type: 'PLATFORM_DRIFT',
      description: 'Floating platforms slowly deviate from normal orbital paths.',
      orbitalDrift: 0.25,
    },
    civilizationEffect: {
      type: 'TRAJECTORY_CORRECTION',
      description: 'Residential platforms and suspended structures begin drifting; navigation lights visibly correct their trajectories.',
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 04: 29:06 — PHOTON RING IGNITION
  // =========================================================================
  {
    id: 'fc_04_photon_ring_ignition',
    eventNumber: 4,
    triggerTime: 54,
    countdownDisplay: '29:06',
    title: 'PHOTON RING IGNITION',
    description: 'A thin, bright, asymmetric photon ring ignites around the shadow boundary, rotating subtly under lensing.',
    duration: 28,
    priority: 5,
    areaName: 'SYNCHROTRON TOWER SPINDLES',
    blackHoleEffect: {
      type: 'PHOTON_RING_SHARPEN',
      description: 'Clearly visible thin, bright, asymmetric photon ring around the shadow, partially obscured by lensing, rotating subtly.',
      intensity: 0.45,
      photonRingBoost: 0.65,
      accretionTurbulence: 0.25,
    },
    environmentEffect: {
      type: 'EM_INDUCTION_FIELD',
      description: 'High-frequency synchrotron radiation flares across the surrounding vacuum.',
    },
    civilizationEffect: {
      type: 'WINDOW_EM_FLICKER',
      description: 'Tower windows flicker as electromagnetic systems react; observation structures increase sensor intensity.',
      sensorAlerts: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 05: 28:48 — GRAVITY PULSE
  // =========================================================================
  {
    id: 'fc_05_gravity_pulse',
    eventNumber: 5,
    triggerTime: 72,
    countdownDisplay: '28:48',
    title: 'GRAVITY PULSE',
    description: 'A strong gravitational pulse propagates through the region. Suspended structures physically shake and loose debris shifts.',
    duration: 22,
    priority: 5,
    areaName: 'CENTRAL ENERGY ARTERY',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_SHOCK_PULSE',
      description: 'Strong gravitational pulse via subtle spatial distortion rather than a giant circular shockwave.',
      intensity: 0.50,
      pulseDistortion: 0.45,
    },
    environmentEffect: {
      type: 'SEISMIC_SPATIAL_SHAKE',
      description: 'Suspended structures physically shake; loose debris shifts along orbital lanes.',
    },
    civilizationEffect: {
      type: 'BRIDGE_VIBRATION',
      description: 'Tower lights flicker, floating platforms oscillate, energy bridges vibrate.',
      bridgeDeformation: 0.35,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 06: 28:30 — SKYBRIDGE DISTORTION
  // =========================================================================
  {
    id: 'fc_06_skybridge_distortion',
    eventNumber: 6,
    triggerTime: 90,
    countdownDisplay: '28:30',
    title: 'SKYBRIDGE DISTORTION',
    description: 'Local tidal forces increase. Floating energy skybridges connecting towers bend toward the singularity.',
    duration: 25,
    priority: 5,
    areaName: 'METROPOLIS INTER-TOWER CONDUITS',
    blackHoleEffect: {
      type: 'TIDAL_DISTORTION_LOCAL',
      description: 'Tidal distortion increases locally along the inner megastructure quadrant.',
      intensity: 0.55,
      tidalPull: 0.42,
    },
    environmentEffect: {
      type: 'ENERGY_STREAM_WARP',
      description: 'Ambient energy conduits curve visibly toward the gravitational well.',
    },
    civilizationEffect: {
      type: 'SKYBRIDGE_PHYSICAL_BEND',
      description: 'Floating bridges connecting towers visibly deform; endpoints remain attached while energy flows stretch.',
      bridgeDeformation: 0.70,
    },
  },

  // =========================================================================
  // EVENT 07: 28:12 — MOON ORBIT SHIFT
  // =========================================================================
  {
    id: 'fc_07_moon_orbit_shift',
    eventNumber: 7,
    triggerTime: 108,
    countdownDisplay: '28:12',
    title: 'MOON ORBIT SHIFT',
    description: 'Gravitational influence on the nearby celestial moon increases, bending its orbital trajectory inward.',
    duration: 30,
    priority: 6,
    areaName: 'LUNAR OBSERVATION BASTION',
    blackHoleEffect: {
      type: 'MACRO_TIDAL_PULL',
      description: 'Gravitational influence on a nearby moon visibly alters its orbital plane.',
      intensity: 0.58,
      tidalPull: 0.50,
    },
    environmentEffect: {
      type: 'MOON_TRAJECTORY_CHANGE',
      description: 'Moon orbit visibly changes; begins moving toward the collapse region.',
      moonDisplacement: 0.35,
    },
    civilizationEffect: {
      type: 'LUNAR_TRACKING_ARRAYS',
      description: 'Orbital observation arrays track the moon; warning beams point toward its new trajectory.',
      arrayTrackingTarget: 'MOON',
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 08: 27:54 — ASTEROID CAPTURE
  // =========================================================================
  {
    id: 'fc_08_asteroid_capture',
    eventNumber: 8,
    triggerTime: 126,
    countdownDisplay: '27:54',
    title: 'ASTEROID CAPTURE',
    description: 'A massive 80-meter asteroid is pulled into an inward spiral around the black hole. Mining drones scatter in evasion.',
    duration: 32,
    priority: 6,
    areaName: 'MINING DRIFT PERIMETER',
    blackHoleEffect: {
      type: 'KEPLERIAN_CAPTURE',
      description: 'Captures one large asteroid into an inward decaying spiral orbit.',
      intensity: 0.60,
      tidalPull: 0.55,
    },
    environmentEffect: {
      type: 'ASTEROID_INWARD_SPIRAL',
      description: 'Asteroid trajectory curves around the black hole while remaining recognizable.',
      asteroidCapture: true,
    },
    civilizationEffect: {
      type: 'MINING_DRONE_SCATTER',
      description: 'Mining platforms detect the captured asteroid; mining drones scatter and change course.',
      arrayTrackingTarget: 'ASTEROID',
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 09: 27:36 — SPACE ELEVATOR SWAY
  // =========================================================================
  {
    id: 'fc_09_space_elevator_sway',
    eventNumber: 9,
    triggerTime: 144,
    countdownDisplay: '27:36',
    title: 'SPACE ELEVATOR SWAY',
    description: 'Strong tidal forces strike the massive space elevator. The tower bends toward the singularity and cables displace.',
    duration: 28,
    priority: 6,
    areaName: 'ORBITAL TETHER SPINE',
    blackHoleEffect: {
      type: 'TIDAL_TORQUE_GRADIENT',
      description: 'Stronger vertical tidal force applied to the massive orbital elevator shaft.',
      intensity: 0.62,
      tidalPull: 0.58,
    },
    environmentEffect: {
      type: 'TETHER_TENSION_RIPPLE',
      description: 'Super-tensile carbon cables sway and deflect under gravitational strain.',
    },
    civilizationEffect: {
      type: 'ELEVATOR_BEND_PERSISTENT',
      description: 'Elevator tower bends toward singularity; cables become visibly displaced; alignment becomes unstable.',
      structuralFractures: true,
      towerTilt: true,
    },
  },

  // =========================================================================
  // EVENT 10: 27:18 — NEBULA LENSING
  // =========================================================================
  {
    id: 'fc_10_nebula_lensing',
    eventNumber: 10,
    triggerTime: 162,
    countdownDisplay: '27:18',
    title: 'NEBULA LENSING',
    description: 'Large-scale gravitational lensing bends the distant cosmic nebula into glowing luminous Einstein arcs.',
    duration: 28,
    priority: 5,
    areaName: 'DEEP SPACE HORIZON',
    blackHoleEffect: {
      type: 'MACRO_NEBULA_LENSING',
      description: 'Large-scale gravitational lensing curves the background nebula into luminous arc formations.',
      intensity: 0.65,
      lensingBoost: 0.55,
    },
    environmentEffect: {
      type: 'CURVED_NEBULA_STRUCTURES',
      description: 'Distant nebula visibly bends around the black hole, creating curved luminous streamers.',
      nebulaWarp: 0.60,
    },
    civilizationEffect: {
      type: 'OPTICAL_TOWER_GHOSTING',
      description: 'Distant towers appear visually duplicated through the outer lensing field (optical refraction).',
      skylineLensingDistortion: true,
    },
  },

  // =========================================================================
  // EVENT 11: 27:00 — ORBITAL RING VIBRATION
  // =========================================================================
  {
    id: 'fc_11_orbital_ring_vibration',
    eventNumber: 11,
    triggerTime: 180,
    countdownDisplay: '27:00',
    title: 'ORBITAL RING VIBRATION',
    description: 'Tidal resonance travels through the giant orbital megastructure ring. Support pylons oscillate and lights ripple irregularly.',
    duration: 24,
    priority: 5,
    areaName: 'CIRCUMFERENTIAL ORBITAL RING',
    blackHoleEffect: {
      type: 'TIDAL_OSCILLATION_WAVE',
      description: 'Sends harmonic tidal oscillations through the circumferential megastructure ring.',
      intensity: 0.66,
      pulseDistortion: 0.35,
    },
    environmentEffect: {
      type: 'CIRCULAR_RESONANCE',
      description: 'Ring acoustic vibrations transmit through magnetic couplings.',
    },
    civilizationEffect: {
      type: 'RING_SUPPORT_OSCILLATION',
      description: 'Massive orbital ring vibrates; support structures oscillate; lights travel around the ring irregularly.',
      bridgeDeformation: 0.45,
    },
  },

  // =========================================================================
  // EVENT 12: 26:42 — CITY POWER SURGE
  // =========================================================================
  {
    id: 'fc_12_city_power_surge',
    eventNumber: 12,
    triggerTime: 198,
    countdownDisplay: '26:42',
    title: 'CITY POWER SURGE',
    description: 'Accretion disk plasma instabilities induce massive electromagnetic surges. Energy towers surge and billboards flicker.',
    duration: 25,
    priority: 6,
    areaName: 'POWER GRID NEXUS',
    blackHoleEffect: {
      type: 'EM_PLASMA_INSTABILITY',
      description: 'Electromagnetic and plasma instability surges across the relativistic accretion disk.',
      intensity: 0.68,
      accretionTurbulence: 0.58,
    },
    environmentEffect: {
      type: 'AURORA_DISCHARGE',
      description: 'Ionized atmospheric discharge arcs across the outer hull plates.',
    },
    civilizationEffect: {
      type: 'ENERGY_NETWORK_SURGE',
      description: 'Energy towers surge, power conduits brighten, towers temporarily overload, holographic billboards flicker.',
      powerSurge: true,
      bridgeDeformation: 0.50,
    },
  },

  // =========================================================================
  // EVENT 13: 26:24 — PLASMA CURRENT REVERSAL
  // =========================================================================
  {
    id: 'fc_13_plasma_current_reversal',
    eventNumber: 13,
    triggerTime: 216,
    countdownDisplay: '26:24',
    title: 'PLASMA CURRENT REVERSAL',
    description: 'Accretion disk plasma flow temporarily reverses direction. Energy transmission lines reverse visible flow toward singularity.',
    duration: 26,
    priority: 7,
    areaName: 'MAGNETIC CONFINEMENT FLUX',
    blackHoleEffect: {
      type: 'PLASMA_FLOW_REVERSAL',
      description: 'Accretion-disk plasma flow temporarily reverses direction, demonstrating abnormal relativistic circulation.',
      intensity: 0.70,
      plasmaReversal: true,
      accretionTurbulence: 0.65,
    },
    environmentEffect: {
      type: 'REVERSED_ENERGY_STREAMS',
      description: 'Nearby energy streams reverse their orbital direction.',
    },
    civilizationEffect: {
      type: 'GRID_POLARITY_FLIP',
      description: 'Power transmission lines reverse their visible flow toward singularity; energy towers show directional flow.',
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 14: 26:06 — STATION ORBIT FAILURE
  // =========================================================================
  {
    id: 'fc_14_station_orbit_failure',
    eventNumber: 14,
    triggerTime: 234,
    countdownDisplay: '26:06',
    title: 'STATION ORBIT FAILURE',
    description: 'Tidal influence destabilizes a major orbital space station. Docked structures separate as the station begins descending.',
    duration: 30,
    priority: 7,
    areaName: 'OUTER RESEARCH DOCK SECTOR',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_DESCENT_PULL',
      description: 'Tidal influence pulls a major orbital station downward toward the outer gravitational basin.',
      intensity: 0.72,
      tidalPull: 0.65,
    },
    environmentEffect: {
      type: 'STATION_TRAJECTORY_DECAY',
      description: 'Station orbit becomes unstable, descending slowly toward the singularity.',
    },
    civilizationEffect: {
      type: 'STATION_DESCENT_EMERGENCY',
      description: 'Major station descends; docked structures separate slightly; navigation lights change to emergency mode.',
      stationDescent: true,
      towerWarningLights: true,
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 15: 25:48 — GRAVITY SHADOW
  // =========================================================================
  {
    id: 'fc_15_gravity_shadow',
    eventNumber: 15,
    triggerTime: 252,
    countdownDisplay: '25:48',
    title: 'GRAVITY SHADOW',
    description: 'A colossal gravitational shadow passes across the civilization. Sections darken and tower lights shut down in an eerie wave.',
    duration: 26,
    priority: 6,
    areaName: 'CENTRAL CIVILIZATION ARC',
    blackHoleEffect: {
      type: 'MACRO_GRAVITY_SHADOW',
      description: 'Large-scale gravitational shadow passes across environment; exposure drops, starfield dims, lensing deepens.',
      intensity: 0.74,
      lensingBoost: 0.68,
    },
    environmentEffect: {
      type: 'STARFIELD_ECLIPSE',
      description: 'Cosmic background light dims under deep gravitational optical occlusion.',
      stellarDistortion: 0.50,
    },
    civilizationEffect: {
      type: 'TRAVELING_BLACKOUT_WAVE',
      description: 'Entire sections of the orbital civilization temporarily darken; lighting shuts down in a traveling wave.',
      powerSurge: false,
      towerWarningLights: false,
    },
  },

  // =========================================================================
  // EVENT 16: 25:30 — FIRST STRUCTURAL FRACTURE
  // =========================================================================
  {
    id: 'fc_16_first_structural_fracture',
    eventNumber: 16,
    triggerTime: 270,
    countdownDisplay: '25:30',
    title: 'FIRST STRUCTURAL FRACTURE',
    description: 'Tidal stress passes engineering limits. Small visible structural fractures appear across selected orbital platforms.',
    duration: 28,
    priority: 7,
    areaName: 'INDUSTRIAL CANTILEVER BRACKETS',
    blackHoleEffect: {
      type: 'TIDAL_SHEAR_THRESHOLD',
      description: 'Tidal gradient exceeds structural yield strength across mid-distance architecture.',
      intensity: 0.76,
      tidalPull: 0.70,
    },
    environmentEffect: {
      type: 'MICRO_DEBRIS_DISCHARGE',
      description: 'Stress fractures vent compressed gasses and small metallic fragments into the void.',
    },
    civilizationEffect: {
      type: 'PLATFORM_FRACTURES_VISIBLE',
      description: 'Visible structural fractures appear across selected orbital platforms; marks transition from instability to physical damage.',
      structuralFractures: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 17: 25:12 — TOWER LEAN
  // =========================================================================
  {
    id: 'fc_17_tower_lean',
    eventNumber: 17,
    triggerTime: 288,
    countdownDisplay: '25:12',
    title: 'TOWER LEAN',
    description: 'Directional tidal pull causes several recognizable space skyscraper towers to visibly tilt toward the singularity.',
    duration: 30,
    priority: 7,
    areaName: 'HIGH-ALTITUDE SKYSCRAPER CLUSTER',
    blackHoleEffect: {
      type: 'DIRECTIONAL_TIDAL_TORQUE',
      description: 'Strong directional tidal pull vectoring toward the black hole center.',
      intensity: 0.78,
      tidalPull: 0.74,
    },
    environmentEffect: {
      type: 'LOCAL_GRAVITY_VECTOR_SHIFT',
      description: 'Local plumb lines tilt 8 to 15 degrees toward the singularity.',
    },
    civilizationEffect: {
      type: 'SKYSCRAPER_TILT_PERSISTENT',
      description: 'Several recognizable space towers visibly tilt toward the singularity; their lights remain active as movement is slow and deliberate.',
      towerTilt: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 18: 24:54 — DEBRIS STREAM FORMATION
  // =========================================================================
  {
    id: 'fc_18_debris_stream_formation',
    eventNumber: 18,
    triggerTime: 306,
    countdownDisplay: '24:54',
    title: 'DEBRIS STREAM FORMATION',
    description: 'An organized gravitational debris stream forms. Damaged construction materials and structural fragments join the curved orbit.',
    duration: 32,
    priority: 7,
    areaName: 'ORBITAL HIGHWAY CORRIDOR',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_STREAM_FOCUS',
      description: 'Forms an organized gravitational accretion stream drawing loose mass into a defined ribbon.',
      intensity: 0.80,
      tidalPull: 0.76,
    },
    environmentEffect: {
      type: 'ORGANIZED_DEBRIS_RIBBON',
      description: 'Loose debris begins following a curved, organized orbital path toward the black hole.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'STRUCTURAL_SHEDDING',
      description: 'Damaged construction materials and small structural fragments detach and join the stream; objects remain recognizable.',
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 19: 24:36 — ORBITAL TRAFFIC CHAOS
  // =========================================================================
  {
    id: 'fc_19_orbital_traffic_chaos',
    eventNumber: 19,
    triggerTime: 324,
    countdownDisplay: '24:36',
    title: 'ORBITAL TRAFFIC CHAOS',
    description: 'Navigation vectors are scrambled. Automated spacecraft lose paths, avoid collisions, spiral, and cross orbital lanes in panic.',
    duration: 28,
    priority: 6,
    areaName: 'CIVILIAN TRANSPORT CORRIDORS',
    blackHoleEffect: {
      type: 'NAVIGATION_VECTOR_SCRAMBLE',
      description: 'Gravitomagnetic frame dragging disrupts radio-astronomy beacons and orbital navigation vectors.',
      intensity: 0.82,
    },
    environmentEffect: {
      type: 'SCATTERED_LIGHT_STREAKS',
      description: 'Ion engine thruster plumes crisscross the sector as guidance computers struggle.',
    },
    civilizationEffect: {
      type: 'AUTONOMOUS_TRAFFIC_EVASION',
      description: 'Automated spacecraft lose normal paths: vehicles change direction, avoid collisions, spiral, cross orbital lanes.',
      trafficChaos: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 20: 24:18 — GRAVITY WAVE FRONT
  // =========================================================================
  {
    id: 'fc_20_gravity_wave_front',
    eventNumber: 20,
    triggerTime: 342,
    countdownDisplay: '24:18',
    title: 'GRAVITY WAVE FRONT',
    description: 'A powerful gravitational wave front passes through the sector. Structures bend, bridges oscillate, and platforms shift.',
    duration: 25,
    priority: 8,
    areaName: 'SECTOR-WIDE HORIZON',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_WAVE_FRONT',
      description: 'Generates a strong, coherent gravitational wave front; visualized as spatial deformation rather than a generic solid wall.',
      intensity: 0.84,
      pulseDistortion: 0.75,
    },
    environmentEffect: {
      type: 'SPATIAL_METRIC_WAVE',
      description: 'Wave front passes visibly through the scene, compressing and dilating space coordinates.',
      waveFrontActive: true,
    },
    civilizationEffect: {
      type: 'STRUCTURE_TRANSIENT_BENDING',
      description: 'Structures bend temporarily as wave passes; energy bridges oscillate; platforms shift.',
      bridgeDeformation: 0.85,
    },
  },

  // =========================================================================
  // EVENT 21: 24:00 — PLANETARY LENSING
  // =========================================================================
  {
    id: 'fc_21_planetary_lensing',
    eventNumber: 21,
    triggerTime: 360,
    countdownDisplay: '24:00',
    title: 'PLANETARY LENSING',
    description: 'Extreme lensing distorts the distant celestial planet, stretching and duplicating it along the photon boundary.',
    duration: 30,
    priority: 7,
    areaName: 'OUTER CELESTIAL VISTA',
    blackHoleEffect: {
      type: 'EXTREME_PLANETARY_LENSING',
      description: 'Strong lensing affects distant planet, wrapping its image around the black-hole shadow perimeter.',
      intensity: 0.86,
      lensingBoost: 0.85,
    },
    environmentEffect: {
      type: 'PLANETARY_MIRAGE_WRAP',
      description: 'Planet appears stretched and partially duplicated around the black-hole shadow.',
    },
    civilizationEffect: {
      type: 'OBSERVATION_ARRAY_LOCK_PLANET',
      description: 'Observation arrays lock onto the stretched planet to record metric distortions.',
      arrayTrackingTarget: 'PLANET',
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 22: 23:42 — SPACE DOCK FAILURE
  // =========================================================================
  {
    id: 'fc_22_space_dock_failure',
    eventNumber: 22,
    triggerTime: 378,
    countdownDisplay: '23:42',
    title: 'SPACE DOCK FAILURE',
    description: 'A colossal docking arm tears away from the orbital shipyard. Cargo containers detach and tumble slowly inward.',
    duration: 32,
    priority: 8,
    areaName: 'COMMERCIAL CARGO DOCKYARD',
    blackHoleEffect: {
      type: 'TIDAL_SHEAR_RUPTURE',
      description: 'Tidal stress reaches critical threshold around major orbital docking structures.',
      intensity: 0.88,
      tidalPull: 0.82,
    },
    environmentEffect: {
      type: 'INWARD_TUMBLING_CONTAINERS',
      description: 'Detached cargo containers begin slowly falling inward toward the accretion disk.',
    },
    civilizationEffect: {
      type: 'DOCKING_ARM_TEAR',
      description: 'Huge docking arm tears away from station; cargo containers detach; docking lights flash emergency signals.',
      spaceDockFailure: true,
      towerWarningLights: true,
    },
  },

  // =========================================================================
  // EVENT 23: 23:24 — ENERGY TOWER COLLAPSE
  // =========================================================================
  {
    id: 'fc_23_energy_tower_collapse',
    eventNumber: 23,
    triggerTime: 396,
    countdownDisplay: '23:24',
    title: 'ENERGY TOWER COLLAPSE',
    description: 'A giant energy spire bends dramatically. Its upper crown snaps off, discharging brilliant plasma arcs into the void.',
    duration: 34,
    priority: 9,
    areaName: 'PRIMARY ENERGY TRANSMISSION SPIRE',
    blackHoleEffect: {
      type: 'LOCAL_GRAVITY_SINGULARITY_DISTORTION',
      description: 'Intense local gravity gradient focal point tearing through high-density energy spire.',
      intensity: 0.90,
      tidalPull: 0.85,
    },
    environmentEffect: {
      type: 'PLASMA_DISCHARGE_ARCS',
      description: 'High-voltage electric arcs flash into space from ruptured superconducting conduits.',
    },
    civilizationEffect: {
      type: 'ENERGY_SPIRE_BREAK_PERSISTENT',
      description: 'Giant energy tower bends dramatically; upper section breaks away; arcs discharge; tower becomes a persistent damaged landmark.',
      energyTowerCollapse: true,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 24: 23:06 — ASTEROID TIDAL STRETCH
  // =========================================================================
  {
    id: 'fc_24_asteroid_tidal_stretch',
    eventNumber: 24,
    triggerTime: 414,
    countdownDisplay: '23:06',
    title: 'ASTEROID TIDAL STRETCH',
    description: 'The captured asteroid reaches the Roche limit. Extreme tidal forces elongate it into a glowing needle as fragments tear away.',
    duration: 32,
    priority: 8,
    areaName: 'GRAVITATIONAL TIDAL LIMIT',
    blackHoleEffect: {
      type: 'ROCHE_LIMIT_TIDAL_DISRUPTION',
      description: 'Applies extreme tidal forces to the captured asteroid, exceeding self-gravitation cohesion.',
      intensity: 0.91,
      tidalPull: 0.88,
    },
    environmentEffect: {
      type: 'ASTEROID_SPAGHETTIFICATION',
      description: 'Asteroid stretches dramatically into needle profile; surface fractures into separating molten fragments.',
    },
    civilizationEffect: {
      type: 'MINING_OBSERVATORY_PANIC',
      description: 'Nearby mining and observation structures react to the breakup with perimeter emergency shields.',
      sensorAlerts: true,
    },
  },

  // =========================================================================
  // EVENT 25: 22:48 — ORBITAL RING BREAK
  // =========================================================================
  {
    id: 'fc_25_orbital_ring_break',
    eventNumber: 25,
    triggerTime: 432,
    countdownDisplay: '22:48',
    title: 'ORBITAL RING BREAK',
    description: 'Catastrophic structural failure strikes the circumferential orbital ring. A 400-meter section separates and falls inward.',
    duration: 35,
    priority: 9,
    areaName: 'CIRCUMFERENTIAL MEGA-RING (SECTOR 4)',
    blackHoleEffect: {
      type: 'RING_TENSION_RUPTURE',
      description: 'Tidal tension snaps the structural continuity of the circumferential orbital ring.',
      intensity: 0.92,
      tidalPull: 0.90,
    },
    environmentEffect: {
      type: 'RING_SEGMENT_FALL',
      description: 'Detached 400m ring section begins entering an inward decaying orbit; remaining ring stays visible.',
    },
    civilizationEffect: {
      type: 'RING_SECTION_DETACH_PERSISTENT',
      description: 'One section of the ring separates; support structures break; detached section enters inward orbit.',
      orbitalRingBreak: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 26: 22:30 — CITY DISTORTION
  // =========================================================================
  {
    id: 'fc_26_city_distortion',
    eventNumber: 26,
    triggerTime: 450,
    countdownDisplay: '22:30',
    title: 'CITY DISTORTION',
    description: 'Gravitational lensing wraps across the entire civilization. The skyline visually bends, curving towers and bridges.',
    duration: 28,
    priority: 7,
    areaName: 'CENTRAL SKYSCRAPER HORIZON',
    blackHoleEffect: {
      type: 'GLOBAL_CIVILIZATION_LENSING',
      description: 'Temporarily increases gravitational lensing across the civilization without physical destruction.',
      intensity: 0.93,
      lensingBoost: 0.92,
    },
    environmentEffect: {
      type: 'METRIC_OPTICAL_SHEAR',
      description: 'Light paths from distant structures curve through the expanding gravitational potential well.',
    },
    civilizationEffect: {
      type: 'SKYLINE_LENSING_CURVATURE',
      description: 'Entire orbital skyline visually bends: towers appear curved, bridges displaced; structures closer to singularity distort more.',
      skylineLensingDistortion: true,
    },
  },

  // =========================================================================
  // EVENT 27: 22:12 — SPACE TOWER DUPLICATION
  // =========================================================================
  {
    id: 'fc_27_space_tower_duplication',
    eventNumber: 27,
    triggerTime: 468,
    countdownDisplay: '22:12',
    title: 'SPACE TOWER DUPLICATION',
    description: 'Strong gravitational mirages manifest. Tall space towers appear as multiple warped ghost reflections through the lensing field.',
    duration: 28,
    priority: 7,
    areaName: 'OPTICAL CAUSTIC REGION',
    blackHoleEffect: {
      type: 'GRAVITATIONAL_GHOST_MIRAGES',
      description: 'Creates strong gravitational ghost images and secondary optical path reflections.',
      intensity: 0.94,
      lensingBoost: 0.95,
    },
    environmentEffect: {
      type: 'MULTIPLE_OPTICAL_CAUSTICS',
      description: 'Secondary and tertiary Einstein rings form optical caustics of structural silhouettes.',
    },
    civilizationEffect: {
      type: 'OPTICAL_TOWER_MULTIPLICATION',
      description: 'Tall towers appear as multiple warped images through lensing field (pure optical ghosting, no geometry duplication).',
      skylineLensingDistortion: true,
    },
  },

  // =========================================================================
  // EVENT 28: 21:54 — STATION SPAGHETTIFICATION
  // =========================================================================
  {
    id: 'fc_28_station_spaghettification',
    eventNumber: 28,
    triggerTime: 486,
    countdownDisplay: '21:54',
    title: 'STATION SPAGHETTIFICATION',
    description: 'A distant orbital station experiences severe longitudinal tidal deformation, stretching into an elongated needle structure.',
    duration: 32,
    priority: 8,
    areaName: 'OUTER INDUSTRIAL REFINERY',
    blackHoleEffect: {
      type: 'TIDAL_SPAGHETTIFICATION_MACRO',
      description: 'Severe differential gravity elongates macrostructures along the radial axis while compressing laterally.',
      intensity: 0.95,
      tidalPull: 0.93,
    },
    environmentEffect: {
      type: 'RADIAL_STRETCHING_FIELD',
      description: 'Matter in the descent corridor elongates into continuous glowing stream ribbons.',
    },
    civilizationEffect: {
      type: 'STATION_ELONGATION_PERSISTENT',
      description: 'Distant station stretches longitudinally: structures elongate, docking arms stretch, lights become long streaks.',
      stationElongation: true,
    },
  },

  // =========================================================================
  // EVENT 29: 21:36 — PLASMA STORM
  // =========================================================================
  {
    id: 'fc_29_plasma_storm',
    eventNumber: 29,
    triggerTime: 504,
    countdownDisplay: '21:36',
    title: 'PLASMA STORM',
    description: 'The accretion disk erupts in relativistic turbulence. Blazing plasma arcs and hot spots cast intense incandescent light on tower hulls.',
    duration: 30,
    priority: 8,
    areaName: 'INNER ACCRETION FLUX BOUNDARY',
    blackHoleEffect: {
      type: 'RELATIVISTIC_PLASMA_TURBULENCE',
      description: 'Accretion disk becomes highly turbulent with plasma arcs, hot spots, and relativistic particle streams.',
      intensity: 0.96,
      accretionTurbulence: 0.95,
    },
    environmentEffect: {
      type: 'PLASMA_ILLUMINATION_CAST',
      description: 'Nearby debris is illuminated by fiery red and golden-yellow synchrotron radiation.',
    },
    civilizationEffect: {
      type: 'TOWER_PLASMA_ILLUMINATION',
      description: 'Tower surfaces receive intermittent red/orange illumination; heat dissipators overload.',
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 30: 21:18 — GRAVITY CORRIDOR
  // =========================================================================
  {
    id: 'fc_30_gravity_corridor',
    eventNumber: 30,
    triggerTime: 522,
    countdownDisplay: '21:18',
    title: 'GRAVITY CORRIDOR',
    description: 'A concentrated gravitational corridor opens between city and singularity. Debris, bridges, and flight paths curve directly into it.',
    duration: 32,
    priority: 9,
    areaName: 'CENTRAL GRAVITATIONAL FUNNEL',
    blackHoleEffect: {
      type: 'CONCENTRATED_GRAVITY_CORRIDOR',
      description: 'Creates a visible region of concentrated gravitational influence between city and singularity.',
      intensity: 0.97,
      tidalPull: 0.95,
    },
    environmentEffect: {
      type: 'CORRIDOR_DEBRIS_ALIGNMENT',
      description: 'Debris follows the corridor directly toward the event horizon.',
      debrisStreamActive: true,
    },
    civilizationEffect: {
      type: 'CORRIDOR_STRUCTURAL_PULL',
      description: 'Structures near the corridor experience stronger deformation; energy bridges and traffic paths visibly curve toward it.',
      bridgeDeformation: 0.95,
      trafficChaos: true,
    },
  },

  // =========================================================================
  // EVENT 31: 21:00 — MEGASTRUCTURE ROTATION
  // =========================================================================
  {
    id: 'fc_31_megastructure_rotation',
    eventNumber: 31,
    triggerTime: 540,
    countdownDisplay: '21:00',
    title: 'MEGASTRUCTURE ROTATION',
    description: 'Tidal torque spins a giant orbital megastructure out of equilibrium. Sections move at different angular velocities with streaking lights.',
    duration: 36,
    priority: 9,
    areaName: 'PRIMARY MEGASTRUCTURE BASTION',
    blackHoleEffect: {
      type: 'DIFFERENTIAL_TIDAL_TORQUE',
      description: 'Increases torque caused by differential tidal forces across kilometers of superstructure.',
      intensity: 0.98,
      tidalPull: 0.96,
    },
    environmentEffect: {
      type: 'MOMENTUM_TRANSFER_SHEAR',
      description: 'Angular momentum transfers through vacuum, destabilizing nearby satellite swarms.',
    },
    civilizationEffect: {
      type: 'MEGASTRUCTURE_UNCONTROLLED_SPIN',
      description: 'Giant orbital megastructure rotates uncontrollably; sections move at different angular velocities; remains persistent after event.',
      megastructureRotation: true,
      structuralFractures: true,
    },
  },

  // =========================================================================
  // EVENT 32: 20:42 — CITY PLATFORM SEPARATION
  // =========================================================================
  {
    id: 'fc_32_city_platform_separation',
    eventNumber: 32,
    triggerTime: 558,
    countdownDisplay: '20:42',
    title: 'CITY PLATFORM SEPARATION',
    description: 'Suspended city platforms detach from their stabilizers. Energy cables snap as detached residential districts drift inward.',
    duration: 36,
    priority: 9,
    areaName: 'SUSPENDED CITY DISTRICT (WEST)',
    blackHoleEffect: {
      type: 'STABILIZER_OVERLOAD_TEAR',
      description: 'Tidal forces on suspended city platforms overwhelm magnetic stabilization nodes.',
      intensity: 0.99,
      tidalPull: 0.98,
    },
    environmentEffect: {
      type: 'DISTRICT_INWARD_DRIFT',
      description: 'Entire urban districts enter slow, irreversible descent vectors into the gravitational basin.',
    },
    civilizationEffect: {
      type: 'PLATFORM_DETACHMENT_PERSISTENT',
      description: 'Several floating platforms detach from stabilizers; slowly separate from civilization; energy connections snap; platforms drift inward.',
      platformSeparation: true,
      powerSurge: true,
    },
  },

  // =========================================================================
  // EVENT 33: 20:24 — TOWER FOUNDATION TEAR
  // =========================================================================
  {
    id: 'fc_33_tower_foundation_tear',
    eventNumber: 33,
    triggerTime: 576,
    countdownDisplay: '20:24',
    title: 'TOWER FOUNDATION TEAR',
    description: 'Catastrophic tidal stress shears the foundation of a major space tower. Massive support beams tear apart as the tower pulls free. Part 1 Complete.',
    duration: 40,
    priority: 10,
    areaName: 'METROPOLIS FOUNDATION CITADEL',
    blackHoleEffect: {
      type: 'PART_1_TERMINAL_TIDAL_CREST',
      description: 'Major local tidal stress peak marking the conclusion of Part 1; structural resistance permanently compromised.',
      intensity: 1.0,
      tidalPull: 1.0,
      lensingBoost: 1.0,
    },
    environmentEffect: {
      type: 'SECTOR_COLLAPSE_INITIATION',
      description: 'Atmospheric containment bubbles pop; structural debris storm envelops the lower horizon.',
    },
    civilizationEffect: {
      type: 'TOWER_FOUNDATION_TEAR_PERSISTENT',
      description: 'Foundation of a major space tower stretches; support beams separate; tower pulls away from foundation; nearby structures react. Marks the end of Part 1.',
      foundationTear: true,
      structuralFractures: true,
      towerWarningLights: true,
      sensorAlerts: true,
    },
  },
];

import { FINAL_COLLAPSE_EVENTS_PART2 } from './finalCollapseEventsPart2';

export { FINAL_COLLAPSE_EVENTS_PART2 };

/**
 * Combined Final Collapse active events through Part 2 (Events 1–66).
 * Events 67–100 are strictly NOT implemented yet.
 */
export const FINAL_COLLAPSE_EVENTS_THROUGH_PART2: readonly FinalCollapseEvent[] = [
  ...FINAL_COLLAPSE_EVENTS_PART1,
  ...FINAL_COLLAPSE_EVENTS_PART2,
];
