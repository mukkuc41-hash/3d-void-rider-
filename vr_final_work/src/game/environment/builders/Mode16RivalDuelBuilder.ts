import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode16RivalDuelBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const duelRed = 0xef4444;
    const duelBlue = 0x3b82f6;
    const graphite = 0x1e293b;
    const white = 0xffffff;
    const metalSilver = 0xcbd5e1;

    const arenaHullMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: graphite, metalness: 0.9, roughness: 0.25 })
    );
    const redZoneMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: duelRed, emissive: duelRed, emissiveIntensity: 1.8 })
    );
    const blueZoneMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: duelBlue, emissive: duelBlue, emissiveIntensity: 1.8 })
    );

    // 1. DISTANT COLOSSEUM ARENA TOWERS & SPECTATOR STANDS
    this.createDistantCitySkyline(1600, 30, 320, 650, graphite, duelBlue);

    // 2. TRACK ARENA RIGGING SUPPORTS (Alternating Red/Blue team zones)
    this.createTrackSupports(curve, 22, 110, graphite, duelRed);
    this.createTracksideBarriers(curve, 32, 18, graphite, duelBlue);

    // 3. HERO STRUCTURE: CENTRAL DUEL STADIUM COLISEUM LANDMARK
    const centralArena = new THREE.Group();
    const bowl = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(140, 90, 80, 24, 1, true)),
      arenaHullMat
    );
    centralArena.add(bowl);

    // Duel Halo Ring on top
    const halo = new THREE.Mesh(
      this.registerGeo(new THREE.TorusGeometry(135, 4, 8, 36)),
      blueZoneMat
    );
    halo.position.y = 40;
    halo.rotation.x = Math.PI / 2;
    centralArena.add(halo);

    const centerPt = curve.getPointAt(0.5);
    centralArena.position.copy(centerPt).add(new THREE.Vector3(0, 40, -180));
    this.structuresGroup.add(centralArena);

    // 4. OBSERVATION GANTRIES & OVERHEAD SPOTLIGHT RIGS
    for (let g = 0; g < 4; g++) {
      const t = 0.12 + g * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gantry = new THREE.Group();
      gantry.position.copy(pt).add(new THREE.Vector3(0, 14, 0));
      gantry.lookAt(pt.clone().add(tan));

      const arch = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(32, 4, 6)),
        g % 2 === 0 ? redZoneMat : blueZoneMat
      );
      arch.position.y = 12;
      gantry.add(arch);

      // Spotlights pointing down
      const spot = new THREE.Mesh(
        this.registerGeo(new THREE.ConeGeometry(5, 16, 8)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: white, transparent: true, opacity: 0.4 }))
      );
      spot.position.set(0, 6, 0);
      spot.rotation.x = Math.PI;
      gantry.add(spot);

      this.structuresGroup.add(gantry);
    }

    // 5. HAZARDS: MOVING TACTICAL ROUTE BARRIERS
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const barrierGate = new THREE.Group();
      barrierGate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      barrierGate.lookAt(pt.clone().add(tan));

      const arm = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(22, 1.4, 1.4)),
        redZoneMat
      );
      barrierGate.add(arm);

      this.animators.push({
        mesh: arm,
        update: (dt) => {
          arm.rotation.z += dt * 2.2;
        },
      });

      this.hazardsGroup.add(barrierGate);

      this.interactables.push({
        id: `duel_barrier_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: barrierGate,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'DUEL ARENA DEFENSE GATE IMPACT!',
        }),
      });
    }
  }
}
