/**
 * ManeuveringScreen — Port maneuvering minigame.
 * Top-down bird's-eye view harbor navigation using HTML Canvas.
 * Player steers their ship to the docking berth before time runs out.
 *
 * Controls:
 * - Arrow keys / WASD: Left/Right rotate ship, Up/Down throttle
 * - Mouse click: sets target heading, ship auto-rotates toward it
 */

import type { GameScreen, ScreenManager } from "../ScreenManager";
import { getActivePlayer } from "../../game/GameState";
import type { PortOperationsScreen } from "./PortOperationsScreen";
import { getLayoutForPort } from "../../data/harborLayouts";
import type { HarborLayout } from "../../data/harborLayouts";
import {
  createShipState,
  updateShipPhysics,
  throttleUp,
  throttleDown,
  setTurnDirection,
  checkDocking,
  isConditionFailed,
  angleToPoint,
  getSteeringDirection,
  SHIP_RADIUS,
  THROTTLE_LEVELS,
} from "../../game/HarborPhysics";
import type { ShipPhysicsState } from "../../game/HarborPhysics";

// ─── Constants ──────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TIMEOUT_DAMAGE = 10;

// Colors
const COLOR_WATER = "#0a1e3d";
const COLOR_LAND = "#2d5a3d";
const COLOR_WALL = "#cc3333";
const COLOR_BERTH_FILL = "rgba(0, 200, 80, 0.25)";
const COLOR_BERTH_STROKE = "#00cc55";
const COLOR_SHIP = "#e8e8e8";
const COLOR_SHIP_ACCENT = "#d4a844";
const COLOR_TIMER_BG = "#1a1a2e";
const COLOR_TIMER_FILL_GOOD = "#00cc55";
const COLOR_TIMER_FILL_WARN = "#ccaa00";
const COLOR_TIMER_FILL_DANGER = "#cc3333";

export class ManeuveringScreen implements GameScreen {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /** Ship index that arrived. Set externally before showing. */
  public shipIndex: number = 0;

  // Game state
  private layout: HarborLayout | null = null;
  private ship: ShipPhysicsState | null = null;
  private timeRemaining: number = 0;
  private gameOver: boolean = false;
  private gameResult: "success" | "timeout" | "condition-fail" | null = null;
  private animFrameId: number = 0;
  private lastTimestamp: number = 0;
  private initialCondition: number = 100;

  // Input state
  private keysDown: Set<string> = new Set();
  private mouseTarget: { x: number; y: number } | null = null;

  // Bound event handlers (for cleanup)
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private boundMouseClick: ((e: MouseEvent) => void) | null = null;

  constructor(private screenManager: ScreenManager) {
    this.container = document.createElement("div");
    this.container.className = "screen maneuvering-screen";
  }

