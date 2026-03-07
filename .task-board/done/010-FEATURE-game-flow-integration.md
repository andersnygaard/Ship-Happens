# Feature: Game Flow Integration — Playable Loop

**Status**: Done
**Created**: 2026-03-07
**Priority**: High
**Labels**: gameplay, integration, core-loop
**Estimated Effort**: Complex

## Context & Motivation

All individual screens and systems exist but aren't connected into a cohesive playable game loop. Players need to flow naturally from setup → world map → buy ship → charter → travel → port operations → repeat.

## Current State

We have: Setup, World Map, Ship Broker, Port Operations, Office, Travel, Port Departure screens, plus all game state systems. But the flow between them isn't fully wired.

## Desired Outcome

A fully playable game loop:
1. Setup → choose name/company/port → World Map
2. World Map → Ship Broker → Buy first ship → Back to World Map
3. World Map → shows owned ship at home port → click destination port
4. World Map → START ACTION → Travel → Events → Port Departure → Port Operations
5. Port Operations → Repair/Refuel/Charter/Load → back to World Map
6. Repeat cycle

## Spec References

- Game Flow section: entire flow description
- Main Game Loop: turn-based cycle

## Technical Approach

### Implementation Steps

1. **Phase 1**: Review and fix screen transitions — ensure all navigation paths work
2. **Phase 2**: After setup, prompt player to visit Ship Broker if they have no ships
3. **Phase 3**: World map port selection → sets travel destination
4. **Phase 4**: START ACTION checks for selected destination and ship, then starts travel
5. **Phase 5**: After travel completes, transition to port departure → port operations
6. **Phase 6**: Port operations back to world map when done
7. **Phase 7**: Add game-over check (bankruptcy — balance < 0 with no ships)
8. **Phase 8**: Test full loop end to end

### Files to Modify
- src/main.ts — Ensure all screen registration and state passing is correct
- src/ui/screens/WorldMapScreen.ts — Port selection, START ACTION flow
- src/ui/screens/SetupScreen.ts — Post-setup guidance
- src/ui/screens/PortOperationsScreen.ts — Return to world map flow
- src/ui/ScreenManager.ts — Any needed screen type additions

### Dependencies
- **Internal**: All previous tasks

## Acceptance Criteria

- [x] Complete flow from setup to world map works
- [x] Player is guided to Ship Broker when they have no ships
- [x] Clicking a port on the world map selects it as destination
- [x] START ACTION with a destination triggers the travel sequence
- [x] Travel → events → port departure → port operations flow works
- [x] Port operations exits back to world map
- [x] Ship position updates on world map after travel
- [x] Game state persists correctly through all transitions
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
