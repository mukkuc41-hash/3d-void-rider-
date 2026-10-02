import * as THREE from 'three';
import { ShipConfig, ShipDecalType, ShipUpgrades, ThrusterFlameColor, CockpitSkin } from '../types';

export const SHIPS_CATALOG: ShipConfig[] = [
  {
    id: 'apex_phantom',
    name: 'Apex Phantom',
    description: 'Sleek stealth interceptor built with lightweight aerogel carbon for explosive acceleration.',
    color: '#00f0ff', // Cyber cyan
    topSpeed: 280,
    acceleration: 95,
    handling: 85,
    boostPower: 90,
    boostCapacity: 100,
    creditPrice: 0,
    unlockLevel: 1,
  },
  {
    id: 'vortex_nemesis',
    name: 'Vortex Nemesis',
    description: 'Twin-fuselage hyper-cruiser equipped with dual dark-matter reactor cores for unmatched top speed.',
    color: '#ff6600', // Solar amber
    topSpeed: 320,
    acceleration: 75,
    handling: 70,
    boostPower: 105,
    boostCapacity: 90,
    creditPrice: 2800,
    unlockLevel: 2,
  },
  {
    id: 'solaris_stinger',
    name: 'Solaris Stinger',
    description: 'Needle-nosed agile racer engineered for razor-sharp drift maneuvers through asteroid tunnels.',
    color: '#00ff66', // Emerald ion
    topSpeed: 270,
    acceleration: 90,
    handling: 100,
    boostPower: 80,
    boostCapacity: 110,
    creditPrice: 4200,
    unlockLevel: 3,
  },
  {
    id: 'void_valkyrie',
    name: 'Void Valkyrie',
    description: 'Dimensional delta fighter utilizing grav-field resonance for balanced championship control.',
    color: '#d000ff', // Void magenta
    topSpeed: 295,
    acceleration: 85,
    handling: 88,
    boostPower: 92,
    boostCapacity: 100,
    creditPrice: 6500,
    unlockLevel: 4,
  },
  {
    id: 'titan_dreadnought',
    name: 'Titan Dreadnought',
    description: 'Heavily armored juggernaut with fortified kinetic bulwarks, supreme collision tolerance, and immense boost reserves.',
    color: '#ff2244', // Crimson kinetic
    topSpeed: 275,
    acceleration: 72,
    handling: 70,
    boostPower: 112,
    boostCapacity: 130,
    creditPrice: 8000,
    unlockLevel: 5,
  },
];

export const THRUSTER_FLAME_CONFIGS: { id: ThrusterFlameColor; name: string; hex: string; desc: string }[] = [
  { id: 'neon_cyan', name: 'Neon Cyan', hex: '#00f0ff', desc: 'High-frequency ion ionization beam with maximum thrust velocity.' },
  { id: 'plasma_violet', name: 'Plasma Violet', hex: '#d000ff', desc: 'Dark matter resonance glow with hyper-spectral plume.' },
  { id: 'solar_gold', name: 'Solar Gold', hex: '#ffaa00', desc: 'High-yield stellar plasma flare radiating solar power.' },
  { id: 'emerald_hyper', name: 'Emerald Hyper', hex: '#00ff66', desc: 'Overcharged tachyon conduit emission with emerald trail.' },
];

export const COCKPIT_SKIN_CONFIGS: { id: CockpitSkin; name: string; frameColor: string; hudAccent: string; color: string; desc: string }[] = [
  { id: 'cyber_stealth', name: 'Cyber Stealth', frameColor: '#1e293b', hudAccent: '#00f0ff', color: '#00f0ff', desc: 'Anodized aerogel carbon canopy frame with ice-blue instrumentation.' },
  { id: 'titanium_gold', name: 'Titanium Gold', frameColor: '#785614', hudAccent: '#ffcc00', color: '#ffcc00', desc: 'Gilded titanium canopy ribbing with warm solar telemetry.' },
  { id: 'neon_matrix', name: 'Neon Matrix', frameColor: '#0a3d24', hudAccent: '#00ff66', color: '#00ff66', desc: 'Matrix bio-synthetic frame etched with emerald glow conduits.' },
  { id: 'void_shadow', name: 'Void Shadow', frameColor: '#39144d', hudAccent: '#ff00e5', color: '#ff00e5', desc: 'Deep-void composite hull with pulsing ultraviolet glass.' },
];

