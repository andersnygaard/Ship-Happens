/**
 * RefuelDialog — Modal dialog for refueling a ship at port.
 * Shows current fuel, max capacity, cost per ton, input for tons to add.
 */

import type { OwnedShip } from "../../data/types";
import type { PlayerState } from "../../game/GameState";
import { getPlayerBalance } from "../../game/GameState";
import { getShipSpec, getFuelCostPerTon } from "../../game/ShipManager";

export interface RefuelDialogCallbacks {
  onConfirm: (tonsToAdd: number) => void;
  onCancel: () => void;
}

/**
 * Create the refuel dialog overlay.
 */
export function createRefuelDialog(
  ship: OwnedShip,
  player: PlayerState,
  callbacks: RefuelDialogCallbacks,
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "port-ops-dialog panel panel-riveted";

  // Title
  const title = document.createElement("h3");
  title.className = "port-ops-dialog-title heading-copper";
  title.textContent = "Refuel";
  dialog.appendChild(title);

  const spec = getShipSpec(ship);
  const maxCapacity = spec ? spec.bunkerCapacityTons : 0;
  const currentFuel = ship.fuelTons;
  const maxAddable = maxCapacity - currentFuel;
  const costPerTon = ship.currentPortId ? getFuelCostPerTon(ship.currentPortId) : 0;
  const balance = getPlayerBalance(player);

  // Info section
  const infoSection = document.createElement("div");
  infoSection.className = "port-ops-dialog-info";

  const infoLines: [string, string][] = [
    ["Current fuel:", `${currentFuel.toLocaleString()}t`],
    ["Tank capacity:", `${maxCapacity.toLocaleString()}t`],
    ["Space available:", `${maxAddable.toLocaleString()}t`],
    ["Cost per ton:", `$${costPerTon.toLocaleString()}`],
    ["Balance:", `$${(balance / 1_000_000).toFixed(2)}M`],
  ];

  for (const [label, value] of infoLines) {
    const row = document.createElement("div");
    row.className = "port-ops-dialog-row";
    row.innerHTML = `<span class="port-ops-dialog-label">${label}</span><span class="port-ops-dialog-value data-display">${value}</span>`;
    infoSection.appendChild(row);
  }

  dialog.appendChild(infoSection);

  // Input section
  const inputSection = document.createElement("div");
  inputSection.className = "port-ops-dialog-input-section";

  const inputLabel = document.createElement("label");
  inputLabel.className = "input-label";
  inputLabel.textContent = "How many tons to add?";
  inputSection.appendChild(inputLabel);

  const inputRow = document.createElement("div");
  inputRow.className = "port-ops-dialog-input-row";

  const input = document.createElement("input");
  input.className = "input";
  input.type = "number";
  input.min = "0";
  input.max = String(maxAddable);
  input.value = String(maxAddable);
  input.style.width = "100px";
  input.style.textAlign = "center";
  inputRow.appendChild(input);

  const unitLabel = document.createElement("span");
  unitLabel.className = "port-ops-dialog-unit";
  unitLabel.textContent = "t";
  inputRow.appendChild(unitLabel);

  inputSection.appendChild(inputRow);

  // Cost preview
  const costPreview = document.createElement("div");
  costPreview.className = "port-ops-dialog-cost-preview data-display";

  function updateCostPreview(): void {
    const val = parseInt(input.value, 10) || 0;
    const clamped = Math.min(Math.max(0, val), maxAddable);
    const totalCost = clamped * costPerTon;
    costPreview.textContent = `Total cost: $${totalCost.toLocaleString()}`;
    if (totalCost > balance) {
      costPreview.style.color = "var(--color-danger)";
    } else {
      costPreview.style.color = "var(--color-text-accent)";
    }
  }

  input.addEventListener("input", updateCostPreview);
  updateCostPreview();

  inputSection.appendChild(costPreview);
  dialog.appendChild(inputSection);

  // Buttons
  const buttons = document.createElement("div");
  buttons.className = "port-ops-dialog-buttons";

  const okBtn = document.createElement("button");
  okBtn.className = "btn btn-primary";
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", () => {
    const val = parseInt(input.value, 10) || 0;
    const clamped = Math.min(Math.max(0, val), maxAddable);
    if (clamped > 0) {
      callbacks.onConfirm(clamped);
    }
  });
  buttons.appendChild(okBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", callbacks.onCancel);
  buttons.appendChild(cancelBtn);

  dialog.appendChild(buttons);
  overlay.appendChild(dialog);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) callbacks.onCancel();
  });

  setTimeout(() => input.focus(), 50);

  return overlay;
}
