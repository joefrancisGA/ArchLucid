> **Scope:** Zoom-in — Authority pipeline vs legacy coordinator path (decision tree).
> **Spine doc:** [`../../START_HERE.md`](../../START_HERE.md) · **Flows:** [`../../library/ARCHITECTURE_FLOWS.md`](../../library/ARCHITECTURE_FLOWS.md) Flow A1 · **Contract:** [`../../library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](../../library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md)

# ArchLucid — authority vs legacy coordinator

Two mental models can reach a golden manifest. **Always `GET /v1/architecture/review/{runId}` first** and pick one path — do not mix `execute`/`result` onto an authority-finalized run.

## Rendered

![ArchLucid authority vs coordinator](archlucid-authority-vs-coordinator.svg)

Editable source: [`archlucid-authority-vs-coordinator.mmd`](archlucid-authority-vs-coordinator.mmd)

## Mermaid source

```mermaid
flowchart TD
  A["Run exists after<br/>POST /v1/architecture/request"] --> B{"GET review/{runId}:<br/>architecture package /<br/>finalized authority fields?"}
  B -->|Yes| C["Authority-complete<br/>Do not drive execute/result<br/>Finalize may be idempotent"]
  B -->|No| D{"ContextSnapshotId null<br/>and AsyncAuthorityPipeline?"}
  D -->|Yes| E["Queued authority worker<br/>Wait for CompleteQueuedAuthorityPipeline<br/>Avoid execute until contract matches"]
  D -->|No| F{"AgentTasks exist and status<br/>TasksGenerated or WaitingForResults?"}
  F -->|Yes| G["Legacy coordinator path<br/>execute and/or result<br/>then finalize when ReadyForCommit"]
  F -->|No| H["Re-check run detail / diagnostics<br/>Transitional or failed"]

  subgraph authority["Authority mental model"]
    A1["Stages: ingest → graph → findings → decisioning → artifacts"]
    A2["One transactional finalize<br/>GoldenManifest + DecisionTrace"]
  end

  subgraph coordinator["Legacy coordinator mental model"]
    C1["AgentTask rows<br/>topology · cost · compliance · critic"]
    C2["POST …/execute and/or …/result"]
    C3["POST …/finalize when ReadyForCommit<br/>Merge four AgentResult types"]
  end

  C -.-> authority
  E -.-> authority
  G -.-> coordinator
```

## Anti-pattern

Calling `POST …/execute` or `POST …/result` to “finish” a run that **already completed the Authority pipeline** causes 409/400 confusion or idempotent finalize that does **not** re-run decisioning. Authority finalize and coordinator finalize have **different preconditions**.

## Further reading

- [`../../library/ARCHITECTURE_FLOWS.md`](../../library/ARCHITECTURE_FLOWS.md) — Flow A0 / A0b / A1
- [`../../library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](../../library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (TB-1007)
- [`archlucid-authority-pipeline.md`](archlucid-authority-pipeline.md) — diagram 1
