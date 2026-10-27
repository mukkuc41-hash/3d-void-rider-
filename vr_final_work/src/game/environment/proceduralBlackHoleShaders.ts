import * as THREE from 'three';

/**
 * Procedural Black Hole Shader Quality Tier
 */
export type BlackHoleShaderQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

/**
 * Event Horizon Instability State
 */
export type EventHorizonState = 'NORMAL' | 'ACTIVE' | 'UNSTABLE' | 'CRITICAL' | 'COLLAPSING';

/**
 * Centralized Uniform Interface for all Black Hole Shaders
 */
export interface CentralizedBlackHoleUniforms {
  [key: string]: THREE.IUniform<any>;
  uTime: { value: number };
  uBlackHolePosition: { value: THREE.Vector3 };
  uBlackHoleRadius: { value: number };
  uGravityStrength: { value: number };
  uLensingStrength: { value: number };
  uAccretionSpeed: { value: number };
  uAccretionIntensity: { value: number };
  uPlasmaIntensity: { value: number };
  uTidalStrength: { value: number };
  uSpaghettification: { value: number };
  uEventProgress: { value: number };
  uCollapseProgress: { value: number };
  uDetonationProgress: { value: number };
  uCameraDistance: { value: number };
  uQualityLevel: { value: number }; // 0: LOW, 1: MEDIUM, 2: HIGH, 3: ULTRA
  uHorizonState: { value: number }; // 0: NORMAL, 1: ACTIVE, 2: UNSTABLE, 3: CRITICAL, 4: COLLAPSING
}

/**
 * Common GLSL Fast Noise & Math functions
 */
const GLSL_COMMON_NOISE = /* glsl */ `
  // Fast 2D pseudo-hash
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Fast 2D Value Noise
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // 3-Octave Fractional Brownian Motion (Lightweight & high-speed)
  float fbm3(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  // 4-Octave Fractional Brownian Motion (Desktop Quality)
  float fbm4(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.04;
      a *= 0.5;
    }
    return v;
  }
`;

/**
 * Creates the Centralized Uniforms object shared across all procedural shaders
 */
export function createCentralizedBlackHoleUniforms(
  initialPosition = new THREE.Vector3(0, 180, -3500),
  radius = 310
): CentralizedBlackHoleUniforms {
  return {
    uTime: { value: 0.0 },
    uBlackHolePosition: { value: initialPosition.clone() },
    uBlackHoleRadius: { value: radius },
    uGravityStrength: { value: 0.05 },
    uLensingStrength: { value: 0.1 },
    uAccretionSpeed: { value: 1.0 },
    uAccretionIntensity: { value: 1.0 },
    uPlasmaIntensity: { value: 0.0 },
    uTidalStrength: { value: 0.0 },
    uSpaghettification: { value: 0.0 },
    uEventProgress: { value: 0.0 },
    uCollapseProgress: { value: 0.0 },
    uDetonationProgress: { value: 0.0 },
    uCameraDistance: { value: 3500.0 },
    uQualityLevel: { value: 2 }, // HIGH default
    uHorizonState: { value: 0 },
  };
}

/**
 * LAYER 1: DARK SINGULARITY SHADER
 * Center absorbs light (pitch black), edge has subtle gravitational Fresnel falloff.
 * Guaranteed never to glow at center or bleed background objects.
 */
export function createDarkSingularityMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uGravityStrength;
      uniform float uCollapseProgress;
      uniform int uHorizonState;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      ${GLSL_COMMON_NOISE}

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Core absorption: View-aligned center is virtually 0.0
        float NdotV = max(0.0, dot(normal, viewDir));
        float fresnel = pow(1.0 - NdotV, 3.8);

        // Subtle edge-only vacuum boundary shimmer
        float angle = atan(normal.y, normal.x);
        float noiseEdge = vnoise(vec2(angle * 4.0 - uTime * 2.0, fresnel * 6.0));
        float edgeGlow = smoothstep(0.72, 0.99, fresnel) * (0.15 + 0.25 * float(uHorizonState) / 4.0);

        // Singularity core remains pitch-black even in critical state
        vec3 edgeCol = mix(vec3(0.05, 0.01, 0.0), vec3(0.35, 0.08, 0.01), noiseEdge);
        vec3 col = edgeCol * edgeGlow * (1.0 - smoothstep(0.0, 0.8, uCollapseProgress));

        // Center must completely absorb light and occlude background
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
  });
}

/**
 * LAYER 2: EVENT HORIZON SHADER
 * Dynamic boundary with pulse, procedural distortion, radial gradient, animated noise,
 * and gravitational ripple. Driven by existing Final Collapse state.
 */
