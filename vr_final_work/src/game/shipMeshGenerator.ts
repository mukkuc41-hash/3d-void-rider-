/**
 * VOID-RIDER 3D — PROCEDURAL MODULAR SPACECRAFT 3D GENERATOR
 * Generates deterministic 3D spacecraft based on ship ID & seed.
 * Supports 12 distinct hull types, 6 cockpits, 8 wing arrays, modular engines,
 * armor plates, reactors, weapon emitters, decals, and custom Special Ships (VR-0777, VR-0888, VR-0999, VR-1000).
 */

import * as THREE from 'three';
import { getShipDefinition, ShipDefinition } from './shipCatalog';
import { createDecalTexture } from './ships';
import { ShipDecalType, CockpitSkin, ThrusterFlameColor } from '../types';

// Seeded pseudorandom generator
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ShipMeshCustomization {
  primaryColorHex?: string;
  secondaryColorHex?: string;
  accentColorHex?: string;
  engineColorHex?: string;
  energyColorHex?: string;
  beamColorHex?: string;
  emissiveIntensity?: number;
  decalType?: ShipDecalType;
  thrusterFlameColor?: ThrusterFlameColor | string;
  cockpitSkin?: CockpitSkin | string;
  engineType?: string;
  exhaustStyle?: string;
  glowIntensity?: number;
}

/**
 * Creates or retrieves the 3D procedural Three.js Group for any ship ID.
 */
