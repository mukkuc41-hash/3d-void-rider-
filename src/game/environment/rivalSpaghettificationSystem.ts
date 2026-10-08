import * as THREE from 'three';
import { sound } from '../audio';

export interface SpaghettifiedRivalState {
  aiId: string;
  name: string;
  group: THREE.Group;
  initialScale: THREE.Vector3;
  distanceToSingularity: number;
  tidalStrain: number; // 0 to 1
  isCaughtInHorizon: boolean;
  infallTimer: number; // seconds since capture
  infallStage: 'ORBITAL' | 'CAPTURED' | 'ELONGATING' | 'FILAMENT_SPIRAL' | 'CONSUMED';
  ribbonMesh?: THREE.Line;
  ribbonGeometry?: THREE.BufferGeometry;
  ribbonPositions?: Float32Array;
  materialsHooked: boolean;
  customUniforms: {
    uBlackHoleCenter: { value: THREE.Vector3 };
    uSpaghettifyStrength: { value: number };
    uTidalStretch: { value: number };
    uTidalSqueeze: { value: number };
    uHorizonRedshift: { value: number };
    uTime: { value: number };
  };
}

export interface RivalSpaghettificationTelemetry {
  activeSpaghettifyingCount: number;
  mostEndangeredRivalName: string | null;
  highestTidalStrain: number;
  nearestRivalHorizonDist: number;
  recentCasualties: string[];
}

/**
 * Real Procedural GPU-based Vertex Shader & Filament Spaghettification System
 * specifically designed for Submode 10: The Final Collapse.
 */
export class RivalSpaghettificationSystem {
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;
  private rivals: Map<string, SpaghettifiedRivalState> = new Map();
  private ribbonsGroup: THREE.Group;
  private casualties: string[] = [];
  private eventHorizonRadius = 140; // Schwarzschild radius
  private isSubmode10 = false;
  private currentStageIndex = 1;
  private elapsed = 0;

  constructor(scene: THREE.Scene, blackHoleCenter: THREE.Vector3) {
    this.scene = scene;
    this.blackHoleCenter = blackHoleCenter.clone();
    this.ribbonsGroup = new THREE.Group();
    this.ribbonsGroup.name = 'rival_spaghettification_ribbons';
    this.scene.add(this.ribbonsGroup);
  }

  public setSubmode10Active(active: boolean, blackHolePos?: THREE.Vector3): void {
    this.isSubmode10 = active;
    if (blackHolePos) {
      this.blackHoleCenter.copy(blackHolePos);
    }
    if (!active) {
      this.reset();
    }
  }

  public setStage(stageIndex: number, elapsed: number): void {
    this.currentStageIndex = stageIndex;
    this.elapsed = elapsed;
  }

  /**
   * Registers or updates an AI competitor ship group with custom GPU shader hooks.
   */
  public registerRival(id: string, name: string, group: THREE.Group): void {
    if (this.rivals.has(id)) return;

    const uniforms = {
      uBlackHoleCenter: { value: this.blackHoleCenter.clone() },
      uSpaghettifyStrength: { value: 0.0 },
      uTidalStretch: { value: 1.0 },
      uTidalSqueeze: { value: 1.0 },
      uHorizonRedshift: { value: 0.0 },
      uTime: { value: 0.0 },
    };

    const state: SpaghettifiedRivalState = {
      aiId: id,
      name,
      group,
      initialScale: group.scale.clone(),
      distanceToSingularity: 9999,
      tidalStrain: 0,
      isCaughtInHorizon: false,
      infallTimer: 0,
      infallStage: 'ORBITAL',
      materialsHooked: false,
      customUniforms: uniforms,
    };

    this.hookGPUShader(group, uniforms);
    state.materialsHooked = true;

    // Create high-tensile ribbon for terminal infall
    const pointCount = 60;
    const ribbonGeom = new THREE.BufferGeometry();
    const ribbonPositions = new Float32Array(pointCount * 3);
    ribbonGeom.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
    const ribbonMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    const ribbonMesh = new THREE.Line(ribbonGeom, ribbonMat);
    ribbonMesh.visible = false;
    this.ribbonsGroup.add(ribbonMesh);

    state.ribbonMesh = ribbonMesh;
    state.ribbonGeometry = ribbonGeom;
    state.ribbonPositions = ribbonPositions;

    this.rivals.set(id, state);
  }

  /**
   * Injects the procedural GPU vertex & fragment shader deformation into ship materials.
   */
  private hookGPUShader(
    group: THREE.Group,
    uniforms: SpaghettifiedRivalState['customUniforms']
  ): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.Material & {
          onBeforeCompile?: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
        };

