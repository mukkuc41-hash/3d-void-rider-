# VOID-RIDER 3D — CONVOY GUARDIAN
# FINAL MASTER IMPLEMENTATION PROMPT
## 50,000 km Campaign • Distinct Worlds • Physical Structures • Hazards • Objectives • Parking Dome Finale

**Critical final-sequence requirement:** The campaign MUST end with the convoy arriving at and parking inside the Parking Dome. The Parking Dome is the final playable sequence and final destination—not an early/mid-route stop and not followed by another route sector. All route expansion, encounters, and objectives must lead toward this final parking/arrival sequence.

This document directs implementation in the EXISTING VOID-RIDER 3D source repository. It is not a replacement demo or a claim that code has already been changed. Inspect the real source, implement in its existing architecture, run available checks, package the modified project, and report honestly.

## 1. Inspect and protect the existing project

Inspect package scripts, actual route and mission registries, Convoy Guardian Saviour/Hunter systems, convoy registration/spawning, AI target selection, weapons/damage, environment builders, collision/physics, route distance, HUD, input controls, audio, Parking Dome, camera, checkpoint, save/load, and cleanup.

- Preserve the existing Three.js/WebGL + TypeScript/JavaScript + HTML/CSS + Web Audio stack. Do not migrate to another engine.
- Preserve existing controls, ships, weapons, menu flow, working missions, and saves unless a verified defect requires a focused change.
- Protect Mode 01 and Mode 21 and their black-hole-specific systems. Do not reuse those mechanics in Convoy Guardian.
- Reuse existing systems when available; avoid duplicate managers and parallel route registries.
- Do not merely change a HUD number, create a scenery-only corridor, or substitute a prompt for actual source changes.
- Keep Saviour and Hunter as distinct variants with consistent team rules.

Before editing, make a short file-level plan based on actual source files.

## 2. Campaign target and final destination

Expand the actual playable Convoy Guardian route to **50,000 km** using the existing distance representation and coordinate convention. The route must be physically traversable and connected, not just a displayed number.

**Final destination: Parking Dome.** Place the Parking Dome at the route's final endpoint and make it the campaign's last playable sequence. If the existing Parking Dome currently occurs earlier, preserve its assets and core mechanics, but refactor its route integration so the finale uses the Dome without creating duplicate/conflicting instances or deleting useful work. Earlier route checkpoints must lead into the final approach. After the final parking objective succeeds, transition to a campaign-complete results/epilogue screen—no additional driving sector after parking.

Campaign requirements:
- Keep the existing working sectors and extend/retune the route to the real 50,000 km endpoint.
- Add connected sectors, checkpoints, landmarks, encounters, optional detours, rescue missions, and recoverable alternate paths.
- Use sector ranges as planning guidance only; reconcile against actual route data.
- Ensure the largest transport and escort formation fit through every intended opening.
- Preserve route distance across checkpoints, branches, respawns and save/load.
- No teleporting, duplicate sector triggers, instant completion or invalid dead ends.
- Every route branch must reconnect or have an explicit valid result.
- Verify the actual route start-to-end distance and final arrival at the Parking Dome.

## 3. Sector plan for the expanded route

Each sector needs distinct silhouettes, architecture, lighting, palette, atmosphere, audio, landmarks, objective loop, hazards and meaningful navigation. No generic recolours, meaningless cubes, empty black stretches or decorative clutter without purpose.

### Sector A — Titan Shipyard
**Look:** colossal orbital construction yard, ship skeletons, dry docks, gantries, magnetic cargo rails, cranes, repair platforms, suspended containers, work pods and industrial lights. Steel, industrial white, amber work lights.
**Objectives:** escort transports through an assembly lane; protect a repair drone; reconnect a bridge; disable a hostile relay; collect optional salvage.
**Hazards:** sweeping cranes, moving containers, welding arcs, plasma cutters and falling debris after a visible warning.
**Counterplay:** wait for a safe timing window, take a marked bypass, disable machinery, or use cover. Convoy AI slows/reforms rather than blindly colliding.

