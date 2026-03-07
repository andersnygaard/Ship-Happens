/**
 * ShipBrokerScreen — Full ship broker implementation.
 * Shows "KLEIN & ULRICH LTD. SHIPBROKERS" with paginated ship browsing,
 * ship info panels, and the purchase/christening flow.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerBalance, getPlayerSummary, buyShip, sellShip } from "../../game/GameState";
import { SHIP_CATALOG } from "../../data/ships";
import { getShipSpecById } from "../../data/ships";
import type { ShipSpec, OwnedShip } from "../../data/types";
import { createShipCard } from "../components/ShipCard";
import { createShipInfoPanel } from "../components/ShipInfoPanel";
import { createPurchaseDialog, createMessageDialog } from "../components/PurchaseDialog";
import { calculateShipValue } from "../../game/ShipManager";
import { getTimeSnapshot } from "../../game/TimeSystem";

const SHIPS_PER_PAGE = 3;

export class ShipBrokerScreen implements GameScreen {
  private container: HTMLElement;
  private currentPage: number = 0;
  /** Ships sorted by price, cheapest first. */
  private sortedShips: ShipSpec[];
  private totalPages: number;
  /** Currently active tab: "buy" or "sell". */
  private activeTab: "buy" | "sell" = "buy";

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen shipbroker-screen";
    this.sortedShips = [...SHIP_CATALOG].sort((a, b) => a.priceMillions - b.priceMillions);
    this.totalPages = Math.ceil(this.sortedShips.length / SHIPS_PER_PAGE);
  }

  show(): HTMLElement {
    this.currentPage = 0;
    this.container.innerHTML = "";
    this.renderScreen();
    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  private renderScreen(): void {
    this.container.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "shipbroker-header";

    const title = document.createElement("h2");
    title.className = "shipbroker-title heading-display";
    title.textContent = "KLEIN & ULRICH LTD. SHIPBROKERS";
    header.appendChild(title);

    const state = this.screenManager.getGameState();
    if (state) {
      const summary = getPlayerSummary(getActivePlayer(state));
      const capitalLine = document.createElement("div");
      capitalLine.className = "shipbroker-capital data-display";
      capitalLine.textContent = `Your capital: $${summary.balanceMillions}M`;
      header.appendChild(capitalLine);
    }

    this.container.appendChild(header);

    // Tab bar (BUY / SELL)
    const tabBar = document.createElement("div");
    tabBar.className = "shipbroker-tab-bar";

    const buyTab = document.createElement("button");
    buyTab.className = `btn shipbroker-tab ${this.activeTab === "buy" ? "shipbroker-tab-active btn-primary" : "btn-secondary"}`;
    buyTab.textContent = "BUY SHIPS";
    buyTab.addEventListener("click", () => {
      this.activeTab = "buy";
      this.currentPage = 0;
      this.renderScreen();
    });
    tabBar.appendChild(buyTab);

    const sellTab = document.createElement("button");
    sellTab.className = `btn shipbroker-tab ${this.activeTab === "sell" ? "shipbroker-tab-active btn-primary" : "btn-secondary"}`;
    sellTab.textContent = "SELL SHIPS";
    sellTab.addEventListener("click", () => {
      this.activeTab = "sell";
      this.renderScreen();
    });
    tabBar.appendChild(sellTab);

    this.container.appendChild(tabBar);

    if (this.activeTab === "sell") {
      this.renderSellSection();
    } else {
      this.renderBuySection();
    }

    // Footer with back button
    const footer = document.createElement("div");
    footer.className = "shipbroker-footer";

    // Back button
    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary";
    backBtn.textContent = "Back to Map";
    backBtn.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
    footer.appendChild(backBtn);

    // Pagination controls (only for buy tab)
    if (this.activeTab === "buy") {
      const pagination = document.createElement("div");
      pagination.className = "shipbroker-pagination";

      const prevBtn = document.createElement("button");
      prevBtn.className = "btn btn-secondary shipbroker-page-btn";
      prevBtn.textContent = "\u25B2";
      prevBtn.disabled = this.currentPage <= 0;
      prevBtn.addEventListener("click", () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.renderScreen();
        }
      });
      pagination.appendChild(prevBtn);

      const pageIndicator = document.createElement("span");
      pageIndicator.className = "shipbroker-page-indicator data-display";
      pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
      pagination.appendChild(pageIndicator);

      const nextBtn = document.createElement("button");
      nextBtn.className = "btn btn-secondary shipbroker-page-btn";
      nextBtn.textContent = "\u25BC";
      nextBtn.disabled = this.currentPage >= this.totalPages - 1;
      nextBtn.addEventListener("click", () => {
        if (this.currentPage < this.totalPages - 1) {
          this.currentPage++;
          this.renderScreen();
        }
      });
      pagination.appendChild(nextBtn);

      // Elevator dots
      const dots = document.createElement("div");
      dots.className = "shipbroker-elevator-dots";
      for (let i = 0; i < this.totalPages; i++) {
        const dot = document.createElement("span");
        dot.className = `shipbroker-elevator-dot${i === this.currentPage ? " active" : ""}`;
        dot.addEventListener("click", () => {
          this.currentPage = i;
          this.renderScreen();
        });
        dots.appendChild(dot);
      }
      pagination.appendChild(dots);

      footer.appendChild(pagination);
    }

    this.container.appendChild(footer);
  }

  // ─── Buy Section ──────────────────────────────────────────────────────────

  private renderBuySection(): void {
    const listArea = document.createElement("div");
    listArea.className = "shipbroker-list-area";

    const shipsOnPage = this.getShipsForPage(this.currentPage);
    for (const spec of shipsOnPage) {
      const card = createShipCard(spec, {
        onBuy: (s) => this.handleBuy(s),
        onInfo: (s) => this.handleInfo(s),
      });
      listArea.appendChild(card);
    }

    this.container.appendChild(listArea);
  }

  // ─── Sell Section ─────────────────────────────────────────────────────────

  private renderSellSection(): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    const player = getActivePlayer(state);
    const time = getTimeSnapshot(state.time);

    const listArea = document.createElement("div");
    listArea.className = "shipbroker-list-area shipbroker-sell-area";

    if (player.ships.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "shipbroker-sell-empty";
      emptyMsg.textContent = "You have no ships to sell.";
      listArea.appendChild(emptyMsg);
      this.container.appendChild(listArea);
      return;
    }

    for (let i = 0; i < player.ships.length; i++) {
      const ship = player.ships[i];
      const card = this.createSellCard(ship, i, time);
      listArea.appendChild(card);
    }

    this.container.appendChild(listArea);
  }

  private createSellCard(
    ship: OwnedShip,
    shipIndex: number,
    time: { week: number; year: number },
  ): HTMLElement {
    const card = document.createElement("div");
    card.className = "shipbroker-sell-card panel panel-riveted";

    const spec = getShipSpecById(ship.specId);
    const valuation = calculateShipValue(ship, time.week, time.year);

    // Ship name and type
    const header = document.createElement("div");
    header.className = "shipbroker-sell-card-header";

    const nameEl = document.createElement("span");
    nameEl.className = "shipbroker-sell-name heading-copper";
    nameEl.textContent = ship.name;
    header.appendChild(nameEl);

    const typeEl = document.createElement("span");
    typeEl.className = "shipbroker-sell-type data-display";
    typeEl.textContent = spec ? `${spec.type} — ${spec.capacityBrt.toLocaleString()} BRT` : ship.specId;
    header.appendChild(typeEl);

    card.appendChild(header);

    // Ship details
    const details = document.createElement("div");
    details.className = "shipbroker-sell-details";

    const rows: [string, string][] = [
      ["Condition:", `${ship.conditionPercent}%`],
      ["Original Price:", `$${(valuation.originalPrice / 1_000_000).toFixed(1)}M`],
      ["Condition Factor:", `${(valuation.conditionFactor * 100).toFixed(0)}%`],
      ["Age Factor:", `${(valuation.ageFactor * 100).toFixed(0)}%`],
      ["Sale Value:", `$${(valuation.salePrice / 1_000_000).toFixed(2)}M`],
    ];

    if (ship.mortgageRemaining > 0) {
      rows.push(["Mortgage Owed:", `$${(ship.mortgageRemaining / 1_000_000).toFixed(2)}M`]);
      const net = valuation.salePrice - Math.min(ship.mortgageRemaining, valuation.salePrice);
      rows.push(["Net Proceeds:", `$${(net / 1_000_000).toFixed(2)}M`]);
    }

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "shipbroker-sell-row";

      const labelEl = document.createElement("span");
      labelEl.className = "shipbroker-sell-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "shipbroker-sell-value data-display";
      valueEl.textContent = value;

      // Highlight sale value
      if (label === "Sale Value:") {
        valueEl.style.color = "var(--color-gold)";
      }
      if (label === "Net Proceeds:") {
        valueEl.style.color = "var(--color-success)";
      }

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      details.appendChild(row);
    }

    card.appendChild(details);

    // Status warnings
    if (!ship.currentPortId) {
      const warning = document.createElement("div");
      warning.className = "shipbroker-sell-warning";
      warning.textContent = "Ship is at sea - cannot sell";
      card.appendChild(warning);
    } else if (ship.cargoType !== null) {
      const warning = document.createElement("div");
      warning.className = "shipbroker-sell-warning";
      warning.textContent = "Unload cargo before selling";
      card.appendChild(warning);
    }

    // Sell button
    const sellBtn = document.createElement("button");
    sellBtn.className = "btn btn-danger shipbroker-sell-btn";
    sellBtn.textContent = "SELL";
    sellBtn.disabled = !ship.currentPortId || ship.cargoType !== null;
    sellBtn.addEventListener("click", () => this.handleSell(shipIndex, ship, valuation.salePrice));
    card.appendChild(sellBtn);

    return card;
  }

  private handleSell(shipIndex: number, ship: OwnedShip, salePrice: number): void {
    const netLabel = ship.mortgageRemaining > 0
      ? `\nMortgage owed: $${(ship.mortgageRemaining / 1_000_000).toFixed(2)}M\nNet proceeds: $${((salePrice - Math.min(ship.mortgageRemaining, salePrice)) / 1_000_000).toFixed(2)}M`
      : "";

    // Confirm dialog
    const dialog = this.createConfirmDialog(
      "Confirm Sale",
      `Sell ${ship.name} for $${(salePrice / 1_000_000).toFixed(2)}M?${netLabel}\n\nThis cannot be undone.`,
      () => {
        dialog.remove();
        this.executeSale(shipIndex);
      },
      () => {
        dialog.remove();
      },
    );
    this.container.appendChild(dialog);
  }

  private executeSale(shipIndex: number): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    const result = sellShip(state, shipIndex);

    if (result.success) {
      const dialog = createMessageDialog(
        "Ship Sold",
        result.message,
        () => {
          dialog.remove();
          this.renderScreen();
        },
      );
      this.container.appendChild(dialog);
    } else {
      const dialog = createMessageDialog(
        "Sale Failed",
        result.message,
        () => dialog.remove(),
      );
      this.container.appendChild(dialog);
    }
  }

  private createConfirmDialog(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel: () => void,
  ): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "ship-info-overlay";

    const dialog = document.createElement("div");
    dialog.className = "purchase-dialog message-dialog panel panel-riveted";

    const titleEl = document.createElement("h3");
    titleEl.className = "purchase-dialog-title heading-copper";
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    const messageEl = document.createElement("p");
    messageEl.className = "message-dialog-text";
    messageEl.style.whiteSpace = "pre-line";
    messageEl.textContent = message;
    dialog.appendChild(messageEl);

    const buttons = document.createElement("div");
    buttons.className = "purchase-dialog-buttons";

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn-danger";
    confirmBtn.textContent = "CONFIRM SALE";
    confirmBtn.addEventListener("click", onConfirm);
    buttons.appendChild(confirmBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "CANCEL";
    cancelBtn.addEventListener("click", onCancel);
    buttons.appendChild(cancelBtn);

    dialog.appendChild(buttons);
    overlay.appendChild(dialog);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        onCancel();
      }
    });

    return overlay;
  }

  private getShipsForPage(page: number): ShipSpec[] {
    const start = page * SHIPS_PER_PAGE;
    return this.sortedShips.slice(start, start + SHIPS_PER_PAGE);
  }

  private handleInfo(spec: ShipSpec): void {
    const panel = createShipInfoPanel(spec, () => {
      panel.remove();
    });
    this.container.appendChild(panel);
  }

  private handleBuy(spec: ShipSpec): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    const player = getActivePlayer(state);
    const balance = getPlayerBalance(player);

    // Check if player can afford even the minimum deposit
    const minDeposit = spec.priceMillions * 1_000_000 * (spec.depositPercent / 100);
    if (balance < minDeposit) {
      const dialog = createMessageDialog(
        "Insufficient Funds",
        "Do us a favor, will you? Try to get some cash before you try to buy something next time!",
        () => dialog.remove(),
      );
      this.container.appendChild(dialog);
      return;
    }

    // Show purchase dialog
    const purchaseDialog = createPurchaseDialog(spec, balance, {
      onConfirm: (shipName: string, depositPercent: number) => {
        purchaseDialog.remove();
        this.executePurchase(spec, shipName, depositPercent);
      },
      onCancel: () => {
        purchaseDialog.remove();
      },
    });
    this.container.appendChild(purchaseDialog);
  }

  private executePurchase(spec: ShipSpec, shipName: string, depositPercent: number): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    const result = buyShip(state, spec.id, shipName, depositPercent);

    if (result.success) {
      const dialog = createMessageDialog(
        "Welcome, Shipowner!",
        result.message + "\n\nReturn to the World Map to plan your first voyage!",
        () => {
          dialog.remove();
          this.screenManager.showScreen("worldmap");
        },
      );
      this.container.appendChild(dialog);
    } else {
      const dialog = createMessageDialog(
        "Purchase Failed",
        result.message,
        () => dialog.remove(),
      );
      this.container.appendChild(dialog);
    }
  }
}
