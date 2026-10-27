# VOID-RIDER 3D --- CONVOY GUARDIAN

## ABSOLUTE FINAL IMPLEMENTATION MASTER PROMPT

### SAVIOUR + HUNTERS \| 50,000 km Campaign \| 25 Regions \| Fleet War \| Boss Battles \| Guardian Space Terminal Parking Dome

**Purpose:** Use this document as the master implementation
specification inside Google AI Studio or with an agent modifying the
existing VOID-RIDER 3D repository. This is an implementation request,
not a claim that the features are already implemented.

------------------------------------------------------------------------

# 0. NON-NEGOTIABLE PROJECT RULES

You are modifying the user's EXISTING VOID-RIDER 3D project. Do not
create a separate demo, rebuild the project from scratch, replace the
game with a mockup, or remove unrelated working features.

1.  First inspect the entire repository, package configuration, entry
    points, game engine, route systems, ship controllers, AI, collision,
    HUD, menus, audio, save data, and current Convoy Guardian
    implementation.
2.  Identify the actual architecture and use the existing conventions.
    Do not assume filenames or invent imports before inspecting the
    repository.
3.  Preserve all working features and all unrelated modes. Make the
    smallest safe set of changes that accomplishes the requirements.
4.  Do not overwrite SAVIOUR when adding HUNTERS, or overwrite HUNTERS
    when updating SAVIOUR.
5.  Do not modify protected modes or systems unrelated to this feature.
    If shared infrastructure needs a change, make it backward-compatible
    and minimal.
6.  Use the existing stack. For this project, use Three.js/WebGL and the
    repository's existing JavaScript/TypeScript/HTML/CSS/Web Audio
    architecture. Do not substitute Python Ursina or a different game
    engine.
7.  Do not fake gameplay with static screenshots, decorative-only
    objects, a fake minimap, distance-only success, teleportation, or
    cinematic-only victory.
8.  All important entities must have real transforms, update logic,
    collision or interaction where applicable, state, and clear
    lifecycle handling.
9.  Do not claim a feature is complete unless its implementation and
    tests verify it. If a feature cannot be completed safely, document
    the exact limitation and remaining work.
10. Do not leave placeholder TODOs, empty handlers, mock health bars,
    fake boss damage, or buttons with no action in systems declared
    complete.
11. Avoid destructive refactors. Preserve existing public APIs where
    possible and provide compatibility adapters when required.
12. At completion, provide the modified project files or ZIP if the
    environment permits, a concise change summary, exact verification
    results, and any known limitations.

## 0.1 Initial audit and implementation report

Before editing: - List the repository's actual entry points, game loop,
managers, controllers, route/path classes, UI/menu code,
save/progression code and relevant tests. - Trace how the current Convoy
Guardian mode is launched and how race/mission state is created and
destroyed. - Find existing ship models, formation logic, weapons,
health/shields, collision layers, checkpoint systems, cinematic
director, audio and mobile controls. Reuse compatible code. - Identify
conflicts and likely regressions. - Create a change plan mapped to real
files. - Do not ask the user to re-upload files if the repository is
already available to the current execution environment. If no project
files are available, ask for the latest ZIP and do not pretend to have
modified it.

------------------------------------------------------------------------

# 1. TOP-LEVEL GAME MENU

Add or update a clearly visible **CONVOY GUARDIAN** entry under
VOID-RIDER 3D's existing menu. Opening it shows exactly two separate
playable mode cards:

## 01 --- SAVIOUR

Role: escort, rescue, exploration, convoy survival, environmental
hazards and campaign completion.

## 02 --- HUNTERS

Role: aggressive hunter formation, tactical combat, drone defense
systems, fleet warfare and boss battles.

Each card must show its own description, objectives, controls/help,
difficulty and launch button. Each launch button must start the correct
mission configuration. Switching modes must not reuse stale mission
data.

The two modes may share rendering, physics, input, camera, audio, ship
components, collision utilities, route generation, projectile utilities
and reusable HUD components. They must NOT share mutable mission state,
formations, mission objectives, win/fail state, boss state, enemy state
or progress variables.

Use separate typed/state-owned structures equivalent to: -
`saviourMissionState` - `huntersMissionState`

Use actual naming and conventions consistent with the repository. Do not
blindly add duplicate global state if a mission/session manager already
exists.

On entering, leaving, restarting or switching modes: - clean up timers,
event listeners, AI tasks, projectiles, particles, audio emitters and
spawned entities owned by that mission; - prevent duplicate update loops
and listeners; - reset only the selected mode's transient state; -
preserve the other mode's saved campaign progression; - ensure returning
to the menu works reliably.

------------------------------------------------------------------------

# 2. MODE 01 --- SAVIOUR: NINE-SHIP ESCORT CAMPAIGN

## 2.1 Required convoy formation

SAVIOUR has exactly nine principal convoy ships in the default
formation: 1. One lead ship. 2. Two forward guards. 3. Two mid guards.
4. Three cargo ships. 5. One rear guard.

