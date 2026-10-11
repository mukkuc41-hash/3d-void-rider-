/**
 * Layout Editor Types & Schema for Void-Rider 3D
 * Versioned schema for persistent layout customization across screens.
 */

export type LayoutScreenKey = 'COSMIC_TELEMETRY' | 'AV_HUD';

export type ResizeHandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ElementLayout {
  /** Stable identifier for the element */
  id: string;
  /** Human-readable title shown on the move grip header */
  title: string;
  /** Horizontal position as percentage (0-100) of container width */
  xPct: number;
  /** Vertical position as percentage (0-100) of container height */
  yPct: number;
  /** Width in pixels */
  widthPx: number;
  /** Height in pixels (if undefined or 0, content determines height) */
  heightPx?: number;
  /** Whether the height is automatically determined by content */
  autoHeight?: boolean;
  /** Whether resizing width/height is supported */
  isResizable?: boolean;
  /** Minimum allowable width in pixels */
  minWidthPx: number;
  /** Minimum allowable height in pixels */
  minHeightPx?: number;
  /** Maximum allowable width in pixels */
  maxWidthPx?: number;
  /** Maximum allowable height in pixels */
  maxHeightPx?: number;
  /** Stack order */
  zIndex?: number;
}

export interface ScreenLayoutConfig {
  version: number;
  screenKey: LayoutScreenKey;
  snapToGrid: boolean;
  gridSize: number;
  elements: Record<string, ElementLayout>;
  updatedAt: number;
}
