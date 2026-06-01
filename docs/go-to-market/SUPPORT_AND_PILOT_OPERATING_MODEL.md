> **Scope:** Support posture and pilot operating model for V1 controlled pilots. Defines what pilot buyers can expect from ArchLucid in terms of support, escalation, and incident communication. Not a formal SLA document until owner-approved and executed in a contract.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Support and pilot operating model

**Audience:** Pilot buyer champions, executive sponsors, architecture team leads, and operator teams evaluating or running a V1 controlled pilot.

**Last reviewed:** 2026-06-01

**Related:** [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md), [`docs/runbooks/TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md), [`TRUST_CENTER.md`](TRUST_CENTER.md), [`LEGAL_PROCUREMENT_TERMS_PACKET.md`](LEGAL_PROCUREMENT_TERMS_PACKET.md).

---

## 1. Pilot posture: white-glove founder-led

V1 pilots operate under a **white-glove, founder-led support posture**. The founder is the primary point of contact for onboarding, configuration, and issue resolution. This model is intentional: it maximizes evidence quality and minimizes first-pilot friction, but it does not scale to dozens of simultaneous pilots without additional staffing.

**What this means for buyers:**
- You have direct access to the founder/operator for questions, configuration, and feedback.
- Issues escalate directly without a tiered support queue.
- Response times are faster than a typical SaaS support portal but depend on the founder's availability.

**What this does not mean:**
- It is not a 24×7 NOC.
- It does not imply a formal enterprise SLA unless one is negotiated and executed in the contract.

---

## 2. Support hours and contact

| Item | V1 pilot posture |
| --- | --- |
| Support hours | Business hours — Monday through Friday, 9 AM–6 PM Eastern |
| Critical-issue response | Reasonable-effort same business-day response for P1 issues |
| Primary channel | Email or agreed async channel (Slack shared channel where configured) |
| Owner-availability during pilot | Founder available for weekly check-in call and async within support hours |
| After-hours coverage | Reasonable-effort for P1 confirmed incidents; no contractual obligation outside business hours |

> **Procurement claim guardrail:** Do not quote "24×7 support" or a specific uptime SLA percentage in buyer materials without owner approval.

---

## 3. Response-time targets (pilot-only)

These targets apply to V1 controlled pilots. They are not a published GA SLA.

| Priority | Definition | Initial response target | Update cadence |
| --- | --- | --- | --- |
| **P1 — Critical** | Pilot completely blocked; no runs can complete; data breach suspected | Same business day | Every 4 hours until resolved |
| **P2 — High** | Core workflow degraded; runs complete but results are incorrect or partially missing | Within 2 business days | Daily update while active |
| **P3 — Medium** | Non-blocking issue; workaround exists; UI cosmetic or documentation gap | Within 5 business days | Weekly update while active |
| **P4 — Low** | Enhancement request; informational question | Best effort; addressed in next pilot check-in | N/A |

> **Owner approval required** before quoting these targets in a contract or order form.

---

## 4. Escalation path

| Step | Trigger | Action |
| --- | --- | --- |
| 1 — Buyer champion contacts founder | Any issue | Send email or agreed-channel message with issue description and priority |
| 2 — Founder acknowledges | Within response target | Founder confirms receipt and initial assessment |
| 3 — Root-cause investigation | P1 or P2 | Founder engages relevant engineering context; shares interim findings |
| 4 — Resolution or workaround | All priorities | Founder documents resolution, workaround, or "no fix in V1" with explanation |
| 5 — Post-incident review (P1 only) | After P1 resolution | Brief written summary of cause, resolution, and preventative action where applicable |

---

## 5. Incident communications

| Scenario | Communication protocol |
| --- | --- |
| Service disruption affecting pilot environment | Notify buyer champion within 4 business hours of confirmed impact |
| Data confidentiality incident (suspected or confirmed) | Notify buyer executive sponsor within 24 hours; provide written incident summary within 72 hours |
| Degraded performance (not blocking) | Notify at next scheduled check-in unless buyer requests faster updates |
| Planned maintenance | 48-hour advance notice via agreed channel |

**Full incident communications policy:** [`INCIDENT_COMMUNICATIONS_POLICY.md`](INCIDENT_COMMUNICATIONS_POLICY.md).

---

## 6. Pilot operating rhythm

| Cadence | Activity | Artifact produced |
| --- | --- | --- |
| **Pre-pilot (week 0)** | Onboarding call; environment configuration; policy pack setup; baseline metric collection | Intake checklist completed; first run target set |
| **Weekly check-in** | Review run results; address open issues; adjust configuration if needed | Meeting notes in agreed channel |
| **Midpoint review (week 3)** | Qualitative interviews per [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §3; scorecard midpoint fill | Midpoint qualitative scores captured |
| **End-of-pilot review (week 6)** | Final scorecard; ROI calculation; sponsor packet preparation | Proof bundle, `go-no-go-summary.md`, `first-value-report.md` |
| **Commercial close conversation** | Walk through [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) | Commercial state recorded (SEND / HOLD / DEFERRED_SCOPE) |

---

## 7. Self-serve resources

Pilot buyers should be aware of the following self-serve resources before escalating to the founder:

| Resource | Purpose |
| --- | --- |
| [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) | Step-by-step first-pilot operator guide |
| [`docs/runbooks/TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md) | Common issues and resolutions |
| [`docs/go-to-market/DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md) | Quick-start for demo workspace validation |
| API documentation | Swagger/OpenAPI spec available at `/swagger` endpoint |

---

## 8. What is pilot-only vs. generally available vs. not offered

| Item | V1 pilot posture | Generally available (GA) | Not offered |
| --- | --- | --- | --- |
| White-glove onboarding | Pilot-only | Post-V1.1 tiered plan | — |
| Weekly founder check-in | Pilot-only | Not GA — scales with dedicated CS | — |
| P1 same-business-day response | Pilot only (draft) | Requires negotiated enterprise SLA | — |
| 24×7 NOC / on-call | — | — | Not offered in V1 |
| Formal uptime SLA % | — | Post-V1 owner decision | — |
| Self-serve support portal | — | V1.1+ roadmap | — |
| Dedicated CSM | — | V1.1+ | — |

---

## 9. Support model links to proof bundle

At pilot end, the support operating model connects to the proof bundle as follows:

- Open or unresolved P1/P2 issues at pilot end → flag in `go-no-go-summary.md` as potential HOLD signal.
- Support interaction log (anonymized) can be included in sponsor proof ZIP as evidence of responsiveness.
- Incident post-incident reviews (if any) are included in the first-pilot evidence bundle at buyer's option.

See [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) for how open issues affect the PASS/HOLD outcome.

---

## 10. Honest posture statement (for buyer materials)

> ArchLucid V1 is a controlled pilot product with founder-led, white-glove support. We are not a 24×7 enterprise support organization yet. What we offer pilots is direct founder access, fast escalation, and evidence-backed remediation. If your procurement requires a formal SLA percentage, 24×7 NOC, or enterprise support tier, those are items for a future contract negotiation after the pilot validates value.
