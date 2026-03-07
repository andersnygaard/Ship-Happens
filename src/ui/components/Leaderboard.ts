/**
 * Leaderboard component — Multiplayer ranking table.
 * Ranks players by net worth (bank balance + total ship values).
 */

import type { PlayerState } from "../../game/GameState";
import { getPlayerBalance } from "../../game/GameState";
import { calculateShipValue } from "../../game/ShipManager";

export interface LeaderboardData {
  players: PlayerState[];
  currentWeek: number;
  currentYear: number;
}

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  companyName: string;
  balance: number;
  fleetValue: number;
  netWorth: number;
  shipCount: number;
  voyages: number;
}

/**
 * Calculate net worth for a player (balance + total ship value - outstanding mortgages).
 */
function calculateNetWorth(player: PlayerState, week: number, year: number): number {
  const balance = getPlayerBalance(player);
  let fleetValue = 0;
  for (const ship of player.ships) {
    const valuation = calculateShipValue(ship, week, year);
    fleetValue += valuation.salePrice;
  }
  return balance + fleetValue;
}

/**
 * Calculate total fleet value for a player.
 */
function calculateFleetValue(player: PlayerState, week: number, year: number): number {
  let total = 0;
  for (const ship of player.ships) {
    const valuation = calculateShipValue(ship, week, year);
    total += valuation.salePrice;
  }
  return total;
}

/**
 * Build sorted leaderboard entries from player list.
 */
function buildLeaderboardEntries(data: LeaderboardData): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = data.players.map((player) => {
    const balance = getPlayerBalance(player);
    const fleetValue = calculateFleetValue(player, data.currentWeek, data.currentYear);
    return {
      rank: 0,
      playerName: player.name,
      companyName: player.companyName,
      balance,
      fleetValue,
      netWorth: balance + fleetValue,
      shipCount: player.ships.length,
      voyages: player.statistics.totalVoyages,
    };
  });

  // Sort by net worth descending
  entries.sort((a, b) => b.netWorth - a.netWorth);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

/**
 * Format a dollar amount for display (compact with M suffix for millions).
 */
function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Render the multiplayer leaderboard ranking table.
 */
export function renderLeaderboard(data: LeaderboardData): HTMLElement {
  const container = document.createElement("div");
  container.className = "office-leaderboard";

  const title = document.createElement("h3");
  title.className = "heading-copper office-panel-title";
  title.textContent = "Leaderboard";
  container.appendChild(title);

  if (data.players.length <= 1) {
    const msg = document.createElement("p");
    msg.className = "office-empty-msg";
    msg.textContent = "Leaderboard is available in multiplayer games (2+ players).";
    container.appendChild(msg);
    return container;
  }

  const entries = buildLeaderboardEntries(data);

  const table = document.createElement("table");
  table.className = "office-leaderboard-table";

  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headers = ["Rank", "Company", "Captain", "Ships", "Voyages", "Fleet Value", "Balance", "Net Worth"];
  for (const h of headers) {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");
  for (const entry of entries) {
    const row = document.createElement("tr");
    if (entry.rank === 1) {
      row.classList.add("leaderboard-first");
    }

    const tdRank = document.createElement("td");
    tdRank.className = "leaderboard-rank";
    tdRank.textContent = `#${entry.rank}`;
    row.appendChild(tdRank);

    const tdCompany = document.createElement("td");
    tdCompany.className = "leaderboard-company";
    tdCompany.textContent = entry.companyName;
    row.appendChild(tdCompany);

    const tdCaptain = document.createElement("td");
    tdCaptain.textContent = entry.playerName;
    row.appendChild(tdCaptain);

    const tdShips = document.createElement("td");
    tdShips.className = "data-display";
    tdShips.textContent = entry.shipCount.toString();
    row.appendChild(tdShips);

    const tdVoyages = document.createElement("td");
    tdVoyages.className = "data-display";
    tdVoyages.textContent = entry.voyages.toString();
    row.appendChild(tdVoyages);

    const tdFleet = document.createElement("td");
    tdFleet.className = "data-display";
    tdFleet.textContent = formatMoney(entry.fleetValue);
    row.appendChild(tdFleet);

    const tdBalance = document.createElement("td");
    tdBalance.className = "data-display";
    tdBalance.textContent = formatMoney(entry.balance);
    row.appendChild(tdBalance);

    const tdNetWorth = document.createElement("td");
    tdNetWorth.className = "data-display leaderboard-net-worth";
    tdNetWorth.textContent = formatMoney(entry.netWorth);
    row.appendChild(tdNetWorth);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  return container;
}
