> **Scope:** Operational G1–G6 status for proof-gated GTM stages. Update after each pilot or release review; not a public marketing page.

# Claim readiness status

**Current authorized stage:** Stage 0 — Controlled pilots

**Last reviewed:** 2026-06-25

## Gate table

| Gate | Signal | Current status | Evidence link | Blocking dependency | Who unblocks |
| --- | --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | **PASS** | [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md); `ExecutionModeCrossSurfaceInvariantTests` | Spot-check one new committed run after each export formatter change | Engineering — re-run audit checklist |
| **G2** | ROI source integrity | **PASS** | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md), proof-packet ROI table | — | — |
| **G3** | Tenant isolation provable | **PASS** | [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md); TB-071/072/073 in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) | — | — |
| **G4** | Repeatable proof packet | **HOLD** | [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md) | 0 of 3 qualifying real runs logged | Founder/operator — run `collect-first-pilot-proof.ps1` per real pilot |
| **G5** | Live AI evidence | **PASS** | [`artifacts/release/real-llm-evidence-gate.json`](../../artifacts/release/real-llm-evidence-gate.json) (PASS, 2026-06-25, v2 schema, 4/4 agent paths, `executionMode=real`) | RC bundle attach (**G-REAL-08**) before external full-real-mode claim on a cut | **Owner** — attach gate to next RC per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) |
| **G6** | Procurement posture honest | **PASS** | `python scripts/build_procurement_pack.py --dry-run --deal-ready`; deferred items stated in trust pack | — | — |

## Stage exit criteria

- **Stage 1 — Evidence-backed selling** is authorized when **G1–G4** are all **PASS** for **≥3** distinct real pilot runs (see [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md)).
- **Stage 2 — Broad GTM / scale claims** requires **G1–G6** all **PASS** plus ≥1 permissioned public reference (owner-deferred per `V1_DEFERRED.md`).
- **Founder signoff required:** Movement from Stage 0 → Stage 1 requires explicit dated approval by the **founder / release owner** even when technical gates are green. Until approved, status is **HOLD_FOR_OWNER_SIGNOFF**.

## Session workflow

1. After each **real** pilot commit, complete [`PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md`](PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md) and append a row to [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md).
2. Score gates using [`CLAIM_READINESS_CHECKLIST.md`](CLAIM_READINESS_CHECKLIST.md) or pilot review notes.
3. Update this table and the proof run log in the same PR or ops note.
4. Run weekly cadence when reviewing G4/G5 posture: [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md) (`.\scripts\Invoke-WeeklyProofCadence.ps1`).
5. Do not advance marketing claims past the highest fully-passed stage ([`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)).

## G5 release-evidence workflow

`G5` is **PASS** when a current `real-llm-evidence-gate.json` reports `overallOutcome=PASS`, `executionMode=real`, and Topology, Cost, Compliance, and Critic agent paths. Last owner run: **2026-06-25** (`Invoke-RealLlmEvidenceGate.ps1` + `Invoke-ReleaseRealModeClaimGate.ps1` → `full-real-mode`). Re-run before each RC cut if the artifact is stale.

1. Generate real-mode evidence when approved credentials are available:

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

2. Copy `real-llm-evidence-gate.json` and `.md` into the release evidence folder before emitting the final bundle.
3. Run `.\scripts\Emit-ReleaseReadinessEvidence.ps1`; the bundle manifest reports `realModeAiEvidence.status`.
4. Keep `G5` as **HOLD** for `MISSING`, `STALE`, or `HOLD`. Use partial-real wording for `WARN`. Advance `G5` only when the release bundle reports `PASS` and the proof run log references the same artifact.

**Cross-refs:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout · [`CLAIM_READINESS_CHECKLIST.md`](CLAIM_READINESS_CHECKLIST.md)
