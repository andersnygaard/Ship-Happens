# Feature: Game Data Models & Constants

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: data, models, core
**Estimated Effort**: Medium

## Context & Motivation

The game needs well-defined TypeScript types and static data for ports, ships, cargo types, and game constants. These data models are the foundation for every game system.

## Current State

No source code exists beyond the basic scaffold (task 001).

## Desired Outcome

Complete TypeScript type definitions and static data files for:
- All 30 ports with attributes (coordinates, country, population, languages, ship count, cargo capacity, available cargo types, repair cost rates)
- Ship catalog with specs (type, capacity, price, engine power, dimensions, speed, fuel consumption, bunker capacity, daily costs, deposit %)
- Cargo types enumeration
- Financial system constants (starting capital, towing penalty, etc.)
- Game configuration types (player, company, game state)

## Spec References

- Ports section: ~30 ports with full attributes
- Ship Specification Sheet: all ship stats
- Financial System: all cost/revenue mechanics
- Cargo Types: 9 cargo categories
- Ship Management: all ship stats

## Technical Approach

### Implementation Steps

1. **Phase 1**: Define TypeScript interfaces/types for Port, Ship, Cargo, Player, Company, GameState
2. **Phase 2**: Create static data files with all 30 ports and their attributes
3. **Phase 3**: Create ship catalog with varied vessels (at least 8-10 ships across price range $1M-$60M)
4. **Phase 4**: Define game constants (financial, time system)

### Files to Create
- `src/data/types.ts` — All TypeScript interfaces
- `src/data/ports.ts` — Port data with coordinates, attributes
- `src/data/ships.ts` — Ship catalog
- `src/data/cargo.ts` — Cargo types and related data
- `src/data/constants.ts` — Game constants (financial, time)

### Files to Modify
- None

### Dependencies
- **External**: None
- **Internal**: Task 001 (project scaffolding)

### Risks & Considerations
- Port coordinates need to be roughly accurate for world map placement
- Ship stats should be balanced for gameplay (not just copied from original)
- Keep data immutable/readonly

## Acceptance Criteria

- [x] TypeScript interfaces defined for Port, Ship, CargoType, Player, Company, GameState
- [x] All 30 ports defined with coordinates, country, population, languages, ship count, cargo capacity, available cargo types
- [x] Ship catalog with 8-10 ships spanning $1M-$60M price range with full stats
- [x] All 9 cargo types defined
- [x] Financial constants defined (starting capital, towing cost, etc.)
- [x] All files compile without TypeScript errors

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
