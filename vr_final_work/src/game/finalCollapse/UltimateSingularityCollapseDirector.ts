import * as THREE from 'three';
import { sound } from '../audio';
import { FinalCollapseStats } from '../FinalCollapseManager';

export type UltimateCollapseStage =
  | 1  // STAGE 1: LAST SURVIVAL (playable, steer/boost/brake/drift/shields)
  | 2  // STAGE 2: ORBITAL CAPTURE (tightening elongated oval/elliptical orbit)
  | 3  // STAGE 3: SPACECRAFT SPAGHETTIFICATION (progressive deformation)
  | 4  // STAGE 4: EVERYTHING ELSE FOLLOWS (environment streams into void)
  | 5  // STAGE 5: MASSIVE RING FORMATION (gigantic rotating debris ring)
  | 6  // STAGE 6: SINGULARITY CRITICAL (overloaded black hole state)
  | 7  // STAGE 7: CRITICAL COLLAPSE (inward ring compression & silence pause)
  | 8  // STAGE 8: SINGULARITY RUPTURE (catastrophic cosmic rupture)
  | 9  // STAGE 9: BRILLIANT COSMIC COLOR SPECTACLE (prismatic multi-color clouds)
  | 10 // STAGE 10: SILENCE / AFTERMATH (serene cosmic expanse & drifting embers)
  | 11; // STAGE 11: RESULT (Singularity Catalyst result screen)

export interface UltimateCollapseTelemetry {
  isActive: boolean;
  stage: UltimateCollapseStage;
  stageName: string;
  stageSubtitle: string;
  stageProgress: number; // 0 to 1
  totalProgress: number; // 0 to 1
  isPlayableStage: boolean;
  lastSurvivalTimeRemaining: number;
  cameraShake: number;
  cockpitViewActive: boolean;
  statusHeadline: string;
}

/**
 * SUBMODE 10: ULTIMATE SINGULARITY COLLAPSE DIRECTOR
 *
 * Coordinates the 11-stage Failed Safe-Zone Ending sequence when the countdown reaches 00:00
 * and the player has not reached any of the three escape routes.
 */
export class UltimateSingularityCollapseDirector {
  public isActive = false;
  public currentStage: UltimateCollapseStage = 1;
  public stageElapsed = 0;
  public totalElapsed = 0;
  public completed = false;

  // Stage durations in seconds
  // Stage 1 (Last Survival): 12.0s playable window
  // Stage 2 (Orbital Capture): 7.0s elliptical revolution
  // Stage 3 (Spaghettification): 5.5s deformation
  // Stage 4 (Everything Else): 5.0s environment streamers
  // Stage 5 (Massive Ring): 5.0s rotating ring
  // Stage 6 (Singularity Critical): 4.5s overload state
  // Stage 7 (Critical Collapse): 4.0s inward compression & audio drop
  // Stage 8 (Singularity Rupture): 3.5s detonation
  // Stage 9 (Color Spectacle): 6.0s multi-color cosmic clouds
  // Stage 10 (Silence / Aftermath): 4.5s tranquil drift
  // Stage 11: Results transition
  private readonly stageDurations: Record<UltimateCollapseStage, number> = {
    1: 12.0,
    2: 7.0,
    3: 5.5,
    4: 5.0,
    5: 5.0,
    6: 4.5,
    7: 4.0,
    8: 3.5,
    9: 6.0,
    10: 4.5,
    11: 1.0,
  };

  // Trajectory & Physics State
  public shipInitialPos = new THREE.Vector3();
  public shipCurrentPos = new THREE.Vector3();
  public shipCurrentRot = new THREE.Euler();
  private orbitalAngle = 0;
  private currentSemiMajorAxis = 1600;
  private shipOriginalScale = new THREE.Vector3(1, 1, 1);
  private shipGroupRef: THREE.Group | null = null;
  private blackHoleCenter = new THREE.Vector3(0, 180, -3500);

  // Scene Visual Groups
  private sceneRef: THREE.Scene | null = null;
  private ringGroup: THREE.Group | null = null;
  private spectacleGroup: THREE.Group | null = null;
  private ruptureSphere: THREE.Mesh | null = null;
  private shockwaveRings: THREE.Mesh[] = [];

