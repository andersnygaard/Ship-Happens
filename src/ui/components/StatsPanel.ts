/**
 * StatsPanel component — Displays per-player performance statistics
 * in the office screen with formatted metrics.
 */

import type { PlayerStatistics } from "../../game/Statistics";
import { getNetProfit } from "../../game/Statistics";

export interface StatsPanelData {
  statistics: PlayerStatistics;
  playerName: string;
  companyName: string;
}

/**
 * Render the statistics panel showing all tracked player metrics.
 */
export function renderStatsPanel(data: StatsPanelData): HTMLElement {
  const container = document.createElement("div");
  container.className = "office-stats-panel";

  const title = document.createElement("h3");
  title.className = "heading-copper office-panel-title";
  title.textContent = "Company Statistics";
  container.appendChild(title);

  const stats = data.statistics;
  const netProfit = getNetProfit(stats);

  const statItems: Array<{ label: string; value: string; className?: string }> = [
    { label: "Total Voyages", value: stats.totalVoyages.toLocaleString() },
    { label: "Distance Sailed", value: `${Math.round(stats.distanceSailed).toLocaleString()} nm` },
    { label: "Ports Visited", value: stats.portsVisited.length.toLocaleString() },
    { label: "Charters Completed", value: stats.chartersCompleted.toLocaleString() },
    { label: "Cargo Delivered", value: `$${stats.cargoDelivered.toLocaleString()}` },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}` },
    { label: "Total Expenses", value: `$${stats.totalExpenses.toLocaleString()}` },
    {
      label: "Net Profit",
      value: `$${netProfit.toLocaleString()}`,
      className: netProfit >= 0 ? "stats-positive" : "stats-negative",
    },
    { label: "Ships Purchased", value: stats.shipsOwned.toLocaleString() },
    { label: "Ships Sold", value: stats.shipsSold.toLocaleString() },
  ];

  const table = document.createElement("table");
  table.className = "office-stats-table";

  const tbody = document.createElement("tbody");
  for (const item of statItems) {
    const row = document.createElement("tr");

    const labelCell = document.createElement("td");
    labelCell.className = "stats-label";
    labelCell.textContent = item.label;
    row.appendChild(labelCell);

    const valueCell = document.createElement("td");
    valueCell.className = "stats-value data-display";
    if (item.className) {
      valueCell.classList.add(item.className);
    }
    valueCell.textContent = item.value;
    row.appendChild(valueCell);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  // Ports visited list
  if (stats.portsVisited.length > 0) {
    const portsTitle = document.createElement("h4");
    portsTitle.className = "office-tx-title";
    portsTitle.textContent = "Ports Visited";
    container.appendChild(portsTitle);

    const portsList = document.createElement("div");
    portsList.className = "stats-ports-list";
    portsList.textContent = stats.portsVisited.join(", ");
    container.appendChild(portsList);
  }

  return container;
}
