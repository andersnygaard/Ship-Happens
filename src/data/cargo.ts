/**
 * Cargo type definitions and related data for Ship Happens.
 */

import { CargoType } from "./types";

/** All cargo types available for charter contracts (excluding Ballast). */
export const TRADEABLE_CARGO_TYPES: readonly CargoType[] = [
  CargoType.AgriculturalProduce,
  CargoType.Chemicals,
  CargoType.Electronics,
  CargoType.Machinery,
  CargoType.Equipment,
  CargoType.Metalware,
  CargoType.PlasticsProducts,
  CargoType.Textiles,
] as const;

/** All cargo types including Ballast. */
export const ALL_CARGO_TYPES: readonly CargoType[] = [
  ...TRADEABLE_CARGO_TYPES,
  CargoType.Ballast,
] as const;

/** Short display labels for cargo types (used in UI where space is limited). */
export const CARGO_SHORT_LABELS: Readonly<Record<CargoType, string>> = {
  [CargoType.AgriculturalProduce]: "Agric. Produce",
  [CargoType.Chemicals]: "Chemicals",
  [CargoType.Electronics]: "Electronics",
  [CargoType.Machinery]: "Machinery",
  [CargoType.Equipment]: "Equipm.",
  [CargoType.Metalware]: "Metalware",
  [CargoType.PlasticsProducts]: "Plastics",
  [CargoType.Textiles]: "Textiles",
  [CargoType.Ballast]: "Ballast",
} as const;
