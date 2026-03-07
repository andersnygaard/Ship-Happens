# Feature: Office Screen (Company Management)

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, office, management
**Estimated Effort**: Medium

## Context & Motivation

The Office screen is the company management hub. Players view financial status, ship fleet overview, and company information. In the original, neglecting the office led to embezzlement events.

## Current State

We have a stub OfficeScreen. Game state tracks all player/company data.

## Desired Outcome

An office screen with:
- First-person perspective background (dark industrial office theme via CSS)
- Top status bar: company name, ship count, total capital
- Fleet overview: list of all owned ships with status (condition, fuel, position, cargo)
- Financial summary: current balance, recent transactions
- Action buttons: OK (back to map), Info, Status

## Spec References

- Office (Company Management) section
- Financial System: balance display
- Ship Management: ship status tracking

## Technical Approach

### Implementation Steps

1. **Phase 1**: Build office layout with CSS (industrial office aesthetic)
2. **Phase 2**: Implement company header (name, ships, capital)
3. **Phase 3**: Build fleet overview table/cards
4. **Phase 4**: Build financial summary with recent transactions
5. **Phase 5**: Wire navigation buttons

### Files to Create
- src/ui/components/FleetOverview.ts — Ship fleet display
- src/ui/components/FinancialSummary.ts — Financial info display

### Files to Modify
- src/ui/screens/OfficeScreen.ts — Full implementation
- src/styles/screens.css — Office styles

### Dependencies
- **External**: None
- **Internal**: Tasks 003, 004

## Acceptance Criteria

- [x] Office screen displays with industrial/nautical theme
- [x] Company header shows name, ship count, total capital in "Million$" format
- [x] Fleet overview lists all owned ships with condition, fuel, position
- [x] Financial summary shows current balance and recent transactions
- [x] OK button navigates back to world map
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
