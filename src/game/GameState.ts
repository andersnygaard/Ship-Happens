/**
 * Core game state manager for Ship Happens.
 * Ties together all subsystems: financial, ship management, time, turns, and charters.
 * Framework-agnostic, serializable, plain TypeScript.
 */

import { Player, OwnedShip, CharterContract, CargoType, Port, ALL_CAPTAIN_TRAITS, CaptainTrait } from "../data/types";
import { getPortById } from "../data/ports";
import { getShipSpecById } from "../data/ships";
import {
  STARTING_CAPITAL,
  DAYS_PER_WEEK,
  WEEKS_PER_YEAR,
  BANKRUPTCY_BALANCE_THRESHOLD,
  OFFICE_NEGLECT_THRESHOLD_WEEKS,
  EMBEZZLEMENT_AMOUNT_MIN,
  EMBEZZLEMENT_AMOUNT_MAX,
  EMBEZZLEMENT_PROBABILITY,
} from "../data/constants";

import {
  FinancialState,
  createFinancialState,
  getBalance,
  credit,
  debit,
  canAfford,
  makeMortgagePayment,
} from "./FinancialSystem";

import {
  purchaseShip,
  repairShip,
  refuelShip,
  loadCargo,
  unloadCargo,
  layUpShip,
  reactivateShip,
  applyVoyageWear,
  consumeFuel,
  getDailyOperatingCost,
  calculateShipValue,
  PurchaseResult,
  RepairResult,
  RefuelResult,
} from "./ShipManager";

import {
  TimeState,
  createTimeState,
  getTimeSnapshot,
  advanceDays,
  advanceWeek,
  calculateTravelDays,
  formatTime,
} from "./TimeSystem";

import {
  TurnState,
  createTurnState,
  getActivePlayerIndex,
  nextTurn,
  startSimulation,
  stopSimulation,
  isValidPlayerCount,
} from "./TurnManager";

import {
  generateCharterContracts,
  validateCharterAcceptance,
  calculateDistanceNm,
} from "./CharterSystem";

import {
  PlayerStatistics,
  createPlayerStatistics,
  recordVoyage,
  recordRevenue,
  recordExpense,
  recordShipPurchase,
  recordShipSale,
  recordCharterCompletion,
} from "./Statistics";

import {
  type WorldEvent,
  maybeGenerateWorldEvent,
  expireWorldEvents,
  resetWorldEventIds,
} from "./WorldEvents";

// ─── Player State ────────────────────────────────────────────────────────────

/** Extended player state that combines player info with financial data. */
export interface PlayerState {
  id: number;
  name: string;
  companyName: string;
  homePortId: string;
  finances: FinancialState;
  ships: OwnedShip[];
  /** Active charter contracts per ship (keyed by ship name). */
  activeCharters: Record<string, CharterContract & { acceptedDay: number }>;
  /** The total elapsed week number when the player last visited the office. */
  lastOfficeVisitWeek: number;
  /** Per-player performance statistics. */
  statistics: PlayerStatistics;
}

// ─── Full Game State ─────────────────────────────────────────────────────────

/** Record of a player who has exited the game (retired or bankrupt). */
export interface ExitedPlayer {
  /** Player index (0-based). */
  playerIndex: number;
  /** Reason the player exited. */
  reason: "retired" | "bankrupt";
  /** Final net worth at time of exit ($0 for bankrupt). */
  finalNetWorth: number;
  /** Week when the player exited. */
  exitWeek: number;
  /** Year when the player exited. */
  exitYear: number;
  /** Snapshot of player statistics at time of exit. */
  statistics: PlayerStatistics;
  /** Player name. */
  playerName: string;
  /** Company name. */
  companyName: string;
}

/** The complete, serializable game state. */
export interface FullGameState {
  players: PlayerState[];
  time: TimeState;
  turns: TurnState;
  /** Active world events that affect gameplay. */
  worldEvents: WorldEvent[];
  /** Flag indicating the game has been initialized. */
  initialized: boolean;
  /** Game duration in years, or null for unlimited/sandbox mode. */
  gameDurationYears: number | null;
  /** Players who have retired or gone bankrupt. */
  exitedPlayers: ExitedPlayer[];
}

/** Configuration for creating a new game. */
export interface NewGameConfig {
  players: Array<{
    name: string;
    companyName: string;
    homePortId: string;
  }>;
  /** Game duration in years, or null for unlimited/sandbox mode. */
  gameDurationYears?: number | null;
}

