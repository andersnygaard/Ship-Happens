/**
 * Harbor layout definitions for the port maneuvering minigame.
 * Each layout contains wall segments, a docking berth, and a ship start position.
 * Coordinates are in canvas units (800x600 canvas).
 *
 * 8 distinct layouts covering different environment themes:
 *  1. Open basin (easy) — wide channel, few obstacles
 *  2. Channel with turn (medium) — narrower, one turn
 *  3. Narrow channels (hard) — tight S-shaped waterway
 *  4. Tropical (medium) — green island obstacles
 *  5. Arctic (hard) — iceberg obstacles
 *  6. Industrial (medium) — storage tanks, cranes
 *  7. Mediterranean (easy-medium) — curved coastline
 *  8. Island passage (medium) — navigate between islands
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

/** Environment theme affects rendering colors and decorations. */
export type EnvironmentTheme =
  | "standard"
  | "tropical"
  | "arctic"
  | "industrial"
  | "mediterranean";

/** Obstacle decoration rendered on top of land/obstacle polygons. */
export interface ObstacleDecoration {
  type: "palm-tree" | "iceberg" | "crane" | "storage-tank" | "rock";
  x: number;
  y: number;
  /** Optional scale factor (default 1.0). */
  scale?: number;
}

export interface HarborLayout {
  name: string;
  difficulty: HarborDifficulty;
  /** Time limit in seconds. */
  timeLimit: number;
  /** Damage multiplier — scales collision damage (default 1.0). */
  damageMultiplier: number;
  /** Environment theme for rendering. */
  theme: EnvironmentTheme;
  walls: WallSegment[];
  lands: LandMass[];
  berth: DockingBerth;
  start: StartPosition;
  /** Optional decorative elements placed on the harbor. */
  decorations?: ObstacleDecoration[];
}

// ─── Layout 1: Open Basin (Easy) ────────────────────────────────────────────
/**
 * Wide open harbor with short distance to berth.
 * Ports: Rotterdam, Hamburg
 */
const openBasinLayout: HarborLayout = {
  name: "Open Basin",
  difficulty: "easy",
  timeLimit: 60,
  damageMultiplier: 0.8,
  theme: "standard",
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
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 120 },
        { x: 550, y: 120 }, { x: 550, y: 80 }, { x: 350, y: 80 },
        { x: 350, y: 120 }, { x: 0, y: 120 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 480 }, { x: 350, y: 480 }, { x: 350, y: 520 },
        { x: 550, y: 520 }, { x: 550, y: 480 }, { x: 800, y: 480 },
        { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
  ],
  berth: { x: 710, y: 130, width: 40, height: 60 },
  start: { x: 80, y: 300, heading: 0 },
};

// ─── Layout 2: Channel with Turn (Medium) ───────────────────────────────────
/**
 * Narrower channel with one turn and a mid-channel obstacle.
 * Ports: London, New York
 */
const channelTurnLayout: HarborLayout = {
  name: "Channel Turn",
  difficulty: "medium",
  timeLimit: 45,
  damageMultiplier: 1.0,
  theme: "standard",
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
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 140 },
        { x: 600, y: 140 }, { x: 500, y: 180 }, { x: 350, y: 180 },
        { x: 200, y: 150 }, { x: 0, y: 150 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 450 }, { x: 200, y: 450 }, { x: 350, y: 420 },
        { x: 500, y: 420 }, { x: 600, y: 460 }, { x: 800, y: 460 },
        { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
    // Mid-channel island
    {
      points: [
        { x: 380, y: 280 }, { x: 430, y: 260 }, { x: 460, y: 280 },
        { x: 440, y: 310 }, { x: 400, y: 310 },
      ],
    },
  ],
  berth: { x: 730, y: 150, width: 40, height: 70 },
  start: { x: 80, y: 300, heading: 0 },
};

// ─── Layout 3: Narrow Channels (Hard) ───────────────────────────────────────
/**
 * Tight S-shaped waterway with multiple turns.
 * Ports: Lagos, Karachi
 */
