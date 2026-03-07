# Feature: Ship Broker Screen

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, ship-broker, commerce
**Estimated Effort**: Complex

## Context & Motivation

The Ship Broker is where players buy ships. It's critical for the early game — players must buy their first ship to start playing. The screen needs a browsing interface with ship details and a purchase/christening flow.

## Current State

After tasks 004-005, we have a screen framework and world map. The Ship Broker stub needs a full implementation.

## Desired Outcome

A Ship Broker screen with:
- Ship browsing with 2-3 ships visible per page, showing illustration placeholder, price, BUY and INFO buttons
- Ship info/specification sheet showing all stats
- Purchase flow: buy → christen (enter ship name) → set deposit percentage → confirm
- Insufficient funds handling with sarcastic rejection dialog
- Navigation back to world map

## Spec References

- Ship Broker section: Entry screen, ship browsing, purchase flow
- Ship Specification Sheet: All ship stats display
- Financial System: Deposit/mortgage system

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create ship browsing layout with paginated ship list
2. **Phase 2**: Create ship info modal/screen showing full specifications
3. **Phase 3**: Create purchase flow: christening dialog → deposit slider → confirmation
4. **Phase 4**: Wire up to GameState for actual purchases (debit balance, add ship)
5. **Phase 5**: Handle edge cases (insufficient funds, already own max ships)

### Files to Create
- `src/ui/screens/ShipBrokerScreen.ts` — Full ship broker implementation (replace stub)
- `src/ui/components/ShipCard.ts` — Individual ship display card
- `src/ui/components/ShipInfoPanel.ts` — Detailed ship specifications
- `src/ui/components/PurchaseDialog.ts` — Ship purchase/christening flow

### Files to Modify
- `src/styles/screens.css` — Ship broker specific styles

### Dependencies
- **External**: None
- **Internal**: Task 004 (screen framework), Task 003 (GameState for purchases)

### Risks & Considerations
- Purchase flow needs proper validation against player balance
- Deposit percentage must be within allowed range per ship
- Keep ship illustrations as colored placeholder boxes for now (art comes later)

## Acceptance Criteria

- [x] Ship broker shows paginated list of available ships (2-3 per page)
- [x] Each ship shows: placeholder image, name/type, price, BUY and INFO buttons
- [x] INFO button shows full ship specification sheet with all stats
- [x] BUY button starts purchase flow: christening → deposit → confirmation
- [x] Player can name their ship (prefixed with "MS ")
- [x] Deposit slider/input with min/max constraints per ship
- [x] Successful purchase debits player account and adds ship to fleet
- [x] Insufficient funds shows sarcastic rejection dialog
- [x] Navigation back to world map works
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
