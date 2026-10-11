import React, { useState, useRef, useEffect } from 'react';
import {
  HeartPulse,
  Map,
  Layers,
  Camera,
  Pause,
  Rocket,
  ShieldCheck,
  Zap,
  Wind,
  ChevronsDown,
  ChevronsUp,
  Thermometer,
  RotateCcw,
} from 'lucide-react';
import { ElementLayout } from '../../game/layout/layoutTypes';
import {
  DEFAULT_AV_HUD_LAYOUT,
  loadScreenLayout,
  saveScreenLayout,
  resetScreenLayout,
} from '../../game/layout/layoutStorage';
import { LayoutElementWrapper } from './LayoutElementWrapper';
import { LayoutEditorToolbar } from './LayoutEditorToolbar';

interface HUDLayoutEditorProps {
  onExit: () => void;
}

export const HUDLayoutEditor: React.FC<HUDLayoutEditorProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  const [layouts, setLayouts] = useState<Record<string, ElementLayout>>(() => {
    return loadScreenLayout('AV_HUD', DEFAULT_AV_HUD_LAYOUT).elements;
  });

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize] = useState<number>(16);
  const [selectedId, setSelectedId] = useState<string>('hud_speed_vitals');
  const [history, setHistory] = useState<Array<Record<string, ElementLayout>>>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Simulated live telemetry state for realistic preview
  const [simSpeed, setSimSpeed] = useState<number>(482);
  const [simHull, setSimHull] = useState<number>(92);
  const [simBoost, setSimBoost] = useState<number>(75);
  const [simHeat, setSimHeat] = useState<number>(340);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

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
    const success = saveScreenLayout('AV_HUD', layouts, snapToGrid, gridSize);
    if (success) {
      showToast('AV & Flight HUD layout saved to local storage');
    } else {
      showToast('Error saving HUD layout to local storage');
    }
  };

  const handleReset = () => {
    resetScreenLayout('AV_HUD');
    setLayouts({ ...DEFAULT_AV_HUD_LAYOUT });
    setHistory([]);
    showToast('HUD layout defaults restored');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-lg select-none overflow-hidden animate-fadeIn">
      {/* Top Header & Editor Toolbar */}
      <div className="p-3 sm:p-4 shrink-0 border-b border-cyan-500/20 bg-slate-950/90 z-50">
        <LayoutEditorToolbar
          screenTitle="AV & FLIGHT HUD TELEMETRY"
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

      {/* Main Interactive HUD Simulator Canvas */}
      <div
        ref={containerRef}
        onClick={() => setSelectedId('')}
        className="relative flex-1 w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#031326] via-[#020712] to-black"
        style={{
          backgroundImage: snapToGrid
            ? 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 1px, transparent 1px)'
            : 'none',
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      >
        {/* Deep Space Background Visual Sim */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_40%,rgba(0,240,255,0.18)_0%,transparent_60%)]" />

        {/* Canvas Info Watermark */}
        <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-400/40 pointer-events-none uppercase tracking-widest">
          COCKPIT HUD CANVAS: {Math.round(containerSize.width)}×{Math.round(containerSize.height)}PX // LIVE TELEMETRY SIMULATION
        </div>

        {/* 1. COCKPIT VISOR BAR */}
        {layouts.hud_cockpit_visor && (
          <LayoutElementWrapper
            layout={layouts.hud_cockpit_visor}
            isSelected={selectedId === 'hud_cockpit_visor'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="w-full flex items-center justify-between gap-2 bg-[#030712]/92 border-x border-b border-cyan-500/35 rounded-b-xl px-3 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.18)]">
              {/* Left Wing */}
              <div className="flex items-center gap-2">
                <span className="text-[#00f0ff] font-ui font-black italic tracking-widest text-xs hidden sm:inline">
                  VOID-RIDER
                </span>
                <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 rounded-lg px-2 py-0.5 font-mono text-[10px]">
                  <span className="text-slate-400 font-bold">P</span>
                  <span className="text-cyan-300 font-black">01</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">08</span>
                  <span className="text-slate-700 mx-0.5">|</span>
                  <span className="text-slate-400 font-bold">L</span>
                  <span className="text-white font-black">01</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">03</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-0.5 border border-emerald-500/40 bg-black/60 font-mono text-[10px]">
                  <HeartPulse className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-300 font-bold">HP</span>
                  <span className="text-emerald-300 font-black">{simHull}%</span>
                </div>
              </div>

              {/* Right Wing */}
              <div className="flex items-center gap-2">
                <div className="font-mono font-bold bg-black/60 border border-cyan-500/30 rounded-lg px-2 py-0.5 text-xs text-white">
                  01:24.<span className="text-[#ff00e5]">88</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1 rounded bg-black/60 border border-slate-700 text-slate-300">
                    <Map className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="p-1 rounded bg-black/60 border border-slate-700 text-slate-300">
                    <Layers className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="p-1 rounded bg-black/60 border border-slate-700 text-slate-300">
                    <Camera className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 2. QUANTUM COUNTDOWN & EVENT ALERT POD */}
        {layouts.hud_quantum_countdown && (
          <LayoutElementWrapper
            layout={layouts.hud_quantum_countdown}
            isSelected={selectedId === 'hud_quantum_countdown'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="flex flex-col gap-1 px-3 py-2 rounded-b-2xl bg-[#030714]/92 border-x border-b border-cyan-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 flex items-center justify-center font-mono font-black text-xs text-cyan-300 shadow-[0_0_12px_#00f0ff]">
                  06:45
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    EVENT 42 // RELATIVISTIC TIDAL PINCH
                  </div>
                  <div className="text-[9px] text-slate-300 font-mono">
                    SEVERITY: TIER 3 // GRAVITATIONAL COMPRESSION ACTIVE
                  </div>
                </div>
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 3. SECTOR RADAR / MINIMAP */}
        {layouts.hud_minimap && (
          <LayoutElementWrapper
            layout={layouts.hud_minimap}
            isSelected={selectedId === 'hud_minimap'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="w-full h-full rounded-b-2xl bg-[#040812]/90 border-x border-b border-cyan-500/40 relative flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <svg className="w-full h-full p-2 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r="14" fill="none" stroke="#00f0ff" strokeWidth="1" />
                <line x1="50" y1="4" x2="50" y2="96" stroke="#00f0ff" strokeWidth="0.8" />
                <line x1="4" y1="50" x2="96" y2="50" stroke="#00f0ff" strokeWidth="0.8" />
                <circle cx="50" cy="35" r="3" fill="#00f0ff" />
                <circle cx="65" cy="55" r="2.5" fill="#f43f5e" />
              </svg>
              <div className="absolute bottom-1 text-[7px] font-mono text-cyan-300 font-bold uppercase tracking-widest text-center w-full">
                RADAR // 2.5KM
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 4. TACTICAL POWER-UPS SHELF */}
        {layouts.hud_powerups && (
          <LayoutElementWrapper
            layout={layouts.hud_powerups}
            isSelected={selectedId === 'hud_powerups'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-b-xl bg-black/70 border-x border-b border-cyan-400/50 backdrop-blur-md">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-400/60 bg-black/70 text-[9px] font-mono text-cyan-300">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span className="font-bold">WARP BOOST</span>
                <span className="font-black text-white">4.2s</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-pink-400/60 bg-black/70 text-[9px] font-mono text-pink-300">
                <ShieldCheck className="w-3 h-3 text-pink-400" />
                <span className="font-bold">DEFLECTOR</span>
                <span className="font-black text-white">6.8s</span>
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 5. CYBER FLIGHT JOYSTICK */}
        {layouts.hud_joystick && (
          <LayoutElementWrapper
            layout={layouts.hud_joystick}
            isSelected={selectedId === 'hud_joystick'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="w-full h-full rounded-b-2xl bg-[#040914]/80 border-x border-b border-cyan-500/40 relative flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="w-3/4 h-3/4 rounded-full border border-cyan-500/20" />
              <div className="absolute w-8 h-8 rounded-full border-2 border-cyan-300 bg-gradient-to-b from-cyan-400 to-blue-600 shadow-[0_0_12px_#00f0ff] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
              </div>
              <div className="absolute bottom-1 text-[7px] font-mono text-cyan-400/80 font-bold tracking-wider">
                STEER
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 6. DIGITAL TACHOMETER & SHIP VITALS */}
        {layouts.hud_speed_vitals && (
          <LayoutElementWrapper
            layout={layouts.hud_speed_vitals}
            isSelected={selectedId === 'hud_speed_vitals'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="flex flex-col gap-1.5 bg-[#050b14]/90 border-x border-b border-cyan-500/40 rounded-b-2xl p-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              {/* Digital Speed & Core Temp */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
                <div className="flex items-baseline">
                  <span className="text-2xl font-ui font-black text-cyan-300 leading-none drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">
                    {simSpeed}
                  </span>
                  <span className="text-[8px] font-mono font-black text-cyan-500 ml-1">KM/H</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-200 font-bold">{simHeat}°C</span>
                </div>
              </div>

              {/* Hull Bar */}
              <div className="flex flex-col gap-0.5 text-[8px] font-mono">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>HULL INTEGRITY</span>
                  <span className="text-emerald-400 font-black">{simHull}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${simHull}%` }}
                  />
                </div>
              </div>

              {/* Boost Fuel Bar */}
              <div className="flex flex-col gap-0.5 text-[8px] font-mono">
                <div className="flex justify-between text-fuchsia-300 font-bold">
                  <span>BOOST FUEL</span>
                  <span className="text-fuchsia-400 font-black">{simBoost}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-400 rounded-full"
                    style={{ width: `${simBoost}%` }}
                  />
                </div>
              </div>
            </div>
          </LayoutElementWrapper>
        )}

        {/* 7. TACTICAL ACTION DECK */}
        {layouts.hud_action_deck && (
          <LayoutElementWrapper
            layout={layouts.hud_action_deck}
            isSelected={selectedId === 'hud_action_deck'}
            isEditMode={true}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onSelect={setSelectedId}
            onChange={handleLayoutChange}
          >
            <div className="flex flex-col gap-1 p-2 rounded-b-2xl bg-[#040814]/90 border-x border-b border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              {/* Row 1: Drift, Missile, Shield */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex-1 py-1 rounded-lg border border-fuchsia-400/80 bg-fuchsia-950/60 text-fuchsia-300 flex flex-col items-center justify-center text-[7px] font-mono font-bold">
                  <Wind className="w-3 h-3" />
                  <span>DRIFT</span>
                </div>
                <div className="flex-1 py-1 rounded-lg border border-red-500/70 bg-red-950/60 text-red-300 flex flex-col items-center justify-center text-[7px] font-mono font-bold">
                  <Rocket className="w-3 h-3" />
                  <span>MISSILE</span>
                </div>
                <div className="flex-1 py-1 rounded-lg border border-cyan-400/70 bg-cyan-950/60 text-cyan-300 flex flex-col items-center justify-center text-[7px] font-mono font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>SHIELD</span>
                </div>
              </div>

              {/* Row 2: Beam, Brake, Boost */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex-1 py-1 rounded-lg border border-rose-400/80 bg-rose-950/60 text-rose-300 flex flex-col items-center justify-center text-[7px] font-mono font-bold">
                  <Zap className="w-3 h-3" />
                  <span>BEAM</span>
                </div>
                <div className="flex-1 py-1 rounded-lg border border-amber-400/80 bg-amber-950/60 text-amber-300 flex flex-col items-center justify-center text-[7px] font-mono font-bold">
                  <ChevronsDown className="w-3 h-3" />
                  <span>BRAKE</span>
                </div>
                <div className="flex-1 py-1 rounded-lg border-2 border-cyan-400 bg-cyan-950/80 text-cyan-300 flex flex-col items-center justify-center text-[7px] font-mono font-black shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  <ChevronsUp className="w-3 h-3" />
                  <span>BOOST</span>
                </div>
              </div>
            </div>
          </LayoutElementWrapper>
        )}
      </div>
    </div>
  );
};
