/**
 * Per-port visual configuration for skyline rendering.
 * Each port has a sky type, optional landmarks, building density, and color palette.
 */

export type SkyType =
  | "tropical"
  | "industrial"
  | "european"
  | "middle-eastern"
  | "arctic"
  | "asian"
  | "american"
  | "african"
  | "oceanic";

export type LandmarkType =
  | "opera-house"      // Sydney
  | "harbour-bridge"   // Sydney
  | "big-ben"          // London
  | "parliament"       // London
  | "skyscrapers"      // New York
  | "golden-gate"      // San Francisco
  | "sugarloaf"        // Rio de Janeiro
  | "christ-redeemer"  // Rio de Janeiro
  | "mount-fuji"       // Tokyo
  | "port-cranes"      // Rotterdam
  | "church-spires"    // Hamburg
  | "mosque"           // Middle Eastern ports
  | "pagoda"           // Asian ports
  | "palm-trees"       // Tropical ports
  | "mountains"        // Mountain backdrop
  | "pyramids"         // Alexandria
  | "lighthouse";      // Generic coastal

export interface PortSkylineConfig {
  readonly skyType: SkyType;
  readonly landmarks: readonly LandmarkType[];
  readonly buildingDensity: number; // 0.0 to 1.0
  readonly colorPalette: {
    readonly skyTop: string;
    readonly skyBottom: string;
    readonly water: string;
    readonly waterHighlight: string;
    readonly buildingBase: string;
    readonly buildingHighlight: string;
    readonly accent: string;
  };
}

/**
 * Skyline configuration for all 30 ports.
 * Keyed by port ID.
 */
