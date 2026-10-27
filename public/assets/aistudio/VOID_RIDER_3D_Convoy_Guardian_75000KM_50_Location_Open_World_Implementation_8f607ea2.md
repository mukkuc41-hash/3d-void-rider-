# VOID-RIDER 3D — CONVOY GUARDIAN OPEN-WORLD EXPANSION
## 75,000 km · 50 locations · two physical parking domes · free-roam return journey
### Implementation specification for the existing Google AI Studio / Three.js repository

## Core objective

Remake Convoy Guardian as a continuous, freely traversable open-world campaign. The player starts in the **Origin Parking Dome**, physically releases ships from one shared launch bay, passes through sensor-operated gates, explores 50 distinct locations across a 75,000 km route, encounters hazards and dangers, can fight a boss at designated encounter points, arrives at the **Celestial Crown Parking Terminal**, and may then turn around and fly back along the same connected route to the Origin Parking Dome.

This is an implementation task inside the uploaded repository. Do not deliver only a demo, decorative scene, distance counter, region list, or cinematic. Inspect and modify the real existing systems.

## Non-negotiable integration rules

1. Inspect the current repository before editing. Trace `convoyEnvironment.ts`, `convoyCampaignRegions.ts`, `convoyDirector.ts`, `convoyBossDirector.ts`, convoy ship controllers, mission state, HUD, collision, controls, pause/reset, and persistence.
2. Preserve SAVIOUR and HUNTERS as independent modes. Keep their existing formations, objectives, combat, ship health, weapons, and win/fail rules unless a change is required to support this open-world sequence.
3. Preserve all unrelated VOID-RIDER modes. Do not change Black Hole Mode, Final Collapse, Mode 01, Mode 21, or other menus.
4. No teleporting between domes, no automatic parking, no progress counter pretending to be physical travel, no cinematic-only victory.
5. The route, gates, locations, docking bays, hazards, boss encounter volumes, and return journey must use actual Three.js scene coordinates and collision/trigger logic.
6. Do not claim tests passed unless they were run. Deliver a separate updated ZIP and a report listing changed files, tests run, and known limitations.

## Required full journey

1. **Origin Parking Dome:** all active ships begin parked in one shared origin hangar/launch area, with visible bays, floor markings, service gantries, ship silhouettes, lights, and docking clamps. Keep the player's ship and the mode's actual fleet visible.
2. **Preflight:** terminal lights wake in sequence; ship status is checked; engine lights activate; launch clearance is shown in the HUD.
3. **Sensor gate sequence:** sensor pylons detect an authorized ship, gate leaves unlock and slide open, the ship physically crosses the doorway, the gate remains open while any convoy member occupies its safety volume, then closes safely after the group clears.
4. **Physical departure:** clamps release, ships leave the origin bay under player/AI control, pass through a real corridor and exterior gate, and join the active formation. No snapping ships to route coordinates.
5. **Open-world journey:** a continuous connected route of 75,000 km with 50 distinct locations. Each location has its own landmark silhouette, structures, environment palette, lighting, route features, hazards, and dangers. Stream route chunks and environment detail around the player's actual position.
6. **Exploration:** the player can steer, brake, boost, ascend/descend, leave the guide lane where safe, inspect nearby structures, enter supported open spaces, and return to the route. The HUD route guidance is helpful, not a rail that forcibly moves the player.
7. **Boss encounters:** bosses can be encountered at multiple designated points or through optional exploration triggers. Bosses use the existing real combat/health/projectile systems, telegraph attacks, have phases, and do not spawn every frame or instantly teleport onto the player. The player may retreat and return to a still-active encounter if the existing design permits.
8. **Celestial Crown arrival:** the second dome is the terminal destination, visually identifiable from a distance. Arrival sensors, gates, canopy panels, lighting and docking bays react to the approaching fleet.
9. **Physical parking:** each required ship travels into its own assigned bay, aligns within tolerances, reaches safe speed, and engages clamps. Never teleport it into a berth. Keep the chamber free-roam capable.
10. **Return trip:** after arrival/parking, the player can choose `RETURN TO ORIGIN` from the terminal control panel or simply turn around and fly back. Reopen gates and allow physical departure. Travel backward along the same connected route, reverse region order and route guidance, allow optional encounters/hazards to follow explicit re-entry rules, and return through the origin gates to the original parking dome. The game must not remain locked in a victory state that prevents movement. The player may also remain at the Crown and freely explore.
11. **Round trip:** preserve ship state and route direction across the return. Do not duplicate distance, reset campaign progress accidentally, or double-count one-way distance. Track one-way campaign distance separately from current position and round-trip travel distance.

