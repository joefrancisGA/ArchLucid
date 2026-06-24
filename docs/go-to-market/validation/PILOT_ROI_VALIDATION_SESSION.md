> **Scope:** Founder / delivery lead runbook for a 15-minute pilot ROI validation conversation — market validation, not new ROI math.

# Pilot ROI validation session

**Audience:** Operator or founder before external sponsor handoff on a paid pilot.  
**Companion UI:** Pilot ROI validation handoff card on review detail and `/value-report/pilot`.  
**Evidence ledger:** [`PAID_PILOT_EVIDENCE_LEDGER.md`](PAID_PILOT_EVIDENCE_LEDGER.md) · [`templates/paid-pilot-evidence-ledger.template.json`](templates/paid-pilot-evidence-ledger.template.json)  
**ROI model:** [`../../library/PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md)

This session converts persisted proof signals into **observable purchase proof** — did the pilot change a decision, and can ROI claims be quoted externally without overreach?

---

## 15-minute agenda

| Minutes | Activity |
| --- | --- |
| 0–3 | Read persisted signals on the handoff card: ROI confidence, execution mode, sponsor-safe dollar gate, sendability |
| 3–10 | Walk the six validation questions (card collapsible section) with the executive sponsor or proxy |
| 10–13 | Decide verdict: external ROI quote vs internal directional vs hold sponsor PDF |
| 13–15 | Copy validation notes to clipboard and populate one ledger row |

---

## When to use confidence tiers externally

| `roiEvidenceConfidence` | External use |
| --- | --- |
| **Strong** | May quote ROI framing **only when** execution mode is Real, dollar claims are sponsor-safe, and sendability is Sendable |
| **Partial** | Directional cycle-time / findings narrative only — no dollar savings unless buyer authorized |
| **Low** | Internal steering only — do not send sponsor PDF or quote savings |

Cross-check [`PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md) for conservative assumptions before any external excerpt.

---

## Populating the evidence ledger

1. Copy [`templates/paid-pilot-evidence-ledger.template.json`](templates/paid-pilot-evidence-ledger.template.json) to `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` (local; sanitize before commit).
2. Set `runId` and `executionMode` from the handoff card (Real / Simulator / Fallback / Mixed).
3. Map interview answers to ledger fields documented in [`PAID_PILOT_EVIDENCE_LEDGER.md`](PAID_PILOT_EVIDENCE_LEDGER.md):
   - `decisionChanged.*` — finding-driven decision shift
   - `baselineSourceConfidence.*` — buyer-reported vs model-default
   - `sponsorActionTaken.*` — observable action within 30 days
   - `conversionSignal.status` — annual order, deferred, declined, etc.
4. If a decision-delta interview was run, cross-ref [`../DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md).

---

## Stop rules (non-negotiable)

- **Do not quote USD savings** when `projectedDollarClaimsSponsorSafe` is **false**.
- **Do not send sponsor PDF** when execution mode is not Real (unless curated demo sample with explicit internal-only labeling).
- **Do not publish** when sponsor proof readiness is DemoOnly, Incomplete, or NotSendable.
- **Do not invent dollar figures** in the ledger — record buyer authorization in private notes only.
- When ROI confidence is **Low**, treat the pilot as **internal directional** regardless of findings count.

---

## Related surfaces

- Review detail sponsor handoff (`RunDetailSponsorBriefingSection`)
- [`/value-report/pilot`](../../../archlucid-ui/src/app/(operator)/value-report/pilot/) aggregate window (uses latest committed review in sample)
- First-run operator help: `/help/first-run`
