/**
 * VOID-RIDER 3D — CONVOY GUARDIAN MISSION DIRECTOR
 * 
 * Authoritative game loop and combat director for the Convoy Guardian mode:
 * - 4-Ship Escort Fleet (1 Lead Heavy Flagship + 3 Cargo Frigates)
 * - 7 Sequential Mission Events with data-driven state machines
 * - AI Formation Navigation along 6,000m 3D route curve
 * - Hostile Drone Waves (Scouts, Fighters, Gunships) with multi-vector combat
 * - Real Physical Debris & Asteroid shooting / collision
 * - Nanite Field Repair Pickups
 * - Authoritative Damage, Health, Shield, and Destruction Models
 * - Responsive Keyboard, Mouse, and Touch Cyber Joystick input
 */
import * as THREE from 'three';
import {
  ConvoyMissionEvent,
  ConvoyMissionState,
  ConvoyShipState,
  EnemyDrone,
  ConvoyProjectile,
  ConvoyTelemetry,
  ConvoyMissionResult,
  ConvoyVariant,
} from './convoyTypes';
import { convoyEnvironment } from './convoyEnvironment';
import { sound } from '../audio';
import { createProceduralShipMesh } from '../shipMeshGenerator';

export class ConvoyDirector {
  public isActive: boolean = false;
  public isPaused: boolean = false;
  public missionState: ConvoyMissionState = 'BRIEFING';
  public variant: ConvoyVariant = 'SAVIOUR';
  
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  public combatGroup: THREE.Group;

  // Convoy Fleet
  public convoyShips: ConvoyShipState[] = [];
  public convoySpeed: number = 70; // Cruising speed m/s
  private dockingStarted = false;
  private dockingElapsed = 0;
  private emergencyPhase: 'PARKING' | 'LOCKDOWN' | 'ESCAPE' = 'PARKING';
  private emergencyPhaseElapsed = 0;
  private dockedShipIds = new Set<string>();
  public routeProgress: number = 0.0; // 0.0 to 1.0 along 6,000m corridor

  // Hostiles & Entities
  public enemyDrones: EnemyDrone[] = [];
  public projectiles: ConvoyProjectile[] = [];

