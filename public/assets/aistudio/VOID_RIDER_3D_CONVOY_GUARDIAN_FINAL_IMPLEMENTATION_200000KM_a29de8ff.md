# VOID-RIDER 3D — CONVOY GUARDIAN
# FINAL IMPLEMENTATION DIRECTIVE
## 200,000 km · 100 locations · spacious bounded open world · physical departure, docking, and return

**Use this as the final implementation file for the existing VOID-RIDER 3D repository in Google AI Studio. The user is replacing the current Convoy Guardian implementation. Inspect the repository, preserve reusable engine infrastructure, and implement the new Convoy Guardian cleanly inside the existing game. Do not create a separate demo or stop at a plan.**

---

## A. Final scope and non-negotiable requirements

Build Convoy Guardian as a large, spacious, streamed 3D open-world campaign with a real traversable **200,000 km one-way route** and **100 distinct regions**. Each region nominally covers 2,000 km. The player starts in the Origin Parking Dome, passes through physical sensor gates, travels through the world, arrives at Celestial Crown Parking Terminal, physically docks, and can then undock, free-roam, and return to Origin through the same connected route.

The player must be kept inside a defined playable flight region using visible boundary architecture and real containment/collision logic. The playable area should be broad and spacious, not a tight tube, but the player must not be able to escape into unlimited empty space or bypass the campaign route.

### Mandatory rules
1. Implement in the existing project/repository and its actual Three.js/WebGL engine.
2. Do not deliver only a demo, mock-up, route illustration, catalog, or HUD counter.
3. Expand actual route geometry and the distance between landmarks; do not just zoom out the camera or change displayed numbers.
4. Route distance must follow real player movement through connected world geometry. No timer-driven or normalized-short-spline fake distance.
5. No teleporting to route points, locations, gates, docking bays, or parking positions.
6. No auto-parking. Docking requires physical approach, alignment, safe speed, and clamp engagement.
7. The Crown Terminal is not an irreversible level end. Keep controls and simulation active for free roam and the return trip.
8. Preserve existing reusable game engine systems, controls, visual style, weapons, abilities, HUD elements, audio, touch controls, pause/reset, and quality settings where compatible.
9. Keep Convoy Guardian mode state isolated from unrelated VOID-RIDER modes, especially Mode 01 Singularity Run, Mode 21 Black Hole Mode, Quantum Launch Pro, and Final Collapse. Do not edit those modes except for a minimal, necessary shared-engine fix.
10. Never claim implementation or tests are complete unless source changes and checks have actually been performed. Report changed files, tests run, failures, and remaining work.

## B. Repository-first implementation workflow

Before editing:
- Inspect the repository structure and identify the actual route/environment generator, region catalog, player ship controller, convoy AI, collision and trigger code, boss director, HUD, mission state, gate logic, docking, persistence, pause/reset, and mode registration.
- Identify why the current scene appears compressed. Measure route segment lengths, landmark spacing, world scale, camera far plane, streaming range, and coordinate precision.
- Identify reusable systems and preserve them. Replace only the Convoy Guardian implementation that needs replacement.
- Search for all old route constants (including 50 regions / 75,000 km and 25 regions / 50,000 km) and migrate them to the new authoritative catalog. Do not leave conflicting hard-coded values.
- Use the project's established patterns and coding style. Do not invent imports or file paths without checking that they exist.

## C. World scale and route truth

