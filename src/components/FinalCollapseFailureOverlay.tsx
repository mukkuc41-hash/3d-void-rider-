import React from 'react';
import { EvacuationTelemetry } from '../game/FinalCollapseManager';

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

  // Missed-all-routes ending: 30-second 10-event cinematic overlay
  // The panoramic camera view of the whole black hole remains completely unobstructed.
  if (evacuation.endingVariant === 'MISSED_ESCAPE_COLLAPSE') {
    const phase = Math.min(10, Math.max(1, evacuation.cinematicPhase));
    const titles = [
      'T-00:00 // ESCAPE WINDOW CLOSED',
      'EVENT 02 // SHIP STRUGGLE & THRUST OVERLOAD',
      'EVENT 03 // GRAVITATIONAL CAPTURE',
      'EVENT 04 // TIDAL FORCE & ROTATIONAL DRAG',
      'EVENT 05 // EXTREME SPAGHETTIFICATION',
      'EVENT 06 // EVENT HORIZON CROSSING',
      'EVENT 07 // SINGULARITY CRITICAL OVERLOAD',
      'EVENT 08 // COSMIC DETONATION & DESTRUCTION',
      'EVENT 09 // PRISMATIC COSMIC AFTERMATH',
      'EVENT 10 // WORLD RECONSTRUCTION & STABILIZATION',
    ];
    const subtitles = [
      'SAFE ZONE NOT REACHED BEFORE DEADLINE — SPACETIME COLLAPSE ACTIVE',
      'THRUSTERS AT MAXIMUM — LATERAL GRAVITATIONAL DRIFT TOWARDS VORTEX',
      'INERTIAL DAMPERS OFFLINE — ACCELERATING INWARD ORBITAL SPIRAL',
      'CRITICAL HULL STRAIN — VORTEX YAW ALIGNMENT TOWARDS CORE',
      'LONGITUDINAL ELONGATION — HULL STRETCHING INTO LUMINOUS ENERGY FILAMENTS',
      'PHOTON SPHERE BREACHED — SHIP DISSOLVING INTO INFALLING ENERGY RIBBONS',
      'MASS OVERLOAD DETECTED — SUPERHEATED ACCRETION DEBRIS RING SURGE',
      'CORE RUPTURE — SUB-BASS IMPLOSION & DEEP COSMIC BOOM SHOCKWAVES',
      'TOTAL VOID ANNIHILATION — EXPANDING PRISMATIC MULTI-COLOR NEBULA SPECTACLE',
      'HOLOGRAPHIC QUANTUM LATTICE RESTORED — ETERNAL KERR SINGULARITY STABILIZED',
    ];
    const idx = Math.min(titles.length - 1, Math.max(0, phase - 1));
    const progressPercent = Math.min(100, Math.round(evacuation.cinematicProgress * 100));
    const elapsedSec = (evacuation.cinematicProgress * 30.0).toFixed(1);

    return (
      <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-between p-5 sm:p-8 font-mono select-none">
        {/* Top Header Card with glassmorphism */}
        <div className="w-full max-w-2xl rounded-2xl border border-red-500/50 bg-black/40 p-4 text-center backdrop-blur-md shadow-[0_0_50px_rgba(255,50,0,0.35)]">
          <div className="flex items-center justify-between text-[10px] sm:text-xs tracking-[0.3em] text-red-300 font-bold border-b border-red-500/30 pb-1.5 mb-2">
            <span>QUANTUM LAUNCH PRO // FINAL COLLAPSE</span>
            <span className="text-orange-300 bg-red-950/70 px-2 py-0.5 rounded border border-red-500/40">
              EVENT {phase} / 10
            </span>
          </div>
          <h2 className="text-xl sm:text-4xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_24px_rgba(255,80,40,0.9)]">
            {titles[idx]}
          </h2>
          <div className="mt-2 text-[10px] sm:text-xs tracking-[0.16em] text-orange-200 uppercase">
            {subtitles[idx]}
          </div>
        </div>

        {/* Bottom Timeline and Progress Card */}
        <div className="w-full max-w-md rounded-xl border border-white/20 bg-black/40 p-3 text-center backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/80 font-bold mb-1.5">
            <span className="tracking-widest text-red-300">COLLAPSE SEQUENCE</span>
            <span className="text-cyan-300 font-mono">{elapsedSec}s / 30.0s</span>
            <span className="text-orange-300 font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10 border border-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-400 to-cyan-300 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
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
            CRITICAL TRAJECTORY FAILURE
          </div>
          <h2 className="text-3xl font-ui font-black uppercase tracking-widest text-white drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            GRAVITATIONAL CAPTURE
          </h2>
          <p className="text-xs text-red-300 mt-2 tracking-wider">
            {evacuation.failureCause ? evacuation.failureCause.replace(/_/g, ' ') : 'VESSEL DRAWN INTO EVENT HORIZON'}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
