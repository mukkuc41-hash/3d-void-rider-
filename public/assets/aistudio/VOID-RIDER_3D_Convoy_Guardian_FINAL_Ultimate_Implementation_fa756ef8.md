# VOID-RIDER 3D --- CONVOY GUARDIAN

## FINAL ULTIMATE IMPLEMENTATION SPECIFICATION

### For Google AI Studio --- Existing Repository Integration

**Deliverable intent:** This document instructs a coding agent to
implement Convoy Guardian in the existing VOID-RIDER 3D project. It is a
specification, not a claim that source code has already been modified or
tested.

------------------------------------------------------------------------

## 1. Mandatory repository-first integration rules

1.  Inspect the actual repository before editing. Identify the real
    entry points, menu, route representation, ship movement, physics,
    collision, camera, input, AI, HUD, audio, mission progression,
    save/load, assets, and build/test scripts.
2.  The project is an existing Three.js/WebGL JavaScript/TypeScript
    game. Do not replace it with Python, Ursina, or an unrelated
    standalone demo.
3.  Use the repository's real paths, APIs, conventions, and existing
    compatible systems. Do not invent files or claim integration without
    implementing it.
4.  Add **CONVOY GUARDIAN** to the main menu, containing two
    independently playable modes: **SAVIOUR** and **HUNTERS**.
5.  Preserve unrelated modes. Do not modify protected Mode 01
    SINGULARITY RUN or Mode 21 BLACK HOLE MODE, and do not reuse
    black-hole-only systems in Convoy Guardian.
6.  Keep SAVIOUR and HUNTERS state, objectives, spawning, factions,
    progression, results, route state, and cleanup independent. Share
    only compatible low-level systems.
7.  Implement actual interactive gameplay and 3D environments. Do not
    substitute menu mockups, static scenery, fake progress, or
    teleportation for physical navigation.
8.  If a requirement conflicts with the actual architecture, describe
    the conflict and implement a safe compatible approach. Do not
    silently break existing functionality.

## 2. Main-menu experience

Add a polished main-menu entry for **CONVOY GUARDIAN** and a
mode-selection screen with separate SAVIOUR and HUNTERS cards. Each card
should show its briefing, objectives, controls, status, and win/fail
conditions, with launch, pause/resume, restart, and return-to-menu
flows.

Provide clear loading, failure, and recovery states. Restarting or
exiting either mode must not corrupt the other mode or the rest of the
game.

## 3. SAVIOUR --- escort and rescue mode

### Nine-ship allied formation

Use exactly nine allied convoy ships in the initial formation:

1.  One lead ship.
2.  Two forward guards.
3.  Three mission-critical cargo ships.
4.  Two rear-mid guards.
5.  One rear guard.

The player must escort the convoy through the campaign, protect the lead
and all three cargo ships, navigate hazards and route branches, and
complete mandatory rescue/repair objectives.

### Formation and AI

Support formations such as V, line, diamond, defensive, and dispersed.
Where compatible, support follow, regroup, defend, spread out, and
hold-position commands.

-   Change formation before narrow passages.
-   Use staged/staggered passage or a safe holding area when the whole
    formation cannot fit.
-   Navigate using real route and obstacle data.
-   Avoid endless collision loops, ship overlap, impossible turns, and
    AI paths through solid geometry.
-   Let damaged ships request assistance and use repair/recovery
    behavior where implemented.
-   Never trigger immediate failure merely because the mode starts or a
    ship briefly leaves formation.

### Objectives and outcomes

Track lead ship, cargo ship, escort health, damage, rescue objectives,
route progress, and mission alerts. Win only when mandatory objectives
are complete, the required convoy survives, and the terminal
arrival/parking conditions succeed. Define fail conditions explicitly
and communicate them before or during play.

## 4. HUNTERS --- combat mode

### Initial enemy formation

-   Ten hunter fighters.
-   One boss ship, initially configured with 1,000 HP.
-   Six independently damageable boss-protection drones.

Make these counts configurable through the project's mission data where
practical.

### Combat and AI

