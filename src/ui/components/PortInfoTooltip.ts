/**
 * PortInfoTooltip — Expanded port information panel for the world map.
 * Shows strategic data: repair cost, fuel cost, cargo types, distance,
 * travel time, world events, and need-based indicators.
 */

import type { Port, OwnedShip, ShipSpec } from "../../data/types";
import type { WorldEvent } from "../../game/WorldEvents";
import { getPortCostMultiplier, getEventsAffectingPort, isPortBlocked } from "../../game/WorldEvents";
import { getFuelCostPerTon } from "../../game/ShipManager";
import { calculateDistanceNm } from "../../game/CharterSystem";
import { calculateTravelDays } from "../../game/TimeSystem";
import { getPortById, PORTS } from "../../data/ports";
import { WEEKS_PER_YEAR } from "../../data/constants";

/** Data needed to render the port info tooltip. */
export interface PortInfoTooltipData {
  port: Port;
  activeShip: OwnedShip | null;
  shipSpec: ShipSpec | null;
  originPort: Port | null;
  worldEvents: readonly WorldEvent[];
  currentWeek: number;
  currentYear: number;
}

/** Result of cheapest-port analysis. */
export interface CheapestPortInfo {
  cheapestRepairPortId: string | null;
  cheapestFuelPortId: string | null;
}

/**
 * Find the cheapest repair and fuel ports among all non-blocked ports.
 * Considers world event cost multipliers.
 */
export function findCheapestPorts(
  worldEvents: readonly WorldEvent[],
): CheapestPortInfo {
  let cheapestRepairCost = Infinity;
  let cheapestRepairPortId: string | null = null;
  let cheapestFuelCost = Infinity;
  let cheapestFuelPortId: string | null = null;

  for (const port of PORTS) {
    if (isPortBlocked(port.id, worldEvents)) continue;

    const costMult = getPortCostMultiplier(port.id, worldEvents);

    const effectiveRepairCost = port.repairCostPerPercent * costMult;
    if (effectiveRepairCost < cheapestRepairCost) {
      cheapestRepairCost = effectiveRepairCost;
      cheapestRepairPortId = port.id;
    }

    const effectiveFuelCost = getFuelCostPerTon(port.id) * costMult;
    if (effectiveFuelCost < cheapestFuelCost) {
      cheapestFuelCost = effectiveFuelCost;
      cheapestFuelPortId = port.id;
    }
  }

  return { cheapestRepairPortId, cheapestFuelPortId };
}

/**
 * Calculate the average repair cost across all non-blocked ports.
 */
export function getAverageRepairCost(worldEvents: readonly WorldEvent[]): number {
  let total = 0;
  let count = 0;
  for (const port of PORTS) {
    if (isPortBlocked(port.id, worldEvents)) continue;
    const costMult = getPortCostMultiplier(port.id, worldEvents);
    total += port.repairCostPerPercent * costMult;
    count++;
  }
  return count > 0 ? total / count : 0;
}

/**
 * Calculate the average fuel cost across all non-blocked ports.
 */
export function getAverageFuelCost(worldEvents: readonly WorldEvent[]): number {
  let total = 0;
  let count = 0;
  for (const port of PORTS) {
    if (isPortBlocked(port.id, worldEvents)) continue;
    const costMult = getPortCostMultiplier(port.id, worldEvents);
    total += getFuelCostPerTon(port.id) * costMult;
    count++;
  }
  return count > 0 ? total / count : 0;
}

/**
 * Create the expanded port info tooltip element.
 */
