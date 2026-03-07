# Feature: Expanded Harbor Layouts & Port-Specific Harbors

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: minigame, content, harbors
**Estimated Effort**: Medium

## Context & Motivation

Currently there are 3 generic harbor layouts. The spec describes unique layouts for each port with varying difficulty and visual character.

## Desired Outcome

- Harbor layouts assigned to specific ports based on geography
- At least 8 distinct layouts covering different port types
- Visual variations: tropical, industrial, arctic/icebergs, island navigation
- Difficulty scaling: easy ports (Rotterdam — big open basin), hard ports (Lagos — narrow channels)
- Icebergs as obstacles for polar route ports
- Green islands for tropical ports

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create 5 more harbor layouts (total 8)
2. **Phase 2**: Assign layouts to ports based on geography
3. **Phase 3**: Add visual variety (green islands, icebergs, tropical trees as obstacles)
4. **Phase 4**: Color palette variations per environment type
5. **Phase 5**: Assign difficulty ratings

### Files to Modify
- src/data/harborLayouts.ts — Add more layouts, port assignments
- src/ui/screens/ManeuveringScreen.ts — Render environment-specific visuals

## Acceptance Criteria

- [x] At least 8 distinct harbor layouts exist
- [x] Each port is assigned a specific layout
- [x] Tropical ports have palm trees/islands as visual elements
- [x] Arctic/polar ports have icebergs
- [x] Industrial ports have cranes, tanks, structures
- [x] Difficulty varies by port
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
