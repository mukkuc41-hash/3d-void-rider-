# VOID-RIDER 3D — Convoy Guardian
## Ship Design Implementation Specification
**Target:** Existing Google AI Studio repository (React + TypeScript + Three.js/WebGL)  
**Scope:** Ship visuals and rank/division progression for the existing SAVIOUR and HUNTERS modes  
**Important:** This is an implementation directive for integration into the existing repository, not a replacement game or standalone demo.

---

## 1. Non-negotiable preservation rules

1. Inspect the repository before editing. Identify the current ship/entity classes, model factory, convoy formation configuration, HUD, progression data, save/load logic, and Three.js version.
2. Preserve the existing SAVIOUR and HUNTERS formation maps, route logic, objectives, controls, physics, collision, combat, AI, camera, missions, audio, HUD layout, and win/fail conditions.
3. Do not modify Black Hole Mode, Final Collapse, Mode 01 Singularity Run, Mode 21, or unrelated modes.
4. Do not remove existing ship abilities, weapons, missions, routes, hazards, or UI. Add the ship-design layer through small, compatible changes.
5. Do not create a separate demo or duplicate game. Integrate into the existing project and reuse existing entity lifecycle/update/dispose patterns.
6. Avoid broad refactors. Keep changes scoped, typed, and reversible. If a required API is missing, adapt to the repository’s actual API rather than inventing imports or filenames.
7. Do not claim that the project builds or that models are tested unless the actual build and relevant runtime checks were performed.

## 2. Existing formation maps — keep exactly

### SAVIOUR: 9 ships
- 1 Lead Ship — front; convoy leader and primary escort objective.
- 2 Forward Guard ships — left/right forward protection.
- 3 Cargo ships — protected convoy cargo.
- 2 Rear Guard ships — left/right rear-mid protection.
- 1 Backend Ship — rear-most escort/support position.

Keep this nine-ship count and placement logic. Ship visual designs must not alter formation coordinates or role assignment.

### HUNTERS: preserve the existing map
- 3 Main Hunters — front.
- 2 Mid Hunters — middle-front.
- 1 Boss — 1000 HP, protected by 6 drones.
- 2 Mid Hunters — middle-back.
- 3 Main Hunters — rear.

Keep the existing formation layout and boss/drone relationships. Do not reinterpret or silently rebalance the map. Confirm the actual code’s unit-count semantics before changing any data; the listed roles remain authoritative.

## 3. Visual design language

### SAVIOUR faction
Primary materials: pearl white, titanium silver, cyan and electric blue. Use restrained teal for support/rescue equipment. Silhouette: readable, aerodynamic, protective, stable, and service-oriented. Use blue/cyan emissive engine cores and shield emitters. Avoid excessive spikes.

### HUNTER faction
Primary materials: graphite/black metal, gunmetal, violet, magenta, and controlled crimson accents. Silhouette: angular, swept, aggressive, compact-forward profile, sharp fins, and visible weapon hardpoints. Use purple/magenta emissive thrusters. Keep weapons as visual meshes unless the existing combat system already wires them to actual weapon logic.

### Drone faction
Small silhouettes, clear role readability, visible core, and a distinct outline per drone class. Keep the existing drone count and AI behavior.

## 4. SAVIOUR role-specific designs

Implement distinct model profiles through the existing ship factory/model builder. If the project uses glTF assets, use the existing asset pipeline and provide procedural fallback meshes if appropriate.

### A. Lead Ship
- Largest SAVIOUR combat/command hull, but do not make cargo ships visually ambiguous.
- Broad forward cockpit/nose, layered white/silver armor, cyan command-core lighting.
- Two or more visible shield emitter pods and a dorsal command spine.
- Clear front-facing silhouette and distinctive leader markings.
- Rank cosmetics should be attached to this hull without blocking the view or collision bounds.

### B. Forward Guard — left and right
- Two mirrored, medium interceptor/escort ships.
- Twin or split wings, reinforced forward armor, visible shield emitters.
- Cyan side thrusters and forward-facing defensive hardpoints.
- Mirror only the model’s visual transform; preserve role and existing formation positions.

### C. Cargo Ships — three
- Broad, stable transport hulls with boxy/armored cargo pods, bright cargo status lights, protected central containers, and defensive plating.
- Clearly distinguish cargo vessels from fighters even at normal chase-camera distance.
- Cargo visual damage/status should only reflect real existing health/objective state. Do not invent cargo damage gameplay.

