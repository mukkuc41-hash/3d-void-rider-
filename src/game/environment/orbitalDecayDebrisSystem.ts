import * as THREE from 'three';

/**
 * Orbital Decaying Debris & Meteoroid Physics Definition
 */
export type OrbitalDebrisType =
  | 'METEOROID_CRAGGY'
  | 'METEOROID_MOLTEN'
  | 'STATION_TRUSS'
  | 'SATELLITE_PANEL'
  | 'PLANETARY_SHARD'
  | 'HEAVY_BOULDER';

export interface DecayingOrbitalEntity {
  id: number;
  type: OrbitalDebrisType;
  meshIndex: number;
  radius: number;           // Distance from black hole center
  initialRadius: number;
  angle: number;            // Current orbital angle around BH Y-axis
  speed: number;            // Angular orbital velocity
  verticalOffset: number;   // Deviation from accretion disk plane
  decayRate: number;        // Speed at which radius decreases
  rotationSpeed: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  baseScale: number;
  stretchFactor: number;    // Spaghettification elongation along radial axis
  temperature: number;      // Celsius equivalent (0 cold -> 10000 incandescent)
  active: boolean;
  isInfallActive: boolean;
  minHorizonRadius: number; // ISCO / horizon boundary where it vaporizes
}

/**
 * System managing meteoroids and space debris losing their orbits
 * and spiraling dynamically into Sagittarius A* and its accretion disk.
 */
export class OrbitalDecayDebrisSystem {
  public root: THREE.Group;
  private scene: THREE.Scene;
  private blackHolePosition: THREE.Vector3;
  private horizonRadius: number;
  private iscoRadius: number;

  // Instanced Meshes for high performance 60fps rendering
  private meteoroidInstancedMesh!: THREE.InstancedMesh;
  private spaceDebrisInstancedMesh!: THREE.InstancedMesh;
  private planetaryShardInstancedMesh!: THREE.InstancedMesh;

  // Fiery Ablation Particle Trails for debris entering accretion disk
  private ablationPoints!: THREE.Points;
  private ablationPositions!: Float32Array;
  private ablationColors!: Float32Array;
  private ablationSizes!: Float32Array;
  private readonly ablationCount = 600;

  // Flash flare meshes for ISCO vaporization
  private impactFlaresGroup!: THREE.Group;
  private activeFlares: {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    age: number;
    maxAge: number;
    scaleSpeed: number;
  }[] = [];

  // Entity Simulation Data
  private entities: DecayingOrbitalEntity[] = [];
  private readonly meteoroidCount = 60;
  private readonly spaceDebrisCount = 45;
  private readonly planetaryShardCount = 35;
  private totalCount = 140;

  // Event-Driven Parameters
  private currentEventIndex = 1;
  private eventDecayMultiplier = 1.0;
  private tidalShearMultiplier = 1.0;
  private accretionPlaneTilt = 0.18; // slight realistic tilt of accretion disk

  constructor(scene: THREE.Scene, blackHolePos = new THREE.Vector3(0, 180, -3500), horizonRadius = 310) {
    this.scene = scene;
    this.blackHolePosition = blackHolePos.clone();
    this.horizonRadius = horizonRadius;
    this.iscoRadius = horizonRadius * 1.5; // ISCO ~ 465m

    this.root = new THREE.Group();
    this.root.name = 'OrbitalDecayDebrisSystem_Root';

    this.impactFlaresGroup = new THREE.Group();
    this.impactFlaresGroup.name = 'DebrisImpactFlares';
    this.root.add(this.impactFlaresGroup);

    this.initGeometriesAndMaterials();
    this.initEntities();
    this.initAblationTrails();

    this.scene.add(this.root);
  }

