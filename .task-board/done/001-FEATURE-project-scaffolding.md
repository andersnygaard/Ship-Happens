# Feature: Project Scaffolding & Build Setup

**Status**: Backlog
**Created**: 2026-03-07
**Priority**: High
**Labels**: setup, infrastructure
**Estimated Effort**: Medium

## Context & Motivation

Before any game code can be written, we need a proper project structure with TypeScript, Three.js, and a dev server. The spec calls for a web-based browser game using Three.js for 3D graphics with sprite-based aesthetics.

## Current State

The repository contains only documentation (specs, screenshots, CLAUDE.md). No source code, package.json, or build configuration exists.

## Desired Outcome

A fully working project scaffold that:
- Compiles TypeScript
- Bundles with a modern bundler (Vite)
- Serves a dev server with hot reload
- Renders a basic Three.js scene (canvas with background color)
- Has a clean project structure ready for game development

## Spec References

- Platform & Technology section: "Web-based (browser)", "Three.js for 3D graphics"
- Visual Style: "Three.js 3D world with 2D sprite overlays"

## Technical Approach

### Implementation Steps

1. **Phase 1**: Create package.json with dependencies (three, typescript, vite)
2. **Phase 2**: Set up TypeScript config, Vite config, HTML entry point
3. **Phase 3**: Create src/main.ts with basic Three.js scene (renderer, camera, scene)
4. **Phase 4**: Verify it builds and runs

### Files to Create
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/main.ts`
- `src/types.d.ts` (if needed for asset imports)

### Files to Modify
- None (greenfield)

### Dependencies
- **External**: `three`, `@types/three`, `typescript`, `vite`
- **Internal**: None (first task)

### Risks & Considerations
- Keep Vite config minimal — no over-engineering
- Use standard Three.js setup pattern

## Acceptance Criteria

- [x] `package.json` exists with correct dependencies
- [x] `tsconfig.json` configured for modern TypeScript
- [x] `vite.config.ts` configured for Three.js project
- [x] `index.html` entry point exists
- [x] `src/main.ts` renders a basic Three.js scene (colored background, perspective camera)
- [x] `npm install && npm run dev` works without errors
- [x] `npm run build` produces a dist/ output

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
