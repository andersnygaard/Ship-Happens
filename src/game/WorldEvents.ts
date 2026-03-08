/**
 * World Events system for Ship Happens.
 * Generates global events that affect gameplay — trade sanctions,
 * canal blockages, piracy zones, and other disruptions.
 * Events modify route costs, block ports temporarily, or add surcharges.
 *
 * Events are stored in FullGameState.worldEvents and managed via
 * state-passing functions (no module-level mutable state).
 */

import { pickRandom } from "../data/humorTexts";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorldEventType =
  | "canal-blockage"
  | "trade-sanctions"
  | "piracy-zone"
  | "port-strike"
  | "fuel-crisis"
  | "environmental-disaster"
  | "diplomatic-incident"
  | "tech-failure"
  | "tariff-war"
  | "social-media-panic"
  | "absurd-regulation"
  | "climate-event";

export interface WorldEvent {
  readonly id: string;
  readonly type: WorldEventType;
  readonly headline: string;
  readonly description: string;
  /** Port IDs affected (empty = global effect). */
  readonly affectedPortIds: readonly string[];
  /** Multiplier to route cost (1.0 = normal, 1.5 = 50% surcharge). */
  readonly costMultiplier: number;
  /** If true, affected ports are completely blocked. */
  readonly blocksPort: boolean;
  /** Duration in game weeks. */
  readonly durationWeeks: number;
  /** The game week this event started. */
  startWeek: number;
  /** The game year this event started. */
  startYear: number;
}

// ─── Event Templates ─────────────────────────────────────────────────────────

interface WorldEventTemplate {
  readonly type: WorldEventType;
  readonly headlines: readonly string[];
  readonly descriptions: readonly string[];
  readonly costMultiplier: number;
  readonly blocksPort: boolean;
  readonly durationWeeks: [number, number]; // [min, max]
  /** Port IDs this event type can affect. Empty = random port selected. */
  readonly targetPortIds?: readonly string[];
}