### D. Rear Guard — two
- Medium support ships with rear-facing defensive turrets or visual hardpoints, cyan shield strips, and reinforced engines.
- Must read as escort/support ships, not cargo ships or main fighters.

### E. Backend Ship — one
- Rear-most support/repair silhouette, visible repair-module housings and cargo/tool pods.
- Green-teal or cyan service indicators.
- Do not grant repair abilities unless the current gameplay system already supports them or a separate explicitly requested gameplay change is implemented.

## 5. HUNTER role-specific designs

### A. Main Hunter — front and rear groups
- Fast, sharp, angular attack fighter; swept wings and separated wing tips.
- Dark gunmetal armor, violet/magenta emissive channels, limited crimson warning lights.
- Make front and rear groups use the same faction design family with orientation/marking variants, not different unit roles.
- Keep existing movement, weapons, targeting, health, and AI unchanged.

### B. Mid Hunter — middle-front and middle-back
- Medium-heavy hunter with a broader center hull, side armor fins, and visible weapon hardpoints.
- Purple reactor spine and stronger armor silhouette than the Main Hunter.
- Keep middle-front and middle-back placement as defined by the existing map.

### C. Boss — 1000 HP
- Large, unmistakable silhouette: segmented armor shell, central magenta reactor/core, layered side plates, and six clearly visible drone attachment/escort positions.
- The boss must retain its configured 1000 HP and current six-drone protection relationship.
- Do not change damage, boss phases, invulnerability, drone AI, targeting, or defeat conditions while implementing visuals.
- Do not display a false 1000 HP value if the game state uses a different configured value; use the actual source of truth.

## 6. Drone designs

Build separate visual profiles, reusing the project’s existing entity system:

1. **Scout Drone:** small sensor orb/core, compact antennae, blue scanning ring; reconnaissance appearance only unless existing logic grants scan abilities.
2. **Interceptor Drone:** compact pointed shell, twin side fins, bright central thruster; attack appearance only unless existing logic grants attacks.
3. **Guardian Drone:** circular/segmented shield emitter, broad ring silhouette, blue energy nodes; visual shield effects must not imply mechanics that are not implemented.
4. **Boss Guard Drone:** heavier armored pod, violet core, six attachment/escort variants positioned around the boss. Keep six active boss-guard units if that is the current design.

For boss-guard positioning, use the existing formation/attachment system. If none exists, add a small visual-only attachment layout that follows the boss transform and does not replace the existing AI or collision system.

## 7. Division progression — five base tiers

Division is a visual model tier. Preserve the project’s existing division IDs and progression semantics if already present. If no compatible system exists, map these labels to a new presentation-only configuration without rewriting saved player data.

- **D5 — Recruit:** compact baseline hull, minimal armor layers, one simple engine cluster, clean faction colors.
- **D4 — Pilot:** twin-engine treatment, modest wing extensions, more visible paneling and brighter faction lights.
- **D3 — Vanguard:** layered armor, additional side nacelles, clearer shield/reactor housings.
- **D2 — Elite:** split/swept wings, reinforced armor, refined emissive channels, distinctive faction markings.
- **D1 — Celestial:** premium silhouette details, crown/halo-like dorsal structures or wing fins, multiple engine elements, signature visual trim. Keep silhouette readable and performant.

Higher divisions should look more elaborate, but do not automatically alter combat statistics unless a separate existing gameplay progression system already explicitly maps division to stats.

## 8. Rank progression — four cosmetic bands

Use the player’s actual rank value and existing rank data. Do not invent a new rank economy.

- **R1–R3 — Cadet:** small rank badge/stripe, simple engine trail.
- **R4–R6 — Officer:** added armor trim, shoulder/wing markings, improved light patterns.
- **R7–R9 — Commander:** extra dorsal fin or compact ornament, more distinctive engine trail and entry effect.
- **R10 — Grandmaster:** unique but restrained crest, animated reactor accent, signature trail/arrival flourish if the existing VFX system supports it.

Rank should modify cosmetic attachments/materials/effects only. It must not block cockpit/nose, obscure role silhouettes, alter hitboxes, or secretly boost speed, damage, shields, HP, or AI.

## 9. Combining division and rank

Do not create and maintain a separate hand-authored model for every possible division × rank × role combination. Instead compose:

`Base role model + division visual package + rank cosmetic package + faction material palette`

