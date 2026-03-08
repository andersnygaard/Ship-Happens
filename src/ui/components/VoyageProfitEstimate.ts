/**
 * VoyageProfitEstimate — UI component that renders a compact voyage
 * profitability breakdown (fuel cost, operating costs, net profit, margin).
 *
 * Used in the Charter Dialog and World Map destination info panel.
 */

import type { VoyageProfitability, VoyageEstimate } from "../../game/VoyageEstimator";

/**
 * Create a compact profit margin indicator badge.
 * Shows "+32%" in green or "-5%" in red for quick scanning.
 */
export function createProfitBadge(profitability: VoyageProfitability): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "voyage-profit-badge";

  const margin = profitability.profitMarginPercent;
  const sign = margin >= 0 ? "+" : "";
  badge.textContent = `${sign}${margin}%`;

  if (margin < 0) {
    badge.style.color = "var(--color-danger, #ff4444)";
    badge.style.fontWeight = "bold";
  } else if (margin < 10) {
    badge.style.color = "var(--color-gold, #ffaa33)";
  } else {
    badge.style.color = "var(--color-success, #44ff44)";
  }

  badge.title = `Est. profit margin: ${sign}${margin}%`;
  return badge;
}

/**
 * Create a full profitability breakdown panel for the Charter Dialog details.
 * Shows estimated fuel cost, operating costs, total costs, and net profit.
 */
export function createProfitBreakdown(profitability: VoyageProfitability): HTMLElement {
  const container = document.createElement("div");
  container.className = "voyage-profit-breakdown";

  // Section header
  const header = document.createElement("div");
  header.className = "voyage-profit-header";
  header.textContent = "Estimated Profitability";
  container.appendChild(header);

  const { estimate, revenue, netProfit, profitMarginPercent } = profitability;

  // Travel days
  container.appendChild(createRow("Est. travel days", `~${estimate.travelDays} days`, ""));

  // Fuel cost
  container.appendChild(createRow("Est. fuel cost", `-$${estimate.fuelCost.toLocaleString()}`, ""));

  // Operating costs
  container.appendChild(createRow("Est. operating costs", `-$${estimate.operatingCosts.toLocaleString()}`, ""));

  // Total costs
  container.appendChild(createRow("Est. total costs", `-$${estimate.totalCosts.toLocaleString()}`, ""));

  // Divider
  const divider = document.createElement("div");
  divider.className = "voyage-profit-divider";
  container.appendChild(divider);

  // Net profit
  const profitColor = netProfit < 0
    ? "var(--color-danger, #ff4444)"
    : netProfit < revenue * 0.1
      ? "var(--color-gold, #ffaa33)"
      : "var(--color-success, #44ff44)";

  const sign = netProfit >= 0 ? "+" : "";
  container.appendChild(createRow(
    "Est. net profit",
    `${sign}$${netProfit.toLocaleString()}`,
    profitColor,
    true,
  ));

  // Margin
  const marginSign = profitMarginPercent >= 0 ? "+" : "";
  container.appendChild(createRow(
    "Profit margin",
    `${marginSign}${profitMarginPercent}%`,
    profitColor,
    true,
  ));

  // Approximate disclaimer
  const disclaimer = document.createElement("div");
  disclaimer.className = "voyage-profit-disclaimer";
  disclaimer.textContent = "Estimates are approximate. Storms or delays may affect actual costs.";
  container.appendChild(disclaimer);

  return container;
}

/**
 * Create a compact voyage cost estimate for the World Map info panel.
 * Shows just total estimated cost and travel days.
 */
export function createVoyageCostSummary(estimate: VoyageEstimate): HTMLElement {
  const container = document.createElement("div");
  container.className = "voyage-cost-summary";

  const header = document.createElement("div");
  header.className = "voyage-cost-summary-header";
  header.textContent = "Est. Voyage Cost";
  container.appendChild(header);

  container.appendChild(createRow("Fuel cost", `~$${estimate.fuelCost.toLocaleString()}`, ""));
  container.appendChild(createRow("Operating cost", `~$${estimate.operatingCosts.toLocaleString()}`, ""));
  container.appendChild(createRow("Total", `~$${estimate.totalCosts.toLocaleString()}`, "var(--color-gold, #ffaa33)", true));

  const disclaimer = document.createElement("div");
  disclaimer.className = "voyage-profit-disclaimer";
  disclaimer.textContent = "Approximate estimate at current fuel prices.";
  container.appendChild(disclaimer);

  return container;
}

/** Helper: create a labeled row with optional color and bold. */
function createRow(label: string, value: string, color: string, bold: boolean = false): HTMLElement {
  const row = document.createElement("div");
  row.className = "voyage-profit-row";

  const labelEl = document.createElement("span");
  labelEl.className = "voyage-profit-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "voyage-profit-value";
  valueEl.textContent = value;
  if (color) {
    valueEl.style.color = color;
  }
  if (bold) {
    valueEl.style.fontWeight = "bold";
    labelEl.style.fontWeight = "bold";
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}
