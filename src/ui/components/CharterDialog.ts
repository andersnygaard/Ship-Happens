/**
 * CharterDialog — Modal dialog for browsing and accepting freight contracts.
 * Two-column layout: destinations (left), cargo types (right).
 * Contract details shown in a bottom panel.
 */

import type { CharterContract } from "../../data/types";
import { getPortById } from "../../data/ports";
import type { WorldEvent } from "../../game/WorldEvents";
import { isPortBlocked, getPortCostMultiplier, getEventsAffectingPort } from "../../game/WorldEvents";

export interface CharterDialogCallbacks {
  onAccept: (contract: CharterContract) => void;
  onCancel: () => void;
}

/**
 * Create the charter dialog overlay.
 */
export function createCharterDialog(
  contracts: CharterContract[],
  callbacks: CharterDialogCallbacks,
  worldEvents?: readonly WorldEvent[],
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "charter-dialog panel panel-riveted";

  // Title
  const title = document.createElement("h3");
  title.className = "port-ops-dialog-title heading-copper";
  title.textContent = "Charter / Freight Contract";
  dialog.appendChild(title);

  if (contracts.length === 0) {
    const noContracts = document.createElement("p");
    noContracts.className = "port-ops-dialog-text";
    noContracts.textContent = "No charter contracts available at this port.";
    dialog.appendChild(noContracts);

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", callbacks.onCancel);
    dialog.appendChild(closeBtn);

    overlay.appendChild(dialog);
    return overlay;
  }

  // Collect unique destinations and cargo types
  const destinations = new Map<string, CharterContract[]>();
  const cargoTypes = new Map<string, CharterContract[]>();

  for (const c of contracts) {
    const port = getPortById(c.destinationPortId);
    const destName = port ? port.name : c.destinationPortId;
    if (!destinations.has(destName)) destinations.set(destName, []);
    destinations.get(destName)!.push(c);

    if (!cargoTypes.has(c.cargoType)) cargoTypes.set(c.cargoType, []);
    cargoTypes.get(c.cargoType)!.push(c);
  }

  let selectedContract: CharterContract | null = null;

  // Two-column selection
  const columnsContainer = document.createElement("div");
  columnsContainer.className = "charter-columns";

  // Left column — Destinations
  const destColumn = document.createElement("div");
  destColumn.className = "charter-column";

  const destHeader = document.createElement("div");
  destHeader.className = "charter-column-header";
  destHeader.textContent = "Destination";
  destColumn.appendChild(destHeader);

  const destList = document.createElement("div");
  destList.className = "charter-list";

  // Right column — Cargo types
  const cargoColumn = document.createElement("div");
  cargoColumn.className = "charter-column";

  const cargoHeader = document.createElement("div");
  cargoHeader.className = "charter-column-header";
  cargoHeader.textContent = "Cargo Type";
  cargoColumn.appendChild(cargoHeader);

  const cargoList = document.createElement("div");
  cargoList.className = "charter-list";

  // Contract details panel
  const detailsPanel = document.createElement("div");
  detailsPanel.className = "charter-details";

  const detailsContent = document.createElement("div");
  detailsContent.className = "charter-details-content";
  detailsContent.textContent = "Select a contract to view details.";
  detailsPanel.appendChild(detailsContent);

  function updateDetails(contract: CharterContract | null): void {
    if (!contract) {
      detailsContent.innerHTML = '<span class="port-ops-dialog-text">Select a contract to view details.</span>';
      return;
    }
    const destPort = getPortById(contract.destinationPortId);
    const destName = destPort ? destPort.name : contract.destinationPortId;

    const funnyLine = contract.funnyDescription
      ? `<div class="charter-funny-cargo">"${contract.funnyDescription}"</div>`
      : "";

    // Check for world event warnings at destination
    let eventWarningHtml = "";
    if (worldEvents && worldEvents.length > 0) {
      const destBlocked = isPortBlocked(contract.destinationPortId, worldEvents);
      const destMultiplier = getPortCostMultiplier(contract.destinationPortId, worldEvents);
      const destEvents = getEventsAffectingPort(contract.destinationPortId, worldEvents);

      if (destBlocked) {
        eventWarningHtml = `<div style="color: #ff4444; font-weight: bold; margin: 4px 0; padding: 4px 8px; background: rgba(255,68,68,0.1); border-radius: 4px;">WARNING: Destination port is BLOCKED!</div>`;
      } else if (destMultiplier > 1.0 && destEvents.length > 0) {
        const eventHeadline = destEvents[0].headline;
        eventWarningHtml = `<div style="color: #ffaa33; font-style: italic; margin: 4px 0; padding: 4px 8px; background: rgba(255,170,51,0.1); border-radius: 4px;">Event: ${eventHeadline} (costs +${Math.round((destMultiplier - 1) * 100)}%)</div>`;
      }
    }

    detailsContent.innerHTML = `
      <div class="charter-details-title">${contract.cargoType} to ${destName}</div>
      ${funnyLine}
      ${eventWarningHtml}
      <div class="port-ops-dialog-row">
        <span class="port-ops-dialog-label">Rate:</span>
        <span class="port-ops-dialog-value data-display">$${contract.rate.toLocaleString()}</span>
      </div>
      <div class="port-ops-dialog-row">
        <span class="port-ops-dialog-label">Del.:</span>
        <span class="port-ops-dialog-value data-display">${contract.deliveryDeadlineDays} days</span>
      </div>
      <div class="port-ops-dialog-row">
        <span class="port-ops-dialog-label">Pen.:</span>
        <span class="port-ops-dialog-value data-display">$${contract.penalty.toLocaleString()}</span>
      </div>
      <div class="port-ops-dialog-row">
        <span class="port-ops-dialog-label">Dist:</span>
        <span class="port-ops-dialog-value data-display">${contract.distanceNm.toLocaleString()} nm</span>
      </div>
    `;
  }

  // Render contract items as a flat list
  for (const contract of contracts) {
    const destPort = getPortById(contract.destinationPortId);
    const destName = destPort ? destPort.name : contract.destinationPortId;

    // Destination item
    const destItem = document.createElement("div");
    destItem.className = "charter-item";
    // Add warning indicator if destination has world event
    let destDisplayName = destName;
    if (worldEvents && worldEvents.length > 0) {
      if (isPortBlocked(contract.destinationPortId, worldEvents)) {
        destDisplayName = `${destName} [BLOCKED]`;
        destItem.style.color = "#ff4444";
      } else if (getPortCostMultiplier(contract.destinationPortId, worldEvents) > 1.0) {
        destDisplayName = `${destName} [!]`;
        destItem.style.color = "#ffaa33";
      }
    }
    destItem.textContent = destDisplayName;
    destItem.dataset.contractIdx = String(contracts.indexOf(contract));

    // Cargo item
    const cargoItem = document.createElement("div");
    cargoItem.className = "charter-item";
    cargoItem.textContent = contract.cargoType;
    cargoItem.dataset.contractIdx = String(contracts.indexOf(contract));

    function selectContract(): void {
      selectedContract = contract;

      // Update selection visuals
      destList.querySelectorAll(".charter-item").forEach((el) => {
        el.classList.toggle("selected", el.getAttribute("data-contract-idx") === String(contracts.indexOf(contract)));
      });
      cargoList.querySelectorAll(".charter-item").forEach((el) => {
        el.classList.toggle("selected", el.getAttribute("data-contract-idx") === String(contracts.indexOf(contract)));
      });

      updateDetails(contract);
    }

    destItem.addEventListener("click", selectContract);
    cargoItem.addEventListener("click", selectContract);

    destList.appendChild(destItem);
    cargoList.appendChild(cargoItem);
  }

  destColumn.appendChild(destList);
  cargoColumn.appendChild(cargoList);
  columnsContainer.appendChild(destColumn);
  columnsContainer.appendChild(cargoColumn);

  dialog.appendChild(columnsContainer);
  dialog.appendChild(detailsPanel);

  // Buttons
  const buttons = document.createElement("div");
  buttons.className = "port-ops-dialog-buttons";

  const okBtn = document.createElement("button");
  okBtn.className = "btn btn-primary";
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", () => {
    if (selectedContract) {
      callbacks.onAccept(selectedContract);
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

  return overlay;
}
