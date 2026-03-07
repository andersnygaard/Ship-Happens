# Feature: Port Skylines & Visual Identity

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: visuals, ports, art
**Estimated Effort**: Medium

## Context & Motivation

Each port should have visual identity. The original game had unique skyline illustrations per port. We need distinct port visuals, even if procedurally generated or CSS-based.

## Current State

Port operations shows port name/country but no visual representation. The porthole view is placeholder.

## Desired Outcome

- Each port has a unique CSS/canvas-generated skyline silhouette
- Port skylines shown in the porthole view on Port Operations screen
- Different time-of-day backgrounds (day/night/sunset)
- Distinctive landmarks for key ports (recognizable silhouettes)

## Spec References

- Port Skyline Gallery: 36 unique skylines with landmarks
- Port Operations top-right: porthole with skyline

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create procedural skyline generator using canvas (rectangles for buildings, triangles for mountains/roofs)
2. **Phase 2**: Define landmark silhouettes for key ports (Sydney Opera House shape, Big Ben, etc.)
3. **Phase 3**: Color palettes per time-of-day (day, sunset, night)
4. **Phase 4**: Integrate into Port Operations porthole view
5. **Phase 5**: Add porthole frame CSS (circular/octagonal with rivets)

### Files to Create
- src/ui/components/PortSkyline.ts — Procedural skyline generator
- src/data/portSkylineData.ts — Per-port skyline configuration

### Files to Modify
- src/ui/screens/PortOperationsScreen.ts — Use PortSkyline component
- src/styles/screens.css — Porthole frame styles

### Dependencies
- **Internal**: Task 007 (Port Operations)

## Acceptance Criteria

- [x] Each port has a unique skyline silhouette
- [x] Skylines render in the porthole view on Port Operations
- [x] At least 5 ports have recognizable landmark shapes
- [x] Day/night/sunset color variations based on port location
- [x] Porthole has circular/octagonal frame with riveted look
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
