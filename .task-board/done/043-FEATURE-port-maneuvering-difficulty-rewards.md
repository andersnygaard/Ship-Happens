# Feature: Port Maneuvering Difficulty Indicators & Docking Rewards

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: gameplay, ux, maneuvering, balance, spec-gap
**Estimated Effort**: Medium

## Context & Motivation
The spec describes ports with vastly different harbor layouts and difficulty levels — Lagos has narrow parallel channels (hardest), Rotterdam has a large open basin (easiest), Rio has tropical narrow channels with cranes, and polar/arctic routes feature icebergs as obstacles. However, players currently have no visibility into port difficulty before choosing "steer by hand" (free) vs "use tug's help" ($50,000). This makes the decision uninformed — a new player might attempt Lagos by hand and fail badly, or always pay for tugs at easy ports like Rotterdam where manual docking is trivial. Additionally, successfully completing the maneuvering minigame currently only saves the tug fee. There is no positive reward for skillful docking, which means the minigame is a pure risk with no upside beyond cost avoidance. Adding difficulty indicators and a docking bonus creates a meaningful risk/reward tradeoff that makes the minigame engaging and strategically relevant.

## Current State
- `harborLayouts.ts` defines per-port layouts with obstacles, berth positions, and environment themes, but has no explicit difficulty rating.
- `PortDepartureScreen` shows three buttons (Cast Off, Steer by Hand, Use Tug's Help) with no information about how hard docking will be at the current port.
- `ManeuveringScreen` tracks collisions, time remaining, and ship condition damage but has no concept of a docking score or completion bonus.
- The tug cost is a flat $50,000 regardless of port difficulty.
- `HarborPhysics.ts` handles collision detection and docking checks but does not calculate a performance score.
- There is no financial reward for clean docking (no collisions, fast completion).

## Desired Outcome
- Each port has a visible difficulty rating (1-5 stars or a descriptive label like "Easy", "Moderate", "Hard", "Expert") shown on the Port Departure screen next to the "Steer by Hand" option.
- The difficulty rating is derived from the harbor layout properties (number of obstacles, berth size, channel width, etc.).
- Tug cost scales with port difficulty — easy ports cost less for tugs, hard ports cost more, making the manual vs. tug decision economically interesting at all difficulty levels.
- Successfully completing the maneuvering minigame awards a docking bonus based on performance: time remaining, number of collisions avoided, and port difficulty multiplier.
- The docking bonus is displayed on a brief results screen after successful docking, showing breakdown (base bonus + time bonus + clean docking bonus + difficulty multiplier).
- Failed docking (timeout or ship condition reaching 0%) still applies the existing damage penalty.
- The performance score is tracked in player statistics for bragging rights and leaderboard flavor.

## Spec References
- Section "Port Maneuvering Minigame": Describes unique harbor geometry per port with varying difficulty levels. Lagos described as "narrow parallel channels (hardest layout)" vs Rotterdam's "large open basin."
- Section "Port Departure Screen": "steer by hand" (free, manual) vs "use tug's help" (costs money, easier) — the economic decision needs better information.
- Section "Core Design Principles": "Humor first" — docking results should include witty commentary on performance.
- Section "Financial System": Economy needs multiple revenue streams to keep the game dynamic; docking bonuses add a skill-based income source.

## Technical Approach

### Implementation Steps
1. Add a `difficulty` field (1-5) to each harbor layout in `harborLayouts.ts`, calculated from obstacle count, berth dimensions, channel narrowness, and total navigable area. Add a helper `getPortDifficulty(portId)` function.
2. Update `PortDepartureScreen` to display the port difficulty rating next to the "Steer by Hand" button using a visual indicator (stars, anchor icons, or color-coded label). Show the scaled tug cost based on difficulty.
3. Scale tug cost by difficulty: base $30,000 for easy ports up to $80,000 for expert ports, replacing the flat $50,000.
4. Add a docking performance scoring system in `ManeuveringScreen`:
   - Base bonus: $10,000-$25,000 depending on port difficulty.
   - Time bonus: percentage of time remaining multiplied by a rate.
   - Clean docking bonus: $15,000 if zero collisions during docking.
   - Difficulty multiplier: 1.0x for easy, up to 2.5x for expert.
5. Create a brief "Docking Results" overlay shown after successful maneuvering, displaying the score breakdown with humorous commentary (e.g., "Textbook docking! The harbor master slow-clapped." or "You scraped every bollard in the harbor, but you made it.").
6. Credit the docking bonus to the player's finances and record it in statistics.
7. Add a `dockingBonusesEarned` counter and `totalDockingBonus` amount to `PlayerStatistics` for tracking.
8. Add humorous docking commentary to `humorTexts.ts` based on performance tiers (perfect, good, rough, barely survived).

### Files to Modify
- `src/data/harborLayouts.ts` — Add difficulty ratings and a `getPortDifficulty()` helper.
- `src/ui/screens/PortDepartureScreen.ts` — Display difficulty indicator and scaled tug cost.
- `src/ui/screens/ManeuveringScreen.ts` — Calculate and display docking score after successful completion. Show results overlay.
- `src/game/GameState.ts` — Credit docking bonus to player finances after successful maneuvering.
- `src/game/Statistics.ts` — Add docking performance tracking fields.
- `src/data/humorTexts.ts` — Add docking result commentary strings.
- `src/data/constants.ts` — Add docking bonus base rates, tug cost scaling constants.

### Dependencies
- Existing `HarborPhysics`, `ManeuveringScreen`, and `PortDepartureScreen` provide the foundation.
- No new external dependencies.

### Risks & Considerations
- Difficulty ratings should feel fair — test that each port's rating matches the actual docking challenge. Manual tuning may be needed beyond the algorithmic calculation.
- Docking bonuses should be meaningful but not dominant — they should supplement charter income, not replace it. Keep bonuses in the $10K-$60K range to stay proportional to tug costs.
- The results overlay should auto-dismiss after a few seconds or on click, so it doesn't block the flow to Port Operations.

## Acceptance Criteria
- [x] Each harbor layout has a difficulty rating (1-5) that reflects its actual navigational challenge.
- [x] Port Departure screen displays the difficulty rating next to "Steer by Hand."
- [x] Tug cost scales with port difficulty (cheaper for easy, expensive for hard).
- [x] Successful maneuvering awards a financial docking bonus credited to the player's balance.
- [x] Docking bonus is calculated from time remaining, collision count, and port difficulty.
- [x] A docking results overlay shows score breakdown with humorous commentary.
- [x] Zero-collision docking at any port awards an extra "clean docking" bonus.
- [x] Player statistics track total docking bonuses earned.
- [x] Failed docking (timeout) still applies damage penalty as before.

---
**Next Steps**: Ready for implementation.
