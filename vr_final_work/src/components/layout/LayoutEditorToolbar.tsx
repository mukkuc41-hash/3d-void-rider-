import React, { useState } from 'react';
import { Grid, Save, RotateCcw, Undo2, X, Check, Sliders, Sparkles } from 'lucide-react';
import { sound } from '../../game/audio';

interface LayoutEditorToolbarProps {
  screenTitle: string;
  snapToGrid: boolean;
  gridSize: number;
  canUndo: boolean;
  onToggleSnap: () => void;
  onUndo: () => void;
  onReset: () => void;
  onSave: () => void;
  onExit: () => void;
  statusMessage: string | null;
}

export const LayoutEditorToolbar: React.FC<LayoutEditorToolbarProps> = ({
  screenTitle,
  snapToGrid,
  gridSize,
  canUndo,
  onToggleSnap,
  onUndo,
  onReset,
  onSave,
  onExit,
  statusMessage,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => {
    sound.playMenuClick();
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
    } else {
      setConfirmReset(false);
      onReset();
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 pointer-events-auto select-none">
      {/* Floating Toolbar Container */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-slate-950/95 border border-cyan-500/50 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.22)]">
        {/* Left: Mode Title & Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] sm:text-xs font-black tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]" />
            <span>EDIT LAYOUT</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[11px] sm:text-xs font-ui font-black uppercase tracking-wider text-white truncate max-w-[140px] sm:max-w-none">
            {screenTitle}
          </span>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Snap to Grid Toggle */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onToggleSnap();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              snapToGrid
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Snap elements to alignment grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">SNAP:</span>
            <span>{snapToGrid ? `${gridSize}px` : 'OFF'}</span>
          </button>

          {/* Undo */}
          <button
            onClick={() => {
              if (canUndo) {
                sound.playMenuClick();
                onUndo();
              }
            }}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-mono text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              canUndo
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                : 'bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Undo last move/resize"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">UNDO</span>
          </button>

          {/* Reset Layout */}
          <button
            onClick={handleResetClick}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-mono text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              confirmReset
                ? 'bg-rose-500/30 border-rose-400 text-rose-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
            }`}
            title="Restore default factory layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{confirmReset ? 'CONFIRM RESET?' : 'RESET'}</span>
          </button>

          {/* Save Layout */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onSave();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-ui font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[0_0_15px_#00f0ff] transition-all cursor-pointer"
            title="Persist layout preferences to local storage"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE</span>
          </button>

          {/* Exit Editor */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onExit();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-mono text-[10px] sm:text-xs font-bold transition-all cursor-pointer"
            title="Exit layout editor mode"
          >
            <X className="w-3.5 h-3.5" />
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Non-Blocking Status Toast */}
      {statusMessage && (
        <div className="px-3.5 py-1 rounded-xl bg-cyan-950/90 border border-cyan-400/80 text-cyan-200 text-xs font-mono font-bold tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-fadeIn flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
