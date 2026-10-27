import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode06GravityFreeBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const coolBlue = 0x3b82f6;
    const cyan = 0x06b6d4;
    const silver = 0xe2e8f0;
    const white = 0xffffff;
    const violet = 0xa855f7;
    const darkHull = 0x0f172a;

    const silverMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: silver, metalness: 0.9, roughness: 0.2 })
    );
    const labHullMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: darkHull, metalness: 0.8, roughness: 0.3 })
    );
    const cyanFieldMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: cyan, wireframe: true, transparent: true, opacity: 0.75 })
    );
    const gravRingMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: coolBlue, emissive: cyan, emissiveIntensity: 2.0, metalness: 0.85 })
    );

    // 1. DISTANT SUSPENDED ORBITAL RESEARCH MODULES (Varied Multi-Axis Rotations)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 1300 + (i % 4) * 120;
      const moduleGroup = new THREE.Group();
      const pod = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(20, 20, 70, 12)), labHullMat);
      const dome = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(22, 12, 12)), silverMat);
      dome.position.y = 40;
      moduleGroup.add(pod, dome);

      moduleGroup.position.set(Math.cos(angle) * r, (i % 5) * 80 - 150, Math.sin(angle) * r);
      moduleGroup.rotation.set(i * 0.5, i * 0.3, i * 0.8);
      this.backgroundGroup.add(moduleGroup);

      this.animators.push({
        mesh: moduleGroup,
        update: (dt) => {
          moduleGroup.rotation.x += dt * 0.2;
          moduleGroup.rotation.y += dt * 0.3;
        },
      });
    }

    // 2. TRACK MAGNETIC LEVITATION SUPPORTS
    this.createTrackSupports(curve, 20, 90, darkHull, coolBlue);

    // 3. HERO STRUCTURE: CENTRAL ZERO-G RESEARCH LAB MEGACENTER
    const centralLab = new THREE.Group();
    const labCore = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(55, 24, 24)), silverMat);
    centralLab.add(labCore);

    // Giant counter-rotating gravity simulation rings
    const ringA = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(85, 3.5, 8, 36)), gravRingMat);
    const ringB = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(105, 3.5, 8, 36)), gravRingMat);
    ringA.rotation.x = Math.PI / 3;
    ringB.rotation.z = Math.PI / 4;
    centralLab.add(ringA, ringB);

    const centerPt = curve.getPointAt(0.5);
    centralLab.position.copy(centerPt).add(new THREE.Vector3(0, 120, -160));
    this.structuresGroup.add(centralLab);

    this.animators.push({
      mesh: centralLab,
      update: (dt) => {
        ringA.rotation.y += dt * 0.7;
        ringB.rotation.x -= dt * 0.5;
      },
    });

    // 4. SCIENTIFIC OBSERVATION TOWERS WITH DOCKING COLLARS
    for (let s = 0; s < 4; s++) {
      const t = 0.12 + s * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const tower = new THREE.Group();
      tower.position.copy(pt).addScaledVector(bin, (s % 2 === 0 ? 1 : -1) * 80).add(new THREE.Vector3(0, 40, 0));

      const mast = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(5, 7, 120, 12)), labHullMat);
      tower.add(mast);

      // Observation deck bubble
      const deck = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(22, 16, 12)), silverMat);
      deck.position.y = 65;
      tower.add(deck);

      // Docking collar ring
      const collar = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(14, 1.8, 8, 20)), cyanFieldMat);
      collar.position.set(0, 65, 24);
      collar.rotation.y = Math.PI / 2;
      tower.add(collar);

      this.structuresGroup.add(tower);
    }

    // 5. MODULAR FLOATING LAB PLATFORMS (Drifting gently with Zero-G inertia)
    for (let p = 0; p < 6; p++) {
      const t = 0.08 + p * 0.16;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const plat = this.createFloatingPlatform(26, 32, darkHull, cyan);
      plat.position.copy(pt).addScaledVector(bin, (p % 2 === 0 ? 1 : -1) * 50).add(new THREE.Vector3(0, 18, 0));
      plat.lookAt(pt);

      this.animators.push({
        mesh: plat,
        update: (_dt, time) => {
          plat.position.y = pt.y + 18 + Math.sin(time * 1.5 + p) * 6;
          plat.rotation.z = Math.cos(time * 1.2 + p) * 0.08;
        },
      });

      this.sceneryGroup.add(plat);
    }

    // 6. HAZARDS: ROTATING GRAVITY FORCE PYLONS
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.32;
      const pt = curve.getPointAt(t);

      const pylonGroup = new THREE.Group();
      pylonGroup.position.copy(pt).add(new THREE.Vector3(0, 8, 0));

      const ring = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(18, 1.4, 8, 24)), gravRingMat);
      pylonGroup.add(ring);

      this.animators.push({
        mesh: ring,
        update: (dt) => {
          ring.rotation.x += dt * 1.8;
          ring.rotation.y += dt * 2.2;
        },
      });

      this.hazardsGroup.add(pylonGroup);

      this.interactables.push({
        id: `grav_pylon_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: pylonGroup,
        onInteract: () => ({
          damage: 12,
          soundKey: 'ALARM',
          message: 'ZERO-G GRAVITY FIELD DISTORTION!',
        }),
      });
    }
  }
}
