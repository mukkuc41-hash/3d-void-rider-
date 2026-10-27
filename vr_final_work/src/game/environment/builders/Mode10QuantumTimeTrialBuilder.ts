import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode10QuantumTimeTrialBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const white = 0xffffff;
    const silver = 0xe2e8f0;
    const cyan = 0x06b6d4;
    const deepBlue = 0x1e3a8a;
    const magenta = 0xd946ef;

    const whiteMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: white, roughness: 0.1, metalness: 0.9 })
    );
    const deepMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: deepBlue, metalness: 0.9, roughness: 0.3 })
    );
    const chronoLaserMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: cyan })
    );
    const magentaHoloMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: magenta, wireframe: true })
    );

    // 1. DISTANT CLEAN GEOMETRIC RESEARCH SPHERES & CALIBRATION FRAMES
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 1400;
      const frame = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(70, 70, 70)),
        i % 2 === 0 ? magentaHoloMat : deepMat
      );
      frame.position.set(Math.cos(angle) * r, (i % 4) * 80 - 100, Math.sin(angle) * r);
      frame.rotation.set(i * 0.3, i * 0.4, 0);
      this.backgroundGroup.add(frame);
    }

    // 2. TRACK ULTRA-PRECISION SUPPORTS
    this.createTrackSupports(curve, 24, 90, deepBlue, cyan);
    this.createTracksideBarriers(curve, 36, 18, white, cyan);

    // 3. HERO STRUCTURE: CENTRAL CHRONO MEASUREMENT TOWER (Massive digital monolith)
    const centralChrono = new THREE.Group();
    const towerCore = new THREE.Mesh(
      this.registerGeo(new THREE.BoxGeometry(45, 500, 45)),
      whiteMat
    );
    centralChrono.add(towerCore);

    // Holographic digital split timer rings
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(38, 1.5, 8, 32)),
        chronoLaserMat
      );
      ring.position.y = -100 + r * 75;
      ring.rotation.x = Math.PI / 2;
      centralChrono.add(ring);

      this.animators.push({
        mesh: ring,
        update: (dt) => {
          ring.rotation.z += dt * (r % 2 === 0 ? 1.2 : -1.2);
        },
      });
    }

    const centerPt = curve.getPointAt(0.5);
    centralChrono.position.copy(centerPt).add(new THREE.Vector3(0, 150, -180));
    this.structuresGroup.add(centralChrono);

    // 4. PRECISION SPLIT-TIMING GATES
    const gatePoints = [0.15, 0.35, 0.65, 0.85];
    for (let g = 0; g < gatePoints.length; g++) {
      const t = gatePoints[g];
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const splitGate = new THREE.Group();
      splitGate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      splitGate.lookAt(pt.clone().add(tan));

      const arch = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(26, 14, 3)),
        deepMat
      );
      arch.position.y = 7;
      splitGate.add(arch);

      const holoField = new THREE.Mesh(
        this.registerGeo(new THREE.PlaneGeometry(22, 10)),
        chronoLaserMat
      );
      holoField.position.set(0, 7, 0.5);
      splitGate.add(holoField);

      this.structuresGroup.add(splitGate);
    }

    // 5. HAZARDS: ROTATING PRECISION CALIBRATION BLADES
    for (let b = 0; b < 3; b++) {
      const t = 0.25 + b * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const bladeGate = new THREE.Group();
      bladeGate.position.copy(pt).add(new THREE.Vector3(0, 6, 0));
      bladeGate.lookAt(pt.clone().add(tan));

      const blade = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(18, 1.2, 1.2)),
        magentaHoloMat
      );
      bladeGate.add(blade);

      this.animators.push({
        mesh: blade,
        update: (dt) => {
          blade.rotation.z += dt * 2.0;
        },
      });

      this.hazardsGroup.add(bladeGate);

      this.interactables.push({
        id: `chrono_blade_${b}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: bladeGate,
        onInteract: () => ({
          damage: 12,
          soundKey: 'IMPACT',
          message: 'CHRONO GATE APEX TIME PENALTY!',
        }),
      });
    }
  }
}
