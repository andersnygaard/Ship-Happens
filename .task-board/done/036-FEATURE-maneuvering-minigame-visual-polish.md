# Feature: Maneuvering Minigame Visual Polish and Harbor Graphics

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: Medium
**Labels**: minigame, maneuvering, visual, harbor
**Estimated Effort**: Complex

## Context & Motivation

The spec describes richly detailed harbor environments for the maneuvering minigame:
- Tropical settings with palm trees, parks, narrow channels, cranes, warehouses, trucks
- Industrial ports with silos, storage tanks, container areas, lock/canal structures
- Detailed HUD: animated hourglass timer, speed/throttle gauge, damage bar, speed dots
- Each port has unique geometry, difficulty, and visual character

The current maneuvering screen has functional physics and collision detection but the visual rendering is basic — colored rectangles for water, land, walls, and obstacles. The HUD elements are functional but not styled to match the spec's detailed descriptions.

## Current State

- `ManeuveringScreen.ts`: Full canvas-based minigame with ship steering, collision, docking
- `HarborPhysics.ts`: Physics simulation with throttle, rotation, collision detection
- `harborLayouts.ts`: 8+ harbor layouts with obstacle data and environment themes (standard, tropical, arctic, industrial, mediterranean)
- Theme colors exist (tropical=green water, arctic=icy blue, etc.) but rendering is flat rectangles
- HUD has timer bar, speed indicator, damage bar — but styled as simple colored rectangles
- No decorative elements (cranes, trees, trucks, bollards, warehouses)

## Desired Outcome

1. **Richer harbor rendering**: Add decorative elements to the canvas drawing — cranes on dock edges, small warehouse buildings, trees (palm for tropical, pine for cold), bollards along piers
2. **Water effects**: Add subtle wave patterns, water reflections, and foam along coastlines
3. **Ship rendering**: Improve the ship sprite with more detail — proper hull shape, bridge, and color
4. **HUD polish**: Style the timer as an hourglass (or at least a richly framed countdown), make the speed gauge look like ship bridge instruments, add the spec's "speed dots" row
5. **Obstacle decorations**: Storage tanks as circles with crosshatch, islands with irregular green shapes, icebergs with faceted crystal appearance
6. **Success/failure feedback**: Better visual feedback when docking succeeds (green flash) or time runs out (red overlay)
7. **Port name display**: Show port name prominently in the minigame view

## Spec References

- "Port Maneuvering Minigame" (section 8) — full description of HUD and harbor environments
- "Harbor environments per port" — Rio, Rotterdam, Hamburg, Marseille, Lagos, Karachi, Polar, Islands
- "Visual Style" — "Harbor minigame: Top-down pixel art with detailed infrastructure"

## Technical Approach

### Implementation Steps

1. **Phase 1: Enhance harbor canvas rendering**
   - Add a `drawHarborDecorations()` function that adds visual details to the canvas after drawing the base layout
   - Draw cranes on dock edges (simple line art: vertical mast + boom arm + cable)
   - Draw warehouse/building rectangles near piers with different roof lines
   - Add bollards (small circles) along pier edges
   - Draw trees based on theme: palm trees for tropical, pine for standard, nothing for arctic
   - Add irregular coastline edges instead of sharp rectangles for land

2. **Phase 2: Water and environmental effects**
   - Add subtle wave lines on the water surface (sine-based horizontal lines)
   - Draw foam/white-edge along land/water boundaries
   - Icebergs for arctic theme: faceted polygon shapes with blue-white gradient
   - Islands for open-water themes: irregular green blobs

3. **Phase 3: HUD improvements**
   - Restyle the timer with a framed panel look (dark background, copper border)
   - Add "TIME" label above the timer
   - Make the speed gauge look like vertical bar segments (green bars)
   - Add heading/rudder indicator
   - Add "speed dots" row at bottom edge (10 small circles indicating thrust)
   - Show port name prominently in top-right corner
   - Add damage flash effect on collision (screen briefly tints red)

4. **Phase 4: Ship sprite improvement**
   - Draw the ship as a proper hull shape (pointed bow, flat stern)
   - Add bridge/superstructure rectangle
   - Add rudder indicator line
   - Different colors based on player

### Files to Create
- None

### Files to Modify
- `src/ui/screens/ManeuveringScreen.ts` — Enhanced harbor rendering, HUD improvements, ship sprite, decorations
- `src/data/harborLayouts.ts` — Add decoration data to harbor layouts (crane positions, tree positions, warehouse zones)
- `src/styles/screens.css` — Additional HUD styling if needed

### Dependencies
- **External**: None
- **Internal**: None

### Risks & Considerations

- All rendering is on a single HTML Canvas — too many decorations could affect frame rate
- Keep decorative drawing efficient: pre-calculate positions, avoid per-frame allocations
- The minigame needs to remain playable — decorations should not obscure gameplay elements
- Canvas size is 800x600 — decorations need to scale within this
- Collision detection must still use the original obstacle geometry, not the visual decorations

## Acceptance Criteria

- [x] Harbor rendering includes decorative elements: cranes, warehouses, bollards, trees
- [x] Water has visible wave patterns or texture (not flat solid color)
- [x] Ship sprite has proper hull shape with bow, stern, and bridge
- [x] Timer HUD has a framed panel look with "TIME" label
- [x] Speed gauge shows as vertical bar segments
- [x] Port name displays prominently during minigame
- [x] Arctic harbors show faceted iceberg obstacles
- [x] Tropical harbors show green vegetation/palm trees
- [x] Build succeeds with no errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
