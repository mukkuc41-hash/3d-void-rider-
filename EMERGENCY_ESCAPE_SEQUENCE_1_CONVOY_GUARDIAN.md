# Emergency Escape Sequence 1 — Convoy Guardian SAVIOUR

1. The surviving lead ship and cargo frigates enter the underground basement hangar one at a time. Sensor hoops authorize each bay; the chamber gate opens for that vessel only.
2. Each ship aligns with its marked bay and physical parking clamps slide inward to secure the hull. The next ship is admitted only after the previous ship is marked DOCKED.
3. A three-second emergency lockdown closes the basement exit blast gate while the parked convoy remains physically clamped. Red warning lamps and the lockdown alert signal the phase change.
4. The segmented emergency exit gate unlocks and retracts. The player must pilot the interceptor through the exit sensor ring; victory is not granted merely for parking the convoy.
5. The mission ends successfully only after the player crosses the emergency exit with the convoy secured.

The implementation reuses the existing Convoy Guardian route, convoy state, docking bay locks, player flight controls, mission result flow, and scene cleanup. Hunters mode is not changed by this sequence.

Validation performed: source transpile syntax checks and ZIP integrity. Full Vite build and live gameplay testing require installed project dependencies.
