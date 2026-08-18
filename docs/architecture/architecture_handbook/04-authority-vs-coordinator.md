# 4. Authority vs legacy coordinator

Two mental models can produce a golden manifest. They are **not** the two product jobs in ADR 0067 (create vs review). They are two **finish paths** for a run: authority pipeline (review evaluation kernel) vs the four-agent coordinator (`IAgentExecutor` / misnamed `IReviewEngine`). Always inspect `GET /v1/architecture/review/{runId}` before calling `execute` / `result` / `finalize`.

## Diagram

![ArchLucid authority vs coordinator](../architecture_diagrams/archlucid-authority-vs-coordinator.svg)

## Rule of thumb

| Observation | Action |
|-------------|--------|
| Finalized architecture package present | Authority-complete — do not drive execute/result |
| `ContextSnapshotId` null + async pipeline | Wait for worker |
| AgentTasks in TasksGenerated / WaitingForResults | Legacy coordinator path |
| Neither | Diagnostics / transitional / failed |

Contract matrix: `docs/library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md` (TB-1007).
