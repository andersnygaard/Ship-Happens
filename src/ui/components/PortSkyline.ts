/**
 * PortSkyline — Canvas-based procedural skyline renderer.
 * Generates unique skylines for each port using seeded randomness,
 * with landmark silhouettes for key ports and time-of-day color variations.
 */

import type { PortSkylineConfig, LandmarkType } from "../../data/portSkylineData";
import { PORT_SKYLINE_DATA } from "../../data/portSkylineData";

// ─── Seeded Random ────────────────────────────────────────────────────────────

/** Simple seeded PRNG (mulberry32). Produces values in [0, 1). */
function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a string to a numeric seed. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ─── Time of Day ──────────────────────────────────────────────────────────────

export type TimeOfDay = "day" | "sunset" | "night";

/**
 * Determine time of day based on port longitude.
 * This creates a simple approximation: ports further east see later times.
 */
export function getTimeOfDay(longitude: number): TimeOfDay {
  // Use current real hour + longitude offset to get local "hour"
  const utcHour = new Date().getUTCHours();
  const localHour = ((utcHour + longitude / 15) % 24 + 24) % 24;

  if (localHour >= 6 && localHour < 17) return "day";
  if (localHour >= 17 && localHour < 20) return "sunset";
  return "night";
}

/** Adjust color palette for time of day. */
function adjustColorsForTime(
  config: PortSkylineConfig,
  time: TimeOfDay,
): { skyTop: string; skyBottom: string; water: string; waterHighlight: string; buildingBase: string } {
  const { colorPalette } = config;

  switch (time) {
    case "sunset":
      return {
        skyTop: blendColor(colorPalette.skyTop, "#4a1a0e", 0.4),
        skyBottom: blendColor(colorPalette.skyBottom, "#e8713a", 0.5),
        water: blendColor(colorPalette.water, "#2a1a0a", 0.3),
        waterHighlight: blendColor(colorPalette.waterHighlight, "#ca6a3a", 0.4),
        buildingBase: colorPalette.buildingBase,
      };
    case "night":
      return {
        skyTop: blendColor(colorPalette.skyTop, "#050510", 0.6),
        skyBottom: blendColor(colorPalette.skyBottom, "#0a0a2a", 0.5),
        water: blendColor(colorPalette.water, "#050510", 0.5),
        waterHighlight: blendColor(colorPalette.waterHighlight, "#0a1a3a", 0.5),
        buildingBase: blendColor(colorPalette.buildingBase, "#0a0a14", 0.4),
      };
    default: // day
      return {
        skyTop: colorPalette.skyTop,
        skyBottom: colorPalette.skyBottom,
        water: colorPalette.water,
        waterHighlight: colorPalette.waterHighlight,
        buildingBase: colorPalette.buildingBase,
      };
  }
}

/** Blend two hex colors. t=0 returns c1, t=1 returns c2. */
function blendColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

/**
 * Create a canvas element with a procedurally generated skyline for the given port.
 * @param portId - The port identifier (must match keys in PORT_SKYLINE_DATA).
 * @param size - Canvas width/height in pixels (square canvas for porthole).
 * @param longitude - Port longitude for time-of-day calculation.
 */
export function createPortSkylineCanvas(
  portId: string,
  size: number,
  longitude: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.className = "port-skyline-canvas";

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const config = PORT_SKYLINE_DATA[portId];
  if (!config) {
    // Fallback: simple blue gradient
    drawFallbackSkyline(ctx, size);
    return canvas;
  }

  const time = getTimeOfDay(longitude);
  const colors = adjustColorsForTime(config, time);
  const rand = createSeededRandom(hashString(portId));

  // 1. Draw sky gradient
  drawSky(ctx, size, colors.skyTop, colors.skyBottom);

  // 2. Draw stars if night
  if (time === "night") {
    drawStars(ctx, size, rand);
  }

  // 3. Draw landmarks (behind buildings)
  const horizonY = size * 0.6;
  for (const landmark of config.landmarks) {
    drawLandmark(ctx, landmark, size, horizonY, config.colorPalette.buildingBase, config.colorPalette.accent);
  }

  // 4. Draw buildings
  drawBuildings(ctx, size, horizonY, config.buildingDensity, colors.buildingBase, time, rand);

  // 5. Draw water
  drawWater(ctx, size, horizonY, colors.water, colors.waterHighlight);

  return canvas;
}

// ─── Sky ──────────────────────────────────────────────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, size: number, topColor: string, bottomColor: string): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, size * 0.65);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size * 0.65);
}

