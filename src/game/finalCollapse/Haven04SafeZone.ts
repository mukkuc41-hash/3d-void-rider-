import * as THREE from 'three';
import { sound } from '../audio';

export type ChamberDoorState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';

export interface Haven04Telemetry {
  isUnlocked: boolean;
  doorState: ChamberDoorState;
  doorOpenAmount: number;
  isInsideShield: boolean;
  isInsideBay: boolean;
  settleProgress: number;
  isParkingValidated: boolean;
  objectiveText: string;
}

/**
 * ESCAPE ROUTE 04: HAVEN-04
 * Shielded Safe-Zone Parking Platform with Automatic Free-Passage Chamber Doors.
 *
 * Physical architecture:
 * 1. Spacious high-tech orbital parking platform with landing markings, runway deck & Bay 01.
 * 2. Large curved overhead energy shield dome covering the entire platform and all bays.
 * 3. Automatic sliding chamber blast doors at the platform entrance with multi-directional
 *    arrival/departure detection, safety reversal, and ZERO locking mechanism (player is always
 *    completely free to exit).
 * 4. Real physical parking validation: requires physically entering Bay 01, settling speed < 18m/s
 *    for 1.8s before the 00:00 deadline.
 * 5. Functional shield protection: blocks black hole hazards and damage exclusively within its volume.
 */
export class Haven04SafeZone {
  public rootGroup: THREE.Group = new THREE.Group();

  // Sub-groups
  public platformGroup: THREE.Group = new THREE.Group();
  public doorGroup: THREE.Group = new THREE.Group();
  public shieldGroup: THREE.Group = new THREE.Group();
  public bayMarkersGroup: THREE.Group = new THREE.Group();

  // Chamber Doors
  private leftDoorPanel!: THREE.Mesh;
  private rightDoorPanel!: THREE.Mesh;
  private doorStatusLightLeft!: THREE.Mesh;
  private doorStatusLightRight!: THREE.Mesh;
  private doorStatusLightMat!: THREE.MeshBasicMaterial;

  public doorState: ChamberDoorState = 'CLOSED';
  public doorOpenAmount: number = 0.0; // 0.0 = closed, 1.0 = fully open
  private readonly doorOpenSpeed: number = 1.0 / 1.1; // Opens in ~1.1 seconds
  private readonly doorCloseSpeed: number = 1.0 / 1.7; // Closes in ~1.7 seconds
  private doorCloseDelayTimer: number = 0.0; // Delay before closing after clearance
  private readonly doorClearanceWidth: number = 48.0; // 48m wide open portal

  // Shield Dome
  private shieldDomeMesh!: THREE.Mesh;
  private shieldDomeMat!: THREE.MeshStandardMaterial;
  private shieldEmitters: THREE.Mesh[] = [];
  private shieldDeflectPulse: number = 0.0;

  // Platform Dimensions & Bay Coordinates (Local Space)
  // Local +Z points back towards the incoming route; -Z points forward along the platform runway.
  public readonly platformWidth = 160;
  public readonly platformLength = 260;
  public readonly bay01LocalCenter = new THREE.Vector3(0, 1.2, -130);
  public readonly bay01Radius = 30.0;

  // Door Threshold (Local Space)
  public readonly doorwayLocalZ = 0.0;

  // State
  public isUnlocked: boolean = false;
  public isParkingValidated: boolean = false;
  public settleTimer: number = 0.0;
  public readonly requiredSettleDuration: number = 1.8;

  // Visual text & signs
  private canvasTextures: THREE.CanvasTexture[] = [];

  constructor() {
    this.rootGroup.name = 'Haven04_SafeZone_Complex';
    this.buildPlatform();
    this.buildChamberDoors();
    this.buildShieldDome();
    this.buildBayMarkings();

    this.rootGroup.add(this.platformGroup);
    this.rootGroup.add(this.doorGroup);
    this.rootGroup.add(this.shieldGroup);
    this.rootGroup.add(this.bayMarkersGroup);
  }

