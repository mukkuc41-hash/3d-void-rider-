# VOID-RIDER 3D — Convoy Guardian Route Expansion Repair

## What was wrong
The active root project (`src/game/convoy/convoyEnvironment.ts`) built a single fixed spline from only ten control points. The 25-region campaign registry was used for region names/progression, but those definitions were not represented by physical region-transition geometry along the route. This made the campaign feel like a short fixed route with a long distance label.

## Changes in this archive
- Rebuilt the physical route spline from 201 sampled points distributed across 25 region sections, using the existing route as a backbone and adding bounded, smooth lateral/vertical sweeps while preserving the launch and terminal endpoints.
- Added 25 physical region gates, paired pylons, colored beacons, and deterministic region landmark silhouettes using each region's own palette and environment type.
- Anchored the gates to the actual route spline and added region ID/name/start/end metadata to their scene objects.
- Kept the existing convoy director, ship formations, combat, hazard, checkpoint, escape, and parking-dome systems intact; the existing director continues to own mission progress and victory validation.

## Validation status
- Static source inspection completed.
- TypeScript parser check reported no syntax errors in the changed file; module-resolution checks could not complete because dependencies were not installed in the execution environment and dependency installation timed out.
- A full Vite build and in-game visual test were therefore **not verified** in this environment. Run `npm install` and `npm run build` in the project environment, then test SAVIOUR and HUNTERS from launch through several region boundaries and the terminal approach.

## Important limitation
This repair makes all 25 regions physically represented along a longer, more detailed connected spline, but it does not claim a fully dynamic infinite/streamed world. The current route remains a finite campaign path with progress mapped to the 50,000 km campaign. True chunk-by-chunk runtime streaming would require a separate route-manager implementation and lifecycle integration.