  // Stage Trigger Locks
  private stageAudioTriggered = new Set<number>();
  private cameraShakeIntensity = 0;
  private cockpitView = false;
  private cockpitTimer = 0;

  // Stats Accumulators
  public lastSurvivalDuration = 0;
  public damageReceivedDuringSurvival = 0;

  public start(
    initialPosition: THREE.Vector3,
    shipGroup: THREE.Group | null,
    scene: THREE.Scene,
    bhCenter?: THREE.Vector3
  ): void {
    this.isActive = true;
    this.currentStage = 1;
    this.stageElapsed = 0;
    this.totalElapsed = 0;
    this.completed = false;
    this.lastSurvivalDuration = 0;
    this.damageReceivedDuringSurvival = 0;
    this.stageAudioTriggered.clear();

    if (bhCenter) {
      this.blackHoleCenter.copy(bhCenter);
    }
    this.shipInitialPos.copy(initialPosition);
    this.shipCurrentPos.copy(initialPosition);
    this.sceneRef = scene;

    if (shipGroup) {
      this.shipGroupRef = shipGroup;
      this.shipOriginalScale.copy(shipGroup.scale);
      this.shipCurrentRot.copy(shipGroup.rotation);
    }

    this.currentSemiMajorAxis = Math.max(900, initialPosition.distanceTo(this.blackHoleCenter));
    this.orbitalAngle = Math.atan2(
      initialPosition.z - this.blackHoleCenter.z,
      initialPosition.x - this.blackHoleCenter.x
    );

    this.initVisualGroups(scene);

    // Initial audio cue: 00:00 escape window expired alarm
    sound.playEmergencyAlarm();
    sound.playGravitationalRumble(4.0);
  }

