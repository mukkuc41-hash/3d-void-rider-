# Convoy Guardian patch report

## Implemented in this source patch
- Added six dedicated press-and-hold touch controls: UP, DOWN, LEFT, RIGHT, FORWARD, BACKWARD.
- Added a distinct six-axis input contract from ConvoyHUD -> App -> GameEngine -> ConvoyDirector.
- Vertical and lateral inputs apply acceleration on the ship-local up/right axes; forward/backward applies acceleration along the ship-local forward axis. These are not aliases for pitch/yaw.
- Buttons support pointer down/up, pointer leave, pointer cancellation, and window blur / document visibility cleanup. Existing joystick and ability buttons are retained.
- Existing SAVIOUR/HUNTERS mode selection is retained.

## Not verified / still required
- This environment has no installed node_modules, so a full Vite/TypeScript production build and mobile/desktop runtime test could not be run.
- Per-formation-ship direct control transfer (switching among all 9 SAVIOUR ships and 10 HUNTERS plus boss while keeping the rest AI-driven) is not implemented by this patch. The current mission player remains the separate player craft. This must be completed separately before claiming all formation ships are playable.
- Six-axis touch controls are implemented for Convoy Guardian only; controls are not intended to replace the existing joystick.
