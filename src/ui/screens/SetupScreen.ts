/**
 * SetupScreen — New game setup form.
 * Allows 1-7 players, each with name, company name, and home port selection.
 * On completion, creates a GameState and transitions to the world map.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { PORTS } from "../../data/ports";
import { MAX_PLAYERS } from "../../data/constants";
import { createNewGame, type FullGameState } from "../../game/GameState";
import { hasAutoSave, loadAutoSave } from "../../game/SaveSystem";
import { createSaveLoadDialog } from "../components/SaveLoadDialog";

/** Per-player setup data. */
interface PlayerEntry {
  name: string;
  companyName: string;
  homePortId: string | null;
}

/** Game duration presets. null means unlimited/sandbox. */
const DURATION_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "5 Years", value: 5 },
  { label: "10 Years", value: 10 },
  { label: "20 Years", value: 20 },
  { label: "Unlimited", value: null },
];

export class SetupScreen implements GameScreen {
  private container: HTMLElement;
  private players: PlayerEntry[] = [];
  private gameDurationYears: number | null = 10; // default: 10 years
  private validationMsg!: HTMLElement;
  private startBtn!: HTMLButtonElement;
  private addPlayerBtn!: HTMLButtonElement;
  private playerListEl!: HTMLElement;

  constructor(
    private screenManager: ScreenManager,
    private onGameCreated: (state: FullGameState) => void,
  ) {
    this.container = document.createElement("div");
    this.container.className = "screen setup-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";

    // Start with one player
    this.players = [{ name: "", companyName: "", homePortId: null }];

    const wrapper = document.createElement("div");
    wrapper.className = "setup-container";

    // Title area
    wrapper.appendChild(this.buildTitleArea());

    // Continue / Load buttons (if saves exist)
    wrapper.appendChild(this.buildSaveLoadArea());

    // Players panel
    const playersPanel = document.createElement("div");
    playersPanel.className = "panel panel-riveted form-section";

    const playersHeading = document.createElement("h3");
    playersHeading.className = "port-section-title";
    playersHeading.textContent = "Players";
    playersPanel.appendChild(playersHeading);

    // Player list container
    this.playerListEl = document.createElement("div");
    this.playerListEl.className = "player-list";
    playersPanel.appendChild(this.playerListEl);

    // Add Player button
    this.addPlayerBtn = document.createElement("button");
    this.addPlayerBtn.className = "btn btn-secondary add-player-btn";
    this.addPlayerBtn.textContent = "+ Add Player";
    this.addPlayerBtn.addEventListener("click", () => this.addPlayer());
    playersPanel.appendChild(this.addPlayerBtn);

    wrapper.appendChild(playersPanel);

    // Game duration panel
    wrapper.appendChild(this.buildDurationSelector());

    // Start button area
    wrapper.appendChild(this.buildStartArea());

    this.container.appendChild(wrapper);

    // Render initial player list
    this.renderPlayerList();

    return this.container;
  }

  hide(): void {
    this.container.remove();
  }

  // ── Private builders ──────────────────────────────────────────────────

  private buildTitleArea(): HTMLElement {
    const area = document.createElement("div");
    area.className = "title-area";

    const title = document.createElement("h1");
    title.className = "game-title";
    title.textContent = "Ship Happens";
    area.appendChild(title);

    const tagline = document.createElement("p");
    tagline.className = "tagline";
    tagline.textContent = "A modern shipping simulation — what could possibly go wrong?";
    area.appendChild(tagline);

    return area;
  }

  private buildStartArea(): HTMLElement {
    const area = document.createElement("div");
    area.className = "start-area";

    this.startBtn = document.createElement("button");
    this.startBtn.className = "btn btn-primary btn-large start-btn";
    this.startBtn.textContent = "Set Sail!";
    this.startBtn.disabled = true;
    this.startBtn.addEventListener("click", () => this.handleStart());

    this.validationMsg = document.createElement("div");
    this.validationMsg.className = "validation-msg";

    area.appendChild(this.startBtn);
    area.appendChild(this.validationMsg);

    return area;
  }

