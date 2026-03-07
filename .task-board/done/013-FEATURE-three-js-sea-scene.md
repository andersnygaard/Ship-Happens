# Feature: Three.js Animated Sea Scene & Visual Polish

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: visuals, three-js, animation
**Estimated Effort**: Complex

## Context & Motivation

The Three.js scene is currently a static blue plane. The game needs animated water, atmospheric effects, and visual appeal to match the spec's "retro-modern aesthetic."

## Current State

Basic Three.js scene with flat blue plane, ambient/directional lights.

## Desired Outcome

- Animated ocean with wave-like motion
- Day/night cycle based on game time
- Ship model visible during travel (simple 3D ship or sprite)
- Atmospheric fog and better lighting
- The Three.js scene should be visible behind UI overlays during travel
- Travel screen uses the 3D scene as background

## Spec References

- Visual Style (Modern): "Three.js 3D world with 2D sprite overlays", "Animated water, weather effects, day/night cycle"
- Sea Voyage Animation: "ship on ocean with stylized waves, birds flying overhead"

## Technical Approach

### Implementation Steps

1. **Phase 1**: Replace flat plane with animated water using vertex displacement
2. **Phase 2**: Add fog and improved lighting (sunset/sunrise colors)
3. **Phase 3**: Create a simple low-poly ship model (or use a box shape with a triangle bow)
4. **Phase 4**: Day/night cycle: change sky/fog color based on game time
5. **Phase 5**: Make Three.js scene visible behind travel screen

### Files to Create
- src/scene/OceanScene.ts — Animated ocean with waves
- src/scene/ShipModel.ts — Simple 3D ship
- src/scene/SkySystem.ts — Day/night, fog, sky colors

### Files to Modify
- src/main.ts — Use new ocean scene
- src/ui/screens/TravelScreen.ts — Show Three.js scene behind

### Dependencies
- **Internal**: Task 001 (Three.js setup)

## Acceptance Criteria

- [x] Ocean has animated wave motion (vertex displacement or shader)
- [x] Fog creates atmospheric depth
- [x] Simple ship model visible in the scene
- [x] Day/night cycle changes lighting and sky colors
- [x] Three.js scene visible as background during travel
- [x] Visual quality noticeably improved from static blue plane
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
