import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode04WormholeExpressBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const indigo = 0x1e1b4b;
    const violet = 0x7c3aed;
    const cyan = 0x06b6d4;
    const turquoise = 0x14b8a6;
    const whiteEnergy = 0xe0f2fe;

    const ringMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: violet, emissive: cyan, emissiveIntensity: 2.2, roughness: 0.2, metalness: 0.85 })
    );
    const frameMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: indigo, metalness: 0.9, roughness: 0.3 })
    );
    const energyMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: whiteEnergy, wireframe: true, transparent: true, opacity: 0.85 })
    );

    // 1. DISTANT WORMHOLE RIFT GATEWAY COMPLEXES
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 1400;
      const riftRing = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(120, 8, 8, 32)),
        ringMat
      );
      riftRing.position.set(Math.cos(angle) * dist, (i % 3) * 120, Math.sin(angle) * dist);
      riftRing.rotation.y = angle;
      this.backgroundGroup.add(riftRing);

      this.animators.push({
        mesh: riftRing,
        update: (dt) => {
          riftRing.rotation.z += dt * (i % 2 === 0 ? 0.3 : -0.3);
        },
      });
    }

    // 2. TRACK STRUCTURAL ENERGY CRADLES
    this.createTrackSupports(curve, 22, 110, indigo, cyan);

    // 3. HERO STRUCTURE: CENTRAL WORMHOLE STATION (Massive 3-ring gyroscope portal)
    const centralStation = new THREE.Group();
    const ring1 = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(75, 4, 12, 36)), ringMat);
    const ring2 = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(58, 3, 10, 32)), energyMat);
    const ring3 = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(42, 2.5, 8, 28)), ringMat);
    const core = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(18, 16, 16)), energyMat);

    centralStation.add(ring1, ring2, ring3, core);
    const centerPt = curve.getPointAt(0.5);
    centralStation.position.copy(centerPt).add(new THREE.Vector3(0, 110, -180));
    this.structuresGroup.add(centralStation);

    this.animators.push({
      mesh: centralStation,
      update: (dt) => {
        ring1.rotation.x += dt * 0.8;
        ring2.rotation.y += dt * 1.2;
        ring3.rotation.z += dt * 1.6;
      },
    });

    // 4. TRANSIT ACCELERATION GATEWAY RINGS STRUNG ALONG THE TRACK
    const gateCount = 8;
    for (let i = 0; i < gateCount; i++) {
      const t = (0.06 + i * (1.0 / gateCount)) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Group();
      gate.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      gate.lookAt(pt.clone().add(tan));

      // Outer hexagonal frame
      const hexRing = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(32, 2.5, 6, 6)),
        frameMat
      );
      // Inner glowing plasma vortex
      const innerRing = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(26, 1.8, 8, 24)),
        ringMat
      );

      gate.add(hexRing, innerRing);

      // Support pylons holding the ring
      const pylonL = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(2, 3, 35, 8)), frameMat);
      pylonL.position.set(-28, -12, 0);
      const pylonR = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(2, 3, 35, 8)), frameMat);
      pylonR.position.set(28, -12, 0);
      gate.add(pylonL, pylonR);

      this.animators.push({
        mesh: innerRing,
        update: (dt) => {
          innerRing.rotation.z += dt * (i % 2 === 0 ? 1.5 : -1.5);
        },
      });

      this.structuresGroup.add(gate);
    }

    // 5. SUSPENDED MAINTENANCE PLATFORMS & CALIBRATION TOWERS
    for (let m = 0; m < 4; m++) {
      const t = 0.15 + m * 0.25;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const calTower = new THREE.Mesh(
        this.registerGeo(new THREE.CylinderGeometry(4, 8, 140, 8)),
        frameMat
      );
      calTower.position.copy(pt).addScaledVector(bin, (m % 2 === 0 ? 1 : -1) * 75).add(new THREE.Vector3(0, 50, 0));
      this.structuresGroup.add(calTower);

      const beacon = this.createWarningBeacon(turquoise, 25);
      beacon.position.copy(calTower.position).add(new THREE.Vector3(0, 75, 0));
      this.structuresGroup.add(beacon);
    }

    // 6. HAZARDS: MOVING SUBSPACE ENERGY DISTORTION BARRIERS
    for (let h = 0; h < 3; h++) {
      const t = 0.24 + h * 0.32;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const barrier = new THREE.Group();
      barrier.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      barrier.lookAt(pt.clone().add(tan));

      const bladeGeo = this.registerGeo(new THREE.BoxGeometry(22, 1.5, 1.5));
      const bladeMat = this.registerMat(new THREE.MeshBasicMaterial({ color: cyan }));
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      barrier.add(blade);

      this.animators.push({
        mesh: blade,
        update: (dt) => {
          blade.rotation.z += dt * 2.5;
        },
      });

      this.hazardsGroup.add(barrier);

      this.interactables.push({
        id: `wormhole_barrier_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: barrier,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'SUBSPACE DISTORTION IMPACT!',
        }),
      });
    }
  }
}
