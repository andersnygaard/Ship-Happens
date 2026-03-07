/**
 * PortOperationsScreen — Port operations stub.
 * Will eventually show the Captain's Orders menu with
 * Repair, Refuel, Charter, Lay Up, and Load options.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerSummary } from "../../game/GameState";

export class PortOperationsScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen stub-screen port-operations-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "stub-header";

    const title = document.createElement("h2");
    title.className = "stub-title";
    title.textContent = "Port Operations";
    header.appendChild(title);

    const state = this.screenManager.getGameState();
    if (state) {
      const summary = getPlayerSummary(getActivePlayer(state));
      const subtitle = document.createElement("p");
      subtitle.className = "stub-subtitle";
      subtitle.textContent = `Captain's Orders — ${summary.companyName}`;
      header.appendChild(subtitle);
    }

    this.container.appendChild(header);

    const content = document.createElement("div");
    content.className = "stub-content";

    const icon = document.createElement("span");
    icon.className = "stub-icon";
    icon.textContent = "\u{2693}";
    content.appendChild(icon);

    const desc = document.createElement("p");
    desc.className = "stub-description";
    desc.textContent = "Port operations will allow you to repair your ship, refuel, accept charter contracts, lay up ships, and load cargo. Each port offers different services and rates.";
    content.appendChild(desc);

    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary stub-back-btn";
    backBtn.textContent = "Back to Map";
    backBtn.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
    content.appendChild(backBtn);

    this.container.appendChild(content);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }
}
