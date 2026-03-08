/**
 * VoyageEstimator — Pure calculation functions for voyage cost estimation.
 *
 * Computes estimated fuel cost, operating costs, total costs, and net profit
 * for a voyage given ship specs, distance, fuel price, and speed.
 * All functions are pure (no side effects) and unit-testable.
 */

import type { ShipSpec } from "../data/types";
import { calculateTravelDays } from "./TimeSystem";
import { calculateFuelConsumptionAtSpeed } from "./ShipManager";

/** Result of a voyage cost/profit estimate. */
export interface VoyageEstimate {
  /** Estimated travel time in days. */
  readonly travelDays: number;
  /** Estimated fuel consumption in tons. */
  readonly fuelNeeded: number;
  /** Estimated fuel cost in dollars. */
  readonly fuelCost: number;
  /** Estimated operating costs in dollars (crew, maintenance, etc.). */
  readonly operatingCosts: number;
  /** Total estimated costs (fuel + operating). */
  readonly totalCosts: number;
}

/** Full profitability estimate including revenue and margin. */
export interface VoyageProfitability {
  /** The underlying cost estimate. */
  readonly estimate: VoyageEstimate;
  /** Charter rate (revenue) in dollars. */
  readonly revenue: number;
  /** Net estimated profit (revenue - totalCosts). */
  readonly netProfit: number;
  /** Profit margin as a percentage of revenue. */
  readonly profitMarginPercent: number;
}

/**
 * Calculate voyage cost estimate.
 * Pure function — no side effects, no external state.
 *
 * @param spec - Ship specification (speed, consumption, operating costs)
 * @param distanceNm - Distance to destination in nautical miles
 * @param fuelCostPerTon - Fuel price per ton at the departure port (in dollars)
 * @param speedKnots - Cruising speed in knots (defaults to max speed)
 * @returns VoyageEstimate with all cost components
 */
export function calculateVoyageEstimate(
  spec: ShipSpec,
  distanceNm: number,
  fuelCostPerTon: number,
  speedKnots?: number,
): VoyageEstimate {
  const effectiveSpeed = speedKnots ?? spec.maxSpeedKnots;
  const travelDays = calculateTravelDays(distanceNm, effectiveSpeed);
  const consumptionPerDay = calculateFuelConsumptionAtSpeed(spec, effectiveSpeed);
  const fuelNeeded = Math.ceil(consumptionPerDay * travelDays);
  const fuelCost = Math.round(fuelNeeded * fuelCostPerTon);
  const operatingCosts = Math.round(spec.dailyOperatingCosts * travelDays);
  const totalCosts = fuelCost + operatingCosts;

  return {
    travelDays,
    fuelNeeded,
    fuelCost,
    operatingCosts,
    totalCosts,
  };
}

/**
 * Calculate full profitability estimate for a charter contract.
 * Combines voyage cost estimate with charter revenue.
 *
 * @param spec - Ship specification
 * @param distanceNm - Distance to destination in nautical miles
 * @param fuelCostPerTon - Fuel price per ton at the departure port
 * @param charterRate - Charter contract rate (revenue) in dollars
 * @param speedKnots - Cruising speed in knots (defaults to max speed)
 * @returns VoyageProfitability with revenue, costs, and margin
 */
export function calculateVoyageProfitability(
  spec: ShipSpec,
  distanceNm: number,
  fuelCostPerTon: number,
  charterRate: number,
  speedKnots?: number,
): VoyageProfitability {
  const estimate = calculateVoyageEstimate(spec, distanceNm, fuelCostPerTon, speedKnots);
  const netProfit = charterRate - estimate.totalCosts;
  const profitMarginPercent = charterRate > 0
    ? Math.round((netProfit / charterRate) * 100)
    : 0;

  return {
    estimate,
    revenue: charterRate,
    netProfit,
    profitMarginPercent,
  };
}

/**
 * Get the effective fuel cost per ton at a port, accounting for world event multipliers.
 *
 * @param baseFuelCostPerTon - Base fuel cost per ton at the port
 * @param costMultiplier - World event cost multiplier (1.0 = normal)
 * @returns Adjusted fuel cost per ton
 */
export function getAdjustedFuelCost(
  baseFuelCostPerTon: number,
  costMultiplier: number,
): number {
  return Math.round(baseFuelCostPerTon * costMultiplier);
}
