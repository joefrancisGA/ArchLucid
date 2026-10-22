> **Reviewed:** 2026-07-25

# Decision-change addendum — {{pilotLabel}}

> Copy this template per sponsor handoff. Replace `{{placeholders}}`. Do not fabricate outcomes. See [`QUOTE_TO_PROOF_PACKET.md#decision-change-addendum`](../../QUOTE_TO_PROOF_PACKET.md#decision-change-addendum) (`PAID_PILOT_EVIDENCE_LEDGER.md` alias).

**Run id:** {{runId}}  
**Handoff date (UTC):** {{handoffUtc}}  
**Interviewer:** {{interviewerInitials}}  
**Execution mode:** {{real | simulator | mixed}}

---

## 1. Original decision path (counterfactual)

**Counterfactual decision:** {{e.g. Approve with standard conditions / Defer pending security review / not captured}}

**Counterfactual basis:** {{participant-stated pre-ArchLucid position — source required}}

**Manual frontier-AI pass summary:** {{one sentence from interview Q4 — or not captured}}

---

## 2. ArchLucid-influenced delta

**Delta summary:** {{one sentence}}

**Finding IDs:** {{findingId-1}}, {{findingId-2}}

**Delta category:** {{approval-changed | scope-changed | timeline-changed | budget-changed | risk-elevated | confirmatory-only}}

**Not in manual pass:** {{Y | N}}

**Decision-delta outcome:** {{pass | warn | fail}}

---

## 3. Confidence and evidence references

**Confidence level:** {{high | medium | low}}

**Confidence rationale:** {{one sentence}}

**Evidence refs:**

- Manifest: {{goldenManifestId}}
- Findings: {{findingId list}}
- Proof packet: {{path or filename — no secrets}}

---

## 4. Sponsor-safe caveats

- [ ] Execution mode labeled: **{{Real/Simulator/Mixed}}**
- [ ] ROI basis labeled per first-value report: **{{buyer-reported | model-default | demo-derived | not collected}}**
- [ ] Confirmatory-only caveat included if applicable
- [ ] No customer-identifying content in this file
- [ ] External quote permission documented if verbatim language used

**Additional caveats:** {{optional free text — redacted}}
