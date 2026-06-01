> **Scope:** PASS/HOLD criteria for founder-led pilots. Owner review required before use in any customer-facing commitment.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Pilot acceptance thresholds (PASS / HOLD / DEFERRED_SCOPE)

**Audience:** Founder, pilot operator, sales engineer, and executive sponsor moving from a completed pilot to a commercial recommendation.

**Grounding rule:** Thresholds reference shipped V1 capabilities per [`docs/library/V1_SCOPE.md`](../library/V1_SCOPE.md). Owner must review and sign off on any threshold before it is quoted in a customer-facing commitment or sponsor packet.

**Related:** [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md), [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md), [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md).

---

## 1. Purpose

This document defines the **minimum observable evidence** required to call a pilot PASS, HOLD, or DEFERRED_SCOPE. Thresholds exist so the outcome is judged against pre-agreed criteria, not ad hoc interpretation after results are known.

PASS does not mean "ready for unlimited expansion." It means the pilot evidence is strong enough to support the stated commercial next step.

---

## 2. Outcome definitions

| Outcome | Meaning | Next action |
| --- | --- | --- |
| **PASS** | All required gates met; pilot evidence supports the agreed commercial next step | Proceed to sponsor packet send per [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) |
| **HOLD** | One or more required gates are unmet; evidence is weak, absent, or unsupported | Identify specific gate gap; remediate or negotiate revised scope before claiming success |
| **DEFERRED_SCOPE** | Buyer requirement is not a V1 deliverable (SOC 2 CPA, public reference, live Marketplace, etc.) | Record as V1.1 / V2 item; do not treat as a V1 pilot failure |

---

## 3. Required proof packet quality gate

All three of the following artifacts must exist and be non-empty before PASS:

| Artifact | Minimum content | HOLD trigger |
| --- | --- | --- |
| `go-no-go-summary.md` | `disposition` field is `SEND`; reason text is non-empty | Disposition is `HOLD` or file is absent |
| `first-value-report.md` | At least one committed run with `runId`, manifest id, and committed timestamp | File absent or no committed run |
| Sponsor proof ZIP | Contains run output, finding summary, and ROI basis labels | ZIP absent or empty |

---

## 4. ROI and savings confidence gate

| Condition | Threshold | HOLD trigger |
| --- | --- | --- |
| ROI basis label | Every projected dollar figure must be labeled **buyer-provided**, **defaulted**, **demo-derived**, or **not collected** per [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2.1.1 | Any unlabeled dollar figure |
| ROI projection (target pass) | ≥ 300% annualized using actual pilot numbers | Below 300% → HOLD unless buyer explicitly accepts |
| Buyer-provided baseline | At least one efficiency metric (review hours, architect hours, or evidence assembly hours) confirmed by the buyer | All baselines are defaulted or demo-derived → add caveat label; cannot claim buyer-validated ROI |
| Unsafe basis | No projected figure may be presented without its source label in the sponsor packet | Any unsourced number → HOLD |

---

## 5. Time-to-first-value gate

| Metric | Minimum threshold | HOLD trigger |
| --- | --- | --- |
| Runs reaching "Committed" status during pilot | ≥ 3 successful committed runs | Fewer than 3 committed runs |
| At least one run using buyer or buyer-accepted evidence | Required (not demo-only) | Zero non-demo committed runs → downgrade claim to demo-derived |
| Average run duration | < 10 min (warning), < 15 min (HOLD) | Any run >15 min without documented cause |
| Time from onboarding to first committed run | ≤ 5 business days | Exceeded → document cause; does not auto-block if root cause is buyer environment |

---

## 6. False-positive tolerance gate

| Metric | Target | HOLD trigger |
| --- | --- | --- |
| Architect-assessed false-positive rate | < 30% of findings rated not useful or not applicable | ≥ 30% → HOLD pending finding-engine calibration or policy pack adjustment |
| Explainability trace completeness | ≥ 60% of findings have all 5 `ExplainabilityTrace` fields populated | < 60% → caveat in sponsor packet |
| At least one finding confirms a gap the manual process missed | Required for target PASS | Zero pre-deploy gaps surfaced → downgrade to minimum PASS only |

---

## 7. Proof packet quality score

| Quality level | Conditions | Effect |
| --- | --- | --- |
| **Strong** | Buyer-provided baselines; ≥ 3 committed runs; ≥ 1 confirmed pre-deploy gap; false-positive rate < 20%; ROI projection ≥ 300% on buyer numbers | PASS — supports purchase recommendation |
| **Sufficient** | ≥ 1 buyer-accepted evidence run; baselines labeled (any label); false-positive rate < 30%; go-no-go disposition `SEND` | PASS — supports pilot extension or evidence pack; note label caveats in sponsor narrative |
| **Weak** | All baselines defaulted or demo-derived; no buyer-provided evidence; no confirmed pre-deploy gaps; false-positive rate ≥ 30% | HOLD — sponsor narrative must not imply buyer-validated outcomes; remediate before commercial close |
| **Missing** | Proof artifacts absent or go-no-go disposition is `HOLD` | HOLD — do not send sponsor packet |

---

## 8. Sponsor acceptance gate

Pilot PASS requires explicit sponsor acknowledgment of the following before commercial close:

- [ ] Sponsor has reviewed the proof packet and confirmed the evidence source for each ROI figure.
- [ ] Sponsor understands which metrics are buyer-provided vs. defaulted vs. demo-derived.
- [ ] Sponsor is aware of any HOLD rows in the scorecard and accepts the remediation plan or commercial caveat.
- [ ] Sponsor has not been promised SOC 2 CPA, third-party pen test, public reference customers, live Marketplace, or MCP marketplace as V1 deliverables.

---

## 9. Commercial state mapping

| Pilot quality | Proof state | Commercial closeout state |
| --- | --- | --- |
| Strong | `SEND` + buyer-validated ROI | **Annual Professional / Enterprise order** |
| Sufficient | `SEND` + labeled baselines | **Evidence Pack** or **ARB Report** as bridge to annual |
| Weak | `SEND` with caveats | **Evidence Pack** — resolve before annual conversion |
| Missing / HOLD | `HOLD` | **Re-run pilot phase** — do not advance to commercial close |
| Buyer requires deferred item | Any | **DEFERRED_SCOPE** — record in V1.1/V2 backlog; do not treat as failure |

---

## 10. Owner review requirement

> **These thresholds are model-assisted first-pass defaults. The owner must review and accept these criteria before applying them in any customer-facing commercial close.** Mark specific thresholds as "owner-confirmed" in the pilot run record when accepted.

Owner sign-off date: _______________

Owner name: _______________

Thresholds last reviewed: _______________
