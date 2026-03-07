/**
 * FinancialSummary component — Displays the current balance
 * and recent transaction history from the financial ledger.
 */

import type { FinancialState, LedgerEntry } from "../../game/FinancialSystem";
import { getBalance } from "../../game/FinancialSystem";

export interface FinancialSummaryData {
  finances: FinancialState;
}

/** Number of recent transactions to display. */
const MAX_TRANSACTIONS = 10;

/**
 * Render the financial summary panel with balance and recent transactions.
 */
export function renderFinancialSummary(data: FinancialSummaryData): HTMLElement {
  const container = document.createElement("div");
  container.className = "office-financial-summary";

  const title = document.createElement("h3");
  title.className = "heading-copper office-panel-title";
  title.textContent = "Financial Summary";
  container.appendChild(title);

  // Current balance
  const balance = getBalance(data.finances);
  const balanceDiv = document.createElement("div");
  balanceDiv.className = "office-balance-display";

  const balanceLabel = document.createElement("span");
  balanceLabel.className = "office-balance-label";
  balanceLabel.textContent = "Current Balance";

  const balanceValue = document.createElement("span");
  balanceValue.className = "office-balance-value data-display";
  balanceValue.textContent = `$${balance.toLocaleString()}`;

  balanceDiv.appendChild(balanceLabel);
  balanceDiv.appendChild(balanceValue);
  container.appendChild(balanceDiv);

  // Recent transactions
  const txTitle = document.createElement("h4");
  txTitle.className = "office-tx-title";
  txTitle.textContent = "Recent Transactions";
  container.appendChild(txTitle);

  const ledger = data.finances.ledger;
  if (ledger.length === 0) {
    const empty = document.createElement("p");
    empty.className = "office-empty-msg";
    empty.textContent = "No transactions yet.";
    container.appendChild(empty);
    return container;
  }

  // Show last N transactions in reverse chronological order
  const recentEntries = ledger.slice(-MAX_TRANSACTIONS).reverse();

  const txList = document.createElement("div");
  txList.className = "office-tx-list";

  for (const entry of recentEntries) {
    const row = document.createElement("div");
    row.className = `office-tx-row office-tx-${entry.type}`;

    const descEl = document.createElement("span");
    descEl.className = "office-tx-desc";
    descEl.textContent = entry.description;

    const amountEl = document.createElement("span");
    amountEl.className = "office-tx-amount data-display";
    const sign = entry.type === "credit" ? "+" : "-";
    amountEl.textContent = `${sign}$${entry.amount.toLocaleString()}`;

    const timeEl = document.createElement("span");
    timeEl.className = "office-tx-time";
    timeEl.textContent = `W${entry.timestamp.week} Y${entry.timestamp.year}`;

    row.appendChild(descEl);
    row.appendChild(amountEl);
    row.appendChild(timeEl);
    txList.appendChild(row);
  }

  container.appendChild(txList);
  return container;
}
