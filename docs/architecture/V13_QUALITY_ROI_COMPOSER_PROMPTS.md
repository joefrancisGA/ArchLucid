> **Scope:** Contributor-reference — copy-paste Composer prompts that raise **v13** weighted qualities at the best credit ROI per token. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) (v13, 2026-09-10, `(A)` **83.44%**, Gate 5 **FAIL**)
> **Index:** [`.cursor/prompts/v13-quality-roi-00-index.md`](../../.cursor/prompts/v13-quality-roi-00-index.md)
> **Predecessor:** [`V12_QUALITY_ROI_COMPOSER_PROMPTS.md`](V12_QUALITY_ROI_COMPOSER_PROMPTS.md) (V12-01–V12-04 — **closed**: AS-094, wave 22 on trunk, Gate 1 runbook exists)

# v13 quality-ROI Composer prompts (V13-01–V13-05)

**Created:** 2026-09-10 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v13 scored **(A) 83.44%** on `origin/master` `9231d1990f`. Gate 5 is **FAIL** (`npm run typecheck` TS2300). Remaining **token ROI** is merge hygiene plus one bounded citation pass — then **stop coding**.

**Run one prompt per chat.** Feature branch: `cursor/v13-<short-name>-97a4`. **Do not push `master`.** Default model: **Composer 2.5 slow** (`composer-2.5`).

## Score impact (why this set)

Baseline from v13 §2. Deltas are **expected scoring effects if the prompt lands cleanly on trunk**, not a ratchet to paste into the next assessment. Next pass still computes `(A)` fresh.

| Prompt | Tokens (session) | Qualities moved | Score Δ | Weighted `(A)` Δ | Gate effect |
|--------|-------------------|-----------------|--------:|------------------:|-------------|
| **V13-01** typecheck dedupe | ~0.5–1 | Runtime **68→77**, Correctness **85→86**, Time-to-Value **82→83** | +9 / +1 / +1 | **+0.85** → **84.29%** | Gate 5 **FAIL→PASS** |
| **V13-02** audit-matrix share paths | ~0 (skip) or ~0.2 | GRI **92→93**, Runtime **77→78** (after 01) | +1 / +1 | **+0.20** → **84.49%** | Pre-corset guard green. **#2829 already on trunk — skip if assert exits 0.** |
| **V13-03** leftover No-anchor (4 cells) | ~1–2 | Density **82→83**, Correctness **86→87** | +1 / +1 | **+0.25** → **84.74%** | None |
| **V13-04** `ci.yml` matrix triage | ~1–2 | Runtime **78→81** | +3 | **+0.21** → **84.95%** | Honesty, not Gate 5 |
| **V13-05** Gate 1 (owner executes) | ~0.5 Composer + owner hours | TTV **83→85**, Runtime **81→83** | +2 / +2 | **+0.34** → **85.29%** | Gate 1 **UNKNOWN→PASS** |

**Cumulative if 01–04 land and owner completes Gate 1: `(A)` ~85.3%.** Proof-of-ROI stays **76** until **G-REAL-06** (owner, not these prompts).

### Do not spend tokens on

| Temptation | Why it is poor ROI |
|-----------|-------------------|
| Another robustness Wave / SecureNow SA pack | Does not move the ten qualities; assessment §16 stop-list |
| New finding `EngineType` / DX-77 | Density 82 is held by **zero live runs**, not missing engines |
| TB-883 Graph-RAG ablation | Budget-blocked; Hold after G-REAL-06 |
| Buyer “review package” jargon sweep | Comprehension 86→87 at high string-count cost; TB-366 |
| G-REAL-06 fake Real runs | Forbidden; Proof-of-ROI 76 is a **market** gap |
| GTM M-90 / M-44 / M-91 / M-92 | Human cohorts |
| TB-135 / TB-136 | Tech Done; GTM owner only |

## Sequencing

