> **Reviewed:** 2026-07-25

> **Scope:** Landing folder for completed validation-run summaries (decision-delta interviews, blind cohort rollups). Market-validation evidence only — not product claims, not customer proof.

# Validation runs

This folder is the **commit-safe** home for **sanitized** summaries of validation activity that reduces *market* uncertainty (not design uncertainty):

- Blind principal-architect cohort rollups.
- Decision-delta interview summaries from paid pilots.
- Paid-pilot conversion evidence ledger rollups (monthly aggregates).
- First-non-obvious-moment and dismissal-trigger aggregates.

It exists because [`../validation/PAID_PILOT_EVIDENCE_LEDGER.md`](../validation/PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) and the cohort playbook point here for stored summaries.

## What belongs here

| Allowed (commit) | Not allowed (store outside repo) |
| --- | --- |
| Aggregate N/X/reuse counts, means, pass/fail verdicts | Customer names, subscription IDs, raw infrastructure identifiers |
| Execution-mode and evidence-basis labels | Participant identities and verbatim quotes (unless permissioned) |
| Pre-registered thresholds and session slot status | Any demo-derived number presented as customer proof |

## How to run a cohort

Do **not** re-create protocol assets — they already exist:

- Operating checklist: [`../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-cohort-operating-checklist)
- Scorecard: [`../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#session-scorecard`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#session-scorecard)
- Blind protocol: [`../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation)
- Pre-registered tracker (fill this before scoring): [`BLIND_DECISION_DELTA_COHORT_TRACKER.md`](BLIND_DECISION_DELTA_COHORT_TRACKER.md)
- Per-session dismissal capture + weekly triage: [`../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-dismissal-log`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-dismissal-log) (alias: [`../validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](../validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md))
- Paid-pilot conversion ledger (per-row + monthly rollup): [`../validation/PAID_PILOT_EVIDENCE_LEDGER.md`](../validation/PAID_PILOT_EVIDENCE_LEDGER.md)
- Decision-change addendum (sponsor handoff): [`../validation/PAID_PILOT_EVIDENCE_LEDGER.md#decision-change-addendum`](../validation/PAID_PILOT_EVIDENCE_LEDGER.md#decision-change-addendum)
- Frontier-AI counterfactual cadence rollups: [`../FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](../FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md#maintenance-cadence)

## Guardrail

A summary may be committed here **only after** it has been sanitized per the table above. When in doubt, keep it in private founder storage and commit only the aggregate verdict.
