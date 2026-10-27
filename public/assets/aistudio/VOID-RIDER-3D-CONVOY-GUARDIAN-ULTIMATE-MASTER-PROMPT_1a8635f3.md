# VOID-RIDER 3D — CONVOY GUARDIAN MASTER IMPLEMENTATION & FINAL REPAIR SPECIFICATION

**Purpose:** Use this complete implementation prompt in Google AI Studio with the current VOID-RIDER 3D repository open. Inspect and modify the real project source code; do not create a separate demo or merely provide advice.

## 0. Core execution rules

1. First inspect the repository, package scripts, mode registry, menu flow, game engine, Convoy Guardian files, AI, projectiles, damage, HUD, camera, mobile controls, route/events, save/results, and Parking Dome escape code. Identify the real files and existing architecture before editing.
2. Preserve the existing Three.js/WebGL + TypeScript/JavaScript implementation, assets, and unrelated gameplay. Do not migrate the game to another engine or rewrite unrelated modes.
3. Make actual code changes in the project. Do not only create a report, mockup, or pseudo-code.
4. Preserve protected Mode 01 SINGULARITY RUN and Mode 21 BLACK HOLE MODE. Do not modify their gameplay.
5. Keep Convoy Guardian as its own mode and keep all Convoy Guardian-only assets and events confined to it unless the existing architecture explicitly shares generic utilities.
6. Never claim a build or test passed unless it was actually run and passed. If something cannot be tested, state that clearly.
7. Do not silently remove features to make errors disappear. Do not add fake victory, disable all damage, or make every entity invulnerable.

## 1. Convoy Guardian mode and variants

Ensure Convoy Guardian is reachable from the main menu for spaceships and that selecting a variant starts the correct mission. Support the existing `SAVIOUR` and `HUNTER` variants, using the exact registry values already used in the repository. Fix inconsistent variant strings and route all menu/replay startup through one reliable initialization path.

### Saviour variant
- The player protects the Saviour convoy and its lead flagship.
- Spawn and register the expected convoy transports/escorts using the repository's existing intended configuration. If the intended count is nine, verify that nine valid convoy ships are spawned and tracked; do not display `0/0` because of an uninitialized counter.
- Keep enemy threats, damage, shields, convoy integrity, route progress, mission objectives, victory and defeat conditions meaningful.
- Ensure the player can identify the flagship, transports, health, convoy integrity, current objective, route progress, and incoming threats from the HUD.

### Hunter variant
- The player-controlled Hunter fights the Saviour convoy.
- Allied Hunter ships and Hunter drones support the player and attack valid Saviour targets.
- Preserve existing combat, drone, ability, reward, and result-screen behavior unless a specific bug requires a minimal fix.

## 2. Critical faction/team system — no friendly fire

Implement or repair a single authoritative faction validation utility and use it in every AI targeting and damage path. Each combat entity must have a stable explicit team/faction identifier; do not infer faction from color, array order, object name, or position.

Required rules:
- Player Hunter, allied Hunter ships, and allied Hunter drones are `HUNTER`.
- Saviour flagship, transports, escorts, and Saviour defensive units are `SAVIOUR`.
- Hunter AI targets only living, valid Saviour targets.
- Saviour AI targets only living, valid Hunter targets.
- A unit never selects its own team as a hostile target.
- A projectile cannot damage its owner or same-team entities.
- Revalidate target existence, alive/active state, and faction before firing, applying damage, resolving impact, or applying secondary effects.
- Store projectile owner and faction/team when spawned. Do not trust target selection alone to prevent friendly fire.
- Apply team filtering to bullets, missiles, homing weapons, beams, drones, explosions, splash/area damage, ramming, and any other damage source.
- If a target is destroyed or becomes invalid, discard it and reacquire a valid opposing target.
- If no valid opposing target exists, AI should search, reposition, or idle rather than attack allies.
- Keep legitimate opposing-team damage enabled. The player can still be damaged and defeated by real enemies.

## 3. Critical mission startup / false instant defeat

Fix the reported Saviour bug where selecting Saviour immediately shows `CONVOY LOST`, `0/0` transports, `0%` convoy integrity, and `00:00` duration.

