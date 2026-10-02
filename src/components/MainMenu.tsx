import React, { useState } from 'react';
import {
  Play,
  Bot,
  Users,
  Wrench,
  Trophy,
  User,
  Settings,
  Zap,
  Globe,
  Timer,
  Radio,
  Medal,
  ChevronDown,
  ChevronUp,
  Layers,
  X,
} from 'lucide-react';
import { sound } from '../game/audio';
import { getShipConfig } from '../game/ships';
import { ShowcaseBento } from './ShowcaseBento';

interface MainMenuProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onQuickMatch: () => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onOpenMultiplayer?: () => void;
  onOpenAIRace: () => void;
  onOpenGameModes: () => void;
  onOpenGarage: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboards: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenSpaceHub?: () => void;
  onOpenStory?: () => void;
  credits: number;
  playerLevel: number;
  ping: number;
  isConnected: boolean;
  currentShipId?: string;
  onStartGameMode?: (mode: 'TIME_TRIAL' | 'SURVIVAL') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onUpdatePlayerName,
  onQuickMatch,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenMultiplayer,
  onOpenAIRace,
  onOpenGameModes,
  onOpenGarage,
  onOpenMissions,
  onOpenLeaderboards,
  onOpenProfile,
  onOpenSettings,
  onOpenSpaceHub,
  onOpenStory,
  credits,
  playerLevel,
  ping,
  isConnected,
  currentShipId = 'vortex_nemesis',
  onStartGameMode,
}) => {
  const [showBriefing, setShowBriefing] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);

  const shipConfig = getShipConfig(currentShipId);
  const currentShipName = shipConfig?.name || 'Vortex Nemesis';

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto pointer-events-none">
      {/* Top Bar Navigation & Status */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        {/* Node Online Status */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#060e1c]/85 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.18)] backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
          <span className="font-mono text-xs text-cyan-300 font-bold tracking-wider">
            NODE ONLINE // SYNCED
          </span>
        </div>

        {/* Pilot Profile & Settings Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenProfile();
            }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#060e1c]/85 border border-slate-700/80 hover:border-cyan-400/80 transition-all text-left group shadow-lg backdrop-blur-md"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#ff6600]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider leading-none">
                PILOT PROFILE
              </span>
              <span className="text-xs font-ui font-black uppercase text-white tracking-wider leading-tight mt-0.5">
                {playerName}
              </span>
            </div>
            <User className="w-4 h-4 text-cyan-400 ml-1 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-[#060e1c]/85 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Central Interactive Menu Hub */}
      <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col items-center text-center space-y-2.5 py-2 pointer-events-auto">
        {/* Hyper-Circuit Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#050b14]/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            MULTIPLAYER 3D HYPER-CIRCUIT
          </span>
        </div>

        {/* Title VOID-RIDER 3D */}
        <h1 className="text-4xl sm:text-5xl font-black italic tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_22px_rgba(0,240,255,0.95)] font-ui">
          VOID-RIDER 3D
        </h1>

        {/* Subtitle RACE BEYOND LIMITS */}
        <div className="text-base sm:text-lg font-black italic tracking-widest text-fuchsia-400 uppercase drop-shadow-[0_0_15px_rgba(255,0,229,0.85)] font-ui -mt-2">
          RACE BEYOND LIMITS
        </div>

        {/* Description Paragraph */}
        <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed font-sans px-1">
          High-velocity cosmic hyper-racing. Pilot anti-gravity interceptors, hit warp boost pads, collect tactical power-ups, and race online with up to 8 players.
        </p>

        {/* Giant Primary PLAY Button */}
        <button
          onClick={() => {
            sound.playMenuClick();
            onQuickMatch();
          }}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-600 to-fuchsia-500 hover:opacity-95 active:scale-[0.98] transition-all text-white font-ui font-black text-lg tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.45)] mt-1 group"
        >
          <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
          <span>PLAY</span>
        </button>

        {/* 2-Column Action Grid (4 Rows) */}
        <div className="grid grid-cols-2 gap-2 w-full pt-0.5">
          {/* MULTIPLAYER */}
          <button
            onClick={() => {
              sound.playMenuClick();
              if (onOpenMultiplayer) {
                onOpenMultiplayer();
              } else {
                setShowMultiplayerModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#091222]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>MULTIPLAYER</span>
          </button>

          {/* AI RACE */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenAIRace();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#140b1e]/90 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(255,0,229,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Bot className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>AI RACE</span>
          </button>

          {/* TIME TRIAL */}
          <button
            onClick={() => {
              sound.playMenuClick();
              if (onStartGameMode) {
                onStartGameMode('TIME_TRIAL');
              } else {
                onOpenGameModes();
              }
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#091222]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>TIME TRIAL</span>
          </button>

          {/* SURVIVAL */}
          <button
            onClick={() => {
              sound.playMenuClick();
              if (onStartGameMode) {
                onStartGameMode('SURVIVAL');
              } else {
                onOpenGameModes();
              }
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1a0a14]/90 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(255,50,100,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>SURVIVAL</span>
          </button>

          {/* GARAGE */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenGarage();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#091222]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          {/* MISSIONS */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenMissions();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#091816]/90 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,255,150,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>MISSIONS</span>
          </button>

          {/* LEADERBOARDS */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenLeaderboards();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#191408]/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(255,180,0,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            <span>LEADERBOARDS</span>
          </button>

          {/* SETTINGS */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#091222]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>SETTINGS</span>
          </button>

          {/* SPACE HUB */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenSpaceHub?.();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#061e26]/90 border border-teal-500/40 hover:border-teal-400 text-teal-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>SPACE HUB</span>
          </button>

          {/* STORY CAMPAIGN */}
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenStory?.();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1d0922]/90 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-[0.98] backdrop-blur-md"
          >
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>STORY</span>
          </button>
        </div>

        {/* Full-Width PROFILE Button */}
        <button
          onClick={() => {
            sound.playMenuClick();
            onOpenProfile();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#120b22]/90 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-ui font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all active:scale-[0.98] backdrop-blur-md"
        >
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span>PROFILE</span>
        </button>

        {/* Current Interceptor Bar */}
        <div className="w-full p-2.5 px-3.5 rounded-xl bg-[#070e1b]/90 border border-slate-800 flex items-center justify-between backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#ff6600]" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider leading-none">
                CURRENT INTERCEPTOR
              </span>
              <span className="text-xs font-ui font-black uppercase tracking-wider text-white leading-tight mt-0.5">
                {currentShipName}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenGarage();
            }}
            className="text-[11px] font-ui font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 tracking-wider uppercase group"
          >
            <span>SHIPYARD</span>
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </button>
        </div>

        {/* Collapsible 5-Feature Briefing Toggle Button */}
        <button
          onClick={() => {
            sound.playMenuClick();
            setShowBriefing(!showBriefing);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#070e1b]/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[10.5px] font-ui font-black uppercase tracking-widest shadow-lg transition-all backdrop-blur-md cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIEW 5-FEATURE BRIEFING</span>
          {showBriefing ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {/* 5-Feature Briefing Accordion Expansion */}
        {showBriefing && (
          <div className="w-full mt-3 transition-all animate-fadeIn">
            <ShowcaseBento />
          </div>
        )}
      </div>

      {/* Bottom Bar: Sync and Control Guidelines */}
      <div className="flex items-end justify-between w-full max-w-6xl mx-auto pointer-events-none">
        <div className="text-left font-mono pointer-events-auto">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold tracking-wider">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>AUTHORITATIVE 25HZ SYNC</span>
          </div>
          <div className="text-[10px] text-cyan-300/75 tracking-wider mt-0.5">
            [WASD] DRIVE &middot; [SPACE] BOOST &middot; [SHIFT] DRIFT
          </div>
        </div>
      </div>

      {/* Multiplayer Sector Matchmaking Dialog */}
      {showMultiplayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.25)] text-left relative">
            <button
              onClick={() => setShowMultiplayerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-ui font-black uppercase text-white tracking-wider">
                Multiplayer Hyper-Circuit
              </h2>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Engage with pilots across the galaxy or create a dedicated private sector code.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowMultiplayerModal(false);
                  onQuickMatch();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-ui font-black uppercase text-xs tracking-wider flex items-center justify-between hover:opacity-95 shadow-md"
              >
                <span>QUICK MATCH (AUTOMATIC FINDER)</span>
                <Play className="w-4 h-4 fill-slate-950" />
              </button>

              <button
                onClick={() => {
                  setShowMultiplayerModal(false);
                  onOpenCreateRoom();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-ui font-black uppercase text-xs tracking-wider flex items-center justify-between hover:bg-cyan-950/40"
              >
                <span>CREATE PRIVATE SECTOR</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => {
                  setShowMultiplayerModal(false);
                  onOpenJoinRoom();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 font-ui font-black uppercase text-xs tracking-wider flex items-center justify-between hover:bg-fuchsia-950/40"
              >
                <span>JOIN SECTOR CODE</span>
                <Globe className="w-4 h-4 text-fuchsia-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
