/**
 * VOID-RIDER 3D — CENTRAL SPACECRAFT CATALOG
 * Exactly 1,000 deterministic spacecraft (VR-0001 to VR-1000)
 * 20 Classes (50 ships each)
 * 6 Rarities (450 Common, 250 Uncommon, 150 Rare, 90 Epic, 50 Legendary, 10 Mythic)
 */

export type ShipClass =
  | 'Light Racer'
  | 'Heavy Racer'
  | 'Interceptor'
  | 'Fighter'
  | 'Strike Craft'
  | 'Assault Craft'
  | 'Explorer'
  | 'Scout'
  | 'Freighter'
  | 'Hauler'
  | 'Stealth Craft'
  | 'Drone Ship'
  | 'Plasma Craft'
  | 'Quantum Craft'
  | 'Void Craft'
  | 'Wormhole Craft'
  | 'Orbital Craft'
  | 'Solar Craft'
  | 'Gravity Craft'
  | 'Championship Craft';

export type ShipRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface ShipBaseStats {
  maxSpeed: number;        // km/h (260 - 450)
  acceleration: number;    // 60 - 140
  handling: number;        // 60 - 130
  armor: number;           // 50 - 160
  shield: number;          // 50 - 160
  boost: number;           // 60 - 150
  boostEfficiency: number; // 50 - 100
  drift: number;           // 50 - 120
  energy: number;          // 70 - 200
  energyRecharge: number;  // 50 - 140
  beamPower: number;       // 60 - 180
  beamRange: number;       // 60 - 170
  beamCooling: number;     // 50 - 140
  stability: number;       // 50 - 130
}

export interface ShipDefinition {
  id: string;              // 'VR-0001' ... 'VR-1000'
  legacyId?: string;       // e.g. 'apex_phantom'
  name: string;
  class: ShipClass;
  rarity: ShipRarity;
  description: string;
  seed: number;
  visualVariant: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  engineColor: string;
  energyColor: string;
  beamColor: string;
  emissiveIntensity: number;
  baseStats: ShipBaseStats;
  unlockRequirement: string;
  unlockLevel: number;
  purchaseCost: number;
  unlockedByDefault: boolean;
  // Compatibility fields with legacy ShipConfig
  color: string;
  topSpeed: number;
  acceleration: number;
  handling: number;
  boostPower: number;
  boostCapacity: number;
  creditPrice: number;
}

export const SHIP_CLASSES: ShipClass[] = [
  'Light Racer',
  'Heavy Racer',
  'Interceptor',
  'Fighter',
  'Strike Craft',
  'Assault Craft',
  'Explorer',
  'Scout',
  'Freighter',
  'Hauler',
  'Stealth Craft',
  'Drone Ship',
  'Plasma Craft',
  'Quantum Craft',
  'Void Craft',
  'Wormhole Craft',
  'Orbital Craft',
  'Solar Craft',
  'Gravity Craft',
  'Championship Craft',
];

export const RARITY_CONFIG: Record<
  ShipRarity,
  { label: string; color: string; bg: string; border: string; glow: string; badge: string; targetCount: number }
> = {
  COMMON: {
    label: 'COMMON',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: '#475569',
    glow: 'rgba(148, 163, 184, 0.3)',
    badge: 'bg-slate-800/80 text-slate-300 border-slate-600',
    targetCount: 450,
  },
  UNCOMMON: {
    label: 'UNCOMMON',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60',
    targetCount: 250,
  },
  RARE: {
    label: 'RARE',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.14)',
    border: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.45)',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60',
    targetCount: 150,
  },
  EPIC: {
    label: 'EPIC',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.16)',
    border: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.55)',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-500/60',
    targetCount: 90,
  },
  LEGENDARY: {
    label: 'LEGENDARY',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    border: '#d97706',
    glow: 'rgba(245, 158, 11, 0.65)',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/70',
    targetCount: 50,
  },
  MYTHIC: {
    label: 'MYTHIC',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.22)',
    border: '#db2777',
    glow: 'rgba(236, 72, 153, 0.85)',
    badge: 'bg-pink-950/90 text-pink-200 border-pink-500 animate-pulse',
    targetCount: 10,
  },
};

