import React, { useState, useEffect } from 'react';
import {
  Users,
  Play,
  Zap,
  Globe,
  X,
  Swords,
  Trophy,
  Shield,
  Eye,
  Sliders,
  RefreshCw,
  Layers,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  TrackId,
  CustomRoomSettings,
  MultiplayerMode,
  DamageMode,
} from '../types';
import { TRACK_CONFIGS } from '../game/trackData';
import { sound } from '../game/audio';
import { networkClient } from '../network/client';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickMatch: (mode?: MultiplayerMode) => void;
  onCreateRoom: (settings?: CustomRoomSettings, isSpectator?: boolean, team?: 'ALPHA' | 'OMEGA') => void;
  onJoinRoomCode: (code: string, isSpectator?: boolean, team?: 'ALPHA' | 'OMEGA') => void;
}

type ModalTab = 'MODES' | 'CREATE' | 'JOIN' | 'BROWSE';

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onQuickMatch,
  onCreateRoom,
  onJoinRoomCode,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('MODES');
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Room Settings
  const [roomMode, setRoomMode] = useState<MultiplayerMode>('CASUAL');
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('neon_orbit');
  const [laps, setLaps] = useState<number>(2);
  const [aiBots, setAiBots] = useState<boolean>(true);
  const [collisionsEnabled, setCollisionsEnabled] = useState<boolean>(true);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState<boolean>(true);
  const [damageMode, setDamageMode] = useState<DamageMode>('CASUAL');
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [team, setTeam] = useState<'ALPHA' | 'OMEGA'>('ALPHA');

  // Live Public Sectors
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshRooms = async () => {
    setIsRefreshing(true);
    try {
      const rooms = await networkClient.fetchPublicRooms();
      setPublicRooms(rooms);
    } catch {
      // Graceful fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      refreshRooms();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateSubmit = () => {
    sound.playMenuClick();
    const settings: CustomRoomSettings = {
      mode: roomMode,
      trackId: selectedTrack,
      laps,
      aiBots,
      collisionsEnabled,
      powerUpsEnabled,
      damageMode,
    };
    onCreateRoom(settings, isSpectator, team);
    onClose();
  };

  const handleJoinSubmit = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setErrorMessage('Please enter a valid 4 to 6 character sector code.');
      return;
    }
    sound.playMenuClick();
    onJoinRoomCode(trimmed, isSpectator, team);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md pointer-events-auto select-none">
      <div className="w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.25)] text-left relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playMenuClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-cyan-500/20">
          <div className="p-2.5 rounded-2xl bg-cyan-950/70 border border-cyan-400 text-cyan-400 shadow-[0_0_15px_#00f0ff]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                REAL-TIME NETWORKING SYSTEM
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                25Hz SYNC
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-ui font-black uppercase text-white tracking-wider">
              MULTIPLAYER HYPER-CIRCUIT
            </h2>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('MODES');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-ui font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'MODES'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> MODES & QUICK MATCH
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('CREATE');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-ui font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'CREATE'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> CUSTOM SECTOR
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('JOIN');
              setErrorMessage(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-ui font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'JOIN'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> JOIN BY CODE
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('BROWSE');
              setErrorMessage(null);
              refreshRooms();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-ui font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'BROWSE'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> ACTIVE LOBBIES ({publicRooms.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MODES & QUICK MATCH */}
          {activeTab === 'MODES' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Quick Match Button */}
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onQuickMatch('CASUAL');
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#0b1b36] to-[#061021] border border-cyan-500/50 hover:border-cyan-400 text-left transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <span className="font-ui font-black text-sm text-white uppercase tracking-wider">
                        QUICK MATCH
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">
                      INSTANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Automatically match with open public lobbies or generate a populated sector with AI fill.
                  </p>
                </button>

                {/* 1v1 Duel Mode */}
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onCreateRoom({
                      mode: 'DUEL_1V1',
                      trackId: 'neon_orbit',
                      laps: 3,
                      aiBots: false,
                      collisionsEnabled: true,
                      powerUpsEnabled: true,
                      damageMode: 'CASUAL',
                    }, false, 'ALPHA');
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#250d22] to-[#120512] border border-fuchsia-500/50 hover:border-fuchsia-400 text-left transition-all hover:shadow-[0_0_20px_rgba(255,0,229,0.25)] group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40">
                        <Swords className="w-4 h-4" />
                      </div>
                      <span className="font-ui font-black text-sm text-white uppercase tracking-wider">
                        1v1 DUEL
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 text-[9px] font-mono">
                      2 PILOTS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Intense head-to-head showdown with competitive collision rules and precision 3-lap pacing.
                  </p>
                </button>

                {/* Competitive Grand Prix */}
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onCreateRoom({
                      mode: 'COMPETITIVE',
                      trackId: 'circuit_alpha',
                      laps: 3,
                      aiBots: true,
                      collisionsEnabled: true,
                      powerUpsEnabled: false,
                      damageMode: 'SIMULATION',
                    }, false, 'ALPHA');
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#271d09] to-[#140e04] border border-amber-500/50 hover:border-amber-400 text-left transition-all hover:shadow-[0_0_20px_rgba(255,180,0,0.25)] group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span className="font-ui font-black text-sm text-white uppercase tracking-wider">
                        COMPETITIVE CIRCUIT
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                      RANKED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Skill-focused racing with no random power-ups, simulation hull diagnostics, and strict anti-cheat.
                  </p>
                </button>

                {/* Team Race (Alpha vs Omega) */}
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onCreateRoom({
                      mode: 'CASUAL',
                      trackId: 'void_rift',
                      laps: 2,
                      aiBots: true,
                      collisionsEnabled: true,
                      powerUpsEnabled: true,
                      damageMode: 'CASUAL',
                    }, false, 'ALPHA');
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#0a2323] to-[#051111] border border-teal-500/50 hover:border-teal-400 text-left transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-ui font-black text-sm text-white uppercase tracking-wider">
                        FLEET TEAM BATTLE
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-mono">
                      4v4 FLEET
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Divide racers into Alpha Fleet (Cyan) and Omega Fleet (Fuchsia) with collective team points.
                  </p>
                </button>
              </div>

              {/* Role & Spectator Quick Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-ui font-black uppercase text-white">
                      SPECTATOR MODE ARCHITECTURE
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Join as a non-racing tactical observer camera with full player telemetry
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setIsSpectator(!isSpectator);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    isSpectator
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f0ff]'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isSpectator ? 'SPECTATOR ACTIVE' : 'RACER PILOT'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE CUSTOM SECTOR */}
          {activeTab === 'CREATE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mode Selector */}
                <div>
                  <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5">
                    RACE FORMAT
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['CASUAL', 'COMPETITIVE', 'DUEL_1V1', 'QUICK_MATCH'] as MultiplayerMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          sound.playMenuClick();
                          setRoomMode(m);
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-ui font-black uppercase text-center transition-all ${
                          roomMode === m
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_#00f0ff]'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {m === 'DUEL_1V1' ? '1V1 DUEL' : m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Track Selector */}
                <div>
                  <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5">
                    CIRCUIT DESTINATION
                  </label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value as TrackId)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    {Object.entries(TRACK_CONFIGS).map(([id, conf]) => (
                      <option key={id} value={id}>
                        {conf.name} ({conf.length}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Laps & Fleet Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5">
                    NUMBER OF LAPS: {laps}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          sound.playMenuClick();
                          setLaps(count);
                        }}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                          laps === count
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {count} {count === 1 ? 'LAP' : 'LAPS'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5">
                    ASSIGNED FLEET SQUADRON
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setTeam('ALPHA');
                      }}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-ui font-black uppercase transition-all ${
                        team === 'ALPHA'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_#00f0ff]'
                          : 'bg-slate-900 border-slate-800 text-cyan-400'
                      }`}
                    >
                      ALPHA FLEET
                    </button>
                    <button
                      onClick={() => {
                        sound.playMenuClick();
                        setTeam('OMEGA');
                      }}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-ui font-black uppercase transition-all ${
                        team === 'OMEGA'
                          ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400 shadow-[0_0_10px_#ff00e5]'
                          : 'bg-slate-900 border-slate-800 text-fuchsia-400'
                      }`}
                    >
                      OMEGA FLEET
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setAiBots(!aiBots);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono transition-all ${
                    aiBots
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-ui font-black uppercase text-[11px]">AI BOTS</div>
                  <div className="text-[10px]">{aiBots ? 'ENABLED' : 'DISABLED'}</div>
                </button>

                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setCollisionsEnabled(!collisionsEnabled);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono transition-all ${
                    collisionsEnabled
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-ui font-black uppercase text-[11px]">COLLISIONS</div>
                  <div className="text-[10px]">{collisionsEnabled ? 'FULL IMPACT' : 'GHOST MODE'}</div>
                </button>

                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setPowerUpsEnabled(!powerUpsEnabled);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono transition-all ${
                    powerUpsEnabled
                      ? 'bg-fuchsia-950/60 border-fuchsia-500 text-fuchsia-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-ui font-black uppercase text-[11px]">POWER-UPS</div>
                  <div className="text-[10px]">{powerUpsEnabled ? 'ACTIVE' : 'OFF (PURIST)'}</div>
                </button>

                <button
                  onClick={() => {
                    sound.playMenuClick();
                    setDamageMode(damageMode === 'CASUAL' ? 'SIMULATION' : 'CASUAL');
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono transition-all ${
                    damageMode === 'SIMULATION'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-ui font-black uppercase text-[11px]">DAMAGE MODE</div>
                  <div className="text-[10px]">{damageMode === 'SIMULATION' ? 'SIMULATION' : 'ARCADE'}</div>
                </button>
              </div>

              {/* Create Submit Button */}
              <button
                onClick={handleCreateSubmit}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-ui font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_#00f0ff] transition-all mt-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>INITIALIZE CUSTOM SECTOR</span>
              </button>
            </div>
          )}

          {/* TAB 3: JOIN BY CODE */}
          {activeTab === 'JOIN' && (
            <div className="space-y-4 py-3 max-w-md mx-auto">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  DIRECT SECTOR BEACON
                </span>
                <h3 className="text-lg font-ui font-black uppercase text-white">
                  ENTER 6-CHARACTER SECTOR CODE
                </h3>
                <p className="text-xs text-slate-400">
                  Obtain the sector code from your squadron host to sync directly.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="e.g. WARP01"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinSubmit();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 focus:border-cyan-400 text-white font-mono text-center text-2xl uppercase tracking-widest outline-none shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsSpectator(!isSpectator)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                    isSpectator
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {isSpectator ? 'JOIN AS SPECTATOR' : 'JOIN AS RACER'}
                </button>
              </div>

              <button
                onClick={handleJoinSubmit}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-ui font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_#ff00e5] transition-all"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>WARP TO SECTOR</span>
              </button>
            </div>
          )}

          {/* TAB 4: ACTIVE LOBBIES BROWSER */}
          {activeTab === 'BROWSE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  GALACTIC NETWORK HUBS
                </span>
                <button
                  onClick={refreshRooms}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-slate-300 hover:text-white transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>REFRESH</span>
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <p className="text-sm font-ui text-slate-400 uppercase">
                    NO PUBLIC SECTORS CURRENTLY ACTIVE
                  </p>
                  <p className="text-xs text-slate-500">
                    Be the first pilot to create a sector or launch Quick Match to trigger automatic bot fill.
                  </p>
                  <button
                    onClick={() => setActiveTab('CREATE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono uppercase mt-2 hover:bg-cyan-500/30"
                  >
                    <Sliders className="w-3.5 h-3.5" /> CREATE FIRST SECTOR
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.code}
                      className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                          {r.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-ui font-black uppercase text-sm text-white">
                              {r.name || `Sector ${r.code}`}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-300">
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{r.trackId ? TRACK_CONFIGS[r.trackId as TrackId]?.name || r.trackId : 'Neon Orbit'}</span>
                            <span>&middot;</span>
                            <span>{r.laps} LAPS</span>
                            <span>&middot;</span>
                            <span className="text-cyan-300">{r.playerCount} / {r.maxPlayers} PILOTS</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playMenuClick();
                          onJoinRoomCode(r.code);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 text-xs font-ui font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shrink-0"
                      >
                        <span>WARP IN</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AUTHORITATIVE WEBSOCKET NETWORKING ACTIVE</span>
          </div>
          <span>CROSS-PLATFORM DESKTOP & MOBILE</span>
        </div>
      </div>
    </div>
  );
};
