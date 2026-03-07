/**
 * TravelScreen — Shows voyage progress during travel between ports.
 * Displays ship name, origin, destination, distance, estimated time.
 * Shows random events as they occur with choice buttons via EventDialog.
 * After all events are resolved and travel completes, transitions to PortDepartureScreen.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import type { FullGameState } from "../../game/GameState";
import {
  getActivePlayer,
  simulateVoyage,
} from "../../game/GameState";
import { getPortById } from "../../data/ports";
import { getShipSpecById } from "../../data/ships";
import { calculateDistanceNm } from "../../game/CharterSystem";
import { calculateTravelDays } from "../../game/TimeSystem";
import {
  generateTravelEvents,
  resolveStormEvent,
  resolveEmergencyEvent,
  resolveOutOfFuelEvent,
  type TravelEvent,
} from "../../game/EventSystem";
import { EventDialog } from "../components/EventDialog";
import { debit } from "../../game/FinancialSystem";
import { getTimeSnapshot } from "../../game/TimeSystem";
import { TOWING_PENALTY } from "../../data/constants";

export class TravelScreen implements GameScreen {
  private container: HTMLElement;
  private eventDialog: EventDialog | null = null;

  /** Ship index to travel with. Set externally before showing. */
  public shipIndex: number = 0;
  /** Destination port ID. Set externally before showing. */
  public destinationPortId: string = "";

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen travel-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state.";
      return this.container;
    }

    const player = getActivePlayer(state);
    const ship = player.ships[this.shipIndex];
    if (!ship) {
      this.container.textContent = "Ship not found.";
      return this.container;
    }

    const originPort = ship.currentPortId ? getPortById(ship.currentPortId) : null;
    const destPort = getPortById(this.destinationPortId);
    if (!originPort || !destPort) {
      this.container.textContent = "Invalid ports.";
      return this.container;
    }

    const spec = getShipSpecById(ship.specId);
    if (!spec) {
      this.container.textContent = "Unknown ship spec.";
      return this.container;
    }

    const distanceNm = calculateDistanceNm(originPort, destPort);
    const travelDays = calculateTravelDays(distanceNm, spec.maxSpeedKnots);

    // Generate events before the voyage
    const events = generateTravelEvents(
      distanceNm,
      ship.fuelTons,
      spec.fuelConsumptionTonsPerDay,
      travelDays,
    );

    // Build the voyage info panel
    const panel = document.createElement("div");
    panel.className = "travel-panel panel panel-riveted";

    const title = document.createElement("h2");
    title.className = "travel-title heading-copper";
    title.textContent = "Voyage in Progress";
    panel.appendChild(title);

    // Ship info
    const infoGrid = document.createElement("div");
    infoGrid.className = "travel-info-grid";

    infoGrid.appendChild(this.createInfoRow("Ship", ship.name));
    infoGrid.appendChild(this.createInfoRow("From", originPort.name));
    infoGrid.appendChild(this.createInfoRow("To", destPort.name));
    infoGrid.appendChild(
      this.createInfoRow("Distance", `${distanceNm.toLocaleString()} nm`),
    );
    infoGrid.appendChild(
      this.createInfoRow("Est. Travel Time", `${travelDays} days`),
    );
    infoGrid.appendChild(
      this.createInfoRow("Fuel on Board", `${ship.fuelTons} tons`),
    );
    infoGrid.appendChild(
      this.createInfoRow("Ship Condition", `${ship.conditionPercent}%`),
    );

    panel.appendChild(infoGrid);

    // Progress bar placeholder
    const progressBar = document.createElement("div");
    progressBar.className = "travel-progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "travel-progress-fill";
    progressBar.appendChild(progressFill);
    panel.appendChild(progressBar);

    // Status message area
    const statusArea = document.createElement("div");
    statusArea.className = "travel-status";
    statusArea.textContent = "Sailing...";
    panel.appendChild(statusArea);

    this.container.appendChild(panel);

    // Process events sequentially, then complete voyage
    this.processEvents(events, 0, state, statusArea, progressFill, travelDays);

    return this.container;
  }

  hide(): void {
    if (this.eventDialog) {
      this.eventDialog.hide();
      this.eventDialog = null;
    }
    this.container.remove();
  }

  /**
   * Process travel events one at a time.
   * After all events, execute the voyage and transition.
   */
  private processEvents(
    events: TravelEvent[],
    index: number,
    state: FullGameState,
    statusArea: HTMLElement,
    progressFill: HTMLElement,
    travelDays: number,
  ): void {
    if (index >= events.length) {
      // All events processed — execute the actual voyage
      this.completeVoyage(state, statusArea, progressFill, travelDays);
      return;
    }

    const event = events[index];

    // Animate progress to the event point
    const progressPercent = ((index + 1) / (events.length + 1)) * 80;
    progressFill.style.width = `${progressPercent}%`;
    statusArea.textContent = `Event encountered: ${event.title}`;

    // Show event dialog
    this.eventDialog = new EventDialog({
      event,
      onChoice: (choiceId: string) => {
        if (this.eventDialog) {
          this.eventDialog.hide();
          this.eventDialog = null;
        }

        // Resolve the event
        const player = getActivePlayer(state);
        const ship = player.ships[this.shipIndex];

        if (event.type === "storm") {
          const result = resolveStormEvent(choiceId);
          if (result.damagePercent > 0 && ship) {
            ship.conditionPercent = Math.max(
              0,
              ship.conditionPercent - result.damagePercent,
            );
          }
          statusArea.textContent = result.message;
        } else if (event.type === "emergency") {
          const result = resolveEmergencyEvent();
          statusArea.textContent = result.message;
        } else if (event.type === "out-of-fuel") {
          const result = resolveOutOfFuelEvent();
          const time = getTimeSnapshot(state.time);
          debit(
            player.finances,
            TOWING_PENALTY,
            "Towing penalty — ship ran out of fuel",
            time,
          );
          statusArea.textContent = result.message;
        }

        // Small delay then process next event
        setTimeout(() => {
          this.processEvents(
            events,
            index + 1,
            state,
            statusArea,
            progressFill,
            travelDays,
          );
        }, 1500);
      },
    });

    // Show the dialog after a short delay for dramatic effect
    setTimeout(() => {
      if (this.eventDialog) {
        this.eventDialog.show(this.container);
      }
    }, 800);
  }

  /**
   * Complete the voyage: call simulateVoyage, update progress, then transition.
   */
  private completeVoyage(
    state: FullGameState,
    statusArea: HTMLElement,
    progressFill: HTMLElement,
    _travelDays: number,
  ): void {
    // Animate progress to 100%
    progressFill.style.width = "100%";

    const result = simulateVoyage(state, this.shipIndex, this.destinationPortId);
    statusArea.textContent = result.message;

    // After a delay, transition to port departure
    setTimeout(() => {
      this.screenManager.showScreen("port-departure");
    }, 2000);
  }

  private createInfoRow(label: string, value: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "travel-info-row";

    const labelEl = document.createElement("span");
    labelEl.className = "travel-info-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "travel-info-value data-display";
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }
}
