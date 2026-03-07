# Feature: Game Flow Completeness & Interactive Polish

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: gameplay, ux, flow, polish
**Estimated Effort**: Complex

## Context & Motivation

Even once the screens are visible (task 031) and look good (task 032), the actual game flow needs to be tested end-to-end and polished. There are likely issues with screen transitions, button interactions, dialog flows, and the overall player journey from "new game" to "profitable shipping magnate." The spec describes a tight, engaging game loop but the current implementation may have broken connections between screens, missing feedback, or rough edges that make the game confusing or unplayable.

The user wants a **good game** — not just working code. This means intuitive navigation, clear feedback, satisfying interactions, and a gameplay loop that keeps players engaged.

## Current State

- 9 screens are implemented with full game logic behind them
- Screen transitions exist (fade in/out with 300ms animation)
- Game state management is comprehensive (financial system, ship management, charter system, events, etc.)
- However, the game has never been fully tested end-to-end by a player
- UI feedback may be missing or unclear (what happens when you click "START ACTION"? How do you know your turn is over?)
- The connection between screens (e.g., accepting a charter → loading cargo → departing → traveling → arriving) may have gaps
- Error states and edge cases may produce confusing results

## Desired Outcome

A complete, smooth gameplay loop where:
1. Player creates a game → sees world map → goes to ship broker → buys first ship
2. Returns to world map → clicks port → travels → arrives → port operations
3. At port: repairs, refuels, accepts charter, loads cargo → departs
4. Maneuvering minigame (or tug) → back to world map → repeat
5. Random events during travel are engaging and consequential
6. Financial progression is clear — player can see they're making (or losing) money
7. Multi-player turn transitions are smooth and clear
8. The game provides enough guidance that a new player isn't lost
9. Humor and personality shine through in all interactions

## Spec References

- "Game Flow (from original analysis)" — the complete flow
- "Core Design Principles" — turn-based, humor first, modern world
- "Random Events During Travel" — storm, rescue, out of fuel
- "Port Operations (Captain's Orders)" — repair, refuel, charter, lay up, load
- "Modern Elements" — world events, political satire, humor examples
- "Ship Broker" — purchase flow with christening and deposit

## Technical Approach

### Implementation Steps

1. **Phase 1: Game flow walkthrough and fixes**
   - Play through the complete game loop and identify every broken or confusing moment
   - Fix screen navigation: setup → worldmap → broker → worldmap → port → port-ops → travel → etc.
   - Ensure the "START ACTION" button on the world map actually advances simulation and triggers travel/events
   - Verify charter acceptance → cargo loading → departure → maneuvering → arrival chain
   - Fix any broken dialog flows (repair, refuel, charter selection, ship purchase)
   - Ensure the port departure screen correctly offers "steer by hand" vs "use tug's help"

2. **Phase 2: Player feedback and UX**
   - Add clear visual feedback when actions succeed or fail (toast notifications, button state changes)
   - Show the player's financial situation prominently — they should always know their balance
   - Make the turn system crystal clear — who's playing, when does the turn end
   - Add confirmation dialogs for expensive actions (buying ships, repairs)
   - Ensure the news ticker shows relevant, amusing headlines
   - Make tutorial hints actually helpful for first-time players
   - Add sound effects to key moments (ship horn when departing, coin sound on payment, storm wind during events)

3. **Phase 3: Gameplay polish and fun factor**
   - Ensure humor texts appear in the right contexts (funny cargo descriptions, sarcastic broker, crew complaints)
   - Make world events actually affect gameplay (not just flavor text)
   - Polish the maneuvering minigame: clear instructions, visible dock target, responsive controls
   - Ensure statistics tracking works and the leaderboard shows meaningful data
   - Test multiplayer (2+ players) turn transitions
   - Ensure save/load works correctly at every point in the game
   - Add a "back to world map" option from every screen (via Escape key and UI button)

### Files to Create
- None expected (fix existing files)

### Files to Modify
- `src/ui/screens/WorldMapScreen.ts` — Fix START ACTION flow, simulation advancement
- `src/ui/screens/PortOperationsScreen.ts` — Fix operation flows, dialog triggers
- `src/ui/screens/ShipBrokerScreen.ts` — Fix purchase flow, ensure broker navigates back correctly
- `src/ui/screens/TravelScreen.ts` — Fix event handling, arrival flow
- `src/ui/screens/ManeuveringScreen.ts` — Polish controls, target visibility
- `src/ui/screens/PortDepartureScreen.ts` — Fix steer/tug options
- `src/ui/screens/OfficeScreen.ts` — Ensure info/status views work
- `src/ui/components/CharterDialog.ts` — Fix charter selection and contract display
- `src/ui/components/PurchaseDialog.ts` — Fix ship naming and deposit flow
- `src/game/GameState.ts` — Fix any state management bugs found during testing
- `src/main.ts` — Ensure keyboard shortcuts work correctly per screen

### Dependencies
- **External**: None
- **Internal**: Task 031 (screens must be visible), Task 032 (aesthetics make the game testable/enjoyable)

### Risks & Considerations

- This is a broad task — scope it to "make the main game loop work smoothly" rather than "fix every edge case"
- Some bugs may be in the game logic layer (GameState, FinancialSystem, etc.) not just the UI
- The maneuvering minigame is the most complex screen — focus on making it playable, not perfect
- Multiplayer testing is important but lower priority than single-player flow
- Sound effects may not work in all browsers without user interaction first (autoplay policies)

## Acceptance Criteria

- [ ] A new player can complete a full game loop: create game → buy ship → accept charter → travel → deliver cargo → profit
- [ ] The "START ACTION" button on the world map works and advances the simulation
- [ ] Port operations (repair, refuel, charter, load) all function correctly with proper dialogs
- [ ] Ship broker allows purchasing a ship with naming and deposit selection
- [ ] Travel screen shows voyage progress, handles events (storms, rescue, fuel), and arrives at destination
- [ ] Maneuvering minigame is playable with clear controls and visible dock target
- [ ] Player's financial situation (balance, revenue, costs) is always visible and accurate
- [ ] Turn transitions in multiplayer are clear and functional
- [ ] Save/load preserves game state correctly
- [ ] Humor and personality are present (funny cargo names, sarcastic NPC text, news headlines)

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