function drawStars(ctx: CanvasRenderingContext2D, size: number, rand: () => number): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 30; i++) {
    const x = rand() * size;
    const y = rand() * size * 0.45;
    const r = rand() * 1.2 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Water ────────────────────────────────────────────────────────────────────

function drawWater(
  ctx: CanvasRenderingContext2D,
  size: number,
  horizonY: number,
  waterColor: string,
  highlightColor: string,
): void {
  const gradient = ctx.createLinearGradient(0, horizonY, 0, size);
  gradient.addColorStop(0, highlightColor);
  gradient.addColorStop(0.4, waterColor);
  gradient.addColorStop(1, waterColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, horizonY, size, size - horizonY);

  // Subtle wave lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 0.5;
  for (let y = horizonY + 8; y < size; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 4) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + y * 0.1) * 1.5);
    }
    ctx.stroke();
  }
}

// ─── Buildings ────────────────────────────────────────────────────────────────

function drawBuildings(
  ctx: CanvasRenderingContext2D,
  size: number,
  horizonY: number,
  density: number,
  baseColor: string,
  time: TimeOfDay,
  rand: () => number,
): void {
  const buildingCount = Math.floor(8 + density * 20);
  const maxHeight = size * 0.35;
  const minHeight = size * 0.05;

  // Sort buildings so taller ones are drawn first (farther away)
  interface BuildingDef {
    x: number;
    w: number;
    h: number;
  }
  const buildings: BuildingDef[] = [];

  for (let i = 0; i < buildingCount; i++) {
    const w = size * (0.03 + rand() * 0.06);
    const h = minHeight + rand() * (maxHeight - minHeight) * (0.3 + density * 0.7);
    const x = rand() * (size - w);
    buildings.push({ x, w, h });
  }

  // Draw from tallest to shortest for depth
  buildings.sort((a, b) => b.h - a.h);

  for (const bld of buildings) {
    const y = horizonY - bld.h;

    // Building body
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const shade = 0.7 + rand() * 0.3;
    ctx.fillStyle = `rgb(${Math.floor(r * shade)}, ${Math.floor(g * shade)}, ${Math.floor(b * shade)})`;
    ctx.fillRect(bld.x, y, bld.w, bld.h);

    // Windows (lit at night, dim during day)
    if (bld.h > size * 0.08 && bld.w > size * 0.03) {
      const windowRows = Math.floor(bld.h / 6);
      const windowCols = Math.max(1, Math.floor(bld.w / 5));
      const ww = 2;
      const wh = 2;

      for (let row = 1; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          if (rand() > 0.5) continue; // Skip some windows
          const wx = bld.x + 2 + col * (bld.w / windowCols);
          const wy = y + 3 + row * 5;

          if (time === "night") {
            const brightness = rand() * 0.5 + 0.3;
            const warmth = rand();
            if (warmth > 0.5) {
              ctx.fillStyle = `rgba(255, 230, 120, ${brightness})`;
            } else {
              ctx.fillStyle = `rgba(200, 220, 255, ${brightness * 0.7})`;
            }
          } else if (time === "sunset") {
            ctx.fillStyle = `rgba(255, 200, 100, ${rand() * 0.3 + 0.1})`;
          } else {
            ctx.fillStyle = `rgba(180, 210, 240, ${rand() * 0.2 + 0.1})`;
          }
          ctx.fillRect(wx, wy, ww, wh);
        }
      }
    }
  }
}

// ─── Landmarks ────────────────────────────────────────────────────────────────

