/**
 * Harbor layout definitions for the port maneuvering minigame.
 * Each layout contains wall segments, a docking berth, and a ship start position.
 * Coordinates are in canvas units (800x600 canvas).
 */

/** A line segment representing a wall or obstacle. */
export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Rectangle representing the docking berth target area. */
export interface DockingBerth {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ship starting position and heading. */
export interface StartPosition {
  x: number;
  y: number;
  heading: number; // radians, 0 = right, PI/2 = down
}

/** Land mass polygon (filled green area). */
export interface LandMass {
  points: Array<{ x: number; y: number }>;
}

export type HarborDifficulty = "easy" | "medium" | "hard";

export interface HarborLayout {
  name: string;
  difficulty: HarborDifficulty;
  /** Time limit in seconds. */
  timeLimit: number;
  walls: WallSegment[];
  lands: LandMass[];
  berth: DockingBerth;
  start: StartPosition;
}

/**
 * Easy layout — Wide open harbor with short distance to berth.
 * Inspired by Hamburg: simple channel, few obstacles.
 */
const easyLayout: HarborLayout = {
  name: "Hamburg",
  difficulty: "easy",
  timeLimit: 60,
  walls: [
    // Top shoreline
    { x1: 0, y1: 120, x2: 350, y2: 120 },
    { x1: 350, y1: 120, x2: 350, y2: 80 },
    { x1: 350, y1: 80, x2: 550, y2: 80 },
    { x1: 550, y1: 80, x2: 550, y2: 120 },
    { x1: 550, y1: 120, x2: 800, y2: 120 },
    // Bottom shoreline
    { x1: 0, y1: 480, x2: 350, y2: 480 },
    { x1: 350, y1: 480, x2: 350, y2: 520 },
    { x1: 350, y1: 520, x2: 550, y2: 520 },
    { x1: 550, y1: 520, x2: 550, y2: 480 },
    { x1: 550, y1: 480, x2: 800, y2: 480 },
    // Dock structure (small pier on the right side)
    { x1: 700, y1: 120, x2: 700, y2: 200 },
    { x1: 700, y1: 200, x2: 750, y2: 200 },
  ],
  lands: [
    // Top land
    { points: [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 120 }, { x: 550, y: 120 }, { x: 550, y: 80 }, { x: 350, y: 80 }, { x: 350, y: 120 }, { x: 0, y: 120 }] },
    // Bottom land
    { points: [{ x: 0, y: 480 }, { x: 350, y: 480 }, { x: 350, y: 520 }, { x: 550, y: 520 }, { x: 550, y: 480 }, { x: 800, y: 480 }, { x: 800, y: 600 }, { x: 0, y: 600 }] },
  ],
  berth: { x: 710, y: 130, width: 40, height: 60 },
  start: { x: 80, y: 300, heading: 0 },
};

/**
 * Medium layout — Narrow channel with some obstacles.
 * Inspired by Rotterdam: channel narrows, one obstacle mid-route.
 */
const mediumLayout: HarborLayout = {
  name: "Rotterdam",
  difficulty: "medium",
  timeLimit: 45,
  walls: [
    // Top shore — starts wide, narrows
    { x1: 0, y1: 150, x2: 200, y2: 150 },
    { x1: 200, y1: 150, x2: 350, y2: 180 },
    { x1: 350, y1: 180, x2: 500, y2: 180 },
    { x1: 500, y1: 180, x2: 600, y2: 140 },
    { x1: 600, y1: 140, x2: 800, y2: 140 },
    // Bottom shore — narrows with a bulge
    { x1: 0, y1: 450, x2: 200, y2: 450 },
    { x1: 200, y1: 450, x2: 350, y2: 420 },
    { x1: 350, y1: 420, x2: 500, y2: 420 },
    { x1: 500, y1: 420, x2: 600, y2: 460 },
    { x1: 600, y1: 460, x2: 800, y2: 460 },
    // Mid-channel obstacle (small island)
    { x1: 380, y1: 280, x2: 430, y2: 260 },
    { x1: 430, y1: 260, x2: 460, y2: 280 },
    { x1: 460, y1: 280, x2: 440, y2: 310 },
    { x1: 440, y1: 310, x2: 400, y2: 310 },
    { x1: 400, y1: 310, x2: 380, y2: 280 },
    // Dock pier on far right top
    { x1: 720, y1: 140, x2: 720, y2: 230 },
    { x1: 720, y1: 230, x2: 770, y2: 230 },
  ],
  lands: [
    // Top land
    { points: [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 140 }, { x: 600, y: 140 }, { x: 500, y: 180 }, { x: 350, y: 180 }, { x: 200, y: 150 }, { x: 0, y: 150 }] },
    // Bottom land
    { points: [{ x: 0, y: 450 }, { x: 200, y: 450 }, { x: 350, y: 420 }, { x: 500, y: 420 }, { x: 600, y: 460 }, { x: 800, y: 460 }, { x: 800, y: 600 }, { x: 0, y: 600 }] },
    // Mid-channel island
    { points: [{ x: 380, y: 280 }, { x: 430, y: 260 }, { x: 460, y: 280 }, { x: 440, y: 310 }, { x: 400, y: 310 }] },
  ],
  berth: { x: 730, y: 150, width: 40, height: 70 },
  start: { x: 80, y: 300, heading: 0 },
};

