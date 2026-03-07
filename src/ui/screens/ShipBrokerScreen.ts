/**
 * ShipBrokerScreen — Ship broker stub.
 * Will eventually show the Klein & Ulrich Ltd. Shipbrokers office
 * with ship browsing, purchasing, and christening flow.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerSummary } from "../../game/GameState";

export class ShipBrokerScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen stub-screen shipbroker-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "stub-header";

    const title = document.createElement("h2");
    title.className = "stub-title";
    title.textContent = "Ship Broker";
    header.appendChild(title);

    const state = this.screenManager.getGameState();
    if (state) {
      const summary = getPlayerSummary(getActivePlayer(state));
      const subtitle = document.createElement("p");
      subtitle.className = "stub-subtitle";
      subtitle.textContent = `Klein & Ulrich Ltd. Shipbrokers — Your capital: $${summary.balanceMillions}M`;
      header.appendChild(subtitle);
    }

    this.container.appendChild(header);

    const content = document.createElement("div");
    content.className = "stub-content";

    const icon = document.createElement("span");
    icon.className = "stub-icon";
    icon.textContent = "\u{1F6A2}";
    content.appendChild(icon);

    const desc = document.createElement("p");
    desc.className = "stub-description";
    desc.textContent = "Welcome to the ship broker! Here you will be able to browse available vessels, view specifications, purchase ships, and christen them. Try to get some cash before you try to buy something!";
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
