import React from 'react';
import { Play, RotateCcw, Home, Settings, Volume2, Shield } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnToLobby: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onReturnToLobby,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col items-center text-center">
        {/* Header */}
        <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-400 text-cyan-400 shadow-[0_0_20px_#00f0ff] mb-3">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-ui font-black uppercase tracking-widest text-white">
          WARP SUSPENDED
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Systems idling in sub-space orbit
        </p>

        {/* Action Menu */}
        <div className="w-full space-y-3 mt-6">
          <button
            onClick={() => {
              sound.playMenuClick();
              onResume();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-ui font-black text-sm uppercase tracking-widest shadow-[0_0_20px_#00f0ff] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" /> RESUME RACE
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onRestart();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 hover:text-white font-ui font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RESTART RUN
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenSettings();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-200 hover:text-white font-ui font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> AV & TELEMETRY SETTINGS
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onReturnToLobby();
            }}
            className="w-full py-3 px-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 hover:border-rose-500 text-rose-300 hover:text-rose-200 font-ui font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> ABORT TO HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