export { type ShipConfig } from '../types';

export const SHIP_REGISTRY = SHIPS_CATALOG;

export const COLOR_PALETTE = [
  { name: 'Neon Cyan', hex: '#00f0ff' },
  { name: 'Solar Amber', hex: '#ff6600' },
  { name: 'Void Violet', hex: '#d000ff' },
  { name: 'Emerald Ion', hex: '#00ff66' },
  { name: 'Crimson Kinetic', hex: '#ff2244' },
  { name: 'Tachyon Gold', hex: '#ffd700' },
  { name: 'Ghost White', hex: '#e2e8f0' },
  { name: 'Stealth Shadow', hex: '#1e293b' },
];

export interface DecalConfig {
  id: ShipDecalType;
  name: string;
  description: string;
  cost: number;
}

export const DECALS_CATALOG: DecalConfig[] = [
  { id: 'none', name: 'Stealth Carbon', description: 'Factory aero-carbon hull with zero outer markings.', cost: 0 },
  { id: 'racing_stripes', name: 'Twin Velocity Stripes', description: 'Dual high-contrast neon stripes through fuselage center.', cost: 400 },
  { id: 'hazard_chevrons', name: 'Hyper Chevrons', description: 'Kinetic hazard directional arrows for high-speed aerodynamics.', cost: 650 },
  { id: 'vortex_wings', name: 'Vortex Wings', description: 'Curved plasma wing flare motifs radiating neon power.', cost: 850 },
  { id: 'apex_predator', name: 'Apex Predator', description: 'Aggressive lightning fangs insignia reserved for circuit masters.', cost: 1100 },
  { id: 'carbon_hex', name: 'Carbon Nano-Hex', description: 'Holographic hexagonal lattice pattern with refractive underglow.', cost: 1400 },
];

export const DECAL_CONFIGS = DECALS_CATALOG;

export interface ComponentUpgradeConfig {
  id: keyof ShipUpgrades;
  type: keyof ShipUpgrades;
  name: string;
  description: string;
  statName: string;
  costs: number[];
  baseCost: number;
  maxLevel: number;
  perks: string[];
}

