> **Reviewed:** 2026-07-27

> **Scope:** Operational G1–G6 status for proof-gated GTM stages, plus the G4 proof-packet run log and operating checklist (formerly `PROOF_PACKET_RUN_LOG.md`). Update after each pilot or release review; not a public marketing page.

# Claim readiness status

**Current authorized stage:** Stage 0 — Controlled pilots

**Last reviewed:** 2026-07-27

## Gate table {#gate-table}

| Gate | Signal | Current status | Evidence link | Blocking dependency | Who unblocks |
| --- | --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | **PASS** | [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md); `ExecutionModeCrossSurfaceInvariantTests`; pending harden **TB-951** (sponsor-export mode-label CI) | Spot-check one new committed run after each export formatter change; land **TB-951** before relying on formatter-only discipline | Engineering — re-run audit checklist; complete **TB-951** |
| **G2** | ROI source integrity | **PASS** | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md), proof-packet ROI table | — | — |
| **G3** | Tenant isolation provable | **PASS** | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview); [`BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**); **TB-925** Done; pending attachable harness **TB-948** + production-like reject **TB-949** | Attach **TB-948** artifact to security packet when available; confirm **TB-949** on staging/demo hosts before PA reviews | Engineering — **TB-948**/**TB-949**; owner — run Claim 1 in [`BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113`](BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113) (**M-113**) |
| **G4** | Repeatable proof packet | **HOLD** | [`#proof-packet-run-log`](#proof-packet-run-log) | 0 of 3 qualifying real runs logged (**G-REAL-06** / **G-REAL-07** / **M-39**) | Founder/operator — run `collect-first-pilot-proof.ps1` per real pilot |
| **G5** | Live AI evidence | **PASS** | [`artifacts/release/real-llm-evidence-gate.json`](../../artifacts/release/real-llm-evidence-gate.json) (PASS, 2026-06-25, v2 schema, 4/4 agent paths, `executionMode=real`) | RC bundle attach (**G-REAL-08**) before external full-real-mode claim on a cut | **Owner** — attach gate to next RC per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) |
| **G6** | Procurement posture honest | **PASS** | `python scripts/build_procurement_pack.py --dry-run --deal-ready`; deferred items stated in trust pack | — | — |

## Stage exit criteria

