> **Scope:** Buyer-safe paid-pilot conversion evidence ledger — executive purchase proof, not customer-identifying proof. Market-validation instrumentation only.

# Paid pilot evidence ledger

**Audience:** Founder / delivery lead after each paid pilot handoff and at monthly conversion review.  
**Companion JSON:** [`templates/paid-pilot-evidence-ledger.template.json`](templates/paid-pilot-evidence-ledger.template.json)  
**Execution tracked as:** GTM backlog **M-37 (V1.1)** — populating rows requires completed paid pilots; this template is the V1 design half.

This ledger converts the ROI narrative into **observable executive purchase proof**: did the pilot change a decision, what did the sponsor do next, and did conversion or expansion signals appear? It complements — does not replace — the decision-delta interview, commercial conversion checklist, and ROI baseline capture.

---

## When to file

| Trigger | Action | Storage (local; sanitize before commit) |
| --- | --- | --- |
| Sponsor proof pack sent on a **paid** SKU | Open one ledger row within **7 days** | `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` |
| Decision-delta interview complete | Merge interview outcome into `decisionChanged` | Same folder + `decision-delta.md` cross-ref |
| Conversion status changes | Update row (new `recordedUtc`) | Append status history in private notes |
| Monthly review | Roll up sanitized aggregates | Commit summary only under [`../validation-runs/`](../validation-runs/) |

Copy the JSON template per pilot. Use a **sanitized `pilotLabel`** only (e.g. `regulated-analytics-2026Q3`) — never customer legal names in committed artifacts.

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
| `decisionChanged.decisionDeltaOutcome` | `pass`, `warn`, or `fail` per [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) |
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

## Related assets (do not duplicate)

| Asset | Role |
| --- | --- |
| [`DECISION_DELTA_INTERVIEW.md`](../DECISION_DELTA_INTERVIEW.md) | Per-handoff interview — feeds `decisionChanged` (execution: **M-45**) |
| [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../COMMERCIAL_CONVERSION_CHECKLIST.md) | Sponsor close-out sequence — feeds `conversionStatus` |
| [`templates/paid-pilot-baseline.template.json`](../templates/paid-pilot-baseline.template.json) | ROI baseline capture — feeds `baselineSourceConfidence` |
| [`PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md) | ROI framing and confidence boundaries |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-37** | Cohort execution — populate ledger across ≥10 paid pilots (V1.1) |