### Sector B — Broken Megabridge
**Structures:** enormous bridge between orbital habitats, segmented roadway, support pylons, cables, service gantries, repair pads and warning beacons.
**Objectives:** escort convoy in timed groups, activate bridge segments, protect repair drones, maintain power conduit, choose a narrow fast route or wider safe detour.
**Hazards:** retracting/rotating segments, exposed gaps, cable snaps, debris sweeps and energy surges. Warn before changes. Heavy transports must never require an impossible jump.

### Sector C — Magnetic Transit Corridor
**Structures:** huge magnetic rings, directional energy rails, stabilizer towers, relay pylons, guide lights and branching channels.
**Objectives:** align relays, stabilize a safe route, defend the convoy, choose fast unstable rail or slower shielded channel.
**Hazards:** directional pulses, rail outages, magnetic interference, moving rings. Effects must be readable/reversible; never remove all control. HUD shows rail direction and upcoming hazard.

### Sector D — Rotating Habitat City
**Structures:** rotating habitat ring, city blocks, towers, transit tunnels, docking arms, illuminated gardens, industrial districts and central hub. Warm city lights, green habitat zones, blue exterior.
**Objectives:** escort a medical transport, evacuate a district, disable hostile drone nest without harming protected structures, reach a docking hub for repair/resupply.
**Hazards:** rotating platforms, shutters, crossing service traffic, drones, exterior debris. Clearly show rotation direction/timing and protect civilian structures.

### Sector E — Quarantine Fortress
**Structures:** layered blast doors, scanner towers, turrets, inspection bays, shield pylons, cargo lanes and command tower. Gunmetal, searchlight white, red lockdown indicators.
**Objectives:** inspect cargo, identify compromised transport, defend inspection stop, disable hostile controls in sequence, open safe passage.
**Hazards:** scanning beams that reveal/mark, telegraphed turrets, lockdown doors, drones, missiles and shield walls. Counterplay via evasion, cover, source destruction or bypass.

### Sector F — Graveyard of Giants
**Structures:** colossal derelict ships, broken carriers, hollow cargo vessels, wrecked stations, engine bells, exposed decks and drifting debris. Rust, muted gold, faded blue.
**Objectives:** find survivors, tow disabled ship, salvage modules, choose interior/exterior route, defend rescue vessel, optionally recover data core affecting ending.
**Hazards:** unstable wreckage, spinning engines, debris clouds, residual energy arcs and ambushes. Collision must match visible geometry; salvage/rescue persists through checkpoints.

### Sector G — Solar Relay Garden (optional)
**Structures:** giant mirrors, solar collectors, power towers, relay pylons and maintenance platforms.
**Objectives:** redirect power, protect engineers/repair drones, choose shadowed safe passage or exposed fast passage.
**Hazards:** moving mirrors, energy beams with warnings, overheating zones. The branch must reconnect to the main route.

### Sector H — Abandoned Refinery (optional)
**Structures:** pressure pipes, coolant tanks, rotating service arms, industrial bridges and pressure doors.
**Objectives:** shut down a leak, restore a pressure gate, escort a supply transport.
**Hazards:** coolant spray, rotating pipes, pressure bursts and short-lived electrical arcs. Provide warning, safe zones and alternate paths.

### Sector I — Storm-Shield Causeway (optional)
**Structures:** shield emitters, anchor towers, storm barriers, service pylons and route beacons.
**Objectives:** activate shield emitters in sequence and lead the convoy through safe windows.
**Hazards:** charged debris, shield outages and pulse cycles. Player control remains available and safe timing is readable.

### Sector J — Final Approach to the Parking Dome
This is a transition sector, not the ending itself. It leads directly to the Parking Dome with no new sector after it.
**Structures:** approach beacons, navigation lights, outer traffic-control pylons, docking/parking guidance markers, convoy staging area, dome silhouette visible in the distance.
**Objectives:** regroup convoy, confirm transport count, clear the arrival lane, respond to a final small ambush or debris obstacle, then receive parking clearance.
**Hazards:** controlled approach traffic, disabled navigation beacons, debris in marked lanes. Do not introduce a final unfair boss or route blocker.
**Transition:** the convoy enters the Parking Dome through a real opening and proceeds to the final parking sequence.

## 4. FINAL SEQUENCE — PARKING DOME ARRIVAL AND PARKING

