/**
 * VOID-RIDER 3D — CONVOY GUARDIAN MISSION HUD
 * 
 * In-game real-time escort HUD overlay:
 * - 7 Sequential Mission Events Tracker & Objective Banner
 * - Master Convoy Integrity Bar & Individual Transport Health Cards
 * - 15,000 km Route Distance to Extraction Gate
 * - Precision Hostile Drone Target Lock Reticle
 * - Interactive Cyber Flight Joystick (Touch / Drag / WASD)
 * - Tactile Plasma Fire and Warp Boost Action Triggers
 * - Mobile responsive (Android portrait / landscape support)
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
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { ConvoyTelemetry } from '../../game/convoy/convoyTypes';

interface ConvoyHUDProps {
  telemetry: ConvoyTelemetry;
  onTogglePause: () => void;
  onJoystickInput?: (input: { steerX: number; pitchY: number }) => void;
  onSixAxisInput?: (input: { vertical: number; lateral: number; longitudinal: number }) => void;
  onFirePress?: (isFiring: boolean) => void;
  onBoostPress?: (isBoosting: boolean) => void;
  onBrakePress?: (isBraking: boolean) => void;
  onShieldPress?: (isShielding: boolean) => void;
  onEMPPress?: () => void;
  onVariantAbility?: () => void;
}

export const ConvoyHUD: React.FC<ConvoyHUDProps> = ({
  telemetry,
  onTogglePause,
  onJoystickInput,
  onSixAxisInput,
  onFirePress,
  onBoostPress,
  onBrakePress,
  onShieldPress,
  onEMPPress,
  onVariantAbility,
}) => {
  // Joystick State
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const [isFiringActive, setIsFiringActive] = useState(false);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [isBrakeActive, setIsBrakeActive] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltStatus, setTiltStatus] = useState<'off' | 'waiting' | 'active' | 'unsupported' | 'denied'>('off');
  const tiltBaselineRef = useRef<{ beta: number; gamma: number } | null>(null);
  const joystickInputCallbackRef = useRef(onJoystickInput);
  const fireCallbackRef = useRef(onFirePress);
  const boostCallbackRef = useRef(onBoostPress);
  const brakeCallbackRef = useRef(onBrakePress);
  const shieldCallbackRef = useRef(onShieldPress);
  useEffect(() => {
    joystickInputCallbackRef.current = onJoystickInput;
    fireCallbackRef.current = onFirePress;
    boostCallbackRef.current = onBoostPress;
    brakeCallbackRef.current = onBrakePress;
    shieldCallbackRef.current = onShieldPress;
  }, [onJoystickInput, onFirePress, onBoostPress, onBrakePress, onShieldPress]);
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const axisHeldRef = useRef({ up: false, down: false, left: false, right: false, forward: false, backward: false });
  const sendAxisInput = () => {
    const h = axisHeldRef.current;
    onSixAxisInput?.({ vertical: Number(h.up) - Number(h.down), lateral: Number(h.right) - Number(h.left), longitudinal: Number(h.forward) - Number(h.backward) });
  };
  const holdAxis = (axis: keyof typeof axisHeldRef.current, active: boolean) => {
    axisHeldRef.current[axis] = active;
    sendAxisInput();
  };
  useEffect(() => {
    const releaseAll = () => {
      axisHeldRef.current = { up: false, down: false, left: false, right: false, forward: false, backward: false };
      onSixAxisInput?.({ vertical: 0, lateral: 0, longitudinal: 0 });
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);
    return () => { window.removeEventListener('blur', releaseAll); document.removeEventListener('visibilitychange', releaseAll); releaseAll(); };
  }, [onSixAxisInput]);

  // Phone-tilt steering remains active for the full Convoy Guardian route.
  // On iOS, sensor permission must be requested from the button's user gesture.
  const enableTiltSteering = async () => {
    if (tiltEnabled) {
      setTiltEnabled(false);
      setTiltStatus('off');
      tiltBaselineRef.current = null;
      joystickInputCallbackRef.current?.({ steerX: 0, pitchY: 0 });
      return;
    }
    if (typeof window === 'undefined' || !(('DeviceOrientationEvent' in window))) {
      setTiltStatus('unsupported');
      return;
    }
    try {
      const orientationCtor = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof orientationCtor.requestPermission === 'function') {
        const permission = await orientationCtor.requestPermission();
        if (permission !== 'granted') {
          setTiltStatus('denied');
          return;
        }
      }
      tiltBaselineRef.current = null;
      setTiltStatus('waiting');
      setTiltEnabled(true);
    } catch {
      setTiltStatus('denied');
    }
  };

  useEffect(() => {
    if (!tiltEnabled) return;
    let hasReceivedReading = false;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      if (!tiltBaselineRef.current) {
        tiltBaselineRef.current = { beta: event.beta, gamma: event.gamma };
        setTiltStatus('active');
        return;
      }
      hasReceivedReading = true;
      const baseline = tiltBaselineRef.current;
      // Small dead zone prevents sensor noise from making the ship drift.
      const deadZone = (value: number) => Math.abs(value) < 2 ? 0 : value;
      const gammaDelta = deadZone(event.gamma - baseline.gamma);
      const betaDelta = deadZone(event.beta - baseline.beta);
      const steerX = Math.max(-1, Math.min(1, gammaDelta / 25));
      const pitchY = Math.max(-1, Math.min(1, betaDelta / 25));
      joystickInputCallbackRef.current?.({
        steerX: Math.abs(steerX) < 0.04 ? 0 : steerX,
        pitchY: Math.abs(pitchY) < 0.04 ? 0 : pitchY,
      });
    };
    window.addEventListener('deviceorientation', onOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', onOrientation, true);
      if (hasReceivedReading) joystickInputCallbackRef.current?.({ steerX: 0, pitchY: 0 });
    };
  }, [tiltEnabled]);

  // Clean release on unmount
  useEffect(() => {
    return () => {
      joystickInputCallbackRef.current?.({ steerX: 0, pitchY: 0 });
      fireCallbackRef.current?.(false);
      boostCallbackRef.current?.(false);
      brakeCallbackRef.current?.(false);
      shieldCallbackRef.current?.(false);
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
    resetJoystick();
  };

  const resetJoystick = () => {
    setTouchActive(false);
    setStickPos({ x: 0, y: 0 });
    onJoystickInput?.({ steerX: 0, pitchY: 0 });
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (tiltEnabled || !joystickRef.current) return;
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
      steerX: Math.abs(steerX) > 0.05 ? steerX : 0,
      pitchY: Math.abs(pitchY) > 0.05 ? pitchY : 0,
    });
  };

  // --------------------------------------------------------------------
  // ACTION TRIGGER BUTTON HANDLERS
  // --------------------------------------------------------------------
  const handleFireStart = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsFiringActive(true);
    onFirePress?.(true);
  };

  const handleFireEnd = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsFiringActive(false);
    onFirePress?.(false);
  };

  const handleBoostStart = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsBoostActive(true);
    onBoostPress?.(true);
  };

  const handleBoostEnd = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsBoostActive(false);
    onBoostPress?.(false);
  };

  const handleBrakeStart = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsBrakeActive(true);
    onBrakePress?.(true);
  };

  const handleBrakeEnd = (e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsBrakeActive(false);
    onBrakePress?.(false);
  };

  const pressDirection = (steerX: number, pitchY: number) => {
    if (!tiltEnabled) onJoystickInput?.({ steerX, pitchY });
  };

  const handleShieldStart = (e: React.PointerEvent | React.TouchEvent) => { e.preventDefault(); setIsShieldActive(true); onShieldPress?.(true); };
  const handleShieldEnd = (e: React.PointerEvent | React.TouchEvent) => { e.preventDefault(); setIsShieldActive(false); onShieldPress?.(false); };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-ui overflow-hidden text-slate-100">
      
      {/* TOP BAR: Convoy Guardian Branding, Event Tracker & Route Progress */}
      <div className="absolute top-3 inset-x-3 md:inset-x-10 flex flex-col items-center gap-1.5 z-20">
        <div className="w-full flex items-center justify-between">
          
          {/* Mission Mode Tag */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/75 border border-teal-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.25)]">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-teal-200">
              {telemetry.variant === 'SAVIOUR' ? 'CONVOY GUARDIAN · SAVIOUR' : 'CONVOY GUARDIAN · HUNTERS'}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
              {telemetry.variant === 'SAVIOUR' ? `EVENT ${telemetry.currentEventIndex}/7` : `${telemetry.hunterEnemiesAlive} HOSTILES`}
            </span>
          </div>

          {/* Route Distance to Destination Extraction Gate */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md text-xs font-mono">
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-300">EXTRACTION GATE:</span>
            <span className="text-teal-300 font-bold">{Math.ceil(telemetry.distanceToDestinationMeters / 1000).toLocaleString()} KM</span>
          </div>

          {/* Time & Pause */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/70 border border-amber-500/40 backdrop-blur-md font-mono text-xs text-amber-300">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeFormatted}</span>
            </div>

            <button
              onClick={onTogglePause}
              className="pointer-events-auto p-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-slate-300 hover:text-white transition-all active:scale-95 backdrop-blur-md"
              title="Pause Mission"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Mission Event & Objective Banner */}
        <div className="w-full max-w-xl bg-black/80 border border-teal-500/40 rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(20,184,166,0.2)] text-center space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              {telemetry.variant === 'SAVIOUR' ? `${telemetry.currentEvent.name} — ${telemetry.currentEvent.subtitle}` : 'HUNTERS ASSAULT — DESTROY BOSS CORE'}
            </span>
            <span className="font-mono text-[10px] text-teal-400 font-bold">
              {telemetry.variant === 'SAVIOUR' ? `${telemetry.routeProgressPercent}% EN ROUTE` : `${telemetry.defensiveDronesAlive}/6 DEFENCE DRONES`}
            </span>
          </div>

          {/* Progress bar along route */}
          {telemetry.variant === 'SAVIOUR' ? (<>
            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-300" style={{ width: `${telemetry.routeProgressPercent}%` }} /></div>
            <div className="text-[10px] text-slate-300 font-ui font-medium">{telemetry.currentEvent.objectiveDescription}</div>
          </>) : (<>
            <div className="flex justify-between text-[10px] font-mono text-fuchsia-200"><span>BOSS CORE</span><span>{telemetry.bossHealth}/{telemetry.bossMaxHealth} HP</span></div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-fuchsia-600 to-violet-400 transition-all duration-200" style={{ width: `${Math.max(0, Math.min(100, telemetry.bossHealth / Math.max(1, telemetry.bossMaxHealth) * 100))}%` }} /></div>
            <div className="text-[10px] text-slate-300">Defence drones reduce boss damage resistance when destroyed.</div>
          </>) }
        </div>
      </div>

      {/* LEFT: Convoy Fleet Integrity & Individual Transports Telemetry */}
      <div className={`absolute left-3 top-24 w-52 sm:w-60 flex flex-col gap-1.5 pointer-events-none z-20 ${telemetry.variant === 'HUNTERS' ? 'hidden' : ''}`}>
        {/* Master Fleet Integrity Box */}
        <div className="p-2 rounded-xl bg-black/80 border border-teal-500/40 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-teal-400" />
              CONVOY INTEGRITY
            </span>
            <span className="font-mono text-[10px] font-bold text-teal-300">
              {telemetry.convoyIntegrityPercent}% [{telemetry.transportsAliveCount}/{telemetry.transportsTotalCount}]
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.convoyIntegrityPercent > 60
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  : telemetry.convoyIntegrityPercent > 30
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
              }`}
              style={{ width: `${telemetry.convoyIntegrityPercent}%` }}
            />
          </div>
        </div>

        {/* Individual Transport Cards */}
        <div className="space-y-1 max-h-[44vh] overflow-y-auto pr-0.5 pointer-events-auto">
          {telemetry.transports.map((ship) => (
            <div
              key={ship.id}
              className={`p-1.5 rounded-lg border backdrop-blur-md transition-all text-[9px] ${
                ship.status === 'DESTROYED'
                  ? 'bg-black/30 border-white/5 opacity-40 line-through'
                  : ship.isLead
                  ? 'bg-teal-950/60 border-teal-500/70 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                  : ship.status === 'CRITICAL'
                  ? 'bg-red-950/60 border-red-500/70 animate-pulse'
                  : 'bg-black/60 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold truncate max-w-[120px] ${
                    ship.isLead ? 'text-teal-300' : 'text-slate-200'
                  }`}
                >
                  {ship.name}
                </span>
                <span className="font-mono text-[8px] text-slate-400">
                  {ship.status === 'DESTROYED' ? 'LOST' : `${ship.health} HP`}
                </span>
              </div>

              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all ${
                    ship.status === 'DESTROYED'
                      ? 'bg-transparent'
                      : ship.status === 'CRITICAL'
                      ? 'bg-red-500'
                      : ship.isLead
                      ? 'bg-teal-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${ship.healthPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Precision Target Lock Reticle */}
      {telemetry.lockedTarget && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-16 h-16 flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />
            <div className="w-1 h-1 rounded-full bg-red-400" />

            <div className="absolute -bottom-6 px-2 py-0.5 rounded bg-black/80 border border-red-500/50 text-[9px] font-mono whitespace-nowrap text-center">
              <span className="text-red-400 font-bold">{telemetry.lockedTarget.name}</span>
              <span className="text-slate-300 ml-1.5">{telemetry.lockedTarget.distance}M</span>
            </div>
          </div>
        </div>
      )}

      {telemetry.variant === 'HUNTERS' && (<div className="absolute left-3 top-24 w-52 sm:w-60 p-3 rounded-xl bg-black/80 border border-fuchsia-500/40 backdrop-blur-md space-y-2 pointer-events-none z-20"><div className="text-[10px] font-black tracking-widest text-fuchsia-300">HUNTERS FORMATION</div><div className="text-xs text-white">{telemetry.hunterEnemiesAlive} HOSTILES REMAINING</div><div className="text-[10px] text-slate-300">Defence drones alive: {telemetry.defensiveDronesAlive}/6</div><div className="text-[10px] text-slate-400">Primary target: BOSS CORE · 1,000 HP</div></div>)}

      {/* RIGHT: Notifications & Hostiles count */}
      <div className="absolute right-3 top-20 w-52 md:w-60 space-y-1 pointer-events-none z-20">
        {telemetry.activeHostileCount > 0 && (
          <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/60 backdrop-blur-md text-[10px] font-black text-red-200 shadow-lg flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              HOSTILES ENGAGING:
            </span>
            <span className="font-mono text-red-300 font-bold">{telemetry.activeHostileCount} DRONES</span>
          </div>
        )}

        {telemetry.notifications.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            className="p-1 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md text-[9px] font-bold shadow-lg flex items-center gap-1.5"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                notif.type === 'ALERT'
                  ? 'bg-red-400 animate-ping'
                  : notif.type === 'SUCCESS'
                  ? 'bg-emerald-400'
                  : 'bg-teal-400'
              }`}
            />
            <span className="truncate text-slate-200">{notif.text}</span>
          </div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM CONTROLS & ERGONOMIC ACTION DECK                              */}
      {/* ==================================================================== */}
      <div className="absolute bottom-3 inset-x-3 md:inset-x-8 flex items-end justify-between pointer-events-none gap-2 z-30">
        
        {/* LEFT COLUMN: Player Telemetry Card + CYBER FLIGHT JOYSTICK */}
        <div className="flex flex-col items-start gap-2 pointer-events-auto">
          {/* Player Ship Hull & Shield Telemetry */}
          <div className="w-56 md:w-64 p-2.5 rounded-2xl bg-black/85 border border-teal-500/30 backdrop-blur-xl shadow-2xl space-y-1 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-teal-400" />
                GUARDIAN FIGHTER
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                {telemetry.playerSpeedKmh} KM/H
              </span>
            </div>

            {/* Shield Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-cyan-400 font-bold">SHIELD</span>
                <span className="text-slate-300">
                  {telemetry.playerShield} / {telemetry.playerMaxShield}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-150"
                  style={{ width: `${playerShieldPct}%` }}
                />
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-emerald-400 font-bold">HULL INTEGRITY</span>
                <span className="text-slate-300">
                  {telemetry.playerHealth} / {telemetry.playerMaxHealth}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${playerHealthPct}%` }}
                />
              </div>
            </div>

            {/* Boost Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-amber-400 font-bold">WARP BOOST</span>
                <span className="text-slate-300">{telemetry.playerBoost}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{ width: `${telemetry.playerBoost}%` }}
                />
              </div>
            </div>
          </div>

          {/* DIRECTIONAL ARROW PAD — discrete, accessible alternative to the analog joystick */}
          <div className="grid grid-cols-3 gap-1 self-center pointer-events-auto" aria-label="Six-direction flight controls">
            <span />
            <button type="button" aria-label="Move up" onPointerDown={(e) => { e.preventDefault(); holdAxis('up', true); }} onPointerUp={() => holdAxis('up', false)} onPointerLeave={() => holdAxis('up', false)} onPointerCancel={() => holdAxis('up', false)} className="h-10 min-w-11 rounded-lg border border-cyan-400/70 bg-slate-950/95 text-cyan-200 active:bg-cyan-600/80 touch-none select-none"><ArrowUp className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">UP</span></button>
            <span />
            <button type="button" aria-label="Move left" onPointerDown={(e) => { e.preventDefault(); holdAxis('left', true); }} onPointerUp={() => holdAxis('left', false)} onPointerLeave={() => holdAxis('left', false)} onPointerCancel={() => holdAxis('left', false)} className="h-10 min-w-11 rounded-lg border border-cyan-400/70 bg-slate-950/95 text-cyan-200 active:bg-cyan-600/80 touch-none select-none"><ArrowLeft className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">LEFT</span></button>
            <button type="button" aria-label="Move down" onPointerDown={(e) => { e.preventDefault(); holdAxis('down', true); }} onPointerUp={() => holdAxis('down', false)} onPointerLeave={() => holdAxis('down', false)} onPointerCancel={() => holdAxis('down', false)} className="h-10 min-w-11 rounded-lg border border-cyan-400/70 bg-slate-950/95 text-cyan-200 active:bg-cyan-600/80 touch-none select-none"><ArrowDown className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">DOWN</span></button>
            <button type="button" aria-label="Move right" onPointerDown={(e) => { e.preventDefault(); holdAxis('right', true); }} onPointerUp={() => holdAxis('right', false)} onPointerLeave={() => holdAxis('right', false)} onPointerCancel={() => holdAxis('right', false)} className="h-10 min-w-11 rounded-lg border border-cyan-400/70 bg-slate-950/95 text-cyan-200 active:bg-cyan-600/80 touch-none select-none"><ArrowRight className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">RIGHT</span></button>
            <span />
            <button type="button" aria-label="Move backward" onPointerDown={(e) => { e.preventDefault(); holdAxis('backward', true); }} onPointerUp={() => holdAxis('backward', false)} onPointerLeave={() => holdAxis('backward', false)} onPointerCancel={() => holdAxis('backward', false)} className="h-10 min-w-11 rounded-lg border border-violet-400/70 bg-slate-950/95 text-violet-200 active:bg-violet-600/80 touch-none select-none"><ArrowDown className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">BACKWARD</span></button>
            <button type="button" aria-label="Move forward" onPointerDown={(e) => { e.preventDefault(); holdAxis('forward', true); }} onPointerUp={() => holdAxis('forward', false)} onPointerLeave={() => holdAxis('forward', false)} onPointerCancel={() => holdAxis('forward', false)} className="h-10 min-w-11 rounded-lg border border-violet-400/70 bg-slate-950/95 text-violet-200 active:bg-violet-600/80 touch-none select-none"><ArrowUp className="mx-auto h-5 w-5" /><span className="block text-[7px] font-bold">FORWARD</span></button>
          </div>

          {/* PHONE TILT STEERING: enable once and steer by tilting throughout the route */}
          <div className="flex flex-col items-center gap-1 mb-1 pointer-events-auto">
            <button
              type="button"
              onClick={enableTiltSteering}
              className={`px-3 py-2 rounded-xl border text-[9px] sm:text-[10px] font-black tracking-wider transition-colors ${
                tiltEnabled
                  ? 'bg-cyan-500/25 border-cyan-300 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-950/90 border-cyan-500/50 text-cyan-300 hover:border-cyan-300'
              }`}
            >
              {tiltEnabled ? 'TILT STEERING: ON' : 'ENABLE PHONE TILT'}
            </button>
            <span className="text-[7px] sm:text-[8px] font-mono text-cyan-200/80 text-center max-w-36">
              {tiltStatus === 'waiting' ? 'Keep phone steady to calibrate…' :
               tiltStatus === 'active' ? 'Tilt left/right to steer · forward/back to pitch' :
               tiltStatus === 'unsupported' ? 'Motion sensors unavailable; use joystick' :
               tiltStatus === 'denied' ? 'Motion permission denied; use joystick' :
               'Tilt phone to steer the ship along the route'}
            </span>
          </div>

          {/* CYBER FLIGHT JOYSTICK: remains available as a fallback */}
          <div className={`flex flex-col items-center select-none ${tiltEnabled ? 'opacity-50' : ''}`}>
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
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#04161a]/90 border-2 border-teal-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(20,184,166,0.3)] backdrop-blur-md touch-none cursor-grab active:cursor-grabbing select-none"
            >
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-teal-500/25 pointer-events-none" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-teal-500/35 pointer-events-none" />

              <div className="absolute top-1 text-[7px] font-mono font-bold text-teal-400/80 pointer-events-none">
                PITCH ▼
              </div>
              <div className="absolute bottom-1 text-[7px] font-mono font-bold text-teal-400/80 pointer-events-none">
                PITCH ▲
              </div>

              {/* Movable Thumbstick Knob */}
              <div
                className={`absolute w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-teal-300 shadow-[0_0_15px_#14b8a6] transition-transform duration-75 flex items-center justify-center pointer-events-none ${
                  touchActive
                    ? 'bg-gradient-to-b from-teal-400 to-emerald-600 scale-95'
                    : 'bg-gradient-to-b from-teal-500/80 to-emerald-700/80 scale-100'
                }`}
                style={{
                  transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
              </div>
            </div>

            <span className="text-[8px] font-mono text-teal-400/90 font-bold mt-1 tracking-wider">
              JOYSTICK FALLBACK [TOUCH / WASD]
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION TRIGGERS (WARP BOOST & PLASMA FIRE) */}
        <div className="flex flex-wrap items-center justify-end gap-2 pointer-events-auto max-w-[48vw] sm:max-w-none">
          {/* Brake is a hold control; releasing always restores normal drag */}
          <button type="button" onPointerDown={handleBrakeStart} onPointerUp={handleBrakeEnd} onPointerCancel={handleBrakeEnd} onPointerLeave={(e) => { if (isBrakeActive) handleBrakeEnd(e); }} onTouchStart={handleBrakeStart} onTouchEnd={handleBrakeEnd} onTouchCancel={handleBrakeEnd} className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center min-w-[68px] sm:min-w-[78px] transition-all active:scale-95 touch-none select-none ${isBrakeActive ? 'bg-red-700/90 border-red-200 shadow-[0_0_20px_#ef4444]' : 'bg-black/80 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.18)]'}`} aria-label="Hold to brake">
            <ArrowDown className="w-5 h-5 mb-0.5 text-red-300" />
            <span className="text-[9px] font-black uppercase tracking-wider text-red-200">BRAKE</span>
            <span className="text-[7px] font-mono text-slate-300">[CTRL / X]</span>
          </button>

          {/* Warp Boost Touch Trigger */}
          <button
            onPointerDown={handleBoostStart}
            onPointerUp={handleBoostEnd}
            onPointerCancel={handleBoostEnd}
            onTouchStart={handleBoostStart}
            onTouchEnd={handleBoostEnd}
            onTouchCancel={handleBoostEnd}
            className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center min-w-[74px] sm:min-w-[84px] transition-all active:scale-95 touch-none select-none ${
              isBoostActive
                ? 'bg-amber-600/90 border-amber-300 shadow-[0_0_20px_#f59e0b]'
                : 'bg-black/80 border-amber-500/60 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            }`}
          >
            <Flame className={`w-5 h-5 mb-0.5 ${isBoostActive ? 'text-white scale-110' : 'text-amber-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">BOOST</span>
            <span className="text-[7px] font-mono text-slate-300">[SHIFT]</span>
          </button>

          <button
            onPointerDown={handleShieldStart} onPointerUp={handleShieldEnd} onPointerCancel={handleShieldEnd}
            onTouchStart={handleShieldStart} onTouchEnd={handleShieldEnd} onTouchCancel={handleShieldEnd}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[48px] sm:min-w-[62px] transition-all active:scale-95 touch-none select-none ${isShieldActive ? 'bg-cyan-600/90 border-cyan-200 shadow-[0_0_18px_#22d3ee]' : 'bg-black/80 border-cyan-500/50'}`}
            aria-label="Hold to activate shield"
          ><ShieldAlert className="w-5 h-5 text-cyan-300" /><span className="text-[9px] font-black uppercase text-cyan-200">SHIELD</span></button>
          <button onClick={() => onEMPPress?.()} className="p-3 rounded-2xl border border-violet-500/60 bg-black/80 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[62px] transition-all active:scale-95" aria-label="Release EMP pulse"><Zap className="w-5 h-5 text-violet-300" /><span className="text-[9px] font-black uppercase text-violet-200">EMP</span></button>
          <button onClick={() => onVariantAbility?.()} className="p-3 rounded-2xl border border-emerald-500/60 bg-black/80 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[62px] transition-all active:scale-95" aria-label="Activate variant signature ability"><ShieldAlert className="w-5 h-5 text-emerald-300" /><span className="text-[9px] font-black uppercase text-emerald-200">{telemetry.variant === 'SAVIOUR' ? 'NANITE' : 'OVERDRIVE'}</span><span className="text-[7px] font-mono text-slate-300">[V]</span></button>

          {/* Primary Plasma Weapon Fire Trigger */}
          <button
            onPointerDown={handleFireStart}
            onPointerUp={handleFireEnd}
            onPointerCancel={handleFireEnd}
            onTouchStart={handleFireStart}
            onTouchEnd={handleFireEnd}
            onTouchCancel={handleFireEnd}
            className={`p-4 sm:p-5 rounded-2xl border-2 backdrop-blur-xl flex flex-col items-center justify-center min-w-[86px] sm:min-w-[96px] transition-all active:scale-95 touch-none select-none ${
              isFiringActive
                ? 'bg-teal-500/90 border-teal-200 shadow-[0_0_25px_#14b8a6]'
                : 'bg-teal-950/85 border-teal-500/80 hover:border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.4)]'
            }`}
          >
            <Crosshair
              className={`w-6 h-6 mb-0.5 ${
                isFiringActive ? 'text-white animate-spin' : 'text-teal-400'
              }`}
            />
            <span className="text-[10px] font-black uppercase text-teal-200 tracking-wider">FIRE</span>
            <span className="text-[8px] font-mono text-slate-300">[SPACE]</span>
          </button>
        </div>

      </div>
    </div>
  );
};
