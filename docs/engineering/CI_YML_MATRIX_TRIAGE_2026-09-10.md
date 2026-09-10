> **Scope:** V12-03 triage notes for full `.github/workflows/ci.yml` matrix on trunk. Documents August 2026 failures and post-wave-22 remediation status — not a green matrix claim.

# CI.yml matrix triage (2026-09-10)

**Last full `workflow_dispatch` on `master`:** 2026-08-28 run `33193938737` (**failure**, ~6h39m).

**Newest push corset signal (2026-09-10):** OpenAPI v1 fail-fast **green** after wave 22 + `DraftRequestSummaryResponse.ArchitectureId` regen.

## Failed jobs (run 33193938737)

| Job | Class | Post-wave-22 status |
|-----|-------|---------------------|
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | (a) cheap fix | **Fixed** — snapshot regen on current branch |
| `Operator UI: typecheck (blocking)` | (a) | **Likely fixed** on recent PRs (`34410769119` cited in v11) — re-dispatch to confirm |
| `Docs: markdown link integrity` | (a) | **Needs re-dispatch** — inspect log on fresh SHA |
| `CI: guards pre-corset (text)` | (a) | **Needs re-dispatch** — often docs/link or lockfile drift |
| `Operator UI: lint, typecheck, production build` | (a) | Re-dispatch after OpenAPI + typecheck green |
| `.NET: fast core (corset)` | (a)/(b) | Re-dispatch; may depend on upstream OpenAPI job |
| `Operator UI: Playwright mock functional (mock API)` | (b) flake / drift | Re-dispatch |
| `Operator UI: axe-core WCAG 2.1 A/AA (mock)` | (b) | Re-dispatch |
| `Operator UI: Lighthouse CI synthetic checks (lab)` | (b) | Re-dispatch |
| `Containers: Docker build smoke` | (c) infra | Owner/infra if still red on fresh SHA |

## Recommended owner action

After wave 22 + V12-01 merge to `master`:

```bash
bash scripts/ci/dispatch_full_ci_matrix.sh master
```

Triage **only** reds that reproduce on that SHA. Do not disable required checks.

## Composer fixes landed on this branch (pre-merge)

1. OpenAPI snapshot + generated TS types (`ArchitectureId` on draft list summary for AS-094 parent filter).
2. Vitest AS-094 share-filter tests (`share-visible-architecture-inventory`, GlobalSearchBar restricted draft case).

## Hold items (not this PR)

- **Live merge queue** — owner applies `.github/rulesets/golden-cohort-gate-merge-queue.json`.
- **Gate 1 / G-REAL-06** — human staging runs (`docs/engineering/GATE1_SHIP_GATE_EVIDENCE_RUNBOOK.md`).

## Do not claim

- Green typecheck == green full matrix until `ci.yml` completes on current `master`.
- This document replaces a fresh Actions run — it is a triage ledger only.
