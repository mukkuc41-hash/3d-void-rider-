import React from 'react';
import { CameraMode, ShipDamageZones } from '../types';

interface CockpitOverlayProps {
  cameraMode: CameraMode;
  speed: number;
  boost: number;
  hullHealth: number;
  coreTemperature: number;
  steerInput: number; // -1 to 1
  throttleInput: number; // 0 to 1
  isBoosting: boolean;
  damageZones?: ShipDamageZones;
}

export const CockpitOverlay: React.FC<CockpitOverlayProps> = ({
  cameraMode,
  speed,
  boost,
  hullHealth,
  coreTemperature,
  steerInput,
  throttleInput,
  isBoosting,
}) => {
  if (cameraMode !== 'COCKPIT') return null;

  // Calculate dynamic flight instrument telemetry
  const gForce = (1.0 + (speed / 300) * (isBoosting ? 2.8 : 1.2) + Math.abs(steerInput) * 1.5).toFixed(1);
  const pitchAngle = throttleInput * 6 - 3;
  const rollAngle = steerInput * -18; // Incline attitude
  const isHullCritical = hullHealth < 30;

  return (
    <div className="absolute inset-0 z-15 pointer-events-none select-none overflow-hidden">
      {/* Canopy Outer Struts / Flight Shell Frame */}
      <div className="absolute inset-0 flex justify-between">
        {/* Left Canopy A-Pillar */}
        <div
          className="w-24 sm:w-36 h-full bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent border-r border-cyan-500/20 shadow-2xl relative"
          style={{ transform: 'skewX(-6deg)' }}
        >
          <div className="absolute top-1/4 left-3 flex flex-col gap-1 font-mono text-[9px] text-cyan-400/70">
            <span>SYS: ONLINE</span>
            <span>PRESS: 1.01 ATM</span>
            <span>O2: 99.4%</span>
          </div>
        </div>

        {/* Right Canopy A-Pillar */}
        <div
          className="w-24 sm:w-36 h-full bg-gradient-to-l from-slate-950 via-slate-900/90 to-transparent border-l border-cyan-500/20 shadow-2xl relative"
          style={{ transform: 'skewX(6deg)' }}
        >
          <div className="absolute top-1/4 right-3 text-right flex flex-col gap-1 font-mono text-[9px] text-cyan-400/70">
            <span>INERTIAL: ON</span>
            <span>MAG: ACTIVE</span>
            <span>RADAR: 360°</span>
          </div>
        </div>
      </div>

      {/* Top Glass Canopy Arch with Sun Visor Tint */}
      <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent border-b border-cyan-500/30 flex items-center justify-center">
        <div className="flex items-center gap-6 font-mono text-[10px] text-slate-400">
          <span>APEX FLIGHT COMPUTER // MK-IX</span>
          <span className="text-cyan-400 animate-pulse font-bold">● HUD CALIBRATED</span>
        </div>
      </div>

      {/* Canopy Glass Cracks When Hull Is Heavily Damaged */}
      {isHullCritical && (
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 45% 40%, transparent 60px, rgba(255,255,255,0.8) 61px, transparent 63px)`,
          }}
        >
          <div className="absolute top-1/3 left-1/4 w-48 h-[1px] bg-white/70 rotate-45" />
          <div className="absolute top-1/3 left-1/4 w-36 h-[1px] bg-white/60 -rotate-12" />
          <div className="absolute top-2/5 right-1/3 w-60 h-[1px] bg-red-400/80 rotate-135 animate-pulse" />
        </div>
      )}

      {/* Bottom Dashboard Console */}
      <div className="absolute bottom-0 inset-x-0 h-32 sm:h-40 bg-gradient-to-t from-slate-950 via-[#030712]/95 to-transparent border-t border-cyan-500/30 flex items-end justify-between px-6 sm:px-16 pb-3">
        {/* Left Flight Instrument: Artificial Horizon Gyro */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-cyan-500/40 bg-black/60 backdrop-blur-md relative overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            {/* Rotating Horizon Line */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{ transform: `rotate(${rollAngle}deg) translateY(${pitchAngle}px)` }}
            >
              <div className="w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <div className="absolute -top-3 w-8 h-[1px] bg-cyan-300/60" />
              <div className="absolute top-3 w-8 h-[1px] bg-cyan-300/60" />
            </div>
            {/* Center Fixed Crosshair */}
            <div className="absolute w-3 h-3 border-t-2 border-amber-400 -translate-y-1" />
            <div className="absolute w-1 h-1 bg-amber-400 rounded-full" />
            <span className="absolute bottom-1 text-[8px] font-mono text-cyan-400 font-bold">HORIZON</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">ATTITUDE GYRO</span>
        </div>

        {/* Center Flight Stick Base & Animated Digital Accelerometer */}
        <div className="flex flex-col items-center mb-1">
          {/* Animated Flight Yoke/Stick */}
          <div className="w-28 h-10 border-t-2 border-slate-700 bg-slate-900/80 rounded-t-xl flex items-center justify-center relative">
            <div
              className="w-16 h-4 bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 rounded-full shadow-[0_0_12px_#00f0ff] transition-transform duration-75"
              style={{
                transform: `translateX(${steerInput * 18}px) rotate(${steerInput * 12}deg)`,
              }}
            />
          </div>

          <div className="flex items-center gap-3 mt-1 px-3 py-1 bg-black/80 border border-white/10 rounded">
            <span className="text-[10px] font-mono text-slate-400">G-ACCEL:</span>
            <span
              className={`text-xs font-mono font-black ${
                Number(gForce) > 4.0 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
              }`}
            >
              {gForce} G
            </span>
          </div>
        </div>

        {/* Right Flight Instrument: Core Heat & Thruster RPM */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-500/40 bg-black/60 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <span className="text-[8px] font-mono text-slate-400">CORE TEMP</span>
            <span
              className={`text-sm sm:text-base font-mono font-black ${
                coreTemperature > 450 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            >
              {Math.round(coreTemperature)}°K
            </span>
            <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                style={{ width: `${Math.min(100, (coreTemperature / 600) * 100)}%` }}
              />
            </div>
            <span className="text-[7.5px] font-mono text-slate-500 mt-1">WARP CORE</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">REACTOR STATUS</span>
        </div>
      </div>
    </div>
  );
};
