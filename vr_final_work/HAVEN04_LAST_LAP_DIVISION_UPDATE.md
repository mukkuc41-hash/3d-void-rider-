# HAVEN-04 Last-Lap Division Update

- Removed HAVEN-04 from the shared terminal fork.
- Added a dedicated one-route junction at spline T 0.825–0.905, before the start/finish wrap.
- The branch diverges laterally/elevationally from the main track and uses a terminal extension; it does not rejoin the circuit.
- It is hidden by default and becomes visible only in Black Hole Mode / Submode 10, on lap 3, while approaching the finish line (spline T 0.74–0.965).
- Kept the normal lap crossing code active so the 3-lap counter can advance.
- The player must explicitly select the Haven-04 shortcut branch; entering the route alone is not marked as safe-zone success.

Build/in-game validation still required. In particular, verify route choice controls can select the one-route SHORTCUT fork on desktop and mobile, and test branch/collision/safe-zone handling in the actual game.
