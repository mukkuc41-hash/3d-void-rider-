import React from 'react';
import { EvacuationTelemetry } from '../game/FinalCollapseManager';
import {
  getFinalCollapse100Event,
  formatCinematicElapsedTimer,
} from '../game/finalCollapse100Events';

interface FinalCollapseFailureOverlayProps {
  evacuation: EvacuationTelemetry;
}

export const FinalCollapseFailureOverlay: React.FC<FinalCollapseFailureOverlayProps> = ({
  evacuation,
}) => {
  if (!evacuation.routeConsumptionActive && !evacuation.generalFailureActive && !evacuation.blackScreenActive) {
    return null;
  }

  // Pure Black Screen (Phase 7 climax / Blackout)
  if (evacuation.blackScreenActive && evacuation.endingVariant !== 'MISSED_ESCAPE_COLLAPSE') {
    return (
      <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
        <div className="font-mono text-xs text-red-500/60 uppercase tracking-[0.4em] animate-pulse">
          SINGULARITY ABSORPTION COMPLETE
        </div>
      </div>
    );
  }

  // Missed-all-routes ending: exactly 20-minute 100-event cinematic overlay (12 seconds per event)
  // The panoramic camera view of the whole black hole remains completely unobstructed.
  if (evacuation.endingVariant === 'MISSED_ESCAPE_COLLAPSE') {
    const elapsedSec = evacuation.cinematicElapsedSeconds ?? (evacuation.cinematicProgress * 1200.0);
    const eventInfo = getFinalCollapse100Event(elapsedSec);
    const evNum = evacuation.currentEventNumber ?? eventInfo.eventNumber;
    const title = evacuation.currentEventTitle ?? eventInfo.event.title;
    const presentation = evacuation.currentEventPresentation ?? eventInfo.event.presentation;
    const timeRange = evacuation.currentEventTimeRange ?? eventInfo.event.timeRange;
    const timerDisplay = formatCinematicElapsedTimer(elapsedSec);
    const progressPercent = Math.min(100, Math.round(eventInfo.totalProgress * 100));

    const isFirstEvent = evNum === 1;
    const isPlanetaryCollision = evNum === 4;
    const isRouteTorn = evNum === 8;
    const isGravWave = evNum >= 22 && evNum <= 31;
    const isTwinRings = evNum >= 32 && evNum <= 34;
    const isWhiteFlash = evNum === 50;
    const isRegenStart = evNum === 51;
    const isComplete = evNum === 100;

    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between p-4 sm:p-7 font-mono select-none">
        {/* Top Header Card with glassmorphism */}
        <div className="w-full max-w-2xl rounded-2xl border border-red-500/50 bg-black/60 p-4 text-center backdrop-blur-md shadow-[0_0_50px_rgba(255,50,0,0.35)]">
          <div className="flex items-center justify-between text-[10px] sm:text-xs tracking-[0.25em] text-red-300 font-bold border-b border-red-500/30 pb-1.5 mb-2">
            <span>MODE 21 — BLACK HOLE // FINAL COLLAPSE</span>
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-300 font-mono text-[9px] sm:text-[10px] bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                {timeRange}
              </span>
              <span className="text-orange-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/50 font-black">
                EVENT {evNum} / 100
              </span>
            </div>
          </div>

          {/* At Event 1 (00:00–00:12): show SAFE ZONE MISSED prominently */}
          {isFirstEvent && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-600/80 border border-white text-white font-ui font-black text-xs sm:text-sm tracking-widest uppercase animate-pulse shadow-[0_0_20px_#ff0033]">
              ⚠ SAFE ZONE MISSED // EVACUATION DEADLINE EXPIRED
            </div>
          )}

          {/* Planetary collision highlight at Event 4 */}
          {isPlanetaryCollision && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-amber-950/80 border border-amber-400 text-amber-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#f59e0b]">
              ★ PLANETARY COLLISION // CELESTIAL IMPACT [00:36–00:48]
            </div>
          )}

          {/* Route tears apart at Event 8 */}
          {isRouteTorn && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-red-950/80 border border-red-400 text-red-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#ef4444]">
              ★ ESCAPE ROUTE TEARS APART [01:24–01:36]
            </div>
          )}

          {/* Gravitational Wave Pulse Indicator (Events 22 to 31) */}
          {isGravWave && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#06b6d4]">
              ★ GRAVITATIONAL WAVE {evNum - 21} OF 10 [UPPER & LOWER WAVEFRONTS]
            </div>
          )}

          {/* Twin Debris Rings at Events 32-34 */}
          {isTwinRings && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-purple-950/80 border border-purple-400 text-purple-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#a855f7]">
              ★ TWIN DEBRIS RINGS ORBITING [UPPER & LOWER PLANES]
            </div>
          )}

          {/* Brilliant White Flash at Event 50 */}
          {isWhiteFlash && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-white/90 border border-amber-300 text-black font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_25px_#ffffff]">
              ★ BRILLIANT WHITE FLASH [10:00]
            </div>
          )}

          {/* Universe Regeneration Beginning at Event 51 */}
          {isRegenStart && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-400 text-emerald-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#10b981]">
              ★ UNIVERSE REGENERATION IN PROGRESS
            </div>
          )}

          {/* Climax at Event 100 */}
          {isComplete && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-ui font-black text-xs tracking-widest uppercase shadow-[0_0_15px_#00f0ff]">
              ★ REGENERATION COMPLETE // READY FOR RESULTS [20:00]
            </div>
          )}

          <h2 className="text-xl sm:text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_24px_rgba(255,80,40,0.9)]">
            EVENT {evNum < 10 ? `0${evNum}` : evNum} // {title}
          </h2>
          <div className="mt-2 text-[10px] sm:text-xs tracking-[0.14em] text-orange-200 uppercase leading-relaxed max-w-xl mx-auto">
            {presentation}
          </div>
        </div>

        {/* Bottom Timeline and Progress Card */}
        <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-black/60 p-3 sm:p-4 text-center backdrop-blur-md shadow-2xl">
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/90 font-bold mb-2">
            <span className="tracking-widest text-red-400">SAFE ZONE MISSED</span>
            <span className="text-cyan-300 font-mono text-xs sm:text-sm tracking-widest font-black px-2 py-0.5 rounded bg-black/70 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              {timerDisplay} / 20:00
            </span>
            <span className="text-orange-300 font-mono font-black">{progressPercent}%</span>
          </div>

          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10 border border-white/20">
            {/* Markers: 10 Waves (21%), Twin Rings (31%), White Flash (50%) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/80 z-10"
              style={{ left: '21%' }}
              title="04:12 Gravitational Waves (1 to 10)"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-400/80 z-10"
              style={{ left: '31%' }}
              title="06:12 Twin Debris Rings"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
              style={{ left: '50%' }}
              title="10:00 Brilliant White Flash"
            />
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 via-purple-500 via-cyan-400 to-emerald-300 transition-all duration-150 shadow-[0_0_15px_#00f0ff]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-mono text-slate-400 mt-1.5 px-0.5">
            <span>00:00 START</span>
            <span className="text-cyan-300/80">04:12 WAVES</span>
            <span className="text-purple-300/80">06:12 TWIN RINGS</span>
            <span className="text-white/90">10:00 FLASH</span>
            <span>20:00 COMPLETE</span>
          </div>
        </div>
      </div>
    );
  }

  // 34. Route-Consumption Failure Cinematic (7 Distinct Phases)
  if (evacuation.routeConsumptionActive) {
    const phase = evacuation.cinematicPhase;

    let title = 'ROUTE COLLAPSE';
    let subtitle = 'ESCAPE ROUTE LOST';
    let warningLevel = 'CRITICAL';

    switch (phase) {
      case 1:
        title = 'ROUTE COLLAPSE';
        subtitle = 'ESCAPE ROUTE LOST';
        warningLevel = 'CRITICAL';
        break;
      case 2:
        title = 'TRACK DISINTEGRATION';
        subtitle = 'STRUCTURAL SEPARATION IN PROGRESS';
        warningLevel = 'EMERGENCY';
        break;
      case 3:
        title = 'GRAVITATIONAL LOCK';
        subtitle = 'EXTREME TIDAL FORCES';
        warningLevel = 'LETHAL';
        break;
      case 4:
        title = 'ROUTE SUPPORT LOST';
        subtitle = 'TRAJECTORY DRAWN TOWARDS SINGULARITY';
        warningLevel = 'EVENT HORIZON';
        break;
      case 5:
        title = 'GRAVITY LOCK';
        subtitle = 'SHIP TRAJECTORY LOST';
        warningLevel = 'SINGULARITY CAPTURE';
        break;
      case 6:
        title = 'EXTREME TIDAL FORCES';
        subtitle = 'SHIP INTEGRITY CRITICAL';
        warningLevel = 'SPAGHETTIFICATION';
        break;
      case 7:
        title = 'EVENT HORIZON ABSORPTION';
        subtitle = 'DARK GRAVITATIONAL IMPLOSION';
        warningLevel = 'VOID CONSUMPTION';
        break;
    }

    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between p-8 font-mono select-none">
        {/* Top Danger Meter Banner */}
        <div className="w-full max-w-xl rounded-2xl border-2 border-red-500 bg-black/90 p-4 text-center shadow-[0_0_60px_rgba(239,68,68,0.7)] backdrop-blur-md animate-pulse">
          <div className="flex items-center justify-between border-b border-red-500/40 pb-1 text-[11px] font-black tracking-[0.25em] text-red-400">
            <span>⚠️ CATASTROPHIC FAILURE</span>
            <span className="text-red-300">PHASE {phase} / 7</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-ui font-black uppercase tracking-widest text-white mt-1 drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            {title}
          </h2>

          <div className="text-xs sm:text-sm font-bold text-red-300 tracking-wider mt-0.5 uppercase">
            {subtitle}
          </div>

          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
            <span>STATUS: <span className="text-red-400 font-bold">{warningLevel}</span></span>
            <span>TRAJECTORY: <span className="text-red-400 font-bold">EVENT HORIZON</span></span>
          </div>
        </div>

        {/* Center Gravitational Glitch Pulse Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(239,68,68,0.55)] pointer-events-none animate-pulse" />

        {/* Bottom Phase Progress Bar */}
        <div className="w-full max-w-md bg-black/80 border border-red-500/40 rounded-xl p-3 text-center">
          <div className="flex justify-between text-[10px] text-red-400 mb-1">
            <span>SINGULARITY CAPTURE PROGRESS</span>
            <span>{Math.round(evacuation.cinematicProgress * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-red-500/30">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-400 transition-all duration-150"
              style={{ width: `${Math.round(evacuation.cinematicProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // General Failure Cinematic Overlay
  if (evacuation.generalFailureActive) {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full rounded-2xl border-2 border-red-600 bg-black/90 p-6 text-center shadow-[0_0_60px_rgba(239,68,68,0.7)] backdrop-blur-md animate-pulse">
          <div className="text-[10px] font-black text-red-400 tracking-[0.3em] uppercase mb-2">
            CRITICAL EVACUATION FAILURE
          </div>
          <h2 className="text-3xl font-ui font-black uppercase tracking-widest text-white drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            {evacuation.endingVariant === 'MISSED_ESCAPE_COLLAPSE' ? 'ESCAPE WINDOW MISSED' : 'GRAVITATIONAL CAPTURE'}
          </h2>
          <p className="text-xs text-red-300 mt-2 tracking-wider">
            {evacuation.endingVariant === 'MISSED_ESCAPE_COLLAPSE'
              ? 'ROUTE DESTROYED — COSMIC COLLAPSE'
              : (evacuation.failureCause ? evacuation.failureCause.replace(/_/g, ' ') : 'VESSEL DRAWN INTO EVENT HORIZON')}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