function drawLandmark(
  ctx: CanvasRenderingContext2D,
  landmark: LandmarkType,
  size: number,
  horizonY: number,
  baseColor: string,
  accentColor: string,
): void {
  ctx.save();

  // Landmark position: distributed across width based on landmark index in the array
  // (handled externally — here we use a default center position since
  //  the data structure stores landmarks as a flat array without position info)

  switch (landmark) {
    case "opera-house":
      drawOperaHouse(ctx, size, horizonY, accentColor);
      break;
    case "harbour-bridge":
      drawHarbourBridge(ctx, size, horizonY, baseColor);
      break;
    case "big-ben":
      drawBigBen(ctx, size, horizonY, baseColor, accentColor);
      break;
    case "parliament":
      drawParliament(ctx, size, horizonY, baseColor);
      break;
    case "skyscrapers":
      drawSkyscraperCluster(ctx, size, horizonY, baseColor);
      break;
    case "golden-gate":
      drawGoldenGate(ctx, size, horizonY, accentColor);
      break;
    case "sugarloaf":
      drawSugarloaf(ctx, size, horizonY, baseColor);
      break;
    case "christ-redeemer":
      drawChristRedeemer(ctx, size, horizonY, baseColor);
      break;
    case "mount-fuji":
      drawMountFuji(ctx, size, horizonY);
      break;
    case "port-cranes":
      drawPortCranes(ctx, size, horizonY, baseColor);
      break;
    case "church-spires":
      drawChurchSpires(ctx, size, horizonY, baseColor, accentColor);
      break;
    case "mosque":
      drawMosque(ctx, size, horizonY, baseColor, accentColor);
      break;
    case "pagoda":
      drawPagoda(ctx, size, horizonY, baseColor, accentColor);
      break;
    case "palm-trees":
      drawPalmTrees(ctx, size, horizonY);
      break;
    case "mountains":
      drawMountains(ctx, size, horizonY, baseColor);
      break;
    case "pyramids":
      drawPyramids(ctx, size, horizonY, accentColor);
      break;
    case "lighthouse":
      drawLighthouse(ctx, size, horizonY, accentColor);
      break;
  }

  ctx.restore();
}

// ─── Landmark Drawing Functions ───────────────────────────────────────────────

function drawOperaHouse(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.3;
  const baseY = horizonY;

  ctx.fillStyle = color;

  // Draw fan/shell shapes
  for (let i = 0; i < 4; i++) {
    const x = cx + i * size * 0.04 - size * 0.06;
    const shellH = size * (0.1 + i * 0.02);

    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + size * 0.01, baseY - shellH, x + size * 0.04, baseY);
    ctx.fill();
  }

  // Base platform
  ctx.fillStyle = color;
  ctx.fillRect(cx - size * 0.08, baseY - size * 0.02, size * 0.2, size * 0.02);
}

function drawHarbourBridge(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.65;
  const baseY = horizonY;
  const span = size * 0.3;
  const archH = size * 0.15;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Main arch
  ctx.beginPath();
  ctx.moveTo(cx - span / 2, baseY);
  ctx.quadraticCurveTo(cx, baseY - archH, cx + span / 2, baseY);
  ctx.stroke();

  // Road deck
  ctx.fillStyle = color;
  ctx.fillRect(cx - span / 2, baseY - size * 0.01, span, size * 0.015);

  // Pylons
  ctx.fillRect(cx - span / 2 - 3, baseY - size * 0.08, 5, size * 0.08);
  ctx.fillRect(cx + span / 2 - 2, baseY - size * 0.08, 5, size * 0.08);

  // Vertical cables
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    const x = cx - span / 2 + (span / 8) * i + span / 16;
    const t = (i + 0.5) / 8;
    const archY = baseY - archH * 4 * t * (1 - t);
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 0.01);
    ctx.lineTo(x, archY);
    ctx.stroke();
  }
}

function drawBigBen(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string, accent: string): void {
  const cx = size * 0.28;
  const baseY = horizonY;
  const towerW = size * 0.04;
  const towerH = size * 0.28;

  // Tower body
  ctx.fillStyle = color;
  ctx.fillRect(cx - towerW / 2, baseY - towerH, towerW, towerH);

  // Clock face
  const clockR = size * 0.018;
  const clockY = baseY - towerH + size * 0.05;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, clockY, clockR, 0, Math.PI * 2);
  ctx.fill();

  // Spire top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - towerW / 2, baseY - towerH);
  ctx.lineTo(cx, baseY - towerH - size * 0.05);
  ctx.lineTo(cx + towerW / 2, baseY - towerH);
  ctx.fill();
}

function drawParliament(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.52;
  const baseY = horizonY;

  // Long low building
  ctx.fillStyle = color;
  ctx.fillRect(cx - size * 0.12, baseY - size * 0.08, size * 0.24, size * 0.08);

  // Crenellations
  for (let i = 0; i < 8; i++) {
    const x = cx - size * 0.12 + i * size * 0.03;
    ctx.fillRect(x, baseY - size * 0.1, size * 0.02, size * 0.02);
  }

  // Central tower
  ctx.fillRect(cx - size * 0.015, baseY - size * 0.14, size * 0.03, size * 0.06);
}

