> **Scope:** Buyer baseline capture for ArchLucid pilots — smallest pre-pilot question set for sponsor-safe ROI.

# Buyer baseline capture checklist

**Audience:** Pilot operator, buyer sponsor delegate, sales engineer at kickoff.  
**Last reviewed:** 2026-06-16

**Purpose:** Collect the **minimum** buyer-provided baselines so ROI narratives can use **PASS/WARN** disposition instead of **HOLD**. Defaults are allowed but must be labeled **low-confidence estimates**.

**Related:** [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) · [`ROI_MODEL.md`](ROI_MODEL.md) · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)

---

## When to use

Complete **before first sponsor export** when projected hours-saved or dollar ROI will appear in materials. Skip only when sponsor packet stays qualitative with **HOLD** ROI gate accepted.

---

## Pre-pilot questions (smallest set)

| # | Question | Field / store | Wording for sponsor materials |
| --- | --- | --- | --- |
| 1 | Median hours from architecture request to reviewable package today? | `reviewCycleHours` + source | "Buyer-reported baseline" or "Not collected — HOLD on % savings" |
| 2 | Architect prep hours per review (documentation, diagrams, narrative)? | `architectPrepHoursPerReview` | Label **defaulted** if team estimate |
| 3 | People involved per review cycle (optional)? | `peoplePerReview` | Context only — not a savings claim |
| 4 | Hours spent assembling evidence for ARB/governance last cycle? | `evidenceAssemblyEffort` | Strongest ROI lever when buyer-reported |
| 5 | Fully loaded architect hourly cost (optional for dollars)? | `architectHourlyCost` | Required for **projectedDollarClaimsSponsorSafe** |
| 6 | Baseline source | `buyer-reported` / `team-estimate` / `not-collected` | Always show source |
| 7 | Baseline freshness | Date captured | Stale >90d → WARN |

**Electronic capture:** Trial signup optional `baselineReviewCycleHours`; scorecard UI for full set — see [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §3.1.

---

## Sponsor-safe wording templates

### Buyer-reported (strongest)

> "Review-cycle baseline (**X hours**) was reported by the buyer on **YYYY-MM-DD**. Comparative figures below are directional planning estimates — not audited outcomes."

### Team estimate (partial)

> "Baseline hours (**X**) are an internal team estimate, not measured cycle time. Use qualitative time-saved language only unless ROI gate shows WARN with caveats."

### Defaulted / not collected (HOLD on dollars)

> "ROI baseline inputs were **not collected** or use product defaults. **Do not quote** hours-saved percentages, annualized ROI, or USD savings in sponsor materials."

---

## Operator checklist

| Step | Action | Done |
| --- | --- | --- |
| 1 | Schedule 15-min baseline call at pilot kickoff | ☐ |
| 2 | Record answers in scorecard (`/scorecard`) | ☐ |
| 3 | Confirm `projectedDollarClaimsSponsorSafe` only when buyer cost + hours are buyer-reported or approved estimate | ☐ |
| 4 | Re-run proof collection after baselines entered | ☐ |
| 5 | Verify first-value report ROI narrative gate ≠ HOLD before sponsor send | ☐ |

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-id>' -SponsorHandoff -FailOnHold
```

---

## Disposition quick reference

| Baseline posture | ROI narrative gate | Projected dollars |
| --- | --- | --- |
| All buyer-reported + strong confidence | PASS possible | Allowed with redaction |
| Mixed / defaulted fields | WARN | Directional only |
| Demo tenant or not collected | HOLD | **Not sponsor-safe** |

---

## Related

- [`ROI_BASELINE_SEND_POLICY.md`](ROI_BASELINE_SEND_POLICY.md)
