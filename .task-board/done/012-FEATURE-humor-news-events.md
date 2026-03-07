# Feature: Humor, News Ticker & Modern World Events

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Medium
**Labels**: humor, events, flavor
**Estimated Effort**: Medium

## Context & Motivation

"Ship Happens" differentiates from the original through humor and modern satirical elements. The spec calls for ridiculous cargo descriptions, absurd port events, satirical news headlines, and political satire affecting gameplay.

## Current State

The game has functional mechanics but lacks personality. No humor, news system, or world events exist.

## Desired Outcome

- News ticker on the world map with satirical scrolling headlines
- Funny cargo descriptions in charter contracts (not just "Machinery" but "500 tons of artisanal beard oil")
- Random port events with humor ("The mayor has declared war on seagulls")
- Modern world events affecting gameplay (trade sanctions, canal blockages, piracy)
- NPC dialog personality (sarcastic broker is already done, expand to other contexts)
- Crew complaints and funny notifications

## Spec References

- Modern Elements section: war zones, sanctions, piracy, canal blockages
- Political Satire section: world leaders, trade policies
- Humor Examples: cargo descriptions, port events, crew complaints, news ticker

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create humor/flavor text database with categories
2. **Phase 2**: Add news ticker component to world map (scrolling text at top/bottom)
3. **Phase 3**: Enhance charter system with funny cargo descriptions
4. **Phase 4**: Create world events system (affects routes, costs, availability)
5. **Phase 5**: Add random port events when arriving
6. **Phase 6**: Add crew complaint notifications during travel

### Files to Create
- src/data/humorTexts.ts — Database of funny descriptions, headlines, events
- src/ui/components/NewsTicker.ts — Scrolling news headline component
- src/game/WorldEvents.ts — World event generation and effects

### Files to Modify
- src/ui/screens/WorldMapScreen.ts — Add news ticker
- src/game/CharterSystem.ts — Funny cargo descriptions
- src/game/EventSystem.ts — Add humor events

### Dependencies
- **Internal**: Task 009 (event system), Task 005 (world map)

## Acceptance Criteria

- [x] News ticker scrolls satirical headlines on the world map
- [x] At least 30 funny news headlines in the database
- [x] Charter contracts have humorous cargo descriptions
- [x] At least 20 funny cargo descriptions
- [x] Random port events with humorous text occur on arrival
- [x] World events system can affect routes and costs
- [x] Crew complaints appear during longer voyages
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
