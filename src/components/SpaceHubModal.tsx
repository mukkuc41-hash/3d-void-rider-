import React, { useState } from 'react';
import {
  X,
  Wrench,
  Play,
  Award,
  Globe2,
  Trophy,
  User,
  Radio,
  Sparkles,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react';

interface SpaceHubModalProps {
  onClose: () => void;
  onNavigateTo: (
    view: 'GARAGE' | 'MODE_SELECT' | 'MISSIONS' | 'STORY' | 'LEADERBOARDS' | 'PROFILE'
  ) => void;
  pilotName: string;
  credits: number;
  level: number;
}

export const SpaceHubModal: React.FC<SpaceHubModalProps> = ({
  onClose,
  onNavigateTo,
  pilotName,
  credits,
  level,
}) => {
  const [activeTerminal, setActiveTerminal] = useState<string>('HANGAR');

  const terminals = [
    {
      id: 'HANGAR',
      title: 'ORBITAL HANGAR // GARAGE',
      description: 'Upgrade anti-gravity thrusters, customize holographic livery, calibrate phase shielding.',
      icon: Wrench,
      actionText: 'ACCESS GARAGE',
      targetView: 'GARAGE' as const,
      color: 'from-cyan-500 to-blue-600',
      badge: 'FLIGHT READY',
    },
    {
      id: 'LAUNCHPAD',
      title: 'QUANTUM LAUNCH PAD',
      description: 'Engage sub-light wormholes across Neon Orbit, Void Rift, Asteroid Run, and Cosmic Ring.',
      icon: Play,
      actionText: 'RACE SELECTION',
      targetView: 'MODE_SELECT' as const,
      color: 'from-emerald-500 to-teal-600',
      badge: '7 MODES ONLINE',
    },
    {
      id: 'STORY',
      title: 'FACTION EMBASSY // LORE',
      description: 'Access the Cosmic Chronicles, review rival factions, and launch story campaign chapters.',
      icon: Globe2,
      actionText: 'OPEN CHRONICLES',
      targetView: 'STORY' as const,
      color: 'from-fuchsia-500 to-pink-600',
      badge: '4 FACTIONS',
    },
    {
      id: 'MISSIONS',
      title: 'BOUNTY & DISPATCH CONSOLE',
      description: 'Claim daily credit contracts, speed milestones, and drift duration bounties.',
      icon: Award,
      actionText: 'VIEW MISSIONS',
      targetView: 'MISSIONS' as const,
      color: 'from-amber-500 to-orange-600',
      badge: 'DAILY BOUNTIES',
    },
    {
      id: 'LEADERBOARD',
      title: 'HOLONET LEADERBOARD TOWER',
      description: 'Inspect global record times, sub-second lap rankings, and sector champions.',
      icon: Trophy,
      actionText: 'GLOBAL RANKS',
      targetView: 'LEADERBOARDS' as const,
      color: 'from-purple-500 to-indigo-600',
      badge: 'REAL-TIME SYNC',
    },
    {
      id: 'PILOT',
      title: 'PILOT BIO & CAREER DOSSIER',
      description: 'Review total drift time, top speeds clocked, asteroids dodged, and achievement badges.',
      icon: User,
      actionText: 'PILOT PROFILE',
      targetView: 'PROFILE' as const,
      color: 'from-cyan-600 to-slate-700',
      badge: `LVL ${level}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-ui font-black italic text-white tracking-wider">
                  CELESTIAL NEXUS // SPACE HUB
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                  ORBITAL STATION 07
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                PILOT: <span className="text-cyan-400 font-bold">{pilotName}</span> | CREDITS: <span className="text-amber-400 font-bold">{credits.toLocaleString()} CR</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station Ambient Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>GRAV GENERATOR: <strong className="text-white">1.00 G STABLE</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>REACTOR CORE: <strong className="text-white">99.8% EFF</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="w-4 h-4 text-fuchsia-400" />
            <span>HOLONET RELAY: <strong className="text-white">0.4ms PING</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>DOCKING BAYS: <strong className="text-white">4 OPEN</strong></span>
          </div>
        </div>

        {/* Terminals Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terminals.map(terminal => {
              const Icon = terminal.icon;
              return (
                <div
                  key={terminal.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/60 transition-all flex flex-col justify-between group hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${terminal.color} p-2.5 flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-cyan-300">
                        {terminal.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-ui font-black text-white group-hover:text-cyan-300 transition-colors">
                        {terminal.title}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-1 leading-relaxed">
                        {terminal.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTo(terminal.targetView);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-900 group-hover:bg-cyan-500 group-hover:text-slate-950 border border-slate-700 group-hover:border-cyan-400 text-cyan-300 font-ui font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{terminal.actionText}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