The intended visual layout is adjustable and should remain legible in
3D. Use real ship entities, transforms, steering, formation slots and
collision-aware movement. Formation spacing, altitude/depth offsets, and
formation presets should be adjustable through gameplay settings or
mission commands.

Recommended default roles: - Lead ship: route guidance and convoy
command. - Forward guards: intercept threats ahead of the convoy. - Mid
guards: protect the central formation and cargo. - Cargo ships 1--3:
transport mission payloads with individual integrity. - Rear guard:
detect and engage pursuers approaching from behind.

Do not make the nine ships simply copy the player's position. Each ship
should follow a formation slot with smoothing, speed matching, obstacle
avoidance, separation behavior, catch-up limits and recovery if
temporarily displaced. Prevent collisions among allies.

## 2.2 Formation commands

Implement, if compatible with existing controls: - Tight formation:
reduce spacing for dangerous passages. - Wide formation: increase
spacing where hazards allow it. - Shield formation: escort ships
prioritize defending vulnerable cargo. - Combat formation: guards engage
hostile threats. - Emergency regroup: ships navigate back toward
assigned slots. - Hold/advance command where mission design supports
it. - Individual ship status and optional select/inspect action.

AI must obey physical obstacles and route boundaries. Commands should
have visible feedback and not cause instant teleportation.

## 2.3 Escort objectives

Primary objectives: - Protect the lead ship. - Protect all three cargo
ships according to the selected mission's required survival rules. -
Traverse physical route segments and checkpoints. - Respond to enemy
ambushes. - Complete required rescue/repair/defense objectives. - Reach
the destination and satisfy the mission's actual completion criteria.

Support optional objectives such as: - rescue stranded pilots or allied
ships; - retrieve salvage and supply crates; - defend a repair
station; - disable a weapon platform; - save a civilian evacuation
pod; - scan an abandoned research station; - escort reinforcements; -
take a risky shortcut for a bonus reward.

A rescue must involve locating a target, reaching it physically,
resolving the danger or interaction, and escorting/recovering it to a
validated destination. Touching an object alone must not grant every
rescue.

## 2.4 Per-ship condition and recovery

Each convoy ship needs an appropriate subset of: - hull health; - shield
energy and recharge; - armor/damage resistance; - engine condition and
speed penalties; - cargo integrity for cargo ships; -
disabled/destroyed/rescued state; - repair eligibility; - formation slot
and navigation target; - damage feedback and radio/status event.

Disabled ships may require towing, repair or escort. They should not
disappear without a defined reason. Ship loss must update mission
conditions and the end-of-mission report. A lost ship may be recoverable
at a checkpoint only if the mission explicitly supports that mechanic.

Do not force every cargo loss to instantly end every mission. Configure
clear per-mission required survival thresholds, optional objectives and
graded outcomes.

## 2.5 SAVIOUR victory/failure

Victory occurs only when: - required route/checkpoints are actually
completed; - required escort/rescue objectives are satisfied; - required
ships meet mission survival rules; - any final landing/docking
requirements are physically validated for the campaign finale.

Failure can occur through: - critical convoy/lead loss when
configured; - required cargo losses beyond allowed limits; - player
destruction where the mission rules require it; - route/time limit
expiration if that mission uses a timer; - an unrecoverable objective
failure.

Offer checkpoint recovery/retry where designed. Never report success
based only on distance, a timer reaching zero, a cinematic, or reaching
a rough coordinate without required validation.

------------------------------------------------------------------------

# 3. SAVIOUR --- 50,000 km / 25-REGION CAMPAIGN

The designed campaign target is **50,000 km total route distance**,
divided into **25 regions of approximately 2,000 km each**. The total
must be calculated from actual connected route traversal and not
artificially advanced by a counter.

Use streamed route segments, deterministic/seeded generation where
appropriate, checkpoints and bounded active simulation so the full
campaign does not need every object loaded simultaneously. Each region
must have connected entrance and exit routes and a distinct gameplay
identity. The list below is the target campaign design; implement as
much as the existing repository safely supports and report any
unfinished regions truthfully.

## Region 01 --- Guardian Departure Zone

Environment: orbital launch platforms, docking structures, supply
towers. Hazards: launch debris, unstable acceleration rings, moving
platforms. Mission: establish formation, tutorialize escort commands,
survive departure. Signature encounter: Guardian Gatekeeper.

## Region 02 --- Crimson Nebula

Environment: red/purple nebula volumes, gas pillars, illuminated debris.
Hazards: reduced visibility, plasma bursts, sensor range reduction.
Mission: navigate by beacons and protect the lead ship. Encounter:
Crimson Interceptor.

## Region 03 --- Shattered Asteroid Belt

Environment: fractured asteroids, mining structures, refineries.
Hazards: moving boulders, debris collisions, collapsing tunnels.
Mission: choose between a safe long route and a risky salvage route.
Encounter: Asteroid Breaker.

