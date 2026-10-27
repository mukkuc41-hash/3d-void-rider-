/**
 * VOID-RIDER 3D — JUGGERNAUT COMBAT VICTORY & RESULTS SCREEN
 * Clean authoritative match conclusion modal:
 * - Victory / Defeat proclamation with winning faction & reason
 * - Battle breakdown stats (Damage Dealt, Taken, Eliminations, Time Survived, Revives)
 * - Credit & XP progression rewards
 * - Instant Replay Match and Return to Main Menu buttons
 */
import React from 'react';
import {
  Trophy,
  Skull,
  RotateCcw,
  Home,
  ShieldCheck,
  Crosshair,
  Timer,
  Zap,
  Sparkles,
  Users,
} from 'lucide-react';
import { JuggernautMatchStats } from '../../game/juggernaut/juggernautTypes';
import { sound } from '../../game/audio';

interface JuggernautVictoryModalProps {
  stats: JuggernautMatchStats | null;
  onReplayMatch: () => void;
  onReturnToMainMenu: () => void;
}

export const JuggernautVictoryModal: React.FC<JuggernautVictoryModalProps> = ({
  stats,
  onReplayMatch,
  onReturnToMainMenu,
}) => {
  if (!stats) return null;

  const isVictory = stats.victory;
  const minutes = Math.floor(stats.matchTimeSeconds / 60);
  const seconds = stats.matchTimeSeconds % 60;
  const matchDurationFormatted = `${minutes}m ${seconds}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in font-ui select-none text-slate-100">
      <div className="relative w-full max-w-xl bg-[#090d16]/95 border-2 border-red-500/50 rounded-3xl p-8 shadow-[0_0_60px_rgba(239,68,68,0.35)] flex flex-col items-center text-center space-y-6">
        {/* Glow Header Icon */}
        <div
          className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center shadow-2xl ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              : 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          }`}
        >
          {isVictory ? (
            <Trophy className="w-10 h-10 animate-bounce" />
          ) : (
            <Skull className="w-10 h-10 animate-pulse" />
          )}
        </div>

        {/* Title & Proclamation */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            {stats.mode === 'APEX_PREDATOR' ? 'APEX PREDATOR' : 'SWARM HUNT'} // ENGAGEMENT CONCLUDED
          </span>
          <h2
            className={`text-3xl font-black italic tracking-wider ${
              isVictory
                ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                : 'text-red-500'
            }`}
          >
            {isVictory ? 'VICTORY SECURED' : 'TACTICAL DEFEAT'}
          </h2>
          <p className="text-xs font-mono text-slate-300 max-w-md mx-auto pt-1 leading-relaxed">
            {stats.reason}
          </p>
        </div>

        {/* Battle Stats Grid */}
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Crosshair className="w-3 h-3 text-red-400" /> DAMAGE DEALT
            </span>
            <div className="text-base font-black text-white font-mono">
              {stats.totalDamageDealt}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Skull className="w-3 h-3 text-amber-400" /> ELIMINATIONS
            </span>
            <div className="text-base font-black text-amber-400 font-mono">
              {stats.shipsEliminated}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Timer className="w-3 h-3 text-cyan-400" /> MATCH TIME
            </span>
            <div className="text-base font-black text-cyan-300 font-mono">
              {matchDurationFormatted}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> DAMAGE TAKEN
            </span>
            <div className="text-base font-black text-slate-300 font-mono">
              {stats.totalDamageTaken}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> REVIVES DONE
            </span>
            <div className="text-base font-black text-emerald-400 font-mono">
              {stats.revivesCompleted}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> SURVIVORS LEFT
            </span>
            <div className="text-base font-black text-purple-300 font-mono">
              {stats.shipsRemaining}
            </div>
          </div>
        </div>

        {/* Rewards Ribbon */}
        <div className="w-full flex items-center justify-around p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black/50 to-amber-950/40 border border-amber-500/30 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">CREDITS EARNED:</span>
            <span className="font-black text-amber-400 text-sm">+{stats.creditsEarned} CR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">PILOT XP:</span>
            <span className="font-black text-cyan-400 text-sm">+{stats.xpEarned} XP</span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="w-full flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              sound.playMenuClick();
              onReplayMatch();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20 transition-all active:scale-95 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>REPLAY MATCH</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onReturnToMainMenu();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