const EVENT_TEMPLATES: readonly WorldEventTemplate[] = [
  {
    type: "canal-blockage",
    headlines: [
      "Suez Canal blocked by container ship doing a U-turn",
      "Panama Canal clogged by world record rubber duck convoy",
      "Suez Canal closed after captain tries to parallel park sideways",
    ],
    descriptions: [
      "A massive container ship has wedged itself across the canal. Engineers are trying to free it with a fleet of tugboats and one very optimistic excavator.",
      "A convoy of ships carrying novelty rubber ducks has caused a catastrophic blockage. Quacking sounds reported from 50 miles away.",
    ],
    costMultiplier: 1.8,
    blocksPort: false,
    durationWeeks: [2, 6],
  },
  {
    type: "trade-sanctions",
    headlines: [
      "New trade sanctions ban export of good vibes to major ports",
      "Trade embargo declared — only sarcasm may pass freely",
      "International sanctions imposed after diplomatic meme incident",
    ],
    descriptions: [
      "New trade restrictions have been imposed, significantly increasing costs for all shipments to affected regions.",
      "A diplomatic incident involving a misinterpreted emoji has led to severe trade restrictions.",
    ],
    costMultiplier: 1.5,
    blocksPort: false,
    durationWeeks: [4, 12],
    targetPortIds: ["shanghai", "singapore", "rotterdam", "hamburg"],
  },
  {
    type: "piracy-zone",
    headlines: [
      "Pirates spotted near Gulf of Aden — now accepting contactless payments",
      "Maritime freelancers establish toll booth in Strait of Malacca",
      "Pirate activity surges — now offering loyalty cards",
    ],
    descriptions: [
      "Increased pirate activity has been reported in the region. Ships are advised to travel in convoys and hide their good silverware.",
      "A new pirate syndicate is operating in the area. They've reportedly set up a drive-through robbery service.",
    ],
    costMultiplier: 1.4,
    blocksPort: false,
    durationWeeks: [3, 8],
    targetPortIds: ["mumbai", "karachi", "singapore", "dubai"],
  },
  {
    type: "port-strike",
    headlines: [
      "Port workers on strike — demand artisanal coffee in all break rooms",
      "Dock workers walk out after crane WiFi password changed without notice",
      "General strike at port — workers want 'Casual Friday' to include pajamas",
    ],
    descriptions: [
      "Port workers have gone on strike over working conditions. The port is temporarily closed to all commercial traffic.",
      "A labor dispute has shut down port operations. Union representatives say they will return 'when the vibes improve'.",
    ],
    costMultiplier: 1.0,
    blocksPort: true,
    durationWeeks: [1, 4],
  },
  {
    type: "fuel-crisis",
    headlines: [
      "Global fuel prices spike after oil rig converts to wind power 'as a joke'",
      "Fuel shortage — tankers stuck in traffic jam at Strait of Hormuz",
      "Bunker fuel prices triple after refinery mistakenly produces artisanal olive oil",
    ],
    descriptions: [
      "A global fuel supply disruption has caused bunker fuel prices to skyrocket. All refueling costs are significantly increased.",
      "Fuel shortages are affecting ports worldwide. Ships are advised to conserve fuel and consider sailing in neutral.",
    ],
    costMultiplier: 2.0,
    blocksPort: false,
    durationWeeks: [2, 6],
  },
  {
    type: "environmental-disaster",
    headlines: [
      "Massive algae bloom turns harbor bright green — tourists love it, ships don't",
      "Oil spill cleanup attracts world's largest gathering of angry pelicans",
      "Volcanic eruption near port creates new island — customs unsure who owns it",
    ],
    descriptions: [
      "An environmental incident has disrupted port operations. Cleanup crews are on site but progress is slow.",
      "A natural disaster has affected port infrastructure. Limited operations are available at increased cost.",
    ],
    costMultiplier: 1.3,
    blocksPort: true,
    durationWeeks: [2, 8],
  },
  {
    type: "diplomatic-incident",
    headlines: [
      "Two countries dispute ownership of lighthouse — both claim it blinks in their language",
      "International incident after ambassador's yacht cuts off cargo ship",
      "Diplomatic crisis over who invented containerized shipping — historians baffled",
    ],
    descriptions: [
      "A diplomatic incident has led to increased port security and inspection delays. All ships face additional processing time.",
      "Relations between nations have soured after a maritime disagreement. Trade is affected but not halted.",
    ],
    costMultiplier: 1.3,
    blocksPort: false,
    durationWeeks: [2, 6],
  },
  {
    type: "tech-failure",
    headlines: [
      "Port GPS system hacked — all ships directed to same parking spot",
      "Automated port crane gains sentience, refuses to work on Mondays",
      "Global shipping software update causes all manifests to display in Wingdings",
    ],
    descriptions: [
      "A major technology failure has disrupted port operations. Manual operations are in effect, causing delays and surcharges.",
      "A software glitch has brought the port's automated systems to a halt. Engineers are 'turning it off and on again'.",
    ],
    costMultiplier: 1.2,
    blocksPort: false,
    durationWeeks: [1, 3],
  },
  // ─── New satirical event templates ──────────────────────────────────────────
  {
    type: "tariff-war",
    headlines: [
      "President announces 500% tariff on imports of common sense",
      "Trade war escalates: both sides now taxing each other's tariffs",
      "New tariff on foreign-made tariffs creates infinite loop — economists baffled",
      "Retaliatory tariffs on tariff consultants leave no one able to calculate costs",
    ],
    descriptions: [
      "A sudden tariff escalation has sent shipping costs soaring. Customs officials are reportedly using a Magic 8-Ball to determine duty rates.",
      "An escalating trade war has turned import costs into a game of roulette. Shippers report that paperwork now weighs more than actual cargo.",
    ],
    costMultiplier: 1.6,
    blocksPort: false,
    durationWeeks: [3, 10],
    targetPortIds: ["shanghai", "new-york", "los-angeles", "hamburg", "rotterdam"],
  },
  {
    type: "social-media-panic",
    headlines: [
      "Viral TikTok claims shipping containers cause 5G — ports flooded with protesters",
      "Influencer accidentally live-streams classified port security codes",
      "Crypto bro buys entire port, renames it 'BlockchainHarbor.io' — all operations halted",
    ],
    descriptions: [
      "A viral social media post has caused mass panic at several ports. Security forces are overwhelmed by influencers demanding to speak to the port manager.",
      "An internet celebrity's ill-advised stunt has shut down port operations. The hashtag #PortGate is trending worldwide.",
    ],
    costMultiplier: 1.3,
    blocksPort: true,
    durationWeeks: [1, 3],
    targetPortIds: ["los-angeles", "new-york", "london", "tokyo", "sydney"],
  },
  {
    type: "absurd-regulation",
    headlines: [
      "EU mandates all ships must carry a minimum of 3 emotional support seagulls",
      "New IMO regulation requires ships to indicate with turn signals before turning",
      "UN resolution: all cargo manifests must now be written in haiku form",
    ],
    descriptions: [
      "A bizarre new maritime regulation has brought international shipping to its knees. Compliance officers are reportedly in tears.",
      "The latest regulatory update has left the shipping industry scrambling. Lawyers are charging triple their usual rates to interpret the new rules.",
    ],
    costMultiplier: 1.4,
    blocksPort: false,
    durationWeeks: [2, 8],
  },
  {
    type: "climate-event",
    headlines: [
      "Hurricane season starts three months early — meteorologists blame 'vibes'",
      "Unprecedented ice melt opens new Arctic shipping route — penguins file lawsuit",
      "Freak tidal wave caused by whale belly flop damages port infrastructure",
      "Fog so thick at port that ships are navigating by smell",
    ],
    descriptions: [
      "Extreme weather conditions have disrupted port operations and increased costs across the region. Insurance companies are pretending their phones are broken.",
      "A rare climate event has made port access dangerous. The coast guard recommends 'staying home and watching Netflix' until conditions improve.",
    ],
    costMultiplier: 1.5,
    blocksPort: true,
    durationWeeks: [1, 4],
    targetPortIds: ["tokyo", "mumbai", "hong-kong", "sydney", "rio-de-janeiro", "new-york"],
  },
] as const;