// Seeded pseudorandom generator (Mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Names catalog components
const CLASS_PREFIXES: Record<ShipClass, string[]> = {
  'Light Racer': ['Vector', 'Aero', 'Slipstream', 'Pulse', 'Zephyr', 'Apex', 'Mach', 'Flash', 'Swift'],
  'Heavy Racer': ['Titan', 'Vortex', 'Juggernaut', 'Goliath', 'Torque', 'Mammoth', 'Rhino', 'Colossus'],
  'Interceptor': ['Phantom', 'Spectre', 'Interceptor', 'Dart', 'Talon', 'Ghost', 'Stalker', 'Raptor'],
  'Fighter': ['Vanguard', 'Corsair', 'Saber', 'Gladius', 'Valkyrie', 'Striker', 'Crusader', 'Avenger'],
  'Strike Craft': ['Blitz', 'Lance', 'Stinger', 'Hornet', 'Scorpion', 'Viper', 'Thunder', 'Storm'],
  'Assault Craft': ['Dreadnought', 'Warhammer', 'Bulwark', 'Breaker', 'Siege', 'Battering', 'Ironclad'],
  'Explorer': ['Voyager', 'Pioneer', 'Horizon', 'Pathfinder', 'Compass', 'Odyssey', 'Cartographer', 'Nomad'],
  'Scout': ['Recon', 'Surveyor', 'Echo', 'Raven', 'Seeker', 'Tracker', 'Probe', 'Vigil'],
  'Freighter': ['Atlas', 'Hauler', 'Payload', 'Cargo', 'Transporter', 'Bulkhead', 'Barge', 'Carrier'],
  'Hauler': ['Mastodon', 'Brute', 'Tug', 'Ox', 'Ironhide', 'Freightmaster', 'Anchor', 'Heavyload'],
  'Stealth Craft': ['Shadow', 'Eclipse', 'Mirage', 'Wraith', 'Nightfall', 'Obsidian', 'Shroud', 'Phantom'],
  'Drone Ship': ['Swarm', 'Nexus', 'Hive', 'Core', 'Matrix', 'Automaton', 'Synapse', 'Cortex'],
  'Plasma Craft': ['Solaris', 'Corona', 'Sunburst', 'Flare', 'Inferno', 'Ignition', 'Thermal', 'Pyro'],
  'Quantum Craft': ['Quantum', 'Chronos', 'Tachyon', 'Singularity', 'Paradox', 'Continuum', 'Entangle', 'Wave'],
  'Void Craft': ['Void', 'Abyss', 'Null', 'Entropy', 'Darkstar', 'Nebula', 'Cosmos', 'Rift'],
  'Wormhole Craft': ['Warp', 'Fold', 'Gateway', 'Transit', 'Bifrost', 'Tunnel', 'Nexus', 'Relay'],
  'Orbital Craft': ['Apogee', 'Zenith', 'Perihelion', 'Station', 'Perigee', 'Aurora', 'Celestial', 'Satellite'],
  'Solar Craft': ['Helios', 'Ra', 'Photonic', 'Sol', 'Daybreak', 'Radiance', 'Solstice', 'Prominence'],
  'Gravity Craft': ['Graviton', 'Tidal', 'Mass', 'Density', 'Pulsar', 'Attractor', 'Well', 'Vector'],
  'Championship Craft': ['Grand Prix', 'Apex Prime', 'Crown', 'Sovereign', 'Champion', 'Victory', 'Victor', 'Imperator'],
};

const CODENAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
  'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
  'Phi', 'Chi', 'Psi', 'Omega', 'Prime', 'Zero', 'Eclipse', 'Nova', 'Hyper', 'Ultra',
  'Pro', 'Max', 'Strike', 'Rush', 'Storm', 'Blade', 'Shard', 'Flare', 'Fury', 'Apex',
  'Mirage', 'Spectre', 'Ghost', 'Zenith', 'Chronos', 'Titan', 'Viper', 'Nemesis', 'Stinger', 'Valkyrie'
];

