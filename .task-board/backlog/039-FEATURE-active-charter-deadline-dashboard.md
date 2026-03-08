# Feature: Active Charter Dashboard & Deadline Tracking

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay-depth, UI/UX, charter-system, information-display
**Estimated Effort**: Medium

## Context & Motivation
The spec defines charter contracts with delivery deadlines, late penalties (~11% of rate), and time-based gameplay pressure. However, once a player accepts a charter and loads cargo, there is no ongoing visibility into how much time remains before the deadline. The deadline is only evaluated at delivery time (`deliverCargo()` in GameState.ts). Players cannot make informed decisions about whether to go around a storm, slow down to save fuel, or rush to avoid a penalty because they have no countdown display. This is a critical information gap that undermines the deadline mechanic entirely — a player might not even realize they are about to incur a $270K penalty until it is too late.

## Current State
- `CharterContract` has `deliveryDeadlineDays` and `penalty` fields (defined in `types.ts`).
- `acceptedDay` is tracked per charter in `PlayerState.activeCharters` (used in `deliverCargo()`).
- `deliverCargo()` in `GameState.ts` calculates `daysElapsed = totalDaysElapsed - charter.acceptedDay` and compares to deadline.
- The Charter Dialog (`CharterDialog.ts`) shows deadline at acceptance time but not after.
- The Port Operations status panel shows the charter rate but not remaining deadline days.
- The World Map screen has no charter deadline indicator.
- The Office screen's fleet overview shows cargo status but not deadline urgency.
- Storm events ask the player to choose pass-through vs. go-around, but the player has no deadline context to inform that choice.

## Desired Outcome
- A persistent charter status indicator visible on the World Map screen showing active charter deadlines for the selected ship.
- The Port Operations ship status panel displays remaining days until deadline (color-coded: green > 50% time left, yellow 25-50%, red < 25%, flashing if overdue).
- The Office fleet overview table includes a "Deadline" column showing remaining days per ship.
- Storm event dialogs include a line showing "Charter deadline: X days remaining" to help inform the pass-through vs. go-around decision.
- The Travel screen shows a deadline countdown during the voyage animation.
- A toast notification fires when a charter enters the "red zone" (< 25% time remaining).

## Spec References
- Section "Charter / Freight Contract Screen": "Del. 42 days" — deadline is a core charter attribute.
- Section "Financial System": "Late penalties — Fixed amount per contract (~11% of rate)" — meaningful financial consequence.
- Section "Random Events During Travel": Storm choice (pass through vs. go around) should be informed by deadline pressure.
- Section "World Map / Globe": Status information displayed on the main game screen.
- Section "Port Operations": Ship status panel shows voyage result and cargo info.

## Technical Approach

### Implementation Steps
1. Create a `CharterDeadlineIndicator` UI component that takes a charter and current `totalDaysElapsed`, computes remaining days, and renders a color-coded badge.
2. Add the indicator to the World Map footer/status area for the currently selected ship.
3. Extend the Port Operations ship status panel (`createShipStatusPanel`) to show "Deadline: X days" with color coding.
4. Add a "Deadline" column to the Fleet Overview table in `FleetOverview.ts`.
5. Pass deadline context into the storm event dialog in `TravelScreen.ts` so players see remaining time when deciding pass-through vs. go-around.
6. Add a deadline countdown line to the Travel screen's voyage progress display.
7. Add a deadline warning toast that triggers when remaining days drop below 25% of the original deadline (checked during `endTurn` / time advancement).

### Files to Create
- `src/ui/components/CharterDeadlineIndicator.ts` — Reusable deadline display component with color coding and urgency states.

### Files to Modify
- `src/ui/screens/WorldMapScreen.ts` — Add deadline indicator near the ship selector or status area.
- `src/ui/screens/PortOperationsScreen.ts` — Add deadline row to ship status panel.
- `src/ui/components/FleetOverview.ts` — Add deadline column to fleet table.
- `src/ui/screens/TravelScreen.ts` — Show deadline countdown during voyage; add deadline context to storm event choices.
- `src/game/GameState.ts` — Add a helper function `getCharterRemainingDays(state, shipName)` for easy access.
- `src/game/EventSystem.ts` — Optionally add deadline info to storm event descriptions.

### Dependencies
- Requires access to `PlayerState.activeCharters` and `state.time.totalDaysElapsed` (both already available).
- No new external dependencies.

### Risks & Considerations
- The indicator should be unobtrusive on the World Map (small badge, not a large panel) to avoid cluttering the screen.
- Must handle the case where a ship has no active charter gracefully (hide the indicator).
- Color-coding thresholds should be configurable or at least clearly defined constants.
- Ensure the deadline calculation matches exactly what `deliverCargo()` uses to avoid surprises.

## Acceptance Criteria
- [ ] Active charter deadline (remaining days) is visible on the World Map screen for the selected ship.
- [ ] Port Operations ship status panel shows remaining deadline days with color coding (green/yellow/red).
- [ ] Office fleet overview includes deadline information per ship.
- [ ] Storm event dialog shows remaining charter deadline to inform the player's decision.
- [ ] Travel screen displays a deadline countdown during the voyage.
- [ ] A warning toast fires when a charter deadline enters the danger zone (< 25% time remaining).
- [ ] Deadline display correctly matches the actual deadline calculation used in `deliverCargo()`.
- [ ] Ships without active charters show no deadline indicator (no visual noise).

---
**Next Steps**: Ready for implementation.