## Region 04 --- Frozen Expanse

Environment: ice planets, frozen rings, frost-covered structures.
Hazards: ice shards, reduced maneuverability zones, brittle platforms.
Mission: protect cargo while traversing a narrow icy corridor.
Encounter: Cryo Destroyer.

## Region 05 --- Solar Furnace

Environment: star-facing solar collectors, heat shields, glowing
structures. Hazards: solar flares, heat buildup, shield stress. Mission:
activate protection systems and cross timed exposure zones. Encounter:
Solar Warden.

## Region 06 --- Abandoned Megacity

Environment: ruined orbital city, giant towers, suspended transit
routes. Hazards: falling structures, blocked corridors, collapsing
bridges. Mission: rescue survivors and navigate debris. Encounter: Ruin
Enforcer.

## Region 07 --- Quantum Forest

Environment: crystalline artificial forest, energy trees, alien
structures. Hazards: energy roots, moving branches, unstable portal-like
route gates. Mission: scan structures and activate a safe route.
Encounter: Quantum Stalker.

## Region 08 --- Ion Storm Frontier

Environment: electric clouds, storm generators, ionized structures.
Hazards: electrical arcs, electromagnetic interference, disrupted
targeting. Mission: restore navigation beacons under pressure.
Encounter: Storm Harvester.

## Region 09 --- The Broken Ring

Environment: shattered planetary ring, industrial bridges, rotating
fragments. Hazards: rotating ring segments, narrow crossings, moving
debris. Mission: time passage through ring openings and defend the
convoy. Encounter: Ring Ravager.

## Region 10 --- Gravitational Canyon

Environment: deep space ravines, floating rock walls, anchored
platforms. Hazards: gravity fields, changing trajectory, falling rocks.
Mission: select stable route branches and avoid separation. Encounter:
Gravity Colossus.

## Region 11 --- Alien Ocean World

Environment: ocean planets, floating platforms, water domes and geysers.
Hazards: pressure waves, geyser bursts, flooding enclosed corridors.
Mission: protect a research payload and recover a stranded unit.
Encounter: Abyssal Hunter.

## Region 12 --- Bio-Mechanical Frontier

Environment: living-metal architecture, organic machinery, moving
tendrils. Hazards: corrosive spores, grasping structures, reactive
surfaces. Mission: disable hostile bio-mechanical infrastructure.
Encounter: Bio-Titan.

## Region 13 --- Cargo Graveyard

Environment: derelict freighters, enormous cargo yards, container
fields. Hazards: drifting containers, loose cargo, unstable wreckage.
Mission: recover supplies without losing cargo ships. Encounter: Salvage
King.

## Region 14 --- Volcanic Moon

Environment: lava rivers, magma chambers, basalt towers. Hazards:
eruptions, molten debris, heat damage. Mission: cross active volcanic
corridors and protect engine systems. Encounter: Magma Juggernaut.

## Region 15 --- Mirror Dimension

Environment: reflective structures, mirrored route corridors, optical
labyrinths. Hazards: decoy routes, sensor confusion, misleading visual
reflections. Mission: use actual beacons/scans to identify the valid
path. Encounter: Mirror Phantom.

## Region 16 --- The Warfront

Environment: fleet fortresses, wreckage fields, artillery platforms.
Hazards: crossfire, mines, artillery barrages, hostile fighters.
Mission: escort allies through an active battle. Encounter: War
Commander.

## Region 17 --- Black Ice Corridor

Environment: dark icy structures, frozen debris, dim navigation lights.
Hazards: low maneuverability, hidden fractures, sensor-limited objects.
Mission: maintain formation in a dangerous narrow corridor. Encounter:
Frost Reaper.

## Region 18 --- The Machine Empire

Environment: automated factories, colossal robotic assembly lines,
industrial towers. Hazards: mechanical arms, laser grids, moving
platforms. Mission: sabotage or bypass enemy manufacturing
infrastructure. Encounter: Forge Overlord.

## Region 19 --- Crystal Nebula

Environment: giant crystal formations, refractive clouds, luminous
fragments. Hazards: shattering crystals, focused energy beams,
ricocheting debris. Mission: navigate beam paths and protect the cargo
formation. Encounter: Prism Devourer.

## Region 20 --- The Silent Expanse

Environment: dark ruins, abandoned navigation towers, silent stations.
Hazards: sensor blackout, stealth mines, nearly invisible debris.
Mission: scan routes and escort the convoy using limited information.
Encounter: Silent Pursuer.

## Region 21 --- The Fortress Belt

Environment: armored defense platforms, shielded fortresses, gun towers.
Hazards: shield walls, missile batteries, rotating defense systems.
Mission: disable defenses or choose a costly alternate route. Encounter:
Fortress Breaker.

## Region 22 --- Quantum Rift