Implement working weapons, target lock, projectile/beam collision, hit
feedback, damage, shields, evasive movement, and coordinated AI using
compatible existing systems. Validate faction and target filters so
allies attack intended hostile targets rather than the player or their
own faction.

The boss should use clear, telegraphed phases: 1. Shielded defense. 2.
Defense breakdown. 3. Vulnerability window with an actual damageable
hitbox. 4. Final assault. 5. Defeat when real boss HP reaches zero and
mandatory conditions are met.

Each protection drone has its own health and destroyed state. Drone
destruction affects boss defenses only through explicit gameplay rules.
Do not let a visual phase change leave the boss incorrectly invulnerable
or desynchronize HP and UI.

Keep HUNTERS restart/exit/cleanup separate from SAVIOUR.

## 5. Shared lifecycle, cleanup, and controls

Reuse compatible movement, physics, collision, camera, weapons,
targeting, HUD, audio, checkpoint, and mission systems. On
restart/exit/disposal, remove mode-owned listeners and timers, clear
projectiles/effects/drones/temporary AI, dispose of owned resources, and
restore input/menu state. Prevent duplicate handlers, stale targets,
orphaned objects, and cross-mode state.

Preserve existing desktop/mobile controls. If compatible, add
six-direction touch-and-hold controls: UP, DOWN, LEFT, RIGHT, FORWARD,
BACKWARD, plus engine ON/OFF, thrust, braking, and position hold. Ensure
release, pause, focus loss, and mode exit cannot leave controls stuck.
Add camera perspective switching and cockpit view only where compatible;
cockpit view must not affect unrelated modes.

A tactical radar should distinguish allies, hostiles, cargo, boss,
drones, hazards, and last-known contacts when present. Include useful
zoom and contact updates, while keeping essential mission information
available through the HUD.

------------------------------------------------------------------------

## 6. Campaign: exactly 50,000 km

The campaign contains exactly **25 consecutive regions × 2,000 km =
50,000 km**. The final destination is Guardian Space Terminal, where the
campaign ends after a successful physical parking sequence.

### Region plan

1.  Dune Planet Frontier
2.  Neon Orbital Megacity
3.  Asteroid Graveyard
4.  Titan Orbital Network
5.  Ocean Planet Expanse
6.  Emerald Alien Jungle
7.  Frozen Moon Frontier
8.  Volcanic Ashlands
9.  Industrial Starforge
10. Deep-Space Tunnel Network
11. Grand Canyon Planet
12. Abandoned Orbital City
13. Solar Energy Expanse
14. Ruined Alien Megastructure
15. Nebula Storm Corridor
16. Skyrail Orbital Heights
17. Crystal Moon Caverns
18. Bio-Engineered Wilds
19. Quantum Research Zone
20. Orbital Cargo Port
21. Gravity Anomaly Frontier
22. Thunder Nebula
23. Galactic Logistics Hub
24. Final Hyperspace Approach
25. Guardian Space Terminal

Each region must have distinct silhouette, scale, materials, lighting,
architecture, route layout, and gameplay. Do not make 25 recolors of one
environment. Avoid empty black voids, thin floating tracks, and random
cubes as substitutes for authored scenery.

### Environment and obstacle variety

Use macro-, mid-, and small-scale geometry: megacities, towers, bridges,
orbital rings, shipyards, factories, cargo terminals, reactor towers,
defense platforms, tunnels, alien ruins, crystal caverns, organic
structures, jump gates, and maintenance infrastructure.

Where supported by the flight model, mix wide approaches, dense
corridors, precision passages, underpasses, tunnels, junctions, moving
platforms, open combat arenas, hazard sections, optional branches,
shortcuts, rescue/repair detours, recovery paths, and region gateways.

Use region-appropriate hazards: drifting debris, asteroid impacts,
rotating machinery, collapsing bridges, moving cargo containers, closing
doors, laser grids, plasma, electrical arcs, overloaded reactors, shield
disruption, radiation, solar flares, sandstorms, eruptions, ice
fractures, lightning, nebula interference, spores, gravity/quantum
anomalies, missiles, mines, drones, and capital-ship crossfire.
Telegraph hazards fairly and avoid unavoidable random damage.

