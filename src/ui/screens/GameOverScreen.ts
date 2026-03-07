/**
 * GameOverScreen — Displayed when a player goes bankrupt.
 * Shows a summary of the player's fate and offers a "New Game" button.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerBalance } from "../../game/GameState";

export class GameOverScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen gameover-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();

    // Main panel
    const panel = document.createElement("div");
    panel.className = "panel panel-riveted gameover-panel";

    // Title
    const title = document.createElement("h1");
    title.className = "heading-display gameover-title";
    title.textContent = "BANKRUPTCY";
    panel.appendChild(title);

    // Subtitle
    const subtitle = document.createElement("h2");
    subtitle.className = "heading-copper gameover-subtitle";
    subtitle.textContent = "Your shipping empire has sunk.";
    panel.appendChild(subtitle);

    // Details
    const details = document.createElement("div");
    details.className = "gameover-details";

    if (state) {
      const player = getActivePlayer(state);
      const balance = getPlayerBalance(player);

      details.innerHTML = `
        <p><strong>Captain:</strong> ${player.name}</p>
        <p><strong>Company:</strong> ${player.companyName}</p>
        <p><strong>Final Balance:</strong> <span class="gameover-negative">$${balance.toLocaleString()}</span></p>
        <p><strong>Ships Remaining:</strong> ${player.ships.length}</p>
        <p><strong>Week ${state.time.week}, Year ${state.time.year}</strong></p>
        <hr />
        <p class="gameover-message">
          With no ships and no money, your creditors have called in the receivers.
          The offices of <em>${player.companyName}</em> stand empty, the nameplate
          already removed from the door.
        </p>
      `;
    } else {
      details.innerHTML = `<p>Game over.</p>`;
    }

    panel.appendChild(details);

    // New Game button
    const btnContainer = document.createElement("div");
    btnContainer.className = "gameover-buttons";

    const newGameBtn = document.createElement("button");
    newGameBtn.className = "btn btn-primary gameover-btn";
    newGameBtn.textContent = "New Game";
    newGameBtn.addEventListener("click", () => {
      // Clear game state and return to setup
      this.screenManager.setGameState(null as never);
      this.screenManager.showScreen("setup");
    });
    btnContainer.appendChild(newGameBtn);

    panel.appendChild(btnContainer);
    this.container.appendChild(panel);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }
}