// ─── Game Initialization ─────────────────────────────────────────────────────

/**
 * Create a new game with the given player configuration.
 * Validates player count and home ports.
 */
export function createNewGame(config: NewGameConfig): FullGameState {
  if (!isValidPlayerCount(config.players.length)) {
    throw new Error(`Invalid player count: ${config.players.length}. Must be 1-7.`);
  }

  // Validate home ports
  for (const p of config.players) {
    if (!getPortById(p.homePortId)) {
      throw new Error(`Invalid home port: ${p.homePortId}`);
    }
  }

  const players: PlayerState[] = config.players.map((p, index) => ({
    id: index + 1,
    name: p.name,
    companyName: p.companyName,
    homePortId: p.homePortId,
    finances: createFinancialState(STARTING_CAPITAL),
    ships: [],
    activeCharters: {},
    lastOfficeVisitWeek: 0,
    statistics: createPlayerStatistics(),
  }));

  resetWorldEventIds();

  return {
    players,
    time: createTimeState(),
    turns: createTurnState(config.players.length),
    worldEvents: [],
    initialized: true,
    gameDurationYears: config.gameDurationYears ?? null,
    exitedPlayers: [],
  };
}

// ─── Player Accessors ────────────────────────────────────────────────────────

/**
 * Get the currently active player state.
 */
export function getActivePlayer(state: FullGameState): PlayerState {
  return state.players[getActivePlayerIndex(state.turns)];
}

/**
 * Get a player by index (0-based).
 */
export function getPlayer(state: FullGameState, index: number): PlayerState | undefined {
  return state.players[index];
}

/**
 * Get a player's bank balance in dollars.
 */
export function getPlayerBalance(player: PlayerState): number {
  return getBalance(player.finances);
}

// ─── Ship Actions ────────────────────────────────────────────────────────────

/**
 * Buy a ship for the active player.
 */
export function buyShip(
  state: FullGameState,
  specId: string,
  shipName: string,
  depositPercent: number,
): PurchaseResult {
  const player = getActivePlayer(state);
  const time = getTimeSnapshot(state.time);

  const result = purchaseShip(specId, shipName, depositPercent, player.finances, player.homePortId, time);
  if (result.success && result.ship) {
    player.ships.push(result.ship);
    recordShipPurchase(player.statistics);
  }
  return result;
}

/**
 * Repair a ship at its current port.
 */
export function repairPlayerShip(
  state: FullGameState,
  shipIndex: number,
  percentToRepair: number,
): RepairResult {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: 0, message: "Ship not found." };
  }
  if (!ship.currentPortId) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: ship.conditionPercent, message: "Ship is at sea." };
  }

  const port = getPortById(ship.currentPortId);
  if (!port) {
    return { success: false, percentRepaired: 0, cost: 0, newCondition: ship.conditionPercent, message: "Invalid port." };
  }

  const time = getTimeSnapshot(state.time);
  const result = repairShip(ship, percentToRepair, port, player.finances, time);
  if (result.success && result.cost > 0) {
    recordExpense(player.statistics, result.cost);
  }
  return result;
}

/**
 * Refuel a ship at its current port.
 */
export function refuelPlayerShip(
  state: FullGameState,
  shipIndex: number,
  tonsToAdd: number,
): RefuelResult {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) {
    return { success: false, tonsAdded: 0, cost: 0, newFuelLevel: 0, message: "Ship not found." };
  }

  const time = getTimeSnapshot(state.time);
  const result = refuelShip(ship, tonsToAdd, player.finances, time);
  if (result.success && result.cost > 0) {
    recordExpense(player.statistics, result.cost);
  }
  return result;
}

/**
 * Lay up a ship (put into storage, reduced costs).
 */
export function layUpPlayerShip(state: FullGameState, shipIndex: number): { success: boolean; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, message: "Ship not found." };
  if (!ship.currentPortId) return { success: false, message: "Ship must be in port to lay up." };
  if (ship.isLaidUp) return { success: false, message: "Ship is already laid up." };

  layUpShip(ship);
  return { success: true, message: `${ship.name} has been laid up.` };
}

/**
 * Reactivate a laid-up ship.
 */