        // If multi-material or array
        const materials = Array.isArray(mat) ? mat : [mat];
        materials.forEach((m) => {
          m.onBeforeCompile = (shader) => {
            // Bind our dynamic uniforms
            shader.uniforms.uBlackHoleCenter = uniforms.uBlackHoleCenter;
            shader.uniforms.uSpaghettifyStrength = uniforms.uSpaghettifyStrength;
            shader.uniforms.uTidalStretch = uniforms.uTidalStretch;
            shader.uniforms.uTidalSqueeze = uniforms.uTidalSqueeze;
            shader.uniforms.uHorizonRedshift = uniforms.uHorizonRedshift;
            shader.uniforms.uTime = uniforms.uTime;

            // 1. Inject Uniforms in Vertex Shader
            shader.vertexShader = `
              uniform vec3 uBlackHoleCenter;
              uniform float uSpaghettifyStrength;
              uniform float uTidalStretch;
              uniform float uTidalSqueeze;
              uniform float uHorizonRedshift;
              uniform float uTime;
              ${shader.vertexShader}
            `;

            // 2. Inject GPU-based Vertex Spaghettification & Tidal Warp
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>

              if (uSpaghettifyStrength > 0.0005) {
                // Compute world-space position approximation of this vertex
                vec4 worldV = modelMatrix * vec4(position, 1.0);
                vec3 pullDir = normalize(uBlackHoleCenter - worldV.xyz);

                // Approximate object-space gravitational vector
                vec3 localBh = (inverse(modelMatrix) * vec4(uBlackHoleCenter, 1.0)).xyz;
                vec3 localPullDir = normalize(localBh - position);

                // Project vertex along tidal radial line vs transverse perpendicular plane
                float longitudinal = dot(transformed, localPullDir);
                vec3 transverse = transformed - localPullDir * longitudinal;

                // Non-linear tidal elongation with gradient (head stretches faster than tail)
                float stretchGrad = 1.0 + (longitudinal + 3.0) * 0.18 * (uTidalStretch - 1.0);
                float tidalLong = longitudinal * uTidalStretch * stretchGrad;

                // Poisson transverse contraction (volume-conserving lateral pinch)
                vec3 tidalTrans = transverse * uTidalSqueeze;

                // Relativistic frame-dragging swirl displacement around singularity
                vec3 swirlAxis = vec3(0.0, 1.0, 0.0);
                vec3 swirlTan = cross(localPullDir, swirlAxis);
                float swirlAmount = sin(uTime * 4.0 + length(position) * 0.8) * 0.35 * uSpaghettifyStrength;

                // Gravitational curved-orbit bend (pulling trailing edges into curved trajectory)
                vec3 warped = localPullDir * tidalLong + tidalTrans + swirlTan * swirlAmount;

                // Smooth blend between undeformed and spaghettified geometry
                transformed = mix(transformed, warped, uSpaghettifyStrength);
              }
              `
            );

            // 3. Inject Uniforms and Synchrotron Redshift in Fragment Shader
            shader.fragmentShader = `
              uniform float uHorizonRedshift;
              uniform float uSpaghettifyStrength;
              ${shader.fragmentShader}
            `;

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `
              #include <dithering_fragment>

              if (uSpaghettifyStrength > 0.01) {
                // Synchrotron relativistic emission: cyan -> violet -> fiery crimson -> Hawking white
                vec3 blueshiftGlow = vec3(0.0, 0.95, 1.0);
                vec3 redshiftGlow = vec3(1.0, 0.18, 0.05);
                vec3 hawkingWhite = vec3(1.0, 0.98, 0.95);

                vec3 energyEmission = mix(blueshiftGlow, redshiftGlow, uHorizonRedshift);
                if (uHorizonRedshift > 0.8) {
                  energyEmission = mix(energyEmission, hawkingWhite, (uHorizonRedshift - 0.8) * 5.0);
                }

                // Additive emissive fringe along spaghettified edges
                gl_FragColor.rgb += energyEmission * (uSpaghettifyStrength * 0.55 + uHorizonRedshift * 0.65);
              }
              `
            );
          };
          m.needsUpdate = true;
        });
      }
    });
  }

  /**
   * Main per-frame update loop.
   */
  public update(
    dt: number,
    aiPositions: { id: string; name: string; position: THREE.Vector3; isDestroyed: boolean }[]
  ): RivalSpaghettificationTelemetry {
    if (!this.isSubmode10) {
      return {
        activeSpaghettifyingCount: 0,
        mostEndangeredRivalName: null,
        highestTidalStrain: 0,
        nearestRivalHorizonDist: 9999,
        recentCasualties: [],
      };
    }

    const t = this.elapsed;
    let activeCount = 0;
    let highestStrain = 0;
    let mostEndangeredName: string | null = null;
    let minHorizonDist = 9999;

    // Environmental severity factor based on the 93 stages (escalating from 0 to 1)
    const stageSeverityFactor = Math.min(1.0, this.currentStageIndex / 93.0);

    for (const info of aiPositions) {
      let state = this.rivals.get(info.id);
      if (!state) {
        // AI ship not yet registered
        continue;
      }

      const shipPos = info.position;
      const distToCenter = shipPos.distanceTo(this.blackHoleCenter);
      const distToHorizon = Math.max(0, distToCenter - this.eventHorizonRadius);
      state.distanceToSingularity = distToCenter;

      if (distToHorizon < minHorizonDist) {
        minHorizonDist = distToHorizon;
      }

      // Proximity & tidal calculation:
      // Capture threshold: 1400 units from center, with extreme tidal zone below 700 units
      const captureThreshold = 1400 + stageSeverityFactor * 400;
      const isDangerous = distToCenter < captureThreshold;

      let tidalStrain = 0;
      if (isDangerous) {
        const proximityRatio = 1.0 - Math.min(1.0, distToHorizon / 1200);
        tidalStrain = Math.pow(proximityRatio, 1.8) * (0.4 + stageSeverityFactor * 0.6);
      }

      state.tidalStrain = tidalStrain;
      if (tidalStrain > highestStrain) {
        highestStrain = tidalStrain;
        mostEndangeredName = info.name;
      }

      // Update uniforms
      state.customUniforms.uTime.value = t;
      state.customUniforms.uBlackHoleCenter.value.copy(this.blackHoleCenter);

      // Determine Spaghettification Infall Progression
      if (distToHorizon < 220 || info.isDestroyed || (stageSeverityFactor > 0.65 && tidalStrain > 0.85)) {
        // Critical capture sequence!
        state.isCaughtInHorizon = true;
        state.infallTimer += dt;
        activeCount++;

        const timer = state.infallTimer;
        let stretch = 1.0;
        let squeeze = 1.0;
        let strength = 0.0;
        let redshift = 0.0;

        if (timer < 1.5) {
          // Stage 1: Gravitational capture & tidal elongation
          state.infallStage = 'CAPTURED';
          strength = Math.min(1.0, timer / 1.5);
          stretch = 1.0 + timer * 1.8;
          squeeze = 1.0 / Math.sqrt(stretch);
          redshift = timer * 0.25;
        } else if (timer < 3.2) {
          // Stage 2: Structural yield & luminous striation
          state.infallStage = 'ELONGATING';
          strength = 1.0;
          const progress = (timer - 1.5) / 1.7;
          stretch = 3.7 + progress * 4.5;
          squeeze = Math.max(0.18, 1.0 / Math.sqrt(stretch));
          redshift = 0.38 + progress * 0.42;

          // Pull ship position directly into the black hole spiral
          const pullDir = this.blackHoleCenter.clone().sub(shipPos).normalize();
          state.group.position.addScaledVector(pullDir, dt * 160.0);
        } else if (timer < 5.0) {
          // Stage 3: Filamentation into spiral plasma ribbons
          state.infallStage = 'FILAMENT_SPIRAL';
          strength = 1.0;
          const progress = (timer - 3.2) / 1.8;
          stretch = 8.2 + progress * 7.0;
          squeeze = Math.max(0.08, 0.18 - progress * 0.1);
          redshift = 0.8 + progress * 0.2;

          // Inward accelerated spiral
          const pullDir = this.blackHoleCenter.clone().sub(shipPos).normalize();
          state.group.position.addScaledVector(pullDir, dt * 320.0);
          state.group.rotation.y += dt * 8.0;

          // Update luminous spaghettified ribbon
          this.updateRibbon(state, shipPos, progress);
        } else {
          // Stage 4: Crossing Schwarzschild event horizon
          state.infallStage = 'CONSUMED';
          state.group.visible = false;
          if (state.ribbonMesh) state.ribbonMesh.visible = false;

          if (!this.casualties.includes(info.name)) {
            this.casualties.push(info.name);
            sound.playExplosion();
          }
        }

        // Apply GPU uniforms
        state.customUniforms.uSpaghettifyStrength.value = strength;
        state.customUniforms.uTidalStretch.value = stretch;
        state.customUniforms.uTidalSqueeze.value = squeeze;
        state.customUniforms.uHorizonRedshift.value = redshift;

        // Hierarchical group scale deformation for physical presence
        state.group.scale.set(
          state.initialScale.x * squeeze,
          state.initialScale.y * squeeze,
          state.initialScale.z * stretch
        );
      } else if (tidalStrain > 0.05) {
        // Mild to moderate tidal deformation on active racing rivals
        state.infallTimer = 0;
        state.infallStage = 'ORBITAL';
        activeCount++;

        const stretch = 1.0 + tidalStrain * 2.2;
        const squeeze = 1.0 / Math.sqrt(stretch);
        const redshift = Math.min(1.0, tidalStrain * 0.85);

        state.customUniforms.uSpaghettifyStrength.value = tidalStrain;
        state.customUniforms.uTidalStretch.value = stretch;
        state.customUniforms.uTidalSqueeze.value = squeeze;
        state.customUniforms.uHorizonRedshift.value = redshift;

        // Modulate group scale
        state.group.scale.set(
          state.initialScale.x * squeeze,
          state.initialScale.y * squeeze,
          state.initialScale.z * stretch
        );

        if (state.ribbonMesh) {
          state.ribbonMesh.visible = false;
        }
      } else {
        // Normal state outside danger zone
        state.infallTimer = 0;
        state.infallStage = 'ORBITAL';
        state.customUniforms.uSpaghettifyStrength.value = 0.0;
        state.customUniforms.uTidalStretch.value = 1.0;
        state.customUniforms.uTidalSqueeze.value = 1.0;
        state.customUniforms.uHorizonRedshift.value = 0.0;
        state.group.scale.copy(state.initialScale);

        if (state.ribbonMesh) {
          state.ribbonMesh.visible = false;
        }
      }
    }

    return {
      activeSpaghettifyingCount: activeCount,
      mostEndangeredRivalName: mostEndangeredName,
      highestTidalStrain: Math.round(highestStrain * 100) / 100,
      nearestRivalHorizonDist: Math.round(minHorizonDist),
      recentCasualties: [...this.casualties],
    };
  }

  /**
   * Generates a dynamic 3-layer curving spaghettified plasma ribbon connecting the ship to the singularity.
   */
  private updateRibbon(
    state: SpaghettifiedRivalState,
    shipPos: THREE.Vector3,
    progress: number
  ): void {
    if (!state.ribbonMesh || !state.ribbonPositions || !state.ribbonGeometry) return;

    state.ribbonMesh.visible = true;
    const mat = state.ribbonMesh.material as THREE.LineBasicMaterial;
    mat.opacity = Math.min(1.0, (1.0 - progress * 0.6) * 0.95);

    // Color gradient based on redshift
    mat.color.setHSL(0.55 - progress * 0.55, 1.0, 0.6); // Cyan -> Yellow -> Deep Red

    const count = state.ribbonPositions.length / 3;
    const start = shipPos;
    const end = this.blackHoleCenter;

    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      // Logarithmic spiral geodesic towards horizon
      const angle = u * Math.PI * 3.5 + this.elapsed * 4.0;
      const radius = (1.0 - u) * (180 + progress * 100) + 20;

      const x = THREE.MathUtils.lerp(start.x, end.x, u) + Math.cos(angle) * radius;
      const y = THREE.MathUtils.lerp(start.y, end.y, u) + Math.sin(angle) * (radius * 0.4);
      const z = THREE.MathUtils.lerp(start.z, end.z, u);

      state.ribbonPositions[i * 3] = x;
      state.ribbonPositions[i * 3 + 1] = y;
      state.ribbonPositions[i * 3 + 2] = z;
    }

    state.ribbonGeometry.attributes.position.needsUpdate = true;
  }

  public reset(): void {
    this.rivals.forEach((r) => {
      r.group.scale.copy(r.initialScale);
      r.group.visible = true;
      r.customUniforms.uSpaghettifyStrength.value = 0.0;
      r.customUniforms.uTidalStretch.value = 1.0;
      r.customUniforms.uTidalSqueeze.value = 1.0;
      r.customUniforms.uHorizonRedshift.value = 0.0;
      if (r.ribbonMesh) {
        r.ribbonMesh.visible = false;
      }
    });
    this.casualties = [];
  }

  public dispose(): void {
    this.reset();
    if (this.ribbonsGroup.parent) {
      this.ribbonsGroup.parent.remove(this.ribbonsGroup);
    }
  }
}
