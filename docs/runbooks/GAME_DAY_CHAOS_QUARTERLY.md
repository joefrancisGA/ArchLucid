> **Scope:** Quarterly game day for Simmy-backed chaos tests — pre-flight, blast radius, abort criteria, metrics, RACI stub. Complements `.github/workflows/simmy-chaos-scheduled.yml`.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Quarterly game day — Simmy chaos coverage

## Objective

Run the scheduled Simmy chaos suite under controlled conditions, capture outcomes, and file follow-ups before reliability debt accumulates.

## Pre-flight checklist

- [ ] Confirm target **environment** is **staging** (default) unless item 16+ owner approval exists for production fault injection (`docs/PENDING_QUESTIONS.md`).
- [ ] Verify circuit breaker dashboards and alert routes are healthy.
- [ ] Confirm **dry-run** mode when only validating workflow wiring (no `dotnet test` execution).
- [ ] Notify on-call (calendar + Slack) with **start / end window** and rollback owner.

## Blast radius limits

- **Staging:** full Simmy filter (`Simmy|Chaos`) on `ArchLucid.AgentRuntime.Tests` and `ArchLucid.Persistence.Tests`.
- **Production:** _Not default._ Requires explicit product + customer comms + SLO owner sign-off (see PENDING_QUESTIONS).

## Abort criteria

- Any unexpected **data mutation** outside disposable fixtures → stop and restore from snapshot.
- **Sustained error rate** on golden cohort or API synthetic probe above agreed threshold → stop and open incident.
- **RLS / security** anomalies (deny-by-default violations) → immediate stop; no continuation "to finish the game day".

## Post-run metrics to capture

- Test job wall time; failed test names (from TRX artifacts).
- OpenTelemetry: LLM retry and circuit-breaker counters (`archlucid_circuit_breaker_*`, `archlucid_llm_call_retries_total`) for the window.
- SQL: blocking duration sample (read-only query) if persistence chaos ran.

## RACI (stub)

| Role | Responsibility |
|------|------------------|
| **Driver** | Executes workflow_dispatch, collects artifacts |
| **Observer** | Confirms blast radius; calls abort if limits exceeded |
| **Owner** | Approves production chaos (if ever in scope) |

## Artifact policy

- **Preferred:** GitHub Actions **artifacts** (`chaos-test-results` bundle) attached to the workflow run.
- **Optional log file:** If branch protection allows bot commits, append `docs/quality/game-day-log/YYYY-MM-DD.md` with a short summary + link to the run URL. Otherwise paste the link into the quarterly reliability retro notes only.

## Workflow

Use **Actions → Simmy chaos (scheduled) → Run workflow** with inputs:

- `scenario_id` — free-text label recorded in the job summary.
- `environment` — `staging` (default) or `production` (owner-gated).
- `dry_run` — `true` to skip `dotnet test` (smoke the job only).
