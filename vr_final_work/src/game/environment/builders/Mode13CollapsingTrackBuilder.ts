import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode13CollapsingTrackBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const darkSteel = 0x1c1917;
    const concreteGray = 0x64748b;
    const warningOrange = 0xf97316;
    const emergencyRed = 0xef4444;
    const cyan = 0x06b6d4;

    const concreteMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: concreteGray, roughness: 0.9 })
    );
    const steelMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: darkSteel, metalness: 0.9, roughness: 0.5 })
    );
    const warnMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: warningOrange })
    );
    const redMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: emergencyRed })
    );

    // 1. DISTANT CRUMBLING TOWER SILHOUETTES
    this.createDistantCitySkyline(1500, 26, 260, 520, darkSteel, emergencyRed);

    // 2. TRACK FRACTURED AND CRACKED SUPPORTS
    this.createTrackSupports(curve, 20, 100, darkSteel, warningOrange);
    this.createTracksideBarriers(curve, 30, 18, concreteGray, warningOrange);

    // 3. HERO STRUCTURE: LEANING FRACTURED MEGA-TOWER
    const leaningTower = new THREE.Group();
    const towerCore = new THREE.Mesh(
      this.registerGeo(new THREE.BoxGeometry(60, 360, 60)),
      concreteMat
    );
    towerCore.position.y = 180;
    leaningTower.add(towerCore);

    // Exposed rebar and structural beams sticking out
    for (let r = 0; r < 8; r++) {
      const beam = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(4, 40, 4)), steelMat);
      beam.position.set((r % 2 === 0 ? 32 : -32), 60 + r * 30, (r % 3) * 15 - 15);
      beam.rotation.z = (r % 2 === 0 ? 0.3 : -0.3);
      leaningTower.add(beam);
    }

    // Leaning at an alarming angle
    leaningTower.rotation.z = 0.22;
    leaningTower.rotation.x = -0.15;

    const centerPt = curve.getPointAt(0.5);
    leaningTower.position.copy(centerPt).add(new THREE.Vector3(140, 0, -180));
    this.structuresGroup.add(leaningTower);

    // 4. CRACKED CATWALKS & SUSPENDED ROAD PLATES
    for (let c = 0; c < 4; c++) {
      const t = 0.12 + c * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const plate = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(35, 3, 25)),
        concreteMat
      );
      plate.position.copy(pt).addScaledVector(bin, (c % 2 === 0 ? 1 : -1) * 45).add(new THREE.Vector3(0, 20, 0));
      plate.rotation.set(0.2, 0.4, 0.15);
      this.structuresGroup.add(plate);

      const beacon = this.createWarningBeacon(emergencyRed, 20);
      beacon.position.copy(plate.position).add(new THREE.Vector3(0, 6, 0));
      this.propsGroup.add(beacon);
    }

    // 5. HAZARDS: TILTING AND COLLAPSING ROADWAY FRAGMENTS
    for (let h = 0; h < 4; h++) {
      const t = 0.16 + h * 0.22;
      const pt = curve.getPointAt(t);

      const slab = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(14, 2, 10)),
        warnMat
      );
      slab.position.copy(pt).add(new THREE.Vector3((h % 2 === 0 ? 1 : -1) * 10, 4, 0));

      this.animators.push({
        mesh: slab,
        update: (_dt, time) => {
          slab.rotation.z = Math.sin(time * 3 + h) * 0.25;
          slab.position.y = pt.y + 4 + Math.cos(time * 2.5 + h) * 3;
        },
      });

      this.hazardsGroup.add(slab);

      this.interactables.push({
        id: `collapsing_slab_${h}`,
        type: 'HAZARD',
        position: slab.position,
        radius: 7,
        mesh: slab,
        onInteract: () => ({
          damage: 16,
          soundKey: 'IMPACT',
          message: 'COLLAPSED ROADWAY IMPACT!',
        }),
      });
    }
  }
}