  private initVisualGroups(scene: THREE.Scene): void {
    this.disposeVisualGroups();

    // 1. Massive Debris Ring Group (Stage 5)
    this.ringGroup = new THREE.Group();
    this.ringGroup.name = 'UltimateCollapse_DebrisRing';
    this.ringGroup.visible = false;
    this.ringGroup.position.copy(this.blackHoleCenter);

    const debrisCount = 120;
    const ringGeo = new THREE.BoxGeometry(18, 4, 38);
    for (let i = 0; i < debrisCount; i++) {
      const angle = (i / debrisCount) * Math.PI * 2;
      const radius = 650 + Math.random() * 320;
      const mat = new THREE.MeshStandardMaterial({
        color: i % 4 === 0 ? 0x00f0ff : i % 4 === 1 ? 0xffaa00 : i % 4 === 2 ? 0xa855f7 : 0xff3b30,
        emissive: i % 2 === 0 ? 0x00f0ff : 0xff6600,
        emissiveIntensity: 0.8 + Math.random() * 1.5,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 80,
        Math.sin(angle) * radius
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.ringGroup.add(mesh);
    }
    scene.add(this.ringGroup);

    // 2. Rupture Sphere (Stage 8)
    const ruptureGeo = new THREE.SphereGeometry(45, 32, 32);
    const ruptureMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.ruptureSphere = new THREE.Mesh(ruptureGeo, ruptureMat);
    this.ruptureSphere.position.copy(this.blackHoleCenter);
    this.ruptureSphere.visible = false;
    scene.add(this.ruptureSphere);

    // 3. Shockwave Rings (Stages 8 & 9)
    this.shockwaveRings = [];
    const ringColors = [0x38bdf8, 0xa855f7, 0xf59e0b, 0xef4444, 0xffffff];
    for (let i = 0; i < 5; i++) {
      const ringGeom = new THREE.RingGeometry(80 + i * 40, 95 + i * 40, 48);
      const ringM = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const rMesh = new THREE.Mesh(ringGeom, ringM);
      rMesh.position.copy(this.blackHoleCenter);
      rMesh.rotation.x = Math.PI / 2;
      rMesh.visible = false;
      this.shockwaveRings.push(rMesh);
      scene.add(rMesh);
    }

    // 4. Cosmic Color Spectacle Group (Stage 9)
    this.spectacleGroup = new THREE.Group();
    this.spectacleGroup.name = 'UltimateCollapse_Spectacle';
    this.spectacleGroup.position.copy(this.blackHoleCenter);
    this.spectacleGroup.visible = false;

    // Multi-color nebula plasma planes with depth
    const cloudColors = [
      0x0284c7, // Brilliant blue
      0x06b6d4, // Cyan
      0x7c3aed, // Violet
      0xc026d3, // Magenta
      0xdc2626, // Red
      0xea580c, // Orange
      0xf59e0b, // Gold
      0xffffff, // White
    ];

    for (let i = 0; i < 36; i++) {
      const planeGeo = new THREE.PlaneGeometry(900 + (i % 6) * 350, 750 + (i % 5) * 300);
      const col = cloudColors[i % cloudColors.length];
      const planeMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      const ang = (i / 36) * Math.PI * 2;
      const dist = 400 + Math.random() * 1200;
      plane.position.set(
        Math.cos(ang) * dist,
        (Math.random() - 0.5) * 600,
        Math.sin(ang) * dist
      );
      plane.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.spectacleGroup.add(plane);
    }
    scene.add(this.spectacleGroup);
  }

  public update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    playerShipGroup: THREE.Group | null,
    blackHoleObject?: THREE.Object3D | null
  ): UltimateCollapseTelemetry {
    if (!this.isActive) {
      return this.getEmptyTelemetry();
    }

    const delta = Math.max(0, Math.min(dt, 0.1));
    this.stageElapsed += delta;
    this.totalElapsed += delta;

    const currentDuration = this.stageDurations[this.currentStage];
    const stageFrac = Math.min(1.0, this.stageElapsed / currentDuration);

    // Track last survival time while in Stage 1
    if (this.currentStage === 1) {
      this.lastSurvivalDuration += delta;
    }

    // ------------------------------------------------------------------------
    // STAGE SPECIFIC BEHAVIORS
    // ------------------------------------------------------------------------
    switch (this.currentStage) {
      case 1: {
        // STAGE 1: LAST SURVIVAL (Playable survival phase)
        this.cameraShakeIntensity = 0.5 + stageFrac * 1.2;
        this.cockpitView = false;
        if (!this.stageAudioTriggered.has(1)) {
          this.stageAudioTriggered.add(1);
          sound.playEmergencyAlarm();
        }
        break;
      }

      case 2: {
        // STAGE 2: ORBITAL CAPTURE (Tightening elongated oval/elliptical orbit)
        if (!this.stageAudioTriggered.has(2)) {
          this.stageAudioTriggered.add(2);
          sound.playDarkGravitationalShockwave();
          sound.playGravitationalRumble(5.0);
        }

        // Elliptical parameters: a shrinks from initial distance down to 340m
        const startA = Math.max(700, this.shipInitialPos.distanceTo(this.blackHoleCenter));
        const targetA = 340;
        this.currentSemiMajorAxis = THREE.MathUtils.lerp(startA, targetA, Math.pow(stageFrac, 1.4));
        const a = this.currentSemiMajorAxis;
        const b = a * 0.44; // Elongated oval!

        // Accelerating orbital frequency
        const angularSpeed = (1200 / Math.max(120, a)) * 0.95;
        this.orbitalAngle += delta * angularSpeed;

        const relX = Math.cos(this.orbitalAngle) * a;
        const relZ = Math.sin(this.orbitalAngle) * b;
        const relY = Math.sin(this.orbitalAngle * 1.6) * (b * 0.35);

        this.shipCurrentPos.set(
          this.blackHoleCenter.x + relX,
          this.blackHoleCenter.y + relY,
          this.blackHoleCenter.z + relZ
        );

        if (playerShipGroup) {
          playerShipGroup.position.copy(this.shipCurrentPos);
          // Tangent orientation along elliptical curve
          const tangent = new THREE.Vector3(-Math.sin(this.orbitalAngle) * a, relY * 0.2, Math.cos(this.orbitalAngle) * b).normalize();
          playerShipGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);
        }

        // Camera alternation between wide and occasional cockpit perspective
        this.cockpitTimer += delta;
        this.cockpitView = (Math.floor(this.cockpitTimer / 2.2) % 2 === 1) && stageFrac < 0.85;
        this.cameraShakeIntensity = 1.2 + stageFrac * 1.5;
        break;
      }

      case 3: {
        // STAGE 3: SPACECRAFT SPAGHETTIFICATION (Progressive deformation)
        if (!this.stageAudioTriggered.has(3)) {
          this.stageAudioTriggered.add(3);
          sound.playStructureCreak();
          sound.playGravitationalWavePulse(1.5);
        }

        // Deformation: NORMAL -> STRUCTURAL STRESS -> WARPING -> ELONGATION -> SEVERE TIDAL STRETCHING -> SPAGHETTIFICATION -> DISINTEGRATION
        const stretchZ = THREE.MathUtils.lerp(1.0, 16.0, Math.pow(stageFrac, 1.6));
        const squeezeXY = 1.0 / Math.sqrt(stretchZ);

        if (playerShipGroup) {
          playerShipGroup.scale.set(
            this.shipOriginalScale.x * squeezeXY,
            this.shipOriginalScale.y * squeezeXY,
            this.shipOriginalScale.z * stretchZ
          );
          // Rapid tumbling as tidal forces pull hull
          playerShipGroup.rotation.x += delta * (2.0 + stageFrac * 6.0);
          playerShipGroup.rotation.y += delta * (1.5 + stageFrac * 7.0);
          playerShipGroup.rotation.z += delta * (3.0 + stageFrac * 9.0);
          this.shipCurrentPos.lerp(this.blackHoleCenter, delta * 1.8);
          playerShipGroup.position.copy(this.shipCurrentPos);
        }

        this.cockpitView = stageFrac < 0.35;
        this.cameraShakeIntensity = 1.8 + stageFrac * 1.2;
        break;
      }

      case 4: {
        // STAGE 4: EVERYTHING ELSE FOLLOWS (Environment entering gravitational stream)
        if (!this.stageAudioTriggered.has(4)) {
          this.stageAudioTriggered.add(4);
          sound.playCollision();
          sound.playDeepCosmicBoom();
        }

        // Ship disintegrates into filaments
        if (playerShipGroup) {
          playerShipGroup.visible = stageFrac < 0.6;
        }

        this.cockpitView = false;
        this.cameraShakeIntensity = 2.2;
        break;
      }

      case 5: {
        // STAGE 5: MASSIVE RING FORMATION (Gigantic rotating debris ring around black hole)
        if (!this.stageAudioTriggered.has(5)) {
          this.stageAudioTriggered.add(5);
          sound.playGravitationalRumble(6.0);
          sound.playGravitationalWavePulse(2.0);
        }

        if (this.ringGroup) {
          this.ringGroup.visible = true;
          this.ringGroup.rotation.y += delta * (1.2 + stageFrac * 2.8);
          this.ringGroup.scale.setScalar(THREE.MathUtils.lerp(1.5, 1.0, stageFrac));
        }

        if (playerShipGroup) playerShipGroup.visible = false;
        this.cameraShakeIntensity = 2.0;
        break;
      }

      case 6: {
        // STAGE 6: SINGULARITY CRITICAL (Overloaded black hole state)
        if (!this.stageAudioTriggered.has(6)) {
          this.stageAudioTriggered.add(6);
          sound.playSubBassGravitationalImplosion();
          sound.playEmergencyAlarm();
        }

        if (this.ringGroup) {
          this.ringGroup.visible = true;
          this.ringGroup.rotation.y += delta * 4.5;
          // Intensify emissive glow of ring debris
          this.ringGroup.traverse(obj => {
            const m = obj as THREE.Mesh;
            if (m.material && (m.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
              (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5 + Math.sin(this.stageElapsed * 12) * 1.5;
            }
          });
        }

        if (blackHoleObject && typeof (blackHoleObject as any).setInstability === 'function') {
          (blackHoleObject as any).setInstability(1.0);
        }

        this.cameraShakeIntensity = 2.5;
        break;
      }

      case 7: {
        // STAGE 7: CRITICAL COLLAPSE (Inward ring compression & silence pause)
        if (!this.stageAudioTriggered.has(7)) {
          this.stageAudioTriggered.add(7);
          sound.playDarkGravitationalShockwave();
        }

        if (this.ringGroup) {
          // Rapid collapse inward toward singularity
          const comp = Math.pow(Math.max(0, 1.0 - stageFrac * 1.1), 2.2);
          this.ringGroup.scale.setScalar(comp);
          this.ringGroup.rotation.y += delta * 8.0;
        }

        // Moment of maximum compression: sudden audio drop / near silence
        if (stageFrac >= 0.85) {
          this.cameraShakeIntensity = 0.2; // Eerie silence and stillness
        } else {
          this.cameraShakeIntensity = 2.2;
        }
        break;
      }

      case 8: {
        // STAGE 8: SINGULARITY RUPTURE (Catastrophic cosmic rupture)
        if (!this.stageAudioTriggered.has(8)) {
          this.stageAudioTriggered.add(8);
          sound.playFlashbangBoom();
          sound.playDeepCosmicBoom();
        }

        if (this.ringGroup) this.ringGroup.visible = false;

        if (this.ruptureSphere) {
          this.ruptureSphere.visible = true;
          const rScale = THREE.MathUtils.lerp(1.0, 38.0, Math.pow(stageFrac, 1.8));
          this.ruptureSphere.scale.setScalar(rScale);
          (this.ruptureSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - stageFrac * 0.8);
        }

        // Expand shockwave rings
        this.shockwaveRings.forEach((r, idx) => {
          r.visible = true;
          const rProg = Math.max(0, stageFrac - idx * 0.12);
          const sc = 1.0 + rProg * 25.0;
          r.scale.setScalar(sc);
          (r.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - rProg) * 0.9);
        });

        this.cameraShakeIntensity = 3.5;
        break;
      }

      case 9: {
        // STAGE 9: BRILLIANT COSMIC COLOR SPECTACLE (Multi-color nebula clouds & light rays)
        if (!this.stageAudioTriggered.has(9)) {
          this.stageAudioTriggered.add(9);
          sound.playDeepCosmicBoom();
        }

        if (this.ruptureSphere) this.ruptureSphere.visible = false;
        this.shockwaveRings.forEach(r => (r.visible = false));

        if (this.spectacleGroup) {
          this.spectacleGroup.visible = true;
          this.spectacleGroup.rotation.y += delta * 0.25;
          const fadeInOut = Math.sin(stageFrac * Math.PI);
          this.spectacleGroup.traverse(obj => {
            const m = obj as THREE.Mesh;
            if (m.material && (m.material as THREE.MeshBasicMaterial).opacity !== undefined) {
              (m.material as THREE.MeshBasicMaterial).opacity = fadeInOut * 0.85;
            }
          });
        }

        this.cameraShakeIntensity = THREE.MathUtils.lerp(2.0, 0.4, stageFrac);
        break;
      }

      case 10: {
        // STAGE 10: SILENCE / AFTERMATH (Serene cosmic expanse & gently drifting embers)
        if (this.spectacleGroup) {
          const fade = Math.max(0, 1.0 - stageFrac);
          this.spectacleGroup.traverse(obj => {
            const m = obj as THREE.Mesh;
            if (m.material && (m.material as THREE.MeshBasicMaterial).opacity !== undefined) {
              (m.material as THREE.MeshBasicMaterial).opacity = fade * 0.35;
            }
          });
        }

        this.cameraShakeIntensity = 0;
        break;
      }

      case 11: {
        // STAGE 11: RESULT (Singularity Catalyst result display)
        this.completed = true;
        break;
      }
    }

    // ------------------------------------------------------------------------
    // CAMERA CHOREOGRAPHY
    // ------------------------------------------------------------------------
    this.updateCamera(camera, stageFrac);

    // Stage progression check
    if (this.stageElapsed >= currentDuration && this.currentStage < 11) {
      this.currentStage = (this.currentStage + 1) as UltimateCollapseStage;
      this.stageElapsed = 0;
    }

    return this.getTelemetry();
  }

  private updateCamera(camera: THREE.PerspectiveCamera, stageFrac: number): void {
    const bhPos = this.blackHoleCenter;

    if (this.currentStage === 1) {
      // Stage 1: Player in control, camera handles normally in GameEngine
      return;
    }

    if (this.currentStage === 2) {
      if (this.cockpitView) {
        // Cockpit view facing forward along velocity tangent
        const camPos = this.shipCurrentPos.clone().add(new THREE.Vector3(0, 1.2, 0));
        camera.position.lerp(camPos, 0.3);
        const lookAhead = this.shipCurrentPos.clone().add(
          new THREE.Vector3(-Math.sin(this.orbitalAngle) * 80, 0, Math.cos(this.orbitalAngle) * 80)
        );
        camera.lookAt(lookAhead);
        camera.fov = 85;
      } else {
        // Wide 3rd-person showing black hole and orbiting ship
        const camPos = this.shipCurrentPos.clone().add(new THREE.Vector3(0, 45, 110));
        camera.position.lerp(camPos, 0.12);
        camera.lookAt(bhPos);
        camera.fov = 78;
      }
      camera.updateProjectionMatrix();
      return;
    }

    if (this.currentStage === 3) {
      if (this.cockpitView) {
        camera.position.lerp(this.shipCurrentPos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0.25);
        camera.lookAt(bhPos);
        camera.fov = 92;
      } else {
        // Close-up showing severe ship spaghettification
        const camPos = this.shipCurrentPos.clone().add(new THREE.Vector3(25, 18, 35));
        camera.position.lerp(camPos, 0.1);
        camera.lookAt(this.shipCurrentPos);
        camera.fov = 76;
      }
      camera.updateProjectionMatrix();
      return;
    }

    if (this.currentStage >= 4 && this.currentStage <= 7) {
      // Wide epic view framing the complete black hole and collapsing ring
      const camPos = bhPos.clone().add(new THREE.Vector3(0, 520, 1450));
      camera.position.lerp(camPos, 0.08);
      camera.lookAt(bhPos);
      camera.fov = 82;
      camera.updateProjectionMatrix();
      return;
    }

    if (this.currentStage === 8 || this.currentStage === 9) {
      // Expanding pull-back showing full multi-color spectacle
      const camPos = bhPos.clone().add(new THREE.Vector3(0, 680, 2100));
      camera.position.lerp(camPos, 0.06);
      camera.lookAt(bhPos);
      camera.fov = 88;
      camera.updateProjectionMatrix();
      return;
    }

    if (this.currentStage >= 10) {
      // Serene aftermath drift
      const driftY = Math.sin(this.stageElapsed * 0.2) * 40;
      const camPos = bhPos.clone().add(new THREE.Vector3(80, 580 + driftY, 2400));
      camera.position.lerp(camPos, 0.04);
      camera.lookAt(bhPos);
      camera.fov = 75;
      camera.updateProjectionMatrix();
      return;
    }
  }

  public getTelemetry(): UltimateCollapseTelemetry {
    const titles: Record<UltimateCollapseStage, string> = {
      1: 'STAGE 01 // LAST SURVIVAL',
      2: 'STAGE 02 // ORBITAL CAPTURE',
      3: 'STAGE 03 // SPACECRAFT SPAGHETTIFICATION',
      4: 'STAGE 04 // ENVIRONMENTAL STREAMING',
      5: 'STAGE 05 // MASSIVE RING FORMATION',
      6: 'STAGE 06 // SINGULARITY CRITICAL',
      7: 'STAGE 07 // CRITICAL COLLAPSE',
      8: 'STAGE 08 // SINGULARITY RUPTURE',
      9: 'STAGE 09 // COSMIC COLOR SPECTACLE',
      10: 'STAGE 10 // SILENCE AND AFTERMATH',
      11: 'STAGE 11 // SINGULARITY CATALYST',
    };

    const subtitles: Record<UltimateCollapseStage, string> = {
      1: '00:00 ESCAPE DEADLINE EXPIRED // MANEUVER TO SURVIVE COLLAPSING ENVIRONMENT',
      2: 'GRAVITATIONAL LOCK DETECTED // ACCELERATING ELONGATED OVAL ORBIT AROUND SINGULARITY',
      3: 'EXTREME TIDAL FORCES // SHIP HULL STRETCHING INTO LUMINOUS ENERGY FILAMENTS',
      4: 'SURROUNDING CIVILIZATION ENTERING ACCRETION STREAM // TOWERS AND TRACKS DESTABILIZING',
      5: 'ENTIRE COSMIC SYSTEM COALESCING INTO GIGANTIC RAPIDLY ROTATING DEBRIS RING',
      6: 'THE BLACK HOLE HAS BECOME OVERLOADED // OUTWARD GRAVITATIONAL SHOCKWAVES DETONATING',
      7: 'ALL MATTER RAPIDLY CONVERGING INWARD // MAXIMUM COMPRESSION MOMENTARY SILENCE',
      8: 'SINGULARITY CORE RUPTURE // EXPANDING COSMIC ENERGY SPHERE',
      9: 'PRISMATIC COSMIC AFTERMATH // NEBULA CLOUDS IN BRILLIANT BLUE, CYAN, VIOLET, MAGENTA AND GOLD',
      10: 'CIVILIZATION REMNANTS TRANSFORMED // VAST QUIET COSMOS DRIFTING IN EQUILIBRIUM',
      11: 'RESULTS CONFIRMED // STATUS: SINGULARITY CATALYST',
    };

    const dur = this.stageDurations[this.currentStage] || 1;
    const stageProgress = Math.min(1.0, this.stageElapsed / dur);
    const totalPossible = Object.values(this.stageDurations).reduce((a, b) => a + b, 0);
    const totalProgress = Math.min(1.0, this.totalElapsed / totalPossible);

    return {
      isActive: this.isActive,
      stage: this.currentStage,
      stageName: titles[this.currentStage],
      stageSubtitle: subtitles[this.currentStage],
      stageProgress,
      totalProgress,
      isPlayableStage: this.currentStage === 1,
      lastSurvivalTimeRemaining: Math.max(0, this.stageDurations[1] - this.stageElapsed),
      cameraShake: this.cameraShakeIntensity,
      cockpitViewActive: this.cockpitView,
      statusHeadline: this.currentStage === 6 ? 'SINGULARITY CRITICAL' : titles[this.currentStage],
    };
  }

  private getEmptyTelemetry(): UltimateCollapseTelemetry {
    return {
      isActive: false,
      stage: 1,
      stageName: '',
      stageSubtitle: '',
      stageProgress: 0,
      totalProgress: 0,
      isPlayableStage: false,
      lastSurvivalTimeRemaining: 0,
      cameraShake: 0,
      cockpitViewActive: false,
      statusHeadline: '',
    };
  }

  public generateStats(baseStats: FinalCollapseStats): FinalCollapseStats {
    return {
      ...baseStats,
      survivalStatus: 'FAILED',
      safeZoneStatus: 'NOT REACHED',
      endingClassification: 'SINGULARITY_CATALYST',
      lastSurvivalDurationSeconds: Math.round(this.lastSurvivalDuration * 10) / 10,
      finalCollapseStageReached: this.currentStage,
      eventsSurvivedCount: 100,
      escapeRoutesAttemptedCount: 3,
      distanceFromSafeZoneM: Math.round(this.shipCurrentPos.distanceTo(this.blackHoleCenter)),
      damageReceivedTotal: Math.round(this.damageReceivedDuringSurvival),
      structuresEncounteredCount: 120,
      failureCause: 'EVACUATION_DEADLINE_EXPIRED',
      shipStatus: 'SINGULARITY CATALYST // INTEGRATED INTO NEW COSMOS',
      safeZone: 'MISSED // ULTIMATE SINGULARITY COLLAPSE',
    };
  }

  public reset(): void {
    this.isActive = false;
    this.currentStage = 1;
    this.stageElapsed = 0;
    this.totalElapsed = 0;
    this.completed = false;
    this.cameraShakeIntensity = 0;
    this.cockpitView = false;
    this.stageAudioTriggered.clear();
    this.restoreShip();
    this.disposeVisualGroups();
  }

  private restoreShip(): void {
    if (this.shipGroupRef) {
      this.shipGroupRef.scale.copy(this.shipOriginalScale);
      this.shipGroupRef.visible = true;
    }
  }

  private disposeVisualGroups(): void {
    if (this.sceneRef) {
      if (this.ringGroup) {
        this.sceneRef.remove(this.ringGroup);
        this.ringGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.ringGroup = null;
      }
      if (this.ruptureSphere) {
        this.sceneRef.remove(this.ruptureSphere);
        this.ruptureSphere.geometry.dispose();
        (this.ruptureSphere.material as THREE.Material).dispose();
        this.ruptureSphere = null;
      }
      this.shockwaveRings.forEach(r => {
        this.sceneRef?.remove(r);
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      this.shockwaveRings = [];
      if (this.spectacleGroup) {
        this.sceneRef.remove(this.spectacleGroup);
        this.spectacleGroup.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material.dispose();
          }
        });
        this.spectacleGroup = null;
      }
    }
  }
}
