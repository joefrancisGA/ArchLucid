> **Scope:** Reusable PASS/HOLD checklist for proof gates G1–G6 before expanding sales claims. Attach to pilot review notes or release evidence; not a public marketing page.

# Claim readiness checklist (G1–G6)

**Purpose:** Make claim expansion deliberate. A single **HOLD** on **G1–G4** blocks **Stage 1 — evidence-backed selling**. A **HOLD** on **G5–G6** blocks **Stage 2 — broad GTM / scale claims**.

**Distinction:** **`(A)` product readiness** (engineering/product quality) vs **`(B)` procurement realism** (buyer friction that does not reduce `(A)`). This checklist governs **what you may claim in motion**, not the weighted assessment score.

| Gate | Signal | PASS when | HOLD when | Evidence / remediation pointer |
| --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | Every sponsor-facing surface labels `Real`, `Simulator`, `Fallback`, or `Mixed`; PilotStrict HOLD blocks unsafe forwarding | Any unlabeled or mislabeled execution mode in exports/UI | [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md); run-detail and proof-packet tests |
| **G2** | ROI source integrity | No dollar/time claim without `RoiMetricSourceKind` and freshness labels | Synthetic, stale, or missing-source ROI presented as savings | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md); proof-packet ROI table |
| **G3** | Tenant isolation provable | Production-like profiles use scoped Azure Search (or equivalent) with tenant filters on every query/delete | Missing filters, header-only scope, or policy-pack safe-default gaps | [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md); RAG backlog RAG-V1-010 |
| **G4** | Repeatable proof packet | ≥3 distinct real committed runs produced clean, redacted, buyer-safe proof packets | Manual artifact surgery required per run | `collect-first-pilot-proof.ps1`; [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| **G5** | Live AI evidence | Credentialed real-LLM golden-cohort run archived with faithfulness floor | Simulator-only or missing real-mode evidence for AI claims | [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) — **owner-run, non-CI-gating** |
| **G6** | Procurement posture honest | Trust pack current; deferred items (CPA SOC 2, third-party pen test, live commerce) stated as deferred | Placeholder tokens, stale review dates, or implied third-party attestation | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |

## Rollout stage exit criteria

| Stage | Exit gate |
| --- | --- |
| **0 — Controlled pilots (now)** | Pilot path end-to-end; proof-packet generates; **`WHAT_NOT_TO_PROMISE.md`** in active use |
| **1 — Evidence-backed selling** | **G1–G4** all **PASS** for ≥3 distinct real pilot runs |
| **2 — Broad GTM / scale claims** | **G1–G6** all **PASS**; ≥1 published/permissioned reference (owner-deferred) |

## Session record (copy per pilot or release)

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

**Cross-refs:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout · [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) · assessment improvements in `docs/assessments/LATEST_GPT55.md` §9 (reference only — not a shipping truth source).
