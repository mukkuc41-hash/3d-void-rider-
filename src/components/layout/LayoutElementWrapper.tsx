import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Maximize2 } from 'lucide-react';
import { ElementLayout, ResizeHandleDirection } from '../../game/layout/layoutTypes';

interface LayoutElementWrapperProps {
  layout: ElementLayout;
  isSelected: boolean;
  isEditMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  containerWidth: number;
  containerHeight: number;
  onSelect: (id: string) => void;
  onChange: (updated: ElementLayout, recordHistory?: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const LayoutElementWrapper: React.FC<LayoutElementWrapperProps> = ({
  layout,
  isSelected,
  isEditMode,
  snapToGrid,
  gridSize,
  containerWidth,
  containerHeight,
  onSelect,
  onChange,
  children,
  className = '',
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initLeftPx: number;
    initTopPx: number;
    initWidthPx: number;
    initHeightPx: number;
    handle?: ResizeHandleDirection;
  } | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [currentPx, setCurrentPx] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: layout.widthPx,
    h: layout.heightPx || 160,
  });

  // Calculate actual pixel position from percentage
  const leftPx = (layout.xPct / 100) * containerWidth;
  const topPx = (layout.yPct / 100) * containerHeight;

  // Sync internal pixel state whenever container dimensions or layout percentages change (when not dragging)
  useEffect(() => {
    if (!isInteracting) {
      const w = layout.widthPx;
      const h = layout.heightPx || elementRef.current?.offsetHeight || 160;
      // Clamp within container
      const maxLeft = Math.max(0, containerWidth - w);
      const maxTop = Math.max(0, containerHeight - (layout.autoHeight ? 40 : h));
      const clampedX = Math.max(0, Math.min(maxLeft, leftPx));
      const clampedY = Math.max(0, Math.min(maxTop, topPx));
      setCurrentPx({ x: clampedX, y: clampedY, w, h });
    }
  }, [leftPx, topPx, layout.widthPx, layout.heightPx, layout.autoHeight, containerWidth, containerHeight, isInteracting]);

