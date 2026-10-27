# Convoy Guardian — 15,000 km Hazard & Ability Update

## Route scale
- Mission telemetry represents a **15,000 km** long-haul corridor and shows remaining distance in kilometres.
- The underlying Three.js spline remains compact for rendering and steering performance; route progress maps linearly to the 15,000 km mission distance.
- The continuous cyan route ribbon, directional chevrons, checkpoints, branches, cargo dome, sequential survivor docking, emergency gate, and calibrated phone-tilt steering are preserved.

## New hazard families
1. **Rotating Blades** — spinning cross-arms; collision damages hull and bleeds velocity.
2. **Gravity Mine** — pulsing core and orbital rings; impact slows the ship sharply.
3. **Plasma Lattice** — timed active/inactive beam grid; pass during its safe phase.
4. **Debris Wall** — dense shard cluster with a wide collision envelope.
5. **Pulse Turret** — industrial turret silhouette; currently functions as a physical impact hazard, not a separate projectile AI.
6. **Gravity Well** — pulsing field; impact causes a stronger speed loss.
7. **Orbital Shards** — scattered rotating fragments.
8. **Phase Gate** — timed beam barrier with an active window.
9. **Singularity Surge** — final high-damage hazard with the strongest speed penalty.

Hazards have warning rings, distinct colors and geometry, timed behavior for the beam-based types, collision damage, impact notifications, and a short collision cooldown to avoid applying damage every rendered frame. Shielding reduces hazard damage.

## Signature variant abilities
- **SAVIOUR — Nanite Burst (V):** 24-second cooldown; repairs up to 110 hull and 85 shield per living convoy ship, and restores up to 45 player shield.
- **HUNTERS — Hunter Overdrive (V):** 24-second cooldown; 8 seconds of 38-damage twin cannon shots instead of 22, restores up to 45 boost charge, and briefly disrupts nearby enemies.
- Existing boost, shield and EMP controls remain available. The signature ability can also be triggered by calling `activateVariantAbility()` from a future touch HUD button.

## Validation
ZIP integrity and TypeScript transpile/syntax checks should be run after extraction. This environment has previously lacked installed dependencies, so a full Vite production build and live gameplay test may not be available; do not treat syntax validation as proof of runtime behavior.