const narrowChannelsLayout: HarborLayout = {
  name: "Narrow Channels",
  difficulty: "hard",
  timeLimit: 30,
  damageMultiplier: 1.5,
  theme: "standard",
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
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 180 },
        { x: 650, y: 180 }, { x: 650, y: 300 }, { x: 550, y: 300 },
        { x: 550, y: 140 }, { x: 400, y: 140 }, { x: 400, y: 200 },
        { x: 250, y: 200 }, { x: 250, y: 100 }, { x: 0, y: 100 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 250 }, { x: 150, y: 250 }, { x: 150, y: 340 },
        { x: 320, y: 340 }, { x: 320, y: 280 }, { x: 450, y: 280 },
        { x: 450, y: 430 }, { x: 560, y: 430 }, { x: 560, y: 380 },
        { x: 800, y: 380 }, { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
  ],
  berth: { x: 740, y: 190, width: 40, height: 60 },
  start: { x: 80, y: 175, heading: 0 },
};

// ─── Layout 4: Tropical (Medium) ────────────────────────────────────────────
/**
 * Tropical harbor with green island obstacles and palm trees.
 * Ports: Rio de Janeiro, Singapore, Dar-es-Salaam, Monrovia, Panama
 */
const tropicalLayout: HarborLayout = {
  name: "Tropical Harbor",
  difficulty: "medium",
  timeLimit: 45,
  damageMultiplier: 1.0,
  theme: "tropical",
  walls: [
    // Top shoreline — curved beach
    { x1: 0, y1: 130, x2: 180, y2: 110 },
    { x1: 180, y1: 110, x2: 380, y2: 130 },
    { x1: 380, y1: 130, x2: 550, y2: 100 },
    { x1: 550, y1: 100, x2: 800, y2: 120 },
    // Bottom shoreline
    { x1: 0, y1: 470, x2: 200, y2: 490 },
    { x1: 200, y1: 490, x2: 400, y2: 470 },
    { x1: 400, y1: 470, x2: 600, y2: 500 },
    { x1: 600, y1: 500, x2: 800, y2: 480 },
    // Island obstacle 1 (left)
    { x1: 220, y1: 260, x2: 270, y2: 230 },
    { x1: 270, y1: 230, x2: 320, y2: 250 },
    { x1: 320, y1: 250, x2: 310, y2: 300 },
    { x1: 310, y1: 300, x2: 250, y2: 310 },
    { x1: 250, y1: 310, x2: 220, y2: 260 },
    // Island obstacle 2 (right)
    { x1: 500, y1: 320, x2: 560, y2: 300 },
    { x1: 560, y1: 300, x2: 600, y2: 330 },
    { x1: 600, y1: 330, x2: 580, y2: 370 },
    { x1: 580, y1: 370, x2: 520, y2: 380 },
    { x1: 520, y1: 380, x2: 500, y2: 320 },
    // Dock pier
    { x1: 720, y1: 120, x2: 720, y2: 210 },
    { x1: 720, y1: 210, x2: 770, y2: 210 },
  ],
  lands: [
    // Top land
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 120 },
        { x: 550, y: 100 }, { x: 380, y: 130 }, { x: 180, y: 110 },
        { x: 0, y: 130 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 470 }, { x: 200, y: 490 }, { x: 400, y: 470 },
        { x: 600, y: 500 }, { x: 800, y: 480 }, { x: 800, y: 600 },
        { x: 0, y: 600 },
      ],
    },
    // Island 1
    {
      points: [
        { x: 220, y: 260 }, { x: 270, y: 230 }, { x: 320, y: 250 },
        { x: 310, y: 300 }, { x: 250, y: 310 },
      ],
    },
    // Island 2
    {
      points: [
        { x: 500, y: 320 }, { x: 560, y: 300 }, { x: 600, y: 330 },
        { x: 580, y: 370 }, { x: 520, y: 380 },
      ],
    },
  ],
  berth: { x: 730, y: 130, width: 40, height: 70 },
  start: { x: 60, y: 300, heading: 0 },
  decorations: [
    // Palm trees on islands
    { type: "palm-tree", x: 265, y: 265 },
    { type: "palm-tree", x: 290, y: 280 },
    { type: "palm-tree", x: 545, y: 340 },
    { type: "palm-tree", x: 560, y: 355 },
    // Palm trees on shore
    { type: "palm-tree", x: 100, y: 100 },
    { type: "palm-tree", x: 200, y: 90 },
    { type: "palm-tree", x: 450, y: 95 },
    { type: "palm-tree", x: 150, y: 500 },
    { type: "palm-tree", x: 350, y: 480 },
  ],
};

