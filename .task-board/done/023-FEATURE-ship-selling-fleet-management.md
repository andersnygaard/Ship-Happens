# Feature: Ship Selling & Fleet Management

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: gameplay, fleet, economy
**Estimated Effort**: Medium

## Context & Motivation

Players need to sell ships (at depreciated value) and manage their fleet. The ship broker should support selling, and the office should allow ship-level management.

## Desired Outcome

- Sell ships at the broker (50-80% of current value based on condition)
- Ship selection when player has multiple ships (choose which ship to operate at each port)
- Fleet management in office: select active ship, view individual ship details
- Mortgage payments tracked and deducted periodically

## Technical Approach

### Implementation Steps

1. **Phase 1**: Add SELL function to ship broker (list owned ships, show sale price)
2. **Phase 2**: Implement ship selector on port operations and world map
3. **Phase 3**: Add mortgage payment system to financial loop
4. **Phase 4**: Ship depreciation calculation based on age and condition

### Files to Create
- src/ui/components/ShipSelector.ts — Ship selection dropdown/dialog

### Files to Modify
- src/ui/screens/ShipBrokerScreen.ts — Add sell tab
- src/ui/screens/PortOperationsScreen.ts — Ship selector
- src/game/GameState.ts — Sell ship action, mortgage payments
- src/game/ShipManager.ts — Ship valuation, depreciation

## Acceptance Criteria

- [x] Ships can be sold at the broker at depreciated value
- [x] Sale price reflects condition and age
- [x] Ship selector available when player has multiple ships
- [x] Mortgage payments deducted weekly
- [x] Fleet management accessible from office screen
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
