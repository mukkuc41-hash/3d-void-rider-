import * as THREE from 'three';
import { sound } from '../audio';

export interface RouteElementInteraction {
  boostImpulse: number;
  damageTaken: number;
  relicsCollected: number;
  feedbackMessage: string | null;
  activeBranchName: string;
}

export interface BoostGateData {
  mesh: THREE.Group;
  position: THREE.Vector3;
  cooldownTimer: number;
  innerRing: THREE.Mesh;
}

export interface RelicCoreData {
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  baseY: number;
}

export interface PlasmaVentData {
  mesh: THREE.Group;
  position: THREE.Vector3;
  isActive: boolean;
  timer: number;
  beamMesh: THREE.Mesh;
}

export class QuantumRouteSystem {
  public root: THREE.Group;
  private scene: THREE.Scene;

  // Active Interactive Elements
  private boostGates: BoostGateData[] = [];
  private relicCores: RelicCoreData[] = [];
  private plasmaVents: PlasmaVentData[] = [];
  private vortexOrbs: THREE.Mesh[] = [];

  // Track branch meshes
  private branchTracksGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'QuantumRouteSystem_Root';

    this.branchTracksGroup = new THREE.Group();
    this.branchTracksGroup.name = 'BranchTrackMeshes';
    this.root.add(this.branchTracksGroup);

    this.buildExpandedRouteTracks();
    this.buildQuantumBoostGates();
    this.buildQuantumRelicCores();
    this.buildPlasmaFlareVents();
    this.buildGravitationalVortexOrbs();
    this.buildHolographicBranchSignage();