## 50 locations across 75,000 km

Use 50 regions, each nominally 1,500 km, for a total of 75,000 km. Region names and kilometre boundaries must be generated from a single authoritative catalog; do not scatter different constants throughout the app. The region's location geometry and event triggers must correspond to actual route positions.

01. **Guardian Departure Dome** — 0–1,500 km. Structures/environment: Origin hangar, docking pylons, launch gantries. Hazards/dangers: Sensor airlock gates, release clamps, launch traffic.
02. **Neon Transit Spine** — 1,500–3,000 km. Structures/environment: Long illuminated orbital highway and kilometer-scale beacons. Hazards/dangers: Crossing traffic, moving barriers, lane splitters.
03. **Crimson Nebula** — 3,000–4,500 km. Structures/environment: Red ion clouds, gas pillars, floating refinery towers. Hazards/dangers: Sensor jamming, plasma pockets, low visibility.
04. **Shattered Asteroid Belt** — 4,500–6,000 km. Structures/environment: Fractured rocks, mining rigs, rotating ore collectors. Hazards/dangers: Moving asteroids, tumbling debris, collapsing rig arms.
05. **Frozen Expanse** — 6,000–7,500 km. Structures/environment: Ice moon horizon, crystalline bridges, frozen comm towers. Hazards/dangers: Cryo shards, low-traction fields, brittle arches.
06. **Solar Furnace** — 7,500–9,000 km. Structures/environment: Solar collectors, heat shields, star-facing platforms. Hazards/dangers: Solar flares, thermal beams, overheating zones.
07. **Abandoned Megacity** — 9,000–10,500 km. Structures/environment: Ruined skyscrapers, skybridges, suspended transit rails. Hazards/dangers: Falling structures, security grids, collapsing bridges.
08. **Quantum Forest** — 10,500–12,000 km. Structures/environment: Bioluminescent crystal trees and living energy roots. Hazards/dangers: Sweeping branches, unstable portals, root pulses.
09. **Ion Storm Frontier** — 12,000–13,500 km. Structures/environment: Lightning curtains, storm towers, floating relay arrays. Hazards/dangers: EMP bursts, charged clouds, sensor blackout.
10. **The Broken Ring** — 13,500–15,000 km. Structures/environment: A shattered orbital ring with rotating fragments. Hazards/dangers: Ring debris, spinning sections, narrow gaps.
11. **Gravitational Canyon** — 15,000–16,500 km. Structures/environment: Deep spatial ravine, floating cliffs, gravity pylons. Hazards/dangers: Gravity shear, drifting boulders, sudden vector shifts.
12. **Ocean Planet Expanse** — 16,500–18,000 km. Structures/environment: Huge ocean planet, floating research platforms, water harvesters. Hazards/dangers: Tidal energy surges, pressure waves, platform debris.
13. **Bio-Mechanical Frontier** — 18,000–19,500 km. Structures/environment: Organic-mechanical towers, living alloy bridges. Hazards/dangers: Reactive tendrils, moving walls, corrosive spore clouds.
14. **Cargo Graveyard** — 19,500–21,000 km. Structures/environment: Derelict freighters, cargo stacks, salvage cranes. Hazards/dangers: Loose containers, crane swings, unstable wreckage.
15. **Volcanic Moon** — 21,000–22,500 km. Structures/environment: Lava-lit moon, basalt spires, magma processing stations. Hazards/dangers: Eruptive rock, thermal vents, molten debris.
16. **Mirror Dimension** — 22,500–24,000 km. Structures/environment: Reflective structures, mirrored route gates, prism towers. Hazards/dangers: False visual cues, mirror drones, refracted energy beams.
17. **The Warfront** — 24,000–25,500 km. Structures/environment: Battle-scarred stations, weapon platforms, wrecked fleets. Hazards/dangers: Crossfire, minefields, active turrets, debris volleys.
18. **Black Ice Corridor** — 25,500–27,000 km. Structures/environment: Dark frozen structures, ice tunnels, blue beacon pylons. Hazards/dangers: Ice collapse, frozen mines, reduced visibility.
19. **Machine Empire** — 27,000–28,500 km. Structures/environment: Industrial machine towers, assembly arms, robotic foundries. Hazards/dangers: Automated defense grids, moving pistons, fabrication drones.
20. **Crystal Nebula** — 28,500–30,000 km. Structures/environment: Huge crystal formations, refractive arches, glowing shards. Hazards/dangers: Crystal fractures, laser refraction, shard storms.
21. **Silent Expanse** — 30,000–31,500 km. Structures/environment: Sparse starfield, abandoned probes, distant listening arrays. Hazards/dangers: Stealth ambushes, sensor ghosts, drifting mines.
22. **Fortress Belt** — 31,500–33,000 km. Structures/environment: Armored fortresses, shield walls, heavy orbital turrets. Hazards/dangers: Crossfire corridors, shield pulses, interceptors.
23. **Quantum Rift** — 33,000–34,500 km. Structures/environment: Rift bridges, folded-space structures, unstable portals. Hazards/dangers: Spatial distortion, route displacement visuals, rift pulses.
24. **The Last Armada** — 34,500–36,000 km. Structures/environment: Capital ships, carrier docks, fleet-scale structures. Hazards/dangers: Fighter waves, artillery lanes, capital-ship debris.
25. **Guardian's Last Stand** — 36,000–37,500 km. Structures/environment: Damaged defense platforms, shield generators, rescue towers. Hazards/dangers: Siege weapons, collapsing shields, final ambush waves.
26. **Emerald Exoplanet** — 37,500–39,000 km. Structures/environment: Floating jungle islands, luminous vegetation, alien ruins. Hazards/dangers: Living vines, spore bursts, moving rock shelves.
27. **Aurora Foundry** — 39,000–40,500 km. Structures/environment: Magnetic factories, colored plasma furnaces, orbital cranes. Hazards/dangers: Magnetic pulls, plasma spills, crane collisions.
28. **Dust Giant Skirts** — 40,500–42,000 km. Structures/environment: Dust giant horizon, ring mines, floating gas harvesters. Hazards/dangers: Dust walls, charged grains, ring-rock impacts.
29. **Phantom Relay Network** — 42,000–43,500 km. Structures/environment: Ghostly comm towers, holographic bridges, relay clusters. Hazards/dangers: Signal decoys, beam traps, disappearing bridge sections.
30. **Tidal Moonworks** — 43,500–45,000 km. Structures/environment: Moon-scale tidal generators and rotating energy turbines. Hazards/dangers: Turbine arcs, pressure bursts, unstable generator fields.
31. **Obsidian Spires** — 45,000–46,500 km. Structures/environment: Black glass towers, volcanic glass arches, lava-lit platforms. Hazards/dangers: Shattering glass, sharp debris fields, thermal shock.
32. **Radiant Megastructure** — 46,500–48,000 km. Structures/environment: Enormous energy lattice, solar mirrors, light bridges. Hazards/dangers: Focused light beams, mirror misalignment, flare pulses.
33. **Graveyard of Titans** — 48,000–49,500 km. Structures/environment: Ancient capital-ship skeletons, colossal engines, hull canyons. Hazards/dangers: Falling hull plates, reactor leaks, moving wreckage.
34. **Nebula Reef** — 49,500–51,000 km. Structures/environment: Floating reef-like mineral formations and glowing gas streams. Hazards/dangers: Spore-like particles, hidden rock spikes, ion currents.
35. **Chrono Array** — 51,000–52,500 km. Structures/environment: Clockwork orbital rings, time-signal pylons, rotating platforms. Hazards/dangers: Pulsed barriers, timing gates, shifting hazard cycles.
36. **Magnetic Labyrinth** — 52,500–54,000 km. Structures/environment: Interlocking metal corridors, magnetic towers, rail networks. Hazards/dangers: Magnetic pulls, moving walls, rail crossings.
37. **The Drowned Station** — 54,000–55,500 km. Structures/environment: Flooded-looking holographic habitat, broken domes, water tanks. Hazards/dangers: Pressure bursts, broken panels, electrical arcs.
38. **Redshift Passage** — 55,500–57,000 km. Structures/environment: Long red-lit tunnels, folded arches, speed beacons. Hazards/dangers: High-speed debris, lane compression, unstable light gates.
39. **Citadel Approach** — 57,000–58,500 km. Structures/environment: Massive defense citadel, shield towers, ceremonial approach pylons. Hazards/dangers: Last defense turrets, shield pulses, interceptor screens.
40. **The Final Armada** — 58,500–60,000 km. Structures/environment: Allied fleet staging platforms and giant command carrier. Hazards/dangers: Combat debris, escort crossings, final hostile waves.
41. **Crown Beacon Reach** — 60,000–61,500 km. Structures/environment: Crown-shaped distant terminal beacon and navigation relays. Hazards/dangers: Beacon interference, debris streams, clearance checks.
42. **Celestial Crown Outer Ring** — 61,500–63,000 km. Structures/environment: Outer orbital rings, approach gantries, shield emitter towers. Hazards/dangers: Outer shield pulses, moving gate panels, traffic lanes.
43. **Crown Sensor Corridor** — 63,000–64,500 km. Structures/environment: Sensor towers, scan arches, holographic clearance markers. Hazards/dangers: Unauthorized drones, scan beams, gated route sections.
44. **Crown Shield Garden** — 64,500–66,000 km. Structures/environment: Transparent shield ribs, energy gardens, service bridges. Hazards/dangers: Shield maintenance drones, power surges, moving service arms.
45. **Crown Reactor Vista** — 66,000–67,500 km. Structures/environment: Central reactor visible through panoramic windows, ring structures. Hazards/dangers: Reactor vent pulses, magnetic maintenance fields.
46. **Crown Fleet Berths** — 67,500–69,000 km. Structures/environment: Nine-plus docking berths, gantries, cargo and repair structures. Hazards/dangers: Moving service arms, bay gates, docking traffic.
47. **Celestial Crown Inner Chamber** — 69,000–70,500 km. Structures/environment: Multi-level hangar, central core, catwalks and lifts. Hazards/dangers: Sensor gates, moving lifts, emergency bulkheads.
48. **Crown Service Quarter** — 70,500–72,000 km. Structures/environment: Repair drones, fuel towers, cargo lifts, maintenance tunnels. Hazards/dangers: Service traffic, rotating machinery, temporary closures.
49. **Crown Shield Lock** — 72,000–73,500 km. Structures/environment: Segmented canopy panels, giant mechanical ribs, shield controls. Hazards/dangers: Closing shield panels, safety sensors, airlock sequencing.
50. **Celestial Crown Parking Terminal** — 73,500–75,000 km. Structures/environment: Final sanctuary, crown rings, reactor core, secure fleet parking. Hazards/dangers: Precision docking, speed validation, clamps and final clearance.