export function createEventHorizonMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uGravityStrength;
      uniform float uCollapseProgress;
      uniform int uHorizonState;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      ${GLSL_COMMON_NOISE}

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float angle = atan(p.y, p.x);

        // Dynamic frequency & ripple based on horizon state (0: NORMAL to 4: COLLAPSING)
        float speed = 1.8 + float(uHorizonState) * 1.5;
        float rippleFreq = 6.0 + float(uHorizonState) * 4.0;
        float ripple = sin(angle * rippleFreq - uTime * speed + r * 14.0) * 0.5 + 0.5;

        // Animated noise boundary
        float noiseVal = vnoise(vec2(angle * 5.0 + uTime, r * 10.0 - uTime * 2.0));

        // Thin sharp boundary ring profile
        float ring = smoothstep(0.08, 0.55, r) * smoothstep(1.0, 0.65, r);
        ring = pow(ring, 1.4);

        // State-driven color gradient
        vec3 colCinnabar = vec3(0.85, 0.08, 0.01);
        vec3 colGold = vec3(1.0, 0.85, 0.22);
        vec3 colHotWhite = vec3(1.0, 0.98, 0.92);

        float stateFactor = clamp(float(uHorizonState) / 4.0, 0.0, 1.0);
        vec3 col = mix(colCinnabar, colGold, ripple * 0.7 + noiseVal * 0.3);
        col = mix(col, colHotWhite, pow(ripple, 4.0) * stateFactor * 0.8);

        float alpha = ring * (0.65 + 0.35 * ripple) * (0.75 + stateFactor * 0.45);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 3: GRAVITATIONAL LENSING SHADER
 * Screen/world-space radial distortion + chromatic aberration + radial falloff.
 * Increases with gravitational intensity (subtle early, extreme during Events 35-40).
 */
