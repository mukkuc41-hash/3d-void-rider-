import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SUBMODE_10_STAGES,
  getActiveSubmode10Stage,
  getNextSubmode10Stage,
  formatSubmode10Countdown,
} from '../game/submode10Events';
import { COSMIC_100_EVENTS, CosmicEventDefinition } from '../game/catastrophe/cosmicSystems';
import {
  X,
  Search,
  Crosshair,
  ShieldAlert,
  Clock,
  Radio,
  Compass,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';

interface Submode10StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  elapsedSeconds: number; // 0 to 900
  onSkipToZero?: () => void;
}

export const Submode10StagesModal: React.FC<Submode10StagesModalProps> = ({
  isOpen,
  onClose,
  elapsedSeconds,
  onSkipToZero,
}) => {
  const [activeTab, setActiveTab] = useState<'EVENTS_100' | 'ROUTE_STAGES'>('EVENTS_100');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'COMPLETED' | 'UPCOMING'>('ALL');
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Active Stage calculation
  const activeStage = useMemo(() => getActiveSubmode10Stage(elapsedSeconds), [elapsedSeconds]);
  const nextStageInfo = useMemo(() => getNextSubmode10Stage(elapsedSeconds), [elapsedSeconds]);

  // Active Event out of 100 calculation
  const activeEventIndex = useMemo(() => {
    for (let i = 0; i < COSMIC_100_EVENTS.length; i++) {
      if (COSMIC_100_EVENTS[i].triggerTime > elapsedSeconds) {
        return Math.max(1, i); // Previous event is currently active
      }
    }
    return 100;
  }, [elapsedSeconds]);

  const activeEvent = useMemo(
    () => COSMIC_100_EVENTS[activeEventIndex - 1] || COSMIC_100_EVENTS[0],
    [activeEventIndex]
  );

  const nextEvent = useMemo(
    () => (activeEventIndex < 100 ? COSMIC_100_EVENTS[activeEventIndex] : null),
    [activeEventIndex]
  );

  const remainingTimeStr = useMemo(
    () => formatSubmode10Countdown(Math.max(0, 900 - elapsedSeconds), true),
    [elapsedSeconds]
  );

  // Filtered 100 Events
  const filteredEvents = useMemo(() => {
    return COSMIC_100_EVENTS.filter((evt) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        evt.name.toLowerCase().includes(query) ||
        evt.title.toLowerCase().includes(query) ||
        evt.subtitle.toLowerCase().includes(query) ||
        evt.cause.toLowerCase().includes(query) ||
        evt.physicalEffect.toLowerCase().includes(query) ||
        evt.index.toString() === query;

      if (!matchesSearch) return false;

      const isCompleted = evt.index < activeEventIndex;
      const isActive = evt.index === activeEventIndex;
      const isUpcoming = evt.index > activeEventIndex;

      if (filterMode === 'CRITICAL') return evt.severity >= 7.0;
      if (filterMode === 'COMPLETED') return isCompleted;
      if (filterMode === 'UPCOMING') return isUpcoming || isActive;
      return true;
    });
  }, [searchTerm, filterMode, activeEventIndex]);

  // Filtered Stages
  const filteredStages = useMemo(() => {
    return SUBMODE_10_STAGES.filter((st) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        st.name.toLowerCase().includes(query) ||
        st.areaName.toLowerCase().includes(query) ||
        st.hazardDescription.toLowerCase().includes(query) ||
        st.index.toString() === query;

      if (!matchesSearch) return false;

      const isCompleted = st.index < activeStage.index;
      const isActive = st.index === activeStage.index;
      const isUpcoming = st.index > activeStage.index;

      if (filterMode === 'CRITICAL') return st.severity >= 8.0;
      if (filterMode === 'COMPLETED') return isCompleted;
      if (filterMode === 'UPCOMING') return isUpcoming || isActive;
      return true;
    });
  }, [searchTerm, filterMode, activeStage.index]);

  const scrollToActive = () => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Main Holographic Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#050914]/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden text-slate-100 font-mono">
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-950/40 via-black to-purple-950/40">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-xs sm:text-base tracking-wider">
                  SUBMODE 10: 100-EVENT FINAL COLLAPSE CHRONICLES
                </span>
                <span className="px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold bg-purple-500/30 border border-purple-400/50 text-purple-200">
                  TOTAL 100 EVENTS
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-slate-400 font-sans">
                15:00 Universal Clock • 100 Sequential Gravitational Disruption & Catastrophe Events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onSkipToZero && (
              <button
                onClick={() => {
                  onSkipToZero();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white text-[10px] sm:text-xs font-black tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-amber-300/80 cursor-pointer transition-all animate-pulse"
                title="Fast-forward countdown directly to Event 100 (00:00) Final Collapse!"
              >
                <span>⏩</span>
                <span>SKIP 00:00</span>
              </button>
            )}
            <button
              onClick={scrollToActive}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>ACTIVE</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/30 hover:border-red-500/50 border border-slate-700 text-slate-300 hover:text-red-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Active Spotlight Card */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 border-b border-cyan-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-black bg-cyan-400 text-black animate-pulse">
                CURRENT ACTIVE EVENT [#{String(activeEvent.index).padStart(2, '0')} / 100]
              </span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                COUNTDOWN: {remainingTimeStr}
              </span>
            </div>
            {nextEvent && (
              <div className="text-[11px] text-purple-300 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-purple-400" />
                <span>NEXT: [EVENT #{String(nextEvent.index).padStart(2, '0')}] {nextEvent.name}</span>
                <span className="text-cyan-300 font-bold">
                  at T-{nextEvent.countdownTime || formatSubmode10Countdown(Math.max(0, 900 - nextEvent.triggerTime))}
                </span>
              </div>
            )}
          </div>

          <div className="bg-black/60 border border-cyan-400/40 rounded-xl p-3 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-cyan-200">
                  {activeEvent.name}
                </span>
                <span className="text-xs text-slate-400">
                  (Trigger: T-{activeEvent.countdownTime || formatSubmode10Countdown(Math.max(0, 900 - activeEvent.triggerTime))})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    activeEvent.severity >= 8.0
                      ? 'bg-red-500/30 border-red-400 text-red-200'
                      : activeEvent.severity >= 5.0
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                      : 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                  }`}
                >
                  SEVERITY {activeEvent.severity.toFixed(1)} / 10
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-cyan-100 font-sans font-medium leading-relaxed">
              {activeEvent.subtitle || activeEvent.cause}
            </p>
            {activeEvent.physicalEffect && (
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                <span className="text-amber-400 font-bold">Effect:</span> {activeEvent.physicalEffect}
              </p>
            )}
          </div>
        </div>

        {/* Tab & Filter Controls */}
        <div className="p-3 border-b border-cyan-500/20 bg-black/40 flex flex-wrap items-center justify-between gap-2">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('EVENTS_100')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'EVENTS_100'
                  ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>100 COSMIC EVENTS</span>
            </button>
            <button
              onClick={() => setActiveTab('ROUTE_STAGES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ROUTE_STAGES'
                  ? 'bg-purple-500/30 border border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>ROUTE STAGES (93)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event title, effect, index..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-lg pl-9 pr-3 py-1 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {(['ALL', 'CRITICAL', 'COMPLETED', 'UPCOMING'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  filterMode === m
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable List for 100 Events or Stages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
          {activeTab === 'EVENTS_100' ? (
            filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No cosmic events match the selected query.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isActive = evt.index === activeEventIndex;
                const isPast = evt.index < activeEventIndex;
                const isUpcoming = evt.index > activeEventIndex;

                return (
                  <div
                    key={evt.id + evt.index}
                    ref={isActive ? activeItemRef : null}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                        : isPast
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                        : 'bg-black/40 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-cyan-400 text-black'
                              : isPast
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          EVENT #{String(evt.index).padStart(2, '0')}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-200">
                          {evt.name}
                        </span>
                        <span className="text-[11px] text-cyan-400/80 font-mono">
                          [{evt.countdownTime || `T-${formatSubmode10Countdown(Math.max(0, 900 - evt.triggerTime))}`}]
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            evt.severity >= 8.0
                              ? 'text-red-400 bg-red-950/40'
                              : evt.severity >= 5.0
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-cyan-400 bg-cyan-950/40'
                          }`}
                        >
                          SEV {evt.severity.toFixed(1)}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-black text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 animate-pulse">
                            ACTIVE NOW
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {evt.subtitle || evt.cause}
                    </p>
                    {evt.physicalEffect && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        <span className="text-cyan-400/80">Physical Effect:</span> {evt.physicalEffect}
                      </p>
                    )}
                  </div>
                );
              })
            )
          ) : (
            filteredStages.map((st) => {
              const isActive = st.index === activeStage.index;
              const isPast = st.index < activeStage.index;

              return (
                <div
                  key={st.id}
                  ref={isActive ? activeItemRef : null}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-purple-950/50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-400'
                      : isPast
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100'
                      : 'bg-black/40 border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-purple-400 text-black'
                            : isPast
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        STAGE {st.index.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {st.name}
                      </span>
                      <span className="text-[11px] text-purple-400/80 font-mono">
                        [{st.countdownTime}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {st.areaName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          st.severity >= 9.0
                            ? 'text-red-400 bg-red-950/40'
                            : st.severity >= 7.0
                            ? 'text-amber-400 bg-amber-950/40'
                            : 'text-purple-400 bg-purple-950/40'
                        }`}
                      >
                        SEV {st.severity.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {st.hazardDescription}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-cyan-500/20 p-2.5 bg-black/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">
              {activeTab === 'EVENTS_100' ? '100 TOTAL COSMIC EVENTS' : '93 ROUTE EVACUATION STAGES'}
            </span>
            <span>•</span>
            <span>PRESS [C] IN-RACE TO TOGGLE</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            RESUME RACE
          </button>
        </div>
      </div>
    </div>
  );
};
