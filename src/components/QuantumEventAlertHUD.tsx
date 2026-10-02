import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RadioTower } from 'lucide-react';
import type { BlackHoleCinematicTelemetry } from '../game/blackHoleCinematicManager';

interface QuantumEventAlertHUDProps {
  telemetry: BlackHoleCinematicTelemetry | null;
  isRacing: boolean;
}

/**
 * Mode 21 / Black Hole / Submode 10 only.
 * Displays a distinct warning/alert whenever one of the 40 canonical
 * Quantum Launch Pro events is triggered.
 */
export const QuantumEventAlertHUD: React.FC<QuantumEventAlertHUDProps> = ({ telemetry, isRacing }) => {
  const [visibleEvent, setVisibleEvent] = useState(0);

  useEffect(() => {
    const idx = telemetry?.quantumEventIndex || 0;
    if (!isRacing || idx <= 0 || idx === visibleEvent) return;
    setVisibleEvent(idx);
    const timer = window.setTimeout(() => setVisibleEvent(0), 5200);
    return () => window.clearTimeout(timer);
  }, [telemetry?.quantumEventIndex, isRacing]);

  const idx = telemetry?.quantumEventIndex || 0;
  if (!isRacing || telemetry?.submode !== 'FINAL_COLLAPSE' || idx <= 0 || visibleEvent !== idx) {
    return null;
  }

  const severity = telemetry?.quantumEventSeverity || 0;
  const phase = telemetry?.quantumEventPhase || 'WARNING';
  const caution = useMemo(() => {
    if (idx >= 36) return 'CAUTION: FINAL COLLAPSE ESCALATION — FOLLOW THE ACTIVE ESCAPE VECTOR.';
    if (idx >= 31) return 'CAUTION: CRITICAL TIDAL PHASE — ROUTE STRUCTURE MAY FAIL WITHOUT NOTICE.';
    if (idx >= 21) return 'WARNING: CATASTROPHIC GRAVITY CHANGE — REDUCE EXPOSURE TO COLLAPSING SECTORS.';
    if (idx >= 11) return 'WARNING: TIDAL FORCES RISING — DEBRIS AND ROUTE DISTORTION INCREASING.';
    return 'CAUTION: BLACK-HOLE CONDITIONS CHANGING — MAINTAIN CONTROL AND WATCH ROUTE TELEMETRY.';
  }, [idx]);

  return (
    <div className="pointer-events-none fixed left-1/2 top-[17vh] z-40 w-[min(92vw,760px)] -translate-x-1/2">
      <div className="rounded-xl border border-amber-400/70 bg-black/85 px-4 py-3 text-center shadow-[0_0_28px_rgba(245,158,11,0.35)] backdrop-blur-md animate-pulse">
        <div className="flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.28em] text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span>QUANTUM LAUNCH PRO // EVENT {String(idx).padStart(2, '0')} ALERT</span>
          <RadioTower className="h-4 w-4" />
        </div>
        <div className="mt-1 text-xl font-black italic tracking-wider text-white">
          {telemetry?.quantumEventTitle || `EVENT ${String(idx).padStart(2, '0')}`}
        </div>
        <div className="mt-1 text-xs font-bold tracking-wide text-cyan-200">
          {telemetry?.quantumEventSubtitle}
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[9px] font-black tracking-wider">
          <div className="rounded border border-rose-500/50 bg-rose-500/10 px-2 py-1 text-rose-200">
            ALERT: EVENT {String(idx).padStart(2, '0')} OCCURRED
          </div>
          <div className="rounded border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-amber-200">
            WARNING: {telemetry?.quantumEventTitle || 'GRAVITY EVENT'}
          </div>
          <div className="rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-cyan-200">
            {caution.replace(/^CAUTION:\s*/, 'CAUTION: ')}
          </div>
        </div>
        <div className="mt-1 text-[9px] font-black tracking-[0.22em] text-slate-400">
          PHASE: {phase} • SEVERITY: {Math.round(severity)} / 10
          {telemetry?.evacuation?.hazardEscalation ? ` • HAZARD PRESSURE: ${telemetry.evacuation.hazardEscalation.toFixed(2)}x` : ''}
        </div>
      </div>
    </div>
  );
};
