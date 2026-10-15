import React, { useEffect, useRef, useState } from 'react';
import {
  Wrench,
  X,
  Play,
  Plus,
  Trash2,
  Share2,
  Download,
  Copy,
  Check,
  Zap,
  Circle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { TrackBuilderEngine } from '../game/trackBuilderEngine';
import { CustomTrackNode } from '../types';

interface TrackBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestDrive: (trackNodes: CustomTrackNode[]) => void;
}

export const TrackBuilderModal: React.FC<TrackBuilderModalProps> = ({
  isOpen,
  onClose,
  onTestDrive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TrackBuilderEngine | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [nodeCount, setNodeCount] = useState<number>(6);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [currentNode, setCurrentNode] = useState<CustomTrackNode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const engine = new TrackBuilderEngine();
    engineRef.current = engine;

    if (containerRef.current) {
      engine.attachCanvas(containerRef.current);
      setNodeCount(engine.nodes.length);
      setSelectedIdx(engine.selectedNodeIndex);
      setCurrentNode(engine.nodes[engine.selectedNodeIndex] || null);
    }

    // Pointer events for orbiting camera in canvas
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !engineRef.current) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      engineRef.current.rotateCamera(-dx, -dy);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!engineRef.current) return;
      engineRef.current.zoomCamera(e.deltaY);
    };

    const canvasContainer = containerRef.current;
    if (canvasContainer) {
      canvasContainer.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      canvasContainer.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (canvasContainer) {
        canvasContainer.removeEventListener('mousedown', handleMouseDown);
        canvasContainer.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      engine.dispose();
      engineRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectNode = (idx: number) => {
    if (!engineRef.current) return;
    engineRef.current.selectedNodeIndex = idx;
    setSelectedIdx(idx);
    setCurrentNode(engineRef.current.nodes[idx] || null);
    engineRef.current.rebuildTrack();
  };

  const handleAddNode = () => {
    if (!engineRef.current) return;
    engineRef.current.addNode();
    setNodeCount(engineRef.current.nodes.length);
    setSelectedIdx(engineRef.current.selectedNodeIndex);
    setCurrentNode(engineRef.current.nodes[engineRef.current.selectedNodeIndex] || null);
  };

  const handleDeleteNode = () => {
    if (!engineRef.current) return;
    engineRef.current.deleteSelectedNode();
    setNodeCount(engineRef.current.nodes.length);
    setSelectedIdx(engineRef.current.selectedNodeIndex);
    setCurrentNode(engineRef.current.nodes[engineRef.current.selectedNodeIndex] || null);
  };

  const handleUpdateCurrentNode = (partial: Partial<CustomTrackNode>) => {
    if (!engineRef.current) return;
    engineRef.current.updateSelectedNode(partial);
    setCurrentNode({ ...engineRef.current.nodes[selectedIdx], ...partial });
  };

  const handleExport = () => {
    if (!engineRef.current) return;
    const code = engineRef.current.exportTrackCode();
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleImport = () => {
    if (!engineRef.current || !importText) return;
    const ok = engineRef.current.importTrackCode(importText);
    if (ok) {
      setNodeCount(engineRef.current.nodes.length);
      setSelectedIdx(0);
      setCurrentNode(engineRef.current.nodes[0] || null);
      setShowImportDialog(false);
      setImportText('');
    } else {
      alert('Invalid track code. Please verify the code string.');
    }
  };

  const handleTestDriveCircuit = () => {
    if (!engineRef.current) return;
    onTestDrive(engineRef.current.nodes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full h-full max-w-6xl max-h-[92vh] bg-slate-950 border border-cyan-500/30 flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden relative">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-900/90 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-ui font-black uppercase tracking-widest text-white flex items-center gap-2">
                3D TRACK ARCHITECT // CIRCUIT BUILDER
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>DRAG MOUSE TO ORBIT</span>
                <span aria-hidden="true">·</span>
                <span>SCROLL TO ZOOM</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400">{nodeCount} NODES CONNECTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-mono cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'CODE COPIED!' : 'SHARE CODE'}
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              IMPORT
            </button>
            <button
              onClick={handleTestDriveCircuit}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-ui font-black text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              TEST DRIVE
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace: 3D Viewport + Floating Toolbars */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* 3D Canvas Mount */}
          <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {/* Floating Left Node Palette */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleAddNode}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs hover:bg-cyan-950 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              EXTEND NODE (+1)
            </button>
            <button
              onClick={handleDeleteNode}
              disabled={nodeCount <= 3}
              className={`flex items-center gap-2 px-3 py-2 bg-slate-900/90 border border-red-500/40 text-red-400 font-mono text-xs hover:bg-red-950 cursor-pointer shadow-lg ${
                nodeCount <= 3 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Trash2 className="w-4 h-4" />
              DELETE SELECTED
            </button>

            {/* Node Stepper */}
            <div className="flex items-center justify-between p-2 bg-slate-900/90 border border-white/10 text-xs font-mono text-slate-300 mt-2">
              <button
                onClick={() => handleSelectNode((selectedIdx - 1 + nodeCount) % nodeCount)}
                className="p-1 hover:text-cyan-400 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>NODE #{selectedIdx + 1} / {nodeCount}</span>
              <button
                onClick={() => handleSelectNode((selectedIdx + 1) % nodeCount)}
                className="p-1 hover:text-cyan-400 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Right Node Inspector */}
          {currentNode && (
            <div className="absolute top-4 right-4 z-20 w-72 bg-slate-950/90 backdrop-blur-md border border-white/10 p-4 shadow-2xl flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  NODE #{selectedIdx + 1} INSPECTOR
                </span>
                <span className="text-[10px] text-slate-500">{currentNode.id}</span>
              </div>

              {/* Position Coordinates */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 uppercase">POSITION COORDINATES</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">X AXIS</span>
                    <input
                      type="number"
                      value={Math.round(currentNode.x)}
                      onChange={(e) => handleUpdateCurrentNode({ x: Number(e.target.value) })}
                      className="bg-slate-900 border border-white/10 px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">Y HEIGHT</span>
                    <input
                      type="number"
                      value={Math.round(currentNode.y)}
                      onChange={(e) => handleUpdateCurrentNode({ y: Number(e.target.value) })}
                      className="bg-slate-900 border border-white/10 px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">Z AXIS</span>
                    <input
                      type="number"
                      value={Math.round(currentNode.z)}
                      onChange={(e) => handleUpdateCurrentNode({ z: Number(e.target.value) })}
                      className="bg-slate-900 border border-white/10 px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Banking Slider */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>CORNER BANKING</span>
                  <span className="text-amber-400 font-bold">{currentNode.bank}°</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={currentNode.bank}
                  onChange={(e) => handleUpdateCurrentNode({ bank: Number(e.target.value) })}
                  className="accent-amber-400 h-1 bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Prop Toggles */}
              <div className="flex flex-col gap-2 border-t border-white/10 pt-2 mt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  TRACK PROPS & HAZARDS
                </span>
                <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GREEN BOOST PAD</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!currentNode.hasBoostPad}
                    onChange={(e) => handleUpdateCurrentNode({ hasBoostPad: e.target.checked })}
                    className="accent-emerald-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>NEON GRAVITY RING</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!currentNode.hasNeonRing}
                    onChange={(e) => handleUpdateCurrentNode({ hasNeonRing: e.target.checked })}
                    className="accent-cyan-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>ASTEROID HAZARD</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!currentNode.hasObstacle}
                    onChange={(e) => handleUpdateCurrentNode({ hasObstacle: e.target.checked })}
                    className="accent-amber-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Import Dialog Modal */}
          {showImportDialog && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 p-5 flex flex-col gap-3">
                <h3 className="font-ui font-black text-white uppercase tracking-wider text-sm">
                  IMPORT CUSTOM CIRCUIT CODE
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Paste a Base64 Void-Rider track code below to load its 3D spline geometry and props:
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste track code string here..."
                  className="w-full h-28 bg-slate-950 border border-white/10 p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setShowImportDialog(false)}
                    className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-ui font-black text-xs uppercase cursor-pointer"
                  >
                    LOAD CIRCUIT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
