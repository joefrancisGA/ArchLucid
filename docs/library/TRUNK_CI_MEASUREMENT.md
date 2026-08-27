# Trunk CI matrix measurement (beyond push corset)

**Scope:** Records fast-core test slices outside the `master` push corset (Core + Decisioning only). The corset proves compile + 1,137 fast-core tests on two assemblies; this document quantifies the rest.

**Automation:** `.github/workflows/trunk-matrix-measurement.yml` (weekly schedule + `workflow_dispatch`) runs `scripts/ci/run_trunk_matrix_measurement.sh` and uploads a log artifact.

**Filter (fast-core slice):**

```text
Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord
```

## Latest measurement — 2026-08-27 (cloud agent VM, commit pre-push)

| Assembly | Fast-core result | Notes |
|----------|------------------|-------|
| `ArchLucid.Decisioning.Tests` | **319 / 0** | Same slice as push corset Decisioning shard |
| `ArchLucid.Api.Tests` | **1061 passed, 5 failed** | Failures outside corset; corset excludes OpenAPI snapshot tests |
| `ArchLucid.AgentRuntime.Tests` | **739 passed, 1 failed** | Single parser validation failure |
| `ArchLucid.Host.Composition.Tests` | **263 passed, 5 failed** | DI/host wiring regressions not in corset |
| `ArchLucid.Application.Tests` | **not measured** | Build failed on this VM (`FsCheck.Fluent` namespace); CI may differ |

**Interpretation:** A green push corset does **not** mean trunk is green. The unmeasured / red assemblies are exactly why v5.1 listed full-matrix measurement as Tier 1. This workflow does not fix failures — it makes them visible on a schedule.

**Owner actions (not automated here):**

1. Branch protection on push corset + CodeQL + UI typecheck (makes regressions blocking).
2. Triage Api / Host.Composition / AgentRuntime failures surfaced above.
3. Full `ci.yml` `workflow_dispatch` for integration + SQL tiers when preparing a release.
