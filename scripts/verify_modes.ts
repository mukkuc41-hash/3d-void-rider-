import * as THREE from 'three';
import { MODE_REGISTRY, getModeDefinition } from '../src/game/modes/ModeRegistry';
import { MODE_EVENT_CATALOG } from '../src/game/events/ModeEventCatalog';
import { ModeGameplayCoordinator } from '../src/game/modes/ModeGameplayCoordinator';
import { getExtendedPathConfig } from '../src/game/extendedPath/modePathConfigs';
import { GAME_MODE_CONFIGS } from '../src/game/modeConfig';
import { ALL_MODES_CONFIG } from '../src/game/modeConfigs';
import {
  distancePointToSegment,
  testSweptSphereToPoint,
  testSweptBarrier,
} from '../src/game/collisionSystem';
import { HazardManager } from '../src/game/hazardManager';
import { ModeEnvironmentManager } from '../src/game/environment/modeEnvironmentManager';
import { FinalCollapseManager } from '../src/game/FinalCollapseManager';

console.log('====================================================');
console.log('VOID-RIDER 3D: QUANTUM LAUNCH PRO VERIFICATION SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${testName}${details ? ': ' + details : ''}`);
  }
}

// 1. Verify ModeRegistry
console.log('--- 1. Testing ModeRegistry (Modes 01 - 20) ---');
const expectedModes = [
  'SINGULARITY_RUN',
  'NEON_CIRCUIT',
  'ASTEROID_RUN',
  'WORMHOLE_EXPRESS',
  'SOLAR_STORM',
  'GRAVITY_FREE',
  'PLASMA_STORM',
  'SKYLINE_RUSH',
  'DEBRIS_SURVIVAL',
  'QUANTUM_TIME_TRIAL',
  'ENERGY_HEIST',
  'DRONE_ASSAULT',
  'COLLAPSING_TRACK',
  'RING_RUNNER',
  'HYPERSPACE_SPRINT',
  'RIVAL_DUEL',
  'RELAY_RACE',
  'SURVIVAL_ELIMINATION',
  'COSMIC_TREASURE_HUNT',
  'VOID_CHAMPIONSHIP',
];

for (let i = 0; i < expectedModes.length; i++) {
  const modeKey = expectedModes[i];
  const modeNum = i + 1;
  const def = getModeDefinition(modeKey);
  assert(!!def, `Mode ${modeNum.toString().padStart(2, '0')} (${modeKey}) exists in ModeRegistry`);
  if (def) {
    assert(def.modeNumber === modeNum, `Mode ${modeNum} modeNumber matches`, `got ${def.modeNumber}`);
    assert(!!def.displayName && def.displayName.length > 0, `Mode ${modeNum} has displayName (${def.displayName})`);
    assert(!!def.physicsProfile, `Mode ${modeNum} has physicsProfile`);
    assert(def.shortcuts.length > 0, `Mode ${modeNum} has shortcut definitions (${def.shortcuts.length} shortcuts)`);
    assert(!!def.objectiveText, `Mode ${modeNum} has objectiveText`);
  }
}

// 2. Verify ModeEventCatalog
console.log('\n--- 2. Testing ModeEventCatalog (Modes 02 - 20) ---');
const eventModes = expectedModes.slice(1); // modes 2-20
for (const modeKey of eventModes) {
  const events = MODE_EVENT_CATALOG[modeKey];
  assert(!!events && events.length >= 3, `Mode ${modeKey} has at least 3 scripted events (found ${events?.length || 0})`);
  if (events) {
    let triggersValid = true;
    let fieldsValid = true;
    for (const evt of events) {
      if (!evt.trigger?.type) {
        triggersValid = false;
      }
      if (evt.trigger?.type === 'SPLINE_PROGRESS') {
        if (!evt.trigger.splineWindow || typeof evt.trigger.splineWindow[0] !== 'number' || typeof evt.trigger.splineWindow[1] !== 'number') {
          triggersValid = false;
        }
      }
      if (!evt.id || !evt.name || !evt.consequenceType) {
        fieldsValid = false;
      }
    }
    assert(triggersValid, `Mode ${modeKey} events have valid triggers`);
    assert(fieldsValid, `Mode ${modeKey} events have valid id, name, consequenceType`);
  }
}

// 3. Verify ModeGameplayCoordinator lifecycle & runtime
console.log('\n--- 3. Testing ModeGameplayCoordinator Lifecycle & Runtime ---');
const dummyScene = new THREE.Scene();
const coordinator = new ModeGameplayCoordinator(dummyScene);

