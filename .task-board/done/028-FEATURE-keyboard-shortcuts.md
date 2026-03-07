# Feature: Keyboard Shortcuts & Accessibility

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: ux, accessibility, controls
**Estimated Effort**: Simple

## Context & Motivation

Keyboard navigation improves usability and accessibility. Common actions should have keyboard shortcuts.

## Desired Outcome

- Global keyboard shortcuts:
  - Escape: close any open dialog/modal, or go back to previous screen
  - H: toggle help panel
  - M: toggle mute
  - S: start/stop action (on world map)
  - 1-5: quick access to port operations (repair, refuel, charter, lay up, load)
  - B: go to ship broker (from world map)
  - O: go to office (from world map)
- Focus management: tab through interactive elements

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create global keyboard event handler
2. **Phase 2**: Implement shortcuts for each screen context
3. **Phase 3**: Add visual hints for keyboard shortcuts on buttons

### Files to Create
- src/ui/KeyboardManager.ts — Global keyboard handler

### Files to Modify
- src/main.ts — Initialize keyboard manager
- Various screens — Register context-specific shortcuts

## Acceptance Criteria

- [x] Escape closes dialogs and goes back
- [x] H toggles help, M toggles mute
- [x] S triggers start action on world map
- [x] B and O navigate to broker and office
- [x] 1-5 trigger port operations
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
