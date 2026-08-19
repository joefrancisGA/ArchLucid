> **Scope:** Commit path + governance gate mutation testing — describes the scoped Stryker config, CI workflow, and human-readable notes; it is not the canonical OpenAPI or persistence contract.

# Mutation testing — commit integrity and pre-commit governance

## Objective

Exercise **Stryker.NET** against code that affects **authority manifest commit** and the **optional pre-commit governance gate**, without mutating all of `ArchLucid.Application`.

## Configuration

| Item | Value |
|------|--------|
| Config file (repo root) | [`stryker-config.application-commit-critical-paths.json`](../../stryker-config.application-commit-critical-paths.json) |
| Scheduled CI label | **ApplicationCommitCriticalPaths** |
| Mutate globs | `ArchLucid.Application/Governance/**/*.cs`, `AuthorityDrivenArchitectureRunCommitOrchestrator.cs`, `ManifestFinalizationService.cs` |
| Test filter | Governance tests, `Runs/Finalization` tests, and orchestrator tests whose FQN matches `AuthorityDrivenArchitectureRunCommitOrchestrator` (includes guard + integrity tests) |

**Baseline:** **`scripts/ci/stryker-baselines.json`** uses **22.5** (one-decimal floor from the first full local run **2026-05-11**, Release build: **22.56%** mutation score, **`thresholds.break = 22`**). The mutate surface is large relative to the filtered test set, so the honest floor starts low — ratchet **up** only after **`refresh_stryker_baselines.py`** observes green CI (**`--only ApplicationCommitCriticalPaths --merge-existing`**). Fix any **failing tests** in the filtered suite before trusting the score.

**Known noise from that run:** Stryker logged **one failing test** in the initial test pass and several **analyzer / compile-error** warnings; CI on Linux may differ slightly — treat the baseline as a regression guard, not a stability proof.

## CI

1. **Weekly + manual:** [`.github/workflows/stryker-scheduled.yml`](../../.github/workflows/stryker-scheduled.yml) runs this target with **`dotnet dotnet-stryker -f stryker-config.application-commit-critical-paths.json -s ArchLucid.sln`**, asserts against the baseline, and uploads **`StrykerOutput`** as **`stryker-report-ApplicationCommitCriticalPaths`**.
2. **Pull requests:** [`.github/workflows/stryker-pr.yml`](../../.github/workflows/stryker-pr.yml) includes this label when **`scripts/ci/stryker_pr_plan.py`** maps touched paths (tests, `Governance/`, commit orchestrator, or manifest finalization service). Runs use **`--since:<base>`** for faster differential mutation.

## Reporting

Open the workflow artifact and inspect **`StrykerOutput/.../reports/mutation-report.json`** (and **`.html`**). Narrative for Stryker overall: **[`docs/library/MUTATION_TESTING_STRYKER.md`](../library/MUTATION_TESTING_STRYKER.md)**.

## Why not rely on local runs only?

Full solution builds and long mutation loops are **slow** and can hit **locked DLLs** on Windows when **`testhost`** is active. CI runners avoid most of that friction; see **`docs/library/MUTATION_TESTING_STRYKER.md`** § Reliability.
