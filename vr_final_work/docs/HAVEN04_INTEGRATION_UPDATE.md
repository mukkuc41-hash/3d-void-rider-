# HAVEN-04 integration update

Scope: Quantum Launch Pro → Black Hole Mode → Submode 10 — Final Collapse only.

Changes in this update:
- `src/game/finalCollapse/Haven04SafeZone.ts`: adds visible dome meridian ribs and support rings; expands bidirectional doorway sensing by a ship-bounds margin; keeps shield/bay telemetry tied to actual zone checks; and gates its local parking timer behind the unlock state.
- `src/game/gameEngine.ts`: mounts HAVEN-04 at the end of the Submode-10 shelter ramp, updates its automatic doorway state while the mode is active, resets its local state with the race, and disposes it during engine teardown or when leaving Submode 10.
- The existing Final Collapse manager remains the authority for overall survival/failure. HAVEN-04's local parking telemetry does not call the global survival/escape-success APIs.

Validation note: TypeScript was checked with the globally available compiler, but this extracted archive has no installed `node_modules`; the check therefore cannot complete because project dependencies and their type declarations are missing. Run `npm install` (or the project's normal package install) and then `npm run lint` / `npm run build` to complete validation.
