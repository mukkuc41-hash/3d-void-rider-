import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Compass,
  X,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';
import { pilotSkillManager, SKILL_TREE_NODES } from '../game/pilotSkillTree';
import { SkillBranchId } from '../types';

interface PilotSkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
}

export const PilotSkillTreeModal: React.FC<PilotSkillTreeModalProps> = ({
  isOpen,
  onClose,
  playerLevel,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<SkillBranchId>('VECTOR');
  const [, setRefresh] = useState<number>(0);

  if (!isOpen) return null;

  pilotSkillManager.addPointsForLevel(playerLevel);
  const state = pilotSkillManager.getState();

  const handleUpgrade = (skillId: string) => {
    const success = pilotSkillManager.upgradeSkill(skillId);
    if (success) {
      setRefresh((r) => r + 1);
    }
  };

  const handleRespec = () => {
    if (confirm('Reset all allocated cybernetic skill points and refund them?')) {
      pilotSkillManager.respecSkills();
      setRefresh((r) => r + 1);
    }
  };

  const branches: { id: SkillBranchId; name: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'VECTOR',
      name: 'VECTOR SPECIALIST',
      icon: Zap,
      color: '#00f0ff',
      desc: 'Top velocity ceilings, slipstream drafting boost, and zero-G cornering balance.',
    },
    {
      id: 'COMBAT',
      name: 'COMBAT VANGUARD',
      icon: Shield,
      color: '#f43f5e',
      desc: 'EMP shockwave amplification, kinetic shield deflector, and rapid missile auto-loaders.',
    },
    {
      id: 'GRAVITON',
      name: 'GRAVITON ARCHITECT',
      icon: Compass,
      color: '#a855f7',
      desc: 'Black hole slingshot amplification, quantum phase warp dash, and spatial drift lock.',
    },
  ];

  const filteredSkills = SKILL_TREE_NODES.filter((s) => s.branch === selectedBranch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/30 flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-ui font-black uppercase tracking-widest text-white flex items-center gap-2">
                PILOT CYBERNETICS // SKILL TREE
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>AVAILABLE POINTS:</span>
                <span className="text-cyan-400 font-bold">{state.availableSkillPoints} SP</span>
                <span aria-hidden="true">·</span>
                <span>PILOT RANK LVL {playerLevel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRespec}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 border border-white/10 hover:text-white hover:border-white/30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET ALL
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Branch Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-slate-950/70">
          {branches.map((b) => {
            const Icon = b.icon;
            const isSelected = selectedBranch === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`p-3.5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-b-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 text-white shadow-[inset_0_-8px_16px_rgba(0,240,255,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: b.color }} />
                  <span className="font-ui font-black text-xs uppercase tracking-wider">
                    {b.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 line-clamp-1">{b.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Skills List in Selected Branch */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {filteredSkills.map((skill) => {
            const currentLevel = pilotSkillManager.getSkillLevel(skill.id);
            const isMaxed = currentLevel >= skill.maxLevel;
            const canAfford = state.availableSkillPoints >= skill.cost && !isMaxed;

            return (
              <div
                key={skill.id}
                className={`p-4 border flex items-center justify-between gap-4 transition-all ${
                  isMaxed
                    ? 'bg-slate-900/60 border-emerald-500/40'
                    : currentLevel > 0
                    ? 'bg-slate-900/80 border-cyan-500/30'
                    : 'bg-slate-950 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl p-2 bg-black/60 border border-white/10 rounded">
                    {skill.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <h4 className="font-ui font-black text-sm uppercase text-white tracking-wide">
                        {skill.name}
                      </h4>
                      <div className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-black/60 rounded border border-white/10">
                        <span className={isMaxed ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                          LVL {currentLevel}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">{skill.maxLevel}</span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">{skill.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isMaxed && (
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {skill.cost} SP
                    </span>
                  )}
                  <button
                    disabled={!canAfford}
                    onClick={() => handleUpgrade(skill.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 font-ui font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isMaxed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : canAfford
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'bg-slate-850 border border-white/10 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {isMaxed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        MAXED
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        UPGRADE
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