- One-way campaign route: **200,000 km**.
- Regions: **100**.
- Nominal region span: **2,000 km**.
- Full outbound-and-return cumulative distance: up to **400,000 km**.
- Region 001 is the Origin Parking Dome/launch approach.
- Region 050 is the Celestial Crown Parking Terminal/destination approach.
- Regions 051–099 extend the open-world route beyond the Crown as optional continued exploration if the existing route interpretation permits; however, the main outbound campaign endpoint and turnaround hub remain at route coordinate 200,000 km. To avoid conflict between region index and hub placement, implement the catalog as follows: **Regions 001–050 cover the outbound 0–100,000 km approach, Regions 051–099 cover the continued route from 100,000–198,000 km, and Region 100 covers the final 198,000–200,000 km Crown terminal zone.** Both Origin and Crown must be real hubs. This boundary rule supersedes any older 50-region endpoint assumptions.
- For simplicity and consistency, use one authoritative generated catalog with exact boundaries: `startKm = (index - 1) * 2000`, `endKm = index * 2000`, for all 100 regions. Therefore the Crown terminal is region 100 at 198,000–200,000 km. Treat earlier mentions of region 50 as legacy design notes only.
- Establish one documented world-unit-to-kilometre scale. Route geometry must physically span the configured distance in that scale. Use floating-origin/rebasing only if required, without visible jumps or corrupting velocity, collision, route coordinate, or save state.
- Keep independent state values:
  - `currentRouteKm` — current signed/unsigned coordinate on the route graph, 0–200,000 km.
  - `maxRouteKmReached` — furthest outbound coordinate reached.
  - `cumulativeTravelKm` — total distance travelled in either direction.
  - `travelDirection` — `OUTBOUND` or `RETURN`.
  - `oneWayCampaignComplete` — completion flag that does not disable world simulation.
- Use actual player position projected to the connected route graph, with branch-aware segment tracking. Off-route movement must not silently advance route distance. Route coordinate decreases when the player travels back toward Origin; cumulative travel continues increasing.

## D. Spacious geometry and landmark spacing

The existing Convoy Guardian looks crowded and compressed. Correct this in world construction, not only in the camera.

- Increase actual distances between major landmarks and structures. Avoid many giant rings stacked tightly in the same view.
- Build long orbital highways, broad nebula expanses, open asteroid fields, large canyons, long tunnels, wide approach vistas, separated station clusters, and region-specific 3D elevation changes.
- Use long sweeping curves, gentle climbs and descents, large-radius S-curves, wide junctions, and occasional large loops where gameplay supports them.
- Give each region a distinct layout and silhouette. Palette changes alone do not count as unique environments.
- Place multiple small structures along each region and a few major landmark clusters at separated intervals.
- Make structures proportional to the ship and keep collider dimensions aligned to the visible mesh.
- Give optional exploration pockets enough volume to circle and inspect landmarks. Every pocket must reconnect to the route or have a real return corridor.
- Ensure camera far clipping, fog, LOD, and streaming distance let the player see approaching landmarks. Camera zoom is not a substitute for physical space.
- Keep the main corridor broad enough for steering, braking, boosting, and convoy formation manoeuvres.

## E. Visible playable boundary / containment system

Implement a continuous **bounded flight envelope** that follows the route graph and its active branch.

### Visual architecture
Use combinations of transparent energy membranes, shield walls, luminous guide rails, boundary pylons, tall arches, beacon towers, and region-specific containment structures. The barrier should communicate the edge of playable space. It must look like part of the world rather than an arbitrary invisible box.

### Geometry and collision
- Implement left/right boundaries and upper/lower limits where vertical movement is supported.
- Shape boundaries around turns and branch junctions; do not cut through the safe playable corridor.
- Boundary segments must stream with route chunks and remain connected at chunk seams.
- Use real collision or a robust signed-distance/closest-boundary test. Visual meshes alone are not enough.
- Use the player's actual ship collider, and account for convoy formation where possible.
- Barrier logic must understand the active branch and exploration pockets.

### Fair response
- At a configurable warning distance, show a clear HUD status such as `BOUNDARY WARNING`, illuminate nearby pylons, play a non-startling warning cue, and apply gentle inward steering/pushback.
- At the hard boundary, prevent further outward motion and slide or steer the ship along the boundary if appropriate. Do not teleport the ship.
- Do not instantly destroy the player for touching the boundary.
- Do not block intended forward travel, gates, branch choices, docking approaches, or the return route.
- Exploration pockets widen the permitted envelope locally and reconnect physically.
- The player may leave the guide lane but not the designated world boundary.
- Keep boundary collision synced with streamed geometry after turns, branch switches, pause/resume, reset, and direction reversal.

## F. Connected route and streaming