// ─── Available port IDs for random targeting ─────────────────────────────────

const ALL_PORT_IDS = [
  "rotterdam", "hamburg", "london", "new-york", "shanghai",
  "singapore", "dubai", "mumbai", "karachi", "tokyo",
  "sydney", "rio-de-janeiro", "buenos-aires", "cape-town",
  "hong-kong", "los-angeles",
];

// ─── World Events State Functions ───────────────────────────────────────────

let nextEventId = 1;

/**
 * Generate a unique event ID.
 */
function generateEventId(): string {
  return `world-event-${nextEventId++}`;
}

/**
 * Check if a world event should be generated this week.
 * Roughly 15% chance per week if fewer than 3 events are active.
 * Operates on the provided events array (from game state).
 */
export function maybeGenerateWorldEvent(
  currentWeek: number,
  currentYear: number,
  activeEvents?: WorldEvent[],
): WorldEvent | null {
  const events = activeEvents ?? [];

  // Don't stack too many events
  if (events.length >= 3) return null;

  // 15% chance per week
  if (Math.random() > 0.15) return null;

  const template = pickRandom(EVENT_TEMPLATES as unknown as readonly WorldEventTemplate[]);

  // Pick affected port(s)
  let affectedPortIds: string[];
  if (template.targetPortIds && template.targetPortIds.length > 0) {
    // Pick 1-2 ports from the template's target list
    const shuffled = [...template.targetPortIds].sort(() => Math.random() - 0.5);
    affectedPortIds = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));
  } else if (template.blocksPort) {
    // For blocking events, pick a random port
    affectedPortIds = [pickRandom(ALL_PORT_IDS)];
  } else {
    // Global effect
    affectedPortIds = [];
  }

  const [minDuration, maxDuration] = template.durationWeeks;
  const duration = minDuration + Math.floor(Math.random() * (maxDuration - minDuration + 1));

  const event: WorldEvent = {
    id: generateEventId(),
    type: template.type,
    headline: pickRandom(template.headlines),
    description: pickRandom(template.descriptions),
    affectedPortIds,
    costMultiplier: template.costMultiplier,
    blocksPort: template.blocksPort,
    durationWeeks: duration,
    startWeek: currentWeek,
    startYear: currentYear,
  };

  return event;
}

/**
 * Expire events that have passed their duration.
 * Returns a tuple: [remaining events, expired events].
 */
export function expireWorldEvents(
  events: WorldEvent[],
  currentWeek: number,
  currentYear: number,
): { remaining: WorldEvent[]; expired: WorldEvent[] } {
  const remaining: WorldEvent[] = [];
  const expired: WorldEvent[] = [];
  for (const event of events) {
    const elapsedWeeks = (currentYear - event.startYear) * 52 + (currentWeek - event.startWeek);
    if (elapsedWeeks >= event.durationWeeks) {
      expired.push(event);
    } else {
      remaining.push(event);
    }
  }
  return { remaining, expired };
}

/**
 * Get all currently active world events from the provided array.
 */
export function getActiveWorldEvents(events?: readonly WorldEvent[]): readonly WorldEvent[] {
  return events ?? [];
}

/**
 * Check if a specific port is blocked by any active event.
 */
export function isPortBlocked(portId: string, events?: readonly WorldEvent[]): boolean {
  const evts = events ?? [];
  return evts.some(
    (e) => e.blocksPort && e.affectedPortIds.includes(portId),
  );
}

/**
 * Get the cost multiplier for a specific port based on active events.
 * Returns the highest multiplier if multiple events affect the port.
 */
export function getPortCostMultiplier(portId: string, events?: readonly WorldEvent[]): number {
  const evts = events ?? [];
  let maxMultiplier = 1.0;
  for (const event of evts) {
    // Global events (no specific ports) affect everyone
    if (event.affectedPortIds.length === 0 || event.affectedPortIds.includes(portId)) {
      maxMultiplier = Math.max(maxMultiplier, event.costMultiplier);
    }
  }
  return maxMultiplier;
}

/**
 * Get event headlines suitable for the news ticker.
 * Returns headlines from active world events.
 */
export function getWorldEventHeadlines(events?: readonly WorldEvent[]): string[] {
  const evts = events ?? [];
  return evts.map((e) => e.headline);
}

/**
 * Get all active events that affect a specific port (blocked or cost multiplier).
 */
export function getEventsAffectingPort(portId: string, events?: readonly WorldEvent[]): WorldEvent[] {
  const evts = events ?? [];
  return evts.filter(
    (e) => e.affectedPortIds.includes(portId) || e.affectedPortIds.length === 0,
  );
}

/**
 * Reset the event ID counter (e.g., for a new game).
 */
export function resetWorldEventIds(): void {
  nextEventId = 1;
}
