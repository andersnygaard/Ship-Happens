---
name: start-working
description: Autonomously execute ALL tasks from the backlog until complete. Runs in a continuous loop - picks task, implements via subagent, moves to done, repeats. No user prompts between tasks. Follows task-board workflow (backlog -> in-progress -> done).
---

# Start Working Skill

This skill **autonomously executes ALL tasks** from the task board until the backlog is empty. It runs in a continuous loop without stopping between tasks.

**Task Board Flow**: `.task-board/backlog/` -> `.task-board/in-progress/` -> `.task-board/done/`

---

## CRITICAL RULES

### 1. USE THE TASK BOARD SYSTEM
**ALL work flows through `.task-board/`** -- non-negotiable.
- Tasks live in: `backlog/` -> `in-progress/` -> `done/`
- **NEVER work on something not tracked in the task board**
- Update task files with progress as you work

### 2. NEVER USE GIT COMMANDS
**ABSOLUTELY NO git commands** -- not by the main agent, not by subagents.
- No `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git branch`, etc.
- No `git status`, `git diff`, `git log` (even read-only commands)
- The user handles all git operations manually.

### 3. USE SUBAGENTS FOR EACH TASK
Each task MUST be executed using the **Agent tool** with a subagent:
- **Default model: `opus`** -- capable and thorough
- **Use `sonnet` for**: Simpler tasks like boilerplate, data entry, straightforward implementations
- **ALWAYS include project context** in subagent prompts

### 4. TASKS ARE DONE IN ORDER
Tasks are numbered for dependency reasons. Execute them **sequentially, in order**:
- Pick task 001 -> Complete -> Pick task 002 -> Complete -> Pick task 003...
- **NEVER skip ahead** unless user explicitly requests it
- **NEVER run tasks in parallel**

### 5. VERIFY THE IMPLEMENTATION
Every task MUST be verified before marking complete:
- Check that the app builds/runs without errors
- Verify acceptance criteria are met
- **Tasks that don't work are INCOMPLETE.**

### 6. ALWAYS PREFER TOOLS OVER BASH
Subagents MUST use built-in tools instead of bash equivalents.

| NEVER USE | ALWAYS USE |
|-----------|------------|
| `cat`, `head`, `tail` | **Read** tool |
| `echo >`, `cat <<EOF` | **Write** tool |
| `sed`, `awk` | **Edit** tool |
| `find`, `ls` (for search) | **Glob** tool |
| `grep`, `rg` | **Grep** tool |

---

## When to Use This Skill

Use when the user says:
- "Start working" / "Start implementing"
- "Continue work" / "Keep going"
- "Pick up the next task"
- `/start-working`

## The Workflow

### Step 1: Check Backlog

Read all files in `.task-board/backlog/` and `.task-board/in-progress/` to see what's available.

**If backlog is empty**: Ask if the user wants to run `/create-tasks` first.

### Step 2: Select Next Task

Pick the **lowest numbered task** from the backlog (unless blocked by dependencies).

### Step 3: Move to In-Progress

Move the task file from `.task-board/backlog/` to `.task-board/in-progress/`.

**Important**: Limit in-progress to **1 task**. If in-progress already has a task, complete it first or ask the user.

### Step 4: Read the Task File

Understand the full task:
- Context & Motivation
- Acceptance Criteria (checkboxes to complete)
- Technical Approach
- Dependencies and risks

### Step 5: Clarify Uncertainties

**STOP and ask the user if**:
- The task is ambiguous
- Multiple approaches are possible
- Dependencies are unclear
- Scope seems too large

### Step 6: Spawn Subagent to Implement

Use the **Agent tool** to spawn a subagent for the task:

```
Agent tool:
  subagent_type: "general-purpose"
  model: "opus" (default) or "sonnet" (for simple tasks)
  description: "Short 3-5 word summary"
  prompt: <detailed instructions - see Subagent Prompt Template below>
```

### Step 7: Verify Completion

After subagent returns, verify:
1. All acceptance criteria checked off in the task file
2. The implementation works (build, run, or manual check)
3. Code follows project conventions

### Step 8: Complete and Move to Done

1. **Update Resolution section** in the task file with implementation summary
2. **Move file** from `.task-board/in-progress/` to `.task-board/done/`
3. **IMMEDIATELY start next task** -- no waiting for user confirmation

### Step 9: Loop

Continue to the next task. **DO NOT STOP between tasks.** Continue until:
- All tasks in backlog are complete, OR
- A critical blocker prevents progress, OR
- User explicitly interrupts

---

## Subagent Prompt Template

```
Implement the task specified in:
.task-board/in-progress/{TASK-FILE}.md

Read the task file FIRST to understand all requirements.

PROJECT CONTEXT:
- This is "Ship Happens" -- a web-based shipping simulation game
- Read .docs/specs.md for the full game design specification
- Read CLAUDE.md for project instructions
- Platform: Web browser, Three.js for 3D graphics
- Language: TypeScript/JavaScript
- Code and comments in English

TECH STACK:
- Three.js for 3D rendering
- TypeScript
- Web-based (browser)
- Sprite-based aesthetics in a 3D environment

CRITICAL RESTRICTIONS:
1. Work ONLY on this task from .task-board/ -- no ad-hoc work
2. NEVER use git commands (git add, commit, push, status, diff, etc.)
3. Use Read tool (NOT cat/head/tail)
4. Use Write tool (NOT echo/cat heredoc)
5. Use Edit tool (NOT sed/awk)
6. Use Glob tool (NOT find/ls for search)
7. Use Grep tool (NOT grep/rg bash commands)
8. CHECK OFF acceptance criteria as you complete them (change [ ] to [x])

ACCEPTANCE CRITERIA: As you complete each criterion, UPDATE THE TASK FILE
to check it off: change "- [ ]" to "- [x]".

When done, verify the implementation works (build/run without errors).

Provide a summary of:
- Files created/modified
- All acceptance criteria status (checked off in task file)
- Build/run results
- Any issues encountered
```

---

## Model Selection

| Complexity | Model | Examples |
|-----------|-------|---------|
| **Complex** (default) | `opus` | Game systems, architectural decisions, Three.js rendering, complex UI |
| **Simple** | `sonnet` | Data files, boilerplate, config, straightforward implementations |

---

## Handling Edge Cases

### If Backlog is Empty
Ask the user to run `/create-tasks` or add tasks manually.

### If Top Priority is Blocked
Identify the blocker, check if the blocker task exists, and ask the user.

### If Task is Too Large
Break into sub-tasks, create new files in `backlog/`.

### If Build/Run Fails After Implementation
Fix the issues before marking complete.

---

## Success Criteria

### Per Task:
- [ ] Task comes from `.task-board/`
- [ ] NO git commands used
- [ ] Executed via subagent (Agent tool)
- [ ] Built-in tools used (no bash for file ops)
- [ ] All acceptance criteria checked off in task file
- [ ] Implementation verified
- [ ] Task file updated with Resolution
- [ ] Task moved to `.task-board/done/`

### Per Session:
- [ ] All work tracked in `.task-board/`
- [ ] Zero git commands executed
- [ ] ALL tasks processed automatically (no stopping between tasks)
- [ ] Tasks processed IN ORDER