- Create a connected spline/segment graph with endpoint position and tangent continuity checks. No disconnected jumps between segments.
- Stream chunks around the actual player route position. Look-ahead depends on speed and turning radius; retain enough route behind the player for braking and reversal.
- Use stable IDs for regions, chunks, events, hazards, bosses, checkpoints, rewards, and landmarks so reloading chunks cannot duplicate them.
- Use seeded procedural placement per region so content is repeatable and save/load stable.
- Dispose of streamed geometries, materials, textures, and listeners safely. Instance repeated props and pool particles/projectiles.
- Avoid allocating large quantities of vectors, meshes, lights, or materials each frame.
- Do not load the entire 200,000 km world simultaneously.
- Reverse travel uses the same geometry and event identities in reverse, not a second generated road.
- Never teleport convoy ships to catch up. Use formation offsets, collision avoidance, bounded catch-up speed, and visible recovery behaviour.

## G. Two parking domes and physical travel

### Origin Parking Dome
- All required ships start physically parked in one shared launch/parking complex.
- Include visible individual bays, floor markings, service gantries, lights, ship silhouettes, maintenance arms, and docking clamps.
- Run a preflight sequence, engine-light sequence, clamp release, and launch-clearance HUD.
- Ships physically depart under player/AI control through a real corridor and sensor gate.
- Origin is also the return destination. Returning ships must physically pass through the gates and enter their original parking area.

### Celestial Crown Parking Terminal
- Build a huge layered terminal with rotating crown rings, central reactor, transparent shield canopy, structural ribs, multiple levels, approach beacons, sensor gates, service gantries, repair drones, cargo lifts, clamps, and nine or more assigned bays.
- Arrival lights, canopy panels, and gates respond to the approaching fleet.
- Each required ship physically crosses the entrance and navigates to its assigned bay.
- Docking succeeds only when position, heading, and speed are within configured tolerances and clamps visibly engage.
- Misalignment or excessive speed produces guidance and allows a retry. No teleporting or auto-parking.
- After docking, the player can undock by explicit interaction. Clamps retract, gates open safely, and the ship physically exits.
- Arrival does not stop world simulation or disable movement.
- The player may stay at the Crown, explore, or return to Origin.

### Sensor gates
Use state machine `SEALED -> DETECTED -> UNLOCKING -> OPENING -> OPEN -> CLEARANCE_WAIT -> CLOSING -> SEALED`, plus `HELD_OPEN`, `LOCKED`, and `FAULT`.
- Real moving leaves, frames, sensors, status lights, safety volumes, and collision synchronized to the moving geometry.
- Open before an authorized ship reaches the threshold.
- Keep open while any eligible ship occupies the safety volume.
- Never close through a ship; pause closure and reopen if occupied.
- Add hysteresis and an emergency hold-open debug override.
- Reset stale sensor occupancy correctly on pause, reset, and mode switch.

## H. Region-specific hazards, missions, and bosses

- Every region has distinct structures and at least two hazard families with telegraphs and counterplay.
- Hazards include moving asteroids, rotating debris, timed energy barriers, solar flares, plasma pockets, EMP bursts, collapsing structures, minefields, turrets, enemy interceptors, gravity shear, magnetic pulls, ice shards, crystal fractures, refracted beams, shield pulses, industrial machinery, sensor jamming, rescue opportunities, and repair missions.
- Use real collisions/triggers and stateful events, not decoration alone.
- Avoid unavoidable instant kills; include fair visual and audio warning windows.
- Use existing boss health/projectile/damage systems. Major bosses occur only at selected locations, with optional side encounters.
- Each boss has an approach warning, trigger volume, health, attack phases, telegraphed attacks, retreat/re-entry rules, and duplicate-spawn prevention.
- Boss state persists through streaming and return travel.
- Preserve the existing HUNTERS boss at 1,000 HP protected by six drones if that is its current required rule. Do not replace it with the open-world boss list.
- SAVIOUR remains an escort/rescue/repair/protection mode; HUNTERS remains a combat/hunt mode. Separate their formations, objectives, UI state, win/fail rules, and persistence.

## I. HUD, controls, audio, and mobile support

