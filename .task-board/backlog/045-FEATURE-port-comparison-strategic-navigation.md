# Feature: Port Comparison & Strategic Navigation Tooltips

**Status**: Backlog
**Created**: 2026-03-08
**Priority**: Medium
**Labels**: ux, ui, worldmap, gameplay, strategic-depth
**Estimated Effort**: Medium

## Context & Motivation
The game has 30 ports with meaningfully different attributes — varying repair costs ($24,500-$31,770/%), different fuel prices (0.8x-1.3x multiplier), diverse cargo types, and world events that temporarily block ports or add surcharges. Players must choose destinations strategically: refueling at cheap ports, repairing at affordable drydocks, and selecting charter routes that pass through favorable ports. However, the world map currently only shows port names when hovering/clicking — none of the economically relevant port data is visible until the player actually arrives and opens Port Operations. This forces players to memorize port attributes or make blind decisions, reducing strategic depth. The spec describes a simulation where informed decision-making is core (choosing charters, managing fuel, timing repairs), but the map provides no decision-support information. A port comparison tooltip or info panel on the world map would close this gap and make navigation feel genuinely strategic.

## Current State
- `WorldMapCanvas` renders ports as dots with names on hover, and highlights the selected destination.
- `WorldMapScreen` shows a selected port info area when clicking a port, but it only displays the port name and distance/travel time to destination.
- Port data (repair cost, fuel price, cargo types, population, languages, ship count) exists in `ports.ts` but is only visible on the Port Operations screen after arrival.
- `WorldEvents` can block ports or add cost surcharges, and `isPortBlocked()` / `getPortCostMultiplier()` are used on the world map to dim blocked ports, but cost multiplier effects are not shown.
- The `VoyageEstimator` calculates profitability and fuel costs, but this data is only shown for the selected charter destination, not for general port browsing.
- There is no way to compare two ports side-by-side or see which nearby port has the cheapest repairs or fuel.

## Desired Outcome
- Clicking a port on the world map shows an expanded info tooltip/panel with key strategic data:
  - Port name and country.
  - Distance from current position (nautical miles) and estimated travel time.
  - Repair cost per % (with world event surcharge if active).
  - Fuel cost per ton (with world event surcharge if active).
  - Available cargo types (showing which cargoes can be loaded or delivered there).
  - Active world events affecting this port (e.g., "Port Strike: +50% costs for 3 more weeks").
  - A "cheapest for repairs" or "cheapest fuel nearby" indicator if this port is the best option within reasonable range.
- The world map color-codes or annotates ports with icons based on available services that match the player's current needs (e.g., a wrench icon if the active ship needs repairs and this port has below-average repair costs; a fuel icon if the ship is low on fuel).
- An optional "Port Comparison" panel accessible from the world map sidebar that lists all ports sorted by a chosen attribute (repair cost, fuel cost, distance) to help players plan multi-leg routes.
- Port tooltips show charter demand hints (e.g., "High demand for Machinery" or "3 cargo types available") to help players choose where to look for charters.

## Spec References
- Section "World Map / Globe": "Ports marked as selectable destinations (small dots on map)" — ports are interactive and should convey useful information.
- Section "Port Operations - Port Information": Shows population, languages, ships, cargo capacity, available cargo types, and repair cost — this data exists and should be surfaced earlier.
- Section "Financial System": Repair costs "vary by port ($27,290 - $31,770 per %)" and fuel costs vary — strategic port selection depends on knowing this in advance.
- Section "World Events": Sanctions, strikes, surcharges affect port costs — players need to see these effects before committing to a voyage.
- Section "Charter / Freight Contract Screen": Cargo type availability varies by port — knowing what cargo a port offers helps with route planning.

## Technical Approach

### Implementation Steps
1. Enhance the port click handler in `WorldMapScreen` to show an expanded info panel (replacing or augmenting the current minimal destination label). The panel should display: port name, country, distance, travel time, repair cost/%, fuel cost/ton, available cargo types, and any active world events.
2. Create a `PortInfoTooltip` component in `src/ui/components/PortInfoTooltip.ts` that renders the expanded port data. Accept the port, current ship spec (for travel time calculation), and active world events as inputs.
3. Add contextual need-based icons to port dots on the `WorldMapCanvas`:
   - Wrench icon overlay if the active ship condition is below 50% and this port's repair cost is below average.
   - Fuel drop icon if the active ship fuel is below 30% capacity and this port has below-average fuel cost.
   - Warning triangle if the port is affected by a world event with cost surcharge.
   - Red X if the port is blocked.
4. Add a "Compare Ports" button to the world map sidebar that opens a sortable table of all non-blocked ports with columns: name, distance, repair cost, fuel cost, number of cargo types, active events. Allow sorting by any column.
5. Calculate and cache the "cheapest repair" and "cheapest fuel" ports relative to the active ship's position (within reasonable travel range) and highlight them with a subtle glow or label on the map.
6. Show world event impact inline on port tooltips: if a port has a cost surcharge from a world event, display the surcharge percentage and remaining duration.

### Files to Create
- `src/ui/components/PortInfoTooltip.ts` — Expanded port information tooltip/panel component.

### Files to Modify
- `src/ui/screens/WorldMapScreen.ts` — Integrate the port info tooltip on port click. Add "Compare Ports" sidebar button. Add need-based port icon overlays.
- `src/ui/components/WorldMapCanvas.ts` — Add icon overlay rendering for ports (wrench, fuel, warning, blocked indicators).
- `src/styles/screens.css` — Styles for the port info tooltip panel and comparison table.

### Dependencies
- Existing `ports.ts` data, `WorldEvents` functions, `ShipManager.getFuelCostPerTon()`, and `WorldMapCanvas` provide all necessary data and rendering infrastructure.
- No new external dependencies.

### Risks & Considerations
- The expanded tooltip must not obscure the map too much — position it to the side of the clicked port or use a slide-out panel.
- Icon overlays on the map should be subtle enough not to clutter the visual but visible enough to be useful. Consider showing them only when the player has a ship selected.
- The port comparison table should handle the case where world events change port availability between turns — data should always reflect current state.
- Performance: calculating distances from the active ship to all 30 ports is trivial (30 Haversine calculations), so no caching concern.
- Need-based icons should update when the player switches active ships (different ships may have different fuel/condition levels).

## Acceptance Criteria
- [ ] Clicking a port on the world map shows an expanded info panel with repair cost, fuel cost, cargo types, distance, and travel time.
- [ ] World events affecting a port are displayed in the tooltip with surcharge percentage and remaining duration.
- [ ] Ports display contextual need-based icon overlays (wrench for repair, fuel drop for refueling) when the active ship has relevant needs.
- [ ] Blocked ports show a clear blocked indicator (red X or similar).
- [ ] A "Compare Ports" panel is accessible from the world map, listing ports with sortable columns.
- [ ] The cheapest repair and fuel ports within range are highlighted or labeled.
- [ ] Port info updates correctly when switching between active ships.
- [ ] Tooltip positioning does not obscure the map or other UI elements.

---
**Next Steps**: Ready for implementation.