export function createGravitationalLensingMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uLensingStrength;
      uniform float uGravityStrength;
      uniform int uQualityLevel;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      ${GLSL_COMMON_NOISE}

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        float NdotV = abs(dot(normal, viewDir));
        float fresnel = 1.0 - NdotV;
        fresnel = pow(fresnel, 2.6);

        // Angular shear
        float angle = atan(normal.y, normal.x);
        float warp = sin(angle * 8.0 - uTime * 2.0) * 0.15;

        // Chromatic aberration split (Red/Yellow/Amber)
        float rOffset = fresnel * (1.0 + warp * 0.2);
        float gOffset = fresnel * (1.0 + warp * 0.1);
        float bOffset = fresnel * (1.0 - warp * 0.1);

        vec3 lensColor;
        lensColor.r = mix(0.95, 1.0, rOffset);
        lensColor.g = mix(0.25, 0.88, gOffset);
        lensColor.b = mix(0.02, 0.24, bOffset);

        // Controlled radial falloff
        float intensity = uLensingStrength * (0.8 + uGravityStrength * 0.8);
        float alpha = fresnel * clamp(intensity, 0.0, 0.85);

        gl_FragColor = vec4(lensColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 4: PROCEDURAL ACCRETION DISK SHADER
 * Procedural accretion disk using UV rotation, procedural noise, FBM/turbulence,
 * radial falloff, angular distortion, emission, non-uniform flow bands, and Sagittarius A* red/yellow palette.
 */
export function createProceduralAccretionDiskMaterial(
  uniforms: CentralizedBlackHoleUniforms,
  isLensedArc = false
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      uIsLensed: { value: isLensedArc ? 1.0 : 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uAccretionSpeed;
      uniform float uAccretionIntensity;
      uniform float uTidalStrength;
      uniform float uCollapseProgress;
      uniform float uIsLensed;
      uniform int uQualityLevel;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      ${GLSL_COMMON_NOISE}

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float theta = atan(p.y, p.x);

        // 1. Keplerian differential rotation: v(r) ~ r^(-1.35)
        float kepler = pow(clamp(r, 0.14, 1.0), -1.35);
        float speed = uAccretionSpeed * (1.0 + uTidalStrength * 2.0);
        float theta_rot = theta - uTime * 0.85 * speed * kepler;

        // 2. Procedural flow bands with variable speeds and turbulence
        float logR = log(r * 5.0 + 1.0);
        float band1 = sin(theta_rot * 12.0 - logR * 16.0 + vnoise(vec2(logR * 6.0, theta_rot * 2.5)) * 4.0);
        float band2 = sin(theta_rot * 26.0 + logR * 12.0 + vnoise(vec2(logR * 12.0, theta_rot * 5.0)) * 3.0);
        float band3 = sin(theta_rot * 52.0 - logR * 28.0);

        float striations = 0.0;
        if (uQualityLevel >= 2) {
          striations = band1 * 0.5 + band2 * 0.35 + band3 * 0.15;
          // Additional FBM turbulence for High/Ultra tiers
          float turb = fbm3(vec2(logR * 4.0, theta_rot * 3.0));
          striations = mix(striations, turb, 0.35);
        } else if (uQualityLevel == 1) {
          striations = band1 * 0.65 + band2 * 0.35;
        } else {
          // LOW mobile tier: single smooth harmonic
          striations = band1 * 0.85 + 0.15;
        }
        striations = striations * 0.5 + 0.5;

        // 3. Relativistic Doppler Beaming (approaching side amplified, receding redder)
        float doppler = 1.0 + 1.15 * (-sin(theta_rot));
        doppler = clamp(doppler, 0.35, 2.5);

        // 4. Multi-Layer Color Progression (Outer Dark Red -> Red -> Orange -> Yellow -> White-Hot)
        vec3 colDust = vec3(0.12, 0.015, 0.0);       // Outer smoky boundary
        vec3 colRed = vec3(0.75, 0.06, 0.0);        // Crimson accretion
        vec3 colOrange = vec3(1.0, 0.30, 0.01);     // Incandescent orange
        vec3 colYellow = vec3(1.0, 0.84, 0.15);     // Radiant golden-yellow
        vec3 colWhite = vec3(1.0, 0.98, 0.92);      // White-hot inner rim

        vec3 col;
        if (r < 0.20) {
          col = mix(colYellow, colWhite, smoothstep(0.08, 0.20, r));
        } else if (r < 0.38) {
          col = mix(colWhite, colYellow, smoothstep(0.20, 0.38, r));
        } else if (r < 0.62) {
          col = mix(colYellow, colOrange, smoothstep(0.38, 0.62, r));
        } else if (r < 0.84) {
          col = mix(colOrange, colRed, smoothstep(0.62, 0.84, r));
        } else {
          col = mix(colRed, colDust, smoothstep(0.84, 1.0, r));
        }

        // 5. Sagittarius A* 3 relativistic emission knots (EHT observed Doppler clumps)
        float sgrAKnots = pow(0.5 + 0.5 * cos(3.0 * theta_rot + 0.85), 2.8);
        float ringBand = smoothstep(0.10, 0.24, r) * smoothstep(0.60, 0.28, r);
        col += mix(colOrange, colYellow, 0.85) * sgrAKnots * ringBand * (1.6 + uTidalStrength * 0.8);

        // Apply striations & Doppler luminescence
        col += mix(colOrange, colYellow, 0.65) * pow(striations, 2.4) * (0.95 + uTidalStrength * 1.2);
        col *= doppler * uAccretionIntensity;

        // 6. Radial Alpha Falloff (sharp inner shadow, soft outer dissipation)
        float alphaInner = smoothstep(0.08, 0.18, r);
        float alphaOuter = smoothstep(1.0, 0.72, r);
        float alpha = alphaInner * alphaOuter;
        alpha *= (0.7 + 0.3 * striations);
        alpha = clamp(alpha * doppler * (0.92 + uTidalStrength * 0.08), 0.0, 1.0);

        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 5: INNER HOT RING / PHOTON SPHERE SHADER
 * Razor-sharp photon sphere ring with Doppler beaming, 3 Sgr A* emission knots, and high luminosity.
 */
export function createInnerHotRingMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uTidalStrength;
      varying vec2 vUv;

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float ring = smoothstep(0.1, 0.55, r) * smoothstep(1.0, 0.65, r);
        float angle = atan(p.y, p.x);
        float shimmer = 0.8 + 0.2 * sin(angle * 8.0 - uTime * 4.0);

        // 3-knot Doppler signature
        float sgrAKnots = pow(0.5 + 0.5 * sin(angle * 3.0 - uTime * 3.2), 3.0);

        vec3 colCore = vec3(1.0, 0.98, 0.92);
        vec3 colGold = vec3(1.0, 0.82, 0.18);

        vec3 col = mix(colCore, colGold, r);
        col += vec3(1.0, 0.88, 0.22) * sgrAKnots * 1.6;
        col += vec3(1.0) * pow(shimmer, 3.0) * (0.5 + uTidalStrength);

        gl_FragColor = vec4(col, ring * shimmer * 0.98);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 6: PROCEDURAL PLASMA STREAMS SHADER
 * Thin streams of plasma feeding the black hole: procedural curves + animated noise + additive material.
 * Spirals inward, fragments near horizon, colors dark red -> red -> orange -> yellow -> white.
 */
export function createPlasmaStreamsMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aStreamOffset;
      attribute float aStreamSpeed;
      varying vec2 vUv;
      varying float vOffset;
      varying float vSpeed;

      void main() {
        vUv = uv;
        vOffset = aStreamOffset;
        vSpeed = aStreamSpeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPlasmaIntensity;
      uniform float uTidalStrength;
      uniform int uQualityLevel;
      varying vec2 vUv;
      varying float vOffset;
      varying float vSpeed;

      ${GLSL_COMMON_NOISE}

      void main() {
        // vUv.x represents inward distance along stream (0: outer, 1: inner horizon)
        // vUv.y represents lateral stream width
        float inward = vUv.x;
        float lateral = abs(vUv.y - 0.5) * 2.0;

        // Inward flow animation
        float flow = inward * 16.0 - uTime * (3.5 + vSpeed * 2.5);
        float noiseStream = vnoise(vec2(flow, vOffset * 10.0));

        // Stream width profile with thinning as matter accelerates
        float width = smoothstep(1.0, 0.1, lateral);

        // Fragmentation near the horizon (high shear tearing)
        float tearFactor = smoothstep(0.65, 0.95, inward) * (0.3 + uTidalStrength * 0.7);
        float breakUp = vnoise(vec2(inward * 32.0, uTime * 4.0));
        if (breakUp < tearFactor * 0.6) {
          discard;
        }

        // Color progression: Dark Red -> Red -> Orange -> Yellow -> White-Hot
        vec3 colDarkRed = vec3(0.45, 0.03, 0.0);
        vec3 colRed = vec3(0.85, 0.08, 0.0);
        vec3 colOrange = vec3(1.0, 0.45, 0.02);
        vec3 colYellow = vec3(1.0, 0.88, 0.18);
        vec3 colWhite = vec3(1.0, 0.98, 0.94);

        vec3 col;
        if (inward < 0.25) {
          col = mix(colDarkRed, colRed, inward * 4.0);
        } else if (inward < 0.55) {
          col = mix(colRed, colOrange, (inward - 0.25) * 3.33);
        } else if (inward < 0.82) {
          col = mix(colOrange, colYellow, (inward - 0.55) * 3.7);
        } else {
          col = mix(colYellow, colWhite, (inward - 0.82) * 5.5);
        }

        col += vec3(0.8, 0.7, 0.3) * noiseStream * 0.4;
        float alpha = width * (0.7 + 0.3 * noiseStream) * uPlasmaIntensity;

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 7: PROCEDURAL GRAVITATIONAL RINGS SHADER
 * Controlled gravitational rings with different radius, opacity, distortion, rotation, and pulse animation.
 */
export function createGravitationalRingsMaterial(
  uniforms: CentralizedBlackHoleUniforms,
  ringIndex = 0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      uRingIndex: { value: ringIndex },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uGravityStrength;
      uniform int uRingIndex;
      varying vec2 vUv;

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float angle = atan(p.y, p.x);

        // Subtle rotational pulsation
        float phase = float(uRingIndex) * 1.57;
        float pulse = 0.5 + 0.5 * sin(angle * (4.0 + float(uRingIndex)) - uTime * (1.5 + float(uRingIndex) * 0.5) + phase);

        float ring = smoothstep(0.12, 0.45, r) * smoothstep(1.0, 0.55, r);

        // Ring color assignment based on ring index
        vec3 colGold = vec3(1.0, 0.82, 0.20);
        vec3 colAmber = vec3(1.0, 0.55, 0.05);
        vec3 colCrimson = vec3(0.92, 0.15, 0.02);
        vec3 colViolet = vec3(0.68, 0.25, 0.95);

        vec3 col = colGold;
        if (uRingIndex == 1) col = colAmber;
        else if (uRingIndex == 2) col = colCrimson;
        else if (uRingIndex == 3) col = colViolet;

        col += vec3(1.0, 0.9, 0.5) * pow(pulse, 3.0) * 0.7;
        float alpha = ring * (0.2 + 0.35 * pulse) * (0.6 + uGravityStrength * 0.5);

        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * LAYER 8: REUSABLE PROCEDURAL SPAGHETTIFICATION FILAMENTS SHADER
 * Signature shader for Final Collapse.
 * Vertex displacement stretches geometry toward uBlackHolePosition.
 * Fragment shader paints layered energy (outer blue/purple -> middle cyan/blue-white -> inner orange/red -> core white-hot).
 */
export function createSpaghettificationFilamentMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform vec3 uBlackHolePosition;
      uniform float uSpaghettification;
      uniform float uTidalStrength;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying float vTidalDist;

      ${GLSL_COMMON_NOISE}

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vec3 toSingularity = uBlackHolePosition - worldPos.xyz;
        float dist = length(toSingularity);
        vec3 dir = normalize(toSingularity);

        // Longitudinal tidal elongation pointing directly toward the singularity center
        float tidalForce = uSpaghettification * (1.0 + uTidalStrength * 2.0);
        // Inverse square tidal gradient
        float stretchFactor = tidalForce * clamp(800.0 / max(dist, 100.0), 0.0, 15.0);

        // Progressive longitudinal displacement
        vec3 displacedPos = position + dir * (uv.y * stretchFactor * 40.0);

        // Micro-filament turbulence
        float wave = sin(uv.y * 32.0 - uTime * 8.0) * (2.0 * uSpaghettification);
        displacedPos += cross(dir, vec3(0.0, 1.0, 0.0)) * wave;

        vWorldPosition = (modelMatrix * vec4(displacedPos, 1.0)).xyz;
        vTidalDist = dist;

        gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSpaghettification;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying float vTidalDist;

      ${GLSL_COMMON_NOISE}

      void main() {
        float along = vUv.y;
        float lateral = abs(vUv.x - 0.5) * 2.0;

        // Striated luminous filament ribbons
        float ribbon = vnoise(vec2(along * 24.0 - uTime * 6.0, lateral * 8.0));
        float coreProfile = smoothstep(1.0, 0.15, lateral);

        // 4-Layer Energy Hierarchy:
        // Outer: Dark Blue / Purple
        // Middle: Cyan / Blue-White
        // Inner: Fiery Orange / Red
        // Tidal Core: Blinding White-Hot
        vec3 colOuter = vec3(0.20, 0.05, 0.65);     // Dark blue/purple
        vec3 colMiddle = vec3(0.35, 0.85, 1.0);     // Cyan/blue-white
        vec3 colInner = vec3(1.0, 0.35, 0.02);      // Orange/red
        vec3 colCore = vec3(1.0, 0.98, 0.95);       // White-hot

        vec3 col;
        if (lateral > 0.65) {
          col = mix(colOuter, colMiddle, (1.0 - lateral) / 0.35);
        } else if (lateral > 0.25) {
          col = mix(colMiddle, colInner, (0.65 - lateral) / 0.4);
        } else {
          col = mix(colInner, colCore, (0.25 - lateral) / 0.25);
        }

        col += vec3(0.8, 0.9, 1.0) * pow(ribbon, 2.5) * 0.7;
        float alpha = coreProfile * (0.7 + 0.3 * ribbon) * uSpaghettification;

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * COSMIC DETONATION SHADER (EVENT 40)
 * Final shockwave expansion shader: radial expansion + procedural distortion + emission.
 * Colors: White Center -> Yellow -> Orange -> Red -> Transparent outer wave.
 */
export function createCosmicDetonationMaterial(
  uniforms: CentralizedBlackHoleUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uDetonationProgress;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      ${GLSL_COMMON_NOISE}

      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;

        // Shockwave expansion ring profile
        float blast = clamp(uDetonationProgress, 0.0, 1.0);
        float ringRadius = blast;
        float ringWidth = 0.28 * (1.0 - blast * 0.5);

        float distFromWave = abs(r - ringRadius);
        float wave = smoothstep(ringWidth, 0.0, distFromWave);

        // Procedural detonation turbulent fissures
        float angle = atan(p.y, p.x);
        float shockTurb = vnoise(vec2(angle * 12.0 + uTime * 4.0, r * 16.0 - blast * 8.0));

        // Color ramp: White Center -> Yellow -> Orange -> Red -> Transparent outer wave
        vec3 colWhite = vec3(1.0, 1.0, 1.0);
        vec3 colYellow = vec3(1.0, 0.88, 0.22);
        vec3 colOrange = vec3(1.0, 0.42, 0.02);
        vec3 colRed = vec3(0.92, 0.08, 0.01);

        vec3 col;
        if (r < ringRadius * 0.3) {
          col = mix(colWhite, colYellow, r / (ringRadius * 0.3));
        } else if (r < ringRadius * 0.65) {
          col = mix(colYellow, colOrange, (r - ringRadius * 0.3) / (ringRadius * 0.35));
        } else {
          col = mix(colOrange, colRed, (r - ringRadius * 0.65) / (ringRadius * 0.35));
        }

        col += colWhite * pow(shockTurb, 3.0) * 0.8;
        float alpha = wave * (0.85 + 0.15 * shockTurb) * (1.0 - blast * blast);

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
