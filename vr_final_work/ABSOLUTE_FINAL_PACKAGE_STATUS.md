# VOID-RIDER 3D — Absolute Final Package Status

This package combines the latest available project source, its existing implementation notes, and the complete implementation contracts/addenda in `docs/absolute-final/`.

## Included source and requested features
- Existing VOID-RIDER 3D project source, modes, assets and documentation.
- Convoy Guardian controls patch: UP/DOWN/LEFT/RIGHT, hold-to-brake and hold-to-boost controls, connected through the current Convoy HUD/game loop as documented in `CONVOY_GUARDIAN_CONTROLS_PATCH_REPORT.md`.
- Convoy Guardian route, hazards, ship roles, boss/drone commands, parking dome and emergency escape specifications.
- Solid transparent spherical dome requirements: one authorized route-aligned passage, physical shell collision, and a gate that blocks passage while closed.
- All-ships-playable requirements for nine SAVIOUR ships and ten HUNTERS plus boss, with six defense drones remaining AI-only.
- Existing mode-preservation, adaptive controls, and error-fix documents.

## Validation status — read before use
- ZIP/archive integrity is checked after creation.
- A full TypeScript/Vite production build was not run because dependencies are not installed in this environment.
- The directional, brake and boost controls are included in the current source as documented in the controls patch report.
- **Direct player-control transfer for every SAVIOUR ship and every HUNTERS fighter, with drones AI-only, is a documented requirement and is not certified as fully implemented in this package.** Do not assume every requirement in the specification files has passed runtime testing.
- The implementation contracts are included for completeness; their presence does not itself prove that every described behavior is already implemented.

## Recommended verification
1. Install dependencies using the project's package manager.
2. Run `npm run lint` and `npm run build`.
3. Test ship selection and AI handoff for every SAVIOUR ship, every HUNTERS fighter, and the boss; verify drones cannot be selected.
4. Test the four directional buttons, brake, boost, pointer cancellation and touch release on mobile and desktop.
5. Test dome shell collisions from inside/outside, the single passage and gate authorization, docking clamps, and emergency departure.
6. Regression-test all existing game modes.
