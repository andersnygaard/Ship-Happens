# Feature: World Map Screen & Navigation

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, world-map, navigation
**Estimated Effort**: Complex

## Context & Motivation

The world map is the main game screen where players see port locations, ship positions, and initiate travel. It's the hub from which all gameplay flows. The original game used a Mercator projection with green landmasses and blue ocean.

## Current State

After task 004, we have a screen management system and screen stubs. The world map stub needs to become a fully functional screen.

## Desired Outcome

A world map screen with:
- Canvas-rendered Mercator projection world map with landmasses
- All 30 ports marked as clickable dots with labels
- Ship position indicator showing current port or at-sea position
- Sidebar with navigation buttons (Globe, Office, Ship Broker)
- Bottom bar with simulation clock (weeks, years) and START ACTION button
- Status bar showing player info (company name, balance)

## Spec References

- World Map / Globe section: Full description of map, ports, sidebar, simulation clock
- Time System: Weeks/years counters, START/STOP ACTION buttons

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create a 2D canvas overlay for the world map (Mercator projection)
2. **Phase 2**: Draw simplified world landmasses (use a simplified polygon set or SVG path data)
3. **Phase 3**: Plot all 30 ports as interactive dots using lat/lng coordinates
4. **Phase 4**: Add sidebar with Globe/Office/Ship Broker navigation buttons
5. **Phase 5**: Add bottom bar with time display and START ACTION button
6. **Phase 6**: Wire START ACTION to advance game time and trigger travel/events

### Files to Create
- `src/ui/screens/WorldMapScreen.ts` — Full world map implementation (replace stub)
- `src/ui/components/WorldMapCanvas.ts` — Canvas-based map rendering
- `src/ui/components/Sidebar.ts` — Navigation sidebar
- `src/ui/components/StatusBar.ts` — Bottom status/time bar
- `src/data/worldMapData.ts` — Simplified world coastline polygon data for rendering

### Files to Modify
- `src/styles/screens.css` — World map specific styles

### Dependencies
- **External**: None
- **Internal**: Task 004 (screen framework)

### Risks & Considerations
- World map polygon data should be kept simple (low-poly coastlines)
- Canvas rendering must be performant with all 30 ports
- Port dots need hover/click interaction

## Acceptance Criteria

- [x] World map displays with recognizable landmasses (Mercator projection)
- [x] All 30 ports are plotted at correct approximate positions
- [x] Ports are interactive (hover shows name, click selects)
- [x] Sidebar has Globe, Office, Ship Broker buttons that navigate to respective screens
- [x] Bottom bar shows weeks and years counters
- [x] START ACTION button exists and advances game time when clicked
- [x] Current player's ship position is shown on the map
- [x] Player company name and balance displayed
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
