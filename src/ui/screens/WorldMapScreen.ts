/**
 * WorldMapScreen — World map stub.
 * Displays player info and navigation buttons.
 * Will eventually show the Mercator-projection world map with port markers.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerSummary, getFormattedTime } from "../../game/GameState";

export class WorldMapScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen worldmap-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();

    // Header bar
    const header = document.createElement("div");
    header.className = "worldmap-header";

    const title = document.createElement("div");
    title.className = "worldmap-title";
    title.textContent = "Ship Happens";
    header.appendChild(title);

    if (state) {
      const player = getActivePlayer(state);
      const summary = getPlayerSummary(player);

      const info = document.createElement("div");
      info.className = "worldmap-info";

      info.appendChild(this.createInfoItem("Company", summary.companyName));
      info.appendChild(this.createInfoItem("Captain", summary.name));
      info.appendChild(this.createInfoItem("Capital", `$${summary.balanceMillions}M`));
      info.appendChild(this.createInfoItem("Ships", String(summary.shipCount)));

      header.appendChild(info);
    }

    this.container.appendChild(header);

    // Main body (placeholder for the actual map)
    const body = document.createElement("div");
    body.className = "worldmap-body";

    const placeholder = document.createElement("div");
    placeholder.className = "worldmap-placeholder";

    const icon = document.createElement("span");
    icon.className = "placeholder-icon";
    icon.textContent = "\u{1F30D}";
    placeholder.appendChild(icon);

    const text = document.createElement("p");
    text.textContent = "World Map — Coming Soon";
    placeholder.appendChild(text);

    const subtext = document.createElement("p");
    subtext.style.fontSize = "14px";
    subtext.style.marginTop = "8px";
    subtext.textContent = "Use the sidebar buttons to navigate between screens.";
    placeholder.appendChild(subtext);

    body.appendChild(placeholder);
    this.container.appendChild(body);

    // Sidebar navigation buttons
    const sidebar = document.createElement("div");
    sidebar.className = "worldmap-sidebar";

    sidebar.appendChild(this.createSidebarBtn("\u{1F30E}", "Globe", () => {
      // Already on world map
    }));
    sidebar.appendChild(this.createSidebarBtn("\u{1F3E2}", "Office", () => {
      this.screenManager.showScreen("office");
    }));
    sidebar.appendChild(this.createSidebarBtn("\u{1F6A2}", "Broker", () => {
      this.screenManager.showScreen("shipbroker");
    }));

    this.container.appendChild(sidebar);

    // Footer with time display
    const footer = document.createElement("div");
    footer.className = "worldmap-footer";

    const timeDisplay = document.createElement("div");
    timeDisplay.className = "time-display";

    if (state) {
      const timeStr = getFormattedTime(state);
      timeDisplay.appendChild(this.createTimeItem("Time", timeStr));
    }

    footer.appendChild(timeDisplay);

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.textContent = "Start Action";
    startBtn.addEventListener("click", () => {
      // Placeholder for simulation start
      console.log("Start Action clicked");
    });
    footer.appendChild(startBtn);

    this.container.appendChild(footer);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private createInfoItem(label: string, value: string): HTMLElement {
    const item = document.createElement("div");
    item.className = "info-item";

    const labelEl = document.createElement("span");
    labelEl.className = "info-label";
    labelEl.textContent = label + ": ";

    const valueEl = document.createElement("span");
    valueEl.className = "info-value";
    valueEl.textContent = value;

    item.appendChild(labelEl);
    item.appendChild(valueEl);
    return item;
  }

  private createTimeItem(label: string, value: string): HTMLElement {
    const item = document.createElement("span");

    const labelEl = document.createElement("span");
    labelEl.className = "time-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "time-value";
    valueEl.textContent = value;

    item.appendChild(labelEl);
    item.appendChild(valueEl);
    return item;
  }

  private createSidebarBtn(iconText: string, label: string, onClick: () => void): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary sidebar-btn";

    const icon = document.createElement("span");
    icon.className = "btn-icon";
    icon.textContent = iconText;

    const text = document.createElement("span");
    text.textContent = label;

    btn.appendChild(icon);
    btn.appendChild(text);
    btn.addEventListener("click", onClick);

    return btn;
  }
}
