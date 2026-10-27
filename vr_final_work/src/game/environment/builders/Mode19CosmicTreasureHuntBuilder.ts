import * as THREE from 'three';
import { BaseModeEnvironmentBuilder } from './BaseModeEnvironmentBuilder';
import { ModeEnvironmentProfile } from '../modeEnvironmentProfiles';

export class Mode19CosmicTreasureHuntBuilder extends BaseModeEnvironmentBuilder {
  public build(curve: THREE.Curve<THREE.Vector3>, profile: ModeEnvironmentProfile): void {
    const gold = 0xd97706;
    const turquoise = 0x14b8a6;
    const emerald = 0x10b981;
    const violet = 0x8b5cf6;
    const darkStone = 0x1c1917;

    const stoneMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: darkStone, roughness: 0.9, metalness: 0.2 })
    );
    const goldInlayMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: gold, metalness: 0.95, roughness: 0.2 })
    );
    const emeraldCrystalMat = this.registerMat(
      new THREE.MeshStandardMaterial({ color: emerald, emissive: turquoise, emissiveIntensity: 2.2, roughness: 0.1 })
    );

    // 1. DISTANT ANCIENT PRECURSOR RUINS & OBELISKS
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 1350;
      const obelisk = new THREE.Mesh(
        this.registerGeo(new THREE.ConeGeometry(25, 140, 4)),
        stoneMat
      );
      obelisk.position.set(Math.cos(angle) * r, (i % 3) * 60 - 50, Math.sin(angle) * r);
      obelisk.rotation.y = angle;
      this.backgroundGroup.add(obelisk);
    }

    // 2. TRACK ANCIENT STONE BRIDGES & PILLARS
    this.createTrackSupports(curve, 20, 110, darkStone, emerald);
    this.createTracksideBarriers(curve, 32, 18, darkStone, gold);

    // 3. HERO STRUCTURE: CENTRAL PRECURSOR TEMPLE SANCTUM
    const templeSanctum = new THREE.Group();
    // Stepped pyramid base
    for (let tier = 0; tier < 4; tier++) {
      const size = 180 - tier * 35;
      const step = new THREE.Mesh(
        this.registerGeo(new THREE.BoxGeometry(size, 20, size)),
        stoneMat
      );
      step.position.y = tier * 20 + 10;
      templeSanctum.add(step);
    }

    // Giant levitating emerald crystal at the temple apex
    const crystalApex = new THREE.Mesh(
      this.registerGeo(new THREE.OctahedronGeometry(28, 0)),
      emeraldCrystalMat
    );
    crystalApex.position.y = 130;
    templeSanctum.add(crystalApex);

    const centerPt = curve.getPointAt(0.5);
    templeSanctum.position.copy(centerPt).add(new THREE.Vector3(0, 0, -200));
    this.structuresGroup.add(templeSanctum);

    this.animators.push({
      mesh: crystalApex,
      update: (dt, time) => {
        crystalApex.rotation.y += dt * 0.8;
        crystalApex.rotation.x += dt * 0.3;
        crystalApex.position.y = 130 + Math.sin(time * 2) * 8;
      },
    });

    // 4. ANCIENT CARVED PORTAL GATES
    for (let g = 0; g < 4; g++) {
      const t = 0.12 + g * 0.24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const gate = new THREE.Group();
      gate.position.copy(pt).add(new THREE.Vector3(0, 10, 0));
      gate.lookAt(pt.clone().add(tan));

      const pillarL = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(4, 28, 4)), stoneMat);
      pillarL.position.set(-18, 14, 0);
      const pillarR = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(4, 28, 4)), stoneMat);
      pillarR.position.set(18, 14, 0);
      const lintel = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(40, 5, 5)), goldInlayMat);
      lintel.position.set(0, 28, 0);

      gate.add(pillarL, pillarR, lintel);
      this.structuresGroup.add(gate);
    }

    // 5. COLLECTIBLE RELIC PEDESTALS ALONG THE ROUTE
    for (let r = 0; r < 5; r++) {
      const t = 0.08 + r * 0.2;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const relicNode = new THREE.Group();
      const side = (r % 2 === 0 ? 1 : -1) * 6;
      relicNode.position.copy(pt).addScaledVector(bin, side).add(new THREE.Vector3(0, 3, 0));

      const relicMesh = new THREE.Mesh(
        this.registerGeo(new THREE.OctahedronGeometry(2.5, 0)),
        emeraldCrystalMat
      );
      relicNode.add(relicMesh);

      this.animators.push({
        mesh: relicMesh,
        update: (dt, time) => {
          relicMesh.rotation.y += dt * 2.5;
          relicMesh.position.y = 3 + Math.sin(time * 3 + r) * 1.2;
        },
      });

      this.propsGroup.add(relicNode);

      this.interactables.push({
        id: `ancient_relic_${r}`,
        type: 'COLLECTIBLE',
        position: relicNode.position,
        radius: 5,
        mesh: relicNode,
        onInteract: () => ({
          collected: true,
          scoreBonus: 500,
          boost: 25,
          soundKey: 'CHECKPOINT',
          message: 'ANCIENT RELIC DISCOVERED! (+500 PTS)',
        }),
      });
    }

    // 6. HAZARDS: ROTATING PRECURSOR DEFENSE MONOLITHS
    for (let h = 0; h < 3; h++) {
      const t = 0.22 + h * 0.28;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();

      const trap = new THREE.Group();
      trap.position.copy(pt).add(new THREE.Vector3(0, 8, 0));
      trap.lookAt(pt.clone().add(tan));

      const blade = new THREE.Mesh(this.registerGeo(new THREE.BoxGeometry(22, 1.4, 1.4)), goldInlayMat);
      trap.add(blade);

      this.animators.push({
        mesh: blade,
        update: (dt) => {
          blade.rotation.z += dt * 2.2;
        },
      });

      this.hazardsGroup.add(trap);

      this.interactables.push({
        id: `temple_trap_${h}`,
        type: 'HAZARD',
        position: pt.clone(),
        radius: 8,
        mesh: trap,
        onInteract: () => ({
          damage: 15,
          soundKey: 'IMPACT',
          message: 'ANCIENT TEMPLE DEFENSE TRAP!',
        }),
      });
    }
  }
}
