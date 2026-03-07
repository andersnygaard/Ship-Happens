/**
 * WorldMapScreen — Main game screen with world map, port markers,
 * sidebar navigation, status header, and time/action bar.
 *
 * Renders a 2D Mercator projection world map using HTML5 Canvas,
 * with all 30 ports plotted as interactive dots.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import {
  getActivePlayer,
  getPlayerSummary,
  getFormattedTime,
  startAction,
  stopAction,
  endTurn,
} from "../../game/GameState";
import type { FullGameState } from "../../game/GameState";
import { WorldMapCanvas } from "../components/WorldMapCanvas";
import { NewsTicker } from "../components/NewsTicker";
import type { Port } from "../../data/types";
import type { TravelScreen } from "./TravelScreen";
import { calculateDistanceNm } from "../../game/CharterSystem";
import { getPortById } from "../../data/ports";
import { getShipSpecById } from "../../data/ships";
import { calculateTravelDays } from "../../game/TimeSystem";

export class WorldMapScreen implements GameScreen {
  private container: HTMLElement;
  private mapCanvas: WorldMapCanvas | null = null;
  private startActionBtn: HTMLButtonElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private selectedPortInfo: HTMLElement | null = null;
  private selectedDestination: Port | null = null;
  private destinationLabel: HTMLElement | null = null;
  private statusMessage: HTMLElement | null = null;
  private newsTicker: NewsTicker | null = null;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen worldmap-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();

    // ── Header bar ────────────────────────────────────────────────────
    const header = this.buildHeader(state);
    this.container.appendChild(header);

    // ── News ticker ─────────────────────────────────────────────────
    this.newsTicker = new NewsTicker();
    this.newsTicker.attach(this.container);

    // ── Main content area (map + sidebar) ─────────────────────────────
    const mainArea = document.createElement("div");
    mainArea.className = "worldmap-main";

    // Map container
    const mapContainer = document.createElement("div");
    mapContainer.className = "worldmap-map-container";

    // Create the canvas-based map
    this.mapCanvas = new WorldMapCanvas({
      onPortHover: (port) => this.handlePortHover(port),
      onPortClick: (port) => this.handlePortClick(port),
    });
    this.mapCanvas.attach(mapContainer);

    // Set ship data if game state exists
    if (state) {
      const player = getActivePlayer(state);
      this.mapCanvas.setShips(player.ships);
      this.mapCanvas.setHomePort(player.homePortId);
    }

    mainArea.appendChild(mapContainer);

    // Sidebar
    const sidebar = this.buildSidebar();
    mainArea.appendChild(sidebar);

    this.container.appendChild(mainArea);

    // ── No ships prompt ───────────────────────────────────────────────
    if (state) {
      const player = getActivePlayer(state);
      if (player.ships.length === 0) {
        const noShipsBanner = document.createElement("div");
        noShipsBanner.className = "worldmap-no-ships-banner";
        noShipsBanner.innerHTML = "";

        const msg = document.createElement("span");
        msg.textContent = "You have no ships! Visit the Ship Broker to purchase your first vessel.";
        noShipsBanner.appendChild(msg);

        const brokerBtn = document.createElement("button");
        brokerBtn.className = "btn btn-primary";
        brokerBtn.textContent = "Visit Ship Broker";
        brokerBtn.addEventListener("click", () => {
          this.screenManager.showScreen("shipbroker");
        });
        noShipsBanner.appendChild(brokerBtn);

        this.container.appendChild(noShipsBanner);
      }
    }

    // ── Status message area ───────────────────────────────────────────
    this.statusMessage = document.createElement("div");
    this.statusMessage.className = "worldmap-status-message hidden";
    this.container.appendChild(this.statusMessage);

    // ── Selected port info panel ──────────────────────────────────────
    this.selectedPortInfo = document.createElement("div");
    this.selectedPortInfo.className = "worldmap-port-info hidden";
    this.container.appendChild(this.selectedPortInfo);

    // ── Footer bar ────────────────────────────────────────────────────
    const footer = this.buildFooter(state);
    this.container.appendChild(footer);

    return this.container;
  }

  hide(): void {
    if (this.mapCanvas) {
      this.mapCanvas.destroy();
      this.mapCanvas = null;
    }
    if (this.newsTicker) {
      this.newsTicker.destroy();
      this.newsTicker = null;
    }
    this.startActionBtn = null;
    this.timeDisplay = null;
    this.selectedPortInfo = null;
    this.destinationLabel = null;
    this.selectedDestination = null;
    this.statusMessage = null;
    this.container.remove();
  }

  // ── Header ──────────────────────────────────────────────────────────

  private buildHeader(state: FullGameState | null): HTMLElement {
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
      info.appendChild(
        this.createInfoItem("Capital", `$${summary.balanceMillions}M`),
      );
      info.appendChild(
        this.createInfoItem("Ships", String(summary.shipCount)),
      );

      header.appendChild(info);
    }

    return header;
  }

  // ── Sidebar ─────────────────────────────────────────────────────────

  private buildSidebar(): HTMLElement {
    const sidebar = document.createElement("div");
    sidebar.className = "worldmap-sidebar";

    sidebar.appendChild(
      this.createSidebarBtn("Globe", "globe", () => {
        // Already on world map -- no-op
      }),
    );
    sidebar.appendChild(
      this.createSidebarBtn("Office", "office", () => {
        this.screenManager.showScreen("office");
      }),
    );
    sidebar.appendChild(
      this.createSidebarBtn("Broker", "broker", () => {
        this.screenManager.showScreen("shipbroker");
      }),
    );

    return sidebar;
  }

  // ── Footer ──────────────────────────────────────────────────────────

  private buildFooter(state: FullGameState | null): HTMLElement {
    const footer = document.createElement("div");
    footer.className = "worldmap-footer";

    // Time display
    this.timeDisplay = document.createElement("div");
    this.timeDisplay.className = "time-display";

    if (state) {
      const timeStr = getFormattedTime(state);
      const parts = timeStr.split(", ");
      if (parts.length === 2) {
        this.timeDisplay.appendChild(
          this.createTimeItem("Weeks", parts[0].replace(" WEEKS", "")),
        );
        this.timeDisplay.appendChild(
          this.createTimeItem("Years", parts[1].replace(" YRS", "")),
        );
      } else {
        this.timeDisplay.appendChild(this.createTimeItem("Time", timeStr));
      }
    }

    footer.appendChild(this.timeDisplay);

    // Destination label
    this.destinationLabel = document.createElement("div");
    this.destinationLabel.className = "destination-label hidden";
    this.destinationLabel.textContent = "";
    footer.appendChild(this.destinationLabel);

    // START ACTION / STOP ACTION button
    this.startActionBtn = document.createElement("button");
    const isRunning = state?.turns.isSimulationRunning ?? false;
    this.updateActionButton(isRunning);
    this.startActionBtn.addEventListener("click", () =>
      this.handleActionClick(),
    );
    footer.appendChild(this.startActionBtn);

    return footer;
  }

  // ── Event Handlers ──────────────────────────────────────────────────

  private handlePortHover(port: Port | null): void {
    // Hover feedback is handled by the canvas tooltip
    // Could add additional UI here in the future
    void port;
  }

  private handlePortClick(port: Port): void {
    if (!this.selectedPortInfo) return;

    // Set as destination for travel
    this.selectedDestination = port;

    // Update the selected port on the map canvas
    if (this.mapCanvas) {
      this.mapCanvas.setSelectedPort(port.id);
    }

    this.selectedPortInfo.className = "worldmap-port-info";
    this.selectedPortInfo.innerHTML = "";

    const name = document.createElement("span");
    name.className = "port-info-name";
    name.textContent = port.name;

    const country = document.createElement("span");
    country.className = "port-info-country";
    country.textContent = port.country;

    const ships = document.createElement("span");
    ships.className = "port-info-detail";
    ships.textContent = `${port.shipCount.toLocaleString()} ships`;

    const cargo = document.createElement("span");
    cargo.className = "port-info-detail";
    cargo.textContent = `${(port.cargoCapacityTdw / 1_000_000).toFixed(1)}M tdw`;

    // Calculate and show distance from ship's current port
    const state = this.screenManager.getGameState();
    if (state) {
      const player = getActivePlayer(state);
      const activeShip = player.ships.find(
        (s) => s.currentPortId !== null && !s.isLaidUp,
      );
      if (activeShip && activeShip.currentPortId) {
        const originPort = getPortById(activeShip.currentPortId);
        if (originPort && originPort.id !== port.id) {
          const distanceNm = calculateDistanceNm(originPort, port);
          const spec = getShipSpecById(activeShip.specId);

          const distEl = document.createElement("span");
          distEl.className = "port-info-detail";
          distEl.textContent = `Distance: ${distanceNm.toLocaleString()} nm`;
          this.selectedPortInfo.appendChild(distEl);

          if (spec) {
            const travelDays = calculateTravelDays(distanceNm, spec.maxSpeedKnots);
            const fuelNeeded = spec.fuelConsumptionTonsPerDay * travelDays;

            const timeEl = document.createElement("span");
            timeEl.className = "port-info-detail";
            timeEl.textContent = `Travel time: ~${travelDays} days`;
            this.selectedPortInfo.appendChild(timeEl);

            const fuelEl = document.createElement("span");
            fuelEl.className = "port-info-detail";
            fuelEl.style.color = activeShip.fuelTons < fuelNeeded ? "var(--color-danger, #ff4444)" : "var(--color-success, #44ff44)";
            fuelEl.textContent = `Fuel needed: ~${Math.ceil(fuelNeeded)}t (have ${activeShip.fuelTons}t)`;
            this.selectedPortInfo.appendChild(fuelEl);
          }
        }
      }
    }

    const destBadge = document.createElement("span");
    destBadge.className = "port-info-destination";
    destBadge.textContent = "DESTINATION";

    this.selectedPortInfo.appendChild(name);
    this.selectedPortInfo.appendChild(country);
    this.selectedPortInfo.appendChild(ships);
    this.selectedPortInfo.appendChild(cargo);
    this.selectedPortInfo.appendChild(destBadge);

    // Update destination label in footer
    if (this.destinationLabel) {
      this.destinationLabel.textContent = `Destination: ${port.name}`;
      this.destinationLabel.classList.remove("hidden");
    }
  }

  private handleActionClick(): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    if (state.turns.isSimulationRunning) {
      // Stop simulation
      stopAction(state);
      this.updateActionButton(false);
      return;
    }

    // Check if player has any ships
    const player = getActivePlayer(state);
    if (player.ships.length === 0) {
      this.showStatusMessage("You have no ships! Visit the Ship Broker first.");
      return;
    }

    // Check if we can start travel
    const shipIndex = player.ships.findIndex(
      (s) => s.currentPortId !== null && !s.isLaidUp,
    );

    if (shipIndex === -1) {
      this.showStatusMessage("No ships available in port.");
      return;
    }

    if (!this.selectedDestination) {
      this.showStatusMessage("Select a destination port on the map first.");
      return;
    }

    const ship = player.ships[shipIndex];
    // Don't travel to the port the ship is already at
    if (ship.currentPortId === this.selectedDestination.id) {
      this.showStatusMessage("Ship is already at this port. Select a different destination.");
      return;
    }

    // Check fuel
    const originPort = ship.currentPortId ? getPortById(ship.currentPortId) : null;
    const destPort = this.selectedDestination;
    if (originPort) {
      const distanceNm = calculateDistanceNm(originPort, destPort);
      const spec = getShipSpecById(ship.specId);
      if (spec) {
        const travelDays = calculateTravelDays(distanceNm, spec.maxSpeedKnots);
        const fuelNeeded = spec.fuelConsumptionTonsPerDay * travelDays;
        if (ship.fuelTons < fuelNeeded * 0.5) {
          this.showStatusMessage(
            `Warning: Very low fuel! Need ~${Math.ceil(fuelNeeded)}t, have ${ship.fuelTons}t. Refuel before departing.`,
          );
          // Allow travel anyway (game allows running out of fuel with penalty)
        }
      }
    }

    // Start travel to selected destination
    startAction(state);
    const travelScreen = this.screenManager.getScreen("travel") as TravelScreen | undefined;
    if (travelScreen) {
      travelScreen.shipIndex = shipIndex;
      travelScreen.destinationPortId = this.selectedDestination.id;
    }
    this.screenManager.showScreen("travel");
  }

  private showStatusMessage(message: string): void {
    if (!this.statusMessage) return;
    this.statusMessage.textContent = message;
    this.statusMessage.classList.remove("hidden");
    setTimeout(() => {
      if (this.statusMessage) {
        this.statusMessage.classList.add("hidden");
      }
    }, 4000);
  }

  private updateActionButton(isRunning: boolean): void {
    if (!this.startActionBtn) return;

    if (isRunning) {
      this.startActionBtn.className = "btn btn-danger action-btn";
      this.startActionBtn.textContent = "Stop Action";
    } else {
      this.startActionBtn.className = "btn btn-primary action-btn";
      this.startActionBtn.textContent = "Start Action";
    }
  }

  private refreshTimeDisplay(state: FullGameState): void {
    if (!this.timeDisplay) return;

    this.timeDisplay.innerHTML = "";
    const timeStr = getFormattedTime(state);
    const parts = timeStr.split(", ");
    if (parts.length === 2) {
      this.timeDisplay.appendChild(
        this.createTimeItem("Weeks", parts[0].replace(" WEEKS", "")),
      );
      this.timeDisplay.appendChild(
        this.createTimeItem("Years", parts[1].replace(" YRS", "")),
      );
    } else {
      this.timeDisplay.appendChild(this.createTimeItem("Time", timeStr));
    }
  }

  private refreshHeader(state: FullGameState): void {
    const headerEl = this.container.querySelector(".worldmap-header");
    if (!headerEl) return;

    const infoEl = headerEl.querySelector(".worldmap-info");
    if (!infoEl) return;

    const player = getActivePlayer(state);
    const summary = getPlayerSummary(player);

    infoEl.innerHTML = "";
    infoEl.appendChild(this.createInfoItem("Company", summary.companyName));
    infoEl.appendChild(this.createInfoItem("Captain", summary.name));
    infoEl.appendChild(
      this.createInfoItem("Capital", `$${summary.balanceMillions}M`),
    );
    infoEl.appendChild(
      this.createInfoItem("Ships", String(summary.shipCount)),
    );
  }

  // ── DOM Helpers ─────────────────────────────────────────────────────

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
    item.className = "time-item";

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

  private createSidebarBtn(
    label: string,
    iconType: string,
    onClick: () => void,
  ): HTMLElement {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary sidebar-btn";

    const icon = document.createElement("span");
    icon.className = `sidebar-icon sidebar-icon-${iconType}`;

    // SVG icons for each button type
    switch (iconType) {
      case "globe":
        icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`;
        break;
      case "office":
        icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="2" width="16" height="20" rx="1"/>
          <path d="M9 22v-4h6v4"/>
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
        </svg>`;
        break;
      case "broker":
        icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 20l4-2 4 2 4-2 4 2 4-2"/>
          <path d="M4 18V8l8-4 8 4v10"/>
          <path d="M12 4v6"/>
          <rect x="8" y="14" width="8" height="4"/>
        </svg>`;
        break;
    }

    const text = document.createElement("span");
    text.className = "sidebar-label";
    text.textContent = label;

    btn.appendChild(icon);
    btn.appendChild(text);
    btn.addEventListener("click", onClick);

    return btn;
  }
}
