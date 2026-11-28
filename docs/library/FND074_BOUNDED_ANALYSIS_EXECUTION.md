> **Scope:** Contributor reference for the execution budgets and cancellation rules shared by Authority and SecureNow analysis. This does not describe provider rollback.

# FND-074 bounded analysis execution

The Authority pipeline and SecureNow Azure inventory analysis share a monotonic, cancellation-aware execution budget. Each stage gets the smaller of its configured limit and the overall time remaining. A stage that returns after its deadline cannot advance a dependent stage or publish overall success. Cancellation is cooperative. A provider that has already accepted a write cannot be rolled back by canceling its token.

## Stage inventory and ownership

| Entry point | Stages using the shared budget | Retry ownership and persisted work |
| --- | --- | --- |
| ArchLucid Authority, inline and queued | `authority.context_ingestion`, `authority.graph`, `authority.findings`, `authority.decisioning`, `authority.artifacts` | No stage replays. Existing transport retries still own their calls under the child token. Finalization checks the same run budget and transaction. Committed checkpoints remain reusable. Rolled-back stage outputs are not reported as successful. |
| SecureNow post-materialization | `securenow.prior_snapshot`, `securenow.diff`, `securenow.carry_forward`, `securenow.privilege`, `securenow.reachability`, `securenow.toxic`, `securenow.capability_flow`, `securenow.shared_control`, `securenow.drift`, `securenow.ranking`, `securenow.cut_point`, `securenow.routing` | Only the prior-snapshot lookup can replay, and only on a classified transient SQL command fault after connection open. The diff and its consumer stages share the parent diff cap. Failure of a bounded consumer does not trigger full recompute. Independently committed outputs remain available. |
| SecureNow neighborhood | `securenow.neighborhood.snapshot`, `securenow.neighborhood.carry_forward`, `securenow.privilege`, `securenow.reachability`, `securenow.toxic`, `securenow.neighborhood.audit` | Joins the existing analysis window when run from diff fan-out, and opens a new window for a standalone neighborhood request. It does not replay mutating engines. |

The full SecureNow run can still attempt independent privilege, reachability, capability flow and shared-control work when another independent stage fails and time remains. Incomplete privilege/reachability prevents toxic and drift analysis, and incomplete path-producing stages prevent aggregate ranking and routing. Cut-point analysis requires successful ranking. A successful materialized inventory remains successful even if downstream analysis fails. The materializer returns its analysis outcome separately and logs it against the snapshot ID.

## Configuration

| Setting | Default | Meaning |
| --- | --- | --- |
| Existing Authority `PipelineTimeout` | 5 minutes | Whole Authority pipeline window. Queued work uses the persisted run creation time, so waiting and redelivery do not create a new window. The existing disabled value still disables the overall timer, not stage limits. |
| `AnalysisExecution:DefaultStageTimeoutSeconds` | 180 | Default cap for a named stage. |
| `AnalysisExecution:StageTimeoutSeconds:<stage-name>` | Unset | Override a single stage cap without increasing the overall budget. |
| `AnalysisExecution:SecureNowRunTimeoutSeconds` | 900 | Whole SecureNow post-materialization or standalone neighborhood run window. |
| `AnalysisExecution:ReadMaxAttempts` | 2 | Includes the initial read. Applies only to explicitly opted-in replay-safe reads. |
| `AnalysisExecution:ReadInitialDelayMilliseconds` | 250 | FND-065 exponential backoff with jitter. A supplied Retry-After minimum is honored. A retry that cannot fit the remaining run and stage budgets is not scheduled. |

## Outcomes and rollout

Stage telemetry records the terminal outcome, attempt count and elapsed time. The Authority timeline retains `succeeded`, `failed` and `skipped` (checkpoint reuse), and migration 438 adds `timed_out`, `canceled`, `retry_exhausted` and `not_started`. The migration runs before workers write new values. The rollback refuses to invalidate existing timeline evidence. On an Authority rollback, failure rows are written best effort in a bounded cleanup window. Blocked stages do not overwrite a committed checkpoint. A terminal queued budget failure uses the existing dead-letter path rather than rerunning the pipeline.

Durable stage-level restart/resume for newly produced uncommitted work remains FND-075. Product-wide coverage reporting remains FND-077. Standalone engine APIs outside the coordinated Azure pipeline keep their current caller/transport timeouts.
