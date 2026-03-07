# Feature: Travel & Random Events System

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: gameplay, events, travel
**Estimated Effort**: Complex

## Context & Motivation

Travel between ports is a core game mechanic. During travel, random events occur: storms, emergencies, running out of fuel. The START ACTION button on the world map triggers travel simulation. This is what makes the game dynamic and engaging.

## Current State

GameState.ts has simulateVoyage() which handles travel mechanics. The world map has a START ACTION button but it's not wired up. No event system or travel UI exists.

## Desired Outcome

- START ACTION on world map triggers travel to a selected destination
- Travel simulation shows a voyage animation/progress screen
- Random events during travel with player choices:
  - Storm: "pass through" (risk damage) or "round" (extra time)
  - Emergency/rescue: acknowledge event
  - Out of fuel: towing penalty ($1M)
- Port arrival triggers transition to Port Operations screen
- Port departure screen with "steer by hand" / "use tug's help" choice

## Spec References

- Random Events During Travel: storms, emergencies, out of fuel
- Sea Voyage Animation: ship on ocean scene
- Port Departure Screen: cast off, steer options
- Game Flow: START ACTION → travel → events → arrive

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create event system with random event generation
2. **Phase 2**: Build travel progress UI (simple overlay showing ship traveling)
3. **Phase 3**: Build event dialogs (storm choice, emergency, out of fuel)
4. **Phase 4**: Build port departure screen (steer by hand vs tug)
5. **Phase 5**: Wire START ACTION → select destination → travel → events → arrival
6. **Phase 6**: Connect arrival to Port Operations screen

### Files to Create
- src/game/EventSystem.ts — Random event generation and handling
- src/ui/screens/TravelScreen.ts — Voyage progress display
- src/ui/screens/PortDepartureScreen.ts — Port departure choices
- src/ui/components/EventDialog.ts — Event notification dialogs

### Files to Modify
- src/ui/screens/WorldMapScreen.ts — Wire START ACTION to travel flow
- src/ui/ScreenManager.ts — Add new screen types
- src/main.ts — Register new screens
- src/styles/screens.css — Travel and event styles

### Dependencies
- **External**: None
- **Internal**: Tasks 003 (GameState voyage), 005 (world map)

## Acceptance Criteria

- [x] START ACTION on world map initiates travel to selected port
- [x] Travel progress screen shows during voyage
- [x] Storm events offer "pass through" or "round" choice with consequences
- [x] Out of fuel event applies $1M towing penalty
- [x] Emergency/rescue events display and can be acknowledged
- [x] Port departure screen shows with steer/tug options
- [x] Arrival at port transitions to Port Operations
- [x] Event system generates random events based on voyage distance
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