  /**
   * Initializes high-fidelity craggy meteoroid, metallic truss, and shard geometries
   */
  private initGeometriesAndMaterials(): void {
    // 1. Craggy Basalt Meteoroids with fiery thermal vertex glow
    const rockGeo = new THREE.DodecahedronGeometry(6.0, 1);
    const rockPosAttr = rockGeo.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < rockPosAttr.count; i++) {
      vertex.fromBufferAttribute(rockPosAttr, i);
      const deform = 1.0 + (Math.sin(vertex.x * 1.8) + Math.cos(vertex.y * 2.1) + Math.sin(vertex.z * 1.5)) * 0.22;
      vertex.multiplyScalar(deform);
      rockPosAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0xff3b00,
      emissiveIntensity: 0.6,
    });
    this.meteoroidInstancedMesh = new THREE.InstancedMesh(rockGeo, rockMat, this.meteoroidCount);
    this.meteoroidInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.meteoroidInstancedMesh.castShadow = false;
    this.meteoroidInstancedMesh.receiveShadow = false;
    this.root.add(this.meteoroidInstancedMesh);

    // 2. Space Debris (Shattered satellite wings & structural station box frames)
    const trussGeo = new THREE.BoxGeometry(4.5, 2.2, 12.0);
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.9,
      emissive: 0xffaa00,
      emissiveIntensity: 0.45,
    });
    this.spaceDebrisInstancedMesh = new THREE.InstancedMesh(trussGeo, trussMat, this.spaceDebrisCount);
    this.spaceDebrisInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.root.add(this.spaceDebrisInstancedMesh);

    // 3. Planetary Crust & Mantle Shards (Jagged flat plates with glowing magma veins)
    const shardGeo = new THREE.ConeGeometry(7.0, 16.0, 5);
    shardGeo.rotateX(Math.PI / 2);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.4,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
    });
    this.planetaryShardInstancedMesh = new THREE.InstancedMesh(shardGeo, shardMat, this.planetaryShardCount);
    this.planetaryShardInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.root.add(this.planetaryShardInstancedMesh);
  }

  /**
   * Initializes ablation particle spark trails that trail behind infalling bodies
   */
  private initAblationTrails(): void {
    const geo = new THREE.BufferGeometry();
    this.ablationPositions = new Float32Array(this.ablationCount * 3);
    this.ablationColors = new Float32Array(this.ablationCount * 3);
    this.ablationSizes = new Float32Array(this.ablationCount);

    for (let i = 0; i < this.ablationCount; i++) {
      this.ablationPositions[i * 3] = this.blackHolePosition.x;
      this.ablationPositions[i * 3 + 1] = this.blackHolePosition.y;
      this.ablationPositions[i * 3 + 2] = this.blackHolePosition.z;

      // Fiery Sgr A* gold/ruby gradient
      const isGold = Math.random() > 0.4;
      this.ablationColors[i * 3] = 1.0;
      this.ablationColors[i * 3 + 1] = isGold ? 0.85 : 0.25;
      this.ablationColors[i * 3 + 2] = isGold ? 0.2 : 0.05;

      this.ablationSizes[i] = 10.0 + Math.random() * 25.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.ablationPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.ablationColors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,215,0,0.85)');
      grad.addColorStop(0.7, 'rgba(255,69,0,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 24,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.ablationPoints = new THREE.Points(geo, mat);
    this.root.add(this.ablationPoints);
  }

  /**
   * Initializes initial orbital states for all bodies
   */
  private initEntities(): void {
    let id = 0;

    // A. Meteoroids
    for (let i = 0; i < this.meteoroidCount; i++) {
      this.entities.push(this.createEntity(id++, 'METEOROID_CRAGGY', i));
    }

    // B. Space Debris
    for (let i = 0; i < this.spaceDebrisCount; i++) {
      this.entities.push(this.createEntity(id++, 'STATION_TRUSS', i));
    }

    // C. Planetary Shards
    for (let i = 0; i < this.planetaryShardCount; i++) {
      this.entities.push(this.createEntity(id++, 'PLANETARY_SHARD', i));
    }
  }

  /**
   * Generates a single orbital entity with randomized decaying orbital parameters
   */
  private createEntity(id: number, type: OrbitalDebrisType, meshIndex: number): DecayingOrbitalEntity {
    // Initial distance: between 1100m and 3400m
    const initialRadius = 1100 + Math.random() * 2300;
    const angle = Math.random() * Math.PI * 2;
    // Base Keplerian angular speed (v_theta ~ 1 / sqrt(r))
    const baseSpeed = (0.28 + Math.random() * 0.22) * (1800 / Math.max(800, initialRadius));
    // Vertical distance from accretion disk plane
    const verticalOffset = (Math.random() - 0.5) * (initialRadius * 0.28);
    // Base orbital decay velocity (meters per second)
    const decayRate = 35 + Math.random() * 65;
    const baseScale = type === 'PLANETARY_SHARD' ? 1.4 + Math.random() * 2.2 : 0.8 + Math.random() * 1.8;

    return {
      id,
      type,
      meshIndex,
      radius: initialRadius,
      initialRadius,
      angle,
      speed: baseSpeed,
      verticalOffset,
      decayRate,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      scale: new THREE.Vector3(baseScale, baseScale, baseScale),
      baseScale,
      stretchFactor: 1.0,
      temperature: 300, // Kelvin equivalent
      active: true,
      isInfallActive: false,
      minHorizonRadius: this.horizonRadius * (1.05 + Math.random() * 0.25),
    };
  }

  /**
   * Updates catastrophe event progression to escalate orbital decay and tidal shear
   */
  public setEventProgress(eventIndex: number): void {
    this.currentEventIndex = Math.max(1, Math.min(66, eventIndex));

    // Scale decay rate based on catastrophe events
    // Event 01-10: 1.0 -> 1.5x
    // Event 11-20: 1.5 -> 2.5x
    // Event 21-35: 2.5 -> 4.5x
    // Event 36-66: Escalating structural and orbital debris infall
    const progress = (this.currentEventIndex - 1) / 65;
    this.eventDecayMultiplier = 1.0 + Math.pow(progress, 1.4) * 7.5;
    this.tidalShearMultiplier = 1.0 + Math.pow(progress, 1.2) * 6.0;
  }

  /**
   * Spawns an energetic ISCO vaporization plasma flare when a body strikes the event horizon
   */
  private triggerImpactFlare(pos: THREE.Vector3, scale = 1.0): void {
    const geo = new THREE.SphereGeometry(18 * scale, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.impactFlaresGroup.add(mesh);

    this.activeFlares.push({
      mesh,
      mat,
      age: 0,
      maxAge: 0.85,
      scaleSpeed: 45 * scale,
    });
  }

  /**
   * Per-frame physics and orbital decay update
   */
  public update(dt: number): void {
    const delta = Math.max(0, Math.min(dt, 0.2));
    const dummy = new THREE.Object3D();
    const ablPos = this.ablationPositions;
    let ablIdx = 0;

    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.active) continue;

      // 1. Keplerian Angular Acceleration as radius shrinks (conservation of angular momentum)
      const rRatio = Math.max(0.2, e.radius / e.initialRadius);
      const currentAngularSpeed = (e.speed / Math.pow(rRatio, 0.65)) * (1.0 + (this.currentEventIndex - 1) * 0.035);
      e.angle += delta * currentAngularSpeed;

      // 2. Gravitational orbital decay (losing orbit and falling inward)
      const currentDecay = e.decayRate * this.eventDecayMultiplier * (1.0 + 1200 / Math.max(400, e.radius));
      e.radius -= delta * currentDecay;

      // 3. Incline damping: Gas drag in accretion disk flattens vertical orbit into disk plane
      const flattenFactor = Math.min(1.0, e.radius / 1400);
      e.verticalOffset = THREE.MathUtils.lerp(e.verticalOffset, 0, delta * (1.2 - flattenFactor * 0.8));

      // 4. Compute 3D Cartesian coordinates relative to Black Hole Center
      const cosA = Math.cos(e.angle);
      const sinA = Math.sin(e.angle);
      // Slight tilt of accretion disk plane
      const worldX = this.blackHolePosition.x + cosA * e.radius;
      const worldY = this.blackHolePosition.y + e.verticalOffset + Math.sin(e.angle * 2.0) * (e.radius * this.accretionPlaneTilt * 0.15);
      const worldZ = this.blackHolePosition.z + sinA * e.radius;

      // 5. Tidal Spaghettification & Thermal Heating inside Accretion Disk Zone
      if (e.radius < 1200) {
        e.isInfallActive = true;
        // Thermal incandescence: heats up dramatically as it approaches ISCO
        e.temperature = THREE.MathUtils.lerp(300, 12000, 1.0 - Math.max(0, e.radius - e.minHorizonRadius) / (1200 - e.minHorizonRadius));

        // Tidal radial stretch along infall vector
        const stretch = 1.0 + Math.pow(1.0 - e.radius / 1200, 1.5) * 3.5 * this.tidalShearMultiplier;
        e.stretchFactor = Math.min(5.5, stretch);
      } else {
        e.isInfallActive = false;
        e.stretchFactor = 1.0;
        e.temperature = 300;
      }

      // 6. Deposit Ablation Spark Trails for debris in the hot accretion zone
      if (e.isInfallActive && ablIdx < this.ablationCount) {
        ablPos[ablIdx * 3] = worldX + (Math.random() - 0.5) * 8.0;
        ablPos[ablIdx * 3 + 1] = worldY + (Math.random() - 0.5) * 6.0;
        ablPos[ablIdx * 3 + 2] = worldZ + (Math.random() - 0.5) * 8.0;
        ablIdx++;
      }

      // 7. Check terminal horizon crossing (ISCO plunge & vaporization)
      if (e.radius <= e.minHorizonRadius) {
        // Vaporize with relativistic flash
        this.triggerImpactFlare(new THREE.Vector3(worldX, worldY, worldZ), e.baseScale);

        // Respawn in high outer orbit with new randomized trajectory
        e.radius = 2200 + Math.random() * 1400;
        e.initialRadius = e.radius;
        e.angle = Math.random() * Math.PI * 2;
        e.verticalOffset = (Math.random() - 0.5) * (e.radius * 0.32);
        e.stretchFactor = 1.0;
        e.temperature = 300;
      }

      // 8. Dynamic 3-Axis Tumbling
      e.rotation.x += e.rotationSpeed.x * delta;
      e.rotation.y += e.rotationSpeed.y * delta;
      e.rotation.z += e.rotationSpeed.z * delta;

      // 9. Update Instanced Matrix
      dummy.position.set(worldX, worldY, worldZ);
      dummy.rotation.copy(e.rotation);
      // Elongate along radial plunge direction
      dummy.scale.set(
        e.baseScale / Math.sqrt(e.stretchFactor),
        e.baseScale / Math.sqrt(e.stretchFactor),
        e.baseScale * e.stretchFactor
      );
      dummy.updateMatrix();

      if (e.type === 'METEOROID_CRAGGY') {
        this.meteoroidInstancedMesh.setMatrixAt(e.meshIndex, dummy.matrix);
      } else if (e.type === 'STATION_TRUSS') {
        this.spaceDebrisInstancedMesh.setMatrixAt(e.meshIndex, dummy.matrix);
      } else if (e.type === 'PLANETARY_SHARD') {
        this.planetaryShardInstancedMesh.setMatrixAt(e.meshIndex, dummy.matrix);
      }
    }

    this.meteoroidInstancedMesh.instanceMatrix.needsUpdate = true;
    this.spaceDebrisInstancedMesh.instanceMatrix.needsUpdate = true;
    this.planetaryShardInstancedMesh.instanceMatrix.needsUpdate = true;

    // Update particle spark trails buffer
    if (this.ablationPoints) {
      const posAttr = this.ablationPoints.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }

    // 10. Update Active ISCO Impact Flares
    for (let f = this.activeFlares.length - 1; f >= 0; f--) {
      const fl = this.activeFlares[f];
      fl.age += delta;
      const prog = fl.age / fl.maxAge;
      if (prog >= 1.0) {
        this.impactFlaresGroup.remove(fl.mesh);
        fl.mesh.geometry.dispose();
        fl.mat.dispose();
        this.activeFlares.splice(f, 1);
      } else {
        const curScale = 1.0 + fl.scaleSpeed * fl.age;
        fl.mesh.scale.set(curScale, curScale, curScale);
        fl.mat.opacity = (1.0 - prog) * 0.95;
      }
    }
  }

  /**
   * Cleans up all Three.js resources
   */
  public dispose(): void {
    this.meteoroidInstancedMesh.geometry.dispose();
    (this.meteoroidInstancedMesh.material as THREE.Material).dispose();

    this.spaceDebrisInstancedMesh.geometry.dispose();
    (this.spaceDebrisInstancedMesh.material as THREE.Material).dispose();

    this.planetaryShardInstancedMesh.geometry.dispose();
    (this.planetaryShardInstancedMesh.material as THREE.Material).dispose();

    if (this.ablationPoints) {
      this.ablationPoints.geometry.dispose();
      (this.ablationPoints.material as THREE.Material).dispose();
    }

    this.activeFlares.forEach(fl => {
      fl.mesh.geometry.dispose();
      fl.mat.dispose();
    });
    this.activeFlares = [];

    this.scene.remove(this.root);
  }
}