Environment: fractured corridors, unstable structures, distorted space
effects. Hazards: temporary branches, route instability, changing gates.
Mission: choose and traverse valid branches without teleporting.
Encounter: Rift Sovereign.

## Region 23 --- The Last Armada

Environment: friendly and hostile fleets, capital ships, carrier
formations. Hazards: crossfire, fighter swarms, capital-ship weapons.
Mission: rescue allies and break a blockade. Encounter: Armada Admiral.

## Region 24 --- Guardian's Last Stand

Environment: damaged Guardian stations, collapsing infrastructure,
terminal defense perimeter. Hazards: route collapse, convoy separation,
heavy pursuit. Mission: protect surviving ships and secure the terminal
approach. Encounter: Final Siege Engine.

## Region 25 --- Guardian Space Terminal

Environment: orbital approach corridors, huge docking gates, a visible
parking dome, hangars and marked bays. Hazards: remaining debris,
damaged docking systems, final pursuit. Mission: physically enter and
park at the terminal. Encounter: final pursuit/terminal defense rather
than an arbitrary additional boss if the story's boss is already
defeated.

## 3.1 Required region uniqueness

Each region must differ in more than skybox or color. Give each a
meaningful combination of: - environment geometry and silhouettes; -
lighting and palette; - structures and landmarks; - route shape and
traversal mechanic; - hazard types and movement patterns; - objective
and encounter; - audio/ambience; - optional reward or challenge; -
transition into the next region.

Build reusable modular systems but author distinct region
configurations. Do not put every hazard in every region. Stream distant
geometry and deactivate far-away AI safely. Preserve route continuity
and checkpoint correctness.

------------------------------------------------------------------------

# 4. ENVIRONMENT, STRUCTURE AND HAZARD LIBRARY

Implement reusable, configurable systems for the following. Use actual
geometry, physics/collision and behavior where appropriate, not just
particles or visual decoration.

## 4.1 Structures

-   orbital shipyards and repair docks;
-   mobile defense platforms;
-   space elevators and transit rings;
-   shield-generator towers;
-   magnetic bridges;
-   rotating planetary-ring sections;
-   asteroid refineries and mining stations;
-   abandoned orbital cities and skyscraper-sized structures;
-   alien ruins and research stations;
-   cargo elevators and container yards;
-   industrial turbines and automated factories;
-   shield tunnels and armored gates;
-   evacuation shelters and rescue platforms;
-   carrier hangars and launch bays;
-   fortress walls and weapon modules;
-   damaged stations with sequential structural collapse;
-   the Guardian Space Terminal and its actual parking dome.

## 4.2 Physical route hazards

-   moving asteroids and boulders;
-   drifting cargo containers;
-   rotating gates and ring segments;
-   moving walls and mechanical arms;
-   collapsing bridges and platforms;
-   narrow tunnels and broken route sections;
-   closing gates and magnetic barriers;
-   mines and explosive debris;
-   unstable ramps and alternate route junctions;
-   projectile-crossfire corridors;
-   falling structural pieces;
-   timed passages through rotating machinery.

Every physical hazard must define collision behavior, damage/response,
motion bounds, warning feedback and cleanup. The route manager and AI
navigation must know about obstacles where needed.

## 4.3 Environmental dangers

-   nebula visibility and sensor degradation;
-   solar flare exposure and heat accumulation;
-   electromagnetic storm interference;
-   ice-induced handling penalties;
-   local gravity currents;
-   ion clouds and energy storms;
-   corrosive spores and damaging clouds;
-   crystal refraction or beam hazards;
-   volcanic eruptions and molten debris;
-   darkness and sensor-blackout regions;
-   atmospheric entry drag/heat where supported;
-   debris cascades;
-   moving environmental structures;
-   bounded persistent destruction.

Use environment effects only when the ship is within the affected zone.
Effects must be predictable, communicated to the player and safe for
frame-rate variations.

## 4.4 Destruction and persistence

Objects may use states such as:
`STABLE -> DAMAGED -> DESTROYED -> DEBRIS -> CLEANED_UP` where
appropriate. The world should visibly respond to destruction: a disabled
turret stops firing, a broken bridge changes route availability, a
destroyed boss module stops its attack, and wreckage has a controlled
lifetime. Do not keep every debris object forever; preserve meaningful
campaign consequences while using pooling and streaming.

------------------------------------------------------------------------

# 5. MODE 02 --- HUNTERS: TEN HUNTERS + BOSS + SIX DRONES

## 5.1 Required formation

HUNTERS has: - 3 forward main hunters; - 2 middle-forward hunters; - 1
central boss with 1,000 starting hull HP; - 2 middle-backward hunters; -
3 backward main hunters; - 6 boss-protection drones orbiting the boss.

This is ten hunter units plus one boss plus six drones. Do not count the
six drones as hunters. Use configurable, real 3D formation slots and
appropriate offsets. All units must have valid health, collision and AI
state.

## 5.2 Hunter role archetypes

