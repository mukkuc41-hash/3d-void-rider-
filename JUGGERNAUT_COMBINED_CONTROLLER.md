# Juggernaut Combined Controller

## Mobile
- Analog flight joystick: smooth yaw/steering and pitch.
- D-pad: hold Up for forward thrust, Down for reverse thrust, Left/Right for lateral strafing.
- Boost and Fire remain separate hold buttons and can be used while steering.
- Ability buttons remain unchanged.

## Desktop
- Existing keyboard controls remain available alongside the joystick/D-pad HUD when visible.

## Safety behavior
- Directional buttons use pointer capture and clear their individual pressed state on pointer-up, pointer-cancel, or lost pointer capture.
- All directional inputs are released during HUD unmount and combat cleanup.
