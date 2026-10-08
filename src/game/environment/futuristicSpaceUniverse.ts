import * as THREE from 'three';
import { CosmicBiomeId } from './cosmicEnvironmentDirector';

/**
 * FuturisticSpaceUniverse:
 * Colossal futuristic orbital mega-structures arching high above the route,
 * combined with a deep, vibrant universe sky (spiral galaxy, binary moons,
 * volumetric nebulae, and sweeping pulsar beams).
 */
export class FuturisticSpaceUniverse {
  public root: THREE.Group;
  private scene: THREE.Scene;

  // Rotating Mega-Structures
  private citadelStation: THREE.Group | null = null;
  private stationRingInner: THREE.Mesh | null = null;
  private stationRingOuter: THREE.Mesh | null = null;
  private dysonRingArch: THREE.Group | null = null;
  private overheadGateways: THREE.Group[] = [];
  private relayMonoliths: THREE.Group[] = [];

  // Universe & Celestial Elements
  private spiralGalaxy: THREE.Group | null = null;
  private galaxyStars: THREE.Points | null = null;
  private celestialMoons: THREE.Group | null = null;
  private nebulaPlanes: THREE.Mesh[] = [];
  private pulsarBeams: THREE.Group | null = null;

  // Dynamic Materials for Biome Transition
  private neonEnergyMaterials: THREE.MeshBasicMaterial[] = [];
  private nebulaMaterials: THREE.MeshBasicMaterial[] = [];

  private elapsed: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'FuturisticSpaceUniverse_Root';