export function createPortInfoTooltip(data: PortInfoTooltipData): HTMLElement {
  const { port, activeShip, shipSpec, originPort, worldEvents, currentWeek, currentYear } = data;

  const container = document.createElement("div");
  container.className = "port-info-tooltip";

  const blocked = isPortBlocked(port.id, worldEvents);
  const costMultiplier = getPortCostMultiplier(port.id, worldEvents);

  // ── Header: Port name and country ──
  const header = document.createElement("div");
  header.className = "port-info-tooltip-header";

  const nameEl = document.createElement("span");
  nameEl.className = "port-info-tooltip-name";
  nameEl.textContent = port.name;
  header.appendChild(nameEl);

  const countryEl = document.createElement("span");
  countryEl.className = "port-info-tooltip-country";
  countryEl.textContent = port.country;
  header.appendChild(countryEl);

  if (blocked) {
    const blockedBadge = document.createElement("span");
    blockedBadge.className = "port-info-tooltip-blocked";
    blockedBadge.textContent = "BLOCKED";
    header.appendChild(blockedBadge);
  }

  container.appendChild(header);

  // ── Distance and travel time ──
  if (activeShip && shipSpec && originPort && originPort.id !== port.id) {
    const distanceNm = calculateDistanceNm(originPort, port);
    const travelDays = calculateTravelDays(distanceNm, shipSpec.maxSpeedKnots);

    const travelRow = document.createElement("div");
    travelRow.className = "port-info-tooltip-row";
    travelRow.innerHTML =
      `<span class="port-info-tooltip-label">Distance:</span>` +
      `<span class="port-info-tooltip-value">${distanceNm.toLocaleString()} nm (~${travelDays} days)</span>`;
    container.appendChild(travelRow);
  }

  // ── Repair cost ──
  const effectiveRepairCost = Math.round(port.repairCostPerPercent * costMultiplier);
  const repairRow = document.createElement("div");
  repairRow.className = "port-info-tooltip-row";
  const repairLabel = costMultiplier > 1
    ? `$${effectiveRepairCost.toLocaleString()}/% <span class="port-info-tooltip-surcharge">(+${Math.round((costMultiplier - 1) * 100)}%)</span>`
    : `$${effectiveRepairCost.toLocaleString()}/%`;
  repairRow.innerHTML =
    `<span class="port-info-tooltip-label">Repair:</span>` +
    `<span class="port-info-tooltip-value">${repairLabel}</span>`;
  container.appendChild(repairRow);

  // ── Fuel cost ──
  const baseFuelCost = getFuelCostPerTon(port.id);
  const effectiveFuelCost = Math.round(baseFuelCost * costMultiplier);
  const fuelRow = document.createElement("div");
  fuelRow.className = "port-info-tooltip-row";
  const fuelLabel = costMultiplier > 1
    ? `$${effectiveFuelCost.toLocaleString()}/ton <span class="port-info-tooltip-surcharge">(+${Math.round((costMultiplier - 1) * 100)}%)</span>`
    : `$${effectiveFuelCost.toLocaleString()}/ton`;
  fuelRow.innerHTML =
    `<span class="port-info-tooltip-label">Fuel:</span>` +
    `<span class="port-info-tooltip-value">${fuelLabel}</span>`;
  container.appendChild(fuelRow);

  // ── Cheapest indicators ──
  const cheapest = findCheapestPorts(worldEvents);
  if (cheapest.cheapestRepairPortId === port.id) {
    const badge = document.createElement("div");
    badge.className = "port-info-tooltip-badge port-info-tooltip-badge-repair";
    badge.textContent = "Cheapest Repairs";
    container.appendChild(badge);
  }
  if (cheapest.cheapestFuelPortId === port.id) {
    const badge = document.createElement("div");
    badge.className = "port-info-tooltip-badge port-info-tooltip-badge-fuel";
    badge.textContent = "Cheapest Fuel";
    container.appendChild(badge);
  }

  // ── Cargo types ──
  const cargoRow = document.createElement("div");
  cargoRow.className = "port-info-tooltip-row port-info-tooltip-cargo-row";
  const cargoLabel = document.createElement("span");
  cargoLabel.className = "port-info-tooltip-label";
  cargoLabel.textContent = "Cargo:";
  cargoRow.appendChild(cargoLabel);

  const cargoList = document.createElement("span");
  cargoList.className = "port-info-tooltip-value port-info-tooltip-cargo-list";
  cargoList.textContent = port.availableCargoTypes.length > 0
    ? port.availableCargoTypes.join(", ")
    : "None";
  cargoRow.appendChild(cargoList);
  container.appendChild(cargoRow);

  // ── World events affecting this port ──
  const portEvents = getEventsAffectingPort(port.id, worldEvents);
  if (portEvents.length > 0) {
    const eventsSection = document.createElement("div");
    eventsSection.className = "port-info-tooltip-events";

    for (const evt of portEvents) {
      const eventEl = document.createElement("div");
      eventEl.className = "port-info-tooltip-event";

      const elapsedWeeks = (currentYear - evt.startYear) * WEEKS_PER_YEAR + (currentWeek - evt.startWeek);
      const remainingWeeks = Math.max(0, evt.durationWeeks - elapsedWeeks);

      let eventText = evt.headline;
      if (evt.costMultiplier > 1) {
        eventText += ` (+${Math.round((evt.costMultiplier - 1) * 100)}% costs)`;
      }
      if (evt.blocksPort) {
        eventText += " [PORT BLOCKED]";
      }
      eventText += ` — ${remainingWeeks} week${remainingWeeks !== 1 ? "s" : ""} remaining`;

      eventEl.textContent = eventText;
      eventsSection.appendChild(eventEl);
    }

    container.appendChild(eventsSection);
  }

  return container;
}

