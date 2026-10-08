import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, AlertOctagon, Radio } from 'lucide-react';
import type { BlackHoleCinematicTelemetry } from '../game/blackHoleCinematicManager';
import { getMasterEventByNumber, type AlertSeverityType } from '../game/finalCollapse/finalCollapseMaster100Timeline';
import { sound } from '../game/audio';

export interface CompactEventAlertBarProps {
  eventNumber: number;
  displayTime?: string;
  eventName?: string;
  alertMessage?: string;
  severity?: AlertSeverityType | string;
  severityLevel?: number;
  isZeroHour?: boolean;
  className?: string;
}

/**
 * Compact Event Alert Bar for Submode 10 — The Final Collapse.
 *
 * Single, unified, non-stacked alert bar.
 * Exactly synchronized with the 15:00 -> 00:00 circular countdown clock and 100-event master timeline.
 * Transitions smoothly from Event 01 through Event 100 with zero duplicate timers or stacked panels.
 */
export const CompactEventAlertBar: React.FC<CompactEventAlertBarProps> = ({
  eventNumber,
  displayTime: propDisplayTime,
  eventName: propEventName,
  alertMessage: propAlertMessage,
  severity: propSeverity,
  severityLevel: _propSeverityLevel,
  isZeroHour: propIsZeroHour,
  className = '',
}) => {
  const master = getMasterEventByNumber(eventNumber);
  const displayTime = propDisplayTime || master.displayTime;
  const alertMessage = propAlertMessage || master.alertMessage;
  const severity = (propSeverity as AlertSeverityType) || master.severity;
  const isZeroHour = propIsZeroHour ?? (eventNumber >= 100);

  const [isFreshAlert, setIsFreshAlert] = useState<boolean>(false);
  const prevEventRef = useRef<number>(0);

  useEffect(() => {
    if (eventNumber !== prevEventRef.current) {
      prevEventRef.current = eventNumber;
      setIsFreshAlert(true);
      try {
        sound.playFinalCollapseMasterAlertAudio(master.audioCue, master.severity);
      } catch (_) {}

      const timer = window.setTimeout(() => {
        setIsFreshAlert(false);
      }, 2500);

      return () => window.clearTimeout(timer);
    }
  }, [eventNumber, master.audioCue, master.severity]);

  // Color scheme based on the 7 canonical severity stages
  const getSeverityStyles = () => {
    if (isZeroHour || severity === 'SINGULARITY_CRITICAL') {
      return {
        border: 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.9)] ring-1 ring-red-500',
        bg: 'bg-[#180307]/95',
        text: 'text-red-100 font-black',
        alertLabel: 'text-red-400 font-black animate-pulse',
        badge: 'bg-red-950 text-red-200 border-red-500/80 font-black animate-pulse',
        badgeLabel: 'SINGULARITY CRITICAL',
      };
    }
    switch (severity) {
      case 'FINAL_WARNING':
        return {
          border: 'border-rose-500/90 shadow-[0_0_24px_rgba(244,63,94,0.7)] ring-1 ring-rose-500/60',
          bg: 'bg-[#120308]/92',
          text: 'text-rose-100 font-extrabold',
          alertLabel: 'text-rose-400 font-black animate-pulse',
          badge: 'bg-rose-950 text-rose-300 border-rose-500/80 font-extrabold',
          badgeLabel: 'FINAL WARNING',
        };
      case 'EMERGENCY':
        return {
          border: 'border-red-500/85 shadow-[0_0_20px_rgba(239,68,68,0.6)]',
          bg: 'bg-[#0f0407]/92',
          text: 'text-red-200 font-bold',
          alertLabel: 'text-red-400 font-black',
          badge: 'bg-red-950/80 text-red-300 border-red-500/60 font-bold',
          badgeLabel: 'EMERGENCY',
        };
      case 'CRITICAL':
        return {
          border: 'border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.5)]',
          bg: 'bg-[#0c040d]/92',
          text: 'text-rose-200 font-bold',
          alertLabel: 'text-rose-400 font-extrabold',
          badge: 'bg-rose-950/70 text-rose-300 border-rose-500/50 font-bold',
          badgeLabel: 'CRITICAL',
        };
      case 'DANGER':
        return {
          border: 'border-orange-500/75 shadow-[0_0_16px_rgba(249,115,22,0.45)]',
          bg: 'bg-[#0a0510]/92',
          text: 'text-orange-200 font-bold',
          alertLabel: 'text-orange-400 font-extrabold',
          badge: 'bg-orange-950/70 text-orange-300 border-orange-500/50 font-bold',
          badgeLabel: 'DANGER',
        };
      case 'WARNING':
        return {
          border: 'border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
          bg: 'bg-[#060814]/92',
          text: 'text-amber-200 font-semibold',
          alertLabel: 'text-amber-400 font-extrabold',
          badge: 'bg-amber-950/70 text-amber-300 border-amber-500/50 font-bold',
          badgeLabel: 'WARNING',
        };
      case 'NOTICE':
      default:
        return {
          border: 'border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.25)]',
          bg: 'bg-[#030714]/92',
          text: 'text-cyan-200 font-semibold',
          alertLabel: 'text-cyan-400 font-extrabold',
          badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 font-bold',
          badgeLabel: 'NOTICE',
        };
    }
  };

  const style = getSeverityStyles();

  return (
    <div
      key={`alert-bar-${eventNumber}`}
      className={`pointer-events-auto flex items-center justify-between gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border backdrop-blur-md transition-all duration-200 max-w-2xl w-full ${
        style.bg
      } ${style.border} ${isFreshAlert ? 'scale-[1.015] ring-2 ring-amber-300/80 shadow-[0_0_25px_rgba(251,191,36,0.6)]' : ''} ${className}`}
    >
      {/* Left side: Alert Icon + ALERT: Tag + Formatted Message */}
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        {isZeroHour ? (
          <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0 animate-ping" />
        ) : severity === 'EMERGENCY' || severity === 'FINAL_WARNING' ? (
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 animate-pulse" />
        ) : severity === 'DANGER' || severity === 'CRITICAL' ? (
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
        ) : (
          <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0 animate-pulse" />
        )}

        <span className={`text-[8.5px] sm:text-[10px] font-mono tracking-wider shrink-0 uppercase ${style.alertLabel}`}>
          ⚠ ALERT:
        </span>

        <span className={`text-[8px] sm:text-[9.5px] font-mono truncate tracking-wide ${style.text}`}>
          {alertMessage}
        </span>
      </div>

      {/* Right side: Event Badge + Clock Time + Severity Badge */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 font-mono text-[7.5px] sm:text-[8.5px]">
        <span className="hidden sm:inline-block text-slate-400 font-bold">
          E{String(eventNumber).padStart(2, '0')}/100
        </span>
        <span className="px-1.5 py-0.5 rounded bg-black/75 border border-slate-700/80 text-white font-black">
          {displayTime}
        </span>
        <span className={`px-1.5 py-0.5 rounded uppercase border tracking-wider ${style.badge}`}>
          {style.badgeLabel}
        </span>
      </div>
    </div>
  );
};

export interface QuantumEventAlertHUDProps {
  telemetry?: BlackHoleCinematicTelemetry | null;
  isRacing: boolean;
}

/**
 * Backwards-compatible wrapper if mounted elsewhere.
 * Renders the single compact alert bar at top center.
 */
export const QuantumEventAlertHUD: React.FC<QuantumEventAlertHUDProps> = ({
  telemetry,
  isRacing,
}) => {
  const isFinalCollapse = telemetry?.submode === 'FINAL_COLLAPSE';
  const idx = telemetry?.quantumEventIndex || 0;

  if (!isRacing || !isFinalCollapse || idx <= 0) {
    return null;
  }

  const master = getMasterEventByNumber(idx);

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 sm:top-28 z-40 w-[min(94vw,680px)] -translate-x-1/2 flex justify-center">
      <CompactEventAlertBar
        eventNumber={master.eventNumber}
        displayTime={master.displayTime}
        eventName={master.eventName}
        alertMessage={master.alertMessage}
        severity={master.severity}
        severityLevel={master.severityLevel}
        isZeroHour={idx >= 100}
      />
    </div>
  );
};
