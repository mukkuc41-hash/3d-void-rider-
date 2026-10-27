/**
 * VOID-RIDER 3D — CONVOY GUARDIAN BRIEFING & SELECTION MODAL
 * 
 * Master contract requirements:
 * - TWO DEDICATED PLAYABLE MODES:
 *   MODE A: 01 — SAVIOUR (50,000 km, 25 Regions × 2,000 km, 9 Ships, Parking Dome Finale)
 *   MODE B: 02 — HUNTERS (Dedicated Offensive Warfare, 10 Hunter Fighters, 1,000 HP Boss, 6 Defense Drones)
 * - Each ship displays: Name, Role, Description, Stats (Power, HP, Speed), and 5 Ability Slots with Cooldowns and Ultimate designation.
 * - Drones are AI-only and never selectable.
 * - Real persistence loading for checkpoints and dome arrival.
 */
import React, { useState } from 'react';
import { ConvoyVariant } from '../../game/convoy/convoyTypes';
import {
  SAVIOUR_SHIPS,
  HUNTER_SHIPS,
  ConvoyPlayableShipDef,
} from '../../game/convoy/convoyShipDatabase';
import {
  ShieldAlert,
  Radio,
  Play,
  X,
  Target,
  Zap,
  Gauge,
  Heart,
  Crosshair,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';
import { sound } from '../../game/audio';
import { ConvoyPersistenceManager } from '../../game/convoy/convoyPersistence';

interface ConvoyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: (variant: ConvoyVariant, selectedShipId: string, startRegionIndex?: number) => void;
  currentShipName: string;
}