export function reactivatePlayerShip(state: FullGameState, shipIndex: number): { success: boolean; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, message: "Ship not found." };
  if (!ship.isLaidUp) return { success: false, message: "Ship is not laid up." };

  reactivateShip(ship);
  return { success: true, message: `${ship.name} has been reactivated.` };
}

/**
 * Sell a ship at the broker. Credits sale proceeds minus any outstanding mortgage.
 * Cannot sell a ship that has cargo loaded or is at sea.
 */
export function sellShip(
  state: FullGameState,
  shipIndex: number,
): { success: boolean; salePrice: number; mortgageDeducted: number; netProceeds: number; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) {
    return { success: false, salePrice: 0, mortgageDeducted: 0, netProceeds: 0, message: "Ship not found." };
  }
  if (!ship.currentPortId) {
    return { success: false, salePrice: 0, mortgageDeducted: 0, netProceeds: 0, message: "Ship must be in port to sell." };
  }
  if (ship.cargoType !== null) {
    return { success: false, salePrice: 0, mortgageDeducted: 0, netProceeds: 0, message: "Unload cargo before selling." };
  }
  if (player.ships.length <= 1 && getPlayerBalance(player) < BANKRUPTCY_BALANCE_THRESHOLD) {
    return { success: false, salePrice: 0, mortgageDeducted: 0, netProceeds: 0, message: "Cannot sell your last ship while in debt." };
  }

  const time = getTimeSnapshot(state.time);
  const valuation = calculateShipValue(ship, time.week, time.year);
  const salePrice = valuation.salePrice;

  // Deduct outstanding mortgage from sale proceeds
  const mortgageDeducted = Math.min(ship.mortgageRemaining, salePrice);
  const netProceeds = salePrice - mortgageDeducted;

  // Credit net proceeds
  if (netProceeds > 0) {
    credit(player.finances, netProceeds, `Sale of ${ship.name}`, time);
  }

  // Track statistics
  recordShipSale(player.statistics);
  if (netProceeds > 0) {
    recordRevenue(player.statistics, netProceeds);
  }

  // Clear mortgage from financial system
  const shipKey = `${ship.specId}-${ship.name.replace("MS ", "")}`;
  if (player.finances.mortgages[shipKey]) {
    delete player.finances.mortgages[shipKey];
  }

  // Remove active charter if any
  delete player.activeCharters[ship.name];

  // Remove ship from fleet
  player.ships.splice(shipIndex, 1);

  return {
    success: true,
    salePrice,
    mortgageDeducted,
    netProceeds,
    message: `Sold ${ship.name} for $${salePrice.toLocaleString()}.${mortgageDeducted > 0 ? ` Mortgage settled: $${mortgageDeducted.toLocaleString()}.` : ""} Net proceeds: $${netProceeds.toLocaleString()}.`,
  };
}

// ─── Extra Mortgage Payment ──────────────────────────────────────────────────

/**
 * Make a voluntary extra mortgage payment on a specific ship.
 * Deducts from the player's cash balance and reduces the ship's outstanding mortgage.
 * @param state - Full game state
 * @param shipIndex - Index of the ship in the active player's fleet
 * @param amount - Dollar amount to pay (will be capped to remaining balance)
 */
export function extraMortgagePayment(
  state: FullGameState,
  shipIndex: number,
  amount: number,
): { success: boolean; amountPaid: number; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) {
    return { success: false, amountPaid: 0, message: "Ship not found." };
  }
  if (ship.mortgageRemaining <= 0) {
    return { success: false, amountPaid: 0, message: "This ship has no outstanding mortgage." };
  }
  if (amount <= 0) {
    return { success: false, amountPaid: 0, message: "Payment amount must be positive." };
  }

  // Cap payment to remaining mortgage balance
  const actualPayment = Math.min(amount, ship.mortgageRemaining);

  // Check if player can afford it
  if (!canAfford(player.finances, actualPayment)) {
    return { success: false, amountPaid: 0, message: "Insufficient funds for this payment." };
  }

  const time = getTimeSnapshot(state.time);
  const shipKey = `${ship.specId}-${ship.name.replace("MS ", "")}`;

  const result = makeMortgagePayment(player.finances, shipKey, actualPayment, time);
  if (result.success) {
    ship.mortgageRemaining = Math.max(0, ship.mortgageRemaining - actualPayment);
    if (ship.mortgageRemaining <= 0) {
      ship.mortgagePayment = 0;
    }
    const paidOff = ship.mortgageRemaining <= 0 ? " Mortgage fully paid off!" : "";
    return {
      success: true,
      amountPaid: actualPayment,
      message: `Extra payment of $${actualPayment.toLocaleString()} applied to ${ship.name}.${paidOff}`,
    };
  }

  return { success: false, amountPaid: 0, message: result.message };
}

