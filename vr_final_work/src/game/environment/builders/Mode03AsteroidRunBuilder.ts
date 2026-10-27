import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode03AsteroidRunBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const rockCharcoal = 0x292524;
    const rustOrange = 0xc2410c;
    const mineralGold = 0xd97706;
    const industrialYellow = 0xfacc15;
    const cyanLight = 0x06b6d4;
    const steelDark = 0x1c1917;

    const rockMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: rockCharcoal, roughness: 0.9, metalness: 0.2 })
    );
    const oreMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: rustOrange, emissive: mineralGold, emissiveIntensity: 1.6, roughness: 0.6 })
    );
    const rigMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: steelDark, metalness: 0.9, roughness: 0.35 })
    );
    const yellowMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: industrialYellow })
    );

    // 1. DISTANT ASTEROID BELT SILHOUETTES
    const astGeo = this.registerGeo(new THREE.DodecahedronGeometry(1.0, 1));
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const r = 1200 + (i % 5) * 150;
      const scale = 50 + (i % 6) * 30;
      const rock = new THREE.Mesh(astGeo, i % 3 === 0 ? oreMat : rockMat);
      rock.scale.set(scale, scale * 1.4, scale);
      rock.position.set(Math.cos(angle) * r, (i % 7) * 80 - 200, Math.sin(angle) * r);
      rock.rotation.set(i * 0.4, i * 0.7, i * 0.2);
      this.backgroundGroup.add(rock);
    }

    // 2. TRACK INDUSTRIAL SUPPORTS (Heavy steel struts anchored into asteroids)
    this.createTrackSupports(curve, 20, 120, steelDark, industrialYellow);

    // 3. HERO STRUCTURE: MAIN ASTEROID MINING STATION
    const mainStation = new THREE.Group();
    // Huge anchor asteroid
    const hubAsteroid = new THREE.Mesh(astGeo, rockMat);
    hubAsteroid.scale.set(160, 140, 180);
    mainStation.add(hubAsteroid);

    // Refining modules embedded in the rock
    const refineryCore = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(35, 45, 120, 12)),
      rigMat
    );
    refineryCore.position.set(0, 70, 0);
    mainStation.add(refineryCore);

    // Flare stack on top
    const flareStack = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(4, 6, 60, 8)),
      rigMat
    );
    flareStack.position.set(0, 150, 0);
    const flareGlow = new THREE.Mesh(
      this.registerGeo(new THREE.SphereGeometry(12, 12, 12)),
      this.registerMat(new THREE.MeshBasicMaterial({ color: industrialYellow }))
    );
    flareGlow.position.set(0, 185, 0);
    mainStation.add(flareStack, flareGlow);

    // Communication dish
    const dish = new THREE.Mesh(
      this.registerGeo(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)),
      rigMat
    );
    dish.position.set(50, 110, 0);
    dish.rotation.z = -Math.PI / 4;
    mainStation.add(dish);

    // Position main station prominently at t = 0.5
    const ptStation = curve.getPointAt(0.5);
    mainStation.position.copy(ptStation).add(new THREE.Vector3(180, 40, -120));
    this.structuresGroup.add(mainStation);

    // 4. HERO STRUCTURES: 4x ROTARY BUCKET-WHEEL EXCAVATOR RIGS
    const wheelGeo = this.registerGeo(new THREE.TorusGeometry(22, 3.2, 8, 16));
    const toothGeo = this.registerGeo(new THREE.ConeGeometry(2.5, 7, 4));

    for (let i = 0; i < 4; i++) {
      const t = 0.12 + i * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const rig = new THREE.Group();
      rig.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 80).add(new THREE.Vector3(0, 30, 0));

      const tower = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(14, 65, 14)), rigMat);
      rig.add(tower);

      const boom = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(45, 6, 8)), rigMat);
      boom.position.set(i % 2 === 0 ? -20 : 20, 25, 0);
      rig.add(boom);

      const wheelHub = new THREE.Group();
      wheelHub.position.set(i % 2 === 0 ? -42 : 42, 25, 0);
      const wheel = new THREE.Mesh(wheelGeo, oreMat);
      wheelHub.add(wheel);

      for (let tooth = 0; tooth < 8; tooth++) {
        const ang = (tooth / 8) * Math.PI * 2;
        const toothMesh = new THREE.Mesh(toothGeo, rigMat);
        toothMesh.position.set(Math.cos(ang) * 22, Math.sin(ang) * 22, 0);
        toothMesh.rotation.z = ang - Math.PI / 2;
        wheelHub.add(toothMesh);
      }
      rig.add(wheelHub);

      this.animators.push({
        mesh: wheelHub,
        update: (dt) => {
          wheelHub.rotation.z += dt * (i % 2 === 0 ? 1.6 : -1.6);
        },
      });

      this.structuresGroup.add(rig);
    }

    // 5. ORE CONVEYOR SUSPENSION BRIDGES & CARGO PLATFORMS
    for (let c = 0; c < 3; c++) {
      const t = 0.2 + c * 0.3;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const platform = this.createFloatingPlatform(28, 45, steelDark, mineralGold);
      platform.position.copy(pt).addScaledVector(bin, (c % 2 === 0 ? 1 : -1) * 60).add(new THREE.Vector3(0, 20, 0));
      platform.lookAt(pt);

      // Stacked Cargo Containers on Platform
      const cargoGeo = this.registerGeo(new THREE.BoxGeometry(8, 7, 18));
      const cargo1 = new THREE.Mesh(cargoGeo, oreMat);
      cargo1.position.set(-5, 5.5, 0);
      const cargo2 = new THREE.Mesh(cargoGeo, rigMat);
      cargo2.position.set(5, 5.5, 4);
      platform.add(cargo1, cargo2);

      this.structuresGroup.add(platform);
    }

    // 6. TRACK CANYON ASTEROID CLIFFS
    for (let a = 0; a < 22; a++) {
      const t = (a / 22) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (a % 2 === 0 ? 1 : -1) * (45 + (a % 4) * 20);

      const rock = new THREE.Mesh(astGeo, a % 3 === 0 ? oreMat : rockMat);
      const scale = 32 + (a % 5) * 16;
      rock.scale.set(scale, scale * 1.3, scale);
      rock.position.copy(pt).addScaledVector(bin, side).add(new THREE.Vector3(0, (a % 3) * 12 - 10, 0));
      rock.rotation.set(a * 0.3, a * 0.6, a * 0.1);
      this.sceneryGroup.add(rock);
    }

    // 7. HAZARDS: DRIFTING ASTEROID SHARDS & INDUSTRIAL CRUSHER GATES
    for (let d = 0; d < 4; d++) {
      const t = 0.18 + d * 0.24;
      const pt = curve.getPointAt(t);

      const shard = new THREE.Mesh(astGeo, oreMat);
      shard.scale.set(12, 16, 11);
      shard.position.copy(pt).add(new THREE.Vector3((d % 2 === 0 ? 1 : -1) * 14, 8, 0));

      this.animators.push({
        mesh: shard,
        update: (dt, time) => {
          shard.rotation.x += dt * 0.8;
          shard.rotation.y += dt * 1.2;
          shard.position.y = pt.y + 8 + Math.sin(time * 2 + d) * 5;
        },
      });

      this.hazardsGroup.add(shard);

      this.interactables.push({
        id: `asteroid_drifter_${d}`,
        type: 'HAZARD',
        position: shard.position,
        radius: 7,
        mesh: shard,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'ASTEROID DEBRIS COLLISION!',
        }),
      });
    }
  }
}
