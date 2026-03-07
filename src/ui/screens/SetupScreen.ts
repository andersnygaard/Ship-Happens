/**
 * SetupScreen — New game setup form.
 * Allows the player to enter their name, company name, and select a home port.
 * On completion, creates a GameState and transitions to the world map.
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { PORTS } from "../../data/ports";
import { createNewGame, type FullGameState } from "../../game/GameState";

export class SetupScreen implements GameScreen {
  private container: HTMLElement;
  private selectedPortId: string | null = null;
  private playerNameInput!: HTMLInputElement;
  private companyNameInput!: HTMLInputElement;
  private validationMsg!: HTMLElement;
  private startBtn!: HTMLButtonElement;

  constructor(
    private screenManager: ScreenManager,
    private onGameCreated: (state: FullGameState) => void,
  ) {
    this.container = document.createElement("div");
    this.container.className = "screen setup-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";
    this.selectedPortId = null;

    const wrapper = document.createElement("div");
    wrapper.className = "setup-container";

    // Title area
    wrapper.appendChild(this.buildTitleArea());

    // Form panel
    const formPanel = document.createElement("div");
    formPanel.className = "panel panel-riveted form-section";
    formPanel.appendChild(this.buildFormInputs());
    formPanel.appendChild(this.buildPortSection());
    wrapper.appendChild(formPanel);

    // Start button area
    wrapper.appendChild(this.buildStartArea());

    this.container.appendChild(wrapper);
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

  private buildFormInputs(): HTMLElement {
    const row = document.createElement("div");
    row.className = "form-row";

    // Player name
    const playerGroup = document.createElement("div");
    playerGroup.className = "form-group";

    const playerLabel = document.createElement("label");
    playerLabel.className = "input-label";
    playerLabel.textContent = "Shipowner Name";

    this.playerNameInput = document.createElement("input");
    this.playerNameInput.className = "input";
    this.playerNameInput.type = "text";
    this.playerNameInput.placeholder = "Captain Ahab";
    this.playerNameInput.maxLength = 30;
    this.playerNameInput.addEventListener("input", () => this.validateForm());

    playerGroup.appendChild(playerLabel);
    playerGroup.appendChild(this.playerNameInput);
    row.appendChild(playerGroup);

    // Company name
    const companyGroup = document.createElement("div");
    companyGroup.className = "form-group";

    const companyLabel = document.createElement("label");
    companyLabel.className = "input-label";
    companyLabel.textContent = "Company Name";

    this.companyNameInput = document.createElement("input");
    this.companyNameInput.className = "input";
    this.companyNameInput.type = "text";
    this.companyNameInput.placeholder = "Acme Shipping Co.";
    this.companyNameInput.maxLength = 30;
    this.companyNameInput.addEventListener("input", () => this.validateForm());

    companyGroup.appendChild(companyLabel);
    companyGroup.appendChild(this.companyNameInput);
    row.appendChild(companyGroup);

    return row;
  }

  private buildPortSection(): HTMLElement {
    const section = document.createElement("div");
    section.className = "port-section";

    const title = document.createElement("h3");
    title.className = "port-section-title";
    title.textContent = "Choose Your Home Port";
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "port-grid";

    for (const port of PORTS) {
      const item = document.createElement("div");
      item.className = "port-item";
      item.dataset.portId = port.id;

      const name = document.createElement("span");
      name.className = "port-name";
      name.textContent = port.name;

      const country = document.createElement("span");
      country.className = "port-country";
      country.textContent = port.country;

      item.appendChild(name);
      item.appendChild(country);

      item.addEventListener("click", () => this.selectPort(port.id, grid));

      grid.appendChild(item);
    }

    section.appendChild(grid);
    return section;
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

  // ── Interactions ──────────────────────────────────────────────────────

  private selectPort(portId: string, grid: HTMLElement): void {
    // Deselect previous
    const prev = grid.querySelector(".port-item.selected");
    if (prev) prev.classList.remove("selected");

    // Select new
    const item = grid.querySelector(`[data-port-id="${portId}"]`);
    if (item) item.classList.add("selected");

    this.selectedPortId = portId;
    this.validateForm();
  }

  private validateForm(): boolean {
    const playerName = this.playerNameInput.value.trim();
    const companyName = this.companyNameInput.value.trim();
    const errors: string[] = [];

    if (!playerName) errors.push("Enter your name");
    if (!companyName) errors.push("Enter a company name");
    if (!this.selectedPortId) errors.push("Select a home port");

    const isValid = errors.length === 0;
    this.startBtn.disabled = !isValid;
    this.validationMsg.textContent = isValid ? "" : errors.join(" \u2022 ");

    return isValid;
  }

  private handleStart(): void {
    if (!this.validateForm()) return;

    const playerName = this.playerNameInput.value.trim();
    const companyName = this.companyNameInput.value.trim();

    const gameState = createNewGame({
      players: [
        {
          name: playerName,
          companyName: companyName,
          homePortId: this.selectedPortId!,
        },
      ],
    });

    this.screenManager.setGameState(gameState);
    this.onGameCreated(gameState);
    this.screenManager.showScreen("worldmap");
  }
}
