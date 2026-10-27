# Convoy Guardian — Phone Tilt Steering

## Change
- Added an in-mission **ENABLE PHONE TILT** control to the Convoy Guardian HUD.
- Once enabled, the phone's device-orientation sensor drives the same steer/pitch input used by the existing flight controller, for the entire active route.
- Tilting left/right steers the ship; tilting forward/back controls pitch.
- Calibrates to the phone's orientation when enabled, includes a 2-degree dead zone and clamps input to the normal -1..1 flight range.
- Requests motion permission on devices such as iOS Safari that require a user gesture.
- Shows status for calibration, active steering, unsupported sensors, or denied permission.
- Keeps the touch joystick available as fallback; joystick interaction is ignored while tilt steering is active.
- Does not change the HUNTERS/SAVIOUR mission logic, docking sequence, emergency escape sequence, or other game modes.

## Validation
- TSX transpilation syntax check passed.
- ZIP archive integrity checked after packaging.
- Full Vite build and physical-device sensor test were not available in this environment; test on the target phone over HTTPS (or localhost) because browser motion-sensor permissions/security requirements vary by platform.
