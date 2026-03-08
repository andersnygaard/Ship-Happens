# Feature: Voyage Speed Selection & Fuel Economy Trade-offs

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay-depth, simulation, travel, UI
**Estimated Effort**: Medium

## Context & Motivation
The spec details ship stats including "Max speed" and "Fuel at max speed," implying that fuel consumption is specifically at maximum speed and that players should be able to choose a lower cruising speed. Currently, all voyages run at `maxSpeedKnots` with `fuelConsumptionTonsPerDay` fixed — there is no player agency over the speed/fuel/time trade-off. This is a significant missing gameplay dimension: choosing between burning fuel fast to meet a tight deadline vs. economizing fuel on a relaxed schedule is a core shipping simulation decision. Adding speed selection also makes the fuel economy and charter deadline systems more meaningful.

## Current State
- `calculateTravelDays()` in `TimeSystem.ts` uses `speedKnots` parameter but `simulateVoyage()` always passes `spec.maxSpeedKnots`.
- `consumeFuel()` in `ShipManager.ts` uses `spec.fuelConsumptionTonsPerDay` (documented as "at max speed") regardless of actual speed.
- The `TravelScreen` and `WorldMapScreen` do not offer any speed selection UI before departure.
- Charter contracts have delivery deadlines (`deliveryDeadlineDays`) that would create tension with speed choices, but this tension is currently absent since speed is always max.
- The spec mentions "vmax = Xkn" as a stat, implying it's a ceiling not a constant.

## Desired Outcome
- Before departing, the player can choose a cruising speed from a range (e.g., 50% to 100% of max speed, in discrete steps).
- Lower speed means proportionally less fuel consumption per day but proportionally more travel days.
- Fuel consumption should scale roughly with the cube of speed (as per real-world ship hydrodynamics — the "admiralty formula"), making slow steaming significantly more fuel-efficient.
- The UI should clearly show estimated travel time, estimated fuel consumption, and whether the ship has enough fuel at the selected speed.
- The deadline indicator should show whether the selected speed will arrive on time for any active charter.
- The speed selection should appear on the world map before the "Set Sail" confirmation, or on the port departure screen.

## Spec References
- Section "Ship Specification Sheet": "Max speed: vmax = Xkn" and "Fuel at max speed: Xt/day" — implies max speed is the ceiling.
- Section "Core Game Systems > Ship Management": Speed and fuel consumption listed as key stats.
- Section "Charter & Freight": Delivery deadlines in days create the tension with speed choice.
- Section "Financial System": Fuel costs are a major expense — speed control adds strategic depth.

## Technical Approach

### Implementation Steps
1. Create a `calculateFuelConsumptionAtSpeed()` function in `ShipManager.ts` that scales fuel consumption with speed using a cubic relationship: `consumption = maxConsumption * (speed / maxSpeed)^3`.
2. Add a `cruisingSpeedKnots` parameter to `simulateVoyage()` in `GameState.ts` (defaulting to `maxSpeedKnots` for backward compatibility).
3. Build a speed selection UI component that shows a slider or discrete speed steps (Slow / Economy / Standard / Full / Max) with real-time estimates of travel days, fuel needed, and fuel remaining.
4. Integrate the speed selector into the world map's travel confirmation flow (when the player clicks a destination and confirms travel).
5. Update `TravelScreen` to display the selected speed and reflect it in the voyage animation pacing.
6. Add estimated arrival info relative to charter deadline (green = on time, yellow = tight, red = late).

### Files to Create
- `src/ui/components/SpeedSelector.ts` — Reusable speed selection component with fuel/time estimates.

### Files to Modify
- `src/game/ShipManager.ts` — Add `calculateFuelConsumptionAtSpeed(spec, speedKnots)` function.
- `src/game/GameState.ts` — Add `cruisingSpeedKnots` parameter to `simulateVoyage()`.
- `src/game/TimeSystem.ts` — Already supports variable speed in `calculateTravelDays()`, no change needed.
- `src/ui/screens/WorldMapScreen.ts` — Integrate speed selector into the travel confirmation flow.
- `src/ui/screens/TravelScreen.ts` — Display selected speed, adjust animation pacing.
- `src/data/constants.ts` — Add `MIN_SPEED_FRACTION` (e.g., 0.5) and speed step constants.

### Dependencies
- No new external dependencies.
- Relies on existing `calculateTravelDays()` already accepting a speed parameter.

### Risks & Considerations
- The cubic fuel scaling must be balanced so that slow steaming is genuinely attractive for long routes without making it always optimal (deadlines should provide counter-pressure).
- The speed selector UI must not clutter the world map screen — consider a compact expandable panel or a modal.
- Backward compatibility: saved games without a speed setting should default to max speed.
- Ensure the estimated fuel display accounts for potential storm detours (show a buffer/warning).

## Acceptance Criteria
- [ ] Player can select cruising speed before departing on a voyage (at least 3 distinct options).
- [ ] Fuel consumption scales non-linearly with speed (cubic or similar, not purely linear).
- [ ] Travel time correctly reflects the selected speed.
- [ ] UI shows estimated travel days, fuel consumption, and remaining fuel at selected speed.
- [ ] UI indicates whether selected speed will meet the charter deadline (if applicable).
- [ ] Lower speed demonstrably saves fuel in gameplay.
- [ ] Existing save files load correctly with max speed as default.
- [ ] Speed selection is visually clear and does not clutter the main map UI.

---
**Next Steps**: Ready for implementation.