    this.scene.add(this.root);
  }

  /* =========================================================================
     1. EXPANDED ROUTE TRACKS (Alpha Accelerator, Beta Chasm, Gamma Tunnel)
     ========================================================================= */
  private buildExpandedRouteTracks(): void {
    // Route Alpha: Outer High-Speed Orbital Highway (Curving above the black hole)
    const alphaPoints = [
      new THREE.Vector3(-180, 45, -500),
      new THREE.Vector3(-380, 85, -850),
      new THREE.Vector3(-550, 110, -1350),
      new THREE.Vector3(-480, 95, -1900),
      new THREE.Vector3(-220, 65, -2350),
      new THREE.Vector3(0, 40, -2700),
    ];
    this.createRibbonTrack(alphaPoints, 0x00f0ff, 'Route_Alpha_Accelerator');

    // Route Beta: Accretion Slingshot Chasm (Descending close to accretion disk)
    const betaPoints = [
      new THREE.Vector3(120, 25, -600),
      new THREE.Vector3(280, -15, -1050),
      new THREE.Vector3(390, -45, -1550),
      new THREE.Vector3(310, -35, -2100),
      new THREE.Vector3(140, 10, -2500),
      new THREE.Vector3(0, 40, -2700),
    ];
    this.createRibbonTrack(betaPoints, 0xf59e0b, 'Route_Beta_AccretionChasm');

    // Route Gamma: Megastructure Hyper-Tunnel (Enclosed high-tech conduit)
    const gammaPoints = [
      new THREE.Vector3(0, 30, -750),
      new THREE.Vector3(0, 50, -1250),
      new THREE.Vector3(0, 65, -1750),
      new THREE.Vector3(0, 50, -2250),
      new THREE.Vector3(0, 40, -2700),
    ];
    this.createHyperTunnel(gammaPoints);
  }

  private createRibbonTrack(points: THREE.Vector3[], neonColor: number, name: string): void {
    const curve = new THREE.CatmullRomCurve3(points);
    const divisions = 80;
    const pathPoints = curve.getPoints(divisions);

    const ribbonGeo = new THREE.BufferGeometry();
    const pos: number[] = [];
    const width = 16.0;

    for (let i = 0; i < pathPoints.length; i++) {
      const p = pathPoints[i];
      const tangent = curve.getTangentAt(i / (pathPoints.length - 1)).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const left = p.clone().add(binormal.clone().multiplyScalar(-width * 0.5));
      const right = p.clone().add(binormal.clone().multiplyScalar(width * 0.5));

      pos.push(left.x, left.y, left.z);
      pos.push(right.x, right.y, right.z);
    }

    const indices: number[] = [];
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    ribbonGeo.setIndex(indices);
    ribbonGeo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a1122,
      metalness: 0.85,
      roughness: 0.25,
      emissive: neonColor,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(ribbonGeo, mat);
    mesh.name = name;
    this.branchTracksGroup.add(mesh);

    // Glowing border rails
    const edgeMat = new THREE.LineBasicMaterial({
      color: neonColor,
      linewidth: 2,
    });

    const leftEdgePoints: THREE.Vector3[] = [];
    const rightEdgePoints: THREE.Vector3[] = [];
    for (let i = 0; i < pathPoints.length; i++) {
      const p = pathPoints[i];
      const tangent = curve.getTangentAt(i / (pathPoints.length - 1)).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      leftEdgePoints.push(p.clone().add(binormal.clone().multiplyScalar(-width * 0.5 + 0.2)));
      rightEdgePoints.push(p.clone().add(binormal.clone().multiplyScalar(width * 0.5 - 0.2)));
    }

    const leftGeo = new THREE.BufferGeometry().setFromPoints(leftEdgePoints);
    const rightGeo = new THREE.BufferGeometry().setFromPoints(rightEdgePoints);
    this.branchTracksGroup.add(new THREE.Line(leftGeo, edgeMat));
    this.branchTracksGroup.add(new THREE.Line(rightGeo, edgeMat));
  }

  private createHyperTunnel(points: THREE.Vector3[]): void {
    const curve = new THREE.CatmullRomCurve3(points);
    const divisions = 45;
    const tunnelGroup = new THREE.Group();
    tunnelGroup.name = 'Route_Gamma_HyperTunnel';

    // Hexagonal ring frames along the tunnel
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xc026d3,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      // Hexagonal ring
      const ringGeo = new THREE.TorusGeometry(14, 0.6, 6, 6);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pt);
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      tunnelGroup.add(ringMesh);
    }

    this.branchTracksGroup.add(tunnelGroup);
  }

  /* =========================================================================
     2. QUANTUM BOOST ACCELERATION GATES
     ========================================================================= */
  private buildQuantumBoostGates(): void {
    const gatePositions = [
      new THREE.Vector3(-380, 85, -850),
      new THREE.Vector3(-550, 110, -1350),
      new THREE.Vector3(-480, 95, -1900),
      new THREE.Vector3(280, -15, -1050),
      new THREE.Vector3(390, -45, -1550),
      new THREE.Vector3(0, 50, -1250),
      new THREE.Vector3(0, 65, -1750),
      new THREE.Vector3(0, 42, -2600),
    ];

    const gateFrameGeo = new THREE.TorusGeometry(12, 1.2, 8, 24);
    const gateFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
    });

    const innerRingGeo = new THREE.TorusGeometry(9.5, 0.4, 6, 16);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    for (const pos of gatePositions) {
      const group = new THREE.Group();
      group.position.copy(pos);

      const frame = new THREE.Mesh(gateFrameGeo, gateFrameMat);
      group.add(frame);

      const inner = new THREE.Mesh(innerRingGeo, innerRingMat);
      group.add(inner);

      this.boostGates.push({
        mesh: group,
        position: pos.clone(),
        cooldownTimer: 0,
        innerRing: inner,
      });

      this.root.add(group);
    }
  }

  /* =========================================================================
     3. QUANTUM RELIC CORES (Submode 5 Treasure Hunt & Bonus Objectives)
     ========================================================================= */
  private buildQuantumRelicCores(): void {
    const relicPositions = [
      new THREE.Vector3(-440, 100, -1120),
      new THREE.Vector3(-510, 105, -1620),
      new THREE.Vector3(340, -30, -1320),
      new THREE.Vector3(360, -40, -1820),
      new THREE.Vector3(0, 58, -1500),
      new THREE.Vector3(-120, 55, -2450),
    ];

    const coreGeo = new THREE.IcosahedronGeometry(2.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      metalness: 0.3,
      roughness: 0.1,
      emissive: 0xc084fc,
      emissiveIntensity: 0.85,
    });

    for (const pos of relicPositions) {
      const group = new THREE.Group();
      group.position.copy(pos);

      const mesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(mesh);

      // Light halo
      const haloGeo = new THREE.SphereGeometry(3.6, 12, 10);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      group.add(new THREE.Mesh(haloGeo, haloMat));

      this.relicCores.push({
        mesh: group,
        position: pos.clone(),
        collected: false,
        baseY: pos.y,
      });

      this.root.add(group);
    }
  }

  /* =========================================================================
     4. PLASMA FLARE HAZARD VENTS (Pulsing coronal energy hazard corridors)
     ========================================================================= */
  private buildPlasmaFlareVents(): void {
    const ventPositions = [
      new THREE.Vector3(330, -25, -1200),
      new THREE.Vector3(370, -42, -1700),
      new THREE.Vector3(-490, 102, -1500),
    ];

    for (let i = 0; i < ventPositions.length; i++) {
      const pos = ventPositions[i];
      const group = new THREE.Group();
      group.position.copy(pos);

      // Base emitter nozzle
      const baseGeo = new THREE.CylinderGeometry(2.0, 3.5, 4.0, 12);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.rotation.x = Math.PI / 2;
      group.add(base);

      // Beam cylinder
      const beamGeo = new THREE.CylinderGeometry(1.2, 1.2, 28, 12);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 0, 14);
      beam.rotation.x = Math.PI / 2;
      group.add(beam);

      this.plasmaVents.push({
        mesh: group,
        position: pos.clone(),
        isActive: true,
        timer: i * 1.5,
        beamMesh: beam,
      });

      this.root.add(group);
    }
  }

  /* =========================================================================
     5. GRAVITATIONAL VORTEX ORBS (Dark matter distortion spheres)
     ========================================================================= */
  private buildGravitationalVortexOrbs(): void {
    const orbPositions = [
      new THREE.Vector3(-250, 70, -1000),
      new THREE.Vector3(220, -10, -1400),
      new THREE.Vector3(-100, 45, -2000),
    ];

    const orbGeo = new THREE.SphereGeometry(7, 24, 20);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.45,
    });

    const haloGeo = new THREE.TorusGeometry(12, 0.5, 8, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    for (const pos of orbPositions) {
      const group = new THREE.Group();
      group.position.copy(pos);

      const orb = new THREE.Mesh(orbGeo, orbMat);
      group.add(orb);

      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 3;
      group.add(halo);

      this.vortexOrbs.push(orb);
      this.root.add(group);
    }
  }

  /* =========================================================================
     6. HOLOGRAPHIC BRANCH SIGNAGE
     ========================================================================= */
  private buildHolographicBranchSignage(): void {
    const signageConfigs = [
      { text: 'ROUTE ALPHA: ORBITAL ACCELERATOR', pos: new THREE.Vector3(-180, 52, -550), color: '#00f0ff' },
      { text: 'ROUTE BETA: ACCRETION CHASM', pos: new THREE.Vector3(140, 36, -650), color: '#f59e0b' },
      { text: 'ROUTE GAMMA: HYPER-TUNNEL', pos: new THREE.Vector3(0, 42, -780), color: '#c026d3' },
    ];

    for (const cfg of signageConfigs) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      ctx.fillStyle = cfg.color;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cfg.text, canvas.width / 2, 58);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 4.5), mat);
      mesh.position.copy(cfg.pos);
      mesh.lookAt(cfg.pos.x, cfg.pos.y, cfg.pos.z + 100);
      this.root.add(mesh);
    }
  }

  /* =========================================================================
     UPDATE & INTERACTION LOOP
     ========================================================================= */
  public update(dt: number, playerPos: THREE.Vector3): RouteElementInteraction {
    let boostImpulse = 0;
    let damageTaken = 0;
    let relicsCollected = 0;
    let feedbackMessage: string | null = null;
    let activeBranchName = 'MAIN HIGHWAY';

    // Determine which branch corridor player is closest to
    if (playerPos.z < -450 && playerPos.z > -2650) {
      if (playerPos.x < -100) {
        activeBranchName = 'ROUTE ALPHA // ORBITAL ACCELERATOR';
      } else if (playerPos.x > 100) {
        activeBranchName = 'ROUTE BETA // ACCRETION CHASM';
      } else {
        activeBranchName = 'ROUTE GAMMA // HYPER-TUNNEL';
      }
    } else if (playerPos.z <= -2650) {
      activeBranchName = 'TERMINAL LAUNCHER CORRIDOR';
    }

    // 1. Boost Gate Proximity Check
    for (const gate of this.boostGates) {
      if (gate.cooldownTimer > 0) {
        gate.cooldownTimer -= dt;
      }
      gate.innerRing.rotation.z += dt * 3.5;

      const dist = playerPos.distanceTo(gate.position);
      if (dist < 14.0 && gate.cooldownTimer <= 0) {
        gate.cooldownTimer = 3.5;
        boostImpulse += 45; // boost surge
        sound.playQuantumGateBoost();
        feedbackMessage = 'QUANTUM ACCELERATOR ENGAGED (+120 KM/H)';
      }
    }

    // 2. Relic Core Proximity & Floating Animation
    for (const relic of this.relicCores) {
      if (relic.collected) continue;
      relic.mesh.rotation.y += dt * 2.0;
      relic.mesh.rotation.x += dt * 1.2;
      relic.mesh.position.y = relic.baseY + Math.sin(Date.now() * 0.003) * 1.5;

      const dist = playerPos.distanceTo(relic.position);
      if (dist < 8.0) {
        relic.collected = true;
        relic.mesh.visible = false;
        relicsCollected += 1;
        sound.playQuantumRelicCollected();
        feedbackMessage = 'QUANTUM RELIC SECURED // CORE POWER +100';
      }
    }

    // 3. Plasma Vent Pulsing & Hazard Collision
    for (const vent of this.plasmaVents) {
      vent.timer += dt;
      const cycle = Math.sin(vent.timer * 2.5);
      vent.isActive = cycle > -0.2;
      vent.beamMesh.visible = vent.isActive;

      if (vent.isActive) {
        const dist = playerPos.distanceTo(vent.position);
        if (dist < 10.0) {
          damageTaken += 15 * dt;
          sound.playCollision();
          feedbackMessage = 'PLASMA CORONA HAZARD! SHIELD DRAINED';
        }
      }
    }

    // 4. Vortex Orb Spin
    for (const orb of this.vortexOrbs) {
      orb.rotation.y += dt * 1.4;
    }

    return {
      boostImpulse,
      damageTaken,
      relicsCollected,
      feedbackMessage,
      activeBranchName,
    };
  }

  public dispose(): void {
    this.scene.remove(this.root);
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    this.boostGates = [];
    this.relicCores = [];
    this.plasmaVents = [];
    this.vortexOrbs = [];
  }
}
