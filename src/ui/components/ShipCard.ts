/**
 * ShipCard — Individual ship display card for the Ship Broker screen.
 * Shows a CSS-drawn ship illustration, ship type, price, and BUY/INFO buttons.
 */

import type { ShipSpec } from "../../data/types";
import { createShipSideView } from "./ShipIllustration";

/** Color mapping by price range for ship placeholder images. */
function getShipColor(priceMillions: number): string {
  if (priceMillions <= 5) return "#3a7bd5";     // Blue for cheap
  if (priceMillions <= 15) return "#2d8a4e";    // Green for mid-range
  if (priceMillions <= 40) return "#b83030";    // Red for expensive
  return "#c8a020";                              // Gold for premium
}

/** Format ship ID as a display name (e.g., "coastal-trader" -> "Coastal Trader"). */
function formatShipName(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface ShipCardCallbacks {
  onBuy: (spec: ShipSpec) => void;
  onInfo: (spec: ShipSpec) => void;
}

/**
 * Create a ship card DOM element for browsing in the broker.
 */
export function createShipCard(spec: ShipSpec, callbacks: ShipCardCallbacks): HTMLElement {
  const card = document.createElement("div");
  card.className = "ship-card";

  // Ship illustration (CSS-drawn side-view)
  const imageBox = document.createElement("div");
  imageBox.className = "ship-card-image";
  const shipIllust = createShipSideView(spec.id, 180, 100);
  imageBox.appendChild(shipIllust);

  card.appendChild(imageBox);

  // Info section
  const info = document.createElement("div");
  info.className = "ship-card-info";

  const typeLine = document.createElement("div");
  typeLine.className = "ship-card-type";
  typeLine.textContent = `${spec.type} — ${spec.capacityBrt.toLocaleString()} BRT`;
  info.appendChild(typeLine);

  const priceLine = document.createElement("div");
  priceLine.className = "ship-card-price data-display";
  priceLine.textContent = `Million$: ${spec.priceMillions.toFixed(1)}`;
  info.appendChild(priceLine);

  card.appendChild(info);

  // Buttons
  const buttons = document.createElement("div");
  buttons.className = "ship-card-buttons";

  const buyBtn = document.createElement("button");
  buyBtn.className = "btn btn-primary ship-card-btn";
  buyBtn.textContent = "BUY";
  buyBtn.addEventListener("click", () => callbacks.onBuy(spec));
  buttons.appendChild(buyBtn);

  const infoBtn = document.createElement("button");
  infoBtn.className = "btn btn-secondary ship-card-btn";
  infoBtn.textContent = "INFO";
  infoBtn.addEventListener("click", () => callbacks.onInfo(spec));
  buttons.appendChild(infoBtn);

  card.appendChild(buttons);

  return card;
}