Use a configurable subset appropriate to the mission: - Main Hunter:
balanced weapons and pursuit. - Interceptor: high acceleration and quick
target switching. - Flanker: approaches sides/rear. - Suppressor:
temporarily weakens shields. - Artillery Hunter: long-range,
high-cooldown attacks. - Defender Hunter: protects allied units. -
Tracker Hunter: improves acquisition and marking. - Disruptor Hunter:
interferes with sensors/targeting. - Heavy Hunter: high armor, lower
agility. - Elite Hunter: combines tactics with bounded complexity.

Archetypes may be assigned to the ten formation slots; do not spawn
extra hunters beyond the mission's specified count unless a separate
wave explicitly defines them.

## 5.3 Six independent protection drones

Give each drone its own: - unique ID and health pool; - transform, orbit
slot and movement behavior; - target selection and attack cooldown; -
collision/hit detection; - destruction/disabled state; - visual damage
feedback and HUD indicator; - contribution to boss defense.

Recommended roles: 1. Shield Generator Drone: maintains or regenerates
the boss shield. 2. Repair Drone: repairs boss hull slowly while active.
3. Interceptor Drone: attempts to intercept incoming projectiles. 4.
Heavy Weapon Drone: attacks the player or hunter units. 5. Electronic
Warfare Drone: disrupts target lock or sensor data. 6. Command Drone:
coordinates defense and improves drone tactics.

Destroying a drone must have a real gameplay consequence. For example,
destroying the repair drone stops repair, destroying the shield drone
removes or weakens the shield, and destroying the command drone reduces
coordinated behavior. The boss must not remain invulnerable forever
because of a stale drone count.

## 5.4 Boss: Guardian Siege Titan

Starting hull: **1,000 HP**. Store HP as actual state. HUD is a readout,
not the source of truth.

Suggested phases: 1. Armored Approach: boss is protected and uses basic
attacks. 2. Drone Defense: the six drones maintain distinct defense
functions. 3. Heavy Assault: missiles, beam attacks, mines and
coordinated hunter attacks. 4. Exposed Reactor: damage window based on
actual defense state. 5. Last Stand: intensified attacks or retreat
attempt at low health. 6. Victory/defeat: transition only from real boss
health and mission conditions.

Additional optional modules: - targetable weapon batteries; -
destructible armor plates; - engines that affect movement; - rotating
weak point; - shield generator; - exposed reactor; - controlled debris
from destroyed modules.

Do not grant damage because an animation plays. Damage must result from
actual weapon hit resolution and valid target checks. Health must clamp
between zero and maximum. Prevent repeated damage from one projectile,
collision spam or duplicate event subscriptions.

## 5.5 Combat systems

Implement or reuse: - manual firing and automatic firing where
designed; - target lock, lock progress and target cycling; - projectile
travel and collision; - hit feedback and damage numbers; - shields, hull
damage, armor/resistance; - weapon cooldown and heat/energy costs; -
missile guidance, lock warnings and countermeasures; - dodge/boost
abilities with cooldowns; - EMP or disruption abilities where
supported; - boss phase state and drone state; - AI
attack/evade/retreat/defend behaviors; - combat HUD; - objective and
timer state; - combat results and replay/retry.

Do not build fake weapon buttons. Each visible control must perform its
described action.

## 5.6 HUNTERS victory/failure

Victory requires: - boss hull reaches zero through valid combat; - any
required drone or objective conditions are satisfied; - the final
mission objective is completed.

Defeat can occur when: - player ship is destroyed; - a required mission
unit is lost, if configured; - mission timer expires; - a required
objective becomes unrecoverable.

Keep defeat logic configurable per mission. A cinematic must not
automatically set boss HP to zero or declare victory.

------------------------------------------------------------------------

# 6. WARFARE AND BATTLE MISSIONS

Build a reusable encounter framework for: - escort a friendly battleship
through a blockade; - destroy enemy artillery before it attacks the
convoy; - defend a repair station for a timed period; - disable a shield
generator; - destroy a carrier that launches fighters; - rescue an
allied fleet surrounded by mines; - protect a supply ship during
retreat; - survive capital-ship bombardment; - destroy multiple weapon
modules on a fortress; - escort reinforcements; - fight through an
asteroid battlefield; - defend a station until civilian evacuation
completes; - intercept an enemy flagship; - survive a rear ambush; -
fight multiple coordinated bosses.

Combat entities should use actual targeting, movement, projectile logic,
cooldowns, health, shield and destruction state. Use bounded AI update
rates and LOD where necessary.

## 6.1 Battlefield consequences

Where campaign persistence is supported: - disabled turrets stop
firing; - destroyed shields open routes; - rescued allies may appear
later; - failed optional objectives affect rewards or mission grading; -
destroyed structures alter route availability; - salvaged resources
contribute to upgrades; - convoy damage persists to the next
checkpoint/region according to mission rules.

Do not store unlimited destroyed objects or replay all combat AI from
distant regions.

------------------------------------------------------------------------

