# Golden cohort (N=20)

This directory holds the **fixed cohort definition** used for nightly drift detection against the **simulator** agent path (and optionally a dedicated Azure OpenAI deployment when `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true` — budget approval required; see `docs/PENDING_QUESTIONS.md` item 15).

## Selection rationale

The 20 scenarios span common enterprise architecture patterns ArchLucid sees in pilots:

- Cost + topology tension (multi-region, data-heavy, GPU, IoT).
- Compliance-heavy boundaries (PCI, health, multi-tenant isolation).
- Integration complexity (SAP, mainframe, edge manufacturing).
- Operability (DR, secrets posture, FinOps).

Categories listed per item are **expected high-level finding buckets** for regression asserts once manifest outputs are stable.

## Baseline SHAs

`expectedCommittedManifestSha256` is intentionally **zeroed** until a product-approved baseline lock. Replace with the committed golden-manifest canonical SHA from an approved simulator run, then treat drift as a build/nightly signal.

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
2. After merge, set repository variable **`ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED = true`** in GitHub repo settings → Variables.
3. The next nightly `golden-cohort-nightly` run picks up the drift assertion automatically (the `cohort-simulator-drift` job is gated on that variable).

## Automation

- Contract test: `ArchLucid.Application.Tests` — `GoldenCohortContractTests` (always runs; passes whether SHAs are zero or locked).
- Drift report artifact: `docs/quality/golden-cohort-drift-latest.md` (overwritten by CI when the drift job runs; previous runs archived under `docs/quality/archive/`).
- Real-LLM cohort run is still gated on **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`** plus injected Azure OpenAI secrets on a protected GitHub Environment — see `docs/PENDING_QUESTIONS.md` item 15 / 25 (owner budget approval).
