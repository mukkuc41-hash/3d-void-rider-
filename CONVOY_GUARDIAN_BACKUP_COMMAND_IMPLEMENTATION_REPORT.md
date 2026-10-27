# VOID-RIDER 3D — Convoy Guardian Backup Command Patch

## Implemented in the existing source
- Added the leader-only backup command panel to the existing Convoy Guardian HUD.
- Connected division selection and reinforcement requests through `App.tsx`, `GameEngine`, and `ConvoyDirector`.
- Added per-division cooldowns, a visible reinforcement ship, active deployment timer, and cleanup handling.
- D5 Recruit: restores up to 300 player shield, creates a visible shield bubble, and reduces incoming damage while active.
- D4 Pilot: triggers a route reconnaissance notification and clears radar service state so contacts are refreshed.
- D3 Vanguard: destroys up to six nearby physical asteroids and updates debris-cleared progression.
- D2 Elite: disables up to two nearby active route hazards and removes their collision state.
- D1 Celestial: attacks the nearest hostile drone/ship target when one is available.
- Tightened HUNTERS command permission to the designated `hunter_fang` / `MAIN_HUNTER`, rather than granting command access to every front/rear fighter role.
- Reset backup deployment and cooldown state during mission cleanup.

## Validation
- TypeScript/TSX transpilation syntax checks passed for all six modified source files.
- Full dependency-aware TypeScript type-check and Vite production build were not run because the ZIP does not include `node_modules`; network package installation was not available in this execution environment.
- Gameplay has not been launched in a browser, so visual layout and combat balance still require an in-game test.
