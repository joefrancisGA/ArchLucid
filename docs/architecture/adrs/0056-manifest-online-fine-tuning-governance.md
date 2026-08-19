> **Scope:** ADR 0056 — Online fine-tuning on accepted manifests (RAG-V2-003 / TB-594).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0056: Manifest online fine-tuning governance

- **Status:** Accepted
- **Date:** 2026-07-03
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0005](0005-llm-completion-pipeline.md) (adds tenant-scoped fine-tuning job orchestration seam)

## Context

`V1_SCOPE.md` §2.20 pulls **RAG-V2-003** (continuous learning on accepted manifests) into V1 GA. A 2026-07-03 code audit found **zero** fine-tuning orchestration, training-data export, or model-registry code, and no owner ADR or DPA amendment authorizing manifest-derived training data.

Accepted golden manifests contain architecture decisions, topology labels, and finding rationales that can improve retrieval and agent completion quality when exported as supervised fine-tuning examples. That processing is **tenant-private by default**, **opt-in**, and must remain **redaction-safe** and **fail-closed** when consent or governance prerequisites are unmet.

## Decision

1. **Governance (Phase 0):** This ADR plus [`MANIFEST_FINE_TUNING_ADDENDUM.md`](../../go-to-market/MANIFEST_FINE_TUNING_ADDENDUM.md) satisfy the stated DPA/ADR prerequisite for engineering work. Production enablement still requires contractual countersignature where applicable.

2. **Consent (Phase 1):** Per-tenant manifest fine-tuning consent is stored in `dbo.TenantSettings` under key `FineTuning.ManifestConsent`. Default is **Disabled**. Export and job submission **fail closed** when consent is not **Enabled**.

3. **Training-data export (Phase 1):** `AcceptedManifestTrainingDataExporter` builds JSONL-style `FineTuningTrainingRecord` rows from committed manifests in caller scope only. All free-text passes through `IPromptRedactor.RedactAlways` plus manifest-specific GUID tokenization. No cross-tenant manifest mixing in a single export batch.

4. **Orchestration (Phase 2):** Azure OpenAI fine-tuning jobs are submitted via `AzureOpenAiFineTuningJobOrchestrator` when `Retrieval:FineTuning:Enabled` is true and Azure OpenAI is configured; otherwise `DisabledFineTuningJobOrchestrator` is registered. Job metadata and deployment names are held in **`IFineTunedModelRegistry`** — V1 DI wires **`InMemoryFineTunedModelRegistry`** only; `dbo.FineTunedModelRegistryEntries` exists as schema reserved for future SQL parity (no SQL writer yet).

5. **Promotion gate (Phase 3):** `GoldenCohortFineTuningPromotionGate` compares fine-tuned vs. base golden-cohort faithfulness support ratios. Promotion requires fine-tuned ≥ base and fine-tuned ≥ configured floor (`Retrieval:FineTuning:MinEvalSupportRatio`, default **0.80**). Failed promotion leaves the prior active model unchanged; rollback marks the registry entry `RolledBack`.

6. **Tenant isolation:** All export and registry rows are tenant-scoped (`TenantId` on row). Workspace/project scope is preserved on export audit rows. No fine-tuned model is promoted across tenants.

## Trade-offs

We gain a modular, testable V1 foundation for continuous learning without blocking on a full iterative agentic retraining loop. We sacrifice same-day production fine-tuning at scale: Azure job latency, eval cost, and owner legal review remain on the critical path. In-memory registry fallbacks in Development trade persistence simplicity for faster local iteration.

## Constraints

- Azure-native posture: fine-tuning jobs target **Azure OpenAI** only (no third-party fine-tuning APIs in V1).
- Cross-tenant training is **out of scope**; optional cross-tenant pattern library (ADR 0031) remains separate.
- Export volume is capped per request (`Retrieval:FineTuning:MaxManifestsPerExport`, default **100**).
- Production-like hosts must use SQL-backed audit and registry repositories.
- Manifest hash / replay verification paths must not incorporate fine-tuned model weights (prompt routing only).

## Expected impact

- **Security:** Explicit opt-in, redaction-first export, tenant-scoped registry, audit rows for every export batch.
- **Operations:** New config section `Retrieval:FineTuning`; disabled by default; promotion gate prevents silent model regression.
- **Cost:** Fine-tuning jobs and eval passes consume Azure OpenAI spend; gated by existing tenant LLM budget trackers on completion paths.
- **Teams:** Platform engineers own orchestration; legal/procurement own addendum countersignature; support uses export audit rows for consent disputes.

## Consequences

- **Positive:** TB-594 moves from 0% to a shippable phased foundation aligned with existing retrieval and golden-cohort harnesses.
- **Negative:** Buyer-facing "continuous learning" remains **off by default** until tenant admins opt in and eval promotion succeeds.
- **Follow-ups:** Wire promoted deployment names into agent completion routing; extend golden-cohort nightly workflow to run fine-tuning eval ablations (**TB-595**).

## Related

- [`docs/library/V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.20
- [`docs/library/TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md) **TB-594**
- [`docs/go-to-market/MANIFEST_FINE_TUNING_ADDENDUM.md`](../../go-to-market/MANIFEST_FINE_TUNING_ADDENDUM.md)
- [ADR 0036](0036-graph-rag-embedding-strategy.md) — embedding posture (orthogonal to fine-tuning weights)
- [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md) — tenant isolation
