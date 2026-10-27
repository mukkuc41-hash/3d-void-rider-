/**
 * VOID-RIDER 3D — CONVOY GUARDIAN PROCEDURAL SPACESHIP GEOMETRIC FACTORY
 * 
 * Master Geometric Implementation matching Visual Specification:
 * 
 * SAVIOUR FLEET (9-Ship Escort Formation):
 * - Primary: Layered dark graphite armor (0x1a1d24, metalness 0.88, roughness 0.24)
 * - Secondary: Titanium silver armor plates (0x475569, metalness 0.92, roughness 0.20)
 * - Emissive: Radiant cyan engine nacelles / shield emitters (0x00f0ff)
 * - Accents: Restrained magenta trim lines / markings (0xf43f5e)
 * - Roles:
 *   1. LEAD SHIP (Aegis): Command flagship, stepped pointed nose, raised geometric bridge, broad shoulder armor, quad cyan thrusters.
 *   2. FORWARD GUARD 1 (Left) & 2 (Right): Fast needle-point escorts, swept delta wings with canted tips, dual outboard cyan engines, magenta trim.
 *   3. CARGO GROUP (Cargo 1 Left, Cargo 2 Center, Cargo 3 Right): Massive heavy transport hulls, 3 modular pod clusters, magnetic locks, cyan beacons, rear heavy engine bank.
 *   4. REAR GUARD 1 (Left) & 2 (Right): Defensive escorts with dual rear defensive turrets, cyan shield strips, dual reinforced engines.
 *   5. BACKEND SHIP: Rear command/support hub, elevated dorsal comm tower, lateral sensor pods, triple triangular thruster cluster.
 * 
 * HUNTERS FLEET (17-Unit Assault Formation):
 * - Primary: Faceted obsidian/graphite armor (0x0c0d12, metalness 0.95, roughness 0.16)
 * - Secondary: Dark steel structural frame (0x1f242d, metalness 0.90, roughness 0.25)
 * - Emissive: Radiant crimson/red illumination & exhausts (0xff0038, emissive 0xff0038)
 * - Roles:
 *   1. MAIN HUNTER 1–3 & 4–6: Razor-sharp wedge interceptors, forward-canted wingtips, crimson leading edges, red cockpit slit, quad red thrusters.
 *   2. MID HUNTER 1–2 (Middle-Forward) & 3–4 (Middle-Backward): Staggered arrowhead hull, red intake vents, crimson dorsal fin crest, triple red engines.
 *   3. BOSS (1,000 HP Dreadnought X): Colossal predatory flagship, spiked crimson plating, glowing central reactor core, 6 perimeter drone docking pylons, 6-engine red propulsion bank.
 *   4. DRONE SUPPORT (6 Units): Faceted diamond hull, glowing crimson mono-eye, stabilizer winglets, single red thruster exhaust.
 * 
 * SINGLE-COMPONENT ARCHITECTURE:
 * Every ship is constructed as a single cohesive THREE.Group hierarchy.
 * All child meshes (hull, bridge, wings, armor, engines, plumes, weapons) move,
 * rotate, pitch, yaw, and roll uniformly with controls without detaching or misaligning.
 */

import * as THREE from 'three';
import { ConvoyVariant } from './convoyTypes';
import { ConvoyDivisionId, ConvoyRankTier, CONVOY_DIVISIONS } from './convoyDivisions';

export type ConvoyShipRole =
  | 'LEAD_SHIP'
  | 'FORWARD_GUARD'
  | 'CARGO_SHIP'
  | 'REAR_GUARD'
  | 'BACKEND_SHIP'
  | 'MAIN_HUNTER'
  | 'MID_HUNTER'
  | 'BOSS'
  | 'SCOUT_DRONE'
  | 'INTERCEPTOR_DRONE'
  | 'GUARDIAN_DRONE'
  | 'BOSS_GUARD_DRONE';

export interface ConvoyShipModelOptions {
  faction: ConvoyVariant | 'SAVIOUR' | 'HUNTERS';
  role: ConvoyShipRole;
  shipDefId?: string;
  division?: ConvoyDivisionId;
  rank?: ConvoyRankTier;
  isMirrored?: boolean;
  scale?: number;
  customPrimaryHex?: number;
  customAccentHex?: number;
}