export const PORT_SKYLINE_DATA: Record<string, PortSkylineConfig> = {
  "alexandria": {
    skyType: "middle-eastern",
    landmarks: ["pyramids", "mosque", "lighthouse"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#1a0a2e",
      skyBottom: "#c4722a",
      water: "#0a2a4a",
      waterHighlight: "#1a4a7a",
      buildingBase: "#2a1a0a",
      buildingHighlight: "#5a3a1a",
      accent: "#d4a244",
    },
  },
  "basrah": {
    skyType: "middle-eastern",
    landmarks: ["mosque"],
    buildingDensity: 0.4,
    colorPalette: {
      skyTop: "#2a1a0e",
      skyBottom: "#d4923a",
      water: "#0a2244",
      waterHighlight: "#1a3a6a",
      buildingBase: "#3a2a1a",
      buildingHighlight: "#6a4a2a",
      accent: "#c4a254",
    },
  },
  "buenos-aires": {
    skyType: "european",
    landmarks: ["church-spires"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#1a2a4e",
      skyBottom: "#4a7aaa",
      water: "#0a2244",
      waterHighlight: "#2a5a8a",
      buildingBase: "#2a2a3a",
      buildingHighlight: "#5a5a6a",
      accent: "#8aaaca",
    },
  },
  "calcutta": {
    skyType: "tropical",
    landmarks: ["mosque", "palm-trees"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#0a1a2e",
      skyBottom: "#4a8a6a",
      water: "#0a3a3a",
      waterHighlight: "#1a5a5a",
      buildingBase: "#2a2a1a",
      buildingHighlight: "#5a5a3a",
      accent: "#7aaa6a",
    },
  },
  "cape-town": {
    skyType: "african",
    landmarks: ["mountains"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#1a2a4e",
      skyBottom: "#6a9aca",
      water: "#0a2a5a",
      waterHighlight: "#2a5a9a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#5a5a5a",
      accent: "#7a9aaa",
    },
  },
  "dar-es-salaam": {
    skyType: "tropical",
    landmarks: ["palm-trees", "mosque"],
    buildingDensity: 0.3,
    colorPalette: {
      skyTop: "#0a1a3e",
      skyBottom: "#3a8a5a",
      water: "#0a3a4a",
      waterHighlight: "#1a5a6a",
      buildingBase: "#1a2a1a",
      buildingHighlight: "#3a5a3a",
      accent: "#5a9a5a",
    },
  },
  "hamburg": {
    skyType: "industrial",
    landmarks: ["church-spires", "port-cranes"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#1a2a3e",
      skyBottom: "#5a7a9a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a5a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#4a4a4a",
      accent: "#8a6a4a",
    },
  },
  "hong-kong": {
    skyType: "asian",
    landmarks: ["skyscrapers", "pagoda"],
    buildingDensity: 0.9,
    colorPalette: {
      skyTop: "#0a0a2e",
      skyBottom: "#2a4a7a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a6a",
      buildingBase: "#1a1a2a",
      buildingHighlight: "#3a3a5a",
      accent: "#ea4a4a",
    },
  },
  "houston": {
    skyType: "american",
    landmarks: ["skyscrapers"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#1a2a4e",
      skyBottom: "#6a9aca",
      water: "#0a2a4a",
      waterHighlight: "#2a5a8a",
      buildingBase: "#2a2a3a",
      buildingHighlight: "#5a5a6a",
      accent: "#aa7a4a",
    },
  },
  "jebel-dhanna": {
    skyType: "middle-eastern",
    landmarks: ["mosque"],
    buildingDensity: 0.2,
    colorPalette: {
      skyTop: "#2a1a0e",
      skyBottom: "#e4a24a",
      water: "#0a2a5a",
      waterHighlight: "#1a4a8a",
      buildingBase: "#4a3a2a",
      buildingHighlight: "#7a6a5a",
      accent: "#d4b264",
    },
  },
  "karachi": {
    skyType: "middle-eastern",
    landmarks: ["mosque", "port-cranes"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#1a1a2e",
      skyBottom: "#b4823a",
      water: "#0a2244",
      waterHighlight: "#1a4a7a",
      buildingBase: "#2a2a1a",
      buildingHighlight: "#5a5a3a",
      accent: "#c4924a",
    },
  },
  "lagos": {
    skyType: "tropical",
    landmarks: ["palm-trees", "mosque"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#0a1a2e",
      skyBottom: "#4a7a4a",
      water: "#0a2a3a",
      waterHighlight: "#1a4a5a",
      buildingBase: "#2a1a1a",
      buildingHighlight: "#4a3a2a",
      accent: "#6a8a4a",
    },
  },
  "lima": {
    skyType: "american",
    landmarks: ["mountains", "church-spires"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#1a2a4e",
      skyBottom: "#8a9aaa",
      water: "#0a2a4a",
      waterHighlight: "#2a5a7a",
      buildingBase: "#3a2a2a",
      buildingHighlight: "#6a5a4a",
      accent: "#9a8a6a",
    },
  },
  "london": {
    skyType: "european",
    landmarks: ["big-ben", "parliament"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#1a1a2e",
      skyBottom: "#5a6a7a",
      water: "#0a1a2a",
      waterHighlight: "#1a3a4a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#4a4a4a",
      accent: "#7a6a5a",
    },
  },
  "marseilles": {
    skyType: "european",
    landmarks: ["church-spires", "lighthouse"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#1a2a5e",
      skyBottom: "#7aaadd",
      water: "#0a2a5a",
      waterHighlight: "#2a5a9a",
      buildingBase: "#3a2a2a",
      buildingHighlight: "#6a5a4a",
      accent: "#aa8a5a",
    },
  },
  "monrovia": {
    skyType: "tropical",
    landmarks: ["palm-trees", "port-cranes"],
    buildingDensity: 0.3,
    colorPalette: {
      skyTop: "#0a1a2e",
      skyBottom: "#3a7a4a",
      water: "#0a2a3a",
      waterHighlight: "#1a4a5a",
      buildingBase: "#1a2a1a",
      buildingHighlight: "#3a4a3a",
      accent: "#5a8a4a",
    },
  },
  "new-york": {
    skyType: "american",
    landmarks: ["skyscrapers"],
    buildingDensity: 0.9,
    colorPalette: {
      skyTop: "#0a1a3e",
      skyBottom: "#4a6a9a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a6a",
      buildingBase: "#1a1a2a",
      buildingHighlight: "#3a3a4a",
      accent: "#6a8aaa",
    },
  },
  "panama": {
    skyType: "tropical",
    landmarks: ["palm-trees", "port-cranes"],
    buildingDensity: 0.4,
    colorPalette: {
      skyTop: "#0a2a3e",
      skyBottom: "#3a8a5a",
      water: "#0a3a4a",
      waterHighlight: "#1a5a6a",
      buildingBase: "#2a2a1a",
      buildingHighlight: "#4a4a3a",
      accent: "#5a9a5a",
    },
  },
  "pearl-harbor": {
    skyType: "tropical",
    landmarks: ["palm-trees", "mountains"],
    buildingDensity: 0.3,
    colorPalette: {
      skyTop: "#1a2a5e",
      skyBottom: "#5a9aca",
      water: "#0a3a6a",
      waterHighlight: "#2a6a9a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#4a4a4a",
      accent: "#4a9aaa",
    },
  },
  "piraeus": {
    skyType: "european",
    landmarks: ["church-spires", "lighthouse"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#1a2a5e",
      skyBottom: "#6aaadd",
      water: "#0a2a5a",
      waterHighlight: "#2a5a9a",
      buildingBase: "#3a3a2a",
      buildingHighlight: "#6a6a4a",
      accent: "#aaaaaa",
    },
  },
  "point-hope": {
    skyType: "arctic",
    landmarks: ["mountains"],
    buildingDensity: 0.1,
    colorPalette: {
      skyTop: "#0a1a3e",
      skyBottom: "#6a8aaa",
      water: "#1a3a5a",
      waterHighlight: "#3a6a8a",
      buildingBase: "#3a3a4a",
      buildingHighlight: "#6a6a7a",
      accent: "#8aaacc",
    },
  },
  "rio-de-janeiro": {
    skyType: "tropical",
    landmarks: ["sugarloaf", "christ-redeemer", "palm-trees"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#0a1a4e",
      skyBottom: "#4a9a6a",
      water: "#0a3a5a",
      waterHighlight: "#2a6a8a",
      buildingBase: "#2a2a1a",
      buildingHighlight: "#5a4a3a",
      accent: "#4aaa6a",
    },
  },
  "rotterdam": {
    skyType: "industrial",
    landmarks: ["port-cranes"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#1a2a3e",
      skyBottom: "#5a7a9a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a5a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#4a4a4a",
      accent: "#7a8a9a",
    },
  },
  "san-francisco": {
    skyType: "american",
    landmarks: ["golden-gate", "skyscrapers"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#1a2a5e",
      skyBottom: "#c47a3a",
      water: "#0a2a5a",
      waterHighlight: "#2a5a8a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#5a4a4a",
      accent: "#ca6a3a",
    },
  },
  "singapore": {
    skyType: "asian",
    landmarks: ["skyscrapers", "palm-trees"],
    buildingDensity: 0.8,
    colorPalette: {
      skyTop: "#0a1a3e",
      skyBottom: "#3a7a6a",
      water: "#0a2a3a",
      waterHighlight: "#1a4a5a",
      buildingBase: "#1a1a2a",
      buildingHighlight: "#3a3a4a",
      accent: "#4a8a7a",
    },
  },
  "sydney": {
    skyType: "oceanic",
    landmarks: ["opera-house", "harbour-bridge"],
    buildingDensity: 0.6,
    colorPalette: {
      skyTop: "#1a2a5e",
      skyBottom: "#6a9aca",
      water: "#0a2a5a",
      waterHighlight: "#2a5a9a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#5a5a5a",
      accent: "#6aaacc",
    },
  },
  "tokyo": {
    skyType: "asian",
    landmarks: ["mount-fuji", "pagoda"],
    buildingDensity: 0.8,
    colorPalette: {
      skyTop: "#0a0a2e",
      skyBottom: "#4a5a8a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a5a",
      buildingBase: "#1a1a2a",
      buildingHighlight: "#3a3a4a",
      accent: "#ca4a5a",
    },
  },
  "vancouver": {
    skyType: "american",
    landmarks: ["mountains", "port-cranes"],
    buildingDensity: 0.5,
    colorPalette: {
      skyTop: "#1a2a4e",
      skyBottom: "#5a8aaa",
      water: "#0a2a4a",
      waterHighlight: "#2a5a7a",
      buildingBase: "#2a2a2a",
      buildingHighlight: "#4a4a4a",
      accent: "#5a9aaa",
    },
  },
  "bombay": {
    skyType: "tropical",
    landmarks: ["mosque", "palm-trees"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#0a1a2e",
      skyBottom: "#b4723a",
      water: "#0a2a3a",
      waterHighlight: "#1a4a5a",
      buildingBase: "#2a1a1a",
      buildingHighlight: "#5a3a2a",
      accent: "#c4824a",
    },
  },
  "yokohama": {
    skyType: "asian",
    landmarks: ["mount-fuji", "port-cranes"],
    buildingDensity: 0.7,
    colorPalette: {
      skyTop: "#0a1a3e",
      skyBottom: "#4a6a9a",
      water: "#0a1a3a",
      waterHighlight: "#1a3a6a",
      buildingBase: "#1a1a2a",
      buildingHighlight: "#3a3a4a",
      accent: "#ca5a6a",
    },
  },
};