export const UPGRADE_COMPONENTS: ComponentUpgradeConfig[] = [
  {
    id: 'engine',
    type: 'engine',
    name: 'Ion Pulse Core',
    description: 'Upgrades antimatter ignition flow to increase top velocity on straights.',
    statName: 'Top Speed',
    costs: [450, 850, 1350, 1950],
    baseCost: 450,
    maxLevel: 4,
    perks: ['+10 KM/H', '+20 KM/H', '+30 KM/H', '+40 KM/H'],
  },
  {
    id: 'handling',
    type: 'handling',
    name: 'Grav-Inverter Thrusters',
    description: 'Stabilizes magnetic lateral thrusters for tighter drift radius and response.',
    statName: 'Handling & Drift',
    costs: [400, 800, 1250, 1800],
    baseCost: 400,
    maxLevel: 4,
    perks: ['+8% Handling', '+16% Handling', '+24% Handling', '+32% Handling'],
  },
  {
    id: 'boost',
    type: 'boost',
    name: 'Antimatter Nitro Injector',
    description: 'Overclocks plasma capacitor banks for stronger boost acceleration and capacity.',
    statName: 'Nitro Boost Power',
    costs: [500, 950, 1450, 2050],
    baseCost: 500,
    maxLevel: 4,
    perks: ['+8% Boost', '+16% Boost', '+24% Boost', '+32% Boost'],
  },
  {
    id: 'chassis',
    type: 'chassis',
    name: 'Aero-Carbon Chassis',
    description: 'Reduces mass and aerodynamic drag for blistering off-the-line launch acceleration.',
    statName: 'Acceleration',
    costs: [350, 750, 1200, 1700],
    baseCost: 350,
    maxLevel: 4,
    perks: ['+8% Accel', '+16% Accel', '+24% Accel', '+32% Accel'],
  },
  {
    id: 'shieldDuration',
    type: 'shieldDuration',
    name: 'Phase Shield Matrix',
    description: 'Extends Phase Shield invulnerability duration when activated from power-up pods.',
    statName: 'Shield Duration',
    costs: [400, 800, 1300, 1900],
    baseCost: 400,
    maxLevel: 4,
    perks: ['+2.0s Duration', '+4.0s Duration', '+6.0s Duration', '+8.0s Duration'],
  },
  {
    id: 'magnetRange',
    type: 'magnetRange',
    name: 'Credit Magnet Array',
    description: 'Expands the electromagnetic pull radius to draw distant floating space credits.',
    statName: 'Magnet Field Radius',
    costs: [380, 780, 1250, 1850],
    baseCost: 380,
    maxLevel: 4,
    perks: ['+12m Radius', '+24m Radius', '+36m Radius', '+48m Radius'],
  },
  {
    id: 'hyperBoostSpeed',
    type: 'hyperBoostSpeed',
    name: 'Hyper-Boost Surge Overclock',
    description: 'Supercharges the instant velocity surge and auto-alignment glide speed of Hyper-Boost pods.',
    statName: 'Hyper Surge Speed',
    costs: [480, 920, 1400, 2100],
    baseCost: 480,
    maxLevel: 4,
    perks: ['+20 KM/H Warp', '+40 KM/H Warp', '+60 KM/H Warp', '+80 KM/H Warp'],
  },
];

export const UPGRADE_CATALOG = UPGRADE_COMPONENTS;

export function getEffectiveShipStats(base: ShipConfig, upgrades?: ShipUpgrades): ShipConfig {
  const up = upgrades || {
    engine: 0,
    handling: 0,
    boost: 0,
    chassis: 0,
    shieldDuration: 0,
    magnetRange: 0,
    hyperBoostSpeed: 0,
  };

  return {
    ...base,
    topSpeed: base.topSpeed + (up.engine || 0) * 10,
    handling: Math.min(130, base.handling + (up.handling || 0) * 8),
    boostPower: Math.min(145, base.boostPower + (up.boost || 0) * 8),
    boostCapacity: Math.min(145, base.boostCapacity + (up.boost || 0) * 8),
    acceleration: Math.min(135, base.acceleration + (up.chassis || 0) * 8),
  };
}

export function getShipConfig(shipId: string): ShipConfig {
  return SHIPS_CATALOG.find(s => s.id === shipId) || SHIPS_CATALOG[0];
}

/**
 * Procedurally creates a high-res decal canvas texture for the 3D ship
 */
