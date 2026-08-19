# Greenfield SQL commit read-after-write gap (2026-06-23)

## Symptom

Integration tests that POST `/v1/architecture/review/{runId}/execute` then immediately POST `/commit`
intermittently receive **409 Conflict**:

> Commit for run '{runId}' raced with another commit. The manifest could not be loaded yet; retry the request.

Observed on CI integration shards (TB-290/TB-291/TB-294/TB-295) under parallel SQL load.

## Product behavior

`AuthorityDrivenArchitectureRunCommitOrchestrator.CommitRunAsync` retries transient SQL errors and
reconciles concurrent commits. When a unique-key violation occurs and reconciliation cannot load the
manifest yet, it surfaces the 409 above after exhausting outer attempts (see
`ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs`).

Execute can return **200** and promote the run to `ReadyForCommit` before all commit-path reads
(snapshots, manifest finalization inserts) are durably visible — a **read-after-write consistency gap**
under load, not a test harness bug.

## Test-side mitigation (2026-06-23)

`GreenfieldCommittedRunReadinessPoll.WaitUntilRunManifestReadableForCommitAsync` polls
`GET /v1/architecture/review/{runId}` until:

- `Status == ReadyForCommit`, and
- `Results` contains at least one agent result (execute finished).

`CurrentManifestVersion` is **not** populated until after commit succeeds; requiring it before commit always fails.

`ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync` calls this gate
**before** the commit retry loop so all greenfield SQL integration call sites benefit. On 409 responses whose
detail mentions manifest load races, the helper re-polls this gate, checks for idempotent `Committed` state,
and retries up to **25** attempts with backoff capped at **8s**.

## Product mitigation (2026-06-23)

`AuthorityDrivenArchitectureRunCommitOrchestrator` polls manifest reconciliation up to **8** times per
unique-key violation (150ms–1200ms backoff) across **12** outer attempts before surfacing the 409
manifest-load conflict.

## Remaining follow-up

Consider making `/execute` completion or `/commit` idempotency block until commit prerequisites are
durable (snapshot rows + manifest version readable) instead of relying on reconciliation polling.
