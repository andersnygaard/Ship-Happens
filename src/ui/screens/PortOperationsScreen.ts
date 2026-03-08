/**
 * PortOperationsScreen — Full port operations screen with four-quadrant layout.
 * Top-left: Ship status (clipboard style)
 * Top-right: Port view (porthole frame)
 * Bottom-right: Port info (dark panel, yellow text)
 * Bottom-left: Captain's Orders menu (clipboard style)
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import type { FullGameState, PlayerState } from "../../game/GameState";
import type { OwnedShip, Port, CharterContract } from "../../data/types";
import {
  getActivePlayer,
  getPlayerBalance,
  getPlayerSummary,
  repairPlayerShip,
  refuelPlayerShip,
  getAvailableCharters,
  acceptCharter,
  loadShipCargo,
  layUpPlayerShip,
  reactivatePlayerShip,
  deliverCargo,
} from "../../game/GameState";
import { getPortById } from "../../data/ports";
import { getShipSpec } from "../../game/ShipManager";
import { createRepairDialog } from "../components/RepairDialog";
import { createRefuelDialog } from "../components/RefuelDialog";
import { createCharterDialog } from "../components/CharterDialog";
import type { CharterShipContext } from "../components/CharterDialog";
import { createPortSkylineCanvas } from "../components/PortSkyline";
import { toast } from "../components/Toast";
import { getPortCostMultiplier } from "../../game/WorldEvents";
import { createDeadlineStatusRow } from "../components/CharterDeadlineIndicator";

export class PortOperationsScreen implements GameScreen {
  private container: HTMLElement;
  /** Index of the active ship. Set externally when transitioning from travel/departure. */
  public activeShipIndex: number = 0;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen port-operations-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.renderNoState();
      return this.container;
    }

    const player = getActivePlayer(state);
    if (player.ships.length === 0) {
      this.renderNoShips();
      return this.container;
    }

    // Ensure activeShipIndex is valid
    if (this.activeShipIndex >= player.ships.length) {
      this.activeShipIndex = 0;
    }

    const ship = player.ships[this.activeShipIndex];
    const port = ship.currentPortId ? getPortById(ship.currentPortId) : undefined;

    if (!port) {
      this.renderShipAtSea(ship);
      return this.container;
    }

    // Auto-deliver cargo if ship arrived at charter destination
    const charter = player.activeCharters[ship.name];
    if (charter && ship.currentPortId === ship.cargoDestinationPortId) {
      const deliveryResult = deliverCargo(state, this.activeShipIndex);
      if (deliveryResult.success) {
        // Show delivery result prominently using toast
        const profitMsg = deliveryResult.netProfit >= 0
          ? `Profit: $${deliveryResult.netProfit.toLocaleString()}`
          : `Loss: $${Math.abs(deliveryResult.netProfit).toLocaleString()}`;
        toast.show(`Cargo delivered! ${profitMsg}`, deliveryResult.netProfit >= 0 ? "success" : "error");
        // Also show inline message after rendering
        setTimeout(() => this.showMessage(deliveryResult.message), 300);
      }
    }

    this.renderFullLayout(state, player, ship, port);
    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  // ─── Fallback renders ─────────────────────────────────────────────────────

  private renderNoState(): void {
    this.container.innerHTML = `
      <div class="port-ops-fallback">
        <h2 class="heading-copper">Port Operations</h2>
        <p>No active game.</p>
        <button class="btn btn-secondary port-ops-back-btn">Back to Map</button>
      </div>
    `;
    this.container.querySelector(".port-ops-back-btn")?.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
  }

  private renderNoShips(): void {
    this.container.innerHTML = `
      <div class="port-ops-fallback">
        <h2 class="heading-copper">Port Operations</h2>
        <p>You have no ships. Visit the Ship Broker first.</p>
        <button class="btn btn-secondary port-ops-back-btn">Back to Map</button>
      </div>
    `;
    this.container.querySelector(".port-ops-back-btn")?.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
  }

  private renderShipAtSea(ship: OwnedShip): void {
    this.container.innerHTML = `
      <div class="port-ops-fallback">
        <h2 class="heading-copper">Port Operations</h2>
        <p>${ship.name} is at sea. You must be in port to access operations.</p>
        <button class="btn btn-secondary port-ops-back-btn">Back to Map</button>
      </div>
    `;
    this.container.querySelector(".port-ops-back-btn")?.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
  }

  // ─── Main four-quadrant layout ────────────────────────────────────────────

  private renderFullLayout(
    state: FullGameState,
    player: PlayerState,
    ship: OwnedShip,
    port: Port,
  ): void {
    // Ship selector if multiple ships
    if (player.ships.length > 1) {
      const selector = this.createShipSelector(player);
      this.container.appendChild(selector);
    }

    // Four-quadrant grid
    const grid = document.createElement("div");
    grid.className = "port-ops-grid";

    grid.appendChild(this.createShipStatusPanel(state, player, ship, port));
    grid.appendChild(this.createPortViewPanel(port));
    grid.appendChild(this.createCaptainOrdersPanel(state, player, ship, port));
    grid.appendChild(this.createPortInfoPanel(port));

    this.container.appendChild(grid);

    // Footer with navigation buttons
    const footer = document.createElement("div");
    footer.className = "port-ops-footer";

    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary";
    backBtn.textContent = "Back to Map";
    backBtn.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
    footer.appendChild(backBtn);

    // "Set Sail" button — prominent button to leave port
    const setSailBtn = document.createElement("button");
    setSailBtn.className = "btn btn-primary";

    // Show appropriate text based on ship state
    const charter = player.activeCharters[ship.name];
    if (ship.cargoType && ship.cargoDestinationPortId) {
      const destPort = getPortById(ship.cargoDestinationPortId);
      const destName = destPort ? destPort.name : ship.cargoDestinationPortId;
      setSailBtn.textContent = `Set Sail to ${destName}`;
    } else if (charter && !ship.cargoType) {
      setSailBtn.textContent = "Load Cargo First!";
      setSailBtn.disabled = true;
    } else {
      setSailBtn.textContent = "Set Sail";
    }

    setSailBtn.addEventListener("click", () => {
      this.screenManager.showScreen("worldmap");
    });
    footer.appendChild(setSailBtn);

    this.container.appendChild(footer);
  }

  // ─── Ship Selector ────────────────────────────────────────────────────────

  private createShipSelector(player: PlayerState): HTMLElement {
    const selector = document.createElement("div");
    selector.className = "port-ops-ship-selector";

    const label = document.createElement("span");
    label.className = "port-ops-ship-selector-label";
    label.textContent = "Active Ship:";
    selector.appendChild(label);

    for (let i = 0; i < player.ships.length; i++) {
      const btn = document.createElement("button");
      btn.className = `btn ${i === this.activeShipIndex ? "btn-primary" : "btn-secondary"} port-ops-ship-btn`;
      btn.textContent = player.ships[i].name;
      btn.addEventListener("click", () => {
        this.activeShipIndex = i;
        this.show();
        // Re-mount into overlay
        const overlay = document.getElementById("ui-overlay");
        if (overlay) {
          overlay.innerHTML = "";
          overlay.appendChild(this.container);
        }
      });
      selector.appendChild(btn);
    }

    return selector;
  }

  // ─── Top-Left: Ship Status Panel ──────────────────────────────────────────

  private createShipStatusPanel(state: FullGameState, player: PlayerState, ship: OwnedShip, port: Port): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "port-ops-quadrant port-ops-ship-status panel panel-riveted";

    const title = document.createElement("h3");
    title.className = "port-ops-panel-title heading-copper";
    title.textContent = "Ship Status";
    panel.appendChild(title);

    const summary = getPlayerSummary(player);
    const spec = getShipSpec(ship);
    const balance = getPlayerBalance(player);

    // Determine origin and cargo info
    const originText = ship.cargoDestinationPortId ? "En route" : port.name;
    const cargoText = ship.cargoType || "No cargo";
    const charter = player.activeCharters[ship.name];
    const resultText = charter ? `Charter: $${charter.rate.toLocaleString()}` : "---";

    const rows: [string, string][] = [
      ["Company:", summary.companyName],
      ["Ship:", ship.name],
      ["Captain:", ship.captainName],
      ["Port:", originText],
      ["Cargo:", cargoText],
      ["Result:", resultText],
      ["Balance:", `$${(balance / 1_000_000).toFixed(1)}M`],
      ["Condition:", `${ship.conditionPercent}%`],
      ["Fuel:", `${ship.fuelTons.toLocaleString()}t${spec ? ` / ${spec.bunkerCapacityTons.toLocaleString()}t` : ""}`],
    ];

    const table = document.createElement("div");
    table.className = "port-ops-status-table";

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "port-ops-status-row";

      const labelEl = document.createElement("span");
      labelEl.className = "port-ops-status-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "port-ops-status-value data-display";
      valueEl.textContent = value;

      // Color-code condition
      if (label === "Condition:") {
        if (ship.conditionPercent <= 20) {
          valueEl.style.color = "var(--color-danger)";
        } else if (ship.conditionPercent <= 50) {
          valueEl.style.color = "var(--color-gold)";
        } else {
          valueEl.style.color = "var(--color-success)";
        }
      }

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      table.appendChild(row);
    }

    // Charter deadline row (only if ship has an active charter)
    if (charter) {
      const deadlineRow = document.createElement("div");
      deadlineRow.className = "port-ops-status-row";

      const deadlineInfo = createDeadlineStatusRow(charter, state.time.totalDaysElapsed);

      const deadlineLabelEl = document.createElement("span");
      deadlineLabelEl.className = "port-ops-status-label";
      deadlineLabelEl.textContent = deadlineInfo.label;

      const deadlineValueEl = document.createElement("span");
      deadlineValueEl.className = "port-ops-status-value data-display";
      deadlineValueEl.textContent = deadlineInfo.value;
      deadlineValueEl.style.color = deadlineInfo.color;
      if (deadlineInfo.urgency === "overdue") {
        deadlineValueEl.style.animation = "blink 0.8s infinite";
      }

      deadlineRow.appendChild(deadlineLabelEl);
      deadlineRow.appendChild(deadlineValueEl);
      table.appendChild(deadlineRow);
    }

    panel.appendChild(table);
    return panel;
  }

  // ─── Top-Right: Port View Panel ───────────────────────────────────────────

  private createPortViewPanel(port: Port): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "port-ops-quadrant port-ops-port-view panel panel-riveted";

    // Porthole frame with rivets at all 4 cardinal points
    const porthole = document.createElement("div");
    porthole.className = "port-ops-porthole";

    // Rivet wrapper for left/right rivets (top/bottom handled by ::before/::after)
    const rivets = document.createElement("div");
    rivets.className = "port-ops-porthole-rivets";
    porthole.appendChild(rivets);

    // Canvas-rendered skyline
    const skylineCanvas = createPortSkylineCanvas(port.id, 220, port.lng);
    porthole.appendChild(skylineCanvas);

    panel.appendChild(porthole);

    // Port name and country
    const nameEl = document.createElement("div");
    nameEl.className = "port-ops-port-name heading-display";
    nameEl.textContent = `${port.name}, ${port.country}`;
    panel.appendChild(nameEl);

    return panel;
  }

  // ─── Bottom-Left: Captain's Orders Menu ───────────────────────────────────

  private createCaptainOrdersPanel(
    state: FullGameState,
    player: PlayerState,
    ship: OwnedShip,
    port: Port,
  ): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "port-ops-quadrant port-ops-orders";

    const title = document.createElement("h3");
    title.className = "port-ops-panel-title heading-copper";
    title.textContent = "Captain\u2019s Orders";
    panel.appendChild(title);

    const menu = document.createElement("div");
    menu.className = "port-ops-menu";

    // REPAIR button
    const repairBtn = this.createOrderButton("REPAIR", "Repair ship hull", ship.conditionPercent >= 100);
    repairBtn.addEventListener("click", () => this.openRepairDialog(state, player, ship, port));
    menu.appendChild(repairBtn);

    // REFUEL button
    const spec = getShipSpec(ship);
    const tankFull = spec ? ship.fuelTons >= spec.bunkerCapacityTons : true;
    const refuelBtn = this.createOrderButton("REFUEL", "Fill fuel tanks", tankFull);
    refuelBtn.addEventListener("click", () => this.openRefuelDialog(state, player, ship));
    menu.appendChild(refuelBtn);

    // CHARTER button
    const hasCharter = !!player.activeCharters[ship.name];
    const charterBtn = this.createOrderButton("CHARTER", "Accept freight contract", hasCharter);
    charterBtn.addEventListener("click", () => this.openCharterDialog(state, player, ship));
    menu.appendChild(charterBtn);

    // LAY UP button
    const layUpBtn = this.createOrderButton(
      ship.isLaidUp ? "REACTIVATE" : "LAY UP",
      ship.isLaidUp ? "Reactivate ship" : "Put ship in storage",
      false,
    );
    layUpBtn.addEventListener("click", () => this.handleLayUp(state, ship));
    menu.appendChild(layUpBtn);

    // LOAD button
    const canLoad = hasCharter && !ship.cargoType;
    const loadBtn = this.createOrderButton("LOAD", "Load cargo", !canLoad);
    loadBtn.addEventListener("click", () => this.handleLoad(state));
    menu.appendChild(loadBtn);

    panel.appendChild(menu);
    return panel;
  }

  private createOrderButton(label: string, tooltip: string, disabled: boolean): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary port-ops-order-btn";
    btn.textContent = label;
    btn.title = tooltip;
    if (disabled) {
      btn.disabled = true;
    }
    return btn;
  }

  // ─── Bottom-Right: Port Info Panel ────────────────────────────────────────

  private createPortInfoPanel(port: Port): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "port-ops-quadrant port-ops-port-info";

    const title = document.createElement("h3");
    title.className = "port-ops-port-info-title";
    title.textContent = "Port Information";
    panel.appendChild(title);

    const info = document.createElement("div");
    info.className = "port-ops-port-info-data";

    const rows: [string, string][] = [
      ["Population:", port.population.toLocaleString()],
      ["Language(s):", port.languages.join(", ")],
      ["Ships:", port.shipCount.toLocaleString()],
      ["Cargo capacity:", `${port.cargoCapacityTdw.toLocaleString()} tdw`],
      ["Repair cost:", `$${port.repairCostPerPercent.toLocaleString()} per %`],
    ];

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "port-ops-info-row";

      const labelEl = document.createElement("span");
      labelEl.className = "port-ops-info-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "port-ops-info-value";
      valueEl.textContent = value;

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      info.appendChild(row);
    }

    // Available cargo types
    const cargoTitle = document.createElement("div");
    cargoTitle.className = "port-ops-info-label port-ops-cargo-title";
    cargoTitle.textContent = "Available Cargo:";
    info.appendChild(cargoTitle);

    const cargoList = document.createElement("div");
    cargoList.className = "port-ops-cargo-list";
    for (const cargo of port.availableCargoTypes) {
      const tag = document.createElement("span");
      tag.className = "port-ops-cargo-tag";
      tag.textContent = cargo;
      cargoList.appendChild(tag);
    }
    info.appendChild(cargoList);

    panel.appendChild(info);
    return panel;
  }

  // ─── Dialog Actions ───────────────────────────────────────────────────────

  private openRepairDialog(state: FullGameState, player: PlayerState, ship: OwnedShip, port: Port): void {
    const costMultiplier = getPortCostMultiplier(port.id, state.worldEvents);
    const dialog = createRepairDialog(ship, port, player, {
      onConfirm: (percentToRepair: number) => {
        const result = repairPlayerShip(state, this.activeShipIndex, percentToRepair);
        this.removeDialog();
        this.showMessage(result.message);
        this.refreshScreen();
      },
      onCancel: () => {
        this.removeDialog();
      },
    }, costMultiplier);
    this.container.appendChild(dialog);
  }

  private openRefuelDialog(state: FullGameState, player: PlayerState, ship: OwnedShip): void {
    const portId = ship.currentPortId ?? "";
    const costMultiplier = getPortCostMultiplier(portId, state.worldEvents);
    const dialog = createRefuelDialog(ship, player, {
      onConfirm: (tonsToAdd: number) => {
        const result = refuelPlayerShip(state, this.activeShipIndex, tonsToAdd);
        this.removeDialog();
        this.showMessage(result.message);
        this.refreshScreen();
      },
      onCancel: () => {
        this.removeDialog();
      },
    }, costMultiplier);
    this.container.appendChild(dialog);
  }

  private openCharterDialog(state: FullGameState, player: PlayerState, ship: OwnedShip): void {
    const contracts = getAvailableCharters(state, this.activeShipIndex);

    // Build ship context for profitability estimation
    const spec = getShipSpec(ship);
    let shipContext: CharterShipContext | undefined;
    if (spec && ship.currentPortId) {
      shipContext = { spec, currentPortId: ship.currentPortId };
    }

    const dialog = createCharterDialog(contracts, {
      onAccept: (contract: CharterContract) => {
        const result = acceptCharter(state, this.activeShipIndex, contract);
        this.removeDialog();
        this.showMessage(result.message);
        this.refreshScreen();
      },
      onCancel: () => {
        this.removeDialog();
      },
    }, state.worldEvents, shipContext);
    this.container.appendChild(dialog);
  }

  private handleLayUp(state: FullGameState, ship: OwnedShip): void {
    let result: { success: boolean; message: string };
    if (ship.isLaidUp) {
      result = reactivatePlayerShip(state, this.activeShipIndex);
    } else {
      result = layUpPlayerShip(state, this.activeShipIndex);
    }
    this.showMessage(result.message);
    this.refreshScreen();
  }

  private handleLoad(state: FullGameState): void {
    const result = loadShipCargo(state, this.activeShipIndex);
    this.showMessage(result.message);
    this.refreshScreen();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private removeDialog(): void {
    const overlay = this.container.querySelector(".ship-info-overlay");
    if (overlay) overlay.remove();
  }

  private showMessage(message: string): void {
    // Remove any existing message
    const existing = this.container.querySelector(".port-ops-message");
    if (existing) existing.remove();

    const msgEl = document.createElement("div");
    msgEl.className = "port-ops-message";
    msgEl.textContent = message;
    this.container.appendChild(msgEl);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      msgEl.classList.add("port-ops-message-fade");
      setTimeout(() => msgEl.remove(), 500);
    }, 3000);
  }

  private refreshScreen(): void {
    // Re-render the screen in place
    const parent = this.container.parentElement;
    this.container.innerHTML = "";
    this.show();
    if (parent && !parent.contains(this.container)) {
      parent.appendChild(this.container);
    }
  }
}
