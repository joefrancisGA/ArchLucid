> **Reviewed:** 2026-07-25

> **Scope:** Sales-led packet index for moving from first-pilot proof to annual order readiness. Not legal advice, pricing authority, or procurement attestation.

# Quote-to-proof packet

**Audience:** founders, sales engineers, and sponsor owners after a guided Readiness Review when the buyer is ready to discuss **Evidence Pack**, **ARB Report**, or an **annual Professional / Enterprise order form**.

**Last reviewed:** 2026-07-25

**Canonical conversion checklist:** [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) (send/hold/defer rules).  
**Pre-pilot quote motion:** See **Pre-pilot quote pack** below (quote → pilot start).

**Prices:** link to [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) — do not duplicate list prices here unless already published.

**Readiness boundary:** Pricing discounts for trust, reference participation, or procurement friction are commercial choices. They do not mean `(A)` product readiness is blocked by SOC 2 CPA, third-party pen-test publication, live commerce, or public reference customers.

---

## Founder-led offer menu (after first credible review)

**Recommended first purchase:** Architecture Review Pilot (service-led or SaaS trial) — one finalized review with a sponsor-safe proof packet (`buyer-proof-pack` or `pilot proof-packet`). Deliverable: first-value report + proof summary + explicit limitations + trust pointer.

| Motion | Buyer gets | Proof required |
| --- | --- | --- |
| SaaS subscription (team tier) | Self-serve tenant + architect workspace | Finalized review + proof packet; demo labeled if simulator-only |
| Service-led Architecture Review | Facilitated review + export pack | Same proof packet + optional `-SponsorHandoff` rollup |
| Annual conversion | Expanded seats + governance | ROI source classification **Strong** or explicit assumption labels |

### Pilot deliverables (send gate)

- [ ] Committed run id and manifest version in proof packet
- [ ] Structural execution mode labeled (Real / Simulator / Fallback / Mixed)
- [ ] ROI lines show source kind (`CustomerProvided` vs `BenchmarkAssumption`)
- [ ] Redaction reviewed before external email
- [ ] [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) reviewed with buyer

### Procurement objections → artifacts

| Objection | Point to |
| --- | --- |
| "Is the AI real?" | [`AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory`](AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory) + run provenance footer |
| "What is ROI based on?" | First-value report **ROI and cost source classification** section |
| "SOC 2 / pen test?" | Trust Center + deferred assurance wording |
| "Integrations?" | V1 REST/CLI/UI/SCIM/extractor — V1.1 connectors labeled deferred |

### Next commercial action

1. Send proof packet (not a slide deck alone).
2. Schedule 30-minute decision review using **Sponsor first-page status** table.
3. Log quote follow-up SLA per internal sales workflow.

---

## When to use this packet

Use this index **after** `./scripts/collect-first-pilot-proof.ps1` (with `-RunId` when a finalized review exists) and before asking for annual conversion. Do not treat a vague demo click-through as proof — either buyer evidence or an **explicitly accepted demo workspace** must be labeled.

The proof pipeline emits a generated companion at **`quote-to-proof-packet.md`** inside the proof folder; this document is the stable buyer-safe index that row maps to.

---

## Packet checklist (first proof → quote)

