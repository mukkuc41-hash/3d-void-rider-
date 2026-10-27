import * as THREE from 'three';

/**
 * NEUTRON STAR SYSTEM & RELATIVISTIC PULSAR PHENOMENA
 *
 * Distinct from the central supermassive black hole.
 * Features:
 * - Ultra-dense, ultra-bright white-blue core with high-frequency surface pulsation
 * - Magnetic dipole flux arcs wrapping polar coordinates
 * - Twin rotating relativistic radiation beams (pulsar lighthouse effect)
 * - Concentric expanding radiation shockwave rings
 * - Dynamic flare bursts & magnetic pulse discharges during key collapse events
 */

export interface NeutronStarTelemetry {
  isActive: boolean;
  coreBrightness: number;
  magneticPulseIntensity: number;
  radiationFieldStrength: number;
  isFlaring: boolean;
  distanceToPlayer: number;
}

export class NeutronStarSystem {
  public root: THREE.Group;
  private scene: THREE.Scene;

  // Visual Components
  private coreMesh: THREE.Mesh;
  private haloMesh: THREE.Mesh;
  private northBeamMesh: THREE.Mesh;
  private southBeamMesh: THREE.Mesh;
  private magneticArcsGroup: THREE.Group;
  private radiationWavesGroup: THREE.Group;
  private particleStreams: THREE.Points;

  // Core Light & Illumination
  private pulsarPointLight: THREE.PointLight;

  // Relativistic Physics & Rotation
  private precessAxis = new THREE.Vector3(0.3, 0.95, 0.1).normalize();
  private beamSpinRate = 14.0; // High-frequency rotation
  private flareTimer = 0.0;
  private magneticPulseActive = false;
  private magneticPulseProgress = 0.0;

  // Expanding shockwave rings
  private shockwaveRings: { mesh: THREE.Mesh; currentRadius: number; maxRadius: number; speed: number; opacity: number }[] = [];

  constructor(scene: THREE.Scene, position = new THREE.Vector3(1450, 480, -2100)) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'NeutronStarSystem_Root';
    this.root.position.copy(position);