# 7. WEAPONS, ABILITIES AND UPGRADES

## 7.1 Weapon families

-   Pulse cannons: reliable rapid fire.
-   Plasma lance: charged armor penetration.
-   Homing missiles: target acquisition, travel and countermeasures.
-   Rail cannon: precision damage with long cooldown.
-   EMP burst: temporary electronic disruption.
-   Energy net: temporary movement restriction where appropriate.
-   Decoy drones: divert missiles.
-   Repair beam: restore eligible friendly hull/shields using limited
    energy.
-   Area shield: protect nearby allies for a limited duration.
-   Overdrive: temporary acceleration with heat/cooldown trade-off.

Balance by cooldown, energy, heat, range, accuracy, projectile speed and
target resistance. Do not let weapons bypass collision or target
validity.

## 7.2 Progression and upgrades

Resources may come from missions, salvage, rescue and optional
objectives: - engine tuning; - reinforced armor; - shield capacity; -
weapon efficiency; - targeting computer; - repair module; - sensor
range; - cargo reinforcement; - drone countermeasures; - emergency
thrusters.

Use caps, trade-offs and difficulty-aware balance. Persist upgrades
safely through the project's existing save architecture. Validate
corrupted or missing save values and provide defaults.

## 7.3 Optional content

-   hidden salvage caches;
-   abandoned research stations;
-   risky shortcut routes;
-   elite patrols;
-   no-damage convoy challenges;
-   optional boss objectives;
-   rescue chains across regions;
-   hidden terminal bays;
-   unlockable ship skins and engine trails;
-   reconnaissance missions;
-   region challenge replay;
-   alternate campaign grades based on cargo/ally survival;
-   bounty, rescue and defense contracts generated from region
    templates.

------------------------------------------------------------------------

# 8. FINAL SAVIOUR SEQUENCE --- GUARDIAN SPACE TERMINAL PARKING DOME

This is a critical required feature. The campaign ending must be a
playable physical arrival and parking sequence, not a teleport or
automatic parking animation.

## 8.1 Final sequence

1.  Final Armada: survive the last major warfront while protecting the
    convoy.
2.  Guardian's Last Stand: approach damaged terminal infrastructure and
    navigate real detours.
3.  Terminal Defense: handle remaining threats while the docking
    corridor is secured.
4.  Physical Approach: follow the actual route through the outer
    perimeter and entrance gate.
5.  Parking Dome Entry: enter the visible dome through real geometry and
    collision-tested passage.
6.  Individual Parking: ships navigate to assigned bays using their own
    transforms and steering.
7.  Docking: each required ship slows, aligns and engages docking
    clamps.
8.  Victory: after validation, show the final cinematic and campaign
    summary.

## 8.2 Parking structures

Create actual geometry for: - terminal exterior and visible dome; -
approach corridor and entrance gate; - interior flight space; - marked
parking bays; - alignment markers and docking lights; - docking
clamps/landing pads; - repair bays for damaged ships; - optional cargo
unloading area; - navigation checkpoints and collision boundaries.

The dome should be visible early enough for the player to recognize the
destination. Do not create a fake tower or a decorative dome that cannot
be entered.

## 8.3 Docking validation

Track states such as:
`APPROACHING -> ENTRANCE_CROSSED -> DOME_ENTERED -> PARKING_BAY_ENTERED -> SHIP_ALIGNED -> SPEED_VALID -> DOCKING_CLAMPS_ENGAGED -> SHIP_SECURED`

Success requires actual checks: - player crosses the correct entrance
trigger in the correct direction; - player is inside the dome; - player
is inside an assigned bay; - alignment is within a configured
tolerance; - speed is below the configured threshold for a stable
duration; - clamps engage; - required convoy survival and objectives are
met.

Use hysteresis/tolerances so a tiny floating-point change does not cause
flickering between states. Validate the correct ship identity and
mission. Do not let merely touching the dome or a distance counter
trigger victory.

## 8.4 Convoy parking and final cinematic

Each surviving ship should navigate to its assigned bay or designated
repair/survivor location. Avoid collisions and prevent all ships from
stacking at one coordinate. The player should retain control until
parking/docking is genuinely complete, unless an explicitly optional
cinematic begins after validation.

When conditions are satisfied: - illuminate the dome bays in sequence; -
show surviving ships arriving; - send damaged ships to repair bays; -
show cargo unloading if supported; - show rescued units arriving; -
reveal the entire convoy with a final camera move; - show a mission
summary: route distance, regions completed, ships surviving, cargo
integrity, rescues, optional objectives and boss victories.

Show **GUARDIAN CONVOY SECURED** only after real docking validation.
Grade endings based on survival and objectives. If the player misses the
gate or fails to park, provide a recovery/retry/failure outcome, not an
invisible auto-correction.

------------------------------------------------------------------------

# 9. HUD, MENUS, AUDIO AND CINEMATICS

## 9.1 SAVIOUR HUD

