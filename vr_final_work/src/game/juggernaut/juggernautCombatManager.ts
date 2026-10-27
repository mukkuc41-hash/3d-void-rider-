/**
 * VOID-RIDER 3D — JUGGERNAUT SPACE COMBAT DIRECTOR & COMBAT SYSTEM
 * Centralized authoritative combat manager for:
 * - Mode A: APEX PREDATOR (1 Titan Juggernaut vs 7 Swarm Hunters)
 * - Mode B: SWARM HUNT (7 Survivors vs 1 Boss Hunter)
 *
 * Repaired Features:
 * - Accurate 3D ship orientation: nose faces -Z, thrusters at +Z
 * - Perfectly framed chase camera that keeps the controlled ship fully visible
 * - Clean collision and spawn clearance preventing overlapping meshes
 * - High-visibility projectile tracers and combat hit feedback
 * - Strict cessation of damage upon victory/defeat
 */
import * as THREE from 'three';
import {
  JuggernautCombatMode,
  JuggernautRole,
  JuggernautFaction,
  CombatShipState,
  CombatProjectile,
  DefensiveTrap,
  ShockwaveEffect,
  CombatNotification,
  JuggernautMatchConfig,
  JuggernautMatchStats,
  JuggernautCombatTelemetry,
} from './juggernautTypes';
import { juggernautArena } from './juggernautArena';
import { sound } from '../audio';
import { createProceduralShipMesh } from '../shipMeshGenerator';

export class JuggernautCombatDirector {
  public isActive: boolean = false;
  public isPaused: boolean = false;
  public isMatchOver: boolean = false;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  public combatGroup: THREE.Group;

  // Match Configuration
  public currentConfig: JuggernautMatchConfig = {
    mode: 'APEX_PREDATOR',
    playerRole: 'JUGGERNAUT',
    playerShipId: 'VR-0777',
    difficulty: 'STANDARD',
    matchDurationSeconds: 180,
    shrinkingBoundary: false,
  };

  public timeRemaining: number = 180;
  public totalMatchDuration: number = 180;

  // Participants
  public playerShip: CombatShipState | null = null;
  public ships: CombatShipState[] = [];

  // Projectiles & FX
  private projectiles: CombatProjectile[] = [];
  private traps: DefensiveTrap[] = [];
  private shockwaves: ShockwaveEffect[] = [];

  // UI & Notifications
  private notifications: CombatNotification[] = [];
  private damageFlashActive: boolean = false;
  private damageFlashTimer: number = 0;

  // Final Results
  public finalStats: JuggernautMatchStats | null = null;

  // Input tracking (Keyboard + Touch/Mobile Cyber Joystick Controller)
  private keysDown: Record<string, boolean> = {};
  private directionalInput: { forward: boolean; backward: boolean; left: boolean; right: boolean; up: boolean; down: boolean } = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private joystickSteerX: number = 0; // -1 (Left) to +1 (Right)
  private joystickPitchY: number = 0; // -1 (Nose Up/Back) to +1 (Nose Down/Forward)
  private isTouchFiring: boolean = false;
  private isTouchBoosting: boolean = false;

  constructor() {
    this.combatGroup = new THREE.Group();
    this.combatGroup.name = 'juggernaut_combat_entities';
  }

  public init(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;
    if (!scene.getObjectByName('juggernaut_combat_entities')) {
      scene.add(this.combatGroup);
    }
  }

  /**
   * Start a new match with the specified configuration
   */
  public startMatch(config: JuggernautMatchConfig) {
    this.cleanUp();
    this.currentConfig = { ...config };
    this.isActive = true;
    this.isPaused = false;
    this.isMatchOver = false;
    this.finalStats = null;
    this.timeRemaining = config.matchDurationSeconds || 180;
    this.totalMatchDuration = this.timeRemaining;

    if (this.scene) {
      juggernautArena.buildArena(this.scene, config.mode);
    }

    this.spawnShips();

    this.addNotification(
      config.mode === 'APEX_PREDATOR'
        ? 'APEX PREDATOR ENGAGED — 1 TITAN VS 7 HUNTERS'
        : 'SWARM HUNT ENGAGED — 7 SURVIVORS VS 1 BOSS',
      'ALERT',
      'text-amber-400'
    );

    sound.playAlarmAlert();
  }

