# Feature: Loading Screen & Screen Transitions

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Low
**Labels**: ui, polish, transitions
**Estimated Effort**: Simple

## Context & Motivation

Smooth transitions between screens make the game feel polished. A loading screen on initial load prevents showing an uninitialized state.

## Desired Outcome

- Initial loading screen while Three.js and fonts load
- Fade transitions between screens (CSS opacity animation)
- Loading spinner/indicator for heavy operations

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create loading screen (shown before main.ts finishes setup)
2. **Phase 2**: Add CSS fade transitions to ScreenManager
3. **Phase 3**: Add transition animations between screens

### Files to Create
- src/ui/screens/LoadingScreen.ts — Initial loading display

### Files to Modify
- src/ui/ScreenManager.ts — Add transition animations
- index.html — Add inline loading state
- src/styles/screens.css — Transition animations

## Acceptance Criteria

- [x] Loading screen shows on initial page load
- [x] Smooth fade transition between screens
- [x] Loading screen disappears when game is ready
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
