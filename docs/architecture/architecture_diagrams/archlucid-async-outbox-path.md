> **Scope:** Zoom-in — Async authority pipeline + transactional outbox (SQL queue mode).
> **Spine doc:** [`../../START_HERE.md`](../../START_HERE.md) · **ADR:** [`../adrs/0038-run-durability-multi-store-outbox-production-secrets.md`](../adrs/0038-run-durability-multi-store-outbox-production-secrets.md) · **Related:** [`../adrs/0004-transactional-outbox-retrieval-indexing.md`](../adrs/0004-transactional-outbox-retrieval-indexing.md)

# ArchLucid — async / outbox path

On **SQL** storage, when **`AsyncAuthorityPipeline`** is unset or enabled (default **on**) and an evidence-bundle id is present, pipeline work is **enqueued in the same transaction** as run create. The Worker drains the outbox and completes stages via **`CompleteQueuedAuthorityPipelineAsync`**. **InMemory** never queues.

## Rendered

![ArchLucid async outbox path](archlucid-async-outbox-path.svg)

Editable source: [`archlucid-async-outbox-path.mmd`](archlucid-async-outbox-path.mmd)

## Mermaid source

```mermaid
sequenceDiagram
  actor Client
  participant API as ArchLucid.Api
  participant SQL as SQL Server
  participant Outbox as Authority pipeline outbox
  participant Worker as ArchLucid.Worker
  participant Pipe as AuthorityPipelineStagesExecutor

  Client->>API: POST /v1/architecture/request<br/>(evidence bundle present)
  Note over API: AsyncAuthorityPipeline default ON<br/>StorageProvider=Sql
  API->>SQL: Begin TX — insert Run (+ header)
  API->>Outbox: EnqueueAsync (same TX)
  API->>SQL: Commit TX
  API-->>Client: runId (ContextSnapshotId may be null)

  Worker->>Outbox: Claim / drain work row
  Worker->>Pipe: CompleteQueuedAuthorityPipelineAsync
  Pipe->>SQL: Ingest → graph → findings → decisioning → artifacts
  Pipe->>SQL: FinalizeCommittedPipelineAsync<br/>GoldenManifest + DecisionTrace
  Pipe->>SQL: Retrieval / integration / Cosmos graph outboxes
  Worker-->>SQL: Mark pipeline outbox complete

  Client->>API: GET /v1/architecture/review/{runId}
  API-->>Client: Package · timeline · artifacts when ready
```

## Notes

| Concern | Behavior |
|---------|----------|
| Local inline runs | Set `AsyncAuthorityPipeline: false` in `appsettings.Advanced.json` |
| Reliability | Run insert + outbox row share one SQL transaction (ADR 0038) |
| Operator symptom | Temporary missing `ContextSnapshotId` until worker finishes |
| Related outboxes | Retrieval indexing (ADR 0004), Cosmos graph snapshot, integration events |

## Further reading

- [`../adrs/0038-run-durability-multi-store-outbox-production-secrets.md`](../adrs/0038-run-durability-multi-store-outbox-production-secrets.md)
- [`../../library/ORCHESTRATOR_RETRIES.md`](../../library/ORCHESTRATOR_RETRIES.md)
- [`../../library/BACKGROUND_JOB_CORRELATION.md`](../../library/BACKGROUND_JOB_CORRELATION.md)
- [`archlucid-authority-pipeline.md`](archlucid-authority-pipeline.md)
