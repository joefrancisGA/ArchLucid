---
description: Rank private-beta priority top 10 plus at least 15 Cursor suggestions (read-only)
---

# Private-beta readiness top 10 (`/al-beta`)

Run this workflow **once per invocation**. Produce the **current top 10 tasks** (human **or** Cursor) that best mitigate ArchLucid's standing weaknesses and move the product to **private beta**. Then **stop**. Do **not** implement, edit tracked files, commit, push, or run a fresh assessment.

This command is **read-only prioritization** for the private-beta milestone. It blends assessment weaknesses, ship gates, GTM proof work, and **live trunk CI** — not the general `/ship-next-improvement` backlog queue.

---

## Private-beta definition (scope boundary)

**Private beta** means: an invited user can reliably get from invitation → authentication → correct tenant → Operator first meaningful action, with JwtBearer (not DevelopmentBypass-only), while trunk corset + beta-readiness wiring stay green.

Authoritative references:

| Topic | Doc |
| --- | --- |
| Access-path assessment | `docs/assessments/private_beta_access_prompt_07152026.md` |
| JwtBearer / scope binding | `docs/library/LIVE_E2E_JWT_SETUP.md` |
| Push corset + beta jobs | `docs/library/TEST_EXECUTION_MODEL.md` |
| Live ruleset intent | `.github/BRANCH_PROTECTION.md`, `.github/rulesets/golden-cohort-gate-required-check.json` |
| Human proof runs | `docs/go-to-market/GTM_BACKLOG.md` (**G-REAL-06**, **G-REAL-07**, **M-39**) |
| Headline weaknesses + prescription | `docs/assessments/LATEST_GPT55.md` §8, §0, §17 |
| Exposure / controlled-beta gaps | `docs/assessments/LATEST_EXPOSURE.md` §20 (secondary) |