// ─── Charter Actions ─────────────────────────────────────────────────────────

/**
 * Get available charter contracts at a ship's current port.
 */
export function getAvailableCharters(
  state: FullGameState,
  shipIndex: number,
): CharterContract[] {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship || !ship.currentPortId) return [];

  const spec = getShipSpecById(ship.specId);
  if (!spec) return [];

  return generateCharterContracts(
    ship.currentPortId,
    spec.capacityBrt,
    state.time.week,
    state.time.year,
    state.worldEvents,
  );
}

/**
 * Accept a charter contract for a ship.
 */
export function acceptCharter(
  state: FullGameState,
  shipIndex: number,
  contract: CharterContract,
): { success: boolean; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, message: "Ship not found." };
  if (!ship.currentPortId) return { success: false, message: "Ship is at sea." };

  // Validate the charter
  const validation = validateCharterAcceptance(contract, ship.currentPortId);
  if (!validation.valid) return { success: false, message: validation.message };

  // Store the active charter
  player.activeCharters[ship.name] = {
    ...contract,
    acceptedDay: state.time.totalDaysElapsed,
  };

  return { success: true, message: validation.message };
}

/**
 * Load cargo onto a ship from an accepted charter.
 */
export function loadShipCargo(
  state: FullGameState,
  shipIndex: number,
): { success: boolean; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, message: "Ship not found." };

  const charter = player.activeCharters[ship.name];
  if (!charter) return { success: false, message: "No charter contract accepted for this ship." };

  return loadCargo(ship, charter.cargoType, charter.destinationPortId);
}

/**
 * Deliver cargo when a ship arrives at its destination.
 * Calculates payment and applies any late penalties.
 */
export function deliverCargo(
  state: FullGameState,
  shipIndex: number,
): { success: boolean; revenue: number; penalty: number; netProfit: number; message: string } {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, revenue: 0, penalty: 0, netProfit: 0, message: "Ship not found." };

  // Check ship is at the cargo destination
  if (ship.currentPortId !== ship.cargoDestinationPortId) {
    return { success: false, revenue: 0, penalty: 0, netProfit: 0, message: "Ship has not arrived at destination." };
  }

  const charter = player.activeCharters[ship.name];
  if (!charter) {
    return { success: false, revenue: 0, penalty: 0, netProfit: 0, message: "No active charter for this ship." };
  }

  const time = getTimeSnapshot(state.time);

  // Calculate if late
  const daysElapsed = state.time.totalDaysElapsed - charter.acceptedDay;
  const isLate = daysElapsed > charter.deliveryDeadlineDays;
  const penalty = isLate ? charter.penalty : 0;
  const revenue = charter.rate;
  const netProfit = revenue - penalty;

  // Credit the revenue
  credit(player.finances, revenue, `Delivery of ${charter.cargoType} to ${charter.destinationPortId}`, time);

  // Apply penalty if late
  if (penalty > 0) {
    debit(player.finances, penalty, `Late delivery penalty for ${charter.cargoType}`, time);
  }

  // Track statistics
  recordRevenue(player.statistics, revenue);
  if (penalty > 0) {
    recordExpense(player.statistics, penalty);
  }
  recordCharterCompletion(player.statistics, charter.rate);

  // Unload cargo
  unloadCargo(ship);

  // Remove the active charter
  delete player.activeCharters[ship.name];

  const lateMsg = isLate ? ` Late by ${daysElapsed - charter.deliveryDeadlineDays} days. Penalty: $${penalty.toLocaleString()}.` : "";
  return {
    success: true,
    revenue,
    penalty,
    netProfit,
    message: `Delivered ${charter.cargoType}. Revenue: $${revenue.toLocaleString()}.${lateMsg} Result: $${netProfit.toLocaleString()}.`,
  };
}

// ─── Time & Turn Actions ─────────────────────────────────────────────────────

/**
 * Advance to the next player's turn.
 * If a new round starts, advances time by one week and applies weekly costs.
 */
/** Warning about a charter deadline entering the danger zone. */
export interface DeadlineWarning {
  shipName: string;
  remainingDays: number;
  totalDeadlineDays: number;
}

