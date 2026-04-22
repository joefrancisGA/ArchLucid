# Golden cohort (N=20)

This directory holds the **fixed cohort definition** used for nightly drift detection against the **simulator** agent path (and optionally a dedicated Azure OpenAI deployment when `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true` — budget approval required; see `docs/PENDING_QUESTIONS.md` item 15). **`budget.config.json`** pins the **$50/month** cap and **90%** kill switch for the real-LLM path; see [`docs/runbooks/GOLDEN_COHORT_BUDGET.md`](../runbooks/GOLDEN_COHORT_BUDGET.md) and [`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py).

## Selection rationale

The 20 scenarios span common enterprise architecture patterns ArchLucid sees in pilots:

- Cost + topology tension (multi-region, data-heavy, GPU, IoT).
- Compliance-heavy boundaries (PCI, health, multi-tenant isolation).
- Integration complexity (SAP, mainframe, edge manufacturing).
- Operability (DR, secrets posture, FinOps).

Categories listed per item are **expected high-level finding buckets** for regression asserts once manifest outputs are stable.

## Baseline SHAs

`expectedCommittedManifestSha256` carries the **canonical Simulator-path** committed-manifest SHA-256 (lowercase hex) for each cohort row. Nightly drift compares fresh simulator runs to these values when the repository variable `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED` is `true`.

### Locked baseline (Simulator) — 2026-04-22

| Field | Value |
|-------|--------|
| **Lock date (UTC)** | 2026-04-22 |
| **Repository tree SHA at capture** | `eda94855c62d5a1a91fd189bf2e4b8b4d0546397` |
| **API mode** | `AgentExecution__Mode=Simulator`, `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=false` |
| **Host** | Local `ArchLucid.Api` (`http` launch profile, port **5128**), `ASPNETCORE_ENVIRONMENT=Development` |
| **SQL catalog** | `ArchLucidGoldenCohortLock` on local SQL Server (Windows integrated security) |
| **Storage** | `ArchLucid__StorageProvider=InMemory` |
| **Rate limits** | Development `RateLimiting:Expensive` permit limit raised for sequential create/execute/commit bursts during lock |
| **Simulator payload stability** | `FakeScenarioFactory` uses SHA-256–derived stable ids per `(runId, taskId, slot)` and a fixed synthetic `CreatedUtc` (2024-06-01 UTC) so manifest fingerprints and `GoldenCohortSimulatorDeterminismTests` stay repeatable |

Operator command (PowerShell):

```powershell
$env:ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED = "true"
$env:ARCHLUCID_GOLDEN_COHORT_REAL_LLM = "false"
dotnet run --project ArchLucid.Cli -- golden-cohort lock-baseline --write
```

### Owner approval (2026-04-21)

**Lock is approved.** `docs/PENDING_QUESTIONS.md` item 33 was resolved on 2026-04-21 — the operator may run the lock-baseline command against the Simulator path on a build host. The approval is **single-shot**: it covers the next operator-initiated lock only, not subsequent re-locks.

### Operator runbook (one-time lock)

Run on a build host with the .NET SDK installed and a SQL instance available. The command refuses to write unless **both** the env-var ack **and** Simulator mode are present.

```powershell
# Windows (PowerShell)
$env:ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED = "true"
$env:ARCHLUCID_AGENT_EXECUTION_MODE = "Simulator"
$env:ARCHLUCID_GOLDEN_COHORT_REAL_LLM = "false"
dotnet run --project ArchLucid.Cli -- golden-cohort lock-baseline --write
```

```bash
# Linux / macOS
export ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED=true
export ARCHLUCID_AGENT_EXECUTION_MODE=Simulator
export ARCHLUCID_GOLDEN_COHORT_REAL_LLM=false
dotnet run --project ArchLucid.Cli -- golden-cohort lock-baseline --write
```

After the SHAs are written and committed:

1. Open a PR with the cohort.json changes.
2. **Owner-only (one step):** in GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**, set **`ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED`** to **`true`**. The assistant cannot set repository variables from the repo; CI and this README assume the owner performs this once after verifying non-placeholder SHAs on `main`.
3. The next nightly `golden-cohort-nightly` run picks up the drift assertion automatically (the `cohort-simulator-drift` job is gated on that variable).

## Automation

- Contract test: `ArchLucid.Application.Tests` — `GoldenCohortContractTests` (always runs; validates shape and 64-hex SHAs).
- **Merge-blocking guard:** `python scripts/ci/assert_golden_cohort_baseline_locked.py` runs in **CI** with `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED=true` so a PR cannot restore placeholder SHAs while the repository treats the baseline as locked.
- Drift report artifact: `docs/quality/golden-cohort-drift-latest.md` (overwritten by CI when the drift job runs; previous runs archived under `docs/quality/archive/`).
- Determinism reinforcement: `ArchLucid.AgentRuntime.Tests` — `GoldenCohortSimulatorDeterminismTests` (Simulator path returns identical agent payloads for each cohort row over **N=10** repetitions).
- Real-LLM cohort run is still gated on **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`** plus injected Azure OpenAI secrets on a protected GitHub Environment — see `docs/PENDING_QUESTIONS.md` item 15 / 25 (owner budget approval). **Do not** enable `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` or the placeholder `cohort-real-llm-gate` job without explicit owner budget + provisioning steps.