  // Player State
  public playerShipMesh: THREE.Group | null = null;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 15, 60);
  public playerRot: THREE.Euler = new THREE.Euler(0, Math.PI, 0);
  public playerVel: THREE.Vector3 = new THREE.Vector3();
  public playerHealth: number = 100;
  public playerMaxHealth: number = 100;
  public playerShield: number = 80;
  public playerMaxShield: number = 80;
  public playerBoostCharge: number = 100;
  public isBoosting: boolean = false;
  public isShielding: boolean = false;
  public isTouchShielding: boolean = false;
  public empCooldown: number = 0;
  private barrierHitCooldown = 0;
  private routeHazardHitCooldown = 0;
  public variantAbilityCooldown = 0;
  private hunterOverdriveTimer = 0;
  public fireCooldown: number = 0;
  public missileCooldown: number = 0;
  public isTouchFiring: boolean = false;
  public isTouchBoosting: boolean = false;
  public isTouchBraking: boolean = false;

  // Joystick & Input
  private keysDown: Record<string, boolean> = {};
  private joystickSteerX: number = 0;
  private joystickPitchY: number = 0;
  /** Six-axis touch movement: vertical, lateral and ship-longitudinal. */
  private sixAxisInput = { vertical: 0, lateral: 0, longitudinal: 0 };

  // Mission Tracking & 7 Events
  public currentEventIndex: number = 0;
  public events: ConvoyMissionEvent[] = [];
  public timeElapsed: number = 0;
  public dronesDestroyedCount: number = 0;
  public debrisClearedCount: number = 0;
  public repairsCollectedCount: number = 0;
  public notifications: ConvoyTelemetry['notifications'] = [];
  public finalStats: ConvoyMissionResult | null = null;

  // Visual effects
  private explosionPool: THREE.Mesh[] = [];

  constructor() {
    this.combatGroup = new THREE.Group();
    this.combatGroup.name = 'convoy_guardian_entities';
    this.initEvents();
  }

  public init(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;
    if (!scene.getObjectByName('convoy_guardian_entities')) {
      scene.add(this.combatGroup);
    }
  }

  private initEvents() {
    this.events = [
      {
        id: 'RENDEZVOUS',
        eventNumber: 1,
        name: 'RENDEZVOUS',
        subtitle: 'ESCORT FORMATION DEPARTURE',
        objectiveDescription: 'Rendezvous with the Convoy Fleet at Solar Anchor Alpha.',
        minRouteProgress: 0.0,
        isCompleted: false,
      },
      {
        id: 'DEBRIS_CORRIDOR',
        eventNumber: 2,
        name: 'DEBRIS CORRIDOR',
        subtitle: 'DENSE ASTEROID PASSAGE',
        objectiveDescription: 'Clear or navigate dangerous asteroid debris threatening the transports.',
        minRouteProgress: 0.16,
        targetProgress: 0.32,
        isCompleted: false,
      },
      {
        id: 'DRONE_INTERCEPT',
        eventNumber: 3,
        name: 'DRONE INTERCEPT',
        subtitle: 'HOSTILE VANGUARD STRIKE',
        objectiveDescription: 'Intercept and destroy the enemy scout drone strike wave.',
        minRouteProgress: 0.33,
        targetKills: 6,
        currentKills: 0,
        isCompleted: false,
      },
      {
        id: 'AMBUSH_CROSSFIRE',
        eventNumber: 4,
        name: 'AMBUSH CROSSFIRE',
        subtitle: 'MULTI-VECTOR PIRATE FLANK',
        objectiveDescription: 'Defend flanking cargo transports from heavy gunship ambushers.',
        minRouteProgress: 0.48,
        targetKills: 8,
        currentKills: 0,
        isCompleted: false,
      },
      {
        id: 'HULL_BREACH',
        eventNumber: 5,
        name: 'HULL BREACH & REPAIR',
        subtitle: 'FIELD NANITE RESTORATION',
        objectiveDescription: 'Retrieve field nanite repair canisters to restore damaged cargo transports.',
        minRouteProgress: 0.64,
        isCompleted: false,
      },
      {
        id: 'FINAL_APPROACH',
        eventNumber: 6,
        name: 'FINAL APPROACH',
        subtitle: 'CITADEL SECTOR TRANSIT',
        objectiveDescription: 'Escort surviving fleet through the defense matrix corridor.',
        minRouteProgress: 0.78,
        targetProgress: 0.90,
        isCompleted: false,
      },
      {
        id: 'FINAL_DEFENSE',
        eventNumber: 7,
        name: 'FINAL DEFENSE & EXTRACTION',
        subtitle: 'EXTRACTION GATE DOCKING',
        objectiveDescription: 'Hold the perimeter against all hostiles until the convoy docks into the Extraction Gate!',
        minRouteProgress: 0.90,
        isCompleted: false,
      },
    ];
  }

  /**
   * Start Convoy Guardian Mission
   */
  public startMission(playerShipDefId: string = 'VR-0001', variant: ConvoyVariant = 'SAVIOUR') {
    this.cleanUp();
    this.isActive = true;
    this.isPaused = false;
    this.missionState = 'ACTIVE';
    this.variant = variant;
    this.timeElapsed = 0;
    this.routeProgress = 0.0;
    this.dockingStarted = false;
    this.dockingElapsed = 0;
    this.emergencyPhase = 'PARKING';
    this.emergencyPhaseElapsed = 0;
    this.dockedShipIds.clear();
    this.barrierHitCooldown = 0;
    this.currentEventIndex = 0;
    this.dronesDestroyedCount = 0;
    this.debrisClearedCount = 0;
    this.repairsCollectedCount = 0;
    this.finalStats = null;
    this.initEvents();

    if (this.scene) {
      convoyEnvironment.build(this.scene);
    }

    if (variant === 'SAVIOUR') {
      this.spawnConvoyFleet();
      this.addNotification('SAVIOUR: CONVOY ESCORT INITIATED — FLEET EN ROUTE', 'EVENT');
    } else {
      this.spawnHunterFormation();
      this.addNotification('HUNTERS: ELIMINATE THE FORMATION AND DESTROY THE 1,000 HP BOSS', 'ALERT');
    }
    this.spawnPlayer(playerShipDefId);
    sound.playWormholeWarp();
  }

  /** Exact Hunters formation: 3 front main, 2 forward-mid, boss + 6 guards, 2 rear-mid, 3 rear main. */
  private spawnHunterFormation() {
    this.convoyShips = [];
    this.dockingStarted = false;
    this.dockingElapsed = 0;
    this.emergencyPhase = 'PARKING';
    this.emergencyPhaseElapsed = 0;
    this.dockedShipIds.clear();
    this.enemyDrones = [];
    const spawn = (role: NonNullable<EnemyDrone['role']>, type: EnemyDrone['type'], x: number, y: number, z: number, health: number, speed: number, damage: number) => {
      const position = new THREE.Vector3(x, y, z);
      const mesh = this.createDroneMesh(type);
      mesh.position.copy(position);
      if (role === 'BOSS') mesh.scale.setScalar(3.2);
      if (role === 'DEFENSE_DRONE') mesh.scale.setScalar(0.8);
      this.combatGroup.add(mesh);
      this.enemyDrones.push({
        id: `hunter_${role.toLowerCase()}_${this.enemyDrones.length + 1}`,
        type, role, health, maxHealth: health, isAlive: true, position,
        rotation: new THREE.Euler(), velocity: new THREE.Vector3(), targetId: 'player',
        attackCooldown: 0.6 + Math.random() * 1.2, fireRate: role === 'BOSS' ? 0.8 : role === 'DEFENSE_DRONE' ? 1.1 : 0.7,
        speed, damage, mesh, hitFlashTimer: 0,
      });
    };
    // Player travels toward -Z; formation is laid out ahead, with a clear boss center.
    [-150, 0, 150].forEach((x, i) => spawn('MAIN_HUNTER', 'MAIN_HUNTER', x, 35, -520 - (i === 1 ? 30 : 0), 110, 78, 9));
    [-95, 95].forEach((x) => spawn('MID_HUNTER', 'MID_HUNTER', x, 65, -650, 160, 65, 12));
    spawn('BOSS', 'BOSS', 0, 20, -900, 1000, 42, 22);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      spawn('DEFENSE_DRONE', 'DEFENSE_DRONE', Math.cos(angle) * 100, 20 + Math.sin(angle) * 65, -900 + Math.sin(angle) * 100, 90, 92, 8);
    }
    [-95, 95].forEach((x) => spawn('MID_HUNTER', 'MID_HUNTER', x, -35, -1120, 160, 65, 12));
    [-180, -60, 60].forEach((x, i) => spawn('MAIN_HUNTER', 'MAIN_HUNTER', x, -55, -1280 - (i === 1 ? 25 : 0), 110, 78, 9));
  }

  private spawnConvoyFleet() {
    this.convoyShips = [];

    // SAVIOUR: exactly 9 convoy ships — 1 front lead guard, 2 forward-mid guards, 3 protected cargo ships, 2 rear-mid guards, and 1 rear guard.
    // 1. Front Lead Guard (1)
    const leadMesh = this.createTransportMesh(true, 0x0f766e, 0x14b8a6);
    this.combatGroup.add(leadMesh);

    const leadShip: ConvoyShipState = {
      id: 'convoy_lead_01',
      name: 'AEGIS LEAD VANGUARD',
      isLead: true,
      role: 'LEAD_GUARD',
      health: 800,
      maxHealth: 800,
      shield: 300,
      maxShield: 300,
      isAlive: true,
      isDestroyed: false,
      status: 'NOMINAL',
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, Math.PI, 0),
      velocity: new THREE.Vector3(),
      targetOffset: new THREE.Vector3(0, 0, -85),
      routeProgress: 0.0,
      speed: this.convoySpeed,
      mesh: leadMesh,
      hitFlashTimer: 0,
    };
    this.convoyShips.push(leadShip);

    // 2. Forward-Mid Guards (2)
    const fwdGuards = [
      { id: 'guard_fwd_port', name: 'PORT FORWARD GUARD', offset: new THREE.Vector3(-65, 15, -35) },
      { id: 'guard_fwd_starboard', name: 'STARBOARD FORWARD GUARD', offset: new THREE.Vector3(65, 15, -35) },
    ];
    fwdGuards.forEach((g) => {
      const mesh = this.createEscortMesh(0x064e3b, 0x34d399);
      this.combatGroup.add(mesh);
      this.convoyShips.push({
        id: g.id,
        name: g.name,
        isLead: false,
        role: 'FORWARD_MID_GUARD',
        health: 500,
        maxHealth: 500,
        shield: 200,
        maxShield: 200,
        isAlive: true,
        isDestroyed: false,
        status: 'NOMINAL',
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(0, Math.PI, 0),
        velocity: new THREE.Vector3(),
        targetOffset: g.offset,
        routeProgress: 0.0,
        speed: this.convoySpeed,
        mesh,
        hitFlashTimer: 0,
      });
    });

    // 3. Protected Cargo Ships (3)
    const cargoShips = [
      { id: 'cargo_alpha', name: 'CARGO HAULER ALPHA', offset: new THREE.Vector3(-45, -8, 25) },
      { id: 'cargo_beta', name: 'CARGO HAULER BETA', offset: new THREE.Vector3(0, 10, 45) },
      { id: 'cargo_gamma', name: 'CARGO HAULER GAMMA', offset: new THREE.Vector3(45, -8, 25) },
    ];
    cargoShips.forEach((c) => {
      const mesh = this.createTransportMesh(false, 0x042f2e, 0x2dd4bf);
      this.combatGroup.add(mesh);
      this.convoyShips.push({
        id: c.id,
        name: c.name,
        isLead: false,
        role: 'CARGO',
        health: 450,
        maxHealth: 450,
        shield: 160,
        maxShield: 160,
        isAlive: true,
        isDestroyed: false,
        status: 'NOMINAL',
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(0, Math.PI, 0),
        velocity: new THREE.Vector3(),
        targetOffset: c.offset,
        routeProgress: 0.0,
        speed: this.convoySpeed,
        mesh,
        hitFlashTimer: 0,
      });
    });

    // 4. Rear-Mid Guards (2)
    const rearGuards = [
      { id: 'guard_rear_port', name: 'PORT REAR GUARD', offset: new THREE.Vector3(-55, 12, 100) },
      { id: 'guard_rear_starboard', name: 'STARBOARD REAR GUARD', offset: new THREE.Vector3(55, 12, 100) },
    ];
    rearGuards.forEach((g) => {
      const mesh = this.createEscortMesh(0x064e3b, 0x34d399);
      this.combatGroup.add(mesh);
      this.convoyShips.push({
        id: g.id,
        name: g.name,
        isLead: false,
        role: 'REAR_MID_GUARD',
        health: 500,
        maxHealth: 500,
        shield: 200,
        maxShield: 200,
        isAlive: true,
        isDestroyed: false,
        status: 'NOMINAL',
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(0, Math.PI, 0),
        velocity: new THREE.Vector3(),
        targetOffset: g.offset,
        routeProgress: 0.0,
        speed: this.convoySpeed,
        mesh,
        hitFlashTimer: 0,
      });
    });

    // 5. Rear Guard (1)
    const sternMesh = this.createEscortMesh(0x042f2e, 0x10b981);
    this.combatGroup.add(sternMesh);
    this.convoyShips.push({
      id: 'guard_tail',
      name: 'STERN REAR GUARD',
      isLead: false,
      role: 'REAR_GUARD',
      health: 550,
      maxHealth: 550,
      shield: 220,
      maxShield: 220,
      isAlive: true,
      isDestroyed: false,
      status: 'NOMINAL',
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(0, Math.PI, 0),
      velocity: new THREE.Vector3(),
      targetOffset: new THREE.Vector3(0, -15, 155),
      routeProgress: 0.0,
      speed: this.convoySpeed,
      mesh: sternMesh,
      hitFlashTimer: 0,
    });

    this.updateFleetPositions(0);
  }

  private createEscortMesh(primaryHex: number, accentHex: number): THREE.Group {
    const group = new THREE.Group();
    const length = 38;
    const width = 18;
    const height = 12;
    const bodyGeo = new THREE.ConeGeometry(width * 0.6, length, 5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.85,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    for (let side = -1; side <= 1; side += 2) {
      const wingGeo = new THREE.BoxGeometry(width * 0.65, height * 0.15, length * 0.5);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.9,
        roughness: 0.25,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * (width * 0.55), 0, length * 0.1);
      group.add(wing);
    }

    const flameGeo = new THREE.ConeGeometry(3, 16, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.85 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(0, 0, length * 0.5 + 8);
    group.add(flame);

    return group;
  }

  private createTransportMesh(isLead: boolean, primaryHex: number, accentHex: number): THREE.Group {
    const group = new THREE.Group();

    // Heavy Industrial Hull (Spanning 40-70m long)
    const length = isLead ? 65 : 44;
    const width = isLead ? 28 : 20;
    const height = isLead ? 22 : 16;

    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.85,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Cargo Containers on sides
    for (let side = -1; side <= 1; side += 2) {
      const podGeo = new THREE.CylinderGeometry(height * 0.4, height * 0.4, length * 0.75, 12);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.9,
        roughness: 0.25,
      });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(side * (width * 0.65), 0, 0);
      group.add(pod);
    }

    // Command Bridge Tower
    const bridgeGeo = new THREE.BoxGeometry(width * 0.45, height * 0.6, length * 0.3);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: accentHex,
      emissiveIntensity: 0.4,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, height * 0.65, length * 0.2);
    group.add(bridge);

    // Twin High-Energy Thruster Plumes
    for (let side = -1; side <= 1; side += 2) {
      const flameGeo = new THREE.ConeGeometry(isLead ? 5 : 3.5, isLead ? 25 : 18, 12);
      const flameMat = new THREE.MeshBasicMaterial({
        color: accentHex,
        transparent: true,
        opacity: 0.8,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(side * (width * 0.35), 0, length * 0.55 + (isLead ? 12 : 9));
      group.add(flame);
    }

    return group;
  }

  private spawnPlayer(shipDefId: string) {
    this.playerRot.set(0, 0, 0); // Align the cannons and forward vector with the route's -Z travel direction.
    this.playerHealth = 100;
    this.playerShield = 80;
    this.playerBoostCharge = 100;
    this.empCooldown = 0;
    this.isShielding = false;
    this.isTouchShielding = false;

    // Start slightly behind the lead transport
    const startPoint = convoyEnvironment.getRoutePoint(0.0);
    this.playerPos.copy(startPoint).add(new THREE.Vector3(0, 15, 80));
    this.playerVel.set(0, 0, 0);

    if (this.playerShipMesh) {
      this.combatGroup.remove(this.playerShipMesh);
    }

    this.playerShipMesh = createProceduralShipMesh(shipDefId, {
      primaryColorHex: '#14b8a6',
      secondaryColorHex: '#0f766e',
      accentColorHex: '#f59e0b',
      thrusterFlameColor: '#00f0ff',
    });
    this.playerShipMesh.position.copy(this.playerPos);
    this.combatGroup.add(this.playerShipMesh);
  }

  // =========================================================================
  // MAIN TICK UPDATE (CALLED AUTHORITATIVELY EACH FRAME)
  // =========================================================================
  public update(dt: number) {
    if (!this.isActive || this.isPaused || this.missionState !== 'ACTIVE') return;

    this.timeElapsed += dt;
    this.barrierHitCooldown = Math.max(0, this.barrierHitCooldown - dt);
    this.routeHazardHitCooldown = Math.max(0, this.routeHazardHitCooldown - dt);
    this.variantAbilityCooldown = Math.max(0, this.variantAbilityCooldown - dt);
    this.hunterOverdriveTimer = Math.max(0, this.hunterOverdriveTimer - dt);

    // Saviour escorts progress along the route; Hunters is a combat arena on the same physical route.
    if (this.variant === 'SAVIOUR') this.updateConvoyProgression(dt);

    // 2. Player Flight Physics & Camera
    this.updatePlayer(dt);

    // 3. Enemy Drones AI & Spawning
    this.updateEnemies(dt);

    // 4. Projectiles & Collision Handling
    this.updateProjectiles(dt);

    // 5. Physical Asteroid and timed energy barrier collisions
    this.updateAsteroidCollisions(dt);
    if (this.barrierHitCooldown <= 0 && convoyEnvironment.isBarrierCollision(this.playerPos)) {
      this.applyDamageToPlayer(18);
      this.playerVel.multiplyScalar(0.55);
      this.barrierHitCooldown = 1.1;
      this.addNotification('ENERGY BARRIER IMPACT — TIMING WINDOW MISSED', 'WARNING');
    }
    if (this.routeHazardHitCooldown <= 0) {
      const hazardHit = convoyEnvironment.getRouteHazardCollision(this.playerPos);
      if (hazardHit) {
        const shieldedDamage = this.isShielding ? Math.ceil(hazardHit.damage * 0.25) : hazardHit.damage;
        this.applyDamageToPlayer(shieldedDamage);
        this.playerVel.multiplyScalar(hazardHit.kind.includes('GRAVITY') || hazardHit.kind.includes('SINGULARITY') ? 0.62 : 0.72);
        this.routeHazardHitCooldown = 1.35;
        this.addNotification(`${hazardHit.kind} IMPACT — ${shieldedDamage} HULL DAMAGE`, 'WARNING');
      }
    }

    // 6. Repair Pickups Collision
    this.updateRepairPickups();

    // 7. Mission Events State Machine Progression
    if (this.variant === 'SAVIOUR') this.updateMissionEvents(dt);

    // 8. Environment Animated Updates
    convoyEnvironment.update(dt);

    // 9. Check Victory / Defeat Conditions
    this.checkVictoryDefeat();
  }

  private updateConvoyProgression(dt: number) {
    // Normal rate of travel along 6,000m route
    if (this.dockingStarted) {
      this.updateSequentialDocking(dt);
      return;
    }
    const progressInc = (this.convoySpeed * dt) / convoyEnvironment.totalRouteLength;
    this.routeProgress = Math.min(1.0, this.routeProgress + progressInc);

    this.updateFleetPositions(dt);
  }


  /** Emergency Escape Sequence 1: park the convoy, lock down the basement, then release the player through the emergency exit. */
  private updateSequentialDocking(dt: number) {
    this.dockingElapsed += Math.min(dt, 0.05);
    const ships = this.convoyShips.filter((ship) => ship.isAlive);
    if (!ships.length) return;
    const slotDuration = 2.6;

    if (this.emergencyPhase === 'PARKING') {
      ships.forEach((ship, index) => {
        const start = index * slotDuration;
        const localT = Math.max(0, Math.min(1, (this.dockingElapsed - start) / 1.8));
        const target = convoyEnvironment.getParkingPosition(index);
        if (this.dockingElapsed < start) {
          convoyEnvironment.setParkingBayState(index, false, false);
          return;
        }
        convoyEnvironment.setParkingBayState(index, localT < 1, localT >= 1);
        const approach = target.clone().add(new THREE.Vector3(0, 0, 180));
        ship.position.lerpVectors(approach, target, localT);
        if (ship.mesh) {
          ship.mesh.visible = true;
          ship.mesh.position.copy(ship.position);
          ship.mesh.rotation.set(0, Math.PI, 0);
        }
        if (localT >= 1 && ship.status !== 'DOCKED') {
          ship.status = 'DOCKED';
          this.dockedShipIds.add(ship.id);
          this.addNotification(`${ship.name}: PHYSICAL PARKING LOCKS ENGAGED — BAY ${String(index + 1).padStart(2, '0')} SECURE`, 'SUCCESS');
          sound.playCheckpoint();
        }
      });

      if (this.dockingElapsed >= ships.length * slotDuration + 0.4) {
        this.emergencyPhase = 'LOCKDOWN';
        this.emergencyPhaseElapsed = 0;
        this.addNotification('EMERGENCY LOCKDOWN — BASEMENT BLAST DOORS CLOSING. PLAYER SHIP MUST PREPARE TO ESCAPE.', 'ALERT');
        const lockdownEvent = this.events[this.currentEventIndex];
        if (lockdownEvent) { lockdownEvent.subtitle = 'BASEMENT LOCKDOWN'; lockdownEvent.objectiveDescription = 'Convoy ships are clamped in their bays. Survive lockdown and prepare to reach the emergency exit.'; }
        convoyEnvironment.setEmergencyExitOpen(false);
      }
      return;
    }

    if (this.emergencyPhase === 'LOCKDOWN') {
      this.emergencyPhaseElapsed += Math.min(dt, 0.05);
      if (this.emergencyPhaseElapsed >= 3.0) {
        this.emergencyPhase = 'ESCAPE';
        this.emergencyPhaseElapsed = 0;
        convoyEnvironment.setEmergencyExitOpen(true);
        const escapeEvent = this.events[this.currentEventIndex];
        if (escapeEvent) { escapeEvent.subtitle = 'EMERGENCY ESCAPE'; escapeEvent.objectiveDescription = 'Fly through the open emergency blast gate beyond the basement parking bays.'; }
        this.addNotification('EMERGENCY EXIT UNLOCKED — FLY THROUGH THE RED EXIT GATE TO COMPLETE ESCAPE SEQUENCE 1', 'EVENT');
      }
      return;
    }

    // The convoy stays clamped in the basement. The player must physically fly through the unlocked emergency exit.
    const exitPosition = convoyEnvironment.getEmergencyExitPosition();
    const exitDistance = this.playerPos.distanceTo(exitPosition);
    if (exitDistance < 105 && this.playerVel.z < 0) {
      this.addNotification('EMERGENCY ESCAPE COMPLETE — CONVOY SECURED, PLAYER SHIP CLEAR OF BASEMENT', 'SUCCESS');
      this.triggerVictory();
    } else if (this.timeElapsed % 8 < dt) {
      this.addNotification(`EMERGENCY EXIT: ${Math.round(exitDistance)}m — ALIGN WITH THE EXIT SENSOR`, 'EVENT');
    }
  }

  private updateFleetPositions(dt: number) {
    const up = new THREE.Vector3(0, 1, 0);

    this.convoyShips.forEach((ship) => {
      if (!ship.isAlive) {
        if (ship.mesh) ship.mesh.visible = false;
        return;
      }

      // Every surviving ship follows the same fixed Catmull-Rom route. Escorts trail the
      // lead ship by their configured longitudinal spacing instead of cutting across bends.
      const trailingDistance = Math.max(0, ship.targetOffset.z);
      const shipProgress = Math.max(0, Math.min(1, this.routeProgress - trailingDistance / convoyEnvironment.totalRouteLength));
      ship.routeProgress = shipProgress;
      const routePt = convoyEnvironment.getRoutePoint(shipProgress);
      const tangent = convoyEnvironment.getRouteTangent(shipProgress);
      const normal = new THREE.Vector3().crossVectors(up, tangent).normalize();
      if (normal.lengthSq() < 0.0001) normal.set(1, 0, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const worldTarget = routePt.clone()
        .addScaledVector(normal, ship.targetOffset.x)
        .addScaledVector(binormal, ship.targetOffset.y);

      // Smooth movement keeps the formation stable while every ship stays attached to the route.
      ship.position.lerp(worldTarget, Math.min(1.0, dt * 4.0));
      ship.velocity.copy(tangent).multiplyScalar(ship.speed);

      if (ship.mesh) {
        ship.mesh.position.copy(ship.position);
        ship.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);
      }

      if (ship.hitFlashTimer > 0) ship.hitFlashTimer -= dt;
      if (ship.shield < ship.maxShield) {
        ship.shield = Math.min(ship.maxShield, ship.shield + 8 * dt);
      }
    });
  }

  private updatePlayer(dt: number) {
    const keys = this.keysDown;
    const accel = 140;
    const turn = 2.8;

    // Pitch & Yaw Controls: Keyboard (WASD/Arrows) + Cyber Flight Joystick
    if (keys['KeyW'] || keys['ArrowUp']) this.playerRot.x -= turn * dt;
    if (keys['KeyS'] || keys['ArrowDown']) this.playerRot.x += turn * dt;
    if (Math.abs(this.joystickPitchY) > 0.04) {
      this.playerRot.x -= this.joystickPitchY * turn * dt;
    }

    if (keys['KeyA'] || keys['ArrowLeft']) this.playerRot.y += turn * dt;
    if (keys['KeyD'] || keys['ArrowRight']) this.playerRot.y -= turn * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      this.playerRot.y -= this.joystickSteerX * turn * dt;
    }

    // Aerodynamic Roll Banking
    if (keys['KeyQ']) this.playerRot.z += turn * 1.5 * dt;
    if (keys['KeyE']) this.playerRot.z -= turn * 1.5 * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      this.playerRot.z = THREE.MathUtils.lerp(this.playerRot.z, -this.joystickSteerX * 0.45, dt * 5);
    } else if (!keys['KeyQ'] && !keys['KeyE']) {
      this.playerRot.z = THREE.MathUtils.lerp(this.playerRot.z, 0, dt * 2.5);
    }

    // Forward Direction Vector; longitudinal touch input moves along this ship-local axis.
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.playerRot);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(this.playerRot);
    const up = new THREE.Vector3(0, 1, 0).applyEuler(this.playerRot);
    if (this.sixAxisInput.longitudinal !== 0) this.playerVel.addScaledVector(fwd, this.sixAxisInput.longitudinal * accel * 1.35 * dt);
    if (this.sixAxisInput.lateral !== 0) this.playerVel.addScaledVector(right, this.sixAxisInput.lateral * accel * 1.15 * dt);
    if (this.sixAxisInput.vertical !== 0) this.playerVel.addScaledVector(up, this.sixAxisInput.vertical * accel * 1.15 * dt);

    // Boost Handling
    this.isBoosting =
      (this.isTouchBoosting || keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space']) &&
      this.playerBoostCharge > 0;

    const braking = this.isTouchBraking || !!(keys['ControlLeft'] || keys['ControlRight'] || keys['KeyX']);
    const maxSpeed = braking ? 85 : this.isBoosting ? 260 : 150;
    this.isShielding = (!!keys['KeyC'] || this.isTouchShielding) && this.playerShield > 0;
    this.empCooldown = Math.max(0, this.empCooldown - dt);
    if (this.isBoosting) {
      this.playerBoostCharge = Math.max(0, this.playerBoostCharge - 26 * dt);
      this.playerVel.addScaledVector(fwd, accel * 2.2 * dt);
    } else {
      this.playerBoostCharge = Math.min(100, this.playerBoostCharge + 15 * dt);
      this.playerVel.addScaledVector(fwd, accel * dt);
    }

    // Drag / Speed Cap
    if (this.playerVel.length() > maxSpeed) {
      this.playerVel.setLength(maxSpeed);
    }
    this.playerVel.multiplyScalar(braking ? 0.91 : 0.985);
    if (this.isShielding) this.playerShield = Math.max(0, this.playerShield - 14 * dt);
    this.playerPos.addScaledVector(this.playerVel, dt);

    // Shield Regeneration
    if (!this.isShielding && this.playerShield < this.playerMaxShield) {
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 6 * dt);
    }

    // Primary Weapons Fire
    this.fireCooldown -= dt;
    if (this.isTouchFiring || keys['Space'] || keys['KeyF'] || keys['MouseButton0']) {
      if (this.fireCooldown <= 0) {
        this.firePlayerLaser();
        this.fireCooldown = 0.16; // 6 shots/sec
      }
    }

    // Sync Player 3D Mesh
    if (this.playerShipMesh) {
      this.playerShipMesh.position.copy(this.playerPos);
      this.playerShipMesh.rotation.copy(this.playerRot);
    }

    // Smooth Chase Camera Tracking
    if (this.camera) {
      const camOffset = new THREE.Vector3(0, 12, 36).applyEuler(this.playerRot);
      const targetCam = this.playerPos.clone().add(camOffset);
      this.camera.position.lerp(targetCam, Math.min(1.0, 10 * dt));

      const lookTarget = this.playerPos.clone().add(fwd.clone().multiplyScalar(70));
      this.camera.lookAt(lookTarget);
    }
  }

  private firePlayerLaser() {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.playerRot);
    sound.playMissileLaunch();

    // Twin laser cannons
    [-4, 4].forEach((offset) => {
      const side = new THREE.Vector3(offset, -1, -5).applyEuler(this.playerRot);
      const spawnPos = this.playerPos.clone().add(side);

      const geo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fwd);
      mesh.position.copy(spawnPos);
      this.combatGroup.add(mesh);

      this.projectiles.push({
        id: `proj_p_${Date.now()}_${Math.random()}`,
        owner: 'PLAYER',
        position: spawnPos,
        velocity: fwd.clone().multiplyScalar(420),
        damage: this.variant === 'HUNTERS' && this.hunterOverdriveTimer > 0 ? 38 : 22,
        radius: 3,
        lifetime: 2.2,
        color: new THREE.Color(0x14b8a6),
        mesh,
      });
    });
  }

  private updateEnemies(dt: number) {
    // Enemy AI & Movement
    for (let i = this.enemyDrones.length - 1; i >= 0; i--) {
      const drone = this.enemyDrones[i];
      if (!drone.isAlive) continue;

      // Hunters formation uses the player as the target; escort enemies may target transports.
      let targetPos = this.playerPos;
      const targetShip = this.variant === 'SAVIOUR' ? this.convoyShips.find((s) => s.id === drone.targetId && s.isAlive) : undefined;
      if (targetShip) {
        targetPos = targetShip.position;
      }

      // Steer toward target
      const toTarget = targetPos.clone().sub(drone.position);
      const dist = toTarget.length();
      const dir = toTarget.normalize();

      // Hunters' defence drones keep their orbit; other hostiles actively pursue their target.
      const isOrbitingGuard = drone.role === 'DEFENSE_DRONE';
      if (!isOrbitingGuard) {
        drone.velocity.lerp(dir.clone().multiplyScalar(drone.speed), Math.min(1, dt * 3.0));
        drone.position.addScaledVector(drone.velocity, dt);
      } else {
        const boss = this.enemyDrones.find((e) => e.role === 'BOSS' && e.isAlive);
        if (boss) {
          const defenseDrones = this.enemyDrones.filter((e) => e.role === 'DEFENSE_DRONE');
          const droneIdx = defenseDrones.indexOf(drone);
          const orbitAngle = (droneIdx / Math.max(1, defenseDrones.length)) * Math.PI * 2 + this.timeElapsed * 0.9;
          drone.position.set(
            boss.position.x + Math.cos(orbitAngle) * 95,
            boss.position.y + Math.sin(orbitAngle) * 60,
            boss.position.z + Math.sin(orbitAngle * 2) * 35
          );
        }
        drone.velocity.set(0, 0, 0);
      }

      // Orient mesh forward
      if (drone.mesh) {
        drone.mesh.position.copy(drone.position);
        drone.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
      }

      // EMP temporarily suppresses enemy weapons without deleting enemy state.
      if ((drone.disabledTimer || 0) > 0) drone.disabledTimer = Math.max(0, (drone.disabledTimer || 0) - dt);
      // Attack firing cooldown
      drone.attackCooldown -= dt;
      if (!(drone.disabledTimer && drone.disabledTimer > 0) && drone.attackCooldown <= 0 && dist < 420) {
        this.fireEnemyLaser(drone, targetPos);
        drone.attackCooldown = 1 / drone.fireRate;
      }
    }
  }

  private fireEnemyLaser(drone: EnemyDrone, targetPos: THREE.Vector3) {
    const dir = targetPos.clone().sub(drone.position).normalize();
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 9, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh.position.copy(drone.position);
    this.combatGroup.add(mesh);

    this.projectiles.push({
      id: `proj_e_${Date.now()}_${Math.random()}`,
      owner: 'ENEMY',
      position: drone.position.clone(),
      velocity: dir.multiplyScalar(280),
      damage: drone.damage,
      radius: 3,
      lifetime: 2.5,
      color: new THREE.Color(0xf43f5e),
      mesh,
    });
  }

  private spawnDroneWave(count: number, type: 'SCOUT' | 'FIGHTER' | 'GUNSHIP') {
    const routePt = convoyEnvironment.getRoutePoint(this.routeProgress);
    const tangent = convoyEnvironment.getRouteTangent(this.routeProgress);

    sound.playAlarmAlert();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnOffset = new THREE.Vector3(
        Math.cos(angle) * 320,
        ((i % 3) - 1) * 60,
        Math.sin(angle) * 320 - 450 // Ahead of convoy
      );
      const spawnPos = routePt.clone().add(spawnOffset);

      // Pick target
      const aliveTransports = this.convoyShips.filter((s) => s.isAlive);
      const targetId =
        aliveTransports.length > 0 && Math.random() > 0.35
          ? aliveTransports[Math.floor(Math.random() * aliveTransports.length)].id
          : 'player';

      const mesh = this.createDroneMesh(type);
      mesh.position.copy(spawnPos);
      this.combatGroup.add(mesh);

      const health = type === 'GUNSHIP' ? 120 : type === 'FIGHTER' ? 65 : 35;
      const speed = type === 'SCOUT' ? 120 : type === 'FIGHTER' ? 95 : 70;
      const damage = type === 'GUNSHIP' ? 18 : type === 'FIGHTER' ? 10 : 6;

      this.enemyDrones.push({
        id: `drone_${Date.now()}_${Math.random()}`,
        type,
        health,
        maxHealth: health,
        isAlive: true,
        position: spawnPos,
        rotation: new THREE.Euler(),
        velocity: tangent.clone().multiplyScalar(speed * 0.5),
        targetId,
        attackCooldown: 1.0 + Math.random() * 1.5,
        fireRate: type === 'GUNSHIP' ? 1.5 : 0.8,
        speed,
        damage,
        mesh,
        hitFlashTimer: 0,
      });
    }
  }

  private createDroneMesh(type: EnemyDrone['type']): THREE.Group {
    const group = new THREE.Group();
    const color = type === 'BOSS' ? 0x7c3aed : type === 'DEFENSE_DRONE' ? 0x38bdf8 : type === 'GUNSHIP' ? 0x991b1b : type === 'FIGHTER' || type === 'MID_HUNTER' ? 0xd97706 : 0xdc2626;

    // Sleek geometric aggressive drone chassis
    const heavy = type === 'GUNSHIP' || type === 'BOSS';
    const bodyGeo = new THREE.ConeGeometry(heavy ? 10 : type === 'DEFENSE_DRONE' ? 3 : 4.5, heavy ? 30 : 14, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0xff0044,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = -Math.PI / 2;
    group.add(body);

    // Glowing Sensor Eye
    const eyeGeo = new THREE.SphereGeometry(heavy ? 4 : 1.8, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: type === 'BOSS' ? 0xc084fc : type === 'DEFENSE_DRONE' ? 0x67e8f9 : 0xff0044 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 1.5, -6);
    group.add(eye);

    return group;
  }

  private updateProjectiles(dt: number) {
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];
      p.lifetime -= dt;

      if (p.lifetime <= 0) {
        if (p.mesh) this.combatGroup.remove(p.mesh);
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      if (p.mesh) p.mesh.position.copy(p.position);

      // Check collision
      if (p.owner === 'PLAYER') {
        // Player hitting Enemy Drones
        let hit = false;
        for (let dIdx = 0; dIdx < this.enemyDrones.length; dIdx++) {
          const drone = this.enemyDrones[dIdx];
          if (!drone.isAlive) continue;

          const hitRadius = (drone.mesh?.scale.x || 1) * (drone.role === 'BOSS' ? 28 : drone.role === 'DEFENSE_DRONE' ? 8 : 12) + p.radius;
          if (p.position.distanceTo(drone.position) < hitRadius) {
            const guardsAlive = this.enemyDrones.filter((e) => e.role === 'DEFENSE_DRONE' && e.isAlive).length;
            const appliedDamage = drone.role === 'BOSS' ? p.damage * (1 - Math.min(0.75, guardsAlive * 0.125)) : p.damage;
            drone.health -= appliedDamage;
            sound.playShieldHit();
            hit = true;

            if (drone.health <= 0) {
              drone.isAlive = false;
              if (drone.mesh) this.combatGroup.remove(drone.mesh);
              this.dronesDestroyedCount++;
              sound.playMissileExplosion();
              if (drone.role === 'DEFENSE_DRONE') this.addNotification(`BOSS DEFENCE WEAKENED — ${Math.max(0, guardsAlive - 1)} GUARD DRONES REMAIN`, 'SUCCESS');
              if (drone.role === 'BOSS') this.addNotification('BOSS DESTROYED — HUNTERS VICTORY', 'SUCCESS');

              // Update event target kills
              const curEvent = this.events[this.currentEventIndex];
              if (curEvent.targetKills !== undefined) {
                curEvent.currentKills = (curEvent.currentKills || 0) + 1;
              }
            }
            break;
          }
        }

        // Player hitting Asteroids
        if (!hit) {
          for (let aIdx = 0; aIdx < convoyEnvironment.asteroids.length; aIdx++) {
            const ast = convoyEnvironment.asteroids[aIdx];
            if (ast.health <= 0) continue;

            if (p.position.distanceTo(ast.position) < ast.radius + p.radius) {
              ast.health -= p.damage;
              hit = true;
              sound.playAsteroidHit();

              if (ast.health <= 0) {
                if (ast.mesh) convoyEnvironment.group.remove(ast.mesh);
                this.debrisClearedCount++;
                sound.playCrash();
              }
              break;
            }
          }
        }

        if (hit) {
          if (p.mesh) this.combatGroup.remove(p.mesh);
          this.projectiles.splice(pIdx, 1);
          continue;
        }
      } else if (p.owner === 'ENEMY') {
        // Enemy laser hitting Convoy Ships
        let hit = false;
        for (const ship of this.convoyShips) {
          if (!ship.isAlive) continue;

          if (p.position.distanceTo(ship.position) < 22) {
            this.applyDamageToConvoyShip(ship, p.damage);
            hit = true;
            break;
          }
        }

        // Enemy laser hitting Player
        if (!hit && p.position.distanceTo(this.playerPos) < 12) {
          this.applyDamageToPlayer(p.damage);
          hit = true;
        }

        if (hit) {
          if (p.mesh) this.combatGroup.remove(p.mesh);
          this.projectiles.splice(pIdx, 1);
          continue;
        }
      }
    }
  }

  private applyDamageToConvoyShip(ship: ConvoyShipState, amount: number) {
    if (ship.shield > 0) {
      ship.shield = Math.max(0, ship.shield - amount);
      sound.playShieldDeflect();
    } else {
      ship.health = Math.max(0, ship.health - amount);
      sound.playHeavyImpact();
    }

    ship.hitFlashTimer = 0.2;

    // Update status
    const pct = (ship.health / ship.maxHealth) * 100;
    if (ship.health <= 0) {
      ship.isAlive = false;
      ship.isDestroyed = true;
      ship.status = 'DESTROYED';
      this.addNotification(`${ship.name} DESTROYED!`, 'ALERT');
      sound.playCrash();
    } else if (pct < 30) {
      ship.status = 'CRITICAL';
    } else if (pct < 70) {
      ship.status = 'DAMAGED';
    } else {
      ship.status = 'NOMINAL';
    }
  }

  private applyDamageToPlayer(amount: number) {
    if (this.isShielding) amount *= 0.25;
    if (this.playerShield > 0) {
      this.playerShield = Math.max(0, this.playerShield - amount);
      sound.playShieldHit();
    } else {
      this.playerHealth = Math.max(0, this.playerHealth - amount);
      sound.playHeavyImpact();
    }
  }

  private updateAsteroidCollisions(dt: number) {
    // Physical debris collisions with player and convoy
    convoyEnvironment.asteroids.forEach((ast) => {
      if (ast.health <= 0) return;

      // Check collision with player
      if (this.playerPos.distanceTo(ast.position) < ast.radius + 6) {
        this.applyDamageToPlayer(15);
        this.playerVel.multiplyScalar(-0.5); // Rebound bounce
      }

      // Check collision with convoy ships
      this.convoyShips.forEach((ship) => {
        if (!ship.isAlive) return;
        if (ship.position.distanceTo(ast.position) < ast.radius + 18) {
          this.applyDamageToConvoyShip(ship, 35);
          ast.health = 0;
          if (ast.mesh) convoyEnvironment.group.remove(ast.mesh);
        }
      });
    });
  }

  private updateRepairPickups() {
    convoyEnvironment.repairPickups.forEach((pickup) => {
      if (pickup.collected) return;

      // Collected by player flying near it
      if (this.playerPos.distanceTo(pickup.position) < 35) {
        pickup.collected = true;
        if (pickup.mesh) convoyEnvironment.group.remove(pickup.mesh);
        this.repairsCollectedCount++;
        sound.playRepairCore();

        // Restore health to all damaged convoy ships
        this.convoyShips.forEach((s) => {
          if (s.isAlive) {
            s.health = Math.min(s.maxHealth, s.health + pickup.healAmount);
            s.shield = s.maxShield;
            const pct = (s.health / s.maxHealth) * 100;
            s.status = pct > 70 ? 'NOMINAL' : 'DAMAGED';
          }
        });

        this.addNotification(`NANITE REPAIR COLLECTED — ALL TRANSPORTS RESTORED`, 'SUCCESS');
      }
    });
  }

  // =========================================================================
  // 7 SEQUENTIAL MISSION EVENTS STATE MACHINE
  // =========================================================================
  private updateMissionEvents(dt: number) {
    if (this.currentEventIndex >= this.events.length) return;
    const curEvent = this.events[this.currentEventIndex];

    switch (curEvent.id) {
      case 'RENDEZVOUS': {
        const lead = this.convoyShips[0];
        if (lead && this.playerPos.distanceTo(lead.position) < 180) {
          this.completeCurrentEvent('ESCORT FORMATION ESTABLISHED');
        }
        break;
      }
      case 'DEBRIS_CORRIDOR': {
        if (this.routeProgress >= (curEvent.targetProgress || 0.32)) {
          this.completeCurrentEvent('DEBRIS PASSAGE CLEARED');
        }
        break;
      }
      case 'DRONE_INTERCEPT': {
        // Spawn wave once when entering event
        if (this.enemyDrones.length === 0 && (curEvent.currentKills || 0) < (curEvent.targetKills || 6)) {
          this.spawnDroneWave(6, 'SCOUT');
          this.addNotification('HOSTILE DRONE SWARM DETECTED — INTERCEPT!', 'ALERT');
        }
        if ((curEvent.currentKills || 0) >= (curEvent.targetKills || 6)) {
          this.completeCurrentEvent('SCOUT DRONE WAVE DESTROYED');
        }
        break;
      }
      case 'AMBUSH_CROSSFIRE': {
        if (this.enemyDrones.length === 0 && (curEvent.currentKills || 0) < (curEvent.targetKills || 8)) {
          this.spawnDroneWave(6, 'FIGHTER');
          this.spawnDroneWave(2, 'GUNSHIP');
          this.addNotification('WARNING: MULTI-VECTOR AMBUSH IN PROGRESS', 'ALERT');
        }
        if ((curEvent.currentKills || 0) >= (curEvent.targetKills || 8)) {
          this.completeCurrentEvent('PIRATE AMBUSH REPELLED');
        }
        break;
      }
      case 'HULL_BREACH': {
        if (this.repairsCollectedCount >= 1 || this.routeProgress >= 0.76) {
          this.completeCurrentEvent('TRANSPORT INTEGRITY STABILIZED');
        }
        break;
      }
      case 'FINAL_APPROACH': {
        if (this.routeProgress >= (curEvent.targetProgress || 0.90)) {
          this.completeCurrentEvent('FINAL CITADEL SECTOR REACHED');
        }
        break;
      }
      case 'FINAL_DEFENSE': {
        if (this.enemyDrones.length === 0 && this.routeProgress < 0.96) {
          this.spawnDroneWave(8, 'FIGHTER');
          this.spawnDroneWave(2, 'GUNSHIP');
          this.addNotification('CRITICAL: FINAL DEFENSE ACTIVE — DEFEND EXTRACTION!', 'ALERT');
        }

        // Arrival transitions into the final sensor-gated parking sequence.
        if (this.routeProgress >= 0.99 && !this.dockingStarted) {
          this.dockingStarted = true;
          this.dockingElapsed = 0;
          this.missionState = 'EXTRACTION_DOCKING';
          // Keep the authoritative update loop alive for the docking animation.
          this.missionState = 'ACTIVE';
          this.completeCurrentEvent('EXTRACTION CHAMBER AUTHORIZED — PARKING SEQUENCE STARTED');
          this.addNotification('SPHERICAL DOCKING DOME: SENSOR GATES OPENING — BAY 01 INBOUND', 'EVENT');
        }
        break;
      }
    }
  }

  private completeCurrentEvent(msg: string) {
    const curEvent = this.events[this.currentEventIndex];
    curEvent.isCompleted = true;
    this.addNotification(`EVENT ${curEvent.eventNumber}/7 COMPLETED: ${msg}`, 'SUCCESS');
    sound.playCheckpoint();

    this.currentEventIndex = Math.min(this.events.length - 1, this.currentEventIndex + 1);
  }

  private checkVictoryDefeat() {
    if (this.missionState !== 'ACTIVE') return;

    if (this.playerHealth <= 0) {
      this.triggerDefeat(this.variant === 'HUNTERS' ? 'HUNTERS FORMATION OVERWHELMED THE PLAYER' : 'PLAYER INTERCEPTOR DESTROYED IN COMBAT');
      return;
    }

    if (this.variant === 'HUNTERS') {
      const boss = this.enemyDrones.find((e) => e.role === 'BOSS');
      if (boss && !boss.isAlive) this.triggerVictory();
      return;
    }

    // Saviour defeat: lead flagship lost or all transports destroyed.
    const lead = this.convoyShips[0];
    const aliveTransports = this.convoyShips.filter((s) => s.isAlive);

    if (this.playerHealth <= 0) {
      this.triggerDefeat('PLAYER INTERCEPTOR DESTROYED IN COMBAT');
      return;
    }

    if (!lead || !lead.isAlive) {
      this.triggerDefeat('CONVOY LEAD FLAGSHIP DESTROYED — MISSION COMPROMISED');
      return;
    }

    if (aliveTransports.length === 0) {
      this.triggerDefeat('ENTIRE CONVOY FLEET LOST');
      return;
    }
  }

  private triggerVictory() {
    this.missionState = 'VICTORY';
    sound.playFinish();

    const survivors = this.convoyShips.filter((s) => s.isAlive).length;
    const integrity = this.convoyShips.length > 0 ? Math.round(
      (this.convoyShips.reduce((acc, s) => acc + (s.isAlive ? s.health / s.maxHealth : 0), 0) / this.convoyShips.length) * 100
    ) : 0;

    this.finalStats = {
      victory: true,
      reason: this.variant === 'HUNTERS' ? 'BOSS DESTROYED AFTER DEFENCE DRONES WERE NEUTRALISED' : 'EMERGENCY ESCAPE COMPLETE: CONVOY PARKED AND PHYSICALLY LOCKED IN BASEMENT; PLAYER SHIP EXITED THROUGH EMERGENCY GATE',
      transportsSaved: this.variant === 'HUNTERS' ? 0 : survivors,
      transportsTotal: this.variant === 'HUNTERS' ? 0 : this.convoyShips.length,
      convoyFinalIntegrity: this.variant === 'HUNTERS' ? 0 : integrity,
      dronesDestroyed: this.dronesDestroyedCount,
      debrisCleared: this.debrisClearedCount,
      repairsCollected: this.repairsCollectedCount,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      creditsEarned: 3500 + survivors * 1000 + this.dronesDestroyedCount * 150,
      xpEarned: 1200 + survivors * 300,
    };
  }

  private triggerDefeat(reason: string) {
    this.missionState = 'DEFEAT';
    sound.playCrash();

    const survivors = this.convoyShips.filter((s) => s.isAlive).length;
    this.finalStats = {
      victory: false,
      reason,
      transportsSaved: this.variant === 'HUNTERS' ? 0 : survivors,
      transportsTotal: this.variant === 'HUNTERS' ? 0 : this.convoyShips.length,
      convoyFinalIntegrity: 0,
      dronesDestroyed: this.dronesDestroyedCount,
      debrisCleared: this.debrisClearedCount,
      repairsCollected: this.repairsCollectedCount,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      creditsEarned: 800 + this.dronesDestroyedCount * 100,
      xpEarned: 400,
    };
  }

  // =========================================================================
  // PUBLIC CONTROLS & HUD TELEMETRY API
  // =========================================================================
  public setSixAxisInput(input: { vertical: number; lateral: number; longitudinal: number }) {
    this.sixAxisInput = {
      vertical: THREE.MathUtils.clamp(input.vertical, -1, 1),
      lateral: THREE.MathUtils.clamp(input.lateral, -1, 1),
      longitudinal: THREE.MathUtils.clamp(input.longitudinal, -1, 1),
    };
  }

  public setJoystickInput(steerX: number, pitchY: number) {
    this.joystickSteerX = Math.max(-1, Math.min(1, steerX));
    this.joystickPitchY = Math.max(-1, Math.min(1, pitchY));
  }

  public setFireState(firing: boolean) {
    this.isTouchFiring = firing;
  }

  public setBoostState(boosting: boolean) {
    this.isTouchBoosting = boosting;
  }

  public setBrakeState(braking: boolean) {
    this.isTouchBraking = braking;
  }

  public setShieldState(shielding: boolean) {
    this.isTouchShielding = shielding;
  }


  /** Variant-specific signature skill on V: rescue repair pulse or hunter weapon overdrive. */
  public activateVariantAbility() {
    if (!this.isActive || this.variantAbilityCooldown > 0) return;
    this.variantAbilityCooldown = 24;
    if (this.variant === 'SAVIOUR') {
      let repaired = 0;
      this.convoyShips.forEach((ship) => {
        if (!ship.isAlive) return;
        const before = ship.health + ship.shield;
        ship.health = Math.min(ship.maxHealth, ship.health + 110);
        ship.shield = Math.min(ship.maxShield, ship.shield + 85);
        if (ship.health + ship.shield > before) repaired++;
        ship.status = ship.health / ship.maxHealth < 0.3 ? 'CRITICAL' : ship.health / ship.maxHealth < 0.65 ? 'DAMAGED' : 'NOMINAL';
      });
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 45);
      this.addNotification(`SAVIOUR NANITE BURST — ${repaired} SURVIVORS REPAIRED, SHIELDS RESTORED`, 'SUCCESS');
    } else {
      this.hunterOverdriveTimer = 8;
      this.playerBoostCharge = Math.min(100, this.playerBoostCharge + 45);
      this.enemyDrones.forEach((enemy) => {
        if (enemy.isAlive && enemy.position.distanceTo(this.playerPos) < 260) enemy.disabledTimer = Math.max(enemy.disabledTimer || 0, 1.5);
      });
      this.addNotification('HUNTER OVERDRIVE — 8s HIGH-ENERGY CANNONS + BOOST SURGE', 'SUCCESS');
    }
    sound.playShieldDeflect();
  }

  public activateEMP() {
    if (this.isActive && this.empCooldown <= 0) this.triggerEMP();
  }

  public handleKeyDown(code: string) {
    const wasDown = !!this.keysDown[code];
    this.keysDown[code] = true;
    if (code === 'KeyR' && !wasDown && this.isActive && this.empCooldown <= 0) this.triggerEMP();
    if (code === 'KeyV' && !wasDown && this.isActive && this.variantAbilityCooldown <= 0) this.activateVariantAbility();
  }

  private triggerEMP() {
    this.empCooldown = 12;
    let disabled = 0;
    this.enemyDrones.forEach((enemy) => {
      if (!enemy.isAlive) return;
      const distance = enemy.position.distanceTo(this.playerPos);
      if (distance <= 520) {
        enemy.disabledTimer = Math.max(enemy.disabledTimer || 0, 3.5);
        if (enemy.role !== 'BOSS') enemy.health = Math.max(1, enemy.health - 38);
        disabled++;
      }
    });
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      if (projectile.owner === 'ENEMY' && projectile.position.distanceTo(this.playerPos) <= 600) {
        if (projectile.mesh) this.combatGroup.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }
    this.addNotification(`EMP PULSE RELEASED — ${disabled} HOSTILES DISRUPTED`, 'SUCCESS');
    sound.playShieldDeflect();
  }

  public handleKeyUp(code: string) {
    this.keysDown[code] = false;
  }

  public addNotification(text: string, type: 'EVENT' | 'WARNING' | 'ALERT' | 'SUCCESS') {
    this.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
    });
    if (this.notifications.length > 5) this.notifications.pop();
  }

  public getTelemetry(): ConvoyTelemetry {
    const curEvent = this.events[this.currentEventIndex] || this.events[0];
    const aliveCount = this.convoyShips.filter((s) => s.isAlive).length;
    const lead = this.convoyShips[0];

    // Compute overall convoy integrity percent
    const integrityPct =
      this.convoyShips.length > 0
        ? Math.round(
            (this.convoyShips.reduce((acc, s) => acc + (s.isAlive ? s.health / s.maxHealth : 0), 0) /
              this.convoyShips.length) *
              100
          )
        : 0;

    // Mission-scale distance is displayed in kilometres; the spline remains compact for performant rendering.
    const distRemaining = Math.round((1.0 - this.routeProgress) * convoyEnvironment.routeLengthKm * 1000);

    // Target lock
    let lockedTarget: any = undefined;
    const closestDrone = this.enemyDrones.reduce<EnemyDrone | undefined>((closest, enemy) => {
      if (!enemy.isAlive) return closest;
      return !closest || this.playerPos.distanceToSquared(enemy.position) < this.playerPos.distanceToSquared(closest.position) ? enemy : closest;
    }, undefined);
    if (closestDrone) {
      lockedTarget = {
        id: closestDrone.id,
        name: `HOSTILE ${closestDrone.type} DRONE`,
        health: Math.round(closestDrone.health),
        maxHealth: closestDrone.maxHealth,
        distance: Math.round(this.playerPos.distanceTo(closestDrone.position)),
      };
    }

    const boss = this.enemyDrones.find((e) => e.role === 'BOSS');
    return {
      variant: this.variant,
      bossHealth: boss && boss.isAlive ? Math.max(0, Math.round(boss.health)) : 0,
      bossMaxHealth: boss?.maxHealth || 1000,
      defensiveDronesAlive: this.enemyDrones.filter((e) => e.role === 'DEFENSE_DRONE' && e.isAlive).length,
      hunterEnemiesAlive: this.enemyDrones.filter((e) => e.isAlive).length,
      isActive: this.isActive,
      isPaused: this.isPaused,
      missionState: this.missionState,
      currentEventIndex: this.currentEventIndex + 1,
      totalEvents: this.events.length,
      currentEvent: curEvent,
      routeProgressPercent: Math.round(this.routeProgress * 100),
      distanceToDestinationMeters: distRemaining,
      timeElapsedSeconds: Math.round(this.timeElapsed),
      convoyIntegrityPercent: integrityPct,
      leadTransportHealthPercent: lead ? Math.round((lead.health / lead.maxHealth) * 100) : 0,
      transportsAliveCount: aliveCount,
      transportsTotalCount: this.convoyShips.length,
      transports: this.convoyShips.map((s) => ({
        id: s.id,
        name: s.name,
        isLead: s.isLead,
        role: s.role,
        health: Math.round(s.health),
        maxHealth: s.maxHealth,
        healthPercent: Math.round((s.health / s.maxHealth) * 100),
        status: s.status,
        distanceToPlayer: Math.round(this.playerPos.distanceTo(s.position)),
      })),
      activeHostileCount: this.enemyDrones.filter((d) => d.isAlive).length,
      lockedTarget,
      playerHealth: Math.round(this.playerHealth),
      playerMaxHealth: this.playerMaxHealth,
      playerShield: Math.round(this.playerShield),
      playerMaxShield: this.playerMaxShield,
      playerBoost: Math.round(this.playerBoostCharge),
      playerSpeedKmh: Math.round(this.playerVel.length() * 1.8),
      isFiring: this.isTouchFiring,
      notifications: this.notifications,
      finalStats: this.finalStats,
    };
  }

  public cleanUp() {
    this.isActive = false;
    this.isPaused = false;
    this.missionState = 'DISPOSED';
    this.combatGroup.clear();
    this.convoyShips = [];
    this.dockingStarted = false;
    this.dockingElapsed = 0;
    this.emergencyPhase = 'PARKING';
    this.emergencyPhaseElapsed = 0;
    this.dockedShipIds.clear();
    this.enemyDrones = [];
    this.projectiles = [];
    this.notifications = [];
    this.finalStats = null;
    this.keysDown = {};
    this.isTouchFiring = false;
    this.isTouchBoosting = false;
    this.isTouchBraking = false;
    this.isTouchShielding = false;
    this.isShielding = false;
    convoyEnvironment.cleanUp();
  }
}

export const convoyDirector = new ConvoyDirector();
