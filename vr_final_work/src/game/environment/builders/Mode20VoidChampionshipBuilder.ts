import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode20VoidChampionshipBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const silver = 0xe2e8f0;
    const deepBlue = 0x1e3a8a;
    const gold = 0xfbbf24;
    const white = 0xffffff;

    const stadiumMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: deepBlue, metalness: 0.9, roughness: 0.2 })
    );
    const goldTrophyMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 2.0, metalness: 0.95, roughness: 0.15 })
    );
    const silverMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: silver, metalness: 0.9, roughness: 0.25 })
    );

    // 1. DISTANT CHAMPIONSHIP STADIUM COLISEUM SKYLINE
    this.createDistantCitySkyline(1600, 32, 350, 750, deepBlue, gold);

    // 2. TRACK GRAND PRIX SUPPORTS & BARRIERS
    this.createTrackSupports(curve, 24, 120, deepBlue, gold);
    this.createTracksideBarriers(curve, 36, 18, silver, gold);

    // 3. HERO STRUCTURE: CENTRAL GRAND PRIX ARENA STADIUM & VICTORY DOME
    const stadium = new THREE.Group();
    // Huge circular grandstands bowl
    const stands = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(160, 110, 80, 32, 1, true)),
      stadiumMat
    );
    stadium.add(stands);

    // Giant championship laurel wreath crown
    const wreath = new THREE.Mesh(
      this.registerGeo(new THREE.TorusGeometry(150, 5, 8, 36)),
      goldTrophyMat
    );
    wreath.position.y = 45;
    wreath.rotation.x = Math.PI / 2;
    stadium.add(wreath);

    const centerPt = curve.getPointAt(0.5);
    stadium.position.copy(centerPt).add(new THREE.Vector3(0, 40, -220));
    this.structuresGroup.add(stadium);

    this.animators.push({
      mesh: wreath,
      update: (dt) => {
        wreath.rotation.z += dt * 0.5;
      },
    });

    // 4. TRIUMPHAL VICTORY ARCHES WITH ROTATING GOLDEN RINGS
    for (let a = 0; a < 4; a++) {
      const t = 0.12 + a * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const archGroup = new THREE.Group();
      archGroup.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      archGroup.lookAt(pt.clone().add(tan));

      const arch = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(32, 3.2, 8, 32, Math.PI)),
        goldTrophyMat
      );
      arch.rotation.z = Math.PI;
      archGroup.add(arch);

      const rotatingRing = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(16, 1.2, 8, 24)),
        silverMat
      );
      rotatingRing.position.y = 32;
      archGroup.add(rotatingRing);

      this.animators.push({
        mesh: rotatingRing,
        update: (dt) => {
          rotatingRing.rotation.z += dt * (a % 2 === 0 ? 1.6 : -1.6);
        },
      });

      this.structuresGroup.add(archGroup);
    }

    // 5. CHAMPIONSHIP SPOTLIGHT SEARCHLIGHT RIGS
    for (let s = 0; s < 4; s++) {
      const t = 0.08 + s * 0.25;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const searchRig = new THREE.Group();
      searchRig.position.copy(pt).addScaledVector(bin, (s % 2 === 0 ? 1 : -1) * 60).add(new THREE.Vector3(0, 35, 0));

      const beam = new THREE.Mesh(
        this.registerGeo(new THREE.ConeGeometry(10, 45, 12)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.45 }))
      );
      beam.position.y = -22;
      searchRig.add(beam);

      this.animators.push({
        mesh: searchRig,
        update: (_dt, time) => {
          searchRig.rotation.y = Math.sin(time * 1.6 + s) * 0.9;
          searchRig.rotation.x = 0.3 + Math.cos(time * 1.3) * 0.2;
        },
      });

      this.structuresGroup.add(searchRig);
    }

    // 6. HAZARDS: ROTATING PRECISION CHAMPIONSHIP GATES
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Group();
      gate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      gate.lookAt(pt.clone().add(tan));

      const arm = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(22, 1.5, 1.5)), goldTrophyMat);
      gate.add(arm);

      this.animators.push({
        mesh: arm,
        update: (dt) => {
          arm.rotation.z += dt * 2.2;
        },
      });

      this.hazardsGroup.add(gate);

      this.interactables.push({
        id: `champ_gate_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: gate,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'CHAMPIONSHIP PRECISION GATE IMPACT!',
        }),
      });
    }
  }
}
