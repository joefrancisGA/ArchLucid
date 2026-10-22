> **Scope:** TB-962 — owner-executed staging worker replica-kill drill. Agent prepares; owner runs in Azure.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# TB-962 — Staging ACA Worker replica-kill mid-execute drill

**Last updated:** 2026-08-14

## Objective

Prove Container Apps **replica death mid-execute** reaches an honest terminal status and does not re-bill persisted agents when a peer resumes — against the **TB-960** checklist.

Record results in [`WORKER_REPLICA_KILL_DRILL_RESULTS.md`](../quality/game-day-log/WORKER_REPLICA_KILL_DRILL_RESULTS.md).

## Preconditions

| Check | Notes |
| --- | --- |
| Staging Worker + API healthy | `GET /health/ready` 2xx |
| Execute ownership lease enabled | `RunExecuteOwnership` options on staging Worker |
| Drain handoff shipped | **TB-961** — rolling deploy releases leases |
| Long execute available | Demo run with multi-agent execute or injected sleep fixture |
| Owner notified | Maintenance window logged |

## Phase A — Preflight (10 min)

1. Note active Worker revision name and replica count (`az containerapp revision list`).
2. Start or identify a run in **Executing** with at least one agent already persisted.
3. Capture baseline: run status, agent result count, FinOps trace count, finalize gate state.

## Phase B — Kill replica mid-execute (15 min)

1. Identify the Worker replica holding the execute lease (App Insights / structured logs: `RunExecuteOwnership`).
2. Force replica restart:
   - Preferred: `az containerapp revision restart --name <worker-app> --resource-group <rg> --revision <revision>`
   - Alternate: scale Worker to zero briefly, then restore min replicas (document which path you used).
3. Wait for lease expiry + reconciliation (**TB-943** zombie path) or peer resume per **TB-961** drain semantics.

## Phase C — Assertions (TB-960 checklist)

| # | Assertion | Pass criteria |
| --- | --- | --- |
| 1 | Honest run status | `Recovering` / `In progress` → `Ready` **or** explicit partial / needs-attention — not silent success |
| 2 | No duplicate spend | Persisted successful agents not re-billed (trace / FinOps count stable) |
| 3 | Finalize blocked when incomplete | Finalize gate remains blocked if agents incomplete (**TB-937**) |
| 4 | Lease hygiene | Expired lease reconciled; no double-execute on same task (**TB-039**) |

## Phase D — Close-out

Append a row via:

```powershell
.\scripts\ops\append-worker-replica-kill-drill-results.ps1 `
  -Environment staging `
  -Revision "<revision>" `
  -Outcome pass `
  -Notes "All TB-960 assertions met" `
  -Apply
```

File follow-ups against **TB-943** / **TB-961** / **TB-039** for any failed assertion.

## Retry honesty after lease expiry (DR-06 / TB-943)

When reconciliation marks a run `Failed` or `FailedPartial` because the execute ownership lease expired:

- **Persisted** `(RunId, TaskId)` agent results are skipped on retry (**TB-039** / **TB-201**).
- **Unpersisted** in-flight LLM completions at kill time are **not** provider-idempotent — retry may **rebill** that spend.
- Do not claim zero duplicate spend or exactly-once LLM in buyer or PA copy; surface "worker lost — reopen or retry execute" instead.

## Related

- [`ACA_WORKER_LLM_FAILURE_SEMANTICS.md`](../operations/ACA_WORKER_LLM_FAILURE_SEMANTICS.md) (**TB-960**)
- [`WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md`](../library/WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md) (**TB-961**)
- Unit chaos (**TB-945**) — CI complement, not replacement

## Out of scope

Production chaos (**TB-914**). Full ACA automation deferred to a later batch.
