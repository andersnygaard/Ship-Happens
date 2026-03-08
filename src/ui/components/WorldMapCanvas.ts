/**
 * WorldMapCanvas — Canvas-based 2D world map renderer.
 * Draws simplified continent outlines using Mercator projection,
 * plots all 30 ports as interactive dots, and shows ship positions.
 */

import { WORLD_COASTLINES, type CoastlinePolygon } from "../../data/worldMapData";
import { PORTS } from "../../data/ports";
import type { Port } from "../../data/types";
import type { OwnedShip } from "../../data/types";

/** Ship data enriched with player info for rendering on the map. */
export interface MapShipData {
  ship: OwnedShip;
  playerIndex: number;
}

/** Port marker info for rendering and interaction. */
interface PortMarker {
  port: Port;
  x: number;
  y: number;
  radius: number;
}

/** Ship marker for rendering on the map. */
interface ShipMarker {
  ship: OwnedShip;
  playerIndex: number;
  x: number;
  y: number;
  /** Destination coordinates if ship has cargo destination. */
  destX?: number;
  destY?: number;
  destPortName?: string;
}

/** Callback types for port interaction. */
export interface WorldMapCanvasCallbacks {
  onPortHover?: (port: Port | null) => void;
  onPortClick?: (port: Port) => void;
}