- Trace the full menu → variant selection → mission initialization → entity spawning → mission activation → defeat evaluation flow.
- Use an explicit initialization/readiness state. Do not evaluate victory/defeat until required entities and mission state are ready.
- Ensure the lead flagship and expected transports are created, registered, alive, and linked to the current mission before activating defeat checks.
- Reset the timer, player and convoy health/shields, integrity, counters, route/lap/objective progress, drones, projectiles, event state, and result-screen state on a new mission and replay.
- Start mission time only when gameplay enters its active state; the timer must advance normally from zero.
- Do not interpret a temporary empty array during setup as the convoy having been destroyed.
- Once active, preserve real defeat conditions, such as actual flagship destruction or actual objective failure, according to the current design.
- Fix incorrect enum/string comparisons, stale references, duplicate callbacks, async initialization races, or stale prior-run state if found.
- Ensure result screen cannot open before the mission actually starts.

## 4. Saviour survivability and balanced combat

- Inspect real hull damage, shields, damage multipliers, enemy fire rates, spawn timing, collision damage, and convoy AI behavior before changing balance.
- Correct accidental repeated damage, duplicated collision processing, allied damage, and invalid damage values.
- Temporary spawn protection may be used only as a short, clearly scoped grace period; it must expire and must not hide broken collision/team logic.
- Adjust damage balance only if source inspection or reproducible playtesting shows it is excessive. Do not arbitrarily remove difficulty or make the convoy indestructible.
- Ensure the convoy can be saved through gameplay and can still be lost through legitimate failure.

## 5. Extend the Convoy Guardian route to 50,000 km

**Route-length requirement: expand the complete playable Convoy Guardian route to 50,000 km total**, increasing the previous 40,000 km target by 10,000 km. Inspect the real route generator, distance/progress model, checkpoint tables, event triggers, route branches, HUD, and mission-end conditions before editing. Do not merely change the displayed distance or a single constant while leaving the physical route shorter.

- Keep the existing hostile-sector combat segment around 25,000–35,000 km, if present in the current project, and preserve its intended difficulty and event sequence.
- Add 35,000–40,000 km as a meaningful late-route transition and 40,000–50,000 km as a new final route section with distinct encounter pacing, hazards, checkpoints, convoy-protection events, and a clear final objective. Reuse existing systems/assets where appropriate; do not create empty distance with no gameplay.
- Make the additional 10,000 km physically traversable and consistent with the game's world scale, movement speed, route generation, and distance calculations. If distance is simulated/scaled rather than literal world units, use the project's established scale consistently.
- Ensure the route cannot end, trigger victory, despawn the convoy, or teleport the player at the old 40,000 km endpoint. The actual mission completion condition must be at the new 50,000 km endpoint or the existing equivalent final objective.
- Extend route markers, checkpoint and respawn data, route branches, hazard bounds, encounter spawn windows, event scheduling, convoy AI pathing, HUD progress, mission duration, result reporting, and escape/return links to cover the full route.
- Keep checkpoint distances ordered, unique where required, reachable, and within 0–50,000 km. Prevent gaps, unreachable checkpoints, repeated event triggers, duplicate spawn loops, and events firing immediately at mission start.
- Preserve saved progress and avoid breaking existing checkpoints. Migrate or safely clamp older saved route progress if needed.
- Add a clear route progress display such as `current distance / 50,000 km`, derived from live route state rather than hard-coded text.
- Test the old 40,000 km boundary explicitly and confirm the player can continue through 40,000 km to 50,000 km without an unintended mission end.
- Preserve existing Convoy Guardian cinematic sequences only where they belong to this mode; do not introduce Convoy Guardian route cinematics into unrelated modes.

## 6. Parking Dome / basement parking / emergency escape sequence

Preserve and repair the existing Parking Dome emergency-escape implementation. It must be an actual playable environment, not merely a static visual or a report.

Required features, where already specified for this project:
- Underground/basement parking chamber with visible parking bays and physical structure.
- A visible upper dome/canopy with an open or transparent roof so the ship and surrounding environment remain visible.
- Parking locks that have a clear state and can be released by the intended emergency activation sequence.
- Sensor-controlled chamber gates that detect the ship and open/close according to the sequence, without trapping the player because of incorrect trigger bounds.
- Free six-axis/available ship movement within the chamber and through the entrance/exit; no invisible walls or accidental movement lock.
- A physically connected escape path from the parking chamber to the main route, with correct alignment between visible surfaces, collision meshes, trigger volumes, and gate animations.
- Emergency escape activation, objective feedback, gate timing, and route continuation must work through real gameplay state.
- The camera must keep the entire player ship visible where practical and transition smoothly between interior, exit, and route views.
- Mobile/touch controls must remain visible and usable, with adequate touch targets and no UI overlay blocking essential movement/escape controls.
- Ensure collision and interaction volumes match visible geometry; no invisible blockers, impossible gaps, or triggers that fire from far away.
- Keep the sequence scoped to Convoy Guardian and do not modify the protected Black Hole modes.

