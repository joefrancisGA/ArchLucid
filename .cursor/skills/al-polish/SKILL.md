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
| 3 — Pull request | Parent | One pull request against `master` for the files Luna changed |

Both slugs need an allowlist `ok` or `yes` in the current conversation before either subagent starts. The parent does not write the suggestions or the code. Luna does not commit. After implementation, the parent opens the pull request. `--suggest-only` does not.
