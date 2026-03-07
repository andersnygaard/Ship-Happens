# Feature: Port Operations Screen (Captain's Orders)

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: ui, port-operations, gameplay
**Estimated Effort**: Complex

## Context & Motivation

Port Operations is where core gameplay happens: repair, refuel, charter, load cargo, and lay up ships. This screen uses a four-quadrant layout and connects to all the game state management systems already built.

## Current State

We have a stub PortOperationsScreen. The game state systems (repair, refuel, charter, load) are fully implemented in GameState.ts and its subsystems.

## Desired Outcome

A four-quadrant port operations screen with:
- Top-left: Ship status panel (company, ship, origin, cargo, result, balance, condition, fuel)
- Top-right: Port view with port name, country, and a placeholder porthole frame
- Bottom-right: Port information (population, languages, ships, cargo capacity, available cargo)
- Bottom-left: Captain's Orders menu (REPAIR, REFUEL, CHARTER, LAY UP, LOAD buttons)
- Each button opens appropriate action dialog/flow

## Spec References

- Port Operations (Captain's Orders) section: Four-quadrant layout
- Repair Interface: repair dialog with cost per %
- Charter / Freight Contract Screen: destination + cargo selection
- Financial System: repair costs, fuel costs

## Technical Approach

### Implementation Steps

1. **Phase 1**: Build four-quadrant layout with CSS grid
2. **Phase 2**: Implement ship status panel reading from GameState
3. **Phase 3**: Implement port info panel reading from port data
4. **Phase 4**: Build REPAIR dialog (input % to repair, show cost, confirm)
5. **Phase 5**: Build REFUEL dialog (input tons, show cost, confirm)
6. **Phase 6**: Build CHARTER dialog (destination/cargo selection, show contract details)
7. **Phase 7**: Wire LOAD and LAY UP buttons to game state

### Files to Create
- src/ui/components/RepairDialog.ts
- src/ui/components/RefuelDialog.ts
- src/ui/components/CharterDialog.ts

### Files to Modify
- src/ui/screens/PortOperationsScreen.ts — Full implementation
- src/styles/screens.css — Port operations styles
- src/main.ts — Pass game state to PortOperationsScreen

### Dependencies
- **External**: None
- **Internal**: Tasks 003 (game state), 004 (UI framework)

## Acceptance Criteria

- [x] Four-quadrant layout displays correctly
- [x] Ship status panel shows current ship data (name, condition, fuel, balance)
- [x] Port info panel shows port data (country, population, available cargo types)
- [x] REPAIR button opens dialog with cost per %, input field, and confirm
- [x] REFUEL button opens dialog with fuel input and confirm
- [x] CHARTER button opens dialog with destination/cargo selection and contract details
- [x] LOAD button loads accepted charter cargo
- [x] LAY UP button toggles ship lay-up status
- [x] All actions update game state correctly
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
