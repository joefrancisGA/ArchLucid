# 5. Async authority pipeline and outboxes

On SQL with `AsyncAuthorityPipeline` default-on and an evidence bundle present, pipeline work is enqueued in the **same transaction** as run create. The Worker completes stages via `CompleteQueuedAuthorityPipelineAsync`.

## Diagram

![ArchLucid async outbox path](../architecture_diagrams/archlucid-async-outbox-path.svg)

## Related outboxes

| Outbox | Purpose |
|--------|---------|
| Authority pipeline work | Durable stage execution after create |
| Retrieval indexing | Post-commit embedding / index (ADR 0004) |
| Cosmos graph snapshot | Async graph persistence when enabled (ADR 0038) |
| Integration events | Downstream / webhook fan-out |

Local opt-out: `AsyncAuthorityPipeline: false` in `appsettings.Advanced.json`. InMemory never queues.
