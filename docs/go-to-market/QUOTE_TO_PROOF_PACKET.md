> **Scope:** Sales-led packet index for moving from first-pilot proof to annual order readiness. Not legal advice, pricing authority, or procurement attestation.

# Quote-to-proof packet

**Audience:** founders, sales engineers, and sponsor owners after a guided Readiness Review when the buyer is ready to discuss **Evidence Pack**, **ARB Report**, or an **annual Professional / Enterprise order form**.

**Canonical conversion checklist:** [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) (send/hold/defer rules).  
**Pre-pilot quote motion:** See **Pre-pilot quote pack** below (quote → pilot start).

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
| Environment readiness + first committed review | Joint | [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| First-value / sponsor report | ArchLucid | `GET …/first-value-report` |
| Pilot scorecard baseline + close-out | Joint | [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) |
| Buyer-safe evidence bundle | ArchLucid | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |

Before work starts, agree the SQL/auth or hosted-staging shape, Tier 1 Azure extractor ZIP or explicit demo acceptance, named operator and sponsor, and architect-hours baseline. The conversion route remains **Readiness Review → Evidence Pack or ARB Report → annual Professional / Enterprise order form**. Pricing is canonical in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md); use [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) after the first committed review.

---

## Self-serve demo proof walkthroughs (no founder narration)

Use when the buyer needs a labeled path from sample request → committed manifest → explainability without a live session:

- [`demo-proof-packets/ai-governance-demo-proof.md`](demo-proof-packets/ai-governance-demo-proof.md)
- [`demo-proof-packets/azure-saas-readiness-demo-proof.md`](demo-proof-packets/azure-saas-readiness-demo-proof.md)
- [`demo-proof-packets/healthcare-claims-demo-proof.md`](demo-proof-packets/healthcare-claims-demo-proof.md)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) (decision explainability + trust posture)

---

## Related

- [`EXECUTIVE_PAID_PILOT_PROOF_PACKET.md`](EXECUTIVE_PAID_PILOT_PROOF_PACKET.md) — six-element executive packet assembly + mock procurement review
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)
- [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
