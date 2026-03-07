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
  | "port-operations"
  | "travel"
  | "port-departure"
  | "maneuvering"
  | "gameover";

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
      console.warn("[ScreenManager] #ui-overlay not found in DOM, creating dynamically");
      this.overlay = document.createElement("div");
      this.overlay.id = "ui-overlay";
      document.body.appendChild(this.overlay);
    }

    // Ensure the overlay has the correct stacking context to appear above the canvas
    this.overlay.style.position = "fixed";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.width = "100%";
    this.overlay.style.height = "100%";
    this.overlay.style.zIndex = "100";
    this.overlay.style.pointerEvents = "none";
  }

  /** Register a screen with a given identifier. */
  register(id: ScreenId, screen: GameScreen): void {
    this.screens.set(id, screen);
  }

  /** Get the currently active screen id. */
  getActiveScreenId(): ScreenId | null {
    return this.activeScreenId;
  }

  /** Navigate to a screen by id. Fades out the current screen, then fades in the new one. */
  showScreen(id: ScreenId): void {
    const screen = this.screens.get(id);
    if (!screen) {
      console.error(`[ScreenManager] Screen not found: ${id}`);
      return;
    }

    console.log(`[ScreenManager] Showing screen: ${id}`);

    const TRANSITION_DURATION = 300;

    const showNext = (): void => {
      this.overlay.innerHTML = "";
      this.activeScreenId = id;
      this.activeScreen = screen;

      try {
        const element = screen.show();
        element.classList.add("screen-entering");
        this.overlay.appendChild(element);

        // Remove the entering class after animation completes
        setTimeout(() => {
          element.classList.remove("screen-entering");
        }, TRANSITION_DURATION);
      } catch (err) {
        console.error(`[ScreenManager] Failed to render screen "${id}":`, err);
        // Show a fallback error message in the overlay so the user isn't stuck
        const errorDiv = document.createElement("div");
        errorDiv.className = "screen";
        errorDiv.style.cssText =
          "background: #1a1a2e; color: #e8e4d9; flex-direction: column; gap: 16px; pointer-events: auto;";
        errorDiv.innerHTML = `<h2>Screen Error</h2><p>Failed to load screen: ${id}</p><p>${String(err)}</p>`;
        this.overlay.appendChild(errorDiv);
      }
    };

    // If there's a current screen, fade it out first
    if (this.activeScreen) {
      const currentElement = this.overlay.firstElementChild as HTMLElement | null;
      if (currentElement) {
        currentElement.classList.add("screen-leaving");
        setTimeout(() => {
          this.activeScreen?.hide();
          showNext();
        }, TRANSITION_DURATION);
      } else {
        this.activeScreen.hide();
        showNext();
      }
    } else {
      showNext();
    }
  }

  /** Store the game state so screens can access it. */
  setGameState(state: FullGameState): void {
    this.gameState = state;
  }

  /** Retrieve the current game state. */
  getGameState(): FullGameState | null {
    return this.gameState;
  }

  /** Get a registered screen by id. */
  getScreen(id: ScreenId): GameScreen | undefined {
    return this.screens.get(id);
  }
}
