# HAVEN-04 Expansion Update

Scope: Quantum Launch Pro → Black Hole Mode → Submode 10 — Final Collapse only.

## Implemented in this archive

- Preserves the existing open-dome Haven-04 platform, visible structural dome ribs, perimeter shield emitters, automatic bidirectional chamber doors, free passage, Bay 01 parking validation, and shield-volume checks.
- Adds three visible animated scanner planes inside the doorway. These are presentation feedback only; the existing physical position checks remain authoritative.
- Adds four visible Bay 01 docking arms. They extend progressively while the ship is physically inside the bay and speed-settled, retract if the player leaves before validation, and remain engaged after valid parking.
- Adds a pulsing final-30-second dome warning without introducing a second countdown or changing the authoritative 00:00 deadline.
- Changes the HAVEN-04 local countdown fallback from zero to the known 900-second event duration if both countdown sources are temporarily unavailable. This prevents a missing telemetry value from incorrectly blocking a valid parking settle while the actual authoritative Final Collapse deadline remains owned by the game engine.
- Keeps changes scoped to the Haven-04 module and its existing Submode-10 integration. Mode 01 Singularity Run and Mode 21 Black Hole Mode core systems are not intentionally changed.

## Existing systems retained

- Three-lap Submode-10 objective.
- Actual lap/checkpoint validation before lap advancement.
- Safe-zone success requires physically entering Bay 01, settling within the required speed threshold for the required duration, and completing validation before the deadline.
- Doors remain automatic and never lock the player inside.
- The main Final Collapse manager remains the authority for deadline failure/success; scanner and clamp visuals do not grant success by themselves.

## Validation

Run `npm install`, then `npm run lint` and `npm run build` in the project environment. This archive does not include `node_modules`, so a clean build should be confirmed in the target environment.
