import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  Sparkles,
  X,
  RotateCcw,
  Monitor,
  Camera,
  ShieldAlert,
  Zap,
  Sliders,
  Move,
  Layout,
  Gauge,
  Radio,
} from 'lucide-react';
import { sound } from '../game/audio';
import { CameraMode, GraphicsQuality, PlayerCollisionConfig } from '../types';
import { TelemetryLayoutEditor } from './layout/TelemetryLayoutEditor';
import { HUDLayoutEditor } from './layout/HUDLayoutEditor';

export type SettingsTab = 'COSMIC_TELEMETRY' | 'AV_HUD';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  cameraShakeEnabled: boolean;
  onToggleCameraShake: (enabled: boolean) => void;
  graphicsQuality: GraphicsQuality;
  onSelectGraphicsQuality: (quality: GraphicsQuality) => void;
  collisionConfig?: PlayerCollisionConfig;
  onUpdateCollisionConfig?: (config: Partial<PlayerCollisionConfig>) => void;
  initialTab?: SettingsTab;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentCameraMode,
  onSelectCameraMode,
  cameraShakeEnabled,
  onToggleCameraShake,
  graphicsQuality,
  onSelectGraphicsQuality,
  collisionConfig,
  onUpdateCollisionConfig,
  initialTab = 'COSMIC_TELEMETRY',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isEditingLayout, setIsEditingLayout] = useState<boolean>(false);

  // Audio state
  const [sfxVolume, setSfxVolume] = useState<number>(Math.round(sound.sfxVolume * 100));
  const [musicVolume, setMusicVolume] = useState<number>(Math.round(sound.musicVolume * 100));
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  if (!isOpen) return null;

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    sound.setSFXVolume(val / 100);
  };

  const handleMusicChange = (val: number) => {
    setMusicVolume(val);
    sound.setMusicVolume(val / 100);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.toggleMute(next);
  };

  // If currently in Layout Editor mode, render dedicated full-canvas editor
  if (isEditingLayout) {
    if (activeTab === 'COSMIC_TELEMETRY') {
      return (
        <TelemetryLayoutEditor
          currentCameraMode={currentCameraMode}
          onSelectCameraMode={onSelectCameraMode}
          cameraShakeEnabled={cameraShakeEnabled}
          onToggleCameraShake={onToggleCameraShake}
          graphicsQuality={graphicsQuality}
          onSelectGraphicsQuality={onSelectGraphicsQuality}
          collisionConfig={collisionConfig}
          onUpdateCollisionConfig={onUpdateCollisionConfig}
          onExit={() => setIsEditingLayout(false)}
        />
      );
    } else {
      return (
        <HUDLayoutEditor
          onExit={() => setIsEditingLayout(false)}
        />
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.18)] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header & Tabs */}
        <div className="flex flex-col gap-3 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-ui font-black uppercase tracking-wider text-white">
                {activeTab === 'COSMIC_TELEMETRY' ? 'COSMIC FLIGHT TELEMETRY' : 'AV & FLIGHT HUD SETTINGS'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {activeTab === 'COSMIC_TELEMETRY'
                  ? 'Configure optics, acoustic output, and physical collision dynamics'
                  : 'Customize audio-visual output and in-flight cockpit HUD telemetry layout'}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playMenuClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & EDIT LAYOUT Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Screen Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
              <button
                onClick={() => {
                  sound.playMenuClick();
                  setActiveTab('COSMIC_TELEMETRY');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'COSMIC_TELEMETRY'
                    ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>COSMIC TELEMETRY</span>
              </button>

              <button
                onClick={() => {
                  sound.playMenuClick();
                  setActiveTab('AV_HUD');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'AV_HUD'
                    ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>AV & HUD LAYOUT</span>
              </button>
            </div>

            {/* Clearly Visible EDIT LAYOUT Button */}
            <button
              onClick={() => {
                sound.playMenuClick();
                setIsEditingLayout(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-400 text-cyan-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all cursor-pointer active:scale-95"
              title={`Open interactive Layout Editor for ${activeTab === 'COSMIC_TELEMETRY' ? 'Cosmic Telemetry' : 'AV & HUD'}`}
            >
              <Layout className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>EDIT LAYOUT</span>
            </button>
          </div>
        </div>

        {/* Tab 1: COSMIC FLIGHT TELEMETRY CONTENT */}
        {activeTab === 'COSMIC_TELEMETRY' && (
          <div className="mt-5 space-y-5 animate-fadeIn">
            {/* Audio Systems */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> ACOUSTIC SYNTHESIZER
                </span>
                <button
                  onClick={handleToggleMute}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                      : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  }`}
                >
                  {isMuted ? 'UNMUTE ALL' : 'MUTE ALL'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">SFX & THRUSTER RESONANCE</span>
                  <span className="text-cyan-400 font-bold">{sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sfxVolume}
                  onChange={e => handleSfxChange(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">SYNTHWAVE & COSMIC HARMONICS</span>
                  <span className="text-cyan-400 font-bold">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={musicVolume}
                  onChange={e => handleMusicChange(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Camera System Mode */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" /> FLIGHT PERSPECTIVE & CAMERA
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CHASE_NEAR', 'CHASE_FAR', 'COCKPIT', 'WHOLE_BLACK_HOLE'] as CameraMode[]).map(mode => {
                  const isSel = currentCameraMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectCameraMode(mode);
                      }}
                      className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSel
                          ? 'border-purple-400 bg-purple-950/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-ui font-black uppercase tracking-tight">
                        {mode === 'WHOLE_BLACK_HOLE' ? 'WHOLE BLACK HOLE' : mode.replace('_', ' ')}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-slate-300">CAMERA SHAKE FX</span>
                  <span className="text-[10px] text-slate-400">Dynamic G-force vibrations on boost & impacts</span>
                </div>
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onToggleCameraShake(!cameraShakeEnabled);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    cameraShakeEnabled
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}
                >
                  {cameraShakeEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>

            {/* Graphics Fidelity */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> GRAPHICS FIDELITY & RESOLUTION
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map(qual => {
                  const isSel = graphicsQuality === qual;
                  return (
                    <button
                      key={qual}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectGraphicsQuality(qual);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSel
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_#00f0ff]'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-ui font-black uppercase">{qual}</div>
                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {qual === 'LOW' ? '1.0x RES' : qual === 'MEDIUM' ? '1.25x RES' : 'RETINA 2.0x'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player & AI Spacecraft Collision Dynamics */}
            {collisionConfig && onUpdateCollisionConfig && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-1 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-pink-400" /> SPACECRAFT COLLISION DYNAMICS
                </span>
                <p className="text-[10px] text-slate-400 mb-3">
                  Dedicated Player & AI physical collision response, knockback torque, and crash thresholds.
                </p>

                {/* Crash Threshold Preset */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                    <span>CRASH THRESHOLD</span>
                    <span className="text-pink-400 font-bold">{collisionConfig.crashThreshold.toFixed(1)} FORCE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'CASUAL', value: 12.0, sub: 'Rare Crashes' },
                      { label: 'ARCADE', value: 8.0, sub: 'Balanced' },
                      { label: 'HARDCORE', value: 5.5, sub: 'Punishing' },
                    ].map(preset => {
                      const isSel = Math.abs(collisionConfig.crashThreshold - preset.value) < 0.5;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateCollisionConfig({ crashThreshold: preset.value });
                          }}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? 'border-pink-500 bg-pink-950/40 text-pink-300 shadow-[0_0_10px_rgba(255,0,128,0.3)]'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-ui font-black uppercase">{preset.label}</div>
                          <div className="text-[8px] font-mono text-slate-400">{preset.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Knockback Impulse Multiplier */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                    <span>KNOCKBACK IMPULSE</span>
                    <span className="text-cyan-400 font-bold">{collisionConfig.knockbackMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'LIGHT', val: 0.75 },
                      { label: 'BALANCED', val: 1.0 },
                      { label: 'HEAVY', val: 1.35 },
                    ].map(kb => {
                      const isSel = Math.abs(collisionConfig.knockbackMultiplier - kb.val) < 0.1;
                      return (
                        <button
                          key={kb.label}
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateCollisionConfig({ knockbackMultiplier: kb.val });
                          }}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_#00f0ff]'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[10px] font-ui font-black uppercase">{kb.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AV / AUDIO-VISUAL & HUD TELEMETRY CONTENT */}
        {activeTab === 'AV_HUD' && (
          <div className="mt-5 space-y-5 animate-fadeIn">
            {/* AV System Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Gauge className="w-4 h-4" /> IN-FLIGHT HUD TELEMETRY WIDGETS
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">7 ACTIVE MODULES</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reposition, resize, or snap in-flight HUD widgets (Tachometer, Quantum Countdown Pod, Sector Radar, Cockpit Visor, Tactical Action Deck) to fit your preferred cockpit layout.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>COCKPIT VISOR // TIMER</span>
                  <span className="text-cyan-400 font-bold">RESIZABLE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>DIGITAL TACHOMETER & VITALS</span>
                  <span className="text-cyan-400 font-bold">RESIZABLE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>SECTOR RADAR // MINIMAP</span>
                  <span className="text-cyan-400 font-bold">RESIZABLE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>TACTICAL ACTION DECK</span>
                  <span className="text-cyan-400 font-bold">RESIZABLE</span>
                </div>
              </div>

              {/* Direct Launch Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setIsEditingLayout(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00f0ff] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Move className="w-4 h-4" /> LAUNCH HUD LAYOUT EDITOR
                </button>
              </div>
            </div>

            {/* Audio Synthesis Shortcut */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> ACOUSTIC SYNTHESIZER LEVELS
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 mb-1">SFX RESONANCE</div>
                  <div className="text-lg font-black text-cyan-300">{sfxVolume}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 mb-1">SYNTHWAVE HARMONICS</div>
                  <div className="text-lg font-black text-cyan-300">{musicVolume}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 tracking-wider">
            <span className="text-amber-400 font-bold">★ OWNER: ADITYA</span>
            <span className="text-cyan-500/40">//</span>
            <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent font-bold">
              MADE IN INDIA 🇮🇳
            </span>
          </div>
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00f0ff] transition-all cursor-pointer"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
