/**
 * VOID-RIDER 3D — JUGGERNAUT SPACE COMBAT HUD & FLIGHT CONTROLLER
 * 
 * Features:
 * - Interactive Cyber Flight Joystick: Touch & drag thumbstick for mobile/desktop
 *   controlling Yaw (turn left/right + aerodynamic roll) and Pitch (nose dive/climb)
 * - Tactile Action Deck:
 *   * Primary Plasma Cannon trigger button (touch-hold & tap to fire)
 *   * Warp Boost afterburner trigger button (touch-hold & tap)
 *   * Role Combat Ability buttons (Shockwave, Bulwark, Dash, Nova, Trap, Decoy) with cooldown rings
 * - Real-Time Solid Platform & Altitude Telemetry:
 *   * Platform deck altitude (Meters above y=0 deck surface)
 *   * Distance to circular platform rim (1450m radius)
 *   * Near-edge and void fall-off proximity warnings
 * - Master Boss / Titan health & shield bar
 * - 8-Ship Fleet Roster with live hull integrity & status
 * - Precision military target lock reticle
 * - Match timer countdown (03:00) & killfeed ticker
 * - Mobile responsive (Android portrait & landscape support)
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  ShieldAlert,
  Skull,
  Timer,
  Zap,
  Crosshair,
  AlertTriangle,
  Pause,
  Flame,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { JuggernautCombatTelemetry, CombatAbility } from '../../game/juggernaut/juggernautTypes';

interface JuggernautHUDProps {
  telemetry: JuggernautCombatTelemetry;
  onTriggerAbility: (abilityId: string) => void;
  onTogglePause: () => void;
  onJoystickInput?: (input: { steerX: number; pitchY: number }) => void;
  onFirePress?: (isFiring: boolean) => void;
  onBoostPress?: (isBoosting: boolean) => void;
  onDirectionalInput?: (input: { forward?: boolean; backward?: boolean; left?: boolean; right?: boolean; up?: boolean; down?: boolean }) => void;
}

export const JuggernautHUD: React.FC<JuggernautHUDProps> = ({
  telemetry,
  onTriggerAbility,
  onTogglePause,
  onJoystickInput,
  onFirePress,
  onBoostPress,
  onDirectionalInput,
}) => {
  // Joystick State
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const [isFiringActive, setIsFiringActive] = useState(false);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Clean release if unmounted or match ends
  useEffect(() => {
    return () => {
      onJoystickInput?.({ steerX: 0, pitchY: 0 });
      onFirePress?.(false);
      onBoostPress?.(false);
      onDirectionalInput?.({ forward: false, backward: false, left: false, right: false, up: false, down: false });
    };
  }, [onJoystickInput, onFirePress, onBoostPress]);

  if (!telemetry.isActive) return null;

  const minutes = Math.floor(telemetry.timeRemainingSeconds / 60);
  const seconds = telemetry.timeRemainingSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isApex = telemetry.mode === 'APEX_PREDATOR';

  const healthPercent = Math.max(
    0,
    Math.min(100, (telemetry.playerHealth / telemetry.playerMaxHealth) * 100)
  );
  const shieldPercent = Math.max(
    0,
    Math.min(100, (telemetry.playerShield / telemetry.playerMaxShield) * 100)
  );

  const bossShip = telemetry.bossOrTitanShip;
  const bossHealthPercent = bossShip
    ? Math.max(0, Math.min(100, (bossShip.health / bossShip.maxHealth) * 100))
    : 0;
  const bossShieldPercent = bossShip
    ? Math.max(0, Math.min(100, (bossShip.shield / bossShip.maxShield) * 100))
    : 0;

  // --------------------------------------------------------------------
  // CYBER FLIGHT JOYSTICK TOUCH & POINTER HANDLERS
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

    // Normalized steer (-1 to 1): X is yaw, -Y is pitch (push forward = dive nose down, pull back = climb)
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

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-ui overflow-hidden text-slate-100">
      {/* Damage Flash Red Vignette */}
      {telemetry.playerDamageFlash && (
        <div className="absolute inset-0 bg-red-600/20 pointer-events-none transition-opacity duration-150" />
      )}

      {/* PLATFORM EDGE & OUT-OF-BOUNDS WARNING SCREEN BANNER */}
      {(telemetry.isNearPlatformEdge ||
        telemetry.isNearBoundary ||
        telemetry.isFallingOffPlatform ||
        telemetry.isOutOfBounds) && (
        <div className="absolute top-20 inset-x-0 flex items-center justify-center pointer-events-none z-40 px-4">
          <div
            className={`px-5 py-2.5 rounded-2xl border-2 backdrop-blur-md flex items-center gap-3 shadow-2xl animate-pulse ${
              telemetry.isFallingOffPlatform || telemetry.isOutOfBounds
                ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_35px_rgba(239,68,68,0.7)]'
                : 'bg-amber-950/85 border-amber-500 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 shrink-0 ${
                telemetry.isFallingOffPlatform || telemetry.isOutOfBounds
                  ? 'text-red-400 animate-spin'
                  : 'text-amber-400'
              }`}
            />
            <div>
              <div className="text-xs font-black tracking-widest uppercase">
                {telemetry.isFallingOffPlatform
                  ? 'CRITICAL: OFF-PLATFORM VOID DROP DETECTED'
                  : telemetry.isOutOfBounds
                  ? 'WARNING: BEYOND ARENA FORCEFIELD'
                  : 'APPROACHING CIRCULAR PLATFORM RIM'}
              </div>
              <div className="text-[10px] font-mono opacity-90">
                {telemetry.isFallingOffPlatform
                  ? 'EMERGENCY VECTOR REPULSORS ACTIVE — WARPING TO DECK SURFACE'
                  : telemetry.isOutOfBounds
                  ? 'REPULSORS ENGAGED — RETURN TO COMBAT DECK IMMEDIATELY'
                  : `DISTANCE TO PLATFORM EDGE: ${Math.max(0, telemetry.distanceToPlatformEdge)}M`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: Mode branding, Master Boss / Titan Bar, and Countdown */}
      <div className="absolute top-3 inset-x-3 md:inset-x-12 flex flex-col items-center gap-1.5 z-20">
        {/* Top Control strip */}
        <div className="w-full flex items-center justify-between">
          {/* Mode Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/65 border border-white/10 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                isApex ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-200">
              {isApex ? 'APEX PREDATOR' : 'SWARM HUNT'}
            </span>
            <span className="hidden sm:inline text-[9px] text-slate-400 font-mono">
              [8 SHIPS COMBAT]
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-black/75 border border-amber-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono text-sm md:text-base font-black tracking-wider text-amber-300">
              {timeFormatted}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="pointer-events-auto p-1.5 md:p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-slate-300 hover:text-white transition-all active:scale-95 backdrop-blur-md"
            title="Pause Match"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Master Boss / Titan Health Bar */}
        {bossShip && (
          <div className="w-full max-w-xl bg-black/75 border border-red-500/35 rounded-xl p-2 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.25)] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black italic uppercase tracking-wider text-red-400 flex items-center gap-1">
                <Skull className="w-3 h-3" />
                {bossShip.name}
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                HP: <strong className="text-red-400">{bossShip.health}</strong> / {bossShip.maxHealth}
                {' | '}
                SHIELD: <strong className="text-cyan-400">{bossShip.shield}</strong> / {bossShip.maxShield}
              </span>
            </div>

            {/* Health Bar */}
            <div className="relative w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 transition-all duration-200"
                style={{ width: `${bossHealthPercent}%` }}
              />
              {bossShip.shield > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-cyan-400/50 border-r border-cyan-300 transition-all duration-200"
                  style={{ width: `${bossShieldPercent}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* LEFT: Fleet Status Tracker (All 8 Ships) - Compact and un-intrusive */}
      <div className="hidden lg:flex absolute left-4 top-24 bottom-60 w-44 flex-col justify-start gap-1 pointer-events-none">
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded bg-black/50 border border-white/5 w-fit">
          FLEET TELEMETRY
        </div>

        <div className="space-y-1 overflow-y-auto pr-1">
          {telemetry.allShips.map((ship) => {
            const shipHpPct = Math.max(0, Math.min(100, (ship.health / ship.maxHealth) * 100));
            const isTitan = ship.role === 'JUGGERNAUT' || ship.role === 'BOSS';

            return (
              <div
                key={ship.id}
                className={`p-1.5 rounded-lg border backdrop-blur-md transition-all text-[9px] ${
                  ship.isPlayer
                    ? 'bg-amber-950/60 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : ship.isDisabled
                    ? 'bg-yellow-950/60 border-yellow-500/60 animate-pulse'
                    : !ship.isAlive
                    ? 'bg-black/30 border-white/5 opacity-40 line-through'
                    : isTitan
                    ? 'bg-red-950/40 border-red-500/40'
                    : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold truncate max-w-[85px] ${
                      ship.isPlayer
                        ? 'text-amber-300'
                        : isTitan
                        ? 'text-red-400'
                        : 'text-cyan-300'
                    }`}
                  >
                    {ship.name.replace(' (YOU)', '').replace(' (AI)', '')}
                  </span>
                  <span className="font-mono text-[8px] text-slate-400">
                    {ship.isDisabled
                      ? 'REVIVE'
                      : !ship.isAlive
                      ? 'OFFLINE'
                      : `${ship.health} HP`}
                  </span>
                </div>

                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-0.5">
                  <div
                    className={`h-full transition-all ${
                      ship.isDisabled
                        ? 'bg-yellow-400'
                        : isTitan
                        ? 'bg-red-500'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${shipHpPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: Precision Military Target Reticle */}
      {telemetry.lockedTarget && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-16 h-16 flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />
            <div className="w-1 h-1 rounded-full bg-red-400" />

            <div className="absolute -bottom-6 px-2 py-0.5 rounded bg-black/75 border border-red-500/50 text-[9px] font-mono whitespace-nowrap text-center">
              <span className="text-red-400 font-bold">{telemetry.lockedTarget.name}</span>
              <span className="text-slate-300 ml-1.5">{telemetry.lockedTarget.distance}M</span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT: Live Combat Notification Feed */}
      <div className="absolute right-3 top-20 w-52 md:w-60 space-y-1 pointer-events-none">
        {telemetry.notifications.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            className="p-1 rounded-lg bg-black/65 border border-white/10 backdrop-blur-md text-[9px] font-bold shadow-lg flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className={`truncate ${notif.colorClass}`}>{notif.text}</span>
          </div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM CONTROL & TELEMETRY DECK */}
      {/* ==================================================================== */}
      <div className="absolute bottom-3 inset-x-3 md:inset-x-8 flex items-end justify-between pointer-events-none gap-2 z-30">
        
        {/* LEFT COLUMN: Player Telemetry Card + CYBER FLIGHT JOYSTICK */}
        <div className="flex flex-col items-start gap-2 pointer-events-auto">
          {/* Player Ship & Solid Platform Elevation Telemetry Card */}
          <div className="w-56 md:w-64 p-2.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl space-y-1 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {telemetry.playerRole} [YOU]
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                {telemetry.playerSpeedKmh} KM/H
              </span>
            </div>

            {/* Platform Altitude & Rim Distance Telemetry */}
            <div className="flex items-center justify-between px-2 py-0.5 rounded-lg bg-slate-900/80 border border-cyan-500/20 text-[9px] font-mono">
              <span className="text-cyan-300 font-bold">
                ALT: {telemetry.playerAltitude}M
              </span>
              <span className="text-amber-300">
                RIM: {Math.max(0, telemetry.distanceToPlatformEdge)}M
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
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-red-400 font-bold">HULL STRUCTURE</span>
                <span className="text-slate-300">
                  {telemetry.playerHealth} / {telemetry.playerMaxHealth}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            {/* Boost Bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-amber-400 font-bold">WARP BOOST</span>
                <span className="text-slate-300">{telemetry.playerBoostCharge}%</span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{ width: `${telemetry.playerBoostCharge}%` }}
                />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CYBER FLIGHT JOYSTICK (TOUCH / DRAG / WASD FLIGHT CONTROLLER)     */}
          {/* ================================================================ */}
          <div className="flex flex-col items-center gap-1.5 mb-2 pointer-events-auto">
            <span className="text-[8px] font-black tracking-widest text-cyan-300">6-AXIS THRUST</span>
            <div className="grid grid-cols-3 gap-1">
              {([['up','UP'],['forward','FWD'],['down','DOWN'],['left','LEFT'],['backward','REV'],['right','RIGHT']] as const).map(([axis,label]) => (
                <button key={axis} type="button"
                  onPointerDown={(e) => { e.preventDefault(); onDirectionalInput?.({ [axis]: true }); }}
                  onPointerUp={(e) => { e.preventDefault(); onDirectionalInput?.({ [axis]: false }); }}
                  onPointerCancel={(e) => { e.preventDefault(); onDirectionalInput?.({ [axis]: false }); }}
                  onPointerLeave={(e) => { if (e.buttons) onDirectionalInput?.({ [axis]: false }); }}
                  className="min-w-12 px-2 py-2 rounded-md border border-cyan-400/40 bg-slate-950/90 text-[8px] font-black text-cyan-100 active:bg-cyan-600/80 touch-none">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center select-none">
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
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#040914]/85 border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.25)] backdrop-blur-md touch-none cursor-grab active:cursor-grabbing select-none"
            >
              {/* Concentric Guide Rings */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-cyan-500/25 pointer-events-none" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-cyan-500/35 pointer-events-none" />

              {/* Pitch & Yaw Axis Indicators */}
              <div className="absolute top-1 text-[7px] font-mono font-bold text-cyan-400/80 pointer-events-none">
                PITCH ▼
              </div>
              <div className="absolute bottom-1 text-[7px] font-mono font-bold text-cyan-400/80 pointer-events-none">
                PITCH ▲
              </div>
              <div className="absolute left-1 text-[7px] font-mono font-bold text-cyan-400/80 pointer-events-none">
                ◀
              </div>
              <div className="absolute right-1 text-[7px] font-mono font-bold text-cyan-400/80 pointer-events-none">
                ▶
              </div>

              {/* Movable Cyber Thumbstick Knob */}
              <div
                className={`absolute w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-cyan-300 shadow-[0_0_15px_#00f0ff] transition-transform duration-75 flex items-center justify-center pointer-events-none ${
                  touchActive
                    ? 'bg-gradient-to-b from-cyan-400 to-blue-600 scale-95'
                    : 'bg-gradient-to-b from-cyan-500/80 to-blue-700/80 scale-100'
                }`}
                style={{
                  transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
              </div>
            </div>

            <span className="text-[8px] font-mono text-cyan-400/90 font-bold mt-1 tracking-wider">
              CYBER JOYSTICK [TOUCH / WASD]
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION CONTROLLER (FIRE TRIGGER, BOOST & ABILITIES) */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Top Row: Ability Buttons */}
          <div className="flex items-center gap-2">
            {(Object.values(telemetry.playerAbilities) as CombatAbility[]).map((ability) => {
              const isReady = ability.currentCooldown <= 0;
              const cdPct = ability.cooldownSeconds
                ? Math.max(0, (ability.currentCooldown / ability.cooldownSeconds) * 100)
                : 0;

              return (
                <button
                  key={ability.id}
                  onClick={() => onTriggerAbility(ability.id)}
                  disabled={!isReady}
                  className={`relative group p-2 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] transition-all active:scale-95 ${
                    isReady
                      ? 'bg-black/80 border-amber-500/70 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                      : 'bg-black/40 border-white/10 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {!isReady && (
                    <div
                      className="absolute inset-0 bg-red-950/70 rounded-2xl transition-all"
                      style={{ height: `${cdPct}%` }}
                    />
                  )}

                  <Zap
                    className={`w-3.5 h-3.5 mb-0.5 ${
                      isReady ? 'text-amber-400 group-hover:scale-110' : 'text-slate-500'
                    } transition-transform`}
                  />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-200">
                    {ability.name.split(' ')[0]}
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-mono text-amber-300">
                    {isReady ? `[${ability.keyLabel}]` : `${Math.ceil(ability.currentCooldown)}s`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Row: WARP BOOST BUTTON + PRIMARY FIRE TRIGGER */}
          <div className="flex items-center gap-2.5">
            {/* Warp Boost Touch/Click Trigger */}
            <button
              onPointerDown={handleBoostStart}
              onPointerUp={handleBoostEnd}
              onPointerCancel={handleBoostEnd}
              onTouchStart={handleBoostStart}
              onTouchEnd={handleBoostEnd}
              onTouchCancel={handleBoostEnd}
              className={`p-3 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] transition-all active:scale-95 touch-none select-none ${
                isBoostActive
                  ? 'bg-amber-600/90 border-amber-300 shadow-[0_0_20px_#f59e0b]'
                  : 'bg-black/80 border-amber-500/60 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              }`}
            >
              <Flame className={`w-5 h-5 mb-0.5 ${isBoostActive ? 'text-white scale-110' : 'text-amber-400'}`} />
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">BOOST</span>
              <span className="text-[7px] font-mono text-slate-300">[SHIFT]</span>
            </button>

            {/* Primary Plasma Weapon Fire Trigger (Holdable / Rapid Tap) */}
            <button
              onPointerDown={handleFireStart}
              onPointerUp={handleFireEnd}
              onPointerCancel={handleFireEnd}
              onTouchStart={handleFireStart}
              onTouchEnd={handleFireEnd}
              onTouchCancel={handleFireEnd}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 backdrop-blur-xl flex flex-col items-center justify-center min-w-[82px] sm:min-w-[92px] transition-all active:scale-95 touch-none select-none ${
                isFiringActive
                  ? 'bg-red-600/90 border-red-300 shadow-[0_0_25px_#ef4444]'
                  : 'bg-red-950/85 border-red-500/80 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            >
              <Crosshair
                className={`w-6 h-6 mb-0.5 ${
                  isFiringActive ? 'text-white animate-spin' : 'text-red-400'
                }`}
              />
              <span className="text-[10px] font-black uppercase text-red-200 tracking-wider">FIRE</span>
              <span className="text-[8px] font-mono text-slate-300">[SPACE]</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