| Prompt | Parallel? | Depends on | Qualities |
|--------|-----------|------------|-----------|
| **V13-01** | **First. Do this before anything else.** | Open **#2830** typecheck job is already green — merge master into it and land; sweep any new TS2300 from later trunk merges | Runtime, Correctness, TTV |
| **V13-02** | Skip if assert exits 0 | **#2829 MERGED** (`a5b22cc5db`). Re-run only if trunk is red again | GRI, Runtime |
| **V13-03** | After 01 (Decisioning compile) | Typecheck green optional | Density, Correctness |
| **V13-04** | After 01+02 on trunk | Typecheck + audit matrix | Runtime |
| **V13-05** | After 01 (workspace must build) | Owner staging tenant | TTV, Runtime, Gate 1 |

---

## Global constraints (paste if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant (ADR 0037). Share ACL is **inside** tenant (ADR 0087). **No SQL RLS**.
- **No new finding engine.** Do not add a 5th `AgentType`.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'` (Linux cloud: `dotnet` / `npm run typecheck`).
- Do not collapse desktop review workspace tabs behind **More**.
- Do not flip `AgentExecution:Mode` host default. No G-REAL-06 fake Real runs.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (skip with a note on Linux if the script is unavailable).
- Do not reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.

---

# V13-01 — Restore Operator UI typecheck (Gate 5)

**Closes:** v13 Gate 5 FAIL · Runtime 68 · §8 weakness 1  
**Branch:** `cursor/v13-01-ui-typecheck-dedupe-97a4`  
**Paste:** [`.cursor/prompts/v13-quality-roi-01-ui-typecheck-dedupe.md`](../../.cursor/prompts/v13-quality-roi-01-ui-typecheck-dedupe.md)

### Design intent

HEAD at the v13 freeze failed `npm run typecheck` with **TS2300 duplicate imports**. Open **#2830** already reports **Operator UI: typecheck (blocking) SUCCESS** — **land that PR** after merging current `origin/master`. Later trunk (Wave 111, OP-01–06, SecureNow SA-09–10) may have added new duplicates; this prompt **finishes the workspace**, not a second half-fix.

**Done when:** `cd archlucid-ui && npm run typecheck` exits 0 on the PR branch.

**Score effect:** Runtime **68→77** (restore v12-with-green-typecheck band). Correctness **85→86** (workspace compiles). Time-to-Value **82→83** (demo path unblocked). **`(A)` +0.85.** Gate 5 **PASS**. Remaining Runtime deductions (stale full matrix, Gate 1, merge queue) stay for V13-04/05.

---

# V13-02 — Align audit-matrix share route templates

**Closes:** v13 pre-corset FAIL · GRI hold for stale `{actorOid}` templates  
**Branch:** `cursor/v13-02-audit-matrix-share-paths-97a4`  
**Paste:** [`.cursor/prompts/v13-quality-roi-02-audit-matrix-share-paths.md`](../../.cursor/prompts/v13-quality-roi-02-audit-matrix-share-paths.md)

### Design intent

OpenAPI exposes `PUT /v1/architectures/{architectureId}/shares` and `DELETE .../shares/{targetActorOid}`. **#2829 is merged.** Run `python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py` first. If it exits 0, **skip** — do not rewrite the matrix.

**Done when:** `python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py` exits 0.

**Score effect:** GRI **92→93**. After V13-01, Runtime **77→78** (guards-pre-corset no longer fails on this SHA). **`(A)` +0.20.** Does **not** change Gate 5.

---

# V13-03 — Close leftover No-anchor cells (four engines)

**Closes:** v13 Density hold “four leftover `No anchor` cells”  
**Branch:** `cursor/v13-03-no-anchor-golden-citations-97a4`  
**Paste:** [`.cursor/prompts/v13-quality-roi-03-no-anchor-golden-citations.md`](../../.cursor/prompts/v13-quality-roi-03-no-anchor-golden-citations.md)

### Design intent

