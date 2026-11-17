# SecureNow executive proof packet — template

> **TEMPLATE ONLY.** Empty inputs mean **unproven**. Do not send with claimed customer outcomes until populated with reviewed, authorized evidence. The synthetic demo in [BUYER_PROOF_DEMO.md](BUYER_PROOF_DEMO.md) is not a reference customer.

## Decision summary

- Organization / authorized tenant: **NOT COLLECTED**
- Scope and Azure subscriptions: **NOT COLLECTED**
- Baseline capture ID / timestamp / capture completeness: **NOT COLLECTED**
- Verification capture ID / timestamp / capture completeness: **NOT COLLECTED**
- Key security concern / cited path IDs: **NOT COLLECTED**
- Evidence confidence and limitations: **NOT COLLECTED**
- Recommended advisory cut point and possible tradeoff: **NOT COLLECTED**
- Human-approved external change / attested timestamp: **NOT COLLECTED**
- Verified postcondition and evaluating evidence: **NOT VERIFIED**
- Remaining paths / risks / analysis gaps: **NOT COLLECTED**
- Human decision owner / review date: **NOT COLLECTED**

## Decision and proof

| Claim | Evidence required | Current status |
|---|---|---|
| A consequential path exists | Cited hops in completed capture, weakest provenance and independent ranking dimensions | NOT COLLECTED |
| A particular intervention has leverage | Named cut point and ranked paths affected, without asserting exploitability | NOT COLLECTED |
| The change was implemented | Human attestation and change record outside SecureNow | NOT COLLECTED |
| The security condition was corrected | Later successful capture, completed analysis and substantive passed postcondition | NOT VERIFIED |
| Investigation effort changed | Measured comparable before/after analyst hours and task definition | NOT MEASURED |
| A control is evidenced | Snapshot/verification association plus human analyst disposition | NOT REVIEWED |

## ROI worksheet — measured inputs only

Let B = baseline analyst hours per comparable investigation, A = after-product analyst hours, N = annual comparable investigations, R = fully loaded hourly rate, C = annual product plus operating cost.

- Gross annual analyst capacity value = `max(0, B - A) × N × R`
- Net annual value estimate = `gross value - C`
- ROI ratio = `net value / C` only when **C > 0**.
- Document sample size, confidence limitations, whether savings are recoverable cash or capacity, selection bias, and implementation costs.
- **Never** convert a count of removed paths into dollars or claim avoided breaches without independently supported causal evidence.
- Do not carry ArchLucid architecture-review ROI assumptions over to SecureNow without measurement.

**Input status:** B=NOT COLLECTED, A=NOT COLLECTED, N=NOT COLLECTED, R=NOT COLLECTED, C=NOT COLLECTED. **ROI not calculated.**

## Release claim gate

Before sharing: verify source links and tenancy permission, redact identifiers and secrets, independently review case-specific technical accuracy, label every simulated result, validate procurement and security statements, and obtain sponsor approval for quantified outcomes. No implied SOC 2 certification, third-party penetration-test completion, guaranteed savings, or live Azure mutation.

**Sources:** [buyer demo](BUYER_PROOF_DEMO.md), [SecureNow requirements](SECURENOW_REQUIREMENTS.md), [architecture and evidence guide](../library/customer-facing/SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md). For commercial measurement framing consult [existing ROI model](../go-to-market/ROI_MODEL.md), without reusing its assumptions as SecureNow facts.
