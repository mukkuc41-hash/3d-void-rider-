import React, { useRef, useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Clock,
  Pause,
  Camera,
  AlertTriangle,
  AlertOctagon,
  Magnet,
  RotateCcw,
  Wind,
  ChevronsUp,
  ChevronsDown,
  Wrench,
  Radio,
  Hourglass,
  Anchor,
  Copy,
  Flame,
  Eye,
  Target,
  Crosshair,
  Rocket,
  ShieldCheck,
  Cpu,
  Map,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  Thermometer,
} from 'lucide-react';
import {
  ActivePowerUp,
  BeamTelemetry,
  CameraMode,
  DynamicTrackEvent,
  PlayerInput,
  ShipDamageZones,
  MissileTelemetry,
  ActiveShieldTelemetry,
  MinimapTelemetry,
  GameMode,
  CosmicPairLiveTelemetry,
  QuantumCountdownTelemetry,
  CosmicBiomeDefinition,
  COSMIC_BIOMES,
} from '../types';
import { ActiveJunctionTelemetry, BranchRouteDirection } from '../game/junctionSystem';
import { COSMIC_40_EVENTS } from '../game/catastrophe/cosmicSystems';
import { getFinalCollapseEventByNumber } from '../game/finalCollapse/finalCollapse100EventsCatalog';
import { getMasterEventByNumber, getMasterEventByElapsedSeconds } from '../game/finalCollapse/finalCollapseMaster100Timeline';
import { CompactEventAlertBar } from './QuantumEventAlertHUD';
import { JunctionHUD } from './JunctionHUD';
import { InteractiveMinimap } from './InteractiveMinimap';
import { ModeHUDTelemetry } from '../game/modeManager';
import { SingularityTelemetry } from '../game/blackHoleSystem';
import type { BlackHoleCinematicTelemetry } from '../game/blackHoleCinematicManager';
import { Submode10StagesModal } from './Submode10StagesModal';
import {
  getActiveSubmode10Stage,
  getNextSubmode10Stage,
  formatSubmode10Countdown,
} from '../game/submode10Events';
import { HeartPulse, Activity, BookOpen } from 'lucide-react';

interface RaceHUDProps {
  speed: number;
  boost: number;
  currentLap: number;
  totalLaps: number;
  rank: number;
  totalPlayers: number;
  checkpoint: number;
  totalCheckpoints: number;
  countdown: number | null;
  activeEvent: DynamicTrackEvent | null;
  hazardHitMessage: string | null;
  shortcutMessage: string | null;
  powerUps: ActivePowerUp[];
  hullHealth: number;
  sessionCredits: number;
  distanceMeters: number;
  milestoneMessage: string | null;
  isWrongWay: boolean;
  destroyedMessage: string | null;
  respawnTimeRemaining: number;
  currentLapMs: number;
  bestLapMs: number;
  cameraMode: CameraMode;
  gameMode?: GameMode;
  trackId?: string;
  damageZones?: ShipDamageZones;
  isSpectator?: boolean;
  spectatorTargetName?: string;
  onNextSpectatorTarget?: () => void;
  onTogglePause: () => void;
  onToggleCamera: () => void;
  onToggleWholeBlackHoleCamera?: () => void;
  onInputChange?: (input: Partial<PlayerInput>) => void;
  onRecover?: () => void;
  coreTemperature?: number;
  beamTelemetry?: BeamTelemetry | null;
  junctionTelemetry?: ActiveJunctionTelemetry | null;
  onSelectRoute?: (direction: BranchRouteDirection) => void;
  onCommitRoute?: () => void;
  modeTelemetry?: ModeHUDTelemetry | null;
  singularityTelemetry?: SingularityTelemetry | null;
  missileTelemetry?: MissileTelemetry | null;
  activeShieldTelemetry?: ActiveShieldTelemetry | null;
  minimapTelemetry?: MinimapTelemetry | null;
  onFireMissile?: () => void;
  onActivateShield?: () => void;
  onToggleMinimapMode?: () => void;
  onZoomInMinimap?: () => void;
  onZoomOutMinimap?: () => void;
  onResetMinimapZoom?: () => void;
  onToggleMinimapExpand?: () => void;
  isAIRaceActive?: boolean;
  isAIDebugOpen?: boolean;
  onToggleAIDebug?: () => void;
  isIntroActive?: boolean;
  cosmicPairTelemetry?: CosmicPairLiveTelemetry | null;
  quantumCountdownTelemetry?: QuantumCountdownTelemetry | null;
  activeCosmicBiome?: CosmicBiomeDefinition | null;
  activeRouteBranchName?: string;
  onSetCountdownDuration?: (seconds: number) => void;
  onCycleCosmicBiome?: () => void;
  onToggleCountdownMute?: () => void;
  isCountdownMuted?: boolean;
  blackHoleCinematicTelemetry?: BlackHoleCinematicTelemetry | null;
  onTriggerCollapse?: () => void;
  onJumpToEvent?: (eventIndex: number) => void;
}

const SECTOR_NAMES: Record<string, string> = {
  circuit_alpha: 'SECTOR ALPHA',
  neon_orbit: 'NEON ORBIT',
  void_rift: 'VOID RIFT',
  asteroid_run: 'ASTEROID RUN',
  cosmic_ring: 'COSMIC RING',
  quantum_highway: 'QUANTUM HWY',
  nebula_rift: 'NEBULA RIFT',
};