Support real interactive changes where feasible: destroy shield
generators to open passages, shut down reactors to disable lasers,
activate power stations to open gates, disable turrets to reduce fire,
use lifts to create crossings, and rescue units to unlock safe routes.
Visual changes must be backed by real gameplay logic.

Keep the main combat corridor approximately **25,000--35,000 km**, with
the major battle around **30,000 km**, without changing region lengths
or total distance.

------------------------------------------------------------------------

## 7. Structure-aware adaptive route system

### Fundamental rule

**The route and structure geometry must be treated as one connected
system. Whenever a route-defining structure changes shape, size,
position, orientation, or accessibility, update the affected route to
match the real navigable space.** Never leave the old route passing
through the modified structure.

Inspect and extend the real route generator/data, collision system,
navigation, convoy AI, checkpoints, camera, and region transition logic.

Each route-defining structure must define or derive: - Position,
dimensions, orientation, and shape. - Valid entrances and exits. -
Navigable corridors and openings. - Solid collision boundaries and
restricted areas. - Approach/departure directions and route connection
points. - Player and convoy clearance requirements. - Turning space,
hazards, dynamic geometry, and recovery routes.

### Route update procedure

Whenever a structure is created, resized, rotated, moved, reshaped,
opened, closed, or replaced:

1.  Detect the relevant geometry/configuration change.
2.  Recalculate affected route segments, avoiding unnecessary
    full-campaign rebuilds.
3.  Validate connectivity, entry/exit alignment, and clearances.
4.  Check intersections with solid geometry and collision boundaries.
5.  Check turning room, hazards, and ship maneuverability.
6.  Update route guidance and navigation markers.
7.  Update convoy pathing and formation behavior.
8.  Revalidate checkpoints and mandatory objective reachability.
9.  Commit only a valid route.
10. If no valid route exists, retain the last valid route or use a
    defined safe fallback and report the conflict.

Keep collision geometry synchronized with visible geometry. Never
silently route a ship through a solid wall or roof. Do not teleport the
player to conceal a route error.

### Shape-specific routing

-   **Circular structures:** curved approaches, radial entrances,
    circular corridors, concentric parking rings.
-   **Octagonal terminals:** align approaches with usable faces/gates
    and connect them to the inner atrium.
-   **Domes:** route through actual openings clear of roof panels and
    ribs.
-   **Tunnels:** follow navigable centerlines, respect clearance, and
    validate junctions and gates.
-   **Bridges:** use traversable surfaces or explicitly designed flight
    passages.
-   **Industrial complexes:** route around machinery, cranes, moving
    arms, cargo lifts, and factory corridors.
-   **Orbital cities:** connect flight corridors, bridges, and
    underpasses.
-   **Irregular megastructures:** use explicit openings and route
    connectors instead of assuming simple box geometry.
-   **Moving structures:** revalidate accessibility whenever movement
    changes clearance.

When a gate or passage becomes blocked, stop or hold the player/convoy
safely, or choose a valid alternate route. Do not suddenly move the
player, skip distance, or invalidate checkpoints.

### Convoy-aware validation

The SAVIOUR route must fit the nine-ship convoy. Check corridor width,
turning clearance, formation size, and cargo ship clearance. Transition
formation before constrained areas; use staged passage, holding areas,
and regroup points where needed. Avoid overlap, repeated collision
loops, and stranded cargo. HUNTERS arenas must allow combat maneuvering,
and HUNTERS route updates must not change SAVIOUR state.

------------------------------------------------------------------------

## 8. Hazards, route interactions, and performance

Build authored obstacles such as fly-between-tower passages,
rotating-ring openings, moving-container lanes, retracting bridges,
wreckage openings, timed gates, asteroid fields, laser planes, docking
challenges, convoy corridors, storm passages, and factory escape
sections.

-   Important visible obstacles must have matching collision.
-   Avoid invisible blockers and unfair unavoidable damage.
-   Telegraph hazards and provide reasonable reaction windows.
-   Keep route-changing interactions synchronized with collision and
    navigation.
-   Use instancing, pooling, LOD, culling, and streaming for Android and
    desktop.
-   Preserve gameplay-critical collision even when distant visual detail
    is reduced.
