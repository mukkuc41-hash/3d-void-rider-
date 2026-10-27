import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BrainCircuit, GitBranch, Layers, Waves, Hammer,
  Orbit, Rocket, Sparkles, Play, ShieldAlert, Zap,
} from 'lucide-react';
import { GameMode } from '../types';
import { sound } from '../game/audio';

interface IntoUnknownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMode: (mode: GameMode) => void;
}

interface FrontierMode {
  id: string;
  title: string;
  tagline: string;
  description: string;
  mechanics: string[];
  foundation: GameMode;
  foundationName: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const FRONTIERS: FrontierMode[] = [
  { id: '11', title: 'PARADOX CIRCUIT', tagline: 'THE ROUTE REFUSES TO STAY STILL', description: 'Race through unstable track sections where the path ahead breaks apart and forces you to react, recover and find the fastest line.', mechanics: ['Collapsing track hazards', 'High-speed route decisions', 'Checkpoint racing'], foundation: 'COLLAPSING_TRACK', foundationName: 'Collapsing Track', accent: 'amber', Icon: GitBranch },
  { id: '12', title: 'TWIN-REALITY PURSUIT', tagline: 'TWO ROUTES. TWO VERSIONS OF SPACE.', description: 'Chase alternate paths through unstable spatial passages. This first playable foundation uses sequential wormhole traversal and spatial route hazards.', mechanics: ['Wormhole route traversal', 'Spatial hazards', 'Precision navigation'], foundation: 'WORMHOLE_EXPRESS', foundationName: 'Wormhole Express', accent: 'blue', Icon: Layers },
  { id: '13', title: 'GRAVITY SURFER', tagline: 'RIDE THE FORCES THAT MOVE THE UNIVERSE', description: 'Control your ship through a low-gravity stunt challenge. Preserve momentum, perform aerial manoeuvres and learn to keep control in open space.', mechanics: ['Zero-G handling', 'Aerial manoeuvres', 'Momentum control'], foundation: 'GRAVITY_FREE', foundationName: 'Gravity Free', accent: 'emerald', Icon: Waves },
  { id: '14', title: 'FORGE THE VOID', tagline: 'TURN ENERGY INTO YOUR WAY FORWARD', description: 'Collect energy cores along the route while balancing speed and cargo. This foundation establishes the resource loop for future temporary-route construction.', mechanics: ['Energy-core collection', 'Cargo trade-offs', 'Extraction objective'], foundation: 'ENERGY_HEIST', foundationName: 'Energy Heist', accent: 'lime', Icon: Hammer },
  { id: '15', title: 'AFTERMATH PROTOCOL', tagline: 'THE DEBRIS NEVER STOPS COMING', description: 'Navigate a relentless orbital junkyard. Survive escalating debris density, react to changing gaps and stay in control as the hazard pressure rises.', mechanics: ['Debris survival', 'Escalating hazard pressure', 'Near-miss risk'], foundation: 'DEBRIS_SURVIVAL', foundationName: 'Debris Survival', accent: 'rose', Icon: Orbit },
  { id: '16', title: 'NEMESIS INTELLIGENCE', tagline: 'OUTTHINK YOUR RIVAL', description: 'Challenge a focused elite opponent. Win through line choice, timing, boost management and clean overtaking instead of relying on impossible AI speed.', mechanics: ['One-on-one rival race', 'Overtaking strategy', 'Elite opponent setup'], foundation: 'RIVAL_DUEL', foundationName: 'Rival Duel', accent: 'fuchsia', Icon: BrainCircuit },
  { id: '17', title: 'EXODUS ZERO', tagline: 'REACH EXTRACTION BEFORE THE FRONTIER FALLS', description: 'Race against an advancing plasma storm and reach extraction. Keep forward momentum, use available protection and avoid being overtaken by the hazard front.', mechanics: ['Advancing storm pressure', 'Shield pickups', 'Extraction survival'], foundation: 'PLASMA_STORM', foundationName: 'Plasma Storm', accent: 'cyan', Icon: Rocket },
];

const accentClasses: Record<string, { border: string; text: string; glow: string; selected: string }> = {
  amber: { border: 'border-amber-400/60', text: 'text-amber-300', glow: 'shadow-[0_0_18px_rgba(251,191,36,0.12)]', selected: 'bg-amber-950/30' },
  blue: { border: 'border-blue-400/60', text: 'text-blue-300', glow: 'shadow-[0_0_18px_rgba(96,165,250,0.12)]', selected: 'bg-blue-950/30' },
  emerald: { border: 'border-emerald-400/60', text: 'text-emerald-300', glow: 'shadow-[0_0_18px_rgba(52,211,153,0.12)]', selected: 'bg-emerald-950/30' },
  lime: { border: 'border-lime-400/60', text: 'text-lime-300', glow: 'shadow-[0_0_18px_rgba(163,230,53,0.12)]', selected: 'bg-lime-950/30' },
  rose: { border: 'border-rose-400/60', text: 'text-rose-300', glow: 'shadow-[0_0_18px_rgba(251,113,133,0.12)]', selected: 'bg-rose-950/30' },
  fuchsia: { border: 'border-fuchsia-400/60', text: 'text-fuchsia-300', glow: 'shadow-[0_0_18px_rgba(232,121,249,0.12)]', selected: 'bg-fuchsia-950/30' },
  cyan: { border: 'border-cyan-400/60', text: 'text-cyan-300', glow: 'shadow-[0_0_18px_rgba(34,211,238,0.12)]', selected: 'bg-cyan-950/30' },
};

export const IntoUnknownModal: React.FC<IntoUnknownModalProps> = ({ isOpen, onClose, onStartMode }) => {
  const [selectedId, setSelectedId] = useState('11');
  const selected = useMemo(() => FRONTIERS.find(mode => mode.id === selectedId) || FRONTIERS[0], [selectedId]);
  if (!isOpen) return null;
  const theme = accentClasses[selected.accent];
  const SelectedIcon = selected.Icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-5 bg-[#02040b]/90 backdrop-blur-xl pointer-events-auto overflow-y-auto" role="dialog" aria-modal="true" aria-label="Into Unknown mode selection">
      <div className="relative w-full max-w-6xl max-h-[96vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-cyan-400/30 bg-[#070b18] shadow-[0_0_70px_rgba(34,211,238,0.12)]">
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse at 10% 0%, rgba(34,211,238,.18), transparent 42%), radial-gradient(ellipse at 90% 30%, rgba(217,70,239,.15), transparent 40%)' }} />
        <header className="relative flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center shrink-0"><Sparkles className="w-6 h-6 text-cyan-300" /></div>
            <div className="min-w-0"><p className="text-[10px] sm:text-xs tracking-[.3em] text-cyan-300 font-mono">VOID-RIDER 3D // FRONTIER PROGRAM</p><h2 className="text-2xl sm:text-4xl font-black italic tracking-wider text-white">INTO <span className="text-cyan-300">UNKNOWN</span></h2><p className="text-[10px] sm:text-xs text-slate-400 tracking-widest mt-1">SEVEN UNCHARTED EXPERIENCES · PROTOCOLS 11–17</p></div>
          </div>
          <button onClick={() => { sound.playMenuClick(); onClose(); }} className="shrink-0 p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400" aria-label="Close Into Unknown"><ArrowLeft className="w-5 h-5" /></button>
        </header>
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-4 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
            {FRONTIERS.map(mode => {
              const Icon = mode.Icon; const active = mode.id === selectedId; const color = accentClasses[mode.accent];
              return <button key={mode.id} onClick={() => { sound.playMenuClick(); setSelectedId(mode.id); }} className={`text-left rounded-xl border p-3 sm:p-4 transition-all ${active ? `${color.border} ${color.selected} ${color.glow}` : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}>
                <div className="flex items-start gap-3"><div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${active ? `${color.border} ${color.text}` : 'border-slate-700 text-slate-400'} bg-black/20`}><Icon className="w-5 h-5" /></div><div className="min-w-0"><p className={`text-[10px] font-mono tracking-widest ${active ? color.text : 'text-slate-500'}`}>FRONTIER {mode.id}</p><h3 className="text-xs sm:text-sm font-black tracking-wide text-white leading-snug mt-1">{mode.title}</h3><p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">{mode.tagline}</p></div></div>
              </button>;
            })}
          </div>
          <section className={`rounded-2xl border ${theme.border} ${theme.selected} p-4 sm:p-6 flex flex-col min-h-[300px]`}>
            <div className="flex items-center justify-between gap-3"><span className={`text-[10px] font-mono tracking-[.25em] ${theme.text}`}>SELECTED FRONTIER // {selected.id}</span><span className="text-[9px] text-slate-500 border border-slate-700 rounded-full px-2 py-1">PLAYABLE PREVIEW</span></div>
            <div className="flex-1 flex flex-col justify-center py-5"><div className={`w-14 h-14 rounded-2xl border ${theme.border} bg-black/30 flex items-center justify-center mb-5`}><SelectedIcon className={`w-7 h-7 ${theme.text}`} /></div><h3 className="text-2xl sm:text-3xl font-black italic text-white tracking-wide">{selected.title}</h3><p className={`text-xs font-mono tracking-wider mt-2 ${theme.text}`}>{selected.tagline}</p><p className="text-sm text-slate-300 leading-relaxed mt-4">{selected.description}</p><div className="mt-5"><p className="text-[10px] text-slate-500 font-mono tracking-widest mb-2">ACTIVE GAMEPLAY SYSTEMS</p><div className="flex flex-wrap gap-2">{selected.mechanics.map(item => <span key={item} className="text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-black/30 text-slate-300">{item}</span>)}</div></div></div>
            <div className="rounded-xl border border-slate-800 bg-black/25 p-3 mb-3"><div className="flex items-center gap-2 text-[10px] text-slate-300 font-bold tracking-wider"><ShieldAlert className="w-4 h-4 text-cyan-300" /> CURRENT ENGINE FOUNDATION: {selected.foundationName.toUpperCase()}</div><p className="text-[10px] text-slate-500 mt-1 leading-relaxed">This build connects each frontier to a verified existing gameplay foundation. Its fully bespoke mechanics can be layered in later without replacing protected modes.</p></div>
            <button onClick={() => { sound.playMenuClick(); onStartMode(selected.foundation); }} className={`w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:brightness-110 active:scale-[.99] text-white font-black tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg`}><Play className="w-4 h-4 fill-white" /> LAUNCH FRONTIER <ArrowRight className="w-4 h-4" /></button>
            <p className="text-[9px] text-slate-600 text-center mt-2">Prototype mode launch uses the mapped existing race engine systems.</p>
          </section>
        </div>
        <footer className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-800 text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-500"><span>REALITY STATUS: UNCHARTED</span><span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-cyan-400" /> FRONTIER LINK READY</span></footer>
      </div>
    </div>
  );
};
