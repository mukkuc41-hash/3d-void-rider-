import React, { useState } from 'react';
import {
  Trophy,
  X,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Timer,
  Coins,
  Sparkles,
} from 'lucide-react';
import { MissionItem, AchievementItem } from '../types';
import { sound } from '../game/audio';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions?: MissionItem[];
  achievements?: AchievementItem[];
  onClaimMission: (missionId: string) => void;
  onClaimAchievement?: (achId: string) => void;
  credits?: number;
  playerLevel?: number;
  xp?: number;
}

interface ContractDef {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  rewardXp: number;
  progress: number;
  target: number;
  icon: any;
  claimed: boolean;
}

const DEFAULT_CONTRACTS: ContractDef[] = [
  {
    id: 'circuit_regular',
    title: 'Circuit Regular',
    description: 'Complete 3 races across any cosmic track.',
    rewardCredits: 600,
    rewardXp: 450,
    progress: 0,
    target: 3,
    icon: CheckCircle2,
    claimed: false,
  },
  {
    id: 'pristine_vector',
    title: 'Pristine Vector',
    description: 'Finish a race without crashing into asteroids or barriers.',
    rewardCredits: 750,
    rewardXp: 600,
    progress: 0,
    target: 1,
    icon: Shield,
    claimed: false,
  },
  {
    id: 'hyper_boost_cadence',
    title: 'Hyper Boost Cadence',
    description: 'Use nitro boost 10 times in races.',
    rewardCredits: 500,
    rewardXp: 350,
    progress: 0,
    target: 10,
    icon: Zap,
    claimed: false,
  },
  {
    id: 'draft_overtake',
    title: 'Draft & Overtake',
    description: 'Pass 5 opponents during races.',
    rewardCredits: 800,
    rewardXp: 700,
    progress: 0,
    target: 5,
    icon: Users,
    claimed: false,
  },
  {
    id: 'neon_orbit_mastery',
    title: 'Neon Orbit Mastery',
    description: 'Complete a race on the Neon Orbit hyper-ring.',
    rewardCredits: 650,
    rewardXp: 500,
    progress: 0,
    target: 1,
    icon: Zap,
    claimed: false,
  },
  {
    id: 'sub_minute_split',
    title: 'Sub-Minute Split',
    description: 'Finish a lap in under 55.000s in Time Trial or Race.',
    rewardCredits: 900,
    rewardXp: 800,
    progress: 0,
    target: 1,
    icon: Timer,
    claimed: false,
  },
];

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  onClaimMission,
  credits = 1500,
  playerLevel = 1,
  xp = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'FACTIONS'>('DAILY');

  if (!isOpen) return null;

  // Merge runtime missions with template if available
  const displayItems = DEFAULT_CONTRACTS.map(def => {
    const live = missions?.find(m => m.id === def.id || m.title.toLowerCase().includes(def.title.toLowerCase()));
    if (live) {
      return {
        ...def,
        progress: live.progress,
        target: live.target,
        claimed: live.claimed,
      };
    }
    return def;
  });

  const readyCount = displayItems.filter(i => i.progress >= i.target && !i.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#060c18]/95 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-ui font-black uppercase tracking-wider text-white">
                FLIGHT OPERATIONS & CONTRACTS
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Complete objectives to earn Credits, Pilot XP, and Faction standing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
              CYCLE 3099.4
            </div>
            <button
              onClick={() => {
                sound.playMenuClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('DAILY');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DAILY'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#060e1b] border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>DAILY PROTOCOL ({readyCount} READY)</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('WEEKLY');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'WEEKLY'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#060e1b] border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>WEEKLY CONTRACTS</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('FACTIONS');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'FACTIONS'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#060e1b] border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>VOID CORE FACTIONS</span>
          </button>
        </div>

        {/* Pilot Stats Sub-Bar */}
        <div className="flex items-center gap-4 px-1 py-1.5 mb-3 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{credits.toLocaleString()} CR</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              LVL {playerLevel} ({xp} / 1000 XP)
            </span>
          </div>
        </div>

        {/* Mission List */}
        <div className="space-y-2.5 flex-1 pr-0.5">
          {displayItems.map(item => {
            const Icon = item.icon;
            const pct = Math.min(100, Math.floor((item.progress / item.target) * 100));
            const isCompleted = item.progress >= item.target;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#060e1b]/90 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      +{item.rewardCredits} CR
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      +{item.rewardXp} XP
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Status */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {item.progress} / {item.target} ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-end mt-2">
                    {item.claimed ? (
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        COMPLETED
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => {
                          sound.playUpgradePurchase();
                          onClaimMission(item.id);
                        }}
                        className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-ui font-black uppercase tracking-wider shadow-[0_0_10px_#10b981]"
                      >
                        CLAIM REWARD
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
          <span>Contracts refresh every 24 hours.</span>
          <span className="text-cyan-400/80 font-bold">VOID-RIDER OPS v2.4</span>
        </div>
      </div>
    </div>
  );
};