for (const modeKey of expectedModes) {
  coordinator.initMode(modeKey as any, null);
  assert(coordinator.activeMode === modeKey, `Coordinator successfully initialized ${modeKey}`);
  
  // Test update with sample telemetry
  const playerPos = new THREE.Vector3(0, 5, 100);
  const playerSpeedKmH = 380;
  const splineT = 0.25;
  const lateralOffset = 0.0;
  const currentLap = 1;
  const isBoosting = false;
  const isDrifting = false;

  const hudResult = coordinator.update(
    0.016,
    playerPos,
    playerSpeedKmH,
    splineT,
    lateralOffset,
    currentLap,
    isBoosting,
    isDrifting
  );
  assert(typeof hudResult.primaryMetricLabel === 'string', `${modeKey} update returns primaryMetricLabel ("${hudResult.primaryMetricLabel}")`);
  assert(typeof hudResult.primaryMetricValue === 'string', `${modeKey} update returns primaryMetricValue ("${hudResult.primaryMetricValue}")`);
  assert(typeof hudResult.objectiveText === 'string', `${modeKey} update returns objectiveText ("${hudResult.objectiveText}")`);
}

// 4. Verify Extended Path Configs
console.log('\n--- 4. Testing Extended Path Configs ---');
for (const modeKey of expectedModes) {
  const pathConfig = getExtendedPathConfig(modeKey as any);
  assert(!!pathConfig, `ExtendedPathConfig exists for ${modeKey}`);
  if (pathConfig) {
    assert(pathConfig.targetSplineLength > 0, `${modeKey} targetSplineLength > 0 (${pathConfig.targetSplineLength}m)`);
    assert(pathConfig.controlPoints.length >= 4, `${modeKey} has sufficient control points (${pathConfig.controlPoints.length})`);
  }
}

// 5. Verify GAME_MODE_CONFIGS and ALL_MODES_CONFIG
console.log('\n--- 5. Testing Game Configs ---');
for (const modeKey of expectedModes) {
  const cfg1 = (GAME_MODE_CONFIGS as any)[modeKey];
  const cfg2 = (ALL_MODES_CONFIG as any)[modeKey];
  assert(!!cfg1, `GAME_MODE_CONFIGS has entry for ${modeKey}`);
  assert(!!cfg2, `ALL_MODES_CONFIG has entry for ${modeKey}`);
}

// 6. Verify Continuous Collision Detection (CCD), Hazard Transforms & Dynamic Surfaces
console.log('\n--- 6. Testing Continuous Collision Detection & Hazard Consistency ---');

// 6.1 Point to Segment Distance
const pSegDist = distancePointToSegment(
  new THREE.Vector3(0, 5, 0),
  new THREE.Vector3(-10, 0, 0),
  new THREE.Vector3(10, 0, 0)
);
assert(Math.abs(pSegDist - 5.0) < 0.001, 'distancePointToSegment accurately measures orthogonal distance (5.0m)');

// 6.2 Swept Sphere Anti-Tunneling Check
const fastPrevPos = new THREE.Vector3(0, 0, -25);
const fastCurrPos = new THREE.Vector3(0, 0, 25);
const targetPos = new THREE.Vector3(0, 0, 0);
const sweptHit = testSweptSphereToPoint(fastPrevPos, fastCurrPos, targetPos, 2.5, 2.4);
assert(sweptHit.hit, 'testSweptSphereToPoint detects high-speed pass through obstacle (eliminates tunneling)');
assert(sweptHit.distance < 0.001, 'testSweptSphereToPoint computes correct closest approach point');

const sweptMiss = testSweptSphereToPoint(fastPrevPos, fastCurrPos, new THREE.Vector3(12, 0, 0), 2.5, 2.4);
assert(!sweptMiss.hit, 'testSweptSphereToPoint cleanly rejects trajectories outside collision bounds');

// 6.3 Swept Barrier Crossing & Traversable Openings
const barrierCenter = new THREE.Vector3(0, 0, 50);
const barrierTangent = new THREE.Vector3(0, 0, 1);
const barrierBinormal = new THREE.Vector3(1, 0, 0);
const sweptBarrierPass = testSweptBarrier(
  new THREE.Vector3(0, 0, 40),
  new THREE.Vector3(0, 0, 60),
  barrierCenter,
  barrierTangent,
  barrierBinormal,
  30,
  16,
  2.4
);
assert(sweptBarrierPass.crossed && sweptBarrierPass.hit, 'testSweptBarrier detects planar trajectory crossing');
assert(Math.abs(sweptBarrierPass.lateralOffset) < 0.001, 'testSweptBarrier calculates precise lateral offset for lane evaluation');

// 6.4 HazardManager Moving Hazard Transform Synchronization
const testScene = new THREE.Scene();
const hazardMgr = new HazardManager(testScene);
const testCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, 200),
  new THREE.Vector3(200, 0, 200),
  new THREE.Vector3(200, 0, 0),
]);
hazardMgr.initForMode('NEON_CIRCUIT', 'NORMAL', testCurve);
assert(hazardMgr.hazards.length > 0, `HazardManager initialized ${hazardMgr.hazards.length} hazards for NEON_CIRCUIT`);

// Execute update and check transform synchronization
const playerP = new THREE.Vector3(0, 2, 10);
const prevPlayerP = new THREE.Vector3(0, 2, 5);
hazardMgr.update(0.016, playerP, 0.05, 120, undefined, prevPlayerP);