The final mission is **“FINAL ARRIVAL: PARKING DOME”**. It must feel like a deliberate, physical ending to the entire 50,000 km campaign.

### 4.1 Arrival exterior
- Show the dome as a large, recognizable structure with visible geodesic/reinforced transparent roof, structural ribs, lighting, landing/parking bays and service buildings.
- Approach lights guide the convoy into the correct entrance.
- Provide a brief cinematic camera shot if the existing game supports it, but immediately return control for playable docking. Do not replace the whole finale with a cutscene.
- Confirm the route distance reaches 50,000 km through actual progress state.
- Show a clear “FINAL DESTINATION — PARKING DOME” objective and convoy arrival status.

### 4.2 Entry and traffic management
- Open the correct entrance gate using the real gate state and collision state.
- Ensure the gate is visibly open before the player/transport crosses.
- Use traffic-control lights and floor/structure markings to direct each transport to a valid bay.
- The player can steer freely through the entrance and parking area.
- Convoy transports follow safe paths and never spawn directly inside occupied bays.
- Use a holding/staging area if multiple ships need to enter in sequence.

### 4.3 Multi-level parking complex
Build or finish the actual physical structure with:
- Main parking deck, basement parking levels, ramps, pillars, service corridors, docking bays, maintenance lifts and visible bay numbers.
- Parking clamps/locks, charge pads and maintenance stations.
- Emergency lighting, signs, route arrows, transparent dome panels, structural ribs and visible exterior surroundings.
- A designated player parking bay and clearly marked convoy transport bays.
- Optional side bays for rescued/bonus transports.
- A real route from entrance to bays; no teleporting the player into a parking slot.

### 4.4 Final playable objectives
Required sequence:
1. **Arrival clearance:** reach the dome entrance with the surviving convoy.
2. **Enter the dome:** pass the actual gate and follow visible guidance markers.
3. **Park the player ship:** maneuver into the designated bay using normal flight controls.
4. **Secure the convoy:** surviving transports enter their designated bays or staging slots.
5. **Engage parking locks:** player uses contextual interaction when aligned and stationary; show lock animation and state.
6. **Final system check:** verify player parked, convoy arrivals complete, and required mission flags are valid.
7. **Campaign completion:** display route distance, mission performance, transports saved/lost, optional objectives, salvage, rescued survivors and ending.
8. **Epilogue:** optional brief camera view showing the parked fleet inside the illuminated dome, then results/menu. No further route driving after this point.

Parking must be genuinely playable. Do not auto-complete the final objective just because the ship enters the dome. If precision parking is too difficult on mobile, offer a clearly optional assisted-parking mode that guides alignment without teleporting or bypassing the objective.

### 4.5 Parking validation and failure recovery
- Require ship within bay alignment/position tolerance, low speed, and correct orientation before lock can engage.
- Show distance/alignment indicators and a clear “Move into bay / Stop / Engage locks” instruction.
- If a ship overshoots, allow it to maneuver back out and retry.
- Parking locks must not activate while moving or outside the bay.
- Do not trap the player behind a closed gate before the objective is complete.
- If a convoy transport is damaged or missing, the ending reflects actual campaign outcome; the player can still finish if mission rules allow.
- If the player becomes stuck, offer a safe reposition/retry or checkpoint recovery without corrupting campaign progress.
- Save the final parked state and prevent rewards/results from being granted more than once.

### 4.6 Final cinematic/audio/UI
- Arrival lighting transitions from exterior route lighting to warm, calm dome lighting.
- Add docking guidance beeps, gate hydraulics, parking clamp sounds, engine shutdown and convoy arrival acknowledgements.
- Gradually reduce combat music and transition to a calm completion theme.
- Final HUD shows “50,000 km COMPLETED”, “PARKING DOME SECURED”, convoy survival summary and optional-objective results only after the state is truly complete.
- Provide Skip Cinematic if a short cinematic exists; never skip required playable parking.
- Ensure final UI is readable on mobile and does not overlap the control inputs during docking.

## 5. Reusable systems

