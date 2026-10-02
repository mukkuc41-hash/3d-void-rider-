import React, { useEffect, useState } from 'react';
import { Shield, Zap, AlertTriangle, Skull, Flame } from 'lucide-react';
import { CollisionEventFeedback } from '../types';

interface CollisionHUDProps {
  feedback: CollisionEventFeedback | null;
}

export const CollisionHUD: React.FC<CollisionHUDProps> = ({ feedback }) => {
  const [activeFeedback, setActiveFeedback] = useState<CollisionEventFeedback | null>(null);
  const [showVignette, setShowVignette] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    setActiveFeedback(feedback);
    setShowVignette(true);

    const vignetteTimer = setTimeout(() => {
      setShowVignette(false);
    }, 280);

    const dismissTimer = setTimeout(() => {
      setActiveFeedback(current => (current?.id === feedback.id ? null : current));
    }, 1600);

    return () => {
      clearTimeout(vignetteTimer);
      clearTimeout(dismissTimer);
    };
  }, [feedback]);

  if (!activeFeedback && !showVignette) return null;

  const getTheme = (type: CollisionEventFeedback['type']) => {
    switch (type) {
      case 'RIVAL_CRASHED':
        return {
          border: 'border-emerald-400',
          bg: 'from-emerald-950/90 via-slate-950/95 to-emerald-950/90',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          glow: 'shadow-[0_0_35px_rgba(16,185,129,0.5)]',
          icon: <Skull className="w-5 h-5 text-emerald-400 animate-pulse" />,
          vignetteColor: 'rgba(16, 185, 129, 0.35)',
        };
      case 'CRITICAL_CRASH':
        return {
          border: 'border-rose-500',
          bg: 'from-rose-950/90 via-slate-950/95 to-rose-950/90',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.6)]',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />,
          vignetteColor: 'rgba(244, 63, 94, 0.45)',
        };
      case 'HEAVY_IMPACT':
        return {
          border: 'border-amber-400',
          bg: 'from-amber-950/90 via-slate-950/95 to-amber-950/90',
          text: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          glow: 'shadow-[0_0_35px_rgba(245,158,11,0.5)]',
          icon: <Flame className="w-5 h-5 text-amber-400 animate-pulse" />,
          vignetteColor: 'rgba(245, 158, 11, 0.35)',
        };
      case 'IMPACT':
      default:
        return {
          border: 'border-cyan-400',
          bg: 'from-cyan-950/90 via-slate-950/95 to-cyan-950/90',
          text: 'text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          glow: 'shadow-[0_0_30px_rgba(0,240,255,0.45)]',
          icon: <Zap className="w-5 h-5 text-cyan-400" />,
          vignetteColor: 'rgba(0, 240, 255, 0.35)',
        };
    }
  };

  const theme = activeFeedback ? getTheme(activeFeedback.type) : getTheme('IMPACT');

  return (
    <>
      {/* 1. Screen Edge Impact Vignette Flash */}
      {showVignette && (
        <div
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ease-out"
          style={{
            boxShadow: `inset 0 0 70px ${theme.vignetteColor}`,
            opacity: showVignette ? 1 : 0,
          }}
        />
      )}

      {/* 2. Top-Center Arcade Collision Alert Banner */}
      {activeFeedback && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
          <div
            className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 ${theme.border} bg-gradient-to-r ${theme.bg} ${theme.glow} backdrop-blur-md`}
          >
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              {theme.icon}
            </div>

            <div className="flex flex-col">
              <span className={`text-xs sm:text-sm font-ui font-black uppercase tracking-wider ${theme.text}`}>
                {activeFeedback.title}
              </span>
              {activeFeedback.detail && (
                <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-300">
                  {activeFeedback.detail}
                </span>
              )}
            </div>

            {/* Readout Badges */}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/15">
              {activeFeedback.shieldDelta !== undefined && activeFeedback.shieldDelta > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border-cyan-400/40">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>-{activeFeedback.shieldDelta}%</span>
                </div>
              )}
              {activeFeedback.hullDelta !== undefined && activeFeedback.hullDelta > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono bg-rose-950/60 text-rose-300 border-rose-500/40">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>-{activeFeedback.hullDelta}%</span>
                </div>
              )}
              {activeFeedback.type === 'RIVAL_CRASHED' && (
                <span className="px-2 py-0.5 rounded border text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                  TAKEDOWN
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
