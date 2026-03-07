/**
 * ShipSelector — Reusable ship selection widget.
 * Shows a row of buttons for each ship in the player's fleet.
 * Used on PortOperationsScreen and WorldMapScreen when the player has multiple ships.
 */

import type { OwnedShip } from "../../data/types";

export interface ShipSelectorCallbacks {
  /** Called when the player selects a different ship. */
  onSelect: (shipIndex: number) => void;
}

/**
 * Create a ship selector widget showing a button for each ship.
 * Only renders if the player has more than one ship.
 *
 * @param ships - The player's fleet
 * @param activeIndex - Index of the currently selected ship
 * @param callbacks - Selection callback
 * @returns The selector element, or null if only one ship
 */
export function createShipSelector(
  ships: OwnedShip[],
  activeIndex: number,
  callbacks: ShipSelectorCallbacks,
): HTMLElement | null {
  if (ships.length <= 1) {
    return null;
  }

  const selector = document.createElement("div");
  selector.className = "ship-selector";

  const label = document.createElement("span");
  label.className = "ship-selector-label";
  label.textContent = "Active Ship:";
  selector.appendChild(label);

  const btnRow = document.createElement("div");
  btnRow.className = "ship-selector-buttons";

  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    const btn = document.createElement("button");
    btn.className = `btn ${i === activeIndex ? "btn-primary" : "btn-secondary"} ship-selector-btn`;
    btn.textContent = ship.name;

    // Add status indicators
    if (ship.isLaidUp) {
      btn.textContent += " (Laid Up)";
      btn.classList.add("ship-selector-btn-laidup");
    } else if (!ship.currentPortId) {
      btn.textContent += " (At Sea)";
      btn.classList.add("ship-selector-btn-atsea");
    }

    btn.addEventListener("click", () => {
      callbacks.onSelect(i);
    });

    btnRow.appendChild(btn);
  }

  selector.appendChild(btnRow);
  return selector;
}
