/**
 * ShipIllustration — CSS-drawn ship illustrations for broker, info, repair, and departure screens.
 * Each of the 10 ship classes has a visually distinct profile using nested divs with CSS classes.
 * Kept to ~15-20 divs max per ship for performance.
 */

/* Ship profiles are keyed by ship spec IDs from the catalog in src/data/ships.ts */

/** Ship visual profile — defines how a ship class looks. */
interface ShipProfile {
  /** Hull length as % of container width */
  hullLengthPct: number;
  /** Hull height as % of container height */
  hullHeightPct: number;
  /** Superstructure position from left as % of hull length */
  bridgePositionPct: number;
  /** Superstructure width as % of hull length */
  bridgeWidthPct: number;
  /** Superstructure height as % of container height */
  bridgeHeightPct: number;
  /** Funnel height as % of container height */
  funnelHeightPct: number;
  /** Number of cargo hold sections (0-5) */
  cargoSections: number;
  /** Hull color */
  hullColor: string;
  /** Superstructure color */
  bridgeColor: string;
  /** Whether ship has a bow ramp (RORO) */
  hasBowRamp: boolean;
  /** Whether ship has visible container stacks */
  hasContainers: boolean;
  /** Whether ship has a rounded tanker deck */
  hasTankerDeck: boolean;
  /** Bow shape: 'pointed' | 'blunt' | 'raked' */
  bowShape: "pointed" | "blunt" | "raked";
  /** Beam width for dry dock as % of dock width */
  beamPct: number;
}

/** Visual profiles for each of the 10 ship classes. */
const SHIP_PROFILES: Record<string, ShipProfile> = {
  "coastal-trader": {
    hullLengthPct: 55,
    hullHeightPct: 20,
    bridgePositionPct: 65,
    bridgeWidthPct: 22,
    bridgeHeightPct: 22,
    funnelHeightPct: 12,
    cargoSections: 1,
    hullColor: "#3a5f8a",
    bridgeColor: "#c8c8b4",
    hasBowRamp: false,
    hasContainers: false,
    hasTankerDeck: false,
    bowShape: "blunt",
    beamPct: 30,
  },
  "island-hopper": {
    hullLengthPct: 60,
    hullHeightPct: 22,
    bridgePositionPct: 60,
    bridgeWidthPct: 20,
    bridgeHeightPct: 24,
    funnelHeightPct: 13,
    cargoSections: 2,
    hullColor: "#2d6a4f",
    bridgeColor: "#d4cbb8",
    hasBowRamp: false,
    hasContainers: false,
    hasTankerDeck: false,
    bowShape: "blunt",
    beamPct: 32,
  },
  "regional-carrier": {
    hullLengthPct: 68,
    hullHeightPct: 24,
    bridgePositionPct: 72,
    bridgeWidthPct: 16,
    bridgeHeightPct: 26,
    funnelHeightPct: 14,
    cargoSections: 3,
    hullColor: "#4a4a6a",
    bridgeColor: "#d0c8b0",
    hasBowRamp: false,
    hasContainers: false,
    hasTankerDeck: false,
    bowShape: "pointed",
    beamPct: 36,
  },
  "ocean-workhorse": {
    hullLengthPct: 74,
    hullHeightPct: 25,
    bridgePositionPct: 75,
    bridgeWidthPct: 14,
    bridgeHeightPct: 28,
    funnelHeightPct: 15,
    cargoSections: 4,
    hullColor: "#5a3a3a",
    bridgeColor: "#c8c0a8",
    hasBowRamp: false,
    hasContainers: false,
    hasTankerDeck: false,
    bowShape: "pointed",
    beamPct: 38,
  },
  "trade-runner": {
    hullLengthPct: 78,
    hullHeightPct: 22,
    bridgePositionPct: 80,
    bridgeWidthPct: 12,
    bridgeHeightPct: 30,
    funnelHeightPct: 14,
    cargoSections: 3,
    hullColor: "#2a4a6a",
    bridgeColor: "#d4d0c0",
    hasBowRamp: false,
    hasContainers: true,
    hasTankerDeck: false,
    bowShape: "raked",
    beamPct: 40,
  },
  "deep-sea-hauler": {
    hullLengthPct: 82,
    hullHeightPct: 24,
    bridgePositionPct: 82,
    bridgeWidthPct: 11,
    bridgeHeightPct: 32,
    funnelHeightPct: 15,
    cargoSections: 4,
    hullColor: "#1a3a5a",
    bridgeColor: "#c8c4b4",
    hasBowRamp: false,
    hasContainers: true,
    hasTankerDeck: false,
    bowShape: "raked",
    beamPct: 42,
  },
  "global-express": {
    hullLengthPct: 84,
    hullHeightPct: 28,
    bridgePositionPct: 78,
    bridgeWidthPct: 14,
    bridgeHeightPct: 26,
    funnelHeightPct: 13,
    cargoSections: 2,
    hullColor: "#3a3a5a",
    bridgeColor: "#d0ccc0",
    hasBowRamp: true,
    hasContainers: false,
    hasTankerDeck: false,
    bowShape: "raked",
    beamPct: 44,
  },
  "atlantic-giant": {
    hullLengthPct: 88,
    hullHeightPct: 26,
    bridgePositionPct: 85,
    bridgeWidthPct: 10,
    bridgeHeightPct: 34,
    funnelHeightPct: 16,
    cargoSections: 5,
    hullColor: "#2a2a4a",
    bridgeColor: "#c4c0b0",
    hasBowRamp: false,
    hasContainers: true,
    hasTankerDeck: false,
    bowShape: "raked",
    beamPct: 46,
  },
  "sovereign-class": {
    hullLengthPct: 90,
    hullHeightPct: 28,
    bridgePositionPct: 82,
    bridgeWidthPct: 12,
    bridgeHeightPct: 30,
    funnelHeightPct: 15,
    cargoSections: 4,
    hullColor: "#3a2a4a",
    bridgeColor: "#d0c8b8",
    hasBowRamp: true,
    hasContainers: true,
    hasTankerDeck: false,
    bowShape: "raked",
    beamPct: 48,
  },
  "leviathan": {
    hullLengthPct: 92,
    hullHeightPct: 22,
    bridgePositionPct: 86,
    bridgeWidthPct: 9,
    bridgeHeightPct: 28,
    funnelHeightPct: 18,
    cargoSections: 0,
    hullColor: "#4a2020",
    bridgeColor: "#c8c0a8",
    hasBowRamp: false,
    hasContainers: false,
    hasTankerDeck: true,
    bowShape: "raked",
    beamPct: 55,
  },
};

