# Feature: Captain Personality & Expanded Crew Events

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: Medium
**Labels**: gameplay-depth, humor, events, immersion, spec-gap
**Estimated Effort**: Medium

## Context & Motivation
The spec emphasizes "Humor first" as a core design principle and describes captains as named individuals with personality (e.g., "captain Moby"). Currently, captains are just a static name string on `OwnedShip` with no gameplay effect. The crew complaint system exists but only fires generic one-liners from `humorTexts.ts` with no consequence — they are purely cosmetic acknowledgement events. Meanwhile, the spec's humor examples include "Crew complaints and mutiny threats over WiFi quality" and other personality-driven content. Expanding captain personality and crew events adds flavor, replayability, and meaningful decisions without changing core mechanics.

## Current State
- `OwnedShip.captainName` is a string set at ship purchase, never used for gameplay logic.
- `generateTravelEvents()` in `EventSystem.ts` has a ~25% chance of a "crew-complaint" event per voyage, but it is acknowledge-only (single "Noted" button) with no consequence.
- `getRandomCrewComplaint()` in `humorTexts.ts` returns a random string from a static array.
- The Port Departure screen shows "MS [Ship], captain [Name]" in the title — this is the only place the captain name surfaces.
- There are no captain stats, no crew morale system, and no events that give the player a meaningful choice related to crew.
- The humor texts file has news headlines and port events but limited crew-specific content.

## Desired Outcome
- Captains have a personality trait (randomly assigned at ship purchase) that affects gameplay in small but noticeable ways — e.g., "Cautious" (suggests going around storms), "Reckless" (handles maneuvering faster but takes more damage), "Frugal" (slightly reduces operating costs), "Superstitious" (refuses to depart on certain days, triggers funny dialogue).
- Crew events become two-choice decisions with minor consequences: e.g., "The crew demands shore leave. Grant 2 extra days in port ($15,000 bonus) or refuse (morale drops, minor speed penalty next voyage)."
- At least 6 new crew event types with humorous descriptions and meaningful (but not game-breaking) consequences.
- Captain personality is visible on the Port Operations and Port Departure screens.
- The tutorial/help panel mentions captain traits as a gameplay element.

## Spec References
- Section "Core Design Principles": "Humor first — The game should be funny: absurd situations, witty dialogue, satirical commentary."
- Section "Humor Examples": "Crew complaints and mutiny threats over WiFi quality" — crew events should be funny and varied.
- Section "Ship Management": "Captain — Named per ship, Individual identity" — implies captains should have more personality.
- Section "Port Departure Screen": "MS [Ship Name], captain [Captain Name]" — captain is a named character in the UI.
- Section "Random Events During Travel": Storm/emergency event pattern (choice-based) — crew events should follow this proven pattern.

## Technical Approach

### Implementation Steps
1. Define a `CaptainTrait` enum in `types.ts` with 5-6 traits: `Cautious`, `Reckless`, `Frugal`, `Superstitious`, `Charismatic`, `StrictDisciplinarian`.
2. Add a `captainTrait` field to `OwnedShip` (randomly assigned during ship purchase in `buyShip()`).
3. Add `generateCrewEvent()` to `EventSystem.ts` that creates two-choice crew events with consequences (grant/refuse pattern). Make the humor text vary by captain trait.
4. Define consequence types: extra days in port, small cash cost/bonus, minor condition effect, speed modifier for next voyage.
5. Integrate crew events into `generateTravelEvents()` — replace or augment the existing acknowledge-only crew-complaint with the new decision-based system.
6. Add captain trait display to Port Operations ship status panel and Port Departure screen title.
7. Add trait-specific flavor text: a "Superstitious" captain might add a funny warning before departing on day 13, a "Reckless" captain might get a +1 throttle level in maneuvering.
8. Add at least 15 new crew event humor texts to `humorTexts.ts`.
9. Ensure backward compatibility: existing saves without `captainTrait` get a random trait assigned on load.

### Files to Create
- None required (all changes extend existing files).

### Files to Modify
- `src/data/types.ts` — Add `CaptainTrait` enum and `captainTrait` field to `OwnedShip`.
- `src/game/EventSystem.ts` — Add `generateCrewEvent()` with two-choice crew events and consequence resolution.
- `src/game/GameState.ts` — Assign random captain trait in `buyShip()`. Add backward-compatible migration for saves.
- `src/data/humorTexts.ts` — Add crew event descriptions, trait-specific flavor text (at least 15 new entries).
- `src/ui/screens/PortOperationsScreen.ts` — Display captain trait in ship status panel.
- `src/ui/screens/PortDepartureScreen.ts` — Show captain trait in title area.
- `src/ui/screens/TravelScreen.ts` — Handle new crew event type with two-choice resolution.
- `src/ui/components/HelpPanel.ts` — Add captain traits to the gameplay guide.

### Dependencies
- Existing event system pattern (storm/emergency two-choice events) serves as the template.
- No new external dependencies.

### Risks & Considerations
- Captain traits should provide flavor and minor bonuses/penalties, not dominant strategic advantages. Keep the effect magnitude small (5-10% range).
- Crew events with consequences must be balanced so that "always grant" or "always refuse" is not the obvious dominant strategy.
- Backward compatibility for existing saves is essential — a simple migration that assigns a random trait to captains without one.
- The humor texts should be diverse enough to avoid repetition within a normal play session (at least 3-4 per event type).

## Acceptance Criteria
- [x] Each captain receives a personality trait at ship purchase time (random from 5-6 options).
- [x] Captain trait is displayed on Port Operations and Port Departure screens.
- [x] At least 6 different crew event types with two-choice decisions (not just acknowledge).
- [x] Crew event choices have minor but tangible gameplay consequences (cost, delay, condition, or speed).
- [x] At least 15 new humor texts for crew events across different trait types.
- [x] Existing save files load correctly — captains without traits get one assigned.
- [x] Crew events are funny and varied, fitting the "humor first" design principle.
- [x] Captain traits do not create dominant strategies (balanced, minor effects only).

---
**Next Steps**: Ready for implementation.