export function createProceduralShipMesh(
  shipId: string,
  customization?: ShipMeshCustomization
): THREE.Group {
  const def = getShipDefinition(shipId);
  const seed = def.seed || 1;
  const rng = mulberry32(seed * 7919 + 42);

  const primaryHex = customization?.primaryColorHex || def.primaryColor;
  const secondaryHex = customization?.secondaryColorHex || def.secondaryColor;
  const accentHex = customization?.accentColorHex || def.accentColor;
  const engineHex = customization?.engineColorHex || customization?.thrusterFlameColor || def.engineColor;
  const energyHex = customization?.energyColorHex || def.energyColor;
  const beamHex = customization?.beamColorHex || def.beamColor;
  const emissiveFactor = customization?.emissiveIntensity ?? def.emissiveIntensity;
  const glowMult = customization?.glowIntensity ?? 1.0;

  const primaryCol = new THREE.Color(primaryHex);
  const secondaryCol = new THREE.Color(secondaryHex);
  const accentCol = new THREE.Color(accentHex);
  const engineCol = new THREE.Color(engineHex);
  const energyCol = new THREE.Color(energyHex);
  const beamCol = new THREE.Color(beamHex);
  const darkHullCol = new THREE.Color('#0a0e17');

  const shipGroup = new THREE.Group();
  shipGroup.name = `ship_${shipId}`;

  // Materials
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: darkHullCol,
    roughness: def.rarity === 'MYTHIC' ? 0.15 : 0.35,
    metalness: def.rarity === 'MYTHIC' ? 0.95 : 0.8,
  });

  const neonPrimaryMaterial = new THREE.MeshStandardMaterial({
    color: primaryCol,
    emissive: primaryCol,
    emissiveIntensity: emissiveFactor * glowMult,
    roughness: 0.2,
    metalness: 0.6,
  });

  const neonSecondaryMaterial = new THREE.MeshStandardMaterial({
    color: secondaryCol,
    emissive: secondaryCol,
    emissiveIntensity: emissiveFactor * 1.1 * glowMult,
    roughness: 0.2,
    metalness: 0.5,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accentCol,
    emissive: accentCol,
    emissiveIntensity: emissiveFactor * 1.2 * glowMult,
    roughness: 0.2,
    metalness: 0.7,
  });

  const cockpitMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1e293b'),
    transmission: 0.75,
    opacity: 0.92,
    transparent: true,
    roughness: 0.08,
    metalness: 0.25,
    emissive: energyCol,
    emissiveIntensity: 0.35 * glowMult,
  });

  const thrusterGlowMaterial = new THREE.MeshBasicMaterial({
    color: engineCol,
  });

  // Check for Special Legendary / Mythic vessels with hand-crafted bespoke silhouettes
  if (shipId === 'VR-0777') {
    // SINGULARITY — Dark Matter Singularity Vessel
    buildSingularityMesh(shipGroup, hullMaterial, neonPrimaryMaterial, neonSecondaryMaterial, cockpitMaterial, thrusterGlowMaterial, primaryCol, secondaryCol, engineCol);
  } else if (shipId === 'VR-0888') {
    // QUANTUM KING — Imperial Prismatic Crown Hyper-Craft
    buildQuantumKingMesh(shipGroup, hullMaterial, neonPrimaryMaterial, neonSecondaryMaterial, cockpitMaterial, thrusterGlowMaterial, primaryCol, secondaryCol, engineCol);
  } else if (shipId === 'VR-0999') {
    // EVENT HORIZON — Obsidian Relativistic Monolith
    buildEventHorizonMesh(shipGroup, hullMaterial, neonPrimaryMaterial, neonSecondaryMaterial, cockpitMaterial, thrusterGlowMaterial, primaryCol, secondaryCol, engineCol);
  } else if (shipId === 'VR-1000') {
    // ABSOLUTE ZERO — Extreme Cryo-Crystalline Zero-Point Apex
    buildAbsoluteZeroMesh(shipGroup, hullMaterial, neonPrimaryMaterial, neonSecondaryMaterial, cockpitMaterial, thrusterGlowMaterial, primaryCol, secondaryCol, engineCol);
  } else {
    // Modular procedural assembly: 12 distinct hull types
    const hullType = (def.visualVariant + Math.floor(rng() * 3)) % 12;
    buildModularProceduralShip(
      shipGroup,
      hullType,
      rng,
      def,
      hullMaterial,
      neonPrimaryMaterial,
      neonSecondaryMaterial,
      accentMaterial,
      cockpitMaterial,
      thrusterGlowMaterial,
      primaryCol,
      secondaryCol,
      engineCol
    );
  }

  // Neon Underglow Field
  const underglowGeo = new THREE.PlaneGeometry(3.6, 5.2).rotateX(-Math.PI / 2);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: secondaryCol,
    transparent: true,
    opacity: 0.45 * glowMult,
    side: THREE.DoubleSide,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.position.y = -0.42;
  underglow.name = 'ship_underglow';
  shipGroup.add(underglow);

  // Decals
  const decal = customization?.decalType || 'none';
  if (decal !== 'none') {
    const decalTex = createDecalTexture(decal, primaryHex, secondaryHex);
    if (decalTex) {
      const decalMat = new THREE.MeshStandardMaterial({
        map: decalTex,
        transparent: true,
        roughness: 0.25,
        metalness: 0.7,
        emissive: secondaryCol,
        emissiveIntensity: 0.65,
        emissiveMap: decalTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });

      const dorsalDecal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2).rotateX(-Math.PI / 2), decalMat);
      dorsalDecal.position.set(0, 0.46, 0.1);
      dorsalDecal.name = 'ship_decal_dorsal';
      shipGroup.add(dorsalDecal);
    }
  }

  // Front-Mounted Weapon / Beam Emitter
  const emitterGroup = new THREE.Group();
  emitterGroup.name = 'weapon_emitter';
  emitterGroup.position.set(0, 0.05, -2.8);

  const barrelGeo = new THREE.CylinderGeometry(0.12, 0.2, 0.7, 10).rotateX(Math.PI / 2);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x182438, metalness: 0.9, roughness: 0.2 });
  emitterGroup.add(new THREE.Mesh(barrelGeo, barrelMat));

  const apertureGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12).rotateX(Math.PI / 2);
  const apertureMat = new THREE.MeshBasicMaterial({ color: beamCol });
  const aperture = new THREE.Mesh(apertureGeo, apertureMat);
  aperture.position.set(0, 0, -0.38);
  emitterGroup.add(aperture);

  const apertureRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 8, 16),
    new THREE.MeshBasicMaterial({ color: beamCol, transparent: true, opacity: 0.85 })
  );
  apertureRing.position.set(0, 0, -0.38);
  emitterGroup.add(apertureRing);

  shipGroup.add(emitterGroup);

  return shipGroup;
}

/**
 * Procedural Modular Builder for 996 standard ships
 */
