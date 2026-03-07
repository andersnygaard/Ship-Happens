/**
 * Core TypeScript type definitions for Ship Happens game data.
 */

// ─── Cargo ───────────────────────────────────────────────────────────────────

export enum CargoType {
  AgriculturalProduce = "Agricultural Produce",
  Chemicals = "Chemicals",
  Electronics = "Electronics",
  Machinery = "Machinery",
  Equipment = "Equipment",
  Metalware = "Metalware",
  PlasticsProducts = "Plastics Products",
  Textiles = "Textiles",
  Ballast = "Ballast",
}

// ─── Port ────────────────────────────────────────────────────────────────────

export interface Port {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly lat: number;
  readonly lng: number;
  readonly population: number;
  readonly languages: readonly string[];
  readonly shipCount: number;
  readonly cargoCapacityTdw: number;
  readonly availableCargoTypes: readonly CargoType[];
  readonly repairCostPerPercent: number;
}

// ─── Ship (catalog entry) ────────────────────────────────────────────────────

export type ShipType = "Freighter" | "Bulk Carrier" | "Container" | "RORO" | "LOLO" | "RORO/LOLO" | "Tanker";

export interface ShipSpec {
  readonly id: string;
  readonly type: ShipType;
  readonly capacityBrt: number;
  readonly priceMillions: number;
  readonly enginePowerHp: number;
  readonly lengthM: number;
  readonly beamM: number;
  readonly depositPercent: number;
  readonly maxSpeedKnots: number;
  readonly fuelConsumptionTonsPerDay: number;
  readonly bunkerCapacityTons: number;
  readonly dailyOperatingCosts: number;
}

// ─── Owned Ship (in-game instance) ──────────────────────────────────────────

export interface OwnedShip {
  readonly specId: string;
  name: string;
  captainName: string;
  conditionPercent: number;
  fuelTons: number;
  currentPortId: string | null;
  cargoType: CargoType | null;
  cargoDestinationPortId: string | null;
  isLaidUp: boolean;
  mortgagePercent: number;
}

// ─── Charter Contract ───────────────────────────────────────────────────────

export interface CharterContract {
  readonly destinationPortId: string;
  readonly cargoType: CargoType;
  readonly rate: number;
  readonly deliveryDeadlineDays: number;
  readonly penalty: number;
  readonly distanceNm: number;
  /** Optional humorous cargo description for flavor text. */
  readonly funnyDescription?: string;
}

// ─── Player & Company ───────────────────────────────────────────────────────

export interface Player {
  readonly id: number;
  name: string;
  companyName: string;
  homePortId: string;
  bankBalance: number;
  ships: OwnedShip[];
}

export interface Company {
  readonly playerId: number;
  readonly name: string;
  readonly homePortId: string;
  bankBalance: number;
  ships: OwnedShip[];
}

// ─── Game State ─────────────────────────────────────────────────────────────

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  week: number;
  year: number;
  dayOfWeek: number;
  isSimulationRunning: boolean;
}
