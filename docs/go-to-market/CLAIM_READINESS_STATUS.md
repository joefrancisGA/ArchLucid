> **Reviewed:** 2026-07-24

> **Scope:** Operational G1–G6 status for proof-gated GTM stages. Update after each pilot or release review; not a public marketing page.

# Claim readiness status

**Current authorized stage:** Stage 0 — Controlled pilots

**Last reviewed:** 2026-07-24

## Gate table

| Gate | Signal | Current status | Evidence link | Blocking dependency | Who unblocks |
| --- | --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | **PASS** | [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md); `ExecutionModeCrossSurfaceInvariantTests`; pending harden **TB-951** (sponsor-export mode-label CI) | Spot-check one new committed run after each export formatter change; land **TB-951** before relying on formatter-only discipline | Engineering — re-run audit checklist; complete **TB-951** |
| **G2** | ROI source integrity | **PASS** | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md), proof-packet ROI table | — | — |
| **G3** | Tenant isolation provable | **PASS** | [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md); [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**); **TB-925** Done; pending attachable harness **TB-948** + production-like reject **TB-949** | Attach **TB-948** artifact to security packet when available; confirm **TB-949** on staging/demo hosts before PA reviews | Engineering — **TB-948**/**TB-949**; owner — run Claim 1 in [`PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md`](PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md) (**M-113**) |
| **G4** | Repeatable proof packet | **HOLD** | [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md) | 0 of 3 qualifying real runs logged (**G-REAL-06** / **G-REAL-07** / **M-39**) | Founder/operator — run `collect-first-pilot-proof.ps1` per real pilot |
| **G5** | Live AI evidence | **PASS** | [`artifacts/release/real-llm-evidence-gate.json`](../../artifacts/release/real-llm-evidence-gate.json) (PASS, 2026-06-25, v2 schema, 4/4 agent paths, `executionMode=real`) | RC bundle attach (**G-REAL-08**) before external full-real-mode claim on a cut | **Owner** — attach gate to next RC per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) |
| **G6** | Procurement posture honest | **PASS** | `python scripts/build_procurement_pack.py --dry-run --deal-ready`; deferred items stated in trust pack | — | — |

## Stage exit criteria

- **Stage 1 — Evidence-backed selling** is authorized when **G1–G4** are all **PASS** for **≥3** distinct real pilot runs (see [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md)).
- **Stage 2 — Broad GTM / scale claims** requires **G1–G6** all **PASS** plus ≥1 permissioned public reference (owner-deferred per `V1_DEFERRED.md`).
- **Founder signoff required:** Movement from Stage 0 → Stage 1 requires explicit dated approval by the **founder / release owner** even when technical gates are green. Until approved, status is **HOLD_FOR_OWNER_SIGNOFF**.

## Session workflow

1. After each **real** pilot commit, complete the [operating checklist](PROOF_PACKET_RUN_LOG.md#operating-checklist) and append a row to [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md).
2. Score gates using the readiness checklist appendix below or pilot review notes.
3. Update this table and the proof run log in the same PR or ops note.
4. Run weekly cadence when reviewing G4/G5 posture: [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md) (`.\scripts\Invoke-WeeklyProofCadence.ps1`).
5. Do not advance marketing claims past the highest fully-passed stage ([`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)).
6. Before a principal-architect or security-reviewer tech review, run [`PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md`](PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md) (**M-113**) and hand [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**). After micro-proofs land (**TB-948** harness, **TB-949** probe, **TB-950** UI path, **TB-951** export CI, **TB-886** buyer verify talk track), refresh Evidence / Blocking columns here.

## G5 release-evidence workflow

`G5` is **PASS** when a current `real-llm-evidence-gate.json` reports `overallOutcome=PASS`, `executionMode=real`, and Topology, Cost, Compliance, and Critic agent paths. Last owner run: **2026-06-25** (`Invoke-RealLlmEvidenceGate.ps1` + `Invoke-ReleaseRealModeClaimGate.ps1` → `full-real-mode`). Re-run before each RC cut if the artifact is stale.

1. Generate real-mode evidence when approved credentials are available:

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

2. Copy `real-llm-evidence-gate.json` and `.md` into the release evidence folder before emitting the final bundle.
3. Run `.\scripts\Emit-ReleaseReadinessEvidence.ps1`; the bundle manifest reports `realModeAiEvidence.status`.
4. Keep `G5` as **HOLD** for `MISSING`, `STALE`, or `HOLD`. Use partial-real wording for `WARN`. Advance `G5` only when the release bundle reports `PASS` and the proof run log references the same artifact.

**Cross-refs:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout · tech **TB-886** / **TB-925** / **TB-948**–**TB-951** in [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md)

---

## Appendix: Gate PASS/HOLD criteria

| Gate | Signal | PASS when | HOLD when | Evidence / remediation pointer |
| --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | Every sponsor-facing surface labels `Real`, `Simulator`, `Fallback`, or `Mixed`; PilotStrict HOLD blocks unsafe forwarding | Any unlabeled or mislabeled execution mode in exports/UI | [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md); run-detail and proof-packet tests |
| **G2** | ROI source integrity | No dollar/time claim without `RoiMetricSourceKind` and freshness labels | Synthetic, stale, or missing-source ROI presented as savings | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md); proof-packet ROI table |
| **G3** | Tenant isolation provable | Production-like profiles use scoped Azure Search (or equivalent) with tenant filters on every query/delete | Missing filters, header-only scope, or policy-pack safe-default gaps | [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md); RAG backlog RAG-V1-010 |
| **G4** | Repeatable proof packet | ≥3 distinct real committed runs produced clean, redacted, buyer-safe proof packets | Manual artifact surgery required per run | `collect-first-pilot-proof.ps1`; [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| **G5** | Live AI evidence | Credentialed real-LLM golden-cohort run archived with faithfulness floor | Simulator-only or missing real-mode evidence for AI claims | [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) — owner-run, non-CI-gating |
| **G6** | Procurement posture honest | Trust pack current; deferred items stated as deferred | Placeholder tokens, stale review dates, or implied third-party attestation | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |

## Appendix: Session record template

```text
Date (UTC):
Evaluator:
Run IDs reviewed:
G1 PASS/HOLD — notes:
G2 PASS/HOLD — notes:
G3 PASS/HOLD — notes:
G4 PASS/HOLD — notes:
G5 PASS/HOLD — notes:
G6 PASS/HOLD — notes:
Highest stage authorized:
Next action:
```

## Appendix: Rollout stage exits

| Stage | Exit gate |
| --- | --- |
| **0 — Controlled pilots (now)** | Pilot path end-to-end; proof packet generates; [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) in active use |
| **1 — Evidence-backed selling** | **G1–G4** all **PASS** for ≥3 distinct real pilot runs |
| **2 — Broad GTM / scale claims** | **G1–G6** all **PASS**; ≥1 published/permissioned reference (owner-deferred) |
