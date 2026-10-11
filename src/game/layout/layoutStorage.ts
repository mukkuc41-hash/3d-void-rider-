/**
 * Layout Storage and Persistence Manager for Void-Rider 3D.
 * Supports guarded localStorage access, schema validation, safe defaults,
 * and responsive percentage normalization.
 */

import { ElementLayout, LayoutScreenKey, ScreenLayoutConfig } from './layoutTypes';

const STORAGE_KEY_PREFIX = 'void_rider_layout_v2_';
export const CURRENT_SCHEMA_VERSION = 2;
export const DEFAULT_GRID_SIZE = 16;

/** Default layouts for COSMIC_TELEMETRY settings panels */
export const DEFAULT_COSMIC_TELEMETRY_LAYOUT: Record<string, ElementLayout> = {
  panel_acoustic: {
    id: 'panel_acoustic',
    title: 'ACOUSTIC SYNTHESIZER',
    xPct: 4,
    yPct: 4,
    widthPx: 460,
    minWidthPx: 280,
    minHeightPx: 170,
    maxWidthPx: 800,
    isResizable: true,
    autoHeight: true,
  },
  panel_camera: {
    id: 'panel_camera',
    title: 'FLIGHT PERSPECTIVE & CAMERA',
    xPct: 52,
    yPct: 4,
    widthPx: 460,
    minWidthPx: 280,
    minHeightPx: 155,
    maxWidthPx: 800,
    isResizable: true,
    autoHeight: true,
  },
  panel_graphics: {
    id: 'panel_graphics',
    title: 'GRAPHICS FIDELITY & RESOLUTION',
    xPct: 4,
    yPct: 48,
    widthPx: 460,
    minWidthPx: 280,
    minHeightPx: 110,
    maxWidthPx: 800,
    isResizable: true,
    autoHeight: true,
  },
  panel_collision: {
    id: 'panel_collision',
    title: 'SPACECRAFT COLLISION DYNAMICS',
    xPct: 52,
    yPct: 48,
    widthPx: 460,
    minWidthPx: 280,
    minHeightPx: 195,
    maxWidthPx: 800,
    isResizable: true,
    autoHeight: true,
  },
  panel_signature: {
    id: 'panel_signature',
    title: 'SYSTEM SIGNATURE & ACTIONS',
    xPct: 20,
    yPct: 88,
    widthPx: 580,
    minWidthPx: 300,
    minHeightPx: 64,
    maxWidthPx: 900,
    isResizable: true,
    autoHeight: true,
  },
};

/** Default layouts for AV_HUD in-flight telemetry elements */
export const DEFAULT_AV_HUD_LAYOUT: Record<string, ElementLayout> = {
  hud_cockpit_visor: {
    id: 'hud_cockpit_visor',
    title: 'COCKPIT VISOR // STANDINGS & TIMER',
    xPct: 15,
    yPct: 2,
    widthPx: 560,
    minWidthPx: 280,
    minHeightPx: 44,
    maxWidthPx: 900,
    isResizable: true,
    autoHeight: true,
  },
  hud_quantum_countdown: {
    id: 'hud_quantum_countdown',
    title: 'QUANTUM COUNTDOWN & EVENT ALERT POD',
    xPct: 18,
    yPct: 10,
    widthPx: 500,
    minWidthPx: 280,
    minHeightPx: 75,
    maxWidthPx: 800,
    isResizable: true,
    autoHeight: true,
  },
  hud_minimap: {
    id: 'hud_minimap',
    title: 'SECTOR RADAR // MINIMAP',
    xPct: 82,
    yPct: 8,
    widthPx: 120,
    heightPx: 120,
    minWidthPx: 80,
    minHeightPx: 80,
    maxWidthPx: 220,
    maxHeightPx: 220,
    isResizable: true,
    autoHeight: false,
  },
  hud_powerups: {
    id: 'hud_powerups',
    title: 'TACTICAL POWER-UPS SHELF',
    xPct: 35,
    yPct: 62,
    widthPx: 280,
    minWidthPx: 160,
    minHeightPx: 36,
    maxWidthPx: 500,
    isResizable: true,
    autoHeight: true,
  },
  hud_joystick: {
    id: 'hud_joystick',
    title: 'CYBER FLIGHT JOYSTICK',
    xPct: 4,
    yPct: 76,
    widthPx: 110,
    heightPx: 110,
    minWidthPx: 80,
    minHeightPx: 80,
    maxWidthPx: 180,
    maxHeightPx: 180,
    isResizable: true,
    autoHeight: false,
  },
  hud_speed_vitals: {
    id: 'hud_speed_vitals',
    title: 'DIGITAL TACHOMETER & SHIP VITALS',
    xPct: 74,
    yPct: 65,
    widthPx: 230,
    minWidthPx: 180,
    minHeightPx: 130,
    maxWidthPx: 400,
    isResizable: true,
    autoHeight: true,
  },
  hud_action_deck: {
    id: 'hud_action_deck',
    title: 'TACTICAL ACTION DECK // WEAPONS & THRUST',
    xPct: 74,
    yPct: 84,
    widthPx: 230,
    minWidthPx: 160,
    minHeightPx: 80,
    maxWidthPx: 380,
    isResizable: true,
    autoHeight: true,
  },
};

