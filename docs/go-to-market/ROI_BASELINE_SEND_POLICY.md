> **Reviewed:** 2026-07-25

> **Scope:** Commercial SEND gating for ROI baseline completeness (Assessment Improvement 4), plus the pre-pilot buyer baseline capture checklist.

# ROI baseline SEND policy (V1)

**Last reviewed:** 2026-07-25

**Owner decision (2026-06-07):** Commercial **SEND** requires **COMPLETE** baseline completeness unless an approved override artifact is attached.

Machine-readable policy: [`scripts/ci/data/roi_baseline_send_policy.v1.json`](../../scripts/ci/data/roi_baseline_send_policy.v1.json).

**Human capture (kickoff):** [`#pre-pilot-baseline-capture-operator-checklist`](#pre-pilot-baseline-capture-operator-checklist).

## Baseline completeness statuses

| Status | Meaning | SEND allowed? |
| --- | --- | :---: |
| **COMPLETE** | Required baselines are sponsor-safe and non-defaulted | Yes (if other proof gates pass) |
| **PARTIAL** | Weak labels (e.g. `labeled-other`, `stale`) | No — override required |
| **DEFAULTED** | Scorecard/model defaults used | No — override required |
| **NOT_COLLECTED** | Missing, demo-derived, or explicit not-collected | No — override required |

## Minimum fields for SEND (non-defaulted)

These align with [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2 core metrics:

1. **Review cycle hours (baseline)** — wall-clock hours per review cycle.
2. **Architect hours per review (baseline)** — person-hours per review.
3. **ROI basis source** — `roiBasisStatus` must be one of:
   - `buyer-provided`
   - `uploaded-actual-or-amortized`
   - `azure-retail`
   - `classified`

**Documentation hours (baseline)** is recommended for ARB/annual conversations but **not blocking** for SEND.

When `roiBasisStatus` is in the complete set above, the proof pipeline treats required numeric baselines as collected via scorecard/proof posture (see `collect-first-pilot-proof.ps1`).

## Override authority and template

| Role | May approve override? |
| --- | :---: |
| **executive-owner** | Yes |
| **cfo-delegate** | Yes |
| **sales** / **pilot-operator** | Record only — cannot self-approve |

Place `roi-baseline-send-override.json` in the proof folder next to `go-no-go-summary.json`. Template: [`templates/roi-baseline-send-override.template.json`](templates/roi-baseline-send-override.template.json).

Required override fields:

- `approvedByRole` — `executive-owner` or `cfo-delegate`
- `recordedBy` — `sales` or `pilot-operator`
- `validForRunId` — must match proof `runId` when supplied
- `rationale` — at least 24 characters
- `acceptedRisk` — explicit claim boundary (e.g. no projected dollar ROI until baselines collected)

**Override does not clear:** proof `BLOCK` rows, `DEFERRED_SCOPE`, or procurement HOLD.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `roi-baseline-send-evaluation.json` | Machine-checked completeness + `sendEligible` |
| `quote-to-proof-readiness.json` | Includes `baselineCompletenessStatus` |
| `commercial-closeout.json` | Includes completeness + overrideApplied |

## Evaluate locally

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json `
  --strict-send
```

With override:

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --override-json artifacts/proof/roi-baseline-send-override.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json
```

## Pre-pilot baseline capture (operator checklist)

Collect the **minimum** buyer-provided baselines so ROI narratives can use **PASS/WARN** disposition instead of **HOLD**. Defaults are allowed but must be labeled **low-confidence estimates**.

**When to use:** Complete **before first sponsor export** when projected hours-saved or dollar ROI will appear in materials. Skip only when the sponsor packet stays qualitative with **HOLD** ROI gate accepted.

### Pre-pilot questions (smallest set)

| # | Question | Field / store | Wording for sponsor materials |
| --- | --- | --- | --- |
| 1 | Median hours from architecture request to reviewable package today? | `reviewCycleHours` + source | "Buyer-reported baseline" or "Not collected — HOLD on % savings" |
| 2 | Architect prep hours per review (documentation, diagrams, narrative)? | `architectPrepHoursPerReview` | Label **defaulted** if team estimate |
| 3 | People involved per review cycle (optional)? | `peoplePerReview` | Context only — not a savings claim |
| 4 | Hours spent assembling evidence for ARB/governance last cycle? | `evidenceAssemblyEffort` | Strongest ROI lever when buyer-reported |
| 5 | Fully loaded architect hourly cost (optional for dollars)? | `architectHourlyCost` | Required for **projectedDollarClaimsSponsorSafe** |
| 6 | Baseline source | `buyer-reported` / `team-estimate` / `not-collected` | Always show source |
| 7 | Baseline freshness | Date captured | Stale >90d → WARN |

**Electronic capture:** Trial signup optional `baselineReviewCycleHours`; scorecard UI for full set — see [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §3.1 and [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2.

### Sponsor-safe wording templates

**Buyer-reported (strongest)**

> "Review-cycle baseline (**X hours**) was reported by the buyer on **YYYY-MM-DD**. Comparative figures below are directional planning estimates — not audited outcomes."

**Team estimate (partial)**

> "Baseline hours (**X**) are an internal team estimate, not measured cycle time. Use qualitative time-saved language only unless ROI gate shows WARN with caveats."

**Defaulted / not collected (HOLD on dollars)**

> "ROI baseline inputs were **not collected** or use product defaults. **Do not quote** hours-saved percentages, annualized ROI, or USD savings in sponsor materials."

### Operator steps

| Step | Action | Done |
| --- | --- | --- |
| 1 | Schedule 15-min baseline call at pilot kickoff | ☐ |
| 2 | Copy [`paid-pilot-baseline.template.json`](templates/paid-pilot-baseline.template.json) to `artifacts/paid-pilot-baseline/<label>/baseline.json` | ☐ |
| 3 | Run `.\scripts\validate-paid-pilot-baseline-readiness.ps1 -BaselinePath <path> -StrictPaidPilot` | ☐ |
| 4 | Record answers in scorecard (`/scorecard`) when electronic capture is available | ☐ |
| 5 | Confirm `projectedDollarClaimsSponsorSafe` only when buyer cost + hours are buyer-reported or approved estimate | ☐ |
| 6 | Re-run proof collection after baselines entered | ☐ |
| 7 | Verify first-value report ROI narrative gate ≠ HOLD before sponsor send | ☐ |

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-id>' -SponsorHandoff -FailOnHold
```

### Disposition quick reference

| Baseline posture | ROI narrative gate | Projected dollars |
| --- | --- | --- |
| All buyer-reported + strong confidence | PASS possible | Allowed with redaction |
| Mixed / defaulted fields | WARN | Directional only |
| Demo tenant or not collected | HOLD | **Not sponsor-safe** |

---

## Related

- [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist)
- [`ROI_MODEL.md`](ROI_MODEL.md)
- [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md#readiness-checklist)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)
