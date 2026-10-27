/**
 * VOID-RIDER 3D — CONVOY GUARDIAN MISSION HUD
 * 
 * Master contract requirements:
 * - Live Tactical Radar: Compact minimap & Expanded view, Zoom (+/-), Recenter,
 *   Accessible symbols (Shape & Color), Live vs Fading Last-Known contacts, Tap-to-Target.
 * - Exactly Six Directional Controls: UP, DOWN, LEFT, RIGHT, FORWARD, BACKWARD
 *   with Continuous Touch Press-and-Hold & Pointer Capture.
 * - ENGINE ON/OFF Toggle Switch with Station-Keeping telemetry.
 * - Exactly 5 Equipped Abilities with Cooldown Radians & Ultimate Designation.
 * - 15-State Emergency Escape Sequence 1 status banner.
 * - Convoy Integrity, Individual Transport Roster, Fleet Speed, Speedometer.
 * - Preserves existing Cyber Joystick, Boost, Brake, Fire, Shield triggers.
 * - Responsive desktop/tablet/mobile layouts without control overlap.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Timer,
  Zap,
  Crosshair,
  AlertTriangle,
  Pause,
  Flame,
  CheckCircle2,
  Skull,
  Navigation,
  Power,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Layers,
  Camera,
  Lock,
  Anchor,
  Compass,
} from 'lucide-react';
import {
  ConvoyTelemetry,
  DirectionalThrustState,
  RadarContact,
  ConvoyFormationPreset,
  ConvoyFleetCommand,
} from '../../game/convoy/convoyTypes';
import { sound } from '../../game/audio';

interface ConvoyHUDProps {
  telemetry: ConvoyTelemetry;
  onTogglePause: () => void;
  onJoystickInput?: (input: { steerX: number; pitchY: number }) => void;
  onFirePress?: (isFiring: boolean) => void;
  onBoostPress?: (isBoosting: boolean) => void;
  onShieldPress?: (isShielding: boolean) => void;
  onDirectionalInput?: (input: Partial<DirectionalThrustState>) => void;
  onToggleEngine?: () => void;
  onTriggerAbility?: (slotIndex: number) => void;
  onSelectRadarContact?: (contactId: string) => void;
  onSetRadarZoom?: (zoom: number) => void;
  onToggleRadarExpanded?: () => void;
  onCycleCameraPerspective?: () => void;
  onCameraZoomIn?: () => void;
  onCameraZoomOut?: () => void;
  onEngageParkingLock?: () => void;
  onToggleAssistedParking?: () => void;
  onRepositionPlayer?: () => void;
  onSetFormation?: (formation: ConvoyFormationPreset) => void;
  onIssueCommand?: (command: ConvoyFleetCommand) => void;
  onTriggerEmergencyEscape?: () => void;
  onCallBackup?: (division: 'D5' | 'D4' | 'D3' | 'D2' | 'D1') => void;
  onSelectBackupDivision?: (division: 'D5' | 'D4' | 'D3' | 'D2' | 'D1') => void;
}

export const ConvoyHUD: React.FC<ConvoyHUDProps> = ({
  telemetry,
  onTogglePause,
  onJoystickInput,
  onFirePress,
  onBoostPress,
  onShieldPress,
  onDirectionalInput,
  onToggleEngine,
  onTriggerAbility,
  onSelectRadarContact,
  onSetRadarZoom,
  onToggleRadarExpanded,
  onCycleCameraPerspective,
  onCameraZoomIn,
  onCameraZoomOut,
  onEngageParkingLock,
  onToggleAssistedParking,
  onRepositionPlayer,
  onSetFormation,
  onIssueCommand,
  onTriggerEmergencyEscape,
  onCallBackup,
  onSelectBackupDivision,
}) => {
  // Joystick State
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const [isFiringActive, setIsFiringActive] = useState(false);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  // Two-finger touchscreen pinch zoom, active only while Convoy Guardian HUD is mounted.
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchGestureConsumedRef = useRef(false);

  useEffect(() => {
    const distance = (touches: TouchList) => {
      if (touches.length < 2) return null;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchDistanceRef.current = distance(event.touches);
        pinchGestureConsumedRef.current = false;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchDistanceRef.current === null) return;
      const nextDistance = distance(event.touches);
      if (nextDistance === null) return;
      const delta = nextDistance - pinchDistanceRef.current;
      // Trigger one bounded zoom step per ~28 px of pinch movement.
      if (Math.abs(delta) >= 28) {
        event.preventDefault();
        if (delta > 0) onCameraZoomIn?.();
        else onCameraZoomOut?.();
        pinchDistanceRef.current = nextDistance;
        pinchGestureConsumedRef.current = true;
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        pinchDistanceRef.current = null;
        pinchGestureConsumedRef.current = false;
      }
    };

    // Capture at document level so pinching works over the 3D canvas as well as HUD gaps.
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('touchend', onTouchEnd, true);
      document.removeEventListener('touchcancel', onTouchEnd, true);
    };
  }, [onCameraZoomIn, onCameraZoomOut]);

  // Directional input tracking state
  const activeThrustRef = useRef<DirectionalThrustState>({
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    backward: false,
  });

  // Clean release on unmount
  useEffect(() => {
    return () => {
      onJoystickInput?.({ steerX: 0, pitchY: 0 });
      onFirePress?.(false);
      onBoostPress?.(false);
      onShieldPress?.(false);
      onDirectionalInput?.({
        up: false,
        down: false,
        left: false,
        right: false,
        forward: false,
        backward: false,
      });
    };
  }, []);

  if (!telemetry.isActive) return null;

  const minutes = Math.floor(telemetry.timeElapsedSeconds / 60);
  const seconds = telemetry.timeElapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const playerHealthPct = Math.max(
    0,
    Math.min(100, (telemetry.playerHealth / telemetry.playerMaxHealth) * 100)
  );
  const playerShieldPct = Math.max(
    0,
    Math.min(100, (telemetry.playerShield / telemetry.playerMaxShield) * 100)
  );

  // --------------------------------------------------------------------
  // SIX-DIRECTION THRUST BUTTON HANDLERS (CONTINUOUS PRESS & HOLD)
  // --------------------------------------------------------------------
  const handleThrustStart = (axis: keyof DirectionalThrustState, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    activeThrustRef.current[axis] = true;
    onDirectionalInput?.({ [axis]: true });
  };

  const handleThrustEnd = (axis: keyof DirectionalThrustState, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    activeThrustRef.current[axis] = false;
    onDirectionalInput?.({ [axis]: false });
  };

  // --------------------------------------------------------------------
  // CYBER FLIGHT JOYSTICK HANDLERS
  // --------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouchActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    pointerIdRef.current = null;
    resetJoystick();
  };

  const resetJoystick = () => {
    setTouchActive(false);
    setStickPos({ x: 0, y: 0 });
    onJoystickInput?.({ steerX: 0, pitchY: 0 });
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

    const steerX = Math.max(-1, Math.min(1, deltaX / maxRadius));
    const pitchY = Math.max(-1, Math.min(1, -deltaY / maxRadius));

    onJoystickInput?.({
      steerX: Math.abs(steerX) > 0.04 ? steerX : 0,
      pitchY: Math.abs(pitchY) > 0.04 ? pitchY : 0,
    });
  };

  // --------------------------------------------------------------------
  // ACTION BUTTONS
  // --------------------------------------------------------------------
  const handleFireStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsFiringActive(true);
    onFirePress?.(true);
  };
  const handleFireEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsFiringActive(false);
    onFirePress?.(false);
  };

  const handleBoostStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsBoostActive(true);
    onBoostPress?.(true);
  };
  const handleBoostEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsBoostActive(false);
    onBoostPress?.(false);
  };

  const handleShieldStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsShieldActive(true);
    onShieldPress?.(true);
  };
  const handleShieldEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsShieldActive(false);
    onShieldPress?.(false);
  };

  const isExpanded = telemetry.isRadarExpanded;
  const radarRadius = isExpanded ? 110 : 54;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-ui overflow-hidden text-slate-100">
      
      {/* LEADER-ONLY CONVOY BACKUP COMMAND */}
      {telemetry.backupTelemetry && (
        <div className="absolute left-3 top-3 sm:left-5 sm:top-5 pointer-events-auto z-50 w-[min(290px,calc(100vw-24px))] rounded-xl border border-cyan-400/50 bg-slate-950/95 p-3 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div><div className="text-[9px] font-black tracking-[0.2em] text-cyan-300">CONVOY COMMAND</div><div className="text-xs font-black text-white">BACKUP DIVISIONS</div></div>
            <span className={`text-[8px] font-black px-2 py-1 rounded border ${telemetry.backupTelemetry.eligible ? 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60' : 'border-amber-400/40 text-amber-300 bg-amber-950/40'}`}>{telemetry.backupTelemetry.eligible ? 'LEADER AUTHORIZED' : 'LEADER ONLY'}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {(['D5','D4','D3','D2','D1'] as const).map((id) => {
              const cd = telemetry.backupTelemetry!.cooldowns[id];
              const selected = telemetry.backupTelemetry!.selectedDivision === id;
              return <button key={id} onClick={() => onSelectBackupDivision?.(id)} title={`${id} ${({D5:'Shield',D4:'Danger scan',D3:'Asteroid destroyer',D2:'Major hazard destroyer',D1:'Enemy ship destroyer'} as const)[id]}`} className={`rounded-md border py-1.5 text-[10px] font-black ${selected ? 'border-cyan-300 bg-cyan-800/80 text-white' : 'border-white/15 bg-black/50 text-slate-300'}`}><span className="block">{id}</span><span className="block text-[7px] font-mono">{cd > 0 ? `${Math.ceil(cd)}s` : 'READY'}</span></button>;
            })}
          </div>
          {telemetry.backupTelemetry.active ? <div className="mt-2 rounded-md bg-cyan-950/60 border border-cyan-500/30 p-2"><div className="text-[9px] font-black text-cyan-200">{telemetry.backupTelemetry.active.name} DEPLOYED</div><div className="text-[8px] text-slate-300">{telemetry.backupTelemetry.active.statusText}</div><div className="text-[8px] font-mono text-cyan-300">RETURN IN {Math.ceil(telemetry.backupTelemetry.active.timeRemaining)}s</div></div> : <button disabled={!telemetry.backupTelemetry.eligible || !onCallBackup || telemetry.backupTelemetry.cooldowns[telemetry.backupTelemetry.selectedDivision] > 0} onClick={() => onCallBackup?.(telemetry.backupTelemetry!.selectedDivision)} className="mt-2 w-full rounded-md border border-cyan-400/60 bg-cyan-900/70 py-2 text-[9px] font-black tracking-widest text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40">REQUEST REINFORCEMENT</button>}
          {!telemetry.backupTelemetry.eligible && <div className="mt-1 text-[8px] leading-snug text-amber-200/80">{telemetry.backupTelemetry.reason}</div>}
        </div>
      )}

      {/* PARKING DOME ARRIVAL & ESCAPE SEQUENCE BANNER */}
      {telemetry.escapeState && telemetry.escapeState.stepIndex >= 1 && (
        <div className="absolute top-16 inset-x-0 flex items-center justify-center pointer-events-none z-40 px-4">
          <div className="px-5 py-2 rounded-2xl bg-teal-950/90 border-2 border-teal-400 text-teal-100 backdrop-blur-md shadow-[0_0_30px_rgba(20,184,166,0.6)] flex items-center gap-3">
            <Radio className="w-5 h-5 text-teal-300 animate-spin" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-teal-300">
                FINAL DESTINATION: PARKING DOME · STEP {String(telemetry.escapeState.stepIndex).padStart(2, '0')}/{telemetry.escapeState.totalSteps}: {telemetry.escapeState.step.replace(/_/g, ' ')}
              </div>
              <div className="text-[9px] font-mono opacity-90 text-slate-200">
                {telemetry.escapeState.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GUARDIAN TERMINAL 5-GATE ROUTE SCHEMATIC (APPROACH, G1, AIRLOCK, G2, BAY 01, G3, G5) */}
      {telemetry.terminalTelemetry && (
        <div className="absolute top-28 inset-x-0 flex items-center justify-center pointer-events-auto z-30 px-4">
          <div className="px-3.5 py-1.5 rounded-2xl bg-black/90 border border-teal-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(20,184,166,0.3)] flex flex-wrap items-center justify-between gap-2 max-w-2xl w-full">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-teal-300 font-bold">
              <Navigation className="w-3.5 h-3.5 text-teal-400" />
              <span>TERMINAL: {telemetry.terminalTelemetry.currentZone.replace(/_/g, ' ')}</span>
            </div>

            {/* 5-Gate Schematic Pipeline */}
            <div className="flex items-center gap-1 text-[8px] font-mono">
              {/* Gate 1 Outer */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.activeGates.find((g) => g.id === 'GATE_1_OUTER_ENTRANCE')?.state === 'OPEN'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
                title="Gate 1: Outer Atmosphere Entrance"
              >
                G1 OUTER
              </div>
              <span className="text-slate-600">&rarr;</span>

              {/* Airlock Chamber */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.airlockStatus.chamberPressurized
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                    : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
                title="Airlock Equalization Chamber"
              >
                AIRLOCK
              </div>
              <span className="text-slate-600">&rarr;</span>

              {/* Gate 2 Inner */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.activeGates.find((g) => g.id === 'GATE_2_AIRLOCK_INNER')?.state === 'OPEN'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
                title="Gate 2: Atrium Inner Gate"
              >
                G2 INNER
              </div>
              <span className="text-slate-600">&rarr;</span>

              {/* Bay 01 Atrium */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.assignedBay.isClamped
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.5)] font-bold'
                    : telemetry.terminalTelemetry.assignedBay.isReadyToClamp
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse font-bold'
                    : 'bg-slate-900 border-white/20 text-slate-300'
                }`}
                title="Bay 01: Flagship Parking Pad"
              >
                BAY 01
              </div>
              <span className="text-slate-600">&rarr;</span>

              {/* Gate 3 Basement Descent */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.activeGates.find((g) => g.id === 'GATE_3_ATRIUM_TO_BASEMENT')?.state === 'OPEN'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
                title="Gate 3: Atrium to Basement Ramp"
              >
                G3 RAMP
              </div>
              <span className="text-slate-600">&rarr;</span>

              {/* Gate 5 Emergency Egress */}
              <div
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  telemetry.terminalTelemetry.emergencyEscapeActive
                    ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse font-bold shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : 'bg-slate-900 border-white/20 text-slate-400'
                }`}
                title="Gate 5: Emergency Escape Threshold"
              >
                G5 ESCAPE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE BOSS ENCOUNTER HEALTH & SHIELD BAR */}
      {telemetry.bossTelemetry?.hasActiveBoss && (
        <div className="absolute top-16 inset-x-0 flex items-center justify-center pointer-events-none z-35 px-4">
          <div className="px-5 py-2.5 rounded-2xl bg-black/95 border-2 border-red-500/80 text-slate-100 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.6)] max-w-xl w-full flex flex-col gap-1.5 animate-fadeIn pointer-events-auto">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-red-400 font-black tracking-widest flex items-center gap-1.5 uppercase">
                <Skull className="w-4 h-4 text-red-500 animate-pulse" />
                {telemetry.bossTelemetry.name}
              </span>
              <span className="text-amber-400 font-bold truncate max-w-[200px]">
                {telemetry.bossTelemetry.phaseName}
              </span>
              <span className="text-slate-300 font-bold">
                {telemetry.bossTelemetry.health} / {telemetry.bossTelemetry.maxHealth} HP
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-full h-2 rounded-full bg-slate-900 border border-red-500/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (telemetry.bossTelemetry.health / telemetry.bossTelemetry.maxHealth) * 100))}%` }}
              />
            </div>
            {/* Shield Bar if present */}
            {telemetry.bossTelemetry.maxShield > 0 && (
              <div className="w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (telemetry.bossTelemetry.shield / telemetry.bossTelemetry.maxShield) * 100))}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
              <span className={telemetry.bossTelemetry.isVulnerable ? 'text-emerald-400 font-black' : 'text-amber-400 font-bold'}>
                {telemetry.bossTelemetry.isVulnerable ? 'STATUS: CORE VULNERABLE — ALL WEAPONS ENGAGE' : 'STATUS: DEFLECTOR SHIELDS ARMED (SEVER NODES)'}
              </span>
              <span>PHASE {telemetry.bossTelemetry.phase} / {telemetry.bossTelemetry.totalPhases}</span>
            </div>

            {/* Tactical Defense Drone Target Array */}
            <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-red-500/20">
              <span className="text-[8px] font-mono text-slate-400">TARGET DRONES:</span>
              {[
                { id: 'scout', name: 'Scout' },
                { id: 'striker', name: 'Striker' },
                { id: 'warden', name: 'Warden' },
                { id: 'mender', name: 'Mender' },
                { id: 'jammer', name: 'Jammer' },
                { id: 'breaker', name: 'Breaker' },
              ].map((d) => {
                const contact = telemetry.radarContacts.find(
                  (c) => c.name.toLowerCase().includes(d.name.toLowerCase()) || c.id.toLowerCase().includes(d.name.toLowerCase())
                );
                const isAlive = contact ? contact.health > 0 : true;
                const isLocked = telemetry.lockedTarget?.id === contact?.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={!isAlive}
                    onClick={() => {
                      if (contact) {
                        sound.playTargetLock();
                        onSelectRadarContact?.(contact.id);
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono border transition-all ${
                      !isAlive
                        ? 'opacity-30 line-through bg-slate-900 border-slate-800 text-slate-500'
                        : isLocked
                        ? 'bg-red-500/40 border-red-400 text-red-200 font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : 'bg-black/60 border-red-500/30 text-red-300 hover:bg-red-950/40'
                    }`}
                  >
                    {d.name.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER STRIP */}
      <div className="absolute top-3 inset-x-3 md:inset-x-8 flex items-center justify-between pointer-events-auto z-20">
        {/* Left: Mode Title & Ship Details */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 border border-teal-500/40 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <div className="text-left">
            <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 block leading-none">
              CONVOY GUARDIAN [{telemetry.variant}]
            </span>
            <span className="text-[11px] font-black text-white">
              {telemetry.playerShipName} <span className="text-[9px] font-mono text-slate-400">({telemetry.playerRoleTitle})</span>
            </span>
          </div>
        </div>

        {/* Center: 200,000 KM Open World & 100-Location Indicator */}
        <div className="hidden sm:flex flex-col items-center max-w-lg w-full px-4 py-1.5 rounded-xl bg-black/85 border border-teal-500/30 backdrop-blur-md">
          <div className="w-full flex items-center justify-between text-[9px] font-mono mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-black tracking-wider uppercase">
                LOC {String(telemetry.locationIndex || telemetry.regionNumber).padStart(3, '0')}/100: {telemetry.locationName || telemetry.regionName}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider ${telemetry.travelDirection === 'RETURN' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-teal-500/20 text-teal-300 border border-teal-400/40'}`}>
                {telemetry.travelDirection === 'RETURN' ? '⮌ RETURN' : 'OUTBOUND ➔'}
              </span>
              {telemetry.boundaryWarning?.active && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider bg-red-500/30 text-red-300 border border-red-500 animate-pulse">
                  BOUNDARY {telemetry.boundaryWarning.distanceToEdge}M
                </span>
              )}
            </div>
            <span className="text-teal-300 font-bold">
              {(telemetry.currentRouteKm ?? Math.round((telemetry.routeProgressPercent / 100) * 200000)).toLocaleString()} / 200,000 KM
            </span>
          </div>
          <div className="w-full flex items-center justify-between text-[8px] font-mono text-slate-400 mb-1">
            <span>SECTOR: {telemetry.regionLocalKm.toLocaleString()} / 2,000 KM · ODOMETER: {(telemetry.cumulativeTravelKm ?? telemetry.roundTripKm ?? 0).toLocaleString()} KM</span>
            <span className="text-emerald-400 font-bold">{telemetry.routeProgressPercent}% COMPLETE</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${telemetry.routeProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Mission Timer & Pause */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 border border-amber-500/40 backdrop-blur-md text-amber-300 font-mono text-xs font-bold">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>{timeFormatted}</span>
          </div>
          <button
            onClick={onCycleCameraPerspective}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-black/80 hover:bg-teal-950 border border-teal-400/50 text-teal-200 transition-all active:scale-95"
            title="Change camera perspective: Chase → Close → Wide → Cockpit"
            aria-label="Change camera perspective"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline text-[9px] font-black tracking-wide">CAM</span>
          </button>
          <button
            onClick={onCameraZoomIn}
            className="flex items-center gap-1 px-2 py-2 rounded-xl bg-black/80 hover:bg-teal-950 border border-teal-400/40 text-teal-200 transition-all active:scale-95"
            title="Zoom camera in"
            aria-label="Zoom camera in"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline text-[9px] font-black">+</span>
          </button>
          <button
            onClick={onCameraZoomOut}
            className="flex items-center gap-1 px-2 py-2 rounded-xl bg-black/80 hover:bg-teal-950 border border-teal-400/40 text-teal-200 transition-all active:scale-95"
            title="Zoom camera out"
            aria-label="Zoom camera out"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden sm:inline text-[9px] font-black">−</span>
          </button>
          <button
            onClick={onTogglePause}
            className="p-2 rounded-xl bg-black/80 hover:bg-black border border-white/15 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Pause Match"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP-LEFT: TACTICAL RADAR (EXPANDABLE & LIVE VS LAST-KNOWN CONTACTS) */}
      <div className="absolute left-3 top-16 pointer-events-auto z-20 select-none">
        <div
          className={`relative rounded-2xl bg-[#031118]/90 border-2 border-teal-500/50 backdrop-blur-xl shadow-2xl transition-all ${
            isExpanded ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-36 h-36 sm:w-40 sm:h-40'
          }`}
        >
          {/* Radar Header / Controls */}
          <div className="absolute top-1.5 inset-x-2 flex items-center justify-between text-[8px] font-mono z-10 pointer-events-auto">
            <span className="text-teal-400 font-black tracking-wider flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-teal-400 animate-spin" />
              RADAR [{telemetry.radarZoom}X]
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSetRadarZoom?.(Math.min(2.5, telemetry.radarZoom + 0.5))}
                className="p-1 rounded bg-black/60 hover:bg-black/90 text-teal-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => onSetRadarZoom?.(Math.max(0.5, telemetry.radarZoom - 0.5))}
                className="p-1 rounded bg-black/60 hover:bg-black/90 text-teal-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                onClick={onToggleRadarExpanded}
                className="p-1 rounded bg-black/60 hover:bg-black/90 text-teal-300"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Circular Radar Sweep Screen */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl pointer-events-auto">
            {/* Range Rings */}
            <div className="w-3/4 h-3/4 rounded-full border border-teal-500/20" />
            <div className="w-1/2 h-1/2 rounded-full border border-teal-500/30" />
            <div className="w-1/4 h-1/4 rounded-full border border-teal-500/40" />

            {/* Sweep Beam Line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-teal-500/25" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-teal-500/25" />

            {/* Player Center Marker & Heading Cone */}
            <div className="relative w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_8px_#14b8a6] z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-teal-300" />
            </div>

            {/* Render Tactical Contacts */}
            {telemetry.radarContacts.map((contact) => {
              // Map distance and angle to 2D radar screen coordinates
              const maxDist = 2000 / telemetry.radarZoom;
              const normalizedDist = Math.min(1.0, contact.distance / maxDist);
              const r = normalizedDist * radarRadius;
              const x = Math.sin(contact.angleRad) * r;
              const y = -Math.cos(contact.angleRad) * r;

              const isTargeted = telemetry.lockedTarget?.id === contact.id;

              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectRadarContact?.(contact.id)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    color: contact.color,
                  }}
                  className={`absolute z-10 -ml-1.5 -mt-1.5 transition-all p-0.5 rounded ${
                    isTargeted ? 'scale-125 ring-1 ring-red-400' : 'scale-100'
                  } ${contact.isLive ? 'opacity-100' : 'opacity-40 animate-pulse'}`}
                  title={`${contact.name} (${contact.distance}m)`}
                >
                  {/* Shape by Category */}
                  {contact.symbol === 'SQUARE' && <div className="w-2 h-2 bg-current rounded-xs" />}
                  {contact.symbol === 'TRIANGLE' && (
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-current" />
                  )}
                  {contact.symbol === 'DIAMOND' && <div className="w-2 h-2 bg-current rotate-45" />}
                  {contact.symbol === 'HEXAGON' && <Skull className="w-3 h-3 text-current" />}
                  {contact.symbol === 'CIRCLE' && <div className="w-2 h-2 rounded-full border border-current" />}
                  {contact.symbol === 'STAR' && <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />}
                </button>
              );
            })}
          </div>

          <div className="absolute bottom-1 inset-x-2 flex items-center justify-between text-[7px] font-mono text-slate-400 z-10 pointer-events-none">
            <span>LIVE: {telemetry.radarContacts.filter(c => c.isLive).length}</span>
            <span>LAST KNOWN: {telemetry.radarContacts.filter(c => !c.isLive).length}</span>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT: Fleet Roster & Event Objective */}
      <div className="absolute right-3 top-16 w-56 sm:w-64 space-y-1.5 pointer-events-none z-20">
        {/* Current Mission Event Card */}
        <div className="p-2.5 rounded-xl bg-black/85 border border-teal-500/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-teal-400 font-black">
              EVENT {telemetry.currentEvent.eventNumber}/7: {telemetry.currentEvent.name}
            </span>
          </div>
          <div className="text-[10px] text-slate-200 mt-0.5 font-medium leading-snug">
            {telemetry.currentEvent.objectiveDescription}
          </div>
        </div>

        {/* Saviour 9-Ship Fleet Roster or Hunters Status */}
        {telemetry.variant === 'SAVIOUR' ? (
          <>
            <div className="p-2 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md space-y-1 max-h-48 overflow-y-auto">
              <div className="text-[8px] font-black uppercase tracking-wider text-teal-300">
                CONVOY FLEET INTEGRITY: {telemetry.convoyIntegrityPercent}% ({telemetry.transportsAliveCount}/9 SHIPS)
              </div>
              {telemetry.transports.map(t => (
                <div key={t.id} className="text-[8px] font-mono flex items-center justify-between">
                  <span className={`truncate max-w-[120px] ${t.isPlayerControlled ? 'text-amber-300 font-bold' : t.isLead ? 'text-teal-300' : 'text-slate-300'}`}>
                    {t.name} {t.isPlayerControlled && '[YOU]'}
                  </span>
                  <span className={t.status === 'DESTROYED' ? 'text-red-500 line-through' : t.healthPercent < 40 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {t.status === 'DESTROYED' ? 'LOST' : `${t.healthPercent}%`}
                  </span>
                </div>
              ))}
            </div>

            {/* Saviour Fleet Tactical Formations & Commands Card */}
            <div className="p-2 rounded-xl bg-black/85 border border-teal-500/30 backdrop-blur-md pointer-events-auto space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-teal-300">
                <span>FORMATION: {telemetry.activeFormation?.replace(/_/g, ' ') || 'V FORMATION'}</span>
                <span className="text-slate-400 font-mono">[KEY 6]</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {(['V_FORMATION', 'LINE_FORMATION', 'DIAMOND_FORMATION', 'DEFENSIVE_FORMATION', 'DISPERSED_FORMATION'] as ConvoyFormationPreset[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => onSetFormation?.(f)}
                    className={`py-1 rounded text-[7px] font-mono font-bold transition-all cursor-pointer ${
                      telemetry.activeFormation === f
                        ? 'bg-teal-500 text-black shadow-[0_0_8px_#14b8a6]'
                        : 'bg-slate-900/80 border border-white/10 text-slate-300 hover:border-teal-400'
                    }`}
                    title={`Engage ${f.replace(/_/g, ' ')}`}
                  >
                    {f === 'V_FORMATION' ? 'V-FORM' : f === 'LINE_FORMATION' ? 'LINE' : f === 'DIAMOND_FORMATION' ? 'DMND' : f === 'DEFENSIVE_FORMATION' ? 'DEF' : 'DISP'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-amber-300 pt-0.5">
                <span>ORDER: {telemetry.activeFleetCommand?.replace(/_/g, ' ') || 'FOLLOW'}</span>
                <span className="text-slate-400 font-mono">[KEY 7]</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {(['FOLLOW', 'REGROUP', 'DEFEND', 'SPREAD_OUT', 'HOLD_POSITION'] as ConvoyFleetCommand[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => onIssueCommand?.(c)}
                    className={`py-1 rounded text-[7px] font-mono font-bold transition-all cursor-pointer ${
                      telemetry.activeFleetCommand === c
                        ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                        : 'bg-slate-900/80 border border-white/10 text-slate-300 hover:border-amber-400'
                    }`}
                    title={`Order: ${c.replace(/_/g, ' ')}`}
                  >
                    {c === 'FOLLOW' ? 'FLW' : c === 'REGROUP' ? 'RGRP' : c === 'DEFEND' ? 'DFND' : c === 'SPREAD_OUT' ? 'SPRD' : 'HOLD'}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-2.5 rounded-xl bg-black/80 border border-fuchsia-500/40 backdrop-blur-md space-y-1">
            <div className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300">
              HUNTER INVASION: {telemetry.hunterEnemiesAlive} HOSTILES ENGAGED
            </div>
            <div className="text-[8px] font-mono text-slate-300">
              DREADNOUGHT X (BOSS): <strong className="text-red-400">{telemetry.bossHealth}</strong> / {telemetry.bossMaxHealth} HP
            </div>
            <div className="text-[8px] font-mono text-slate-300">
              DEFENSE DRONES ACTIVE: {telemetry.defensiveDronesAlive}/6
            </div>
          </div>
        )}

        {/* Notifications Feed */}
        <div className="space-y-1">
          {telemetry.notifications.slice(0, 2).map((notif) => (
            <div
              key={notif.id}
              className="p-1 rounded-lg bg-black/80 border border-white/10 text-[9px] font-mono text-slate-200 flex items-center gap-1.5"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${notif.type === 'ALERT' ? 'bg-red-400' : 'bg-teal-400'}`} />
              <span className="truncate">{notif.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Precision Target Reticle */}
      {telemetry.lockedTarget && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-16 h-16 flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />
            <div className="w-1 h-1 rounded-full bg-red-400" />
            <div className="absolute -bottom-5 px-2 py-0.5 rounded bg-black/80 border border-red-500/50 text-[8px] font-mono whitespace-nowrap text-center">
              <span className="text-red-400 font-bold">{telemetry.lockedTarget.name}</span>
              <span className="text-slate-300 ml-1">{telemetry.lockedTarget.distance}M</span>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL PARKING BAY GUIDANCE CONSOLE */}
      {telemetry.escapeState && telemetry.escapeState.stepIndex >= 4 && (
        <div className="absolute bottom-28 md:bottom-24 inset-x-0 flex justify-center pointer-events-auto z-40 px-4">
          <div className="px-5 py-3 rounded-2xl bg-[#03151b]/95 border-2 border-teal-400 text-white backdrop-blur-lg shadow-[0_0_40px_rgba(20,184,166,0.5)] flex flex-col md:flex-row items-center gap-3.5 max-w-2xl w-full">
            {/* Bay Placard & Distance */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-500/50 text-teal-300">
                <Anchor className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  ASSIGNED: BAY 01 · COMMAND FLAGSHIP
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-300">PAD DIST:</span>
                  <span className={`font-black ${(telemetry.escapeState.distanceToBay ?? 99) <= 32 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                    {telemetry.escapeState.distanceToBay ?? 0} M
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">SPEED:</span>
                  <span className={`font-black ${(telemetry.escapeState.playerSpeed ?? 0) <= 25 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {telemetry.escapeState.playerSpeed ?? 0} M/S
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicator badge */}
            <div className="flex-1 text-center">
              {telemetry.escapeState.locksEngaged ? (
                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  HYDRAULIC PARKING LOCKS ENGAGED
                </div>
              ) : telemetry.escapeState.canEngageLock ? (
                <div className="px-3 py-1 rounded-xl bg-amber-500/25 border border-amber-400 text-amber-200 text-xs font-black tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-300" />
                  ALIGNED OVER PAD — ENGAGE LOCKS NOW!
                </div>
              ) : (telemetry.escapeState.playerSpeed ?? 0) > 25 ? (
                <div className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-400 text-red-300 text-xs font-black tracking-wider flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  REDUCE SPEED FOR DOCKING (&lt; 25 M/S)
                </div>
              ) : (
                <div className="px-3 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-300" />
                  STEER INTO BAY 01 MARKER
                </div>
              )}
            </div>

            {/* Actions: Engage Lock, Auto-dock, Reposition, Emergency Drill */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onEngageParkingLock}
                disabled={telemetry.escapeState.locksEngaged || !telemetry.escapeState.canEngageLock}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 transition-all active:scale-95 ${
                  telemetry.escapeState.locksEngaged
                    ? 'bg-emerald-700/60 border border-emerald-400 text-emerald-100 cursor-default'
                    : telemetry.escapeState.canEngageLock
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-black border-2 border-white shadow-[0_0_20px_#10b981] animate-bounce cursor-pointer'
                    : 'bg-slate-800/80 border border-white/20 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{telemetry.escapeState.locksEngaged ? 'LOCKED' : 'ENGAGE LOCKS [L]'}</span>
              </button>

              {telemetry.escapeState.locksEngaged && (
                <button
                  onClick={() => onIssueCommand?.('RETURN_TO_ORIGIN')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:opacity-95 text-black text-xs font-black tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_20px_#06b6d4] active:scale-95 cursor-pointer"
                  title="Undock fleet and begin 75,000 km return journey to Origin Parking Dome"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>RETURN TO ORIGIN</span>
                </button>
              )}

              <button
                onClick={onToggleAssistedParking}
                className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black tracking-wider transition-all active:scale-95 ${
                  telemetry.escapeState.assistedParking
                    ? 'bg-cyan-500 text-black border-cyan-200 shadow-[0_0_12px_#06b6d4]'
                    : 'bg-black/60 border-white/20 text-cyan-300 hover:border-cyan-400'
                }`}
                title="Toggle assisted docking guidance vector"
              >
                AUTO-DOCK: {telemetry.escapeState.assistedParking ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={onRepositionPlayer}
                className="px-2 py-1.5 rounded-xl border border-white/20 bg-black/60 hover:border-amber-400 text-amber-300 text-[9px] font-mono transition-all active:scale-95"
                title="Reposition ship near bay entrance if stuck"
              >
                REPOSITION
              </button>

              <button
                onClick={onTriggerEmergencyEscape}
                className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-mono font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  telemetry.escapeState.isEmergencyActive
                    ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_#f43f5e] animate-pulse'
                    : 'border-rose-500/50 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:border-rose-400'
                }`}
                title="Initiate Emergency Escape Drill (Key U / X)"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{telemetry.escapeState.isEmergencyActive ? 'DRILL ACTIVE' : 'ESCAPE DRILL [U]'}</span>
              </button>
            </div>

            {/* Chamber Gates & Airlock Interlock Subsystem Telemetry */}
            {telemetry.terminalTelemetry && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between text-[8px] font-mono border-t border-teal-500/20 pt-2 gap-1 text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="text-teal-400 font-bold">CHAMBER GATES:</span>
                  <span className={telemetry.terminalTelemetry.interlockEngaged ? 'text-cyan-400' : 'text-slate-400'}>
                    {telemetry.terminalTelemetry.interlockEngaged ? 'AIRLOCK INTERLOCK: [ARMED]' : 'AIRLOCK: [STANDBY]'}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {telemetry.terminalTelemetry.gates.map(g => (
                    <span
                      key={g.id}
                      className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-black ${
                        g.state === 'OPEN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                          : g.state === 'OPENING' || g.state === 'SHIP_CROSSING'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 animate-pulse'
                          : g.state === 'EMERGENCY_OVERRIDE'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-400 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {g.id === 'GATE_1_OUTER_ENTRANCE' ? 'G1-ENTRY' :
                       g.id === 'GATE_2_AIRLOCK_INNER' ? 'G2-AIRLOCK' :
                       g.id === 'GATE_3_ATRIUM_TO_BASEMENT' ? 'G3-BASEMENT' :
                       g.id === 'GATE_4_RESTRICTED_MAINTENANCE' ? 'G4-MAINT' : 'G5-ESCAPE'}: {g.state}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BOTTOM CONTROLS & ERGONOMIC ACTION DECK                              */}
      {/* ==================================================================== */}
      <div className="absolute bottom-3 inset-x-3 md:inset-x-8 flex items-end justify-between pointer-events-none gap-2 z-30">
        
        {/* LEFT COLUMN: Player Status + ENGINE TOGGLE + 6-AXIS THRUST + JOYSTICK */}
        <div className="flex flex-col items-start gap-2 pointer-events-auto">
          {/* Player Ship Hull & Speed Telemetry */}
          <div className="w-56 md:w-64 p-2.5 rounded-2xl bg-black/85 border border-teal-500/30 backdrop-blur-xl shadow-2xl space-y-1 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
                {telemetry.playerShipName}
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                {telemetry.playerSpeedKmh} KM/H
              </span>
            </div>

            {/* Health & Shield Bars */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${playerHealthPct}%` }}
              />
            </div>
            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${playerShieldPct}%` }}
              />
            </div>

            {/* Warp Boost Bar */}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-300">
              <span className="text-amber-400">WARP BOOST</span>
              <span>{telemetry.playerBoost}%</span>
            </div>
          </div>

          {/* ENGINE ON/OFF TOGGLE & STATION-KEEPING BUTTON */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleEngine}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all active:scale-95 text-xs font-black tracking-wider ${
                telemetry.isEngineOn
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-red-950/80 border-red-500/50 text-red-300 hover:border-red-400'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${telemetry.isEngineOn ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
              <span>{telemetry.isEngineOn ? 'ENGINE: ON [STATION-KEEPING]' : 'ENGINE: OFF [DRIFT]'}</span>
            </button>
            <span className="text-[7px] font-mono text-slate-400">[HOTKEY: T]</span>
          </div>

          {/* SIX-DIRECTIONAL THRUST PAD (UP, DOWN, LEFT, RIGHT, FWD, REV) */}
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/80 border border-teal-500/30 backdrop-blur-md">
            <span className="text-[8px] font-black uppercase tracking-widest text-teal-300">
              6-AXIS DIRECTIONAL THRUST
            </span>
            <div className="grid grid-cols-3 gap-1">
              {/* Row 1: UP, FWD, DOWN */}
              <button
                onPointerDown={(e) => handleThrustStart('up', e)}
                onPointerUp={(e) => handleThrustEnd('up', e)}
                onPointerCancel={(e) => handleThrustEnd('up', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.up ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                UP ▲
              </button>
              <button
                onPointerDown={(e) => handleThrustStart('forward', e)}
                onPointerUp={(e) => handleThrustEnd('forward', e)}
                onPointerCancel={(e) => handleThrustEnd('forward', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.forward ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                FWD ⯅
              </button>
              <button
                onPointerDown={(e) => handleThrustStart('down', e)}
                onPointerUp={(e) => handleThrustEnd('down', e)}
                onPointerCancel={(e) => handleThrustEnd('down', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.down ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                DOWN ▼
              </button>

              {/* Row 2: LEFT, REV, RIGHT */}
              <button
                onPointerDown={(e) => handleThrustStart('left', e)}
                onPointerUp={(e) => handleThrustEnd('left', e)}
                onPointerCancel={(e) => handleThrustEnd('left', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.left ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                ◀ LEFT
              </button>
              <button
                onPointerDown={(e) => handleThrustStart('backward', e)}
                onPointerUp={(e) => handleThrustEnd('backward', e)}
                onPointerCancel={(e) => handleThrustEnd('backward', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.backward ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                REV ⯆
              </button>
              <button
                onPointerDown={(e) => handleThrustStart('right', e)}
                onPointerUp={(e) => handleThrustEnd('right', e)}
                onPointerCancel={(e) => handleThrustEnd('right', e)}
                className={`w-12 h-7 rounded-lg border text-[8px] font-black flex items-center justify-center transition-all ${
                  telemetry.directionalThrust?.right ? 'bg-teal-500 text-black border-teal-200' : 'bg-slate-900 border-white/10 text-teal-300'
                }`}
              >
                RIGHT ▶
              </button>
            </div>
          </div>

          {/* CYBER FLIGHT JOYSTICK */}
          <div className="flex flex-col items-center select-none">
            <div
              ref={joystickRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#04161a]/90 border-2 border-teal-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.25)] backdrop-blur-md touch-none cursor-grab active:cursor-grabbing select-none"
            >
              <div className="w-14 h-14 rounded-full border border-teal-500/25 pointer-events-none" />
              <div
                className={`absolute w-8 h-8 rounded-full border-2 border-teal-300 shadow-[0_0_12px_#14b8a6] transition-transform duration-75 flex items-center justify-center pointer-events-none ${
                  touchActive
                    ? 'bg-gradient-to-b from-teal-400 to-emerald-600'
                    : 'bg-gradient-to-b from-teal-500/80 to-emerald-700/80'
                }`}
                style={{
                  transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
            <span className="text-[7px] font-mono text-teal-400/90 font-bold mt-1">
              JOYSTICK [WASD]
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 ABILITY BUTTONS + ACTION TRIGGERS */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Top: 5 SYSTEM ABILITIES */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-sm">
            {telemetry.playerAbilities?.map((ab, idx) => {
              const isReady = ab.currentCooldown <= 0;
              const cdSeconds = Math.ceil(ab.currentCooldown);

              return (
                <button
                  key={ab.id}
                  onClick={() => onTriggerAbility?.(idx)}
                  disabled={!isReady}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between min-w-[58px] sm:min-w-[66px] h-14 sm:h-16 transition-all active:scale-95 ${
                    ab.isUltimate
                      ? isReady
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                        : 'bg-black/50 border-white/10 opacity-50'
                      : isReady
                      ? 'bg-black/80 border-teal-400/70 text-teal-100 hover:border-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                      : 'bg-black/50 border-white/10 opacity-50'
                  }`}
                  title={`${ab.name} — ${ab.description}`}
                >
                  <div className="w-full flex items-center justify-between text-[7px] font-mono">
                    <span className={ab.isUltimate ? 'text-amber-400 font-bold' : 'text-teal-300'}>
                      [{ab.keyLabel}]
                    </span>
                    <Zap className="w-2.5 h-2.5 text-current" />
                  </div>
                  <strong className="text-[8px] sm:text-[9px] font-black truncate max-w-[54px] sm:max-w-[62px] block text-center">
                    {ab.name.replace('ULTIMATE: ', '')}
                  </strong>
                  <span className="text-[7px] font-mono">
                    {isReady ? 'READY' : `${cdSeconds}s`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom: BOOST + SHIELD + FIRE TRIGGERS */}
          <div className="flex items-center gap-2">
            {/* Boost */}
            <button
              onPointerDown={handleBoostStart}
              onPointerUp={handleBoostEnd}
              onPointerCancel={handleBoostEnd}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[68px] sm:min-w-[76px] transition-all active:scale-95 touch-none select-none ${
                isBoostActive
                  ? 'bg-amber-600/90 border-amber-300 shadow-[0_0_20px_#f59e0b]'
                  : 'bg-black/80 border-amber-500/60 hover:border-amber-400'
              }`}
            >
              <Flame className={`w-4 h-4 mb-0.5 ${isBoostActive ? 'text-white scale-110' : 'text-amber-400'}`} />
              <span className="text-[8px] font-black uppercase text-amber-300">BOOST</span>
              <span className="text-[6px] font-mono text-slate-300">[SHIFT]</span>
            </button>

            {/* Shield */}
            <button
              onPointerDown={handleShieldStart}
              onPointerUp={handleShieldEnd}
              onPointerCancel={handleShieldEnd}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[68px] sm:min-w-[76px] transition-all active:scale-95 touch-none select-none ${
                isShieldActive
                  ? 'bg-cyan-600/90 border-cyan-200 shadow-[0_0_18px_#22d3ee]'
                  : 'bg-black/80 border-cyan-500/50'
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5 text-cyan-300" />
              <span className="text-[8px] font-black uppercase text-cyan-200">SHIELD</span>
              <span className="text-[6px] font-mono text-slate-300">[C]</span>
            </button>

            {/* Primary Fire */}
            <button
              onPointerDown={handleFireStart}
              onPointerUp={handleFireEnd}
              onPointerCancel={handleFireEnd}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[78px] sm:min-w-[88px] transition-all active:scale-95 touch-none select-none ${
                isFiringActive
                  ? 'bg-teal-500/90 border-teal-200 shadow-[0_0_25px_#14b8a6]'
                  : 'bg-teal-950/85 border-teal-500/80 hover:border-teal-400'
              }`}
            >
              <Crosshair className={`w-5 h-5 mb-0.5 ${isFiringActive ? 'text-white animate-spin' : 'text-teal-400'}`} />
              <span className="text-[9px] font-black uppercase text-teal-200 tracking-wider">FIRE</span>
              <span className="text-[7px] font-mono text-slate-300">[SPACE]</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
