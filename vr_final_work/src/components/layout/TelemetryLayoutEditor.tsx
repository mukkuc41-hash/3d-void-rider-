import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Camera, Monitor, ShieldAlert, Sparkles } from 'lucide-react';
import { sound } from '../../game/audio';
import { CameraMode, GraphicsQuality, PlayerCollisionConfig } from '../../types';
import { ElementLayout } from '../../game/layout/layoutTypes';
import {
  DEFAULT_COSMIC_TELEMETRY_LAYOUT,
  loadScreenLayout,
  saveScreenLayout,
  resetScreenLayout,
} from '../../game/layout/layoutStorage';
import { LayoutElementWrapper } from './LayoutElementWrapper';
import { LayoutEditorToolbar } from './LayoutEditorToolbar';

interface TelemetryLayoutEditorProps {
  currentCameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  cameraShakeEnabled: boolean;
  onToggleCameraShake: (enabled: boolean) => void;
  graphicsQuality: GraphicsQuality;
  onSelectGraphicsQuality: (quality: GraphicsQuality) => void;
  collisionConfig?: PlayerCollisionConfig;
  onUpdateCollisionConfig?: (config: Partial<PlayerCollisionConfig>) => void;
  onExit: () => void;
}

export const TelemetryLayoutEditor: React.FC<TelemetryLayoutEditorProps> = ({
  currentCameraMode,
  onSelectCameraMode,
  cameraShakeEnabled,
  onToggleCameraShake,
  graphicsQuality,
  onSelectGraphicsQuality,
  collisionConfig,
  onUpdateCollisionConfig,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 750 });

  const [layouts, setLayouts] = useState<Record<string, ElementLayout>>(() => {
    return loadScreenLayout('COSMIC_TELEMETRY', DEFAULT_COSMIC_TELEMETRY_LAYOUT).elements;
  });

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize] = useState<number>(16);
  const [selectedId, setSelectedId] = useState<string>('panel_acoustic');
  const [history, setHistory] = useState<Array<Record<string, ElementLayout>>>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audio controls state for interactive preview
  const [sfxVolume, setSfxVolume] = useState<number>(Math.round(sound.sfxVolume * 100));
  const [musicVolume, setMusicVolume] = useState<number>(Math.round(sound.musicVolume * 100));
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Measure container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(320, rect.width),
          height: Math.max(500, rect.height),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleLayoutChange = (updated: ElementLayout, recordHistory: boolean = false) => {
    if (recordHistory) {
      setHistory(prev => [...prev.slice(-15), { ...layouts }]);
    }
    setLayouts(prev => ({
      ...prev,
      [updated.id]: updated,
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setLayouts(previous);
    showToast('Reverted to previous layout step');
  };

  const handleSave = () => {
    const success = saveScreenLayout('COSMIC_TELEMETRY', layouts, snapToGrid, gridSize);
    if (success) {
      showToast('Cosmic Telemetry layout saved to local storage');
    } else {
      showToast('Error saving layout to local storage');
    }
  };

  const handleReset = () => {
    resetScreenLayout('COSMIC_TELEMETRY');
    setLayouts({ ...DEFAULT_COSMIC_TELEMETRY_LAYOUT });
    setHistory([]);
    showToast('Factory layout defaults restored');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-lg select-none overflow-hidden animate-fadeIn">
      {/* Top Header & Editor Toolbar */}
      <div className="p-3 sm:p-4 shrink-0 border-b border-cyan-500/20 bg-slate-950/90 z-50">
        <LayoutEditorToolbar
          screenTitle="COSMIC FLIGHT TELEMETRY"
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          canUndo={history.length > 0}
          onToggleSnap={() => setSnapToGrid(prev => !prev)}
          onUndo={handleUndo}
          onReset={handleReset}
          onSave={handleSave}
          onExit={onExit}
          statusMessage={statusMessage}
        />
      </div>

      {/* Main Interactive Layout Canvas */}
      <div
        ref={containerRef}
        onClick={() => setSelectedId('')}
        className="relative flex-1 w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#071328] via-[#030814] to-black"
        style={{
          backgroundImage: snapToGrid
            ? 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 1px, transparent 1px)'
            : 'none',
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      >
        {/* Subtle Canvas Watermark & Instruction */}
        <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-400/40 pointer-events-none uppercase tracking-widest">
          CANVAS: {Math.round(containerSize.width)}×{Math.round(containerSize.height)}PX // DRAG MOVE GRIP // CORNER RESIZE
        </div>

        {/* 1. ACOUSTIC SYNTHESIZER PANEL */}
        {layouts.panel_acoustic && (
          <LayoutElementWrapper
            layout={layouts.panel_acoustic}
            isSelected={selectedId === 'panel_acoustic'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="p-4 rounded-b-2xl bg-slate-900/90 border-x border-b border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> ACOUSTIC SYNTHESIZER
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const next = !isMuted;
                    setIsMuted(next);
                    sound.toggleMute(next);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
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
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setSfxVolume(val);
                    sound.setSFXVolume(val / 100);
                  }}
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
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setMusicVolume(val);
                    sound.setMusicVolume(val / 100);
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 2. FLIGHT PERSPECTIVE & CAMERA PANEL */}
        {layouts.panel_camera && (
          <LayoutElementWrapper
            layout={layouts.panel_camera}
            isSelected={selectedId === 'panel_camera'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="p-4 rounded-b-2xl bg-slate-900/90 border-x border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" /> FLIGHT PERSPECTIVE & CAMERA
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CHASE_NEAR', 'CHASE_FAR', 'COCKPIT', 'WHOLE_BLACK_HOLE'] as CameraMode[]).map(mode => {
                  const isSel = currentCameraMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={e => {
                        e.stopPropagation();
                        sound.playMenuClick();
                        onSelectCameraMode(mode);
                      }}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
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
                  onClick={e => {
                    e.stopPropagation();
                    sound.playMenuClick();
                    onToggleCameraShake(!cameraShakeEnabled);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                    cameraShakeEnabled
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}
                >
                  {cameraShakeEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 3. GRAPHICS FIDELITY & RESOLUTION PANEL */}
        {layouts.panel_graphics && (
          <LayoutElementWrapper
            layout={layouts.panel_graphics}
            isSelected={selectedId === 'panel_graphics'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="p-4 rounded-b-2xl bg-slate-900/90 border-x border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> GRAPHICS FIDELITY & RESOLUTION
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map(qual => {
                  const isSel = graphicsQuality === qual;
                  return (
                    <button
                      key={qual}
                      onClick={e => {
                        e.stopPropagation();
                        sound.playMenuClick();
                        onSelectGraphicsQuality(qual);
                      }}
                      className={`py-2 px-3 rounded-xl border text-center transition-all ${
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
          </LayoutElementWrapper>
        )}

        {/* 4. SPACECRAFT COLLISION DYNAMICS PANEL */}
        {layouts.panel_collision && (
          <LayoutElementWrapper
            layout={layouts.panel_collision}
            isSelected={selectedId === 'panel_collision'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="p-4 rounded-b-2xl bg-slate-900/90 border-x border-b border-slate-800">
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
                  <span className="text-pink-400 font-bold">
                    {collisionConfig ? collisionConfig.crashThreshold.toFixed(1) : '8.0'} FORCE
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'CASUAL', value: 12.0, sub: 'Rare Crashes' },
                    { label: 'ARCADE', value: 8.0, sub: 'Balanced' },
                    { label: 'HARDCORE', value: 5.5, sub: 'Punishing' },
                  ].map(preset => {
                    const isSel = collisionConfig
                      ? Math.abs(collisionConfig.crashThreshold - preset.value) < 0.5
                      : preset.label === 'ARCADE';
                    return (
                      <button
                        key={preset.label}
                        onClick={e => {
                          e.stopPropagation();
                          sound.playMenuClick();
                          onUpdateCollisionConfig?.({ crashThreshold: preset.value });
                        }}
                        className={`py-2 px-2 rounded-xl border text-center transition-all ${
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
                  <span className="text-cyan-400 font-bold">
                    {collisionConfig ? collisionConfig.knockbackMultiplier.toFixed(2) : '1.00'}x
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'LIGHT', val: 0.75 },
                    { label: 'BALANCED', val: 1.0 },
                    { label: 'HEAVY', val: 1.35 },
                  ].map(kb => {
                    const isSel = collisionConfig
                      ? Math.abs(collisionConfig.knockbackMultiplier - kb.val) < 0.1
                      : kb.label === 'BALANCED';
                    return (
                      <button
                        key={kb.label}
                        onClick={e => {
                          e.stopPropagation();
                          sound.playMenuClick();
                          onUpdateCollisionConfig?.({ knockbackMultiplier: kb.val });
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
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
          </LayoutElementWrapper>
        )}

        {/* 5. SYSTEM SIGNATURE & ACTIONS PANEL */}
        {layouts.panel_signature && (
          <LayoutElementWrapper
            layout={layouts.panel_signature}
            isSelected={selectedId === 'panel_signature'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="p-3.5 rounded-b-2xl bg-slate-950/95 border-x border-b border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 tracking-wider">
                <span className="text-amber-400 font-bold">★ OWNER: ADITYA</span>
                <span className="text-cyan-500/40">//</span>
                <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent font-bold">
                  MADE IN INDIA 🇮🇳
                </span>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  sound.playMenuClick();
                  handleSave();
                  onExit();
                }}
                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_15px_#00f0ff] transition-all cursor-pointer"
              >
                CONFIRM & EXIT
              </button>
            </div>
          </LayoutElementWrapper>
        )}
      </div>
    </div>
  );
};
