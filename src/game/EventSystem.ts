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
  CRITICAL_CONDITION_PERCENT,
  VERY_LOW_CONDITION_PERCENT,
  BREAKDOWN_BASE_PROBABILITY,
  BREAKDOWN_MAX_PROBABILITY,
  BREAKDOWN_TOWING_COST,
  BREAKDOWN_FIELD_REPAIR_COST,
  BREAKDOWN_TOWING_DELAY_DAYS,
  BREAKDOWN_FIELD_REPAIR_DELAY_DAYS,
  BREAKDOWN_HULL_LEAK_DAMAGE,
  BREAKDOWN_ELECTRICAL_DAMAGE,
} from "../data/constants";
import {
  getRandomCrewComplaint,
  getRandomPortEvent,
  getRandomBreakdownEngineText,
  getRandomBreakdownHullText,
  getRandomBreakdownElectricalText,
  getRandomCrewEventTemplate,
  getCaptainTraitCommentary,
} from "../data/humorTexts";

// ─── Event Types ──────────────────────────────────────────────────────────────

export type TravelEventType = "storm" | "emergency" | "out-of-fuel" | "crew-complaint" | "crew-event" | "port-event" | "breakdown";

export type BreakdownSubtype = "engine-failure" | "hull-leak" | "electrical-failure";

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

export interface BreakdownConsequence {
  /** The subtype of breakdown that occurred. */
  readonly subtype: BreakdownSubtype;
  /** Financial cost of the breakdown resolution. */
  readonly costDollars: number;
  /** Extra travel days caused by the breakdown. */
  readonly extraDays: number;
  /** Additional condition damage (percentage points). */
  readonly conditionDamage: number;
  /** Description of what happened. */
  readonly message: string;
}

export interface CrewEventConsequence {
  /** Financial cost (positive = player pays, negative = player receives). */
  readonly costDollars: number;
  /** Extra travel days (delay). */
  readonly extraDays: number;
  /** Condition change (negative = damage, positive = bonus). */
  readonly conditionChange: number;
  /** Description of what happened. */
  readonly message: string;
}

// ─── Event Generation ─────────────────────────────────────────────────────────

/**
 * Calculate breakdown probability based on ship condition.
 * Returns 0 if condition is above the critical threshold.
 * Scales linearly from BREAKDOWN_BASE_PROBABILITY at 20% condition
 * to BREAKDOWN_MAX_PROBABILITY at ~5% condition.
 */
export function calculateBreakdownProbability(conditionPercent: number): number {
  if (conditionPercent >= CRITICAL_CONDITION_PERCENT) return 0;

  // Linear interpolation from base probability at critical threshold
  // to max probability at very low condition
  const range = CRITICAL_CONDITION_PERCENT - VERY_LOW_CONDITION_PERCENT;
  const belowThreshold = CRITICAL_CONDITION_PERCENT - conditionPercent;
  const t = Math.min(belowThreshold / range, 1.0);

  return BREAKDOWN_BASE_PROBABILITY + t * (BREAKDOWN_MAX_PROBABILITY - BREAKDOWN_BASE_PROBABILITY);
}

/**
 * Pick a random breakdown subtype.
 */
function pickBreakdownSubtype(): BreakdownSubtype {
  const roll = Math.random();
  if (roll < 0.4) return "engine-failure";
  if (roll < 0.75) return "hull-leak";
  return "electrical-failure";
}

/**
 * Generate a breakdown event based on ship condition.
 * Returns null if condition is above threshold or probability roll fails.
 */
