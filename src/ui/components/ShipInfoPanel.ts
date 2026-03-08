/**
 * ShipInfoPanel — Modal overlay showing full ship specification sheet.
 * Displays all stats in a table format matching the original game's spec sheet.
 */

import type { ShipSpec } from "../../data/types";
import { createShipSideView } from "./ShipIllustration";

/**
 * Create and show a ship info modal overlay.
 * Returns the overlay element (caller can append to DOM).
 */
export function createShipInfoPanel(spec: ShipSpec, onClose: () => void): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const panel = document.createElement("div");
  panel.className = "ship-info-panel panel panel-riveted";

  // Header with ship name
  const header = document.createElement("h3");
  header.className = "ship-info-title heading-copper";
  header.textContent = `Ship Specification`;
  panel.appendChild(header);

  // Large ship illustration on dark background
  const imageBox = document.createElement("div");
  imageBox.className = "ship-info-image";
  const shipIllust = createShipSideView(spec.id, 400, 120);
  shipIllust.style.width = "100%";
  shipIllust.style.height = "100%";
  imageBox.appendChild(shipIllust);
  panel.appendChild(imageBox);

  // Specifications table
  const table = document.createElement("table");
  table.className = "ship-info-table";

  const specs: Array<[string, string]> = [
    ["Ship type", spec.type],
    ["Capacity", `${spec.capacityBrt.toLocaleString()} BRT`],
    ["Price", `Million$: ${spec.priceMillions.toFixed(1)}`],
    ["Engine power", `${spec.enginePowerHp.toLocaleString()} hp`],
    ["Length", `l=${spec.lengthM}m`],
    ["Beam", `b=${spec.beamM}m`],
    ["Deposit", `${spec.depositPercent}%`],
    ["Max speed", `vmax = ${spec.maxSpeedKnots}kn`],
    ["Fuel at max speed", `${spec.fuelConsumptionTonsPerDay}t/day`],
    ["Bunker capacity", `${spec.bunkerCapacityTons.toLocaleString()}t`],
    ["Daily operating costs", `$${spec.dailyOperatingCosts.toLocaleString()}.-`],
  ];

  for (const [label, value] of specs) {
    const row = document.createElement("tr");

    const labelCell = document.createElement("td");
    labelCell.className = "ship-info-label";
    labelCell.textContent = label;
    row.appendChild(labelCell);

    const valueCell = document.createElement("td");
    valueCell.className = "ship-info-value data-display";
    valueCell.textContent = value;
    row.appendChild(valueCell);

    table.appendChild(row);
  }

  panel.appendChild(table);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary ship-info-close-btn";
  closeBtn.textContent = "CLOSE";
  closeBtn.addEventListener("click", onClose);
  panel.appendChild(closeBtn);

  overlay.appendChild(panel);

  // Click on overlay background to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      onClose();
    }
  });

  return overlay;
}

/** Format ship ID as a display name. */
function formatShipName(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
