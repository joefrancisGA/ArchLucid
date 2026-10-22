---
description: Preview which backlog or assessment item ship-next-improvement would pick next (read-only)
---

# Show next improvement (read-only preview)

Run this workflow **once per invocation**. Identify **at most one** candidate that `/ship-next-improvement` would implement in steps 1–4, then **stop**. Do **not** implement, edit tracked files, commit, push, rescore, or run a fresh assessment.

This command mirrors the prioritization order in `.cursor/commands/ship-next-improvement.md` but is **inspection-only**. `/ship-next-improvement` prints the same preview block (as **## Proposed next improvement**) at **Step 0** before it implements.

---

## Guardrails (read first)

Same exclusions as `/ship-next-improvement`:

- **Never** surface GTM assessment items **#2, #3, #5, #6** (M-90, M-44, M-91, M-92) per `.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`.
- Skip items prefixed **DEFERRED**, marked **Hold for reassessment**, **V2**, or requiring owner/customer/live-pilot action only.
- Skip items that are docs-only market validation, outreach, or human-led cohort work unless the user explicitly asks to see them.

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

When multiple open rows share the same priority band, the **first** in file order is what `/ship-next-improvement` would pick. In `TECH_BACKLOG.md`, all summary rows tagged **V2** live in the **`### V2 window`** subsection at the **bottom** of the summary table (IDs unchanged — do not renumber). File-order scans therefore park V2 last; still skip V2-tagged rows per guardrails above.

Optional cross-check: `docs/library/TECH_BACKLOG_OPEN.md` (may be stale — prefer live grep on `TECH_BACKLOG.md`).

---

## How to detect assessment-implementable items

**Primary source of truth:** `docs/assessments/LATEST_GPT55.md` §17 **Top Improvement Opportunities**.

Also check §17 **Promoted to V1 (owner decision, standing)** for owner-authorized items that may not yet have a TB row or may override Tier 3 holds.

**Secondary source of truth:** `docs/assessments/LATEST_EXPOSURE.md` §20 **Top Improvement Opportunities** (broader exposure readiness — controlled beta / public self-service / LinkedIn mention gates). Check this **only after** `LATEST_GPT55.md` §17 has no unshipped Tier 1/2/Promoted-V1 candidate.

Pick the **next** item that:

1. Is in `LATEST_GPT55.md` §17 **Tier 1 — Must Fix** or **Tier 2 — High Leverage** (not Tier 3 Hold), **or** appears in **Promoted to V1** as active engineering (not already closed); **or**, if none remain there, is in `LATEST_EXPOSURE.md` §20 **Tier 1 — Must Fix Before Controlled Beta**, **Tier 2 — Must Fix Before Public Mention**, or **Tier 3 — Must Fix Before Public Self-Service** (not Tier 4 Defer),
2. Is **engineering / Cursor-actionable** (has or implies code, tests, CI, or in-app/docs guard),
3. Is **not** already shipped (verify against repo + `TECH_BACKLOG.md`),
4. Passes the guardrails above.

If neither assessment file has an unshipped Tier 1/2/3/Promoted-V1 engineering item, fall through to step 4 (general backlog) — do **not** force an assessment-only item.

Map assessment IDs to backlog when present (e.g. **TB-600**). Prefer the `TECH_BACKLOG.md` row when both exist.

---

## Workflow (strict order — read-only)

Walk steps 1–4 in order. **Stop at the first step that yields a candidate** and report it. Do not continue to lower steps once a candidate is found.

### Step 1 — P0 technical backlog

If **any open P0** row exists in `TECH_BACKLOG.md`:

1. Select the **first** open P0 row (file order).
2. Read its `## TB-###` detail section if present.
3. Note blockers (dependencies, validation-first, working-tree conflicts on target paths).
4. **Report** and **stop** (do not implement).

Otherwise → **Step 2**.

### Step 2 — P1 technical backlog

If **any open P1** row exists in `TECH_BACKLOG.md`:

1. Select the **first** open P1 row.
2. Note blockers.
3. **Report** and **stop**.

Otherwise → **Step 3**.

### Step 3 — Next Cursor-actionable assessment item

If §17 of `LATEST_GPT55.md` has an implementable Tier 1/2 engineering item, **or** an unshipped **Promoted to V1** engineering row, **or** (only if `LATEST_GPT55.md` §17 has none) §20 of `LATEST_EXPOSURE.md` has an implementable Tier 1/2/3 engineering item:

1. Select the first such item in assessment order (`LATEST_GPT55.md` §17 Tier 1 before Tier 2 before Promoted table; then, only if none remain, `LATEST_EXPOSURE.md` §20 Tier 1 before Tier 2 before Tier 3).
2. Note blockers and whether a TB row exists or needs creation.
3. **Report** and **stop**.

Otherwise → **Step 4**.

### Step 4 — Next open backlog item (any priority)

If **any** open backlog row remains (P2, P3, or unlabeled), in **file priority order**:

1. Select the first open row.
2. Note blockers.
3. **Report** and **stop**.

Otherwise → **Step 5 (preview only)**.

### Step 5 — Nothing to ship (preview only)

If steps 1–4 found **no** candidate:

Report that `/ship-next-improvement` would fall through to **Step 6 — Queue exhausted** (stop session; no commit; kill active `/loop` wake). Do **not** run an assessment unless the user would pass **`--refresh-assessment`** (then **Step 7 — Fresh assessment**). Do **not** run either step from this read-only command.

---

## Blocker checks (report when relevant)

Before naming a candidate as "ready to ship," inspect (read-only):

1. **`git status --short`** on likely target paths — if dirty at session start per `Agent-Working-Tree-Safety.mdc`, say **blocked** and name paths.
2. **Dependencies** — if the TB row says `depends on TB-###` and that dependency is still open, say **blocked** and name the dependency.
3. **Validation-first** — if the row or assessment says live pilot / owner execution / GTM-only, classify as **not Cursor-shippable** and say why.
4. **Working-tree safety** — if implementation would touch paths already dirty from a concurrent session, recommend waiting or naming `ARCHLUCID_AGENT_ALLOW_DIRTY=1` only if the user explicitly overrides.

---

## Allowed tools

- **Read**, **Grep**, **Glob**, **SemanticSearch** — primary inspection.
- **Shell** — at most **one** chained read-only invocation if needed: `git status --short; git diff --stat` (no build, test, commit, or push).
- **Do not** use **Write**, **StrReplace**, **Delete**, or task subagents that modify files.

---

## Report format

End with a concise preview block:

```markdown
## Show next improvement

**Step:** 1 | 2 | 3 | 4 | 5 (nothing found)
**Candidate:** TB-### — <title> (or assessment §17/§20 title if no TB yet)
**Priority:** P0 | P1 | P2 | P3 | Tier 1 | Tier 2 | Tier 3 (exposure only) | Promoted V1
**Why this one:** <one sentence — first open row in band per backlog/assessment order>
**Blockers:** None | <list>
**Likely touch surfaces:** <paths or subsystems, if inferable from TB detail>
**Ship command:** Run `/ship-next-improvement` to implement (targets `master` by default).
```

If **Step 5**, add:

```markdown
**Next ship action:** `/ship-next-improvement` would **stop** (Step 6 — queue exhausted) — no open P0/P1/Tier-1/2/backlog engineering candidate found. Use `/ship-next-improvement --refresh-assessment` for a one-off reassessment.
```

Optionally list the **next 2–3** runners-up (same priority band or next band) in one line each, for user context only.

---

## Explicit non-goals

- Do **not** implement, commit, push, or update `TECH_BACKLOG.md` / `LATEST_GPT55.md` / `LATEST_EXPOSURE.md`.
- Do **not** run compile, test, or assessment generation.
- Do **not** ask which branch to commit to (no commit will occur).
