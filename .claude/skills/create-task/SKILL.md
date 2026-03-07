---
name: create-tasks
description: Analyzes the gap between specs and implementation, then creates exactly three prioritized task files in .task-board/backlog/. Planning only — no implementation.
---

# Create Tasks Skill

Compares `.docs/specs.md` against the current codebase and creates exactly **three** prioritized task files in `.task-board/backlog/`.

**CRITICAL CONSTRAINT**: This skill is for planning and documentation ONLY. Never implement code or modify the codebase.

## User-invocable

When the user runs `/create-tasks`

## Instructions

### Phase 1: Read the Spec

Read `.docs/specs.md` to understand the full game design specification.

### Phase 2: Survey the Implementation

1. Use Glob to discover all source files: `**/*.{ts,tsx,js,jsx,html,css,json}` (excluding `node_modules`)
2. Read key files to understand what has been built so far
3. Check `package.json` (if it exists) for project setup and dependencies

### Phase 3: Identify Gaps

Compare what the spec describes against what exists in code. Consider:
- Missing project scaffolding (package.json, build config, etc.)
- Data models missing (ports, ships, cargo types)
- Game systems not yet coded (financial, ship management, time, cargo)
- Core game flow not yet wired up
- Screens & interfaces described but not implemented
- Visual/rendering layer (Three.js setup, sprites, etc.)

### Phase 4: Determine Task Numbers

**ALWAYS scan ALL folders to find the next task number:**

1. Glob pattern: `.task-board/**/*.md`
2. Scan: `backlog/`, `in-progress/`, `done/`, AND `on-hold/`
3. Extract numbers from filenames (e.g., `003-FEATURE-xxx.md` -> 003)
4. Find highest number across ALL folders
5. Next task = highest + 1

### Phase 5: Create Exactly 3 Task Files

Prioritize by dependency order — earlier tasks should unblock later ones. Prefer foundational work (project setup, data models, core loop) before UI and polish.

Create three `.md` files in `.task-board/backlog/` using this naming convention:
`[NNN]-[TYPE]-[short-description].md`

**Type prefixes**: `FEATURE-`, `EPIC-`, `REFACTOR-`, `EXPLORE-`, `DESIGN-`

Each task file must use this template:

```markdown
# [Type]: [Short Description]

**Status**: Backlog
**Created**: [YYYY-MM-DD]
**Priority**: [High/Medium/Low]
**Labels**: [relevant labels]
**Estimated Effort**: [Simple/Medium/Complex]

## Context & Motivation

[Why this work is needed — what spec sections it addresses]

## Current State

[What exists today in the codebase]

## Desired Outcome

[What we want to achieve — specific goals from the spec]

## Spec References

[List the specific spec sections (by heading) this task covers]

## Technical Approach

### Implementation Steps

1. **Phase 1**: [Core work]
2. **Phase 2**: [Testing & verification]
3. **Phase 3**: [Polish]

### Files to Create
- [Specific file paths]

### Files to Modify
- [Specific file paths]

### Dependencies
- **External**: [npm packages needed]
- **Internal**: [Other tasks that must be completed first]

### Risks & Considerations

- [What could go wrong and how to mitigate]

## Acceptance Criteria

- [ ] [Specific, measurable criterion 1]
- [ ] [Specific, measurable criterion 2]
- [ ] [Specific, measurable criterion 3]

---

**Next Steps**: Ready for implementation. Move to `.task-board/in-progress/` when starting work.
```

### Phase 6: Present Summary

After creating the three task files, output a brief summary:
- What parts of the spec are already implemented (if any)
- What the three tasks cover and why they were chosen
- What major spec areas remain after these three tasks
- List the created file paths

## Task-Board Workflow

This skill creates plans in `backlog/`. The implementation workflow then:
1. Move file to `in-progress/` when starting work
2. Implement following the plan
3. Move to `done/` when complete
4. Use `on-hold/` for blocked tasks
