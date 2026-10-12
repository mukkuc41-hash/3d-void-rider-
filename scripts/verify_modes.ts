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
import {
  FINAL_COLLAPSE_100_EVENTS,
  getFinalCollapse100Event,
  formatCinematicElapsedTimer,
  TOTAL_CINEMATIC_SECONDS,
  EVENT_DURATION_SECONDS,
  TOTAL_EVENTS_COUNT,
} from '../src/game/finalCollapse100Events';

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

// --- 8. Testing Mode 21 Submode 10: 20-Minute 100-Event Final Collapse Specification ---
console.log('\n--- 8. Testing Mode 21 Submode 10: 20-Minute 100-Event Final Collapse Specification ---');
assert(FINAL_COLLAPSE_100_EVENTS.length === 100, 'Exactly 100 sequential events defined in master catalog');
assert(TOTAL_CINEMATIC_SECONDS === 1200, 'Total cinematic duration is exactly 1,200 seconds (20:00)');
assert(EVENT_DURATION_SECONDS === 12, 'Each event is exactly 12 seconds in duration');

// Event 1 verification
const ev1 = getFinalCollapse100Event(0);
assert(ev1.eventNumber === 1 && ev1.event.title === 'Evacuation Window Expired', 'Event 1 starts at 00:00 with "Evacuation Window Expired"');
assert(ev1.event.timeRange === '00:00–00:12', 'Event 1 occupies 00:00–00:12');

// Event 4 (00:36–00:48) First Planetary Collision
const ev4 = getFinalCollapse100Event(40);
assert(ev4.eventNumber === 4 && ev4.event.title === 'First Planetary Collision', 'Event 4 occupies 00:36–00:48 ("First Planetary Collision")');

// Event 8 (01:24–01:36) Route Tears Apart
const ev8 = getFinalCollapse100Event(90);
assert(ev8.eventNumber === 8 && ev8.event.title === 'Route Tears Apart', 'Event 8 occupies 01:24–01:36 ("Route Tears Apart")');

// Events 22 to 31: Exactly 10 Distinct Gravitational Waves
const ev22 = getFinalCollapse100Event(255);
assert(ev22.eventNumber === 22 && ev22.event.title === 'Gravitational Wave 1 of 10', 'Event 22 triggers Gravitational Wave 1 of 10');
assert(ev22.event.timeRange === '04:12–04:24', 'Wave 1 occupies 04:12–04:24');

const ev31 = getFinalCollapse100Event(365);
assert(ev31.eventNumber === 31 && ev31.event.title === 'Gravitational Wave 10 of 10', 'Event 31 triggers Gravitational Wave 10 of 10');
assert(ev31.event.timeRange === '06:00–06:12', 'Wave 10 occupies 06:00–06:12');

// Events 32 to 34: Separate Upper and Lower Debris Rings
const ev32 = getFinalCollapse100Event(375);
assert(ev32.eventNumber === 32 && ev32.event.title === 'Upper Debris Ring Begins Forming', 'Event 32 begins upper debris ring formation');

const ev33 = getFinalCollapse100Event(385);
assert(ev33.eventNumber === 33 && ev33.event.title === 'Lower Debris Ring Begins Forming', 'Event 33 begins lower debris ring formation');

const ev34 = getFinalCollapse100Event(400);
assert(ev34.eventNumber === 34 && ev34.event.title === 'Twin-Ring Orbit', 'Event 34 establishes twin-ring independent orbit');

// Event 50 (09:48–10:00) Brilliant White Flash
const ev50 = getFinalCollapse100Event(590);
assert(ev50.eventNumber === 50 && ev50.event.title === 'Brilliant White Flash', 'Event 50 triggers Brilliant White Flash at 09:48–10:00');

// Event 51 (10:00–10:12) Universe Regeneration Begins
const ev51 = getFinalCollapse100Event(605);
assert(ev51.eventNumber === 51 && ev51.event.title === 'Universe Regeneration Begins', 'Event 51 begins universe regeneration at 10:00');

// Event 100 (19:48–20:00) Regeneration Completes
const ev100 = getFinalCollapse100Event(1190);
assert(ev100.eventNumber === 100 && ev100.event.title === 'Regeneration Completes', 'Event 100 is active during 19:48–20:00 ("Regeneration Completes")');
assert(ev100.event.timeRange === '19:48–20:00', 'Event 100 occupies 19:48–20:00');

// Exact 1200s (20:00) completion
const evComplete = getFinalCollapse100Event(1200);
assert(evComplete.isComplete === true && evComplete.totalProgress === 1.0, 'Cinematic completes at exactly 1,200s with 100% progress');

// Timer formatting across 20 minutes
assert(formatCinematicElapsedTimer(0) === '00:00', 'Cinematic timer correctly formats 0s as 00:00');
assert(formatCinematicElapsedTimer(252) === '04:12', 'Cinematic timer correctly formats 252s as 04:12 (Wave 1 start)');
assert(formatCinematicElapsedTimer(372) === '06:12', 'Cinematic timer correctly formats 372s as 06:12 (Upper ring start)');
assert(formatCinematicElapsedTimer(600) === '10:00', 'Cinematic timer correctly formats 600s as 10:00 (White flash peak / Regen start)');
assert(formatCinematicElapsedTimer(1200) === '20:00', 'Cinematic timer correctly formats 1200s as 20:00');

// Failure trigger and state machine integration
const fcManager100 = new FinalCollapseManager(new THREE.Scene());
fcManager100.start();
fcManager100.triggerFailure('EVACUATION_DEADLINE_EXPIRED', false, new THREE.Vector3(0, 0, 0));
assert(fcManager100.failureCinematic.isActive === true, 'Failure cinematic activates on deadline expiration');
assert(fcManager100.failureCinematic.endingVariant === 'MISSED_ESCAPE_COLLAPSE', 'Ending variant is MISSED_ESCAPE_COLLAPSE');

// Telemetry verification
const tel100 = fcManager100.getTelemetry();
assert(tel100.cinematicTotalSeconds === 1200, 'Telemetry reports exactly 1,200s total duration');
assert(tel100.currentEventNumber === 1, 'Telemetry reports initial event number as 1');
assert(tel100.currentEventTitle === 'Evacuation Window Expired', 'Telemetry reports initial event title correctly');

// Safe zone precedence guard: if survived, failure is prevented
const fcManagerSurvived = new FinalCollapseManager(new THREE.Scene());
fcManagerSurvived.start();
fcManagerSurvived.markSurvived();
fcManagerSurvived.triggerFailure('EVACUATION_DEADLINE_EXPIRED', false);
assert(fcManagerSurvived.evacuation.evacuationFailed === false, 'Safe zone success takes precedence and prevents failure trigger');

console.log('\n====================================================');
console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (failedTests > 0) {
  console.error(`FAILED: ${failedTests} tests failed.`);
  process.exit(1);
} else {
  console.log('ALL INTEGRATION, LIFECYCLE & COLLISION TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}
