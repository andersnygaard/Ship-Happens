/**
 * PortDepartureScreen — Shows port arrival options.
 * Player chooses to "steer by hand" (free) or "use tug's help" (costs $50,000).
 * Both options currently proceed directly to Port Operations
 * (maneuvering minigame is a future task).
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer } from "../../game/GameState";
import { getPortById } from "../../data/ports";
import { debit } from "../../game/FinancialSystem";
import { getTimeSnapshot } from "../../game/TimeSystem";

const TUG_COST = 50_000;

export class PortDepartureScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen port-departure-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state.";
      return this.container;
    }

    const player = getActivePlayer(state);
    // Find first ship that is in port (the one that just arrived)
    const ship = player.ships.find((s) => s.currentPortId !== null);
    const port = ship?.currentPortId ? getPortById(ship.currentPortId) : null;

    const panel = document.createElement("div");
    panel.className = "port-departure-panel panel panel-riveted";

    // Title
    const title = document.createElement("h2");
    title.className = "port-departure-title heading-copper";
    title.textContent = "Arriving at Port";
    panel.appendChild(title);

    // Port name
    if (port) {
      const portName = document.createElement("div");
      portName.className = "port-departure-port-name data-display";
      portName.textContent = port.name;
      panel.appendChild(portName);
    }

    // Description
    const desc = document.createElement("p");
    desc.className = "port-departure-description";
    desc.textContent =
      "Your ship is approaching the harbor. How would you like to dock?";
    panel.appendChild(desc);

    // Choice buttons
    const btnContainer = document.createElement("div");
    btnContainer.className = "port-departure-buttons";

    // Steer by hand (free)
    const steerBtn = document.createElement("button");
    steerBtn.className = "btn btn-primary port-departure-btn";
    steerBtn.innerHTML = "<strong>Steer by Hand</strong><br><span class='port-departure-cost'>Free</span>";
    steerBtn.addEventListener("click", () => {
      this.screenManager.showScreen("port-operations");
    });
    btnContainer.appendChild(steerBtn);

    // Use tug (costs money)
    const tugBtn = document.createElement("button");
    tugBtn.className = "btn btn-secondary port-departure-btn";
    tugBtn.innerHTML = `<strong>Use Tug's Help</strong><br><span class='port-departure-cost'>$${TUG_COST.toLocaleString()}</span>`;
    tugBtn.addEventListener("click", () => {
      const time = getTimeSnapshot(state.time);
      debit(player.finances, TUG_COST, "Tug assistance at port", time);
      this.screenManager.showScreen("port-operations");
    });
    btnContainer.appendChild(tugBtn);

    panel.appendChild(btnContainer);
    this.container.appendChild(panel);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }
}
