import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode07PlasmaStormBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const purple = 0x9333ea;
    const plasmaBlue = 0x3b82f6;
    const magenta = 0xd946ef;
    const hotPink = 0xf43f5e;
    const cyan = 0x06b6d4;
    const darkMetal = 0x0f172a;

    const metalMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: darkMetal, metalness: 0.9, roughness: 0.3 })
    );
    const plasmaMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: purple, emissive: magenta, emissiveIntensity: 2.8, roughness: 0.1 })
    );
    const coilMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: cyan, emissiveIntensity: 1.8, metalness: 0.9 })
    );
    const arcMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: hotPink, wireframe: true, transparent: true, opacity: 0.8 })
    );

    // 1. DISTANT PLASMA STORMS & CONTAINMENT TOWERS
    this.createDistantCitySkyline(1500, 28, 300, 600, darkMetal, magenta);

    // 2. TRACK HEAVY INDUSTRIAL SUPPORTS & CONDUITS
    this.createTrackSupports(curve, 22, 110, darkMetal, cyan);
    this.createTracksideBarriers(curve, 32, 18, darkMetal, purple);

    // 3. HERO STRUCTURE: CENTRAL PLASMA GENERATION REACTOR
    const centralReactor = new THREE.Group();
    const core = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(35, 45, 180, 16)), plasmaMat);
    centralReactor.add(core);

    // Giant magnetic containment toroidal coils
    for (let c = 0; c < 4; c++) {
      const coil = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(62, 3.8, 8, 32)), coilMat);
      coil.position.y = -60 + c * 40;
      coil.rotation.x = Math.PI / 2;
      centralReactor.add(coil);

      this.animators.push({
        mesh: coil,
        update: (dt) => {
          coil.rotation.z += dt * (c % 2 === 0 ? 0.9 : -0.9);
        },
      });
    }

    const centerPt = curve.getPointAt(0.5);
    centralReactor.position.copy(centerPt).add(new THREE.Vector3(120, 60, -220));
    this.structuresGroup.add(centralReactor);

    // 4. PLASMA REACTOR TOWERS WITH MAGNETIC ARC CROWNS
    for (let i = 0; i < 5; i++) {
      const t = 0.1 + i * 0.18;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const tower = new THREE.Group();
      tower.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 80).add(new THREE.Vector3(0, 50, 0));

      const stack = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(8, 12, 130, 10)), metalMat);
      tower.add(stack);

      // Arc generator ring at top
      const arcRing = new THREE.Mesh(this.registerGeo(new THREE.TorusGeometry(20, 2, 6, 20)), arcMat);
      arcRing.position.y = 70;
      tower.add(arcRing);

      this.animators.push({
        mesh: arcRing,
        update: (dt) => {
          arcRing.rotation.y += dt * 1.5;
        },
      });

      this.structuresGroup.add(tower);
    }

    // 5. THICK INDUSTRIAL ENERGY PIPELINES
    for (let p = 0; p < 4; p++) {
      const t = 0.15 + p * 0.24;
      const pt = curve.getPointAt(t);
      const pipe = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(3.5, 3.5, 110, 8)), coilMat);
      pipe.position.copy(pt).add(new THREE.Vector3((p % 2 === 0 ? 1 : -1) * 45, 15, 0));
      pipe.rotation.z = Math.PI / 2;
      this.structuresGroup.add(pipe);
    }

    // 6. HAZARDS: ELECTRICAL PLASMA ARCS & BURST GATES
    for (let h = 0; h < 3; h++) {
      const t = 0.2 + h * 0.32;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const arcGate = new THREE.Group();
      arcGate.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      arcGate.lookAt(pt.clone().add(tan));

      const arcSphere = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(6, 12, 12)), plasmaMat);
      arcGate.add(arcSphere);

      this.animators.push({
        mesh: arcSphere,
        update: (_dt, time) => {
          const pulse = 1.0 + 0.5 * Math.sin(time * 8 + h * 2);
          arcSphere.scale.setScalar(pulse);
        },
      });

      this.hazardsGroup.add(arcGate);

      this.interactables.push({
        id: `plasma_arc_hazard_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: arcGate,
        onInteract: () => ({
          damage: 16,
          soundKey: 'IMPACT',
          message: 'PLASMA ARC DISCHARGE!',
        }),
      });
    }
  }
}
