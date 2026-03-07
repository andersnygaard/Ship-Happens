/**
 * Ship management for Ship Happens.
 * Handles purchasing, repairing, refueling, and tracking ship state.
 */

import { OwnedShip, ShipSpec, CargoType, Port } from "../data/types";
import { getShipSpecById, SHIP_CATALOG } from "../data/ships";
import {
  MAX_CONDITION_PERCENT,
  BASE_FUEL_COST_PER_TON,
  FUEL_COST_MIN_MULTIPLIER,
  FUEL_COST_MAX_MULTIPLIER,
  CONDITION_LOSS_PER_VOYAGE_BASE,
  WEEKS_PER_YEAR,
} from "../data/constants";
import {
  FinancialState,
  debit,
  canAfford,
  addMortgage,
  TransactionResult,
} from "./FinancialSystem";

/** Result of a ship purchase operation. */
export interface PurchaseResult {
  readonly success: boolean;
  readonly ship: OwnedShip | null;
  readonly message: string;
}

/** Result of a repair operation. */
export interface RepairResult {
  readonly success: boolean;
  readonly percentRepaired: number;
  readonly cost: number;
  readonly newCondition: number;
  readonly message: string;
}

/** Result of a refuel operation. */
export interface RefuelResult {
  readonly success: boolean;
  readonly tonsAdded: number;
  readonly cost: number;
  readonly newFuelLevel: number;
  readonly message: string;
}

/** Captain name pool for random assignment. */
const CAPTAIN_NAMES: readonly string[] = [
  "Moby", "Ahab", "Nemo", "Sparrow", "Haddock",
  "Stubb", "Flint", "Bligh", "Hook", "Drake",
  "Barbossa", "Hornblower", "Pugwash", "Sinbad", "Vega",
];

let captainNameIndex = 0;

/**
 * Get the next captain name from the pool (cycles through).
 */
function getNextCaptainName(): string {
  const name = CAPTAIN_NAMES[captainNameIndex % CAPTAIN_NAMES.length];
  captainNameIndex++;
  return name;
}

/**
 * Get the list of available ships from the catalog.
 */
export function getAvailableShips(): readonly ShipSpec[] {
  return SHIP_CATALOG;
}

/**
 * Purchase a ship with deposit/mortgage system.
 * @param specId - The ship spec ID from the catalog
 * @param name - Player-chosen ship name (will be prefixed with "MS ")
 * @param depositPercent - Percentage of price to pay as deposit (must be >= ship's minimum)
 * @param finances - The player's financial state
 * @param homePortId - The port where the ship will be initially located
 * @param time - Current game time for ledger entries
 */
export function purchaseShip(
  specId: string,
  name: string,
  depositPercent: number,
  finances: FinancialState,
  homePortId: string,
  time: { week: number; year: number },
): PurchaseResult {
  const spec = getShipSpecById(specId);
  if (!spec) {
    return { success: false, ship: null, message: `Unknown ship type: ${specId}` };
  }

  // Validate deposit percentage
  if (depositPercent < spec.depositPercent) {
    return {
      success: false,
      ship: null,
      message: `Minimum deposit is ${spec.depositPercent}%. You offered ${depositPercent}%.`,
    };
  }
  if (depositPercent > 100) {
    return { success: false, ship: null, message: "Deposit cannot exceed 100%." };
  }

  const priceDollars = spec.priceMillions * 1_000_000;
  const depositAmount = Math.round(priceDollars * (depositPercent / 100));
  const mortgageAmount = priceDollars - depositAmount;

  // Check if player can afford the deposit
  if (!canAfford(finances, depositAmount)) {
    return {
      success: false,
      ship: null,
      message: "Do us a favor, will you? Try to get some cash before you try to buy something next time!",
    };
  }

  // Debit the deposit
  const debitResult = debit(finances, depositAmount, `Ship deposit for MS ${name} (${depositPercent}%)`, time);
  if (!debitResult.success) {
    return { success: false, ship: null, message: debitResult.message };
  }

  // Record mortgage if any
  const shipKey = `${specId}-${name}`;
  if (mortgageAmount > 0) {
    addMortgage(finances, shipKey, mortgageAmount);
  }

  const mortgagePercent = 100 - depositPercent;

  // Calculate weekly mortgage payment (spread over 5 years = 260 weeks)
  const mortgageTermWeeks = 5 * WEEKS_PER_YEAR;
  const weeklyPayment = mortgageAmount > 0 ? Math.round(mortgageAmount / mortgageTermWeeks) : 0;

  const ship: OwnedShip = {
    specId,
    name: `MS ${name}`,
    captainName: getNextCaptainName(),
    conditionPercent: MAX_CONDITION_PERCENT,
    fuelTons: spec.bunkerCapacityTons, // New ships come fully fueled
    currentPortId: homePortId,
    cargoType: null,
    cargoDestinationPortId: null,
    isLaidUp: false,
    mortgagePercent,
    mortgageRemaining: mortgageAmount,
    mortgagePayment: weeklyPayment,
    purchaseWeek: time.week,
    purchaseYear: time.year,
  };

  return {
    success: true,
    ship,
    message: `Welcome, shipowner! MS ${name} is now part of your fleet. Mortgage: ${mortgagePercent}%.`,
  };
}