Show:
- Region index/name `001/100` through `100/100`.
- Actual route coordinate `x / 200,000 km`.
- Direction `OUTBOUND` / `RETURN`.
- Cumulative distance, maximum progress, and one-way completion separately.
- Distance to next landmark and nearest route re-entry point.
- Boundary status and direction/distance to the nearby edge where useful.
- Gate authorization/state, convoy formation, ship health/separation, boss health/phase, hazard warnings, branch guidance, and docking alignment/speed.
- Preserve existing keyboard and Android touch controls, weapons, boost, shield, abilities, audio unlock/mute, pause, reset, and quality presets.
- Make HUD responsive in portrait and landscape; don't let boundary indicators overlap essential controls.

## J. Performance, save/load, and mode isolation

- Support LOW/MEDIUM/HIGH/ULTRA presets with caps for hazards, enemies, particles, and projectiles.
- Use instancing, pooling, LOD, and safe chunk disposal.
- Persist route coordinate, direction, branch choice, region, boss/event states, ship health, docking state, and unlocked content. Validate save schema and handle migration.
- Pause/resume must stop simulation and gate animations consistently and resume without coordinate jumps.
- Reset must clear stale triggers and sensor occupancy.
- Keep all Convoy Guardian state in a dedicated namespace/store and avoid leaking it to other game modes.
- Do not modify unrelated mode files unless required for a minimal shared API compatibility change.

## K. Authoritative 100-region catalog

Each region is nominally 2,000 km; calculate exact boundaries using `startKm = (index - 1) * 2000`, `endKm = index * 2000`. The final region is the Crown terminal approach and ends at 200,000 km. The Origin hub is at 0 km. Do not keep conflicting legacy boundary rules.

