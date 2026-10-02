import React from 'react';
import { AlertTriangle, RotateCcw, Home, Trophy, Zap, Gauge, Clock, ShieldAlert } from 'lucide-react';
import { RunStats } from '../types';

interface GameOverModalProps {
  stats: RunStats | null;
  onRestart: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onReturnToLobby,
}) => {
  if (!stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-950/95 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
        {/* Pulsing Warning Icon */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
          <div className="relative p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-400 shadow-[0_0_25px_#f43f5e]">
            <ShieldAlert className="w-10 h-10" />
          </div>
        </div>

        {/* Header Titles */}
        <h2 className="text-2xl sm:text-3xl font-ui font-black uppercase tracking-widest text-white drop-shadow-[0_0_15px_#f43f5e]">
          VESSEL DESTROYED
        </h2>
        <div className="mt-1 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-xs tracking-wider">
          CAUSE: {stats.reason || 'CRITICAL HULL COMPROMISE'}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" /> DISTANCE REACHED
            </span>
            <span className="text-xl font-ui font-black text-cyan-400">
              {stats.distance} <span className="text-xs font-mono text-slate-400">m</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> CREDITS SALVAGED
            </span>
            <span className="text-xl font-ui font-black text-amber-400">
              +{stats.creditsCollected}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Gauge className="w-3.5 h-3.5 text-fuchsia-400" /> PEAK VELOCITY
            </span>
            <span className="text-xl font-ui font-black text-fuchsia-400">
              {stats.topSpeed} <span className="text-xs font-mono text-slate-400">km/h</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> SURVIVAL TIME
            </span>
            <span className="text-xl font-ui font-black text-emerald-400">
              {stats.survivalTime} <span className="text-xs font-mono text-slate-400">s</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-ui font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2 group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            RE-ENGAGE RUN
          </button>
          <button
            onClick={onReturnToLobby}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-ui font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            RETURN TO HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