export function endTurn(state: FullGameState): { newRound: boolean; message: string; newWorldEvents: WorldEvent[]; deadlineWarnings: DeadlineWarning[]; gameEnded: boolean } {
  const exitedIndices = (state.exitedPlayers || []).map((e) => e.playerIndex);
  const newRound = nextTurn(state.turns, exitedIndices);
  const newWorldEvents: WorldEvent[] = [];

  if (newRound) {
    // Advance time by one week
    advanceWeek(state.time);

    // Apply weekly operating costs and mortgage payments for all players
    const time = getTimeSnapshot(state.time);
    for (const player of state.players) {
      for (const ship of player.ships) {
        const dailyCost = getDailyOperatingCost(ship);
        const weeklyCost = dailyCost * DAYS_PER_WEEK;
        if (weeklyCost > 0) {
          debit(player.finances, weeklyCost, `Weekly operating costs for ${ship.name}`, time);
          recordExpense(player.statistics, weeklyCost);
        }

        // Deduct weekly mortgage payment if outstanding
        if (ship.mortgageRemaining > 0 && ship.mortgagePayment > 0) {
          const payment = Math.min(ship.mortgagePayment, ship.mortgageRemaining);
          const shipKey = `${ship.specId}-${ship.name.replace("MS ", "")}`;
          const mortgageResult = makeMortgagePayment(player.finances, shipKey, payment, time);
          if (mortgageResult.success) {
            ship.mortgageRemaining = Math.max(0, ship.mortgageRemaining - payment);
            if (ship.mortgageRemaining <= 0) {
              ship.mortgagePayment = 0;
            }
          }
        }
      }
    }

    // ── World Events: expire old events and maybe generate new ones ──
    if (!state.worldEvents) {
      state.worldEvents = [];
    }
    const { remaining } = expireWorldEvents(state.worldEvents, time.week, time.year);
    state.worldEvents = remaining;

    const newEvent = maybeGenerateWorldEvent(time.week, time.year, state.worldEvents);
    if (newEvent) {
      state.worldEvents.push(newEvent);
      newWorldEvents.push(newEvent);
    }
  }

  // Check for charter deadline warnings (< 25% time remaining)
  const deadlineWarnings: DeadlineWarning[] = [];
  for (const player of state.players) {
    for (const [shipName, charter] of Object.entries(player.activeCharters)) {
      const daysElapsed = state.time.totalDaysElapsed - charter.acceptedDay;
      const remainingDays = charter.deliveryDeadlineDays - daysElapsed;
      const fractionRemaining = charter.deliveryDeadlineDays > 0
        ? remainingDays / charter.deliveryDeadlineDays
        : 0;
      if (fractionRemaining < 0.25) {
        deadlineWarnings.push({
          shipName,
          remainingDays,
          totalDeadlineDays: charter.deliveryDeadlineDays,
        });
      }
    }
  }

  // Check if the game should end (year limit reached at end of a full round)
  let gameEnded = false;
  if (newRound && state.gameDurationYears != null && state.time.year >= state.gameDurationYears) {
    gameEnded = true;
  }

  // Check if all players are exited (bankrupt or retired)
  if (!state.exitedPlayers) state.exitedPlayers = [];
  if (state.exitedPlayers.length >= state.players.length) {
    gameEnded = true;
  }

  const activePlayer = getActivePlayer(state);
  return {
    newRound,
    newWorldEvents,
    deadlineWarnings,
    gameEnded,
    message: gameEnded
      ? "The game has ended! Final standings are being tallied..."
      : newRound
        ? `New round! Week ${state.time.week}, Year ${state.time.year}. It's ${activePlayer.name}'s turn.`
        : `It's ${activePlayer.name}'s turn.`,
  };
}

/**
 * Start the simulation (START ACTION button).
 */
export function startAction(state: FullGameState): void {
  startSimulation(state.turns);
}

/**
 * Stop the simulation (STOP ACTION button).
 */
export function stopAction(state: FullGameState): void {
  stopSimulation(state.turns);
}

/**
 * Simulate a voyage for a ship.
 * Advances time, consumes fuel, applies wear, and moves the ship.
 * @param shipIndex - Index of the ship in the active player's fleet
 * @param destinationPortId - Port to travel to
 * @param cruisingSpeedKnots - Optional cruising speed; defaults to max speed for backward compatibility
 */
