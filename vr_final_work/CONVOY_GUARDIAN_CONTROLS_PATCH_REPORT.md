# Convoy Guardian Controls Patch Report

## Added in this patch
- Four on-screen directional buttons: UP, DOWN, LEFT, RIGHT, mapped to pitch and steering input.
- Hold-to-brake button, mapped to the Convoy Director's braking state and released on pointer/touch cancellation or HUD unmount.
- Existing hold-to-boost button retained and connected to the existing boost charge/speed system.
- Existing analog joystick, phone-tilt steering, fire, shield, EMP, and variant ability controls retained.
- Brake integration wired from ConvoyHUD through App.tsx and GameEngine to ConvoyDirector.

## Validation
- Archive integrity is checked after packaging.
- A TypeScript build/lint could not be completed in this environment because the project dependencies (React, Three.js, Vite, etc.) are not installed in the working directory. This is an environment limitation, not a successful build claim.

## Important scope note
This patch adds the requested direction, brake, and boost controls. It does **not** claim to have completed control-transfer logic for directly piloting every individual SAVIOUR convoy ship and every HUNTERS fighter while leaving defense drones AI-only. That requires a separate game-loop change to transfer AI ownership, movement, collision, camera, and HUD state safely. Do not treat that specific requirement as implemented by this controls patch.
