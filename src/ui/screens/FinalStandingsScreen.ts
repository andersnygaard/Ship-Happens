/**
 * FinalStandingsScreen — Displayed when the game ends (year limit reached or all players exited).
 * Shows ranked player standings with detailed stats and humorous ratings.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import {
  type FullGameState,
  type PlayerState,
  type ExitedPlayer,
  getPlayerBalance,
  calculatePlayerNetWorth,
} from "../../game/GameState";
import { getMagnateRating, getEndgameCommentary, pickRandom } from "../../data/humorTexts";
import { type PlayerStatistics } from "../../game/Statistics";
import { saveHighScore, getHighScores } from "../../game/HighScoreSystem";

/** Unified player entry for final standings display. */
interface StandingsEntry {
  rank: number;
  playerName: string;
  companyName: string;
  netWorth: number;
  statistics: PlayerStatistics;
  exitReason: "active" | "retired" | "bankrupt";
  exitWeek?: number;
  exitYear?: number;
}

export class FinalStandingsScreen implements GameScreen {
  private container: HTMLElement;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen finalstandings-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state available.";
      return this.container;
    }

    const entries = this.buildStandingsEntries(state);

    // Save high scores for single-player
    if (state.players.length === 1 && entries.length > 0) {
      saveHighScore({
        playerName: entries[0].playerName,
        companyName: entries[0].companyName,
        netWorth: entries[0].netWorth,
        rating: getMagnateRating(entries[0].netWorth),
        year: state.time.year,
        week: state.time.week,
        date: new Date().toISOString(),
        gameDurationYears: state.gameDurationYears,
        voyages: entries[0].statistics.totalVoyages,
        portsVisited: entries[0].statistics.portsVisited.length,
      });
    }

    // Main panel
    const panel = document.createElement("div");
    panel.className = "panel panel-riveted finalstandings-panel";
    panel.style.maxWidth = "900px";
    panel.style.margin = "0 auto";
    panel.style.padding = "24px";
    panel.style.maxHeight = "90vh";
    panel.style.overflowY = "auto";

    // Title
    const title = document.createElement("h1");
    title.className = "heading-display";
    title.textContent = "Final Standings";
    title.style.textAlign = "center";
    title.style.marginBottom = "8px";
    panel.appendChild(title);

    // Subtitle with game duration
    const subtitle = document.createElement("p");
    subtitle.style.textAlign = "center";
    subtitle.style.opacity = "0.8";
    subtitle.style.marginBottom = "24px";
    subtitle.textContent = `Game ended: Week ${state.time.week}, Year ${state.time.year}`;
    panel.appendChild(subtitle);

    // Winner commentary (if multiplayer)
    if (entries.length > 1 && entries[0].exitReason !== "bankrupt") {
      const commentary = document.createElement("p");
      commentary.style.textAlign = "center";
      commentary.style.fontStyle = "italic";
      commentary.style.color = "#e8a44a";
      commentary.style.marginBottom = "24px";
      commentary.textContent = getEndgameCommentary("winner");
      panel.appendChild(commentary);
    }

    // Player entries
    for (const entry of entries) {
      panel.appendChild(this.buildEntryCard(entry, entries.length > 1));
    }

    // Superlatives section (fun stats)
    if (entries.length > 1) {
      panel.appendChild(this.buildSuperlatives(entries));
    }

    // High scores (single-player)
    if (state.players.length === 1) {
      panel.appendChild(this.buildHighScoresSection());
    }

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.justifyContent = "center";
    btnRow.style.gap = "16px";
    btnRow.style.marginTop = "24px";

    const playAgainBtn = document.createElement("button");
    playAgainBtn.className = "btn btn-primary btn-large";
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.addEventListener("click", () => {
      this.screenManager.setGameState(null as never);
      this.screenManager.showScreen("setup");
    });
    btnRow.appendChild(playAgainBtn);

    panel.appendChild(btnRow);
    this.container.appendChild(panel);

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  /** Build sorted standings entries from the game state. */
  private buildStandingsEntries(state: FullGameState): StandingsEntry[] {
    const entries: StandingsEntry[] = [];

    // Add active players (not exited)
    for (let i = 0; i < state.players.length; i++) {
      const exited = (state.exitedPlayers || []).find((e) => e.playerIndex === i);
      if (exited) {
        entries.push({
          rank: 0,
          playerName: exited.playerName,
          companyName: exited.companyName,
          netWorth: exited.finalNetWorth,
          statistics: exited.statistics,
          exitReason: exited.reason,
          exitWeek: exited.exitWeek,
          exitYear: exited.exitYear,
        });
      } else {
        const player = state.players[i];
        const netWorth = calculatePlayerNetWorth(player, state.time.week, state.time.year);
        entries.push({
          rank: 0,
          playerName: player.name,
          companyName: player.companyName,
          netWorth: Math.max(0, netWorth),
          statistics: player.statistics,
          exitReason: "active",
        });
      }
    }

    // Sort by net worth descending
    entries.sort((a, b) => b.netWorth - a.netWorth);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /** Build a card for a single player entry. */
  private buildEntryCard(entry: StandingsEntry, isMultiplayer: boolean): HTMLElement {
    const card = document.createElement("div");
    card.className = "panel";
    card.style.marginBottom = "16px";
    card.style.padding = "16px";
    card.style.borderLeft = entry.rank === 1 ? "4px solid #e8a44a" : "4px solid #555";

    // Header: rank + name + rating
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "12px";

    const nameArea = document.createElement("div");

    const rankLabel = document.createElement("span");
    rankLabel.style.fontSize = "1.4em";
    rankLabel.style.fontWeight = "bold";
    rankLabel.style.marginRight = "12px";
    rankLabel.style.color = entry.rank === 1 ? "#e8a44a" : "#aaa";
    rankLabel.textContent = `#${entry.rank}`;
    nameArea.appendChild(rankLabel);

    const nameLabel = document.createElement("span");
    nameLabel.style.fontSize = "1.2em";
    nameLabel.style.fontWeight = "bold";
    nameLabel.textContent = `${entry.playerName} — ${entry.companyName}`;
    nameArea.appendChild(nameLabel);

    // Exit status badge
    if (entry.exitReason === "bankrupt") {
      const badge = document.createElement("span");
      badge.style.marginLeft = "8px";
      badge.style.fontSize = "0.8em";
      badge.style.color = "#ff6666";
      badge.textContent = `(Bankrupt: Wk ${entry.exitWeek}, Yr ${entry.exitYear})`;
      nameArea.appendChild(badge);
    } else if (entry.exitReason === "retired") {
      const badge = document.createElement("span");
      badge.style.marginLeft = "8px";
      badge.style.fontSize = "0.8em";
      badge.style.color = "#88bbff";
      badge.textContent = `(Retired: Wk ${entry.exitWeek}, Yr ${entry.exitYear})`;
      nameArea.appendChild(badge);
    }

    header.appendChild(nameArea);

    // Rating title
    const rating = document.createElement("div");
    rating.style.color = "#e8a44a";
    rating.style.fontStyle = "italic";
    rating.style.fontSize = "0.95em";
    rating.textContent = getMagnateRating(entry.netWorth);
    header.appendChild(rating);

    card.appendChild(header);

    // Net worth
    const netWorthEl = document.createElement("div");
    netWorthEl.style.fontSize = "1.3em";
    netWorthEl.style.fontWeight = "bold";
    netWorthEl.style.marginBottom = "12px";
    netWorthEl.style.color = entry.netWorth > 0 ? "#88ff88" : "#ff6666";
    netWorthEl.textContent = `Net Worth: $${entry.netWorth.toLocaleString()}`;
    card.appendChild(netWorthEl);

    // Stats grid
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(150px, 1fr))";
    grid.style.gap = "8px";
    grid.style.fontSize = "0.9em";

    const stats = entry.statistics;
    const statItems = [
      { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}` },
      { label: "Total Expenses", value: `$${stats.totalExpenses.toLocaleString()}` },
      { label: "Net Profit", value: `$${(stats.totalRevenue - stats.totalExpenses).toLocaleString()}` },
      { label: "Voyages", value: String(stats.totalVoyages) },
      { label: "Ports Visited", value: String(stats.portsVisited.length) },
      { label: "Distance Sailed", value: `${stats.distanceSailed.toLocaleString()} nm` },
      { label: "Charters Completed", value: String(stats.chartersCompleted) },
      { label: "Ships Owned", value: String(stats.shipsOwned) },
    ];

    for (const item of statItems) {
      const statEl = document.createElement("div");
      statEl.innerHTML = `<span style="opacity:0.7">${item.label}:</span> <strong>${item.value}</strong>`;
      grid.appendChild(statEl);
    }

    card.appendChild(grid);

    // Commentary based on exit reason
    const commentary = document.createElement("p");
    commentary.style.fontStyle = "italic";
    commentary.style.opacity = "0.8";
    commentary.style.marginTop = "12px";
    commentary.style.marginBottom = "0";
    if (entry.exitReason === "bankrupt") {
      commentary.textContent = getEndgameCommentary("bankrupt");
    } else if (entry.exitReason === "retired") {
      commentary.textContent = getEndgameCommentary("retired");
    } else if (entry.rank === 1 && isMultiplayer) {
      commentary.textContent = getEndgameCommentary("winner");
    } else if (entry.rank > 1 && isMultiplayer) {
      commentary.textContent = getEndgameCommentary("loser");
    }
    if (commentary.textContent) {
      card.appendChild(commentary);
    }

    return card;
  }

  /** Build a superlatives section with fun awards. */
  private buildSuperlatives(entries: StandingsEntry[]): HTMLElement {
    const section = document.createElement("div");
    section.className = "panel";
    section.style.marginTop = "16px";
    section.style.padding = "16px";

    const title = document.createElement("h3");
    title.className = "heading-copper";
    title.textContent = "Awards & Superlatives";
    title.style.marginBottom = "12px";
    section.appendChild(title);

    const awards: { label: string; winner: string; value: string; commentaryKey: string }[] = [];

    // Most voyages
    const mostVoyages = [...entries].sort((a, b) => b.statistics.totalVoyages - a.statistics.totalVoyages)[0];
    if (mostVoyages.statistics.totalVoyages > 0) {
      awards.push({
        label: "Most Voyages",
        winner: mostVoyages.playerName,
        value: `${mostVoyages.statistics.totalVoyages} voyages`,
        commentaryKey: "mostVoyages",
      });
    }

    // Most ports visited
    const mostPorts = [...entries].sort((a, b) => b.statistics.portsVisited.length - a.statistics.portsVisited.length)[0];
    if (mostPorts.statistics.portsVisited.length > 0) {
      awards.push({
        label: "Globe Trotter",
        winner: mostPorts.playerName,
        value: `${mostPorts.statistics.portsVisited.length} ports`,
        commentaryKey: "mostPorts",
      });
    }

    // Most distance
    const mostDist = [...entries].sort((a, b) => b.statistics.distanceSailed - a.statistics.distanceSailed)[0];
    if (mostDist.statistics.distanceSailed > 0) {
      awards.push({
        label: "Distance Champion",
        winner: mostDist.playerName,
        value: `${mostDist.statistics.distanceSailed.toLocaleString()} nm`,
        commentaryKey: "mostDistance",
      });
    }

    for (const award of awards) {
      const row = document.createElement("div");
      row.style.marginBottom = "8px";
      row.innerHTML = `
        <strong style="color: #e8a44a;">${award.label}:</strong> ${award.winner} (${award.value})
        <br/><span style="font-style: italic; opacity: 0.7;">${getEndgameCommentary(award.commentaryKey)}</span>
      `;
      section.appendChild(row);
    }

    return section;
  }

  /** Build the high scores section for single-player. */
  private buildHighScoresSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "panel";
    section.style.marginTop = "16px";
    section.style.padding = "16px";

    const title = document.createElement("h3");
    title.className = "heading-copper";
    title.textContent = "Personal Best (High Scores)";
    title.style.marginBottom = "12px";
    section.appendChild(title);

    const scores = getHighScores();

    if (scores.length === 0) {
      const msg = document.createElement("p");
      msg.style.opacity = "0.7";
      msg.textContent = "No high scores recorded yet.";
      section.appendChild(msg);
    } else {
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "0.9em";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr style="border-bottom: 1px solid #555; text-align: left;">
          <th style="padding: 4px 8px;">#</th>
          <th style="padding: 4px 8px;">Captain</th>
          <th style="padding: 4px 8px;">Net Worth</th>
          <th style="padding: 4px 8px;">Rating</th>
          <th style="padding: 4px 8px;">Duration</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      for (let i = 0; i < Math.min(scores.length, 10); i++) {
        const s = scores[i];
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid #333";
        const durText = s.gameDurationYears != null ? `${s.gameDurationYears} yrs` : "Unlimited";
        row.innerHTML = `
          <td style="padding: 4px 8px;">${i + 1}</td>
          <td style="padding: 4px 8px;">${s.playerName}</td>
          <td style="padding: 4px 8px; color: #88ff88;">$${s.netWorth.toLocaleString()}</td>
          <td style="padding: 4px 8px; color: #e8a44a;">${s.rating}</td>
          <td style="padding: 4px 8px;">${durText}</td>
        `;
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      section.appendChild(table);
    }

    return section;
  }
}
