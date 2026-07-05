---
description: Preview then ship one P0/P1 backlog or assessment item, rescore, or run a fresh assessment
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

Also check §17 **Promoted to V1 (owner decision, standing)** for owner-authorized items that may not yet have a TB row or may override Tier 3 holds.

Pick the **next** item that:

1. Is in **Tier 1 — Must Fix** or **Tier 2 — High Leverage** (not Tier 3 Hold), **or** appears in **Promoted to V1** as active engineering (not already closed),
2. Is **engineering / Cursor-actionable** (has or implies code, tests, CI, or in-app/docs guard),
3. Is **not** already shipped (verify against repo + `TECH_BACKLOG.md`),
4. Passes the guardrails above.

If §17 says no Tier 1/2 engineering items remain and no open Promoted-to-V1 row is unshipped, fall through to step 4 (general backlog) — do **not** force an assessment-only item.

Map assessment IDs to backlog when present (e.g. **TB-600**). Prefer implementing via the `TECH_BACKLOG.md` row when both exist.

---

## Step 0 — Preview proposed action (required first)

**Before** editing any file, running verification, committing, or pushing, walk the same identification order as `.cursor/commands/show-next-improvement.md` (steps 1–4 preview logic) and **display the preview in chat**.

1. Walk steps 1–4 in order; **stop at the first step that yields a candidate** (same selection rules as `/show-next-improvement`).
2. Read the `## TB-###` detail section when present.
3. Run blocker checks (read-only):
   - **`git status --short`** on likely target paths — if dirty per `Agent-Working-Tree-Safety.mdc`, mark **blocked** and name paths.
   - **Dependencies** — open `depends on TB-###` rows block until the dependency is closed.
   - **Validation-first** — live pilot / owner execution / GTM-only items are **not Cursor-shippable**; skip to the next candidate in the same band, or fall through to the next step if none remain.
4. **Print the preview block** (format below) under the heading **## Proposed next improvement** — this is what `/show-next-improvement` would show for the same repo state.
5. Optionally list **2–3 runners-up** in one line each.
6. **Proceed or stop:**
   - **Blocked** (dirty target paths, open dependency, or not Cursor-shippable with no alternate candidate) → **stop after the preview**; do not implement. Tell the user how to unblock (commit/stash, close dependency, or `ARCHLUCID_AGENT_ALLOW_DIRTY=1` only when they explicitly override).
   - **Ready** → continue to the matching implementation step below (Step 1–4) for **that same candidate** — do not re-scan and pick a different item.

If steps 1–4 preview finds **no** engineering candidate, print the preview block with **Step: 5 (nothing found)** and add:

**Next ship action:** this run will continue to **Step 6 — Fresh assessment**.

Then go to **Step 6** (do not implement).

### Preview block format (required output)

```markdown
## Proposed next improvement

**Step:** 1 | 2 | 3 | 4 | 5 (nothing found) | 6 (fresh assessment)
**Candidate:** TB-### — <title> (or assessment §17 title if no TB yet)
**Priority:** P0 | P1 | P2 | P3 | Tier 1 | Tier 2 | Promoted V1
**Why this one:** <one sentence — first open row in band per backlog/assessment order>
**Blockers:** None | <list>
**Likely touch surfaces:** <paths or subsystems, if inferable from TB detail>
**Next:** Implement this item in this run (targets `master` by default).
```

For **Step 5 / Step 6** preview only, set **Next:** to `Run fresh assessment (Step 6).`

---

## Workflow (strict order)

Implementation steps **reuse the candidate from Step 0** — do not pick a different item mid-run.

### Step 1 — P0 technical backlog

If Step 0 selected a **P0** candidate from `TECH_BACKLOG.md`:

1. Implement it completely with tests/verification appropriate to scope.
2. Run the **Quality gate** (below).
3. Mark **Done** in `TECH_BACKLOG.md` (title column + `Updated:` line at top with closure summary).
4. Commit and push to **`master`** (or user-named branch).
5. Run the **CI gate** (below).
6. Go to **Step 5**.

