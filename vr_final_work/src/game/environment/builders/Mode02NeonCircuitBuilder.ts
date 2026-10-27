import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode02NeonCircuitBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const cyan = 0x00f0ff;
    const magenta = 0xff007f;
    const violet = 0x8b5cf6;
    const darkBlue = 0x070c1a;
    const orangeWarn = 0xf97316;

    // 1. DISTANT 360-DEGREE CITY SKYLINE
    this.createDistantCitySkyline(1600, 32, 350, 750, darkBlue, cyan);

    // 2. TRACK STRUCTURAL SUPPORTS & TRACKSIDE BARRIERS
    this.createTrackSupports(curve, 22, 140, darkBlue, cyan);
    this.createTracksideBarriers(curve, 36, 18, darkBlue, cyan);

    // 3. HERO BUILDINGS & LANDMARKS (5 Distinct Silhouettes)
    const heroStyles: ('STEPPED' | 'NEEDLE' | 'SPLIT' | 'CURVED' | 'CORPORATE')[] = [
      'STEPPED',
      'NEEDLE',
      'SPLIT',
      'CURVED',
      'CORPORATE',
    ];

    const heroPoints = [0.08, 0.28, 0.48, 0.68, 0.88];
    const towerPositions: THREE.Vector3[] = [];

    for (let i = 0; i < heroStyles.length; i++) {
      const t = heroPoints[i];
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (85 + (i % 3) * 20);

      const pos = pt.clone().addScaledVector(bin, side);
      towerPositions.push(pos);

      const style = heroStyles[i];
      const tower = this.createSkyscraper(
        55,
        380 + (i % 3) * 60,
        55,
        style,
        darkBlue,
        i % 2 === 0 ? cyan : magenta
      );
      tower.position.copy(pos);
      tower.lookAt(pt);
      this.structuresGroup.add(tower);

      // Rooftop Beacon
      const beacon = this.createWarningBeacon(i % 2 === 0 ? cyan : magenta, 30);
      beacon.position.copy(pos).add(new THREE.Vector3(0, 390, 0));
      this.structuresGroup.add(beacon);

      // Large Holographic Advertising Billboard
      const boardTex = this.createHoloTextTexture(
        i === 0 ? 'CYBERDYNE APEX' : i === 1 ? 'NEO-TOKYO 2099' : i === 2 ? 'QUANTUM SYNDICATE' : i === 3 ? 'ORBITAL HIGHWAY' : 'HYPERION CORP',
        `SECTOR 02 // SPEED RATING A+ // ZONE ${i + 1}`,
        i % 2 === 0 ? '#00f0ff' : '#ff007f'
      );
      const boardMat = this.registerMat(
        new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      const board = new THREE.Mesh(this.registerGeo(new THREE.PlaneGeometry(70, 32)), boardMat);
      board.position.copy(pos).add(new THREE.Vector3(0, 180, 28));
      board.lookAt(pt);
      this.structuresGroup.add(board);
    }

    // 4. CENTRAL NEON TRANSIT TOWER (Massive world landmark visible across circuit)
    const centralTransitTower = new THREE.Group();
    const centralCoreGeo = this.registerGeo(new THREE.CylinderGeometry(28, 42, 600, 16));
    const centralCoreMat = this.registerMat(new THREE.MeshStandardMaterial({ color: darkBlue, metalness: 0.9, roughness: 0.2 }));
    const centralCore = new THREE.Mesh(centralCoreGeo, centralCoreMat);
    centralCore.position.y = 300;
    centralTransitTower.add(centralCore);

    // Glowing transit rings encircling central tower
    for (let r = 0; r < 5; r++) {
      const ringGeo = this.registerGeo(new THREE.TorusGeometry(52, 2.8, 8, 32));
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = this.registerMat(new THREE.MeshBasicMaterial({ color: r % 2 === 0 ? cyan : magenta }));
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 120 + r * 90;
      centralTransitTower.add(ringMesh);

      this.animators.push({
        mesh: ringMesh,
        update: (dt) => {
          ringMesh.rotation.z += dt * (r % 2 === 0 ? 0.6 : -0.6);
        },
      });
    }

    // Place central tower at geometric center of curve
    const centerPt = curve.getPointAt(0.5);
    centralTransitTower.position.set(centerPt.x + 120, 0, centerPt.z - 280);
    this.structuresGroup.add(centralTransitTower);

    // 5. CONNECTED SKYBRIDGES BETWEEN TOWERS
    for (let b = 0; b < towerPositions.length - 1; b++) {
      const bridgeStart = towerPositions[b].clone().add(new THREE.Vector3(0, 160, 0));
      const bridgeEnd = towerPositions[b + 1].clone().add(new THREE.Vector3(0, 160, 0));
      if (bridgeStart.distanceTo(bridgeEnd) < 380) {
        const skybridge = this.createSkybridge(bridgeStart, bridgeEnd, 8, 4, darkBlue, cyan);
        this.structuresGroup.add(skybridge);
      }
    }

    // 6. ELEVATED OVERHEAD HIGHWAYS CROSSING TRACK
    for (let h = 0; h < 3; h++) {
      const t = 0.18 + h * 0.32;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const highway = new THREE.Group();
      const spanGeo = this.registerGeo(new THREE.BoxGeometry(16, 3, 120));
      const spanMat = this.registerMat(new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 }));
      const span = new THREE.Mesh(spanGeo, spanMat);
      highway.add(span);

      // Neon lane markings
      const laneGeo = this.registerGeo(new THREE.BoxGeometry(0.8, 0.4, 115));
      const laneMat = this.registerMat(new THREE.MeshBasicMaterial({ color: magenta }));
      const lane = new THREE.Mesh(laneGeo, laneMat);
      lane.position.y = 1.6;
      highway.add(lane);

      highway.position.copy(pt).add(new THREE.Vector3(0, 36, 0));
      highway.lookAt(pt.clone().add(bin));
      this.structuresGroup.add(highway);
    }

    // 7. HAZARDS & INTERACTIVE STRUCTURES
    // A. Timed Laser Gates
    for (let g = 0; g < 3; g++) {
      const t = 0.22 + g * 0.32;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const laserGate = this.createLaserGate(22, 16, cyan);
      laserGate.position.copy(pt).add(new THREE.Vector3(0, 2, 0));
      laserGate.lookAt(pt.clone().add(tan));
      this.hazardsGroup.add(laserGate);

      this.interactables.push({
        id: `neon_laser_gate_${g}`,
        type: 'GATE',
        position: pt.clone(),
        radius: 8,
        mesh: laserGate,
        onInteract: (_pos, speed) => ({
          damage: speed > 60 ? 10 : 0,
          soundKey: 'ALARM',
          message: 'NEON LASER GATE THREADED!',
        }),
      });
    }

    // B. Rotating Neon Obstacle Arms
    for (let r = 0; r < 3; r++) {
      const t = 0.35 + r * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const obstacleArm = new THREE.Group();
      obstacleArm.position.copy(pt).addScaledVector(bin, (r % 2 === 0 ? 1 : -1) * 12).add(new THREE.Vector3(0, 8, 0));

      const hub = new THREE.Mesh(this.registerGeo(new THREE.CylinderGeometry(2, 2, 4, 12)), this.registerMat(new THREE.MeshStandardMaterial({ color: 0x111827 })));
      obstacleArm.add(hub);

      const armGeo = this.registerGeo(new THREE.BoxGeometry(14, 1.2, 1.2));
      const armMat = this.registerMat(new THREE.MeshBasicMaterial({ color: orangeWarn }));
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.x = 7;
      obstacleArm.add(arm);

      this.animators.push({
        mesh: obstacleArm,
        update: (dt) => {
          obstacleArm.rotation.y += dt * 1.8;
        },
      });

      this.hazardsGroup.add(obstacleArm);
    }
  }
}
