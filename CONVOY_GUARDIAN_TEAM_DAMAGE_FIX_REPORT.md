# Convoy Guardian Saviour/Hunter combat fix

## Changes
- Added a 2.5-second post-spawn damage grace period to prevent unavoidable immediate defeats.
- Reduced incoming player damage by 30% in Saviour role to improve early escort survivability while retaining damage and defeat conditions.
- In Hunter role, player projectiles target opposing Saviour cargo instead of allied Hunter ships/drones.
- In Hunter role, enemy/AI projectiles cannot damage the player-controlled Hunter when crossing the player's position; they can still damage opposing convoy cargo.
- Corrected the Hunter victory-condition role check from `HUNTERS` to `HUNTER`.

## Validation
- Source-level edits applied to `src/game/convoy/convoyDirector.ts`.
- ZIP archive integrity is checked separately after packaging.
- TypeScript/build tests were not run because this extracted project has no `node_modules` directory. In-game behavior still requires runtime testing.

## Scope
This patch is limited to Convoy Guardian combat behavior. It does not modify Mode 01, Mode 21, Final Collapse, or Haven-04 logic.