-   Do not let streaming create gaps or duplicated route segments.

------------------------------------------------------------------------

## 9. Guardian Space Terminal --- complete architectural redesign

The terminal is the final destination in Region 25. Rebuild it as a
genuinely redesigned, physically navigable complex, not simply an
enlarged or recolored dome.

### New terminal silhouette

Use a broad **octagonal outer shell** around a **large circular central
parking atrium**, with: - Transparent or partially transparent upper
canopy. - Curved structural ribs and segmented roof panels. - Multiple
concentric parking rings. - Elevated docking platforms. - Lower
underground-style maintenance hangar. - Radial connecting corridors. -
Large external approach gates. - Side-mounted hangar wings. - Central
illuminated navigation tower. - Hexagonal supports, exposed trusses,
armored roof panels/hatches, antennas, communication dishes, warning
beacons, maintenance platforms, roof walkways, and large ship
openings. - Cargo lifts, service bridges, emergency shafts, and exterior
landing platforms where compatible with the flight model.

Give the exterior and interior different visual identities. Make the
complete player ship and convoy physically able to traverse intended
passages.

### Three connected zones

**A. Upper Arrival Ring** - Arrival/departure bays, approach corridors,
traffic lights, scanners, holding positions, emergency-stop areas, and
atrium access.

**B. Main Central Parking Atrium** - Open circular flight space,
concentric parking rings, numbered bays, directional floor lights,
radial taxi lanes, holographic guidance, fleet staging,
inspection/repair stations, and enough room for ship rotation.

**C. Lower Maintenance Hangar** - Basement-style parking bays, repair
gantries, service arms/platforms, energy/fuel service points, elevators
or open flight shafts, emergency power, protected storage,
rescue/recovery areas, and atrium connections.

Connect zones using wide, physically navigable ramps, open flight
shafts, or ship elevators only where the current movement model supports
them. Do not force conventional vehicle ramps into a spacecraft flight
model.

### Roof and gate behavior

The roof/gate sequence is: approach → traffic clearance → panels/gates
open → guidance lights confirm clearance → ship crosses → doors close
only when all relevant clearance zones are empty.

Synchronize animations, collision bodies, and route state. Never close a
panel through a ship. If a gate is blocked or fails, hold safely, use a
valid alternate route, or provide a recovery flow.

### Fleet parking allocation

Provide separate bays for: - Player ship. - Cargo ships. - Escort
ships. - Emergency overflow. - Maintenance-only ships. - Damaged-ship
recovery.

Track occupancy so no two ships reserve the same bay. Check ship
dimensions, orientation, and clearance. Fleet ships must navigate and
park physically without overlap or teleportation. If a ship cannot dock
safely, retry, recover, or assign an alternate bay.

### Manual final parking sequence

1.  Complete mandatory final objectives and reveal the terminal.
2.  Request traffic clearance and open the correct entrance.
3.  Fly through the upper arrival ring using normal controls.
4.  Navigate the atrium around real columns, equipment, and parked
    ships.
5.  Assign a valid bay and display bay number, distance, heading,
    alignment, speed, braking, obstacles, and docking readiness.
6.  Manually enter, align, rotate, and stop within the docking zone.
7.  Validate actual position, orientation, speed, ship clearance, bay
    occupancy, and authorization.
8.  If invalid, explain the correction and allow a retry.
9.  Only after validation, activate physical clamps, parking lock,
    engine shutdown, and service connections.
10. Show secured/inspection status and the final report.

Keep player controls active throughout manual parking. Never snap or
teleport the ship into the bay. Campaign completion requires valid
docking and all mandatory objectives.

### Terminal details and optional activities

Use coherent details: floor markings, bay numbers, traffic lights,
warning stripes, conduits, screens, holograms, glass/metal material
variation, machinery, clamps, service arms, repair drones, inspection
scanners, energy stations, cargo equipment, maintenance bridges,
damaged-ship containment, control-room windows, mission insignias,
convoy markings, rescued ships, and battle damage.

Where compatible, allow optional inspection, repairs, stat review,
hangar visits, cosmetic changes, convoy viewing, parking challenges, and
emergency escape drills. Optional activities must not block mandatory
completion.