const COLOR_SCHEMES = [
  { primary: '#00f0ff', secondary: '#d000ff', accent: '#00ff66', engine: '#00f0ff', energy: '#00f0ff', beam: '#00f0ff' }, // Cyber Cyan
  { primary: '#ff6600', secondary: '#ffd700', accent: '#ff0033', engine: '#ff6600', energy: '#ffaa00', beam: '#ff6600' }, // Solar Amber
  { primary: '#00ff66', secondary: '#00f0ff', accent: '#a855f7', engine: '#00ff66', energy: '#00ff66', beam: '#00ff66' }, // Emerald Ion
  { primary: '#d000ff', secondary: '#ff0077', accent: '#00f0ff', engine: '#d000ff', energy: '#d000ff', beam: '#d000ff' }, // Void Violet
  { primary: '#ff2244', secondary: '#ff6600', accent: '#ffd700', engine: '#ff2244', energy: '#ff2244', beam: '#ff2244' }, // Crimson Kinetic
  { primary: '#ffd700', secondary: '#ff6600', accent: '#00f0ff', engine: '#ffd700', energy: '#ffd700', beam: '#ffd700' }, // Tachyon Gold
  { primary: '#ffffff', secondary: '#00f0ff', accent: '#d000ff', engine: '#00f0ff', energy: '#ffffff', beam: '#ffffff' }, // Ghost White
  { primary: '#1e293b', secondary: '#00f0ff', accent: '#ff0055', engine: '#00f0ff', energy: '#00f0ff', beam: '#00f0ff' }, // Stealth Carbon
  { primary: '#0ea5e9', secondary: '#6366f1', accent: '#38bdf8', engine: '#0ea5e9', energy: '#0ea5e9', beam: '#0ea5e9' }, // Deep Blue
  { primary: '#f43f5e', secondary: '#8b5cf6', accent: '#fbbf24', engine: '#f43f5e', energy: '#f43f5e', beam: '#f43f5e' }, // Neon Rose
];

// Explicit designated 10 Mythic Ship IDs
export const MYTHIC_SHIP_IDS = new Set<string>([
  'VR-0100', // Heavy Racer Peak
  'VR-0250', // Strike Craft Peak
  'VR-0500', // Hauler Peak
  'VR-0650', // Quantum Craft Peak
  'VR-0700', // Void Craft Peak
  'VR-0777', // SINGULARITY
  'VR-0850', // Solar Craft Peak
  'VR-0888', // QUANTUM KING
  'VR-0999', // EVENT HORIZON
  'VR-1000', // ABSOLUTE ZERO
]);

/**
 * Deterministically constructs exactly 1,000 spacecraft definitions.
 * Follows exact class allocations (50 per class) and rarity targets.
 */