export class WorldMapCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private portMarkers: PortMarker[] = [];
  private shipMarkers: ShipMarker[] = [];
  private hoveredPort: Port | null = null;
  private hoveredShip: ShipMarker | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private selectedPortId: string | null = null;
  private callbacks: WorldMapCanvasCallbacks;
  private resizeObserver: ResizeObserver | null = null;
  private shipDataList: MapShipData[] = [];
  private homePortId: string | null = null;
  /** Port IDs that are blocked by world events. */
  private blockedPortIds: Set<string> = new Set();
  /** Port IDs with a cost multiplier > 1 from world events (not blocked). */
  private affectedPortIds: Set<string> = new Set();

  // Map rendering constants
  private readonly OCEAN_COLOR = "#0a1e3d";
  private readonly LAND_COLOR = "#2a5a2a";
  private readonly LAND_BORDER_COLOR = "#1a4a1a";
  private readonly PORT_COLOR = "#d4a844";
  private readonly PORT_HOVER_COLOR = "#f0c860";
  private readonly PORT_SELECTED_COLOR = "#ff8844";
  private readonly PLAYER_SHIP_COLORS = [
    "#c87533", // Player 1: copper
    "#33aa55", // Player 2: green
    "#3377cc", // Player 3: blue
    "#cc33aa", // Player 4: magenta
    "#ccaa33", // Player 5: gold
    "#33cccc", // Player 6: teal
    "#cc5533", // Player 7: orange-red
  ];
  private readonly PLAYER_SHIP_BORDER_COLORS = [
    "#8b4f1f",
    "#1f7733",
    "#1f4f8b",
    "#8b1f77",
    "#8b771f",
    "#1f8b8b",
    "#8b331f",
  ];
  private readonly HOME_PORT_COLOR = "#44aaff";
  private readonly BLOCKED_PORT_COLOR = "#ff3333";
  private readonly AFFECTED_PORT_COLOR = "#ffaa33";
  private readonly PORT_RADIUS = 4;
  private readonly PORT_HOVER_RADIUS = 7;

  // Padding from canvas edges (pixels)
  private readonly PADDING_X = 10;
  private readonly PADDING_Y = 10;

  // Mercator latitude clipping
  private readonly MAX_LAT = 80;
  private readonly MIN_LAT = -70;

  constructor(callbacks: WorldMapCanvasCallbacks = {}) {
    this.callbacks = callbacks;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "worldmap-canvas";

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D canvas context");
    }
    this.ctx = ctx;

    this.bindEvents();
  }

  /** Get the canvas element to attach to the DOM. */
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Set the ships to display on the map. */
  setShips(ships: MapShipData[]): void {
    this.shipDataList = ships;
    this.updateShipMarkers();
    this.render();
  }

  /** Set the home port for the active player. */
  setHomePort(portId: string | null): void {
    this.homePortId = portId;
    this.render();
  }

  /** Set the selected port. */
  setSelectedPort(portId: string | null): void {
    this.selectedPortId = portId;
    this.render();
  }

  /** Set port IDs that are blocked by world events. */
  setBlockedPorts(portIds: string[]): void {
    this.blockedPortIds = new Set(portIds);
    this.render();
  }

  /** Set port IDs that are affected (cost multiplier) by world events. */
  setAffectedPorts(portIds: string[]): void {
    this.affectedPortIds = new Set(portIds);
    this.render();
  }

  /** Attach to a parent element and start observing size changes. */
  attach(parent: HTMLElement): void {
    parent.appendChild(this.canvas);
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(parent);
    // Initial sizing
    this.handleResize();
  }

  /** Clean up resources. */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.remove();
  }

  // ── Coordinate Conversion ─────────────────────────────────────────────

  /** Convert longitude to canvas X coordinate. */
  private lngToX(lng: number): number {
    const drawWidth = this.canvas.width - this.PADDING_X * 2;
    return this.PADDING_X + ((lng + 180) / 360) * drawWidth;
  }

  /** Convert latitude to canvas Y coordinate using Mercator projection. */
  private latToY(lat: number): number {
    const drawHeight = this.canvas.height - this.PADDING_Y * 2;

    // Clamp latitude
    const clampedLat = Math.max(this.MIN_LAT, Math.min(this.MAX_LAT, lat));

    // Mercator formula
    const latRad = (clampedLat * Math.PI) / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));

    // Normalize to [0,1] range based on clamped bounds
    const maxLatRad = (this.MAX_LAT * Math.PI) / 180;
    const minLatRad = (this.MIN_LAT * Math.PI) / 180;
    const maxMercY = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));
    const minMercY = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2));

    const normalizedY = (maxMercY - mercY) / (maxMercY - minMercY);
    return this.PADDING_Y + normalizedY * drawHeight;
  }

  // ── Rendering ─────────────────────────────────────────────────────────

  /** Full render pass. */
  private render(): void {
    const { width, height } = this.canvas;
    if (width === 0 || height === 0) return;

    // Clear canvas
    this.ctx.fillStyle = this.OCEAN_COLOR;
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid lines (subtle)
    this.drawGrid();

    // Draw landmasses
    this.drawCoastlines();

    // Update port markers positions
    this.updatePortMarkers();

    // Update ship markers positions
    this.updateShipMarkers();

    // Draw port markers
    this.drawPorts();

    // Draw route lines (below ships, above ports)
    this.drawRoutes();

    // Draw ship markers
    this.drawShips();

    // Draw hover tooltip (port or ship)
    this.drawTooltip();
    this.drawShipTooltip();
  }

  /** Draw subtle grid lines for latitude/longitude reference. */
  private drawGrid(): void {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    this.ctx.lineWidth = 0.5;

    // Longitude lines every 30 degrees
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = this.lngToX(lng);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Latitude lines every 15 degrees
    for (let lat = this.MIN_LAT; lat <= this.MAX_LAT; lat += 15) {
      const y = this.latToY(lat);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /** Draw all continent/landmass polygons. */
  private drawCoastlines(): void {
    this.ctx.fillStyle = this.LAND_COLOR;
    this.ctx.strokeStyle = this.LAND_BORDER_COLOR;
    this.ctx.lineWidth = 1;

    for (const polygon of WORLD_COASTLINES) {
      this.drawPolygon(polygon);
    }
  }

  /** Draw a single coastline polygon. */
  private drawPolygon(polygon: CoastlinePolygon): void {
    if (polygon.length < 3) return;

    this.ctx.beginPath();
    const [firstLng, firstLat] = polygon[0];
    this.ctx.moveTo(this.lngToX(firstLng), this.latToY(firstLat));

    for (let i = 1; i < polygon.length; i++) {
      const [lng, lat] = polygon[i];
      this.ctx.lineTo(this.lngToX(lng), this.latToY(lat));
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  /** Update port marker positions based on current canvas size. */
  private updatePortMarkers(): void {
    this.portMarkers = PORTS.map((port) => ({
      port,
      x: this.lngToX(port.lng),
      y: this.latToY(port.lat),
      radius: this.PORT_RADIUS,
    }));
  }

  /** Update ship marker positions based on current canvas size. */
  private updateShipMarkers(): void {
    this.shipMarkers = [];
    for (const data of this.shipDataList) {
      const { ship, playerIndex } = data;
      if (ship.currentPortId) {
        const port = PORTS.find((p) => p.id === ship.currentPortId);
        if (port) {
          const marker: ShipMarker = {
            ship,
            playerIndex,
            x: this.lngToX(port.lng),
            y: this.latToY(port.lat),
          };

          // If ship has a cargo destination, compute route endpoint
          if (ship.cargoDestinationPortId) {
            const destPort = PORTS.find((p) => p.id === ship.cargoDestinationPortId);
            if (destPort) {
              marker.destX = this.lngToX(destPort.lng);
              marker.destY = this.latToY(destPort.lat);
              marker.destPortName = destPort.name;
            }
          }

          this.shipMarkers.push(marker);
        }
      }
    }
  }

  /** Draw all port markers. */
  private drawPorts(): void {
    for (const marker of this.portMarkers) {
      const isHovered = this.hoveredPort?.id === marker.port.id;
      const isSelected = this.selectedPortId === marker.port.id;
      const isHome = this.homePortId === marker.port.id;
      const isBlocked = this.blockedPortIds.has(marker.port.id);
      const isAffected = this.affectedPortIds.has(marker.port.id);

      let color = this.PORT_COLOR;
      let radius = marker.radius;

      if (isHome) {
        color = this.HOME_PORT_COLOR;
        radius = this.PORT_RADIUS + 1;
      }
      if (isAffected) {
        color = this.AFFECTED_PORT_COLOR;
      }
      if (isBlocked) {
        color = this.BLOCKED_PORT_COLOR;
      }
      if (isSelected) {
        color = this.PORT_SELECTED_COLOR;
        radius = this.PORT_RADIUS + 1;
      }
      if (isHovered) {
        color = this.PORT_HOVER_COLOR;
        radius = this.PORT_HOVER_RADIUS;
      }

      // Outer glow
      this.ctx.beginPath();
      this.ctx.arc(marker.x, marker.y, radius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = isBlocked
        ? "rgba(255, 51, 51, 0.35)"
        : isAffected
          ? "rgba(255, 170, 51, 0.3)"
          : isHovered
            ? "rgba(240, 200, 96, 0.3)"
            : isHome
              ? "rgba(68, 170, 255, 0.2)"
              : "rgba(212, 168, 68, 0.15)";
      this.ctx.fill();

      // Main dot
      this.ctx.beginPath();
      this.ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Border
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw warning icon for blocked ports (X mark)
      if (isBlocked) {
        const iconSize = 4;
        const iconY = marker.y - radius - iconSize - 3;
        this.ctx.strokeStyle = this.BLOCKED_PORT_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(marker.x - iconSize, iconY - iconSize);
        this.ctx.lineTo(marker.x + iconSize, iconY + iconSize);
        this.ctx.moveTo(marker.x + iconSize, iconY - iconSize);
        this.ctx.lineTo(marker.x - iconSize, iconY + iconSize);
        this.ctx.stroke();
      }

      // Draw warning dot for affected (non-blocked) ports
      if (isAffected && !isBlocked) {
        const dotY = marker.y - radius - 5;
        this.ctx.beginPath();
        this.ctx.arc(marker.x, dotY, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = this.AFFECTED_PORT_COLOR;
        this.ctx.fill();
      }
    }
  }

  /** Draw dashed route lines from ship origin to cargo destination. */
  private drawRoutes(): void {
    for (const marker of this.shipMarkers) {
      if (marker.destX == null || marker.destY == null) continue;

      const color = this.PLAYER_SHIP_COLORS[marker.playerIndex % this.PLAYER_SHIP_COLORS.length];

      this.ctx.save();
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = 0.6;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(marker.x, marker.y);
      this.ctx.lineTo(marker.destX, marker.destY);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  /** Draw ship position markers as colored diamonds. */
  private drawShips(): void {
    // Stack offset: if multiple ships at same port, offset them
    const positionCounts = new Map<string, number>();

    for (const marker of this.shipMarkers) {
      const key = `${Math.round(marker.x)},${Math.round(marker.y)}`;
      const idx = positionCounts.get(key) ?? 0;
      positionCounts.set(key, idx + 1);

      const size = 8;
      const offsetX = idx * (size + 2);
      const drawX = marker.x + offsetX;
      const drawY = marker.y - size - 4;

      const fillColor = this.PLAYER_SHIP_COLORS[marker.playerIndex % this.PLAYER_SHIP_COLORS.length];
      const borderColor = this.PLAYER_SHIP_BORDER_COLORS[marker.playerIndex % this.PLAYER_SHIP_BORDER_COLORS.length];

      // Diamond shape
      this.ctx.beginPath();
      this.ctx.moveTo(drawX, drawY - size / 2);       // top
      this.ctx.lineTo(drawX + size / 2, drawY);       // right
      this.ctx.lineTo(drawX, drawY + size / 2);       // bottom
      this.ctx.lineTo(drawX - size / 2, drawY);       // left
      this.ctx.closePath();
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  /** Draw tooltip for hovered ship. */
  private drawShipTooltip(): void {
    if (!this.hoveredShip) return;

    const { ship } = this.hoveredShip;
    const lines = [
      ship.name,
      `Condition: ${ship.conditionPercent}%`,
      `Fuel: ${ship.fuelTons}t`,
    ];
    if (ship.cargoType) {
      lines.push(`Cargo: ${ship.cargoType}`);
    }
    if (ship.isLaidUp) {
      lines.push("(Laid up)");
    }

    this.ctx.font = "bold 11px Inter, sans-serif";
    const padding = 8;
    const lineHeight = 15;
    const maxWidth = Math.max(...lines.map((l) => this.ctx.measureText(l).width));
    const tooltipWidth = maxWidth + padding * 2;
    const tooltipHeight = lines.length * lineHeight + padding * 2;

    // Position near the mouse cursor
    let tx = this.mouseX + 12;
    let ty = this.mouseY - tooltipHeight / 2;

    // Keep within canvas bounds
    tx = Math.max(4, Math.min(this.canvas.width - tooltipWidth - 4, tx));
    ty = Math.max(4, Math.min(this.canvas.height - tooltipHeight - 4, ty));

    // Background
    this.ctx.fillStyle = "rgba(26, 26, 46, 0.94)";
    this.ctx.strokeStyle = "rgba(200, 117, 51, 0.7)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(tx, ty, tooltipWidth, tooltipHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = "#e8e4d9";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    for (let i = 0; i < lines.length; i++) {
      // First line (name) is bold, rest are normal
      this.ctx.font = i === 0 ? "bold 11px Inter, sans-serif" : "11px Inter, sans-serif";
      this.ctx.fillText(lines[i], tx + padding, ty + padding + i * lineHeight);
    }
  }

  /** Draw tooltip for hovered port. */
  private drawTooltip(): void {
    if (!this.hoveredPort) return;

    const marker = this.portMarkers.find(
      (m) => m.port.id === this.hoveredPort?.id,
    );
    if (!marker) return;

    const isBlocked = this.blockedPortIds.has(marker.port.id);
    const isAffected = this.affectedPortIds.has(marker.port.id);
    const statusSuffix = isBlocked ? " [BLOCKED]" : isAffected ? " [!]" : "";
    const text = `${marker.port.name}, ${marker.port.country}${statusSuffix}`;
    this.ctx.font = "bold 12px Inter, sans-serif";
    const metrics = this.ctx.measureText(text);
    const padding = 6;
    const tooltipWidth = metrics.width + padding * 2;
    const tooltipHeight = 20;

    // Position tooltip above the port dot
    let tx = marker.x - tooltipWidth / 2;
    let ty = marker.y - this.PORT_HOVER_RADIUS - tooltipHeight - 6;

    // Keep within canvas bounds
    tx = Math.max(4, Math.min(this.canvas.width - tooltipWidth - 4, tx));
    ty = Math.max(4, ty);

    // Background
    this.ctx.fillStyle = "rgba(26, 26, 46, 0.92)";
    this.ctx.strokeStyle = "rgba(212, 168, 68, 0.6)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(tx, ty, tooltipWidth, tooltipHeight, 3);
    this.ctx.fill();
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = "#e8e4d9";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, tx + padding, ty + tooltipHeight / 2);
  }

  // ── Event Handling ────────────────────────────────────────────────────

  private bindEvents(): void {
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    this.mouseX = mx;
    this.mouseY = my;

    const hitPort = this.findPortAt(mx, my);
    const hitShip = this.findShipAt(mx, my);

    let needsRender = false;

    if (hitPort !== this.hoveredPort) {
      this.hoveredPort = hitPort;
      this.callbacks.onPortHover?.(hitPort);
      needsRender = true;
    }

    if (hitShip !== this.hoveredShip) {
      this.hoveredShip = hitShip;
      needsRender = true;
    }

    this.canvas.style.cursor = (hitPort || hitShip) ? "pointer" : "default";

    if (needsRender || hitShip) {
      this.render();
    }
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hitPort = this.findPortAt(mx, my);
    if (hitPort) {
      this.selectedPortId = hitPort.id;
      this.callbacks.onPortClick?.(hitPort);
      this.render();
    }
  }

  private handleMouseLeave(): void {
    if (this.hoveredPort || this.hoveredShip) {
      this.hoveredPort = null;
      this.hoveredShip = null;
      this.canvas.style.cursor = "default";
      this.callbacks.onPortHover?.(null);
      this.render();
    }
  }

  /** Find the port at a given canvas coordinate, if any. */
  private findPortAt(x: number, y: number): Port | null {
    const hitRadius = this.PORT_HOVER_RADIUS + 4; // generous hit area
    for (const marker of this.portMarkers) {
      const dx = x - marker.x;
      const dy = y - marker.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return marker.port;
      }
    }
    return null;
  }

  /** Find a ship marker at a given canvas coordinate, if any. */
  private findShipAt(x: number, y: number): ShipMarker | null {
    const hitRadius = 10;
    const positionCounts = new Map<string, number>();

    for (const marker of this.shipMarkers) {
      const key = `${Math.round(marker.x)},${Math.round(marker.y)}`;
      const idx = positionCounts.get(key) ?? 0;
      positionCounts.set(key, idx + 1);

      const size = 8;
      const offsetX = idx * (size + 2);
      const drawX = marker.x + offsetX;
      const drawY = marker.y - size - 4;

      const dx = x - drawX;
      const dy = y - drawY;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return marker;
      }
    }
    return null;
  }

  // ── Resize Handling ───────────────────────────────────────────────────

  private handleResize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);
    // After scaling, use CSS dimensions for drawing coordinates
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.render();
  }
}
