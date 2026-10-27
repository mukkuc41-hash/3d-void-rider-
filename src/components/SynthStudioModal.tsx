import React, { useEffect, useState } from 'react';
import {
  Music,
  Play,
  Pause,
  X,
  Sliders,
  Sparkles,
  Check,
  Disc,
  Radio,
} from 'lucide-react';
import { synthStudioEngine } from '../game/synthEngine';
import { SynthScaleType } from '../types';

interface SynthStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SynthStudioModal: React.FC<SynthStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(synthStudioEngine.state.isPlaying);
  const [bpm, setBpm] = useState<number>(synthStudioEngine.state.bpm);
  const [scale, setScale] = useState<SynthScaleType>(synthStudioEngine.state.scale);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isBgmSet, setIsBgmSet] = useState<boolean>(synthStudioEngine.state.isCustomBgmActive);
  const [, setRerender] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const poll = () => {
      animId = requestAnimationFrame(poll);
      setActiveStep(synthStudioEngine.currentStep);
      setIsPlaying(synthStudioEngine.state.isPlaying);
    };
    animId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    synthStudioEngine.togglePlay();
    setIsPlaying(synthStudioEngine.state.isPlaying);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    synthStudioEngine.state.bpm = newBpm;
  };

  const handleScaleChange = (newScale: SynthScaleType) => {
    setScale(newScale);
    synthStudioEngine.state.scale = newScale;
  };

  const handleToggleStep = (track: 'bassSteps' | 'leadSteps' | 'percSteps' | 'chordSteps', stepIdx: number) => {
    synthStudioEngine.state[track][stepIdx] = !synthStudioEngine.state[track][stepIdx];
    setRerender((r) => r + 1);
  };

  const handlePreset = (presetName: 'CYBER_DRIVE' | 'NEON_SUNSET' | 'MIDNIGHT_RUN' | 'SINGULARITY') => {
    synthStudioEngine.setPreset(presetName);
    setBpm(synthStudioEngine.state.bpm);
    setScale(synthStudioEngine.state.scale);
    setRerender((r) => r + 1);
  };

  const handleSetBgm = () => {
    const active = synthStudioEngine.toggleCustomBgm();
    setIsBgmSet(active);
  };

  const tracks: { key: 'bassSteps' | 'leadSteps' | 'percSteps' | 'chordSteps'; label: string; color: string }[] = [
    { key: 'leadSteps', label: 'NEON LEAD [SQR]', color: '#00f0ff' },
    { key: 'chordSteps', label: 'WARP CHORDS [PAD]', color: '#10b981' },
    { key: 'bassSteps', label: 'SUB BASSLINE [SAW]', color: '#a855f7' },
    { key: 'percSteps', label: 'HYPER PERCUSSION', color: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/30 flex flex-col max-h-[92vh] shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-ui font-black uppercase tracking-widest text-white flex items-center gap-2">
                SYNTHWAVE SEQUENCER // COCKPIT BGM STUDIO
              </h2>
              <span className="text-xs font-mono text-slate-400">
                16-STEP ALGORITHMIC SYNTH ENGINE // WEB AUDIO SYNTHESIS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Top Control Bar: Play, BPM, Scales, Presets */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-900/70 border border-white/10">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-5 py-2.5 font-ui font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-black" />}
              {isPlaying ? 'PAUSE SYNTH' : 'PLAY SEQUENCE'}
            </button>

            {/* BPM Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">TEMPO:</span>
              <input
                type="range"
                min="90"
                max="175"
                value={bpm}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-28 accent-cyan-400 h-1.5 bg-slate-800 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-cyan-400 min-w-[50px]">
                {bpm} BPM
              </span>
            </div>

            {/* Scale Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">SCALE:</span>
              {(['CYBER_DORIAN', 'NEON_MINOR', 'SYNTH_MAJOR', 'VOID_PHRYGIAN'] as SynthScaleType[]).map((sc) => (
                <button
                  key={sc}
                  onClick={() => handleScaleChange(sc)}
                  className={`px-2 py-1 text-[10px] font-mono cursor-pointer transition-all ${
                    scale === sc
                      ? 'bg-purple-600 text-white font-bold border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {sc.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mr-2">
              PRESETS:
            </span>
            {[
              { id: 'CYBER_DRIVE', label: 'CYBER DRIVE (132 BPM)' },
              { id: 'NEON_SUNSET', label: 'NEON SUNSET (116 BPM)' },
              { id: 'MIDNIGHT_RUN', label: 'MIDNIGHT RUN (144 BPM)' },
              { id: 'SINGULARITY', label: 'VOID SINGULARITY (150 BPM)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id as any)}
                className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white text-[11px] font-mono cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 16-Step Grid */}
          <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-white/10">
            {/* Step Counter Indicator */}
            <div className="flex items-center pl-36 gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center font-mono text-[9px] py-0.5 rounded transition-colors ${
                    activeStep === i && isPlaying
                      ? 'bg-cyan-400 text-black font-black shadow-[0_0_8px_#00f0ff]'
                      : i % 4 === 0
                      ? 'text-white font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Tracks */}
            {tracks.map((track) => {
              const stepArray = synthStudioEngine.state[track.key];
              return (
                <div key={track.key} className="flex items-center gap-3">
                  <span
                    className="w-32 text-xs font-mono font-bold uppercase truncate"
                    style={{ color: track.color }}
                  >
                    {track.label}
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    {stepArray.map((active, stepIdx) => {
                      const isCurrentPlayingStep = activeStep === stepIdx && isPlaying;
                      return (
                        <button
                          key={stepIdx}
                          onClick={() => handleToggleStep(track.key, stepIdx)}
                          className={`flex-1 h-9 rounded-[2px] transition-all cursor-pointer ${
                            active
                              ? isCurrentPlayingStep
                                ? 'brightness-150 scale-105 shadow-[0_0_12px_#ffffff]'
                                : 'shadow-md opacity-90 hover:opacity-100'
                              : isCurrentPlayingStep
                              ? 'bg-slate-700/80'
                              : stepIdx % 4 === 0
                              ? 'bg-slate-850 hover:bg-slate-800'
                              : 'bg-slate-900 hover:bg-slate-800'
                          }`}
                          style={{
                            backgroundColor: active ? track.color : undefined,
                            border: isCurrentPlayingStep ? '1px solid white' : '1px solid rgba(255,255,255,0.05)',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Set as In-Race Cockpit BGM Toggle */}
          <div className="flex items-center justify-between p-4 bg-purple-950/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Radio className={`w-5 h-5 ${isBgmSet ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-ui font-black uppercase tracking-wider text-purple-300">
                  IN-RACE COCKPIT BGM ROUTING
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Play this custom algorithmic synthwave loop during all gameplay races.
                </span>
              </div>
            </div>

            <button
              onClick={handleSetBgm}
              className={`flex items-center gap-1.5 px-4 py-2 font-ui font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isBgmSet
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900 border border-white/20 text-slate-300 hover:text-white'
              }`}
            >
              {isBgmSet ? <Check className="w-4 h-4" /> : null}
              {isBgmSet ? 'CUSTOM BGM ACTIVE' : 'SET AS BGM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