function buildCentralCatalog(): ShipDefinition[] {
  const ships: ShipDefinition[] = [];

  // Rarity tracker to ensure exact counts: 450 Common, 250 Uncommon, 150 Rare, 90 Epic, 50 Legendary, 10 Mythic
  // Per class of 50 ships, target roughly: 22-23 Common, 12-13 Uncommon, 7-8 Rare, 4-5 Epic, 2-3 Legendary
  // We place Mythics at designated IDs, and assign remaining according to exact quotas.

  let remainingCommon = 450;
  let remainingUncommon = 250;
  let remainingRare = 150;
  let remainingEpic = 90;
  let remainingLegendary = 50;
  let remainingMythic = 10;

  for (let index = 1; index <= 1000; index++) {
    const id = `VR-${String(index).padStart(4, '0')}`;
    const rng = mulberry32(index * 9973 + 1337);

    // Determine Class: exactly 50 ships per class
    const classIdx = Math.min(19, Math.floor((index - 1) / 50));
    const shipClass = SHIP_CLASSES[classIdx];
    const indexInClass = (index - 1) % 50; // 0 to 49

    // Determine Rarity
    let rarity: ShipRarity = 'COMMON';

    if (MYTHIC_SHIP_IDS.has(id)) {
      rarity = 'MYTHIC';
      remainingMythic--;
    } else {
      // Deterministic tier assignment within the class
      // In each 50 ships:
      // index 0..22 (23 ships) = Common
      // index 23..34 (12 ships) = Uncommon
      // index 35..42 (8 ships) = Rare
      // index 43..47 (5 ships) = Epic
      // index 48..49 (2 ships) = Legendary
      // With fine adjustments to meet exact global totals (450, 250, 150, 90, 50)
      if (indexInClass < 22 && remainingCommon > 0) {
        rarity = 'COMMON';
        remainingCommon--;
      } else if (indexInClass < 35 && remainingUncommon > 0) {
        rarity = 'UNCOMMON';
        remainingUncommon--;
      } else if (indexInClass < 43 && remainingRare > 0) {
        rarity = 'RARE';
        remainingRare--;
      } else if (indexInClass < 47 && remainingEpic > 0) {
        rarity = 'EPIC';
        remainingEpic--;
      } else if (remainingLegendary > 0) {
        rarity = 'LEGENDARY';
        remainingLegendary--;
      } else if (remainingEpic > 0) {
        rarity = 'EPIC';
        remainingEpic--;
      } else if (remainingRare > 0) {
        rarity = 'RARE';
        remainingRare--;
      } else if (remainingUncommon > 0) {
        rarity = 'UNCOMMON';
        remainingUncommon--;
      } else {
        rarity = 'COMMON';
        remainingCommon--;
      }
    }

    // Palette & Visual Scheme
    const colorScheme = COLOR_SCHEMES[Math.floor(rng() * COLOR_SCHEMES.length)];
    const visualVariant = Math.floor(rng() * 12); // 12 distinct silhouettes

    // Name generation
    const prefixes = CLASS_PREFIXES[shipClass];
    const prefix = prefixes[Math.floor(rng() * prefixes.length)];
    const codename = CODENAMES[Math.floor(rng() * CODENAMES.length)];
    let name = `${prefix} ${codename}`;

    // Overwrite for special iconic ships
    let description = '';
    let legacyId: string | undefined = undefined;
    let unlockedByDefault = false;

    if (id === 'VR-0001') {
      name = 'Apex Phantom';
      legacyId = 'apex_phantom';
      description = 'Sleek stealth interceptor built with lightweight aerogel carbon for explosive acceleration and agile vector control.';
      unlockedByDefault = true;
    } else if (id === 'VR-0002') {
      name = 'Vortex Nemesis';
      legacyId = 'vortex_nemesis';
      description = 'Twin-fuselage hyper-cruiser equipped with dual dark-matter reactor cores for unmatched straight-line top speed.';
      unlockedByDefault = true;
    } else if (id === 'VR-0003') {
      name = 'Solaris Stinger';
      legacyId = 'solaris_stinger';
      description = 'Needle-nosed agile racer engineered for razor-sharp drift maneuvers through dense asteroid tunnels and high-G turns.';
      unlockedByDefault = true;
    } else if (id === 'VR-0004') {
      name = 'Void Valkyrie';
      legacyId = 'void_valkyrie';
      description = 'Dimensional delta fighter utilizing grav-field resonance and annular containment for balanced championship superiority.';
      unlockedByDefault = false;
    } else if (id === 'VR-0005') {
      name = 'Titan Dreadnought';
      legacyId = 'titan_dreadnought';
      description = 'Heavily armored juggernaut with fortified kinetic bulwarks, supreme collision tolerance, and massive boost reserves.';
      unlockedByDefault = false;
    } else if (id === 'VR-0777') {
      name = 'SINGULARITY';
      description = 'Experimental apex mythic prototype harnessing a contained black hole core. Emits dark graviton wakes that warp space-time around the circuit.';
    } else if (id === 'VR-0888') {
      name = 'QUANTUM KING';
      description = 'Crowned sovereign vessel of the hyper-dimensional fleet. Prismatic tachyon matrices grant instantaneous energy recharge and transcendent handling.';
    } else if (id === 'VR-0999') {
      name = 'EVENT HORIZON';
      description = 'Monolithic obsidian hyper-craft carved from collapsed stellar matter. Its twin horizon accretion intakes consume cosmic radiation for infinite propulsion.';
    } else if (id === 'VR-1000') {
      name = 'ABSOLUTE ZERO';
      description = 'The ultimate endgame mythic masterpiece. Powered by zero-point cryogenic vacuum energy; freezes friction in its wake with devastating speed.';
    } else {
      description = `${shipClass} vessel engineered with aerospace composite alloy, calibrated for high-velocity circuit operations.`;
    }

    // Base Stats calculation based on Class and Rarity
    // Baseline numbers
    let speed = 270 + rng() * 35;
    let accel = 75 + rng() * 25;
    let handl = 75 + rng() * 25;
    let armor = 70 + rng() * 30;
    let shield = 70 + rng() * 30;
    let boost = 80 + rng() * 25;
    let boostEff = 65 + rng() * 25;
    let drift = 70 + rng() * 25;
    let energy = 100 + rng() * 30;
    let energyRecharge = 70 + rng() * 25;
    let beamPower = 80 + rng() * 30;
    let beamRange = 80 + rng() * 30;
    let beamCooling = 70 + rng() * 25;
    let stability = 70 + rng() * 25;

    // Apply Class Specialty adjustments
    switch (shipClass) {
      case 'Light Racer':
        speed += 10; accel += 18; handl += 18; drift += 16; armor -= 15; shield -= 10;
        break;
      case 'Heavy Racer':
        speed += 25; accel -= 10; handl -= 8; armor += 18; boost += 15; stability += 18;
        break;
      case 'Interceptor':
        speed += 20; accel += 20; handl += 12; boost += 14; armor -= 8;
        break;
      case 'Fighter':
        beamPower += 22; beamRange += 15; armor += 10; handl += 8;
        break;
      case 'Strike Craft':
        accel += 16; beamPower += 25; boost += 12; shield -= 10;
        break;
      case 'Assault Craft':
        armor += 25; shield += 20; beamPower += 18; stability += 20; speed -= 12;
        break;
      case 'Explorer':
        beamRange += 28; energy += 25; shield += 15; stability += 14;
        break;
      case 'Scout':
        handl += 24; accel += 14; energyRecharge += 20; armor -= 20;
        break;
      case 'Freighter':
        armor += 35; shield += 30; energy += 40; speed -= 22; accel -= 18;
        break;
      case 'Hauler':
        armor += 40; stability += 30; shield += 25; speed -= 25; drift -= 15;
        break;
      case 'Stealth Craft':
        speed += 15; drift += 22; handl += 14; energyRecharge += 12; armor -= 12;
        break;
      case 'Drone Ship':
        energyRecharge += 26; beamCooling += 24; handl += 12; stability -= 8;
        break;
      case 'Plasma Craft':
        beamPower += 32; energy += 20; beamCooling += 15; speed += 8;
        break;
      case 'Quantum Craft':
        energyRecharge += 30; stability += 18; boostEff += 22; handl += 10;
        break;
      case 'Void Craft':
        boost += 28; drift += 20; energy += 24; beamPower += 14;
        break;
      case 'Wormhole Craft':
        speed += 24; beamRange += 22; stability += 16; boost += 10;
        break;
      case 'Orbital Craft':
        speed += 18; boost += 20; beamCooling += 18; stability += 14;
        break;
      case 'Solar Craft':
        energy += 35; energyRecharge += 32; beamPower += 20; beamCooling += 12;
        break;
      case 'Gravity Craft':
        stability += 32; armor += 28; shield += 24; drift -= 12;
        break;
      case 'Championship Craft':
        speed += 22; accel += 18; handl += 18; boost += 20; armor += 14; shield += 14;
        break;
    }

    // Apply Rarity Multiplier
    let rarityMult = 1.0;
    let basePrice = 1200;
    let unlockLevel = 1;

    switch (rarity) {
      case 'COMMON':
        rarityMult = 1.0;
        basePrice = Math.floor(1000 + rng() * 1500);
        unlockLevel = 1;
        break;
      case 'UNCOMMON':
        rarityMult = 1.1;
        basePrice = Math.floor(2800 + rng() * 2200);
        unlockLevel = 2 + Math.floor(rng() * 2);
        break;
      case 'RARE':
        rarityMult = 1.22;
        basePrice = Math.floor(5500 + rng() * 3500);
        unlockLevel = 4 + Math.floor(rng() * 3);
        break;
      case 'EPIC':
        rarityMult = 1.35;
        basePrice = Math.floor(9500 + rng() * 5500);
        unlockLevel = 7 + Math.floor(rng() * 4);
        break;
      case 'LEGENDARY':
        rarityMult = 1.5;
        basePrice = Math.floor(16000 + rng() * 10000);
        unlockLevel = 12 + Math.floor(rng() * 4);
        break;
      case 'MYTHIC':
        rarityMult = 1.7;
        basePrice = Math.floor(32000 + rng() * 28000);
        unlockLevel = 16 + Math.floor(rng() * 4);
        break;
    }

    // Free default ships
    if (unlockedByDefault) {
      basePrice = 0;
      unlockLevel = 1;
    }

    // Extreme special ship stats & cost
    if (id === 'VR-0777') {
      name = 'SINGULARITY';
      rarity = 'MYTHIC';
      rarityMult = 1.85;
      basePrice = 45000;
      unlockLevel = 18;
      speed += 45; boost += 40; energy += 45;
    } else if (id === 'VR-0888') {
      name = 'QUANTUM KING';
      rarity = 'MYTHIC';
      rarityMult = 1.88;
      basePrice = 50000;
      unlockLevel = 19;
      handl += 35; energyRecharge += 45; beamPower += 40;
    } else if (id === 'VR-0999') {
      name = 'EVENT HORIZON';
      rarity = 'MYTHIC';
      rarityMult = 1.92;
      basePrice = 58000;
      unlockLevel = 20;
      speed += 55; armor += 35; beamRange += 45;
    } else if (id === 'VR-1000') {
      name = 'ABSOLUTE ZERO';
      rarity = 'MYTHIC';
      rarityMult = 2.0;
      basePrice = 75000;
      unlockLevel = 20;
      speed += 70; accel += 45; handl += 40; armor += 40; shield += 40; boost += 50;
    }

    const finalSpeed = Math.round(speed * rarityMult);
    const finalAccel = Math.min(145, Math.round(accel * rarityMult));
    const finalHandl = Math.min(135, Math.round(handl * rarityMult));
    const finalArmor = Math.min(160, Math.round(armor * rarityMult));
    const finalShield = Math.min(160, Math.round(shield * rarityMult));
    const finalBoost = Math.min(150, Math.round(boost * rarityMult));
    const finalBoostEff = Math.min(100, Math.round(boostEff * Math.sqrt(rarityMult)));
    const finalDrift = Math.min(125, Math.round(drift * Math.sqrt(rarityMult)));
    const finalEnergy = Math.min(220, Math.round(energy * rarityMult));
    const finalRecharge = Math.min(150, Math.round(energyRecharge * rarityMult));
    const finalBeamPower = Math.min(190, Math.round(beamPower * rarityMult));
    const finalBeamRange = Math.min(180, Math.round(beamRange * rarityMult));
    const finalBeamCooling = Math.min(150, Math.round(beamCooling * rarityMult));
    const finalStability = Math.min(140, Math.round(stability * rarityMult));

    const unlockReq =
      unlockedByDefault
        ? 'Unlocked by Default'
        : unlockLevel > 1
        ? `Pilot Level ${unlockLevel} Required`
        : 'Available in Garage';

    const def: ShipDefinition = {
      id,
      legacyId,
      name,
      class: shipClass,
      rarity,
      description,
      seed: index,
      visualVariant,
      primaryColor: colorScheme.primary,
      secondaryColor: colorScheme.secondary,
      accentColor: colorScheme.accent,
      engineColor: colorScheme.engine,
      energyColor: colorScheme.energy,
      beamColor: colorScheme.beam,
      emissiveIntensity: rarity === 'MYTHIC' ? 2.6 : rarity === 'LEGENDARY' ? 2.2 : 1.7,
      baseStats: {
        maxSpeed: finalSpeed,
        acceleration: finalAccel,
        handling: finalHandl,
        armor: finalArmor,
        shield: finalShield,
        boost: finalBoost,
        boostEfficiency: finalBoostEff,
        drift: finalDrift,
        energy: finalEnergy,
        energyRecharge: finalRecharge,
        beamPower: finalBeamPower,
        beamRange: finalBeamRange,
        beamCooling: finalBeamCooling,
        stability: finalStability,
      },
      unlockRequirement: unlockReq,
      unlockLevel,
      purchaseCost: basePrice,
      unlockedByDefault,
      // Legacy compatibility
      color: colorScheme.primary,
      topSpeed: finalSpeed,
      acceleration: finalAccel,
      handling: finalHandl,
      boostPower: finalBoost,
      boostCapacity: finalBoost,
      creditPrice: basePrice,
    };

    ships.push(def);
  }

  return ships;
}

