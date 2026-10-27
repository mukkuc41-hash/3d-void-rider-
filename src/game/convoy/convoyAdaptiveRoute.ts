/**
 * VOID-RIDER 3D — CONVOY GUARDIAN ADAPTIVE ROUTE SYSTEM
 * 
 * 200,000 KM, 100-LOCATION SPACIOUS OPEN-WORLD EXPANSION
 * - Structure-Aware Adaptive Route Management across 100 locations
 * - Dual Physical Parking Domes:
 *   Location 001: Guardian Departure Dome (Origin, Z ~ 0)
 *   Location 100: Celestial Crown Parking Terminal (Destination Sanctuary, Z ~ -38,400)
 * - Continuous Bounded Flight Envelope & Inward Containment Pushback
 * - Forward (OUTBOUND) and Reverse (RETURN) Path Guidance
 * - Convoy-Aware Clearance & Staged Transit
 * - Dynamic Spline Recalculation without breaking physical distance anchors
 */
import * as THREE from 'three';
import {
  RouteDefiningStructure,
  ChamberGateId,
} from './convoyTypes';
import { convoyChamberGates } from './convoyChamberGates';
import { TOTAL_CAMPAIGN_KM } from './convoyCampaignRegions';

export class ConvoyAdaptiveRouteSystem {
  public structures: Map<string, RouteDefiningStructure> = new Map();
  public activeSpline: THREE.CatmullRomCurve3;
  public totalRouteLengthMeters: number = 38800;
  public readonly routeLengthKm: number = TOTAL_CAMPAIGN_KM; // 200,000 km
  public waypoints: THREE.Vector3[] = [];
  public isRouteAltered: boolean = false;
  public lastModifiedStructureId?: string;

  // Visual spline line mesh
  public routeGuideLine?: THREE.Line;

  constructor() {
    this.waypoints = this.generateBaselineWaypoints();
    this.activeSpline = new THREE.CatmullRomCurve3(this.waypoints, false, 'catmullrom', 0.18);
    this.totalRouteLengthMeters = this.activeSpline.getLength();
    this.registerCoreStructures();
  }

  /**
   * Baseline 100-location physical spline anchors spanning the full 200,000 km corridor
   * From Origin Parking Dome (Z = 0) to Celestial Crown Terminal (Z = -38,400)
   */
  private generateBaselineWaypoints(): THREE.Vector3[] {
    const backboneWaypoints = [
      new THREE.Vector3(0, 0, 0),                 // Loc 001: Guardian Departure Dome (0 km)
      new THREE.Vector3(0, 0, -280),              // Loc 001: Origin Launch Gate Threshold
      new THREE.Vector3(280, 45, -2400),          // Loc 007-009: Orbital Megacity & Shipyards (~16,000 km)
      new THREE.Vector3(580, -35, -5800),         // Loc 016-018: Asteroid Graveyard & Titan Megabridge (~34,000 km)
      new THREE.Vector3(340, -85, -9800),         // Loc 026-028: Frozen Moon & Volcanic Core (~52,000 km)
      new THREE.Vector3(-420, 65, -14200),        // Loc 037-039: Combat Corridor & Starforge (~76,000 km)
      new THREE.Vector3(-660, -35, -18800),       // Loc 049-051: Deep Trench & Ion Abyss (~100,000 km)
      new THREE.Vector3(-480, 55, -23400),        // Loc 061-063: Crystal Spires & Derelict Fleet (~124,000 km)
      new THREE.Vector3(-280, 75, -28200),        // Loc 073-076: Quantum Rift & Citadel Belt (~150,000 km)
      new THREE.Vector3(120, -45, -33200),        // Loc 086-089: Nebula Shallows & Ring Graveyard (~176,000 km)
      new THREE.Vector3(0, 35, -36800),           // Loc 096-098: Crown Approach Gantry (~194,000 km)
      new THREE.Vector3(0, 40, -37850),           // Loc 099: Celestial Crown Outer Arrival Gate (198,000 km)
      new THREE.Vector3(0, 20, -38050),           // Loc 100: Crown Inner Airlock Gate (199,000 km)
      new THREE.Vector3(0, -158, -38350),         // Loc 100: Celestial Crown Central Sanctuary Atrium / Bay 01 (200,000 km)
    ];

    const backbone = new THREE.CatmullRomCurve3(backboneWaypoints, false, 'catmullrom', 0.25);
    const expanded: THREE.Vector3[] = [];
    const samples = 350;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = backbone.getPointAt(t);

      // Add gentle, bounded physical sweep within regions, preserving start and terminal anchors
      if (i > 3 && i < samples - 15) {
        const tangent = backbone.getTangentAt(t).normalize();
        const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const region = Math.min(99, Math.floor(t * 100));
        const localT = (t * 100) - region;
        const envelope = Math.sin(Math.PI * localT);
        const sweep = Math.sin((region + 1) * 1.73) * 115 * envelope;
        const vertical = Math.cos((region + 1) * 1.19) * 40 * envelope;
        pt.addScaledVector(lateral, sweep);
        pt.y += vertical;
      }
      expanded.push(pt);
    }