| # | Artifact | Where it lives | Send rule | Owner |
| --- | --- | --- | --- | --- |
| 1 | Sponsor proof ZIP / evidence bundle | `first-pilot-evidence/` from [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) | Required for sponsor send; disposition must not be `HOLD` | ArchLucid |
| 2 | First-value report | `first-pilot-evidence/first-value-report.md` (+ optional PDF) | ROI sections must show basis labels; demo-derived values must not read as buyer outcomes | ArchLucid |
| 3 | Pilot success scorecard | [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Complete baselines or explicit `not collected` before leadership readout | Buyer + ArchLucid |
| 4 | ROI basis labels | `go-no-go-summary.json` → `roiBasisStatus`, `roiSponsorSafe` | Must be sponsor-safe before projected dollars lead the conversation | ArchLucid |
| 5 | Procurement pack status | `procurement-deal-ready-check.txt` from `python scripts/build_procurement_pack.py --dry-run --deal-ready` | **Deal-ready disposition: PASS** before procurement reviewers receive the packet | ArchLucid |
| 6 | Route/tier/policy/nav parity | `route-tier-policy-nav-parity.md` | PASS when commercial boundary changed recently | ArchLucid |
| 7 | Demo workspace validation (when demo is the evidence source) | `demo-workspace-validation.txt` from `./scripts/verify-demo-workspace.ps1` | PASS or documented HOLD before demo-led sponsor send | ArchLucid |
| 8 | Selected tier + order form pointer | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) after tier is agreed | Use only after sponsor accepts the evidence packet; prices live in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §4 | Sales owner |
| 9 | Deferred buyer requirements | `go-no-go-summary.json` → `deferredScopeReasons` | Record V1.1/V2/(B) items (SOC 2 CPA, reference customer, marketplace, MCP, connectors) without implying they block V1 proof | Sales + buyer |

---

## Annual order readiness vs deferred scope

| Class | Examples | Rule |
| --- | --- | --- |
| **Annual order readiness (V1)** | Sponsor proof ZIP, labeled ROI, scorecard baselines, procurement deal-ready PASS, route/tier/nav PASS, agreed tier + order form | May proceed to annual conversion conversation when `go-no-go-summary.json` disposition is **`SEND`** and ROI is sponsor-safe |
| **Deferred (not V1 blockers)** | CPA SOC 2 report, public reference customer, live Stripe/marketplace checkout, MCP, V1.1 ITSM/chat/docs connectors | Mark **`DEFERRED_SCOPE`** in proof when otherwise ready; do not present as missing V1 product scope |

---

## Commands (regenerate proof rows)

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl https://your-api.example -RunId <runId> -SponsorHandoff
./scripts/verify-demo-workspace.ps1 -BaseUrl https://your-api.example
python scripts/build_procurement_pack.py --dry-run --deal-ready
python scripts/ci/assert_route_tier_policy_nav.py
```

---

## Readiness checklist

Use after a finalized review. Each row is PASS / WARN / HOLD / DEFERRED_SCOPE; deferred procurement items do not reduce V1 product-readiness language.

| Check | PASS when | HOLD when |
| --- | --- | --- |
| Run finalized | `run-evidence.json` shows finalized architecture package and status | Run is in progress or finalize/`commit` failed |
| Proof disposition | `quote-to-proof-readiness.json` is `PASS` | `HOLD` or demo tenant warning |
| ROI source basis | `roiBasisStatus: classified` for dollar claims | Missing, synthetic, or stale source |
| Redaction manifest | `redaction-manifest.json` is `PASS` | `NOT_APPLIED`; do not send externally |
| Execution mode | `environment.json` labels structural execution mode | Mode missing or ambiguous |
| Limitations | `limitations.md` reviewed | Skipped gates are unknown |
| Audit and traceability | Audit summary and sample IDs are present | No audit rows without a truncation explanation |

Follow up within **7 days** of quote request. PASS schedules a 30-minute sponsor review; HOLD resolves limitations first. Do not promise CPA SOC 2, a third-party pen-test report, live Marketplace/Stripe checkout, public references, or first-party ITSM/chat connectors.

## Pre-pilot quote pack

**Default first offer:** **Readiness Review** — a low-commitment route to evidence.

| Deliverable | Owner | Evidence |
| --- | --- | --- |
| Environment readiness + first finalized review | Joint | [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| First-value / sponsor report | ArchLucid | `GET …/first-value-report` |
| Pilot scorecard baseline + close-out | Joint | [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) |
| Buyer-safe evidence bundle | ArchLucid | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |

Before work starts, agree the SQL/auth or hosted-staging shape, Tier 1 Azure extractor ZIP or explicit demo acceptance, named architect and sponsor, and architect-hours baseline. The conversion route remains **Readiness Review → Evidence Pack or ARB Report → annual Professional / Enterprise order form**. Pricing is canonical in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md); use [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) after the first finalized review.

---

## Self-serve demo proof walkthroughs (no founder narration)

Use when the buyer needs a labeled path from sample request → finalized architecture package → explainability without a live session:

- [`buyer-jobs/AI_GOVERNANCE_REVIEW.md`](buyer-jobs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only)
- [`buyer-jobs/AZURE_SAAS_READINESS.md`](buyer-jobs/AZURE_SAAS_READINESS.md#demo-proof-shape-demo-derived-only)
- [`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md#demo-proof-shape-demo-derived-only)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) (decision explainability + trust posture)

