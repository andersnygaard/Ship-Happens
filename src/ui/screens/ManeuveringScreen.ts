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
import type { HarborLayout, EnvironmentTheme, ObstacleDecoration } from "../../data/harborLayouts";
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

// Colors — defaults (standard theme)
const COLOR_BERTH_FILL = "rgba(0, 200, 80, 0.25)";
const COLOR_BERTH_STROKE = "#00cc55";
const COLOR_SHIP = "#e8e8e8";
const COLOR_SHIP_ACCENT = "#d4a844";
const COLOR_TIMER_FILL_GOOD = "#00cc55";
const COLOR_TIMER_FILL_WARN = "#ccaa00";
const COLOR_TIMER_FILL_DANGER = "#cc3333";

/** Duration (in seconds) for collision damage flash effect. */
const DAMAGE_FLASH_DURATION = 0.25;

/** Theme-specific color palettes for harbor rendering. */
interface ThemeColors {
  water: string;
  land: string;
  wall: string;
  obstacleFill: string;
}

const THEME_COLORS: Record<EnvironmentTheme, ThemeColors> = {
  standard: {
    water: "#0a1e3d",
    land: "#2d5a3d",
    wall: "#cc3333",
    obstacleFill: "#2d5a3d",
  },
  tropical: {
    water: "#0e4d6e",
    land: "#1a7a3a",
    wall: "#cc5533",
    obstacleFill: "#228b22",
  },
  arctic: {
    water: "#1a3a5c",
    land: "#8fa8b8",
    wall: "#6688aa",
    obstacleFill: "#c8dce8",
  },
  industrial: {
    water: "#0a1a2a",
    land: "#4a4a3a",
    wall: "#aa4422",
    obstacleFill: "#5a5a4a",
  },
  mediterranean: {
    water: "#0c3866",
    land: "#6b8e5a",
    wall: "#b8860b",
    obstacleFill: "#8b7355",
  },
};

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

  // Visual effects state
  private waveTime: number = 0;
  private damageFlashTimer: number = 0;

  // Input state
  private keysDown: Set<string> = new Set();
  private mouseTarget: { x: number; y: number } | null = null;

  // Touch control state
  private touchSteerDir: number = 0;
  private touchThrottleDir: number = 0;

  // Bound event handlers (for cleanup)
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private boundMouseClick: ((e: MouseEvent) => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null;

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
    this.touchSteerDir = 0;
    this.touchThrottleDir = 0;
    this.waveTime = 0;
    this.damageFlashTimer = 0;

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
      "<strong>Controls:</strong> Arrow keys / WASD to steer &amp; throttle &bull; Click/Touch to set heading";
    this.container.appendChild(controls);

    // Touch controls (visible only on mobile via CSS)
    this.buildTouchControls();
  }

  private buildTouchControls(): void {
    const touchBar = document.createElement("div");
    touchBar.className = "maneuvering-touch-controls";

    // Steering buttons (left side)
    const steerGroup = document.createElement("div");
    steerGroup.className = "maneuvering-touch-steer";

    const leftBtn = document.createElement("button");
    leftBtn.className = "maneuvering-touch-btn";
    leftBtn.textContent = "\u25C0";
    leftBtn.setAttribute("aria-label", "Steer Left");
    this.addTouchHold(leftBtn, () => { this.touchSteerDir = -1; }, () => { this.touchSteerDir = 0; });
    steerGroup.appendChild(leftBtn);

    const rightBtn = document.createElement("button");
    rightBtn.className = "maneuvering-touch-btn";
    rightBtn.textContent = "\u25B6";
    rightBtn.setAttribute("aria-label", "Steer Right");
    this.addTouchHold(rightBtn, () => { this.touchSteerDir = 1; }, () => { this.touchSteerDir = 0; });
    steerGroup.appendChild(rightBtn);

    touchBar.appendChild(steerGroup);

    // Throttle buttons (right side)
    const throttleGroup = document.createElement("div");
    throttleGroup.className = "maneuvering-touch-throttle";

    const downBtn = document.createElement("button");
    downBtn.className = "maneuvering-touch-btn";
    downBtn.textContent = "\u25BC";
    downBtn.setAttribute("aria-label", "Throttle Down");
    this.addTouchHold(downBtn, () => { this.touchThrottleDir = -1; }, () => { this.touchThrottleDir = 0; });
    throttleGroup.appendChild(downBtn);

    const upBtn = document.createElement("button");
    upBtn.className = "maneuvering-touch-btn";
    upBtn.textContent = "\u25B2";
    upBtn.setAttribute("aria-label", "Throttle Up");
    this.addTouchHold(upBtn, () => { this.touchThrottleDir = 1; }, () => { this.touchThrottleDir = 0; });
    throttleGroup.appendChild(upBtn);

    touchBar.appendChild(throttleGroup);
    this.container.appendChild(touchBar);
  }

  /** Attach press/release listeners for a touch-hold button. */
  private addTouchHold(
    el: HTMLElement,
    onDown: () => void,
    onUp: () => void
  ): void {
    const start = (e: Event) => { e.preventDefault(); onDown(); };
    const end = (e: Event) => { e.preventDefault(); onUp(); };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", end);
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

    // Touch handlers on canvas for tap/drag to set heading
    this.boundTouchStart = (e: TouchEvent) => {
      if (this.gameOver || !this.canvas) return;
      e.preventDefault();
      this.handleCanvasTouch(e);
    };

    this.boundTouchMove = (e: TouchEvent) => {
      if (this.gameOver || !this.canvas) return;
      e.preventDefault();
      this.handleCanvasTouch(e);
    };

    this.boundTouchEnd = (_e: TouchEvent) => {
      // No-op: heading target remains until ship faces it
    };

    document.addEventListener("keydown", this.boundKeyDown);
    document.addEventListener("keyup", this.boundKeyUp);
    this.canvas?.addEventListener("click", this.boundMouseClick);
    this.canvas?.addEventListener("touchstart", this.boundTouchStart, { passive: false } as AddEventListenerOptions);
    this.canvas?.addEventListener("touchmove", this.boundTouchMove, { passive: false } as AddEventListenerOptions);
    this.canvas?.addEventListener("touchend", this.boundTouchEnd);
  }

  private handleCanvasTouch(e: TouchEvent): void {
    if (!this.canvas || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    this.mouseTarget = { x, y };
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
    if (this.boundTouchStart && this.canvas) {
      this.canvas.removeEventListener("touchstart", this.boundTouchStart);
    }
    if (this.boundTouchMove && this.canvas) {
      this.canvas.removeEventListener("touchmove", this.boundTouchMove);
    }
    if (this.boundTouchEnd && this.canvas) {
      this.canvas.removeEventListener("touchend", this.boundTouchEnd);
    }
    this.boundKeyDown = null;
    this.boundKeyUp = null;
    this.boundMouseClick = null;
    this.boundTouchStart = null;
    this.boundTouchMove = null;
    this.boundTouchEnd = null;
  }

  private processInput(): void {
    if (!this.ship) return;

    // Keyboard throttle
    if (this.keysDown.has("arrowup") || this.keysDown.has("w") || this.touchThrottleDir > 0) {
      throttleUp(this.ship);
    }
    if (this.keysDown.has("arrowdown") || this.keysDown.has("s") || this.touchThrottleDir < 0) {
      throttleDown(this.ship);
    }

    // Keyboard + touch button turning
    let turnDir = 0;
    if (this.keysDown.has("arrowleft") || this.keysDown.has("a")) {
      turnDir -= 1;
    }
    if (this.keysDown.has("arrowright") || this.keysDown.has("d")) {
      turnDir += 1;
    }
    // Touch steer buttons
    turnDir += this.touchSteerDir;

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

      // Track wave animation time
      this.waveTime += dt;

      // Track damage flash
      if (collided) {
        this.damageFlashTimer = DAMAGE_FLASH_DURATION;
      }
      if (this.damageFlashTimer > 0) {
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
      }

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

    const theme = THEME_COLORS[this.layout.theme];

    // Clear canvas with themed water color
    ctx.fillStyle = theme.water;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Phase 2: Draw wave patterns on water
    this.drawWavePatterns(ctx, theme);

    // Draw land masses with themed color
    ctx.fillStyle = theme.land;
    for (const land of this.layout.lands) {
      ctx.beginPath();
      ctx.moveTo(land.points[0].x, land.points[0].y);
      for (let i = 1; i < land.points.length; i++) {
        ctx.lineTo(land.points[i].x, land.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw obstacle land masses (islands, icebergs) with distinct fill
    if (this.layout.lands.length > 2) {
      for (let i = 2; i < this.layout.lands.length; i++) {
        const land = this.layout.lands[i];
        ctx.beginPath();
        ctx.moveTo(land.points[0].x, land.points[0].y);
        for (let j = 1; j < land.points.length; j++) {
          ctx.lineTo(land.points[j].x, land.points[j].y);
        }
        ctx.closePath();

        // Arctic theme: faceted iceberg look
        if (this.layout.theme === "arctic") {
          this.drawIcebergFill(ctx, land.points);
        } else {
          ctx.fillStyle = theme.obstacleFill;
          ctx.fill();
        }
      }
    }

    // Phase 2: Draw foam along land/water boundaries
    this.drawCoastlineFoam(ctx);

    // Draw decorations (palm trees, icebergs, cranes, etc.)
    if (this.layout.decorations) {
      for (const deco of this.layout.decorations) {
        this.drawDecoration(ctx, deco);
      }
    }

    // Draw walls with themed color
    ctx.strokeStyle = theme.wall;
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

    // Phase 3: Draw HUD elements on canvas
    this.drawCanvasHUD(ctx, this.ship);

    // Phase 3: Draw damage flash overlay
    if (this.damageFlashTimer > 0) {
      const alpha = (this.damageFlashTimer / DAMAGE_FLASH_DURATION) * 0.3;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  private drawShip(ctx: CanvasRenderingContext2D, ship: ShipPhysicsState): void {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.heading);

    const size = SHIP_RADIUS;

    // Hull shape — proper bow and stern
    ctx.beginPath();
    // Bow (pointed front)
    ctx.moveTo(size * 1.5, 0);
    // Starboard side
    ctx.quadraticCurveTo(size * 0.8, -size * 0.75, -size * 0.3, -size * 0.7);
    // Stern starboard
    ctx.lineTo(-size, -size * 0.5);
    // Stern (flat)
    ctx.lineTo(-size, size * 0.5);
    // Port stern
    ctx.lineTo(-size * 0.3, size * 0.7);
    // Port side
    ctx.quadraticCurveTo(size * 0.8, size * 0.75, size * 1.5, 0);
    ctx.closePath();

    // Hull fill and outline
    ctx.fillStyle = COLOR_SHIP;
    ctx.fill();
    ctx.strokeStyle = COLOR_SHIP_ACCENT;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Deck line (inner hull edge)
    ctx.strokeStyle = "rgba(180, 180, 180, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(size * 1.0, 0);
    ctx.quadraticCurveTo(size * 0.5, -size * 0.45, -size * 0.2, -size * 0.4);
    ctx.lineTo(-size * 0.7, -size * 0.3);
    ctx.lineTo(-size * 0.7, size * 0.3);
    ctx.lineTo(-size * 0.2, size * 0.4);
    ctx.quadraticCurveTo(size * 0.5, size * 0.45, size * 1.0, 0);
    ctx.stroke();

    // Bridge/superstructure (aft of center)
    ctx.fillStyle = COLOR_SHIP_ACCENT;
    ctx.fillRect(-size * 0.5, -size * 0.25, size * 0.4, size * 0.5);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-size * 0.5, -size * 0.25, size * 0.4, size * 0.5);

    // Bridge windows
    ctx.fillStyle = "rgba(100, 200, 255, 0.5)";
    ctx.fillRect(-size * 0.45, -size * 0.15, size * 0.1, size * 0.3);

    // Rudder indicator line (extends from stern)
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    // Show rudder angle based on turn direction
    const rudderAngle = ship.turnDirection * 0.4;
    ctx.lineTo(-size - 6 * Math.cos(rudderAngle), 6 * Math.sin(rudderAngle));
    ctx.stroke();

    ctx.restore();
  }

  /** Phase 2: Draw subtle wave pattern lines across the water surface. */
  private drawWavePatterns(ctx: CanvasRenderingContext2D, _theme: ThemeColors): void {
    ctx.save();
    // Wave color varies by environment theme
    ctx.strokeStyle = this.layout!.theme === "arctic"
      ? "rgba(180, 210, 240, 0.12)"
      : "rgba(120, 180, 255, 0.1)";
    ctx.lineWidth = 1;

    const waveSpacing = 30;
    const amplitude = 3;
    const frequency = 0.02;
    const timeOffset = this.waveTime * 0.8;

    for (let row = 0; row < CANVAS_HEIGHT; row += waveSpacing) {
      ctx.beginPath();
      for (let x = 0; x < CANVAS_WIDTH; x += 8) {
        const y = row + Math.sin(x * frequency + timeOffset + row * 0.1) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Phase 2: Draw white foam along land/water edges. */
  private drawCoastlineFoam(ctx: CanvasRenderingContext2D): void {
    if (!this.layout) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3, 5]);

    // Foam along wall segments (approximates the coastline)
    for (const wall of this.layout.walls) {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  /** Phase 2 (arctic): Draw faceted iceberg fill with gradient highlights. */
  private drawIcebergFill(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>): void {
    // Base fill — icy blue-white
    ctx.fillStyle = "#c8dce8";
    ctx.fill();

    // Faceted highlight — lighter triangular sections
    if (points.length >= 3) {
      // Calculate centroid
      let cx = 0, cy = 0;
      for (const p of points) { cx += p.x; cy += p.y; }
      cx /= points.length;
      cy /= points.length;

      // Draw lighter facet from first two points to center
      ctx.fillStyle = "rgba(220, 240, 255, 0.6)";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();

      // Draw medium facet
      if (points.length >= 4) {
        ctx.fillStyle = "rgba(200, 225, 245, 0.4)";
        ctx.beginPath();
        ctx.moveTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
      }

      // Outline the iceberg with a crisp edge
      ctx.strokeStyle = "#a0b8cc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  /** Phase 3: Draw all HUD elements on the canvas. */
  private drawCanvasHUD(ctx: CanvasRenderingContext2D, ship: ShipPhysicsState): void {
    if (!this.layout) return;

    // ── Port Name (top-right corner) ──
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(CANVAS_WIDTH - 180, 6, 174, 24);
    ctx.strokeStyle = "#b87333";
    ctx.lineWidth = 1;
    ctx.strokeRect(CANVAS_WIDTH - 180, 6, 174, 24);

    ctx.fillStyle = "#e8d4a0";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.layout.name, CANVAS_WIDTH - 93, 18);
    ctx.restore();

    // ── Timer Panel (top-left) with framed look ──
    const timerX = 10;
    const timerY = 8;
    const timerW = 160;
    const timerH = 28;

    ctx.save();
    // Dark background
    ctx.fillStyle = "rgba(10, 10, 15, 0.7)";
    ctx.fillRect(timerX, timerY, timerW, timerH);
    // Copper border
    ctx.strokeStyle = "#b87333";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(timerX, timerY, timerW, timerH);

    // "TIME" label
    ctx.fillStyle = "#b87333";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("TIME", timerX + 4, timerY + 2);

    // Timer bar fill
    const pct = Math.max(0, this.timeRemaining / this.layout.timeLimit);
    const barX = timerX + 4;
    const barY = timerY + 14;
    const barW = timerW - 8;
    const barH = 10;

    // Bar background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(barX, barY, barW, barH);

    // Bar fill with color based on time remaining
    let barColor = COLOR_TIMER_FILL_GOOD;
    if (pct <= 0.25) barColor = COLOR_TIMER_FILL_DANGER;
    else if (pct <= 0.5) barColor = COLOR_TIMER_FILL_WARN;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Time text overlay
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(this.timeRemaining)}s`, barX + barW / 2, barY + barH / 2);

    ctx.restore();

    // ── Speed Gauge (left side, vertical bar segments) ──
    const gaugeX = 14;
    const gaugeY = CANVAS_HEIGHT - 100;
    const gaugeW = 20;
    const gaugeH = 70;

    ctx.save();
    // Background panel
    ctx.fillStyle = "rgba(10, 10, 15, 0.7)";
    ctx.fillRect(gaugeX - 4, gaugeY - 16, gaugeW + 8, gaugeH + 30);
    ctx.strokeStyle = "#b87333";
    ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX - 4, gaugeY - 16, gaugeW + 8, gaugeH + 30);

    // "SPD" label
    ctx.fillStyle = "#b87333";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPD", gaugeX + gaugeW / 2, gaugeY - 6);

    // Throttle segments
    const levels = THROTTLE_LEVELS.length;
    const segHeight = gaugeH / levels;
    for (let i = 0; i < levels; i++) {
      const segY = gaugeY + gaugeH - (i + 1) * segHeight;
      if (i <= ship.throttleIndex) {
        ctx.fillStyle = i === 0 ? "#555" : i === 1 ? COLOR_TIMER_FILL_WARN : COLOR_TIMER_FILL_GOOD;
      } else {
        ctx.fillStyle = "#1a1a1a";
      }
      ctx.fillRect(gaugeX, segY + 1, gaugeW, segHeight - 2);
      // Segment border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(gaugeX, segY + 1, gaugeW, segHeight - 2);
    }

    ctx.restore();

    // ── Speed Dots (bottom edge — 10 circles showing thrust level) ──
    const dotsY = CANVAS_HEIGHT - 14;
    const dotsStartX = CANVAS_WIDTH / 2 - 55;
    const dotSpacing = 12;
    const dotRadius = 3.5;

    ctx.save();
    // Map throttle to number of filled dots (0..10)
    const filledDots = Math.round((ship.speed / THROTTLE_LEVELS[THROTTLE_LEVELS.length - 1]) * 10);
    for (let i = 0; i < 10; i++) {
      const dx = dotsStartX + i * dotSpacing;
      ctx.beginPath();
      ctx.arc(dx, dotsY, dotRadius, 0, Math.PI * 2);
      if (i < filledDots) {
        ctx.fillStyle = i < 3 ? "#00cc55" : i < 7 ? "#ccaa00" : "#cc3333";
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();

    // ── Heading / Rudder Indicator (bottom-right) ──
    const compassX = CANVAS_WIDTH - 40;
    const compassY = CANVAS_HEIGHT - 40;
    const compassR = 18;

    ctx.save();
    // Compass circle
    ctx.fillStyle = "rgba(10, 10, 15, 0.6)";
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassR + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b87333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassR + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal markers
    ctx.fillStyle = "#888";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", compassX, compassY - compassR - 1);

    // Heading needle
    ctx.strokeStyle = "#e84040";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(
      compassX + Math.cos(ship.heading) * compassR,
      compassY + Math.sin(ship.heading) * compassR,
    );
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(compassX, compassY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawDecoration(ctx: CanvasRenderingContext2D, deco: ObstacleDecoration): void {
    const scale = deco.scale ?? 1.0;
    ctx.save();
    ctx.translate(deco.x, deco.y);
    ctx.scale(scale, scale);

    switch (deco.type) {
      case "palm-tree":
        // Trunk
        ctx.strokeStyle = "#8B5E3C";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-2, -18);
        ctx.stroke();
        // Fronds (leaf clusters)
        ctx.fillStyle = "#228B22";
        for (let angle = 0; angle < 6; angle++) {
          const a = (angle * Math.PI) / 3;
          ctx.beginPath();
          ctx.ellipse(-2 + Math.cos(a) * 6, -18 + Math.sin(a) * 4, 8, 3, a, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case "iceberg":
        // Irregular icy shape
        ctx.fillStyle = "#c8dce8";
        ctx.strokeStyle = "#a0b8cc";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-3, -14);
        ctx.lineTo(4, -12);
        ctx.lineTo(10, -6);
        ctx.lineTo(12, 4);
        ctx.lineTo(6, 10);
        ctx.lineTo(-4, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(-2, -12);
        ctx.lineTo(3, -10);
        ctx.lineTo(0, -4);
        ctx.closePath();
        ctx.fill();
        break;

      case "crane":
        // Base
        ctx.fillStyle = "#666655";
        ctx.fillRect(-4, -2, 8, 6);
        // Tower
        ctx.strokeStyle = "#888877";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, -24);
        ctx.stroke();
        // Boom arm
        ctx.strokeStyle = "#aa9955";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(18, -18);
        ctx.stroke();
        // Cable
        ctx.strokeStyle = "#555544";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14, -18);
        ctx.lineTo(14, -6);
        ctx.stroke();
        break;

      case "storage-tank":
        // Cylindrical tank (top-down view = circle)
        ctx.fillStyle = "#7a7a6a";
        ctx.strokeStyle = "#5a5a4a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Highlight ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case "rock":
        // Irregular rocky shape
        ctx.fillStyle = "#8b7355";
        ctx.strokeStyle = "#6b5335";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-7, 3);
        ctx.lineTo(-5, -5);
        ctx.lineTo(0, -8);
        ctx.lineTo(6, -4);
        ctx.lineTo(8, 3);
        ctx.lineTo(3, 7);
        ctx.lineTo(-3, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "warehouse":
        // Rectangular warehouse building (top-down view)
        ctx.fillStyle = "#5a5550";
        ctx.strokeStyle = "#3a3530";
        ctx.lineWidth = 1;
        ctx.fillRect(-14, -8, 28, 16);
        ctx.strokeRect(-14, -8, 28, 16);
        // Roof ridge line
        ctx.strokeStyle = "#7a7570";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();
        // Door
        ctx.fillStyle = "#3a3530";
        ctx.fillRect(10, -3, 4, 6);
        break;

      case "bollard":
        // Small mooring bollard (circle with cross)
        ctx.fillStyle = "#888";
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Cross detail
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(2, 0);
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 2);
        ctx.stroke();
        break;

      case "pine-tree":
        // Pine/conifer tree (top-down: dark green circle cluster)
        ctx.fillStyle = "#2d5a3d";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        // Darker center
        ctx.fillStyle = "#1a4a2d";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Trunk hint
        ctx.fillStyle = "#5a3a1a";
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
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
