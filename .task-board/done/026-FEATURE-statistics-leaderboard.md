# Feature: Statistics & Player Leaderboard

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Low
**Labels**: stats, multiplayer, polish
**Estimated Effort**: Medium

## Context & Motivation

Players want to track performance. Statistics and a leaderboard add competitive depth, especially in multiplayer.

## Desired Outcome

- Per-player statistics tracked: total voyages, total revenue, ships owned/sold, ports visited, cargo delivered, distance sailed
- Statistics viewable from office screen
- Multiplayer leaderboard showing player rankings by net worth
- End-of-year summary screen with year's highlights

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create Statistics tracker in game state
2. **Phase 2**: Statistics display in office screen
3. **Phase 3**: Leaderboard component for multiplayer
4. **Phase 4**: End-of-year summary

### Files to Create
- src/game/Statistics.ts — Statistics tracking
- src/ui/components/StatsPanel.ts — Statistics display
- src/ui/components/Leaderboard.ts — Multiplayer rankings

### Files to Modify
- src/game/GameState.ts — Integrate statistics tracking
- src/ui/screens/OfficeScreen.ts — Add stats view

## Acceptance Criteria

- [x] Statistics track: voyages, revenue, ships, ports visited, cargo, distance
- [x] Statistics viewable from office screen
- [x] Multiplayer leaderboard ranks players by net worth
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