  private buildSaveLoadArea(): HTMLElement {
    const area = document.createElement("div");
    area.className = "setup-save-load-area";

    // Continue Game button (only if auto-save exists)
    if (hasAutoSave()) {
      const continueBtn = document.createElement("button");
      continueBtn.className = "btn btn-primary btn-large setup-continue-btn";
      continueBtn.textContent = "Continue Game";
      continueBtn.addEventListener("click", () => {
        const state = loadAutoSave();
        if (state) {
          this.screenManager.setGameState(state);
          this.onGameCreated(state);
          this.screenManager.showScreen("worldmap");
        }
      });
      area.appendChild(continueBtn);
    }

    // Load Game button
    const loadBtn = document.createElement("button");
    loadBtn.className = "btn btn-secondary btn-large setup-load-btn";
    loadBtn.textContent = "Load Game";
    loadBtn.addEventListener("click", () => {
      createSaveLoadDialog("load", null, {
        onLoad: (state) => {
          this.screenManager.setGameState(state);
          this.onGameCreated(state);
          this.screenManager.showScreen("worldmap");
        },
        onClose: () => {
          // No action needed on close
        },
      });
    });
    area.appendChild(loadBtn);

    return area;
  }

  private buildDurationSelector(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "panel panel-riveted form-section";

    const heading = document.createElement("h3");
    heading.className = "port-section-title";
    heading.textContent = "Game Duration";
    panel.appendChild(heading);

    const desc = document.createElement("p");
    desc.className = "form-description";
    desc.style.margin = "0 0 12px 0";
    desc.style.opacity = "0.8";
    desc.textContent = "How long should the game last? The game ends when the selected year is reached.";
    panel.appendChild(desc);

    const btnRow = document.createElement("div");
    btnRow.className = "duration-selector";
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.flexWrap = "wrap";

    for (const option of DURATION_OPTIONS) {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary duration-option";
      btn.textContent = option.label;
      if (this.gameDurationYears === option.value) {
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-secondary");
      }
      btn.addEventListener("click", () => {
        this.gameDurationYears = option.value;
        // Update button styles
        const allBtns = btnRow.querySelectorAll(".duration-option");
        allBtns.forEach((b) => {
          b.classList.remove("btn-primary");
          b.classList.add("btn-secondary");
        });
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-secondary");
      });
      btnRow.appendChild(btn);
    }

    panel.appendChild(btnRow);
    return panel;
  }

  // ── Player list management ──────────────────────────────────────────

  private addPlayer(): void {
    if (this.players.length >= MAX_PLAYERS) return;
    this.players.push({ name: "", companyName: "", homePortId: null });
    this.renderPlayerList();
    this.validateForm();
  }

  private removePlayer(index: number): void {
    if (this.players.length <= 1) return;
    this.players.splice(index, 1);
    this.renderPlayerList();
    this.validateForm();
  }

  private renderPlayerList(): void {
    this.playerListEl.innerHTML = "";

    for (let i = 0; i < this.players.length; i++) {
      const entry = this.buildPlayerEntry(i);
      this.playerListEl.appendChild(entry);
    }

    // Update Add Player button state
    this.addPlayerBtn.disabled = this.players.length >= MAX_PLAYERS;
    if (this.players.length >= MAX_PLAYERS) {
      this.addPlayerBtn.textContent = "Maximum players reached";
    } else {
      this.addPlayerBtn.textContent = `+ Add Player (${this.players.length}/${MAX_PLAYERS})`;
    }
  }