    this.buildDeepUniverseSky();
    this.buildSpiralGalaxy();
    this.buildCelestialMoons();
    this.buildDysonRingArch();
    this.buildOrbitalCitadelStation();
    this.buildOverheadQuantumGateways();
    this.buildRelayMonoliths();

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. DEEP UNIVERSE SKY & MULTI-LAYERED NEBULAE
     ========================================================================= */
  private buildDeepUniverseSky(): void {
    const nebulaGroup = new THREE.Group();
    nebulaGroup.name = 'Universe_Nebulae';

    // Procedural nebula texture helper
    const createNebulaTexture = (color1: string, color2: string, color3: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 512);

        // Multi-radial soft glow clouds
        const drawCloud = (cx: number, cy: number, r: number, col: string) => {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, col);
          grad.addColorStop(0.45, col.replace(/[\d.]+\)$/, '0.35)'));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };

        drawCloud(256, 256, 240, color1);
        drawCloud(170, 200, 190, color2);
        drawCloud(340, 310, 180, color3);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const texCyan = createNebulaTexture('rgba(6,182,212,0.7)', 'rgba(147,51,234,0.5)', 'rgba(30,58,138,0.6)');
    const texViolet = createNebulaTexture('rgba(168,85,247,0.7)', 'rgba(236,72,153,0.5)', 'rgba(15,23,42,0.8)');
    const texAmber = createNebulaTexture('rgba(245,158,11,0.6)', 'rgba(239,68,68,0.5)', 'rgba(88,28,135,0.7)');

    // 4 Vast Cosmic Nebula billboarding planes suspended in the upper stratosphere
    const nebulaConfigs = [
      { pos: [0, 950, -1800], rot: [0.3, 0, 0], scale: 2200, tex: texCyan, opacity: 0.55 },
      { pos: [1200, 800, -800], rot: [-0.2, 0.4, 0.1], scale: 1900, tex: texViolet, opacity: 0.48 },
      { pos: [-1100, 900, -1100], rot: [0.1, -0.3, -0.1], scale: 2000, tex: texAmber, opacity: 0.42 },
      { pos: [0, 1200, 400], rot: [-0.4, 0.1, 0.2], scale: 2400, tex: texCyan, opacity: 0.5 },
    ];

    nebulaConfigs.forEach(cfg => {
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale);
      const mat = new THREE.MeshBasicMaterial({
        map: cfg.tex,
        transparent: true,
        opacity: cfg.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      nebulaGroup.add(mesh);
      this.nebulaPlanes.push(mesh);
      this.nebulaMaterials.push(mat);
    });

    this.root.add(nebulaGroup);
  }

  /* =========================================================================
     2. SPIRAL GALAXY SUSPENDED AT ZENITH
     ========================================================================= */
  private buildSpiralGalaxy(): void {
    const galaxy = new THREE.Group();
    galaxy.name = 'Zenith_Spiral_Galaxy';
    galaxy.position.set(350, 1100, -1400);
    galaxy.rotation.x = 0.55;
    galaxy.rotation.z = -0.3;

    // Glowing Galactic Core
    const coreGeo = new THREE.SphereGeometry(75, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    galaxy.add(core);

    const haloGeo = new THREE.RingGeometry(60, 280, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    galaxy.add(halo);

    // 2 Majestic Spiral Arms with 1400 Star Particles
    const starCount = 1400;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const armIndex = i % 2;
      const armOffset = (armIndex * Math.PI);
      const dist = Math.pow(Math.random(), 0.75) * 520 + 40;
      const angle = dist * 0.012 + armOffset + (Math.random() - 0.5) * 0.45;
      const spreadX = (Math.random() - 0.5) * (dist * 0.22);
      const spreadY = (Math.random() - 0.5) * 22;
      const spreadZ = (Math.random() - 0.5) * (dist * 0.22);

      positions[i * 3] = Math.cos(angle) * dist + spreadX;
      positions[i * 3 + 1] = spreadY;
      positions[i * 3 + 2] = Math.sin(angle) * dist + spreadZ;

      // Color gradation: White/cyan near core, violet/blue in spiral arms
      const ratio = dist / 560;
      colors[i * 3] = 0.4 + (1 - ratio) * 0.6;
      colors[i * 3 + 1] = 0.6 + (1 - ratio) * 0.4;
      colors[i * 3 + 2] = 0.95;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.galaxyStars = new THREE.Points(starGeo, starMat);
    galaxy.add(this.galaxyStars);

    this.spiralGalaxy = galaxy;
    this.root.add(galaxy);
  }

  /* =========================================================================
     3. BINARY CELESTIAL MOONS & PULSAR BEAMS
     ========================================================================= */
  private buildCelestialMoons(): void {
    const group = new THREE.Group();
    group.name = 'Celestial_Binary_Moons';

    // Moon 1: Cygnus Prime (Crystalline Azure Moon with slender rings)
    const moon1Geo = new THREE.SphereGeometry(110, 32, 32);
    const moon1Mat = new THREE.MeshStandardMaterial({
      color: 0x0e7490,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x083344,
      emissiveIntensity: 0.6,
    });
    const moon1 = new THREE.Mesh(moon1Geo, moon1Mat);
    moon1.position.set(-680, 520, -1650);

    const ringGeo = new THREE.RingGeometry(140, 240, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + 0.4;
    moon1.add(ring);
    group.add(moon1);

    // Moon 2: Volcanic Aethelgard (Amber obsidian moon with molten seams)
    const moon2Geo = new THREE.SphereGeometry(72, 28, 28);
    const moon2Mat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const moon2 = new THREE.Mesh(moon2Geo, moon2Mat);
    moon2.position.set(780, 480, -1350);
    group.add(moon2);

    // Sweeping Pulsar Light Beams
    const pulsarGroup = new THREE.Group();
    const beamGeo = new THREE.ConeGeometry(38, 1600, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beamA = new THREE.Mesh(beamGeo, beamMat);
    beamA.position.set(0, 800, 0);
    const beamB = beamA.clone();
    beamB.rotation.z = Math.PI;
    beamB.position.set(0, -800, 0);

    pulsarGroup.position.set(-900, 750, -2100);
    pulsarGroup.add(beamA, beamB);
    this.pulsarBeams = pulsarGroup;
    group.add(pulsarGroup);

    this.celestialMoons = group;
    this.root.add(group);
  }

  /* =========================================================================
     4. COLOSSAL DYSON RING ARCH HIGH ABOVE ROUTE
     ========================================================================= */
  private buildDysonRingArch(): void {
    const dysonGroup = new THREE.Group();
    dysonGroup.name = 'Dyson_Ring_Arch_Above_Route';
    dysonGroup.position.set(0, 320, -500);

    // Colossal ring segment arching across the sky (radius 750)
    const ringGeo = new THREE.TorusGeometry(750, 14, 16, 80, Math.PI);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x082f49,
      emissiveIntensity: 0.8,
    });
    const arch = new THREE.Mesh(ringGeo, ringMat);
    arch.rotation.x = Math.PI / 2 + 0.15;
    dysonGroup.add(arch);

    // Glowing Neon Energy Conduit Channel inside the arch
    const neonChannelGeo = new THREE.TorusGeometry(750, 4.5, 12, 80, Math.PI);
    const neonChannelMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    const neonArch = new THREE.Mesh(neonChannelGeo, neonChannelMat);
    neonArch.rotation.x = arch.rotation.x;
    dysonGroup.add(neonArch);
    this.neonEnergyMaterials.push(neonChannelMat);

    // 8 Solar Collector Panels mounted along the arch
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 9) * (i + 1);
      const px = Math.cos(angle) * 750;
      const py = Math.sin(angle) * 750 * Math.sin(arch.rotation.x);
      const pz = Math.sin(angle) * 750 * Math.cos(arch.rotation.x);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(45, 6, 25),
        new THREE.MeshStandardMaterial({
          color: 0x1e1b4b,
          metalness: 0.95,
          roughness: 0.1,
          emissive: 0x6366f1,
          emissiveIntensity: 1.2,
        })
      );
      panel.position.set(px, py, pz);
      panel.lookAt(0, 0, 0);
      dysonGroup.add(panel);
    }

    this.dysonRingArch = dysonGroup;
    this.root.add(dysonGroup);
  }

  /* =========================================================================
     5. ORBITAL CITADEL STATION (Centrifuge Rings & Spire)
     ========================================================================= */
  private buildOrbitalCitadelStation(): void {
    const station = new THREE.Group();
    station.name = 'Orbital_Citadel_Station';
    station.position.set(-280, 420, -1150);

    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Central Spire
    const spireGeo = new THREE.CylinderGeometry(14, 24, 280, 24);
    const spire = new THREE.Mesh(spireGeo, stationMat);
    station.add(spire);

    // Spire Beacon Tower
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 45, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beacon.position.set(0, 160, 0);
    station.add(beacon);

    // Inner Centrifuge Habitat Ring
    const innerRingGeo = new THREE.TorusGeometry(85, 6, 16, 48);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
    });
    this.stationRingInner = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.stationRingInner.rotation.x = Math.PI / 2;
    station.add(this.stationRingInner);

    // Outer Centrifuge Habitat Ring (counter-rotating)
    const outerRingGeo = new THREE.TorusGeometry(135, 7.5, 16, 64);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
    });
    this.stationRingOuter = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.stationRingOuter.rotation.x = Math.PI / 2;
    this.stationRingOuter.position.y = -35;
    station.add(this.stationRingOuter);

    // Docking Pylons
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(105, 3.5, 3.5), stationMat);
      pylon.rotation.y = angle;
      station.add(pylon);
    }

    this.citadelStation = station;
    this.root.add(station);
  }

  /* =========================================================================
     6. OVERHEAD QUANTUM GATEWAYS SPANNING ROUTE
     ========================================================================= */
  private buildOverheadQuantumGateways(): void {
    const gatewayPositions = [
      new THREE.Vector3(0, 140, -250),
      new THREE.Vector3(120, 160, -750),
      new THREE.Vector3(-140, 180, -1250),
    ];

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x064e3b,
      emissiveIntensity: 0.8,
    });

    gatewayPositions.forEach((pos, idx) => {
      const gate = new THREE.Group();
      gate.position.copy(pos);

      // Huge overhead arch spanning across the corridor
      const arch = new THREE.Mesh(new THREE.TorusGeometry(95, 4.5, 12, 48, Math.PI), frameMat);
      arch.rotation.z = Math.PI;
      gate.add(arch);

      // Pulsing Forcefield Barrier Mesh
      const field = new THREE.Mesh(
        new THREE.RingGeometry(80, 93, 32, 1, 0, Math.PI),
        new THREE.MeshBasicMaterial({
          color: idx === 1 ? 0xff2bd6 : 0x00f0ff,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      gate.add(field);

      // Overhead Navigational Billboard Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#030d1a';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = idx === 1 ? '#ff2bd6' : '#00f0ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 504, 120);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = idx === 1 ? '#f472b6' : '#67e8f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`ORBITAL SECTOR GATE 0${idx + 1}`, 256, 45);

        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('QUANTUM ROUTE // ACCELERATION PASS', 256, 88);
      }
      const signTex = new THREE.CanvasTexture(canvas);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(54, 13.5),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide })
      );
      sign.position.set(0, 95, 0);
      gate.add(sign);

      this.overheadGateways.push(gate);
      this.root.add(gate);
    });
  }

  /* =========================================================================
     7. RELAY MONOLITHS WITH HIGH-ALTITUDE ENERGY CONDUITS
     ========================================================================= */
  private buildRelayMonoliths(): void {
    const monolithPositions = [
      new THREE.Vector3(-220, 0, -400),
      new THREE.Vector3(220, 0, -400),
      new THREE.Vector3(-280, 0, -950),
      new THREE.Vector3(280, 0, -950),
    ];

    const monoMat = new THREE.MeshStandardMaterial({
      color: 0x050b14,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.9,
    });

    const conduitMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.neonEnergyMaterials.push(conduitMat);

    monolithPositions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      // Towering hexagonal obelisk
      const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(5, 12, 190, 6), monoMat);
      obelisk.position.y = 95;
      group.add(obelisk);

      // Emitter Beacon Top
      const topSphere = new THREE.Mesh(
        new THREE.SphereGeometry(9, 16, 16),
        new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0x00f0ff : 0xa855f7 })
      );
      topSphere.position.y = 190;
      group.add(topSphere);

      this.relayMonoliths.push(group);
      this.root.add(group);
    });

    // Cross-connecting laser beams between monoliths high in the sky
    const beamGeo = new THREE.CylinderGeometry(0.6, 0.6, 440, 8);
    const beam1 = new THREE.Mesh(beamGeo, conduitMat);
    beam1.rotation.z = Math.PI / 2;
    beam1.position.set(0, 190, -400);
    this.root.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 560, 8), conduitMat);
    beam2.rotation.z = Math.PI / 2;
    beam2.position.set(0, 190, -950);
    this.root.add(beam2);
  }

  /* =========================================================================
     8. PER-FRAME UPDATE & BIOME COLOR SHIFTS
     ========================================================================= */
  public update(dt: number, speed: number = 0): void {
    const delta = Math.max(0, Math.min(dt, 0.1));
    this.elapsed += delta;

    // Rotate Citadel Centrifuge Rings
    if (this.stationRingInner) {
      this.stationRingInner.rotation.z += delta * 0.45;
    }
    if (this.stationRingOuter) {
      this.stationRingOuter.rotation.z -= delta * 0.28;
    }

    // Slowly rotate Spiral Galaxy disk
    if (this.spiralGalaxy) {
      this.spiralGalaxy.rotation.y += delta * 0.015;
    }

    // Sweep Pulsar Beams across the cosmos
    if (this.pulsarBeams) {
      this.pulsarBeams.rotation.y += delta * 0.5;
      this.pulsarBeams.rotation.z = Math.sin(this.elapsed * 0.8) * 0.35;
    }

    // Undulate Nebula billboarding planes
    this.nebulaPlanes.forEach((mesh, idx) => {
      mesh.position.y += Math.sin(this.elapsed * 0.4 + idx) * delta * 2.5;
    });

    // Subtle flex on Dyson ring arch
    if (this.dysonRingArch) {
      this.dysonRingArch.rotation.z = Math.sin(this.elapsed * 0.15) * 0.02;
    }
  }

  /**
   * Adjusts lighting and neon conduits to harmonize with active cosmic biome
   */
  public applyCosmicBiomeTheme(biomeId: CosmicBiomeId): void {
    let neonColor = 0x00f0ff;

    switch (biomeId) {
      case 'SOLAR_INFERNO':
        neonColor = 0xf59e0b;
        break;
      case 'MAGNETAR_VOID':
        neonColor = 0xa855f7;
        break;
      case 'EVENT_HORIZON_REDSHIFT':
        neonColor = 0xf43f5e;
        break;
      case 'CRYO_NEBULA':
      default:
        neonColor = 0x00f0ff;
        break;
    }

    this.neonEnergyMaterials.forEach(mat => {
      mat.color.setHex(neonColor);
    });
  }

  public dispose(): void {
    this.scene.remove(this.root);
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