/**
 * Hard layout — Tight channels with multiple turns.
 * Inspired by Lagos: S-shaped waterway, tight docking area.
 */
const hardLayout: HarborLayout = {
  name: "Lagos",
  difficulty: "hard",
  timeLimit: 30,
  walls: [
    // Top boundary
    { x1: 0, y1: 100, x2: 250, y2: 100 },
    // First turn — channel goes down-right
    { x1: 250, y1: 100, x2: 250, y2: 200 },
    { x1: 250, y1: 200, x2: 400, y2: 200 },
    { x1: 400, y1: 200, x2: 400, y2: 140 },
    { x1: 400, y1: 140, x2: 550, y2: 140 },
    // Second turn — channel goes down
    { x1: 550, y1: 140, x2: 550, y2: 300 },
    { x1: 550, y1: 300, x2: 650, y2: 300 },
    { x1: 650, y1: 300, x2: 650, y2: 180 },
    { x1: 650, y1: 180, x2: 800, y2: 180 },

    // Bottom wall — mirrors top with offsets for channel width
    { x1: 0, y1: 250, x2: 150, y2: 250 },
    { x1: 150, y1: 250, x2: 150, y2: 340 },
    { x1: 150, y1: 340, x2: 320, y2: 340 },
    { x1: 320, y1: 340, x2: 320, y2: 280 },
    { x1: 320, y1: 280, x2: 450, y2: 280 },
    { x1: 450, y1: 280, x2: 450, y2: 430 },
    { x1: 450, y1: 430, x2: 560, y2: 430 },
    { x1: 560, y1: 430, x2: 560, y2: 380 },
    { x1: 560, y1: 380, x2: 800, y2: 380 },

    // Dock structure
    { x1: 730, y1: 180, x2: 730, y2: 260 },
    { x1: 730, y1: 260, x2: 780, y2: 260 },
  ],
  lands: [
    // Top-left land
    { points: [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 180 }, { x: 650, y: 180 }, { x: 650, y: 300 }, { x: 550, y: 300 }, { x: 550, y: 140 }, { x: 400, y: 140 }, { x: 400, y: 200 }, { x: 250, y: 200 }, { x: 250, y: 100 }, { x: 0, y: 100 }] },
    // Bottom land
    { points: [{ x: 0, y: 250 }, { x: 150, y: 250 }, { x: 150, y: 340 }, { x: 320, y: 340 }, { x: 320, y: 280 }, { x: 450, y: 280 }, { x: 450, y: 430 }, { x: 560, y: 430 }, { x: 560, y: 380 }, { x: 800, y: 380 }, { x: 800, y: 600 }, { x: 0, y: 600 }] },
  ],
  berth: { x: 740, y: 190, width: 40, height: 60 },
  start: { x: 80, y: 175, heading: 0 },
};

/** All available harbor layouts. */
export const HARBOR_LAYOUTS: readonly HarborLayout[] = [
  easyLayout,
  mediumLayout,
  hardLayout,
];

/**
 * Get a harbor layout by difficulty.
 * Falls back to easy if no matching difficulty.
 */
export function getLayoutByDifficulty(difficulty: HarborDifficulty): HarborLayout {
  return HARBOR_LAYOUTS.find((l) => l.difficulty === difficulty) ?? easyLayout;
}

/**
 * Pick a random layout, optionally weighted by port characteristics.
 * For now, uses a simple hash of the port ID to deterministically pick a layout.
 */
export function getLayoutForPort(portId: string): HarborLayout {
  let hash = 0;
  for (let i = 0; i < portId.length; i++) {
    hash = ((hash << 5) - hash + portId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % HARBOR_LAYOUTS.length;
  return HARBOR_LAYOUTS[index];
}
