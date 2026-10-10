import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode18SurvivalEliminationBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const orangeWarn = 0xf97316;
    const redElim = 0xef4444;
    const graphite = 0x1e293b;
    const electricBlue = 0x3b82f6;
    const white = 0xffffff;

    const arenaMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: graphite, metalness: 0.9, roughness: 0.3 })
    );
    const redGlowMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: redElim, emissive: redElim, emissiveIntensity: 2.2 })
    );
    const blueSafeMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: electricBlue, emissive: electricBlue, emissiveIntensity: 1.5 })
    );

    // 1. DISTANT FLOATING ELIMINATION ARENA ISLANDS
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 1350;
      const island = new THREE.Mesh(
        this.registerGeo(new THREE.CylinderGeometry(50, 20, 45, 8)),
        arenaMat
      );
      island.position.set(Math.cos(angle) * r, (i % 3) * 60 - 80, Math.sin(angle) * r);
      this.backgroundGroup.add(island);
    }

    // 2. TRACK HEAVY SURVIVAL CRADLES
    this.createTrackSupports(curve, 22, 100, graphite, orangeWarn);
    this.createTracksideBarriers(curve, 32, 18, graphite, redElim);

    // 3. HERO STRUCTURE: CENTRAL ELIMINATION TOWER WITH COUNTDOWN HALO
    const centralTower = new THREE.Group();
    const core = new THREE.Mesh(
      this.registerGeo(new THREE.BoxGeometry(45, 420, 45)),
      arenaMat
    );
    core.position.y = 210;
    centralTower.add(core);

    // Red elimination guillotine ring
    const killRing = new THREE.Mesh(
      this.registerGeo(new THREE.TorusGeometry(65, 3.5, 8, 32)),
      redGlowMat
    );
    killRing.position.y = 280;
    killRing.rotation.x = Math.PI / 2;
    centralTower.add(killRing);

    const centerPt = curve.getPointAt(0.5);
    centralTower.position.copy(centerPt).add(new THREE.Vector3(0, 50, -180));
    this.structuresGroup.add(centralTower);

    this.animators.push({
      mesh: killRing,
      update: (_dt, time) => {
        // Threatening pulse
        const scale = 1.0 + Math.sin(time * 3) * 0.12;
        killRing.scale.set(scale, scale, 1.0);
      },
    });

    // 4. FLOATING SAFE-ZONE SURVIVAL PODS
    for (let s = 0; s < 4; s++) {
      const t = 0.12 + s * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const pod = this.createFloatingPlatform(26, 35, graphite, electricBlue);
      pod.position.copy(pt).addScaledVector(bin, (s % 2 === 0 ? 1 : -1) * 55).add(new THREE.Vector3(0, 20, 0));
      pod.lookAt(pt);
      this.structuresGroup.add(pod);

      const beacon = this.createWarningBeacon(redElim, 25);
      beacon.position.copy(pod.position).add(new THREE.Vector3(0, 8, 0));
      this.propsGroup.add(beacon);
    }

    // 5. HAZARDS: MOVING ELIMINATION BARRIERS
    for (let h = 0; h < 4; h++) {
      const t = 0.18 + h * 0.22;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const killBarrier = new THREE.Group();
      killBarrier.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      killBarrier.lookAt(pt.clone().add(tan));

      const blade = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(22, 1.5, 1.5)), redGlowMat);
      killBarrier.add(blade);

      this.animators.push({
        mesh: blade,
        update: (dt) => {
          blade.rotation.z += dt * 2.5;
        },
      });

      this.hazardsGroup.add(killBarrier);

      this.interactables.push({
        id: `survival_kill_barrier_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: killBarrier,
        onInteract: () => ({
          damage: 20,
          soundKey: 'IMPACT',
          message: 'ELIMINATION ZONE CONTACT!',
        }),
      });
    }
  }
}