**Out of scope for this command:** public self-service launch, LinkedIn mention, SOC 2 CPA (**G-REAL-05** / TB-135), third-party pen test (**G-ASSURANCE-02** / TB-136), and GTM V1.1 cohort rows **M-90**, **M-44**, **M-91**, **M-92** (assessment #2/#3/#5/#6).

---

## Guardrails (read first)

Same standing exclusions as other assessment commands:

- **Never** promote GTM assessment items **#2, #3, #5, #6** (**M-90**, **M-44**, **M-91**, **M-92**) per `.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`.
- **Never** treat absent CPA SOC 2 or third-party pen-test publication as private-beta blockers per `.cursor/rules/V1_1-assurance-backlog.mdc`.
- **Do not** re-open items marked **shipped this cycle** in `LATEST_GPT55.md` §17 preamble (e.g. AV suppressions, Gate 5 typecheck batch, azurerm pin, conflict-marker hotfix) unless **live trunk CI** or a newer merged PR proves regression.
- **Do not** list **V2**, **DEFERRED**, or **Hold for reassessment** engineering rows unless they block the private-beta access path today.
- **Do not** rank prefix-family / `typed-engine-protected` / deep engine-corpus themes (**LATEST_GPT55.md** §8 #2, #8, #10) above **red trunk jobs**, **Gate 1 UNKNOWN**, or **private-beta JwtBearer failures** — those are design debt, not invite-wave blockers.
- **Human vs Cursor:** label **Human** when only an owner can execute (GitHub ruleset UI apply, staging deploy approval, live pilot runs, screenshot capture, founder sign-off). Label **Cursor** when a coding agent can land code/tests/CI/docs in-repo without live customer participation.

---

## Minimum output contract

1. **Priority table — exactly 10 rows** ranked by private-beta impact (Human **or** Cursor). This is the blended “what matters most” view; it may include P0 Human gates (Gate 1, G-REAL-06, ruleset apply, …).
2. **Cursor suggestions — at least 15 rows** in a **second** table, all **Owner = Cursor**, ranked by private-beta impact. Pull from red beta-critical CI, §17 Tier 1–2, the Cursor task pool below, and open P0/P1 `TECH_BACKLOG.md` rows. **Do not** duplicate a row that already appears in the priority table — each Cursor suggestion must be a distinct task. If fewer than fifteen distinct Cursor items qualify, extend into §17 Tier 2, open Vitest/CI parity, beta-path TB rows, and recent merge regressions until the count is ≥ 15 (mark lower-confidence rows in **Why now**).
3. Each row (both tables) must cite **why now** (weakness #, gate, or red CI job).
4. Mark **Status**: `open` | `in-progress` | `shipped` | `blocked` with one-line evidence.

---

## Data sources (read in this order)

### 1 — Live trunk CI (required)

Inspect **current** `master` / `main` health before ranking. Prefer **completed** runs from the last ~48h.

```bash
gh run list --branch master --limit 15
gh run list --workflow ui-typecheck-on-push.yml --branch master --limit 5
gh run list --workflow private-beta-access-on-push.yml --branch master --limit 5
gh run list --workflow openapi-snapshot-refresh.yml --branch master --limit 5
```

For any **failure** or **action_required** on beta-critical workflows, pull job names:

```bash
gh run view <run-id> --log-failed
```

**Beta-critical check names** (treat red as top-tier Cursor or Human blockers):

| Check / workflow | Why it matters |
| --- | --- |
| `Operator UI: private-beta access-path (JwtBearer)` | Invite-wave Playwright (`private-beta-access-on-push.yml`) |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | Contract drift blocks push corset |
| `CI: beta-readiness wiring guards` | Python guards for private-beta + OpenAPI-on-push wiring |
| `.NET: fast core (corset)` / `.NET: push corset (build + fast core Core/Decisioning)` | Trunk compile + Core/Decisioning slice |
| `Operator UI: typecheck (blocking)` | Gate 5 |
| `Security: gitleaks (secret scan)` | Secret scan on push |
| `CD staging on merge` / `cd-staging-on-merge.yml` | Staging deploy for Gate 1 (`action_required` = Human) |
| `cohort-real-llm-gate` | Golden cohort (may fail independently of beta path) |

Compare **JSON intent** (`.github/rulesets/golden-cohort-gate-required-check.json`) vs **live ruleset** notes in `.github/BRANCH_PROTECTION.md` — if JSON lists checks the live ruleset has not applied, surface **Apply golden-cohort ruleset** as a **Human** row.

### 2 — Assessment weaknesses (required)

From `docs/assessments/LATEST_GPT55.md`:

- **§8 Top 10 Weaknesses** — primary weakness vocabulary.
- **§0 Tasks For Human** — owner-ranked human work (Gate 1, G-REAL-06, M-07, …).
- **§17 Tier 1 / Tier 2** — engineering prescription (corset required checks, Dependabot, verification blind spots, Vitest, policy-toggle demo, npm hygiene).
- **§4 V1 Ship Gate** — Gate 1 UNKNOWN vs Gate 5 PASS.

Use `docs/assessments/LATEST_EXPOSURE.md` §20 only when a private-beta-specific gap (pilots, burst test) is not already covered.

### 3 — GTM + tech backlog cross-check (required)

- `docs/go-to-market/GTM_BACKLOG.md` — **G-REAL-06**, **G-REAL-07**, **M-39**, **M-07**, **M-09**, **M-16**, **M-108**.
- `docs/library/TECH_BACKLOG.md` — open **P0/P1** rows that mention private beta, JwtBearer, OpenAPI, Vitest, Dependabot, or push corset (grep `private beta`, `TB-79`, `beta-readiness`, `OpenAPI`, `Vitest`).

### 4 — Recent merges (lightweight)

```bash
git log origin/master -15 --oneline
```

Close or downgrade tasks fixed on trunk in the last few merges (e.g. Playwright ESM `createRequire`, OpenAPI snapshot regen). Do not list them as `open`.

---

## Ranking methodology

Score each candidate task on **private-beta impact** (not general V1.1 polish):

| Signal | Weight |
| --- | --- |
| Red **beta-critical** CI job on `master` | Highest — usually ranks 1–3 |
| **Gate 1 UNKNOWN** (no observed staging first review) | Highest human |
| **G-REAL-06** zero pilots (commercial proof for beta cohort) | High human |
| **§8 weakness #1** — corset decoupled from required checks | High human (apply ruleset) + Cursor (keep jobs green) |
| Private-beta access-path regression (JWT, invite, scope) | High Cursor |
| **§17 Tier 1** Cursor items (Dependabot, verification blind spots) | Medium-high Cursor |
| **M-07** / **M-09** (screenshots + landing deploy) | Medium human (unblocks outward beta comms) |
| **§8** insight density / engine depth / PP-01 themes | Lower for *private beta* unless Tier 1 CI is green |

**Tie-break:** live CI failure > Gate 1 > G-REAL-06 > §17 Tier 1 > §17 Tier 2 > GTM P1 > other.

---

## Cursor task pool (when filling the ≥15 Cursor suggestions table)

Prefer these Cursor-actionable items (skip if `shipped`):

- Fix red **`private-beta-access-on-push`** / Playwright / JWT harness wiring
- Regenerate **OpenAPI** snapshot + `npm run generate:api-types` when API drift fails push corset
- **Dependabot** groups + `semver-major` ignore (`.github/dependabot.yml`)
- **Verification blind spots:** `AGENTS.md` Release note + `npm ls @tanstack/query-core` CI assert
- **Vitest** triage on Operator home / sidebar / post-#1124 layout waves
- **pytest** install in `assessment-score-guard.yml` if still failing
- Align **`@tanstack/react-query`** / remove **`legacy-peer-deps`** per §17 Tier 2
- CI parity fixes (empty `AzureOpenAI__*` on Simulator API, workflow wiring guards)
- Docs/scripts only when they unblock beta guards (e.g. `apply-golden-cohort-gate-ruleset.ps1` doc fix)

---

## Allowed tools

- **Read**, **Grep**, **Glob**, **SemanticSearch** — primary inspection.
- **Shell** — read-only `gh` and `git log`/`git status` only (no build, test, commit, push).
- **Do not** use **Write**, **StrReplace**, **Delete**, or task subagents that modify files.

---

## Report format

Lead with a one-paragraph **trunk snapshot** (last corset + private-beta job + OpenAPI job + staging CD if visible). Then **two tables**.

```markdown
## /al-beta — private-beta readiness

**Trunk snapshot:** <1–3 sentences — corset green/red, private-beta job, OpenAPI, ruleset lag, Gate 1, G-REAL-06>
**Primary weakness driving priority #1:** <§8 # or CI job name>

### Priority top 10

| Rank | Owner | Task | Maps to | Status | Why now |
| ---: | --- | --- | --- | --- | --- |
| 1 | Human \| Cursor | … | §8 #n / Gate 1 / G-REAL-06 / CI job | open \| shipped \| blocked | … |
| … | … | … | … | … | … |
| 10 | … | … | … | … | … |

### Cursor suggestions (minimum 15)

**Cursor suggestions:** N (minimum 15)

| Rank | Task | Maps to | Status | Why now |
| ---: | --- | --- | --- | --- |
| 1 | … | §17 / TB / CI job | open \| shipped \| blocked | … |
| … | … | … | … | … |
| 15 | … | … | … | … |
```

**Priority table — Owner column:** exactly `Human` or `Cursor`.

**Cursor suggestions table:** no Owner column (all Cursor); **Maps to** and **Status** same as priority table.

### Optional footnotes (keep short)

```markdown
### Recently shipped (not ranked)

- <PR or merge> — <one line>

### Excluded from this list

- <count> GTM V1.1 cohort / assurance program rows per standing rules
```

### Follow-up commands (do not run automatically)

| If the user wants… | Command |
| --- | --- |
| Implement the next Cursor engineering item | `/ship-next-improvement` |
| Preview only the next single backlog item | `/show-next-improvement` |
| Full Cursor-shippable queue | `/show-all-improvements` |
| Hunt a concrete defect | `/al-bug` |

---

## Explicit non-goals

- Do **not** implement, commit, push, or update backlog/assessment files.
- Do **not** run compile, test, or assessment generation.
- Do **not** ask which branch to commit to (no commit will occur).
- Do **not** substitute a generic weakness list without checking **live** `master` CI first.
