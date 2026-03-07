# Feature: Save/Load Game System

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: persistence, save, load
**Estimated Effort**: Medium

## Context & Motivation

Players need to save and resume games. The GameState is already serializable, so we need a UI and localStorage integration.

## Current State

GameState has serializeGameState() and deserializeGameState() functions. No save/load UI exists.

## Desired Outcome

- Auto-save game state to localStorage after each action
- Manual save button in the office/menu
- Load game option on the setup screen
- Multiple save slots (3)
- Save metadata shown (company name, balance, date, time played)

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create SaveSystem with localStorage read/write
2. **Phase 2**: Implement auto-save after key game actions
3. **Phase 3**: Add "Continue Game" / "Load Game" options to setup screen
4. **Phase 4**: Add save slot UI with save metadata display
5. **Phase 5**: Add "Save Game" button to office screen

### Files to Create
- src/game/SaveSystem.ts — Save/load logic
- src/ui/components/SaveLoadDialog.ts — Save slot UI

### Files to Modify
- src/ui/screens/SetupScreen.ts — Add load game option
- src/ui/screens/OfficeScreen.ts — Add save button
- src/main.ts — Initialize save system, hook auto-save

### Dependencies
- **Internal**: Task 003 (serializable GameState)

## Acceptance Criteria

- [x] Game auto-saves to localStorage after key actions
- [x] Setup screen shows "Continue Game" if a save exists
- [x] 3 save slots available with save metadata display
- [x] Manual save from office screen works
- [x] Loading a save restores full game state and shows world map
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
