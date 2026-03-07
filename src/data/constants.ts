/**
 * Game constants for Ship Happens.
 * Financial system, time system, and gameplay configuration.
 */

// ─── Financial Constants ────────────────────────────────────────────────────

/** Starting capital for each player in dollars. */
export const STARTING_CAPITAL = 4_500_000;

/** Cost of being towed when a ship runs out of fuel at sea. */
export const TOWING_PENALTY = 1_000_000;

/** Minimum amount stolen when the player neglects the office (embezzlement event). */
export const EMBEZZLEMENT_AMOUNT_MIN = 200_000;

/** Maximum amount stolen when the player neglects the office (embezzlement event). */
export const EMBEZZLEMENT_AMOUNT_MAX = 500_000;

/** Legacy constant for backward compatibility. */
export const EMBEZZLEMENT_AMOUNT = 503_000;

/** Penalty percentage of charter rate for late delivery. */
export const LATE_DELIVERY_PENALTY_RATE = 0.11;

/** Base fuel cost per ton in dollars (varies slightly by port). */
export const BASE_FUEL_COST_PER_TON = 250;

/** Fuel cost variance per port (multiplier range: 0.8 to 1.3). */
export const FUEL_COST_MIN_MULTIPLIER = 0.8;
export const FUEL_COST_MAX_MULTIPLIER = 1.3;

/** Mortgage interest rate per year (applied to outstanding mortgage balance). */
export const MORTGAGE_INTEREST_RATE = 0.06;

// ─── Time System Constants ──────────────────────────────────────────────────

/** Number of days in a game week. */
export const DAYS_PER_WEEK = 7;

/** Number of weeks in a game year. */
export const WEEKS_PER_YEAR = 52;

/** Maximum number of players (turn-based, numbered 1-7). */
export const MAX_PLAYERS = 7;

/** Starting year of the game simulation. */
export const STARTING_YEAR = 0;

/** Starting week of the game simulation. */
export const STARTING_WEEK = 0;

// ─── Ship Condition Constants ───────────────────────────────────────────────

/** Maximum ship condition percentage. */
export const MAX_CONDITION_PERCENT = 100;

/** Minimum condition before a ship is at risk of breakdown. */
export const CRITICAL_CONDITION_PERCENT = 20;

/** Condition degradation per voyage (percentage points). */
export const CONDITION_LOSS_PER_VOYAGE_BASE = 3;

/** Additional condition loss from storms (percentage points). */
export const CONDITION_LOSS_STORM = 8;

// ─── Charter & Freight Constants ────────────────────────────────────────────

/** Base rate per nautical mile per BRT for charter revenue calculation.
 * Tuned so that average charters yield ~20-30% profit after fuel + operating costs. */
export const CHARTER_RATE_PER_NM_PER_BRT = 0.008;

/** Minimum delivery deadline in days. */
export const MIN_DELIVERY_DEADLINE_DAYS = 14;

/** Maximum delivery deadline in days. */
export const MAX_DELIVERY_DEADLINE_DAYS = 90;

// ─── Weather & Events ───────────────────────────────────────────────────────

/** Probability of a storm event per voyage leg (0-1). */
export const STORM_PROBABILITY = 0.15;

/** Extra days required to go around a storm. */
export const STORM_DETOUR_DAYS = 10;

/** Beaufort scale threshold for storm events (9 = strong gale). */
export const STORM_BEAUFORT_THRESHOLD = 9;

/** Probability of a sea rescue event per voyage leg (0-1). */
export const RESCUE_EVENT_PROBABILITY = 0.05;

/** Probability of office embezzlement per turn when office is not visited. */
export const EMBEZZLEMENT_PROBABILITY = 0.10;

// ─── Gameplay Balance ───────────────────────────────────────────────────────

/** Number of charter contract options offered at a port (max). */
export const MAX_CHARTER_OPTIONS = 6;

/** Speed multiplier used for travel time calculation (distance / (speed * 24)). */
export const TRAVEL_TIME_SPEED_FACTOR = 24;

// ─── Office Neglect Constants ─────────────────────────────────────────────

/** Number of weeks without visiting the office before embezzlement can trigger. */
export const OFFICE_NEGLECT_THRESHOLD_WEEKS = 4;

// ─── Bankruptcy Constants ─────────────────────────────────────────────────

/** Player is bankrupt when balance is below zero AND they own no ships. */
export const BANKRUPTCY_BALANCE_THRESHOLD = 0;
