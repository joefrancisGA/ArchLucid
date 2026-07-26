> **Reviewed:** 2026-07-26

> **Scope:** Buyer-safe paid-pilot conversion evidence ledger — executive purchase proof, not customer-identifying proof — plus the 15-minute ROI validation session (formerly `PILOT_ROI_VALIDATION_SESSION.md`) and the decision-delta interview script (formerly `DECISION_DELTA_INTERVIEW.md`). Market-validation instrumentation only.

# Paid pilot evidence ledger

**Audience:** Founder / delivery lead after each paid pilot handoff and at monthly conversion review.  
**Last reviewed:** 2026-07-26

**Companion JSON:** [`templates/paid-pilot-evidence-ledger.template.json`](templates/paid-pilot-evidence-ledger.template.json)  
**Companion UI:** Pilot ROI validation handoff card on review detail and `/value-report/pilot`.  
**ROI model:** [`../../library/PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md)  
**Execution tracked as:** GTM backlog **M-37** / **M-45 (V1.1)** — populating rows requires completed paid pilots; this template is the V1 design half.

This ledger converts the ROI narrative into **observable executive purchase proof**: did the pilot change a decision, what did the sponsor do next, and did conversion or expansion signals appear? It includes the [ROI validation session](#pilot-roi-validation-session) and [decision-delta interview](#decision-delta-interview-paid-pilots), and complements the commercial conversion checklist and ROI baseline capture.

---

## When to file

| Trigger | Action | Storage (local; sanitize before commit) |
| --- | --- | --- |
| Sponsor proof pack sent on a **paid** SKU | Open one ledger row within **7 days** | `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` |
| ROI validation session complete | Populate ledger fields from handoff-card notes | Same folder |
| Decision-delta interview complete | Merge interview outcome into `decisionChanged` | Same folder + `decision-delta.md` cross-ref |
| Conversion status changes | Update row (new `recordedUtc`) | Append status history in private notes |
| Monthly review | Roll up sanitized aggregates | Commit summary only under [`../validation-runs/`](../validation-runs/) |

Copy the JSON template per pilot. Use a **sanitized `pilotLabel`** only (e.g. `regulated-analytics-2026Q3`) — never customer legal names in committed artifacts.

---

## Pilot ROI validation session

**Audience:** Operator or founder before external sponsor handoff on a paid pilot.  
**Purpose:** Convert persisted proof signals into **observable purchase proof** — did the pilot change a decision, and can ROI claims be quoted externally without overreach? Market validation only — not new ROI math.

### 15-minute agenda

| Minutes | Activity |
| --- | --- |
| 0–3 | Read persisted signals on the handoff card: ROI confidence, execution mode, sponsor-safe dollar gate, sendability |
| 3–10 | Walk the six validation questions (card collapsible section) with the executive sponsor or proxy |
| 10–13 | Decide verdict: external ROI quote vs internal directional vs hold sponsor PDF |
| 13–15 | Copy validation notes to clipboard and populate one ledger row |

### When to use confidence tiers externally

| `roiEvidenceConfidence` | External use |
| --- | --- |
| **Strong** | May quote ROI framing **only when** execution mode is Real, dollar claims are sponsor-safe, and sendability is Sendable |
| **Partial** | Directional cycle-time / findings narrative only — no dollar savings unless buyer authorized |
| **Low** | Internal steering only — do not send sponsor PDF or quote savings |

Cross-check [`PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md) for conservative assumptions before any external excerpt.

### Populating the evidence ledger from the session

1. Copy [`templates/paid-pilot-evidence-ledger.template.json`](templates/paid-pilot-evidence-ledger.template.json) to `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` (local; sanitize before commit).
2. Set `runId` and `executionMode` from the handoff card (Real / Simulator / Fallback / Mixed).
3. Map interview answers to ledger fields in this document:
   - `decisionChanged.*` — finding-driven decision shift
   - `baselineSourceConfidence.*` — buyer-reported vs model-default
   - `sponsorActionTaken.*` — observable action within 30 days
   - `conversionSignal.status` — annual order, deferred, declined, etc.
