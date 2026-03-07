# Refactor: Code Quality, Polish & Bug Fixes

**Status**: Done
**Created**: 2026-03-07
**Priority**: High
**Labels**: refactor, quality, polish
**Estimated Effort**: Complex

## Context & Motivation

After rapid feature development, the codebase needs a quality pass. Review all files for consistency, fix any TypeScript issues, improve error handling, and ensure the game runs smoothly end-to-end.

## Current State

15 tasks implemented. Code may have inconsistencies, unused imports, or edge case bugs.

## Desired Outcome

- All TypeScript strict mode checks pass
- Consistent code style across all files
- No console.log left in production code (replace with proper UI feedback)
- All screen transitions work correctly
- Edge cases handled (empty fleet, zero balance, max ships)
- Build produces clean output with no warnings
- Game is playable from start to finish without crashes

## Technical Approach

### Implementation Steps

1. **Phase 1**: Run TypeScript strict checks and fix all issues
2. **Phase 2**: Review all console.log statements — replace with UI notifications
3. **Phase 3**: Add a toast/notification component for game messages
4. **Phase 4**: Test all screen transitions for null/undefined errors
5. **Phase 5**: Fix any CSS layout issues
6. **Phase 6**: Clean build with no warnings
7. **Phase 7**: Test complete game flow

### Files to Create
- src/ui/components/Toast.ts — Toast notification component

### Files to Modify
- Multiple files — Fix issues found during review

### Dependencies
- **Internal**: All previous tasks

## Acceptance Criteria

- [x] TypeScript compiles with no errors in strict mode
- [x] No console.log statements remain (except debug mode)
- [x] Toast notification system for game messages
- [x] All screen transitions work without errors
- [x] Build produces clean output (npm run build with no warnings)
- [x] Game is playable end-to-end: setup → buy ship → charter → travel → port ops → repeat
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