Otherwise → **Step 2**.

### Step 2 — P1 technical backlog

If Step 0 selected a **P1** candidate from `TECH_BACKLOG.md`:

1. Implement, run the **Quality gate** (below), mark Done in `TECH_BACKLOG.md`, commit, push to **`master`**.
2. Run the **CI gate** (below).
3. Go to **Step 5**.

Otherwise → **Step 3**.

### Step 3 — Next Cursor-actionable assessment item

If Step 0 selected a **Tier 1/2 or Promoted-to-V1** assessment candidate:

1. Implement it.
2. Run the **Quality gate** (below).
3. Mark Done in `TECH_BACKLOG.md` when a TB-ID exists; update `LATEST_GPT55.md` §17 to acknowledge closure (move to shipped pointer — do not leave as open Tier entry).
4. Commit, push to **`master`**.
5. Run the **CI gate** (below).
6. Go to **Step 5**.

Otherwise → **Step 4**.

### Step 4 — Next open backlog item (any priority)

If Step 0 selected a **P2/P3 or unlabeled** backlog candidate:

1. Implement the first open row.
2. Run the **Quality gate** (below).
3. Mark Done in `TECH_BACKLOG.md`, commit, push to **`master`**.
4. Run the **CI gate** (below).
5. Go to **Step 5**.

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

## Quality gate (after coding, before commit)

Run in this order once the candidate is implemented. Fix issues from each step before moving to the next — don't stack unresolved findings.

1. **`/check-compiler-errors`** — run scoped compile/type-check (`.\scripts\ci\agent-compile-check.ps1` with the right `-ProjectPath` / `-Ui`, or targeted `dotnet test` / `npm run test` for touched areas). Fix failures before continuing.
2. **`/deslop`** — check the diff against `master` and remove AI-generated slop (unnecessary comments, abnormal defensive try/catch, `any` casts, unneeded nesting) before it goes to review.
3. **`/review-bugbot`** — launch the Bugbot subagent (`Diff: uncommitted changes`, since this is pre-commit) against the diff. Fix Critical/High findings; note but don't block on style-only comments.
4. **`/review-security`** — launch the Security Review subagent (`Diff: uncommitted changes`) against the same diff. Fix Critical/High findings before proceeding.
5. If step 2, 3, or 4 changed code, re-run **`/check-compiler-errors`** once more to confirm the fixes still compile/pass.

---

## CI gate (after push)

Run **`/fix-ci`** right after the push in Steps 1–4, before moving on to Step 5/6:

1. If the push opened or updated a PR, follow `/fix-ci`: inspect `gh pr checks`, fix the first actionable failure, push, repeat until green.
2. If this pushed directly to `master` with no open PR, check the run for that commit instead (`gh run list --branch master --limit 1`, then `gh run view --log-failed` on it) and apply the same fix-one-failure-at-a-time loop.
3. Do not proceed to Step 5/6 with known-red CI for this change.

---

## Commit message style

Use one concise sentence focused on **why**, referencing the TB-ID when applicable, e.g.:

`TB-604: fail closed on retrieval chunk upsert tenant mismatch.`

---

## Report back

Always end with:

- The **## Proposed next improvement** preview block (repeat or reference what was shown at Step 0)
- Which implementation step (1–6) ran, or **stopped at preview** if blocked
- TB-ID / assessment title (if any)
- **Quality gate:** findings from compiler check, deslop, Bugbot, and security review, and what was fixed
- Commit SHA(s) and branch pushed (if implementation occurred)
- **CI gate:** final CI status for the push (green, or fixes applied via `/fix-ci`)
- Rescore summary (step 5) **or** new assessment headline (step 6) **or** explicit blocker reason when stopped after preview

If the user did **not** name a branch in this message, remind them in ALL CAPS:

**CHOOSE A BRANCH TO COMMIT AND PUSH THIS WORK TO.**

(Skip that reminder when this command explicitly targets `master` or the user named a branch.)
