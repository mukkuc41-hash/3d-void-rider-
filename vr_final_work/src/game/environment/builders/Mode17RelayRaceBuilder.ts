import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode17RelayRaceBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const cyan = 0x06b6d4;
    const gold = 0xf59e0b;
    const greenEnergy = 0x10b981;
    const deepBlue = 0x1e3a8a;
    const white = 0xffffff;

    const towerMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: deepBlue, metalness: 0.9, roughness: 0.25 })
    );
    const relayGreenMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: greenEnergy, emissive: greenEnergy, emissiveIntensity: 2.2 })
    );
    const goldMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: gold, metalness: 0.85, roughness: 0.2 })
    );

    // 1. DISTANT RELAY TRANSMISSION NETWORK (Grid of tall transmission needles)
    this.createDistantCitySkyline(1500, 24, 280, 560, deepBlue, greenEnergy);

    // 2. TRACK ENERGY CONDUIT SUPPORTS
    this.createTrackSupports(curve, 22, 100, deepBlue, cyan);
    this.createTracksideBarriers(curve, 32, 18, deepBlue, greenEnergy);

    // 3. HERO STRUCTURE: CENTRAL ORBITAL RELAY TRANSMISSION HUB
    const centralHub = new THREE.Group();
    const spire = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(12, 28, 450, 12)),
      towerMat
    );
    spire.position.y = 225;
    centralHub.add(spire);

    // 3 Handoff energy rings around spire
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(45, 2.8, 8, 32)),
        relayGreenMat
      );
      ring.position.y = 120 + r * 90;
      ring.rotation.x = Math.PI / 2;
      centralHub.add(ring);

      this.animators.push({
        mesh: ring,
        update: (dt) => {
          ring.rotation.z += dt * (r % 2 === 0 ? 0.8 : -0.8);
        },
      });
    }

    const centerPt = curve.getPointAt(0.5);
    centralHub.position.copy(centerPt).add(new THREE.Vector3(120, 0, -200));
    this.structuresGroup.add(centralHub);

    // 4. SECTOR HANDOFF GATES (Designated ship baton exchange gates)
    const handoffPoints = [0.25, 0.5, 0.75];
    for (let h = 0; h < handoffPoints.length; h++) {
      const t = handoffPoints[h];
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Group();
      gate.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      gate.lookAt(pt.clone().add(tan));

      const arch = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(32, 3, 8, 28)),
        towerMat
      );
      gate.add(arch);

      const field = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(26, 1.5, 8, 20)),
        relayGreenMat
      );
      gate.add(field);

      this.animators.push({
        mesh: field,
        update: (dt) => {
          field.rotation.z += dt * 1.5;
        },
      });

      this.structuresGroup.add(gate);
    }

    // 5. HAZARDS: MOVING RELAY SYNCHRONIZATION BARRIERS
    for (let b = 0; b < 3; b++) {
      const t = 0.15 + b * 0.32;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const barrier = new THREE.Group();
      barrier.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      barrier.lookAt(pt.clone().add(tan));

      const arm = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(22, 1.4, 1.4)), goldMat);
      barrier.add(arm);

      this.animators.push({
        mesh: arm,
        update: (dt) => {
          arm.rotation.z += dt * 2.0;
        },
      });

      this.hazardsGroup.add(barrier);

      this.interactables.push({
        id: `relay_barrier_${b}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: barrier,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'RELAY SYNCHRONIZATION FIELD DISTORTION!',
        }),
      });
    }
  }
}
