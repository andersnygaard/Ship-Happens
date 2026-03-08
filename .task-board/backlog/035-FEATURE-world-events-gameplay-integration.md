# Feature: World Events Integration — Events That Affect Gameplay

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay, world-events, economy, humor
**Estimated Effort**: Complex

## Context & Motivation

The spec describes a dynamic world event system as a key differentiator from the original game:
- War zones, sanctions, piracy hotspots, canal blockages, climate events
- Political satire: Trump-style tariff chaos, Brexit complications, absurd UN resolutions
- These events should **actually affect gameplay** — blocking ports, increasing costs, creating risk

The `WorldEvents.ts` system exists with 8 event types and a generation/expiration system, but it's **not connected to gameplay**. Events are generated but never checked when the player navigates, trades, or travels. The news ticker shows headlines but they're decorative.

## Current State

- `WorldEvents.ts`: Full event system with types, templates, generation, expiration, port blocking, and cost multipliers
- `isPortBlocked()` and `getPortCostMultiplier()` functions exist but are never called from game logic
- `getWorldEventHeadlines()` is used by the news ticker but only for display
- No visual indicators on the world map showing affected ports
- No integration with charter system (should affect rates), port operations (blocked ports), or travel (extra costs)
- Events stored in module-level state, not serialized with game state (lost on reload)

## Desired Outcome

1. **World events affect port availability**: Blocked ports cannot be visited — show a warning icon on the world map and reject navigation attempts with a toast message
2. **Cost multipliers apply**: Fuel, repair, and charter costs at affected ports are multiplied by the event's cost multiplier
3. **Events display on world map**: Visual indicators (colored dots, warning icons) on affected ports
4. **Events persist in game state**: Serialize active events with save/load
5. **Event lifecycle**: New events generate each round (15% chance, max 3), expired events are cleared
6. **Player notification**: When a new world event occurs, show it as a toast and/or dialog with the headline and description
7. **Political satire events**: Add more humorous, modern events — tariff wars, social media-driven trade policy, absurd regulations
8. **Charter system integration**: Events near a destination should show a warning in the charter dialog

## Spec References

- "Modern Elements — World Events & Situations"
- "Modern Elements — Political Satire"
- "Humor Examples"
- "Random Events During Travel" — events during transit

## Technical Approach

### Implementation Steps

1. **Phase 1: Persist events in game state**
   - Add `worldEvents: WorldEvent[]` to `FullGameState`
   - Serialize/deserialize in `SaveSystem.ts`
   - On turn end, generate and expire events, store in state
   - Remove module-level state from `WorldEvents.ts`, use state from `FullGameState`

2. **Phase 2: Integrate events with gameplay**
   - `WorldMapScreen.ts`: Draw warning indicators on affected ports, prevent navigation to blocked ports
   - `PortOperationsScreen.ts`: Apply cost multipliers to repair and refuel
   - `CharterSystem.ts`: Apply cost multipliers to charter rates, show warnings for affected destinations
   - `TravelScreen.ts`: During travel, apply fuel cost multipliers
   - Show toast notification when new world events generate

3. **Phase 3: Add more satirical event templates**
   - Add 5+ new event templates with political satire humor
   - Add tariff events that affect specific cargo types
   - Add climate events (hurricane season, ice melt opening Arctic routes)
   - Make event descriptions longer and funnier

### Files to Create
- None

### Files to Modify
- `src/game/WorldEvents.ts` — Refactor to work with game state instead of module-level state, add new templates
- `src/game/GameState.ts` — Add worldEvents to FullGameState, integrate event generation/expiration into turn system
- `src/game/SaveSystem.ts` — Serialize/deserialize world events
- `src/ui/screens/WorldMapScreen.ts` — Show event indicators on affected ports
- `src/ui/components/WorldMapCanvas.ts` — Draw warning icons on affected ports
- `src/ui/screens/PortOperationsScreen.ts` — Apply cost multipliers
- `src/game/CharterSystem.ts` — Apply cost multipliers to rates
- `src/ui/components/CharterDialog.ts` — Show event warnings for affected destinations
- `src/data/constants.ts` — Add world event constants if needed

### Dependencies
- **External**: None
- **Internal**: None

### Risks & Considerations

- Refactoring from module-level to game-state storage requires careful migration to avoid breaking existing functionality
- Events blocking popular ports (Rotterdam, New York) could frustrate players — ensure blocked durations are short (1-4 weeks)
- Cost multipliers should be visible to the player so they understand why prices are different
- Need to balance event frequency — too many = annoying, too few = irrelevant

## Acceptance Criteria

- [ ] World events generate during turn progression (15% chance per round, max 3 active)
- [ ] Blocked ports show a visual indicator on the world map and cannot be navigated to
- [ ] Cost multipliers apply to repair, refuel, and charter costs at affected ports
- [ ] Events persist across save/load correctly
- [ ] Player is notified when a new world event occurs (toast or dialog)
- [ ] At least 12 event templates with humorous headlines exist
- [ ] Event warnings appear in the charter dialog for affected destinations
- [ ] Build succeeds with no errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
