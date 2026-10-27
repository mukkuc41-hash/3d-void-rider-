import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode08SkylineRushBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const gold = 0xf59e0b;
    const cyan = 0x06b6d4;
    const deepBlue = 0x1e3a8a;
    const violet = 0x7c3aed;
    const sunsetOrange = 0xf97316;
    const darkTower = 0x0b1329;

    // 1. DENSE MULTI-TIERED SUNSET SKYLINE (Distant horizon rings)
    this.createDistantCitySkyline(1700, 36, 400, 850, darkTower, sunsetOrange);

    // 2. TALL ELEVATED PYLONS (Supporting rooftop raceways high above lower city)
    this.createTrackSupports(curve, 24, 180, darkTower, gold);
    this.createTracksideBarriers(curve, 36, 18, darkTower, gold);

    // 3. HERO SKYSCRAPERS & ROOFTOP COMPLEXES
    const styles: ('STEPPED' | 'NEEDLE' | 'SPLIT' | 'CURVED' | 'CORPORATE')[] = [
      'STEPPED',
      'CORPORATE',
      'NEEDLE',
      'CURVED',
      'SPLIT',
      'STEPPED',
    ];

    const towerPositions: THREE.Vector3[] = [];

    for (let i = 0; i < styles.length; i++) {
      const t = 0.08 + i * 0.16;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (80 + (i % 3) * 25);

      const pos = pt.clone().addScaledVector(bin, side);
      towerPositions.push(pos);

      const skyscraper = this.createSkyscraper(
        60,
        420 + (i % 3) * 80,
        60,
        styles[i],
        darkTower,
        i % 2 === 0 ? gold : sunsetOrange
      );
      skyscraper.position.copy(pos);
      skyscraper.lookAt(pt);
      this.structuresGroup.add(skyscraper);

      // Rooftop Crane or Antenna
      const crane = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(4, 30, 4)),
        this.registerMat(new THREE.MeshStandardMaterial({ color: sunsetOrange }))
      );
      crane.position.copy(pos).add(new THREE.Vector3(0, 435, 0));
      this.structuresGroup.add(crane);
    }

    // 4. CENTRAL SKYPORT OBSERVATION NEEDLE (Dominant landmark visible from everywhere)
    const skyportNeedle = new THREE.Group();
    const needlePillar = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(14, 32, 650, 16)),
      this.registerMat(new THREE.MeshStandardMaterial({ color: darkTower, metalness: 0.9, roughness: 0.2 }))
    );
    needlePillar.position.y = 325;
    skyportNeedle.add(needlePillar);

    // Giant circular observation disc
    const obsDeck = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(70, 70, 18, 32)),
      this.registerMat(new THREE.MeshStandardMaterial({ color: deepBlue, emissive: gold, emissiveIntensity: 1.5 }))
    );
    obsDeck.position.y = 520;
    skyportNeedle.add(obsDeck);

    // Spire beacon
    const beacon = this.createWarningBeacon(gold, 60);
    beacon.position.y = 540;
    skyportNeedle.add(beacon);

    const centerPt = curve.getPointAt(0.5);
    skyportNeedle.position.copy(centerPt).add(new THREE.Vector3(-160, 0, -220));
    this.structuresGroup.add(skyportNeedle);

    // 5. SKYBRIDGES BETWEEN ROOFTOPS
    for (let b = 0; b < towerPositions.length - 1; b++) {
      const p1 = towerPositions[b].clone().add(new THREE.Vector3(0, 200, 0));
      const p2 = towerPositions[b + 1].clone().add(new THREE.Vector3(0, 200, 0));
      if (p1.distanceTo(p2) < 400) {
        const skybridge = this.createSkybridge(p1, p2, 10, 4, darkTower, sunsetOrange);
        this.structuresGroup.add(skybridge);
      }
    }

    // 6. HAZARDS: ROTATING ROOFTOP CONSTRUCTION CRANE BOOMS
    for (let c = 0; c < 3; c++) {
      const t = 0.22 + c * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const craneRig = new THREE.Group();
      craneRig.position.copy(pt).addScaledVector(bin, (c % 2 === 0 ? 1 : -1) * 20).add(new THREE.Vector3(0, 15, 0));

      const arm = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(22, 1.8, 1.8)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: sunsetOrange }))
      );
      arm.position.x = 11;
      craneRig.add(arm);

      this.animators.push({
        mesh: craneRig,
        update: (dt) => {
          craneRig.rotation.y += dt * 1.5;
        },
      });

      this.hazardsGroup.add(craneRig);

      this.interactables.push({
        id: `skyline_crane_hazard_${c}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: craneRig,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'ROOFTOP CRANE COLLISION!',
        }),
      });
    }
  }
}