---

## Executive paid-pilot proof packet (assembly + mock procurement review) {#executive-paid-pilot-proof-packet-assembly--mock-procurement-review}

**Audience:** Founder / pilot operator / sales engineer preparing a **paid** executive sponsor packet and rehearsing it before a real procurement call.

**Goal:** Turn one finalized review into the six-element executive proof packet, then pressure-test it in a mock procurement review **before** sending. Market-validation tooling (V1 design half); running it on real authorized data is GTM backlog **M-37 (V1.1)**. Assessment Improvement **#4**.

### Six required elements → canonical owners

| # | Required element | Canonical source / command | Claim boundary |
| --- | --- | --- | --- |
| 1 | **ROI assumptions** | `executive-summary.json` + [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) + [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Lead with dollars only when `roiSponsorSafe=true` |
| 2 | **Freshness labels** | `go-no-go-summary.json` → `roiBasisStatus`; [`ROI_BASELINE_SEND_POLICY.md`](ROI_BASELINE_SEND_POLICY.md) | Demo-derived values must not read as buyer outcomes |
| 3 | **Cited evidence** | `provenance-references.json` + [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) | Evidence-linked claims only |
| 4 | **Disposition basis** | `go-no-go-summary.json` → `sponsorPacketDisposition` | Do not upgrade `HOLD`/`WARN` |
| 5 | **Audit timeline** | `provenance-references.json` + [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) | Ids only, no payloads or PII |
| 6 | **One remediation ticket** | ITSM outbound create → `ItsmFindingCorrelations` reference | Reference only; never paste ticket bodies with customer identifiers |

Elements 1–5 come from `archlucid sponsor-packet` / `collect-first-pilot-proof.ps1 -SponsorHandoff` ([`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)). Element 6 is an explicit operator step.

### Assembly steps

**1 — Assemble**

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<committed-run-guid>' -SponsorHandoff -FailOnHold
```

Stop if exit code ≠ 0 or disposition = `HOLD`.

**2 — Remediation ticket (element 6)**

| Action | Detail |
| --- | --- |
| Create one ticket | `POST /v1/integrations/itsm/outbound/issues` for one committed `FindingId` |
| Capture reference | Persisted correlation id / external key — **reference only** |
| If ITSM not configured | Copy/export fallback; label element 6 **`fallback-export`** |

**3 — Pre-send gate**

- [`CLAIM_READINESS_STATUS.md#operating-checklist`](CLAIM_READINESS_STATUS.md#operating-checklist)
- [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md#appendix--sendno-send-hardening-review-2026-06-16)

**4 — Mock procurement review**

1. Hand the packet to an internal reviewer playing procurement/security.
2. Run the [controlled pilot drill](PROCUREMENT_OBJECTION_PLAYBOOK.md#controlled-pilot-drill) focused on objections **#1**, **#2**, **#8**, and real-mode AI evidence boundaries.
3. Walk the six elements against the [evidence routing map](BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map).
4. Record every objection the packet could **not** answer from existing evidence.

### PASS / HOLD (mock review)

| Outcome | Criteria |
| --- | --- |
| **PASS** | All six elements present/labeled; send gate PASS; mock reviewer reaches a sponsor decision using only packet evidence; deferred `(B)` items accepted as scope |
| **HOLD** | Required element missing/unlabeled, send gate HOLD, or an objection needs a new claim |

Market-execution (real authorized run + human mock review + [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md)) remains **M-37**.

---

## Related

- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)
- [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)
