# VOID-RIDER 3D — HAVEN-04 Route Update Notes

This patch adds the initial Route 04 / HAVEN-04 path to Black Hole Mode, Submode 10:

- Adds `ROUTE_04_HAVEN_04` mission metadata with eight ordered mission stages.
- Registers `bh10_haven04_route` as an additional Submode 10 junction branch.
- Adds a green-themed physical terminal approach with sensing-gate visuals.
- Selects the Haven-04 mission when the player enters that route.
- Mounts the Haven-04 safe-zone module at the Route 04 terminal when that route is active.
- Tightens the 00:00 deadline test so merely entering a branch or approaching a route no longer counts as safe-zone success. Haven-04 requires its parking validation flag.
- Leaves Mode 01's Singularity Run code path untouched; route additions are scoped to the existing Black Hole Mode / Submode 10 junction.

## Verification status

The source archive was inspected and patched. A full TypeScript/build test could not be completed in this environment because dependency installation did not finish. Treat this ZIP as an implementation update requiring local validation, not as a build-verified release.

Recommended checks in Google AI Studio or locally:
1. Install dependencies and run `npm run lint` and `npm run build`.
2. Confirm all four routes appear after the Submode 10 route fork unlocks.
3. Drive Route 04 through the sensing gates into HAVEN-04; verify door motion and physical parking settling.
4. Confirm merely entering any route does not count as survival at `00:00`.
5. Confirm Routes 01–03 still behave as before, and Mode 01 / unrelated modes are unchanged.