function drawSkyscraperCluster(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.5;
  const baseY = horizonY;

  const skyscrapers = [
    { dx: -0.08, w: 0.035, h: 0.35 },
    { dx: -0.04, w: 0.03, h: 0.42 },
    { dx: -0.005, w: 0.04, h: 0.38 },
    { dx: 0.04, w: 0.025, h: 0.32 },
    { dx: 0.07, w: 0.03, h: 0.28 },
  ];

  for (const s of skyscrapers) {
    const x = cx + s.dx * size;
    const w = s.w * size;
    const h = s.h * size;

    // Darker shade for depth
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.fillStyle = `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.8)})`;
    ctx.fillRect(x, baseY - h, w, h);

    // Antenna on tallest
    if (s.h > 0.4) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, baseY - h);
      ctx.lineTo(x + w / 2, baseY - h - size * 0.04);
      ctx.stroke();
    }
  }
}

function drawGoldenGate(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.45;
  const baseY = horizonY;
  const span = size * 0.4;
  const towerH = size * 0.25;

  // Towers
  ctx.fillStyle = color;
  const towerW = size * 0.025;
  ctx.fillRect(cx - span * 0.3 - towerW / 2, baseY - towerH, towerW, towerH);
  ctx.fillRect(cx + span * 0.3 - towerW / 2, baseY - towerH, towerW, towerH);

  // Main cables (catenary)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - span / 2, baseY - towerH * 0.6);
  ctx.quadraticCurveTo(cx - span * 0.15, baseY - towerH * 0.3, cx - span * 0.3, baseY - towerH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - span * 0.3, baseY - towerH);
  ctx.quadraticCurveTo(cx, baseY - towerH * 0.5, cx + span * 0.3, baseY - towerH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + span * 0.3, baseY - towerH);
  ctx.quadraticCurveTo(cx + span * 0.15, baseY - towerH * 0.3, cx + span / 2, baseY - towerH * 0.6);
  ctx.stroke();

  // Road deck
  ctx.fillStyle = color;
  ctx.fillRect(cx - span / 2, baseY - size * 0.015, span, size * 0.015);

  // Vertical cables
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = color;
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const x = cx - span / 2 + span * t;
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 0.015);
    ctx.lineTo(x, baseY - towerH * 0.6);
    ctx.stroke();
  }
}

function drawSugarloaf(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.22;
  const baseY = horizonY;

  // Sugarloaf mountain - tall narrow peak
  ctx.fillStyle = blendColor(color, "#2a4a2a", 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.06, baseY);
  ctx.quadraticCurveTo(cx - size * 0.02, baseY - size * 0.22, cx, baseY - size * 0.25);
  ctx.quadraticCurveTo(cx + size * 0.02, baseY - size * 0.22, cx + size * 0.06, baseY);
  ctx.fill();

  // Secondary mountain
  ctx.fillStyle = blendColor(color, "#1a3a1a", 0.4);
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.04, baseY);
  ctx.lineTo(cx + size * 0.12, baseY - size * 0.15);
  ctx.lineTo(cx + size * 0.2, baseY);
  ctx.fill();
}

function drawChristRedeemer(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.38;
  const baseY = horizonY;

  // Mountain underneath
  ctx.fillStyle = blendColor(color, "#2a4a2a", 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.1, baseY);
  ctx.lineTo(cx, baseY - size * 0.2);
  ctx.lineTo(cx + size * 0.1, baseY);
  ctx.fill();

  // Christ statue silhouette (cross shape)
  const statueY = baseY - size * 0.2;
  ctx.fillStyle = blendColor(color, "#4a4a4a", 0.3);

  // Body
  ctx.fillRect(cx - size * 0.005, statueY - size * 0.06, size * 0.01, size * 0.06);
  // Arms
  ctx.fillRect(cx - size * 0.025, statueY - size * 0.055, size * 0.05, size * 0.008);
  // Head
  ctx.beginPath();
  ctx.arc(cx, statueY - size * 0.065, size * 0.008, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountFuji(ctx: CanvasRenderingContext2D, size: number, horizonY: number): void {
  const cx = size * 0.2;
  const baseY = horizonY;
  const peakH = size * 0.3;

  // Mountain body
  ctx.fillStyle = "#3a4a6a";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.18, baseY);
  ctx.lineTo(cx, baseY - peakH);
  ctx.lineTo(cx + size * 0.18, baseY);
  ctx.fill();

  // Snow cap
  ctx.fillStyle = "rgba(220, 230, 240, 0.8)";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.04, baseY - peakH + size * 0.06);
  ctx.lineTo(cx, baseY - peakH);
  ctx.lineTo(cx + size * 0.04, baseY - peakH + size * 0.06);
  ctx.quadraticCurveTo(cx, baseY - peakH + size * 0.04, cx - size * 0.04, baseY - peakH + size * 0.06);
  ctx.fill();
}

