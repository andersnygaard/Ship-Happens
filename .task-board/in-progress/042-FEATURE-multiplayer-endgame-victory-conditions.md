# Feature: Multiplayer Endgame & Victory Conditions

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay, multiplayer, game-flow, spec-gap, ux
**Estimated Effort**: Medium

## Context & Motivation
The spec describes a turn-based game for up to 7 players, with a time system tracking weeks and years, a leaderboard in the office, and per-player statistics. However, there is currently no way to end a game other than bankruptcy (which is a loss condition). Players have no target to aim for, no retirement option, and no final scoring screen. In multiplayer, there is no mechanism to declare a winner or compare final standings. This means a game session has no natural conclusion — it just runs indefinitely until everyone gets bored or goes bankrupt. Adding endgame conditions gives the game structure, motivation, and a satisfying conclusion.

## Current State
- `GameOverScreen` exists but only handles bankruptcy (loss condition). It shows a single player's fate and offers "New Game."
- `Leaderboard` component in the office ranks players by total fleet value + balance, but this is just informational — it triggers nothing.
- `Statistics` tracks voyages, revenue, expenses, ports visited, distance sailed, and charters completed — all useful for final scoring but unused for endgame.
- The time system tracks weeks and years with no upper bound.
- There is no retirement mechanic — players cannot voluntarily exit the game while keeping their score.
- There is no "game won" screen or final comparison between players.
- `TurnManager` handles turn rotation but has no concept of eliminated or retired players.

## Desired Outcome
- Players can set a game duration at setup (e.g., 5, 10, or 20 years, or "unlimited" for sandbox mode).
- When the final year ends, the game transitions to a "Final Standings" screen that ranks all players by net worth (cash + fleet value - outstanding mortgages).
- In multiplayer, eliminated (bankrupt) players are skipped in turn rotation but appear in final standings with their bankruptcy week noted.
- A player can voluntarily "retire" from the game (selling all ships and keeping their cash as final score), especially useful in single-player for achieving a personal best.
- The Final Standings screen shows a detailed breakdown: fleet value, cash balance, total revenue, total expenses, voyages completed, ports visited, and a "shipping magnate rating" (humorous title based on performance tier).
- A "Play Again" button returns to setup; scores can optionally be compared to previous games via local storage.

## Spec References
- Section "Main Game Loop": "turn-based, up to 7 players" — implies a structured game with defined rounds and conclusion.
- Section "Time System": "Year counter tracking game progression (observed: 41 WEEKS, 2 YRS)" — years serve as natural game-length markers.
- Section "Financial System": Starting capital $4-5M, ship prices up to $60M — the economic progression implies a target growth curve.
- Section "Core Design Principles": "Humor first" — the final standings should include witty commentary and humorous rating titles.
- Section "Statistics/Leaderboard" (task 026): Leaderboard and statistics tracking already exist and provide the data foundation for endgame scoring.

## Technical Approach

### Implementation Steps
1. Add `gameDurationYears` field to `NewGameConfig` and `FullGameState` (number or null for unlimited). Add a duration selector to `SetupScreen` with preset options (5, 10, 20 years, unlimited).
2. Add `retiredPlayers` array to `FullGameState` to track players who have voluntarily retired or gone bankrupt, storing their final stats and the week/year they exited.
3. Modify `endTurn()` in `GameState.ts` to check if `state.time.year >= gameDurationYears` at the end of a full round. If so, trigger endgame.
4. Modify `TurnManager` to skip bankrupt/retired players during turn rotation. If all players are eliminated or retired, trigger endgame immediately.
5. Add a "Retire" button to the Office screen that liquidates all assets (sells ships at current market value, settles mortgages) and records the player's final score.
6. Create a `FinalStandingsScreen` that displays all players ranked by net worth, with per-player breakdowns of key stats and a humorous "shipping magnate rating" (e.g., "Maritime Legend", "Competent Captain", "Barely Afloat", "Davy Jones' Accountant").
7. Add funny commentary to the final standings based on performance metrics (e.g., most ports visited, most storms weathered, most breakdowns).
8. Store high scores in localStorage for single-player personal best tracking.

### Files to Create
- `src/ui/screens/FinalStandingsScreen.ts` — New endgame screen with player rankings and stats.

### Files to Modify
- `src/data/types.ts` — Add `gameDurationYears` to game config types.
- `src/game/GameState.ts` — Add duration field to `FullGameState` and `NewGameConfig`. Add retirement logic. Add endgame detection in `endTurn()`.
- `src/game/TurnManager.ts` — Skip retired/bankrupt players in turn rotation.
- `src/ui/screens/SetupScreen.ts` — Add game duration selector.
- `src/ui/screens/OfficeScreen.ts` — Add "Retire" button with confirmation dialog.
- `src/ui/ScreenManager.ts` — Register the new FinalStandingsScreen.
- `src/data/humorTexts.ts` — Add humorous rating titles and endgame commentary.
- `src/main.ts` — Wire up endgame screen transition.

### Dependencies
- Existing `Statistics`, `Leaderboard`, and `ShipManager.calculateShipValue()` provide the scoring data.
- No new external dependencies.

### Risks & Considerations
- Retirement should require confirmation ("Are you sure? This cannot be undone.") to prevent accidental clicks.
- Game duration setting must be saved/loaded correctly for existing saves (default to "unlimited" for backward compatibility).
- Selling all ships during retirement should use the existing `sellShip()` logic to ensure mortgages are properly settled.
- The endgame check should happen at the end of a full round (after all players have taken their turn) to be fair.

## Acceptance Criteria
- [ ] Setup screen includes a game duration selector (5, 10, 20 years, or unlimited).
- [ ] Game automatically ends when the selected year limit is reached, transitioning to Final Standings.
- [ ] Final Standings screen ranks all players by net worth with detailed stat breakdowns.
- [ ] Bankrupt players appear in standings with their exit week/year and a $0 net worth.
- [ ] Players can voluntarily retire from the Office screen, liquidating assets and recording final score.
- [ ] Retired/bankrupt players are skipped in multiplayer turn rotation.
- [ ] Humorous "shipping magnate rating" titles are assigned based on performance tier.
- [ ] Existing save files load correctly with unlimited duration as default.
- [ ] Single-player mode stores high scores in localStorage for personal best tracking.

---
**Next Steps**: Ready for implementation.
