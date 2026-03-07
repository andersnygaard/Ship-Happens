# Feature: Sea Voyage Animation Screen

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: visuals, animation, travel
**Estimated Effort**: Medium

## Context & Motivation

The travel screen should show an atmospheric sea voyage animation — the ship sailing across the ocean with waves and birds, as described in the original game.

## Desired Outcome

- Travel screen shows the 3D ocean scene as background (already partially done)
- Animated ship moving across the water
- Progress bar showing voyage completion percentage
- Day counter ticking up
- Weather indicator when storm events occur
- Info panel: ship name, origin, destination, distance, ETA

## Technical Approach

### Implementation Steps

1. **Phase 1**: Enhance TravelScreen to use Three.js scene as animated background
2. **Phase 2**: Position 3D ship model and animate it moving forward
3. **Phase 3**: Add HUD overlay with voyage info (ship, origin, destination, progress)
4. **Phase 4**: Day counter animation
5. **Phase 5**: Weather visual effects (darker sky, rougher waves during storms)

### Files to Modify
- src/ui/screens/TravelScreen.ts — Enhanced travel animation
- src/scene/OceanScene.ts — Weather effects
- src/scene/ShipModel.ts — Forward movement animation
- src/main.ts — Coordinate scene with travel screen
- src/styles/screens.css — Travel HUD styles

## Acceptance Criteria

- [x] Travel screen shows animated ocean with ship moving
- [x] Progress bar/percentage shows voyage completion
- [x] Day counter visible and updating
- [x] Ship name, origin, destination displayed
- [x] Storm events darken the sky and roughen waves
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
