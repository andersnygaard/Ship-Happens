# Feature: UI Framework & Screen Management

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, screens, framework
**Estimated Effort**: Complex

## Context & Motivation

The game has multiple screens (World Map, Office, Ship Broker, Port Operations, etc.) that need a screen management system. We need an HTML/CSS UI overlay on top of the Three.js canvas, with a screen router to switch between views.

## Current State

We have a basic Three.js scene in main.ts, complete game data models, and game state management. No UI or screen system exists.

## Desired Outcome

- A screen management system that can switch between game screens
- HTML/CSS based UI overlays on top of the Three.js canvas
- A game setup flow: enter player name, company name, choose home port
- The game properly starts and creates a GameState instance
- Basic screen stubs for all major screens

## Spec References

- Game Flow: Choose company name, player name, home port, receive starting capital
- Screens & Interfaces: All screen descriptions
- Visual Style: "Riveted metallic/industrial steel texture", "Clipboard metaphor", nautical theme

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create a ScreenManager class that handles screen transitions
2. **Phase 2**: Create CSS with nautical/industrial theme (riveted metal look)
3. **Phase 3**: Build the game setup screen (new game form: player name, company name, home port selection)
4. **Phase 4**: Create screen stubs for: WorldMap, Office, ShipBroker, PortOperations
5. **Phase 5**: Wire up main.ts to show setup screen first, then transition to world map

### Files to Create
- `src/ui/ScreenManager.ts` — Screen switching logic
- `src/ui/screens/SetupScreen.ts` — New game setup form
- `src/ui/screens/WorldMapScreen.ts` — World map stub
- `src/ui/screens/OfficeScreen.ts` — Office stub
- `src/ui/screens/ShipBrokerScreen.ts` — Ship broker stub
- `src/ui/screens/PortOperationsScreen.ts` — Port operations stub
- `src/styles/main.css` — Main game styles with nautical theme
- `src/styles/screens.css` — Screen-specific styles

### Files to Modify
- `index.html` — Add UI container div and CSS links
- `src/main.ts` — Initialize ScreenManager and show setup screen

### Dependencies
- **External**: None
- **Internal**: Tasks 001-003

### Risks & Considerations
- Keep UI lightweight — no React/Vue/etc, use vanilla DOM manipulation
- CSS should be modular per screen
- Screens must overlay the Three.js canvas properly

## Acceptance Criteria

- [x] ScreenManager can register, show, and hide screens
- [x] Game setup screen allows entering player name, company name, and selecting home port from all 30 ports
- [x] Completing setup creates a GameState and transitions to world map screen
- [x] World map screen stub displays with player info
- [x] All screen stubs are registered and reachable
- [x] Nautical/industrial CSS theme applied (dark metallic colors, appropriate fonts)
- [x] UI overlays the Three.js canvas correctly
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
