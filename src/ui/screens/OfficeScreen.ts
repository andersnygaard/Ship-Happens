/**
 * OfficeScreen — Company management hub.
 * Displays company status, fleet overview, financial summary,
 * and navigation buttons in an industrial/nautical office theme.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerSummary, getPlayerBalance } from "../../game/GameState";
import { getPortById } from "../../data/ports";
import { renderFleetOverview } from "../components/FleetOverview";
import { renderFinancialSummary } from "../components/FinancialSummary";
import { renderStatsPanel } from "../components/StatsPanel";
import { renderLeaderboard } from "../components/Leaderboard";
import { createSaveLoadDialog } from "../components/SaveLoadDialog";

export class OfficeScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen office-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state available.";
      return this.container;
    }

    const player = getActivePlayer(state);
    const summary = getPlayerSummary(player);

    // ─── Top Status Bar ──────────────────────────────────────────────
    const statusBar = document.createElement("div");
    statusBar.className = "office-status-bar";

    const companyNameEl = document.createElement("div");
    companyNameEl.className = "office-company-name heading-display";
    companyNameEl.textContent = summary.companyName;

    const statsEl = document.createElement("div");
    statsEl.className = "office-stats";

    const shipCountEl = document.createElement("div");
    shipCountEl.className = "office-stat-item";
    shipCountEl.innerHTML =
      `<span class="label">Ships</span><span class="value data-display">${summary.shipCount}</span>`;

    const capitalEl = document.createElement("div");
    capitalEl.className = "office-stat-item";
    capitalEl.innerHTML =
      `<span class="label">Million$</span><span class="value data-display">${summary.balanceMillions}</span>`;

    statsEl.appendChild(shipCountEl);
    statsEl.appendChild(capitalEl);

    statusBar.appendChild(companyNameEl);
    statusBar.appendChild(statsEl);
    this.container.appendChild(statusBar);

    // ─── Main Content Area ───────────────────────────────────────────
    const mainArea = document.createElement("div");
    mainArea.className = "office-main";

    // Fleet Overview Panel
    const fleetPanel = renderFleetOverview({
      ships: player.ships,
      activeCharters: player.activeCharters,
      totalDaysElapsed: state.time.totalDaysElapsed,
    });
    fleetPanel.classList.add("panel", "panel-riveted", "office-panel");
    mainArea.appendChild(fleetPanel);

    // Financial Summary Panel
    const finPanel = renderFinancialSummary({ finances: player.finances });
    finPanel.classList.add("panel", "panel-riveted", "office-panel");
    mainArea.appendChild(finPanel);

    // Statistics Panel
    const statsPanel = renderStatsPanel({
      statistics: player.statistics,
      playerName: player.name,
      companyName: player.companyName,
    });
    statsPanel.classList.add("panel", "panel-riveted", "office-panel");
    mainArea.appendChild(statsPanel);

    // Leaderboard (multiplayer)
    if (state.players.length > 1) {
      const leaderboard = renderLeaderboard({
        players: state.players,
        currentWeek: state.time.week,
        currentYear: state.time.year,
      });
      leaderboard.classList.add("panel", "panel-riveted", "office-panel");
      mainArea.appendChild(leaderboard);
    }

    this.container.appendChild(mainArea);

    // ─── Bottom Button Bar ───────────────────────────────────────────
    const footer = document.createElement("div");
    footer.className = "office-footer";

    const okBtn = document.createElement("button");
    okBtn.className = "btn btn-primary office-footer-btn";
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });

    const infoBtn = document.createElement("button");
    infoBtn.className = "btn btn-secondary office-footer-btn";
    infoBtn.textContent = "Info";
    infoBtn.addEventListener("click", () => {
      this.showInfoDialog();
    });

    const statusBtn = document.createElement("button");
    statusBtn.className = "btn btn-secondary office-footer-btn";
    statusBtn.textContent = "Status";
    statusBtn.addEventListener("click", () => {
      this.showStatusDialog();
    });

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-secondary office-footer-btn";
    saveBtn.textContent = "Save Game";
    saveBtn.addEventListener("click", () => {
      const currentState = this.screenManager.getGameState();
      if (currentState) {
        createSaveLoadDialog("save", currentState, {
          onLoad: () => {},
          onClose: () => {},
        });
      }
    });

    footer.appendChild(okBtn);
    footer.appendChild(infoBtn);
    footer.appendChild(statusBtn);
    footer.appendChild(saveBtn);
    this.container.appendChild(footer);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  /** Show a brief info dialog about the office. */
  private showInfoDialog(): void {
    const state = this.screenManager.getGameState();
    if (!state) return;
    const player = getActivePlayer(state);

    const overlay = document.createElement("div");
    overlay.className = "ship-info-overlay";

    const dialog = document.createElement("div");
    dialog.className = "panel panel-riveted office-dialog";

    const title = document.createElement("h3");
    title.className = "heading-copper";
    title.textContent = "Company Information";
    dialog.appendChild(title);

    const info = document.createElement("div");
    info.className = "office-dialog-content";
    const homePort = getPortById(player.homePortId);
    const homePortName = homePort ? `${homePort.name}, ${homePort.country}` : player.homePortId;
    info.innerHTML = `
      <p><strong>Captain:</strong> ${player.name}</p>
      <p><strong>Company:</strong> ${player.companyName}</p>
      <p><strong>Home Port:</strong> ${homePortName}</p>
      <p><strong>Fleet Size:</strong> ${player.ships.length} ship(s)</p>
    `;
    dialog.appendChild(info);

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary ship-info-close-btn";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", () => overlay.remove());
    dialog.appendChild(closeBtn);

    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  /** Show a status summary dialog. */
  private showStatusDialog(): void {
    const state = this.screenManager.getGameState();
    if (!state) return;
    const player = getActivePlayer(state);
    const balance = getPlayerBalance(player);

    const overlay = document.createElement("div");
    overlay.className = "ship-info-overlay";

    const dialog = document.createElement("div");
    dialog.className = "panel panel-riveted office-dialog";

    const title = document.createElement("h3");
    title.className = "heading-copper";
    title.textContent = "Company Status";
    dialog.appendChild(title);

    const info = document.createElement("div");
    info.className = "office-dialog-content";
    info.innerHTML = `
      <p><strong>Balance:</strong> $${balance.toLocaleString()}</p>
      <p><strong>Ships:</strong> ${player.ships.length}</p>
      <p><strong>Transactions:</strong> ${player.finances.ledger.length} total</p>
      <p><strong>Week:</strong> ${state.time.week}, Year: ${state.time.year}</p>
    `;
    dialog.appendChild(info);

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary ship-info-close-btn";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", () => overlay.remove());
    dialog.appendChild(closeBtn);

    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }
}
