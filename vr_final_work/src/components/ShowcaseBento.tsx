import React from 'react';
import { Users, Orbit, Gamepad2, Skull, Smartphone, Check, Zap, Sparkles, AlertOctagon } from 'lucide-react';

export const ShowcaseBento: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-4 select-none">
      {/* 5-Column Responsive Bento Grid (Directly Matching User Reference Image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Panel 1: Multiplayer Racing */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 shadow-[0_0_20px_rgba(0,242,255,0.12)] flex flex-col justify-between backdrop-blur-md hover:border-cyan-400 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-ui font-black uppercase tracking-wider text-cyan-200">
                Multiplayer
              </span>
            </div>
            <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
              Multiplayer Racing
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Race with friends or players worldwide in real-time.
            </p>
          </div>

          {/* Visual Mini Stage */}
          <div className="my-3 h-28 rounded-xl bg-gradient-to-b from-cyan-950/50 via-slate-900 to-black/80 border border-cyan-500/20 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.2)_0%,_transparent_70%)]" />
            {/* Dual Ship Silhouette Graphic */}
            <div className="relative flex items-center gap-4 z-10">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_#00f0ff]">
                  <Zap className="h-4 w-4 text-cyan-300" />
                </div>
                <span className="text-[9px] font-mono text-cyan-300 mt-1">P1 [YOU]</span>
              </div>
              <div className="text-xs font-mono text-fuchsia-400 font-black">VS</div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400 flex items-center justify-center shadow-[0_0_12px_#ff00e5]">
                  <Sparkles className="h-4 w-4 text-fuchsia-300" />
                </div>
                <span className="text-[9px] font-mono text-fuchsia-300 mt-1">RIVAL</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
              2-8 Racers
            </span>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-fuchsia-950/70 border border-fuchsia-500/40 text-fuchsia-300">
              AI Grid
            </span>
          </div>
        </div>

        {/* Panel 2: Dynamic Space Environment */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 shadow-[0_0_20px_rgba(0,242,255,0.12)] flex flex-col justify-between backdrop-blur-md hover:border-cyan-400 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Orbit className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-ui font-black uppercase tracking-wider text-cyan-200">
                Cosmic Hazards
              </span>
            </div>
            <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
              Dynamic Space Environment
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Asteroids, hazards, wormholes, energy barriers.
            </p>
          </div>

          {/* 4 Hazard Tiles */}
          <div className="my-3 grid grid-cols-2 gap-1.5 h-28">
            <div className="rounded-lg bg-purple-950/40 border border-purple-500/30 p-1.5 flex flex-col justify-between">
              <span className="text-[8px] font-mono text-purple-300">WORMHOLE</span>
              <div className="h-6 w-6 mx-auto rounded-full border border-purple-400 border-dashed animate-spin" />
            </div>
            <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-1.5 flex flex-col justify-between">
              <span className="text-[8px] font-mono text-cyan-300">ENERGY GATE</span>
              <div className="h-1 w-full my-auto bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            </div>
            <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 p-1.5 flex flex-col justify-between">
              <span className="text-[8px] font-mono text-amber-300">ASTEROIDS</span>
              <div className="h-5 w-5 mx-auto rounded-sm bg-amber-700/60 border border-amber-400 rotate-12" />
            </div>
            <div className="rounded-lg bg-blue-950/40 border border-blue-500/30 p-1.5 flex flex-col justify-between">
              <span className="text-[8px] font-mono text-blue-300">WARP RIFT</span>
              <div className="h-2 w-full my-auto rounded-full bg-blue-400 shadow-[0_0_8px_#38bdf8]" />
            </div>
          </div>

          <div className="text-[9px] font-mono uppercase text-slate-400 text-center">
            Dynamic Track Anomalies
          </div>
        </div>

        {/* Panel 3: Controls */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 shadow-[0_0_20px_rgba(0,242,255,0.12)] flex flex-col justify-between backdrop-blur-md hover:border-cyan-400 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-ui font-black uppercase tracking-wider text-cyan-200">
                Dual Inputs
              </span>
            </div>
            <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
              Controls
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Touch (Mobile) + Keyboard (Desktop).
            </p>
          </div>

          {/* Controls Graphic */}
          <div className="my-3 h-28 rounded-xl bg-slate-900/90 border border-white/10 p-2 flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-400">DESKTOP</span>
              <span className="text-cyan-300 font-bold">W A S D / ARROWS</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-400">BOOST</span>
              <span className="text-cyan-300 font-bold">[SPACE] / CHEVRON</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-400">DRIFT</span>
              <span className="text-fuchsia-300 font-bold">[SHIFT] / SLIDE</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-400">MOBILE</span>
              <span className="text-emerald-300 font-bold">CIRCULAR D-PAD</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-cyan-300">
            <span>TOUCH // READY</span>
            <span>KEYS // READY</span>
          </div>
        </div>

        {/* Panel 4: Asteroid Collision */}
        <div className="rounded-2xl border border-rose-500/30 bg-slate-950/80 p-4 shadow-[0_0_20px_rgba(244,63,94,0.12)] flex flex-col justify-between backdrop-blur-md hover:border-rose-400 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400">
                <Skull className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-ui font-black uppercase tracking-wider text-rose-200">
                Hazard Alert
              </span>
            </div>
            <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
              Asteroid Collision
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Ship destroyed &rarr; Emergency recovery needed.
            </p>
          </div>

          {/* Explosion Danger Graphic */}
          <div className="my-3 h-28 rounded-xl bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-500/30 p-2.5 flex flex-col items-center justify-center text-center">
            <AlertOctagon className="h-7 w-7 text-rose-500 animate-pulse mb-1" />
            <div className="text-[10px] font-ui font-black tracking-widest text-rose-400 uppercase">
              SHIP DESTROYED
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              HULL BREACH DETECTED
            </div>
          </div>

          <div className="rounded-lg bg-rose-950/50 border border-rose-500/40 py-1 px-2 text-center text-[9px] font-mono font-bold text-rose-300">
            SHIELD OR EVADE
          </div>
        </div>

        {/* Panel 5: Mobile Optimized */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 shadow-[0_0_20px_rgba(0,242,255,0.12)] flex flex-col justify-between backdrop-blur-md hover:border-cyan-400 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-ui font-black uppercase tracking-wider text-cyan-200">
                Web & Mobile
              </span>
            </div>
            <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
              Mobile Optimized
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Smooth 60 FPS, stunning deep-space visuals.
            </p>
          </div>

          {/* Checklist */}
          <div className="my-3 h-28 rounded-xl bg-slate-900/90 border border-white/10 p-2.5 flex flex-col justify-around">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-200">
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
              <span>High FPS Engine</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-200">
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
              <span>Instanced Asteroids</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-200">
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
              <span>Smooth Touch Controls</span>
            </div>
          </div>

          <div className="text-[9px] font-mono uppercase text-emerald-400 text-center font-bold">
            100% HARDWARE ACCELERATED
          </div>
        </div>
      </div>

      {/* Footer Banner Matching Reference Image */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-bold">FASTER</span>
          <span>/</span>
          <span className="text-white font-bold">SMARTER</span>
          <span>/</span>
          <span className="text-fuchsia-400 font-bold">TOGETHER</span>
        </div>
        <div className="text-cyan-400 font-ui font-black tracking-widest">
          VOID-RIDER 3D // COSMIC RACING NEXUS
        </div>
      </div>
    </div>
  );
};
