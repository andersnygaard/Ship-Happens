# Feature: Sound Effects & Audio

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: Low
**Labels**: audio, polish
**Estimated Effort**: Medium

## Context & Motivation

Sound adds atmosphere and feedback. Ocean ambiance, ship horns, UI clicks, and weather sounds enhance the experience.

## Current State

No audio system exists.

## Desired Outcome

- Simple Web Audio API-based sound system
- Procedurally generated sounds (no external audio files needed):
  - Ocean ambiance (white noise filtered to sound like waves)
  - Ship horn (low frequency oscillator)
  - UI click sounds (short click)
  - Storm wind (filtered noise)
  - Coin/money sound for financial transactions
  - Success/failure chimes for minigame
- Volume control
- Mute toggle

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create AudioSystem with Web Audio API
2. **Phase 2**: Generate procedural sounds (oscillators + noise)
3. **Phase 3**: Add sound triggers to game actions
4. **Phase 4**: Add volume/mute controls to UI

### Files to Create
- src/audio/AudioSystem.ts — Sound system
- src/audio/SoundGenerator.ts — Procedural sound generation

### Files to Modify
- src/main.ts — Initialize audio system
- src/ui/screens/WorldMapScreen.ts — Add mute button
- Various screens — Add sound triggers

### Dependencies
- **Internal**: None

## Acceptance Criteria

- [x] Audio system initializes with Web Audio API
- [x] Ocean ambiance plays during gameplay
- [x] Ship horn sound available on departure
- [x] UI click sounds on button interactions
- [x] Storm sounds during weather events
- [x] Volume control and mute toggle accessible
- [x] TypeScript compiles without errors

---

**Next Steps**: Ready for implementation.