## Physical world and route engineering

- Build a connected route spline or connected segment graph whose actual traversable geometry supports all 50 locations. No jump between segment endpoints; use endpoint position/tangent checks.
- Route distance must use a consistent conversion from world units to campaign kilometres. Do not derive 75,000 km solely by multiplying a short path's normalized progress while presenting the result as a physically expanded world.
- Stream route chunks with a configurable look-ahead and retention window. Keep enough sections loaded for the current speed and turning radius. Avoid loading the whole 75,000 km route at once.
- Each region must contain a recognizable, physically placed landmark cluster: towers, stations, arches, ring structures, platforms, ruins, crystals, ships, machinery or terrain silhouettes. Use the repository's assets where available and procedural Three.js geometry otherwise.
- Region transitions need visible beacons, boundary arches or environmental changes, but no blocking gate unless the route design explicitly calls for one.
- Add branches and optional exploration pockets where appropriate. Branches must reconnect or have a real return route; never trap the player in an unconnected decorative spur.
- Add collision and trigger volumes for actual hazards, docking bays, boss arenas, sensor gates and mission objectives. Keep decorative distant props non-blocking.
- Cleanup distant chunks and dispose geometries/materials/textures/listeners. Use instancing and pooling for repeated structures. Provide LOW/MEDIUM/HIGH/ULTRA quality levels for Android.

