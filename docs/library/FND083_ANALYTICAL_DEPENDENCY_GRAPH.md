# FND-083 analytical dependency graph

Authority formerly described its checkpoint prerequisites in the recovery loop. SecureNow had a different list where an absent stage witness could look like an inapplicable branch. The shared planner validates each topology, traverses dependencies in order, and binds an exact witness for each required output. An unknown change invalidates the wider known graph. A missing prerequisite blocks its dependents, not the independent stages.

## Boundaries

| Pipeline | Registered graph | Publication boundary |
| --- | --- | --- |
| Authority | Context, graph, findings, then one decision/artifact/publication unit | Existing transaction rechecks the effective inputs and locks the exact upstream checkpoint references before atomically sealing and publishing. Agent handoff remains a separate idempotent side effect keyed by the published manifest. |
| SecureNow prelude | Scoped prior-snapshot selection and authorized diff/audit fan-out | The verified target, prior observation, diff, and applicable audit outputs bind the pinned plan. |
| SecureNow full | Privilege, reachability, toxic combination, capability-flow, shared-control, drift, ranking, cut points and routing | Exact output witnesses and upstream checkpoint references are rechecked before the scoped job receipt is completed. |
| SecureNow carry-forward | Verified compatible unchanged-capture source, then target drift, ranking, cut points and routing | The prior source stays immutable. The coordinator revalidates the source and current target before completing the receipt. |

Enabled stage versions bind the authorized project and execution ID, graph definition, effective local inputs, and exact upstream version, output, and fence. The fence prevents a replaced attempt from looking unchanged even if it returned the same output reference. The topology version changes with its declared edges. Unregistered stages and cycles do not get reusable versions. Inapplicable branches are excluded by the pinned branch definition. No iteration across graph stages is supported. An engine with internal iteration remains one bounded stage.

The planner reuses the existing FND-075 leases, deadlines and attempts and FND-076 exact input policy. It adds no API or database schema. Graph-protocol SecureNow stage checkpoints retain an exact output witness for scoped path/hop, ranking, cut-point, or routing data. Legacy stage payload and final job receipt shapes remain compatible. A stale or corrupt checkpoint does not prove completion. Authority may replan an unsealed run under its existing fences. SecureNow will not replace a pinned target plan in place. Start a fresh authorized target capture when a target plan becomes stale.

## Audit and recovery

An append-only `Analysis.DependencyCheckpointRecorded` event is committed with each new graph-bound successful checkpoint. It records the scoped execution, graph version, effective input witness, separately named input digests, upstream checkpoint witnesses, output witness, fence and disposition. Current attempts log stable decisions and reasons, including downstream blocks, without logging provider text or raw evidence. Existing stage failure and job status contracts remain authoritative for coverage reporting. A recompute cannot turn incomplete evidence into a clean result.

## Rollout and rollback

1. Keep the existing durable Authority/SecureNow and FND-076 dependency-aware settings scoped to the environment being evaluated. The two new flags default off.
2. Set `AnalysisExecution:ObserveAnalyticalDependencyGraph=true` in a scoped rehearsal. Compare `Decision` with `LegacyReuse` in `Analysis dependency decision` events. Shadow does not change the checkpoint digests, stage order or publication decisions.
3. Inspect full and carry-forward cases, a ranking-only change, partial evidence, dependency failures and redelivery. Confirm graph mode can verify all required artifacts and does not accidentally start a legacy neighborhood recompute.
4. Drain active analysis work before changing the active protocol. Enable `AnalysisExecution:EnableAnalyticalDependencyGraph` only for the intended deployment scope. For SecureNow, the selected protocol is pinned when the job is admitted; changing the flag does not reinterpret an existing admission on the same binary.
5. Roll back by disabling graph admission and draining graph work on compatible binaries. Retain checkpoint and audit history. Do not backfill witnesses for older results or overwrite completed snapshots.

## Deferred work

FND-084 adds independently verified semantic early stopping. FND-085 optimizes retention and storage. FND-086 validates narrower reuse for changed inventory and negative dependencies against full recomputation. FND-083 does not infer that a changed resource cannot create a new path. Changed or unverifiable inventory still uses the appropriate safe wider recompute or an explicit coverage failure.
