import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  Sparkles,
  Shield,
  Layers,
  Tag,
  Award,
} from 'lucide-react';
import { CustomLiveryConfig, LiveryFinishType } from '../types';

interface LiveryPainterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyLivery: (config: CustomLiveryConfig) => void;
  initialLivery?: Partial<CustomLiveryConfig>;
}

export const LiveryPainterModal: React.FC<LiveryPainterModalProps> = ({
  isOpen,
  onClose,
  onApplyLivery,
  initialLivery,
}) => {
  const [finish, setFinish] = useState<LiveryFinishType>(
    initialLivery?.finish || 'PEARLESCENT_CHROME'
  );
  const [callsign, setCallsign] = useState<string>(initialLivery?.callsign || 'GHOST-01');
  const [stripeStyle, setStripeStyle] = useState<CustomLiveryConfig['stripeStyle']>(
    initialLivery?.stripeStyle || 'DUAL_RACING'
  );
  const [sponsorLogo, setSponsorLogo] = useState<CustomLiveryConfig['sponsorLogo']>(
    initialLivery?.sponsorLogo || 'AEROSPACE_DYN'
  );

  if (!isOpen) return null;

  const finishes: { id: LiveryFinishType; name: string; desc: string }[] = [
    { id: 'MATTE_CARBON', name: 'Matte Carbon Composite', desc: 'Ultra-light stealth carbon fiber weave' },
    { id: 'PEARLESCENT_CHROME', name: 'Pearlescent Chrome', desc: 'High-gloss iridescent mirror titanium' },
    { id: 'WEATHERED_TITANIUM', name: 'Weathered Battle Titanium', desc: 'Re-entry scorch marks and plasma burns' },
    { id: 'NEON_CIRCUIT', name: 'Electroluminescent Circuit', desc: 'Pulsing neon superconducting traces' },
  ];

  const stripes: { id: CustomLiveryConfig['stripeStyle']; name: string }[] = [
    { id: 'NONE', name: 'Clean Monolithic' },
    { id: 'DUAL_RACING', name: 'Twin Le Mans Stripes' },
    { id: 'CHEVRON_HAZARD', name: 'Aerospace Chevron Hazard' },
    { id: 'ASYMMETRIC_CYBER', name: 'Asymmetric Cyber Flank' },
  ];

  const sponsors: { id: CustomLiveryConfig['sponsorLogo']; name: string; tag: string }[] = [
    { id: 'AEROSPACE_DYN', name: 'Aerospace Dynamics', tag: 'Orbital Propulsion' },
    { id: 'QUANTUM_CORP', name: 'Quantum Core Systems', tag: 'Sub-space Warp Engines' },
    { id: 'SOLARIS_DRIVE', name: 'Solaris Hyper-Drive', tag: 'Photon Ion Thrusters' },
    { id: 'VOID_PROJECT', name: 'Project Voidworks', tag: 'Classified Black Hole Skunkworks' },
  ];

  const handleSaveAndApply = () => {
    onApplyLivery({
      finish,
      primaryColor: '#00f0ff',
      secondaryColor: '#ec4899',
      callsign: callsign.toUpperCase(),
      sponsorLogo,
      stripeStyle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-3xl bg-slate-950 border border-fuchsia-500/30 flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(217,70,239,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-ui font-black uppercase tracking-widest text-white flex items-center gap-2">
                SHIP LIVERY & CALLSIGN STUDIO
              </h2>
              <span className="text-xs font-mono text-slate-400">
                AEROSPACE FINISHES // VINYL STRIPES // SPONSOR INSIGNIAS
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

        {/* Studio Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Section 1: Material Finish */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              1. AEROSPACE HULL FINISH
            </span>
            <div className="grid grid-cols-2 gap-3">
              {finishes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFinish(f.id)}
                  className={`p-3 border text-left flex flex-col transition-all cursor-pointer ${
                    finish === f.id
                      ? 'border-fuchsia-400 bg-fuchsia-950/30 text-white shadow-[0_0_15px_rgba(217,70,239,0.2)]'
                      : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <span className="font-ui font-black text-xs uppercase tracking-wide">
                    {f.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Vinyl Stripe Pattern */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              2. RACING VINYL PATTERN
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stripes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStripeStyle(s.id)}
                  className={`px-3 py-2 border text-center transition-all cursor-pointer ${
                    stripeStyle === s.id
                      ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 font-bold'
                      : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-xs uppercase">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Pilot Callsign Stamp */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              3. WING CALLSIGN STAMP
            </span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                maxLength={10}
                value={callsign}
                onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                placeholder="CALLSIGN"
                className="bg-slate-900 border border-white/20 px-4 py-2 font-mono font-black text-sm text-cyan-400 tracking-widest uppercase focus:outline-none focus:border-cyan-400 w-48"
              />
              <span className="text-xs font-mono text-slate-500">
                Printed in bold reflective titanium foil on the primary wings.
              </span>
            </div>
          </div>

          {/* Section 4: Aerospace Manufacturer Sponsor */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              4. SPONSORSHIP BADGE
            </span>
            <div className="grid grid-cols-2 gap-3">
              {sponsors.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setSponsorLogo(sp.id)}
                  className={`p-3 border text-left flex flex-col transition-all cursor-pointer ${
                    sponsorLogo === sp.id
                      ? 'border-amber-400 bg-amber-950/30 text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <span className="font-ui font-black text-xs uppercase tracking-wide text-amber-300">
                    {sp.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">{sp.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleSaveAndApply}
            className="mt-3 w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-ui font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.4)] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            APPLY LIVERY TO SPACECRAFT
          </button>
        </div>
      </div>
    </div>
  );
};
