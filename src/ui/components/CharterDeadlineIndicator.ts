/**
 * CharterDeadlineIndicator — Reusable deadline display component.
 * Shows remaining days until charter delivery deadline with color-coded urgency.
 *
 * Color coding thresholds:
 * - Green: > 50% time remaining
 * - Yellow: 25-50% time remaining
 * - Red: < 25% time remaining
 * - Flashing red: overdue (past deadline)
 */

import type { CharterContract } from "../../data/types";

// ─── Urgency thresholds (as fraction of total deadline) ───────────────────────

/** Above this fraction of time remaining, the indicator is green. */
const GREEN_THRESHOLD = 0.5;
/** Above this fraction of time remaining, the indicator is yellow. Below is red. */
const YELLOW_THRESHOLD = 0.25;

export type DeadlineUrgency = "safe" | "warning" | "danger" | "overdue";

export interface CharterDeadlineInfo {
  /** Days remaining until deadline (negative if overdue). */
  remainingDays: number;
  /** Total deadline days from the charter contract. */
  totalDeadlineDays: number;
  /** Fraction of time remaining (0-1, can be negative if overdue). */
  fractionRemaining: number;
  /** Urgency level for color coding. */
  urgency: DeadlineUrgency;
}

/**
 * Calculate charter deadline information.
 * Uses the same calculation as deliverCargo() in GameState.ts:
 *   daysElapsed = totalDaysElapsed - charter.acceptedDay
 *   isLate = daysElapsed > charter.deliveryDeadlineDays
 */
export function getCharterDeadlineInfo(
  charter: CharterContract & { acceptedDay: number },
  totalDaysElapsed: number,
): CharterDeadlineInfo {
  const daysElapsed = totalDaysElapsed - charter.acceptedDay;
  const remainingDays = charter.deliveryDeadlineDays - daysElapsed;
  const totalDeadlineDays = charter.deliveryDeadlineDays;
  const fractionRemaining = totalDeadlineDays > 0
    ? remainingDays / totalDeadlineDays
    : 0;

  let urgency: DeadlineUrgency;
  if (remainingDays < 0) {
    urgency = "overdue";
  } else if (fractionRemaining < YELLOW_THRESHOLD) {
    urgency = "danger";
  } else if (fractionRemaining < GREEN_THRESHOLD) {
    urgency = "warning";
  } else {
    urgency = "safe";
  }

  return { remainingDays, totalDeadlineDays, fractionRemaining, urgency };
}

/**
 * Check if a charter is in the danger zone (< 25% time remaining).
 * Used for triggering warning toasts.
 */
export function isCharterInDangerZone(
  charter: CharterContract & { acceptedDay: number },
  totalDaysElapsed: number,
): boolean {
  const info = getCharterDeadlineInfo(charter, totalDaysElapsed);
  return info.urgency === "danger" || info.urgency === "overdue";
}

/**
 * Get the CSS color class name for a deadline urgency level.
 */
function getUrgencyColorVar(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "safe":
      return "var(--color-success, #44ff44)";
    case "warning":
      return "var(--color-gold, #ffaa33)";
    case "danger":
    case "overdue":
      return "var(--color-danger, #ff4444)";
  }
}

/**
 * Create a compact deadline badge element.
 * Used in the World Map footer and other compact contexts.
 */
export function createDeadlineBadge(
  charter: CharterContract & { acceptedDay: number },
  totalDaysElapsed: number,
): HTMLElement {
  const info = getCharterDeadlineInfo(charter, totalDaysElapsed);

  const badge = document.createElement("span");
  badge.className = "charter-deadline-badge";
  badge.style.color = getUrgencyColorVar(info.urgency);

  if (info.urgency === "overdue") {
    badge.classList.add("charter-deadline-overdue");
    badge.textContent = `OVERDUE ${Math.abs(info.remainingDays)}d`;
  } else {
    badge.textContent = `Deadline: ${info.remainingDays}d`;
  }

  badge.title = `Charter deadline: ${info.remainingDays} of ${info.totalDeadlineDays} days remaining`;

  return badge;
}

/**
 * Create a detailed deadline row for use in status panels.
 * Shows "Deadline: X days" with color coding and urgency label.
 */
export function createDeadlineStatusRow(
  charter: CharterContract & { acceptedDay: number },
  totalDaysElapsed: number,
): { label: string; value: string; color: string; urgency: DeadlineUrgency } {
  const info = getCharterDeadlineInfo(charter, totalDaysElapsed);

  let value: string;
  if (info.urgency === "overdue") {
    value = `OVERDUE by ${Math.abs(info.remainingDays)} days`;
  } else {
    value = `${info.remainingDays} days (of ${info.totalDeadlineDays})`;
  }

  return {
    label: "Deadline:",
    value,
    color: getUrgencyColorVar(info.urgency),
    urgency: info.urgency,
  };
}

/**
 * Format a deadline countdown string for the travel HUD.
 */
export function formatDeadlineCountdown(
  charter: CharterContract & { acceptedDay: number },
  totalDaysElapsed: number,
): string {
  const info = getCharterDeadlineInfo(charter, totalDaysElapsed);

  if (info.urgency === "overdue") {
    return `Charter OVERDUE by ${Math.abs(info.remainingDays)}d!`;
  }
  return `Charter deadline: ${info.remainingDays}d remaining`;
}