Recorded distribution shows **1** `No architecture anchor` each on `requirement-expectation`, `security-baseline-completeness`, `security-baseline-expectation`, `topology-coverage` (1 of ~30 findings). Penalty is `no-architecture-anchor` in `DeterministicInsightDensityGate` when the finding has neither a product-shaped inventory id nor `HasArchitectureSpecificAnchor`. Attach a **real** node/name already on that golden graph — do not invent ARM/ARN.

**Done when:** re-recorded `docs/quality/insight-density-engine-distribution.md` shows **0** in the No-anchor column for those four engines; `WouldDemoteAt65Count` stays 0.

**Score effect:** Density **82→83**. Correctness **86→87** (after 01). **`(A)` +0.25.** Does **not** substitute for live Gate 1. Do **not** add engines.

---

# V13-04 — Full `ci.yml` matrix triage

**Closes:** v13 Runtime residual after typecheck · QR-35 / V12-03 carry  
**Branch:** `cursor/v13-04-ci-yml-matrix-triage-97a4`  
**Paste:** [`.cursor/prompts/v13-quality-roi-04-ci-yml-matrix-triage.md`](../../.cursor/prompts/v13-quality-roi-04-ci-yml-matrix-triage.md)

### Design intent

Same as V12-03: inspect or dispatch full `ci.yml` on a SHA that already has V13-01+02. Fix only cheap in-contract reds. Do not disable checks. Do not claim typecheck == full matrix.

**Done when:** each remaining red is fixed, documented flake, or owner-blocked with log links. Update `docs/engineering/CI_YML_MATRIX_TRIAGE_2026-09-10.md` (or a dated follow-on) with the new run id.

**Score effect:** Runtime **78→81**. **`(A)` +0.21.** Gate 1 stays UNKNOWN. Merge queue still owner.

---

# V13-05 — Gate 1 bound-run checklist (owner executes)

**Closes:** Gate 1 UNKNOWN · Time-to-Value / Runtime after 01  
**Owner-required:** real staging tenant and run  
**Paste:** [`.cursor/prompts/v13-quality-roi-05-gate1-ship-gate-checklist.md`](../../.cursor/prompts/v13-quality-roi-05-gate1-ship-gate-checklist.md)

### Design intent

`docs/engineering/GATE1_SHIP_GATE_EVIDENCE_RUNBOOK.md` already exists. Composer **does not rewrite it from scratch**. Verify CLI flags still match, require **bound inventory before execute**, and refuse a synthetic PASS. Owner runs `archlucid pilot ship-gate-evidence --run-id <guid>`.

**Done when:** one observed evidence bundle exists under `artifacts/ship-gate-evidence/{runId}/` **or** the PR only documents a still-UNKNOWN gate with the blocking prerequisite named.

**Score effect (only after owner run):** Time-to-Value **83→85**, Runtime **81→83**, Gate 1 **PASS**. **`(A)` +0.34.** Proof-of-ROI stays **76** (G4 still 0/3). Density does **not** jump to 85 on one staging run.

---

## Expected scorecard after the pack (engineering 01–04 only)

| Quality | v13 now | After 01–04 | Notes |
|---------|--------:|------------:|-------|
| Insight Density | 82 | **83** | V13-03 only |
| Differentiability | 88 | 88 | Unchanged — needs G-REAL-06 |
| Governed Review Integrity | 92 | **93** | V13-02 |
| Correctness | 85 | **87** | 01 + 03 |
| AI / Agent Readiness | 81 | 81 | TB-883 Hold |
| Time-to-Value | 82 | **83** | 01; +2 more after Gate 1 |
| Proof-of-ROI | 76 | **76** | Owner G-REAL-06 |
| Comprehension | 86 | 86 | Unchanged |
| Runtime | 68 | **81** | 01 + 02 + 04 |
| Adoption | 88 | 88 | Unchanged |
| **(A)** | **83.44%** | **~84.95%** | Gate 5 PASS; Gate 1 still UNKNOWN |