001. Guardian Departure Dome — Origin hangar, shared launch bays, service gantries; sensor airlocks, launch traffic, release clamps.
002. Neon Transit Spine — illuminated orbital highway, distant beacons; crossing traffic, moving barriers, lane splitters.
003. Crimson Nebula — red ion clouds, gas pillars, refinery towers; sensor jamming, plasma pockets, low visibility.
004. Shattered Asteroid Belt — fractured rocks, mining rigs, ore collectors; moving asteroids, tumbling debris, collapsing rig arms.
005. Frozen Expanse — ice moon horizon, crystalline bridges, comm towers; cryo shards, low-traction fields, brittle arches.
006. Solar Furnace — solar collectors, heat shields, star-facing platforms; solar flares, thermal beams, overheating zones.
007. Abandoned Megacity — ruined skyscrapers, skybridges, suspended rails; falling structures, security grids, collapsing bridges.
008. Quantum Forest — bioluminescent crystal trees, living energy roots; sweeping branches, unstable portals, root pulses.
009. Ion Storm Frontier — lightning curtains, storm towers, relay arrays; EMP bursts, charged clouds, sensor blackout.
010. The Broken Ring — shattered orbital ring, rotating fragments; ring debris, spinning sections, narrow gaps.
011. Gravitational Canyon — spatial ravine, floating cliffs, gravity pylons; gravity shear, drifting boulders, vector shifts.
012. Ocean Planet Expanse — ocean planet, research platforms, water harvesters; tidal surges, pressure waves, platform debris.
013. Bio-Mechanical Frontier — organic-mechanical towers, living alloy bridges; reactive tendrils, moving walls, corrosive spore clouds.
014. Cargo Graveyard — derelict freighters, cargo stacks, salvage cranes; loose containers, crane swings, unstable wreckage.
015. Volcanic Moon — lava-lit moon, basalt spires, magma stations; eruptive rock, thermal vents, molten debris.
016. Mirror Dimension — reflective structures, mirrored gates, prism towers; false cues, mirror drones, refracted beams.
017. The Warfront — battle-scarred stations, weapon platforms, wrecked fleets; crossfire, minefields, turrets, debris volleys.
018. Black Ice Corridor — dark frozen structures, ice tunnels, blue beacons; ice collapse, frozen mines, reduced visibility.
019. Machine Empire — industrial towers, assembly arms, robotic foundries; defense grids, pistons, fabrication drones.
020. Crystal Nebula — huge crystal formations, refractive arches, glowing shards; crystal fractures, laser refraction, shard storms.
021. Silent Expanse — sparse starfield, abandoned probes, listening arrays; stealth ambushes, sensor ghosts, drifting mines.
022. Fortress Belt — armored fortresses, shield walls, orbital turrets; crossfire corridors, shield pulses, interceptors.
023. Quantum Rift — rift bridges, folded-space structures, unstable portals; spatial distortion, rift pulses, misleading visuals.
024. The Last Armada — capital ships, carrier docks, fleet structures; fighter waves, artillery lanes, capital-ship debris.
025. Guardian's Last Stand — damaged defense platforms, shield generators, rescue towers; siege weapons, collapsing shields, ambush waves.
026. Emerald Exoplanet — floating jungle islands, luminous vegetation, alien ruins; living vines, spore bursts, moving rock shelves.
027. Aurora Foundry — magnetic factories, plasma furnaces, orbital cranes; magnetic pulls, plasma spills, crane collisions.
028. Dust Giant Skirts — dust giant horizon, ring mines, gas harvesters; dust walls, charged grains, ring-rock impacts.
029. Phantom Relay Network — ghostly comm towers, holographic bridges, relay clusters; signal decoys, beam traps, disappearing bridge sections.
030. Tidal Moonworks — tidal generators, rotating energy turbines; turbine arcs, pressure bursts, unstable generator fields.
031. Obsidian Spires — black glass towers, volcanic arches, lava-lit platforms; shattering glass, debris fields, thermal shock.
032. Radiant Megastructure — energy lattice, solar mirrors, light bridges; focused beams, mirror misalignment, flare pulses.
033. Graveyard of Titans — capital-ship skeletons, colossal engines, hull canyons; falling hull plates, reactor leaks, moving wreckage.
034. Nebula Reef — reef-like minerals, glowing gas streams; hidden rock spikes, ion currents, dense particle fields.
035. Chrono Array — orbital rings, signal pylons, rotating platforms; pulsed barriers, timing gates, shifting hazard cycles.
036. Magnetic Labyrinth — metal corridors, magnetic towers, rail networks; magnetic pulls, moving walls, rail crossings.
037. The Drowned Station — broken habitat domes, water tanks; pressure bursts, broken panels, electrical arcs.
038. Redshift Passage — red-lit tunnels, folded arches, speed beacons; high-speed debris, lane compression, unstable gates.
039. Citadel Approach — defense citadel, shield towers, ceremonial pylons; turrets, shield pulses, interceptor screens.
040. The Final Armada — allied staging platforms, command carrier; combat debris, escort crossings, hostile waves.
041. Crown Beacon Reach — distant crown beacon, navigation relays; beacon interference, debris streams, clearance checks.
042. Celestial Crown Outer Ring — orbital rings, approach gantries, shield emitters; shield pulses, moving gate panels, traffic lanes.
043. Crown Sensor Corridor — sensor towers, scan arches, clearance markers; unauthorized drones, scan beams, gated sections.
044. Crown Shield Garden — transparent shield ribs, energy gardens, service bridges; maintenance drones, power surges, moving service arms.
045. Crown Reactor Vista — central reactor vista, panoramic ring structures; reactor vent pulses, magnetic maintenance fields.
046. Crown Fleet Berths — nine-plus berths, gantries, repair structures; moving service arms, bay gates, docking traffic.
047. Celestial Crown Inner Chamber — multi-level hangar, central core, catwalks; sensor gates, moving lifts, emergency bulkheads.
048. Crown Service Quarter — repair drones, fuel towers, cargo lifts; service traffic, rotating machinery, temporary closures.
049. Crown Shield Lock — segmented canopy, mechanical ribs, shield controls; closing panels, safety sensors, airlock sequencing.
050. Crown Approach Vista — wide panoramic terminal approach, distant reactor and ring silhouettes; traffic lanes, beacon interference, clearance checks.
051. Blue Giant Approach — blue-supergiant horizon, heat shields, orbital scaffolds; radiation pulses, thermal lanes, shield failures.
052. Sapphire Debris Ocean — blue mineral fragments, salvage platforms; fragment swarms, rotating salvage arms, ricochet debris.
053. Helix Monastery — spiral habitat, observatories, light bridges; folding bridges, patrol drones, timed crossings.
054. Eclipse Foundry — shadowed industry, eclipse mirrors, forge towers; darkness windows, beam sweeps, moving smelter arms.
055. Glass Comet Trail — comet fragments, ice ribbons, survey craft; ice splinters, vapor plumes, fast fragments.
056. Pulsar Cathedral — pulsar beacon, orbital plates, signal towers; timed radiation pulses, rotating barriers, sensor overload.
057. Red Dwarf Mines — compact star, mining rings, ore elevators; mine traffic, unstable ore, magnetized debris.
058. Lantern Archipelago — floating habitats, beacon chains, cargo bridges; bridge gaps, traffic crossings, failing beacons.
059. Warden's Maze — defense maze, sentinel towers, shield corridors; tracking turrets, closing walls, energy gates.
060. Solar Sail Graveyard — broken sails, drifting masts, repair skiffs; entangling membranes, snapping spars, sail fragments.
061. Obsidian Ocean — dark planet, black-glass platforms, orbital trenches; platform collapse, thermal vents, hidden debris.
062. Singing Crystals — resonant crystal spires, harmonic bridges, tuning arrays; resonance waves, shards, oscillating bridges.
063. Cyclone Belt — gas-giant cyclone walls, storm probes, refineries; cyclone shear, lightning, turbulent debris.
064. Red Aurora Fields — red aurora curtains, magnetic towers, relay rings; magnetic surges, obscured routes, charged fragments.
065. Lost Colony Chain — abandoned colonies, habitat pods, rescue beacons; failing modules, debris, rescue time windows.
066. Titan Engineworks — colossal engines, repair platforms, coolant towers; coolant jets, moving pistons, ignition pulses.
067. Star-Eater Scar — dark-energy scar, fractured beacons, research probes; energy tides, unstable fields, sensor distortion.
068. Radiant Causeway — light bridge, solar mirrors, relay pylons; mirror sweeps, bridge flicker, high-speed traffic.
069. Hollow Planet — hollow planetoid, cavern entrances, interior platforms; rockfall, narrow tunnels, unstable supports.
070. Violet Storm Sea — violet nebula, storm anchors, ion towers; lightning webs, EMP waves, plasma pockets.
071. Armada's Forge — warship yards, dry docks, heavy cranes; assembly traffic, moving hull plates, defense tests.
072. Rescue Beacon Fields — distress beacons, damaged shuttles, medical platforms; rescue timers, unstable wrecks, hostile patrols.
073. Fractured Moonchain — linked moon fragments, tether bridges, gravity stations; tether breaks, drifting moons, gravity shear.
074. Iron Halo — metallic halo, rotating platforms, shield pylons; rotating gaps, shield pulses, debris streams.
075. Ghost Fleet Expanse — derelict fleet, dim lights, abandoned carriers; ambush drones, drifting missiles, unstable reactors.
076. Quantum Orchard — geometric growths, branching energy roots; pulse waves, shifting corridors, unstable crystal growth.
077. Ashen Starworks — ash-covered star platforms, heat exchangers, furnace rings; ash clouds, thermal bursts, falling machinery.
078. Blue Rift Crossing — blue spatial rift, anchor towers, transit platforms; rift surges, route instability, timed crossings.
079. Crownward Battlements — defense platforms, command towers, shield batteries; turret volleys, interceptors, shield timing.
080. Crown Approach Armada — allied carriers, staging rings, escort beacons; fleet traffic, battle debris, clearance corridors.
081. Crown Navigation Array — navigation array, holographic route lattice; scan pulses, moving antennae, navigation interference.
082. Crown Outer Dockyards — exterior docks, cargo cranes, repair scaffolds; dock traffic, moving cranes, temporary closures.
083. Crown Shield Threshold — shield emitters, transparent barrier ribs; shield cycling, sensor checks, power surges.
084. Crown Arrival Causeway — wide causeway, beacon arches, service rails; crossing traffic, barrier timing, drifting cargo.
085. Crown Approach Gardens — floating gardens, energy fountains, maintenance bridges; service drones, moving bridges, maintenance fields.
086. Crown Fleet Control — fleet command station, holographic fleet board, signal towers; command traffic, signal jamming, security scans.
087. Crown Docking Ring — rotating docking ring, numbered berth arms; ring rotation, bay traffic, moving berth arms.
088. Crown Hangar Exterior — hangar shell, canopy ribs, landing lights; canopy panels, approach traffic, safety sensors.
089. Crown Inner Transit — multi-level transit chamber, lifts, service corridors; moving lifts, crossing vehicles, bulkhead cycles.
090. Crown Repair Arcade — repair gantries, drones, diagnostic pylons; service arms, maintenance traffic, energy tools.
091. Crown Final Gate — sensor airlock, paired sliding gate leaves; gate timing, authorization, safety-volume checks.
092. Outer Crown Observatory — long-range observatory, telescope rings, signal masts; rotating dishes, scan pulses, traffic intersections.
093. Celestial Foundry Reach — distant fabrication platforms, cargo rail spines; moving cargo, crane arcs, debris.
094. Crownward Nebula — bright nebula columns, relay beacons, gas platforms; plasma pockets, sensor distortion, visibility shifts.
095. Crown Fleet Parade — wide formation corridor, ceremonial fleet pylons; crossing traffic, timed barriers, moving escort craft.
096. Crown Shield Garden Outer — outer canopy ribs, transparent field anchors; power surges, maintenance drones, field cycling.
097. Crown Reactor Approach — huge reactor silhouette, cooling rings, maintenance bridges; vent pulses, magnetic fields, service traffic.
098. Crown Berth Approach — assigned-bay beacons, service gantries, traffic rings; moving clamps, bay gates, docking traffic.
099. Crown Airlock Corridor — final shield corridor, paired sensor gates, guidance lights; gate timing, occupancy checks, authorization.
100. Celestial Crown Parking Terminal — final sanctuary, crown rings, central reactor, secure fleet bays; precision docking, speed validation, clamps, final clearance.

