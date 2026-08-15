---
description: List all Cursor-shippable backlog/assessment improvements in ship-next priority order (read-only)
---

# Show all improvements (read-only ranked queue)

Run this workflow **once per invocation**. Build the **full ordered queue** of Cursor-shippable candidates that `/ship-next-improvement` would walk (steps 1–4), then **stop**. Do **not** implement, edit tracked files, commit, push, rescore, or run a fresh assessment.

This command uses the **same prioritization and guardrails** as `.cursor/commands/show-next-improvement.md` and `.cursor/commands/ship-next-improvement.md`, but **does not stop at the first candidate** — it lists every remaining shippable item in the order `/ship-next-improvement` would pick them across successive runs (assuming earlier items stay open until shipped).

`/show-next-improvement` is the single-item preview; this command is the full queue.

---

## Guardrails (read first)

Same exclusions as `/ship-next-improvement`:

- **Never** surface GTM assessment items **#2, #3, #5, #6** (M-90, M-44, M-91, M-92) per `.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`.
- Skip items prefixed **DEFERRED**, marked **Hold for reassessment**, **V2**, or requiring owner/customer/live-pilot action only.
- Skip items that are docs-only market validation, outreach, or human-led cohort work unless the user explicitly asks to see them.

Items skipped by guardrails may be summarized in a short **Excluded / not Cursor-shippable** footnote (counts + 1-line examples), not interleaved into the main ranked queue.

---

## How to detect open backlog rows

**Source of truth:** `docs/library/TECH_BACKLOG.md` (summary table near the top, then per-ID sections).

A row is **open** when it:

- Matches `| TB-### |` in the summary table, **and**
- Does **not** contain `**Done**`, `Done 20`, `~~`, or strikethrough closure markers in the title column, **and**
- Is not listed under **Recently closed** / **Done** prose blocks for that ID.

**Priority markers** (any of these count):

- `P0`, `P0 —`, `P0 **`, `security-critical (P0)`, `Trustworthiness P0`, `Correctness P0`, `Data consistency P0`, `Adoption friction P0`, etc.
- Same pattern for **P1**, **P2**, **P3**.

Within a band, keep **file order** (top of backlog = higher priority per `TECH_BACKLOG.md`).

Optional cross-check: `docs/library/TECH_BACKLOG_OPEN.md` (may be stale — prefer live grep on `TECH_BACKLOG.md`).

---

## How to detect assessment-implementable items

**Primary source of truth:** `docs/assessments/LATEST_GPT55.md` §17 **Top Improvement Opportunities**.

Also check §17 **Promoted to V1 (owner decision, standing)** for owner-authorized items that may not yet have a TB row or may override Tier 3 holds.

**Secondary source of truth:** `docs/assessments/LATEST_EXPOSURE.md` §20 **Top Improvement Opportunities**. Include exposure Tier 1/2/3 engineering items **only when** they are Cursor-actionable and not already represented by a `TECH_BACKLOG.md` row or a `LATEST_GPT55.md` §17 Promoted/Tier item already listed.

Include an assessment item when it:

1. Is in `LATEST_GPT55.md` §17 **Tier 1 — Must Fix** or **Tier 2 — High Leverage** (not Tier 3 Hold), **or** appears in **Promoted to V1** as active engineering (not already closed); **or** is in `LATEST_EXPOSURE.md` §20 **Tier 1**, **Tier 2**, or **Tier 3** (not Tier 4 Defer),
2. Is **engineering / Cursor-actionable** (has or implies code, tests, CI, or in-app/docs guard),
3. Is **not** already shipped (verify against repo + `TECH_BACKLOG.md`),
4. Passes the guardrails above.

Map assessment IDs to backlog when present (e.g. **TB-600**). Prefer the `TECH_BACKLOG.md` row when both exist (**dedupe** — list the TB row once, do not duplicate the assessment title).

Validation-first / GTM-only Tier 1–2 rows belong in the **Excluded** footnote, not the main queue.

---

## Workflow (strict order — read-only, collect all)

Walk bands **1 → 4** below. **Append every qualifying candidate** in band order (do **not** stop after the first). Deduplicate by TB ID or stable assessment title.

### Band 1 — Open P0 technical backlog

All open P0 rows in `TECH_BACKLOG.md`, file order.

### Band 2 — Open P1 technical backlog

