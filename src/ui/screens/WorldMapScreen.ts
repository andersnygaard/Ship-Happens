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
import type { MapShipData } from "../components/WorldMapCanvas";
import { NewsTicker } from "../components/NewsTicker";
import { TurnIndicator } from "../components/TurnIndicator";
import { TurnTransition } from "../components/TurnTransition";
import type { Port } from "../../data/types";
import type { TravelScreen } from "./TravelScreen";
import type { PortOperationsScreen } from "./PortOperationsScreen";
import { calculateDistanceNm } from "../../game/CharterSystem";
import { getPortById } from "../../data/ports";
import { getShipSpecById } from "../../data/ships";
import { calculateTravelDays } from "../../game/TimeSystem";
import { AudioSystem } from "../../audio/AudioSystem";
import { toast } from "../components/Toast";
import { createShipSelector } from "../components/ShipSelector";
import { helpPanel } from "../components/HelpPanel";
import { tutorialSystem } from "../../game/TutorialSystem";
import { isPortBlocked, getPortCostMultiplier } from "../../game/WorldEvents";
import { createSpeedSelector, type SpeedSelectionInfo } from "../components/SpeedSelector";
import { calculateFuelConsumptionAtSpeed } from "../../game/ShipManager";
import { createDeadlineBadge } from "../components/CharterDeadlineIndicator";
import { calculateVoyageEstimate, getAdjustedFuelCost } from "../../game/VoyageEstimator";
import { getFuelCostPerTon } from "../../game/ShipManager";
import { createVoyageCostSummary } from "../components/VoyageProfitEstimate";

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
  private turnIndicator: TurnIndicator | null = null;
  private turnTransition: TurnTransition | null = null;
  /** Index of the active ship for travel. */
  public activeShipIndex: number = 0;
  /** Speed selector component state. */
  private speedSelectorContainer: HTMLElement | null = null;
  private speedSelection: SpeedSelectionInfo | null = null;
  private speedSelectorGetSelection: (() => SpeedSelectionInfo) | null = null;
  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen worldmap-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();

    // ── Initialize audio on first display (user already interacted) ──
    const audio = AudioSystem.getInstance();
    audio.init();
    audio.startOceanAmbiance();

    // ── Header bar ────────────────────────────────────────────────────
    const header = this.buildHeader(state);
    this.container.appendChild(header);

    // ── News ticker ─────────────────────────────────────────────────
    this.newsTicker = new NewsTicker();
    this.newsTicker.attach(this.container);

    // ── Ship selector (when player has multiple ships) ───────────────
    if (state) {
      const player = getActivePlayer(state);
      if (this.activeShipIndex >= player.ships.length) {
        this.activeShipIndex = 0;
      }
      const selector = createShipSelector(player.ships, this.activeShipIndex, {
        onSelect: (index) => {
          this.activeShipIndex = index;
          this.screenManager.showScreen("worldmap");
        },
      });
      if (selector) {
        this.container.appendChild(selector);
      }
    }

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
      // Collect ships from all players with their player index for color-coding
      const allShipData: MapShipData[] = [];
      for (let i = 0; i < state.players.length; i++) {
        for (const ship of state.players[i].ships) {
          allShipData.push({ ship, playerIndex: i });
        }
      }
      this.mapCanvas.setShips(allShipData);
      this.mapCanvas.setHomePort(player.homePortId);

      // Set world event indicators on the map
      if (state.worldEvents && state.worldEvents.length > 0) {
        const blockedIds: string[] = [];
        const affectedIds: string[] = [];
        const allPortIds = new Set<string>();
        for (const evt of state.worldEvents) {
          for (const pid of evt.affectedPortIds) {
            allPortIds.add(pid);
            if (evt.blocksPort) {
              blockedIds.push(pid);
            }
          }
        }
        // Affected = has cost multiplier > 1 but not blocked
        const blockedSet = new Set(blockedIds);
        for (const pid of allPortIds) {
          if (!blockedSet.has(pid) && getPortCostMultiplier(pid, state.worldEvents) > 1.0) {
            affectedIds.push(pid);
          }
        }
        this.mapCanvas.setBlockedPorts(blockedIds);
        this.mapCanvas.setAffectedPorts(affectedIds);
      }
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
      } else {
        // Show "Port Operations" button if the active ship is in port
        const activeShip = player.ships[this.activeShipIndex];
        if (activeShip && activeShip.currentPortId && !activeShip.isLaidUp) {
          const portOpsPort = getPortById(activeShip.currentPortId);
          if (portOpsPort) {
            const portOpsBanner = document.createElement("div");
            portOpsBanner.className = "worldmap-port-ops-banner";

            const infoText = document.createElement("span");
            infoText.textContent = `${activeShip.name} is docked at ${portOpsPort.name}.`;
            portOpsBanner.appendChild(infoText);

            // Show charter deadline badge if ship has an active charter
            const activeCharter = player.activeCharters[activeShip.name];
            if (activeCharter) {
              const deadlineBadge = createDeadlineBadge(activeCharter, state.time.totalDaysElapsed);
              deadlineBadge.style.marginLeft = "12px";
              portOpsBanner.appendChild(deadlineBadge);
            }

            const portOpsBtn = document.createElement("button");
            portOpsBtn.className = "btn btn-primary";
            portOpsBtn.textContent = "Port Operations";
            portOpsBtn.addEventListener("click", () => {
              this.goToPortOperations(this.activeShipIndex);
            });
            portOpsBanner.appendChild(portOpsBtn);

            this.container.appendChild(portOpsBanner);
          }
        }
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

    // ── Tutorial: show contextual hint for new players ───────────────
    if (state) {
      tutorialSystem.checkAutoComplete(state);
      tutorialSystem.showContextualHint(state);
    }

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
    if (this.turnTransition) {
      this.turnTransition.dismiss();
      this.turnTransition = null;
    }
    // Close help panel if open when leaving screen
    if (helpPanel.getIsOpen()) {
      helpPanel.close();
    }
    this.turnIndicator = null;
    this.startActionBtn = null;
    this.timeDisplay = null;
    this.selectedPortInfo = null;
    this.destinationLabel = null;
    this.selectedDestination = null;
    this.statusMessage = null;
    this.speedSelectorContainer = null;
    this.speedSelection = null;
    this.speedSelectorGetSelection = null;
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

    // Mute / volume toggle button
    header.appendChild(this.buildMuteButton());

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

    // Help button (? icon) at the bottom of the sidebar
    const helpBtn = this.createSidebarBtn("Help", "help", () => {
      helpPanel.toggle();
    });
    helpBtn.classList.add("help-btn");
    sidebar.appendChild(helpBtn);

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

    // Turn indicator (only visible with 2+ players)
    this.turnIndicator = new TurnIndicator();
    if (state) {
      const player = getActivePlayer(state);
      footer.appendChild(
        this.turnIndicator.render({
          playerCount: state.turns.playerCount,
          activeIndex: state.turns.activePlayerIndex,
          activePlayerName: player.name,
        }),
      );
    }

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

    // End Turn button (only visible with 2+ players)
    if (state && state.turns.playerCount >= 2) {
      const endTurnBtn = document.createElement("button");
      endTurnBtn.className = "btn btn-secondary end-turn-btn";
      endTurnBtn.textContent = "End Turn";
      endTurnBtn.addEventListener("click", () => this.handleEndTurn());
      footer.appendChild(endTurnBtn);
    }

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

    // Calculate and show distance from ship's current port, with speed selector
    const state = this.screenManager.getGameState();
    // Remove previous speed selector if any
    if (this.speedSelectorContainer && this.speedSelectorContainer.parentElement) {
      this.speedSelectorContainer.remove();
    }
    this.speedSelectorContainer = null;
    this.speedSelection = null;
    this.speedSelectorGetSelection = null;

    if (state) {
      const player = getActivePlayer(state);
      const activeShip = player.ships[this.activeShipIndex] ?? player.ships.find(
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
            // Show the speed selector component instead of static estimates
            const activeCharter = player.activeCharters[activeShip.name] ?? null;
            const { element, getSelection } = createSpeedSelector({
              spec,
              distanceNm,
              currentFuelTons: activeShip.fuelTons,
              activeCharter,
              totalDaysElapsed: state.time.totalDaysElapsed,
              onSpeedChange: (info) => {
                this.speedSelection = info;
              },
            });
            this.speedSelectorGetSelection = getSelection;
            this.speedSelection = getSelection();
            this.speedSelectorContainer = element;
            this.selectedPortInfo.appendChild(element);

            // Show estimated voyage cost summary
            const baseFuelCost = getFuelCostPerTon(activeShip.currentPortId!);
            const departureMult = state.worldEvents
              ? getPortCostMultiplier(activeShip.currentPortId!, state.worldEvents)
              : 1.0;
            const adjustedFuel = getAdjustedFuelCost(baseFuelCost, departureMult);
            const voyageEstimate = calculateVoyageEstimate(spec, distanceNm, adjustedFuel);
            const costSummary = createVoyageCostSummary(voyageEstimate);
            this.selectedPortInfo!.appendChild(costSummary);
          }
        }
      }
    }

    // World event warnings
    if (state && state.worldEvents) {
      if (isPortBlocked(port.id, state.worldEvents)) {
        const blockedBadge = document.createElement("span");
        blockedBadge.className = "port-info-detail";
        blockedBadge.style.color = "var(--color-danger, #ff4444)";
        blockedBadge.style.fontWeight = "bold";
        blockedBadge.textContent = "PORT BLOCKED — World Event";
        this.selectedPortInfo.appendChild(blockedBadge);
      } else {
        const multiplier = getPortCostMultiplier(port.id, state.worldEvents);
        if (multiplier > 1.0) {
          const costBadge = document.createElement("span");
          costBadge.className = "port-info-detail";
          costBadge.style.color = "var(--color-gold, #ffaa33)";
          costBadge.textContent = `Costs +${Math.round((multiplier - 1) * 100)}% (World Event)`;
          this.selectedPortInfo.appendChild(costBadge);
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

    // Use the active ship index (from ship selector)
    let shipIndex = this.activeShipIndex;
    if (shipIndex >= player.ships.length) {
      shipIndex = 0;
      this.activeShipIndex = 0;
    }

    const selectedShip = player.ships[shipIndex];
    if (!selectedShip) {
      this.showStatusMessage("No ships available.");
      return;
    }
    if (!selectedShip.currentPortId) {
      this.showStatusMessage(`${selectedShip.name} is at sea. Select a different ship.`);
      return;
    }
    if (selectedShip.isLaidUp) {
      this.showStatusMessage(`${selectedShip.name} is laid up. Reactivate it at the port first.`);
      return;
    }

    // Auto-select cargo destination if ship has loaded cargo and no destination was manually picked
    if (!this.selectedDestination && selectedShip.cargoDestinationPortId) {
      const cargoDestPort = getPortById(selectedShip.cargoDestinationPortId);
      if (cargoDestPort) {
        this.selectedDestination = cargoDestPort;
        this.showStatusMessage(`Heading to ${cargoDestPort.name} to deliver ${selectedShip.cargoType}.`);
      }
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

    // Check if destination is blocked by a world event
    if (state.worldEvents && isPortBlocked(this.selectedDestination.id, state.worldEvents)) {
      toast.show(`${this.selectedDestination.name} is blocked by a world event! Choose another destination.`, "error");
      return;
    }

    // Get selected speed from speed selector (default to max speed)
    const currentSelection = this.speedSelectorGetSelection
      ? this.speedSelectorGetSelection()
      : null;

    // Check fuel using selected speed
    const originPort = ship.currentPortId ? getPortById(ship.currentPortId) : null;
    const destPort = this.selectedDestination;
    if (originPort) {
      const distanceNm = calculateDistanceNm(originPort, destPort);
      const spec = getShipSpecById(ship.specId);
      if (spec) {
        const effectiveSpeed = currentSelection?.speedKnots ?? spec.maxSpeedKnots;
        const travelDays = calculateTravelDays(distanceNm, effectiveSpeed);
        const consumptionPerDay = calculateFuelConsumptionAtSpeed(spec, effectiveSpeed);
        const fuelNeeded = Math.ceil(consumptionPerDay * travelDays);
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
      travelScreen.cruisingSpeedKnots = currentSelection?.speedKnots ?? undefined;
    }
    this.screenManager.showScreen("travel");
  }

  private handleEndTurn(): void {
    const state = this.screenManager.getGameState();
    if (!state) return;

    const result = endTurn(state);

    // Get the new active player info
    const newPlayer = getActivePlayer(state);
    const playerNumber = state.turns.activePlayerIndex + 1;

    // Show turn transition overlay
    this.turnTransition = new TurnTransition();
    this.turnTransition.show({
      playerNumber,
      playerName: newPlayer.name,
      companyName: newPlayer.companyName,
      onDismiss: () => {
        // Refresh the world map for the new player
        this.screenManager.showScreen("worldmap");
      },
    });

    if (result.newRound) {
      toast.show(result.message, "info");
    }

    // Show toast for new world events
    if (result.newWorldEvents && result.newWorldEvents.length > 0) {
      for (const evt of result.newWorldEvents) {
        setTimeout(() => {
          toast.show(`WORLD EVENT: ${evt.headline}`, "error");
        }, 500);
      }
    }

    // Show toast for charter deadline warnings
    if (result.deadlineWarnings && result.deadlineWarnings.length > 0) {
      for (const warning of result.deadlineWarnings) {
        setTimeout(() => {
          const msg = warning.remainingDays <= 0
            ? `OVERDUE: ${warning.shipName} charter is past deadline!`
            : `WARNING: ${warning.shipName} charter deadline in ${warning.remainingDays} days!`;
          toast.show(msg, "warning");
        }, 1000);
      }
    }
  }

  /** Navigate to port operations screen for a given ship. */
  private goToPortOperations(shipIndex: number): void {
    const portOps = this.screenManager.getScreen("port-operations") as PortOperationsScreen | undefined;
    if (portOps) {
      portOps.activeShipIndex = shipIndex;
    }
    this.screenManager.showScreen("port-operations");
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

  private buildMuteButton(): HTMLElement {
    const audio = AudioSystem.getInstance();

    const btn = document.createElement("button");
    btn.className = "btn btn-secondary mute-btn";
    btn.title = audio.isMuted() ? "Unmute" : "Mute";

    const updateIcon = (muted: boolean): void => {
      btn.title = muted ? "Unmute" : "Mute";
      btn.innerHTML = muted
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>`;
    };

    updateIcon(audio.isMuted());

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const muted = audio.toggleMute();
      updateIcon(muted);
      // Restart ocean ambiance if unmuted
      if (!muted) {
        audio.startOceanAmbiance();
      }
    });

    return btn;
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
      case "help":
        icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
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