  /* =========================================================================
     1. SPACIOUS PARKING PLATFORM
     ========================================================================= */
  private buildPlatform(): void {
    this.platformGroup.name = 'Haven04_PlatformGroup';

    // Main structural deck (Titanium Alloy)
    const deckGeo = new THREE.BoxGeometry(this.platformWidth, 12, this.platformLength);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0a1122,
      metalness: 0.88,
      roughness: 0.28,
      emissive: 0x021631,
      emissiveIntensity: 0.5,
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, -6, -this.platformLength / 2);
    deckMesh.receiveShadow = true;
    this.platformGroup.add(deckMesh);

    // Runway surface plate (High-grip ceramic composite with glowing guide curbs)
    const surfaceGeo = new THREE.BoxGeometry(this.platformWidth - 10, 1.5, this.platformLength - 8);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.2,
      emissive: 0x032845,
      emissiveIntensity: 0.7,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.set(0, 0, -this.platformLength / 2);
    this.platformGroup.add(surfaceMesh);

    // Glowing Cyan Runway Curb Rails (Left & Right)
    const curbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const curbGeo = new THREE.BoxGeometry(3.5, 3.5, this.platformLength);

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-this.platformWidth / 2 + 3, 2, -this.platformLength / 2);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(this.platformWidth / 2 - 3, 2, -this.platformLength / 2);

    this.platformGroup.add(leftCurb, rightCurb);

    // Runway Approach Strobe Lights along deck centerline
    const strobeGeo = new THREE.BoxGeometry(2.4, 0.4, 8);
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let z = -20; z >= -this.platformLength + 20; z -= 30) {
      const strobe = new THREE.Mesh(strobeGeo, strobeMat);
      strobe.position.set(0, 1.0, z);
      this.platformGroup.add(strobe);
    }
  }

  /* =========================================================================
     2. AUTOMATIC CHAMBER DOORS (FREE PASSAGE — NO LOCKING MECHANISM)
     ========================================================================= */
  private buildChamberDoors(): void {
    this.doorGroup.name = 'Haven04_ChamberDoors';
    this.doorGroup.position.set(0, 0, this.doorwayLocalZ);

    // Massive Structural Archway Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      metalness: 0.95,
      roughness: 0.18,
      emissive: 0x0369a1,
      emissiveIntensity: 0.8,
    });

    // Left Column
    const leftCol = new THREE.Mesh(new THREE.BoxGeometry(14, 38, 16), frameMat);
    leftCol.position.set(-31, 19, 0);

    // Right Column
    const rightCol = new THREE.Mesh(new THREE.BoxGeometry(14, 38, 16), frameMat);
    rightCol.position.set(31, 19, 0);

    // Top Header Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(76, 12, 18), frameMat);
    lintel.position.set(0, 42, 0);

    this.doorGroup.add(leftCol, rightCol, lintel);

    // Illuminated Status Indicators (Green when open/opening, Amber when closing/closed)
    this.doorStatusLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const statusLightGeo = new THREE.BoxGeometry(2.5, 26, 2.5);

    this.doorStatusLightLeft = new THREE.Mesh(statusLightGeo, this.doorStatusLightMat);
    this.doorStatusLightLeft.position.set(-23, 19, 8.5);

    this.doorStatusLightRight = new THREE.Mesh(statusLightGeo, this.doorStatusLightMat);
    this.doorStatusLightRight.position.set(23, 19, 8.5);

    this.doorGroup.add(this.doorStatusLightLeft, this.doorStatusLightRight);

    // Door Header Holographic Sign
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#030816';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 68px Arial';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('HAVEN-04 // SHIELDED PARKING', 512, 85);
      ctx.font = '700 38px Arial';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('AUTOMATIC CHAMBER DOORS // FREE PASSAGE', 512, 165);
    }
    const canvasTexture = new THREE.CanvasTexture(canvas);
    this.canvasTextures.push(canvasTexture);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 13.5),
      new THREE.MeshBasicMaterial({ map: canvasTexture, side: THREE.DoubleSide, transparent: true })
    );
    sign.position.set(0, 39, 9.5);
    this.doorGroup.add(sign);

    // Mechanical Sliding Blast Door Panels (Left & Right)
    // Width 25m each, Height 30m, Thickness 4.5m
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x082f49,
      emissiveIntensity: 0.9,
    });
    const panelGeo = new THREE.BoxGeometry(25, 30, 4.5);

    this.leftDoorPanel = new THREE.Mesh(panelGeo, panelMat);
    this.leftDoorPanel.position.set(-12.5, 15, 0); // Closed position

    this.rightDoorPanel = new THREE.Mesh(panelGeo, panelMat);
    this.rightDoorPanel.position.set(12.5, 15, 0); // Closed position

    // Neon hazard stripes on door edge faces
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const edgeGeo = new THREE.BoxGeometry(1.2, 28, 4.8);
    const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
    leftEdge.position.set(12.5, 0, 0);
    this.leftDoorPanel.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, edgeMat);
    rightEdge.position.set(-12.5, 0, 0);
    this.rightDoorPanel.add(rightEdge);

    this.doorGroup.add(this.leftDoorPanel, this.rightDoorPanel);
  }

  /* =========================================================================
     3. OVERHEAD ENERGY SHIELD DOME & PERIMETER EMITTERS
     ========================================================================= */
  private buildShieldDome(): void {
    this.shieldGroup.name = 'Haven04_ShieldDomeGroup';
    // Center the dome at the midpoint of the parking platform
    const domeCenterZ = -this.platformLength / 2;
    this.shieldGroup.position.set(0, 0, domeCenterZ);

    // Large Transparent Energy Dome Geometry
    // Semi-ellipsoidal dome covering entire 160x260m platform
    const domeRadiusX = 145;
    const domeRadiusY = 82;
    const domeRadiusZ = 165;
    const domeGeo = new THREE.SphereGeometry(1, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    domeGeo.scale(domeRadiusX, domeRadiusY, domeRadiusZ);

    this.shieldDomeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.shieldDomeMesh = new THREE.Mesh(domeGeo, this.shieldDomeMat);
    this.shieldDomeMesh.position.set(0, 0, 0);
    this.shieldGroup.add(this.shieldDomeMesh);

    // 8 Perimeter Shield Emitter Pylons around the platform edge
    const emitterPylonGeo = new THREE.CylinderGeometry(2.5, 4.0, 24, 12);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.2,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
    });
    const emitterOrbGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const emitterOrbMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const pylonOffsets = [
      [-this.platformWidth / 2 + 4, 12, -this.platformLength / 2 + 10],
      [this.platformWidth / 2 - 4, 12, -this.platformLength / 2 + 10],
      [-this.platformWidth / 2 + 4, 12, 0],
      [this.platformWidth / 2 - 4, 12, 0],
      [-this.platformWidth / 2 + 4, 12, this.platformLength / 2 - 15],
      [this.platformWidth / 2 - 4, 12, this.platformLength / 2 - 15],
      [0, 12, -this.platformLength / 2 + 4],
      [0, 12, this.platformLength / 2 - 8],
    ];

    pylonOffsets.forEach(pos => {
      const pylon = new THREE.Mesh(emitterPylonGeo, pylonMat);
      pylon.position.set(pos[0], pos[1], pos[2]);

      const orb = new THREE.Mesh(emitterOrbGeo, emitterOrbMat);
      orb.position.set(0, 13, 0);
      pylon.add(orb);
      this.shieldEmitters.push(orb);

      this.shieldGroup.add(pylon);
    });
  }

  /* =========================================================================
     4. PARKING BAYS & LANDING MARKINGS (BAY 01 TARGET)
     ========================================================================= */
  private buildBayMarkings(): void {
    this.bayMarkersGroup.name = 'Haven04_BayMarkingsGroup';

    // Primary Bay 01 Landing Circle (Safe Zone Target Zone)
    const bayRingGeo = new THREE.RingGeometry(24, 27, 48);
    const bayRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const bayRing = new THREE.Mesh(bayRingGeo, bayRingMat);
    bayRing.rotation.x = -Math.PI / 2;
    bayRing.position.copy(this.bay01LocalCenter);
    bayRing.position.y = 1.1;
    this.bayMarkersGroup.add(bayRing);

    // Inner glowing crosshair
    const crossGeo = new THREE.BoxGeometry(38, 0.4, 2.5);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const cross1 = new THREE.Mesh(crossGeo, crossMat);
    cross1.position.copy(this.bay01LocalCenter);
    cross1.position.y = 1.15;
    const cross2 = cross1.clone();
    cross2.rotation.y = Math.PI / 2;
    this.bayMarkersGroup.add(cross1, cross2);

    // Bay 01 Holographic Pad Sign
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#040d21';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 504, 248);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 52px Arial';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('BAY 01 // HAVEN', 256, 80);
      ctx.font = '700 32px Arial';
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText('SAFE-ZONE PARKING', 256, 150);
      ctx.font = '700 24px Arial';
      ctx.fillStyle = '#22c55e';
      ctx.fillText('SPEED < 18 KM/H // SETTLE', 256, 205);
    }
    const canvasTexture = new THREE.CanvasTexture(canvas);
    this.canvasTextures.push(canvasTexture);

    const padSign = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 14),
      new THREE.MeshBasicMaterial({ map: canvasTexture, side: THREE.DoubleSide, transparent: true })
    );
    padSign.rotation.x = -Math.PI / 2;
    padSign.position.set(0, 1.2, this.bay01LocalCenter.z - 36);
    this.bayMarkersGroup.add(padSign);

    // Secondary Bays (Bay 02, Bay 03, Bay 04 for visual depth)
    const secOffsets = [
      new THREE.Vector3(-55, 1.1, -80),
      new THREE.Vector3(55, 1.1, -80),
      new THREE.Vector3(-55, 1.1, -180),
      new THREE.Vector3(55, 1.1, -180),
    ];
    secOffsets.forEach((pos, idx) => {
      const secRing = new THREE.Mesh(
        new THREE.RingGeometry(16, 18, 32),
        new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide })
      );
      secRing.rotation.x = -Math.PI / 2;
      secRing.position.copy(pos);
      this.bayMarkersGroup.add(secRing);
    });
  }

  /* =========================================================================
     5. FRAME-BY-FRAME SENSORS & AUTOMATIC DOOR MOTION
     ========================================================================= */
  public update(
    dt: number,
    shipWorldPos?: THREE.Vector3,
    shipSpeedMps: number = 0,
    countdownRemainingSeconds: number = 900,
    onParkingValidatedCallback?: () => void
  ): Haven04Telemetry {
    // A. Pulse overhead shield visual energy wave
    this.shieldDomeMat.emissiveIntensity =
      0.7 + Math.sin(Date.now() * 0.003) * 0.25 + this.shieldDeflectPulse;
    if (this.shieldDeflectPulse > 0) {
      this.shieldDeflectPulse = Math.max(0, this.shieldDeflectPulse - dt * 2.5);
    }

    // Emitter orb pulse
    const orbGlow = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
    this.shieldEmitters.forEach(orb => {
      (orb.material as THREE.MeshBasicMaterial).color.setRGB(0, orbGlow, 1);
    });

    if (!shipWorldPos) {
      return this.getTelemetry();
    }

    // Convert ship world position into Haven-04 local space
    const localPos = this.rootGroup.worldToLocal(shipWorldPos.clone());

    // B. Automatic Chamber Door Sensors (Multi-Directional Arrival & Departure)
    // 1. Outside Arrival Zone: Ship approaching from front corridor (Z between 0 and 115, |X| < 40)
    const isApproachingFromOutside =
      localPos.z >= 0 && localPos.z <= 115 && Math.abs(localPos.x) <= 38 && localPos.y >= -8 && localPos.y <= 38;

    // 2. Doorway Clearance Zone: Ship occupying threshold (-22 <= Z <= 22, |X| < 38)
    const isOccupyingClearanceZone =
      localPos.z >= -24 && localPos.z <= 24 && Math.abs(localPos.x) <= 38 && localPos.y >= -8 && localPos.y <= 38;

    // 3. Inside Departure Zone: Ship moving towards exit from inside platform (-95 <= Z <= 0, |X| < 40)
    const isApproachingFromInside =
      localPos.z >= -95 && localPos.z <= 0 && Math.abs(localPos.x) <= 38 && localPos.y >= -8 && localPos.y <= 38;

    const shipNeedsPassage =
      isApproachingFromOutside || isOccupyingClearanceZone || isApproachingFromInside;

    // Door State Machine Transitions
    switch (this.doorState) {
      case 'CLOSED':
        if (shipNeedsPassage) {
          this.doorState = 'OPENING';
          sound.playBlastDoorOpen();
        }
        break;

      case 'OPENING':
        this.doorOpenAmount = Math.min(1.0, this.doorOpenAmount + dt * this.doorOpenSpeed);
        if (this.doorOpenAmount >= 1.0) {
          this.doorState = 'OPEN';
          this.doorCloseDelayTimer = 2.5; // Reset safe clearance delay
        }
        break;

      case 'OPEN':
        if (shipNeedsPassage) {
          // Reset clearance delay as long as ship occupies clearance or approach zone
          this.doorCloseDelayTimer = 2.5;
        } else {
          // Count down clearance safe delay
          this.doorCloseDelayTimer -= dt;
          if (this.doorCloseDelayTimer <= 0) {
            this.doorState = 'CLOSING';
            sound.playBlastDoorClose();
          }
        }
        break;

      case 'CLOSING':
        // SAFETY REVERSAL GUARANTEE: If ship enters clearance zone or approaches, reverse instantly!
        if (shipNeedsPassage) {
          this.doorState = 'OPENING';
          sound.playBlastDoorOpen();
          break;
        }

        this.doorOpenAmount = Math.max(0.0, this.doorOpenAmount - dt * this.doorCloseSpeed);
        if (this.doorOpenAmount <= 0.0) {
          this.doorState = 'CLOSED';
        }
        break;
    }

    // Apply Physical Sliding Door Panel Positions
    // In closed state: Left is at -12.5, Right is at +12.5
    // In fully open state: Left slides to -37.5, Right slides to +37.5 (48m open clearance)
    const slideOffset = this.doorOpenAmount * 25.0;
    this.leftDoorPanel.position.x = -12.5 - slideOffset;
    this.rightDoorPanel.position.x = 12.5 + slideOffset;

    // Update status light color
    if (this.doorState === 'OPENING' || this.doorState === 'OPEN') {
      this.doorStatusLightMat.color.setHex(0x10b981); // Emerald Green
    } else {
      this.doorStatusLightMat.color.setHex(0xf59e0b); // Amber Warning
    }

    // C. Functional Shield Protection Check
    const insideShield = this.isInsideProtectionVolume(shipWorldPos);

    // D. Real Parking Validation in Bay 01
    const distToBay = Math.hypot(
      localPos.x - this.bay01LocalCenter.x,
      localPos.z - this.bay01LocalCenter.z
    );
    const isInsideBay =
      distToBay <= this.bay01Radius &&
      localPos.y >= -2.0 &&
      localPos.y <= 16.0;

    const isSpeedSettled = shipSpeedMps <= 18.0;

    if (isInsideBay && isSpeedSettled) {
      this.settleTimer += dt;
      if (this.settleTimer >= this.requiredSettleDuration && !this.isParkingValidated) {
        // Authoritative deadline check: must be BEFORE countdown expires!
        if (countdownRemainingSeconds > 0) {
          this.isParkingValidated = true;
          sound.playParkingConfirmed();
          sound.playStationSecureChime();
          onParkingValidatedCallback?.();
        }
      }
    } else {
      // Leaving the bay before validation finishes resets settling
      if (!this.isParkingValidated) {
        this.settleTimer = 0.0;
      }
    }

    return this.getTelemetry();
  }

  /* =========================================================================
     6. FUNCTIONAL HAZARD PROTECTION (ENERGY SHIELD)
     ========================================================================= */
  /**
   * Returns true ONLY when the given world position is physically inside Haven-04's
   * protected volume covered by the overhead energy dome.
   * Does NOT grant global invulnerability outside this dome.
   */
  public isInsideProtectionVolume(worldPos: THREE.Vector3): boolean {
    const localPos = this.rootGroup.worldToLocal(worldPos.clone());

    // 1. Check platform bounds
    const insidePlatformBounds =
      localPos.z >= -this.platformLength - 10 &&
      localPos.z <= 15 &&
      Math.abs(localPos.x) <= this.platformWidth / 2 + 5 &&
      localPos.y >= -10 &&
      localPos.y <= 88;

    if (!insidePlatformBounds) return false;

    // 2. Check distance to dome center
    const domeCenterZ = -this.platformLength / 2;
    const dx = localPos.x / 145;
    const dy = Math.max(0, localPos.y) / 82;
    const dz = (localPos.z - domeCenterZ) / 165;
    const ellipsoidDistSq = dx * dx + dy * dy + dz * dz;

    return ellipsoidDistSq <= 1.05;
  }

  /**
   * Triggers a localized shield deflection pulse when external black hole hazards hit the dome.
   */
  public triggerShieldDeflect(): void {
    this.shieldDeflectPulse = 0.9;
    sound.playShieldDeflect();
  }

  /* =========================================================================
     7. TELEMETRY & CLEANUP
     ========================================================================= */
  public getTelemetry(): Haven04Telemetry {
    let objectiveText = 'ROUTE 04 // HAVEN-04 LOCKED [COMPLETE 3 LAPS]';
    if (this.isUnlocked) {
      if (this.isParkingValidated) {
        objectiveText = 'HAVEN-04 // SHIELDED SAFE-ZONE SECURED [FREE PASSAGE ACTIVE]';
      } else if (this.settleTimer > 0) {
        const pct = Math.round((this.settleTimer / this.requiredSettleDuration) * 100);
        objectiveText = `BAY 01 // SECURING SHIP CLAMPS [${pct}%]`;
      } else if (this.doorState === 'OPENING' || this.doorState === 'OPEN') {
        objectiveText = 'CHAMBER DOORS OPEN // ENTER BAY 01 SAFE ZONE';
      } else {
        objectiveText = 'APPROACH HAVEN-04 // DOORS AUTOMATIC';
      }
    }

    return {
      isUnlocked: this.isUnlocked,
      doorState: this.doorState,
      doorOpenAmount: this.doorOpenAmount,
      isInsideShield: this.shieldDeflectPulse > 0.05,
      isInsideBay: this.settleTimer > 0,
      settleProgress: Math.min(1.0, this.settleTimer / this.requiredSettleDuration),
      isParkingValidated: this.isParkingValidated,
      objectiveText,
    };
  }

  public reset(): void {
    this.doorState = 'CLOSED';
    this.doorOpenAmount = 0.0;
    this.doorCloseDelayTimer = 0.0;
    this.isParkingValidated = false;
    this.settleTimer = 0.0;
    this.shieldDeflectPulse = 0.0;
    if (this.leftDoorPanel) this.leftDoorPanel.position.x = -12.5;
    if (this.rightDoorPanel) this.rightDoorPanel.position.x = 12.5;
  }

  public dispose(): void {
    this.reset();
    this.canvasTextures.forEach(t => t.dispose());
    this.canvasTextures = [];

    this.rootGroup.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach(m => m.dispose());
      else material?.dispose();
    });
  }
}