function buildModularProceduralShip(
  group: THREE.Group,
  hullType: number,
  rng: () => number,
  def: ShipDefinition,
  hullMat: THREE.Material,
  neonMat: THREE.Material,
  secNeonMat: THREE.Material,
  accentMat: THREE.Material,
  cockpitMat: THREE.Material,
  thrusterMat: THREE.Material,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color,
  engineColor: THREE.Color
) {
  // 1. Core Fuselage based on hullType
  switch (hullType) {
    case 0: { // STEALTH NEEDLE
      const bodyGeo = new THREE.ConeGeometry(1.2, 5.4, 5).rotateX(Math.PI / 2);
      bodyGeo.scale(1, 0.42, 1);
      group.add(new THREE.Mesh(bodyGeo, hullMat));

      const wingGeo = new THREE.BoxGeometry(4.6, 0.12, 2.2);
      const wings = new THREE.Mesh(wingGeo, hullMat);
      wings.position.set(0, 0, 0.3);
      group.add(wings);

      [-2.3, 2.3].forEach(x => {
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 2.0), neonMat);
        tip.position.set(x, 0.25, 0.3);
        group.add(tip);
      });
      break;
    }
    case 1: { // TWIN CATAMARAN
      [-1.1, 1.1].forEach(x => {
        const pontoon = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 5.0), hullMat);
        pontoon.position.set(x, 0, 0);

        const intake = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.78, 0.35), neonMat);
        intake.position.set(0, 0, -2.4);
        pontoon.add(intake);
        group.add(pontoon);
      });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 2.8), hullMat);
      bridge.position.set(0, 0.15, 0);
      group.add(bridge);
      break;
    }
    case 2: { // DAGGER DELTA
      const deltaGeo = new THREE.ConeGeometry(2.4, 5.0, 4).rotateX(Math.PI / 2);
      deltaGeo.scale(1, 0.3, 1);
      group.add(new THREE.Mesh(deltaGeo, hullMat));

      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 4.4), neonMat);
      spine.position.set(0, 0.3, 0.2);
      group.add(spine);
      break;
    }
    case 3: { // LEV CRUISER WITH ANTI-GRAV RING
      const body = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.8, 4).rotateX(Math.PI / 2).scale(1, 0.4, 1), hullMat);
      group.add(body);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 16, 32), neonMat);
      ring.position.set(0, 0, 1.1);
      ring.name = 'antigrav_ring';
      group.add(ring);

      [-1.8, 1.8].forEach(x => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 1.8), secNeonMat);
        fin.position.set(x, 0.4, 0.8);
        fin.rotateZ(x > 0 ? -0.28 : 0.28);
        group.add(fin);
      });
      break;
    }
    case 4: { // HEAVY JUGGERNAUT / BULWARK
      const heavyHull = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 4.6), hullMat);
      heavyHull.position.set(0, 0.1, 0.2);
      group.add(heavyHull);

      const ram = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.0, 4).rotateX(Math.PI / 2).scale(1.2, 0.5, 1), hullMat);
      ram.position.set(0, 0.1, -2.4);
      group.add(ram);

      [-1.5, 1.5].forEach(x => {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 3.6), hullMat);
        plate.position.set(x, 0.2, 0.3);
        group.add(plate);

        const neonStripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 3.2), neonMat);
        neonStripe.position.set(x + (x > 0 ? 0.22 : -0.22), 0.2, 0.3);
        group.add(neonStripe);
      });
      break;
    }
    case 5: { // FORWARD SWEPT INTERCEPTOR
      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 5.2, 10).rotateX(Math.PI / 2), hullMat);
      group.add(fuselage);

      // Inverted forward-swept wings
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4).rotateY(0.45), hullMat);
      wingL.position.set(-1.6, 0, -0.6);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4).rotateY(-0.45), hullMat);
      wingR.position.set(1.6, 0, -0.6);
      group.add(wingL, wingR);

      [-2.4, 2.4].forEach(x => {
        const canard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 1.2), neonMat);
        canard.position.set(x, 0.3, -0.9);
        group.add(canard);
      });
      break;
    }
    case 6: { // HAMMERHEAD ASSAULT
      const spine = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 4.4), hullMat);
      spine.position.set(0, 0, 0.4);
      group.add(spine);

      const hammerhead = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.2), hullMat);
      hammerhead.position.set(0, 0, -1.8);
      group.add(hammerhead);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 0.1), neonMat);
      visor.position.set(0, 0.1, -2.4);
      group.add(visor);
      break;
    }
    case 7: { // DIAMOND STEALTH
      const diamondGeo = new THREE.OctahedronGeometry(2.2, 0);
      diamondGeo.scale(1.2, 0.35, 2.2);
      group.add(new THREE.Mesh(diamondGeo, hullMat));

      const edgeStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.2).rotateY(0.3), neonMat);
      edgeStripeL.position.set(-1.2, 0.05, 0);
      const edgeStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.2).rotateY(-0.3), neonMat);
      edgeStripeR.position.set(1.2, 0.05, 0);
      group.add(edgeStripeL, edgeStripeR);
      break;
    }
    case 8: { // TRIDENT RUNNER
      const centerHull = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 5.0, 8).rotateX(Math.PI / 2), hullMat);
      group.add(centerHull);

      [-1.3, 1.3].forEach(x => {
        const outrigger = new THREE.Mesh(new THREE.ConeGeometry(0.4, 4.2, 6).rotateX(Math.PI / 2), hullMat);
        outrigger.position.set(x, 0, -0.2);
        group.add(outrigger);

        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 1.2), secNeonMat);
        pylon.position.set(x * 0.55, 0, 0.4);
        group.add(pylon);
      });
      break;
    }
    case 9: { // SOLAR SAIL RACER
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 6.0, 10).rotateX(Math.PI / 2), hullMat);
      group.add(spine);

      const sailL = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.8).rotateX(-Math.PI / 2).rotateZ(-0.2), neonMat);
      sailL.position.set(-1.6, 0.1, 0.2);
      const sailR = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.8).rotateX(-Math.PI / 2).rotateZ(0.2), neonMat);
      sailR.position.set(1.6, 0.1, 0.2);
      group.add(sailL, sailR);
      break;
    }
    case 10: { // QUANTUM PRISM
      const prismGeo = new THREE.CylinderGeometry(0.5, 1.8, 4.6, 3).rotateX(Math.PI / 2);
      prismGeo.scale(1.2, 0.5, 1);
      group.add(new THREE.Mesh(prismGeo, hullMat));

      const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), secNeonMat);
      coreOrb.position.set(0, 0.4, 0.2);
      group.add(coreOrb);
      break;
    }
    default: { // VOID CONDUIT
      const leftProw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 4.8), hullMat);
      leftProw.position.set(-0.9, 0, 0);
      const rightProw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 4.8), hullMat);
      rightProw.position.set(0.9, 0, 0);
      group.add(leftProw, rightProw);

      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.6, 16).rotateX(Math.PI / 2), neonMat);
      conduit.position.set(0, 0, 0.4);
      group.add(conduit);
      break;
    }
  }

  // 2. Cockpit Canopy
  const cockpitType = Math.floor(rng() * 4);
  let canopy: THREE.Mesh;
  if (cockpitType === 0) {
    canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16).scale(0.8, 0.6, 2.0), cockpitMat);
    canopy.position.set(0, 0.4, -0.6);
  } else if (cockpitType === 1) {
    canopy = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 8).rotateX(Math.PI / 2), cockpitMat);
    canopy.position.set(0, 0.38, -0.9);
  } else if (cockpitType === 2) {
    canopy = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 1.8), cockpitMat);
    canopy.position.set(0, 0.45, -0.4);
  } else {
    canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.8, 8).rotateX(Math.PI / 2), cockpitMat);
    canopy.position.set(0, 0.42, -0.5);
  }
  group.add(canopy);

  // 3. Modular Thruster configuration (1, 2, 3, or 4 engines)
  const engineCountChoice = Math.floor(rng() * 4);
  const thrusterOffsets: number[] =
    engineCountChoice === 0
      ? [0] // Single mega thruster
      : engineCountChoice === 1
      ? [-0.7, 0.7] // Dual thrusters
      : engineCountChoice === 2
      ? [-0.9, 0, 0.9] // Triple thrusters
      : [-1.0, -0.35, 0.35, 1.0]; // Quad cluster

  thrusterOffsets.forEach(x => {
    const nozzleRadius = engineCountChoice === 0 ? 0.45 : engineCountChoice === 1 ? 0.32 : 0.26;
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(nozzleRadius, nozzleRadius * 1.25, 0.85, 12).rotateX(Math.PI / 2),
      hullMat
    );
    nozzle.position.set(x, 0.05, 2.3);

    const flare = new THREE.Mesh(
      new THREE.ConeGeometry(nozzleRadius * 1.1, 1.9, 12).rotateX(-Math.PI / 2),
      thrusterMat
    );
    flare.position.set(0, 0, 0.9);
    flare.name = 'thruster_flame';
    nozzle.add(flare);

    group.add(nozzle);
  });
}

