# Feature: Core Game State Management

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: core, state, game-loop
**Estimated Effort**: Complex

## Context & Motivation

The game needs a central state management system that tracks players, companies, ships, time progression, and finances. This is the "engine" that drives all game mechanics. The game is turn-based with up to 7 players.

## Current State

After tasks 001-002, we have project scaffolding and data models. No game logic exists yet.

## Desired Outcome

A working game state manager that can:
- Create a new game with player setup (name, company name, home port)
- Track game time (weeks, years)
- Manage player finances (balance, income, expenses)
- Track ship ownership, condition, fuel, position
- Handle turn progression for multiplayer (1-7 players)
- Provide a clean API for game actions (buy ship, charter, refuel, repair, etc.)

## Spec References

- Game Flow: company/player setup, main game loop
- Financial System: all financial mechanics
- Ship Management: ship stats tracking
- Time System: weeks/years, simulation clock

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create GameState class with initialization (new game setup)
2. **Phase 2**: Implement financial operations (credit, debit, balance checks)
3. **Phase 3**: Implement ship management (purchase, condition, fuel tracking)
4. **Phase 4**: Implement time system (advance time, calculate costs per time unit)
5. **Phase 5**: Implement turn system (active player, next turn)
6. **Phase 6**: Wire up basic game actions (buyShip, repair, refuel, charter, load)

### Files to Create
- `src/game/GameState.ts` — Core game state class
- `src/game/FinancialSystem.ts` — Money management
- `src/game/ShipManager.ts` — Ship operations
- `src/game/TimeSystem.ts` — Time progression
- `src/game/TurnManager.ts` — Multiplayer turn handling
- `src/game/CharterSystem.ts` — Freight contract generation & management

### Files to Modify
- `src/main.ts` — Import and instantiate game state for testing

### Dependencies
- **External**: None
- **Internal**: Task 002 (data models/types)

### Risks & Considerations
- Keep state management framework-agnostic (no Redux, etc.) — use plain TypeScript classes
- State should be serializable for future save/load feature
- Financial calculations must be precise (avoid floating point issues for money)

## Acceptance Criteria

- [x] GameState class can initialize a new game with player name, company name, home port
- [x] Financial system tracks balance, handles credits/debits, prevents overspending
- [x] Ships can be purchased with deposit/mortgage system
- [x] Ship condition, fuel, and position are tracked
- [x] Time system advances in weeks, tracks years
- [x] Turn system supports 1-7 players with sequential turns
- [x] Charter system generates freight contracts with rate, deadline, penalty, distance
- [x] All game actions have proper validation (sufficient funds, fuel, etc.)
- [x] All files compile without TypeScript errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
