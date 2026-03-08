/**
 * SpeedSelector — Compact speed selection component for voyage departure.
 *
 * Displays discrete speed presets (Slow / Economy / Standard / Full / Max)
 * with real-time estimates of travel days, fuel consumption, fuel remaining,
 * and charter deadline status.
 */

import { SPEED_PRESETS } from "../../data/constants";
import type { ShipSpec, CharterContract } from "../../data/types";
import { calculateFuelConsumptionAtSpeed } from "../../game/ShipManager";
import { calculateTravelDays } from "../../game/TimeSystem";

/** Result data exposed by the speed selector. */
export interface SpeedSelectionInfo {
  /** The selected cruising speed in knots. */
  speedKnots: number;
  /** Estimated travel days at the selected speed. */
  travelDays: number;
  /** Estimated fuel consumption in tons. */
  fuelNeeded: number;
  /** Whether the ship has enough fuel. */
  hasEnoughFuel: boolean;
}

/** Configuration for the SpeedSelector component. */
export interface SpeedSelectorConfig {
  /** Ship specification for speed/fuel calculations. */
  spec: ShipSpec;
  /** Distance to destination in nautical miles. */
  distanceNm: number;
  /** Current fuel on board in tons. */
  currentFuelTons: number;
  /** Active charter contract (if any) for deadline display. */
  activeCharter?: (CharterContract & { acceptedDay: number }) | null;
  /** Current total days elapsed in the game (for deadline calculation). */
  totalDaysElapsed?: number;
  /** Callback when the speed selection changes. */
  onSpeedChange?: (info: SpeedSelectionInfo) => void;
}

/**
 * Create a speed selector UI component.
 * Returns an HTMLElement and the initial SpeedSelectionInfo.
 */
export function createSpeedSelector(config: SpeedSelectorConfig): {
  element: HTMLElement;
  getSelection: () => SpeedSelectionInfo;
} {
  const { spec, distanceNm, currentFuelTons, activeCharter, totalDaysElapsed, onSpeedChange } = config;

  // Default to "Standard" preset (index 2)
  let selectedIndex = 2;

  const container = document.createElement("div");
  container.className = "speed-selector";

  // Title
  const title = document.createElement("div");
  title.className = "speed-selector-title";
  title.textContent = "Cruising Speed";
  container.appendChild(title);

  // Speed buttons row
  const buttonsRow = document.createElement("div");
  buttonsRow.className = "speed-selector-buttons";

  const buttons: HTMLButtonElement[] = [];

  for (let i = 0; i < SPEED_PRESETS.length; i++) {
    const preset = SPEED_PRESETS[i];
    const btn = document.createElement("button");
    btn.className = "speed-selector-btn" + (i === selectedIndex ? " speed-selector-btn--active" : "");
    const speedKnots = Math.round(spec.maxSpeedKnots * preset.fraction);
    btn.innerHTML = `<span class="speed-preset-label">${preset.label}</span><span class="speed-preset-knots">${speedKnots} kn</span>`;
    btn.addEventListener("click", () => selectPreset(i));
    buttons.push(btn);
    buttonsRow.appendChild(btn);
  }

  container.appendChild(buttonsRow);

  // Estimates panel
  const estimatesPanel = document.createElement("div");
  estimatesPanel.className = "speed-selector-estimates";
  container.appendChild(estimatesPanel);

  function calculateInfo(index: number): SpeedSelectionInfo {
    const preset = SPEED_PRESETS[index];
    const speedKnots = spec.maxSpeedKnots * preset.fraction;
    const travelDays = calculateTravelDays(distanceNm, speedKnots);
    const consumptionPerDay = calculateFuelConsumptionAtSpeed(spec, speedKnots);
    const fuelNeeded = Math.ceil(consumptionPerDay * travelDays);
    const hasEnoughFuel = currentFuelTons >= fuelNeeded;
    return { speedKnots, travelDays, fuelNeeded, hasEnoughFuel };
  }

  function updateEstimates(): void {
    const info = calculateInfo(selectedIndex);
    const fuelRemaining = Math.max(0, currentFuelTons - info.fuelNeeded);

    // Calculate fuel savings compared to max speed
    const maxSpeedInfo = calculateInfo(SPEED_PRESETS.length - 1);
    const fuelSaved = maxSpeedInfo.fuelNeeded - info.fuelNeeded;

    estimatesPanel.innerHTML = "";

    // Travel days row
    const daysRow = createEstimateRow(
      "Travel time",
      `${info.travelDays} days`,
      "",
    );
    estimatesPanel.appendChild(daysRow);

    // Fuel needed row
    const fuelColor = info.hasEnoughFuel ? "var(--color-success, #44ff44)" : "var(--color-danger, #ff4444)";
    const fuelRow = createEstimateRow(
      "Fuel needed",
      `${info.fuelNeeded}t`,
      fuelColor,
    );
    estimatesPanel.appendChild(fuelRow);

    // Fuel remaining row
    const remainColor = fuelRemaining > 0 ? "var(--color-success, #44ff44)" : "var(--color-danger, #ff4444)";
    const remainRow = createEstimateRow(
      "Fuel remaining",
      `${Math.round(fuelRemaining)}t / ${Math.round(currentFuelTons)}t`,
      remainColor,
    );
    estimatesPanel.appendChild(remainRow);

    // Fuel savings row (only show if not at max speed)
    if (fuelSaved > 0) {
      const savingsRow = createEstimateRow(
        "Fuel saved vs max",
        `${fuelSaved}t`,
        "var(--color-gold, #ffaa33)",
      );
      estimatesPanel.appendChild(savingsRow);
    }

    // Charter deadline row (if applicable)
    if (activeCharter && totalDaysElapsed !== undefined) {
      const daysElapsed = totalDaysElapsed - activeCharter.acceptedDay;
      const daysRemaining = activeCharter.deliveryDeadlineDays - daysElapsed;
      const willArrive = info.travelDays <= daysRemaining;
      const isTight = info.travelDays > daysRemaining * 0.8 && willArrive;

      let deadlineColor: string;
      let deadlineText: string;
      if (willArrive && !isTight) {
        deadlineColor = "var(--color-success, #44ff44)";
        deadlineText = `On time (${daysRemaining - info.travelDays}d margin)`;
      } else if (isTight) {
        deadlineColor = "var(--color-gold, #ffaa33)";
        deadlineText = `Tight (${daysRemaining - info.travelDays}d margin)`;
      } else {
        deadlineColor = "var(--color-danger, #ff4444)";
        deadlineText = `LATE by ${info.travelDays - daysRemaining}d`;
      }

      const deadlineRow = createEstimateRow("Deadline", deadlineText, deadlineColor);
      estimatesPanel.appendChild(deadlineRow);
    }

    // Notify callback
    if (onSpeedChange) {
      onSpeedChange(info);
    }
  }

  function createEstimateRow(label: string, value: string, color: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "speed-selector-estimate-row";

    const labelEl = document.createElement("span");
    labelEl.className = "speed-selector-estimate-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "speed-selector-estimate-value";
    valueEl.textContent = value;
    if (color) {
      valueEl.style.color = color;
    }

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  function selectPreset(index: number): void {
    selectedIndex = index;
    // Update button styles
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].className = "speed-selector-btn" + (i === selectedIndex ? " speed-selector-btn--active" : "");
    }
    updateEstimates();
  }

  // Initial render
  updateEstimates();

  return {
    element: container,
    getSelection: () => calculateInfo(selectedIndex),
  };
}