If a listed feature is not implemented in the current source, implement it using the existing architecture rather than claiming it already works. Do not remove working features during repair.

## 7. Camera, HUD, input, and accessibility

- Preserve existing desktop keyboard/mouse and mobile touch controls.
- Ensure camera follow covers the whole player ship and avoids clipping into the ship or environment. Preserve existing camera perspective/zoom options if present.
- Do not let camera movement disable steering, aiming, or movement input.
- HUD values must come from live mission state, not hard-coded placeholder text.
- Make variant, mission status, hull/shields, convoy integrity, transport counts, objectives, timer, and results consistent with the actual simulation.
- Keep the result screen from covering an active mission due to a stale defeat flag.

## 8. Mission results, replay, and rewards

- Compute saved transports, convoy integrity, drones neutralized, mission duration, credits, and XP from actual mission events and the current mission state.
- Do not show zero values merely because counters were not initialized or events were not connected.
- Avoid duplicate reward grants when a result screen re-renders or the player presses replay.
- Replay must clean up previous mission entities, timers, projectiles, AI references, listeners, and events before starting a fresh run.
- Main Menu must return cleanly without leaving active Convoy Guardian simulation loops.

## 9. Performance and robustness

- Avoid per-frame allocation or duplicate AI/projectile/update loops where possible.
- Reuse the project's existing pooling, instancing, and cleanup conventions.
- Clamp invalid delta time and guard against NaN/infinite health, damage, positions, or timer values.
- Avoid adding heavyweight dependencies unless essential.
- Keep mobile performance and memory usage in mind.

## 10. Required repository workflow and validation

Before changes:
1. Inspect `package.json` scripts and identify the real mode registry, game initialization, Convoy Guardian director, AI targeting, projectile collision, damage, HUD, results, camera/input, Parking Dome environment, and escape-sequence files.
2. Establish the current failure path and identify all code paths that can target or damage an entity.

After changes:
1. Run the available build/typecheck/lint/tests using the repository's actual scripts.
2. Fix errors introduced by the edits. Do not conceal errors by disabling checks.
3. Search again for alternate projectile/damage paths that bypass faction filtering.
4. Verify that both variants initialize correctly, the mission timer advances, and no result screen appears prematurely.
5. Verify the Hunter team does not damage itself while Saviour can still damage Hunter and Hunter can still damage Saviour.
6. Verify Parking Dome movement, gates, parking locks, camera, mobile controls, emergency activation, and exit-to-route connectivity as far as the available test environment permits.
7. If browser/gameplay testing cannot be performed, clearly list what remains unverified.

## 11. Final deliverable requirements

Save all real source changes in the existing project. Provide a complete updated ZIP with the project root files (such as `package.json`, `src/`, and `index.html`) at the ZIP root, not hidden inside an extra wrapper folder. Exclude `node_modules` and other generated caches unless the project explicitly requires them.

Include a concise change summary listing:
- Files changed.
- Hunter/Saviour team and friendly-fire fixes.
- Saviour initialization and false-defeat fix.
- Survivability adjustments, if any, and why they were necessary.
- Parking Dome/emergency escape fixes.
- Route expansion from 40,000 km to a fully playable 50,000 km, including checkpoint/event/HUD/end-condition updates.
- Actual build/test commands and results.
- Any remaining limitations or unverified gameplay behavior.

Do not call the ZIP “fully tested” unless all relevant tests were actually completed. Do not claim features are fixed merely because code was written.

## FINAL ACCEPTANCE CHECKLIST

- [ ] Hunter allies attack valid Saviour targets, never the player Hunter or Hunter allies.
- [ ] All projectile, beam, drone, explosion, and collision damage obeys faction rules.
- [ ] Saviour mission enters ACTIVE state and does not instantly display a false `CONVOY LOST` result.
- [ ] Convoy counts, integrity, health, and timer reflect live state.
- [ ] Real damage, victory, and defeat conditions still work.
- [ ] Replay and variant switching fully reset the previous mission.
- [ ] Route is physically playable through 50,000 km; 40,000 km is no longer an accidental endpoint, and checkpoints/events/HUD/final objective are synchronized.
- [ ] Parking Dome, basement parking, parking locks, sensor gates, free ship movement, emergency escape, camera, and mobile controls are preserved and verified to the extent possible.
- [ ] Protected Mode 01 and Mode 21 remain untouched.
- [ ] Build/test results are reported honestly.
- [ ] A complete ZIP is produced with project files at the archive root.

## 12. Complete mission experience and route content

Implement these features only where they fit the existing architecture and can be integrated without destabilizing the game. Prefer extending current systems over duplicating them.