    // 1. Ultra-dense, ultra-bright core (Compact, radius 42m)
    const coreGeo = new THREE.SphereGeometry(42, 32, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.root.add(this.coreMesh);

    // 2. High-energy coronal halo
    const haloGeo = new THREE.SphereGeometry(78, 24, 18);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.root.add(this.haloMesh);

    // 3. Relativistic Lighthouse Beams (Twin conical beams stretching 2200m)
    const beamGeo = new THREE.ConeGeometry(85, 2200, 24, 1, true);
    // Align base to cone tip
    beamGeo.translate(0, 1100, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.northBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.southBeamMesh = new THREE.Mesh(beamGeo.clone(), beamMat);
    this.southBeamMesh.rotation.x = Math.PI; // Opposite pole

    this.root.add(this.northBeamMesh);
    this.root.add(this.southBeamMesh);

    // 4. Magnetic Dipole Arcs (Curving magnetic flux lines)
    this.magneticArcsGroup = new THREE.Group();
    this.buildMagneticFluxArcs();
    this.root.add(this.magneticArcsGroup);

    // 5. Radiation Wave Discs
    this.radiationWavesGroup = new THREE.Group();
    this.buildRadiationWaveRings();
    this.root.add(this.radiationWavesGroup);

    // 6. High-Energy Particle Streams (Pulsar wind nebula sparks)
    const particleCount = 240;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 380;
      pPos[i * 3] = Math.cos(theta) * r;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 800;
      pPos[i * 3 + 2] = Math.sin(theta) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.particleStreams = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xa5f3fc,
        size: 9,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.root.add(this.particleStreams);

    // 7. Dynamic Point Light (Volumetric cyan illumination)
    this.pulsarPointLight = new THREE.PointLight(0x38bdf8, 4.5, 3500, 1.2);
    this.root.add(this.pulsarPointLight);

    // Start with inactive/quiescent state until introduced
    this.root.visible = false;
    this.scene.add(this.root);
  }

  private buildMagneticFluxArcs(): void {
    const arcCount = 8;
    for (let i = 0; i < arcCount; i++) {
      const angle = (i / arcCount) * Math.PI * 2;
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 40, 0), // North magnetic pole
        new THREE.Vector3(Math.cos(angle) * 280, 120, Math.sin(angle) * 280),
        new THREE.Vector3(Math.cos(angle) * 280, -120, Math.sin(angle) * 280),
        new THREE.Vector3(0, -40, 0) // South magnetic pole
      );
      const points = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const arc = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
        })
      );
      this.magneticArcsGroup.add(arc);
    }
  }

  private buildRadiationWaveRings(): void {
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const geo = new THREE.RingGeometry(1, 14, 32);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
        })
      );
      mesh.rotation.x = Math.PI / 2;
      this.radiationWavesGroup.add(mesh);

      this.shockwaveRings.push({
        mesh,
        currentRadius: i * 180,
        maxRadius: 1200,
        speed: 280,
        opacity: 0.0,
      });
    }
  }

  /**
   * Triggers an explosive magnetic flare or radiation pulse
   */
  public triggerMagneticPulse(): void {
    this.magneticPulseActive = true;
    this.magneticPulseProgress = 0.0;
    this.pulsarPointLight.intensity = 12.0;
  }

  public update(dt: number, eventIndex: number, playerPos: THREE.Vector3): NeutronStarTelemetry {
    const delta = Math.max(0, Math.min(dt, 0.1));

    // Introduced starting at Event 22 through Event 100
    const isIntroduced = eventIndex >= 22;
    this.root.visible = isIntroduced;

    if (!isIntroduced) {
      return {
        isActive: false,
        coreBrightness: 0,
        magneticPulseIntensity: 0,
        radiationFieldStrength: 0,
        isFlaring: false,
        distanceToPlayer: 99999,
      };
    }

    // High-frequency relativistic spin
    const spinDelta = delta * this.beamSpinRate;
    this.northBeamMesh.rotation.y += spinDelta;
    this.southBeamMesh.rotation.y += spinDelta;
    this.magneticArcsGroup.rotation.y += delta * 0.8;

    // Beam precession wobble
    const precessAngle = Math.sin(Date.now() * 0.002) * 0.28;
    this.northBeamMesh.rotation.z = precessAngle;
    this.southBeamMesh.rotation.z = -precessAngle;

    // Core surface brightness pulsation
    const pulseFactor = 0.85 + Math.sin(Date.now() * 0.04) * 0.15;
    this.coreMesh.scale.setScalar(pulseFactor);

    // Event-driven flare frequency (escalates in Events 35, 48, 65, 78)
    const isFlaringEvent =
      eventIndex === 28 || eventIndex === 42 || eventIndex === 62 || eventIndex === 76 || eventIndex >= 90;
    if (isFlaringEvent) {
      this.flareTimer += delta;
      if (this.flareTimer > 3.0) {
        this.flareTimer = 0;
        this.triggerMagneticPulse();
      }
    }

    // Handle active magnetic pulse dissipation
    if (this.magneticPulseActive) {
      this.magneticPulseProgress += delta * 1.5;
      if (this.magneticPulseProgress >= 1.0) {
        this.magneticPulseActive = false;
        this.pulsarPointLight.intensity = 4.5;
      } else {
        const falloff = 1.0 - this.magneticPulseProgress;
        this.pulsarPointLight.intensity = 4.5 + falloff * 8.0;
        this.haloMesh.scale.setScalar(1.0 + falloff * 0.8);
      }
    }

    // Update expanding radiation shockwave rings
    this.shockwaveRings.forEach(ring => {
      ring.currentRadius += ring.speed * delta;
      if (ring.currentRadius > ring.maxRadius) {
        ring.currentRadius = 10;
      }
      const normR = ring.currentRadius / ring.maxRadius;
      ring.opacity = (1.0 - normR) * 0.55 * (this.magneticPulseActive ? 1.8 : 1.0);

      const scale = ring.currentRadius / 14;
      ring.mesh.scale.set(scale, scale, 1);
      (ring.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, ring.opacity));
    });

    const distToPlayer = this.root.position.distanceTo(playerPos);
    const radiationStrength = Math.max(0, Math.min(1, (2800 - distToPlayer) / 2800));

    return {
      isActive: true,
      coreBrightness: pulseFactor,
      magneticPulseIntensity: this.magneticPulseActive ? (1.0 - this.magneticPulseProgress) : 0,
      radiationFieldStrength: radiationStrength,
      isFlaring: this.magneticPulseActive,
      distanceToPlayer: distToPlayer,
    };
  }

  public dispose(): void {
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
    this.haloMesh.geometry.dispose();
    (this.haloMesh.material as THREE.Material).dispose();
    this.northBeamMesh.geometry.dispose();
    (this.northBeamMesh.material as THREE.Material).dispose();
    this.southBeamMesh.geometry.dispose();
    (this.southBeamMesh.material as THREE.Material).dispose();
    this.particleStreams.geometry.dispose();
    (this.particleStreams.material as THREE.Material).dispose();
    this.shockwaveRings.forEach(r => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
    this.scene.remove(this.root);
  }
}