  // Handle Drag Move (repositioning from move grip)
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onSelect(layout.id);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initLeftPx: currentPx.x,
      initTopPx: currentPx.y,
      initWidthPx: currentPx.w,
      initHeightPx: currentPx.h,
    };
    setIsInteracting(true);
  };

  // Handle Resize Move (from edge/corner handle)
  const handlePointerDownResize = (e: React.PointerEvent, handle: ResizeHandleDirection) => {
    if (!isEditMode || !layout.isResizable) return;
    e.stopPropagation();
    onSelect(layout.id);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const h = layout.heightPx || elementRef.current?.offsetHeight || 160;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initLeftPx: currentPx.x,
      initTopPx: currentPx.y,
      initWidthPx: currentPx.w,
      initHeightPx: h,
      handle,
    };
    setIsInteracting(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting || !dragStartRef.current) return;
    e.stopPropagation();

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const handle = dragStartRef.current.handle;

    if (!handle) {
      // Repositioning drag
      let newX = dragStartRef.current.initLeftPx + dx;
      let newY = dragStartRef.current.initTopPx + dy;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      // Clamping within container
      const maxLeft = Math.max(0, containerWidth - currentPx.w);
      const measuredHeight = elementRef.current?.offsetHeight || currentPx.h;
      const maxTop = Math.max(0, containerHeight - (layout.autoHeight ? measuredHeight : currentPx.h));

      newX = Math.max(0, Math.min(maxLeft, newX));
      newY = Math.max(0, Math.min(maxTop, newY));

      setCurrentPx(prev => ({ ...prev, x: newX, y: newY }));
    } else {
      // Resizing
      const minW = layout.minWidthPx ?? 160;
      const maxW = Math.min(layout.maxWidthPx ?? 1200, containerWidth);
      const minH = layout.minHeightPx ?? 60;
      const maxH = Math.min(layout.maxHeightPx ?? 800, containerHeight);

      let newX = dragStartRef.current.initLeftPx;
      let newY = dragStartRef.current.initTopPx;
      let newW = dragStartRef.current.initWidthPx;
      let newH = dragStartRef.current.initHeightPx;

      // Handle directions
      if (handle.includes('e')) {
        newW = dragStartRef.current.initWidthPx + dx;
      }
      if (handle.includes('w')) {
        const potentialW = dragStartRef.current.initWidthPx - dx;
        if (potentialW >= minW && potentialW <= maxW) {
          newW = potentialW;
          newX = dragStartRef.current.initLeftPx + dx;
        }
      }
      if (handle.includes('s')) {
        newH = dragStartRef.current.initHeightPx + dy;
      }
      if (handle.includes('n')) {
        const potentialH = dragStartRef.current.initHeightPx - dy;
        if (potentialH >= minH && potentialH <= maxH) {
          newH = potentialH;
          newY = dragStartRef.current.initTopPx + dy;
        }
      }

      if (snapToGrid) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      newW = Math.max(minW, Math.min(maxW, newW));
      newH = Math.max(minH, Math.min(maxH, newH));

      // Clamp coordinates
      newX = Math.max(0, Math.min(containerWidth - newW, newX));
      newY = Math.max(0, Math.min(containerHeight - newH, newY));

      setCurrentPx({ x: newX, y: newY, w: newW, h: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isInteracting || !dragStartRef.current) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was lost
    }

    setIsInteracting(false);
    dragStartRef.current = null;

    // Convert final pixel positions to normalized percentages
    const xPct = containerWidth > 0 ? (currentPx.x / containerWidth) * 100 : layout.xPct;
    const yPct = containerHeight > 0 ? (currentPx.y / containerHeight) * 100 : layout.yPct;

    const updatedLayout: ElementLayout = {
      ...layout,
      xPct: Math.max(0, Math.min(100, xPct)),
      yPct: Math.max(0, Math.min(100, yPct)),
      widthPx: currentPx.w,
      heightPx: layout.autoHeight ? undefined : currentPx.h,
    };

    onChange(updatedLayout, true);
  };

  // If outside edit mode, render standard styled container
  if (!isEditMode) {
    return (
      <div
        ref={elementRef}
        style={{
          position: 'absolute',
          left: `${currentPx.x}px`,
          top: `${currentPx.y}px`,
          width: `${currentPx.w}px`,
          height: layout.autoHeight ? undefined : `${currentPx.h}px`,
          zIndex: layout.zIndex ?? 10,
        }}
        className={`transition-all duration-75 ${className}`}
      >
        {children}
      </div>
    );
  }

  // Inside EDIT MODE: interactive frame with move grip and resize handles
  return (
    <div
      ref={elementRef}
      onClick={e => {
        e.stopPropagation();
        onSelect(layout.id);
      }}
      style={{
        position: 'absolute',
        left: `${currentPx.x}px`,
        top: `${currentPx.y}px`,
        width: `${currentPx.w}px`,
        height: layout.autoHeight ? undefined : `${currentPx.h}px`,
        zIndex: isSelected ? 40 : layout.zIndex ?? 10,
      }}
      className={`group select-none transition-shadow rounded-2xl ${
        isSelected
          ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.45)]'
          : 'ring-1 ring-slate-700/60 hover:ring-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
      } ${className}`}
    >
      {/* Move Grip Bar Header */}
      <div
        onPointerDown={handlePointerDownDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex items-center justify-between px-3 py-1.5 rounded-t-2xl border-b transition-colors cursor-grab active:cursor-grabbing touch-none ${
          isSelected
            ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
            : 'bg-slate-900/90 border-slate-700/60 text-slate-400 group-hover:text-cyan-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider truncate max-w-[200px]">
            {layout.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-cyan-400/90">
          <span>{Math.round(currentPx.w)}×{Math.round(currentPx.h)}</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">
            {Math.round(layout.xPct)}%, {Math.round(layout.yPct)}%
          </span>
        </div>
      </div>

      {/* Internal Content (Buttons, Sliders, HUD, etc.) */}
      <div className="relative pointer-events-auto">
        {children}
      </div>

      {/* Corner and Edge Resize Handles (when selected and resizable) */}
      {isSelected && layout.isResizable && (
        <>
          {/* Top-Left */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'nw')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border border-slate-950 rounded-sm cursor-nwse-resize z-50 touch-none shadow-[0_0_8px_#00f0ff]"
          />
          {/* Top-Right */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'ne')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border border-slate-950 rounded-sm cursor-nesw-resize z-50 touch-none shadow-[0_0_8px_#00f0ff]"
          />
          {/* Bottom-Right */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'se')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border border-slate-950 rounded-sm cursor-nwse-resize z-50 touch-none shadow-[0_0_8px_#00f0ff]"
          />
          {/* Bottom-Left */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'sw')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border border-slate-950 rounded-sm cursor-nesw-resize z-50 touch-none shadow-[0_0_8px_#00f0ff]"
          />

          {/* Right Edge Handle */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'e')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 bg-cyan-400/90 border border-slate-950 rounded-sm cursor-ew-resize z-50 touch-none"
          />
          {/* Left Edge Handle */}
          <div
            onPointerDown={e => handlePointerDownResize(e, 'w')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-6 bg-cyan-400/90 border border-slate-950 rounded-sm cursor-ew-resize z-50 touch-none"
          />

          {!layout.autoHeight && (
            <>
              {/* Bottom Edge Handle */}
              <div
                onPointerDown={e => handlePointerDownResize(e, 's')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-cyan-400/90 border border-slate-950 rounded-sm cursor-ns-resize z-50 touch-none"
              />
              {/* Top Edge Handle */}
              <div
                onPointerDown={e => handlePointerDownResize(e, 'n')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-cyan-400/90 border border-slate-950 rounded-sm cursor-ns-resize z-50 touch-none"
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
