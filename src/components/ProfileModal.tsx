import React, { useState } from 'react';
import { User, X, Edit2, Check, Shield, Trophy, Zap, Gauge, Award } from 'lucide-react';
import { PlayerProgression } from '../types';
import { sound } from '../game/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: PlayerProgression;
  onUpdateName: (name: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  progression,
  onUpdateName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(progression.playerName);

  if (!isOpen) return null;

  const handleSave = () => {
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim());
    }
    setIsEditing(false);
  };

  const nextLvlXp = progression.level * 1000;
  const currentLvlXp = progression.xp % 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-400 text-cyan-400 shadow-[0_0_15px_#00f0ff]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-ui font-black uppercase tracking-wider text-white">
                PILOT DOSSIER
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Telemetry records, flight credentials, and license prestige
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity & Rank */}
        <div className="my-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              CALLSIGN
            </span>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  maxLength={16}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-400 text-white font-ui font-black text-sm uppercase focus:outline-none"
                />
                <button
                  onClick={handleSave}
                  className="p-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-xl font-ui font-black uppercase text-white">
                  {progression.playerName}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-cyan-400"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-400">PILOT LICENSE</span>
            <span className="text-lg font-ui font-black text-cyan-400">
              TIER {progression.level}
            </span>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-slate-400">EXPERIENCE PRESTIGE</span>
            <span className="text-cyan-400 font-bold">
              {currentLvlXp} / 1000 XP
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]"
              style={{ width: `${(currentLvlXp / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> RACES WON
            </span>
            <span className="text-xl font-ui font-black text-white">
              {progression.stats.racesWon} / {progression.stats.racesCompleted}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED REACHED
            </span>
            <span className="text-xl font-ui font-black text-cyan-400">
              {progression.stats.topSpeedReached} <span className="text-xs text-slate-500">KM/H</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" /> TOTAL DRIFT TIME
            </span>
            <span className="text-xl font-ui font-black text-white">
              {Math.round(progression.stats.totalDriftSeconds)} <span className="text-xs text-slate-500">SEC</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> HAZARDS EVADED
            </span>
            <span className="text-xl font-ui font-black text-emerald-400">
              {progression.stats.asteroidsAvoided}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-cyan-500/20">
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_15px_#00f0ff] transition-all"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
