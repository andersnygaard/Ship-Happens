/**
 * Time system for Ship Happens.
 * Manages game time progression in days, weeks, and years.
 * All time state is plain serializable data.
 */

import {
  DAYS_PER_WEEK,
  WEEKS_PER_YEAR,
  STARTING_YEAR,
  STARTING_WEEK,
} from "../data/constants";

/** Serializable time state. */
export interface TimeState {
  /** Current day within the week (1-7). */
  dayOfWeek: number;
  /** Current week count (0-based). */
  week: number;
  /** Current year count (0-based). */
  year: number;
  /** Total elapsed days since game start. */
  totalDaysElapsed: number;
}

/** Snapshot of time for referencing in other systems. */
export interface TimeSnapshot {
  readonly week: number;
  readonly year: number;
}

/**
 * Create a fresh time state at the start of the game.
 */
export function createTimeState(): TimeState {
  return {
    dayOfWeek: 1,
    week: STARTING_WEEK,
    year: STARTING_YEAR,
    totalDaysElapsed: 0,
  };
}

/**
 * Get a snapshot of the current time (for ledger entries, etc.).
 */
export function getTimeSnapshot(state: TimeState): TimeSnapshot {
  return { week: state.week, year: state.year };
}

/**
 * Advance time by a given number of days.
 * Updates dayOfWeek, week, and year accordingly.
 * Returns the number of full weeks that passed during the advance.
 */
export function advanceDays(state: TimeState, days: number): number {
  if (days <= 0) return 0;

  const previousWeek = state.week + state.year * WEEKS_PER_YEAR;
  state.totalDaysElapsed += days;

  // Calculate new absolute day position
  // dayOfWeek is 1-based, so we need to adjust
  const totalDays = (state.year * WEEKS_PER_YEAR * DAYS_PER_WEEK)
    + ((state.week) * DAYS_PER_WEEK)
    + (state.dayOfWeek - 1)
    + days;

  state.year = Math.floor(totalDays / (WEEKS_PER_YEAR * DAYS_PER_WEEK));
  const remainingDays = totalDays - state.year * WEEKS_PER_YEAR * DAYS_PER_WEEK;
  state.week = Math.floor(remainingDays / DAYS_PER_WEEK);
  state.dayOfWeek = (remainingDays % DAYS_PER_WEEK) + 1;

  // Handle year overflow for weeks
  if (state.week >= WEEKS_PER_YEAR) {
    state.year += Math.floor(state.week / WEEKS_PER_YEAR);
    state.week = state.week % WEEKS_PER_YEAR;
  }

  const currentWeek = state.week + state.year * WEEKS_PER_YEAR;
  return currentWeek - previousWeek;
}

/**
 * Advance time by one full week.
 * Convenience method for weekly processing.
 */
export function advanceWeek(state: TimeState): void {
  advanceDays(state, DAYS_PER_WEEK);
}

/**
 * Calculate travel time in days given distance (nm) and speed (knots).
 * speed is in knots (nautical miles per hour), so distance / (speed * 24) = days.
 */
export function calculateTravelDays(distanceNm: number, speedKnots: number): number {
  if (speedKnots <= 0) return Infinity;
  return Math.ceil(distanceNm / (speedKnots * 24));
}

/**
 * Check if a deadline (in days from acceptance) has been exceeded.
 * @param daysElapsedSinceAcceptance - Days that have passed since the contract was accepted
 * @param deadlineDays - The contract deadline in days
 */
export function isDeadlineExceeded(daysElapsedSinceAcceptance: number, deadlineDays: number): boolean {
  return daysElapsedSinceAcceptance > deadlineDays;
}

/**
 * Format the current time as a display string.
 */
export function formatTime(state: TimeState): string {
  return `${state.week} WEEKS, ${state.year} YRS`;
}
