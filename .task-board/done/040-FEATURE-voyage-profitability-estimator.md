# Feature: Voyage Profitability Estimator

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: Medium
**Labels**: gameplay-depth, UI/UX, charter-system, financial-system, decision-support
**Estimated Effort**: Medium

## Context & Motivation
Currently, when a player reviews charter contracts in the Charter Dialog, they see the gross rate, deadline, penalty, and distance — but not the estimated costs of fulfilling that contract. A charter paying $2.4M sounds great until you realize fuel for 12,000nm costs $1.8M and operating costs add another $300K, leaving a thin $300K margin. Players have no way to evaluate profitability before committing, which makes the charter decision feel like guesswork rather than strategic planning. A profitability estimator transforms charter selection from "pick the biggest number" into a genuine business decision, which is the heart of a shipping simulation.

## Current State
- The Charter Dialog (`CharterDialog.ts`) displays rate, deadline, penalty, and distance.
- `getFuelCostPerTon()` in `ShipManager.ts` calculates port-specific fuel prices.
- `ShipSpec` has `fuelConsumptionTonsPerDay`, `dailyOperatingCosts`, and `maxSpeedKnots`.
- `calculateTravelDays()` in `TimeSystem.ts` computes travel time from distance and speed.
- None of these are combined to show estimated costs or profit margin to the player.
- The World Map destination selection shows distance but not estimated cost or profitability.
- After delivery, `deliverCargo()` shows the result — but by then the decision is already made.

## Desired Outcome
- The Charter Dialog shows an estimated profitability breakdown for each contract: estimated fuel cost, estimated operating costs, estimated travel days, and net estimated profit.
- The profitability estimate uses the current ship's specs and current fuel price to compute realistic numbers.
- A simple profit indicator (profit margin percentage or color-coded icon) helps players quickly compare contracts.
- The World Map destination tooltip/info panel shows estimated travel cost when hovering over or selecting a port.
- The "Set Sail" confirmation (if any) summarizes expected costs for the voyage.

## Spec References
- Section "Charter / Freight Contract Screen": Shows rate, deadline, penalty, distance — profitability estimate is the logical next step.
- Section "Ship Specification Sheet": "Fuel at max speed: Xt/day" and "Daily operating costs: $X" — these are the cost inputs.
- Section "Financial System": Freight revenue, fuel costs, and operating costs are the core economic loop.
- Section "Core Design Principles": Turn-based gameplay with strategic decisions — profitability estimation enables informed strategy.

## Technical Approach

### Implementation Steps
1. Create a `calculateVoyageEstimate()` function that takes a ship spec, distance, current fuel price, and speed, and returns `{ travelDays, fuelNeeded, fuelCost, operatingCosts, totalCosts }`.
2. Create a `VoyageProfitEstimate` UI component that renders the estimate as a compact breakdown (rate - costs = estimated profit, with color coding).
3. Integrate the estimate into the Charter Dialog — show the profitability breakdown below each contract's details.
4. Add a simple profit margin indicator (e.g., "+32%" in green or "-5%" in red) next to each contract in the contract list for quick scanning.
5. Add voyage cost estimate to the World Map port selection info panel (when clicking a port as destination).
6. Ensure estimates account for the world events cost multiplier on fuel prices (from `getPortCostMultiplier`).

### Files to Create
- `src/game/VoyageEstimator.ts` — Pure calculation functions for voyage cost estimation.
- `src/ui/components/VoyageProfitEstimate.ts` — UI component rendering the profitability breakdown.

### Files to Modify
- `src/ui/components/CharterDialog.ts` — Add profitability estimate per contract.
- `src/ui/screens/WorldMapScreen.ts` — Show estimated travel cost in the destination info panel.
- `src/game/ShipManager.ts` — Possibly refactor `getFuelCostPerTon()` to accept a cost multiplier parameter for reuse.

### Dependencies
- `calculateTravelDays()` from `TimeSystem.ts` (already exists).
- `getFuelCostPerTon()` from `ShipManager.ts` (already exists).
- Ship spec data from `ShipSpec` type.
- World events cost multiplier from `WorldEvents.ts`.

### Risks & Considerations
- Estimates are inherently approximate (storms add days, speed selection from task 038 would change calculations). The UI should clearly label these as "estimated" values.
- If task 038 (speed selection) is implemented first, the estimator should integrate with the selected speed. If not, it should use max speed as the default assumption.
- The Charter Dialog is already information-dense; the profitability section should be visually compact (collapsible or shown only for the selected contract).
- Fuel price at the departure port is used for the estimate, but the player might refuel at a different (cheaper) port — this limitation should be noted or the estimate should use the current ship's existing fuel level.

## Acceptance Criteria
- [x] Charter Dialog shows estimated fuel cost, operating costs, and net profit for each contract.
- [x] Profit estimates use the current ship's actual specs (speed, consumption, operating costs).
- [x] A quick-scan profit indicator (percentage or color) is visible in the contract list.
- [x] World Map destination selection shows estimated voyage cost.
- [x] Estimates are clearly labeled as approximate.
- [x] Negative profit estimates are prominently displayed in red/warning color.
- [x] Estimates account for world events cost multipliers on fuel.
- [x] The `calculateVoyageEstimate()` function is unit-testable (pure function, no side effects).

---
**Next Steps**: Ready for implementation.
