/**
 * Financial system for Ship Happens.
 * Handles all money operations using integer cents to avoid floating point issues.
 * All public API amounts are in dollars (number), but internally stored as cents (integer).
 */

import { STARTING_CAPITAL, MORTGAGE_INTEREST_RATE, WEEKS_PER_YEAR } from "../data/constants";

/** Result of a financial transaction. */
export interface TransactionResult {
  readonly success: boolean;
  readonly newBalance: number;
  readonly message: string;
}

/** A ledger entry for tracking financial history. */
export interface LedgerEntry {
  readonly timestamp: { week: number; year: number };
  readonly type: "credit" | "debit";
  readonly amount: number;
  readonly description: string;
  readonly balanceAfter: number;
}

/**
 * Serializable financial state for a single player.
 */
export interface FinancialState {
  /** Balance stored in cents (integer) to avoid floating point issues. */
  balanceCents: number;
  /** Outstanding mortgage amounts per ship (specId -> cents). */
  mortgages: Record<string, number>;
  /** Financial ledger for history tracking. */
  ledger: LedgerEntry[];
}

/**
 * Creates a fresh financial state with starting capital.
 */
export function createFinancialState(startingCapital: number = STARTING_CAPITAL): FinancialState {
  return {
    balanceCents: dollarsToCents(startingCapital),
    mortgages: {},
    ledger: [],
  };
}

/** Convert dollars to cents (integer). */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Get the current balance in dollars.
 */
export function getBalance(state: FinancialState): number {
  return centsToDollars(state.balanceCents);
}

/**
 * Credit (add) money to the account.
 */
export function credit(
  state: FinancialState,
  amount: number,
  description: string,
  time: { week: number; year: number },
): TransactionResult {
  if (amount <= 0) {
    return { success: false, newBalance: getBalance(state), message: "Credit amount must be positive." };
  }
  const amountCents = dollarsToCents(amount);
  state.balanceCents += amountCents;
  const balanceAfter = getBalance(state);

  state.ledger.push({
    timestamp: { ...time },
    type: "credit",
    amount,
    description,
    balanceAfter,
  });

  return { success: true, newBalance: balanceAfter, message: `Credited $${amount.toLocaleString()}. ${description}` };
}

/**
 * Debit (subtract) money from the account.
 * Returns failure if insufficient funds.
 */
export function debit(
  state: FinancialState,
  amount: number,
  description: string,
  time: { week: number; year: number },
): TransactionResult {
  if (amount <= 0) {
    return { success: false, newBalance: getBalance(state), message: "Debit amount must be positive." };
  }
  const amountCents = dollarsToCents(amount);
  if (amountCents > state.balanceCents) {
    return {
      success: false,
      newBalance: getBalance(state),
      message: "Insufficient funds. Try to get some cash before you try to buy something next time!",
    };
  }

  state.balanceCents -= amountCents;
  const balanceAfter = getBalance(state);

  state.ledger.push({
    timestamp: { ...time },
    type: "debit",
    amount,
    description,
    balanceAfter,
  });

  return { success: true, newBalance: balanceAfter, message: `Debited $${amount.toLocaleString()}. ${description}` };
}

/**
 * Check if the player can afford a given amount.
 */
export function canAfford(state: FinancialState, amount: number): boolean {
  return dollarsToCents(amount) <= state.balanceCents;
}

/**
 * Add a mortgage for a ship.
 */
export function addMortgage(state: FinancialState, shipKey: string, amount: number): void {
  const amountCents = dollarsToCents(amount);
  state.mortgages[shipKey] = (state.mortgages[shipKey] ?? 0) + amountCents;
}

/**
 * Get the outstanding mortgage for a ship in dollars.
 */
export function getMortgage(state: FinancialState, shipKey: string): number {
  return centsToDollars(state.mortgages[shipKey] ?? 0);
}

/**
 * Get total outstanding mortgages in dollars.
 */
export function getTotalMortgages(state: FinancialState): number {
  let totalCents = 0;
  for (const key in state.mortgages) {
    totalCents += state.mortgages[key];
  }
  return centsToDollars(totalCents);
}

/**
 * Apply weekly mortgage interest and payments.
 * Interest is annual rate / weeks per year, applied to outstanding balance.
 * Returns the total interest charged this week.
 */
export function applyWeeklyMortgageInterest(
  state: FinancialState,
  time: { week: number; year: number },
): number {
  const weeklyRate = MORTGAGE_INTEREST_RATE / WEEKS_PER_YEAR;
  let totalInterest = 0;

  for (const key in state.mortgages) {
    const mortgageCents = state.mortgages[key];
    if (mortgageCents > 0) {
      const interestCents = Math.round(mortgageCents * weeklyRate);
      totalInterest += centsToDollars(interestCents);
      // Interest is charged as a debit
      state.balanceCents -= interestCents;
      state.ledger.push({
        timestamp: { ...time },
        type: "debit",
        amount: centsToDollars(interestCents),
        description: `Mortgage interest on ship ${key}`,
        balanceAfter: getBalance(state),
      });
    }
  }

  return totalInterest;
}

/**
 * Make a mortgage payment for a ship.
 */
export function makeMortgagePayment(
  state: FinancialState,
  shipKey: string,
  amount: number,
  time: { week: number; year: number },
): TransactionResult {
  const mortgageCents = state.mortgages[shipKey] ?? 0;
  if (mortgageCents <= 0) {
    return { success: false, newBalance: getBalance(state), message: "No outstanding mortgage for this ship." };
  }

  const paymentCents = Math.min(dollarsToCents(amount), mortgageCents);
  const paymentDollars = centsToDollars(paymentCents);

  const result = debit(state, paymentDollars, `Mortgage payment on ship ${shipKey}`, time);
  if (result.success) {
    state.mortgages[shipKey] -= paymentCents;
    if (state.mortgages[shipKey] <= 0) {
      delete state.mortgages[shipKey];
    }
  }
  return result;
}