/**
 * VR-0777 — SINGULARITY
 * Contained black hole core, rotating event horizon ring, deep violet & black crystalline hull
 */
function buildSingularityMesh(
  group: THREE.Group,
  hullMat: THREE.Material,
  neonMat: THREE.Material,
  secNeonMat: THREE.Material,
  cockpitMat: THREE.Material,
  thrusterMat: THREE.Material,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color,
  engineColor: THREE.Color
) {
  // Split dark hull with center gravitational void
  [-1.25, 1.25].forEach(x => {
    const clawGeo = new THREE.ConeGeometry(0.7, 5.6, 5).rotateX(Math.PI / 2);
    clawGeo.scale(1.2, 0.45, 1);
    const claw = new THREE.Mesh(clawGeo, hullMat);
    claw.position.set(x, 0, 0);
    claw.rotateZ(x > 0 ? -0.15 : 0.15);
    group.add(claw);

    const coronaStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 4.4), neonMat);
    coronaStripe.position.set(x * 0.9, 0.22, 0.2);
    group.add(coronaStripe);
  });

  // Central Event Horizon Singularity Orb (pitch black core)
  const singularityCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  singularityCore.position.set(0, 0, 0.3);
  singularityCore.name = 'singularity_core';
  group.add(singularityCore);

  // Rotating Violet Accretion Disk Ring
  const accretionRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.16, 16, 48),
    new THREE.MeshStandardMaterial({
      color: 0xd000ff,
      emissive: 0xd000ff,
      emissiveIntensity: 3.2,
      roughness: 0.1,
    })
  );
  accretionRing.rotation.x = Math.PI * 0.35;
  accretionRing.position.set(0, 0, 0.3);
  accretionRing.name = 'accretion_disk';
  group.add(accretionRing);

  // Cockpit
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16).scale(0.8, 0.45, 2.2), cockpitMat);
  canopy.position.set(0, 0.48, -1.2);
  group.add(canopy);

  // Twin Dark-Graviton Thrusters
  [-0.8, 0.8].forEach(x => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.0, 16).rotateX(Math.PI / 2), hullMat);
    nozzle.position.set(x, 0, 2.4);

    const flare = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 16).rotateX(-Math.PI / 2), thrusterMat);
    flare.position.set(0, 0, 1.1);
    flare.name = 'thruster_flame';
    nozzle.add(flare);
    group.add(nozzle);
  });
}