/**
 * Repair a ship at the current port.
 * @param ship - The ship to repair
 * @param percentToRepair - How many percentage points to repair
 * @param port - The port where repair happens (determines cost per percent)
 * @param finances - Player's financial state
 * @param time - Current game time
 */
export function repairShip(
  ship: OwnedShip,
  percentToRepair: number,
  port: Port,
  finances: FinancialState,
  time: { week: number; year: number },
): RepairResult {
  if (!ship.currentPortId) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: ship.conditionPercent, message: "Ship is at sea." };
  }

  const maxRepairable = MAX_CONDITION_PERCENT - ship.conditionPercent;
  if (maxRepairable <= 0) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: ship.conditionPercent, message: "Ship is already at 100% condition." };
  }

  const actualRepair = Math.min(Math.max(0, Math.round(percentToRepair)), maxRepairable);
  if (actualRepair <= 0) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: ship.conditionPercent, message: "Nothing to repair." };
  }

  const cost = actualRepair * port.repairCostPerPercent;

  if (!canAfford(finances, cost)) {
    return {
      success: false,
      percentRepaired: 0,
      cost,
      newCondition: ship.conditionPercent,
      message: `Insufficient funds. Repair cost: $${cost.toLocaleString()}.`,
    };
  }

  const debitResult = debit(finances, cost, `Repair ${ship.name} by ${actualRepair}% at ${port.name}`, time);
  if (!debitResult.success) {
    return { success: false, percentRepaired: 0, cost, newCondition: ship.conditionPercent, message: debitResult.message };
  }

  ship.conditionPercent += actualRepair;

  return {
    success: true,
    percentRepaired: actualRepair,
    cost,
    newCondition: ship.conditionPercent,
    message: `Repaired ${ship.name} by ${actualRepair}%. New condition: ${ship.conditionPercent}%. Cost: $${cost.toLocaleString()}.`,
  };
}

/**
 * Calculate fuel cost per ton at a given port.
 * Each port has a slightly different price based on a seeded variance.
 */
