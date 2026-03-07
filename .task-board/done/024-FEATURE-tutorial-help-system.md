# Feature: Tutorial & Help System

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: ui, tutorial, ux
**Estimated Effort**: Medium

## Context & Motivation

New players need guidance through the game mechanics. A simple tutorial/help system explains what to do at each stage.

## Desired Outcome

- First-time player guidance: tooltips or hints pointing to next action
- Help button accessible from all screens
- Help panel with game mechanics explanation
- Contextual hints: "Buy a ship first!" "Accept a charter!" "Refuel before sailing!"
- Keyboard shortcuts displayed in help

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create HelpSystem that tracks tutorial progress
2. **Phase 2**: Create HelpPanel component with game guide
3. **Phase 3**: Add contextual hints that appear at appropriate moments
4. **Phase 4**: Add help button to all screens
5. **Phase 5**: Add keyboard shortcuts guide

### Files to Create
- src/ui/components/HelpPanel.ts — Help/guide panel
- src/game/TutorialSystem.ts — Tutorial state tracking

### Files to Modify
- src/ui/screens/WorldMapScreen.ts — Add help button, tutorial hints
- src/styles/screens.css — Help panel styles

## Acceptance Criteria

- [x] Help button accessible from world map
- [x] Help panel explains core game mechanics
- [x] Contextual hints appear for new players
- [x] First-time flow guides player: buy ship → charter → travel
- [x] Keyboard shortcuts listed in help
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