export function createDecalTexture(
  decalType: ShipDecalType,
  primaryColor: string,
  secondaryColor: string
): THREE.CanvasTexture | null {
  if (!decalType || decalType === 'none') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 512);

  if (decalType === 'racing_stripes') {
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(216, 0, 24, 512);
    ctx.fillRect(272, 0, 24, 512);

    ctx.fillStyle = primaryColor;
    ctx.fillRect(206, 0, 8, 512);
    ctx.fillRect(298, 0, 8, 512);
  } else if (decalType === 'hazard_chevrons') {
    ctx.fillStyle = secondaryColor;
    for (let y = -40; y < 600; y += 75) {
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.lineTo(380, y + 45);
      ctx.lineTo(350, y + 70);
      ctx.lineTo(256, y + 30);
      ctx.lineTo(162, y + 70);
      ctx.lineTo(132, y + 45);
      ctx.closePath();
      ctx.fill();
    }
  } else if (decalType === 'vortex_wings') {
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(256, 100);
    ctx.bezierCurveTo(390, 180, 480, 310, 505, 490);
    ctx.moveTo(256, 100);
    ctx.bezierCurveTo(122, 180, 32, 310, 7, 490);
    ctx.stroke();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(256, 190);
    ctx.bezierCurveTo(350, 250, 420, 350, 445, 470);
    ctx.moveTo(256, 190);
    ctx.bezierCurveTo(162, 250, 92, 350, 67, 470);
    ctx.stroke();
  } else if (decalType === 'apex_predator') {
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.moveTo(256, 40);
    ctx.lineTo(315, 230);
    ctx.lineTo(270, 230);
    ctx.lineTo(330, 460);
    ctx.lineTo(256, 310);
    ctx.lineTo(182, 460);
    ctx.lineTo(242, 230);
    ctx.lineTo(197, 230);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 6;
    ctx.stroke();
  } else if (decalType === 'carbon_hex') {
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3;
    const hexRadius = 26;
    const dx = hexRadius * 1.5;
    const dy = Math.sqrt(3) * hexRadius;

    for (let x = -20; x < 540; x += dx) {
      for (let y = -20; y < 540; y += dy) {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a;
          const px = x + hexRadius * Math.cos(angle);
          const py = y + hexRadius * Math.sin(angle);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Procedural 3D Spaceship Mesh Generator using Three.js
 */
export function createShipMesh(
  shipId: string,
  customColorHex?: string,
  secondaryColorHex?: string,
  decalType: ShipDecalType = 'none',
  thrusterColorHex?: string,
  cockpitSkin?: CockpitSkin
): THREE.Group {
  const config = getShipConfig(shipId);
  const primaryColor = new THREE.Color(customColorHex || config.color);
  const secondaryColor = new THREE.Color(secondaryColorHex || '#ff00e5');
  const darkHullColor = new THREE.Color('#0d111a');

  // Cockpit frame accent based on chosen skin
  const skinConfig = COCKPIT_SKIN_CONFIGS.find(s => s.id === cockpitSkin);
  const cockpitFrameColor = new THREE.Color(skinConfig ? skinConfig.frameColor : '#1e293b');
  const cockpitEmissive = new THREE.Color(skinConfig ? skinConfig.hudAccent : primaryColor.getHexString());

  // Thruster flame color
  const thrusterColor = new THREE.Color(thrusterColorHex || primaryColor.getHexString());

  const shipGroup = new THREE.Group();
  shipGroup.name = `ship_${shipId}`;

  // Materials
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: darkHullColor,
    roughness: 0.3,
    metalness: 0.85,
  });

  const neonMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: primaryColor,
    emissiveIntensity: 1.7,
    roughness: 0.2,
    metalness: 0.5,
  });

  const secondaryNeonMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    emissive: secondaryColor,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.5,
  });

  const cockpitMaterial = new THREE.MeshPhysicalMaterial({
    color: cockpitFrameColor,
    transmission: 0.65,
    opacity: 0.9,
    transparent: true,
    roughness: 0.1,
    metalness: 0.3,
    emissive: cockpitEmissive,
    emissiveIntensity: 0.35,
  });

  const thrusterGlowMaterial = new THREE.MeshBasicMaterial({
    color: thrusterColor,
  });

  if (shipId === 'apex_phantom') {
    // Sharp stealth needle fuselage
    const bodyGeo = new THREE.ConeGeometry(1.2, 5.2, 5);
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.scale(1, 0.45, 1);
    const body = new THREE.Mesh(bodyGeo, hullMaterial);
    shipGroup.add(body);

    // Forward swept wings
    const wingGeo = new THREE.BoxGeometry(4.8, 0.12, 2.2);
    const wings = new THREE.Mesh(wingGeo, hullMaterial);
    wings.position.set(0, 0, 0.3);
    shipGroup.add(wings);

    // Neon wingtips
    const tipGeo = new THREE.BoxGeometry(0.2, 0.8, 2.0);
    const leftTip = new THREE.Mesh(tipGeo, neonMaterial);
    leftTip.position.set(-2.4, 0.3, 0.3);
    const rightTip = new THREE.Mesh(tipGeo, neonMaterial);
    rightTip.position.set(2.4, 0.3, 0.3);
    shipGroup.add(leftTip, rightTip);

    // Cockpit
    const canopyGeo = new THREE.SphereGeometry(0.5, 16, 16);
    canopyGeo.scale(0.8, 0.6, 2.0);
    const canopy = new THREE.Mesh(canopyGeo, cockpitMaterial);
    canopy.position.set(0, 0.4, -0.6);
    shipGroup.add(canopy);

    // Twin Thrusters
    [-0.6, 0.6].forEach(x => {
      const nozzleGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.9, 12);
      nozzleGeo.rotateX(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, hullMaterial);
      nozzle.position.set(x, 0, 2.2);

      const flareGeo = new THREE.ConeGeometry(0.3, 1.8, 12);
      flareGeo.rotateX(-Math.PI / 2);
      const flare = new THREE.Mesh(flareGeo, thrusterGlowMaterial);
      flare.position.set(0, 0, 0.9);
      flare.name = 'thruster_flame';
      nozzle.add(flare);

      shipGroup.add(nozzle);
    });
  } else if (shipId === 'vortex_nemesis') {
    // Twin heavy hull catamaran
    [-1.2, 1.2].forEach(x => {
      const pontoonGeo = new THREE.BoxGeometry(0.9, 0.8, 5.0);
      const pontoon = new THREE.Mesh(pontoonGeo, hullMaterial);
      pontoon.position.set(x, 0, 0);

      // Front intake
      const intakeGeo = new THREE.BoxGeometry(0.92, 0.82, 0.4);
      const intake = new THREE.Mesh(intakeGeo, neonMaterial);
      intake.position.set(0, 0, -2.4);
      pontoon.add(intake);

      // Rear massive thruster
      const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.0, 16);
      nozzleGeo.rotateX(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, hullMaterial);
      nozzle.position.set(0, 0, 2.6);

      const flare = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 16).rotateX(-Math.PI / 2), thrusterGlowMaterial);
      flare.position.set(0, 0, 1.1);
      flare.name = 'thruster_flame';
      nozzle.add(flare);

      pontoon.add(nozzle);
      shipGroup.add(pontoon);
    });

    // Central cross-bridge & cockpit
    const bridgeGeo = new THREE.BoxGeometry(2.0, 0.35, 2.8);
    const bridge = new THREE.Mesh(bridgeGeo, hullMaterial);
    bridge.position.set(0, 0.2, 0);

    const bridgeNeon = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 0.4), neonMaterial);
    bridgeNeon.position.set(0, 0.38, -0.4);
    bridge.add(bridgeNeon);

    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.6, 8).rotateX(Math.PI / 2), cockpitMaterial);
    canopy.position.set(0, 0.45, -0.3);
    bridge.add(canopy);

    shipGroup.add(bridge);
  } else if (shipId === 'solaris_stinger') {
    // Needle fuselage
    const spindleGeo = new THREE.CylinderGeometry(0.2, 0.9, 6.0, 12).rotateX(Math.PI / 2);
    const spindle = new THREE.Mesh(spindleGeo, hullMaterial);
    spindle.position.set(0, 0, 0);
    shipGroup.add(spindle);

    // Swept triangular dagger wings
    const wingGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Left wing
      0, 0, -1.0,
      -3.0, 0, 1.5,
      0, 0, 2.0,

      // Right wing
      0, 0, -1.0,
      0, 0, 2.0,
      3.0, 0, 1.5,
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingGeo.computeVertexNormals();
    const wings = new THREE.Mesh(wingGeo, hullMaterial);
    shipGroup.add(wings);

    // Glowing edge strips
    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.4).rotateY(-Math.PI / 4), neonMaterial);
    leftStrip.position.set(-1.5, 0.05, 0.25);
    const rightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.4).rotateY(Math.PI / 4), neonMaterial);
    rightStrip.position.set(1.5, 0.05, 0.25);
    shipGroup.add(leftStrip, rightStrip);

    // Canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 12).rotateX(Math.PI / 2), cockpitMaterial);
    canopy.position.set(0, 0.35, -1.0);
    shipGroup.add(canopy);

    // Central triple thrusters
    const centralNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12).rotateX(Math.PI / 2), hullMaterial);
    centralNozzle.position.set(0, 0, 2.8);
    const flare = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.0, 12).rotateX(-Math.PI / 2), thrusterGlowMaterial);
    flare.position.set(0, 0, 1.0);
    flare.name = 'thruster_flame';
    centralNozzle.add(flare);
    shipGroup.add(centralNozzle);
  } else if (shipId === 'void_valkyrie') {
    // Void Valkyrie - Delta Cruiser with floating ring
    const deltaGeo = new THREE.ConeGeometry(2.4, 4.8, 4).rotateX(Math.PI / 2);
    deltaGeo.scale(1, 0.3, 1);
    const delta = new THREE.Mesh(deltaGeo, hullMaterial);
    shipGroup.add(delta);

    // Anti-gravity levitation ring around rear
    const ringGeo = new THREE.TorusGeometry(1.6, 0.12, 16, 32);
    const ring = new THREE.Mesh(ringGeo, neonMaterial);
    ring.position.set(0, 0, 1.2);
    ring.name = 'antigrav_ring';
    shipGroup.add(ring);

    // Glowing wing fin inverters
    [-1.8, 1.8].forEach(x => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 1.8), neonMaterial);
      fin.position.set(x, 0.5, 0.8);
      fin.rotateZ(x > 0 ? -0.3 : 0.3);
      shipGroup.add(fin);
    });

    // Sleek cockpit
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12).scale(0.9, 0.5, 2.2), cockpitMaterial);
    canopy.position.set(0, 0.35, -0.6);
    shipGroup.add(canopy);

    // Thruster
    [-0.7, 0.7].forEach(x => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.7, 12).rotateX(Math.PI / 2), hullMaterial);
      nozzle.position.set(x, 0, 2.1);
      const flare = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.9, 12).rotateX(-Math.PI / 2), thrusterGlowMaterial);
      flare.position.set(0, 0, 0.9);
      flare.name = 'thruster_flame';
      nozzle.add(flare);
      shipGroup.add(nozzle);
    });
  } else {
    // Titan Dreadnought (or default fallback) - Heavy armored juggernaut
    const heavyHull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 4.6), hullMaterial);
    heavyHull.position.set(0, 0.1, 0.2);
    shipGroup.add(heavyHull);

    // Armored reinforced prow ram
    const ramGeo = new THREE.ConeGeometry(1.6, 2.0, 4).rotateX(Math.PI / 2);
    ramGeo.scale(1.2, 0.5, 1);
    const prowRam = new THREE.Mesh(ramGeo, hullMaterial);
    prowRam.position.set(0, 0.1, -2.5);
    shipGroup.add(prowRam);

    // Heavy Kinetic side armor plates
    [-1.6, 1.6].forEach(x => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 3.8), hullMaterial);
      plate.position.set(x, 0.2, 0.4);
      shipGroup.add(plate);

      // Kinetic neon conduits
      const neonStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 3.4), neonMaterial);
      neonStripe.position.set(x + (x > 0 ? 0.22 : -0.22), 0.2, 0.4);
      shipGroup.add(neonStripe);
    });

    // Reinforced command bridge cockpit
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.6), cockpitMaterial);
    bridge.position.set(0, 0.7, -0.2);
    shipGroup.add(bridge);

    // Quad heavy fusion thrusters
    [-0.9, -0.3, 0.3, 0.9].forEach(x => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.9, 12).rotateX(Math.PI / 2), hullMaterial);
      nozzle.position.set(x, 0.1, 2.6);
      const flare = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 12).rotateX(-Math.PI / 2), thrusterGlowMaterial);
      flare.position.set(0, 0, 0.85);
      flare.name = 'thruster_flame';
      nozzle.add(flare);
      shipGroup.add(nozzle);
    });
  }

  // Neon Underglow Ground Field (Secondary Accent Color)
  const underglowGeo = new THREE.PlaneGeometry(3.6, 5.2).rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.y = -0.42;
  underglow.name = 'ship_underglow';
  shipGroup.add(underglow);

  // Decal livery layers
  if (decalType && decalType !== 'none') {
    const decalTex = createDecalTexture(
      decalType,
      customColorHex || config.color,
      secondaryColorHex || '#ff00e5'
    );
    if (decalTex) {
      const decalMat = new THREE.MeshStandardMaterial({
        map: decalTex,
        transparent: true,
        roughness: 0.25,
        metalness: 0.7,
        emissive: secondaryColor,
        emissiveIntensity: 0.65,
        emissiveMap: decalTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });

      // Fuselage central decal plate
      const dorsalDecalGeo = new THREE.PlaneGeometry(2.4, 4.2).rotateX(-Math.PI / 2);
      const dorsalDecal = new THREE.Mesh(dorsalDecalGeo, decalMat);
      dorsalDecal.position.set(0, 0.46, 0.1);
      dorsalDecal.name = 'ship_decal_dorsal';
      shipGroup.add(dorsalDecal);

      // Wing decal accents
      const wingDecalGeo = new THREE.PlaneGeometry(4.4, 1.8).rotateX(-Math.PI / 2);
      const wingDecal = new THREE.Mesh(wingDecalGeo, decalMat);
      wingDecal.position.set(0, 0.14, 0.5);
      wingDecal.name = 'ship_decal_wings';
      shipGroup.add(wingDecal);
    }
  }

  // Add subtle shadow plane beneath ship
  const shadowGeo = new THREE.PlaneGeometry(3.5, 5.0).rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = -0.5;
  shipGroup.add(shadow);

  // Front-Mounted Weapon Emitter System
  const emitterGroup = new THREE.Group();
  emitterGroup.name = 'weapon_emitter';
  
  // Position emitter at ship prow based on ship geometry
  let emitterZ = -2.8;
  let emitterY = 0.05;
  if (shipId === 'apex_phantom') {
    emitterZ = -3.2;
    emitterY = 0.08;
  } else if (shipId === 'vortex_nemesis') {
    emitterZ = -2.9;
    emitterY = 0.05;
  } else if (shipId === 'solaris_stinger') {
    emitterZ = -3.4;
    emitterY = 0.05;
  } else if (shipId === 'void_valkyrie') {
    emitterZ = -2.7;
    emitterY = 0.08;
  } else if (shipId === 'titan_dreadnought') {
    emitterZ = -3.1;
    emitterY = 0.02;
  }
  emitterGroup.position.set(0, emitterY, emitterZ);

  // Emitter Housing Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.75, 10).rotateX(Math.PI / 2);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x182438,
    metalness: 0.9,
    roughness: 0.2,
  });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  emitterGroup.add(barrel);

  // Emitter Cowl Fins
  const cowlGeo = new THREE.BoxGeometry(0.48, 0.08, 0.5);
  const cowl = new THREE.Mesh(cowlGeo, hullMaterial);
  cowl.position.set(0, 0, 0.1);
  emitterGroup.add(cowl);

  // High-Energy Focal Lens / Aperture
  const apertureGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12).rotateX(Math.PI / 2);
  const apertureMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });
  const aperture = new THREE.Mesh(apertureGeo, apertureMat);
  aperture.name = 'emitter_aperture';
  aperture.position.set(0, 0, -0.4);
  emitterGroup.add(aperture);

  // Aperture Glow Ring
  const apertureRingGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
  const apertureRingMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
  });
  const apertureRing = new THREE.Mesh(apertureRingGeo, apertureRingMat);
  apertureRing.position.set(0, 0, -0.4);
  apertureRing.name = 'emitter_glow_ring';
  emitterGroup.add(apertureRing);

  shipGroup.add(emitterGroup);

  return shipGroup;
}
