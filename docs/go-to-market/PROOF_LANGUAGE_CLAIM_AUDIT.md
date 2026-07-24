> **Scope:** Release audit log for **buyer-facing proof packets and demo scripts** — classifies each surface's dominant claim types and confirms no unsupported superlatives. Implements assessment **§17 #7 (Proof-language claim audit)**. Sponsor-generated *output* labels (first-value report, value DOCX, sponsor packet) are audited separately in [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md); this log covers the static buyer-facing **documents**. Not buyer-facing.

# Proof-language claim audit

**Last reviewed:** 2026-06-27 · **Disposition:** PASS (automated scan clean; one superlative fixed this pass).

This audit answers one question for every buyer-facing proof packet and demo script: **is each claim labeled with the kind of backing it actually has, and are unsupported superlatives removed?** It reuses the existing claim guardrails ([`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md), the buyer-surface CI guards) and adds a tight superlative regression guard — it does not restate policy those docs own.

## Claim-type taxonomy (canonical for §17 #7)

Five backing types. Each buyer-facing claim should be reducible to one of them; if it cannot, it is an over-claim and must be softened or labeled.

| Type | Meaning | Canonical backing layer |
| --- | --- | --- |
| **extractor-backed** | Traces to uploaded Azure extractor ZIP evidence (cost/savings cite `manifest.json` `collectionTimestamp` + schema version). | `ProofPacketSourceLabelsBuilder.cs`; board-pack posture `extractor-backed` in `executive-roi-board-pack-evidence-clusters.ts`. |
| **review-backed** | Traces to a finalized review's persisted findings / architecture package / audit rows. | Architecture package (API: golden manifest) + authority chain; `DIFFERENTIATION_PROOF_PACKET.md`. |
| **illustrative** | Demo-derived / sample, explicitly not a customer outcome. | `illustrative` posture; demo-proof-packet labels; `ROI_BASELINE_SEND_POLICY.md` (`demo-derived`). |
| **self-assessed** | Internally attested (e.g. SOC mapping), not third-party issued. | `SOC2_SELF_ASSESSMENT_2026.md`, `trust-center.md`, `PROCUREMENT_PACK_INDEX.md` (`Self-attested`). |
| **roadmap** | Deferred V1.1/V2 capability — stated as planned, never as shipped. | `V1_DEFERRED.md`; `PROCUREMENT_PACK_INDEX.md` (`Deferred`); `WHAT_NOT_TO_PROMISE.md`. |

Governance overlay (orthogonal): AI output is **governed** vs **advisory** per `ai-output-governance-label.ts`; ROI dollar headlines obey the first-value **ROI narrative claim gate** (PASS/WARN/HOLD) — see [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md) Rule 2.

## Audited surfaces (2026-06-27 pass)

Dominant claim types present and the labels that keep them honest. Disposition is **PASS** for all rows after this pass.

| Surface | Dominant claim types | Honest-label anchors |
| --- | --- | --- |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md` | review-backed, self-assessed, roadmap | "does **not** claim", deferred assurance |
| `QUOTE_TO_PROOF_PACKET.md` | review-backed, illustrative, roadmap | ROI basis, send rule |
| `EXECUTIVE_PAID_PILOT_PROOF_PACKET.md` | extractor-backed, review-backed, self-assessed, roadmap | six-element claim-boundary column |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, illustrative, self-assessed | "what we do **not** claim", ROI basis labels |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, extractor-backed | evidence-linked comparison section |
| `EXECUTIVE_SPONSOR_BRIEF.md` | review-backed, illustrative | execution-mode + estimate caveats |
| `FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md` | review-backed, illustrative | bakeoff honesty ("where each wins") |
| `POLICY_TO_DECISION_PROOF_PILOT_RUNSHEET.md` | review-backed, illustrative | "review evidence, not certification" |
| `POLICY_PACK_DELTA_DEMO_SCRIPT.md` | review-backed, illustrative | governance-evidence-not-certification grounding rule |
| `DEMO_VIDEO_SCRIPT.md`, `DEMO_QUICKSTART.md` | illustrative | demo/sample framing |
| `GENERIC_AI_BAKEOFF_PROTOCOL.md` | review-backed, illustrative | honest "where each wins" |
| `CONTROLLED_PILOT_OBJECTION_DRILL.md`, `PROCUREMENT_OBJECTION_PLAYBOOK.md` | self-assessed, roadmap | honest-posture answers |
| `MODEL_SEATS_COUNTER_POSITIONING_TEST.md` | review-backed, self-assessed | grounding rule: "do **not** claim ArchLucid always beats frontier AI" |
| `demo-proof-packets/*.md` | illustrative | sample-not-customer labels |
| `templates/evidence-packet-buyer.template.md` | all five (as columns) | claim-boundary column |

**Patch this pass:** `MODEL_SEATS_COUNTER_POSITIONING_TEST.md` — the grounding-rule sentence "Do **not** claim ArchLucid always beats frontier AI" is correct guidance; the new guard now normalizes markdown emphasis so the bolded `**not**` registers as a caveat (no copy change required). No unsupported superlatives remain in scope.

## Regression guard (new)

`scripts/ci/check_proof_language_superlatives.py` scans the surfaces in `scripts/ci/data/proof_language_audit_scope.v1.json` for a **tight** list of unsupported superlatives (best-in-class, world-class, industry-leading, unmatched, guaranteed savings/ROI, never fails, always beats, 100% accurate, fully compliant, …). A term is flagged **only** when the line carries no caveat/backing marker (do not / without / illustrative / estimate / roadmap / source-labeled / …), and markdown emphasis is normalized first so bolded caveats still count. Common, legitimate terms (e.g. "enterprise-grade", "fastest path") are deliberately excluded to keep the guard trustworthy.

Wired into the buyer-surface bundle (`scripts/ci/run_buyer_surface_strict_guards.py`) and unit-tested in `scripts/ci/tests/test_check_proof_language_superlatives.py`.

## Verification

```powershell
python scripts/ci/check_proof_language_superlatives.py
python -m pytest scripts/ci/tests/test_check_proof_language_superlatives.py
python scripts/ci/run_buyer_surface_strict_guards.py --strict
```

## Residual (human / GTM half)

The automated guard removes unsupported superlatives and the matrix classifies dominant claim types, but **line-level sign-off on borderline comparative/ROI claims and the live buyer reaction** are market-execution. Pair this audit with the procurement objection rehearsal (`GTM_BACKLOG.md` **M-91**) when that window opens; do not treat a green scan as buyer acceptance.

**Cross-refs:** [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) · [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md) · [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md)
