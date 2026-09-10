> **Scope:** V13-04 triage ledger for full `.github/workflows/ci.yml` on `origin/master` after V13-01–03 land. Classifies reds on push run `34523155228` (SHA `45a354920a`) plus the last full `workflow_dispatch` (`33193938737`). Not a green-matrix claim.

# CI.yml matrix triage (2026-09-10)

**Triage SHA:** `45a354920a` (`fix(decisioning): close leftover No-anchor cells on case-72 (#2849)`).

**Push CI run (partial, in progress at triage time):** [`34523155228`](https://github.com/joefrancisGA/ArchLucid/actions/runs/34523155228) — event `push` on `master`, 2026-09-10.

**Last full `workflow_dispatch` on `master`:** [`33193938737`](https://github.com/joefrancisGA/ArchLucid/actions/runs/33193938737) — **failure**, ~6h39m, 2026-08-28.

## V13 prerequisites

| Prerequisite | Status on `45a354920a` | Evidence |
|--------------|------------------------|----------|
| **V13-01** — `npm run typecheck` | **Regressed (b)** | Local: `HelpArchitectureShareRestrictGuideView.tsx(146,44): error TS2339: Property 'tocColumn' does not exist` — landed with wave 114 / AS-098 share-restrict help after #2844 fixed earlier TS2300 sweep |
| **V13-02** — audit-matrix assert | **Resolved (c)** | `python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py` → OK (393 paths) |

V13-01 fixed the wave-merge duplicate-import/typecheck sweep (#2844) but **did not** cover the post-merge share-restrict guide layout token. Treat typecheck as a **new (b) row**, not a blocker to publishing this triage.

## Failed jobs — push run `34523155228` (`45a354920a`)

| Job | Class | Root cause (repro on triage SHA) | Status / next |
|-----|-------|----------------------------------|---------------|
| `Docs: link integrity + scope-header ratchet (blocking)` | **(a)** | `check_md_links.py`: broken relative link `docs/architecture/ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md` → `adrs/0086-career-vs-rehearsal-doors.md` (file is `0086-career-vs-rehearsal-doors-no-host-mode-flip.md`) | Fix link target in acceptance doc |
| `Docs: NAVIGATOR + connector matrix link targets exist` | **(a)** | `assert_library_root_audience.py`: missing / untagged Scope on `SECURENOW_*.md` (4 files) and audience tag on `ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md` | Add `> **Scope:**` lines per guard |
| `CI: guards pre-corset (text)` | **(a)** | `detect_mutating_route_idempotency_drift` on push diff: six unclassified `POST /v1/infra-evidence/remediation-instances/{instanceId}/*` routes (wave 114 SecureNow remediation) | Classify routes in idempotency registry (same pattern as prior waves) |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | **(b)** | `dotnet build` fails in `ArchLucid.Application` before snapshot step completes — see FP-02 | Blocked on Application compile |
| `Operator UI: typecheck (blocking)` | **(b)** | Same `tocColumn` TS2339 as local typecheck | See FP-01 |
| `CI: prompt-injection regression (strict + block layer)` | **(b)** | `eval_agent_quality.py --prompt-injection-only` → `dotnet test` cannot run — Release build of `ArchLucid.AgentRuntime.Tests` invalid / Application layer does not compile | See FP-02, then FP-03 |
| `Operator UI: lint, typecheck, production build` | **(b)** | Path-skipped on this push lane; will fail when full matrix runs | Re-dispatch after FP-01 |
| `.NET: fast core (corset)` | **(b)** | Queued behind OpenAPI + guards; expect cascade failure until FP-02 + guards (a) land | Re-dispatch after upstream green |
| `Docs: markdown link integrity` | **(a)** | Warn-only job; same broken ADR link as blocking gate | Fix with link gate row |
| `Containers: Docker build smoke` | **(c)** | Path-skipped on push; August dispatch red — owner/infra re-check on full dispatch | Hold until full matrix |
| `Operator UI: Playwright mock functional (mock API)` | **(b)** | Path-skipped on push; last full dispatch red — unverified on `45a354920a` | FP-04 after FP-01 |
| `Operator UI: axe-core WCAG 2.1 A/AA (mock)` | **(b)** | Path-skipped on push; August dispatch red | FP-05 after FP-01 |
| `Operator UI: Lighthouse CI synthetic checks (lab)` | **(b)** | Path-skipped on push; August dispatch red | FP-06 after FP-01 |

Jobs **green** on push run at triage time (sample): `CI: path lanes`, `Security: gitleaks`, `Terraform: validate private stack`, `Integrations: Azure Pipelines YAML scripts` (windows + macos), several docs advisory guards.

## Failed jobs — full dispatch run `33193938737` (2026-08-28, historical)

| Job | Class on Aug SHA | Disposition on `45a354920a` |
|-----|------------------|----------------------------|
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | (a) | **Superseded** — was wave-22 snapshot drift; now fails on Application compile (b) |
| `Operator UI: typecheck (blocking)` | (a) | **Regressed (b)** — FP-01 |
| `Docs: markdown link integrity` | (a) | **Still (a)** — ADR 0086 link + SECURENOW scope headers |
| `CI: guards pre-corset (text)` | (a) | **Still (a)** — remediation idempotency drift on current diff |
| `Operator UI: lint, typecheck, production build` | (a) | **(b)** — blocked on typecheck |
| `.NET: fast core (corset)` | (a)/(b) | **(b)** — blocked on compile + guards |
| `Operator UI: Playwright mock functional (mock API)` | (b) | **(b)** — FP-04; needs fresh dispatch |
| `Operator UI: axe-core WCAG 2.1 A/AA (mock)` | (b) | **(b)** — FP-05 |
| `Operator UI: Lighthouse CI synthetic checks (lab)` | (b) | **(b)** — FP-06 |
| `Containers: Docker build smoke` | (c) | **(c)** — owner/infra |

## Follow-up Composer prompts — **(b) product rows only**

Paste **one prompt per chat**. Do not disable checks or skip required jobs.

### FP-01 — Typecheck: share-restrict help `tocColumn` (V13-01 carry)

**Branch:** `cursor/v13-01b-share-restrict-help-toc-97a4`

**Goal:** Restore `npm run typecheck` on `master`. Replace `HELP_PAGE_LAYOUT.tocColumn` in `HelpArchitectureShareRestrictGuideView.tsx` with the established TOC pattern (`HELP_PAGE_TOC.nav` + `HelpTopicTableOfContents`, mirroring `HelpCloudConnectionsGuideView.tsx`). Run `npm run typecheck` exit 0.

**Acceptance:** `Operator UI: typecheck (blocking)` green on next push.

---

### FP-02 — Application compile: architecture-share restrict ports

**Branch:** `cursor/spine-share-restrict-repository-ports-97a4`

**Goal:** Fix Release build of `ArchLucid.sln`. Resolve `ArchitectureShareRoles` ambiguity in `ArchLucid.Application` and implement missing `IArchitectureShareRepository` members referenced by `ArchitectureRestrictToSharesService` (`TryEnableRestrictToSharesAsync`, `TryDisableRestrictToSharesAsync`, `CountSharesAsync` or equivalent). Scoped compile: `ArchLucid.Application/ArchLucid.Application.csproj`.

**Acceptance:** `dotnet build ArchLucid.sln -c Release` exit 0; OpenAPI snapshot job can run.

---

### FP-03 — Prompt-injection executable regression (after FP-02)

**Branch:** `cursor/tb-325-prompt-injection-regression-97a4`

**Goal:** With Release build green, run `python3 scripts/ci/eval_agent_quality.py --prompt-injection-only --strict --enforce-prompt-injection-block-layer` and fix any failing `PromptInjectionExecutableRegressionTests`. Do not weaken `--strict` or block-layer enforcement.

**Acceptance:** `CI: prompt-injection regression (strict + block layer)` green.

---

### FP-04 — Playwright mock functional (full matrix re-dispatch)

**Branch:** `cursor/ui-playwright-mock-regression-97a4`

**Goal:** After FP-01, run full matrix (`bash scripts/ci/dispatch_full_ci_matrix.sh master`). If `Operator UI: Playwright mock functional (mock API)` still red, triage log on fresh SHA and fix product drift only — no `continue-on-error` on required jobs.

---

### FP-05 — axe-core WCAG mock (full matrix re-dispatch)

**Branch:** `cursor/ui-axe-mock-regression-97a4`

**Goal:** Same dispatch contract as FP-04 for `Operator UI: axe-core WCAG 2.1 A/AA (mock)`.

---

### FP-06 — Lighthouse CI lab (full matrix re-dispatch)

**Branch:** `cursor/ui-lighthouse-lab-regression-97a4`

**Goal:** Same dispatch contract as FP-04 for `Operator UI: Lighthouse CI synthetic checks (lab)`.

## Cheap (a) fixes — no dedicated prompt (fix in next docs/API hygiene PR)

1. **ADR link** — `ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md`: point ADR 0086 at `adrs/0086-career-vs-rehearsal-doors-no-host-mode-flip.md`.
2. **Library scope headers** — add Scope blockquotes to `docs/library/SECURENOW_*.md` and audience tag on `ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md`.
3. **Idempotency registry** — classify six `remediation-instances/{instanceId}/*` POST routes for wave 114.

## Owner / infra hold — **(c)**

| Item | Notes |
|------|-------|
| **Full matrix dispatch** | `bash scripts/ci/dispatch_full_ci_matrix.sh master` after FP-01 + FP-02 + (a) doc/guard rows |
| **Merge queue** | Owner applies `.github/rulesets/golden-cohort-gate-merge-queue.json` |
| **Gate 1 / G-REAL-06** | V13-05 — `docs/engineering/GATE1_SHIP_GATE_EVIDENCE_RUNBOOK.md` |
| **Docker build smoke** | Re-check on full dispatch; August failure may be infra — log link required before (b) prompt |

## Recommended sequencing

1. **(a)** docs link + SECURENOW scope headers + idempotency classification (can be one small PR).
2. **FP-02** Application compile (unblocks OpenAPI, prompt-injection, fast core).
3. **FP-01** typecheck (unblocks UI blocking job).
4. **FP-03** prompt-injection tests.
5. Full matrix dispatch → **FP-04 / FP-05 / FP-06** only if still red.

## Do not claim

- Green typecheck on a prior SHA == green full matrix on `45a354920a`.
- This document replaces a completed Actions run — push run `34523155228` was still in progress when classified; re-check conclusions when the run finishes.
- V13-04 fixes CI — it **classifies** reds and names follow-ups; it does not disable checks.
