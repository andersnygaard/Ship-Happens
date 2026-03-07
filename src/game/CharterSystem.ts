/**
 * Charter system for Ship Happens.
 * Generates freight contracts based on available cargo at the current port,
 * with rates correlated to distance, deadlines, and penalties.
 */

import { CharterContract, CargoType, Port } from "../data/types";
import { PORTS, getPortById } from "../data/ports";
import {
  CHARTER_RATE_PER_NM_PER_BRT,
  LATE_DELIVERY_PENALTY_RATE,
  MIN_DELIVERY_DEADLINE_DAYS,
  MAX_DELIVERY_DEADLINE_DAYS,
  MAX_CHARTER_OPTIONS,
} from "../data/constants";
import { getRandomFunnyCargoDescription } from "../data/humorTexts";

/**
 * Calculate the great-circle distance between two ports in nautical miles.
 * Uses the Haversine formula on lat/lng coordinates.
 */
export function calculateDistanceNm(portA: Port, portB: Port): number {
  const R_NM = 3440.065; // Earth radius in nautical miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(portA.lat);
  const lat2 = toRad(portB.lat);
  const dLat = toRad(portB.lat - portA.lat);
  const dLng = toRad(portB.lng - portA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Apply a 1.3x multiplier to approximate actual sea routes (shipping lanes aren't straight lines)
  return Math.round(R_NM * c * 1.3);
}

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Produces deterministic results for the same seed.
 */
function seededRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seed from port ID and game time for deterministic charter offers.
 */
function generateSeed(portId: string, week: number, year: number): number {
  let hash = 0;
  const str = `${portId}-${week}-${year}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Cargo type multipliers for charter rate calculation.
 * Higher-value cargo pays more per unit distance.
 */
const CARGO_RATE_MULTIPLIERS: Record<CargoType, number> = {
  [CargoType.AgriculturalProduce]: 0.85,
  [CargoType.Chemicals]: 1.15,
  [CargoType.Electronics]: 1.30,
  [CargoType.Machinery]: 1.10,
  [CargoType.Equipment]: 1.05,
  [CargoType.Metalware]: 0.95,
  [CargoType.PlasticsProducts]: 0.90,
  [CargoType.Textiles]: 1.00,
  [CargoType.Ballast]: 0.50,
};

/**
 * Calculate the charter rate for a contract.
 * Formula: rate = distance_nm * rate_per_nm * cargo_multiplier * capacity_factor
 * Tuned so that average routes yield ~20-30% profit after fuel + operating costs.
 * @param distanceNm - Distance in nautical miles
 * @param shipCapacityBrt - Ship capacity in BRT (affects rate)
 * @param cargoType - Type of cargo (affects rate via multiplier)
 * @param randomFactor - Random variance (0.85-1.15)
 */
function calculateRate(distanceNm: number, shipCapacityBrt: number, cargoType: CargoType, randomFactor: number): number {
  const cargoMultiplier = CARGO_RATE_MULTIPLIERS[cargoType] ?? 1.0;
  const baseRate = distanceNm * shipCapacityBrt * CHARTER_RATE_PER_NM_PER_BRT * cargoMultiplier;
  const variedRate = baseRate * (0.85 + randomFactor * 0.30);
  // Round to nearest dollar
  return Math.round(variedRate);
}

/**
 * Calculate a delivery deadline based on distance and a speed assumption.
 * Assumes an average cruising speed for the deadline calculation,
 * with a buffer so it's achievable but tight.
 * @param distanceNm - Distance in nautical miles
 * @param randomFactor - Random variance for deadline tightness
 */
function calculateDeadline(distanceNm: number, randomFactor: number): number {
  // Assume ~15 knots average speed, giving base travel time
  const baseTravelDays = Math.ceil(distanceNm / (15 * 24));
  // Add buffer of 30-70% for port operations, weather, etc.
  const buffer = 1.3 + randomFactor * 0.4;
  const deadline = Math.round(baseTravelDays * buffer);
  return Math.min(Math.max(deadline, MIN_DELIVERY_DEADLINE_DAYS), MAX_DELIVERY_DEADLINE_DAYS);
}

/**
 * Generate available charter contracts at a given port.
 * Contracts are based on the port's available cargo types and potential destinations.
 *
 * @param currentPortId - The port where the player is currently docked
 * @param shipCapacityBrt - The ship's capacity in BRT (affects rate calculation)
 * @param week - Current game week (for seeded randomness)
 * @param year - Current game year (for seeded randomness)
 * @returns Array of available charter contracts
 */
export function generateCharterContracts(
  currentPortId: string,
  shipCapacityBrt: number,
  week: number,
  year: number,
): CharterContract[] {
  const currentPort = getPortById(currentPortId);
  if (!currentPort) return [];

  const seed = generateSeed(currentPortId, week, year);
  const rng = seededRandom(seed);

  const contracts: CharterContract[] = [];

  // Get all possible destinations (other ports)
  const otherPorts = PORTS.filter((p) => p.id !== currentPortId);

  // Get cargo types available at this port
  const availableCargo = currentPort.availableCargoTypes.filter(
    (ct) => ct !== CargoType.Ballast,
  );

  if (availableCargo.length === 0) return contracts;

  // Generate up to MAX_CHARTER_OPTIONS contracts
  const numContracts = Math.min(
    MAX_CHARTER_OPTIONS,
    Math.max(2, Math.floor(availableCargo.length * 1.5 + rng() * 2)),
  );

  const usedCombinations = new Set<string>();

  for (let i = 0; i < numContracts && contracts.length < MAX_CHARTER_OPTIONS; i++) {
    // Pick a random destination
    const destIndex = Math.floor(rng() * otherPorts.length);
    const destPort = otherPorts[destIndex];

    // Pick a random cargo type from available ones
    const cargoIndex = Math.floor(rng() * availableCargo.length);
    const cargoType = availableCargo[cargoIndex];

    // Avoid duplicate destination+cargo combinations
    const comboKey = `${destPort.id}-${cargoType}`;
    if (usedCombinations.has(comboKey)) continue;
    usedCombinations.add(comboKey);

    const distance = calculateDistanceNm(currentPort, destPort);

    // Skip very short distances (same-region ports)
    if (distance < 200) continue;

    const rateFactor = rng();
    const deadlineFactor = rng();

    const rate = calculateRate(distance, shipCapacityBrt, cargoType, rateFactor);
    const deadline = calculateDeadline(distance, deadlineFactor);
    const penalty = Math.round(rate * LATE_DELIVERY_PENALTY_RATE);

    // ~30% chance of a funny cargo description for flavor
    const funnyDescription = rng() < 0.3 ? getRandomFunnyCargoDescription() : undefined;

    contracts.push({
      destinationPortId: destPort.id,
      cargoType,
      rate,
      deliveryDeadlineDays: deadline,
      penalty,
      distanceNm: distance,
      funnyDescription,
    });
  }

  // Sort by distance (shortest first) for display
  contracts.sort((a, b) => a.distanceNm - b.distanceNm);

  return contracts;
}

/**
 * Accept a charter contract and prepare the ship for loading.
 * This is a validation step -- the actual loading is done via ShipManager.loadCargo.
 * @param contract - The contract to accept
 * @param currentPortId - Must match where the ship is docked
 */
export function validateCharterAcceptance(
  contract: CharterContract,
  currentPortId: string,
): { valid: boolean; message: string } {
  const currentPort = getPortById(currentPortId);
  if (!currentPort) {
    return { valid: false, message: "Invalid port." };
  }

  // Check that the cargo type is available at this port
  if (!currentPort.availableCargoTypes.includes(contract.cargoType)) {
    return { valid: false, message: `${contract.cargoType} is not available at ${currentPort.name}.` };
  }

  // Check destination exists
  const destPort = getPortById(contract.destinationPortId);
  if (!destPort) {
    return { valid: false, message: "Invalid destination port." };
  }

  return { valid: true, message: `Charter accepted: ${contract.cargoType} to ${destPort.name}.` };
}
