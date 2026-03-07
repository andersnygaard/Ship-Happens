/**
 * TurnIndicator — Horizontal bar with numbered player circles.
 * Shows which player is currently active in a multiplayer game.
 * Only displays when there are 2+ players.
 */

export interface TurnIndicatorOptions {
  /** Total number of players (1-7). */
  playerCount: number;
  /** Currently active player index (0-based). */
  activeIndex: number;
  /** Name of the active player. */
  activePlayerName: string;
}

export class TurnIndicator {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    this.container.className = "turn-indicator";
  }

  /**
   * Render the indicator into the given parent element.
   * Only renders if playerCount >= 2.
   */
  render(options: TurnIndicatorOptions): HTMLElement {
    this.container.innerHTML = "";

    if (options.playerCount < 2) {
      this.container.classList.add("hidden");
      return this.container;
    }

    this.container.classList.remove("hidden");

    const circlesRow = document.createElement("div");
    circlesRow.className = "turn-indicator-circles";

    for (let i = 0; i < options.playerCount; i++) {
      const circle = document.createElement("div");
      circle.className = "turn-indicator-circle";
      if (i === options.activeIndex) {
        circle.classList.add("active");
      }
      circle.textContent = String(i + 1);
      circlesRow.appendChild(circle);
    }

    this.container.appendChild(circlesRow);

    // Player name label below
    const nameLabel = document.createElement("div");
    nameLabel.className = "turn-indicator-name";
    nameLabel.textContent = options.activePlayerName;
    this.container.appendChild(nameLabel);

    return this.container;
  }

  /**
   * Update the indicator to reflect a new active player.
   */
  update(options: TurnIndicatorOptions): void {
    this.render(options);
  }
}
