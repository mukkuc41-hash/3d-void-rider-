# Convoy Guardian — 40,000 km Physics Route Update

- Increased Convoy Guardian route telemetry from 15,000 km to 40,000 km (an additional 25,000 km).
- Scaled the physical Catmull-Rom route waypoints by 40,000 / 15,000 so the world-space route is longer too.
- Kept the hostile engagement corridor at the requested absolute distance of 7,500–9,500 km by deriving its normalized progress from the new 40,000 km route length.
- Route distance markers and remaining-distance telemetry use the new route length.
- Scope is Convoy Guardian files only; other game modes were not intentionally changed.

Validation: ZIP archive integrity can be checked, but no full TypeScript build or live physics test was run in this environment. Please test route collision alignment, checkpoint timing, and both Saviour/Hunter variants in Google AI Studio.


## Combat and hazard update
- Combat corridor updated to 25,000–35,000 km on the 40,000 km route.
- Scout wave begins within the corridor; the second heavier ambush wave begins at 30,000 km.
- Route hazards increased from 9 to 21 distinct hazard placements, with a dense cluster through the combat corridor and additional hazards before and after it.
- Hazard meshes remain visible and use the existing route-hazard collision/damage system.
