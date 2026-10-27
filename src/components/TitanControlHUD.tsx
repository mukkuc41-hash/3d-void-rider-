import React, { useRef } from 'react';

type Direction = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';
type Props = { onDirectionalInput: (input: Partial<Record<Direction, boolean>>) => void; onPause: () => void; onAbility: (id: 'drone' | 'swarm' | 'heavy' | 'shield') => void };
const controls: { label: string; direction: Direction; glyph: string }[] = [
  { label: 'FORWARD', direction: 'forward', glyph: '↑' },
  { label: 'LEFT', direction: 'left', glyph: '←' },
  { label: 'RIGHT', direction: 'right', glyph: '→' },
  { label: 'REVERSE', direction: 'backward', glyph: '↓' },
  { label: 'THRUST UP', direction: 'up', glyph: '⬆' },
  { label: 'THRUST DOWN', direction: 'down', glyph: '⬇' },
];
export function TitanControlHUD({ onDirectionalInput, onPause, onAbility }: Props) {
  const held = useRef<Set<Direction>>(new Set());
  const set = (direction: Direction, pressed: boolean) => {
    if (pressed) held.current.add(direction); else held.current.delete(direction);
    onDirectionalInput({ [direction]: pressed });
  };
  return <div className="fixed inset-0 z-[80] pointer-events-none select-none text-white">
    <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-xl border border-orange-400/60 bg-slate-950/85 px-5 py-3 text-center shadow-lg shadow-orange-950/40">
      <div className="text-xs font-black tracking-[0.28em] text-orange-300">TITAN COLOSSUS PRIME</div>
      <div className="mt-1 text-[10px] tracking-widest text-cyan-200">CIRCULAR COMBAT PLATFORM · SIX-AXIS FLIGHT</div>
      <button onClick={onPause} className="pointer-events-auto mt-2 rounded border border-white/30 px-3 py-1 text-[10px] font-bold tracking-widest hover:bg-white/10">PAUSE / MENU</button>
    </div>
    <div className="absolute bottom-5 left-4 grid grid-cols-3 gap-2 pointer-events-auto">
      {controls.slice(0,4).map(c => <button key={c.direction} aria-label={c.label} title={c.label} onPointerDown={e => { e.preventDefault(); (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId); set(c.direction,true); }} onPointerUp={() => set(c.direction,false)} onPointerCancel={() => set(c.direction,false)} onLostPointerCapture={() => set(c.direction,false)} className={`h-14 w-14 rounded-xl border border-cyan-300/50 bg-slate-950/80 text-xl font-black active:bg-cyan-500/50 ${c.direction==='forward'?'col-start-2':c.direction==='left'?'col-start-1':c.direction==='right'?'col-start-3':'col-start-2'}`}><span>{c.glyph}</span><span className="block text-[7px] tracking-wider">{c.label}</span></button>)}
    </div>
    <div className="absolute bottom-5 right-4 flex flex-col gap-2 pointer-events-auto">
      {controls.slice(4).map(c => <button key={c.direction} aria-label={c.label} title={c.label} onPointerDown={e => { e.preventDefault(); (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId); set(c.direction,true); }} onPointerUp={() => set(c.direction,false)} onPointerCancel={() => set(c.direction,false)} onLostPointerCapture={() => set(c.direction,false)} className="h-14 w-16 rounded-xl border border-orange-300/60 bg-slate-950/85 text-xl font-black active:bg-orange-500/50">{c.glyph}<span className="block text-[7px] tracking-wider">{c.label}</span></button>)}
    </div>
    <div className="absolute top-28 right-4 flex max-w-[46vw] flex-col gap-2 pointer-events-auto sm:top-24 sm:right-6">
      {[{id:'drone' as const,label:'DRONE EXECUTION',key:'1',color:'border-cyan-300 text-cyan-100'},{id:'swarm' as const,label:'SWARM ASSAULT',key:'2',color:'border-fuchsia-300 text-fuchsia-100'},{id:'heavy' as const,label:'HEAVY STRIKE',key:'3',color:'border-orange-300 text-orange-100'},{id:'shield' as const,label:'BULWARK SHIELD',key:'4',color:'border-blue-300 text-blue-100'}].map(a => <button key={a.id} onClick={() => onAbility(a.id)} className={`rounded-lg border bg-slate-950/90 px-3 py-2 text-left text-[9px] font-black tracking-wider shadow-lg ${a.color}`}><span className="mr-2 rounded bg-white/10 px-1.5 py-1">{a.key}</span>{a.label}</button>)}
    </div>
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-center text-[9px] tracking-wider text-white/75">W/S MOVE · A/D STRAFE · T/G VERTICAL · 1 DRONES · 2 SWARM · 3 HEAVY · 4 SHIELD</div>
  </div>;
}
