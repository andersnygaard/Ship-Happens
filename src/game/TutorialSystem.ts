/**
 * TutorialSystem — Tracks first-time player tutorial progress and provides
 * contextual hints to guide new players through the core game loop.
 *
 * Tutorial steps: buy_ship → accept_charter → load_cargo → travel → arrive
 * Progress is persisted in localStorage so hints are only shown once.
 */

import { toast } from "../ui/components/Toast";
import type { FullGameState } from "./GameState";
import { getActivePlayer } from "./GameState";

/** Ordered tutorial steps that guide a new player through the first game loop. */
export type TutorialStep =
  | "buy_ship"
  | "accept_charter"
  | "load_cargo"
  | "travel"
  | "arrive";

const TUTORIAL_STEPS: TutorialStep[] = [
  "buy_ship",
  "accept_charter",
  "load_cargo",
  "travel",
  "arrive",
];

const STORAGE_KEY = "ship-happens-tutorial";

/** Hint messages for each tutorial step. */
const STEP_HINTS: Record<TutorialStep, string> = {
  buy_ship: "Welcome, Captain! Visit the Ship Broker to purchase your first vessel.",
  accept_charter: "You have a ship! Go to a port and accept a Charter contract for cargo.",
  load_cargo: "Charter accepted! Load the cargo onto your ship before departing.",
  travel: "Cargo loaded! Select a destination on the map and click Start Action to set sail.",
  arrive: "You're on your way! Navigate safely to the destination port.",
};

interface TutorialState {
  completedSteps: TutorialStep[];
  dismissed: boolean;
}

class TutorialSystemImpl {
  private state: TutorialState;
  private lastHintStep: TutorialStep | null = null;

  constructor() {
    this.state = this.loadState();
  }

  /** Load tutorial state from localStorage. */
  private loadState(): TutorialState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TutorialState;
        return {
          completedSteps: parsed.completedSteps ?? [],
          dismissed: parsed.dismissed ?? false,
        };
      }
    } catch {
      // Ignore parse errors, start fresh
    }
    return { completedSteps: [], dismissed: false };
  }

  /** Save tutorial state to localStorage. */
  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage errors
    }
  }

  /** Check if the tutorial has been completed or dismissed. */
  isActive(): boolean {
    return !this.state.dismissed && this.state.completedSteps.length < TUTORIAL_STEPS.length;
  }

  /** Get the current (next uncompleted) tutorial step, or null if done. */
  getCurrentStep(): TutorialStep | null {
    if (this.state.dismissed) return null;
    for (const step of TUTORIAL_STEPS) {
      if (!this.state.completedSteps.includes(step)) {
        return step;
      }
    }
    return null;
  }

  /** Mark a tutorial step as completed. */
  completeStep(step: TutorialStep): void {
    if (!this.state.completedSteps.includes(step)) {
      this.state.completedSteps.push(step);
      this.saveState();

      // If all steps are now completed, show congratulations
      if (this.state.completedSteps.length === TUTORIAL_STEPS.length) {
        toast.show("Tutorial complete! You've mastered the basics. Press H for help anytime.", "success", 5000);
      }
    }
  }

  /** Dismiss/skip the tutorial entirely. */
  dismiss(): void {
    this.state.dismissed = true;
    this.saveState();
  }

  /** Reset tutorial progress (for testing or new game). */
  reset(): void {
    this.state = { completedSteps: [], dismissed: false };
    this.lastHintStep = null;
    this.saveState();
  }

  /**
   * Evaluate the current game state and show a contextual hint toast
   * if appropriate. Avoids repeating the same hint.
   */
  showContextualHint(gameState: FullGameState | null): void {
    if (!this.isActive()) return;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    // Don't repeat the same hint
    if (currentStep === this.lastHintStep) return;

    // Verify the hint is relevant to the current game state
    if (!this.isHintRelevant(currentStep, gameState)) return;

    this.lastHintStep = currentStep;
    const message = STEP_HINTS[currentStep];
    toast.show(message, "info", 6000);
  }

  /**
   * Check whether a hint is relevant given the current game state.
   * This prevents showing hints that don't make sense yet.
   */
  private isHintRelevant(step: TutorialStep, gameState: FullGameState | null): boolean {
    if (!gameState) return step === "buy_ship";

    const player = getActivePlayer(gameState);

    switch (step) {
      case "buy_ship":
        return player.ships.length === 0;
      case "accept_charter":
        return player.ships.length > 0;
      case "load_cargo":
        return player.ships.length > 0;
      case "travel":
        return player.ships.length > 0;
      case "arrive":
        return player.ships.some((s) => s.currentPortId === null);
      default:
        return true;
    }
  }

  /** Auto-detect step completion based on game state changes. */
  checkAutoComplete(gameState: FullGameState | null): void {
    if (!this.isActive() || !gameState) return;

    const player = getActivePlayer(gameState);

    // buy_ship: completed when player has at least one ship
    if (player.ships.length > 0) {
      this.completeStep("buy_ship");
    }

    // accept_charter: completed when player has any active charter
    if (Object.keys(player.activeCharters).length > 0) {
      this.completeStep("accept_charter");
    }

    // load_cargo: completed when any ship has cargo loaded
    if (player.ships.some((s) => s.cargoType !== null)) {
      this.completeStep("load_cargo");
    }

    // travel: completed when any ship is at sea (no currentPortId)
    if (player.ships.some((s) => s.currentPortId === null)) {
      this.completeStep("travel");
    }
  }

  /** Mark the "arrive" step as complete (called when ship arrives at port). */
  completeArrival(): void {
    this.completeStep("arrive");
  }

  /** Get the list of all tutorial steps and their completion status. */
  getProgress(): { step: TutorialStep; completed: boolean; hint: string }[] {
    return TUTORIAL_STEPS.map((step) => ({
      step,
      completed: this.state.completedSteps.includes(step),
      hint: STEP_HINTS[step],
    }));
  }
}

/** Singleton tutorial system instance. */
export const tutorialSystem = new TutorialSystemImpl();
