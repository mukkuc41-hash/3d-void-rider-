# VOID-RIDER 3D — Convoy Guardian Parking Dome update

This update refines the existing Convoy Guardian Parking Dome in the supplied project archive.

## Included
- Physical spherical Parking Dome with a transparent/open upper hemispherical canopy so the player can see the exterior.
- Basement-style parking deck, structural pillars, overhead girders, lighting, nine marked bays, sensor rings, visible gate leaves, and visible parking-lock/clamp props.
- Existing Emergency Escape Sequence 1 state machine and emergency exit blast gate retained and integrated.
- Existing sensor-ring color and gate/clamp animation retained; clamps are visual props and do not apply physics constraints to the player ship.
- Existing Convoy Guardian touchscreen controls and camera zoom/pinch support retained from the input archive.
- Existing connected route and emergency exit gate retained.

## Scope and verification
- Only `src/game/convoy/convoyEnvironment.ts` was changed for this Parking Dome update; this avoids modifying protected Black Hole / Final Collapse / Haven-04 systems.
- ZIP archive integrity was checked with `unzip -t` after packaging.
- A production build/typecheck was not run in this environment; do not treat this archive as build-tested. Please run `npm install`, `npm run lint`, and `npm run build` in the project environment.
