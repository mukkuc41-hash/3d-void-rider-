# VOID-RIDER 3D — Juggernaut Combat Upgrade Pack

This source patch builds on the existing Juggernaut combat manager and preserves the existing two combat modes and their role/faction logic.

## Added
- Boss/Titan weak-point nodes attached to the large boss hull. Critical hits deal bonus damage; destroyed nodes disappear and notify the player.
- Three escalating boss phases at approximately 66% and 33% hull health, with increased attack rate, acceleration, damage, and speed.
- Manual target switching with the `TAB` key and HUD button. Auto-aim remains a separate on/off option.
- Homing missile weapon (`R`) with target-seeking, energy cost, cooldown, and a HUD trigger.
- Defensive shield overdrive (`X`) with energy cost, cooldown, temporary shield regeneration boost, and visible shield intensity.
- Player energy and plasma-weapon heat/overheat system. Energy recharges over time; heat cools and firing resumes after the weapon cools sufficiently.
- Four pickup types: repair, shield, energy, and temporary damage boost. Pickups are visible 3D objects that bob/rotate and are collected by flying close to them.
- Expanding destruction burst effects and combat HUD readouts for boss phase, active weak points, energy, heat, missile cooldown, and shield cooldown.
- Swept projectile collision segment checks to reduce fast-projectile tunnelling.
- Accuracy now uses tracked player shots fired and hits rather than a fixed percentage.

## Controls
- `SPACE` / FIRE: primary cannon (hold to fire)
- `TAB` / SWITCH TARGET: cycle live enemies
- `R` / MISSILE: launch a homing missile at the selected/nearest target
- `X` / SHIELD: activate defensive shield overdrive
- `SHIFT`: boost (existing behavior)
- Existing role abilities remain available on their existing controls/HUD.

## Validation status
- TypeScript/TSX syntax parsing passed for the modified source files.
- A full Vite/esbuild build and live in-game test were not completed in this environment because project dependencies could not be installed before the package install timed out. Please run `npm install` and `npm run build` in the project environment and test both APEX PREDATOR and SWARM HUNT before publishing.
