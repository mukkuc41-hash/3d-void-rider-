import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode12DroneAssaultBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const graphite = 0x1e293b;
    const darkBlue = 0x0f172a;
    const orange = 0xf97316;
    const redLight = 0xef4444;
    const cyanRadar = 0x06b6d4;

    const militaryMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: graphite, metalness: 0.85, roughness: 0.4 })
    );
    const orangeGlowMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: orange })
    );
    const radarMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: cyanRadar, wireframe: true })
    );

    // 1. DISTANT MILITARY DEFENSE TOWERS
    this.createDistantCitySkyline(1600, 26, 280, 580, darkBlue, orange);

    // 2. TRACK MILITARY BARRICADE SUPPORTS
    this.createTrackSupports(curve, 22, 100, graphite, orange);
    this.createTracksideBarriers(curve, 32, 18, graphite, redLight);

    // 3. HERO STRUCTURE: CENTRAL DRONE COMMAND FLIGHT CONTROL TOWER
    const commandTower = new THREE.Group();
    const towerCore = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(18, 30, 320, 12)),
      militaryMat
    );
    towerCore.position.y = 160;
    commandTower.add(towerCore);

    // Huge 360-degree radar dish
    const radarDish = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(45, 10, 15, 24, 1, true)),
      radarMat
    );
    radarDish.position.y = 330;
    commandTower.add(radarDish);

    const beacon = this.createWarningBeacon(redLight, 40);
    beacon.position.y = 350;
    commandTower.add(beacon);

    const centerPt = curve.getPointAt(0.5);
    commandTower.position.copy(centerPt).add(new THREE.Vector3(-140, 0, -200));
    this.structuresGroup.add(commandTower);

    this.animators.push({
      mesh: radarDish,
      update: (dt) => {
        radarDish.rotation.y += dt * 1.5;
      },
    });

    // 4. MASSIVE DRONE LAUNCH HANGARS
    for (let h = 0; h < 4; h++) {
      const t = 0.12 + h * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const hangar = new THREE.Group();
      hangar.position.copy(pt).addScaledVector(bin, (h % 2 === 0 ? 1 : -1) * 75).add(new THREE.Vector3(0, 30, 0));

      const bay = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(45, 30, 60)), militaryMat);
      hangar.add(bay);

      // Launch gantry rail extending out
      const rail = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(4, 2, 55)), orangeGlowMat);
      rail.position.set(0, 5, 40);
      hangar.add(rail);

      hangar.lookAt(pt);
      this.structuresGroup.add(hangar);
    }

    // 5. HAZARDS: PATROL COMBAT DRONES HOVERING ACROSS LANES
    for (let d = 0; d < 4; d++) {
      const t = 0.18 + d * 0.22;
      const pt = curve.getPointAt(t);

      const drone = new THREE.Group();
      drone.position.copy(pt).add(new THREE.Vector3((d % 2 === 0 ? 1 : -1) * 12, 6, 0));

      const droneBody = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(7, 3, 7)), militaryMat);
      const droneEye = new THREE.Mesh(this.registerGeo(new THREE.SphereGeometry(2, 8, 8)), orangeGlowMat);
      droneEye.position.z = 3.5;
      drone.add(droneBody, droneEye);

      this.animators.push({
        mesh: drone,
        update: (_dt, time) => {
          drone.position.y = pt.y + 6 + Math.sin(time * 3 + d) * 4;
          drone.position.x = pt.x + Math.cos(time * 2 + d) * 10;
        },
      });

      this.hazardsGroup.add(drone);

      this.interactables.push({
        id: `combat_drone_${d}`,
        type: 'HAZARD',
        position: drone.position,
        radius: 6,
        mesh: drone,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'COMBAT DRONE INTERCEPTION!',
        }),
      });
    }
  }
}