------------------------------------------------------------------------

## 10. Sensor-controlled chamber gates --- complete subsystem

Implement **real sensor-controlled chamber gates** as an integrated
terminal and route subsystem, not just animated doors. They must
coordinate detection, authorization, door movement, collision, chamber
occupancy, convoy passage, route planning, parking, and emergency
escape.

### Placement

Use sensor gates at: 1. Outer terminal entrance. 2. Upper
arrival/airlock chamber. 3. Atrium-to-basement/maintenance access. 4.
Restricted maintenance bays. 5. Emergency escape chamber and secondary
exit.

Use the number of gates that fits the actual terminal layout; do not add
gates that create impossible traffic or trap ships.

### Sensors and detection

Each gate/chamber should track: - Approaching ship identity/faction and
authorization. - Approach direction, distance, speed, and approximate
ship bounding volume. - Whether the full ship, including wings and rear,
occupies the threshold. - Chamber occupancy and whether the next zone is
clear. - Other ships waiting to cross. - Door position, movement state,
obstruction, and sensor health. - Emergency state and backup power
status.

Use the existing collision/physics/entity systems where possible. Avoid
relying only on the ship's origin point; use a bounding volume or
equivalent full-ship clearance test.

### Gate state machine

Implement explicit, testable states such as:

`CLOSED → DETECTING → AUTHORIZING → OPENING → OPEN → SHIP_CROSSING → CLEARANCE_CHECK → CLOSING → CLOSED`

Also support `BLOCKED`, `FAULT`, and `EMERGENCY_OVERRIDE` states.

Rules: 1. A valid approaching ship activates the detection zone. 2. The
controller checks authorization, gate health, chamber capacity, and the
next passage. 3. Warning lights/sounds indicate the gate is about to
open. 4. The gate opens and its collider moves or disables only in
accordance with the actual opening. 5. Keep it open while any part of an
authorized ship occupies the threshold or unsafe closing zone. 6. After
the full ship clears, wait a configurable safety delay and check the
entire closing zone again. 7. Close only if the chamber/threshold is
clear and no authorized ship is immediately crossing. 8. If another ship
approaches, reopen or hold open according to the state machine. 9. If an
obstruction is detected while closing, stop and reopen safely. 10. Never
close a door through a ship or leave a visible opening blocked by an
invisible collider.

### Dual-door airlock interlocks

Where a chamber has inner and outer doors: - Do not open both doors
simultaneously if that would violate the designed pressure/security or
traffic interlock. - Confirm the chamber state and next zone before
unlocking the next door. - Ensure the ship is fully inside and clear of
the previous door before operating the next. - If the player stops
inside the chamber, hold the safe door state and show clear
instructions. - Provide a documented recovery route if a sensor fails;
never permanently trap the player.

Because this is a fictional spacecraft game, any pressure-cycle effect
is a gameplay simulation. It must not remove ship control or cause
unavoidable damage.

### Convoy crossing

-   Track each authorized ship separately.
-   Keep the gate open until the entire assigned crossing group has
    cleared, or use safe staged crossing with a holding area.
-   Never close the gate between ships if the convoy's current crossing
    plan requires the gate to remain open.
-   Avoid overcrowding a chamber; queue ships when necessary.
-   If the lead ship passes but cargo/escort ships remain, keep the
    route and mission state active.
-   Do not count a convoy ship as having passed until its full bounding
    volume clears the threshold.

### Route and collision integration

-   Route planner must recognize a closed gate as a blocked edge.
-   A blocked edge should cause a safe wait, a valid alternative route,
    or a clear player instruction.
-   Opening/closing updates route availability and collision at the same
    time.
-   If a gate fails, retain a safe route state or enable an explicit
    emergency override.
-   Route recalculation must preserve campaign distance, checkpoint
    identity, and mission objectives.
-   Do not teleport the ship through a closed gate as a workaround.

### Emergency override

Support backup power, warning alarms, manual override panels, sensor
fault indicators, and a safe manual/emergency opening. An override must
still prevent the door from closing through a ship. Parking locks should
remain engaged until a safe release is authorized. Emergency mode must
not activate accidentally during ordinary parking.

