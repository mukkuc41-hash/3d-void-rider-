import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode14RingRunnerBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const silver = 0xe2e8f0;
    const deepBlue = 0x1e3a8a;
    const cyan = 0x06b6d4;
    const violet = 0x7c3aed;
    const gold = 0xf59e0b;

    const silverMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: silver, metalness: 0.95, roughness: 0.15 })
    );
    const blueMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: deepBlue, metalness: 0.85, roughness: 0.3 })
    );
    const cyanRingMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: cyan, emissive: cyan, emissiveIntensity: 2.2 })
    );
    const goldMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: gold, metalness: 0.9, roughness: 0.2 })
    );

    // 1. DISTANT PLANETARY ORBITAL RINGS
    const planetMesh = new THREE.Mesh(
      this.registerGeo(new THREE.SphereGeometry(450, 32, 32)),
      this.registerMat(new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.8 }))
    );
    planetMesh.position.set(0, -600, -2200);
    this.skyGroup.add(planetMesh);

    // 2. TRACK SUSPENDED MAGNETIC CRADLES
    this.createTrackSupports(curve, 22, 100, deepBlue, cyan);
    this.createTracksideBarriers(curve, 32, 18, silver, cyan);

    // 3. HERO STRUCTURE: CENTRAL CONCENTRIC ORBITAL RING COMPLEX
    const ringComplex = new THREE.Group();
    const ringRadii = [80, 120, 160];
    for (let r = 0; r < ringRadii.length; r++) {
      const radius = ringRadii[r];
      const ring = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(radius, 3.5, 8, 36)),
        r % 2 === 0 ? cyanRingMat : goldMat
      );
      ringComplex.add(ring);

      this.animators.push({
        mesh: ring,
        update: (dt) => {
          ring.rotation.z += dt * (r % 2 === 0 ? 0.4 : -0.4);
          ring.rotation.x += dt * 0.15;
        },
      });
    }

    const centerPt = curve.getPointAt(0.5);
    ringComplex.position.copy(centerPt).add(new THREE.Vector3(0, 80, -180));
    this.structuresGroup.add(ringComplex);

    // 4. LARGE ROTATING ORBITAL PASS-THROUGH HOOPS ENCIRCLING THE TRACK
    for (let h = 0; h < 6; h++) {
      const t = 0.08 + h * 0.16;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const hoopGroup = new THREE.Group();
      hoopGroup.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      hoopGroup.lookAt(pt.clone().add(tan));

      const hoop = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(28, 2.2, 8, 28)),
        silverMat
      );
      hoopGroup.add(hoop);

      // Rotating inner locator ring
      const innerLoc = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(20, 1.2, 8, 20)),
        cyanRingMat
      );
      hoopGroup.add(innerLoc);

      this.animators.push({
        mesh: innerLoc,
        update: (dt) => {
          innerLoc.rotation.z += dt * (h % 2 === 0 ? 1.4 : -1.4);
        },
      });

      this.structuresGroup.add(hoopGroup);
    }

    // 5. HAZARDS: ROTATING GAP SECTION MISALIGNMENTS
    for (let g = 0; g < 3; g++) {
      const t = 0.22 + g * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gapHazard = new THREE.Group();
      gapHazard.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      gapHazard.lookAt(pt.clone().add(tan));

      const arm = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(22, 1.5, 1.5)), goldMat);
      gapHazard.add(arm);

      this.animators.push({
        mesh: arm,
        update: (dt) => {
          arm.rotation.z += dt * 2.0;
        },
      });

      this.hazardsGroup.add(gapHazard);

      this.interactables.push({
        id: `ring_gap_hazard_${g}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: gapHazard,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'ORBITAL RING ALIGNMENT IMPACT!',
        }),
      });
    }
  }
}