## Free-roam navigation and route tracking

- The player ship's world transform is authoritative. Route position must be determined from the player's actual position (nearest point on the connected route/segment graph, or explicit graph traversal), not a timer that automatically increments distance.
- Route progress must be reversible. When the player turns back, current route kilometre, region name, next waypoint, and navigation arrow must update in the reverse direction.
- Keep separate metrics: current route coordinate (0–75,000 km), maximum campaign distance reached, one-way mission completion state, and cumulative round-trip distance.
- Allow safe off-route exploration without forcing route progress forward. If the player leaves the route, show distance/bearing to the nearest route point and allow re-entry.
- Avoid progress snapping when crossing branch junctions. Persist active branch choice until the player reaches a valid merge or explicitly turns around.
- Convoy AI follows the selected route with collision avoidance and formation offsets. It must not teleport to the player. When a ship falls behind, it should use a catch-up speed cap and visible navigation guidance, not an instantaneous position snap.
- Provide `FREE ROAM`, `FOLLOW ROUTE`, `HOLD FORMATION`, and `RETURN TO ORIGIN` commands if compatible with the current fleet command UI. Follow-route assistance must remain optional.

## Origin and destination sensor gate system

Both domes need physical sensor gates, but the Origin Dome is the departure/return hub and the Celestial Crown is the destination sanctuary.