function drawPortCranes(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const positions = [0.65, 0.78, 0.88];

  for (const px of positions) {
    const cx = size * px;
    const baseY = horizonY;
    const craneH = size * 0.18;
    const boomL = size * 0.08;

    // Vertical mast
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - craneH);
    ctx.stroke();

    // Boom arm
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - craneH);
    ctx.lineTo(cx + boomL, baseY - craneH + size * 0.03);
    ctx.stroke();

    // Counter-boom
    ctx.beginPath();
    ctx.moveTo(cx, baseY - craneH);
    ctx.lineTo(cx - boomL * 0.4, baseY - craneH + size * 0.01);
    ctx.stroke();

    // Support cable
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - craneH - size * 0.02);
    ctx.lineTo(cx + boomL, baseY - craneH + size * 0.03);
    ctx.stroke();
  }
}

function drawChurchSpires(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string, accent: string): void {
  const positions = [
    { x: 0.3, h: 0.22, w: 0.025 },
    { x: 0.42, h: 0.18, w: 0.02 },
  ];

  for (const pos of positions) {
    const cx = size * pos.x;
    const baseY = horizonY;
    const spireH = size * pos.h;
    const spireW = size * pos.w;

    // Tower body
    ctx.fillStyle = color;
    ctx.fillRect(cx - spireW / 2, baseY - spireH * 0.6, spireW, spireH * 0.6);

    // Pointed spire
    ctx.beginPath();
    ctx.moveTo(cx - spireW / 2, baseY - spireH * 0.6);
    ctx.lineTo(cx, baseY - spireH);
    ctx.lineTo(cx + spireW / 2, baseY - spireH * 0.6);
    ctx.fill();

    // Clock/window
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, baseY - spireH * 0.45, size * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMosque(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string, accent: string): void {
  const cx = size * 0.4;
  const baseY = horizonY;

  // Main dome
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, baseY - size * 0.08, size * 0.06, Math.PI, 0);
  ctx.fill();

  // Building body
  ctx.fillRect(cx - size * 0.07, baseY - size * 0.08, size * 0.14, size * 0.08);

  // Crescent on top
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, baseY - size * 0.15, size * 0.008, 0, Math.PI * 2);
  ctx.fill();

  // Minaret
  ctx.fillStyle = color;
  const minaretX = cx + size * 0.1;
  ctx.fillRect(minaretX - size * 0.008, baseY - size * 0.16, size * 0.016, size * 0.16);

  // Minaret top
  ctx.beginPath();
  ctx.moveTo(minaretX - size * 0.008, baseY - size * 0.16);
  ctx.lineTo(minaretX, baseY - size * 0.19);
  ctx.lineTo(minaretX + size * 0.008, baseY - size * 0.16);
  ctx.fill();

  // Minaret crescent
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(minaretX, baseY - size * 0.195, size * 0.005, 0, Math.PI * 2);
  ctx.fill();
}

function drawPagoda(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string, accent: string): void {
  const cx = size * 0.7;
  const baseY = horizonY;
  const levels = 5;
  const baseW = size * 0.08;
  const levelH = size * 0.025;

  for (let i = 0; i < levels; i++) {
    const w = baseW * (1 - i * 0.15);
    const y = baseY - (i + 1) * levelH;

    // Roof tier
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - size * 0.01, y);
    ctx.lineTo(cx, y - levelH * 0.4);
    ctx.lineTo(cx + w / 2 + size * 0.01, y);
    ctx.fill();

    // Floor
    ctx.fillStyle = accent;
    ctx.fillRect(cx - w / 2 + 2, y, w - 4, levelH * 0.6);
  }

  // Spire
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - (levels + 0.5) * levelH);
  ctx.lineTo(cx, baseY - (levels + 1.5) * levelH);
  ctx.stroke();
}