export function simulateVoyage(
  state: FullGameState,
  shipIndex: number,
  destinationPortId: string,
  cruisingSpeedKnots?: number,
): {
  success: boolean;
  travelDays: number;
  fuelConsumed: number;
  ranOutOfFuel: boolean;
  message: string;
} {
  const player = getActivePlayer(state);
  const ship = player.ships[shipIndex];
  if (!ship) return { success: false, travelDays: 0, fuelConsumed: 0, ranOutOfFuel: false, message: "Ship not found." };
  if (!ship.currentPortId) return { success: false, travelDays: 0, fuelConsumed: 0, ranOutOfFuel: false, message: "Ship is already at sea." };
  if (ship.isLaidUp) return { success: false, travelDays: 0, fuelConsumed: 0, ranOutOfFuel: false, message: "Ship is laid up." };

  const spec = getShipSpecById(ship.specId);
  if (!spec) return { success: false, travelDays: 0, fuelConsumed: 0, ranOutOfFuel: false, message: "Unknown ship spec." };

  const originPort = getPortById(ship.currentPortId);
  const destPort = getPortById(destinationPortId);
  if (!originPort || !destPort) {
    return { success: false, travelDays: 0, fuelConsumed: 0, ranOutOfFuel: false, message: "Invalid port." };
  }

  // Calculate distance and travel time
  const distance = calculateDistanceNm(originPort, destPort);
  const effectiveSpeed = cruisingSpeedKnots ?? spec.maxSpeedKnots;
  const travelDays = calculateTravelDays(distance, effectiveSpeed);

  // Consume fuel (uses speed-adjusted consumption via admiralty formula)
  const fuelResult = consumeFuel(ship, travelDays, effectiveSpeed);

  // Advance time
  advanceDays(state.time, travelDays);

  // Apply voyage wear
  applyVoyageWear(ship);

  // Move ship to destination
  ship.currentPortId = destinationPortId;

  // Apply operating costs for travel days
  const time = getTimeSnapshot(state.time);
  const operatingCost = getDailyOperatingCost(ship) * travelDays;
  if (operatingCost > 0) {
    debit(player.finances, operatingCost, `Operating costs for ${ship.name} (${travelDays} days at sea)`, time);
    recordExpense(player.statistics, operatingCost);
  }

  // Track voyage statistics
  recordVoyage(player.statistics, distance, destinationPortId);

  let message = `${ship.name} arrived at ${destPort.name} after ${travelDays} days. Fuel consumed: ${fuelResult.consumed}t.`;
  if (fuelResult.ranOutOfFuel) {
    message += " WARNING: Ship ran out of fuel and had to be towed!";
  }

  return {
    success: true,
    travelDays,
    fuelConsumed: fuelResult.consumed,
    ranOutOfFuel: fuelResult.ranOutOfFuel,
    message,
  };
}

// ─── Bankruptcy Detection ─────────────────────────────────────────────────

/**
 * Check if a player is bankrupt.
 * A player is bankrupt when their balance is below the threshold AND they own no ships.
 */
export function isPlayerBankrupt(player: PlayerState): boolean {
  const balance = getPlayerBalance(player);
  return balance < BANKRUPTCY_BALANCE_THRESHOLD && player.ships.length === 0;
}

/**
 * Check if the active player is bankrupt.
 * Returns true if the player should see the game over screen.
 */
export function checkBankruptcy(state: FullGameState): boolean {
  const player = getActivePlayer(state);
  return isPlayerBankrupt(player);
}

// ─── Office Neglect ───────────────────────────────────────────────────────

/**
 * Record that the player has visited the office.
 * Resets the neglect timer.
 */
export function recordOfficeVisit(state: FullGameState): void {
  const player = getActivePlayer(state);
  const totalWeeks = state.time.year * WEEKS_PER_YEAR + state.time.week;
  player.lastOfficeVisitWeek = totalWeeks;
}

/**
 * Check for office neglect and potentially trigger an embezzlement event.
 * Should be called each turn/week to see if the player has been away too long.
 *
 * @returns An embezzlement result if triggered, or null if no event occurs.
 */