export function generateBreakdownEvent(conditionPercent: number): TravelEvent | null {
  const probability = calculateBreakdownProbability(conditionPercent);
  if (probability <= 0 || Math.random() >= probability) return null;

  const subtype = pickBreakdownSubtype();

  let title: string;
  let description: string;

  switch (subtype) {
    case "engine-failure":
      title = "Engine Failure!";
      description = getRandomBreakdownEngineText() +
        "\n\nYou can attempt field repairs (cheaper but takes time) or call for a tow (expensive but faster... sort of).";
      break;
    case "hull-leak":
      title = "Hull Leak!";
      description = getRandomBreakdownHullText() +
        "\n\nYou can patch it up at sea (risky, may cause more damage) or call for emergency assistance.";
      break;
    case "electrical-failure":
      title = "Electrical Failure!";
      description = getRandomBreakdownElectricalText() +
        "\n\nYour crew can attempt a jury-rig fix or you can request a tow to the nearest port.";
      break;
  }

  return {
    type: "breakdown",
    title,
    description,
    choices: [
      { label: "Attempt Field Repair", id: `breakdown-repair-${subtype}` },
      { label: "Call for Towing", id: `breakdown-tow-${subtype}` },
    ],
  };
}

/**
 * Generate random events for a voyage based on distance and ship state.
 * Longer voyages have higher chances of events.
 *
 * @param distanceNm - Distance of the voyage in nautical miles
 * @param shipFuelTons - Current fuel level of the ship
 * @param shipFuelConsumptionPerDay - Daily fuel consumption
 * @param travelDays - Estimated travel days
 * @param shipConditionPercent - Current ship condition (0-100), used for breakdown checks
 * @returns Array of events that occur during the voyage
 */
export function generateTravelEvents(
  distanceNm: number,
  shipFuelTons: number,
  shipFuelConsumptionPerDay: number,
  travelDays: number,
  shipConditionPercent: number = 100,
  captainTrait?: string,
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

  // Crew event (~25% for longer voyages, scaled by travel days)
  // Now generates two-choice decision events instead of acknowledge-only complaints
  const crewEventChance = Math.min(0.25 * (travelDays / 7), 0.5);
  if (Math.random() < crewEventChance) {
    const crewEvent = generateCrewEvent(captainTrait);
    if (crewEvent) {
      events.push(crewEvent);
    }
  }

  // Breakdown check: only for ships below critical condition threshold
  const breakdownEvent = generateBreakdownEvent(shipConditionPercent);
  if (breakdownEvent) {
    events.push(breakdownEvent);
  }

  return events;
}

// ─── Crew Event Generation & Resolution ───────────────────────────────────────

/**
 * Generate a two-choice crew event with humorous description.
 * Optionally biased toward the captain's personality trait.
 */
export function generateCrewEvent(captainTrait?: string): TravelEvent | null {
  const template = getRandomCrewEventTemplate(captainTrait);

  // Add captain trait commentary if available
  let description = template.description;
  if (captainTrait) {
    const commentary = getCaptainTraitCommentary(captainTrait);
    if (commentary) {
      description += `\n\n${commentary}`;
    }
  }

  return {
    type: "crew-event",
    title: template.title,
    description,
    choices: [
      { label: template.choiceA.label, id: template.choiceA.id },
      { label: template.choiceB.label, id: template.choiceB.id },
    ],
  };
}

/**
 * Resolve a crew event based on the player's choice.
 * "Grant" choices typically cost money but avoid penalties.
 * "Deny" choices are free but may cause minor condition loss or delays.
 * Effects are intentionally small (5-10% range) to avoid dominant strategies.
 */