Inspect and reuse existing equivalents before creating new modules:
- Moving machinery: cranes, lifts, rotating platforms, cargo rails, doors and bridge sections.
- Gate controller: sensor/power state, animation, obstruction checks, emergency override.
- Hazard lifecycle: warning → active → cooldown → safe reset.
- Route event director: sector/checkpoint triggers and duplicate-event prevention.
- Objective tracker: required/optional objectives, progress, fail conditions and rewards.
- Recovery director: safe respawn, transport recovery, softlock detection and checkpoint restore.
- Sector streaming/dressing: landmarks, lighting, particles, signage, audio zones, LOD and bounded physics.
- Route branch manager: branch warning, route links, risk/reward and reconnect.
- Parking manager: bay assignment, alignment, low-speed validation, locks, convoy parking and final-state save.
- Campaign completion manager: validates all required final states and grants results/rewards once.
- Accessibility: hazard warning duration, camera shake, HUD scale, sensitivity, aim assist and reduced effects.

Prefer composable modules consistent with the existing codebase. Do not add a duplicate manager if the project already has the system.

## 6. Saviour and Hunter combat correctness

### Saviour
- Protect registered transports, medical ships, repair units and command vessel.
- Allies prioritize threats attacking protected assets.
- Formation adapts to route width, hazards and transport speed.
- Damaged ships request aid; repair/tow/recovery where appropriate.
- Mission loss checks use real registered transport count and correct rules.
- Never instantly fail while spawning/initializing; never show false `0/0` transport count.

### Hunter
- Intercept enemy transports and protect Hunter objectives.
- Friendly Hunter ships/drones must not target/damage the player or allied Hunter assets unless an explicit friendly-fire mode is deliberately enabled.
- Apply team filtering to AI weapons, player weapons, drones, missiles, area damage, collision damage and scripted damage.
- Do not disable all combat as a workaround; enemies must still attack valid enemies.

### Both
- Accurate health, shields, cargo integrity, convoy count, timer, distance and objective markers.
- Clear mission state transitions and temporary spawn protection only.
- Rescue, repair, supply, interception, defence and salvage objectives with meaningful consequences.
- Optional objectives never accidentally block the main route unless explicitly marked required.

## 7. Physics, collision and route readability

- Visible surfaces and collision surfaces align.
- Moving objects update transforms and collision bounds correctly.
- Use continuous/swept collision where supported for fast ships and hazards.
- Visually open gates must be physically passable; no invisible blockers across openings.
- Ensure the player ship, full wings and largest transports fit through the geometry.
- Lifts, ramps and moving bridges must carry or safely release ships.
- No closing door may permanently trap the player or convoy.
- Hazards telegraph and provide counterplay.
- Main route is visually clear; alternate routes have visible entry and exit markers.
- Reset/respawn restores machinery, hazards, objectives, convoy and checkpoint state coherently.

## 8. Art, atmosphere, and structural details

Use sector-specific silhouettes and purposeful detail:
- Shipyard: cranes, gantries, ship frames, suspended cargo, work lights.
- Bridge: cables, pylons, service rails, broken sections, repair stations.
- Magnetic corridor: ring supports, relay towers, rail lights and control pylons.
- Habitat: city towers, windows, gardens, transit lanes, docks and rotation markers.
- Fortress: armour plating, scan arrays, shield pylons, inspection bays and turrets.
- Graveyard: broken hulls, exposed decks, engine bells, salvage lights and debris.
- Optional sectors: mirrors, coolant pipes, storm shields and hazard-control stations.
- Parking Dome: transparent dome, ribs, bay markings, basement levels, ramps, pillars, lifts, parking clamps, emergency signage and service rooms.

Add fog, particles, sparks, steam, light shafts and engine trails selectively. Avoid excessive bloom, particle spam, generic recolours and scenery that obscures the playable route. Use instancing/shared materials and LOD where practical.

## 9. HUD, controls, sound, mobile performance

HUD must show sector/distance, checkpoint, next landmark, branch risk, objectives, convoy integrity/count, threat direction, hazard countdowns, gate/bridge progress, repairs/rescues, and final parking alignment/lock state.

Preserve existing keyboard/controller/mobile controls. Use contextual interactions for panels and parking locks. Keep touch controls reachable and avoid impractical simultaneous taps. Offer optional assisted parking, sensitivity and HUD-scale settings where supported.

