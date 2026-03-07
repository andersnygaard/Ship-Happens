/**
 * OfficeScreen — Company management stub.
 * Will eventually show the captain's office with company info,
 * financial reports, and action buttons.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerSummary } from "../../game/GameState";

export class OfficeScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen stub-screen office-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "stub-header";

    const title = document.createElement("h2");
    title.className = "stub-title";
    title.textContent = "Company Office";
    header.appendChild(title);

    const state = this.screenManager.getGameState();
    if (state) {
      const summary = getPlayerSummary(getActivePlayer(state));
      const subtitle = document.createElement("p");
      subtitle.className = "stub-subtitle";
      subtitle.textContent = `${summary.companyName} — Capital: $${summary.balanceMillions}M`;
      header.appendChild(subtitle);
    }

    this.container.appendChild(header);

    const content = document.createElement("div");
    content.className = "stub-content";

    const icon = document.createElement("span");
    icon.className = "stub-icon";
    icon.textContent = "\u{1F3E2}";
    content.appendChild(icon);

    const desc = document.createElement("p");
    desc.className = "stub-description";
    desc.textContent = "The company office will display your financial reports, allow you to review company status, and manage your shipping empire. Don't neglect it, or someone might take a dip into the till...";
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
