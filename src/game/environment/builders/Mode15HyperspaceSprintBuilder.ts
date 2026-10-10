import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode15HyperspaceSprintBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const cyan = 0x00f0ff;
    const indigo = 0x1e1b4b;
    const violet = 0x7c3aed;
    const white = 0xffffff;
    const magenta = 0xd946ef;

    const frameMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: indigo, metalness: 0.9, roughness: 0.25 })
    );
    const cyanGlowMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: cyan })
    );
    const whiteSpeedMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: white })
    );

    // 1. REPEATING HYPERSPACE CORRIDOR FRAMES ENCLOSING THE TRACK (High density for speed perception)
    const frameCount = 28;
    for (let f = 0; f < frameCount; f++) {
      const t = (f / frameCount) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const tunnelRib = new THREE.Group();
      tunnelRib.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      tunnelRib.lookAt(pt.clone().add(tan));

      // Hexagonal hyper-tube frame
      const rib = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(26, 1.4, 6, 6)),
        f % 4 === 0 ? cyanGlowMat : frameMat
      );
      tunnelRib.add(rib);

      // Energy chevron markers on the side
      const chevronL = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(0.8, 4, 1.2)),
        whiteSpeedMat
      );
      chevronL.position.set(-24, 0, 0);
      const chevronR = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(0.8, 4, 1.2)),
        whiteSpeedMat
      );
      chevronR.position.set(24, 0, 0);
      tunnelRib.add(chevronL, chevronR);

      this.structuresGroup.add(tunnelRib);
    }

    // 2. HERO MONUMENTAL WARP GATE ARRAYS
    for (let g = 0; g < 4; g++) {
      const t = 0.12 + g * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const warpArch = new THREE.Group();
      warpArch.position.copy(pt).add(new THREE.Vector3(0, 12, 0));
      warpArch.lookAt(pt.clone().add(tan));

      const archFrame = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(38, 3.5, 8, 32)),
        frameMat
      );
      warpArch.add(archFrame);

      const holoRings = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(32, 1.5, 8, 24)),
        cyanGlowMat
      );
      warpArch.add(holoRings);

      this.animators.push({
        mesh: holoRings,
        update: (dt) => {
          holoRings.rotation.z += dt * (g % 2 === 0 ? 2.5 : -2.5);
        },
      });

      this.structuresGroup.add(warpArch);
    }

    // 3. HAZARDS: NARROWING HYPERSPACE SPEED-SENSITIVE GATES
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const speedGate = new THREE.Group();
      speedGate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      speedGate.lookAt(pt.clone().add(tan));

      const gateBar = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(20, 1.2, 1.2)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: magenta }))
      );
      speedGate.add(gateBar);

      this.animators.push({
        mesh: gateBar,
        update: (dt) => {
          gateBar.rotation.z += dt * 3.0;
        },
      });

      this.hazardsGroup.add(speedGate);

      this.interactables.push({
        id: `hyperspace_gate_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: speedGate,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'HYPERSPACE VELOCITY GATE CLIPPING!',
        }),
      });
    }
  }
}