### Route sectors and encounter pacing
- Build a readable progression across the full 0–50,000 km journey: launch/convoy formation, navigation hazards, first hostile contact, escalating hostile sector, recovery/checkpoint section, late-route transition, final 40,000–50,000 km challenge, and final extraction/objective.
- Give each sector an identifiable visual silhouette, lighting/atmosphere, navigation cues, and gameplay purpose. Do not fill the world with meaningless repeated cubes or obstacles.
- Provide a mix of convoy escort pressure, ambushes, pursuit, defensive waves, debris navigation, gate timing, route choice, rescue/recovery windows, and final holdout/extraction, using existing mechanics where available.
- Keep the main route readable and traversable. Every required route segment must have collision geometry aligned with its visible geometry. Optional branches must rejoin the main route or have an explicit outcome.
- Use deterministic event IDs and one-shot trigger state so checkpoints, dialogue, waves, rewards, and objectives cannot repeatedly trigger every frame.
- Scale encounter difficulty gradually using measured mission progress, not arbitrary sudden damage spikes. Avoid spawning more enemies than the device can handle.

### Objectives, checkpoints, failure recovery
- Display one primary objective and clear optional objectives, each with an explicit completion/failure state.
- Add route checkpoints at meaningful intervals using the project's existing checkpoint system; validate ordering, reachability, and respawn placement.
- On respawn, restore the player to a safe valid transform, reinitialize movement/camera state, and avoid placing the ship inside geometry or enemy fire.
- Keep convoy respawn/recovery behavior consistent with the existing design; do not silently resurrect destroyed mission-critical transports unless that is an intentional mechanic.
- On mission failure, show the actual reason, current distance, convoy integrity, transports saved/lost, and time elapsed. Offer retry and return-to-menu actions without retaining stale projectiles, enemies, timers, or event subscriptions.
- On victory, show the real final objective, total route distance, completion time, convoy survival statistics, optional objectives, and earned rewards.

## 13. HUD, feedback, controls, and accessibility

- Provide a clear HUD for mission variant, route distance / 50,000 km, progress percentage, current sector, next checkpoint, primary objective, mission timer, convoy integrity, transport count, flagship health, player health/shields, and active threats.
- Show target faction and target health only when a valid target is selected. Distinguish friendly and hostile entities using more than color alone (icons, labels, outline/shape, or HUD markers).
- Use clear event notifications for ambushes, convoy under attack, checkpoint reached, route branch, critical flagship health, escape sequence, and mission completion. Avoid stacking duplicate alerts or covering critical controls.
- Add audio cues using the existing audio system for incoming threats, damage, checkpoint confirmation, gate state, objective updates, and victory/defeat. Respect mute/volume settings and avoid creating a new audio context repeatedly.
- Ensure desktop keyboard/game controls remain consistent with the current game. Ensure mobile controls have usable touch targets, do not accidentally trigger browser gestures, and remain visible at common phone aspect ratios.
- If the existing control scheme supports remapping, preserve it. If it does not, document the actual controls rather than introducing a second conflicting control scheme.
- Provide readable text contrast, non-color-only team identification, clear pause/resume, and safe UI scaling for narrow screens. Do not let HUD overlays intercept gameplay input except where intended.

## 14. Parking Dome and emergency escape — integration details

- Treat the Parking Dome as a real playable environment/sequence connected to the Convoy Guardian mission, not a static illustration or unrelated menu scene.
- Preserve basement parking layout, entry/exit path, upper dome visibility, chamber gates, sensor triggers, parking locks, emergency activation, and the connected escape route wherever those systems exist in the source.
- Make all gate states explicit: closed, sensing, opening, open, closing, blocked, and emergency override where applicable. Ensure state transitions are debounced and do not oscillate rapidly when the player is near a sensor boundary.
- Never close a gate through the ship. Check the player's ship bounds and any convoy vehicle bounds before closing; if blocked, pause closing or reopen safely.
- Keep the ship freely controllable inside and outside the dome as specified. Avoid invisible walls, stuck movement, unexpected auto-locking, or forced absorption/teleportation.
- Keep camera framing aware of the whole player ship during entry, free roaming, gate interaction, and escape. Avoid camera clipping through the dome or losing the player off-screen; preserve normal camera controls and mobile zoom behavior if present.
- On emergency activation, show an explicit objective/state, animate or sequence the appropriate gates, enable the intended exit path, and connect the exit to the correct route transform. Validate the destination before teleporting or transitioning.
- If the emergency sequence fails, provide a recoverable state and useful debug logging; do not soft-lock the player or declare mission success without completing the objective.
- Test the sequence both from a fresh mission and after replaying, so stale gate timers or event listeners cannot carry over.