/**
 * Validate a stored layout record and discard corrupted values.
 */
function validateElementLayout(raw: any, fallback: ElementLayout): ElementLayout {
  if (!raw || typeof raw !== 'object') return { ...fallback };

  const xPct = typeof raw.xPct === 'number' && !isNaN(raw.xPct)
    ? Math.max(0, Math.min(100, raw.xPct))
    : fallback.xPct;

  const yPct = typeof raw.yPct === 'number' && !isNaN(raw.yPct)
    ? Math.max(0, Math.min(100, raw.yPct))
    : fallback.yPct;

  const minWidthPx = typeof fallback.minWidthPx === 'number' ? fallback.minWidthPx : 160;
  const maxWidthPx = typeof fallback.maxWidthPx === 'number' ? fallback.maxWidthPx : 1200;

  let widthPx = typeof raw.widthPx === 'number' && !isNaN(raw.widthPx)
    ? Math.max(minWidthPx, Math.min(maxWidthPx, raw.widthPx))
    : fallback.widthPx;

  let heightPx = fallback.heightPx;
  if (typeof raw.heightPx === 'number' && !isNaN(raw.heightPx)) {
    const minH = fallback.minHeightPx ?? 40;
    const maxH = fallback.maxHeightPx ?? 1000;
    heightPx = Math.max(minH, Math.min(maxH, raw.heightPx));
  }

  return {
    ...fallback,
    id: fallback.id,
    title: fallback.title,
    xPct,
    yPct,
    widthPx,
    heightPx,
    autoHeight: raw.autoHeight ?? fallback.autoHeight,
    isResizable: fallback.isResizable,
    minWidthPx,
    minHeightPx: fallback.minHeightPx,
    maxWidthPx,
    maxHeightPx: fallback.maxHeightPx,
  };
}

/**
 * Load persistent layout for a given screenKey with defensive validation and fallback.
 */
export function loadScreenLayout(
  screenKey: LayoutScreenKey,
  defaults: Record<string, ElementLayout>
): { elements: Record<string, ElementLayout>; snapToGrid: boolean; gridSize: number } {
  try {
    const key = `${STORAGE_KEY_PREFIX}${screenKey}`;
    const rawJson = localStorage.getItem(key);
    if (!rawJson) {
      return { elements: { ...defaults }, snapToGrid: true, gridSize: DEFAULT_GRID_SIZE };
    }

    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_SCHEMA_VERSION) {
      return { elements: { ...defaults }, snapToGrid: true, gridSize: DEFAULT_GRID_SIZE };
    }

    const loadedElements: Record<string, ElementLayout> = {};
    for (const [id, def] of Object.entries(defaults)) {
      if (parsed.elements && parsed.elements[id]) {
        loadedElements[id] = validateElementLayout(parsed.elements[id], def);
      } else {
        loadedElements[id] = { ...def };
      }
    }

    const snapToGrid = typeof parsed.snapToGrid === 'boolean' ? parsed.snapToGrid : true;
    const gridSize = typeof parsed.gridSize === 'number' && parsed.gridSize > 0 ? parsed.gridSize : DEFAULT_GRID_SIZE;

    return { elements: loadedElements, snapToGrid, gridSize };
  } catch (err) {
    console.warn(`[LayoutStorage] Failed to load layout for ${screenKey}, using defaults:`, err);
    return { elements: { ...defaults }, snapToGrid: true, gridSize: DEFAULT_GRID_SIZE };
  }
}

/**
 * Save layout preferences to localStorage.
 */
export function saveScreenLayout(
  screenKey: LayoutScreenKey,
  elements: Record<string, ElementLayout>,
  snapToGrid: boolean = true,
  gridSize: number = DEFAULT_GRID_SIZE
): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}${screenKey}`;
    const payload: ScreenLayoutConfig = {
      version: CURRENT_SCHEMA_VERSION,
      screenKey,
      snapToGrid,
      gridSize,
      elements,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error(`[LayoutStorage] Failed to save layout for ${screenKey}:`, err);
    return false;
  }
}

/**
 * Reset layout preferences to factory defaults.
 */
export function resetScreenLayout(screenKey: LayoutScreenKey): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}${screenKey}`;
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`[LayoutStorage] Failed to reset layout for ${screenKey}:`, err);
    return false;
  }
}
