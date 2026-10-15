import React, { useState } from 'react';
import {
  Trophy,
  X,
  Play,
  RotateCcw,
  Flame,
  Award,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import {
  CHAMPIONSHIP_CUPS,
  championshipCups,
} from '../game/championshipCups';
import { ChampionshipCupId } from '../types';

interface ChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStage: (trackId: string, laps: number) => void;
  playerName: string;
  playerLevel: number;
  currentShipId: string;
  currentShipName: string;
}

export const ChampionshipModal: React.FC<ChampionshipModalProps> = ({
  isOpen,
  onClose,
  onStartStage,
  playerName,
  playerLevel,
  currentShipId,
  currentShipName,
}) => {
  const [selectedCupId, setSelectedCupId] = useState<ChampionshipCupId>('BRONZE_COMET');
  const currentState = championshipCups.getState();
  const activeCup = championshipCups.getActiveCup();

  if (!isOpen) return null;

  const currentCupConfig =
    CHAMPIONSHIP_CUPS.find((c) => c.id === (currentState ? currentState.cupId : selectedCupId)) ||
    CHAMPIONSHIP_CUPS[0];

  const handleStartOrContinue = () => {
    if (!currentState) {
      // Start cup
      championshipCups.startCup(selectedCupId, playerName, currentShipId, currentShipName);
      const updated = championshipCups.getActiveCup();
      if (updated && updated.stages.length > 0) {
        onStartStage(updated.stages[0].trackId, updated.stages[0].laps);
        onClose();
      }
    } else {
      // Continue next stage
      const stage = currentCupConfig.stages[currentState.currentStageIndex];
      if (stage) {
        onStartStage(stage.trackId, stage.laps);
        onClose();
      }
    }
  };

  const handleAbandon = () => {
    if (confirm('Are you sure you want to abandon the current championship tournament?')) {
      championshipCups.abandonCup();
    }
  };

  const currentStage = currentState ? currentCupConfig.stages[currentState.currentStageIndex] : currentCupConfig.stages[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-amber-500/30 flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(251,191,36,0.15)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-ui font-black uppercase tracking-widest text-white flex items-center gap-2">
                GALACTIC GRAND PRIX CUPS
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono font-normal">
                  OFFICIAL TOURNAMENT
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span>PILOT: {playerName}</span>
                <span aria-hidden="true">·</span>
                <span>LEVEL {playerLevel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Cups Selector Tabs (if no active tournament, allow picking; if active, show locked in) */}
          {!currentState ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHAMPIONSHIP_CUPS.map((cup) => {
                const isLocked = playerLevel < cup.requiredLevel;
                const isSelected = selectedCupId === cup.id;

                return (
                  <button
                    key={cup.id}
                    disabled={isLocked}
                    onClick={() => setSelectedCupId(cup.id)}
                    className={`flex flex-col p-3.5 border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : isLocked
                        ? 'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed'
                        : 'border-white/10 bg-slate-900/70 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Trophy
                        className="w-5 h-5"
                        style={{ color: cup.trophyColor }}
                      />
                      {isLocked ? (
                        <span className="text-[10px] font-mono text-red-400">LVL {cup.requiredLevel}</span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400">
                          +{cup.rewardCredits} CR
                        </span>
                      )}
                    </div>
                    <span className="font-ui font-black text-xs text-white uppercase tracking-wider">
                      {cup.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-2">
                      {cup.description}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <Trophy
                  className="w-6 h-6"
                  style={{ color: currentCupConfig.trophyColor }}
                />
                <div>
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-widest">
                    ACTIVE TOURNAMENT IN PROGRESS
                  </span>
                  <h3 className="font-ui font-black text-white text-base tracking-wider uppercase">
                    {currentCupConfig.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleAbandon}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/30 hover:bg-red-500/10 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ABANDON TOURNAMENT
              </button>
            </div>
          )}

          {/* Current Stage Card & Next Race Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 p-4 bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  {currentState
                    ? `STAGE ${currentState.currentStageIndex + 1} OF ${currentCupConfig.stages.length}`
                    : `STAGE 1 OF ${currentCupConfig.stages.length}`}
                </span>
                <h4 className="font-ui font-black text-lg text-white mt-1 uppercase">
                  {currentStage?.trackName || 'Alpha Speedway'}
                </h4>
                <div className="flex flex-col gap-1.5 text-xs font-mono text-slate-400 mt-3">
                  <div className="flex justify-between">
                    <span>BIOME:</span>
                    <span className="text-white font-bold">{currentStage?.biome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LAPS:</span>
                    <span className="text-white font-bold">{currentStage?.laps} LAPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HAZARDS:</span>
                    <span
                      className={`font-bold ${
                        currentStage?.hazardLevel === 'EXTREME'
                          ? 'text-red-400'
                          : currentStage?.hazardLevel === 'HIGH'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {currentStage?.hazardLevel}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartOrContinue}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-ui font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.4)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                {currentState ? 'LAUNCH NEXT STAGE' : 'ENTER CHAMPIONSHIP'}
              </button>
            </div>

            {/* Standings Table */}
            <div className="md:col-span-2 p-4 bg-slate-900/80 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-widest">
                  PILOT STANDINGS // POINTS LEADERBOARD
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  SYSTEM: 25-18-15-12-10-8-6-4 PTS
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                {(currentState?.standings || [
                  { pilotId: 'player', name: playerName, shipName: currentShipName, points: 0, isPlayer: true, wins: 0, podiums: 0 },
                  { pilotId: 'r1', name: 'Nyx Shadow', shipName: 'Black Phoenix', points: 0, isPlayer: false, wins: 0, podiums: 0 },
                  { pilotId: 'r2', name: 'Lyra Vance', shipName: 'Nebula Dart', points: 0, isPlayer: false, wins: 0, podiums: 0 },
                  { pilotId: 'r3', name: 'Orion Drake', shipName: 'Solar Wing', points: 0, isPlayer: false, wins: 0, podiums: 0 },
                  { pilotId: 'r4', name: 'Kaelen Voss', shipName: 'Aegis Cruiser', points: 0, isPlayer: false, wins: 0, podiums: 0 },
                ]).map((driver, index) => (
                  <div
                    key={driver.pilotId}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors ${
                      driver.isPlayer
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                        : 'bg-slate-950/50 border border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-bold text-slate-400">#{index + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-white font-ui font-black tracking-wide uppercase">
                          {driver.name} {driver.isPlayer && '(YOU)'}
                        </span>
                        <span className="text-[10px] text-slate-400">{driver.shipName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="text-[11px] text-slate-400">{driver.wins} W</span>
                      <span className="text-[11px] text-slate-400">{driver.podiums} POD</span>
                      <span className="w-12 text-center text-sm font-bold text-amber-400">
                        {driver.points} PTS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
