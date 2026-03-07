# Feature: Multiplayer Turn System UI

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: multiplayer, turns, ui
**Estimated Effort**: Medium

## Context & Motivation

The original game supported up to 7 players taking turns. The TurnManager backend exists but there's no UI for adding multiple players or displaying turn transitions.

## Current State

TurnManager.ts supports 1-7 players. Setup screen only allows one player. No turn transition UI exists.

## Desired Outcome

- Setup screen allows adding 2-7 players (each with name, company, home port)
- Turn indicator on world map showing which player is active (numbered 1-7)
- Turn transition screen/overlay when switching between players
- Each player has independent ships, finances, and charters
- Player indicator bar at bottom of world map (like original's numbered markers)

## Technical Approach

### Implementation Steps

1. **Phase 1**: Enhance setup screen with add/remove player controls
2. **Phase 2**: Add player indicator bar to world map footer
3. **Phase 3**: Create turn transition overlay ("Player X's Turn" with company name)
4. **Phase 4**: Ensure all screens reference the active player correctly
5. **Phase 5**: Wire endTurn to advance to next player with transition

### Files to Create
- src/ui/components/TurnIndicator.ts — Player turn indicator bar
- src/ui/components/TurnTransition.ts — Turn change overlay

### Files to Modify
- src/ui/screens/SetupScreen.ts — Multi-player setup
- src/ui/screens/WorldMapScreen.ts — Turn indicator, end turn button
- src/main.ts — Handle turn transitions

### Dependencies
- **Internal**: Task 003 (TurnManager)

## Acceptance Criteria

- [x] Setup screen supports 1-7 players with individual name/company/port
- [x] Turn indicator shows active player number on world map
- [x] Turn transition overlay displays when switching players
- [x] Each player's data (ships, balance) displays correctly on their turn
- [x] End turn advances to next player
- [x] Full round advances game time by one week
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