export function checkOfficeNeglect(state: FullGameState): {
  triggered: boolean;
  amount: number;
  message: string;
} | null {
  const player = getActivePlayer(state);
  const totalWeeks = state.time.year * WEEKS_PER_YEAR + state.time.week;
  const weeksSinceVisit = totalWeeks - player.lastOfficeVisitWeek;

  if (weeksSinceVisit < OFFICE_NEGLECT_THRESHOLD_WEEKS) {
    return null;
  }

  // Roll for embezzlement probability
  if (Math.random() > EMBEZZLEMENT_PROBABILITY) {
    return null;
  }

  // Calculate embezzlement amount (random between min and max)
  const amount = Math.round(
    EMBEZZLEMENT_AMOUNT_MIN +
    Math.random() * (EMBEZZLEMENT_AMOUNT_MAX - EMBEZZLEMENT_AMOUNT_MIN),
  );

  const time = getTimeSnapshot(state.time);
  const result = debit(
    player.finances,
    amount,
    "Embezzlement — an employee helped themselves while you were away",
    time,
  );

  if (result.success) {
    return {
      triggered: true,
      amount,
      message: `While you were away from the office, an unscrupulous employee embezzled $${amount.toLocaleString()} from the company accounts!`,
    };
  }

  // If player can't afford the full amount, take what they have
  const balance = getPlayerBalance(player);
  if (balance > 0) {
    const partialAmount = Math.floor(balance);
    debit(
      player.finances,
      partialAmount,
      "Embezzlement — an employee helped themselves while you were away",
      time,
    );
    return {
      triggered: true,
      amount: partialAmount,
      message: `While you were away from the office, an unscrupulous employee embezzled $${partialAmount.toLocaleString()} from the company accounts!`,
    };
  }

  return null;
}

// ─── Charter Deadline Helpers ─────────────────────────────────────────────────

/**
 * Get the remaining days for a ship's active charter deadline.
 * Returns null if the ship has no active charter.
 * Uses the same calculation as deliverCargo() to ensure consistency.
 */
export function getCharterRemainingDays(
  state: FullGameState,
  shipName: string,
): number | null {
  const player = getActivePlayer(state);
  const charter = player.activeCharters[shipName];
  if (!charter) return null;

  const daysElapsed = state.time.totalDaysElapsed - charter.acceptedDay;
  return charter.deliveryDeadlineDays - daysElapsed;
}

// ─── Net Worth Calculation ────────────────────────────────────────────────────

/**
 * Calculate a player's net worth: cash + fleet value (sale price already factors in mortgages).
 * For net worth we use: balance + sum of ship sale prices (which already deduct mortgage).
 * Actually, per Leaderboard: netWorth = balance + fleetValue (sale price without mortgage deduction).
 * We follow the same approach as the leaderboard for consistency.
 */
export function calculatePlayerNetWorth(player: PlayerState, week: number, year: number): number {
  const balance = getPlayerBalance(player);
  let fleetValue = 0;
  for (const ship of player.ships) {
    const valuation = calculateShipValue(ship, week, year);
    fleetValue += valuation.salePrice;
  }
  return balance + fleetValue;
}

// ─── Retirement ──────────────────────────────────────────────────────────────

/**
 * Retire the active player from the game.
 * Sells all ships at market value (settling mortgages), records final score.
 * Returns the retirement result.
 */
export function retirePlayer(state: FullGameState): {
  success: boolean;
  message: string;
  finalNetWorth: number;
} {
  const playerIndex = getActivePlayerIndex(state.turns);
  const player = getActivePlayer(state);

  if (!state.exitedPlayers) state.exitedPlayers = [];

  // Check if already exited
  if (state.exitedPlayers.some((e) => e.playerIndex === playerIndex)) {
    return { success: false, message: "Player has already exited the game.", finalNetWorth: 0 };
  }

  const time = getTimeSnapshot(state.time);

  // Sell all ships (liquidate fleet)
  while (player.ships.length > 0) {
    const ship = player.ships[0];
    const valuation = calculateShipValue(ship, time.week, time.year);
    const salePrice = valuation.salePrice;
    const mortgageDeducted = Math.min(ship.mortgageRemaining, salePrice);
    const netProceeds = salePrice - mortgageDeducted;

    if (netProceeds > 0) {
      credit(player.finances, netProceeds, `Retirement sale of ${ship.name}`, time);
    }

    // If mortgage exceeds sale price, the player owes the difference
    if (ship.mortgageRemaining > salePrice) {
      const deficit = ship.mortgageRemaining - salePrice;
      debit(player.finances, deficit, `Mortgage deficit on ${ship.name}`, time);
    }

    // Clear mortgage
    const shipKey = `${ship.specId}-${ship.name.replace("MS ", "")}`;
    if (player.finances.mortgages[shipKey]) {
      delete player.finances.mortgages[shipKey];
    }

    // Remove active charter if any
    delete player.activeCharters[ship.name];

    // Remove ship
    player.ships.splice(0, 1);
  }

  const finalNetWorth = Math.max(0, getPlayerBalance(player));

  // Record the exit
  state.exitedPlayers.push({
    playerIndex,
    reason: "retired",
    finalNetWorth,
    exitWeek: time.week,
    exitYear: time.year,
    statistics: { ...player.statistics, portsVisited: [...player.statistics.portsVisited] },
    playerName: player.name,
    companyName: player.companyName,
  });

  return {
    success: true,
    finalNetWorth,
    message: `${player.name} has retired from the shipping business with $${finalNetWorth.toLocaleString()}. A life well sailed!`,
  };
}

