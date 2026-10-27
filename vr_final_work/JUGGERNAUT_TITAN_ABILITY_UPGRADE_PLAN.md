# VOID-RIDER 3D — Juggernaut, Hunter, Survivor & Titan Boss Ability Upgrade

Integrate into the existing combat director and HUD. Preserve the current match modes, arena, movement, targeting, health, revive, and result systems; do not create a parallel combat system.

## Juggernaut / Titan
- **Siege Core:** high armor and reduced knockback, balanced by slower movement while shielded.
- **Titan Bulwark:** temporary shield with damage cap and cooldown.
- **Groundbreaker Shockwave:** telegraphed expanding ring that damages and pushes enemies in range.
- **Overdrive:** short boost burst with energy/heat cost.
- **Targeting Array:** briefly highlights visible enemies and weak points; no shooting through geometry.
- **Drone Assassination:** limited-use hunter-killer drone physically travels toward a selected visible target. Target receives warning and can dodge or shoot it down. Apply damage only on collision; enforce range, cooldown, and damage cap.
- **Execution finisher:** optional only when target is low-health and exposed, with clear telegraph and counterplay.

## Hunter
- **Predator Scan:** pulse highlights Titan weak points briefly.
- **EMP Harpoon:** projectile briefly slows Titan or disrupts shield; no permanent lockout.
- **Cloak Dash:** short evade/cloak burst; firing ends cloak.
- **Hunter Drone:** scouting/marking drone that reveals targets without guaranteed damage.
- **Team Mark:** share target location with hunters for limited time.

## Survivor
- **Emergency Boost:** short acceleration burst with cooldown.
- **Phase Evade:** brief damage-reduction/evasion window.
- **Decoy Beacon:** destructible decoy that attracts AI targeting temporarily.
- **Repair Pulse:** limited-charge gradual self/ally repair.
- **Revive Link:** faster revive near disabled ally; damage interrupts or slows it.
- **Trap Mine:** visible deployable mine that slows or damages the Titan after a clear trigger.

## Shared implementation requirements
- Each ability tracks cooldown, duration, energy/charge cost, range, and HUD state.
- Update timers through combat simulation delta time; no free-running browser timers.
- Validate role/faction, alive/disabled state, range, line of sight, cooldown, energy, and input edge.
- Align telegraphs and audio with real damage timing. Use existing collision/damage logic and clean up projectiles/effects.
- No invisible damage, teleport kills, guaranteed drone hits, or bypassing arena collision.
- If networking exists, authoritative damage/cooldowns must be resolved by simulation/server, not client-only visuals.
- Keep tuning values centralized; test on all eight ships and mobile/desktop controls.

## Suggested starting tuning (playtest required)
| Ability | Initial effect | Cooldown |
|---|---|---|
| Titan Bulwark | 4 s shield window | 14 s |
| Groundbreaker | 0.8 s warning, arena-scaled radius | 12 s |
| Overdrive | 2.5 s, 1.6x acceleration | 10 s |
| Drone Assassination | one dodgeable drone; damage capped at 30% target max health | 24 s |
| Predator Scan | 4 s mark | 12 s |
| EMP Harpoon | 1.8 s slow/shield disruption | 16 s |
| Cloak Dash | 2 s evade | 13 s |
| Emergency Boost | 2 s | 9 s |
| Phase Evade | 0.65 s | 11 s |
| Decoy Beacon | 5 s | 18 s |
| Repair Pulse | heal over 3 s | 20 s |

These are design targets, not tested balance values; adapt distances to the game world scale.

## Acceptance checklist
1. Apex Predator: 1 Juggernaut vs 7 Hunters; role abilities correctly restricted.
2. Swarm Hunt: 7 Survivors vs 1 Boss; distinct survivor and boss kits.
3. Movement + boost + fire can be used together on desktop and touchscreen.
4. Drone warning, tracking, collision, damage, expiry, and cleanup all work.
5. HUD cooldowns and shield/health values match simulation state.
6. Existing arena boundaries, win/loss conditions, and unrelated modes remain unchanged.