### Visual and audio feedback

Use clear red/amber/green status lights, direction arrows, chamber
occupancy indicators, sensor scan effects, opening/closing warnings, and
distinct sounds for detection, authorization, obstruction, fault, and
clearance. Avoid relying on color alone: include text/icon cues for
accessibility.

### Gate testing

Test: - Ship approaches a closed gate. - Authorized ship opens and
crosses. - Ship stops halfway through. - A second ship approaches during
closing. - Full-size wings or tail remain in the threshold. - Convoy
passes in a staged group. - Chamber is occupied when the inner door is
requested. - Sensor is blocked or faulty. - Gate loses power
mid-cycle. - Emergency override is used. - Route planner encounters a
closed/failed gate. - Gate opens and closes repeatedly without collider
desynchronization.

All tests must verify the door's visual position, collision, route
state, and ship clearance together.

------------------------------------------------------------------------

## 11. Parking emergency escape sequence

Create a separate, physically navigable escape route from basement
parking to a secondary exit or safe roof opening.

Include backup power and lighting, manual override panels, blocked-gate
detection, backup doors, secondary hangar exits, emergency roof opening
where appropriate, parking-lock release with safety checks, and
full-ship camera/touch controls.

Sequence: 1. Detect or explicitly trigger an emergency. 2. Show alarms
and identify the blocked/unsafe route. 3. Activate backup power, doors,
and guidance lights. 4. Keep parking locks engaged until a valid safe
release. 5. Let the player release locks and maneuver manually. 6. Guide
the ship through the basement escape corridor. 7. Pass through
sensor-controlled gates using the emergency-safe gate rules. 8. Exit
through the secondary gate or designated roof opening. 9. Confirm escape
only after the full ship clears the exit.

Do not activate the emergency automatically during normal parking. Keep
the ship controllable and ensure the path has no unavoidable collision
geometry.

------------------------------------------------------------------------

## 12. Camera, movement, collision, and physics

Reuse the existing flight controller and physics architecture. Make
turning, reverse movement, braking, and low-speed precision usable for
terminal navigation. Keep the player ship visible in third-person where
possible, prevent camera clipping, and allow camera changes without
resetting motion.

Keep collision bodies aligned with visible structures, roof panels,
gates, platforms, ships, and parking bays. Avoid sudden physics changes
during route updates and do not create a second conflicting movement
system. Recover controls correctly after pause, emergency sequences,
respawn, and scene transitions.

------------------------------------------------------------------------

## 13. Distance, checkpoints, save/load, and progression

-   Exactly 25 regions × 2,000 km = 50,000 km.
-   The terminal parking sequence remains inside Region 25 and does not
    advance beyond 50,000 km.
-   Branches reconnect without duplicated distance or skipped mandatory
    objectives.
-   Cutscenes and UI transitions do not advance route distance.
-   Streaming must not create gaps or duplicate route segments.
-   Route recalculation preserves checkpoint identity and mission state.
-   Save/load restores valid route geometry, convoy status, region,
    checkpoint, gate state where needed, terminal state, and parking
    assignment.
-   Avoid duplicate rewards or repeated completion after reload.

------------------------------------------------------------------------

## 14. Performance and stability

Support Android and desktop: - Instance repeated structures and
debris. - Pool recurring projectiles and effects where appropriate. -
Use LOD, frustum/distance culling, and environment streaming. - Dispose
of obsolete geometries, materials, listeners, and temporary objects. -
Keep gameplay-critical collision and route information available when
visual detail is reduced. - Avoid unbounded particle effects and
excessive draw calls. - Keep sensor checks efficient; avoid costly
full-world scans every frame when localized triggers or spatial queries
are available. - Prevent route gaps while regions stream.

------------------------------------------------------------------------

## 15. Required implementation workflow

1.  Inspect the repository and identify real files/systems.
2.  Map the current menu, modes, route data, movement, physics,
    collision, camera, AI, mission logic, sensor/trigger systems,
    save/load, and build commands.
