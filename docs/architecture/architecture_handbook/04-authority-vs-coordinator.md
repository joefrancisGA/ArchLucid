# 4. Authority vs legacy coordinator

Two mental models can produce a golden manifest. Always inspect `GET /v1/architecture/review/{runId}` before calling `execute` / `result` / `finalize`.

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
