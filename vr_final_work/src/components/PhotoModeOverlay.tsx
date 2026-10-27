import React from 'react';
import {
  Camera,
  Download,
  RotateCcw,
  X,
  Maximize2,
  Sliders,
  Sparkles,
  Layers,
  Eye,
} from 'lucide-react';
import { PhotoFilterType, PhotoModeSettings } from '../types';

interface PhotoModeOverlayProps {
  settings: PhotoModeSettings;
  onUpdateSettings: (newSettings: Partial<PhotoModeSettings>) => void;
  onCapture: () => void;
  onClose: () => void;
  shipName?: string;
  speedKmh?: number;
}

export const PhotoModeOverlay: React.FC<PhotoModeOverlayProps> = ({
  settings,
  onUpdateSettings,
  onCapture,
  onClose,
  shipName = 'VORTEX NEMESIS',
  speedKmh = 840,
}) => {
  const filters: { id: PhotoFilterType; label: string; desc: string }[] = [
    { id: 'NORMAL', label: 'True Lensed', desc: 'Natural space optics' },
    { id: 'CYBERPUNK', label: 'Neon Cyber', desc: 'Intense cyan & magenta contrast' },
    { id: 'VOID_NOIR', label: 'Void Noir', desc: 'Monochromatic relativistic stark' },
    { id: 'STELLAR_FLARE', label: 'Solar Flare', desc: 'Hyper-saturated solar glow' },
    { id: 'CRT_SCANLINE', label: 'Retro 80s CRT', desc: 'Phosphor cathode tube raster' },
    { id: 'EMERALD_MATRIX', label: 'Matrix Grid', desc: 'Deep terminal emerald' },
  ];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Visual Filter Overlays */}
      {settings.filter === 'CYBERPUNK' && (
        <div className="absolute inset-0 pointer-events-none mix-blend-color-dodge bg-gradient-to-tr from-cyan-500/20 via-transparent to-fuchsia-500/20" />
      )}
      {settings.filter === 'VOID_NOIR' && (
        <div className="absolute inset-0 pointer-events-none backdrop-grayscale backdrop-contrast-125" />
      )}
      {settings.filter === 'STELLAR_FLARE' && (
        <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-amber-500/15" />
      )}
      {settings.filter === 'CRT_SCANLINE' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, transparent 2px, transparent 4px)',
          }}
        />
      )}
      {settings.filter === 'EMERALD_MATRIX' && (
        <div className="absolute inset-0 pointer-events-none mix-blend-color-burn bg-emerald-950/25" />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 border border-cyan-500/30">
          <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              STUDIO PHOTO SUITE // FREE ORBIT
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>TIME FREEZE ACTIVE</span>
              <span aria-hidden="true">·</span>
              <span>360° ORBIT CAM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCapture}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-ui font-black tracking-widest text-xs uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CAPTURE 4K WALLPAPER
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-900/90 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Resume Race"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Framing Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border border-white/10 relative">
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-8 h-8 border border-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Optional Telemetry Watermark in View */}
      {settings.showTelemetryWatermark && (
        <div className="absolute bottom-28 left-6 pointer-events-none flex flex-col font-mono text-xs">
          <span className="text-cyan-400 font-bold tracking-[0.25em] text-sm drop-shadow-[0_0_8px_#00f0ff]">
            VOID-RIDER 3D
          </span>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
            <span>CRAFT: {shipName}</span>
            <span aria-hidden="true">·</span>
            <span>VELOCITY: {Math.round(speedKmh)} KM/H</span>
            <span aria-hidden="true">·</span>
            <span>FOV: {settings.fov}°</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Deck */}
      <div className="pointer-events-auto w-full max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-xl border border-white/10 p-4 shadow-2xl flex flex-col gap-3">
        {/* Sliders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* FOV */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>FIELD OF VIEW</span>
              <span className="text-cyan-400 font-bold">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="25"
              max="110"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: Number(e.target.value) })}
              className="accent-cyan-400 h-1 bg-slate-800 cursor-pointer"
            />
          </div>

          {/* Orbit Yaw */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>ORBIT ANGLE</span>
              <span className="text-cyan-400 font-bold">{settings.orbitYaw}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={settings.orbitYaw}
              onChange={(e) => onUpdateSettings({ orbitYaw: Number(e.target.value) })}
              className="accent-cyan-400 h-1 bg-slate-800 cursor-pointer"
            />
          </div>

          {/* Orbit Pitch */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>ELEVATION</span>
              <span className="text-cyan-400 font-bold">{settings.orbitPitch}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="75"
              value={settings.orbitPitch}
              onChange={(e) => onUpdateSettings({ orbitPitch: Number(e.target.value) })}
              className="accent-cyan-400 h-1 bg-slate-800 cursor-pointer"
            />
          </div>

          {/* Distance */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>CAMERA ZOOM</span>
              <span className="text-cyan-400 font-bold">{settings.orbitDistance}M</span>
            </div>
            <input
              type="range"
              min="4"
              max="35"
              value={settings.orbitDistance}
              onChange={(e) => onUpdateSettings({ orbitDistance: Number(e.target.value) })}
              className="accent-cyan-400 h-1 bg-slate-800 cursor-pointer"
            />
          </div>
        </div>

        {/* Visual Filters Selector */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mr-2">
              LENS FILTER:
            </span>
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdateSettings({ filter: f.id })}
                className={`px-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer ${
                  settings.filter === f.id
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTelemetryWatermark}
                onChange={(e) => onUpdateSettings({ showTelemetryWatermark: e.target.checked })}
                className="accent-cyan-400"
              />
              WATERMARK
            </label>
            <button
              onClick={() =>
                onUpdateSettings({
                  fov: 65,
                  orbitYaw: 0,
                  orbitPitch: 15,
                  orbitDistance: 12,
                  roll: 0,
                  filter: 'NORMAL',
                })
              }
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
