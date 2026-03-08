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

// ─── Captain Traits ─────────────────────────────────────────────────────────

export enum CaptainTrait {
  Cautious = "Cautious",
  Reckless = "Reckless",
  Frugal = "Frugal",
  Superstitious = "Superstitious",
  Charismatic = "Charismatic",
  StrictDisciplinarian = "Strict Disciplinarian",
}

/** All captain traits as an array for random selection. */
export const ALL_CAPTAIN_TRAITS: readonly CaptainTrait[] = Object.values(CaptainTrait);

// ─── Owned Ship (in-game instance) ──────────────────────────────────────────

export interface OwnedShip {
  readonly specId: string;
  name: string;
  captainName: string;
  /** Captain personality trait — affects minor gameplay events and flavor text. */
  captainTrait: CaptainTrait;
  conditionPercent: number;
  fuelTons: number;
  currentPortId: string | null;
  cargoType: CargoType | null;
  cargoDestinationPortId: string | null;
  isLaidUp: boolean;
  mortgagePercent: number;
  /** Remaining mortgage balance in dollars. */
  mortgageRemaining: number;
  /** Weekly mortgage payment amount in dollars. */
  mortgagePayment: number;
  /** Week the ship was purchased (for age-based depreciation). */
  purchaseWeek: number;
  /** Year the ship was purchased (for age-based depreciation). */
  purchaseYear: number;
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
