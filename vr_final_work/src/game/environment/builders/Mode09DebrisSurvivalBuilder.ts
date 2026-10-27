import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode09DebrisSurvivalBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const darkSteel = 0x1c1917;
    const rustOrange = 0xb45309;
    const hazardYellow = 0xeab308;
    const redLight = 0xef4444;
    const paleCyan = 0xa5f3fc;

    const wreckMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: darkSteel, metalness: 0.9, roughness: 0.7 })
    );
    const rustMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: rustOrange, roughness: 0.85 })
    );
    const warningMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: hazardYellow })
    );
    const emergencyMat = this.registerMat(
      new THREE.MeshBasicMaterial({ color: redLight })
    );

    // 1. DISTANT WRECKAGE CLUSTERS & DERELICT HULLS
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const r = 1200 + (i % 4) * 150;
      const wreck = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(45, 25, 70)),
        i % 2 === 0 ? wreckMat : rustMat
      );
      wreck.position.set(Math.cos(angle) * r, (i % 5) * 60 - 120, Math.sin(angle) * r);
      wreck.rotation.set(i * 0.4, i * 0.6, i * 0.2);
      this.backgroundGroup.add(wreck);
    }

    // 2. TRACK REINFORCED EMERGENCY SUPPORTS
    this.createTrackSupports(curve, 18, 100, darkSteel, hazardYellow);

    // 3. HERO STRUCTURE: RUINED STATION HUB WITH EXPOSED RIBS
    const ruinedHub = new THREE.Group();
    // Cracked main ring segment
    const tornRing = new THREE.Mesh(
      this.registerGeo(new THREE.TorusGeometry(80, 5, 8, 24, Math.PI * 1.3)),
      wreckMat
    );
    ruinedHub.add(tornRing);

    // Exposed structural ribs
    for (let rib = 0; rib < 7; rib++) {
      const ribMesh = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(4, 50, 4)),
        rustMat
      );
      ribMesh.position.set(Math.cos(rib * 0.5) * 75, Math.sin(rib * 0.5) * 75, 0);
      ribMesh.rotation.z = rib * 0.5;
      ruinedHub.add(ribMesh);
    }

    // Flashing emergency beacon on hub
    const hubBeacon = this.createWarningBeacon(redLight, 30);
    hubBeacon.position.set(0, 95, 0);
    ruinedHub.add(hubBeacon);

    const centerPt = curve.getPointAt(0.5);
    ruinedHub.position.copy(centerPt).add(new THREE.Vector3(120, 60, -180));
    this.structuresGroup.add(ruinedHub);

    // 4. DERELICT SPACECRAFT HULL SECTIONS & CRACKED DOCKING BAYS
    for (let d = 0; d < 4; d++) {
      const t = 0.12 + d * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const hull = new THREE.Group();
      hull.position.copy(pt).addScaledVector(bin, (d % 2 === 0 ? 1 : -1) * 75).add(new THREE.Vector3(0, 35, 0));

      const fuselage = new THREE.Mesh(
        this.registerGeo(new THREE.CylinderGeometry(15, 22, 90, 8)),
        wreckMat
      );
      fuselage.rotation.z = Math.PI / 3;
      hull.add(fuselage);

      const wing = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(60, 3, 25)),
        rustMat
      );
      wing.position.set(0, 10, 0);
      hull.add(wing);

      this.structuresGroup.add(hull);
    }

    // 5. HAZARDS: ROTATING AND DRIFTING WRECKAGE CHUNKS
    for (let h = 0; h < 5; h++) {
      const t = 0.1 + h * 0.18;
      const pt = curve.getPointAt(t);

      const debrisChunk = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(10, 10, 14)),
        wreckMat
      );
      debrisChunk.position.copy(pt).add(new THREE.Vector3((h % 2 === 0 ? 1 : -1) * 12, 6, 0));

      this.animators.push({
        mesh: debrisChunk,
        update: (dt, time) => {
          debrisChunk.rotation.x += dt * 1.2;
          debrisChunk.rotation.y += dt * 1.5;
          debrisChunk.position.y = pt.y + 6 + Math.sin(time * 2 + h) * 4;
        },
      });

      this.hazardsGroup.add(debrisChunk);

      this.interactables.push({
        id: `debris_hazard_${h}`,
        type: 'HAZARD',
        position: debrisChunk.position,
        radius: 7,
        mesh: debrisChunk,
        onInteract: () => ({
          damage: 16,
          soundKey: 'IMPACT',
          message: 'ORBITAL DEBRIS COLLISION!',
        }),
      });
    }
  }
}