## 15. Combat, AI, and performance requirements

- Use the existing update loop and lifecycle. Avoid creating new timers, animation loops, event listeners, or render loops each time a mission starts.
- Ensure every spawned ship, drone, projectile, effect, and event listener has a clear cleanup path on destruction, mission reset, replay, or scene exit.
- Bound AI target searches and projectile collision checks sensibly. Reuse shared geometry/materials and object pooling if the project already uses them or profiling demonstrates a need.
- Avoid per-frame allocation-heavy operations in hot paths where a reusable vector/object is practical.
- Make collision/damage processing idempotent per impact so one projectile cannot apply damage multiple times due to overlapping frames or duplicate collision callbacks.
- Validate damage values, elapsed time, distances, health, shields, and progress values for finite, sensible numbers. Handle missing targets and partially initialized entities safely.
- If moving hazards or gates are introduced, keep their visible transforms and collision transforms synchronized. Use swept collision/continuous collision handling only where the existing physics supports it and tunneling is demonstrated.
- On mobile devices, use existing instancing, level-of-detail, culling, particle limits, and pooling features where appropriate. Do not trade correctness for visual effects or allow unbounded enemy/effect spawning.
- Do not reduce frame rate by running expensive full-target scans or route regeneration on every frame. Cache static route data and schedule expensive work at suitable intervals.

## 16. Save data, lifecycle, and regression protection

- Inspect the current save format before changing it. Preserve compatible fields and add versioned migrations only when necessary.
- Do not overwrite player progression or unrelated game settings when starting/replaying Convoy Guardian.
- Keep mission-local state separate from global unlocks, ship selections, audio settings, and other modes.
- Ensure mission reset clears only Convoy Guardian runtime state and does not reset protected modes or global user data.
- Remove stale references to destroyed entities and disposed Three.js resources. Dispose only resources owned by the scene/system being reset; do not dispose shared assets still used by another mode.
- Avoid duplicate keyboard/touch listeners after multiple replays. Verify pause/resume does not advance the mission timer or AI while paused, consistent with the game's established behavior.
- Check that returning to the main menu restores the correct scene, UI focus, input routing, and audio state.

## 17. Logging, diagnostics, and acceptance testing

Add minimal development-only diagnostics where useful, without flooding production logs:
- Mission lifecycle: selected variant, initialization started, entity registration complete, mission active, mission ended.
- Convoy counts: expected, spawned, alive, saved, and lost, with clear definitions for each counter.
- Faction validation: development warning when a combat entity has no valid faction or an AI target is same-team.
- Route validation: actual progress, next checkpoint, next event ID, and endpoint reachability.
- Dome state: gate transitions, emergency activation, escape destination validity, and sequence completion.

Create or extend automated tests where the project has a test framework. At minimum, add focused unit tests for faction filtering, projectile damage eligibility, mission readiness/false defeat, route endpoint/checkpoint validation, and mission reset if test infrastructure permits. Do not add a large new testing framework solely for these fixes without a clear need.

Manual smoke-test matrix:
1. Start Saviour from a fresh main-menu session.
2. Start Hunter from a fresh main-menu session.
3. Switch Saviour → menu → Hunter, then Hunter → menu → Saviour.
4. Replay both variants multiple times.
5. Fire into allied and enemy entities with each available weapon/damage path.
6. Destroy a legitimate objective and verify defeat; complete the real final objective and verify victory.
7. Traverse early route, hostile sector, checkpoints, 40,000 km transition, and 50,000 km endpoint.
8. Enter/exit the Parking Dome, operate sensor gates and parking locks, activate emergency escape, and verify route reconnection.
9. Test desktop keyboard/mouse and mobile touch layout where available.
10. Pause/resume, return to menu, and restart; check for duplicated audio, input, AI, timers, or event triggers.
11. Run the actual package scripts for typecheck/build/tests and report the exact results.

## 18. Prioritization rule

If the repository is large or the environment has limited time, implement in this order:
1. Prevent friendly fire and correct faction filtering.
2. Fix Saviour false instant defeat and mission lifecycle resets.
3. Ensure route logic is genuinely playable through 50,000 km.
4. Preserve and repair Parking Dome movement, gates, emergency escape, and camera.
5. Complete HUD, event feedback, objectives, results, and route encounter pacing.
6. Optimize performance and add automated tests.

Do not mark unfinished items as complete. If a requested feature conflicts with the existing architecture, explain the conflict, implement the safest compatible option, and report the limitation.