  private spawnShips() {
    this.ships = [];
    const isApex = this.currentConfig.mode === 'APEX_PREDATOR';
    const playerRole = this.currentConfig.playerRole;

    if (isApex) {
      // MODE A: APEX PREDATOR (1 Juggernaut vs 7 Hunters)
      // 1. Juggernaut Titan in North sector facing South
      const isPlayerJugg = playerRole === 'JUGGERNAUT';
      const juggShip = this.createShip({
        id: 'ship_titan_01',
        name: isPlayerJugg ? 'TITAN DREADNOUGHT (YOU)' : 'TITAN DREADNOUGHT (AI)',
        role: 'JUGGERNAUT',
        faction: 'TITAN',
        isPlayer: isPlayerJugg,
        shipDefId: isPlayerJugg ? this.currentConfig.playerShipId : 'VR-0777',
        health: 700,
        maxHealth: 700,
        shield: 200,
        maxShield: 200,
        shieldRegenRate: 10,
        maxSpeed: 290,
        turnSpeed: 1.8,
        acceleration: 70,
        primaryDamage: 45,
        primaryFireRate: 2.2,
        attackRange: 480,
        scale: 2.2,
        position: new THREE.Vector3(0, 30, -520),
        rotationY: Math.PI, // Facing South (+Z)
        primaryColor: '#ef4444',
        secondaryColor: '#f59e0b',
        abilities: {
          shockwave: {
            id: 'shockwave',
            name: 'RADIAL SHOCKWAVE',
            description: 'Discharge kinetic wave pushing enemy ships away and dealing heavy area damage.',
            cooldownSeconds: 14,
            currentCooldown: 0,
            keyLabel: 'E',
          },
          bulwark: {
            id: 'bulwark',
            name: 'TITAN BULWARK',
            description: 'Overcharge shield grid and boost cannon fire rate by 35% for 7 seconds.',
            cooldownSeconds: 20,
            currentCooldown: 0,
            durationSeconds: 7,
            activeTimeRemaining: 0,
            keyLabel: 'Q',
          },
        },
      });
      this.ships.push(juggShip);

      // 2. Seven Swarm Hunters in South sector facing North
      const hunterXPositions = [-300, -200, -100, 0, 100, 200, 300];
      for (let i = 1; i <= 7; i++) {
        const isPlayerHunter = !isPlayerJugg && playerRole === 'HUNTER' && i === 1;
        const xPos = hunterXPositions[i - 1];
        const zPos = 480 + (Math.abs(xPos) > 150 ? 50 : 0);
        const yPos = 20 + (i % 2 === 0 ? 15 : -10);

        const hunterShip = this.createShip({
          id: `ship_hunter_${i}`,
          name: isPlayerHunter ? `SWARM HUNTER #${i} (YOU)` : `SWARM HUNTER #${i}`,
          role: 'HUNTER',
          faction: 'SWARM',
          isPlayer: isPlayerHunter,
          shipDefId: isPlayerHunter ? this.currentConfig.playerShipId : `VR-000${i + 4}`,
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          shieldRegenRate: 6,
          maxSpeed: 420,
          turnSpeed: 3.2,
          acceleration: 120,
          primaryDamage: 12,
          primaryFireRate: 4.5,
          attackRange: 350,
          scale: 1.0,
          position: new THREE.Vector3(xPos, yPos, zPos),
          rotationY: 0, // Facing North (-Z)
          primaryColor: '#00e5ff',
          secondaryColor: '#3b82f6',
          abilities: {
            dash: {
              id: 'dash',
              name: 'WARP BOOST',
              description: 'Instant kinetic burst to break enemy locks and evade incoming fire.',
              cooldownSeconds: 8,
              currentCooldown: 0,
              durationSeconds: 2.5,
              activeTimeRemaining: 0,
              keyLabel: 'SHIFT',
            },
          },
        });
        this.ships.push(hunterShip);
      }
    } else {
      // MODE B: SWARM HUNT (7 Survivors vs 1 Boss Hunter)
      const isPlayerBoss = playerRole === 'BOSS';

      // 1. Boss Hunter in North sector facing South
      const bossShip = this.createShip({
        id: 'ship_boss_01',
        name: isPlayerBoss ? 'NEMESIS BOSS (YOU)' : 'NEMESIS BOSS (AI)',
        role: 'BOSS',
        faction: 'BOSS',
        isPlayer: isPlayerBoss,
        shipDefId: isPlayerBoss ? this.currentConfig.playerShipId : 'VR-0999',
        health: 1000,
        maxHealth: 1000,
        shield: 300,
        maxShield: 300,
        shieldRegenRate: 12,
        maxSpeed: 310,
        turnSpeed: 2.2,
        acceleration: 85,
        primaryDamage: 50,
        primaryFireRate: 2.0,
        attackRange: 480,
        scale: 2.2,
        position: new THREE.Vector3(0, 35, -550),
        rotationY: Math.PI, // Facing South (+Z)
        primaryColor: '#dc2626',
        secondaryColor: '#9333ea',
        abilities: {
          lunge: {
            id: 'lunge',
            name: 'PREDATOR LUNGE',
            description: 'Gap-closing rocket dash forward dealing collision impact damage.',
            cooldownSeconds: 10,
            currentCooldown: 0,
            durationSeconds: 2.0,
            activeTimeRemaining: 0,
            keyLabel: 'SHIFT',
          },
          nova: {
            id: 'nova',
            name: 'NOVA ANNIHILATION',
            description: 'Telegraph and unleash a massive 360-degree red energy explosion.',
            cooldownSeconds: 18,
            currentCooldown: 0,
            durationSeconds: 1.5,
            activeTimeRemaining: 0,
            keyLabel: 'E',
          },
        },
      });
      this.ships.push(bossShip);

      // 2. Seven Survivors in South sector facing North
      const survXPositions = [-280, -190, -90, 0, 90, 190, 280];
      for (let i = 1; i <= 7; i++) {
        const isPlayerSurv = !isPlayerBoss && playerRole === 'SURVIVOR' && i === 1;
        const xPos = survXPositions[i - 1];
        const zPos = 490 + (Math.abs(xPos) > 140 ? 40 : 0);
        const yPos = 25 + (i % 2 === 0 ? 12 : -8);

        const survShip = this.createShip({
          id: `ship_survivor_${i}`,
          name: isPlayerSurv ? `SURVIVOR #${i} (YOU)` : `SURVIVOR #${i}`,
          role: 'SURVIVOR',
          faction: 'SURVIVORS',
          isPlayer: isPlayerSurv,
          shipDefId: isPlayerSurv ? this.currentConfig.playerShipId : `VR-00${10 + i}`,
          health: 80,
          maxHealth: 80,
          shield: 40,
          maxShield: 40,
          shieldRegenRate: 5,
          maxSpeed: 390,
          turnSpeed: 3.4,
          acceleration: 110,
          primaryDamage: 14,
          primaryFireRate: 3.5,
          attackRange: 360,
          scale: 1.0,
          position: new THREE.Vector3(xPos, yPos, zPos),
          rotationY: 0, // Facing North (-Z)
          primaryColor: '#10b981',
          secondaryColor: '#06b6d4',
          abilities: {
            decoy: {
              id: 'decoy',
              name: 'ENERGY CLOAK & DECOY',
              description: 'Deploy holographic decoy and cloak for 4 seconds to evade predator.',
              cooldownSeconds: 15,
              currentCooldown: 0,
              durationSeconds: 4.0,
              activeTimeRemaining: 0,
              keyLabel: 'Q',
            },
            trap: {
              id: 'trap',
              name: 'DEFENSIVE PLASMA MINE',
              description: 'Drop proximity trap that slows and damages the boss when triggered.',
              cooldownSeconds: 16,
              currentCooldown: 0,
              keyLabel: 'E',
            },
          },
        });
        this.ships.push(survShip);
      }
    }

    this.playerShip = this.ships.find((s) => s.isPlayer) || this.ships[0];
  }

