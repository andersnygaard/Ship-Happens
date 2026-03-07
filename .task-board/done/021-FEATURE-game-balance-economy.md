# Feature: Game Balance & Economy Tuning

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: gameplay, balance, economy
**Estimated Effort**: Medium

## Context & Motivation

The game economy needs to be balanced so that gameplay is challenging but fair. Ship costs, fuel, charter rates, and time must create meaningful decisions.

## Desired Outcome

- Starting capital ($4-5M) allows buying a small ship with some reserve
- Cheapest ships ~$1M, most expensive ~$60M (progression over time)
- Charter rates correlate with distance and risk
- Fuel costs create meaningful range limitations
- Repair costs escalate, encouraging regular maintenance
- Office neglect events provide incentive to visit office
- Bankruptcy is possible but avoidable with good play
- Game progression: small ships → profits → bigger ships → more routes

## Technical Approach

### Implementation Steps

1. **Phase 1**: Review and adjust ship prices, fuel costs, charter rates
2. **Phase 2**: Balance fuel consumption vs bunker capacity (ensure ships can make long voyages)
3. **Phase 3**: Tune charter rate formula (distance × cargo value factor)
4. **Phase 4**: Add difficulty modifiers for different game starts
5. **Phase 5**: Add bankruptcy detection and game-over screen
6. **Phase 6**: Add office neglect timer (random embezzlement if not visiting office)

### Files to Create
- src/ui/screens/GameOverScreen.ts — Bankruptcy/game over screen

### Files to Modify
- src/data/ships.ts — Adjust ship stats for balance
- src/data/constants.ts — Tune economic constants
- src/game/CharterSystem.ts — Balance charter rates
- src/game/GameState.ts — Add bankruptcy check, office neglect
- src/ui/ScreenManager.ts — Add gameover screen type
- src/main.ts — Register GameOverScreen

## Acceptance Criteria

- [x] Starting capital allows purchasing at least 2 ship types
- [x] Charter rates provide meaningful profit after fuel + operating costs
- [x] Fuel range is sufficient for most routes with full bunker
- [x] Repair costs scale reasonably (not punishing, not trivial)
- [x] Bankruptcy detected when balance < 0 and no ships
- [x] Game Over screen displays with option to start new game
- [x] Office neglect triggers embezzlement after extended absence
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