/** Get profile for a ship spec ID, with fallback defaults. */
function getProfile(shipSpecId: string): ShipProfile {
  return SHIP_PROFILES[shipSpecId] ?? SHIP_PROFILES["coastal-trader"];
}

/**
 * Create a CSS-drawn side-view ship illustration.
 * Returns an HTMLElement sized to the given width/height.
 */
export function createShipSideView(
  shipSpecId: string,
  width: number,
  height: number,
): HTMLElement {
  const p = getProfile(shipSpecId);
  const container = document.createElement("div");
  container.className = "ship-illust";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  // Water line
  const water = document.createElement("div");
  water.className = "ship-illust-water";
  container.appendChild(water);

  // Hull
  const hull = document.createElement("div");
  hull.className = `ship-illust-hull ship-illust-bow-${p.bowShape}`;
  hull.style.width = `${p.hullLengthPct}%`;
  hull.style.height = `${p.hullHeightPct}%`;
  hull.style.backgroundColor = p.hullColor;
  container.appendChild(hull);

  // Deck line
  const deck = document.createElement("div");
  deck.className = "ship-illust-deck";
  deck.style.width = `${p.hullLengthPct - 4}%`;
  deck.style.left = `${(100 - p.hullLengthPct) / 2 + 2}%`;
  container.appendChild(deck);

  // Cargo sections or tanker deck or containers
  if (p.hasTankerDeck) {
    const tanker = document.createElement("div");
    tanker.className = "ship-illust-tanker-deck";
    tanker.style.width = `${p.hullLengthPct * 0.6}%`;
    tanker.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * 0.05}%`;
    container.appendChild(tanker);

    // Pipe lines on tanker deck
    const pipes = document.createElement("div");
    pipes.className = "ship-illust-tanker-pipes";
    pipes.style.width = `${p.hullLengthPct * 0.55}%`;
    pipes.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * 0.07}%`;
    container.appendChild(pipes);
  } else if (p.hasContainers) {
    const cargoArea = document.createElement("div");
    cargoArea.className = "ship-illust-containers";
    const cargoWidth = p.hullLengthPct * 0.55;
    cargoArea.style.width = `${cargoWidth}%`;
    cargoArea.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * 0.05}%`;
    cargoArea.style.height = `${p.hullHeightPct * 0.8}%`;

    // Individual container stacks
    for (let i = 0; i < p.cargoSections; i++) {
      const stack = document.createElement("div");
      stack.className = "ship-illust-container-stack";
      const colors = ["#c44", "#48a", "#4a4", "#ca4", "#84c"];
      stack.style.backgroundColor = colors[i % colors.length];
      cargoArea.appendChild(stack);
    }
    container.appendChild(cargoArea);
  } else if (p.cargoSections > 0) {
    for (let i = 0; i < p.cargoSections; i++) {
      const hold = document.createElement("div");
      hold.className = "ship-illust-hold";
      const holdAreaWidth = p.hullLengthPct * 0.55;
      const holdWidth = holdAreaWidth / p.cargoSections - 2;
      const holdLeft =
        (100 - p.hullLengthPct) / 2 +
        p.hullLengthPct * 0.05 +
        (holdAreaWidth / p.cargoSections) * i;
      hold.style.width = `${holdWidth}%`;
      hold.style.left = `${holdLeft}%`;
      container.appendChild(hold);
    }
  }

  // Bow ramp for RORO ships
  if (p.hasBowRamp) {
    const ramp = document.createElement("div");
    ramp.className = "ship-illust-bow-ramp";
    ramp.style.left = `${(100 - p.hullLengthPct) / 2}%`;
    container.appendChild(ramp);
  }

  // Bridge / superstructure
  const bridge = document.createElement("div");
  bridge.className = "ship-illust-bridge";
  bridge.style.width = `${p.hullLengthPct * (p.bridgeWidthPct / 100)}%`;
  bridge.style.height = `${p.bridgeHeightPct}%`;
  bridge.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * (p.bridgePositionPct / 100) - p.hullLengthPct * (p.bridgeWidthPct / 100) / 2}%`;
  bridge.style.backgroundColor = p.bridgeColor;
  container.appendChild(bridge);

  // Bridge windows
  const windows = document.createElement("div");
  windows.className = "ship-illust-windows";
  bridge.appendChild(windows);

  // Funnel
  const funnel = document.createElement("div");
  funnel.className = "ship-illust-funnel";
  funnel.style.height = `${p.funnelHeightPct}%`;
  funnel.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * (p.bridgePositionPct / 100) - 1}%`;
  container.appendChild(funnel);

  // Mast
  const mast = document.createElement("div");
  mast.className = "ship-illust-mast";
  mast.style.left = `${(100 - p.hullLengthPct) / 2 + p.hullLengthPct * 0.25}%`;
  container.appendChild(mast);

  return container;
}

/**
 * Create a CSS-drawn front/bow dry dock view.
 * Returns an HTMLElement showing the ship cross-section in a dock facility.
 */
export function createDryDockView(
  shipSpecId: string,
  width: number,
  height: number,
): HTMLElement {
  const p = getProfile(shipSpecId);
  const container = document.createElement("div");
  container.className = "ship-drydock";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  // Dock walls (left and right)
  const wallLeft = document.createElement("div");
  wallLeft.className = "ship-drydock-wall ship-drydock-wall-left";
  container.appendChild(wallLeft);

  const wallRight = document.createElement("div");
  wallRight.className = "ship-drydock-wall ship-drydock-wall-right";
  container.appendChild(wallRight);

  // Dock floor
  const floor = document.createElement("div");
  floor.className = "ship-drydock-floor";
  container.appendChild(floor);

  // Ship hull cross-section (V or U shape)
  const hullCross = document.createElement("div");
  hullCross.className = "ship-drydock-hull";
  hullCross.style.width = `${p.beamPct}%`;
  hullCross.style.backgroundColor = p.hullColor;
  container.appendChild(hullCross);

  // Keel
  const keel = document.createElement("div");
  keel.className = "ship-drydock-keel";
  container.appendChild(keel);

  // Supports (left and right)
  const supportLeft = document.createElement("div");
  supportLeft.className = "ship-drydock-support ship-drydock-support-left";
  supportLeft.style.left = `${(100 - p.beamPct) / 2 - 6}%`;
  container.appendChild(supportLeft);

  const supportRight = document.createElement("div");
  supportRight.className = "ship-drydock-support ship-drydock-support-right";
  supportRight.style.right = `${(100 - p.beamPct) / 2 - 6}%`;
  container.appendChild(supportRight);

  // Superstructure on top
  const superstructure = document.createElement("div");
  superstructure.className = "ship-drydock-super";
  superstructure.style.width = `${p.beamPct * 0.7}%`;
  superstructure.style.backgroundColor = p.bridgeColor;
  container.appendChild(superstructure);

  // Funnel on top of superstructure
  const funnel = document.createElement("div");
  funnel.className = "ship-drydock-funnel";
  container.appendChild(funnel);

  return container;
}