Each gate has a frame, moving leaves, sensor pylons, status lights, clearance volumes, collision synchronized to the leaves, and event-driven sound.

Gate state machine:
`SEALED -> DETECTED -> UNLOCKING -> OPENING -> OPEN -> CLEARANCE_WAIT -> CLOSING -> SEALED`
Safe states: `HELD_OPEN`, `LOCKED`, `FAULT`.

Rules:
- Only authorized ships trigger restricted gates.
- Open before a ship reaches the threshold.
- Keep open while any eligible ship occupies the doorway/safety volume.
- Never close through a ship; pause closing and reopen if needed.
- Close after the entire eligible convoy clears the safety volume and the configured delay elapses.
- Use hysteresis to avoid flicker.
- Pause/reset/mode switching must clear stale sensor occupancy and animation state.
- Status lights must match the true gate state: cyan standby, amber movement/blocked, green open/authorized, red sealed/locked/fault.
- Include emergency hold-open override for safety and debugging.

## Boss encounter system

- Use the existing `convoyBossDirector` and actual damage/projectile pipeline.
- Define a small number of major encounters across the 75,000 km route plus optional roaming/side encounters. Do not spawn a boss in every region by default.
- Each encounter has a real trigger volume, approach warning, boss health and phases, distinct attack patterns, safe telegraphs, win/retreat/return behaviour, and one-time/repeat rules.
- Boss fights can occur at a route location or at an optional side arena. If the player leaves, handle encounter state deliberately—do not spawn duplicates or silently declare victory.
- Preserve the HUNTERS mode's existing boss and six defensive drones. Do not replace its boss with the open-world encounter list or leak SAVIOUR objectives into HUNTERS.
- Boss defeats should affect actual campaign state, unlock route gates or rewards only when configured, and persist correctly.

## Hazard and danger variety

Across the 50 regions include: moving asteroid clusters, rotating debris, timed energy barriers, solar flares, plasma pockets, sensor jamming, EMP bursts, collapsing structures, falling hull panels, minefields, turrets, enemy interceptors, gravity shear, magnetic pulls, ice shards, crystal fractures, laser refraction, shield pulses, moving industrial machinery, hostile drones, debris crossfire, and repair/rescue opportunities.

Hazards must have varied telegraphs, timing and counterplay. Use real collision or proximity triggers; do not only decorate the route. Avoid unavoidable instant kills. Keep a fair warning window and mobile-friendly visual/audio cues.

## Terminal parking and return journey