/**
 * VR-0888 — QUANTUM KING
 * Imperial golden polyhedral hull, royal tachyon conduits, crown stabilizers
 */
function buildQuantumKingMesh(
  group: THREE.Group,
  hullMat: THREE.Material,
  neonMat: THREE.Material,
  secNeonMat: THREE.Material,
  cockpitMat: THREE.Material,
  thrusterMat: THREE.Material,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color,
  engineColor: THREE.Color
) {
  // Gold plated materials
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Polyhedral central royal hull
  const mainHull = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0).scale(1.1, 0.4, 2.2), goldMaterial);
  mainHull.position.set(0, 0.1, 0);
  group.add(mainHull);

  // Triple crown fins
  [-1.4, 0, 1.4].forEach((x, i) => {
    const crownHeight = i === 1 ? 1.6 : 1.2;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3, crownHeight, 4), neonMat);
    fin.position.set(x, crownHeight * 0.4, 1.2);
    fin.rotateZ(x > 0 ? -0.2 : x < 0 ? 0.2 : 0);
    group.add(fin);
  });

  // Swept royal gull wings
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.0).rotateZ(0.18), goldMaterial);
  wingL.position.set(-2.0, 0.35, 0.2);
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.0).rotateZ(-0.18), goldMaterial);
  wingR.position.set(2.0, 0.35, 0.2);
  group.add(wingL, wingR);

  // Prismatic Tachyon Canopy
  const canopy = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 1).scale(0.8, 0.6, 2.0), cockpitMat);
  canopy.position.set(0, 0.55, -0.6);
  group.add(canopy);

  // Quad Gold Thrusters
  [-1.1, -0.4, 0.4, 1.1].forEach(x => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 0.9, 12).rotateX(Math.PI / 2), goldMaterial);
    nozzle.position.set(x, 0.1, 2.4);
    const flare = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.0, 12).rotateX(-Math.PI / 2), thrusterMat);
    flare.position.set(0, 0, 0.95);
    flare.name = 'thruster_flame';
    nozzle.add(flare);
    group.add(nozzle);
  });
}

/**
 * VR-0999 — EVENT HORIZON
 * Monolithic obsidian swept hyper-craft, crimson horizon intakes, ultra-thin aerodynamic blade
 */