export function resolveCrewEvent(choiceId: string): CrewEventConsequence {
  // Grant choices (choiceA) — spend money, positive outcome
  switch (choiceId) {
    case "crew-grant-shore-leave":
      return {
        costDollars: 15_000,
        extraDays: 2,
        conditionChange: 0,
        message: "Shore leave granted! The crew returns refreshed, tanned, and with several questionable souvenirs. Cost: $15,000. Delay: 2 days.",
      };
    case "crew-deny-shore-leave":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -2,
        message: "Shore leave denied. The crew is grumbling, and someone has drawn an unflattering caricature of you in the mess hall. Ship condition: -2%.",
      };
    case "crew-grant-wifi":
      return {
        costDollars: 10_000,
        extraDays: 0,
        conditionChange: 0,
        message: "WiFi upgraded! The crew is now happily streaming cat videos instead of plotting mutiny. Cost: $10,000.",
      };
    case "crew-deny-wifi":
      return {
        costDollars: 0,
        extraDays: 1,
        conditionChange: -1,
        message: "WiFi remains terrible. The crew staged a 'digital detox protest' that lasted one day. They're still sulking. Delay: 1 day. Condition: -1%.",
      };
    case "crew-grant-chef":
      return {
        costDollars: 20_000,
        extraDays: 0,
        conditionChange: 2,
        message: "New chef hired! The crew is ecstatic. The first meal was so good, two sailors cried. Cost: $20,000. Morale boost: +2% condition.",
      };
    case "crew-deny-chef":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -3,
        message: "The crew continues on instant noodles. Three sailors have developed a worrying thousand-yard stare at mealtimes. Condition: -3%.",
      };
    case "crew-deny-karaoke":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -2,
        message: "Karaoke machine confiscated. The night watch is now humming sea shanties passive-aggressively. Condition: -2%.",
      };
    case "crew-grant-karaoke":
      return {
        costDollars: 8_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Better speakers purchased! Thursday Karaoke Night is now an official ship tradition. The first mate's 'My Heart Will Go On' is surprisingly emotional. Cost: $8,000. Condition: +1%.",
      };
    case "crew-grant-ritual":
      return {
        costDollars: 5_000,
        extraDays: 1,
        conditionChange: 0,
        message: "Cleansing ritual performed! The crew burned sage, threw salt overboard, and sang something that sounded vaguely nautical. The albatross left. Cost: $5,000. Delay: 1 day.",
      };
    case "crew-deny-ritual":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -2,
        message: "You dismissed the superstition. The albatross is still there. The crew is convinced doom is imminent. Condition: -2%.",
      };
    case "crew-grant-gym":
      return {
        costDollars: 12_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Gym equipment installed! The crew is now working out instead of causing trouble. The bosun has developed an impressive bicep. Cost: $12,000. Condition: +1%.",
      };
    case "crew-deny-gym":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -1,
        message: "Gym request denied. The crew is now doing push-ups on the cargo deck out of spite. One container was knocked loose. Condition: -1%.",
      };
    case "crew-grant-pet":
      return {
        costDollars: 5_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Captain Jr. the goat is now an official crew member. The crew's morale has never been higher. Cost: $5,000 (feed). Condition: +1%.",
      };
    case "crew-deny-pet":
      return {
        costDollars: 0,
        extraDays: 1,
        conditionChange: -1,
        message: "The goat was removed at the next port. The crew held a tearful farewell ceremony. Productivity dropped. Delay: 1 day. Condition: -1%.",
      };
    case "crew-grant-overtime":
      return {
        costDollars: 18_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Overtime paid! The crew now refers to you as 'the reasonable one.' The union rep filed his 47 pages anyway, 'for the record.' Cost: $18,000. Condition: +1%.",
      };
    case "crew-deny-overtime":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -2,
        message: "Overtime denied. The crew is now performing all tasks at minimum speed, citing 'work-to-rule.' Everything takes slightly longer. Condition: -2%.",
      };
    case "crew-grant-movies":
      return {
        costDollars: 6_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Streaming subscription activated! Movie night attendance: 100%. The navigator cried during Finding Nemo. Cost: $6,000. Condition: +1%.",
      };
    case "crew-deny-movies":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -1,
        message: "No new movies. The crew has now memorized every line of Titanic. The bosun keeps yelling 'I'm the king of the world!' from the bow. Condition: -1%.",
      };
    case "crew-grant-band":
      return {
        costDollars: 10_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Soundproofing installed! 'Propeller Death' now practices without deafening the bridge. Their first album 'Full Speed Astern' is surprisingly good. Cost: $10,000. Condition: +1%.",
      };
    case "crew-deny-band":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -2,
        message: "The band has been silenced. The chief engineer is now expressing himself through passive-aggressive engine maintenance. Condition: -2%.",
      };
    case "crew-grant-paint":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: 2,
        message: "The flames stay! The crew is thrilled. Several port officials have taken photos. Your ship is now the most recognizable vessel in the fleet. Condition: +2%.",
      };
    case "crew-deny-paint":
      return {
        costDollars: 8_000,
        extraDays: 1,
        conditionChange: 0,
        message: "Ship repainted to regulation colors. The crew mourns the loss of their artistic vision. Cost: $8,000. Delay: 1 day.",
      };
    case "crew-grant-coffee":
      return {
        costDollars: 7_000,
        extraDays: 0,
        conditionChange: 1,
        message: "Artisanal coffee machine installed! Productivity is up, and the first mate's latte art is surprisingly good. Cost: $7,000. Condition: +1%.",
      };
    case "crew-deny-coffee":
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: -1,
        message: "Instant coffee it is. The crew has started a 'coffee quality awareness campaign' involving protest signs taped to every surface. Condition: -1%.",
      };
    default:
      // Fallback for unknown choice IDs — treat as acknowledge
      return {
        costDollars: 0,
        extraDays: 0,
        conditionChange: 0,
        message: "The crew situation was resolved without further incident.",
      };
  }
}

