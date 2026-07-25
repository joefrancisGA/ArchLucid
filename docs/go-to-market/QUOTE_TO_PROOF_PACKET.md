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
- [ ] [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) reviewed with buyer

### Procurement objections → artifacts

| Objection | Point to |
| --- | --- |
| "Is the AI real?" | [`AI_EVIDENCE_APPENDIX.md`](AI_EVIDENCE_APPENDIX.md) + run provenance footer |
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

- [`demo-proof-packets/ai-governance-demo-proof.md`](demo-proof-packets/ai-governance-demo-proof.md)
- [`demo-proof-packets/azure-saas-readiness-demo-proof.md`](demo-proof-packets/azure-saas-readiness-demo-proof.md)
- [`demo-proof-packets/healthcare-claims-demo-proof.md`](demo-proof-packets/healthcare-claims-demo-proof.md)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) (decision explainability + trust posture)

---

## Related

- [`EXECUTIVE_PAID_PILOT_PROOF_PACKET.md`](EXECUTIVE_PAID_PILOT_PROOF_PACKET.md) — six-element executive packet assembly + mock procurement review
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)
- [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