- **Stage 1 — Evidence-backed selling** is authorized when **G1–G4** are all **PASS** for **≥3** distinct real pilot runs (see [`#proof-packet-run-log`](#proof-packet-run-log)).
- **Stage 2 — Broad GTM / scale claims** requires **G1–G6** all **PASS** plus ≥1 permissioned public reference (owner-deferred per `V1_DEFERRED.md`).
- **Founder signoff required:** Movement from Stage 0 → Stage 1 requires explicit dated approval by the **founder / release owner** even when technical gates are green. Until approved, status is **HOLD_FOR_OWNER_SIGNOFF**.

## Session workflow

1. After each **real** pilot commit, complete the [operating checklist](#operating-checklist) and append a row to the [proof packet run log](#proof-packet-run-log).
2. Score gates using the readiness checklist appendix below or pilot review notes.
3. Update this table and the proof run log in the same PR or ops note.
4. Run weekly cadence when reviewing G4/G5 posture: [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md) (`.\scripts\Invoke-WeeklyProofCadence.ps1`).
5. Do not advance marketing claims past the highest fully-passed stage ([`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)).
6. Before a principal-architect or security-reviewer tech review, run [`BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113`](BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113) (**M-113**) and hand [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**). After micro-proofs land (**TB-948** harness, **TB-949** probe, **TB-950** UI path, **TB-951** export CI, **TB-886** buyer verify talk track), refresh Evidence / Blocking columns here.

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

## Proof packet run log {#proof-packet-run-log}

Former standalone: `docs/go-to-market/PROOF_PACKET_RUN_LOG.md` → this section (and [operating checklist](#operating-checklist) below).

**G4 target:** ≥3 rows with **Mode = Real**, **Proof packet generated? = Yes**, **Clean = Yes**.

**Weekly rollup:** [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md)

| Run date (UTC) | Tenant | Run ID | Mode (Real/Simulator) | Proof packet generated? | Clean (no manual surgery)? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _example_ | contoso-demo | `00000000-0000-0000-0000-000000000001` | Simulator | Yes | Yes | Format reference only — replace with first real pilot row |

### Operating checklist {#operating-checklist}

#### Role ownership

| Role | Responsibility |
| --- | --- |
| **Pilot operator** | Run proof pipeline after commit; verify buyer-safe artifacts |
| **Founder / release owner** | Append log row; update G4 in the [gate table](#gate-table) |
| **Sales owner** | Block sponsor send when disposition is HOLD or log row missing |
| **Owner** | G5 real-LLM evidence (separate from G4 row discipline) |

#### Per-run checklist (real pilots only)

Complete **within 24 hours** of a committed **Real**-mode review used for GTM evidence.

##### 1. Generate proof packet

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -SponsorHandoff `
  -FailOnHold
```

**Stop if:** exit code ≠ 0 or `go-no-go-summary.json` disposition = `HOLD`.

##### 2. Pre-send gates (all required for **Clean = Yes**)

| Gate | Pass when | HOLD trigger |
| --- | --- | --- |
| **Execution mode** | Exports label **Real** (not Simulator-only for real claim) | Unlabeled or simulator presented as live proof |
| **ROI basis** | `roiSponsorSafe = true` in go-no-go summary | Unlabeled dollar figures |
| **Sponsor disposition** | `disposition = SEND` when sponsor handoff intended | `HOLD` or missing go-no-go |
| **Manual surgery** | Proof folder usable without hand-editing findings/ROI | Required edits to make packet credible |
| **Redaction** | No customer PII, subscription IDs, or raw secrets | Identifying content present |

##### 3. Qualifying row criteria (G4)

| Column | Required value |
| --- | --- |
| Mode | **Real** |
| Proof packet generated? | **Yes** |
| Clean (no manual surgery)? | **Yes** |
| Run ID | Valid committed-run GUID |

**Does not qualify:** Simulator rows, demo-only Contoso runs, rows without proof packet, rows requiring manual surgery.

##### 4. Append log row

Add a row to the [run log table](#proof-packet-run-log) above. Keep the `_example_` simulator row only as format reference — do not count it toward G4.

##### 5. Update G4 gate

In the [gate table](#gate-table): 0–2 qualifying rows → **HOLD**; ≥3 → **PASS** (link three run IDs). Update **Last reviewed** when G4 changes.

#### Sponsor-send gate

Do **not** email sponsor PDF/ZIP until per-run checklist complete, log row appended, `go-no-go-summary.md` = **SEND**, and execution mode visible on first-value report / proof index.

#### Weekly review cadence

**When:** Same weekday each week during active pilots (recommended: Monday UTC). **Owner:** Founder / release owner.

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1
python scripts/ci/validate_weekly_proof_cadence.py --cadence-json artifacts/weekly-proof-cadence/<stamp>/weekly-proof-cadence.json
```

| Step | Action |
| --- | --- |
| 1 | Count qualifying rows (Real + Yes + Yes) |
| 2 | Reconcile with `weekly-proof-cadence.json` G4 row |
| 3 | Update G4 PASS/HOLD in the [gate table](#gate-table) |
| 4 | If G4 still HOLD, schedule next real pilot proof run |
| 5 | Record session in the [claim readiness appendix](#appendix-session-record-template) |

**Stage 1 — Evidence-backed selling** requires G1–G4 **PASS**, ≥3 qualifying rows, and founder dated signoff.

**Cross-refs:** [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)

---

## Appendix: Gate PASS/HOLD criteria

| Gate | Signal | PASS when | HOLD when | Evidence / remediation pointer |
| --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | Every sponsor-facing surface labels `Real`, `Simulator`, `Fallback`, or `Mixed`; PilotStrict HOLD blocks unsafe forwarding | Any unlabeled or mislabeled execution mode in exports/UI | [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise); run-detail and proof-packet tests |
| **G2** | ROI source integrity | No dollar/time claim without `RoiMetricSourceKind` and freshness labels | Synthetic, stale, or missing-source ROI presented as savings | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md); proof-packet ROI table |
| **G3** | Tenant isolation provable | Production-like profiles use scoped Azure Search (or equivalent) with tenant filters on every query/delete | Missing filters, header-only scope, or policy-pack safe-default gaps | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview); RAG backlog RAG-V1-010 |
| **G4** | Repeatable proof packet | ≥3 distinct real committed runs produced clean, redacted, buyer-safe proof packets | Manual artifact surgery required per run | `collect-first-pilot-proof.ps1`; [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| **G5** | Live AI evidence | Credentialed real-LLM golden-cohort run archived with faithfulness floor | Simulator-only or missing real-mode evidence for AI claims | [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) — owner-run, non-CI-gating |
| **G6** | Procurement posture honest | Trust pack current; deferred items stated as deferred | Placeholder tokens, stale review dates, or implied third-party attestation | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |

## Appendix: Session record template {#appendix-session-record-template}

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
| **0 — Controlled pilots (now)** | Pilot path end-to-end; proof packet generates; [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) in active use |
| **1 — Evidence-backed selling** | **G1–G4** all **PASS** for ≥3 distinct real pilot runs |
| **2 — Broad GTM / scale claims** | **G1–G6** all **PASS**; ≥1 published/permissioned reference (owner-deferred) |
