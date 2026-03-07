/**
 * WorldMapCanvas — Canvas-based 2D world map renderer.
 * Draws simplified continent outlines using Mercator projection,
 * plots all 30 ports as interactive dots, and shows ship positions.
 */

import { WORLD_COASTLINES, type CoastlinePolygon } from "../../data/worldMapData";
import { PORTS } from "../../data/ports";
import type { Port } from "../../data/types";
import type { OwnedShip } from "../../data/types";

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
  x: number;
  y: number;
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
  private selectedPortId: string | null = null;
  private callbacks: WorldMapCanvasCallbacks;
  private resizeObserver: ResizeObserver | null = null;
  private ships: OwnedShip[] = [];
  private homePortId: string | null = null;

  // Map rendering constants
  private readonly OCEAN_COLOR = "#0a1e3d";
  private readonly LAND_COLOR = "#2a5a2a";
  private readonly LAND_BORDER_COLOR = "#1a4a1a";
  private readonly PORT_COLOR = "#d4a844";
  private readonly PORT_HOVER_COLOR = "#f0c860";
  private readonly PORT_SELECTED_COLOR = "#ff8844";
  private readonly SHIP_COLOR = "#ff4444";
  private readonly HOME_PORT_COLOR = "#44aaff";
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
  setShips(ships: OwnedShip[]): void {
    this.ships = ships;
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

    // Draw ship markers
    this.drawShips();

    // Draw hover tooltip
    this.drawTooltip();
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
    for (const ship of this.ships) {
      if (ship.currentPortId) {
        const port = PORTS.find((p) => p.id === ship.currentPortId);
        if (port) {
          this.shipMarkers.push({
            ship,
            x: this.lngToX(port.lng),
            y: this.latToY(port.lat),
          });
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

      let color = this.PORT_COLOR;
      let radius = marker.radius;

      if (isHome) {
        color = this.HOME_PORT_COLOR;
        radius = this.PORT_RADIUS + 1;
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
      this.ctx.fillStyle = isHovered
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
    }
  }

  /** Draw ship position markers. */
  private drawShips(): void {
    for (const marker of this.shipMarkers) {
      // Draw a small triangle/diamond shape for ships
      const size = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(marker.x, marker.y - size - 4);
      this.ctx.lineTo(marker.x + size / 2, marker.y - size / 2 - 4);
      this.ctx.lineTo(marker.x, marker.y - 4);
      this.ctx.lineTo(marker.x - size / 2, marker.y - size / 2 - 4);
      this.ctx.closePath();
      this.ctx.fillStyle = this.SHIP_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = "#aa0000";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  /** Draw tooltip for hovered port. */
  private drawTooltip(): void {
    if (!this.hoveredPort) return;

    const marker = this.portMarkers.find(
      (m) => m.port.id === this.hoveredPort?.id,
    );
    if (!marker) return;

    const text = `${marker.port.name}, ${marker.port.country}`;
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

    const hitPort = this.findPortAt(mx, my);

    if (hitPort !== this.hoveredPort) {
      this.hoveredPort = hitPort;
      this.canvas.style.cursor = hitPort ? "pointer" : "default";
      this.callbacks.onPortHover?.(hitPort);
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
    if (this.hoveredPort) {
      this.hoveredPort = null;
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