3.  Plan the smallest safe set of changes.
4.  Add the menu entry and independent mode lifecycle.
5.  Implement SAVIOUR and HUNTERS using existing systems.
6.  Add the 25-region campaign and unique authored environments.
7.  Implement structure-aware route validation and updates.
8.  Rebuild the Guardian Space Terminal and connect its approach,
    atrium, parking, and emergency routes.
9.  Integrate sensor-controlled chamber gates with collision, convoy
    crossing, route planning, parking, and emergency override.
10. Integrate HUD, radar, mobile controls, audio, mission status, and
    parking validation.
11. Run the actual project build, available tests, and targeted gameplay
    checks.
12. Fix regressions and verify unrelated modes still launch.
13. Return a change summary, modified file list, honest build/test
    results, known limitations, and a modified source ZIP only if it was
    actually created and verified.

Do not claim a test passed unless it was run. Do not claim the
repository or source ZIP was modified unless it actually was.

------------------------------------------------------------------------

## 16. Acceptance checklist

### Modes

-   [ ] Convoy Guardian appears in the main menu.
-   [ ] SAVIOUR and HUNTERS launch and reset independently.
-   [ ] SAVIOUR does not immediately lose on launch.
-   [ ] Hunter AI targets the correct hostile faction.
-   [ ] Cleanup removes listeners, projectiles, temporary AI, and
    mode-owned resources.
-   [ ] Protected and unrelated modes remain intact.

### Campaign and route

-   [ ] Exactly 25 regions, each exactly 2,000 km; exactly 50,000 km
    total.
-   [ ] Regions have distinct geometry and gameplay.
-   [ ] Shape changes update routes, openings, collision, navigation,
    and checkpoints.
-   [ ] No route crosses solid geometry.
-   [ ] Branches reconnect without duplicate distance.
-   [ ] Nine-ship convoy can navigate constrained passages fairly.
-   [ ] Major combat corridor is approximately 25,000--35,000 km.

### Terminal and gates

-   [ ] Octagonal exterior, circular atrium, upper canopy, concentric
    parking rings, and lower hangar are implemented.
-   [ ] Ship can physically enter and navigate the terminal.
-   [ ] Roof panels and gates update their colliders correctly.
-   [ ] Sensors detect the full ship, not just its origin.
-   [ ] Gates open only after authorization and safety checks.
-   [ ] Gates remain open while the threshold is occupied.
-   [ ] Gates close only after full-ship clearance and a fresh safety
    check.
-   [ ] Dual-door interlocks prevent unsafe simultaneous opening.
-   [ ] Convoy ships pass without doors closing between required
    crossing ships.
-   [ ] Blocked/faulted gates produce a safe hold, alternate route, or
    emergency override.
-   [ ] Route planner never directs a ship through a closed gate.
-   [ ] Parking allocation prevents bay overlap.
-   [ ] Manual docking validates position, orientation, speed,
    clearance, occupancy, and authorization.
-   [ ] Parking clamps activate only after docking validation.
-   [ ] Basement emergency escape is physically navigable and uses safe
    gate logic.
-   [ ] Campaign completion requires mandatory objectives and valid
    parking.

### Stability

-   [ ] Desktop and mobile controls remain responsive.
-   [ ] No duplicate listeners, stale projectiles, orphaned AI, or
    cross-mode state.
-   [ ] Save/load, checkpoints, and route distance remain valid.
-   [ ] No route gaps, duplicated distance, or collision
    desynchronization.
-   [ ] Actual build/test results are reported honestly.

## Final directive

Implement Convoy Guardian as a fully integrated addition to the existing
VOID-RIDER 3D repository. Treat structures, navigable space, route data,
collision, sensor-controlled chamber gates, convoy pathfinding,
checkpoints, parking, and emergency escape as connected systems.

When a terminal or route-defining structure changes shape, update the
affected route and all related entrances, exits, collision, navigation,
and convoy behavior. Sensor gates must physically detect ships, open and
close safely, obey chamber interlocks, handle convoy passage, and
recover from blocked or failed states.

The final game must provide two separate playable modes---SAVIOUR and
HUNTERS---a richly designed 25-region, 50,000 km campaign, and a
redesigned Guardian Space Terminal ending in manual physical parking,
with working sensor-controlled chamber gates and a functional emergency
escape route.