    return expanded;
  }

  /**
   * Register key route-defining structures across the 200,000 km campaign
   */
  private registerCoreStructures() {
    // 1. Origin Parking Dome (Location 001)
    this.registerStructure({
      id: 'origin_departure_dome',
      name: 'Guardian Departure Dome (Origin)',
      shape: 'OCTAGONAL',
      position: new THREE.Vector3(0, 0, 0),
      dimensions: new THREE.Vector3(900, 300, 900),
      rotation: new THREE.Euler(0, 0, 0),
      entrances: [new THREE.Vector3(0, 0, -120)],
      exits: [new THREE.Vector3(0, 0, -280)],
      navigableCorridors: [
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0, 0, -120), radius: 65 },
        { start: new THREE.Vector3(0, 0, -120), end: new THREE.Vector3(0, 0, -280), radius: 80 },
      ],
      collisionBounds: [{ min: new THREE.Vector3(-450, -150, -350), max: new THREE.Vector3(450, 150, 150), solid: true }],
      isAccessible: true,
      blockedGates: [],
    });

    // 2. Celestial Crown Parking Terminal Complex (Location 100 Destination Sanctuary)
    this.registerStructure({
      id: 'celestial_crown_terminal',
      name: 'Celestial Crown Parking Terminal Complex',
      shape: 'OCTAGONAL',
      position: new THREE.Vector3(0, -80, -38350),
      dimensions: new THREE.Vector3(1200, 360, 1200),
      rotation: new THREE.Euler(0, 0, 0),
      entrances: [
        new THREE.Vector3(0, 40, -37850),  // Crown Outer Gate
        new THREE.Vector3(0, 20, -38050),  // Crown Airlock Inner Gate
      ],
      exits: [
        new THREE.Vector3(0, -245, -38700), // Emergency Escape Gate
        new THREE.Vector3(0, -240, -38850), // Secondary Evacuation Exit
      ],
      navigableCorridors: [
        { start: new THREE.Vector3(0, 40, -37850), end: new THREE.Vector3(0, 20, -38050), radius: 70 },
        { start: new THREE.Vector3(0, 20, -38050), end: new THREE.Vector3(0, -158, -38350), radius: 180 },
        { start: new THREE.Vector3(0, -158, -38350), end: new THREE.Vector3(0, -250, -38650), radius: 55 },
      ],
      collisionBounds: [
        { min: new THREE.Vector3(-600, -280, -38900), max: new THREE.Vector3(600, 200, -37750), solid: true },
      ],
      isAccessible: true,
      blockedGates: [],
    });

    // 3. Backward compatibility alias: guardian_space_terminal
    this.registerStructure({
      id: 'guardian_space_terminal',
      name: 'Guardian Space Terminal Complex',
      shape: 'OCTAGONAL',
      position: new THREE.Vector3(0, -80, -38350),
      dimensions: new THREE.Vector3(1200, 360, 1200),
      rotation: new THREE.Euler(0, 0, 0),
      entrances: [
        new THREE.Vector3(0, 40, -37850),
        new THREE.Vector3(0, 20, -38050),
      ],
      exits: [
        new THREE.Vector3(0, -245, -38700),
        new THREE.Vector3(0, -240, -38850),
      ],
      navigableCorridors: [
        { start: new THREE.Vector3(0, 40, -37850), end: new THREE.Vector3(0, 20, -38050), radius: 70 },
        { start: new THREE.Vector3(0, 20, -38050), end: new THREE.Vector3(0, -158, -38350), radius: 180 },
      ],
      collisionBounds: [
        { min: new THREE.Vector3(-600, -280, -38900), max: new THREE.Vector3(600, 200, -37750), solid: true },
      ],
      isAccessible: true,
      blockedGates: [],
    });
  }

  public registerStructure(structure: RouteDefiningStructure) {
    this.structures.set(structure.id, structure);
  }

  /**
   * Project player position onto the active 3D route spline to find the closest parameter t in [0, 1]
   */
  public findClosestT(pos: THREE.Vector3, samples = 200): number {
    let closestT = 0;
    let minDistSq = Infinity;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = this.activeSpline.getPointAt(t);
      const dSq = pt.distanceToSquared(pos);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestT = t;
      }
    }

    // High precision local gradient refinement
    const step = 1 / samples;
    const startT = Math.max(0, closestT - step);
    const endT = Math.min(1, closestT + step);
    for (let i = 0; i <= 24; i++) {
      const t = startT + (i / 24) * (endT - startT);
      const pt = this.activeSpline.getPointAt(t);
      const dSq = pt.distanceToSquared(pos);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestT = t;
      }
    }

    return closestT;
  }

  /**
   * Boundary Containment System:
   * Continuous visible bounded flight envelope along the 200,000 km corridor.
   * Corridor half-width W = 320m (expands in dome approach areas).
   * - Warning trigger: lateral offset >= 260m
   * - Gentle pushback: lateral offset >= 290m
   * - Boundary violation clamp: lateral offset >= 320m
   */
  public checkBoundaryContainment(pos: THREE.Vector3): {
    isViolated: boolean;
    isWarning: boolean;
    distanceToEdge: number;
    lateralOffset: number;
    pushbackVector: THREE.Vector3;
    warningText?: string;
  } {
    const t = this.findClosestT(pos, 80);
    const center = this.getPointAt(t);
    const tangent = this.getTangentAt(t);

    // Vector from spline centerline to ship
    const offsetVec = pos.clone().sub(center);
    // Orthogonal component perpendicular to spline tangent
    const alongTangent = tangent.clone().multiplyScalar(offsetVec.dot(tangent));
    const lateralVec = offsetVec.clone().sub(alongTangent);
    const lateralDist = lateralVec.length();

    // Corridor half-width: 550m near terminals/domes, 320m along flight corridor
    const corridorHalfWidth = (pos.z > -400 || pos.z < -37500) ? 550 : 320;
    const warningThreshold = corridorHalfWidth - 60; // 260m
    const pushbackThreshold = corridorHalfWidth - 30; // 290m

    const distanceToEdge = Math.max(0, corridorHalfWidth - lateralDist);
    const isWarning = lateralDist >= warningThreshold;
    const isViolated = lateralDist >= corridorHalfWidth;

    const pushbackVector = new THREE.Vector3();
    if (lateralDist >= pushbackThreshold && lateralDist > 0.001) {
      // Inward steering pushback towards centerline
      const pushDir = lateralVec.clone().negate().normalize();
      const penetration = Math.min(60, lateralDist - pushbackThreshold);
      pushbackVector.copy(pushDir).multiplyScalar(penetration * 2.5);
    }

    let warningText: string | undefined;
    if (isViolated) {
      warningText = 'FLIGHT CORRIDOR BOUNDARY VIOLATION — INWARD CONTAINMENT PUSHBACK ENGAGED';
    } else if (isWarning) {
      warningText = `FLIGHT BOUNDARY WARNING — ${Math.round(distanceToEdge)}M TO CONTAINMENT GRID`;
    }

    return {
      isViolated,
      isWarning,
      distanceToEdge,
      lateralOffset: lateralDist,
      pushbackVector,
      warningText,
    };
  }

  /**
   * Core Update Trigger:
   * Called whenever a structure is resized, moved, gates closed, or opened.
   */
  public notifyStructureStateChanged(
    structureId: string,
    blockedGateIds: ChamberGateId[] = []
  ): boolean {
    const struct = this.structures.get(structureId);
    if (!struct) return false;

    struct.blockedGates = blockedGateIds;
    this.lastModifiedStructureId = structureId;

    if (structureId === 'guardian_space_terminal' || structureId === 'celestial_crown_terminal') {
      return this.adaptTerminalRoute(blockedGateIds);
    }

    return true;
  }

  /**
   * Specific adaptation for Terminal:
   * Dynamically routes through open gates while never passing through closed solid leaves.
   */
  private adaptTerminalRoute(blockedGates: ChamberGateId[]): boolean {
    const isGate1Closed = blockedGates.includes('GATE_1_OUTER_ENTRANCE') || blockedGates.includes('CROWN_OUTER_GATE');
    const isGate2Closed = blockedGates.includes('GATE_2_AIRLOCK_INNER') || blockedGates.includes('CROWN_AIRLOCK_GATE');
    const isEmergencyActive = convoyChamberGates.gates.get('GATE_5_EMERGENCY_ESCAPE')?.isEmergencyOverride;

    const N = this.waypoints.length;
    if (N < 20) return false;

    const gate1Pt = new THREE.Vector3(0, 40, -37850);
    const airlockCenterPt = new THREE.Vector3(0, 30, -37950);
    const gate2Pt = new THREE.Vector3(0, 20, -38050);
    const atriumCenterPt = new THREE.Vector3(0, -158, -38350);
    const emergencyExitPt = new THREE.Vector3(0, -240, -38850);

    if (isEmergencyActive) {
      this.waypoints[N - 5] = new THREE.Vector3(0, -250, -38500);
      this.waypoints[N - 4] = new THREE.Vector3(0, -245, -38600);
      this.waypoints[N - 3] = new THREE.Vector3(0, -245, -38700);
      this.waypoints[N - 2] = new THREE.Vector3(0, -240, -38800);
      this.waypoints[N - 1] = emergencyExitPt;
    } else if (isGate1Closed && !isGate2Closed) {
      // Safe stand-off position before Gate 1 threshold
      this.waypoints[N - 4] = new THREE.Vector3(0, 45, -37700);
      this.waypoints[N - 3] = new THREE.Vector3(0, 42, -37750);
      this.waypoints[N - 2] = new THREE.Vector3(0, 40, -37800);
      this.waypoints[N - 1] = new THREE.Vector3(0, 40, -37820);
    } else if (!isGate1Closed && isGate2Closed) {
      this.waypoints[N - 4] = gate1Pt;
      this.waypoints[N - 3] = new THREE.Vector3(0, 35, -37900);
      this.waypoints[N - 2] = airlockCenterPt;
      this.waypoints[N - 1] = new THREE.Vector3(0, 25, -38000);
    } else {
      this.waypoints[N - 4] = gate1Pt;
      this.waypoints[N - 3] = airlockCenterPt;
      this.waypoints[N - 2] = gate2Pt;
      this.waypoints[N - 1] = atriumCenterPt;
    }

    this.activeSpline = new THREE.CatmullRomCurve3(this.waypoints, false, 'catmullrom', 0.18);
    this.totalRouteLengthMeters = this.activeSpline.getLength();
    this.isRouteAltered = true;

    return true;
  }

  public getPointAt(t: number): THREE.Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));
    return this.activeSpline.getPointAt(clampedT);
  }

  public getPoint(t: number): THREE.Vector3 {
    return this.getPointAt(t);
  }

  public getTangentAt(t: number): THREE.Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));
    return this.activeSpline.getTangentAt(clampedT).normalize();
  }

  public getTangent(t: number): THREE.Vector3 {
    return this.getTangentAt(t);
  }

  /**
   * Tangent oriented with travel direction ('OUTBOUND' = towards Z-, 'RETURN' = towards Z+)
   */
  public getDirectionTangent(t: number, direction: 'OUTBOUND' | 'RETURN' = 'OUTBOUND'): THREE.Vector3 {
    const fwd = this.getTangentAt(t);
    return direction === 'RETURN' ? fwd.clone().negate() : fwd;
  }

  public updateEmergencyRoute(active: boolean) {
    const N = this.waypoints.length;
    if (active && N >= 6) {
      this.waypoints[N - 4] = new THREE.Vector3(0, -158, -38350);
      this.waypoints[N - 3] = new THREE.Vector3(0, -210, -38550);
      this.waypoints[N - 2] = new THREE.Vector3(0, -250, -38700);
      this.waypoints[N - 1] = new THREE.Vector3(0, -200, -38850);
      this.activeSpline = new THREE.CatmullRomCurve3(this.waypoints, false, 'catmullrom', 0.18);
      this.totalRouteLengthMeters = this.activeSpline.getLength();
      this.isRouteAltered = true;
    } else {
      this.waypoints = this.generateBaselineWaypoints();
      this.activeSpline = new THREE.CatmullRomCurve3(this.waypoints, false, 'catmullrom', 0.18);
      this.totalRouteLengthMeters = this.activeSpline.getLength();
      this.isRouteAltered = false;
    }
  }

  public validateFormationClearance(
    t: number,
    formationWidth: number
  ): { isClear: boolean; maxAllowedWidth: number } {
    const pos = this.getPointAt(t);
    if (pos.z <= -37800) {
      const isAirlock = pos.z > -38050;
      const maxAllowed = isAirlock ? 65 : 140;
      return { isClear: formationWidth <= maxAllowed, maxAllowedWidth: maxAllowed };
    }
    return { isClear: true, maxAllowedWidth: 320 };
  }
}

export const convoyAdaptiveRoute = new ConvoyAdaptiveRouteSystem();

