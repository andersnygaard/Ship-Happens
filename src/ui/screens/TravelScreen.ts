/**
 * TravelScreen — Shows voyage progress during travel between ports.
 *
 * Makes the Three.js ocean visible behind a semi-transparent overlay,
 * displays a HUD with ship name, origin/destination, progress bar, and day counter.
 * Shows random events as they occur with choice buttons via EventDialog.
 * After all events are resolved and travel completes, transitions to PortDepartureScreen.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import type { FullGameState } from "../../game/GameState";
import {
  getActivePlayer,
  simulateVoyage,
  stopAction,
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
  resolveBreakdownEvent,
  type TravelEvent,
} from "../../game/EventSystem";
import { EventDialog } from "../components/EventDialog";
import { debit } from "../../game/FinancialSystem";
import { getTimeSnapshot } from "../../game/TimeSystem";
import { TOWING_PENALTY } from "../../data/constants";
import type { PortDepartureScreen } from "./PortDepartureScreen";
import { getTravelSceneController } from "../../main";
import { calculateFuelConsumptionAtSpeed } from "../../game/ShipManager";

export class TravelScreen implements GameScreen {
  private container: HTMLElement;
  private eventDialog: EventDialog | null = null;

  /** Ship index to travel with. Set externally before showing. */
  public shipIndex: number = 0;
  /** Destination port ID. Set externally before showing. */
  public destinationPortId: string = "";
  /** Cruising speed in knots. If undefined, uses max speed. */
  public cruisingSpeedKnots: number | undefined = undefined;

  /** HUD element references for updates */
  private hudProgressFill: HTMLElement | null = null;
  private hudProgressText: HTMLElement | null = null;
  private hudDayCounter: HTMLElement | null = null;
  private hudWeatherIndicator: HTMLElement | null = null;

  /** Animation timer for day counter */
  private dayAnimationTimer: ReturnType<typeof setInterval> | null = null;

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
    const effectiveSpeed = this.cruisingSpeedKnots ?? spec.maxSpeedKnots;
    const travelDays = calculateTravelDays(distanceNm, effectiveSpeed);
    const effectiveFuelPerDay = calculateFuelConsumptionAtSpeed(spec, effectiveSpeed);

    // Generate events before the voyage
    const events = generateTravelEvents(
      distanceNm,
      ship.fuelTons,
      effectiveFuelPerDay,
      travelDays,
      ship.conditionPercent,
    );

    // --- Start the 3D scene travel animation ---
    const sceneController = getTravelSceneController();
    sceneController.startVoyage({
      shipName: ship.name,
      originName: originPort.name,
      destinationName: destPort.name,
      distanceNm,
      travelDays,
    });

    // --- Build the HUD overlay ---
    const hud = document.createElement("div");
    hud.className = "travel-hud";

    // Top bar: ship name, route
    const topBar = document.createElement("div");
    topBar.className = "travel-hud-top";

    const shipNameEl = document.createElement("div");
    shipNameEl.className = "travel-hud-ship-name";
    shipNameEl.textContent = ship.name;
    topBar.appendChild(shipNameEl);

    const routeEl = document.createElement("div");
    routeEl.className = "travel-hud-route";
    routeEl.textContent = `${originPort.name}  \u2192  ${destPort.name}`;
    topBar.appendChild(routeEl);

    hud.appendChild(topBar);

    // Info strip: distance, fuel, condition
    const infoStrip = document.createElement("div");
    infoStrip.className = "travel-hud-info-strip";

    infoStrip.appendChild(this.createHudStat("Distance", `${distanceNm.toLocaleString()} nm`));
    infoStrip.appendChild(this.createHudStat("Speed", `${Math.round(effectiveSpeed)} kn${effectiveSpeed < spec.maxSpeedKnots ? ` (${Math.round(effectiveSpeed / spec.maxSpeedKnots * 100)}%)` : ""}`));
    infoStrip.appendChild(this.createHudStat("Est. Time", `${travelDays} days`));
    infoStrip.appendChild(this.createHudStat("Fuel", `${ship.fuelTons} t`));
    infoStrip.appendChild(this.createHudStat("Condition", `${ship.conditionPercent}%`));

    hud.appendChild(infoStrip);

    // Progress section
    const progressSection = document.createElement("div");
    progressSection.className = "travel-hud-progress-section";

    // Day counter
    const dayCounter = document.createElement("div");
    dayCounter.className = "travel-hud-day-counter";
    dayCounter.textContent = "Day 0";
    this.hudDayCounter = dayCounter;
    progressSection.appendChild(dayCounter);

    // Progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "travel-hud-progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "travel-hud-progress-fill";
    progressBar.appendChild(progressFill);
    this.hudProgressFill = progressFill;
    progressSection.appendChild(progressBar);

    // Progress percentage text
    const progressText = document.createElement("div");
    progressText.className = "travel-hud-progress-text";
    progressText.textContent = "0%";
    this.hudProgressText = progressText;
    progressSection.appendChild(progressText);

    hud.appendChild(progressSection);

    // Weather indicator
    const weatherIndicator = document.createElement("div");
    weatherIndicator.className = "travel-hud-weather";
    weatherIndicator.textContent = "Clear seas";
    this.hudWeatherIndicator = weatherIndicator;
    hud.appendChild(weatherIndicator);

    // Status message area (for event messages)
    const statusArea = document.createElement("div");
    statusArea.className = "travel-hud-status";
    statusArea.textContent = "Sailing...";
    hud.appendChild(statusArea);

    this.container.appendChild(hud);

    // Start day counter animation
    this.startDayAnimation(travelDays, events.length);

    // Process events sequentially, then complete voyage
    this.processEvents(events, 0, state, statusArea, travelDays, sceneController);

    return this.container;
  }

  hide(): void {
    if (this.eventDialog) {
      this.eventDialog.hide();
      this.eventDialog = null;
    }

    // Stop the day animation timer
    if (this.dayAnimationTimer !== null) {
      clearInterval(this.dayAnimationTimer);
      this.dayAnimationTimer = null;
    }

    // Stop the 3D scene animation
    const sceneController = getTravelSceneController();
    sceneController.stopVoyage();

    this.container.remove();
  }

  /**
   * Animate the day counter incrementing over time.
   * The counter runs independently and visually ticks up days.
   */
  private startDayAnimation(travelDays: number, eventCount: number): void {
    // Total animation time: events take ~(eventCount * 2.3s), then 2s for completion
    // We want days to tick up proportionally to progress
    const totalAnimTime = (eventCount * 2.3 + 2) * 1000; // ms
    const tickInterval = Math.max(200, totalAnimTime / travelDays);
    let currentDay = 0;

    this.dayAnimationTimer = setInterval(() => {
      if (currentDay >= travelDays) {
        if (this.dayAnimationTimer !== null) {
          clearInterval(this.dayAnimationTimer);
          this.dayAnimationTimer = null;
        }
        return;
      }

      currentDay++;
      if (this.hudDayCounter) {
        this.hudDayCounter.textContent = `Day ${currentDay}`;
      }

      // Update scene controller day
      const sceneController = getTravelSceneController();
      sceneController.setProgress(currentDay / travelDays);
    }, tickInterval);
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
    travelDays: number,
    sceneController: ReturnType<typeof getTravelSceneController>,
  ): void {
    if (index >= events.length) {
      // All events processed — execute the actual voyage
      this.completeVoyage(state, statusArea, travelDays);
      return;
    }

    const event = events[index];

    // Animate progress to the event point
    const progressPercent = ((index + 1) / (events.length + 1)) * 80;
    this.updateProgress(progressPercent);
    statusArea.textContent = `Event encountered: ${event.title}`;

    // If this is a storm event, trigger storm visuals
    if (event.type === "storm") {
      sceneController.setStorm(true);
      if (this.hudWeatherIndicator) {
        this.hudWeatherIndicator.textContent = "STORM";
        this.hudWeatherIndicator.classList.add("travel-hud-weather--storm");
      }
    }

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

          // Clear storm after resolution
          sceneController.setStorm(false);
          if (this.hudWeatherIndicator) {
            this.hudWeatherIndicator.textContent = "Clear seas";
            this.hudWeatherIndicator.classList.remove("travel-hud-weather--storm");
          }
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
        } else if (event.type === "breakdown") {
          const result = resolveBreakdownEvent(choiceId);
          const time = getTimeSnapshot(state.time);
          // Apply financial cost
          if (result.costDollars > 0) {
            debit(
              player.finances,
              result.costDollars,
              `Breakdown repair: ${result.subtype}`,
              time,
            );
          }
          // Apply additional condition damage
          if (result.conditionDamage > 0 && ship) {
            ship.conditionPercent = Math.max(
              0,
              ship.conditionPercent - result.conditionDamage,
            );
          }
          statusArea.textContent = result.message;
        }

        // Small delay then process next event
        setTimeout(() => {
          this.processEvents(
            events,
            index + 1,
            state,
            statusArea,
            travelDays,
            sceneController,
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
    _travelDays: number,
  ): void {
    // Animate progress to 100%
    this.updateProgress(100);

    const result = simulateVoyage(state, this.shipIndex, this.destinationPortId, this.cruisingSpeedKnots);
    statusArea.textContent = result.message;

    // Stop the simulation now that the voyage is complete
    stopAction(state);

    // After a delay, transition to port departure
    setTimeout(() => {
      const portDeparture = this.screenManager.getScreen("port-departure") as PortDepartureScreen | undefined;
      if (portDeparture) {
        portDeparture.shipIndex = this.shipIndex;
      }
      this.screenManager.showScreen("port-departure");
    }, 2000);
  }

  /** Update the HUD progress bar and text. */
  private updateProgress(percent: number): void {
    if (this.hudProgressFill) {
      this.hudProgressFill.style.width = `${percent}%`;
    }
    if (this.hudProgressText) {
      this.hudProgressText.textContent = `${Math.round(percent)}%`;
    }
  }

  /** Create a small stat element for the info strip. */
  private createHudStat(label: string, value: string): HTMLElement {
    const stat = document.createElement("div");
    stat.className = "travel-hud-stat";

    const labelEl = document.createElement("span");
    labelEl.className = "travel-hud-stat-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "travel-hud-stat-value";
    valueEl.textContent = value;

    stat.appendChild(labelEl);
    stat.appendChild(valueEl);
    return stat;
  }
}
