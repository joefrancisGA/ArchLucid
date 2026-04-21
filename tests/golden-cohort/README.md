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

## Automation

- Contract test: `ArchLucid.Application.Tests` — `GoldenCohortContractTests`.
- Drift report artifact: `docs/quality/golden-cohort-drift-latest.md` (overwritten by CI; previous runs archived under `docs/quality/archive/` when the workflow is extended).