-   convoy integrity;
-   lead ship hull/shield;
-   three individual cargo health/integrity indicators;
-   formation status and commands;
-   current region and actual route distance;
-   waypoint and objective;
-   hazard and enemy direction warnings;
-   repair supplies and shield energy;
-   rescue status;
-   checkpoint progress;
-   optional performance panel with FPS, frame time, draw calls,
    triangles, active objects and particles.

## 9.2 HUNTERS HUD

-   boss hull / 1,000;
-   six individual drone indicators;
-   selected target and lock progress;
-   player hull/shields/energy;
-   weapon cooldown and heat;
-   missile warning;
-   boss phase and vulnerability state;
-   hunter formation status;
-   mission objective and timer;
-   hit feedback and damage numbers.

## 9.3 UI rules

-   Reuse visual components but maintain separate mode-specific data and
    layouts.
-   Ensure text remains readable against moving backgrounds.
-   Support keyboard/mouse and existing mobile controls.
-   Keep buttons functional and prevent accidental double-launch.
-   Handle pause, resume, restart, menu return and orientation changes.
-   Do not remove existing player count displays or other unrelated HUD
    features.
-   Do not introduce a UI-only fake feature that lacks game logic.

## 9.4 Audio

Support spatialized engine audio, warning tones, weapon fire/impact,
shield impact, drone destruction, boss attacks, structural collapse,
convoy radio chatter, region ambience and victory/defeat cues. Use
distinct audio signatures for enemy types and region events. Avoid
repeated audio triggers every frame; use event/state transitions and
clean up mission-owned audio sources.

## 9.5 Cinematics

Possible short events: - convoy launch and formation assembly; - first
enemy fleet reveal; - cargo ship critical damage; - rescue operation; -
boss reveal; - shield generator destruction; - structure collapse; -
boss defeat; - terminal reveal; - final parking dome arrival.

Cinematics may enhance transitions but must never replace required
movement, combat, rescue, route traversal or parking validation. Return
control reliably and provide failsafes if a cinematic manager fails.

------------------------------------------------------------------------

# 10. ENGINEERING REQUIREMENTS

## 10.1 Shared systems

Reuse compatible existing systems for: - Three.js rendering and scene
lifecycle; - ship physics and controls; - collision detection and
filtering; - camera and cinematic director; - route segments, branches
and checkpoints; - projectiles, weapons and damage; - health/shields; -
AI steering and target selection; - audio; - particles and effects; -
HUD components; - save/progression.

Do not duplicate a system if a suitable implementation already exists.
If a new interface is needed, make it backward-compatible and document
it.

## 10.2 Physics and AI

-   Use delta-time-safe updates.
-   Clamp invalid values and guard against NaN/infinity.
-   Ensure AI respects collision and route geometry.
-   Avoid allies colliding with one another.
-   Use bounded catch-up speed and steering.
-   Implement stuck detection and recovery for AI ships.
-   Ensure projectile collision can only apply valid damage once.
-   Use predictable cooldown timers and reset them correctly.
-   Separate rendering interpolation from authoritative game state where
    applicable.

## 10.3 Performance

-   Stream region and route geometry.
-   Pool projectiles, particles and frequently reused debris.
-   Limit active AI and physics objects at distance.
-   Use instancing where it fits the existing rendering architecture.
-   Use LOD/culling for distant ships and structures.
-   Keep performance metrics available through existing diagnostics.
-   Avoid excessive per-frame allocations and duplicate loops.
-   Clean up geometry, materials, textures, audio nodes and event
    listeners on teardown.
-   Provide configurable quality presets compatible with the existing
    settings.

## 10.4 Route and campaign integrity

-   Actual route traversal must determine distance.
-   Every region exit must connect to the next region's entrance.
-   Branches need valid join/rejoin behavior.
-   Checkpoints must restore player and convoy state consistently.
-   A destroyed bridge or closed gate must have a valid alternate route
    or a clear failure condition.
-   Do not teleport the player across missing route segments.
-   Store progress by region and checkpoint using the existing save
    architecture.

## 10.5 Save safety

Persist only the required campaign state: unlocked regions, completed
objectives, upgrades, resources, selected mode and checkpoint. Validate
schema/version and values. Handle absent or corrupted saves gracefully.
Do not overwrite the other mode's progress. Avoid saving transient scene
object references.

------------------------------------------------------------------------

# 11. ACCEPTANCE TESTS --- REQUIRED BEFORE CLAIMING COMPLETION

Run the repository's available tests, build, lint and type checks. Add
targeted tests where possible. If a test cannot run, state why and do
not claim it passed.

## Menu and isolation

-   Convoy Guardian menu exposes SAVIOUR and HUNTERS separately.
-   Each button starts the correct mode.
-   Switching modes does not leak the previous mode's enemies, HUD,
    timers or win state.
-   Restarting does not duplicate event listeners or update loops.
-   Unrelated modes remain available.

## SAVIOUR