4. If a decision-delta interview was run, cross-ref [decision-delta interview](#decision-delta-interview-paid-pilots).

### Stop rules (non-negotiable)

- **Do not quote USD savings** when `projectedDollarClaimsSponsorSafe` is **false**.
- **Do not send sponsor PDF** when execution mode is not Real (unless curated demo sample with explicit internal-only labeling).
- **Do not publish** when sponsor proof readiness is DemoOnly, Incomplete, or NotSendable.
- **Do not invent dollar figures** in the ledger — record buyer authorization in private notes only.
- When ROI confidence is **Low**, treat the pilot as **internal directional** regardless of findings count.

### Related surfaces

- Review detail sponsor handoff (`RunDetailSponsorBriefingSection`)
- [`/value-report/pilot`](../../../archlucid-ui/src/app/(operator)/value-report/pilot/) aggregate window (uses latest finalized review in sample)
- First-run operator help: `/help/first-run`

---

## Required fields (per pilot row)

### 1. Pilot context

| Field | Rule |
| --- | --- |
| `pilotLabel` | Sanitized label — workload + quarter; no customer name |
| `runId` | Committed review run id (internal reference) |
| `executionMode` | `real`, `simulator`, or `mixed` — required on any external excerpt |
| `pilotContext.sku` | Align to [`SERVICE_LED_OFFERS.md`](../SERVICE_LED_OFFERS.md) SKU names |
| `pilotContext.workloadCategory` | e.g. `healthcare-claims`, `iot-edge` — category only |
| `pilotContext.evidenceBasis` | `buyer-azure`, `uploaded-evidence`, or `demo-workspace-accepted` |
| `pilotContext.sponsorRole` | Role title only (e.g. `VP Architecture`) — no name |

### 2. Baseline source confidence

How trustworthy are the ROI / cycle-time baselines cited in sponsor materials?

| `level` | When to use |
| --- | --- |
| **high** | Buyer-reported hours with documented source note |
| **medium** | Partial baseline (some fields buyer-reported, others estimated) |
| **low** | Mostly model-default or demo-derived labels |
| **not-collected** | Explicit waiver per [`paid-pilot-baseline.template.json`](../templates/paid-pilot-baseline.template.json) |

| `sources[]` | Pick all that apply: `buyer-reported`, `time-study`, `model-default`, `waived` |

Record `rationale` in one sentence. Do **not** commit dollar figures unless buyer authorized external use.

### 3. Decision changed (yes/no + why)

| Field | Rule |
| --- | --- |
| `decisionChanged.changed` | `true` only when ≥1 sponsor decision differs from counterfactual without ArchLucid |
| `decisionChanged.why` | One sentence — approval, deferral, scope change, or budget shift |
| `decisionChanged.findingIds[]` | Finding IDs that drove the change (no internal employee names) |
| `decisionChanged.decisionDeltaOutcome` | `pass`, `warn`, or `fail` per [decision-delta interview](#decision-delta-interview-paid-pilots) |
| `decisionChanged.attributionNote` | PASS requires attribution to a finding **not** in participant's manual AI pass |

### 4. Sponsor action taken

What did the sponsor **do** (not intend) within 30 days of handoff?

| `action` | Meaning |
| --- | --- |
| `none` | No observable action yet |
| `approved-with-conditions` | Approved architecture path with named conditions |
| `deferred-scope` | Deferred decision; scope parked |
| `requested-evidence-pack` | Moved to Evidence Pack SKU |
| `requested-arb-report` | Moved to ARB Report SKU |
| `initiated-annual-order` | Annual Professional / Enterprise order form started |
| `declined` | Explicit no-go |

`description`: one redacted sentence. `actionUtc`: date of observable action.

### 5. Conversion status

Single current status per row (update when it changes):

| Status | Meaning |
| --- | --- |
| `not-started` | Pilot not yet handed off |
| `in-pilot` | Active pilot; no sponsor send |
| `sponsor-sent` | Proof pack delivered; awaiting sponsor response |
| `evidence-pack-ordered` | Buyer selected Evidence Pack next step |
| `arb-report-ordered` | Buyer selected ARB Report next step |
| `annual-order-signed` | Annual order executed |
| `lost-deferred` | No conversion; buyer deferred or declined |

Map close-out steps from [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../COMMERCIAL_CONVERSION_CHECKLIST.md) §2–3.

### 6. Expansion signal

| `level` | Rule |
| --- | --- |
| **none** | No second workload, team, or budget discussion |
| **watch** | Verbal interest only — no concrete next step |
| **strong** | Named second workload, team expansion, or budget increase discussed with timeline |

`signals[]`: `second-workload`, `team-expansion`, `budget-increase`, `reference-willing` (permissioned reference only).

### 7. Blockers

`blockers[]` — record every blocker that prevented or delayed conversion. Empty array when none.

| `category` | Examples |
| --- | --- |
| `procurement` | Security review, legal, vendor onboarding |
| `soc2` | CPA attestation or trust-center gap (V1.1 backlog — do not score as V1 failure) |
| `finding-quality` | Sponsor did not trust findings enough to act |
| `pricing` | Price band mismatch |
| `connector-gap` | Workflow handoff tool missing (capture per [`GTM_BACKLOG.md`](../GTM_BACKLOG.md#closed-hold-decisions-owner) closed hold decisions) |
| `no-decision-change` | Outputs confirmatory only — no delta to act on |
| `champion-loss` | Sponsor or champion left |
| `other` | Named in `description` |

`deferralScope`: `v1`, `v1.1`, `v2`, or `b-procurement` — honest scope label, not a product defect claim.

---

## Redaction rules (mandatory)

| Allowed in committed artifacts | Never commit |
| --- | --- |
| Sanitized `pilotLabel`, workload category, SKU | Customer legal name, DBA, domain |
| Role titles, decision outcomes, status enums | Subscription IDs, tenant IDs, employee names |
| Aggregate conversion counts and blocker distributions | Unauthorized ROI dollar figures |
| Execution mode and evidence-basis labels | Raw infrastructure identifiers |

When in doubt, keep the full row in private founder storage and commit only the monthly rollup below.

---

## Monthly rollup (commit-safe)

After each month with ≥1 paid pilot handoff, file a sanitized summary at `validation-runs/paid-pilot-ledger-<YYYY-MM>.md`:

| Aggregate | Include |
| --- | --- |
| Pilots handed off | Count only |
| Decision-changed rate | `changed=true` / total |
| Conversion funnel | Count per `conversionStatus` |
| Top blockers | Top 3 `category` counts |
| Expansion signals | Count at `watch` + `strong` |
| Baseline confidence mix | Count per `level` |

No per-pilot quotes or names in the rollup.

---

## Decision-delta interview (paid pilots)

Founder-led interview template after a committed real-mode or labeled simulator review. Feeds `decisionChanged` on the ledger row (**M-45**).

**Also used by:** bakeoff sessions ([`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md)), service-led engagements ([`SERVICE_LED_OFFERS.md`](../SERVICE_LED_OFFERS.md)), dismissal interview reuse ([`PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md#dismissal-interview-script-head-to-head`](PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md#dismissal-interview-script-head-to-head)).

### When to run

Within **7 days** of sponsor PDF or proof-packet handoff on a **paid** Readiness Review / ARB Report SKU.

### Capture fields

| Field | Value |
| --- | --- |
| `runId` | |
| `findingIds[]` | Findings discussed |
| `interviewer` | |
| `participantTitle` | |
| `interviewDateUtc` | |

### Questions

1. **Counterfactual approval:** What would you have approved or deferred without ArchLucid on this packet?
2. **Changed priority:** Which finding changed severity, scope, or timeline because of ArchLucid output?
3. **Incorrect output:** Which finding was wrong or unsupported? (`findingId` + why)
4. **Frontier AI substitute:** Could Claude/GPT/Gemini on the same packet have produced an equivalent decision record? What would be missing?
5. **Repeat usage:** Will you run review #2 in ArchLucid? If no, what is the stop trigger?
6. **Budget:** Would you spend your own budget or recommend team budget? At what price band?

### Redaction rules (buyer-safe case study)

- Remove customer name, subscription IDs, and raw infrastructure identifiers unless permissioned.
- Keep **finding category + severity + decision outcome**; drop internal employee names unless quoted with approval.
- ROI numbers only when customer authorized external use (`<<QUOTE_APPROVAL_REFERENCE>>` pattern in reference-customer templates).
- Label execution mode (**Real / Simulator / Mixed**) on any exported excerpt.

### PASS / FAIL for decision advantage

| Outcome | Criteria |
| --- | --- |
| **PASS** | ≥1 documented decision change attributable to an ArchLucid finding not present in participant's manual AI pass |
| **WARN** | Outputs confirmatory only — still valuable for packaging/audit |
| **FAIL** | Participant would not run review #2; primary reason recorded |

Store summaries under `docs/go-to-market/validation-runs/` (local; do not commit customer-identifying content without permission). Merge outcomes into the per-pilot row above. Attach a buyer-safe [`DECISION_CHANGE_ADDENDUM.md`](DECISION_CHANGE_ADDENDUM.md) to the proof packet when decision delta is material.

---

## Related assets (do not duplicate)

| Asset | Role |
| --- | --- |
| [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../COMMERCIAL_CONVERSION_CHECKLIST.md) | Sponsor close-out sequence — feeds `conversionStatus` |
| [`templates/paid-pilot-baseline.template.json`](../templates/paid-pilot-baseline.template.json) | ROI baseline capture — feeds `baselineSourceConfidence` |
| [`DECISION_CHANGE_ADDENDUM.md`](DECISION_CHANGE_ADDENDUM.md) | Proof-packet addendum format from interview outcomes |
| [`PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md) | ROI framing and confidence boundaries |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-37** / **M-45** | Cohort execution + interview population (V1.1) |

Former standalone runbook: `docs/go-to-market/validation/PILOT_ROI_VALIDATION_SESSION.md` → this section.