export const ConvoyModal: React.FC<ConvoyModalProps> = ({
  isOpen,
  onClose,
  onStartMission,
}) => {
  const [variant, setVariant] = useState<ConvoyVariant>('SAVIOUR');
  const [selectedShipId, setSelectedShipId] = useState<string>('saviour_aegis');
  const [startRegionIndex, setStartRegionIndex] = useState<number>(0);
  const [isSimulationJump, setIsSimulationJump] = useState<boolean>(false);

  const savedSaviour = ConvoyPersistenceManager.loadCampaign('SAVIOUR');
  const savedHunters = ConvoyPersistenceManager.loadCampaign('HUNTERS');
  const currentSaved = variant === 'SAVIOUR' ? savedSaviour : savedHunters;

  if (!isOpen) return null;

  // Filter out non-fighter boss if desired or show 10 fighters
  const currentRoster: ConvoyPlayableShipDef[] =
    variant === 'SAVIOUR'
      ? SAVIOUR_SHIPS
      : HUNTER_SHIPS.filter((h) => h.id !== 'hunter_dreadnought_x');

  // Find currently selected ship or fallback to first
  const selectedShip =
    currentRoster.find((s) => s.id === selectedShipId) || currentRoster[0];

  const handleSelectRole = (newVariant: ConvoyVariant) => {
    sound.playMenuClick();
    setVariant(newVariant);
    setSelectedShipId(newVariant === 'SAVIOUR' ? 'saviour_aegis' : 'hunter_fang');
  };

  const handleSelectShip = (shipId: string) => {
    sound.playMenuClick();
    setSelectedShipId(shipId);
  };

  const isSaviour = variant === 'SAVIOUR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md font-ui select-none overflow-y-auto">
      <div className={`relative w-full max-w-5xl max-h-[96vh] overflow-y-auto bg-[#031114]/95 border-2 rounded-2xl shadow-[0_0_60px_rgba(20,184,166,0.3)] flex flex-col text-slate-100 ${
        isSaviour ? 'border-teal-500/50' : 'border-fuchsia-500/50'
      }`}>
        
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-5 sm:px-7 py-3.5 border-b sticky top-0 z-20 ${
          isSaviour
            ? 'border-teal-500/30 bg-gradient-to-r from-[#06241e] via-[#031114] to-[#041c24]'
            : 'border-fuchsia-500/30 bg-gradient-to-r from-[#24061e] via-[#031114] to-[#1c0424]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isSaviour
                ? 'bg-teal-500/20 border-teal-400/50 text-teal-300'
                : 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-300'
            }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                  isSaviour ? 'text-teal-400' : 'text-fuchsia-400'
                }`}>
                  TACTICAL MISSION COMMAND
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono border border-white/20">
                  {isSaviour ? '50,000 KM · 25 REGIONS' : '1,000 HP BOSS BATTLE'}
                </span>
                {currentSaved?.isParkedInDome ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    PARKING DOME LOCKED (50,000 KM)
                  </span>
                ) : currentSaved ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    CHECKPOINT: {currentSaved.routeKm.toLocaleString()} KM
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl sm:text-2xl font-black italic tracking-wider text-white">
                CONVOY GUARDIAN — MASTER BRIEFING
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Close Briefing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          
          {/* STEP 1: TWO DISTINCT PLAYABLE MODES */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-teal-400" />
              STEP 1: SELECT OPERATION MODE (SAVIOUR vs HUNTERS)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* MODE A: SAVIOUR */}
              <button
                type="button"
                onClick={() => handleSelectRole('SAVIOUR')}
                className={`rounded-2xl border-2 p-4 text-left transition-all relative overflow-hidden ${
                  isSaviour
                    ? 'border-teal-400 bg-gradient-to-br from-teal-950/60 to-black/80 shadow-[0_0_30px_rgba(20,184,166,0.35)] ring-2 ring-teal-400/50'
                    : 'border-white/10 bg-black/40 hover:border-teal-500/40 opacity-70 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    MODE A · ESCORT CAMPAIGN
                  </span>
                  <ShieldAlert className="w-5 h-5 text-teal-400" />
                </div>
                <strong className="block text-lg font-black text-white">
                  01 — SAVIOUR ESCORT (50,000 KM)
                </strong>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Escort 9 allied ships (1 Lead, 2 Forward, 2 Mid, 3 Cargo, 1 Rear) across 25 distinct regions (2,000 km each). Concludes in the physical Parking Dome at Guardian Space Terminal with hydraulic clamp lockdown.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-teal-300/90 pt-2 border-t border-teal-500/20">
                  <div>• 25 Unique Regions</div>
                  <div>• 9 Escort Roles</div>
                  <div>• 5 Formation Presets</div>
                  <div>• Final Docking Dome</div>
                </div>
              </button>

              {/* MODE B: HUNTERS */}
              <button
                type="button"
                onClick={() => handleSelectRole('HUNTERS')}
                className={`rounded-2xl border-2 p-4 text-left transition-all relative overflow-hidden ${
                  !isSaviour
                    ? 'border-fuchsia-400 bg-gradient-to-br from-fuchsia-950/60 to-black/80 shadow-[0_0_30px_rgba(217,70,239,0.35)] ring-2 ring-fuchsia-400/50'
                    : 'border-white/10 bg-black/40 hover:border-fuchsia-500/40 opacity-70 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    MODE B · OFFENSIVE WARFARE
                  </span>
                  <Crosshair className="w-5 h-5 text-fuchsia-400" />
                </div>
                <strong className="block text-lg font-black text-white">
                  02 — HUNTERS INVASION (1,000 HP BOSS)
                </strong>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Dedicated strike battle: 10 Hunter assault fighters + 1 central Boss (Dreadnought X Core) starting at exactly 1,000 HP across 5 phases, shielded by 6 independent defense drones.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-fuchsia-300/90 pt-2 border-t border-fuchsia-500/20">
                  <div>• 1,000 HP Primary Boss</div>
                  <div>• 6 Defense Drones</div>
                  <div>• 10 Assault Fighters</div>
                  <div>• 5 Combat Phases</div>
                </div>
              </button>

            </div>
          </div>

          {/* STEP 2: SHIP SELECTION */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className={`w-3.5 h-3.5 ${isSaviour ? 'text-teal-400' : 'text-fuchsia-400'}`} />
                STEP 2: SELECT PILOTED VESSEL ({currentRoster.length} PLAYABLE CRAFT)
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                DRONES ARE AI-ONLY · NEVER SELECTABLE
              </span>
            </div>

            {/* Ship Selector Badges Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 mb-3">
              {currentRoster.map((ship) => {
                const isSelected = ship.id === selectedShip.id;
                return (
                  <button
                    key={ship.id}
                    type="button"
                    onClick={() => handleSelectShip(ship.id)}
                    className={`p-2 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between h-20 ${
                      isSelected
                        ? isSaviour
                          ? 'border-teal-300 bg-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.4)] ring-1 ring-teal-300'
                          : 'border-fuchsia-300 bg-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.4)] ring-1 ring-fuchsia-300'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className={`text-[8px] font-mono block uppercase truncate ${
                        isSaviour ? 'text-teal-300/90' : 'text-fuchsia-300/90'
                      }`}>
                        {ship.formationRole.replace(/_/g, ' ')}
                      </span>
                      <strong className="text-[11px] font-black text-white truncate block">
                        {ship.name}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-300 mt-1">
                      <span>HP {ship.hp}</span>
                      <span className="text-amber-300 font-bold">SPD {ship.speedRating}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Ship Full Inspection Card */}
            <div className={`p-4 rounded-2xl bg-black/80 border shadow-2xl space-y-3.5 ${
              isSaviour ? 'border-teal-500/40' : 'border-fuchsia-500/40'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isSaviour
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
                    }`}>
                      ROLE: {selectedShip.roleTitle}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      FACTION: {selectedShip.faction}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-wide mt-1">
                    {selectedShip.name}
                  </h3>
                </div>

                {/* Stats Bar (Power, HP, Speed) */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>PWR <strong className="text-amber-300">{selectedShip.power}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <span>HP <strong className="text-red-300">{selectedShip.hp}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SPD <strong className="text-cyan-300">{selectedShip.speedRating}</strong></span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedShip.description}
              </p>

              {/* Exact 5 Ability Slots Display */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest mb-2 block ${
                  isSaviour ? 'text-teal-400' : 'text-fuchsia-400'
                }`}>
                  SHIP ABILITIES (5 ACTIVE SLOTS — KEYS [1] TO [5]):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {selectedShip.abilities.map((ab) => (
                    <div
                      key={ab.id}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-left ${
                        ab.isUltimate
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-black/60 border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                          <span className={`font-black ${ab.isUltimate ? 'text-amber-400' : isSaviour ? 'text-teal-300' : 'text-fuchsia-300'}`}>
                            KEY [{ab.keyLabel}]
                          </span>
                          <span className="text-slate-400">
                            {ab.cooldownSeconds}s CD
                          </span>
                        </div>
                        <strong className={`text-xs block leading-tight ${ab.isUltimate ? 'text-amber-200 font-black' : 'text-white'}`}>
                          {ab.name}
                        </strong>
                        <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                          {ab.description}
                        </p>
                      </div>
                      {ab.isUltimate && (
                        <span className="mt-2 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
                          ULTIMATE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Controls Summary Notice */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-black ${isSaviour ? 'text-teal-400' : 'text-fuchsia-400'}`}>
                CONTROLS:
              </span>
              <span className="text-slate-300 text-[11px]">
                <strong>Pitch/Yaw [W,A,S,D]</strong> · <strong>Roll [Q,E]</strong> · <strong>ENGINE ON/OFF [T]</strong> · <strong>Station-Keeping</strong> · <strong>Abilities [1-5]</strong> · <strong>Hydraulic Clamps [L]</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STATION-KEEPING DAMPING ACTIVE</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-6 py-4 border-t bg-black/85 sticky bottom-0 z-20 ${
          isSaviour ? 'border-teal-500/30' : 'border-fuchsia-500/30'
        }`}>
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase transition-all"
          >
            RETURN TO MENU
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onStartMission(
                variant,
                selectedShip.id,
                isSaviour && isSimulationJump ? startRegionIndex : 0
              );
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm tracking-wider uppercase shadow-2xl transition-all active:scale-95 ${
              isSaviour
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.5)]'
                : 'bg-gradient-to-r from-fuchsia-500 to-rose-600 hover:from-fuchsia-400 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(217,70,239,0.5)]'
            }`}
          >
            <Play className={`w-4 h-4 ${isSaviour ? 'fill-slate-950' : 'fill-white'}`} />
            <span>
              {isSaviour
                ? isSimulationJump
                  ? `LAUNCH PRACTICE JUMP (REGION ${startRegionIndex + 1} · ${(startRegionIndex * 2000).toLocaleString()} KM)`
                  : `LAUNCH SAVIOUR ESCORT (50,000 KM) · ${selectedShip.name}`
                : `LAUNCH HUNTERS ASSAULT (1,000 HP BOSS) · ${selectedShip.name}`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
