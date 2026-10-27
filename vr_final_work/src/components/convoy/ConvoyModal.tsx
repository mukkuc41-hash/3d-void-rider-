/**
 * VOID-RIDER 3D — CONVOY GUARDIAN BRIEFING MODAL
 * 
 * Pre-mission tactical briefing:
 * - Convoy Fleet composition (1 Flagship Titan Prime + 3 Cargo Frigates)
 * - 7 Sequential Mission Events Roadmap
 * - Flight & Combat Controls summary
 * - Start Escort Mission action
 */
import React, { useState } from 'react';
import { ConvoyVariant } from '../../game/convoy/convoyTypes';
import {
  ShieldAlert,
  Radio,
  Timer,
  Play,
  X,
  Target,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { sound } from '../../game/audio';

interface ConvoyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: (variant: ConvoyVariant) => void;
  currentShipName: string;
}

export const ConvoyModal: React.FC<ConvoyModalProps> = ({
  isOpen,
  onClose,
  onStartMission,
  currentShipName,
}) => {
  const [variant, setVariant] = useState<ConvoyVariant>('SAVIOUR');
  if (!isOpen) return null;

  const eventSteps = [
    { num: 1, title: 'RENDEZVOUS', desc: 'Rendezvous with fleet at Solar Anchor Alpha.' },
    { num: 2, title: 'DEBRIS CORRIDOR', desc: 'Shoot & clear dense physical asteroid field.' },
    { num: 3, title: 'DRONE INTERCEPT', desc: 'Destroy hostile scout vanguard strike wave.' },
    { num: 4, title: 'AMBUSH CROSSFIRE', desc: 'Protect cargo flanks from heavy gunship pirate assault.' },
    { num: 5, title: 'HULL BREACH & REPAIR', desc: 'Retrieve field nanite canisters to restore damaged ships.' },
    { num: 6, title: 'FINAL APPROACH', desc: 'Escort fleet through hazardous defense matrix corridor.' },
    { num: 7, title: 'FINAL DEFENSE', desc: 'Hold the extraction gate perimeter until the convoy docks safely.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-ui select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#04161a]/95 border-2 border-teal-500/50 rounded-2xl shadow-[0_0_50px_rgba(20,184,166,0.3)] flex flex-col text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-teal-500/30 bg-gradient-to-r from-[#06241e] via-[#04161a] to-[#041c24]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400">
                  DEEP SPACE ESCORT OPERATION
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono border border-teal-500/30">
                  7-EVENT MISSION
                </span>
              </div>
              <h2 className="text-xl font-black italic tracking-wider text-white">
                CONVOY GUARDIAN
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1">
          {/* Mission Overview */}
          <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                TACTICAL MISSION DIRECTIVE
              </span>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                {variant === 'SAVIOUR' ? 'Escort the civilian cargo fleet through a hazardous 3D corridor to the Orbital Citadel Extraction Gate. Survive asteroid fields and enemy ambushes, defend transports, and collect repair nanites.' : 'Engage the full Hunters formation: 3 front fighters, 2 forward-mid hunters, a 1,000 HP boss protected by 6 defence drones, 2 rear-mid hunters, and 3 rear fighters. Destroy the guards to weaken boss protection, then defeat the boss.'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-teal-500/40 text-xs font-mono text-teal-300 shrink-0">
              <Timer className="w-4 h-4 text-teal-400" />
              <span>{variant === 'SAVIOUR' ? '9 CONVOY SHIPS' : '17 HOSTILES · 1 BOSS'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setVariant('SAVIOUR')} className={`rounded-xl border p-4 text-left transition-all ${variant === 'SAVIOUR' ? 'border-teal-300 bg-teal-500/15 shadow-[0_0_18px_rgba(20,184,166,.18)]' : 'border-white/10 bg-black/30 hover:border-teal-500/40'}`}>
              <span className="text-[10px] font-black tracking-[.2em] text-teal-300">VARIANT 01</span>
              <strong className="mt-1 block text-sm text-white">SAVIOUR — CONVOY ESCORT</strong>
              <span className="mt-1 block text-[11px] text-slate-400">Protect the 9-ship fleet and reach extraction.</span>
            </button>
            <button type="button" onClick={() => setVariant('HUNTERS')} className={`rounded-xl border p-4 text-left transition-all ${variant === 'HUNTERS' ? 'border-fuchsia-300 bg-fuchsia-500/15 shadow-[0_0_18px_rgba(192,132,252,.18)]' : 'border-white/10 bg-black/30 hover:border-fuchsia-500/40'}`}>
              <span className="text-[10px] font-black tracking-[.2em] text-fuchsia-300">VARIANT 02</span>
              <strong className="mt-1 block text-sm text-white">HUNTERS — BOSS ASSAULT</strong>
              <span className="mt-1 block text-[11px] text-slate-400">Survive the formation and destroy the protected boss.</span>
            </button>
          </div>

          {variant === 'SAVIOUR' && (<>{/* Convoy Fleet Roster */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              CONVOY FLEET COMPOSITION (9 SHIPS):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/50 border border-teal-500/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-300 block">1x AEGIS LEAD VANGUARD</span>
                  <span className="text-[10px] text-slate-400">Front Lead Guard · 800 HP</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  LEAD GUARD
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-300 block">2x FORWARD-MID GUARDS</span>
                  <span className="text-[10px] text-slate-400">Port & Starboard Escorts · 500 HP ea</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                  FWD GUARDS
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-cyan-300 block">3x PROTECTED CARGO SHIPS</span>
                  <span className="text-[10px] text-slate-400">Alpha, Beta, Gamma Haulers · 450 HP ea</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CARGO PODS
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-300 block">2x REAR-MID GUARDS</span>
                  <span className="text-[10px] text-slate-400">Port & Starboard Flank · 500 HP ea</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                  REAR GUARDS
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">1x STERN REAR GUARD</span>
                  <span className="text-[10px] text-slate-400">Tail Line Defense · 550 HP</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                  STERN GUARD
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-300 block">PLAYER ESCORT INTERCEPTOR</span>
                  <span className="text-[10px] text-slate-400">{currentShipName} · Separate Fighter</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  PLAYER
                </span>
              </div>
            </div>
          </div>

          {/* 7 Mission Events Roadmap */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-400" />
              7-EVENT MISSION ROADMAP:
            </h3>

            <div className="space-y-1.5">
              {eventSteps.map((ev) => (
                <div
                  key={ev.num}
                  className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5 text-xs"
                >
                  <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 font-mono font-black flex items-center justify-center shrink-0 text-[10px] border border-teal-500/40">
                    {ev.num}
                  </span>
                  <span className="font-bold text-teal-200 min-w-[130px] sm:min-w-[160px] truncate">
                    {ev.title}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate flex-1">
                    {ev.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          </>)}

          {/* Controls Guide */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-teal-400">CONTROLS:</span>
              <span className="text-slate-300 text-[11px]">
                <strong>WASD / Touch Joystick</strong> (Pitch & Steer) · <strong>SPACE / F</strong> (Cannons) · <strong>SHIFT</strong> (Boost) · <strong>CTRL / X</strong> (Brake) · <strong>C</strong> (Shield) · <strong>R</strong> (EMP) · <strong>V</strong> (Variant Signature Ability)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>UP TO 7,500 CREDITS REWARD</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-teal-500/30 bg-black/60">
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
              onStartMission(variant);
            }}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{variant === 'SAVIOUR' ? 'START SAVIOUR ESCORT' : 'START HUNTERS ASSAULT'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
