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

  /** Navigate to a screen by id. Fades out the current screen, then fades in the new one. */
  showScreen(id: ScreenId): void {
    const screen = this.screens.get(id);
    if (!screen) {
      console.error(`Screen not found: ${id}`);
      return;
    }

    const TRANSITION_DURATION = 300;

    const showNext = (): void => {
      this.overlay.innerHTML = "";
      this.activeScreenId = id;
      this.activeScreen = screen;

      const element = screen.show();
      element.classList.add("screen-entering");
      this.overlay.appendChild(element);

      // Remove the entering class after animation completes
      setTimeout(() => {
        element.classList.remove("screen-entering");
      }, TRANSITION_DURATION);
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