interface CircularCountdownIndicatorProps {
  remainingMs: number;
  initialMs?: number;
  isCollapseActive: boolean;
  eventIndex: number;
  currentEventTitle?: string;
  currentEventWarning?: string;
  nextEventTime?: string;
  nextEventTitle?: string;
  currentEventDef?: (typeof COSMIC_40_EVENTS)[0] | null;
  nextEventDef?: (typeof COSMIC_40_EVENTS)[0] | null;
  destructionDist?: number | null;
  gravityStress: number;
  eventHorizonDist: number;
  onTriggerCollapse?: () => void;
  onOpenStages?: () => void;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

const CircularCountdownIndicator: React.FC<CircularCountdownIndicatorProps> = ({
  remainingMs,
  initialMs = 900000,
  isCollapseActive,
  eventIndex,
  currentEventTitle,
  currentEventWarning,
  nextEventTime,
  nextEventTitle,
  currentEventDef,
  nextEventDef,
  destructionDist,
  onTriggerCollapse,
  onOpenStages,
  showDetails,
  onToggleDetails,
}) => {
  const safeInitialMs = Math.max(1000, initialMs);
  const safeRemainingMs = Math.max(0, Math.min(safeInitialMs, remainingMs));
  const remainingFraction = isCollapseActive ? 0 : safeRemainingMs / safeInitialMs;

  const totalSec = Math.floor(safeRemainingMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hundredths = Math.floor((safeRemainingMs % 1000) / 10);
  const displayMinSec = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const displayHundredths = `.${String(hundredths).padStart(2, '0')}`;

  const radius = 37;
  const circumference = 2 * Math.PI * radius; // ~232.478
  // Circular indicator visually empties as time approaches 00:00
  const strokeDashoffset = circumference * (1 - remainingFraction);

  const isZeroHour = isCollapseActive || safeRemainingMs <= 0;
  const isImminent = !isZeroHour && (totalSec <= 30 || remainingFraction <= 0.08);
  const isCritical = !isZeroHour && !isImminent && (totalSec <= 90 || remainingFraction <= 0.22);
  const isAdvisory = !isZeroHour && !isImminent && !isCritical && (totalSec <= 450 || remainingFraction <= 0.5);

  const tipAngleDeg = remainingFraction * 360 - 90;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const tipX = 50 + radius * Math.cos(tipAngleRad);
  const tipY = 50 + radius * Math.sin(tipAngleRad);

  const glowShadow = isZeroHour || isImminent
    ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.95))'
    : isCritical
    ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.85))'
    : isAdvisory
    ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.75))'
    : 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.8))';

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-3.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-2xl bg-[#030714]/92 border backdrop-blur-md transition-all max-w-[calc(100vw-1rem)] ${
        isZeroHour
          ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
          : 'border-cyan-500/40 shadow-[0_0_22px_rgba(0,240,255,0.22)]'
      }`}
    >
      {/* 1. Circular Progress Indicator with Cyan -> Red Gradient Ring */}
      <div className="relative w-13 h-13 sm:w-16 sm:h-16 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90 select-none overflow-visible"
          viewBox="0 0 100 100"
          style={{ filter: glowShadow }}
        >
          <defs>
            {/* Gradient from Cyan to Red as specified */}
            <linearGradient id="quantumCountdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="25%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="75%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="tipBeaconGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dark Background Track Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="rgba(4, 9, 24, 0.85)"
            stroke="#0f172a"
            strokeWidth="5.5"
            strokeOpacity="0.9"
          />

          {/* Outer Precision Radar Ticks */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={isZeroHour ? '#ef4444' : '#00f0ff'}
            strokeWidth="0.8"
            strokeDasharray="1.5 5.5"
            strokeOpacity="0.35"
          />

          {/* Cardinal Ticks at 12, 3, 6, 9 o'clock */}
          <line x1="50" y1="5" x2="50" y2="9" stroke="rgba(0,240,255,0.6)" strokeWidth="1.2" />
          <line x1="95" y1="50" x2="91" y2="50" stroke="rgba(0,240,255,0.4)" strokeWidth="1.2" />
          <line x1="50" y1="95" x2="50" y2="91" stroke="rgba(239,68,68,0.5)" strokeWidth="1.2" />
          <line x1="5" y1="50" x2="9" y2="50" stroke="rgba(0,240,255,0.4)" strokeWidth="1.2" />

          {/* Inner Decorative Hairline */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="0.6"
          />

          {/* Active Progress Ring (Visually empties as time approaches 00:00) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#quantumCountdownGradient)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.15s linear',
            }}
          />

          {/* Leading Beacon Dot at Tip of Ring */}
          {remainingFraction > 0.01 && (
            <circle
              cx={tipX}
              cy={tipY}
              r="2.6"
              fill="#ffffff"
              filter="url(#tipBeaconGlow)"
              className={isImminent || isZeroHour ? 'animate-ping' : ''}
            />
          )}
        </svg>

        {/* Center Digital Display Inside Circular Ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span
            className={`text-[6px] sm:text-[7px] font-mono font-black tracking-widest uppercase leading-none ${
              isZeroHour
                ? 'text-red-400 animate-pulse'
                : isImminent
                ? 'text-rose-400'
                : isCritical
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {isZeroHour ? 'COLLAPSE' : 'T-MINUS'}
          </span>
          <div className="flex items-baseline justify-center font-mono font-black tracking-tighter leading-none mt-0.5">
            <span
              className={`text-[11px] sm:text-xs lg:text-[13.5px] ${
                isZeroHour
                  ? 'text-red-400 font-black animate-pulse drop-shadow-[0_0_8px_#ef4444]'
                  : isImminent
                  ? 'text-rose-400 font-black animate-pulse'
                  : isCritical
                  ? 'text-amber-300 font-black'
                  : 'text-cyan-200 font-black drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]'
              }`}
            >
              {displayMinSec}
            </span>
            <span
              className={`text-[6.5px] sm:text-[7.5px] ml-0.5 ${
                isZeroHour
                  ? 'text-red-500'
                  : isImminent
                  ? 'text-rose-300'
                  : isCritical
                  ? 'text-amber-400'
                  : 'text-cyan-400/80'
              }`}
            >
              {displayHundredths}
            </span>
          </div>
          <span
            className={`text-[5.5px] sm:text-[6.5px] font-mono font-bold leading-none mt-0.5 ${
              isZeroHour
                ? 'text-red-500 font-black'
                : isImminent
                ? 'text-rose-300'
                : isCritical
                ? 'text-amber-400'
                : 'text-cyan-400/80'
            }`}
          >
            {isZeroHour ? '0%' : `${Math.round(remainingFraction * 100)}%`}
          </span>
        </div>
      </div>

      {/* 2. Middle: Stage & Event Alert Information */}
      <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[220px] lg:max-w-[300px]">
        <div className="flex items-center gap-1 leading-none">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isZeroHour
                ? 'bg-red-500 animate-ping'
                : isImminent
                ? 'bg-rose-400 animate-pulse'
                : 'bg-cyan-400 animate-ping'
            }`}
          />
          <span className="text-[7px] sm:text-[8.5px] font-mono font-black tracking-wider text-cyan-300 uppercase truncate">
            {isZeroHour ? 'CRITICAL 00:00' : 'SUBMODE 10'}
          </span>
          {(nextEventTime || nextEventDef?.countdownTime) && !isZeroHour && (
            <span className="hidden sm:inline-block text-[6.5px] sm:text-[7.5px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1 py-0.2 rounded ml-auto shrink-0">
              NEXT: {nextEventTime || nextEventDef?.countdownTime} {nextEventTitle ? `(${nextEventTitle})` : ''}
            </span>
          )}
          {destructionDist !== null && destructionDist !== undefined && isZeroHour && (
            <span className="text-amber-300 bg-black/70 px-1 py-0.2 rounded border border-red-500/50 text-[7px] font-mono">
              FRONT: {destructionDist}M
            </span>
          )}
        </div>

        <div className="text-[8.5px] sm:text-[11px] font-mono font-black text-white truncate tracking-wide mt-0.5 uppercase">
          E{String(eventIndex).padStart(2, '0')}: {currentEventTitle || currentEventDef?.name || 'SINGULARITY ACTIVATION'}
        </div>

        <div className="text-[7px] sm:text-[8px] font-mono text-cyan-200/90 truncate leading-tight font-semibold">
          {currentEventWarning || currentEventDef?.cause || currentEventDef?.subtitle || 'GRAVITATIONAL ANOMALY DETECTED'}
        </div>
      </div>

      {/* 3. Right: Action Buttons (Stages, Skip to 00:00, Drawer) */}
      <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-800/80">
        {onOpenStages && (
          <button
            onClick={onOpenStages}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-purple-950/70 border border-purple-400/50 hover:bg-purple-900 text-purple-200 text-[7.5px] sm:text-[8.5px] font-mono font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95"
            title="Open Submode 10 Event Stages Catalog [C]"
          >
            <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
            <span className="hidden sm:inline">STAGES [C]</span>
            <span className="sm:hidden">[C]</span>
          </button>
        )}

        {onTriggerCollapse && !isZeroHour && (
          <button
            onClick={onTriggerCollapse}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 active:scale-95 text-white font-mono font-black text-[7.5px] sm:text-[9.5px] tracking-wider shadow-[0_0_18px_rgba(239,68,68,0.7)] border border-amber-300/80 cursor-pointer transition-all animate-pulse"
            title="Fast-forward countdown immediately to 00:00 Final Collapse destruction!"
          >
            <span className="text-[9px] sm:text-xs">⏩</span>
            <span>00:00</span>
          </button>
        )}

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className="p-1 rounded-lg bg-black/60 border border-slate-700/80 text-purple-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            title="Toggle Detailed Gravitational Telemetry"
          >
            {showDetails ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export const RaceHUD: React.FC<RaceHUDProps> = ({
  speed,
  boost,
  currentLap,
  totalLaps,
  rank,
  totalPlayers,
  checkpoint,
  totalCheckpoints,
  countdown,
  activeEvent,
  hazardHitMessage,
  shortcutMessage,
  powerUps,
  hullHealth,
  sessionCredits,
  distanceMeters,
  milestoneMessage,
  isWrongWay,
  destroyedMessage,
  respawnTimeRemaining,
  currentLapMs,
  bestLapMs,
  cameraMode,
  gameMode,
  trackId = 'circuit_alpha',
  damageZones,
  isSpectator = false,
  spectatorTargetName,
  onNextSpectatorTarget,
  onTogglePause,
  onToggleCamera,
  onToggleWholeBlackHoleCamera,
  onInputChange,
  onRecover,
  coreTemperature = 320,
  beamTelemetry,
  junctionTelemetry,
  onSelectRoute,
  onCommitRoute,
  modeTelemetry,
  singularityTelemetry,
  missileTelemetry,
  activeShieldTelemetry,
  minimapTelemetry,
  onFireMissile,
  onActivateShield,
  onToggleMinimapMode,
  onZoomInMinimap,
  onZoomOutMinimap,
  onResetMinimapZoom,
  onToggleMinimapExpand,
  isAIRaceActive,
  isAIDebugOpen,
  onToggleAIDebug,
  isIntroActive,
  cosmicPairTelemetry,
  quantumCountdownTelemetry,
  activeCosmicBiome = COSMIC_BIOMES.CRYO_NEBULA,
  activeRouteBranchName = 'MAIN ACCRETION CORRIDOR',
  onSetCountdownDuration,
  onCycleCosmicBiome,
  onToggleCountdownMute,
  isCountdownMuted = false,
  blackHoleCinematicTelemetry,
  onTriggerCollapse,
  onJumpToEvent,
}) => {
  const [hudMode, setHudMode] = useState<'TACTICAL' | 'COMPACT' | 'MINIMAL'>('COMPACT');
  const [showMinimap, setShowMinimap] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setIsStagesModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-detect viewport on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < 1024 || window.innerHeight / window.innerWidth > 1.15;
      // Default to COMPACT on mobile/narrow, TACTICAL on wide desktop
      if (isNarrow) {
        setHudMode(prev => (prev === 'TACTICAL' ? 'COMPACT' : prev));
      }
      setShowMinimap(true); // Always keep map radar visible across all devices
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Joystick State
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Format race timer: mm:ss. and hundredths (SS)
  const formatMinSec = (ms: number) => {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatHundredths = (ms: number) => {
    if (ms <= 0) return '00';
    const hundredths = Math.floor((ms % 1000) / 10);
    return hundredths.toString().padStart(2, '0');
  };

  // Joystick pointer handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouchActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId === pointerIdRef.current) {
      pointerIdRef.current = null;
      setTouchActive(false);
      setStickPos({ x: 0, y: 0 });
      onInputChange?.({ steer: 0, throttle: 0 });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      setTouchActive(true);
      const touch = e.touches[0];
      updateJoystick(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateJoystick(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchActive(false);
    setStickPos({ x: 0, y: 0 });
    onInputChange?.({ steer: 0, throttle: 0 });
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const maxRadius = (rect.width / 2) * 0.72;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setStickPos({ x: deltaX, y: deltaY });

    const steer = Math.max(-1, Math.min(1, deltaX / maxRadius));
    const throttle = Math.max(-1, Math.min(1, -deltaY / maxRadius));

    onInputChange?.({
      steer: Math.abs(steer) > 0.06 ? steer : 0,
      throttle: Math.abs(throttle) > 0.06 ? throttle : 0,
    });
  };

  const sectorTitle = SECTOR_NAMES[trackId] || 'SECTOR ALPHA';

  const isSubmode10Active =
    gameMode === 'BLACK_HOLE' &&
    (modeTelemetry?.blackHoleSubmode === 10 ||
      blackHoleCinematicTelemetry?.submode === 'FINAL_COLLAPSE');

  // 1. Authoritative 15:00 countdown in milliseconds (powers the circular countdown timer)
  const countdownRemainingMs =
    (isIntroActive || countdown !== null)
      ? 900000
      : quantumCountdownTelemetry?.remainingMs !== undefined
      ? quantumCountdownTelemetry.remainingMs
      : blackHoleCinematicTelemetry?.finalCountdown !== null &&
        blackHoleCinematicTelemetry?.finalCountdown !== undefined
      ? blackHoleCinematicTelemetry.finalCountdown * 1000
      : 900000;

  // 2. Authoritative elapsed seconds matching the circular countdown timer (15:00 -> 00:00)
  const clockElapsedSeconds =
    (isIntroActive || countdown !== null)
      ? 0
      : quantumCountdownTelemetry?.elapsedMs !== undefined
      ? Math.max(0, Math.min(900, quantumCountdownTelemetry.elapsedMs / 1000))
      : Math.max(0, Math.min(900, (900000 - countdownRemainingMs) / 1000));

  // 3. Resolve active and next master event strictly by circular countdown clock
  const clockMasterInfo = getMasterEventByElapsedSeconds(clockElapsedSeconds);
  const masterEvent = clockMasterInfo.currentEvent;
  const masterNextEvent = clockMasterInfo.nextEvent;
  const currentEventIdx = masterEvent.eventNumber;
  const currentCollapseEvent = getFinalCollapseEventByNumber(currentEventIdx);
  const nextCollapseEvent = currentEventIdx < 100 ? getFinalCollapseEventByNumber(currentEventIdx + 1) : null;
  const nextEventCountdownTime = masterNextEvent
    ? masterNextEvent.displayTime
    : nextCollapseEvent
    ? nextCollapseEvent.countdownDisplay
    : '00:00';
  const currentEventDef = COSMIC_40_EVENTS[Math.min(COSMIC_40_EVENTS.length - 1, Math.max(0, currentEventIdx - 1))];
  const nextEventDef = currentEventIdx < 100 ? COSMIC_40_EVENTS[Math.min(COSMIC_40_EVENTS.length - 1, currentEventIdx)] : null;
  const gravityStress = Math.min(100, Math.round(singularityTelemetry?.tidalStress ? singularityTelemetry.tidalStress * 100 : currentEventIdx * 1.0));
  const eventHorizonDist = Math.max(10, Math.round(singularityTelemetry?.distanceToHorizon ?? (3800 - currentEventIdx * 35)));
  const junctionDistanceVal = junctionTelemetry?.distanceToJunction ? `${Math.round(junctionTelemetry.distanceToJunction)}M` : currentLap === 1 ? 'LOCKED (LAP 1)' : 'APPROACHING';
  const currentRouteVal = activeRouteBranchName || (currentLap === 1 ? 'STANDARD' : 'BRANCH');

  const isCollapseActive =
    (blackHoleCinematicTelemetry?.finalCountdown === 0) ||
    currentEventIdx >= 100 ||
    (quantumCountdownTelemetry ? quantumCountdownTelemetry.remainingMs <= 0 : false) ||
    countdownRemainingMs <= 0;
  const destructionDist = blackHoleCinematicTelemetry?.destructionFrontDistance;

  // Ship Core Temperature Telemetry
  const displayCoreTemp = Math.round(coreTemperature);
  const isOverheating = displayCoreTemp >= 850;
  const isCriticalHeat = displayCoreTemp >= 1050;
  const tempProgress = Math.max(0, Math.min(100, Math.round(((displayCoreTemp - 200) / 1000) * 100)));

  // Cycle HUD modes: COMPACT -> TACTICAL -> MINIMAL -> COMPACT
  const cycleHudMode = () => {
    setHudMode(curr => (curr === 'COMPACT' ? 'TACTICAL' : curr === 'TACTICAL' ? 'MINIMAL' : 'COMPACT'));
  };

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 select-none p-1.5 sm:p-3 safe-pad flex flex-col justify-between overflow-hidden ${gameMode === 'BLACK_HOLE' ? 'bh-race-hud' : ''}`}>
      {/* ================= 1. UNIFIED TOP COCKPIT VISOR ================= */}
      <div className="w-full flex flex-col items-center gap-1 sm:gap-1.5 z-30">
        {/* Row 1: Streamlined Cockpit Bar (Standings, Timer, Controls) */}
        <div className="w-full flex items-center justify-between gap-1 sm:gap-2.5 bg-[#030712]/92 border border-cyan-500/35 rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1 sm:py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.18)] pointer-events-auto">
          {/* Left Wing: Branding & Position/Lap Badge */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
            <div className="hidden lg:flex flex-col">
              <span className="text-[#00f0ff] font-ui font-black italic tracking-widest text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] leading-none">
                VOID-RIDER
              </span>
              <span className="text-[7.5px] font-mono font-bold text-slate-400 tracking-wider">
                {sectorTitle}
              </span>
            </div>

            {/* Position & Lap Micro-Card */}
            <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 rounded-lg px-1.5 sm:px-2 py-0.5 font-mono text-[9px] sm:text-xs">
              <span className="text-slate-400 font-bold">P</span>
              <span className="text-cyan-300 font-black text-xs sm:text-sm">
                {String(rank || 1).padStart(2, '0')}
              </span>
              <span className="text-slate-600 font-bold">/</span>
              <span className="text-slate-400 text-[8.5px] sm:text-[9px]">
                {String(totalPlayers || 1).padStart(2, '0')}
              </span>

              <span className="text-slate-700 mx-0.5">|</span>

              <span className="text-slate-400 font-bold">L</span>
              <span className="text-white font-black text-xs sm:text-sm">
                {String(Math.min(currentLap, totalLaps) || 1).padStart(2, '0')}
              </span>
              <span className="text-slate-600 font-bold">/</span>
              <span className="text-slate-400 text-[8.5px] sm:text-[9px]">
                {String(totalLaps || 2).padStart(2, '0')}
              </span>
            </div>

            {/* Prominent Hull Integrity Gauge */}
            <div
              className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-1.5 sm:px-2 py-0.5 border font-mono transition-all ${
                hullHealth < 35
                  ? 'bg-rose-950/80 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : hullHealth < 70
                  ? 'bg-amber-950/70 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'bg-black/60 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              }`}
            >
              <HeartPulse
                className={`w-3 h-3 ${
                  hullHealth < 35
                    ? 'text-rose-400 animate-pulse'
                    : hullHealth < 70
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
              <span className="text-[7.5px] sm:text-[8px] font-bold text-slate-300">HP</span>
              <div className="w-8 sm:w-16 h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full transition-all duration-200 ${
                    hullHealth < 35
                      ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                      : hullHealth < 70
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hullHealth))}%` }}
                />
              </div>
              <span
                className={`text-[8.5px] sm:text-[10px] font-black ${
                  hullHealth < 35
                    ? 'text-rose-400 animate-pulse'
                    : hullHealth < 70
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                {Math.round(hullHealth)}%
              </span>
            </div>
          </div>

          {/* Right Wing: Race Timer & Utility Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Race Timer */}
            <div className="flex items-baseline font-mono font-bold bg-black/60 border border-cyan-500/30 rounded-lg px-1.5 sm:px-2 py-0.5">
              <span className="text-[11px] sm:text-xs lg:text-sm text-white font-black">
                {formatMinSec(currentLapMs)}.
              </span>
              <span className="text-[11px] sm:text-xs lg:text-sm text-[#ff00e5] font-black">
                {formatHundredths(currentLapMs)}
              </span>
            </div>

            {/* Utility Toolbar Icons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Minimap Toggle */}
              <button
                onClick={() => setShowMinimap(prev => !prev)}
                className={`w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  showMinimap
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_8px_#00f0ff]'
                    : 'bg-black/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
                title={showMinimap ? 'Hide Minimap Radar' : 'Show Minimap Radar'}
              >
                <Map className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* HUD Mode Density Toggle */}
              <button
                onClick={cycleHudMode}
                className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-black/60 border border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                title={`HUD Mode: ${hudMode} (Tap to cycle Compact / Tactical / Minimal)`}
              >
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              </button>

              {/* Camera Cycle */}
              <button
                onClick={onToggleCamera}
                className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-black/60 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                title={`Camera Mode: ${cameraMode}`}
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* Pause */}
              <button
                onClick={onTogglePause}
                className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-black/60 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                title="Pause Race"
              >
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* AI Debug */}
              {isAIRaceActive && onToggleAIDebug && (
                <button
                  onClick={onToggleAIDebug}
                  className={`w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isAIDebugOpen
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_8px_#00f0ff]'
                      : 'bg-black/60 border-slate-700 text-slate-400 hover:text-cyan-300'
                  }`}
                  title="Toggle AI Intelligence Telemetry"
                >
                  <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Tactical Mode Pod (Universal For All 21 Game Modes + Submode 10) */}
        {hudMode !== 'MINIMAL' && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center gap-1.5 px-1 pointer-events-auto">
            {isSubmode10Active ? (
              <div className="flex flex-col items-center gap-1.5 w-full">
                <CircularCountdownIndicator
                  remainingMs={countdownRemainingMs}
                  initialMs={quantumCountdownTelemetry?.initialDurationMs || 900000}
                  isCollapseActive={isCollapseActive}
                  eventIndex={currentEventIdx}
                  currentEventTitle={masterEvent.eventName}
                  currentEventWarning={masterEvent.alertMessage}
                  nextEventTime={nextEventCountdownTime}
                  nextEventTitle={masterNextEvent?.eventName}
                  currentEventDef={currentEventDef}
                  nextEventDef={nextEventDef}
                  destructionDist={destructionDist}
                  gravityStress={gravityStress}
                  eventHorizonDist={eventHorizonDist}
                  onTriggerCollapse={onTriggerCollapse}
                  onOpenStages={() => setIsStagesModalOpen(true)}
                  showDetails={showDetails}
                  onToggleDetails={() => setShowDetails(prev => !prev)}
                />

                {/* SINGLE AUTHORITATIVE COMPACT EVENT ALERT BAR */}
                <CompactEventAlertBar
                  eventNumber={masterEvent.eventNumber}
                  displayTime={masterEvent.displayTime}
                  eventName={masterEvent.eventName}
                  alertMessage={masterEvent.alertMessage}
                  severity={masterEvent.severity}
                  severityLevel={masterEvent.severityLevel}
                  isZeroHour={isCollapseActive || currentEventIdx >= 100}
                />

                {/* MULTI-STAGE ESCAPE MISSION STATUS BAR (SUBMODE 10 PART 4) */}
                {blackHoleCinematicTelemetry?.escapeMission?.missionId && (
                  <div className="w-full max-w-2xl px-2.5 sm:px-3 py-1 rounded-xl bg-[#040817]/90 border border-cyan-500/40 backdrop-blur-md flex flex-col gap-1 shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-fadeIn">
                    <div className="flex items-center justify-between gap-1.5 text-[8px] sm:text-[9.5px] font-mono leading-tight">
                      <div className="flex items-center gap-1.5 truncate">
                        <Rocket className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="font-black text-cyan-300 uppercase truncate">
                          {blackHoleCinematicTelemetry.escapeMission.routeName}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 font-bold shrink-0">
                          {blackHoleCinematicTelemetry.escapeMission.currentStageId}: {blackHoleCinematicTelemetry.escapeMission.currentStageName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-400 font-bold">
                          CP: {blackHoleCinematicTelemetry.escapeMission.checkpointsValidated}/{blackHoleCinematicTelemetry.escapeMission.totalCheckpoints}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-black text-[7px] sm:text-[8px] border uppercase ${
                            blackHoleCinematicTelemetry.escapeMission.safeZoneStatus === 'VALIDATED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                              : blackHoleCinematicTelemetry.escapeMission.safeZoneStatus === 'APPROACHING'
                              ? 'bg-amber-950 text-amber-300 border-amber-500'
                              : blackHoleCinematicTelemetry.escapeMission.safeZoneStatus === 'DEADLINE_EXPIRED'
                              ? 'bg-red-950 text-red-300 border-red-500'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          SAFE ZONE: {blackHoleCinematicTelemetry.escapeMission.safeZoneStatus}
                        </span>
                      </div>
                    </div>

                    {/* 8-Stage Pip Indicator */}
                    <div className="flex items-center gap-1 w-full pt-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((stg) => (
                        <div
                          key={`pip-${stg}`}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            stg < (blackHoleCinematicTelemetry.escapeMission?.currentStageNumber ?? 1) ||
                            blackHoleCinematicTelemetry.escapeMission?.isMissionCompleted
                              ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                              : stg === blackHoleCinematicTelemetry.escapeMission?.currentStageNumber
                              ? 'bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]'
                              : 'bg-slate-800'
                          }`}
                          title={`Stage ${stg}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : modeTelemetry ? (
              /* Non-Black-Hole (Universal across all other 20 Game Modes) */
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-xl bg-cyan-950/85 border border-cyan-500/50 text-[9.5px] sm:text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-cyan-300 font-extrabold uppercase tracking-wider shrink-0">
                  {modeTelemetry.modeName}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-white font-bold truncate max-w-[190px] sm:max-w-[320px]">
                  {modeTelemetry.primaryMetric}
                </span>
                {modeTelemetry.warningText && (
                  <span className="text-amber-300 font-black animate-pulse bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/50 text-[8.5px]">
                    {modeTelemetry.warningText}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Row 2 (Optional / Drawer): Detailed Submode 10 Telemetry (No duplicate alert box) */}
        {(showDetails || hudMode === 'TACTICAL') && gameMode === 'BLACK_HOLE' && (
          <div className="w-full max-w-xl flex flex-col gap-1.5 bg-[#030712]/92 border border-purple-500/40 rounded-xl px-3 py-2 text-[8.5px] sm:text-[9.5px] font-mono text-slate-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-fadeIn">
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              <div>
                <span className="text-slate-500 block text-[7.5px]">GRAV STRESS</span>
                <strong className={gravityStress > 70 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}>
                  {gravityStress}%
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px]">HORIZON DIST</span>
                <strong className={eventHorizonDist < 800 ? 'text-rose-400 animate-pulse' : 'text-purple-300'}>
                  {eventHorizonDist}M
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px]">JUNCTION DIST</span>
                <strong className="text-cyan-300 truncate block">
                  {junctionDistanceVal}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[7.5px]">ROUTE VECTOR</span>
                <strong className="text-fuchsia-300 truncate block">
                  {currentRouteVal}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Evacuation Objective Ticker (If Active) */}
        {blackHoleCinematicTelemetry?.objective && isCollapseActive && (
          <div className="mt-1 px-3 py-1 rounded-lg bg-emerald-950/85 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-black uppercase tracking-wider animate-fadeIn shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            🎯 {blackHoleCinematicTelemetry.objective}
          </div>
        )}
      </div>

      {/* ================= 2. FLOATING RADAR MINIMAP (CLEANLY ANCHORED) ================= */}
      {showMinimap && hudMode !== 'MINIMAL' && (
        <div className="fixed top-16 sm:top-20 lg:top-16 right-1.5 sm:right-3 z-30 pointer-events-auto transition-all duration-200">
          {minimapTelemetry ? (
            <InteractiveMinimap
              telemetry={minimapTelemetry}
              onToggleMode={onToggleMinimapMode}
              onZoomIn={onZoomInMinimap}
              onZoomOut={onZoomOutMinimap}
              onResetZoom={onResetMinimapZoom}
              onToggleExpand={onToggleMinimapExpand}
            />
          ) : (
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-cyan-500/40 bg-[#040812]/90 backdrop-blur-md relative flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)] pointer-events-none">
              <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="50" y1="4" x2="50" y2="96" stroke="#00f0ff" strokeWidth="0.6" strokeDasharray="2,2" />
                <line x1="4" y1="50" x2="96" y2="50" stroke="#00f0ff" strokeWidth="0.6" strokeDasharray="2,2" />
              </svg>
              <div className="absolute bottom-1.5 text-[6.5px] sm:text-[8px] font-mono font-bold text-cyan-300 tracking-widest uppercase text-center w-full">
                {sectorTitle}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. CENTER OVERLAY POPUPS (RETICLES & MILESTONES) ================= */}
      <div className="flex flex-col items-center justify-center pointer-events-none z-10 space-y-2">
        {/* Countdown 3-2-1-GO */}
        {countdown !== null && (
          <div className="text-center animate-scaleIn select-none drop-shadow-[0_0_35px_rgba(0,240,255,0.9)]">
            <span className="font-ui font-black text-6xl sm:text-8xl italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-[#ff00e5]">
              {countdown === 0 ? 'LAUNCH!' : countdown}
            </span>
          </div>
        )}

        {/* Milestone Message */}
        {milestoneMessage && (
          <div className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-ui font-black uppercase tracking-wider shadow-[0_0_20px_#ffaa00] animate-bounce">
            {milestoneMessage}
          </div>
        )}

        {/* Warp Shortcut Banner */}
        {shortcutMessage && (
          <div className="px-4 py-1.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 text-xs font-ui font-black uppercase tracking-wider shadow-[0_0_20px_#ff00e5] animate-bounce">
            WARP PASSAGE: {shortcutMessage}
          </div>
        )}

        {/* Missile Lock Reticle */}
        {missileTelemetry?.hasTargetLock && missileTelemetry.targetInfo && (
          <div className="flex flex-col items-center pointer-events-none select-none transition-all duration-150 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-red-500 rounded-xl rotate-45 flex items-center justify-center animate-pulse shadow-[0_0_25px_rgba(255,51,102,0.6)]">
              <Crosshair className="w-5 h-5 text-red-400 animate-spin -rotate-45" />
            </div>
            <div className="mt-1 px-2.5 py-0.5 bg-black/85 border border-red-500/70 rounded text-[9px] font-mono font-bold text-red-300 tracking-wider">
              MISSILE LOCK: {missileTelemetry.targetInfo.name.toUpperCase()} [{Math.round(missileTelemetry.targetInfo.distance)}M]
            </div>
          </div>
        )}

        {/* Beam Target Lock Reticle */}
        {beamTelemetry && beamTelemetry.hasTargetLock && (
          <div className="flex flex-col items-center pointer-events-none select-none animate-fadeIn">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all ${
                beamTelemetry.isFiring ? 'border-rose-500 scale-90 shadow-[0_0_25px_#ff0055]' : 'border-cyan-400/80 shadow-[0_0_15px_#00f0ff]'
              }`}
            >
              <div className="w-3 h-3 rounded-full border border-dashed border-cyan-200 animate-spin" />
            </div>
            <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-black/85 border border-cyan-400/70 text-cyan-300 text-[9px] font-mono font-bold">
              BEAM LOCK [{beamTelemetry.targetType || 'ASTEROID'}] {Math.round(beamTelemetry.targetDistance)}M
            </div>
          </div>
        )}

        {/* Active Power-Ups Shelf (Slim, Non-blocking) */}
        {powerUps.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
            {powerUps.map(p => (
              <div
                key={p.type}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-cyan-400/60 bg-black/70 text-[9px] font-mono text-cyan-300 backdrop-blur-sm shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="font-bold">{p.type.replace(/_/g, ' ')}</span>
                <span className="font-black text-white">{p.remainingTime}s</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 4. BOTTOM CONTROLS & ERGONOMIC ACTION DECK ================= */}
      <div className="w-full flex items-end justify-between safe-pad-b gap-2 z-30">
        {/* Bottom Left: Translucent Cyber Joystick */}
        <div className="flex flex-col items-start pointer-events-auto select-none">
          <div
            ref={joystickRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-[#040914]/75 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.18)] backdrop-blur-sm touch-none cursor-grab active:cursor-grabbing select-none"
          >
            {/* Concentric Guide Rings */}
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border border-cyan-500/20" />
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-cyan-500/30" />

            {/* Movable Thumbstick Knob */}
            <div
              className={`absolute w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-300 shadow-[0_0_15px_#00f0ff] transition-transform duration-75 flex items-center justify-center ${
                touchActive ? 'bg-gradient-to-b from-cyan-400 to-blue-600 scale-95' : 'bg-gradient-to-b from-cyan-500/80 to-blue-700/80 scale-100'
              }`}
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
            </div>
          </div>
          <div className="text-[7px] sm:text-[8.5px] font-mono font-bold text-cyan-400/80 tracking-widest mt-0.5 pl-1">
            STEER // FWD & REV
          </div>
        </div>

        {/* Bottom Center: Reset Orientation Button */}
        <div className="flex flex-col items-center pointer-events-auto select-none mb-0.5">
          <button
            onPointerDown={e => {
              e.preventDefault();
              onRecover?.();
            }}
            onTouchStart={e => {
              e.preventDefault();
              onRecover?.();
            }}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#060e1b]/80 border border-slate-700/80 text-slate-400 hover:text-white active:bg-cyan-500 active:text-slate-950 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer touch-none"
            title="Reset Orientation [R]"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            <span className="text-[5.5px] sm:text-[6px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              R
            </span>
          </button>
        </div>

        {/* Bottom Right: Unified Speed & Power Cluster + Translucent Action Deck */}
        <div className="flex flex-col items-end pointer-events-auto select-none gap-1 sm:gap-2">
          {/* Unified Speedometer, Core Temperature & Ship Vitals Deck */}
          <div className="flex flex-col gap-1 sm:gap-1.5 bg-[#050b14]/90 border border-cyan-500/40 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.25)] min-w-[140px] sm:min-w-[230px] max-w-[175px] sm:max-w-[240px]">
            {/* Top row: Digital Speed & Ship Core Temperature */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-3 border-b border-cyan-500/20 pb-0.5 sm:pb-1.5">
              {/* Digital Speedometer */}
              <div className="flex items-baseline">
                <span className="text-lg sm:text-3xl font-ui font-black text-cyan-300 leading-none drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">
                  {speed < 0 ? `R${Math.abs(speed)}` : speed}
                </span>
                <span className="text-[6.5px] sm:text-[8px] font-mono font-black text-cyan-500 ml-0.5 sm:ml-1">
                  KM/H
                </span>
              </div>

              {/* SHIP CORE TEMPERATURE TELEMETRY */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-0.5 sm:gap-1 font-mono">
                  <Thermometer
                    className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${
                      isCriticalHeat
                        ? 'text-rose-500 animate-pulse'
                        : isOverheating
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  />
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-slate-400">CORE</span>
                  <span
                    className={`text-[9px] sm:text-xs font-black tracking-tight ${
                      isCriticalHeat
                        ? 'text-rose-400 animate-pulse drop-shadow-[0_0_8px_#f43f5e]'
                        : isOverheating
                        ? 'text-amber-300 drop-shadow-[0_0_6px_#f59e0b]'
                        : 'text-cyan-200'
                    }`}
                  >
                    {displayCoreTemp}°C
                  </span>
                </div>
                <div className="text-[5.5px] sm:text-[7px] font-mono font-bold tracking-wider">
                  {isCriticalHeat ? (
                    <span className="text-rose-400 font-black animate-pulse">MELTDOWN</span>
                  ) : isOverheating ? (
                    <span className="text-amber-400 font-bold">OVERHEAT</span>
                  ) : displayCoreTemp > 500 ? (
                    <span className="text-yellow-300">HIGH THERMAL</span>
                  ) : (
                    <span className="text-cyan-400/80">NOMINAL</span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Thermal Progress Bar */}
            <div className="w-full flex items-center gap-1.5">
              <span className="text-[6.5px] sm:text-[7px] font-mono text-slate-400 w-6 sm:w-8 shrink-0">HEAT</span>
              <div className="w-full h-1 sm:h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    isCriticalHeat
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse'
                      : isOverheating
                      ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-yellow-400'
                  }`}
                  style={{ width: `${tempProgress}%` }}
                />
              </div>
            </div>

            {/* Dual Vitals: Boost Fuel & Beam Weapon */}
            <div className="flex flex-col gap-0.5 sm:gap-1 text-[7px] sm:text-[7.5px] font-mono">
              {/* Boost Fuel Bar */}
              <div className="flex items-center justify-between">
                <span className="text-fuchsia-300 font-bold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-fuchsia-400" /> BOOST
                </span>
                <span className="text-fuchsia-400 font-black">{Math.round(boost)}%</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-400 rounded-full transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, boost))}%` }}
                />
              </div>

              {/* Beam Weapon Energy Bar */}
              {beamTelemetry && (
                <>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={
                        beamTelemetry.isOverheated
                          ? 'text-rose-400 font-black animate-pulse flex items-center gap-1'
                          : 'text-rose-300 font-bold flex items-center gap-1'
                      }
                    >
                      <Flame className="w-2.5 h-2.5 text-rose-400" />{' '}
                      {beamTelemetry.isOverheated ? 'LOCKOUT' : 'BEAM'}
                    </span>
                    <span className="text-rose-400 font-black">{Math.round(beamTelemetry.energy)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${
                        beamTelemetry.isOverheated
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-gradient-to-r from-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, beamTelemetry.energy))}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Thermal Load Indicator Dots */}
            <div className="hidden sm:flex items-center justify-between pt-0.5 border-t border-slate-800/60 text-[7px] font-mono text-slate-400">
              <span>THERMAL LOAD</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map(dotIdx => (
                  <div
                    key={dotIdx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      displayCoreTemp > 750
                        ? dotIdx < 3
                          ? 'bg-amber-400 shadow-[0_0_4px_#ffaa00]'
                          : 'bg-rose-500 shadow-[0_0_4px_#ff0055]'
                        : displayCoreTemp > 450
                        ? 'bg-yellow-400 shadow-[0_0_3px_#eab308]'
                        : 'bg-cyan-400 shadow-[0_0_3px_#00f0ff]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Deck: 2 Rows of Translucent Cyber Buttons */}
          <div className="flex flex-col items-end gap-1">
            {/* Row 1: Tactical Auxiliary (Drift, Missile, Shield) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Drift */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: true });
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: false });
                }}
                onPointerLeave={() => onInputChange?.({ drift: false })}
                onTouchStart={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: false });
                }}
                className="w-8.5 h-8.5 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border border-fuchsia-400/80 bg-fuchsia-950/60 text-fuchsia-300 flex flex-col items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.25)] active:scale-95 active:bg-fuchsia-500 active:text-slate-950 transition-all cursor-pointer backdrop-blur-sm"
                title="Drift Brake [Shift]"
              >
                <Wind className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                <span className="text-[5.5px] sm:text-[7.5px] font-ui font-black uppercase tracking-wider">
                  DRIFT
                </span>
              </button>

              {/* Guided Missile */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (missileTelemetry?.status !== 'RELOADING') {
                    onFireMissile?.();
                    onInputChange?.({ fireMissile: true });
                    setTimeout(() => onInputChange?.({ fireMissile: false }), 100);
                  }
                }}
                disabled={missileTelemetry?.status === 'RELOADING'}
                className={`relative w-8.5 h-8.5 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-sm ${
                  missileTelemetry?.status === 'RELOADING'
                    ? 'bg-slate-950/70 border-slate-800 text-slate-600'
                    : missileTelemetry?.hasTargetLock
                    ? 'bg-red-600/90 text-white border-white shadow-[0_0_20px_#ff0033] animate-pulse'
                    : 'bg-red-950/60 border-red-500/70 text-red-300 shadow-[0_0_10px_rgba(255,51,102,0.25)]'
                }`}
                title="Fire Guided Missile [M]"
              >
                <Rocket className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                <span className="text-[5.5px] sm:text-[7.5px] font-ui font-black uppercase tracking-wider">
                  MISSILE
                </span>
              </button>

              {/* Shield */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (activeShieldTelemetry?.status !== 'RECHARGING') {
                    onActivateShield?.();
                    onInputChange?.({ activateShield: true });
                    setTimeout(() => onInputChange?.({ activateShield: false }), 100);
                  }
                }}
                disabled={activeShieldTelemetry?.status === 'RECHARGING'}
                className={`relative w-8.5 h-8.5 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-sm ${
                  activeShieldTelemetry?.status === 'ACTIVE'
                    ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_20px_#00f0ff]'
                    : activeShieldTelemetry?.status === 'RECHARGING'
                    ? 'bg-slate-950/70 border-slate-800 text-slate-600'
                    : 'bg-cyan-950/60 border-cyan-400/70 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                }`}
                title="Deploy Active Shield [C]"
              >
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                <span className="text-[5.5px] sm:text-[7.5px] font-ui font-black uppercase tracking-wider">
                  SHIELD
                </span>
              </button>
            </div>

            {/* Row 2: Primary Propulsion & Offense (Beam, Brake, Boost) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Asteroid Beam */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (!beamTelemetry?.isOverheated && (beamTelemetry?.energy ?? 100) > 3) {
                    onInputChange?.({ fireBeam: true });
                  }
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ fireBeam: false });
                }}
                onPointerLeave={() => onInputChange?.({ fireBeam: false })}
                onTouchEnd={() => onInputChange?.({ fireBeam: false })}
                disabled={beamTelemetry?.isOverheated || (beamTelemetry?.energy ?? 100) <= 3}
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-sm ${
                  beamTelemetry?.isFiring
                    ? 'bg-rose-500 text-white border-white shadow-[0_0_25px_#ff0055]'
                    : beamTelemetry?.isOverheated
                    ? 'bg-rose-950/30 border-rose-900 text-rose-800'
                    : 'bg-rose-950/60 border-rose-400/80 text-rose-300 shadow-[0_0_12px_rgba(255,0,85,0.25)]'
                }`}
                title="Fire Asteroid Beam [E]"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[6px] sm:text-[8px] font-ui font-black uppercase tracking-wider">
                  BEAM
                </span>
              </button>

              {/* Brake / Reverse */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  onInputChange?.({ throttle: -1 });
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ throttle: 0 });
                }}
                onPointerLeave={() => onInputChange?.({ throttle: 0 })}
                onTouchStart={e => {
                  e.preventDefault();
                  onInputChange?.({ throttle: -1 });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onInputChange?.({ throttle: 0 });
                }}
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border border-amber-400/80 bg-amber-950/60 text-amber-300 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 active:bg-amber-500 active:text-slate-950 transition-all cursor-pointer backdrop-blur-sm"
                title="Brake & Reverse [S / Down]"
              >
                <ChevronsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[6px] sm:text-[8px] font-ui font-black uppercase tracking-wider">
                  BRAKE
                </span>
              </button>

              {/* Hyper-Boost Hold */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (boost > 5) onInputChange?.({ boost: true });
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ boost: false });
                }}
                onPointerLeave={() => onInputChange?.({ boost: false })}
                onTouchStart={e => {
                  e.preventDefault();
                  if (boost > 5) onInputChange?.({ boost: true });
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  onInputChange?.({ boost: false });
                }}
                disabled={boost <= 5}
                className={`w-10 h-10 sm:w-13 sm:h-13 rounded-lg sm:rounded-xl border-2 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.35)] active:scale-95 transition-all cursor-pointer backdrop-blur-sm ${
                  speed > 250
                    ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_30px_#00f0ff]'
                    : boost > 5
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 active:bg-cyan-400 active:text-slate-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-600'
                }`}
                title="Hyper-Boost [Space / Hold]"
              >
                <ChevronsUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 leading-none" />
                <span className="text-[7px] sm:text-[9.5px] font-ui font-black uppercase tracking-widest leading-none mt-0.5">
                  BOOST
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Holographic Branching Path & Junction Switching HUD */}
      <JunctionHUD
        telemetry={junctionTelemetry}
        onSelectRoute={onSelectRoute}
        onCommitRoute={onCommitRoute}
      />

      {/* Submode 10: 93-Stage Collapse Chronicles Modal */}
      {isStagesModalOpen && (
        <Submode10StagesModal
          isOpen={isStagesModalOpen}
          onClose={() => setIsStagesModalOpen(false)}
          elapsedSeconds={quantumCountdownTelemetry ? Math.floor(quantumCountdownTelemetry.elapsedMs / 1000) : 0}
          onSkipToZero={onTriggerCollapse}
          onJumpToEvent={onJumpToEvent}
        />
      )}
    </div>
  );
};
