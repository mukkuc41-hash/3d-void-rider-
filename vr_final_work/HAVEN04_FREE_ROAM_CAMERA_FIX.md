# HAVEN-04 Free-Roam, Camera Framing, and Deadline Panorama Patch

Source archive: `void-rider-3d (17).zip`

## Changes in this patch

- HAVEN-04 is treated as a free-roam destination after the player reaches its terminal doorway; it no longer enters the generic terminal escape cinematic.
- The ship starts just inside the dome and remains controllable using throttle, reverse/brake, and steering.
- Steering changes heading and applies a small lateral component, allowing circular movement inside the dome and travel back through the open doorway to the exterior. No artificial dome-radius clamp is applied.
- HAVEN-04 free-roam camera follows behind and above the ship at a wider framing distance so the full ship stays visible.
- At the authoritative `00:00` countdown boundary, the camera switches to a wide black-hole panorama for a successful Haven outcome. The existing missed-safe-zone failure panorama remains in charge when failure is triggered.
- Free-roam and panorama flags reset when Submode 10 is reset or the Haven system is disabled.

## Verification

- ZIP integrity is checked after packaging.
- The modified `src/game/gameEngine.ts` passed TypeScript syntax transpilation.
- A full application build and live gameplay tests were not run. Please verify controls, door traversal, camera framing, and the 00:00 camera transition in-game.
