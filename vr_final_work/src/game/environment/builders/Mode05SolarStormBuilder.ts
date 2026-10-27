import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode05SolarStormBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const gold = 0xf59e0b;
    const orange = 0xea580c;
    const red = 0xdc2626;
    const bronze = 0x451a03;
    const whiteYellow = 0xfef08a;

    const bronzeMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: bronze, metalness: 0.9, roughness: 0.35 })
    );
    const solarPanelMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: gold, emissiveIntensity: 1.2, metalness: 0.9, roughness: 0.1 })
    );
    const reactorMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: orange, emissive: red, emissiveIntensity: 2.8, roughness: 0.2 })
    );
    const radiatorMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.85, roughness: 0.4 })
    );

    // 1. DISTANT SOLAR STAR & MASSIVE CORONAL PROMINENCE
    const sunMesh = new THREE.Mesh(
      this.registerGeo(new THREE.SphereGeometry(350, 32, 32)),
      this.registerMat(new THREE.MeshBasicMaterial({ color: whiteYellow }))
    );
    sunMesh.position.set(0, 500, -2600);
    this.skyGroup.add(sunMesh);

    // Coronal solar flare prominence loops
    for (let f = 0; f < 3; f++) {
      const flareLoop = new THREE.Mesh(
        this.registerGeo(new THREE.TorusGeometry(260 + f * 60, 18, 8, 32, Math.PI)),
        this.registerMat(new THREE.MeshBasicMaterial({ color: orange, transparent: true, opacity: 0.75 }))
      );
      flareLoop.position.copy(sunMesh.position);
      flareLoop.rotation.z = f * 0.9;
      this.skyGroup.add(flareLoop);
    }

    // 2. TRACK STRUCTURAL THERMAL SHIELD SUPPORTS
    this.createTrackSupports(curve, 22, 120, bronze, gold);
    this.createTracksideBarriers(curve, 32, 18, bronze, orange);

    // 3. HERO STRUCTURE: CENTRAL ORBITAL SOLAR HARVESTER PLATFORM
    const centralReactor = new THREE.Group();
    const core = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(40, 55, 140, 16)), reactorMat);
    centralReactor.add(core);

    // Giant cooling radiator fins
    for (let fin = 0; fin < 6; fin++) {
      const finMesh = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(110, 80, 4)), radiatorMat);
      finMesh.rotation.y = (fin / 6) * Math.PI;
      centralReactor.add(finMesh);
    }

    // Huge collector dish
    const collector = new THREE.Mesh(
      this.registerGeo(new THREE.CylinderGeometry(85, 30, 25, 24)),
      solarPanelMat
    );
    collector.position.y = 85;
    centralReactor.add(collector);

    const centerPt = curve.getPointAt(0.5);
    centralReactor.position.copy(centerPt).add(new THREE.Vector3(140, 60, -200));
    this.structuresGroup.add(centralReactor);

    // 4. LARGE ARTICULATED SOLAR COLLECTOR ARRAYS
    for (let i = 0; i < 6; i++) {
      const t = 0.1 + i * 0.16;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const arrayGroup = new THREE.Group();
      arrayGroup.position.copy(pt).addScaledVector(bin, (i % 2 === 0 ? 1 : -1) * 85).add(new THREE.Vector3(0, 40, 0));

      const mast = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(3, 5, 80, 8)), bronzeMat);
      arrayGroup.add(mast);

      // Dual folding wings of solar cells
      const wingL = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(45, 25, 2)), solarPanelMat);
      wingL.position.set(-25, 45, 0);
      const wingR = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(45, 25, 2)), solarPanelMat);
      wingR.position.set(25, 45, 0);
      arrayGroup.add(wingL, wingR);

      // Track the sun slightly
      this.animators.push({
        mesh: arrayGroup,
        update: (_dt, time) => {
          const sway = Math.sin(time * 0.8 + i) * 0.15;
          arrayGroup.rotation.y = sway;
        },
      });

      this.structuresGroup.add(arrayGroup);
    }

    // 5. THERMAL SENSOR MASTS & WARNING BEACONS
    for (let b = 0; b < 4; b++) {
      const t = 0.18 + b * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const beacon = this.createWarningBeacon(gold, 32);
      beacon.position.copy(pt).addScaledVector(bin, (b % 2 === 0 ? 1 : -1) * 45);
      this.propsGroup.add(beacon);
    }

    // 6. HAZARDS: MOVING THERMAL SHIELD DOORS & SOLAR DISCHARGE ZONES
    for (let h = 0; h < 3; h++) {
      const t = 0.25 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const shieldGate = new THREE.Group();
      shieldGate.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      shieldGate.lookAt(pt.clone().add(tan));

      const panelGeo = this.registerGeo(new THREE.BoxGeometry(20, 8, 2));
      const panel = new THREE.Mesh(panelGeo, reactorMat);
      shieldGate.add(panel);

      this.animators.push({
        mesh: panel,
        update: (_dt, time) => {
          // Heat pulse up and down
          panel.position.y = Math.sin(time * 2.2 + h * 1.5) * 6;
        },
      });

      this.hazardsGroup.add(shieldGate);

      this.interactables.push({
        id: `solar_thermal_hazard_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: shieldGate,
        onInteract: () => ({
          damage: 18,
          soundKey: 'ALARM',
          message: 'THERMAL RADIATION SURGE!',
        }),
      });
    }
  }
}
