/**
 * Turn management for Ship Happens.
 * Handles multiplayer turn progression for 1-7 players.
 * All state is plain serializable data.
 */

import { MAX_PLAYERS } from "../data/constants";

/** Serializable turn state. */
export interface TurnState {
  /** Total number of players in the game. */
  playerCount: number;
  /** Index of the currently active player (0-based). */
  activePlayerIndex: number;
  /** Current round number (increments after all players have taken a turn). */
  round: number;
  /** Whether the simulation is currently running (START ACTION pressed). */
  isSimulationRunning: boolean;
}

/**
 * Create a fresh turn state.
 * @param playerCount - Number of players (1-7)
 */
export function createTurnState(playerCount: number): TurnState {
  const clampedCount = Math.min(Math.max(1, Math.round(playerCount)), MAX_PLAYERS);
  return {
    playerCount: clampedCount,
    activePlayerIndex: 0,
    round: 1,
    isSimulationRunning: false,
  };
}

/**
 * Get the active player index (0-based).
 */
export function getActivePlayerIndex(state: TurnState): number {
  return state.activePlayerIndex;
}

/**
 * Get the active player number (1-based, for display).
 */
export function getActivePlayerNumber(state: TurnState): number {
  return state.activePlayerIndex + 1;
}

/**
 * Advance to the next player's turn, skipping exited (retired/bankrupt) players.
 * Returns true if a new round has started (all players have taken a turn).
 * @param exitedPlayerIndices - 0-based indices of players who have exited the game
 */
export function nextTurn(state: TurnState, exitedPlayerIndices?: number[]): boolean {
  state.isSimulationRunning = false;

  const exited = exitedPlayerIndices ?? [];

  // Advance at least once
  state.activePlayerIndex++;
  if (state.activePlayerIndex >= state.playerCount) {
    state.activePlayerIndex = 0;
    state.round++;
  }

  // Track whether we wrapped around (new round)
  const startIndex = state.activePlayerIndex;
  let newRound = startIndex === 0;

  // Skip exited players
  let iterations = 0;
  while (exited.includes(state.activePlayerIndex) && iterations < state.playerCount) {
    state.activePlayerIndex++;
    if (state.activePlayerIndex >= state.playerCount) {
      state.activePlayerIndex = 0;
      state.round++;
      newRound = true;
    }
    iterations++;
  }

  return newRound;
}

/**
 * Start the simulation for the current player's turn.
 */
export function startSimulation(state: TurnState): void {
  state.isSimulationRunning = true;
}

/**
 * Stop the simulation for the current player's turn.
 */
export function stopSimulation(state: TurnState): void {
  state.isSimulationRunning = false;
}

/**
 * Check if it's a specific player's turn.
 * @param playerIndex - 0-based player index
 */
export function isPlayerTurn(state: TurnState, playerIndex: number): boolean {
  return state.activePlayerIndex === playerIndex;
}

/**
 * Get the current round number.
 */
export function getCurrentRound(state: TurnState): number {
  return state.round;
}

/**
 * Validate a player count.
 */
export function isValidPlayerCount(count: number): boolean {
  return Number.isInteger(count) && count >= 1 && count <= MAX_PLAYERS;
}
