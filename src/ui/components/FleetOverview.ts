/**
 * FleetOverview component — Displays a table/card list of all owned ships
 * with name, type, condition, fuel, current port, cargo status, and daily costs.
 */

import type { OwnedShip, CharterContract } from "../../data/types";
import { getShipSpecById } from "../../data/ships";
import { getPortById } from "../../data/ports";
import { getDailyOperatingCost } from "../../game/ShipManager";
import { getCharterDeadlineInfo } from "./CharterDeadlineIndicator";

export interface FleetOverviewData {
  ships: OwnedShip[];
  /** Active charters keyed by ship name, with deadline data. */
  activeCharters?: Record<string, CharterContract & { acceptedDay: number }>;
  /** Current total days elapsed, needed for deadline calculation. */
  totalDaysElapsed?: number;
}

/**
 * Render the fleet overview panel showing all owned ships.
 */
export function renderFleetOverview(data: FleetOverviewData): HTMLElement {
  const container = document.createElement("div");
  container.className = "office-fleet-overview";

  const title = document.createElement("h3");
  title.className = "heading-copper office-panel-title";
  title.textContent = "Fleet Overview";
  container.appendChild(title);

  if (data.ships.length === 0) {
    const empty = document.createElement("p");
    empty.className = "office-empty-msg";
    empty.textContent = "No ships in your fleet. Visit the Ship Broker to purchase your first vessel.";
    container.appendChild(empty);
    return container;
  }

  const table = document.createElement("table");
  table.className = "office-fleet-table";

  // Header row
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headers = ["Ship", "Type", "Condition", "Fuel", "Port", "Cargo", "Deadline", "Daily Cost", "Mortgage"];
  for (const h of headers) {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Data rows
  const tbody = document.createElement("tbody");
  for (const ship of data.ships) {
    const row = document.createElement("tr");
    if (ship.isLaidUp) {
      row.classList.add("office-ship-laid-up");
    }

    const spec = getShipSpecById(ship.specId);
    const port = ship.currentPortId ? getPortById(ship.currentPortId) : null;
    const dailyCost = getDailyOperatingCost(ship);
    const fuelPercent = spec ? Math.round((ship.fuelTons / spec.bunkerCapacityTons) * 100) : 0;

    // Ship name
    const tdName = document.createElement("td");
    tdName.className = "office-fleet-ship-name";
    tdName.textContent = ship.name;
    if (ship.isLaidUp) {
      const badge = document.createElement("span");
      badge.className = "office-laid-up-badge";
      badge.textContent = "LAID UP";
      tdName.appendChild(badge);
    }
    row.appendChild(tdName);

    // Type
    const tdType = document.createElement("td");
    tdType.textContent = spec ? spec.type : "Unknown";
    row.appendChild(tdType);

    // Condition
    const tdCond = document.createElement("td");
    tdCond.className = "data-display";
    const condClass = ship.conditionPercent >= 70 ? "good" : ship.conditionPercent >= 40 ? "warn" : "danger";
    tdCond.innerHTML = `<span class="office-condition-${condClass}">${ship.conditionPercent}%</span>`;
    row.appendChild(tdCond);

    // Fuel
    const tdFuel = document.createElement("td");
    tdFuel.className = "data-display";
    tdFuel.textContent = `${ship.fuelTons}t (${fuelPercent}%)`;
    row.appendChild(tdFuel);

    // Port
    const tdPort = document.createElement("td");
    tdPort.textContent = port ? port.name : "At Sea";
    row.appendChild(tdPort);

    // Cargo
    const tdCargo = document.createElement("td");
    if (ship.cargoType) {
      const destPort = ship.cargoDestinationPortId ? getPortById(ship.cargoDestinationPortId) : null;
      tdCargo.textContent = `${ship.cargoType}`;
      if (destPort) {
        const dest = document.createElement("span");
        dest.className = "office-cargo-dest";
        dest.textContent = ` \u2192 ${destPort.name}`;
        tdCargo.appendChild(dest);
      }
    } else {
      tdCargo.textContent = "Empty";
      tdCargo.classList.add("office-text-muted");
    }
    row.appendChild(tdCargo);

    // Deadline
    const tdDeadline = document.createElement("td");
    tdDeadline.className = "data-display";
    const charter = data.activeCharters?.[ship.name];
    if (charter && data.totalDaysElapsed !== undefined) {
      const deadlineInfo = getCharterDeadlineInfo(charter, data.totalDaysElapsed);
      if (deadlineInfo.urgency === "overdue") {
        tdDeadline.textContent = `OVERDUE ${Math.abs(deadlineInfo.remainingDays)}d`;
      } else {
        tdDeadline.textContent = `${deadlineInfo.remainingDays}d`;
      }
      // Color code based on urgency
      switch (deadlineInfo.urgency) {
        case "safe":
          tdDeadline.style.color = "var(--color-success, #44ff44)";
          break;
        case "warning":
          tdDeadline.style.color = "var(--color-gold, #ffaa33)";
          break;
        case "danger":
        case "overdue":
          tdDeadline.style.color = "var(--color-danger, #ff4444)";
          break;
      }
      if (deadlineInfo.urgency === "overdue") {
        tdDeadline.style.animation = "blink 0.8s infinite";
      }
    } else {
      tdDeadline.textContent = "---";
      tdDeadline.classList.add("office-text-muted");
    }
    row.appendChild(tdDeadline);

    // Daily cost
    const tdCost = document.createElement("td");
    tdCost.className = "data-display";
    tdCost.textContent = `$${dailyCost.toLocaleString()}`;
    row.appendChild(tdCost);

    // Mortgage badge indicator
    const tdMortgage = document.createElement("td");
    tdMortgage.className = "data-display";
    if (ship.mortgageRemaining > 0) {
      const badge = document.createElement("span");
      badge.className = "fleet-mortgage-badge";
      badge.textContent = `$ ${(ship.mortgageRemaining / 1_000_000).toFixed(2)}M`;
      badge.title = `Weekly payment: $${ship.mortgagePayment.toLocaleString()} | Remaining: $${ship.mortgageRemaining.toLocaleString()}`;
      tdMortgage.appendChild(badge);
    } else {
      const paidBadge = document.createElement("span");
      paidBadge.className = "fleet-mortgage-badge-paid";
      paidBadge.textContent = "\u2713 Paid";
      tdMortgage.appendChild(paidBadge);
    }
    row.appendChild(tdMortgage);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  container.appendChild(table);

  return container;
}
