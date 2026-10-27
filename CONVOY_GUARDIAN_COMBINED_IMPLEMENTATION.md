# VOID-RIDER 3D — Convoy Guardian Combined Variants

This patch extends the existing project in place; it does not replace the application or remove unrelated modes.

## SAVIOUR
- Retains the existing escort director, four-ship convoy, seven mission events, 3D route, asteroids, repair pickups, hostile waves, extraction gate, damage, and victory/defeat flow.
- Adds a timed energy-barrier corridor with collision damage and cooldown, two connected alternate branch-lane geometries, and a broken orbital-ring structure.
- Aligns the player's forward vector with the route direction at mission start.
- Adds keyboard braking (`CTRL` or `X`), hold-to-shield (`C`), and an EMP pulse (`R`). EMP suppresses nearby hostile fire briefly and removes nearby enemy projectiles.
- Adds touch shield and EMP actions alongside existing mobile joystick, fire, and boost controls.

## HUNTERS
- Adds a selectable combat variant in the existing Convoy Guardian briefing.
- Spawns the specified 17-unit formation: 3 front main hunters, 2 forward-middle hunters, one 1,000 HP boss, 6 defensive drones, 2 rear-middle hunters, and 3 rear main hunters.
- Defensive drones orbit the boss and attack the player. Each destroyed defensive drone reduces boss damage resistance; the boss receives full weapon damage once all six are destroyed.
- Reuses the existing delta-time game loop, player flight, projectiles, collision system, combat audio, progression rewards, and results flow.
- Adds a boss-health bar, remaining hostile/drone telemetry, and variant-aware results presentation.

## Validation
- TypeScript/TSX syntax transpilation passed for all eight changed source files.
- A full Vite/TypeScript build could not be run in this environment because project dependencies are not installed and npm package retrieval timed out; offline installation confirmed the package cache does not contain the required dependencies. Run `npm install` and `npm run build` in an environment with registry access before deployment.
