> **Scope:** Contributor-reference — Records fast-core test slices outside the `master` push corset (Core + Decisioning only). Not a buyer or operator document.

# Trunk CI matrix measurement (beyond push corset)

**Scope:** Records fast-core test slices outside the `master` push corset (Core + Decisioning only). The corset proves compile + 1,137 fast-core tests on two assemblies; this document quantifies the rest.

**Automation:** `.github/workflows/trunk-matrix-measurement.yml` (weekly schedule + `workflow_dispatch`) runs `scripts/ci/run_trunk_matrix_measurement.sh` and uploads a log artifact.

**Filter (fast-core slice):**

```text
Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord
```

## Latest measurement — 2026-08-31 (beta-readiness corset hardening, cloud agent VM)

| Assembly | Fast-core result | Notes |
|----------|------------------|-------|
| `ArchLucid.Application.Tests` | **2031 / 0** | Green |
| `ArchLucid.Api.Tests` | **1177 / 0** | Green (fast-core slice) |
| `ArchLucid.AgentRuntime.Tests` | **743 / 0** | Green |
| `ArchLucid.Host.Composition.Tests` | **276 / 0** | Green |
| `ArchLucid.Decisioning.Tests` | **8 / 0** | `BundledPolicyPackDeclarationThemeTests` (PP-01 Option B, corset-covered) |
| `ArchLucid.Api.Tests` (integration) | **SKIP** (no SQL host) | `probe-sql-integration-host.sh` — integration tier requires GHA `sqlserver` service or local `ARCHLUCID_SQL_TEST` |

**Interpretation:** Fast-core slices outside the push corset remain green on current `master`. Tasks **#4–#9** (PP-01 Option B catalog, TB-951 sponsor-export guard, private-beta/release-gate wiring guards, insight-density advisory guards, trunk-matrix workflow) are **shipped on trunk**; this pass adds a **blocking push-corset job** for the four Python wiring guards so regressions cannot merge silently while full `ci.yml` lanes stay `continue-on-error`.

## Prior measurement — 2026-08-28 (integration-tier triage + PP-01 batch, cloud agent VM)

| Assembly | Fast-core result | Notes |
|----------|------------------|-------|
| `ArchLucid.Application.Tests` | **1967 / 0** | Green |
| `ArchLucid.Api.Tests` | **1123 / 0** | Green (fast-core slice) |
| `ArchLucid.AgentRuntime.Tests` | **743 / 0** | Green |
| `ArchLucid.Host.Composition.Tests` | **274 / 0** | Green |
| `ArchLucid.Decisioning.Tests` | **8 / 0** | `BundledPolicyPackDeclarationThemeTests` (PP-01 guard, corset-covered) |
| `ArchLucid.Api.Tests` (integration) | **SKIP** (no SQL host) | `scripts/ci/probe-sql-integration-host.sh` — prior **457 failed** was a false-negative on Linux VMs without `ARCHLUCID_SQL_TEST`; not a trunk regression |

**Integration-tier triage (task #7):**

- **Root cause:** `ArchLucidApiFactory` requires `ARCHLUCID_SQL_TEST` / `ARCHLUCID_API_TEST_SQL` on non-Windows hosts (`SqlServerIntegrationTestConnections`). Running `Category=Integration` without a reachable SQL host produced hundreds of constructor failures that looked like product regressions.
- **Fix:** `scripts/ci/probe-sql-integration-host.sh` + `run_trunk_matrix_measurement.sh` now **skip** integration when SQL is unreachable; `trunk-matrix-measurement.yml` adds the same `sqlserver` service container as `ci.yml` integration shards so scheduled/dispatch measurements can run the integration slice when SQL is present.
- **Authoritative integration signal:** `ci.yml` `workflow_dispatch` job `dotnet-full-regression-core-api-integration` (six SQL-backed shards). Master dispatch [33193938737](https://github.com/joefrancisGA/ArchLucid/actions/runs/33193938737) was **queued** at last check — append shard results here when complete.

**Interpretation:** Push corset + fast-core slices outside Core/Decisioning remain green. Integration tier is environment-gated by design; do not treat bare `dotnet test --filter Category=Integration` on a SQL-less Linux host as trunk health.

## Prior measurement — 2026-08-28 (post-ruleset corset + PP-01, cloud agent VM)

| Assembly | Fast-core result | Notes |
|----------|------------------|-------|
| `ArchLucid.Application.Tests` | **1967 / 0** | Green |
| `ArchLucid.Api.Tests` | **1123 / 0** | Green (fast-core slice) |
| `ArchLucid.AgentRuntime.Tests` | **743 / 0** | Green |
| `ArchLucid.Host.Composition.Tests` | **274 / 0** | Green |
| `ArchLucid.Decisioning.Tests` | **8 / 0** | `BundledPolicyPackDeclarationThemeTests` (PP-01 guard, corset-covered) |
| `ArchLucid.Api.Tests` (integration) | **55 passed, 457 failed** | `ArchLucidApiFactory` — no SQL host fixture on this VM; superseded by SKIP probe above |

**Interpretation:** Push corset + fast-core slices outside Core/Decisioning are green on trunk after ruleset required-checks update. Integration tier still requires hosted SQL fixtures — not a regression signal from this pass.

## Prior measurement — 2026-08-28 (pre-push, cloud agent VM)

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

**Decision:** Do **not** relax PR path gating or expand default-branch push to the full matrix. Use **`workflow_dispatch`** on `ci.yml` before release cuts:

```bash
bash scripts/ci/dispatch_full_ci_matrix.sh master
# Optional extended live-a11y matrix:
bash scripts/ci/dispatch_full_ci_matrix.sh master true
```

Also rely on **`trunk-matrix-measurement.yml`** for weekly fast-core slices outside the corset.

**Recorded measurement:** Trigger `Trunk matrix measurement` or full `CI` workflow_dispatch after material trunk changes; append results to the table above with date and commit SHA.
