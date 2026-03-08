# Feature: Mortgage & Debt Management Dashboard

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: Medium
**Labels**: ui, ux, finance, office, gameplay
**Estimated Effort**: Medium

## Context & Motivation
The game's financial system already supports mortgages with interest rates, weekly payment schedules, and outstanding balances tracked per ship. Players can buy ships with partial deposits (as low as 40%), taking on significant debt that accrues interest. However, the Office screen and Financial Summary component only show the current cash balance and recent transactions — there is no dedicated view showing total outstanding debt, per-ship mortgage balances, payment schedules, or projections for when mortgages will be paid off. This means players have no visibility into their debt obligations, cannot compare the cost of maintaining mortgaged ships, and cannot make informed decisions about whether to pay off debt early, sell ships to reduce obligations, or take on more leverage. In a shipping simulation where financial management is core gameplay, this is a critical information gap. The original game's spec shows "Mortgage: 0%" on the ship purchase screen, implying debt visibility was always intended.

## Current State
- `FinancialState` in `FinancialSystem.ts` tracks `mortgages: Record<string, number>` (ship key to outstanding cents).
- `OwnedShip` has `mortgagePercent`, `mortgageRemaining`, and `mortgagePayment` fields that are updated weekly in `endTurn()`.
- `MORTGAGE_INTEREST_RATE` is 6% per year, applied to outstanding balances.
- The Office screen shows a `FinancialSummary` (balance + recent transactions) and a `FleetOverview` (ship list), but neither displays mortgage data.
- The Ship Broker's purchase flow shows deposit percentage and mortgage terms at time of purchase, but this information is never visible again after buying.
- `StatsPanel` shows total revenue, expenses, voyages, etc., but no debt metrics.
- There is no way to make extra mortgage payments to pay off debt faster.

## Desired Outcome
- The Office screen includes a "Debt Overview" section (or tab) that displays:
  - Total outstanding mortgage debt across all ships.
  - Per-ship breakdown: ship name, original loan amount, remaining balance, weekly payment, estimated weeks to payoff, total interest paid so far.
  - A visual progress bar per ship showing how much of the mortgage has been paid off.
  - Net worth calculation: cash balance + fleet value - total outstanding mortgages.
- Players can make voluntary extra mortgage payments from the Office to pay down specific ship mortgages faster, reducing long-term interest costs.
- The Fleet Overview component shows a small mortgage indicator per ship (e.g., a "$" icon with remaining balance) so players can see at a glance which ships are mortgaged.
- The Financial Summary includes a "Debt Service" line showing total weekly mortgage payments being deducted.
- Humorous commentary on debt status (e.g., "Your ships owe more than a small country's GDP" or "Mortgage-free! The bank sent a sad emoji.").

## Spec References
- Section "Ship Broker - Ship purchase/christening flow": "100% deposit to your debit. Mortgage: 0%. Do you want to deposit more? How much: __ %" — mortgages are a first-class game mechanic.
- Section "Financial System": "Ship deposits: Percentage-based, varies per ship (e.g. 40%). Lower deposit = mortgage with ongoing payments" — confirms debt management is a core financial mechanic.
- Section "Office (Company Management)": "Info — company information", "Status — view ship/company status" — the office is the intended hub for financial oversight.
- Section "Financial System": "Mortgage system: player chooses deposit amount, rest is mortgaged" — implies ongoing visibility of mortgage status.

## Technical Approach

### Implementation Steps
1. Create a `renderDebtDashboard()` component function in a new file `src/ui/components/DebtDashboard.ts` that takes `PlayerState` and renders:
   - Total debt summary card (total outstanding, total weekly payments, estimated fleet-wide payoff).
   - Per-ship mortgage rows with progress bars, remaining balance, weekly payment, and a "Pay Extra" button.
   - Net worth calculation displayed prominently.
2. Add the Debt Dashboard to the Office screen as a new section or tab, positioned between the Financial Summary and Fleet Overview.
3. Implement an `extraMortgagePayment()` function in `GameState.ts` that allows a player to pay down a specific ship's mortgage with an arbitrary amount (up to the remaining balance). Deducts from cash balance and reduces mortgage remaining.
4. Update `FleetOverview.ts` to show a small mortgage badge per ship (icon + remaining balance) for ships that still have outstanding mortgages.
5. Update `FinancialSummary.ts` to include a "Weekly Debt Service" line showing total mortgage payments per week.
6. Calculate and display the total interest paid per ship by comparing original mortgage amount with total payments made. This requires storing the `originalMortgageAmount` on `OwnedShip` (add the field).
7. Add humorous debt commentary strings to `humorTexts.ts` for various debt levels (debt-free, moderate, heavy, absurd).
8. Ensure backward compatibility: existing saves without `originalMortgageAmount` should default to `mortgageRemaining` (assumes no payments yet).

### Files to Create
- `src/ui/components/DebtDashboard.ts` — New component for mortgage visualization and management.

### Files to Modify
- `src/ui/screens/OfficeScreen.ts` — Integrate the Debt Dashboard section.
- `src/game/GameState.ts` — Add `extraMortgagePayment()` function.
- `src/data/types.ts` — Add `originalMortgageAmount` field to `OwnedShip`.
- `src/game/ShipManager.ts` — Set `originalMortgageAmount` when purchasing a ship with a mortgage.
- `src/ui/components/FleetOverview.ts` — Add mortgage badge per ship.
- `src/ui/components/FinancialSummary.ts` — Add weekly debt service line.
- `src/data/humorTexts.ts` — Add debt-related humor strings.
- `src/game/GameState.ts` (`deserializeGameState`) — Backward compatibility for new field.

### Dependencies
- Existing `FinancialSystem`, `ShipManager`, and `OfficeScreen` provide all necessary data.
- No new external dependencies.

### Risks & Considerations
- Extra mortgage payments should validate that the player has sufficient funds and that the payment does not exceed the remaining balance.
- The net worth calculation (cash + fleet value - mortgages) should use the same `calculateShipValue()` logic as the leaderboard to ensure consistency.
- Progress bars should handle edge cases: ships with 100% deposit (no mortgage), ships with very small remaining balances, and ships just purchased.
- The Debt Dashboard should not overwhelm the Office screen — consider making it collapsible or tab-accessible if the player has many ships.

## Acceptance Criteria
- [ ] Office screen displays a Debt Overview section with total outstanding mortgage debt.
- [ ] Per-ship mortgage breakdown shows remaining balance, weekly payment, and payoff estimate.
- [ ] Visual progress bars indicate how much of each mortgage has been paid off.
- [ ] Players can make voluntary extra mortgage payments from the Office.
- [ ] Net worth (cash + fleet value - mortgages) is calculated and displayed.
- [ ] Fleet Overview shows mortgage indicators on ships with outstanding debt.
- [ ] Financial Summary includes a weekly debt service total.
- [ ] Humorous commentary reflects the player's debt situation.
- [ ] Existing saves load correctly with default values for new fields.

---
**Next Steps**: Ready for implementation.
