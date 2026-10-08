import React, { useState } from 'react';
import { Trophy, X, Clock, CheckCircle2 } from 'lucide-react';
import { LeaderboardEntry, TrackId } from '../types';
import { sound } from '../game/audio';

interface LeaderboardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries?: LeaderboardEntry[];
  currentTrackId?: TrackId;
  onSelectTrack?: (trackId: TrackId) => void;
  userBestLap?: string;
}

interface SeedPilot {
  rank: number;
  callsign: string;
  bestLap: string;
  verified: boolean;
}

const SEED_PILOTS_BY_TRACK: Record<string, SeedPilot[]> = {
  circuit_alpha: [
    { rank: 1, callsign: 'Viper-X', bestLap: '00:47.250', verified: true },
    { rank: 2, callsign: 'Kaelen Void', bestLap: '00:48.100', verified: true },
    { rank: 3, callsign: 'Nova-7', bestLap: '00:49.399', verified: true },
    { rank: 4, callsign: 'Aero-99', bestLap: '00:50.799', verified: true },
    { rank: 5, callsign: 'Titan-V', bestLap: '00:52.100', verified: true },
  ],
  asteroid_run: [
    { rank: 1, callsign: 'Titan-V', bestLap: '00:51.340', verified: true },
    { rank: 2, callsign: 'Viper-X', bestLap: '00:52.180', verified: true },
    { rank: 3, callsign: 'Kaelen Void', bestLap: '00:53.020', verified: true },
    { rank: 4, callsign: 'Aero-99', bestLap: '00:54.600', verified: true },
    { rank: 5, callsign: 'Nova-7', bestLap: '00:55.980', verified: true },
  ],
  void_rift: [
    { rank: 1, callsign: 'Kaelen Void', bestLap: '00:49.850', verified: true },
    { rank: 2, callsign: 'Nova-7', bestLap: '00:50.410', verified: true },
    { rank: 3, callsign: 'Viper-X', bestLap: '00:51.200', verified: true },
    { rank: 4, callsign: 'Titan-V', bestLap: '00:53.150', verified: true },
    { rank: 5, callsign: 'Aero-99', bestLap: '00:54.200', verified: true },
  ],
  cosmic_ring: [
    { rank: 1, callsign: 'Aero-99', bestLap: '00:46.900', verified: true },
    { rank: 2, callsign: 'Viper-X', bestLap: '00:47.450', verified: true },
    { rank: 3, callsign: 'Kaelen Void', bestLap: '00:48.200', verified: true },
    { rank: 4, callsign: 'Nova-7', bestLap: '00:49.120', verified: true },
    { rank: 5, callsign: 'Titan-V', bestLap: '00:50.800', verified: true },
  ],
  quantum_highway: [
    { rank: 1, callsign: 'Nova-7', bestLap: '00:45.320', verified: true },
    { rank: 2, callsign: 'Viper-X', bestLap: '00:46.100', verified: true },
    { rank: 3, callsign: 'Aero-99', bestLap: '00:47.050', verified: true },
    { rank: 4, callsign: 'Kaelen Void', bestLap: '00:47.880', verified: true },
    { rank: 5, callsign: 'Titan-V', bestLap: '00:49.500', verified: true },
  ],
};

const TRACK_TABS: { id: TrackId; name: string }[] = [
  { id: 'circuit_alpha', name: 'NEON ORBIT' },
  { id: 'asteroid_run', name: 'ASTEROID RUN' },
  { id: 'void_rift', name: 'VOID RIFT' },
  { id: 'cosmic_ring', name: 'COSMIC RING' },
  { id: 'quantum_highway', name: 'QUANTUM HIGHWAY' },
];

export const LeaderboardsModal: React.FC<LeaderboardsModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentTrackId = 'circuit_alpha',
  onSelectTrack,
  userBestLap = '--:--.---',
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>(currentTrackId);
  const [selectedMode, setSelectedMode] = useState<'STANDARD' | 'TIME_TRIAL' | 'SURVIVAL'>('STANDARD');

  if (!isOpen) return null;

  const pilots = SEED_PILOTS_BY_TRACK[selectedTrack] || SEED_PILOTS_BY_TRACK['circuit_alpha'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#060c18]/95 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1404] border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(255,180,0,0.25)] shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-ui font-black uppercase tracking-wider text-white">
                INTERSTELLAR LEADERBOARDS & RECORDS
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Official verified lap splits across all solar federation circuits.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-full bg-[#1c1404] border border-amber-500/60 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
              GLOBAL NETWORK
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

        {/* Track Filter Pills */}
        <div className="flex items-center gap-2 my-3 overflow-x-auto pb-1">
          {TRACK_TABS.map(tab => {
            const isSelected = selectedTrack === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playMenuClick();
                  setSelectedTrack(tab.id);
                  if (onSelectTrack) onSelectTrack(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-[#060e1b] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Mode Filter & Best Lap Row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'STANDARD', label: 'STANDARD' },
              { id: 'TIME_TRIAL', label: 'TIME TRIAL' },
              { id: 'SURVIVAL', label: 'SURVIVAL' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  sound.playMenuClick();
                  setSelectedMode(m.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  selectedMode === m.id
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_#9333ea]'
                    : 'bg-[#060e1b] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* User's Best Lap */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#060e1b] border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>YOUR BEST LAP:</span>
            <span className="text-white">{userBestLap}</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="w-full bg-[#060e1b]/90 border border-slate-800/80 rounded-2xl overflow-hidden text-left">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">RANK</div>
            <div className="col-span-4">PILOT CALLSIGN</div>
            <div className="col-span-3 text-center">BEST LAP</div>
            <div className="col-span-3 text-right">STATUS</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-850">
            {pilots.map(pilot => {
              return (
                <div
                  key={pilot.rank}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-cyan-950/20 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center">
                    {pilot.rank === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-ui font-black text-xs flex items-center justify-center shadow-[0_0_8px_#f59e0b]">
                        1
                      </span>
                    ) : pilot.rank === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-ui font-black text-xs flex items-center justify-center shadow-[0_0_8px_#cbd5e1]">
                        2
                      </span>
                    ) : pilot.rank === 3 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-ui font-black text-xs flex items-center justify-center shadow-[0_0_8px_#b45309]">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-400 pl-1.5">
                        #{pilot.rank}
                      </span>
                    )}
                  </div>

                  {/* Callsign */}
                  <div className="col-span-4 font-ui font-black text-xs uppercase tracking-wider text-white truncate">
                    {pilot.callsign}
                  </div>

                  {/* Best Lap */}
                  <div className="col-span-3 text-center font-mono font-bold text-xs text-cyan-400">
                    {pilot.bestLap}
                  </div>

                  {/* Status */}
                  <div className="col-span-3 flex justify-end">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      VERIFIED
                    </span>
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
