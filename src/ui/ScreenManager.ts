/**
 * ScreenManager handles registration, switching, and lifecycle of game screens.
 * Screens are HTML overlays rendered on top of the Three.js canvas.
 */

import type { FullGameState } from "../game/GameState";

/** Interface that all game screens must implement. */
export interface GameScreen {
  /** Build DOM content and return the container element. */
  show(): HTMLElement;
  /** Clean up DOM elements and event listeners. */
  hide(): void;
}

/** Screen identifiers used for navigation. */
export type ScreenId =
  | "setup"
  | "worldmap"
  | "office"
  | "shipbroker"
  | "port-operations";

export class ScreenManager {
  private screens: Map<ScreenId, GameScreen> = new Map();
  private activeScreenId: ScreenId | null = null;
  private activeScreen: GameScreen | null = null;
  private overlay: HTMLElement;
  private gameState: FullGameState | null = null;

  constructor() {
    // Create or find the UI overlay container
    let existing = document.getElementById("ui-overlay");
    if (existing) {
      this.overlay = existing;
    } else {
      this.overlay = document.createElement("div");
      this.overlay.id = "ui-overlay";
      document.body.appendChild(this.overlay);
    }
  }

  /** Register a screen with a given identifier. */
  register(id: ScreenId, screen: GameScreen): void {
    this.screens.set(id, screen);
  }

  /** Get the currently active screen id. */
  getActiveScreenId(): ScreenId | null {
    return this.activeScreenId;
  }

  /** Navigate to a screen by id. Hides the current screen first. */
  showScreen(id: ScreenId): void {
    // Hide current screen
    if (this.activeScreen) {
      this.activeScreen.hide();
      this.overlay.innerHTML = "";
    }

    const screen = this.screens.get(id);
    if (!screen) {
      console.error(`Screen not found: ${id}`);
      return;
    }

    this.activeScreenId = id;
    this.activeScreen = screen;

    const element = screen.show();
    this.overlay.appendChild(element);
  }

  /** Store the game state so screens can access it. */
  setGameState(state: FullGameState): void {
    this.gameState = state;
  }

  /** Retrieve the current game state. */
  getGameState(): FullGameState | null {
    return this.gameState;
  }
}
