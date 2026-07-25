> **Reviewed:** 2026-07-25

> **Scope:** Buyer-safe addendum format for pilot proof packets — explicit decision-change framing only; not customer-identifying proof.

# Decision-change addendum

**Audience:** Founder / delivery lead attaching decision-delta evidence to a sponsor proof packet or paid-pilot handoff.  
**Companion template:** [`templates/decision-change-addendum.template.md`](templates/decision-change-addendum.template.md)  
**Execution tracked as:** GTM backlog **M-45 (V1.1)** — populating with real sponsor interviews requires live handoffs; this format is the V1 design half.

This addendum bridges **technical findings** to **executive decisions** without inventing outcomes. It complements the proof ZIP, first-value report, and [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) — it does not replace them.

---

## When to attach

| Trigger | Attach to |
| --- | --- |
| Sponsor proof pack sent on a **paid** or design-partner pilot | Proof folder alongside `first-value-report.md` |
| Bakeoff session with decision-delta PASS or WARN | `artifacts/bakeoff/<label>/` next to `decision-delta.md` |
| Paid-pilot ledger row filed | Cross-ref from [`PAID_PILOT_EVIDENCE_LEDGER.md`](PAID_PILOT_EVIDENCE_LEDGER.md) `decisionChanged` |

Copy the template per handoff. **Do not** attach externally until sponsor-safe redaction rules below are satisfied.

---

## Required sections (no fabricated data)

### 1. Original decision path (counterfactual)

What would the sponsor or ARB have done **without** ArchLucid on this packet?

| Field | Placeholder / rule |
| --- | --- |
| `counterfactualDecision` | e.g. _"Approve with standard conditions"_ / _"Defer pending security review"_ |
| `counterfactualBasis` | Participant-stated or documented pre-ArchLucid position — **no inference without source** |
| `manualAiPassSummary` | One sentence: what the participant's own frontier-AI pass would have produced (from interview Q4) |

If unknown, write **`not captured`** — do not invent a counterfactual.

### 2. ArchLucid-influenced delta

What changed because of ArchLucid output?

| Field | Placeholder / rule |
| --- | --- |
| `deltaSummary` | One sentence — approval, deferral, scope change, budget shift, or new condition |
| `findingIds[]` | IDs that drove the delta (minimum one for PASS) |
| `deltaCategory` | `approval-changed` \| `scope-changed` \| `timeline-changed` \| `budget-changed` \| `risk-elevated` \| `confirmatory-only` |
| `notInManualPass` | **Y / N** — PASS requires **Y** with named finding(s) |

If outputs were confirmatory only, set `deltaCategory: confirmatory-only` and `decisionDeltaOutcome: WARN`.

### 3. Confidence and evidence references

| Field | Placeholder / rule |
| --- | --- |
| `confidenceLevel` | `high` \| `medium` \| `low` |
| `confidenceRationale` | Why this level — verbatim sponsor quote + observable action = high; inferred = medium; facilitator guess = low |
| `evidenceRefs[]` | Manifest id, finding id(s), audit/event refs, or proof-packet paths — **no raw infra identifiers** |
| `executionMode` | `real` \| `simulator` \| `mixed` — required on any external excerpt |
| `decisionDeltaOutcome` | `pass` \| `warn` \| `fail` per [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) |

### 4. Sponsor-safe caveats (mandatory)

Include **all** that apply — never omit execution-mode or ROI basis warnings.

| Caveat | Text pattern |
| --- | --- |
| Execution mode | _"Findings produced under **{Real/Simulator/Mixed}** execution; sponsor materials label evidence basis accordingly."_ |
| ROI basis | _"ROI figures in the attached packet use **{buyer-reported / model-default / demo-derived / not collected}** labels — see first-value report."_ |
| Confirmatory-only | _"ArchLucid outputs confirmed prior judgment; no net new approval condition documented."_ |
| Interview timing | _"Decision delta captured within 7 days of handoff per internal protocol."_ |
| External quote | _"Verbatim sponsor language used only with documented permission."_ |

---

## Usage instructions

1. Complete [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) within **7 days** of sponsor handoff.
2. Copy [`templates/decision-change-addendum.template.md`](templates/decision-change-addendum.template.md) to `artifacts/paid-pilot-ledger/<pilot-label>/decision-change-addendum.md` (or bakeoff folder).
3. Fill placeholders from interview answers — **never** backfill a PASS without `notInManualPass: Y` and at least one `findingId`.
4. Merge `decisionDeltaOutcome` into [`PAID_PILOT_EVIDENCE_LEDGER.md`](PAID_PILOT_EVIDENCE_LEDGER.md) when the pilot is paid.
5. For external use: strip customer names, subscription IDs, and unauthorized dollar figures; keep category + outcome + execution mode only.

---

## Redaction rules

| Allowed in committed/sponsor excerpts | Never include |
| --- | --- |
| Sanitized pilot label, finding category, severity | Customer legal name, DBA, domain |
| Decision outcome enums, delta category | Employee names (unless permissioned quote) |
| Execution mode, confidence level | Unauthorized ROI dollar amounts |
| Finding IDs (internal reference) | Raw subscription or tenant identifiers |

Store full addenda locally. Commit only sanitized aggregates per [`../validation-runs/README.md`](../validation-runs/README.md).

---

## Related assets

| Asset | Role |
| --- | --- |
| [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) | Source interview — feeds all four sections |
| [`PAID_PILOT_EVIDENCE_LEDGER.md`](PAID_PILOT_EVIDENCE_LEDGER.md) | Conversion rollup — `decisionChanged` field |
| [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) | Proof packet context |
| [`../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) | Sponsor handoff bundle |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-45** | Live interview + addendum population (V1.1) |
