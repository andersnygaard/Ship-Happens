# Epic: Visual Aesthetics Overhaul — Nautical Industrial Theme

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: aesthetics, ui, visual-design, epic
**Estimated Effort**: Complex

## Context & Motivation

The spec describes a rich visual style inspired by the original Ports of Call game: riveted metallic UI panels, porthole frames around port views, clipboard-style captain's orders, a ship broker lobby with brick walls and an elevator, and pixel-art-inspired visuals throughout. The current implementation has a serviceable dark theme with CSS variables for colors, but it is far from the richly themed, immersive nautical aesthetic the spec demands. The user specifically requested improved aesthetics.

## Current State

- **CSS theming**: Dark blue/purple palette with copper/bronze accent colors defined in CSS variables. Buttons have gradient backgrounds. Panels have subtle box-shadows.
- **Missing**: No riveted texture effects, no porthole frames, no clipboard metaphors, no pixel art styling, no broker lobby visuals, no ship illustrations, no atmospheric backgrounds per screen.
- **Screens are flat**: Setup screen is a plain form on a gradient. World map is a canvas on a dark background. Port operations lacks the four-quadrant riveted layout from the spec. Ship broker has no lobby entrance visual.
- **No visual personality**: The game could be any generic web app — it doesn't feel like a shipping game from the 1980s reimagined.

## Desired Outcome

Each screen should have a distinct, themed visual identity that evokes the nautical/industrial aesthetic:

1. **Riveted metallic panels**: All major panels should look like they're made of metal with visible rivets around the border — achieved via CSS pseudo-elements, gradients, and shadows.
2. **Porthole framing**: Port skyline views should appear inside a circular/octagonal porthole with a metallic riveted border.
3. **Clipboard metaphor**: Captain's orders (port operations) should look like paper on a clipboard pinned to a board.
4. **Ship broker lobby**: The broker screen should evoke a brick-walled entrance with an elevator (CSS illustration using gradients and box-shadows).
5. **World map atmosphere**: The map should feel like a navigation chart — aged parchment or dark maritime chart with grid lines.
6. **Typography**: Headings in serif fonts (already using Playfair Display), data in monospace (Share Tech Mono), body in clean sans-serif (Inter). Ensure consistent application.
7. **Color coding**: Blue for unselected, red for active/selected, yellow/amber for data text — matching original game conventions.
8. **Screen backgrounds**: Each screen should have a distinct atmospheric background — not just flat gradients.
9. **Button styling**: Metallic, chunky buttons that look like ship bridge controls.
10. **Subtle animations**: Wave-like borders, gentle pulsing on active elements, copper shimmer effects.

## Spec References

- "Visual Style (Original Game Reference)" — complete description of original aesthetics
- "Visual Style (Ship Happens — Modern)" — modern interpretation guidelines
- "Screens & Interfaces" sections 1-10 — each screen's visual layout description
- "Port Operations (Captain's Orders)" — four-quadrant riveted layout, clipboard, porthole
- "Ship Broker" — brick building, red carpet, elevator
- "Office (Company Management)" — first-person office interior

## Technical Approach

### Implementation Steps

1. **Phase 1: CSS foundation — riveted panels and metallic textures**
   - Create CSS classes for riveted panels with multiple pseudo-element rivets (not just 2 — place 4+ rivets around corners)
   - Add metallic gradient textures using CSS gradients (brushed metal effect)
   - Create a porthole frame component using CSS (circle with thick metallic border, rivets, inner shadow)
   - Add clipboard style: paper-white background with subtle lined texture, clip at top
   - Add copper pipe/border decorations using CSS border-image or gradients

2. **Phase 2: Screen-specific visual treatments**
   - **Setup screen**: Nautical chart background, compass rose decoration, aged paper feel for the form
   - **World map**: Dark maritime chart background with latitude/longitude grid, ship's wheel decoration
   - **Ship broker**: Brick wall texture background, elevator panel with indicator lights, red carpet effect at bottom
   - **Office**: Wood-paneled background, desk texture, framed map element
   - **Port operations**: Four-quadrant riveted layout with distinct panel styles per quadrant
   - **Travel screen**: Atmospheric gradient (sky-to-ocean) behind the 3D scene
   - **Maneuvering**: Top-down harbor view with water texture background

3. **Phase 3: Component-level polish**
   - Style all buttons with a chunky, metallic pressed-plate look
   - Add hover/active animations (metal click feedback)
   - Style input fields with an industrial look (thick borders, inset shadows)
   - Add CSS-only decorative elements: anchor icons, wave borders, compass elements
   - Ensure toast notifications match the nautical theme
   - Style the news ticker with a brass/copper ticker tape look
   - Add a subtle vignette effect to screens for atmosphere

### Files to Create
- None — enhance existing CSS files

### Files to Modify
- `src/styles/main.css` — Enhanced base component styles, new utility classes
- `src/styles/screens.css` — Screen-specific themed backgrounds and layouts
- Various screen `.ts` files — may need to add CSS classes or wrapper elements for styling hooks
- `src/ui/components/PortSkyline.ts` — Add porthole frame markup
- `src/ui/screens/PortOperationsScreen.ts` — Restructure for four-quadrant riveted layout
- `src/ui/screens/ShipBrokerScreen.ts` — Add lobby/elevator visual elements

### Dependencies
- **External**: None (all CSS-based, no new packages)
- **Internal**: Task 031 (screens must be visible first before aesthetics matter)

### Risks & Considerations

- Heavy CSS can impact performance on low-end devices — keep animations GPU-accelerated (transform, opacity)
- Pseudo-elements have limits — can only use ::before and ::after per element, so some decorations need wrapper divs
- Must maintain readability — decorative elements should enhance, not obstruct, game information
- The dark nautical theme should have enough contrast for accessibility (WCAG AA minimum)
- Background textures via CSS gradients can be complex but load instantly (no external images needed)

## Acceptance Criteria

- [ ] All panels have a visible riveted metallic border effect (corner rivets + metallic gradient)
- [ ] Port skyline views appear inside a porthole frame (circular with thick metallic border)
- [ ] Port operations screen has a four-quadrant layout matching the spec (clipboard + porthole + info panel + orders)
- [ ] Ship broker screen evokes a lobby atmosphere (brick texture, elevator visual)
- [ ] World map feels like a nautical chart (dark maritime background)
- [ ] Buttons look and feel like metallic ship controls (not flat web buttons)
- [ ] Each screen has a distinct atmospheric background (not identical gradients)
- [ ] Typography is consistent: serif headings, monospace data, sans-serif body text
- [ ] Color coding follows original: blue=unselected, red=active, yellow=data
- [ ] The overall aesthetic feels like "1986 Amiga game reimagined for the web"

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
