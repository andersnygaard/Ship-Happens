# Feature: Ship Condition Breakdown & Risk Mechanics

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay-depth, simulation, events, ship-management
**Estimated Effort**: Medium

## Context & Motivation
The spec defines `CRITICAL_CONDITION_PERCENT = 20` as a threshold where ships are "at risk of breakdown," yet there is currently no gameplay consequence for low condition. A ship at 5% condition sails identically to one at 100%. This undermines the repair mechanic — players have no real incentive to maintain their ships beyond the cosmetic number. Adding tangible breakdown risks creates a meaningful risk/reward loop: skip repairs to save money and risk catastrophic failure, or invest in maintenance for reliability.

## Current State
- `CRITICAL_CONDITION_PERCENT` is defined in `constants.ts` (value 20) but never referenced in game logic.
- `applyVoyageWear()` reduces condition by `CONDITION_LOSS_PER_VOYAGE_BASE` (3%) per voyage, but low condition triggers nothing.
- `simulateVoyage()` in `GameState.ts` does not check condition before or during travel.
- The `EventSystem.ts` generates storm/rescue/fuel events but has no condition-based events.
- The `ManeuveringScreen.ts` has a damage system for collisions, but condition does not affect ship handling.

## Desired Outcome
- Ships with condition below `CRITICAL_CONDITION_PERCENT` (20%) have a chance of random breakdown during voyages (engine failure, hull leak).
- Breakdown events present the player with a choice (e.g., attempt field repairs vs. call for towing), similar to the storm pass-through/go-around pattern.
- Very low condition (below 10%) should increase the chance of breakdown significantly and possibly prevent departure with a warning.
- Ship condition should affect the maneuvering minigame: lower condition reduces max throttle or responsiveness.
- Port departure screen should show a warning when ship condition is critical.
- Breakdown at sea should cause additional costs (emergency repair, towing, extra delay).

## Spec References
- Section "Ship Management": "Minimum condition before a ship is at risk of breakdown" (constant defined but unused)
- Section "Random Events During Travel": Storm/emergency event patterns that breakdown events should follow
- Section "Port Departure Screen": Should surface warnings about ship fitness
- Section "Core Game Systems > Ship Management": Condition 0-100% with degradation over time

## Technical Approach

### Implementation Steps
1. Add a `generateBreakdownEvent()` function to `EventSystem.ts` that checks ship condition and generates events with probability scaling inversely with condition.
2. Define breakdown consequence types (engine failure = towing + cost, hull leak = damage + delay, electrical failure = reduced speed).
3. Integrate breakdown checks into `simulateVoyage()` in `GameState.ts` — or into `TravelScreen.ts` alongside existing event generation.
4. Add a pre-departure condition check in `PortDepartureScreen.ts` that warns the player when condition is below 20% and optionally prevents departure below 5%.
5. Modify `ManeuveringScreen.ts` to reduce max throttle level proportionally to condition (e.g., at 50% condition, only 80% max throttle).
6. Add breakdown-specific humor text to `humorTexts.ts`.

### Files to Create
- None required (all changes extend existing files).

### Files to Modify
- `src/game/EventSystem.ts` — Add breakdown event type, generation, and resolution functions.
- `src/game/GameState.ts` — Add condition check in `simulateVoyage()` or expose it for TravelScreen.
- `src/data/constants.ts` — Add breakdown probability constants (e.g., `BREAKDOWN_BASE_PROBABILITY`, `BREAKDOWN_TOWING_COST`).
- `src/ui/screens/TravelScreen.ts` — Integrate breakdown events into the travel event sequence.
- `src/ui/screens/PortDepartureScreen.ts` — Add condition warning before departure.
- `src/ui/screens/ManeuveringScreen.ts` — Scale max throttle with condition.
- `src/data/humorTexts.ts` — Add breakdown-related funny descriptions.

### Dependencies
- Existing event system pattern (storm/emergency events) serves as the template.
- No new external dependencies.

### Risks & Considerations
- Breakdown probability must be carefully tuned to be meaningful without being frustrating — suggest 5% chance at 20% condition scaling to 40% at 5% condition.
- Players who are already struggling financially should not be punished too harshly — consider capping breakdown repair costs relative to ship value.
- Ensure breakdown events integrate cleanly into the existing TravelScreen event queue.

## Acceptance Criteria
- [x] Ships below 20% condition have a visible chance of breakdown during voyages.
- [x] Breakdown probability scales with how far below the threshold the ship is.
- [x] Breakdown events present meaningful player choices (similar to storm events).
- [x] Breakdown consequences include financial costs, delays, or additional condition loss.
- [x] Port departure screen shows a warning when condition is critical (below 20%).
- [x] Ship condition affects maneuvering minigame responsiveness/max speed.
- [x] At least 3 different breakdown event types with humorous flavor text.
- [x] Existing voyage and event flows are not broken by the changes.

---
**Next Steps**: Ready for implementation.
