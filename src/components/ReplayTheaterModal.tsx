import React, { useEffect, useState } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Camera,
  X,
  Sliders,
  Tv,
  Eye,
} from 'lucide-react';
import { replaySystem } from '../game/replaySystem';
import { ReplayCameraMode } from '../types';

interface ReplayTheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReplayTheaterModal: React.FC<ReplayTheaterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentMs, setCurrentMs] = useState<number>(0);
  const [totalMs, setTotalMs] = useState<number>(60000);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<ReplayCameraMode>('BROADCAST_TV');

  useEffect(() => {
    if (!isOpen) return;

    replaySystem.startPlayback();
    setIsPlaying(true);

    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const telem = replaySystem.update(dt);
      setCurrentMs(telem.currentMs);
      setTotalMs(telem.totalMs);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      replaySystem.pausePlayback();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      replaySystem.pausePlayback();
      setIsPlaying(false);
    } else {
      replaySystem.resumePlayback();
      setIsPlaying(true);
    }
  };

  const handleSeek = (newMs: number) => {
    replaySystem.seek(newMs);
    setCurrentMs(newMs);
  };

  const handleSetSpeed = (s: number) => {
    replaySystem.playbackSpeed = s;
    setSpeedMultiplier(s);
  };

  const handleSetCamera = (mode: ReplayCameraMode) => {
    replaySystem.cameraMode = mode;
    setCameraMode(mode);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const h = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${h.toString().padStart(2, '0')}`;
  };

  const cameraOptions: { id: ReplayCameraMode; label: string; desc: string }[] = [
    { id: 'BROADCAST_TV', label: 'TV DIRECTOR', desc: 'Auto trackside broadcast cuts' },
    { id: 'DRONE_CHASE', label: 'CHASE DRONE', desc: 'Dynamic aerial tracking' },
    { id: 'NOSE_CAM', label: 'NOSE CAM', desc: 'Bumper-level high velocity' },
    { id: 'CURB_FLYBY', label: 'CURB FLYBY', desc: 'Low-angle apex sweep' },
    { id: 'ORBITAL_SWEEP', label: 'ORBITAL', desc: '360° cinematic rotation' },
  ];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      {/* Top Header & TV Badge */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-4 py-2 border border-purple-500/30">
          <Tv className="w-5 h-5 text-purple-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-ui font-black uppercase tracking-widest text-purple-300 flex items-center gap-2">
              VOID-RIDER REPLAY THEATER // BROADCAST
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>CAMERA: {cameraMode}</span>
              <span aria-hidden="true">·</span>
              <span>RATE: {speedMultiplier}x</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-slate-900/90 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center TV Framing Graticule */}
      <div className="absolute inset-x-8 top-16 bottom-28 pointer-events-none border border-white/5 flex items-center justify-center">
        <span className="absolute top-2 left-3 font-mono text-[10px] text-purple-400/60 uppercase">
          [REC DIRECT PLAYBACK] // 60FPS SYNCHRONIZED
        </span>
      </div>

      {/* Bottom Playback & Camera Control Deck */}
      <div className="pointer-events-auto w-full max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-xl border border-white/10 p-4 shadow-2xl flex flex-col gap-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
          <span className="text-cyan-400 font-bold min-w-[55px]">{formatTime(currentMs)}</span>
          <input
            type="range"
            min="0"
            max={totalMs}
            value={currentMs}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 accent-purple-400 h-1.5 bg-slate-800 cursor-pointer"
          />
          <span className="text-slate-500 min-w-[55px] text-right">{formatTime(totalMs)}</span>
        </div>

        {/* Action Controls & Camera Modes */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2 flex-wrap gap-2">
          {/* Play/Pause & Speed Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSeek(0)}
              className="p-2 bg-slate-900 border border-white/10 hover:border-white/30 text-slate-300 cursor-pointer"
              title="Rewind to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-ui font-black text-xs uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            {/* Speed multipliers */}
            <div className="flex items-center gap-1 ml-2">
              {[0.25, 0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSetSpeed(s)}
                  className={`px-2 py-1 text-[11px] font-mono cursor-pointer transition-colors ${
                    speedMultiplier === s
                      ? 'bg-purple-500/30 text-purple-300 font-bold border border-purple-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Camera Selectors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mr-1">
              TV CAM:
            </span>
            {cameraOptions.map((cam) => (
              <button
                key={cam.id}
                onClick={() => handleSetCamera(cam.id)}
                className={`px-2.5 py-1 text-[11px] font-mono cursor-pointer transition-all ${
                  cameraMode === cam.id
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={cam.desc}
              >
                {cam.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