export function getFuelCostPerTon(portId: string): number {
  // Simple deterministic variance based on port ID hash
  let hash = 0;
  for (let i = 0; i < portId.length; i++) {
    hash = ((hash << 5) - hash + portId.charCodeAt(i)) | 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000;
  const multiplier = FUEL_COST_MIN_MULTIPLIER + normalized * (FUEL_COST_MAX_MULTIPLIER - FUEL_COST_MIN_MULTIPLIER);
  return Math.round(BASE_FUEL_COST_PER_TON * multiplier);
}

/**
 * Refuel a ship at the current port.
 * @param ship - The ship to refuel
 * @param tonsToAdd - How many tons of fuel to add
 * @param finances - Player's financial state
 * @param time - Current game time
 */
export function refuelShip(
  ship: OwnedShip,
  tonsToAdd: number,
  finances: FinancialState,
  time: { week: number; year: number },
): RefuelResult {
  if (!ship.currentPortId) {
    return { success: false, tonsAdded: 0, cost: 0, newFuelLevel: ship.fuelTons, message: "Ship is at sea." };
  }

  const spec = getShipSpecById(ship.specId);
  if (!spec) {
    return { success: false, tonsAdded: 0, cost: 0, newFuelLevel: ship.fuelTons, message: "Unknown ship spec." };
  }

  const maxAddable = spec.bunkerCapacityTons - ship.fuelTons;
  if (maxAddable <= 0) {
    return { success: false, tonsAdded: 0, cost: 0, newFuelLevel: ship.fuelTons, message: "Fuel tanks are already full." };
  }

  const actualTons = Math.min(Math.max(0, Math.round(tonsToAdd)), maxAddable);
  if (actualTons <= 0) {
    return { success: false, tonsAdded: 0, cost: 0, newFuelLevel: ship.fuelTons, message: "Nothing to refuel." };
  }

  const costPerTon = getFuelCostPerTon(ship.currentPortId);
  const cost = actualTons * costPerTon;

  if (!canAfford(finances, cost)) {
    return {
      success: false,
      tonsAdded: 0,
      cost,
      newFuelLevel: ship.fuelTons,
      message: `Insufficient funds. Fuel cost: $${cost.toLocaleString()}.`,
    };
  }

  const debitResult = debit(finances, cost, `Refuel ${ship.name} with ${actualTons}t`, time);
  if (!debitResult.success) {
    return { success: false, tonsAdded: 0, cost, newFuelLevel: ship.fuelTons, message: debitResult.message };
  }

  ship.fuelTons += actualTons;

  return {
    success: true,
    tonsAdded: actualTons,
    cost,
    newFuelLevel: ship.fuelTons,
    message: `Refueled ${ship.name} with ${actualTons}t. Cost: $${cost.toLocaleString()}.`,
  };
}

/**
 * Set a ship to laid up status.
 */
export function layUpShip(ship: OwnedShip): void {
  ship.isLaidUp = true;
}

/**
 * Reactivate a laid up ship.
 */
export function reactivateShip(ship: OwnedShip): void {
  ship.isLaidUp = false;
}

/**
 * Load cargo onto a ship (after accepting a charter contract).
 */
export function loadCargo(
  ship: OwnedShip,
  cargoType: CargoType,
  destinationPortId: string,
): { success: boolean; message: string } {
  if (!ship.currentPortId) {
    return { success: false, message: "Ship is at sea." };
  }
  if (ship.cargoType !== null && ship.cargoType !== CargoType.Ballast) {
    return { success: false, message: "Ship already has cargo loaded." };
  }
  if (ship.isLaidUp) {
    return { success: false, message: "Ship is laid up. Reactivate it first." };
  }

  ship.cargoType = cargoType;
  ship.cargoDestinationPortId = destinationPortId;

  return { success: true, message: `Loaded ${cargoType} onto ${ship.name}. Destination: ${destinationPortId}.` };
}

/**
 * Unload cargo from a ship (when arriving at destination).
 */
export function unloadCargo(ship: OwnedShip): { success: boolean; cargoType: CargoType | null; message: string } {
  if (ship.cargoType === null || ship.cargoType === CargoType.Ballast) {
    return { success: false, cargoType: null, message: "No cargo to unload." };
  }

  const cargoType = ship.cargoType;
  ship.cargoType = null;
  ship.cargoDestinationPortId = null;

  return { success: true, cargoType, message: `Unloaded ${cargoType} from ${ship.name}.` };
}

/**
 * Apply voyage wear on ship condition.
 * Called when a voyage is completed.
 */
export function applyVoyageWear(ship: OwnedShip, additionalLoss: number = 0): void {
  const totalLoss = CONDITION_LOSS_PER_VOYAGE_BASE + additionalLoss;
  ship.conditionPercent = Math.max(0, ship.conditionPercent - totalLoss);
}

/**
 * Consume fuel during a voyage.
 * @param ship - The ship consuming fuel
 * @param days - Number of days of travel
 * @returns The actual fuel consumed (may be less than needed if tank runs dry)
 */
export function consumeFuel(ship: OwnedShip, days: number): { consumed: number; ranOutOfFuel: boolean } {
  const spec = getShipSpecById(ship.specId);
  if (!spec) {
    return { consumed: 0, ranOutOfFuel: false };
  }

  const needed = Math.round(spec.fuelConsumptionTonsPerDay * days);
  const consumed = Math.min(needed, ship.fuelTons);
  ship.fuelTons -= consumed;

  return { consumed, ranOutOfFuel: consumed < needed };
}

/**
 * Calculate daily operating cost for a ship.
 */
export function getDailyOperatingCost(ship: OwnedShip): number {
  const spec = getShipSpecById(ship.specId);
  if (!spec) return 0;
  // Laid up ships cost half to operate (maintenance only)
  return ship.isLaidUp ? Math.round(spec.dailyOperatingCosts / 2) : spec.dailyOperatingCosts;
}

/**
 * Get the ShipSpec for an owned ship.
 */
export function getShipSpec(ship: OwnedShip): ShipSpec | undefined {
  return getShipSpecById(ship.specId);
}

/** Result of a ship sale valuation. */
export interface ShipValuation {
  readonly originalPrice: number;
  readonly conditionFactor: number;
  readonly ageFactor: number;
  readonly salePrice: number;
}

/**
 * Calculate the current market value of a ship for selling.
 * Sale price = originalPrice * conditionFactor * ageFactor
 * - conditionFactor: conditionPercent / 100 (0.0 - 1.0)
 * - ageFactor: depreciates from 0.8 down to 0.5 over time (about 0.02 per year)
 * Overall sale returns 50-80% of original price depending on condition and age.
 */
export function calculateShipValue(
  ship: OwnedShip,
  currentWeek: number,
  currentYear: number,
): ShipValuation {
  const spec = getShipSpecById(ship.specId);
  if (!spec) {
    return { originalPrice: 0, conditionFactor: 0, ageFactor: 0, salePrice: 0 };
  }

  const originalPrice = spec.priceMillions * 1_000_000;
  const conditionFactor = ship.conditionPercent / 100;

  // Calculate age in years (fractional)
  const totalWeeksOwned =
    (currentYear * WEEKS_PER_YEAR + currentWeek) -
    (ship.purchaseYear * WEEKS_PER_YEAR + ship.purchaseWeek);
  const ageYears = Math.max(0, totalWeeksOwned / WEEKS_PER_YEAR);

  // Age depreciation: starts at 0.8 and drops by 0.02 per year, minimum 0.5
  const ageFactor = Math.max(0.5, 0.8 - ageYears * 0.02);

  const salePrice = Math.round(originalPrice * conditionFactor * ageFactor);

  return { originalPrice, conditionFactor, ageFactor, salePrice };
}