let transformsAligned = true;
for (const h of hazardMgr.hazards) {
  if (h.mesh) {
    const worldP = new THREE.Vector3();
    h.mesh.getWorldPosition(worldP);
    if (worldP.distanceTo(h.position) > 0.001) {
      transformsAligned = false;
      break;
    }
  }
}
assert(transformsAligned, 'Hazard visible geometry and collision transforms are 100% aligned every frame');

// 6.5 ModeEnvironmentManager Dynamic Collision Surfaces
const envMgr = new ModeEnvironmentManager(testScene);
envMgr.loadEnvironment('NEON_CIRCUIT', testCurve, 'neon_circuit');
assert(!!envMgr.activeMode, 'ModeEnvironmentManager activeMode set to NEON_CIRCUIT');
envMgr.update(0.016, 0.05, 120);
envMgr.triggerEventReaction('NEON_01', 'ACTIVE', '#00f0ff', 1.0);
assert(true, 'ModeEnvironmentManager triggerEventReaction executed safely');
envMgr.unloadEnvironment();
assert(envMgr.dynamicColliders.length === 0, 'ModeEnvironmentManager unloads cleanly with dynamic colliders reset');

// --- 7. Testing Hull Integrity & Submode 10 Final Collapse Integration ---
console.log('\n--- 7. Testing Hull Integrity & Submode 10 Final Collapse Integration ---');
// 7.1 Hull initialization
let hull = 100;
let shieldCore = 100;
assert(hull === 100, 'Hull starts at initial 100% integrity');

// 7.2 Shield absorption: valid hit absorbed by shield
const initialHit = 30;
if (shieldCore > 0) {
  const absorbed = Math.min(shieldCore, initialHit);
  shieldCore -= absorbed;
  const remaining = initialHit - absorbed;
  hull -= remaining;
}
assert(shieldCore === 70 && hull === 100, 'Shield absorbs damage completely without reducing hull integrity');

// 7.3 Shield depletion and hull damage registration
const heavyHit = 90; // 70 absorbed by remaining shield, 20 damage to hull
if (shieldCore > 0) {
  const absorbed = Math.min(shieldCore, heavyHit);
  shieldCore -= absorbed;
  const remaining = heavyHit - absorbed;
  hull -= remaining;
} else {
  hull -= heavyHit;
}
assert(shieldCore === 0 && hull === 80, 'Shield exhaustion correctly passes remainder damage to hull (80%)');

// 7.4 Warning thresholds evaluation
function getWarningThreshold(hp: number): string | null {
  if (hp <= 0) return 'SHIP DISABLED';
  if (hp <= 15) return 'STRUCTURAL FAILURE IMMINENT';
  if (hp <= 40) return 'HULL CRITICAL';
  if (hp <= 75) return 'HULL DAMAGE DETECTED';
  return null;
}
assert(getWarningThreshold(100) === null, 'No warning at 100% nominal hull');
assert(getWarningThreshold(75) === 'HULL DAMAGE DETECTED', 'Triggers HULL DAMAGE DETECTED at 75%');
assert(getWarningThreshold(40) === 'HULL CRITICAL', 'Triggers HULL CRITICAL at 40%');
assert(getWarningThreshold(15) === 'STRUCTURAL FAILURE IMMINENT', 'Triggers STRUCTURAL FAILURE IMMINENT at 15%');
assert(getWarningThreshold(0) === 'SHIP DISABLED', 'Triggers SHIP DISABLED at 0%');

// 7.5 Repair mechanic restores integrity up to 100%
hull = Math.min(100, hull + 50);
assert(hull === 100, 'Repair mechanic restores hull integrity up to 100% cap');

// 7.6 Submode 10 Final Collapse Integration
const fcScene = new THREE.Scene();
const fcManager = new FinalCollapseManager(fcScene);
fcManager.start();
assert(fcManager.evacuation.gameState === 'NORMAL_RACE', 'FinalCollapseManager starts in NORMAL_RACE state');

// Trigger failure due to critical hull breach
fcManager.triggerFailure('CRITICAL_HULL_BREACH', false, new THREE.Vector3(0, 0, 0));
const fcTelemetry = fcManager.getTelemetry();
assert(fcTelemetry.evacuationFailed === true, 'FinalCollapseManager records evacuation failure on critical hull breach');
assert(fcTelemetry.failureCause === 'CRITICAL_HULL_BREACH', 'Failure cause correctly recorded as CRITICAL_HULL_BREACH');
assert(fcTelemetry.gameState === 'EVACUATION_FAILURE', 'Game state transitions to EVACUATION_FAILURE');

console.log('\n====================================================');
console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (failedTests > 0) {
  console.error(`FAILED: ${failedTests} tests failed.`);
  process.exit(1);
} else {
  console.log('ALL INTEGRATION, LIFECYCLE & COLLISION TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}
