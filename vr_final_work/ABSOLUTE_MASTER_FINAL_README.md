# VOID-RIDER 3D — ABSOLUTE MASTER FINAL PACKAGE

This package consolidates the latest available project source folder, project assets and existing docs, all known standalone implementation contracts, and prior project ZIP variants into one archive.

## Package map
- `src/`, `public/`, `scripts/`: current available application source, assets and project scripts.
- `docs/absolute-final/`: master implementation contracts/addenda for requested features.
- `docs/reference-specs/`: other feature requirements and implementation notes.
- `reference_archives/`: earlier ZIP snapshots preserved for reference; these are historical variants, not merged executable source trees.
- `ABSOLUTE_FINAL_PACKAGE_STATUS.md`: validation limits and outstanding requirements.

## Requested feature areas represented
- Convoy Guardian formations and ship selection: 9 SAVIOUR ships and 10 HUNTERS plus boss; drones remain AI-only.
- Directional UP/DOWN/LEFT/RIGHT controls, brake, boost, mobile/touch/tilt and desktop control requirements.
- 15,000 km route display, branches/checkpoints and nine hazards.
- Boss and drone command system.
- Parking Dome: transparent but physically solid shell, single route-aligned passage, physical gate, docking bays/clamps, and emergency exit through the same passage.
- Emergency Escape Sequence 1.
- Mode 21 Black Hole / Final Collapse, 100-event timeline, destruction/event-horizon ending, and preservation of existing modes.
- Adaptive website/game performance, responsive layout, resource management, optimistic UI behavior, and error fixes.

## Critical status statement
This is a **consolidated master package**, not a guarantee that every requested feature is fully implemented or verified. Archive integrity can be checked; the full TypeScript/Vite build and runtime/cross-device tests have not been completed in this environment. The all-ships direct-control transfer, every dome collision/gate case, and full adaptive performance behavior remain to be verified against the live app. Specifications are included for completeness but do not prove implementation by themselves.

## Recommended validation
1. Install dependencies using the project's package manager.
2. Run `npm run lint` and `npm run build`.
3. Test ship selection/AI handoff for all SAVIOUR ships, all HUNTERS and the boss; confirm drones cannot be selected.
4. Test arrow controls, brake, boost, input cancellation, tilt permission/calibration and gamepad fallback.
5. Test dome shell collisions from inside and outside, one authorized passage, gate lock/unlock, clamps, and emergency departure.
6. Regression-test all existing modes and verify responsive layouts on mobile/tablet/desktop.