## L. Implementation order and verification

1. Inspect and map current source architecture.
2. Replace the Convoy Guardian route/catalog coherently with 100 regions and 200,000 km.
3. Expand real geometry and landmark spacing to solve the compressed appearance.
4. Implement connected route graph, streaming, world scale, and precision handling.
5. Implement branch-aware visible boundary envelope and fair containment response.
6. Add region structures, hazards, exploration pockets, and event persistence.
7. Integrate physical Origin departure/return, safe sensor gates, Crown docking/undocking, and reverse travel.
8. Integrate boss encounters through existing combat systems.
9. Update HUD, touch layout, audio cues, save/load, and quality presets.
10. Test outbound movement, real distance, route boundaries, branch transitions, off-route return, chunk streaming, reversal, gate occupancy, docking/undocking, boss re-entry, pause/reset/save-load, SAVIOUR, HUNTERS, and unrelated modes.
11. Run the actual repository's typecheck/lint/build commands. Fix reproducible errors.
12. Package a separate updated project ZIP. Report exact changed files and actual test outcomes.

### Final acceptance checklist
- [ ] 200,000 km actual connected traversable route, not a fake HUD scale.
- [ ] 100 distinct 2,000 km regions with unique layouts and structures.
- [ ] World is visibly spacious with distant landmarks and varied 3D geometry.
- [ ] Player is confined to a visible, fair, branch-aware flight envelope.
- [ ] Player can explore permitted pockets and rejoin the route.
- [ ] Streaming loads/unloads chunks correctly and supports reverse travel.
- [ ] Origin and Crown gates are physical and occupancy-safe.
- [ ] Ships physically depart, dock, undock, and return.
- [ ] Hazards and bosses use real collision/trigger/combat systems.
- [ ] SAVIOUR and HUNTERS remain separate.
- [ ] Unrelated modes remain intact.
- [ ] Android controls, HUD, pause/resume, and save/load work.
- [ ] Build/test results are reported truthfully.

**Final instruction:** Implement these requirements in the current repository. Do not stop at this file, a plan, or a visual-only scene. If source changes cannot be made in this session, state that clearly and do not claim the game has been modified.