// ─── Layout 5: Arctic (Hard) ────────────────────────────────────────────────
/**
 * Arctic harbor with large irregular iceberg obstacles.
 * Ports: Point Hope, Vancouver
 */
const arcticLayout: HarborLayout = {
  name: "Arctic Harbor",
  difficulty: "hard",
  timeLimit: 35,
  damageMultiplier: 1.4,
  theme: "arctic",
  walls: [
    // Top shoreline — jagged icy coast
    { x1: 0, y1: 100, x2: 200, y2: 110 },
    { x1: 200, y1: 110, x2: 350, y2: 90 },
    { x1: 350, y1: 90, x2: 500, y2: 105 },
    { x1: 500, y1: 105, x2: 650, y2: 85 },
    { x1: 650, y1: 85, x2: 800, y2: 100 },
    // Bottom shoreline
    { x1: 0, y1: 500, x2: 250, y2: 490 },
    { x1: 250, y1: 490, x2: 500, y2: 510 },
    { x1: 500, y1: 510, x2: 800, y2: 500 },
    // Iceberg 1 — large irregular shape (left-center)
    { x1: 200, y1: 250, x2: 250, y2: 210 },
    { x1: 250, y1: 210, x2: 310, y2: 220 },
    { x1: 310, y1: 220, x2: 330, y2: 270 },
    { x1: 330, y1: 270, x2: 300, y2: 320 },
    { x1: 300, y1: 320, x2: 240, y2: 310 },
    { x1: 240, y1: 310, x2: 200, y2: 250 },
    // Iceberg 2 — medium (center-right)
    { x1: 450, y1: 300, x2: 490, y2: 260 },
    { x1: 490, y1: 260, x2: 540, y2: 280 },
    { x1: 540, y1: 280, x2: 550, y2: 340 },
    { x1: 550, y1: 340, x2: 500, y2: 370 },
    { x1: 500, y1: 370, x2: 450, y2: 340 },
    { x1: 450, y1: 340, x2: 450, y2: 300 },
    // Iceberg 3 — small (right)
    { x1: 620, y1: 200, x2: 660, y2: 180 },
    { x1: 660, y1: 180, x2: 690, y2: 210 },
    { x1: 690, y1: 210, x2: 670, y2: 250 },
    { x1: 670, y1: 250, x2: 630, y2: 240 },
    { x1: 630, y1: 240, x2: 620, y2: 200 },
    // Dock structure
    { x1: 740, y1: 100, x2: 740, y2: 180 },
    { x1: 740, y1: 180, x2: 780, y2: 180 },
  ],
  lands: [
    // Top land (icy)
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 100 },
        { x: 650, y: 85 }, { x: 500, y: 105 }, { x: 350, y: 90 },
        { x: 200, y: 110 }, { x: 0, y: 100 },
      ],
    },
    // Bottom land (icy)
    {
      points: [
        { x: 0, y: 500 }, { x: 250, y: 490 }, { x: 500, y: 510 },
        { x: 800, y: 500 }, { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
    // Iceberg 1
    {
      points: [
        { x: 200, y: 250 }, { x: 250, y: 210 }, { x: 310, y: 220 },
        { x: 330, y: 270 }, { x: 300, y: 320 }, { x: 240, y: 310 },
      ],
    },
    // Iceberg 2
    {
      points: [
        { x: 450, y: 300 }, { x: 490, y: 260 }, { x: 540, y: 280 },
        { x: 550, y: 340 }, { x: 500, y: 370 }, { x: 450, y: 340 },
      ],
    },
    // Iceberg 3
    {
      points: [
        { x: 620, y: 200 }, { x: 660, y: 180 }, { x: 690, y: 210 },
        { x: 670, y: 250 }, { x: 630, y: 240 },
      ],
    },
  ],
  berth: { x: 745, y: 105, width: 35, height: 65 },
  start: { x: 60, y: 300, heading: 0 },
  decorations: [
    { type: "iceberg", x: 260, y: 265, scale: 1.2 },
    { type: "iceberg", x: 500, y: 320, scale: 1.0 },
    { type: "iceberg", x: 655, y: 215, scale: 0.8 },
  ],
};

// ─── Layout 6: Industrial (Medium) ──────────────────────────────────────────
/**
 * Industrial port with storage tanks and cranes as obstacles.
 * Ports: Houston, Jebel Dhanna, Basrah
 */
const industrialLayout: HarborLayout = {
  name: "Industrial Port",
  difficulty: "medium",
  timeLimit: 45,
  damageMultiplier: 1.2,
  theme: "industrial",
  walls: [
    // Top shoreline — straight industrial quay
    { x1: 0, y1: 130, x2: 300, y2: 130 },
    { x1: 300, y1: 130, x2: 300, y2: 100 },
    { x1: 300, y1: 100, x2: 500, y2: 100 },
    { x1: 500, y1: 100, x2: 500, y2: 130 },
    { x1: 500, y1: 130, x2: 800, y2: 130 },
    // Bottom shoreline — with industrial pier jutting out
    { x1: 0, y1: 470, x2: 200, y2: 470 },
    { x1: 200, y1: 470, x2: 200, y2: 380 },
    { x1: 200, y1: 380, x2: 280, y2: 380 },
    { x1: 280, y1: 380, x2: 280, y2: 470 },
    { x1: 280, y1: 470, x2: 800, y2: 470 },
    // Industrial obstacle — loading platform (center)
    { x1: 420, y1: 260, x2: 480, y2: 260 },
    { x1: 480, y1: 260, x2: 480, y2: 320 },
    { x1: 480, y1: 320, x2: 420, y2: 320 },
    { x1: 420, y1: 320, x2: 420, y2: 260 },
    // Dock structure
    { x1: 700, y1: 130, x2: 700, y2: 220 },
    { x1: 700, y1: 220, x2: 760, y2: 220 },
  ],
  lands: [
    // Top land (industrial)
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 130 },
        { x: 500, y: 130 }, { x: 500, y: 100 }, { x: 300, y: 100 },
        { x: 300, y: 130 }, { x: 0, y: 130 },
      ],
    },
    // Bottom land (industrial)
    {
      points: [
        { x: 0, y: 470 }, { x: 200, y: 470 }, { x: 200, y: 380 },
        { x: 280, y: 380 }, { x: 280, y: 470 }, { x: 800, y: 470 },
        { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
    // Loading platform obstacle
    {
      points: [
        { x: 420, y: 260 }, { x: 480, y: 260 },
        { x: 480, y: 320 }, { x: 420, y: 320 },
      ],
    },
  ],
  berth: { x: 710, y: 140, width: 50, height: 70 },
  start: { x: 80, y: 300, heading: 0 },
  decorations: [
    // Cranes along the top quay
    { type: "crane", x: 100, y: 110 },
    { type: "crane", x: 400, y: 85 },
    { type: "crane", x: 600, y: 110 },
    // Storage tanks on the bottom
    { type: "storage-tank", x: 230, y: 420, scale: 1.2 },
    { type: "storage-tank", x: 350, y: 500 },
    { type: "storage-tank", x: 500, y: 510 },
    // Industrial obstacle decoration
    { type: "storage-tank", x: 450, y: 290, scale: 0.8 },
  ],
};

// ─── Layout 7: Mediterranean (Easy-Medium) ──────────────────────────────────
/**
 * Curved coastline forming a natural harbor basin.
 * Ports: Marseilles, Piraeus, Alexandria
 */
const mediterraneanLayout: HarborLayout = {
  name: "Mediterranean Harbor",
  difficulty: "easy",
  timeLimit: 55,
  damageMultiplier: 0.9,
  theme: "mediterranean",
  walls: [
    // Top shoreline — curved bay
    { x1: 0, y1: 160, x2: 100, y2: 130 },
    { x1: 100, y1: 130, x2: 250, y2: 110 },
    { x1: 250, y1: 110, x2: 400, y2: 120 },
    { x1: 400, y1: 120, x2: 550, y2: 150 },
    { x1: 550, y1: 150, x2: 700, y2: 130 },
    { x1: 700, y1: 130, x2: 800, y2: 140 },
    // Bottom shoreline — curved bay
    { x1: 0, y1: 440, x2: 150, y2: 470 },
    { x1: 150, y1: 470, x2: 350, y2: 490 },
    { x1: 350, y1: 490, x2: 550, y2: 480 },
    { x1: 550, y1: 480, x2: 700, y2: 460 },
    { x1: 700, y1: 460, x2: 800, y2: 470 },
    // Coastal rock (small obstacle)
    { x1: 350, y1: 290, x2: 380, y2: 275 },
    { x1: 380, y1: 275, x2: 410, y2: 290 },
    { x1: 410, y1: 290, x2: 395, y2: 315 },
    { x1: 395, y1: 315, x2: 365, y2: 315 },
    { x1: 365, y1: 315, x2: 350, y2: 290 },
    // Dock structure — breakwater pier
    { x1: 720, y1: 140, x2: 720, y2: 240 },
    { x1: 720, y1: 240, x2: 770, y2: 240 },
  ],
  lands: [
    // Top land (Mediterranean coast)
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 140 },
        { x: 700, y: 130 }, { x: 550, y: 150 }, { x: 400, y: 120 },
        { x: 250, y: 110 }, { x: 100, y: 130 }, { x: 0, y: 160 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 440 }, { x: 150, y: 470 }, { x: 350, y: 490 },
        { x: 550, y: 480 }, { x: 700, y: 460 }, { x: 800, y: 470 },
        { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
    // Coastal rock
    {
      points: [
        { x: 350, y: 290 }, { x: 380, y: 275 }, { x: 410, y: 290 },
        { x: 395, y: 315 }, { x: 365, y: 315 },
      ],
    },
  ],
  berth: { x: 730, y: 150, width: 40, height: 80 },
  start: { x: 60, y: 300, heading: 0 },
  decorations: [
    { type: "rock", x: 375, y: 295 },
    { type: "rock", x: 150, y: 120 },
    { type: "rock", x: 600, y: 140 },
  ],
};

// ─── Layout 8: Island Passage (Medium) ──────────────────────────────────────
/**
 * Navigate between multiple islands to reach the dock.
 * Ports: Hong Kong, Tokyo, Yokohama, Sydney, Pearl Harbor
 */
const islandPassageLayout: HarborLayout = {
  name: "Island Passage",
  difficulty: "medium",
  timeLimit: 50,
  damageMultiplier: 1.1,
  theme: "standard",
  walls: [
    // Top shore
    { x1: 0, y1: 100, x2: 350, y2: 100 },
    { x1: 350, y1: 100, x2: 800, y2: 80 },
    // Bottom shore
    { x1: 0, y1: 500, x2: 400, y2: 510 },
    { x1: 400, y1: 510, x2: 800, y2: 500 },
    // Island 1 — top-left
    { x1: 160, y1: 210, x2: 220, y2: 190 },
    { x1: 220, y1: 190, x2: 270, y2: 220 },
    { x1: 270, y1: 220, x2: 260, y2: 270 },
    { x1: 260, y1: 270, x2: 200, y2: 280 },
    { x1: 200, y1: 280, x2: 160, y2: 240 },
    { x1: 160, y1: 240, x2: 160, y2: 210 },
    // Island 2 — center
    { x1: 340, y1: 280, x2: 400, y2: 260 },
    { x1: 400, y1: 260, x2: 450, y2: 290 },
    { x1: 450, y1: 290, x2: 440, y2: 350 },
    { x1: 440, y1: 350, x2: 380, y2: 370 },
    { x1: 380, y1: 370, x2: 340, y2: 330 },
    { x1: 340, y1: 330, x2: 340, y2: 280 },
    // Island 3 — bottom-right
    { x1: 530, y1: 350, x2: 580, y2: 330 },
    { x1: 580, y1: 330, x2: 620, y2: 360 },
    { x1: 620, y1: 360, x2: 610, y2: 410 },
    { x1: 610, y1: 410, x2: 560, y2: 420 },
    { x1: 560, y1: 420, x2: 530, y2: 380 },
    { x1: 530, y1: 380, x2: 530, y2: 350 },
    // Dock structure
    { x1: 740, y1: 80, x2: 740, y2: 170 },
    { x1: 740, y1: 170, x2: 780, y2: 170 },
  ],
  lands: [
    // Top land
    {
      points: [
        { x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 80 },
        { x: 350, y: 100 }, { x: 0, y: 100 },
      ],
    },
    // Bottom land
    {
      points: [
        { x: 0, y: 500 }, { x: 400, y: 510 }, { x: 800, y: 500 },
        { x: 800, y: 600 }, { x: 0, y: 600 },
      ],
    },
    // Island 1
    {
      points: [
        { x: 160, y: 210 }, { x: 220, y: 190 }, { x: 270, y: 220 },
        { x: 260, y: 270 }, { x: 200, y: 280 }, { x: 160, y: 240 },
      ],
    },
    // Island 2
    {
      points: [
        { x: 340, y: 280 }, { x: 400, y: 260 }, { x: 450, y: 290 },
        { x: 440, y: 350 }, { x: 380, y: 370 }, { x: 340, y: 330 },
      ],
    },
    // Island 3
    {
      points: [
        { x: 530, y: 350 }, { x: 580, y: 330 }, { x: 620, y: 360 },
        { x: 610, y: 410 }, { x: 560, y: 420 }, { x: 530, y: 380 },
      ],
    },
  ],
  berth: { x: 745, y: 90, width: 35, height: 70 },
  start: { x: 60, y: 300, heading: 0 },
};

// ─── All Layouts ─────────────────────────────────────────────────────────────

/** All available harbor layouts. */
export const HARBOR_LAYOUTS: readonly HarborLayout[] = [
  openBasinLayout,
  channelTurnLayout,
  narrowChannelsLayout,
  tropicalLayout,
  arcticLayout,
  industrialLayout,
  mediterraneanLayout,
  islandPassageLayout,
];

// ─── Port-to-Layout Assignment ──────────────────────────────────────────────

/**
 * Maps each port ID to a specific harbor layout index.
 * Assignments are based on geography and port character.
 */
const PORT_LAYOUT_MAP: Record<string, number> = {
  // Open Basin (easy) — big European ports
  "rotterdam": 0,
  "hamburg": 0,
  "buenos-aires": 0,
  "san-francisco": 0,

  // Channel Turn (medium) — Thames/Hudson-style approaches
  "london": 1,
  "new-york": 1,
  "lima": 1,
  "cape-town": 1,

  // Narrow Channels (hard) — challenging developing-world ports
  "lagos": 2,
  "karachi": 2,
  "calcutta": 2,

  // Tropical (medium) — equatorial ports with lush islands
  "rio-de-janeiro": 3,
  "singapore": 3,
  "dar-es-salaam": 3,
  "monrovia": 3,
  "panama": 3,
  "bombay": 3,

  // Arctic (hard) — polar/cold-water ports with icebergs
  "point-hope": 4,
  "vancouver": 4,

  // Industrial (medium) — oil/chemical refineries
  "houston": 5,
  "jebel-dhanna": 5,
  "basrah": 5,

  // Mediterranean (easy-medium) — curved coastline
  "marseilles": 6,
  "piraeus": 6,
  "alexandria": 6,

  // Island Passage (medium) — island navigation
  "hong-kong": 7,
  "tokyo": 7,
  "yokohama": 7,
  "sydney": 7,
  "pearl-harbor": 7,
};

/**
 * Get a harbor layout by difficulty.
 * Falls back to easy if no matching difficulty.
 */
export function getLayoutByDifficulty(difficulty: HarborDifficulty): HarborLayout {
  return HARBOR_LAYOUTS.find((l) => l.difficulty === difficulty) ?? openBasinLayout;
}

/**
 * Get the harbor layout assigned to a specific port.
 * Each port has a deterministic layout based on its geography and character.
 * Falls back to a hash-based selection if the port is not in the assignment map.
 */
export function getLayoutForPort(portId: string): HarborLayout {
  const layoutIndex = PORT_LAYOUT_MAP[portId];
  if (layoutIndex !== undefined) {
    return HARBOR_LAYOUTS[layoutIndex];
  }

  // Fallback: hash-based selection for any unknown port
  let hash = 0;
  for (let i = 0; i < portId.length; i++) {
    hash = ((hash << 5) - hash + portId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % HARBOR_LAYOUTS.length;
  return HARBOR_LAYOUTS[index];
}
