/**
 * DebtDashboard component — Displays mortgage and debt overview
 * with per-ship breakdowns, progress bars, net worth, and extra payment controls.
 */

import type { PlayerState } from "../../game/GameState";
import { getPlayerBalance } from "../../game/GameState";
import { calculateShipValue } from "../../game/ShipManager";
import { getDebtCommentary } from "../../data/humorTexts";

export interface DebtDashboardData {
  player: PlayerState;
  currentWeek: number;
  currentYear: number;
  /** Callback when the player wants to make an extra mortgage payment. */
  onExtraPayment?: (shipIndex: number, amount: number) => void;
}

/**
 * Render the debt dashboard panel showing mortgage overview and per-ship breakdown.
 */
export function renderDebtDashboard(data: DebtDashboardData): HTMLElement {
  const container = document.createElement("div");
  container.className = "office-debt-dashboard";

  const title = document.createElement("h3");
  title.className = "heading-copper office-panel-title";
  title.textContent = "Debt Overview";
  container.appendChild(title);

  const { player, currentWeek, currentYear } = data;
  const balance = getPlayerBalance(player);

  // Calculate totals
  let totalDebt = 0;
  let totalWeeklyPayments = 0;
  let totalFleetValue = 0;

  for (const ship of player.ships) {
    totalDebt += ship.mortgageRemaining;
    totalWeeklyPayments += ship.mortgagePayment;
    const valuation = calculateShipValue(ship, currentWeek, currentYear);
    totalFleetValue += valuation.salePrice;
  }

  const netWorth = balance + totalFleetValue - totalDebt;

  // ─── Summary Cards ──────────────────────────────────────────────────
  const summaryRow = document.createElement("div");
  summaryRow.className = "debt-summary-row";

  // Total Debt card
  summaryRow.appendChild(createSummaryCard(
    "Total Debt",
    `$${totalDebt.toLocaleString()}`,
    totalDebt > 0 ? "debt-value-negative" : "debt-value-positive",
  ));

  // Weekly Payments card
  summaryRow.appendChild(createSummaryCard(
    "Weekly Payments",
    `$${totalWeeklyPayments.toLocaleString()}`,
    "debt-value-neutral",
  ));

  // Net Worth card
  summaryRow.appendChild(createSummaryCard(
    "Net Worth",
    `$${netWorth.toLocaleString()}`,
    netWorth >= 0 ? "debt-value-positive" : "debt-value-negative",
  ));

  // Estimated fleet-wide payoff
  const estPayoffWeeks = totalWeeklyPayments > 0
    ? Math.ceil(totalDebt / totalWeeklyPayments)
    : 0;
  const payoffLabel = totalDebt <= 0
    ? "Debt Free!"
    : `~${estPayoffWeeks} weeks`;
  summaryRow.appendChild(createSummaryCard(
    "Est. Payoff",
    payoffLabel,
    totalDebt <= 0 ? "debt-value-positive" : "debt-value-neutral",
  ));

  container.appendChild(summaryRow);

  // ─── Humorous Commentary ────────────────────────────────────────────
  const commentary = document.createElement("div");
  commentary.className = "debt-commentary";
  commentary.textContent = getDebtCommentary(totalDebt, totalFleetValue);
  container.appendChild(commentary);

  // ─── Per-Ship Mortgage Breakdown ────────────────────────────────────
  const shipsWithMortgage = player.ships.filter((s) => s.originalMortgageAmount > 0 || s.mortgageRemaining > 0);

  if (shipsWithMortgage.length === 0 && player.ships.length > 0) {
    const noDebt = document.createElement("p");
    noDebt.className = "office-empty-msg";
    noDebt.textContent = "No outstanding mortgages. Your fleet is fully paid off!";
    container.appendChild(noDebt);
    return container;
  }

  if (player.ships.length === 0) {
    const noShips = document.createElement("p");
    noShips.className = "office-empty-msg";
    noShips.textContent = "No ships in your fleet. Visit the Ship Broker to get started.";
    container.appendChild(noShips);
    return container;
  }

  const breakdownTitle = document.createElement("h4");
  breakdownTitle.className = "office-tx-title";
  breakdownTitle.textContent = "Per-Ship Mortgages";
  container.appendChild(breakdownTitle);

  const shipList = document.createElement("div");
  shipList.className = "debt-ship-list";

  for (let i = 0; i < player.ships.length; i++) {
    const ship = player.ships[i];
    if (ship.originalMortgageAmount <= 0 && ship.mortgageRemaining <= 0) continue;

    const shipRow = document.createElement("div");
    shipRow.className = "debt-ship-row";

    // Ship name and basic info
    const shipHeader = document.createElement("div");
    shipHeader.className = "debt-ship-header";

    const shipName = document.createElement("span");
    shipName.className = "debt-ship-name";
    shipName.textContent = ship.name;
    shipHeader.appendChild(shipName);

    // Paid off badge
    if (ship.mortgageRemaining <= 0) {
      const paidBadge = document.createElement("span");
      paidBadge.className = "debt-paid-badge";
      paidBadge.textContent = "PAID OFF";
      shipHeader.appendChild(paidBadge);
    }

    shipRow.appendChild(shipHeader);

    // Progress bar
    const paid = ship.originalMortgageAmount - ship.mortgageRemaining;
    const progressFraction = ship.originalMortgageAmount > 0
      ? Math.min(1, paid / ship.originalMortgageAmount)
      : 1;

    const progressContainer = document.createElement("div");
    progressContainer.className = "debt-progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = "debt-progress-bar";
    progressBar.style.width = `${Math.round(progressFraction * 100)}%`;
    if (progressFraction >= 1) {
      progressBar.classList.add("debt-progress-complete");
    }

    const progressLabel = document.createElement("span");
    progressLabel.className = "debt-progress-label";
    progressLabel.textContent = `${Math.round(progressFraction * 100)}% paid`;

    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressLabel);
    shipRow.appendChild(progressContainer);

    // Details grid
    const details = document.createElement("div");
    details.className = "debt-ship-details";

    details.appendChild(createDetailItem("Original Loan", `$${ship.originalMortgageAmount.toLocaleString()}`));
    details.appendChild(createDetailItem("Remaining", `$${ship.mortgageRemaining.toLocaleString()}`));
    details.appendChild(createDetailItem("Weekly Payment", `$${ship.mortgagePayment.toLocaleString()}`));

    // Estimated weeks to payoff
    const weeksToPayoff = ship.mortgagePayment > 0
      ? Math.ceil(ship.mortgageRemaining / ship.mortgagePayment)
      : 0;
    const payoffText = ship.mortgageRemaining <= 0
      ? "Paid off"
      : `~${weeksToPayoff} weeks`;
    details.appendChild(createDetailItem("Est. Payoff", payoffText));

    // Total interest paid so far (original amount - remaining = principal paid, difference from payments is interest)
    const totalPrincipalPaid = ship.originalMortgageAmount - ship.mortgageRemaining;
    // Interest paid is approximate: total payments made minus principal paid
    // Since we track original and remaining, we know principal paid.
    // We approximate interest from the difference between what was paid in total vs principal reduction.
    // For display purposes, show principal paid vs original as a simpler metric.
    details.appendChild(createDetailItem("Principal Paid", `$${totalPrincipalPaid.toLocaleString()}`));

    shipRow.appendChild(details);

    // "Pay Extra" button (only for ships with remaining mortgage)
    if (ship.mortgageRemaining > 0 && data.onExtraPayment) {
      const payExtraRow = document.createElement("div");
      payExtraRow.className = "debt-pay-extra-row";

      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.className = "debt-pay-extra-input";
      amountInput.placeholder = "Amount ($)";
      amountInput.min = "1";
      amountInput.max = String(Math.min(ship.mortgageRemaining, balance));

      const payBtn = document.createElement("button");
      payBtn.className = "btn btn-secondary debt-pay-extra-btn";
      payBtn.textContent = "Pay Extra";
      const shipIndex = i;
      const onPayment = data.onExtraPayment;
      payBtn.addEventListener("click", () => {
        const amount = parseInt(amountInput.value, 10);
        if (amount > 0) {
          onPayment(shipIndex, amount);
        }
      });

      const payAllBtn = document.createElement("button");
      payAllBtn.className = "btn btn-secondary debt-pay-extra-btn";
      payAllBtn.textContent = "Pay Off";
      payAllBtn.title = `Pay remaining $${ship.mortgageRemaining.toLocaleString()}`;
      payAllBtn.addEventListener("click", () => {
        onPayment(shipIndex, ship.mortgageRemaining);
      });

      payExtraRow.appendChild(amountInput);
      payExtraRow.appendChild(payBtn);
      payExtraRow.appendChild(payAllBtn);
      shipRow.appendChild(payExtraRow);
    }

    shipList.appendChild(shipRow);
  }

  container.appendChild(shipList);
  return container;
}

/** Create a summary card element. */
function createSummaryCard(label: string, value: string, valueClass: string): HTMLElement {
  const card = document.createElement("div");
  card.className = "debt-summary-card";

  const labelEl = document.createElement("div");
  labelEl.className = "debt-summary-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.className = `debt-summary-value data-display ${valueClass}`;
  valueEl.textContent = value;

  card.appendChild(labelEl);
  card.appendChild(valueEl);
  return card;
}

/** Create a detail key-value item. */
function createDetailItem(label: string, value: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "debt-detail-item";

  const labelEl = document.createElement("span");
  labelEl.className = "debt-detail-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "debt-detail-value data-display";
  valueEl.textContent = value;

  item.appendChild(labelEl);
  item.appendChild(valueEl);
  return item;
}
