import React, { useState } from 'react';
import {
  X,
  Compass,
  Zap,
  Sun,
  ShieldAlert,
  Play,
  CheckCircle2,
  Lock,
  Award,
  ChevronRight,
  Sparkles,
  Flag,
  Globe2,
} from 'lucide-react';
import { FactionId, GameMode, TrackId } from '../types';
import { COSMIC_FACTIONS, STORY_CAMPAIGN_MISSIONS } from '../game/universeData';

interface StoryUniverseModalProps {
  onClose: () => void;
  onLaunchMission: (trackId: TrackId, mode: GameMode) => void;
}

export const StoryUniverseModal: React.FC<StoryUniverseModalProps> = ({
  onClose,
  onLaunchMission,
}) => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGN' | 'FACTIONS'>('CAMPAIGN');
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    STORY_CAMPAIGN_MISSIONS[0].id
  );
  const [selectedFactionId, setSelectedFactionId] = useState<FactionId>('apex_syndicate');

  const selectedMission =
    STORY_CAMPAIGN_MISSIONS.find(m => m.id === selectedMissionId) ||
    STORY_CAMPAIGN_MISSIONS[0];
  const selectedFaction = COSMIC_FACTIONS[selectedFactionId] || COSMIC_FACTIONS['apex_syndicate'];

  const getFactionIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      default:
        return <Globe2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-ui font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 tracking-wider">
                COSMIC CHRONICLES // VOID UNIVERSE
              </h2>
              <p className="text-xs font-mono text-slate-400">
                FACTION POLITICS, LORE & CAMPAIGN DISPATCHES
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('CAMPAIGN')}
            className={`flex items-center gap-2 pb-3 font-ui font-bold text-sm tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'CAMPAIGN'
                ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_#00f0ff]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Story Campaign</span>
          </button>

          <button
            onClick={() => setActiveTab('FACTIONS')}
            className={`flex items-center gap-2 pb-3 font-ui font-bold text-sm tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'FACTIONS'
                ? 'border-fuchsia-400 text-fuchsia-300 drop-shadow-[0_0_8px_#ff00e5]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Cosmic Factions</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'CAMPAIGN' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Mission Chapters List */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  CAMPAIGN MISSIONS
                </span>
                {STORY_CAMPAIGN_MISSIONS.map(mission => {
                  const isSelected = mission.id === selectedMissionId;
                  const faction = COSMIC_FACTIONS[mission.rivalFaction];

                  return (
                    <div
                      key={mission.id}
                      onClick={() => setSelectedMissionId(mission.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-cyan-400">
                            CH. 0{mission.chapter}
                          </span>
                          <span className="text-xs font-mono text-slate-400 truncate max-w-[130px]">
                            {mission.location}
                          </span>
                        </div>
                        {mission.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : mission.unlocked ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>

                      <div className="text-sm font-ui font-black text-white">
                        {mission.title}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Rival: {mission.rivalPilot.split('(')[0]}</span>
                        <span className="text-amber-400 font-bold">+{mission.rewardCredits} CR</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Mission Briefing Card */}
              <div className="md:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/30">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                      <span>CHAPTER 0{selectedMission.chapter} BRIEFING</span>
                      <span>//</span>
                      <span>{selectedMission.location}</span>
                    </div>
                    <h3 className="text-2xl font-ui font-black text-white tracking-wide">
                      {selectedMission.title}
                    </h3>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                    {selectedMission.briefing}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                        MISSION OBJECTIVE
                      </span>
                      <p className="text-xs font-ui font-bold text-white leading-snug">
                        {selectedMission.objective}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                        RIVAL CHALLENGER
                      </span>
                      <p className="text-xs font-ui font-bold text-cyan-300">
                        {selectedMission.rivalPilot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>MISSION BOUNTY</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono font-bold">
                      <span className="text-amber-400">+{selectedMission.rewardCredits} CREDITS</span>
                      <span className="text-cyan-400">+{selectedMission.rewardXP} XP</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    Mode: <span className="text-white font-bold">{selectedMission.mode}</span> ({selectedMission.targetLaps} Laps)
                  </div>

                  <button
                    onClick={() => onLaunchMission(selectedMission.trackId, selectedMission.mode)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-ui font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>ENGAGE MISSION</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Factions Selector */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  VOID GRID FACTIONS
                </span>
                {Object.values(COSMIC_FACTIONS).map(faction => {
                  const isSelected = faction.id === selectedFactionId;

                  return (
                    <div
                      key={faction.id}
                      onClick={() => setSelectedFactionId(faction.id as FactionId)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                      style={{
                        borderLeftColor: isSelected ? faction.color : undefined,
                        borderLeftWidth: isSelected ? '4px' : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: `${faction.color}20`,
                            color: faction.color,
                            border: `1px solid ${faction.color}50`,
                          }}
                        >
                          {getFactionIcon(faction.icon)}
                        </div>
                        <div>
                          <div className="text-sm font-ui font-black text-white">
                            {faction.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 italic">
                            "{faction.motto}"
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  );
                })}
              </div>

              {/* Faction Detail Dossier */}
              <div className="md:col-span-7 p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-widest font-bold">
                      FACTION DOSSIER
                    </span>
                    <h3
                      className="text-2xl font-ui font-black mt-0.5 tracking-wide"
                      style={{ color: selectedFaction.color }}
                    >
                      {selectedFaction.name}
                    </h3>
                  </div>

                  <div
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${selectedFaction.color}15`,
                      color: selectedFaction.color,
                      border: `1px solid ${selectedFaction.color}40`,
                    }}
                  >
                    Champion: {selectedFaction.championPilot}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest font-bold">
                    ORIGIN & PHILOSOPHY
                  </span>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    {selectedFaction.lore}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-widest font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    TACTICAL GRID BONUS
                  </span>
                  <p className="text-xs font-ui font-bold text-white">
                    {selectedFaction.bonusText}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs font-mono text-cyan-300">
                  <p>
                    Align with <span className="font-bold">{selectedFaction.name}</span> in Grand Prix seasons to unlock specialized aerodynamic decals and engine tuning blueprints.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
