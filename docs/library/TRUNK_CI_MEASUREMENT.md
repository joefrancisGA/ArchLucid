> **Scope:** Contributor-reference — Records fast-core test slices outside the `master` push corset (Core + Decisioning only). Not a buyer or operator document.

# Trunk CI matrix measurement (beyond push corset)

**Scope:** Records fast-core test slices outside the `master` push corset (Core + Decisioning only). The corset proves compile + 1,137 fast-core tests on two assemblies; this document quantifies the rest.

**Automation:** `.github/workflows/trunk-matrix-measurement.yml` (weekly schedule + `workflow_dispatch`) runs `scripts/ci/run_trunk_matrix_measurement.sh` and uploads a log artifact.

**Filter (fast-core slice):**

```text
Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord
```

## Latest measurement — 2026-08-28 (cloud agent VM, commit pre-push)

| Assembly | Fast-core result | Notes |
|----------|------------------|-------|
| `ArchLucid.Application.Tests` | **1967 / 0** | Previously unmeasured on this VM (build failed on older snapshot) |
| `ArchLucid.Api.Tests` | **1123 / 0** | Fixed `OperationalErrorsAdminController` ProblemDetails guard violation |
| `ArchLucid.AgentRuntime.Tests` | **743 / 0** | Green after fresh build (prior failure was stale `ArchLucid.Contracts` binary) |
| `ArchLucid.Host.Composition.Tests` | **274 / 0** | Allowlisted `DapperDraftRequestRepository` in storage parity guard |

**Prior measurement (2026-08-27):** Api 1061/5, AgentRuntime 739/1, Host.Composition 263/5 — several failures were stale binaries or already fixed on trunk; remaining gaps closed in PR for this pass.

**Interpretation:** A green push corset does **not** mean trunk is green. The unmeasured / red assemblies are exactly why v5.1 listed full-matrix measurement as Tier 1. This workflow does not fix failures — it makes them visible on a schedule. Fast-core slices outside Core/Decisioning are now green on this VM; integration tier (`Category=Integration`) still requires SQL host fixtures.

**Owner actions (not automated here):**

1. Branch protection on push corset + CodeQL + UI typecheck (makes regressions blocking).
2. Triage Api / Host.Composition / AgentRuntime failures surfaced above.
3. Full `ci.yml` `workflow_dispatch` for integration + SQL tiers when preparing a release.

## Path gating decision (assessment Tier 1 #6 — 2026-08-28)

| Trigger | Path gating | Rationale |
|---------|-------------|-----------|
| **`pull_request`** | **On** (`ci-path-lanes` skips unchanged lanes) | Keeps contributor feedback fast; full matrix still runs when shared paths change. |
| **`push` to `master` / `main`** | **Thin corset only** (`ui-typecheck-on-push.yml`) | Direct trunk pushes get compile + Core/Decisioning fast-core + UI typecheck without paying full SQL/Playwright/k6 on every merge. |
| **`workflow_dispatch` on `ci.yml`** | **Off** (full matrix) | Release prep and trunk health audits run every lane intentionally. |

**Decision:** Do **not** relax PR path gating or expand default-branch push to the full matrix. Use **`workflow_dispatch`** on `ci.yml` (Actions → CI → Run workflow, branch `master`) before release cuts, and rely on **`trunk-matrix-measurement.yml`** for weekly fast-core slices outside the corset.

**Recorded measurement:** Trigger `Trunk matrix measurement` or `CI` workflow_dispatch after material trunk changes; append results to the table above with date and commit SHA.
