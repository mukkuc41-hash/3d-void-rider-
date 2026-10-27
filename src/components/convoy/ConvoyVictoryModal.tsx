/**
 * VOID-RIDER 3D — CONVOY GUARDIAN VICTORY / DEFEAT RESULTS MODAL
 * 
 * Authoritative mission conclusion modal:
 * - Victory / Defeat status and cause
 * - Transports saved & Convoy final integrity
 * - Combat breakdown (Drones destroyed, Debris cleared, Nanite repairs)
 * - Credits & XP rewards
 * - Replay & Return to Main Menu actions
 */
import React from 'react';
import {
  Trophy,
  Skull,
  ShieldCheck,
  Zap,
  RotateCcw,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { ConvoyMissionResult, ConvoyVariant } from '../../game/convoy/convoyTypes';
import { sound } from '../../game/audio';

interface ConvoyVictoryModalProps {
  isOpen: boolean;
  results: ConvoyMissionResult | null;
  variant?: ConvoyVariant;
  onReplay: () => void;
  onReturnToMenu: () => void;
  onTriggerEmergencyEscape?: () => void;
}

export const ConvoyVictoryModal: React.FC<ConvoyVictoryModalProps> = ({
  isOpen,
  results,
  variant = 'SAVIOUR',
  onReplay,
  onReturnToMenu,
  onTriggerEmergencyEscape,
}) => {
  if (!isOpen || !results) return null;

  const isVictory = results.victory;

  const minutes = Math.floor(results.timeElapsedSeconds / 60);
  const seconds = results.timeElapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-ui select-none animate-fade-in">
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl flex flex-col ${
          isVictory
            ? 'bg-[#04161a]/95 border-teal-500/60 shadow-[0_0_50px_rgba(20,184,166,0.35)]'
            : 'bg-[#18080a]/95 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
        }`}
      >
        {/* Banner Glow Header */}
        <div
          className={`px-6 py-6 text-center space-y-2 border-b ${
            isVictory
              ? 'bg-gradient-to-b from-teal-950/80 to-transparent border-teal-500/30'
              : 'bg-gradient-to-b from-red-950/80 to-transparent border-red-500/30'
          }`}
        >
          <div className="flex justify-center">
            {isVictory ? (
              <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-400/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Skull className="w-10 h-10 animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                isVictory ? 'text-teal-400' : 'text-red-400'
              }`}
            >
              OPERATION {isVictory ? 'ACCOMPLISHED' : 'FAILED'}
            </span>
            <h2 className="text-2xl font-black italic tracking-wider text-white">
              {variant === 'HUNTERS'
                ? (isVictory ? 'TARGET CONVOY NEUTRALIZED' : 'HUNTERS DEFEATED')
                : (isVictory ? '50,000 KM CAMPAIGN COMPLETE · PARKING DOME SECURED' : 'CONVOY LOST')}
            </h2>
          </div>

          <p className="text-xs text-slate-300 font-ui font-medium max-w-md mx-auto">
            {results.reason}
          </p>
        </div>

        {/* Breakdown Statistics */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Route Distance */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                ROUTE DISTANCE
              </span>
              <span className="text-lg font-black text-cyan-300 font-mono">
                50,000 KM
              </span>
            </div>

            {/* Destination Facility */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                FINAL DESTINATION
              </span>
              <span className="text-lg font-black text-amber-300 font-mono truncate block">
                PARKING DOME
              </span>
            </div>

            {/* Transports Saved */}
            {variant === 'SAVIOUR' && (<div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                TRANSPORTS SAVED
              </span>
              <span className="text-lg font-black text-teal-300 font-mono">
                {results.transportsSaved} / {results.transportsTotal}
              </span>
            </div>)}

            {/* Convoy Final Integrity */}
            {variant === 'SAVIOUR' && (<div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                CONVOY INTEGRITY
              </span>
              <span className="text-lg font-black text-emerald-300 font-mono">
                {results.convoyFinalIntegrity}%
              </span>
            </div>)}

            {/* Drones Destroyed */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                {variant === 'HUNTERS' ? 'HUNTERS DEFEATED' : 'DRONES NEUTRALIZED'}
              </span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {results.dronesDestroyed} HOSTILES
              </span>
            </div>

            {/* Mission Time */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                MISSION DURATION
              </span>
              <span className="text-lg font-black text-slate-200 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {timeFormatted}
              </span>
            </div>
          </div>

          {/* Epilogue Narrative for Saviour Mode */}
          {isVictory && variant === 'SAVIOUR' && (
            <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-[11px] font-ui leading-relaxed text-slate-300">
              <span className="text-teal-400 font-black tracking-wider uppercase block mb-1">
                EPILOGUE · GUARDIAN TERMINAL SECURED
              </span>
              The fleet rests securely inside the multi-level subterranean facility. All magnetic hydraulic clamps have locked the hulls in place in Bay 01, environmental scrubbers are cycling, and the long-haul 50,000 km mission reaches permanent sanctuary.
            </div>
          )}

          {/* Rewards Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-950/40 via-black/60 to-emerald-950/40 border border-teal-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                MISSION REWARDS:
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-amber-300 font-black">+{results.creditsEarned} CREDITS</span>
              <span className="text-teal-300 font-black">+{results.xpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-2.5">
          {isVictory && variant === 'SAVIOUR' && onTriggerEmergencyEscape && (
            <button
              onClick={() => {
                sound.playMenuClick();
                onTriggerEmergencyEscape();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-rose-400/50 shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>TEST DRILL: INITIATE EMERGENCY ESCAPE ROUTE [U]</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                sound.playMenuClick();
                onReturnToMenu();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>

            <button
              onClick={() => {
                sound.playMenuClick();
                onReplay();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.4)] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REPLAY MISSION</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
