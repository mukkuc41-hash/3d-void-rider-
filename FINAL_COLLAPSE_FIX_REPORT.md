# VOID-RIDER 3D — Submode 10 Final Collapse Repair Notes

Source archive: `void-rider-3d (16).zip`

## Changes made

### Lap and checkpoint tracking (`src/game/gameEngine.ts`)
- Submode 10 checkpoints must be reached in order; checkpoint re-entry cannot skip ahead.
- Physical checkpoint proximity requires forward alignment in Submode 10.
- A Submode 10 lap is accepted only on the forward spline wrap after all intermediate checkpoints are complete.
- A crossing is consumed once and re-armed only after the ship leaves the finish region.
- The stricter logic is scoped to Black Hole Mode / Submode 10; legacy lap detection remains for other modes.
- Existing 3-lap setup for Final Collapse remains in place, and HAVEN-04 remains gated to the lap-3 approach window.

### Countdown and premature capture (`src/game/FinalCollapseManager.ts`, `src/game/gameEngine.ts`)
- The visible Black Hole cinematic countdown is used as the authoritative clock for Final Collapse event timing and route/safe-zone deadline checks.
- Submode 10 collapse-front and route-consumption failures are suppressed before the authoritative countdown reaches 00:00.
- Catastrophe impact forces are neutralized for the player before 00:00 in Submode 10 while environmental presentation continues.
- A hull-destruction callback cannot start the black-hole failure/capture sequence during the active Submode 10 countdown; the ship remains present and controllable.
- At the deadline, the existing safe-zone outcome path remains responsible for deciding success versus failure.

### Scope protection
- The deadline guard is explicitly passed only for Black Hole Mode / Submode 10.
- Other Black Hole submodes and other game modes retain their existing FinalCollapseManager failure behavior and legacy lap detection.
- No Mode 01 Singularity Run-specific manager implementation was intentionally modified.

## Validation performed

- ZIP integrity check passed on the source archive before edits.
- TypeScript syntax transpilation passed for the two modified TypeScript files (zero syntax diagnostics).
- Full TypeScript/build and in-game tests could not be completed in this environment because project dependencies are not installed; `npm install` timed out. This archive is therefore **not represented as fully build-verified or gameplay-tested**.

## In-game acceptance tests still required

1. Complete each intermediate checkpoint in order and verify the Submode 10 lap counter advances once per forward start/finish crossing.
2. Drive backwards, re-enter checkpoints, and remain near the finish line; confirm no duplicate lap count.
3. Run the countdown above 00:00 while the collapse front reaches the player; confirm no capture/failure cinematic begins early.
4. Verify route 01, route 02, and route 03 each require their existing physical terminal/safe-zone completion conditions.
5. Verify HAVEN-04 is exposed only on lap 3 before the finish and success requires entry into Bay 01, speed settling, and the existing settle timer before 00:00.
6. At 00:00, verify secured routes survive and an unsecured ship triggers the existing visible Final Collapse failure sequence.
7. Regression-test Mode 01, other Black Hole submodes, and the remaining race modes.
