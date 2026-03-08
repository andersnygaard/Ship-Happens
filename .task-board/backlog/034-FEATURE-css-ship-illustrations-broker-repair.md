# Feature: CSS-Drawn Ship Illustrations for Broker and Repair Screens

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: High
**Labels**: visual, ship-broker, repair, illustrations
**Estimated Effort**: Complex

## Context & Motivation

The spec describes visually rich ship illustrations throughout the game:
- **Ship Broker**: "Ship illustration (side-view profile, visually distinct per type/size)" — each of the 10 ship classes should have a recognizable side-view profile
- **Ship Info**: "Upper half: Large detailed side-view ship illustration on black background"
- **Repair/Dry Dock**: "Left side: Dramatic front/bow-view illustration of ship in dry dock, propped on supports in enclosed dock facility"
- **Port Departure**: "Side-view illustration of the ship at dock"

Currently, the ShipCard component only shows a colored rectangle with the ship name as text. The repair dialog is a plain text form with no illustration. The port departure screen has no ship illustration.

## Current State

- `ShipCard.ts`: Uses a plain `div` with `backgroundColor` based on price range, and a text label — no actual ship shape
- `ShipInfoPanel.ts`: Likely has the same placeholder approach
- `RepairDialog.ts`: Pure text-based dialog with no dry dock illustration
- `PortDepartureScreen.ts`: Shows text info but no ship-at-dock illustration

## Desired Outcome

1. **Side-view ship profiles** drawn entirely with CSS (using divs, pseudo-elements, gradients, and box-shadows) — each of the 10 ship classes should be visually distinct by size and shape
2. **Ship info panel** shows a large ship profile illustration on a dark background
3. **Repair dialog** includes a CSS-drawn front/bow view of a ship in dry dock with supports
4. **Port departure** shows a side-view ship at dock
5. Ships should scale visually based on their class size — small coastal traders look different from mega haulers

## Spec References

- "Ship Broker" (section 3) — ship illustration per card
- "Ship Specification Sheet" (section 4) — large illustration on black background
- "Repair Interface" (section 6) — front/bow view in dry dock
- "Port Departure Screen" (section 5b) — side-view at dock
- "Visual Style" — sprite-based aesthetics, pixel art meets modern

## Technical Approach

### Implementation Steps

1. **Phase 1: Create a ship illustration utility** (`src/ui/components/ShipIllustration.ts`)
   - A function `createShipSideView(shipSpecId: string, width: number, height: number)` that returns an HTMLElement
   - Uses nested divs with CSS classes to draw a recognizable ship profile
   - The hull shape varies by ship class: small = simple box freighter, large = long container ship, etc.
   - Color varies by ship type (matching existing color scheme from ShipCard)
   - Include details: bridge/superstructure, mast, funnel (smokestack), cargo hold areas, hull waterline

2. **Phase 2: Create dry dock illustration**
   - A function `createDryDockView(shipSpecId: string, width: number, height: number)`
   - Front/bow view showing the ship's cross-section propped on supports
   - Dock facility walls on sides, supports underneath

3. **Phase 3: Integrate into existing components**
   - Replace the colored rectangle in `ShipCard.ts` with the side-view illustration
   - Add large illustration to `ShipInfoPanel.ts`
   - Add dry dock view to `RepairDialog.ts` (left side of a two-column layout)
   - Add ship-at-dock illustration to `PortDepartureScreen.ts`

### Files to Create
- `src/ui/components/ShipIllustration.ts` — Ship profile and dry dock drawing utilities

### Files to Modify
- `src/ui/components/ShipCard.ts` — Replace placeholder with ship illustration
- `src/ui/components/ShipInfoPanel.ts` — Add large ship illustration
- `src/ui/components/RepairDialog.ts` — Add dry dock illustration in two-column layout
- `src/ui/screens/PortDepartureScreen.ts` — Add ship-at-dock illustration
- `src/styles/screens.css` — CSS for ship illustration components

### Dependencies
- **External**: None
- **Internal**: None

### Risks & Considerations

- Pure CSS ship illustrations can get complex — keep them stylized/pixel-art-inspired rather than photorealistic
- Each of the 10 ship classes needs to look distinct — vary hull length, height, superstructure position
- The illustrations should be responsive (scale with container)
- Performance: avoid excessive DOM nodes — keep each ship to ~15-20 divs max

## Acceptance Criteria

- [ ] Each of the 10 ship classes has a visually distinct CSS side-view profile
- [ ] Ship cards in the broker show the ship illustration instead of a plain colored box
- [ ] Ship info panel displays a large ship illustration on dark background
- [ ] Repair dialog shows a front/bow dry dock view alongside the repair form
- [ ] Port departure screen shows a ship-at-dock side-view illustration
- [ ] All illustrations scale properly and don't break layout
- [ ] Build succeeds with no errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
