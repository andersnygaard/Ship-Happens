/**
 * Statistics tracking for Ship Happens.
 * Tracks per-player performance metrics across voyages, finances, and fleet management.
 */

/** Per-player statistics record. */
export interface PlayerStatistics {
  totalVoyages: number;
  totalRevenue: number;
  totalExpenses: number;
  shipsOwned: number;
  shipsSold: number;
  portsVisited: string[];
  cargoDelivered: number;
  distanceSailed: number;
  chartersCompleted: number;
}

/**
 * Create a fresh statistics record for a new player.
 */
export function createPlayerStatistics(): PlayerStatistics {
  return {
    totalVoyages: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    shipsOwned: 0,
    shipsSold: 0,
    portsVisited: [],
    cargoDelivered: 0,
    distanceSailed: 0,
    chartersCompleted: 0,
  };
}

/**
 * Record a completed voyage.
 */
export function recordVoyage(stats: PlayerStatistics, distanceNm: number, destinationPortId: string): void {
  stats.totalVoyages += 1;
  stats.distanceSailed += distanceNm;
  recordPortVisit(stats, destinationPortId);
}

/**
 * Record revenue earned (charter delivery, ship sale, etc.).
 */
export function recordRevenue(stats: PlayerStatistics, amount: number): void {
  stats.totalRevenue += amount;
}

/**
 * Record an expense (fuel, repairs, operating costs, etc.).
 */
export function recordExpense(stats: PlayerStatistics, amount: number): void {
  stats.totalExpenses += amount;
}

/**
 * Record a ship purchase.
 */
export function recordShipPurchase(stats: PlayerStatistics): void {
  stats.shipsOwned += 1;
}

/**
 * Record a ship sale.
 */
export function recordShipSale(stats: PlayerStatistics): void {
  stats.shipsSold += 1;
}

/**
 * Record visiting a port (adds to unique set if not already visited).
 */
export function recordPortVisit(stats: PlayerStatistics, portId: string): void {
  if (!stats.portsVisited.includes(portId)) {
    stats.portsVisited.push(portId);
  }
}

/**
 * Record a completed charter delivery.
 */
export function recordCharterCompletion(stats: PlayerStatistics, cargoTons: number): void {
  stats.chartersCompleted += 1;
  stats.cargoDelivered += cargoTons;
}

/**
 * Calculate net profit (revenue minus expenses).
 */
export function getNetProfit(stats: PlayerStatistics): number {
  return stats.totalRevenue - stats.totalExpenses;
}
