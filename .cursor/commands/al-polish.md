---
description: Generate a short beta-path polish batch with Grok 4.7 High and implement it with GPT-5.6 Luna
---

# Polish batch (`/al-polish`)

One invocation, two models. The parent agent does not invent the suggestions and does not implement them.

| Phase | Model | Output |
|-------|-------|--------|
| **1 — Suggest** | **Grok 4.7 High** (`grok-4.7-high`) | A short, code-grounded batch |
| **2 — Implement** | **GPT-5.6 Luna** (`gpt-5.6-luna-medium`) | Those items only, plus focused tests |

This is a local `Task` handoff, the same shape as `/al-ui-rate`. Do not launch it through `/al-api`. The Cloud Agent launcher cannot select these two models.

## Arguments

```text
/al-polish
/al-polish <count>
/al-polish "<focus>"
/al-polish <count> "<focus>"
/al-polish --suggest-only
```

- **`<count>`** — total suggestions. Default **20**: **10 output** and **10 usability**. Minimum **1**. Maximum **20**. A higher number is clamped to 20.
- **`"<focus>"`** — optional surface or job, such as `diagram question answers` or `sponsor export`.
- **`--suggest-only`** — stop after Phase 1. No code changes.

With no count, ask for **10 output** suggestions and **10 usability** suggestions. With a count, split the batch in half. When that count is odd, the extra item is an output suggestion.

## Allowlist

`grok-4.7-high` and `gpt-5.6-luna-medium` are outside `.cursor/rules/Model-Allowlist-Override.mdc`.

Before Phase 1, confirm this conversation already contains **`ok`** or **`yes`** authorizing both slugs for this `/al-polish` run. If it does not, ask once and wait. Name both display names and slugs, say why this command needs them, and state that the default without approval is Composer 2.5 slow (`composer-2.5`). Do not start Phase 1 in the same turn as that question. Do not substitute Composer or Grok 4.6.

## What a suggestion is

A suggestion changes one existing surface so a reviewer cannot mistake an omitted field, a guess, or a missing link for a stored fact.

**Output** — the diagram, finding, path, question answer, or export a reviewer would forward.

**Usability** — the label, empty cell, or next action on that same path.

The first-review path is collect → diagram → findings → one question → one export. Prefer that path. Leave admin, catalog, webhook, and health-directory em dashes alone unless the focus text names that surface.

## Guardrails

- Do not hide review workspace tabs.
- Do not add a score, a percentage, or a new metric.
- Do not invent a relationship, an owner, a path, or a resource.
- Do not call an Azure write API.
- Do not open a new product surface.
- Luna does not commit or push. After Phase 2, the parent opens one pull request against `master` for the files Luna changed. `--suggest-only` does not open a pull request.
- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before Luna edits a tracked file. A blocked dirty path is skipped, not overwritten.
- Follow `.cursor/rules/shell-hygiene.mdc` and `.cursor/rules/shell-heartbeat.mdc` for every shell.

## Workflow

### Step 0 — Parse

1. Read the count, the focus text, and `--suggest-only`.
2. When no count is given, use **10 output** and **10 usability**. Otherwise clamp the total to 1–20, split it in half, and give any odd extra to output. Say both numbers before Phase 1.
3. Complete the allowlist check above.

### Phase 1 — Suggest (Grok 4.7 High)

Launch **one** `Task` subagent:

| Setting | Value |
|---------|-------|
| `subagent_type` | `generalPurpose` |
| `model` | `grok-4.7-high` |
| `run_in_background` | `false` |
| `description` | `Polish suggestions (Grok 4.7)` |

The prompt must include the count, the split, the focus text, the first-review preference, and the guardrails. Tell Grok to read the current code and skip a suggestion whose sentence is already on the surface.

Each suggestion uses this shape:

| Field | Content |
|-------|---------|
| **Id** | `P-01` upward |
| **Kind** | `output` or `usability` |
| **Surface** | The screen or artifact |
| **Current** | The sentence or blank a reviewer sees now |
| **Change** | The sentence or behavior to ship |
| **Files** | Existing paths |
| **Acceptance** | What a test or the screen shows when done |

Print the batch in chat before Phase 2. Stop here when `--suggest-only` was set or the batch is empty.

### Phase 2 — Implement (GPT-5.6 Luna)

Launch **one** `Task` subagent:

| Setting | Value |
|---------|-------|
| `subagent_type` | `generalPurpose` |
| `model` | `gpt-5.6-luna-medium` |
| `run_in_background` | `false` |
| `description` | `Implement polish batch (Luna)` |

Pass the batch verbatim. Luna implements every item that stays inside the guardrails. An item that needs a new API, a new relationship, or a dirty blocked path is **skipped** with a one-line reason.

Luna updates or adds the focused test for each shipped item and runs those tests. One scoped UI typecheck is allowed when the edits are in `archlucid-ui`. Luna does not commit.

### Step 3 — Report

The parent checks `git status --short` and `git diff --stat` against Luna's file list. Then report:

| Field | Value |
|-------|-------|
| Suggested | Count from Phase 1 |
| Shipped | Count Luna implemented |
| Skipped | Id and reason |
| Tests | Command and result |
| Diff | Paths Luna changed |

### Step 4 — Pull request against master

When at least one item shipped, open a pull request. Skip this step when `--suggest-only` was set, the batch is empty, or Luna shipped nothing.

1. Fetch `origin/master`.
2. Ask the user to reply with the exact branch name `cursor/al-polish-<short-topic>`, and wait for that reply before creating it from `origin/master` or running any branch-switch, commit, or push command. Do not commit on `master`.
3. Stage only the files Luna changed for this batch. Leave unrelated dirty and untracked files unstaged, including SQL, package zips, and `next-env.d.ts` when those were already dirty and were not in Luna's file list.
4. Commit only Luna's paths with `git commit --only -- <Luna-file-list>` so any unrelated paths staged before this run remain outside the commit. The message says why a reviewer was seeing a guessed or blank value.
5. Push with an explicit refspec: `git push -u origin HEAD:cursor/al-polish-<short-topic>`. Do not push that commit to `master`. Do not force-push.
6. Open the pull request with base `master` and that branch as the head.

Add the pull request URL to the report.