function buildEventHorizonMesh(
  group: THREE.Group,
  hullMat: THREE.Material,
  neonMat: THREE.Material,
  secNeonMat: THREE.Material,
  cockpitMat: THREE.Material,
  thrusterMat: THREE.Material,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color,
  engineColor: THREE.Color
) {
  // Ultra-glossy obsidian material
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x050508,
    metalness: 0.98,
    roughness: 0.08,
  });

  const crimsonNeonMat = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0044,
    emissiveIntensity: 3.5,
  });

  // Sharp elongated spear fuselage
  const prow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6.8, 4).rotateX(Math.PI / 2).scale(1.4, 0.32, 1), obsidianMat);
  prow.position.set(0, 0, -0.4);
  group.add(prow);

  // Twin Crimson Intake channels
  [-1.1, 1.1].forEach(x => {
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 4.0), obsidianMat);
    intake.position.set(x, 0.08, 0.4);
    group.add(intake);

    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 3.8), crimsonNeonMat);
    glow.position.set(x * 1.08, 0.1, 0.4);
    group.add(glow);
  });

  // Massive back-swept horizon wings
  const wingGeo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0, -1.5,
    -3.8, 0, 2.2,
    0, 0, 2.5,

    0, 0, -1.5,
    0, 0, 2.5,
    3.8, 0, 2.2,
  ]);
  wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  wingGeo.computeVertexNormals();
  const wings = new THREE.Mesh(wingGeo, obsidianMat);
  group.add(wings);

  // Cockpit
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 6).rotateX(Math.PI / 2), cockpitMat);
  canopy.position.set(0, 0.32, -1.1);
  group.add(canopy);

  // Dual Relativistic Antimatter Thrusters
  [-0.7, 0.7].forEach(x => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 1.1, 16).rotateX(Math.PI / 2), obsidianMat);
    nozzle.position.set(x, 0.05, 2.6);
    const flare = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.5, 16).rotateX(-Math.PI / 2), crimsonNeonMat);
    flare.position.set(0, 0, 1.2);
    flare.name = 'thruster_flame';
    nozzle.add(flare);
    group.add(nozzle);
  });
}

/**
 * VR-1000 — ABSOLUTE ZERO
 * Extreme endgame mythic spacecraft, cryo-crystal frosted fuselage, cyan zero-kelvin halos
 */
function buildAbsoluteZeroMesh(
  group: THREE.Group,
  hullMat: THREE.Material,
  neonMat: THREE.Material,
  secNeonMat: THREE.Material,
  cockpitMat: THREE.Material,
  thrusterMat: THREE.Material,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color,
  engineColor: THREE.Color
) {
  // Cryo frost crystalline material
  const cryoMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    metalness: 0.85,
    roughness: 0.1,
  });

  const absoluteCyanGlow = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 3.8,
  });

  // Quad-prong cryo frost prow
  const mainFuselage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 5.2), cryoMat);
  mainFuselage.position.set(0, 0.1, 0.1);
  group.add(mainFuselage);

  [-1.4, -0.5, 0.5, 1.4].forEach(x => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.6, 6).rotateX(Math.PI / 2), cryoMat);
    spike.position.set(x, 0.1, -2.6);
    group.add(spike);
  });

  // Zero-Kelvin Ionization Ring
  const zeroHalo = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.09, 16, 48), absoluteCyanGlow);
  zeroHalo.position.set(0, 0.2, 0.8);
  zeroHalo.name = 'zero_halo';
  group.add(zeroHalo);

  // Crystal Faceted Wings
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 2.4).rotateY(-0.25), cryoMat);
  wingL.position.set(-2.2, 0.15, 0.4);
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 2.4).rotateY(0.25), cryoMat);
  wingR.position.set(2.2, 0.15, 0.4);
  group.add(wingL, wingR);

  // Crystalline Cockpit
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.48, 2.8, 4).rotateX(Math.PI / 2), cockpitMat);
  canopy.position.set(0, 0.42, -0.8);
  group.add(canopy);

  // Quad Cryo Thrusters
  [-1.0, -0.35, 0.35, 1.0].forEach(x => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.9, 12).rotateX(Math.PI / 2), cryoMat);
    nozzle.position.set(x, 0.1, 2.6);
    const flare = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.4, 12).rotateX(-Math.PI / 2), absoluteCyanGlow);
    flare.position.set(0, 0, 1.1);
    flare.name = 'thruster_flame';
    nozzle.add(flare);
    group.add(nozzle);
  });
}