function drawPalmTrees(ctx: CanvasRenderingContext2D, size: number, horizonY: number): void {
  const positions = [0.12, 0.85];

  for (const px of positions) {
    const cx = size * px;
    const baseY = horizonY;
    const trunkH = size * 0.12;

    // Trunk (slightly curved)
    ctx.strokeStyle = "#3a2a1a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.quadraticCurveTo(cx + size * 0.01, baseY - trunkH * 0.5, cx + size * 0.005, baseY - trunkH);
    ctx.stroke();

    // Fronds
    const topX = cx + size * 0.005;
    const topY = baseY - trunkH;
    ctx.strokeStyle = "#1a4a1a";
    ctx.lineWidth = 1.5;

    const frondAngles = [-2.5, -1.8, -1.0, -0.3, 0.3, 1.0, 1.5];
    for (const angle of frondAngles) {
      const endX = topX + Math.cos(angle) * size * 0.06;
      const endY = topY + Math.sin(angle) * size * 0.04 - size * 0.01;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(angle) * size * 0.04,
        topY - size * 0.02,
        endX,
        endY,
      );
      ctx.stroke();
    }
  }
}

function drawMountains(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const peaks = [
    { x: 0.15, h: 0.2, w: 0.2 },
    { x: 0.35, h: 0.28, w: 0.25 },
    { x: 0.55, h: 0.18, w: 0.2 },
  ];

  for (const peak of peaks) {
    const cx = size * peak.x;
    const peakH = size * peak.h;
    const halfW = size * peak.w / 2;

    ctx.fillStyle = blendColor(color, "#3a4a5a", 0.5);
    ctx.beginPath();
    ctx.moveTo(cx - halfW, horizonY);
    ctx.lineTo(cx, horizonY - peakH);
    ctx.lineTo(cx + halfW, horizonY);
    ctx.fill();

    // Snow cap on taller peaks
    if (peak.h > 0.2) {
      ctx.fillStyle = "rgba(220, 230, 240, 0.6)";
      const snowH = peakH * 0.15;
      const snowW = halfW * 0.2;
      ctx.beginPath();
      ctx.moveTo(cx - snowW, horizonY - peakH + snowH);
      ctx.lineTo(cx, horizonY - peakH);
      ctx.lineTo(cx + snowW, horizonY - peakH + snowH);
      ctx.fill();
    }
  }
}

function drawPyramids(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const pyramids = [
    { x: 0.18, h: 0.2, w: 0.18 },
    { x: 0.32, h: 0.16, w: 0.14 },
    { x: 0.42, h: 0.1, w: 0.1 },
  ];

  for (const p of pyramids) {
    const cx = size * p.x;
    const pH = size * p.h;
    const halfW = size * p.w / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, horizonY);
    ctx.lineTo(cx, horizonY - pH);
    ctx.lineTo(cx + halfW, horizonY);
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, horizonY - pH);
    ctx.lineTo(cx + halfW, horizonY);
    ctx.stroke();
  }
}

function drawLighthouse(ctx: CanvasRenderingContext2D, size: number, horizonY: number, color: string): void {
  const cx = size * 0.82;
  const baseY = horizonY;
  const towerH = size * 0.14;
  const baseW = size * 0.025;
  const topW = size * 0.015;

  // Tapered tower
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - baseW / 2, baseY);
  ctx.lineTo(cx - topW / 2, baseY - towerH);
  ctx.lineTo(cx + topW / 2, baseY - towerH);
  ctx.lineTo(cx + baseW / 2, baseY);
  ctx.fill();

  // Stripes
  ctx.fillStyle = "rgba(200, 50, 50, 0.6)";
  for (let i = 0; i < 3; i++) {
    const y1 = baseY - towerH * (0.2 + i * 0.25);
    const y2 = baseY - towerH * (0.3 + i * 0.25);
    const w1 = baseW / 2 - (baseW - topW) / 2 * (0.2 + i * 0.25);
    const w2 = baseW / 2 - (baseW - topW) / 2 * (0.3 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(cx - w1, y1);
    ctx.lineTo(cx - w2, y2);
    ctx.lineTo(cx + w2, y2);
    ctx.lineTo(cx + w1, y1);
    ctx.fill();
  }

  // Light
  ctx.fillStyle = "rgba(255, 255, 180, 0.8)";
  ctx.beginPath();
  ctx.arc(cx, baseY - towerH - size * 0.008, size * 0.008, 0, Math.PI * 2);
  ctx.fill();

  // Light glow
  ctx.fillStyle = "rgba(255, 255, 180, 0.15)";
  ctx.beginPath();
  ctx.arc(cx, baseY - towerH - size * 0.008, size * 0.025, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function drawFallbackSkyline(ctx: CanvasRenderingContext2D, size: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#1a2a4e");
  gradient.addColorStop(0.5, "#4a6a9a");
  gradient.addColorStop(0.6, "#1a3a5a");
  gradient.addColorStop(1, "#0a1a3a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}