// ─── Port Arrival Events ──────────────────────────────────────────────────────

/**
 * Generate a random humor event when arriving at a port.
 * ~40% chance of a funny port event on arrival.
 */
export function generatePortArrivalEvent(): TravelEvent | null {
  if (Math.random() > 0.4) return null;

  const portEvent = getRandomPortEvent();
  return {
    type: "port-event",
    title: "Port News",
    description: portEvent,
    choices: [{ label: "Interesting...", id: "acknowledge" }],
  };
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

/**
 * Resolve the consequences of a breakdown event based on the player's choice.
 * The choiceId encodes both the resolution type and the breakdown subtype.
 */
export function resolveBreakdownEvent(choiceId: string): BreakdownConsequence {
  const isTow = choiceId.startsWith("breakdown-tow-");
  const subtype = choiceId.replace("breakdown-repair-", "").replace("breakdown-tow-", "") as BreakdownSubtype;

  if (isTow) {
    // Towing: expensive but no additional condition damage
    return {
      subtype,
      costDollars: BREAKDOWN_TOWING_COST,
      extraDays: BREAKDOWN_TOWING_DELAY_DAYS,
      conditionDamage: 0,
      message: `A tow was called. Cost: $${BREAKDOWN_TOWING_COST.toLocaleString()}. Delay: ${BREAKDOWN_TOWING_DELAY_DAYS} days. At least nothing else broke... probably.`,
    };
  }

  // Field repair: cheaper but causes additional condition damage depending on subtype
  let conditionDamage: number;
  let flavorSuffix: string;

  switch (subtype) {
    case "hull-leak":
      conditionDamage = BREAKDOWN_HULL_LEAK_DAMAGE;
      flavorSuffix = "The patch is holding... for now. The crew used someone's undershirt as a gasket.";
      break;
    case "electrical-failure":
      conditionDamage = BREAKDOWN_ELECTRICAL_DAMAGE;
      flavorSuffix = "The jury-rig fix involved duct tape and optimism. Instruments are mostly working again.";
      break;
    case "engine-failure":
    default:
      conditionDamage = 0;
      flavorSuffix = "The crew managed to get the engine running again. It sounds like a coffee grinder, but it works.";
      break;
  }

  return {
    subtype,
    costDollars: BREAKDOWN_FIELD_REPAIR_COST,
    extraDays: BREAKDOWN_FIELD_REPAIR_DELAY_DAYS,
    conditionDamage,
    message: `Field repair completed. Cost: $${BREAKDOWN_FIELD_REPAIR_COST.toLocaleString()}. Delay: ${BREAKDOWN_FIELD_REPAIR_DELAY_DAYS} days.${conditionDamage > 0 ? ` Additional damage: ${conditionDamage}%.` : ""} ${flavorSuffix}`,
  };
}
