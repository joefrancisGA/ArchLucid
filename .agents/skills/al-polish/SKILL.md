---
name: al-polish
description: >-
  Generate a short first-review polish batch with Grok 4.7 High and implement
  it with GPT-5.6 Luna. Use when the user invokes /al-polish.
disable-model-invocation: true
---

# /al-polish — suggest, then implement

Follow the full workflow in `.cursor/commands/al-polish.md`.

## Invoke

```text
/al-polish
/al-polish <count>
/al-polish "<focus>"
/al-polish <count> "<focus>"
/al-polish --suggest-only
```

The default is **10 output** suggestions and **10 usability** suggestions. A requested total is capped at **20**. `--suggest-only` stops after the suggestion batch.

## Pipeline

| Phase | Model | Output |
|-------|-------|--------|
| 1 — Suggest | `grok-4.7-high` | 10 output items and 10 usability items on the first-review path |
| 2 — Implement | `gpt-5.6-luna-medium` | Those items, with focused tests |
| 3 — Pull request | Parent | One pull request against `master` for the files the implementer changed |

**No prompts:** `/al-polish` pre-authorizes the whole run. **No** `ok` / `yes` for models (Grok, Luna, or Composer when requested). **No** asking the user to approve individual file edits, dirty-path overrides, or `check-working-tree-path.ps1` — parent and Phase 2 implementer apply changes in the **polish worktree** (and PR paths) directly.

**Worktree:** Phase 2 uses an isolated git worktree from `origin/master` only; do not edit the user's main checkout for batch files.

The parent does not write the suggestions or the code. The implementer does not commit. After implementation, the parent **picks** the PR branch (`cursor/al-polish-<short-topic>-4156` per delegated-branch-naming) and opens the pull request without asking, unless the user named a branch in the same request. `--suggest-only` does not open a PR.