- Celestial Crown is a huge, layered terminal with rotating crown rings, central reactor, transparent shield canopy, structural ribs, multiple levels, service gantries, repair drones, cargo lifts, nine or more dedicated bays, sensor-controlled chamber gates and moving docking clamps.
- Arrival gates open as the convoy approaches. The canopy and terminal lights activate in staged sequences.
- Each required ship physically crosses the entrance, enters its assigned bay, aligns within position/heading tolerance, slows below the docking speed limit, and then engages clamps.
- If a ship is misaligned or moving too fast, show guidance and allow retry. No teleportation, auto-parking, or cinematic-only success.
- After docking, allow the player to undock through a deliberate control prompt. Clamps retract, bay gate opens, shield gate authorizes departure, and the ship physically exits.
- The return path uses the same 50 regions in reverse. The original dome gates detect the returning ships, open safely, and let ships return to their original parking area. The player can park again or remain free-roaming.
- The Crown is not a one-way level-end that disables controls. Use an open-world state machine such as `ORIGIN_DOCKED`, `DEPARTURE_CLEARANCE`, `OUTBOUND_TRAVEL`, `BOSS_ENCOUNTER`, `CROWN_APPROACH`, `CROWN_DOCKING`, `CROWN_FREE_ROAM`, `RETURN_CLEARANCE`, `RETURN_TRAVEL`, `ORIGIN_APPROACH`, `ORIGIN_DOCKING`, and `OPEN_ROAM`.
- Make mode-specific mission completion independent from world traversal. A completed mission can unlock free-roam rather than shutting down the update loop.

## HUD and feedback

Display live:
- Current location name and number (1/50 through 50/50)
- Current route kilometre / 75,000 km
- Current travel direction (OUTBOUND / RETURN)
- Distance to next landmark and to nearest route re-entry point
- Active gate state and authorization
- Convoy formation, ship health and distance from player
- Boss health/phase when an encounter is active
- Hazard warning and route choice
- Destination/return docking guidance
- Current one-way completion, maximum progress, and round-trip distance as separate values

HUD data must come from the real route and gameplay state. Ensure Android touch controls and landscape/portrait layouts remain usable.

## Performance, cleanup and persistence

- Reuse Three.js geometries/materials and instance repeated props.
- Stream chunks in/out around the player's actual route coordinate.
- Cap active hazard/traffic counts; pool projectiles and particles.
- Avoid creating vectors, meshes, lights or materials in large quantities every frame.
- Dispose streamed objects and event listeners safely.
- Save current route coordinate, direction, selected branch, region, boss state, ship health, docking state and unlocked features. Validate save data and handle version upgrades.
- Pause/resume must stop world simulation consistently and resume without a coordinate jump.
- Do not break mobile audio unlock or mute settings.

## Implementation order

1. Inventory existing repository and report real files/architecture.
2. Replace the 25-region/50,000 km assumptions with a single authoritative 50-region/75,000 km catalog.
3. Build the connected streamed route and procedural region landmark clusters.
4. Add the Origin Parking Dome as a real departure and return hub with sensor gates.
5. Make route tracking derive from actual player position and support reverse travel.
6. Integrate open-world state machine and convoy AI without teleporting.
7. Add region hazards, branch pockets, boss triggers and encounter persistence.
8. Integrate Celestial Crown arrival, physical docking and undocking.
9. Add HUD, audio, lighting, performance tiers and persistence.
10. Run typecheck/lint/build, fix errors, and test route movement, reverse travel, gate safety, docking, bosses, pause/reset, and both SAVIOUR/HUNTERS modes.
11. Package the modified repository into a separate updated ZIP and report exact test results.

## Acceptance checklist