/**
 * Record a player as bankrupt in the exitedPlayers list.
 * Should be called when bankruptcy is detected.
 */
export function recordBankruptPlayer(state: FullGameState, playerIndex: number): void {
  if (!state.exitedPlayers) state.exitedPlayers = [];
  if (state.exitedPlayers.some((e) => e.playerIndex === playerIndex)) return;

  const player = state.players[playerIndex];
  if (!player) return;

  state.exitedPlayers.push({
    playerIndex,
    reason: "bankrupt",
    finalNetWorth: 0,
    exitWeek: state.time.week,
    exitYear: state.time.year,
    statistics: { ...player.statistics, portsVisited: [...player.statistics.portsVisited] },
    playerName: player.name,
    companyName: player.companyName,
  });
}

/**
 * Check if a player has exited the game (retired or bankrupt).
 */
export function isPlayerExited(state: FullGameState, playerIndex: number): boolean {
  if (!state.exitedPlayers) return false;
  return state.exitedPlayers.some((e) => e.playerIndex === playerIndex);
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

/**
 * Get formatted time string.
 */
export function getFormattedTime(state: FullGameState): string {
  return formatTime(state.time);
}

/**
 * Get a summary of a player's financial status.
 */
export function getPlayerSummary(player: PlayerState): {
  name: string;
  companyName: string;
  balance: number;
  balanceMillions: string;
  shipCount: number;
} {
  const balance = getPlayerBalance(player);
  return {
    name: player.name,
    companyName: player.companyName,
    balance,
    balanceMillions: `${(balance / 1_000_000).toFixed(1)}`,
    shipCount: player.ships.length,
  };
}

// ─── Serialization ───────────────────────────────────────────────────────────

/**
 * Serialize the full game state to a JSON-safe object.
 * Since the state is already plain data, this is essentially a deep clone.
 */
export function serializeGameState(state: FullGameState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize a saved game state from JSON.
 */
export function deserializeGameState(json: string): FullGameState {
  const parsed = JSON.parse(json) as FullGameState;
  if (!parsed.initialized) {
    throw new Error("Invalid game state: not initialized.");
  }
  // Backward compatibility: ensure worldEvents array exists
  if (!parsed.worldEvents) {
    parsed.worldEvents = [];
  }
  // Backward compatibility: default to unlimited duration for old saves
  if (parsed.gameDurationYears === undefined) {
    parsed.gameDurationYears = null;
  }
  // Backward compatibility: ensure exitedPlayers array exists
  if (!parsed.exitedPlayers) {
    parsed.exitedPlayers = [];
  }
  // Backward compatibility: assign random captain traits to ships without one
  for (const player of parsed.players) {
    for (const ship of player.ships) {
      if (!ship.captainTrait) {
        ship.captainTrait = ALL_CAPTAIN_TRAITS[Math.floor(Math.random() * ALL_CAPTAIN_TRAITS.length)];
      }
      // Backward compatibility: default originalMortgageAmount to mortgageRemaining
      if (ship.originalMortgageAmount === undefined) {
        ship.originalMortgageAmount = ship.mortgageRemaining;
      }
    }
    // Backward compatibility: ensure docking bonus statistics exist
    if (player.statistics.dockingBonusesEarned === undefined) {
      player.statistics.dockingBonusesEarned = 0;
    }
    if (player.statistics.totalDockingBonus === undefined) {
      player.statistics.totalDockingBonus = 0;
    }
  }
  return parsed;
}
