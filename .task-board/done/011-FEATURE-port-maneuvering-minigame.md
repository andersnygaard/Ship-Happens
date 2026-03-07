# Feature: Port Maneuvering Minigame

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: gameplay, minigame, fun
**Estimated Effort**: Complex

## Context & Motivation

The port maneuvering minigame is an iconic part of Ports of Call. Players steer their ship through a harbor to reach a docking berth. This adds skill-based gameplay to the simulation.

## Current State

Port departure screen exists with "steer by hand" option but it currently skips to port operations. The minigame itself doesn't exist.

## Desired Outcome

A top-down harbor maneuvering minigame where:
- Player sees a bird's-eye view of the harbor
- Ship sprite must navigate to a green-outlined docking berth
- Mouse/touch controls for steering
- Timer (hourglass countdown)
- Collision detection with harbor walls/obstacles causes damage
- Success = reaching the berth before time runs out
- Failure = time runs out or ship takes too much damage

## Spec References

- Port Maneuvering Minigame section: full description
- Harbor environments per port (varying difficulty)

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create harbor canvas with top-down view using HTML Canvas
2. **Phase 2**: Implement ship physics (position, velocity, rotation, throttle)
3. **Phase 3**: Create generic harbor layout with walls, obstacles, docking berth
4. **Phase 4**: Implement mouse/keyboard controls (click to set heading, keys for throttle)
5. **Phase 5**: Add collision detection and damage
6. **Phase 6**: Add timer with hourglass visual
7. **Phase 7**: Create 3-4 different harbor layouts with varying difficulty
8. **Phase 8**: Wire into port departure flow ("steer by hand" → minigame → port operations)

### Files to Create
- src/ui/screens/ManeuveringScreen.ts — Minigame screen
- src/game/HarborPhysics.ts — Ship physics engine
- src/data/harborLayouts.ts — Harbor layout definitions

### Files to Modify
- src/ui/screens/PortDepartureScreen.ts — Wire "steer by hand" to minigame
- src/ui/ScreenManager.ts — Add maneuvering screen type
- src/main.ts — Register maneuvering screen
- src/styles/screens.css — Minigame styles

### Dependencies
- **Internal**: Task 009 (travel system), Task 010 (game flow)

## Acceptance Criteria

- [x] Top-down harbor view renders with walls, water, and docking berth
- [x] Ship sprite moves and rotates based on player input
- [x] Mouse/keyboard controls work for steering and throttle
- [x] Timer counts down with visual feedback
- [x] Collisions with walls cause ship damage
- [x] Reaching the docking berth = success, transitions to port operations
- [x] Time running out = failure, ship takes damage, still docks
- [x] At least 3 different harbor layouts exist
- [x] "Steer by hand" in port departure launches minigame
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