- [ ] Origin Dome is the real starting position and return destination.
- [ ] All ships start in one shared launch/parking area.
- [ ] Sensor gates open before arrival and never close through a ship.
- [ ] Ships physically depart through the origin gate.
- [ ] All 50 distinct locations exist along a connected 75,000 km route.
- [ ] Locations have unique structures, environment silhouettes, hazards and dangers.
- [ ] Distance follows actual player travel and is not timer-driven.
- [ ] Player can free-roam and leave/rejoin the route.
- [ ] Player can turn around and travel back to the Origin Dome.
- [ ] Celestial Crown is a real second dome, with visible gates and physical docking.
- [ ] Boss fights use real combat and have no duplicate-spawn bug.
- [ ] Mission state does not disable free-roam after terminal arrival.
- [ ] SAVIOUR and HUNTERS still work independently.
- [ ] Other modes remain unchanged.
- [ ] No teleporting, fake distance, fake gates or cinematic-only docking.
- [ ] Build and tests are reported truthfully.

**Final instruction:** Implement these features in the uploaded existing repository. Do not stop after creating this plan. If any requirement cannot be completed in the current pass, clearly identify it in the final report rather than claiming it is implemented.

## Region catalog (quick reference)

- **01. Guardian Departure Dome** — 0–1,500 km.
- **02. Neon Transit Spine** — 1,500–3,000 km.
- **03. Crimson Nebula** — 3,000–4,500 km.
- **04. Shattered Asteroid Belt** — 4,500–6,000 km.
- **05. Frozen Expanse** — 6,000–7,500 km.
- **06. Solar Furnace** — 7,500–9,000 km.
- **07. Abandoned Megacity** — 9,000–10,500 km.
- **08. Quantum Forest** — 10,500–12,000 km.
- **09. Ion Storm Frontier** — 12,000–13,500 km.
- **10. The Broken Ring** — 13,500–15,000 km.
- **11. Gravitational Canyon** — 15,000–16,500 km.
- **12. Ocean Planet Expanse** — 16,500–18,000 km.
- **13. Bio-Mechanical Frontier** — 18,000–19,500 km.
- **14. Cargo Graveyard** — 19,500–21,000 km.
- **15. Volcanic Moon** — 21,000–22,500 km.
- **16. Mirror Dimension** — 22,500–24,000 km.
- **17. The Warfront** — 24,000–25,500 km.
- **18. Black Ice Corridor** — 25,500–27,000 km.
- **19. Machine Empire** — 27,000–28,500 km.
- **20. Crystal Nebula** — 28,500–30,000 km.
- **21. Silent Expanse** — 30,000–31,500 km.
- **22. Fortress Belt** — 31,500–33,000 km.
- **23. Quantum Rift** — 33,000–34,500 km.
- **24. The Last Armada** — 34,500–36,000 km.
- **25. Guardian's Last Stand** — 36,000–37,500 km.
- **26. Emerald Exoplanet** — 37,500–39,000 km.
- **27. Aurora Foundry** — 39,000–40,500 km.
- **28. Dust Giant Skirts** — 40,500–42,000 km.
- **29. Phantom Relay Network** — 42,000–43,500 km.
- **30. Tidal Moonworks** — 43,500–45,000 km.
- **31. Obsidian Spires** — 45,000–46,500 km.
- **32. Radiant Megastructure** — 46,500–48,000 km.
- **33. Graveyard of Titans** — 48,000–49,500 km.
- **34. Nebula Reef** — 49,500–51,000 km.
- **35. Chrono Array** — 51,000–52,500 km.
- **36. Magnetic Labyrinth** — 52,500–54,000 km.
- **37. The Drowned Station** — 54,000–55,500 km.
- **38. Redshift Passage** — 55,500–57,000 km.
- **39. Citadel Approach** — 57,000–58,500 km.
- **40. The Final Armada** — 58,500–60,000 km.
- **41. Crown Beacon Reach** — 60,000–61,500 km.
- **42. Celestial Crown Outer Ring** — 61,500–63,000 km.
- **43. Crown Sensor Corridor** — 63,000–64,500 km.
- **44. Crown Shield Garden** — 64,500–66,000 km.
- **45. Crown Reactor Vista** — 66,000–67,500 km.
- **46. Crown Fleet Berths** — 67,500–69,000 km.
- **47. Celestial Crown Inner Chamber** — 69,000–70,500 km.
- **48. Crown Service Quarter** — 70,500–72,000 km.
- **49. Crown Shield Lock** — 72,000–73,500 km.
- **50. Celestial Crown Parking Terminal** — 73,500–75,000 km.
