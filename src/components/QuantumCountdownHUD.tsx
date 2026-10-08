import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { QuantumCountdownTelemetry } from '../game/environment/quantumCountdownClock';
import { CosmicBiomeDefinition, COSMIC_BIOMES, CosmicBiomeId } from '../game/environment/cosmicEnvironmentDirector';

interface QuantumCountdownHUDProps {
  countdownTelemetry: QuantumCountdownTelemetry | null;
  activeBiome: CosmicBiomeDefinition;
  activeRouteName?: string;
  onSetDuration?: (seconds: number) => void;
  onCycleBiome?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export const QuantumCountdownHUD: React.FC<QuantumCountdownHUDProps> = ({
  countdownTelemetry,
  activeBiome,
  activeRouteName = 'MAIN ACCRETION CORRIDOR',
  onSetDuration,
  onCycleBiome,
  onToggleMute,
  isMuted = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!countdownTelemetry) return null;

  const {
    formattedTime,
    progressRatio,
    dangerState,
    statusBadge,
    statusColor,
    hasExpired,
    initialDurationMs,
  } = countdownTelemetry;

  const percentLeft = Math.max(0, Math.min(100, Math.round((1 - progressRatio) * 100)));
  const isImminent = dangerState === 'IMMINENT' || dangerState === 'ZERO_HOUR';
  const isCritical = dangerState === 'CRITICAL' || isImminent;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center pointer-events-auto select-none font-mono transition-all">
      {/* Main Countdown Widget */}
      <div
        className={`w-full rounded-2xl border backdrop-blur-xl px-4 py-2.5 transition-all shadow-2xl ${
          isImminent
            ? 'bg-rose-950/85 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)] animate-pulse'
            : isCritical
            ? 'bg-amber-950/85 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.45)]'
            : 'bg-[#040814]/90 border-cyan-500/50 shadow-[0_0_25px_rgba(0,240,255,0.25)]'
        }`}
      >
        {/* Top Header Row: Status Badge & Environment Biome */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10 text-[10px]">
          {/* Danger State Badge */}
          <div className="flex items-center gap-1.5 font-bold tracking-wider">
            <span
              className={`w-2 h-2 rounded-full ${
                isImminent
                  ? 'bg-rose-500 animate-ping'
                  : isCritical
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-cyan-400'
              }`}
            />
            <span style={{ color: statusColor }}>{statusBadge}</span>
          </div>

          {/* Biome Indicator & Cycle Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCycleBiome}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] text-slate-200 transition-all cursor-pointer"
              title="Click to switch Environment [E]"
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span className="font-bold uppercase tracking-tight">{activeBiome.name}</span>
            </button>
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 transition-all cursor-pointer"
                title={isMuted ? 'Unmute Clock Audio' : 'Mute Clock Audio'}
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
              </button>
            )}
          </div>
        </div>

        {/* Center Row: Big Digital Countdown Display & Active Route */}
        <div className="flex items-center justify-between my-1">
          {/* Active Route Corridor */}
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Compass className="w-2.5 h-2.5 text-cyan-400" /> ACTIVE SECTOR ROUTE
            </span>
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[190px]">
              {activeRouteName}
            </span>
          </div>

          {/* Massive Digital Countdown Clock */}
          <div className="flex items-baseline gap-1">
            <Clock
              className={`w-4 h-4 mr-1 ${
                isImminent
                  ? 'text-rose-400 animate-spin'
                  : isCritical
                  ? 'text-amber-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            />
            <span
              className={`text-2xl sm:text-3xl font-black tracking-wider ${
                isImminent
                  ? 'text-rose-300 drop-shadow-[0_0_15px_#f43f5e]'
                  : isCritical
                  ? 'text-amber-200 drop-shadow-[0_0_12px_#f59e0b]'
                  : 'text-white drop-shadow-[0_0_10px_#00f0ff]'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">REMAINING</span>
          </div>

          {/* Expand Drawer Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
            title="Toggle Clock & Route Controls"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Progress Bar Row */}
        <div className="w-full mt-1">
          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mb-0.5">
            <span>TIME DILATION LEVEL</span>
            <span style={{ color: statusColor }}>{percentLeft}% REMAINING</span>
          </div>
          <div className="w-full bg-slate-900/90 h-2 rounded-full overflow-hidden border border-white/10 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isImminent
                  ? 'bg-gradient-to-r from-rose-600 to-red-500'
                  : isCritical
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
        </div>

        {/* Expandable Control Panel */}
        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-2 animate-fadeIn text-[10px]">
            {/* Quick Preset Selector */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-slate-400 font-semibold">PRESET DURATION:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: '15:00', sec: 900 },
                ].map(p => (
                  <button
                    key={p.sec}
                    onClick={() => onSetDuration?.(p.sec)}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      initialDurationMs === p.sec * 1000
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Biome Details & Quick Selector */}
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" /> ENVIRONMENT BIOME:
                </span>
                <span className="font-bold uppercase" style={{ color: activeBiome.badgeColor }}>
                  {activeBiome.name}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 italic">{activeBiome.description}</p>
            </div>

            {/* Route Feature Summary */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
              <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                <Zap className="w-3 h-3 mx-auto mb-0.5 text-cyan-400" />
                <span className="font-bold">BOOST GATES</span>
                <div className="text-[8px] text-slate-400">+120 KM/H</div>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
                <Flame className="w-3 h-3 mx-auto mb-0.5 text-amber-400" />
                <span className="font-bold">PLASMA VENTS</span>
                <div className="text-[8px] text-slate-400">CORONA HAZARDS</div>
              </div>
              <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300">
                <Sparkles className="w-3 h-3 mx-auto mb-0.5 text-purple-400" />
                <span className="font-bold">RELIC CORES</span>
                <div className="text-[8px] text-slate-400">+100 BONUS</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