/** Data for port comparison table rows. */
export interface PortComparisonRow {
  port: Port;
  distanceNm: number | null;
  travelDays: number | null;
  repairCost: number;
  fuelCost: number;
  cargoTypeCount: number;
  blocked: boolean;
  hasEvent: boolean;
  isCheapestRepair: boolean;
  isCheapestFuel: boolean;
}

/**
 * Build comparison data for all ports.
 */
export function buildPortComparisonData(
  originPort: Port | null,
  shipSpec: ShipSpec | null,
  worldEvents: readonly WorldEvent[],
): PortComparisonRow[] {
  const cheapest = findCheapestPorts(worldEvents);

  return PORTS.map((port) => {
    const blocked = isPortBlocked(port.id, worldEvents);
    const costMult = getPortCostMultiplier(port.id, worldEvents);

    let distanceNm: number | null = null;
    let travelDays: number | null = null;
    if (originPort && originPort.id !== port.id) {
      distanceNm = calculateDistanceNm(originPort, port);
      if (shipSpec) {
        travelDays = calculateTravelDays(distanceNm, shipSpec.maxSpeedKnots);
      }
    }

    return {
      port,
      distanceNm,
      travelDays,
      repairCost: Math.round(port.repairCostPerPercent * costMult),
      fuelCost: Math.round(getFuelCostPerTon(port.id) * costMult),
      cargoTypeCount: port.availableCargoTypes.length,
      blocked,
      hasEvent: getEventsAffectingPort(port.id, worldEvents).length > 0,
      isCheapestRepair: cheapest.cheapestRepairPortId === port.id,
      isCheapestFuel: cheapest.cheapestFuelPortId === port.id,
    };
  });
}

export type SortColumn = "name" | "distance" | "repairCost" | "fuelCost" | "cargoTypes";
export type SortDirection = "asc" | "desc";

/**
 * Create the Compare Ports panel with a sortable table.
 */
