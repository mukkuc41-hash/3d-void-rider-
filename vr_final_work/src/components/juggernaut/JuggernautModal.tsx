/**
 * VOID-RIDER 3D — JUGGERNAUT SPACE COMBAT MODAL
 * Mode selection and ship/role assignment workflow:
 * 1. Select Mode: APEX PREDATOR or SWARM HUNT
 * 2. Role & Ship Assignment: Briefing, abilities, arena preview
 * 3. Start Match button
 */
import React, { useState } from 'react';
import {
  ShieldAlert,
  Skull,
  Swords,
  ChevronRight,
  ArrowLeft,
  Flame,
  Zap,
  Crosshair,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  JuggernautCombatMode,
  JuggernautRole,
  JuggernautMatchConfig,
} from '../../game/juggernaut/juggernautTypes';
import { sound } from '../../game/audio';

interface JuggernautModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (config: JuggernautMatchConfig) => void;
  currentShipId: string;
}

export const JuggernautModal: React.FC<JuggernautModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  currentShipId,
}) => {
  const [step, setStep] = useState<'MODE_SELECT' | 'ROLE_ASSIGN' | 'BRIEFING'>('MODE_SELECT');
  const [selectedMode, setSelectedMode] = useState<JuggernautCombatMode>('APEX_PREDATOR');
  const [selectedRole, setSelectedRole] = useState<JuggernautRole>('JUGGERNAUT');
  const [difficulty, setDifficulty] = useState<'STANDARD' | 'VETERAN' | 'ELITE'>('STANDARD');
  const [shrinkingBoundary, setShrinkingBoundary] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSelectMode = (mode: JuggernautCombatMode) => {
    sound.playMenuClick();
    setSelectedMode(mode);
    if (mode === 'APEX_PREDATOR') {
      setSelectedRole('JUGGERNAUT');
    } else {
      setSelectedRole('SURVIVOR');
    }
    setStep('ROLE_ASSIGN');
  };

  const handleLaunch = () => {
    sound.playRouteSelected();
    onStartMatch({
      mode: selectedMode,
      playerRole: selectedRole,
      playerShipId: currentShipId || 'VR-0777',
      difficulty,
      matchDurationSeconds: 180,
      shrinkingBoundary: selectedMode === 'SWARM_HUNT' ? shrinkingBoundary : false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in font-ui">
      {/* Background Neon Grid Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#090d16]/95 border border-red-500/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/50 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                  TACTICAL COMBAT SECTOR
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                  8-SHIP ENGAGEMENT
                </span>
              </div>
              <h2 className="text-xl font-black italic tracking-wider text-white">
                JUGGERNAUT SPACE COMBAT
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white border border-white/10 transition-all"
          >
            ESC / CLOSE
          </button>
        </div>

        {/* Content Stages */}
        <div className="p-6 flex-1">
          {/* STEP 1: MODE SELECTION */}
          {step === 'MODE_SELECT' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  SELECT COMBAT ENGAGEMENT
                </h3>
                <p className="text-xs text-slate-400">
                  High-stakes 3D spaceship arena warfare. Choose between commanding the armored Titan against a coordinated swarm, or surviving against the ultimate predator.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MODE A: APEX PREDATOR */}
                <div
                  onClick={() => handleSelectMode('APEX_PREDATOR')}
                  className="group relative cursor-pointer p-6 rounded-2xl bg-gradient-to-b from-[#1a0e14] to-[#0d0912] border-2 border-red-500/40 hover:border-red-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.35)] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                        MODE A
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                        <Timer className="w-3.5 h-3.5" />
                        <span>180 SECONDS</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black italic text-white group-hover:text-red-400 transition-colors">
                        APEX PREDATOR
                      </h4>
                      <p className="text-xs font-bold tracking-widest text-red-400 uppercase mt-0.5">
                        ONE TITAN. SEVEN HUNTERS.
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      One heavily armored Titan Juggernaut faces an aggressive wolfpack of seven agile Hunter fighters. The Juggernaut wields massive kinetic cannons and radial shockwaves to wipe out the swarm or survive until the extraction timer expires.
                    </p>

                    {/* Roster preview */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> 1x Juggernaut
                        </span>
                        <span className="font-mono text-slate-300">700 HP + 200 SHIELD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> 7x Hunters
                        </span>
                        <span className="font-mono text-slate-300">100 HP + 50 SHIELD EACH</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-slate-400">Play as Titan or Hunter</span>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 group-hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all">
                      <span>CHOOSE</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* MODE B: SWARM HUNT */}
                <div
                  onClick={() => handleSelectMode('SWARM_HUNT')}
                  className="group relative cursor-pointer p-6 rounded-2xl bg-gradient-to-b from-[#0e171a] to-[#091012] border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                        MODE B
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                        <Timer className="w-3.5 h-3.5" />
                        <span>180 SECONDS</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black italic text-white group-hover:text-emerald-400 transition-colors">
                        SWARM HUNT
                      </h4>
                      <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mt-0.5">
                        SEVEN SURVIVORS. ONE BOSS.
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Seven survivor vessels must out-maneuver and withstand a deadly Boss Hunter. Survivors use energy cloaks, proximity plasma traps, and field-revive mechanics to save disabled teammates and survive the onslaught.
                    </p>

                    {/* Roster preview */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold flex items-center gap-1.5">
                          <Skull className="w-3.5 h-3.5" /> 1x Boss Hunter
                        </span>
                        <span className="font-mono text-slate-300">1,000 HP + 300 SHIELD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> 7x Survivors
                        </span>
                        <span className="font-mono text-slate-300">80 HP + 40 SHIELD (REVIVABLE)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-slate-400">Play as Boss or Survivor</span>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all">
                      <span>CHOOSE</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE ASSIGNMENT & BRIEFING */}
          {step === 'ROLE_ASSIGN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setStep('MODE_SELECT');
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>BACK TO MODES</span>
                </button>
                <div className="text-xs font-mono text-slate-400">
                  SECTOR: <span className="text-amber-400">ORBITAL ARENA EPSILON-7</span>
                </div>
              </div>

              {/* Role Selection Tabs */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3">
                  CHOOSE YOUR ROLE & SHIP ASSIGNMENT:
                </h3>

                {selectedMode === 'APEX_PREDATOR' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setSelectedRole('JUGGERNAUT');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === 'JUGGERNAUT'
                          ? 'bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" /> TITAN JUGGERNAUT
                        </span>
                        {selectedRole === 'JUGGERNAUT' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Command the armored colossus. Heavy 45 DMG cannon, radial shockwave pushback, and Bulwark shield overcharge.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setSelectedRole('HUNTER');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === 'HUNTER'
                          ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> SWARM HUNTER
                        </span>
                        {selectedRole === 'HUNTER' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500 text-white font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Fly as 1 of 7 agile fighters. Coordinate with 6 AI wingmen, use warp boost evasions, and chip down the Titan.
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setSelectedRole('SURVIVOR');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === 'SURVIVOR'
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> SURVIVOR FIGHTER
                        </span>
                        {selectedRole === 'SURVIVOR' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Agile survival ship. Deploy holographic decoys, plant plasma slowdown traps, and revive disabled squadmates.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setSelectedRole('BOSS');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRole === 'BOSS'
                          ? 'bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                          : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
                          <Skull className="w-4 h-4" /> BOSS HUNTER
                        </span>
                        {selectedRole === 'BOSS' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Unleash devastation with 1,000 HP. Rocket lunge at isolated prey and trigger Nova Annihilation area blasts.
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Combat Briefing & Abilities breakdown */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> ROLE WEAPONRY & ABILITIES BRIEFING:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {selectedRole === 'JUGGERNAUT' && (
                    <>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-red-400">[E] RADIAL SHOCKWAVE</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Pushes away all enemy vessels in 180m radius, dealing 75 kinetic damage. (14s Cooldown)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-amber-400">[Q] TITAN BULWARK SHIELD</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Overcharges shields by +180 and boosts cannon fire rate by +35% for 7 seconds. (20s Cooldown)
                        </p>
                      </div>
                    </>
                  )}

                  {selectedRole === 'HUNTER' && (
                    <>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-cyan-400">[SHIFT] WARP BOOST DASH</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Instant kinetic velocity surge to evade Titan cannons and flank rear engines. (8s Cooldown)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-slate-300">[SPACE / F] DUAL PLASMA REPEATERS</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Rapid-fire 12 DMG lasers. Focus fire with AI allies for maximum attrition.
                        </p>
                      </div>
                    </>
                  )}

                  {selectedRole === 'SURVIVOR' && (
                    <>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-emerald-400">[Q] ENERGY CLOAK & DECOY</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Drops hologram decoy and cloaks ship for 4 seconds, shaking off Boss pursuit. (15s Cooldown)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-emerald-400">[E] PLASMA PROXIMITY MINE</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Plants glowing mine that detonates for 130 DMG and slows Boss speed by 45%. (16s Cooldown)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5 md:col-span-2">
                        <span className="font-bold text-emerald-300">FIELD REVIVE MECHANIC</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Disabled teammates enter a drifting beacon state. Fly within 30m for 3 seconds to restore them to operational status!
                        </p>
                      </div>
                    </>
                  )}

                  {selectedRole === 'BOSS' && (
                    <>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-red-400">[SHIFT] PREDATOR LUNGE</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          Massive forward rocket burst to close distance on escaping survivors. (10s Cooldown)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-bold text-red-500">[E] NOVA ANNIHILATION</span>
                        <p className="text-slate-300 text-[11px] mt-1">
                          360-degree expanding red sphere dealing 90 area damage to all nearby ships. (18s Cooldown)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Arena Platform & Flight Controller Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-xs">
                <div className="space-y-1">
                  <span className="font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    SOLID CIRCULAR ARENA PLATFORM
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1,450m radius heavy titanium combat disk (65m thickness). Full 3D dogfighting above the deck with real surface collision. Watch the perimeter rim — flying or getting knocked off the edge drops you into the cosmic void!
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    FLIGHT CONTROLLER & JOYSTICK
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Touch & drag the on-screen <strong className="text-cyan-300">Cyber Flight Joystick</strong> (bottom-left) or use <strong className="text-white">WASD / Arrow Keys</strong> to steer & pitch. Tap or hold <strong className="text-red-400">FIRE</strong> [Space] and <strong className="text-amber-400">BOOST</strong> [Shift].
                  </p>
                </div>
              </div>

              {/* Match Settings (Difficulty & Boundary) */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase">AI DIFFICULTY:</span>
                  {(['STANDARD', 'VETERAN', 'ELITE'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`px-3 py-1 rounded-lg font-black transition-all ${
                        difficulty === diff
                          ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-black/30 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {selectedMode === 'SWARM_HUNT' && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={shrinkingBoundary}
                      onChange={(e) => setShrinkingBoundary(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>SHRINKING BOUNDARY IN FINAL 60S</span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase transition-all"
                >
                  CANCEL
                </button>

                <button
                  onClick={handleLaunch}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START MATCH</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
