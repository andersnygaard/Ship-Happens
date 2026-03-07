/**
 * ShipBrokerScreen — Full ship broker implementation.
 * Shows "KLEIN & ULRICH LTD. SHIPBROKERS" with paginated ship browsing,
 * ship info panels, and the purchase/christening flow.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerBalance, getPlayerSummary, buyShip } from "../../game/GameState";
import { SHIP_CATALOG } from "../../data/ships";
import type { ShipSpec } from "../../data/types";
import { createShipCard } from "../components/ShipCard";
import { createShipInfoPanel } from "../components/ShipInfoPanel";
import { createPurchaseDialog, createMessageDialog } from "../components/PurchaseDialog";

const SHIPS_PER_PAGE = 3;

export class ShipBrokerScreen implements GameScreen {
  private container: HTMLElement;
  private currentPage: number = 0;
  /** Ships sorted by price, cheapest first. */
  private sortedShips: ShipSpec[];
  private totalPages: number;

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

    // Ship list area
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

    // Footer with pagination and back button
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

    // Pagination controls
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

    this.container.appendChild(footer);
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
        result.message,
        () => {
          dialog.remove();
          this.renderScreen(); // Re-render to update capital display
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