export class ConvoyShipFactory {
  /**
   * Primary entry point for constructing 3D ship models.
   * Returns a single unified THREE.Group component.
   */
  public static createModel(options: ConvoyShipModelOptions): THREE.Group {
    const group = new THREE.Group();
    const faction = options.faction === 'HUNTERS' || options.faction === 'HUNTER' ? 'HUNTERS' : 'SAVIOUR';
    const division = options.division || 'D5';
    const rank = options.rank || 1;
    const isMirrored = options.isMirrored ?? false;
    const scale = options.scale ?? 1.0;

    group.name = `convoy_ship_${options.role}_${division}_R${rank}`;

    // Faction Base Palettes
    const isSaviour = faction === 'SAVIOUR';

    // Saviour Palette: Dark layered graphite + titanium + cyan glow + magenta markings
    // Hunters Palette: Faceted obsidian + dark steel + radiant crimson glow
    const primaryHex = options.customPrimaryHex ?? (isSaviour ? 0x1a1d24 : 0x0c0d12);
    const secondaryHex = isSaviour ? 0x475569 : 0x1f242d;
    const accentHex = options.customAccentHex ?? (isSaviour ? 0x00f0ff : 0xff0038);
    const engineHex = isSaviour ? 0x06b6d4 : 0xef4444;
    const trimHex = isSaviour ? 0xf43f5e : 0xff0038;
    const divisionHex = parseInt(CONVOY_DIVISIONS[division]?.badgeHex?.replace('#', '0x') || '0x38bdf8', 16);

    // Build base role hull directly attached to root group
    switch (options.role) {
      case 'LEAD_SHIP':
        this.buildLeadShipHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex);
        break;
      case 'FORWARD_GUARD':
        this.buildForwardGuardHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex, isMirrored);
        break;
      case 'CARGO_SHIP':
        this.buildCargoShipHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex);
        break;
      case 'REAR_GUARD':
        this.buildRearGuardHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex, isMirrored);
        break;
      case 'BACKEND_SHIP':
        this.buildBackendShipHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex);
        break;
      case 'MAIN_HUNTER':
        this.buildMainHunterHull(group, primaryHex, secondaryHex, accentHex, engineHex);
        break;
      case 'MID_HUNTER':
        this.buildMidHunterHull(group, primaryHex, secondaryHex, accentHex, engineHex);
        break;
      case 'BOSS':
        this.buildBossHull(group, primaryHex, secondaryHex, accentHex, engineHex);
        break;
      case 'SCOUT_DRONE':
      case 'INTERCEPTOR_DRONE':
      case 'GUARDIAN_DRONE':
      case 'BOSS_GUARD_DRONE':
        this.buildDroneSupport(group, accentHex, engineHex);
        break;
      default:
        this.buildLeadShipHull(group, primaryHex, secondaryHex, accentHex, engineHex, trimHex);
        break;
    }

    // Apply Division Progression Details (unified with parent group)
    this.applyDivisionCosmetics(group, division, divisionHex, isSaviour);

    // Apply Rank Cosmetics (unified with parent group)
    this.applyRankCosmetics(group, rank, accentHex, isSaviour);

    if (scale !== 1.0) {
      group.scale.setScalar(scale);
    }

    return group;
  }

  // =========================================================================
  // SAVIOUR ROLE DESIGNS (Matching Reference Sheet 1)
  // =========================================================================

  /**
   * SAVIOUR — LEAD SHIP (Aegis Flagship)
   * Heavy command flagship: pointed stepped nose, broad layered armored shoulders,
   * raised geometric command bridge, dark graphite armor, cyan glow, magenta markings,
   * quad cylindrical ion thrusters with cyan exhaust.
   */
  private static buildLeadShipHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    cyanHex: number,
    engineHex: number,
    magentaHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.88, roughness: 0.24 });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.92, roughness: 0.20 });
    const bridgeGlassMat = new THREE.MeshStandardMaterial({
      color: cyanHex,
      emissive: cyanHex,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: cyanHex });
    const magentaTrimMat = new THREE.MeshBasicMaterial({ color: magentaHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.88 });

    // 1. Central Fuselage Core (Tapered hexagonal body)
    const coreGeo = new THREE.BoxGeometry(18, 12, 54);
    const core = new THREE.Mesh(coreGeo, armorMat);
    group.add(core);

    // 2. Stepped Elongated Prow / Nose
    const noseGeo = new THREE.ConeGeometry(9, 32, 4);
    const nose = new THREE.Mesh(noseGeo, armorMat);
    nose.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    nose.position.set(0, -1, -38);
    group.add(nose);

    // Lower armor chin / nose blade
    const chinGeo = new THREE.BoxGeometry(8, 2.5, 24);
    const chin = new THREE.Mesh(chinGeo, titaniumMat);
    chin.position.set(0, -4, -34);
    group.add(chin);

    // Magenta nose accent line
    const noseTrim = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 26), magentaTrimMat);
    noseTrim.position.set(0, -4.8, -34);
    group.add(noseTrim);

    // 3. Raised Geometric Command Bridge Superstructure
    const bridgeBaseGeo = new THREE.BoxGeometry(10, 6, 26);
    const bridgeBase = new THREE.Mesh(bridgeBaseGeo, titaniumMat);
    bridgeBase.position.set(0, 7.5, -4);
    group.add(bridgeBase);

    // Glowing cyan bridge canopy
    const canopyGeo = new THREE.BoxGeometry(7, 3.2, 16);
    const canopy = new THREE.Mesh(canopyGeo, bridgeGlassMat);
    canopy.position.set(0, 9.8, -6);
    group.add(canopy);

    // Dorsal comm antenna / sensor mast
    const mastGeo = new THREE.CylinderGeometry(0.8, 1.2, 10, 6);
    const mast = new THREE.Mesh(mastGeo, titaniumMat);
    mast.position.set(0, 14, 2);
    group.add(mast);

    const mastBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), cyanGlowMat);
    mastBeacon.position.set(0, 19, 2);
    group.add(mastBeacon);

    // 4. Broad Armored Shoulder Wings with Magenta Trim
    [-1, 1].forEach((side) => {
      // Main wing plate
      const wingGeo = new THREE.BoxGeometry(16, 2.8, 38);
      const wing = new THREE.Mesh(wingGeo, armorMat);
      wing.position.set(side * 17, 0, 4);
      wing.rotation.y = side * 0.16;
      group.add(wing);

      // Layered titanium upper armor chine
      const plateGeo = new THREE.BoxGeometry(11, 1.6, 28);
      const plate = new THREE.Mesh(plateGeo, titaniumMat);
      plate.position.set(side * 15, 2.2, 4);
      plate.rotation.y = side * 0.16;
      group.add(plate);

      // Magenta racing stripes along outer wing bevel
      const trimGeo = new THREE.BoxGeometry(1.4, 0.8, 34);
      const trim = new THREE.Mesh(trimGeo, magentaTrimMat);
      trim.position.set(side * 24.5, 0.5, 6);
      trim.rotation.y = side * 0.16;
      group.add(trim);

      // 360-degree Shield Emitter Nodes
      const emitterBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.6, 8, 12), titaniumMat);
      emitterBase.position.set(side * 13, 3, -12);
      group.add(emitterBase);

      const emitterNode = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), cyanGlowMat);
      emitterNode.position.set(side * 13, 7.5, -12);
      group.add(emitterNode);
    });

    // 5. Multi-Engine Propulsion (4 Large Cylindrical Cyan Thrusters)
    const enginePositions = [
      { x: -6, y: 4.5, z: 27 },
      { x: 6, y: 4.5, z: 27 },
      { x: -8.5, y: -2, z: 27 },
      { x: 8.5, y: -2, z: 27 },
    ];

    enginePositions.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.8, 14, 16), titaniumMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const nozzleGlow = new THREE.Mesh(new THREE.CircleGeometry(3.6, 16), cyanGlowMat);
      nozzleGlow.position.set(pos.x, pos.y, pos.z + 7.1);
      group.add(nozzleGlow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(3.6, 24, 16), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 19);
      group.add(plume);
    });
  }

  /**
   * SAVIOUR — FORWARD GUARD 1 (LEFT) & FORWARD GUARD 2 (RIGHT)
   * High maneuverability escort: needle-sharp interceptor nose, swept delta wings
   * with canted stabilizer tips, dual outboard cyan engines, magenta edge trim.
   */
  private static buildForwardGuardHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    cyanHex: number,
    engineHex: number,
    magentaHex: number,
    isMirrored: boolean
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.88, roughness: 0.22 });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.92, roughness: 0.20 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: cyanHex });
    const magentaTrimMat = new THREE.MeshBasicMaterial({ color: magentaHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.88 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 36), armorMat);
    group.add(body);

    // Sharp needle prow
    const prow = new THREE.Mesh(new THREE.ConeGeometry(6.5, 30, 4), armorMat);
    prow.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    prow.position.set(0, 0, -26);
    group.add(prow);

    // Cockpit sensor strip
    const visor = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 12), cyanGlowMat);
    visor.position.set(0, 4.5, -6);
    group.add(visor);

    // Swept delta wings with canted wingtips
    const mirrorFactor = isMirrored ? -1 : 1;
    [-1, 1].forEach((side) => {
      // Main wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 26), armorMat);
      wing.position.set(side * 13, 0, 4);
      wing.rotation.y = side * 0.22 * mirrorFactor;
      group.add(wing);

      // Canted wingtip vertical stabilizer
      const tip = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 16), titaniumMat);
      tip.position.set(side * 19.5, 2.5, 8);
      tip.rotation.z = side * 0.35;
      group.add(tip);

      // Magenta leading edge trim
      const edge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 22), magentaTrimMat);
      edge.position.set(side * 15, 0.5, -4);
      edge.rotation.y = side * 0.22 * mirrorFactor;
      group.add(edge);

      // Outboard cyan engine nacelles
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.0, 14, 14), titaniumMat);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(side * 9, 0, 18);
      group.add(engine);

      const nozzleGlow = new THREE.Mesh(new THREE.CircleGeometry(3.0, 14), cyanGlowMat);
      nozzleGlow.position.set(side * 9, 0, 25.1);
      group.add(nozzleGlow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(3.0, 20, 14), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(side * 9, 0, 35);
      group.add(plume);

      // Forward plasma cannon hardpoint
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 16, 8), titaniumMat);
      gun.rotation.x = Math.PI / 2;
      gun.position.set(side * 5, -2, -14);
      group.add(gun);
    });
  }

  /**
   * SAVIOUR — CARGO GROUP (CARGO 1, CARGO 2, CARGO 3)
   * Substantially larger than escorts (~78 length, 32 width, 22 height).
   * Massive rectangular transport spine, blunt armored prow, 3 modular pod clusters,
   * magnetic container rails with magenta locks, cyan status beacons, rear heavy engine bank.
   */
  private static buildCargoShipHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    cyanHex: number,
    engineHex: number,
    magentaHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.85, roughness: 0.30 });
    const frameMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.90, roughness: 0.25 });
    const containerMat = new THREE.MeshStandardMaterial({ color: 0x272e3d, metalness: 0.80, roughness: 0.35 });
    const cyanBeaconMat = new THREE.MeshBasicMaterial({ color: cyanHex });
    const magentaLockMat = new THREE.MeshBasicMaterial({ color: magentaHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.90 });

    // 1. Heavy Central Spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 58), armorMat);
    group.add(spine);

    // 2. Blunt Reinforced Armored Prow / Bumper
    const prow = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 16), frameMat);
    prow.position.set(0, 0, -32);
    group.add(prow);

    // Armored nose bridge canopy
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 8), cyanBeaconMat);
    bridge.position.set(0, 8.5, -30);
    group.add(bridge);

    // 3. Three Modular Cargo Pod Clusters Along Spine
    const zOffsets = [-16, 4, 24];
    zOffsets.forEach((z) => {
      // Container rails & pods
      [-1, 1].forEach((side) => {
        // Armored cargo pod box
        const pod = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 15), containerMat);
        pod.position.set(side * 14.5, 0, z);
        group.add(pod);

        // Magnetic container locking latch (magenta)
        const latch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 12, 4), magentaLockMat);
        latch.position.set(side * 20.2, 0, z);
        group.add(latch);

        // Cyan status telemetry beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), cyanBeaconMat);
        beacon.position.set(side * 18, 5.5, z);
        group.add(beacon);
      });

      // Transverse structural rib
      const rib = new THREE.Mesh(new THREE.BoxGeometry(32, 15, 2.5), frameMat);
      rib.position.set(0, 0, z - 8);
      group.add(rib);
    });

    // 4. Rear Engine Propulsion Bulkhead
    const bulkhead = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 10), frameMat);
    bulkhead.position.set(0, 0, 34);
    group.add(bulkhead);

    // Triple Heavy Industrial Thrusters
    const cargoEngines = [
      { x: 0, y: 2, z: 39 },
      { x: -9.5, y: -2, z: 39 },
      { x: 9.5, y: -2, z: 39 },
    ];

    cargoEngines.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.6, 14, 16), armorMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(4.4, 16), cyanBeaconMat);
      glow.position.set(pos.x, pos.y, pos.z + 7.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(4.5, 26, 16), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 20);
      group.add(plume);
    });
  }

  /**
   * SAVIOUR — REAR GUARD 1 (LEFT) & REAR GUARD 2 (RIGHT)
   * Sturdy defensive escort with twin rear defensive turrets, swept wings,
   * cyan shield strips, dual reinforced thrusters.
   */
  private static buildRearGuardHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    cyanHex: number,
    engineHex: number,
    magentaHex: number,
    isMirrored: boolean
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.88, roughness: 0.22 });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.92, roughness: 0.20 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: cyanHex });
    const magentaTrimMat = new THREE.MeshBasicMaterial({ color: magentaHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.88 });

    // Main hull
    const body = new THREE.Mesh(new THREE.BoxGeometry(20, 11, 44), armorMat);
    group.add(body);

    // Tapered forward prow
    const prow = new THREE.Mesh(new THREE.ConeGeometry(8, 22, 4), armorMat);
    prow.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    prow.position.set(0, 0, -26);
    group.add(prow);

    // Cyan shield generator strips along port and starboard
    [-1, 1].forEach((side) => {
      const shieldStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 30), cyanGlowMat);
      shieldStrip.position.set(side * 10.2, 0, 0);
      group.add(shieldStrip);

      // Swept stabilizer wings
      const wing = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 24), armorMat);
      wing.position.set(side * 14, 0, 6);
      wing.rotation.y = side * (isMirrored ? -0.2 : 0.2);
      group.add(wing);

      // Magenta wing accent
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 20), magentaTrimMat);
      trim.position.set(side * 19.5, 0.5, 8);
      group.add(trim);

      // Rear-Facing Defensive Turrets
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 4, 12), titaniumMat);
      plinth.position.set(side * 6.5, 6.5, 8);
      group.add(plinth);

      // Twin elevation barrels pointing rearward
      [-1, 1].forEach((bSide) => {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), titaniumMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(side * 6.5 + bSide * 1.5, 7.5, 14);
        group.add(barrel);
      });

      // Dual engines
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.4, 14, 14), titaniumMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(side * 6, 0, 24);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(3.2, 14), cyanGlowMat);
      glow.position.set(side * 6, 0, 31.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(3.2, 22, 14), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(side * 6, 0, 42);
      group.add(plume);
    });
  }

  /**
   * SAVIOUR — BACKEND SHIP
   * Rear command and support ship: elevated dorsal communications tower,
   * lateral sensor/drone docking pods, triple cylindrical thruster cluster in triangular formation.
   */
  private static buildBackendShipHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    cyanHex: number,
    engineHex: number,
    magentaHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.88, roughness: 0.22 });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.92, roughness: 0.20 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: cyanHex });
    const magentaTrimMat = new THREE.MeshBasicMaterial({ color: magentaHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.88 });

    // Broad command/support fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(26, 13, 46), armorMat);
    group.add(body);

    // Prow wedge
    const nose = new THREE.Mesh(new THREE.ConeGeometry(11, 24, 4), armorMat);
    nose.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    nose.position.set(0, 0, -28);
    group.add(nose);

    // Elevated Dorsal Communications Mast / Tower
    const commMast = new THREE.Mesh(new THREE.BoxGeometry(4.5, 14, 18), titaniumMat);
    commMast.position.set(0, 11, -2);
    group.add(commMast);

    const commArray = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 14), cyanGlowMat);
    commArray.position.set(0, 18.5, -2);
    group.add(commArray);

    // Lateral Sensor / Support Pods
    [-1, 1].forEach((side) => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 26), titaniumMat);
      pod.position.set(side * 15, 2, 0);
      group.add(pod);

      const sensorBeacon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), cyanGlowMat);
      sensorBeacon.position.set(side * 15, 7, -6);
      group.add(sensorBeacon);

      const podTrim = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 24), magentaTrimMat);
      podTrim.position.set(side * 18.2, 2, 0);
      group.add(podTrim);
    });

    // Triple Thruster Cluster in Triangular Formation
    const backendEngines = [
      { x: 0, y: 5.5, z: 25 },
      { x: -7, y: -2, z: 25 },
      { x: 7, y: -2, z: 25 },
    ];

    backendEngines.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.6, 14, 16), titaniumMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(3.4, 16), cyanGlowMat);
      glow.position.set(pos.x, pos.y, pos.z + 7.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(3.5, 22, 16), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 18);
      group.add(plume);
    });
  }

  // =========================================================================
  // HUNTERS ROLE DESIGNS (Matching Reference Sheet 2)
  // =========================================================================

  /**
   * HUNTERS — MAIN HUNTER (Hunters 1–3 & 4–6)
   * Aggressive razor-sharp wedge interceptors: faceted obsidian plating,
   * forward-canted wingtips with radiant crimson leading edges, red cockpit slit,
   * quad red rocket exhaust nozzles with crimson thrust plumes, underslung hardpoints.
   */
  private static buildMainHunterHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    crimsonHex: number,
    engineHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.95, roughness: 0.16 });
    const steelMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.90, roughness: 0.24 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: crimsonHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.92 });

    // 1. Central Chiseled Dart Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 38), armorMat);
    group.add(fuselage);

    // Razor-Sharp Pointed Wedge Prow
    const spear = new THREE.Mesh(new THREE.ConeGeometry(7.5, 34, 4), armorMat);
    spear.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    spear.position.set(0, 0, -22);
    group.add(spear);

    // Glowing Crimson Cockpit Visor Slit
    const visor = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 14), redGlowMat);
    visor.position.set(0, 3.8, -8);
    group.add(visor);

    // 2. Swept Wings with Forward-Canted Wingtips & Crimson Leading Edges
    [-1, 1].forEach((side) => {
      // Main swept wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 30), armorMat);
      wing.position.set(side * 15, 0, 4);
      wing.rotation.y = side * 0.32;
      group.add(wing);

      // Aggressive forward-canted wingtip blade
      const tipBlade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7, 18), steelMat);
      tipBlade.position.set(side * 23.5, 2, 8);
      tipBlade.rotation.z = side * 0.35;
      group.add(tipBlade);

      // Crimson leading edge blade trim
      const leadingEdge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 26), redGlowMat);
      leadingEdge.position.set(side * 17, 0.5, -4);
      leadingEdge.rotation.y = side * 0.32;
      group.add(leadingEdge);

      // Underslung plasma / missile hardpoint
      const hardpoint = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 16, 8), steelMat);
      hardpoint.rotation.x = Math.PI / 2;
      hardpoint.position.set(side * 8, -2.5, 2);
      group.add(hardpoint);
    });

    // 3. Quad Red Rocket Thrusters
    const hunterEngines = [
      { x: -4.5, y: 1.8, z: 20 },
      { x: 4.5, y: 1.8, z: 20 },
      { x: -9.5, y: -1.2, z: 18 },
      { x: 9.5, y: -1.2, z: 18 },
    ];

    hunterEngines.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.8, 12, 14), steelMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(2.6, 14), redGlowMat);
      glow.position.set(pos.x, pos.y, pos.z + 6.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(2.8, 22, 14), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 17);
      group.add(plume);
    });
  }

  /**
   * HUNTERS — MID HUNTER (Mid Hunter 1–2 Middle-Forward & 3–4 Middle-Backward)
   * Support fighters with balanced speed, firepower, and defense:
   * staggered arrowhead hull, red intake vents along flanks, crimson dorsal fin crest,
   * triple red high-performance thrusters.
   */
  private static buildMidHunterHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    crimsonHex: number,
    engineHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.94, roughness: 0.18 });
    const steelMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.90, roughness: 0.22 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: crimsonHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.92 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 44), armorMat);
    group.add(body);

    // Chisel prow
    const prow = new THREE.Mesh(new THREE.ConeGeometry(9.5, 26, 4), armorMat);
    prow.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    prow.position.set(0, 0, -25);
    group.add(prow);

    // Crimson dorsal fin crest
    const crest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 9, 24), redGlowMat);
    crest.position.set(0, 8, 2);
    group.add(crest);

    // Lateral armor fins and glowing red intake channels
    [-1, 1].forEach((side) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(8, 14, 26), steelMat);
      fin.position.set(side * 15, 1, 4);
      group.add(fin);

      // Red radiator channel
      const radiator = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 22), redGlowMat);
      radiator.position.set(side * 19.2, 1, 4);
      group.add(radiator);
    });

    // Triple Thruster Cluster
    const midEngines = [
      { x: 0, y: 2, z: 24 },
      { x: -7.5, y: -1, z: 24 },
      { x: 7.5, y: -1, z: 24 },
    ];

    midEngines.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 12, 14), steelMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(3.0, 14), redGlowMat);
      glow.position.set(pos.x, pos.y, pos.z + 6.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(3.2, 22, 14), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 17);
      group.add(plume);
    });
  }

  /**
   * HUNTERS — BOSS (1,000 HP Dreadnought X Flagship)
   * Colossal predatory flagship: imposing jagged chevron carapace,
   * spiked crimson and obsidian faceted armor plating, glowing central red reactor core,
   * 6 perimeter drone docking pylon brackets, massive 6-engine rear propulsion bank.
   */
  private static buildBossHull(
    group: THREE.Group,
    primaryHex: number,
    secondaryHex: number,
    crimsonHex: number,
    engineHex: number
  ) {
    const armorMat = new THREE.MeshStandardMaterial({ color: primaryHex, metalness: 0.95, roughness: 0.15 });
    const steelMat = new THREE.MeshStandardMaterial({ color: secondaryHex, metalness: 0.92, roughness: 0.22 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: crimsonHex });
    const reactorMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.95 });

    // 1. Colossal Primary Carapace
    const carapace = new THREE.Mesh(new THREE.BoxGeometry(64, 26, 94), armorMat);
    group.add(carapace);

    // 2. Predatory Forward Mandibles (Prow)
    [-1, 1].forEach((side) => {
      const mandible = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 52), armorMat);
      mandible.position.set(side * 24, 0, -54);
      mandible.rotation.y = side * -0.15;
      group.add(mandible);

      // Crimson spiked edge
      const spike = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 44), redGlowMat);
      spike.position.set(side * 31, 0, -56);
      spike.rotation.y = side * -0.15;
      group.add(spike);
    });

    // 3. Pulsing Central Crimson Reactor Core
    const coreGeo = new THREE.SphereGeometry(16, 24, 24);
    const core = new THREE.Mesh(coreGeo, reactorMat);
    core.position.set(0, 2, -4);
    group.add(core);

    // Slotted armor cage protecting core
    for (let c = 0; c < 4; c++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 1.8, 8, 24), steelMat);
      ring.position.set(0, 2, -16 + c * 8);
      group.add(ring);
    }

    // 4. Six Dedicated Perimeter Drone Docking Pylon Mounts
    const dockingPositions = [
      { x: -44, y: 8, z: -18 },
      { x: 44, y: 8, z: -18 },
      { x: -50, y: 0, z: 14 },
      { x: 50, y: 0, z: 14 },
      { x: -40, y: -8, z: 40 },
      { x: 40, y: -8, z: 40 },
    ];

    dockingPositions.forEach((pos) => {
      // Pylon arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), steelMat);
      arm.position.set(pos.x * 0.75, pos.y, pos.z);
      group.add(arm);

      // Magnetic docking ring
      const dockRing = new THREE.Mesh(new THREE.TorusGeometry(5, 1.2, 8, 16), redGlowMat);
      dockRing.position.set(pos.x, pos.y, pos.z);
      group.add(dockRing);
    });

    // 5. Elevated Command Citadel
    const citadel = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 34), steelMat);
    citadel.position.set(0, 18, 8);
    group.add(citadel);

    const citadelVisor = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 2), redGlowMat);
    citadelVisor.position.set(0, 22, -8.5);
    group.add(citadelVisor);

    // 6. Colossal 6-Engine Rear Propulsion Bank
    const bossEngines = [
      { x: -22, y: 0, z: 48 },
      { x: 22, y: 0, z: 48 },
      { x: -8, y: 5, z: 48 },
      { x: 8, y: 5, z: 48 },
      { x: -8, y: -5, z: 48 },
      { x: 8, y: -5, z: 48 },
    ];

    bossEngines.forEach((pos) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.4, 16, 16), steelMat);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(pos.x, pos.y, pos.z);
      group.add(nacelle);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(4.8, 16), redGlowMat);
      glow.position.set(pos.x, pos.y, pos.z + 8.1);
      group.add(glow);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(5.0, 36, 16), plumeMat);
      plume.rotation.x = -Math.PI / 2;
      plume.position.set(pos.x, pos.y, pos.z + 26);
      group.add(plume);
    });
  }

  /**
   * HUNTERS — DRONE SUPPORT (6 Units)
   * Compact diamond/arrowhead faceted chassis:
   * obsidian armor, luminous crimson mono-eye lens, stabilizer winglets, single red thruster exhaust.
   */
  private static buildDroneSupport(group: THREE.Group, crimsonHex: number, engineHex: number) {
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x0c0d12, metalness: 0.95, roughness: 0.16 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: crimsonHex });
    const plumeMat = new THREE.MeshBasicMaterial({ color: engineHex, transparent: true, opacity: 0.92 });

    // Diamond faceted hull
    const diamond = new THREE.Mesh(new THREE.ConeGeometry(6, 16, 4), armorMat);
    diamond.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    diamond.position.set(0, 0, -2);
    group.add(diamond);

    // Stabilizer winglets
    const winglets = new THREE.Mesh(new THREE.BoxGeometry(11, 1, 7), armorMat);
    winglets.position.set(0, 0, 2);
    group.add(winglets);

    // Glowing crimson mono-eye / sensor lens
    const eye = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), redGlowMat);
    eye.position.set(0, 1.4, -6);
    group.add(eye);

    // Single red thruster plume
    const plume = new THREE.Mesh(new THREE.ConeGeometry(2.4, 14, 12), plumeMat);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(0, 0, 13);
    group.add(plume);
  }

  // =========================================================================
  // DIVISION & RANK COSMETIC COMPOSITION
  // =========================================================================

  private static applyDivisionCosmetics(
    group: THREE.Group,
    division: ConvoyDivisionId,
    badgeHex: number,
    isSaviour: boolean
  ) {
    const badgeMat = new THREE.MeshBasicMaterial({ color: badgeHex });

    if (division === 'D4') {
      [-1, 1].forEach((side) => {
        const ext = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 16), badgeMat);
        ext.position.set(side * 24, 0, 6);
        group.add(ext);
      });
    } else if (division === 'D3') {
      [-1, 1].forEach((side) => {
        const nacelle = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 22), badgeMat);
        nacelle.position.set(side * 22, 2, 2);
        group.add(nacelle);
      });
    } else if (division === 'D2') {
      [-1, 1].forEach((side) => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(3, 7, 24), badgeMat);
        blade.position.set(side * 26, 3, 4);
        blade.rotation.z = side * 0.25;
        group.add(blade);
      });
    } else if (division === 'D1') {
      const crownMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(9, 1.2, 8, 32), crownMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 14, 4);
      group.add(halo);

      [-1, 1].forEach((side) => {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(2, 14, 4), crownMat);
        fin.position.set(side * 18, 8, 12);
        fin.rotation.z = side * -0.35;
        group.add(fin);
      });
    }
  }

  private static applyRankCosmetics(
    group: THREE.Group,
    rank: ConvoyRankTier,
    accentHex: number,
    isSaviour: boolean
  ) {
    const rankMat = new THREE.MeshBasicMaterial({ color: accentHex });

    if (rank >= 4 && rank <= 6) {
      [-1, 1].forEach((side) => {
        const chevron = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 8), rankMat);
        chevron.position.set(side * 12, 1, 0);
        chevron.rotation.y = side * 0.4;
        group.add(chevron);
      });
    } else if (rank >= 7 && rank <= 9) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 14), rankMat);
      fin.position.set(0, 9, 8);
      group.add(fin);
    } else if (rank === 10) {
      const crest = new THREE.Mesh(new THREE.OctahedronGeometry(3.5, 1), rankMat);
      crest.position.set(0, 12, -8);
      group.add(crest);
    }
  }

  /**
   * Safely disposes all geometries and materials within a ship Group.
   */
  public static disposeModel(group: THREE.Group) {
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }
}