export function createComparePortsPanel(
  originPort: Port | null,
  shipSpec: ShipSpec | null,
  worldEvents: readonly WorldEvent[],
  onPortSelect: (port: Port) => void,
  onClose: () => void,
): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "compare-ports-panel";

  // Header
  const headerBar = document.createElement("div");
  headerBar.className = "compare-ports-header";

  const title = document.createElement("span");
  title.className = "compare-ports-title";
  title.textContent = "Compare Ports";
  headerBar.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary compare-ports-close";
  closeBtn.textContent = "X";
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", onClose);
  headerBar.appendChild(closeBtn);

  panel.appendChild(headerBar);

  // Build data
  const rows = buildPortComparisonData(originPort, shipSpec, worldEvents);

  // State
  let sortColumn: SortColumn = "name";
  let sortDirection: SortDirection = "asc";

  const tableContainer = document.createElement("div");
  tableContainer.className = "compare-ports-table-container";
  panel.appendChild(tableContainer);

  function renderTable(): void {
    tableContainer.innerHTML = "";

    // Sort rows
    const sorted = [...rows].filter((r) => !r.blocked).sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = a.port.name.localeCompare(b.port.name);
          break;
        case "distance":
          cmp = (a.distanceNm ?? Infinity) - (b.distanceNm ?? Infinity);
          break;
        case "repairCost":
          cmp = a.repairCost - b.repairCost;
          break;
        case "fuelCost":
          cmp = a.fuelCost - b.fuelCost;
          break;
        case "cargoTypes":
          cmp = a.cargoTypeCount - b.cargoTypeCount;
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    // Add blocked ports at the end
    const blockedRows = rows.filter((r) => r.blocked);
    const allSorted = [...sorted, ...blockedRows];

    const table = document.createElement("table");
    table.className = "compare-ports-table";

    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const columns: { key: SortColumn; label: string }[] = [
      { key: "name", label: "Port" },
      { key: "distance", label: "Distance" },
      { key: "repairCost", label: "Repair/%" },
      { key: "fuelCost", label: "Fuel/ton" },
      { key: "cargoTypes", label: "Cargo" },
    ];

    for (const col of columns) {
      const th = document.createElement("th");
      th.className = "compare-ports-th";
      th.textContent = col.label;
      if (sortColumn === col.key) {
        th.textContent += sortDirection === "asc" ? " ^" : " v";
      }
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        if (sortColumn === col.key) {
          sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
          sortColumn = col.key;
          sortDirection = "asc";
        }
        renderTable();
      });
      headerRow.appendChild(th);
    }

    // Events column (not sortable)
    const evtTh = document.createElement("th");
    evtTh.className = "compare-ports-th";
    evtTh.textContent = "Events";
    headerRow.appendChild(evtTh);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");

    for (const row of allSorted) {
      const tr = document.createElement("tr");
      tr.className = "compare-ports-row";
      if (row.blocked) {
        tr.classList.add("compare-ports-row-blocked");
      }

      tr.style.cursor = row.blocked ? "not-allowed" : "pointer";
      if (!row.blocked) {
        tr.addEventListener("click", () => onPortSelect(row.port));
      }

      // Port name
      const nameTd = document.createElement("td");
      let nameText = row.port.name;
      if (row.isCheapestRepair) nameText += " [R]";
      if (row.isCheapestFuel) nameText += " [F]";
      nameTd.textContent = nameText;
      nameTd.title = row.port.country;
      tr.appendChild(nameTd);

      // Distance
      const distTd = document.createElement("td");
      distTd.textContent = row.distanceNm != null ? `${row.distanceNm.toLocaleString()} nm` : "—";
      tr.appendChild(distTd);

      // Repair cost
      const repairTd = document.createElement("td");
      repairTd.textContent = `$${row.repairCost.toLocaleString()}`;
      if (row.isCheapestRepair) repairTd.classList.add("compare-ports-cheapest");
      tr.appendChild(repairTd);

      // Fuel cost
      const fuelTd = document.createElement("td");
      fuelTd.textContent = `$${row.fuelCost.toLocaleString()}`;
      if (row.isCheapestFuel) fuelTd.classList.add("compare-ports-cheapest");
      tr.appendChild(fuelTd);

      // Cargo types
      const cargoTd = document.createElement("td");
      cargoTd.textContent = String(row.cargoTypeCount);
      cargoTd.title = row.port.availableCargoTypes.join(", ");
      tr.appendChild(cargoTd);

      // Events
      const eventTd = document.createElement("td");
      if (row.blocked) {
        eventTd.textContent = "BLOCKED";
        eventTd.classList.add("compare-ports-blocked-text");
      } else if (row.hasEvent) {
        eventTd.textContent = "Active";
        eventTd.classList.add("compare-ports-event-text");
      } else {
        eventTd.textContent = "—";
      }
      tr.appendChild(eventTd);

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }

  renderTable();

  return panel;
}