Add sector ambience and mechanical audio, distinct warnings, objective success/failure cues, docking beeps and engine shutdown. Respect volume settings and avoid stacking duplicate audio events.

For performance, use shared geometry/materials, instancing, pooling, LOD, culling and sector streaming where appropriate. Limit distant physics objects; dispose geometry/materials/textures/audio/listeners on unload. Prevent duplicate event handlers and event spawns on rerender. Provide reduced effects for lower-end Android devices without breaking collision/objectives.

## 10. Save/load and recovery

Persist appropriate campaign state: route distance/sector, checkpoints, objective completion, route choices, salvage/upgrades, rescued survivors, convoy outcomes and intended structure state. Version saves, handle missing/malformed data safely, restore player/convoy/camera/route/objectives together, and prevent duplicate rewards. Do not serialize live Three.js objects as persistent data.

The final parked state must persist. Reloading after completion must show the completion/results state rather than restarting the final parking objective unexpectedly, while still offering replay/restart if the game's existing design supports it.

## 11. Mandatory implementation sequence

1. Inspect the real repository and write a file-level plan.
2. Fix verified mission initialization, transport registration, false instant defeat and team-targeting bugs first.
3. Inspect current route distances and map before extending/retuning to 50,000 km.
4. Implement connected sectors incrementally, testing geometry and objective flow.
5. Build/finish the Parking Dome as the **last campaign destination**, not a mid-route stop.
6. Implement the playable final arrival, docking, parking-lock and convoy-parking sequence.
7. Validate completion conditions and one-time rewards.
8. Run available typecheck/build/lint/tests and fix regressions.
9. Test Saviour and Hunter, route transitions, collision, checkpoints, gates, free movement in/out of Dome, parking alignment, save/load and final completion.
10. If any checks cannot run, state so explicitly. Never claim unrun tests passed.

## 12. Required regression tests

- Saviour never instantly fails during spawn/initialization; transport count is accurate.
- Hunter allies never attack friendly targets through any damage path; enemies still attack valid enemies.
- Route progresses from real start to 50,000 km and the final destination is the Parking Dome.
- No extra route sector starts after the final parking sequence.
- Every sector is connected; route branches reconnect or resolve validly.
- Player and largest transport fit all intended openings.
- Moving structure collision matches visible transform.
- Parking locks release; sensor gates open/close; obstruction checks prevent trapping.
- Player freely moves inside and outside Parking Dome.
- Camera frames entire ship in Dome and during docking.
- Player must align, slow/stop, and engage parking locks to complete.
- Convoy ships reach valid bays/staging slots and do not spawn inside occupied bays.
- Overshooting a bay permits a retry; softlock recovery works.
- Checkpoints and save/load restore route, convoy, objectives and hazard states.
- Optional objectives do not unexpectedly block the ending.
- Campaign results reflect actual convoy survival and objective state.
- Completion/rewards trigger exactly once.
- Mobile controls and performance remain usable.
- Repeated sector loads do not duplicate listeners, hazards, or audio.

## 13. Required deliverables

1. Updated source files in the existing project.
2. A ZIP whose project contents are at the archive root (not inside an accidental extra parent directory); exclude `node_modules` and generated caches.
3. A changelog naming files and behaviours actually changed.
4. Exact build/test commands with pass/fail results.
5. Known limitations and unfinished features.
6. If the full expansion cannot fit in one pass, finish core reliability fixes plus one fully playable sector and the final Parking Dome flow before claiming completion. Do not deliver only a prompt while claiming the source is implemented.

## FINAL DIRECTIVE

Implement a cohesive Convoy Guardian campaign with unique environments, physical structures, meaningful objectives, dangers, hazards, hurdles, rescue events, enemy encounters, route branches and progression. Preserve existing project systems and protected modes. Expand the real route to 50,000 km. **End the campaign with the player physically entering the Parking Dome, parking the ship, securing the convoy, engaging the parking locks, and receiving the final completion sequence. The Parking Dome parking is the final playable objective.** Implement against actual source files, test what can be tested, package the project, and report truthfully.
