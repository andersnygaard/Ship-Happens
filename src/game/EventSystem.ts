/**
 * Event system for Ship Happens.
 * Generates random travel events (storms, emergencies, out of fuel)
 * based on voyage distance and ship state.
 */

import {
  STORM_PROBABILITY,
  STORM_DETOUR_DAYS,
  STORM_BEAUFORT_THRESHOLD,
  RESCUE_EVENT_PROBABILITY,
  TOWING_PENALTY,
} from "../data/constants";

// ─── Event Types ──────────────────────────────────────────────────────────────

export type TravelEventType = "storm" | "emergency" | "out-of-fuel";

export interface StormChoice {
  readonly type: "pass-through" | "go-around";
}

export interface TravelEvent {
  readonly type: TravelEventType;
  readonly title: string;
  readonly description: string;
  /** Available choices for the player (empty for acknowledgement-only events). */
  readonly choices: ReadonlyArray<{
    readonly label: string;
    readonly id: string;
  }>;
}

export interface StormConsequence {
  /** Damage percentage applied to ship condition (5-15%). */
  readonly damagePercent: number;
  /** Extra travel days (0 if passing through, 5-10 if going around). */
  readonly extraDays: number;
  /** Description of what happened. */
  readonly message: string;
}

export interface EmergencyConsequence {
  /** Extra delay from the rescue (1-2 days). */
  readonly extraDays: number;
  readonly message: string;
}

export interface OutOfFuelConsequence {
  /** The towing penalty in dollars ($1M). */
  readonly penaltyDollars: number;
  readonly message: string;
}

// ─── Event Generation ─────────────────────────────────────────────────────────

/**
 * Generate random events for a voyage based on distance and ship state.
 * Longer voyages have higher chances of events.
 *
 * @param distanceNm - Distance of the voyage in nautical miles
 * @param shipFuelTons - Current fuel level of the ship
 * @param shipFuelConsumptionPerDay - Daily fuel consumption
 * @param travelDays - Estimated travel days
 * @returns Array of events that occur during the voyage
 */
export function generateTravelEvents(
  distanceNm: number,
  shipFuelTons: number,
  shipFuelConsumptionPerDay: number,
  travelDays: number,
): TravelEvent[] {
  const events: TravelEvent[] = [];

  // Distance multiplier: longer voyages increase event probability
  const distanceFactor = Math.min(distanceNm / 3000, 2.0);

  // Storm check (~30% base for a long voyage, scaled by distance)
  const stormChance = STORM_PROBABILITY * distanceFactor;
  if (Math.random() < stormChance) {
    events.push({
      type: "storm",
      title: `Storm — Beaufort ${STORM_BEAUFORT_THRESHOLD}`,
      description:
        "A severe storm is ahead! You can try to pass through it, risking damage to the ship, or go around it, which will add extra days to the voyage.",
      choices: [
        { label: "Pass Through", id: "pass-through" },
        { label: "Go Around", id: "go-around" },
      ],
    });
  }

  // Emergency/rescue check (~10% for a long voyage)
  const rescueChance = RESCUE_EVENT_PROBABILITY * distanceFactor;
  if (Math.random() < rescueChance) {
    events.push({
      type: "emergency",
      title: "Emergency at Sea",
      description:
        "A person has been spotted in a life raft! International maritime law requires you to render assistance. The rescue will cause a short delay.",
      choices: [{ label: "Rescue Survivor", id: "acknowledge" }],
    });
  }

  // Out of fuel check: based on whether ship has enough fuel for the trip
  const fuelNeeded = shipFuelConsumptionPerDay * travelDays;
  if (shipFuelTons < fuelNeeded) {
    events.push({
      type: "out-of-fuel",
      title: "Out of Fuel!",
      description: `The ship has run out of fuel at sea and must be towed to port. This will cost $${TOWING_PENALTY.toLocaleString()}.`,
      choices: [{ label: "Acknowledge", id: "acknowledge" }],
    });
  }

  return events;
}

// ─── Event Consequence Resolution ─────────────────────────────────────────────

/**
 * Resolve the consequences of a storm event based on the player's choice.
 */
export function resolveStormEvent(choiceId: string): StormConsequence {
  if (choiceId === "pass-through") {
    // Risk 5-15% damage
    const damagePercent = 5 + Math.floor(Math.random() * 11);
    return {
      damagePercent,
      extraDays: 0,
      message: `You sailed through the storm! The ship took ${damagePercent}% damage.`,
    };
  } else {
    // Go around: adds 5-10 extra days, no damage
    const extraDays = 5 + Math.floor(Math.random() * 6);
    return {
      damagePercent: 0,
      extraDays,
      message: `You went around the storm. The detour added ${extraDays} extra days to the voyage.`,
    };
  }
}

/**
 * Resolve the consequences of an emergency rescue event.
 */
export function resolveEmergencyEvent(): EmergencyConsequence {
  const extraDays = 1 + Math.floor(Math.random() * 2);
  return {
    extraDays,
    message: `You rescued a survivor from a life raft. The rescue added ${extraDays} day(s) to the voyage.`,
  };
}

/**
 * Resolve the consequences of running out of fuel.
 */
export function resolveOutOfFuelEvent(): OutOfFuelConsequence {
  return {
    penaltyDollars: TOWING_PENALTY,
    message: `The ship ran out of fuel and had to be towed. Towing cost: $${TOWING_PENALTY.toLocaleString()}.`,
  };
}
