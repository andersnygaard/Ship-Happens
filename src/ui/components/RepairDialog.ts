/**
 * RepairDialog — Modal dialog for repairing a ship at port.
 * Shows current condition, cost per %, input for how many % to repair, and total cost.
 */

import type { OwnedShip, Port } from "../../data/types";
import type { PlayerState } from "../../game/GameState";
import { getPlayerBalance } from "../../game/GameState";
import { createDryDockView } from "./ShipIllustration";

export interface RepairDialogCallbacks {
  onConfirm: (percentToRepair: number) => void;
  onCancel: () => void;
}

/**
 * Create the repair dialog overlay.
 */
export function createRepairDialog(
  ship: OwnedShip,
  port: Port,
  player: PlayerState,
  callbacks: RepairDialogCallbacks,
  costMultiplier: number = 1.0,
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "port-ops-dialog panel panel-riveted";

  // Title
  const title = document.createElement("h3");
  title.className = "port-ops-dialog-title heading-copper";
  title.textContent = "Ship Repair";
  dialog.appendChild(title);

  // Two-column layout: dry dock illustration + form
  const layout = document.createElement("div");
  layout.className = "repair-dialog-layout";

  // Left: dry dock illustration
  const illustrationCol = document.createElement("div");
  illustrationCol.className = "repair-dialog-illustration";
  const dryDock = createDryDockView(ship.specId, 180, 200);
  illustrationCol.appendChild(dryDock);
  layout.appendChild(illustrationCol);

  // Right: repair form
  const formCol = document.createElement("div");
  formCol.className = "repair-dialog-form";

  // Ship docked message
  const dockedMsg = document.createElement("p");
  dockedMsg.className = "port-ops-dialog-text";
  dockedMsg.textContent = "Your ship has docked.";
  formCol.appendChild(dockedMsg);

  // Info section
  const infoSection = document.createElement("div");
  infoSection.className = "port-ops-dialog-info";

  const maxRepairable = 100 - ship.conditionPercent;
  const baseCostPerPercent = port.repairCostPerPercent;
  const costPerPercent = Math.round(baseCostPerPercent * costMultiplier);
  const maxCost = maxRepairable * costPerPercent;
  const balance = getPlayerBalance(player);

  const costLabel = costMultiplier > 1.0
    ? `$${costPerPercent.toLocaleString()} per % (+${Math.round((costMultiplier - 1) * 100)}% event surcharge)`
    : `$${costPerPercent.toLocaleString()} per %`;

  const infoLines: [string, string][] = [
    ["State:", `${ship.conditionPercent}%`],
    ["Costs:", costLabel],
    ["Maximum:", `$${maxCost.toLocaleString()}`],
    ["Balance:", `$${(balance / 1_000_000).toFixed(2)}M`],
  ];

  for (const [label, value] of infoLines) {
    const row = document.createElement("div");
    row.className = "port-ops-dialog-row";
    row.innerHTML = `<span class="port-ops-dialog-label">${label}</span><span class="port-ops-dialog-value data-display">${value}</span>`;
    infoSection.appendChild(row);
  }

  formCol.appendChild(infoSection);

  // Input section
  const inputSection = document.createElement("div");
  inputSection.className = "port-ops-dialog-input-section";

  const inputLabel = document.createElement("label");
  inputLabel.className = "input-label";
  inputLabel.textContent = "Repair how many percent?";
  inputSection.appendChild(inputLabel);

  const inputRow = document.createElement("div");
  inputRow.className = "port-ops-dialog-input-row";

  const input = document.createElement("input");
  input.className = "input";
  input.type = "number";
  input.min = "0";
  input.max = String(maxRepairable);
  input.value = String(maxRepairable);
  input.style.width = "80px";
  input.style.textAlign = "center";
  inputRow.appendChild(input);

  const pctLabel = document.createElement("span");
  pctLabel.className = "port-ops-dialog-unit";
  pctLabel.textContent = "%";
  inputRow.appendChild(pctLabel);

  inputSection.appendChild(inputRow);

  // Cost preview
  const costPreview = document.createElement("div");
  costPreview.className = "port-ops-dialog-cost-preview data-display";
  costPreview.textContent = `Total cost: $${maxCost.toLocaleString()}`;

  function updateCostPreview(): void {
    const val = parseInt(input.value, 10) || 0;
    const clamped = Math.min(Math.max(0, val), maxRepairable);
    const totalCost = clamped * costPerPercent;
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
  formCol.appendChild(inputSection);

  // Buttons
  const buttons = document.createElement("div");
  buttons.className = "port-ops-dialog-buttons";

  const okBtn = document.createElement("button");
  okBtn.className = "btn btn-primary";
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", () => {
    const val = parseInt(input.value, 10) || 0;
    const clamped = Math.min(Math.max(0, val), maxRepairable);
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

  formCol.appendChild(buttons);
  layout.appendChild(formCol);
  dialog.appendChild(layout);
  overlay.appendChild(dialog);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) callbacks.onCancel();
  });

  setTimeout(() => input.focus(), 50);

  return overlay;
}
