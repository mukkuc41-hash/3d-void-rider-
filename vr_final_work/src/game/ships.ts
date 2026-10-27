import * as THREE from 'three';
import { ShipConfig, ShipDecalType, ShipUpgrades, ThrusterFlameColor, CockpitSkin } from '../types';
import { CENTRAL_SHIP_CATALOG, getShipDefinition, ShipDefinition } from './shipCatalog';
import { createProceduralShipMesh, ShipMeshCustomization } from './shipMeshGenerator';

export { CENTRAL_SHIP_CATALOG, getShipDefinition, type ShipDefinition } from './shipCatalog';
export { createProceduralShipMesh, type ShipMeshCustomization } from './shipMeshGenerator';

export const SHIPS_CATALOG: ShipConfig[] = CENTRAL_SHIP_CATALOG as unknown as ShipConfig[];
export const SHIP_REGISTRY = SHIPS_CATALOG;

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
  return getShipDefinition(shipId) as unknown as ShipConfig;
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
 * Universal 3D Spaceship Mesh Generator using Three.js
 * Powered by procedural modular system supporting 1,000 ships + custom ships
 */
export function createShipMesh(
  shipId: string,
  customColorHex?: string,
  secondaryColorHex?: string,
  decalType: ShipDecalType = 'none',
  thrusterColorHex?: string,
  cockpitSkin?: CockpitSkin
): THREE.Group {
  return createProceduralShipMesh(shipId, {
    primaryColorHex: customColorHex,
    secondaryColorHex,
    decalType,
    thrusterFlameColor: thrusterColorHex,
    cockpitSkin,
  });
}