Requirements:
- One stable model-builder/factory entry point, adapted to existing architecture.
- Typed configuration for faction, role, division, rank, and optional mirrored side.
- Sensible defaults for missing, invalid, or legacy progression values.
- Normalize external/save data at the boundary; do not let undefined values reach geometry/material creation.
- Preserve existing entity IDs, save fields, references, and role tags.
- Do not recreate meshes/materials every frame. Cache immutable geometry/material variants where safe and dispose resources using the project’s existing lifecycle.
- Avoid sharing mutable materials when one ship’s damage/flash effect could accidentally change every ship.
- Cosmetic attachment geometry must stay within a safe visual envelope and must not change physics or collision bounds.

## 10. Three.js / performance / lifecycle

- First inspect the installed Three.js version and existing renderer/entity architecture.
- Use existing project conventions for `Group`, meshes, geometries, materials, lights, and cleanup.
- Prefer instancing for repeated small panel lights/bolts where the current architecture supports it.
- Avoid excessive dynamic lights, transparent overdraw, high polygon counts, and per-frame allocations.
- Respect existing LOW/MEDIUM/HIGH/ULTRA or equivalent quality settings. Reduce optional glow, small details, and particles on low settings; never remove gameplay-critical objects.
- Every created geometry/material/texture must follow existing ownership/disposal rules.
- Preserve delta-time-safe updates and avoid NaN/Infinity from progression values.
- Do not migrate unrelated APIs or Three.js systems as part of the visual task.

## 11. HUD / garage / preview integration

- If the project already has a ship selection, garage, rank, or division UI, extend it in place.
- Display ship role/name, faction, division, rank, and a preview using the same model factory as gameplay wherever practical.
- Keep the existing HUD layout and controls. Do not add a large blocking menu during a race.
- Any rank/division label must be read from real game state; show a safe fallback if absent.
- Make UI responsive for mobile and desktop. Avoid introducing new mandatory controls.
- Add role labels for Lead, Forward Guard, Cargo, Rear Guard, Backend, Main Hunter, Mid Hunter, Boss, and the four drone types where appropriate.
- Do not claim a cosmetic ability is functional unless it is wired into existing gameplay logic.

## 12. Fix the known ConvoyHUD crash only if present in this repository

A previous runtime log reported:
`Cannot read properties of undefined (reading 'map')` in `<ConvoyHUD>`.

If this error still exists:
1. Find the exact `.map()` call and trace the data source to its owner.
2. Fix the root cause with typed defaults/normalization at the data boundary, rather than only hiding the exception.
3. Guard optional collections safely, for example with a validated fallback array where appropriate, but do not mask malformed critical state or silently remove HUD content.
4. Keep HUD arrays and data shape compatible with existing producers and saved state.
5. Add a focused regression test or validation for missing/legacy collection data if the test setup supports it.
6. Do not change unrelated HUD design or suppress the error globally.

Treat the Vite WebSocket reconnect error as a separate development-server/HMR issue unless evidence links it to the HUD crash. Do not change server settings without diagnosis.

## 13. Testing checklist

Run the repository’s actual available checks and report exact results:
- TypeScript type check and production build.
- Start game and verify no runtime errors during loading.
- SAVIOUR: verify exactly the existing nine ships and their old formation positions.
- HUNTERS: verify the existing front/mid/boss/rear formation and six boss-guard drones as configured.
- Confirm division and rank combinations render with safe defaults.
- Confirm all ship roles remain visually distinct at gameplay camera distance.
- Confirm rank/division changes do not change hitboxes, movement, weapons, health, AI, objectives, or formation.
- Confirm all resources are disposed correctly when entities are removed or scenes change.
- Test mobile/desktop HUD and all available graphics presets.
- If the HUD `.map()` crash reproduces, verify the fix with missing/legacy collection data.
- If a check cannot run, state that it was not run and why. Do not fabricate test results.

## 14. Required implementation report

At completion, provide:
1. Files changed and why.
2. How the new ship factory/configuration integrates with existing code.
3. Confirmation that SAVIOUR/HUNTERS formation and gameplay rules were preserved.
4. Build/type-check/runtime results with actual command output summaries.
5. Known limitations or assets still needed.
6. Any repository mismatch that prevented a requirement from being completed.

## 15. Final instruction for Google AI Studio

Implement this specification **inside the existing VOID-RIDER 3D repository**. Inspect before editing; reuse current APIs and entity lifecycle; keep the old formation map exactly; preserve unrelated modes and gameplay. Do not output a standalone demo, do not replace project files wholesale, and do not claim success without running the available checks. Focus only on the SAVIOUR/HUNTERS ship visual design, division/rank cosmetics, and the targeted ConvoyHUD `.map()` crash if it exists.
