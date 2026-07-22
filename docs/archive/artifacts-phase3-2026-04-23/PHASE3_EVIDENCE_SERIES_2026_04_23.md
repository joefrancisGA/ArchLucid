> **Reviewed:** 2026-07-22
> **Scope:** Phase 3 strangler exit-gate verification + PR A2 cohort parity evidence (historical). Live gate table: [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md).

# Phase 3 evidence series — 2026-04-23

Consolidates the former `gate-verification.md` and `pr-a2-cohort-parity.md` receipts from this folder. Path-stable stubs remain at [`docs/evidence/phase3/`](../../evidence/phase3/) for ADR and changelog links.

---

## Gate verification (historical snapshot)

This document anchors **mechanical verification** notes for ADR 0021 Phase 3 exit gates when [ADR 0022](../../architecture/adrs/0022-coordinator-phase3-deferred.md) recorded blocked or deferred state.

### Path note

Checked-in narrative evidence for Phase 3 lives under **`docs/evidence/phase3/`**. Do not move these files to **`docs/artifacts/`** — the repository `.gitignore` entry **`artifacts/`** matches that folder name anywhere in the tree, so CI would never see the files and `scripts/ci/check_doc_links.py` would fail on every run.

### Current posture (2026-04-22 onward)

Strangler work is re-scoped under [ADR 0030](../../architecture/adrs/0030-coordinator-authority-pipeline-unification.md); pre-release waivers for gates **(i)** and **(iv)** are recorded in [ADR 0029](../../architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md). Use [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) for the live gate table and [§PR A2 cohort parity evidence](#pr-a2-cohort-parity-evidence) below for PR A2 cohort evidence.

### Why this section remains

Older changelog and ADR prose link here; keeping stable paths avoids churn in `check_doc_links` and preserves audit trail for “what was verified when Phase 3 was still framed as a single PR A.”

---

## PR A2 cohort parity evidence

Human-readable summary of cohort parity evidence (coordinator vs authority commit path). Linked from [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) and [`CHANGELOG.md`](../../CHANGELOG.md).

This file is the **checked-in narrative** companion to integration tests that prove the `Coordinator:LegacyRunCommitPath` **true** vs **false** factories produce aligned outcomes for the golden-cohort simulator create → execute → commit path.

### Where the mechanical proof lives

- **Tests:** `ArchitectureRunCommitPathParityIntegrationTests` in `ArchLucid.Api.Tests` (identical **traceability-bundle.zip** entry names; stable **`PilotRunDeltasResponse`** fields: findings-by-severity histogram, audit row count + truncation flag, LLM call count, demo flag, top severity string).
- **Composition:** `ServiceCollectionExtensionsCompositionResolveTests` resolves `IArchitectureRunCommitOrchestrator` → `RunCommitPathSelector` as appropriate for the host.

### Intentionally out of scope for bit-identical asserts

Clocks, seconds-to-commit, `topFindingId`, and evidence-chain pointers may differ between paths; do not use them as parity keys.

### Maintenance

Update this summary when the parity test matrix or stable-field contract changes so reviewers and the parity runbook stay aligned.
