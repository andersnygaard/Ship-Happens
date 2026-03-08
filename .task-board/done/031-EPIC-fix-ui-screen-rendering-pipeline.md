# Epic: Fix UI Screen Rendering Pipeline — Screens Not Visible

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: critical-bug, ui, blocking
**Estimated Effort**: Complex

## Context & Motivation

Users report that the game only shows a boat on the ocean — no menus, no screens, no interactivity. This is a **critical, game-breaking bug** that makes the entire game unplayable. All the game logic, screens, and UI components exist in code, but something in the rendering pipeline prevents them from being visible or interactive.

The spec describes a complete game flow: Loading → Setup → World Map → various screens. The user should see the setup screen immediately after the loading animation completes.

## Current State

The architecture uses a Three.js canvas (full-screen) with an HTML `#ui-overlay` div rendered on top. The ScreenManager creates screen elements and appends them to the overlay. However:

1. **The `#ui-overlay` has `pointer-events: none`** — while child elements restore `pointer-events: auto`, if the overlay itself has issues (z-index, display, visibility) screens won't render correctly.
2. **Screen backgrounds use semi-transparent rgba values** — e.g., `rgba(26, 58, 92, 0.95)` for the setup screen. While this should mostly occlude the canvas, any rendering issues could make screens appear transparent/invisible.
3. **The loading screen removal relies on `animationend` event** — if the fade-out animation doesn't fire (e.g., due to CSS not loading, or the element already being hidden), the loading screen stays and blocks everything, OR the setup screen call happens but fails silently.
4. **The Three.js renderer `document.body.appendChild(renderer.domElement)` runs before the UI overlay** — the canvas is appended dynamically before the `#ui-overlay` in the DOM, but `index.html` has `<div id="ui-overlay"></div>` statically, so DOM order may conflict with the dynamically appended canvas.
5. **Potential JS errors** — if any import fails or screen constructor throws, the entire UI chain breaks silently.

## Desired Outcome

- The game loads and displays the **loading screen** with animation
- After loading, the **setup screen** appears with player input forms
- All 9 screens render correctly on top of the 3D canvas
- Screen transitions (fade in/out) work smoothly
- All buttons and interactive elements are clickable
- The 3D ocean/ship scene is visible as a background where appropriate (world map, travel)

## Spec References

- "Game Flow (from original analysis)" — the full startup sequence
- "Screens & Interfaces" — all 9 screens should be accessible
- All screen descriptions (sections 1-10)

## Technical Approach

### Implementation Steps

1. **Phase 1: Diagnose and fix the root cause**
   - Add console logging to `ScreenManager.showScreen()` to verify it's being called
   - Verify that `#ui-overlay` exists in the DOM and has correct z-index positioning
   - Ensure the Three.js canvas does NOT cover or block the overlay — it should have `position: fixed` and a LOWER z-index than `#ui-overlay`
   - Fix the canvas z-index: give `renderer.domElement` an explicit low z-index and `position: fixed`
   - Ensure `#ui-overlay` has `position: fixed` (not `absolute`) so it's always on top
   - Verify loading screen fade-out + setup screen show sequence works
   - Add error boundaries / try-catch to the screen initialization chain

2. **Phase 2: Fix CSS stacking and visibility**
   - Ensure `.screen` elements have full opacity backgrounds (not semi-transparent where not intended)
   - Make the setup screen background fully opaque so the 3D scene doesn't bleed through
   - Verify z-index stacking: canvas (z:1) < ui-overlay (z:100) < loading-screen (z:10000)
   - Fix any CSS issues that could hide screen content (overflow, height, display)
   - Ensure screens have `width: 100%` and `height: 100%` and are truly full-screen overlays

3. **Phase 3: Test complete game flow**
   - Verify: Load → Setup screen visible → Fill form → Click "Set Sail!" → World Map visible
   - Verify: World Map → Office, Ship Broker, Port Operations all navigate correctly
   - Verify: Screen transitions (fade) work without glitches
   - Verify: Keyboard shortcuts work on each screen
   - Test with browser dev tools: no JS errors in console, no CSS warnings

### Files to Create
- None (this is a fix, not new functionality)

### Files to Modify
- `src/main.ts` — Fix canvas positioning, improve initialization sequence, add error handling
- `src/styles/main.css` — Fix `#ui-overlay` positioning, z-index, ensure screens are visible
- `src/ui/ScreenManager.ts` — Add defensive error handling, verify DOM attachment
- `index.html` — Ensure correct DOM order and canvas styling

### Dependencies
- **External**: None
- **Internal**: None (this unblocks everything else)

### Risks & Considerations

- The root cause could be a simple CSS stacking issue (most likely) or a deeper JS initialization order bug
- Multiple screens use overlays and modals — fixing the base must not break dialog layering
- The Three.js canvas is appended dynamically via `document.body.appendChild()` — this may insert it AFTER the `#ui-overlay` div, pushing it higher in the stacking context
- Loading screen removal depends on `animationend` event — need a fallback timeout

## Acceptance Criteria

- [x] Game loads and the setup screen is fully visible and interactive
- [x] Player can enter name, company name, select home port, and click "Set Sail!"
- [x] World map screen renders with the map, sidebar buttons, and action button
- [x] All 9 screens can be navigated to and are fully visible
- [x] Screen transitions (fade in/out) animate smoothly
- [x] No JavaScript errors in the browser console during normal gameplay flow
- [x] The 3D ocean scene is visible as a background on the world map and travel screens
- [x] Dialogs and modals (repair, refuel, charter, purchase) appear on top of screens

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