  private buildPlayerEntry(index: number): HTMLElement {
    const player = this.players[index];

    const entry = document.createElement("div");
    entry.className = "player-entry";

    // Header with player number and remove button
    const header = document.createElement("div");
    header.className = "player-entry-header";

    const label = document.createElement("span");
    label.className = "player-entry-label";
    label.textContent = `Player ${index + 1}`;
    header.appendChild(label);

    if (this.players.length > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger player-remove-btn";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => this.removePlayer(index));
      header.appendChild(removeBtn);
    }

    entry.appendChild(header);

    // Form row: name + company
    const formRow = document.createElement("div");
    formRow.className = "form-row";

    // Player name input
    const nameGroup = document.createElement("div");
    nameGroup.className = "form-group";

    const nameLabel = document.createElement("label");
    nameLabel.className = "input-label";
    nameLabel.textContent = "Shipowner Name";

    const nameInput = document.createElement("input");
    nameInput.className = "input";
    nameInput.type = "text";
    nameInput.placeholder = "Captain Ahab";
    nameInput.maxLength = 30;
    nameInput.value = player.name;
    nameInput.addEventListener("input", () => {
      this.players[index].name = nameInput.value.trim();
      this.validateForm();
    });

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    formRow.appendChild(nameGroup);

    // Company name input
    const companyGroup = document.createElement("div");
    companyGroup.className = "form-group";

    const companyLabel = document.createElement("label");
    companyLabel.className = "input-label";
    companyLabel.textContent = "Company Name";

    const companyInput = document.createElement("input");
    companyInput.className = "input";
    companyInput.type = "text";
    companyInput.placeholder = "Acme Shipping Co.";
    companyInput.maxLength = 30;
    companyInput.value = player.companyName;
    companyInput.addEventListener("input", () => {
      this.players[index].companyName = companyInput.value.trim();
      this.validateForm();
    });

    companyGroup.appendChild(companyLabel);
    companyGroup.appendChild(companyInput);
    formRow.appendChild(companyGroup);

    entry.appendChild(formRow);

    // Port selection
    const portSection = document.createElement("div");
    portSection.className = "port-section";

    const portTitle = document.createElement("h4");
    portTitle.className = "port-section-title";
    portTitle.textContent = "Home Port";
    portSection.appendChild(portTitle);

    const portGrid = document.createElement("div");
    portGrid.className = "port-grid";

    for (const port of PORTS) {
      const item = document.createElement("div");
      item.className = "port-item";
      if (player.homePortId === port.id) {
        item.classList.add("selected");
      }
      item.dataset.portId = port.id;

      const name = document.createElement("span");
      name.className = "port-name";
      name.textContent = port.name;

      const country = document.createElement("span");
      country.className = "port-country";
      country.textContent = port.country;

      item.appendChild(name);
      item.appendChild(country);

      item.addEventListener("click", () => {
        // Deselect previous in this grid
        const prev = portGrid.querySelector(".port-item.selected");
        if (prev) prev.classList.remove("selected");

        item.classList.add("selected");
        this.players[index].homePortId = port.id;
        this.validateForm();
      });

      portGrid.appendChild(item);
    }

    portSection.appendChild(portGrid);
    entry.appendChild(portSection);

    return entry;
  }

  // ── Validation ──────────────────────────────────────────────────────

  private validateForm(): boolean {
    const errors: string[] = [];

    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      if (!p.name) errors.push(`Player ${i + 1}: Enter a name`);
      if (!p.companyName) errors.push(`Player ${i + 1}: Enter a company name`);
      if (!p.homePortId) errors.push(`Player ${i + 1}: Select a home port`);
    }

    const isValid = errors.length === 0;
    this.startBtn.disabled = !isValid;
    this.validationMsg.textContent = isValid ? "" : errors.join(" \u2022 ");

    return isValid;
  }

  // ── Start game ──────────────────────────────────────────────────────

  private handleStart(): void {
    if (!this.validateForm()) return;

    const gameState = createNewGame({
      players: this.players.map((p) => ({
        name: p.name,
        companyName: p.companyName,
        homePortId: p.homePortId!,
      })),
      gameDurationYears: this.gameDurationYears,
    });

    this.screenManager.setGameState(gameState);
    this.onGameCreated(gameState);
    this.screenManager.showScreen("worldmap");
  }
}