All open P1 rows in `TECH_BACKLOG.md`, file order.

### Band 3 — Cursor-actionable assessment items

In this sub-order (all that qualify, not just the first):

1. `LATEST_GPT55.md` §17 Tier 1 engineering items (skip validation-first)
2. `LATEST_GPT55.md` §17 Tier 2 engineering items (skip validation-first)
3. `LATEST_GPT55.md` §17 **Promoted to V1** active engineering rows (not closed)
4. `LATEST_EXPOSURE.md` §20 Tier 1 → Tier 2 → Tier 3 engineering items not already listed

### Band 4 — Remaining open backlog (P2, P3, unlabeled)

All remaining open summary-table rows that pass guardrails (not V2 / DEFERRED / validation-only), **file order**.

Do **not** list closed rows. Do **not** invent phantom IDs from stale `TECH_BACKLOG_OPEN.md` clusters.

### Empty queue

If bands 1–4 yield **zero** Cursor-shippable candidates, report that `/ship-next-improvement` would fall through to **Step 6 — Queue exhausted** (stop; no assessment). Mention **`--refresh-assessment`** for an opt-in **Step 7** fresh assessment. Do **not** run either step from this read-only command.

---

## Blocker checks (lightweight)

For each listed item, note blockers briefly when obvious from the TB/assessment text or a single read-only `git status`:

1. **Dependencies** — open `depends on TB-###`
2. **Validation-first** — should have been excluded; if discovered mid-pass, move to Excluded footnote
3. **Working-tree** — only flag when likely target paths are dirty; do not deep-diff every row
4. **Needs TB** — assessment Promoted items without a summary-table row

Prefer a one-word/status token per row (`ready` | `blocked` | `needs-TB` | `gated`) over long prose.

---

## Allowed tools

- **Read**, **Grep**, **Glob**, **SemanticSearch** — primary inspection.
- **Shell** — at most **one** chained read-only invocation if needed: `git status --short; git diff --stat` (no build, test, commit, or push).
- **Do not** use **Write**, **StrReplace**, **Delete**, or task subagents that modify files.

---

## Report format

Lead with a short summary, then the ranked table. Keep the table scannable.

```markdown
## Show all improvements

**Queue size:** N Cursor-shippable candidates
**Next (rank 1):** TB-### — <title> (or assessment title) — same pick as `/show-next-improvement`
**Ship command:** Run `/ship-next-improvement` to implement rank 1 (targets `master` by default).

| Rank | Band | ID / source | Title | Priority | Status | Notes |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | 1 P0 | TB-### | … | P0 | ready \| blocked \| needs-TB \| gated | short |
| 2 | 2 P1 | TB-### | … | P1 | … | … |
| … | 3 assessment | Promoted V1 / §17 / §20 | … | Promoted V1 \| Tier … | … | … |
| … | 4 backlog | TB-### | … | P2 \| P3 | … | … |
```

**Band legend:** `1 P0` → `2 P1` → `3 assessment` → `4 backlog` (matches `/ship-next-improvement` steps 1–4).

If the queue is empty:

```markdown
## Show all improvements

**Queue size:** 0
**Next ship action:** `/ship-next-improvement` would **stop** (Step 6 — queue exhausted). Use `/ship-next-improvement --refresh-assessment` for a one-off reassessment.
```

### Optional footnote (keep short)

```markdown
### Excluded / not Cursor-shippable (not in queue)

- Validation-first / GTM / owner-only: <count> (e.g. G-REAL-06, M-07…)
- V2 / DEFERRED / Hold: <count> (e.g. TB-398, TB-686…)
```

Do **not** paste full TB detail sections. Link by ID only. Cap Notes to roughly one short clause.

If the open P2/P3 tail is very long (>40 Band-4 rows), list **all Band 1–3** fully, then Band 4 in full unless the user asked for a summary — default is **full Band 4**. Prefer Grep/table extraction over narrating every row in prose.

---

## Explicit non-goals

- Do **not** implement, commit, push, or update `TECH_BACKLOG.md` / `LATEST_GPT55.md` / `LATEST_EXPOSURE.md`.
- Do **not** run compile, test, or assessment generation.
- Do **not** ask which branch to commit to (no commit will occur).
- Do **not** re-rank by personal judgment — file order + assessment order only.
