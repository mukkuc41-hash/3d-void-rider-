# VOID-RIDER 3D — Titan Boss Redesign

## Scope
This update is scoped to the existing Juggernaut combat mode. It preserves the existing match flow, role configuration, flight physics, combat damage, target lock, auto-aim, pickups, and arena collision rules.

## Visual changes
- Adds a heavy Titan/Nemesis boss silhouette as child meshes of the existing boss ship: broad swept armor wings, shoulder armor, dorsal spine, front plow, paired forward cannons, illuminated cannon muzzles, reactor lens, and containment ring.
- Boss details inherit the existing ship transform and scale, so the visual additions do not change movement or collision physics.
- The reactor ring rotates during gameplay and accelerates in later boss phases.
- Reactor/core lighting shifts from its base faction color to orange in Phase 2 and red in Phase 3.
- Keeps the existing solid circular combat arena and the existing HUD/combat systems.

## Testing status
- The modified TypeScript file parses under the installed TypeScript command; the full project type-check/build could not complete because dependencies (including `three`, `react`, and server packages) are not installed in this environment.
- Run `npm install`, then `npm run build` and test APEX PREDATOR and SWARM HUNT in the browser before shipping.
