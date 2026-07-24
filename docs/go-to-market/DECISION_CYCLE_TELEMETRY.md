> **Scope:** Lightweight decision-cycle telemetry for demo/pilot → commercial next-step learning — local artifacts only.

# Decision-cycle telemetry

**Audience:** GTM, pilot architects, release owner  
**Last reviewed:** 2026-06-15

## Purpose

Track milestone timestamps from **demo complete** through **next-step decision** without CRM integration. Summaries expose cohort medians and outlier thresholds to prioritize roadmap work that improves deal motion.

## Canonical milestones

| Event type | Meaning |
| --- | --- |
| `demo_complete` | Curated demo or CTO walkthrough finished |
| `pilot_start` | Tenant/environment provisioned for pilot work |
| `first_committed_run` | First architecture-package finalize captured (API: golden manifest commit; event name unchanged) |
| `sponsor_packet_sent` | Sponsor-facing packet shared (only when SEND-eligible) |
| `next_step_decision` | Commercial outcome recorded (`advance`, `hold`, `decline`, `unknown`) |

Template: [`templates/decision-cycle-events.template.json`](templates/decision-cycle-events.template.json)

## Capture format

Schema: `archlucid.decision-cycle-telemetry.v1`

Store one JSON file per account under `artifacts/decision-cycle/<account>/events.json` or maintain a combined log. Use pseudonymous `accountLabel` values — no PII required.

## Build summary report

```powershell
python scripts/ci/build_decision_cycle_telemetry.py `
  --events-json docs/go-to-market/templates/decision-cycle-events.template.json `
  --json-out artifacts/decision-cycle/sample-summary.json `
  --markdown-out artifacts/decision-cycle/sample-summary.md
```

## Interpreting delay hotspots

- Compare per-account segment durations to cohort medians in the summary JSON.
- Segments above **2× median** are flagged as outlier thresholds in `outlierThresholdsHours`.
- Missing milestones mean the journey is incomplete — do not infer velocity from partial data.

## Roadmap prioritization

| Hotspot segment | Typical remediation focus |
| --- | --- |
| Demo → pilot start | Procurement / environment prerequisites |
| Pilot start → first finalize | First-hour architect friction (see `FIRST_HOUR_OPERATOR_PATH.md`) |
| First commit → sponsor send | Proof packet / ROI baseline SEND gates |
| Sponsor send → decision | Executive value narrative and faithfulness guardrails |

## Cross-refs

- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md)
