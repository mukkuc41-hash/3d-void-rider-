import React from 'react';
import {
  Users,
  Play,
  Bot,
  CheckCircle2,
  XCircle,
  Copy,
  LogOut,
  MapPin,
  Flag,
  RotateCcw,
  Sparkles,
  Eye,
  Shield,
  Zap,
  Swords,
  Layers,
} from 'lucide-react';
import { PlayerInfo, RoomState, TrackId, CustomRoomSettings } from '../types';
import { TRACK_CONFIGS } from '../game/trackData';
import { sound } from '../game/audio';

interface LobbyViewProps {
  room: RoomState;
  playerId: string;
  onSetReady: (ready: boolean) => void;
  onStartRace: () => void;
  onAddBot: () => void;
  onSelectTrack: (trackId: TrackId) => void;
  onLeaveRoom: () => void;
  onOpenGarage: () => void;
  onToggleTeam?: () => void;
  onToggleRole?: () => void;
  onUpdateSettings?: (settings: CustomRoomSettings) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  playerId,
  onSetReady,
  onStartRace,
  onAddBot,
  onSelectTrack,
  onLeaveRoom,
  onOpenGarage,
  onToggleTeam,
  onToggleRole,
  onUpdateSettings,
}) => {
  const isHost = room.hostId === playerId;
  const currentPlayer = room.players?.[playerId];
  const allReady = Object.values(room.players || {}).every((p: PlayerInfo) => p.isReady || p.isBot || p.isSpectator);
  const trackId = room.trackId || 'circuit_alpha';
  const trackConfig = TRACK_CONFIGS[trackId] || TRACK_CONFIGS.circuit_alpha;
  const roomCode = room.id || room.code || 'WARP01';
  const settings = room.settings;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    sound.playMenuClick();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md text-slate-100 select-none">
      <div className="w-full max-w-4xl bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Top Room Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400 text-cyan-400 shadow-[0_0_15px_#00f0ff]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  WARP SECTOR LOBBY
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                  {Object.keys(room.players).length} / {room.maxPlayers} PILOTS
                </span>
                {settings?.mode && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    {settings.mode === 'DUEL_1V1' ? '1v1 DUEL' : settings.mode}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-ui font-black uppercase text-white tracking-wider">
                {roomCode}
              </h2>
            </div>
          </div>

          {/* Room ID Copy & Exit */}
          <div className="flex items-center gap-3">
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all text-xs font-mono"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              COPY SECTOR CODE
            </button>
            <button
              onClick={() => {
                sound.playMenuClick();
                onLeaveRoom();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white transition-all text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              LEAVE
            </button>
          </div>
        </div>

        {/* Sector Rules & Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 uppercase text-[10px] tracking-wider">RULES:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
            {settings?.collisionsEnabled ? 'IMPACT COLLISIONS' : 'GHOST NO-CLIP'}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-fuchsia-300">
            {settings?.powerUpsEnabled ? 'TACTICAL POWER-UPS ON' : 'POWER-UPS OFF (PURIST)'}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300">
            {settings?.damageMode === 'SIMULATION' ? 'SIMULATION DAMAGE' : 'ARCADE DAMAGE'}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
            {room.laps} LAPS
          </span>

          {/* Quick Player Team/Role Toggles */}
          <div className="ml-auto flex items-center gap-2">
            {onToggleTeam && (
              <button
                onClick={() => {
                  sound.playMenuClick();
                  onToggleTeam();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-ui font-black uppercase transition-all ${
                  currentPlayer?.team === 'ALPHA'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-fuchsia-500 text-slate-950'
                }`}
              >
                {currentPlayer?.team === 'ALPHA' ? 'ALPHA FLEET' : 'OMEGA FLEET'}
              </button>
            )}

            {onToggleRole && (
              <button
                onClick={() => {
                  sound.playMenuClick();
                  onToggleRole();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1 ${
                  currentPlayer?.isSpectator
                    ? 'bg-cyan-950 border border-cyan-400 text-cyan-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>{currentPlayer?.isSpectator ? 'SPECTATOR' : 'RACER'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle Section: Player List + Track Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pilots Grid (2 Cols on md) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                ACTIVE ROSTER ({Object.keys(room.players).length})
              </span>
              {isHost && (
                <button
                  onClick={() => {
                    sound.playMenuClick();
                    onAddBot();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-all"
                >
                  <Bot className="w-3.5 h-3.5" /> + ADD AI BOT
                </button>
              )}
            </div>

            <div className="space-y-2">
              {Object.entries(room.players || {}).map(([id, rawPlayer]) => {
                const player = rawPlayer as PlayerInfo;
                const isMe = id === playerId;
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-cyan-950/30 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl shadow-md flex items-center justify-center border border-white/20"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.isBot ? (
                          <Bot className="w-4 h-4 text-slate-950" />
                        ) : player.isSpectator ? (
                          <Eye className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-ui font-black uppercase text-sm text-white">
                            {player.name}
                          </span>
                          {player.team && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-ui font-black uppercase ${
                                player.team === 'ALPHA'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                              }`}
                            >
                              {player.team}
                            </span>
                          )}
                          {player.isSpectator && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono">
                              OBSERVER
                            </span>
                          )}
                          {id === room.hostId && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                              HOST
                            </span>
                          )}
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {player.isSpectator ? 'TACTICAL OBSERVER' : player.shipId ? player.shipId.replace('_', ' ').toUpperCase() : 'INTERCEPTOR'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {player.isReady || player.isBot || player.isSpectator ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{player.isSpectator ? 'MONITORING' : 'READY'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                          <XCircle className="w-4 h-4" />
                          <span>TUNING</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Track Map Selector */}
          <div className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> CIRCUIT DESTINATION
              </span>
              <h3 className="text-xl font-ui font-black uppercase text-white mt-0.5">
                {trackConfig.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {trackConfig.description}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">TRACK LENGTH:</span>
                <span className="text-cyan-300 font-bold">{trackConfig.length} METERS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RACE DURATION:</span>
                <span className="text-cyan-300 font-bold">{trackConfig.laps} LAPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HAZARDS:</span>
                <span className="text-rose-400 font-bold">ASTEROIDS & SHIFTS</span>
              </div>
            </div>

            {/* Track Selector for Host */}
            {isHost && (
              <div className="mt-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block mb-2">
                  SELECT TRACK:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TRACK_CONFIGS).map(([tid, conf]) => (
                    <button
                      key={tid}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectTrack(tid as TrackId);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all text-xs font-mono font-bold ${
                        room.trackId === tid
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_#00f0ff]'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {conf.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cyan-500/20">
          <button
            onClick={() => {
              sound.playMenuClick();
              onOpenGarage();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 font-ui font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" /> OPEN WORKSHOP
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            {/* Ready Toggle */}
            <button
              onClick={() => {
                sound.playMenuClick();
                onSetReady(!currentPlayer?.isReady);
              }}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-ui font-black text-xs uppercase tracking-widest transition-all ${
                currentPlayer?.isReady
                  ? 'bg-slate-800 border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(57,255,20,0.2)]'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(57,255,20,0.4)]'
              }`}
            >
              {currentPlayer?.isReady ? 'CANCEL READY' : 'SET READY'}
            </button>

            {/* Launch Race Button (Host only) */}
            {isHost && (
              <button
                disabled={!allReady}
                onClick={() => {
                  sound.playMenuClick();
                  onStartRace();
                }}
                className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl font-ui font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  allReady
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_#00f0ff]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current" /> LAUNCH RACE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