-   Exactly nine principal ships appear in the default formation.
-   The lead, two forward guards, two mid guards, three cargo ships and
    rear guard have the correct roles.
-   Formation movement is smooth and collision-aware.
-   Cargo ships have individual integrity.
-   Hazards physically affect ships.
-   Route branches and checkpoints work.
-   Rescue and repair objectives validate their actual completion
    conditions.
-   Failure and victory rules behave as configured.
-   Actual campaign distance is based on route traversal.

## HUNTERS

-   Ten hunters, one 1,000-HP boss and six drones appear in the
    configured encounter.
-   Drones have separate health and real behavior.
-   Destroying each drone removes/changes its assigned ability.
-   Boss hull damage comes from valid weapon hits.
-   Boss phases trigger from actual state.
-   Targeting, cooldowns, projectiles and collision work.
-   Player destruction and mission timeout produce the configured defeat
    outcome.
-   Boss defeat only triggers when health and required objective
    conditions are satisfied.

## Campaign and world

-   All implemented regions are reachable in order.
-   Region transitions have connected route geometry.
-   Hazards are active only in valid zones and communicate warnings.
-   Streaming and cleanup do not remove nearby required objects.
-   Performance remains within the project's tested budget; report
    measured results rather than inventing numbers.
-   No critical console errors or unhandled exceptions occur during the
    tested path.

## Terminal finale

-   Dome and entrance are visible and physically enterable.
-   Entrance, dome and parking bay triggers validate correct direction
    and ship identity.
-   Player can steer into the assigned bay.
-   Alignment and speed checks work.
-   Docking clamps activate only after valid checks.
-   The final success banner cannot trigger prematurely.
-   Convoy ships park without stacking or teleporting.
-   Retry/failure paths work if the player misses or fails to park.

## Regression safety

-   Existing controls, menus, HUD and unrelated game modes still work.
-   No removed feature unless explicitly required.
-   No new unresolved imports or missing assets.
-   No NaN/infinite physics values in tested gameplay.
-   No orphaned timers, listeners, audio sources or projectiles after
    restart.
-   Build and tests are reported honestly.

------------------------------------------------------------------------

# 12. IMPLEMENTATION STRATEGY

Use this order to reduce risk:

### Phase A --- Audit and foundation

Inspect the project, document architecture, add menu entry and
independent mission-state ownership. Run baseline build/tests.

### Phase B --- SAVIOUR core

Implement nine-ship formation, ship state, formation AI, cargo
integrity, physical route traversal, checkpoints, hazards and mission
outcomes.

### Phase C --- HUNTERS core

Implement ten hunters, boss with 1,000 HP, six drones, target locking,
weapons, hit resolution, boss phases and combat outcomes.

### Phase D --- Campaign content

Implement region data/configurations, route streaming, environment
systems, distinct structures, encounters and optional objectives.

### Phase E --- Warfare and progression

Add fleet battle missions, rescue/repair/salvage, upgrades, rewards,
bounded persistent consequences and save support.

### Phase F --- Terminal finale

Implement the terminal geometry, approach corridor, dome, parking bays,
collision, validation states, AI parking, docking clamps and final
report.

### Phase G --- Polish and verification

Add HUD/audio/cinematics/mobile support, performance improvements,
automated tests and regression checks.

Do not claim every phase is done just because code was generated. Build
and test incrementally after each phase, fix errors before continuing,
and preserve a working state.

------------------------------------------------------------------------

# 13. FINAL DELIVERY REQUIREMENTS

When finished, deliver: 1. The updated project ZIP if the execution
environment supports file editing and packaging. 2. A summary of files
changed and what each change does. 3. A feature checklist separating
implemented, partially implemented and not implemented items. 4.
Build/test/lint results with actual command outcomes. 5. Any limitations
caused by missing assets, engine architecture or time. 6. Confirmation
that SAVIOUR and HUNTERS remain separate and existing unrelated modes
were preserved. 7. Any instructions needed to run the project locally or
in Google AI Studio.

Do not return only a plan if you have access to the source repository
and can edit it. Conversely, if no source repository/ZIP is available,
do not fabricate an updated ZIP or claim code changes. In that case,
preserve this specification as the master implementation prompt and
request the latest project ZIP for actual integration.

------------------------------------------------------------------------

# FINAL DIRECTIVE

Implement Convoy Guardian as a real, integrated expansion of the
existing VOID-RIDER 3D project. SAVIOUR and HUNTERS must be two distinct
playable modes sharing compatible engine systems without sharing mutable
mission state. Build physical, connected routes; meaningful environments
and structures; collision-tested hazards; functioning convoy and combat
AI; a real 1,000-HP boss with six independently behaving protection
drones; large-scale war encounters; rescue, repair, salvage and
progression; and the playable Guardian Space Terminal parking-dome
finale.

Preserve existing features. Inspect before editing. Implement
incrementally. Verify every major feature. Report the truth about what
is complete.
