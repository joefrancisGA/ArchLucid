---
description: Ship one P0/P1 backlog or assessment item, rescore, or run a fresh assessment
---

# Ship next improvement (single pass)

Run this workflow **once per invocation**. Execute **at most one** implementation from steps 1–4, then steps 5–6 as applicable. Do **not** batch multiple backlog items in one run unless the user explicitly asks.

**Default git target:** `master` (user may override by naming another branch in the same message).

---

## Guardrails (read first)

- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before editing tracked files.
- Follow `.cursor/rules/shell-hygiene.mdc` and `.cursor/rules/shell-heartbeat.mdc` for shells.
- Stage **only** paths you changed for this task; never `git add -A` on a dirty tree.
- **Never** implement or re-prompt assessment improvements **#23** (TB-135 SOC 2 CPA) or **#25** (TB-136 third-party pen test) — V1.1 backlog per `.cursor/rules/V1_1-assurance-backlog.mdc`.
- **Never** implement GTM assessment items **#2, #3, #5, #6** (M-90, M-44, M-91, M-92) per `.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`.
- Skip items prefixed **DEFERRED**, marked **Hold for reassessment**, **V2**, or requiring owner/customer/live-pilot action only.
- Skip items that are docs-only market validation, outreach, or human-led cohort work unless the user explicitly requests them.

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

When multiple open rows share the same priority band, pick the **first** in file order (top of backlog = higher priority per `TECH_BACKLOG.md` guidance).

Optional cross-check: `docs/library/TECH_BACKLOG_OPEN.md` (may be stale — prefer live grep on `TECH_BACKLOG.md`).

---

## How to detect assessment-implementable items

**Source of truth:** `docs/assessments/LATEST_GPT55.md` §17 **Top Improvement Opportunities**.

Pick the **next** item that:

1. Is in **Tier 1 — Must Fix** or **Tier 2 — High Leverage** (not Tier 3 Hold),
2. Is **engineering / Cursor-actionable** (has or implies code, tests, CI, or in-app/docs guard),
3. Is **not** already shipped (verify against repo + `TECH_BACKLOG.md`),
4. Passes the guardrails above.

If §17 says no Tier 2 items remain, fall through to step 4 (general backlog) — do **not** force an assessment-only item.

Map assessment IDs to backlog when present (e.g. **TB-600**). Prefer implementing via the `TECH_BACKLOG.md` row when both exist.

---

## Workflow (strict order)

### Step 1 — P0 technical backlog

If **any open P0** row exists in `TECH_BACKLOG.md`:

1. Select the **first** open P0 row (file order).
2. Implement it completely with tests/verification appropriate to scope.
3. Mark **Done** in `TECH_BACKLOG.md` (title column + `Updated:` line at top with closure summary).
4. Commit and push to **`master`** (or user-named branch).
5. Go to **Step 5**.

Otherwise → **Step 2**.

### Step 2 — P1 technical backlog

If **any open P1** row exists in `TECH_BACKLOG.md`:

1. Select the **first** open P1 row.
2. Implement, mark Done in `TECH_BACKLOG.md`, commit, push to **`master`**.
3. Go to **Step 5**.

Otherwise → **Step 3**.

### Step 3 — Next Cursor-actionable assessment item

If §17 of `LATEST_GPT55.md` has an implementable Tier 1/2 engineering item:

1. Implement it.
2. Mark Done in `TECH_BACKLOG.md` when a TB-ID exists; update `LATEST_GPT55.md` §17 to acknowledge closure (move to shipped pointer — do not leave as open Tier entry).
3. Commit, push to **`master`**.
4. Go to **Step 5**.

Otherwise → **Step 4**.

### Step 4 — Next open backlog item (any priority)

If **any** open backlog row remains (P2, P3, or unlabeled), in **file priority order**:

1. Implement the first open row.
2. Mark Done in `TECH_BACKLOG.md`, commit, push to **`master`**.
3. Go to **Step 5**.

Otherwise → **Step 6**.

### Step 5 — Rescore (only if steps 1–4 shipped something)

Update `docs/assessments/LATEST_GPT55.md` in place:

1. Prepend a **Rescore (YYYY-MM-DD):** line to the pass-date header describing what closed and which pillars moved.
2. Apply score deltas using the **§2 Scorecard** methodology already used in that file (increment affected pillar scores; recalculate **(A) Headline readiness** from weighted contributions).
3. Update §7, §8, §14, §17, and other sections that still list the item as open.
4. Commit and push the assessment update to **`master`** (same branch as implementation, or a follow-up commit).
5. **Display the rescoring in chat:** show before/after headline %, changed pillar scores, and one-line rationale.

### Step 6 — Fresh assessment (only if steps 1–4 did nothing)

If **no** implementation occurred in steps 1–4:

1. Print exactly these three lines (markdown bold), each on its own line:

**CREATING NEW ASSESSMENT**

**CREATING NEW ASSESSMENT**

**CREATING NEW ASSESSMENT**

2. Run a **clean-slate** assessment using `docs/assessments/ASSESSMENT_PROMPT_V3.MD` (not v2 `assessment.md`).
3. **Overwrite** `docs/assessments/LATEST_GPT55.md` in place (archive prior snapshot under `docs/archive/assessments/` only if the file is materially large and you need history).
4. Apply the verify-before-listing gate from v3 — do not replay already-shipped TB rows as open §17 items.
5. Commit and push the new assessment to **`master`**.
6. Display the new **(A) Headline readiness** % and top 3 weighted deficiencies in chat.

---

## Verification (after any implementation)

- Run scoped compile/tests appropriate to the change (`.\scripts\ci\agent-compile-check.ps1` with the right `-ProjectPath` / `-Ui`, or targeted `dotnet test` / `npm run test` for touched areas).
- Fix failures before commit.

---

## Commit message style

Use one concise sentence focused on **why**, referencing the TB-ID when applicable, e.g.:

`TB-604: fail closed on retrieval chunk upsert tenant mismatch.`

---

## Report back

Always end with:

- Which step (1–6) ran
- TB-ID / assessment title (if any)
- Commit SHA(s) and branch pushed
- Rescore summary (step 5) **or** new assessment headline (step 6) **or** explicit “no open P0/P1/backlog/assessment work found” before step 6

If the user did **not** name a branch in this message, remind them in ALL CAPS:

**CHOOSE A BRANCH TO COMMIT AND PUSH THIS WORK TO.**

(Skip that reminder when this command explicitly targets `master` or the user named a branch.)