  show(): HTMLElement {
    this.container.innerHTML = "";
    this.gameOver = false;
    this.gameResult = null;
    this.keysDown.clear();
    this.mouseTarget = null;

    const state = this.screenManager.getGameState();
    if (!state) {
      this.container.textContent = "No game state.";
      return this.container;
    }

    const player = getActivePlayer(state);
    const ship = player.ships[this.shipIndex];
    if (!ship || !ship.currentPortId) {
      this.container.textContent = "No ship in port.";
      return this.container;
    }

    // Pick layout based on port
    this.layout = getLayoutForPort(ship.currentPortId);
    this.initialCondition = ship.conditionPercent;
    this.ship = createShipState(this.layout, ship.conditionPercent);
    this.timeRemaining = this.layout.timeLimit;

    // Build UI
    this.buildUI();

    // Start game loop
    this.lastTimestamp = 0;
    this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));

    // Attach input handlers
    this.attachInputHandlers();

    return this.container;
  }

  hide(): void {
    // Stop game loop
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }

    // Remove input handlers
    this.detachInputHandlers();

    this.container.innerHTML = "";
  }

  // ─── UI Building ────────────────────────────────────────────────────────

  private buildUI(): void {
    // Header with timer and info
    const header = document.createElement("div");
    header.className = "maneuvering-header";

    const titleEl = document.createElement("div");
    titleEl.className = "maneuvering-title";
    titleEl.textContent = `Harbor: ${this.layout!.name} (${this.layout!.difficulty})`;
    header.appendChild(titleEl);

    const timerContainer = document.createElement("div");
    timerContainer.className = "maneuvering-timer-container";

    const timerBar = document.createElement("div");
    timerBar.className = "maneuvering-timer-bar";
    timerBar.id = "maneuvering-timer-bar";
    timerContainer.appendChild(timerBar);

    const timerLabel = document.createElement("div");
    timerLabel.className = "maneuvering-timer-label";
    timerLabel.id = "maneuvering-timer-label";
    timerLabel.textContent = `${this.timeRemaining}s`;
    timerContainer.appendChild(timerLabel);

    header.appendChild(timerContainer);

    const conditionEl = document.createElement("div");
    conditionEl.className = "maneuvering-condition";
    conditionEl.id = "maneuvering-condition";
    conditionEl.textContent = `Condition: ${Math.round(this.ship!.conditionPercent)}%`;
    header.appendChild(conditionEl);

    this.container.appendChild(header);

    // Canvas
    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "maneuvering-canvas-wrapper";

    this.canvas = document.createElement("canvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.className = "maneuvering-canvas";
    this.ctx = this.canvas.getContext("2d");

    canvasWrapper.appendChild(this.canvas);
    this.container.appendChild(canvasWrapper);

    // Controls hint
    const controls = document.createElement("div");
    controls.className = "maneuvering-controls-hint";
    controls.innerHTML =
      "<strong>Controls:</strong> Arrow keys / WASD to steer &amp; throttle &bull; Click to set heading";
    this.container.appendChild(controls);
  }

  // ─── Input Handling ─────────────────────────────────────────────────────

  private attachInputHandlers(): void {
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (this.gameOver) return;
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
        this.keysDown.add(key);
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      this.keysDown.delete(key);
    };

    this.boundMouseClick = (e: MouseEvent) => {
      if (this.gameOver || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this.mouseTarget = { x, y };
    };

    document.addEventListener("keydown", this.boundKeyDown);
    document.addEventListener("keyup", this.boundKeyUp);
    this.canvas?.addEventListener("click", this.boundMouseClick);
  }

  private detachInputHandlers(): void {
    if (this.boundKeyDown) {
      document.removeEventListener("keydown", this.boundKeyDown);
    }
    if (this.boundKeyUp) {
      document.removeEventListener("keyup", this.boundKeyUp);
    }
    if (this.boundMouseClick && this.canvas) {
      this.canvas.removeEventListener("click", this.boundMouseClick);
    }
    this.boundKeyDown = null;
    this.boundKeyUp = null;
    this.boundMouseClick = null;
  }

  private processInput(): void {
    if (!this.ship) return;

    // Keyboard throttle
    if (this.keysDown.has("arrowup") || this.keysDown.has("w")) {
      throttleUp(this.ship);
    }
    if (this.keysDown.has("arrowdown") || this.keysDown.has("s")) {
      throttleDown(this.ship);
    }

    // Keyboard turning
    let turnDir = 0;
    if (this.keysDown.has("arrowleft") || this.keysDown.has("a")) {
      turnDir -= 1;
    }
    if (this.keysDown.has("arrowright") || this.keysDown.has("d")) {
      turnDir += 1;
    }

    // Mouse target steering (overrides keyboard turning if active)
    if (this.mouseTarget && turnDir === 0) {
      const targetAngle = angleToPoint(this.ship.x, this.ship.y, this.mouseTarget.x, this.mouseTarget.y);
      turnDir = getSteeringDirection(this.ship.heading, targetAngle);

      // Clear mouse target when close enough to the heading
      if (turnDir === 0) {
        this.mouseTarget = null;
      }
    }

    setTurnDirection(this.ship, turnDir);
  }

  // ─── Game Loop ──────────────────────────────────────────────────────────

  private gameLoop(timestamp: number): void {
    if (this.gameOver) return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05); // Cap dt
    this.lastTimestamp = timestamp;

    // Process input
    this.processInput();

    // Update physics
    if (this.ship && this.layout) {
      const collided = updateShipPhysics(this.ship, dt, this.layout);

      // Update timer
      this.timeRemaining -= dt;

      // Check win/lose conditions
      if (checkDocking(this.ship, this.layout.berth)) {
        this.endGame("success");
        return;
      }

      if (isConditionFailed(this.ship)) {
        this.endGame("condition-fail");
        return;
      }

      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.endGame("timeout");
        return;
      }

      // Update UI elements
      this.updateHUD();
    }

    // Render
    this.render();

    // Next frame
    this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  private updateHUD(): void {
    if (!this.ship || !this.layout) return;

    // Timer bar
    const timerBar = document.getElementById("maneuvering-timer-bar");
    if (timerBar) {
      const pct = (this.timeRemaining / this.layout.timeLimit) * 100;
      timerBar.style.width = `${pct}%`;

      if (pct > 50) {
        timerBar.style.background = COLOR_TIMER_FILL_GOOD;
      } else if (pct > 25) {
        timerBar.style.background = COLOR_TIMER_FILL_WARN;
      } else {
        timerBar.style.background = COLOR_TIMER_FILL_DANGER;
      }
    }

    // Timer label
    const timerLabel = document.getElementById("maneuvering-timer-label");
    if (timerLabel) {
      timerLabel.textContent = `${Math.ceil(this.timeRemaining)}s`;
    }

    // Condition
    const conditionEl = document.getElementById("maneuvering-condition");
    if (conditionEl) {
      const cond = Math.round(this.ship.conditionPercent);
      conditionEl.textContent = `Condition: ${cond}%`;
      if (cond > 50) {
        conditionEl.style.color = COLOR_TIMER_FILL_GOOD;
      } else if (cond > 25) {
        conditionEl.style.color = COLOR_TIMER_FILL_WARN;
      } else {
        conditionEl.style.color = COLOR_TIMER_FILL_DANGER;
      }
    }
  }

  // ─── Rendering ──────────────────────────────────────────────────────────

  private render(): void {
    const ctx = this.ctx;
    if (!ctx || !this.layout || !this.ship) return;

    // Clear canvas
    ctx.fillStyle = COLOR_WATER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw land masses
    ctx.fillStyle = COLOR_LAND;
    for (const land of this.layout.lands) {
      ctx.beginPath();
      ctx.moveTo(land.points[0].x, land.points[0].y);
      for (let i = 1; i < land.points.length; i++) {
        ctx.lineTo(land.points[i].x, land.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw walls
    ctx.strokeStyle = COLOR_WALL;
    ctx.lineWidth = 2;
    for (const wall of this.layout.walls) {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }

    // Draw docking berth
    const berth = this.layout.berth;
    ctx.fillStyle = COLOR_BERTH_FILL;
    ctx.fillRect(berth.x, berth.y, berth.width, berth.height);
    ctx.strokeStyle = COLOR_BERTH_STROKE;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(berth.x, berth.y, berth.width, berth.height);
    ctx.setLineDash([]);

    // Draw "DOCK" label
    ctx.fillStyle = COLOR_BERTH_STROKE;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DOCK", berth.x + berth.width / 2, berth.y + berth.height / 2);

    // Draw mouse target indicator
    if (this.mouseTarget) {
      ctx.strokeStyle = "rgba(212, 168, 68, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.mouseTarget.x, this.mouseTarget.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.mouseTarget.x - 4, this.mouseTarget.y);
      ctx.lineTo(this.mouseTarget.x + 4, this.mouseTarget.y);
      ctx.moveTo(this.mouseTarget.x, this.mouseTarget.y - 4);
      ctx.lineTo(this.mouseTarget.x, this.mouseTarget.y + 4);
      ctx.stroke();
    }

    // Draw ship
    this.drawShip(ctx, this.ship);

    // Draw throttle indicator
    this.drawThrottleIndicator(ctx, this.ship);
  }

  private drawShip(ctx: CanvasRenderingContext2D, ship: ShipPhysicsState): void {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.heading);

    // Ship body (triangle/arrow shape)
    const size = SHIP_RADIUS;
    ctx.beginPath();
    ctx.moveTo(size * 1.3, 0); // bow (front)
    ctx.lineTo(-size, -size * 0.7); // port stern
    ctx.lineTo(-size * 0.6, 0); // stern center indent
    ctx.lineTo(-size, size * 0.7); // starboard stern
    ctx.closePath();

    ctx.fillStyle = COLOR_SHIP;
    ctx.fill();
    ctx.strokeStyle = COLOR_SHIP_ACCENT;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bridge dot
    ctx.fillStyle = COLOR_SHIP_ACCENT;
    ctx.beginPath();
    ctx.arc(-size * 0.2, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawThrottleIndicator(ctx: CanvasRenderingContext2D, ship: ShipPhysicsState): void {
    const x = 20;
    const y = CANVAS_HEIGHT - 80;
    const width = 16;
    const height = 60;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

    // Throttle segments
    const levels = THROTTLE_LEVELS.length;
    const segHeight = height / levels;
    for (let i = 0; i < levels; i++) {
      const segY = y + height - (i + 1) * segHeight;
      if (i <= ship.throttleIndex) {
        ctx.fillStyle = i === 0 ? "#555" : i === 1 ? COLOR_TIMER_FILL_WARN : COLOR_TIMER_FILL_GOOD;
      } else {
        ctx.fillStyle = "#222";
      }
      ctx.fillRect(x, segY + 1, width, segHeight - 2);
    }

    // Label
    ctx.fillStyle = "#aaa";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("THR", x + width / 2, y + height + 14);
  }

  // ─── End Game ───────────────────────────────────────────────────────────

  private endGame(result: "success" | "timeout" | "condition-fail"): void {
    this.gameOver = true;
    this.gameResult = result;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }

    // Apply results to game state
    const state = this.screenManager.getGameState();
    if (state && this.ship) {
      const player = getActivePlayer(state);
      const ownedShip = player.ships[this.shipIndex];
      if (ownedShip) {
        if (result === "timeout") {
          // Time ran out: take 10% damage, still dock
          ownedShip.conditionPercent = Math.max(0, this.ship.conditionPercent - TIMEOUT_DAMAGE);
        } else if (result === "condition-fail") {
          // Heavy damage from condition failure
          ownedShip.conditionPercent = Math.max(0, this.ship.conditionPercent);
        } else {
          // Success: apply any collision damage that occurred
          ownedShip.conditionPercent = this.ship.conditionPercent;
        }
      }
    }

    // Render final frame
    this.render();

    // Show result overlay
    this.showResultOverlay(result);
  }

  private showResultOverlay(result: "success" | "timeout" | "condition-fail"): void {
    const overlay = document.createElement("div");
    overlay.className = "maneuvering-result-overlay";

    const panel = document.createElement("div");
    panel.className = "maneuvering-result-panel panel panel-riveted";

    const title = document.createElement("h2");
    title.className = "maneuvering-result-title heading-copper";

    const message = document.createElement("p");
    message.className = "maneuvering-result-message";

    const damageDealt = Math.round(this.initialCondition - (this.ship?.conditionPercent ?? 0));

    if (result === "success") {
      title.textContent = "Docking Successful!";
      message.textContent = damageDealt > 0
        ? `Ship docked safely. Minor collision damage: ${damageDealt}% condition lost.`
        : "Ship docked without incident. Well done, Captain!";
    } else if (result === "timeout") {
      title.textContent = "Time Expired";
      message.textContent = `Time ran out. The ship was towed in, suffering ${TIMEOUT_DAMAGE}% additional damage. Total damage: ${damageDealt + TIMEOUT_DAMAGE}%.`;
    } else {
      title.textContent = "Critical Damage!";
      message.textContent = "Ship sustained too much damage during maneuvering. Emergency tug dispatched.";
    }

    panel.appendChild(title);
    panel.appendChild(message);

    // Condition summary
    const condSummary = document.createElement("div");
    condSummary.className = "maneuvering-result-condition";
    const finalCond = result === "timeout"
      ? Math.max(0, (this.ship?.conditionPercent ?? 0) - TIMEOUT_DAMAGE)
      : (this.ship?.conditionPercent ?? 0);
    condSummary.textContent = `Ship Condition: ${Math.round(this.initialCondition)}% → ${Math.round(finalCond)}%`;
    panel.appendChild(condSummary);

    // Continue button
    const btn = document.createElement("button");
    btn.className = "btn btn-primary maneuvering-result-btn";
    btn.textContent = "Continue to Port";
    btn.addEventListener("click", () => {
      this.goToPortOperations();
    });
    panel.appendChild(btn);

    overlay.appendChild(panel);
    this.container.appendChild(overlay);
  }

  private goToPortOperations(): void {
    const portOps = this.screenManager.getScreen("port-operations") as PortOperationsScreen | undefined;
    if (portOps) {
      portOps.activeShipIndex = this.shipIndex;
    }
    this.screenManager.showScreen("port-operations");
  }
}
