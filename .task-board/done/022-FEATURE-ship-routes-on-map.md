# Feature: Ship Routes & Positions on World Map

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, world-map, ships
**Estimated Effort**: Medium

## Context & Motivation

The world map should show ship icons at their current ports and route lines when traveling.

## Desired Outcome

- Ship icons (small triangles/circles) at their current port positions on the world map
- Route lines drawn from origin to destination when a ship is traveling
- Multiple ships shown for multiplayer (different colors per player)
- Ship tooltip showing name, condition, fuel on hover
- Animate ship position along route during travel simulation

## Technical Approach

### Implementation Steps

1. **Phase 1**: Draw ship markers at port positions on the world map canvas
2. **Phase 2**: Draw route lines (dashed, curved great circle approximation)
3. **Phase 3**: Color-code ships by player
4. **Phase 4**: Add hover tooltips for ships
5. **Phase 5**: Animate ship position during travel

### Files to Modify
- src/ui/components/WorldMapCanvas.ts — Add ship rendering, routes
- src/ui/screens/WorldMapScreen.ts — Pass ship data to canvas

## Acceptance Criteria

- [x] Ship markers visible at port locations on world map
- [x] Route lines drawn between origin and destination
- [x] Ships color-coded by player in multiplayer
- [x] Ship hover shows name, condition, fuel
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
