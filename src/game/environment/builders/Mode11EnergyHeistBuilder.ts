import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode11EnergyHeistBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const blackSteel = 0x11131a;
    const gold = 0xf59e0b;
    const redAlert = 0xef4444;
    const orangeEnergy = 0xff5500;
    const cyanInterface = 0x06b6d4;

    const armorMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: blackSteel, metalness: 0.95, roughness: 0.25 })
    );
    const goldTrimMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: gold, metalness: 0.9, roughness: 0.2 })
    );
    const orangeCoreMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: orangeEnergy, emissive: orangeEnergy, emissiveIntensity: 2.5 })
    );
    const laserMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: redAlert, transparent: true, opacity: 0.85 })
    );

    // 1. DISTANT FORTIFIED VAULT WALL SILHOUETTES
    this.createDistantCitySkyline(1500, 24, 250, 500, blackSteel, redAlert);

    // 2. TRACK HEAVY REINFORCED SECURITY STRUTS
    this.createTrackSupports(curve, 22, 110, blackSteel, orangeEnergy);
    this.createTracksideBarriers(curve, 32, 18, blackSteel, redAlert);

    // 3. HERO STRUCTURE: CENTRAL ORBITAL VAULT CITADEL
    const citadel = new THREE.Group();
    const vaultDome = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(55, 75, 140, 16)),
      armorMat
    );
    citadel.add(vaultDome);

    // Rotating massive vault lock gear
    const lockGear = new THREE.Mesh(
      this.registerGeo(new THREE.TorusGeometry(60, 4, 8, 24)),
      goldTrimMat
    );
    lockGear.position.y = 20;
    lockGear.rotation.x = Math.PI / 2;
    citadel.add(lockGear);

    // Glowing core reactor inside vault
    const reactor = new THREE.Mesh(
      this.registerGeo(new THREE.SphereGeometry(25, 16, 16)),
      orangeCoreMat
    );
    reactor.position.y = 85;
    citadel.add(reactor);

    const centerPt = curve.getPointAt(0.5);
    citadel.position.copy(centerPt).add(new THREE.Vector3(140, 50, -180));
    this.structuresGroup.add(citadel);

    this.animators.push({
      mesh: lockGear,
      update: (dt) => {
        lockGear.rotation.z += dt * 0.45;
      },
    });

    // 4. VAULT SURVEILLANCE RADAR SEARCHLIGHTS
    for (let s = 0; s < 4; s++) {
      const t = 0.12 + s * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const searchTower = new THREE.Group();
      searchTower.position.copy(pt).addScaledVector(bin, (s % 2 === 0 ? 1 : -1) * 65).add(new THREE.Vector3(0, 30, 0));

      const post = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(2, 3, 60, 8)), armorMat);
      searchTower.add(post);

      const beam = new THREE.Mesh(this.registerGeo(new THREE.ConeGeometry(12, 35, 12)), laserMat);
      beam.position.y = 35;
      beam.rotation.x = Math.PI / 3;
      searchTower.add(beam);

      this.animators.push({
        mesh: searchTower,
        update: (_dt, time) => {
          searchTower.rotation.y = Math.sin(time * 1.5 + s) * 0.8;
        },
      });

      this.structuresGroup.add(searchTower);
    }

    // 5. HAZARDS: ROTATING LASER SECURITY BARRIERS
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const barrierGate = new THREE.Group();
      barrierGate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      barrierGate.lookAt(pt.clone().add(tan));

      const bar = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(20, 1.4, 1.4)), laserMat);
      barrierGate.add(bar);

      this.animators.push({
        mesh: bar,
        update: (dt) => {
          bar.rotation.z += dt * 2.2;
        },
      });

      this.hazardsGroup.add(barrierGate);

      this.interactables.push({
        id: `vault_laser_hazard_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: barrierGate,
        onInteract: () => ({
          damage: 18,
          soundKey: 'ALARM',
          message: 'VAULT SECURITY TRIPWIRE TRIGGERED!',
        }),
      });
    }
  }
}
