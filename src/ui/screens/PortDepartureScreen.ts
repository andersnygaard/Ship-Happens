/**
 * PortDepartureScreen — Shows port arrival options.
 * Player chooses to "steer by hand" (free) or "use tug's help" (costs $50,000).
 * Both options currently proceed directly to Port Operations
 * (maneuvering minigame is a future task).
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer, getPlayerBalance } from "../../game/GameState";
import { getPortById } from "../../data/ports";
import { debit } from "../../game/FinancialSystem";
import { getTimeSnapshot } from "../../game/TimeSystem";
import { generatePortArrivalEvent } from "../../game/EventSystem";
import { toast } from "../components/Toast";
import type { PortOperationsScreen } from "./PortOperationsScreen";
import type { ManeuveringScreen } from "./ManeuveringScreen";

const TUG_COST = 50_000;

export class PortDepartureScreen implements GameScreen {
  private container: HTMLElement;

  /** Ship index that just arrived. Set externally before showing. */
  public shipIndex: number = 0;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen port-departure-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state.";
      return this.container;
    }

    const player = getActivePlayer(state);
    // Use the shipIndex set by the previous screen (travel or port-ops)
    const ship = player.ships[this.shipIndex] ?? player.ships.find((s) => s.currentPortId !== null);
    const port = ship?.currentPortId ? getPortById(ship.currentPortId) : null;
    const balance = getPlayerBalance(player);

    const panel = document.createElement("div");
    panel.className = "port-departure-panel panel panel-riveted";

    // Title with ship name and captain
    const title = document.createElement("h2");
    title.className = "port-departure-title heading-copper";
    title.textContent = ship ? `${ship.name}, captain ${ship.captainName}` : "Arriving at Port";
    panel.appendChild(title);

    // Port name
    if (port) {
      const portName = document.createElement("div");
      portName.className = "port-departure-port-name data-display";
      portName.textContent = `${port.name}, ${port.country}`;
      panel.appendChild(portName);
    }

    // Ship status summary
    if (ship) {
      const statusLine = document.createElement("div");
      statusLine.className = "port-departure-status data-display";
      statusLine.textContent = `Condition: ${ship.conditionPercent}% | Fuel: ${ship.fuelTons.toLocaleString()}t | Balance: $${(balance / 1_000_000).toFixed(1)}M`;
      panel.appendChild(statusLine);
    }

    // Description
    const desc = document.createElement("p");
    desc.className = "port-departure-description";
    desc.textContent =
      "Your ship is approaching the harbor. How would you like to dock?";
    panel.appendChild(desc);

    // Show port arrival event if one is generated
    const arrivalEvent = generatePortArrivalEvent();
    if (arrivalEvent) {
      const eventPanel = document.createElement("div");
      eventPanel.className = "port-departure-event";
      const eventTitle = document.createElement("strong");
      eventTitle.textContent = arrivalEvent.title + ": ";
      eventPanel.appendChild(eventTitle);
      const eventDesc = document.createElement("span");
      eventDesc.textContent = arrivalEvent.description;
      eventPanel.appendChild(eventDesc);
      panel.appendChild(eventPanel);
    }

    // Choice buttons
    const btnContainer = document.createElement("div");
    btnContainer.className = "port-departure-buttons";

    // Cast off (skip docking minigame, go straight to port ops)
    const castOffBtn = document.createElement("button");
    castOffBtn.className = "btn btn-primary port-departure-btn";
    castOffBtn.innerHTML = "<strong>Cast Off!</strong><br><span class='port-departure-cost'>Skip to port</span>";
    castOffBtn.addEventListener("click", () => {
      this.goToPortOperations();
    });
    btnContainer.appendChild(castOffBtn);

    // Steer by hand (free, play maneuvering minigame)
    const steerBtn = document.createElement("button");
    steerBtn.className = "btn btn-secondary port-departure-btn";
    steerBtn.innerHTML = "<strong>Steer by Hand</strong><br><span class='port-departure-cost'>Free — play minigame</span>";
    steerBtn.addEventListener("click", () => {
      this.goToManeuvering();
    });
    btnContainer.appendChild(steerBtn);

    // Use tug (costs money, skip minigame)
    const tugBtn = document.createElement("button");
    tugBtn.className = "btn btn-secondary port-departure-btn";
    const canAffordTug = balance >= TUG_COST;
    tugBtn.innerHTML = `<strong>Use Tug's Help</strong><br><span class='port-departure-cost'>$${TUG_COST.toLocaleString()}</span>`;
    tugBtn.disabled = !canAffordTug;
    if (!canAffordTug) {
      tugBtn.title = "Insufficient funds for tug assistance";
    }
    tugBtn.addEventListener("click", () => {
      if (!canAffordTug) {
        toast.show("Not enough money for tug assistance!", "error");
        return;
      }
      const time = getTimeSnapshot(state.time);
      debit(player.finances, TUG_COST, "Tug assistance at port", time);
      toast.show(`Tug hired for $${TUG_COST.toLocaleString()}`, "info");
      this.goToPortOperations();
    });
    btnContainer.appendChild(tugBtn);

    panel.appendChild(btnContainer);
    this.container.appendChild(panel);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  /** Navigate to port operations, passing along the ship index. */
  private goToPortOperations(): void {
    const portOps = this.screenManager.getScreen("port-operations") as PortOperationsScreen | undefined;
    if (portOps) {
      portOps.activeShipIndex = this.shipIndex;
    }
    this.screenManager.showScreen("port-operations");
  }

  /** Navigate to the maneuvering minigame, passing along the ship index. */
  private goToManeuvering(): void {
    const maneuvering = this.screenManager.getScreen("maneuvering") as ManeuveringScreen | undefined;
    if (maneuvering) {
      maneuvering.shipIndex = this.shipIndex;
    }
    this.screenManager.showScreen("maneuvering");
  }
}