  private createShip(params: {
    id: string;
    name: string;
    role: JuggernautRole;
    faction: JuggernautFaction;
    isPlayer: boolean;
    shipDefId: string;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    shieldRegenRate: number;
    maxSpeed: number;
    turnSpeed: number;
    acceleration: number;
    primaryDamage: number;
    primaryFireRate: number;
    attackRange: number;
    scale: number;
    position: THREE.Vector3;
    rotationY: number;
    primaryColor: string;
    secondaryColor: string;
    abilities: Record<string, any>;
  }): CombatShipState {
    const mesh = createProceduralShipMesh(params.shipDefId, {
      primaryColorHex: params.primaryColor,
      secondaryColorHex: params.secondaryColor,
      accentColorHex: params.primaryColor,
      emissiveIntensity: 1.4,
      glowIntensity: 1.5,
    });
    mesh.scale.set(params.scale, params.scale, params.scale);
    mesh.position.copy(params.position);
    mesh.rotation.set(0, params.rotationY, 0);
    this.combatGroup.add(mesh);

    // Sleek Energy Shield Bubble (accurately proportioned, not double-scaled)
    const shieldGeo = new THREE.SphereGeometry(4.8, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: params.faction === 'TITAN' || params.faction === 'BOSS' ? 0xff3b5c : 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.name = 'ship_shield_bubble';
    mesh.add(shieldMesh);

    // Glowing Thruster Flame Beacon at rear (+Z)
    const engineGeo = new THREE.ConeGeometry(0.8, 3.2, 8);
    engineGeo.rotateX(-Math.PI / 2);
    const engineMat = new THREE.MeshBasicMaterial({
      color: params.faction === 'TITAN' || params.faction === 'BOSS' ? 0xff5500 : 0x00e5ff,
    });
    const engineFlame = new THREE.Mesh(engineGeo, engineMat);
    engineFlame.position.set(0, 0, 2.8);
    mesh.add(engineFlame);

    // Initial forward vector calculated from rotationY
    const initRot = new THREE.Euler(0, params.rotationY, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(initRot);

    const shipState: CombatShipState = {
      id: params.id,
      name: params.name,
      role: params.role,
      faction: params.faction,
      isPlayer: params.isPlayer,
      shipDefId: params.shipDefId,
      position: params.position.clone(),
      rotation: initRot,
      velocity: new THREE.Vector3(0, 0, 0),
      forward,
      health: params.health,
      maxHealth: params.maxHealth,
      shield: params.shield,
      maxShield: params.maxShield,
      shieldRegenRate: params.shieldRegenRate,
      isAlive: true,
      isDisabled: false,
      reviveProgress: 0,
      maxSpeed: params.maxSpeed,
      turnSpeed: params.turnSpeed,
      acceleration: params.acceleration,
      boostMultiplier: 1.65,
      isBoosting: false,
      boostCharge: 100,
      primaryDamage: params.primaryDamage,
      primaryFireRate: params.primaryFireRate,
      fireCooldown: 0,
      attackRange: params.attackRange,
      abilities: params.abilities,
      mesh,
      shieldMesh,
      hitFlashTimer: 0,
      kills: 0,
      damageDealt: 0,
      damageTaken: 0,
      revivesDone: 0,
    };

    return shipState;
  }

  /**
   * Main game loop update
   */
  public update(deltaSeconds: number): JuggernautCombatTelemetry {
    if (!this.isActive || this.isPaused) {
      return this.getTelemetry();
    }

    // Cease all damage, weapons, and AI immediately when match ends
    if (this.isMatchOver) {
      return this.getTelemetry();
    }

    this.timeRemaining = Math.max(0, this.timeRemaining - deltaSeconds);

    const shrinkProgress =
      this.currentConfig.shrinkingBoundary && this.timeRemaining < 60
        ? (60 - this.timeRemaining) / 60
        : 0;
    juggernautArena.update(deltaSeconds, shrinkProgress);

    // Update Player & AI Ships
    for (const ship of this.ships) {
      if (!ship.isAlive) continue;

      if (ship.isDisabled) {
        this.updateDisabledShip(ship, deltaSeconds);
        continue;
      }

      this.updateShipAbilities(ship, deltaSeconds);

      // Shield regeneration
      if (ship.shield < ship.maxShield) {
        ship.shield = Math.min(ship.maxShield, ship.shield + ship.shieldRegenRate * deltaSeconds);
      }

      if (ship.hitFlashTimer > 0) {
        ship.hitFlashTimer -= deltaSeconds;
      }

      if (ship.isPlayer) {
        this.updatePlayerFlight(ship, deltaSeconds);
      } else {
        this.updateAIShip(ship, deltaSeconds);
      }

      // Space physics integration
      ship.position.addScaledVector(ship.velocity, deltaSeconds);
      ship.velocity.multiplyScalar(0.978);

      // Real physical circular platform collision (solid 3D disk + edge drop-off)
      const shipRadius = ship.role === 'JUGGERNAUT' || ship.role === 'BOSS' ? 16 : 8;
      const platformResult = juggernautArena.checkPlatformCollision(
        ship.position,
        ship.velocity,
        shipRadius,
        deltaSeconds
      );

      // Fall damage penalty if knocked or flown off the platform edge into deep space
      if (platformResult.isFallingOff) {
        this.applyDamage(ship, 18 * deltaSeconds, 'VOID FALL HAZARD');
      }

      // Boundary safety check & soft repulsor
      const boundCheck = juggernautArena.checkBoundary(ship.position, ship.velocity);
      if (boundCheck.isOutOfBounds) {
        this.applyDamage(ship, 12 * deltaSeconds, 'ARENA BOUNDARY');
      }

      // Sync 3D Mesh
      if (ship.mesh) {
        ship.mesh.position.copy(ship.position);
        ship.mesh.rotation.copy(ship.rotation);
        if (ship.shieldMesh) {
          ship.shieldMesh.visible = ship.shield > 0;
          if (ship.shieldMesh.material) {
            (ship.shieldMesh.material as THREE.MeshBasicMaterial).opacity =
              0.12 + (ship.shield / ship.maxShield) * 0.28;
          }
        }
      }
    }

    // Update Projectiles
    this.updateProjectiles(deltaSeconds);

    // Update Defensive Traps
    this.updateTraps(deltaSeconds);

    // Update Radial Shockwaves
    this.updateShockwaves(deltaSeconds);

    // Damage flash timer
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= deltaSeconds;
      if (this.damageFlashTimer <= 0) {
        this.damageFlashActive = false;
      }
    }

    // Check Victory / Defeat Conditions
    this.checkMatchConditions();

    return this.getTelemetry();
  }

  /**
   * Player 6-DOF Spaceship flight & smooth camera tracking
   */
  private updatePlayerFlight(ship: CombatShipState, dt: number) {
    const keys = this.keysDown;
    const accel = ship.acceleration;
    const turn = ship.turnSpeed;

    // Six-axis flight: W/S forward/reverse, A/D strafe, T/G vertical thrust.
    // Arrow keys independently control pitch/yaw; Q/E retain roll.
    if (keys['ArrowUp']) ship.rotation.x -= turn * dt;
    if (keys['ArrowDown']) ship.rotation.x += turn * dt;
    if (Math.abs(this.joystickPitchY) > 0.04) {
      ship.rotation.x -= this.joystickPitchY * turn * dt;
    }

    // Yaw / Steer: A = Turn Left (+Y), D = Turn Right (-Y), or Cyber Joystick X-axis
    if (keys['ArrowLeft']) ship.rotation.y += turn * dt;
    if (keys['ArrowRight']) ship.rotation.y -= turn * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      ship.rotation.y -= this.joystickSteerX * turn * dt;
    }

    // Roll banking: Q = Roll Left (+Z), E = Roll Right (-Z), or dynamic banking with Joystick steering
    if (keys['KeyQ']) ship.rotation.z += turn * 1.6 * dt;
    if (keys['KeyE']) ship.rotation.z -= turn * 1.6 * dt;
    if (Math.abs(this.joystickSteerX) > 0.04) {
      const targetRoll = -this.joystickSteerX * 0.52;
      ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, targetRoll, dt * 6.0);
    } else if (!keys['KeyQ'] && !keys['KeyE']) {
      // Auto-level roll gently if not holding roll keys or joystick steering
      ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, 0, dt * 3.0);
    }

    // Compute True Forward Direction Vector (-Z in local space)
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(ship.rotation);
    ship.forward.copy(fwd);

    // Apply explicit translation in the ship's local axes. Inputs combine diagonally
    // but are normalized below by the shared velocity cap.
    const right = new THREE.Vector3(1, 0, 0).applyEuler(ship.rotation);
    const up = new THREE.Vector3(0, 1, 0).applyEuler(ship.rotation);
    const forwardAxis = this.directionalInput.forward || keys['KeyW'];
    const reverseAxis = this.directionalInput.backward || keys['KeyS'];
    const strafeLeft = this.directionalInput.left || keys['KeyA'];
    const strafeRight = this.directionalInput.right || keys['KeyD'];
    const thrustUp = this.directionalInput.up || keys['KeyT'];
    const thrustDown = this.directionalInput.down || keys['KeyG'];
    if (forwardAxis) ship.velocity.addScaledVector(fwd, accel * dt);
    if (reverseAxis) ship.velocity.addScaledVector(fwd, -accel * 0.72 * dt);
    if (strafeLeft) ship.velocity.addScaledVector(right, -accel * 0.72 * dt);
    if (strafeRight) ship.velocity.addScaledVector(right, accel * 0.72 * dt);
    if (thrustUp) ship.velocity.addScaledVector(up, accel * 0.65 * dt);
    if (thrustDown) ship.velocity.addScaledVector(up, -accel * 0.65 * dt);

    // Boost Handling: Shift or the touch boost trigger accelerates forward
    const boostActive =
      (this.isTouchBoosting || keys['ShiftLeft'] || keys['ShiftRight']) && ship.boostCharge > 0;
    ship.isBoosting = boostActive;

    const currentMaxSpeed = ship.isBoosting
      ? ship.maxSpeed * ship.boostMultiplier
      : ship.maxSpeed;

    if (boostActive) {
      ship.boostCharge = Math.max(0, ship.boostCharge - 24 * dt);
      ship.velocity.addScaledVector(fwd, accel * 2.4 * dt);
    } else {
      ship.boostCharge = Math.min(100, ship.boostCharge + 16 * dt);
      // No forced forward thrust: pilot chooses any of the six translation axes.
    }

    // Cap velocity
    const speed = ship.velocity.length();
    if (speed > currentMaxSpeed) {
      ship.velocity.setLength(currentMaxSpeed);
    }

    // Primary Weapon Fire: Space/F/Mouse or Touch Fire trigger button
    ship.fireCooldown -= dt;
    if (this.isTouchFiring || keys['Space'] || keys['KeyF'] || keys['MouseButton0']) {
      if (ship.fireCooldown <= 0) {
        this.firePrimaryWeapon(ship);
        ship.fireCooldown = 1 / ship.primaryFireRate;
      }
    }

    // Smooth Chase Camera Tracking (frames ship beautifully without clipping)
    if (this.camera && ship.mesh) {
      const isTitan = ship.role === 'JUGGERNAUT' || ship.role === 'BOSS';
      const behindDist = isTitan ? 62 + (ship.isBoosting ? 14 : 0) : 34 + (ship.isBoosting ? 8 : 0);
      const heightOffset = isTitan ? 22 : 11;

      // Camera positioned BEHIND (+Z) and ABOVE (+Y) relative to ship rotation
      const camOffset = new THREE.Vector3(0, heightOffset, behindDist).applyEuler(ship.rotation);
      const targetCamPos = ship.position.clone().add(camOffset);

      // Smooth spring interpolation
      const lerpFactor = Math.min(1.0, 10 * dt);
      this.camera.position.lerp(targetCamPos, lerpFactor);

      // Target lookAt point situated well ahead along the ship's forward path
      const lookTarget = ship.position.clone().add(fwd.clone().multiplyScalar(isTitan ? 90 : 60));
      this.camera.lookAt(lookTarget);

      // Dynamic FOV sensation during boost
      const targetFov = ship.isBoosting ? 78 : 68;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 6);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * AI Flight, Steering, Targeting, and Combat logic
   */
  private updateAIShip(ship: CombatShipState, dt: number) {
    let target = this.getBestAITarget(ship);
    if (!target) return;

    ship.targetShipId = target.id;
    const toTarget = target.position.clone().sub(ship.position);
    const distToTarget = toTarget.length();

    if (ship.role === 'HUNTER') {
      this.aiHunterBehavior(ship, target, toTarget, distToTarget, dt);
    } else if (ship.role === 'JUGGERNAUT') {
      this.aiJuggernautBehavior(ship, target, toTarget, distToTarget, dt);
    } else if (ship.role === 'SURVIVOR') {
      this.aiSurvivorBehavior(ship, target, toTarget, distToTarget, dt);
    } else if (ship.role === 'BOSS') {
      this.aiBossBehavior(ship, target, toTarget, distToTarget, dt);
    }

    // Firing primary weapon if aimed toward target
    ship.fireCooldown -= dt;
    if (distToTarget <= ship.attackRange && ship.fireCooldown <= 0) {
      const angle = ship.forward.angleTo(toTarget);
      if (angle < 0.38) {
        this.firePrimaryWeapon(ship);
        ship.fireCooldown = 1 / ship.primaryFireRate;
      }
    }
  }

  private aiHunterBehavior(
    ship: CombatShipState,
    target: CombatShipState,
    toTarget: THREE.Vector3,
    dist: number,
    dt: number
  ) {
    const idealDist = 200;
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(ship.rotation);
    ship.forward.copy(fwd);

    const orbitAngle = (parseInt(ship.id.replace(/\D/g, '') || '1', 10) * Math.PI) / 3.5;
    const orbitOffset = new THREE.Vector3(
      Math.cos(orbitAngle) * idealDist,
      Math.sin(orbitAngle) * 45,
      Math.sin(orbitAngle) * idealDist
    );
    const destination = target.position.clone().add(orbitOffset);
    const steerDir = destination.sub(ship.position).normalize();

    this.steerToward(ship, steerDir, dt);
    ship.velocity.addScaledVector(fwd, ship.acceleration * dt);

    const dashAbility = ship.abilities['dash'];
    if (dashAbility && dashAbility.currentCooldown <= 0 && dist < 140) {
      this.activateHunterDash(ship);
    }
  }

  private aiJuggernautBehavior(
    ship: CombatShipState,
    target: CombatShipState,
    toTarget: THREE.Vector3,
    dist: number,
    dt: number
  ) {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(ship.rotation);
    ship.forward.copy(fwd);

    const dir = toTarget.clone().normalize();
    this.steerToward(ship, dir, dt);
    ship.velocity.addScaledVector(fwd, ship.acceleration * 0.95 * dt);

    const shockwave = ship.abilities['shockwave'];
    if (shockwave && shockwave.currentCooldown <= 0) {
      const enemiesInRadius = this.ships.filter(
        (s) => s.isAlive && s.faction !== ship.faction && s.position.distanceTo(ship.position) < 160
      ).length;
      if (enemiesInRadius >= 2) {
        this.activateJuggernautShockwave(ship);
      }
    }

    const bulwark = ship.abilities['bulwark'];
    if (bulwark && bulwark.currentCooldown <= 0 && ship.health < ship.maxHealth * 0.65) {
      this.activateJuggernautBulwark(ship);
    }
  }

  private aiSurvivorBehavior(
    ship: CombatShipState,
    boss: CombatShipState,
    toBoss: THREE.Vector3,
    distToBoss: number,
    dt: number
  ) {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(ship.rotation);
    ship.forward.copy(fwd);

    // Prioritize disabled teammate rescue
    const disabledTeammate = this.ships.find(
      (s) => s.isAlive && s.isDisabled && s.faction === ship.faction && s.id !== ship.id
    );

    if (disabledTeammate) {
      const toTeammate = disabledTeammate.position.clone().sub(ship.position);
      const distToTeammate = toTeammate.length();

      if (distToTeammate > 28) {
        this.steerToward(ship, toTeammate.normalize(), dt);
        ship.velocity.addScaledVector(fwd, ship.acceleration * dt);
      } else {
        disabledTeammate.reviveProgress += dt;
        disabledTeammate.revivingShipId = ship.id;
        if (disabledTeammate.reviveProgress >= 3.0) {
          this.reviveShip(disabledTeammate, ship);
        }
      }
      return;
    }

    // Evade Boss: keep distance > 220
    if (distToBoss < 220) {
      const fleeDir = ship.position.clone().sub(boss.position).normalize();
      this.steerToward(ship, fleeDir, dt);
      ship.velocity.addScaledVector(fwd, ship.acceleration * 1.35 * dt);

      const trap = ship.abilities['trap'];
      if (trap && trap.currentCooldown <= 0) {
        this.deployDefensiveTrap(ship);
      }

      const decoy = ship.abilities['decoy'];
      if (decoy && decoy.currentCooldown <= 0 && distToBoss < 140) {
        this.activateSurvivorDecoy(ship);
      }
    } else {
      const orbitDir = new THREE.Vector3(-toBoss.z, 0, toBoss.x).normalize();
      this.steerToward(ship, orbitDir, dt);
      ship.velocity.addScaledVector(fwd, ship.acceleration * 0.9 * dt);
    }
  }

  private aiBossBehavior(
    ship: CombatShipState,
    target: CombatShipState,
    toTarget: THREE.Vector3,
    dist: number,
    dt: number
  ) {
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(ship.rotation);
    ship.forward.copy(fwd);

    const dir = toTarget.clone().normalize();
    this.steerToward(ship, dir, dt);
    ship.velocity.addScaledVector(fwd, ship.acceleration * dt);

    const lunge = ship.abilities['lunge'];
    if (lunge && lunge.currentCooldown <= 0 && dist > 180 && dist < 380) {
      this.activateBossLunge(ship);
    }

    const nova = ship.abilities['nova'];
    if (nova && nova.currentCooldown <= 0) {
      const nearbySurvivors = this.ships.filter(
        (s) => s.isAlive && !s.isDisabled && s.faction !== ship.faction && s.position.distanceTo(ship.position) < 190
      ).length;
      if (nearbySurvivors >= 2 || (nearbySurvivors >= 1 && dist < 110)) {
        this.activateBossNova(ship);
      }
    }
  }

  private steerToward(ship: CombatShipState, targetDir: THREE.Vector3, dt: number) {
    // Ship forward is (0, 0, -1)
    const desiredRotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), targetDir)
    );
    ship.rotation.x = THREE.MathUtils.lerp(ship.rotation.x, desiredRotation.x, ship.turnSpeed * dt);
    ship.rotation.y = THREE.MathUtils.lerp(ship.rotation.y, desiredRotation.y, ship.turnSpeed * dt);
    ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, desiredRotation.z, ship.turnSpeed * dt);
  }

  private getBestAITarget(ship: CombatShipState): CombatShipState | null {
    const enemies = this.ships.filter(
      (s) => s.isAlive && !s.isDisabled && s.faction !== ship.faction
    );
    if (enemies.length === 0) return null;

    let closest: CombatShipState | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      const d = ship.position.distanceTo(e.position);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  /**
   * Weapons & Abilities Activation
   */
  public firePrimaryWeapon(ship: CombatShipState) {
    const fwd = ship.forward.clone().normalize();
    const projectileSpeed = 880;
    const vel = fwd.clone().multiplyScalar(projectileSpeed).add(ship.velocity.clone().multiplyScalar(0.35));
    const isHeavy = ship.role === 'JUGGERNAUT' || ship.role === 'BOSS';

    const color =
      ship.faction === 'TITAN'
        ? new THREE.Color(0xff2244)
        : ship.faction === 'BOSS'
        ? new THREE.Color(0xdc2626)
        : ship.faction === 'SURVIVORS'
        ? new THREE.Color(0x10b981)
        : new THREE.Color(0x00f0ff);

    // High-visibility luminous laser bolt
    const projGeo = new THREE.CylinderGeometry(isHeavy ? 1.6 : 0.7, isHeavy ? 1.6 : 0.7, isHeavy ? 16 : 8, 8);
    projGeo.rotateX(Math.PI / 2);
    const projMat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fwd);
    mesh.position.copy(ship.position).addScaledVector(fwd, isHeavy ? 24 : 14);
    this.combatGroup.add(mesh);

    const projectile: CombatProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: ship.id,
      ownerRole: ship.role,
      faction: ship.faction,
      position: mesh.position.clone(),
      velocity: vel,
      damage: ship.primaryDamage,
      radius: isHeavy ? 5.0 : 2.8,
      lifetime: 1.8,
      color,
      mesh,
      isHeavy,
    };

    this.projectiles.push(projectile);
    sound.playMissileLaunch();
  }

  public activateJuggernautShockwave(ship: CombatShipState) {
    const ability = ship.abilities['shockwave'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;

    sound.playGravityBurst();
    this.addNotification(`${ship.name} FIRED RADIAL SHOCKWAVE`, 'ABILITY', 'text-amber-400');

    const ringGeo = new THREE.RingGeometry(1, 16, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.copy(ship.position);
    this.combatGroup.add(ringMesh);

    this.shockwaves.push({
      id: `sw_${Date.now()}`,
      position: ship.position.clone(),
      currentRadius: 10,
      maxRadius: 190,
      expansionSpeed: 250,
      damage: 75,
      force: 230,
      faction: ship.faction,
      mesh: ringMesh,
    });
  }

  public activateJuggernautBulwark(ship: CombatShipState) {
    const ability = ship.abilities['bulwark'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;
    ability.activeTimeRemaining = ability.durationSeconds || 7;

    ship.shield = Math.min(ship.maxShield * 1.5, ship.shield + 180);
    ship.primaryFireRate *= 1.35;
    sound.playShieldActivate();
    this.addNotification(`${ship.name} ACTIVATED TITAN BULWARK SHIELD`, 'ABILITY', 'text-amber-300');
  }

  public activateHunterDash(ship: CombatShipState) {
    const ability = ship.abilities['dash'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;

    ship.velocity.addScaledVector(ship.forward, 300);
    sound.playNitroBoost();
    this.addNotification(`${ship.name} WARP BOOST ENGAGED`, 'ABILITY', 'text-cyan-400');
  }

  public activateBossLunge(ship: CombatShipState) {
    const ability = ship.abilities['lunge'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;

    ship.velocity.addScaledVector(ship.forward, 380);
    sound.playHyperBoost();
    this.addNotification(`PREDATOR BOSS LUNGES FORWARD!`, 'ALERT', 'text-red-500');
  }

  public activateBossNova(ship: CombatShipState) {
    const ability = ship.abilities['nova'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;

    sound.playAlarmAlert();
    this.addNotification(`DANGER! NOVA ANNIHILATION DETONATING!`, 'ALERT', 'text-red-400');

    const domeGeo = new THREE.SphereGeometry(15, 24, 24);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.copy(ship.position);
    this.combatGroup.add(dome);

    this.shockwaves.push({
      id: `nova_${Date.now()}`,
      position: ship.position.clone(),
      currentRadius: 15,
      maxRadius: 210,
      expansionSpeed: 220,
      damage: 90,
      force: 260,
      faction: ship.faction,
      mesh: dome,
    });
  }

  public activateSurvivorDecoy(ship: CombatShipState) {
    const ability = ship.abilities['decoy'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;
    ability.activeTimeRemaining = ability.durationSeconds || 4;

    const decoyMesh = createProceduralShipMesh(ship.shipDefId, {
      primaryColorHex: '#00ffff',
      emissiveIntensity: 0.6,
    });
    decoyMesh.position.copy(ship.position);
    this.combatGroup.add(decoyMesh);

    setTimeout(() => {
      this.combatGroup.remove(decoyMesh);
    }, 4000);

    sound.playDecoySpawn();
    this.addNotification(`${ship.name} DEPLOYED ENERGY DECOY`, 'ABILITY', 'text-emerald-400');
  }

  public deployDefensiveTrap(ship: CombatShipState) {
    const ability = ship.abilities['trap'];
    if (!ability || ability.currentCooldown > 0) return;
    ability.currentCooldown = ability.cooldownSeconds;

    const trapGroup = new THREE.Group();
    // Drop behind the ship (+Z local)
    trapGroup.position.copy(ship.position).addScaledVector(ship.forward, -24);

    const mineGeo = new THREE.OctahedronGeometry(7);
    const mineMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
    const mine = new THREE.Mesh(mineGeo, mineMat);
    trapGroup.add(mine);
    this.combatGroup.add(trapGroup);

    this.traps.push({
      id: `trap_${Date.now()}`,
      ownerId: ship.id,
      position: trapGroup.position.clone(),
      radius: 34,
      damage: 130,
      slowFactor: 0.45,
      duration: 4.0,
      lifetime: 35,
      detonated: false,
      mesh: trapGroup,
    });

    sound.playTargetLock();
    this.addNotification(`${ship.name} PLANTED PLASMA MINE`, 'ABILITY', 'text-emerald-400');
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;

      p.position.addScaledVector(p.velocity, dt);
      if (p.mesh) {
        p.mesh.position.copy(p.position);
      }

      let hit = false;
      for (const ship of this.ships) {
        if (!ship.isAlive || ship.isDisabled || ship.faction === p.faction) continue;

        const dist = p.position.distanceTo(ship.position);
        if (dist < p.radius + 14) {
          hit = true;
          this.applyDamage(ship, p.damage, p.ownerRole);

          const attacker = this.ships.find((s) => s.id === p.ownerId);
          if (attacker) {
            attacker.damageDealt += p.damage;
          }
          break;
        }
      }

      if (hit || p.lifetime <= 0) {
        if (p.mesh) {
          this.combatGroup.remove(p.mesh);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateTraps(dt: number) {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i];
      trap.lifetime -= dt;
      if (trap.mesh) {
        trap.mesh.rotation.y += dt * 3.2;
      }

      for (const ship of this.ships) {
        if (!ship.isAlive || ship.role !== 'BOSS') continue;

        const dist = trap.position.distanceTo(ship.position);
        if (dist <= trap.radius) {
          trap.detonated = true;
          this.applyDamage(ship, trap.damage, 'PLASMA MINE');
          ship.velocity.multiplyScalar(trap.slowFactor);
          sound.playExplosion();
          this.addNotification(`PLASMA MINE DETONATED ON ${ship.name}!`, 'ALERT', 'text-emerald-400');
          break;
        }
      }

      if (trap.detonated || trap.lifetime <= 0) {
        if (trap.mesh) {
          this.combatGroup.remove(trap.mesh);
        }
        this.traps.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.currentRadius += sw.expansionSpeed * dt;

      if (sw.mesh) {
        const scale = sw.currentRadius;
        sw.mesh.scale.set(scale, scale, scale);
      }

      for (const ship of this.ships) {
        if (!ship.isAlive || ship.isDisabled || ship.faction === sw.faction) continue;

        const dist = sw.position.distanceTo(ship.position);
        if (Math.abs(dist - sw.currentRadius) < 28) {
          const pushDir = ship.position.clone().sub(sw.position).normalize();
          ship.velocity.addScaledVector(pushDir, sw.force);
          this.applyDamage(ship, sw.damage * dt * 2, 'SHOCKWAVE');
        }
      }

      if (sw.currentRadius >= sw.maxRadius) {
        if (sw.mesh) {
          this.combatGroup.remove(sw.mesh);
        }
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private updateDisabledShip(ship: CombatShipState, dt: number) {
    ship.velocity.multiplyScalar(0.96);
    ship.position.addScaledVector(ship.velocity, dt);

    if (!ship.revivingShipId) {
      ship.reviveProgress = Math.max(0, ship.reviveProgress - dt * 0.5);
    }
    ship.revivingShipId = undefined;

    if (ship.mesh) {
      ship.mesh.position.copy(ship.position);
      ship.mesh.rotation.z += dt * 0.6;
    }
  }

  private reviveShip(ship: CombatShipState, rescuer: CombatShipState) {
    ship.isDisabled = false;
    ship.health = 45;
    ship.shield = 20;
    ship.reviveProgress = 0;
    rescuer.revivesDone++;
    sound.playUpgradeUnlock();
    this.addNotification(`${ship.name} WAS REVIVED BY ${rescuer.name}!`, 'REVIVE', 'text-emerald-400');
  }

  public applyDamage(ship: CombatShipState, amount: number, source: string) {
    if (!ship.isAlive) return;

    ship.damageTaken += amount;
    ship.hitFlashTimer = 0.2;

    if (ship.isPlayer) {
      this.damageFlashActive = true;
      this.damageFlashTimer = 0.25;
      sound.playHeavyImpact();
    }

    if (ship.shield > 0) {
      ship.shield -= amount;
      if (ship.shield < 0) {
        ship.health += ship.shield;
        ship.shield = 0;
      }
      sound.playShieldHit();
    } else {
      ship.health = Math.max(0, ship.health - amount);
    }

    if (ship.health <= 0) {
      if (ship.role === 'SURVIVOR' && !ship.isDisabled) {
        ship.isDisabled = true;
        ship.health = 0;
        ship.reviveProgress = 0;
        sound.playAlarmAlert();
        this.addNotification(`${ship.name} IS DISABLED! TEAMMATE REVIVE REQUIRED!`, 'WARNING', 'text-amber-400');
      } else {
        this.destroyShip(ship, source);
      }
    }
  }

  private destroyShip(ship: CombatShipState, source: string) {
    ship.isAlive = false;
    sound.playExplosion();
    this.addNotification(`${ship.name} DESTROYED (${source})`, 'KILL', 'text-red-400');

    if (ship.mesh) {
      this.combatGroup.remove(ship.mesh);
    }
  }

  private updateShipAbilities(ship: CombatShipState, dt: number) {
    for (const key in ship.abilities) {
      const ability = ship.abilities[key];
      if (ability.currentCooldown > 0) {
        ability.currentCooldown = Math.max(0, ability.currentCooldown - dt);
      }
      if (ability.activeTimeRemaining !== undefined && ability.activeTimeRemaining > 0) {
        ability.activeTimeRemaining = Math.max(0, ability.activeTimeRemaining - dt);
        if (ability.activeTimeRemaining <= 0 && ability.id === 'bulwark') {
          ship.primaryFireRate /= 1.35;
        }
      }
    }
  }

  private checkMatchConditions() {
    if (this.isMatchOver) return;

    const isApex = this.currentConfig.mode === 'APEX_PREDATOR';
    const playerRole = this.currentConfig.playerRole;

    if (isApex) {
      const jugg = this.ships.find((s) => s.role === 'JUGGERNAUT');
      const huntersAlive = this.ships.filter((s) => s.role === 'HUNTER' && s.isAlive);

      if (!jugg || !jugg.isAlive) {
        this.endMatch({
          winningFaction: 'SWARM',
          reason: 'TITAN DREADNOUGHT HAS BEEN DESTROYED BY THE SWARM',
          victory: playerRole === 'HUNTER',
        });
      } else if (huntersAlive.length === 0) {
        this.endMatch({
          winningFaction: 'TITAN',
          reason: 'ALL 7 SWARM HUNTERS HAVE BEEN ANNIHILATED',
          victory: playerRole === 'JUGGERNAUT',
        });
      } else if (this.timeRemaining <= 0) {
        this.endMatch({
          winningFaction: 'TITAN',
          reason: 'TITAN JUGGERNAUT SURVIVED EXTRACTION CLOCK REACHING 00:00',
          victory: playerRole === 'JUGGERNAUT',
        });
      }
    } else {
      const boss = this.ships.find((s) => s.role === 'BOSS');
      const operationalSurvivors = this.ships.filter(
        (s) => s.role === 'SURVIVOR' && s.isAlive && !s.isDisabled
      );

      if (!boss || !boss.isAlive) {
        this.endMatch({
          winningFaction: 'SURVIVORS',
          reason: 'PREDATOR BOSS HAS BEEN ELIMINATED BY SURVIVORS',
          victory: playerRole === 'SURVIVOR',
        });
      } else if (operationalSurvivors.length === 0) {
        this.endMatch({
          winningFaction: 'BOSS',
          reason: 'ALL 7 SURVIVORS HAVE BEEN WIPED OUT',
          victory: playerRole === 'BOSS',
        });
      } else if (this.timeRemaining <= 0) {
        this.endMatch({
          winningFaction: 'SURVIVORS',
          reason: 'SURVIVORS WITHSTOOD THE BOSS UNTIL EXTRACTION AT 00:00',
          victory: playerRole === 'SURVIVOR',
        });
      }
    }
  }

  private endMatch(result: { winningFaction: JuggernautFaction; reason: string; victory: boolean }) {
    this.isMatchOver = true;
    sound.playFinish();

    for (const p of this.projectiles) {
      if (p.mesh) this.combatGroup.remove(p.mesh);
    }
    this.projectiles = [];
    for (const sw of this.shockwaves) {
      if (sw.mesh) this.combatGroup.remove(sw.mesh);
    }
    this.shockwaves = [];
    for (const tr of this.traps) {
      if (tr.mesh) this.combatGroup.remove(tr.mesh);
    }
    this.traps = [];

    const p = this.playerShip;
    const matchElapsed = Math.round(this.totalMatchDuration - this.timeRemaining);

    this.finalStats = {
      mode: this.currentConfig.mode,
      playerRole: this.currentConfig.playerRole,
      winningFaction: result.winningFaction,
      victory: result.victory,
      reason: result.reason,
      matchTimeSeconds: matchElapsed,
      totalDamageDealt: Math.round(p?.damageDealt || 0),
      totalDamageTaken: Math.round(p?.damageTaken || 0),
      shipsEliminated: p?.kills || 0,
      shipsRemaining: this.ships.filter((s) => s.isAlive && !s.isDisabled).length,
      revivesCompleted: p?.revivesDone || 0,
      accuracyPercent: 78,
      creditsEarned: result.victory ? 4500 : 1500,
      xpEarned: result.victory ? 800 : 300,
    };
  }

  public setDirectionalInput(input: Partial<{ forward: boolean; backward: boolean; left: boolean; right: boolean; up: boolean; down: boolean }>) {
    this.directionalInput = { ...this.directionalInput, ...input };
  }

  public handleKeyDown(code: string) {
    this.keysDown[code] = true;

    if (!this.playerShip || !this.playerShip.isAlive || this.isMatchOver) return;

    if (code === 'KeyE') {
      if (this.playerShip.role === 'JUGGERNAUT') {
        this.activateJuggernautShockwave(this.playerShip);
      } else if (this.playerShip.role === 'BOSS') {
        this.activateBossNova(this.playerShip);
      } else if (this.playerShip.role === 'SURVIVOR') {
        this.deployDefensiveTrap(this.playerShip);
      }
    } else if (code === 'KeyQ') {
      if (this.playerShip.role === 'JUGGERNAUT') {
        this.activateJuggernautBulwark(this.playerShip);
      } else if (this.playerShip.role === 'SURVIVOR') {
        this.activateSurvivorDecoy(this.playerShip);
      }
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (this.playerShip.role === 'HUNTER') {
        this.activateHunterDash(this.playerShip);
      } else if (this.playerShip.role === 'BOSS') {
        this.activateBossLunge(this.playerShip);
      }
    }
  }

  public handleKeyUp(code: string) {
    this.keysDown[code] = false;
  }

  public setJoystickSteering(steerX: number, pitchY: number) {
    this.joystickSteerX = Math.max(-1, Math.min(1, steerX));
    this.joystickPitchY = Math.max(-1, Math.min(1, pitchY));
  }

  public setFiringState(firing: boolean) {
    this.isTouchFiring = firing;
  }

  public setBoostingState(boosting: boolean) {
    this.isTouchBoosting = boosting;
  }

  public triggerPlayerAbility(abilityId: string) {
    if (!this.playerShip || !this.playerShip.isAlive || this.isMatchOver) return;
    if (abilityId === 'shockwave') this.activateJuggernautShockwave(this.playerShip);
    else if (abilityId === 'bulwark') this.activateJuggernautBulwark(this.playerShip);
    else if (abilityId === 'dash') this.activateHunterDash(this.playerShip);
    else if (abilityId === 'lunge') this.activateBossLunge(this.playerShip);
    else if (abilityId === 'nova') this.activateBossNova(this.playerShip);
    else if (abilityId === 'decoy') this.activateSurvivorDecoy(this.playerShip);
    else if (abilityId === 'trap') this.deployDefensiveTrap(this.playerShip);
  }

  public addNotification(text: string, type: 'KILL' | 'REVIVE' | 'ABILITY' | 'WARNING' | 'ALERT', colorClass: string) {
    this.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now(),
      colorClass,
    });
    if (this.notifications.length > 5) {
      this.notifications.pop();
    }
  }

  public getTelemetry(): JuggernautCombatTelemetry {
    const p = this.playerShip;
    const bossOrTitan = this.ships.find(
      (s) => s.role === 'JUGGERNAUT' || s.role === 'BOSS'
    );

    const boundInfo = p
      ? juggernautArena.checkBoundary(p.position)
      : { distanceFromCenter: 0, isNearBoundary: false, isOutOfBounds: false };

    const platformRadius = juggernautArena.platformRadius;
    const deckElevation = juggernautArena.deckElevation;
    const playerAltitude = p ? Math.round(p.position.y - deckElevation) : 0;
    const horizDist = p ? Math.sqrt(p.position.x * p.position.x + p.position.z * p.position.z) : 0;
    const distToPlatformEdge = Math.round(platformRadius - horizDist);
    const isNearPlatformEdge = distToPlatformEdge >= 0 && distToPlatformEdge <= 160;
    const isFallingOffPlatform = p ? p.position.y < deckElevation - 30 && horizDist > platformRadius : false;

    let lockedTarget: any = undefined;
    if (p && p.isAlive) {
      const enemy = this.getBestAITarget(p);
      if (enemy) {
        lockedTarget = {
          id: enemy.id,
          name: enemy.name,
          health: Math.round(enemy.health),
          maxHealth: enemy.maxHealth,
          distance: Math.round(p.position.distanceTo(enemy.position)),
        };
      }
    }

    return {
      isActive: this.isActive,
      isPaused: this.isPaused,
      mode: this.currentConfig.mode,
      playerRole: this.currentConfig.playerRole,
      playerFaction: p?.faction || 'TITAN',
      timeRemainingSeconds: Math.max(0, Math.round(this.timeRemaining)),
      totalMatchSeconds: this.totalMatchDuration,
      playerHealth: Math.round(p?.health || 0),
      playerMaxHealth: p?.maxHealth || 100,
      playerShield: Math.round(p?.shield || 0),
      playerMaxShield: p?.maxShield || 50,
      playerSpeedKmh: Math.round((p?.velocity.length() || 0) * 1.5),
      playerIsAlive: p?.isAlive ?? false,
      playerIsDisabled: p?.isDisabled ?? false,
      playerReviveProgress: p?.reviveProgress || 0,
      playerBoostCharge: Math.round(p?.boostCharge || 0),
      playerAbilities: p?.abilities || {},
      bossOrTitanShip: bossOrTitan
        ? {
            id: bossOrTitan.id,
            name: bossOrTitan.name,
            role: bossOrTitan.role,
            health: Math.round(bossOrTitan.health),
            maxHealth: bossOrTitan.maxHealth,
            shield: Math.round(bossOrTitan.shield),
            maxShield: bossOrTitan.maxShield,
          }
        : undefined,
      allShips: this.ships.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        faction: s.faction,
        isPlayer: s.isPlayer,
        health: Math.round(s.health),
        maxHealth: s.maxHealth,
        shield: Math.round(s.shield),
        maxShield: s.maxShield,
        isAlive: s.isAlive,
        isDisabled: s.isDisabled,
        distanceToPlayer: p ? Math.round(p.position.distanceTo(s.position)) : 0,
      })),
      lockedTarget,
      arenaRadius: juggernautArena.currentRadius,
      platformRadius,
      deckElevation,
      playerAltitude,
      distanceFromCenter: boundInfo.distanceFromCenter,
      distanceToPlatformEdge: distToPlatformEdge,
      isNearBoundary: boundInfo.isNearBoundary,
      isNearPlatformEdge,
      isFallingOffPlatform,
      isOutOfBounds: boundInfo.isOutOfBounds,
      notifications: this.notifications,
      playerDamageFlash: this.damageFlashActive,
      isMatchOver: this.isMatchOver,
      finalStats: this.finalStats,
    };
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public resume() {
    this.isPaused = false;
  }

  public restartMatch() {
    this.startMatch(this.currentConfig);
  }

  public cleanUp() {
    this.isActive = false;
    this.isPaused = false;
    this.isMatchOver = false;
    this.finalStats = null;
    this.combatGroup.clear();
    this.ships = [];
    this.projectiles = [];
    this.traps = [];
    this.shockwaves = [];
    this.notifications = [];
    this.keysDown = {};
    this.directionalInput = { forward: false, backward: false, left: false, right: false, up: false, down: false };
    this.joystickSteerX = 0;
    this.joystickPitchY = 0;
    this.isTouchFiring = false;
    this.isTouchBoosting = false;
    juggernautArena.dispose();
  }
}

export const juggernautCombatManager = new JuggernautCombatDirector();
