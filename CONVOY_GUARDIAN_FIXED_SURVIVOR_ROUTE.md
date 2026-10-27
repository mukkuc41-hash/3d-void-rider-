# Convoy Guardian — Fixed Visible Survivor Route

## Changes
- Added a continuous cyan guide tube that follows the mission's existing 3D Catmull-Rom route from departure to the spherical cargo parking dome approach.
- Added repeated directional chevrons along the spline so the intended direction stays readable around bends and through mission hazards.
- Kept the existing checkpoint rings, route branches, barriers, asteroid corridor, dome, and emergency escape flow.
- Updated survivor fleet movement so each living convoy ship samples the same fixed route spline at its own progress value. Escort ships trail the lead ship according to their formation spacing and follow the route's local tangent rather than cutting straight across turns.
- Dead ships remain hidden and do not continue along the route; docking still handles surviving ships at the end.

## Validation
- TypeScript transpile syntax checks passed for `convoyEnvironment.ts` and `convoyDirector.ts`.
- ZIP archive integrity checked after packaging.
- Full production build and live gameplay have not been verified in this environment.