// Generate the 1,000 ships once and cache
export const CENTRAL_SHIP_CATALOG: ShipDefinition[] = buildCentralCatalog();

// Quick lookup maps
const SHIP_MAP_BY_ID = new Map<string, ShipDefinition>();
const SHIP_MAP_BY_LEGACY = new Map<string, ShipDefinition>();

CENTRAL_SHIP_CATALOG.forEach(ship => {
  SHIP_MAP_BY_ID.set(ship.id, ship);
  if (ship.legacyId) {
    SHIP_MAP_BY_LEGACY.set(ship.legacyId, ship);
  }
});

/**
 * Fast lookup for any ship ID or legacy alias
 */
export function getShipDefinition(idOrAlias: string): ShipDefinition {
  if (!idOrAlias) return CENTRAL_SHIP_CATALOG[0];

  // Try direct ID
  const direct = SHIP_MAP_BY_ID.get(idOrAlias);
  if (direct) return direct;

  // Try legacy ID
  const legacy = SHIP_MAP_BY_LEGACY.get(idOrAlias);
  if (legacy) return legacy;

  // Normalized search
  const normalized = idOrAlias.trim().toUpperCase();
  const foundUpper = SHIP_MAP_BY_ID.get(normalized);
  if (foundUpper) return foundUpper;

  // Fallback to VR-0001
  return CENTRAL_SHIP_CATALOG[0];
}

/**
 * Compatibility alias for getShipConfig
 */
export function getShipConfigFromCatalog(idOrAlias: string): ShipDefinition {
  return getShipDefinition(idOrAlias);
}
